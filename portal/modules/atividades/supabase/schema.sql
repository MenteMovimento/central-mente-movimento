create schema if not exists private;

create or replace function private.jsonb_bool(source jsonb, path text[])
returns boolean
language sql
immutable
as $$
  select case
    when source #> path is null then null
    when jsonb_typeof(source #> path) = 'boolean' then (source #>> path)::boolean
    when lower(source #>> path) in ('true', '1', 'yes', 'sim') then true
    when lower(source #>> path) in ('false', '0', 'no', 'nao') then false
    else null
  end
$$;

create or replace function private.default_app_permission(role public.app_role, area text, action text)
returns boolean
language sql
immutable
as $$
  select case
    when role = 'admin' then true
    when area = 'central' and action in ('manage_users', 'view_history') then role = 'admin'
    when area in ('socios', 'utentes', 'dispositivos', 'atividades') and action = 'view' then role in ('admin', 'operator', 'viewer')
    when area in ('socios', 'utentes', 'dispositivos', 'atividades') and action in ('edit', 'export') then role in ('admin', 'operator')
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

create table if not exists public.activities_monitors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities_schedule (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  day text not null check (day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  start_time time not null,
  end_time time,
  title text not null,
  teacher text not null,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_schedule_end_after_start check (end_time is null or end_time > start_time)
);

create table if not exists public.activities_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,
  title text,
  teacher text,
  day text,
  start_time time,
  end_time time,
  week_start date,
  created_by uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists activities_schedule_week_day_idx
on public.activities_schedule(week_start, day, start_time, sort_order);

create index if not exists activities_history_created_at_idx
on public.activities_history(created_at desc);

create index if not exists activities_monitors_active_name_idx
on public.activities_monitors(active, name);

create index if not exists activities_catalog_active_name_idx
on public.activities_catalog(active, name);

drop trigger if exists activities_monitors_touch_updated_at on public.activities_monitors;
create trigger activities_monitors_touch_updated_at
before update on public.activities_monitors
for each row execute function private.touch_updated_at();

drop trigger if exists activities_catalog_touch_updated_at on public.activities_catalog;
create trigger activities_catalog_touch_updated_at
before update on public.activities_catalog
for each row execute function private.touch_updated_at();

drop trigger if exists activities_schedule_touch_updated_at on public.activities_schedule;
create trigger activities_schedule_touch_updated_at
before update on public.activities_schedule
for each row execute function private.touch_updated_at();

alter table public.activities_monitors enable row level security;
alter table public.activities_catalog enable row level security;
alter table public.activities_schedule enable row level security;
alter table public.activities_history enable row level security;

drop policy if exists "authorized users read activity catalog" on public.activities_catalog;
drop policy if exists "authorized users create activity catalog" on public.activities_catalog;
drop policy if exists "authorized users update activity catalog" on public.activities_catalog;
drop policy if exists "authorized users delete activity catalog" on public.activities_catalog;

create policy "authorized users read activity catalog"
on public.activities_catalog
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activity catalog"
on public.activities_catalog
for insert
to authenticated
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users update activity catalog"
on public.activities_catalog
for update
to authenticated
using (private.current_app_permission('atividades', 'edit'))
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users delete activity catalog"
on public.activities_catalog
for delete
to authenticated
using (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users read activity monitors" on public.activities_monitors;
drop policy if exists "authorized users create activity monitors" on public.activities_monitors;
drop policy if exists "authorized users update activity monitors" on public.activities_monitors;
drop policy if exists "authorized users delete activity monitors" on public.activities_monitors;

create policy "authorized users read activity monitors"
on public.activities_monitors
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activity monitors"
on public.activities_monitors
for insert
to authenticated
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users update activity monitors"
on public.activities_monitors
for update
to authenticated
using (private.current_app_permission('atividades', 'edit'))
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users delete activity monitors"
on public.activities_monitors
for delete
to authenticated
using (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users read activities" on public.activities_schedule;
drop policy if exists "authorized users create activities" on public.activities_schedule;
drop policy if exists "authorized users update activities" on public.activities_schedule;
drop policy if exists "authorized users delete activities" on public.activities_schedule;

create policy "authorized users read activities"
on public.activities_schedule
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activities"
on public.activities_schedule
for insert
to authenticated
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users update activities"
on public.activities_schedule
for update
to authenticated
using (private.current_app_permission('atividades', 'edit'))
with check (private.current_app_permission('atividades', 'edit'));

create policy "authorized users delete activities"
on public.activities_schedule
for delete
to authenticated
using (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users read activity history" on public.activities_history;
drop policy if exists "authorized users create activity history" on public.activities_history;

create policy "authorized users read activity history"
on public.activities_history
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

create policy "authorized users create activity history"
on public.activities_history
for insert
to authenticated
with check (
  private.current_app_permission('atividades', 'edit')
  or private.current_app_permission('atividades', 'export')
);

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant select, insert, update, delete on public.activities_catalog to authenticated;
grant select, insert, update, delete on public.activities_monitors to authenticated;
grant select, insert, update, delete on public.activities_schedule to authenticated;
grant select, insert, update on public.activities_history to authenticated;

notify pgrst, 'reload schema';
