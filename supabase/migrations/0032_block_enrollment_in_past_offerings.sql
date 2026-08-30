-- Students shouldn't be able to enroll in a course offering whose last
-- scheduled day has already passed — the app now hides these from the
-- enroll lists, but that's UI-only, so enforce it here too (same reasoning
-- as the other checks 0021 added to this policy).
drop policy if exists "Students create own enrollment" on enrollments;
create policy "Students create own enrollment" on enrollments
  for insert
  with check (
    auth.uid() = student_id
    and status = 'registered'
    and payment_verified = false
    and amount_paid is null
    and exists (
      select 1 from public.course_offerings o
      where o.id = course_offering_id
        and coalesce(o.end_date, o.start_date) >= current_date
    )
  );
