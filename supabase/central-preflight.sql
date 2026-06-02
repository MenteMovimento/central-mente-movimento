-- Central MenteMovimento
-- Preflight seguro para um projeto Supabase novo e vazio.
-- Nao migra dados antigos e nao substitui os SQLs especificos de cada area.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values
  ('documentos-utentes', 'documentos-utentes', false),
  ('device-attachments', 'device-attachments', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
