import { createClient } from '@supabase/supabase-js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'

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
  if (
    error?.code === '42P01' ||
    error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    error?.code === 'PGRST205' ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache') ||
    normalized.includes('could not find the table')
  ) {
    return 'Faltam tabelas ou campos de atividades no Supabase. Execute o SQL atualizado do modulo Atividades e volte a tentar.'
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

const monitorPayload = (row) => ({
  ...optionPayload(row),
  phone: String(row?.phone ?? '').trim(),
  email: String(row?.email ?? '').trim(),
  nif: String(row?.nif ?? '').trim(),
  volunteer: row?.volunteer === true,
  profession: String(row?.profession ?? '').trim(),
  activityDescription: String(row?.activity_description ?? '').trim(),
})

const payloadForKind = (kind, row) => (kind === 'monitors' ? monitorPayload(row) : optionPayload(row))

const isMissingMonitorFieldsError = (kind, error) => {
  const message = errorMessage(error).toLowerCase()
  return (
    kind === 'monitors' &&
    (error?.code === '42703' ||
      error?.code === 'PGRST204' ||
      message.includes('could not find') ||
      message.includes('schema cache') ||
      message.includes('column'))
  )
}

const selectColumnsForKind = (kind) =>
  kind === 'monitors'
    ? 'id,name,phone,email,nif,volunteer,profession,activity_description,active'
    : 'id,name,active'

const monitorDetailKeys = ['phone', 'email', 'nif', 'volunteer', 'profession', 'activityDescription', 'activity_description']

const booleanValue = (value) =>
  value === true ||
  value === 1 ||
  String(value ?? '').trim().toLowerCase() === 'true' ||
  String(value ?? '').trim().toLowerCase() === '1' ||
  String(value ?? '').trim().toLowerCase() === 'sim' ||
  String(value ?? '').trim().toLowerCase() === 'yes'

const optionNameFromSource = (source) =>
  String(typeof source === 'object' && source !== null ? source.name : source ?? '').trim()

const hasMonitorDetails = (source) =>
  typeof source === 'object' &&
  source !== null &&
  monitorDetailKeys.some((key) => Object.prototype.hasOwnProperty.call(source, key))

const optionUpdatePayload = (kind, source) => {
  const payload = {
    name: optionNameFromSource(source),
    active: true,
  }

  if (kind === 'monitors' && hasMonitorDetails(source)) {
    payload.phone = String(source.phone ?? '').trim()
    payload.email = String(source.email ?? '').trim()
    payload.nif = String(source.nif ?? '').trim()
    payload.volunteer = booleanValue(source.volunteer)
    payload.profession = String(source.profession ?? '').trim()
    payload.activity_description = String(source.activityDescription ?? source.activity_description ?? '').trim()
  }

  return payload
}

const splitActivityMonitors = (value) =>
  String(value || '')
    .split(/\s*\/\s*/)
    .map((monitor) => monitor.trim())
    .filter(Boolean)
    .slice(0, 2)

const joinActivityMonitors = (monitors) => {
  const cleanMonitors = []
  monitors
    .map((monitor) => String(monitor || '').trim())
    .filter(Boolean)
    .forEach((monitor) => {
      if (!cleanMonitors.includes(monitor) && cleanMonitors.length < 2) {
        cleanMonitors.push(monitor)
      }
    })
  return cleanMonitors.join(' / ')
}

const renameMonitorInSchedule = async (adminClient, previousName, nextName) => {
  const { data: rows, error } = await adminClient
    .from('activities_schedule')
    .select('id,teacher')
    .ilike('teacher', `%${previousName}%`)

  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code)) return
    throw error
  }

  const updates = Array.isArray(rows)
    ? rows
        .map((row) => {
          const teacher = joinActivityMonitors(
            splitActivityMonitors(row.teacher).map((monitor) => (monitor === previousName ? nextName : monitor)),
          )
          return teacher && teacher !== row.teacher ? { id: row.id, teacher } : null
        })
        .filter(Boolean)
    : []

  for (const update of updates) {
    const { error: updateError } = await adminClient
      .from('activities_schedule')
      .update({ teacher: update.teacher })
      .eq('id', update.id)

    if (updateError) throw updateError
  }
}

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
  let { data, error } = await adminClient
    .from(table)
    .select(selectColumnsForKind(kind))
    .eq('active', true)
    .order('name', { ascending: true })

  if (isMissingMonitorFieldsError(kind, error)) {
    ;({ data, error } = await adminClient
      .from(table)
      .select('id,name,active')
      .eq('active', true)
      .order('name', { ascending: true }))
  }

  if (error) throw error
  return Array.isArray(data)
    ? data.map((row) => payloadForKind(kind, row)).filter((item) => item.id && item.name)
    : []
}

const saveOption = async (adminClient, kind, source) => {
  const { table } = OPTION_KINDS[kind]
  const payload = optionUpdatePayload(kind, source)
  if (!payload.name) {
    const error = new Error('Preencha o nome.')
    error.status = 400
    throw error
  }

  let { data, error } = await adminClient
    .from(table)
    .upsert(payload, { onConflict: 'name' })
    .select(selectColumnsForKind(kind))
    .single()

  if (isMissingMonitorFieldsError(kind, error) && !hasMonitorDetails(source)) {
    ;({ data, error } = await adminClient
      .from(table)
      .upsert(payload, { onConflict: 'name' })
      .select('id,name,active')
      .single())
  }

  if (error) throw error
  return payloadForKind(kind, data)
}

const updateOption = async (adminClient, kind, id, source) => {
  const { table } = OPTION_KINDS[kind]
  const optionId = String(id ?? '').trim()
  const payload = optionUpdatePayload(kind, source)
  if (!optionId || !payload.name) {
    const error = new Error('Opcao invalida.')
    error.status = 400
    throw error
  }

  const { data: existingOption, error: existingError } = await adminClient
    .from(table)
    .select('id,name')
    .eq('id', optionId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existingOption) {
    const error = new Error('Opcao nao encontrada.')
    error.status = 404
    throw error
  }

  let { data, error } = await adminClient
    .from(table)
    .update(payload)
    .eq('id', optionId)
    .select(selectColumnsForKind(kind))
    .single()

  if (isMissingMonitorFieldsError(kind, error) && !hasMonitorDetails(source)) {
    ;({ data, error } = await adminClient
      .from(table)
      .update(payload)
      .eq('id', optionId)
      .select('id,name,active')
      .single())
  }

  if (error) throw error
  if (existingOption.name && existingOption.name !== payload.name) {
    if (kind === 'monitors') {
      await renameMonitorInSchedule(adminClient, existingOption.name, payload.name)
    } else {
      const scheduleColumn = 'title'
      const { error: scheduleError } = await adminClient
        .from('activities_schedule')
        .update({ [scheduleColumn]: payload.name })
        .eq(scheduleColumn, existingOption.name)

      if (scheduleError && !['42P01', 'PGRST205'].includes(scheduleError.code)) {
        throw scheduleError
      }
    }
  }
  return payloadForKind(kind, data)
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
      sendJson(response, 200, { item: await saveOption(adminClient, kind, body) })
      return
    }

    if (request.method === 'PATCH') {
      await getAuthorizedUser(adminClient, request, 'edit')
      sendJson(response, 200, { item: await updateOption(adminClient, kind, body.id, body) })
      return
    }

    if (request.method === 'DELETE') {
      await getAuthorizedUser(adminClient, request, 'edit')
      await deleteOption(adminClient, kind, body.id ?? queryValue(request, 'id'))
      sendJson(response, 200, { ok: true })
      return
    }

    response.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
  } catch (error) {
    sendJson(response, error.status ?? 500, { error: clientErrorMessage(error) })
  }
}
