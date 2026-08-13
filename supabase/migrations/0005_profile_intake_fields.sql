-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Expands the student profile form: full intake details, communication
-- preferences, and the two electronically-signed consent documents.

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists nickname text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state_region text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists fb_link text;
alter table profiles add column if not exists religion text;
alter table profiles add column if not exists profession text;
alter table profiles add column if not exists company text;

alter table profiles add column if not exists updates_via_text boolean not null default false;
alter table profiles add column if not exists updates_via_email boolean not null default false;
alter table profiles add column if not exists updates_via_social boolean not null default false;

-- Signatures are stored as data: URLs (PNG) from the canvas signature pad.
alter table profiles add column if not exists nda_signature text;
alter table profiles add column if not exists nda_agreed_at timestamptz;
alter table profiles add column if not exists privacy_signature text;
alter table profiles add column if not exists privacy_agreed_at timestamptz;
