alter table public.members
add column if not exists quota_paid_at date;

alter table public.members
drop constraint if exists members_quota_paid_at_not_future;

alter table public.members
add constraint members_quota_paid_at_not_future
check (quota_paid_at is null or quota_paid_at <= ((now() at time zone 'Europe/Lisbon')::date));
