-- Closes three self-service escalation gaps. Each existing policy checked
-- WHO was making the change (auth.uid() = their own row) but not WHAT they
-- were allowed to set on it — none of these are reachable through the
-- app's own UI, only by calling the Supabase client directly.

-- 1. A student could update their own profile row's `role` column
-- directly (e.g. to 'admin'), since "Update own profile" only checks
-- identity — same gap for `staff_position` and `managed_region_id`,
-- which together control which region's offerings/students an
-- instructor or center_manager can see and manage (can_manage_region
-- checks staff_position + managed_region_id, not role — see 0009).
-- All three are admin-assigned (see RoleAssignmentForm /
-- app/admin/students), never student- or self-editable. A trigger
-- enforces this instead of a policy `with check` because it needs to
-- compare against the OLD row's values.
create or replace function public.prevent_role_self_escalation()
returns trigger as $$
begin
  if (
    new.role <> old.role
    or new.staff_position is distinct from old.staff_position
    or new.managed_region_id is distinct from old.managed_region_id
  ) and not public.is_admin() then
    raise exception 'Only an admin can change a profile''s role, staff position, or managed region.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_role_self_escalation on profiles;
create trigger prevent_role_self_escalation
  before update on profiles
  for each row execute function public.prevent_role_self_escalation();

-- 2. A student inserting their own enrollment could set status,
-- payment_verified, and amount_paid in the same request, faking a
-- completed and paid enrollment without staff ever verifying it.
drop policy if exists "Students create own enrollment" on enrollments;
create policy "Students create own enrollment" on enrollments
  for insert
  with check (
    auth.uid() = student_id
    and status = 'registered'
    and payment_verified = false
    and amount_paid is null
  );

-- 3. Same shape of gap for certificates: a student could insert a
-- certificate for any course pre-marked verified, instantly satisfying
-- that course's prerequisites without staff review.
drop policy if exists "Students upload own certificate" on certificates;
create policy "Students upload own certificate" on certificates
  for insert
  with check (
    auth.uid() = student_id
    and verified = false
  );
