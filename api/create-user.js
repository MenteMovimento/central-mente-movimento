import { createClient } from '@supabase/supabase-js'

const allowedRoles = new Set(['admin', 'operator', 'viewer'])

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

const requireSociosAdmin = async (request, response, adminClient) => {
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

  const { data: profile, error: profileError } = await adminClient
    .from('app_users')
    .select('role, active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.active || profile.role !== 'admin') {
    sendJson(response, 403, { error: 'Apenas administradores podem gerir utilizadores.' })
    return null
  }

  return user
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient(response)
  if (!adminClient) return

  const requester = await requireSociosAdmin(request, response, adminClient)
  if (!requester) return

  try {
    const body = await readBody(request)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim()
    const role = String(body.role ?? 'viewer')

    if (!email || !password || !fullName) {
      sendJson(response, 400, { error: 'Nome, email e password sao obrigatorios.' })
      return
    }

    if (password.length < 8) {
      sendJson(response, 400, { error: 'A password deve ter pelo menos 8 caracteres.' })
      return
    }

    if (!allowedRoles.has(role)) {
      sendJson(response, 400, { error: 'Perfil invalido.' })
      return
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (error || !data.user) {
      sendJson(response, 400, { error: getErrorMessage(error) || 'Nao foi possivel criar o utilizador.' })
      return
    }

    const { error: profileError } = await adminClient.from('app_users').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      active: true,
    })

    if (profileError) throw profileError

    sendJson(response, 200, { id: data.user.id, email, full_name: fullName, role, active: true })
  } catch (error) {
    sendJson(response, 400, { error: getErrorMessage(error) || 'Pedido invalido.' })
  }
}
