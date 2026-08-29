-- Same pattern as course_offerings' instructor_id/instructor_name (0011):
-- a student self-reporting a past certificate can pick a real instructor
-- profile, or type a name for someone not yet in the system.
alter table certificates
  add column if not exists instructor_id uuid references profiles(id) on delete set null,
  add column if not exists instructor_name text;
