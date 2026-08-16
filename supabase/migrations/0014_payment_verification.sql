-- Payment tracking per enrollment: how much a student has actually sent,
-- whether staff has verified it, and an optional receipt staff can issue
-- back to the student as proof.
alter table enrollments
  add column if not exists amount_paid numeric(10, 2),
  add column if not exists payment_verified boolean not null default false,
  add column if not exists receipt_url text;

-- Private bucket for receipt files staff issue to students. Files are
-- stored at `${student_id}/...`, matching the certificates bucket pattern.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Staff upload receipt files"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and public.is_staff());

create policy "Staff view all receipt files"
  on storage.objects for select
  using (bucket_id = 'receipts' and public.is_staff());

create policy "Students view own receipt files"
  on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
