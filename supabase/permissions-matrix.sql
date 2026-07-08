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
set role = 'viewer';

update public.app_users
set
  permissions = jsonb_build_object(
    'central', jsonb_build_object('manage_users', true, 'view_history', true),
    'socios', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true),
    'utentes', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', true, 'edit_sensitive', true, 'export', true, 'delete', true),
    'dispositivos', jsonb_build_object('view', true, 'edit', true, 'view_sensitive', false, 'edit_sensitive', false, 'export', true, 'delete', true)
  )
where permissions is null or permissions = '{}'::jsonb;

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

-- Device profiles are technical records, not an alternative permissions system.
drop policy if exists "Members can read own profile" on public.profiles;
drop policy if exists "Authenticated members can read profiles" on public.profiles;
drop policy if exists "Authenticated members can update profiles" on public.profiles;
drop policy if exists "users read own device profile" on public.profiles;
create policy "users read own device profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Ciberseguranca: remove the old unrestricted policies and enforce the same matrix.
drop policy if exists "Authenticated members can read devices" on public.devices;
drop policy if exists "authorized users read devices" on public.devices;
create policy "authorized users read devices"
on public.devices
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

drop policy if exists "Authenticated members can create devices" on public.devices;
drop policy if exists "authorized users create devices" on public.devices;
create policy "authorized users create devices"
on public.devices
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

drop policy if exists "Authenticated members can update devices" on public.devices;
drop policy if exists "authorized users update devices" on public.devices;
create policy "authorized users update devices"
on public.devices
for update
to authenticated
using (private.current_app_permission('dispositivos', 'edit'))
with check (private.current_app_permission('dispositivos', 'edit'));

drop policy if exists "Authenticated members can delete devices" on public.devices;
drop policy if exists "authorized users delete devices" on public.devices;
create policy "authorized users delete devices"
on public.devices
for delete
to authenticated
using (private.current_app_permission('dispositivos', 'delete'));

drop policy if exists "Authenticated members can read device history" on public.device_history;
drop policy if exists "authorized users read device history" on public.device_history;
create policy "authorized users read device history"
on public.device_history
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

drop policy if exists "Authenticated members can create device history" on public.device_history;
drop policy if exists "authorized users create device history" on public.device_history;
create policy "authorized users create device history"
on public.device_history
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

drop policy if exists "Authenticated members can read device attachments" on public.device_attachments;
drop policy if exists "authorized users read device attachments" on public.device_attachments;
create policy "authorized users read device attachments"
on public.device_attachments
for select
to authenticated
using (private.current_app_permission('dispositivos', 'view'));

drop policy if exists "Authenticated members can create device attachments" on public.device_attachments;
drop policy if exists "authorized users create device attachments" on public.device_attachments;
create policy "authorized users create device attachments"
on public.device_attachments
for insert
to authenticated
with check (private.current_app_permission('dispositivos', 'edit'));

drop policy if exists "Authenticated members can delete device attachments" on public.device_attachments;
drop policy if exists "authorized users delete device attachments" on public.device_attachments;
create policy "authorized users delete device attachments"
on public.device_attachments
for delete
to authenticated
using (private.current_app_permission('dispositivos', 'edit'));

drop policy if exists "Authenticated members can read device attachment files" on storage.objects;
drop policy if exists "authorized users read device attachment files" on storage.objects;
create policy "authorized users read device attachment files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'view')
);

drop policy if exists "Authenticated members can create device attachment files" on storage.objects;
drop policy if exists "authorized users create device attachment files" on storage.objects;
create policy "authorized users create device attachment files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'edit')
);

drop policy if exists "Authenticated members can delete device attachment files" on storage.objects;
drop policy if exists "authorized users delete device attachment files" on storage.objects;
create policy "authorized users delete device attachment files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'device-attachments'
  and private.current_app_permission('dispositivos', 'edit')
);
