/**
 * Data access for the QR codes of the back-office (asked by Olivia,
 * 2026-10-10): find a place or an organisation, its codes, new codes,
 * switch a code off or on, and what a poster prints.
 */
import { query } from "./client";

export interface QrSearchResult {
  organizations: { code: string; name: string; sites: number }[];
  /** Places only: an « in general » establishment never gets a QR code. */
  establishments: { id: string; name: string; organizationName: string | null; municipality: string | null; codes: number }[];
}

/** Active organisations and places whose name contains every word typed. */
export async function searchQrTargets(text: string, limit: number): Promise<QrSearchResult> {
  const organizations = await query<QrSearchResult["organizations"][number]>(
    `SELECT o.code, o.name,
            (SELECT count(*)::int FROM establishment e
             WHERE e.organization_id = o.id AND e.scope = 'site' AND e.status = 'active') AS sites
     FROM organization o
     WHERE (SELECT bool_and(normalize_search(o.name || ' ' || coalesce(o.full_name, '') || ' ' || o.code)
                              LIKE '%' || w || '%')
            FROM unnest(string_to_array(normalize_search($1), ' ')) w)
     ORDER BY o.name
     LIMIT $2`,
    [text, limit],
  );
  const establishments = await query<QrSearchResult["establishments"][number]>(
    `SELECT e.id, e.name, o.name AS "organizationName", coalesce(m.name, e.municipality_input) AS municipality,
            (SELECT count(*)::int FROM qr_code q WHERE q.establishment_id = e.id AND q.is_active) AS codes
     FROM establishment e
     LEFT JOIN organization o ON o.id = e.organization_id
     LEFT JOIN municipality m ON m.id = e.municipality_id
     WHERE e.status = 'active' AND e.scope = 'site'
       AND (SELECT bool_and(e.search_text || ' ' || normalize_search(coalesce(o.name, '') || ' ' || coalesce(m.name, ''))
                              LIKE '%' || w || '%')
            FROM unnest(string_to_array(normalize_search($1), ' ')) w)
     ORDER BY e.name
     LIMIT $2`,
    [text, limit],
  );
  return { organizations, establishments };
}

export interface QrCodeRow {
  id: string;
  code: string;
  serviceLabel: string | null;
  locationLabel: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface QrEstablishment {
  id: string;
  name: string;
  organizationCode: string | null;
  organizationName: string | null;
  municipality: string | null;
  /** The services offered at screen 1, to print one code per counter. */
  services: { id: number; label: string }[];
  codes: QrCodeRow[];
}

/** An active place with its codes, newest first; null for an « in general » or inactive one. */
export async function findQrEstablishment(id: string): Promise<QrEstablishment | null> {
  const rows = await query<Omit<QrEstablishment, "codes">>(
    `SELECT e.id, e.name, o.code AS "organizationCode", o.name AS "organizationName",
            coalesce(m.name, e.municipality_input) AS municipality,
            coalesce((SELECT json_agg(json_build_object('id', s.id, 'label', coalesce(st.label, s.code)) ORDER BY st.label)
                      FROM establishment_offer eo
                      JOIN service s ON s.id = eo.service_id
                      LEFT JOIN service_translation st ON st.service_id = s.id AND st.language = 'fr'
                      WHERE eo.establishment_id = e.id), '[]') AS services
     FROM establishment e
     LEFT JOIN organization o ON o.id = e.organization_id
     LEFT JOIN municipality m ON m.id = e.municipality_id
     WHERE e.id = $1 AND e.status = 'active' AND e.scope = 'site'`,
    [id],
  );
  if (!rows[0]) return null;
  const codes = await query<QrCodeRow>(
    `SELECT q.id, q.code, st.label AS "serviceLabel", q.location_label AS "locationLabel",
            q.is_active AS "isActive", q.created_at AS "createdAt"
     FROM qr_code q
     LEFT JOIN service_translation st ON st.service_id = q.service_id AND st.language = 'fr'
     WHERE q.establishment_id = $1
     ORDER BY q.is_active DESC, q.created_at DESC, q.code`,
    [id],
  );
  return { ...rows[0], codes };
}

export interface QrOrganization {
  code: string;
  name: string;
  /** Its active places, by town then name. */
  sites: { id: string; name: string; municipality: string | null; activeCodes: string[] }[];
}

export async function findQrOrganization(code: string): Promise<QrOrganization | null> {
  const rows = await query<{ id: number; code: string; name: string }>(
    `SELECT id, code, name FROM organization WHERE code = $1`,
    [code],
  );
  const organization = rows[0];
  if (!organization) return null;
  const sites = await query<QrOrganization["sites"][number]>(
    `SELECT e.id, e.name, coalesce(m.name, e.municipality_input) AS municipality,
            coalesce((SELECT array_agg(q.code ORDER BY q.created_at, q.code) FROM qr_code q
                      WHERE q.establishment_id = e.id AND q.is_active), '{}') AS "activeCodes"
     FROM establishment e
     LEFT JOIN municipality m ON m.id = e.municipality_id
     WHERE e.organization_id = $1 AND e.scope = 'site' AND e.status = 'active'
     ORDER BY normalize_search(coalesce(m.name, e.municipality_input, e.name)), e.name`,
    [organization.id],
  );
  return { code: organization.code, name: organization.name, sites };
}

/**
 * A new place of an organisation, active at once (added by the team, not by a
 * user): « Organisation – place », with the type and sector of the
 * organisation « in general », and the municipality when the place names one.
 * A place already known by that name is not added twice. Returns its id, or
 * null when the organisation has no « in general ».
 */
export async function insertOrganizationSite(organizationCode: string, place: string): Promise<string | null> {
  const known = await query<{ id: string }>(
    `SELECT e.id FROM establishment e
     JOIN organization o ON o.id = e.organization_id
     WHERE o.code = $1 AND e.scope = 'site' AND e.status IN ('active', 'pending_review')
       AND normalize_search(e.name) = normalize_search(o.name || ' ' || $2)
     ORDER BY e.status = 'active' DESC
     LIMIT 1`,
    [organizationCode, place],
  );
  if (known[0]) return known[0].id;
  const rows = await query<{ id: string }>(
    `INSERT INTO establishment (name, organization_id, scope, sector_id, type_id, municipality_id,
                                municipality_input, status, source)
     SELECT o.name || ' – ' || $2, o.id, 'site', g.sector_id, g.type_id, m.id,
            CASE WHEN m.id IS NULL THEN $2 END, 'active', 'registry'
     FROM organization o
     JOIN establishment g ON g.organization_id = o.id AND g.scope = 'general' AND g.status = 'active'
     LEFT JOIN LATERAL (SELECT id FROM municipality WHERE normalize_search(name) = normalize_search($2) LIMIT 1) m ON true
     WHERE o.code = $1
     LIMIT 1
     RETURNING id`,
    [organizationCode, place],
  );
  return rows[0]?.id ?? null;
}

/**
 * A new code for an active place. The service must be one the place offers.
 * Returns false when the code is already taken (draw another one).
 */
export async function insertQrCode(input: {
  code: string;
  establishmentId: string;
  serviceId: number | null;
  locationLabel: string | null;
}): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO qr_code (code, establishment_id, service_id, location_label)
     SELECT $1, e.id, $3, $4
     FROM establishment e
     WHERE e.id = $2 AND e.status = 'active' AND e.scope = 'site'
       AND ($3::int IS NULL OR EXISTS (SELECT 1 FROM establishment_offer eo
                                      WHERE eo.establishment_id = e.id AND eo.service_id = $3))
     ON CONFLICT (code) DO NOTHING
     RETURNING id`,
    [input.code, input.establishmentId, input.serviceId, input.locationLabel],
  );
  return rows.length > 0;
}

/** Whether the code can be added: an active place, offering the service. */
export async function canHaveQrCode(establishmentId: string, serviceId: number | null): Promise<boolean> {
  const rows = await query<{ ok: boolean }>(
    `SELECT true AS ok FROM establishment e
     WHERE e.id = $1 AND e.status = 'active' AND e.scope = 'site'
       AND ($2::int IS NULL OR EXISTS (SELECT 1 FROM establishment_offer eo
                                      WHERE eo.establishment_id = e.id AND eo.service_id = $2))`,
    [establishmentId, serviceId],
  );
  return rows.length > 0;
}

/** Switched off, a code shows « Ce QR code n'est plus actif »; never deleted (feedbacks keep it). */
export async function setQrCodeActive(code: string, active: boolean): Promise<string | null> {
  const rows = await query<{ establishment_id: string }>(
    `UPDATE qr_code SET is_active = $2 WHERE code = $1 RETURNING establishment_id`,
    [code, active],
  );
  return rows[0]?.establishment_id ?? null;
}

export interface QrPoster {
  code: string;
  establishmentName: string;
  organizationName: string | null;
  municipality: string | null;
  serviceLabel: string | null;
  locationLabel: string | null;
}

/** What the posters of these codes print, in the order asked; inactive codes left out. */
export async function listQrPosters(codes: string[]): Promise<QrPoster[]> {
  return query<QrPoster>(
    `SELECT q.code, e.name AS "establishmentName", o.name AS "organizationName",
            coalesce(m.name, e.municipality_input) AS municipality,
            st.label AS "serviceLabel", q.location_label AS "locationLabel"
     FROM unnest($1::text[]) WITH ORDINALITY AS asked (code, position)
     JOIN qr_code q ON q.code = asked.code AND q.is_active
     JOIN establishment e ON e.id = q.establishment_id
     LEFT JOIN organization o ON o.id = e.organization_id
     LEFT JOIN municipality m ON m.id = e.municipality_id
     LEFT JOIN service_translation st ON st.service_id = q.service_id AND st.language = 'fr'
     ORDER BY asked.position`,
    [codes],
  );
}
