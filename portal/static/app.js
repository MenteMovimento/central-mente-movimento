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
    "nav.dispositivos": "Cibersegurança",
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
    "module.socios.title": "Sócios",
    "module.socios.detail": "Base de s\u00f3cios",
    "module.utentes.title": "Utentes",
    "module.utentes.detail": "Base de utentes",
    "module.dispositivos.title": "Cibersegurança",
    "module.dispositivos.detail": "Área de cibersegurança",
    "module.atividades.title": "Atividades",
    "module.atividades.detail": "Planeamento e registo de atividades",
    "activities.eyebrow": "Hor\u00e1rio semanal",
    "activities.copy": "Planeie as atividades da semana por dia, hora e monitor.",
    "activities.loading": "A carregar...",
    "activities.createButton": "Criar Atividade",
    "activities.closeCreateButton": "Fechar",
    "activities.form.addTitle": "Adicionar atividade",
    "activities.form.editTitle": "Editar atividade",
    "activities.form.viewTitle": "Ver atividade",
    "activities.printWeek": "Imprimir semana",
    "activities.printSummary": "Imprimir",
    "activities.statisticsButton": "Estatísticas",
    "activities.statisticsTitle": "Estatísticas de atividades",
    "activities.statisticsMonth": "Mês",
    "activities.statisticsRefresh": "Atualizar",
    "activities.statisticsEmpty": "Escolha um mês para consultar as estatísticas.",
    "activities.statisticsLoadError": "Não foi possível carregar as estatísticas de atividades.",
    "activities.statisticsActivities": "Atividades no mês",
    "activities.statisticsAverage": "Média de utentes/atividade",
    "activities.statisticsSummaries": "Sumários registados",
    "activities.statisticsVolume": "Volume total",
    "activities.statisticsAttendanceTitle": "Assiduidade por utente",
    "activities.statisticsVolumeTitle": "Volume por atividade",
    "activities.statisticsUser": "Utente",
    "activities.statisticsAttendance": "Presenças",
    "activities.statisticsAssiduity": "Assiduidade",
    "activities.statisticsSessions": "Sessões",
    "activities.statisticsPeople": "Pessoas",
    "activities.statisticsDuration": "Duração",
    "activities.statisticsNoRows": "Sem dados registados neste mês.",
    "activities.statisticsPersonHours": "horas-pessoa",
    "activities.summaryButton": "Sumário",
    "activities.summaryAction": "Sumário",
    "activities.summaryTitle": "Sumário da atividade",
    "activities.summaryActivity": "Atividade",
    "activities.summarySelectActivity": "Selecionar atividade da semana",
    "activities.summaryDate": "Data",
    "activities.summaryStart": "Hora de início",
    "activities.summaryEnd": "Hora de fim",
    "activities.summaryDuration": "Duração",
    "activities.summaryDurationMinutes": "{count} min",
    "activities.summaryDurationHours": "{hours}h {minutes}min",
    "activities.summaryText": "Sumário",
    "activities.summaryPlaceholder": "Escreva o sumário da atividade...",
    "activities.summaryAttendance": "Presenças",
    "activities.summaryAttendanceSearch": "Pesquisar utentes",
    "activities.summaryNoActivity": "Escolha uma atividade para preencher o sumário.",
    "activities.summaryNoActivitiesWeek": "Sem atividades nesta semana.",
    "activities.summaryNoUtentes": "Sem utentes disponíveis.",
    "activities.summaryLoadError": "Não foi possível carregar os dados do sumário.",
    "activities.summaryUtentesError": "Não foi possível carregar os utentes.",
    "activities.summarySaved": "Sumário guardado.",
    "activities.summarySaveError": "Não foi possível guardar o sumário.",
    "activities.copyPreviousWeek": "Copiar semana anterior",
    "activities.printTitle": "Horário semanal de atividades",
    "activities.printScheduleTitle": "Horário de Atividades",
    "activities.weekPrevious": "Semana anterior",
    "activities.weekNext": "Semana seguinte",
    "activities.weekRange": "{start} a {end}",
    "activities.day": "Dia",
    "activities.start": "In\u00edcio",
    "activities.end": "Fim",
    "activities.name": "Nome da atividade",
    "activities.teacher": "Monitor",
    "activities.teacherSecond": "2.\u00ba monitor",
    "activities.selectActivity": "Selecionar atividade",
    "activities.selectMonitor": "Selecionar monitor",
    "activities.selectSecondMonitor": "Sem segundo monitor",
    "activities.save": "Guardar",
    "activities.update": "Atualizar",
    "activities.clear": "Limpar",
    "activities.week": "Segunda a sexta",
    "activities.lunch": "Almo\u00e7o",
    "activities.defaultLunchMonitor": "Monitor a definir",
    "activities.emptyDay": "Sem atividades",
    "activities.emptyWeek": "Ainda n\u00e3o existem atividades nesta semana.",
    "activities.remove": "Remover",
    "activities.edit": "Editar",
    "activities.view": "Ver",
    "activities.dragHandle": "Arrastar para ordenar",
    "activities.dropHere": "Largar aqui",
    "activities.confirmDelete": "Remover esta atividade?",
    "activities.validationRequired": "Preencha o dia, a hora, o nome da atividade e o monitor.",
    "activities.validationDuplicateMonitors": "Escolha monitores diferentes.",
    "activities.validationTime": "A hora de fim tem de ser depois da hora de in\u00edcio.",
    "activities.saved": "Atividade guardada.",
    "activities.copied": "Semana anterior copiada.",
    "activities.copyEmpty": "Nao existem atividades na semana anterior para copiar.",
    "activities.copyNoChanges": "A semana atual ja tinha estas atividades.",
    "activities.deleted": "Atividade removida.",
    "activities.cleared": "Semana limpa.",
    "activities.localOnly": "Base de dados de atividades indisponivel. As alteracoes nao foram guardadas.",
    "activities.saveError": "Nao foi possivel guardar a atividade partilhada.",
    "activities.historyEmpty": "Sem a\u00e7\u00f5es registadas.",
    "activities.historyAction": "A\u00e7\u00e3o",
    "activities.historyWhen": "Data",
    "activities.historyActivity": "Atividade",
    "activities.historyDetails": "Detalhes",
    "activities.historyCreated": "Criada",
    "activities.historyUpdated": "Editada",
    "activities.historyDeleted": "Apagada",
    "activities.historyReordered": "Reordenada",
    "activities.historyPrinted": "Semana impressa",
    "activities.historySummary": "Sumário guardado",
    "activities.historyWeek": "Semana: {week}",
    "activities.historyTeacher": "Monitor: {teacher}",
    "activities.historyTime": "Hora: {time}",
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
    "global.history.copy": "Registo comum de altera\u00e7\u00f5es feitas nos ramos de s\u00f3cios, utentes, cibersegurança e atividades.",
    "global.history.socios.title": "S\u00f3cios",
    "global.history.socios.copy": "Altera\u00e7\u00f5es em fichas e quotas.",
    "global.history.utentes.title": "Utentes",
    "global.history.utentes.copy": "Altera\u00e7\u00f5es em fichas, separadores e anexos.",
    "global.history.dispositivos.title": "Cibersegurança",
    "global.history.dispositivos.copy": "Altera\u00e7\u00f5es em registos, repara\u00e7\u00f5es, estados, anexos e CSV.",
    "global.history.atividades.title": "Atividades",
    "global.history.atividades.copy": "Altera\u00e7\u00f5es em agenda, presen\u00e7as e relat\u00f3rios.",
    "global.users.title": "Utilizadores e permiss\u00f5es",
    "global.users.copy": "Gest\u00e3o \u00fanica de administradores, utilizadores e acessos a cada ramo.",
    "global.users.admin.title": "Administrador",
    "global.users.admin.copy": "Acesso total ao website.",
    "global.users.manager.title": "Gestor de ramo",
    "global.users.manager.copy": "Acesso limitado a s\u00f3cios, utentes, cibersegurança ou atividades.",
    "global.users.viewer.title": "Consulta",
    "global.users.viewer.copy": "Acesso s\u00f3 de leitura quando necess\u00e1rio.",
    "global.manuals.title": "Manuais",
    "global.manuals.copy": "\u00c1rea comum para consultar os manuais dos ramos e os manuais t\u00e9cnicos.",
    "global.manuals.socios.title": "Manual de s\u00f3cios",
    "global.manuals.socios.copy": "Quotas, exporta\u00e7\u00f5es e gest\u00e3o de s\u00f3cios.",
    "global.manuals.utentes.title": "Manual de utentes",
    "global.manuals.utentes.copy": "Fichas, separadores, anexos PDF, genograma e ecomapa.",
    "global.manuals.dispositivos.title": "Manual de cibersegurança",
    "global.manuals.dispositivos.copy": "Registos, repara\u00e7\u00f5es, estados, estat\u00edsticas, anexos e CSV.",
    "global.manuals.atividades.title": "Manual de atividades",
    "global.manuals.atividades.copy": "A preparar quando o m\u00f3dulo de atividades estiver fechado.",
    "users.title": "Utilizadores",
    "users.subtitle": "Crie acessos novos e edite permiss\u00f5es de utilizadores existentes.",
    "users.refresh": "Atualizar",
    "users.createTitle": "Criar utilizador",
    "users.createHint": "O utilizador é adicionado automaticamente à base de dados da associação.",
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
    "users.deactivated": "Desativar utilizador",
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
    "permissions.dispositivos": "Cibersegurança",
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
    "nav.dispositivos": "Cybersecurity",
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
    "module.socios.title": "Members",
    "module.socios.detail": "Members database",
    "module.utentes.title": "Clients",
    "module.utentes.detail": "Clients database",
    "module.dispositivos.title": "Cybersecurity",
    "module.dispositivos.detail": "Cybersecurity workspace",
    "module.atividades.title": "Activities",
    "module.atividades.detail": "Activity planning and records",
    "activities.eyebrow": "Weekly timetable",
    "activities.copy": "Plan the week's activities by day, time and monitor.",
    "activities.loading": "Loading...",
    "activities.createButton": "Create Activity",
    "activities.closeCreateButton": "Close",
    "activities.form.addTitle": "Add activity",
    "activities.form.editTitle": "Edit activity",
    "activities.form.viewTitle": "View activity",
    "activities.printWeek": "Print week",
    "activities.printSummary": "Print",
    "activities.statisticsButton": "Statistics",
    "activities.statisticsTitle": "Activity statistics",
    "activities.statisticsMonth": "Month",
    "activities.statisticsRefresh": "Refresh",
    "activities.statisticsEmpty": "Choose a month to view statistics.",
    "activities.statisticsLoadError": "Could not load activity statistics.",
    "activities.statisticsActivities": "Monthly activities",
    "activities.statisticsAverage": "Average clients/activity",
    "activities.statisticsSummaries": "Registered summaries",
    "activities.statisticsVolume": "Total volume",
    "activities.statisticsAttendanceTitle": "Attendance by client",
    "activities.statisticsVolumeTitle": "Volume by activity",
    "activities.statisticsUser": "Client",
    "activities.statisticsAttendance": "Attendances",
    "activities.statisticsAssiduity": "Attendance",
    "activities.statisticsSessions": "Sessions",
    "activities.statisticsPeople": "People",
    "activities.statisticsDuration": "Duration",
    "activities.statisticsNoRows": "No data registered in this month.",
    "activities.statisticsPersonHours": "person-hours",
    "activities.summaryButton": "Summary",
    "activities.summaryAction": "Summary",
    "activities.summaryTitle": "Activity summary",
    "activities.summaryActivity": "Activity",
    "activities.summarySelectActivity": "Select a week activity",
    "activities.summaryDate": "Date",
    "activities.summaryStart": "Start time",
    "activities.summaryEnd": "End time",
    "activities.summaryDuration": "Duration",
    "activities.summaryDurationMinutes": "{count} min",
    "activities.summaryDurationHours": "{hours}h {minutes}min",
    "activities.summaryText": "Summary",
    "activities.summaryPlaceholder": "Write the activity summary...",
    "activities.summaryAttendance": "Attendance",
    "activities.summaryAttendanceSearch": "Search clients",
    "activities.summaryNoActivity": "Choose an activity to fill the summary.",
    "activities.summaryNoActivitiesWeek": "No activities in this week.",
    "activities.summaryNoUtentes": "No clients available.",
    "activities.summaryLoadError": "Could not load summary data.",
    "activities.summaryUtentesError": "Could not load clients.",
    "activities.summarySaved": "Summary saved.",
    "activities.summarySaveError": "Could not save the summary.",
    "activities.copyPreviousWeek": "Copy previous week",
    "activities.printTitle": "Weekly activities timetable",
    "activities.printScheduleTitle": "Activities Timetable",
    "activities.weekPrevious": "Previous week",
    "activities.weekNext": "Next week",
    "activities.weekRange": "{start} to {end}",
    "activities.day": "Day",
    "activities.start": "Start",
    "activities.end": "End",
    "activities.name": "Activity name",
    "activities.teacher": "Monitor",
    "activities.teacherSecond": "2nd monitor",
    "activities.selectActivity": "Select activity",
    "activities.selectMonitor": "Select monitor",
    "activities.selectSecondMonitor": "No second monitor",
    "activities.save": "Save",
    "activities.update": "Update",
    "activities.clear": "Clear",
    "activities.week": "Monday to Friday",
    "activities.weekTitle": "School timetable",
    "activities.lunch": "Lunch",
    "activities.defaultLunchMonitor": "Monitor to define",
    "activities.emptyDay": "No activities",
    "activities.emptyWeek": "There are no activities in this week yet.",
    "activities.remove": "Remove",
    "activities.edit": "Edit",
    "activities.view": "View",
    "activities.dragHandle": "Drag to reorder",
    "activities.dropHere": "Drop here",
    "activities.confirmDelete": "Remove this activity?",
    "activities.validationRequired": "Fill in the day, time, activity name and monitor.",
    "activities.validationDuplicateMonitors": "Choose different monitors.",
    "activities.validationTime": "The end time must be after the start time.",
    "activities.saved": "Activity saved.",
    "activities.copied": "Previous week copied.",
    "activities.copyEmpty": "There are no activities in the previous week to copy.",
    "activities.copyNoChanges": "The current week already had these activities.",
    "activities.deleted": "Activity removed.",
    "activities.cleared": "Week cleared.",
    "activities.localOnly": "Activities database unavailable. Changes were not saved.",
    "activities.saveError": "Could not save the shared activity.",
    "activities.historyEmpty": "No actions registered.",
    "activities.historyAction": "Action",
    "activities.historyWhen": "Date",
    "activities.historyActivity": "Activity",
    "activities.historyDetails": "Details",
    "activities.historyCreated": "Created",
    "activities.historyUpdated": "Edited",
    "activities.historyDeleted": "Deleted",
    "activities.historyReordered": "Reordered",
    "activities.historyPrinted": "Week printed",
    "activities.historySummary": "Summary saved",
    "activities.historyWeek": "Week: {week}",
    "activities.historyTeacher": "Monitor: {teacher}",
    "activities.historyTime": "Time: {time}",
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
    "global.history.copy": "Shared record of changes made in members, clients, cybersecurity and activities.",
    "global.history.socios.title": "Members",
    "global.history.socios.copy": "Changes in member records and fees.",
    "global.history.utentes.title": "Clients",
    "global.history.utentes.copy": "Changes in records, sections and attachments.",
    "global.history.dispositivos.title": "Cybersecurity",
    "global.history.dispositivos.copy": "Changes in records, repairs, states, attachments and CSV.",
    "global.history.atividades.title": "Activities",
    "global.history.atividades.copy": "Changes in schedule, attendance and reports.",
    "global.users.title": "Users and permissions",
    "global.users.copy": "Single management area for administrators, users and access to each branch.",
    "global.users.admin.title": "Administrator",
    "global.users.admin.copy": "Full access to the website.",
    "global.users.manager.title": "Branch manager",
    "global.users.manager.copy": "Limited access to members, clients, cybersecurity or activities.",
    "global.users.viewer.title": "Viewer",
    "global.users.viewer.copy": "Read-only access when needed.",
    "global.manuals.title": "Manuals",
    "global.manuals.copy": "Shared area to consult branch manuals and technical guides.",
    "global.manuals.socios.title": "Members manual",
    "global.manuals.socios.copy": "Fees, exports and member management.",
    "global.manuals.utentes.title": "Clients manual",
    "global.manuals.utentes.copy": "Records, sections, PDF attachments, genogram and ecomap.",
    "global.manuals.dispositivos.title": "Cybersecurity manual",
    "global.manuals.dispositivos.copy": "Records, repairs, states, statistics, attachments and CSV.",
    "global.manuals.atividades.title": "Activities manual",
    "global.manuals.atividades.copy": "To be prepared when the activities module is complete.",
    "users.title": "Users",
    "users.subtitle": "Create new access and edit permissions for existing users.",
    "users.refresh": "Refresh",
    "users.createTitle": "Create user",
    "users.createHint": "The user is added automatically to the association database.",
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
    "users.deactivated": "Deactivate user",
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
    "permissions.dispositivos": "Cybersecurity",
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
    document.title = `${getTranslation(titleKey, language)} | ${getTranslation("app.title", language)}`;
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
  if (document.querySelector("[data-activities-calendar]")) {
    renderActivityNameOptions();
    renderActivityMonitorOptions();
  }
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
  document.querySelectorAll("details.dashboard-user-menu-wrap[open]").forEach((menu) => {
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

const activitiesManualsElements = () => ({
  dialog: document.querySelector("[data-activities-manuals-dialog]"),
  openButtons: document.querySelectorAll("[data-activities-manuals-toggle]"),
  closeButtons: document.querySelectorAll("[data-activities-manuals-close]"),
});

const openActivitiesManualsDialog = () => {
  const { dialog } = activitiesManualsElements();
  if (!dialog) return;
  closeToolsMenus();
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  refreshIcons();
};

const closeActivitiesManualsDialog = () => {
  const { dialog } = activitiesManualsElements();
  if (!dialog) return;
  if (dialog.open && typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
};

const wireActivitiesManualsDialog = () => {
  const { dialog, openButtons, closeButtons } = activitiesManualsElements();
  if (!dialog || dialog.dataset.activitiesManualsWired === "true") return;
  dialog.dataset.activitiesManualsWired = "true";
  openButtons.forEach((button) => {
    button.addEventListener("click", openActivitiesManualsDialog);
  });
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeActivitiesManualsDialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeActivitiesManualsDialog();
  });
};

const activitiesCatalogElements = () => ({
  dialog: document.querySelector("[data-activities-catalog-dialog]"),
  openButtons: document.querySelectorAll("[data-activities-catalog-toggle]"),
  closeButtons: document.querySelectorAll("[data-activities-catalog-close]"),
  form: document.querySelector("[data-activities-catalog-form]"),
  input: document.querySelector("[data-activities-catalog-form] input[name='name']"),
  list: document.querySelector("[data-activities-catalog-list]"),
  error: document.querySelector("[data-activities-catalog-error]"),
  select: document.querySelector("[data-activity-name-options]"),
});

const setActivitiesCatalogFeedback = (message = "", kind = "error") => {
  const { error } = activitiesCatalogElements();
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
  error.classList.toggle("is-success", kind === "success");
};

const renderActivitySelectOptions = (select, items, placeholderKey) => {
  if (!select) return;
  const currentValue = String(select.value || "");
  const knownValues = new Set(items.map((item) => item.name));
  const options = [
    `<option value="">${escapeHtml(getTranslation(placeholderKey))}</option>`,
    ...items.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`),
  ];
  if (currentValue && !knownValues.has(currentValue)) {
    options.push(`<option value="${escapeHtml(currentValue)}">${escapeHtml(currentValue)}</option>`);
  }
  select.innerHTML = options.join("");
  select.value = currentValue && [...select.options].some((option) => option.value === currentValue) ? currentValue : "";
};

const activityMonitorSeparator = " / ";

const splitActivityMonitors = (value) =>
  String(value || "")
    .split(/\s*\/\s*/)
    .map((monitor) => monitor.trim())
    .filter(Boolean)
    .slice(0, 2);

const joinActivityMonitors = (...values) => {
  const monitors = [];
  values
    .flat()
    .map((monitor) => String(monitor || "").trim())
    .filter(Boolean)
    .forEach((monitor) => {
      if (!monitors.includes(monitor) && monitors.length < 2) {
        monitors.push(monitor);
      }
    });
  return monitors.join(activityMonitorSeparator);
};

const replaceActivityMonitorName = (value, previousName, nextName) => {
  const monitors = splitActivityMonitors(value).map((monitor) => (monitor === previousName ? nextName : monitor));
  return joinActivityMonitors(monitors);
};

const renderActivityNameOptions = () => {
  const { select } = activitiesCatalogElements();
  renderActivitySelectOptions(select, activitiesState.activityNames, "activities.selectActivity");
};

const setActivitySelectValue = (select, value) => {
  if (!select) return;
  const nextValue = String(value || "");
  if (nextValue && ![...select.options].some((option) => option.value === nextValue)) {
    select.append(new Option(nextValue, nextValue));
  }
  select.value = nextValue;
};

const renderActivitiesCatalogList = () => {
  const { list } = activitiesCatalogElements();
  if (!list) return;
  if (!activitiesState.activityNames.length) {
    list.innerHTML = `<p class="activity-empty-state">Sem atividades registadas.</p>`;
    renderActivityNameOptions();
    refreshIcons();
    return;
  }
  list.innerHTML = activitiesState.activityNames
    .map(
      (activity) => `
        <article class="activities-monitor-row">
          <strong>${escapeHtml(activity.name)}</strong>
          <div class="activities-monitor-actions">
            <button class="icon-link" type="button" data-activity-name-edit="${escapeHtml(activity.id)}" title="Editar atividade" aria-label="Editar atividade">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-link danger-link" type="button" data-activity-name-delete="${escapeHtml(activity.id)}" title="Remover atividade" aria-label="Remover atividade">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </article>
      `,
    )
    .join("");
  renderActivityNameOptions();
  refreshIcons();
};

const activityOptionErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error?.message === "string" && error.message) return error.message;
  return fallback;
};

const getActivitiesAccessToken = async () => {
  const client = createActivitiesClient();
  if (!client) throw new Error(getTranslation("activities.localOnly"));
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token || "";
  if (!token) throw new Error("Sessao em falta.");
  return token;
};

const activitiesOptionsRequest = async (kind, { method = "GET", body = null } = {}) => {
  const token = await getActivitiesAccessToken();
  const isGet = method === "GET";
  const response = await fetch(`/api/activities-options${isGet ? `?kind=${encodeURIComponent(kind)}` : ""}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isGet ? {} : { "Content-Type": "application/json" }),
    },
    body: isGet ? undefined : JSON.stringify({ kind, ...(body || {}) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Nao foi possivel guardar na base de dados.");
  }
  return payload;
};

const loadActivitiesCatalog = async () => {
  const { items: data } = await activitiesOptionsRequest("activities");
  activitiesState.activityNames = Array.isArray(data)
    ? data
      .map((row) => ({
        id: String(row?.id || ""),
        name: String(row?.name || "").trim(),
      }))
      .filter((activity) => activity.id && activity.name)
    : [];
  renderActivitiesCatalogList();
  return activitiesState.activityNames;
};

const ensureActivityNameRemote = async (name) => {
  const activityName = String(name || "").trim();
  if (!activityName) return null;
  const { item: data } = await activitiesOptionsRequest("activities", {
    method: "POST",
    body: { name: activityName },
  });
  if (data?.id && data?.name) {
    const nextActivity = { id: String(data.id), name: String(data.name).trim() };
    activitiesState.activityNames = [
      nextActivity,
      ...activitiesState.activityNames.filter((activity) => activity.id !== nextActivity.id && activity.name !== nextActivity.name),
    ].sort((left, right) => left.name.localeCompare(right.name, getLanguage() === "en" ? "en" : "pt"));
    renderActivitiesCatalogList();
    return nextActivity;
  }
  return null;
};

const updateActivityNameRemote = async (id, name) => {
  const activityName = String(name || "").trim();
  if (!id || !activityName) return null;
  const previousName = activitiesState.activityNames.find((activity) => activity.id === id)?.name || "";
  const { item: data } = await activitiesOptionsRequest("activities", {
    method: "PATCH",
    body: { id, name: activityName },
  });
  if (data?.id && data?.name) {
    const nextActivity = { id: String(data.id), name: String(data.name).trim() };
    activitiesState.activityNames = [
      nextActivity,
      ...activitiesState.activityNames.filter((activity) => activity.id !== nextActivity.id),
    ].sort((left, right) => left.name.localeCompare(right.name, getLanguage() === "en" ? "en" : "pt"));
    if (previousName && previousName !== nextActivity.name) {
      activitiesState.entries = activitiesState.entries.map((entry) =>
        entry.title === previousName ? { ...entry, title: nextActivity.name } : entry,
      );
      renderActivitiesCalendar();
    }
    renderActivitiesCatalogList();
    return nextActivity;
  }
  return null;
};

const deleteActivityNameRemote = async (id) => {
  await activitiesOptionsRequest("activities", {
    method: "DELETE",
    body: { id },
  });
  if (activitiesState.editingActivityNameId === id) {
    const { form } = activitiesCatalogElements();
    activitiesState.editingActivityNameId = "";
    form?.reset();
  }
  activitiesState.activityNames = activitiesState.activityNames.filter((activity) => activity.id !== id);
  renderActivitiesCatalogList();
};

const editActivityNameOption = (id) => {
  const { input } = activitiesCatalogElements();
  const activity = activitiesState.activityNames.find((item) => item.id === id);
  if (!input || !activity) return;
  activitiesState.editingActivityNameId = activity.id;
  input.value = activity.name;
  setActivitiesCatalogFeedback("");
  input.focus();
  input.select();
};

const openActivitiesCatalogDialog = () => {
  const { dialog, input } = activitiesCatalogElements();
  if (!dialog) return;
  closeToolsMenus();
  setActivitiesCatalogFeedback("");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  void loadActivitiesCatalog().catch((error) => {
    console.warn("Nao foi possivel carregar atividades.", error);
    setActivitiesCatalogFeedback(activityOptionErrorMessage(error, getTranslation("activities.localOnly")));
  });
  refreshIcons();
  window.setTimeout(() => input?.focus(), 0);
};

const closeActivitiesCatalogDialog = () => {
  const { dialog, form } = activitiesCatalogElements();
  if (!dialog) return;
  form?.reset();
  activitiesState.editingActivityNameId = "";
  setActivitiesCatalogFeedback("");
  if (dialog.open && typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
};

const handleActivityCatalogSubmit = async (event) => {
  event.preventDefault();
  const { form, input } = activitiesCatalogElements();
  const name = String(input?.value || "").trim();
  if (!name) return;
  const submitButton = form?.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  try {
    if (activitiesState.editingActivityNameId) {
      await updateActivityNameRemote(activitiesState.editingActivityNameId, name);
      activitiesState.editingActivityNameId = "";
      setActivitiesCatalogFeedback("Atividade atualizada.", "success");
    } else {
      await ensureActivityNameRemote(name);
      setActivitiesCatalogFeedback("Atividade guardada.", "success");
    }
    form?.reset();
    input?.focus();
  } catch (error) {
    console.warn("Nao foi possivel guardar atividade.", error);
    setActivitiesCatalogFeedback(activityOptionErrorMessage(error, "Nao foi possivel guardar a atividade."));
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
};

const wireActivitiesCatalogDialog = () => {
  const { dialog, openButtons, closeButtons, form, list } = activitiesCatalogElements();
  if (!dialog || dialog.dataset.activitiesCatalogWired === "true") return;
  dialog.dataset.activitiesCatalogWired = "true";
  openButtons.forEach((button) => {
    button.addEventListener("click", openActivitiesCatalogDialog);
  });
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeActivitiesCatalogDialog);
  });
  form?.addEventListener("submit", handleActivityCatalogSubmit);
  list?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const editButton = target?.closest("[data-activity-name-edit]");
    const editId = editButton?.dataset.activityNameEdit || "";
    if (editId) {
      editActivityNameOption(editId);
      return;
    }
    const button = target?.closest("[data-activity-name-delete]");
    const id = button?.dataset.activityNameDelete || "";
    if (!id) return;
    void deleteActivityNameRemote(id).catch((error) => {
      console.warn("Nao foi possivel remover atividade.", error);
      setActivitiesCatalogFeedback(activityOptionErrorMessage(error, "Nao foi possivel remover a atividade."));
    });
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeActivitiesCatalogDialog();
  });
};

const activitiesMonitorsElements = () => ({
  dialog: document.querySelector("[data-activities-monitors-dialog]"),
  openButtons: document.querySelectorAll("[data-activities-monitors-toggle]"),
  closeButtons: document.querySelectorAll("[data-activities-monitors-close]"),
  form: document.querySelector("[data-activities-monitor-form]"),
  input: document.querySelector("[data-activities-monitor-form] input[name='name']"),
  list: document.querySelector("[data-activities-monitor-list]"),
  error: document.querySelector("[data-activities-monitors-error]"),
  select: document.querySelector("[data-activity-monitor-options]"),
  selects: document.querySelectorAll("[data-activity-monitor-options]"),
});

const setActivitiesMonitorsFeedback = (message = "", kind = "error") => {
  const { error } = activitiesMonitorsElements();
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
  error.classList.toggle("is-success", kind === "success");
};

const renderActivityMonitorOptions = () => {
  const { selects } = activitiesMonitorsElements();
  selects.forEach((select) => {
    renderActivitySelectOptions(
      select,
      activitiesState.monitors,
      select.dataset.activityMonitorPlaceholder || "activities.selectMonitor",
    );
  });
};

const renderActivityMonitorsList = () => {
  const { list } = activitiesMonitorsElements();
  if (!list) return;
  if (!activitiesState.monitors.length) {
    list.innerHTML = `<p class="activity-empty-state">Sem monitores registados.</p>`;
    renderActivityMonitorOptions();
    refreshIcons();
    return;
  }
  list.innerHTML = activitiesState.monitors
    .map(
      (monitor) => `
        <article class="activities-monitor-row">
          <strong>${escapeHtml(monitor.name)}</strong>
          <div class="activities-monitor-actions">
            <button class="icon-link" type="button" data-activities-monitor-edit="${escapeHtml(monitor.id)}" title="Editar monitor" aria-label="Editar monitor">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-link danger-link" type="button" data-activities-monitor-delete="${escapeHtml(monitor.id)}" title="Remover monitor" aria-label="Remover monitor">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </article>
      `,
    )
    .join("");
  renderActivityMonitorOptions();
  refreshIcons();
};

const loadActivityMonitors = async () => {
  const { items: data } = await activitiesOptionsRequest("monitors");
  activitiesState.monitors = Array.isArray(data)
    ? data
      .map((row) => ({
        id: String(row?.id || ""),
        name: String(row?.name || "").trim(),
      }))
      .filter((monitor) => monitor.id && monitor.name)
    : [];
  renderActivityMonitorsList();
  return activitiesState.monitors;
};

const ensureActivityMonitorRemote = async (name) => {
  const monitorName = String(name || "").trim();
  if (!monitorName) return null;
  const { item: data } = await activitiesOptionsRequest("monitors", {
    method: "POST",
    body: { name: monitorName },
  });
  if (data?.id && data?.name) {
    const nextMonitor = { id: String(data.id), name: String(data.name).trim() };
    activitiesState.monitors = [
      nextMonitor,
      ...activitiesState.monitors.filter((monitor) => monitor.id !== nextMonitor.id && monitor.name !== nextMonitor.name),
    ].sort((left, right) => left.name.localeCompare(right.name, getLanguage() === "en" ? "en" : "pt"));
    renderActivityMonitorsList();
    return nextMonitor;
  }
  return null;
};

const updateActivityMonitorRemote = async (id, name) => {
  const monitorName = String(name || "").trim();
  if (!id || !monitorName) return null;
  const previousName = activitiesState.monitors.find((monitor) => monitor.id === id)?.name || "";
  const { item: data } = await activitiesOptionsRequest("monitors", {
    method: "PATCH",
    body: { id, name: monitorName },
  });
  if (data?.id && data?.name) {
    const nextMonitor = { id: String(data.id), name: String(data.name).trim() };
    activitiesState.monitors = [
      nextMonitor,
      ...activitiesState.monitors.filter((monitor) => monitor.id !== nextMonitor.id),
    ].sort((left, right) => left.name.localeCompare(right.name, getLanguage() === "en" ? "en" : "pt"));
    if (previousName && previousName !== nextMonitor.name) {
      activitiesState.entries = activitiesState.entries.map((entry) => {
        const teacher = replaceActivityMonitorName(entry.teacher, previousName, nextMonitor.name);
        return teacher !== entry.teacher ? { ...entry, teacher } : entry;
      });
      renderActivitiesCalendar();
    }
    renderActivityMonitorsList();
    return nextMonitor;
  }
  return null;
};

const deleteActivityMonitorRemote = async (id) => {
  await activitiesOptionsRequest("monitors", {
    method: "DELETE",
    body: { id },
  });
  if (activitiesState.editingMonitorId === id) {
    const { form } = activitiesMonitorsElements();
    activitiesState.editingMonitorId = "";
    form?.reset();
  }
  activitiesState.monitors = activitiesState.monitors.filter((monitor) => monitor.id !== id);
  renderActivityMonitorsList();
};

const editActivityMonitorOption = (id) => {
  const { input } = activitiesMonitorsElements();
  const monitor = activitiesState.monitors.find((item) => item.id === id);
  if (!input || !monitor) return;
  activitiesState.editingMonitorId = monitor.id;
  input.value = monitor.name;
  setActivitiesMonitorsFeedback("");
  input.focus();
  input.select();
};

const refreshActivityOptionLists = async () => {
  const results = await Promise.allSettled([loadActivitiesCatalog(), loadActivityMonitors()]);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Nao foi possivel carregar opcoes de atividades.", result.reason);
    }
  });
};

const openActivitiesMonitorsDialog = () => {
  const { dialog, input } = activitiesMonitorsElements();
  if (!dialog) return;
  closeToolsMenus();
  setActivitiesMonitorsFeedback("");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  void loadActivityMonitors().catch((error) => {
    console.warn("Nao foi possivel carregar monitores.", error);
    setActivitiesMonitorsFeedback(activityOptionErrorMessage(error, getTranslation("activities.localOnly")));
  });
  refreshIcons();
  window.setTimeout(() => input?.focus(), 0);
};

const closeActivitiesMonitorsDialog = () => {
  const { dialog, form } = activitiesMonitorsElements();
  if (!dialog) return;
  form?.reset();
  activitiesState.editingMonitorId = "";
  setActivitiesMonitorsFeedback("");
  if (dialog.open && typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
};

const handleActivityMonitorSubmit = async (event) => {
  event.preventDefault();
  const { form, input } = activitiesMonitorsElements();
  const name = String(input?.value || "").trim();
  if (!name) return;
  const submitButton = form?.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  try {
    if (activitiesState.editingMonitorId) {
      await updateActivityMonitorRemote(activitiesState.editingMonitorId, name);
      activitiesState.editingMonitorId = "";
      setActivitiesMonitorsFeedback("Monitor atualizado.", "success");
    } else {
      await ensureActivityMonitorRemote(name);
      setActivitiesMonitorsFeedback("Monitor guardado.", "success");
    }
    form?.reset();
    input?.focus();
  } catch (error) {
    console.warn("Nao foi possivel guardar monitor.", error);
    setActivitiesMonitorsFeedback(activityOptionErrorMessage(error, "Nao foi possivel guardar o monitor."));
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
};

const wireActivitiesMonitorsDialog = () => {
  const { dialog, openButtons, closeButtons, form, list } = activitiesMonitorsElements();
  if (!dialog || dialog.dataset.activitiesMonitorsWired === "true") return;
  dialog.dataset.activitiesMonitorsWired = "true";
  openButtons.forEach((button) => {
    button.addEventListener("click", openActivitiesMonitorsDialog);
  });
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeActivitiesMonitorsDialog);
  });
  form?.addEventListener("submit", handleActivityMonitorSubmit);
  list?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const editButton = target?.closest("[data-activities-monitor-edit]");
    const editId = editButton?.dataset.activitiesMonitorEdit || "";
    if (editId) {
      editActivityMonitorOption(editId);
      return;
    }
    const button = target?.closest("[data-activities-monitor-delete]");
    const id = button?.dataset.activitiesMonitorDelete || "";
    if (!id) return;
    void deleteActivityMonitorRemote(id).catch((error) => {
      console.warn("Nao foi possivel remover monitor.", error);
      setActivitiesMonitorsFeedback(activityOptionErrorMessage(error, "Nao foi possivel remover o monitor."));
    });
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeActivitiesMonitorsDialog();
  });
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
const activitiesHistoryStorageKey = "central-activities-history-v1";
const activitiesMigrationStorageKey = "central-activities-supabase-migrated-v1";
const activitiesHistoryMigrationStorageKey = "central-activities-history-supabase-migrated-v1";
const activitiesScheduleTableName = "activities_schedule";
const activitiesHistoryTableName = "activities_history";
const activitiesCatalogTableName = "activities_catalog";
const activitiesMonitorsTableName = "activities_monitors";
const activitiesDays = [
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
];
const defaultActivityPeriods = [
  ["09:00", "12:00"],
  ["12:00", "13:00"],
  ["13:00", "17:00"],
];
const defaultLunchTitle = "Almo\u00e7o";
const defaultLunchMonitorName = "Monitor a definir";
const defaultLunchStart = "12:00";
const defaultLunchEnd = "13:00";
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
const formatActivityDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const activitiesState = {
  client: null,
  entries: [],
  history: [],
  summaries: [],
  utentes: [],
  activityNames: [],
  monitors: [],
  editingActivityNameId: "",
  editingMonitorId: "",
  storageMode: "local",
  selectedWeekStart: weekStartIso(),
  draggedActivityId: "",
  dragPreviewCellKey: "",
  dragPreviewIndex: -1,
  dragImageEl: null,
  defaultLunchPendingWeeks: new Set(),
  summaryAttendanceIds: new Set(),
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
  copyPreviousBtn: document.querySelector("[data-activities-copy-previous]"),
  printBtn: document.querySelector("[data-activities-print]"),
  statisticsBtn: document.querySelector("[data-activities-statistics]"),
  statisticsDialog: document.querySelector("[data-activities-statistics-dialog]"),
  statisticsCloseBtn: document.querySelector("[data-activities-statistics-close]"),
  statisticsMonthInput: document.querySelector("[data-activities-statistics-month]"),
  statisticsRefreshBtn: document.querySelector("[data-activities-statistics-refresh]"),
  statisticsContent: document.querySelector("[data-activities-statistics-content]"),
  statisticsError: document.querySelector("[data-activities-statistics-error]"),
  summaryDialog: document.querySelector("[data-activities-summary-dialog]"),
  summaryCloseBtn: document.querySelector("[data-activities-summary-close]"),
  summaryPrintBtn: document.querySelector("[data-activities-summary-print]"),
  summaryForm: document.querySelector("[data-activities-summary-form]"),
  summaryActivitySelect: document.querySelector("[data-summary-activity-select]"),
  summaryActivityName: document.querySelector("[data-summary-activity-name]"),
  summaryDate: document.querySelector("[data-summary-date]"),
  summaryStart: document.querySelector("[data-summary-start]"),
  summaryEnd: document.querySelector("[data-summary-end]"),
  summaryDuration: document.querySelector("[data-summary-duration]"),
  summaryAttendanceList: document.querySelector("[data-summary-attendance-list]"),
  summaryAttendanceSearch: document.querySelector("[data-summary-attendance-search]"),
  summaryClearBtn: document.querySelector("[data-summary-clear]"),
  summaryError: document.querySelector("[data-summary-error]"),
  status: document.querySelector("[data-activities-status]"),
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

const createActivitiesClient = () => {
  if (activitiesState.client) return activitiesState.client;
  const config = window.CENTRAL_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
    return null;
  }
  activitiesState.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: centralAuthStorageKey,
      storage: centralAuthStorage,
    },
  });
  return activitiesState.client;
};

const activityTimeFromRow = (value) => String(value || "").slice(0, 5);

const activityEntryFromRow = (row, fallbackOrder = 0) =>
  normalizeActivityEntry(
    {
      id: row?.id,
      weekStart: row?.week_start,
      day: row?.day,
      start: activityTimeFromRow(row?.start_time),
      end: activityTimeFromRow(row?.end_time),
      title: row?.title,
      teacher: row?.teacher,
      order: row?.sort_order,
    },
    dateFromIso(String(row?.week_start || "")) ? weekStartIso(row.week_start) : activitiesState.selectedWeekStart,
    fallbackOrder,
  );

const activityEntryToRow = (entry) => ({
  id: entry.id,
  week_start: entry.weekStart,
  day: entry.day,
  start_time: entry.start,
  end_time: entry.end || null,
  title: entry.title,
  teacher: entry.teacher,
  sort_order: Number(entry.order) || 0,
});

const activityDateForEntry = (entry) => {
  const dayIndex = activitiesDays.findIndex((day) => day.key === entry?.day);
  return addDaysToIso(entry?.weekStart || activitiesState.selectedWeekStart, dayIndex >= 0 ? dayIndex : 0);
};

const activityDateIsoForEntry = (entry) => dateToIso(activityDateForEntry(entry));

const activityMinutesFromTime = (time) => {
  if (!isActivityTime(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const activityDurationMinutes = (entry) => {
  const start = activityMinutesFromTime(entry?.start);
  const end = activityMinutesFromTime(entry?.end);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
};

const activityDurationText = (minutes) => {
  const value = Math.max(0, Number(minutes) || 0);
  if (value < 60) return getTranslation("activities.summaryDurationMinutes").replace("{count}", String(value));
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return getTranslation("activities.summaryDurationHours")
    .replace("{hours}", String(hours))
    .replace("{minutes}", String(rest));
};

const normalizeActivityUtente = (utente) => {
  const id = String(utente?.id || "").trim();
  const name = String(utente?.name || utente?.nome || "").trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    number: String(utente?.number || utente?.numero_utente || "").trim(),
  };
};

const normalizeActivitySummary = (summary) => {
  const activityId = String(summary?.activityId || summary?.activity_id || "").trim();
  const activityDate = String(summary?.activityDate || summary?.activity_date || "").trim();
  if (!activityId || !dateFromIso(activityDate)) return null;
  const attendanceSource = Array.isArray(summary?.attendance) ? summary.attendance : [];
  return {
    id: String(summary?.id || "").trim(),
    activityId,
    activityDate,
    title: String(summary?.title || summary?.activity_title || "").trim(),
    start: activityTimeFromRow(summary?.start || summary?.start_time),
    end: activityTimeFromRow(summary?.end || summary?.end_time),
    durationMinutes: Math.max(0, Number(summary?.durationMinutes ?? summary?.duration_minutes) || 0),
    summary: String(summary?.summary || ""),
    attendance: attendanceSource.map(normalizeActivityUtente).filter(Boolean),
  };
};

const activitiesSummariesRequest = async ({ method = "GET", body = null } = {}) => {
  const token = await getActivitiesAccessToken();
  const isGet = method === "GET";
  const query = new URLSearchParams({ weekStart: activitiesState.selectedWeekStart });
  const response = await fetch(`/api/activities-summaries${isGet ? `?${query.toString()}` : ""}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isGet ? {} : { "Content-Type": "application/json" }),
    },
    body: isGet ? undefined : JSON.stringify(body || {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || getTranslation("activities.summaryLoadError"));
  }
  return payload;
};

const loadActivitySummaryData = async () => {
  const payload = await activitiesSummariesRequest();
  activitiesState.summaries = Array.isArray(payload?.summaries)
    ? payload.summaries.map(normalizeActivitySummary).filter(Boolean)
    : [];
  activitiesState.utentes = Array.isArray(payload?.utentes)
    ? payload.utentes.map(normalizeActivityUtente).filter(Boolean)
    : [];
  return payload;
};

const saveActivitySummaryRemote = async (summary) => {
  const payload = await activitiesSummariesRequest({
    method: "POST",
    body: summary,
  });
  const savedSummary = normalizeActivitySummary(payload?.summary);
  if (!savedSummary) throw new Error(getTranslation("activities.summarySaveError"));
  activitiesState.summaries = [
    savedSummary,
    ...activitiesState.summaries.filter(
      (item) => item.activityId !== savedSummary.activityId || item.activityDate !== savedSummary.activityDate,
    ),
  ];
  return savedSummary;
};

const activityMonthValue = (value = activitiesState.selectedWeekStart) => {
  const date = value instanceof Date ? value : dateFromIso(String(value || ""));
  return dateToIso(date || new Date()).slice(0, 7);
};

const formatActivityMonth = (month) => {
  const [year, monthNumber] = String(month || "").split("-").map(Number);
  if (!year || !monthNumber) return String(month || "");
  return new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
};

const formatActivityNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat(getLanguage() === "en" ? "en-GB" : "pt-PT", {
    maximumFractionDigits,
  }).format(Number(value) || 0);

const formatActivityPercentage = (value) => `${formatActivityNumber(value, 1)}%`;

const formatActivityVolume = (minutes) => {
  const hours = (Number(minutes) || 0) / 60;
  return `${formatActivityNumber(hours, 1)} ${getTranslation("activities.statisticsPersonHours")}`;
};

const activitiesStatisticsRequest = async (month) => {
  const token = await getActivitiesAccessToken();
  const query = new URLSearchParams({ month });
  const response = await fetch(`/api/activities-statistics?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || getTranslation("activities.statisticsLoadError"));
  }
  return payload?.statistics || null;
};

const setActivityStatisticsFeedback = (message = "") => {
  const { statisticsError } = activitiesElements();
  if (!statisticsError) return;
  statisticsError.textContent = message || "";
  statisticsError.hidden = !message;
};

const statisticsTableEmptyRow = (colspan) =>
  `<tr><td colspan="${colspan}">${escapeHtml(getTranslation("activities.statisticsNoRows"))}</td></tr>`;

const renderActivityStatistics = (statistics) => {
  const { statisticsContent } = activitiesElements();
  if (!statisticsContent) return;
  if (!statistics) {
    statisticsContent.innerHTML = `<p class="activity-empty-state">${escapeHtml(getTranslation("activities.statisticsEmpty"))}</p>`;
    return;
  }
  const totals = statistics.totals || {};
  const attendanceRows = Array.isArray(statistics.attendance) && statistics.attendance.length
    ? statistics.attendance
      .map(
        (row) => `
          <tr>
            <td><strong>${escapeHtml(row.name || "-")}</strong></td>
            <td>${escapeHtml(`${formatActivityNumber(row.present)} / ${formatActivityNumber(row.total)}`)}</td>
            <td>${escapeHtml(formatActivityPercentage(row.percentage))}</td>
          </tr>
        `,
      )
      .join("")
    : statisticsTableEmptyRow(3);
  const volumeRows = Array.isArray(statistics.volumeByActivity) && statistics.volumeByActivity.length
    ? statistics.volumeByActivity
      .map(
        (row) => `
          <tr>
            <td><strong>${escapeHtml(row.title || "-")}</strong></td>
            <td>${escapeHtml(formatActivityNumber(row.sessions))}</td>
            <td>${escapeHtml(formatActivityNumber(row.attendance))}</td>
            <td>${escapeHtml(activityDurationText(row.durationMinutes))}</td>
            <td>${escapeHtml(formatActivityVolume(row.volumeMinutes))}</td>
          </tr>
        `,
      )
      .join("")
    : statisticsTableEmptyRow(5);

  statisticsContent.innerHTML = `
    <div class="activity-statistics-month">${escapeHtml(formatActivityMonth(statistics.month))}</div>
    <div class="activity-statistics-cards">
      <div>
        <span>${escapeHtml(getTranslation("activities.statisticsActivities"))}</span>
        <strong>${escapeHtml(formatActivityNumber(totals.activities))}</strong>
      </div>
      <div>
        <span>${escapeHtml(getTranslation("activities.statisticsAverage"))}</span>
        <strong>${escapeHtml(formatActivityNumber(totals.averageAttendance, 1))}</strong>
      </div>
      <div>
        <span>${escapeHtml(getTranslation("activities.statisticsSummaries"))}</span>
        <strong>${escapeHtml(formatActivityNumber(totals.summaries))}</strong>
      </div>
      <div>
        <span>${escapeHtml(getTranslation("activities.statisticsVolume"))}</span>
        <strong>${escapeHtml(formatActivityVolume(totals.volumeMinutes))}</strong>
      </div>
    </div>
    <section class="activity-statistics-section">
      <h3>${escapeHtml(getTranslation("activities.statisticsAttendanceTitle"))}</h3>
      <div class="activity-statistics-table-wrap">
        <table class="activity-statistics-table">
          <thead>
            <tr>
              <th>${escapeHtml(getTranslation("activities.statisticsUser"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsAttendance"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsAssiduity"))}</th>
            </tr>
          </thead>
          <tbody>${attendanceRows}</tbody>
        </table>
      </div>
    </section>
    <section class="activity-statistics-section">
      <h3>${escapeHtml(getTranslation("activities.statisticsVolumeTitle"))}</h3>
      <div class="activity-statistics-table-wrap">
        <table class="activity-statistics-table">
          <thead>
            <tr>
              <th>${escapeHtml(getTranslation("activities.name"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsSessions"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsPeople"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsDuration"))}</th>
              <th>${escapeHtml(getTranslation("activities.statisticsVolume"))}</th>
            </tr>
          </thead>
          <tbody>${volumeRows}</tbody>
        </table>
      </div>
    </section>
  `;
  refreshIcons();
};

const loadActivityStatistics = async () => {
  const { statisticsMonthInput, statisticsRefreshBtn, statisticsContent } = activitiesElements();
  const month = String(statisticsMonthInput?.value || activityMonthValue()).trim();
  if (statisticsMonthInput && !statisticsMonthInput.value) {
    statisticsMonthInput.value = month;
  }
  if (statisticsRefreshBtn) statisticsRefreshBtn.disabled = true;
  setActivityStatisticsFeedback("");
  if (statisticsContent) {
    statisticsContent.innerHTML = `<p class="activity-empty-state">${escapeHtml(getTranslation("activities.loading"))}</p>`;
  }
  try {
    renderActivityStatistics(await activitiesStatisticsRequest(month));
  } catch (error) {
    console.warn("Nao foi possivel carregar estatisticas de atividades.", error);
    setActivityStatisticsFeedback(error?.message || getTranslation("activities.statisticsLoadError"));
    renderActivityStatistics(null);
  } finally {
    if (statisticsRefreshBtn) statisticsRefreshBtn.disabled = false;
  }
};

const openActivityStatisticsDialog = () => {
  if (!centralHasPermission(window.CENTRAL_USER_PROFILE, "atividades", "view")) {
    showCentralRestrictedAccess(getTranslation("access.actionRestricted"));
    return;
  }
  const { statisticsDialog, statisticsMonthInput } = activitiesElements();
  if (!statisticsDialog) return;
  closeToolsMenus();
  setActivityFormOpen(false);
  closeActivitySummaryDialog();
  if (statisticsMonthInput) statisticsMonthInput.value = activityMonthValue();
  setActivityStatisticsFeedback("");
  if (typeof statisticsDialog.showModal === "function") {
    statisticsDialog.showModal();
  } else {
    statisticsDialog.setAttribute("open", "");
  }
  void loadActivityStatistics();
};

const closeActivityStatisticsDialog = () => {
  const { statisticsDialog } = activitiesElements();
  if (!statisticsDialog) return;
  setActivityStatisticsFeedback("");
  if (statisticsDialog.open && typeof statisticsDialog.close === "function") {
    statisticsDialog.close();
  } else {
    statisticsDialog.removeAttribute("open");
  }
};

const normalizeActivityText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isDefaultLunchEntry = (entry) =>
  normalizeActivityText(entry?.title) === normalizeActivityText(defaultLunchTitle) &&
  entry?.start === defaultLunchStart &&
  entry?.end === defaultLunchEnd;

const isDefaultLunchPlaceholder = (entry) =>
  isDefaultLunchEntry(entry) && normalizeActivityText(entry?.teacher) === normalizeActivityText(defaultLunchMonitorName);

const sameActivityScheduleSlot = (left, right) =>
  left?.weekStart === right?.weekStart &&
  left?.day === right?.day &&
  left?.start === right?.start &&
  (left?.end || "") === (right?.end || "") &&
  normalizeActivityText(left?.title) === normalizeActivityText(right?.title);

const canEditActivities = () => centralHasPermission(window.CENTRAL_USER_PROFILE, "atividades", "edit");

const readActivitiesFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(activitiesStorageKey) || "[]");
    return Array.isArray(stored)
      ? stored.map((entry, index) => normalizeActivityEntry(entry, activitiesState.selectedWeekStart, index)).filter(Boolean)
      : [];
  } catch (_error) {
    return [];
  }
};

const saveActivities = () => {};

const markActivitiesRemoteUnavailable = (error) => {
  activitiesState.storageMode = "local";
  if (error) {
    console.warn("Atividades partilhadas indisponiveis.", error);
  }
  if (activitiesElements().root) {
    setActivitiesFeedback(getTranslation("activities.localOnly"));
  }
};

const hasActivitiesMigrationRun = (key) => {
  try {
    return localStorage.getItem(key) === "true";
  } catch (_error) {
    return true;
  }
};

const markActivitiesMigrationRun = (key) => {
  try {
    localStorage.setItem(key, "true");
  } catch (_error) {
    // A migracao pode voltar a tentar noutro carregamento se o browser bloquear localStorage.
  }
};

const migrateLocalActivitiesToRemote = async (client, remoteEntries, localEntries) => {
  if (!localEntries.length || hasActivitiesMigrationRun(activitiesMigrationStorageKey)) return remoteEntries;
  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
  const missingEntries = localEntries.filter((entry) => !remoteIds.has(entry.id));
  if (!missingEntries.length) {
    markActivitiesMigrationRun(activitiesMigrationStorageKey);
    return remoteEntries;
  }
  const { data, error } = await client
    .from(activitiesScheduleTableName)
    .upsert(missingEntries.map(activityEntryToRow), { onConflict: "id" })
    .select("id,week_start,day,start_time,end_time,title,teacher,sort_order");
  if (error) {
    console.warn("Nao foi possivel migrar atividades locais.", error);
    return remoteEntries;
  }
  markActivitiesMigrationRun(activitiesMigrationStorageKey);
  const migratedEntries = Array.isArray(data)
    ? data.map((row, index) => activityEntryFromRow(row, remoteEntries.length + index)).filter(Boolean)
    : missingEntries;
  return [
    ...remoteEntries.filter((entry) => !new Set(migratedEntries.map((item) => item.id)).has(entry.id)),
    ...migratedEntries,
  ];
};

const loadActivities = async () => {
  const localEntries = readActivitiesFromStorage();
  const client = createActivitiesClient();
  if (!client) {
    activitiesState.entries = [];
    markActivitiesRemoteUnavailable();
    return;
  }
  const { data, error } = await client
    .from(activitiesScheduleTableName)
    .select("id,week_start,day,start_time,end_time,title,teacher,sort_order")
    .order("week_start", { ascending: true })
    .order("day", { ascending: true })
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) {
    activitiesState.entries = [];
    markActivitiesRemoteUnavailable(error);
    return;
  }
  activitiesState.storageMode = "remote";
  let remoteEntries = Array.isArray(data)
    ? data.map((row, index) => activityEntryFromRow(row, index)).filter(Boolean)
    : [];
  remoteEntries = await migrateLocalActivitiesToRemote(client, remoteEntries, localEntries);
  activitiesState.entries = remoteEntries;
  saveActivities(remoteEntries);
};

const normalizeActivityHistoryEntry = (entry, index = 0) => {
  const at = new Date(entry?.at || "");
  if (Number.isNaN(at.getTime())) return null;
  return {
    id: String(entry?.id || `activity-history-${index}`),
    at: at.toISOString(),
    action: String(entry?.action || "updated"),
    title: String(entry?.title || ""),
    teacher: String(entry?.teacher || ""),
    day: isActivityDay(entry?.day) ? entry.day : "",
    start: isActivityTime(entry?.start) ? entry.start : "",
    end: isActivityTime(entry?.end) ? entry.end : "",
    weekStart: dateFromIso(String(entry?.weekStart || "")) ? weekStartIso(entry.weekStart) : "",
  };
};

const readActivitiesHistoryFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(activitiesHistoryStorageKey) || "[]");
    return Array.isArray(stored)
      ? stored
        .map((entry, index) => normalizeActivityHistoryEntry(entry, index))
        .filter(Boolean)
        .sort((left, right) => right.at.localeCompare(left.at))
      : [];
  } catch (_error) {
    return [];
  }
};

const saveActivitiesHistory = () => {};

const activityHistoryEntryFromRow = (row, index = 0) =>
  normalizeActivityHistoryEntry(
    {
      id: row?.id,
      at: row?.created_at,
      action: row?.action,
      title: row?.title,
      teacher: row?.teacher,
      day: row?.day,
      start: activityTimeFromRow(row?.start_time),
      end: activityTimeFromRow(row?.end_time),
      weekStart: row?.week_start,
    },
    index,
  );

const activityHistoryEntryToRow = (entry) => ({
  id: entry.id,
  created_at: entry.at,
  action: entry.action,
  title: entry.title || null,
  teacher: entry.teacher || null,
  day: entry.day || null,
  start_time: entry.start || null,
  end_time: entry.end || null,
  week_start: entry.weekStart || null,
});

const migrateLocalActivityHistoryToRemote = async (client, remoteEntries, localEntries) => {
  if (!localEntries.length || hasActivitiesMigrationRun(activitiesHistoryMigrationStorageKey)) return remoteEntries;
  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
  const missingEntries = localEntries.filter((entry) => !remoteIds.has(entry.id)).slice(0, 200);
  if (!missingEntries.length) {
    markActivitiesMigrationRun(activitiesHistoryMigrationStorageKey);
    return remoteEntries;
  }
  const { data, error } = await client
    .from(activitiesHistoryTableName)
    .insert(missingEntries.map(activityHistoryEntryToRow))
    .select("id,created_at,action,title,teacher,day,start_time,end_time,week_start");
  if (error) {
    console.warn("Nao foi possivel migrar historico local de atividades.", error);
    return remoteEntries;
  }
  markActivitiesMigrationRun(activitiesHistoryMigrationStorageKey);
  const migratedEntries = Array.isArray(data)
    ? data.map((row, index) => activityHistoryEntryFromRow(row, index)).filter(Boolean)
    : missingEntries;
  return [...remoteEntries, ...migratedEntries]
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, 200);
};

const loadActivitiesHistory = async () => {
  const localEntries = readActivitiesHistoryFromStorage();
  const client = createActivitiesClient();
  if (!client) {
    activitiesState.history = [];
    return [];
  }
  const { data, error } = await client
    .from(activitiesHistoryTableName)
    .select("id,created_at,action,title,teacher,day,start_time,end_time,week_start")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("Historico partilhado de atividades indisponivel.", error);
    activitiesState.history = [];
    return [];
  }
  let remoteEntries = Array.isArray(data)
    ? data.map((row, index) => activityHistoryEntryFromRow(row, index)).filter(Boolean)
    : [];
  remoteEntries = await migrateLocalActivityHistoryToRemote(client, remoteEntries, localEntries);
  activitiesState.history = remoteEntries;
  saveActivitiesHistory(remoteEntries);
  return remoteEntries;
};

const saveActivityHistoryRemote = async (entry) => {
  if (activitiesState.storageMode !== "remote") return;
  const client = createActivitiesClient();
  if (!client) return;
  const { error } = await client
    .from(activitiesHistoryTableName)
    .insert(activityHistoryEntryToRow(entry));
  if (error) console.warn("Nao foi possivel guardar historico de atividades.", error);
};

const recordActivityHistory = (action, entry = {}) => {
  if (activitiesState.storageMode !== "remote") return;
  const item = normalizeActivityEntry(entry, activitiesState.selectedWeekStart, Number(entry.order) || 0);
  const historyEntry = {
    id: activityId(),
    at: new Date().toISOString(),
    action,
    title: item?.title || String(entry?.title || ""),
    teacher: item?.teacher || String(entry?.teacher || ""),
    day: item?.day || (isActivityDay(entry?.day) ? entry.day : ""),
    start: item?.start || (isActivityTime(entry?.start) ? entry.start : ""),
    end: item?.end || (isActivityTime(entry?.end) ? entry.end : ""),
    weekStart: item?.weekStart || activitiesState.selectedWeekStart,
  };
  const cachedHistory = activitiesState.history.length ? activitiesState.history : readActivitiesHistoryFromStorage();
  const nextHistory = [historyEntry, ...cachedHistory].slice(0, 200);
  activitiesState.history = nextHistory;
  saveActivitiesHistory(nextHistory);
  void saveActivityHistoryRemote(historyEntry);
};

const selectedWeekActivities = () =>
  activitiesState.entries.filter((entry) => entry.weekStart === activitiesState.selectedWeekStart);

const sortActivityEntries = (entries) =>
  [...entries].sort((left, right) => {
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

const sortedActivities = () => sortActivityEntries(selectedWeekActivities());

const activityCountText = (count) =>
  count === 1
    ? getTranslation("activities.count.one")
    : getTranslation("activities.count.other").replace("{count}", String(count));

const activityTimeText = (entry) => (entry.end ? `${entry.start} - ${entry.end}` : entry.start);

const activityHistoryActionLabel = (action) => {
  const keyByAction = {
    created: "activities.historyCreated",
    updated: "activities.historyUpdated",
    deleted: "activities.historyDeleted",
    reordered: "activities.historyReordered",
    printed: "activities.historyPrinted",
    summary: "activities.historySummary",
  };
  return getTranslation(keyByAction[action] || "activities.historyUpdated");
};

const activityHistoryDetails = (entry) => {
  const details = [];
  if (entry.weekStart) {
    details.push(getTranslation("activities.historyWeek").replace("{week}", activityWeekRangeTextForWeek(entry.weekStart)));
  }
  if (entry.day) {
    details.push(getTranslation(`activities.day.${entry.day}`));
  }
  if (entry.start) {
    details.push(getTranslation("activities.historyTime").replace("{time}", activityTimeText(entry)));
  }
  if (entry.teacher) {
    details.push(getTranslation("activities.historyTeacher").replace("{teacher}", entry.teacher));
  }
  return details.join(" - ");
};

const setActivitySummaryFeedback = (message = "", kind = "error") => {
  const { summaryError } = activitiesElements();
  if (!summaryError) return;
  summaryError.textContent = message || "";
  summaryError.hidden = !message;
  summaryError.classList.toggle("is-success", kind === "success");
};

const activitySummaryOptionLabel = (entry) => {
  const entryDate = activityDateForEntry(entry);
  const dateText = entryDate ? formatActivityDate(entryDate) : "";
  return [dateText, activityTimeText(entry), entry.title].filter(Boolean).join(" - ");
};

const renderActivitySummaryOptions = (preferredId = "") => {
  const { summaryActivitySelect } = activitiesElements();
  if (!summaryActivitySelect) return;
  const currentValue = String(preferredId || summaryActivitySelect.value || "");
  const entries = sortedActivities();
  const hasCurrentValue = currentValue && entries.some((entry) => entry.id === currentValue);
  if (summaryActivitySelect instanceof HTMLSelectElement) {
    summaryActivitySelect.innerHTML = [
      `<option value="">${escapeHtml(getTranslation("activities.summarySelectActivity"))}</option>`,
      ...entries.map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(activitySummaryOptionLabel(entry))}</option>`),
    ].join("");
    summaryActivitySelect.value = hasCurrentValue ? currentValue : "";
    summaryActivitySelect.disabled = entries.length === 0;
    return;
  }
  summaryActivitySelect.value = hasCurrentValue ? currentValue : "";
};

const selectedActivitySummaryEntry = () => {
  const { summaryActivitySelect } = activitiesElements();
  const selectedId = String(summaryActivitySelect?.value || "");
  return sortedActivities().find((entry) => entry.id === selectedId) || null;
};

const activitySummaryForEntry = (entry) => {
  if (!entry) return null;
  const activityDate = activityDateIsoForEntry(entry);
  return (
    activitiesState.summaries.find(
      (summary) => summary.activityId === entry.id && summary.activityDate === activityDate,
    ) || null
  );
};

const setSummaryMetaText = (selectorNode, value) => {
  if (selectorNode) selectorNode.textContent = value || "-";
};

const resetActivitySummaryMeta = () => {
  const { summaryActivityName, summaryDate, summaryStart, summaryEnd, summaryDuration, summaryForm } = activitiesElements();
  setSummaryMetaText(summaryActivityName, "-");
  setSummaryMetaText(summaryDate, "-");
  setSummaryMetaText(summaryStart, "-");
  setSummaryMetaText(summaryEnd, "-");
  setSummaryMetaText(summaryDuration, "-");
  if (summaryForm?.elements.summary) summaryForm.elements.summary.value = "";
  activitiesState.summaryAttendanceIds = new Set();
  renderActivitySummaryAttendance();
};

const currentActivitySummaryAttendance = () =>
  activitiesState.utentes
    .filter((utente) => activitiesState.summaryAttendanceIds.has(utente.id))
    .map((utente) => ({
      id: utente.id,
      name: utente.name,
      number: utente.number,
    }));

const renderActivitySummaryAttendance = () => {
  const { summaryAttendanceList, summaryAttendanceSearch } = activitiesElements();
  if (!summaryAttendanceList) return;
  const search = normalizeActivityText(summaryAttendanceSearch?.value || "");
  const utentes = activitiesState.utentes.filter((utente) => {
    if (!search) return true;
    return normalizeActivityText(`${utente.name} ${utente.number}`).includes(search);
  });
  if (!activitiesState.utentes.length) {
    summaryAttendanceList.innerHTML = `<p class="activity-empty-state">${escapeHtml(getTranslation("activities.summaryNoUtentes"))}</p>`;
    return;
  }
  if (!utentes.length) {
    summaryAttendanceList.innerHTML = `<p class="activity-empty-state">${escapeHtml(getTranslation("activities.summaryNoUtentes"))}</p>`;
    return;
  }
  summaryAttendanceList.innerHTML = utentes
    .map(
      (utente) => `
        <label class="activity-attendance-option">
          <input type="checkbox" value="${escapeHtml(utente.id)}"${activitiesState.summaryAttendanceIds.has(utente.id) ? " checked" : ""} />
          <span>
            <strong>${escapeHtml(utente.name)}</strong>
          </span>
        </label>
      `,
    )
    .join("");
};

const fillActivitySummaryForm = (entry) => {
  const {
    summaryActivityName,
    summaryDate,
    summaryStart,
    summaryEnd,
    summaryDuration,
    summaryForm,
    summaryAttendanceSearch,
  } = activitiesElements();
  if (!entry) {
    resetActivitySummaryMeta();
    return;
  }
  const activityDate = activityDateForEntry(entry);
  const summary = activitySummaryForEntry(entry);
  setSummaryMetaText(summaryActivityName, entry.title);
  setSummaryMetaText(summaryDate, formatActivityDate(activityDate));
  setSummaryMetaText(summaryStart, entry.start);
  setSummaryMetaText(summaryEnd, entry.end || "-");
  setSummaryMetaText(summaryDuration, activityDurationText(activityDurationMinutes(entry)));
  if (summaryForm?.elements.summary) summaryForm.elements.summary.value = summary?.summary || "";
  if (summaryAttendanceSearch) summaryAttendanceSearch.value = "";
  activitiesState.summaryAttendanceIds = new Set((summary?.attendance || []).map((utente) => utente.id));
  renderActivitySummaryAttendance();
  refreshIcons();
};

const refreshActivitySummaryForm = (preferredId = "") => {
  renderActivitySummaryOptions(preferredId);
  fillActivitySummaryForm(selectedActivitySummaryEntry());
};

const openActivitySummaryDialog = async (activityId = "") => {
  if (!centralHasPermission(window.CENTRAL_USER_PROFILE, "atividades", "edit")) {
    showCentralRestrictedAccess(getTranslation("access.actionRestricted"));
    return;
  }
  const { summaryDialog } = activitiesElements();
  if (!summaryDialog) return;
  closeToolsMenus();
  setActivityFormOpen(false);
  setActivitySummaryFeedback("");
  refreshActivitySummaryForm(activityId);
  if (typeof summaryDialog.showModal === "function") {
    summaryDialog.showModal();
  } else {
    summaryDialog.setAttribute("open", "");
  }
  try {
    await loadActivitySummaryData();
    refreshActivitySummaryForm(activityId);
  } catch (error) {
    console.warn("Nao foi possivel carregar sumarios de atividades.", error);
    setActivitySummaryFeedback(error?.message || getTranslation("activities.summaryLoadError"));
    renderActivitySummaryAttendance();
  }
  refreshIcons();
};

const closeActivitySummaryDialog = () => {
  const { summaryDialog, summaryForm, summaryAttendanceSearch } = activitiesElements();
  if (!summaryDialog) return;
  summaryForm?.reset();
  if (summaryAttendanceSearch) summaryAttendanceSearch.value = "";
  activitiesState.summaryAttendanceIds = new Set();
  setActivitySummaryFeedback("");
  if (summaryDialog.open && typeof summaryDialog.close === "function") {
    summaryDialog.close();
  } else {
    summaryDialog.removeAttribute("open");
  }
};

const clearActivitySummaryForm = () => {
  const { summaryForm } = activitiesElements();
  if (summaryForm?.elements.summary) summaryForm.elements.summary.value = "";
  activitiesState.summaryAttendanceIds = new Set();
  renderActivitySummaryAttendance();
  setActivitySummaryFeedback("");
};

const handleActivitySummarySubmit = async (event) => {
  event.preventDefault();
  const { summaryForm } = activitiesElements();
  const entry = selectedActivitySummaryEntry();
  if (!summaryForm || !entry) {
    setActivitySummaryFeedback(getTranslation("activities.summaryNoActivity"));
    return;
  }
  const submitButton = summaryForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  try {
    const payload = {
      activityId: entry.id,
      activityDate: activityDateIsoForEntry(entry),
      title: entry.title,
      start: entry.start,
      end: entry.end,
      durationMinutes: activityDurationMinutes(entry),
      summary: String(summaryForm.elements.summary?.value || "").trim(),
      attendance: currentActivitySummaryAttendance(),
    };
    await saveActivitySummaryRemote(payload);
    fillActivitySummaryForm(entry);
    recordActivityHistory("summary", entry);
    setActivitySummaryFeedback(getTranslation("activities.summarySaved"), "success");
  } catch (error) {
    console.warn("Nao foi possivel guardar sumario de atividade.", error);
    setActivitySummaryFeedback(error?.message || getTranslation("activities.summarySaveError"));
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
};

const periodKey = ([start, end]) => `${start}|${end || ""}`;
const periodTimeText = ([start, end]) => (end ? `${start} - ${end}` : start);

const periodContainsActivity = ([start, end], entry) => {
  const activityEnd = entry.end || entry.start;
  if (!end) return entry.start === start && !entry.end;
  return entry.start >= start && activityEnd <= end;
};

const activityDisplayPeriod = (entry) => {
  const matchingPeriod = defaultActivityPeriods.find((period) => periodContainsActivity(period, entry));
  if (matchingPeriod) return matchingPeriod;
  return (
    defaultActivityPeriods.find(([_start, end]) => end && entry.start < end) ||
    defaultActivityPeriods[defaultActivityPeriods.length - 1]
  );
};

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

const activityPeriods = () => defaultActivityPeriods;

const activityScheduleRows = (entries) => activityPeriods(entries).map((period) => ({ type: "period", period }));

const setActivitiesFeedback = (message = "", kind = "error") => {
  const { error, status } = activitiesElements();
  [error, status].filter(Boolean).forEach((node) => {
    node.textContent = message;
    node.hidden = !message;
    node.classList.toggle("is-success", kind === "success");
  });
};

const activityWeekRangeTextForWeek = (weekStart) => {
  const normalizedWeekStart = dateFromIso(String(weekStart || "")) ? weekStartIso(weekStart) : weekStartIso();
  const start = dateFromIso(normalizedWeekStart) || new Date();
  const end = addDaysToIso(normalizedWeekStart, 4);
  return getTranslation("activities.weekRange")
    .replace("{start}", formatActivityDate(start))
    .replace("{end}", formatActivityDate(end));
};

const activityWeekRangeText = () => activityWeekRangeTextForWeek(activitiesState.selectedWeekStart);

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
      <span><i data-lucide="user-round"></i>${escapeHtml(entry.teacher)}</span>
    </div>
    <div class="activity-slot-actions">
      <button class="icon-link" type="button" data-activity-action="view" data-id="${escapeHtml(entry.id)}" data-requires-permission-area="atividades" data-requires-permission-action="view" title="${escapeHtml(getTranslation("activities.view"))}" aria-label="${escapeHtml(getTranslation("activities.view"))}">
        <i data-lucide="eye"></i>
      </button>
      <button class="icon-link" type="button" data-activity-action="summary" data-id="${escapeHtml(entry.id)}" data-requires-permission-area="atividades" data-requires-permission-action="edit" title="${escapeHtml(getTranslation("activities.summaryAction"))}" aria-label="${escapeHtml(getTranslation("activities.summaryAction"))}">
        <i data-lucide="clipboard-list"></i>
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
      <span><i data-lucide="user-round"></i>${escapeHtml(entry.teacher)}</span>
    </div>
    <div class="activity-slot-actions activity-slot-preview-actions">
      <span class="icon-link" aria-hidden="true"><i data-lucide="eye"></i></span>
      <span class="icon-link" aria-hidden="true"><i data-lucide="clipboard-list"></i></span>
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
  const scheduleRows = activityScheduleRows(entries);
  grid.classList.toggle("is-empty", entries.length === 0);
  grid.innerHTML = `
    <div class="school-timetable" role="table" aria-label="${escapeHtml(getTranslation("activities.weekTitle"))}">
      <div class="timetable-row timetable-head" role="row">
        ${activitiesDays
          .map((day, index) => {
            const dayDate = addDaysToIso(activitiesState.selectedWeekStart, index);
            return `
              <div class="timetable-day-head" role="columnheader">
                <strong>${escapeHtml(getTranslation(`activities.day.${day.key}`))}</strong>
                <small>${escapeHtml(formatActivityDate(dayDate))}</small>
              </div>
            `;
          })
          .join("")}
      </div>
      ${scheduleRows
        .map((row) => {
          const { period } = row;
          const [start, end] = period;
          const currentPeriodKey = periodKey(period);
          const periodRow = `
            <div class="timetable-row" role="row">
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
          return periodRow;
        })
        .join("")}
    </div>
  `;
  refreshIcons();
  if (window.CENTRAL_USER_PROFILE) {
    applyCentralPermissionsToPage(window.CENTRAL_USER_PROFILE);
  }
};

const renderActivitiesHistoryPage = async () => {
  const root = document.querySelector("[data-activities-history]");
  if (!root) return;
  let entries = [];
  try {
    entries = await loadActivitiesHistory();
  } catch (error) {
    console.warn("Nao foi possivel carregar historico de atividades.", error);
    entries = readActivitiesHistoryFromStorage();
  }
  if (!entries.length) {
    root.innerHTML = `<p class="activity-empty-state">${escapeHtml(getTranslation("activities.historyEmpty"))}</p>`;
    return;
  }
  root.innerHTML = `
    <div class="activity-history-table-wrap">
      <table class="activity-history-table">
        <thead>
          <tr>
            <th>${escapeHtml(getTranslation("activities.historyWhen"))}</th>
            <th>${escapeHtml(getTranslation("activities.historyAction"))}</th>
            <th>${escapeHtml(getTranslation("activities.historyActivity"))}</th>
            <th>${escapeHtml(getTranslation("activities.historyDetails"))}</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map(
              (entry) => `
                <tr>
                  <td>${escapeHtml(formatActivityDateTime(entry.at))}</td>
                  <td><strong>${escapeHtml(activityHistoryActionLabel(entry.action))}</strong></td>
                  <td>${escapeHtml(entry.title || "-")}</td>
                  <td>${escapeHtml(activityHistoryDetails(entry) || "-")}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
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

const saveActivityEntryRemote = async (entry) => {
  if (activitiesState.storageMode !== "remote") throw new Error(getTranslation("activities.localOnly"));
  const client = createActivitiesClient();
  if (!client) throw new Error(getTranslation("activities.localOnly"));
  const { data, error } = await client
    .from(activitiesScheduleTableName)
    .upsert(activityEntryToRow(entry), { onConflict: "id" })
    .select("id,week_start,day,start_time,end_time,title,teacher,sort_order")
    .single();
  if (error) throw error;
  return activityEntryFromRow(data, entry.order) || entry;
};

const deleteActivityEntryRemote = async (id) => {
  if (activitiesState.storageMode !== "remote") throw new Error(getTranslation("activities.localOnly"));
  const client = createActivitiesClient();
  if (!client) throw new Error(getTranslation("activities.localOnly"));
  const { error } = await client.from(activitiesScheduleTableName).delete().eq("id", id);
  if (error) throw error;
};

const saveActivityOrderRemote = async (entries) => {
  if (activitiesState.storageMode !== "remote") throw new Error(getTranslation("activities.localOnly"));
  const client = createActivitiesClient();
  if (!client) throw new Error(getTranslation("activities.localOnly"));
  if (!entries.length) return;
  const { error } = await client
    .from(activitiesScheduleTableName)
    .upsert(entries.map(activityEntryToRow), { onConflict: "id" });
  if (error) throw error;
};

const upsertActivityEntriesRemote = async (entries) => {
  if (activitiesState.storageMode !== "remote") throw new Error(getTranslation("activities.localOnly"));
  const client = createActivitiesClient();
  if (!client) throw new Error(getTranslation("activities.localOnly"));
  const validEntries = entries.filter(Boolean);
  if (!validEntries.length) return [];
  const { data, error } = await client
    .from(activitiesScheduleTableName)
    .upsert(validEntries.map(activityEntryToRow), { onConflict: "id" })
    .select("id,week_start,day,start_time,end_time,title,teacher,sort_order");
  if (error) throw error;
  return Array.isArray(data)
    ? data.map((row, index) => activityEntryFromRow(row, validEntries[index]?.order || index)).filter(Boolean)
    : validEntries;
};

const mergeActivityEntries = (entries) => {
  const savedIds = new Set(entries.map((entry) => entry.id));
  activitiesState.entries = [
    ...activitiesState.entries.filter((entry) => !savedIds.has(entry.id)),
    ...entries,
  ];
  saveActivities();
};

const rememberActivityListsRemote = async (entry) => {
  await Promise.allSettled([
    ensureActivityNameRemote(entry.title),
    ...splitActivityMonitors(entry.teacher).map((monitor) => ensureActivityMonitorRemote(monitor)),
  ]);
};

const ensureDefaultLunchForSelectedWeek = async () => {
  const { root } = activitiesElements();
  const weekStart = activitiesState.selectedWeekStart;
  if (!root || activitiesState.storageMode !== "remote" || !canEditActivities()) return false;
  if (activitiesState.defaultLunchPendingWeeks.has(weekStart)) return false;
  const missingDays = activitiesDays.filter(
    (day) =>
      !activitiesState.entries.some(
        (entry) => entry.weekStart === weekStart && entry.day === day.key && isDefaultLunchEntry(entry),
      ),
  );
  if (!missingDays.length) return false;

  activitiesState.defaultLunchPendingWeeks.add(weekStart);
  try {
    await Promise.allSettled([
      ensureActivityNameRemote(defaultLunchTitle),
      ensureActivityMonitorRemote(defaultLunchMonitorName),
    ]);
    const entries = missingDays
      .map((day) => {
        const entry = normalizeActivityEntry({
          id: activityId(),
          weekStart,
          day: day.key,
          start: defaultLunchStart,
          end: defaultLunchEnd,
          title: defaultLunchTitle,
          teacher: defaultLunchMonitorName,
        });
        if (entry) entry.order = nextActivityOrderForCell(entry);
        return entry;
      })
      .filter(Boolean);
    const savedEntries = await upsertActivityEntriesRemote(entries);
    mergeActivityEntries(savedEntries);
    savedEntries.forEach((entry) => recordActivityHistory("created", entry));
    renderActivitiesCalendar();
    return true;
  } catch (error) {
    console.warn("Nao foi possivel criar o almoco predefinido.", error);
    return false;
  } finally {
    activitiesState.defaultLunchPendingWeeks.delete(weekStart);
  }
};

const copyPreviousWeekActivities = async (button) => {
  if (!canEditActivities()) {
    showCentralRestrictedAccess(getTranslation("access.actionRestricted"));
    return;
  }
  if (activitiesState.storageMode !== "remote") {
    setActivitiesFeedback(getTranslation("activities.localOnly"));
    return;
  }
  const previousWeekStart = weekStartIso(addDaysToIso(activitiesState.selectedWeekStart, -7));
  const previousEntries = sortActivityEntries(
    activitiesState.entries.filter((entry) => entry.weekStart === previousWeekStart),
  );
  if (!previousEntries.length) {
    setActivitiesFeedback(getTranslation("activities.copyEmpty"));
    return;
  }

  if (button) button.disabled = true;
  try {
    await Promise.allSettled([
      ensureActivityNameRemote(defaultLunchTitle),
      ensureActivityMonitorRemote(defaultLunchMonitorName),
      ...previousEntries.map((entry) => rememberActivityListsRemote(entry)),
    ]);
    const entriesToSave = [];
    previousEntries.forEach((sourceEntry) => {
      const candidate = normalizeActivityEntry(
        {
          ...sourceEntry,
          id: activityId(),
          weekStart: activitiesState.selectedWeekStart,
        },
        activitiesState.selectedWeekStart,
        sourceEntry.order,
      );
      if (!candidate) return;
      const existing = activitiesState.entries.find((entry) => sameActivityScheduleSlot(entry, candidate));
      if (existing) {
        if (isDefaultLunchPlaceholder(existing) && isDefaultLunchEntry(candidate)) {
          entriesToSave.push({
            ...existing,
            teacher: candidate.teacher,
            order: Number(sourceEntry.order) || existing.order,
          });
        }
        return;
      }
      candidate.order = nextActivityOrderForCell(candidate);
      entriesToSave.push(candidate);
    });

    if (!entriesToSave.length) {
      setActivitiesFeedback(getTranslation("activities.copyNoChanges"));
      return;
    }
    const savedEntries = await upsertActivityEntriesRemote(entriesToSave);
    mergeActivityEntries(savedEntries);
    savedEntries.forEach((entry) => recordActivityHistory("created", entry));
    renderActivitiesCalendar();
    setActivitiesFeedback(getTranslation("activities.copied"), "success");
  } catch (error) {
    console.warn("Erro ao copiar semana anterior.", error);
    setActivitiesFeedback(getTranslation("activities.saveError"));
  } finally {
    if (button) button.disabled = false;
  }
};

const handleActivitySubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const primaryMonitor = String(data.get("teacher") || "").trim();
  const secondaryMonitor = String(data.get("teacher2") || "").trim();
  if (secondaryMonitor && primaryMonitor === secondaryMonitor) {
    setActivitiesFeedback(getTranslation("activities.validationDuplicateMonitors"));
    return;
  }
  const payload = {
    id: String(data.get("id") || "").trim(),
    weekStart: activitiesState.selectedWeekStart,
    day: String(data.get("day") || "monday"),
    start: String(data.get("start") || "").trim(),
    end: String(data.get("end") || "").trim(),
    title: String(data.get("title") || "").trim(),
    teacher: joinActivityMonitors(primaryMonitor, secondaryMonitor),
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
  if (submitButton) submitButton.disabled = true;
  try {
    const savedEntry = await saveActivityEntryRemote(entry);
    await rememberActivityListsRemote(savedEntry);
    if (existingIndex >= 0) {
      activitiesState.entries.splice(existingIndex, 1, savedEntry);
    } else {
      activitiesState.entries.push(savedEntry);
    }
    saveActivities();
    recordActivityHistory(existingIndex >= 0 ? "updated" : "created", savedEntry);
    resetActivitiesForm();
    setActivityFormOpen(false);
    renderActivitiesCalendar();
    if (activitiesState.storageMode === "remote") {
      setActivitiesFeedback(getTranslation("activities.saved"), "success");
    } else {
      setActivitiesFeedback(getTranslation("activities.localOnly"));
    }
  } catch (error) {
    console.warn("Erro ao guardar atividade.", error);
    setActivitiesFeedback(getTranslation("activities.saveError"));
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
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
  setActivitySelectValue(form.elements.title, entry.title);
  const [primaryMonitor = "", secondaryMonitor = ""] = splitActivityMonitors(entry.teacher);
  setActivitySelectValue(form.elements.teacher, primaryMonitor);
  if (form.elements.teacher2) {
    setActivitySelectValue(form.elements.teacher2, secondaryMonitor);
  }
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

const deleteActivity = async (id) => {
  const entry = activitiesState.entries.find((item) => item.id === id);
  if (!entry) return;
  if (!window.confirm(getTranslation("activities.confirmDelete"))) return;
  try {
    await deleteActivityEntryRemote(id);
    activitiesState.entries = activitiesState.entries.filter((item) => item.id !== id);
    saveActivities();
    recordActivityHistory("deleted", entry);
    renderActivitiesCalendar();
    if (activitiesState.storageMode === "remote") {
      setActivitiesFeedback(getTranslation("activities.deleted"), "success");
    } else {
      setActivitiesFeedback(getTranslation("activities.localOnly"));
    }
  } catch (error) {
    console.warn("Erro ao remover atividade.", error);
    setActivitiesFeedback(getTranslation("activities.saveError"));
  }
};

const activityPrintDocument = () => {
  const entries = sortedActivities();
  const scheduleRows = activityScheduleRows(entries);
  const dayHeaders = activitiesDays
    .map((day, index) => {
      const dayDate = addDaysToIso(activitiesState.selectedWeekStart, index);
      return `<th><strong>${escapeHtml(getTranslation(`activities.day.${day.key}`))}</strong><small>${escapeHtml(formatActivityDate(dayDate))}</small></th>`;
    })
    .join("");
  const rows = scheduleRows
    .map((row) => {
      const { period } = row;
      const currentPeriodKey = periodKey(period);
      let maxCellEntries = 0;
      const cells = activitiesDays
        .map((day) => {
          const cellEntries = entries.filter(
            (entry) => entry.day === day.key && periodKey(activityDisplayPeriod(entry)) === currentPeriodKey,
          );
          maxCellEntries = Math.max(maxCellEntries, cellEntries.length);
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
      const rowHeightMm = Math.max(34, Math.min(66, 22 + Math.max(1, maxCellEntries) * 14));
      const periodRow = `<tr class="activity-row" style="height:${rowHeightMm}mm">${cells}</tr>`;
      return periodRow;
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
    html, body { margin: 0; min-height: 210mm; padding: 0; width: 297mm; }
    body {
      background: #ffffff;
      color: #081614;
      font-family: Arial, sans-serif;
      font-size: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body::before,
    body::after {
      background: #ffffff;
      content: "";
      left: 0;
      pointer-events: none;
      position: fixed;
      right: 0;
      z-index: 9999;
    }
    body::before { height: 8mm; top: 0; }
    body::after { bottom: 0; height: 7mm; }
    .print-sheet {
      display: flex;
      flex-direction: column;
      gap: 2.5mm;
      min-height: 210mm;
      padding: 7mm 9mm 6mm;
      width: 100%;
    }
    header {
      align-items: end;
      border-bottom: 2px solid #23776b;
      display: flex;
      flex: 0 0 auto;
      justify-content: space-between;
      padding-bottom: 1.6mm;
    }
    h1 { font-size: 17px; line-height: 1.05; margin: 0; }
    p { color: #506560; font-size: 10px; font-weight: 800; margin: 0; }
    table {
      border: 1.8px solid #7fa39b;
      border-collapse: separate;
      border-spacing: 0;
      flex: 0 0 auto;
      table-layout: fixed;
      width: 100%;
    }
    th, td { border: 0; border-bottom: 1.4px solid #8fb2ab; border-right: 1.4px solid #8fb2ab; padding: 1.6mm; vertical-align: top; }
    th:last-child, td:last-child { border-right: 0; }
    tbody tr:last-child td { border-bottom: 0; }
    thead { display: table-header-group; }
    thead tr { height: 12mm; }
    thead th { background: #eef5f3; border-bottom: 1.8px solid #7fa39b; padding: 1.2mm 1.6mm; text-align: center; vertical-align: middle; }
    tbody tr.activity-row { break-inside: avoid; page-break-inside: avoid; }
    th strong, th small { display: block; }
    th strong { font-size: 10px; line-height: 1.1; text-transform: uppercase; }
    th small { color: #506560; font-size: 8px; font-weight: 700; margin-top: 0.5mm; }
    td { background: #ffffff; }
    .activity-list { display: grid; gap: 1.3mm; }
    article { border: 1px solid #c8d8d4; border-left: 3px solid #23776b; border-radius: 2mm; break-inside: avoid; padding: 1.2mm 1.6mm; }
    article strong, article span, article small { display: block; overflow-wrap: anywhere; }
    article strong { color: #005f56; font-size: 10px; line-height: 1.15; }
    article span { font-size: 11px; font-weight: 800; line-height: 1.2; margin-top: 0.8mm; }
    article small { color: #506560; font-size: 9px; font-weight: 700; line-height: 1.15; margin-top: 0.8mm; }
  </style>
</head>
<body>
  <main class="print-sheet">
    <header>
      <h1>${escapeHtml(getTranslation("activities.printScheduleTitle"))}</h1>
      <p>${escapeHtml(activityWeekRangeText())}</p>
    </header>
    <table>
      <colgroup>${activitiesDays.map(() => "<col>").join("")}</colgroup>
      <thead><tr>${dayHeaders}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
};

const activitySummaryPrintDocument = (entry) => {
  const { summaryForm } = activitiesElements();
  const attendance = currentActivitySummaryAttendance();
  const summaryText = String(summaryForm?.elements.summary?.value || "").trim();
  const activityDate = activityDateForEntry(entry);
  const attendanceContent = attendance.length
    ? `<ul>${attendance.map((utente) => `<li>${escapeHtml(utente.name)}</li>`).join("")}</ul>`
    : `<p class="empty">${escapeHtml(getTranslation("activities.summaryNoUtentes"))}</p>`;
  return `<!doctype html>
<html lang="${escapeHtml(getLanguage() === "en" ? "en" : "pt")}">
<head>
  <meta charset="utf-8">
  <title></title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 297mm; padding: 0; width: 210mm; }
    body {
      background: #ffffff;
      color: #081614;
      font-family: Arial, sans-serif;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body::before,
    body::after {
      background: #ffffff;
      content: "";
      left: 0;
      pointer-events: none;
      position: fixed;
      right: 0;
      z-index: 9999;
    }
    body::before { height: 8mm; top: 0; }
    body::after { bottom: 0; height: 7mm; }
    .print-sheet {
      display: grid;
      gap: 7mm;
      padding: 12mm 14mm 10mm;
      width: 100%;
    }
    header {
      border-bottom: 2px solid #23776b;
      display: flex;
      justify-content: space-between;
      gap: 10mm;
      padding-bottom: 3mm;
    }
    h1 { font-size: 22px; line-height: 1.15; margin: 0; }
    .date { color: #506560; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .meta {
      border: 1.4px solid #9bb9b2;
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
    }
    .meta th,
    .meta td {
      border: 1.4px solid #9bb9b2;
      padding: 3mm;
      text-align: left;
      vertical-align: top;
    }
    .meta th {
      background: #eef5f3;
      color: #506560;
      font-size: 10px;
      text-transform: uppercase;
    }
    .meta td {
      font-size: 14px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }
    section { display: grid; gap: 2mm; }
    h2 {
      color: #005f56;
      font-size: 15px;
      margin: 0;
    }
    .summary-box {
      border: 1.4px solid #9bb9b2;
      border-radius: 2mm;
      min-height: 52mm;
      padding: 4mm;
      white-space: pre-wrap;
    }
    ul {
      border: 1.4px solid #9bb9b2;
      border-radius: 2mm;
      columns: 2;
      list-style-position: inside;
      margin: 0;
      padding: 4mm;
    }
    li { break-inside: avoid; font-size: 12px; margin-bottom: 1.5mm; }
    .empty {
      border: 1.4px solid #9bb9b2;
      border-radius: 2mm;
      color: #506560;
      margin: 0;
      padding: 4mm;
    }
  </style>
</head>
<body>
  <main class="print-sheet">
    <header>
      <h1>${escapeHtml(getTranslation("activities.summaryTitle"))}</h1>
      <p class="date">${escapeHtml(formatActivityDate(activityDate))}</p>
    </header>
    <table class="meta">
      <thead>
        <tr>
          <th>${escapeHtml(getTranslation("activities.name"))}</th>
          <th>${escapeHtml(getTranslation("activities.summaryStart"))}</th>
          <th>${escapeHtml(getTranslation("activities.summaryEnd"))}</th>
          <th>${escapeHtml(getTranslation("activities.summaryDuration"))}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(entry.title)}</td>
          <td>${escapeHtml(entry.start)}</td>
          <td>${escapeHtml(entry.end || "-")}</td>
          <td>${escapeHtml(activityDurationText(activityDurationMinutes(entry)))}</td>
        </tr>
      </tbody>
    </table>
    <section>
      <h2>${escapeHtml(getTranslation("activities.summaryText"))}</h2>
      <div class="summary-box">${escapeHtml(summaryText || "-")}</div>
    </section>
    <section>
      <h2>${escapeHtml(getTranslation("activities.summaryAttendance"))}</h2>
      ${attendanceContent}
    </section>
  </main>
</body>
</html>`;
};

const printActivityHtmlDocument = (html, title = getTranslation("activities.printTitle")) => {
  const printFrame = document.createElement("iframe");
  printFrame.title = title;
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
  frameDocument.write(html);
  frameDocument.close();
  frameWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 10000);
  }, 150);
};

const printActivityWeek = () => {
  recordActivityHistory("printed", {
    title: activityWeekRangeText(),
    weekStart: activitiesState.selectedWeekStart,
  });
  printActivityHtmlDocument(activityPrintDocument(), getTranslation("activities.printTitle"));
};

const printActivitySummary = () => {
  const entry = selectedActivitySummaryEntry();
  if (!entry) {
    setActivitySummaryFeedback(getTranslation("activities.summaryNoActivity"));
    return;
  }
  recordActivityHistory("summary_printed", entry);
  printActivityHtmlDocument(activitySummaryPrintDocument(entry), getTranslation("activities.summaryTitle"));
};

const changeActivityWeek = (weekOffset) => {
  const nextWeek = addDaysToIso(activitiesState.selectedWeekStart, weekOffset * 7);
  activitiesState.selectedWeekStart = weekStartIso(nextWeek);
  resetActivitiesForm();
  setActivityFormOpen(false);
  closeActivitySummaryDialog();
  renderActivitiesCalendar();
  void ensureDefaultLunchForSelectedWeek();
};

const reorderActivitiesInCell = async (draggedId, targetCellKey, insertionIndex = Number.POSITIVE_INFINITY) => {
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
  const previousOrders = new Map(activitiesState.entries.map((entry) => [entry.id, entry.order]));
  previewOrder.forEach((entry, index) => {
    const source = activitiesState.entries.find((item) => item.id === entry.id);
    if (source) source.order = index;
  });
  try {
    await saveActivityOrderRemote(previewOrder);
    saveActivities();
    renderActivitiesCalendar();
    return true;
  } catch (error) {
    console.warn("Erro ao reordenar atividade.", error);
    activitiesState.entries.forEach((entry) => {
      if (previousOrders.has(entry.id)) entry.order = previousOrders.get(entry.id);
    });
    renderActivitiesCalendar();
    setActivitiesFeedback(getTranslation("activities.saveError"));
    return false;
  }
};

const wireActivitiesCalendar = () => {
  const {
    root,
    dialog,
    dialogCloseBtn,
    form,
    grid,
    createBtn,
    copyPreviousBtn,
    prevWeekBtn,
    nextWeekBtn,
    clearBtn,
    printBtn,
    statisticsBtn,
    statisticsDialog,
    statisticsCloseBtn,
    statisticsMonthInput,
    statisticsRefreshBtn,
    summaryDialog,
    summaryCloseBtn,
    summaryPrintBtn,
    summaryForm,
    summaryActivitySelect,
    summaryAttendanceList,
    summaryAttendanceSearch,
    summaryClearBtn,
  } = activitiesElements();
  if (!root || !form || !grid) return;
  window.__CENTRAL_RENDER_ACTIVITIES = () => {
    setActivitiesFormMode(Boolean(form.elements.id.value));
    setActivityFormOpen(isActivityFormOpen());
    renderActivitiesCalendar();
  };
  activitiesState.entries = [];
  activitiesState.history = [];
  resetActivitiesForm();
  setActivityFormOpen(false);
  renderActivitiesCalendar();
  void loadActivities()
    .catch((error) => {
      activitiesState.entries = [];
      markActivitiesRemoteUnavailable(error);
    })
    .finally(() => {
      renderActivitiesCalendar();
      void ensureDefaultLunchForSelectedWeek();
    });
  void refreshActivityOptionLists();
  window.addEventListener("central-permissions-ready", () => {
    void ensureDefaultLunchForSelectedWeek();
  });
  form.addEventListener("submit", handleActivitySubmit);
  createBtn?.addEventListener("click", () => {
    const shouldOpen = !isActivityFormOpen();
    if (shouldOpen) {
      resetActivitiesForm();
      void refreshActivityOptionLists();
    }
    setActivityFormOpen(shouldOpen);
    if (shouldOpen) {
      form.elements.title.focus();
    }
  });
  prevWeekBtn?.addEventListener("click", () => changeActivityWeek(-1));
  nextWeekBtn?.addEventListener("click", () => changeActivityWeek(1));
  copyPreviousBtn?.addEventListener("click", () => {
    void copyPreviousWeekActivities(copyPreviousBtn);
  });
  clearBtn?.addEventListener("click", resetActivitiesForm);
  printBtn?.addEventListener("click", printActivityWeek);
  statisticsBtn?.addEventListener("click", openActivityStatisticsDialog);
  statisticsCloseBtn?.addEventListener("click", closeActivityStatisticsDialog);
  statisticsRefreshBtn?.addEventListener("click", () => {
    void loadActivityStatistics();
  });
  statisticsMonthInput?.addEventListener("change", () => {
    void loadActivityStatistics();
  });
  statisticsDialog?.addEventListener("click", (event) => {
    if (event.target === statisticsDialog) closeActivityStatisticsDialog();
  });
  statisticsDialog?.addEventListener("close", () => {
    setActivityStatisticsFeedback("");
  });
  summaryCloseBtn?.addEventListener("click", closeActivitySummaryDialog);
  summaryPrintBtn?.addEventListener("click", printActivitySummary);
  summaryForm?.addEventListener("submit", handleActivitySummarySubmit);
  summaryActivitySelect?.addEventListener("change", () => {
    fillActivitySummaryForm(selectedActivitySummaryEntry());
    setActivitySummaryFeedback("");
  });
  summaryAttendanceSearch?.addEventListener("input", () => {
    renderActivitySummaryAttendance();
  });
  summaryAttendanceList?.addEventListener("change", (event) => {
    const input = event.target instanceof HTMLInputElement ? event.target : event.target?.closest?.("input[type='checkbox']");
    if (!input || input.type !== "checkbox") return;
    if (input.checked) {
      activitiesState.summaryAttendanceIds.add(input.value);
    } else {
      activitiesState.summaryAttendanceIds.delete(input.value);
    }
  });
  summaryClearBtn?.addEventListener("click", clearActivitySummaryForm);
  summaryDialog?.addEventListener("click", (event) => {
    if (event.target === summaryDialog) closeActivitySummaryDialog();
  });
  summaryDialog?.addEventListener("cancel", () => {
    activitiesState.summaryAttendanceIds = new Set();
  });
  summaryDialog?.addEventListener("close", () => {
    summaryForm?.reset();
    if (summaryAttendanceSearch) summaryAttendanceSearch.value = "";
    activitiesState.summaryAttendanceIds = new Set();
    setActivitySummaryFeedback("");
  });
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
    if (button.dataset.activityAction === "summary") {
      void openActivitySummaryDialog(id);
      return;
    }
    if (button.dataset.activityAction === "delete") {
      void deleteActivity(id);
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
  grid.addEventListener("drop", async (event) => {
    const target = eventElement(event);
    const cell = target?.closest(".timetable-cell");
    if (!cell) return;
    const draggedId = activitiesState.draggedActivityId || event.dataTransfer.getData("text/plain");
    const draggedEntry = activitiesState.entries.find((entry) => entry.id === draggedId);
    if (!draggedEntry || activityCellKey(draggedEntry) !== activityCellKeyFromElement(cell)) return;
    event.preventDefault();
    const changed = await reorderActivitiesInCell(draggedId, activityCellKeyFromElement(cell), activityDropIndexFromEvent(event, cell));
    if (changed) {
      recordActivityHistory("reordered", draggedEntry);
      setActivitiesFeedback(activitiesState.storageMode === "remote" ? "" : getTranslation("activities.localOnly"));
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
  elements.editActive.checked = Boolean(user.active);
  renderPermissionGrid(elements.editPermissions, "edit", normalizeCentralPermissions(user.permissions));
  elements.editHint.textContent = `${getTranslation("users.editTitle")}: ${user.full_name || user.email || user.id}`;
  showCentralFormError(elements.editError, "");
};

const validateCentralUser = ({ id, email, fullName, password, requirePassword = false }) => {
  if (id !== undefined && !id) return "Escolha primeiro um utilizador para editar.";
  if (!fullName && fullName !== undefined) return "Indique o nome do utilizador.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { return "Indique um email válido.";}
  if (requirePassword && (!password || !isStrongPassword(password))) return passwordPolicyMessage;
  return "";
};

const handleCentralCreateUser = async (event) => {
  event.preventDefault();
  const elements = centralUsersElements();
  const form = new FormData(event.currentTarget);
  const emailValue = form.get("email");
  const payload = {
    fullName: String(form.get("fullName") || "").trim(),
    email: emailValue && String(emailValue).trim() ? String(emailValue).trim().toLowerCase() : null,
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
  const emailValue = form.get("email");
  const payload = {
    id: String(form.get("id") || "").trim(),
    email: emailValue && String(emailValue).trim() ? String(emailValue).trim().toLowerCase() : null,
    fullName: String(form.get("fullName") || "").trim(),
    active: form.get("active") === "on",
  };
  payload.permissions = collectPermissionGrid("edit");
  const validation = validateCentralUser({
    id: payload.id,
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
  wireActivitiesManualsDialog();
  wireActivitiesCatalogDialog();
  wireActivitiesMonitorsDialog();
  wireActivitiesCalendar();
  void renderActivitiesHistoryPage();
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
    if (
      event.target.closest("[data-tools-menu]") ||
      event.target.closest("[data-menu-toggle]") ||
      event.target.closest(".global-menu-wrap") ||
      event.target.closest(".dashboard-user-menu-wrap")
    ) {
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
