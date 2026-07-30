import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../../../../api-lib/http.js'
import { hasPermission, normalizePermissions } from '../../../../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../../../../api-lib/central-session.js'

const utenteColumns =
  'id, nome, data_nascimento, telefone, email, morada, numero_utente, nif, contacto_emergencia, estado, observacoes, created_at, updated_at'
const publicUtenteColumns = 'id, nome, numero_utente, estado, created_at, updated_at'
const sensitiveFields = [
  'data_nascimento',
  'telefone',
  'email',
  'morada',
  'nif',
  'contacto_emergencia',
  'observacoes',
]
const fieldLimits = {
  nome: 200,
  numero_utente: 100,
  estado: 40,
  data_nascimento: 10,
  telefone: 50,
  email: 254,
  morada: 1000,
  nif: 50,
  contacto_emergencia: 1000,
  observacoes: 5000,
}

const stripOuterWhitespace = (value) => value.replace(/^\s+|\s+$/g, '')

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
}

const getErrorMessage = (error) => {
  if (!error) return ''
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  if (typeof error === 'object') {
    const parts = [
      error.message,
      error.error_description,
      error.error,
      error.details,
      error.hint,
    ].filter((part, index, list) => typeof part === 'string' && part.length > 0 && list.indexOf(part) === index)

    if (parts.length > 0) return parts.join(' ')
    if (typeof error.code === 'string') return error.code
  }

  return String(error)
}

const createAdminClient = (response) => {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    sendJson(response, 500, {
      error: 'Falta configurar as variaveis Supabase na Vercel.',
    })
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

const requireCentralUser = async (request, response, adminClient, action) => {
  const authHeader = request.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    sendJson(response, 401, { error: 'Sessao em falta.' })
    return null
  }

  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token)

  if (error || !user) {
    sendJson(response, 401, { error: 'Sessao invalida.' })
    return null
  }

  try {
    await assertVerifiedCentralSession(adminClient, token, { user })
  } catch (verificationError) {
    sendJson(response, verificationError.status ?? 401, {
      error: exposedErrorMessage(verificationError, 'Confirme o codigo enviado por email.'),
      code: verificationError?.code ?? null,
    })
    return null
  }

  const { data: profile, error: profileError } = await adminClient
    .from('app_users')
    .select('id, email, full_name, active, permissions')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    sendJson(response, 503, {
      error: getErrorMessage(profileError).toLowerCase().includes('permissions')
        ? 'A matriz de permissoes ainda nao foi instalada na base de dados.'
        : 'Nao foi possivel validar as permissoes do utilizador.',
    })
    return null
  }

  if (!profile?.active) {
    sendJson(response, 403, { error: 'Utilizador sem acesso ativo.' })
    return null
  }

  profile.permissions = normalizePermissions(profile.permissions)
  if (!hasPermission(profile, 'utentes', action)) {
    sendJson(response, 403, { error: 'Sem permissao para realizar esta acao em Utentes.' })
    return null
  }

  return { user, profile }
}

const limitedText = (value, maxLength, label) => {
  const text = stripOuterWhitespace(String(value ?? ''))
  if (text.length > maxLength) {
    const error = new Error(`${label} excede o tamanho permitido.`)
    error.status = 400
    throw error
  }
  return text
}

const optionalText = (value, maxLength = 5000, label = 'O campo') => {
  const text = limitedText(value, maxLength, label)
  return text || null
}

const requiredText = (value, maxLength, label) => limitedText(value, maxLength, label)

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const buildUtentePayload = (body, now, includeSensitive) => {
  const payload = { updated_at: now }

  if (hasOwn(body, 'nome')) payload.nome = requiredText(body.nome, fieldLimits.nome, 'O nome')
  if (hasOwn(body, 'numero_utente')) {
    payload.numero_utente = optionalText(body.numero_utente, fieldLimits.numero_utente, 'O numero de utente')
  }
  if (hasOwn(body, 'estado')) {
    payload.estado = optionalText(body.estado, fieldLimits.estado, 'O estado') ?? 'Ativo'
  }

  if (includeSensitive) {
    if (hasOwn(body, 'data_nascimento')) {
      payload.data_nascimento = optionalText(body.data_nascimento, fieldLimits.data_nascimento, 'A data de nascimento')
    }
    if (hasOwn(body, 'telefone')) {
      payload.telefone = optionalText(body.telefone, fieldLimits.telefone, 'O telefone')
    }
    if (hasOwn(body, 'email')) {
      payload.email = optionalText(body.email, fieldLimits.email, 'O email')?.toLowerCase() ?? null
      if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        const error = new Error('Indique um email valido.')
        error.status = 400
        throw error
      }
    }
    if (hasOwn(body, 'morada')) {
      payload.morada = optionalText(body.morada, fieldLimits.morada, 'A morada')
    }
    if (hasOwn(body, 'nif')) payload.nif = optionalText(body.nif, fieldLimits.nif, 'O NIF')
    if (hasOwn(body, 'contacto_emergencia')) {
      payload.contacto_emergencia = optionalText(
        body.contacto_emergencia,
        fieldLimits.contacto_emergencia,
        'O contacto de emergencia',
      )
    }
    if (hasOwn(body, 'observacoes')) {
      payload.observacoes = optionalText(body.observacoes, fieldLimits.observacoes, 'As observacoes')
    }
  }

  return payload
}

const attemptsSensitiveChange = (body) => sensitiveFields.some((field) => hasOwn(body, field))

const recordHistory = async (adminClient, user, action, targetId, details) => {
  try {
    await adminClient.from('historico').insert({
      utilizador_id: null,
      utilizador_nome: user.email ?? 'Utilizador autenticado',
      acao: action,
      alvo_tipo: 'utente',
      alvo_id: targetId,
      detalhes: details,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Historico dos utentes e opcional ate o SQL respetivo existir.
  }
}

const getUtente = async (adminClient, id, columns = publicUtenteColumns) => {
  const { data, error } = await adminClient
    .from('utentes')
    .select(columns)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  const requestedAction =
    request.method === 'GET'
      ? 'view'
      : request.method === 'DELETE'
        ? 'delete'
        : 'edit'
  const access = await requireCentralUser(request, response, adminClient, requestedAction)
  if (!access) return

  const { user, profile } = access
  const canViewSensitive = hasPermission(profile, 'utentes', 'view_sensitive')
  const canEditSensitive = hasPermission(profile, 'utentes', 'edit_sensitive')
  const responseColumns = canViewSensitive ? utenteColumns : publicUtenteColumns

  try {
    if (request.method === 'GET') {
      const search = limitedText(request.query?.search, 100, 'A pesquisa')
      let query = adminClient
        .from('utentes')
        .select(responseColumns)
        .order('updated_at', { ascending: false })
        .limit(500)

      if (search) {
        const safeSearch = search.replace(/[%(),]/g, '')
        const searchableColumns = canViewSensitive
          ? ['nome', 'email', 'telefone', 'numero_utente', 'nif']
          : ['nome', 'numero_utente']
        query = query.or(searchableColumns.map((column) => `${column}.ilike.%${safeSearch}%`).join(','))
      }

      const { data, error } = await query

      if (error) throw error

      sendJson(response, 200, { utentes: data ?? [] })
      return
    }

    const body = await readBody(request)

    if (!canEditSensitive && attemptsSensitiveChange(body)) {
      sendJson(response, 403, { error: 'Sem permissao para alterar dados sensiveis de Utentes.' })
      return
    }

    if (request.method === 'POST') {
      const now = new Date().toISOString()
      const payload = {
        ...buildUtentePayload(body, now, canEditSensitive),
        estado: optionalText(body.estado, fieldLimits.estado, 'O estado') ?? 'Ativo',
        created_at: now,
      }

      if (!payload.nome) {
        sendJson(response, 400, { error: 'O nome do utente e obrigatorio.' })
        return
      }

      const { data, error } = await adminClient
        .from('utentes')
        .insert(payload)
        .select(responseColumns)
        .single()

      if (error) throw error

      await recordHistory(adminClient, user, 'Criar utente', data.id, data.nome)
      sendJson(response, 200, { utente: data })
      return
    }

    const id = Number(body.id)

    if (!Number.isInteger(id) || id <= 0) {
      sendJson(response, 400, { error: 'Utente invalido.' })
      return
    }

    if (request.method === 'PATCH') {
      const payload = buildUtentePayload(body, new Date().toISOString(), canEditSensitive)

      if (!payload.nome) {
        sendJson(response, 400, { error: 'O nome do utente e obrigatorio.' })
        return
      }

      const { data, error } = await adminClient
        .from('utentes')
        .update(payload)
        .eq('id', id)
        .select(responseColumns)
        .single()

      if (error) throw error

      await recordHistory(adminClient, user, 'Atualizar utente', data.id, data.nome)
      sendJson(response, 200, { utente: data })
      return
    }

    const existing = await getUtente(adminClient, id)
    const { error } = await adminClient.from('utentes').delete().eq('id', id)

    if (error) throw error

    await recordHistory(adminClient, user, 'Eliminar utente', id, existing.nome)
    sendJson(response, 200, { ok: true })
  } catch (error) {
    sendJson(response, error.status ?? 400, {
      error: exposedErrorMessage(
        error,
        'Nao foi possivel gerir utentes. Confirma se apps/utentes/supabase_schema.sql foi executado.',
      ),
    })
  }
}
