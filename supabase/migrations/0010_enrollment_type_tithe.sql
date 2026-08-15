-- New vs Review enrollments: a "review" enrollment pays a self-valued tithe
-- instead of the course's fixed rate. Accounting records the actual amount
-- received once it comes in.
create type enrollment_type as enum ('new', 'review');

alter table enrollments
  add column if not exists enrollment_type enrollment_type not null default 'new',
  add column if not exists tithe_amount numeric(10, 2);
