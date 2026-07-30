import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody as readBody } from '../api-lib/http.js'
import { hasPermission, normalizePermissions } from '../api-lib/permissions.js'
import { assertVerifiedCentralSession } from '../api-lib/central-session.js'

export const QUESTIONNAIRE_RESPONSE_KEYS = [
  'participation_1',
  'participation_2',
  'participation_3',
  'learning_1',
  'learning_2',
  'learning_3',
  'wellbeing_1',
  'wellbeing_2',
  'wellbeing_3',
  'wellbeing_4',
  'relationships_1',
  'relationships_2',
  'relationships_3',
  'autonomy_1',
  'autonomy_2',
  'autonomy_3',
  'inclusion_1',
  'inclusion_2',
  'inclusion_3',
]

const QUESTIONNAIRE_TAB_PREFIX = 'activities_questionnaire:'
const questionnaireStorageColumns = 'id,utente_id,tab_key,conteudo,created_at,updated_at'

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

  if (!supabaseUrl || !serviceRoleKey) return null
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
    return 'Nao foi possivel aceder aos questionarios guardados.'
  }
  if (normalized.includes('permission denied')) {
    return 'Sem permissao para consultar ou guardar questionarios.'
  }
  return exposedErrorMessage(error, 'Nao foi possivel concluir o pedido.')
}

const invalidInput = (message) => {
  const error = new Error(message)
  error.status = 400
  return error
}

const notFound = (message) => {
  const error = new Error(message)
  error.status = 404
  return error
}

const queryValue = (request, key) => {
  if (request.query?.[key] !== undefined) return request.query[key]
  const url = new URL(request.url ?? '/', 'https://central.local')
  return url.searchParams.get(key) ?? ''
}

const getAuthorizedUser = async (adminClient, request, action = 'view_sensitive') => {
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
    .select('id,active,permissions')
    .eq('id', user.id)
    .maybeSingle()

  if (appUserError) throw appUserError
  if (!appUser || appUser.active === false) {
    const error = new Error('Utilizador sem acesso ativo.')
    error.status = 403
    throw error
  }

  const profile = { ...appUser, permissions: normalizePermissions(appUser.permissions) }
  if (!hasPermission(profile, 'atividades', action)) {
    const error = new Error('Sem permissao para gerir questionarios de atividades.')
    error.status = 403
    throw error
  }
  return profile
}

const boundedInteger = (value, minimum, maximum, label) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw invalidInput(`${label} invalido.`)
  }
  return number
}

export const normalizeQuestionnaireResponses = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw invalidInput('Respostas invalidas.')
  }
  const responses = {}
  for (const key of QUESTIONNAIRE_RESPONSE_KEYS) {
    responses[key] = boundedInteger(source[key], 1, 5, 'Resposta')
  }
  return responses
}

const questionnairePayload = (source) => ({
  id: String(source?.id ?? ''),
  activityId: String(source?.activityId ?? ''),
  activityName: String(source?.activityName ?? '').trim(),
  utenteId: String(source?.utenteId ?? ''),
  utenteName: String(source?.utenteName ?? '').trim(),
  year: Number(source?.year ?? 0),
  month: Number(source?.month ?? 0),
  responses: source?.responses && typeof source.responses === 'object' ? source.responses : {},
  completedAt: String(source?.completedAt ?? ''),
  createdAt: String(source?.createdAt ?? ''),
  updatedAt: String(source?.updatedAt ?? ''),
  createdBy: String(source?.createdBy ?? ''),
  updatedBy: String(source?.updatedBy ?? ''),
})

export const questionnaireTabKey = (activityId, year, month) =>
  `${QUESTIONNAIRE_TAB_PREFIX}${activityId}:${year}-${String(month).padStart(2, '0')}`

export const parseStoredQuestionnaire = (row) => {
  let content = null
  try {
    content = JSON.parse(String(row?.conteudo ?? ''))
  } catch {
    return null
  }
  if (!content || content.kind !== 'activity_questionnaire') return null
  const record = questionnairePayload({
    ...content,
    id: row?.id,
    utenteId: content.utenteId || row?.utente_id,
    createdAt: content.createdAt || row?.created_at,
    updatedAt: content.updatedAt || row?.updated_at,
  })
  return record.id && record.activityId && record.utenteId && record.year && record.month ? record : null
}

const activityPayload = (row) => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? '').trim(),
})

const utentePayload = (row) => ({
  id: String(row?.id ?? ''),
  name: String(row?.nome ?? '').trim(),
})

const listReferenceData = async (adminClient) => {
  const [activitiesResult, utentesResult] = await Promise.all([
    adminClient.from('activities_catalog').select('id,name').eq('active', true).order('name', { ascending: true }).limit(500),
    adminClient.from('utentes').select('id,nome').order('nome', { ascending: true }).limit(1000),
  ])
  if (activitiesResult.error) throw activitiesResult.error
  if (utentesResult.error) throw utentesResult.error
  return {
    activities: (activitiesResult.data ?? []).map(activityPayload).filter((item) => item.id && item.name),
    utentes: (utentesResult.data ?? []).map(utentePayload).filter((item) => item.id && item.name),
  }
}

const listQuestionnaires = async (adminClient, request) => {
  const yearValue = String(queryValue(request, 'year') ?? '').trim()
  const activityId = String(queryValue(request, 'activityId') ?? '').trim()
  const utenteId = String(queryValue(request, 'utenteId') ?? '').trim()
  const monthValue = String(queryValue(request, 'month') ?? '').trim()

  const year = yearValue ? boundedInteger(yearValue, 2000, 2100, 'Ano') : 0
  const month = monthValue ? boundedInteger(monthValue, 1, 12, 'Mes') : 0
  let query = adminClient
    .from('utente_abas')
    .select(questionnaireStorageColumns)
    .like('tab_key', `${QUESTIONNAIRE_TAB_PREFIX}%`)
    .order('updated_at', { ascending: false })
    .limit(5000)
  if (utenteId) query = query.eq('utente_id', utenteId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? [])
    .map(parseStoredQuestionnaire)
    .filter(
      (record) =>
        record &&
        (!year || record.year === year) &&
        (!month || record.month === month) &&
        (!activityId || record.activityId === activityId) &&
        (!utenteId || record.utenteId === utenteId),
    )
    .sort(
      (left, right) =>
        right.year - left.year ||
        right.month - left.month ||
        left.utenteName.localeCompare(right.utenteName, 'pt'),
    )
}

const findActivity = async (adminClient, id) => {
  const { data, error } = await adminClient
    .from('activities_catalog')
    .select('id,name,active')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data || data.active === false) throw invalidInput('Selecione uma atividade valida.')
  return activityPayload(data)
}

const findUtente = async (adminClient, id) => {
  const { data, error } = await adminClient.from('utentes').select('id,nome').eq('id', id).maybeSingle()
  if (error) throw error
  const utente = utentePayload(data)
  if (!utente.id || !utente.name) throw invalidInput('Selecione um utente valido.')
  return utente
}

const saveQuestionnaire = async (adminClient, profile, body) => {
  const activityId = String(body?.activityId ?? '').trim()
  const utenteId = String(body?.utenteId ?? '').trim()
  if (!activityId) throw invalidInput('Selecione a atividade.')
  if (!utenteId) throw invalidInput('Selecione o utente.')

  const year = boundedInteger(body?.year, 2000, 2100, 'Ano')
  const month = boundedInteger(body?.month, 1, 12, 'Mes')
  const responses = normalizeQuestionnaireResponses(body?.responses)
  const [activity, utente] = await Promise.all([
    findActivity(adminClient, activityId),
    findUtente(adminClient, utenteId),
  ])

  const tabKey = questionnaireTabKey(activity.id, year, month)
  const { data: existing, error: existingError } = await adminClient
    .from('utente_abas')
    .select(questionnaireStorageColumns)
    .eq('utente_id', utente.id)
    .eq('tab_key', tabKey)
    .maybeSingle()
  if (existingError) throw existingError

  const now = new Date().toISOString()
  const previous = existing ? parseStoredQuestionnaire(existing) : null
  const content = {
    kind: 'activity_questionnaire',
    version: 1,
    activityId: activity.id,
    activityName: activity.name,
    utenteId: utente.id,
    utenteName: utente.name,
    year,
    month,
    responses,
    completedAt: now,
    createdAt: previous?.createdAt || String(existing?.created_at || now),
    updatedAt: now,
    createdBy: String(previous?.createdBy || profile.id),
    updatedBy: String(profile.id),
  }

  const mutation = existing?.id
    ? adminClient
        .from('utente_abas')
        .update({ conteudo: JSON.stringify(content), updated_at: now })
        .eq('id', existing.id)
    : adminClient.from('utente_abas').insert({
        utente_id: utente.id,
        tab_key: tabKey,
        conteudo: JSON.stringify(content),
        created_at: now,
        updated_at: now,
      })

  const { data, error } = await mutation.select(questionnaireStorageColumns).single()
  if (error) throw error
  const record = parseStoredQuestionnaire(data)
  if (!record) throw new Error('Nao foi possivel validar o questionario guardado.')
  return record
}

const deleteQuestionnaire = async (adminClient, body) => {
  const id = String(body?.id ?? '').trim()
  if (!id) throw invalidInput('Selecione o questionario a eliminar.')

  const { data: stored, error: storedError } = await adminClient
    .from('utente_abas')
    .select(questionnaireStorageColumns)
    .eq('id', id)
    .maybeSingle()
  if (storedError) throw storedError

  const record = parseStoredQuestionnaire(stored)
  if (!record || !String(stored?.tab_key ?? '').startsWith(QUESTIONNAIRE_TAB_PREFIX)) {
    throw notFound('Questionario nao encontrado.')
  }

  const { error: deleteError } = await adminClient
    .from('utente_abas')
    .delete()
    .eq('id', id)
    .eq('utente_id', record.utenteId)
    .like('tab_key', `${QUESTIONNAIRE_TAB_PREFIX}%`)
  if (deleteError) throw deleteError

  return record.id
}

export default async function handler(request, response) {
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, DELETE')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    sendJson(response, 500, { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' })
    return
  }

  try {
    const profile = await getAuthorizedUser(adminClient, request, 'view_sensitive')
    if (request.method === 'GET') {
      const [records, referenceData] = await Promise.all([
        listQuestionnaires(adminClient, request),
        listReferenceData(adminClient),
      ])
      sendJson(response, 200, { records, ...referenceData })
      return
    }

    const body = await readBody(request)
    if (request.method === 'DELETE') {
      sendJson(response, 200, { deletedId: await deleteQuestionnaire(adminClient, body) })
      return
    }

    sendJson(response, 200, { record: await saveQuestionnaire(adminClient, profile, body) })
  } catch (error) {
    sendJson(response, Number(error?.status) || 500, { error: clientErrorMessage(error) })
  }
}
