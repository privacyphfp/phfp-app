-- Lets a student fix a typo (e.g. the completion date) on a certificate
-- they already submitted. The with-check forces verified back to false on
-- any student-made edit, so a correction always needs staff to re-approve
-- it rather than silently keeping a prior verification.
create policy "Students update own certificate (resets verification)" on certificates
  for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id and verified = false);
