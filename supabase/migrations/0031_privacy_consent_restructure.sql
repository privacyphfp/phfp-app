-- Restructures profile data collection into required / optional /
-- sensitive-with-specific-consent tiers, replacing the old single
-- drawn-signature "Data Protection and Privacy" block with granular,
-- purpose-specific consent checkboxes (see conversation for the full
-- required/optional/sensitive breakdown). The old privacy_signature /
-- privacy_agreed_at columns (0005) are left in place as a historical
-- record for whoever already signed that way — not used for new profiles
-- going forward.
alter table profiles
  add column if not exists privacy_notice_agreed_at timestamptz,
  add column if not exists religion_consent_agreed_at timestamptz,
  add column if not exists photo_consent_agreed_at timestamptz;

-- Enrollment-time confidentiality agreement: re-affirmed per course/event
-- being enrolled into, separate from the one-time profile-level NDA
-- (profiles.nda_signature).
alter table enrollments
  add column if not exists nda_signature text,
  add column if not exists nda_agreed_at timestamptz;
