-- « Bien » on « Coupures d'eau » read both ways (validated on 2026-10-04,
-- option B): the topic names what is rated, the supply, not the problem.
UPDATE topic_translation tt SET label = v.label
FROM (VALUES
  ('POWER_CUTS', 'Fourniture du courant (sans coupures)'),
  ('WATER_CUTS', 'Distribution de l''eau (sans coupures)')
) AS v (code, label)
JOIN topic t ON t.code = v.code
WHERE tt.topic_id = t.id AND tt.language = 'fr';
