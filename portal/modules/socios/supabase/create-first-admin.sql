-- 1. Crie primeiro o utilizador em Supabase > Authentication > Users.
-- 2. Copie o UUID desse utilizador e substitua abaixo.

insert into public.app_users (id, email, full_name, role, active)
values (
  '5315d3c9-284f-4087-83ba-47388e9d4ec1',
  'jf77ps@gmail.com',
  'Admin',
  'admin',
  true
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  active = excluded.active,
  updated_at = now();
