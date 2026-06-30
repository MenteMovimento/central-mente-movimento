import { createClient } from '@supabase/supabase-js'
import {
  canManageUsers,
  mapCentralPermissionsToDeviceRole,
  normalizePermissions,
} from './_permissions.js'

// The database still requires this enum for legacy integrations. Access is decided only by permissions.
const LEGACY_ROLE = 'viewer'

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
    return [error.message, error.error_description, error.error, error.details, error.hint]
      .filter((part) => typeof part === 'string' && part.length > 0)
      .join(' ')
  }
  return String(error)
}

const isMissingPermissionsColumnError = (error) => {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('app_users.permissions') ||
    (message.includes('permissions') && message.includes('column')) ||
    (message.includes('permissions') && message.includes('schema cache'))
  )
}

const missingPermissionsSetupMessage =
  'A base de dados ainda nao tem a matriz de permissoes. Execute supabase/promover-matriz-permissoes.sql no SQL Editor do Supabase e volte a tentar.'

const createAdminClient = (response) => {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

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

const selectAppUsers = async (adminClient) => {
  const { data, error } = await adminClient
    .from('app_users')
    .select('id,email,full_name,active,permissions,created_at,updated_at')
    .order('email', { ascending: true })

  if (!error) return data ?? []

  if (isMissingPermissionsColumnError(error)) throw new Error(missingPermissionsSetupMessage)
  throw error
}

const getAppUser = async (adminClient, id) => {
  const { data, error } = await adminClient
    .from('app_users')
    .select('id,email,full_name,active,permissions,created_at,updated_at')
    .eq('id', id)
    .maybeSingle()

  if (!error) return data

  if (isMissingPermissionsColumnError(error)) throw new Error(missingPermissionsSetupMessage)
  throw error
}

const requireManager = async (request, response, adminClient) => {
  const token = getBearerToken(request)
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

  const profile = await getAppUser(adminClient, user.id)
  if (!profile?.active || !canManageUsers(profile)) {
    sendJson(response, 403, { error: 'Sem permissao para gerir utilizadores.' })
    return null
  }

  return { user, profile }
}

const ensureAnotherManager = async (adminClient, targetId, nextProfile) => {
  const users = await selectAppUsers(adminClient)
  return users.some((user) => {
    if (user.id === targetId) return false
    if (!user.active) return false
    return canManageUsers(user)
  }) || Boolean(nextProfile?.active && canManageUsers(nextProfile))
}

const syncDeviceProfile = async (adminClient, user) => {
  const profile = {
    id: user.id,
    email: user.email ?? null,
    full_name: user.full_name ?? null,
    role: mapCentralPermissionsToDeviceRole(user.permissions),
  }

  await adminClient.from('profiles').upsert(profile, { onConflict: 'id' })
}

const sanitizePayload = (body) => {
  return {
    role: LEGACY_ROLE,
    permissions: normalizePermissions(body.permissions),
  }
}

const upsertAppUser = async (adminClient, record) => {
  const { data, error } = await adminClient
    .from('app_users')
    .upsert(record, { onConflict: 'id' })
    .select('id,email,full_name,active,permissions,created_at,updated_at')
    .single()

  if (!error) return data
  if (isMissingPermissionsColumnError(error)) throw new Error(missingPermissionsSetupMessage)
  throw error
}

const updateAppUser = async (adminClient, id, patch) => {
  const { data, error } = await adminClient
    .from('app_users')
    .update(patch)
    .eq('id', id)
    .select('id,email,full_name,active,permissions,created_at,updated_at')
    .single()

  if (!error) return data
  if (isMissingPermissionsColumnError(error)) throw new Error(missingPermissionsSetupMessage)
  throw error
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  const requester = await requireManager(request, response, adminClient)
  if (!requester) return

  try {
    if (request.method === 'GET') {
      sendJson(response, 200, { users: await selectAppUsers(adminClient) })
      return
    }

    const body = await readBody(request)

    if (request.method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const fullName = String(body.fullName ?? '').trim()
      const { role, permissions } = sanitizePayload(body)

      if (!email || !password || !fullName) {
        sendJson(response, 400, { error: 'Nome, email e password sao obrigatorios.' })
        return
      }

      if (password.length < 8) {
        sendJson(response, 400, { error: 'A password deve ter pelo menos 8 caracteres.' })
        return
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (error || !data.user) {
        sendJson(response, 400, {
          error: getErrorMessage(error) || 'Nao foi possivel criar o utilizador.',
        })
        return
      }

      const record = {
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        permissions,
        active: true,
      }

      const created = await upsertAppUser(adminClient, record)
      await syncDeviceProfile(adminClient, created)
      sendJson(response, 200, { user: created })
      return
    }

    if (request.method === 'PATCH') {
      const id = String(body.id ?? '').trim()
      if (!id) {
        sendJson(response, 400, { error: 'Utilizador invalido.' })
        return
      }

      const current = await getAppUser(adminClient, id)
      if (!current) {
        sendJson(response, 404, { error: 'Utilizador nao encontrado.' })
        return
      }

      const fullName = String(body.fullName ?? body.full_name ?? current.full_name ?? '').trim()
      const email = String(body.email ?? current.email ?? '').trim().toLowerCase()
      const active = body.active === undefined ? Boolean(current.active) : Boolean(body.active)
      const { role, permissions } = sanitizePayload(body)

      if (!fullName || !email) {
        sendJson(response, 400, { error: 'Nome e email sao obrigatorios.' })
        return
      }

      if (id === requester.user.id && !active) {
        sendJson(response, 400, { error: 'Nao desative a sua propria conta.' })
        return
      }

      const nextProfile = { ...current, full_name: fullName, email, role, active, permissions }
      if (canManageUsers(current) && !(await ensureAnotherManager(adminClient, id, nextProfile))) {
        sendJson(response, 400, { error: 'Tem de existir pelo menos um utilizador com permissao para gerir utilizadores.' })
        return
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
        email,
        user_metadata: { full_name: fullName },
      })
      if (authError) throw authError

      const updated = await updateAppUser(adminClient, id, {
          email,
          full_name: fullName,
          role,
          active,
          permissions,
          updated_at: new Date().toISOString(),
        })
      await syncDeviceProfile(adminClient, updated)
      sendJson(response, 200, { user: updated })
      return
    }

    if (request.method === 'DELETE') {
      const id = String(body.id ?? '').trim()
      if (!id) {
        sendJson(response, 400, { error: 'Utilizador invalido.' })
        return
      }

      if (id === requester.user.id) {
        sendJson(response, 400, { error: 'Nao pode eliminar a sua propria conta.' })
        return
      }

      const current = await getAppUser(adminClient, id)
      if (current && canManageUsers(current) && !(await ensureAnotherManager(adminClient, id, null))) {
        sendJson(response, 400, { error: 'Tem de existir pelo menos um utilizador com permissao para gerir utilizadores.' })
        return
      }

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(id)
      if (deleteUserError) throw deleteUserError

      await Promise.all([
        adminClient.from('app_users').delete().eq('id', id),
        adminClient.from('profiles').delete().eq('id', id),
      ])

      sendJson(response, 200, { ok: true })
      return
    }
  } catch (error) {
    sendJson(response, 400, { error: getErrorMessage(error) || 'Pedido invalido.' })
  }
}
