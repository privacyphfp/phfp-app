-- Course offerings can name an instructor either by picking an existing
-- instructor profile, or by typing a name for someone not yet in the system.
alter table course_offerings
  add column if not exists instructor_id uuid references profiles(id) on delete set null,
  add column if not exists instructor_name text;
