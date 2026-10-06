-- New organisations (proposal validated by Olivia on 2026-10-06,
-- /mnt/project-files/organismes/proposition.md): each one rated « in
-- general », like the banks (0022); no agencies yet. Most reuse the lists of
-- their sector. Six new services, thirteen new questions, no new topic.
-- Insurance names from the 2025 list of afriquefinance.com (life and non-life
-- companies of a group kept as one); microfinance and the networks of shops
-- and stations from memory, not checked against an official source.

-- ---------------------------------------------------------------------------
-- Organisations and their establishment « in general »
-- ---------------------------------------------------------------------------
CREATE TEMPORARY TABLE new_organization (code text, name text, full_name text, sector text, aliases text[]);

INSERT INTO new_organization VALUES
  -- Used by almost everybody
  ('WAVE', 'Wave', 'Wave Mobile Money', 'BANKING_INSURANCE', '{Wave Sénégal,mobile money,transfert d''argent,point Wave}'),
  ('CSS', 'CSS', 'Caisse de sécurité sociale', 'SOCIAL', '{Caisse de sécurité sociale,sécurité sociale,allocations familiales,accident du travail}'),
  ('ANACMU', 'Agence de la CMU', 'Agence nationale de la couverture maladie universelle', 'SOCIAL', '{CMU,ANACMU,couverture maladie universelle,mutuelle de santé,Sunu CMU}'),
  ('ONAS', 'ONAS', 'Office national de l''assainissement du Sénégal', 'WATER', '{Office national de l''assainissement du Sénégal,assainissement,égout,fosse,vidange}'),
  ('DOUANES', 'Douanes', 'Direction générale des Douanes', 'TAX', '{Direction générale des Douanes,douane,dédouanement,DGD}'),
  ('TRESOR', 'Trésor public', 'Direction générale de la Comptabilité publique et du Trésor', 'TAX', '{DGCPT,Trésor,perception,Direction générale de la Comptabilité publique et du Trésor}'),
  -- Insurance
  ('AXA', 'AXA', 'AXA Assurances Sénégal', 'BANKING_INSURANCE', '{AXA Assurances,AXA Sénégal,assurance}'),
  ('ALLIANZ', 'Allianz', 'Allianz Sénégal Assurances', 'BANKING_INSURANCE', '{Allianz Sénégal,Sanlam Allianz,assurance}'),
  ('SANLAM', 'Sanlam', 'Sanlam Assurances Sénégal (ex-Saham Assurances)', 'BANKING_INSURANCE', '{Saham,Saham Assurances,Sanlam Allianz,assurance}'),
  ('NSIA_ASSURANCES', 'NSIA Assurances', 'Nouvelle Société Interafricaine d''Assurances Sénégal', 'BANKING_INSURANCE', '{NSIA,NSIA Vie,assurance}'),
  ('AMSA', 'AMSA Assurances', 'AMSA Assurances Sénégal', 'BANKING_INSURANCE', '{AMSA,AMSA Vie,assurance}'),
  ('ASKIA', 'Askia Assurances', NULL, 'BANKING_INSURANCE', '{Askia,assurance}'),
  ('CNART', 'CNART Assurances', 'Compagnie nationale d''assurances et de réassurance des transporteurs', 'BANKING_INSURANCE', '{CNART,assurance auto,assurance}'),
  ('SONAM', 'Sonam Assurances', 'Société nationale d''assurances mutuelles', 'BANKING_INSURANCE', '{Sonam,Sonam Vie,assurance}'),
  ('SUNU_ASSURANCES', 'Sunu Assurances', 'Sunu Assurances Sénégal', 'BANKING_INSURANCE', '{Sunu,Sunu Assurances Vie,assurance}'),
  ('PREVOYANCE', 'Prévoyance Assurances', 'La Prévoyance Assurances', 'BANKING_INSURANCE', '{La Prévoyance,assurance}'),
  ('SALAMA', 'Salama Assurances', 'Salama Assurances Sénégal', 'BANKING_INSURANCE', '{Salama,assurance}'),
  ('ASS', 'La Sécurité Sénégalaise', 'Assurance Sécurité Sénégalaise', 'BANKING_INSURANCE', '{ASS,Sécurité Sénégalaise,assurance}'),
  ('WAFA_ASSURANCE', 'Wafa Assurance', 'Wafa Assurance Sénégal', 'BANKING_INSURANCE', '{Wafa,assurance}'),
  ('SAAR', 'SAAR Assurances', 'Société africaine d''assurance et de réassurance', 'BANKING_INSURANCE', '{SAAR,SAAR Vie,assurance}'),
  ('LA_PROVIDENCE', 'La Providence', 'Assurances La Providence du Sénégal', 'BANKING_INSURANCE', '{Providence,assurance}'),
  ('CNAAS', 'CNAAS', 'Compagnie nationale d''assurance agricole du Sénégal', 'BANKING_INSURANCE', '{assurance agricole,assurance}'),
  -- Microfinance
  ('CMS', 'CMS', 'Crédit Mutuel du Sénégal', 'BANKING_INSURANCE', '{Crédit Mutuel du Sénégal,microfinance}'),
  ('PAMECAS', 'PAMECAS', 'Partenariat pour la mobilisation de l''épargne et du crédit au Sénégal', 'BANKING_INSURANCE', '{microfinance}'),
  ('BAOBAB', 'Baobab', 'Baobab Sénégal (ex-Microcred)', 'BANKING_INSURANCE', '{Baobab Sénégal,Microcred,microfinance}'),
  ('COFINA', 'Cofina', 'Cofina Sénégal', 'BANKING_INSURANCE', '{Cofina Sénégal,microfinance}'),
  ('U_IMCEC', 'U-IMCEC', 'Union des institutions mutualistes communautaires d''épargne et de crédit', 'BANKING_INSURANCE', '{IMCEC,microfinance}'),
  ('ACEP', 'ACEP', 'Alliance de crédit et d''épargne pour la production', 'BANKING_INSURANCE', '{ACEP Sénégal,microfinance}'),
  -- Transport
  ('PORT_DAKAR', 'Port de Dakar', 'Port autonome de Dakar', 'TRANSPORT', '{Port autonome de Dakar,PAD,port}'),
  ('TOLL_HIGHWAY', 'Autoroute à péage', 'Autoroute à péage, exploitée par la SECAA', 'TRANSPORT', '{SECAA,Autoroute de l''Avenir,péage,Rapido,autoroute}'),
  -- Pay television
  ('CANAL_PLUS', 'Canal+', 'Canal+ Sénégal', 'TELECOM', '{Canal Plus,Canal+ Sénégal,télévision,abonnement télé}'),
  ('STARTIMES', 'StarTimes', 'StarTimes Sénégal', 'TELECOM', '{Star Times,télévision,abonnement télé}'),
  -- Shops and stations
  ('AUCHAN', 'Auchan', 'Auchan Sénégal', 'RETAIL', '{Auchan Sénégal,supermarché}'),
  ('CARREFOUR', 'Carrefour', 'Carrefour Sénégal', 'RETAIL', '{Carrefour Sénégal,supermarché}'),
  ('TOTALENERGIES', 'TotalEnergies', 'TotalEnergies Marketing Sénégal', 'RETAIL', '{Total,station-service,carburant}'),
  ('SHELL', 'Shell', 'Shell, distribué par Vivo Energy Sénégal', 'RETAIL', '{Vivo Energy,station-service,carburant}'),
  ('ORYX', 'Oryx', 'Oryx Energies Sénégal', 'RETAIL', '{Oryx Energies,station-service,carburant}'),
  ('STAR_OIL', 'Star Oil', NULL, 'RETAIL', '{station-service,carburant}'),
  ('ELTON', 'Elton', 'Elton Oil', 'RETAIL', '{Elton Oil,station-service,carburant}'),
  ('EDK', 'EDK', 'EDK Oil', 'RETAIL', '{EDK Oil,station-service,carburant}'),
  ('LONASE', 'LONASE', 'Loterie nationale sénégalaise', 'RETAIL', '{Loterie nationale sénégalaise,loterie,PMU,paris}');

INSERT INTO organization (code, name, full_name, sector_id)
SELECT v.code, v.name, v.full_name, s.id
FROM new_organization v
JOIN sector s ON s.code = v.sector;

INSERT INTO establishment (name, aliases, organization_id, scope, sector_id)
SELECT o.name, v.aliases, o.id, 'general', o.sector_id
FROM new_organization v
JOIN organization o ON o.code = v.code;

DROP TABLE new_organization;

-- ---------------------------------------------------------------------------
-- Public universities, like the UGB: type University, so they get the two
-- services of higher education (0015).
-- ---------------------------------------------------------------------------
INSERT INTO establishment (name, aliases, sector_id, type_id, ownership, municipality_id)
SELECT v.name, v.aliases::text[], et.sector_id, et.id, 'public', m.id
FROM (VALUES
  ('Université Iba Der Thiam de Thiès', '{UIDT,Université de Thiès}', 'SN-TH-THIES'),
  ('Université Alioune Diop de Bambey', '{UADB,Université de Bambey}', NULL),
  ('Université Assane Seck de Ziguinchor', '{UASZ,Université de Ziguinchor}', NULL),
  ('Université numérique Cheikh Hamidou Kane', '{UN-CHK,UVS,Université virtuelle du Sénégal}', NULL),
  ('Université du Sine Saloum El Hadji Ibrahima Niass', '{USSEIN,Université de Kaolack}', NULL),
  ('Université Amadou Mahtar Mbow', '{UAM,Université de Diamniadio}', NULL)
) AS v (name, aliases, municipality)
JOIN establishment_type et ON et.code = 'UNIVERSITY'
LEFT JOIN municipality m ON m.code = v.municipality;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM establishment e
JOIN service s ON s.code IN ('HIGHER_EDUCATION_ADMIN', 'HIGHER_EDUCATION_COURSES')
WHERE e.name IN (
  'Université Iba Der Thiam de Thiès', 'Université Alioune Diop de Bambey',
  'Université Assane Seck de Ziguinchor', 'Université numérique Cheikh Hamidou Kane',
  'Université du Sine Saloum El Hadji Ibrahima Niass', 'Université Amadou Mahtar Mbow');

-- ---------------------------------------------------------------------------
-- New questions
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type, category_id)
SELECT v.code, 'single_choice', c.id
FROM (VALUES
  ('MONEY_CHANNEL', NULL),
  ('MONEY_OPERATION_OK', 'OUTCOME'),
  ('MONEY_PROBLEM_SOLVED', 'OUTCOME'),
  ('AGENT_CASH', 'SERVICE_QUALITY'),
  ('SEWER_PROBLEM', NULL),
  ('SEWER_INTERVENTION_TIME', 'DELAYS'),
  ('SEWER_SOLVED', 'OUTCOME'),
  ('CLAIM_PAID', 'OUTCOME'),
  ('CLAIM_DELAY', 'DELAYS'),
  ('TOLL_WAIT', 'DELAYS'),
  ('TOLL_PAYMENT_OK', 'SERVICE_QUALITY'),
  ('ROAD_CONDITION', 'PREMISES'),
  ('TV_CUTS', 'SERVICE_QUALITY')
) AS v (code, category)
LEFT JOIN evaluation_category c ON c.code = v.category;

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('MONEY_CHANNEL', 'Où avez-vous fait l''opération ?'),
  ('MONEY_OPERATION_OK', 'L''opération s''est-elle bien passée ?'),
  ('MONEY_PROBLEM_SOLVED', 'Le problème a-t-il été réglé ?'),
  ('AGENT_CASH', 'L''agent avait-il assez d''argent pour votre opération ?'),
  ('SEWER_PROBLEM', 'Quel était le problème ?'),
  ('SEWER_INTERVENTION_TIME', 'Combien de temps l''ONAS a-t-elle mis pour intervenir ?'),
  ('SEWER_SOLVED', 'Le problème est-il réglé ?'),
  ('CLAIM_PAID', 'Avez-vous été indemnisé(e) ou remboursé(e) ?'),
  ('CLAIM_DELAY', 'Combien de temps entre votre déclaration et le paiement ?'),
  ('TOLL_WAIT', 'Combien de temps avez-vous attendu au péage ?'),
  ('TOLL_PAYMENT_OK', 'Le paiement (badge Rapido ou guichet) a-t-il bien marché ?'),
  ('ROAD_CONDITION', 'La route était-elle en bon état et bien éclairée ?'),
  ('TV_CUTS', 'L''image a-t-elle été coupée ce mois-ci ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

-- value: more is better; for a wait or a delay, longer is more (like the
-- other waits); NULL for a fact that only opens other questions.
CREATE TEMPORARY TABLE new_option (question text, option text, value smallint, position smallint, label text);

INSERT INTO new_option VALUES
  ('MONEY_CHANNEL', 'APP', NULL, 1, 'Dans l''application'),
  ('MONEY_CHANNEL', 'AGENT', NULL, 2, 'Chez un agent'),
  ('MONEY_OPERATION_OK', 'YES', 3, 1, 'Oui'),
  ('MONEY_OPERATION_OK', 'FAILED', 2, 2, 'Non, elle a échoué'),
  ('MONEY_OPERATION_OK', 'BLOCKED', 1, 3, 'Non, l''argent est bloqué ou n''est pas arrivé'),
  ('MONEY_PROBLEM_SOLVED', 'YES', 3, 1, 'Oui'),
  ('MONEY_PROBLEM_SOLVED', 'NOT_YET', 2, 2, 'Pas encore'),
  ('MONEY_PROBLEM_SOLVED', 'NO', 1, 3, 'Non'),
  ('AGENT_CASH', 'YES', 2, 1, 'Oui'),
  ('AGENT_CASH', 'NO', 1, 2, 'Non'),
  ('SEWER_PROBLEM', 'BLOCKED_SEWER', NULL, 1, 'Égout bouché ou qui déborde'),
  ('SEWER_PROBLEM', 'SEPTIC_TANK', NULL, 2, 'Fosse à vider'),
  ('SEWER_PROBLEM', 'FLOODING', NULL, 3, 'Eau qui stagne ou inondation'),
  ('SEWER_PROBLEM', 'OTHER', NULL, 4, 'Autre'),
  ('SEWER_INTERVENTION_TIME', 'UNDER_24_H', 1, 1, 'Moins de 24 heures'),
  ('SEWER_INTERVENTION_TIME', '1_TO_3_DAYS', 2, 2, '1 à 3 jours'),
  ('SEWER_INTERVENTION_TIME', 'OVER_3_DAYS', 3, 3, 'Plus de 3 jours'),
  ('SEWER_INTERVENTION_TIME', 'NOT_YET', 4, 4, 'Pas encore venue'),
  ('SEWER_SOLVED', 'YES', 3, 1, 'Oui'),
  ('SEWER_SOLVED', 'PARTLY', 2, 2, 'En partie'),
  ('SEWER_SOLVED', 'NO', 1, 3, 'Non'),
  ('CLAIM_PAID', 'YES', 4, 1, 'Oui'),
  ('CLAIM_PAID', 'PARTLY', 3, 2, 'En partie'),
  ('CLAIM_PAID', 'NOT_YET', 2, 3, 'Pas encore'),
  ('CLAIM_PAID', 'REFUSED', 1, 4, 'Non, refusé'),
  ('CLAIM_DELAY', 'UNDER_1_MONTH', 1, 1, 'Moins d''un mois'),
  ('CLAIM_DELAY', '1_TO_3_MONTHS', 2, 2, '1 à 3 mois'),
  ('CLAIM_DELAY', 'OVER_3_MONTHS', 3, 3, 'Plus de 3 mois'),
  ('TOLL_WAIT', 'UNDER_5_MIN', 1, 1, 'Moins de 5 minutes'),
  ('TOLL_WAIT', '5_TO_15_MIN', 2, 2, '5 à 15 minutes'),
  ('TOLL_WAIT', 'OVER_15_MIN', 3, 3, 'Plus de 15 minutes'),
  ('TOLL_PAYMENT_OK', 'YES', 2, 1, 'Oui'),
  ('TOLL_PAYMENT_OK', 'NO', 1, 2, 'Non'),
  ('ROAD_CONDITION', 'YES', 3, 1, 'Oui'),
  ('ROAD_CONDITION', 'PARTLY', 2, 2, 'En partie'),
  ('ROAD_CONDITION', 'NO', 1, 3, 'Non'),
  ('TV_CUTS', 'NEVER', 3, 1, 'Jamais'),
  ('TV_CUTS', 'SOMETIMES', 2, 2, 'Quelquefois'),
  ('TV_CUTS', 'OFTEN', 1, 3, 'Souvent');

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, v.value, v.position
FROM new_option v
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT o.id, 'fr', v.label
FROM new_option v
JOIN question q ON q.code = v.question
JOIN answer_option o ON o.question_id = q.id AND o.code = v.option;

DROP TABLE new_option;

INSERT INTO question_set (code) VALUES
  ('MOBILE_MONEY'), ('SEWER_ISSUE'), ('INSURANCE_CLAIM'), ('TOLL_HIGHWAY'), ('TV_SUBSCRIPTION');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('MOBILE_MONEY', 'MONEY_CHANNEL', 1),
  ('MOBILE_MONEY', 'MONEY_OPERATION_OK', 2),
  ('MOBILE_MONEY', 'MONEY_PROBLEM_SOLVED', 3),
  ('MOBILE_MONEY', 'AGENT_CASH', 4),
  ('SEWER_ISSUE', 'SEWER_PROBLEM', 1),
  ('SEWER_ISSUE', 'SEWER_INTERVENTION_TIME', 2),
  ('SEWER_ISSUE', 'SEWER_SOLVED', 3),
  ('INSURANCE_CLAIM', 'CLAIM_PAID', 1),
  ('INSURANCE_CLAIM', 'CLAIM_DELAY', 2),
  ('TOLL_HIGHWAY', 'TOLL_WAIT', 1),
  ('TOLL_HIGHWAY', 'TOLL_PAYMENT_OK', 2),
  ('TOLL_HIGHWAY', 'ROAD_CONDITION', 3),
  ('TV_SUBSCRIPTION', 'TV_CUTS', 1)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- Problem solved only after a failed or blocked operation; the agent's cash
-- only at an agent; the delay of payment only once something was paid.
INSERT INTO question_condition (question_set_id, question_id, depends_on_question_id, option_id)
SELECT qs.id, q.id, dq.id, ao.id
FROM (VALUES
  ('MOBILE_MONEY', 'MONEY_PROBLEM_SOLVED', 'MONEY_OPERATION_OK', 'FAILED'),
  ('MOBILE_MONEY', 'MONEY_PROBLEM_SOLVED', 'MONEY_OPERATION_OK', 'BLOCKED'),
  ('MOBILE_MONEY', 'AGENT_CASH', 'MONEY_CHANNEL', 'AGENT'),
  ('INSURANCE_CLAIM', 'CLAIM_DELAY', 'CLAIM_PAID', 'YES'),
  ('INSURANCE_CLAIM', 'CLAIM_DELAY', 'CLAIM_PAID', 'PARTLY')
) AS v (list, question, depends_on, option)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question
JOIN question dq ON dq.code = v.depends_on
JOIN answer_option ao ON ao.question_id = dq.id AND ao.code = v.option;

-- ---------------------------------------------------------------------------
-- Topic lists of the new services (added to their sector's list)
-- ---------------------------------------------------------------------------
INSERT INTO topic_set (code) VALUES ('SEWER_ISSUE'), ('TOLL_HIGHWAY');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('SEWER_ISSUE', 'INTERVENTION_TIME'), ('SEWER_ISSUE', 'CUSTOMER_SERVICE'), ('SEWER_ISSUE', 'FEES'),
  ('TOLL_HIGHWAY', 'WAIT_TIME')
) AS v (set_code, topic_code)
JOIN topic_set s ON s.code = v.set_code
JOIN topic t ON t.code = v.topic_code;

-- ---------------------------------------------------------------------------
-- Telecoms: the questions on calls, internet and the network move from the
-- sector to a service of the operators, so that pay television does not get
-- them.
-- ---------------------------------------------------------------------------
UPDATE sector SET question_set_id = NULL WHERE code = 'TELECOM';

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
INSERT INTO service (code, sector_id, topic_set_id, question_set_id, synonyms)
SELECT v.code, s.id, ts.id, qs.id, v.synonyms::text[]
FROM (VALUES
  ('MOBILE_MONEY', 'BANKING_INSURANCE', NULL, 'MOBILE_MONEY',
   '{mobile money,transfert,envoi d''argent,paiement,retrait,dépôt,Orange Money,Wave,Mixx}'),
  ('SEWER_ISSUE', 'WATER', 'SEWER_ISSUE', 'SEWER_ISSUE', '{égout,fosse,vidange,inondation,assainissement}'),
  ('INSURANCE_CLAIM', 'BANKING_INSURANCE', NULL, 'INSURANCE_CLAIM',
   '{sinistre,accident,remboursement,indemnisation,constat}'),
  ('PORT_PROCEDURE', 'TRANSPORT', 'FILE_SERVICES', 'FILE_SERVICES',
   '{port,marchandise,conteneur,véhicule,enlèvement,dédouanement}'),
  ('HIGHWAY_TRIP', 'TRANSPORT', 'TOLL_HIGHWAY', 'TOLL_HIGHWAY', '{autoroute,péage,Rapido}'),
  ('TV_SUBSCRIPTION', 'TELECOM', NULL, 'TV_SUBSCRIPTION', '{télévision,télé,abonnement,décodeur,chaînes}'),
  ('PHONE_INTERNET', 'TELECOM', NULL, 'TELECOM', '{téléphone,appels,SMS,internet,réseau,forfait,crédit,facture}')
) AS v (code, sector, topics, questions, synonyms)
JOIN sector s ON s.code = v.sector
LEFT JOIN topic_set ts ON ts.code = v.topics
JOIN question_set qs ON qs.code = v.questions;

INSERT INTO service_translation (service_id, language, label)
SELECT s.id, 'fr', v.label
FROM (VALUES
  ('MOBILE_MONEY', 'Un envoi, un paiement ou un retrait d''argent'),
  ('SEWER_ISSUE', 'Un problème d''égout ou d''inondation'),
  ('INSURANCE_CLAIM', 'Une déclaration de sinistre ou une demande de remboursement'),
  ('PORT_PROCEDURE', 'Une démarche au port (marchandise, véhicule)'),
  ('HIGHWAY_TRIP', 'Un passage sur l''autoroute'),
  ('TV_SUBSCRIPTION', 'Un abonnement télé'),
  ('PHONE_INTERNET', 'Téléphone ou internet')
) AS v (code, label)
JOIN service s ON s.code = v.code;

INSERT INTO establishment_service (establishment_id, service_id)
SELECT e.id, s.id
FROM (VALUES
  ('WAVE', 'MOBILE_MONEY'),
  ('ORANGE', 'PHONE_INTERNET'), ('ORANGE', 'MOBILE_MONEY'),
  ('YAS', 'PHONE_INTERNET'), ('YAS', 'MOBILE_MONEY'),
  ('EXPRESSO', 'PHONE_INTERNET'),
  ('ONAS', 'WATER_AGENCY'), ('ONAS', 'SEWER_ISSUE'),
  ('PORT_DAKAR', 'PORT_PROCEDURE'),
  ('TOLL_HIGHWAY', 'HIGHWAY_TRIP'),
  ('CANAL_PLUS', 'TV_SUBSCRIPTION'),
  ('STARTIMES', 'TV_SUBSCRIPTION'),
  ('AXA', 'INSURANCE_CLAIM'), ('ALLIANZ', 'INSURANCE_CLAIM'), ('SANLAM', 'INSURANCE_CLAIM'),
  ('NSIA_ASSURANCES', 'INSURANCE_CLAIM'), ('AMSA', 'INSURANCE_CLAIM'), ('ASKIA', 'INSURANCE_CLAIM'),
  ('CNART', 'INSURANCE_CLAIM'), ('SONAM', 'INSURANCE_CLAIM'), ('SUNU_ASSURANCES', 'INSURANCE_CLAIM'),
  ('PREVOYANCE', 'INSURANCE_CLAIM'), ('SALAMA', 'INSURANCE_CLAIM'), ('ASS', 'INSURANCE_CLAIM'),
  ('WAFA_ASSURANCE', 'INSURANCE_CLAIM'), ('SAAR', 'INSURANCE_CLAIM'), ('LA_PROVIDENCE', 'INSURANCE_CLAIM'),
  ('CNAAS', 'INSURANCE_CLAIM')
) AS v (organization, service)
JOIN organization o ON o.code = v.organization
JOIN establishment e ON e.organization_id = o.id AND e.scope = 'general'
JOIN service s ON s.code = v.service;
