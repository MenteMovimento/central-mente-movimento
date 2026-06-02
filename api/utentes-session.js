import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const sendJson = (response, status, body) => {
  response.status(status).json(body)
}

const getSupabaseUrl = () =>
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL

const createAdminClient = (response) => {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    sendJson(response, 500, {
      error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel para iniciar Utentes.',
    })
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const createUserClient = (response, token) => {
  const supabaseUrl = getSupabaseUrl()
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

const getErrorMessage = (error, fallback = 'Nao foi possivel iniciar Utentes.') => {
  if (!error) return fallback
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  if (typeof error.error_description === 'string') return error.error_description
  if (typeof error.error === 'string') return error.error
  return fallback
}

const cookieSecureAttribute = (request) => {
  const forwardedProto = String(request.headers['x-forwarded-proto'] ?? '')
  return process.env.VERCEL === '1' || forwardedProto.includes('https') ? '; Secure' : ''
}

const sessionCookie = (request, token, maxAge) =>
  `utentes_session=${token}; Path=/area/utentes; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${cookieSecureAttribute(request)}`

const clearSessionCookie = (request) => sessionCookie(request, '', 0)

const requireCentralUser = async (response, userClient, adminClient, token) => {
  if (!token) {
    sendJson(response, 401, { error: 'Sessao em falta.' })
    return null
  }

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(token)

  if (error || !user?.email) {
    sendJson(response, 401, { error: 'Sessao invalida.' })
    return null
  }

  const { data: profile } = await adminClient
    .from('app_users')
    .select('role, active, full_name')
    .eq('id', user.id)
    .maybeSingle()

  let effectiveProfile = profile
  if (!effectiveProfile) {
    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : user.email.split('@')[0]
    effectiveProfile = {
      role: 'admin',
      active: true,
      full_name: fullName || 'Administrador',
    }

    const { error: upsertError } = await adminClient.from('app_users').upsert({
      id: user.id,
      email: user.email,
      full_name: effectiveProfile.full_name,
      role: effectiveProfile.role,
      active: true,
    })

    if (upsertError) throw upsertError
  }

  if (!effectiveProfile.active) {
    sendJson(response, 403, { error: 'Utilizador sem permissao na Central.' })
    return null
  }

  return {
    id: user.id,
    email: user.email,
    fullName: effectiveProfile.full_name || user.user_metadata?.full_name || 'Administrador',
    isAdmin: effectiveProfile.role === 'admin' || effectiveProfile.role === 'operator',
  }
}

const ensureUtentesUser = async (adminClient, centralUser) => {
  const email = centralUser.email.toLowerCase()
  const now = formatDate(new Date())
  const perfil = centralUser.isAdmin ? 'Administrador' : 'Utilizador'
  const payload = {
    nome: centralUser.fullName,
    email,
    password_hash: 'supabase-auth',
    perfil,
    ativo: 1,
    tema: 'claro',
    idioma: 'pt',
    created_at: now,
    updated_at: now,
  }

  const { data: existing, error: existingError } = await adminClient
    .from('utilizadores')
    .select('id, perfil')
    .eq('email', email)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { created_at: _createdAt, ...updatePayload } = payload
    const { error: updateError } = await adminClient
      .from('utilizadores')
      .update(updatePayload)
      .eq('id', existing.id)

    if (updateError) throw updateError
    return existing.id
  }

  const { data: created, error: createError } = await adminClient
    .from('utilizadores')
    .upsert(payload, { onConflict: 'email' })
    .select('id')
    .single()

  if (createError) throw createError
  return created.id
}

const formatDate = (date) => date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')

export default async function handler(request, response) {
  if (request.method === 'DELETE') {
    response.setHeader(
      'Set-Cookie',
      clearSessionCookie(request),
    )
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  try {
    const bearerToken = getBearerToken(request)
    if (!bearerToken) {
      sendJson(response, 401, { error: 'Sessao em falta.' })
      return
    }

    const userClient = createUserClient(response, bearerToken)
    if (!userClient) return

    const adminClient = createAdminClient(response)
    if (!adminClient) return

    const centralUser = await requireCentralUser(response, userClient, adminClient, bearerToken)
    if (!centralUser) return

    const utilizadorId = await ensureUtentesUser(adminClient, centralUser)
    const now = new Date()
    const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000)
    const sessionToken = crypto.randomBytes(32).toString('base64url')

    await adminClient.from('sessoes').delete().lt('expires_at', now.toISOString())

    const { error: sessionError } = await adminClient.from('sessoes').insert({
      token: sessionToken,
      utilizador_id: utilizadorId,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })

    if (sessionError) throw sessionError

    response.setHeader(
      'Set-Cookie',
      sessionCookie(request, sessionToken, 43200),
    )
    sendJson(response, 200, { ok: true })
  } catch (error) {
    sendJson(response, 400, {
      error: getErrorMessage(error),
    })
  }
}
