-- « Mobile money » leaves « Votre avis porte surtout sur : » of the telecom
-- operators: mobile money has its own service since 0025 (validated by Olivia
-- on 2026-10-06). The option stays for the answers already given, and is no
-- longer offered, like « Je n'ai rien payé » (0011).
UPDATE answer_option SET is_active = false
WHERE code = 'MOBILE_MONEY'
  AND question_id = (SELECT id FROM question WHERE code = 'TELECOM_SUBJECT');
