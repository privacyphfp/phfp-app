-- Marketing, Accounting, and Manager are all "flavors" of admin, not
-- separate lesser roles — same full access as 'admin' everywhere,
-- including managing courses/offerings/regions/events and (via the
-- prevent_role_self_escalation trigger from 0021) reassigning anyone's
-- role or staff position. is_staff() already covered marketing/
-- accounting for certificate/payment/enrollment work; this makes
-- is_admin() match, and adds manager to both.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'marketing', 'accounting', 'manager')
  );
$$ language sql security definer stable;

create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'marketing', 'accounting', 'manager')
  );
$$ language sql security definer stable;
