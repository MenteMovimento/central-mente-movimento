create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'operator', 'viewer');
  end if;
end $$;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_number text unique,
  approval_minute_number text,
  admission_date date,
  quota_paid_until date,
  quota_paid_at date,
  name text not null,
  address text,
  postal_code text,
  locality text,
  id_number text,
  tax_number text,
  profession text,
  birth_date date,
  phone text,
  email text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_tax_number_format check (tax_number is null or tax_number ~ '^[0-9]{9}$'),
  constraint members_postal_code_format check (postal_code is null or postal_code ~ '^[0-9]{4}-[0-9]{3}$'),
  constraint members_birth_date_not_future check (birth_date is null or birth_date <= current_date),
  constraint members_quota_paid_at_not_future check (quota_paid_at is null or quota_paid_at <= ((now() at time zone 'Europe/Lisbon')::date))
);

create table if not exists public.member_audit_log (
  id bigint generated always as identity primary key,
  member_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb
);

alter table public.app_users enable row level security;
alter table public.members enable row level security;
alter table public.member_audit_log enable row level security;

revoke all on public.app_users from anon, authenticated;
revoke all on public.members from anon, authenticated;
revoke all on public.member_audit_log from anon, authenticated;

grant insert, select, update on public.app_users to authenticated;
grant insert, select, update, delete on public.members to authenticated;
grant select on public.member_audit_log to authenticated;

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

create or replace function private.default_app_permission(role public.app_role, area text, action text)
returns boolean
language sql
immutable
as $$
  select case
    when area = 'central' and action = 'manage_users' then role = 'admin'
    when area = 'central' and action = 'view_history' then role in ('admin', 'operator')
    when area in ('socios', 'utentes', 'dispositivos') and action = 'view' then role in ('admin', 'operator', 'viewer')
    when area in ('socios', 'utentes', 'dispositivos') and action in ('edit', 'export') then role in ('admin', 'operator')
    when area in ('socios', 'utentes', 'dispositivos') and action = 'delete' then role = 'admin'
    when area = 'utentes' and action in ('view_sensitive', 'edit_sensitive') then role in ('admin', 'operator')
    else false
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
    private.default_app_permission(app_users.role, area, action),
    false
  )
  from public.app_users
  where app_users.id = auth.uid()
    and app_users.active = true
  limit 1
$$;

grant execute on function private.current_app_permission(text, text) to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.set_member_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  end if;

  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.write_member_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.member_audit_log (member_id, action, changed_by, new_data)
    values (new.id, 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.member_audit_log (member_id, action, changed_by, old_data, new_data)
    values (new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.member_audit_log (member_id, action, changed_by, old_data)
    values (old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at
before update on public.app_users
for each row execute function private.touch_updated_at();

drop trigger if exists members_set_metadata on public.members;
create trigger members_set_metadata
before insert or update on public.members
for each row execute function private.set_member_metadata();

drop trigger if exists members_write_audit_log on public.members;
create trigger members_write_audit_log
after insert or update or delete on public.members
for each row execute function private.write_member_audit_log();

drop policy if exists "active users read own profile" on public.app_users;
create policy "active users read own profile"
on public.app_users
for select
to authenticated
using (
  id = auth.uid()
  or private.current_app_permission('central', 'manage_users')
);

drop policy if exists "admins manage app users" on public.app_users;
drop policy if exists "admins insert app users" on public.app_users;
drop policy if exists "admins update app users" on public.app_users;
drop policy if exists "admins delete app users" on public.app_users;

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
    or (role = 'admin' and active = true)
  )
);

drop policy if exists "authorized users read members" on public.members;
create policy "authorized users read members"
on public.members
for select
to authenticated
using (private.current_app_permission('socios', 'view'));

drop policy if exists "operators insert members" on public.members;
create policy "operators insert members"
on public.members
for insert
to authenticated
with check (private.current_app_permission('socios', 'edit'));

drop policy if exists "operators update members" on public.members;
create policy "operators update members"
on public.members
for update
to authenticated
using (private.current_app_permission('socios', 'edit'))
with check (private.current_app_permission('socios', 'edit'));

drop policy if exists "admins delete members" on public.members;
create policy "admins delete members"
on public.members
for delete
to authenticated
using (private.current_app_permission('socios', 'delete'));

drop policy if exists "admins read audit log" on public.member_audit_log;
create policy "admins read audit log"
on public.member_audit_log
for select
to authenticated
using (private.current_app_permission('central', 'view_history'));
