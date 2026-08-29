-- New enum value must be committed on its own before anything else can
-- reference it (see 0016 for the same Postgres restriction).
alter type user_role add value if not exists 'manager';
