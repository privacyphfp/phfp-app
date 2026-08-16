-- Required profile photo. Private bucket, same pattern as certificates and
-- receipts — files stored at `${student_id}/...` and only reachable via a
-- signed URL generated server-side.
alter table profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- upsert (re-uploading a new photo overwrites the same path) needs both
-- insert and update covered.
create policy "Students upload own avatar" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Students replace own avatar" on storage.objects
  for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Students view own avatar" on storage.objects
  for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Staff view all avatars" on storage.objects
  for select
  using (bucket_id = 'avatars' and public.is_staff());
