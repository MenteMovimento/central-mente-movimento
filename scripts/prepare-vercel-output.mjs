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
    <span class="status-chip status-online" data-module-status="socios" data-status-kind="integrated">Integrado</span>
  </div>
  <h2 data-i18n="module.socios.title">Sócios</h2>
  <p data-i18n="module.socios.detail">Base de sócios</p>
  <a class="module-action" href="/area/socios/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar na área</span>
  </a>
</article>
<article class="module-card module-blue" data-module-card="utentes">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="heart-handshake"></i></span>
    <span class="status-chip status-online" data-module-status="utentes" data-status-kind="integrated">Integrado</span>
  </div>
  <h2 data-i18n="module.utentes.title">Utentes</h2>
  <p data-i18n="module.utentes.detail">Base de utentes</p>
  <a class="module-action" href="/area/utentes/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar na área</span>
  </a>
</article>
<article class="module-card module-amber" data-module-card="dispositivos">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="monitor-cog"></i></span>
    <span class="status-chip status-online" data-module-status="dispositivos" data-status-kind="integrated">Integrado</span>
  </div>
  <h2 data-i18n="module.dispositivos.title">Dispositivos</h2>
  <p data-i18n="module.dispositivos.detail">Base de dispositivos</p>
  <a class="module-action" href="/area/dispositivos/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar na área</span>
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
    <nav class="topnav" aria-label="Áreas principais" data-i18n-aria-label="nav.areas">
      <a class="topnav-link${activeId === 'socios' ? ' active' : ''}" href="/area/socios/">
        <i data-lucide="id-card"></i>
        <span data-i18n="nav.socios">Sócios</span>
      </a>
      <a class="topnav-link${activeId === 'utentes' ? ' active' : ''}" href="/area/utentes/">
        <i data-lucide="heart-handshake"></i>
        <span data-i18n="nav.utentes">Utentes</span>
      </a>
      <a class="topnav-link${activeId === 'dispositivos' ? ' active' : ''}" href="/area/dispositivos/">
        <i data-lucide="monitor-cog"></i>
        <span data-i18n="nav.dispositivos">Dispositivos</span>
      </a>
    </nav>
    <div class="global-actions" aria-label="Ferramentas globais" data-i18n-aria-label="nav.tools">
      <details class="global-menu-wrap">
        <summary class="icon-link menu-trigger" title="Abrir menu" aria-label="Abrir menu" data-i18n-title="nav.openMenu" data-i18n-aria-label="nav.openMenu">
          <i data-lucide="menu"></i>
        </summary>
        <div class="global-tools-menu" role="menu">
          <a class="menu-item" href="/utilizadores" role="menuitem">
            <i data-lucide="users-round"></i>
            <span data-i18n="menu.users">Utilizadores</span>
          </a>
          <a class="menu-item" href="/historico" role="menuitem">
            <i data-lucide="history"></i>
            <span data-i18n="menu.history">Histórico</span>
          </a>
          <a class="menu-item" href="/manuais" role="menuitem">
            <i data-lucide="book-open"></i>
            <span data-i18n="menu.manuals">Manuais</span>
          </a>
          <button class="menu-item" type="button" data-language-toggle role="menuitem">
            <i data-lucide="languages"></i>
            <span data-i18n="menu.language">Idioma</span>
          </button>
          <button class="menu-item" type="button" data-theme-toggle role="menuitem">
            <i data-lucide="moon"></i>
            <span data-i18n="menu.dark">Tema escuro</span>
          </button>
        </div>
      </details>
      <a class="icon-link" href="/logout" title="Terminar sessão" aria-label="Terminar sessão" data-i18n-title="nav.logout" data-i18n-aria-label="nav.logout">
        <i data-lucide="log-out"></i>
      </a>
    </div>
  </div>
</header>`

const pageShell = ({ title, body, page, titleKey = '' }) => `<!doctype html>
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
  <body data-central-page="${page}"${titleKey ? ` data-title-key="${titleKey}"` : ''}>
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
      <span data-i18n="app.title">Central MenteMovimento</span>
    </div>
    <h1 id="loginTitle" data-i18n="login.title">Entrar</h1>
    <p class="login-copy" data-i18n="login.copy">Acesso reservado à gestão da associação.</p>
    <form class="login-form" id="centralLoginForm">
      <label class="field" for="email">
        <span data-i18n="login.email">Email</span>
        <input id="email" name="email" type="email" autocomplete="email" required />
      </label>
      <label class="field" for="password">
        <span data-i18n="login.password">Password</span>
        <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      </label>
      <p class="form-error" id="centralAuthError" role="alert" hidden></p>
      <button class="primary-button" type="submit">
        <i data-lucide="log-in"></i>
        <span data-i18n="login.submit">Entrar</span>
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
      <p class="eyebrow" data-i18n="dashboard.eyebrow">Gestão da associação</p>
      <h2 id="dashboardTitle" data-i18n="dashboard.title">Escolhe a área de trabalho</h2>
    </div>
    <span class="session-chip">
      <i data-lucide="key-round"></i>
      <span data-i18n="dashboard.session">Sessão única</span>
    </span>
  </section>
  <section class="module-grid" aria-label="Aplicações disponíveis" data-i18n-aria-label="dashboard.available">
    ${moduleCards}
  </section>
</main>`,
})

const logoutPage = pageShell({
  title: 'A sair - Central MenteMovimento',
  page: 'logout',
  body: '<main class="login-shell"><section class="login-panel"><h1>A terminar sessão...</h1><p class="login-copy">Aguarde um momento.</p></section></main>',
}).replace('<body data-central-page="logout">', '<body class="login-page" data-central-page="logout">')

const globalPage = ({ file, key, title, icon, copy, items }) => ({
  file,
  html: pageShell({
    title: `${title} - Central MenteMovimento`,
    page: 'dashboard',
    titleKey: `${key}.title`,
    body: `
${topbar()}
<main class="global-shell">
  <section class="global-panel">
    <p class="eyebrow" data-i18n="global.eyebrow">Ferramenta global</p>
    <i data-lucide="${icon}"></i>
    <h2 data-i18n="${key}.title">${title}</h2>
    <p class="global-copy" data-i18n="${key}.copy">${copy}</p>
    <div class="global-grid">
      ${items
        .map(
          ([itemKey, itemTitle, itemCopy]) => `
      <article class="global-item">
        <strong data-i18n="${key}.${itemKey}.title">${itemTitle}</strong>
        <p data-i18n="${key}.${itemKey}.copy">${itemCopy}</p>
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
  const authStorageKey = "central-mm-auth-token";
  const authStorage = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key)
  };
  const clearPersistentAuth = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => /^sb-.*-auth-token$/.test(key) || key === "supabase.auth.token")
        .forEach((key) => localStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia localStorage.
    }
  };
  const stripSensitiveLoginParams = () => {
    if (page !== "login") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("email") && !url.searchParams.has("password")) return;
    url.searchParams.delete("email");
    url.searchParams.delete("password");
    const query = url.searchParams.toString();
    window.history.replaceState(null, "", url.pathname + (query ? \`?\${query}\` : "") + url.hash);
  };
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
  const cacheKey = (session) => \`central-access:\${session?.user?.id || "anon"}\`;
  const hasAccessCache = (session) => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(session)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveAccessCache = (session) => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const expiresAt = authExpiresAt > 0 ? Math.min(authExpiresAt, shortCacheExpiresAt) : shortCacheExpiresAt;
      sessionStorage.setItem(cacheKey(session), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // Sessão continua válida mesmo se o browser bloquear sessionStorage.
    }
  };
  const createClient = () => {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
      showError("Falta configurar o Supabase na Vercel.");
      return null;
    }
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: authStorageKey,
        storage: authStorage
      }
    });
  };
  let accessPromise = null;
  const ensureCentralAccess = async (client) => {
    if (!accessPromise) {
      accessPromise = (async () => {
        const { data } = await client.auth.getSession();
        const session = data?.session || null;
        if (hasAccessCache(session)) return { ok: true };
        const token = session?.access_token || "";
        if (!token) throw new Error("Sessão em falta.");
        const response = await fetch("/api/ensure-access", {
          method: "POST",
          headers: { Authorization: \`Bearer \${token}\` }
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Não foi possível preparar o acesso.");
        }
        const payload = await response.json().catch(() => ({ ok: true }));
        saveAccessCache(session);
        return payload;
      })();
    }
    try {
      return await accessPromise;
    } catch (error) {
      accessPromise = null;
      throw error;
    }
  };
  const ensureUtentesSession = async (client) => {
    const { data } = await client.auth.getSession();
    const token = data?.session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    const response = await fetch("/api/utentes-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Não foi possível iniciar Utentes.");
    }
  };
  const goTo = async (client, target) => {
    const path = safePath(target, "/dashboard");
    await ensureCentralAccess(client);
    if (path.startsWith("/area/utentes")) {
      await ensureUtentesSession(client);
    }
    window.location.replace(path);
  };
  const wireUtentesLinks = (client) => {
    document.querySelectorAll('a[href^="/area/utentes"]').forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await goTo(client, link.getAttribute("href") || "/area/utentes/");
        } catch (error) {
          window.location.href = "/login?next=" + encodeURIComponent(link.getAttribute("href") || "/area/utentes/");
        }
      });
    });
  };
  document.addEventListener("DOMContentLoaded", async () => {
    stripSensitiveLoginParams();
    clearPersistentAuth();
    const client = createClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const session = data?.session || null;
    if (page === "logout") {
      await fetch("/api/utentes-session", { method: "DELETE", credentials: "same-origin" }).catch(() => {});
      await client.auth.signOut();
      try {
        sessionStorage.removeItem(authStorageKey);
      } catch (_error) {
        // Logout continua mesmo sem acesso a sessionStorage.
      }
      clearPersistentAuth();
      window.location.replace("/login?next=" + encodeURIComponent(nextPath()));
      return;
    }
    if (page === "login") {
      if (session) {
        await goTo(client, nextPath()).catch((error) => {
          showError(error instanceof Error ? error.message : "Não foi possível iniciar Utentes.");
        });
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
          showError("Credenciais inválidas ou utilizador sem acesso.");
          return;
        }
        try {
          await goTo(client, nextPath());
        } catch (error) {
          showError(error instanceof Error ? error.message : "Não foi possível iniciar Utentes.");
        }
      });
      return;
    }
    if (!session) {
      window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    try {
      await ensureCentralAccess(client);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Não foi possível preparar o acesso.");
    }
    setUserEmail(session);
    wireUtentesLinks(client);
  });
})();`,
)

await writeFile(
  path.join(staticOutput, 'central-module-auth.js'),
  `(() => {
  const showPage = () => {
    document.documentElement.removeAttribute("data-central-auth-pending");
  };
  const authStorageKey = "central-mm-auth-token";
  const authStorage = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key)
  };
  const clearPersistentAuth = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => /^sb-.*-auth-token$/.test(key) || key === "supabase.auth.token")
        .forEach((key) => localStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia localStorage.
    }
  };
  const safePath = () => {
    const path = window.location.pathname + window.location.search + window.location.hash;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\\\")) return "/dashboard";
    return path;
  };
  const redirectToCentralLogin = () => {
    window.location.replace("/login?next=" + encodeURIComponent(safePath()));
  };
  const cacheKey = (session) => \`central-access:\${session?.user?.id || "anon"}\`;
  const hasAccessCache = (session) => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(session)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveAccessCache = (session) => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const expiresAt = authExpiresAt > 0 ? Math.min(authExpiresAt, shortCacheExpiresAt) : shortCacheExpiresAt;
      sessionStorage.setItem(cacheKey(session), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // Continua sem cache se o browser bloquear sessionStorage.
    }
  };
  const ensureAccess = async (session) => {
    if (hasAccessCache(session)) return;
    const token = session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    const response = await fetch("/api/ensure-access", {
      method: "POST",
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!response.ok) throw new Error("Sem acesso preparado.");
    saveAccessCache(session);
  };
  const config = window.CENTRAL_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
    redirectToCentralLogin();
    return;
  }
  clearPersistentAuth();
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: authStorageKey,
      storage: authStorage
    }
  });
  client.auth.getSession()
    .then(async ({ data }) => {
      const session = data?.session || null;
      if (!session) {
        redirectToCentralLogin();
        return;
      }
      await ensureAccess(session);
      showPage();
    })
    .catch(() => redirectToCentralLogin());
})();`,
)

await writeFile(path.join(publicDir, 'login.html'), loginPage)
await writeFile(path.join(publicDir, 'logout.html'), logoutPage)
await writeFile(path.join(publicDir, 'index.html'), dashboardPage)
for (const page of [
  globalPage({
    file: 'historico.html',
    key: 'global.history',
    title: 'Histórico geral',
    icon: 'history',
    copy: 'Registo comum de alterações feitas nos ramos de sócios, utentes e dispositivos.',
    items: [
      ['socios', 'Sócios', 'Alterações em fichas e quotas.'],
      ['utentes', 'Utentes', 'Alterações em fichas, separadores e anexos.'],
      ['dispositivos', 'Dispositivos', 'Alterações em listagens, reparações, estados, anexos e CSV.'],
    ],
  }),
  globalPage({
    file: 'utilizadores.html',
    key: 'global.users',
    title: 'Utilizadores e permissões',
    icon: 'users-round',
    copy: 'Gestão única de administradores, utilizadores e acessos a cada ramo.',
    items: [
      ['admin', 'Administrador', 'Acesso total à central.'],
      ['manager', 'Gestor de ramo', 'Acesso limitado a sócios, utentes ou dispositivos.'],
      ['viewer', 'Consulta', 'Acesso só de leitura quando necessário.'],
    ],
  }),
  globalPage({
    file: 'manuais.html',
    key: 'global.manuals',
    title: 'Manuais',
    icon: 'book-open',
    copy: 'Área comum para consultar os manuais dos três ramos e os manuais técnicos.',
    items: [
      ['socios', 'Manual de sócios', 'Quotas, exportações e gestão de sócios.'],
      ['utentes', 'Manual de utentes', 'Fichas, separadores, anexos PDF, genograma e ecomapa.'],
      ['dispositivos', 'Manual de dispositivos', 'Reparações, estados, estatísticas, anexos e CSV.'],
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
  .replace(
    '</title>',
    '</title>\n    <script>document.documentElement.dataset.centralAuthPending = "true";</script>\n    <style>html[data-central-auth-pending="true"] body{visibility:hidden}</style>',
  )
  .replace('<script src="vendor/lucide.min.js" defer></script>', '<script src="/static/vendor/lucide.min.js" defer></script>')
  .replace(/\s*<script src="vendor\/xlsx\.full\.min\.js" defer><\/script>/, '')
  .replace(/\s*<script src="central-socios-client\.js" defer><\/script>/, '')
  .replace('<script src="app.js" defer></script>', '<script src="/static/vendor/supabase.js" defer></script>\n    <script src="/static/central-config.js" defer></script>\n    <script src="config.js" defer></script>\n    <script src="/static/central-module-auth.js" defer></script>\n    <script src="app.js" defer></script>')
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

const dispositivosIndexPath = path.join(dispositivosOutput, 'index.html')
let dispositivosIndex = await readFile(dispositivosIndexPath, 'utf8')
dispositivosIndex = dispositivosIndex
  .replace(
    '</title>',
    '</title>\n    <script>document.documentElement.dataset.centralAuthPending = "true";</script>\n    <style>html[data-central-auth-pending="true"] body{visibility:hidden}</style>',
  )
  .replace(
    '<script type="module"',
    '<script src="/static/vendor/supabase.js" defer></script>\n    <script src="/static/central-config.js" defer></script>\n    <script src="/static/central-module-auth.js" defer></script>\n    <script type="module"',
  )
await writeFile(dispositivosIndexPath, dispositivosIndex)

await writeFile(
  path.join(publicDir, '404.html'),
  `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title></head><body><main style="font-family:system-ui,sans-serif;max-width:680px;margin:80px auto;padding:24px"><h1>Página não encontrada</h1><p><a href="/">Voltar à Central</a></p></main></body></html>`,
)

console.log('Output de produção criado em public/.')
