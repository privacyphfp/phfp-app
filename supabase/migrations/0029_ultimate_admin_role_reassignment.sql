-- 0028 made is_admin() cover Marketing/Accounting/Manager equally, which
-- also (as a side effect) let any of them reassign anyone's role, staff
-- position, or managed region via the prevent_role_self_escalation
-- trigger from 0021 — including promoting themselves or a peer to full
-- Admin. That's now scoped back down to just Admin and Manager, the
-- "ultimate" tier. Marketing and Accounting keep everything else
-- (courses, offerings, students, certificates, payments, reports) at
-- full parity with Admin — only role/position/region reassignment
-- requires the ultimate tier specifically.
create or replace function public.is_ultimate_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager')
  );
$$ language sql security definer stable;

create or replace function public.prevent_role_self_escalation()
returns trigger as $$
begin
  if (
    new.role <> old.role
    or new.staff_position is distinct from old.staff_position
    or new.managed_region_id is distinct from old.managed_region_id
  ) and not public.is_ultimate_admin() then
    raise exception 'Only an Admin or Manager can change a profile''s role, staff position, or managed region.';
  end if;
  return new;
end;
$$ language plpgsql security definer;
