-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Requires 0007 and 0008 to have already been run.
--
-- Fixes a design mistake in 0007/0008: 'instructor' and 'center_manager'
-- were added as `role` values, which would have replaced a person's
-- 'student' role and locked them out of the student portal. Instead, a
-- staff position is a permission layered ON TOP of whatever role someone
-- already has (almost always 'student') — their role never changes.

create type staff_position as enum ('instructor', 'center_manager');

alter table profiles add column if not exists staff_position staff_position;

-- Replaces the 0008 version, which incorrectly checked `role`.
create or replace function public.can_manage_region(target_region_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        role = 'admin'
        or (staff_position in ('instructor', 'center_manager') and managed_region_id = target_region_id)
      )
  );
$$ language sql security definer stable;
