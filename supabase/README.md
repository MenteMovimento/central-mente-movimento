# Supabase da Central

Este diretorio organiza a preparacao do novo projeto Supabase da associacao.

Os dados antigos ficam para migrar depois. Primeiro prepara-se uma base vazia e testavel.

## Ficheiros de referencia

As tres areas ainda trazem os seus SQLs originais:

- Socios: `portal/modules/socios/supabase/schema.sql`
- Utentes: `portal/modules/utentes/supabase_schema.sql`
- Ciberseguranca: `portal/modules/dispositivos/supabase/full-setup.sql`
- Atividades: `supabase/activities-shared-storage.sql`

Como estes ficheiros vieram de projetos separados, alguns nomes vivem no schema `public` e podem sobrepor conceitos comuns, principalmente utilizadores/perfis. Num projeto Supabase novo e vazio, isto e gerivel, mas nao deve ser corrido sem rever.

## Ordem recomendada para testes

1. Cria um projeto Supabase novo.
2. Corre primeiro `supabase/central-preflight.sql`.
3. Corre o SQL de Socios.
4. Corre o SQL de Utentes.
5. Reve o SQL de Ciberseguranca antes de correr, porque ele tambem inclui tabelas de Utentes herdadas do projeto original.
6. Corre `supabase/activities-shared-storage.sql` para ativar a agenda partilhada de atividades.
7. Cria um utilizador administrador de teste em Authentication.
8. Liga a Vercel com as variaveis de ambiente.

## Verificacao do login por codigo de email

Antes de publicar uma versao que inclua o segundo passo do login:

1. No SQL Editor do Supabase, executa todo o ficheiro
   `supabase/email-login-verification.sql`.
2. Confirma que a execucao termina sem erros. O SQL cria as tabelas
   `central_email_verification_challenges` e `central_verified_sessions` e
   passa a exigir uma sessao confirmada nas funcoes centrais de permissoes.
3. Em **Authentication > Email Templates**, edita o modelo usado em
   **Magic Link / Passwordless sign-in**.
4. Define o assunto como `Codigo de verificacao MenteMovimento` e usa o
   conteudo de `supabase/email-code-template.html`. O modelo tem de manter
   `{{ .Token }}`, porque e esse valor que apresenta o codigo ao utilizador.
5. Guarda o modelo e testa com uma conta ativa antes de publicar para todos.

O pedido de codigo expira na aplicacao ao fim de 10 minutos. Uma sessao
confirmada permanece valida durante 12 horas. Sem as tabelas acima, as APIs
recusam o acesso de forma intencional para nao contornar a verificacao.

## Producao final

Para a versao final, o ideal e consolidar os nomes comuns numa estrutura unica:

- dados especificos de Socios separados dos dados de Utentes e Ciberseguranca;
- historico geral;
- utilizadores/administradores gerais;
- anexos em buckets separados;
- politicas RLS coerentes para todas as areas.

Isto deve ser feito antes de migrar dados reais e antes de apagar os sites antigos.
