import { createClient } from '@supabase/supabase-js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'

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
    error?.code === 'PGRST205' ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache') ||
    normalized.includes('could not find the table')
  ) {
    return 'Falta criar as tabelas de atividades/sumarios no Supabase. Execute o SQL atualizado do modulo Atividades e volte a tentar.'
  }
  if (normalized.includes('permission denied')) {
    return 'Sem permissao para consultar estatisticas de atividades.'
  }
  return message
}

const dateIsoPattern = /^\d{4}-\d{2}-\d{2}$/
const monthPattern = /^\d{4}-\d{2}$/
const yearPattern = /^\d{4}$/

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

const weekStartIso = (value) => {
  const source = value instanceof Date ? value : dateFromIso(String(value || ''))
  const date = source ? new Date(source.getFullYear(), source.getMonth(), source.getDate()) : new Date()
  const weekday = date.getDay()
  const offset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + offset)
  return dateToIso(date)
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

const cleanTime = (value) => String(value ?? '').slice(0, 5)

const minutesFromTime = (time) => {
  const value = cleanTime(time)
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const durationMinutes = (start, end, fallback = 0) => {
  const startMinutes = minutesFromTime(start)
  const endMinutes = minutesFromTime(end)
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return Math.max(0, Number(fallback) || 0)
  }
  return endMinutes - startMinutes
}

const dayOffsets = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
}

const scheduleDate = (row) => addDaysToIso(String(row?.week_start ?? ''), dayOffsets[row?.day] ?? 0)

const statisticsBounds = ({ period, month, year: requestedYear }) => {
  if (period === 'year') {
    if (!yearPattern.test(requestedYear || '')) {
      const error = new Error('Ano invalido.')
      error.status = 400
      throw error
    }
    const yearNumber = Number(requestedYear)
    const start = new Date(yearNumber, 0, 1)
    const end = new Date(yearNumber, 11, 31)
    return {
      period: 'year',
      year: requestedYear,
      start: dateToIso(start),
      end: dateToIso(end),
      scheduleStart: weekStartIso(start),
    }
  }

  if (!monthPattern.test(month || '')) {
    const error = new Error('Mes invalido.')
    error.status = 400
    throw error
  }
  const [year, monthNumber] = month.split('-').map(Number)
  const start = new Date(year, monthNumber - 1, 1)
  const end = new Date(year, monthNumber, 0)
  return {
    period: 'month',
    month,
    year: String(year),
    start: dateToIso(start),
    end: dateToIso(end),
    scheduleStart: weekStartIso(start),
  }
}

const getAuthorizedUser = async (adminClient, request) => {
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

  if (!hasPermission(profile, 'atividades', 'view')) {
    const error = new Error('Sem permissao para consultar atividades.')
    error.status = 403
    throw error
  }

  return profile
}

const normalizeAttendance = (attendance) => {
  const seen = new Set()
  const result = []
  for (const item of Array.isArray(attendance) ? attendance : []) {
    const id = String(item?.id ?? '').trim()
    const name = String(item?.name ?? item?.nome ?? '').trim()
    const key = id || name
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push({ id, name: name || 'Sem nome' })
  }
  return result
}

const listMonthData = async (adminClient, bounds) => {
  const [scheduleResult, summariesResult, utentesResult] = await Promise.all([
    adminClient
      .from('activities_schedule')
      .select('id,week_start,day,start_time,end_time,title,teacher')
      .gte('week_start', bounds.scheduleStart)
      .lte('week_start', bounds.end)
      .order('week_start', { ascending: true })
      .order('day', { ascending: true })
      .order('start_time', { ascending: true }),
    adminClient
      .from('activities_summaries')
      .select('id,activity_id,activity_date,activity_title,start_time,end_time,duration_minutes,attendance')
      .gte('activity_date', bounds.start)
      .lte('activity_date', bounds.end)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true }),
    adminClient
      .from('utentes')
      .select('id,nome,numero_utente,estado')
      .order('nome', { ascending: true })
      .limit(1000),
  ])

  if (scheduleResult.error) throw scheduleResult.error
  if (summariesResult.error) throw summariesResult.error
  if (utentesResult.error) throw utentesResult.error

  const activities = (Array.isArray(scheduleResult.data) ? scheduleResult.data : [])
    .map((row) => ({
      id: String(row?.id ?? ''),
      title: String(row?.title ?? '').trim(),
      date: scheduleDate(row),
      start: cleanTime(row?.start_time),
      end: cleanTime(row?.end_time),
    }))
    .filter((row) => row.id && row.date >= bounds.start && row.date <= bounds.end)

  const summaries = (Array.isArray(summariesResult.data) ? summariesResult.data : [])
    .map((row) => ({
      id: String(row?.id ?? ''),
      activityId: String(row?.activity_id ?? ''),
      title: String(row?.activity_title ?? '').trim() || 'Sem nome',
      date: String(row?.activity_date ?? ''),
      start: cleanTime(row?.start_time),
      end: cleanTime(row?.end_time),
      durationMinutes: durationMinutes(row?.start_time, row?.end_time, row?.duration_minutes),
      attendance: normalizeAttendance(row?.attendance),
    }))
    .filter((row) => row.activityId && row.date >= bounds.start && row.date <= bounds.end)

  const utentes = (Array.isArray(utentesResult.data) ? utentesResult.data : [])
    .map((row) => ({
      id: String(row?.id ?? '').trim(),
      name: String(row?.nome ?? '').trim(),
      number: String(row?.numero_utente ?? '').trim(),
    }))
    .filter((row) => row.id && row.name)

  return { activities, summaries, utentes }
}

const buildStatistics = ({ activities, summaries, utentes }, bounds) => {
  const attendanceCounts = new Map()
  const peopleById = new Map(utentes.map((utente) => [utente.id, { ...utente, present: 0 }]))
  const volumeByActivity = new Map()
  let totalAttendance = 0
  let totalVolumeMinutes = 0

  for (const summary of summaries) {
    const present = summary.attendance
    totalAttendance += present.length
    const volumeMinutes = summary.durationMinutes * present.length
    totalVolumeMinutes += volumeMinutes

    const title = summary.title || 'Sem nome'
    const currentVolume = volumeByActivity.get(title) || {
      title,
      sessions: 0,
      attendance: 0,
      durationMinutes: 0,
      volumeMinutes: 0,
    }
    currentVolume.sessions += 1
    currentVolume.attendance += present.length
    currentVolume.durationMinutes += summary.durationMinutes
    currentVolume.volumeMinutes += volumeMinutes
    volumeByActivity.set(title, currentVolume)

    for (const attendee of present) {
      const key = attendee.id || attendee.name
      if (!key) continue
      attendanceCounts.set(key, (attendanceCounts.get(key) || 0) + 1)
      if (!peopleById.has(key)) {
        peopleById.set(key, {
          id: attendee.id || key,
          name: attendee.name || 'Sem nome',
          number: '',
          present: 0,
        })
      }
    }
  }

  for (const [key, count] of attendanceCounts.entries()) {
    const person = peopleById.get(key)
    if (person) person.present = count
  }

  const totalSessions = summaries.length
  const attendance = Array.from(peopleById.values())
    .map((person) => ({
      id: person.id,
      name: person.name,
      number: person.number,
      present: person.present,
      total: totalSessions,
      percentage: totalSessions ? Math.round((person.present / totalSessions) * 1000) / 10 : 0,
    }))
    .sort((left, right) => right.present - left.present || left.name.localeCompare(right.name, 'pt'))

  return {
    period: bounds.period,
    month: bounds.month ?? null,
    year: bounds.year,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    totals: {
      activities: activities.length,
      summaries: summaries.length,
      totalAttendance,
      averageAttendance: totalSessions ? Math.round((totalAttendance / totalSessions) * 10) / 10 : 0,
      volumeMinutes: totalVolumeMinutes,
    },
    attendance,
    volumeByActivity: Array.from(volumeByActivity.values())
      .sort((left, right) => right.volumeMinutes - left.volumeMinutes || left.title.localeCompare(right.title, 'pt')),
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return
  }

  try {
    await getAuthorizedUser(adminClient, request)
    const period = String(queryValue(request, 'period') || 'month').trim() === 'year' ? 'year' : 'month'
    const month = String(queryValue(request, 'month') || '').trim()
    const year = String(queryValue(request, 'year') || '').trim()
    const bounds = statisticsBounds({ period, month, year })
    const data = await listMonthData(adminClient, bounds)
    sendJson(response, 200, { statistics: buildStatistics(data, bounds) })
  } catch (error) {
    sendJson(response, error.status ?? 500, { error: clientErrorMessage(error) })
  }
}
