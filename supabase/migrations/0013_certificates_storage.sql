-- Storage bucket for certificate uploads (students proving they already
-- took a course elsewhere, before it was tracked by this app). Private
-- bucket — files are only reachable via short-lived signed URLs generated
-- server-side for the owning student or staff.
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- Files are stored at `${student_id}/...`, so the first path segment is
-- the owner check.
create policy "Students upload own certificate files"
  on storage.objects for insert
  with check (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Students view own certificate files"
  on storage.objects for select
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Staff view all certificate files"
  on storage.objects for select
  using (bucket_id = 'certificates' and public.is_staff());
