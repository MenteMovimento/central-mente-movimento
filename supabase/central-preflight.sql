-- Central MenteMovimento
-- Preflight seguro para um projeto Supabase novo e vazio.
-- Nao migra dados antigos e nao substitui os SQLs especificos de cada area.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('documentos-utentes', 'documentos-utentes', false, 31457280),
  ('device-attachments', 'device-attachments', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

notify pgrst, 'reload schema';
