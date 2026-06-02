import os
import sys
from urllib.parse import quote, urlparse


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UTENTES_DIR = os.path.join(ROOT_DIR, "portal", "modules", "utentes")

if UTENTES_DIR not in sys.path:
    sys.path.insert(0, UTENTES_DIR)

from app import UtentesHandler  # noqa: E402


PREFIX = "/area/utentes"


def prefix_location(location):
    if not location:
        return location
    if location.startswith(PREFIX):
        return location
    if location == "/login" or location.startswith("/login?"):
        return "/login?next=" + quote(PREFIX + "/", safe="")
    if location == "/logout":
        return "/logout"
    if location.startswith("/"):
        return PREFIX + location
    return location


def rewrite_html(text):
    replacements = {
        'href="/logout"': 'href="/logout"',
        'href="/': f'href="{PREFIX}/',
        'action="/': f'action="{PREFIX}/',
        'src="/': f'src="{PREFIX}/',
        'data-frame-dialog-open="/': f'data-frame-dialog-open="{PREFIX}/',
        'fetch("/': f'fetch("{PREFIX}/',
        ".tab-link[href^='/editar']": f".tab-link[href^='{PREFIX}/editar']",
    }
    output = text
    for old, new in replacements.items():
        output = output.replace(old, new)
    for attr in ("href", "action", "src", "data-frame-dialog-open"):
        output = output.replace(f'{attr}="{PREFIX}/logout', f'{attr}="/logout')
        output = output.replace(f'{attr}="{PREFIX}/dashboard', f'{attr}="/dashboard')
        output = output.replace(f'{attr}="{PREFIX}/area/socios', f'{attr}="/area/socios')
        output = output.replace(f'{attr}="{PREFIX}/area/utentes/', f'{attr}="{PREFIX}/')
        output = output.replace(f'{attr}="{PREFIX}/area/dispositivos', f'{attr}="/area/dispositivos')
        output = output.replace(f'{attr}="{PREFIX}/static/', f'{attr}="/static/')
    return output


def rewrite_request_path(path):
    parsed = urlparse(path)
    route = parsed.path
    if route == PREFIX:
        route = "/"
    elif route.startswith(PREFIX + "/"):
        route = route[len(PREFIX):] or "/"
    query = f"?{parsed.query}" if parsed.query else ""
    return route + query


def rewrite_cookie(value):
    if not value:
        return value
    return value.replace("Path=/;", f"Path={PREFIX};").replace("Path=/", f"Path={PREFIX}")


def is_legacy_login(path):
    return urlparse(path).path == "/login"


def central_redirect_target(path):
    parsed = urlparse(path)
    route = parsed.path
    if route.startswith("/area/socios") or route.startswith("/area/dispositivos"):
        return route + (f"?{parsed.query}" if parsed.query else "")
    return None


class handler(UtentesHandler):
    def do_GET(self):
        self.path = rewrite_request_path(self.path)
        redirect_target = central_redirect_target(self.path)
        if redirect_target:
            super().redirect(redirect_target)
            return
        if is_legacy_login(self.path):
            self.redirect("/login")
            return
        super().do_GET()

    def do_POST(self):
        self.path = rewrite_request_path(self.path)
        redirect_target = central_redirect_target(self.path)
        if redirect_target:
            super().redirect(redirect_target)
            return
        if is_legacy_login(self.path):
            self.redirect("/login")
            return
        super().do_POST()

    def send_html(self, body, status=200):
        super().send_html(rewrite_html(body), status=status)

    def redirect(self, path, headers=None):
        next_headers = {}
        for key, value in (headers or {}).items():
            if key.lower() == "set-cookie":
                if isinstance(value, (list, tuple)):
                    next_headers[key] = [rewrite_cookie(item) for item in value]
                else:
                    next_headers[key] = rewrite_cookie(value)
            else:
                next_headers[key] = value
        super().redirect(prefix_location(path), headers=next_headers)
