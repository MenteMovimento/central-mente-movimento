-- Central MenteMovimento
-- Corrige permissoes da API server-side dos Utentes.
-- Executar no Supabase Dashboard > SQL Editor.

grant usage on schema public to service_role;

grant all privileges on table public.utentes to service_role;
grant all privileges on table public.utilizadores to service_role;
grant all privileges on table public.sessoes to service_role;
grant all privileges on table public.utente_abas to service_role;
grant all privileges on table public.historico to service_role;
grant all privileges on table public.utente_anexos to service_role;

grant usage, select, update on all sequences in schema public to service_role;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant usage, select, update on sequences to service_role;

notify pgrst, 'reload schema';
