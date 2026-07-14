const activityStartTimes = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
]

const activityEndTimes = [
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
]

const activityTimeOptions = (times, selected = '') =>
  times.map((time) => `<option value="${time}"${time === selected ? ' selected' : ''}>${time}</option>`).join('')

export const atividadesPageContent = () => `<main class="global-shell activities-shell">
  <section class="activities-workspace area-indigo" data-activities-calendar>
    <div class="activities-toolbar">
      <div class="activity-week-control">
        <button class="icon-link activity-week-nav" type="button" data-activities-week-prev title="Semana anterior" aria-label="Semana anterior" data-i18n-title="activities.weekPrevious" data-i18n-aria-label="activities.weekPrevious">
          <i data-lucide="chevron-left"></i>
        </button>
        <div class="activity-week-summary">
          <span data-i18n="activities.week">Segunda a sexta</span>
          <strong data-activities-week-range></strong>
        </div>
        <button class="icon-link activity-week-nav" type="button" data-activities-week-next title="Semana seguinte" aria-label="Semana seguinte" data-i18n-title="activities.weekNext" data-i18n-aria-label="activities.weekNext">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
      <div class="activity-toolbar-actions">
        <button class="secondary-button activity-copy-button" type="button" data-activities-copy-previous data-requires-permission-area="atividades" data-requires-permission-action="edit">
          <i data-lucide="copy"></i>
          <span data-i18n="activities.copyPreviousWeek">Copiar semana anterior</span>
        </button>
        <button class="secondary-button activity-statistics-button" type="button" data-activities-statistics data-requires-permission-area="atividades" data-requires-permission-action="view">
          <i data-lucide="bar-chart-3"></i>
          <span data-i18n="activities.statisticsButton">Estat&iacute;sticas</span>
        </button>
        <button class="secondary-button activity-print-button" type="button" data-activities-print data-requires-permission-area="atividades" data-requires-permission-action="export">
          <i data-lucide="printer"></i>
          <span data-i18n="activities.printWeek">Imprimir semana</span>
        </button>
        <button class="primary-button activity-create-button" type="button" data-activities-create aria-controls="activityFormPanel" aria-expanded="false" data-requires-permission-area="atividades" data-requires-permission-action="edit">
          <i data-lucide="calendar-plus"></i>
          <span data-activities-create-label data-i18n="activities.createButton">Criar Atividade</span>
        </button>
      </div>
    </div>
    <p class="form-error activity-error activity-toolbar-feedback" data-activities-status role="status" hidden></p>

    <dialog class="activity-dialog" id="activityFormDialog" data-activities-dialog aria-labelledby="activityFormTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="calendar-plus" aria-hidden="true"></i>
            <strong id="activityFormTitle" data-activities-form-title data-i18n="activities.form.addTitle">Adicionar atividade</strong>
          </div>
          <button class="icon-link" type="button" data-activities-dialog-close aria-label="Fechar">
            <i data-lucide="x"></i>
          </button>
        </header>
        <form class="activity-form" id="activityFormPanel" data-activities-form hidden>
          <input type="hidden" name="id" />
          <label class="activity-field">
            <span data-i18n="activities.day">Dia</span>
            <select name="day" required>
              <option value="monday" data-i18n="activities.day.monday">Segunda-feira</option>
              <option value="tuesday" data-i18n="activities.day.tuesday">Ter&ccedil;a-feira</option>
              <option value="wednesday" data-i18n="activities.day.wednesday">Quarta-feira</option>
              <option value="thursday" data-i18n="activities.day.thursday">Quinta-feira</option>
              <option value="friday" data-i18n="activities.day.friday">Sexta-feira</option>
            </select>
          </label>
          <label class="activity-field">
            <span data-i18n="activities.start">Inicio</span>
            <select name="start" required>
              ${activityTimeOptions(activityStartTimes)}
            </select>
          </label>
          <label class="activity-field">
            <span data-i18n="activities.end">Fim</span>
            <select name="end" required>
              ${activityTimeOptions(activityEndTimes)}
            </select>
          </label>
          <label class="activity-field activity-field-wide">
            <span data-i18n="activities.name">Nome da atividade</span>
            <select name="title" data-activity-name-options required>
              <option value="" data-i18n="activities.selectActivity">Selecionar atividade</option>
            </select>
          </label>
          <label class="activity-field">
            <span data-i18n="activities.teacher">Monitor</span>
            <select name="teacher" data-activity-monitor-options data-activity-monitor-placeholder="activities.selectMonitor" required>
              <option value="" data-i18n="activities.selectMonitor">Selecionar monitor</option>
            </select>
          </label>
          <label class="activity-field">
            <span data-i18n="activities.teacherSecond">2.º monitor</span>
            <select name="teacher2" data-activity-monitor-options data-activity-monitor-placeholder="activities.selectSecondMonitor">
              <option value="" data-i18n="activities.selectSecondMonitor">Sem segundo monitor</option>
            </select>
          </label>
          <div class="activity-form-actions">
            <button class="primary-button" type="submit">
              <i data-lucide="save"></i>
              <span data-activities-submit-label data-i18n="activities.save">Guardar</span>
            </button>
            <button class="secondary-button" type="button" data-activities-clear>
              <i data-lucide="eraser"></i>
              <span data-i18n="activities.clear">Limpar</span>
            </button>
          </div>
          <p class="form-error activity-error" data-activities-error role="alert" hidden></p>
        </form>
      </div>
    </dialog>

    <dialog class="activity-dialog activity-summary-dialog" id="activitySummaryDialog" data-activities-summary-dialog aria-labelledby="activitySummaryTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="clipboard-list" aria-hidden="true"></i>
            <strong id="activitySummaryTitle" data-i18n="activities.summaryTitle">Sum&aacute;rio da atividade</strong>
          </div>
          <div class="activity-dialog-actions">
            <button class="secondary-button activity-summary-print-button" type="button" data-activities-summary-print data-requires-permission-area="atividades" data-requires-permission-action="export">
              <i data-lucide="printer"></i>
              <span data-i18n="activities.printSummary">Imprimir</span>
            </button>
            <button class="icon-link" type="button" data-activities-summary-close aria-label="Fechar">
              <i data-lucide="x"></i>
            </button>
          </div>
        </header>
        <form class="activity-summary-form" data-activities-summary-form>
          <input type="hidden" name="activityId" data-summary-activity-select />
          <div class="activity-summary-meta" aria-live="polite">
            <div>
              <span data-i18n="activities.name">Nome da atividade</span>
              <strong data-summary-activity-name>-</strong>
            </div>
            <div>
              <span data-i18n="activities.summaryDate">Data</span>
              <strong data-summary-date>-</strong>
            </div>
            <div>
              <span data-i18n="activities.summaryStart">Hora de in&iacute;cio</span>
              <strong data-summary-start>-</strong>
            </div>
            <div>
              <span data-i18n="activities.summaryEnd">Hora de fim</span>
              <strong data-summary-end>-</strong>
            </div>
            <div>
              <span data-i18n="activities.summaryDuration">Dura&ccedil;&atilde;o</span>
              <strong data-summary-duration>-</strong>
            </div>
          </div>
          <label class="activity-field activity-field-wide">
            <span data-i18n="activities.summaryText">Sum&aacute;rio</span>
            <textarea name="summary" rows="6" data-summary-text data-i18n-placeholder="activities.summaryPlaceholder" placeholder="Escreva o sum&aacute;rio da atividade..."></textarea>
          </label>
          <section class="activity-summary-attendance" aria-labelledby="activitySummaryAttendanceTitle">
            <div class="activity-summary-section-head">
              <strong id="activitySummaryAttendanceTitle" data-i18n="activities.summaryAttendance">Presen&ccedil;as</strong>
              <label class="activity-field activity-summary-search">
                <span data-i18n="activities.summaryAttendanceSearch">Pesquisar utentes</span>
                <input type="search" data-summary-attendance-search autocomplete="off" />
              </label>
            </div>
            <div class="activity-attendance-list" data-summary-attendance-list></div>
          </section>
          <div class="activity-form-actions">
            <button class="primary-button" type="submit">
              <i data-lucide="save"></i>
              <span data-i18n="activities.save">Guardar</span>
            </button>
            <button class="secondary-button" type="button" data-summary-clear>
              <i data-lucide="eraser"></i>
              <span data-i18n="activities.clear">Limpar</span>
            </button>
          </div>
          <p class="form-error activity-error" data-summary-error role="alert" hidden></p>
        </form>
      </div>
    </dialog>

    <dialog class="activity-dialog activity-statistics-dialog" id="activityStatisticsDialog" data-activities-statistics-dialog aria-labelledby="activityStatisticsTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="bar-chart-3" aria-hidden="true"></i>
            <strong id="activityStatisticsTitle" data-i18n="activities.statisticsTitle">Estat&iacute;sticas de atividades</strong>
          </div>
          <button class="icon-link" type="button" data-activities-statistics-close aria-label="Fechar">
            <i data-lucide="x"></i>
          </button>
        </header>
        <div class="activity-statistics-panel">
          <div class="activity-statistics-controls">
            <label class="activity-field">
              <span data-i18n="activities.statisticsPeriod">Per&iacute;odo</span>
              <select data-activities-statistics-period>
                <option value="month" data-i18n="activities.statisticsPeriodMonthly">Mensal</option>
                <option value="year" data-i18n="activities.statisticsPeriodAnnual">Anual</option>
              </select>
            </label>
            <label class="activity-field">
              <span data-i18n="activities.statisticsMonth">M&ecirc;s</span>
              <select data-activities-statistics-month></select>
            </label>
            <label class="activity-field" data-activities-statistics-year-field>
              <span data-i18n="activities.statisticsYear">Ano</span>
              <select data-activities-statistics-year></select>
            </label>
            <button class="secondary-button" type="button" data-activities-statistics-refresh>
              <i data-lucide="refresh-cw"></i>
              <span data-i18n="activities.statisticsRefresh">Atualizar</span>
            </button>
          </div>
          <p class="form-error activity-error" data-activities-statistics-error role="alert" hidden></p>
          <div data-activities-statistics-content>
            <p class="activity-empty-state" data-i18n="activities.statisticsEmpty">Escolha o per&iacute;odo para consultar as estat&iacute;sticas.</p>
          </div>
        </div>
      </div>
    </dialog>

    <section class="weekly-calendar-shell" aria-labelledby="weeklyCalendarTitle">
      <div class="weekly-calendar-head">
        <div>
          <p class="eyebrow" data-i18n="activities.week">Segunda a sexta</p>
        </div>
      </div>
      <div class="weekly-calendar" data-activities-grid aria-live="polite"></div>
    </section>
  </section>
</main>`

export const atividadesHistoryPageContent = () => `<main class="global-shell">
  <section class="global-panel activity-document-panel">
    <a class="secondary-button activity-back-link" href="/area/atividades/">
      <i data-lucide="arrow-left"></i>
      <span>Voltar</span>
    </a>
    <p class="eyebrow">Atividades</p>
    <h2>Histórico de Alterações</h2>
    <div class="activity-history-list" data-activities-history>
      <p class="activity-empty-state">Sem a&ccedil;&otilde;es registadas.</p>
    </div>
  </section>
</main>`

export const atividadesUserManualPageContent = () => `<main class="global-shell">
  <section class="global-panel activity-document-panel">
    <a class="secondary-button activity-back-link" href="/area/atividades/">
      <i data-lucide="arrow-left"></i>
      <span>Voltar</span>
    </a>
    <p class="eyebrow">Manual de utilizador</p>
    <h2>Atividades</h2>
    <p class="global-copy">Guia r&aacute;pido para consultar, criar, organizar e imprimir o hor&aacute;rio semanal de atividades.</p>
    <div class="activity-manual-grid">
      <article class="activity-manual-section">
        <h3>Criar atividade</h3>
        <p>Use o bot&atilde;o <strong>Criar Atividade</strong>, escolha o dia, as horas, o nome da atividade e at&eacute; dois monitores, e grave.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Consultar e editar</h3>
        <p>O olho abre a atividade em modo consulta. O l&aacute;pis permite alterar os dados. O caixote remove a atividade.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Organizar a semana</h3>
        <p>Quando houver v&aacute;rias atividades no mesmo hor&aacute;rio, arraste o cart&atilde;o inteiro para mudar a ordem.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Imprimir</h3>
        <p>O bot&atilde;o de impress&atilde;o gera uma folha semanal em formato de hor&aacute;rio escolar.</p>
      </article>
    </div>
  </section>
</main>`

export const atividadesDeveloperManualPageContent = () => `<main class="global-shell">
  <section class="global-panel activity-document-panel">
    <a class="secondary-button activity-back-link" href="/area/atividades/">
      <i data-lucide="arrow-left"></i>
      <span>Voltar</span>
    </a>
    <p class="eyebrow">Manual de programador</p>
    <h2>Atividades</h2>
    <p class="global-copy">Notas t&eacute;cnicas essenciais para manter o m&oacute;dulo de atividades dentro do portal.</p>
    <div class="activity-manual-grid">
      <article class="activity-manual-section">
        <h3>Estrutura</h3>
        <p>A marca&ccedil;&atilde;o da &aacute;rea est&aacute; em <code>portal/modules/atividades/page.mjs</code>. A gera&ccedil;&atilde;o das p&aacute;ginas continua em <code>scripts/prepare-vercel-output.mjs</code>.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Base de dados</h3>
        <p>As atividades, os monitores e o hist&oacute;rico usam tabelas Supabase definidas em <code>portal/modules/atividades/supabase/schema.sql</code>.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Permiss&otilde;es</h3>
        <p>Os controlos usam <code>data-requires-permission-area="atividades"</code> com as a&ccedil;&otilde;es <code>view</code>, <code>edit</code> e <code>export</code>.</p>
      </article>
      <article class="activity-manual-section">
        <h3>Impress&atilde;o</h3>
        <p>A impress&atilde;o semanal &eacute; gerada por iframe tempor&aacute;rio para evitar abrir separadores vazios.</p>
      </article>
    </div>
  </section>
</main>`
