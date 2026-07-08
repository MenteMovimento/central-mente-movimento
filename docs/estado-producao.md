# Estado de producao

## Pronto agora

- Projeto preparado para repositorio publico sem incluir bases locais, anexos locais, `node_modules`, builds, `.runtime` ou projetos antigos em `sources`.
- `.env.example` criado com nomes de variaveis esperadas, sem segredos reais.
- Documentacao criada para publicar em GitHub, criar Supabase novo e configurar Vercel.
- As tres areas continuam disponiveis localmente dentro da Central, sem segundo login.

## Ainda falta antes de apagar os sites antigos

- Trocar o login local da Central por Supabase Auth no projeto novo.
- Substituir a API local de Socios (`/api/socios/query`) por ligacao de producao ao Supabase ou por API serverless propria da Vercel.
- Garantir que os botoes de gestao de administradores/utilizadores usam apenas funcoes serverless com `SUPABASE_SERVICE_ROLE_KEY` guardada na Vercel.
- Remover a dependencia dos servidores locais nas portas `8091` e `8092`.
- Decidir a forma final da area de Utentes em producao: manter backend Python serverless ou migrar para frontend/Supabase diretamente.
- Criar regras RLS finais para proteger dados de Socios, Utentes, Ciberseguranca, Historico e Utilizadores.
- Fazer migracao dos dados antigos depois de testar a base vazia.
- Validar anexos PDF, anexos de ciberseguranca, CSV, exportacoes, modo escuro, idioma, manuais e menus nas areas depois do deploy.

## Recomendacao

Usa esta versao para preparar GitHub, Supabase e Vercel da associacao, mas mantem os tres sites antigos ativos ate a conversao final e a migracao de dados estarem testadas.
