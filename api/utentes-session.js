import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const sendJson = (response, status, body) => {
  response.status(status).json(body)
}

const createAdminClient = (response) => {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    sendJson(response, 500, { error: 'Falta configurar as variaveis Supabase na Vercel.' })
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const requireCentralUser = async (request, response, adminClient) => {
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

  if (error || !user?.email) {
    sendJson(response, 401, { error: 'Sessao invalida.' })
    return null
  }

  const { data: profile } = await adminClient
    .from('app_users')
    .select('role, active, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.active) {
    sendJson(response, 403, { error: 'Utilizador sem permissao na Central.' })
    return null
  }

  return {
    id: user.id,
    email: user.email,
    fullName: profile.full_name || user.user_metadata?.full_name || 'Administrador',
    isAdmin: profile.role === 'admin' || profile.role === 'operator',
  }
}

const ensureUtentesUser = async (adminClient, centralUser) => {
  const email = centralUser.email.toLowerCase()
  const now = new Date().toISOString()
  const perfil = centralUser.isAdmin ? 'Administrador' : 'Utilizador'

  const { data: existing, error: existingError } = await adminClient
    .from('utilizadores')
    .select('id, perfil')
    .eq('email', email)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { error: updateError } = await adminClient
      .from('utilizadores')
      .update({
        nome: centralUser.fullName,
        perfil,
        ativo: 1,
        updated_at: now,
      })
      .eq('id', existing.id)

    if (updateError) throw updateError
    return existing.id
  }

  const { data: created, error: createError } = await adminClient
    .from('utilizadores')
    .insert({
      nome: centralUser.fullName,
      email,
      password_hash: 'supabase-auth',
      perfil,
      ativo: 1,
      tema: 'claro',
      idioma: 'pt',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (createError) throw createError
  return created.id
}

export default async function handler(request, response) {
  if (request.method === 'DELETE') {
    response.setHeader(
      'Set-Cookie',
      'utentes_session=; Path=/area/utentes; Max-Age=0; SameSite=Lax; Secure',
    )
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  try {
    const centralUser = await requireCentralUser(request, response, adminClient)
    if (!centralUser) return

    const utilizadorId = await ensureUtentesUser(adminClient, centralUser)
    const now = new Date()
    const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000)
    const token = crypto.randomBytes(32).toString('base64url')

    await adminClient.from('sessoes').delete().lt('expires_at', now.toISOString())

    const { error: sessionError } = await adminClient.from('sessoes').insert({
      token,
      utilizador_id: utilizadorId,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })

    if (sessionError) throw sessionError

    response.setHeader(
      'Set-Cookie',
      `utentes_session=${token}; Path=/area/utentes; Max-Age=43200; SameSite=Lax; Secure`,
    )
    sendJson(response, 200, { ok: true })
  } catch (error) {
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Nao foi possivel iniciar Utentes.',
    })
  }
}
