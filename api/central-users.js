import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../api-lib/http.js'
import {
  canManageUsers,
  canViewArea,
  mapCentralPermissionsToDeviceRole,
  normalizePermissions,
} from '../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../api-lib/central-session.js'

// The database still requires this enum for legacy integrations. Access is decided only by permissions.
const LEGACY_ROLE = 'viewer'
const MAX_NAME_LENGTH = 160
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 128

const deviceRolePermissions = (role, existingPermissions = null) => {
  const permissions = normalizePermissions(existingPermissions)
  const nextRole = ['admin', 'manager', 'member'].includes(role) ? role : 'member'
  permissions.dispositivos = {
    ...permissions.dispositivos,
    view: true,
    edit: nextRole === 'admin' || nextRole === 'manager',
    export: nextRole === 'admin' || nextRole === 'manager',
    delete: nextRole === 'admin',
    view_sensitive: false,
    edit_sensitive: false,
  }
  return normalizePermissions(permissions)
}

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
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

const getErrorCode = (error) =>
  String(error?.code ?? error?.error_code ?? error?.name ?? '').trim().toLowerCase()

export const isDuplicateUserError = (error) => {
  const code = getErrorCode(error)
  const message = getErrorMessage(error).toLowerCase()
  return (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists') ||
    (message.includes('duplicate') && message.includes('email'))
  )
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

export const userManagementErrorMessage = (error) => {
  if (isMissingPermissionsColumnError(error)) return missingPermissionsSetupMessage
  const code = getErrorCode(error)
  const message = getErrorMessage(error).toLowerCase()
  if (isDuplicateUserError(error)) {
    return 'Ja existe um utilizador com este email.'
  }
  if (code === 'weak_password' || message.includes('password should') || message.includes('weak password')) {
    return passwordPolicyMessage
  }
  if (code === 'email_address_invalid' || message.includes('invalid email')) {
    return 'O email indicado nao e valido.'
  }
  if (code === 'signup_disabled' || message.includes('signups not allowed')) {
    return 'A criacao de novas contas esta desativada no Supabase Auth.'
  }
  if (message.includes('database error') && message.includes('user')) {
    return 'O Supabase nao conseguiu criar a conta. Verifique os triggers da tabela auth.users.'
  }
  return exposedErrorMessage(error, 'Nao foi possivel gerir o utilizador.')
}

const passwordPolicyMessage =
  'A password deve ter pelo menos 8 caracteres, uma letra maiuscula e um caracter especial.'

const isStrongPassword = (password) =>
  password.length >= 8 &&
  password.length <= MAX_PASSWORD_LENGTH &&
  /\p{Lu}/u.test(password) &&
  /[^\p{L}\p{N}]/u.test(password)

const isValidEmail = (email) =>
  email.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isValidName = (fullName) => fullName.length > 0 && fullName.length <= MAX_NAME_LENGTH

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

const asDeviceProfile = (user) => ({
  ...user,
  role: mapCentralPermissionsToDeviceRole(user.permissions),
  full_name: user.full_name ?? '',
  active: Boolean(user.active),
})

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

const findAuthUserByEmail = async (adminClient, email) => {
  const perPage = 200
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users ?? []
    const match = users.find((user) => String(user.email ?? '').trim().toLowerCase() === email)
    if (match) return match
    if (users.length < perPage) return null
  }
  return null
}

const duplicateUserError = () => {
  const error = new Error('Ja existe um utilizador com este email.')
  error.code = 'email_exists'
  error.status = 409
  error.expose = true
  return error
}

export const createOrRecoverAuthUser = async (adminClient, { email, password, fullName }) => {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (!error && data?.user) return { user: data.user, created: true }
  if (!isDuplicateUserError(error)) throw error || new Error('O Supabase nao devolveu a conta criada.')

  const existingAuthUser = await findAuthUserByEmail(adminClient, email)
  if (!existingAuthUser) throw error || duplicateUserError()

  const existingProfile = await getAppUser(adminClient, existingAuthUser.id)
  if (existingProfile) throw duplicateUserError()

  // A conta existe no Auth, mas ficou sem matriz de permissoes. Reaproveita-a de forma controlada.
  return { user: existingAuthUser, created: false }
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

  try {
    await assertVerifiedCentralSession(adminClient, token, { user })
  } catch (verificationError) {
    sendJson(response, verificationError.status ?? 401, {
      error: exposedErrorMessage(verificationError, 'Confirme o codigo enviado por email.'),
      code: verificationError?.code ?? null,
    })
    return null
  }

  const profile = await getAppUser(adminClient, user.id)
  if (!profile?.active || !canManageUsers(profile)) {
    sendJson(response, 403, { error: 'Sem permissao para gerir utilizadores.' })
    return null
  }

  return { user, profile }
}

const requireMemberHistoryViewer = async (request, response, adminClient) => {
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

  try {
    await assertVerifiedCentralSession(adminClient, token, { user })
  } catch (verificationError) {
    sendJson(response, verificationError.status ?? 401, {
      error: exposedErrorMessage(verificationError, 'Confirme o codigo enviado por email.'),
      code: verificationError?.code ?? null,
    })
    return null
  }

  const profile = await getAppUser(adminClient, user.id)
  if (!profile?.active || !canViewArea(profile, 'socios')) {
    sendJson(response, 403, { error: 'Sem permissao para consultar o historico de socios.' })
    return null
  }

  return { user, profile }
}

const selectMemberHistory = async (adminClient, limit) => {
  const { data, error } = await adminClient
    .from('member_audit_log')
    .select('id,member_id,action,changed_at,changed_by,old_data,new_data')
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const history = data ?? []
  const actorIds = [...new Set(history.map((entry) => entry.changed_by).filter(Boolean))]
  let actors = []

  if (actorIds.length > 0) {
    const { data: actorRows, error: actorError } = await adminClient
      .from('app_users')
      .select('id,email,full_name')
      .in('id', actorIds)

    if (actorError) throw actorError
    actors = actorRows ?? []
  }

  const actorNames = new Map(
    actors.map((actor) => [actor.id, actor.full_name || actor.email || 'Utilizador autorizado']),
  )

  return history.map((entry) => ({
    ...entry,
    actor_name: entry.changed_by ? actorNames.get(entry.changed_by) || 'Utilizador autorizado' : null,
  }))
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

const sanitizePayload = (body, { currentPermissions = null, deviceCompatibility = false } = {}) => {
  const hasExplicitPermissions = Object.prototype.hasOwnProperty.call(body ?? {}, 'permissions')
  const permissions = hasExplicitPermissions
    ? normalizePermissions(body.permissions)
    : deviceCompatibility && Object.prototype.hasOwnProperty.call(body ?? {}, 'role')
      ? deviceRolePermissions(String(body.role ?? ''), currentPermissions)
      : normalizePermissions(currentPermissions)

  return {
    role: LEGACY_ROLE,
    permissions,
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

  const deviceCompatibility = request.centralUsersCompatibility === 'dispositivos'

  if (request.method === 'GET' && String(request.query?.kind ?? '') === 'member-history') {
    const requester = await requireMemberHistoryViewer(request, response, adminClient)
    if (!requester) return

    try {
      const requestedLimit = Number.parseInt(String(request.query?.limit ?? '120'), 10)
      const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 120
      const history = await selectMemberHistory(adminClient, limit)
      sendJson(response, 200, { history })
    } catch (error) {
      console.error('member history failed', error)
      sendJson(response, 500, {
        error: exposedErrorMessage(error, 'Nao foi possivel carregar o historico de socios.'),
      })
    }
    return
  }

  const requester = await requireManager(request, response, adminClient)
  if (!requester) return

  try {
    if (request.method === 'GET') {
      const users = await selectAppUsers(adminClient)
      sendJson(response, 200, {
        users,
        ...(deviceCompatibility ? { profiles: users.map(asDeviceProfile) } : {}),
      })
      return
    }

    const body = await readBody(request)

    if (request.method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const fullName = String(body.fullName ?? '').trim()
      const compatibilityBody = deviceCompatibility && !Object.prototype.hasOwnProperty.call(body, 'role')
        ? { ...body, role: 'member' }
        : body
      const { role, permissions } = sanitizePayload(compatibilityBody, { deviceCompatibility })

      if (!email || !password || !fullName) {
        sendJson(response, 400, { error: 'Nome, email e password sao obrigatorios.' })
        return
      }

      if (!isValidName(fullName) || !isValidEmail(email)) {
        sendJson(response, 400, { error: 'Nome ou email invalido.' })
        return
      }

      if (!isStrongPassword(password)) {
        sendJson(response, 400, { error: passwordPolicyMessage })
        return
      }

      let authAccount
      try {
        authAccount = await createOrRecoverAuthUser(adminClient, { email, password, fullName })
      } catch (authError) {
        console.warn('central-users auth creation rejected', {
          code: getErrorCode(authError),
          status: Number(authError?.status) || 400,
          message: getErrorMessage(authError),
        })
        const status = isDuplicateUserError(authError) ? 409 : Number(authError?.status) || 400
        sendJson(response, status >= 400 && status < 500 ? status : 400, {
          error: userManagementErrorMessage(authError),
        })
        return
      }

      const record = {
        id: authAccount.user.id,
        email,
        full_name: fullName,
        role,
        permissions,
        active: true,
      }

      let created
      try {
        created = await upsertAppUser(adminClient, record)
      } catch (profileError) {
        // Do not leave an Auth account without an app_users permission matrix.
        if (authAccount.created) {
          await adminClient.auth.admin.deleteUser(authAccount.user.id).catch(() => {})
        }
        throw profileError
      }

      if (!authAccount.created) {
        const { error: repairError } = await adminClient.auth.admin.updateUserById(authAccount.user.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        })
        if (repairError) {
          await adminClient.from('app_users').delete().eq('id', authAccount.user.id)
          throw repairError
        }
      }
      await syncDeviceProfile(adminClient, created)
      sendJson(response, 200, {
        user: created,
        ...(deviceCompatibility ? { profile: asDeviceProfile(created) } : {}),
      })
      return
    }

    if (request.method === 'PATCH') {
      const id = String(body.id ?? body.profileId ?? '').trim()
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
      const { role, permissions } = sanitizePayload(body, {
        currentPermissions: current.permissions,
        deviceCompatibility,
      })

      if (!fullName || !email) {
        sendJson(response, 400, { error: 'Nome e email sao obrigatorios.' })
        return
      }

      if (!isValidName(fullName) || !isValidEmail(email)) {
        sendJson(response, 400, { error: 'Nome ou email invalido.' })
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
      sendJson(response, 200, {
        user: updated,
        ...(deviceCompatibility ? { profile: asDeviceProfile(updated) } : {}),
      })
      return
    }

    if (request.method === 'DELETE') {
      const id = String(body.id ?? body.profileId ?? '').trim()
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
    console.error('central-users failed', error)
    const status = Number(error?.status)
    sendJson(response, status >= 400 && status < 500 ? status : 500, {
      error: userManagementErrorMessage(error),
    })
  }
}
