-- Security hardening for Central MenteMovimento.
-- Run after the Socios, Utentes and Ciberseguranca schemas are already installed.
-- This makes app_users the single authority for access across the central site.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'operator', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('admin', 'manager', 'member');
  end if;
end $$;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.current_app_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.app_users
  where id = auth.uid()
    and active = true
  limit 1
$$;

grant execute on function private.current_app_role() to authenticated;

create or replace function public.current_member_role()
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select case role::text
    when 'admin' then 'admin'::public.member_role
    when 'operator' then 'manager'::public.member_role
    when 'viewer' then 'member'::public.member_role
    else null
  end
  from public.app_users
  where id = auth.uid()
    and active = true
  limit 1
$$;

grant execute on function public.current_member_role() to authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;
grant insert, select, update on public.app_users to authenticated;

drop policy if exists "active users read own profile" on public.app_users;
drop policy if exists "admins manage app users" on public.app_users;
drop policy if exists "admins insert app users" on public.app_users;
drop policy if exists "admins update app users" on public.app_users;
drop policy if exists "admins delete app users" on public.app_users;

create policy "active users read own profile"
on public.app_users
for select
to authenticated
using (
  id = auth.uid()
  or private.current_app_role() = 'admin'
);

create policy "admins insert app users"
on public.app_users
for insert
to authenticated
with check (private.current_app_role() = 'admin');

create policy "admins update app users"
on public.app_users
for update
to authenticated
using (private.current_app_role() = 'admin')
with check (
  private.current_app_role() = 'admin'
  and (
    id <> auth.uid()
    or (role = 'admin' and active = true)
  )
);

alter table if exists public.profiles alter column role set default 'member';

update public.profiles p
set role = case au.role::text
  when 'admin' then 'admin'::public.member_role
  when 'operator' then 'manager'::public.member_role
  else 'member'::public.member_role
end
from public.app_users au
where p.id = au.id;

alter table if exists public.profiles enable row level security;
alter table if exists public.devices enable row level security;
alter table if exists public.device_history enable row level security;
alter table if exists public.device_attachments enable row level security;

drop policy if exists "Members can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Authenticated members can read profiles" on public.profiles;
drop policy if exists "Authenticated members can update profiles" on public.profiles;
drop policy if exists "Authenticated members can read devices" on public.devices;
drop policy if exists "Authenticated members can create devices" on public.devices;
drop policy if exists "Authenticated members can update devices" on public.devices;
drop policy if exists "Authenticated members can delete devices" on public.devices;
drop policy if exists "Managers can create devices" on public.devices;
drop policy if exists "Managers can update devices" on public.devices;
drop policy if exists "Managers can delete devices" on public.devices;
drop policy if exists "Authenticated members can read device history" on public.device_history;
drop policy if exists "Authenticated members can create device history" on public.device_history;
drop policy if exists "Authenticated members can read device attachments" on public.device_attachments;
drop policy if exists "Authenticated members can create device attachments" on public.device_attachments;
drop policy if exists "Authenticated members can delete device attachments" on public.device_attachments;

create policy "Authenticated members can read profiles"
on public.profiles
for select
to authenticated
using (id = auth.uid() or private.current_app_role() = 'admin');

create policy "Authenticated members can update profiles"
on public.profiles
for update
to authenticated
using (private.current_app_role() = 'admin')
with check (private.current_app_role() = 'admin');

create policy "Authenticated members can read devices"
on public.devices
for select
to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer'));

create policy "Authenticated members can create devices"
on public.devices
for insert
to authenticated
with check (private.current_app_role() in ('admin', 'operator'));

create policy "Authenticated members can update devices"
on public.devices
for update
to authenticated
using (private.current_app_role() in ('admin', 'operator'))
with check (private.current_app_role() in ('admin', 'operator'));

create policy "Authenticated members can delete devices"
on public.devices
for delete
to authenticated
using (private.current_app_role() = 'admin');

create policy "Authenticated members can read device history"
on public.device_history
for select
to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer'));

create policy "Authenticated members can create device history"
on public.device_history
for insert
to authenticated
with check (private.current_app_role() in ('admin', 'operator'));

create policy "Authenticated members can read device attachments"
on public.device_attachments
for select
to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer'));

create policy "Authenticated members can create device attachments"
on public.device_attachments
for insert
to authenticated
with check (private.current_app_role() in ('admin', 'operator'));

create policy "Authenticated members can delete device attachments"
on public.device_attachments
for delete
to authenticated
using (private.current_app_role() in ('admin', 'operator'));

insert into storage.buckets (id, name, public)
values ('device-attachments', 'device-attachments', false)
on conflict (id) do update
set public = false;

drop policy if exists "Authenticated members can read device attachment files" on storage.objects;
drop policy if exists "Authenticated members can create device attachment files" on storage.objects;
drop policy if exists "Authenticated members can delete device attachment files" on storage.objects;

create policy "Authenticated members can read device attachment files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_role() in ('admin', 'operator', 'viewer')
);

create policy "Authenticated members can create device attachment files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'device-attachments'
  and private.current_app_role() in ('admin', 'operator')
);

create policy "Authenticated members can delete device attachment files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_role() in ('admin', 'operator')
);

notify pgrst, 'reload schema';
