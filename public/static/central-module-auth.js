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
    if (hasAccessCache(session, cacheArea)) return;
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