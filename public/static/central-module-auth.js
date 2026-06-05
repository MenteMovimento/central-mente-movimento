(() => {
  let fallbackTimer = 0;
  const showPage = () => {
    window.clearTimeout(fallbackTimer);
    document.documentElement.removeAttribute("data-central-auth-pending");
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
  const redirectToCentralLogin = () => {
    showPage();
    window.location.replace("/login?next=" + encodeURIComponent(safePath()));
  };
  fallbackTimer = window.setTimeout(() => {
    if (document.documentElement.dataset.centralAuthPending === "true") {
      redirectToCentralLogin();
    }
  }, 8000);
  const cacheKey = (session) => `central-access:${session?.user?.id || "anon"}`;
  const hasAccessCache = (session) => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(session)) || "{}");
      return cached.ok === true && Number(cached.expiresAt || 0) > Date.now();
    } catch (_error) {
      return false;
    }
  };
  const saveAccessCache = (session) => {
    try {
      const authExpiresAt = Number(session?.expires_at || 0) * 1000;
      const shortCacheExpiresAt = Date.now() + 30 * 60 * 1000;
      const expiresAt = authExpiresAt > 0 ? Math.min(authExpiresAt, shortCacheExpiresAt) : shortCacheExpiresAt;
      sessionStorage.setItem(cacheKey(session), JSON.stringify({ ok: true, expiresAt }));
    } catch (_error) {
      // Continua sem cache se o browser bloquear sessionStorage.
    }
  };
  const ensureAccess = async (session) => {
    if (hasAccessCache(session)) return;
    const token = session?.access_token || "";
    if (!token) throw new Error("Sessão em falta.");
    const response = await fetch("/api/ensure-access", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Sem acesso preparado.");
    saveAccessCache(session);
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
      await ensureAccess(session);
      showPage();
    })
    .catch(() => redirectToCentralLogin());
})();