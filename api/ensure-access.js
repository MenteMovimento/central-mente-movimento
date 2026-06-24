import { createClient } from '@supabase/supabase-js'

const sendJson = (response, status, body) => {
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

const getDisplayName = (user) => {
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : ''
  const emailName = user.email ? user.email.split('@')[0] : ''
  return metadataName || emailName || 'Administrador'
}

const centralRoleToDeviceRole = (role) => {
  if (role === 'admin') return 'admin'
  if (role === 'operator') return 'manager'
  return 'member'
}

const syncDeviceProfile = async (adminClient, user, appUser) => {
  const { data: existing } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const row = {
    id: user.id,
    email: user.email ?? appUser.email ?? null,
    full_name: existing?.full_name ?? appUser.full_name ?? getDisplayName(user),
    role: centralRoleToDeviceRole(appUser.role),
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
    .select('id, email, full_name, role, active')
    .eq('id', user.id)
    .maybeSingle()

  if (appUserError) throw appUserError
  if (appUser?.active === false) {
    throw new Error('Utilizador sem acesso ativo.')
  }
  if (!appUser) {
    throw new Error('Utilizador sem acesso configurado.')
  }

  return { appUser, profile: null }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  try {
    const token = getBearerToken(request)

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
      const { appUser, profile } = await ensureExistingAccess(userClient, user)
      const adminClient = createAdminClient()
      if (adminClient) {
        await syncDeviceProfile(adminClient, user, appUser).catch(() => null)
      }
      sendJson(response, 200, { ok: true, appUser, profile })
      return
    } catch (accessError) {
      if (errorMessage(accessError) === 'Utilizador sem acesso ativo.') {
        sendJson(response, 403, { error: 'Utilizador sem acesso ativo.' })
        return
      }
      if (errorMessage(accessError) === 'Utilizador sem acesso configurado.') {
        sendJson(response, 403, {
          error: 'Utilizador sem acesso configurado. Peça a um administrador para criar o acesso.',
        })
        return
      }
    }
    sendJson(response, 403, { error: 'Nao foi possivel validar o acesso.' })
  } catch (error) {
    sendJson(response, 400, {
      error: errorMessage(error),
    })
  }
}
