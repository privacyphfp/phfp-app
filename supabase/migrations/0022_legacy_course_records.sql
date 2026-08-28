-- Historical "who took what" records from before this app existed. Plain
-- text student_name and course_code (not foreign keys) on purpose: this
-- table is meant to be filled by importing a CSV export directly via the
-- Supabase Table Editor's "Insert -> Import data from CSV" — no manual
-- id-lookups required, and a typo'd course_code just fails to resolve to
-- a course later instead of blocking the whole import.
--
-- Matching a record to an actual student account is a staff-confirmed
-- step (see app/admin/students/[id]/page.js), not automatic — a name
-- alone isn't a reliable enough match to auto-verify a course completion.
create table legacy_course_records (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  course_code text not null,
  completed_date date,
  region text,
  notes text,
  matched_profile_id uuid references profiles(id) on delete set null,
  resolved boolean not null default false,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table legacy_course_records enable row level security;

-- Staff-only in both directions: this table can contain names of people
-- who never even signed up for the app, so it's not something to expose
-- via any student-facing policy.
create policy "Staff manage legacy course records" on legacy_course_records
  for all using (public.is_staff()) with check (public.is_staff());
