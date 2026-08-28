-- Two more staff-editable payment fields, same pattern as
-- certificates.certificate_number: free-text/date record-keeping fields
-- that feed the Reports export, not used for any verification logic.
alter table enrollments
  add column if not exists invoice_number text,
  add column if not exists payment_date date;
