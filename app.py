"""Servidor da Ficha Avalon: serve estáticos + sync de estado.

Auth: Basic Auth opcional (LAN passa livre, IP externo precisa user/senha).
Sync: GET/POST /api/state — JSON único em data/ficha.json (single-user).
"""
from __future__ import annotations

import ipaddress
import json
import os
import secrets
import tempfile
from pathlib import Path
from typing import Any

from flask import Flask, Response, jsonify, request, send_from_directory


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
ENV_FILE = DATA_DIR / ".env"
STATE_FILE = DATA_DIR / "ficha.json"


def _ler_env() -> dict[str, str]:
    cfg: dict[str, str] = {}
    if not ENV_FILE.exists():
        return cfg
    for linha in ENV_FILE.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        cfg[chave.strip()] = valor.strip().strip('"').strip("'")
    return cfg


def _ip_real() -> str:
    xff = (request.headers.get("X-Forwarded-For") or "").strip()
    if xff:
        return xff.split(",")[0].strip()
    return request.remote_addr or ""


def _eh_lan(addr: str) -> bool:
    if not addr:
        return False
    try:
        ip = ipaddress.ip_address(addr)
    except ValueError:
        return False
    return ip.is_loopback or ip.is_private


def _ler_estado() -> dict[str, Any]:
    if not STATE_FILE.exists():
        return {"campos": {}, "tinta": {}}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"campos": {}, "tinta": {}}


def _gravar_estado(estado: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Gravação atômica: tmpfile + rename, evita corromper se travar no meio.
    fd, tmp = tempfile.mkstemp(dir=str(DATA_DIR), prefix=".ficha-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(estado, f, ensure_ascii=False, separators=(",", ":"))
        os.replace(tmp, STATE_FILE)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def criar_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.before_request
    def _checar_auth():
        cfg = _ler_env()
        user = (cfg.get("APP_USER") or "").strip()
        senha = (cfg.get("APP_PASS") or "").strip()
        if not user or not senha:
            return None
        if _eh_lan(_ip_real()):
            return None
        auth = request.authorization
        if (
            auth
            and secrets.compare_digest(auth.username or "", user)
            and secrets.compare_digest(auth.password or "", senha)
        ):
            return None
        return Response(
            "Auth required",
            status=401,
            headers={"WWW-Authenticate": 'Basic realm="Ficha Avalon"'},
        )

    @app.get("/api/state")
    def get_state():
        return jsonify(_ler_estado())

    @app.post("/api/state")
    def post_state():
        if not request.is_json:
            return jsonify({"erro": "json esperado"}), 400
        body = request.get_json(silent=True) or {}
        campos = body.get("campos")
        tinta = body.get("tinta")
        if not isinstance(campos, dict) or not isinstance(tinta, dict):
            return jsonify({"erro": "campos e tinta devem ser objetos"}), 400
        estado = {"campos": campos, "tinta": tinta}
        _gravar_estado(estado)
        return jsonify({"ok": True})

    @app.route("/", defaults={"caminho": "index.html"})
    @app.route("/<path:caminho>")
    def servir(caminho: str):
        return send_from_directory(str(ROOT), caminho)

    return app


if __name__ == "__main__":
    porta = int(os.environ.get("PORT", "5050"))
    criar_app().run(host="0.0.0.0", port=porta, debug=False)
