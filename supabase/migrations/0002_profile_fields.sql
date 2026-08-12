-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
alter table profiles add column if not exists address text;
alter table profiles add column if not exists birthdate date;
