-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Temporary: lets an admin drag course boxes on the course path diagram to
-- fine-tune positions. Once the layout looks right, the final coordinates
-- get baked into the static default layout and this table/feature goes away.
create table if not exists course_layout_positions (
  course_id uuid primary key references courses(id) on delete cascade,
  x numeric not null,
  y numeric not null,
  updated_at timestamptz not null default now()
);

alter table course_layout_positions enable row level security;

create policy "Anyone can view course layout positions" on course_layout_positions
  for select using (true);
create policy "Admin manages course layout positions" on course_layout_positions
  for all using (public.is_admin()) with check (public.is_admin());

-- Per-arrow overrides: lets an admin drag an arrow's start/end point away
-- from its default box-edge attachment, and/or add a brand-new arrow that
-- isn't derived from the real prerequisite data (is_custom = true).
-- null start_x/start_y (or end_x/end_y) means "keep following the box".
create table if not exists course_layout_edges (
  from_course_id uuid not null references courses(id) on delete cascade,
  to_course_id uuid not null references courses(id) on delete cascade,
  start_x numeric,
  start_y numeric,
  end_x numeric,
  end_y numeric,
  is_custom boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (from_course_id, to_course_id)
);

alter table course_layout_edges enable row level security;

create policy "Anyone can view course layout edges" on course_layout_edges
  for select using (true);
create policy "Admin manages course layout edges" on course_layout_edges
  for all using (public.is_admin()) with check (public.is_admin());
