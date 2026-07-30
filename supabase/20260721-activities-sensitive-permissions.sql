begin;

-- Preserve existing activity managers once, then let the new permission matrix
-- control `view_sensitive` independently on every later edit.
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

drop policy if exists "authorized users create activity catalog" on public.activities_catalog;
create policy "authorized users create activity catalog"
on public.activities_catalog for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users update activity catalog" on public.activities_catalog;
create policy "authorized users update activity catalog"
on public.activities_catalog for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users delete activity catalog" on public.activities_catalog;
create policy "authorized users delete activity catalog"
on public.activities_catalog for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users read activity monitors" on public.activities_monitors;
create policy "authorized users read activity monitors"
on public.activities_monitors for select to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users create activity monitors" on public.activities_monitors;
create policy "authorized users create activity monitors"
on public.activities_monitors for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users update activity monitors" on public.activities_monitors;
create policy "authorized users update activity monitors"
on public.activities_monitors for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users delete activity monitors" on public.activities_monitors;
create policy "authorized users delete activity monitors"
on public.activities_monitors for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users create activities" on public.activities_schedule;
create policy "authorized users create activities"
on public.activities_schedule for insert to authenticated
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users update activities" on public.activities_schedule;
create policy "authorized users update activities"
on public.activities_schedule for update to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'))
with check (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users delete activities" on public.activities_schedule;
create policy "authorized users delete activities"
on public.activities_schedule for delete to authenticated
using (private.current_app_permission('atividades', 'view_sensitive'));

drop policy if exists "authorized users create activity history" on public.activities_history;
create policy "authorized users create activity history"
on public.activities_history for insert to authenticated
with check (
  private.current_app_permission('atividades', 'edit')
  or private.current_app_permission('atividades', 'view_sensitive')
  or private.current_app_permission('atividades', 'export')
);

commit;

notify pgrst, 'reload schema';
