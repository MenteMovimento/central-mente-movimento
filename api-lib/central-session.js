const getEnvironmentValue = (...names) => {
  for (const name of names) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

export const getSupabaseUrl = () =>
  getEnvironmentValue('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')

export const getSupabaseAnonKey = () =>
  getEnvironmentValue('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const getSupabaseServiceRoleKey = () =>
  getEnvironmentValue('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY')

export const getBearerToken = (request) => {
  const authorization = String(request?.headers?.authorization ?? '')
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
}

export const decodeJwtPayload = (token) => {
  if (typeof token !== 'string' || token.split('.').length !== 3) return null
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export const getSessionIdFromToken = (token) => {
  const sessionId = decodeJwtPayload(token)?.session_id
  return typeof sessionId === 'string' ? sessionId.trim() : ''
}

export const getAuthenticationMethods = (token) => {
  const amr = decodeJwtPayload(token)?.amr
  if (!Array.isArray(amr)) return []
  return amr
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (entry && typeof entry.method === 'string') return entry.method
      return ''
    })
    .map((method) => method.trim().toLowerCase())
    .filter(Boolean)
}

export const isEmailOtpSession = (token) => {
  const methods = getAuthenticationMethods(token)
  return methods.includes('otp')
}

export const centralSessionError = (status, message, code = '') => {
  const error = new Error(message)
  error.status = status
  error.expose = true
  if (code) error.code = code
  return error
}

const isMissingVerificationTable = (error) => {
  const message = String(error?.message ?? '').toLowerCase()
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    message.includes('central_verified_sessions') ||
    message.includes('schema cache')
  )
}

export const assertVerifiedCentralSession = async (adminClient, token, { user = null } = {}) => {
  const sessionId = getSessionIdFromToken(token)
  const userId = String(user?.id ?? decodeJwtPayload(token)?.sub ?? '').trim()
  if (!sessionId || !userId) {
    throw centralSessionError(
      401,
      'Confirme o codigo enviado por email para continuar.',
      'EMAIL_VERIFICATION_REQUIRED',
    )
  }

  const { data, error } = await adminClient
    .from('central_verified_sessions')
    .select('session_id,user_id,expires_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    if (isMissingVerificationTable(error)) {
      throw centralSessionError(
        503,
        'A verificacao por email ainda nao foi instalada na base de dados.',
        'EMAIL_VERIFICATION_NOT_CONFIGURED',
      )
    }
    throw error
  }

  if (!data) {
    throw centralSessionError(
      401,
      'Confirme o codigo enviado por email para continuar.',
      'EMAIL_VERIFICATION_REQUIRED',
    )
  }

  return data
}
