-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Requires 0007_add_region_staff_roles.sql to have already been run.

-- ========== Regions (PHFP centers) ==========

create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  city text,
  is_main_center boolean not null default false,
  created_at timestamptz not null default now()
);

insert into regions (name, code, city, is_main_center) values
  ('National Capital Region', 'NCR', 'Ortigas, Pasig', true),
  ('South Luzon Pranic Healing and Training Center', 'SOUTH_LUZON', 'Santa Rosa, Laguna', false),
  ('North Luzon Pranic Healing and Training Center', 'NORTH_LUZON', 'La Union', false),
  ('Region 1 Baguio Pranic Healing and Training Center', 'BAGUIO', 'Baguio', false),
  ('Central Visayas Pranic Healing and Training Center', 'CENTRAL_VISAYAS', 'Cebu City', false),
  ('Mindanao Pranic Healing and Training Center', 'MINDANAO', 'Davao City', false)
on conflict (code) do nothing;

alter table regions enable row level security;
create policy "Anyone can view regions" on regions for select using (true);
create policy "Admin manages regions" on regions for all using (public.is_admin()) with check (public.is_admin());

-- ========== Region scoping on profiles ==========

-- region_id: the student's home region (from the profile intake form).
-- managed_region_id: for instructor/center_manager staff, the one region
-- they're allowed to create classes/events in and view students for.
alter table profiles add column if not exists region_id uuid references regions(id);
alter table profiles add column if not exists managed_region_id uuid references regions(id);

create or replace function public.can_manage_region(target_region_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        role = 'admin'
        or (role in ('instructor', 'center_manager') and managed_region_id = target_region_id)
      )
  );
$$ language sql security definer stable;

-- Region staff can see the profiles of students based in their region.
create policy "Region staff view profiles in their region" on profiles
  for select using (public.can_manage_region(region_id));

-- ========== Region scoping on course_offerings ==========

alter table course_offerings add column if not exists region_id uuid references regions(id);
alter table course_offerings add column if not exists created_by uuid references profiles(id);

create policy "Region staff manage own-region offerings" on course_offerings
  for all using (public.can_manage_region(region_id)) with check (public.can_manage_region(region_id));

create policy "Region staff view enrollments for their region's offerings" on enrollments
  for select using (
    exists (
      select 1 from course_offerings o
      where o.id = enrollments.course_offering_id
        and public.can_manage_region(o.region_id)
    )
  );

-- ========== Events (separate from course offerings) ==========

create type event_type as enum ('one_time', 'special', 'weekly');

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type event_type not null default 'one_time',
  region_id uuid references regions(id), -- null = nationwide
  start_date date not null,
  end_date date,
  is_online boolean not null default false,
  location text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "Anyone can view events" on events for select using (true);
create policy "Admin manages all events" on events
  for all using (public.is_admin()) with check (public.is_admin());
-- Region staff can only manage events tied to their own region (never
-- nationwide ones — region_id is not null enforces that).
create policy "Region staff manage own-region events" on events
  for all
  using (region_id is not null and public.can_manage_region(region_id))
  with check (region_id is not null and public.can_manage_region(region_id));
