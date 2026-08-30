-- Students choose how they're paying when they enroll, and for Bank
-- Transfer / Credit Card they upload their own proof of payment. This is
-- separate from enrollments.receipt_url (0014), which is a receipt STAFF
-- issue back to the student — payment_proof_url is what the STUDENT
-- submits as evidence of having paid, for staff to check against
-- amount_paid/payment_verified.
create type payment_method as enum ('cash', 'bank_transfer', 'credit_card');

alter table enrollments
  add column if not exists payment_method payment_method,
  add column if not exists payment_proof_url text;

-- Private bucket for student-uploaded payment proofs, same pattern as the
-- certificates/receipts buckets: files live at `${student_id}/...`.
insert into storage.buckets (id, name, public)
values ('payment_proofs', 'payment_proofs', false)
on conflict (id) do nothing;

create policy "Students upload own payment proof"
  on storage.objects for insert
  with check (bucket_id = 'payment_proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Students view own payment proof"
  on storage.objects for select
  using (bucket_id = 'payment_proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Staff view all payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment_proofs' and public.is_staff());
