(() => {
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
  const safePath = () => {
    const path = window.location.pathname + window.location.search + window.location.hash;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/dashboard";
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
      // Continua sem cache se o browser bloquear sessionStorage.
    }
  };
  const utentesSessionCachePrefix = "central-utentes-session:";
  const utentesSessionCacheKey = (session) => `${utentesSessionCachePrefix}${session?.user?.id || "anon"}`;
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
      headers: { Authorization: `Bearer ${token}` }
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
        Authorization: `Bearer ${token}`,
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
})();