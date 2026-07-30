import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(directory, '..')
const publicRoot = path.join(projectRoot, 'public')

const dateToIso = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const mondayFor = (source = new Date()) => {
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate())
  const weekday = date.getDay()
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday))
  return date
}

const addDays = (source, days) => {
  const date = new Date(source)
  date.setDate(date.getDate() + days)
  return date
}

const currentMonday = mondayFor()
const currentWeekStart = dateToIso(currentMonday)
const previousWeekStart = dateToIso(addDays(currentMonday, -7))
const scheduleRows = [
  {
    id: 'activity-old-week',
    week_start: previousWeekStart,
    day: 'monday',
    start_time: '09:00:00',
    end_time: '10:00:00',
    title: 'Atividade encerrada',
    teacher: 'Monitor de teste',
    sort_order: 0,
  },
  {
    id: 'activity-current-week',
    week_start: currentWeekStart,
    day: 'monday',
    start_time: '09:00:00',
    end_time: '10:00:00',
    title: 'Atividade atual',
    teacher: 'Monitor de teste',
    sort_order: 0,
  },
]

const summaryForWeek = (weekStart) => {
  const isOld = weekStart === previousWeekStart
  const activityId = isOld ? 'activity-old-week' : 'activity-current-week'
  return {
    id: `summary-${activityId}`,
    activityId,
    activityDate: weekStart,
    title: isOld ? 'Atividade encerrada' : 'Atividade atual',
    start: '09:00',
    end: '10:00',
    durationMinutes: 60,
    summary: isOld ? 'Resumo guardado da semana encerrada.' : 'Resumo da semana atual.',
    attendance: [{ id: 'utente-1', name: 'Utente de teste', missingMinutes: 0 }],
  }
}

const fakeSupabaseScript = `(() => {
  const session = {
    access_token: "activity-summary-browser-test-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: "11111111-1111-4111-8111-111111111111",
      email: "teste@example.com",
      user_metadata: { full_name: "Utilizador de Teste" }
    }
  };
  const scheduleRows = ${JSON.stringify(scheduleRows)};
  const query = (table) => {
    const result = table === "activities_schedule" ? scheduleRows : [];
    return {
      select() { return this; },
      order() { return this; },
      eq() { return this; },
      upsert() { return this; },
      update() { return this; },
      delete() { return this; },
      then(resolve, reject) { return Promise.resolve({ data: result, error: null }).then(resolve, reject); }
    };
  };
  window.supabase = {
    createClient() {
      return {
        auth: {
          async getSession() { return { data: { session }, error: null }; },
          async signOut() { return { error: null }; }
        },
        from(table) { return query(table); }
      };
    }
  };
})();`

const contentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.html') return 'text/html; charset=utf-8'
  if (extension === '.js') return 'application/javascript; charset=utf-8'
  if (extension === '.css') return 'text/css; charset=utf-8'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.pdf') return 'application/pdf'
  return 'application/octet-stream'
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  const json = (status, payload) => {
    response.writeHead(status, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify(payload))
  }

  if (url.pathname === '/api/ensure-access') {
    json(200, {
      ok: true,
      appUser: {
        id: '11111111-1111-4111-8111-111111111111',
        full_name: 'Utilizador de Teste',
        active: true,
        permissions: {
          central: { manage_users: false, view_history: false },
          socios: { view: false, edit: false, export: false },
          utentes: { view: false, edit: false, view_sensitive: false, edit_sensitive: false, export: false },
          dispositivos: { view: false, edit: false, export: false },
          atividades: { view: true, edit: true, view_sensitive: false, export: true },
        },
      },
    })
    return
  }

  if (url.pathname === '/api/activities-options') {
    json(200, url.searchParams.get('kind') === 'monitors'
      ? { items: [{ id: 'monitor-1', name: 'Monitor de teste' }] }
      : { items: [
          { id: 'catalog-old', name: 'Atividade encerrada' },
          { id: 'catalog-current', name: 'Atividade atual' },
        ] })
    return
  }

  if (url.pathname === '/api/activities-summaries') {
    const weekStart = request.method === 'GET'
      ? String(url.searchParams.get('weekStart') || currentWeekStart)
      : ''
    if (request.method === 'GET') {
      json(200, {
        summaries: [summaryForWeek(weekStart)],
        utentes: [{ id: 'utente-1', name: 'Utente de teste' }],
      })
      return
    }
    json(409, { error: 'A gravação não deve ser chamada neste teste.' })
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
    '/area/atividades': 'area/atividades/index.html',
    '/area/atividades/': 'area/atividades/index.html',
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

const port = Number(process.env.PORT || 4179)
server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({
    baseUrl: `http://127.0.0.1:${port}`,
    currentWeekStart,
    previousWeekStart,
  }))
})

const close = () => server.close(() => process.exit(0))
process.on('SIGINT', close)
process.on('SIGTERM', close)
