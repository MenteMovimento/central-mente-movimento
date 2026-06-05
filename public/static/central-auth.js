(() => {
  const config = window.CENTRAL_CONFIG || {};
  const page = document.body?.dataset.centralPage || "dashboard";
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
  let accessPromise = null;
  const ensureCentralAccess = async (client) => {
    if (!accessPromise) {
      accessPromise = (async () => {
        const { data } = await client.auth.getSession();
        const session = data?.session || null;
        if (hasAccessCache(session)) return { ok: true };
        const token = session?.access_token || "";
        if (!token) throw new Error("Sessão em falta.");
        const response = await fetch("/api/ensure-access", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Não foi possível preparar o acesso.");
        }
        const payload = await response.json().catch(() => ({ ok: true }));
        saveAccessCache(session);
        return payload;
      })();
    }
    try {
      return await accessPromise;
    } catch (error) {
      accessPromise = null;
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
    await ensureCentralAccess(client);
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
          window.location.href = "/login?next=" + encodeURIComponent(link.getAttribute("href") || "/area/utentes/");
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
      if (session) {
        await goTo(client, nextPath()).catch((error) => {
          showError(error instanceof Error ? error.message : "Não foi possível iniciar Utentes.");
        });
        return;
      }
      document.querySelector("#centralLoginForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const submit = event.currentTarget.querySelector("button[type='submit']");
        submit.disabled = true;
        showError("");
        document.querySelector("#centralAuthError").hidden = true;
        const { error } = await client.auth.signInWithPassword({ email, password });
        submit.disabled = false;
        if (error) {
          showError("Credenciais inválidas ou utilizador sem acesso.");
          return;
        }
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
      await ensureCentralAccess(client);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Não foi possível preparar o acesso.");
    }
    setUserEmail(session);
    wireUtentesLinks(client);
  });
})();