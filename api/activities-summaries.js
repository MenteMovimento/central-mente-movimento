import { createClient } from '@supabase/supabase-js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'

const summaryColumns =
  'id, activity_id, activity_date, activity_title, start_time, end_time, duration_minutes, summary, attendance, created_at, updated_at'

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

const readBody = async (request) => {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return request.body ? JSON.parse(request.body) : {}
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
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
    error?.code === 'PGRST205' ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache') ||
    normalized.includes('could not find the table')
  ) {
    return 'Falta criar a tabela de sumarios de atividades no Supabase. Execute o SQL atualizado do modulo Atividades e volte a tentar.'
  }
  if (normalized.includes('permission denied')) {
    return 'Sem permissao para guardar os sumarios de atividades.'
  }
  return message
}

const dateIsoPattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}$/

const dateFromIso = (value) => {
  if (!dateIsoPattern.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

const dateToIso = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysToIso = (iso, days) => {
  const date = dateFromIso(iso) || new Date()
  date.setDate(date.getDate() + days)
  return dateToIso(date)
}

const queryValue = (request, key) => {
  if (request.query?.[key]) return request.query[key]
  const url = new URL(request.url ?? '/', 'https://central.local')
  return url.searchParams.get(key) ?? ''
}

const cleanTime = (value) => {
  const time = String(value ?? '').slice(0, 5)
  return timePattern.test(time) ? time : ''
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

const summaryPayload = (row) => ({
  id: String(row?.id ?? ''),
  activityId: String(row?.activity_id ?? ''),
  activityDate: String(row?.activity_date ?? ''),
  title: String(row?.activity_title ?? ''),
  start: cleanTime(row?.start_time),
  end: cleanTime(row?.end_time),
  durationMinutes: Number(row?.duration_minutes ?? 0) || 0,
  summary: String(row?.summary ?? ''),
  attendance: Array.isArray(row?.attendance) ? row.attendance : [],
})

const utentePayload = (row) => ({
  id: String(row?.id ?? ''),
  name: String(row?.nome ?? '').trim(),
  number: String(row?.numero_utente ?? '').trim(),
})

const listSummaries = async (adminClient, weekStart) => {
  const startDate = dateFromIso(weekStart)
  if (!startDate) {
    const error = new Error('Semana invalida.')
    error.status = 400
    throw error
  }
  const weekEnd = addDaysToIso(weekStart, 4)
  const { data, error } = await adminClient
    .from('activities_summaries')
    .select(summaryColumns)
    .gte('activity_date', weekStart)
    .lte('activity_date', weekEnd)
    .order('activity_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return Array.isArray(data) ? data.map(summaryPayload).filter((item) => item.activityId) : []
}

const listUtentes = async (adminClient) => {
  const { data, error } = await adminClient
    .from('utentes')
    .select('id,nome,numero_utente,estado')
    .order('nome', { ascending: true })
    .limit(1000)

  if (error) throw error
  return Array.isArray(data)
    ? data.map(utentePayload).filter((item) => item.id && item.name)
    : []
}

const normalizeAttendance = (attendance) =>
  (Array.isArray(attendance) ? attendance : [])
    .map((item) => ({
      id: String(item?.id ?? '').trim(),
      name: String(item?.name ?? item?.nome ?? '').trim(),
      number: String(item?.number ?? item?.numero_utente ?? '').trim(),
    }))
    .filter((item) => item.id && item.name)
    .slice(0, 1000)

const saveSummary = async (adminClient, body, userId) => {
  const activityId = String(body?.activityId ?? '').trim()
  const activityDate = String(body?.activityDate ?? '').trim()
  const title = String(body?.title ?? '').trim()
  const start = cleanTime(body?.start)
  const end = cleanTime(body?.end)
  const durationMinutes = Math.max(0, Number(body?.durationMinutes ?? 0) || 0)

  if (!activityId || !dateFromIso(activityDate) || !title || !start) {
    const error = new Error('Dados do sumario invalidos.')
    error.status = 400
    throw error
  }

  const row = {
    activity_id: activityId,
    activity_date: activityDate,
    activity_title: title,
    start_time: start,
    end_time: end || null,
    duration_minutes: durationMinutes,
    summary: String(body?.summary ?? '').trim(),
    attendance: normalizeAttendance(body?.attendance),
    created_by: userId,
  }

  const { data, error } = await adminClient
    .from('activities_summaries')
    .upsert(row, { onConflict: 'activity_id,activity_date' })
    .select(summaryColumns)
    .single()

  if (error) throw error
  return summaryPayload(data)
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return
  }

  try {
    if (request.method === 'GET') {
      await getAuthorizedUser(adminClient, request, 'view')
      const weekStart = String(queryValue(request, 'weekStart') || '').trim()
      const [summaries, utentes] = await Promise.all([
        listSummaries(adminClient, weekStart),
        listUtentes(adminClient),
      ])
      sendJson(response, 200, { summaries, utentes })
      return
    }

    const profile = await getAuthorizedUser(adminClient, request, 'edit')
    const body = await readBody(request).catch(() => ({}))
    sendJson(response, 200, { summary: await saveSummary(adminClient, body, profile.id) })
  } catch (error) {
    sendJson(response, error.status ?? 500, { error: clientErrorMessage(error) })
  }
}
