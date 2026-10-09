-- 0053: a sector's lists for « Autre démarche » (decided by Olivia,
-- 2026-10-09). A sector's list goes to every path of the sector, or, marked
-- only_without_service, only to a feedback without a service (« Autre
-- démarche », or an establishment offering none, like the airport). It
-- replaces service.replaces_shared_lists (0026), set on every service of the
-- Water, Electricity and Mobile payment sectors: their sectors' lists only
-- served « Autre démarche ». A user sees the same forms.
--   Water, Electricity, Mobile payment: all their lists, without service.
--   Transport: FEES without service; the rides and the trips have
--   FEES_SHOWN_ALWAYS (0047), the port FEES through its service.
-- COMMON (empty since 0034) now goes to the mobile money services too.

ALTER TABLE sector_topic_set ADD COLUMN only_without_service boolean NOT NULL DEFAULT false;
ALTER TABLE sector_question_set ADD COLUMN only_without_service boolean NOT NULL DEFAULT false;

UPDATE sector_topic_set SET only_without_service = true
WHERE sector_id IN (SELECT id FROM sector WHERE code IN ('WATER', 'ELECTRICITY', 'MOBILE_PAYMENT'))
   OR (sector_id = (SELECT id FROM sector WHERE code = 'TRANSPORT')
       AND topic_set_id = (SELECT id FROM topic_set WHERE code = 'FEES'));

UPDATE sector_question_set SET only_without_service = true
WHERE sector_id IN (SELECT id FROM sector WHERE code IN ('WATER', 'ELECTRICITY', 'MOBILE_PAYMENT'));

ALTER TABLE service DROP COLUMN replaces_shared_lists;
