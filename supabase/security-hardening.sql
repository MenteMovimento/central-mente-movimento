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

alter table public.app_users
add column if not exists permissions jsonb not null default '{}'::jsonb;

create table if not exists public.central_email_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  password_session_id text not null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  verified_session_id text
);

create table if not exists public.central_verified_sessions (
  session_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid references public.central_email_verification_challenges(id) on delete set null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists central_email_challenges_user_sent_idx
on public.central_email_verification_challenges(user_id, last_sent_at desc);

create index if not exists central_verified_sessions_user_expiry_idx
on public.central_verified_sessions(user_id, expires_at);

create unique index if not exists central_verified_sessions_challenge_idx
on public.central_verified_sessions(challenge_id)
where challenge_id is not null;

alter table public.central_email_verification_challenges enable row level security;
alter table public.central_verified_sessions enable row level security;
revoke all on public.central_email_verification_challenges from public, anon, authenticated;
revoke all on public.central_verified_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.central_email_verification_challenges to service_role;
grant select, insert, update, delete on public.central_verified_sessions to service_role;

create or replace function private.current_email_session_verified()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.central_verified_sessions verified
    where verified.session_id = auth.jwt() ->> 'session_id'
      and verified.user_id = auth.uid()
      and verified.expires_at > now()
  )
$$;

revoke all on function private.current_email_session_verified() from public, anon;
grant execute on function private.current_email_session_verified() to authenticated;

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
    and private.current_email_session_verified()
  limit 1
$$;

revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;

create or replace function private.jsonb_bool(value jsonb, path text[])
returns boolean
language sql
immutable
as $$
  select case jsonb_extract_path_text(coalesce(value, '{}'::jsonb), variadic path)
    when 'true' then true
    when 'false' then false
    else null
  end
$$;

create or replace function private.current_app_permission(area text, action text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    private.jsonb_bool(app_users.permissions, array[area, action]),
    false
  )
  from public.app_users
  where app_users.id = auth.uid()
    and app_users.active = true
    and private.current_email_session_verified()
  limit 1
$$;

drop function if exists private.default_app_permission(public.app_role, text, text);
revoke all on function private.jsonb_bool(jsonb, text[]) from public, anon, authenticated;
revoke all on function private.current_app_permission(text, text) from public, anon;
grant execute on function private.current_app_permission(text, text) to authenticated;

-- Migrate the former activity management permission once. Future permission
-- changes are respected because the migration marker prevents reapplying it.
update public.app_users
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{atividades}',
  coalesce(permissions -> 'atividades', '{}'::jsonb) || jsonb_build_object(
    'view_sensitive',
    coalesce(private.jsonb_bool(permissions, array['atividades', 'view_sensitive']), false)
      or coalesce(private.jsonb_bool(permissions, array['atividades', 'edit']), false)
  ),
  true
) || jsonb_build_object(
  '_permission_migrations',
  coalesce(permissions -> '_permission_migrations', '{}'::jsonb)
    || jsonb_build_object('activities_sensitive_v1', true)
)
where not coalesce(
  private.jsonb_bool(permissions, array['_permission_migrations', 'activities_sensitive_v1']),
  false
);

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
    and private.current_email_session_verified()
  limit 1
$$;

revoke all on function public.current_member_role() from public, anon;
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

revoke all on function public.handle_new_user() from public, anon, authenticated;

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
  (id = auth.uid() and private.current_email_session_verified())
  or private.current_app_permission('central', 'manage_users')
);

create policy "admins insert app users"
on public.app_users
for insert
to authenticated
with check (private.current_app_permission('central', 'manage_users'));

create policy "admins update app users"
on public.app_users
for update
to authenticated
using (private.current_app_permission('central', 'manage_users'))
with check (
  private.current_app_permission('central', 'manage_users')
  and (
    id <> auth.uid()
    or active = true
  )
);

-- Socios: remove any legacy role-based policies and enforce the matrix.
alter table if exists public.members enable row level security;
alter table if exists public.member_audit_log enable row level security;

revoke all on public.members from anon, authenticated;
revoke all on public.member_audit_log from anon, authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select on public.member_audit_log to authenticated;

drop policy if exists "authorized users read members" on public.members;
drop policy if exists "operators insert members" on public.members;
drop policy if exists "operators update members" on public.members;
drop policy if exists "admins delete members" on public.members;
drop policy if exists "admins read audit log" on public.member_audit_log;

create policy "authorized users read members"
on public.members
for select
to authenticated
using (private.current_app_permission('socios', 'view'));

create policy "operators insert members"
on public.members
for insert
to authenticated
with check (private.current_app_permission('socios', 'edit'));

create policy "operators update members"
on public.members
for update
to authenticated
using (private.current_app_permission('socios', 'edit'))
with check (private.current_app_permission('socios', 'edit'));

create policy "admins delete members"
on public.members
for delete
to authenticated
using (private.current_app_permission('socios', 'delete'));

create policy "admins read audit log"
on public.member_audit_log
for select
to authenticated
using (private.current_app_permission('central', 'view_history'));

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

revoke all on public.profiles from anon, authenticated;
revoke all on public.devices from anon, authenticated;
revoke all on public.device_history from anon, authenticated;
revoke all on public.device_attachments from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.devices to authenticated;
grant select, insert on public.device_history to authenticated;
grant select, insert, delete on public.device_attachments to authenticated;

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
using (id = auth.uid() and private.current_email_session_verified());

create policy "Authenticated members can update profiles"
on public.profiles
for update
to authenticated
using (false)
with check (false);

create policy "Authenticated members can read devices"
on public.devices
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

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

create policy "Authenticated members can read device history"
on public.device_history
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

create policy "Authenticated members can create device history"
on public.device_history
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

create policy "Authenticated members can read device attachments"
on public.device_attachments
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

create policy "Authenticated members can create device attachments"
on public.device_attachments
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

create policy "Authenticated members can delete device attachments"
on public.device_attachments
for delete
to authenticated
using (private.current_app_permission('dispositivos', 'edit'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('device-attachments', 'device-attachments', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Authenticated members can read device attachment files" on storage.objects;
drop policy if exists "Authenticated members can create device attachment files" on storage.objects;
drop policy if exists "Authenticated members can delete device attachment files" on storage.objects;

create policy "Authenticated members can read device attachment files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'view')
);

create policy "Authenticated members can create device attachment files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'edit')
);

create policy "Authenticated members can delete device attachment files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'edit')
);

-- Utentes contains clinical, authentication and session data. It is served only
-- by the trusted backend with the service role; browser roles get no table grants.
alter table if exists public.utentes enable row level security;
alter table if exists public.utilizadores enable row level security;
alter table if exists public.sessoes enable row level security;
alter table if exists public.utente_abas enable row level security;
alter table if exists public.historico enable row level security;
alter table if exists public.utente_anexos enable row level security;

revoke all on public.utentes from anon, authenticated;
revoke all on public.utilizadores from anon, authenticated;
revoke all on public.sessoes from anon, authenticated;
revoke all on public.utente_abas from anon, authenticated;
revoke all on public.historico from anon, authenticated;
revoke all on public.utente_anexos from anon, authenticated;

-- Atividades: `view` reads the schedule, `edit` manages summaries and attendance,
-- while `view_sensitive` manages the schedule, catalog and monitor records.
alter table if exists public.activities_catalog enable row level security;
alter table if exists public.activities_monitors enable row level security;
alter table if exists public.activities_schedule enable row level security;
alter table if exists public.activities_history enable row level security;
alter table if exists public.activities_summaries enable row level security;

revoke all on public.activities_catalog from anon, authenticated;
revoke all on public.activities_monitors from anon, authenticated;
revoke all on public.activities_schedule from anon, authenticated;
revoke all on public.activities_history from anon, authenticated;
revoke all on public.activities_summaries from anon, authenticated;
grant select, insert, update, delete on public.activities_catalog to authenticated;
grant select, insert, update, delete on public.activities_monitors to authenticated;
grant select, insert, update, delete on public.activities_schedule to authenticated;
grant select, insert on public.activities_history to authenticated;
grant select, insert, update, delete on public.activities_summaries to authenticated;

drop policy if exists "authorized users read activity catalog" on public.activities_catalog;
drop policy if exists "authorized users create activity catalog" on public.activities_catalog;
drop policy if exists "authorized users update activity catalog" on public.activities_catalog;
drop policy if exists "authorized users delete activity catalog" on public.activities_catalog;
drop policy if exists "authorized users read activity monitors" on public.activities_monitors;
drop policy if exists "authorized users create activity monitors" on public.activities_monitors;
drop policy if exists "authorized users update activity monitors" on public.activities_monitors;
drop policy if exists "authorized users delete activity monitors" on public.activities_monitors;
drop policy if exists "authorized users read activities" on public.activities_schedule;
drop policy if exists "authorized users create activities" on public.activities_schedule;
drop policy if exists "authorized users update activities" on public.activities_schedule;
drop policy if exists "authorized users delete activities" on public.activities_schedule;
drop policy if exists "authorized users read activity history" on public.activities_history;
drop policy if exists "authorized users create activity history" on public.activities_history;
drop policy if exists "authorized users read activity summaries" on public.activities_summaries;
drop policy if exists "authorized users create activity summaries" on public.activities_summaries;
drop policy if exists "authorized users update activity summaries" on public.activities_summaries;
drop policy if exists "authorized users delete activity summaries" on public.activities_summaries;

create policy "authorized users read activity catalog"
on public.activities_catalog for select to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activity catalog"
on public.activities_catalog for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users update activity catalog"
on public.activities_catalog for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users delete activity catalog"
on public.activities_catalog for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users read activity monitors"
on public.activities_monitors for select to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users create activity monitors"
on public.activities_monitors for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users update activity monitors"
on public.activities_monitors for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users delete activity monitors"
on public.activities_monitors for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users read activities"
on public.activities_schedule for select to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activities"
on public.activities_schedule for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users update activities"
on public.activities_schedule for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users delete activities"
on public.activities_schedule for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

create policy "authorized users read activity history"
on public.activities_history for select to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activity history"
on public.activities_history for insert to authenticated
with check (
  private.current_app_permission('atividades', 'edit')
  or private.current_app_permission('atividades', 'view_sensitive')
  or private.current_app_permission('atividades', 'export')
);

create policy "authorized users read activity summaries"
on public.activities_summaries for select to authenticated
using (private.current_app_permission('atividades', 'edit'));

create policy "authorized users create activity summaries"
on public.activities_summaries for insert to authenticated
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users update activity summaries"
on public.activities_summaries for update to authenticated
using (private.current_app_permission('atividades', 'edit'))
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users delete activity summaries"
on public.activities_summaries for delete to authenticated
using (private.current_app_permission('atividades', 'edit'));

notify pgrst, 'reload schema';
