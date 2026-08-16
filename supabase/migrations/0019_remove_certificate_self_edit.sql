-- Reverses 0015: students no longer self-edit a submitted certificate.
-- A typo now gets caught and handled by staff (reject/notify) instead.
drop policy if exists "Students update own certificate (resets verification)" on certificates;
