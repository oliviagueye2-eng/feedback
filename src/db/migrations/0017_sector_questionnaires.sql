-- Detailed questionnaires of the other sectors (validated 2026-10-01, as
-- proposed): facts, all optional, on screen 6. Same codes and answers from one
-- sector to another where the question is the same (GOAL_ACHIEVED, WAIT_TIME,
-- RECEIPT_GIVEN…), so the sectors can be compared. Never ask what the chosen
-- establishment already says (the means of transport, for instance).
-- Generated from one description to avoid copying mistakes.
--
-- - Impôts et domaines, Justice, Emploi et protection sociale: the five
--   questions of Administration (0016), one questionnaire each.
-- - Éducation, Électricité, Eau, Télécoms, Transport, Banques et assurances.
-- - GENERIC (draft since 0002) gets its questions and is published: used by
--   every sector without its own (commerce, hôtellerie, restauration,
--   tourisme, culture, sport, immobilier) and establishments without a sector.
-- - Sécurité: not validated (to see with the operating body). An empty
--   questionnaire keeps it from GENERIC (« le prix vous a-t-il semblé
--   juste ? » has no place at a police station): no question page for now.


-- TAX

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('TAX', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1), 'GOAL_ACHIEVED', 'yes_partial_no', 1),
  ((SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1), 'VISITS_COUNT', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1), 'WAIT_TIME', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1), 'DOCUMENTS_KNOWN', 'yes_partial_no', 4),
  ((SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1), 'RECEIPT_GIVEN', 'single_choice', 5);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'fr', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT'), 'fr', 'Combien de fois êtes-vous venu(e) pour cette démarche ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), 'fr', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'fr', 'Saviez-vous à l''avance quels papiers apporter ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'fr', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT'), 'ONCE', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT'), 'TWICE', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT'), 'THREE_OR_MORE', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), 'UNDER_30_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), '30_MIN_TO_1_H', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), '1_TO_2_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), '2_TO_4_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME'), 'OVER_4_H', 5, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_ALL', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_SOME', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NOTHING_PAID', NULL, 4);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'ONCE'), 'fr', '1 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'TWICE'), 'fr', '2 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'THREE_OR_MORE'), 'fr', '3 fois ou plus'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME') AND code = 'UNDER_30_MIN'), 'fr', 'Moins de 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME') AND code = '1_TO_2_H'), 'fr', '1 à 2 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME') AND code = '2_TO_4_H'), 'fr', '2 à 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'WAIT_TIME') AND code = 'OVER_4_H'), 'fr', 'Plus de 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_ALL'), 'fr', 'Oui, pour tout'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_SOME'), 'fr', 'Pour une partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TAX' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé');

-- JUSTICE

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('JUSTICE', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1), 'GOAL_ACHIEVED', 'yes_partial_no', 1),
  ((SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1), 'VISITS_COUNT', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1), 'WAIT_TIME', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1), 'DOCUMENTS_KNOWN', 'yes_partial_no', 4),
  ((SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1), 'RECEIPT_GIVEN', 'single_choice', 5);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'fr', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT'), 'fr', 'Combien de fois êtes-vous venu(e) pour cette démarche ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), 'fr', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'fr', 'Saviez-vous à l''avance quels papiers apporter ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'fr', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT'), 'ONCE', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT'), 'TWICE', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT'), 'THREE_OR_MORE', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), 'UNDER_30_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), '30_MIN_TO_1_H', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), '1_TO_2_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), '2_TO_4_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME'), 'OVER_4_H', 5, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_ALL', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_SOME', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NOTHING_PAID', NULL, 4);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'ONCE'), 'fr', '1 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'TWICE'), 'fr', '2 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'THREE_OR_MORE'), 'fr', '3 fois ou plus'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'UNDER_30_MIN'), 'fr', 'Moins de 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME') AND code = '1_TO_2_H'), 'fr', '1 à 2 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME') AND code = '2_TO_4_H'), 'fr', '2 à 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'OVER_4_H'), 'fr', 'Plus de 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_ALL'), 'fr', 'Oui, pour tout'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_SOME'), 'fr', 'Pour une partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'JUSTICE' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé');

-- SOCIAL

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('SOCIAL', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1), 'GOAL_ACHIEVED', 'yes_partial_no', 1),
  ((SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1), 'VISITS_COUNT', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1), 'WAIT_TIME', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1), 'DOCUMENTS_KNOWN', 'yes_partial_no', 4),
  ((SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1), 'RECEIPT_GIVEN', 'single_choice', 5);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'fr', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT'), 'fr', 'Combien de fois êtes-vous venu(e) pour cette démarche ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), 'fr', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'fr', 'Saviez-vous à l''avance quels papiers apporter ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'fr', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT'), 'ONCE', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT'), 'TWICE', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT'), 'THREE_OR_MORE', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), 'UNDER_30_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), '30_MIN_TO_1_H', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), '1_TO_2_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), '2_TO_4_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME'), 'OVER_4_H', 5, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_ALL', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_SOME', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NOTHING_PAID', NULL, 4);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'ONCE'), 'fr', '1 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'TWICE'), 'fr', '2 fois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'VISITS_COUNT') AND code = 'THREE_OR_MORE'), 'fr', '3 fois ou plus'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME') AND code = 'UNDER_30_MIN'), 'fr', 'Moins de 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME') AND code = '1_TO_2_H'), 'fr', '1 à 2 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME') AND code = '2_TO_4_H'), 'fr', '2 à 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'WAIT_TIME') AND code = 'OVER_4_H'), 'fr', 'Plus de 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'DOCUMENTS_KNOWN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_ALL'), 'fr', 'Oui, pour tout'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_SOME'), 'fr', 'Pour une partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'SOCIAL' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé');

-- EDUCATION

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('EDUCATION', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1), 'RESPONDENT', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1), 'CLASSES_HELD', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1), 'CLASS_SIZE', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1), 'FACILITIES', 'yes_partial_no', 4),
  ((SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1), 'RECEIPT_GIVEN', 'single_choice', 5);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT'), 'fr', 'Vous êtes :'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD'), 'fr', 'Les cours ont-ils eu lieu comme prévu ces dernières semaines ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE'), 'fr', 'Combien d''élèves y a-t-il dans la classe ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES'), 'fr', 'Les toilettes et l''eau fonctionnent-elles ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'fr', 'Vous a-t-on donné un reçu pour ce que vous avez payé ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT'), 'STUDENT', NULL, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT'), 'PARENT', NULL, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT'), 'OTHER', NULL, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD'), 'SOME_ABSENCES', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD'), 'MANY_ABSENCES', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE'), 'UNDER_40', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE'), '40_TO_60', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE'), 'OVER_60', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE'), 'DONT_KNOW', NULL, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_ALL', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'FOR_SOME', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN'), 'NOTHING_PAID', NULL, 4);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT') AND code = 'STUDENT'), 'fr', 'Élève ou étudiant(e)'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT') AND code = 'PARENT'), 'fr', 'Parent'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RESPONDENT') AND code = 'OTHER'), 'fr', 'Autre'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD') AND code = 'SOME_ABSENCES'), 'fr', 'Quelques absences'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASSES_HELD') AND code = 'MANY_ABSENCES'), 'fr', 'Beaucoup d''absences'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE') AND code = 'UNDER_40'), 'fr', 'Moins de 40'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE') AND code = '40_TO_60'), 'fr', '40 à 60'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE') AND code = 'OVER_60'), 'fr', 'Plus de 60'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'CLASS_SIZE') AND code = 'DONT_KNOW'), 'fr', 'Je ne sais pas'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'FACILITIES') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_ALL'), 'fr', 'Oui, pour tout'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'FOR_SOME'), 'fr', 'Pour une partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'EDUCATION' AND version = 1) AND code = 'RECEIPT_GIVEN') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé');

-- ELECTRICITY

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('ELECTRICITY', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1), 'SUBJECT', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1), 'CUTS_COUNT', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1), 'CUT_NOTICE', 'single_choice', 3),
  ((SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1), 'PREPAID_METER', 'single_choice', 4);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT'), 'fr', 'Votre avis porte surtout sur :'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), 'fr', 'Combien de coupures avez-vous eues ce mois-ci ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), 'fr', 'Avez-vous été prévenu(e) avant la coupure ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'PREPAID_METER'), 'fr', 'Avez-vous un compteur Woyofal (prépayé) ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT'), 'CUT', NULL, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT'), 'BILL', NULL, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT'), 'CONNECTION', NULL, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT'), 'OTHER', NULL, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), 'NONE', 0, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), '1_TO_3', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), '4_TO_10', 2, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), 'OVER_10', 3, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), 'SOMETIMES', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'PREPAID_METER'), 'YES', NULL, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'PREPAID_METER'), 'NO', NULL, 2);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT') AND code = 'CUT'), 'fr', 'Une coupure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT') AND code = 'BILL'), 'fr', 'Une facture'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT') AND code = 'CONNECTION'), 'fr', 'Un branchement ou un compteur'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'SUBJECT') AND code = 'OTHER'), 'fr', 'Autre chose'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = 'NONE'), 'fr', 'Aucune'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = '1_TO_3'), 'fr', '1 à 3'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = '4_TO_10'), 'fr', '4 à 10'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = 'OVER_10'), 'fr', 'Plus de 10'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'SOMETIMES'), 'fr', 'Parfois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'PREPAID_METER') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'PREPAID_METER') AND code = 'NO'), 'fr', 'Non');

INSERT INTO question_condition (question_id, depends_on_question_id, option_id) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = '1_TO_3')),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = '4_TO_10')),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'ELECTRICITY' AND version = 1) AND code = 'CUTS_COUNT') AND code = 'OVER_10'));

-- WATER

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('WATER', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1), 'SUBJECT', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1), 'DAYS_WITHOUT_WATER', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1), 'CUT_NOTICE', 'single_choice', 3);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT'), 'fr', 'Votre avis porte surtout sur :'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), 'fr', 'Combien de jours sans eau ce mois-ci ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), 'fr', 'Avez-vous été prévenu(e) avant la coupure ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT'), 'CUT', NULL, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT'), 'BILL', NULL, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT'), 'CONNECTION', NULL, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT'), 'OTHER', NULL, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), 'NONE', 0, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), '1_TO_3', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), '4_TO_10', 2, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), 'OVER_10', 3, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), 'SOMETIMES', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), 'NO', 1, 3);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT') AND code = 'CUT'), 'fr', 'Une coupure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT') AND code = 'BILL'), 'fr', 'Une facture'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT') AND code = 'CONNECTION'), 'fr', 'Un branchement ou un compteur'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'SUBJECT') AND code = 'OTHER'), 'fr', 'Autre chose'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = 'NONE'), 'fr', 'Aucun'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = '1_TO_3'), 'fr', '1 à 3'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = '4_TO_10'), 'fr', '4 à 10'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = 'OVER_10'), 'fr', 'Plus de 10'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'SOMETIMES'), 'fr', 'Parfois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE') AND code = 'NO'), 'fr', 'Non');

INSERT INTO question_condition (question_id, depends_on_question_id, option_id) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = '1_TO_3')),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = '4_TO_10')),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'CUT_NOTICE'), (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER'), (SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'WATER' AND version = 1) AND code = 'DAYS_WITHOUT_WATER') AND code = 'OVER_10'));

-- TELECOM

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('TELECOM', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1), 'SUBJECT', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1), 'NETWORK_LOSS', 'single_choice', 2);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'fr', 'Votre avis porte surtout sur :'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS'), 'fr', 'À quelle fréquence perdez-vous le réseau ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'CALLS_SMS', NULL, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'MOBILE_INTERNET', NULL, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'MOBILE_MONEY', NULL, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'HOME_INTERNET', NULL, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT'), 'BILLING', NULL, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS'), 'NEVER', 4, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS'), 'SOMETIMES', 3, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS'), 'OFTEN', 2, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS'), 'DAILY', 1, 4);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT') AND code = 'CALLS_SMS'), 'fr', 'Appels et SMS'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT') AND code = 'MOBILE_INTERNET'), 'fr', 'Internet mobile'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT') AND code = 'MOBILE_MONEY'), 'fr', 'Mobile money'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT') AND code = 'HOME_INTERNET'), 'fr', 'Internet à la maison'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'SUBJECT') AND code = 'BILLING'), 'fr', 'Facture ou crédit'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS') AND code = 'NEVER'), 'fr', 'Jamais'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS') AND code = 'SOMETIMES'), 'fr', 'Parfois'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS') AND code = 'OFTEN'), 'fr', 'Souvent'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TELECOM' AND version = 1) AND code = 'NETWORK_LOSS') AND code = 'DAILY'), 'fr', 'Tous les jours');

-- TRANSPORT

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('TRANSPORT', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1), 'STOP_WAIT', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1), 'CROWDED', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1), 'TICKET_GIVEN', 'single_choice', 3);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT'), 'fr', 'Combien de temps avez-vous attendu à l''arrêt ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED'), 'fr', 'Le véhicule était-il bondé ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN'), 'fr', 'Vous a-t-on donné un ticket pour votre trajet ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT'), 'UNDER_10_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT'), '10_TO_30_MIN', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT'), '30_MIN_TO_1_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT'), 'OVER_1_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED'), 'NO', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED'), 'A_LITTLE', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED'), 'VERY', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN'), 'YES', 2, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN'), 'NO', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN'), 'NOT_EXPECTED', NULL, 3);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT') AND code = 'UNDER_10_MIN'), 'fr', 'Moins de 10 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT') AND code = '10_TO_30_MIN'), 'fr', '10 à 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'STOP_WAIT') AND code = 'OVER_1_H'), 'fr', 'Plus d''1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED') AND code = 'A_LITTLE'), 'fr', 'Un peu'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'CROWDED') AND code = 'VERY'), 'fr', 'Beaucoup'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'TRANSPORT' AND version = 1) AND code = 'TICKET_GIVEN') AND code = 'NOT_EXPECTED'), 'fr', 'Ce n''était pas prévu');

-- BANKING_INSURANCE

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('BANKING_INSURANCE', 1, 'published', now());

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1), 'GOAL_ACHIEVED', 'yes_partial_no', 1),
  ((SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1), 'WAIT_TIME', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1), 'FEES_EXPLAINED', 'yes_partial_no', 3);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'fr', 'Avez-vous obtenu ce que vous étiez venu(e) chercher ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), 'fr', 'Combien de temps avez-vous attendu avant d''être reçu(e) ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED'), 'fr', 'Les frais vous ont-ils été expliqués clairement ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), 'UNDER_30_MIN', 1, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), '30_MIN_TO_1_H', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), '1_TO_2_H', 3, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), '2_TO_4_H', 4, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME'), 'OVER_4_H', 5, 5),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED'), 'PARTLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED'), 'NO', 1, 3);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'GOAL_ACHIEVED') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'UNDER_30_MIN'), 'fr', 'Moins de 30 minutes'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME') AND code = '30_MIN_TO_1_H'), 'fr', '30 minutes à 1 heure'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME') AND code = '1_TO_2_H'), 'fr', '1 à 2 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME') AND code = '2_TO_4_H'), 'fr', '2 à 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'WAIT_TIME') AND code = 'OVER_4_H'), 'fr', 'Plus de 4 heures'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED') AND code = 'PARTLY'), 'fr', 'En partie'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'BANKING_INSURANCE' AND version = 1) AND code = 'FEES_EXPLAINED') AND code = 'NO'), 'fr', 'Non');

-- GENERIC: questions first, then published.

INSERT INTO question (questionnaire_id, code, type, position) VALUES
  ((SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1), 'FAIR_PRICE', 'single_choice', 1),
  ((SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1), 'RECEIPT_OR_INVOICE', 'single_choice', 2),
  ((SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1), 'RECOMMEND', 'single_choice', 3);

INSERT INTO question_translation (question_id, language, label) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE'), 'fr', 'Le prix vous a-t-il semblé juste ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE'), 'fr', 'Vous a-t-on donné un reçu ou une facture ?'),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND'), 'fr', 'Recommanderiez-vous cet établissement à un proche ?');

INSERT INTO answer_option (question_id, code, value, position) VALUES
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE'), 'ROUGHLY', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE'), 'NO', 1, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE'), 'NOTHING_PAID', NULL, 4),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE'), 'YES', 2, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE'), 'NO', 1, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE'), 'NOTHING_PAID', NULL, 3),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND'), 'YES', 3, 1),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND'), 'MAYBE', 2, 2),
  ((SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND'), 'NO', 1, 3);

INSERT INTO answer_option_translation (answer_option_id, language, label) VALUES
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE') AND code = 'ROUGHLY'), 'fr', 'À peu près'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'FAIR_PRICE') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE') AND code = 'NO'), 'fr', 'Non'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECEIPT_OR_INVOICE') AND code = 'NOTHING_PAID'), 'fr', 'Je n''ai rien payé'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND') AND code = 'YES'), 'fr', 'Oui'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND') AND code = 'MAYBE'), 'fr', 'Peut-être'),
  ((SELECT id FROM answer_option WHERE question_id = (SELECT id FROM question WHERE questionnaire_id = (SELECT id FROM questionnaire WHERE code = 'GENERIC' AND version = 1) AND code = 'RECOMMEND') AND code = 'NO'), 'fr', 'Non');

UPDATE questionnaire SET status = 'published', published_at = now() WHERE code = 'GENERIC' AND version = 1;

-- SECURITY: published without questions until its questions are validated.

INSERT INTO questionnaire (code, version, status, published_at) VALUES ('SECURITY', 1, 'published', now());

-- Each sector uses its questionnaire.

UPDATE sector s
SET fallback_questionnaire_id = qn.id
FROM (VALUES
  ('TAX', 'TAX'),
  ('JUSTICE', 'JUSTICE'),
  ('SOCIAL', 'SOCIAL'),
  ('EDUCATION', 'EDUCATION'),
  ('ELECTRICITY', 'ELECTRICITY'),
  ('WATER', 'WATER'),
  ('TELECOM', 'TELECOM'),
  ('TRANSPORT', 'TRANSPORT'),
  ('BANKING_INSURANCE', 'BANKING_INSURANCE'),
  ('SECURITY', 'SECURITY')
) AS v (sector, questionnaire)
JOIN questionnaire qn ON qn.code = v.questionnaire AND qn.version = 1
WHERE s.code = v.sector;
