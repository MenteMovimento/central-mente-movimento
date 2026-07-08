# Mapa de funcionalidades da central

Este ficheiro separa o que fica em cada ramo e o que passa a ser global na aplicação central.

## Funcionalidades globais

Estas funcionalidades aparecem na barra superior e servem todos os ramos:

- Login e logout.
- Idioma.
- Modo claro/escuro.
- Manuais.
- Histórico geral.
- Gestão de administradores, utilizadores e permissões.

## Ramo Sócios

Funcionalidades que devem ser migradas do projeto de sócios:

- Gestão de sócios.
- Quotas.
- Exportações.

Dados previstos:

```text
socios.members
socios.member_quota_events
```

## Ramo Utentes

Funcionalidades que devem ser migradas do projeto de utentes:

- Fichas de utentes.
- Separadores/formulários.
- Anexos PDF.
- Genograma.
- Ecomapa.

Dados previstos:

```text
utentes.utentes
utentes.utente_abas
utentes.utente_anexos
```

## Ramo Ciberseguranca

Funcionalidades que devem ser migradas do projeto de ciberseguranca:

- Listagem.
- Reparações.
- Estados.
- Estatísticas.
- Anexos.
- Importação/exportação CSV.

Dados previstos:

```text
dispositivos.devices
dispositivos.device_repairs
dispositivos.device_attachments
```

## Regra principal

Cada ramo continua separado nos dados, mas dentro do mesmo projeto Supabase e da mesma aplicação.

```text
central.membros_do_sistema
socios.*
utentes.*
dispositivos.*
```

O utilizador entra uma vez e a sessão é reaproveitada em todas as áreas.
