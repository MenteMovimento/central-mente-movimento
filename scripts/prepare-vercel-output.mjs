import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const staticSource = path.join(root, 'portal', 'static')
const staticOutput = path.join(publicDir, 'static')
const sociosSource = path.join(root, 'portal', 'modules', 'socios')
const sociosOutput = path.join(publicDir, 'area', 'socios')
const dispositivosDist = path.join(root, 'portal', 'modules', 'dispositivos', 'dist')
const dispositivosOutput = path.join(publicDir, 'area', 'dispositivos')
const supabaseUmd = path.join(
  root,
  'portal',
  'modules',
  'dispositivos',
  'node_modules',
  '@supabase',
  'supabase-js',
  'dist',
  'umd',
  'supabase.js',
)

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ''

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

const jsString = (value) => JSON.stringify(String(value ?? ''))

const moduleCards = `
<article class="module-card module-green" data-module-card="socios">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="id-card"></i></span>
    <span class="status-chip status-online" data-module-status="socios">Integrado</span>
  </div>
  <h2>Socios</h2>
  <p>Base de socios</p>
  <a class="module-action" href="/area/socios/">
    <i data-lucide="arrow-right"></i>
    <span>Entrar na area</span>
  </a>
</article>
<article class="module-card module-blue" data-module-card="utentes">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="heart-handshake"></i></span>
    <span class="status-chip status-online" data-module-status="utentes">Integrado</span>
  </div>
  <h2>Utentes</h2>
  <p>Base de utentes</p>
  <a class="module-action" href="/area/utentes/">
    <i data-lucide="arrow-right"></i>
    <span>Entrar na area</span>
  </a>
</article>
<article class="module-card module-amber" data-module-card="dispositivos">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="monitor-cog"></i></span>
    <span class="status-chip status-online" data-module-status="dispositivos">Integrado</span>
  </div>
  <h2>Dispositivos</h2>
  <p>Base de dispositivos</p>
  <a class="module-action" href="/area/dispositivos/">
    <i data-lucide="arrow-right"></i>
    <span>Entrar na area</span>
  </a>
</article>`

const topbar = (activeId = '') => `
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand-block brand-link" href="/dashboard">
      <span class="brand-symbol brand-logo" aria-hidden="true">
        <img src="/static/mente-movimento-logo.png" alt="" />
      </span>
      <div>
        <h1>Central MenteMovimento</h1>
        <p data-user-email>Administrador</p>
      </div>
    </a>
    <nav class="topnav" aria-label="Areas principais">
      <a class="topnav-link${activeId === 'socios' ? ' active' : ''}" href="/area/socios/">
        <i data-lucide="id-card"></i>
        <span>Socios</span>
      </a>
      <a class="topnav-link${activeId === 'utentes' ? ' active' : ''}" href="/area/utentes/">
        <i data-lucide="heart-handshake"></i>
        <span>Utentes</span>
      </a>
      <a class="topnav-link${activeId === 'dispositivos' ? ' active' : ''}" href="/area/dispositivos/">
        <i data-lucide="monitor-cog"></i>
        <span>Dispositivos</span>
      </a>
    </nav>
    <div class="global-actions" aria-label="Ferramentas globais">
      <details class="global-menu-wrap">
        <summary class="icon-link menu-trigger" title="Abrir menu" aria-label="Abrir menu">
          <i data-lucide="menu"></i>
        </summary>
        <div class="global-tools-menu" role="menu">
          <a class="menu-item" href="/historico" role="menuitem">
            <i data-lucide="history"></i>
            <span>Historico geral</span>
          </a>
          <a class="menu-item" href="/utilizadores" role="menuitem">
            <i data-lucide="users-round"></i>
            <span>Utilizadores</span>
          </a>
          <a class="menu-item" href="/manuais" role="menuitem">
            <i data-lucide="book-open"></i>
            <span>Manuais</span>
          </a>
          <button class="menu-item" type="button" data-language-toggle role="menuitem">
            <i data-lucide="languages"></i>
            <span>Idioma</span>
          </button>
          <button class="menu-item" type="button" data-theme-toggle role="menuitem">
            <i data-lucide="moon"></i>
            <span>Tema escuro</span>
          </button>
        </div>
      </details>
      <a class="icon-link" href="/logout" title="Terminar sessao" aria-label="Terminar sessao">
        <i data-lucide="log-out"></i>
      </a>
    </div>
  </div>
</header>`

const pageShell = ({ title, body, page }) => `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${title}</title>
    <link rel="stylesheet" href="/static/styles.css" />
    <script src="/static/vendor/lucide.min.js" defer></script>
    <script src="/static/vendor/supabase.js" defer></script>
    <script src="/static/central-config.js" defer></script>
    <script src="/static/app.js" defer></script>
    <script src="/static/central-auth.js" defer></script>
  </head>
  <body data-central-page="${page}">
    ${body}
  </body>
</html>`

const loginPage = pageShell({
  title: 'Central MenteMovimento',
  page: 'login',
  body: `
<main class="login-shell">
  <section class="login-panel" aria-labelledby="loginTitle">
    <div class="brand-line">
      <span class="brand-symbol" aria-hidden="true"><i data-lucide="shield-check"></i></span>
      <span>Central MenteMovimento</span>
    </div>
    <h1 id="loginTitle">Entrar</h1>
    <p class="login-copy">Acesso reservado a gestao da associacao.</p>
    <form class="login-form" id="centralLoginForm">
      <label class="field" for="email">
        <span>Email</span>
        <input id="email" name="email" type="email" autocomplete="email" required />
      </label>
      <label class="field" for="password">
        <span>Password</span>
        <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      </label>
      <p class="form-error" id="centralAuthError" role="alert" hidden></p>
      <button class="primary-button" type="submit">
        <i data-lucide="log-in"></i>
        <span>Entrar</span>
      </button>
    </form>
  </section>
</main>`,
}).replace('<body data-central-page="login">', '<body class="login-page" data-central-page="login">')

const dashboardPage = pageShell({
  title: 'Central MenteMovimento',
  page: 'dashboard',
  body: `
${topbar()}
<main class="dashboard">
  <section class="dashboard-heading" aria-labelledby="dashboardTitle">
    <div>
      <p class="eyebrow">Gestao da associacao</p>
      <h2 id="dashboardTitle">Escolhe a area de trabalho</h2>
    </div>
    <span class="session-chip">
      <i data-lucide="key-round"></i>
      <span>Sessao unica</span>
    </span>
  </section>
  <section class="module-grid" aria-label="Aplicacoes disponiveis">
    ${moduleCards}
  </section>
</main>`,
})

const logoutPage = pageShell({
  title: 'A sair - Central MenteMovimento',
  page: 'logout',
  body: '<main class="login-shell"><section class="login-panel"><h1>A terminar sessao...</h1><p class="login-copy">Aguarde um momento.</p></section></main>',
}).replace('<body data-central-page="logout">', '<body class="login-page" data-central-page="logout">')

const globalPage = ({ file, title, icon, eyebrow, copy, items }) => ({
  file,
  html: pageShell({
    title: `${title} - Central MenteMovimento`,
    page: 'dashboard',
    body: `
${topbar()}
<main class="global-shell">
  <section class="global-panel">
    <p class="eyebrow">${eyebrow}</p>
    <i data-lucide="${icon}"></i>
    <h2>${title}</h2>
    <p class="global-copy">${copy}</p>
    <div class="global-grid">
      ${items
        .map(
          ([itemTitle, itemCopy]) => `
      <article class="global-item">
        <strong>${itemTitle}</strong>
        <p>${itemCopy}</p>
      </article>`,
        )
        .join('')}
    </div>
  </section>
</main>`,
  }),
})

await rm(publicDir, { recursive: true, force: true })
await mkdir(publicDir, { recursive: true })

await cp(staticSource, staticOutput, { recursive: true })
await mkdir(path.join(staticOutput, 'vendor'), { recursive: true })
await cp(supabaseUmd, path.join(staticOutput, 'vendor', 'supabase.js'))

await writeFile(
  path.join(staticOutput, 'central-config.js'),
  `window.CENTRAL_CONFIG = {
  supabaseUrl: ${jsString(supabaseUrl)},
  supabaseAnonKey: ${jsString(supabaseAnonKey)}
};
`,
)

await writeFile(
  path.join(staticOutput, 'central-auth.js'),
  `(() => {
  const config = window.CENTRAL_CONFIG || {};
  const page = document.body?.dataset.centralPage || "dashboard";
  const safePath = (value, fallback) => {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\\\")) return fallback;
    return value;
  };
  const nextPath = () => safePath(new URLSearchParams(window.location.search).get("next"), "/dashboard");
  const showError = (message) => {
    const error = document.querySelector("#centralAuthError");
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  };
  const setUserEmail = (session) => {
    document.querySelectorAll("[data-user-email]").forEach((node) => {
      node.textContent = session?.user?.user_metadata?.full_name || session?.user?.email || "Administrador";
    });
  };
  const createClient = () => {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
      showError("Falta configurar o Supabase na Vercel.");
      return null;
    }
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  };
  document.addEventListener("DOMContentLoaded", async () => {
    const client = createClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const session = data?.session || null;
    if (page === "logout") {
      await client.auth.signOut();
      window.location.replace("/login?next=" + encodeURIComponent(nextPath()));
      return;
    }
    if (page === "login") {
      if (session) {
        window.location.replace(nextPath());
        return;
      }
      document.querySelector("#centralLoginForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const submit = event.currentTarget.querySelector("button[type='submit']");
        submit.disabled = true;
        showError("");
        document.querySelector("#centralAuthError").hidden = true;
        const { error } = await client.auth.signInWithPassword({ email, password });
        submit.disabled = false;
        if (error) {
          showError("Credenciais invalidas ou utilizador sem acesso.");
          return;
        }
        window.location.replace(nextPath());
      });
      return;
    }
    if (!session) {
      window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setUserEmail(session);
  });
})();`,
)

await writeFile(path.join(publicDir, 'login.html'), loginPage)
await writeFile(path.join(publicDir, 'logout.html'), logoutPage)
await writeFile(path.join(publicDir, 'index.html'), dashboardPage)
for (const page of [
  globalPage({
    file: 'historico.html',
    title: 'Historico geral',
    icon: 'history',
    eyebrow: 'Ferramenta global',
    copy: 'Registo comum de alteracoes feitas nos ramos de socios, utentes e dispositivos.',
    items: [
      ['Socios', 'Alteracoes em fichas e quotas.'],
      ['Utentes', 'Alteracoes em fichas, separadores e anexos.'],
      ['Dispositivos', 'Alteracoes em listagens, reparacoes, estados, anexos e CSV.'],
    ],
  }),
  globalPage({
    file: 'utilizadores.html',
    title: 'Utilizadores e permissoes',
    icon: 'users-round',
    eyebrow: 'Ferramenta global',
    copy: 'Gestao unica de administradores, utilizadores e acessos a cada ramo.',
    items: [
      ['Administrador', 'Acesso total a central.'],
      ['Gestor de ramo', 'Acesso limitado a socios, utentes ou dispositivos.'],
      ['Consulta', 'Acesso so de leitura quando necessario.'],
    ],
  }),
  globalPage({
    file: 'manuais.html',
    title: 'Manuais',
    icon: 'book-open',
    eyebrow: 'Ferramenta global',
    copy: 'Area comum para consultar os manuais dos tres ramos e os manuais tecnicos.',
    items: [
      ['Manual de socios', 'Quotas, exportacoes e gestao de socios.'],
      ['Manual de utentes', 'Fichas, separadores, anexos PDF, genograma e ecomapa.'],
      ['Manual de dispositivos', 'Reparacoes, estados, estatisticas, anexos e CSV.'],
    ],
  }),
]) {
  await writeFile(path.join(publicDir, page.file), page.html)
}

await cp(sociosSource, sociosOutput, {
  recursive: true,
  filter: (source) => {
    const name = path.basename(source)
    return !['api', 'supabase', 'vercel.json'].includes(name)
  },
})

const sociosIndexPath = path.join(sociosOutput, 'index.html')
let sociosIndex = await readFile(sociosIndexPath, 'utf8')
sociosIndex = sociosIndex
  .replace(/\s*<script src="central-socios-client\.js" defer><\/script>/, '')
  .replace('<script src="app.js" defer></script>', '<script src="/static/vendor/supabase.js" defer></script>\n    <script src="config.js" defer></script>\n    <script src="app.js" defer></script>')
await writeFile(sociosIndexPath, sociosIndex)
await rm(path.join(sociosOutput, 'central-socios-client.js'), { force: true })

await writeFile(
  path.join(sociosOutput, 'config.js'),
  `window.SOCIOS_CONFIG = {
  supabaseUrl: ${jsString(supabaseUrl)},
  supabaseAnonKey: ${jsString(supabaseAnonKey)},
  captchaProvider: "",
  captchaSiteKey: "",
  organizationName: "Central MenteMovimento",
};
`,
)

if (!existsSync(dispositivosDist)) {
  throw new Error('A build de Dispositivos nao gerou a pasta dist.')
}

await cp(dispositivosDist, dispositivosOutput, { recursive: true })

await writeFile(
  path.join(publicDir, '404.html'),
  `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagina nao encontrada</title></head><body><main style="font-family:system-ui,sans-serif;max-width:680px;margin:80px auto;padding:24px"><h1>Pagina nao encontrada</h1><p><a href="/">Voltar a Central</a></p></main></body></html>`,
)

console.log('Output de producao criado em public/.')
