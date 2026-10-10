-- 0077: the retail forms (decided by Olivia, 2026-10-10,
-- /mnt/project-files/questionnaire/validation-commerce.md):
--   supermarket: the products' choice and freshness, the price at the till;
--   fuel station: the quantity served, the fuel available;
--   gaming: the payment of winnings.

INSERT INTO topic (code, position, category_id)
SELECT v.code, (SELECT max(position) FROM topic) + v.rank, c.id
FROM (VALUES
  ('PRODUCT_CHOICE', 1, 'SERVICE_QUALITY'),
  ('PRODUCT_FRESHNESS', 2, 'SERVICE_QUALITY'),
  ('CHECKOUT_PRICE', 3, 'COST'),
  ('FUEL_QUANTITY', 4, 'COST'),
  ('FUEL_AVAILABLE', 5, 'SERVICE_QUALITY'),
  ('WINNINGS_PAYMENT', 6, 'SERVICE_QUALITY')
) AS v (code, rank, category)
JOIN evaluation_category c ON c.code = v.category;

INSERT INTO topic_translation (topic_id, language, label)
SELECT t.id, 'fr', v.label
FROM (VALUES
  ('PRODUCT_CHOICE', 'Choix et disponibilité des produits'),
  ('PRODUCT_FRESHNESS', 'Fraîcheur et dates de péremption'),
  ('CHECKOUT_PRICE', 'Prix en caisse identique au prix affiché'),
  ('FUEL_QUANTITY', 'Quantité servie (compteur remis à zéro, litres justes)'),
  ('FUEL_AVAILABLE', 'Carburant disponible'),
  ('WINNINGS_PAYMENT', 'Paiement des gains (rapide, complet)')
) AS v (code, label)
JOIN topic t ON t.code = v.code;

INSERT INTO topic_set (code) VALUES ('SUPERMARKET'), ('FUEL_STATION'), ('GAMING');

INSERT INTO topic_set_item (topic_set_id, topic_id)
SELECT s.id, t.id
FROM (VALUES
  ('SUPERMARKET', 'PRODUCT_CHOICE'), ('SUPERMARKET', 'PRODUCT_FRESHNESS'), ('SUPERMARKET', 'CHECKOUT_PRICE'),
  ('FUEL_STATION', 'FUEL_QUANTITY'), ('FUEL_STATION', 'FUEL_AVAILABLE'),
  ('GAMING', 'WINNINGS_PAYMENT')
) AS v (list, topic)
JOIN topic_set s ON s.code = v.list
JOIN topic t ON t.code = v.topic;

INSERT INTO establishment_type_topic_set (type_id, topic_set_id, position)
SELECT et.id, ts.id, 1 FROM establishment_type et JOIN topic_set ts ON ts.code = et.code
WHERE et.code IN ('SUPERMARKET', 'FUEL_STATION', 'GAMING');
