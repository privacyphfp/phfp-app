-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Run this one on its own (Postgres won't let a new enum value be used in
-- the same transaction it was added in) — then run 0008 after.
--
-- NOTE: these two enum values end up unused — 0009_staff_position.sql
-- reworks instructor/center_manager into a separate `staff_position` column
-- instead of a `role` value, so a center manager doesn't lose their
-- 'student' role (and student-portal access) by being promoted. Harmless
-- to leave them here; nothing reads them going forward.
alter type user_role add value if not exists 'instructor';
alter type user_role add value if not exists 'center_manager';
