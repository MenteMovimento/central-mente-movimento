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
        <button class="secondary-button activity-questionnaire-button" type="button" data-activities-questionnaire data-requires-permission-area="atividades" data-requires-permission-action="view_sensitive" data-hide-when-restricted="true">
          <i data-lucide="clipboard-list"></i>
          <span data-i18n="activities.questionnaireButton">Questionário</span>
        </button>
        <button class="secondary-button activity-copy-button" type="button" data-activities-copy-previous data-requires-permission-area="atividades" data-requires-permission-action="view_sensitive" data-hide-when-restricted="true">
          <i data-lucide="copy"></i>
          <span data-i18n="activities.copyPreviousWeek">Copiar semana anterior</span>
        </button>
        <button class="secondary-button activity-statistics-button" type="button" data-activities-statistics data-requires-permission-area="atividades" data-requires-permission-action="view">
          <i data-lucide="bar-chart-3"></i>
          <span data-i18n="activities.statisticsButton">Indicadores</span>
        </button>
        <button class="secondary-button activity-print-button" type="button" data-activities-print data-requires-permission-area="atividades" data-requires-permission-action="export">
          <i data-lucide="printer"></i>
          <span data-i18n="activities.printWeek">Imprimir semana</span>
        </button>
        <button class="primary-button activity-create-button" type="button" data-activities-create aria-controls="activityFormPanel" aria-expanded="false" data-requires-permission-area="atividades" data-requires-permission-action="view_sensitive" data-hide-when-restricted="true">
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
          <div class="activity-dialog-actions">
            <button class="secondary-button activity-view-print-button" type="button" data-activity-view-print hidden data-requires-permission-area="atividades" data-requires-permission-action="export">
              <i data-lucide="printer"></i>
              <span data-i18n="activities.printSummary">Imprimir</span>
            </button>
            <button class="icon-link" type="button" data-activities-dialog-close aria-label="Fechar" data-i18n-aria-label="language.close">
              <i data-lucide="x"></i>
            </button>
          </div>
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
          <section class="activity-view-summary" data-activity-view-summary hidden aria-live="polite">
            <div class="activity-view-summary-block">
              <strong data-i18n="activities.viewSummaryTitle">Sum&aacute;rio</strong>
              <p data-activity-view-summary-text></p>
            </div>
            <div class="activity-view-summary-block">
              <strong data-i18n="activities.viewAttendanceTitle">Utentes presentes</strong>
              <p class="activity-view-participant-count">
                <span data-i18n="activities.viewParticipantCount">N.&ordm; de participantes</span>
                <strong data-activity-view-participant-count>0</strong>
              </p>
              <ul data-activity-view-attendance></ul>
            </div>
          </section>
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
          <button class="icon-link" type="button" data-activities-summary-close aria-label="Fechar" data-i18n-aria-label="language.close">
            <i data-lucide="x"></i>
          </button>
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
          <p class="activity-summary-locked" data-summary-locked-notice data-i18n="activities.summaryLocked" role="status" hidden>
            Este sum&aacute;rio pertence a uma semana encerrada. Pode consult&aacute;-lo, mas j&aacute; n&atilde;o pode alter&aacute;-lo.
          </p>
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
            <button class="primary-button" type="submit" data-summary-save>
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

    <dialog class="activity-dialog activity-signature-dialog" id="activitySignatureDialog" data-signature-dialog aria-labelledby="activitySignatureTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="pen-line" aria-hidden="true"></i>
            <strong id="activitySignatureTitle" data-i18n="activities.signatureTitle">Assinatura da presen&ccedil;a</strong>
          </div>
          <button class="icon-link" type="button" data-signature-close aria-label="Fechar" data-i18n-aria-label="language.close">
            <i data-lucide="x"></i>
          </button>
        </header>
        <div class="activity-signature-panel">
          <div class="activity-signature-copy">
            <strong data-signature-name>-</strong>
            <span data-signature-instruction data-i18n="activities.signatureInstruction">Pe&ccedil;a ao utente para assinar dentro da caixa.</span>
          </div>
          <canvas class="activity-signature-canvas" width="900" height="280" data-signature-canvas aria-label="Assinatura"></canvas>
          <p class="form-error activity-error" data-signature-error role="alert" hidden></p>
          <div class="activity-form-actions">
            <button class="secondary-button" type="button" data-signature-clear>
              <i data-lucide="eraser"></i>
              <span data-i18n="activities.signatureClear">Limpar</span>
            </button>
            <button class="primary-button" type="button" data-signature-save>
              <i data-lucide="save"></i>
              <span data-i18n="activities.signatureSave">Guardar assinatura</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <dialog class="activity-dialog activity-missing-time-dialog" id="activityMissingTimeDialog" data-missing-time-dialog aria-labelledby="activityMissingTimeTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="clock-3" aria-hidden="true"></i>
            <strong id="activityMissingTimeTitle" data-i18n="activities.missingTimeTitle">Tempo em falta</strong>
          </div>
          <button class="icon-link" type="button" data-missing-time-close aria-label="Fechar" data-i18n-aria-label="language.close">
            <i data-lucide="x"></i>
          </button>
        </header>
        <form class="activity-missing-time-panel" data-missing-time-form>
          <div class="activity-missing-time-copy">
            <strong data-missing-time-name>-</strong>
            <span data-i18n="activities.missingTimeInstruction">Indique quantos minutos o utente n&atilde;o esteve na atividade.</span>
            <small data-missing-time-maximum>-</small>
          </div>
          <div class="activity-missing-time-presets" data-missing-time-presets aria-label="Tempos rápidos">
            <button class="secondary-button" type="button" data-missing-time-preset="0" data-i18n="activities.missingTimeFull">Presen&ccedil;a completa</button>
            <button class="secondary-button" type="button" data-missing-time-preset="15">15 min</button>
            <button class="secondary-button" type="button" data-missing-time-preset="30">30 min</button>
            <button class="secondary-button" type="button" data-missing-time-preset="45">45 min</button>
            <button class="secondary-button" type="button" data-missing-time-preset="60">60 min</button>
            <button class="secondary-button" type="button" data-missing-time-preset="90">90 min</button>
          </div>
          <label class="activity-field activity-missing-time-field">
            <span data-i18n="activities.missingTimeLabel">Minutos em falta</span>
            <input type="number" min="0" step="5" inputmode="numeric" data-missing-time-input required />
          </label>
          <p class="form-error activity-error" data-missing-time-error role="alert" hidden></p>
          <div class="activity-form-actions">
            <button class="secondary-button" type="button" data-missing-time-close>
              <i data-lucide="x"></i>
              <span data-i18n="activities.missingTimeCancel">Cancelar</span>
            </button>
            <button class="primary-button" type="submit">
              <i data-lucide="check"></i>
              <span data-i18n="activities.missingTimeApply">Aplicar</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <dialog class="activity-dialog activity-statistics-dialog" id="activityStatisticsDialog" data-activities-statistics-dialog aria-labelledby="activityStatisticsTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="bar-chart-3" aria-hidden="true"></i>
            <strong id="activityStatisticsTitle" data-i18n="activities.statisticsTitle">Indicadores de atividades</strong>
          </div>
          <div class="activity-dialog-head-actions">
            <button class="secondary-button activity-statistics-print-button" type="button" data-activities-statistics-print data-requires-permission-area="atividades" data-requires-permission-action="export">
              <i data-lucide="printer"></i>
              <span data-i18n="activities.printSummary">Imprimir</span>
            </button>
            <button class="icon-link" type="button" data-activities-statistics-close aria-label="Fechar" data-i18n-aria-label="language.close">
              <i data-lucide="x"></i>
            </button>
          </div>
        </header>
        <div class="activity-statistics-panel">
          <div class="activity-statistics-controls">
            <label class="activity-field">
              <span data-i18n="activities.statisticsPeriod">Per&iacute;odo</span>
              <select data-activities-statistics-period>
                <option value="month" data-i18n="activities.statisticsPeriodMonthly">Mensal</option>
                <option value="week" data-i18n="activities.statisticsPeriodWeekly">Semanal</option>
                <option value="year" data-i18n="activities.statisticsPeriodAnnual">Anual</option>
              </select>
            </label>
            <div class="activity-field activity-statistics-week-field" data-activities-statistics-week-field hidden>
              <span data-i18n="activities.statisticsWeek">Semana</span>
              <strong data-activities-statistics-week-value></strong>
            </div>
            <label class="activity-field" data-activities-statistics-month-field>
              <span data-i18n="activities.statisticsMonth">M&ecirc;s</span>
              <select data-activities-statistics-month></select>
            </label>
            <label class="activity-field" data-activities-statistics-year-field>
              <span data-i18n="activities.statisticsYear">Ano</span>
              <select data-activities-statistics-year></select>
            </label>
            <label class="activity-field">
              <span data-i18n="activities.statisticsActivity">Atividade</span>
              <select data-activities-statistics-activity></select>
            </label>
          </div>
          <p class="form-error activity-error" data-activities-statistics-error role="alert" hidden></p>
          <div data-activities-statistics-content>
            <p class="activity-empty-state" data-i18n="activities.statisticsEmpty">Escolha o per&iacute;odo para consultar os indicadores.</p>
          </div>
        </div>
      </div>
    </dialog>

    <dialog class="activity-dialog activity-questionnaire-dialog" id="activityQuestionnaireDialog" data-activities-questionnaire-dialog aria-labelledby="activityQuestionnaireTitle">
      <div class="activity-dialog-panel">
        <header class="activity-dialog-head">
          <div class="activity-form-title">
            <i data-lucide="clipboard-check" aria-hidden="true"></i>
            <strong id="activityQuestionnaireTitle" data-i18n="activities.questionnaireTitle">Question&aacute;rios mensais</strong>
          </div>
          <button class="icon-link" type="button" data-activities-questionnaire-close aria-label="Fechar" data-i18n-aria-label="language.close">
            <i data-lucide="x"></i>
          </button>
        </header>
        <div class="activity-questionnaire-panel">
          <div class="activity-questionnaire-tabs" role="tablist" aria-label="Question&aacute;rios" data-i18n-aria-label="activities.questionnaireTabsLabel">
            <button class="activity-questionnaire-tab is-active" type="button" role="tab" aria-selected="true" data-questionnaire-tab="fill">
              <i data-lucide="square-pen"></i>
              <span data-i18n="activities.questionnaireFillTab">Preencher</span>
            </button>
            <button class="activity-questionnaire-tab" type="button" role="tab" aria-selected="false" data-questionnaire-tab="history">
              <i data-lucide="archive"></i>
              <span data-i18n="activities.questionnaireHistoryTab">Consultar</span>
            </button>
            <button class="activity-questionnaire-tab" type="button" role="tab" aria-selected="false" data-questionnaire-tab="average">
              <i data-lucide="chart-no-axes-column-increasing"></i>
              <span data-i18n="activities.questionnaireAverageTab">M&eacute;dia</span>
            </button>
          </div>

          <section class="activity-questionnaire-view" data-questionnaire-view="fill">
            <p class="activity-questionnaire-intro" data-i18n="activities.questionnaireIntro">Registe uma avalia&ccedil;&atilde;o mensal para cada utente e atividade.</p>
            <form class="activity-questionnaire-form" data-questionnaire-form>
              <div class="activity-questionnaire-context">
                <label class="activity-field">
                  <span data-i18n="activities.questionnaireActivity">Atividade</span>
                  <select name="activityId" data-questionnaire-activity required></select>
                </label>
                <label class="activity-field">
                  <span data-i18n="activities.questionnaireUtente">Utente</span>
                  <select name="utenteId" data-questionnaire-utente required></select>
                </label>
                <label class="activity-field">
                  <span data-i18n="activities.questionnaireMonth">M&ecirc;s</span>
                  <select name="month" data-questionnaire-month required></select>
                </label>
                <label class="activity-field">
                  <span data-i18n="activities.questionnaireYear">Ano</span>
                  <select name="year" data-questionnaire-year required></select>
                </label>
              </div>
              <div class="activity-questionnaire-existing-panel" data-questionnaire-existing-panel hidden>
                <p class="activity-questionnaire-existing" data-questionnaire-existing></p>
                <button class="secondary-button activity-questionnaire-existing-open" type="button" data-questionnaire-existing-open hidden>
                  <i data-lucide="eye"></i>
                  <span data-i18n="activities.questionnaireViewExisting">Ver question&aacute;rio realizado</span>
                </button>
              </div>
              <div class="activity-questionnaire-questions" data-questionnaire-questions hidden></div>
              <p class="form-error activity-error" data-questionnaire-error role="alert" hidden></p>
              <p class="form-success activity-questionnaire-success" data-questionnaire-success role="status" hidden></p>
              <div class="activity-form-actions activity-questionnaire-actions">
                <button class="secondary-button" type="button" data-questionnaire-clear disabled>
                  <i data-lucide="eraser"></i>
                  <span data-i18n="activities.questionnaireClear">Limpar respostas</span>
                </button>
                <button class="primary-button" type="submit" data-questionnaire-save disabled>
                  <i data-lucide="save"></i>
                  <span data-i18n="activities.questionnaireSave">Guardar question&aacute;rio</span>
                </button>
              </div>
            </form>
          </section>

          <section class="activity-questionnaire-view" data-questionnaire-view="history" hidden>
            <p class="activity-questionnaire-intro" data-i18n="activities.questionnaireHistoryIntro">Consulte os question&aacute;rios guardados anteriormente.</p>
            <div class="activity-questionnaire-history-filters">
              <label class="activity-field">
                <span data-i18n="activities.questionnaireActivity">Atividade</span>
                <select data-questionnaire-history-activity></select>
              </label>
              <label class="activity-field">
                <span data-i18n="activities.questionnaireUtente">Utente</span>
                <select data-questionnaire-history-utente></select>
              </label>
              <label class="activity-field">
                <span data-i18n="activities.questionnaireMonth">M&ecirc;s</span>
                <select data-questionnaire-history-month></select>
              </label>
              <label class="activity-field">
                <span data-i18n="activities.questionnaireYear">Ano</span>
                <select data-questionnaire-history-year></select>
              </label>
            </div>
            <div class="activity-questionnaire-history" data-questionnaire-history-list></div>
            <p class="form-error activity-error" data-questionnaire-history-error role="alert" hidden></p>
          </section>

          <section class="activity-questionnaire-view" data-questionnaire-view="average" hidden>
            <div class="activity-questionnaire-average-toolbar">
              <p class="activity-questionnaire-intro" data-i18n="activities.questionnaireAverageIntro">Consulte as m&eacute;dias mensais de cada atividade, organizadas pelas &aacute;reas do question&aacute;rio.</p>
              <button class="secondary-button activity-questionnaire-average-print" type="button" data-questionnaire-average-print data-requires-permission-area="atividades" data-requires-permission-action="export" disabled>
                <i data-lucide="printer"></i>
                <span data-i18n="activities.printSummary">Imprimir</span>
              </button>
            </div>
            <div class="activity-questionnaire-average-filters">
              <label class="activity-field">
                <span data-i18n="activities.questionnaireActivity">Atividade</span>
                <select data-questionnaire-average-activity></select>
              </label>
              <label class="activity-field">
                <span data-i18n="activities.questionnaireMonth">M&ecirc;s</span>
                <select data-questionnaire-average-month></select>
              </label>
              <label class="activity-field">
                <span data-i18n="activities.questionnaireYear">Ano</span>
                <select data-questionnaire-average-year></select>
              </label>
            </div>
            <div class="activity-questionnaire-average" data-questionnaire-average-content>
              <p class="activity-empty-state" data-i18n="activities.questionnaireAverageEmpty">N&atilde;o existem question&aacute;rios para calcular a m&eacute;dia com estes filtros.</p>
            </div>
          </section>

          <section class="activity-questionnaire-view activity-questionnaire-detail-view" data-questionnaire-view="detail" hidden>
            <div class="activity-questionnaire-detail-toolbar">
              <button class="secondary-button" type="button" data-questionnaire-detail-back>
                <i data-lucide="arrow-left"></i>
                <span data-i18n="activities.questionnaireBackToHistory">Voltar &agrave; lista</span>
              </button>
            </div>
            <div class="activity-questionnaire-detail" data-questionnaire-detail-content></div>
          </section>
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
      <span data-i18n="activities.back">Voltar</span>
    </a>
    <p class="eyebrow" data-i18n="nav.atividades">Atividades</p>
    <h2 data-i18n="activities.historyTitle">Hist&oacute;rico de Altera&ccedil;&otilde;es</h2>
    <div class="activity-history-list" data-activities-history>
      <p class="activity-empty-state" data-i18n="activities.historyEmpty">Sem a&ccedil;&otilde;es registadas.</p>
    </div>
  </section>
</main>`

export const atividadesUserManualPageContent = () => `<main class="global-shell">
  <section class="global-panel activity-document-panel">
    <a class="secondary-button activity-back-link" href="/area/atividades/">
      <i data-lucide="arrow-left"></i>
      <span data-i18n="activities.back">Voltar</span>
    </a>
    <p class="eyebrow" data-i18n="activities.userManualEyebrow">Manual de utilizador</p>
    <h2 data-i18n="nav.atividades">Atividades</h2>
    <p class="global-copy" data-i18n="activities.userManualCopy">Guia r&aacute;pido para consultar, criar, organizar e imprimir o hor&aacute;rio semanal de atividades.</p>
    <div class="activity-manual-grid">
      <article class="activity-manual-section">
        <h3 data-i18n="activities.userManualCreateTitle">Criar atividade</h3>
        <p data-i18n="activities.userManualCreateCopy">Use o bot&atilde;o Criar Atividade, escolha o dia, as horas, o nome da atividade e at&eacute; dois monitores, e grave.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.userManualEditTitle">Consultar e editar</h3>
        <p data-i18n="activities.userManualEditCopy">O olho abre a atividade em modo consulta. O l&aacute;pis permite alterar os dados. O caixote remove a atividade.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.userManualOrganizeTitle">Organizar a semana</h3>
        <p data-i18n="activities.userManualOrganizeCopy">Quando houver v&aacute;rias atividades no mesmo hor&aacute;rio, arraste o cart&atilde;o inteiro para mudar a ordem.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.userManualPrintTitle">Imprimir</h3>
        <p data-i18n="activities.userManualPrintCopy">O bot&atilde;o de impress&atilde;o gera uma folha semanal em formato de hor&aacute;rio escolar.</p>
      </article>
    </div>
  </section>
</main>`

export const atividadesDeveloperManualPageContent = () => `<main class="global-shell">
  <section class="global-panel activity-document-panel">
    <a class="secondary-button activity-back-link" href="/area/atividades/">
      <i data-lucide="arrow-left"></i>
      <span data-i18n="activities.back">Voltar</span>
    </a>
    <p class="eyebrow" data-i18n="activities.developerManualEyebrow">Manual de programador</p>
    <h2 data-i18n="nav.atividades">Atividades</h2>
    <p class="global-copy" data-i18n="activities.developerManualCopy">Notas t&eacute;cnicas essenciais para manter o m&oacute;dulo de atividades dentro do portal.</p>
    <div class="activity-manual-grid">
      <article class="activity-manual-section">
        <h3 data-i18n="activities.developerManualStructureTitle">Estrutura</h3>
        <p data-i18n="activities.developerManualStructureCopy">A marca&ccedil;&atilde;o da &aacute;rea est&aacute; em portal/modules/atividades/page.mjs. A gera&ccedil;&atilde;o das p&aacute;ginas continua em scripts/prepare-vercel-output.mjs.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.developerManualDatabaseTitle">Base de dados</h3>
        <p data-i18n="activities.developerManualDatabaseCopy">As atividades, os monitores e o hist&oacute;rico usam tabelas Supabase definidas em portal/modules/atividades/supabase/schema.sql.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.developerManualPermissionsTitle">Permiss&otilde;es</h3>
        <p data-i18n="activities.developerManualPermissionsCopy">Em Atividades, view permite consultar pelo olho, edit permite gerir o sum&aacute;rio, view_sensitive permite criar, editar e eliminar atividades, e export permite imprimir.</p>
      </article>
      <article class="activity-manual-section">
        <h3 data-i18n="activities.developerManualPrintTitle">Impress&atilde;o</h3>
        <p data-i18n="activities.developerManualPrintCopy">A impress&atilde;o semanal &eacute; gerada por iframe tempor&aacute;rio para evitar abrir separadores vazios.</p>
      </article>
    </div>
  </section>
</main>`
