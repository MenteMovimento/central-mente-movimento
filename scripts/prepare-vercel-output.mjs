import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  atividadesDeveloperManualPageContent,
  atividadesHistoryPageContent,
  atividadesPageContent,
  atividadesUserManualPageContent,
} from '../portal/modules/atividades/page.mjs'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const staticSource = path.join(root, 'portal', 'static')
const staticOutput = path.join(publicDir, 'static')
const sociosSource = path.join(root, 'portal', 'modules', 'socios')
const sociosOutput = path.join(publicDir, 'area', 'socios')
const dispositivosDist = path.join(root, 'portal', 'modules', 'dispositivos', 'dist')
const dispositivosOutput = path.join(publicDir, 'area', 'dispositivos')
const atividadesDocsSource = path.join(root, 'portal', 'modules', 'atividades', 'docs')
const atividadesOutput = path.join(publicDir, 'area', 'atividades')
const initialManualSource = path.join(root, 'portal', 'docs', 'Manual_Inicial_MenteMovimento.pdf')
const pdfMakeBrowser = path.join(root, 'node_modules', 'pdfmake', 'build', 'pdfmake.min.js')
const pdfMakeFonts = path.join(root, 'node_modules', 'pdfmake', 'build', 'vfs_fonts.js')
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
const assetVersion = '20260729-activities-questionnaire-manuals-v1'

const authPendingHead = ({ onlyWithStoredSession = false } = {}) => {
  const waitCondition = onlyWithStoredSession
    ? `(() => {
          try {
            return Boolean(sessionStorage.getItem("central-mm-auth-token"));
          } catch (_error) {
            return false;
          }
        })()`
    : 'true'

  return `<script>
      (() => {
        const shouldWaitForSession = ${waitCondition};
        if (!shouldWaitForSession) return;
        document.documentElement.dataset.centralAuthPending = "true";
        const isStillPending = () => document.documentElement.dataset.centralAuthPending === "true";
        const renderLoading = () => {
          if (!isStillPending()) {
            document.getElementById("centralAuthLoading")?.remove();
            return;
          }
          if (document.getElementById("centralAuthLoading")) return;
          const node = document.createElement("div");
          node.id = "centralAuthLoading";
          node.setAttribute("role", "status");
          node.setAttribute("aria-live", "polite");
          node.textContent = "A validar sessão...";
          document.body.prepend(node);
        };
        if (document.body) {
          renderLoading();
        } else {
          document.addEventListener("DOMContentLoaded", renderLoading, { once: true });
        }
      })();
    </script>
    <style>
      html[data-central-auth-pending="true"] {
        min-height: 100%;
        background: #f4fbf8;
      }

      html[data-central-auth-pending="true"] body {
        visibility: hidden;
      }

      html[data-theme="dark"][data-central-auth-pending="true"] {
        background: #07131f;
      }

      #centralAuthLoading {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        visibility: visible;
        display: grid;
        place-items: center;
        background: #f4fbf8;
        color: #05285a;
        font: 700 22px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      html[data-theme="dark"] #centralAuthLoading {
        background: #07131f;
        color: #dff7f0;
      }
    </style>`
}

const moduleCards = `
<article class="module-card module-green" data-module-card="socios">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="id-card"></i></span>
  </div>
  <h2 data-i18n="module.socios.title">Sócios</h2>
  <a class="module-action" href="/area/socios/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar</span>
  </a>
</article>
<article class="module-card module-blue" data-module-card="utentes">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="heart-handshake"></i></span>
  </div>
  <h2 data-i18n="module.utentes.title">Utentes</h2>
  <a class="module-action" href="/area/utentes/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar</span>
  </a>
</article>
<article class="module-card module-amber" data-module-card="dispositivos">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="monitor-cog"></i></span>
  </div>
  <h2 data-i18n="module.dispositivos.title">Cibersegurança</h2>
  <a class="module-action" href="/area/dispositivos/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar</span>
  </a>
</article>
<article class="module-card module-indigo" data-module-card="atividades">
  <div class="module-topline">
    <span class="module-icon" aria-hidden="true"><i data-lucide="calendar-days"></i></span>
  </div>
  <h2 data-i18n="module.atividades.title">Atividades</h2>
  <a class="module-action" href="/area/atividades/">
    <i data-lucide="arrow-right"></i>
    <span data-i18n="module.enter">Entrar</span>
  </a>
</article>`

const topbarMenu = (activeId = '') =>
  activeId === 'atividades'
    ? `
          <button class="menu-item" type="button" data-activities-catalog-toggle role="menuitem" data-requires-permission-area="atividades" data-requires-permission-action="view_sensitive" data-hide-when-restricted="true">
            <i data-lucide="calendar-days"></i>
            <span data-i18n="nav.atividades">Atividades</span>
          </button>
          <button class="menu-item" type="button" data-activities-monitors-toggle role="menuitem" data-requires-permission-area="atividades" data-requires-permission-action="view_sensitive" data-hide-when-restricted="true">
            <i data-lucide="users-round"></i>
            <span data-i18n="activities.menuMonitors">Monitores</span>
          </button>
          <a class="menu-item" href="/area/atividades/historico/" role="menuitem" data-requires-permission-area="atividades" data-requires-permission-action="view">
            <i data-lucide="history"></i>
            <span data-i18n="menu.history">Hist&oacute;rico</span>
          </a>
          <button class="menu-item" type="button" data-activities-manuals-toggle role="menuitem" data-requires-permission-area="atividades" data-requires-permission-action="view">
            <i data-lucide="book-open"></i>
            <span data-i18n="menu.manuals">Manuais</span>
          </button>`
    : `
          <button class="menu-item" type="button" data-users-toggle role="menuitem">
            <i data-lucide="users-round"></i>
            <span data-i18n="menu.users">Utilizadores</span>
          </button>
          <button class="menu-item" type="button" data-language-toggle role="menuitem">
            <i data-lucide="languages"></i>
            <span data-i18n="menu.language">Idioma</span>
          </button>
          <button class="menu-item" type="button" data-theme-toggle role="menuitem">
            <i data-lucide="moon"></i>
            <span data-i18n="menu.dark">Tema escuro</span>
          </button>`

const atividadesManualsDialog = () => `
<dialog class="activities-manual-dialog" data-activities-manuals-dialog aria-labelledby="activitiesManualTitle">
  <div class="activities-manual-panel">
    <header class="activities-manual-head">
      <div>
        <h2 id="activitiesManualTitle" data-i18n="activities.manualTitle">Manual</h2>
        <p data-i18n="activities.manualSubtitle">Escolha o manual adequado ao que pretende consultar.</p>
      </div>
      <button class="icon-link" type="button" data-activities-manuals-close aria-label="Fechar" data-i18n-aria-label="language.close">
        <i data-lucide="x"></i>
      </button>
    </header>
    <div class="activities-manual-options">
      <a class="activities-manual-option" href="/area/atividades/docs/Manual_Utilizador_Atividades.pdf" target="_blank" rel="noopener" data-requires-permission-area="atividades" data-requires-permission-action="view">
        <span class="activities-manual-icon" aria-hidden="true">
          <i data-lucide="users-round"></i>
        </span>
        <span>
          <strong data-i18n="activities.manualUserTitle">Manual do Utilizador</strong>
          <small data-i18n="activities.manualUserCopy">Para quem usa a app no dia a dia: criar, consultar, organizar e imprimir atividades.</small>
        </span>
      </a>
      <a class="activities-manual-option" href="/area/atividades/docs/Manual_Programador_Atividades.pdf" target="_blank" rel="noopener" data-requires-permission-area="atividades" data-requires-permission-action="view">
        <span class="activities-manual-icon" aria-hidden="true">
          <i data-lucide="code-2"></i>
        </span>
        <span>
          <strong data-i18n="activities.manualDeveloperTitle">Manual do Programador</strong>
          <small data-i18n="activities.manualDeveloperCopy">Para quem mant&eacute;m o m&oacute;dulo: ficheiros, gera&ccedil;&atilde;o, permiss&otilde;es e base de dados.</small>
        </span>
      </a>
    </div>
  </div>
</dialog>`

const atividadesCatalogDialog = () => `
<dialog class="activities-manual-dialog activities-monitors-dialog" data-activities-catalog-dialog aria-labelledby="activitiesCatalogTitle">
  <div class="activities-manual-panel activities-monitors-panel">
    <header class="activities-manual-head">
      <div>
        <h2 id="activitiesCatalogTitle" data-i18n="nav.atividades">Atividades</h2>
        <p data-i18n="activities.catalogSubtitle">Crie e consulte os nomes das atividades usadas no hor&aacute;rio.</p>
      </div>
      <button class="icon-link" type="button" data-activities-catalog-close aria-label="Fechar" data-i18n-aria-label="language.close">
        <i data-lucide="x"></i>
      </button>
    </header>
    <form class="activities-monitor-form" data-activities-catalog-form>
      <label class="activity-field">
        <span data-i18n="activities.name">Nome da atividade</span>
        <input type="text" name="name" autocomplete="off" required />
      </label>
      <button class="primary-button" type="submit">
        <i data-lucide="save"></i>
        <span data-i18n="activities.save">Guardar</span>
      </button>
    </form>
    <p class="form-error activity-error" data-activities-catalog-error role="alert" hidden></p>
    <div class="activities-monitor-list" data-activities-catalog-list>
      <p class="activity-empty-state" data-i18n="activities.catalogEmpty">Sem atividades registadas.</p>
    </div>
  </div>
</dialog>`

const atividadesMonitorsDialog = () => `
<dialog class="activities-manual-dialog activities-monitors-dialog" data-activities-monitors-dialog aria-labelledby="activitiesMonitorsTitle">
  <div class="activities-manual-panel activities-monitors-panel">
    <header class="activities-manual-head">
      <div>
        <h2 id="activitiesMonitorsTitle" data-i18n="activities.menuMonitors">Monitores</h2>
        <p data-i18n="activities.monitorsSubtitle">Crie e consulte os monitores usados nas atividades.</p>
      </div>
      <button class="icon-link" type="button" data-activities-monitors-close aria-label="Fechar" data-i18n-aria-label="language.close">
        <i data-lucide="x"></i>
      </button>
    </header>
    <div class="activities-monitor-toolbar">
      <button class="secondary-button activities-monitor-form-toggle" type="button" data-activities-monitor-form-toggle aria-expanded="false">
        <i data-lucide="plus"></i>
        <span data-activities-monitor-form-toggle-label data-i18n="activities.monitorNew">Novo monitor</span>
      </button>
    </div>
    <form class="activities-monitor-form activities-monitor-form-expanded" data-activities-monitor-form hidden>
      <label class="activity-field">
        <span data-i18n="activities.monitorName">Nome do monitor</span>
        <input type="text" name="name" autocomplete="off" required />
      </label>
      <label class="activity-field">
        <span data-i18n="activities.monitorPhone">Telem&oacute;vel</span>
        <input type="tel" name="phone" autocomplete="off" />
      </label>
      <label class="activity-field">
        <span data-i18n="activities.monitorEmail">Email</span>
        <input type="email" name="email" autocomplete="off" />
      </label>
      <label class="activity-field">
        <span data-i18n="activities.monitorNif">NIF</span>
        <input type="text" name="nif" inputmode="numeric" autocomplete="off" />
      </label>
      <label class="activity-field">
        <span data-i18n="activities.monitorVolunteer">Voluntariado</span>
        <select name="volunteer">
          <option value="false" data-i18n="activities.monitorNo">N&atilde;o</option>
          <option value="true" data-i18n="activities.monitorYes">Sim</option>
        </select>
      </label>
      <label class="activity-field">
        <span data-i18n="activities.monitorProfession">Profiss&atilde;o</span>
        <input type="text" name="profession" autocomplete="off" />
      </label>
      <label class="activity-field activity-field-wide">
        <span data-i18n="activities.monitorDescription">Descri&ccedil;&atilde;o de atividade</span>
        <textarea name="activityDescription" rows="3"></textarea>
      </label>
      <div class="activities-monitor-form-actions">
        <button class="primary-button" type="submit">
          <i data-lucide="save"></i>
          <span data-i18n="activities.save">Guardar</span>
        </button>
        <button class="secondary-button" type="button" data-activities-monitor-form-cancel>
          <i data-lucide="x"></i>
          <span data-i18n="activities.cancel">Cancelar</span>
        </button>
      </div>
    </form>
    <p class="form-error activity-error" data-activities-monitors-error role="alert" hidden></p>
    <section class="activities-monitor-hours-controls" aria-label="Horas dos monitores" data-i18n-aria-label="activities.monitorHoursAria">
      <label class="activity-field">
        <span data-i18n="activities.monitorHours">Horas</span>
        <select data-activities-monitor-hours-period>
          <option value="month" data-i18n="activities.statisticsPeriodMonthly">Mensal</option>
          <option value="year" data-i18n="activities.statisticsPeriodAnnual">Anual</option>
        </select>
      </label>
      <label class="activity-field" data-activities-monitor-hours-month-field>
        <span data-i18n="activities.statisticsMonth">M&ecirc;s</span>
        <select data-activities-monitor-hours-month></select>
      </label>
      <label class="activity-field">
        <span data-i18n="activities.statisticsYear">Ano</span>
        <select data-activities-monitor-hours-year></select>
      </label>
    </section>
    <div class="activities-monitor-list" data-activities-monitor-list>
      <p class="activity-empty-state" data-i18n="activities.monitorEmpty">Sem monitores registados.</p>
    </div>
  </div>
</dialog>`

const dashboardUserMenu = () => `
      <details class="dashboard-user-menu-wrap">
        <summary class="icon-link dashboard-user-trigger" title="Conta" aria-label="Conta">
          <i data-lucide="user-round"></i>
        </summary>
        <div class="dashboard-user-menu" role="menu">
          <strong class="dashboard-account-name" data-dashboard-account-name hidden></strong>
          <a class="dashboard-logout-button" href="/logout" role="menuitem" title="Terminar sessão" aria-label="Terminar sessão" data-i18n-title="nav.logout" data-i18n-aria-label="nav.logout">
            <i data-lucide="log-out"></i>
            <span data-i18n="nav.logout">Terminar sessão</span>
          </a>
        </div>
      </details>`

const topbar = (activeId = '', { showAccountMenu = true } = {}) => `
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand-block brand-link" href="/dashboard">
      <span class="brand-symbol brand-logo" aria-hidden="true">
        <img src="/static/mente-movimento-logo.png" alt="" />
      </span>
      <div>
        <h1>MenteMovimento</h1>
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
        <span data-i18n="nav.dispositivos">Cibersegurança</span>
      </a>
      <a class="topnav-link${activeId === 'atividades' ? ' active' : ''}" href="/area/atividades/">
        <i data-lucide="calendar-days"></i>
        <span data-i18n="nav.atividades">Atividades</span>
      </a>
    </nav>
    <div class="global-actions" aria-label="Ferramentas globais" data-i18n-aria-label="nav.tools">
      <details class="global-menu-wrap">
        <summary class="icon-link menu-trigger" title="Abrir menu" aria-label="Abrir menu" data-i18n-title="nav.openMenu" data-i18n-aria-label="nav.openMenu">
          <i data-lucide="menu"></i>
        </summary>
        <div class="global-tools-menu" role="menu">
${topbarMenu(activeId)}
        </div>
      </details>
      ${showAccountMenu ? dashboardUserMenu() : `<a class="icon-link" href="/logout" title="Terminar sessão" aria-label="Terminar sessão" data-i18n-title="nav.logout" data-i18n-aria-label="nav.logout">
        <i data-lucide="log-out"></i>
      </a>`}
    </div>
  </div>
</header>
${activeId === 'atividades' ? `${atividadesManualsDialog()}${atividadesCatalogDialog()}${atividadesMonitorsDialog()}` : ''}`

const activityNoTimeColumnStyle = `<style>
      .school-timetable .timetable-row {
        grid-template-columns: repeat(5, minmax(165px, 1fr)) !important;
      }

      .school-timetable .timetable-day-head:first-child,
      .school-timetable .timetable-cell:first-child {
        border-left: 0 !important;
      }
    </style>`

const pageShell = ({ title, body, page, titleKey = '', headExtra = '' }) => `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${title}</title>
    <link rel="icon" href="/static/favicon.png?v=1" type="image/png" />
    <link rel="stylesheet" href="/static/styles.css?v=${assetVersion}" />
    ${headExtra}
    <script src="/static/vendor/lucide.min.js" defer></script>
    <script src="/static/vendor/supabase.js" defer></script>
    ${page === 'atividades' ? '<script src="/static/vendor/pdfmake.min.js" defer></script>\n    <script src="/static/vendor/vfs_fonts.js" defer></script>' : ''}
    <script src="/static/central-config.js?v=${assetVersion}" defer></script>
    <script src="/static/app.js?v=${assetVersion}" defer></script>
    <script src="/static/central-auth.js?v=${assetVersion}" defer></script>
  </head>
  <body data-central-page="${page}"${titleKey ? ` data-title-key="${titleKey}"` : ''}>
    ${body}
  </body>
</html>`

const centralUsersDialog = `
<dialog class="central-admin-dialog" id="centralUsersDialog">
  <section class="central-admin-panel" aria-label="Utilizadores">
    <div class="central-admin-head">
      <div>
        <i data-lucide="users"></i>
        <h2 data-i18n="users.title">Utilizadores</h2>
        <p data-i18n="users.subtitle">Crie acessos novos e edite permissões de utilizadores existentes.</p>
      </div>
      <div class="central-admin-actions">
        <button class="secondary-button" id="centralRefreshUsersBtn" type="button">
          <i data-lucide="refresh-cw"></i>
          <span data-i18n="users.refresh">Atualizar</span>
        </button>
        <button class="icon-link" id="centralCloseUsersBtn" type="button" title="Fechar" aria-label="Fechar" data-i18n-title="language.close" data-i18n-aria-label="language.close">
          <i data-lucide="x"></i>
        </button>
      </div>
    </div>

    <div class="central-admin-forms">
      <form class="central-admin-form" id="centralCreateUserForm">
        <div class="form-section-title">
          <i data-lucide="user-plus"></i>
          <h3 data-i18n="users.createTitle">Criar utilizador</h3>
          <p data-i18n="users.createHint">O utilizador é adicionado automaticamente à base de dados da associação.</p>
        </div>
        <label class="field" for="centralCreateUserName">
          <span data-i18n="users.name">Nome</span>
          <input id="centralCreateUserName" name="fullName" type="text" autocomplete="name" required />
        </label>
        <label class="field" for="centralCreateUserEmail">
          <span data-i18n="login.email">Email</span>
          <input id="centralCreateUserEmail" name="email" type="email" autocomplete="email" required />
        </label>
        <label class="field" for="userPassword" style="margin-bottom: 16px;">
          <span>Password</span>
          <div style="position: relative; width: 100%; display: flex; align-items: center;">
            <input id="userPassword" name="password" type="password" autocomplete="new-password" minlength="8" title="A password deve ter pelo menos 8 caracteres, uma letra maiuscula e um caracter especial." required style="width: 100%; padding-right: 42px;" />
            <button type="button" data-password-toggle style="position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #00d293; padding: 0; display: flex; align-items: center; z-index: 2;">
              <i data-lucide="eye">👁️</i>
            </button>
          </div>
        </label>
        <div class="permission-editor" data-permission-grid="create"></div>
        <p class="form-error" id="centralCreateUserError" role="alert" hidden></p>
        <button class="primary-button" type="submit">
          <i data-lucide="user-plus"></i>
          <span data-i18n="users.createButton">Criar utilizador</span>
        </button>
      </form>

      <form class="central-admin-form" id="centralEditUserForm">
        <div class="form-section-title">
          <i data-lucide="user-pen"></i>
          <h3 data-i18n="users.editTitle">Editar utilizador</h3>
          <p id="centralEditingUserHint" data-i18n="users.editHint">Escolha um utilizador na lista para editar.</p>
        </div>
        <input id="centralEditUserId" name="id" type="hidden" />
        <label class="field" for="centralEditUserName">
          <span data-i18n="users.name">Nome</span>
          <input id="centralEditUserName" name="fullName" type="text" autocomplete="name" />
        </label>
        <label class="remember-field" for="centralEditUserActive">
          <input id="centralEditUserActive" name="active" type="checkbox" checked />
          <span data-i18n="users.active">Ativo</span>
        </label>
        <div class="permission-editor" data-permission-grid="edit"></div>
        <p class="form-error" id="centralEditUserError" role="alert" hidden></p>
        <div class="central-user-form-actions">
          <button class="secondary-button" id="centralClearUserBtn" type="button" data-i18n="users.clear">Limpar</button>
          <button class="primary-button" type="submit">
            <i data-lucide="save"></i>
            <span data-i18n="users.save">Guardar alterações</span>
          </button>
        </div>
      </form>
    </div>

    <div class="central-users-table-wrap">
      <table class="central-users-table">
        <thead>
          <tr>
            <th data-i18n="users.name">Nome</th>
            <th data-i18n="login.email">Email</th>
            <th data-i18n="users.status">Estado</th>
            <th data-i18n="users.entryDate">Entrada</th>
            <th data-i18n="users.exitDate">Saida</th>
            <th data-i18n="users.actions">Ações</th>
          </tr>
        </thead>
        <tbody id="centralUsersTable"></tbody>
      </table>
    </div>
  </section>
</dialog>`

const loginPage = pageShell({
  title: 'MenteMovimento',
  page: 'login',
  headExtra: authPendingHead({ onlyWithStoredSession: true }),
  body: `
<main class="login-shell">
  <section class="login-panel" aria-labelledby="loginTitle">
    <div class="brand-line">
      <span class="brand-symbol brand-logo login-brand-logo" aria-hidden="true">
        <img src="/static/mente-movimento-logo.png" alt="" />
      </span>
      <span data-i18n="app.title">MenteMovimento</span>
    </div>
    <div class="login-step" id="centralPasswordStep">
      <h1 id="loginTitle" data-i18n="login.title">Entrar</h1>
      <p class="login-copy" data-i18n="login.copy">Acesso reservado à gestão da associação.</p>
      <form class="login-form" id="centralLoginForm">
        <label class="field" for="email">
          <span data-i18n="login.email">Email</span>
          <input id="email" name="email" type="email" autocomplete="email" required />
        </label>
        <label class="field" for="password" style="margin-bottom: 6px;">
          <span data-i18n="login.password">Password</span>
          <div style="position: relative; width: 100%; display: flex; align-items: center;">
            <input id="password" name="password" type="password" autocomplete="current-password" required autofocus style="width: 100%; padding-right: 42px;" />
            <button type="button" data-password-toggle style="position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #00d293; padding: 0; display: flex; align-items: center; z-index: 2;">
              <i data-lucide="eye">👁️</i>
            </button>
          </div>
        </label>
        <label class="remember-field" for="rememberCredentials">
          <input id="rememberCredentials" name="rememberCredentials" type="checkbox" />
          <span data-i18n="login.remember">Lembrar neste browser</span>
        </label>
        <button class="primary-button" type="submit">
          <i data-lucide="mail-check"></i>
          <span data-i18n="login.submit">Entrar</span>
        </button>
      </form>
    </div>
    <div class="login-step" id="centralVerificationStep" aria-labelledby="verificationTitle" hidden>
      <h1 id="verificationTitle" data-i18n="login.verifyTitle">Confirmar email</h1>
      <p class="login-copy login-verification-copy">
        <span data-i18n="login.verifyCopy">Enviámos um código para</span>
        <strong id="centralVerificationEmail"></strong>
      </p>
      <form class="login-form" id="centralVerificationForm">
        <label class="field" for="verificationCode">
          <span data-i18n="login.code">Código de verificação</span>
          <input
            class="verification-code-input"
            id="verificationCode"
            name="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            minlength="6"
            maxlength="8"
            pattern="[0-9]{6,8}"
            data-i18n-placeholder="login.codePlaceholder"
            placeholder="000000"
            required
          />
        </label>
        <button class="primary-button" type="submit">
          <i data-lucide="shield-check"></i>
          <span data-i18n="login.verify">Confirmar e entrar</span>
        </button>
        <div class="login-verification-actions">
          <button class="secondary-button" id="centralResendCode" type="button">
            <i data-lucide="refresh-cw"></i>
            <span data-resend-label data-i18n="login.resend">Reenviar código</span>
          </button>
          <button class="secondary-button" id="centralBackToPassword" type="button">
            <i data-lucide="arrow-left"></i>
            <span data-i18n="login.back">Voltar</span>
          </button>
        </div>
        <p class="login-status" id="centralVerificationStatus" role="status" hidden></p>
      </form>
    </div>
    <p class="form-error login-form-error" id="centralAuthError" role="alert" hidden></p>
  </section>
</main>`,
}).replace('<body data-central-page="login">', '<body class="login-page" data-central-page="login">')

const dashboardPage = pageShell({
  title: 'MenteMovimento',
  page: 'dashboard',
  body: `
${topbar('', { showAccountMenu: true })}
<main class="dashboard">
  <section class="dashboard-heading" aria-label="Gestão da associação">
    <div>
      <p class="eyebrow-dashboard" data-i18n="dashboard.eyebrow">Gestão da associação</p>
    </div>
    <a class="dashboard-manual-link" href="/docs/Manual_Inicial_MenteMovimento.pdf?v=20260724" target="_blank" rel="noopener">
      <i data-lucide="book-open-check" aria-hidden="true"></i>
      <span data-i18n="dashboard.initialManual">Manual Inicial</span>
    </a>
  </section>
  <section class="module-grid" aria-label="Aplicações disponíveis" data-i18n-aria-label="dashboard.available">
    ${moduleCards}
  </section>
</main>
${centralUsersDialog}`,
})

const atividadesPage = pageShell({
  title: 'Gestão de Atividades | MenteMovimento',
  page: 'atividades',
  titleKey: 'module.atividades.title',
  headExtra: activityNoTimeColumnStyle,
  body: `
${topbar('atividades')}
${atividadesPageContent()}
${centralUsersDialog}`,
})

const atividadesHistoryPage = pageShell({
  title: 'Histórico de Atividades | MenteMovimento',
  page: 'atividades-historico',
  titleKey: 'activities.historyPageTitle',
  body: `
${topbar('atividades')}
${atividadesHistoryPageContent()}`,
})

const atividadesUserManualPage = pageShell({
  title: 'Manual de Utilizador - Atividades | MenteMovimento',
  page: 'atividades-manual-utilizador',
  titleKey: 'activities.userManualPageTitle',
  body: `
${topbar('atividades')}
${atividadesUserManualPageContent()}`,
})

const atividadesDeveloperManualPage = pageShell({
  title: 'Manual de Programador - Atividades | MenteMovimento',
  page: 'atividades-manual-programador',
  titleKey: 'activities.developerManualPageTitle',
  body: `
${topbar('atividades')}
${atividadesDeveloperManualPageContent()}`,
})

const logoutPage = pageShell({
  title: 'A sair | MenteMovimento',
  page: 'logout',
  body: '<main class="login-shell"><section class="login-panel"><h1>A terminar sessão...</h1><p class="login-copy">Aguarde um momento.</p></section></main>',
}).replace('<body data-central-page="logout">', '<body class="login-page" data-central-page="logout">')

const globalPage = ({ file, key, title, icon, copy, items }) => ({
  file,
  html: pageShell({
    title: `${title} | MenteMovimento`,
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
</main>
${centralUsersDialog}`,
  }),
})

await rm(publicDir, { recursive: true, force: true })
await mkdir(publicDir, { recursive: true })

await cp(staticSource, staticOutput, { recursive: true })
await mkdir(path.join(staticOutput, 'vendor'), { recursive: true })
await cp(supabaseUmd, path.join(staticOutput, 'vendor', 'supabase.js'))
await cp(pdfMakeBrowser, path.join(staticOutput, 'vendor', 'pdfmake.min.js'))
await cp(pdfMakeFonts, path.join(staticOutput, 'vendor', 'vfs_fonts.js'))

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
  const rememberLoginKey = "central-remember-login";
  const rememberEmailKey = "central-remember-email";
  const verificationStateKey = "central-email-verification-state";
  let verificationCountdownTimer = 0;
  const authStorage = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key)
  };
  const showPage = () => {
    document.documentElement.removeAttribute("data-central-auth-pending");
    document.getElementById("centralAuthLoading")?.remove();
  };
  // Every embedded branch receives the same fail-closed permissions helper as the Central.
  const permissionAreas = ["socios", "utentes", "dispositivos", "atividades"];
  const permissionActions = ["view", "edit", "view_sensitive", "edit_sensitive", "export", "delete"];
  const emptyAreaPermissions = () => ({
    view: false, edit: false, view_sensitive: false, edit_sensitive: false, export: false, delete: false
  });
  const emptyPermissions = () => ({
    central: { manage_users: false, view_history: false },
    socios: emptyAreaPermissions(),
    utentes: emptyAreaPermissions(),
    dispositivos: emptyAreaPermissions(),
    atividades: emptyAreaPermissions()
  });
  const fullPermissions = () => ({
    central: { manage_users: true, view_history: true },
    socios: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true },
    utentes: { view: true, edit: true, view_sensitive: true, edit_sensitive: true, export: true, delete: true },
    dispositivos: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true },
    atividades: { view: true, edit: true, view_sensitive: true, edit_sensitive: false, export: true, delete: false }
  });
  const permissionBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
  const hasPermissionValue = (permissions, action) => Object.prototype.hasOwnProperty.call(permissions, action);
  const normalizeCentralPermissions = (input) => {
    const source = input && typeof input === "object" ? input : {};
    const normalized = emptyPermissions();

    normalized.central.manage_users = permissionBoolean(source.central?.manage_users ?? normalized.central.manage_users);
    normalized.central.view_history = permissionBoolean(source.central?.view_history ?? normalized.central.view_history);
    permissionAreas.forEach((area) => {
      const sourceArea = source[area] && typeof source[area] === "object" ? source[area] : {};
      permissionActions.forEach((action) => {
        if (hasPermissionValue(sourceArea, action)) {
          normalized[area][action] = permissionBoolean(sourceArea[action]);
        }
      });
      const current = normalized[area];
      if (hasPermissionValue(sourceArea, "view") && !permissionBoolean(sourceArea.view)) {
        permissionActions.forEach((action) => {
          current[action] = false;
        });
      } else {
        if (hasPermissionValue(sourceArea, "edit") && !permissionBoolean(sourceArea.edit)) {
          current.delete = false;
          current.edit_sensitive = false;
        }
        if (hasPermissionValue(sourceArea, "view_sensitive") && !permissionBoolean(sourceArea.view_sensitive)) {
          current.edit_sensitive = false;
          if (area === "utentes") current.export = false;
        }
        if (current.edit) current.view = true;
        if (current.export) {
          current.view = true;
          if (area === "utentes") current.view_sensitive = true;
        }
        if (current.delete) {
          current.edit = true;
          current.view = true;
        }
        if (current.view_sensitive) current.view = true;
        if (current.edit_sensitive) {
          current.view_sensitive = true;
          current.edit = true;
          current.view = true;
        }
      }
      if (!["utentes", "atividades"].includes(area)) {
        current.view_sensitive = false;
        current.edit_sensitive = false;
      }
      if (area === "atividades") {
        current.edit_sensitive = false;
        current.delete = false;
      }
    });
    return normalized;
  };
  const hasCentralPermission = (profile, area, action) => {
    const permissions = normalizeCentralPermissions(profile?.permissions);
    return Boolean(permissions[area]?.[action]);
  };
  const restrictedMessages = {
    area: "Esta area tem acesso restrito para este utilizador.",
    users: "Nao tem permissao para gerir utilizadores.",
    history: "Nao tem permissao para consultar o historico geral.",
    action: "Nao tem permissao para usar esta acao."
  };
  const restrictedAreaFromHref = (href) => {
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      const match = url.pathname.match(/^\\/area\\/(socios|utentes|dispositivos|atividades)(?:\\/|$)/);
      return match?.[1] || "";
    } catch (_error) {
      return "";
    }
  };
  const setRestrictedAccess = (node, restricted, message) => {
    if (!node) return;
    node.hidden = false;
    node.classList.toggle("is-restricted", Boolean(restricted));
    node.removeAttribute("aria-disabled");
    if (restricted) {
      node.dataset.accessRestricted = "true";
      node.dataset.restrictedMessage = message || restrictedMessages.action;
    } else {
      delete node.dataset.accessRestricted;
      delete node.dataset.restrictedMessage;
    }
  };
  const restrictedMessageForClick = (target) => {
    const explicitNode = target.closest("[data-access-restricted='true']");
    if (explicitNode) return explicitNode.dataset.restrictedMessage || restrictedMessages.action;
    const profile = window.CENTRAL_USER_PROFILE;
    if (!profile) return "";
    const permissionNode = target.closest("[data-requires-permission-area][data-requires-permission-action]");
    if (permissionNode) {
      const area = permissionNode.dataset.requiresPermissionArea;
      const action = permissionNode.dataset.requiresPermissionAction;
      if (area && action && !hasCentralPermission(profile, area, action)) {
        return permissionNode.dataset.restrictedMessage || restrictedMessages.action;
      }
    }
    if (target.closest("[data-users-toggle]") && !hasCentralPermission(profile, "central", "manage_users")) {
      return restrictedMessages.users;
    }
    const link = target.closest("a[href]");
    if (!link) return "";
    const area = restrictedAreaFromHref(link.getAttribute("href") || link.href);
    if (area && !hasCentralPermission(profile, area, "view")) return restrictedMessages.area;
    try {
      const url = new URL(link.getAttribute("href") || link.href, window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith("/historico")) {
        if (!hasCentralPermission(profile, "central", "view_history")) return restrictedMessages.history;
      }
    } catch (_error) {
      return "";
    }
    return "";
  };
  const wireRestrictedAccess = () => {
    if (window.__CENTRAL_RESTRICTED_ACCESS_WIRED) return;
    window.__CENTRAL_RESTRICTED_ACCESS_WIRED = true;
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        if (!target) return;
        const message = restrictedMessageForClick(target);
        if (!message) return;
        event.preventDefault();
        event.stopPropagation();
        window.alert(message);
      },
      true
    );
  };
  const applyCentralPermissionsToPage = (profile) => {
    const effectiveProfile = profile ? { ...profile, permissions: normalizeCentralPermissions(profile.permissions) } : profile;
    window.CENTRAL_USER_PROFILE = effectiveProfile;
    permissionAreas.forEach((area) => {
      const restricted = effectiveProfile ? !hasCentralPermission(effectiveProfile, area, "view") : false;
      document.querySelectorAll('[data-module-card="' + area + '"]').forEach((node) => {
        setRestrictedAccess(node, restricted, restrictedMessages.area);
      });
      document.querySelectorAll('a[href^="/area/' + area + '"]').forEach((node) => {
        setRestrictedAccess(node, restricted, restrictedMessages.area);
      });
    });
    document.querySelectorAll("[data-users-toggle]").forEach((node) => {
      setRestrictedAccess(node, effectiveProfile ? !hasCentralPermission(effectiveProfile, "central", "manage_users") : false, restrictedMessages.users);
    });
    document.querySelectorAll('a[href^="/historico"]').forEach((node) => {
      setRestrictedAccess(node, effectiveProfile ? !hasCentralPermission(effectiveProfile, "central", "view_history") : false, restrictedMessages.history);
    });
    document.querySelectorAll("[data-requires-permission-area][data-requires-permission-action]").forEach((node) => {
      const area = node.dataset.requiresPermissionArea;
      const action = node.dataset.requiresPermissionAction;
      setRestrictedAccess(node, effectiveProfile && area && action ? !hasCentralPermission(effectiveProfile, area, action) : false, restrictedMessages.action);
    });
    window.dispatchEvent(new CustomEvent("central-permissions-ready", { detail: effectiveProfile }));
    return effectiveProfile;
  };
  wireRestrictedAccess();
  if (!window.CENTRAL_PERMISSIONS) {
    window.CENTRAL_PERMISSIONS = {
      normalize: normalizeCentralPermissions,
      has: hasCentralPermission,
      applyToPage: applyCentralPermissionsToPage
    };
  }
  const clearPersistentAuth = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => /^sb-.*-auth-token$/.test(key) || key === "supabase.auth.token")
        .forEach((key) => localStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia localStorage.
    }
  };
  const clearCentralSession = async (client) => {
    accessPromises.clear();
    try {
      await client.auth.signOut({ scope: "local" });
    } catch (_error) {
      // Continua a limpeza local mesmo se o pedido remoto falhar.
    }
    try {
      sessionStorage.removeItem(authStorageKey);
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("central-access:"))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia sessionStorage.
    }
    clearUtentesSessionCache();
    clearPersistentAuth();
  };
  const loadRememberedLogin = () => {
    if (page !== "login") return;
    try {
      const remember = localStorage.getItem(rememberLoginKey) === "true";
      const email = remember ? localStorage.getItem(rememberEmailKey) || "" : "";
      const emailInput = document.querySelector("#email");
      const rememberInput = document.querySelector("#rememberCredentials");
      if (emailInput && email) emailInput.value = email;
      if (rememberInput) rememberInput.checked = remember;
    } catch (_error) {
      // O login continua normal sem esta preferência.
    }
  };
  const saveRememberedLogin = (email, remember) => {
    try {
      if (remember) {
        localStorage.setItem(rememberLoginKey, "true");
        localStorage.setItem(rememberEmailKey, email);
        return;
      }
      localStorage.removeItem(rememberLoginKey);
      localStorage.removeItem(rememberEmailKey);
    } catch (_error) {
      // O login continua mesmo sem acesso a localStorage.
    }
  };
  const translateLogin = (key, replacements = {}) => {
    if (typeof window.CENTRAL_TRANSLATE === "function") {
      return window.CENTRAL_TRANSLATE(key, replacements);
    }
    const fallback = {
      "login.resend": "Reenviar código",
      "login.resendIn": "Reenviar em {seconds}s",
      "login.codeSent": "Enviámos um novo código.",
      "login.codeExpired": "O código expirou. Volte a introduzir a password.",
      "login.invalidCode": "O código é inválido ou expirou.",
      "login.sessionExpired": "Sessão expirada. Volte a entrar.",
      "login.startError": "Não foi possível enviar o código de verificação.",
      "login.completeError": "Não foi possível concluir a verificação."
    };
    return Object.entries(replacements).reduce(
      (text, [name, value]) => text.split("{" + name + "}").join(String(value)),
      fallback[key] || key
    );
  };
  const writeVerificationState = (state) => {
    try {
      sessionStorage.setItem(verificationStateKey, JSON.stringify(state));
    } catch (_error) {
      // O passo de verificação continua nesta página mesmo sem persistência.
    }
    return state;
  };
  const saveVerificationState = (payload, remember = false) => writeVerificationState({
    challengeId: String(payload?.challengeId || ""),
    email: String(payload?.email || "").trim(),
    expiresAt: String(payload?.expiresAt || ""),
    resendAt: Date.now() + Math.max(0, Number(payload?.resendAfter || 60)) * 1000,
    remember: remember === true
  });
  const loadVerificationState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem(verificationStateKey) || "null");
      if (!state?.challengeId || !state?.email || !state?.expiresAt) return null;
      return state;
    } catch (_error) {
      return null;
    }
  };
  const clearVerificationState = () => {
    window.clearInterval(verificationCountdownTimer);
    verificationCountdownTimer = 0;
    try {
      sessionStorage.removeItem(verificationStateKey);
    } catch (_error) {
      // Sem impacto quando o browser bloqueia sessionStorage.
    }
  };
  const showVerificationStatus = (message) => {
    const status = document.querySelector("#centralVerificationStatus");
    if (!status) return;
    status.textContent = message || "";
    status.hidden = !message;
  };
  const setLoginStep = (step, state = null) => {
    const verifying = step === "verification";
    const passwordStep = document.querySelector("#centralPasswordStep");
    const verificationStep = document.querySelector("#centralVerificationStep");
    if (passwordStep) passwordStep.hidden = verifying;
    if (verificationStep) verificationStep.hidden = !verifying;
    document.querySelector(".login-panel")?.setAttribute(
      "aria-labelledby",
      verifying ? "verificationTitle" : "loginTitle"
    );
    if (!verifying) {
      window.clearInterval(verificationCountdownTimer);
      verificationCountdownTimer = 0;
      window.setTimeout(() => document.querySelector("#password")?.focus(), 0);
      return;
    }
    const emailNode = document.querySelector("#centralVerificationEmail");
    if (emailNode) emailNode.textContent = state?.email || "";
    showVerificationStatus("");
    window.setTimeout(() => document.querySelector("#verificationCode")?.focus(), 0);
  };
  const updateResendCountdown = () => {
    const state = loadVerificationState();
    const button = document.querySelector("#centralResendCode");
    const label = button?.querySelector("[data-resend-label]");
    if (!state || !button || !label) return;
    if (new Date(state.expiresAt).getTime() <= Date.now()) {
      clearVerificationState();
      setLoginStep("password");
      showError(translateLogin("login.codeExpired"));
      return;
    }
    const seconds = Math.max(0, Math.ceil((Number(state.resendAt || 0) - Date.now()) / 1000));
    button.disabled = seconds > 0;
    label.textContent = seconds > 0
      ? translateLogin("login.resendIn", { seconds })
      : translateLogin("login.resend");
  };
  const startResendCountdown = () => {
    window.clearInterval(verificationCountdownTimer);
    updateResendCountdown();
    verificationCountdownTimer = window.setInterval(updateResendCountdown, 1000);
  };
  const requestJson = async (url, options, fallbackMessage) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || fallbackMessage);
      error.code = payload.code || "";
      error.retryAfter = Number(payload.retryAfter || 0);
      throw error;
    }
    return payload;
  };
  const startEmailVerification = (email, password) => requestJson(
    "/api/email-verification-start",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    },
    translateLogin("login.startError")
  );
  const resendEmailVerification = (challengeId) => requestJson(
    "/api/email-verification-start",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId })
    },
    translateLogin("login.startError")
  );
  const completeEmailVerification = async (client, state) => {
    const { data } = await client.auth.getSession();
    const token = data?.session?.access_token || "";
    if (!token) {
      const error = new Error(translateLogin("login.invalidCode"));
      error.code = "INVALID_EMAIL_CODE";
      throw error;
    }
    return requestJson(
      "/api/email-verification-complete",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ challengeId: state.challengeId })
      },
      translateLogin("login.completeError")
    );
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
  const areaFromPath = (path) => {
    if (path.startsWith("/area/socios")) return "socios";
    if (path.startsWith("/area/utentes")) return "utentes";
    if (path.startsWith("/area/dispositivos")) return "dispositivos";
    if (path.startsWith("/area/atividades")) return "atividades";
    return "";
  };
  const nextPath = () => safePath(new URLSearchParams(window.location.search).get("next"), "/dashboard");
  const showError = (message) => {
    const error = document.querySelector("#centralAuthError");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  };
  const displayNameFromSession = (session, profile = null) => {
    const metadataName = session?.user?.user_metadata?.full_name;
    return String(profile?.full_name || metadataName || session?.user?.email || "").trim();
  };
  const setDashboardAccountName = (session, profile = null) => {
    const name = displayNameFromSession(session, profile);
    document.querySelectorAll("[data-dashboard-account-name]").forEach((node) => {
      node.textContent = name;
      node.title = name;
      node.hidden = !name;
    });
  };
  const utentesSessionCachePrefix = "central-utentes-session:";
  const utentesSessionCacheKey = (session) => \`\${utentesSessionCachePrefix}\${session?.user?.id || "anon"}\`;
  const clearUtentesSessionCache = () => {
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(utentesSessionCachePrefix))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia sessionStorage.
    }
  };
  const cacheKey = (session, area = "") => \`central-access:\${session?.user?.id || "anon"}:\${area || "dashboard"}\`;
  const hasAccessCache = (session, area = "") => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(session, area)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveAccessCache = (session, area = "") => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const expiresAt = authExpiresAt > 0 ? Math.min(authExpiresAt, shortCacheExpiresAt) : shortCacheExpiresAt;
      sessionStorage.setItem(cacheKey(session, area), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // Sessão continua válida mesmo se o browser bloquear sessionStorage.
    }
  };
  const hasUtentesSessionCache = (session) => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(utentesSessionCacheKey(session)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveUtentesSessionCache = (session, payload = {}) => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const apiExpiresAt = new Date(payload.expiresAt || 0).getTime();
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const candidates = [authExpiresAt, apiExpiresAt, shortCacheExpiresAt].filter((value) => Number.isFinite(value) && value > Date.now());
      const expiresAt = candidates.length ? Math.min(...candidates) : shortCacheExpiresAt;
      sessionStorage.setItem(utentesSessionCacheKey(session), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // SessÃ£o de Utentes continua normal mesmo sem cache local.
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
  const accessPromises = new Map();
  const ensureCentralAccess = async (client, area = "") => {
    const cacheArea = area || "dashboard";
    if (!accessPromises.has(cacheArea)) {
      accessPromises.set(cacheArea, (async () => {
        const { data } = await client.auth.getSession();
        const session = data?.session || null;
        const token = session?.access_token || "";
        if (!token) throw new Error("Sessão em falta.");
        const response = await fetch("/api/ensure-access", {
          method: "POST",
          headers: {
            Authorization: \`Bearer \${token}\`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ area })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const error = new Error(payload.error || "Não foi possível preparar o acesso.");
          error.code = payload.code || "";
          throw error;
        }
        const payload = await response.json().catch(() => ({ ok: true }));
        saveAccessCache(session, cacheArea);
        window.CENTRAL_PERMISSIONS?.applyToPage?.(payload.appUser);
        return payload;
      })());
    }
    try {
      return await accessPromises.get(cacheArea);
    } catch (error) {
      accessPromises.delete(cacheArea);
      throw error;
    }
  };
  const ensureUtentesSession = async (client, { force = false } = {}) => {
    const { data } = await client.auth.getSession();
    const session = data?.session || null;
    const token = session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    if (!force && hasUtentesSessionCache(session)) return;
    const response = await fetch("/api/utentes-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Não foi possível iniciar Utentes.");
    }
    const payload = await response.json().catch(() => ({ ok: true }));
    saveUtentesSessionCache(session, payload);
  };
  const goTo = async (client, target, { forceUtentesSession = false } = {}) => {
    const path = safePath(target, "/dashboard");
    await ensureCentralAccess(client, areaFromPath(path));
    if (path.startsWith("/area/utentes")) {
      await ensureUtentesSession(client, { force: forceUtentesSession });
    }
    window.location.replace(path);
  };
  const goToRequestedPath = async (client, { forceUtentesSession = false } = {}) => {
    await goTo(client, nextPath(), { forceUtentesSession });
  };
  const wireUtentesLinks = (client) => {
    document.querySelectorAll('a[href^="/area/utentes"]').forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await goTo(client, link.getAttribute("href") || "/area/utentes/", {
            forceUtentesSession: true
          });
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Sem acesso a esta area.");
          window.location.href = "/dashboard";
        }
      });
    });
  };
  document.addEventListener("DOMContentLoaded", async () => {
    stripSensitiveLoginParams();
    clearPersistentAuth();
    const client = createClient();
    if (!client) {
      showPage();
      return;
    }
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
      clearVerificationState();
      clearUtentesSessionCache();
      clearPersistentAuth();
      window.location.replace("/login?next=" + encodeURIComponent(nextPath()));
      return;
    }
    if (page === "login") {
      loadRememberedLogin();
      let verificationState = loadVerificationState();
      if (verificationState && new Date(verificationState.expiresAt).getTime() <= Date.now()) {
        clearVerificationState();
        verificationState = null;
      }
      if (verificationState && session) {
        try {
          await completeEmailVerification(client, verificationState);
          saveRememberedLogin(verificationState.email, verificationState.remember);
          clearVerificationState();
          await goToRequestedPath(client, {
            forceUtentesSession: nextPath().startsWith("/area/utentes")
          });
          return;
        } catch (error) {
          if (["CHALLENGE_EXPIRED", "CHALLENGE_COMPLETED"].includes(error?.code)) {
            await clearCentralSession(client);
            clearVerificationState();
            verificationState = null;
          }
        }
      } else if (!verificationState && session) {
        try {
          await goToRequestedPath(client, {
            forceUtentesSession: nextPath().startsWith("/area/utentes")
          });
          return;
        } catch (error) {
          await clearCentralSession(client);
          showError(error?.code === "EMAIL_VERIFICATION_REQUIRED"
            ? translateLogin("login.sessionExpired")
            : error instanceof Error ? error.message : translateLogin("login.sessionExpired"));
        }
      }
      showPage();
      if (verificationState) {
        setLoginStep("verification", verificationState);
        startResendCountdown();
      } else {
        setLoginStep("password");
      }
      document.querySelector("#centralLoginForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const remember = form.get("rememberCredentials") === "on";
        const submit = event.currentTarget.querySelector("button[type='submit']");
        submit.disabled = true;
        showError("");
        try {
          clearVerificationState();
          await clearCentralSession(client);
          const payload = await startEmailVerification(email, password);
          const state = saveVerificationState(payload, remember);
          const passwordInput = document.querySelector("#password");
          if (passwordInput) passwordInput.value = "";
          setLoginStep("verification", state);
          startResendCountdown();
        } catch (error) {
          showError(error instanceof Error ? error.message : translateLogin("login.startError"));
        } finally {
          submit.disabled = false;
        }
      });
      const verificationCode = document.querySelector("#verificationCode");
      verificationCode?.addEventListener("input", () => {
        verificationCode.value = verificationCode.value.replace(/\\D/g, "").slice(0, 8);
      });
      document.querySelector("#centralVerificationForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const state = loadVerificationState();
        if (!state || new Date(state.expiresAt).getTime() <= Date.now()) {
          clearVerificationState();
          await clearCentralSession(client);
          setLoginStep("password");
          showError(translateLogin("login.codeExpired"));
          return;
        }
        const form = new FormData(event.currentTarget);
        const code = String(form.get("code") || "").replace(/\\D/g, "");
        const submit = event.currentTarget.querySelector("button[type='submit']");
        submit.disabled = true;
        showError("");
        showVerificationStatus("");
        try {
          const { data: currentData } = await client.auth.getSession();
          let completed = false;
          if (currentData?.session) {
            try {
              await completeEmailVerification(client, state);
              completed = true;
            } catch (error) {
              if (error?.code !== "INVALID_EMAIL_CODE") throw error;
              await client.auth.signOut({ scope: "local" }).catch(() => {});
            }
          }
          if (!completed) {
            const { error: verificationError } = await client.auth.verifyOtp({
              email: state.email,
              token: code,
              type: "email"
            });
            if (verificationError) {
              const invalidCodeError = new Error(translateLogin("login.invalidCode"));
              invalidCodeError.code = "INVALID_EMAIL_CODE";
              throw invalidCodeError;
            }
            await completeEmailVerification(client, state);
          }
          saveRememberedLogin(state.email, state.remember);
          clearVerificationState();
          await goToRequestedPath(client, {
            forceUtentesSession: nextPath().startsWith("/area/utentes")
          });
        } catch (error) {
          if (["CHALLENGE_EXPIRED", "CHALLENGE_COMPLETED"].includes(error?.code)) {
            await clearCentralSession(client);
            clearVerificationState();
            setLoginStep("password");
            showError(translateLogin("login.codeExpired"));
          } else {
            showError(error?.code === "INVALID_EMAIL_CODE"
              ? translateLogin("login.invalidCode")
              : error instanceof Error ? error.message : translateLogin("login.completeError"));
          }
        } finally {
          submit.disabled = false;
        }
      });
      document.querySelector("#centralResendCode")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const state = loadVerificationState();
        if (!state) {
          setLoginStep("password");
          showError(translateLogin("login.codeExpired"));
          return;
        }
        button.disabled = true;
        showError("");
        showVerificationStatus("");
        try {
          const payload = await resendEmailVerification(state.challengeId);
          const nextState = saveVerificationState(payload, state.remember);
          setLoginStep("verification", nextState);
          showVerificationStatus(translateLogin("login.codeSent"));
          startResendCountdown();
        } catch (error) {
          if (error?.retryAfter > 0) {
            writeVerificationState({ ...state, resendAt: Date.now() + error.retryAfter * 1000 });
            startResendCountdown();
          }
          if (error?.code === "CHALLENGE_EXPIRED") {
            await clearCentralSession(client);
            clearVerificationState();
            setLoginStep("password");
          }
          showError(error instanceof Error ? error.message : translateLogin("login.startError"));
        } finally {
          updateResendCountdown();
        }
      });
      document.querySelector("#centralBackToPassword")?.addEventListener("click", async () => {
        clearVerificationState();
        await clearCentralSession(client);
        showError("");
        showVerificationStatus("");
        setLoginStep("password");
      });
      return;
    }
    if (!session) {
      window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    try {
      const payload = await ensureCentralAccess(client, areaFromPath(window.location.pathname));
      setDashboardAccountName(session, payload?.appUser);
    } catch (error) {
      if (error?.code === "EMAIL_VERIFICATION_REQUIRED") {
        await clearCentralSession(client);
        window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }
      showError(error instanceof Error ? error.message : "Não foi possível preparar o acesso.");
    }
    wireUtentesLinks(client);
  });
})();`,
)

await writeFile(
  path.join(staticOutput, 'central-module-auth.js'),
  `(() => {
  let loginTimer = 0;
  let visualTimer = 0;
  const showPage = () => {
    window.clearTimeout(visualTimer);
    document.documentElement.removeAttribute("data-central-auth-pending");
    document.getElementById("centralAuthLoading")?.remove();
  };
  const authStorageKey = "central-mm-auth-token";
  const authStorage = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key)
  };
  const permissionAreas = ["socios", "utentes", "dispositivos", "atividades"];
  const permissionActions = ["view", "edit", "view_sensitive", "edit_sensitive", "export", "delete"];
  const emptyAreaPermissions = () => ({
    view: false, edit: false, view_sensitive: false, edit_sensitive: false, export: false, delete: false
  });
  const emptyPermissions = () => ({
    central: { manage_users: false, view_history: false },
    socios: emptyAreaPermissions(),
    utentes: emptyAreaPermissions(),
    dispositivos: emptyAreaPermissions(),
    atividades: emptyAreaPermissions()
  });
  const fullPermissions = () => ({
    central: { manage_users: true, view_history: true },
    socios: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true },
    utentes: { view: true, edit: true, view_sensitive: true, edit_sensitive: true, export: true, delete: true },
    dispositivos: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true },
    atividades: { view: true, edit: true, view_sensitive: true, edit_sensitive: false, export: true, delete: false }
  });
  const permissionBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
  const hasPermissionValue = (permissions, action) => Object.prototype.hasOwnProperty.call(permissions, action);
  const normalizeCentralPermissions = (input) => {
    const source = input && typeof input === "object" ? input : {};
    const normalized = emptyPermissions();

    normalized.central.manage_users = permissionBoolean(source.central?.manage_users ?? normalized.central.manage_users);
    normalized.central.view_history = permissionBoolean(source.central?.view_history ?? normalized.central.view_history);
    permissionAreas.forEach((area) => {
      const sourceArea = source[area] && typeof source[area] === "object" ? source[area] : {};
      permissionActions.forEach((action) => {
        if (hasPermissionValue(sourceArea, action)) {
          normalized[area][action] = permissionBoolean(sourceArea[action]);
        }
      });
      const current = normalized[area];
      if (hasPermissionValue(sourceArea, "view") && !permissionBoolean(sourceArea.view)) {
        permissionActions.forEach((action) => {
          current[action] = false;
        });
      } else {
        if (hasPermissionValue(sourceArea, "edit") && !permissionBoolean(sourceArea.edit)) {
          current.delete = false;
          current.edit_sensitive = false;
        }
        if (hasPermissionValue(sourceArea, "view_sensitive") && !permissionBoolean(sourceArea.view_sensitive)) {
          current.edit_sensitive = false;
          if (area === "utentes") current.export = false;
        }
        if (current.edit) current.view = true;
        if (current.export) {
          current.view = true;
          if (area === "utentes") current.view_sensitive = true;
        }
        if (current.delete) {
          current.edit = true;
          current.view = true;
        }
        if (current.view_sensitive) current.view = true;
        if (current.edit_sensitive) {
          current.view_sensitive = true;
          current.edit = true;
          current.view = true;
        }
      }
      if (!["utentes", "atividades"].includes(area)) {
        current.view_sensitive = false;
        current.edit_sensitive = false;
      }
      if (area === "atividades") {
        current.edit_sensitive = false;
        current.delete = false;
      }
    });
    return normalized;
  };
  const hasCentralPermission = (profile, area, action) => {
    const permissions = normalizeCentralPermissions(profile?.permissions);
    return Boolean(permissions[area]?.[action]);
  };
  const restrictedMessages = {
    area: "Esta area tem acesso restrito para este utilizador.",
    users: "Nao tem permissao para gerir utilizadores.",
    history: "Nao tem permissao para consultar o historico geral.",
    action: "Nao tem permissao para usar esta acao."
  };
  const restrictedAreaFromHref = (href) => {
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      const match = url.pathname.match(/^\\/area\\/(socios|utentes|dispositivos|atividades)(?:\\/|$)/);
      return match?.[1] || "";
    } catch (_error) {
      return "";
    }
  };
  const setRestrictedAccess = (node, restricted, message) => {
    if (!node) return;
    node.hidden = false;
    node.classList.toggle("is-restricted", Boolean(restricted));
    node.removeAttribute("aria-disabled");
    if (restricted) {
      node.dataset.accessRestricted = "true";
      node.dataset.restrictedMessage = message || restrictedMessages.action;
    } else {
      delete node.dataset.accessRestricted;
      delete node.dataset.restrictedMessage;
    }
  };
  const restrictedMessageForClick = (target) => {
    const explicitNode = target.closest("[data-access-restricted='true']");
    if (explicitNode) return explicitNode.dataset.restrictedMessage || restrictedMessages.action;
    const profile = window.CENTRAL_USER_PROFILE;
    if (!profile) return "";
    const permissionNode = target.closest("[data-requires-permission-area][data-requires-permission-action]");
    if (permissionNode) {
      const area = permissionNode.dataset.requiresPermissionArea;
      const action = permissionNode.dataset.requiresPermissionAction;
      if (area && action && !hasCentralPermission(profile, area, action)) {
        return permissionNode.dataset.restrictedMessage || restrictedMessages.action;
      }
    }
    if (target.closest("[data-users-toggle]") && !hasCentralPermission(profile, "central", "manage_users")) {
      return restrictedMessages.users;
    }
    const link = target.closest("a[href]");
    if (!link) return "";
    const area = restrictedAreaFromHref(link.getAttribute("href") || link.href);
    if (area && !hasCentralPermission(profile, area, "view")) return restrictedMessages.area;
    try {
      const url = new URL(link.getAttribute("href") || link.href, window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith("/historico")) {
        if (!hasCentralPermission(profile, "central", "view_history")) return restrictedMessages.history;
      }
    } catch (_error) {
      return "";
    }
    return "";
  };
  const wireRestrictedAccess = () => {
    if (window.__CENTRAL_RESTRICTED_ACCESS_WIRED) return;
    window.__CENTRAL_RESTRICTED_ACCESS_WIRED = true;
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        if (!target) return;
        const message = restrictedMessageForClick(target);
        if (!message) return;
        event.preventDefault();
        event.stopPropagation();
        window.alert(message);
      },
      true
    );
  };
  const applyCentralPermissionsToPage = (profile) => {
    const effectiveProfile = profile ? { ...profile, permissions: normalizeCentralPermissions(profile.permissions) } : profile;
    window.CENTRAL_USER_PROFILE = effectiveProfile;
    permissionAreas.forEach((area) => {
      const restricted = effectiveProfile ? !hasCentralPermission(effectiveProfile, area, "view") : false;
      document.querySelectorAll('[data-module-card="' + area + '"]').forEach((node) => {
        setRestrictedAccess(node, restricted, restrictedMessages.area);
      });
      document.querySelectorAll('a[href^="/area/' + area + '"]').forEach((node) => {
        setRestrictedAccess(node, restricted, restrictedMessages.area);
      });
    });
    document.querySelectorAll("[data-users-toggle]").forEach((node) => {
      setRestrictedAccess(node, effectiveProfile ? !hasCentralPermission(effectiveProfile, "central", "manage_users") : false, restrictedMessages.users);
    });
    document.querySelectorAll('a[href^="/historico"]').forEach((node) => {
      setRestrictedAccess(node, effectiveProfile ? !hasCentralPermission(effectiveProfile, "central", "view_history") : false, restrictedMessages.history);
    });
    document.querySelectorAll("[data-requires-permission-area][data-requires-permission-action]").forEach((node) => {
      const area = node.dataset.requiresPermissionArea;
      const action = node.dataset.requiresPermissionAction;
      setRestrictedAccess(node, effectiveProfile && area && action ? !hasCentralPermission(effectiveProfile, area, action) : false, restrictedMessages.action);
    });
    window.dispatchEvent(new CustomEvent("central-permissions-ready", { detail: effectiveProfile }));
    return effectiveProfile;
  };
  wireRestrictedAccess();
  if (!window.CENTRAL_PERMISSIONS) {
    window.CENTRAL_PERMISSIONS = {
      normalize: normalizeCentralPermissions,
      has: hasCentralPermission,
      applyToPage: applyCentralPermissionsToPage
    };
  }
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
  const areaFromPath = (path) => {
    if (path.startsWith("/area/socios")) return "socios";
    if (path.startsWith("/area/utentes")) return "utentes";
    if (path.startsWith("/area/dispositivos")) return "dispositivos";
    if (path.startsWith("/area/atividades")) return "atividades";
    return "";
  };
  const redirectToCentralLogin = () => {
    showPage();
    window.clearTimeout(loginTimer);
    window.location.replace("/login?next=" + encodeURIComponent(safePath()));
  };
  const redirectToDashboard = () => {
    showPage();
    window.clearTimeout(loginTimer);
    window.location.replace("/dashboard");
  };
  visualTimer = window.setTimeout(() => {
    if (document.documentElement.dataset.centralAuthPending === "true") {
      window.CENTRAL_AUTH_VISUAL_TIMEOUT = true;
      showPage();
    }
  }, 3500);
  loginTimer = window.setTimeout(() => {
    let hasToken = false;
    try {
      hasToken = Boolean(sessionStorage.getItem(authStorageKey));
    } catch (_error) {
      hasToken = false;
    }
    if (!hasToken) redirectToCentralLogin();
  }, 9000);
  const cacheKey = (session, area = "") => \`central-access:\${session?.user?.id || "anon"}:\${area || "dashboard"}\`;
  const hasAccessCache = (session, area = "") => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(session, area)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveAccessCache = (session, area = "") => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const expiresAt = authExpiresAt > 0 ? Math.min(authExpiresAt, shortCacheExpiresAt) : shortCacheExpiresAt;
      sessionStorage.setItem(cacheKey(session, area), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // Continua sem cache se o browser bloquear sessionStorage.
    }
  };
  const utentesSessionCachePrefix = "central-utentes-session:";
  const utentesSessionCacheKey = (session) => \`\${utentesSessionCachePrefix}\${session?.user?.id || "anon"}\`;
  const saveUtentesSessionCache = (session, payload = {}) => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const apiExpiresAt = new Date(payload.expiresAt || 0).getTime();
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const candidates = [authExpiresAt, apiExpiresAt, shortCacheExpiresAt].filter((value) => Number.isFinite(value) && value > Date.now());
      const expiresAt = candidates.length ? Math.min(...candidates) : shortCacheExpiresAt;
      sessionStorage.setItem(utentesSessionCacheKey(session), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // A sessão de Utentes continua válida mesmo sem cache local.
    }
  };
  const ensureUtentesSession = async (session) => {
    const token = session?.access_token || "";
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
    const payload = await response.json().catch(() => ({ ok: true }));
    saveUtentesSessionCache(session, payload);
  };
  const wireUtentesLinks = (session) => {
    if (window.location.pathname.startsWith("/area/utentes") || window.__CENTRAL_UTENTES_LINKS_WIRED) return;
    window.__CENTRAL_UTENTES_LINKS_WIRED = true;
    document.addEventListener("click", async (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      const link = target?.closest('a[href^="/area/utentes"]');
      if (!link || link.target === "_blank") return;
      event.preventDefault();
      try {
        await ensureUtentesSession(session);
        window.location.assign(link.getAttribute("href") || "/area/utentes/");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível iniciar Utentes.");
      }
    });
  };
  const ensureAccess = async (session, area = "") => {
    const cacheArea = area || "dashboard";
    const token = session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    const response = await fetch("/api/ensure-access", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${token}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ area })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload.error || "Sem acesso preparado.");
      error.code = payload.code || "";
      error.status = response.status;
      throw error;
    }
    const payload = await response.json().catch(() => ({}));
    saveAccessCache(session, cacheArea);
    window.CENTRAL_PERMISSIONS?.applyToPage?.(payload.appUser);
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
      await ensureAccess(session, areaFromPath(window.location.pathname));
      wireUtentesLinks(session);
      window.clearTimeout(loginTimer);
      showPage();
    })
    .catch((error) => {
      if (error?.code === "EMAIL_VERIFICATION_REQUIRED" || error?.status === 401) {
        redirectToCentralLogin();
        return;
      }
      redirectToDashboard();
    });
})();`,
)

await writeFile(path.join(publicDir, 'login.html'), loginPage)
await writeFile(path.join(publicDir, 'logout.html'), logoutPage)
await writeFile(path.join(publicDir, 'index.html'), dashboardPage)
await mkdir(atividadesOutput, { recursive: true })
await writeFile(path.join(atividadesOutput, 'index.html'), atividadesPage)
await mkdir(path.join(atividadesOutput, 'historico'), { recursive: true })
await writeFile(path.join(atividadesOutput, 'historico', 'index.html'), atividadesHistoryPage)
await mkdir(path.join(atividadesOutput, 'manual-utilizador'), { recursive: true })
await writeFile(path.join(atividadesOutput, 'manual-utilizador', 'index.html'), atividadesUserManualPage)
await mkdir(path.join(atividadesOutput, 'manual-programador'), { recursive: true })
await writeFile(path.join(atividadesOutput, 'manual-programador', 'index.html'), atividadesDeveloperManualPage)
if (existsSync(atividadesDocsSource)) {
  await mkdir(path.join(atividadesOutput, 'docs'), { recursive: true })
  await cp(atividadesDocsSource, path.join(atividadesOutput, 'docs'), { recursive: true })
}
if (existsSync(initialManualSource)) {
  await mkdir(path.join(publicDir, 'docs'), { recursive: true })
  await cp(initialManualSource, path.join(publicDir, 'docs', 'Manual_Inicial_MenteMovimento.pdf'))
}
for (const page of [
  globalPage({
    file: 'historico.html',
    key: 'global.history',
    title: 'Histórico geral',
    icon: 'history',
    copy: 'Registo comum de alteracoes feitas nos ramos de socios, utentes, ciberseguranca e atividades.',
    items: [
      ['socios', 'Sócios', 'Alterações em fichas e quotas.'],
      ['utentes', 'Utentes', 'Alterações em fichas, separadores e anexos.'],
      ['dispositivos', 'Cibersegurança', 'Alterações em registos, reparações, estados, anexos e CSV.'],
      ['atividades', 'Atividades', 'Alteracoes em agenda, presencas e relatorios.'],
    ],
  }),
  globalPage({
    file: 'utilizadores.html',
    key: 'global.users',
    title: 'Utilizadores e permissões',
    icon: 'users-round',
    copy: 'Gestão única de administradores, utilizadores e acessos a cada ramo.',
    items: [
      ['admin', 'Administrador', 'Acesso total ao website.'],
      ['manager', 'Gestor de ramo', 'Acesso limitado a socios, utentes, ciberseguranca ou atividades.'],
      ['viewer', 'Consulta', 'Acesso só de leitura quando necessário.'],
    ],
  }),
  globalPage({
    file: 'manuais.html',
    key: 'global.manuals',
    title: 'Manuais',
    icon: 'book-open',
    copy: 'Área comum para consultar o manual inicial, os manuais dos ramos e os manuais técnicos.',
    items: [
      ['inicial', 'Manual inicial', 'Primeiros passos, navegação, permissões e cuidados com a informação.'],
      ['socios', 'Manual de sócios', 'Quotas, exportações e gestão de sócios.'],
      ['utentes', 'Manual de utentes', 'Fichas, separadores, anexos PDF, genograma e ecomapa.'],
      ['dispositivos', 'Manual de cibersegurança', 'Registos, reparações, estados, indicadores, anexos e CSV.'],
      ['atividades', 'Manual de atividades', 'Horário, sumários, presenças, monitores, indicadores e impressão.'],
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
  .replace(/<title>.*?<\/title>/, '<title>Gestão de Sócios | MenteMovimento</title>')
  .replace(
    '</title>',
    `</title>\n    ${authPendingHead()}`,
  )
  .replace('<script src="vendor/lucide.min.js" defer></script>', '<script src="/static/vendor/lucide.min.js" defer></script>')
  .replace(/\s*<script src="vendor\/xlsx\.full\.min\.js" defer><\/script>/, '')
  .replace(/\s*<script src="central-socios-client\.js" defer><\/script>/, '')
  .replace('<script src="app.js" defer></script>', `<script src="/static/vendor/supabase.js" defer></script>\n    <script src="/static/central-config.js?v=${assetVersion}" defer></script>\n    <script src="config.js?v=${assetVersion}" defer></script>\n    <script src="/static/central-module-auth.js?v=${assetVersion}" defer></script>\n    <script src="app.js?v=${assetVersion}" defer></script>`)
await writeFile(sociosIndexPath, sociosIndex)
await rm(path.join(sociosOutput, 'central-socios-client.js'), { force: true })

await writeFile(
  path.join(sociosOutput, 'config.js'),
  `window.SOCIOS_CONFIG = {
  supabaseUrl: ${jsString(supabaseUrl)},
  supabaseAnonKey: ${jsString(supabaseAnonKey)},
  captchaProvider: "",
  captchaSiteKey: "",
  organizationName: "MenteMovimento",
};
`,
)

if (!existsSync(dispositivosDist)) {
  throw new Error('A build de Ciberseguranca nao gerou a pasta dist.')
}

await cp(dispositivosDist, dispositivosOutput, { recursive: true })

const dispositivosIndexPath = path.join(dispositivosOutput, 'index.html')
let dispositivosIndex = await readFile(dispositivosIndexPath, 'utf8')
dispositivosIndex = dispositivosIndex
  .replace(/<title>.*?<\/title>/, '<title>Cibersegurança | MenteMovimento</title>')
  .replace(
    '</title>',
    `</title>\n    ${authPendingHead()}`,
  )
  .replace(
    '<script type="module"',
    `<script src="/static/vendor/supabase.js" defer></script>\n    <script src="/static/central-config.js?v=${assetVersion}" defer></script>\n    <script src="/static/central-module-auth.js?v=${assetVersion}" defer></script>\n    <script type="module"`,
  )
await writeFile(dispositivosIndexPath, dispositivosIndex)

await writeFile(
  path.join(publicDir, '404.html'),
  `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title></head><body><main style="font-family:system-ui,sans-serif;max-width:680px;margin:80px auto;padding:24px"><h1>Página não encontrada</h1><p><a href="/">Voltar ao website</a></p></main></body></html>`,
)

console.log('Output de produção criado em public/.')
