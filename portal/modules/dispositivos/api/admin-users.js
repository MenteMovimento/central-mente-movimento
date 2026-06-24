import { createClient } from '@supabase/supabase-js'

const userColumns = 'id, email, full_name, role, active, created_at, updated_at'
const allowedRoles = new Set(['admin', 'operator', 'viewer'])

const stripOuterWhitespace = (value) => value.replace(/^\s+|\s+$/g, '')

const sendJson = (response, status, body) => {
  response.status(status).json(body)
}

const readBody = async (request) => {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return request.body ? JSON.parse(request.body) : {}

  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
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
      error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.',
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

const centralRoleToDeviceRole = (role) => {
  if (role === 'admin') return 'admin'
  if (role === 'operator') return 'manager'
  return 'member'
}

const requireCentralAdmin = async (request, response, adminClient) => {
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

  const { data: appUser, error: appUserError } = await adminClient
    .from('app_users')
    .select('role, active, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (appUserError || !appUser?.active || appUser.role !== 'admin') {
    sendJson(response, 403, { error: 'Apenas administradores podem gerir utilizadores.' })
    return null
  }

  return {
    id: user.id,
    email: user.email ?? appUser.email ?? null,
    full_name: appUser.full_name ?? user.user_metadata?.full_name ?? null,
    role: appUser.role,
  }
}

const syncDeviceProfile = async (adminClient, appUser) => {
  const profile = {
    id: appUser.id,
    email: appUser.email ?? null,
    full_name: appUser.full_name ?? null,
    role: centralRoleToDeviceRole(appUser.role),
  }

  const { error } = await adminClient.from('profiles').upsert(profile, { onConflict: 'id' })
  if (!error) return

  const { email: _email, ...fallbackProfile } = profile
  const { error: fallbackError } = await adminClient
    .from('profiles')
    .upsert(fallbackProfile, { onConflict: 'id' })
  if (fallbackError) throw fallbackError
}

const normalizeUser = (row) => ({
  ...row,
  full_name: row.full_name ?? '',
  active: Boolean(row.active),
})

const listUsers = async (adminClient) => {
  const { data, error } = await adminClient
    .from('app_users')
    .select(userColumns)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(normalizeUser)
}

const countActiveAdmins = async (adminClient) => {
  const { count, error } = await adminClient
    .from('app_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('active', true)

  if (error) throw error
  return count ?? 0
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  const requester = await requireCentralAdmin(request, response, adminClient)
  if (!requester) return

  try {
    if (request.method === 'GET') {
      sendJson(response, 200, { profiles: await listUsers(adminClient) })
      return
    }

    const body = await readBody(request)

    if (request.method === 'PATCH') {
      const profileId = String(body.profileId ?? body.id ?? '')
      const role = typeof body.role === 'string' ? String(body.role) : ''
      const fullName = typeof body.fullName === 'string' ? stripOuterWhitespace(body.fullName) : null
      const active = typeof body.active === 'boolean' ? body.active : null
      const updates = {}

      if (!profileId) {
        sendJson(response, 400, { error: 'Utilizador invalido.' })
        return
      }

      const { data: existingUser, error: existingError } = await adminClient
        .from('app_users')
        .select(userColumns)
        .eq('id', profileId)
        .maybeSingle()

      if (existingError) throw existingError
      if (!existingUser) {
        sendJson(response, 404, { error: 'Utilizador nao encontrado.' })
        return
      }

      if (role) {
        if (!allowedRoles.has(role)) {
          sendJson(response, 400, { error: 'Permissao invalida.' })
          return
        }

        if (profileId === requester.id && role !== 'admin') {
          sendJson(response, 400, { error: 'Nao podes alterar a permissao da tua propria conta.' })
          return
        }

        if (existingUser.role === 'admin' && role !== 'admin' && (await countActiveAdmins(adminClient)) <= 1) {
          sendJson(response, 400, { error: 'Nao pode remover o ultimo administrador ativo.' })
          return
        }

        updates.role = role
      }

      if (fullName !== null) {
        if (!fullName) {
          sendJson(response, 400, { error: 'O nome e obrigatorio.' })
          return
        }
        updates.full_name = fullName
      }

      if (active !== null) {
        if (profileId === requester.id && !active) {
          sendJson(response, 400, { error: 'Nao podes desativar a tua propria conta.' })
          return
        }

        if (existingUser.role === 'admin' && existingUser.active && !active && (await countActiveAdmins(adminClient)) <= 1) {
          sendJson(response, 400, { error: 'Nao pode desativar o ultimo administrador ativo.' })
          return
        }

        updates.active = active
      }

      if (!updates.role && !updates.full_name && updates.active === undefined) {
        sendJson(response, 400, { error: 'Nao ha alteracoes para guardar.' })
        return
      }

      const { data, error } = await adminClient
        .from('app_users')
        .update(updates)
        .eq('id', profileId)
        .select(userColumns)
        .single()

      if (error) throw error

      if (updates.full_name) {
        await adminClient.auth.admin.updateUserById(profileId, {
          user_metadata: { full_name: updates.full_name },
        })
      }

      await syncDeviceProfile(adminClient, data).catch(() => null)
      sendJson(response, 200, { profile: normalizeUser(data) })
      return
    }

    if (request.method === 'DELETE') {
      const profileId = String(body.profileId ?? body.id ?? '')

      if (!profileId) {
        sendJson(response, 400, { error: 'Utilizador invalido.' })
        return
      }

      if (profileId === requester.id) {
        sendJson(response, 400, { error: 'Nao podes eliminar a tua propria conta.' })
        return
      }

      const { data: existingUser, error: existingError } = await adminClient
        .from('app_users')
        .select('role, active')
        .eq('id', profileId)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingUser?.role === 'admin' && existingUser.active && (await countActiveAdmins(adminClient)) <= 1) {
        sendJson(response, 400, { error: 'Nao pode eliminar o ultimo administrador ativo.' })
        return
      }

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(profileId)
      if (deleteUserError) throw deleteUserError

      await adminClient.from('profiles').delete().eq('id', profileId)
      const { error: deleteProfileError } = await adminClient.from('app_users').delete().eq('id', profileId)
      if (deleteProfileError) throw deleteProfileError

      sendJson(response, 200, { ok: true })
      return
    }

    const email = String(body.email ?? '').toLowerCase()
    const password = String(body.password ?? '')
    const fullName = stripOuterWhitespace(String(body.fullName ?? ''))
    const role = typeof body.role === 'string' && allowedRoles.has(body.role) ? body.role : 'viewer'

    if (!email || !password || !fullName) {
      sendJson(response, 400, { error: 'Nome, email e palavra-passe sao obrigatorios.' })
      return
    }

    if (password.length < 8) {
      sendJson(response, 400, { error: 'A palavra-passe deve ter pelo menos 8 caracteres.' })
      return
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError || !createdUser.user) {
      sendJson(response, 400, {
        error: createError?.message ?? 'Nao foi possivel criar o utilizador.',
      })
      return
    }

    const { data: appUser, error: appUserError } = await adminClient
      .from('app_users')
      .upsert({
        id: createdUser.user.id,
        email,
        full_name: fullName,
        role,
        active: true,
      })
      .select(userColumns)
      .single()

    if (appUserError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id).catch(() => null)
      throw appUserError
    }

    await syncDeviceProfile(adminClient, appUser).catch(() => null)
    sendJson(response, 200, { profile: normalizeUser(appUser) })
  } catch (error) {
    sendJson(response, 400, { error: getErrorMessage(error) || 'Pedido invalido.' })
  }
}
