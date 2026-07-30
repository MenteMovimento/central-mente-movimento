import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../api-lib/http.js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../api-lib/central-session.js'

const summaryColumns =
  'id, activity_id, activity_date, activity_title, start_time, end_time, duration_minutes, summary, attendance, created_at, updated_at'

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
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
  return exposedErrorMessage(error, 'Nao foi possivel concluir o pedido.')
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

const dateIsoInLisbon = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const part = (type) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const activityWeekStartIso = (iso) => {
  if (!dateFromIso(String(iso || ''))) return ''
  const date = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday))
  return date.toISOString().slice(0, 10)
}

export const isActivitySummaryWeekLocked = (activityDate, now = new Date()) => {
  const currentWeekStart = activityWeekStartIso(dateIsoInLisbon(now))
  const activityWeekStart = activityWeekStartIso(String(activityDate || ''))
  return Boolean(currentWeekStart && activityWeekStart && activityWeekStart < currentWeekStart)
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

const dayOffsets = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
}

const durationBetween = (start, end) => {
  const [startHours, startMinutes] = String(start || '').split(':').map(Number)
  const [endHours, endMinutes] = String(end || '').split(':').map(Number)
  if (![startHours, startMinutes, endHours, endMinutes].every(Number.isFinite)) return 0
  return Math.max(0, endHours * 60 + endMinutes - (startHours * 60 + startMinutes))
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

  if (!hasPermission(profile, 'atividades', action)) {
    const error = new Error('Sem permissao para gerir atividades.')
    error.status = 403
    throw error
  }

  return profile
}

const cleanStoredAttendance = (attendance, includeSignatures) =>
  (Array.isArray(attendance) ? attendance : [])
    .map((item) => {
      const id = String(item?.id ?? '').trim()
      const name = String(item?.name ?? item?.nome ?? '').trim()
      if (!id || !name) return null
      const signature = String(item?.signature ?? '').trim()
      const missingMinutes = Math.max(0, Math.round(Number(item?.missingMinutes ?? item?.missing_minutes) || 0))
      return {
        id,
        name,
        missingMinutes,
        signed: signature.startsWith('data:image/png;base64,'),
        ...(includeSignatures && signature
          ? {
              signature,
              signatureAt: String(item?.signatureAt ?? item?.signature_at ?? '').trim(),
            }
          : {}),
      }
    })
    .filter(Boolean)
    .slice(0, 250)

const summaryPayload = (row, includeSignatures = true) => ({
  id: String(row?.id ?? ''),
  activityId: String(row?.activity_id ?? ''),
  activityDate: String(row?.activity_date ?? ''),
  title: String(row?.activity_title ?? ''),
  start: cleanTime(row?.start_time),
  end: cleanTime(row?.end_time),
  durationMinutes: Number(row?.duration_minutes ?? 0) || 0,
  summary: String(row?.summary ?? ''),
  attendance: cleanStoredAttendance(row?.attendance, includeSignatures),
})

const utentePayload = (row) => ({
  id: String(row?.id ?? ''),
  name: String(row?.nome ?? '').trim(),
})

const listSummaries = async (adminClient, weekStart, includeSignatures) => {
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
  return Array.isArray(data)
    ? data.map((row) => summaryPayload(row, includeSignatures)).filter((item) => item.activityId)
    : []
}

const listUtentes = async (adminClient) => {
  const { data, error } = await adminClient
    .from('utentes')
    .select('id,nome')
    .order('nome', { ascending: true })
    .limit(500)

  if (error) throw error
  return Array.isArray(data)
    ? data.map(utentePayload).filter((item) => item.id && item.name)
    : []
}

const cleanAttendanceSignature = (value) => {
  const signature = String(value ?? '').trim()
  if (!signature.startsWith('data:image/png;base64,')) return ''
  if (signature.length > 250000) return ''

  const base64 = signature.slice('data:image/png;base64,'.length)
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return ''

  try {
    const decoded = Buffer.from(base64, 'base64')
    const isPng =
      decoded.length >= 8 &&
      decoded[0] === 0x89 &&
      decoded[1] === 0x50 &&
      decoded[2] === 0x4e &&
      decoded[3] === 0x47
    return isPng && decoded.length <= 180000 ? signature : ''
  } catch {
    return ''
  }
}

const loadAllowedUtentes = async (adminClient, attendance) => {
  const ids = Array.from(
    new Set(
      (Array.isArray(attendance) ? attendance : [])
        .map((item) => String(item?.id ?? '').trim())
        .filter(Boolean),
    ),
  ).slice(0, 250)

  if (!ids.length) return new Map()

  const { data, error } = await adminClient.from('utentes').select('id,nome').in('id', ids)
  if (error) throw error
  return new Map(
    (Array.isArray(data) ? data : [])
      .map((row) => [String(row?.id ?? '').trim(), String(row?.nome ?? '').trim()])
      .filter(([id, name]) => id && name),
  )
}

const normalizeAttendance = (attendance, allowedUtentes, activityDurationMinutes) => {
  const normalized = []
  const seen = new Set()
  let signatureCharacters = 0

  for (const item of (Array.isArray(attendance) ? attendance : []).slice(0, 250)) {
    const id = String(item?.id ?? '').trim()
    const name = allowedUtentes.get(id)
    if (!id || !name || seen.has(id)) continue
    seen.add(id)

    let signature = cleanAttendanceSignature(item?.signature)
    if (signatureCharacters + signature.length > 2000000) signature = ''
    signatureCharacters += signature.length

    const signatureAt = String(item?.signatureAt ?? item?.signature_at ?? '').trim()
    const rawMissingMinutes = Number(item?.missingMinutes ?? item?.missing_minutes ?? 0)
    const missingMinutes = Math.round(rawMissingMinutes)
    if (
      !Number.isFinite(rawMissingMinutes) ||
      missingMinutes < 0 ||
      missingMinutes > activityDurationMinutes
    ) {
      const error = new Error('O tempo em falta nao pode ultrapassar a duracao da atividade.')
      error.status = 400
      throw error
    }
    normalized.push({
      id,
      name,
      missingMinutes,
      ...(signature
        ? {
            signature,
            ...(signatureAt && Number.isFinite(Date.parse(signatureAt)) ? { signatureAt } : {}),
          }
        : {}),
    })
  }

  return normalized
}

const loadScheduleActivity = async (adminClient, activityId) => {
  const { data, error } = await adminClient
    .from('activities_schedule')
    .select('id,week_start,day,start_time,end_time,title')
    .eq('id', activityId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const notFound = new Error('Atividade nao encontrada.')
    notFound.status = 404
    throw notFound
  }

  const dayOffset = dayOffsets[String(data.day ?? '')]
  const activityDate = Number.isInteger(dayOffset)
    ? addDaysToIso(String(data.week_start ?? ''), dayOffset)
    : ''
  const start = cleanTime(data.start_time)
  const end = cleanTime(data.end_time)
  const title = String(data.title ?? '').trim()
  if (!dateFromIso(activityDate) || !title || !start) {
    const invalid = new Error('A atividade guardada tem dados invalidos.')
    invalid.status = 400
    throw invalid
  }

  return { activityDate, title, start, end, durationMinutes: durationBetween(start, end) }
}

const saveSummary = async (adminClient, body, userId) => {
  const activityId = String(body?.activityId ?? '').trim()
  if (!activityId) {
    const error = new Error('Dados do sumario invalidos.')
    error.status = 400
    throw error
  }

  const schedule = await loadScheduleActivity(adminClient, activityId)
  if (isActivitySummaryWeekLocked(schedule.activityDate)) {
    const error = new Error(
      'Este sumário pertence a uma semana encerrada e já não pode ser alterado.',
    )
    error.status = 409
    throw error
  }
  const allowedUtentes = await loadAllowedUtentes(adminClient, body?.attendance)

  const row = {
    activity_id: activityId,
    activity_date: schedule.activityDate,
    activity_title: schedule.title,
    start_time: schedule.start,
    end_time: schedule.end || null,
    duration_minutes: schedule.durationMinutes,
    summary: String(body?.summary ?? '').trim().slice(0, 20000),
    attendance: normalizeAttendance(body?.attendance, allowedUtentes, schedule.durationMinutes),
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
      const profile = await getAuthorizedUser(adminClient, request, 'view')
      const canEdit = hasPermission(profile, 'atividades', 'edit')
      const weekStart = String(queryValue(request, 'weekStart') || '').trim()
      const [summaries, utentes] = await Promise.all([
        listSummaries(adminClient, weekStart, canEdit),
        canEdit ? listUtentes(adminClient) : Promise.resolve([]),
      ])
      sendJson(response, 200, { summaries, utentes })
      return
    }

    const profile = await getAuthorizedUser(adminClient, request, 'edit')
    const body = await readBody(request)
    sendJson(response, 200, { summary: await saveSummary(adminClient, body, profile.id) })
  } catch (error) {
    sendJson(response, error.status ?? 500, { error: clientErrorMessage(error) })
  }
}
