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
  const permissionAreas = ["socios", "utentes", "dispositivos"];
  const permissionActions = ["view", "edit", "view_sensitive", "edit_sensitive", "export", "delete"];
  const emptyAreaPermissions = () => ({
    view: false, edit: false, view_sensitive: false, edit_sensitive: false, export: false, delete: false
  });
  const emptyPermissions = () => ({
    central: { manage_users: false, view_history: false },
    socios: emptyAreaPermissions(),
    utentes: emptyAreaPermissions(),
    dispositivos: emptyAreaPermissions()
  });
  const fullPermissions = () => ({
    central: { manage_users: true, view_history: true },
    socios: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true },
    utentes: { view: true, edit: true, view_sensitive: true, edit_sensitive: true, export: true, delete: true },
    dispositivos: { view: true, edit: true, view_sensitive: false, edit_sensitive: false, export: true, delete: true }
  });
  const permissionBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
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
        if (Object.prototype.hasOwnProperty.call(sourceArea, action)) {
          normalized[area][action] = permissionBoolean(sourceArea[action]);
        }
      });
      const current = normalized[area];
      if (current.edit) current.view = true;
      if (current.export) current.view = true;
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
      if (area !== "utentes") {
        current.view_sensitive = false;
        current.edit_sensitive = false;
      }
    });
    return normalized;
  };
  const hasCentralPermission = (profile, area, action) => {
    const permissions = normalizeCentralPermissions(profile?.permissions);
    return Boolean(permissions[area]?.[action]);
  };
  const applyCentralPermissionsToPage = (profile) => {
    const effectiveProfile = profile ? { ...profile, permissions: normalizeCentralPermissions(profile.permissions) } : profile;
    window.CENTRAL_USER_PROFILE = effectiveProfile;
    window.dispatchEvent(new CustomEvent("central-permissions-ready", { detail: effectiveProfile }));
    return effectiveProfile;
  };
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
    if (!response.ok) throw new Error("Sem acesso preparado.");
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
      window.clearTimeout(loginTimer);
      showPage();
    })
    .catch(() => redirectToDashboard());
})();