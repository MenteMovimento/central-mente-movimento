-- Migracao legada de perfis da area de Ciberseguranca.
-- Requer supabase/permissions-matrix.sql executado primeiro.
-- A matriz app_users.permissions e a unica fonte de autorizacao.

alter table public.profiles
add column if not exists email text;

alter table public.profiles
alter column role set default 'member';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_key'
  ) then
    alter table public.profiles
    add constraint profiles_email_key unique (email);
  end if;
end $$;

update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
  and public.profiles.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Access profiles are created only by the protected central user API.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.devices enable row level security;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Authenticated members can read profiles" on public.profiles;
drop policy if exists "Authenticated members can update profiles" on public.profiles;

create policy "Authenticated members can read profiles"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Managers can create devices" on public.devices;
drop policy if exists "Managers can update devices" on public.devices;
drop policy if exists "Managers can delete devices" on public.devices;
drop policy if exists "Authenticated members can create devices" on public.devices;
drop policy if exists "Authenticated members can update devices" on public.devices;
drop policy if exists "Authenticated members can delete devices" on public.devices;

create policy "Authenticated members can create devices"
on public.devices
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

create policy "Authenticated members can update devices"
on public.devices
for update
to authenticated
using (private.current_app_permission('dispositivos', 'edit'))
with check (private.current_app_permission('dispositivos', 'edit'));

create policy "Authenticated members can delete devices"
on public.devices
for delete
to authenticated
using (private.current_app_permission('dispositivos', 'delete'));

notify pgrst, 'reload schema';
