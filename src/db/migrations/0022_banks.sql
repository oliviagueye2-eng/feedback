-- The 29 banks approved in Senegal (list pasted by Olivia, 2026-10-05; names
-- validated the same day): each one an organisation with its establishment
-- « in general », like CBAO, UBA and Société Générale already are. The name
-- shown is the short one people use; the official name and the former names
-- are searched through the aliases. The six branches of foreign banks
-- (« succursale du Sénégal ») are listed like the others. The approval code
-- (K 0191 X…) is not kept: it means nothing to the user. Agencies will come
-- later, bank by bank. Former names « ex-CNCAS » and « ex-BICIS » are from
-- memory, not checked against an official source.

INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM (VALUES
  ('AFRIKA_BANQUE', 'Afrika Banque', 'Afrika Banque Sénégal'),
  ('ABS', 'ABS', 'Algerian Bank of Senegal'),
  ('BOA', 'Bank of Africa', 'Bank of Africa - Sénégal'),
  ('BANQUE_ATLANTIQUE', 'Banque Atlantique', 'Banque Atlantique Sénégal'),
  ('BHS', 'BHS', 'Banque de l''Habitat du Sénégal'),
  ('BIMAO', 'BIMAO', 'Banque des institutions mutualistes d''Afrique de l''Ouest'),
  ('BIS', 'BIS', 'Banque islamique du Sénégal'),
  ('BNDE', 'BNDE', 'Banque nationale pour le développement économique'),
  ('BRM', 'BRM', 'Banque régionale de marchés'),
  ('BSIC', 'BSIC', 'Banque sahélo-saharienne pour l''investissement et le commerce - Sénégal'),
  ('BGFIBANK', 'BGFIBank', 'BGFIBank Sénégal'),
  ('CITIBANK', 'Citibank', 'Citibank Sénégal'),
  ('CORIS_BANK', 'Coris Bank', 'Coris Bank International - Sénégal'),
  ('CREDIT_DU_SENEGAL', 'Crédit du Sénégal', NULL),
  ('CREDIT_INTERNATIONAL', 'Crédit International', NULL),
  ('ECOBANK', 'Ecobank', 'Ecobank Sénégal'),
  ('FBNBANK', 'FBNBank', 'FBNBank Sénégal'),
  ('LBA', 'La Banque Agricole', NULL),
  ('LBO', 'La Banque Outarde', NULL),
  ('SUNU_BANK', 'Sunu Bank', 'Sunu Bank Sénégal'),
  ('BDM', 'BDM', 'Banque de développement du Mali, succursale du Sénégal'),
  ('BCI_MALI', 'BCI Mali', 'Banque pour le commerce et l''industrie du Mali, succursale du Sénégal'),
  ('BRIDGE_BANK', 'Bridge Bank', 'Bridge Bank Group Côte d''Ivoire, succursale du Sénégal'),
  ('NSIA_BANQUE', 'NSIA Banque', 'NSIA Banque Bénin, succursale du Sénégal'),
  ('ORABANK', 'Orabank', 'Orabank Côte d''Ivoire, succursale du Sénégal'),
  ('ORANGE_BANK', 'Orange Bank Africa', 'Orange Bank Africa, succursale du Sénégal')
) AS v (code, name, full_name)
JOIN sector s ON s.code = 'BANKING_INSURANCE';

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases::text[], o.id, 'general', o.sector_id
FROM (VALUES
  ('AFRIKA_BANQUE', '{Afrika Banque Sénégal,banque}'),
  ('ABS', '{Algerian Bank of Senegal,banque}'),
  ('BOA', '{BOA,BOA Sénégal,banque}'),
  ('BANQUE_ATLANTIQUE', '{Banque Atlantique Sénégal,banque}'),
  ('BHS', '{Banque de l''Habitat du Sénégal,banque}'),
  ('BIMAO', '{Banque des institutions mutualistes d''Afrique de l''Ouest,banque}'),
  ('BIS', '{Banque islamique du Sénégal,banque}'),
  ('BNDE', '{Banque nationale pour le développement économique,banque}'),
  ('BRM', '{Banque régionale de marchés,banque}'),
  ('BSIC', '{BSIC Sénégal,Banque sahélo-saharienne pour l''investissement et le commerce,banque}'),
  ('BGFIBANK', '{BGFIBank Sénégal,BGFI,banque}'),
  ('CITIBANK', '{Citibank Sénégal,Citi,banque}'),
  ('CORIS_BANK', '{CBI Sénégal,Coris Bank International,banque}'),
  ('CREDIT_DU_SENEGAL', '{CDS,banque}'),
  ('CREDIT_INTERNATIONAL', '{CI,banque}'),
  ('ECOBANK', '{Ecobank Sénégal,banque}'),
  ('FBNBANK', '{FBNBank Sénégal,First Bank,banque}'),
  ('LBA', '{LBA,CNCAS,banque}'),
  ('LBO', '{LBO,banque}'),
  ('SUNU_BANK', '{Sunu Bank Sénégal,BICIS,banque}'),
  ('BDM', '{Banque de développement du Mali,banque}'),
  ('BCI_MALI', '{Banque pour le commerce et l''industrie du Mali,banque}'),
  ('BRIDGE_BANK', '{Bridge Bank Group,BBG,banque}'),
  ('NSIA_BANQUE', '{NSIA,banque}'),
  ('ORABANK', '{Orabank Sénégal,banque}'),
  ('ORANGE_BANK', '{Orange Bank,banque}')
) AS v (code, aliases)
JOIN organization o ON o.code = v.code;

-- The three banks already there (0003): the other names of the list.
UPDATE establishment e
SET aliases = e.aliases || v.extra::text[]
FROM (VALUES
  ('CBAO', '{CBAO Groupe Attijariwafa bank,banque}'),
  ('UBA', '{banque}'),
  ('SOCIETE_GENERALE', '{SG Sénégal,SGSN,banque}')
) AS v (code, extra)
JOIN organization o ON o.code = v.code
WHERE e.organization_id = o.id AND e.scope = 'general';
