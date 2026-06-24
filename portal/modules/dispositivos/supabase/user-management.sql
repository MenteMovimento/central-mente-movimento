alter table public.profiles
add column if not exists email text;

alter table public.profiles
alter column role set default 'member';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_key'
  ) then
    alter table public.profiles
    add constraint profiles_email_key unique (email);
  end if;
end $$;

update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
  and public.profiles.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, nullif(new.raw_user_meta_data->>'full_name', ''), 'member')
  on conflict (id) do nothing;

  return new;
end;
$$;

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
  limit 1;
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Authenticated members can read profiles" on public.profiles;
drop policy if exists "Authenticated members can update profiles" on public.profiles;
drop policy if exists "Managers can create devices" on public.devices;
drop policy if exists "Managers can update devices" on public.devices;
drop policy if exists "Managers can delete devices" on public.devices;
drop policy if exists "Authenticated members can create devices" on public.devices;
drop policy if exists "Authenticated members can update devices" on public.devices;
drop policy if exists "Authenticated members can delete devices" on public.devices;

create policy "Authenticated members can read profiles"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_member_role() = 'admin');

create policy "Authenticated members can update profiles"
on public.profiles
for update
to authenticated
using (public.current_member_role() = 'admin')
with check (public.current_member_role() = 'admin');

create policy "Authenticated members can create devices"
on public.devices
for insert
to authenticated
with check (public.current_member_role() in ('admin', 'manager'));

create policy "Authenticated members can update devices"
on public.devices
for update
to authenticated
using (public.current_member_role() in ('admin', 'manager'))
with check (public.current_member_role() in ('admin', 'manager'));

create policy "Authenticated members can delete devices"
on public.devices
for delete
to authenticated
using (public.current_member_role() = 'admin');

notify pgrst, 'reload schema';
