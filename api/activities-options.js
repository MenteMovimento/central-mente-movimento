import { createClient } from '@supabase/supabase-js'
import { hasPermission, normalizePermissions } from './_permissions.js'

const OPTION_KINDS = {
  activities: {
    table: 'activities_catalog',
    label: 'atividade',
  },
  monitors: {
    table: 'activities_monitors',
    label: 'monitor',
  },
}

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

const getBearerToken = (request) => {
  const authHeader = request.headers.authorization ?? ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
}

const errorMessage = (error) => {
  if (!error) return 'Nao foi possivel concluir o pedido.'
  if (error instanceof Error) return error.message
  if (typeof error.message === 'string') return error.message
  if (typeof error.error_description === 'string') return error.error_description
  if (typeof error.error === 'string') return error.error
  return 'Nao foi possivel concluir o pedido.'
}

const clientErrorMessage = (error) => {
  const message = errorMessage(error)
  const normalized = message.toLowerCase()
  if (error?.code === '42P01' || normalized.includes('does not exist')) {
    return 'A tabela de atividades ainda nao existe no Supabase. Execute o SQL do modulo Atividades.'
  }
  if (normalized.includes('permission denied')) {
    return 'Sem permissao para guardar nas tabelas de atividades.'
  }
  return message
}

const readBody = async (request) => {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return request.body ? JSON.parse(request.body) : {}
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
}

const queryValue = (request, key) => {
  if (request.query?.[key]) return request.query[key]
  const url = new URL(request.url ?? '/', 'https://central.local')
  return url.searchParams.get(key) ?? ''
}

const optionKind = (value) => {
  const kind = String(value ?? '').trim()
  return Object.prototype.hasOwnProperty.call(OPTION_KINDS, kind) ? kind : ''
}

const optionPayload = (row) => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? '').trim(),
  active: row?.active !== false,
})

const getAuthorizedUser = async (adminClient, request, action) => {
  const token = getBearerToken(request)
  if (!token) {
    const error = new Error('Sessao em falta.')
    error.status = 401
    throw error
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token)

  if (userError || !user) {
    const error = new Error('Sessao invalida.')
    error.status = 401
    throw error
  }

  const { data: appUser, error: appUserError } = await adminClient
    .from('app_users')
    .select('id, active, permissions')
    .eq('id', user.id)
    .maybeSingle()

  if (appUserError) throw appUserError
  if (!appUser || appUser.active === false) {
    const error = new Error('Utilizador sem acesso ativo.')
    error.status = 403
    throw error
  }

  const profile = {
    ...appUser,
    permissions: normalizePermissions(appUser.permissions),
  }

  if (!hasPermission(profile, 'atividades', action)) {
    const error = new Error('Sem permissao para gerir atividades.')
    error.status = 403
    throw error
  }

  return profile
}

const listOptions = async (adminClient, kind) => {
  const { table } = OPTION_KINDS[kind]
  const { data, error } = await adminClient
    .from(table)
    .select('id,name,active')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return Array.isArray(data)
    ? data.map(optionPayload).filter((item) => item.id && item.name)
    : []
}

const saveOption = async (adminClient, kind, name) => {
  const { table } = OPTION_KINDS[kind]
  const cleanName = String(name ?? '').trim()
  if (!cleanName) {
    const error = new Error('Preencha o nome.')
    error.status = 400
    throw error
  }

  const { data, error } = await adminClient
    .from(table)
    .upsert({ name: cleanName, active: true }, { onConflict: 'name' })
    .select('id,name,active')
    .single()

  if (error) throw error
  return optionPayload(data)
}

const deleteOption = async (adminClient, kind, id) => {
  const { table } = OPTION_KINDS[kind]
  const optionId = String(id ?? '').trim()
  if (!optionId) {
    const error = new Error('Opcao invalida.')
    error.status = 400
    throw error
  }

  const { error } = await adminClient
    .from(table)
    .update({ active: false })
    .eq('id', optionId)

  if (error) throw error
}

export default async function handler(request, response) {
  const adminClient = createAdminClient()
  if (!adminClient) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return
  }

  try {
    const body = ['POST', 'DELETE', 'PATCH'].includes(request.method)
      ? await readBody(request).catch(() => ({}))
      : {}
    const kind = optionKind(body.kind ?? queryValue(request, 'kind'))

    if (!kind) {
      sendJson(response, 400, { error: 'Tipo de opcao invalido.' })
      return
    }

    if (request.method === 'GET') {
      await getAuthorizedUser(adminClient, request, 'view')
      sendJson(response, 200, { items: await listOptions(adminClient, kind) })
      return
    }

    if (request.method === 'POST') {
      await getAuthorizedUser(adminClient, request, 'edit')
      sendJson(response, 200, { item: await saveOption(adminClient, kind, body.name) })
      return
    }

    if (request.method === 'DELETE') {
      await getAuthorizedUser(adminClient, request, 'edit')
      await deleteOption(adminClient, kind, body.id ?? queryValue(request, 'id'))
      sendJson(response, 200, { ok: true })
      return
    }

    response.setHeader('Allow', 'GET, POST, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
  } catch (error) {
    sendJson(response, error.status ?? 500, { error: clientErrorMessage(error) })
  }
}
