(() => {
  const API_URL = "/api/socios/query";

  function emptySession() {
    return { data: { session: null }, error: null };
  }

  function sessionFromUser(user) {
    return {
      access_token: "central-local-session",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        data: data.data ?? null,
        error: data.error || { message: data.error || "Pedido recusado pela Central." },
      };
    }
    return { data, error: null };
  }

  class CentralQuery {
    constructor(table) {
      this.table = table;
      this.action = "select";
      this.columns = "*";
      this.payload = null;
      this.filters = [];
      this.orderBy = null;
      this.limitValue = null;
      this.single = false;
      this.onConflict = null;
    }

    select(columns = "*") {
      this.columns = columns;
      if (!this.action) {
        this.action = "select";
      }
      return this;
    }

    insert(payload) {
      this.action = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.action = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    upsert(payload, options = {}) {
      this.action = "upsert";
      this.payload = payload;
      this.onConflict = options.onConflict || null;
      return this;
    }

    eq(column, value) {
      this.filters.push({ column, op: "eq", value });
      return this;
    }

    order(column, options = {}) {
      this.orderBy = {
        column,
        ascending: options.ascending !== false,
      };
      return this;
    }

    limit(value) {
      this.limitValue = value;
      return this;
    }

    maybeSingle() {
      this.single = true;
      return this;
    }

    single() {
      this.single = true;
      return this;
    }

    async execute() {
      const result = await fetchJson(API_URL, {
        method: "POST",
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          columns: this.columns,
          payload: this.payload,
          filters: this.filters,
          order: this.orderBy,
          limit: this.limitValue,
          maybeSingle: this.single,
          onConflict: this.onConflict,
        }),
      });

      if (result.error) {
        return { data: result.data, error: result.error };
      }
      return result.data;
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }
  }

  window.createCentralSociosClient = function createCentralSociosClient() {
    return {
      auth: {
        async getSession() {
          const { data, error } = await fetchJson("/api/session");
          if (error || !data.user) {
            return emptySession();
          }
          return { data: { session: sessionFromUser(data.user) }, error: null };
        },
        onAuthStateChange() {
          return {
            data: {
              subscription: {
                unsubscribe() {},
              },
            },
          };
        },
        async signInWithPassword() {
          return { data: null, error: { message: "Use o login central." } };
        },
        async signOut() {
          window.location.href = "/logout";
          return { error: null };
        },
      },
      from(table) {
        return new CentralQuery(table);
      },
    };
  };
})();
