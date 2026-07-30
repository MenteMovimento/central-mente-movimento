const DEFAULT_MAX_JSON_BYTES = 4 * 1024 * 1024

const httpError = (status, message) => {
  const error = new Error(message)
  error.status = status
  error.expose = true
  return error
}

const assertBodySize = (size, maximum) => {
  if (size > maximum) throw httpError(413, 'O pedido excede o tamanho permitido.')
}

const parseJson = (rawBody) => {
  if (!rawBody) return {}
  try {
    return JSON.parse(rawBody)
  } catch {
    throw httpError(400, 'O corpo JSON do pedido e invalido.')
  }
}

export const readJsonBody = async (request, maximum = DEFAULT_MAX_JSON_BYTES) => {
  const declaredLength = Number(request.headers?.['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > 0) {
    assertBodySize(declaredLength, maximum)
  }

  if (Buffer.isBuffer(request.body)) {
    assertBodySize(request.body.length, maximum)
    return parseJson(request.body.toString('utf8'))
  }

  if (request.body && typeof request.body === 'object') {
    assertBodySize(Buffer.byteLength(JSON.stringify(request.body), 'utf8'), maximum)
    return request.body
  }

  if (typeof request.body === 'string') {
    assertBodySize(Buffer.byteLength(request.body, 'utf8'), maximum)
    return parseJson(request.body)
  }

  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    assertBodySize(totalBytes, maximum)
    chunks.push(buffer)
  }
  const rawBody = Buffer.concat(chunks).toString('utf8')
  return parseJson(rawBody)
}

export const exposedErrorMessage = (error, fallback) => {
  const status = Number(error?.status)
  const isLocalClientError =
    error instanceof Error && error.constructor === Error && status >= 400 && status < 500
  if (error?.expose || isLocalClientError) {
    return error instanceof Error && error.message ? error.message : fallback
  }
  return fallback
}
