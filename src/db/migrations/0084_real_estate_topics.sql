-- 0084: the topics and questions of real estate (decided by Olivia,
-- 2026-10-15). None of the sector's topics fitted a sale or a rental (the
-- counter's wait, opening hours, premises): they go only to « Autre démarche »
-- now, like the transport's for the taxi (0060), and each service gets its
-- own. So do the sector's questions (COMMERCE: fair price, receipt,
-- recommend): each service asks only its own, then the common ones.
--   PROPERTY_SALE: price, fees, the papers (the transfer of ownership), the
--     commitments kept; asks who one was (buyer or seller), the kind of
--     property, the kind of papers and the intermediary, four facts;
--   PROPERTY_RENTAL, the tenant: the rent, the deposit and advance, the
--     commission, the state of the home, the lease kept by the landlord, the
--     deposit given back;
--   PROPERTY_LETTING, the landlord: the rent paid, the unpaid rent recovered,
--     the commission, the state of the home when the tenant leaves, the lease
--     kept by the tenant, the agency's management.
-- Both rentals ask the kind of property (a question of its own, without the
-- land) and the intermediary. The commission is one topic for both, to compare.
-- The commission and the agency's management only after an agency or a broker:
-- the rentals ask the intermediary with the topics (screen 2b), the sale later.

UPDATE sector_topic_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'REAL_ESTATE');

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('PROPERTY_PRICE', 1, 'COST'),
  ('PROPERTY_FEES', 2, 'COST'),
  ('PROPERTY_PAPERS', 3, 'PROCEDURE'),
  ('COMMITMENTS_KEPT', 4, 'OUTCOME'),
  ('RENT_AMOUNT', 5, 'COST'),
  ('DEPOSIT_AND_ADVANCE', 6, 'COST'),
  ('AGENT_COMMISSION', 7, 'COST'),
  ('HOUSING_CONDITION', 8, 'SERVICE_QUALITY'),
  ('LEASE_KEPT_BY_LANDLORD', 9, 'SERVICE_QUALITY'),
  ('DEPOSIT_RETURNED', 10, 'SERVICE_QUALITY'),
  ('RENT_PAID', 11, 'DELAYS'),
  ('UNPAID_RENT_RECOVERY', 12, 'PROCEDURE'),
  ('HOUSING_CONDITION_AT_EXIT', 13, 'SERVICE_QUALITY'),
  ('LEASE_KEPT_BY_TENANT', 14, 'SERVICE_QUALITY'),
  ('AGENCY_MANAGEMENT', 15, 'SERVICE_QUALITY')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_PRICE', 'Prix du bien'),
  ('PROPERTY_FEES', 'Frais (notaire, commission, enregistrement)'),
  ('PROPERTY_PAPERS', 'Obtention des papiers du bien (facilité de mutation)'),
  ('COMMITMENTS_KEPT', 'Respect des engagements (délais, conformité du bien)'),
  ('RENT_AMOUNT', 'Montant du loyer'),
  ('DEPOSIT_AND_ADVANCE', 'Caution et avance demandées'),
  ('AGENT_COMMISSION', 'Commission d''agence ou de démarcheur'),
  ('HOUSING_CONDITION', 'État du logement à l''entrée'),
  ('LEASE_KEPT_BY_LANDLORD', 'Respect du bail par le propriétaire (réparations, hausses, préavis)'),
  ('DEPOSIT_RETURNED', 'Restitution de la caution'),
  ('RENT_PAID', 'Paiement du loyer (régularité, retards)'),
  ('UNPAID_RENT_RECOVERY', 'Recouvrement des impayés (démarches, délais)'),
  ('HOUSING_CONDITION_AT_EXIT', 'État du logement au départ du locataire (dégradations)'),
  ('LEASE_KEPT_BY_TENANT', 'Respect du bail par le locataire (usage, sous-location, préavis)'),
  ('AGENCY_MANAGEMENT', 'Gestion par l''agence ou l''intermédiaire (recherche du locataire, encaissement, suivi)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('PROPERTY_SALE'), ('PROPERTY_RENTAL'), ('PROPERTY_LETTING');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('PROPERTY_SALE', 'PROPERTY_PRICE'), ('PROPERTY_SALE', 'PROPERTY_FEES'), ('PROPERTY_SALE', 'PROPERTY_PAPERS'),
  ('PROPERTY_SALE', 'COMMITMENTS_KEPT'),
  ('PROPERTY_RENTAL', 'RENT_AMOUNT'), ('PROPERTY_RENTAL', 'DEPOSIT_AND_ADVANCE'), ('PROPERTY_RENTAL', 'AGENT_COMMISSION'),
  ('PROPERTY_RENTAL', 'HOUSING_CONDITION'), ('PROPERTY_RENTAL', 'LEASE_KEPT_BY_LANDLORD'),
  ('PROPERTY_RENTAL', 'DEPOSIT_RETURNED'),
  ('PROPERTY_LETTING', 'RENT_PAID'), ('PROPERTY_LETTING', 'UNPAID_RENT_RECOVERY'),
  ('PROPERTY_LETTING', 'AGENT_COMMISSION'), ('PROPERTY_LETTING', 'HOUSING_CONDITION_AT_EXIT'),
  ('PROPERTY_LETTING', 'LEASE_KEPT_BY_TENANT'), ('PROPERTY_LETTING', 'AGENCY_MANAGEMENT')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

INSERT INTO service_topic_set (service_id, topic_set_id, position)
SELECT s.id, ts.id, 1
FROM service s JOIN topic_set ts ON ts.code = s.code
WHERE s.code IN ('PROPERTY_SALE', 'PROPERTY_RENTAL', 'PROPERTY_LETTING');

-- ---------------------------------------------------------------------------
-- Questions: facts only (no category, no value)
-- ---------------------------------------------------------------------------
INSERT INTO question (code, type) VALUES
  ('PROPERTY_ROLE', 'single_choice'), ('PROPERTY_KIND', 'single_choice'), ('PROPERTY_PAPER_TYPE', 'single_choice'),
  ('RENTAL_PROPERTY_KIND', 'single_choice'), ('PROPERTY_INTERMEDIARY', 'single_choice');

INSERT INTO question_translation (question_id, language, label)
SELECT q.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_ROLE', 'Vous étiez :'),
  ('PROPERTY_KIND', 'Quel type de bien ?'),
  ('PROPERTY_PAPER_TYPE', 'Quel type de papier pour le bien ?'),
  ('RENTAL_PROPERTY_KIND', 'Quel type de bien ?'),
  ('PROPERTY_INTERMEDIARY', 'Êtes-vous passé(e) par un intermédiaire ?')
) AS v (code, label)
JOIN question q ON q.code = v.code;

INSERT INTO answer_option (question_id, code, value, position)
SELECT q.id, v.option, NULL, v.position
FROM (VALUES
  ('PROPERTY_ROLE', 'BUYER', 1), ('PROPERTY_ROLE', 'SELLER', 2),
  ('PROPERTY_KIND', 'LAND', 1), ('PROPERTY_KIND', 'HOUSE', 2), ('PROPERTY_KIND', 'APARTMENT', 3),
  ('PROPERTY_KIND', 'COMMERCIAL', 4), ('PROPERTY_KIND', 'OTHER', 5),
  ('PROPERTY_PAPER_TYPE', 'LAND_TITLE', 1), ('PROPERTY_PAPER_TYPE', 'LEASE', 2),
  ('PROPERTY_PAPER_TYPE', 'DELIBERATION', 3), ('PROPERTY_PAPER_TYPE', 'ADMINISTRATIVE_ACT', 4),
  ('RENTAL_PROPERTY_KIND', 'HOUSE', 1), ('RENTAL_PROPERTY_KIND', 'APARTMENT', 2),
  ('RENTAL_PROPERTY_KIND', 'COMMERCIAL', 3), ('RENTAL_PROPERTY_KIND', 'OTHER', 4),
  ('PROPERTY_INTERMEDIARY', 'AGENCY', 1), ('PROPERTY_INTERMEDIARY', 'BROKER', 2), ('PROPERTY_INTERMEDIARY', 'NONE', 3)
) AS v (question, option, position)
JOIN question q ON q.code = v.question;

INSERT INTO answer_option_translation (answer_option_id, language, label)
SELECT ao.id, 'fr', v.label
FROM (VALUES
  ('PROPERTY_ROLE', 'BUYER', 'L''acheteur'), ('PROPERTY_ROLE', 'SELLER', 'Le vendeur'),
  ('PROPERTY_KIND', 'LAND', 'Terrain ou parcelle'), ('PROPERTY_KIND', 'HOUSE', 'Maison ou villa'),
  ('PROPERTY_KIND', 'APARTMENT', 'Appartement'), ('PROPERTY_KIND', 'COMMERCIAL', 'Local commercial'),
  ('PROPERTY_KIND', 'OTHER', 'Autre'),
  ('PROPERTY_PAPER_TYPE', 'LAND_TITLE', 'Titre foncier'), ('PROPERTY_PAPER_TYPE', 'LEASE', 'Bail'),
  ('PROPERTY_PAPER_TYPE', 'DELIBERATION', 'Délibération'),
  ('PROPERTY_PAPER_TYPE', 'ADMINISTRATIVE_ACT', 'Acte administratif'),
  ('RENTAL_PROPERTY_KIND', 'HOUSE', 'Maison ou villa'), ('RENTAL_PROPERTY_KIND', 'APARTMENT', 'Appartement'),
  ('RENTAL_PROPERTY_KIND', 'COMMERCIAL', 'Local commercial'), ('RENTAL_PROPERTY_KIND', 'OTHER', 'Autre'),
  ('PROPERTY_INTERMEDIARY', 'AGENCY', 'Oui, une agence immobilière'),
  ('PROPERTY_INTERMEDIARY', 'BROKER', 'Oui, un courtier ou un démarcheur'),
  ('PROPERTY_INTERMEDIARY', 'NONE', 'Non, directement')
) AS v (question, option, label)
JOIN question q ON q.code = v.question
JOIN answer_option ao ON ao.question_id = q.id AND ao.code = v.option;

INSERT INTO question_set (code) VALUES ('PROPERTY_SALE'), ('PROPERTY_RENTAL'), ('PROPERTY_LETTING');

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, v.position
FROM (VALUES
  ('PROPERTY_SALE', 'PROPERTY_ROLE', 1), ('PROPERTY_SALE', 'PROPERTY_KIND', 2),
  ('PROPERTY_SALE', 'PROPERTY_PAPER_TYPE', 3), ('PROPERTY_SALE', 'PROPERTY_INTERMEDIARY', 4),
  ('PROPERTY_RENTAL', 'RENTAL_PROPERTY_KIND', 1), ('PROPERTY_RENTAL', 'PROPERTY_INTERMEDIARY', 2),
  ('PROPERTY_LETTING', 'RENTAL_PROPERTY_KIND', 1), ('PROPERTY_LETTING', 'PROPERTY_INTERMEDIARY', 2)
) AS v (list, question, position)
JOIN question_set qs ON qs.code = v.list
JOIN question q ON q.code = v.question;

-- The sector's questions (COMMERCE) for « Autre démarche » only: the services
-- ask theirs alone, then the common ones.
UPDATE sector_question_set SET only_without_service = true
WHERE sector_id = (SELECT id FROM sector WHERE code = 'REAL_ESTATE');

INSERT INTO service_question_set (service_id, question_set_id, position)
SELECT s.id, qs.id, 1
FROM service s JOIN question_set qs ON qs.code = s.code
WHERE s.code IN ('PROPERTY_SALE', 'PROPERTY_RENTAL', 'PROPERTY_LETTING');

-- A topic opened by several answers of its question (an agency or a broker).
-- The index of 0011 allowed one answer only, though meant to keep one question
-- per topic, and screen 2b already shows a topic for any of its answers: a
-- trigger now keeps the rule.
DROP INDEX topic_condition_one_question;

CREATE FUNCTION topic_condition_one_question() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM topic_condition
             WHERE topic_id = NEW.topic_id AND depends_on_question_id <> NEW.depends_on_question_id) THEN
    RAISE EXCEPTION 'topic % already depends on another question', NEW.topic_id;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER topic_condition_one_question BEFORE INSERT OR UPDATE ON topic_condition
FOR EACH ROW EXECUTE FUNCTION topic_condition_one_question();

-- The commission and the agency's management open with an intermediary.
INSERT INTO topic_condition (topic_id, depends_on_question_id, option_id)
SELECT t.id, q.id, o.id
FROM topic t, question q
JOIN answer_option o ON o.question_id = q.id AND o.code IN ('AGENCY', 'BROKER')
WHERE t.code IN ('AGENT_COMMISSION', 'AGENCY_MANAGEMENT') AND q.code = 'PROPERTY_INTERMEDIARY';
