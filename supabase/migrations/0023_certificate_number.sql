-- A free-text field for the number printed on the physical certificate
-- (e.g. "BPH031-2018"), filled in by staff for record-keeping and report
-- export. Not used for verification/matching — see 0022's name-based
-- legacy_course_records flow for that.
alter table certificates add column if not exists certificate_number text;
