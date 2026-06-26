-- Central MenteMovimento - promover a matriz de permissoes
-- Execute este ficheiro no SQL Editor do Supabase uma unica vez.
-- Todas as contas ativas passam inicialmente a ter acesso total.
-- Depois, ajuste cada utilizador na grelha de permissoes da Central.

alter table public.app_users
add column if not exists permissions jsonb not null default '{}'::jsonb;

create schema if not exists private;

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

grant execute on function private.current_app_permission(text, text) to authenticated;

update public.app_users
set
  role = 'viewer',
  permissions = jsonb_build_object(
    'central', jsonb_build_object('manage_users', true, 'view_history', true),
    'socios', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true),
    'utentes', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', true, 'edit_sensitive', true, 'export', true, 'delete', true),
    'dispositivos', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true)
  );

drop policy if exists "admins update app users" on public.app_users;
create policy "admins update app users"
on public.app_users
for update
to authenticated
using (private.current_app_permission('central', 'manage_users'))
with check (
  private.current_app_permission('central', 'manage_users')
  and (id <> auth.uid() or active = true)
);
