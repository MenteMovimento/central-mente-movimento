alter table public.members
add column if not exists quota_paid_until date;
