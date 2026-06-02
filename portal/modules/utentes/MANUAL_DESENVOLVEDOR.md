# Manual do Desenvolvedor - Utentes MenteMovimento

Este manual e para a pessoa que vier manter ou desenvolver a aplicacao depois do projeto estar entregue. O manual do site, acessivel pelo menu da aplicacao, e apenas para utilizadores finais. Este documento e tecnico e deve ficar no repositorio.

## 1. Visao Geral

A aplicacao gere utentes da MenteMovimento com:

- Login e perfis de acesso.
- Gestao de utilizadores.
- Lista de utentes.
- Edicao e consulta de fichas por separadores.
- Campos partilhados entre separadores.
- Historico de alteracoes.
- Modo claro/escuro.
- Interface em Portugues/Ingles.
- Anexos PDF por utente.
- Armazenamento local em SQLite ou remoto em Supabase.
- Deploy em Vercel atraves de uma funcao Python.

O codigo foi mantido simples: a aplicacao principal esta concentrada em `app.py`, sem frameworks externos obrigatorias.

## 2. Repositorio Oficial

Repositorio GitHub atual:

```text
https://github.com/jf77ps/Utentes_MenteMovimento
```

Branch principal:

```text
main
```

Fluxo esperado:

1. Alterar o codigo localmente.
2. Testar localmente.
3. Fazer commit no GitHub Desktop.
4. Fazer `Push origin`.
5. A Vercel cria novo deploy automaticamente.

## 3. Estrutura de Ficheiros

```text
app.py                  Aplicacao principal.
api/index.py            Entrada serverless usada pela Vercel.
vercel.json             Configuracao de rewrites e funcoes Vercel.
supabase_schema.sql     SQL para criar tabelas e bucket no Supabase.
README.md               Guia curto de arranque.
MANUAL_DESENVOLVEDOR.md Este manual tecnico.
.env.example            Exemplo de variaveis de ambiente.
.gitignore              Ficheiros que nao devem ir para GitHub.
logo-horizontal.png     Logotipo usado no site.
```

Ficheiros locais sensiveis ou descartaveis:

```text
.env
utentes.db
utentes.db-*
anexos/
__pycache__/
.vercel/
*.zip
```

Estes ficheiros nao devem ser enviados para o GitHub.

## 4. Como a Aplicacao Arranca

### Local

Para correr localmente:

```powershell
python app.py
```

Abrir:

```text
http://127.0.0.1:8000
```

O metodo `run()` em `app.py` inicializa a base de dados e arranca um `ThreadingHTTPServer`.

### Vercel

Na Vercel, a entrada e:

```text
api/index.py
```

Esse ficheiro importa `UtentesHandler` de `app.py` e declara:

```python
class handler(UtentesHandler):
    pass
```

A Vercel reconhece funcoes Python quando existe um `handler` que herda de `BaseHTTPRequestHandler`.

O ficheiro `vercel.json` encaminha todas as rotas para a funcao Python:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.py"
    }
  ]
}
```

## 5. Variaveis de Ambiente

O ficheiro `.env` local deve seguir o modelo de `.env.example`:

```text
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_BUCKET=documentos-utentes
```

Significado:

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta do projeto, usada apenas no backend.
- `SUPABASE_BUCKET`: bucket privado para PDFs.

Nunca colocar `.env` no GitHub.

## 6. Modo SQLite vs Supabase

A aplicacao decide automaticamente onde guardar dados:

- Se `SUPABASE_URL` e `SUPABASE_SECRET_KEY` existirem, usa Supabase.
- Se essas variaveis nao existirem, usa SQLite local em `utentes.db`.

Isto permite testar localmente sem Supabase, mas em producao deve usar Supabase.

## 7. Base de Dados Local SQLite

Quando nao ha Supabase configurado, a aplicacao cria:

```text
utentes.db
```

As tabelas SQLite sao criadas pela constante `SCHEMA` em `app.py`.

O SQLite e util para testes locais, mas nao deve ser usado como base principal quando o site estiver publicado na Vercel, porque a Vercel nao mantem ficheiros persistentes entre execucoes serverless.

## 8. Supabase

### 8.1 Criar Estrutura

No Supabase:

1. Abrir o projeto.
2. Ir a `SQL Editor`.
3. Copiar todo o conteudo de `supabase_schema.sql`.
4. Executar.

Esse ficheiro cria:

- `utentes`
- `utilizadores`
- `sessoes`
- `utente_abas`
- `historico`
- `utente_anexos`
- bucket privado `documentos-utentes`

### 8.2 Chaves

Usar uma chave secreta do tipo:

```text
sb_secret_...
```

Esta chave deve ficar apenas:

- no `.env` local;
- nas Environment Variables da Vercel.

Nao deve ficar:

- no GitHub;
- no codigo;
- no README;
- em screenshots;
- em mensagens publicas.

Se uma chave for exposta:

1. Criar nova secret key no Supabase.
2. Atualizar `.env`.
3. Atualizar Environment Variables na Vercel.
4. Fazer redeploy.
5. Revogar a chave antiga.

### 8.3 Storage de PDFs

Os PDFs sao guardados no bucket:

```text
documentos-utentes
```

O caminho interno segue o ID do utente:

```text
{utente_id}/{stored_name}.pdf
```

Isto garante que cada utente tem os seus proprios documentos.

## 9. GitHub Desktop

O projeto esta ligado ao GitHub Desktop como repositorio local.

Para publicar uma alteracao:

1. Abrir GitHub Desktop.
2. Escolher o repositorio `Utentes_MenteMovimento`.
3. Confirmar a lista de ficheiros alterados.
4. Garantir que nao aparecem ficheiros sensiveis como `.env`, `utentes.db` ou `anexos/`.
5. Escrever uma mensagem curta em `Summary`.
6. Clicar em `Commit to main`.
7. Clicar em `Push origin`.

Boas mensagens de commit:

```text
Corrigir formulario de emergencia
Adicionar campo de contacto
Atualizar manual do utilizador
Corrigir deploy da Vercel
```

Evitar mensagens vagas:

```text
alteracoes
teste
coisas
final
```

## 10. Vercel

### 10.1 Criar Projeto

Na Vercel:

1. Criar novo projeto.
2. Importar o repositorio `jf77ps/Utentes_MenteMovimento`.
3. Manter `Root Directory` como:

```text
./
```

4. Manter preset `Other`.
5. Adicionar variaveis de ambiente.

### 10.2 Variaveis na Vercel

Adicionar em `Project Settings > Environment Variables`:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
SUPABASE_BUCKET
```

Usar em:

- Production
- Preview
- Development

Depois de alterar variaveis, fazer redeploy.

### 10.3 Deploy Automatico

Cada push para `main` dispara um novo deploy.

Se falhar:

1. Abrir o projeto na Vercel.
2. Entrar no deploy com erro.
3. Clicar em `Inspect Deployment`.
4. Ler `Build Logs` e `Runtime Logs`.
5. Corrigir localmente.
6. Fazer commit e push novamente.

## 11. Ficheiros Importantes no Codigo

### 11.1 Configuracao Inicial

No topo de `app.py` estao:

- imports;
- leitura de `.env`;
- caminhos locais;
- variaveis Supabase;
- lista de separadores;
- perfis de utilizador.

### 11.2 Base de Dados

Funcoes principais:

- `get_connection()`: abre SQLite.
- `init_db()`: inicializa SQLite ou Supabase.
- `ensure_default_admin()`: cria admin inicial quando nao ha utilizadores.
- `supabase_request()`: faz pedidos REST ao Supabase.
- `table_select()`, `table_insert()`, `table_update()`, `table_delete()`, `table_upsert()`: helpers Supabase.

### 11.3 Autenticacao

Funcoes principais:

- `hash_password()`
- `verify_password()`
- `create_session()`
- `delete_session()`
- `get_current_user()`
- `session_cookie()`
- `clear_session_cookie()`

Os cargos sao:

```text
Administrador
Utilizador
```

Administrador pode criar, editar, apagar e gerir utilizadores.

Utilizador pode consultar, sem editar.

### 11.4 Renderizacao

A aplicacao gera HTML diretamente por funcoes Python.

Funcoes importantes:

- `render_page()`
- `render_header()`
- `render_list()`
- `render_edit_page()`
- `render_view_page()`
- `render_user_manager()`
- `render_history_page()`
- `render_manual_page()`

O CSS esta na constante:

```text
STYLE
```

O JavaScript esta na constante:

```text
APP_SCRIPT
```

### 11.5 Separadores do Utente

Lista principal:

```python
TAB_SECTIONS = [
    ("referenciacao", "..."),
    ("emergencia", "..."),
    ("inscricao", "..."),
    ("diagnostica", "..."),
    ("atendimentos", "..."),
    ("protecao_dados", "..."),
]
```

Ao adicionar um novo separador:

1. Adicionar a chave em `TAB_SECTIONS`.
2. Criar funcoes de renderizacao.
3. Criar funcoes para ler dados do POST, se for estruturado.
4. Atualizar `render_edit_page()`.
5. Atualizar `render_view_page()`.
6. Atualizar o fluxo de guardar em `do_POST()`.
7. Atualizar o manual do utilizador, se necessario.

### 11.6 Campos Interligados

Campos iguais entre separadores sao sincronizados por:

- `SHARED_FIELD_ALIASES`
- `sync_shared_fields()`
- `apply_utente_core_values()`
- `update_utente_core_from_shared()`
- `sync_shared_fields_from_active()`
- `sync_saved_shared_tabs()`

Antes de criar um novo campo duplicado em varios separadores, verificar se deve entrar em `SHARED_FIELD_ALIASES`.

### 11.7 PDFs

Funcoes principais:

- `render_protecao_dados_form()`
- `save_pdf_attachment()`
- `list_pdf_attachments()`
- `get_pdf_attachment()`
- `delete_pdf_attachment()`
- `send_pdf_attachment()`

Em SQLite, os PDFs ficam em:

```text
anexos/{utente_id}/
```

Em Supabase, ficam no bucket:

```text
documentos-utentes
```

## 12. Como Fazer uma Alteracao Segura

Fluxo recomendado:

1. Confirmar que a app local arranca.
2. Alterar o codigo.
3. Correr:

```powershell
python -m py_compile app.py api/index.py
```

4. Testar no browser:
   - login;
   - lista de utentes;
   - criar utente;
   - editar separadores;
   - trocar separadores;
   - guardar;
   - ver em modo consulta;
   - anexar PDF;
   - consultar historico.
5. Verificar GitHub Desktop.
6. Confirmar que ficheiros sensiveis nao aparecem.
7. Commit.
8. Push.
9. Confirmar deploy na Vercel.

## 13. Checklist Antes de Entregar Alteracoes

- O codigo compila.
- O login funciona.
- Administrador consegue criar/editar/apagar utentes.
- Utilizador consegue apenas consultar.
- Separadores guardam sem perder dados.
- Campos partilhados continuam sincronizados.
- PDFs continuam por utente.
- Historico regista as alteracoes.
- Modo claro/escuro continua funcional.
- Portugues/Ingles continuam funcionais.
- `.env` nao foi para GitHub.
- `utentes.db` nao foi para GitHub.
- `anexos/` nao foi para GitHub.
- Deploy da Vercel terminou sem erro.

## 14. Problemas Comuns

### A Vercel falha no build

Verificar:

- `api/index.py` tem uma classe `handler`.
- `handler` herda de `UtentesHandler`, que herda de `BaseHTTPRequestHandler`.
- `vercel.json` aponta para `/api/index.py`.
- O padrao em `functions` e `api/**/*.py`.
- Os logs completos em `Inspect Deployment`.

### A app abre mas nao liga ao Supabase

Verificar na Vercel:

- `SUPABASE_URL` correto.
- `SUPABASE_SECRET_KEY` correto.
- `SUPABASE_BUCKET` correto.
- variaveis aplicadas em Production.
- redeploy depois de alterar variaveis.

Verificar no Supabase:

- SQL de `supabase_schema.sql` executado.
- tabelas existem.
- bucket `documentos-utentes` existe.
- chave secreta ainda esta ativa.

### Login inicial nao funciona

Se a tabela `utilizadores` estiver vazia, a app cria:

```text
Email: admin@mentemovimento.local
Password: admin123
```

Depois deve ser criada uma conta real e a password inicial deve deixar de ser usada.

### PDFs nao abrem

Verificar:

- se o ficheiro e PDF valido;
- se o bucket existe;
- se `SUPABASE_BUCKET` esta correto;
- se a chave secreta tem acesso ao Storage;
- se o registo existe em `utente_anexos`.

## 15. Seguranca e Dados Sensíveis

Esta aplicacao lida com dados de utentes, por isso:

- Nunca publicar bases de dados reais.
- Nunca publicar PDFs reais.
- Nunca publicar `.env`.
- Nunca partilhar `SUPABASE_SECRET_KEY`.
- Usar contas individuais para utilizadores reais.
- Desativar utilizadores que ja nao devem entrar.
- Fazer rotacao de chaves se alguma chave for exposta.
- Consultar o historico para perceber alteracoes importantes.

## 16. Fontes Oficiais Uteis

- GitHub Desktop: https://docs.github.com/en/desktop
- Supabase API Keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Storage: https://supabase.com/docs/guides/storage
- Vercel Python Runtime: https://vercel.com/docs/functions/runtimes/python
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables

## 17. Nota Final Para o Proximo Desenvolvedor

Antes de alterar formularios grandes, leia primeiro as funcoes de renderizacao e as funcoes que transformam dados POST em JSON. Muitos separadores guardam conteudo estruturado dentro da tabela `utente_abas`, por isso uma alteracao visual pode precisar de alteracao no parser correspondente.

Quando tiver duvidas, faca alteracoes pequenas, teste uma a uma e mantenha commits curtos e claros.
