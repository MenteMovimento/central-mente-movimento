import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody } from '../api-lib/http.js'
import {
  centralSessionError,
  getSessionIdFromToken,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '../api-lib/central-session.js'

const CHALLENGE_MINUTES = 10
const RESEND_SECONDS = 60
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 256

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
}

const createSupabaseClient = (key) =>
  createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

const validateConfiguration = () => {
  if (!getSupabaseUrl() || !getSupabaseAnonKey() || !getSupabaseServiceRoleKey()) {
    throw centralSessionError(
      500,
      'Falta configurar o Supabase na Vercel.',
      'EMAIL_VERIFICATION_NOT_CONFIGURED',
    )
  }
}

const cleanEmail = (value) => String(value ?? '').trim().toLowerCase()

const isValidEmail = (email) =>
  email.length > 0 && email.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const challengeExpiry = () => new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000)

const secondsUntil = (dateValue) =>
  Math.max(0, Math.ceil((new Date(dateValue).getTime() + RESEND_SECONDS * 1000 - Date.now()) / 1000))

const sendEmailCode = async (email) => {
  const otpClient = createSupabaseClient(getSupabaseAnonKey())
  const { error } = await otpClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (error) {
    throw centralSessionError(
      503,
      'Nao foi possivel enviar o codigo por email. Tente novamente dentro de instantes.',
      'EMAIL_CODE_SEND_FAILED',
    )
  }
}

const publicChallenge = (challenge, email) => ({
  ok: true,
  challengeId: challenge.id,
  email,
  expiresAt: challenge.expires_at,
  resendAfter: RESEND_SECONDS,
})

const getActiveProfile = async (adminClient, userId) => {
  const { data, error } = await adminClient
    .from('app_users')
    .select('id,active')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data || data.active === false) {
    throw centralSessionError(403, 'Utilizador sem acesso ativo.', 'USER_NOT_AUTHORIZED')
  }
  return data
}

const startPasswordChallenge = async (adminClient, body) => {
  const email = cleanEmail(body.email)
  const password = String(body.password ?? '')
  if (!isValidEmail(email) || !password || password.length > MAX_PASSWORD_LENGTH) {
    throw centralSessionError(401, 'Credenciais invalidas ou utilizador sem acesso.', 'INVALID_CREDENTIALS')
  }

  const passwordClient = createSupabaseClient(getSupabaseAnonKey())
  const { data, error } = await passwordClient.auth.signInWithPassword({ email, password })
  const user = data?.user
  const passwordSessionId = getSessionIdFromToken(data?.session?.access_token ?? '')
  if (error || !user || !passwordSessionId) {
    throw centralSessionError(401, 'Credenciais invalidas ou utilizador sem acesso.', 'INVALID_CREDENTIALS')
  }

  await passwordClient.auth.signOut({ scope: 'local' }).catch(() => {})
  await getActiveProfile(adminClient, user.id)

  const { data: latest, error: latestError } = await adminClient
    .from('central_email_verification_challenges')
    .select('id,last_sent_at')
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('last_sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) throw latestError

  const retryAfter = latest?.last_sent_at ? secondsUntil(latest.last_sent_at) : 0
  if (retryAfter > 0) {
    const rateError = centralSessionError(
      429,
      `Aguarde ${retryAfter} segundos antes de pedir outro codigo.`,
      'RESEND_TOO_SOON',
    )
    rateError.retryAfter = retryAfter
    throw rateError
  }

  const now = new Date()
  const expires = challengeExpiry()
  const { data: challenge, error: insertError } = await adminClient
    .from('central_email_verification_challenges')
    .insert({
      user_id: user.id,
      password_session_id: passwordSessionId,
      created_at: now.toISOString(),
      last_sent_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .select('id,expires_at')
    .single()
  if (insertError) throw insertError

  try {
    await sendEmailCode(email)
  } catch (sendError) {
    await adminClient
      .from('central_email_verification_challenges')
      .delete()
      .eq('id', challenge.id)
    throw sendError
  }

  return publicChallenge(challenge, email)
}

const resendChallenge = async (adminClient, body) => {
  const challengeId = String(body.challengeId ?? '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId)) {
    throw centralSessionError(400, 'Pedido de verificacao invalido.', 'INVALID_CHALLENGE')
  }

  const { data: challenge, error } = await adminClient
    .from('central_email_verification_challenges')
    .select('id,user_id,expires_at,last_sent_at,completed_at')
    .eq('id', challengeId)
    .maybeSingle()
  if (error) throw error
  if (!challenge || challenge.completed_at || new Date(challenge.expires_at).getTime() <= Date.now()) {
    throw centralSessionError(410, 'O pedido expirou. Volte a introduzir a password.', 'CHALLENGE_EXPIRED')
  }

  const retryAfter = secondsUntil(challenge.last_sent_at)
  if (retryAfter > 0) {
    const rateError = centralSessionError(
      429,
      `Aguarde ${retryAfter} segundos antes de pedir outro codigo.`,
      'RESEND_TOO_SOON',
    )
    rateError.retryAfter = retryAfter
    throw rateError
  }

  await getActiveProfile(adminClient, challenge.user_id)
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(challenge.user_id)
  const email = cleanEmail(authData?.user?.email)
  if (authError || !isValidEmail(email)) {
    throw centralSessionError(400, 'A conta nao tem um email valido.', 'INVALID_ACCOUNT_EMAIL')
  }

  await sendEmailCode(email)
  const now = new Date()
  const expires = challengeExpiry()
  const { data: updated, error: updateError } = await adminClient
    .from('central_email_verification_challenges')
    .update({ last_sent_at: now.toISOString(), expires_at: expires.toISOString() })
    .eq('id', challenge.id)
    .select('id,expires_at')
    .single()
  if (updateError) throw updateError

  return publicChallenge(updated, email)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  try {
    validateConfiguration()
    const body = await readJsonBody(request, 16 * 1024)
    const adminClient = createSupabaseClient(getSupabaseServiceRoleKey())
    const payload = body.challengeId
      ? await resendChallenge(adminClient, body)
      : await startPasswordChallenge(adminClient, body)

    const now = new Date().toISOString()
    await Promise.all([
      adminClient.from('central_email_verification_challenges').delete().lt('expires_at', now),
      adminClient.from('central_verified_sessions').delete().lt('expires_at', now),
    ])
    sendJson(response, 200, payload)
  } catch (error) {
    console.error('email-verification-start failed', {
      code: error?.code ?? null,
      message: error instanceof Error ? error.message : String(error),
    })
    const status = Number(error?.status)
    if (Number(error?.retryAfter) > 0) {
      response.setHeader('Retry-After', String(Math.ceil(Number(error.retryAfter))))
    }
    sendJson(response, status >= 400 && status < 600 ? status : 500, {
      error: exposedErrorMessage(error, 'Nao foi possivel iniciar a verificacao por email.'),
      code: error?.code ?? 'EMAIL_VERIFICATION_FAILED',
      ...(Number(error?.retryAfter) > 0 ? { retryAfter: Number(error.retryAfter) } : {}),
    })
  }
}
