# Próximos passos para a central final

Este protótipo local já junta a navegação num único site, mas ainda não junta as bases de dados nem a autenticação real da Supabase.

## 1. Fazer backups

Antes de qualquer migração:

- Exportar a base de sócios.
- Exportar a base de dispositivos.
- Exportar a base de utentes.
- Guardar ficheiros/anexos do Supabase Storage.
- Confirmar contagens de registos antes e depois.

## 2. Escolher o projeto Supabase principal

Usar um único projeto Supabase para a central final. A separação por "ramos" deve ser feita dentro da mesma base de dados.

Sugestão de organização:

```text
socios.members
socios.member_audit_log
dispositivos.devices
dispositivos.device_history
dispositivos.device_attachments
utentes.utentes
utentes.utente_abas
utentes.utente_anexos
utentes.utente_utilizadores
```

Em Supabase/PostgreSQL, estes "ramos" chamam-se normalmente `schemas`.

## 3. Unificar autenticação

Todos os módulos devem usar a mesma Supabase Auth. O utilizador entra uma vez no site central e a sessão é reaproveitada nas áreas internas.

Perfis possíveis:

```text
admin
socios
utentes
dispositivos
viewer
```

Depois, as políticas RLS controlam o que cada pessoa pode ver ou editar.

## 4. Migrar por fases

Ordem recomendada:

1. Criar uma Supabase de teste.
2. Executar os schemas dos três projetos.
3. Importar dados de teste.
4. Corrigir conflitos de nomes, IDs e permissões.
5. Testar login e ações principais.
6. Migrar dados reais.
7. Validar com a associação.
8. Só depois desativar projetos antigos.

## 5. Publicação

Quando estiver tudo junto, a Vercel passa a publicar só uma aplicação central.

O plano Free da Supabase continua limitado a dois projetos ativos, mas a central final deverá precisar apenas de um projeto Supabase.
