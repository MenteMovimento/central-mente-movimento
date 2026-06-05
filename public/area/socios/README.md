# Gestão de Sócios 

Website para gerir sócios com autenticação, permissões e base de dados online.

## Manual de apresentação

O ficheiro `manual-apresentacao.html` é o manual em modo de apresentação para explicar a aplicação a novos utilizadores e a quem ficar responsável pela manutenção técnica.

Depois de publicado, pode ser aberto em:

```text
https://socios-mente-movimento.vercel.app/manual-apresentacao.html
```

Para consultar no computador, basta abrir `manual-apresentacao.html` no browser. Para apresentar, usar ecrã completo com `F11` e avançar com o scroll, `Page Down` ou barra de espaço.

Também existem dois manuais separados em PDF:

- `docs/Manual_Utilizador_Gestao_Socios.pdf`: guia para quem usa a aplicação.
- `docs/Manual_Programador_Gestao_Socios.pdf`: guia para quem mantém e atualiza o projeto.

## Arquitetura recomendada

- Frontend estático publicado na Vercel.
- Base de dados PostgreSQL no Supabase, numa região europeia.
- Login por Supabase Auth.
- Row Level Security ativa na base de dados.
- Perfis de acesso:
  - `admin`: vê, cria, edita, apaga, importa e exporta.
  - `operator`: vê, cria, edita, importa e exporta.
  - `viewer`: apenas consulta.
- Registo de auditoria para alterações nos sócios.

## Preparar o Supabase

1. Crie um projeto em Supabase.
2. Escolha uma região europeia, por exemplo `Central EU (Frankfurt)`.
3. Em `SQL Editor`, execute o ficheiro `supabase/schema.sql`.
4. Em `Authentication > Providers > Email`, mantenha o login por email/password ativo.
5. Desative inscrições públicas se a organização não precisar de auto-registo.
6. Crie o primeiro utilizador em `Authentication > Users`.
7. Copie o UUID desse utilizador.
8. Abra `supabase/create-first-admin.sql`, substitua o UUID e email, e execute no `SQL Editor`.

Se a base de dados já existir de uma versão anterior, execute também os ficheiros:

- `supabase/add-quota-paid-at.sql`: adiciona a data em que cada quota foi paga.
- `supabase/add-approval-minute-number.sql`: adiciona o Nº de Ata de Aprovação.

Se a base ainda não tiver observações internas, execute também:

```sql
alter table public.members
add column if not exists notes text;
```

Para reforcar permissoes numa base ja publicada, execute tambem o ficheiro `supabase/harden-rls.sql` no `SQL Editor`. Esse reforco remove permissoes diretas desnecessarias, impede eliminacao direta de utilizadores pelo cliente e obriga a eliminacao de administradores a passar pela funcao segura da Vercel.

## Configurar o website

No ficheiro `config.js`, preencha:

```js
window.SOCIOS_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "SUA_CHAVE_ANON_PUBLICA",
  captchaProvider: "turnstile",
  captchaSiteKey: "SITE_KEY_DO_CLOUDFLARE_TURNSTILE",
  organizationName: "Gestão de Sócios",
};
```

Use a chave `anon`/`publishable`. Nunca coloque a chave `service_role` no website.

Se ainda não tiver Cloudflare Turnstile, deixe `captchaProvider` e `captchaSiteKey` vazios. Para proteção mais forte contra brute force e bots, crie um widget Turnstile, configure a `Secret key` no Supabase em `Authentication > Bot and Abuse Protection`, e coloque a `Site key` no `config.js`. A app só mostra o Turnstile depois de uma tentativa de login falhada neste browser, mantendo o login normal mais simples para utilizadores legítimos.

## Publicar na Vercel

1. Crie uma conta em Vercel.
2. Publique esta pasta como projeto estático.
3. Em `Settings > Environment Variables`, adicione `SUPABASE_SERVICE_ROLE_KEY` com a service role key do Supabase (`Project Settings > API`).
4. Depois de publicado, abra o domínio gerado pela Vercel.
5. Entre com o utilizador admin criado no Supabase.

O ficheiro `vercel.json` já inclui cabeçalhos de segurança: CSP, bloqueio de iframe, `nosniff`, política de permissões, referrer policy e CORS restrito ao domínio de produção.

Os scripts de terceiros estão guardados localmente em `vendor/`, para evitar dependência de CDN externa e alertas de falta de Subresource Integrity.

A variável `SUPABASE_SERVICE_ROLE_KEY` é necessária para o botão `Gestor de Administradores` criar utilizadores sem ir ao Supabase. Esta chave fica só no servidor da Vercel; nunca deve ser colocada em `config.js`, no browser ou no GitHub.

## Dados guardados

- Nº de sócio (opcional)
- Nº de Ata de Aprovação
- Data de adesão
- Última quota paga
- Data do pagamento da quota
- Nome
- Morada
- Código postal
- Localidade
- Número do BI ou CC (opcional)
- NIF
- Categoria
- Data de nascimento
- Telemóvel
- Email
- Observações internas

## Exportação

O menu de ferramentas exporta uma folha Excel `.xlsx`. O botão `CSV` continua disponível para exportação simples compatível com Excel e outras folhas de cálculo.

## Recomendações de segurança

- Ative MFA/2FA para administradores no Supabase.
- Ative Cloudflare Turnstile no Supabase para o login.
- Use passwords longas e únicas.
- Dê acesso só a emails autorizados.
- Reveja regularmente a tabela `member_audit_log`.
- Faça backups regulares da base de dados.
- Recolha BI/CC apenas se a organização tiver necessidade real para esse dado.
