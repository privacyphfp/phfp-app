-- 0033 shipped with <YOUR_DEPLOYED_URL> / <YOUR_WEBHOOK_SECRET> placeholders
-- that needed manual editing before running — they went in unedited, so the
-- three notify_*_created() triggers have been pointing at a literal,
-- non-existent URL. Re-creates them with the real values. Safe to run even
-- if 0033 *was* edited correctly — this just re-applies the same thing.
create or replace function public.notify_enrollment_created()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://phfp-app.vercel.app/api/webhooks/enrollment-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '7cbfc8babf395a6d849c3f8b57a7d49328b38eb5845b086e'),
    body := jsonb_build_object('enrollmentId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_offering_created()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://phfp-app.vercel.app/api/webhooks/offering-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '7cbfc8babf395a6d849c3f8b57a7d49328b38eb5845b086e'),
    body := jsonb_build_object('offeringId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_event_created()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://phfp-app.vercel.app/api/webhooks/event-created',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', '7cbfc8babf395a6d849c3f8b57a7d49328b38eb5845b086e'),
    body := jsonb_build_object('eventId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;
