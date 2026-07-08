# Supabase da Central

Este diretorio organiza a preparacao do novo projeto Supabase da associacao.

Os dados antigos ficam para migrar depois. Primeiro prepara-se uma base vazia e testavel.

## Ficheiros de referencia

As tres areas ainda trazem os seus SQLs originais:

- Socios: `portal/modules/socios/supabase/schema.sql`
- Utentes: `portal/modules/utentes/supabase_schema.sql`
- Ciberseguranca: `portal/modules/dispositivos/supabase/full-setup.sql`

Como estes ficheiros vieram de projetos separados, alguns nomes vivem no schema `public` e podem sobrepor conceitos comuns, principalmente utilizadores/perfis. Num projeto Supabase novo e vazio, isto e gerivel, mas nao deve ser corrido sem rever.

## Ordem recomendada para testes

1. Cria um projeto Supabase novo.
2. Corre primeiro `supabase/central-preflight.sql`.
3. Corre o SQL de Socios.
4. Corre o SQL de Utentes.
5. Reve o SQL de Ciberseguranca antes de correr, porque ele tambem inclui tabelas de Utentes herdadas do projeto original.
6. Cria um utilizador administrador de teste em Authentication.
7. Liga a Vercel com as variaveis de ambiente.

## Producao final

Para a versao final, o ideal e consolidar os nomes comuns numa estrutura unica:

- dados especificos de Socios separados dos dados de Utentes e Ciberseguranca;
- historico geral;
- utilizadores/administradores gerais;
- anexos em buckets separados;
- politicas RLS coerentes para todas as areas.

Isto deve ser feito antes de migrar dados reais e antes de apagar os sites antigos.
