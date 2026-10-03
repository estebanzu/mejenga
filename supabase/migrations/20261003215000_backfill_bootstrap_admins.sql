-- Backfill: users who signed up before the on_auth_user_created trigger
-- existed have no admins row, so is_admin() is false for them and every
-- admin mutation is denied by RLS. Idempotent.
insert into public.admins (id, email)
select u.id, u.email
from auth.users u
where u.email is not null
on conflict (id) do nothing;
