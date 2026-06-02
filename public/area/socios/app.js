const CONFIG = window.SOCIOS_CONFIG || {};
const REQUIRED_CONFIG_KEYS = ["supabaseUrl", "supabaseAnonKey"];
const THEME_STORAGE_KEY = "central-theme";
const LEGACY_THEME_STORAGE_KEY = "socios-theme";
const DISPOSITIVOS_THEME_STORAGE_KEY = "mentemovimento-theme";
const LANGUAGE_STORAGE_KEY = "socios-language";
const REMEMBER_LOGIN_STORAGE_KEY = "socios-remember-login";
const REMEMBER_EMAIL_STORAGE_KEY = "socios-remember-email";
const LOGIN_FAILURE_STORAGE_KEY = "socios-login-failures";
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

const fields = [
  "memberNumber",
  "approvalMinuteNumber",
  "admissionDate",
  "quotaPaidUntil",
  "quotaPaidAt",
  "name",
  "address",
  "postalCode",
  "locality",
  "idNumber",
  "taxNumber",
  "profession",
  "birthDate",
  "phone",
  "email",
  "notes",
];

const fieldLabels = {
  memberNumber: "Nº de sócio",
  approvalMinuteNumber: "Nº de Ata de Aprovação",
  admissionDate: "Data de adesão",
  quotaPaidUntil: "Última quota paga",
  quotaPaidAt: "Data do pagamento",
  name: "Nome",
  address: "Morada",
  postalCode: "Código postal",
  locality: "Localidade",
  idNumber: "BI ou CC",
  taxNumber: "NIF",
  profession: "Categoria",
  birthDate: "Data de nascimento",
  phone: "Telemóvel",
  email: "Email",
  notes: "Observações internas",
};

const roleLabels = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Consulta",
};

const auditActionLabels = {
  insert: "Criado",
  update: "Atualizado",
  delete: "Apagado",
};

const auditFieldLabels = {
  member_number: "Nº de sócio",
  approval_minute_number: "Nº de Ata de Aprovação",
  admission_date: "Data de adesão",
  quota_paid_until: "Última quota paga",
  quota_paid_at: "Data do pagamento",
  name: "Nome",
  address: "Morada",
  postal_code: "Código postal",
  locality: "Localidade",
  id_number: "BI ou CC",
  tax_number: "NIF",
  profession: "Categoria",
  birth_date: "Data de nascimento",
  phone: "Telemóvel",
  email: "Email",
  notes: "Observações internas",
};

const ignoredAuditFields = new Set(["id", "created_at", "updated_at", "created_by", "updated_by"]);

const translations = {
  pt: {
    app: {
      title: "Gestão de Sócios",
      setupTitle: "Configuração necessária",
      setupText: "Configure o Supabase em config.js antes de publicar ou usar a app em produção.",
      setupLink: "Ver instruções",
      authText: "Acesso reservado a utilizadores autorizados.",
      email: "Email",
      password: "Password",
      rememberLogin: "Lembrar neste dispositivo",
      login: "Entrar",
      loginLoading: "A validar acesso...",
      captchaRequired: "Confirme que não é um robô.",
      captchaLoadError: "Não foi possível carregar o CAPTCHA.",
      searchPlaceholder: "Pesquisar por nº de sócio, nome, NIF, localidade, email...",
      menu: "Abrir menu",
      logout: "Terminar sessão",
      import: "Importar",
      export: "Exportar",
      history: "Histórico",
      manual: "Manuais",
      language: "Idioma",
      dark: "Tema escuro",
      light: "Tema claro",
      darkTitle: "Tema escuro",
      lightTitle: "Tema claro",
      newMember: "Novo sócio",
      adminManager: "Utilizadores",
      refresh: "Atualizar",
      close: "Fechar",
      save: "Guardar",
      saveChanges: "Guardar alterações",
      cancel: "Cancelar",
      delete: "Apagar",
      edit: "Editar",
      clear: "Limpar",
      active: "Ativo",
      actions: "Ações",
      name: "Nome",
      profile: "Perfil",
      state: "Estado",
    },
    filters: {
      all: "Todos",
      overdue: "Quotas em atraso",
      paid: "Em dia",
    },
    metrics: {
      members: "Sócios",
      overdue: "Quotas em atraso",
      quotaState: "Estado das quotas",
      paid: "Quotas em dia",
      paidDetail: "Sócios com pagamento dentro do prazo.",
      latest: "Último registo",
    },
    table: {
      title: "Sócios registados",
      resultsSingular: "resultado",
      resultsPlural: "resultados",
      order: "Ordenar",
      number: "Nº",
      approvalMinute: "Nº Ata",
      locality: "Localidade",
      phone: "Telemóvel",
      quotas: "Quota anual",
      emptyTitle: "Sem sócios registados",
      emptyText: "Adicione o primeiro sócio para começar.",
      sortNameAsc: "Nome A-Z",
      sortNameDesc: "Nome Z-A",
      sortNumber: "Nº de sócio",
      sortLocality: "Localidade A-Z",
      sortQuotaOldest: "Quota mais antiga",
      sortQuotaNewest: "Quota mais recente",
      sortUpdated: "Atualização recente",
    },
    insight: {
      baseReady: "Base pronta",
      baseReadyDetail: "Adicione o primeiro sócio para começar o histórico.",
      overdueSingular: "quota em atraso",
      overduePlural: "quotas em atraso",
      overdueDetail: "Os sócios em atraso aparecem destacados a vermelho na tabela.",
      noOverdue: "Sem quotas em atraso",
      paidSingular: "sócio está",
      paidPlural: "sócios estão",
      paidDetail: "com quotas em dia.",
      noPaid: "Ainda não há quotas em dia registadas.",
      noRecords: "Sem registos",
      waitingFirst: "Aguardando o primeiro sócio.",
      admission: "Adesão",
      updated: "Ficha atualizada recentemente.",
      registered: "Ficha registada.",
    },
    member: {
      editTitle: "Editar sócio",
      newTitle: "Novo sócio",
      subtitle: "Ficha individual",
      noName: "Sem nome",
      birthMissing: "Nascimento por preencher",
      birth: "Nascimento",
      notes: "Observações",
      noNumber: "Não atribuído",
      overdueSince: "{quota}",
      paidUntil: "{quota} paga",
      paidOn: "Paga em {date}",
      noQuota: "Sem quota registada",
      quotaYear: "Quota de {year}",
      payQuota: "Pagar quota",
      payQuotaConfirm: "Confirmar pagamento da {quota} para {name}?",
      payQuotaDone: "{quota} registada.",
      deleteConfirm: "Apagar o registo de {name}?",
    },
    fields: {
      memberNumber: "Nº de sócio (opcional)",
      approvalMinuteNumber: "Nº de Ata de Aprovação",
      admissionDate: "Data de adesão",
      quotaPaidUntil: "Última quota paga",
      quotaPaidAt: "Data do pagamento",
      name: "Nome",
      address: "Morada",
      postalCode: "Código postal",
      locality: "Localidade",
      idNumber: "BI ou CC (opcional)",
      taxNumber: "NIF",
      profession: "Categoria",
      birthDate: "Data de nascimento",
      phone: "Telemóvel",
      email: "Email",
      notes: "Observações internas",
      notesPlaceholder: "Notas úteis para a equipa, chamadas, situações pendentes...",
    },
    admin: {
      title: "Utilizadores",
      subtitle: "Crie acessos novos e edite permissões de utilizadores existentes.",
      createTitle: "Criar utilizador",
      createHint: "O ID é criado automaticamente no Supabase Auth.",
      editTitle: "Editar utilizador",
      editHint: "Escolha um utilizador na lista para editar.",
      createButton: "Criar utilizador",
      usersEmpty: "Sem utilizadores registados nesta tabela.",
      self: "A sua conta",
      editUser: "Editar {name}",
      activateUser: "Ativar {name}",
      deactivateUser: "Desativar {name}",
      deleteUser: "Eliminar {name}",
    },
    history: {
      title: "Histórico de alterações",
      subtitle: "Registo das alterações feitas às fichas dos sócios.",
      date: "Data",
      action: "Ação",
      member: "Sócio",
      changedBy: "Alterado por",
      details: "Detalhes",
      emptyTitle: "Sem alterações registadas",
      emptyText: "Quando forem feitas alterações aos sócios, elas aparecem aqui.",
      created: "Ficha criada.",
      deleted: "Ficha apagada.",
      noVisibleChanges: "Sem campos visíveis alterados.",
      moreChanges: "+{count} alterações",
      emptyValue: "vazio",
      system: "Sistema",
      authorizedUser: "Utilizador autorizado",
    },
    manual: {
      title: "Manual",
      subtitle: "Escolha o manual adequado ao que pretende consultar.",
      userTitle: "Manual do Utilizador",
      userDescription: "Para quem usa a app no dia a dia: login, sócios, quotas, pesquisa, exportação e acessos.",
      programmerTitle: "Manual do Programador",
      programmerDescription: "Para quem mantém o projeto: ficheiros, GitHub, Vercel, Supabase, SQL, segurança e atualizações.",
    },
    language: {
      title: "Idioma",
      subtitle: "Escolha o idioma da aplicação neste browser.",
      optionsLabel: "Idiomas disponíveis",
      portuguese: "Português",
      portugueseRegion: "Portugal",
      english: "English",
      englishRegion: "United Kingdom",
      changed: "Idioma alterado para Português.",
    },
    roles: {
      admin: "Administrador",
      operator: "Operador",
      viewer: "Consulta",
    },
    auditActions: {
      insert: "Criado",
      update: "Atualizado",
      delete: "Apagado",
    },
    messages: {
      languageComing: "A mudança de idioma fica preparada para a próxima fase.",
      noPermissionMembers: "Não tem permissão para alterar sócios.",
      adminUsersOnly: "Só administradores podem gerir utilizadores.",
      adminHistoryOnly: "Só administradores podem consultar o histórico.",
      manualsOnly: "Só administradores e operadores podem consultar os manuais.",
      approvalMinuteMissing: "Falta aplicar o SQL para guardar o Nº de Ata de Aprovação.",
      quotaPaidAtMissing: "Falta aplicar o SQL para guardar a data do pagamento das quotas.",
    },
  },
  en: {
    app: {
      title: "Member Management",
      setupTitle: "Setup required",
      setupText: "Configure Supabase in config.js before publishing or using the app in production.",
      setupLink: "View instructions",
      authText: "Access reserved for authorised users.",
      email: "Email",
      password: "Password",
      rememberLogin: "Remember on this device",
      login: "Sign in",
      loginLoading: "Checking access...",
      captchaRequired: "Confirm you are not a robot.",
      captchaLoadError: "The CAPTCHA could not be loaded.",
      searchPlaceholder: "Search by member no., name, NIF, town, email...",
      menu: "Open menu",
      logout: "Sign out",
      import: "Import",
      export: "Export Excel",
      history: "History",
      manual: "Manuals",
      language: "Language",
      dark: "Dark theme",
      light: "Light theme",
      darkTitle: "Dark theme",
      lightTitle: "Light theme",
      newMember: "New member",
      adminManager: "Users",
      refresh: "Refresh",
      close: "Close",
      save: "Save",
      saveChanges: "Save changes",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      clear: "Clear",
      active: "Active",
      actions: "Actions",
      name: "Name",
      profile: "Role",
      state: "Status",
    },
    filters: {
      all: "All",
      overdue: "Overdue fees",
      paid: "Paid",
    },
    metrics: {
      members: "Members",
      overdue: "Overdue fees",
      quotaState: "Fee status",
      paid: "Paid fees",
      paidDetail: "Members with payments within the due date.",
      latest: "Latest record",
    },
    table: {
      title: "Registered members",
      resultsSingular: "result",
      resultsPlural: "results",
      order: "Sort",
      number: "No.",
      approvalMinute: "Minute no.",
      locality: "Town",
      phone: "Phone",
      quotas: "Annual fee",
      emptyTitle: "No members registered",
      emptyText: "Add the first member to get started.",
      sortNameAsc: "Name A-Z",
      sortNameDesc: "Name Z-A",
      sortNumber: "Member no.",
      sortLocality: "Town A-Z",
      sortQuotaOldest: "Oldest fee",
      sortQuotaNewest: "Newest fee",
      sortUpdated: "Recently updated",
    },
    insight: {
      baseReady: "Database ready",
      baseReadyDetail: "Add the first member to start the history.",
      overdueSingular: "overdue fee",
      overduePlural: "overdue fees",
      overdueDetail: "Overdue members are highlighted in red in the table.",
      noOverdue: "No overdue fees",
      paidSingular: "member is",
      paidPlural: "members are",
      paidDetail: "paid up.",
      noPaid: "There are no paid fees registered yet.",
      noRecords: "No records",
      waitingFirst: "Waiting for the first member.",
      admission: "Joined",
      updated: "Record updated recently.",
      registered: "Record registered.",
    },
    member: {
      editTitle: "Edit member",
      newTitle: "New member",
      subtitle: "Individual record",
      noName: "Unnamed member",
      birthMissing: "Birth date missing",
      birth: "Birth",
      notes: "Notes",
      noNumber: "Not assigned",
      overdueSince: "{quota}",
      paidUntil: "{quota} paid",
      paidOn: "Paid on {date}",
      noQuota: "No fee registered",
      quotaYear: "Fee {year}",
      payQuota: "Pay fee",
      payQuotaConfirm: "Confirm payment of {quota} for {name}?",
      payQuotaDone: "{quota} registered.",
      deleteConfirm: "Delete the record for {name}?",
    },
    fields: {
      memberNumber: "Member no. (optional)",
      approvalMinuteNumber: "Approval minute no.",
      admissionDate: "Joining date",
      quotaPaidUntil: "Last paid fee",
      quotaPaidAt: "Payment date",
      name: "Name",
      address: "Address",
      postalCode: "Postcode",
      locality: "Town",
      idNumber: "ID card (optional)",
      taxNumber: "NIF",
      profession: "Category",
      birthDate: "Date of birth",
      phone: "Phone",
      email: "Email",
      notes: "Internal notes",
      notesPlaceholder: "Useful notes for the team, calls, pending situations...",
    },
    admin: {
      title: "Users",
      subtitle: "Create new access accounts and edit existing user permissions.",
      createTitle: "Create user",
      createHint: "The ID is created automatically in Supabase Auth.",
      editTitle: "Edit user",
      editHint: "Choose a user from the list to edit.",
      createButton: "Create user",
      usersEmpty: "No users registered in this table.",
      self: "Your account",
      editUser: "Edit {name}",
      activateUser: "Activate {name}",
      deactivateUser: "Deactivate {name}",
      deleteUser: "Delete {name}",
    },
    history: {
      title: "Change history",
      subtitle: "Record of changes made to member files.",
      date: "Date",
      action: "Action",
      member: "Member",
      changedBy: "Changed by",
      details: "Details",
      emptyTitle: "No changes recorded",
      emptyText: "When member records are changed, they appear here.",
      created: "Record created.",
      deleted: "Record deleted.",
      noVisibleChanges: "No visible fields changed.",
      moreChanges: "+{count} changes",
      emptyValue: "empty",
      system: "System",
      authorizedUser: "Authorised user",
    },
    manual: {
      title: "Manual",
      subtitle: "Choose the right manual for what you need to check.",
      userTitle: "User manual",
      userDescription: "For day-to-day app use: sign in, members, fees, search, export and access.",
      programmerTitle: "Programmer manual",
      programmerDescription: "For maintaining the project: files, GitHub, Vercel, Supabase, SQL, security and updates.",
    },
    language: {
      title: "Language",
      subtitle: "Choose the app language for this browser.",
      optionsLabel: "Available languages",
      portuguese: "Português",
      portugueseRegion: "Portugal",
      english: "English",
      englishRegion: "United Kingdom",
      changed: "Language changed to English.",
    },
    roles: {
      admin: "Administrator",
      operator: "Operator",
      viewer: "Viewer",
    },
    auditActions: {
      insert: "Created",
      update: "Updated",
      delete: "Deleted",
    },
    messages: {
      languageComing: "Language switching is ready for the next phase.",
      noPermissionMembers: "You do not have permission to edit members.",
      adminUsersOnly: "Only administrators can manage users.",
      adminHistoryOnly: "Only administrators can view the history.",
      manualsOnly: "Only administrators and operators can view the manuals.",
      approvalMinuteMissing: "Run the SQL update before saving approval minute numbers.",
      quotaPaidAtMissing: "Run the SQL update before saving fee payment dates.",
    },
  },
};

function loadStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "pt";
  } catch (_error) {
    return "pt";
  }
}

function t(path, replacements = {}) {
  const keys = path.split(".");
  const findValue = (language) =>
    keys.reduce((value, key) => (value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined), translations[language]);
  const value = findValue(state?.language || loadStoredLanguage()) ?? findValue("pt") ?? path;
  return Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)), String(value));
}

function fieldLabel(field) {
  return t(`fields.${field}`);
}

function roleLabel(role) {
  return t(`roles.${role}`) || role;
}

function auditActionLabel(action) {
  return t(`auditActions.${action}`) || action;
}

const csvHeaders = () => fields.map((field) => fieldLabel(field));

function memberExportValue(member, field) {
  if (field === "quotaPaidUntil") {
    return member[field] ? formatQuotaYearLabel(member[field]) : "";
  }

  return member[field] ?? "";
}

function quotaYearFromDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})/);
  if (match) {
    const year = Number(match[1]);
    return Number.isInteger(year) ? year : null;
  }

  const embeddedYear = text.match(/\b(20\d{2})\b/);
  if (embeddedYear) {
    return Number(embeddedYear[1]);
  }

  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}

function quotaDateForYear(year) {
  return `${year}-12-31`;
}

function currentQuotaYear() {
  return new Date().getFullYear();
}

function nextQuotaYear(member) {
  const paidYear = quotaYearFromDate(member?.quotaPaidUntil);
  return paidYear ? paidYear + 1 : currentQuotaYear();
}

function formatQuotaYearLabel(value) {
  const year = quotaYearFromDate(value);
  return year ? t("member.quotaYear", { year }) : formatDate(value);
}

function quotaOptionYears(extraValue = "") {
  const currentYear = new Date().getFullYear();
  const years = new Set();
  const lastVisibleYear = Math.max(2035, currentYear + 4);

  for (let year = currentYear - 3; year <= lastVisibleYear; year += 1) {
    years.add(year);
  }

  state.members.forEach((member) => {
    const year = quotaYearFromDate(member.quotaPaidUntil);
    if (year) {
      years.add(year);
    }
  });

  const extraYear = quotaYearFromDate(extraValue);
  if (extraYear) {
    years.add(extraYear);
  }

  return [...years].sort((a, b) => a - b);
}

function populateQuotaYearOptions(extraValue = "") {
  const select = document.querySelector("#quotaPaidUntil");
  if (!select) {
    return;
  }

  const currentValue = extraValue || select.value;
  select.innerHTML = [
    `<option value="">${escapeHtml(t("member.noQuota"))}</option>`,
    ...quotaOptionYears(currentValue).map((year) => `<option value="${quotaDateForYear(year)}">${escapeHtml(t("member.quotaYear", { year }))}</option>`),
  ].join("");

  select.value = currentValue;
}

const state = {
  members: [],
  auditLogs: [],
  users: [],
  language: loadStoredLanguage(),
  query: "",
  filter: "all",
  sort: "nameAsc",
  editingId: null,
  editingUserId: null,
  csrfToken: "",
  loginFailureCount: 0,
  session: null,
  user: null,
  profile: null,
  supportsNotes: true,
  supportsQuotaPaidAt: false,
  supportsApprovalMinuteNumber: false,
};

const elements = {
  accessUserActive: document.querySelector("#accessUserActive"),
  accessUserEmail: document.querySelector("#accessUserEmail"),
  accessUserId: document.querySelector("#accessUserId"),
  accessUserName: document.querySelector("#accessUserName"),
  accessUserRole: document.querySelector("#accessUserRole"),
  adminDialog: document.querySelector("#adminDialog"),
  adminManagerBtn: document.querySelector("#adminManagerBtn"),
  appShell: document.querySelector("#appShell"),
  adminPanel: document.querySelector("#adminPanel"),
  approvalMinuteNumberField: document.querySelector("#approvalMinuteNumberField"),
  authError: document.querySelector("#authError"),
  authTitle: document.querySelector("#authTitle"),
  authView: document.querySelector("#authView"),
  cancelBtn: document.querySelector("#cancelBtn"),
  captchaContainer: document.querySelector("#captchaContainer"),
  clearUserFormBtn: document.querySelector("#clearUserFormBtn"),
  closeAdminDialogBtn: document.querySelector("#closeAdminDialogBtn"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  closeHistoryDialogBtn: document.querySelector("#closeHistoryDialogBtn"),
  closeLanguageDialogBtn: document.querySelector("#closeLanguageDialogBtn"),
  closeManualDialogBtn: document.querySelector("#closeManualDialogBtn"),
  createUserEmail: document.querySelector("#createUserEmail"),
  createUserError: document.querySelector("#createUserError"),
  createUserForm: document.querySelector("#createUserForm"),
  createUserName: document.querySelector("#createUserName"),
  createUserPassword: document.querySelector("#createUserPassword"),
  createUserRole: document.querySelector("#createUserRole"),
  deleteMemberBtn: document.querySelector("#deleteMemberBtn"),
  dialog: document.querySelector("#memberDialog"),
  dialogSubtitle: document.querySelector("#dialogSubtitle"),
  dialogTitle: document.querySelector("#dialogTitle"),
  editingUserHint: document.querySelector("#editingUserHint"),
  emptyState: document.querySelector("#emptyState"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  form: document.querySelector("#memberForm"),
  formError: document.querySelector("#formError"),
  historyBtn: document.querySelector("#historyBtn"),
  historyDialog: document.querySelector("#historyDialog"),
  historyTable: document.querySelector("#historyTable"),
  historyEmptyState: document.querySelector("#historyEmptyState"),
  historyError: document.querySelector("#historyError"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  languageBtn: document.querySelector("#languageBtn"),
  languageDialog: document.querySelector("#languageDialog"),
  languageOptions: document.querySelectorAll("[data-language-option]"),
  latestMemberDetail: document.querySelector("#latestMemberDetail"),
  latestMemberName: document.querySelector("#latestMemberName"),
  loginEmail: document.querySelector("#loginEmail"),
  loginForm: document.querySelector("#loginForm"),
  loginSubmitBtn: document.querySelector("#loginSubmitBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  manualBtn: document.querySelector("#manualBtn"),
  manualDialog: document.querySelector("#manualDialog"),
  appTitle: document.querySelector("#appTitle"),
  memberCount: document.querySelector("#memberCount"),
  membersTable: document.querySelector("#membersTable"),
  newMemberBtn: document.querySelector("#newMemberBtn"),
  notesField: document.querySelector("#notesField"),
  overdueCount: document.querySelector("#overdueCount"),
  paidCount: document.querySelector("#paidCount"),
  quotaPaidAtField: document.querySelector("#quotaPaidAtField"),
  quotaInsightCard: document.querySelector("#quotaInsightCard"),
  quotaInsightDetail: document.querySelector("#quotaInsightDetail"),
  quotaInsightIcon: document.querySelector("#quotaInsightIcon"),
  quotaInsightTitle: document.querySelector("#quotaInsightTitle"),
  quickFilters: document.querySelectorAll("[data-filter]"),
  rememberLoginDevice: document.querySelector("#rememberLoginDevice"),
  refreshUsersBtn: document.querySelector("#refreshUsersBtn"),
  refreshHistoryBtn: document.querySelector("#refreshHistoryBtn"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  setupView: document.querySelector("#setupView"),
  sortSelect: document.querySelector("#sortSelect"),
  toast: document.querySelector("#toast"),
  toolsMenu: document.querySelector("#toolsMenu"),
  toolsMenuBtn: document.querySelector("#toolsMenuBtn"),
  themeToggleBtns: document.querySelectorAll("[data-theme-toggle]"),
  userForm: document.querySelector("#userForm"),
  userFormError: document.querySelector("#userFormError"),
  userChip: document.querySelector("#userChip"),
  userEmail: document.querySelector("#userEmail"),
  userRole: document.querySelector("#userRole"),
  usersTable: document.querySelector("#usersTable"),
};

let supabaseClient;
let captchaToken = "";
let captchaWidgetId = null;
let captchaScriptPromise = null;
let toastTimer;

function hasSupabaseConfig() {
  return REQUIRED_CONFIG_KEYS.every((key) => {
    const value = String(CONFIG[key] || "");
    return value && !value.includes("COLOQUE_") && !value.includes("SEU_");
  });
}

function captchaEnabled() {
  return CONFIG.captchaProvider === "turnstile" && Boolean(CONFIG.captchaSiteKey);
}

function createCsrfToken() {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function syncCsrfTokens() {
  if (!state.csrfToken) {
    state.csrfToken = createCsrfToken();
  }

  document.querySelectorAll("[data-csrf-token]").forEach((input) => {
    input.value = state.csrfToken;
  });
}

function hasValidCsrfToken(formData) {
  return Boolean(state.csrfToken) && formData.get("csrf_token") === state.csrfToken;
}

function setCsrfError(element) {
  element.textContent = "Sessão do formulário expirada. Recarregue a página e tente novamente.";
}

function loadLoginFailureCount() {
  try {
    const raw = localStorage.getItem(LOGIN_FAILURE_STORAGE_KEY);
    if (!raw) {
      return 0;
    }

    const stored = JSON.parse(raw);
    const count = Number(stored?.count || 0);
    const updatedAt = Number(stored?.updatedAt || 0);

    if (!Number.isFinite(count) || !Number.isFinite(updatedAt) || Date.now() - updatedAt > LOGIN_FAILURE_WINDOW_MS) {
      localStorage.removeItem(LOGIN_FAILURE_STORAGE_KEY);
      return 0;
    }

    return Math.max(0, Math.min(count, 5));
  } catch (_error) {
    return 0;
  }
}

function storeLoginFailureCount(count) {
  try {
    if (count <= 0) {
      localStorage.removeItem(LOGIN_FAILURE_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      LOGIN_FAILURE_STORAGE_KEY,
      JSON.stringify({
        count,
        updatedAt: Date.now(),
      }),
    );
  } catch (_error) {
    // A proteção continua com o contador em memória mesmo que o browser bloqueie localStorage.
  }
}

function recordFailedLogin() {
  state.loginFailureCount = Math.min(loadLoginFailureCount() + 1, 5);
  storeLoginFailureCount(state.loginFailureCount);
}

function clearLoginFailures() {
  state.loginFailureCount = 0;
  storeLoginFailureCount(0);
}

function shouldRequireCaptcha() {
  return captchaEnabled() && state.loginFailureCount > 0;
}

function initSupabase() {
  if (window.createCentralSociosClient) {
    return window.createCentralSociosClient();
  }

  if (!hasSupabaseConfig() || !window.supabase?.createClient) {
    return null;
  }

  return window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

function applyOrganizationName() {
  const configuredName = String(CONFIG.organizationName || "").trim();
  const normalizedConfiguredName = normalise(configuredName);
  const usesDefaultName =
    !configuredName ||
    normalizedConfiguredName === normalise("Gestão de Sócios") ||
    (normalizedConfiguredName.includes("gest") && normalizedConfiguredName.includes("socio"));
  const name = usesDefaultName ? t("app.title") : configuredName;
  document.title = name;
  elements.appTitle.textContent = name;
  elements.authTitle.textContent = name;
}

function loadStoredTheme() {
  try {
    const centralTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (centralTheme === "dark" || centralTheme === "light") {
      return centralTheme;
    }

    const sociosTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (sociosTheme === "dark" || sociosTheme === "light") {
      return sociosTheme;
    }

    const dispositivosTheme = localStorage.getItem(DISPOSITIVOS_THEME_STORAGE_KEY);
    if (dispositivosTheme === "dark" || dispositivosTheme === "light") {
      return dispositivosTheme;
    }

    return "light";
  } catch (_error) {
    return "light";
  }
}

function applyTheme(theme, persist = true) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";

  if (resolvedTheme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, resolvedTheme);
      localStorage.setItem(DISPOSITIVOS_THEME_STORAGE_KEY, resolvedTheme);
    } catch (_error) {
      // A app continua funcional mesmo que o browser bloqueie localStorage.
    }
  }

  updateThemeButton(resolvedTheme);
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  applyTheme(isDark ? "light" : "dark");
}

function updateThemeButton(theme = loadStoredTheme()) {
  if (!elements.themeToggleBtns.length) {
    return;
  }

  const isDark = theme === "dark";
  const title = isDark ? t("app.lightTitle") : t("app.darkTitle");

  elements.themeToggleBtns.forEach((button) => {
    button.title = title;
    button.setAttribute("aria-label", title);
    button.innerHTML = `
      <i data-lucide="${isDark ? "sun" : "moon"}"></i>
      <span>${isDark ? t("app.light") : t("app.dark")}</span>
    `;
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function applyLanguage(language = loadStoredLanguage(), persist = true) {
  const resolvedLanguage = language === "en" ? "en" : "pt";
  state.language = resolvedLanguage;
  document.documentElement.lang = resolvedLanguage === "en" ? "en" : "pt";

  if (persist) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
    } catch (_error) {
      // A app continua funcional mesmo que o browser bloqueie localStorage.
    }
  }

  applyOrganizationName();
  updateStaticLanguageText();
  updateThemeButton(loadStoredTheme());
  updateRoleSelectLabels();
  updateLanguageOptions();

  if (state.profile) {
    elements.userRole.textContent = roleLabel(state.profile.role);
    render();
    renderAppUsers();
    renderHistory();
  }

  syncOpenDialogText();
  renderIcons();
}

function setText(selector, key, replacements = {}) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = t(key, replacements);
  });
}

function setHtml(selector, html) {
  const element = document.querySelector(selector);
  if (element) {
    element.innerHTML = html;
  }
}

function setAttributeText(selector, attribute, key) {
  document.querySelectorAll(selector).forEach((element) => {
    element.setAttribute(attribute, t(key));
  });
}

function setSelectOption(selectSelector, value, key) {
  const option = document.querySelector(`${selectSelector} option[value="${value}"]`);
  if (option) {
    option.textContent = t(key);
  }
}

function updateStaticLanguageText() {
  setText(".setup-panel h1", "app.setupTitle");
  setHtml(".setup-panel p", `${t("app.setupText").replace("config.js", "<code>config.js</code>")}`);
  setText(".setup-panel .secondary-button span", "app.setupLink");
  setText("#authTitle + p", "app.authText");
  setText('label[for="loginEmail"] span', "app.email");
  setText('label[for="loginPassword"] span', "app.password");
  setText('label[for="rememberLoginDevice"] span', "app.rememberLogin");

  if (!elements.loginSubmitBtn.classList.contains("is-loading")) {
    elements.loginSubmitBtn.innerHTML = `
      <i data-lucide="log-in"></i>
      <span>${t("app.login")}</span>
    `;
  }

  setAttributeText("#toolsMenuBtn", "aria-label", "app.menu");
  setAttributeText("#logoutBtn", "title", "app.logout");
  setAttributeText("#logoutBtn", "aria-label", "app.logout");
  setText("#importBtn span", "app.import");
  setText("#exportJsonBtn span", "app.export");
  setText("#historyBtn span", "app.history");
  setText("#manualBtn span", "app.manual");
  setText("#languageBtn span", "app.language");
  setText("#newMemberBtn span", "app.newMember");
  setText("#adminManagerBtn span", "app.adminManager");
  elements.searchInput.placeholder = t("app.searchPlaceholder");

  setText('.quick-filters [data-filter="all"]', "filters.all");
  setText('.quick-filters [data-filter="overdue"]', "filters.overdue");
  setText('.quick-filters [data-filter="paid"]', "filters.paid");
  setText('.metric[data-filter="all"] span', "metrics.members");
  setText('.metric[data-filter="overdue"] span', "metrics.overdue");
  setText("#quotaInsightCard span", "metrics.quotaState");
  setText(".insight-card:nth-child(2) span", "metrics.paid");
  setText(".insight-card:nth-child(2) p", "metrics.paidDetail");
  setText(".insight-card:nth-child(3) span", "metrics.latest");

  setText(".table-tools h2", "table.title");
  setText(".select-field span", "table.order");
  setSelectOption("#sortSelect", "nameAsc", "table.sortNameAsc");
  setSelectOption("#sortSelect", "nameDesc", "table.sortNameDesc");
  setSelectOption("#sortSelect", "memberNumberAsc", "table.sortNumber");
  setSelectOption("#sortSelect", "localityAsc", "table.sortLocality");
  setSelectOption("#sortSelect", "quotaOldest", "table.sortQuotaOldest");
  setSelectOption("#sortSelect", "quotaNewest", "table.sortQuotaNewest");
  setSelectOption("#sortSelect", "updatedDesc", "table.sortUpdated");
  setText(".table-panel th:nth-child(1)", "table.number");
  setText(".table-panel th:nth-child(2)", "app.name");
  setText(".table-panel th:nth-child(3)", "table.locality");
  setText(".table-panel th:nth-child(4)", "fields.taxNumber");
  setText(".table-panel th:nth-child(5)", "table.phone");
  setText(".table-panel th:nth-child(6)", "app.email");
  setText(".table-panel th:nth-child(7)", "table.approvalMinute");
  setText(".table-panel th:nth-child(8)", "table.quotas");
  setText(".table-panel th:nth-child(9)", "app.actions");
  setText(".empty-state h3", "table.emptyTitle");
  setText(".empty-state p", "table.emptyText");

  setText(".admin-panel-head h2", "admin.title");
  setText(".admin-panel-head p", "admin.subtitle");
  setText("#refreshUsersBtn span", "app.refresh");
  setAttributeText("#closeAdminDialogBtn", "title", "app.close");
  setAttributeText("#closeAdminDialogBtn", "aria-label", "app.close");
  setText("#createUserForm .form-section-title h3", "admin.createTitle");
  setText("#createUserForm .form-section-title p", "admin.createHint");
  setText("#userForm .form-section-title h3", "admin.editTitle");
  setText('label[for="createUserName"] span, label[for="accessUserName"] span', "app.name");
  setText('label[for="createUserEmail"] span, label[for="accessUserEmail"] span', "app.email");
  setText('label[for="createUserPassword"] span', "app.password");
  setText('label[for="createUserRole"] span, label[for="accessUserRole"] span', "app.profile");
  setText('label[for="accessUserActive"] span', "app.active");
  setText("#clearUserFormBtn", "app.clear");
  setText("#createUserForm .primary-button span", "admin.createButton");
  setText("#userForm .primary-button span", "app.saveChanges");
  setText(".user-table th:nth-child(1)", "app.name");
  setText(".user-table th:nth-child(2)", "app.email");
  setText(".user-table th:nth-child(3)", "app.profile");
  setText(".user-table th:nth-child(4)", "app.state");
  setText(".user-table th:nth-child(5)", "app.actions");

  setText(".history-panel h2", "history.title");
  setText(".history-panel-head p", "history.subtitle");
  setText("#refreshHistoryBtn span", "app.refresh");
  setAttributeText("#closeHistoryDialogBtn", "title", "app.close");
  setAttributeText("#closeHistoryDialogBtn", "aria-label", "app.close");
  setText(".history-table th:nth-child(1)", "history.date");
  setText(".history-table th:nth-child(2)", "history.action");
  setText(".history-table th:nth-child(3)", "history.member");
  setText(".history-table th:nth-child(4)", "history.changedBy");
  setText(".history-table th:nth-child(5)", "history.details");
  setText(".history-empty h3", "history.emptyTitle");
  setText(".history-empty p", "history.emptyText");

  setText(".manual-panel h2", "manual.title");
  setText(".manual-panel-head p", "manual.subtitle");
  setAttributeText(".manual-panel", "aria-label", "manual.title");
  setAttributeText("#closeManualDialogBtn", "title", "app.close");
  setAttributeText("#closeManualDialogBtn", "aria-label", "app.close");
  setText("[data-manual-user-title]", "manual.userTitle");
  setText("[data-manual-user-desc]", "manual.userDescription");
  setText("[data-manual-programmer-title]", "manual.programmerTitle");
  setText("[data-manual-programmer-desc]", "manual.programmerDescription");

  setText(".language-panel h2", "language.title");
  setText(".language-panel-head p", "language.subtitle");
  setAttributeText(".language-panel", "aria-label", "language.title");
  setAttributeText(".language-options", "aria-label", "language.optionsLabel");
  setAttributeText("#closeLanguageDialogBtn", "title", "app.close");
  setAttributeText("#closeLanguageDialogBtn", "aria-label", "app.close");
  setText('[data-language-option="pt"] [data-language-name]', "language.portuguese");
  setText('[data-language-option="pt"] [data-language-region]', "language.portugueseRegion");
  setText('[data-language-option="en"] [data-language-name]', "language.english");
  setText('[data-language-option="en"] [data-language-region]', "language.englishRegion");

  setText('label[for="memberNumber"] span', "fields.memberNumber");
  setText('label[for="approvalMinuteNumber"] span', "fields.approvalMinuteNumber");
  setText('label[for="admissionDate"] span', "fields.admissionDate");
  setText('label[for="quotaPaidUntil"] span', "fields.quotaPaidUntil");
  populateQuotaYearOptions();
  setText('label[for="quotaPaidAt"] span', "fields.quotaPaidAt");
  setText('label[for="name"] span', "fields.name");
  setText('label[for="address"] span', "fields.address");
  setText('label[for="postalCode"] span', "fields.postalCode");
  setText('label[for="locality"] span', "fields.locality");
  setText('label[for="idNumber"] span', "fields.idNumber");
  setText('label[for="taxNumber"] span', "fields.taxNumber");
  setText('label[for="profession"] span', "fields.profession");
  setText('label[for="birthDate"] span', "fields.birthDate");
  setText('label[for="phone"] span', "fields.phone");
  setText('label[for="email"] span', "fields.email");
  setText('label[for="notes"] span', "fields.notes");
  document.querySelector("#notes").placeholder = t("fields.notesPlaceholder");
  setAttributeText("#closeDialogBtn", "title", "app.close");
  setAttributeText("#closeDialogBtn", "aria-label", "app.close");
  setText("#deleteMemberBtn span", "app.delete");
  setText("#cancelBtn", "app.cancel");
  setText(".dialog-save-actions .primary-button span", "app.save");
}

function updateRoleSelectLabels() {
  ["createUserRole", "accessUserRole"].forEach((selectId) => {
    ["admin", "operator", "viewer"].forEach((role) => {
      setSelectOption(`#${selectId}`, role, `roles.${role}`);
    });
  });
}

function updateLanguageOptions() {
  elements.languageOptions.forEach((button) => {
    const isActive = button.dataset.languageOption === state.language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncOpenDialogText() {
  if (elements.dialog.open) {
    const member = state.members.find((item) => item.id === state.editingId);
    elements.dialogTitle.textContent = member ? t("member.editTitle") : t("member.newTitle");
    elements.dialogSubtitle.textContent = member ? member.name : t("member.subtitle");
  }

  if (!state.editingUserId) {
    elements.editingUserHint.textContent = t("admin.editHint");
  }
}

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (captchaScriptPromise) {
    return captchaScriptPromise;
  }

  captchaScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(t("app.captchaLoadError")));
    document.head.append(script);
  });

  return captchaScriptPromise;
}

function hideCaptcha() {
  captchaToken = "";
  elements.captchaContainer.hidden = true;
}

async function renderCaptcha() {
  captchaToken = "";

  if (!captchaEnabled()) {
    hideCaptcha();
    return;
  }

  elements.captchaContainer.hidden = false;

  try {
    await loadTurnstileScript();

    if (captchaWidgetId !== null && window.turnstile) {
      window.turnstile.reset(captchaWidgetId);
      return;
    }

    captchaWidgetId = window.turnstile.render(elements.captchaContainer, {
      sitekey: CONFIG.captchaSiteKey,
      callback: (token) => {
        captchaToken = token;
      },
      "expired-callback": () => {
        captchaToken = "";
      },
      "error-callback": () => {
        captchaToken = "";
      },
    });
  } catch (error) {
    elements.authError.textContent = error.message;
  }
}

async function syncLoginCaptchaVisibility() {
  if (!shouldRequireCaptcha()) {
    hideCaptcha();
    return;
  }

  await renderCaptcha();
}

function hydrateRememberedLogin() {
  if (!elements.rememberLoginDevice || !elements.loginEmail) {
    return;
  }

  try {
    const shouldRemember = localStorage.getItem(REMEMBER_LOGIN_STORAGE_KEY) === "true";
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_STORAGE_KEY) || "";

    elements.rememberLoginDevice.checked = shouldRemember;
    elements.loginEmail.value = shouldRemember ? rememberedEmail : "";
  } catch (_error) {
    elements.rememberLoginDevice.checked = false;
  }
}

function persistRememberedLogin(email) {
  if (!elements.rememberLoginDevice) {
    return;
  }

  try {
    if (!elements.rememberLoginDevice.checked) {
      localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
      localStorage.removeItem(REMEMBER_EMAIL_STORAGE_KEY);
      return;
    }

    localStorage.setItem(REMEMBER_LOGIN_STORAGE_KEY, "true");
    localStorage.setItem(REMEMBER_EMAIL_STORAGE_KEY, email);
  } catch (_error) {
    // Nunca guardamos passwords; se localStorage falhar, o login continua normal.
  }
}

async function handleAuthState(session) {
  state.session = session;
  state.user = session?.user || null;
  state.profile = null;
  state.members = [];
  state.auditLogs = [];
  state.users = [];
  state.editingUserId = null;

  if (!state.user) {
    window.location.href = "/logout?next=/area/socios/";
    return;
  }

  try {
    state.profile = await loadProfile();

    if (!state.profile?.active) {
      await supabaseClient.auth.signOut();
      showLogin("Esta conta não está autorizada.");
      return;
    }

    showApp();
    await detectOptionalFeatures();
    await refreshMembers();
    if (canManageUsers()) {
      await refreshAppUsers();
    }
  } catch (error) {
    await supabaseClient.auth.signOut();
    showLogin(error.message || "Não foi possível confirmar as permissões.");
  }
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("app_users")
    .select("id,email,full_name,role,active")
    .eq("id", state.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Conta sem perfil de acesso. Peça ao administrador para autorizar este utilizador.");
  }

  return data;
}

function showSetup() {
  elements.setupView.hidden = false;
  elements.authView.hidden = true;
  elements.appShell.hidden = true;
  renderIcons();
}

function showLogin(message = "") {
  window.location.href = "/logout?next=/area/socios/";
  return;

  elements.setupView.hidden = true;
  elements.authView.hidden = false;
  elements.appShell.hidden = true;
  elements.authError.textContent = message;
  setLoginLoading(false);
  elements.loginForm.reset();
  syncCsrfTokens();
  hydrateRememberedLogin();
  syncLoginCaptchaVisibility();
  renderIcons();
}

function showApp() {
  elements.setupView.hidden = true;
  elements.authView.hidden = true;
  elements.appShell.hidden = false;
  elements.userEmail.textContent = state.profile.full_name || state.profile.email || state.user.email || "";
  elements.userRole.textContent = roleLabel(state.profile.role);
  applyPermissions();
  updateStaticLanguageText();
  renderIcons();
}

function applyPermissions() {
  const writeAllowed = canWrite();
  const exportAllowed = canExport();
  const manageUsersAllowed = canManageUsers();
  const manualsAllowed = canViewManuals();

  elements.newMemberBtn.hidden = !writeAllowed;
  elements.adminManagerBtn.hidden = !manageUsersAllowed;
  if (elements.importBtn) {
    elements.importBtn.hidden = true;
  }
  elements.exportJsonBtn.hidden = true;
  elements.exportCsvBtn.hidden = !exportAllowed;
  elements.historyBtn.hidden = !manageUsersAllowed;
  elements.manualBtn.hidden = !manualsAllowed;
  elements.notesField.hidden = !state.supportsNotes;
  elements.quotaPaidAtField.hidden = !state.supportsQuotaPaidAt;
  elements.approvalMinuteNumberField.hidden = !state.supportsApprovalMinuteNumber;

  if (!manageUsersAllowed && elements.adminDialog.open) {
    closeAdminDialog();
  }

  if (!manageUsersAllowed && elements.historyDialog.open) {
    closeHistoryDialog();
  }

  if (!manualsAllowed && elements.manualDialog.open) {
    closeManualDialog();
  }
}

function canWrite() {
  return ["admin", "operator"].includes(state.profile?.role);
}

function canDelete() {
  return state.profile?.role === "admin";
}

function canExport() {
  return ["admin", "operator"].includes(state.profile?.role);
}

function canManageUsers() {
  return state.profile?.role === "admin";
}

function canViewManuals() {
  return ["admin", "operator"].includes(state.profile?.role);
}

async function detectOptionalFeatures() {
  const [{ error: notesError }, { error: quotaPaidAtError }, { error: approvalMinuteNumberError }] = await Promise.all([
    supabaseClient.from("members").select("notes").limit(1),
    supabaseClient.from("members").select("quota_paid_at").limit(1),
    supabaseClient.from("members").select("approval_minute_number").limit(1),
  ]);
  const notesMessage = String(notesError?.message || "");
  const quotaPaidAtMessage = String(quotaPaidAtError?.message || "");
  const approvalMinuteNumberMessage = String(approvalMinuteNumberError?.message || "");
  state.supportsNotes = !(notesMessage.includes("notes") && (notesMessage.includes("column") || notesMessage.includes("schema cache")));
  state.supportsQuotaPaidAt = !(quotaPaidAtMessage.includes("quota_paid_at") && (quotaPaidAtMessage.includes("column") || quotaPaidAtMessage.includes("schema cache")));
  state.supportsApprovalMinuteNumber = !(approvalMinuteNumberMessage.includes("approval_minute_number") && (approvalMinuteNumberMessage.includes("column") || approvalMinuteNumberMessage.includes("schema cache")));
  applyPermissions();
}

async function refreshMembers() {
  const { data, error } = await supabaseClient.from("members").select("*").order("name", { ascending: true });

  if (error) {
    showToast(error.message || "Não foi possível carregar os sócios.");
    return;
  }

  state.members = (data || []).map(dbToMember);
  populateQuotaYearOptions();
  render();
}

async function refreshAppUsers() {
  if (!canManageUsers()) {
    state.users = [];
    renderAppUsers();
    return;
  }

  const { data, error } = await supabaseClient
    .from("app_users")
    .select("id,email,full_name,role,active,updated_at")
    .order("email", { ascending: true });

  if (error) {
    showToast(error.message || "Não foi possível carregar os utilizadores.");
    return;
  }

  state.users = data || [];
  renderAppUsers();
}

async function refreshHistory() {
  if (!canManageUsers()) {
    state.auditLogs = [];
    renderHistory();
    return;
  }

  elements.historyError.textContent = "";

  const { data, error } = await supabaseClient
    .from("member_audit_log")
    .select("id,member_id,action,changed_at,changed_by,old_data,new_data")
    .order("changed_at", { ascending: false })
    .limit(120);

  if (error) {
    state.auditLogs = [];
    elements.historyError.textContent = friendlyHistoryError(error);
    renderHistory();
    return;
  }

  state.auditLogs = data || [];
  renderHistory();
}

function renderAppUsers() {
  if (!elements.usersTable) {
    return;
  }

  if (!state.users.length) {
    elements.usersTable.innerHTML = `
      <tr>
        <td colspan="5">
          <span class="muted-cell">${escapeHtml(t("admin.usersEmpty"))}</span>
        </td>
      </tr>
    `;
    renderIcons();
    return;
  }

  elements.usersTable.innerHTML = state.users.map(renderAppUserRow).join("");
  renderIcons();
}

function renderHistory() {
  if (!elements.historyTable) {
    return;
  }

  elements.historyEmptyState.hidden = state.auditLogs.length > 0 || Boolean(elements.historyError.textContent);
  elements.historyTable.innerHTML = state.auditLogs.map(renderHistoryRow).join("");
  renderIcons();
}

function renderHistoryRow(entry) {
  const subject = getAuditSubject(entry);
  const actor = getAuditActor(entry.changed_by);
  const actionClass = `is-${entry.action}`;

  return `
    <tr>
      <td>${escapeHtml(formatDateTime(entry.changed_at))}</td>
      <td><span class="audit-action ${actionClass}">${escapeHtml(auditActionLabel(entry.action))}</span></td>
      <td>
        <div class="member-name">
          <strong>${escapeHtml(subject.name)}</strong>
          <span>${escapeHtml(subject.detail)}</span>
        </div>
      </td>
      <td>${escapeHtml(actor)}</td>
      <td>${renderAuditDetails(entry)}</td>
    </tr>
  `;
}

function getAuditSubject(entry) {
  const data = entry.new_data || entry.old_data || {};
  const name = data.name || t("member.noName");
  const memberNumber = data.member_number ? `${t("table.number")} ${data.member_number}` : t("member.noNumber");
  return { name, detail: memberNumber };
}

function getAuditActor(userId) {
  if (!userId) {
    return t("history.system");
  }

  const user = state.users.find((item) => item.id === userId);
  return user?.full_name || user?.email || t("history.authorizedUser");
}

function renderAuditDetails(entry) {
  if (entry.action === "insert") {
    return `<span class="muted-cell">${escapeHtml(t("history.created"))}</span>`;
  }

  if (entry.action === "delete") {
    return `<span class="muted-cell">${escapeHtml(t("history.deleted"))}</span>`;
  }

  const changes = getAuditChanges(entry.old_data || {}, entry.new_data || {});
  if (!changes.length) {
    return `<span class="muted-cell">${escapeHtml(t("history.noVisibleChanges"))}</span>`;
  }

  const visibleChanges = changes.slice(0, 5);
  const hiddenCount = changes.length - visibleChanges.length;
  return `
    <div class="history-changes">
      ${visibleChanges
        .map(
          (change) => `
            <span class="history-change">
              <strong>${escapeHtml(change.label)}</strong>
              ${escapeHtml(change.before)} → ${escapeHtml(change.after)}
            </span>
          `,
        )
        .join("")}
      ${hiddenCount > 0 ? `<span class="history-change">${escapeHtml(t("history.moreChanges", { count: hiddenCount }))}</span>` : ""}
    </div>
  `;
}

function getAuditChanges(oldData, newData) {
  return Object.keys(auditFieldLabels)
    .filter((field) => !ignoredAuditFields.has(field))
    .filter((field) => normaliseAuditValue(oldData[field]) !== normaliseAuditValue(newData[field]))
    .map((field) => ({
      label: t(`fields.${dbFieldToAppField(field)}`) || auditFieldLabels[field],
      before: formatAuditValue(field, oldData[field]),
      after: formatAuditValue(field, newData[field]),
    }));
}

function dbFieldToAppField(field) {
  const map = {
    member_number: "memberNumber",
    approval_minute_number: "approvalMinuteNumber",
    admission_date: "admissionDate",
    quota_paid_until: "quotaPaidUntil",
    quota_paid_at: "quotaPaidAt",
    postal_code: "postalCode",
    id_number: "idNumber",
    tax_number: "taxNumber",
    birth_date: "birthDate",
  };

  return map[field] || field;
}

function normaliseAuditValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function formatAuditValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return t("history.emptyValue");
  }

  if (field.endsWith("_date") || field === "quota_paid_until" || field === "quota_paid_at") {
    if (field === "quota_paid_until") {
      return formatQuotaYearLabel(String(value));
    }
    return formatDate(String(value));
  }

  return String(value);
}

function renderAppUserRow(user) {
  const isSelf = user.id === state.user?.id;
  const name = user.full_name || t("member.noName");
  const role = roleLabel(user.role);
  const statusClass = user.active ? "is-active" : "is-inactive";
  const statusText = user.active ? t("app.active") : state.language === "en" ? "Inactive" : "Inativo";
  const toggleButton = isSelf
    ? `<span class="muted-cell">${escapeHtml(t("admin.self"))}</span>`
    : `
      <button class="icon-button" type="button" title="${escapeAttribute(t(user.active ? "admin.deactivateUser" : "admin.activateUser", { name }))}" aria-label="${escapeAttribute(t(user.active ? "admin.deactivateUser" : "admin.activateUser", { name }))}" data-action="toggle-user" data-id="${escapeAttribute(user.id)}">
        <i data-lucide="${user.active ? "user-x" : "user-check"}"></i>
      </button>
    `;

  return `
    <tr>
      <td>
        <div class="member-name">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(user.id)}</span>
        </div>
      </td>
      <td>${escapeHtml(user.email || "—")}</td>
      <td>${escapeHtml(role)}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span></td>
      <td class="actions-column">
        <div class="row-actions">
          <button class="icon-button" type="button" title="${escapeAttribute(t("app.edit"))}" aria-label="${escapeAttribute(t("admin.editUser", { name }))}" data-action="edit-user" data-id="${escapeAttribute(user.id)}">
            <i data-lucide="pencil"></i>
          </button>
          ${toggleButton}
          ${
            isSelf
              ? ""
              : `
                <button class="icon-button danger" type="button" title="${escapeAttribute(t("app.delete"))}" aria-label="${escapeAttribute(t("admin.deleteUser", { name }))}" data-action="delete-user" data-id="${escapeAttribute(user.id)}">
                  <i data-lucide="trash-2"></i>
                </button>
              `
          }
        </div>
      </td>
    </tr>
  `;
}

function dbToMember(row) {
  return {
    id: row.id,
    memberNumber: row.member_number || "",
    approvalMinuteNumber: row.approval_minute_number || "",
    admissionDate: row.admission_date || "",
    quotaPaidUntil: row.quota_paid_until || "",
    quotaPaidAt: row.quota_paid_at || "",
    name: row.name || "",
    address: row.address || "",
    postalCode: row.postal_code || "",
    locality: row.locality || "",
    idNumber: row.id_number || "",
    taxNumber: row.tax_number || "",
    profession: row.profession || "",
    birthDate: row.birth_date || "",
    phone: row.phone || "",
    email: row.email || "",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function memberToDb(member) {
  const payload = {
    member_number: emptyToNull(member.memberNumber),
    admission_date: emptyToNull(member.admissionDate),
    quota_paid_until: emptyToNull(member.quotaPaidUntil),
    name: member.name.trim(),
    address: emptyToNull(member.address),
    postal_code: emptyToNull(member.postalCode),
    locality: emptyToNull(member.locality),
    id_number: emptyToNull(member.idNumber),
    tax_number: emptyToNull(onlyDigits(member.taxNumber)),
    profession: emptyToNull(member.profession),
    birth_date: emptyToNull(member.birthDate),
    phone: emptyToNull(member.phone),
    email: emptyToNull(member.email),
  };

  if (state.supportsNotes) {
    payload.notes = emptyToNull(member.notes);
  }

  if (state.supportsApprovalMinuteNumber) {
    payload.approval_minute_number = emptyToNull(member.approvalMinuteNumber);
  }

  if (state.supportsQuotaPaidAt) {
    payload.quota_paid_at = emptyToNull(member.quotaPaidAt);
  }

  return payload;
}

function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalise(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMemberAddress(member) {
  return [member.address, member.postalCode].filter(Boolean).join(" · ");
}

function getVisibleMembers() {
  const query = normalise(state.query);
  const filtered = state.members.filter((member) => {
    if (!matchesActiveFilter(member)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchable = fields.map((field) => member[field]).join(" ");
    return normalise(searchable).includes(query);
  });

  return filtered.sort((a, b) => {
    const nameA = normalise(a.name);
    const nameB = normalise(b.name);

    if (state.sort === "nameDesc") {
      return nameB.localeCompare(nameA, "pt");
    }

    if (state.sort === "localityAsc") {
      return normalise(a.locality).localeCompare(normalise(b.locality), "pt") || nameA.localeCompare(nameB, "pt");
    }

    if (state.sort === "quotaOldest") {
      return compareDates(a.quotaPaidUntil, b.quotaPaidUntil, "emptyLast") || nameA.localeCompare(nameB, "pt");
    }

    if (state.sort === "quotaNewest") {
      return compareDates(b.quotaPaidUntil, a.quotaPaidUntil, "emptyLast") || nameA.localeCompare(nameB, "pt");
    }

    if (state.sort === "memberNumberAsc") {
      return compareMemberNumbers(a.memberNumber, b.memberNumber) || nameA.localeCompare(nameB, "pt");
    }

    if (state.sort === "updatedDesc") {
      return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
    }

    return nameA.localeCompare(nameB, "pt");
  });
}

function matchesActiveFilter(member) {
  if (state.filter === "overdue") {
    return isQuotaOverdue(member.quotaPaidUntil);
  }

  if (state.filter === "paid") {
    return Boolean(member.quotaPaidUntil) && !isQuotaOverdue(member.quotaPaidUntil);
  }

  return true;
}

function setActiveFilter(filter) {
  state.filter = filter || "all";
  updateFilterButtons();
  render();
}

function updateFilterButtons() {
  elements.quickFilters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function compareDates(a, b, emptyMode = "emptyLast") {
  const valueA = dateSortValue(a, emptyMode);
  const valueB = dateSortValue(b, emptyMode);
  return valueA - valueB;
}

function dateSortValue(value, emptyMode) {
  if (!value) {
    return emptyMode === "emptyFirst" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function compareMemberNumbers(a, b) {
  const textA = String(a ?? "").trim();
  const textB = String(b ?? "").trim();

  if (!textA && !textB) {
    return 0;
  }

  if (!textA) {
    return 1;
  }

  if (!textB) {
    return -1;
  }

  return textA.localeCompare(textB, "pt", { numeric: true, sensitivity: "base" });
}

function render() {
  const visibleMembers = getVisibleMembers();
  const overdueMembers = state.members.filter((member) => isQuotaOverdue(member.quotaPaidUntil));
  const paidMembers = state.members.filter((member) => member.quotaPaidUntil && !isQuotaOverdue(member.quotaPaidUntil));

  elements.memberCount.textContent = state.members.length;
  elements.overdueCount.textContent = overdueMembers.length;
  elements.paidCount.textContent = paidMembers.length;
  elements.resultCount.textContent = `${visibleMembers.length} ${visibleMembers.length === 1 ? t("table.resultsSingular") : t("table.resultsPlural")}`;
  elements.emptyState.hidden = visibleMembers.length > 0;
  elements.membersTable.innerHTML = visibleMembers.map(renderMemberRow).join("");
  updateDashboardInsights(overdueMembers, paidMembers);
  updateFilterButtons();
  applyPermissions();
  renderIcons();
}

function updateDashboardInsights(overdueMembers, paidMembers) {
  const overdueCount = overdueMembers.length;
  const total = state.members.length;
  const latestMember = getLatestMember();

  elements.quotaInsightCard.classList.toggle("has-alert", overdueCount > 0);
  elements.quotaInsightIcon.innerHTML = `<i data-lucide="${overdueCount > 0 ? "triangle-alert" : "check-circle-2"}"></i>`;

  if (!total) {
    elements.quotaInsightTitle.textContent = t("insight.baseReady");
    elements.quotaInsightDetail.textContent = t("insight.baseReadyDetail");
  } else if (overdueCount > 0) {
    elements.quotaInsightTitle.textContent = `${overdueCount} ${overdueCount === 1 ? t("insight.overdueSingular") : t("insight.overduePlural")}`;
    elements.quotaInsightDetail.textContent = t("insight.overdueDetail");
  } else {
    elements.quotaInsightTitle.textContent = t("insight.noOverdue");
    elements.quotaInsightDetail.textContent = paidMembers.length
      ? `${paidMembers.length} ${paidMembers.length === 1 ? t("insight.paidSingular") : t("insight.paidPlural")} ${t("insight.paidDetail")}`
      : t("insight.noPaid");
  }

  if (!latestMember) {
    elements.latestMemberName.textContent = t("insight.noRecords");
    elements.latestMemberDetail.textContent = t("insight.waitingFirst");
    return;
  }

  elements.latestMemberName.textContent = latestMember.name || t("member.noName");
  elements.latestMemberDetail.textContent = latestMember.admissionDate
    ? `${t("insight.admission")}: ${formatDate(latestMember.admissionDate)}`
    : latestMember.updatedAt
      ? t("insight.updated")
      : t("insight.registered");
}

function getLatestMember() {
  return [...state.members].sort((a, b) => {
    const dateA = a.updatedAt || a.createdAt || a.admissionDate || "";
    const dateB = b.updatedAt || b.createdAt || b.admissionDate || "";
    return String(dateB).localeCompare(String(dateA));
  })[0] || null;
}

function renderMemberRow(member) {
  const address = formatMemberAddress(member);
  const birthday = member.birthDate ? `${t("member.birth")}: ${formatDate(member.birthDate)}` : t("member.birthMissing");
  const admission = member.admissionDate ? `${t("insight.admission")}: ${formatDate(member.admissionDate)}` : "";
  const quotaOverdue = isQuotaOverdue(member.quotaPaidUntil);
  const notesBadge = member.notes ? `<span class="note-badge"><i data-lucide="sticky-note"></i> ${escapeHtml(t("member.notes"))}</span>` : "";
  const detailLine = [address, admission].filter(Boolean).join(" · ") || birthday;
  const actions = renderRowActions(member);

  return `
    <tr class="${quotaOverdue ? "quota-overdue" : ""}">
      <td>${escapeHtml(member.memberNumber || t("member.noNumber"))}</td>
      <td>
        <div class="member-name">
          <strong>${escapeHtml(member.name || t("member.noName"))}</strong>
          <span>${escapeHtml(detailLine)}</span>
          ${notesBadge}
        </div>
      </td>
      <td>${escapeHtml(member.locality || "—")}</td>
      <td>${escapeHtml(member.taxNumber || "—")}</td>
      <td>${escapeHtml(member.phone || "—")}</td>
      <td>${member.email ? `<a href="mailto:${escapeAttribute(member.email)}">${escapeHtml(member.email)}</a>` : "—"}</td>
      <td>${escapeHtml(member.approvalMinuteNumber || t("member.noNumber"))}</td>
      <td>${renderQuotaStatus(member.quotaPaidUntil, member.quotaPaidAt)}</td>
      <td class="actions-column">${actions}</td>
    </tr>
  `;
}

function isQuotaOverdue(value) {
  if (!value) {
    return false;
  }

  const quotaDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(quotaDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return quotaDate < today;
}

function renderQuotaStatus(value, paidAt = "") {
  if (!value) {
    return `<span class="muted-cell">${escapeHtml(t("member.noQuota"))}</span>`;
  }

  const quotaLabel = formatQuotaYearLabel(value);
  const paidAtLine = paidAt ? `<small>${escapeHtml(t("member.paidOn", { date: formatDate(paidAt) }))}</small>` : "";

  if (isQuotaOverdue(value)) {
    return `
      <span class="quota-status is-overdue">
        <i data-lucide="triangle-alert"></i>
        <span>
          ${escapeHtml(t("member.overdueSince", { quota: quotaLabel }))}
          ${paidAtLine}
        </span>
      </span>
    `;
  }

  return `
    <span class="quota-status">
      <span>
        ${escapeHtml(t("member.paidUntil", { quota: quotaLabel }))}
        ${paidAtLine}
      </span>
    </span>
  `;
}

function renderRowActions(member) {
  if (!canWrite() && !canDelete()) {
    return `<span class="muted-cell">—</span>`;
  }

  const editButton = canWrite()
    ? `
      <button class="icon-button" type="button" title="${escapeAttribute(t("app.edit"))}" aria-label="${escapeAttribute(t("app.edit"))} ${escapeAttribute(member.name || t("history.member"))}" data-action="edit" data-id="${escapeAttribute(member.id)}">
        <i data-lucide="pencil"></i>
      </button>
    `
    : "";

  const payQuotaButton = canWrite()
    ? `
      <button class="secondary-button row-pay-button" type="button" title="${escapeAttribute(t("member.payQuota"))}" aria-label="${escapeAttribute(t("member.payQuota"))} ${escapeAttribute(member.name || t("history.member"))}" data-action="pay-quota" data-id="${escapeAttribute(member.id)}">
        <i data-lucide="badge-check"></i>
        <span>${escapeHtml(t("member.payQuota"))}</span>
      </button>
    `
    : "";

  const deleteButton = canDelete()
    ? `
      <button class="icon-button danger member-delete-button" type="button" title="${escapeAttribute(t("app.delete"))}" aria-label="${escapeAttribute(t("app.delete"))} ${escapeAttribute(member.name || t("history.member"))}" data-action="delete" data-id="${escapeAttribute(member.id)}">
        <i data-lucide="trash-2"></i>
      </button>
    `
    : "";

  return `<div class="row-actions">${payQuotaButton}${editButton}${deleteButton}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function openMemberDialog(member = null) {
  if (!canWrite()) {
    showToast(t("messages.noPermissionMembers"));
    return;
  }

  state.editingId = member?.id ?? null;
  elements.form.reset();
  syncCsrfTokens();
  elements.formError.textContent = "";
  elements.dialogTitle.textContent = member ? t("member.editTitle") : t("member.newTitle");
  elements.dialogSubtitle.textContent = member ? member.name : t("member.subtitle");
  elements.deleteMemberBtn.hidden = !member || !canDelete();
  document.querySelector("#memberId").value = member?.id ?? "";
  populateQuotaYearOptions(member?.quotaPaidUntil ?? "");

  fields.forEach((field) => {
    document.querySelector(`#${field}`).value = member?.[field] ?? "";
  });

  if (!member) {
    document.querySelector("#admissionDate").value = todayInputValue();
  }

  elements.dialog.showModal();
  document.querySelector("#memberNumber").focus();
}

function closeMemberDialog() {
  elements.dialog.close();
  state.editingId = null;
}

async function openAdminDialog() {
  if (!canManageUsers()) {
    showToast(t("messages.adminUsersOnly"));
    return;
  }

  closeToolsMenu();
  clearUserForm();
  clearCreateUserForm();
  elements.adminDialog.showModal();
  await refreshAppUsers();
  renderIcons();
}

function closeAdminDialog() {
  if (elements.adminDialog.open) {
    elements.adminDialog.close();
  }
  clearUserForm();
  clearCreateUserForm();
}

async function openHistoryDialog() {
  if (!canManageUsers()) {
    showToast(t("messages.adminHistoryOnly"));
    return;
  }

  closeToolsMenu();
  elements.historyError.textContent = "";
  elements.historyDialog.showModal();

  if (!state.users.length) {
    await refreshAppUsers();
  }

  await refreshHistory();
  renderIcons();
}

function closeHistoryDialog() {
  if (elements.historyDialog.open) {
    elements.historyDialog.close();
  }
}

function openManualDialog() {
  if (!canViewManuals()) {
    showToast(t("messages.manualsOnly"));
    return;
  }

  closeToolsMenu();
  elements.manualDialog.showModal();
  renderIcons();
}

function closeManualDialog() {
  if (elements.manualDialog.open) {
    elements.manualDialog.close();
  }
}

function openLanguageDialog() {
  closeToolsMenu();
  updateLanguageOptions();
  elements.languageDialog.showModal();
  renderIcons();
}

function closeLanguageDialog() {
  if (elements.languageDialog.open) {
    elements.languageDialog.close();
  }
}

function handleLanguageChoice(language) {
  applyLanguage(language);
  closeLanguageDialog();
  showToast(t("language.changed"));
}

function setToolsMenuOpen(isOpen) {
  elements.toolsMenu.hidden = !isOpen;
  elements.toolsMenuBtn.setAttribute("aria-expanded", String(isOpen));
}

function closeToolsMenu() {
  if (!elements.toolsMenu.hidden) {
    setToolsMenuOpen(false);
  }
}

function toggleToolsMenu() {
  setToolsMenuOpen(elements.toolsMenu.hidden);
}

function clearCreateUserForm() {
  elements.createUserForm.reset();
  syncCsrfTokens();
  elements.createUserRole.value = "admin";
  elements.createUserError.textContent = "";
}

function clearUserForm() {
  state.editingUserId = null;
  elements.userForm.reset();
  syncCsrfTokens();
  elements.accessUserActive.checked = true;
  elements.accessUserRole.value = "viewer";
  elements.accessUserId.value = "";
  elements.editingUserHint.textContent = t("admin.editHint");
  elements.userFormError.textContent = "";
}

function fillUserForm(user) {
  state.editingUserId = user.id;
  elements.accessUserId.value = user.id || "";
  elements.accessUserName.value = user.full_name || "";
  elements.accessUserEmail.value = user.email || "";
  elements.accessUserRole.value = user.role || "viewer";
  elements.accessUserActive.checked = Boolean(user.active);
  elements.editingUserHint.textContent = state.language === "en" ? `Editing: ${user.full_name || user.email || user.id}` : `A editar: ${user.full_name || user.email || user.id}`;
  elements.userFormError.textContent = "";
  elements.accessUserName.focus();
}

function validateUserAccess(user) {
  const errors = [];

  if (!user.id) {
    errors.push("Escolha primeiro um utilizador para editar.");
    return errors;
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
    errors.push("O ID do utilizador tem de ser o UUID do Supabase Auth.");
  }

  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push("Indique um email válido.");
  }

  if (!["admin", "operator", "viewer"].includes(user.role)) {
    errors.push("Escolha um perfil válido.");
  }

  if (user.id === state.user?.id && !user.active) {
    errors.push("Não desative a sua própria conta.");
  }

  return errors;
}

function validateCreateUser(user) {
  const errors = [];

  if (!user.fullName || user.fullName.length < 2) {
    errors.push("Indique o nome do utilizador.");
  }

  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push("Indique um email válido.");
  }

  if (!user.password || user.password.length < 8) {
    errors.push("A password deve ter pelo menos 8 caracteres.");
  }

  if (!["admin", "operator", "viewer"].includes(user.role)) {
    errors.push("Escolha um perfil válido.");
  }

  return errors;
}

async function handleCreateUserSubmit(event) {
  event.preventDefault();

  if (!canManageUsers()) {
    showToast("Só administradores podem criar utilizadores.");
    return;
  }

  const formData = new FormData(elements.createUserForm);
  if (!hasValidCsrfToken(formData)) {
    setCsrfError(elements.createUserError);
    return;
  }

  const user = {
    fullName: String(formData.get("fullName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
    role: String(formData.get("role") || "admin"),
  };

  const errors = validateCreateUser(user);
  if (errors.length) {
    elements.createUserError.textContent = errors[0];
    return;
  }

  elements.createUserError.textContent = "";
  const submitButton = elements.createUserForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const session = state.session || (await supabaseClient.auth.getSession()).data.session;
    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Não foi possível criar o utilizador.");
    }

    clearCreateUserForm();
    await refreshAppUsers();
    showToast(`Utilizador criado: ${result.email || user.email}.`);
  } catch (error) {
    elements.createUserError.textContent = friendlyCreateUserError(error);
  } finally {
    submitButton.disabled = false;
  }
}

async function handleUserSubmit(event) {
  event.preventDefault();

  if (!canManageUsers()) {
    showToast("Só administradores podem gerir utilizadores.");
    return;
  }

  const formData = new FormData(elements.userForm);
  if (!hasValidCsrfToken(formData)) {
    setCsrfError(elements.userFormError);
    return;
  }

  const user = {
    id: String(formData.get("id") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    full_name: emptyToNull(formData.get("fullName")),
    role: String(formData.get("role") || "viewer"),
    active: formData.get("active") === "on",
  };

  const errors = validateUserAccess(user);
  if (errors.length) {
    elements.userFormError.textContent = errors[0];
    return;
  }

  const { error } = await supabaseClient.from("app_users").upsert(user, { onConflict: "id" });

  if (error) {
    elements.userFormError.textContent = friendlyDatabaseError(error);
    return;
  }

  await refreshAppUsers();
  if (user.id === state.user?.id) {
    state.profile = await loadProfile();
    showApp();
  }

  clearUserForm();
  showToast("Acesso de utilizador guardado.");
}

async function handleToggleUser(id) {
  if (!canManageUsers()) {
    return;
  }

  if (id === state.user?.id) {
    showToast("Não desative a sua própria conta.");
    return;
  }

  const user = state.users.find((item) => item.id === id);
  if (!user) {
    return;
  }

  const { error } = await supabaseClient.from("app_users").update({ active: !user.active }).eq("id", id);
  if (error) {
    showToast(friendlyDatabaseError(error));
    return;
  }

  await refreshAppUsers();
  showToast(user.active ? "Utilizador desativado." : "Utilizador ativado.");
}

async function handleDeleteUser(id) {
  if (!canManageUsers()) {
    showToast("Só administradores podem eliminar utilizadores.");
    return;
  }

  if (id === state.user?.id) {
    showToast("Não elimine a sua própria conta.");
    return;
  }

  const user = state.users.find((item) => item.id === id);
  if (!user) {
    return;
  }

  const confirmed = window.confirm(`Eliminar o acesso de ${user.full_name || user.email}? Esta ação remove a conta de login.`);
  if (!confirmed) {
    return;
  }

  try {
    const session = state.session || (await supabaseClient.auth.getSession()).data.session;
    const response = await fetch("/api/delete-user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Não foi possível eliminar o utilizador.");
    }

    if (state.editingUserId === id) {
      clearUserForm();
    }

    await refreshAppUsers();
    showToast(`Utilizador eliminado: ${result.email || user.email || "acesso removido"}.`);
  } catch (error) {
    showToast(friendlyAdminActionError(error));
  }
}

function validateForm(member) {
  const errors = [];
  const nif = onlyDigits(member.taxNumber);
  const postalCode = member.postalCode.trim();
  const phoneDigits = onlyDigits(member.phone);
  const birthDate = member.birthDate ? new Date(`${member.birthDate}T00:00:00`) : null;
  const admissionDate = member.admissionDate ? new Date(`${member.admissionDate}T00:00:00`) : null;
  const quotaPaidUntil = member.quotaPaidUntil ? new Date(`${member.quotaPaidUntil}T00:00:00`) : null;
  const quotaPaidAt = member.quotaPaidAt ? new Date(`${member.quotaPaidAt}T00:00:00`) : null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (!member.name.trim()) {
    errors.push("O nome é obrigatório.");
  }

  if (
    member.memberNumber &&
    state.members.some((item) => item.id !== member.id && normalise(item.memberNumber) === normalise(member.memberNumber))
  ) {
    errors.push("Já existe um sócio com esse número.");
  }

  if (member.taxNumber && nif.length !== 9) {
    errors.push("O NIF deve ter 9 dígitos.");
  }

  if (postalCode && !/^\d{4}-\d{3}$/.test(postalCode)) {
    errors.push("O código postal deve usar o formato 0000-000.");
  }

  if (member.phone && (!/^[+\d\s().-]{9,24}$/.test(member.phone) || phoneDigits.length < 9 || phoneDigits.length > 15)) {
    errors.push("O telemóvel deve ter entre 9 e 15 dígitos.");
  }

  if (birthDate && Number.isNaN(birthDate.getTime())) {
    errors.push("A data de nascimento não parece válida.");
  }

  if (birthDate && birthDate > today) {
    errors.push("A data de nascimento não pode estar no futuro.");
  }

  if (admissionDate && Number.isNaN(admissionDate.getTime())) {
    errors.push("A data de adesão não parece válida.");
  }

  if (admissionDate && admissionDate > today) {
    errors.push("A data de adesão não pode estar no futuro.");
  }

  if (quotaPaidUntil && Number.isNaN(quotaPaidUntil.getTime())) {
    errors.push("A última quota paga não parece válida.");
  }

  if (quotaPaidAt && Number.isNaN(quotaPaidAt.getTime())) {
    errors.push("A data do pagamento da quota não parece válida.");
  }

  if (quotaPaidAt && quotaPaidAt > today) {
    errors.push("A data do pagamento da quota não pode estar no futuro.");
  }

  if (birthDate && admissionDate && birthDate > admissionDate) {
    errors.push("A data de nascimento não pode ser posterior à data de adesão.");
  }

  if (admissionDate && quotaPaidUntil && quotaPaidUntil < admissionDate) {
    errors.push("A última quota paga não pode ser anterior à data de adesão.");
  }

  return errors;
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!canWrite()) {
    showToast("Não tem permissão para guardar alterações.");
    return;
  }

  const formData = new FormData(elements.form);
  if (!hasValidCsrfToken(formData)) {
    setCsrfError(elements.formError);
    return;
  }

  const member = { id: state.editingId };

  fields.forEach((field) => {
    member[field] = String(formData.get(field) ?? "").trim();
  });

  member.taxNumber = onlyDigits(member.taxNumber);
  if (!member.quotaPaidUntil) {
    member.quotaPaidAt = "";
  }

  const errors = validateForm(member);
  if (errors.length) {
    elements.formError.textContent = errors[0];
    return;
  }

  const payload = memberToDb(member);
  const response = state.editingId
    ? await supabaseClient.from("members").update(payload).eq("id", state.editingId)
    : await supabaseClient.from("members").insert(payload);

  if (response.error) {
    elements.formError.textContent = friendlyDatabaseError(response.error);
    return;
  }

  const wasEditing = Boolean(state.editingId);
  await refreshMembers();
  closeMemberDialog();
  showToast(wasEditing ? "Sócio atualizado." : "Sócio adicionado.");
}

async function handlePayQuota(id) {
  if (!canWrite()) {
    showToast(t("messages.noPermissionMembers"));
    return;
  }

  if (!state.supportsQuotaPaidAt) {
    showToast(t("messages.quotaPaidAtMissing"));
    return;
  }

  const member = state.members.find((item) => item.id === id);
  if (!member) {
    return;
  }

  const year = nextQuotaYear(member);
  const quotaDate = quotaDateForYear(year);
  const paidAt = todayInputValue();
  const quotaLabel = t("member.quotaYear", { year });
  const name = member.name || t("member.noName");

  if (!window.confirm(t("member.payQuotaConfirm", { quota: quotaLabel, name }))) {
    return;
  }

  const { error } = await supabaseClient
    .from("members")
    .update({
      quota_paid_until: quotaDate,
      quota_paid_at: paidAt,
    })
    .eq("id", id);

  if (error) {
    showToast(friendlyDatabaseError(error));
    return;
  }

  await refreshMembers();
  showToast(t("member.payQuotaDone", { quota: quotaLabel }));
}

async function handleDelete(id) {
  if (!canDelete()) {
    showToast("Só administradores podem apagar sócios.");
    return;
  }

  const member = state.members.find((item) => item.id === id);
  if (!member) {
    return;
  }

  const confirmed = window.confirm(`Apagar o registo de ${member.name}?`);
  if (!confirmed) {
    return;
  }

  const { error } = await supabaseClient.from("members").delete().eq("id", id);
  if (error) {
    showToast(friendlyDatabaseError(error));
    return;
  }

  await refreshMembers();

  if (state.editingId === id && elements.dialog.open) {
    closeMemberDialog();
  }

  showToast("Sócio apagado.");
}

function friendlyDatabaseError(error) {
  const message = String(error?.message || "");
  const lower = message.toLocaleLowerCase("pt-PT");

  if (message.includes("members_member_number_key")) {
    return "Já existe um sócio com esse número.";
  }

  if (lower.includes("cannot affect row a second time")) {
    return "O ficheiro tem números de sócio repetidos. A app já evita isto nos imports novos; recarregue a página e tente novamente.";
  }

  if (message.includes("members_tax_number_format")) {
    return "O NIF deve ter 9 dígitos.";
  }

  if (message.includes("members_postal_code_format")) {
    return "O código postal deve usar o formato 0000-000.";
  }

  if (message.includes("members_quota_paid_at_not_future")) {
    return "A data do pagamento da quota não pode estar no futuro.";
  }

  if (message.includes("approval_minute_number") && (message.includes("column") || message.includes("schema cache"))) {
    return t("messages.approvalMinuteMissing");
  }

  if (message.includes("notes") && (message.includes("column") || message.includes("schema cache"))) {
    return "Falta correr o SQL para adicionar as observações internas à tabela de sócios.";
  }

  if (message.includes("app_users_id_fkey")) {
    return "Esse ID ainda não existe em Authentication > Users no Supabase.";
  }

  if (message.includes("row-level security")) {
    return "A base de dados recusou esta operação por falta de permissões.";
  }

  return message || "Não foi possível guardar.";
}

function friendlyHistoryError(error) {
  const message = String(error?.message || "");
  const lower = message.toLocaleLowerCase("pt-PT");

  if (lower.includes("member_audit_log") || lower.includes("schema cache")) {
    return "Falta aplicar o SQL do histórico na base de dados.";
  }

  if (lower.includes("row-level security") || lower.includes("permission") || lower.includes("permiss")) {
    return "Só administradores podem consultar o histórico.";
  }

  return message || "Não foi possível carregar o histórico.";
}

function friendlyCreateUserError(error) {
  return friendlyAdminActionError(error, "Não foi possível criar o utilizador.");
}

function friendlyAdminActionError(error, fallback = "Não foi possível concluir a ação.") {
  const message = String(error?.message || "");
  const lower = message.toLocaleLowerCase("pt-PT");

  if (lower.includes("service role") || lower.includes("variável segura")) {
    return "Falta configurar a chave segura SUPABASE_SERVICE_ROLE_KEY na Vercel.";
  }

  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return "Já existe uma conta com esse email.";
  }

  if (lower.includes("password")) {
    return "A password não cumpre os requisitos mínimos.";
  }

  if (lower.includes("autorizado") || lower.includes("permiss")) {
    return "Só administradores ativos podem fazer esta ação.";
  }

  if (lower.includes("própria conta")) {
    return "Não elimine a sua própria conta.";
  }

  if (lower.includes("último administrador") || lower.includes("ultimo administrador")) {
    return "Não é possível eliminar o último administrador ativo.";
  }

  return message || fallback;
}

function downloadFile(filename, mimeType, content) {
  if (!canExport()) {
    showToast("Não tem permissão para exportar dados.");
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const content = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      exportedBy: state.user?.email || state.profile?.email || null,
      members: state.members,
    },
    null,
    2,
  );

  downloadFile(`socios-${todayStamp()}.json`, "application/json", content);
  showToast("Exportação JSON criada.");
}

function spreadsheetAvailable() {
  return Boolean(window.XLSX?.utils && window.XLSX?.read && window.XLSX?.write);
}

function exportExcel() {
  if (!spreadsheetAvailable()) {
    showToast("Exportação Excel indisponível. Recarregue a página e tente novamente.");
    return;
  }

  const rows = getVisibleMembers().map((member) => {
    const row = {};
    fields.forEach((field) => {
      row[fieldLabel(field)] = memberExportValue(member, field);
    });
    return row;
  });

  const worksheet = window.XLSX.utils.json_to_sheet(rows, { header: csvHeaders() });
  worksheet["!cols"] = fields.map((field) => ({
    wch: Math.max(14, fieldLabel(field).length + 4),
  }));

  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sócios");
  const content = window.XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  downloadFile(
    `socios-${todayStamp()}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content,
  );
  showToast("Exportação Excel criada.");
}

function exportCsv() {
  const rows = [csvHeaders(), ...getVisibleMembers().map((member) => fields.map((field) => memberExportValue(member, field)))];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`socios-${todayStamp()}.csv`, "text/csv;charset=utf-8", `\uFEFF${content}`);
  showToast("Exportação CSV criada.");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

async function importFile(file) {
  if (!canWrite()) {
    showToast("Não tem permissão para importar sócios.");
    return;
  }

  if (!file) {
    return;
  }

  const imported = await parseImportFile(file);
  const prepared = imported.map(normaliseMember);
  const validMembers = prepared.filter((member) => member.name.trim());

  if (!validMembers.length) {
    showToast("Não foram encontrados sócios válidos.");
    return;
  }

  const { members: importableMembers, duplicateCount } = dedupeImportedMembers(validMembers);
  const { error } = await supabaseClient.from("members").upsert(importableMembers.map(memberToDb), { onConflict: "member_number" });
  if (error) {
    showToast(friendlyDatabaseError(error));
    return;
  }

  await refreshMembers();
  const duplicateMessage = duplicateCount ? ` ${duplicateCount} ${duplicateCount === 1 ? "número repetido foi unido" : "números repetidos foram unidos"}.` : "";
  showToast(`${importableMembers.length} ${importableMembers.length === 1 ? "sócio importado" : "sócios importados"}.${duplicateMessage}`);
}

function dedupeImportedMembers(members) {
  const uniqueMembers = [];
  const memberIndexes = new Map();
  let duplicateCount = 0;

  members.forEach((member) => {
    const memberNumber = String(member.memberNumber || "").trim();

    if (!memberNumber) {
      uniqueMembers.push(member);
      return;
    }

    if (memberIndexes.has(memberNumber)) {
      duplicateCount += 1;
      const index = memberIndexes.get(memberNumber);
      uniqueMembers[index] = mergeImportedMembers(uniqueMembers[index], member);
      return;
    }

    memberIndexes.set(memberNumber, uniqueMembers.length);
    uniqueMembers.push(member);
  });

  return { members: uniqueMembers, duplicateCount };
}

function mergeImportedMembers(currentMember, nextMember) {
  const merged = { ...currentMember };

  fields.forEach((field) => {
    const value = nextMember[field];
    if (String(value ?? "").trim()) {
      merged[field] = value;
    }
  });

  if (currentMember.notes && nextMember.notes && currentMember.notes !== nextMember.notes) {
    merged.notes = `${currentMember.notes}\n${nextMember.notes}`;
  }

  return merged;
}

async function parseImportFile(file) {
  const fileName = file.name.toLocaleLowerCase("pt-PT");

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return parseSpreadsheetImport(await file.arrayBuffer());
  }

  const text = await file.text();

  if (fileName.endsWith(".csv")) {
    return parseCsvImport(text);
  }

  if (fileName.endsWith(".json")) {
    return parseJsonImport(text);
  }

  throw new Error("Formato não reconhecido. Use Excel (.xlsx), CSV ou JSON.");
}

function parseSpreadsheetImport(content) {
  if (!spreadsheetAvailable()) {
    throw new Error("Importação Excel indisponível. Recarregue a página e tente novamente.");
  }

  const workbook = window.XLSX.read(content, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("O ficheiro Excel não tem folhas para importar.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = window.XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: true,
  });

  return rowsToMembers(rows);
}

function parseJsonImport(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.members)) {
    return parsed.members;
  }

  throw new Error("Formato JSON inválido.");
}

function parseCsvImport(text) {
  return rowsToMembers(parseCsv(text));
}

function rowsToMembers(rows) {
  const cleanRows = rows
    .map((row) => row.map((cell) => (typeof cell === "string" ? cell.trim() : cell ?? "")))
    .filter((row) => row.some((cell) => String(cell ?? "").trim()));

  const headerIndex = cleanRows.findIndex((row) => row.some((header) => headerToField(normalise(header))));

  if (headerIndex < 0) {
    throw new Error("Não reconheci os nomes das colunas. Use a exportação Excel da app como modelo.");
  }

  const headers = cleanRows[headerIndex].map((header) => normalise(header));

  return cleanRows.slice(headerIndex + 1).map((row) => {
    const member = {};
    headers.forEach((header, index) => {
      const field = headerToField(header);
      if (field) {
        member[field] = row[index] ?? "";
      }
    });
    applySpreadsheetImportDetails(member, headers, row);
    return member;
  });
}

function applySpreadsheetImportDetails(member, headers, row) {
  applyQuotaPaidUntilFromYearColumns(member, headers, row);
  applyAddressDetails(member);
  appendUnmappedImportNotes(member, headers, row);
  cleanImportedTaxNumber(member);
}

function applyQuotaPaidUntilFromYearColumns(member, headers, row) {
  const paidYears = headers
    .map((header, index) => ({
      index,
      year: extractQuotaYear(header),
    }))
    .filter((column) => column.year && isPaidQuotaMarker(row[column.index]))
    .map((column) => column.year);

  if (paidYears.length) {
    member.quotaPaidUntil = `${Math.max(...paidYears)}-12-31`;
  }
}

function extractQuotaYear(header) {
  const match = String(header || "").match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function isPaidQuotaMarker(value) {
  const text = normalise(value);
  return Boolean(text) && !["0", "nao", "não", "n", "no", "-", "false"].includes(text);
}

function applyAddressDetails(member) {
  if (!member.address) {
    return;
  }

  const match = String(member.address).match(/\b\d{4}-\d{3}\b/);
  if (!match) {
    return;
  }

  if (!member.postalCode) {
    member.postalCode = match[0];
  }

  if (!member.locality) {
    const afterPostalCode = String(member.address)
      .slice(match.index + match[0].length)
      .replace(/^[,.;\s-]+/, "")
      .trim();

    if (afterPostalCode) {
      member.locality = afterPostalCode;
    }
  }
}

function appendUnmappedImportNotes(member, headers, row) {
  const details = [];

  headers.forEach((header, index) => {
    const value = String(row[index] ?? "").trim();
    const label = String(header || "").replace(/\s+/g, " ").trim();

    if (!value || !label || headerToField(normalise(label)) || extractQuotaYear(label)) {
      return;
    }

    details.push(`${label}: ${value}`);
  });

  if (details.length) {
    appendImportNote(member, details.join("\n"));
  }
}

function cleanImportedTaxNumber(member) {
  const originalTaxNumber = String(member.taxNumber || "").trim();
  const digits = onlyDigits(originalTaxNumber);

  if (!digits || digits.length === 9) {
    member.taxNumber = digits;
    return;
  }

  member.taxNumber = "";
  appendImportNote(member, `NIF original: ${originalTaxNumber}`);
}

function appendImportNote(member, note) {
  const text = String(note || "").trim();

  if (!text) {
    return;
  }

  member.notes = [member.notes, text].filter(Boolean).join("\n");
}

function parseCsv(text) {
  const delimiter = detectCsvDelimiter(text);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function detectCsvDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function headerToField(header) {
  const aliases = {
    "bi ou cc": "idNumber",
    "bi ou cc (opcional)": "idNumber",
    "n ata": "approvalMinuteNumber",
    "n de ata": "approvalMinuteNumber",
    "n ata aprovacao": "approvalMinuteNumber",
    "n ata de aprovacao": "approvalMinuteNumber",
    "nº ata": "approvalMinuteNumber",
    "nº ata aprovacao": "approvalMinuteNumber",
    "nº ata aprovação": "approvalMinuteNumber",
    "nº de ata": "approvalMinuteNumber",
    "nº de ata de aprovação": "approvalMinuteNumber",
    "numero ata": "approvalMinuteNumber",
    "numero de ata": "approvalMinuteNumber",
    "numero de ata de aprovacao": "approvalMinuteNumber",
    "número de ata de aprovação": "approvalMinuteNumber",
    "ata de aprovacao": "approvalMinuteNumber",
    "ata de aprovação": "approvalMinuteNumber",
    approvalminute: "approvalMinuteNumber",
    approvalminutenumber: "approvalMinuteNumber",
    "approval minute": "approvalMinuteNumber",
    "approval minute no": "approvalMinuteNumber",
    "approval minute number": "approvalMinuteNumber",
    cc: "idNumber",
    "id card": "idNumber",
    "id card (optional)": "idNumber",
    categoria: "profession",
    "codigo postal": "postalCode",
    "cod postal": "postalCode",
    cp: "postalCode",
    postcode: "postalCode",
    "código postal": "postalCode",
    "data adesao": "admissionDate",
    "data de adesao": "admissionDate",
    "data de adesão": "admissionDate",
    "admission date": "admissionDate",
    "submetido em reuniao de direccao": "admissionDate",
    "submetido em reuniao de direcao": "admissionDate",
    "data de nascimento": "birthDate",
    "data nascimento": "birthDate",
    "data nasc": "birthDate",
    "date of birth": "birthDate",
    email: "email",
    "e-mail": "email",
    localidade: "locality",
    locality: "locality",
    town: "locality",
    morada: "address",
    address: "address",
    membernumber: "memberNumber",
    "n de socio": "memberNumber",
    "n socio": "memberNumber",
    "nº de socio": "memberNumber",
    "nº de sócio": "memberNumber",
    "numero de socio": "memberNumber",
    "número de sócio": "memberNumber",
    "member no": "memberNumber",
    "member no.": "memberNumber",
    "member number": "memberNumber",
    "socio n": "memberNumber",
    "socio n.": "memberNumber",
    "socio n.º": "memberNumber",
    "socio n.o": "memberNumber",
    "socio numero": "memberNumber",
    admissiondate: "admissionDate",
    quotapaiduntil: "quotaPaidUntil",
    quotapaidat: "quotaPaidAt",
    postalcode: "postalCode",
    idnumber: "idNumber",
    taxnumber: "taxNumber",
    birthdate: "birthDate",
    nif: "taxNumber",
    nome: "name",
    name: "name",
    notas: "notes",
    nota: "notes",
    notes: "notes",
    observacoes: "notes",
    "observações": "notes",
    "observacoes internas": "notes",
    "observações internas": "notes",
    profession: "profession",
    quota: "quotaPaidUntil",
    quotas: "quotaPaidUntil",
    "quotas pagas": "quotaPaidUntil",
    "quotas pagas ate": "quotaPaidUntil",
    "quotas pagas até": "quotaPaidUntil",
    "data do pagamento": "quotaPaidAt",
    "data pagamento": "quotaPaidAt",
    "pagamento da quota": "quotaPaidAt",
    "quota paid at": "quotaPaidAt",
    "payment date": "quotaPaidAt",
    "fees paid until": "quotaPaidUntil",
    "paid until": "quotaPaidUntil",
    telemovel: "phone",
    telemóvel: "phone",
    telefone: "phone",
    "n tel": "phone",
    "nº tel": "phone",
    "numero tel": "phone",
    "numero telefone": "phone",
    phone: "phone",
  };

  return aliases[header] || null;
}

function normaliseMember(member) {
  const clean = {};
  const dateFields = ["admissionDate", "quotaPaidUntil", "quotaPaidAt", "birthDate"];

  fields.forEach((field) => {
    clean[field] = dateFields.includes(field) ? member[field] ?? "" : String(member[field] ?? "").trim();
  });

  clean.taxNumber = onlyDigits(clean.taxNumber);
  clean.admissionDate = normaliseImportedDate(clean.admissionDate, "admissionDate");
  clean.quotaPaidUntil = normaliseImportedDate(clean.quotaPaidUntil, "quotaPaidUntil");
  clean.quotaPaidAt = normaliseImportedDate(clean.quotaPaidAt, "quotaPaidAt");
  clean.birthDate = normaliseImportedDate(clean.birthDate, "birthDate");
  return clean;
}

function normaliseImportedDate(value, field = "") {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return buildIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return buildIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (field === "quotaPaidUntil") {
    const year = extractQuotaYear(text);
    if (year) {
      return `${year}-12-31`;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const europeanDate = text.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})$/);
  if (europeanDate) {
    const [, first, second, year] = europeanDate;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const preferUsDate = field === "birthDate" && firstNumber <= 12;

    if (preferUsDate || secondNumber > 12) {
      return buildIsoDate(year, first, second) || "";
    }

    return buildIsoDate(year, second, first) || buildIsoDate(year, first, second) || "";
  }

  const isoLikeDate = text.match(/^(\d{4})[/. -](\d{1,2})[/. -](\d{1,2})$/);
  if (isoLikeDate) {
    const [, year, month, day] = isoLikeDate;
    return buildIsoDate(year, month, day) || text;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return buildIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()) || "";
  }

  return "";
}

function buildIsoDate(yearValue, monthValue, dayValue) {
  let year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (year < 100) {
    const currentTwoDigitYear = new Date().getFullYear() % 100;
    year += year > currentTwoDigitYear + 1 ? 1900 : 2000;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function setLoginLoading(isLoading) {
  elements.authView.classList.toggle("is-authenticating", isLoading);
  elements.loginForm.classList.toggle("is-authenticating", isLoading);
  elements.loginSubmitBtn.disabled = isLoading;
  elements.loginSubmitBtn.classList.toggle("is-loading", isLoading);
  elements.loginSubmitBtn.innerHTML = isLoading
    ? `
      <span class="button-spinner" aria-hidden="true"></span>
      <span>${t("app.loginLoading")}</span>
    `
    : `
      <i data-lucide="log-in"></i>
      <span>${t("app.login")}</span>
    `;
  renderIcons();
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function handleLogin(event) {
  event.preventDefault();
  elements.authError.textContent = "";
  setLoginLoading(false);

  const formData = new FormData(elements.loginForm);
  if (!hasValidCsrfToken(formData)) {
    setCsrfError(elements.authError);
    return;
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const options = {};

  if (shouldRequireCaptcha()) {
    if (!captchaToken) {
      elements.authError.textContent = t("app.captchaRequired");
      await syncLoginCaptchaVisibility();
      return;
    }

    options.captchaToken = captchaToken;
  }

  setLoginLoading(true);
  await delay(650);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password, options });
  if (error) {
    setLoginLoading(false);
    recordFailedLogin();
    elements.authError.textContent = friendlyAuthError(error);
    console.warn("Supabase login error:", error.message);
    await syncLoginCaptchaVisibility();
    return;
  }

  persistRememberedLogin(email);
  clearLoginFailures();
  hideCaptcha();
}

function friendlyAuthError(error) {
  const message = String(error?.message || "").toLocaleLowerCase("pt-PT");

  if (message.includes("email not confirmed")) {
    return "O email ainda não está confirmado no Supabase.";
  }

  if (message.includes("too many") || message.includes("rate limit")) {
    return "Demasiadas tentativas. Aguarde um pouco antes de voltar a tentar.";
  }

  return "Email ou password inválidos.";
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = "/logout";
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2800);
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function wireEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.rememberLoginDevice.addEventListener("change", () => {
    if (!elements.rememberLoginDevice.checked) {
      persistRememberedLogin("");
    }
  });
  elements.themeToggleBtns.forEach((button) => {
    button.addEventListener("click", () => {
      toggleTheme();
      closeToolsMenu();
    });
  });
  elements.toolsMenuBtn.addEventListener("click", toggleToolsMenu);
  elements.historyBtn.addEventListener("click", openHistoryDialog);
  elements.manualBtn.addEventListener("click", openManualDialog);
  elements.languageBtn.addEventListener("click", openLanguageDialog);
  elements.closeManualDialogBtn.addEventListener("click", closeManualDialog);
  elements.closeLanguageDialogBtn.addEventListener("click", closeLanguageDialog);
  elements.languageOptions.forEach((button) => {
    button.addEventListener("click", () => handleLanguageChoice(button.dataset.languageOption));
  });
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.newMemberBtn.addEventListener("click", () => openMemberDialog());
  elements.adminManagerBtn.addEventListener("click", openAdminDialog);
  elements.cancelBtn.addEventListener("click", closeMemberDialog);
  elements.closeDialogBtn.addEventListener("click", closeMemberDialog);
  elements.closeAdminDialogBtn.addEventListener("click", closeAdminDialog);
  elements.closeHistoryDialogBtn.addEventListener("click", closeHistoryDialog);
  elements.refreshHistoryBtn.addEventListener("click", refreshHistory);
  elements.form.addEventListener("submit", handleSubmit);
  elements.deleteMemberBtn.addEventListener("click", () => handleDelete(state.editingId));
  elements.exportJsonBtn.addEventListener("click", () => {
    closeToolsMenu();
    exportExcel();
  });
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  if (elements.importBtn && elements.importFile) {
    elements.importBtn.addEventListener("click", () => {
      closeToolsMenu();
      elements.importFile.click();
    });
    elements.importFile.addEventListener("change", async () => {
      try {
        await importFile(elements.importFile.files[0]);
      } catch (error) {
        showToast(error.message || "Não foi possível importar o ficheiro.");
      } finally {
        elements.importFile.value = "";
      }
    });
  }

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  elements.quickFilters.forEach((button) => {
    button.addEventListener("click", () => setActiveFilter(button.dataset.filter));
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  elements.membersTable.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const member = state.members.find((item) => item.id === button.dataset.id);

    if (button.dataset.action === "edit" && member) {
      openMemberDialog(member);
    }

    if (button.dataset.action === "delete") {
      handleDelete(button.dataset.id);
    }

    if (button.dataset.action === "pay-quota") {
      handlePayQuota(button.dataset.id);
    }
  });

  elements.createUserForm.addEventListener("submit", handleCreateUserSubmit);
  elements.userForm.addEventListener("submit", handleUserSubmit);
  elements.clearUserFormBtn.addEventListener("click", clearUserForm);
  elements.refreshUsersBtn.addEventListener("click", refreshAppUsers);
  elements.usersTable.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const user = state.users.find((item) => item.id === button.dataset.id);

    if (button.dataset.action === "edit-user" && user) {
      fillUserForm(user);
    }

    if (button.dataset.action === "toggle-user") {
      handleToggleUser(button.dataset.id);
    }

    if (button.dataset.action === "delete-user") {
      handleDeleteUser(button.dataset.id);
    }
  });

  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
      closeMemberDialog();
    }
  });

  elements.adminDialog.addEventListener("click", (event) => {
    if (event.target === elements.adminDialog) {
      closeAdminDialog();
    }
  });

  elements.historyDialog.addEventListener("click", (event) => {
    if (event.target === elements.historyDialog) {
      closeHistoryDialog();
    }
  });

  elements.manualDialog.addEventListener("click", (event) => {
    if (event.target === elements.manualDialog) {
      closeManualDialog();
    }
  });

  elements.languageDialog.addEventListener("click", (event) => {
    if (event.target === elements.languageDialog) {
      closeLanguageDialog();
    }
  });

  document.addEventListener("click", (event) => {
    if (elements.toolsMenu.hidden || elements.toolsMenu.contains(event.target) || elements.toolsMenuBtn.contains(event.target)) {
      return;
    }

    closeToolsMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeToolsMenu();
    }
  });
}

async function init() {
  applyTheme(loadStoredTheme(), false);
  applyLanguage(loadStoredLanguage(), false);
  syncCsrfTokens();
  state.loginFailureCount = loadLoginFailureCount();
  renderIcons();

  supabaseClient = initSupabase();
  if (!supabaseClient) {
    showSetup();
    return;
  }

  wireEvents();

  const { data } = await supabaseClient.auth.getSession();
  await handleAuthState(data.session);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    handleAuthState(session);
  });
}

document.addEventListener("DOMContentLoaded", init);
