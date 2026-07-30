import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../api-lib/http.js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../api-lib/central-session.js'

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
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
}

const HISTORY_COLUMNS =
  'id,created_at,action,title,teacher,day,start_time,end_time,week_start,created_by'

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
  return exposedErrorMessage(error, 'Nao foi possivel concluir o pedido.')
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

const payloadForKind = (kind, row, includeMonitorDetails = true) =>
  kind === 'monitors' && includeMonitorDetails ? monitorPayload(row) : optionPayload(row)

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

const selectColumnsForKind = (kind, includeMonitorDetails = true) =>
  kind === 'monitors' && includeMonitorDetails
    ? 'id,name,phone,email,nif,volunteer,profession,activity_description,active'
    : 'id,name,active'

const monitorDetailKeys = ['phone', 'email', 'nif', 'volunteer', 'profession', 'activityDescription', 'activity_description']
const textLimits = {
  name: 160,
  phone: 50,
  email: 254,
  nif: 50,
  profession: 160,
  activityDescription: 2000,
}

const invalidInput = (message) => {
  const error = new Error(message)
  error.status = 400
  return error
}

const boundedText = (value, maxLength, label) => {
  const text = String(value ?? '').trim()
  if (text.length > maxLength) {
    throw invalidInput(`${label} excede o tamanho permitido.`)
  }
  return text
}

const booleanValue = (value) =>
  value === true ||
  value === 1 ||
  String(value ?? '').trim().toLowerCase() === 'true' ||
  String(value ?? '').trim().toLowerCase() === '1' ||
  String(value ?? '').trim().toLowerCase() === 'sim' ||
  String(value ?? '').trim().toLowerCase() === 'yes'

const optionNameFromSource = (source) =>
  boundedText(
    typeof source === 'object' && source !== null ? source.name : source,
    textLimits.name,
    'O nome',
  )

const hasMonitorDetails = (source) =>
  typeof source === 'object' &&
  source !== null &&
  monitorDetailKeys.some((key) => Object.prototype.hasOwnProperty.call(source, key))

const optionUpdatePayload = (kind, source) => {
  const payload = {
    name: optionNameFromSource(source),
    active: true,
  }

  if (kind === 'monitors' && payload.name.includes('/')) {
    throw invalidInput('O nome do monitor nao pode conter o caracter "/".')
  }

  if (kind === 'monitors' && hasMonitorDetails(source)) {
    payload.phone = boundedText(source.phone, textLimits.phone, 'O telemovel')
    payload.email = boundedText(source.email, textLimits.email, 'O email').toLowerCase()
    payload.nif = boundedText(source.nif, textLimits.nif, 'O NIF')
    payload.volunteer = booleanValue(source.volunteer)
    payload.profession = boundedText(source.profession, textLimits.profession, 'A profissao')
    payload.activity_description = boundedText(
      source.activityDescription ?? source.activity_description,
      textLimits.activityDescription,
      'A descricao',
    )

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw invalidInput('Indique um email valido.')
    }
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

const getAuthorizedUser = async (adminClient, request, actions) => {
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

  await assertVerifiedCentralSession(adminClient, token, { user })

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

  const allowedActions = Array.isArray(actions) ? actions : [actions]
  if (!allowedActions.some((action) => hasPermission(profile, 'atividades', action))) {
    const error = new Error('Sem permissao para gerir atividades.')
    error.status = 403
    throw error
  }

  return profile
}

const listOptions = async (adminClient, kind, includeMonitorDetails) => {
  const { table } = OPTION_KINDS[kind]
  let { data, error } = await adminClient
    .from(table)
    .select(selectColumnsForKind(kind, includeMonitorDetails))
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
    ? data
        .map((row) => payloadForKind(kind, row, includeMonitorDetails))
        .filter((item) => item.id && item.name)
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

const historyTextValue = (value, maxLength = 500) =>
  String(value ?? '')
    .trim()
    .slice(0, maxLength)

const historyOptionalTime = (value) => {
  const time = historyTextValue(value, 5)
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null
}

const historyOptionalDate = (value) => {
  const date = historyTextValue(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

const historyOptionalDay = (value) => {
  const day = historyTextValue(value, 16)
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day) ? day : null
}

const activityHistoryPayload = (source, userId) => {
  const id = historyTextValue(source?.id, 36)
  const action = historyTextValue(source?.action, 64)
  if (!action) {
    const error = new Error('Acao do historico em falta.')
    error.status = 400
    throw error
  }

  return {
    ...(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      ? { id }
      : {}),
    created_at: new Date().toISOString(),
    action,
    title: historyTextValue(source?.title) || null,
    teacher: historyTextValue(source?.teacher) || null,
    day: historyOptionalDay(source?.day),
    start_time: historyOptionalTime(source?.start_time ?? source?.start),
    end_time: historyOptionalTime(source?.end_time ?? source?.end),
    week_start: historyOptionalDate(source?.week_start ?? source?.weekStart),
    created_by: userId,
  }
}

const activityHistoryDisplayName = (profile) =>
  historyTextValue(profile?.full_name || profile?.email, 200)

const attachActivityHistoryActorNames = async (adminClient, rows) => {
  const userIds = [
    ...new Set(
      rows
        .map((row) => historyTextValue(row?.created_by, 36))
        .filter(Boolean),
    ),
  ]

  if (!userIds.length) {
    return rows.map((row) => ({ ...row, actor_name: '' }))
  }

  const { data: users, error } = await adminClient
    .from('app_users')
    .select('id,email,full_name')
    .in('id', userIds)

  if (error) throw error

  const namesById = new Map(
    (Array.isArray(users) ? users : []).map((user) => [String(user.id), activityHistoryDisplayName(user)]),
  )

  return rows.map((row) => ({
    ...row,
    actor_name: namesById.get(String(row?.created_by ?? '')) || '',
  }))
}

const listActivityHistory = async (adminClient) => {
  const { data, error } = await adminClient
    .from('activities_history')
    .select(HISTORY_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return attachActivityHistoryActorNames(adminClient, Array.isArray(data) ? data : [])
}

const saveActivityHistory = async (adminClient, profile, source) => {
  const { data, error } = await adminClient
    .from('activities_history')
    .insert(activityHistoryPayload(source, profile.id))
    .select(HISTORY_COLUMNS)
    .single()

  if (error) throw error
  return { ...data, actor_name: activityHistoryDisplayName(profile) }
}

export default async function handler(request, response) {
  const adminClient = createAdminClient()
  if (!adminClient) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return
  }

  try {
    const body = ['POST', 'DELETE', 'PATCH'].includes(request.method)
      ? await readBody(request)
      : {}
    const requestedKind = String(body.kind ?? queryValue(request, 'kind')).trim()

    if (requestedKind === 'history') {
      if (request.method === 'GET') {
        await getAuthorizedUser(adminClient, request, 'view')
        sendJson(response, 200, { items: await listActivityHistory(adminClient) })
        return
      }

      if (request.method === 'POST') {
        const action = historyTextValue(body?.action, 64)
        const managementActions = new Set(['created', 'updated', 'deleted', 'reordered'])
        const requiredActions = ['printed', 'summary_printed'].includes(action)
          ? ['view_sensitive', 'export']
          : managementActions.has(action)
            ? 'view_sensitive'
            : 'edit'
        const profile = await getAuthorizedUser(
          adminClient,
          request,
          requiredActions,
        )
        sendJson(response, 200, { item: await saveActivityHistory(adminClient, profile, body) })
        return
      }

      response.setHeader('Allow', 'GET, POST')
      sendJson(response, 405, { error: 'Metodo nao permitido.' })
      return
    }

    const kind = optionKind(requestedKind)

    if (!kind) {
      sendJson(response, 400, { error: 'Tipo de opcao invalido.' })
      return
    }

    if (request.method === 'GET') {
      const profile = await getAuthorizedUser(adminClient, request, 'view')
      const includeMonitorDetails = hasPermission(profile, 'atividades', 'view_sensitive')
      sendJson(response, 200, {
        items: await listOptions(adminClient, kind, includeMonitorDetails),
      })
      return
    }

    if (request.method === 'POST') {
      await getAuthorizedUser(adminClient, request, 'view_sensitive')
      sendJson(response, 200, { item: await saveOption(adminClient, kind, body) })
      return
    }

    if (request.method === 'PATCH') {
      await getAuthorizedUser(adminClient, request, 'view_sensitive')
      sendJson(response, 200, { item: await updateOption(adminClient, kind, body.id, body) })
      return
    }

    if (request.method === 'DELETE') {
      await getAuthorizedUser(adminClient, request, 'view_sensitive')
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
