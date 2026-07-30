(() => {
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
      const match = url.pathname.match(/^\/area\/(socios|utentes|dispositivos|atividades)(?:\/|$)/);
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
    window.history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash);
  };
  const safePath = (value, fallback) => {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
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
  const utentesSessionCacheKey = (session) => `${utentesSessionCachePrefix}${session?.user?.id || "anon"}`;
  const clearUtentesSessionCache = () => {
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(utentesSessionCachePrefix))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch (_error) {
      // Sem impacto quando o browser bloqueia sessionStorage.
    }
  };
  const cacheKey = (session, area = "") => `central-access:${session?.user?.id || "anon"}:${area || "dashboard"}`;
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
            Authorization: `Bearer ${token}`,
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
      headers: { Authorization: `Bearer ${token}` }
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
        verificationCode.value = verificationCode.value.replace(/\D/g, "").slice(0, 8);
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
        const code = String(form.get("code") || "").replace(/\D/g, "");
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
})();