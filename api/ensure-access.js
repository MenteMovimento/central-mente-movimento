import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../api-lib/http.js'
import { canViewArea, normalizePermissions } from '../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../api-lib/central-session.js'

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
}

const createAdminClient = () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const createUserClient = (response, token) => {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_ANON_KEY na Vercel.' })
    return null
  }

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const getBearerToken = (request) => {
  const authHeader = request.headers.authorization ?? ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
}

const errorMessage = (error) => {
  if (!error) return 'Nao foi possivel preparar o acesso.'
  if (error instanceof Error) return error.message
  if (typeof error.message === 'string') return error.message
  if (typeof error.error_description === 'string') return error.error_description
  if (typeof error.error === 'string') return error.error
  return 'Nao foi possivel preparar o acesso.'
}

const accessError = (status, message) => {
  const error = new Error(message)
  error.status = status
  error.expose = true
  return error
}

const getDisplayName = (user) => {
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : ''
  const emailName = user.email ? user.email.split('@')[0] : ''
  return metadataName || emailName || 'Administrador'
}

const getExistingRow = async (adminClient, table, userId) => {
  const { data, error } = await adminClient.from(table).select('*').eq('id', userId).maybeSingle()
  if (error) return null
  return data ?? null
}

const ensureProfile = async (adminClient, user) => {
  const existing = await getExistingRow(adminClient, 'profiles', user.id)
  const row = {
    id: user.id,
    email: user.email ?? existing?.email ?? null,
    full_name: existing?.full_name ?? getDisplayName(user),
    // The legacy profile role is only needed by the older device schema.
    // Central access is always checked against app_users.permissions.
    role: existing?.role ?? 'member',
  }

  const { error } = await adminClient.from('profiles').upsert(row, { onConflict: 'id' })
  if (!error) return row

  const { email: _email, ...fallbackRow } = row
  const { error: fallbackError } = await adminClient
    .from('profiles')
    .upsert(fallbackRow, { onConflict: 'id' })

  if (fallbackError) throw fallbackError
  return row
}

const ensureExistingAccess = async (userClient, user) => {
  const { data: appUser, error: appUserError } = await userClient
    .from('app_users')
    .select('id, email, full_name, role, active, permissions')
    .eq('id', user.id)
    .maybeSingle()

  if (appUserError) {
    const message = errorMessage(appUserError).toLowerCase()
    if (message.includes('permissions')) {
      throw accessError(503, 'A matriz de permissoes ainda nao foi instalada na base de dados.')
    }
    throw appUserError
  }

  if (appUser) {
    appUser.permissions = normalizePermissions(appUser.permissions)
  }

  return ensureAuthorizedProfile(appUser)
}

const ensureAuthorizedProfile = (appUser) => {
  if (appUser?.active === false) {
    throw accessError(403, 'Utilizador sem acesso ativo.')
  }
  if (!appUser) {
    throw accessError(403, 'Utilizador ainda nao preparado.')
  }

  return { appUser, profile: null }
}

const requestedArea = (body) => {
  const area = String(body?.area ?? '').trim()
  return ['socios', 'utentes', 'dispositivos', 'atividades'].includes(area) ? area : ''
}

const enforceAreaAccess = (appUser, area) => {
  if (area && !canViewArea(appUser, area)) {
    throw accessError(403, `Sem permissao para aceder a ${area}.`)
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  try {
    const token = getBearerToken(request)
    const body = await readBody(request)
    const area = requestedArea(body)

    if (!token) {
      sendJson(response, 401, { error: 'Sessao em falta.' })
      return
    }

    const userClient = createUserClient(response, token)
    if (!userClient) return

    const {
      data: { user },
      error,
    } = await userClient.auth.getUser(token)

    if (error || !user) {
      sendJson(response, 401, { error: 'Sessao invalida.' })
      return
    }

    try {
      const adminClient = createAdminClient()
      if (!adminClient) {
        throw accessError(500, 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.')
      }
      await assertVerifiedCentralSession(adminClient, token, { user })
      const { appUser, profile } = await ensureExistingAccess(userClient, user)
      enforceAreaAccess(appUser, area)
      sendJson(response, 200, { ok: true, appUser, profile })
      return
    } catch (accessError) {
      const status = Number(accessError?.status)
      sendJson(response, status >= 400 && status < 600 ? status : 503, {
        error: exposedErrorMessage(accessError, 'Nao foi possivel validar o acesso.'),
        code: accessError?.code ?? null,
      })
      return
    }
  } catch (error) {
    console.error('ensure-access failed', error)
    const status = Number(error?.status)
    sendJson(response, status >= 400 && status < 500 ? status : 500, {
      error: exposedErrorMessage(error, 'Nao foi possivel preparar o acesso.'),
      code: error?.code ?? null,
    })
  }
}
