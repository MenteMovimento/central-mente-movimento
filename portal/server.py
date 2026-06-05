# -*- coding: utf-8 -*-
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import http.client
from urllib.parse import parse_qs
from urllib.parse import quote
from urllib.parse import unquote
import hashlib
import hmac
import html
import json
import mimetypes
import os
import secrets
import sqlite3
import time
import uuid
from datetime import datetime, timedelta, timezone


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_DIR = BASE_DIR / "templates"
MODULES_DIR = BASE_DIR / "modules"
SOCIOS_MODULE_DIR = MODULES_DIR / "socios"
UTENTES_MODULE_DIR = MODULES_DIR / "utentes"
UTENTES_DB_PATH = UTENTES_MODULE_DIR / "utentes.db"
DB_PATH = ROOT_DIR / ".runtime" / "central.db"
UTENTES_PORT = int(os.environ.get("UTENTES_INTERNAL_PORT", "8091"))
DISPOSITIVOS_PORT = int(os.environ.get("DISPOSITIVOS_INTERNAL_PORT", "8092"))

CENTRAL_EMAIL = os.environ.get("CENTRAL_EMAIL", "admin@mentemovimento.local")
CENTRAL_PASSWORD = os.environ.get("CENTRAL_PASSWORD", "admin123")
SESSION_COOKIE = "central_session"
SESSION_SECONDS = 12 * 60 * 60

MODULES = [
    {
        "id": "socios",
        "name": "Gestão de Sócios",
        "label": "Sócios",
        "path": "/area/socios",
        "schema": "socios",
        "icon": "id-card",
        "accent": "green",
        "detail": "Base de sócios",
        "table": "members",
    },
    {
        "id": "utentes",
        "name": "Gestão de Utentes",
        "label": "Utentes",
        "path": "/area/utentes",
        "schema": "utentes",
        "icon": "heart-handshake",
        "accent": "blue",
        "detail": "Base de utentes",
        "table": "utentes",
    },
    {
        "id": "dispositivos",
        "name": "Gestão de Dispositivos",
        "label": "Dispositivos",
        "path": "/area/dispositivos",
        "schema": "dispositivos",
        "icon": "monitor-cog",
        "accent": "amber",
        "detail": "Base de dispositivos",
        "table": "devices",
    },
]

SESSIONS = {}


def now():
    return int(time.time())


def cleanup_sessions():
    expired = []
    for token, session in SESSIONS.items():
        expiry = session.get("expiry", 0) if isinstance(session, dict) else session
        if expiry <= now():
            expired.append(token)
    for token in expired:
        SESSIONS.pop(token, None)


def create_session(user):
    cleanup_sessions()
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {
        "expiry": now() + SESSION_SECONDS,
        "user": {
            "id": user["id"],
            "email": user["email"],
        },
    }
    return token


def get_template(name):
    return (TEMPLATE_DIR / name).read_text(encoding="utf-8")


def render_template(name, **values):
    output = get_template(name)
    for key, value in values.items():
        output = output.replace("{{" + key + "}}", str(value))
    return output


def safe_next_path(value):
    if not value:
        return "/"
    value = unquote(value)
    if not value.startswith("/") or value.startswith("//") or "\\" in value:
        return "/"
    return value


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return salt, digest.hex()


def verify_password(password, salt, digest):
    _salt, candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, digest or "")


def db_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


MEMBER_COLUMNS = [
    "id",
    "member_number",
    "approval_minute_number",
    "admission_date",
    "quota_paid_until",
    "quota_paid_at",
    "name",
    "address",
    "postal_code",
    "locality",
    "id_number",
    "tax_number",
    "profession",
    "birth_date",
    "phone",
    "email",
    "notes",
    "created_at",
    "updated_at",
]

APP_USER_COLUMNS = ["id", "email", "full_name", "role", "active", "created_at", "updated_at"]
AUDIT_COLUMNS = ["id", "member_id", "action", "changed_at", "changed_by", "old_data", "new_data"]
LOCAL_AUTH_COLUMNS = ["user_id", "email", "password_hash", "salt", "created_at", "updated_at"]

TABLE_COLUMNS = {
    "members": MEMBER_COLUMNS,
    "app_users": APP_USER_COLUMNS,
    "member_audit_log": AUDIT_COLUMNS,
    "local_auth_credentials": LOCAL_AUTH_COLUMNS,
}


def init_database():
    with db_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS app_users (
              id TEXT PRIMARY KEY,
              email TEXT NOT NULL UNIQUE,
              full_name TEXT,
              role TEXT NOT NULL DEFAULT 'viewer',
              active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS local_auth_credentials (
              user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              salt TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS members (
              id TEXT PRIMARY KEY,
              member_number TEXT UNIQUE,
              approval_minute_number TEXT,
              admission_date TEXT,
              quota_paid_until TEXT,
              quota_paid_at TEXT,
              name TEXT NOT NULL,
              address TEXT,
              postal_code TEXT,
              locality TEXT,
              id_number TEXT,
              tax_number TEXT,
              profession TEXT,
              birth_date TEXT,
              phone TEXT,
              email TEXT,
              notes TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS member_audit_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              member_id TEXT,
              action TEXT NOT NULL,
              changed_at TEXT NOT NULL,
              changed_by TEXT,
              old_data TEXT,
              new_data TEXT
            );
            """
        )
        now_iso = utc_now()
        connection.execute(
            """
            INSERT INTO app_users (id, email, full_name, role, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              email = excluded.email,
              role = excluded.role,
              active = 1,
              updated_at = excluded.updated_at
            """,
            ("central-admin", CENTRAL_EMAIL, "Administrador", "admin", 1, now_iso, now_iso),
        )


def row_to_dict(table, row):
    data = {key: row[key] for key in row.keys()}
    if table == "app_users":
        data["active"] = bool(data.get("active"))
    if table == "member_audit_log":
        for key in ("old_data", "new_data"):
            value = data.get(key)
            if isinstance(value, str) and value:
                try:
                    data[key] = json.loads(value)
                except json.JSONDecodeError:
                    data[key] = {}
            elif not value:
                data[key] = None
    return data


def public_user(user):
    return {"id": user["id"], "email": user["email"]}


def authenticate_user(email, password):
    init_database()
    if hmac.compare_digest(email.lower(), CENTRAL_EMAIL.lower()) and hmac.compare_digest(password, CENTRAL_PASSWORD):
        return {"id": "central-admin", "email": CENTRAL_EMAIL}

    with db_connection() as connection:
        row = connection.execute(
            """
            SELECT c.user_id, c.email, c.password_hash, c.salt, u.active
            FROM local_auth_credentials c
            JOIN app_users u ON u.id = c.user_id
            WHERE lower(c.email) = lower(?)
            """,
            (email,),
        ).fetchone()

    if not row or not row["active"]:
        return None
    if not verify_password(password, row["salt"], row["password_hash"]):
        return None
    return {"id": row["user_id"], "email": row["email"]}


def table_columns(table):
    if table not in TABLE_COLUMNS or table == "local_auth_credentials":
        raise ValueError("Tabela nao permitida.")
    return TABLE_COLUMNS[table]


def checked_column(table, column):
    if column not in table_columns(table):
        raise ValueError(f"Coluna nao permitida: {column}")
    return column


def build_where(table, filters):
    clauses = []
    params = []
    for item in filters or []:
        column = checked_column(table, str(item.get("column", "")))
        operator = item.get("op", "eq")
        if operator != "eq":
            raise ValueError("Filtro nao permitido.")
        clauses.append(f"{column} = ?")
        params.append(item.get("value"))
    return (" WHERE " + " AND ".join(clauses) if clauses else ""), params


def normalize_payload(table, payload, existing=None):
    now_iso = utc_now()
    data = {}
    for key, value in (payload or {}).items():
        if key in table_columns(table):
            data[key] = value

    if table == "app_users" and "active" in data:
        data["active"] = 1 if data["active"] else 0

    if table in ("members", "app_users"):
        if not data.get("id"):
            data["id"] = existing["id"] if existing else str(uuid.uuid4())
        if not existing and "created_at" in table_columns(table):
            data["created_at"] = now_iso
        data["updated_at"] = now_iso

    return data


def insert_row(connection, table, payload):
    data = normalize_payload(table, payload)
    if table == "members" and not data.get("name"):
        raise ValueError("O nome do socio e obrigatorio.")
    if table == "app_users" and not data.get("email"):
        raise ValueError("O email e obrigatorio.")

    columns = list(data.keys())
    placeholders = ", ".join(["?"] * len(columns))
    connection.execute(
        f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
        [data[column] for column in columns],
    )
    return select_one_by_id(connection, table, data["id"])


def select_one_by_id(connection, table, row_id):
    row = connection.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,)).fetchone()
    return row_to_dict(table, row) if row else None


def write_member_audit(connection, member_id, action, old_data, new_data, changed_by):
    connection.execute(
        """
        INSERT INTO member_audit_log (member_id, action, changed_at, changed_by, old_data, new_data)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            member_id,
            action,
            utc_now(),
            changed_by,
            json.dumps(old_data, ensure_ascii=False) if old_data else None,
            json.dumps(new_data, ensure_ascii=False) if new_data else None,
        ),
    )


def execute_socios_query(request, current_user):
    table = str(request.get("table", ""))
    action = str(request.get("action", "select"))
    table_columns(table)

    with db_connection() as connection:
        if action == "select":
            where_sql, params = build_where(table, request.get("filters"))
            sql = f"SELECT * FROM {table}{where_sql}"
            order = request.get("order") or {}
            if order:
                column = checked_column(table, str(order.get("column", "")))
                direction = "ASC" if order.get("ascending", True) else "DESC"
                sql += f" ORDER BY {column} {direction}"
            if request.get("limit") is not None:
                sql += " LIMIT ?"
                params.append(max(0, min(int(request.get("limit") or 0), 500)))
            rows = [row_to_dict(table, row) for row in connection.execute(sql, params).fetchall()]
            data = rows[0] if request.get("maybeSingle") and rows else None if request.get("maybeSingle") else rows
            return {"data": data, "error": None}

        if action == "insert":
            payload = request.get("payload")
            items = payload if isinstance(payload, list) else [payload]
            data = []
            for item in items:
                row = insert_row(connection, table, item or {})
                data.append(row)
                if table == "members":
                    write_member_audit(connection, row["id"], "insert", None, row, current_user["id"])
            return {"data": data, "error": None}

        if action == "update":
            where_sql, params = build_where(table, request.get("filters"))
            rows_before = [row_to_dict(table, row) for row in connection.execute(f"SELECT * FROM {table}{where_sql}", params).fetchall()]
            if not rows_before:
                return {"data": [], "error": None}
            data = normalize_payload(table, request.get("payload") or {}, existing=rows_before[0])
            data.pop("id", None)
            data.pop("created_at", None)
            if data:
                assignments = ", ".join([f"{column} = ?" for column in data.keys()])
                connection.execute(f"UPDATE {table} SET {assignments}{where_sql}", [*data.values(), *params])
            rows_after = [select_one_by_id(connection, table, row["id"]) for row in rows_before]
            if table == "members":
                for old_row, new_row in zip(rows_before, rows_after):
                    write_member_audit(connection, old_row["id"], "update", old_row, new_row, current_user["id"])
            return {"data": rows_after, "error": None}

        if action == "delete":
            where_sql, params = build_where(table, request.get("filters"))
            rows_before = [row_to_dict(table, row) for row in connection.execute(f"SELECT * FROM {table}{where_sql}", params).fetchall()]
            connection.execute(f"DELETE FROM {table}{where_sql}", params)
            if table == "members":
                for row in rows_before:
                    write_member_audit(connection, row["id"], "delete", row, None, current_user["id"])
            return {"data": rows_before, "error": None}

        if action == "upsert":
            payload = request.get("payload")
            items = payload if isinstance(payload, list) else [payload]
            conflict = request.get("onConflict") or "id"
            checked_column(table, conflict)
            data = []
            for item in items:
                item = item or {}
                existing = None
                conflict_value = item.get(conflict)
                if conflict_value is not None:
                    existing_row = connection.execute(f"SELECT * FROM {table} WHERE {conflict} = ?", (conflict_value,)).fetchone()
                    existing = row_to_dict(table, existing_row) if existing_row else None
                if existing:
                    normalized = normalize_payload(table, item, existing=existing)
                    normalized.pop("id", None)
                    normalized.pop("created_at", None)
                    if normalized:
                        assignments = ", ".join([f"{column} = ?" for column in normalized.keys()])
                        connection.execute(f"UPDATE {table} SET {assignments} WHERE id = ?", [*normalized.values(), existing["id"]])
                    row = select_one_by_id(connection, table, existing["id"])
                    if table == "members":
                        write_member_audit(connection, row["id"], "update", existing, row, current_user["id"])
                else:
                    row = insert_row(connection, table, item)
                    if table == "members":
                        write_member_audit(connection, row["id"], "insert", None, row, current_user["id"])
                data.append(row)
            return {"data": data, "error": None}

    raise ValueError("Acao nao permitida.")


UTENTES_SCHEMA_CHECK = """
SELECT name FROM sqlite_master
WHERE type = 'table' AND name IN ('utilizadores', 'sessoes')
"""


def utentes_password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{salt}${digest.hex()}"


def ensure_utentes_session(user, profile=None):
    if not UTENTES_DB_PATH.exists():
        raise RuntimeError("A base local de Utentes ainda nao existe.")

    now_iso = datetime.now().replace(microsecond=0).isoformat(sep=" ")
    expires_iso = (datetime.now() + timedelta(hours=12)).replace(microsecond=0).isoformat(sep=" ")
    email = (user.get("email") or CENTRAL_EMAIL).strip().lower()
    name = (profile or {}).get("full_name") or "Administrador"
    central_role = (profile or {}).get("role") or "admin"
    utentes_role = "Administrador" if central_role == "admin" else "Utilizador"

    with sqlite3.connect(UTENTES_DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        tables = {row["name"] for row in connection.execute(UTENTES_SCHEMA_CHECK).fetchall()}
        if {"utilizadores", "sessoes"} - tables:
            raise RuntimeError("A base local de Utentes ainda nao esta inicializada.")

        row = connection.execute("SELECT * FROM utilizadores WHERE lower(email) = lower(?)", (email,)).fetchone()
        if row:
            user_id = row["id"]
            connection.execute(
                """
                UPDATE utilizadores
                SET ativo = 1, perfil = CASE WHEN ? = 'Administrador' THEN 'Administrador' ELSE perfil END, updated_at = ?
                WHERE id = ?
                """,
                (utentes_role, now_iso, user_id),
            )
        else:
            cursor = connection.execute(
                """
                INSERT INTO utilizadores (nome, email, password_hash, perfil, ativo, tema, idioma, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, 'claro', 'pt', ?, ?)
                """,
                (name, email, utentes_password_hash(secrets.token_urlsafe(18)), utentes_role, now_iso, now_iso),
            )
            user_id = cursor.lastrowid

        token = secrets.token_urlsafe(32)
        connection.execute(
            "INSERT INTO sessoes (token, utilizador_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now_iso, expires_iso),
        )
        connection.execute("DELETE FROM sessoes WHERE expires_at < ?", (now_iso,))
    return token


def prefix_utentes_location(location):
    if not location:
        return location
    if location.startswith("/area/utentes"):
        return location
    if location == "/logout":
        return "/logout"
    if location.startswith("/"):
        return "/area/utentes" + location
    return location


def rewrite_utentes_html(text):
    replacements = {
        'href="/logout"': 'href="/logout"',
        'href="/': 'href="/area/utentes/',
        'action="/': 'action="/area/utentes/',
        'src="/': 'src="/area/utentes/',
        'fetch("/': 'fetch("/area/utentes/',
        ".tab-link[href^='/editar']": ".tab-link[href^='/area/utentes/editar']",
    }
    output = text
    for old, new in replacements.items():
        output = output.replace(old, new)
    output = output.replace('href="/area/utentes/logout"', 'href="/logout"')
    output = output.replace('href="/area/utentes/dashboard"', 'href="/dashboard"')
    output = output.replace('href="/area/utentes/area/socios"', 'href="/area/socios"')
    output = output.replace('href="/area/utentes/area/utentes/"', 'href="/area/utentes/"')
    output = output.replace('href="/area/utentes/area/dispositivos"', 'href="/area/dispositivos"')
    output = output.replace('src="/area/utentes/static/mente-movimento-logo.png"', 'src="/static/mente-movimento-logo.png"')
    return output


def utentes_cookie_header(original_cookie, token):
    cookies = SimpleCookie(original_cookie or "")
    cookies["utentes_session"] = token
    return "; ".join(f"{key}={morsel.value}" for key, morsel in cookies.items())


def with_charset(content_type):
    if content_type.startswith(("text/", "application/javascript")):
        return f"{content_type}; charset=utf-8"
    return content_type


def module_cards():
    cards = []
    for module in MODULES:
        path = html.escape(module["path"], quote=True)
        cards.append(
            f"""
            <article class="module-card module-{html.escape(module["accent"])}" data-module-card="{html.escape(module["id"])}">
              <div class="module-topline">
                <span class="module-icon" aria-hidden="true"><i data-lucide="{html.escape(module["icon"])}"></i></span>
                <span class="status-chip status-online" data-module-status="{html.escape(module["id"])}" data-status-kind="integrated">Integrado</span>
              </div>
              <h2 data-i18n="module.{html.escape(module["id"])}.title">{html.escape(module["label"])}</h2>
              <p data-i18n="module.{html.escape(module["id"])}.detail">{html.escape(module["detail"])}</p>
              <a class="module-action" href="{path}">
                <i data-lucide="arrow-right"></i>
                <span data-i18n="module.enter">Entrar na area</span>
              </a>
            </article>
            """
        )
    return "\n".join(cards)


def topbar(active_id=""):
    area_links = []
    for module in MODULES:
        active = " active" if module["id"] == active_id else ""
        area_links.append(
            f"""
            <a class="topnav-link{active}" href="{html.escape(module["path"], quote=True)}">
              <i data-lucide="{html.escape(module["icon"])}"></i>
              <span data-i18n="nav.{html.escape(module["id"])}">{html.escape(module["label"])}</span>
            </a>
            """
        )

    return f"""
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand-block brand-link" href="/dashboard">
          <span class="brand-symbol brand-logo" aria-hidden="true">
            <img src="/static/mente-movimento-logo.png" alt="" />
          </span>
          <div>
            <h1>Central MenteMovimento</h1>
            <p>{html.escape(CENTRAL_EMAIL)}</p>
          </div>
        </a>
        <nav class="topnav" aria-label="Areas principais" data-i18n-aria-label="nav.areas">
          {''.join(area_links)}
        </nav>
        <div class="global-actions" aria-label="Ferramentas globais" data-i18n-aria-label="nav.tools">
          <details class="global-menu-wrap">
            <summary class="icon-link menu-trigger" title="Abrir menu" aria-label="Abrir menu" data-i18n-title="nav.openMenu" data-i18n-aria-label="nav.openMenu">
              <i data-lucide="menu"></i>
            </summary>
            <div class="global-tools-menu" role="menu">
              <a class="menu-item" href="/historico" role="menuitem">
                <i data-lucide="history"></i>
                <span data-i18n="menu.historyFull">Historico geral</span>
              </a>
              <a class="menu-item" href="/utilizadores" role="menuitem">
                <i data-lucide="users-round"></i>
                <span data-i18n="menu.users">Utilizadores</span>
              </a>
              <a class="menu-item" href="/manuais" role="menuitem">
                <i data-lucide="book-open"></i>
                <span data-i18n="menu.manuals">Manuais</span>
              </a>
              <button class="menu-item" type="button" data-language-toggle role="menuitem">
                <i data-lucide="languages"></i>
                <span data-i18n="menu.language">Idioma</span>
              </button>
              <button class="menu-item" type="button" data-theme-toggle role="menuitem">
                <i data-lucide="moon"></i>
                <span data-i18n="menu.dark">Tema escuro</span>
              </button>
            </div>
          </details>
          <a class="icon-link" href="/logout" title="Terminar sessao" aria-label="Terminar sessao" data-i18n-title="nav.logout" data-i18n-aria-label="nav.logout">
            <i data-lucide="log-out"></i>
          </a>
        </div>
      </div>
    </header>
    """


def module_nav(active_id):
    items = []
    for module in MODULES:
        active = " active" if module["id"] == active_id else ""
        items.append(
            f"""
            <a class="area-nav-link{active}" href="{html.escape(module["path"], quote=True)}">
              <i data-lucide="{html.escape(module["icon"])}"></i>
              <span data-i18n="nav.{html.escape(module["id"])}">{html.escape(module["label"])}</span>
            </a>
            """
        )
    return "\n".join(items)


def area_panels(module):
    labels_by_module = {
        "socios": [
            ("Gestão de sócios", "id-card"),
            ("Quotas", "calendar-check"),
            ("Exportações", "download"),
        ],
        "utentes": [
            ("Fichas", "clipboard-list"),
            ("Separadores", "panel-top"),
            ("Anexos PDF", "paperclip"),
            ("Genograma / ecomapa", "network"),
        ],
        "dispositivos": [
            ("Listagem", "table-2"),
            ("Reparações", "wrench"),
            ("Estados", "list-checks"),
            ("Estatísticas", "bar-chart-3"),
            ("Anexos", "paperclip"),
            ("CSV", "file-spreadsheet"),
        ],
    }
    panels = []
    for label, icon in labels_by_module.get(module["id"], []):
        panels.append(
            f"""
            <button class="tool-tile" type="button">
              <i data-lucide="{icon}"></i>
              <span>{label}</span>
            </button>
            """
        )
    return "\n".join(panels)


def find_module(area_id):
    return next((module for module in MODULES if module["id"] == area_id), None)


GLOBAL_PAGES = {
    "historico": {
        "title": "Histórico geral",
        "icon": "history",
        "eyebrow": "Ferramenta global",
        "body": "Registo comum de alterações feitas nos ramos de sócios, utentes e dispositivos.",
        "items": [
            ("Sócios", "Alterações em fichas e quotas."),
            ("Utentes", "Alterações em fichas, separadores e anexos."),
            ("Dispositivos", "Alterações em listagens, reparações, estados, anexos e CSV."),
        ],
    },
    "utilizadores": {
        "title": "Utilizadores e permissões",
        "icon": "users-round",
        "eyebrow": "Ferramenta global",
        "body": "Gestão única de administradores, utilizadores e acessos a cada ramo.",
        "items": [
            ("Administrador", "Acesso total ? central."),
            ("Gestor de ramo", "Acesso limitado a sócios, utentes ou dispositivos."),
            ("Consulta", "Acesso só de leitura quando necessário."),
        ],
    },
    "manuais": {
        "title": "Manuais",
        "icon": "book-open",
        "eyebrow": "Ferramenta global",
        "body": "Área comum para consultar os manuais dos três ramos e os manuais técnicos.",
        "items": [
            ("Manual de sócios", "Quotas, exportações e gestão de sócios."),
            ("Manual de utentes", "Fichas, separadores, anexos PDF, genograma e ecomapa."),
            ("Manual de dispositivos", "Reparações, estados, estatísticas, anexos e CSV."),
        ],
    },
}


def global_items(page):
    return "\n".join(
        f"""
        <article class="global-item">
          <strong>{html.escape(title)}</strong>
          <p>{html.escape(text)}</p>
        </article>
        """
        for title, text in page["items"]
    )


class PortalHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        request_path = self.path.split("?", 1)[0]

        if request_path.startswith("/static/"):
            self.send_static()
            return

        if request_path == "/api/session":
            user = self.current_user()
            if not user:
                self.send_json({"error": "Nao autenticado"}, status=401)
                return
            self.send_json({"user": public_user(user)})
            return

        if request_path == "/area/socios":
            self.redirect("/area/socios/")
            return

        if request_path.startswith("/area/socios/"):
            if not self.is_authenticated():
                self.redirect(f"/login?next={quote('/area/socios/')}")
                return
            self.send_module_file(SOCIOS_MODULE_DIR, request_path.removeprefix("/area/socios/"))
            return

        if request_path == "/area/utentes":
            self.redirect("/area/utentes/")
            return

        if request_path.startswith("/area/utentes/"):
            self.handle_utentes_proxy()
            return

        if request_path == "/area/dispositivos":
            self.redirect("/area/dispositivos/")
            return

        if request_path.startswith("/area/dispositivos/"):
            self.handle_dispositivos_proxy()
            return

        if request_path == "/api/status":
            if not self.is_authenticated():
                self.send_json({"error": "Não autenticado"}, status=401)
                return
            statuses = []
            for module in MODULES:
                statuses.append(
                    {
                        "id": module["id"],
                        "path": module["path"],
                        "online": True,
                        "status": "integrado",
                    }
                )
            self.send_json({"modules": statuses})
            return

        if request_path == "/logout":
            token = self.session_token()
            if token:
                SESSIONS.pop(token, None)
            query = parse_qs(self.path_query())
            next_path = safe_next_path(query.get("next", [""])[0])
            target = f"/login?next={quote(next_path)}" if next_path != "/" else "/login"
            self.redirect(target, clear_cookie=True)
            return

        if request_path == "/login":
            if self.is_authenticated():
                query = parse_qs(self.path_query())
                self.redirect(safe_next_path(query.get("next", ["/"])[0]))
                return
            query = parse_qs(self.path_query())
            next_path = safe_next_path(query.get("next", [""])[0])
            self.send_html(
                render_template(
                    "login.html",
                    ERROR="",
                    EMAIL=html.escape(CENTRAL_EMAIL, quote=True),
                    NEXT=html.escape(next_path, quote=True),
                )
            )
            return

        if request_path == "/" or request_path == "/dashboard":
            if not self.is_authenticated():
                self.redirect("/login")
                return
            self.send_html(
                render_template(
                    "dashboard.html",
                    TOPBAR=topbar(),
                    MODULE_CARDS=module_cards(),
                    MODULES_JSON=html.escape(json.dumps(MODULES, ensure_ascii=False), quote=True),
                )
            )
            return

        short_area_routes = {
            "/socios": "/area/socios",
            "/utentes": "/area/utentes",
            "/dispositivos": "/area/dispositivos",
        }
        if request_path in short_area_routes:
            self.redirect(short_area_routes[request_path])
            return

        if request_path.startswith("/area/"):
            if not self.is_authenticated():
                self.redirect(f"/login?next={quote(request_path)}")
                return
            area_id = request_path.removeprefix("/area/").strip("/")
            module = find_module(area_id)
            if not module:
                self.send_error(404, "Área não encontrada")
                return
            self.send_html(
                render_template(
                    "area.html",
                    TOPBAR=topbar(module["id"]),
                    AREA_NAME=html.escape(module["name"]),
                    AREA_LABEL=html.escape(module["label"]),
                    AREA_DETAIL=html.escape(module["detail"]),
                    AREA_ICON=html.escape(module["icon"]),
                    AREA_ACCENT=html.escape(module["accent"]),
                    AREA_SCHEMA=html.escape(module["schema"]),
                    AREA_TABLE=html.escape(module["table"]),
                    AREA_NAV=module_nav(module["id"]),
                    AREA_PANELS=area_panels(module),
                )
            )
            return

        global_page_id = request_path.strip("/")
        if global_page_id in GLOBAL_PAGES:
            if not self.is_authenticated():
                self.redirect("/login")
                return
            page = GLOBAL_PAGES[global_page_id]
            self.send_html(
                render_template(
                    "global.html",
                    TOPBAR=topbar(),
                    PAGE_TITLE=html.escape(page["title"]),
                    PAGE_ICON=html.escape(page["icon"]),
                    PAGE_EYEBROW=html.escape(page["eyebrow"]),
                    PAGE_BODY=html.escape(page["body"]),
                    PAGE_ITEMS=global_items(page),
                )
            )
            return

        self.send_error(404, "Página não encontrada")

    def do_POST(self):
        request_path = self.path.split("?", 1)[0]
        if request_path.startswith("/area/utentes/"):
            self.handle_utentes_proxy()
            return

        if request_path.startswith("/area/dispositivos/"):
            self.handle_dispositivos_proxy()
            return

        if request_path == "/api/socios/query":
            self.handle_socios_query()
            return

        if request_path == "/api/create-user":
            self.handle_create_user()
            return

        if request_path == "/api/delete-user":
            self.handle_delete_user()
            return

        if request_path != "/login":
            self.send_error(404, "Página não encontrada")
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(length).decode("utf-8")
        data = parse_qs(body)
        email = data.get("email", [""])[0].strip()
        password = data.get("password", [""])[0]
        next_path = safe_next_path(data.get("next", ["/"])[0])

        user = authenticate_user(email, password)
        if not user:
            self.send_html(
                render_template(
                    "login.html",
                    ERROR='<p class="form-error">Credenciais inválidas.</p>',
                    EMAIL=html.escape(email, quote=True),
                    NEXT=html.escape(next_path, quote=True),
                ),
                status=401,
            )
            return

        token = create_session(user)
        self.redirect(next_path, session_token=token)

    def path_query(self):
        return self.path.split("?", 1)[1] if "?" in self.path else ""

    def session_token(self):
        cookie_header = self.headers.get("Cookie", "")
        cookies = SimpleCookie(cookie_header)
        morsel = cookies.get(SESSION_COOKIE)
        return morsel.value if morsel else ""

    def is_authenticated(self):
        cleanup_sessions()
        token = self.session_token()
        if not token:
            return False
        session = SESSIONS.get(token)
        expiry = session.get("expiry", 0) if isinstance(session, dict) else session
        if not expiry or expiry <= now():
            SESSIONS.pop(token, None)
            return False
        if isinstance(session, dict):
            session["expiry"] = now() + SESSION_SECONDS
        else:
            SESSIONS[token] = now() + SESSION_SECONDS
        return True

    def current_user(self):
        if not self.is_authenticated():
            return None
        session = SESSIONS.get(self.session_token())
        if isinstance(session, dict):
            return session.get("user")
        return {"id": "central-admin", "email": CENTRAL_EMAIL}

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def current_profile(self):
        user = self.current_user()
        if not user:
            return None
        with db_connection() as connection:
            row = connection.execute("SELECT * FROM app_users WHERE id = ?", (user["id"],)).fetchone()
        return row_to_dict("app_users", row) if row else None

    def require_admin(self):
        profile = self.current_profile()
        return profile if profile and profile.get("active") and profile.get("role") == "admin" else None

    def handle_socios_query(self):
        user = self.current_user()
        if not user:
            self.send_json({"data": None, "error": {"message": "Nao autenticado."}}, status=401)
            return
        try:
            result = execute_socios_query(self.read_json_body(), user)
            self.send_json(result)
        except sqlite3.IntegrityError as error:
            self.send_json({"data": None, "error": {"message": str(error)}}, status=400)
        except Exception as error:
            self.send_json({"data": None, "error": {"message": str(error)}}, status=400)

    def handle_create_user(self):
        admin = self.require_admin()
        if not admin:
            self.send_json({"error": "Apenas administradores podem criar utilizadores."}, status=403)
            return
        try:
            payload = self.read_json_body()
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", ""))
            full_name = str(payload.get("fullName", "")).strip() or None
            role = str(payload.get("role", "viewer")).strip()
            if role not in ("admin", "operator", "viewer"):
                role = "viewer"
            if not email or "@" not in email:
                raise ValueError("Email invalido.")
            if len(password) < 6:
                raise ValueError("A password deve ter pelo menos 6 caracteres.")
            user_id = str(uuid.uuid4())
            salt, digest = hash_password(password)
            now_iso = utc_now()
            with db_connection() as connection:
                connection.execute(
                    """
                    INSERT INTO app_users (id, email, full_name, role, active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 1, ?, ?)
                    """,
                    (user_id, email, full_name, role, now_iso, now_iso),
                )
                connection.execute(
                    """
                    INSERT INTO local_auth_credentials (user_id, email, password_hash, salt, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, email, digest, salt, now_iso, now_iso),
                )
            self.send_json({"id": user_id, "email": email})
        except sqlite3.IntegrityError:
            self.send_json({"error": "Ja existe um utilizador com esse email."}, status=400)
        except Exception as error:
            self.send_json({"error": str(error)}, status=400)

    def handle_delete_user(self):
        admin = self.require_admin()
        if not admin:
            self.send_json({"error": "Apenas administradores podem eliminar utilizadores."}, status=403)
            return
        try:
            payload = self.read_json_body()
            user_id = str(payload.get("id", "")).strip()
            current_user = self.current_user()
            if not user_id:
                raise ValueError("Utilizador invalido.")
            if current_user and user_id == current_user["id"]:
                raise ValueError("Nao elimine a sua propria conta.")
            with db_connection() as connection:
                row = connection.execute("SELECT email FROM app_users WHERE id = ?", (user_id,)).fetchone()
                if not row:
                    raise ValueError("Utilizador nao encontrado.")
                connection.execute("DELETE FROM local_auth_credentials WHERE user_id = ?", (user_id,))
                connection.execute("DELETE FROM app_users WHERE id = ?", (user_id,))
            self.send_json({"id": user_id, "email": row["email"]})
        except Exception as error:
            self.send_json({"error": str(error)}, status=400)

    def handle_utentes_proxy(self):
        if self.path.split("?", 1)[0] == "/area/utentes/logout":
            self.redirect("/logout")
            return

        user = self.current_user()
        if not user:
            self.redirect(f"/login?next={quote('/area/utentes/')}")
            return

        try:
            utentes_token = ensure_utentes_session(user, self.current_profile())
        except Exception as error:
            self.send_html(
                render_template(
                    "area.html",
                    TOPBAR=topbar("utentes"),
                    AREA_NAME="Gestão de Utentes",
                    AREA_LABEL="Utentes",
                    AREA_DETAIL=html.escape(str(error)),
                    AREA_ICON="heart-handshake",
                    AREA_ACCENT="blue",
                    AREA_SCHEMA="utentes",
                    AREA_TABLE="utentes",
                    AREA_NAV=module_nav("utentes"),
                    AREA_PANELS='<p class="muted">A app de Utentes ainda não arrancou. Tenta reiniciar com .\\start-local.ps1.</p>',
                ),
                status=503,
            )
            return

        self.proxy_to_utentes(utentes_token)

    def proxy_to_utentes(self, utentes_token):
        raw_path = self.path
        if raw_path.startswith("/area/utentes"):
            upstream_path = raw_path.removeprefix("/area/utentes") or "/"
        else:
            upstream_path = raw_path
        if not upstream_path.startswith("/"):
            upstream_path = "/" + upstream_path

        body = b""
        if self.command in ("POST", "PUT", "PATCH"):
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length) if length else b""

        headers = {
            "Host": f"127.0.0.1:{UTENTES_PORT}",
            "Cookie": utentes_cookie_header(self.headers.get("Cookie", ""), utentes_token),
        }
        for key in ("Content-Type", "Accept", "User-Agent"):
            value = self.headers.get(key)
            if value:
                headers[key] = value
        if body:
            headers["Content-Length"] = str(len(body))

        connection = None
        try:
            connection = http.client.HTTPConnection("127.0.0.1", UTENTES_PORT, timeout=30)
            connection.request(self.command, upstream_path, body=body, headers=headers)
            response = connection.getresponse()
            data = response.read()
            response_headers = response.getheaders()
        except OSError:
            self.send_error(503, "A app local de Utentes não está ligada")
            return
        finally:
            try:
                if connection:
                    connection.close()
            except Exception:
                pass

        content_type = next((value for key, value in response_headers if key.lower() == "content-type"), "")
        if content_type.startswith("text/html"):
            data = rewrite_utentes_html(data.decode("utf-8", errors="replace")).encode("utf-8")

        self.send_response(response.status)
        self.common_headers()
        self.send_header("Set-Cookie", f"utentes_session={utentes_token}; Path=/; HttpOnly; SameSite=Lax")
        for key, value in response_headers:
            lower = key.lower()
            if lower in {"content-length", "transfer-encoding", "connection", "server", "date"}:
                continue
            if lower == "location":
                self.send_header(key, prefix_utentes_location(value))
            elif lower == "set-cookie":
                self.send_header(key, value)
            else:
                self.send_header(key, value)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_dispositivos_proxy(self):
        if not self.is_authenticated():
            self.redirect(f"/login?next={quote('/area/dispositivos/')}")
            return

        self.proxy_to_dispositivos()

    def proxy_to_dispositivos(self):
        body = b""
        if self.command in ("POST", "PUT", "PATCH"):
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length) if length else b""

        headers = {"Host": f"127.0.0.1:{DISPOSITIVOS_PORT}"}
        for key in ("Content-Type", "Accept", "User-Agent"):
            value = self.headers.get(key)
            if value:
                headers[key] = value
        if body:
            headers["Content-Length"] = str(len(body))

        connection = None
        try:
            connection = http.client.HTTPConnection("127.0.0.1", DISPOSITIVOS_PORT, timeout=30)
            connection.request(self.command, self.path, body=body, headers=headers)
            response = connection.getresponse()
            data = response.read()
            response_headers = response.getheaders()
        except OSError:
            self.send_html(
                render_template(
                    "area.html",
                    TOPBAR=topbar("dispositivos"),
                    AREA_NAME="Gestão de Dispositivos",
                    AREA_LABEL="Dispositivos",
                    AREA_DETAIL="O módulo de Dispositivos ainda não está ligado. Reinicie com .\\start-local.ps1.",
                    AREA_ICON="monitor-cog",
                    AREA_ACCENT="amber",
                    AREA_SCHEMA="dispositivos",
                    AREA_TABLE="devices",
                    AREA_NAV=module_nav("dispositivos"),
                    AREA_PANELS=area_panels(find_module("dispositivos") or MODULES[-1]),
                ),
                status=503,
            )
            return
        finally:
            try:
                if connection:
                    connection.close()
            except Exception:
                pass

        self.send_response(response.status)
        self.common_headers()
        for key, value in response_headers:
            lower = key.lower()
            if lower in {"content-length", "transfer-encoding", "connection", "server", "date"}:
                continue
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def send_static(self):
        raw_path = self.path.split("?", 1)[0].removeprefix("/static/")
        requested = (STATIC_DIR / raw_path).resolve()
        static_root = STATIC_DIR.resolve()
        if static_root not in requested.parents and requested != static_root:
            self.send_error(404, "Ficheiro não encontrado")
            return
        if not requested.is_file():
            self.send_error(404, "Ficheiro não encontrado")
            return
        content_type = with_charset(mimetypes.guess_type(str(requested))[0] or "application/octet-stream")
        data = requested.read_bytes()
        self.send_response(200)
        self.common_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_module_file(self, root, raw_path):
        raw_path = raw_path.split("?", 1)[0]
        if not raw_path or raw_path.endswith("/"):
            raw_path = f"{raw_path}index.html"
        requested = (root / raw_path).resolve()
        module_root = root.resolve()
        if module_root not in requested.parents and requested != module_root:
            self.send_error(404, "Ficheiro não encontrado")
            return
        if not requested.is_file():
            self.send_error(404, "Ficheiro não encontrado")
            return
        content_type = with_charset(mimetypes.guess_type(str(requested))[0] or "application/octet-stream")
        data = requested.read_bytes()
        self.send_response(200)
        self.common_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_html(self, body, status=200):
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.common_headers()
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_json(self, payload, status=200):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def redirect(self, path, session_token=None, clear_cookie=False):
        self.send_response(303)
        self.common_headers()
        self.send_header("Location", path)
        if session_token:
            self.send_header(
                "Set-Cookie",
                f"{SESSION_COOKIE}={session_token}; Path=/; HttpOnly; SameSite=Lax",
            )
        if clear_cookie:
            self.send_header(
                "Set-Cookie",
                f"{SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
            )
        self.end_headers()

    def common_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; "
            "form-action 'self'; object-src 'none'; img-src 'self' data:; "
            "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https://challenges.cloudflare.com; "
            "frame-src https://challenges.cloudflare.com",
        )

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def run():
    init_database()
    port = int(os.environ.get("CENTRAL_PORT") or os.environ.get("PORT") or "8090")
    server = ThreadingHTTPServer(("127.0.0.1", port), PortalHandler)
    print(f"Central MenteMovimento: http://127.0.0.1:{port}")
    print(f"Login local: {CENTRAL_EMAIL}")
    server.serve_forever()


if __name__ == "__main__":
    run()
