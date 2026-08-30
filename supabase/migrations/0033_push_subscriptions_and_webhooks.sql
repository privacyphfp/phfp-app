-- One row per browser/device a person has approved push notifications on
-- (a student could have it on their phone and laptop, hence no unique
-- constraint on user_id — endpoint is the natural unique key instead).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions" on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Staff view all push subscriptions" on push_subscriptions
  for select
  using (public.is_staff());

-- ========== Database Webhooks ==========
-- pg_net is what actually makes the outbound HTTP call (net.http_post).
-- Supabase ships it disabled by default — this turns it on.
create extension if not exists pg_net;

-- Fire an HTTP request to our own API routes whenever an enrollment,
-- course offering, or event is created, so the app can email/push a
-- notification without the enrollment form (or CreateOfferingForm, etc.)
-- needing to know anything about notifications — they just do their
-- normal insert and this fires independently.
--
-- IMPORTANT — replace both placeholders below before running:
--   1. <YOUR_DEPLOYED_URL>  ->  your live Vercel URL, e.g. https://phfp-app.vercel.app
--   2. <YOUR_WEBHOOK_SECRET> -> the WEBHOOK_SECRET value from .env.local / Vercel
-- These can't be read from an env var inside SQL, so they're pasted in directly.

create or replace function public.notify_enrollment_created()
returns trigger as $$
begin
  perform net.http_post(
    url := '<YOUR_DEPLOYED_URL>/api/webhooks/enrollment-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'),
    body := jsonb_build_object('enrollmentId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_enrollment_created on enrollments;
create trigger on_enrollment_created
  after insert on enrollments
  for each row execute function public.notify_enrollment_created();

create or replace function public.notify_offering_created()
returns trigger as $$
begin
  perform net.http_post(
    url := '<YOUR_DEPLOYED_URL>/api/webhooks/offering-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'),
    body := jsonb_build_object('offeringId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_offering_created on course_offerings;
create trigger on_offering_created
  after insert on course_offerings
  for each row execute function public.notify_offering_created();

create or replace function public.notify_event_created()
returns trigger as $$
begin
  perform net.http_post(
    url := '<YOUR_DEPLOYED_URL>/api/webhooks/event-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'),
    body := jsonb_build_object('eventId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_event_created on events;
create trigger on_event_created
  after insert on events
  for each row execute function public.notify_event_created();
