-- 0042: « Avez-vous pu payer comme vous le souhaitiez (espèces, paiement
-- mobile…) ? » also asked after a VTC or a taxi ride (decided by Olivia,
-- 2026-10-08): no change, mobile payment refused. The same question as for
-- buying a ticket, so that the answers add up. Last, as one pays at the end.

INSERT INTO question_set_item (question_set_id, question_id, position)
SELECT qs.id, q.id, 4
FROM question_set qs, question q
WHERE qs.code IN ('APP_RIDE', 'STREET_TAXI_RIDE') AND q.code = 'PAYMENT_AS_WISHED';
