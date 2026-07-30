import { createClient } from '@supabase/supabase-js'
import { exposedErrorMessage, readJsonBody } from '../api-lib/http.js'
import {
  centralSessionError,
  decodeJwtPayload,
  getBearerToken,
  getSessionIdFromToken,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isEmailOtpSession,
} from '../api-lib/central-session.js'

const VERIFIED_SESSION_HOURS = 12

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store')
  response.status(status).json(body)
}

const createAdminClient = () =>
  createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const validChallengeId = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Metodo nao permitido.' })
    return
  }

  try {
    if (!getSupabaseUrl() || !getSupabaseServiceRoleKey()) {
      throw centralSessionError(
        500,
        'Falta configurar o Supabase na Vercel.',
        'EMAIL_VERIFICATION_NOT_CONFIGURED',
      )
    }

    const token = getBearerToken(request)
    const body = await readJsonBody(request, 8 * 1024)
    const challengeId = String(body.challengeId ?? '').trim()
    if (!token || !validChallengeId(challengeId)) {
      throw centralSessionError(400, 'Pedido de verificacao invalido.', 'INVALID_CHALLENGE')
    }

    const adminClient = createAdminClient()
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token)
    const sessionId = getSessionIdFromToken(token)
    const tokenSubject = String(decodeJwtPayload(token)?.sub ?? '')
    if (userError || !user || !sessionId || tokenSubject !== user.id) {
      throw centralSessionError(401, 'Codigo invalido ou expirado.', 'INVALID_EMAIL_CODE')
    }
    if (!isEmailOtpSession(token)) {
      throw centralSessionError(401, 'Confirme o codigo enviado por email.', 'INVALID_EMAIL_CODE')
    }

    const { data: challenge, error: challengeError } = await adminClient
      .from('central_email_verification_challenges')
      .select('id,user_id,password_session_id,expires_at,completed_at,verified_session_id')
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (challengeError) throw challengeError
    if (!challenge) {
      throw centralSessionError(401, 'Codigo invalido ou expirado.', 'INVALID_EMAIL_CODE')
    }
    if (challenge.completed_at) {
      if (challenge.verified_session_id === sessionId) {
        const { data: existing } = await adminClient
          .from('central_verified_sessions')
          .select('expires_at')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()
        if (existing) {
          sendJson(response, 200, { ok: true, expiresAt: existing.expires_at })
          return
        }
      }
      throw centralSessionError(410, 'Este codigo ja foi utilizado.', 'CHALLENGE_COMPLETED')
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      throw centralSessionError(410, 'O codigo expirou. Peca um novo codigo.', 'CHALLENGE_EXPIRED')
    }
    if (challenge.password_session_id === sessionId) {
      throw centralSessionError(401, 'Confirme o codigo enviado por email.', 'INVALID_EMAIL_CODE')
    }

    const { data: profile, error: profileError } = await adminClient
      .from('app_users')
      .select('id,active')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile || profile.active === false) {
      throw centralSessionError(403, 'Utilizador sem acesso ativo.', 'USER_NOT_AUTHORIZED')
    }

    const verifiedAt = new Date()
    const expiresAt = new Date(verifiedAt.getTime() + VERIFIED_SESSION_HOURS * 60 * 60 * 1000)
    const { error: verifiedError } = await adminClient
      .from('central_verified_sessions')
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          challenge_id: challenge.id,
          verified_at: verifiedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'session_id' },
      )
    if (verifiedError) throw verifiedError

    const { error: completedError } = await adminClient
      .from('central_email_verification_challenges')
      .update({
        completed_at: verifiedAt.toISOString(),
        verified_session_id: sessionId,
      })
      .eq('id', challenge.id)
      .is('completed_at', null)
    if (completedError) throw completedError

    sendJson(response, 200, { ok: true, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('email-verification-complete failed', {
      code: error?.code ?? null,
      message: error instanceof Error ? error.message : String(error),
    })
    const status = Number(error?.status)
    sendJson(response, status >= 400 && status < 600 ? status : 500, {
      error: exposedErrorMessage(error, 'Nao foi possivel concluir a verificacao por email.'),
      code: error?.code ?? 'EMAIL_VERIFICATION_FAILED',
    })
  }
}
