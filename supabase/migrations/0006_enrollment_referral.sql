-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Captures who referred a student to a specific course at enrollment time,
-- for the admin roster CSV export.
alter table enrollments add column if not exists referred_by text;
