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
    const token = data?.session?.access_token || "";
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
  };
  const goTo = async (client, target) => {
    const path = safePath(target, "/dashboard");
    await ensureCentralAccess(client, areaFromPath(path));
    if (path.startsWith("/area/utentes")) {
      await ensureUtentesSession(client);
    }
    window.location.replace(path);
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
      clearPersistentAuth();
      window.location.replace("/login?next=" + encodeURIComponent(nextPath()));
      return;
    }
    if (page === "login") {
      loadRememberedLogin();
      if (session) {
        try {
          await goTo(client, nextPath());
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
          await goTo(client, nextPath());
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