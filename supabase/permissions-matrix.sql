-- Central MenteMovimento - matriz flexivel de permissoes
-- Executar no SQL Editor do Supabase do projeto de producao.
-- A matriz permissions e a unica fonte de verdade. Os cargos antigos deixam de decidir acessos.

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

drop function if exists private.default_app_permission(public.app_role, text, text);

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

-- Converte todas as contas existentes para a nova matriz, com acesso total inicial.
-- A partir daqui cada conta pode ser ajustada individualmente na grelha de permissoes.
update public.app_users
set
  role = 'viewer',
  permissions = jsonb_build_object(
    'central', jsonb_build_object('manage_users', true, 'view_history', true),
    'socios', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true),
    'utentes', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', true, 'edit_sensitive', true, 'export', true, 'delete', true),
    'dispositivos', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true)
  );

drop policy if exists "active users read own profile" on public.app_users;
create policy "active users read own profile"
on public.app_users
for select
to authenticated
using (
  id = auth.uid()
  or private.current_app_permission('central', 'manage_users')
);

drop policy if exists "admins insert app users" on public.app_users;
create policy "admins insert app users"
on public.app_users
for insert
to authenticated
with check (private.current_app_permission('central', 'manage_users'));

drop policy if exists "admins update app users" on public.app_users;
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
