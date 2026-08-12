-- PHFP App schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- ========== Enums ==========

create type user_role as enum ('admin', 'marketing', 'accounting', 'student', 'volunteer');
create type course_series as enum ('healing', 'spirituality', 'prosperity', 'arhatic_yoga');
create type enrollment_status as enum ('registered', 'waitlisted', 'completed', 'cancelled');

-- ========== Tables ==========

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  series course_series not null,
  duration_days int not null default 1,
  description text,
  created_at timestamptz not null default now()
);

-- A course can require multiple prerequisite courses (e.g. Arhatic Yoga Preparatory
-- requires BPH + APH + PSY + AOHS all completed).
create table course_prerequisites (
  course_id uuid not null references courses(id) on delete cascade,
  prerequisite_course_id uuid not null references courses(id) on delete cascade,
  primary key (course_id, prerequisite_course_id)
);

-- A scheduled batch/run of a course that students actually enroll into.
create table course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  start_date date not null,
  end_date date,
  location text,
  is_online boolean not null default false,
  capacity int,
  price numeric(10,2),
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  course_offering_id uuid not null references course_offerings(id) on delete cascade,
  status enrollment_status not null default 'registered',
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_offering_id)
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  file_url text,
  issued_date date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== Auto-create a profile row when someone signs up ==========

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== Role-check helpers (used by RLS policies) ==========

create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'marketing', 'accounting')
  );
$$ language sql security definer stable;

-- ========== Row Level Security ==========

alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_prerequisites enable row level security;
alter table course_offerings enable row level security;
alter table enrollments enable row level security;
alter table certificates enable row level security;

-- profiles: everyone can see their own row; staff can see/manage all
create policy "View own profile" on profiles for select using (auth.uid() = id);
create policy "Staff view all profiles" on profiles for select using (public.is_staff());
create policy "Update own profile" on profiles for update using (auth.uid() = id);
create policy "Admin update any profile" on profiles for update using (public.is_admin());

-- courses / prerequisites / offerings: public catalog, staff-managed
create policy "Anyone can view courses" on courses for select using (true);
create policy "Admin manages courses" on courses for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can view prerequisites" on course_prerequisites for select using (true);
create policy "Admin manages prerequisites" on course_prerequisites for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can view offerings" on course_offerings for select using (true);
create policy "Admin manages offerings" on course_offerings for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: students see/create their own; staff see and manage all
create policy "Students view own enrollments" on enrollments for select using (auth.uid() = student_id);
create policy "Students create own enrollment" on enrollments for insert with check (auth.uid() = student_id);
create policy "Staff view all enrollments" on enrollments for select using (public.is_staff());
create policy "Staff manage enrollments" on enrollments for update using (public.is_staff());
create policy "Staff delete enrollments" on enrollments for delete using (public.is_staff());

-- certificates: students see/upload their own; staff manage all (verification)
create policy "Students view own certificates" on certificates for select using (auth.uid() = student_id);
create policy "Students upload own certificate" on certificates for insert with check (auth.uid() = student_id);
create policy "Staff manage all certificates" on certificates for all using (public.is_staff()) with check (public.is_staff());

-- ========== Seed: real PHFP course catalog ==========

insert into courses (code, name, series, duration_days) values
  ('ICR', 'Inner Teaching of Christianity Revealed', 'spirituality', 1),
  ('ITB', 'Inner Teachings of Buddhism Revealed', 'spirituality', 1),
  ('MLP', 'Meditation on the Lord''s Prayer', 'spirituality', 1),
  ('OMPH', 'Om Mani Padme Hum', 'spirituality', 1),
  ('ITH', 'Inner Teaching of Hinduism Revealed', 'spirituality', 1),
  ('SEM', 'Spiritual Essence of Man', 'spirituality', 1),
  ('AOHS', 'Achieving Oneness with the Higher Soul', 'spirituality', 2),
  ('BPH', 'Basic Pranic Healing', 'healing', 2),
  ('APH', 'Advanced Pranic Healing', 'healing', 2),
  ('PSY', 'Pranic Psychotherapy', 'healing', 2),
  ('PCH', 'Pranic Crystal Healing', 'healing', 1),
  ('PSD', 'Psychic Self Defense', 'healing', 1),
  ('SBM', 'Spiritual Business Management', 'prosperity', 1),
  ('PFS', 'Pranic Feng Shui', 'prosperity', 1),
  ('KRIYA', 'Kriyashakti', 'prosperity', 2),
  ('AYP', 'Arhatic Yoga Preparatory', 'arhatic_yoga', 2),
  ('AY1', 'Arhatic Yoga Level 1', 'arhatic_yoga', 1),
  ('AY2', 'Arhatic Yoga Level 2', 'arhatic_yoga', 1),
  ('HC', 'Higher Clairvoyance', 'arhatic_yoga', 1);

insert into course_prerequisites (course_id, prerequisite_course_id)
select c.id, p.id from courses c, courses p where
  (c.code = 'APH' and p.code = 'BPH') or
  (c.code = 'PSY' and p.code = 'APH') or
  (c.code = 'PCH' and p.code = 'PSY') or
  (c.code = 'SBM' and p.code = 'BPH') or
  (c.code = 'PSD' and p.code = 'APH') or
  (c.code = 'PFS' and p.code = 'APH') or
  (c.code = 'AYP' and p.code in ('BPH', 'APH', 'PSY', 'AOHS')) or
  (c.code = 'KRIYA' and p.code = 'AYP') or
  (c.code = 'AY1' and p.code = 'AYP') or
  (c.code = 'AY2' and p.code = 'AY1') or
  (c.code = 'HC' and p.code = 'AY2');
