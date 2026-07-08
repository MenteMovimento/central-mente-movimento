# Central MenteMovimento

Projeto local para testar um unico site central para os tres ramos de gestao da associacao:

- Gestao de Socios
- Gestao de Utentes
- Ciberseguranca

## Correr localmente

Na pasta `C:\Users\Asus\Documents\CentralMenteMovimento`:

```powershell
.\start-local.ps1
```

Depois abre:

```text
http://127.0.0.1:8090
```

Para usar o ramo de Socios sem segundo login, entra na Central com as credenciais locais:

```text
Email: admin@mentemovimento.local
Password: admin123
```

A area de Socios corre dentro deste projeto e usa a base local:

```text
C:\Users\Asus\Documents\CentralMenteMovimento\.runtime\central.db
```

A area de Utentes tambem corre dentro da Central, sem segundo login. A copia local usa:

```text
C:\Users\Asus\Documents\CentralMenteMovimento\portal\modules\utentes\utentes.db
```

A area de Ciberseguranca tambem corre dentro da Central, sem segundo login. A copia local fica em:

```text
C:\Users\Asus\Documents\CentralMenteMovimento\portal\modules\dispositivos
```

Para parar os servicos:

```powershell
.\stop-local.ps1
```

## Rotas locais

```text
Central:       http://127.0.0.1:8090
Socios:        http://127.0.0.1:8090/area/socios
Utentes:       http://127.0.0.1:8090/area/utentes
Ciberseguranca: http://127.0.0.1:8090/area/dispositivos
```

Tambem existem atalhos:

```text
http://127.0.0.1:8090/socios
http://127.0.0.1:8090/utentes
http://127.0.0.1:8090/dispositivos
```

## Estado atual

Esta versao e um prototipo seguro de integracao local. A Central faz login proprio e abre as tres areas dentro do mesmo site, sem segundo login.

O ramo de Socios ja esta integrado como copia local da aplicacao de Socios, com uma API local compativel com as chamadas principais usadas pela app.

O ramo de Utentes ja esta integrado como copia local da aplicacao Python de Utentes, incluindo fichas, separadores, anexos PDF, genograma/ecomapa, historico, utilizadores, tema, idioma e manuais.

O ramo de Ciberseguranca ja esta integrado como copia local da aplicacao React/Vite, incluindo listagem, reparacoes, estados, estatisticas, CSV e fluxo visual proprio dentro da Central.

O tema claro/escuro passa a ser partilhado entre as areas, e as ferramentas secundarias ficam recolhidas no menu dos tres tracinhos para manter a barra superior consistente.

Os projetos antigos nao sao alterados.

Para transformar isto no sistema final, o proximo passo e migrar o codigo e os dados para uma unica aplicacao com um unico projeto Supabase, separando a base por schemas/ramos.

Ver tambem:

- `docs/mapa-funcionalidades.md`
- `docs/migracao-supabase.md`
- `docs/schema-central-exemplo.sql`
- `docs/publicacao-producao.md`
- `docs/estado-producao.md`
