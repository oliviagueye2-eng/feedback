-- Reference data decided so far (docs/architecture-base-de-donnees.md).
-- Territory (region, department, municipality) and the establishment
-- registry are imported separately from official sources.

-- ---------------------------------------------------------------------------
-- Sectors
-- ---------------------------------------------------------------------------

-- A sector is neither public nor private: establishment.ownership says so.
-- TOURISM: travel agencies, guides, tourist sites, tourist offices
-- (accommodation stays in HOSPITALITY, museums in CULTURE).
INSERT INTO sector (code) VALUES
  ('HEALTH'), ('EDUCATION'), ('ADMINISTRATION'), ('JUSTICE'), ('SECURITY'),
  ('TAX'), ('UTILITIES'), ('TRANSPORT'), ('SOCIAL'),
  ('FOOD_SERVICE'), ('HOSPITALITY'), ('REAL_ESTATE'), ('RETAIL'),
  ('BANKING_INSURANCE'), ('CULTURE'), ('SPORT'), ('TELECOM'), ('TOURISM');

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'sector', s.id, 'fr', v.label
FROM (VALUES
  ('HEALTH', 'Santé'),
  ('EDUCATION', 'Éducation'),
  ('ADMINISTRATION', 'Administration et état civil'),
  ('JUSTICE', 'Justice'),
  ('SECURITY', 'Sécurité'),
  ('TAX', 'Impôts et domaines'),
  ('UTILITIES', 'Eau et électricité'),
  ('TRANSPORT', 'Transport'),
  ('SOCIAL', 'Emploi et protection sociale'),
  ('FOOD_SERVICE', 'Restauration'),
  ('HOSPITALITY', 'Hôtellerie'),
  ('REAL_ESTATE', 'Immobilier'),
  ('RETAIL', 'Commerce'),
  ('BANKING_INSURANCE', 'Banques et assurances'),
  ('CULTURE', 'Culture'),
  ('SPORT', 'Sport'),
  ('TELECOM', 'Télécoms'),
  ('TOURISM', 'Tourisme')
) AS v (code, label)
JOIN sector s ON s.code = v.code;

-- ---------------------------------------------------------------------------
-- Topics (screen 2b: "Ce qui vous a plu" / "Ce qui n'a pas été")
-- ---------------------------------------------------------------------------

INSERT INTO topic (code, position) VALUES
  ('STAFF', 1), ('WAIT_TIME', 2), ('PRICE', 3), ('CLEANLINESS', 4),
  ('ACCESSIBILITY', 5), ('INFORMATION', 6), ('SAFETY', 7),
  ('SERVICE_QUALITY', 8), ('OTHER', 9);

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'topic', t.id, 'fr', v.label
FROM (VALUES
  ('STAFF', 'Accueil et personnel'),
  ('WAIT_TIME', 'Attente'),
  ('PRICE', 'Prix'),
  ('CLEANLINESS', 'Propreté'),
  ('ACCESSIBILITY', 'Accessibilité'),
  ('INFORMATION', 'Information'),
  ('SAFETY', 'Sécurité'),
  ('SERVICE_QUALITY', 'Qualité du service'),
  ('OTHER', 'Autre')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

-- ---------------------------------------------------------------------------
-- Essential questionnaire: one question, asked to everyone in every sector
-- ---------------------------------------------------------------------------

INSERT INTO questionnaire (code, version, status, published_at)
VALUES ('ESSENTIAL', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position, is_required)
SELECT id, 'OVERALL_SATISFACTION', 'scale_5', 1, true
FROM questionnaire WHERE code = 'ESSENTIAL' AND version = 1;

INSERT INTO translation (target_table, target_id, language, text)
SELECT 'question', q.id, 'fr', 'Êtes-vous satisfait(e) du service reçu ?'
FROM question q JOIN questionnaire qn ON qn.id = q.questionnaire_id
WHERE qn.code = 'ESSENTIAL' AND qn.version = 1 AND q.code = 'OVERALL_SATISFACTION';

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.code, v.value, v.position
FROM (VALUES
  ('VERY_SATISFIED', 5, 1),
  ('SATISFIED', 4, 2),
  ('NEUTRAL', 3, 3),
  ('DISSATISFIED', 2, 4),
  ('VERY_DISSATISFIED', 1, 5)
) AS v (code, value, position)
CROSS JOIN (
  SELECT q.id FROM question q JOIN questionnaire qn ON qn.id = q.questionnaire_id
  WHERE qn.code = 'ESSENTIAL' AND qn.version = 1 AND q.code = 'OVERALL_SATISFACTION'
) AS q;

-- Option labels, and the follow-up prompt shown above the free text.
INSERT INTO translation (target_table, target_id, field, language, text)
SELECT 'answer_option', ao.id, v.field, 'fr', v.text
FROM (VALUES
  ('VERY_SATISFIED', 'label', 'Très satisfait(e)'),
  ('SATISFIED', 'label', 'Satisfait(e)'),
  ('NEUTRAL', 'label', 'Moyennement satisfait(e)'),
  ('DISSATISFIED', 'label', 'Peu satisfait(e)'),
  ('VERY_DISSATISFIED', 'label', 'Pas du tout satisfait(e)'),
  ('VERY_SATISFIED', 'follow_up_prompt', 'Qu''est-ce qui vous a plu ?'),
  ('SATISFIED', 'follow_up_prompt', 'Qu''est-ce qui vous a plu ?'),
  ('NEUTRAL', 'follow_up_prompt', 'Qu''est-ce qui aurait pu être mieux ?'),
  ('DISSATISFIED', 'follow_up_prompt', 'Que s''est-il passé ?'),
  ('VERY_DISSATISFIED', 'follow_up_prompt', 'Que s''est-il passé ?')
) AS v (code, field, text)
JOIN answer_option ao ON ao.code = v.code
JOIN question q ON q.id = ao.question_id AND q.code = 'OVERALL_SATISFACTION'
JOIN questionnaire qn ON qn.id = q.questionnaire_id AND qn.code = 'ESSENTIAL' AND qn.version = 1;

-- ---------------------------------------------------------------------------
-- Generic questionnaire (service and sector unknown). Questions to be decided:
-- kept as a draft until then.
-- ---------------------------------------------------------------------------

INSERT INTO questionnaire (code, version, status) VALUES ('GENERIC', 1, 'draft');
