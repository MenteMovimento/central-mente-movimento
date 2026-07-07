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
            <span data-i18n="activities.start">In&iacute;cio</span>
            <input type="time" name="start" value="09:00" required />
          </label>
          <label class="activity-field">
            <span data-i18n="activities.end">Fim</span>
            <input type="time" name="end" />
          </label>
          <label class="activity-field activity-field-wide">
            <span data-i18n="activities.name">Nome da atividade</span>
            <input type="text" name="title" autocomplete="off" required />
          </label>
          <label class="activity-field">
            <span data-i18n="activities.teacher">Professor</span>
            <input type="text" name="teacher" autocomplete="off" required />
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
