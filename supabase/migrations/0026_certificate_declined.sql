-- Lets staff decline a certificate submission (typo, wrong file, doesn't
-- match records) instead of leaving it stuck pending forever. A declined
-- certificate is excluded from the admin "pending approvals" queue (staff
-- already acted on it) and the student sees it as declined with a chance
-- to submit a new one — certificates has no unique constraint on
-- (student_id, course_id), so a resubmission is just a fresh row.
alter table certificates add column if not exists declined boolean not null default false;
