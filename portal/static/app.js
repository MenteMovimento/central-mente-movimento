const refreshIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const themeStorageKey = "central-theme";
const legacyThemeStorageKey = "socios-theme";
const dispositivosThemeStorageKey = "mentemovimento-theme";
const languageStorageKey = "central-language";
const legacyLanguageStorageKey = "socios-language";
const dispositivosLanguageStorageKey = "mentemovimento-language";
const languageStorageKeys = [
  languageStorageKey,
  legacyLanguageStorageKey,
  dispositivosLanguageStorageKey,
];
const passwordPolicyMessage =
  "A password deve ter pelo menos 8 caracteres, uma letra maiuscula e um caracter especial.";
const isStrongPassword = (password) =>
  password.length >= 8 && /\p{Lu}/u.test(password) && /[^\p{L}\p{N}]/u.test(password);

const translations = {
  pt: {
    "app.title": "MenteMovimento",
    "login.title": "Entrar",
    "login.copy": "Acesso reservado \u00e0 gest\u00e3o da associa\u00e7\u00e3o.",
    "login.submit": "Entrar",
    "login.email": "Email",
    "login.password": "Password",
    "login.remember": "Lembrar neste browser",
    "nav.areas": "\u00c1reas principais",
    "nav.tools": "Ferramentas globais",
    "nav.openMenu": "Abrir menu",
    "nav.logout": "Terminar sess\u00e3o",
    "nav.socios": "S\u00f3cios",
    "nav.utentes": "Utentes",
    "nav.dispositivos": "Dispositivos",
    "nav.atividades": "Atividades",
    "menu.history": "Hist\u00f3rico",
    "menu.historyFull": "Hist\u00f3rico geral",
    "menu.users": "Utilizadores",
    "menu.manuals": "Manuais",
    "menu.language": "Idioma",
    "menu.dark": "Tema escuro",
    "menu.light": "Tema claro",
    "language.title": "Idioma",
    "language.subtitle": "Escolha o idioma da aplicacao neste browser.",
    "language.portuguese": "Portugu\u00eas",
    "language.portugal": "Portugal",
    "language.english": "English",
    "language.uk": "United Kingdom",
    "language.ptLabel": "Idioma: Portugu\u00eas",
    "language.enLabel": "Language: English",
    "language.close": "Fechar",
    "dashboard.eyebrow": "Gest\u00e3o da associa\u00e7\u00e3o",
    "dashboard.title": "Escolhe a \u00e1rea de trabalho",
    "dashboard.session": "Sess\u00e3o \u00fanica",
    "dashboard.available": "Aplica\u00e7\u00f5es dispon\u00edveis",
    "module.status.integrated": "Integrado",
    "module.status.online": "Online",
    "module.status.offline": "Offline",
    "module.socios.title": "Gest\u00e3o de S\u00f3cios",
    "module.socios.detail": "Base de s\u00f3cios",
    "module.utentes.title": "Gest\u00e3o de Utentes",
    "module.utentes.detail": "Base de utentes",
    "module.dispositivos.title": "Gest\u00e3o de Dispositivos",
    "module.dispositivos.detail": "Base de dispositivos",
    "module.atividades.title": "Gest\u00e3o de Atividades",
    "module.atividades.detail": "Planeamento e registo de atividades",
    "activities.eyebrow": "Hor\u00e1rio semanal",
    "activities.copy": "Planeie as atividades da semana por dia, hora e professor.",
    "activities.createButton": "Criar Atividade",
    "activities.closeCreateButton": "Fechar",
    "activities.form.addTitle": "Adicionar atividade",
    "activities.form.editTitle": "Editar atividade",
    "activities.form.viewTitle": "Ver atividade",
    "activities.printWeek": "Imprimir semana",
    "activities.printTitle": "Horário semanal de atividades",
    "activities.printScheduleTitle": "Hor\u00e1rio das Atividades",
    "activities.weekPrevious": "Semana anterior",
    "activities.weekNext": "Semana seguinte",
    "activities.weekRange": "{start} a {end}",
    "activities.day": "Dia",
    "activities.start": "In\u00edcio",
    "activities.end": "Fim",
    "activities.name": "Nome da atividade",
    "activities.teacher": "Professor",
    "activities.save": "Guardar",
    "activities.update": "Atualizar",
    "activities.clear": "Limpar",
    "activities.week": "Segunda a sexta",
    "activities.lunch": "Almo\u00e7o",
    "activities.emptyDay": "Sem atividades",
    "activities.emptyWeek": "Ainda n\u00e3o existem atividades nesta semana.",
    "activities.remove": "Remover",
    "activities.edit": "Editar",
    "activities.view": "Ver",
    "activities.dragHandle": "Arrastar para ordenar",
    "activities.dropHere": "Largar aqui",
    "activities.confirmDelete": "Remover esta atividade?",
    "activities.validationRequired": "Preencha o dia, a hora, o nome da atividade e o professor.",
    "activities.validationTime": "A hora de fim tem de ser depois da hora de in\u00edcio.",
    "activities.saved": "Atividade guardada.",
    "activities.deleted": "Atividade removida.",
    "activities.cleared": "Semana limpa.",
    "activities.count.one": "1 atividade",
    "activities.count.other": "{count} atividades",
    "activities.day.monday": "Segunda-feira",
    "activities.day.tuesday": "Ter\u00e7a-feira",
    "activities.day.wednesday": "Quarta-feira",
    "activities.day.thursday": "Quinta-feira",
    "activities.day.friday": "Sexta-feira",
    "activities.dayShort.monday": "Seg",
    "activities.dayShort.tuesday": "Ter",
    "activities.dayShort.wednesday": "Qua",
    "activities.dayShort.thursday": "Qui",
    "activities.dayShort.friday": "Sex",
    "module.enter": "Entrar",
    "global.eyebrow": "Ferramenta global",
    "global.history.title": "Hist\u00f3rico geral",
    "global.history.copy": "Registo comum de altera\u00e7\u00f5es feitas nos ramos de s\u00f3cios, utentes, dispositivos e atividades.",
    "global.history.socios.title": "S\u00f3cios",
    "global.history.socios.copy": "Altera\u00e7\u00f5es em fichas e quotas.",
    "global.history.utentes.title": "Utentes",
    "global.history.utentes.copy": "Altera\u00e7\u00f5es em fichas, separadores e anexos.",
    "global.history.dispositivos.title": "Dispositivos",
    "global.history.dispositivos.copy": "Altera\u00e7\u00f5es em listagens, repara\u00e7\u00f5es, estados, anexos e CSV.",
    "global.history.atividades.title": "Atividades",
    "global.history.atividades.copy": "Altera\u00e7\u00f5es em agenda, presen\u00e7as e relat\u00f3rios.",
    "global.users.title": "Utilizadores e permiss\u00f5es",
    "global.users.copy": "Gest\u00e3o \u00fanica de administradores, utilizadores e acessos a cada ramo.",
    "global.users.admin.title": "Administrador",
    "global.users.admin.copy": "Acesso total ao website.",
    "global.users.manager.title": "Gestor de ramo",
    "global.users.manager.copy": "Acesso limitado a s\u00f3cios, utentes, dispositivos ou atividades.",
    "global.users.viewer.title": "Consulta",
    "global.users.viewer.copy": "Acesso s\u00f3 de leitura quando necess\u00e1rio.",
    "global.manuals.title": "Manuais",
    "global.manuals.copy": "\u00c1rea comum para consultar os manuais dos ramos e os manuais t\u00e9cnicos.",
    "global.manuals.socios.title": "Manual de s\u00f3cios",
    "global.manuals.socios.copy": "Quotas, exporta\u00e7\u00f5es e gest\u00e3o de s\u00f3cios.",
    "global.manuals.utentes.title": "Manual de utentes",
    "global.manuals.utentes.copy": "Fichas, separadores, anexos PDF, genograma e ecomapa.",
    "global.manuals.dispositivos.title": "Manual de dispositivos",
    "global.manuals.dispositivos.copy": "Repara\u00e7\u00f5es, estados, estat\u00edsticas, anexos e CSV.",
    "global.manuals.atividades.title": "Manual de atividades",
    "global.manuals.atividades.copy": "A preparar quando o m\u00f3dulo de atividades estiver fechado.",
    "users.title": "Utilizadores",
    "users.subtitle": "Crie acessos novos e edite permiss\u00f5es de utilizadores existentes.",
    "users.refresh": "Atualizar",
    "users.createTitle": "Criar utilizador",
    "users.createHint": "O ID \u00e9 criado automaticamente no Supabase Auth.",
    "users.editTitle": "Editar utilizador",
    "users.editHint": "Escolha um utilizador na lista para editar.",
    "users.name": "Nome",
    "users.role": "Perfil",
    "users.roleAdmin": "Administrador",
    "users.roleOperator": "Operador",
    "users.roleViewer": "Consulta",
    "users.createButton": "Criar utilizador",
    "users.active": "Ativo",
    "users.inactive": "Inativo",
    "users.status": "Estado",
    "users.entryDate": "Entrada",
    "users.exitDate": "Sa\u00edda",
    "users.actions": "A\u00e7\u00f5es",
    "users.clear": "Limpar",
    "users.save": "Guardar altera\u00e7\u00f5es",
    "users.empty": "Sem utilizadores registados.",
    "users.self": "A pr\u00f3pria conta",
    "users.adminOnly": "S\u00f3 administradores podem gerir utilizadores.",
    "access.restricted": "Acesso restrito.",
    "access.areaRestricted": "Esta area tem acesso restrito para este utilizador.",
    "access.usersRestricted": "Nao tem permissao para gerir utilizadores.",
    "access.historyRestricted": "Nao tem permissao para consultar o historico geral.",
    "access.actionRestricted": "Nao tem permissao para usar esta acao.",
    "users.saved": "Acesso de utilizador guardado.",
    "users.created": "Utilizador criado.",
    "users.deleted": "Utilizador eliminado.",
    "users.activated": "Utilizador ativado.",
    "users.deactivated": "Utilizador desativado.",
    "permissions.area": "\u00c1rea",
    "permissions.view": "Ver",
    "permissions.edit": "Editar",
    "permissions.viewSensitive": "Ver dados sens\u00edveis",
    "permissions.editSensitive": "Editar dados sens\u00edveis",
    "permissions.export": "Exportar",
    "permissions.delete": "Apagar",
    "permissions.central": "Permiss\u00f5es gerais",
    "permissions.manageUsers": "Gerir utilizadores",
    "permissions.viewHistory": "Ver hist\u00f3rico geral",
    "permissions.socios": "S\u00f3cios",
    "permissions.utentes": "Utentes",
    "permissions.dispositivos": "Dispositivos",
    "permissions.atividades": "Atividades",
    "permissions.notApplicable": "-",
  },
  en: {
    "app.title": "MenteMovimento",
    "login.title": "Sign in",
    "login.copy": "Restricted access for association management.",
    "login.submit": "Sign in",
    "login.email": "Email",
    "login.password": "Password",
    "login.remember": "Remember on this browser",
    "nav.areas": "Main areas",
    "nav.tools": "Global tools",
    "nav.openMenu": "Open menu",
    "nav.logout": "Sign out",
    "nav.socios": "Members",
    "nav.utentes": "Clients",
    "nav.dispositivos": "Devices",
    "nav.atividades": "Activities",
    "menu.history": "History",
    "menu.historyFull": "Global history",
    "menu.users": "Users",
    "menu.manuals": "Manuals",
    "menu.language": "Language",
    "menu.dark": "Dark mode",
    "menu.light": "Light mode",
    "language.title": "Language",
    "language.subtitle": "Choose the application language in this browser.",
    "language.portuguese": "Portuguese",
    "language.portugal": "Portugal",
    "language.english": "English",
    "language.uk": "United Kingdom",
    "language.ptLabel": "Idioma: Português",
    "language.enLabel": "Language: English",
    "language.close": "Close",
    "dashboard.eyebrow": "Association management",
    "dashboard.title": "Choose the workspace",
    "dashboard.session": "Single session",
    "dashboard.available": "Available applications",
    "module.status.integrated": "Integrated",
    "module.status.online": "Online",
    "module.status.offline": "Offline",
    "module.socios.title": "Member Management",
    "module.socios.detail": "Members database",
    "module.utentes.title": "Client Management",
    "module.utentes.detail": "Clients database",
    "module.dispositivos.title": "Device Management",
    "module.dispositivos.detail": "Devices database",
    "module.atividades.title": "Activity Management",
    "module.atividades.detail": "Activity planning and records",
    "activities.eyebrow": "Weekly timetable",
    "activities.copy": "Plan the week's activities by day, time and teacher.",
    "activities.createButton": "Create Activity",
    "activities.closeCreateButton": "Close",
    "activities.form.addTitle": "Add activity",
    "activities.form.editTitle": "Edit activity",
    "activities.form.viewTitle": "View activity",
    "activities.printWeek": "Print week",
    "activities.printTitle": "Weekly activities timetable",
    "activities.printScheduleTitle": "Activities Timetable",
    "activities.weekPrevious": "Previous week",
    "activities.weekNext": "Next week",
    "activities.weekRange": "{start} to {end}",
    "activities.day": "Day",
    "activities.start": "Start",
    "activities.end": "End",
    "activities.name": "Activity name",
    "activities.teacher": "Teacher",
    "activities.save": "Save",
    "activities.update": "Update",
    "activities.clear": "Clear",
    "activities.week": "Monday to Friday",
    "activities.weekTitle": "School timetable",
    "activities.lunch": "Lunch",
    "activities.emptyDay": "No activities",
    "activities.emptyWeek": "There are no activities in this week yet.",
    "activities.remove": "Remove",
    "activities.edit": "Edit",
    "activities.view": "View",
    "activities.dragHandle": "Drag to reorder",
    "activities.dropHere": "Drop here",
    "activities.confirmDelete": "Remove this activity?",
    "activities.validationRequired": "Fill in the day, time, activity name and teacher.",
    "activities.validationTime": "The end time must be after the start time.",
    "activities.saved": "Activity saved.",
    "activities.deleted": "Activity removed.",
    "activities.cleared": "Week cleared.",
    "activities.count.one": "1 activity",
    "activities.count.other": "{count} activities",
    "activities.day.monday": "Monday",
    "activities.day.tuesday": "Tuesday",
    "activities.day.wednesday": "Wednesday",
    "activities.day.thursday": "Thursday",
    "activities.day.friday": "Friday",
    "activities.dayShort.monday": "Mon",
    "activities.dayShort.tuesday": "Tue",
    "activities.dayShort.wednesday": "Wed",
    "activities.dayShort.thursday": "Thu",
    "activities.dayShort.friday": "Fri",
    "module.enter": "Enter",
    "global.eyebrow": "Global tool",
    "global.history.title": "Global history",
    "global.history.copy": "Shared record of changes made in members, clients, devices and activities.",
    "global.history.socios.title": "Members",
    "global.history.socios.copy": "Changes in member records and fees.",
    "global.history.utentes.title": "Clients",
    "global.history.utentes.copy": "Changes in records, sections and attachments.",
    "global.history.dispositivos.title": "Devices",
    "global.history.dispositivos.copy": "Changes in lists, repairs, states, attachments and CSV.",
    "global.history.atividades.title": "Activities",
    "global.history.atividades.copy": "Changes in schedule, attendance and reports.",
    "global.users.title": "Users and permissions",
    "global.users.copy": "Single management area for administrators, users and access to each branch.",
    "global.users.admin.title": "Administrator",
    "global.users.admin.copy": "Full access to the website.",
    "global.users.manager.title": "Branch manager",
    "global.users.manager.copy": "Limited access to members, clients, devices or activities.",
    "global.users.viewer.title": "Viewer",
    "global.users.viewer.copy": "Read-only access when needed.",
    "global.manuals.title": "Manuals",
    "global.manuals.copy": "Shared area to consult branch manuals and technical guides.",
    "global.manuals.socios.title": "Members manual",
    "global.manuals.socios.copy": "Fees, exports and member management.",
    "global.manuals.utentes.title": "Clients manual",
    "global.manuals.utentes.copy": "Records, sections, PDF attachments, genogram and ecomap.",
    "global.manuals.dispositivos.title": "Devices manual",
    "global.manuals.dispositivos.copy": "Repairs, states, statistics, attachments and CSV.",
    "global.manuals.atividades.title": "Activities manual",
    "global.manuals.atividades.copy": "To be prepared when the activities module is complete.",
    "users.title": "Users",
    "users.subtitle": "Create new access and edit permissions for existing users.",
    "users.refresh": "Refresh",
    "users.createTitle": "Create user",
    "users.createHint": "The ID is created automatically in Supabase Auth.",
    "users.editTitle": "Edit user",
    "users.editHint": "Choose a user in the list to edit.",
    "users.name": "Name",
    "users.role": "Profile",
    "users.roleAdmin": "Administrator",
    "users.roleOperator": "Operator",
    "users.roleViewer": "Viewer",
    "users.createButton": "Create user",
    "users.active": "Active",
    "users.inactive": "Inactive",
    "users.status": "Status",
    "users.entryDate": "Entry",
    "users.exitDate": "Exit",
    "users.actions": "Actions",
    "users.clear": "Clear",
    "users.save": "Save changes",
    "users.empty": "No users registered.",
    "users.self": "Current account",
    "users.adminOnly": "Only administrators can manage users.",
    "access.restricted": "Restricted access.",
    "access.areaRestricted": "This area is restricted for this user.",
    "access.usersRestricted": "You do not have permission to manage users.",
    "access.historyRestricted": "You do not have permission to view the global history.",
    "access.actionRestricted": "You do not have permission to use this action.",
    "users.saved": "User access saved.",
    "users.created": "User created.",
    "users.deleted": "User deleted.",
    "users.activated": "User activated.",
    "users.deactivated": "User deactivated.",
    "permissions.area": "Area",
    "permissions.view": "View",
    "permissions.edit": "Edit",
    "permissions.viewSensitive": "View sensitive data",
    "permissions.editSensitive": "Edit sensitive data",
    "permissions.export": "Export",
    "permissions.delete": "Delete",
    "permissions.central": "General permissions",
    "permissions.manageUsers": "Manage users",
    "permissions.viewHistory": "View global history",
    "permissions.socios": "Members",
    "permissions.utentes": "Clients",
    "permissions.dispositivos": "Devices",
    "permissions.atividades": "Activities",
    "permissions.notApplicable": "-",
  },
};

const getTranslation = (key, language = getLanguage()) =>
  translations[language]?.[key] || translations.pt[key] || key;

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  const nextLabel = getTranslation(isDark ? "menu.light" : "menu.dark");
  const nextIcon = isDark ? "sun" : "moon";

  document.body.classList.toggle("dark-mode", isDark);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const hasLabel = Boolean(button.querySelector("span"));
    button.setAttribute("title", nextLabel);
    button.setAttribute("aria-label", nextLabel);
    button.innerHTML = `<i data-lucide="${nextIcon}"></i>${hasLabel ? `<span>${nextLabel}</span>` : ""}`;
  });
  refreshIcons();
};

const getTheme = () =>
  localStorage.getItem(themeStorageKey) ||
  localStorage.getItem(legacyThemeStorageKey) ||
  localStorage.getItem(dispositivosThemeStorageKey) ||
  "light";

const toggleTheme = () => {
  const nextTheme = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  localStorage.setItem(legacyThemeStorageKey, nextTheme);
  localStorage.setItem(dispositivosThemeStorageKey, nextTheme);
  applyTheme(nextTheme);
  closeToolsMenus();
};

const getLanguage = () => {
  for (const key of languageStorageKeys) {
    if (localStorage.getItem(key) === "en") return "en";
  }
  return "pt";
};

const persistLanguage = (language) => {
  languageStorageKeys.forEach((key) => localStorage.setItem(key, language));
};

const translateStaticContent = (language) => {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = getTranslation(node.dataset.i18n, language);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.setAttribute("title", getTranslation(node.dataset.i18nTitle, language));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", getTranslation(node.dataset.i18nAriaLabel, language));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", getTranslation(node.dataset.i18nPlaceholder, language));
  });

  const titleKey = document.body?.dataset.titleKey;
  if (titleKey) {
    document.title = `${getTranslation(titleKey, language)} - ${getTranslation("app.title", language)}`;
  } else if (document.body?.dataset.centralPage === "dashboard") {
    document.title = getTranslation("app.title", language);
  }
};

const translateStatusChips = (language) => {
  document.querySelectorAll("[data-module-status]").forEach((chip) => {
    if (chip.classList.contains("status-offline")) {
      chip.textContent = getTranslation("module.status.offline", language);
      return;
    }
    if (chip.dataset.statusKind === "online") {
      chip.textContent = getTranslation("module.status.online", language);
      return;
    }
    chip.textContent = getTranslation("module.status.integrated", language);
  });
};

const applyLanguage = (language, { persist = false } = {}) => {
  if (persist) {
    persistLanguage(language);
  }
  document.documentElement.lang = language === "pt" ? "pt-PT" : "en";
  translateStaticContent(language);
  translateStatusChips(language);
  window.__CENTRAL_RENDER_ACTIVITIES?.();
  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    const label = getTranslation(language === "pt" ? "language.ptLabel" : "language.enLabel", language);
    button.setAttribute("title", label);
    button.setAttribute("aria-label", label);
  });
  applyTheme(getTheme());
  refreshLanguageDialog(language);
  if (document.querySelector("#centralUsersDialog")?.open) {
    refreshPermissionGrids();
  }
};

const languageOptionMarkup = (value, flag, titleKey, regionKey, activeLanguage) => `
  <button class="language-option${activeLanguage === value ? " is-active" : ""}" type="button" data-language-option="${value}">
    <span class="language-flag" aria-hidden="true">${flag}</span>
    <span class="language-copy">
      <strong>${getTranslation(titleKey, activeLanguage)}</strong>
      <span>${getTranslation(regionKey, activeLanguage)}</span>
    </span>
  </button>
`;

const languageDialogMarkup = (language) => `
  <div class="language-modal-backdrop" data-language-modal>
    <section class="language-modal" role="dialog" aria-modal="true" aria-labelledby="centralLanguageTitle">
      <header class="language-modal-head">
        <div>
          <h2 id="centralLanguageTitle">${getTranslation("language.title", language)}</h2>
          <p>${getTranslation("language.subtitle", language)}</p>
        </div>
        <button class="language-close" type="button" data-language-close title="${getTranslation("language.close", language)}" aria-label="${getTranslation("language.close", language)}">
          <i data-lucide="x"></i>
        </button>
      </header>
      <div class="language-options" role="group" aria-label="${getTranslation("language.title", language)}">
        ${languageOptionMarkup("pt", "&#127477;&#127481;", "language.portuguese", "language.portugal", language)}
        ${languageOptionMarkup("en", "&#127468;&#127463;", "language.english", "language.uk", language)}
      </div>
    </section>
  </div>
`;

const closeLanguageDialog = () => {
  document.querySelector("[data-language-modal]")?.remove();
};

const refreshLanguageDialog = (language) => {
  const modal = document.querySelector("[data-language-modal]");
  if (!modal) return;
  modal.outerHTML = languageDialogMarkup(language);
  refreshIcons();
};

const openLanguageDialog = () => {
  closeToolsMenus();
  closeLanguageDialog();
  document.body.insertAdjacentHTML("beforeend", languageDialogMarkup(getLanguage()));
  refreshIcons();
  document.querySelector(".language-option.is-active")?.focus();
};

const selectLanguage = (language) => {
  applyLanguage(language, { persist: true });
  closeLanguageDialog();
};

const closeToolsMenus = () => {
  document.querySelectorAll("[data-tools-menu]").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll("details.global-menu-wrap[open]").forEach((menu) => {
    menu.open = false;
  });
};

const toggleToolsMenu = (button) => {
  const menuId = button.getAttribute("aria-controls");
  const menu = menuId ? document.getElementById(menuId) : null;
  if (!menu) return;
  const shouldOpen = menu.hidden;
  closeToolsMenus();
  menu.hidden = !shouldOpen;
  button.setAttribute("aria-expanded", String(shouldOpen));
};

const statusText = (item) => {
  const language = getLanguage();
  if (item.status === "integrado") return getTranslation("module.status.integrated", language);
  return item.online ? getTranslation("module.status.online", language) : getTranslation("module.status.offline", language);
};

const updateStatus = (item) => {
  const chip = document.querySelector(`[data-module-status="${item.id}"]`);
  const card = document.querySelector(`[data-module-card="${item.id}"]`);
  if (!chip || !card) return;

  chip.dataset.statusKind = item.status === "integrado" ? "integrated" : item.online ? "online" : "offline";
  chip.textContent = statusText(item);
  chip.classList.remove("status-checking", "status-online", "status-offline");
  chip.classList.add(item.online ? "status-online" : "status-offline");
  card.classList.toggle("is-offline", !item.online);
};

const refreshStatus = async () => {
  const button = document.querySelector("#refreshStatus");
  button?.classList.add("is-loading");

  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    payload.modules.forEach(updateStatus);
  } catch (_error) {
    document.querySelectorAll("[data-module-status]").forEach((chip) => {
      chip.dataset.statusKind = "offline";
      chip.textContent = getTranslation("module.status.offline");
      chip.classList.remove("status-checking", "status-online");
      chip.classList.add("status-offline");
    });
  } finally {
    button?.classList.remove("is-loading");
    refreshIcons();
  }
};

const centralAreaIds = ["socios", "utentes", "dispositivos", "atividades"];
const centralAreaActions = ["view", "edit", "view_sensitive", "edit_sensitive", "export", "delete"];

const emptyAreaPermissions = () => ({
  view: false,
  edit: false,
  view_sensitive: false,
  edit_sensitive: false,
  export: false,
  delete: false,
});

const fullCentralPermissions = () => {
  const all = (sensitive = true, deleteAllowed = true) => ({
    view: true,
    edit: true,
    view_sensitive: Boolean(sensitive),
    edit_sensitive: Boolean(sensitive),
    export: true,
    delete: Boolean(deleteAllowed),
  });
  const defaults = {
    central: { manage_users: true, view_history: true },
    socios: all(false, true),
    utentes: all(true, true),
    dispositivos: all(false, true),
    atividades: all(false, false),
  };
  return JSON.parse(JSON.stringify(defaults));
};

const emptyCentralPermissions = () => ({
  central: { manage_users: false, view_history: false },
  socios: emptyAreaPermissions(),
  utentes: emptyAreaPermissions(),
  dispositivos: emptyAreaPermissions(),
  atividades: emptyAreaPermissions(),
});

// New users start with access selected. Once stored, every individual checkbox is authoritative.
const defaultCentralPermissionsForRole = () => fullCentralPermissions();

const boolPermission = (value) => value === true || value === "true" || value === 1 || value === "1";
const hasPermissionValue = (permissions, action) => Object.prototype.hasOwnProperty.call(permissions, action);

const normalizeCentralPermissions = (input) => {
  const source = input && typeof input === "object" ? input : {};
  const hasStoredMatrix =
    Object.keys(source.central || {}).length > 0 ||
    centralAreaIds.some((area) => Object.keys(source[area] || {}).length > 0);
  const normalized = hasStoredMatrix ? emptyCentralPermissions() : fullCentralPermissions();
  normalized.central = {
    manage_users: boolPermission(source.central?.manage_users ?? normalized.central.manage_users),
    view_history: boolPermission(source.central?.view_history ?? normalized.central.view_history),
  };
  centralAreaIds.forEach((area) => {
    const sourceArea = source[area] && typeof source[area] === "object" ? source[area] : {};
    const nextArea = { ...normalized[area] };
    centralAreaActions.forEach((action) => {
      if (hasPermissionValue(sourceArea, action)) {
        nextArea[action] = boolPermission(sourceArea[action]);
      }
    });
    if (hasPermissionValue(sourceArea, "view") && !boolPermission(sourceArea.view)) {
      centralAreaActions.forEach((action) => {
        nextArea[action] = false;
      });
    } else {
      if (hasPermissionValue(sourceArea, "edit") && !boolPermission(sourceArea.edit)) {
        nextArea.delete = false;
        nextArea.edit_sensitive = false;
      }
      if (hasPermissionValue(sourceArea, "view_sensitive") && !boolPermission(sourceArea.view_sensitive)) {
        nextArea.edit_sensitive = false;
        if (area === "utentes") nextArea.export = false;
      }

      if (nextArea.edit) nextArea.view = true;
      if (nextArea.export) {
        nextArea.view = true;
        if (area === "utentes") nextArea.view_sensitive = true;
      }
      if (nextArea.delete) {
        nextArea.view = true;
        nextArea.edit = true;
      }
      if (nextArea.view_sensitive) nextArea.view = true;
      if (nextArea.edit_sensitive) {
        nextArea.view = true;
        nextArea.edit = true;
        nextArea.view_sensitive = true;
      }
    }
    if (area !== "utentes") {
      nextArea.view_sensitive = false;
      nextArea.edit_sensitive = false;
    }
    if (area === "atividades") {
      nextArea.delete = false;
    }
    normalized[area] = nextArea;
  });
  return normalized;
};

const centralHasPermission = (profile, area, action) => {
  const permissions = normalizeCentralPermissions(profile?.permissions);
  if (area === "central") return Boolean(permissions.central?.[action]);
  return Boolean(permissions[area]?.[action]);
};

const centralCanManageUsers = (profile) => centralHasPermission(profile, "central", "manage_users");

const centralAreaFromHref = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return "";
    const match = url.pathname.match(/^\/area\/(socios|utentes|dispositivos|atividades)(?:\/|$)/);
    return match?.[1] || "";
  } catch (_error) {
    return "";
  }
};

const setCentralRestrictedAccess = (node, restricted, message) => {
  if (!node) return;
  node.hidden = false;
  node.classList.toggle("is-restricted", Boolean(restricted));
  node.removeAttribute("aria-disabled");
  if (restricted) {
    node.dataset.accessRestricted = "true";
    node.dataset.restrictedMessage = message || getTranslation("access.restricted");
  } else {
    delete node.dataset.accessRestricted;
    delete node.dataset.restrictedMessage;
  }
};

const showCentralRestrictedAccess = (message) => {
  window.alert(message || getTranslation("access.restricted"));
};

const centralRestrictedMessageForClick = (target) => {
  const explicitNode = target.closest("[data-access-restricted='true']");
  if (explicitNode) return explicitNode.dataset.restrictedMessage || getTranslation("access.restricted");

  const profile = window.CENTRAL_USER_PROFILE;
  if (!profile) return "";

  const permissionNode = target.closest("[data-requires-permission-area][data-requires-permission-action]");
  if (permissionNode) {
    const area = permissionNode.dataset.requiresPermissionArea;
    const action = permissionNode.dataset.requiresPermissionAction;
    if (area && action && !centralHasPermission(profile, area, action)) {
      return permissionNode.dataset.restrictedMessage || getTranslation("access.actionRestricted");
    }
  }

  const usersNode = target.closest("[data-users-toggle]");
  if (usersNode && !centralCanManageUsers(profile)) return getTranslation("access.usersRestricted");

  const link = target.closest("a[href]");
  if (!link) return "";
  const area = centralAreaFromHref(link.getAttribute("href") || link.href);
  if (area && !centralHasPermission(profile, area, "view")) return getTranslation("access.areaRestricted");

  try {
    const url = new URL(link.getAttribute("href") || link.href, window.location.origin);
    if (url.origin === window.location.origin && url.pathname.startsWith("/historico")) {
      if (!centralHasPermission(profile, "central", "view_history")) return getTranslation("access.historyRestricted");
    }
  } catch (_error) {
    return "";
  }
  return "";
};

const wireCentralRestrictedAccess = () => {
  if (window.__CENTRAL_RESTRICTED_ACCESS_WIRED) return;
  window.__CENTRAL_RESTRICTED_ACCESS_WIRED = true;
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!target) return;
      const message = centralRestrictedMessageForClick(target);
      if (!message) return;
      event.preventDefault();
      event.stopPropagation();
      showCentralRestrictedAccess(message);
    },
    true
  );
};

const applyCentralPermissionsToPage = (profile) => {
  const permissions = normalizeCentralPermissions(profile?.permissions);
  const effectiveProfile = profile ? { ...profile, permissions } : profile;
  window.CENTRAL_USER_PROFILE = effectiveProfile;
  centralAreaIds.forEach((area) => {
    const canView = Boolean(permissions[area]?.view);
    document.querySelectorAll(`[data-module-card="${area}"]`).forEach((node) => {
      setCentralRestrictedAccess(node, !canView, getTranslation("access.areaRestricted"));
    });
    document.querySelectorAll(`a[href^="/area/${area}"]`).forEach((node) => {
      setCentralRestrictedAccess(node, !canView, getTranslation("access.areaRestricted"));
    });
  });
  document.querySelectorAll("[data-users-toggle]").forEach((node) => {
    setCentralRestrictedAccess(node, !centralCanManageUsers(effectiveProfile), getTranslation("access.usersRestricted"));
  });
  document.querySelectorAll('a[href^="/historico"]').forEach((node) => {
    setCentralRestrictedAccess(node, !centralHasPermission(effectiveProfile, "central", "view_history"), getTranslation("access.historyRestricted"));
  });
  document.querySelectorAll("[data-requires-permission-area][data-requires-permission-action]").forEach((node) => {
    const area = node.dataset.requiresPermissionArea;
    const action = node.dataset.requiresPermissionAction;
    setCentralRestrictedAccess(
      node,
      area && action ? !centralHasPermission(effectiveProfile, area, action) : false,
      getTranslation("access.actionRestricted"),
    );
  });
  window.dispatchEvent(new CustomEvent("central-permissions-ready", { detail: effectiveProfile }));
};

wireCentralRestrictedAccess();

window.CENTRAL_PERMISSIONS = {
  normalize: normalizeCentralPermissions,
  has: centralHasPermission,
  canManageUsers: centralCanManageUsers,
  applyToPage: applyCentralPermissionsToPage,
};

const centralUsersState = {
  client: null,
  session: null,
  profile: null,
  users: [],
  editingId: "",
};

const centralAuthStorageKey = "central-mm-auth-token";
const centralAuthStorage = {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: (key) => sessionStorage.removeItem(key),
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const activitiesStorageKey = "central-activities-weekly-calendar-v1";
const activitiesDays = [
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
];
const defaultActivityPeriods = [
  ["09:00", "12:00"],
  ["13:00", "17:00"],
];
const activityLunchPeriod = ["12:00", "13:00"];
const dateIsoPattern = /^\d{4}-\d{2}-\d{2}$/;

const dateToIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateFromIso = (value) => {
  if (!dateIsoPattern.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const weekStartIso = (value = new Date()) => {
  const source = value instanceof Date ? value : dateFromIso(String(value || ""));
  const date = source ? new Date(source.getFullYear(), source.getMonth(), source.getDate()) : new Date();
  const weekday = date.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return dateToIso(date);
};

const addDaysToIso = (iso, days) => {
  const date = dateFromIso(iso) || new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const activityDateFormatter = () =>
  new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatActivityDate = (date) => activityDateFormatter().format(date);

const activitiesState = {
  entries: [],
  selectedWeekStart: weekStartIso(),
  draggedActivityId: "",
  dragPreviewCellKey: "",
  dragPreviewIndex: -1,
  dragImageEl: null,
};

const activityId = () =>
  window.crypto?.randomUUID?.() || `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isActivityDay = (day) => activitiesDays.some((item) => item.key === day);
const isActivityTime = (time) => /^\d{2}:\d{2}$/.test(time || "");

const activitiesElements = () => ({
  root: document.querySelector("[data-activities-calendar]"),
  dialog: document.querySelector("[data-activities-dialog]"),
  dialogCloseBtn: document.querySelector("[data-activities-dialog-close]"),
  form: document.querySelector("[data-activities-form]"),
  grid: document.querySelector("[data-activities-grid]"),
  error: document.querySelector("[data-activities-error]"),
  createBtn: document.querySelector("[data-activities-create]"),
  createLabel: document.querySelector("[data-activities-create-label]"),
  printBtn: document.querySelector("[data-activities-print]"),
  prevWeekBtn: document.querySelector("[data-activities-week-prev]"),
  nextWeekBtn: document.querySelector("[data-activities-week-next]"),
  weekRange: document.querySelector("[data-activities-week-range]"),
  clearBtn: document.querySelector("[data-activities-clear]"),
  formTitle: document.querySelector("[data-activities-form-title]"),
  submitLabel: document.querySelector("[data-activities-submit-label]"),
});

const normalizeActivityEntry = (entry, fallbackWeekStart = activitiesState.selectedWeekStart, fallbackOrder = 0) => {
  const title = String(entry?.title || "").trim();
  const teacher = String(entry?.teacher || "").trim();
  const day = isActivityDay(entry?.day) ? entry.day : "monday";
  const start = isActivityTime(entry?.start) ? entry.start : "09:00";
  const end = isActivityTime(entry?.end) ? entry.end : "";
  const storedWeekStart = dateFromIso(String(entry?.weekStart || "")) ? weekStartIso(entry.weekStart) : fallbackWeekStart;
  const order = Number(entry?.order);
  if (!title || !teacher) return null;
  return {
    id: String(entry?.id || activityId()),
    weekStart: storedWeekStart,
    day,
    start,
    end: end && end > start ? end : "",
    title,
    teacher,
    order: Number.isFinite(order) ? order : fallbackOrder,
  };
};

const loadActivities = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(activitiesStorageKey) || "[]");
    activitiesState.entries = Array.isArray(stored)
      ? stored.map((entry, index) => normalizeActivityEntry(entry, activitiesState.selectedWeekStart, index)).filter(Boolean)
      : [];
  } catch (_error) {
    activitiesState.entries = [];
  }
};

const saveActivities = () => {
  try {
    localStorage.setItem(activitiesStorageKey, JSON.stringify(activitiesState.entries));
  } catch (_error) {
    // O calendario continua editavel na sessao atual mesmo sem localStorage.
  }
};

const selectedWeekActivities = () =>
  activitiesState.entries.filter((entry) => entry.weekStart === activitiesState.selectedWeekStart);

const sortedActivities = () =>
  selectedWeekActivities().sort((left, right) => {
    const dayDiff =
      activitiesDays.findIndex((item) => item.key === left.day) -
      activitiesDays.findIndex((item) => item.key === right.day);
    if (dayDiff !== 0) return dayDiff;
    const [leftPeriodStart, leftPeriodEnd] = activityDisplayPeriod(left);
    const [rightPeriodStart, rightPeriodEnd] = activityDisplayPeriod(right);
    if (leftPeriodStart !== rightPeriodStart) return leftPeriodStart.localeCompare(rightPeriodStart);
    if ((leftPeriodEnd || "") !== (rightPeriodEnd || "")) return (leftPeriodEnd || "").localeCompare(rightPeriodEnd || "");
    const orderDiff = (Number(left.order) || 0) - (Number(right.order) || 0);
    if (orderDiff !== 0) return orderDiff;
    if (left.start !== right.start) return left.start.localeCompare(right.start);
    return left.title.localeCompare(right.title);
  });

const activityCountText = (count) =>
  count === 1
    ? getTranslation("activities.count.one")
    : getTranslation("activities.count.other").replace("{count}", String(count));

const activityTimeText = (entry) => (entry.end ? `${entry.start} - ${entry.end}` : entry.start);

const periodKey = ([start, end]) => `${start}|${end || ""}`;
const periodTimeText = ([start, end]) => (end ? `${start} - ${end}` : start);

const periodContainsActivity = ([start, end], entry) => {
  const activityEnd = entry.end || entry.start;
  if (!end) return entry.start === start && !entry.end;
  return entry.start >= start && activityEnd <= end;
};

const activityDisplayPeriod = (entry) =>
  defaultActivityPeriods.find((period) => periodContainsActivity(period, entry)) || [entry.start, entry.end || ""];

const activityCellKey = (entry) => `${entry.weekStart}|${entry.day}|${periodKey(activityDisplayPeriod(entry))}`;

const activityCellKeyFromElement = (cell) => {
  if (!cell?.dataset?.day || !cell.dataset.period) return "";
  return `${activitiesState.selectedWeekStart}|${cell.dataset.day}|${cell.dataset.period}`;
};

const nextActivityOrderForCell = (entry) =>
  Math.max(
    -1,
    ...activitiesState.entries
      .filter((item) => item.id !== entry.id && activityCellKey(item) === activityCellKey(entry))
      .map((item) => Number(item.order) || 0),
  ) + 1;

const activityPeriods = (entries) => {
  const periods = new Map(defaultActivityPeriods.map((period) => [periodKey(period), period]));
  entries.forEach((entry) => {
    const period = activityDisplayPeriod(entry);
    periods.set(periodKey(period), period);
  });
  return [...periods.values()].sort(([leftStart, leftEnd], [rightStart, rightEnd]) => {
    if (leftStart !== rightStart) return leftStart.localeCompare(rightStart);
    return (leftEnd || "").localeCompare(rightEnd || "");
  });
};

const setActivitiesFeedback = (message = "", kind = "error") => {
  const { error } = activitiesElements();
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
  error.classList.toggle("is-success", kind === "success");
};

const activityWeekRangeText = () => {
  const start = dateFromIso(activitiesState.selectedWeekStart) || new Date();
  const end = addDaysToIso(activitiesState.selectedWeekStart, 4);
  return getTranslation("activities.weekRange")
    .replace("{start}", formatActivityDate(start))
    .replace("{end}", formatActivityDate(end));
};

const updateActivityWeekControls = () => {
  const { weekRange } = activitiesElements();
  if (weekRange) {
    weekRange.textContent = activityWeekRangeText();
  }
};

const isActivityFormOpen = () => {
  const { dialog, form } = activitiesElements();
  return dialog ? dialog.open : Boolean(form && !form.hidden);
};

const setActivityFormOpen = (open) => {
  const { dialog, form, createBtn, createLabel } = activitiesElements();
  if (form) form.hidden = !open;
  if (dialog) {
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }
  if (createBtn) {
    createBtn.classList.toggle("is-active", open);
    createBtn.setAttribute("aria-expanded", String(open));
  }
  if (createLabel) {
    createLabel.textContent = getTranslation(open ? "activities.closeCreateButton" : "activities.createButton");
  }
  refreshIcons();
};

const setActivitiesFormMode = (mode) => {
  const normalizedMode = mode === "view" ? "view" : mode ? "edit" : "add";
  const { formTitle, submitLabel } = activitiesElements();
  if (formTitle) {
    formTitle.textContent = getTranslation(
      normalizedMode === "view"
        ? "activities.form.viewTitle"
        : normalizedMode === "edit"
          ? "activities.form.editTitle"
          : "activities.form.addTitle",
    );
  }
  if (submitLabel) {
    submitLabel.textContent = getTranslation(normalizedMode === "edit" ? "activities.update" : "activities.save");
  }
};

const setActivityFormReadOnly = (readonly) => {
  const { form, clearBtn } = activitiesElements();
  if (!form) return;
  form.classList.toggle("is-readonly", readonly);
  form.querySelectorAll("input, select").forEach((field) => {
    if (field.type !== "hidden") field.disabled = readonly;
  });
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.hidden = readonly;
  if (clearBtn) clearBtn.hidden = readonly;
};

const resetActivitiesForm = () => {
  const { form } = activitiesElements();
  if (!form) return;
  setActivityFormReadOnly(false);
  form.reset();
  form.elements.id.value = "";
  form.elements.day.value = "monday";
  form.elements.start.value = "09:00";
  form.elements.end.value = "";
  setActivitiesFormMode(false);
  setActivitiesFeedback("");
};

const renderActivitySlot = (entry) => `
  <article class="activity-slot" draggable="true" data-activity-id="${escapeHtml(entry.id)}">
    <div class="activity-slot-main">
      <time>${escapeHtml(activityTimeText(entry))}</time>
      <strong>${escapeHtml(entry.title)}</strong>
      <span><i data-lucide="graduation-cap"></i>${escapeHtml(entry.teacher)}</span>
    </div>
    <div class="activity-slot-actions">
      <button class="icon-link" type="button" data-activity-action="view" data-id="${escapeHtml(entry.id)}" data-requires-permission-area="atividades" data-requires-permission-action="view" title="${escapeHtml(getTranslation("activities.view"))}" aria-label="${escapeHtml(getTranslation("activities.view"))}">
        <i data-lucide="eye"></i>
      </button>
      <button class="icon-link" type="button" data-activity-action="edit" data-id="${escapeHtml(entry.id)}" data-requires-permission-area="atividades" data-requires-permission-action="edit" title="${escapeHtml(getTranslation("activities.edit"))}" aria-label="${escapeHtml(getTranslation("activities.edit"))}">
        <i data-lucide="pencil"></i>
      </button>
      <button class="icon-link danger-link" type="button" data-activity-action="delete" data-id="${escapeHtml(entry.id)}" data-requires-permission-area="atividades" data-requires-permission-action="edit" title="${escapeHtml(getTranslation("activities.remove"))}" aria-label="${escapeHtml(getTranslation("activities.remove"))}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  </article>
`;

const renderActivityPreviewSlot = (entry) => `
  <article class="activity-slot activity-slot-preview" data-activity-preview="true" aria-hidden="true">
    <div class="activity-slot-main">
      <time>${escapeHtml(activityTimeText(entry))}</time>
      <strong>${escapeHtml(entry.title)}</strong>
      <span><i data-lucide="graduation-cap"></i>${escapeHtml(entry.teacher)}</span>
    </div>
    <div class="activity-slot-actions activity-slot-preview-actions">
      <span class="icon-link" aria-hidden="true"><i data-lucide="eye"></i></span>
      <span class="icon-link" aria-hidden="true"><i data-lucide="pencil"></i></span>
      <span class="icon-link danger-link" aria-hidden="true"><i data-lucide="trash-2"></i></span>
    </div>
  </article>
`;

const activityPreviewElement = (entry) => {
  const template = document.createElement("template");
  template.innerHTML = renderActivityPreviewSlot(entry).trim();
  return template.content.firstElementChild;
};

const cellActivitySlots = (cell, draggedId = "") =>
  [...cell.querySelectorAll(".activity-slot:not(.activity-slot-preview)")].filter(
    (slot) => slot.dataset.activityId !== draggedId,
  );

const renderActivityCellEntries = (entries) => entries.map(renderActivitySlot).join("");

const renderActivityEmptyCell = () => "";

const isActivityLunchAnchor = (period) => periodKey(period) === periodKey(defaultActivityPeriods[0]);

const renderActivityLunchRow = () => `
  <div class="timetable-row timetable-lunch-row" role="row" aria-label="${escapeHtml(getTranslation("activities.lunch"))}">
    <div class="timetable-time-cell timetable-lunch-time" role="rowheader">${escapeHtml(periodTimeText(activityLunchPeriod))}</div>
    <div class="timetable-lunch-cell" role="cell" aria-colspan="${activitiesDays.length}">
      ${escapeHtml(getTranslation("activities.lunch"))}
    </div>
  </div>
`;

const currentActivityIndexInCell = (entry) =>
  sortedActivities()
    .filter((item) => activityCellKey(item) === activityCellKey(entry))
    .findIndex((item) => item.id === entry.id);

const clearActivityDropPreview = () => {
  document.querySelectorAll(".activity-slot-preview").forEach((preview) => preview.remove());
  document.querySelectorAll(".timetable-cell.is-drop-target, .timetable-cell.is-valid-drop-zone").forEach((cell) => {
    cell.classList.remove("is-drop-target", "is-valid-drop-zone");
  });
  activitiesState.dragPreviewCellKey = "";
  activitiesState.dragPreviewIndex = -1;
};

const placeActivityDropPreview = (cell, insertionIndex, entry) => {
  if (!cell || !entry) return;
  const cellKey = activityCellKeyFromElement(cell);
  const slots = cellActivitySlots(cell, entry.id);
  const targetIndex = Math.max(0, Math.min(slots.length, insertionIndex));
  const existingPreview = document.querySelector(".activity-slot-preview");
  if (
    existingPreview &&
    existingPreview.parentElement === cell &&
    activitiesState.dragPreviewCellKey === cellKey &&
    activitiesState.dragPreviewIndex === targetIndex
  ) {
    return;
  }
  clearActivityDropPreview();
  const preview = existingPreview || activityPreviewElement(entry);
  const beforeSlot = slots[targetIndex] || null;
  cell.classList.add("is-valid-drop-zone", "is-drop-target");
  if (beforeSlot) {
    cell.insertBefore(preview, beforeSlot);
  } else {
    cell.appendChild(preview);
  }
  activitiesState.dragPreviewCellKey = cellKey;
  activitiesState.dragPreviewIndex = targetIndex;
  refreshIcons();
};

const activityDropIndexFromEvent = (event, cell) => {
  const draggedId = activitiesState.draggedActivityId || event.dataTransfer?.getData("text/plain") || "";
  const slots = cellActivitySlots(cell, draggedId);
  if (!slots.length) return 0;
  const pointerY = event.clientY;
  for (const [index, slot] of slots.entries()) {
    const bounds = slot.getBoundingClientRect();
    if (pointerY < bounds.top + bounds.height / 2) {
      return index;
    }
  }
  return slots.length;
};

const eventElement = (event) => (event.target instanceof Element ? event.target : event.target?.parentElement);

const clearActivityDragImage = () => {
  activitiesState.dragImageEl?.remove();
  activitiesState.dragImageEl = null;
};

const setActivityDragImage = (event, slot) => {
  if (!event.dataTransfer?.setDragImage || !slot) return;
  clearActivityDragImage();
  const bounds = slot.getBoundingClientRect();
  const dragImage = slot.cloneNode(true);
  dragImage.classList.remove("is-dragging");
  dragImage.classList.add("activity-drag-image");
  dragImage.removeAttribute("draggable");
  dragImage.setAttribute("aria-hidden", "true");
  dragImage.style.width = `${bounds.width}px`;
  dragImage.style.height = `${bounds.height}px`;
  document.body.appendChild(dragImage);
  activitiesState.dragImageEl = dragImage;
  event.dataTransfer.setDragImage(dragImage, Math.min(bounds.width / 2, 140), 24);
};

const beginActivityDragPreview = (slot, entry) => {
  const cell = slot.closest(".timetable-cell");
  if (!cell || !entry) return;
  const currentIndex = currentActivityIndexInCell(entry);
  placeActivityDropPreview(cell, currentIndex < 0 ? 0 : currentIndex, entry);
  window.requestAnimationFrame(() => {
    slot.classList.add("is-dragging");
  });
};

const finishActivityDragPreview = () => {
  activitiesState.draggedActivityId = "";
  clearActivityDragImage();
  clearActivityDropPreview();
  document.querySelectorAll(".activity-slot.is-dragging").forEach((slot) => slot.classList.remove("is-dragging"));
};

const renderActivitiesCalendar = () => {
  const { root, grid } = activitiesElements();
  if (!root || !grid) return;
  updateActivityWeekControls();
  const entries = sortedActivities();
  const periods = activityPeriods(entries);
  grid.classList.toggle("is-empty", entries.length === 0);
  grid.innerHTML = `
    <div class="school-timetable" role="table" aria-label="${escapeHtml(getTranslation("activities.weekTitle"))}">
      <div class="timetable-row timetable-head" role="row">
        <div class="timetable-time-cell" role="columnheader">${escapeHtml(getTranslation("activities.start"))}</div>
        ${activitiesDays
          .map((day, index) => {
            const dayDate = addDaysToIso(activitiesState.selectedWeekStart, index);
            return `
              <div class="timetable-day-head" role="columnheader">
                <span>${escapeHtml(getTranslation(`activities.dayShort.${day.key}`))}</span>
                <strong>${escapeHtml(getTranslation(`activities.day.${day.key}`))}</strong>
                <small>${escapeHtml(formatActivityDate(dayDate))}</small>
              </div>
            `;
          })
          .join("")}
      </div>
      ${periods
        .map((period) => {
          const [start, end] = period;
          const currentPeriodKey = periodKey(period);
          const periodRow = `
            <div class="timetable-row" role="row">
              <div class="timetable-time-cell" role="rowheader">${escapeHtml(periodTimeText(period))}</div>
              ${activitiesDays
                .map((day) => {
                  const cellEntries = entries.filter(
                    (entry) => entry.day === day.key && periodKey(activityDisplayPeriod(entry)) === currentPeriodKey,
                  );
                  return `
                    <div class="timetable-cell${cellEntries.length ? " has-activity" : ""}" role="cell" data-day="${escapeHtml(day.key)}" data-period="${escapeHtml(periodKey(period))}" data-drop-label="${escapeHtml(getTranslation("activities.dropHere"))}">
                      ${
                        cellEntries.length
                          ? renderActivityCellEntries(cellEntries)
                          : renderActivityEmptyCell()
                      }
                    </div>
                  `;
                })
                .join("")}
            </div>
          `;
          return `${periodRow}${isActivityLunchAnchor(period) ? renderActivityLunchRow() : ""}`;
        })
        .join("")}
    </div>
  `;
  refreshIcons();
  if (window.CENTRAL_USER_PROFILE) {
    applyCentralPermissionsToPage(window.CENTRAL_USER_PROFILE);
  }
};

const validateActivityPayload = (payload) => {
  if (!payload.day || !payload.start || !payload.title || !payload.teacher) {
    return getTranslation("activities.validationRequired");
  }
  if (payload.end && payload.end <= payload.start) {
    return getTranslation("activities.validationTime");
  }
  return "";
};

const handleActivitySubmit = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    id: String(data.get("id") || "").trim(),
    weekStart: activitiesState.selectedWeekStart,
    day: String(data.get("day") || "monday"),
    start: String(data.get("start") || "").trim(),
    end: String(data.get("end") || "").trim(),
    title: String(data.get("title") || "").trim(),
    teacher: String(data.get("teacher") || "").trim(),
  };
  const validation = validateActivityPayload(payload);
  if (validation) {
    setActivitiesFeedback(validation);
    return;
  }
  const entry = normalizeActivityEntry({ ...payload, id: payload.id || activityId() });
  if (!entry) {
    setActivitiesFeedback(getTranslation("activities.validationRequired"));
    return;
  }
  const existingIndex = activitiesState.entries.findIndex((item) => item.id === entry.id);
  const existingEntry = existingIndex >= 0 ? activitiesState.entries[existingIndex] : null;
  entry.order =
    existingEntry && activityCellKey(existingEntry) === activityCellKey(entry)
      ? existingEntry.order
      : nextActivityOrderForCell(entry);
  if (existingIndex >= 0) {
    activitiesState.entries.splice(existingIndex, 1, entry);
  } else {
    activitiesState.entries.push(entry);
  }
  saveActivities();
  resetActivitiesForm();
  setActivityFormOpen(false);
  renderActivitiesCalendar();
  setActivitiesFeedback(getTranslation("activities.saved"), "success");
};

const fillActivityForm = (entry) => {
  const { form } = activitiesElements();
  if (!form || !entry) return;
  activitiesState.selectedWeekStart = entry.weekStart;
  updateActivityWeekControls();
  form.elements.id.value = entry.id;
  form.elements.day.value = entry.day;
  form.elements.start.value = entry.start;
  form.elements.end.value = entry.end;
  form.elements.title.value = entry.title;
  form.elements.teacher.value = entry.teacher;
};

const viewActivity = (id) => {
  const { form } = activitiesElements();
  const entry = activitiesState.entries.find((item) => item.id === id);
  if (!form || !entry) return;
  fillActivityForm(entry);
  setActivitiesFormMode("view");
  setActivityFormReadOnly(true);
  setActivityFormOpen(true);
  setActivitiesFeedback("");
};

const editActivity = (id) => {
  const { form } = activitiesElements();
  const entry = activitiesState.entries.find((item) => item.id === id);
  if (!form || !entry) return;
  fillActivityForm(entry);
  setActivityFormReadOnly(false);
  setActivitiesFormMode(true);
  setActivityFormOpen(true);
  setActivitiesFeedback("");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  form.elements.title.focus();
};

const deleteActivity = (id) => {
  const entry = activitiesState.entries.find((item) => item.id === id);
  if (!entry) return;
  if (!window.confirm(getTranslation("activities.confirmDelete"))) return;
  activitiesState.entries = activitiesState.entries.filter((item) => item.id !== id);
  saveActivities();
  renderActivitiesCalendar();
  setActivitiesFeedback(getTranslation("activities.deleted"), "success");
};

const activityPrintDocument = () => {
  const entries = sortedActivities();
  const periods = activityPeriods(entries);
  const dayHeaders = activitiesDays
    .map((day, index) => {
      const dayDate = addDaysToIso(activitiesState.selectedWeekStart, index);
      return `<th><strong>${escapeHtml(getTranslation(`activities.day.${day.key}`))}</strong><small>${escapeHtml(formatActivityDate(dayDate))}</small></th>`;
    })
    .join("");
  const rows = periods
    .map((period) => {
      const periodText = escapeHtml(periodTimeText(period));
      const currentPeriodKey = periodKey(period);
      const cells = activitiesDays
        .map((day) => {
          const cellEntries = entries.filter(
            (entry) => entry.day === day.key && periodKey(activityDisplayPeriod(entry)) === currentPeriodKey,
          );
          const content = cellEntries.length
            ? `<div class="activity-list">${cellEntries
              .map(
                (entry) => `
                  <article>
                    <strong>${escapeHtml(activityTimeText(entry))}</strong>
                    <span>${escapeHtml(entry.title)}</span>
                    <small>${escapeHtml(entry.teacher)}</small>
                  </article>
                `,
              )
              .join("")}</div>`
            : "";
          return `<td>${content}</td>`;
        })
        .join("");
      const periodRow = `<tr class="activity-row"><th>${periodText}</th>${cells}</tr>`;
      const lunchRow = `<tr class="lunch-row"><th>${escapeHtml(periodTimeText(activityLunchPeriod))}</th><td colspan="${activitiesDays.length}">${escapeHtml(getTranslation("activities.lunch"))}</td></tr>`;
      return `${periodRow}${isActivityLunchAnchor(period) ? lunchRow : ""}`;
    })
    .join("");
  return `<!doctype html>
<html lang="${escapeHtml(getLanguage() === "en" ? "en" : "pt")}">
<head>
  <meta charset="utf-8">
  <title></title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { height: 210mm; margin: 0; overflow: hidden; padding: 0; width: 297mm; }
    body { color: #081614; font-family: Arial, sans-serif; font-size: 10px; }
    .print-sheet {
      display: flex;
      flex-direction: column;
      gap: 3mm;
      height: 210mm;
      overflow: hidden;
      padding: 8mm 9mm 7mm;
      width: 297mm;
    }
    header { align-items: end; border-bottom: 2px solid #23776b; display: flex; justify-content: space-between; padding-bottom: 2mm; }
    h1 { font-size: 20px; line-height: 1.05; margin: 0; }
    p { color: #506560; font-size: 11px; font-weight: 800; margin: 0; }
    table { border: 2px solid #8fb2ab; border-collapse: collapse; flex: 1; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #b8c9c5; padding: 2mm; vertical-align: top; }
    thead th { background: #e6f2ef; border-bottom: 2px solid #8fb2ab; text-align: center; vertical-align: middle; }
    thead th.time-head,
    tbody th { width: 28mm; }
    tbody th { background: #f5f8f7; color: #005f56; font-size: 11px; text-align: center; vertical-align: middle; white-space: nowrap; }
    tbody tr.activity-row { height: 63mm; }
    tbody tr.lunch-row { height: 12mm; }
    tbody tr.lunch-row th, tbody tr.lunch-row td { border-bottom: 2px solid #8fb2ab; border-top: 2px solid #8fb2ab; }
    .lunch-row th, .lunch-row td { background: #eef4f2; color: #506560; font-size: 12px; font-weight: 900; text-align: center; vertical-align: middle; }
    .lunch-row td { text-transform: uppercase; }
    th strong, th small { display: block; }
    th strong { font-size: 11px; line-height: 1.15; text-transform: uppercase; }
    th small { color: #506560; font-size: 9px; font-weight: 700; margin-top: 1mm; }
    td { background: #ffffff; }
    .activity-list { display: grid; gap: 1.8mm; max-height: 58mm; overflow: hidden; }
    article { border: 1px solid #c8d8d4; border-left: 3px solid #23776b; border-radius: 2mm; break-inside: avoid; padding: 1.6mm 2mm; }
    article strong, article span, article small { display: block; overflow-wrap: anywhere; }
    article strong { color: #005f56; font-size: 10px; line-height: 1.15; }
    article span { font-size: 11px; font-weight: 800; line-height: 1.2; margin-top: 0.8mm; }
    article small { color: #506560; font-size: 9px; font-weight: 700; line-height: 1.15; margin-top: 0.8mm; }
    @media print {
      html, body { height: 210mm; overflow: hidden; width: 297mm; }
      .print-sheet { break-after: avoid; page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <main class="print-sheet">
    <header>
      <h1>${escapeHtml(getTranslation("activities.printScheduleTitle"))}</h1>
      <p>${escapeHtml(activityWeekRangeText())}</p>
    </header>
    <table>
      <thead><tr><th class="time-head"></th>${dayHeaders}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
};

const printActivityWeek = () => {
  const printFrame = document.createElement("iframe");
  printFrame.title = getTranslation("activities.printTitle");
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "1px";
  printFrame.style.height = "1px";
  printFrame.style.border = "0";
  printFrame.style.opacity = "0";
  printFrame.style.pointerEvents = "none";
  document.body.appendChild(printFrame);
  const frameWindow = printFrame.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    printFrame.remove();
    return;
  }
  const cleanup = () => {
    window.setTimeout(() => printFrame.remove(), 500);
  };
  frameDocument.open();
  frameDocument.write(activityPrintDocument());
  frameDocument.close();
  frameWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 10000);
  }, 150);
};

const changeActivityWeek = (weekOffset) => {
  const nextWeek = addDaysToIso(activitiesState.selectedWeekStart, weekOffset * 7);
  activitiesState.selectedWeekStart = weekStartIso(nextWeek);
  resetActivitiesForm();
  setActivityFormOpen(false);
  renderActivitiesCalendar();
};

const reorderActivitiesInCell = (draggedId, targetCellKey, insertionIndex = Number.POSITIVE_INFINITY) => {
  const draggedEntry = activitiesState.entries.find((entry) => entry.id === draggedId);
  if (!draggedEntry || activityCellKey(draggedEntry) !== targetCellKey) return false;
  const cellEntries = sortedActivities().filter((entry) => activityCellKey(entry) === targetCellKey);
  if (cellEntries.length < 2) return false;
  const nextOrder = cellEntries.filter((entry) => entry.id !== draggedId);
  const requestedIndex = Number.isFinite(insertionIndex) ? insertionIndex : nextOrder.length;
  const targetIndex = Math.max(0, Math.min(nextOrder.length, requestedIndex));
  const previewOrder = [...nextOrder];
  previewOrder.splice(targetIndex, 0, draggedEntry);
  if (previewOrder.every((entry, index) => entry.id === cellEntries[index]?.id)) return false;
  previewOrder.forEach((entry, index) => {
    const source = activitiesState.entries.find((item) => item.id === entry.id);
    if (source) source.order = index;
  });
  saveActivities();
  renderActivitiesCalendar();
  return true;
};

const wireActivitiesCalendar = () => {
  const { root, dialog, dialogCloseBtn, form, grid, createBtn, prevWeekBtn, nextWeekBtn, clearBtn, printBtn } = activitiesElements();
  if (!root || !form || !grid) return;
  window.__CENTRAL_RENDER_ACTIVITIES = () => {
    setActivitiesFormMode(Boolean(form.elements.id.value));
    setActivityFormOpen(isActivityFormOpen());
    renderActivitiesCalendar();
  };
  loadActivities();
  resetActivitiesForm();
  setActivityFormOpen(false);
  renderActivitiesCalendar();
  form.addEventListener("submit", handleActivitySubmit);
  createBtn?.addEventListener("click", () => {
    const shouldOpen = !isActivityFormOpen();
    if (shouldOpen) {
      resetActivitiesForm();
    }
    setActivityFormOpen(shouldOpen);
    if (shouldOpen) {
      form.elements.title.focus();
    }
  });
  prevWeekBtn?.addEventListener("click", () => changeActivityWeek(-1));
  nextWeekBtn?.addEventListener("click", () => changeActivityWeek(1));
  clearBtn?.addEventListener("click", resetActivitiesForm);
  printBtn?.addEventListener("click", printActivityWeek);
  dialogCloseBtn?.addEventListener("click", () => {
    resetActivitiesForm();
    setActivityFormOpen(false);
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) {
      resetActivitiesForm();
      setActivityFormOpen(false);
    }
  });
  dialog?.addEventListener("cancel", () => {
    resetActivitiesForm();
  });
  dialog?.addEventListener("close", () => {
    if (form) form.hidden = true;
    if (createBtn) {
      createBtn.classList.remove("is-active");
      createBtn.setAttribute("aria-expanded", "false");
    }
    if (activitiesElements().createLabel) {
      activitiesElements().createLabel.textContent = getTranslation("activities.createButton");
    }
  });
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-activity-action]");
    if (!button) return;
    const id = button.dataset.id || "";
    if (button.dataset.activityAction === "view") {
      viewActivity(id);
      return;
    }
    if (button.dataset.activityAction === "edit") {
      editActivity(id);
      return;
    }
    if (button.dataset.activityAction === "delete") {
      deleteActivity(id);
    }
  });
  grid.addEventListener("dragstart", (event) => {
    const target = eventElement(event);
    const slot = target?.closest(".activity-slot");
    if (!slot || slot.classList.contains("activity-slot-preview") || target?.closest("[data-activity-action]")) {
      event.preventDefault();
      return;
    }
    if (!centralHasPermission(window.CENTRAL_USER_PROFILE, "atividades", "edit")) {
      event.preventDefault();
      showCentralRestrictedAccess(getTranslation("access.actionRestricted"));
      return;
    }
    activitiesState.draggedActivityId = slot.dataset.activityId || "";
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", activitiesState.draggedActivityId);
    const draggedEntry = activitiesState.entries.find((entry) => entry.id === activitiesState.draggedActivityId);
    setActivityDragImage(event, slot);
    beginActivityDragPreview(slot, draggedEntry);
  });
  grid.addEventListener("dragover", (event) => {
    const target = eventElement(event);
    const cell = target?.closest(".timetable-cell");
    const draggedEntry = activitiesState.entries.find((entry) => entry.id === activitiesState.draggedActivityId);
    if (!cell || !draggedEntry || activityCellKey(draggedEntry) !== activityCellKeyFromElement(cell)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    placeActivityDropPreview(cell, activityDropIndexFromEvent(event, cell), draggedEntry);
  });
  grid.addEventListener("drop", (event) => {
    const target = eventElement(event);
    const cell = target?.closest(".timetable-cell");
    if (!cell) return;
    const draggedId = activitiesState.draggedActivityId || event.dataTransfer.getData("text/plain");
    const draggedEntry = activitiesState.entries.find((entry) => entry.id === draggedId);
    if (!draggedEntry || activityCellKey(draggedEntry) !== activityCellKeyFromElement(cell)) return;
    event.preventDefault();
    const changed = reorderActivitiesInCell(draggedId, activityCellKeyFromElement(cell), activityDropIndexFromEvent(event, cell));
    if (changed) {
      setActivitiesFeedback("");
    }
    finishActivityDragPreview();
  });
  grid.addEventListener("dragend", () => {
    finishActivityDragPreview();
  });
};

const centralUsersElements = () => ({
  dialog: document.querySelector("#centralUsersDialog"),
  closeBtn: document.querySelector("#centralCloseUsersBtn"),
  refreshBtn: document.querySelector("#centralRefreshUsersBtn"),
  table: document.querySelector("#centralUsersTable"),
  createForm: document.querySelector("#centralCreateUserForm"),
  createError: document.querySelector("#centralCreateUserError"),
  editForm: document.querySelector("#centralEditUserForm"),
  editError: document.querySelector("#centralEditUserError"),
  editHint: document.querySelector("#centralEditingUserHint"),
  editId: document.querySelector("#centralEditUserId"),
  editName: document.querySelector("#centralEditUserName"),
  editEmail: document.querySelector("#centralEditUserEmail"),
  editActive: document.querySelector("#centralEditUserActive"),
  createPermissions: document.querySelector('[data-permission-grid="create"]'),
  editPermissions: document.querySelector('[data-permission-grid="edit"]'),
  clearBtn: document.querySelector("#centralClearUserBtn"),
});

const showCentralFormError = (node, message) => {
  if (!node) return;
  node.textContent = message || "";
  node.hidden = !message;
};

const permissionInputName = (scope, area, action) => `${scope}_${area}_${action}`;

const findPermissionInput = (scope, area, action) =>
  document.querySelector(
    `[data-permission-input="${scope}"][data-area="${area}"][data-action="${action}"]`,
  );

const setPermissionInput = (scope, area, action, checked) => {
  const input = findPermissionInput(scope, area, action);
  if (input) input.checked = checked;
};

const syncPermissionDependencies = (input) => {
  const scope = input.dataset.permissionInput;
  const area = input.dataset.area;
  const action = input.dataset.action;
  if (!scope || !area || area === "central" || !action) return;

  if (!input.checked) {
    if (action === "view") {
      centralAreaActions.forEach((areaAction) => setPermissionInput(scope, area, areaAction, false));
      return;
    }
    if (action === "edit") {
      setPermissionInput(scope, area, "delete", false);
      setPermissionInput(scope, area, "edit_sensitive", false);
      return;
    }
    if (action === "view_sensitive") {
      setPermissionInput(scope, area, "edit_sensitive", false);
      if (area === "utentes") setPermissionInput(scope, area, "export", false);
    }
    return;
  }

  if (action === "edit" || action === "export" || action === "view_sensitive") {
    setPermissionInput(scope, area, "view", true);
  }
  if (area === "utentes" && action === "export") {
    setPermissionInput(scope, area, "view_sensitive", true);
  }
  if (action === "delete") {
    setPermissionInput(scope, area, "view", true);
    setPermissionInput(scope, area, "edit", true);
  }
  if (action === "edit_sensitive") {
    setPermissionInput(scope, area, "view", true);
    setPermissionInput(scope, area, "edit", true);
    setPermissionInput(scope, area, "view_sensitive", true);
  }
};

const renderPermissionGrid = (container, scope, permissions) => {
  if (!container) return;
  const language = getLanguage();
  const rows = centralAreaIds
    .map((area) => {
      const areaPermissions = permissions[area] || emptyAreaPermissions();
      const cells = centralAreaActions
        .map((action) => {
          const isSensitive = action === "view_sensitive" || action === "edit_sensitive";
          const isActivityDelete = area === "atividades" && action === "delete";
          if ((isSensitive && area !== "utentes") || isActivityDelete) {
            return `<td class="permission-na">${escapeHtml(getTranslation("permissions.notApplicable", language))}</td>`;
          }
          const name = permissionInputName(scope, area, action);
          return `
            <td>
              <label class="permission-check" title="${escapeHtml(getTranslation(`permissions.${permissionActionKey(action)}`, language))}">
                <input type="checkbox" name="${escapeHtml(name)}" data-permission-input="${escapeHtml(scope)}" data-area="${escapeHtml(area)}" data-action="${escapeHtml(action)}" ${areaPermissions[action] ? "checked" : ""}>
                <span></span>
              </label>
            </td>
          `;
        })
        .join("");
      return `
        <tr>
          <th scope="row">${escapeHtml(getTranslation(`permissions.${area}`, language))}</th>
          ${cells}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="permission-matrix-wrap">
      <table class="permission-matrix">
        <thead>
          <tr>
            <th>${escapeHtml(getTranslation("permissions.area", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.view", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.edit", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.viewSensitive", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.editSensitive", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.export", language))}</th>
            <th>${escapeHtml(getTranslation("permissions.delete", language))}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <fieldset class="central-permission-fieldset">
      <legend>${escapeHtml(getTranslation("permissions.central", language))}</legend>
      <label class="remember-field">
        <input type="checkbox" name="${escapeHtml(permissionInputName(scope, "central", "manage_users"))}" data-permission-input="${escapeHtml(scope)}" data-area="central" data-action="manage_users" ${permissions.central?.manage_users ? "checked" : ""}>
        <span>${escapeHtml(getTranslation("permissions.manageUsers", language))}</span>
      </label>
      <label class="remember-field">
        <input type="checkbox" name="${escapeHtml(permissionInputName(scope, "central", "view_history"))}" data-permission-input="${escapeHtml(scope)}" data-area="central" data-action="view_history" ${permissions.central?.view_history ? "checked" : ""}>
        <span>${escapeHtml(getTranslation("permissions.viewHistory", language))}</span>
      </label>
    </fieldset>
  `;
  container.querySelectorAll(`[data-permission-input="${scope}"]`).forEach((input) => {
    input.addEventListener("change", () => syncPermissionDependencies(input));
  });
};

const permissionActionKey = (action) => ({
  view: "view",
  edit: "edit",
  view_sensitive: "viewSensitive",
  edit_sensitive: "editSensitive",
  export: "export",
  delete: "delete",
}[action] || action);

const collectPermissionGrid = (scope) => {
  const permissions = emptyCentralPermissions();
  document.querySelectorAll(`[data-permission-input="${scope}"]`).forEach((input) => {
    const area = input.dataset.area;
    const action = input.dataset.action;
    if (!area || !action) return;
    if (area === "central") {
      permissions.central[action] = input.checked;
      return;
    }
    if (permissions[area]) {
      permissions[area][action] = input.checked;
    }
  });
  return normalizeCentralPermissions(permissions);
};

const refreshPermissionGrids = () => {
  const elements = centralUsersElements();
  renderPermissionGrid(elements.createPermissions, "create", defaultCentralPermissionsForRole());
  const editingUser = centralUsersState.users.find((item) => item.id === centralUsersState.editingId);
  renderPermissionGrid(
    elements.editPermissions,
    "edit",
    normalizeCentralPermissions(editingUser?.permissions),
  );
};

const createCentralClient = () => {
  if (centralUsersState.client) return centralUsersState.client;
  const config = window.CENTRAL_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
    throw new Error("Falta configurar o Supabase.");
  }
  centralUsersState.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: centralAuthStorageKey,
      storage: centralAuthStorage,
    },
  });
  return centralUsersState.client;
};

const getCentralSession = async () => {
  const client = createCentralClient();
  const { data } = await client.auth.getSession();
  centralUsersState.session = data?.session || null;
  return centralUsersState.session;
};

const requireCentralAdmin = async () => {
  const client = createCentralClient();
  const session = await getCentralSession();
  if (!session?.user?.id) throw new Error("Sessão em falta.");

  let { data, error } = await client
    .from("app_users")
    .select("id,email,full_name,active,permissions")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    const message = String(error.message || error.details || error.hint || error).toLowerCase();
    if (!message.includes("permissions")) throw error;
    const fallback = await client
      .from("app_users")
      .select("id,email,full_name,active")
      .eq("id", session.user.id)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    data = fallback.data ? { ...fallback.data, permissions: null } : null;
  }
  if (!data) throw new Error(getTranslation("users.adminOnly"));
  data.permissions = normalizeCentralPermissions(data.permissions);
  if (!data?.active || !centralCanManageUsers(data)) throw new Error(getTranslation("users.adminOnly"));

  centralUsersState.profile = data;
  return data;
};

const resetCentralUserForms = () => {
  const elements = centralUsersElements();
  elements.createForm?.reset();
  elements.editForm?.reset();
  centralUsersState.editingId = "";
  if (elements.editId) elements.editId.value = "";
  if (elements.editActive) elements.editActive.checked = true;
  if (elements.editHint) elements.editHint.textContent = getTranslation("users.editHint");
  renderPermissionGrid(elements.createPermissions, "create", defaultCentralPermissionsForRole());
  renderPermissionGrid(elements.editPermissions, "edit", defaultCentralPermissionsForRole());
  showCentralFormError(elements.createError, "");
  showCentralFormError(elements.editError, "");
};

const formatUserDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const renderCentralUsers = () => {
  const { table } = centralUsersElements();
  if (!table) return;

  if (!centralUsersState.users.length) {
    table.innerHTML = `<tr><td colspan="6">${escapeHtml(getTranslation("users.empty"))}</td></tr>`;
    refreshIcons();
    return;
  }

  const selfId = centralUsersState.session?.user?.id || "";
  table.innerHTML = centralUsersState.users
    .map((user) => {
      const name = user.full_name || user.email || user.id;
      const isSelf = user.id === selfId;
      const status = user.active ? getTranslation("users.active") : getTranslation("users.inactive");
      const toggleIcon = user.active ? "user-x" : "user-check";
      const toggleTitle = user.active ? getTranslation("users.deactivated") : getTranslation("users.activated");
      const entryDate = formatUserDate(user.created_at);
      const exitDate = user.active ? "-" : formatUserDate(user.updated_at);
      return `
        <tr>
          <td><strong>${escapeHtml(name)}</strong><span>${escapeHtml(user.id)}</span></td>
          <td>${escapeHtml(user.email || "")}</td>
          <td><span class="status-pill ${user.active ? "is-active" : "is-inactive"}">${escapeHtml(status)}</span></td>
          <td class="central-date-cell">${escapeHtml(entryDate)}</td>
          <td class="central-date-cell">${escapeHtml(exitDate)}</td>
          <td>
            <div class="central-row-actions">
              <button class="icon-link" type="button" title="Editar" aria-label="Editar" data-central-user-action="edit" data-id="${escapeHtml(user.id)}">
                <i data-lucide="pencil"></i>
              </button>
              ${
                isSelf
                  ? `<span class="central-self-label">${escapeHtml(getTranslation("users.self"))}</span>`
                  : `<button class="icon-link" type="button" title="${escapeHtml(toggleTitle)}" aria-label="${escapeHtml(toggleTitle)}" data-central-user-action="toggle" data-id="${escapeHtml(user.id)}"><i data-lucide="${toggleIcon}"></i></button>
                     <button class="icon-link danger-link" type="button" title="Eliminar" aria-label="Eliminar" data-central-user-action="delete" data-id="${escapeHtml(user.id)}"><i data-lucide="trash-2"></i></button>`
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
  refreshIcons();
};

const refreshCentralUsers = async () => {
  await requireCentralAdmin();
  const response = await fetch("/api/central-users", {
    headers: {
      Authorization: `Bearer ${centralUsersState.session?.access_token || ""}`,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || getTranslation("users.adminOnly"));
  centralUsersState.users = (result.users || []).map((user) => ({
    ...user,
    permissions: normalizeCentralPermissions(user.permissions),
  }));
  renderCentralUsers();
};

const fillCentralUserForm = (user) => {
  const elements = centralUsersElements();
  centralUsersState.editingId = user.id;
  elements.editId.value = user.id || "";
  elements.editName.value = user.full_name || "";
  elements.editEmail.value = user.email || "";
  elements.editActive.checked = Boolean(user.active);
  renderPermissionGrid(elements.editPermissions, "edit", normalizeCentralPermissions(user.permissions));
  elements.editHint.textContent = `${getTranslation("users.editTitle")}: ${user.full_name || user.email || user.id}`;
  showCentralFormError(elements.editError, "");
};

const validateCentralUser = ({ id, email, fullName, password, requirePassword = false }) => {
  if (id !== undefined && !id) return "Escolha primeiro um utilizador para editar.";
  if (!fullName && fullName !== undefined) return "Indique o nome do utilizador.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Indique um email válido.";
  if (requirePassword && (!password || !isStrongPassword(password))) return passwordPolicyMessage;
  return "";
};

const handleCentralCreateUser = async (event) => {
  event.preventDefault();
  const elements = centralUsersElements();
  const form = new FormData(event.currentTarget);
  const payload = {
    fullName: String(form.get("fullName") || "").trim(),
    email: String(form.get("email") || "").trim().toLowerCase(),
    password: String(form.get("password") || ""),
  };
  payload.permissions = collectPermissionGrid("create");
  const validation = validateCentralUser({ ...payload, requirePassword: true });
  if (validation) {
    showCentralFormError(elements.createError, validation);
    return;
  }

  const submit = event.currentTarget.querySelector("button[type='submit']");
  submit.disabled = true;
  showCentralFormError(elements.createError, "");

  try {
    await requireCentralAdmin();
    const response = await fetch("/api/central-users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${centralUsersState.session?.access_token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || getTranslation("users.created"));
    elements.createForm.reset();
    await refreshCentralUsers();
  } catch (error) {
    showCentralFormError(elements.createError, error.message || getTranslation("users.adminOnly"));
  } finally {
    submit.disabled = false;
  }
};

const handleCentralEditUser = async (event) => {
  event.preventDefault();
  const elements = centralUsersElements();
  const form = new FormData(event.currentTarget);
  const payload = {
    id: String(form.get("id") || "").trim(),
    email: String(form.get("email") || "").trim().toLowerCase(),
    fullName: String(form.get("fullName") || "").trim(),
    active: form.get("active") === "on",
  };
  payload.permissions = collectPermissionGrid("edit");
  const validation = validateCentralUser({
    id: payload.id,
    email: payload.email,
    fullName: payload.fullName || "",
  });
  if (validation) {
    showCentralFormError(elements.editError, validation);
    return;
  }
  if (payload.id === centralUsersState.session?.user?.id && !payload.active) {
    showCentralFormError(elements.editError, "Não desative a sua própria conta.");
    return;
  }

  try {
    await requireCentralAdmin();
    const response = await fetch("/api/central-users", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${centralUsersState.session?.access_token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || getTranslation("users.adminOnly"));
    resetCentralUserForms();
    await refreshCentralUsers();
  } catch (error) {
    showCentralFormError(elements.editError, error.message || getTranslation("users.adminOnly"));
  }
};

const toggleCentralUser = async (id) => {
  if (id === centralUsersState.session?.user?.id) return;
  const user = centralUsersState.users.find((item) => item.id === id);
  if (!user) return;
  await requireCentralAdmin();
  const response = await fetch("/api/central-users", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${centralUsersState.session?.access_token || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      email: user.email,
      fullName: user.full_name || user.email || "Utilizador",
      active: !user.active,
      permissions: normalizeCentralPermissions(user.permissions),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || getTranslation("users.adminOnly"));
  await refreshCentralUsers();
};

const deleteCentralUser = async (id) => {
  if (id === centralUsersState.session?.user?.id) return;
  const user = centralUsersState.users.find((item) => item.id === id);
  if (!user) return;
  const confirmed = window.confirm(`Eliminar o acesso de ${user.full_name || user.email}? Esta ação remove a conta de login.`);
  if (!confirmed) return;
  await requireCentralAdmin();
  const response = await fetch("/api/central-users", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${centralUsersState.session?.access_token || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível eliminar o utilizador.");
  resetCentralUserForms();
  await refreshCentralUsers();
};

const openCentralUsersDialog = async () => {
  const elements = centralUsersElements();
  if (!elements.dialog) return;
  closeToolsMenus();
  resetCentralUserForms();
  elements.dialog.showModal();
  try {
    await refreshCentralUsers();
  } catch (error) {
    showCentralFormError(elements.createError, error.message || getTranslation("users.adminOnly"));
  }
  refreshIcons();
};

const closeCentralUsersDialog = () => {
  const { dialog } = centralUsersElements();
  if (dialog?.open) dialog.close();
  resetCentralUserForms();
};

const wirePasswordToggle = () => {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const icon = button.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
      }
      refreshIcons();
    });
  });
};

const wireCentralUsersDialog = () => {
  const elements = centralUsersElements();
  if (!elements.dialog) return;
  document.querySelectorAll("[data-users-toggle]").forEach((button) => {
    button.addEventListener("click", openCentralUsersDialog);
  });
  elements.closeBtn?.addEventListener("click", closeCentralUsersDialog);
  elements.refreshBtn?.addEventListener("click", async () => {
    try {
      await refreshCentralUsers();
    } catch (error) {
      showCentralFormError(elements.createError, error.message || getTranslation("users.adminOnly"));
    }
  });
  elements.createForm?.addEventListener("submit", handleCentralCreateUser);
  elements.editForm?.addEventListener("submit", handleCentralEditUser);
  elements.clearBtn?.addEventListener("click", resetCentralUserForms);
  elements.table?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-central-user-action]");
    if (!button) return;
    const id = button.dataset.id || "";
    const action = button.dataset.centralUserAction;
    try {
      if (action === "edit") {
        const user = centralUsersState.users.find((item) => item.id === id);
        if (user) fillCentralUserForm(user);
      } else if (action === "toggle") {
        await toggleCentralUser(id);
      } else if (action === "delete") {
        await deleteCentralUser(id);
      }
    } catch (error) {
      showCentralFormError(elements.editError, error.message || getTranslation("users.adminOnly"));
    }
  });
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) closeCentralUsersDialog();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getTheme());
  applyLanguage(getLanguage(), { persist: true });
  wirePasswordToggle();
  wireActivitiesCalendar();
  refreshIcons();
  if (document.querySelector("[data-module-status]")) {
    refreshStatus();
  }

  document.querySelector("#refreshStatus")?.addEventListener("click", refreshStatus);
  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleToolsMenu(button);
    });
  });
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    button.addEventListener("click", openLanguageDialog);
  });
  wireCentralUsersDialog();
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-language-option]")) {
      selectLanguage(event.target.closest("[data-language-option]").dataset.languageOption === "en" ? "en" : "pt");
      return;
    }
    if (event.target.closest("[data-language-close]") || event.target.matches("[data-language-modal]")) {
      closeLanguageDialog();
      return;
    }
    if (event.target.closest("[data-tools-menu]") || event.target.closest("[data-menu-toggle]") || event.target.closest(".global-menu-wrap")) {
      return;
    }
    closeToolsMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLanguageDialog();
      closeCentralUsersDialog();
      closeToolsMenus();
    }
  });
  window.addEventListener("storage", (event) => {
    if ([themeStorageKey, legacyThemeStorageKey, dispositivosThemeStorageKey].includes(event.key)) {
      applyTheme(getTheme());
    }
    if (languageStorageKeys.includes(event.key)) {
      applyLanguage(getLanguage());
    }
  });
});
