"use client";

import { useState } from "react";
import styles from "../admin.module.css";

interface Option {
  code: string;
  label: string | null;
}

/**
 * The filters of the Questionnaire page, tied to each other (asked by Olivia,
 * 2026-10-08): a sector narrows the types and services to its own, a type
 * selects its sector and narrows the services to those it offers, a service
 * keeps the sector and type only if they offer it (and selects its sector
 * when it has only one). An establishment selects its sector and type, and
 * narrows the services to its own; choosing another sector, type or service
 * it does not offer clears it. Plain selects in a GET form: without JavaScript they still work,
 * the server narrows the types on « Afficher ».
 */
export function QuestionnaireFilters({
  sectors,
  types,
  services,
  establishments,
  sector: initialSector,
  type: initialType,
  service: initialService,
  establishment: initialEstablishment,
  text,
}: {
  sectors: Option[];
  types: (Option & { sectorCode: string })[];
  services: (Option & { sectorCodes: string[]; typeCodes: string[] })[];
  establishments: { id: string; name: string; sectorCode: string | null; typeCode: string | null; services: string[] }[];
  sector: string | null;
  type: string | null;
  service: string | null;
  establishment: string | null;
  text: { sector: string; type: string; service: string; establishment: string; all: string };
}) {
  const [sector, setSector] = useState(initialSector ?? "");
  const [type, setType] = useState(initialType ?? "");
  const [service, setService] = useState(initialService ?? "");
  const [establishment, setEstablishment] = useState(initialEstablishment ?? "");
  const serviceOf = (code: string) => services.find((s) => s.code === code);
  const chosen = establishments.find((e) => e.id === establishment);

  const chooseEstablishment = (id: string) => {
    setEstablishment(id);
    const picked = establishments.find((e) => e.id === id);
    if (!picked) return;
    setSector(picked.sectorCode ?? "");
    setType(picked.typeCode ?? "");
    if (!picked.services.includes(service)) setService("");
  };
  const chooseSector = (code: string) => {
    setSector(code);
    if (chosen && chosen.sectorCode !== code) setEstablishment("");
    // A type or a service of another sector no longer fits.
    if (code && types.find((t) => t.code === type)?.sectorCode !== code) setType("");
    if (code && !serviceOf(service)?.sectorCodes.includes(code)) setService("");
  };
  const chooseType = (code: string) => {
    setType(code);
    if (chosen && chosen.typeCode !== code) setEstablishment("");
    const owner = types.find((t) => t.code === code)?.sectorCode;
    if (owner) setSector(owner);
    // A service this type does not offer no longer fits.
    if (code && !serviceOf(service)?.typeCodes.includes(code)) setService("");
  };
  const chooseService = (code: string) => {
    setService(code);
    if (chosen) {
      // The establishment's own services only: its sector and type stay.
      if (code && !chosen.services.includes(code)) setEstablishment("");
      else return;
    }
    const picked = serviceOf(code);
    if (!picked) return;
    if (picked.sectorCodes.length === 1) setSector(picked.sectorCodes[0]!);
    else if (sector && !picked.sectorCodes.includes(sector)) setSector("");
    if (type && !picked.typeCodes.includes(type)) setType("");
  };

  return (
    <>
      <label>
        <strong>{text.sector}</strong>
        <code>sector.code</code>
        <select name="secteur" value={sector} onChange={(e) => chooseSector(e.target.value)} className={styles.input}>
          <option value="">{text.all}</option>
          {sectors.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label ?? s.code}
            </option>
          ))}
        </select>
      </label>
      <label>
        <strong>{text.type}</strong>
        <code>establishment_type.code</code>
        <select name="type" value={type} onChange={(e) => chooseType(e.target.value)} className={styles.input}>
          <option value="">{text.all}</option>
          {sectors
            .filter((s) => !sector || s.code === sector)
            .map((s) => {
              const own = types.filter((t) => t.sectorCode === s.code);
              return (
                own.length > 0 && (
                  <optgroup key={s.code} label={s.label ?? s.code}>
                    {own.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label ?? t.code}
                      </option>
                    ))}
                  </optgroup>
                )
              );
            })}
        </select>
      </label>
      <label>
        <strong>{text.establishment}</strong>
        <code>establishment.id</code>
        <select
          name="etablissement"
          value={establishment}
          onChange={(e) => chooseEstablishment(e.target.value)}
          className={styles.input}
        >
          <option value="">{text.all}</option>
          {establishments
            .filter(
              (e) =>
                e.id === establishment ||
                ((!sector || e.sectorCode === sector) && (!type || e.typeCode === type) && (!service || e.services.includes(service))),
            )
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        <strong>{text.service}</strong>
        <code>service.code</code>
        <select name="service" value={service} onChange={(e) => chooseService(e.target.value)} className={styles.input}>
          <option value="">{text.all}</option>
          {services
            .filter((sv) =>
              chosen
                ? chosen.services.includes(sv.code)
                : (!sector || sv.sectorCodes.includes(sector)) && (!type || sv.typeCodes.includes(type)),
            )
            .map((sv) => (
              <option key={sv.code} value={sv.code}>
                {sv.label ?? sv.code}
              </option>
            ))}
        </select>
      </label>
    </>
  );
}
