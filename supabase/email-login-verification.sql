-- Verificacao por codigo de email depois da password.
-- Execute este ficheiro no SQL Editor do Supabase antes de publicar a alteracao do login.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

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

revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;
revoke all on function private.current_app_permission(text, text) from public, anon;
grant execute on function private.current_app_permission(text, text) to authenticated;
revoke all on function public.current_member_role() from public, anon;
grant execute on function public.current_member_role() to authenticated;

drop policy if exists "active users read own profile" on public.app_users;
create policy "active users read own profile"
on public.app_users
for select
to authenticated
using (
  (id = auth.uid() and private.current_email_session_verified())
  or private.current_app_permission('central', 'manage_users')
);

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists "Members can read own profile" on public.profiles';
    execute 'drop policy if exists "Authenticated members can read profiles" on public.profiles';
    execute $policy$
      create policy "Authenticated members can read profiles"
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid() and private.current_email_session_verified())
    $policy$;
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');
