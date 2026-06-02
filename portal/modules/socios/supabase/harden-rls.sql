-- Security hardening for an existing Supabase project.
-- Run this after supabase/schema.sql if the project already exists.

revoke all on public.app_users from anon, authenticated;
revoke all on public.members from anon, authenticated;
revoke all on public.member_audit_log from anon, authenticated;

grant insert, select, update on public.app_users to authenticated;
grant insert, select, update, delete on public.members to authenticated;
grant select on public.member_audit_log to authenticated;

drop policy if exists "admins manage app users" on public.app_users;
drop policy if exists "admins insert app users" on public.app_users;
drop policy if exists "admins update app users" on public.app_users;
drop policy if exists "admins delete app users" on public.app_users;

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

-- No direct client-side DELETE policy for app_users.
-- Deletions should go through /api/delete-user, which verifies the caller,
-- uses the server-only service role key, prevents self-delete, and protects
-- the last active administrator.
