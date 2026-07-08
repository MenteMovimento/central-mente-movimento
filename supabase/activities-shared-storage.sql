-- Central MenteMovimento - agenda partilhada de atividades
-- Executar no SQL Editor do Supabase do projeto de producao.

create schema if not exists private;

alter table public.app_users
add column if not exists permissions jsonb not null default '{}'::jsonb;

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
  limit 1
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_app_permission(text, text) to authenticated;

update public.app_users
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{atividades}',
  coalesce(
    permissions -> 'atividades',
    jsonb_build_object(
      'view', true,
      'edit', true,
      'view_sensitive', false,
      'edit_sensitive', false,
      'export', true,
      'delete', false
    )
  ),
  true
)
where permissions -> 'atividades' is null;

create table if not exists public.activities_schedule (
  id text primary key,
  week_start date not null,
  day text not null check (day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  start_time time without time zone not null,
  end_time time without time zone,
  title text not null,
  teacher text not null,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activities_schedule_week_start_idx
on public.activities_schedule (week_start, day, start_time, sort_order);

create table if not exists public.activities_history (
  id text primary key,
  activity_id text,
  action text not null check (action in ('created', 'updated', 'deleted', 'reordered', 'printed')),
  title text,
  teacher text,
  day text check (day is null or day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  start_time time without time zone,
  end_time time without time zone,
  week_start date,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists activities_history_created_at_idx
on public.activities_history (created_at desc);

create or replace function public.set_activities_schedule_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists activities_schedule_set_updated_at on public.activities_schedule;
create trigger activities_schedule_set_updated_at
before update on public.activities_schedule
for each row
execute function public.set_activities_schedule_updated_at();

alter table public.activities_schedule enable row level security;
alter table public.activities_history enable row level security;

grant select, insert, update, delete on public.activities_schedule to authenticated;
grant select, insert on public.activities_history to authenticated;

drop policy if exists "authorized users read activities" on public.activities_schedule;
create policy "authorized users read activities"
on public.activities_schedule
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

drop policy if exists "authorized users create activities" on public.activities_schedule;
create policy "authorized users create activities"
on public.activities_schedule
for insert
to authenticated
with check (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users update activities" on public.activities_schedule;
create policy "authorized users update activities"
on public.activities_schedule
for update
to authenticated
using (private.current_app_permission('atividades', 'edit'))
with check (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users delete activities" on public.activities_schedule;
create policy "authorized users delete activities"
on public.activities_schedule
for delete
to authenticated
using (private.current_app_permission('atividades', 'edit'));

drop policy if exists "authorized users read activity history" on public.activities_history;
create policy "authorized users read activity history"
on public.activities_history
for select
to authenticated
using (private.current_app_permission('atividades', 'view'));

drop policy if exists "authorized users create activity history" on public.activities_history;
create policy "authorized users create activity history"
on public.activities_history
for insert
to authenticated
with check (private.current_app_permission('atividades', 'view'));
