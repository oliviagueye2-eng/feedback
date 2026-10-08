-- 0033: the lists GENERIC are renamed COMMERCE (decided by Olivia,
-- 2026-10-08), the topic list and the question list alike. They serve the 7
-- private sectors (retail, food service, hospitality, culture, sport, tourism,
-- real estate) and an establishment whose sector is unknown. Only the code
-- changes: same ids, same items, nothing changes for a user or in the results.

UPDATE topic_set SET code = 'COMMERCE' WHERE code = 'GENERIC';
UPDATE question_set SET code = 'COMMERCE' WHERE code = 'GENERIC';
