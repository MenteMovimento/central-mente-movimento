(() => {
  const config = window.CENTRAL_CONFIG || {};
  const page = document.body?.dataset.centralPage || "dashboard";
  const authStorageKey = "central-mm-auth-token";
  const rememberLoginKey = "central-remember-login";
  const rememberEmailKey = "central-remember-email";
  const authStorage = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key)
  };
  // Every embedded branch receives the same permissions helper as the Central.
  // A stored matrix is authoritative; only old empty matrices start with full access.
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
    atividades: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: false }
  });
  const permissionBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
  const hasPermissionValue = (permissions, action) => Object.prototype.hasOwnProperty.call(permissions, action);
  const normalizeCentralPermissions = (input) => {
    const source = input && typeof input === "object" ? input : {};
    const hasStoredMatrix =
      Object.keys(source.central || {}).length > 0 ||
      permissionAreas.some((area) => Object.keys(source[area] || {}).length > 0);
    const normalized = hasStoredMatrix ? emptyPermissions() : fullPermissions();

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
      if (area !== "utentes") {
        current.view_sensitive = false;
        current.edit_sensitive = false;
      }
      if (area === "atividades") {
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
      await client.auth.signOut();
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
    error.textContent = message;
    error.hidden = false;
  };
  const setUserEmail = (session) => {
    document.querySelectorAll("[data-user-email]").forEach((node) => {
      node.textContent = session?.user?.user_metadata?.full_name || session?.user?.email || "Administrador";
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
          throw new Error(payload.error || "Não foi possível preparar o acesso.");
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
  const ensureUtentesSession = async (client) => {
    const { data } = await client.auth.getSession();
    const session = data?.session || null;
    const token = session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    if (hasUtentesSessionCache(session)) return;
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
  const goTo = async (client, target) => {
    const path = safePath(target, "/dashboard");
    await ensureCentralAccess(client, areaFromPath(path));
    if (path.startsWith("/area/utentes")) {
      await ensureUtentesSession(client);
    }
    window.location.replace(path);
  };
  const goToDashboardAfterLogin = async (client) => {
    await goTo(client, "/dashboard");
  };
  const wireUtentesLinks = (client) => {
    document.querySelectorAll('a[href^="/area/utentes"]').forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await goTo(client, link.getAttribute("href") || "/area/utentes/");
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
      clearUtentesSessionCache();
      clearPersistentAuth();
      window.location.replace("/login?next=" + encodeURIComponent(nextPath()));
      return;
    }
    if (page === "login") {
      loadRememberedLogin();
      if (session) {
        try {
          await goToDashboardAfterLogin(client);
          return;
        } catch (_error) {
          await clearCentralSession(client);
          showError("Sessão expirada. Volte a entrar.");
        }
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
        document.querySelector("#centralAuthError").hidden = true;
        await clearCentralSession(client);
        const { error } = await client.auth.signInWithPassword({ email, password });
        submit.disabled = false;
        if (error) {
          showError("Credenciais inválidas ou utilizador sem acesso.");
          return;
        }
        saveRememberedLogin(email, remember);
        try {
          await goToDashboardAfterLogin(client);
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
      await ensureCentralAccess(client, areaFromPath(window.location.pathname));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Não foi possível preparar o acesso.");
    }
    setUserEmail(session);
    wireUtentesLinks(client);
  });
})();