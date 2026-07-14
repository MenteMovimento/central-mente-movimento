# -*- coding: utf-8 -*-
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, quote, urlparse
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from email.parser import BytesParser
from email import policy
from html.parser import HTMLParser
import csv
import hashlib
import hmac
import html
import io
import json
import os
import re
import secrets
import shutil
import sqlite3
import zipfile
from datetime import datetime, timedelta


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_local_env():
    env_path = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_local_env()

DB_PATH = os.path.join(BASE_DIR, "utentes.db")
LOGO_PATH = os.path.join(BASE_DIR, "logo-horizontal.png")
ATTACHMENTS_DIR = os.path.join(BASE_DIR, "anexos")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
MAX_PDF_BYTES = 30 * 1024 * 1024
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SECRET_KEY = (
    os.environ.get("SUPABASE_SECRET_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY", "")
)
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "documentos-utentes")
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_SECRET_KEY)

TAB_SECTIONS = [
    ("referenciacao", "Formulário de Referenciação"),
    ("emergencia", "Informações em Caso de Emergência"),
    ("inscricao", "Ficha de Inscrição e Avaliação Inicial de Requisitos"),
    ("diagnostica", "Avaliação Diagnóstica Multidisciplinar"),
    ("atendimentos", "Registo de Atendimentos e Acompanhamentos"),
    ("protecao_dados", "Proteção de dados e Termos de Responsabilidade"),
    ("outros", "Outros"),
    ("pagamentos", "Pagamentos e Mensalidades")
]

UTENTES_PUBLIC_TABS = {"referenciacao", "pagamentos", "emergencia"}
UTENTES_SENSITIVE_TABS = {"inscricao", "diagnostica", "atendimentos", "protecao_dados", "outros"}
CENTRAL_AREA_KEYS = ("socios", "utentes", "dispositivos", "atividades")
CENTRAL_AREA_ACTIONS = ("view", "edit", "view_sensitive", "edit_sensitive", "export", "delete")

PERFIL_ADMIN = "Administrador"
PERFIL_UTILIZADOR = "Utilizador"
DEFAULT_ADMIN_EMAIL = "admin@mentemovimento.local"
DEFAULT_ADMIN_PASSWORD = "admin123"
SESSION_COOKIE = "utentes_session"
LANGUAGE_COOKIE = "utentes_language"
SESSION_HOURS = 12


SCHEMA = """
CREATE TABLE IF NOT EXISTS utentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data_nascimento TEXT,
    telefone TEXT,
    email TEXT,
    morada TEXT,
    numero_utente TEXT,
    nif TEXT,
    contacto_emergencia TEXT,
    estado TEXT NOT NULL DEFAULT 'Ativo',
    observacoes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_utentes_nome ON utentes(nome);
CREATE INDEX IF NOT EXISTS idx_utentes_estado ON utentes(estado);

CREATE TABLE IF NOT EXISTS utente_abas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    tab_key TEXT NOT NULL,
    conteudo TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (utente_id, tab_key),
    FOREIGN KEY (utente_id) REFERENCES utentes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_utente_abas_utente ON utente_abas(utente_id);

CREATE TABLE IF NOT EXISTS utilizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK (perfil IN ('Administrador', 'Utilizador')),
    ativo INTEGER NOT NULL DEFAULT 1,
    tema TEXT NOT NULL DEFAULT 'escuro',
    idioma TEXT NOT NULL DEFAULT 'pt',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email);
CREATE INDEX IF NOT EXISTS idx_utilizadores_perfil ON utilizadores(perfil);

CREATE TABLE IF NOT EXISTS sessoes (
    token TEXT PRIMARY KEY,
    utilizador_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessoes_utilizador ON sessoes(utilizador_id);

CREATE TABLE IF NOT EXISTS historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id INTEGER,
    utilizador_nome TEXT NOT NULL,
    acao TEXT NOT NULL,
    alvo_tipo TEXT NOT NULL,
    alvo_id INTEGER,
    detalhes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_historico_created ON historico(created_at);
CREATE INDEX IF NOT EXISTS idx_historico_utilizador ON historico(utilizador_id);

CREATE TABLE IF NOT EXISTS utente_anexos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    tab_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    uploaded_by INTEGER,
    uploaded_by_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (utente_id) REFERENCES utentes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_utente_anexos_utente ON utente_anexos(utente_id);
"""


STYLE = """
:root {
    color-scheme: light;
    --bg: #f4f7f6;
    --panel: #ffffff;
    --text: #1d2422;
    --muted: #65716d;
    --line: #b7c8c2;
    --brand: #2f7d73;
    --brand-dark: #24625a;
    --danger: #b73232;
    --danger-bg: #fff0f0;
    --focus: #e2f2ef;
    --shadow: 0 16px 40px rgba(21, 35, 34, 0.08);
}

.dark-theme {
    color-scheme: dark;
    --bg: #07131f;
    --panel: #0d1b2e;
    --text: #eaf4ff;
    --muted: #9fb2c6;
    --line: #263a4f;
    --brand: #18c996;
    --brand-dark: #72e5bf;
    --danger: #ff8175;
    --danger-bg: #3b1919;
    --focus: #16283f;
    --shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
}

header {
    background: #10231f;
    color: #ffffff;
    padding: 20px 0;
}

.topbar {
    width: calc(100% - 56px);
    margin: 0 auto;
}

main {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
}

.topbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(260px, 420px) minmax(300px, 1fr);
    align-items: center;
    gap: 28px;
    min-height: 140px;
}

.header-identity {
    justify-self: start;
}

.header-title {
    margin: 0;
    color: #ffffff;
    font-family: "Segoe UI Variable Display", "Aptos Display", "Segoe UI", Inter, Arial, sans-serif;
    font-size: clamp(1.35rem, 2.2vw, 1.75rem);
    font-weight: 650;
    letter-spacing: 0;
}

.header-subtitle {
    margin: 10px 0 4px;
    color: #cfe3de;
    font-size: 0.95rem;
}

.header-role {
    color: #ffffff;
    font-weight: 800;
}

.logo {
    display: block;
    justify-self: center;
    width: min(100%, 360px);
    height: auto;
    max-height: 116px;
    object-fit: contain;
    border-radius: 10px;
    background: #ffffff;
    padding: 12px 18px;
}

.header-actions {
    display: grid;
    justify-self: end;
    width: min(100%, 475px);
    gap: 10px;
}

.header-tools {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 50px 50px;
    gap: 10px;
}

.role-pill,
.header-icon {
    min-height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.32);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
}

.role-pill:hover,
.header-icon:hover {
    background: rgba(255, 255, 255, 0.14);
}

.role-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 14px;
    font-weight: 800;
    text-decoration: none;
}

.header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    min-width: 50px;
    text-decoration: none;
}

.role-pill svg,
.header-icon svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    stroke-width: 2.3;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.header-actions .button {
    width: 100%;
    min-height: 50px;
    font-size: 1.05rem;
}

.menu-dropdown {
    position: relative;
    width: 50px;
    min-width: 50px;
}

.menu-dropdown summary {
    cursor: pointer;
    list-style: none;
    width: 50px;
}

.menu-dropdown summary::-webkit-details-marker {
    display: none;
}

.menu-panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 20;
    width: 350px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}

.menu-panel a {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    border-bottom: 1px solid var(--line);
    color: var(--text);
    font-weight: 800;
    padding: 0 18px;
    text-decoration: none;
}

.menu-panel a:last-child {
    border-bottom: 0;
}

.menu-panel a:hover {
    background: rgba(18, 184, 134, 0.12);
}

.menu-panel svg {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

main {
    padding: 28px 0 48px;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
}

.search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
    max-width: 100%;
}

.search-form input[name="q"] {
    min-width: min(460px, 100%);
}

.panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(16, 35, 31, 0.06);
}

.dark-theme .panel {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.form-panel {
    padding: 22px;
}

.edit-layout {
    display: grid;
    gap: 18px;
}

.edit-title {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}

.edit-title h2 {
    margin: 0;
    font-size: 1.25rem;
}

.stats-page-title {
    justify-content: space-between;
}

.stats-page-title > div {
    margin-right: auto;
}

.stats-print-heading {
    display: none;
}

.title-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tabs-panel {
    overflow: hidden;
}

.tab-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: 8px;
    border-bottom: 1px solid var(--line);
    background: #f8fbfa;
    padding: 12px;
}

.dark-theme .tab-list {
    background: #081827;
}

.tab-link {
    display: flex;
    min-height: 34px;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--text);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.25;
    min-width: 0;
    overflow: hidden;
    padding: 7px 8px;
    text-align: center;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: normal;
}

@media (min-width: 1180px) {
    .tab-list {
        grid-template-columns: repeat(8, minmax(0, 1fr));
    }
}

.dark-theme .tab-link {
    color: #d9eee8;
}

.tab-link:hover {
    border-color: #c6e4dc;
    background: #ffffff;
    color: var(--brand-dark);
}

.dark-theme .tab-link:hover {
    border-color: #38b889;
    background: #12263c;
    color: #ffffff;
}

.tab-link.active {
    border-color: #c6e4dc;
    background: var(--brand);
    color: #ffffff;
    font-weight: 800;
}

.autosave-status {
    align-items: center;
    color: var(--muted);
    display: inline-flex;
    font-size: 0.88rem;
    font-weight: 700;
    min-height: 42px;
    min-width: 128px;
}

.autosave-status.saving {
    color: var(--brand);
}

.autosave-status.error {
    color: var(--danger);
}

.tab-content {
    min-width: 0;
    padding: 20px;
}

.tab-content h3 {
    margin: 0 0 16px;
    font-size: 1.15rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.field.full {
    grid-column: 1 / -1;
}

.form-section {
    display: grid;
    gap: 14px;
    border-top: 1px solid var(--line);
    padding-top: 18px;
    margin-top: 18px;
}

.form-section:first-child {
    border-top: 0;
    padding-top: 0;
    margin-top: 0;
}

.section-title {
    margin: 0;
    color: var(--brand);
    font-size: 1rem;
    font-weight: 850;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
}

.span-2 {
    grid-column: span 2;
}

.span-3 {
    grid-column: span 3;
}

.span-4 {
    grid-column: span 4;
}

.span-5 {
    grid-column: span 5;
}

.span-6 {
    grid-column: span 6;
}

.span-8 {
    grid-column: span 8;
}

.span-12 {
    grid-column: 1 / -1;
}

.inline-checks,
.checkbox-grid {
    display: grid;
    gap: 12px;
}

.inline-checks {
    grid-template-columns: repeat(auto-fit, minmax(170px, max-content));
    align-items: center;
}

.checkbox-grid {
    grid-template-columns: repeat(3, minmax(170px, 1fr));
}

.check-option {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    color: var(--text);
    font-weight: 650;
}

.check-option input {
    width: 18px;
    height: 18px;
    accent-color: var(--brand);
}

.medication-wrap {
    overflow-x: auto;
}

.medication-table {
    min-width: 980px;
}

.medication-table th,
.medication-table td {
    padding: 8px;
}

.medication-table input {
    min-width: 72px;
    padding: 8px;
}

.medication-table .medicine-name {
    min-width: 210px;
}

.medication-table .medicine-notes {
    min-width: 260px;
}

.choice-group {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
}

.choice-option {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
    font-weight: 700;
}

.choice-option input {
    width: 18px;
    height: 18px;
    accent-color: var(--brand);
}

.payment-form-actions {
    align-items: flex-end;
}

.payment-form-actions .button {
    width: min(100%, 260px);
}

.payment-history-section {
    margin-top: 24px;
}

.payment-history-wrap {
    overflow-x: auto;
}

.payment-history-table {
    min-width: 980px;
}

.payment-history-table th,
.payment-history-table td {
    vertical-align: top;
}

.compact-empty {
    min-height: 84px;
    padding: 22px;
}

.quick-payment-dialog {
    width: min(520px, calc(100vw - 28px));
}

.quick-payment-form {
    display: grid;
    gap: 14px;
}

.quick-payment-summary {
    display: grid;
    gap: 4px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--focus);
    color: var(--text);
}

.quick-payment-summary strong {
    color: var(--brand-dark);
}

.quick-payment-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.scoring-table {
    min-width: 900px;
}

.scoring-table .criteria-cell {
    min-width: 360px;
}

.scoring-table input {
    min-width: 92px;
    padding: 8px;
}

.sheet-subtitle {
    color: var(--text);
    font-size: 0.96rem;
    font-weight: 850;
    margin: 6px 0 2px;
}

.sheet-table {
    border-collapse: collapse;
    min-width: 920px;
    width: 100%;
}

.sheet-table th,
.sheet-table td {
    border: 1px solid var(--line);
    padding: 10px;
    vertical-align: top;
}

.sheet-table th {
    background: #e8f3ef;
    color: var(--text);
    font-size: 0.84rem;
    text-transform: none;
}

.dark-theme .sheet-table th {
    background: #12263c;
}

.sheet-table .question-cell {
    min-width: 430px;
}

.sheet-table .radio-cell {
    text-align: center;
    vertical-align: middle;
    width: 74px;
}

.sheet-table .observations-cell {
    min-width: 330px;
}

.sheet-radio {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.sheet-radio input {
    width: 19px;
    height: 19px;
    accent-color: var(--brand);
}

.sheet-table textarea {
    min-height: 74px;
}

.attendance-table {
    min-width: 1180px;
}

.attendance-table .meta-cell {
    min-width: 300px;
}

.attendance-table .text-cell {
    min-width: 260px;
}

.attendance-meta {
    display: grid;
    gap: 10px;
}

.attendance-meta .check-option,
.attendance-meta .choice-option {
    font-size: 0.82rem;
    min-height: 24px;
}

.attendance-meta input[type="date"],
.attendance-meta input[type="text"] {
    padding: 8px;
}

.attendance-section-head {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 12px;
}

.attendance-section-head .section-title {
    margin: 0;
}

.attachments-list {
    display: grid;
    gap: 10px;
}

.attachment-row {
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 6px;
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 12px;
}

.attachment-name {
    color: var(--text);
    font-weight: 800;
    overflow-wrap: anywhere;
}

.attachment-meta {
    color: var(--muted);
    font-size: 0.84rem;
    margin-top: 3px;
}

.attachment-actions {
    display: flex;
    gap: 8px;
}

.pdf-upload-form {
    display: grid;
    gap: 12px;
}

.pdf-upload-form input[type="file"] {
    padding: 14px;
}

.sheet-other-field {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: auto minmax(180px, 1fr);
    margin-top: 10px;
}

.sheet-other-field label {
    color: var(--text);
    font-size: 0.88rem;
}

.sheet-checks {
    display: grid;
    gap: 8px 14px;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    margin-top: 10px;
}

.diagram-editor {
    display: grid;
    gap: 12px;
}

.diagram-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.diagram-toolbar .button,
.diagram-toolbar select {
    min-height: 36px;
    width: auto;
}

.diagram-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 12px;
}

.diagram-canvas {
    min-height: 520px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #ffffff;
    overflow: hidden;
}

.dark-theme .diagram-canvas {
    background: #081827;
}

.diagram-canvas svg {
    display: block;
    height: 520px;
    width: 100%;
}

.diagram-node,
.diagram-edge {
    cursor: pointer;
}

.readonly-section .diagram-node,
.readonly-section .diagram-edge {
    cursor: default;
}

.diagram-node.selected .node-shape,
.diagram-edge.selected {
    filter: drop-shadow(0 0 0.25rem rgba(18, 184, 134, 0.9));
    stroke: var(--brand);
    stroke-width: 6;
}

.diagram-node.selected .node-shape {
    fill: #dff8ee;
}

.dark-theme .diagram-node.selected .node-shape {
    fill: #16283f;
}

.diagram-node.selected text {
    fill: var(--brand);
}

.diagram-help {
    color: var(--muted);
    font-size: 0.86rem;
    font-weight: 700;
    margin: -4px 0 0;
}

.diagram-note {
    min-height: 90px;
}

.diagram-legend {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 12px;
}

.diagram-legend h5 {
    margin: 0 0 10px;
    color: var(--text);
    font-size: 0.94rem;
}

.diagram-legend ul {
    display: grid;
    gap: 9px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.diagram-legend li {
    align-items: center;
    color: var(--muted);
    display: grid;
    font-size: 0.86rem;
    gap: 8px;
    grid-template-columns: 58px minmax(0, 1fr);
    line-height: 1.35;
}

.legend-symbol {
    align-items: center;
    display: inline-flex;
    height: 34px;
    justify-content: center;
    width: 58px;
}

.legend-symbol svg {
    display: block;
    height: 34px;
    max-width: 58px;
    width: 58px;
}

.legend-symbol svg [stroke="#f3fbf8"] {
    stroke: #536d67;
}

.legend-label {
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 700;
}

.diagram-data {
    display: none;
}

.readonly-section input:disabled,
.readonly-section textarea:disabled {
    opacity: 1;
    color: var(--text);
    -webkit-text-fill-color: var(--text);
}

label {
    color: var(--muted);
    font-weight: 700;
    font-size: 0.9rem;
}

input,
select,
textarea {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 6px;
    color: var(--text);
    background: #ffffff;
    padding: 10px 12px;
    font: inherit;
}

.dark-theme input,
.dark-theme select,
.dark-theme textarea {
    background: #081827;
}

input:focus,
select:focus,
textarea:focus {
    outline: 3px solid var(--focus);
    border-color: var(--brand);
}

textarea {
    min-height: 118px;
    resize: vertical;
}

.large-textarea {
    min-height: 340px;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
}

.button {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 9px 14px;
    color: #ffffff;
    background: var(--brand);
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
}

.button:hover {
    background: var(--brand-dark);
}

.button.secondary {
    color: var(--text);
    background: #ffffff;
    border-color: var(--line);
}

.button.secondary:hover {
    background: #f8fbfa;
}

.dark-theme .button.secondary {
    background: #081827;
}

.dark-theme .button.secondary:hover {
    background: #12263c;
}

.button.danger {
    color: var(--danger);
    background: var(--danger-bg);
    border-color: #f3c4c4;
}

.button.danger:hover {
    background: #ffe3e3;
}

.icon-button {
    width: 40px;
    min-width: 40px;
    padding: 0;
    background: #ffffff;
}

.icon-button svg {
    width: 19px;
    height: 19px;
    stroke: currentColor;
    stroke-width: 2.35;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.button.secondary.icon-button {
    border-color: #b8cee8;
    color: #0d356f;
}

.button.secondary.icon-button:hover {
    background: #eef6ff;
    border-color: #7da7d7;
}

.button.view.icon-button {
    border-color: #b5dbc9;
    color: #08734f;
}

.button.view.icon-button:hover {
    background: #ecfbf5;
    border-color: #72c49c;
}

.button.danger.icon-button {
    border-color: #f2b8ad;
    color: #d12b1f;
}

.button.danger.icon-button:hover {
    background: #fff0ec;
    border-color: #ea8f80;
}

.button.toggle.icon-button {
    border-color: #d4b56d;
    color: #916000;
}

.button.toggle.icon-button:hover {
    background: #fff8e5;
    border-color: #bd8f27;
}

.button.payment.icon-button {
    border-color: #8ed8c0;
    color: #08734f;
}

.button.payment.icon-button:hover {
    background: #e8f8f1;
    border-color: #4fb98f;
}

.dark-theme .button.toggle.icon-button {
    border-color: #b8862c;
    color: #ffd487;
}

.dark-theme .icon-button {
    background: #081827;
}

.dark-theme .button.secondary.icon-button {
    border-color: #4c7bab;
    color: #9bc6ff;
}

.dark-theme .button.view.icon-button {
    border-color: #38b889;
    color: #8df0c3;
}

.dark-theme .button.danger.icon-button {
    border-color: #a84d43;
    color: #ff8c82;
}

.dark-theme .button.payment.icon-button {
    border-color: #38b889;
    color: #8df0c3;
}

.button svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2.35;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.table-wrap {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 440px;
}

th,
td {
    padding: 13px 14px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
}

th {
    color: var(--muted);
    background: #f8fbfa;
    font-size: 0.84rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.dark-theme th {
    background: #12263c;
}

tr:last-child td {
    border-bottom: 0;
}

.name {
    font-weight: 800;
}

.stats-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: var(--shadow);
    display: grid;
    gap: 10px;
    padding: 18px;
}

.stat-card span {
    color: var(--muted);
    font-size: 0.86rem;
    font-weight: 800;
    text-transform: uppercase;
}

.stat-card strong {
    color: var(--navy);
    font-size: 2rem;
    line-height: 1;
}

.stat-card small {
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 700;
}

.section-heading {
    padding: 18px 18px;
}

.section-heading h3 {
    margin: 0;
}

.percentage-cell {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: 62px minmax(120px, 1fr);
}

.percentage-bar {
    background: #e9f3f0;
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
}

.percentage-bar span {
    background: var(--brand);
    display: block;
    height: 100%;
}

.dark-theme .percentage-bar {
    background: #102335;
}

.muted {
    color: var(--muted);
}

.status {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    border-radius: 999px;
    padding: 3px 9px;
    background: #e8f4f1;
    color: #1f665d;
    font-size: 0.86rem;
    font-weight: 800;
}

.status.inactive {
    background: #f2f2f2;
    color: #666666;
}

.row-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    white-space: nowrap;
}

.actions-cell {
    text-align: right;
}

.row-actions form {
    margin: 0;
}

.empty {
    padding: 38px 20px;
    text-align: center;
}

.notice {
    margin-bottom: 16px;
    border: 1px solid #c6e4dc;
    border-radius: 8px;
    background: #edf8f5;
    color: #225c54;
    padding: 12px 14px;
    font-weight: 700;
}

.auth-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
}

.auth-card {
    width: min(430px, 100%);
    padding: 28px;
}

.auth-logo {
    display: block;
    width: 190px;
    margin: 0 auto 20px;
    border-radius: 10px;
    background: #ffffff;
    padding: 10px;
}

.auth-card h1 {
    margin: 0 0 8px;
    font-size: 1.55rem;
    text-align: center;
}

.auth-card .muted {
    margin: 0 0 22px;
    text-align: center;
}

.manual-page {
    display: grid;
    gap: 18px;
}

.manual-choice-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.manual-choice-card {
    display: grid;
    gap: 12px;
    align-content: start;
    min-height: 210px;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    text-decoration: none;
    box-shadow: 0 18px 36px rgba(15, 42, 37, 0.08);
}

.manual-choice-card:hover {
    border-color: var(--brand);
    transform: translateY(-1px);
}

.manual-choice-card h3 {
    margin: 0;
    color: var(--brand);
    font-size: 1.18rem;
}

.manual-choice-card p {
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
}

.manual-choice-card .button {
    justify-self: start;
    align-self: end;
    margin-top: 8px;
}

.manual-section {
    display: grid;
    gap: 10px;
}

.manual-section h3 {
    margin: 0;
    color: var(--brand);
    font-size: 1.05rem;
}

.manual-section p {
    margin: 0;
    color: var(--muted);
}

.manual-list {
    margin: 0;
    padding-left: 22px;
    color: var(--text);
}

.manual-list li {
    margin: 7px 0;
}

.manual-page code {
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--focus);
    padding: 1px 5px;
    color: var(--text);
    font-size: 0.9em;
}

.manual-page pre {
    overflow-x: auto;
    margin: 0;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--focus);
}

.manual-page pre code {
    border: 0;
    padding: 0;
    background: transparent;
}

.manual-dialog {
    width: min(620px, calc(100vw - 28px));
    padding: 0;
    border: 0;
    border-radius: 8px;
    color: var(--text);
    background: var(--panel);
    box-shadow: 0 28px 80px rgba(21, 35, 34, 0.26);
}

.manual-dialog::backdrop {
    background: rgba(15, 30, 30, 0.52);
}

.manual-dialog-panel {
    display: grid;
    gap: 18px;
    padding: 18px;
}

.manual-dialog-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
}

.manual-dialog-head h2 {
    margin: 0;
    font-size: 1rem;
}

.manual-dialog-head p {
    margin: 4px 0 0;
    color: var(--muted);
}

.manual-dialog-options {
    display: grid;
    gap: 10px;
}

.manual-dialog-card {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-height: 82px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--text);
    background: var(--panel);
    text-decoration: none;
}

.manual-dialog-card:hover {
    border-color: var(--brand);
    background: var(--focus);
}

.manual-dialog-icon {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--brand-dark);
    background: var(--focus);
}

.manual-dialog-icon svg {
    width: 21px;
    height: 21px;
    stroke: currentColor;
}

.manual-dialog-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
}

.manual-dialog-copy strong {
    color: var(--brand-dark);
}

.manual-dialog-copy span {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.35;
}

.frame-dialog {
    width: min(1180px, calc(100vw - 28px));
    max-height: calc(100vh - 28px);
    padding: 0;
    border: 0;
    border-radius: 8px;
    color: var(--text);
    background: var(--panel);
    box-shadow: 0 28px 80px rgba(21, 35, 34, 0.26);
}

.frame-dialog::backdrop {
    background: rgba(15, 30, 30, 0.52);
}

.frame-dialog-panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: min(760px, calc(100vh - 28px));
    overflow: hidden;
}

.frame-dialog.utility-frame .frame-dialog-panel {
    height: min(880px, calc(100vh - 28px));
    grid-template-rows: minmax(0, 1fr);
}

.frame-dialog.utility-frame .frame-dialog-head {
    display: none;
}

.frame-dialog-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
}

.frame-dialog-head h2 {
    margin: 0;
    color: var(--brand-dark);
    font-size: 1rem;
}

.frame-dialog-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: var(--bg);
}

.manual-page h4,
.manual-page h5 {
    margin: 8px 0 0;
    color: var(--brand);
}

.manual-note {
    border-left: 4px solid var(--brand);
    background: var(--focus);
    border-radius: 8px;
    padding: 12px 14px;
    color: var(--text);
}

.manager-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
}

.manager-head h2,
.manager-column h3 {
    margin: 0 0 6px;
}

.manager-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0;
    overflow: hidden;
}

.manager-column {
    padding: 22px;
}

.manager-column + .manager-column {
    border-left: 1px solid var(--line);
}

.utility-body {
    background: transparent;
}

.utility-body main {
    width: 100%;
    padding: 0;
}

.utility-panel {
    overflow: hidden;
    min-height: 520px;
    border-radius: 8px;
    color: var(--text);
    background: var(--panel);
}

.utility-panel-head,
.utility-head-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.utility-panel-head {
    justify-content: space-between;
    padding: 18px;
    border-bottom: 1px solid var(--line);
}

.utility-panel-head h2,
.utility-empty h3 {
    margin: 0;
    color: var(--brand-dark);
}

.utility-panel-head p {
    margin: 4px 0 0;
    color: var(--muted);
}

.utility-forms {
    display: grid;
    grid-template-columns: minmax(260px, 0.95fr) minmax(260px, 1fr);
    border-bottom: 1px solid var(--line);
}

.utility-form {
    display: grid;
    align-content: start;
    gap: 12px;
    padding: 18px;
}

.utility-form + .utility-form {
    border-left: 1px solid var(--line);
}

.form-section-title h3 {
    margin: 0;
    color: var(--brand-dark);
    font-size: 0.98rem;
}

.form-section-title p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 0.84rem;
}

.utility-form-actions {
    display: flex;
    gap: 8px;
}

.utility-table-wrap {
    position: relative;
    overflow-x: auto;
    min-height: 300px;
    border-top: 1px solid var(--line);
}

.utility-table {
    min-width: 820px;
}

.history-table {
    min-width: 980px;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 800;
}

.status-pill.is-active,
.audit-action.is-create,
.audit-action.is-update {
    color: #02734e;
    background: #dcf8ed;
}

.status-pill.is-inactive,
.audit-action.is-delete {
    color: var(--danger);
    background: var(--danger-bg);
}

.audit-action {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 800;
}

.utility-empty {
    display: grid;
    min-height: 300px;
    place-items: center;
    padding: 44px 20px;
    text-align: center;
}

.utility-empty svg {
    width: 42px;
    height: 42px;
    color: var(--brand);
    stroke: currentColor;
}

.utility-empty p {
    margin: 8px 0 0;
    color: var(--muted);
}

.utility-language-panel {
    width: min(575px, 100%);
    min-height: auto;
    margin: 0 auto;
}

.utility-language-list,
.utility-manual-list {
    display: grid;
    gap: 12px;
    padding: 18px;
}

.utility-choice-card {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
    min-height: 88px;
    width: 100%;
    padding: 14px 18px;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--text);
    background: var(--panel);
    text-align: left;
    text-decoration: none;
    font: inherit;
    cursor: pointer;
}

.utility-choice-card:hover,
.utility-choice-card.is-active {
    border-color: var(--brand);
    background: var(--focus);
}

.utility-choice-icon {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--brand);
    background: var(--focus);
    font-size: 1.25rem;
}

.utility-choice-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
}

.utility-choice-copy strong {
    color: var(--brand-dark);
}

.utility-choice-copy span {
    color: var(--muted);
    line-height: 1.35;
}

.checkbox-row {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
}

.checkbox-row input {
    width: 20px;
    height: 20px;
    accent-color: var(--brand);
}

.language-options {
    display: grid;
    gap: 12px;
}

.language-option {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 14px 16px;
    font-weight: 800;
}

.language-option input {
    width: 20px;
    height: 20px;
    accent-color: var(--brand);
}

.language-flag {
    display: inline-flex;
    width: 34px;
    justify-content: center;
    font-size: 1.45rem;
    line-height: 1;
}

.language-label {
    margin-right: auto;
}

.status.active {
    background: #dcf8ed;
    color: #02734e;
}

.status.blocked {
    background: #fff0ec;
    color: #b73232;
}

.readonly-field {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #f8fbfa;
    padding: 10px 12px;
}

.readonly-text {
    min-height: 340px;
    white-space: pre-wrap;
}

.print-field-value,
.print-control-value {
    display: none;
}

@media print {
    @page {
        size: A4 portrait;
        margin: 0;
    }

    :root,
    .dark-theme {
        color-scheme: light;
        --bg: #ffffff;
        --panel: #ffffff;
        --text: #111111;
        --muted: #444444;
        --line: #b8c8c2;
        --brand: #1f766b;
        --brand-dark: #1f766b;
        --focus: #ffffff;
        --shadow: none;
    }

    html,
    body {
        background: #ffffff !important;
        color: #111111 !important;
        font-size: 9pt !important;
        line-height: 1.22 !important;
        width: auto !important;
    }

    body {
        margin: 0 !important;
        padding: 9mm 11mm !important;
    }

    *,
    *::before,
    *::after {
        box-shadow: none !important;
        text-shadow: none !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .central-header,
    .edit-title,
    .notice,
    .central-auth-loading,
    .tab-list,
    .title-actions,
    .button,
    .autosave-status,
    .attachment-actions {
        display: none !important;
    }

    main {
        margin: 0 !important;
        max-width: none !important;
        padding: 0 !important;
        width: 100% !important;
    }

    .panel,
    .tabs-panel,
    .tab-content {
        border: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
    }

    .tabs-panel {
        overflow: visible !important;
    }

    .edit-layout {
        gap: 0 !important;
    }

    .stats-print-heading {
        display: block !important;
        margin: 0 0 6mm;
        padding: 0 0 2.5mm;
        border-bottom: 2px solid #1f766b;
        color: #0a5f56;
        font-size: 18pt;
        font-weight: 900;
        line-height: 1.1;
    }

    .tab-content::before {
        content: attr(data-print-title);
        display: block;
        margin: 0 0 6mm;
        padding: 0 0 2.5mm;
        border-bottom: 2px solid #1f766b;
        color: #0a5f56;
        font-size: 18pt;
        font-weight: 900;
        line-height: 1.1;
    }

    .tab-content > * > .form-section:first-child > .section-title:first-child {
        display: none !important;
    }

    .form-section {
        break-inside: auto;
        display: block !important;
        gap: 0 !important;
        margin-top: 5mm !important;
        page-break-inside: auto;
        padding-top: 4mm !important;
        border-top: 1px solid #d1ded9 !important;
    }

    .form-section:first-child {
        border-top: 0 !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
    }

    .section-title {
        break-after: avoid;
        color: #0a5f56 !important;
        font-size: 11.5pt !important;
        font-weight: 900 !important;
        line-height: 1.18 !important;
        margin: 0 0 3mm !important;
        page-break-after: avoid;
        padding-bottom: 1.5mm;
        border-bottom: 1px solid #d9e6e1;
    }

    .form-grid {
        align-items: start !important;
        display: grid !important;
        gap: 3mm 3.5mm !important;
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
    }

    .checkbox-grid,
    .inline-checks {
        gap: 2mm 3mm !important;
    }

    .span-2,
    .span-3,
    .span-4 {
        grid-column: span 2 !important;
    }

    .span-5,
    .span-6 {
        grid-column: span 3 !important;
    }

    .span-8 {
        grid-column: span 4 !important;
    }

    .span-12,
    .field.full {
        grid-column: 1 / -1 !important;
    }

    .field {
        break-inside: avoid;
        gap: 1.5mm !important;
        min-width: 0 !important;
        page-break-inside: avoid;
    }

    .field label,
    .check-option {
        color: #111111 !important;
        font-size: 8.5pt !important;
        font-weight: 800 !important;
        line-height: 1.2 !important;
    }

    .field > input:not([type="checkbox"]):not([type="radio"]),
    .field > textarea,
    .field > select,
    .field > .readonly-field,
    .field > .choice-group {
        display: none !important;
    }

    .print-field-value,
    .print-control-value {
        background: #ffffff !important;
        border: 1px solid #b8c8c2 !important;
        border-radius: 4px !important;
        color: #111111 !important;
        display: block !important;
        font-size: 9pt !important;
        line-height: 1.2 !important;
        min-height: 7mm !important;
        overflow-wrap: anywhere !important;
        padding: 1.6mm 2mm !important;
        white-space: pre-wrap !important;
    }

    .print-field-value.is-empty,
    .print-control-value.is-empty {
        color: transparent !important;
    }

    .print-field-value.is-multiline,
    .print-control-value.is-multiline {
        min-height: 13mm !important;
    }

    .checkbox-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }

    .check-option {
        align-items: center !important;
        break-inside: avoid;
        min-height: 5.5mm !important;
        page-break-inside: avoid;
    }

    .check-option input {
        width: 12px !important;
        height: 12px !important;
        min-height: 12px !important;
        padding: 0 !important;
    }

    .choice-option {
        min-height: 5.5mm !important;
    }

    .medication-wrap,
    .payment-history-wrap,
    .utility-table-wrap {
        overflow: visible !important;
    }

    .sheet-table,
    .payment-history-table,
    .attendance-table,
    .medication-table,
    .scoring-table {
        font-size: 7.6pt !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        width: 100% !important;
    }

    .sheet-table th,
    .sheet-table td,
    .payment-history-table th,
    .payment-history-table td {
        overflow-wrap: anywhere !important;
        padding: 1.8mm 2mm !important;
        vertical-align: top !important;
    }

    .sheet-table tr,
    .payment-history-table tr {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .sheet-table input:not([type="checkbox"]):not([type="radio"]),
    .sheet-table textarea,
    .sheet-table select {
        display: none !important;
    }

    .sheet-table .question-cell,
    .sheet-table .observations-cell,
    .attendance-table .meta-cell,
    .attendance-table .text-cell,
    .medication-table .medicine-name,
    .medication-table .medicine-notes,
    .scoring-table .criteria-cell {
        min-width: 0 !important;
    }

    .attendance-meta,
    .sheet-checks {
        gap: 1.5mm !important;
    }

    .diagram-toolbar,
    .diagram-help,
    .diagram-data {
        display: none !important;
    }

    .diagram-wrap {
        display: grid !important;
        gap: 3mm !important;
        grid-template-columns: 1fr !important;
    }

    .diagram-canvas {
        min-height: 105mm !important;
    }

    .diagram-canvas svg {
        height: 105mm !important;
    }

    .diagram-legend {
        break-inside: avoid;
        page-break-inside: avoid;
        padding: 2mm !important;
    }

    .diagram-legend ul {
        gap: 1.5mm 3mm !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

@media (max-width: 760px) {
    .topbar,
    .toolbar,
    .search-form,
    .actions {
        align-items: stretch;
        flex-direction: column;
    }

    .topbar {
        display: flex;
    }

    .topbar .button {
        justify-self: auto;
    }

    .grid {
        grid-template-columns: 1fr;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .form-grid,
    .checkbox-grid,
    .inline-checks,
    .diagram-wrap {
        grid-template-columns: 1fr;
    }

    .span-2,
    .span-3,
    .span-4,
    .span-5,
    .span-6,
    .span-8,
    .span-12 {
        grid-column: 1 / -1;
    }

    .edit-title {
        align-items: stretch;
        flex-direction: column;
    }

    .title-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .tabs-panel {
        display: block;
    }

    .tab-list {
        border-bottom: 1px solid var(--line);
    }

    .header-tools,
    .manager-grid {
        grid-template-columns: 1fr;
    }

    .utility-panel-head,
    .utility-head-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .utility-forms {
        grid-template-columns: 1fr;
    }

    .utility-form + .utility-form {
        border-left: 0;
        border-top: 1px solid var(--line);
    }

    .manual-choice-grid {
        grid-template-columns: 1fr;
    }

    .manager-head {
        align-items: stretch;
        flex-direction: column;
    }

    .manager-column + .manager-column {
        border-left: 0;
        border-top: 1px solid var(--line);
    }

    .button {
        width: 100%;
    }
}

header.central-header {
    border-bottom: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.92);
    color: var(--text);
    padding: 0;
}

.dark-theme header.central-header {
    background: var(--bg);
}

.central-topbar {
    display: grid;
    grid-template-columns: minmax(270px, auto) minmax(300px, 1fr) auto;
    align-items: center;
    gap: 18px;
    width: min(1560px, calc(100% - 32px));
    min-height: 96px;
    margin: 0 auto;
}

.central-brand,
.central-nav-link,
.central-icon-link,
.central-primary-action {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
}

.central-brand {
    gap: 14px;
    min-width: 0;
    color: var(--text);
}

.central-brand-symbol {
    display: grid;
    width: 74px;
    height: 74px;
    flex: 0 0 74px;
    place-items: center;
}

.central-brand-symbol img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.central-brand-copy {
    display: grid;
    min-width: 0;
    line-height: 1.2;
}

.central-brand-copy strong {
    color: #071b4d;
    font-size: 1.34rem;
    font-weight: 850;
}

.dark-theme .central-brand-copy strong {
    color: var(--text);
}

.central-brand-copy span {
    margin-top: 4px;
    color: var(--muted);
    font-size: 0.96rem;
}

.central-brand-copy b {
    color: #071b4d;
    font-size: 0.9rem;
}

.dark-theme .central-brand-copy b {
    color: var(--text);
}

.central-loading-indicator {
    display: inline-flex;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    opacity: 0;
    pointer-events: none;
    transform: scale(0.86);
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.central-loading-indicator.is-visible {
    opacity: 1;
    transform: scale(1);
}

.central-loading-dot,
.central-auth-loading span {
    width: 22px;
    height: 22px;
    border: 3px solid rgba(47, 125, 115, 0.2);
    border-top-color: var(--brand);
    border-radius: 999px;
    animation: central-loading-spin 0.75s linear infinite;
}

.dark-theme .central-loading-dot,
.dark-theme .central-auth-loading span {
    border-color: rgba(24, 201, 150, 0.2);
    border-top-color: var(--brand);
}

.central-auth-loading {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    background: var(--bg);
}

html:not([data-central-auth-pending="true"]) .central-auth-loading {
    display: none;
}

@keyframes central-loading-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .central-loading-dot,
    .central-auth-loading span {
        animation-duration: 1.6s;
    }
}

.central-nav,
.central-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.central-nav {
    justify-content: center;
}

.central-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
}

.central-nav-link {
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--muted);
    font-weight: 850;
    padding: 0 10px;
}

.central-nav-link:hover,
.central-nav-link.active {
    border-color: rgba(47, 125, 115, 0.32);
    background: var(--focus);
    color: var(--brand-dark);
}

.central-icon-link {
    justify-content: center;
    width: 44px;
    height: 44px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 6px;
    color: #071b4d;
    background: var(--panel);
}

.dark-theme .central-icon-link {
    color: var(--text);
}

.central-icon-link:hover {
    border-color: var(--brand);
    color: var(--brand-dark);
    background: var(--focus);
}

.central-menu-wrap {
    position: relative;
}

.central-account-wrap {
    position: relative;
}

.central-menu-button {
    list-style: none;
    cursor: pointer;
}

.central-account-button {
    list-style: none;
    cursor: pointer;
}

.central-menu-button::-webkit-details-marker {
    display: none;
}

.central-account-button::-webkit-details-marker {
    display: none;
}

.central-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    display: grid;
    width: min(280px, calc(100vw - 32px));
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.central-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-bottom: 1px solid var(--line);
    color: var(--text);
    background: transparent;
    font: inherit;
    text-decoration: none;
    font-weight: 800;
    cursor: pointer;
}

.central-menu-item:last-child {
    border-bottom: 0;
}

.central-menu-item:hover {
    color: var(--brand-dark);
    background: var(--focus);
}

.central-account-menu {
    gap: 10px;
    padding: 12px;
}

.central-account-name {
    display: block;
    max-width: 100%;
    overflow: hidden;
    color: var(--text);
    font-size: 0.98rem;
    font-weight: 850;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.central-account-menu .central-menu-item {
    justify-content: center;
    min-height: 42px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel);
}

.central-account-menu .central-menu-item:hover {
    border-color: var(--brand);
    background: var(--focus);
}

.central-menu-item svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.central-primary-action {
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    min-width: 150px;
    border-radius: 6px;
    background: #0ab47d;
    color: #ffffff;
    font-weight: 850;
    padding: 0 16px;
    white-space: nowrap;
}

.central-primary-action:hover {
    background: #078a65;
    color: #ffffff;
}

.central-nav-link svg,
.central-icon-link svg {
    width: 19px;
    height: 19px;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.central-icon-link span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@media (max-width: 1060px) {
    .central-topbar {
        grid-template-columns: 1fr;
        align-items: stretch;
        gap: 12px;
        padding: 12px 0;
    }

    .central-nav,
    .central-actions {
        justify-content: flex-start;
    }

    .central-nav {
        overflow-x: auto;
        padding-bottom: 2px;
    }
}

@media (max-width: 620px) {
    .central-topbar {
        width: min(100% - 20px, 1560px);
    }

    .central-primary-action {
        flex: 1 1 160px;
    }
}
"""


APP_SCRIPT = """
(() => {
    const printGeneratedSelector = "[data-print-generated='true']";
    const cleanupPrintLayout = () => {
        document.querySelectorAll(printGeneratedSelector).forEach((element) => element.remove());
    };
    const readableOptionText = (input) => {
        const label = input.closest("label");
        if (!label) {
            return "";
        }
        return Array.from(label.childNodes)
            .filter((node) => node !== input)
            .map((node) => node.textContent || "")
            .join(" ")
            .replace(/\\s+/g, " ")
            .trim();
    };
    const controlPrintValue = (control) => {
        if (!control) {
            return "";
        }
        const tag = control.tagName.toLowerCase();
        const type = (control.getAttribute("type") || "").toLowerCase();
        if (tag === "select") {
            const selected = control.selectedOptions && control.selectedOptions[0];
            return selected ? selected.textContent.trim() : "";
        }
        if (type === "checkbox" || type === "radio") {
            return control.checked ? readableOptionText(control) : "";
        }
        return control.value || control.textContent || "";
    };
    const fieldPrintValue = (field) => {
        const choiceGroup = field.querySelector(".choice-group");
        if (choiceGroup) {
            return Array.from(choiceGroup.querySelectorAll("input:checked"))
                .map(readableOptionText)
                .filter(Boolean)
                .join(", ");
        }
        const readonlyField = field.querySelector(".readonly-field");
        if (readonlyField) {
            return readonlyField.textContent.trim();
        }
        const control = field.querySelector("textarea, select, input:not([type='hidden']):not([type='checkbox']):not([type='radio'])");
        return controlPrintValue(control).trim();
    };
    const appendPrintValue = (target, value, className, multiline = false) => {
        const element = document.createElement("div");
        element.className = className;
        element.dataset.printGenerated = "true";
        if (!value) {
            element.classList.add("is-empty");
        }
        if (multiline) {
            element.classList.add("is-multiline");
        }
        element.textContent = value || " ";
        target.appendChild(element);
    };
    const preparePrintLayout = () => {
        cleanupPrintLayout();
        document.querySelectorAll(".field").forEach((field) => {
            if (!field.querySelector("input, textarea, select, .readonly-field")) {
                return;
            }
            const value = fieldPrintValue(field);
            const multiline = Boolean(field.querySelector("textarea, .readonly-text"));
            appendPrintValue(field, value, "print-field-value", multiline);
        });
        document.querySelectorAll(".sheet-table input:not([type='hidden']):not([type='checkbox']):not([type='radio']), .sheet-table textarea, .sheet-table select").forEach((control) => {
            if (control.closest(".field")) {
                return;
            }
            const parent = control.parentElement;
            if (!parent) {
                return;
            }
            appendPrintValue(parent, controlPrintValue(control).trim(), "print-control-value", control.tagName.toLowerCase() === "textarea");
        });
    };
    window.addEventListener("beforeprint", preparePrintLayout);
    window.addEventListener("afterprint", cleanupPrintLayout);

    window.printUtentePage = () => {
        const originalTitle = document.title;
        const restoreTitle = () => {
            document.title = originalTitle;
            window.removeEventListener("afterprint", restoreTitle);
            cleanupPrintLayout();
        };
        preparePrintLayout();
        document.title = " ";
        window.addEventListener("afterprint", restoreTitle, { once: true });
        window.print();
        window.setTimeout(restoreTitle, 1000);
    };

    const globalThemeKeys = ["central-theme", "socios-theme", "mentemovimento-theme"];
    const loadGlobalTheme = () => {
        for (const key of globalThemeKeys) {
            try {
                const value = window.localStorage.getItem(key);
                if (value === "dark" || value === "light") {
                    return value;
                }
            } catch (_error) {
                return "light";
            }
        }
        return "light";
    };
    const persistGlobalTheme = (theme) => {
        globalThemeKeys.forEach((key) => {
            try {
                window.localStorage.setItem(key, theme);
            } catch (_error) {
                // O tema continua aplicado mesmo que o browser bloqueie localStorage.
            }
        });
    };
    const applyGlobalTheme = (theme) => {
        const isDark = theme === "dark";
        document.documentElement.classList.toggle("dark-theme", isDark);
        document.body.classList.toggle("dark-theme", isDark);
        document.querySelectorAll("[data-global-theme-toggle]").forEach((element) => {
            element.setAttribute("title", isDark ? "Tema claro" : "Tema escuro");
            element.setAttribute("aria-label", isDark ? "Tema claro" : "Tema escuro");
            const label = element.querySelector("[data-global-theme-label]");
            if (label) {
                label.textContent = isDark ? "Claro" : "Escuro";
            }
            const darkIcon = element.querySelector("[data-theme-dark-icon]");
            const lightIcon = element.querySelector("[data-theme-light-icon]");
            if (darkIcon) {
                darkIcon.hidden = isDark;
            }
            if (lightIcon) {
                lightIcon.hidden = !isDark;
            }
        });
    };
    applyGlobalTheme(loadGlobalTheme());
    document.querySelectorAll("[data-global-theme-toggle]").forEach((element) => {
        element.addEventListener("click", () => {
            const nextTheme = loadGlobalTheme() === "dark" ? "light" : "dark";
            persistGlobalTheme(nextTheme);
            applyGlobalTheme(nextTheme);
        });
    });
    window.addEventListener("storage", (event) => {
        if (globalThemeKeys.includes(event.key)) {
            applyGlobalTheme(loadGlobalTheme());
        }
    });

    const globalLanguageKeys = ["central-language", "socios-language", "mentemovimento-language"];
    const loadGlobalLanguage = () => {
        for (const key of globalLanguageKeys) {
            try {
                const value = window.localStorage.getItem(key);
                if (value === "pt" || value === "en") {
                    return value;
                }
            } catch (_error) {
                return "";
            }
        }
        return "";
    };
    const persistGlobalLanguage = (language) => {
        globalLanguageKeys.forEach((key) => {
            try {
                window.localStorage.setItem(key, language);
            } catch (_error) {
                // O idioma fica guardado na conta mesmo que o browser bloqueie localStorage.
            }
        });
    };
    const currentLanguage = document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "pt";
    const storedLanguage = loadGlobalLanguage();
    const writeLanguageCookie = (language) => {
        const cookieValue = `utentes_language=${language}; Max-Age=31536000; SameSite=Lax`;
        document.cookie = `${cookieValue}; Path=/area/utentes`;
        document.cookie = `${cookieValue}; Path=/`;
    };
    const syncLanguage = (language) => {
        if (!language || language === currentLanguage || window.location.pathname === "/login") {
            return;
        }
        const syncKey = "utentes-language-sync";
        const syncValue = `${currentLanguage}->${language}`;
        if (window.sessionStorage.getItem(syncKey) === syncValue) {
            return;
        }
        window.sessionStorage.setItem(syncKey, syncValue);
        writeLanguageCookie(language);
        window.location.reload();
    };
    if (storedLanguage) {
        persistGlobalLanguage(storedLanguage);
        syncLanguage(storedLanguage);
    } else {
        persistGlobalLanguage(currentLanguage);
    }
    window.addEventListener("storage", (event) => {
        if (globalLanguageKeys.includes(event.key)) {
            syncLanguage(loadGlobalLanguage());
        }
    });

    const loadingIndicator = document.querySelector("[data-loading-indicator]");
    let loadingDelayTimer = 0;
    let loadingHideTimer = 0;
    let pendingLoads = 0;
    const revealLoading = () => {
        if (!loadingIndicator) {
            return;
        }
        window.clearTimeout(loadingHideTimer);
        window.clearTimeout(loadingDelayTimer);
        loadingDelayTimer = window.setTimeout(() => {
            loadingIndicator.classList.add("is-visible");
        }, 120);
    };
    const concealLoading = () => {
        if (!loadingIndicator) {
            return;
        }
        window.clearTimeout(loadingDelayTimer);
        window.clearTimeout(loadingHideTimer);
        loadingHideTimer = window.setTimeout(() => {
            loadingIndicator.classList.remove("is-visible");
        }, 80);
    };
    const beginLoading = () => {
        pendingLoads += 1;
        revealLoading();
    };
    const endLoading = () => {
        pendingLoads = Math.max(0, pendingLoads - 1);
        if (pendingLoads === 0) {
            concealLoading();
        }
    };
    const showTemporaryLoading = (duration = 8000) => {
        beginLoading();
        window.setTimeout(endLoading, duration);
    };
    window.addEventListener("pageshow", () => {
        pendingLoads = 0;
        concealLoading();
    });
    window.addEventListener("load", () => {
        pendingLoads = 0;
        concealLoading();
    });
    window.addEventListener("beforeunload", beginLoading);
    if (typeof window.fetch === "function") {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (...args) => {
            beginLoading();
            return nativeFetch(...args).finally(endLoading);
        };
    }
    document.addEventListener("submit", (event) => {
        if (!event.defaultPrevented) {
            beginLoading();
        }
    });
    document.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }
        const link = event.target.closest("a[href]");
        if (!link) {
            return;
        }
        const target = (link.getAttribute("target") || "").toLowerCase();
        if (target && target !== "_self") {
            return;
        }
        const rawHref = link.getAttribute("href") || "";
        if (!rawHref || rawHref.startsWith("#") || rawHref.toLowerCase().startsWith("javascript:")) {
            return;
        }
        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (_error) {
            return;
        }
        if (url.origin !== window.location.origin) {
            return;
        }
        if (link.hasAttribute("download") || url.pathname.startsWith("/backup/")) {
            showTemporaryLoading();
            return;
        }
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
            return;
        }
        beginLoading();
    });

    const closeHeaderMenus = () => {
        document.querySelectorAll(".central-menu-wrap[open], .central-account-wrap[open]").forEach((menu) => {
            menu.open = false;
        });
    };
    document.querySelectorAll(".central-menu-wrap > summary").forEach((summary) => {
        summary.addEventListener("click", () => {
            document.querySelectorAll(".central-account-wrap[open]").forEach((menu) => {
                menu.open = false;
            });
        });
    });
    document.querySelectorAll(".central-account-wrap > summary").forEach((summary) => {
        summary.addEventListener("click", () => {
            document.querySelectorAll(".central-menu-wrap[open]").forEach((menu) => {
                menu.open = false;
            });
        });
    });
    document.addEventListener("click", (event) => {
        if (event.target.closest(".central-menu-wrap, .central-account-wrap")) {
            return;
        }
        closeHeaderMenus();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeHeaderMenus();
        }
    });

    const manualDialog = document.getElementById("manualChoiceDialog");
    const openManualDialogButton = document.querySelector("[data-manual-dialog-open]");
    const closeManualDialogButton = document.getElementById("closeManualChoiceDialog");
    const closeManualDialog = () => {
        if (!manualDialog) {
            return;
        }
        if (manualDialog.open && typeof manualDialog.close === "function") {
            manualDialog.close();
        } else {
            manualDialog.removeAttribute("open");
        }
    };
    if (manualDialog && openManualDialogButton) {
        openManualDialogButton.addEventListener("click", (event) => {
            event.preventDefault();
            const menu = openManualDialogButton.closest("details");
            if (menu) {
                menu.open = false;
            }
            if (typeof manualDialog.showModal === "function") {
                manualDialog.showModal();
            } else {
                manualDialog.setAttribute("open", "");
            }
        });
        manualDialog.addEventListener("click", (event) => {
            if (event.target === manualDialog) {
                closeManualDialog();
            }
        });
    }
    if (closeManualDialogButton) {
        closeManualDialogButton.addEventListener("click", closeManualDialog);
    }

    const frameDialog = document.getElementById("commonFrameDialog");
    const frameDialogTitle = document.getElementById("commonFrameDialogTitle");
    const frameDialogFrame = document.getElementById("commonFrameDialogFrame");
    const closeFrameDialogButton = document.getElementById("closeCommonFrameDialog");
    const closeFrameDialog = () => {
        if (!frameDialog) {
            return;
        }
        if (frameDialog.open && typeof frameDialog.close === "function") {
            frameDialog.close();
        } else {
            frameDialog.removeAttribute("open");
        }
        if (frameDialogFrame) {
            frameDialogFrame.setAttribute("src", "about:blank");
        }
        frameDialog.classList.remove("utility-frame");
    };
    document.querySelectorAll("[data-frame-dialog-open]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            if (!frameDialog || !frameDialogFrame) {
                return;
            }
            const menu = button.closest("details");
            if (menu) {
                menu.open = false;
            }
            const target = button.getAttribute("data-frame-dialog-open") || "/";
            const title = button.getAttribute("data-frame-dialog-title") || button.textContent.trim();
            const utilityFrameTargets = ["/utilizadores", "/historico", "/idioma"];
            const isUtilityFrame = utilityFrameTargets.some((item) => target === item || target.endsWith(item));
            frameDialog.classList.toggle("utility-frame", isUtilityFrame);
            if (frameDialogTitle) {
                frameDialogTitle.textContent = title;
            }
            frameDialogFrame.setAttribute("title", title);
            frameDialogFrame.setAttribute("src", target);
            if (typeof frameDialog.showModal === "function") {
                frameDialog.showModal();
            } else {
                frameDialog.setAttribute("open", "");
            }
        });
    });
    if (frameDialog) {
        frameDialog.addEventListener("click", (event) => {
            if (event.target === frameDialog) {
                closeFrameDialog();
            }
        });
    }
    if (closeFrameDialogButton) {
        closeFrameDialogButton.addEventListener("click", closeFrameDialog);
    }

    const quickPaymentDialog = document.getElementById("quickPaymentDialog");
    const quickPaymentId = document.getElementById("quickPaymentId");
    const quickPaymentName = document.getElementById("quickPaymentName");
    const quickPaymentMonth = document.getElementById("quickPaymentMonth");
    const closeQuickPaymentDialog = () => {
        if (!quickPaymentDialog) {
            return;
        }
        if (quickPaymentDialog.open && typeof quickPaymentDialog.close === "function") {
            quickPaymentDialog.close();
        } else {
            quickPaymentDialog.removeAttribute("open");
        }
    };
    document.querySelectorAll("[data-quick-payment-open]").forEach((button) => {
        button.addEventListener("click", () => {
            if (!quickPaymentDialog || !quickPaymentId) {
                return;
            }
            quickPaymentId.value = button.getAttribute("data-client-id") || "";
            if (quickPaymentName) {
                quickPaymentName.textContent = button.getAttribute("data-client-name") || "";
            }
            if (quickPaymentMonth) {
                quickPaymentMonth.textContent = button.getAttribute("data-payment-month") || "";
            }
            if (typeof quickPaymentDialog.showModal === "function") {
                quickPaymentDialog.showModal();
            } else {
                quickPaymentDialog.setAttribute("open", "");
            }
        });
    });
    document.querySelectorAll("[data-quick-payment-close]").forEach((button) => {
        button.addEventListener("click", closeQuickPaymentDialog);
    });
    if (quickPaymentDialog) {
        quickPaymentDialog.addEventListener("click", (event) => {
            if (event.target === quickPaymentDialog) {
                closeQuickPaymentDialog();
            }
        });
    }

    const form = document.getElementById("edit-utente-form");
    if (!form) {
        return;
    }

    const status = document.querySelector("[data-autosave-status]");
    const tabLinks = Array.from(document.querySelectorAll(".tab-link[href^='/editar']"));
    const diagramStates = [];
    const unsavedMessage = "Existem alterações por guardar. Queres sair sem guardar?";
    let hasUnsavedChanges = false;
    let allowNavigation = false;

    function markUnsaved() {
        hasUnsavedChanges = true;
        setStatus("Alterações por guardar", "saving");
    }

    function svgElement(name, attrs = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    function diagramDefaults(kind) {
        if (kind === "ecomapa") {
            return {
                kind,
                notes: "",
                nodes: [{ id: "n1", type: "central", label: "Utente / família", x: 500, y: 260 }],
                edges: [],
            };
        }
        return { kind, notes: "", nodes: [], edges: [] };
    }

    function parseDiagram(raw, kind) {
        if (!raw || !raw.trim()) {
            return diagramDefaults(kind);
        }
        try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                parsed.kind = parsed.kind || kind;
                parsed.notes = parsed.notes || "";
                return parsed;
            }
        } catch (_error) {
            return { ...diagramDefaults(kind), notes: raw };
        }
        return diagramDefaults(kind);
    }

    function zigzagPath(a, b, amplitude = 8, segments = 12) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const points = [];
        for (let index = 0; index <= segments; index += 1) {
            const t = index / segments;
            const offset = index === 0 || index === segments ? 0 : (index % 2 ? amplitude : -amplitude);
            points.push(`${a.x + dx * t + nx * offset},${a.y + dy * t + ny * offset}`);
        }
        return `M ${points.join(" L ")}`;
    }

    function lineAttrs(edge) {
        const attrs = { fill: "none", stroke: "#24413b", "stroke-width": "2.4" };
        if (["union", "weak", "cutoff"].includes(edge.type)) {
            attrs["stroke-dasharray"] = "8 7";
        }
        if (["conflict", "stress"].includes(edge.type)) {
            attrs.stroke = "#d64545";
            attrs["stroke-width"] = "3";
        }
        if (edge.type === "close" || edge.type === "strong") {
            attrs.stroke = "#12805c";
            attrs["stroke-width"] = "4";
        }
        if (edge.type === "resource_to") {
            attrs["marker-end"] = "url(#arrow-end)";
            attrs.stroke = "#12805c";
        }
        if (edge.type === "resource_from") {
            attrs["marker-start"] = "url(#arrow-start)";
            attrs.stroke = "#12805c";
        }
        if (edge.type === "resource_both") {
            attrs["marker-start"] = "url(#arrow-start)";
            attrs["marker-end"] = "url(#arrow-end)";
            attrs.stroke = "#12805c";
        }
        return attrs;
    }

    function genogramParentChildPath(parentA, parentB, child) {
        const midX = (parentA.x + parentB.x) / 2;
        const midY = (parentA.y + parentB.y) / 2;
        const childJointY = (midY + child.y) / 2;
        return `M ${parentA.x},${parentA.y} L ${parentB.x},${parentB.y} M ${midX},${midY} L ${midX},${childJointY} L ${child.x},${childJointY} L ${child.x},${child.y}`;
    }

    function findNode(state, id) {
        return state.data.nodes.find((node) => node.id === id);
    }

    function toggleNodeSelection(state, nodeId) {
        state.selectedEdge = "";
        if (state.selectedNodes.includes(nodeId)) {
            state.selectedNodes = state.selectedNodes.filter((id) => id !== nodeId);
        } else {
            const maxSelected = state.kind === "genograma" ? 3 : 2;
            state.selectedNodes = [...state.selectedNodes.slice(-(maxSelected - 1)), nodeId];
        }
    }

    function syncDiagram(state) {
        state.data.notes = state.notes.value;
        state.textarea.value = JSON.stringify(state.data);
    }

    function syncAllDiagrams() {
        diagramStates.forEach(syncDiagram);
    }

    function calculateAgeFromBirthDate(value) {
        const text = String(value || "").trim();
        const isoMatch = text.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
        const ptMatch = text.match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/);
        const match = isoMatch || ptMatch;
        if (!match) {
            return "";
        }
        const birthYear = Number(isoMatch ? match[1] : match[3]);
        const birthMonth = Number(match[2]);
        const birthDay = Number(isoMatch ? match[3] : match[1]);
        const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
        if (
            birthDate.getFullYear() !== birthYear ||
            birthDate.getMonth() !== birthMonth - 1 ||
            birthDate.getDate() !== birthDay
        ) {
            return "";
        }
        const today = new Date();
        if (birthDate > today) {
            return "";
        }
        let age = today.getFullYear() - birthYear;
        const hadBirthdayThisYear =
            today.getMonth() > birthMonth - 1 ||
            (today.getMonth() === birthMonth - 1 && today.getDate() >= birthDay);
        if (!hadBirthdayThisYear) {
            age -= 1;
        }
        return String(Math.max(age, 0));
    }

    function setupAgeCalculation(birthName, ageName) {
        const birthInput = form.querySelector(`[name="${birthName}"]`);
        const ageInput = form.querySelector(`[name="${ageName}"]`);
        if (!birthInput || !ageInput || birthInput.disabled || ageInput.disabled) {
            return;
        }
        const updateAge = (notifyChange = false) => {
            const age = calculateAgeFromBirthDate(birthInput.value);
            if (ageInput.value !== age) {
                ageInput.value = age;
                if (notifyChange) {
                    markUnsaved();
                }
            }
        };
        birthInput.addEventListener("input", () => updateAge(true));
        birthInput.addEventListener("change", () => updateAge(true));
        updateAge(false);
    }

    function initAgeCalculations() {
        [
            ["data_nascimento", "idade"],
            ["em_data_nascimento", "em_idade"],
            ["diag_agregado_a_data_nascimento", "diag_agregado_a_idade"],
            ["diag_agregado_b_data_nascimento", "diag_agregado_b_idade"],
            ["diag_agregado_c_data_nascimento", "diag_agregado_c_idade"],
            ["diag_agregado_d_data_nascimento", "diag_agregado_d_idade"],
            ["diag_agregado_e_data_nascimento", "diag_agregado_e_idade"],
        ].forEach(([birthName, ageName]) => setupAgeCalculation(birthName, ageName));
    }

    function drawSlash(svg, x, y, count) {
        for (let index = 0; index < count; index += 1) {
            const shift = index * 12 - (count - 1) * 6;
            svg.appendChild(svgElement("line", {
                x1: x + shift - 7,
                y1: y - 13,
                x2: x + shift + 7,
                y2: y + 13,
                stroke: "#24413b",
                "stroke-width": "2.5",
            }));
        }
    }

    function renderDiagram(state) {
        const { data, canvas, kind, readonly } = state;
        canvas.innerHTML = "";
        const svg = svgElement("svg", { viewBox: "0 0 1000 520", role: "img" });
        const defs = svgElement("defs");
        defs.appendChild(svgElement("marker", {
            id: "arrow-end",
            markerWidth: "10",
            markerHeight: "10",
            refX: "8",
            refY: "3",
            orient: "auto",
            markerUnits: "strokeWidth",
        }));
        defs.querySelector("#arrow-end").appendChild(svgElement("path", { d: "M0,0 L0,6 L9,3 z", fill: "#12805c" }));
        defs.appendChild(svgElement("marker", {
            id: "arrow-start",
            markerWidth: "10",
            markerHeight: "10",
            refX: "1",
            refY: "3",
            orient: "auto",
            markerUnits: "strokeWidth",
        }));
        defs.querySelector("#arrow-start").appendChild(svgElement("path", { d: "M9,0 L9,6 L0,3 z", fill: "#12805c" }));
        svg.appendChild(defs);

        data.edges.forEach((edge) => {
            const source = findNode(state, edge.source);
            const target = findNode(state, edge.target);
            const coParent = edge.coParent ? findNode(state, edge.coParent) : null;
            if (!source || !target || (edge.type === "parent_child" && edge.coParent && !coParent)) {
                return;
            }
            let path;
            if (kind === "genograma" && edge.type === "parent_child" && coParent) {
                path = genogramParentChildPath(source, coParent, target);
            } else if (["conflict", "stress"].includes(edge.type)) {
                path = zigzagPath(source, target);
            } else {
                path = `M ${source.x},${source.y} L ${target.x},${target.y}`;
            }
            const element = svgElement("path", { d: path, ...lineAttrs(edge) });
            element.classList.add("diagram-edge");
            if (state.selectedEdge === edge.id) {
                element.classList.add("selected");
            }
            element.addEventListener("click", (event) => {
                event.stopPropagation();
                if (readonly) {
                    return;
                }
                state.selectedEdge = edge.id;
                state.selectedNodes = [];
                renderDiagram(state);
            });
            svg.appendChild(element);
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            if (edge.type === "separated") {
                drawSlash(svg, midX, midY, 1);
            }
            if (edge.type === "divorced") {
                drawSlash(svg, midX, midY, 2);
            }
        });

        data.nodes.forEach((node) => {
            const group = svgElement("g");
            group.classList.add("diagram-node");
            if (state.selectedNodes.includes(node.id)) {
                group.classList.add("selected");
            }
            group.dataset.nodeId = node.id;
            group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
            let shape;
            if (kind === "ecomapa") {
                shape = node.type === "central"
                    ? svgElement("circle", { class: "node-shape", r: "54", fill: "#dff8ee", stroke: "#12805c", "stroke-width": "3" })
                    : svgElement("rect", { class: "node-shape", x: "-66", y: "-30", width: "132", height: "60", rx: "8", fill: "#eef6ff", stroke: "#2f5f9f", "stroke-width": "2.2" });
            } else if (node.type === "female") {
                shape = svgElement("circle", { class: "node-shape", r: "28", fill: "#ffffff", stroke: "#243d38", "stroke-width": "2.4" });
            } else if (node.type === "unknown") {
                shape = svgElement("polygon", { class: "node-shape", points: "0,-32 32,0 0,32 -32,0", fill: "#ffffff", stroke: "#243d38", "stroke-width": "2.4" });
            } else {
                shape = svgElement("rect", { class: "node-shape", x: "-28", y: "-28", width: "56", height: "56", fill: "#ffffff", stroke: "#243d38", "stroke-width": "2.4" });
            }
            group.appendChild(shape);
            if (node.deceased) {
                group.appendChild(svgElement("line", { x1: "-31", y1: "-31", x2: "31", y2: "31", stroke: "#b73232", "stroke-width": "2.7" }));
                group.appendChild(svgElement("line", { x1: "31", y1: "-31", x2: "-31", y2: "31", stroke: "#b73232", "stroke-width": "2.7" }));
            }
            const text = svgElement("text", {
                x: "0",
                y: kind === "ecomapa" ? "82" : "50",
                "text-anchor": "middle",
                fill: "#102b25",
                "font-size": "18",
                "font-weight": "700",
                stroke: "#ffffff",
                "stroke-width": "4",
                "paint-order": "stroke fill",
            });
            text.textContent = node.label || "Sem nome";
            group.appendChild(text);
            group.addEventListener("click", (event) => {
                event.stopPropagation();
                if (state.suppressNextClick) {
                    state.suppressNextClick = false;
                    return;
                }
                if (readonly) {
                    return;
                }
                toggleNodeSelection(state, node.id);
                renderDiagram(state);
            });
            if (!readonly) {
                group.addEventListener("pointerdown", (event) => {
                    event.stopPropagation();
                    state.dragCandidate = {
                        id: node.id,
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                    };
                    svg.setPointerCapture(event.pointerId);
                });
                group.addEventListener("pointerup", (event) => {
                    event.stopPropagation();
                    if (state.dragging) {
                        state.dragging = "";
                        state.dragCandidate = null;
                        state.suppressNextClick = true;
                        renderDiagram(state);
                        return;
                    }
                    if (state.dragCandidate && state.dragCandidate.id === node.id) {
                        state.dragCandidate = null;
                        state.suppressNextClick = true;
                        toggleNodeSelection(state, node.id);
                        renderDiagram(state);
                    }
                });
            }
            svg.appendChild(group);
        });

        svg.addEventListener("pointermove", (event) => {
            if (readonly || !state.dragCandidate) {
                return;
            }
            if (!state.dragging) {
                const dx = event.clientX - state.dragCandidate.startX;
                const dy = event.clientY - state.dragCandidate.startY;
                if (Math.hypot(dx, dy) < 6) {
                    return;
                }
                state.dragging = state.dragCandidate.id;
                state.suppressNextClick = true;
            }
            if (!state.dragging) {
                return;
            }
            const point = svg.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
            const node = findNode(state, state.dragging);
            if (node) {
                node.x = Math.max(48, Math.min(952, svgPoint.x));
                node.y = Math.max(48, Math.min(472, svgPoint.y));
                const group = svg.querySelector(`[data-node-id="${node.id}"]`);
                if (group) {
                    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
                }
                syncDiagram(state);
                markUnsaved();
            }
        });
        svg.addEventListener("pointerup", () => {
            const hadDrag = Boolean(state.dragging);
            const clickedNode = state.dragCandidate && !state.dragging ? state.dragCandidate.id : "";
            state.dragging = "";
            state.dragCandidate = null;
            if (clickedNode) {
                state.suppressNextClick = true;
                toggleNodeSelection(state, clickedNode);
                renderDiagram(state);
                return;
            }
            if (hadDrag) {
                renderDiagram(state);
            }
        });
        svg.addEventListener("click", () => {
            if (state.suppressNextClick) {
                state.suppressNextClick = false;
                return;
            }
            if (readonly) {
                return;
            }
            state.selectedNodes = [];
            state.selectedEdge = "";
            renderDiagram(state);
        });
        canvas.appendChild(svg);
        syncDiagram(state);
    }

    function initDiagramEditor(editor) {
        const kind = editor.dataset.diagramKind;
        const readonly = editor.dataset.readonly === "1";
        const textarea = editor.querySelector(".diagram-data");
        const notes = editor.querySelector("[data-diagram-notes]");
        const canvas = editor.querySelector("[data-diagram-canvas]");
        const state = {
            editor,
            kind,
            readonly,
            textarea,
            notes,
            canvas,
            data: parseDiagram(textarea.value, kind),
            selectedNodes: [],
            selectedEdge: "",
            dragging: "",
            dragCandidate: null,
            suppressNextClick: false,
        };
        notes.value = state.data.notes || "";
        notes.addEventListener("input", () => {
            syncDiagram(state);
            markUnsaved();
        });
        editor.querySelectorAll("[data-diagram-add]").forEach((button) => {
            button.addEventListener("click", () => {
                const type = button.dataset.diagramAdd;
                const label = prompt(type === "system" ? "Nome do sistema/rede:" : "Nome:");
                if (!label) {
                    return;
                }
                const index = state.data.nodes.length;
                state.data.nodes.push({
                    id: `n${Date.now()}${index}`,
                    type,
                    label,
                    x: 180 + (index % 4) * 190,
                    y: 110 + Math.floor(index / 4) * 120,
                });
                syncDiagram(state);
                markUnsaved();
                renderDiagram(state);
            });
        });
        const relation = editor.querySelector("[data-diagram-relation]");
        const connect = editor.querySelector("[data-diagram-connect]");
        if (connect) {
            connect.addEventListener("click", () => {
                const relationType = relation ? relation.value : "strong";
                if (kind === "genograma" && relationType === "parent_child" && state.selectedNodes.length === 3) {
                    state.data.edges.push({
                        id: `e${Date.now()}`,
                        source: state.selectedNodes[0],
                        coParent: state.selectedNodes[1],
                        target: state.selectedNodes[2],
                        type: relationType,
                    });
                } else {
                    if (state.selectedNodes.length !== 2) {
                        const message = kind === "genograma" && relationType === "parent_child"
                            ? "Seleciona dois elementos, ou seleciona primeiro os dois progenitores e depois o filho."
                            : "Seleciona dois elementos para criar a ligação.";
                        alert(message);
                        return;
                    }
                    state.data.edges.push({
                        id: `e${Date.now()}`,
                        source: state.selectedNodes[0],
                        target: state.selectedNodes[1],
                        type: relationType,
                    });
                }
                state.selectedNodes = [];
                syncDiagram(state);
                markUnsaved();
                renderDiagram(state);
            });
        }
        const edit = editor.querySelector("[data-diagram-edit]");
        if (edit) {
            edit.addEventListener("click", () => {
                const node = findNode(state, state.selectedNodes[0]);
                if (!node) {
                    alert("Seleciona um elemento para editar.");
                    return;
                }
                const label = prompt("Nome:", node.label || "");
                if (label !== null && label.trim()) {
                    node.label = label.trim();
                    syncDiagram(state);
                    markUnsaved();
                    renderDiagram(state);
                }
            });
        }
        const deceased = editor.querySelector("[data-diagram-deceased]");
        if (deceased) {
            deceased.addEventListener("click", () => {
                const node = findNode(state, state.selectedNodes[0]);
                if (!node) {
                    alert("Seleciona uma pessoa.");
                    return;
                }
                node.deceased = !node.deceased;
                syncDiagram(state);
                markUnsaved();
                renderDiagram(state);
            });
        }
        const remove = editor.querySelector("[data-diagram-delete]");
        if (remove) {
            remove.addEventListener("click", () => {
                if (state.selectedEdge) {
                    state.data.edges = state.data.edges.filter((edge) => edge.id !== state.selectedEdge);
                    state.selectedEdge = "";
                } else if (state.selectedNodes.length) {
                    const ids = new Set(state.selectedNodes);
                    state.data.nodes = state.data.nodes.filter((node) => !ids.has(node.id));
                    state.data.edges = state.data.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target) && !ids.has(edge.coParent));
                    state.selectedNodes = [];
                }
                syncDiagram(state);
                markUnsaved();
                renderDiagram(state);
            });
        }
        diagramStates.push(state);
        renderDiagram(state);
    }

    function initAttendanceRows() {
        const section = form.querySelector("[data-attendance-records]");
        if (!section) {
            return;
        }
        const addButton = section.querySelector("[data-attendance-add]");
        const countInput = form.querySelector("[data-attendance-count]");
        const tableBody = section.querySelector("[data-attendance-body]");
        const template = section.querySelector("[data-attendance-row-template]");
        if (!addButton || !countInput || !tableBody) {
            return;
        }
        addButton.addEventListener("click", () => {
            const currentCount = Number.parseInt(countInput.value || String(tableBody.querySelectorAll("tr").length), 10);
            const nextIndex = Number.isFinite(currentCount) && currentCount >= 0 ? currentCount : tableBody.querySelectorAll("tr").length;
            let row = null;
            if (template) {
                const wrapper = document.createElement("tbody");
                wrapper.innerHTML = template.innerHTML.replaceAll("__INDEX__", String(nextIndex)).trim();
                row = wrapper.querySelector("tr");
            } else {
                const sourceRow = tableBody.querySelector("tr:last-child");
                row = sourceRow ? sourceRow.cloneNode(true) : null;
                if (row) {
                    row.querySelectorAll("[name], [id], label[for]").forEach((element) => {
                        ["name", "id", "for"].forEach((attr) => {
                            const value = element.getAttribute(attr);
                            if (value) {
                                element.setAttribute(attr, value.replace(/atend_\\d+_/g, `atend_${nextIndex}_`));
                            }
                        });
                    });
                    row.querySelectorAll("input, textarea").forEach((field) => {
                        if (field.type === "checkbox" || field.type === "radio") {
                            field.checked = false;
                        } else {
                            field.value = "";
                        }
                    });
                }
            }
            if (!row) {
                return;
            }
            tableBody.appendChild(row);
            countInput.value = String(nextIndex + 1);
            markUnsaved();
        });
    }

    document.querySelectorAll("[data-diagram-editor]").forEach(initDiagramEditor);
    initAttendanceRows();
    initAgeCalculations();
    form.addEventListener("input", markUnsaved);
    form.addEventListener("change", markUnsaved);
    form.addEventListener("submit", () => {
        allowNavigation = true;
        hasUnsavedChanges = false;
        syncAllDiagrams();
    });

    window.addEventListener("beforeunload", (event) => {
        if (!hasUnsavedChanges || allowNavigation) {
            return;
        }
        event.preventDefault();
        event.returnValue = unsavedMessage;
    });

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || link.matches(".tab-link[href^='/editar']") || !hasUnsavedChanges || allowNavigation) {
            return;
        }
        const target = link.getAttribute("target");
        if (target && target !== "_self") {
            return;
        }
        if (!confirm(unsavedMessage)) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        allowNavigation = true;
    });

    function setStatus(text, className) {
        if (!status) {
            return;
        }
        status.textContent = text || "";
        status.className = "autosave-status";
        if (className) {
            status.classList.add(className);
        }
    }

    async function saveCurrentTab() {
        syncAllDiagrams();
        setStatus("A guardar...", "saving");
        const response = await fetch("/guardar-aba", {
            method: "POST",
            body: new URLSearchParams(new FormData(form)),
            headers: {
                "X-Background-Save": "1",
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            let message = "Não foi possível guardar este separador.";
            try {
                const payload = await response.json();
                if (payload && payload.error) {
                    message = payload.error;
                }
            } catch (_error) {
                // Keep the generic message.
            }
            throw new Error(message);
        }
        hasUnsavedChanges = false;
        setStatus("Guardado", "");
    }

    tabLinks.forEach((link) => {
        link.addEventListener("click", async (event) => {
            if (link.classList.contains("active") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            event.preventDefault();
            try {
                await saveCurrentTab();
                window.location.href = link.href;
            } catch (error) {
                setStatus(error.message, "error");
            }
        });
    });
})();
"""


class SupabaseError(RuntimeError):
    pass


def supabase_available():
    return USE_SUPABASE


def supabase_headers(extra=None):
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Accept": "application/json",
    }
    if SUPABASE_SECRET_KEY.count(".") == 2 and not SUPABASE_SECRET_KEY.startswith("sb_"):
        headers["Authorization"] = f"Bearer {SUPABASE_SECRET_KEY}"
    if extra:
        headers.update(extra)
    return headers


def supabase_request(method, endpoint, query=None, payload=None, raw_body=None, headers=None, expect_json=True):
    if not supabase_available():
        raise SupabaseError("Supabase não está configurado.")
    url = f"{SUPABASE_URL}{endpoint}"
    if query:
        url = f"{url}?{urlencode(query, doseq=True, safe='*,().:')}"
    request_headers = supabase_headers(headers)
    body = None
    if payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")
    elif raw_body is not None:
        body = raw_body
    request = Request(url, data=body, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            data = response.read()
            if not data:
                return None
            content_type = response.headers.get("Content-Type", "")
            if expect_json and "application/json" in content_type:
                return json.loads(data.decode("utf-8"))
            return data
    except HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise SupabaseError(f"Erro Supabase {exc.code}: {details[:500]}") from exc
    except URLError as exc:
        raise SupabaseError(f"Não foi possível ligar ao Supabase: {exc.reason}") from exc


def table_select(table, query=None):
    rows = supabase_request("GET", f"/rest/v1/{table}", query=query or {"select": "*"})
    return rows or []


def table_first(table, query):
    rows = table_select(table, query)
    return rows[0] if rows else None


def table_insert(table, values):
    result = supabase_request(
        "POST",
        f"/rest/v1/{table}",
        payload=values,
        headers={"Prefer": "return=representation"},
    )
    return result[0] if isinstance(result, list) and result else None


def table_update(table, filters, values):
    query = {"select": "*"}
    query.update(filters)
    result = supabase_request(
        "PATCH",
        f"/rest/v1/{table}",
        query=query,
        payload=values,
        headers={"Prefer": "return=representation"},
    )
    return result[0] if isinstance(result, list) and result else None


def table_delete(table, filters):
    supabase_request("DELETE", f"/rest/v1/{table}", query=filters, headers={"Prefer": "return=minimal"})


def table_upsert(table, values, conflict_columns):
    supabase_request(
        "POST",
        f"/rest/v1/{table}",
        query={"on_conflict": conflict_columns},
        payload=values,
        headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def ensure_supabase_bucket():
    try:
        supabase_request("GET", f"/storage/v1/bucket/{SUPABASE_BUCKET}")
        return
    except SupabaseError as exc:
        if "404" not in str(exc):
            raise
    supabase_request(
        "POST",
        "/storage/v1/bucket",
        payload={
            "id": SUPABASE_BUCKET,
            "name": SUPABASE_BUCKET,
            "public": False,
            "file_size_limit": MAX_PDF_BYTES,
            "allowed_mime_types": ["application/pdf"],
        },
    )


def supabase_storage_object_path(row):
    return f"{row['utente_id']}/{row['stored_name']}"


def supabase_upload_pdf(row, content):
    object_path = quote(supabase_storage_object_path(row), safe="/")
    supabase_request(
        "POST",
        f"/storage/v1/object/{SUPABASE_BUCKET}/{object_path}",
        raw_body=content,
        headers={"Content-Type": "application/pdf", "x-upsert": "false"},
        expect_json=False,
    )


def supabase_download_pdf(row):
    object_path = quote(supabase_storage_object_path(row), safe="/")
    return supabase_request(
        "GET",
        f"/storage/v1/object/{SUPABASE_BUCKET}/{object_path}",
        expect_json=False,
    )


def supabase_delete_pdf(row):
    supabase_request(
        "DELETE",
        f"/storage/v1/object/{SUPABASE_BUCKET}",
        payload={"prefixes": [supabase_storage_object_path(row)]},
        expect_json=False,
    )


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    if supabase_available():
        ensure_default_admin()
        ensure_supabase_bucket()
        return
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        ensure_user_columns(conn)
        ensure_default_admin(conn)
    os.makedirs(ATTACHMENTS_DIR, exist_ok=True)


def now():
    return datetime.now().replace(microsecond=0).isoformat(sep=" ")


def esc(value):
    return html.escape(str(value or ""), quote=True)


def field_value(data, key):
    value = data.get(key, [""])[0]
    return value.strip()


def ensure_user_columns(conn):
    if supabase_available():
        return
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(utilizadores)").fetchall()}
    if "tema" not in columns:
        conn.execute("ALTER TABLE utilizadores ADD COLUMN tema TEXT NOT NULL DEFAULT 'escuro'")
    if "idioma" not in columns:
        conn.execute("ALTER TABLE utilizadores ADD COLUMN idioma TEXT NOT NULL DEFAULT 'pt'")


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{salt}${digest.hex()}"


def verify_password(password, stored_hash):
    try:
        salt, expected = stored_hash.split("$", 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(candidate, expected)


def ensure_default_admin(conn=None):
    if supabase_available():
        if table_select("utilizadores", {"select": "id", "limit": "1"}):
            return
        timestamp = now()
        table_insert(
            "utilizadores",
            {
                "nome": "Administrador",
                "email": DEFAULT_ADMIN_EMAIL,
                "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
                "perfil": PERFIL_ADMIN,
                "ativo": 1,
                "tema": "escuro",
                "idioma": "pt",
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )
        return
    total = conn.execute("SELECT COUNT(*) AS total FROM utilizadores").fetchone()["total"]
    if total:
        return
    timestamp = now()
    conn.execute(
        """
        INSERT INTO utilizadores (nome, email, password_hash, perfil, ativo, tema, idioma, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, 'escuro', 'pt', ?, ?)
        """,
        ("Administrador", DEFAULT_ADMIN_EMAIL, hash_password(DEFAULT_ADMIN_PASSWORD), PERFIL_ADMIN, timestamp, timestamp),
    )


def is_admin(user):
    return bool(user and user.get("perfil") == PERFIL_ADMIN)


def empty_central_permissions():
    return {
        "socios": {
            "view": False,
            "edit": False,
            "view_sensitive": False,
            "edit_sensitive": False,
            "export": False,
            "delete": False,
        },
        "utentes": {
            "view": False,
            "edit": False,
            "view_sensitive": False,
            "edit_sensitive": False,
            "export": False,
            "delete": False,
        },
        "dispositivos": {
            "view": False,
            "edit": False,
            "view_sensitive": False,
            "edit_sensitive": False,
            "export": False,
            "delete": False,
        },
        "atividades": {
            "view": False,
            "edit": False,
            "view_sensitive": False,
            "edit_sensitive": False,
            "export": False,
            "delete": False,
        },
        "central": {
            "manage_users": False,
            "view_history": False,
        },
    }


def full_central_permissions():
    permissions = empty_central_permissions()
    for area in CENTRAL_AREA_KEYS:
        permissions[area].update({"view": True, "edit": True, "export": True, "delete": True})
    permissions["atividades"]["delete"] = False
    permissions["utentes"].update({"view_sensitive": True, "edit_sensitive": True})
    permissions["central"].update({"manage_users": True, "view_history": True})
    return permissions


def default_central_permissions_for_role(_role=None):
    # Kept for compatibility with old callers. The matrix is the only authority.
    return full_central_permissions()


def normalize_central_permissions(raw_permissions, _role=None):
    if isinstance(raw_permissions, str):
        try:
            raw_permissions = json.loads(raw_permissions)
        except (TypeError, ValueError):
            raw_permissions = {}
    if not isinstance(raw_permissions, dict):
        raw_permissions = {}

    has_stored_matrix = bool(raw_permissions.get("central")) or any(
        bool(raw_permissions.get(area)) for area in CENTRAL_AREA_KEYS
    )
    # Empty permissions are from accounts created before the matrix. They receive
    # the agreed full-access starting point; an explicit matrix is authoritative.
    permissions = empty_central_permissions() if has_stored_matrix else full_central_permissions()
    for area in CENTRAL_AREA_KEYS:
        source = raw_permissions.get(area)
        if not isinstance(source, dict):
            continue
        for action in CENTRAL_AREA_ACTIONS:
            if isinstance(source.get(action), bool):
                permissions[area][action] = source[action]

    central_source = raw_permissions.get("central")
    if isinstance(central_source, dict):
        if isinstance(central_source.get("manage_users"), bool):
            permissions["central"]["manage_users"] = central_source["manage_users"]
        if isinstance(central_source.get("view_history"), bool):
            permissions["central"]["view_history"] = central_source["view_history"]

    for area in CENTRAL_AREA_KEYS:
        area_permissions = permissions[area]
        source = raw_permissions.get(area)
        source = source if isinstance(source, dict) else {}
        if source.get("view") is False:
            for action in CENTRAL_AREA_ACTIONS:
                area_permissions[action] = False
        else:
            if source.get("edit") is False:
                area_permissions["delete"] = False
                area_permissions["edit_sensitive"] = False
            if source.get("view_sensitive") is False:
                area_permissions["edit_sensitive"] = False
                if area == "utentes":
                    area_permissions["export"] = False
            if area_permissions["delete"]:
                area_permissions["edit"] = True
                area_permissions["view"] = True
            if area_permissions["edit"]:
                area_permissions["view"] = True
            if area_permissions["export"]:
                area_permissions["view"] = True
                if area == "utentes":
                    area_permissions["view_sensitive"] = True
            if area_permissions["edit_sensitive"]:
                area_permissions["view_sensitive"] = True
                area_permissions["edit"] = True
                area_permissions["view"] = True
            if area_permissions["view_sensitive"]:
                area_permissions["view"] = True
        if area != "utentes":
            area_permissions["view_sensitive"] = False
            area_permissions["edit_sensitive"] = False
        if area == "atividades":
            area_permissions["delete"] = False
    return permissions


def central_profile_for_user(user):
    if not user:
        return None
    if user.get("_central_profile_loaded"):
        return user.get("_central_profile")

    role = "viewer"
    fallback = {
        "role": role,
        "active": bool(user.get("ativo", 1)),
        "permissions": full_central_permissions(),
    }
    profile = fallback
    email = str(user.get("email") or "").strip().lower()

    if supabase_available() and email:
        try:
            row = table_first(
                "app_users",
                {
                    "select": "id,email,full_name,role,active,permissions",
                    "email": f"ilike.{email}",
                },
            )
        except SupabaseError:
            try:
                row = table_first(
                    "app_users",
                    {
                        "select": "id,email,full_name,role,active",
                        "email": f"ilike.{email}",
                    },
                )
            except SupabaseError:
                row = None
        if row:
            profile = {
                **row,
                "role": "viewer",
                "active": bool(row.get("active", True)),
                "permissions": normalize_central_permissions(row.get("permissions")),
            }

    user["_central_profile_loaded"] = True
    user["_central_profile"] = profile
    return profile


def central_has_permission(user, area, action):
    profile = central_profile_for_user(user)
    if not profile or not profile.get("active"):
        return False
    permissions = profile.get("permissions") or full_central_permissions()
    if area == "central":
        return bool((permissions.get("central") or {}).get(action))
    return bool((permissions.get(area) or {}).get(action))


def can_view_utentes(user):
    return central_has_permission(user, "utentes", "view")


def can_edit_utentes(user):
    return central_has_permission(user, "utentes", "edit")


def can_view_sensitive_utentes(user):
    return central_has_permission(user, "utentes", "view_sensitive")


def can_edit_sensitive_utentes(user):
    return central_has_permission(user, "utentes", "edit_sensitive")


def can_export_utentes(user):
    return central_has_permission(user, "utentes", "export")


def can_delete_utentes(user):
    return central_has_permission(user, "utentes", "delete")


def can_view_history(user):
    return central_has_permission(user, "central", "view_history")


def can_manage_central_users(user):
    return central_has_permission(user, "central", "manage_users")


def is_sensitive_tab(tab_key):
    return tab_key in UTENTES_SENSITIVE_TABS


def can_view_tab(user, tab_key):
    if tab_key in UTENTES_SENSITIVE_TABS:
        return can_view_sensitive_utentes(user)
    return can_view_utentes(user)


def can_edit_tab(user, tab_key):
    if tab_key in UTENTES_SENSITIVE_TABS:
        return can_edit_sensitive_utentes(user)
    return can_edit_utentes(user)


def allowed_tab_sections(user):
    return [(key, label) for key, label in TAB_SECTIONS if can_view_tab(user, key)]


def first_allowed_tab(user):
    sections = allowed_tab_sections(user)
    return sections[0][0] if sections else TAB_SECTIONS[0][0]


def get_user_by_email(email):
    if supabase_available():
        row = table_first(
            "utilizadores",
            {"select": "*", "email": f"ilike.{email.strip().lower()}"},
        )
        return row
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM utilizadores WHERE lower(email) = lower(?)",
            (email,),
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id):
    if supabase_available():
        return table_first("utilizadores", {"select": "*", "id": f"eq.{user_id}"})
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM utilizadores WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    timestamp = now()
    expires = (datetime.now() + timedelta(hours=SESSION_HOURS)).replace(microsecond=0).isoformat(sep=" ")
    if supabase_available():
        table_insert(
            "sessoes",
            {"token": token, "utilizador_id": user_id, "created_at": timestamp, "expires_at": expires},
        )
        return token
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO sessoes (token, utilizador_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, timestamp, expires),
        )
    return token


def delete_session(token):
    if not token:
        return
    if supabase_available():
        table_delete("sessoes", {"token": f"eq.{token}"})
        return
    with get_connection() as conn:
        conn.execute("DELETE FROM sessoes WHERE token = ?", (token,))


def get_request_token(handler):
    cookie_header = handler.headers.get("Cookie", "")
    cookies = SimpleCookie(cookie_header)
    morsel = cookies.get(SESSION_COOKIE)
    return morsel.value if morsel else ""


def get_request_language(handler):
    cookie_header = handler.headers.get("Cookie", "")
    cookies = SimpleCookie(cookie_header)
    morsel = cookies.get(LANGUAGE_COOKIE)
    return normalize_language(morsel.value if morsel else "pt")


def get_request_language_cookie(handler):
    cookie_header = handler.headers.get("Cookie", "")
    cookies = SimpleCookie(cookie_header)
    morsel = cookies.get(LANGUAGE_COOKIE)
    return normalize_language(morsel.value) if morsel else None


def get_current_user(handler):
    token = get_request_token(handler)
    if not token:
        return None
    if supabase_available():
        table_delete("sessoes", {"expires_at": f"lt.{now()}"})
        session = table_first("sessoes", {"select": "*", "token": f"eq.{token}"})
        if not session or str(session.get("expires_at") or "") < now():
            return None
        user = get_user_by_id(session.get("utilizador_id"))
        if not user or not int(user.get("ativo") or 0):
            return None
        return user
    with get_connection() as conn:
        conn.execute("DELETE FROM sessoes WHERE expires_at < ?", (now(),))
        row = conn.execute(
            """
            SELECT u.*
            FROM sessoes s
            JOIN utilizadores u ON u.id = s.utilizador_id
            WHERE s.token = ? AND s.expires_at >= ? AND u.ativo = 1
            """,
            (token, now()),
        ).fetchone()
    return dict(row) if row else None


def session_cookie(token):
    return f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax"


def clear_session_cookie():
    return f"{SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"


def language_cookie(language):
    return f"{LANGUAGE_COOKIE}={normalize_language(language)}; Path=/; Max-Age=31536000; SameSite=Lax"


TRANSLATIONS = {
    "pt": {
        "app_title": "Utentes",
        "user_manager": "Utilizadores",
        "consultation_profile": "Perfil de Consulta",
        "new_client": "+ Novo utente",
        "nav_areas": "\u00c1reas principais",
        "nav_socios": "S\u00f3cios",
        "nav_utentes": "Utentes",
        "nav_dispositivos": "Cibersegurança",
        "nav_atividades": "Atividades",
        "header_tools": "Ferramentas e a\u00e7\u00f5es",
        "open_menu": "Abrir menu",
        "history": "Historico",
        "manual": "Manuais",
        "change_language": "Idioma",
        "logout": "Terminar Sessão",
        "dark": "Tema escuro",
        "light": "Tema claro",
        "back": "Voltar",
        "print": "Imprimir",
        "close": "Fechar",
        "refresh": "Atualizar",
        "name": "Nome",
        "actions": "Ações",
        "view": "Ver",
        "edit": "Editar",
        "delete": "Eliminar",
        "statistics": "Estatísticas",
        "export_backup": "Exportar backup de utentes",
        "backup_error": "Não foi possível gerar o backup",
        "loading": "A carregar",
        "toggle_active": "Alterar estado",
        "activate_client": "Ativar utente",
        "deactivate_client": "Inativar utente",
        "search_by_name": "Pesquisar por nome",
        "search": "Pesquisar",
        "clear": "Limpar",
        "no_clients": "Nenhum utente encontrado",
        "no_clients_help": "Adicione o primeiro utente ou ajuste a pesquisa.",
        "new_client_title": "Novo utente",
        "save_client": "Guardar utente",
        "save_changes": "Guardar alterações",
        "cancel": "Cancelar",
        "full_name": "Nome completo *",
        "client_list": "Lista de utentes",
        "edit_client": "Editar utente",
        "view_client": "Ver utente",
        "language_title": "Mudar idioma",
        "language_help": "Escolha o idioma da interface desta conta.",
        "portuguese": "Português",
        "english": "Inglês",
        "active_language": "Idioma ativo",
        "apply_language": "Aplicar idioma",
        "language_updated": "Idioma atualizado com sucesso",
        "admin": "Administrador",
        "user": "Utilizador",
        "create_user": "Criar utilizador",
        "edit_user": "Editar utilizador",
        "user_manager_help": "Crie acessos novos e edite permissões de utilizadores existentes.",
        "access_available": "O acesso fica disponível de imediato.",
        "choose_user": "Escolha um utilizador na lista para editar.",
        "email": "Email",
        "password": "Password",
        "new_password": "Nova password",
        "keep_blank": "Deixe em branco para manter",
        "role": "Cargo",
        "status": "Estado",
        "active": "Ativo",
        "inactive": "Inativo",
        "monthly_fee": "Mensalidade",
        "paid_until": "Pago até",
        "no_monthly_fee": "Sem mensalidade",
        "pay_fee": "Pagar quota",
        "quick_payment": "Pagamento rápido",
        "cancel_payment": "Cancelar pagamento",
        "cancel_payment_confirm": "Cancelar este pagamento?",
        "payment_cancelled": "Pagamento cancelado com sucesso",
        "fees_current": "Quotas em dia",
        "fees_overdue": "Quotas em atraso",
        "average_fee_delay": "Atraso médio",
        "active_clients_scope": "utentes ativos",
        "pending_fee_singular": "1 pendente",
        "pending_fee_plural": "{count} pendentes",
        "monthly_delay_singular": "1 mensalidade",
        "monthly_delay_plural": "{count} mensalidades",
        "not_enough_data": "Sem dados suficientes",
        "history_help": "Veja quem fez alterações, o que fez e quando fez.",
        "when": "Quando",
        "who": "Quem",
        "action": "Ação",
        "area": "Área",
        "details": "Detalhes",
        "no_history": "Ainda não existem alterações registadas.",
        "manual_text": "O manual de utilização será acrescentado numa fase seguinte.",
        "placeholder_text": "Esta área já está preparada no menu, mas ainda não tem funcionalidades ativas.",
        "average_stay": "Permanência média",
        "municipality_percentage": "Percentagem por concelho",
    },
    "en": {
        "app_title": "Client Management",
        "user_manager": "Users",
        "consultation_profile": "View-only Profile",
        "new_client": "+ New client",
        "nav_areas": "Main areas",
        "nav_socios": "Members",
        "nav_utentes": "Clients",
        "nav_dispositivos": "Cybersecurity",
        "nav_atividades": "Activities",
        "header_tools": "Tools and actions",
        "open_menu": "Open menu",
        "history": "History",
        "manual": "Manuals",
        "change_language": "Language",
        "logout": "Sign out",
        "dark": "Dark theme",
        "light": "Light theme",
        "back": "Back",
        "print": "Print",
        "close": "Close",
        "refresh": "Refresh",
        "name": "Name",
        "actions": "Actions",
        "view": "View",
        "edit": "Edit",
        "delete": "Delete",
        "statistics": "Statistics",
        "export_backup": "Export clients backup",
        "backup_error": "Could not generate backup",
        "loading": "Loading",
        "toggle_active": "Change status",
        "activate_client": "Activate client",
        "deactivate_client": "Deactivate client",
        "search_by_name": "Search by name",
        "search": "Search",
        "clear": "Clear",
        "no_clients": "No clients found",
        "no_clients_help": "Add the first client or adjust the search.",
        "new_client_title": "New client",
        "save_client": "Save client",
        "save_changes": "Save changes",
        "cancel": "Cancel",
        "full_name": "Full name *",
        "client_list": "Client list",
        "edit_client": "Edit client",
        "view_client": "View client",
        "language_title": "Change language",
        "language_help": "Choose the interface language for this account.",
        "portuguese": "Portuguese",
        "english": "English",
        "active_language": "Active language",
        "apply_language": "Apply language",
        "language_updated": "Language updated successfully",
        "admin": "Administrator",
        "user": "User",
        "create_user": "Create user",
        "edit_user": "Edit user",
        "user_manager_help": "Create new access accounts and edit existing user permissions.",
        "access_available": "Access becomes available immediately.",
        "choose_user": "Choose a user from the list to edit.",
        "email": "Email",
        "password": "Password",
        "new_password": "New password",
        "keep_blank": "Leave blank to keep current",
        "role": "Role",
        "status": "Status",
        "active": "Active",
        "inactive": "Inactive",
        "monthly_fee": "Monthly fee",
        "paid_until": "Paid until",
        "no_monthly_fee": "No monthly fee",
        "pay_fee": "Pay fee",
        "quick_payment": "Quick payment",
        "cancel_payment": "Cancel payment",
        "cancel_payment_confirm": "Cancel this payment?",
        "payment_cancelled": "Payment cancelled successfully",
        "fees_current": "Fees up to date",
        "fees_overdue": "Overdue fees",
        "average_fee_delay": "Average delay",
        "active_clients_scope": "active clients",
        "pending_fee_singular": "1 pending fee",
        "pending_fee_plural": "{count} pending fees",
        "monthly_delay_singular": "1 monthly fee",
        "monthly_delay_plural": "{count} monthly fees",
        "not_enough_data": "Not enough data",
        "history_help": "See who changed what, and when.",
        "when": "When",
        "who": "Who",
        "action": "Action",
        "area": "Area",
        "details": "Details",
        "no_history": "There are no recorded changes yet.",
        "manual_text": "The user manual will be added later.",
        "placeholder_text": "This area is already available in the menu, but does not have active features yet.",
        "average_stay": "Average stay",
        "municipality_percentage": "Percentage by municipality",
    },
}


EN_STATIC_TRANSLATIONS = {
    "Formulário de Referenciação - Unidade Sócio-Ocupacional": "Referral Form - Socio-Occupational Unit",
    "Formulário de Referenciação": "Referral Form",
    "Pagamentos e Mensalidades": "Payments and Monthly Fees",
    "Registo de Pagamentos e Mensalidades": "Payments and Monthly Fees Record",
    "Informações em Caso de Emergência": "Emergency Information",
    "Ficha de Inscrição e Avaliação Inicial de Requisitos": "Registration Form and Initial Requirements Assessment",
    "Avaliação Diagnóstica Multidisciplinar": "Multidisciplinary Diagnostic Assessment",
    "Registo de Atendimentos e Acompanhamentos": "Service and Follow-up Records",
    "Proteção de dados e Termos de Responsabilidade": "Data Protection and Responsibility Terms",
    "Utentes MenteMovimento": "MenteMovimento Clients",
    "Gestão de Utentes": "Client Management",
    "Gestor de Utilizadores": "User Manager",
    "Perfil de Consulta": "View-only Profile",
    "+ Novo utente": "+ New client",
    "Novo utente": "New client",
    "Lista de utentes": "Client list",
    "Editar utente": "Edit client",
    "Ver utente": "View client",
    "Histórico de alterações": "Change history",
    "Histórico": "History",
    "Mudar idioma": "Change language",
    "Português": "Portuguese",
    "Inglês": "English",
    "Idioma ativo": "Active language",
    "Aplicar idioma": "Apply language",
    "Escolha o idioma da interface desta conta.": "Choose the interface language for this account.",
    "Idioma atualizado com sucesso": "Language updated successfully",
    "Manual": "Manual",
    "Claro": "Light",
    "Escuro": "Dark",
    "Sair": "Sign out",
    "Entrar": "Sign in",
    "Aceda à gestão de utentes.": "Access client management.",
    "Credenciais inválidas ou utilizador inativo.": "Invalid credentials or inactive user.",
    "Administrador": "Administrator",
    "Utilizador": "User",
    "Pesquisar por nome": "Search by name",
    "Pesquisar": "Search",
    "Limpar": "Clear",
    "Cancelar": "Cancel",
    "Voltar": "Back",
    "Guardar": "Save",
    "Guardar utente": "Save client",
    "Guardar alterações": "Save changes",
    "Guardar nome": "Save name",
    "Atualizar": "Refresh",
    "Fechar": "Close",
    "Nome completo *": "Full name *",
    "Nome completo": "Full name",
    "Nenhum utente encontrado": "No clients found",
    "Adicione o primeiro utente ou ajuste a pesquisa.": "Add the first client or adjust the search.",
    "Utente adicionado com sucesso": "Client added successfully",
    "Utente eliminado com sucesso": "Client deleted successfully",
    "Dados guardados com sucesso": "Data saved successfully",
    "Aba guardada com sucesso": "Tab saved successfully",
    "Utente não encontrado": "Client not found",
    "Sem permissão para criar utentes": "No permission to create clients",
    "Sem permissão para essa ação": "No permission for that action",
    "O nome completo é obrigatório.": "Full name is required.",
    "Ações": "Actions",
    "Editar": "Edit",
    "Eliminar": "Delete",
    "Estatísticas": "Statistics",
    "Estatísticas de utentes": "Client statistics",
    "Permanência média": "Average stay",
    "Percentagem por concelho": "Percentage by municipality",
    "Distribuição por concelho": "Distribution by municipality",
    "Utentes considerados": "Clients included",
    "Sem concelho preenchido": "No municipality filled in",
    "Sem dados suficientes": "Not enough data",
    "Ativar utente": "Activate client",
    "Inativar utente": "Deactivate client",
    "Utente ativado com sucesso": "Client activated successfully",
    "Utente inativado com sucesso": "Client deactivated successfully",
    "Ativar este utente?": "Activate this client?",
    "Inativar este utente?": "Deactivate this client?",
    "Ativo": "Active",
    "Inativo": "Inactive",
    "Ver": "View",
    "Eliminar este utente?": "Delete this client?",
    "Áreas do utente": "Client areas",
    "Conteúdo": "Content",
    "Sem informação registada.": "No information recorded.",
    "Ainda não existem PDFs anexados neste separador.": "There are no PDFs attached in this tab yet.",
    "Anexar PDF digitalizado": "Attach scanned PDF",
    "Anexar PDF": "Attach PDF",
    "PDFs deste utente": "This client's PDFs",
    "Abrir": "Open",
    "Remover": "Remove",
    "Remover este PDF?": "Remove this PDF?",
    "PDF anexado com sucesso": "PDF attached successfully",
    "PDF removido com sucesso": "PDF removed successfully",
    "Escolha um ficheiro PDF para anexar.": "Choose a PDF file to attach.",
    "Só são permitidos ficheiros PDF.": "Only PDF files are allowed.",
    "O ficheiro escolhido não parece ser um PDF válido.": "The selected file does not appear to be a valid PDF.",
    "O PDF excede o limite de 30 MB.": "The PDF exceeds the 30 MB limit.",
    "PDF não encontrado": "PDF not found",
    "anexado em": "attached on",
    " · por ": " · by ",

    "Data de Receção do documento": "Document reception date",
    "1. Dados de Identificação e Contactos": "1. Identification and Contacts",
    "1. Dados de Identificação do Utente": "1. Client Identification Data",
    "Processo n.º": "Process no.",
    "N.º Processo": "Process no.",
    "N.º Internamentos até à data": "Number of admissions to date",
    "Data de Nascimento": "Date of birth",
    "Data Nasc.": "Date of birth",
    "Idade": "Age",
    "Morada": "Address",
    "Código Postal": "Postcode",
    "Freguesia": "Parish",
    "Concelho": "Municipality",
    "Contacto Telefónico": "Phone contact",
    "Contacto": "Contact",
    "Contacto(s)": "Contact(s)",
    "Familiar de Referência": "Reference family member",
    "Parentesco": "Relationship",
    "Parent.": "Relationship",
    "NIF": "Tax ID",
    "Nome": "Name",
    "Email": "Email",
    "Telefone": "Phone",
    "Entidade": "Entity",
    "Diagnóstico Atual": "Current diagnosis",
    "Antecedentes clínicos": "Clinical history",
    "2. Identificação da Entidade e Técnico(a) de Encaminhamento": "2. Referring Entity and Technician Identification",
    "Nome do(a) Técnico(a)": "Technician name",
    "Relação com o(a) Candidato(a)": "Relationship with the candidate",
    "3. Informação Clínica": "3. Clinical Information",
    "Data 1.º Internamento": "Date of first admission",
    "Data do Último Internamento": "Date of last admission",
    "Tratamento em": "Treatment in",
    "Hospital de Dia": "Day Hospital",
    "Consulta Externa": "Outpatient Consultation",
    "Internamento": "Inpatient Admission",
    "Resumo da Situação Clínica Atual": "Summary of Current Clinical Situation",
    "Outros Problemas de Saúde": "Other Health Problems",
    "Urinários": "Urinary",
    "Reumáticos": "Rheumatic",
    "Cardíacos": "Cardiac",
    "Hipertensão": "Hypertension",
    "Doenças infetocontagiosas": "Infectious diseases",
    "Doenças cancerígenas": "Cancer diseases",
    "Sistema nervoso": "Nervous system",
    "Visão": "Vision",
    "Diabetes": "Diabetes",
    "Alergias": "Allergies",
    "Intestinais": "Intestinal",
    "Respiratórios": "Respiratory",
    "Auditivos": "Hearing",
    "Outros": "Other",
    "Outro": "Other",
    "Quais?": "Which?",
    "Qual?": "Which?",
    "Outro motivo": "Other reason",
    "5. Avaliação de Risco": "5. Risk Assessment",
    "Sem adesão Terapêutica": "No therapeutic adherence",
    "Comportamentos Agressivos": "Aggressive behaviour",
    "Sem Retaguarda Familiar": "No family backup",
    "Comportamentos Automutilatórios": "Self-harming behaviour",
    "Ideação Suicida": "Suicidal ideation",
    "Consumo de Substâncias": "Substance use",
    "6. Motivo do Encaminhamento": "6. Referral Reason",
    "Ativação Comportamental": "Behavioural activation",
    "Treino de Competências Sociais": "Social skills training",
    "Estruturação de Rotinas": "Routine structuring",
    "Redução do Isolamento Social": "Reduction of social isolation",
    "Gestão da Sintomatologia": "Symptom management",
    "Treino da Funcionalidade (Atividades de Vida Diária)": "Functionality training (Activities of Daily Living)",
    "Treino da Funcionalidade (Laboral/Comunidade)": "Functionality training (Work/Community)",
    "Treino da Funcionalidade (Relacional/Social)": "Functionality training (Relational/Social)",
    "Medicação": "Medication",
    "Medicamento": "Medication",
    "Jejum": "Fasting",
    "P. Almoço": "Before lunch",
    "Almoço": "Lunch",
    "Lanche": "Snack",
    "Jantar": "Dinner",
    "Deitar": "Bedtime",
    "Observações": "Notes",
    "Estado do pagamento": "Payment status",
    "Pago": "Paid",
    "Em aberto": "Open",
    "Parcial": "Partial",
    "Isento": "Exempt",
    "Mensalidade paga até": "Monthly fee paid until",
    "Dia do pagamento": "Payment date",
    "Forma de pagamento": "Payment method",
    "Selecionar": "Select",
    "Transferência bancária": "Bank transfer",
    "Dinheiro": "Cash",
    "MB Way": "MB Way",
    "Multibanco": "ATM payment",
    "Cheque": "Cheque",
    "Valor pago (€)": "Amount paid (€)",
    "N.º recibo / referência": "Receipt / reference no.",
    "Observações de pagamento": "Payment notes",
    "Mensalidade": "Monthly fee",
    "Nova mensalidade": "New monthly fee",
    "Registar pagamento": "Register payment",
    "Histórico de pagamentos": "Payment history",
    "Mensalidade / quota": "Monthly fee",
    "Método": "Method",
    "Valor": "Amount",
    "Recibo / referência": "Receipt / reference",
    "Sem pagamentos registados.": "No payments recorded.",
    "Escolha a mensalidade e a forma de pagamento antes de registar.": "Choose the monthly fee and payment method before registering.",
    "Mensalidade registada com sucesso": "Monthly fee registered successfully",
    "Pagamento rápido registado com sucesso": "Quick payment registered successfully",

    "Identificação": "Identification",
    "Em caso de urgência contactar": "In case of emergency contact",
    "Dados de saúde": "Health data",
    "Grupo sanguíneo": "Blood group",
    "N.º SNS": "SNS no.",
    "Nome do médico de família": "Family doctor's name",
    "Centro de Saúde": "Health Centre",
    "Médico Psiquiatra": "Psychiatrist",
    "Alergias e observações": "Allergies and notes",
    "Problemas de Saúde": "Health Problems",
    "Informação geral adicional": "Additional general information",
    "Informação Geral Relevante": "Relevant General Information",
    "Informação": "Information",

    "Data": "Date",
    "Nome pelo qual prefere ser tratado": "Preferred name",
    "Cartão de Cidadão": "Citizen Card",
    "N.º Segurança Social": "Social Security no.",
    "N.º SNS/Utente": "SNS/User no.",
    "Pessoa de referência": "Reference person",
    "Nome e contacto de pessoa de referência": "Reference person's name and contact",
    "1. Pedido": "1. Request",
    "2. Formulação e Identificação do Pedido": "2. Request Formulation and Identification",
    "Descrição do motivo e expectativas acerca da Unidade Sócio Ocupacional": "Description of reason and expectations regarding the Socio-Occupational Unit",
    "3. Sinalização Global dos Serviços de Preferência": "3. Overall Indication of Preferred Services",
    "Descrição do pedido / motivo da inscrição": "Request description / registration reason",
    "Outro serviço": "Other service",
    "2. Serviços pretendidos": "2. Requested services",
    "Atividade Física (Ginástica, Hidroginástica, etc.)": "Physical activity (gymnastics, water aerobics, etc.)",
    "Expressão Corporal (Teatro, dança, etc.)": "Body expression (theatre, dance, etc.)",
    "Expressão Artística (Desenho, Pintura, Fotografia, etc.)": "Artistic expression (drawing, painting, photography, etc.)",
    "Expressão Musical": "Musical expression",
    "Grupos de Conversação": "Conversation groups",
    "Treino de Atividades de Vida Diária": "Activities of daily living training",
    "Relaxamento": "Relaxation",
    "Atelier Laboral": "Work atelier",
    "Psicoterapia Individual": "Individual psychotherapy",
    "Estimulação Cognitiva": "Cognitive stimulation",
    "Formação Profissional": "Vocational training",
    "3. Admissibilidade": "3. Admissibility",
    "Não Aceitação": "Non-acceptance",
    "Grau de dependência elevado": "High level of dependency",
    "Resposta": "Answer",
    "Observações / fundamentos": "Notes / grounds",
    "4. Avaliação Inicial de Requisitos": "4. Initial Requirements Assessment",
    "4. Admissibilidade e Ponderação": "4. Admissibility and Weighting",
    "Admissibilidade": "Admissibility",
    "4.4 Tabela de ponderação": "4.4 Weighting table",
    "4.1 Apresenta algum critério de Não Admissibilidade?": "4.1 Does the client present any non-admissibility criterion?",
    "4.2 Tem Transporte? (assinale com uma X)": "4.2 Has transport? (mark with an X)",
    "4.3 A Resposta Social ajusta-se ao pedido do Utente? (assinale com uma X)": "4.3 Does the social response fit the client's request? (mark with an X)",
    "Se não, porquê?": "If no, why?",
    "Utilização de Transportes": "Use of Transport",
    "Critério": "Criterion",
    "Ponderação": "Weighting",
    "Pontuação": "Score",
    "Valor ponderado": "Weighted value",
    "Total": "Total",
    "Idade do utente (quanto menor for, maior pontuação)": "Client age (the lower it is, the higher the score)",
    "Residência na Região de Entre Douro e Vouga": "Residence in the Entre Douro e Vouga region",
    "Limitações na estrutura familiar": "Limitations in the family structure",
    "Encaminhado pelo Departamento de Saúde Mental do CHEDV": "Referred by the CHEDV Mental Health Department",
    "Estabilização clínica ultrapassada da fase aguda da doença": "Clinical stabilization after the acute phase of illness",
    "Funcionalidade básica conservada ou adquirida em reabilitação anterior": "Basic functioning preserved or acquired in previous rehabilitation",
    "Perturbação da funcionalidade relacional, ocupacional e/ou profissional": "Relational, occupational and/or professional functioning impairment",
    "Capacidade para eventual exercício de atividade socialmente útil": "Capacity for possible socially useful activity",
    "Tempo de evolução da doença (quanto menor for, maior pontuação)": "Disease duration (the shorter it is, the higher the score)",

    "Data da Avaliação": "Assessment date",
    "Técnico de referência": "Reference technician",
    "1. Dados Sócio-Demográficos": "1. Socio-Demographic Data",
    "1.1 Nome": "1.1 Name",
    "1.2 Estado Civil": "1.2 Marital Status",
    "Estado Civil": "Marital Status",
    "Solteiro(a)": "Single",
    "Casado(a)": "Married",
    "União de Facto": "Civil partnership",
    "Separado(a)/Divorciado(a)": "Separated/Divorced",
    "Viúvo(a)": "Widowed",
    "Nacionalidade": "Nationality",
    "Língua(s) falada(s)": "Spoken language(s)",
    "1.4 Grau de escolaridade mais elevado": "1.4 Highest education level",
    "Não sabe ler, nem escrever": "Cannot read or write",
    "Sabe ler e escrever": "Can read and write",
    "Ensino Básico (ensino primário)": "Basic education (primary school)",
    "Ensino Preparatório": "Preparatory education",
    "Ensino Secundário": "Secondary education",
    "Bacharelato": "Bachelor's degree",
    "Ensino Técnico Profissional": "Technical vocational education",
    "Licenciatura": "Undergraduate degree",
    "Pós-graduação": "Postgraduate degree",
    "Mestrado": "Master's degree",
    "Doutoramento": "Doctorate",
    "Idade com que completou a escolaridade": "Age when education was completed",
    "Observações/Eventos significativos no percurso escolar": "Notes/Significant events in education",
    "1.5 Situação Laboral": "1.5 Employment Situation",
    "Trabalho por conta própria": "Self-employed",
    "Trabalho por conta de outrem": "Employed by others",
    "Prestação de Serviços": "Service provision",
    "Desempregado": "Unemployed",
    "Voluntariado": "Volunteering",
    "Reforma/Invalidez": "Retirement/Disability",
    "Se empregado, a relação jurídica de emprego é": "If employed, the legal employment relationship is",
    "Contrato a Termo Certo": "Fixed-term contract",
    "Contrato a Termo Incerto (efetivo)": "Open-ended contract",
    "Trabalho temporário/Substituição": "Temporary work/Substitution",
    "Estágio Profissional": "Professional internship",
    "Há quanto tempo trabalha": "How long has worked",
    "1.6 Problemas de Inserção Profissional": "1.6 Professional Integration Problems",
    "Emprego Precário": "Precarious employment",
    "Baixa Qualificação Profissional": "Low professional qualification",
    "Desadequação entre expectativas/habilitações académicas": "Mismatch between expectations/academic qualifications",
    "Falta de ofertas do mercado de trabalho": "Lack of labour market offers",
    "Salários em atraso": "Delayed wages",
    "Dificuldade de adaptação a um horário rígido": "Difficulty adapting to a rigid schedule",
    "1.7 Situação Económica": "1.7 Economic Situation",
    "Rendimento do Trabalho": "Employment income",
    "Prestação Social para a Inclusão (PSI)": "Social Inclusion Benefit (PSI)",
    "Subsídio de Doença": "Sickness benefit",
    "Pensão de Invalidez relativa": "Relative disability pension",
    "Pensão de Invalidez absoluta": "Absolute disability pension",
    "Complemento por Dependência": "Dependency supplement",
    "Complemento Solidário para Idosos": "Solidarity Supplement for the Elderly",
    "Rendimento Social de Inserção (RSI)": "Social Integration Income (RSI)",
    "Reforma": "Retirement pension",
    "Sem Rendimentos": "No income",
    "1.8 Habitação": "1.8 Housing",
    "Adequada às necessidades": "Suitable for needs",
    "Barreiras arquitetónicas na casa": "Architectural barriers at home",
    "Humidade, falta de higiene": "Humidity, lack of hygiene",
    "Ausência de acessibilidades": "Lack of accessibility",
    "Habitação inadequada": "Inadequate housing",
    "2. Situação Sócio-Familiar": "2. Socio-Family Situation",
    "Vive com a família sem dependência física/psíquica": "Lives with family without physical/psychological dependency",
    "Vive com o cônjuge de similar idade": "Lives with spouse of similar age",
    "Vive com a família e/ou cônjuge com algum grau de dependência": "Lives with family and/or spouse with some degree of dependency",
    "Vive sozinho mas tem familiares próximos": "Lives alone but has close relatives",
    "Vive sozinho sem familiares próximos": "Lives alone without close relatives",
    "Habilitações Literárias": "Education",
    "Situação Profissional": "Professional Situation",
    "2.3 Genograma": "2.3 Genogram",
    "Genograma": "Genogram",
    "Homem": "Man",
    "Mulher": "Woman",
    "Casamento": "Marriage",
    "União/Coabitação": "Union/Cohabitation",
    "União": "Union",
    "Filiação": "Parent-child",
    "Separação": "Separation",
    "Divórcio": "Divorce",
    "Relação próxima": "Close relationship",
    "Conflito": "Conflict",
    "Corte/distanciamento": "Cut-off/distance",
    "Falecido": "Deceased",
    "Próxima": "Close",
    "Corte": "Cut-off",
    "2.4 Relações Sociais": "2.4 Social Relationships",
    "Relações sociais só com a família": "Social relationships only with family",
    "Relações sociais só com a família e vizinhos": "Social relationships only with family and neighbours",
    "Não sai do domicílio, mas recebe visitas": "Does not leave home, but receives visitors",
    "Não sai do domicílio nem recebe visitas": "Does not leave home or receive visitors",
    "2.5 Rede Social": "2.5 Social Network",
    "Com apoio familiar ou de vizinhos": "With family or neighbour support",
    "Voluntariado social, ajuda domiciliária": "Social volunteering, home support",
    "Não tem apoio": "Has no support",
    "Pendente de institucionalização": "Pending institutionalization",
    "Tem cuidados permanentes": "Has permanent care",
    "2.6 Ecomapa": "2.6 Ecomap",
    "Ecomapa": "Ecomap",
    "Pessoa/Família": "Person/Family",
    "Sistema/Rede": "System/Network",
    "Ligação forte": "Strong link",
    "Ligação fraca/ténue": "Weak link",
    "Ligação stressante": "Stressful link",
    "Fluxo para o utente": "Flow to client",
    "Fluxo do utente": "Flow from client",
    "Fluxo bidirecional": "Bidirectional flow",
    "Utente/família": "Client/family",
    "Utente / família": "Client / family",
    "Nome do sistema/rede:": "System/network name:",
    "Nome:": "Name:",
    "Seleciona dois elementos para criar a ligação.": "Select two elements to create the link.",
    "Seleciona dois elementos, ou seleciona primeiro os dois progenitores e depois o filho.": "Select two elements, or select the two parents first and then the child.",
    "Seleciona um elemento para editar.": "Select one element to edit.",
    "Seleciona uma pessoa.": "Select a person.",
    "Clique uma vez numa figura para selecionar. Para filiação com dois progenitores, selecione primeiro os dois progenitores e depois o filho. Arraste uma figura para a mover.": "Click a figure once to select it. For parent-child links with two parents, select the two parents first and then the child. Drag a figure to move it.",
    "Adicionar registo": "Add record",
    "Rede externa": "External network",
    "Forte": "Strong",
    "Fraca": "Weak",
    "Para utente": "To client",
    "Do utente": "From client",
    "Dois sentidos": "Two-way",
    "Ligar selecionados": "Connect selected",
    "Editar selecionado": "Edit selected",
    "Apagar selecionado": "Delete selected",
    "Legenda": "Legend",
    "Notas": "Notes",
    "3. Saúde": "3. Health",
    "História e doença atual": "Current history and illness",
    "Antecedentes Psiquiátricos Pessoais": "Personal psychiatric history",
    "Antecedentes Psiquiátricos Familiares": "Family psychiatric history",
    "Internamentos": "Admissions",
    "Outros problemas de saúde e antecedentes médicos a referir": "Other health problems and medical history to mention",
    "Antipsicótico injetável": "Injectable antipsychotic",
    "Local de administração": "Administration location",
    "Responsável": "Responsible person",
    "4. Outros Aspetos Relevantes na Reabilitação": "4. Other Relevant Aspects in Rehabilitation",
    "4.1 Breve descrição da Rotina": "4.1 Brief description of routine",
    "Horário de deitar": "Bedtime",
    "Horário de levantar": "Wake-up time",
    "Número de horas que costuma dormir": "Usual number of sleeping hours",
    "Acorda antes da hora desejada": "Wakes up before the desired time",
    "Observações sobre sono/repouso": "Notes on sleep/rest",
    "4.3 Condição Física": "4.3 Physical Condition",
    "4.4 Comportamentos de risco/Consumos": "4.4 Risk behaviours/Use",
    "4.5 Adesão terapêutica": "4.5 Therapeutic adherence",
    "4.6 Atividades de Vida Diária Instrumentais - Perspetiva do Utente": "4.6 Instrumental Activities of Daily Living - Client's Perspective",
    "Gestão de Dinheiro": "Money management",
    "Gestão de Medicação": "Medication management",
    "Preparação de Refeições": "Meal preparation",
    "Cuidados Domésticos (limpeza, roupa, etc.)": "Household tasks (cleaning, laundry, etc.)",
    "Autocuidado": "Self-care",
    "Compras de Bens Essenciais": "Essential goods shopping",
    "Gestão de Agenda/Compromissos": "Schedule/appointment management",
    "Comunicação (telefone, e-mail, etc.)": "Communication (phone, email, etc.)",
    "Gestão de Documentação Pessoal": "Personal document management",
    "Relacionamento com Serviços e Entidades": "Relationship with Services and Entities",
    "Planeamento e Organização do Dia": "Day planning and organization",
    "AVDI's": "IADLs",
    "Independente": "Independent",
    "Com Ajuda Parcial": "With partial help",
    "Dependente": "Dependent",
    "Observações/Relevância": "Notes/Relevance",
    "5. Informações relevantes a registar": "5. Relevant information to record",
    "Informações relevantes": "Relevant information",
    "6. Contactos Úteis": "6. Useful Contacts",
    "Contactos": "Contacts",
    "Sim": "Yes",
    "Não": "No",

    "Registos": "Records",
    "Nome do Utente": "Client name",
    "Data / Âmbito / Tipo": "Date / Scope / Type",
    "Descrição da Intervenção / Atividades Realizadas": "Intervention Description / Activities Performed",
    "Observações / Recomendações": "Notes / Recommendations",
    "Profissionais / Pessoas Envolvidas": "Professionals / People Involved",
    "Âmbito": "Scope",
    "Avaliação Inicial": "Initial Assessment",
    "Acompanhamento de Técnico de Referência": "Reference Technician Follow-up",
    "Intervenção em Crise": "Crisis Intervention",
    "Psicologia": "Psychology",
    "Serviço Social": "Social Work",
    "Terapia Ocupacional": "Occupational Therapy",
    "Diálogo Aberto": "Open Dialogue",
    "Tipo": "Type",
    "Presencial": "In person",
    "Telefónico": "Phone",

    "Criar utilizador": "Create user",
    "Editar utilizador": "Edit user",
    "Eliminar utilizador": "Delete user",
    "Crie acessos novos e edite permissões de utilizadores existentes.": "Create new access accounts and edit existing user permissions.",
    "O acesso fica disponível de imediato.": "Access becomes available immediately.",
    "Escolha um utilizador na lista para editar.": "Choose a user from the list to edit.",
    "Password": "Password",
    "Nova password": "New password",
    "Deixe em branco para manter": "Leave blank to keep current",
    "Cargo": "Role",
    "Estado": "Status",
    "Ativo": "Active",
    "Inativo": "Inactive",
    "Eliminar este utilizador?": "Delete this user?",
    "Utilizador criado com sucesso": "User created successfully",
    "Utilizador atualizado com sucesso": "User updated successfully",
    "Utilizador eliminado com sucesso": "User deleted successfully",
    "Nome, email e password são obrigatórios.": "Name, email and password are required.",
    "Nome e email são obrigatórios.": "Name and email are required.",
    "Já existe um utilizador com esse email.": "A user with this email already exists.",
    "Escolha um utilizador para editar.": "Choose a user to edit.",
    "Utilizador não encontrado.": "User not found.",
    "Não pode remover ou desativar o último administrador ativo.": "You cannot remove or deactivate the last active administrator.",
    "Não pode eliminar o último administrador ativo.": "You cannot delete the last active administrator.",
    "Quando": "When",
    "Quem": "Who",
    "Ação": "Action",
    "Área": "Area",
    "Detalhes": "Details",
    "Veja quem fez alterações, o que fez e quando fez.": "See who changed what, and when.",
    "Ainda não existem alterações registadas.": "There are no recorded changes yet.",
    "Criou utente": "Created client",
    "Guardou utente": "Saved client",
    "Guardou aba": "Saved tab",
    "Eliminou utente": "Deleted client",
    "Alterou estado de utente": "Changed client status",
    "Criou utilizador": "Created user",
    "Editou utilizador": "Edited user",
    "Eliminou utilizador": "Deleted user",
    "Alterou tema": "Changed theme",
    "Alterou idioma": "Changed language",
    "Entrou no sistema": "Signed in",
    "O manual de utilização será acrescentado numa fase seguinte.": "The user manual will be added later.",
    "Esta área já está preparada no menu, mas ainda não tem funcionalidades ativas.": "This area is already available in the menu, but does not have active features yet.",
}


EN_STATIC_TRANSLATION_ITEMS = sorted(EN_STATIC_TRANSLATIONS.items(), key=lambda item: len(item[0]), reverse=True)
EN_STATIC_TRANSLATION_PATTERN = re.compile("|".join(re.escape(source) for source, _target in EN_STATIC_TRANSLATION_ITEMS))


def translate_static_fragment(text):
    return EN_STATIC_TRANSLATION_PATTERN.sub(lambda match: EN_STATIC_TRANSLATIONS[match.group(0)], text)


class StaticHtmlTranslator(HTMLParser):
    TRANSLATABLE_ATTRS = {"aria-label", "title", "placeholder", "alt", "onsubmit"}
    RAW_TAGS = {"style", "script", "textarea"}

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.parts = []
        self.tag_stack = []
        self.no_translate_depth = 0

    def render_attrs(self, attrs, translate=True):
        rendered = []
        for name, value in attrs:
            if value is None:
                rendered.append(name)
                continue
            if translate and name in self.TRANSLATABLE_ATTRS:
                value = translate_static_fragment(value)
            rendered.append(f'{name}="{html.escape(value, quote=True)}"')
        return (" " + " ".join(rendered)) if rendered else ""

    def handle_decl(self, decl):
        self.parts.append(f"<!{decl}>")

    def handle_starttag(self, tag, attrs):
        starts_no_translate = self.no_translate_depth > 0 or any(
            name == "data-no-translate" and value == "1" for name, value in attrs
        )
        self.tag_stack.append(tag)
        self.parts.append(f"<{tag}{self.render_attrs(attrs, translate=not starts_no_translate)}>")
        if starts_no_translate:
            self.no_translate_depth += 1

    def handle_startendtag(self, tag, attrs):
        starts_no_translate = self.no_translate_depth > 0 or any(
            name == "data-no-translate" and value == "1" for name, value in attrs
        )
        self.parts.append(f"<{tag}{self.render_attrs(attrs, translate=not starts_no_translate)}>")

    def handle_endtag(self, tag):
        for index in range(len(self.tag_stack) - 1, -1, -1):
            if self.tag_stack[index] == tag:
                del self.tag_stack[index:]
                break
        self.parts.append(f"</{tag}>")
        if self.no_translate_depth > 0:
            self.no_translate_depth -= 1

    def handle_data(self, data):
        if self.no_translate_depth > 0 or any(tag in self.RAW_TAGS for tag in self.tag_stack):
            self.parts.append(data)
            return
        translated = translate_static_fragment(data)
        self.parts.append(html.escape(translated, quote=False))

    def handle_entityref(self, name):
        self.parts.append(f"&{name};")

    def handle_charref(self, name):
        self.parts.append(f"&#{name};")

    def handle_comment(self, data):
        self.parts.append(f"<!--{data}-->")


def translate_static_html(markup, current_user):
    if user_language(current_user) != "en":
        return markup
    parser = StaticHtmlTranslator()
    parser.feed(markup)
    parser.close()
    return "".join(parser.parts)


def normalize_language(language):
    return "en" if language == "en" else "pt"


def user_language(user):
    return normalize_language(user.get("idioma") if user else "pt")


def tr(user, key):
    language = user_language(user)
    return TRANSLATIONS.get(language, TRANSLATIONS["pt"]).get(key, TRANSLATIONS["pt"].get(key, key))


def profile_label(profile, user):
    if profile == PERFIL_ADMIN:
        return tr(user, "admin")
    return tr(user, "user")


def history_target_label(value, user):
    if user_language(user) != "en":
        return value
    return {
        "Utente": "Client",
        "Utilizador": "User",
        "Conta": "Account",
        "Sessão": "Session",
    }.get(value, value)


def log_action(user, acao, alvo_tipo, alvo_id=None, detalhes=""):
    timestamp = now()
    user_id = user.get("id") if user else None
    user_name = user.get("nome") if user else "Sistema"
    if supabase_available():
        table_insert(
            "historico",
            {
                "utilizador_id": user_id,
                "utilizador_nome": user_name,
                "acao": acao,
                "alvo_tipo": alvo_tipo,
                "alvo_id": alvo_id,
                "detalhes": detalhes,
                "created_at": timestamp,
            },
        )
        return
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO historico (utilizador_id, utilizador_nome, acao, alvo_tipo, alvo_id, detalhes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, user_name, acao, alvo_tipo, alvo_id, detalhes, timestamp),
        )


def render_page(title, content, notice="", current_user=None, embedded=False):
    notice_html = f'<div class="notice">{esc(notice)}</div>' if notice else ""
    header_html = render_header(current_user) if current_user and not embedded else ""
    body_classes = []
    if current_user and current_user.get("tema") == "escuro":
        body_classes.append("dark-theme")
    if embedded:
        body_classes.append("utility-body")
    body_class = " ".join(body_classes)
    page_language = user_language(current_user)
    app_script = translate_static_fragment(APP_SCRIPT) if page_language == "en" else APP_SCRIPT
    default_theme = "dark" if current_user and current_user.get("tema") == "escuro" else "light"
    loading_label = tr(current_user, "loading") if current_user else "A carregar"
    area_title = tr(current_user, "app_title") if current_user else "Gest\u00e3o de Utentes"
    browser_title = f"{area_title} | MenteMovimento"
    auth_loading_html = f'<div id="centralAuthLoading" class="central-auth-loading" role="status" aria-label="{esc(loading_label)}"><span aria-hidden="true"></span></div>' if current_user else ""
    manual_dialog_html = render_manual_choice_dialog(current_user) if current_user and not embedded else ""
    frame_dialog_html = render_common_frame_dialog(current_user) if current_user and not embedded else ""
    page = f"""<!doctype html>
<html lang="{esc(page_language)}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{esc(browser_title)}</title>
    <link rel="icon" href="/static/favicon.png?v=1" type="image/png">
    <link rel="shortcut icon" href="/static/favicon.png?v=1" type="image/png">
    <script>document.documentElement.dataset.centralAuthPending = "true";</script>
    <style>html[data-central-auth-pending="true"] body > :not(#centralAuthLoading){{visibility:hidden}}</style>
    <script src="/static/vendor/supabase.js" defer></script>
    <script src="/static/central-config.js" defer></script>
    <script src="/static/central-module-auth.js" defer></script>
    <script src="/static/vendor/lucide.min.js"></script>
    <script>
        (() => {{
            try {{
                const keys = ["central-theme", "socios-theme", "mentemovimento-theme"];
                const stored = keys.map((key) => localStorage.getItem(key)).find((value) => value === "dark" || value === "light");
                const theme = stored || "{default_theme}";
                document.documentElement.classList.toggle("dark-theme", theme === "dark");
            }} catch (_error) {{
                document.documentElement.classList.toggle("dark-theme", "{default_theme}" === "dark");
            }}
        }})();
    </script>
    <style>{STYLE}</style>
</head>
<body class="{body_class}">
    {auth_loading_html}
    {header_html}
    <main>
        {notice_html}
        {content}
    </main>
    {manual_dialog_html}
    {frame_dialog_html}
    <script>{app_script}</script>
    <script>lucide.createIcons();</script>
</body>
</html>"""
    return translate_static_html(page, current_user)


def render_header(current_user):
    new_button = ""
    history_button = ""
    account_label = "Account" if user_language(current_user) == "en" else "Conta"
    account_name = current_user.get("nome") or current_user.get("email") or ""
    theme_icon = SUN_ICON if current_user.get("tema") == "escuro" else MOON_ICON
    theme_label = tr(current_user, "light") if current_user.get("tema") == "escuro" else tr(current_user, "dark")
    if can_edit_utentes(current_user):
        new_button = f'<a class="central-primary-action" href="/novo"><span aria-hidden="true">+</span><span>{esc(tr(current_user, "new_client")).lstrip("+ ").strip()}</span></a>'
    if can_view_history(current_user):
        history_button = f"""
        <button class="central-menu-item" type="button" role="menuitem" data-frame-dialog-open="/historico" data-frame-dialog-title="{esc(tr(current_user, "history"))}">
            {HISTORY_ICON}
            <span>{esc(tr(current_user, "history"))}</span>
        </button>
        """

    return f"""
    <header class="central-header">
        <div class="topbar central-topbar">
            <a class="central-brand" href="/dashboard">
                <span class="central-brand-symbol" aria-hidden="true">
                    <img src="/static/mente-movimento-logo.png" alt="">
                </span>
                <span class="central-brand-copy">
                    <strong>MenteMovimento</strong>
                </span>
                <span class="central-loading-indicator" data-loading-indicator role="status" aria-label="{esc(tr(current_user, "loading"))}" title="{esc(tr(current_user, "loading"))}">
                    <span class="central-loading-dot" aria-hidden="true"></span>
                </span>
            </a>

            <nav class="central-nav" aria-label="{esc(tr(current_user, 'nav_areas'))}">
                <a class="central-nav-link" href="/area/socios/">
                    {CENTRAL_SOCIOS_ICON}
                    <span>{esc(tr(current_user, 'nav_socios'))}</span>
                </a>
                <a class="central-nav-link active" href="/area/utentes/">
                    {CENTRAL_UTENTES_ICON}
                    <span>{esc(tr(current_user, 'nav_utentes'))}</span>
                </a>
                <a class="central-nav-link" href="/area/dispositivos/">
                    {CENTRAL_DISPOSITIVOS_ICON}
                    <span>{esc(tr(current_user, 'nav_dispositivos'))}</span>
                </a>
                <a class="central-nav-link" href="/area/atividades/">
                    {CENTRAL_ATIVIDADES_ICON}
                    <span>{esc(tr(current_user, 'nav_atividades'))}</span>
                </a>
            </nav>

            <div class="central-actions" aria-label="{esc(tr(current_user, 'header_tools'))}">
                {new_button}
                <details class="central-menu-wrap">
                    <summary class="central-icon-link central-menu-button" aria-label="{esc(tr(current_user, 'open_menu'))}" title="{esc(tr(current_user, 'open_menu'))}">
                        {MENU_ICON}
                        <span>{esc(tr(current_user, 'open_menu'))}</span>
                    </summary>
                    <div class="central-menu" role="menu">
                        {history_button}
                        <button class="central-menu-item" type="button" role="menuitem" data-manual-dialog-open>
                            {BOOK_ICON}
                            <span>{esc(tr(current_user, "manual"))}</span>
                        </button>
                    </div>
                </details>
                <details class="central-account-wrap">
                    <summary class="central-icon-link central-account-button" aria-label="{esc(account_label)}" title="{esc(account_label)}">
                        {USER_ROUND_ICON}
                        <span>{esc(account_label)}</span>
                    </summary>
                    <div class="central-menu central-account-menu" role="menu">
                        <strong class="central-account-name" title="{esc(account_name)}">{esc(account_name)}</strong>
                        <a class="central-menu-item central-account-logout" href="/logout" role="menuitem" aria-label="{esc(tr(current_user, "logout"))}" title="{esc(tr(current_user, "logout"))}">
                            {LOGOUT_ICON}
                            <span>{esc(tr(current_user, "logout"))}</span>
                        </a>
                    </div>
                </details>
            </div>
        </div>
    </header>
    """


def render_manual_choice_dialog(current_user):
    if user_language(current_user) == "en":
        title = "Manual"
        subtitle = "Choose the guide you want to open."
        user_title = "User manual"
        user_description = "For day-to-day use: login, clients, tabs, saving, PDFs, history, theme and language."
        developer_title = "Developer manual"
        developer_description = "For maintaining the project: code, GitHub, Supabase, Vercel, deploys and safe changes."
        close_label = "Close"
    else:
        title = "Manual"
        subtitle = "Escolha o manual que pretende consultar."
        user_title = "Manual do Utilizador"
        user_description = "Para quem usa a app no dia a dia: login, utentes, separadores, gravacao, PDFs, historico, tema e idioma."
        developer_title = "Manual do Programador"
        developer_description = "Para quem mantem o projeto: codigo, GitHub, Supabase, Vercel, publicacao e alteracoes seguras."
        close_label = "Fechar"
    return f"""
    <dialog class="manual-dialog" id="manualChoiceDialog">
        <section class="manual-dialog-panel" aria-label="{esc(title)}">
            <div class="manual-dialog-head">
                <div>
                    <h2>{esc(title)}</h2>
                    <p>{esc(subtitle)}</p>
                </div>
                <button class="central-icon-link" id="closeManualChoiceDialog" type="button" title="{esc(close_label)}" aria-label="{esc(close_label)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    <span>{esc(close_label)}</span>
                </button>
            </div>
            <div class="manual-dialog-options">
                <a class="manual-dialog-card" href="/manual/utilizador">
                    <span class="manual-dialog-icon" aria-hidden="true">{BOOK_ICON}</span>
                    <span class="manual-dialog-copy">
                        <strong>{esc(user_title)}</strong>
                        <span>{esc(user_description)}</span>
                    </span>
                </a>
                <a class="manual-dialog-card" href="/manual/desenvolvedor">
                    <span class="manual-dialog-icon" aria-hidden="true">{SHIELD_ICON}</span>
                    <span class="manual-dialog-copy">
                        <strong>{esc(developer_title)}</strong>
                        <span>{esc(developer_description)}</span>
                    </span>
                </a>
            </div>
        </section>
    </dialog>
    """


def render_common_frame_dialog(current_user):
    title = "Opção" if user_language(current_user) == "pt" else "Option"
    close_label = esc(tr(current_user, "close"))
    return f"""
    <dialog class="frame-dialog" id="commonFrameDialog">
        <section class="frame-dialog-panel" aria-label="{esc(title)}">
            <div class="frame-dialog-head">
                <h2 id="commonFrameDialogTitle">{esc(title)}</h2>
                <button class="central-icon-link" id="closeCommonFrameDialog" type="button" title="{close_label}" aria-label="{close_label}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    <span>{close_label}</span>
                </button>
            </div>
            <iframe class="frame-dialog-frame" id="commonFrameDialogFrame" title="{esc(title)}" src="about:blank"></iframe>
        </section>
    </dialog>
    """


def render_form(action, title, utente=None, error="", current_user=None):
    utente = utente or {}
    error_html = f'<div class="notice">{esc(error)}</div>' if error else ""
    submit_text = tr(current_user, "save_client") if action == "/adicionar" else tr(current_user, "save_changes")
    content = f"""
{error_html}
<form class="panel form-panel" method="post" action="{action}">
    <input type="hidden" name="id" value="{esc(utente.get('id'))}">
    <div class="grid">
        <div class="field full">
            <label for="nome">{esc(tr(current_user, "full_name"))}</label>
            <input id="nome" name="nome" value="{esc(utente.get('nome'))}" required autofocus>
        </div>
    </div>
    <div class="actions">
        <a class="button secondary" href="/">{esc(tr(current_user, "cancel"))}</a>
        <button class="button" type="submit">{submit_text}</button>
    </div>
</form>
"""
    return render_page(title, content, current_user=current_user)


def render_login_page(error="", language="pt"):
    error_html = f'<div class="notice">{esc(error)}</div>' if error else ""
    language = normalize_language(language)
    area_title = "Client Management" if language == "en" else "Gest\u00e3o de Utentes"
    browser_title = f"{area_title} | MenteMovimento"
    page = f"""<!doctype html>
<html lang="{language}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{esc(browser_title)}</title>
    <link rel="icon" href="/static/favicon.png?v=1" type="image/png">
    <link rel="shortcut icon" href="/static/favicon.png?v=1" type="image/png">
    <style>{STYLE}</style>
</head>
<body class="dark-theme">
    <main class="auth-page">
        <form class="panel auth-card" method="post" action="/login">
            <img class="auth-logo" src="/logo.png" alt="MenteMovimento">
            <h1>Entrar</h1>
            <p class="muted">Aceda à gestão de utentes.</p>
            {error_html}
            <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" required autofocus>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" required>
            </div>
            <div class="actions">
                <button class="button" type="submit">Entrar</button>
            </div>
        </form>
    </main>
</body>
</html>"""
    return translate_static_html(page, {"idioma": language})


PENCIL_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
</svg>
"""


CENTRAL_SOCIOS_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M16 10h2"></path>
    <path d="M16 14h2"></path>
    <path d="M6.17 15a3 3 0 0 1 5.66 0"></path>
    <circle cx="9" cy="11" r="2"></circle>
    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
</svg>
"""


CENTRAL_UTENTES_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"></path>
</svg>
"""


CENTRAL_DISPOSITIVOS_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 17v4"></path>
    <path d="m14.305 7.53.923-.382"></path>
    <path d="m15.228 4.852-.923-.383"></path>
    <path d="m16.852 3.228-.383-.924"></path>
    <path d="m16.852 8.772-.383.923"></path>
    <path d="m19.148 3.228.383-.924"></path>
    <path d="m19.53 9.696-.382-.924"></path>
    <path d="m20.772 4.852.924-.383"></path>
    <path d="m20.772 7.148.924.383"></path>
    <path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
    <path d="M8 21h8"></path>
    <circle cx="18" cy="6" r="3"></circle>
</svg>
"""


TRASH_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18"></path>
    <path d="M8 6V4h8v2"></path>
    <path d="M19 6l-1 14H6L5 6"></path>
    <path d="M10 11v5"></path>
    <path d="M14 11v5"></path>
</svg>
"""


REFRESH_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 15.3-6.3"></path>
    <path d="M18 3v5h-5"></path>
    <path d="M21 12a9 9 0 0 1-15.3 6.3"></path>
    <path d="M6 21v-5h5"></path>
</svg>
"""


CLOSE_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
</svg>
"""


SAVE_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path>
    <path d="M17 21v-8H7v8"></path>
    <path d="M7 3v5h8"></path>
</svg>
"""


USER_PLUS_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M19 8v6"></path>
    <path d="M22 11h-6"></path>
</svg>
"""


USER_CHECK_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="m16 11 2 2 4-4"></path>
</svg>
"""


USER_X_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="m17 8 5 5"></path>
    <path d="m22 8-5 5"></path>
</svg>
"""


MONEY_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="18" height="12" rx="2"></rect>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M6 9h.01"></path>
    <path d="M18 15h.01"></path>
</svg>
"""


CODE_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m16 18 6-6-6-6"></path>
    <path d="m8 6-6 6 6 6"></path>
    <path d="m14.5 4-5 16"></path>
</svg>
"""


EYE_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
    <circle cx="12" cy="12" r="3"></circle>
</svg>
"""


STATS_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 19V5"></path>
    <path d="M4 19h16"></path>
    <rect x="7" y="11" width="3" height="5"></rect>
    <rect x="12" y="7" width="3" height="9"></rect>
    <rect x="17" y="9" width="3" height="7"></rect>
</svg>
"""


DOWNLOAD_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <path d="M7 10l5 5 5-5"></path>
    <path d="M12 15V3"></path>
</svg>
"""


SHIELD_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 6 5.5v5.2c0 3.7 2.4 7.2 6 8.8 3.6-1.6 6-5.1 6-8.8V5.5Z"></path>
    <path d="m9.5 12 1.7 1.7 3.5-4"></path>
</svg>
"""


USERS_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 21a8 8 0 0 0-16 0"></path>
    <circle cx="10" cy="8" r="5"></circle>
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
</svg>
"""


USER_ROUND_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="5"></circle>
    <path d="M20 21a8 8 0 0 0-16 0"></path>
</svg>
"""


CENTRAL_ATIVIDADES_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 2v4"></path>
    <path d="M16 2v4"></path>
    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
    <path d="M3 10h18"></path>
    <path d="M8 14h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 18h.01"></path>
    <path d="M12 18h.01"></path>
    <path d="M16 18h.01"></path>
</svg>
"""


MENU_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16"></path>
    <path d="M4 12h16"></path>
    <path d="M4 17h16"></path>
</svg>
"""


LOGOUT_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 17 15 12l-5-5"></path>
    <path d="M15 12H3"></path>
    <path d="M13 5V4h7v16h-7v-1"></path>
</svg>
"""


MOON_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"></path>
</svg>
"""


SUN_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="m4.93 4.93 1.41 1.41"></path>
    <path d="m17.66 17.66 1.41 1.41"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="m6.34 17.66-1.41 1.41"></path>
    <path d="m19.07 4.93-1.41 1.41"></path>
</svg>
"""


HISTORY_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7"></path>
    <path d="M3 4v5h5"></path>
    <path d="M12 7v5l3 2"></path>
</svg>
"""


BOOK_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"></path>
</svg>
"""


LANGUAGE_ICON = """
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 8 6 6"></path>
    <path d="m4 14 6-6 2-3"></path>
    <path d="M2 5h12"></path>
    <path d="M7 2h1"></path>
    <path d="m14 22 5-11 5 11"></path>
    <path d="M16 18h6"></path>
</svg>
"""


REFERENCIACAO_TEXT_FIELDS = [
    "data_rececao",
    "processo_numero",
    "ref_nome",
    "data_nascimento",
    "idade",
    "numero_processo",
    "morada",
    "codigo_postal",
    "freguesia",
    "concelho",
    "contacto_telefonico",
    "nif",
    "familiar_referencia",
    "parentesco",
    "contacto_familiar",
    "tecnico_nome",
    "relacao_candidato",
    "entidade",
    "entidade_contacto",
    "entidade_email",
    "diagnostico_atual",
    "antecedentes_clinicos",
    "data_primeiro_internamento",
    "data_ultimo_internamento",
    "numero_internamentos",
    "tratamento_outro",
    "resumo_situacao",
    "problema_outros_texto",
    "risco_outro_texto",
    "motivo_outro_texto",
]


REFERENCIACAO_CHECKBOX_GROUPS = [
    (
        "Tratamento em",
        [
            ("tratamento_hospital_dia", "Hospital de Dia"),
            ("tratamento_consulta_externa", "Consulta Externa"),
            ("tratamento_internamento", "Internamento"),
            ("tratamento_outro_check", "Outro"),
        ],
        "inline",
    ),
    (
        "Outros Problemas de Saúde",
        [
            ("problema_urinarios", "Urinários"),
            ("problema_reumaticos", "Reumáticos"),
            ("problema_cardiacos", "Cardíacos"),
            ("problema_hipertensao", "Hipertensão"),
            ("problema_hiv_sida", "HIV/SIDA"),
            ("problema_infetocontagiosas", "Doenças infetocontagiosas"),
            ("problema_cancerigenas", "Doenças cancerígenas"),
            ("problema_sistema_nervoso", "Sistema nervoso"),
            ("problema_visao", "Visão"),
            ("problema_diabetes", "Diabetes"),
            ("problema_alergias", "Alergias"),
            ("problema_intestinais", "Intestinais"),
            ("problema_respiratorios", "Respiratórios"),
            ("problema_auditivos", "Auditivos"),
            ("problema_outros", "Outros"),
        ],
        "grid",
    ),
    (
        "5. Avaliação de Risco",
        [
            ("risco_sem_adesao", "Sem adesão Terapêutica"),
            ("risco_agressivos", "Comportamentos Agressivos"),
            ("risco_sem_retaguarda", "Sem Retaguarda Familiar"),
            ("risco_automutilatorios", "Comportamentos Automutilatórios"),
            ("risco_ideacao_suicida", "Ideação Suicida"),
            ("risco_substancias", "Consumo de Substâncias"),
            ("risco_outro", "Outro"),
        ],
        "grid",
    ),
    (
        "6. Motivo do Encaminhamento",
        [
            ("motivo_ativacao", "Ativação Comportamental"),
            ("motivo_competencias_sociais", "Treino de Competências Sociais"),
            ("motivo_rotinas", "Estruturação de Rotinas"),
            ("motivo_isolamento", "Redução do Isolamento Social"),
            ("motivo_sintomatologia", "Gestão da Sintomatologia"),
            ("motivo_avd", "Treino da Funcionalidade (Atividades de Vida Diária)"),
            ("motivo_laboral", "Treino da Funcionalidade (Laboral/Comunidade)"),
            ("motivo_relacional", "Treino da Funcionalidade (Relacional/Social)"),
            ("motivo_outro", "Outro"),
        ],
        "grid",
    ),
]


MEDICATION_COLUMNS = [
    ("medicamento", "Medicamento"),
    ("jejum", "Jejum"),
    ("pre_almoco", "P. Almoço"),
    ("almoco", "Almoço"),
    ("lanche", "Lanche"),
    ("jantar", "Jantar"),
    ("deitar", "Deitar"),
    ("observacoes", "Observações"),
]

MEDICATION_ROWS = 8

PAGAMENTO_TEXT_FIELDS = [
    "pag_estado",
    "pag_mensalidade_ate",
    "pag_data",
    "pag_forma",
    "pag_valor",
    "pag_referencia",
    "pag_observacoes",
]

MONTH_NAMES_PT = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

MONTH_NAMES_EN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

PAGAMENTO_ESTADOS = [
    ("pago", "Pago"),
    ("isento", "Isento"),
]

PAGAMENTO_FORMAS = [
    ("", "Selecionar"),
    ("transferencia", "Transferência bancária"),
    ("dinheiro", "Dinheiro"),
    ("mbway", "MB Way"),
    ("multibanco", "Multibanco"),
]


EMERGENCIA_TEXT_FIELDS = [
    "em_processo_numero",
    "em_nome",
    "em_data_nascimento",
    "em_idade",
    "em_contacto_urgencia_nome",
    "em_contacto_urgencia_contactos",
    "em_grupo_sanguineo",
    "em_numero_sns",
    "em_medico_familia",
    "em_medico_familia_telefone",
    "em_centro_saude",
    "em_medico_psiquiatra",
    "em_entidade",
    "em_entidade_contacto",
    "em_diagnostico_atual",
    "em_alergias",
    "em_observacoes",
    "em_informacao_geral",
    "em_problema_outros_texto",
]


EMERGENCIA_HEALTH_PROBLEM_MAP = {
    "em_problema_urinarios": "problema_urinarios",
    "em_problema_reumaticos": "problema_reumaticos",
    "em_problema_cardiacos": "problema_cardiacos",
    "em_problema_hipertensao": "problema_hipertensao",
    "em_problema_hiv_sida": "problema_hiv_sida",
    "em_problema_infetocontagiosas": "problema_infetocontagiosas",
    "em_problema_cancerigenas": "problema_cancerigenas",
    "em_problema_sistema_nervoso": "problema_sistema_nervoso",
    "em_problema_visao": "problema_visao",
    "em_problema_diabetes": "problema_diabetes",
    "em_problema_alergias": "problema_alergias",
    "em_problema_intestinais": "problema_intestinais",
    "em_problema_respiratorios": "problema_respiratorios",
    "em_problema_auditivos": "problema_auditivos",
    "em_problema_outros": "problema_outros",
}


INSCRICAO_TEXT_FIELDS = [
    "ins_data",
    "ins_processo_numero",
    "ins_nome",
    "ins_nome_tratado",
    "ins_contactos",
    "ins_morada",
    "ins_codigo_postal",
    "ins_data_nascimento",
    "ins_naturalidade",
    "ins_cartao_cidadao",
    "ins_nif",
    "ins_numero_sns",
    "ins_niss",
    "ins_pessoa_referencia",
    "ins_pedido_descricao",
    "ins_servico_outro_texto",
    "ins_admissibilidade_resposta",
    "ins_admissibilidade_outro_texto",
    "ins_admissibilidade_observacoes",
    "ins_transporte_resposta",
    "ins_transporte_observacoes",
    "ins_resposta_social_resposta",
    "ins_resposta_social_motivo",
    "ins_ponder_total",
]


INSCRICAO_SERVICOS = [
    ("ins_servico_atividade_fisica", "Atividade Física (Ginástica, Hidroginástica, etc.)"),
    ("ins_servico_pilates", "Pilates"),
    ("ins_servico_yoga", "Yoga"),
    ("ins_servico_expressao_corporal", "Expressão Corporal (Teatro, dança, etc.)"),
    ("ins_servico_expressao_artistica", "Expressão Artística (Desenho, Pintura, Fotografia, etc.)"),
    ("ins_servico_expressao_musical", "Expressão Musical"),
    ("ins_servico_conversacao", "Grupos de Conversação"),
    ("ins_servico_avd", "Treino de Atividades de Vida Diária"),
    ("ins_servico_relaxamento", "Relaxamento"),
    ("ins_servico_competencias_sociais", "Treino de Competências Sociais"),
    ("ins_servico_atelier_laboral", "Atelier Laboral"),
    ("ins_servico_psicoterapia_individual", "Psicoterapia Individual"),
    ("ins_servico_estimulacao_cognitiva", "Estimulação Cognitiva"),
    ("ins_servico_formacao_profissional", "Formação Profissional"),
    ("ins_servico_outro", "Outro"),
]


INSCRICAO_ADMISSIBILIDADE = [
    ("ins_nao_aceitacao", "Não Aceitação"),
    ("ins_grau_dependencia", "Grau de dependência elevado"),
    ("ins_consumo_substancias", "Consumo de Substâncias"),
    ("ins_admissibilidade_outro", "Outro"),
]


INSCRICAO_PONDERACAO_ROWS = [
    ("idade", "Idade do utente (quanto menor for, maior pontuação)", "0,15"),
    ("residencia", "Residência na Região de Entre Douro e Vouga", "0,05"),
    ("familia", "Limitações na estrutura familiar", "0,15"),
    ("chedv", "Encaminhado pelo Departamento de Saúde Mental do CHEDV", "0,05"),
    ("estabilizacao", "Estabilização clínica ultrapassada da fase aguda da doença", "0,15"),
    ("funcionalidade_basica", "Funcionalidade básica conservada ou adquirida em reabilitação anterior", "0,10"),
    ("perturbacao_funcionalidade", "Perturbação da funcionalidade relacional, ocupacional e/ou profissional", "0,20"),
    ("atividade_util", "Capacidade para eventual exercício de atividade socialmente útil", "0,10"),
    ("tempo_doenca", "Tempo de evolução da doença (quanto menor for, maior pontuação)", "0,05"),
]


DIAGNOSTICA_TEXT_FIELDS = [
    "diag_data_avaliacao",
    "diag_processo_numero",
    "diag_tecnico_referencia",
    "diag_nome",
    "diag_estado_civil",
    "diag_nacionalidade",
    "diag_linguas",
    "diag_idade_escolaridade",
    "diag_escolaridade_observacoes",
    "diag_labor_observacoes",
    "diag_relacao_juridica",
    "diag_tempo_trabalho",
    "diag_insercao_outros_texto",
    "diag_economica_observacoes",
    "diag_habitacao_observacoes",
    "diag_familiar_outro_texto",
    "diag_genograma",
    "diag_relacoes_outro_texto",
    "diag_rede_outro_texto",
    "diag_ecomapa",
    "diag_historia_doenca",
    "diag_antecedentes_pessoais",
    "diag_antecedentes_familiares",
    "diag_internamentos",
    "diag_outros_problemas_saude",
    "diag_antipsicotico_injetavel",
    "diag_antipsicotico_local",
    "diag_antipsicotico_responsavel",
    "diag_rotina",
    "diag_sono_deitar",
    "diag_sono_levantar",
    "diag_sono_horas",
    "diag_sono_acorda_antes",
    "diag_sono_observacoes",
    "diag_condicao_fisica",
    "diag_comportamentos_risco",
    "diag_adesao_terapeutica",
    "diag_informacoes_relevantes",
    "diag_contactos_uteis",
]


DIAGNOSTICA_ESTADO_CIVIL = [
    ("solteiro", "Solteiro(a)"),
    ("casado", "Casado(a)"),
    ("uniao_facto", "União de Facto"),
    ("separado_divorciado", "Separado(a)/Divorciado(a)"),
    ("viuvo", "Viúvo(a)"),
]


DIAGNOSTICA_ESCOLARIDADE = [
    ("diag_esc_nao_sabe", "Não sabe ler, nem escrever"),
    ("diag_esc_sabe_ler", "Sabe ler e escrever"),
    ("diag_esc_basico", "Ensino Básico (ensino primário)"),
    ("diag_esc_preparatorio", "Ensino Preparatório"),
    ("diag_esc_secundario", "Ensino Secundário"),
    ("diag_esc_bacharelato", "Bacharelato"),
    ("diag_esc_tecnico", "Ensino Técnico Profissional"),
    ("diag_esc_licenciatura", "Licenciatura"),
    ("diag_esc_pos_graduacao", "Pós-graduação"),
    ("diag_esc_mestrado", "Mestrado"),
    ("diag_esc_doutoramento", "Doutoramento"),
]


DIAGNOSTICA_LABORAL = [
    ("diag_labor_conta_propria", "Trabalho por conta própria"),
    ("diag_labor_conta_outrem", "Trabalho por conta de outrem"),
    ("diag_labor_prestacao_servicos", "Prestação de Serviços"),
    ("diag_labor_desempregado", "Desempregado"),
    ("diag_labor_voluntariado", "Voluntariado"),
    ("diag_labor_reforma_invalidez", "Reforma/Invalidez"),
]


DIAGNOSTICA_RELACAO_JURIDICA = [
    ("termo_certo", "Contrato a Termo Certo"),
    ("termo_incerto", "Contrato a Termo Incerto (efetivo)"),
    ("temporario", "Trabalho temporário/Substituição"),
    ("estagio", "Estágio Profissional"),
]


DIAGNOSTICA_INSERCAO = [
    ("diag_insercao_precario", "Emprego Precário"),
    ("diag_insercao_baixa_qualificacao", "Baixa Qualificação Profissional"),
    ("diag_insercao_desadequacao", "Desadequação entre expectativas/habilitações académicas"),
    ("diag_insercao_falta_ofertas", "Falta de ofertas do mercado de trabalho"),
    ("diag_insercao_salarios_atraso", "Salários em atraso"),
    ("diag_insercao_horario", "Dificuldade de adaptação a um horário rígido"),
    ("diag_insercao_outros", "Outros"),
]


DIAGNOSTICA_ECONOMICA = [
    ("diag_econ_trabalho", "Rendimento do Trabalho"),
    ("diag_econ_psi", "Prestação Social para a Inclusão (PSI)"),
    ("diag_econ_subsidio_doenca", "Subsídio de Doença"),
    ("diag_econ_pensao_invalidez_relativa", "Pensão de Invalidez relativa"),
    ("diag_econ_pensao_invalidez_absoluta", "Pensão de Invalidez absoluta"),
    ("diag_econ_dependencia", "Complemento por Dependência"),
    ("diag_econ_csi", "Complemento Solidário para Idosos"),
    ("diag_econ_rsi", "Rendimento Social de Inserção (RSI)"),
    ("diag_econ_reforma", "Reforma"),
    ("diag_econ_sem_rendimentos", "Sem Rendimentos"),
]


DIAGNOSTICA_HABITACAO = [
    ("diag_hab_adequada", "Adequada às necessidades"),
    ("diag_hab_barreiras", "Barreiras arquitetónicas na casa"),
    ("diag_hab_humidade", "Humidade, falta de higiene"),
    ("diag_hab_sem_acessibilidades", "Ausência de acessibilidades"),
    ("diag_hab_inadequada", "Habitação inadequada"),
]


DIAGNOSTICA_FAMILIAR = [
    ("diag_familiar_sem_dependencia", "Vive com a família sem dependência física/psíquica"),
    ("diag_familiar_conjuge", "Vive com o cônjuge de similar idade"),
    ("diag_familiar_com_dependencia", "Vive com a família e/ou cônjuge com algum grau de dependência"),
    ("diag_familiar_sozinho_com_familia", "Vive sozinho mas tem familiares próximos"),
    ("diag_familiar_sozinho_sem_familia", "Vive sozinho sem familiares próximos"),
    ("diag_familiar_outro", "Outro"),
]


DIAGNOSTICA_RELACOES_SOCIAIS = [
    ("diag_relacoes_familia", "Relações sociais só com a família"),
    ("diag_relacoes_familia_vizinhos", "Relações sociais só com a família e vizinhos"),
    ("diag_relacoes_recebe_visitas", "Não sai do domicílio, mas recebe visitas"),
    ("diag_relacoes_sem_visitas", "Não sai do domicílio nem recebe visitas"),
    ("diag_relacoes_outro", "Outro"),
]


DIAGNOSTICA_REDE_SOCIAL = [
    ("diag_rede_apoio_familiar", "Com apoio familiar ou de vizinhos"),
    ("diag_rede_voluntariado", "Voluntariado social, ajuda domiciliária"),
    ("diag_rede_sem_apoio", "Não tem apoio"),
    ("diag_rede_institucionalizacao", "Pendente de institucionalização"),
    ("diag_rede_cuidados_permanentes", "Tem cuidados permanentes"),
    ("diag_rede_outro", "Outro"),
]


DIAGNOSTICA_AGREGADO_ROWS = ["a", "b", "c", "d", "e"]
DIAGNOSTICA_AGREGADO_COLUMNS = [
    ("nome", "Nome"),
    ("idade", "Idade"),
    ("data_nascimento", "Data Nasc."),
    ("parentesco", "Parent."),
    ("estado_civil", "Estado Civil"),
    ("habilitacoes", "Habilitações Literárias"),
    ("situacao_profissional", "Situação Profissional"),
    ("observacoes", "Observações"),
]


DIAGNOSTICA_AVDI_ROWS = [
    ("gestao_dinheiro", "Gestão de Dinheiro"),
    ("gestao_medicacao", "Gestão de Medicação"),
    ("preparacao_refeicoes", "Preparação de Refeições"),
    ("cuidados_domesticos", "Cuidados Domésticos (limpeza, roupa, etc.)"),
    ("autocuidado", "Autocuidado"),
    ("compras", "Compras de Bens Essenciais"),
    ("transportes", "Utilização de Transportes"),
    ("agenda", "Gestão de Agenda/Compromissos"),
    ("comunicacao", "Comunicação (telefone, e-mail, etc.)"),
    ("documentacao", "Gestão de Documentação Pessoal"),
    ("servicos", "Relacionamento com Serviços e Entidades"),
    ("planeamento", "Planeamento e Organização do Dia"),
]


ATENDIMENTO_MIN_ROWS = 1
ATENDIMENTO_MAX_ROWS = 40
ATENDIMENTO_ROW_COUNT_FIELD = "atend_row_count"


ATENDIMENTO_TEXT_FIELDS = [
    "atend_nome",
    "atend_processo_numero",
]


ATENDIMENTO_AMBITOS = [
    ("avaliacao_inicial", "Avaliação Inicial"),
    ("tecnico_referencia", "Acompanhamento de Técnico de Referência"),
    ("crise", "Intervenção em Crise"),
    ("psicologia", "Psicologia"),
    ("servico_social", "Serviço Social"),
    ("terapia_ocupacional", "Terapia Ocupacional"),
    ("dialogo_aberto", "Diálogo Aberto"),
    ("outro", "Outro"),
]


ATENDIMENTO_TIPOS = [
    ("presencial", "Presencial"),
    ("telefonico", "Telefónico"),
]


ATENDIMENTO_ROW_KEY_RE = re.compile(r"^atend_(\d+)_(?:data|ambito_|tipo|descricao|observacoes|profissionais)")


def referenciacao_checkbox_keys():
    keys = []
    for _title, options, _layout in REFERENCIACAO_CHECKBOX_GROUPS:
        keys.extend(key for key, _label in options)
    return keys


def default_referenciacao_data():
    data = {key: "" for key in REFERENCIACAO_TEXT_FIELDS}
    data.update({key: "" for key in referenciacao_checkbox_keys()})
    for row in range(MEDICATION_ROWS):
        for key, _label in MEDICATION_COLUMNS:
            data[f"med_{row}_{key}"] = ""
    return data


def load_referenciacao_data(utente_id):
    raw = get_tab_content(utente_id, "referenciacao")
    data = default_referenciacao_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"resumo_situacao": raw}
        if isinstance(stored, dict):
            for key in data:
                if key in stored:
                    data[key] = str(stored.get(key) or "")
            if not data.get("ref_nome") and stored.get("nome"):
                data["ref_nome"] = str(stored.get("nome") or "")
            if not data.get("motivo_outro") and (
                stored.get("motivo_outro_1") or stored.get("motivo_outro_2") or stored.get("motivo_outro_3")
            ):
                data["motivo_outro"] = "1"
            if not data.get("motivo_outro_texto"):
                old_other_values = [
                    str(stored.get("motivo_outro_1_texto") or "").strip(),
                    str(stored.get("motivo_outro_2_texto") or "").strip(),
                    str(stored.get("motivo_outro_3_texto") or "").strip(),
                ]
                data["motivo_outro_texto"] = " | ".join(value for value in old_other_values if value)
    return data


def referenciacao_from_post(post_data):
    data = default_referenciacao_data()
    for key in REFERENCIACAO_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    for key in referenciacao_checkbox_keys():
        data[key] = "1" if field_value(post_data, key) == "on" else ""
    for row in range(MEDICATION_ROWS):
        for key, _label in MEDICATION_COLUMNS:
            data[f"med_{row}_{key}"] = field_value(post_data, f"med_{row}_{key}")
    apply_calculated_ages(data)
    return data


def serialize_referenciacao(post_data):
    return json.dumps(referenciacao_from_post(post_data), ensure_ascii=False)


def default_pagamentos_data():
    data = {key: "" for key in PAGAMENTO_TEXT_FIELDS}
    data["pag_historico"] = []
    return data


def load_pagamentos_data(utente_id):
    raw = get_tab_content(utente_id, "pagamentos")
    data = default_pagamentos_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"pag_observacoes": raw}
        if isinstance(stored, dict):
            for key in data:
                if key == "pag_historico":
                    continue
                if key in stored:
                    data[key] = str(stored.get(key) or "")
            data["pag_historico"] = normalize_pagamento_history(stored.get("pag_historico"))
    if not data.get("pag_mensalidade_ate"):
        data["pag_mensalidade_ate"] = next_payment_month(data)
    return data


def normalize_month_value(value):
    value = str(value or "").strip()
    match = re.search(r"(\d{4})-(\d{2})", value)
    if not match:
        return ""
    year = int(match.group(1))
    month = int(match.group(2))
    if month < 1 or month > 12:
        return ""
    return f"{year:04d}-{month:02d}"


def add_months(month_value, months=1):
    month_value = normalize_month_value(month_value)
    if not month_value:
        today = datetime.now().date()
        return f"{today.year:04d}-{today.month:02d}"
    year, month = [int(part) for part in month_value.split("-")]
    month += months
    while month > 12:
        month -= 12
        year += 1
    while month < 1:
        month += 12
        year -= 1
    return f"{year:04d}-{month:02d}"


def month_label(month_value, language="pt"):
    month_value = normalize_month_value(month_value)
    if not month_value:
        return ""
    year, month = [int(part) for part in month_value.split("-")]
    names = MONTH_NAMES_EN if normalize_language(language) == "en" else MONTH_NAMES_PT
    return f"{names[month - 1]} {year}"


def current_month_value(reference_date=None):
    reference_date = reference_date or datetime.now().date()
    return f"{reference_date.year:04d}-{reference_date.month:02d}"


def month_index(month_value):
    month_value = normalize_month_value(month_value)
    if not month_value:
        return None
    year, month = [int(part) for part in month_value.split("-")]
    return (year * 12) + month


def pending_count_for_payment(month_value, status="pago", reference_date=None):
    payment_index = month_index(month_value)
    current_index = month_index(current_month_value(reference_date))
    if payment_index is None or current_index is None:
        return 1
    status = str(status or "pago").strip()
    if status in ("pago", "isento"):
        return max(current_index - payment_index, 0)
    if payment_index <= current_index:
        return max((current_index - payment_index) + 1, 1)
    return 0


def format_pending_count(count, current_user=None):
    count = int(count or 0)
    if count == 1:
        return tr(current_user, "pending_fee_singular")
    return tr(current_user, "pending_fee_plural").format(count=count)


def format_delay_months(value, current_user=None):
    if value is None:
        return tr(current_user, "not_enough_data")
    value = round(float(value), 1)
    if value == 1:
        return tr(current_user, "monthly_delay_singular")
    number = f"{value:g}"
    return tr(current_user, "monthly_delay_plural").format(count=number)


def month_options(selected=""):
    selected = normalize_month_value(selected)
    current_year = datetime.now().year
    options = [("", "Selecionar mensalidade")]
    for year in range(current_year - 2, current_year + 4):
        for month in range(1, 13):
            value = f"{year:04d}-{month:02d}"
            options.append((value, month_label(value)))
    if selected and all(value != selected for value, _label in options):
        options.insert(1, (selected, month_label(selected)))
    return options


def payment_method_label(value):
    value = str(value or "").strip()
    for option_value, option_label in PAGAMENTO_FORMAS:
        if value == option_value:
            return option_label
    return value


def payment_status_label(value):
    value = str(value or "").strip()
    for option_value, option_label in PAGAMENTO_ESTADOS:
        if value == option_value:
            return option_label
    return value or "Pago"


def normalize_pagamento_history(raw_history):
    if not isinstance(raw_history, list):
        return []
    history = []
    for item in raw_history:
        if not isinstance(item, dict):
            continue
        month_value = normalize_month_value(item.get("mensalidade"))
        if not month_value:
            continue
        history.append(
            {
                "id": str(item.get("id") or f"pag-{len(history) + 1}"),
                "mensalidade": month_value,
                "estado": str(item.get("estado") or "pago"),
                "data": str(item.get("data") or ""),
                "forma": str(item.get("forma") or ""),
                "valor": str(item.get("valor") or ""),
                "referencia": str(item.get("referencia") or ""),
                "observacoes": str(item.get("observacoes") or ""),
                "registado_em": str(item.get("registado_em") or ""),
            }
        )
    return sorted(history, key=lambda row: (row["mensalidade"], row.get("data") or "", row.get("registado_em") or ""), reverse=True)


def latest_pagamento_record(data):
    history = normalize_pagamento_history(data.get("pag_historico"))
    return history[0] if history else None


def payment_pending_count(data, reference_date=None):
    latest = latest_pagamento_record(data)
    if latest:
        return pending_count_for_payment(latest.get("mensalidade"), latest.get("estado"), reference_date)
    old_month = normalize_month_value(data.get("pag_mensalidade_ate"))
    if old_month and data.get("pag_data"):
        return pending_count_for_payment(old_month, data.get("pag_estado") or "pago", reference_date)
    return 1


def next_payment_month(data):
    latest = latest_pagamento_record(data)
    if latest:
        return add_months(latest["mensalidade"], 1)
    current_month = normalize_month_value(data.get("pag_mensalidade_ate"))
    if current_month:
        if data.get("pag_data") or data.get("pag_estado") == "pago":
            return add_months(current_month, 1)
        return current_month
    today = datetime.now().date()
    return f"{today.year:04d}-{today.month:02d}"


def append_payment_record(data, month_value, method, payment_date="", status="pago", amount="", reference="", notes=""):
    month_value = normalize_month_value(month_value)
    method = str(method or "").strip()
    if not month_value or not method:
        raise ValueError("Escolha a mensalidade e a forma de pagamento antes de registar.")
    payment_date = str(payment_date or "").strip() or datetime.now().date().isoformat()
    history = normalize_pagamento_history(data.get("pag_historico"))
    history.append(
        {
            "id": f"pag-{datetime.now().strftime('%Y%m%d%H%M%S')}-{len(history) + 1}",
            "mensalidade": month_value,
            "estado": status or "pago",
            "data": payment_date,
            "forma": method,
            "valor": str(amount or "").strip(),
            "referencia": str(reference or "").strip(),
            "observacoes": str(notes or "").strip(),
            "registado_em": now(),
        }
    )
    data["pag_historico"] = normalize_pagamento_history(history)
    return data


def payment_data_from_existing(existing_data=None):
    existing_data = existing_data or {}
    data = default_pagamentos_data()
    data["pag_historico"] = normalize_pagamento_history(existing_data.get("pag_historico"))
    for key in PAGAMENTO_TEXT_FIELDS:
        data[key] = str(existing_data.get(key) or "")
    data["pag_mensalidade_ate"] = normalize_month_value(data.get("pag_mensalidade_ate"))
    return data


def find_payment_record(data, payment_id):
    payment_id = str(payment_id or "").strip()
    for item in normalize_pagamento_history(data.get("pag_historico")):
        if item.get("id") == payment_id:
            return item
    return None


def cancel_payment_record(data, payment_id):
    payment_id = str(payment_id or "").strip()
    history = normalize_pagamento_history(data.get("pag_historico"))
    removed = None
    remaining = []
    for item in history:
        if item.get("id") == payment_id and removed is None:
            removed = item
        else:
            remaining.append(item)
    if removed is None:
        raise ValueError("Pagamento não encontrado.")
    data["pag_historico"] = normalize_pagamento_history(remaining)
    data["pag_mensalidade_ate"] = next_payment_month(data)
    data["pag_estado"] = "pago"
    data["pag_data"] = ""
    data["pag_forma"] = ""
    data["pag_valor"] = ""
    data["pag_referencia"] = ""
    data["pag_observacoes"] = ""
    return removed


def pagamentos_from_post(post_data, existing_data=None):
    action = field_value(post_data, "pag_action")
    if action.startswith("cancel:"):
        data = payment_data_from_existing(existing_data)
        cancel_payment_record(data, action.split(":", 1)[1])
        return data

    data = payment_data_from_existing(existing_data)
    for key in PAGAMENTO_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    data["pag_mensalidade_ate"] = normalize_month_value(data.get("pag_mensalidade_ate"))
    if action == "add":
        append_payment_record(
            data,
            data.get("pag_mensalidade_ate"),
            data.get("pag_forma"),
            data.get("pag_data"),
            data.get("pag_estado") or "pago",
            data.get("pag_valor"),
            data.get("pag_referencia"),
            data.get("pag_observacoes"),
        )
        data["pag_mensalidade_ate"] = next_payment_month(data)
        data["pag_estado"] = "pago"
        data["pag_data"] = ""
        data["pag_forma"] = ""
        data["pag_valor"] = ""
        data["pag_referencia"] = ""
        data["pag_observacoes"] = ""
    return data


def register_quick_payment(utente_id, method, payment_date=""):
    data = load_pagamentos_data(utente_id)
    month_value = next_payment_month(data)
    append_payment_record(data, month_value, method, payment_date or datetime.now().date().isoformat(), "pago")
    data["pag_mensalidade_ate"] = next_payment_month(data)
    data["pag_estado"] = "pago"
    data["pag_data"] = ""
    data["pag_forma"] = ""
    data["pag_valor"] = ""
    data["pag_referencia"] = ""
    data["pag_observacoes"] = ""
    save_tab_content(utente_id, "pagamentos", json.dumps(data, ensure_ascii=False))
    return month_value


def payment_summary(data, current_user=None):
    latest = latest_pagamento_record(data)
    language = user_language(current_user)
    if latest:
        status = latest.get("estado") or "pago"
        pending_count = payment_pending_count(data)
        pending_suffix = f" ({format_pending_count(pending_count, current_user)})" if pending_count else ""
        label = f"{tr(current_user, 'paid_until')} {month_label(latest.get('mensalidade'), language)}"
        if status not in ("pago", "isento"):
            label = f"{payment_status_label(status)}: {month_label(latest.get('mensalidade'), language)}"
        label = f"{label}{pending_suffix}"
        css_class = "active" if status in ("pago", "isento") and pending_count == 0 else "blocked"
        return {"label": label, "class": css_class, "next_month": next_payment_month(data)}
    old_month = normalize_month_value(data.get("pag_mensalidade_ate"))
    if old_month and data.get("pag_data"):
        pending_count = payment_pending_count(data)
        pending_suffix = f" ({format_pending_count(pending_count, current_user)})" if pending_count else ""
        return {
            "label": f"{tr(current_user, 'paid_until')} {month_label(old_month, language)}{pending_suffix}",
            "class": "active" if pending_count == 0 else "blocked",
            "next_month": add_months(old_month, 1),
        }
    return {"label": tr(current_user, "no_monthly_fee"), "class": "blocked", "next_month": next_payment_month(data)}


def default_emergencia_data():
    data = {key: "" for key in EMERGENCIA_TEXT_FIELDS}
    data.update({key: "" for key in EMERGENCIA_HEALTH_PROBLEM_MAP})
    return data


def load_emergencia_data(utente_id):
    raw = get_tab_content(utente_id, "emergencia")
    data = default_emergencia_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"em_informacao_geral": raw}
        if isinstance(stored, dict):
            for key in data:
                if key in stored:
                    data[key] = str(stored.get(key) or "")
    return data


def emergencia_from_post(post_data):
    data = default_emergencia_data()
    for key in EMERGENCIA_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    for key in EMERGENCIA_HEALTH_PROBLEM_MAP:
        data[key] = "1" if field_value(post_data, key) == "on" else ""
    apply_calculated_ages(data)
    return data


def serialize_emergencia(post_data):
    return json.dumps(emergencia_from_post(post_data), ensure_ascii=False)


def inscricao_checkbox_keys():
    return [key for key, _label in INSCRICAO_SERVICOS + INSCRICAO_ADMISSIBILIDADE]


def inscricao_score_fields():
    fields = []
    for key, _label, _weight in INSCRICAO_PONDERACAO_ROWS:
        fields.extend([f"ins_ponder_{key}_pontuacao", f"ins_ponder_{key}_valor"])
    return fields


def default_inscricao_data():
    data = {key: "" for key in INSCRICAO_TEXT_FIELDS}
    data.update({key: "" for key in inscricao_checkbox_keys()})
    data.update({key: "" for key in inscricao_score_fields()})
    return data


def load_inscricao_data(utente_id):
    raw = get_tab_content(utente_id, "inscricao")
    data = default_inscricao_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"ins_pedido_descricao": raw}
        if isinstance(stored, dict):
            for key in data:
                if key in stored:
                    data[key] = str(stored.get(key) or "")
    return data


def inscricao_from_post(post_data):
    data = default_inscricao_data()
    for key in INSCRICAO_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    for key in inscricao_checkbox_keys():
        data[key] = "1" if field_value(post_data, key) == "on" else ""
    for key in inscricao_score_fields():
        data[key] = field_value(post_data, key)
    return data


def serialize_inscricao(post_data):
    return json.dumps(inscricao_from_post(post_data), ensure_ascii=False)


def diagnostica_checkbox_keys():
    groups = [
        DIAGNOSTICA_ESCOLARIDADE,
        DIAGNOSTICA_LABORAL,
        DIAGNOSTICA_INSERCAO,
        DIAGNOSTICA_ECONOMICA,
        DIAGNOSTICA_HABITACAO,
        DIAGNOSTICA_FAMILIAR,
        DIAGNOSTICA_RELACOES_SOCIAIS,
        DIAGNOSTICA_REDE_SOCIAL,
    ]
    return [key for group in groups for key, _label in group]


def diagnostica_table_fields():
    fields = []
    for row in DIAGNOSTICA_AGREGADO_ROWS:
        for key, _label in DIAGNOSTICA_AGREGADO_COLUMNS:
            fields.append(f"diag_agregado_{row}_{key}")
    for key, _label in DIAGNOSTICA_AVDI_ROWS:
        fields.extend([f"diag_avdi_{key}_nivel", f"diag_avdi_{key}_observacoes"])
    return fields


def default_diagnostica_data():
    data = {key: "" for key in DIAGNOSTICA_TEXT_FIELDS}
    data.update({key: "" for key in diagnostica_checkbox_keys()})
    data.update({key: "" for key in diagnostica_table_fields()})
    return data


def load_diagnostica_data(utente_id):
    raw = get_tab_content(utente_id, "diagnostica")
    data = default_diagnostica_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"diag_informacoes_relevantes": raw}
        if isinstance(stored, dict):
            for key in data:
                if key in stored:
                    data[key] = str(stored.get(key) or "")
    return data


def diagnostica_from_post(post_data):
    data = default_diagnostica_data()
    for key in DIAGNOSTICA_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    for key in diagnostica_checkbox_keys():
        data[key] = "1" if field_value(post_data, key) == "on" else ""
    for key in diagnostica_table_fields():
        data[key] = field_value(post_data, key)
    apply_calculated_ages(data)
    return data


def serialize_diagnostica(post_data):
    return json.dumps(diagnostica_from_post(post_data), ensure_ascii=False)


def raw_mapping_value(mapping, key):
    value = mapping.get(key, "")
    if isinstance(value, (list, tuple)):
        value = value[0] if value else ""
    return str(value or "").strip()


def clamp_atendimento_row_count(value, fallback=ATENDIMENTO_MIN_ROWS):
    try:
        count = int(str(value or "").strip())
    except (TypeError, ValueError):
        count = fallback
    return max(ATENDIMENTO_MIN_ROWS, min(ATENDIMENTO_MAX_ROWS, count))


def atendimento_row_count_from_mapping(mapping, fallback=ATENDIMENTO_MIN_ROWS):
    explicit = raw_mapping_value(mapping, ATENDIMENTO_ROW_COUNT_FIELD)
    explicit_count = clamp_atendimento_row_count(explicit, fallback) if explicit else fallback
    max_index = -1
    for key in mapping:
        match = ATENDIMENTO_ROW_KEY_RE.match(str(key))
        if match:
            max_index = max(max_index, int(match.group(1)))
    inferred_count = max_index + 1 if max_index >= 0 else fallback
    return clamp_atendimento_row_count(max(explicit_count, inferred_count), fallback)


def atendimento_ambito_keys(row_count=ATENDIMENTO_MIN_ROWS):
    row_count = clamp_atendimento_row_count(row_count)
    keys = []
    for row in range(row_count):
        for key, _label in ATENDIMENTO_AMBITOS:
            keys.append(f"atend_{row}_ambito_{key}")
    return keys


def atendimento_row_fields(row_count=ATENDIMENTO_MIN_ROWS):
    row_count = clamp_atendimento_row_count(row_count)
    fields = []
    for row in range(row_count):
        fields.extend(
            [
                f"atend_{row}_data",
                f"atend_{row}_ambito_outro_texto",
                f"atend_{row}_tipo",
                f"atend_{row}_descricao",
                f"atend_{row}_observacoes",
                f"atend_{row}_profissionais",
            ]
        )
    return fields


def default_atendimentos_data(row_count=ATENDIMENTO_MIN_ROWS):
    row_count = clamp_atendimento_row_count(row_count)
    data = {key: "" for key in ATENDIMENTO_TEXT_FIELDS}
    data[ATENDIMENTO_ROW_COUNT_FIELD] = str(row_count)
    data.update({key: "" for key in atendimento_ambito_keys(row_count)})
    data.update({key: "" for key in atendimento_row_fields(row_count)})
    return data


def load_atendimentos_data(utente_id):
    raw = get_tab_content(utente_id, "atendimentos")
    data = default_atendimentos_data()
    if raw:
        try:
            stored = json.loads(raw)
        except json.JSONDecodeError:
            stored = {"atend_0_descricao": raw}
        if isinstance(stored, dict):
            data = default_atendimentos_data(atendimento_row_count_from_mapping(stored))
            for key in data:
                if key in stored:
                    data[key] = str(stored.get(key) or "")
    return data


def atendimentos_from_post(post_data):
    row_count = atendimento_row_count_from_mapping(post_data)
    data = default_atendimentos_data(row_count)
    for key in ATENDIMENTO_TEXT_FIELDS:
        data[key] = field_value(post_data, key)
    for key in atendimento_ambito_keys(row_count):
        data[key] = "1" if field_value(post_data, key) == "on" else ""
    for key in atendimento_row_fields(row_count):
        data[key] = field_value(post_data, key)
    return data


def serialize_atendimentos(post_data):
    return json.dumps(atendimentos_from_post(post_data), ensure_ascii=False)


SHARED_FIELD_ALIASES = {
    "nome": ["ref_nome", "em_nome", "ins_nome", "diag_nome", "diag_agregado_a_nome", "atend_nome"],
    "data_documento": ["data_rececao", "ins_data", "diag_data_avaliacao"],
    "data_nascimento": ["data_nascimento", "em_data_nascimento", "ins_data_nascimento", "diag_agregado_a_data_nascimento"],
    "idade": ["idade", "em_idade", "diag_agregado_a_idade"],
    "contacto_telefonico": ["contacto_telefonico", "ins_contactos"],
    "numero_processo": ["em_processo_numero", "ins_processo_numero", "diag_processo_numero", "atend_processo_numero"],
    "morada": ["morada", "ins_morada"],
    "codigo_postal": ["codigo_postal", "ins_codigo_postal"],
    "nif": ["nif", "ins_nif"],
    "numero_sns": ["em_numero_sns", "ins_numero_sns"],
}


BIRTHDATE_AGE_FIELD_PAIRS = [
    ("data_nascimento", "idade"),
    ("em_data_nascimento", "em_idade"),
    *[
        (f"diag_agregado_{row}_data_nascimento", f"diag_agregado_{row}_idade")
        for row in DIAGNOSTICA_AGREGADO_ROWS
    ],
]


def calculate_age_from_birthdate(value, reference_date=None):
    text = str(value or "").strip()
    if not text:
        return ""
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", text) or re.fullmatch(r"(\d{2})/(\d{2})/(\d{4})", text)
    if not match:
        return ""
    if len(match.group(1)) == 4:
        year, month, day = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
    else:
        day, month, year = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
    try:
        birth_date = datetime(year, month, day).date()
    except ValueError:
        return ""
    reference_date = reference_date or datetime.now().date()
    if birth_date > reference_date:
        return ""
    age = reference_date.year - birth_date.year
    if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day):
        age -= 1
    return str(max(age, 0))


def apply_calculated_ages(*data_sets):
    for data in data_sets:
        for birth_key, age_key in BIRTHDATE_AGE_FIELD_PAIRS:
            if birth_key not in data or age_key not in data:
                continue
            birth_value = str(data.get(birth_key) or "").strip()
            if birth_value:
                data[age_key] = calculate_age_from_birthdate(birth_value)


def first_post_value(post_data, keys):
    for key in keys:
        value = field_value(post_data, key)
        if value:
            return value
    return ""


def first_post_entry(post_data, keys, fallback=""):
    for key in keys:
        if key in post_data:
            return field_value(post_data, key)
    return fallback


def first_data_value(data_sets, keys):
    for data in data_sets:
        for key in keys:
            value = str(data.get(key) or "").strip()
            if value:
                return value
    return ""


def sync_shared_fields(*data_sets):
    for keys in SHARED_FIELD_ALIASES.values():
        value = first_data_value(data_sets, keys)
        if value:
            for data in data_sets:
                for key in keys:
                    if key in data:
                        data[key] = value
    ref_data = next((data for data in data_sets if "problema_urinarios" in data), None)
    em_data = next((data for data in data_sets if "em_problema_urinarios" in data), None)
    if ref_data and em_data:
        for em_key, ref_key in EMERGENCIA_HEALTH_PROBLEM_MAP.items():
            checked = "1" if ref_data.get(ref_key) or em_data.get(em_key) else ""
            ref_data[ref_key] = checked
            em_data[em_key] = checked
        other_text = str(ref_data.get("problema_outros_texto") or em_data.get("em_problema_outros_texto") or "").strip()
        ref_data["problema_outros_texto"] = other_text
        em_data["em_problema_outros_texto"] = other_text
    apply_calculated_ages(*data_sets)


def apply_utente_core_values(utente_id, *data_sets):
    if supabase_available():
        utente = get_utente(utente_id)
    else:
        with get_connection() as conn:
            utente = conn.execute(
                """
                SELECT nome, data_nascimento, telefone, numero_utente
                FROM utentes
                WHERE id = ?
                """,
                (utente_id,),
            ).fetchone()
    if not utente:
        return
    core_values = {
        "ref_nome": utente["nome"],
        "em_nome": utente["nome"],
        "ins_nome": utente["nome"],
        "diag_nome": utente["nome"],
        "diag_agregado_a_nome": utente["nome"],
        "atend_nome": utente["nome"],
        "data_nascimento": utente["data_nascimento"],
        "em_data_nascimento": utente["data_nascimento"],
        "ins_data_nascimento": utente["data_nascimento"],
        "diag_agregado_a_data_nascimento": utente["data_nascimento"],
        "contacto_telefonico": utente["telefone"],
        "ins_contactos": utente["telefone"],
        "em_processo_numero": utente["numero_utente"],
        "ins_processo_numero": utente["numero_utente"],
        "diag_processo_numero": utente["numero_utente"],
        "atend_processo_numero": utente["numero_utente"],
    }
    for data in data_sets:
        for key, value in core_values.items():
            if key in data and not data.get(key) and value:
                data[key] = str(value)


def load_structured_tab_data(utente_id):
    ref_data = load_referenciacao_data(utente_id)
    em_data = load_emergencia_data(utente_id)
    ins_data = load_inscricao_data(utente_id)
    diag_data = load_diagnostica_data(utente_id)
    atend_data = load_atendimentos_data(utente_id)
    apply_utente_core_values(utente_id, ref_data, em_data, ins_data, diag_data, atend_data)
    sync_shared_fields(ref_data, em_data, ins_data, diag_data, atend_data)
    return ref_data, em_data, ins_data, diag_data, atend_data


def update_utente_core_from_shared(utente_id, post_data):
    if supabase_available():
        current = get_utente(utente_id)
        if not current:
            raise ValueError("Utente não encontrado.")
        nome = first_post_entry(post_data, SHARED_FIELD_ALIASES["nome"], current["nome"]) or current["nome"]
        data_nascimento = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["data_nascimento"],
            current.get("data_nascimento") or "",
        )
        telefone = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["contacto_telefonico"],
            current.get("telefone") or "",
        )
        numero_processo = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["numero_processo"],
            current.get("numero_utente") or "",
        )
        if not nome:
            raise ValueError("O nome completo é obrigatório.")
        table_update(
            "utentes",
            {"id": f"eq.{utente_id}"},
            {
                "nome": nome,
                "data_nascimento": data_nascimento,
                "telefone": telefone,
                "numero_utente": numero_processo,
                "updated_at": now(),
            },
        )
        return
    with get_connection() as conn:
        current = conn.execute(
            """
            SELECT nome, data_nascimento, telefone, numero_utente
            FROM utentes
            WHERE id = ?
            """,
            (utente_id,),
        ).fetchone()
        if not current:
            raise ValueError("Utente não encontrado.")
        nome = first_post_entry(post_data, SHARED_FIELD_ALIASES["nome"], current["nome"]) or current["nome"]
        data_nascimento = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["data_nascimento"],
            current["data_nascimento"] or "",
        )
        telefone = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["contacto_telefonico"],
            current["telefone"] or "",
        )
        numero_processo = first_post_entry(
            post_data,
            SHARED_FIELD_ALIASES["numero_processo"],
            current["numero_utente"] or "",
        )
        if not nome:
            raise ValueError("O nome completo é obrigatório.")
        conn.execute(
            """
            UPDATE utentes
            SET nome = ?,
                data_nascimento = ?,
                telefone = ?,
                numero_utente = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (nome, data_nascimento, telefone, numero_processo, now(), utente_id),
        )


def sync_shared_fields_from_active(active_data, ref_data, em_data, ins_data, diag_data, atend_data):
    for key, value in active_data.items():
        if key in ref_data and key in em_data and key in ins_data and key in diag_data and key in atend_data:
            shared_value = str(value or "")
            ref_data[key] = shared_value
            em_data[key] = shared_value
            ins_data[key] = shared_value
            diag_data[key] = shared_value
            atend_data[key] = shared_value
            active_data[key] = shared_value

    for keys in SHARED_FIELD_ALIASES.values():
        source_key = next((key for key in keys if key in active_data), None)
        if source_key is None:
            continue
        value = str(active_data.get(source_key) or "")
        for data in (active_data, ref_data, em_data, ins_data, diag_data, atend_data):
            for key in keys:
                if key in data:
                    data[key] = value

    has_ref_health = any(ref_key in active_data for ref_key in EMERGENCIA_HEALTH_PROBLEM_MAP.values())
    has_em_health = any(em_key in active_data for em_key in EMERGENCIA_HEALTH_PROBLEM_MAP)
    if has_ref_health or has_em_health:
        for em_key, ref_key in EMERGENCIA_HEALTH_PROBLEM_MAP.items():
            checked = active_data.get(ref_key) if has_ref_health else active_data.get(em_key)
            checked = "1" if checked else ""
            ref_data[ref_key] = checked
            em_data[em_key] = checked
            if ref_key in active_data:
                active_data[ref_key] = checked
            if em_key in active_data:
                active_data[em_key] = checked

    if "problema_outros_texto" in active_data:
        other_text = str(active_data.get("problema_outros_texto") or "")
    elif "em_problema_outros_texto" in active_data:
        other_text = str(active_data.get("em_problema_outros_texto") or "")
    else:
        other_text = None
    if other_text is not None:
        ref_data["problema_outros_texto"] = other_text
        em_data["em_problema_outros_texto"] = other_text
    apply_calculated_ages(active_data, ref_data, em_data, ins_data, diag_data, atend_data)


def sync_saved_shared_tabs(utente_id, active_tab, active_data):
    ref_data, em_data, ins_data, diag_data, atend_data = load_structured_tab_data(utente_id)
    if active_tab == "referenciacao":
        ref_data.update(active_data)
    elif active_tab == "emergencia":
        em_data.update(active_data)
    elif active_tab == "inscricao":
        ins_data.update(active_data)
    elif active_tab == "diagnostica":
        diag_data.update(active_data)
    elif active_tab == "atendimentos":
        atend_data.update(active_data)
    sync_shared_fields_from_active(active_data, ref_data, em_data, ins_data, diag_data, atend_data)
    save_tab_content(utente_id, "referenciacao", json.dumps(ref_data, ensure_ascii=False))
    save_tab_content(utente_id, "emergencia", json.dumps(em_data, ensure_ascii=False))
    save_tab_content(utente_id, "inscricao", json.dumps(ins_data, ensure_ascii=False))
    save_tab_content(utente_id, "diagnostica", json.dumps(diag_data, ensure_ascii=False))
    save_tab_content(utente_id, "atendimentos", json.dumps(atend_data, ensure_ascii=False))


def render_text_input(data, key, label, span="span-4", input_type="text", readonly=False):
    disabled = "disabled" if readonly else ""
    return f"""
    <div class="field {span}">
        <label for="{key}">{esc(label)}</label>
        <input id="{key}" name="{key}" type="{input_type}" value="{esc(data.get(key))}" {disabled}>
    </div>
    """


def render_decimal_input(data, key, label, span="span-4", readonly=False):
    disabled = "disabled" if readonly else ""
    return f"""
    <div class="field {span}">
        <label for="{key}">{esc(label)}</label>
        <input id="{key}" name="{key}" type="text" inputmode="decimal" value="{esc(data.get(key))}" {disabled}>
    </div>
    """


def render_textarea_input(data, key, label, span="span-12", readonly=False):
    disabled = "disabled" if readonly else ""
    return f"""
    <div class="field {span}">
        <label for="{key}">{esc(label)}</label>
        <textarea id="{key}" name="{key}" {disabled}>{esc(data.get(key))}</textarea>
    </div>
    """


def render_choice_group(data, key, label, options, span="span-4", readonly=False):
    disabled = "disabled" if readonly else ""
    value = data.get(key) or ""
    options_html = ""
    for option_value, option_label in options:
        checked = "checked" if value == option_value else ""
        options_html += f"""
        <label class="choice-option">
            <input type="radio" name="{key}" value="{esc(option_value)}" {checked} {disabled}>
            {esc(option_label)}
        </label>
        """
    return f"""
    <div class="field {span}">
        <label>{esc(label)}</label>
        <div class="choice-group">
            {options_html}
        </div>
    </div>
    """


def render_select_input(data, key, label, options, span="span-4", readonly=False):
    disabled = "disabled" if readonly else ""
    value = data.get(key) or ""
    options_html = ""
    for option_value, option_label in options:
        selected = "selected" if value == option_value else ""
        options_html += f'<option value="{esc(option_value)}" {selected}>{esc(option_label)}</option>'
    return f"""
    <div class="field {span}">
        <label for="{key}">{esc(label)}</label>
        <select id="{key}" name="{key}" {disabled}>
            {options_html}
        </select>
    </div>
    """


def render_month_select(data, key, label, span="span-4", readonly=False):
    disabled = "disabled" if readonly else ""
    value = normalize_month_value(data.get(key))
    options_html = ""
    for option_value, option_label in month_options(value):
        selected = "selected" if value == option_value else ""
        options_html += f'<option value="{esc(option_value)}" {selected}>{esc(option_label)}</option>'
    return f"""
    <div class="field {span}">
        <label for="{key}">{esc(label)}</label>
        <select id="{key}" name="{key}" {disabled}>
            {options_html}
        </select>
    </div>
    """


def render_pagamentos_history(history, readonly=False, current_user=None):
    history = normalize_pagamento_history(history)
    actions_header = "" if readonly else f"<th>{esc(tr(current_user, 'actions'))}</th>"
    actions_colspan = 7 if readonly else 8
    if not history:
        rows = f"""
        <tr>
            <td colspan="{actions_colspan}">
                <div class="empty compact-empty">Sem pagamentos registados.</div>
            </td>
        </tr>
        """
    else:
        rows = ""
        for item in history:
            cancel_action = ""
            if not readonly:
                payment_id = esc(item.get("id"))
                cancel_label = esc(tr(current_user, "cancel_payment"))
                cancel_confirm = esc(tr(current_user, "cancel_payment_confirm"))
                cancel_action = f"""
                <td class="actions-cell">
                    <button class="button danger icon-button" type="submit" name="pag_action" value="cancel:{payment_id}" onclick="return confirm('{cancel_confirm}');" aria-label="{cancel_label}" title="{cancel_label}">
                        {TRASH_ICON}
                    </button>
                </td>
                """
            rows += f"""
            <tr>
                <td>{esc(month_label(item.get("mensalidade")))}</td>
                <td>{esc(payment_status_label(item.get("estado")))}</td>
                <td>{esc(item.get("data"))}</td>
                <td>{esc(payment_method_label(item.get("forma")))}</td>
                <td>{esc(item.get("valor"))}</td>
                <td>{esc(item.get("referencia"))}</td>
                <td>{esc(item.get("observacoes"))}</td>
                {cancel_action}
            </tr>
            """
    return f"""
    <section class="form-section payment-history-section">
        <h4 class="section-title">Histórico de pagamentos</h4>
        <div class="payment-history-wrap">
            <table class="sheet-table payment-history-table">
                <thead>
                    <tr>
                        <th>Mensalidade / quota</th>
                        <th>Estado</th>
                        <th>Data</th>
                        <th>Método</th>
                        <th>Valor</th>
                        <th>Recibo / referência</th>
                        <th>Observações</th>
                        {actions_header}
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    </section>
    """


def render_quick_payment_dialog(current_user=None):
    language = user_language(current_user)
    if language == "en":
        title = "Pay monthly fee"
        subtitle = "Confirm the monthly fee, payment date and method."
        client_label = "Client"
        month_label_text = "Monthly fee"
        date_label = "Payment day"
        method_label = "Payment method"
        cancel_label = "Cancel"
        submit_label = "Register payment"
        close_label = "Close"
    else:
        title = "Pagar mensalidade"
        subtitle = "Confirme a mensalidade, o dia e a forma de pagamento."
        client_label = "Utente"
        month_label_text = "Mensalidade"
        date_label = "Dia do pagamento"
        method_label = "Forma de pagamento"
        cancel_label = "Cancelar"
        submit_label = "Registar pagamento"
        close_label = "Fechar"
    options_html = ""
    for option_value, option_label in PAGAMENTO_FORMAS:
        options_html += f'<option value="{esc(option_value)}">{esc(option_label)}</option>'
    today = datetime.now().date().isoformat()
    return f"""
    <dialog class="manual-dialog quick-payment-dialog" id="quickPaymentDialog">
        <section class="manual-dialog-panel" aria-label="{esc(title)}">
            <div class="manual-dialog-head">
                <div>
                    <h2>{esc(title)}</h2>
                    <p>{esc(subtitle)}</p>
                </div>
                <button class="central-icon-link" type="button" data-quick-payment-close title="{esc(close_label)}" aria-label="{esc(close_label)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    <span>{esc(close_label)}</span>
                </button>
            </div>
            <form class="quick-payment-form" method="post" action="/pagamentos/rapido">
                <input type="hidden" id="quickPaymentId" name="id" value="">
                <div class="quick-payment-summary">
                    <span>{esc(client_label)}: <strong id="quickPaymentName"></strong></span>
                    <span>{esc(month_label_text)}: <strong id="quickPaymentMonth"></strong></span>
                </div>
                <div class="field">
                    <label for="quickPaymentDate">{esc(date_label)}</label>
                    <input id="quickPaymentDate" type="date" name="pag_data" value="{esc(today)}" required>
                </div>
                <div class="field">
                    <label for="quickPaymentMethod">{esc(method_label)}</label>
                    <select id="quickPaymentMethod" name="pag_forma" required>
                        {options_html}
                    </select>
                </div>
                <div class="quick-payment-actions">
                    <button class="button secondary" type="button" data-quick-payment-close>{esc(cancel_label)}</button>
                    <button class="button" type="submit">{esc(submit_label)}</button>
                </div>
            </form>
        </section>
    </dialog>
    """


def render_checkbox_groups(data, readonly=False):
    groups_html = ""
    disabled = "disabled" if readonly else ""
    other_fields = {
        "tratamento_outro_check": ("tratamento_outro", "Qual?"),
        "problema_outros": ("problema_outros_texto", "Quais?"),
        "risco_outro": ("risco_outro_texto", "Qual?"),
        "motivo_outro": ("motivo_outro_texto", "Outro motivo"),
    }
    for title, options, layout in REFERENCIACAO_CHECKBOX_GROUPS:
        class_name = "inline-checks" if layout == "inline" else "checkbox-grid"
        options_html = ""
        extra = ""
        for key, label in options:
            checked = "checked" if data.get(key) else ""
            options_html += f"""
            <label class="check-option">
                <input type="checkbox" name="{key}" {checked} {disabled}>
                {esc(label)}
            </label>
            """
            if key in other_fields:
                text_key, text_label = other_fields[key]
                extra += render_text_input(data, text_key, text_label, "span-4", readonly=readonly)
        if title == "Tratamento em":
            extra += render_textarea_input(data, "resumo_situacao", "Resumo da Situação Clínica Atual", readonly=readonly)
        groups_html += f"""
        <section class="form-section readonly-section">
            <h4 class="section-title">{esc(title)}</h4>
            <div class="{class_name}">
                {options_html}
            </div>
            {"<div class='form-grid'>" + extra + "</div>" if extra else ""}
        </section>
        """
    return groups_html


def render_medication_table(data, readonly=False):
    disabled = "disabled" if readonly else ""
    header = "".join(f"<th>{esc(label)}</th>" for _key, label in MEDICATION_COLUMNS)
    rows = ""
    for row in range(MEDICATION_ROWS):
        cells = ""
        for key, _label in MEDICATION_COLUMNS:
            field = f"med_{row}_{key}"
            class_name = "medicine-name" if key == "medicamento" else "medicine-notes" if key == "observacoes" else ""
            cells += f'<td><input class="{class_name}" name="{field}" value="{esc(data.get(field))}" {disabled}></td>'
        rows += f"<tr>{cells}</tr>"
    return f"""
    <section class="form-section readonly-section">
        <h4 class="section-title">Medicação</h4>
        <div class="medication-wrap">
            <table class="medication-table">
                <thead><tr>{header}</tr></thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    </section>
    """


def render_referenciacao_form(data, utente_id=None, readonly=False, include_attachments=True):
    readonly_class = " readonly-section" if readonly else ""
    return f"""
    <div class="referenciacao-form{readonly_class}">
        <section class="form-section">
            <h4 class="section-title">Formulário de Referenciação - Unidade Sócio-Ocupacional</h4>
            <div class="form-grid">
                {render_text_input(data, "data_rececao", "Data de Receção do documento", "span-4", "date", readonly)}
                {render_text_input(data, "processo_numero", "Processo n.º", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1. Dados de Identificação e Contactos</h4>
            <div class="form-grid">
                {render_text_input(data, "ref_nome", "Nome", "span-12", readonly=readonly)}
                {render_text_input(data, "data_nascimento", "Data de Nascimento", "span-3", "date", readonly)}
                {render_text_input(data, "idade", "Idade", "span-2", readonly=readonly)}
                {render_text_input(data, "numero_processo", "N.º Processo", "span-3", readonly=readonly)}
                {render_text_input(data, "morada", "Morada", "span-8", readonly=readonly)}
                {render_text_input(data, "codigo_postal", "Código Postal", "span-4", readonly=readonly)}
                {render_text_input(data, "freguesia", "Freguesia", "span-6", readonly=readonly)}
                {render_text_input(data, "concelho", "Concelho", "span-6", readonly=readonly)}
                {render_text_input(data, "contacto_telefonico", "Contacto Telefónico", "span-4", readonly=readonly)}
                {render_text_input(data, "nif", "NIF", "span-4", readonly=readonly)}
                {render_text_input(data, "familiar_referencia", "Familiar de Referência", "span-5", readonly=readonly)}
                {render_text_input(data, "parentesco", "Parentesco", "span-3", readonly=readonly)}
                {render_text_input(data, "contacto_familiar", "Contacto", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">2. Identificação da Entidade e Técnico(a) de Encaminhamento</h4>
            <div class="form-grid">
                {render_text_input(data, "tecnico_nome", "Nome do(a) Técnico(a)", "span-6", readonly=readonly)}
                {render_text_input(data, "relacao_candidato", "Relação com o(a) Candidato(a)", "span-6", readonly=readonly)}
                {render_text_input(data, "entidade", "Entidade", "span-12", readonly=readonly)}
                {render_text_input(data, "entidade_contacto", "Contacto Telefónico", "span-6", readonly=readonly)}
                {render_text_input(data, "entidade_email", "Email", "span-6", "email", readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">3. Informação Clínica</h4>
            <div class="form-grid">
                {render_textarea_input(data, "diagnostico_atual", "Diagnóstico Atual", readonly=readonly)}
                {render_textarea_input(data, "antecedentes_clinicos", "Antecedentes clínicos", readonly=readonly)}
                {render_text_input(data, "data_primeiro_internamento", "Data 1.º Internamento", "span-4", "date", readonly)}
                {render_text_input(data, "data_ultimo_internamento", "Data do Último Internamento", "span-4", "date", readonly)}
                {render_text_input(data, "numero_internamentos", "N.º Internamentos até à data", "span-4", readonly=readonly)}
            </div>
        </section>

        {render_checkbox_groups(data, readonly)}

        {render_medication_table(data, readonly)}
        {render_pdf_attachments_panel(
            utente_id,
            readonly=readonly,
            active_tab="referenciacao",
            upload_title="Anexar folha de referenciação",
            list_title="Folhas anexadas",
            wrapper_class="referenciacao-attachments",
        ) if utente_id and include_attachments else ""}
    </div>
    """


def render_pagamentos_form(data, readonly=False, current_user=None):
    readonly_class = " readonly-section" if readonly else ""
    register_button = "" if readonly else """
                <div class="field span-12 payment-form-actions">
                    <button class="button" type="submit" name="pag_action" value="add">Registar pagamento</button>
                </div>
    """
    return f"""
    <div class="pagamentos-form{readonly_class}">
        <section class="form-section">
            <h4 class="section-title">Registo de Pagamentos e Mensalidades</h4>
            <div class="form-grid">
                {render_choice_group(data, "pag_estado", "Estado do pagamento", PAGAMENTO_ESTADOS, "span-12", readonly)}
                {render_month_select(data, "pag_mensalidade_ate", "Nova mensalidade", "span-4", readonly)}
                {render_text_input(data, "pag_data", "Dia do pagamento", "span-4", "date", readonly)}
                {render_select_input(data, "pag_forma", "Forma de pagamento", PAGAMENTO_FORMAS, "span-4", readonly)}
                {render_decimal_input(data, "pag_valor", "Valor pago (€)", "span-4", readonly)}
                {render_text_input(data, "pag_referencia", "N.º recibo / referência", "span-8", readonly=readonly)}
                {render_textarea_input(data, "pag_observacoes", "Observações de pagamento", "span-12", readonly=readonly)}
                {register_button}
            </div>
        </section>
        {render_pagamentos_history(data.get("pag_historico"), readonly=readonly, current_user=current_user)}
    </div>
    """


def render_emergencia_form(data, readonly=False):
    disabled = "disabled" if readonly else ""
    health_options = [
        ("em_problema_urinarios", "Urinários"),
        ("em_problema_reumaticos", "Reumáticos"),
        ("em_problema_cardiacos", "Cardíacos"),
        ("em_problema_hipertensao", "Hipertensão"),
        ("em_problema_hiv_sida", "HIV/SIDA"),
        ("em_problema_infetocontagiosas", "Doenças infetocontagiosas"),
        ("em_problema_cancerigenas", "Doenças cancerígenas"),
        ("em_problema_sistema_nervoso", "Sistema nervoso"),
        ("em_problema_visao", "Visão"),
        ("em_problema_diabetes", "Diabetes"),
        ("em_problema_alergias", "Alergias"),
        ("em_problema_intestinais", "Intestinais"),
        ("em_problema_respiratorios", "Respiratórios"),
        ("em_problema_auditivos", "Auditivos"),
        ("em_problema_outros", "Outros"),
    ]
    health_html = ""
    for key, label in health_options:
        checked = "checked" if data.get(key) else ""
        health_html += f"""
        <label class="check-option">
            <input type="checkbox" name="{key}" {checked} {disabled}>
            {esc(label)}
        </label>
        """
    return f"""
    <div class="emergencia-form{' readonly-section' if readonly else ''}">
        <section class="form-section">
            <h4 class="section-title">Informações em Caso de Emergência</h4>
            <div class="form-grid">
                {render_text_input(data, "em_processo_numero", "Processo n.º", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Identificação</h4>
            <div class="form-grid">
                {render_text_input(data, "em_nome", "Nome", "span-8", readonly=readonly)}
                {render_text_input(data, "em_data_nascimento", "Data de Nascimento", "span-3", "date", readonly)}
                {render_text_input(data, "em_idade", "Idade", "span-2", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Em caso de urgência contactar</h4>
            <div class="form-grid">
                {render_text_input(data, "em_contacto_urgencia_nome", "Nome", "span-6", readonly=readonly)}
                {render_text_input(data, "em_contacto_urgencia_contactos", "Contacto(s)", "span-6", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Dados de saúde</h4>
            <div class="form-grid">
                {render_text_input(data, "em_grupo_sanguineo", "Grupo sanguíneo", "span-3", readonly=readonly)}
                {render_text_input(data, "em_numero_sns", "N.º SNS", "span-3", readonly=readonly)}
                {render_text_input(data, "em_medico_familia", "Nome do médico de família", "span-6", readonly=readonly)}
                {render_text_input(data, "em_medico_familia_telefone", "Telefone", "span-3", readonly=readonly)}
                {render_text_input(data, "em_centro_saude", "Centro de Saúde", "span-6", readonly=readonly)}
                {render_text_input(data, "em_medico_psiquiatra", "Médico Psiquiatra", "span-6", readonly=readonly)}
                {render_text_input(data, "em_entidade", "Entidade", "span-6", readonly=readonly)}
                {render_text_input(data, "em_entidade_contacto", "Contacto", "span-6", readonly=readonly)}
                {render_textarea_input(data, "em_diagnostico_atual", "Diagnóstico Atual", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Alergias e observações</h4>
            <div class="form-grid">
                {render_textarea_input(data, "em_alergias", "Alergias", "span-6", readonly=readonly)}
                {render_textarea_input(data, "em_observacoes", "Observações", "span-6", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Problemas de Saúde</h4>
            <div class="checkbox-grid">
                {health_html}
            </div>
            <div class="form-grid">
                {render_text_input(data, "em_problema_outros_texto", "Quais?", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">Informação Geral Relevante</h4>
            <div class="form-grid">
                {render_textarea_input(data, "em_informacao_geral", "Informação", readonly=readonly)}
            </div>
        </section>
    </div>
    """


def render_inscricao_checkbox_options(data, options, readonly=False):
    disabled = "disabled" if readonly else ""
    html_parts = []
    for key, label in options:
        checked = "checked" if data.get(key) else ""
        html_parts.append(
            f"""
            <label class="check-option">
                <input type="checkbox" name="{key}" {checked} {disabled}>
                {esc(label)}
            </label>
            """
        )
    return "".join(html_parts)


def render_sheet_radio(data, key, value, readonly=False):
    disabled = "disabled" if readonly else ""
    checked = "checked" if data.get(key) == value else ""
    label = "Sim" if value == "sim" else "Não"
    return f"""
    <label class="sheet-radio" aria-label="{label}">
        <input type="radio" name="{key}" value="{value}" {checked} {disabled}>
    </label>
    """


def render_inscricao_ponderacao_table(data, readonly=False):
    disabled = "disabled" if readonly else ""
    rows = ""
    for key, label, weight in INSCRICAO_PONDERACAO_ROWS:
        score_key = f"ins_ponder_{key}_pontuacao"
        value_key = f"ins_ponder_{key}_valor"
        rows += f"""
        <tr>
            <td class="criteria-cell">{esc(label)}</td>
            <td>{esc(weight)}</td>
            <td><input name="{score_key}" type="number" min="0" max="10" step="0.1" value="{esc(data.get(score_key))}" {disabled}></td>
            <td><input name="{value_key}" value="{esc(data.get(value_key))}" {disabled}></td>
        </tr>
        """
    return f"""
    <div class="sheet-subtitle">4.4 Tabela de ponderação</div>
    <div class="medication-wrap">
        <table class="sheet-table scoring-table">
            <thead>
                <tr>
                    <th>Critério</th>
                    <th>Ponderação</th>
                    <th>Pontuação 0-10</th>
                    <th>Valor *</th>
                </tr>
            </thead>
            <tbody>
                {rows}
                <tr>
                    <td><strong>* Ponderação x Pontuação</strong></td>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td><input name="ins_ponder_total" value="{esc(data.get('ins_ponder_total'))}" {disabled}></td>
                </tr>
            </tbody>
        </table>
    </div>
    """


def render_inscricao_ponto4(data, readonly=False):
    disabled = "disabled" if readonly else ""
    return f"""
    <section class="form-section readonly-section">
        <h4 class="section-title">4. Admissibilidade e Ponderação</h4>

        <div class="sheet-subtitle">4.1 Apresenta algum critério de Não Admissibilidade?</div>
        <div class="medication-wrap">
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th class="question-cell">Critérios de Não Admissibilidade</th>
                        <th>Sim</th>
                        <th>Não</th>
                        <th class="observations-cell">Observações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="question-cell">
                            <div class="sheet-checks">
                                {render_inscricao_checkbox_options(data, INSCRICAO_ADMISSIBILIDADE, readonly)}
                            </div>
                            <div class="sheet-other-field">
                                <label for="ins_admissibilidade_outro_texto">Outro:</label>
                                <input id="ins_admissibilidade_outro_texto" name="ins_admissibilidade_outro_texto" value="{esc(data.get('ins_admissibilidade_outro_texto'))}" {disabled}>
                            </div>
                        </td>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_admissibilidade_resposta", "sim", readonly)}</td>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_admissibilidade_resposta", "nao", readonly)}</td>
                        <td class="observations-cell">
                            <textarea name="ins_admissibilidade_observacoes" {disabled}>{esc(data.get('ins_admissibilidade_observacoes'))}</textarea>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="sheet-subtitle">4.2 Tem Transporte? (assinale com uma X)</div>
        <div class="medication-wrap">
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th>Sim</th>
                        <th>Não</th>
                        <th class="observations-cell">Observações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_transporte_resposta", "sim", readonly)}</td>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_transporte_resposta", "nao", readonly)}</td>
                        <td class="observations-cell">
                            <textarea name="ins_transporte_observacoes" {disabled}>{esc(data.get('ins_transporte_observacoes'))}</textarea>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="sheet-subtitle">4.3 A Resposta Social ajusta-se ao pedido do Utente? (assinale com uma X)</div>
        <div class="medication-wrap">
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th>Sim</th>
                        <th>Não</th>
                        <th class="observations-cell">Se não, porquê?</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_resposta_social_resposta", "sim", readonly)}</td>
                        <td class="radio-cell">{render_sheet_radio(data, "ins_resposta_social_resposta", "nao", readonly)}</td>
                        <td class="observations-cell">
                            <textarea name="ins_resposta_social_motivo" {disabled}>{esc(data.get('ins_resposta_social_motivo'))}</textarea>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        {render_inscricao_ponderacao_table(data, readonly)}
    </section>
    """


def render_inscricao_form(data, readonly=False):
    readonly_class = " readonly-section" if readonly else ""
    return f"""
    <div class="inscricao-form{readonly_class}">
        <section class="form-section">
            <h4 class="section-title">Ficha de Inscrição e Avaliação Inicial de Requisitos</h4>
            <div class="form-grid">
                {render_text_input(data, "ins_data", "Data", "span-4", "date", readonly)}
                {render_text_input(data, "ins_processo_numero", "Processo n.º", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1. Dados de Identificação do Utente</h4>
            <div class="form-grid">
                {render_text_input(data, "ins_nome", "Nome", "span-12", readonly=readonly)}
                {render_text_input(data, "ins_nome_tratado", "Nome a ser tratado", "span-6", readonly=readonly)}
                {render_text_input(data, "ins_contactos", "Contacto(s)", "span-6", readonly=readonly)}
                {render_text_input(data, "ins_morada", "Morada", "span-8", readonly=readonly)}
                {render_text_input(data, "ins_codigo_postal", "Código Postal", "span-4", readonly=readonly)}
                {render_text_input(data, "ins_data_nascimento", "Data de Nascimento", "span-3", "date", readonly)}
                {render_text_input(data, "ins_naturalidade", "Naturalidade", "span-5", readonly=readonly)}
                {render_text_input(data, "ins_cartao_cidadao", "Cartão de Cidadão", "span-4", readonly=readonly)}
                {render_text_input(data, "ins_nif", "NIF", "span-4", readonly=readonly)}
                {render_text_input(data, "ins_numero_sns", "N.º SNS", "span-4", readonly=readonly)}
                {render_text_input(data, "ins_niss", "NISS", "span-4", readonly=readonly)}
                {render_text_input(data, "ins_pessoa_referencia", "Nome e contacto de pessoa de referência", "span-12", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">2. Formulação e Identificação do Pedido</h4>
            <div class="form-grid">
                {render_textarea_input(data, "ins_pedido_descricao", "Descrição do motivo e expectativas acerca da Unidade Sócio Ocupacional", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">3. Sinalização Global dos Serviços de Preferência</h4>
            <div class="checkbox-grid">
                {render_inscricao_checkbox_options(data, INSCRICAO_SERVICOS, readonly)}
            </div>
            <div class="form-grid">
                {render_text_input(data, "ins_servico_outro_texto", "Outro serviço", "span-6", readonly=readonly)}
            </div>
        </section>

        {render_inscricao_ponto4(data, readonly)}
    </div>
    """


def render_diagnostica_checkbox_options(data, options, readonly=False):
    disabled = "disabled" if readonly else ""
    html_parts = []
    for key, label in options:
        checked = "checked" if data.get(key) else ""
        html_parts.append(
            f"""
            <label class="check-option">
                <input type="checkbox" name="{key}" {checked} {disabled}>
                {esc(label)}
            </label>
            """
        )
    return "".join(html_parts)


def render_diagnostica_agregado_table(data, readonly=False):
    disabled = "disabled" if readonly else ""
    header = "".join(f"<th>{esc(label)}</th>" for _key, label in DIAGNOSTICA_AGREGADO_COLUMNS)
    rows = ""
    for row in DIAGNOSTICA_AGREGADO_ROWS:
        ref = row.upper()
        cells = ""
        for key, _label in DIAGNOSTICA_AGREGADO_COLUMNS:
            field = f"diag_agregado_{row}_{key}"
            cells += f'<td><input name="{field}" value="{esc(data.get(field))}" {disabled}></td>'
        rows += f"<tr><td><strong>{ref}</strong></td>{cells}</tr>"
    return f"""
    <section class="form-section readonly-section">
        <h4 class="section-title">2.2 Agregado Familiar</h4>
        <div class="medication-wrap">
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th>Ref.</th>
                        {header}
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    </section>
    """


def render_diagnostica_avdi_table(data, readonly=False):
    disabled = "disabled" if readonly else ""
    levels = [
        ("independente", "Independente"),
        ("ajuda_parcial", "Com Ajuda Parcial"),
        ("dependente", "Dependente"),
    ]
    rows = ""
    for key, label in DIAGNOSTICA_AVDI_ROWS:
        level_key = f"diag_avdi_{key}_nivel"
        obs_key = f"diag_avdi_{key}_observacoes"
        level_cells = ""
        for value, option_label in levels:
            checked = "checked" if data.get(level_key) == value else ""
            level_cells += f"""
            <td class="radio-cell">
                <label class="sheet-radio" aria-label="{esc(option_label)}">
                    <input type="radio" name="{level_key}" value="{value}" {checked} {disabled}>
                </label>
            </td>
            """
        rows += f"""
        <tr>
            <td class="question-cell">{esc(label)}</td>
            {level_cells}
            <td class="observations-cell"><input name="{obs_key}" value="{esc(data.get(obs_key))}" {disabled}></td>
        </tr>
        """
    return f"""
    <section class="form-section readonly-section">
        <h4 class="section-title">4.6 Atividades de Vida Diária Instrumentais - Perspetiva do Utente</h4>
        <div class="medication-wrap">
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th>AVDI's</th>
                        <th>Independente</th>
                        <th>Com Ajuda Parcial</th>
                        <th>Dependente</th>
                        <th>Observações/Relevância</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    </section>
    """


def render_diagram_editor(data, key, title, kind, readonly=False):
    disabled = "disabled" if readonly else ""
    readonly_attr = "1" if readonly else "0"
    if kind == "genograma":
        toolbar = """
            <button class="button secondary" type="button" data-diagram-add="male">Homem</button>
            <button class="button secondary" type="button" data-diagram-add="female">Mulher</button>
            <button class="button secondary" type="button" data-diagram-add="unknown">Outro</button>
            <select data-diagram-relation>
                <option value="marriage">Casamento</option>
                <option value="union">União/Coabitação</option>
                <option value="parent_child">Filiação</option>
                <option value="separated">Separação</option>
                <option value="divorced">Divórcio</option>
                <option value="close">Relação próxima</option>
                <option value="conflict">Conflito</option>
                <option value="cutoff">Corte/distanciamento</option>
            </select>
        """
        legend = """
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><rect x="17" y="5" width="24" height="24" fill="#fff" stroke="#f3fbf8" stroke-width="2.4"/></svg></span><span class="legend-label">Homem</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><circle cx="29" cy="17" r="13" fill="#fff" stroke="#f3fbf8" stroke-width="2.4"/></svg></span><span class="legend-label">Mulher</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><polygon points="29,3 43,17 29,31 15,17" fill="#fff" stroke="#f3fbf8" stroke-width="2.4"/></svg></span><span class="legend-label">Outro</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><rect x="17" y="5" width="24" height="24" fill="#fff" stroke="#f3fbf8" stroke-width="2.4"/><line x1="15" y1="3" x2="43" y2="31" stroke="#ff6b5f" stroke-width="3"/><line x1="43" y1="3" x2="15" y2="31" stroke="#ff6b5f" stroke-width="3"/></svg></span><span class="legend-label">Falecido</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3"/></svg></span><span class="legend-label">Casamento</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3" stroke-dasharray="7 5"/></svg></span><span class="legend-label">União</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><path d="M10 8 H48 M29 8 V27 M20 27 H38" fill="none" stroke="#f3fbf8" stroke-width="2.6"/></svg></span><span class="legend-label">Filiação</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3"/><line x1="28" y1="6" x2="34" y2="28" stroke="#f3fbf8" stroke-width="3"/></svg></span><span class="legend-label">Separação</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3"/><line x1="24" y1="6" x2="30" y2="28" stroke="#f3fbf8" stroke-width="3"/><line x1="34" y1="6" x2="40" y2="28" stroke="#f3fbf8" stroke-width="3"/></svg></span><span class="legend-label">Divórcio</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><path d="M6 17 L12 9 L18 25 L24 9 L30 25 L36 9 L42 25 L52 17" fill="none" stroke="#ff6b5f" stroke-width="3"/></svg></span><span class="legend-label">Conflito</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#12b886" stroke-width="5"/></svg></span><span class="legend-label">Próxima</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3" stroke-dasharray="3 6"/></svg></span><span class="legend-label">Corte</span></li>
        """
    else:
        toolbar = """
            <button class="button secondary" type="button" data-diagram-add="central">Pessoa/Família</button>
            <button class="button secondary" type="button" data-diagram-add="system">Sistema/Rede</button>
            <select data-diagram-relation>
                <option value="strong">Ligação forte</option>
                <option value="weak">Ligação fraca/ténue</option>
                <option value="stress">Ligação stressante</option>
                <option value="resource_to">Fluxo para o utente</option>
                <option value="resource_from">Fluxo do utente</option>
                <option value="resource_both">Fluxo bidirecional</option>
            </select>
        """
        legend = """
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><circle cx="29" cy="17" r="15" fill="#dff8ee" stroke="#12b886" stroke-width="3"/></svg></span><span class="legend-label">Utente/família</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><rect x="8" y="7" width="42" height="20" rx="5" fill="#eef6ff" stroke="#8bb7ff" stroke-width="2.4"/></svg></span><span class="legend-label">Rede externa</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#12b886" stroke-width="5"/></svg></span><span class="legend-label">Forte</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><line x1="7" y1="17" x2="51" y2="17" stroke="#f3fbf8" stroke-width="3" stroke-dasharray="7 5"/></svg></span><span class="legend-label">Fraca</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><path d="M6 17 L12 9 L18 25 L24 9 L30 25 L36 9 L42 25 L52 17" fill="none" stroke="#ff6b5f" stroke-width="3"/></svg></span><span class="legend-label">Stress</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><defs><marker id="legend-arrow-in" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#12b886"/></marker></defs><line x1="7" y1="17" x2="51" y2="17" stroke="#12b886" stroke-width="3" marker-end="url(#legend-arrow-in)"/></svg></span><span class="legend-label">Para utente</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><defs><marker id="legend-arrow-out" markerWidth="8" markerHeight="8" refX="1" refY="3" orient="auto"><path d="M8,0 L8,6 L0,3 z" fill="#12b886"/></marker></defs><line x1="7" y1="17" x2="51" y2="17" stroke="#12b886" stroke-width="3" marker-start="url(#legend-arrow-out)"/></svg></span><span class="legend-label">Do utente</span></li>
            <li><span class="legend-symbol"><svg viewBox="0 0 58 34"><defs><marker id="legend-arrow-both-a" markerWidth="8" markerHeight="8" refX="1" refY="3" orient="auto"><path d="M8,0 L8,6 L0,3 z" fill="#12b886"/></marker><marker id="legend-arrow-both-b" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#12b886"/></marker></defs><line x1="7" y1="17" x2="51" y2="17" stroke="#12b886" stroke-width="3" marker-start="url(#legend-arrow-both-a)" marker-end="url(#legend-arrow-both-b)"/></svg></span><span class="legend-label">Dois sentidos</span></li>
        """
    controls = "" if readonly else f"""
        <div class="diagram-toolbar">
            {toolbar}
            <button class="button secondary" type="button" data-diagram-connect>Ligar selecionados</button>
            <button class="button secondary" type="button" data-diagram-edit>Editar selecionado</button>
            {"<button class='button secondary' type='button' data-diagram-deceased>Falecido</button>" if kind == "genograma" else ""}
            <button class="button danger" type="button" data-diagram-delete>Apagar selecionado</button>
        </div>
        <p class="diagram-help">Clique uma vez numa figura para selecionar. Para filiação com dois progenitores, selecione primeiro os dois progenitores e depois o filho. Arraste uma figura para a mover.</p>
    """
    return f"""
    <div class="diagram-editor" data-diagram-editor data-diagram-kind="{kind}" data-readonly="{readonly_attr}">
        <label for="{key}">{esc(title)}</label>
        <textarea class="diagram-data" id="{key}" name="{key}" {disabled}>{esc(data.get(key))}</textarea>
        {controls}
        <div class="diagram-wrap">
            <div class="diagram-canvas" data-diagram-canvas></div>
            <div class="diagram-legend">
                <h5>Legenda</h5>
                <ul>{legend}</ul>
                <div class="field">
                    <label>Notas</label>
                    <textarea class="diagram-note" data-diagram-notes {disabled}></textarea>
                </div>
            </div>
        </div>
    </div>
    """


def render_diagnostica_form(data, readonly=False):
    readonly_class = " readonly-section" if readonly else ""
    sim_nao = [("sim", "Sim"), ("nao", "Não")]
    return f"""
    <div class="diagnostica-form{readonly_class}">
        <section class="form-section">
            <h4 class="section-title">Avaliação Diagnóstica Multidisciplinar</h4>
            <div class="form-grid">
                {render_text_input(data, "diag_data_avaliacao", "Data da Avaliação", "span-4", "date", readonly)}
                {render_text_input(data, "diag_processo_numero", "Processo n.º", "span-4", readonly=readonly)}
                {render_text_input(data, "diag_tecnico_referencia", "Técnico de referência", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1. Dados Sócio-Demográficos</h4>
            <div class="form-grid">
                {render_text_input(data, "diag_nome", "1.1 Nome", "span-12", readonly=readonly)}
                {render_choice_group(data, "diag_estado_civil", "1.2 Estado Civil", DIAGNOSTICA_ESTADO_CIVIL, "span-12", readonly)}
                {render_text_input(data, "diag_nacionalidade", "Nacionalidade", "span-6", readonly=readonly)}
                {render_text_input(data, "diag_linguas", "Língua(s) falada(s)", "span-6", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1.4 Grau de escolaridade mais elevado</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_ESCOLARIDADE, readonly)}
            </div>
            <div class="form-grid">
                {render_text_input(data, "diag_idade_escolaridade", "Idade com que completou a escolaridade", "span-4", readonly=readonly)}
                {render_textarea_input(data, "diag_escolaridade_observacoes", "Observações/Eventos significativos no percurso escolar", "span-8", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1.5 Situação Laboral</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_LABORAL, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_labor_observacoes", "Observações", "span-12", readonly=readonly)}
                {render_choice_group(data, "diag_relacao_juridica", "Se empregado, a relação jurídica de emprego é", DIAGNOSTICA_RELACAO_JURIDICA, "span-8", readonly)}
                {render_text_input(data, "diag_tempo_trabalho", "Há quanto tempo trabalha", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1.6 Problemas de Inserção Profissional</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_INSERCAO, readonly)}
            </div>
            <div class="form-grid">
                {render_text_input(data, "diag_insercao_outros_texto", "Outros", "span-6", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1.7 Situação Económica</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_ECONOMICA, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_economica_observacoes", "Observações", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">1.8 Habitação</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_HABITACAO, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_habitacao_observacoes", "Observações", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">2. Situação Sócio-Familiar</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_FAMILIAR, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_familiar_outro_texto", "Outro", "span-6", readonly=readonly)}
            </div>
        </section>

        {render_diagnostica_agregado_table(data, readonly)}

        <section class="form-section">
            <h4 class="section-title">2.3 Genograma</h4>
            {render_diagram_editor(data, "diag_genograma", "Genograma", "genograma", readonly)}
        </section>

        <section class="form-section">
            <h4 class="section-title">2.4 Relações Sociais</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_RELACOES_SOCIAIS, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_relacoes_outro_texto", "Outro", "span-12", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">2.5 Rede Social</h4>
            <div class="checkbox-grid">
                {render_diagnostica_checkbox_options(data, DIAGNOSTICA_REDE_SOCIAL, readonly)}
            </div>
            <div class="form-grid">
                {render_textarea_input(data, "diag_rede_outro_texto", "Outro", "span-12", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">2.6 Ecomapa</h4>
            {render_diagram_editor(data, "diag_ecomapa", "Ecomapa", "ecomapa", readonly)}
        </section>

        <section class="form-section">
            <h4 class="section-title">3. Saúde</h4>
            <div class="form-grid">
                {render_textarea_input(data, "diag_historia_doenca", "História e doença atual", readonly=readonly)}
                {render_textarea_input(data, "diag_antecedentes_pessoais", "Antecedentes Psiquiátricos Pessoais", readonly=readonly)}
                {render_textarea_input(data, "diag_antecedentes_familiares", "Antecedentes Psiquiátricos Familiares", readonly=readonly)}
                {render_textarea_input(data, "diag_internamentos", "Internamentos", readonly=readonly)}
                {render_textarea_input(data, "diag_outros_problemas_saude", "Outros problemas de saúde e antecedentes médicos a referir", readonly=readonly)}
                {render_choice_group(data, "diag_antipsicotico_injetavel", "Antipsicótico injetável", sim_nao, "span-4", readonly)}
                {render_text_input(data, "diag_antipsicotico_local", "Local de administração", "span-4", readonly=readonly)}
                {render_text_input(data, "diag_antipsicotico_responsavel", "Responsável", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">4. Outros Aspetos Relevantes na Reabilitação</h4>
            <div class="form-grid">
                {render_textarea_input(data, "diag_rotina", "4.1 Breve descrição da Rotina", readonly=readonly)}
                {render_text_input(data, "diag_sono_deitar", "Horário de deitar", "span-3", readonly=readonly)}
                {render_text_input(data, "diag_sono_levantar", "Horário de levantar", "span-3", readonly=readonly)}
                {render_text_input(data, "diag_sono_horas", "Número de horas que costuma dormir", "span-3", readonly=readonly)}
                {render_choice_group(data, "diag_sono_acorda_antes", "Acorda antes da hora desejada", sim_nao, "span-3", readonly)}
                {render_textarea_input(data, "diag_sono_observacoes", "Observações sobre sono/repouso", readonly=readonly)}
                {render_textarea_input(data, "diag_condicao_fisica", "4.3 Condição Física", readonly=readonly)}
                {render_textarea_input(data, "diag_comportamentos_risco", "4.4 Comportamentos de risco/Consumos", readonly=readonly)}
                {render_textarea_input(data, "diag_adesao_terapeutica", "4.5 Adesão terapêutica", readonly=readonly)}
            </div>
        </section>

        {render_diagnostica_avdi_table(data, readonly)}

        <section class="form-section">
            <h4 class="section-title">5. Informações relevantes a registar</h4>
            <div class="form-grid">
                {render_textarea_input(data, "diag_informacoes_relevantes", "Informações relevantes", readonly=readonly)}
            </div>
        </section>

        <section class="form-section">
            <h4 class="section-title">6. Contactos Úteis</h4>
            <div class="form-grid">
                {render_textarea_input(data, "diag_contactos_uteis", "Contactos", readonly=readonly)}
            </div>
        </section>
    </div>
    """


def render_atendimento_ambitos(data, row, readonly=False):
    disabled = "disabled" if readonly else ""
    items = []
    for key, label in ATENDIMENTO_AMBITOS:
        field = f"atend_{row}_ambito_{key}"
        checked = "checked" if data.get(field) else ""
        items.append(
            f"""
            <label class="check-option">
                <input type="checkbox" name="{field}" {checked} {disabled}>
                {esc(label)}
            </label>
            """
        )
    return "".join(items)


def render_atendimento_tipo(data, row, readonly=False):
    disabled = "disabled" if readonly else ""
    field = f"atend_{row}_tipo"
    items = []
    for value, label in ATENDIMENTO_TIPOS:
        checked = "checked" if data.get(field) == value else ""
        items.append(
            f"""
            <label class="choice-option">
                <input type="radio" name="{field}" value="{value}" {checked} {disabled}>
                {esc(label)}
            </label>
            """
        )
    return "".join(items)


def render_atendimentos_form(data, readonly=False):
    row_count = atendimento_row_count_from_mapping(data)
    disabled = "disabled" if readonly else ""
    rows = ""
    for row in range(row_count):
        rows += f"""
        <tr>
            <td class="meta-cell">
                <div class="attendance-meta">
                    <div class="field">
                        <label for="atend_{row}_data">Data</label>
                        <input id="atend_{row}_data" name="atend_{row}_data" type="date" value="{esc(data.get(f'atend_{row}_data'))}" {disabled}>
                    </div>
                    <div>
                        <label>Âmbito</label>
                        <div class="sheet-checks">
                            {render_atendimento_ambitos(data, row, readonly)}
                        </div>
                        <div class="sheet-other-field">
                            <label for="atend_{row}_ambito_outro_texto">Outro:</label>
                            <input id="atend_{row}_ambito_outro_texto" name="atend_{row}_ambito_outro_texto" value="{esc(data.get(f'atend_{row}_ambito_outro_texto'))}" {disabled}>
                        </div>
                    </div>
                    <div>
                        <label>Tipo</label>
                        <div class="choice-group">
                            {render_atendimento_tipo(data, row, readonly)}
                        </div>
                    </div>
                </div>
            </td>
            <td class="text-cell">
                <textarea name="atend_{row}_descricao" {disabled}>{esc(data.get(f'atend_{row}_descricao'))}</textarea>
            </td>
            <td class="text-cell">
                <textarea name="atend_{row}_observacoes" {disabled}>{esc(data.get(f'atend_{row}_observacoes'))}</textarea>
            </td>
            <td class="text-cell">
                <textarea name="atend_{row}_profissionais" {disabled}>{esc(data.get(f'atend_{row}_profissionais'))}</textarea>
            </td>
        </tr>
        """
    return f"""
    <div class="atendimentos-form{' readonly-section' if readonly else ''}">
        <section class="form-section">
            <h4 class="section-title">Registo de Atendimentos e Acompanhamentos</h4>
            <input type="hidden" name="{ATENDIMENTO_ROW_COUNT_FIELD}" value="{esc(row_count)}" data-attendance-count>
            <div class="form-grid">
                {render_text_input(data, "atend_nome", "Nome do Utente", "span-8", readonly=readonly)}
                {render_text_input(data, "atend_processo_numero", "Processo n.º", "span-4", readonly=readonly)}
            </div>
        </section>

        <section class="form-section readonly-section" data-attendance-records>
            <div class="attendance-section-head">
                <h4 class="section-title">Registos</h4>
                {"" if readonly else '<button class="button secondary" type="button" data-attendance-add>Adicionar registo</button>'}
            </div>
            <div class="medication-wrap">
                <table class="sheet-table attendance-table">
                    <thead>
                        <tr>
                            <th>Data / Âmbito / Tipo</th>
                            <th>Descrição da Intervenção / Atividades Realizadas</th>
                            <th>Observações / Recomendações</th>
                            <th>Profissionais / Pessoas Envolvidas</th>
                        </tr>
                    </thead>
                    <tbody data-attendance-body>{rows}</tbody>
                </table>
            </div>
        </section>
    </div>
    """


def render_pdf_attachments_panel(
    utente_id,
    readonly=False,
    active_tab="protecao_dados",
    upload_title="Anexar PDF digitalizado",
    list_title="PDFs deste utente",
    wrapper_class="protecao-form",
):
    active_tab = normalize_tab_key(active_tab)
    rows = list_pdf_attachments(utente_id, active_tab)
    upload_html = ""
    if not readonly:
        upload_html = f"""
        <section class="form-section">
            <h4 class="section-title">{esc(upload_title)}</h4>
            <form class="pdf-upload-form" method="post" action="/anexos/upload" enctype="multipart/form-data">
                <input type="hidden" name="utente_id" value="{esc(utente_id)}">
                <input type="hidden" name="tab" value="{esc(active_tab)}">
                <input type="file" name="pdf" accept="application/pdf,.pdf" required>
                <div class="actions">
                    <button class="button" type="submit">Anexar PDF</button>
                </div>
            </form>
        </section>
        """
    if rows:
        items = ""
        for row in rows:
            delete_html = ""
            if not readonly:
                delete_html = f"""
                <form method="post" action="/anexos/eliminar" onsubmit="return confirm('Remover este PDF?');">
                    <input type="hidden" name="id" value="{row['id']}">
                    <input type="hidden" name="utente_id" value="{utente_id}">
                    <input type="hidden" name="tab" value="{esc(active_tab)}">
                    <button class="button danger" type="submit">Remover</button>
                </form>
                """
            items += f"""
            <div class="attachment-row">
                <div>
                    <div class="attachment-name">{esc(row["original_name"])}</div>
                    <div class="attachment-meta">
                        {esc(format_file_size(row["size_bytes"]))} · anexado em {esc(row["created_at"])}
                        {f" · por {esc(row['uploaded_by_name'])}" if row["uploaded_by_name"] else ""}
                    </div>
                </div>
                <div class="attachment-actions">
                    <a class="button secondary" href="/anexo?id={row['id']}" target="_blank" rel="noopener">Abrir</a>
                    {delete_html}
                </div>
            </div>
            """
    else:
        items = '<div class="empty">Ainda não existem PDFs anexados neste separador.</div>'
    return f"""
    <div class="{esc(wrapper_class)}">
        {upload_html}
        <section class="form-section">
            <h4 class="section-title">{esc(list_title)}</h4>
            <div class="attachments-list">
                {items}
            </div>
        </section>
    </div>
    """


def render_protecao_dados_form(utente_id, readonly=False):
    return render_pdf_attachments_panel(
        utente_id,
        readonly=readonly,
        active_tab="protecao_dados",
        upload_title="Anexar PDF digitalizado",
        list_title="PDFs deste utente",
        wrapper_class="protecao-form",
    )


def render_outros_form(utente_id, readonly=False):
    return render_pdf_attachments_panel(
        utente_id,
        readonly=readonly,
        active_tab="outros",
        upload_title="Anexar outros documentos",
        list_title="Outros anexos deste utente",
        wrapper_class="outros-form",
    )


def render_print_page_button(current_user):
    return f'<button class="button secondary print-page-button" type="button" onclick="printUtentePage()"><i data-lucide="printer"></i>{esc(tr(current_user, "print"))}</button>'


def render_edit_page(utente, active_tab=None, error="", notice="", current_user=None):
    active_tab = normalize_tab_key(active_tab)
    if not can_view_tab(current_user, active_tab):
        active_tab = first_allowed_tab(current_user)
    tab_sections = allowed_tab_sections(current_user)
    active_label = next((label for key, label in tab_sections if key == active_tab), "")
    readonly = not can_edit_tab(current_user, active_tab)
    save_button = "" if readonly else '<button class="button" type="submit" form="edit-utente-form"><i data-lucide="save"></i>Guardar</button>'
    if active_tab in {"protecao_dados", "outros"}:
        save_button = ""
    tab_links = ""
    for key, label in tab_sections:
        active_class = " active" if key == active_tab else ""
        tab_links += (
            f'<a class="tab-link{active_class}" href="/editar?id={utente["id"]}&tab={key}" '
            f'title="{esc(label)}">'
            f"{esc(label)}</a>"
        )

    tab_content = get_tab_content(utente["id"], active_tab)
    ref_data, em_data, ins_data, diag_data, atend_data = load_structured_tab_data(utente["id"])
    extra_after_form = ""
    if active_tab == "referenciacao":
        ref_data["ref_nome"] = ref_data.get("ref_nome") or utente.get("nome") or ""
        tab_body = render_referenciacao_form(ref_data, utente["id"], readonly=readonly, include_attachments=False)
        extra_after_form = render_pdf_attachments_panel(
            utente["id"],
            readonly=readonly,
            active_tab="referenciacao",
            upload_title="Anexar folha de referenciação",
            list_title="Folhas anexadas",
            wrapper_class="referenciacao-attachments",
        )
    elif active_tab == "pagamentos":
        pag_data = load_pagamentos_data(utente["id"])
        tab_body = render_pagamentos_form(pag_data, readonly=readonly, current_user=current_user)
    elif active_tab == "emergencia":
        em_data["em_nome"] = em_data.get("em_nome") or utente.get("nome") or ""
        tab_body = render_emergencia_form(em_data, readonly=readonly)
    elif active_tab == "inscricao":
        ins_data["ins_nome"] = ins_data.get("ins_nome") or utente.get("nome") or ""
        tab_body = render_inscricao_form(ins_data, readonly=readonly)
    elif active_tab == "diagnostica":
        diag_data["diag_nome"] = diag_data.get("diag_nome") or utente.get("nome") or ""
        tab_body = render_diagnostica_form(diag_data, readonly=readonly)
    elif active_tab == "atendimentos":
        atend_data["atend_nome"] = atend_data.get("atend_nome") or utente.get("nome") or ""
        tab_body = render_atendimentos_form(atend_data, readonly=readonly)
    elif active_tab == "protecao_dados":
        tab_body = render_protecao_dados_form(utente["id"], readonly=readonly)
    elif active_tab == "outros":
        tab_body = render_outros_form(utente["id"], readonly=readonly)
    else:
        tab_body = f"""
                <div class="field full">
                    <label for="conteudo">Conteúdo</label>
                    <textarea class="large-textarea" id="conteudo" name="conteudo">{esc(tab_content)}</textarea>
                </div>
        """
    error_html = f'<div class="notice">{esc(error)}</div>' if error else ""
    print_button = render_print_page_button(current_user)

    if active_tab in {"protecao_dados", "outros"}:
        content = f"""
<div class="edit-layout">
    <div class="edit-title">
        <div class="title-actions">
            <span class="autosave-status" data-autosave-status aria-live="polite"></span>
            {print_button}
            <a class="button secondary" href="/"><i data-lucide="undo-2"></i>Voltar</a>
            {save_button}
        </div>
    </div>
    {error_html}
    <form id="edit-utente-form" method="post" action="/editar">
        <input type="hidden" name="id" value="{esc(utente.get('id'))}">
        <input type="hidden" name="tab" value="{esc(active_tab)}">
    </form>
    <section class="panel tabs-panel">
        <nav class="tab-list" aria-label="Áreas do utente">
            {tab_links}
        </nav>
        <div class="tab-content" data-print-title="{esc(active_label)}">
            {tab_body}
        </div>
    </section>
</div>
"""
        return render_page("Editar utente", content, notice=notice, current_user=current_user)

    content = f"""
<div class="edit-layout">
    <div class="edit-title">
        <div class="title-actions">
            <span class="autosave-status" data-autosave-status aria-live="polite"></span>
            {print_button}
            <a class="button secondary" href="/"><i data-lucide="undo-2"></i>Voltar</a>
            {save_button}
        </div>
    </div>
    {error_html}
    <form id="edit-utente-form" class="edit-layout" method="post" action="/editar">
        <input type="hidden" name="id" value="{esc(utente.get('id'))}">
        <input type="hidden" name="tab" value="{esc(active_tab)}">
        <section class="panel tabs-panel">
            <nav class="tab-list" aria-label="Áreas do utente">
                {tab_links}
            </nav>
            <div class="tab-content" data-print-title="{esc(active_label)}">
                {tab_body}
            </div>
        </section>
    </form>
    {extra_after_form}
</div>
"""
    return render_page("Editar utente", content, notice=notice, current_user=current_user)


def render_view_page(utente, active_tab=None, notice="", current_user=None):
    active_tab = normalize_tab_key(active_tab)
    if not can_view_tab(current_user, active_tab):
        active_tab = first_allowed_tab(current_user)
    tab_sections = allowed_tab_sections(current_user)
    active_label = next((label for key, label in tab_sections if key == active_tab), "")
    tab_links = ""
    for key, label in tab_sections:
        active_class = " active" if key == active_tab else ""
        tab_links += (
            f'<a class="tab-link{active_class}" href="/ver?id={utente["id"]}&tab={key}" '
            f'title="{esc(label)}">'
            f"{esc(label)}</a>"
        )

    tab_content = get_tab_content(utente["id"], active_tab)
    ref_data, em_data, ins_data, diag_data, atend_data = load_structured_tab_data(utente["id"])
    if active_tab == "referenciacao":
        ref_data["ref_nome"] = ref_data.get("ref_nome") or utente.get("nome") or ""
        tab_body = render_referenciacao_form(ref_data, utente["id"], readonly=True)
    elif active_tab == "pagamentos":
        pag_data = load_pagamentos_data(utente["id"])
        tab_body = render_pagamentos_form(pag_data, readonly=True, current_user=current_user)
    elif active_tab == "emergencia":
        em_data["em_nome"] = em_data.get("em_nome") or utente.get("nome") or ""
        tab_body = render_emergencia_form(em_data, readonly=True)
    elif active_tab == "inscricao":
        ins_data["ins_nome"] = ins_data.get("ins_nome") or utente.get("nome") or ""
        tab_body = render_inscricao_form(ins_data, readonly=True)
    elif active_tab == "diagnostica":
        diag_data["diag_nome"] = diag_data.get("diag_nome") or utente.get("nome") or ""
        tab_body = render_diagnostica_form(diag_data, readonly=True)
    elif active_tab == "atendimentos":
        atend_data["atend_nome"] = atend_data.get("atend_nome") or utente.get("nome") or ""
        tab_body = render_atendimentos_form(atend_data, readonly=True)
    elif active_tab == "protecao_dados":
        tab_body = render_protecao_dados_form(utente["id"], readonly=True)
    elif active_tab == "outros":
        tab_body = render_outros_form(utente["id"], readonly=True)
    else:
        tab_body = f"""
            <div class="field full">
                <label>Conteúdo</label>
                <div class="readonly-field readonly-text">{esc(tab_content) or "Sem informação registada."}</div>
            </div>
        """
    print_button = render_print_page_button(current_user)
    content = f"""
<div class="edit-layout">
    <div class="edit-title">
        <div class="title-actions">
            {print_button}
            <a class="button secondary" href="/">Voltar</a>
        </div>
    </div>
    <section class="panel tabs-panel">
        <nav class="tab-list" aria-label="Áreas do utente">
            {tab_links}
        </nav>
        <div class="tab-content" data-print-title="{esc(active_label)}">
            {tab_body}
        </div>
    </section>
</div>
"""
    return render_page("Ver utente", content, notice=notice, current_user=current_user)


def fetch_utentes(query=""):
    if supabase_available():
        params = {"select": "*", "order": "nome.asc"}
        if query:
            params["nome"] = f"ilike.*{query}*"
        return table_select("utentes", params)

    params = []
    where = ""
    if query:
        where = "WHERE nome LIKE ?"
        like = f"%{query}%"
        params = [like]

    with get_connection() as conn:
        return conn.execute(
            f"""
            SELECT *
            FROM utentes
            {where}
            ORDER BY nome COLLATE NOCASE
            """,
            params,
        ).fetchall()


def render_list(query="", notice="", current_user=None):
    rows = fetch_utentes(query)

    rows_html = ""
    can_edit = can_edit_utentes(current_user)
    can_delete = can_delete_utentes(current_user)
    can_export = can_export_utentes(current_user) and can_view_sensitive_utentes(current_user)
    backup_button = ""
    if can_export:
        backup_button = f'<a class="button secondary" href="/backup/utentes">{DOWNLOAD_ICON}{esc(tr(current_user, "export_backup"))}</a>'
    view_label = tr(current_user, "view")
    edit_label = tr(current_user, "edit")
    delete_label = tr(current_user, "delete")
    toggle_label = tr(current_user, "toggle_active")
    pay_label = tr(current_user, "pay_fee")
    for row in rows:
        edit_html = ""
        delete_html = ""
        toggle_html = ""
        payment_html = ""
        is_active = (row["estado"] or "Ativo") == "Ativo"
        status_key = "active" if is_active else "inactive"
        status_class = "active" if is_active else "blocked"
        pagamentos_data = load_pagamentos_data(row["id"])
        payment_info = payment_summary(pagamentos_data, current_user)
        next_payment_label = month_label(payment_info["next_month"], user_language(current_user))
        toggle_action_label = tr(current_user, "deactivate_client" if is_active else "activate_client")
        toggle_confirm = "Inativar este utente?" if is_active else "Ativar este utente?"
        toggle_icon = USER_X_ICON if is_active else USER_CHECK_ICON
        if can_edit:
            payment_html = f"""
                    <button class="button payment icon-button" type="button" data-quick-payment-open data-client-id="{row["id"]}" data-client-name="{esc(row["nome"])}" data-payment-month="{esc(next_payment_label)}" aria-label="{esc(pay_label)}" title="{esc(pay_label)}">
                        {MONEY_ICON}
                    </button>
            """
            toggle_html = f"""
                    <form method="post" action="/estado" onsubmit="return confirm('{esc(toggle_confirm)}');">
                        <input type="hidden" name="id" value="{row["id"]}">
                        <button class="button toggle icon-button" type="submit" aria-label="{esc(toggle_action_label)}" title="{esc(toggle_action_label)}">
                            {toggle_icon}
                        </button>
                    </form>
            """
            edit_html = f"""
                    <a class="button secondary icon-button" href="/editar?id={row["id"]}" aria-label="{esc(edit_label)}" title="{esc(edit_label)}">
                        {PENCIL_ICON}
                    </a>
            """
        if can_delete:
            delete_html = f"""
                    <form method="post" action="/eliminar" onsubmit="return confirm('Eliminar este utente?');">
                        <input type="hidden" name="id" value="{row["id"]}">
                        <button class="button danger icon-button" type="submit" aria-label="{esc(delete_label)}" title="{esc(delete_label)}">
                            {TRASH_ICON}
                        </button>
                    </form>
            """
        rows_html += f"""
        <tr>
            <td>
                <div class="name">{esc(row["nome"])}</div>
            </td>
            <td><span class="status {status_class}">{esc(tr(current_user, status_key))}</span></td>
            <td><span class="status {esc(payment_info["class"])}">{esc(payment_info["label"])}</span></td>
            <td class="actions-cell">
                <div class="row-actions">
                    {payment_html}
                    <a class="button view icon-button" href="/ver?id={row["id"]}" aria-label="{esc(view_label)}" title="{esc(view_label)}">
                        {EYE_ICON}
                    </a>
                    {edit_html}
                    {toggle_html}
                    {delete_html}
                </div>
            </td>
        </tr>
        """

    if not rows:
        rows_html = f"""
        <tr>
            <td colspan="4">
                <div class="empty">
                    <h2>{esc(tr(current_user, "no_clients"))}</h2>
                    <p class="muted">{esc(tr(current_user, "no_clients_help"))}</p>
                </div>
            </td>
        </tr>
        """

    content = f"""
<div class="toolbar">
    <form class="search-form" method="get" action="/">
        <input name="q" value="{esc(query)}" placeholder="{esc(tr(current_user, "search_by_name"))}">
        <button class="button secondary" type="submit"><i data-lucide="search"></i>{esc(tr(current_user, "search"))}</button>
        {f"<a class='button secondary' href='/'>{esc(tr(current_user, 'clear'))}</a>" if query else ""}
        <a class="button secondary" href="/estatisticas">{STATS_ICON}{esc(tr(current_user, "statistics"))}</a>
        {backup_button}
    </form>
</div>
<section class="panel table-wrap">
    <table>
        <thead>
            <tr>
                <th>{esc(tr(current_user, "name"))}</th>
                <th>{esc(tr(current_user, "status"))}</th>
                <th>{esc(tr(current_user, "monthly_fee"))}</th>
                <th class="actions-cell">{esc(tr(current_user, "actions"))}</th>
            </tr>
        </thead>
        <tbody>{rows_html}</tbody>
    </table>
</section>
{render_quick_payment_dialog(current_user) if can_edit else ""}
"""
    return render_page(tr(current_user, "client_list"), content, notice=notice, current_user=current_user)


def parse_stored_date(value):
    value = str(value or "").strip()
    if not value:
        return None
    for candidate in (value, value[:10]):
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(candidate, fmt).date()
            except ValueError:
                continue
    return None


def format_duration(days, current_user=None):
    if days is None:
        return "Sem dados suficientes" if user_language(current_user) == "pt" else "Not enough data"
    if days < 31:
        unit = "dias" if user_language(current_user) == "pt" else "days"
        return f"{days} {unit}"
    months = round(days / 30.44, 1)
    if months < 12:
        unit = "meses" if user_language(current_user) == "pt" else "months"
        return f"{months:g} {unit}"
    years = round(days / 365.25, 1)
    unit = "anos" if user_language(current_user) == "pt" else "years"
    return f"{years:g} {unit}"


def utente_start_date(utente, ref_data, ins_data):
    candidates = [
        ref_data.get("data_rececao"),
        ins_data.get("ins_data"),
        utente["created_at"],
    ]
    for value in candidates:
        parsed = parse_stored_date(value)
        if parsed:
            return parsed
    return None


def calculate_utentes_statistics():
    rows = fetch_utentes()
    today = datetime.now().date()
    permanence_days = []
    municipality_counts = {}
    active_count = 0
    inactive_count = 0
    payment_scope_count = 0
    paid_count = 0
    overdue_count = 0
    overdue_months = []

    for row in rows:
        is_active = (row["estado"] or "Ativo") == "Ativo"
        active_count += 1 if is_active else 0
        inactive_count += 0 if is_active else 1
        if is_active:
            payment_scope_count += 1
            pagamentos_data = load_pagamentos_data(row["id"])
            pending_count = payment_pending_count(pagamentos_data, today)
            if pending_count:
                overdue_count += 1
                overdue_months.append(pending_count)
            else:
                paid_count += 1
        ref_data = load_referenciacao_data(row["id"])
        ins_data = load_inscricao_data(row["id"])
        start_date = utente_start_date(row, ref_data, ins_data)
        if start_date:
            end_date = today if is_active else (parse_stored_date(row["updated_at"]) or today)
            permanence_days.append(max((end_date - start_date).days, 0))
        municipality = (ref_data.get("concelho") or "").strip()
        if not municipality:
            municipality = "Sem concelho preenchido"
        municipality_counts[municipality] = municipality_counts.get(municipality, 0) + 1

    total = len(rows)
    average_days = round(sum(permanence_days) / len(permanence_days)) if permanence_days else None
    paid_percentage = round((paid_count / payment_scope_count) * 100, 1) if payment_scope_count else 0
    overdue_percentage = round((overdue_count / payment_scope_count) * 100, 1) if payment_scope_count else 0
    average_payment_delay = round(sum(overdue_months) / len(overdue_months), 1) if overdue_months else 0
    municipalities = sorted(
        [
            {
                "name": name,
                "count": count,
                "percentage": round((count / total) * 100, 1) if total else 0,
            }
            for name, count in municipality_counts.items()
        ],
        key=lambda item: (-item["count"], item["name"].lower()),
    )
    return {
        "total": total,
        "active": active_count,
        "inactive": inactive_count,
        "average_days": average_days,
        "payment_scope": payment_scope_count,
        "paid_count": paid_count,
        "overdue_count": overdue_count,
        "paid_percentage": paid_percentage,
        "overdue_percentage": overdue_percentage,
        "average_payment_delay": average_payment_delay,
        "municipalities": municipalities,
    }


def render_statistics_page(current_user):
    stats = calculate_utentes_statistics()
    municipality_rows = ""
    for item in stats["municipalities"]:
        municipality_rows += f"""
        <tr>
            <td>{esc(item["name"])}</td>
            <td>{item["count"]}</td>
            <td>
                <div class="percentage-cell">
                    <span>{item["percentage"]:g}%</span>
                    <span class="percentage-bar"><span style="width: {item["percentage"]:g}%"></span></span>
                </div>
            </td>
        </tr>
        """
    if not municipality_rows:
        municipality_rows = """
        <tr>
            <td colspan="3">Sem dados suficientes</td>
        </tr>
        """
    content = f"""
<div class="edit-layout">
    <div class="edit-title stats-page-title">
        <div>
            <h2>Estatísticas de utentes</h2>
        </div>
        <div class="title-actions">
            {render_print_page_button(current_user)}
            <a class="button secondary" href="/">Voltar</a>
        </div>
    </div>
    <h2 class="stats-print-heading">Estatísticas de utentes</h2>
    <section class="stats-grid">
        <article class="stat-card">
            <span>{esc(tr(current_user, "average_stay"))}</span>
            <strong>{esc(format_duration(stats["average_days"], current_user))}</strong>
        </article>
        <article class="stat-card">
            <span>Utentes considerados</span>
            <strong>{stats["total"]}</strong>
        </article>
        <article class="stat-card">
            <span>Ativos</span>
            <strong>{stats["active"]}</strong>
        </article>
        <article class="stat-card">
            <span>Inativos</span>
            <strong>{stats["inactive"]}</strong>
        </article>
        <article class="stat-card">
            <span>{esc(tr(current_user, "fees_current"))}</span>
            <strong>{stats["paid_percentage"]:g}%</strong>
            <small>{stats["paid_count"]}/{stats["payment_scope"]} {esc(tr(current_user, "active_clients_scope"))}</small>
        </article>
        <article class="stat-card">
            <span>{esc(tr(current_user, "fees_overdue"))}</span>
            <strong>{stats["overdue_percentage"]:g}%</strong>
            <small>{stats["overdue_count"]}/{stats["payment_scope"]} {esc(tr(current_user, "active_clients_scope"))}</small>
        </article>
        <article class="stat-card">
            <span>{esc(tr(current_user, "average_fee_delay"))}</span>
            <strong>{esc(format_delay_months(stats["average_payment_delay"], current_user))}</strong>
            <small>{esc(tr(current_user, "fees_overdue"))}</small>
        </article>
    </section>
    <section class="panel table-wrap">
        <div class="section-heading">
            <h3>Distribuição por concelho</h3>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Concelho</th>
                    <th>Total</th>
                    <th>Percentagem</th>
                </tr>
            </thead>
            <tbody>{municipality_rows}</tbody>
        </table>
    </section>
</div>
"""
    return render_page("Estatísticas de utentes", content, current_user=current_user)


def get_utente(utente_id):
    if supabase_available():
        return table_first("utentes", {"select": "*", "id": f"eq.{utente_id}"})
    with get_connection() as conn:
        return conn.execute("SELECT * FROM utentes WHERE id = ?", (utente_id,)).fetchone()


def get_tab_title(tab_key):
    for key, title in TAB_SECTIONS:
        if key == tab_key:
            return title
    return TAB_SECTIONS[0][1]


def row_dict(row):
    return dict(row) if hasattr(row, "keys") else dict(row or {})


def normalize_tab_key(tab_key):
    valid_keys = {key for key, _title in TAB_SECTIONS}
    return tab_key if tab_key in valid_keys else TAB_SECTIONS[0][0]


def get_tab_content(utente_id, tab_key):
    if supabase_available():
        row = table_first(
            "utente_abas",
            {"select": "conteudo", "utente_id": f"eq.{utente_id}", "tab_key": f"eq.{tab_key}"},
        )
        return row["conteudo"] if row else ""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT conteudo
            FROM utente_abas
            WHERE utente_id = ? AND tab_key = ?
            """,
            (utente_id, tab_key),
        ).fetchone()
    return row["conteudo"] if row else ""


def save_tab_content(utente_id, tab_key, conteudo):
    timestamp = now()
    if supabase_available():
        existing = table_first(
            "utente_abas",
            {"select": "created_at", "utente_id": f"eq.{utente_id}", "tab_key": f"eq.{tab_key}"},
        )
        table_upsert(
            "utente_abas",
            {
                "utente_id": utente_id,
                "tab_key": tab_key,
                "conteudo": conteudo,
                "created_at": existing.get("created_at") if existing else timestamp,
                "updated_at": timestamp,
            },
            "utente_id,tab_key",
        )
        return
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO utente_abas (utente_id, tab_key, conteudo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(utente_id, tab_key)
            DO UPDATE SET conteudo = excluded.conteudo,
                          updated_at = excluded.updated_at
            """,
            (utente_id, tab_key, conteudo, timestamp, timestamp),
        )


def safe_filename(filename):
    base = os.path.basename(filename or "documento.pdf").strip()
    stem, ext = os.path.splitext(base)
    cleaned = "".join(ch if ch.isalnum() or ch in " ._-()" else "_" for ch in stem).strip(" ._")
    return f"{cleaned or 'documento'}{ext.lower() or '.pdf'}"


def format_file_size(size_bytes):
    try:
        size = int(size_bytes)
    except (TypeError, ValueError):
        return ""
    if size >= 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    if size >= 1024:
        return f"{size / 1024:.0f} KB"
    return f"{size} B"


def attachment_dir(utente_id):
    return os.path.join(ATTACHMENTS_DIR, str(utente_id))


def attachment_path(row):
    return os.path.join(attachment_dir(row["utente_id"]), row["stored_name"])


def list_pdf_attachments(utente_id, tab_key="protecao_dados"):
    tab_key = normalize_tab_key(tab_key)
    if supabase_available():
        return table_select(
            "utente_anexos",
            {
                "select": "*",
                "utente_id": f"eq.{utente_id}",
                "tab_key": f"eq.{tab_key}",
                "order": "created_at.desc,id.desc",
            },
        )
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT *
            FROM utente_anexos
            WHERE utente_id = ? AND tab_key = ?
            ORDER BY created_at DESC, id DESC
            """,
            (utente_id, tab_key),
        ).fetchall()


def list_all_pdf_attachments(utente_id):
    if supabase_available():
        return table_select(
            "utente_anexos",
            {
                "select": "*",
                "utente_id": f"eq.{utente_id}",
                "order": "created_at.desc,id.desc",
            },
        )
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT *
            FROM utente_anexos
            WHERE utente_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (utente_id,),
        ).fetchall()


def get_pdf_attachment(attachment_id):
    if supabase_available():
        return table_first("utente_anexos", {"select": "*", "id": f"eq.{attachment_id}"})
    with get_connection() as conn:
        return conn.execute("SELECT * FROM utente_anexos WHERE id = ?", (attachment_id,)).fetchone()


def save_pdf_attachment(utente_id, original_name, content, user, tab_key="protecao_dados"):
    tab_key = normalize_tab_key(tab_key)
    if not content:
        raise ValueError("Escolha um ficheiro PDF para anexar.")
    if len(content) > MAX_PDF_BYTES:
        raise ValueError("O PDF excede o limite de 30 MB.")
    safe_name = safe_filename(original_name)
    if not safe_name.lower().endswith(".pdf"):
        raise ValueError("Só são permitidos ficheiros PDF.")
    if not content.startswith(b"%PDF"):
        raise ValueError("O ficheiro escolhido não parece ser um PDF válido.")
    if supabase_available():
        stored_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(6)}.pdf"
        timestamp = now()
        pending_row = {"utente_id": utente_id, "stored_name": stored_name}
        supabase_upload_pdf(pending_row, content)
        row = table_insert(
            "utente_anexos",
            {
                "utente_id": utente_id,
                "tab_key": tab_key,
                "original_name": safe_name,
                "stored_name": stored_name,
                "size_bytes": len(content),
                "uploaded_by": user.get("id") if user else None,
                "uploaded_by_name": user.get("nome") if user else "",
                "created_at": timestamp,
            },
        )
        return row["id"]
    os.makedirs(attachment_dir(utente_id), exist_ok=True)
    stored_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(6)}.pdf"
    path = os.path.join(attachment_dir(utente_id), stored_name)
    with open(path, "wb") as file:
        file.write(content)
    timestamp = now()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO utente_anexos (
                utente_id, tab_key, original_name, stored_name, size_bytes,
                uploaded_by, uploaded_by_name, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                utente_id,
                tab_key,
                safe_name,
                stored_name,
                len(content),
                user.get("id") if user else None,
                user.get("nome") if user else "",
                timestamp,
            ),
        )
        return cursor.lastrowid


def delete_pdf_attachment(attachment_id):
    row = get_pdf_attachment(attachment_id)
    if not row:
        return None
    if supabase_available():
        table_delete("utente_anexos", {"id": f"eq.{attachment_id}"})
        try:
            supabase_delete_pdf(row)
        except SupabaseError:
            pass
        return row
    path = attachment_path(row)
    with get_connection() as conn:
        conn.execute("DELETE FROM utente_anexos WHERE id = ?", (attachment_id,))
    if os.path.exists(path):
        os.remove(path)
    return row


def delete_utente_record(utente_id):
    utente = get_utente(utente_id)
    if not utente:
        return None
    if supabase_available():
        for attachment in list_all_pdf_attachments(utente_id):
            delete_pdf_attachment(attachment["id"])
        table_delete("utente_abas", {"utente_id": f"eq.{utente_id}"})
        table_delete("utentes", {"id": f"eq.{utente_id}"})
        return utente
    with get_connection() as conn:
        conn.execute("DELETE FROM utente_abas WHERE utente_id = ?", (utente_id,))
        conn.execute("DELETE FROM utente_anexos WHERE utente_id = ?", (utente_id,))
        conn.execute("DELETE FROM utentes WHERE id = ?", (utente_id,))
    if os.path.isdir(attachment_dir(utente_id)):
        shutil.rmtree(attachment_dir(utente_id))
    return utente


def safe_zip_segment(value, fallback="ficheiro"):
    value = str(value or "").strip()
    cleaned = "".join(ch if ch.isalnum() or ch in " ._-()" else "_" for ch in value).strip(" ._")
    return cleaned[:90] or fallback


def csv_bytes(headers, rows):
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue().encode("utf-8-sig")


def parse_backup_tab_content(raw):
    raw = str(raw or "")
    if not raw:
        return ""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def fetch_utente_history(utente_id):
    if supabase_available():
        return [
            row_dict(row)
            for row in table_select(
                "historico",
                {
                    "select": "*",
                    "alvo_tipo": "eq.Utente",
                    "alvo_id": f"eq.{utente_id}",
                    "order": "created_at.desc,id.desc",
                },
            )
        ]
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT *
            FROM historico
            WHERE alvo_tipo = 'Utente' AND alvo_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (utente_id,),
        ).fetchall()
    return [row_dict(row) for row in rows]


def read_pdf_attachment_bytes(attachment):
    if supabase_available():
        try:
            return supabase_download_pdf(attachment)
        except SupabaseError as exc:
            raise ValueError(f"Falha ao descarregar anexo {attachment['original_name']}: {exc}") from exc
    path = attachment_path(attachment)
    if not os.path.exists(path):
        raise ValueError(f"Anexo em falta: {attachment['original_name']}")
    with open(path, "rb") as file:
        return file.read()


def build_utente_backup_payload(utente):
    utente_id = int(utente["id"])
    tab_items = []
    for tab_key, tab_title in TAB_SECTIONS:
        raw = get_tab_content(utente_id, tab_key)
        tab_items.append(
            {
                "key": tab_key,
                "title": tab_title,
                "raw": raw,
                "data": parse_backup_tab_content(raw),
            }
        )
    pagamentos_data = load_pagamentos_data(utente_id)
    pagamentos = normalize_pagamento_history(pagamentos_data.get("pag_historico"))
    anexos = [row_dict(row) for row in list_all_pdf_attachments(utente_id)]
    historico = fetch_utente_history(utente_id)
    return {
        "exportado_em": now(),
        "utente": row_dict(utente),
        "separadores": tab_items,
        "pagamentos": pagamentos,
        "historico": historico,
        "anexos": anexos,
    }


def render_backup_value(value):
    if isinstance(value, dict):
        if not value:
            return "<p class='muted'>Sem dados registados.</p>"
        rows = ""
        for key, item in value.items():
            rows += f"""
            <tr>
                <th>{esc(str(key))}</th>
                <td>{render_backup_value(item)}</td>
            </tr>
            """
        return f"<table class='kv-table'><tbody>{rows}</tbody></table>"
    if isinstance(value, list):
        if not value:
            return "<p class='muted'>Sem registos.</p>"
        if all(isinstance(item, dict) for item in value):
            keys = []
            for item in value:
                for key in item:
                    if key not in keys:
                        keys.append(key)
            header = "".join(f"<th>{esc(str(key))}</th>" for key in keys)
            rows = ""
            for item in value:
                cells = "".join(f"<td>{render_backup_value(item.get(key, ''))}</td>" for key in keys)
                rows += f"<tr>{cells}</tr>"
            return f"<table class='data-table'><thead><tr>{header}</tr></thead><tbody>{rows}</tbody></table>"
        items = "".join(f"<li>{render_backup_value(item)}</li>" for item in value)
        return f"<ul>{items}</ul>"
    text = str(value or "").strip()
    if not text:
        return "<span class='muted'>-</span>"
    return esc(text).replace("\n", "<br>")


def render_utente_backup_html(payload):
    utente = payload["utente"]
    tab_sections = ""
    for tab in payload["separadores"]:
        tab_sections += f"""
        <section>
            <h2>{esc(tab["title"])}</h2>
            {render_backup_value(tab["data"])}
        </section>
        """
    content = f"""<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Ficha completa - {esc(utente.get("nome"))}</title>
    <style>
        body {{ font-family: Arial, sans-serif; color: #10231f; margin: 32px; line-height: 1.45; }}
        h1 {{ margin-bottom: 4px; }}
        h2 {{ border-bottom: 2px solid #2f7d73; padding-bottom: 6px; margin-top: 28px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
        th, td {{ border: 1px solid #c8d8d3; padding: 8px; vertical-align: top; text-align: left; }}
        th {{ background: #edf7f4; width: 28%; }}
        .data-table th {{ width: auto; }}
        .muted {{ color: #66736f; }}
        .meta {{ color: #66736f; margin-top: 0; }}
    </style>
</head>
<body>
    <h1>{esc(utente.get("nome") or "Utente")}</h1>
    <p class="meta">Backup exportado em {esc(payload["exportado_em"])}</p>
    <section>
        <h2>Dados gerais</h2>
        {render_backup_value(utente)}
    </section>
    {tab_sections}
    <section>
        <h2>Pagamentos</h2>
        {render_backup_value(payload["pagamentos"])}
    </section>
    <section>
        <h2>Histórico</h2>
        {render_backup_value(payload["historico"])}
    </section>
    <section>
        <h2>Anexos</h2>
        {render_backup_value(payload["anexos"])}
    </section>
</body>
</html>"""
    return content.encode("utf-8")


def pagamentos_csv_bytes(pagamentos):
    return csv_bytes(
        ["mensalidade", "estado", "data", "forma", "valor", "referencia", "observacoes", "registado_em"],
        [
            [
                month_label(row.get("mensalidade")),
                payment_status_label(row.get("estado")),
                row.get("data", ""),
                payment_method_label(row.get("forma")),
                row.get("valor", ""),
                row.get("referencia", ""),
                row.get("observacoes", ""),
                row.get("registado_em", ""),
            ]
            for row in pagamentos
        ],
    )


def historico_csv_bytes(historico):
    return csv_bytes(
        ["data", "utilizador", "acao", "area", "alvo_id", "detalhes"],
        [
            [
                row.get("created_at", ""),
                row.get("utilizador_nome", ""),
                row.get("acao", ""),
                row.get("alvo_tipo", ""),
                row.get("alvo_id", ""),
                row.get("detalhes", ""),
            ]
            for row in historico
        ],
    )


def indice_csv_bytes(rows):
    return csv_bytes(
        ["id", "nome", "estado", "telefone", "email", "created_at", "updated_at"],
        [
            [
                row.get("id", ""),
                row.get("nome", ""),
                row.get("estado", ""),
                row.get("telefone", ""),
                row.get("email", ""),
                row.get("created_at", ""),
                row.get("updated_at", ""),
            ]
            for row in rows
        ],
    )


def build_utentes_backup_zip():
    rows = [row_dict(row) for row in fetch_utentes()]
    exported_at = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "README.txt",
            (
                "Backup de utentes MenteMovimento\n"
                f"Exportado em: {now()}\n\n"
                "Cada pasta contem dados-gerais.json, ficha-completa.html, pagamentos.csv, historico.csv e anexos/.\n"
                "Este ficheiro contem dados pessoais e deve ser guardado apenas em local privado e protegido.\n"
            ),
        )
        archive.writestr("indice.csv", indice_csv_bytes(rows))
        used_folders = set()
        for utente in rows:
            base_folder = f"{int(utente['id']):04d}_{safe_zip_segment(utente.get('nome'), 'utente')}"
            folder = base_folder
            counter = 2
            while folder in used_folders:
                folder = f"{base_folder}_{counter}"
                counter += 1
            used_folders.add(folder)

            payload = build_utente_backup_payload(utente)
            archive.writestr(
                f"{folder}/dados-gerais.json",
                json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"),
            )
            archive.writestr(f"{folder}/ficha-completa.html", render_utente_backup_html(payload))
            archive.writestr(f"{folder}/pagamentos.csv", pagamentos_csv_bytes(payload["pagamentos"]))
            archive.writestr(f"{folder}/historico.csv", historico_csv_bytes(payload["historico"]))
            archive.writestr(f"{folder}/anexos/.keep", b"")

            for attachment in payload["anexos"]:
                pdf_data = read_pdf_attachment_bytes(attachment)
                filename = safe_filename(attachment.get("original_name") or attachment.get("stored_name") or "anexo.pdf")
                archive.writestr(f"{folder}/anexos/{attachment.get('id')}_{filename}", pdf_data)
    buffer.seek(0)
    return f"backup-utentes-{exported_at}.zip", buffer.getvalue()


def read_post(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length).decode("utf-8")
    return parse_qs(raw, keep_blank_values=True)


def read_multipart(handler):
    content_type = handler.headers.get("Content-Type", "")
    if "multipart/form-data" not in content_type:
        raise ValueError("Pedido inválido.")
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length)
    message = BytesParser(policy=policy.default).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + raw
    )
    fields = {}
    files = {}
    for part in message.iter_parts():
        if part.get_content_disposition() != "form-data":
            continue
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue
        filename = part.get_filename()
        payload = part.get_payload(decode=True) or b""
        if filename:
            files[name] = {"filename": filename, "content": payload}
        else:
            fields.setdefault(name, []).append(payload.decode("utf-8", errors="replace"))
    return fields, files


def save_utente(data, utente_id=None):
    nome = field_value(data, "nome")
    if not nome:
        raise ValueError("O nome completo é obrigatório.")

    values = {
        "nome": nome,
        "data_nascimento": "",
        "telefone": "",
        "email": "",
        "morada": "",
        "numero_utente": "",
        "nif": "",
        "contacto_emergencia": "",
        "estado": "Ativo",
        "observacoes": "",
        "updated_at": now(),
    }

    if supabase_available():
        if utente_id:
            table_update("utentes", {"id": f"eq.{utente_id}"}, values)
        else:
            table_insert("utentes", {**values, "created_at": now()})
        return

    with get_connection() as conn:
        if utente_id:
            conn.execute(
                """
                UPDATE utentes
                SET nome = :nome,
                    data_nascimento = :data_nascimento,
                    telefone = :telefone,
                    email = :email,
                    morada = :morada,
                    numero_utente = :numero_utente,
                    nif = :nif,
                    contacto_emergencia = :contacto_emergencia,
                    estado = :estado,
                    observacoes = :observacoes,
                    updated_at = :updated_at
                WHERE id = :id
                """,
                {**values, "id": utente_id},
            )
        else:
            conn.execute(
                """
                INSERT INTO utentes (
                    nome,
                    data_nascimento,
                    telefone,
                    email,
                    morada,
                    numero_utente,
                    nif,
                    contacto_emergencia,
                    estado,
                    observacoes,
                    created_at,
                    updated_at
                )
                VALUES (
                    :nome,
                    :data_nascimento,
                    :telefone,
                    :email,
                    :morada,
                    :numero_utente,
                    :nif,
                    :contacto_emergencia,
                    :estado,
                    :observacoes,
                    :created_at,
                    :updated_at
                )
                """,
                {**values, "created_at": now()},
            )


def toggle_utente_status(utente_id):
    utente = get_utente(utente_id)
    if not utente:
        return None, None
    current_status = utente["estado"] or "Ativo"
    next_status = "Inativo" if current_status == "Ativo" else "Ativo"
    timestamp = now()
    if supabase_available():
        table_update("utentes", {"id": f"eq.{utente_id}"}, {"estado": next_status, "updated_at": timestamp})
    else:
        with get_connection() as conn:
            conn.execute(
                "UPDATE utentes SET estado = ?, updated_at = ? WHERE id = ?",
                (next_status, timestamp, utente_id),
            )
    return utente, next_status


def normalize_perfil(perfil):
    return PERFIL_ADMIN if perfil == PERFIL_ADMIN else PERFIL_UTILIZADOR


def list_users():
    if supabase_available():
        return table_select("utilizadores", {"select": "*", "order": "nome.asc"})
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM utilizadores ORDER BY nome COLLATE NOCASE"
        ).fetchall()


def active_admin_count(exclude_user_id=None):
    if supabase_available():
        query = {"select": "id", "perfil": f"eq.{PERFIL_ADMIN}", "ativo": "eq.1"}
        if exclude_user_id:
            query["id"] = f"neq.{exclude_user_id}"
        return len(table_select("utilizadores", query))
    query = "SELECT COUNT(*) AS total FROM utilizadores WHERE perfil = ? AND ativo = 1"
    params = [PERFIL_ADMIN]
    if exclude_user_id:
        query += " AND id <> ?"
        params.append(exclude_user_id)
    with get_connection() as conn:
        return conn.execute(query, params).fetchone()["total"]


def create_user(data):
    nome = field_value(data, "nome")
    email = field_value(data, "email").lower()
    password = field_value(data, "password")
    perfil = normalize_perfil(field_value(data, "perfil"))
    if not nome or not email or not password:
        raise ValueError("Nome, email e password são obrigatórios.")
    timestamp = now()
    if supabase_available():
        if get_user_by_email(email):
            raise ValueError("Já existe um utilizador com esse email.")
        row = table_insert(
            "utilizadores",
            {
                "nome": nome,
                "email": email,
                "password_hash": hash_password(password),
                "perfil": perfil,
                "ativo": 1,
                "tema": "escuro",
                "idioma": "pt",
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )
        return row["id"]
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO utilizadores (nome, email, password_hash, perfil, ativo, tema, idioma, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, 'escuro', 'pt', ?, ?)
                """,
                (nome, email, hash_password(password), perfil, timestamp, timestamp),
            )
        except sqlite3.IntegrityError:
            raise ValueError("Já existe um utilizador com esse email.")
    return cursor.lastrowid


def update_user(data):
    user_id = field_value(data, "id")
    if not user_id.isdigit():
        raise ValueError("Escolha um utilizador para editar.")
    user_id = int(user_id)
    current = get_user_by_id(user_id)
    if not current:
        raise ValueError("Utilizador não encontrado.")

    nome = field_value(data, "nome")
    email = field_value(data, "email").lower()
    password = field_value(data, "password")
    perfil = normalize_perfil(field_value(data, "perfil"))
    ativo = 1 if field_value(data, "ativo") == "on" else 0
    if not nome or not email:
        raise ValueError("Nome e email são obrigatórios.")
    if current["perfil"] == PERFIL_ADMIN and (perfil != PERFIL_ADMIN or not ativo) and active_admin_count(user_id) == 0:
        raise ValueError("Não pode remover ou desativar o último administrador ativo.")

    timestamp = now()
    if supabase_available():
        existing = get_user_by_email(email)
        if existing and int(existing["id"]) != user_id:
            raise ValueError("Já existe um utilizador com esse email.")
        values = {
            "nome": nome,
            "email": email,
            "perfil": perfil,
            "ativo": ativo,
            "updated_at": timestamp,
        }
        if password:
            values["password_hash"] = hash_password(password)
        table_update("utilizadores", {"id": f"eq.{user_id}"}, values)
        return user_id
    with get_connection() as conn:
        try:
            if password:
                conn.execute(
                    """
                    UPDATE utilizadores
                    SET nome = ?, email = ?, password_hash = ?, perfil = ?, ativo = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (nome, email, hash_password(password), perfil, ativo, timestamp, user_id),
                )
            else:
                conn.execute(
                    """
                    UPDATE utilizadores
                    SET nome = ?, email = ?, perfil = ?, ativo = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (nome, email, perfil, ativo, timestamp, user_id),
                )
        except sqlite3.IntegrityError:
            raise ValueError("Já existe um utilizador com esse email.")
    return user_id


def delete_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return
    if user["perfil"] == PERFIL_ADMIN and active_admin_count(user_id) == 0:
        raise ValueError("Não pode eliminar o último administrador ativo.")
    if supabase_available():
        table_delete("sessoes", {"utilizador_id": f"eq.{user_id}"})
        table_delete("utilizadores", {"id": f"eq.{user_id}"})
        return
    with get_connection() as conn:
        conn.execute("DELETE FROM sessoes WHERE utilizador_id = ?", (user_id,))
        conn.execute("DELETE FROM utilizadores WHERE id = ?", (user_id,))


def toggle_user_active(user_id):
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("Utilizador não encontrado.")
    next_active = 0 if int(user["ativo"] or 0) else 1
    if user["perfil"] == PERFIL_ADMIN and not next_active and active_admin_count(user_id) == 0:
        raise ValueError("Não pode remover ou desativar o último administrador ativo.")
    if supabase_available():
        table_update("utilizadores", {"id": f"eq.{user_id}"}, {"ativo": next_active, "updated_at": now()})
        return
    with get_connection() as conn:
        conn.execute("UPDATE utilizadores SET ativo = ?, updated_at = ? WHERE id = ?", (next_active, now(), user_id))


def toggle_theme(user):
    next_theme = "claro" if user.get("tema") == "escuro" else "escuro"
    if supabase_available():
        table_update("utilizadores", {"id": f"eq.{user['id']}"}, {"tema": next_theme, "updated_at": now()})
        user["tema"] = next_theme
        return next_theme
    with get_connection() as conn:
        conn.execute("UPDATE utilizadores SET tema = ?, updated_at = ? WHERE id = ?", (next_theme, now(), user["id"]))
    user["tema"] = next_theme
    return next_theme


def update_language(user, language):
    language = normalize_language(language)
    if supabase_available():
        table_update("utilizadores", {"id": f"eq.{user['id']}"}, {"idioma": language, "updated_at": now()})
        user["idioma"] = language
        return language
    with get_connection() as conn:
        conn.execute("UPDATE utilizadores SET idioma = ?, updated_at = ? WHERE id = ?", (language, now(), user["id"]))
    user["idioma"] = language
    return language


def render_user_manager(current_user, edit_user_id="", error="", notice=""):
    users = list_users()
    selected = get_user_by_id(int(edit_user_id)) if str(edit_user_id).isdigit() else None
    error_html = f'<div class="notice">{esc(error)}</div>' if error else ""
    rows_html = ""
    for user in users:
        status_class = "status active" if user["ativo"] else "status blocked"
        status_text = "Ativo" if user["ativo"] else "Inativo"
        rows_html += f"""
        <tr>
            <td>
                <div class="name">{esc(user["nome"])}</div>
                <div class="muted">{esc(user["email"])}</div>
            </td>
            <td>{esc(user["perfil"])}</td>
            <td><span class="{status_class}">{status_text}</span></td>
            <td class="actions-cell">
                <div class="row-actions">
                    <a class="button secondary icon-button" href="/utilizadores?edit_user_id={user["id"]}" aria-label="Editar utilizador" title="Editar utilizador">
                        {PENCIL_ICON}
                    </a>
                    <form method="post" action="/utilizadores/eliminar" onsubmit="return confirm('Eliminar este utilizador?');">
                        <input type="hidden" name="id" value="{user["id"]}">
                        <button class="button danger icon-button" type="submit" aria-label="Eliminar utilizador" title="Eliminar utilizador">
                            {TRASH_ICON}
                        </button>
                    </form>
                </div>
            </td>
        </tr>
        """

    edit_id = selected["id"] if selected else ""
    edit_nome = selected["nome"] if selected else ""
    edit_email = selected["email"] if selected else ""
    edit_perfil = selected["perfil"] if selected else PERFIL_UTILIZADOR
    edit_checked = "checked" if not selected or selected["ativo"] else ""
    disabled = "" if selected else "disabled"

    content = f"""
<div class="manager-head">
    <div>
        <h2>{esc(tr(current_user, "user_manager"))}</h2>
        <p class="muted">Crie acessos novos e edite permissões de utilizadores existentes.</p>
    </div>
    <div class="title-actions">
        <a class="button secondary" href="/utilizadores">Atualizar</a>
        <a class="button secondary" href="/">Fechar</a>
    </div>
</div>
{error_html}
<section class="panel manager-grid">
    <form class="manager-column" method="post" action="/utilizadores/criar">
        <h3>Criar utilizador</h3>
        <p class="muted">O acesso fica disponível de imediato.</p>
        <div class="field">
            <label for="create_nome">Nome</label>
            <input id="create_nome" name="nome" required>
        </div>
        <div class="field">
            <label for="create_email">Email</label>
            <input id="create_email" name="email" type="email" required>
        </div>
        <div class="field">
            <label for="create_password">Password</label>
            <input id="create_password" name="password" type="password" required>
        </div>
        <div class="field">
            <label for="create_perfil">Cargo</label>
            <select id="create_perfil" name="perfil">
                <option value="{PERFIL_ADMIN}">{PERFIL_ADMIN}</option>
                <option value="{PERFIL_UTILIZADOR}">{PERFIL_UTILIZADOR}</option>
            </select>
        </div>
        <div class="actions">
            <button class="button" type="submit">Criar utilizador</button>
        </div>
    </form>
    <form class="manager-column" method="post" action="/utilizadores/editar">
        <h3>Editar utilizador</h3>
        <p class="muted">Escolha um utilizador na lista para editar.</p>
        <input type="hidden" name="id" value="{esc(edit_id)}">
        <div class="field">
            <label for="edit_nome">Nome</label>
            <input id="edit_nome" name="nome" value="{esc(edit_nome)}" {disabled}>
        </div>
        <div class="field">
            <label for="edit_email">Email</label>
            <input id="edit_email" name="email" type="email" value="{esc(edit_email)}" {disabled}>
        </div>
        <div class="field">
            <label for="edit_password">Nova password</label>
            <input id="edit_password" name="password" type="password" placeholder="Deixe em branco para manter" {disabled}>
        </div>
        <div class="field">
            <label for="edit_perfil">Cargo</label>
            <select id="edit_perfil" name="perfil" {disabled}>
                <option value="{PERFIL_ADMIN}" {"selected" if edit_perfil == PERFIL_ADMIN else ""}>{PERFIL_ADMIN}</option>
                <option value="{PERFIL_UTILIZADOR}" {"selected" if edit_perfil == PERFIL_UTILIZADOR else ""}>{PERFIL_UTILIZADOR}</option>
            </select>
        </div>
        <label class="field checkbox-row">
            <input name="ativo" type="checkbox" {edit_checked} {disabled}>
            Ativo
        </label>
        <div class="actions">
            <a class="button secondary" href="/utilizadores">Limpar</a>
            <button class="button" type="submit" {disabled}>Guardar alterações</button>
        </div>
    </form>
</section>
<section class="panel table-wrap">
    <table>
        <thead>
            <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Estado</th>
                <th class="actions-cell">Ações</th>
            </tr>
        </thead>
        <tbody>{rows_html}</tbody>
    </table>
</section>
"""
    return render_page(tr(current_user, "user_manager"), content, notice=notice, current_user=current_user)


def render_history_page(current_user):
    if supabase_available():
        rows = table_select("historico", {"select": "*", "order": "created_at.desc", "limit": "200"})
    else:
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM historico
                ORDER BY created_at DESC
                LIMIT 200
                """
            ).fetchall()
    rows_html = ""
    for row in rows:
        rows_html += f"""
        <tr>
            <td>{esc(row["created_at"])}</td>
            <td>{esc(row["utilizador_nome"])}</td>
            <td>{esc(row["acao"])}</td>
            <td>{esc(history_target_label(row["alvo_tipo"], current_user))}</td>
            <td>{esc(row["detalhes"])}</td>
        </tr>
        """
    if not rows:
        rows_html = '<tr><td colspan="5"><div class="empty">Ainda não existem alterações registadas.</div></td></tr>'
    content = f"""
<div class="manager-head">
    <div>
        <h2>Histórico de alterações</h2>
        <p class="muted">Veja quem fez alterações, o que fez e quando fez.</p>
    </div>
    <a class="button secondary" href="/">{esc(tr(current_user, "back"))}</a>
</div>
<section class="panel table-wrap">
    <table>
        <thead>
            <tr>
                <th>Quando</th>
                <th>Quem</th>
                <th>Ação</th>
                <th>Área</th>
                <th>Detalhes</th>
            </tr>
        </thead>
        <tbody>{rows_html}</tbody>
    </table>
</section>
"""
    return render_page("Histórico", content, current_user=current_user)


def render_placeholder_page(current_user, title, message):
    content = f"""
<div class="manager-head">
    <div>
        <h2>{esc(title)}</h2>
        <p class="muted">{esc(message)}</p>
    </div>
    <a class="button secondary" href="/">Voltar</a>
</div>
<section class="panel form-panel">
    <p class="muted">{esc(tr(current_user, "placeholder_text"))}</p>
</section>
"""
    return render_page(title, content, current_user=current_user)


def render_manual_page(current_user):
    back_label = esc(tr(current_user, "back"))
    if user_language(current_user) == "en":
        title = "Manuals"
        subtitle = "Choose the guide you want to open."
        user_title = "User manual"
        user_description = "Guide for daily use of the site: login, clients, tabs, saving, PDFs, history, theme and language."
        developer_title = "Developer manual"
        developer_description = "Technical guide for maintaining the code, GitHub, Supabase, Vercel, environment variables, deploys and safe changes."
        open_label = "Open manual"
    else:
        title = "Manuais"
        subtitle = "Escolha o guia que pretende abrir."
        user_title = "Manual de utilizador"
        user_description = "Guia para o uso diário do site: login, utentes, separadores, gravação, PDFs, histórico, tema e idioma."
        developer_title = "Manual de desenvolvedor"
        developer_description = "Guia técnico para manutenção do código, GitHub, Supabase, Vercel, variáveis de ambiente, deploys e alterações seguras."
        open_label = "Abrir manual"
    content = f"""
<div class="manager-head">
    <div>
        <h2>{esc(title)}</h2>
        <p class="muted">{esc(subtitle)}</p>
    </div>
    <a class="button secondary" href="/">{back_label}</a>
</div>
<section class="manual-choice-grid">
    <a class="manual-choice-card" href="/manual/utilizador">
        <h3>{esc(user_title)}</h3>
        <p>{esc(user_description)}</p>
        <span class="button secondary">{esc(open_label)}</span>
    </a>
    <a class="manual-choice-card" href="/manual/desenvolvedor">
        <h3>{esc(developer_title)}</h3>
        <p>{esc(developer_description)}</p>
        <span class="button secondary">{esc(open_label)}</span>
    </a>
</section>
"""
    return render_page(title, content, current_user=current_user)


def render_user_manual_page(current_user):
    back_label = esc(tr(current_user, "back"))
    if user_language(current_user) == "en":
        content = f"""
<div class="manager-head">
    <div>
        <h2>Manual</h2>
        <p class="muted">Complete guide to using the MenteMovimento client database.</p>
    </div>
    <a class="button secondary" href="/">{back_label}</a>
</div>
<section class="panel form-panel manual-page" data-no-translate="1">
    <div class="manual-section">
        <h3>1. Access and roles</h3>
        <p>The site is protected by login credentials. Each user has a role that controls what they can do.</p>
        <ul class="manual-list">
            <li><strong>Administrator:</strong> can create, edit, view and delete clients, manage users, see the change history, change theme and language, and attach or remove PDFs.</li>
            <li><strong>User:</strong> can sign in and view client information, but cannot create, edit, delete or change records.</li>
            <li>Use the sign-out button in the top bar to return to the login screen.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>2. Main screen</h3>
        <p>The main screen lists all clients and gives access to the main actions.</p>
        <ul class="manual-list">
            <li>Use the search box to find a client by name.</li>
            <li>The eye button opens read-only view mode.</li>
            <li>The pencil button opens edit mode. It is available only to administrators.</li>
            <li>The trash button deletes a client. It is available only to administrators and should be used with care.</li>
            <li>The “New client” button creates a new client record with the name as the initial required field.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>3. Editing and saving</h3>
        <p>Each client has several tabs with structured forms. Administrators can edit the fields and save the whole record.</p>
        <ul class="manual-list">
            <li>The “Back” button returns to the main screen.</li>
            <li>The “Save” button saves the current client and returns to the main screen.</li>
            <li>When switching between tabs, the current tab is saved in the background, so information is not lost while filling several tabs.</li>
            <li>Shared fields such as name, date of birth, process number, phone and health problems are synchronized between tabs when they represent the same information.</li>
        </ul>
        <div class="manual-note">Only real client data typed into the forms is kept as data. Interface language changes do not translate client names or clinical notes already written by users.</div>
    </div>

    <div class="manual-section">
        <h3>4. Client tabs</h3>
        <ul class="manual-list">
            <li><strong>Referral Form:</strong> identification, referring entity, clinical information, treatment context, health problems, risk assessment, referral reasons and medication table.</li>
            <li><strong>Emergency Information:</strong> emergency contact, health identification, medical contacts, allergies, observations and health problems synchronized with the referral form.</li>
            <li><strong>Registration Form and Initial Requirements Assessment:</strong> request, preferred services, admissibility questions and requirements weighting table.</li>
            <li><strong>Multidisciplinary Diagnostic Assessment:</strong> socio-demographic data, education, work, economic and housing situation, family/social network, genogram, ecomap, health, routine and IADL assessment.</li>
            <li><strong>Service and Follow-up Records:</strong> one structured intervention record with date, scope, type, intervention description, recommendations and professionals involved.</li>
            <li><strong>Data Protection and Responsibility Terms:</strong> area for attaching scanned PDF documents for that specific client.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>5. Genogram and ecomap</h3>
        <p>The diagnostic assessment includes visual tools for family and network mapping.</p>
        <ul class="manual-list">
            <li>Use the diagram buttons to add people, family members, systems or networks.</li>
            <li>Select two elements and choose a relationship type to connect them.</li>
            <li>Use the legend beside each diagram to understand the meaning of shapes, lines, arrows and relationship types.</li>
            <li>Use notes to record extra context that cannot be represented only by the diagram.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>6. PDF attachments</h3>
        <p>The Data Protection and Responsibility Terms tab stores scanned PDF documents.</p>
        <ul class="manual-list">
            <li>Each client has their own PDFs. Attachments are not shared between clients.</li>
            <li>Only PDF files are accepted.</li>
            <li>Administrators can attach, open and remove PDFs.</li>
            <li>View-only users can open PDFs but cannot add or remove them.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>7. Client backup</h3>
        <p>The backup downloads a ZIP file with CSV copies and supporting files. The button is visible only to accounts allowed to export and view sensitive data.</p>
        <ul class="manual-list">
            <li>On the main client list, choose <strong>Export clients backup</strong>.</li>
            <li>Save the <code>backup-utentes-YYYY-MM-DD_HH-MM-SS.zip</code> file in a protected folder named with the date.</li>
            <li>Open the ZIP and check <code>indice.csv</code>, which summarises the exported clients.</li>
            <li>For each client, use <code>pagamentos.csv</code> and <code>historico.csv</code> when payment or history data is needed in CSV format.</li>
            <li>Keep the ZIP only in authorised locations because it may contain personal data, health information, history and attachments.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>8. User management</h3>
        <p>The User Manager is available only to administrators.</p>
        <ul class="manual-list">
            <li>Create users by entering name, email, password and role.</li>
            <li>Edit an existing user by selecting them from the list.</li>
            <li>Roles are Administrator and User.</li>
            <li>A user can be marked active or inactive.</li>
            <li>The system prevents removing or deactivating the last active administrator.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>9. History, theme and language</h3>
        <ul class="manual-list">
            <li><strong>Change history:</strong> shows who changed something, what was changed and when it happened.</li>
            <li><strong>Dark/Light:</strong> changes the visual theme for the current account.</li>
            <li><strong>Change language:</strong> switches the interface between Portuguese and English for the current account.</li>
            <li><strong>Manual:</strong> opens this guide.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>10. Good practices</h3>
        <ul class="manual-list">
            <li>Search for the client before creating a new record to avoid duplicates.</li>
            <li>Review synchronized fields when changing names, dates of birth or process numbers.</li>
            <li>Attach only final scanned PDFs in the protection/terms tab.</li>
            <li>Use the view button when you only need to consult information.</li>
            <li>Sign out when you finish using the site, especially on shared computers.</li>
        </ul>
    </div>
</section>
"""
    else:
        content = f"""
<div class="manager-head">
    <div>
        <h2>Manual</h2>
        <p class="muted">Guia completo de utilização da base de dados de utentes MenteMovimento.</p>
    </div>
    <a class="button secondary" href="/">{back_label}</a>
</div>
<section class="panel form-panel manual-page">
    <div class="manual-section">
        <h3>1. Acesso e cargos</h3>
        <p>O site está protegido por credenciais de entrada. Cada utilizador tem um cargo que define o que pode fazer.</p>
        <ul class="manual-list">
            <li><strong>Administrador:</strong> pode criar, editar, ver e eliminar utentes, gerir utilizadores, consultar histórico, mudar tema e idioma, e anexar ou remover PDFs.</li>
            <li><strong>Utilizador:</strong> pode entrar e consultar a informação dos utentes, mas não pode criar, editar, eliminar ou alterar registos.</li>
            <li>Use o botão de sair na barra superior para voltar à tela de login.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>2. Tela principal</h3>
        <p>A tela principal mostra a lista de utentes e dá acesso às ações principais.</p>
        <ul class="manual-list">
            <li>Use a pesquisa para encontrar um utente pelo nome.</li>
            <li>O botão com o olho abre o modo de consulta, sem edição.</li>
            <li>O botão com o lápis abre o modo de edição. Só aparece para administradores.</li>
            <li>O botão do caixote do lixo elimina o utente. Só aparece para administradores e deve ser usado com cuidado.</li>
            <li>O botão “Novo utente” cria uma nova ficha, começando pelo nome.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>3. Editar e guardar</h3>
        <p>Cada utente tem vários separadores com formulários próprios. Os administradores podem preencher e guardar a ficha completa.</p>
        <ul class="manual-list">
            <li>O botão “Voltar” regressa à tela principal.</li>
            <li>O botão “Guardar” guarda o utente e volta à tela principal.</li>
            <li>Ao trocar de separador, o separador atual é guardado em segundo plano para não perder informação enquanto preenche vários formulários.</li>
            <li>Campos partilhados como nome, data de nascimento, número de processo, contacto telefónico e problemas de saúde são interligados entre separadores quando representam a mesma informação.</li>
        </ul>
        <div class="manual-note">Os dados escritos nas fichas dos utentes mantêm-se exatamente como foram introduzidos. Mudar o idioma da interface não traduz nomes, notas clínicas ou texto livre já registado.</div>
    </div>

    <div class="manual-section">
        <h3>4. Separadores do utente</h3>
        <ul class="manual-list">
            <li><strong>Formulário de Referenciação:</strong> identificação, entidade de encaminhamento, informação clínica, tratamento, problemas de saúde, avaliação de risco, motivo do encaminhamento e tabela de medicação.</li>
            <li><strong>Informações em Caso de Emergência:</strong> contacto de urgência, dados de saúde, contactos médicos, alergias, observações e problemas de saúde interligados com o formulário de referenciação.</li>
            <li><strong>Ficha de Inscrição e Avaliação Inicial de Requisitos:</strong> pedido, serviços pretendidos, admissibilidade e tabela de ponderação dos requisitos.</li>
            <li><strong>Avaliação Diagnóstica Multidisciplinar:</strong> dados sociodemográficos, escolaridade, trabalho, situação económica e habitacional, rede familiar/social, genograma, ecomapa, saúde, rotina e avaliação de AVDI.</li>
            <li><strong>Registo de Atendimentos e Acompanhamentos:</strong> registo estruturado de intervenção com data, âmbito, tipo, descrição, recomendações e profissionais envolvidos.</li>
            <li><strong>Proteção de dados e Termos de Responsabilidade:</strong> zona para anexar PDFs digitalizados desse utente específico.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>5. Genograma e ecomapa</h3>
        <p>A avaliação diagnóstica inclui ferramentas visuais para mapear família e rede de apoio.</p>
        <ul class="manual-list">
            <li>Use os botões do diagrama para adicionar pessoas, familiares, sistemas ou redes.</li>
            <li>Selecione dois elementos e escolha o tipo de relação para os ligar.</li>
            <li>Use a legenda ao lado de cada diagrama para perceber formas, linhas, setas e tipos de relação.</li>
            <li>Use as notas para registar contexto adicional que não caiba apenas no esquema.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>6. Anexos PDF</h3>
        <p>O separador Proteção de dados e Termos de Responsabilidade guarda documentos digitalizados em PDF.</p>
        <ul class="manual-list">
            <li>Cada utente tem os seus próprios PDFs. Os anexos não são gerais nem são partilhados entre utentes.</li>
            <li>Só são aceites ficheiros PDF.</li>
            <li>Administradores podem anexar, abrir e remover PDFs.</li>
            <li>Utilizadores em modo de consulta podem abrir PDFs, mas não podem adicionar nem remover.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>7. Backup de utentes</h3>
        <p>O backup descarrega um ficheiro ZIP com cópias em CSV e outros ficheiros de consulta. O botão só aparece a contas com permissão para exportar e ver dados sensíveis.</p>
        <ul class="manual-list">
            <li>Na lista principal de utentes, clique em <strong>Exportar backup de utentes</strong>.</li>
            <li>Guarde o ficheiro <code>backup-utentes-AAAA-MM-DD_HH-MM-SS.zip</code> numa pasta segura e identificada pela data.</li>
            <li>Abra o ZIP e confirme o ficheiro <code>indice.csv</code>, que resume os utentes exportados.</li>
            <li>Dentro da pasta de cada utente, use <code>pagamentos.csv</code> e <code>historico.csv</code> quando precisar de consultar pagamentos ou histórico em CSV.</li>
            <li>Mantenha o ZIP apenas em locais autorizados, porque pode conter dados pessoais, informação clínica, histórico e anexos.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>8. Gestão de utilizadores</h3>
        <p>O Gestor de Utilizadores está disponível apenas para administradores.</p>
        <ul class="manual-list">
            <li>Crie utilizadores preenchendo nome, email, password e cargo.</li>
            <li>Edite um utilizador existente escolhendo-o na lista.</li>
            <li>Os cargos disponíveis são Administrador e Utilizador.</li>
            <li>Um utilizador pode estar ativo ou inativo.</li>
            <li>O sistema impede remover ou desativar o último administrador ativo.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>9. Histórico, tema e idioma</h3>
        <ul class="manual-list">
            <li><strong>Histórico de alterações:</strong> mostra quem fez alterações, o que fez e quando fez.</li>
            <li><strong>Escuro/Claro:</strong> muda o tema visual da conta atual.</li>
            <li><strong>Mudar idioma:</strong> alterna a interface entre Português e Inglês para a conta atual.</li>
            <li><strong>Manual:</strong> abre este guia.</li>
        </ul>
    </div>

    <div class="manual-section">
        <h3>10. Boas práticas</h3>
        <ul class="manual-list">
            <li>Pesquise o utente antes de criar uma ficha nova para evitar duplicados.</li>
            <li>Confirme os campos interligados quando alterar nomes, datas de nascimento ou números de processo.</li>
            <li>Anexe apenas PDFs digitalizados finais no separador de proteção/termos.</li>
            <li>Use o botão de consulta quando só precisa de ver informação.</li>
            <li>Saia da conta quando terminar, sobretudo em computadores partilhados.</li>
        </ul>
    </div>
</section>
"""
    return render_page(tr(current_user, "manual"), content, current_user=current_user)


def markdown_inline(text):
    escaped = esc(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(
        r"(https://[^\s<]+)",
        lambda match: f'<a href="{match.group(1)}" target="_blank" rel="noopener">{match.group(1)}</a>',
        escaped,
    )
    return escaped


def markdown_to_manual_html(markdown_text):
    html_parts = []
    in_code = False
    code_lines = []
    list_type = None

    def close_list():
        nonlocal list_type
        if list_type:
            html_parts.append(f"</{list_type}>")
            list_type = None

    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code:
                html_parts.append(f"<pre><code>{esc(chr(10).join(code_lines))}</code></pre>")
                code_lines = []
                in_code = False
            else:
                close_list()
                in_code = True
                code_lines = []
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not stripped:
            close_list()
            continue
        if stripped.startswith("#"):
            close_list()
            level = len(stripped) - len(stripped.lstrip("#"))
            text = stripped[level:].strip()
            tag = "h3" if level <= 1 else "h4" if level == 2 else "h5"
            html_parts.append(f"<{tag}>{markdown_inline(text)}</{tag}>")
            continue
        ordered = re.match(r"^\d+\.\s+(.*)$", stripped)
        if ordered:
            if list_type != "ol":
                close_list()
                html_parts.append('<ol class="manual-list">')
                list_type = "ol"
            html_parts.append(f"<li>{markdown_inline(ordered.group(1))}</li>")
            continue
        if stripped.startswith("- "):
            if list_type != "ul":
                close_list()
                html_parts.append('<ul class="manual-list">')
                list_type = "ul"
            html_parts.append(f"<li>{markdown_inline(stripped[2:].strip())}</li>")
            continue
        close_list()
        html_parts.append(f"<p>{markdown_inline(stripped)}</p>")

    if in_code:
        html_parts.append(f"<pre><code>{esc(chr(10).join(code_lines))}</code></pre>")
    close_list()
    return "\n".join(html_parts)


def render_developer_manual_page(current_user):
    back_label = esc(tr(current_user, "back"))
    manual_path = os.path.join(BASE_DIR, "MANUAL_DESENVOLVEDOR.md")
    try:
        with open(manual_path, "r", encoding="utf-8") as manual_file:
            manual_text = manual_file.read()
    except OSError:
        manual_text = "# Manual do Desenvolvedor\n\nO ficheiro MANUAL_DESENVOLVEDOR.md não foi encontrado."
    if user_language(current_user) == "en":
        title = "Developer manual"
        subtitle = "Technical guide for maintaining code, GitHub, Supabase and Vercel."
    else:
        title = "Manual de desenvolvedor"
        subtitle = "Guia técnico para manutenção do código, GitHub, Supabase e Vercel."
    content = f"""
<div class="manager-head">
    <div>
        <h2>{esc(title)}</h2>
        <p class="muted">{esc(subtitle)}</p>
    </div>
    <a class="button secondary" href="/manual">{back_label}</a>
</div>
<section class="panel form-panel manual-page" data-no-translate="1">
    {markdown_to_manual_html(manual_text)}
</section>
"""
    return render_page(title, content, current_user=current_user)


def render_language_page(current_user, notice=""):
    active = user_language(current_user)
    options = [
        ("pt", "&#127477;&#127481;", tr(current_user, "portuguese")),
        ("en", "&#127468;&#127463;", tr(current_user, "english")),
    ]
    option_html = ""
    for value, flag, label in options:
        checked = "checked" if active == value else ""
        active_text = f"<span class='status active'>{esc(tr(current_user, 'active_language'))}</span>" if active == value else ""
        option_html += f"""
        <label class="language-option">
            <input type="radio" name="idioma" value="{value}" {checked}>
            <span class="language-flag" aria-hidden="true">{flag}</span>
            <span class="language-label">{esc(label)}</span>
            {active_text}
        </label>
        """
    content = f"""
<div class="manager-head">
    <div>
        <h2>{esc(tr(current_user, "language_title"))}</h2>
        <p class="muted">{esc(tr(current_user, "language_help"))}</p>
    </div>
    <a class="button secondary" href="/">{esc(tr(current_user, "back"))}</a>
</div>
<form class="panel form-panel" method="post" action="/idioma">
    <div class="language-options">
        {option_html}
    </div>
    <div class="actions">
        <button class="button" type="submit">{esc(tr(current_user, "apply_language"))}</button>
    </div>
</form>
"""
    return render_page(tr(current_user, "language_title"), content, notice=notice, current_user=current_user)


def render_manual_choice_dialog(current_user):
    if user_language(current_user) == "en":
        title = "Manual"
        subtitle = "Choose the right manual for what you need to check."
        user_title = "User manual"
        user_description = "For daily use: login, service users, tabs, PDF attachments, history, theme and language."
        developer_title = "Programmer manual"
        developer_description = "For maintaining the project: code, GitHub, Supabase, Vercel, publication and safe changes."
        close_label = "Close"
        user_href = "/docs/Manual_User_Utentes.pdf"
        developer_href = "/docs/Manual_Programmer_Utentes.pdf"
    else:
        title = "Manual"
        subtitle = "Escolha o manual adequado ao que pretende consultar."
        user_title = "Manual do Utilizador"
        user_description = "Para quem usa a app no dia a dia: login, utentes, separadores, PDFs, historico, tema e idioma."
        developer_title = "Manual do Programador"
        developer_description = "Para quem mantem o projeto: ficheiros, GitHub, Vercel, Supabase, SQL, seguranca e atualizacoes."
        close_label = "Fechar"
        user_href = "/docs/Manual_Utilizador_Utentes.pdf"
        developer_href = "/docs/Manual_Programador_Utentes.pdf"
    return f"""
    <dialog class="manual-dialog" id="manualChoiceDialog">
        <section class="manual-dialog-panel" aria-label="{esc(title)}">
            <div class="manual-dialog-head">
                <div>
                    <h2>{esc(title)}</h2>
                    <p>{esc(subtitle)}</p>
                </div>
                <button class="central-icon-link" id="closeManualChoiceDialog" type="button" title="{esc(close_label)}" aria-label="{esc(close_label)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    <span>{esc(close_label)}</span>
                </button>
            </div>
            <div class="manual-dialog-options">
                <a class="manual-dialog-card" href="{esc(user_href)}" target="_blank" rel="noopener">
                    <span class="manual-dialog-icon" aria-hidden="true">{USER_PLUS_ICON}</span>
                    <span class="manual-dialog-copy">
                        <strong>{esc(user_title)}</strong>
                        <span>{esc(user_description)}</span>
                    </span>
                </a>
                <a class="manual-dialog-card" href="{esc(developer_href)}" target="_blank" rel="noopener">
                    <span class="manual-dialog-icon" aria-hidden="true">{CODE_ICON}</span>
                    <span class="manual-dialog-copy">
                        <strong>{esc(developer_title)}</strong>
                        <span>{esc(developer_description)}</span>
                    </span>
                </a>
            </div>
        </section>
    </dialog>
    """


def close_parent_dialog_button(label="Fechar"):
    return f"""
    <button class="button secondary icon-button" type="button" onclick="parent.document.getElementById('commonFrameDialog')?.close()" title="{esc(label)}" aria-label="{esc(label)}">
        {CLOSE_ICON}
    </button>
    """


def render_user_manager(current_user, edit_user_id="", error="", notice=""):
    users = list_users()
    selected = get_user_by_id(int(edit_user_id)) if str(edit_user_id).isdigit() else None
    message_html = f'<div class="notice">{esc(error)}</div>' if error else ""
    if notice:
        message_html += f'<div class="notice success">{esc(notice)}</div>'
    rows_html = ""
    for user in users:
        is_current = int(user["id"]) == int(current_user["id"])
        is_active = bool(user["ativo"])
        status_class = "status-pill is-active" if is_active else "status-pill is-inactive"
        status_text = "Ativo" if is_active else "Inativo"
        toggle_label = "Desativar utilizador" if is_active else "Ativar utilizador"
        toggle_icon = USER_X_ICON if is_active else USER_CHECK_ICON
        toggle_action = (
            '<span class="muted">Atual</span>'
            if is_current
            else f"""
            <form method="post" action="/utilizadores/alternar">
                <input type="hidden" name="id" value="{user["id"]}">
                <button class="button secondary icon-button" type="submit" aria-label="{esc(toggle_label)}" title="{esc(toggle_label)}">
                    {toggle_icon}
                </button>
            </form>
            """
        )
        delete_disabled = "disabled" if is_current else ""
        rows_html += f"""
        <tr>
            <td>
                <div class="name">{esc(user["nome"])}</div>
                <div class="muted">{esc(user["id"])}</div>
            </td>
            <td>{esc(user["email"])}</td>
            <td>{esc(user["perfil"])}</td>
            <td><span class="{status_class}">{esc(status_text)}</span></td>
            <td class="actions-cell">
                <div class="row-actions">
                    <a class="button secondary icon-button" href="/utilizadores?edit_user_id={user["id"]}" aria-label="Editar utilizador" title="Editar utilizador">
                        {PENCIL_ICON}
                    </a>
                    {toggle_action}
                    <form method="post" action="/utilizadores/eliminar" onsubmit="return confirm('Eliminar este utilizador?');">
                        <input type="hidden" name="id" value="{user["id"]}">
                        <button class="button danger icon-button" type="submit" {delete_disabled} aria-label="Eliminar utilizador" title="Eliminar utilizador">
                            {TRASH_ICON}
                        </button>
                    </form>
                </div>
            </td>
        </tr>
        """

    edit_id = selected["id"] if selected else ""
    edit_nome = selected["nome"] if selected else ""
    edit_email = selected["email"] if selected else ""
    edit_perfil = selected["perfil"] if selected else PERFIL_UTILIZADOR
    edit_checked = "checked" if not selected or selected["ativo"] else ""
    disabled = "" if selected else "disabled"

    content = f"""
<section class="utility-panel" aria-label="Utilizadores">
    <div class="utility-panel-head">
        <div>
            <h2>Utilizadores</h2>
            <p>Crie acessos novos e edite permissoes de utilizadores existentes.</p>
        </div>
        <div class="utility-head-actions">
            <a class="button secondary" href="/utilizadores">{REFRESH_ICON}<span>Atualizar</span></a>
            {close_parent_dialog_button("Fechar")}
        </div>
    </div>
    {message_html}
    <div class="utility-forms">
        <form class="utility-form" method="post" action="/utilizadores/criar">
            <h3>Criar utilizador</h3>
            <p>O ID e criado automaticamente no Supabase Auth.</p>
            <div class="field">
                <label for="create_nome">Nome</label>
                <input id="create_nome" name="nome" required>
            </div>
            <div class="field">
                <label for="create_email">Email</label>
                <input id="create_email" name="email" type="email" required>
            </div>
            <div class="field">
                <label for="create_password">Password</label>
                <input id="create_password" name="password" type="password" required>
            </div>
            <div class="field">
                <label for="create_perfil">Perfil</label>
                <select id="create_perfil" name="perfil">
                    <option value="{PERFIL_ADMIN}">{PERFIL_ADMIN}</option>
                    <option value="{PERFIL_UTILIZADOR}">{PERFIL_UTILIZADOR}</option>
                </select>
            </div>
            <button class="button" type="submit">{USER_PLUS_ICON}<span>Criar utilizador</span></button>
        </form>
        <form class="utility-form" method="post" action="/utilizadores/editar">
            <h3>Editar utilizador</h3>
            <p>Escolha um utilizador na lista para editar.</p>
            <input type="hidden" name="id" value="{esc(edit_id)}">
            <div class="field">
                <label for="edit_nome">Nome</label>
                <input id="edit_nome" name="nome" value="{esc(edit_nome)}" {disabled}>
            </div>
            <div class="field">
                <label for="edit_email">Email</label>
                <input id="edit_email" name="email" type="email" value="{esc(edit_email)}" {disabled}>
            </div>
            <div class="field">
                <label for="edit_password">Nova password</label>
                <input id="edit_password" name="password" type="password" placeholder="Deixe em branco para manter" {disabled}>
            </div>
            <div class="field">
                <label for="edit_perfil">Perfil</label>
                <select id="edit_perfil" name="perfil" {disabled}>
                    <option value="{PERFIL_ADMIN}" {"selected" if edit_perfil == PERFIL_ADMIN else ""}>{PERFIL_ADMIN}</option>
                    <option value="{PERFIL_UTILIZADOR}" {"selected" if edit_perfil == PERFIL_UTILIZADOR else ""}>{PERFIL_UTILIZADOR}</option>
                </select>
            </div>
            <label class="field checkbox-row">
                <input name="ativo" type="checkbox" {edit_checked} {disabled}>
                Ativo
            </label>
            <div class="utility-form-actions">
                <a class="button secondary" href="/utilizadores">Limpar</a>
                <button class="button" type="submit" {disabled}>{SAVE_ICON}<span>Guardar alteracoes</span></button>
            </div>
        </form>
    </div>
    <div class="utility-table-wrap">
        <table class="utility-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Estado</th>
                    <th class="actions-cell">Acoes</th>
                </tr>
            </thead>
            <tbody>{rows_html}</tbody>
        </table>
    </div>
</section>
"""
    return render_page("Utilizadores", content, current_user=current_user, embedded=True)


def render_history_page(current_user):
    if supabase_available():
        rows = table_select("historico", {"select": "*", "order": "created_at.desc", "limit": "200"})
    else:
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM historico
                ORDER BY created_at DESC
                LIMIT 200
                """
            ).fetchall()
    rows_html = ""
    for row in rows:
        action = row["acao"]
        action_class = "audit-action"
        if "Criou" in action or "criou" in action:
            action_class += " is-create"
        elif "Eliminou" in action or "apag" in action.lower():
            action_class += " is-delete"
        else:
            action_class += " is-update"
        target = history_target_label(row["alvo_tipo"], current_user)
        if row["alvo_id"]:
            target = f"{target} #{row['alvo_id']}"
        details = row["detalhes"] or "Sem detalhes"
        rows_html += f"""
        <tr>
            <td>{esc(row["created_at"])}</td>
            <td><span class="{action_class}">{esc(action)}</span></td>
            <td>{esc(target)}</td>
            <td>{esc(row["utilizador_nome"])}</td>
            <td>{esc(details)}</td>
        </tr>
        """

    empty_html = ""
    if not rows:
        empty_html = f"""
        <div class="utility-empty">
            {HISTORY_ICON}
            <h3>Sem alteracoes registadas</h3>
            <p>Quando forem feitas alteracoes aos utentes, elas aparecem aqui.</p>
        </div>
        """

    content = f"""
<section class="utility-panel" aria-label="Historico de alteracoes">
    <div class="utility-panel-head">
        <div>
            <h2>Historico de alteracoes</h2>
            <p>Registo das alteracoes feitas as fichas dos utentes.</p>
        </div>
        <div class="utility-head-actions">
            <a class="button secondary" href="/historico">{REFRESH_ICON}<span>Atualizar</span></a>
            {close_parent_dialog_button("Fechar")}
        </div>
    </div>
    <div class="utility-table-wrap">
        <table class="utility-table history-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Acao</th>
                    <th>Utente</th>
                    <th>Alterado por</th>
                    <th>Detalhes</th>
                </tr>
            </thead>
            <tbody>{rows_html}</tbody>
        </table>
        {empty_html}
    </div>
</section>
"""
    return render_page("Historico", content, current_user=current_user, embedded=True)


def render_language_page(current_user, notice=""):
    active = user_language(current_user)
    message_html = f'<div class="notice success">{esc(notice)}</div>' if notice else ""
    options = [
        ("pt", "&#127477;&#127481;", "Portugues", "Portugal"),
        ("en", "&#127468;&#127463;", "English", "United Kingdom"),
    ]
    option_html = ""
    for value, flag, label, region in options:
        active_class = " is-active" if active == value else ""
        option_html += f"""
        <button class="utility-choice-card{active_class}" type="submit" name="idioma" value="{value}" onclick="window.localStorage.setItem('central-language','{value}'); window.localStorage.setItem('socios-language','{value}'); window.localStorage.setItem('mentemovimento-language','{value}')">
            <span class="utility-choice-icon" aria-hidden="true">{flag}</span>
            <span class="utility-choice-copy">
                <strong>{esc(label)}</strong>
                <span>{esc(region)}</span>
            </span>
        </button>
        """
    content = f"""
<section class="utility-panel utility-language-panel" aria-label="Idioma">
    <div class="utility-panel-head">
        <div>
            <h2>Idioma</h2>
            <p>Escolha o idioma da aplicacao neste browser.</p>
        </div>
        <div class="utility-head-actions">
            {close_parent_dialog_button("Fechar")}
        </div>
    </div>
    {message_html}
    <form class="utility-language-list" method="post" action="/idioma">
        {option_html}
    </form>
</section>
"""
    return render_page("Idioma", content, current_user=current_user, embedded=True)


class UtentesHandler(BaseHTTPRequestHandler):
    def current_user(self):
        if not hasattr(self, "_current_user"):
            user = get_current_user(self)
            if user:
                user = dict(user)
                request_language = get_request_language_cookie(self)
                if request_language:
                    user["idioma"] = request_language
            self._current_user = user
        return self._current_user

    def require_user(self):
        user = self.current_user()
        if not user:
            self.redirect("/login")
            return None
        if not can_view_utentes(user):
            self.send_html(render_login_page("Sem permissao para aceder a Utentes.", language=get_request_language(self)), status=403)
            return None
        return user

    def require_admin(self):
        user = self.require_user()
        if not user:
            return None
        if not can_edit_utentes(user):
            self.redirect(f"/?msg={quote('Sem permissão para essa ação')}")
            return None
        return user

    def do_GET(self):
        parsed = urlparse(self.path)
        query_params = parse_qs(parsed.query)

        if parsed.path == "/logo.png":
            self.send_logo()
            return

        if parsed.path == "/login":
            if self.current_user():
                self.redirect("/")
                return
            self.send_html(render_login_page(language=get_request_language(self)))
            return

        if parsed.path == "/logout":
            delete_session(get_request_token(self))
            self.redirect("/login", headers={"Set-Cookie": clear_session_cookie()})
            return

        user = self.require_user()
        if not user:
            return

        if parsed.path == "/anexo":
            attachment_id = query_params.get("id", [""])[0]
            if not attachment_id.isdigit():
                self.send_error(404, "PDF não encontrado")
                return
            attachment = get_pdf_attachment(int(attachment_id))
            if not attachment:
                self.send_error(404, "PDF não encontrado")
                return
            if not can_view_tab(user, attachment["tab_key"]):
                self.send_error(403, "Sem permissao para abrir anexos")
                return
            self.send_pdf_attachment(attachment)
            return

        if parsed.path.startswith("/docs/"):
            self.send_static_pdf(parsed.path.removeprefix("/docs/"))
            return

        if parsed.path == "/tema":
            next_theme = toggle_theme(user)
            log_action(user, "Alterou tema", "Conta", user["id"], f"Tema: {next_theme}")
            self.redirect("/")
            return

        if parsed.path == "/":
            search = query_params.get("q", [""])[0].strip()
            notice = query_params.get("msg", [""])[0].strip()
            self.send_html(render_list(search, notice, current_user=user))
            return

        if parsed.path == "/estatisticas":
            self.send_html(render_statistics_page(user))
            return

        if parsed.path == "/backup/utentes":
            if not can_export_utentes(user) or not can_view_sensitive_utentes(user):
                self.send_error(403, "Sem permissao para exportar backup")
                return
            try:
                filename, data = build_utentes_backup_zip()
            except (ValueError, SupabaseError, OSError) as exc:
                self.send_error(500, f"{tr(user, 'backup_error')}: {exc}")
                return
            log_action(user, "Exportou backup de utentes", "Utente", None, filename)
            self.send_zip(filename, data)
            return

        if parsed.path == "/novo":
            if not can_edit_utentes(user):
                self.redirect(f"/?msg={quote('Sem permissão para criar utentes')}")
                return
            self.send_html(render_form("/adicionar", "Novo utente", current_user=user))
            return

        if parsed.path == "/editar":
            if not can_edit_utentes(user):
                utente_id = query_params.get("id", [""])[0]
                self.redirect(f"/ver?id={utente_id}")
                return
            utente_id = query_params.get("id", [""])[0]
            active_tab = normalize_tab_key(query_params.get("tab", [TAB_SECTIONS[0][0]])[0])
            notice = query_params.get("msg", [""])[0].strip()
            if not utente_id.isdigit():
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            utente = get_utente(int(utente_id))
            if not utente:
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            self.send_html(render_edit_page(dict(utente), active_tab, notice=notice, current_user=user))
            return

        if parsed.path == "/ver":
            utente_id = query_params.get("id", [""])[0]
            active_tab = normalize_tab_key(query_params.get("tab", [TAB_SECTIONS[0][0]])[0])
            notice = query_params.get("msg", [""])[0].strip()
            if not utente_id.isdigit():
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            utente = get_utente(int(utente_id))
            if not utente:
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            self.send_html(render_view_page(dict(utente), active_tab, notice=notice, current_user=user))
            return

        if parsed.path == "/utilizadores":
            if not can_manage_central_users(user):
                self.redirect(f"/?msg={quote('Sem permissao para gerir utilizadores')}")
                return
            edit_user_id = query_params.get("edit_user_id", [""])[0]
            notice = query_params.get("msg", [""])[0].strip()
            self.send_html(render_user_manager(user, edit_user_id, notice=notice))
            return

        if parsed.path == "/historico":
            if not can_view_history(user):
                self.redirect(f"/?msg={quote('Sem permissao para ver historico')}")
                return
            self.send_html(render_history_page(user))
            return

        if parsed.path == "/manual":
            self.send_html(render_manual_page(user))
            return

        if parsed.path == "/manual/utilizador":
            self.send_html(render_user_manual_page(user))
            return

        if parsed.path == "/manual/desenvolvedor":
            self.send_html(render_developer_manual_page(user))
            return

        if parsed.path == "/idioma":
            notice = query_params.get("msg", [""])[0].strip()
            self.send_html(render_language_page(user, notice=notice))
            return

        self.send_error(404, "Página não encontrada")

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/anexos/upload":
            self.handle_pdf_upload()
            return

        data = read_post(self)

        if parsed.path == "/login":
            email = field_value(data, "email")
            password = field_value(data, "password")
            user = get_user_by_email(email)
            if not user or not user["ativo"] or not verify_password(password, user["password_hash"]):
                self.send_html(
                    render_login_page("Credenciais inválidas ou utilizador inativo.", language=get_request_language(self)),
                    status=401,
                )
                return
            token = create_session(user["id"])
            log_action(user, "Entrou no sistema", "Sessão", user["id"], "Login efetuado")
            self.redirect("/", headers={"Set-Cookie": [session_cookie(token), language_cookie(user.get("idioma"))]})
            return

        user = self.require_user()
        if not user:
            return

        if parsed.path == "/idioma":
            language = update_language(user, field_value(data, "idioma"))
            log_action(user, "Alterou idioma", "Conta", user["id"], f"Idioma: {language}")
            self.redirect(f"/idioma?msg={quote(tr(user, 'language_updated'))}", headers={"Set-Cookie": language_cookie(language)})
            return

        if parsed.path == "/anexos/eliminar":
            admin = self.require_admin()
            if not admin:
                return
            active_tab = normalize_tab_key(field_value(data, "tab") or "protecao_dados")
            if not can_edit_tab(admin, active_tab):
                self.redirect(f"/?msg={quote('Sem permissao para editar anexos')}")
                return
            attachment_id = field_value(data, "id")
            utente_id = field_value(data, "utente_id")
            if attachment_id.isdigit():
                attachment = get_pdf_attachment(int(attachment_id))
                if attachment:
                    utente_id = str(attachment["utente_id"])
                    active_tab = normalize_tab_key(attachment["tab_key"])
                    if not can_edit_tab(admin, active_tab):
                        self.redirect(f"/?msg={quote('Sem permissao para editar anexos')}")
                        return
                    removed = delete_pdf_attachment(int(attachment_id))
                    log_action(admin, "Removeu PDF", "Utente", int(utente_id), removed["original_name"] if removed else "")
            if utente_id.isdigit():
                self.redirect(f"/editar?id={utente_id}&tab={active_tab}&msg={quote('PDF removido com sucesso')}")
            else:
                self.redirect(f"/?msg={quote('PDF removido com sucesso')}")
            return

        if parsed.path == "/adicionar":
            admin = self.require_admin()
            if not admin:
                return
            try:
                save_utente(data)
            except ValueError as exc:
                self.send_html(render_form("/adicionar", "Novo utente", form_to_dict(data), str(exc), current_user=admin), status=400)
                return
            log_action(admin, "Criou utente", "Utente", None, field_value(data, "nome"))
            self.redirect(f"/?msg={quote('Utente adicionado com sucesso')}")
            return

        if parsed.path == "/editar":
            admin = self.require_admin()
            if not admin:
                return
            utente_id = field_value(data, "id")
            active_tab = normalize_tab_key(field_value(data, "tab"))
            if not can_edit_tab(admin, active_tab):
                self.redirect(f"/ver?id={utente_id}&tab={active_tab}&msg={quote('Sem permissao para editar este separador')}")
                return
            if not utente_id.isdigit() or not get_utente(int(utente_id)):
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            payment_action = field_value(data, "pag_action")
            canceled_payment = None
            try:
                update_utente_core_from_shared(int(utente_id), data)
                if active_tab == "referenciacao":
                    active_data = referenciacao_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "pagamentos":
                    existing_pagamentos = load_pagamentos_data(int(utente_id))
                    if payment_action.startswith("cancel:"):
                        canceled_payment = find_payment_record(existing_pagamentos, payment_action.split(":", 1)[1])
                    save_tab_content(
                        int(utente_id),
                        active_tab,
                        json.dumps(pagamentos_from_post(data, existing_pagamentos), ensure_ascii=False),
                    )
                elif active_tab == "emergencia":
                    active_data = emergencia_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "inscricao":
                    active_data = inscricao_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "diagnostica":
                    active_data = diagnostica_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "atendimentos":
                    active_data = atendimentos_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                else:
                    save_tab_content(int(utente_id), active_tab, field_value(data, "conteudo"))
            except ValueError as exc:
                form_data = form_to_dict(data)
                form_data["id"] = utente_id
                self.send_html(render_edit_page(form_data, active_tab, str(exc), current_user=admin), status=400)
                return
            if active_tab == "pagamentos" and payment_action.startswith("cancel:"):
                details = month_label(canceled_payment.get("mensalidade")) if canceled_payment else ""
                log_action(admin, "Cancelou pagamento", "Utente", int(utente_id), details)
                self.redirect(f"/editar?id={utente_id}&tab=pagamentos&msg={quote(tr(admin, 'payment_cancelled'))}")
                return
            if active_tab == "pagamentos" and payment_action == "add":
                log_action(admin, "Registou pagamento", "Utente", int(utente_id), field_value(data, "pag_mensalidade_ate"))
                self.redirect(f"/editar?id={utente_id}&tab=pagamentos&msg={quote('Mensalidade registada com sucesso')}")
                return
            log_action(admin, "Guardou utente", "Utente", int(utente_id), f"{field_value(data, 'nome')} - {get_tab_title(active_tab)}")
            self.redirect(f"/?msg={quote('Dados guardados com sucesso')}")
            return

        if parsed.path == "/guardar-aba":
            admin = self.require_admin()
            if not admin:
                return
            background_save = self.headers.get("X-Background-Save") == "1"
            utente_id = field_value(data, "id")
            active_tab = normalize_tab_key(field_value(data, "tab"))
            if not can_edit_tab(admin, active_tab):
                if background_save:
                    self.send_json({"ok": False, "error": "Sem permissao para editar este separador."}, status=403)
                    return
                self.redirect(f"/ver?id={utente_id}&tab={active_tab}&msg={quote('Sem permissao para editar este separador')}")
                return
            if not utente_id.isdigit() or not get_utente(int(utente_id)):
                if background_save:
                    self.send_json({"ok": False, "error": "Utente não encontrado."}, status=404)
                    return
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            try:
                if active_tab == "referenciacao":
                    update_utente_core_from_shared(int(utente_id), data)
                    active_data = referenciacao_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "pagamentos":
                    existing_pagamentos = load_pagamentos_data(int(utente_id))
                    save_tab_content(
                        int(utente_id),
                        active_tab,
                        json.dumps(pagamentos_from_post(data, existing_pagamentos), ensure_ascii=False),
                    )
                elif active_tab == "emergencia":
                    update_utente_core_from_shared(int(utente_id), data)
                    active_data = emergencia_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "inscricao":
                    update_utente_core_from_shared(int(utente_id), data)
                    active_data = inscricao_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "diagnostica":
                    update_utente_core_from_shared(int(utente_id), data)
                    active_data = diagnostica_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                elif active_tab == "atendimentos":
                    update_utente_core_from_shared(int(utente_id), data)
                    active_data = atendimentos_from_post(data)
                    sync_saved_shared_tabs(int(utente_id), active_tab, active_data)
                else:
                    save_tab_content(int(utente_id), active_tab, field_value(data, "conteudo"))
            except ValueError as exc:
                if background_save:
                    self.send_json({"ok": False, "error": str(exc)}, status=400)
                    return
                form_data = form_to_dict(data)
                form_data["id"] = utente_id
                self.send_html(render_edit_page(form_data, active_tab, str(exc), current_user=admin), status=400)
                return
            log_action(admin, "Guardou aba", "Utente", int(utente_id), get_tab_title(active_tab))
            if background_save:
                self.send_json({"ok": True})
                return
            self.redirect(f"/editar?id={utente_id}&tab={active_tab}&msg={quote('Aba guardada com sucesso')}")
            return

        if parsed.path == "/eliminar":
            admin = self.require_admin()
            if not admin:
                return
            if not can_delete_utentes(admin):
                self.redirect(f"/?msg={quote('Sem permissao para eliminar utentes')}")
                return
            utente_id = field_value(data, "id")
            if utente_id.isdigit():
                utente = delete_utente_record(int(utente_id))
                log_action(admin, "Eliminou utente", "Utente", int(utente_id), utente["nome"] if utente else "")
            self.redirect(f"/?msg={quote('Utente eliminado com sucesso')}")
            return

        if parsed.path == "/estado":
            admin = self.require_admin()
            if not admin:
                return
            utente_id = field_value(data, "id")
            if not utente_id.isdigit():
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            utente, next_status = toggle_utente_status(int(utente_id))
            if not utente:
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            log_action(admin, "Alterou estado de utente", "Utente", int(utente_id), f"{utente['nome']} - {next_status}")
            message = "Utente ativado com sucesso" if next_status == "Ativo" else "Utente inativado com sucesso"
            self.redirect(f"/?msg={quote(message)}")
            return

        if parsed.path == "/pagamentos/rapido":
            admin = self.require_admin()
            if not admin:
                return
            if not can_edit_tab(admin, "pagamentos"):
                self.redirect(f"/?msg={quote('Sem permissao para registar pagamentos')}")
                return
            utente_id = field_value(data, "id")
            method = field_value(data, "pag_forma")
            payment_date = field_value(data, "pag_data")
            if not utente_id.isdigit() or not get_utente(int(utente_id)):
                self.redirect(f"/?msg={quote('Utente não encontrado')}")
                return
            try:
                paid_month = register_quick_payment(int(utente_id), method, payment_date)
            except ValueError as exc:
                self.redirect(f"/?msg={quote(str(exc))}")
                return
            utente = get_utente(int(utente_id))
            details = f"{utente['nome'] if utente else utente_id} - {month_label(paid_month)} - {method}"
            log_action(admin, "Registou pagamento rápido", "Utente", int(utente_id), details)
            self.redirect(f"/?msg={quote('Pagamento rápido registado com sucesso')}")
            return

        if parsed.path == "/utilizadores/criar":
            admin = self.require_admin()
            if not admin:
                return
            if not can_manage_central_users(admin):
                self.redirect(f"/?msg={quote('Sem permissao para gerir utilizadores')}")
                return
            try:
                user_id = create_user(data)
            except ValueError as exc:
                self.send_html(render_user_manager(admin, error=str(exc)), status=400)
                return
            log_action(admin, "Criou utilizador", "Utilizador", user_id, field_value(data, "email"))
            self.redirect(f"/utilizadores?msg={quote('Utilizador criado com sucesso')}")
            return

        if parsed.path == "/utilizadores/editar":
            admin = self.require_admin()
            if not admin:
                return
            if not can_manage_central_users(admin):
                self.redirect(f"/?msg={quote('Sem permissao para gerir utilizadores')}")
                return
            edit_id = field_value(data, "id")
            try:
                user_id = update_user(data)
            except ValueError as exc:
                self.send_html(render_user_manager(admin, edit_id, error=str(exc)), status=400)
                return
            log_action(admin, "Editou utilizador", "Utilizador", user_id, field_value(data, "email"))
            self.redirect(f"/utilizadores?edit_user_id={user_id}&msg={quote('Utilizador atualizado com sucesso')}")
            return

        if parsed.path == "/utilizadores/alternar":
            admin = self.require_admin()
            if not admin:
                return
            if not can_manage_central_users(admin):
                self.redirect(f"/?msg={quote('Sem permissao para gerir utilizadores')}")
                return
            user_id = field_value(data, "id")
            if user_id.isdigit():
                target = get_user_by_id(int(user_id))
                try:
                    toggle_user_active(int(user_id))
                except ValueError as exc:
                    self.redirect(f"/utilizadores?msg={quote(str(exc))}")
                    return
                log_action(admin, "Alterou estado de utilizador", "Utilizador", int(user_id), target["email"] if target else "")
            self.redirect(f"/utilizadores?msg={quote('Estado atualizado com sucesso')}")
            return

        if parsed.path == "/utilizadores/eliminar":
            admin = self.require_admin()
            if not admin:
                return
            if not can_manage_central_users(admin):
                self.redirect(f"/?msg={quote('Sem permissao para gerir utilizadores')}")
                return
            user_id = field_value(data, "id")
            if user_id.isdigit():
                target = get_user_by_id(int(user_id))
                try:
                    delete_user(int(user_id))
                except ValueError as exc:
                    self.redirect(f"/utilizadores?msg={quote(str(exc))}")
                    return
                log_action(admin, "Eliminou utilizador", "Utilizador", int(user_id), target["email"] if target else "")
            self.redirect(f"/utilizadores?msg={quote('Utilizador eliminado com sucesso')}")
            return

        self.send_error(404, "Página não encontrada")

    def handle_pdf_upload(self):
        admin = self.require_admin()
        if not admin:
            return
        utente_id = ""
        active_tab = "protecao_dados"
        try:
            fields, files = read_multipart(self)
            utente_id = field_value(fields, "utente_id")
            active_tab = normalize_tab_key(field_value(fields, "tab") or "protecao_dados")
            if not can_edit_tab(admin, active_tab):
                self.redirect(f"/?msg={quote('Sem permissao para anexar PDFs')}")
                return
            if not utente_id.isdigit() or not get_utente(int(utente_id)):
                raise ValueError("Utente não encontrado.")
            upload = files.get("pdf")
            if not upload:
                raise ValueError("Escolha um ficheiro PDF para anexar.")
            attachment_id = save_pdf_attachment(
                int(utente_id),
                upload.get("filename", ""),
                upload.get("content", b""),
                admin,
                active_tab,
            )
            attachment = get_pdf_attachment(attachment_id)
            log_action(admin, "Anexou PDF", "Utente", int(utente_id), attachment["original_name"] if attachment else "")
            self.redirect(f"/editar?id={utente_id}&tab={active_tab}&msg={quote('PDF anexado com sucesso')}")
        except ValueError as exc:
            target = f"/editar?id={utente_id}&tab={active_tab}" if utente_id.isdigit() else "/"
            separator = "&" if "?" in target else "?"
            self.redirect(f"{target}{separator}msg={quote(str(exc))}")

    def send_pdf_attachment(self, attachment):
        if supabase_available():
            try:
                data = supabase_download_pdf(attachment)
            except SupabaseError:
                self.send_error(404, "PDF não encontrado")
                return
        else:
            path = attachment_path(attachment)
            if not os.path.exists(path):
                self.send_error(404, "PDF não encontrado")
                return
            with open(path, "rb") as file:
                data = file.read()
        filename = safe_filename(attachment["original_name"]).replace('"', "")
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f"inline; filename=\"{filename}\"; filename*=UTF-8''{quote(filename)}")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_static_pdf(self, filename):
        safe_name = safe_filename(os.path.basename(filename))
        file_path = os.path.abspath(os.path.join(DOCS_DIR, safe_name))
        docs_root = os.path.abspath(DOCS_DIR)
        if not file_path.startswith(docs_root + os.sep) or not os.path.exists(file_path):
            self.send_error(404, "PDF não encontrado")
            return
        with open(file_path, "rb") as file:
            data = file.read()
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f"inline; filename=\"{safe_name}\"; filename*=UTF-8''{quote(safe_name)}")
        self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload, status=200):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_zip(self, filename, data):
        safe_name = safe_filename(filename).replace('"', "")
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{quote(safe_name)}")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_html(self, body, status=200):
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_logo(self):
        if not os.path.exists(LOGO_PATH):
            self.send_error(404, "Imagem não encontrada")
            return
        with open(LOGO_PATH, "rb") as image:
            data = image.read()
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def redirect(self, path, headers=None):
        self.send_response(303)
        self.send_header("Location", path)
        for key, value in (headers or {}).items():
            if isinstance(value, (list, tuple)):
                for item in value:
                    self.send_header(key, item)
            else:
                self.send_header(key, value)
        self.end_headers()

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def form_to_dict(data):
    return {key: values[0] if values else "" for key, values in data.items()}


def run():
    init_db()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), UtentesHandler)
    print(f"Base de dados: {DB_PATH}")
    print(f"A abrir em: http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
