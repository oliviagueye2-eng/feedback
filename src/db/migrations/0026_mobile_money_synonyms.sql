-- 0026: searching « wave » listed Orange and Yas next to Wave, because the
-- service MOBILE_MONEY (0025), which all three offer, had the brand names
-- Orange Money, Wave and Mixx among its synonyms. A brand name belongs to its
-- own organisation (Wave's name, « Orange Money » and « Mixx by Yas » are
-- already the synonyms of Wave, Orange and Yas), so the service keeps only
-- everyday words.
UPDATE service
SET synonyms = '{mobile money,transfert,envoi d''argent,paiement,retrait,dépôt}'
WHERE code = 'MOBILE_MONEY';
