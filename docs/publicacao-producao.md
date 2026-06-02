# Publicacao em producao

Dados confirmados para esta versao:

- Nome do projeto: `central-mente-movimento`
- GitHub: repositorio publico na conta da associacao
- Supabase: novo projeto
- Vercel: conta da associacao, sem dominio proprio por agora
- Dados antigos: migrar depois

## Antes de publicar

Nao publicar dados locais, bases antigas nem chaves privadas. Estes itens ficam fora do GitHub atraves do `.gitignore`:

- `.runtime/`
- `sources/`
- `node_modules/`
- `dist/`
- `.vercel/`
- `.env` e `.env.local`
- ficheiros `*.db`, `*.sqlite` e anexos locais

O ficheiro `.env.example` fica no repositorio apenas com exemplos seguros.

## 1. GitHub

Cria um repositorio publico na conta da associacao com o nome:

```text
central-mente-movimento
```

Como o Git nao esta disponivel neste computador neste momento, a forma mais simples e usar o GitHub Desktop:

1. Abre o GitHub Desktop com a conta da associacao.
2. Escolhe `File > Add local repository`.
3. Seleciona `C:\Users\Asus\Documents\CentralMenteMovimento`.
4. Confirma que os ficheiros ignorados acima nao entram no commit.
5. Publica o repositorio como publico.

Depois disso, qualquer alteracao futura fica no fluxo normal: alterar localmente, fazer commit, enviar para GitHub e deixar a Vercel publicar a nova versao.

## 2. Supabase

Cria um novo projeto Supabase na conta da associacao.

Guarda estes valores para configurar localmente e na Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

A `SUPABASE_SERVICE_ROLE_KEY` e secreta. Fica apenas no ambiente local protegido ou nas variaveis da Vercel. Nunca deve ir para GitHub nem para codigo frontend.

Para preparar a base vazia, usa as instrucoes em `supabase/README.md`.

## 3. Vercel

Na conta da associacao:

1. Importa o repositorio `central-mente-movimento` a partir do GitHub.
2. Configura as variaveis de ambiente.
3. Faz o primeiro deploy.

Variaveis recomendadas:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_BUCKET
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

`SUPABASE_SECRET_KEY` pode ter o mesmo valor da `SUPABASE_SERVICE_ROLE_KEY`, porque a area de Utentes aceita esse nome.

## Estado importante

Esta pasta ja esta preparada para ser enviada para GitHub sem levar dados locais nem segredos.

Ainda assim, a Central atual e uma integracao local: usa `portal/server.py`, SQLite e proxies internos para juntar as tres areas. Antes de substituir os sites antigos em producao, falta converter a Central para um deploy unico real na Vercel, com login e dados ligados ao novo Supabase.

Nao apagues os sites antigos antes da checklist em `docs/estado-producao.md` estar concluida.
