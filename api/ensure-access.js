import { createClient } from '@supabase/supabase-js'

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
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const getBearerToken = (request) => {
  const authHeader = request.headers.authorization ?? ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
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

const ensureAppUser = async (adminClient, user) => {
  const existing = await getExistingRow(adminClient, 'app_users', user.id)
  const row = {
    id: user.id,
    email: user.email ?? existing?.email ?? null,
    full_name: existing?.full_name ?? getDisplayName(user),
    role: existing?.role ?? 'admin',
    active: true,
  }

  const { error } = await adminClient.from('app_users').upsert(row, { onConflict: 'id' })
  if (error) throw error

  return row
}

const ensureProfile = async (adminClient, user) => {
  const existing = await getExistingRow(adminClient, 'profiles', user.id)
  const row = {
    id: user.id,
    email: user.email ?? existing?.email ?? null,
    full_name: existing?.full_name ?? getDisplayName(user),
    role: existing?.role ?? 'admin',
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

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  try {
    const token = getBearerToken(request)

    if (!token) {
      sendJson(response, 401, { error: 'Sessao em falta.' })
      return
    }

    const {
      data: { user },
      error,
    } = await adminClient.auth.getUser(token)

    if (error || !user) {
      sendJson(response, 401, { error: 'Sessao invalida.' })
      return
    }

    const [appUser, profile] = await Promise.all([
      ensureAppUser(adminClient, user),
      ensureProfile(adminClient, user),
    ])

    sendJson(response, 200, { ok: true, appUser, profile })
  } catch (error) {
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Nao foi possivel preparar o acesso.',
    })
  }
}
