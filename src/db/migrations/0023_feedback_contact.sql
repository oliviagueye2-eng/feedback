-- 0023: the user's e-mail or phone number, asked on the last screen « Envoyer
-- mon avis » with a statement on honour (decided by Olivia, 2026-10-05: the
-- feedbacks are no longer anonymous, to make them more reliable and limit
-- abuse). No verification code for now. Kept apart from the feedback so it
-- can be deleted on its own (12 months after the last feedback, proposed in
-- the privacy policy); never published, never shown to the establishment.

CREATE TABLE feedback_contact (
  feedback_id uuid PRIMARY KEY REFERENCES feedback (id),
  kind        text NOT NULL CHECK (kind IN ('email', 'phone')),
  -- Normalized: an e-mail in lower case, a phone number as +221 and 9 digits.
  value       text NOT NULL CHECK (char_length(value) BETWEEN 6 AND 254),
  -- When the user ticked « J'atteste sur l'honneur… », rounded to the hour like started_at.
  attested_at timestamptz NOT NULL DEFAULT date_trunc('hour', now())
              CHECK (attested_at = date_trunc('hour', attested_at))
);

-- To find the feedbacks of one person (a request to delete, a series of abuse).
CREATE INDEX feedback_contact_value ON feedback_contact (kind, value);
