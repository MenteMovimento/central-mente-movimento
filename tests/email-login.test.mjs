import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertVerifiedCentralSession,
  getAuthenticationMethods,
  getSessionIdFromToken,
  isEmailOtpSession,
} from '../api-lib/central-session.js'

const directory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(directory, '..')
const publicRoot = path.join(projectRoot, 'public')
const require = createRequire(import.meta.url)

const jwt = (payload) =>
  ['eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'test'].join('.')

const passwordToken = jwt({
  sub: '11111111-1111-4111-8111-111111111111',
  session_id: 'password-session',
  amr: [{ method: 'password', timestamp: 1 }],
})
const otpToken = jwt({
  sub: '11111111-1111-4111-8111-111111111111',
  session_id: 'otp-session',
  amr: [{ method: 'otp', timestamp: 2 }],
})

test('recognizes only an OTP session as the email-code session', () => {
  assert.equal(getSessionIdFromToken(otpToken), 'otp-session')
  assert.deepEqual(getAuthenticationMethods(passwordToken), ['password'])
  assert.equal(isEmailOtpSession(passwordToken), false)
  assert.equal(isEmailOtpSession(jwt({ amr: [{ method: 'magiclink' }] })), false)
  assert.equal(isEmailOtpSession(otpToken), true)
})

const verificationAdmin = (result) => ({
  from(table) {
    assert.equal(table, 'central_verified_sessions')
    return {
      select() {
        return this
      },
      eq() {
        return this
      },
      gt() {
        return this
      },
      async maybeSingle() {
        return result
      },
    }
  },
})

test('requires a server-side verified-session record', async () => {
  await assert.rejects(
    assertVerifiedCentralSession(verificationAdmin({ data: null, error: null }), passwordToken),
    (error) => error.status === 401 && error.code === 'EMAIL_VERIFICATION_REQUIRED',
  )

  const verified = await assertVerifiedCentralSession(
    verificationAdmin({
      data: {
        session_id: 'otp-session',
        user_id: '11111111-1111-4111-8111-111111111111',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    }),
    otpToken,
  )
  assert.equal(verified.session_id, 'otp-session')
})

test('fails closed while the verification migration is missing', async () => {
  await assert.rejects(
    assertVerifiedCentralSession(
      verificationAdmin({
        data: null,
        error: { code: 'PGRST205', message: "Could not find 'central_verified_sessions'" },
      }),
      otpToken,
    ),
    (error) => error.status === 503 && error.code === 'EMAIL_VERIFICATION_NOT_CONFIGURED',
  )
})

test('email template exposes the numeric token without broken characters', async () => {
  const template = await readFile(
    path.join(projectRoot, 'supabase', 'email-code-template.html'),
    'utf8',
  )
  assert.match(template, /\{\{ \.Token \}\}/)
  assert.doesNotMatch(template, /Ã|Â|�/)
  assert.match(template, /C&oacute;digo de verifica&ccedil;&atilde;o/)
})

test('deployment stays within the Vercel Hobby function limit', async () => {
  const apiFiles = (await readdir(path.join(projectRoot, 'api'))).filter((name) => /\.(?:js|py)$/.test(name))
  assert.ok(apiFiles.length <= 12, `Expected at most 12 functions, found ${apiFiles.length}: ${apiFiles.join(', ')}`)
  assert.equal(apiFiles.includes('create-user.js'), false)
  assert.equal(apiFiles.includes('delete-user.js'), false)

  const sociosApp = await readFile(path.join(projectRoot, 'portal', 'modules', 'socios', 'app.js'), 'utf8')
  assert.match(sociosApp, /fetch\("\/api\/central-users"/)
  assert.doesNotMatch(sociosApp, /fetch\("\/api\/(?:create-user|delete-user)"/)
})

const contentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.html') return 'text/html; charset=utf-8'
  if (extension === '.js') return 'application/javascript; charset=utf-8'
  if (extension === '.css') return 'text/css; charset=utf-8'
  if (extension === '.png') return 'image/png'
  return 'application/octet-stream'
}

const readRequestJson = async (request) => {
  const chunks = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const fakeSupabaseScript = `(() => {
  const storageKey = "email-login-test-session";
  const encodedPayload = ${JSON.stringify(otpToken)};
  const loadSession = () => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || "null"); }
    catch (_error) { return null; }
  };
  window.supabase = {
    createClient() {
      return {
        auth: {
          async getSession() { return { data: { session: loadSession() }, error: null }; },
          async signOut() { sessionStorage.removeItem(storageKey); return { error: null }; },
          async verifyOtp({ email, token }) {
            if (token !== "123456") return { data: {}, error: new Error("Invalid token") };
            const session = {
              access_token: encodedPayload,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              user: {
                id: "11111111-1111-4111-8111-111111111111",
                email,
                user_metadata: { full_name: "Utilizador de Teste" }
              }
            };
            sessionStorage.setItem(storageKey, JSON.stringify(session));
            return { data: { session, user: session.user }, error: null };
          }
        }
      };
    }
  };
})();`

const createLoginTestServer = async () => {
  const requests = { start: 0, resend: 0, complete: 0, ensure: 0 }
  const challengeId = '22222222-2222-4222-8222-222222222222'
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const json = (status, payload) => {
      response.writeHead(status, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify(payload))
    }

    if (url.pathname === '/api/email-verification-start' && request.method === 'POST') {
      const body = await readRequestJson(request)
      if (body.challengeId) {
        requests.resend += 1
        assert.equal(body.challengeId, challengeId)
      } else {
        requests.start += 1
        assert.equal(body.email, 'teste@example.com')
        assert.equal(body.password, 'Password!123')
      }
      json(200, {
        ok: true,
        challengeId,
        email: 'teste@example.com',
        expiresAt,
        resendAfter: 1,
      })
      return
    }

    if (url.pathname === '/api/email-verification-complete' && request.method === 'POST') {
      const body = await readRequestJson(request)
      requests.complete += 1
      assert.equal(body.challengeId, challengeId)
      assert.equal(request.headers.authorization, `Bearer ${otpToken}`)
      json(200, { ok: true, expiresAt: new Date(Date.now() + 12 * 60 * 60_000).toISOString() })
      return
    }

    if (url.pathname === '/api/ensure-access' && request.method === 'POST') {
      requests.ensure += 1
      json(200, {
        ok: true,
        appUser: {
          id: '11111111-1111-4111-8111-111111111111',
          full_name: 'Utilizador de Teste',
          active: true,
          permissions: {
            central: { manage_users: true, view_history: true },
            socios: { view: true, edit: true, export: true },
            utentes: { view: true, edit: true, view_sensitive: true, edit_sensitive: true, export: true },
            dispositivos: { view: true, edit: true, export: true },
            atividades: { view: true, edit: true, view_sensitive: true, export: true },
          },
        },
      })
      return
    }

    if (url.pathname === '/static/central-config.js') {
      response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
      response.end('window.CENTRAL_CONFIG={supabaseUrl:"https://example.supabase.co",supabaseAnonKey:"test-anon-key"};')
      return
    }

    if (url.pathname === '/static/vendor/supabase.js') {
      response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
      response.end(fakeSupabaseScript)
      return
    }

    const rewrites = {
      '/': 'index.html',
      '/dashboard': 'index.html',
      '/login': 'login.html',
    }
    const relativePath = rewrites[url.pathname] ?? url.pathname.replace(/^\/+/, '')
    const filePath = path.resolve(publicRoot, relativePath)
    if (!filePath.startsWith(publicRoot + path.sep)) {
      response.writeHead(403)
      response.end()
      return
    }
    try {
      const file = await readFile(filePath)
      response.writeHead(200, { 'Content-Type': contentType(filePath) })
      response.end(file)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
    requests,
  }
}

let chromium = null
try {
  ;({ chromium } = require('playwright'))
} catch {
  // The browser test is skipped on machines without Playwright.
}

const browserExecutable = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((candidate) => candidate && existsSync(candidate))

for (const device of [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test(`email-code login completes in a ${device.name} browser`, { skip: !chromium }, async () => {
    const testServer = await createLoginTestServer()
    let browser = null
    let context = null
    try {
      browser = await chromium.launch({
        headless: true,
        ...(browserExecutable ? { executablePath: browserExecutable } : {}),
      })
      context = await browser.newContext({ viewport: device.viewport })
      const page = await context.newPage()
      await page.goto(`${testServer.baseUrl}/login`)
      await page.locator('#email').fill('teste@example.com')
      await page.locator('#password').fill('Password!123')
      await page.locator('#centralLoginForm button[type="submit"]').click()
      await page.locator('#centralVerificationStep').waitFor({ state: 'visible' })

      assert.equal(await page.locator('#password').inputValue(), '')
      const savedState = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('central-email-verification-state') || '{}'),
      )
      assert.equal(savedState.email, 'teste@example.com')
      assert.equal(Object.hasOwn(savedState, 'password'), false)

      await page.locator('#centralResendCode').waitFor({ state: 'visible' })
      await page.waitForFunction(() => !document.querySelector('#centralResendCode')?.disabled)
      await page.locator('#centralResendCode').click()
      await page.locator('#centralVerificationStatus').waitFor({ state: 'visible' })
      assert.equal(testServer.requests.resend, 1)

      await page.locator('#verificationCode').fill('ab12cd34')
      assert.equal(await page.locator('#verificationCode').inputValue(), '1234')

      await page.locator('#verificationCode').fill('000000')
      await page.locator('#centralVerificationForm button[type="submit"]').click()
      await page.locator('#centralAuthError').waitFor({ state: 'visible' })
      assert.match(await page.locator('#centralAuthError').innerText(), /inv[aá]lido|invalid/i)

      await page.locator('#verificationCode').fill('123456')
      await page.locator('#centralVerificationForm button[type="submit"]').click()
      await page.waitForURL(`${testServer.baseUrl}/dashboard`)
      await page.locator('[data-module-card="socios"]').waitFor({ state: 'visible' })

      assert.equal(testServer.requests.start, 1)
      assert.equal(testServer.requests.complete, 1)
      assert.ok(testServer.requests.ensure >= 1)
    } finally {
      await context?.close()
      await browser?.close()
      await testServer.close()
    }
  })
}
