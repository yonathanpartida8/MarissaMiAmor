#!/usr/bin/env python3
"""
SERVIDOR DEL LIBRITO — publicación y almacenamiento en tu propio teléfono.

Pensado para Termux en un teléfono viejo (también corre en cualquier Linux,
macOS o Windows con Python 3.9+). Sólo usa la biblioteca estándar de Python:
no hay que instalar nada más que `python` (y `cloudflared` si quieres que se
vea desde internet).

Qué hace:
  · Cuentas propias (usuario y contraseña, con registro que tú apruebas o con
    código de invitación). Nada de GitHub para los que publican.
  · Guarda TU token de GitHub cifrado aquí, en el teléfono. Nunca viaja al
    editor ni a ningún navegador: el editor le manda el librito al servidor y
    es el servidor quien lo sube a tu repositorio.
  · Publica cada librito en publicaciones/<nombre>/ de tu GitHub Pages (si el
    nombre ya existe, usa <nombre>-2, -3…) y guarda una copia aquí mismo, que
    también se ve en /p/<nombre>/.
  · Guarda copias de tus proyectos (el .zip completo del editor) por usuario.
  · Un panel web bonito para administrarlo todo: espacio, publicaciones,
    proyectos, usuarios, GitHub, túnel y actividad.

Cómo se usa (el paso a paso entero está en servidor/LÉEME.md):
    python servidor.py iniciar        arranca el servidor (y el túnel, si está)
    python servidor.py admin          crea (o cambia la contraseña de) un administrador
    python servidor.py github         guarda el token de GitHub desde la terminal
    python servidor.py estado         cómo está todo
    python servidor.py llave-nueva    cambia la llave que cifra los secretos

Los datos viven FUERA del código, en ~/librito-datos (o en $LIBRITO_DATOS):
config.json, librito.db, llave.bin + secretos.bin (cifrados, sólo legibles por
tu usuario), publicaciones/, proyectos/ y servidor.log.
"""
import argparse
import base64
import concurrent.futures
import getpass
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import shutil
import signal
import socket
import sqlite3
import stat
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0.0"
AQUI = os.path.dirname(os.path.abspath(__file__))
PANEL = os.path.join(AQUI, "panel")
DATOS = os.path.abspath(os.path.expanduser(os.environ.get("LIBRITO_DATOS", "~/librito-datos")))
GITHUB_API = os.environ.get("LIBRITO_GITHUB_API", "https://api.github.com").rstrip("/")
CARPETA_PUB = "publicaciones"
ARCHIVO_ANUNCIO = "servidor.json"

AJUSTES_BASE = {
    "nombre": "Servidor del librito",
    "puerto": 8787,
    "escuchar": "0.0.0.0",
    "registro": "aprobacion",          # aprobacion · codigo · cerrado
    "origenes": [],                    # orígenes extra que pueden usar la API (además de tu GitHub Pages)
    "permitir_local": True,            # http://localhost y 127.0.0.1 (para probar)
    "tunel": "cloudflare",             # cloudflare · ninguno
    "url_publica": "",                 # si tienes un dominio o túnel fijo, ponlo aquí
    "anunciar": True,                  # escribir la dirección del túnel en servidor.json de tu sitio
    "max_subida_mb": 300,
    "github": {"repo": "", "rama": ""},
}
RESERVADOS = {"lista", "index", "servidor", "assets", "scripts", "pages", "styles"}
MIME_EXTRA = {".js": "text/javascript", ".mjs": "text/javascript", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
              ".webp": "image/webp", ".avif": "image/avif", ".m4a": "audio/mp4", ".opus": "audio/ogg", ".woff2": "font/woff2", ".json": "application/json"}


def ahora():
    return time.time()


def iso(t=None):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t if t is not None else ahora()))


def nombre_limpio(s, defecto="librito"):
    import unicodedata
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:40].strip("-")
    return s or defecto


def escribir_seguro(ruta, datos, modo=0o600):
    """Escribe de una sola vez (sin dejar archivos a medias) y sólo para tu usuario."""
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(ruta), prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(datos if isinstance(datos, bytes) else datos.encode("utf-8"))
        os.chmod(tmp, modo)
        os.replace(tmp, ruta)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


class Falla(Exception):
    """Un error que se le puede contar a quien usa el servidor."""
    def __init__(self, mensaje, codigo=400):
        super().__init__(mensaje)
        self.codigo = codigo


# ════════════════════════════════════════════════════════════════════════
#  Registro (servidor.log) — corto y sin secretos
# ════════════════════════════════════════════════════════════════════════
_LOG_LOCK = threading.Lock()


def log(*partes):
    linea = f"{time.strftime('%Y-%m-%d %H:%M:%S')}  " + " ".join(str(p) for p in partes)
    with _LOG_LOCK:
        print(linea, flush=True)
        try:
            ruta = os.path.join(DATOS, "servidor.log")
            if os.path.exists(ruta) and os.path.getsize(ruta) > 2_000_000:
                os.replace(ruta, ruta + ".1")
            with open(ruta, "a", encoding="utf-8") as f:
                f.write(linea + "\n")
        except OSError:
            pass


# ════════════════════════════════════════════════════════════════════════
#  Ajustes (config.json, sin secretos)
# ════════════════════════════════════════════════════════════════════════
class Ajustes:
    def __init__(self):
        self.ruta = os.path.join(DATOS, "config.json")
        self.lock = threading.Lock()
        self.d = json.loads(json.dumps(AJUSTES_BASE))
        if os.path.exists(self.ruta):
            try:
                with open(self.ruta, encoding="utf-8") as f:
                    guardado = json.load(f)
                for k, v in guardado.items():
                    if k == "github" and isinstance(v, dict):
                        self.d["github"].update(v)
                    elif k in self.d:
                        self.d[k] = v
            except (OSError, ValueError) as e:
                log("config.json no se pudo leer, se usan los valores de fábrica:", e)
        else:
            self.guardar()

    def __getitem__(self, k):
        return self.d[k]

    def guardar(self):
        with self.lock:
            escribir_seguro(self.ruta, json.dumps(self.d, ensure_ascii=False, indent=1))

    def poner(self, **cambios):
        with self.lock:
            for k, v in cambios.items():
                if k == "github":
                    self.d["github"].update(v)
                else:
                    self.d[k] = v
        self.guardar()


# ════════════════════════════════════════════════════════════════════════
#  La caja fuerte: secretos cifrados con una llave que sólo vive aquí
#
#  Cifrado autenticado con la biblioteca estándar: flujo HMAC-SHA256 en modo
#  contador (como cifrado) + HMAC-SHA256 del resultado (como sello). Dos
#  subllaves sacadas de la llave maestra (llave.bin, 32 bytes al azar).
#  Protege el token si secretos.bin se copia o se sube por error a algún
#  lado sin la llave; quien tenga el teléfono entero (las dos cosas) podría
#  leerlo, como con cualquier servidor. Por eso los archivos son 0600.
# ════════════════════════════════════════════════════════════════════════
class Caja:
    MAGIA = b"LBR1"

    def __init__(self):
        self.ruta_llave = os.environ.get("LIBRITO_LLAVE_ARCHIVO") or os.path.join(DATOS, "llave.bin")
        self.ruta = os.path.join(DATOS, "secretos.bin")
        self.lock = threading.Lock()
        if not os.path.exists(self.ruta_llave):
            escribir_seguro(self.ruta_llave, secrets.token_bytes(32))
            log("Llave nueva generada en", self.ruta_llave)
        with open(self.ruta_llave, "rb") as f:
            self._llave = f.read()
        if len(self._llave) < 32:
            raise SystemExit("La llave (llave.bin) está dañada. Bórrala y vuelve a guardar el token de GitHub.")

    def _sub(self, para):
        return hmac.new(self._llave, b"librito:" + para, hashlib.sha256).digest()

    def _flujo(self, nonce, n):
        k, salida, i = self._sub(b"cifrar"), bytearray(), 0
        while len(salida) < n:
            salida += hmac.new(k, nonce + i.to_bytes(8, "big"), hashlib.sha256).digest()
            i += 1
        return bytes(salida[:n])

    def cifrar(self, datos):
        nonce = secrets.token_bytes(16)
        ct = bytes(a ^ b for a, b in zip(datos, self._flujo(nonce, len(datos))))
        sello = hmac.new(self._sub(b"sellar"), self.MAGIA + nonce + ct, hashlib.sha256).digest()
        return self.MAGIA + nonce + sello + ct

    def descifrar(self, b):
        if len(b) < 52 or b[:4] != self.MAGIA:
            raise ValueError("formato desconocido")
        nonce, sello, ct = b[4:20], b[20:52], b[52:]
        if not hmac.compare_digest(sello, hmac.new(self._sub(b"sellar"), self.MAGIA + nonce + ct, hashlib.sha256).digest()):
            raise ValueError("el sello no coincide (¿otra llave?)")
        return bytes(a ^ b for a, b in zip(ct, self._flujo(nonce, len(ct))))

    def leer(self):
        with self.lock:
            if not os.path.exists(self.ruta):
                return {}
            try:
                with open(self.ruta, "rb") as f:
                    return json.loads(self.descifrar(f.read()).decode("utf-8"))
            except (OSError, ValueError) as e:
                log("No se pudieron leer los secretos:", e)
                return {}

    def guardar(self, d):
        with self.lock:
            escribir_seguro(self.ruta, self.cifrar(json.dumps(d).encode("utf-8")))

    def cambiar_llave(self):
        d = self.leer()
        with self.lock:
            self._llave = secrets.token_bytes(32)
            escribir_seguro(self.ruta_llave, self._llave)
        self.guardar(d)


# ════════════════════════════════════════════════════════════════════════
#  Contraseñas: scrypt (o PBKDF2 si este Python no trae scrypt)
# ════════════════════════════════════════════════════════════════════════
def hashear(contrasena):
    sal = secrets.token_bytes(16)
    b = contrasena.encode("utf-8")
    try:
        h = hashlib.scrypt(b, salt=sal, n=2 ** 14, r=8, p=1, dklen=32)
        return "scrypt$16384$8$1$" + base64.b64encode(sal).decode() + "$" + base64.b64encode(h).decode()
    except (AttributeError, ValueError):
        h = hashlib.pbkdf2_hmac("sha256", b, sal, 310_000)
        return "pbkdf2$310000$" + base64.b64encode(sal).decode() + "$" + base64.b64encode(h).decode()


def verificar(contrasena, guardado):
    try:
        partes = guardado.split("$")
        b = contrasena.encode("utf-8")
        if partes[0] == "scrypt":
            n, r, p, sal, h = int(partes[1]), int(partes[2]), int(partes[3]), base64.b64decode(partes[4]), base64.b64decode(partes[5])
            otro = hashlib.scrypt(b, salt=sal, n=n, r=r, p=p, dklen=len(h))
        elif partes[0] == "pbkdf2":
            it, sal, h = int(partes[1]), base64.b64decode(partes[2]), base64.b64decode(partes[3])
            otro = hashlib.pbkdf2_hmac("sha256", b, sal, it)
        else:
            return False
        return hmac.compare_digest(otro, h)
    except (ValueError, IndexError, TypeError):
        return False


HASH_FALSO = hashear(secrets.token_hex(8))   # para que «no existe» tarde lo mismo que «contraseña mala»
USUARIO_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{2,31}$")


def validar_contrasena(c):
    if not isinstance(c, str) or len(c) < 8:
        raise Falla("La contraseña necesita al menos 8 caracteres.")
    if len(c) > 200:
        raise Falla("La contraseña es demasiado larga.")


# ════════════════════════════════════════════════════════════════════════
#  Base de datos (SQLite, un archivo)
# ════════════════════════════════════════════════════════════════════════
ESQUEMA = """
CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY, usuario TEXT UNIQUE NOT NULL, hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'editor', estado TEXT NOT NULL DEFAULT 'pendiente', creado REAL, ultimo REAL);
CREATE TABLE IF NOT EXISTS sesiones(id TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado REAL, expira REAL, ultimo REAL, cliente TEXT, agente TEXT, ip TEXT);
CREATE TABLE IF NOT EXISTS publicaciones(slug TEXT PRIMARY KEY, titulo TEXT, usuario_id INTEGER, paginas INTEGER, archivos INTEGER,
  bytes INTEGER, creado REAL, actualizado REAL, enlace TEXT, commit_sha TEXT, estado TEXT, error TEXT);
CREATE TABLE IF NOT EXISTS proyectos(id TEXT PRIMARY KEY, usuario_id INTEGER, nombre TEXT, bytes INTEGER, creado REAL, paginas INTEGER);
CREATE TABLE IF NOT EXISTS invitaciones(id TEXT PRIMARY KEY, hash TEXT UNIQUE, creado REAL, expira REAL, usado_por INTEGER, nota TEXT);
CREATE TABLE IF NOT EXISTS actividad(id INTEGER PRIMARY KEY, t REAL, usuario TEXT, accion TEXT, detalle TEXT, ip TEXT);
"""


class Base:
    def __init__(self, ruta):
        self.lock = threading.RLock()
        nueva = not os.path.exists(ruta)
        self.c = sqlite3.connect(ruta, check_same_thread=False, timeout=15)
        self.c.row_factory = sqlite3.Row
        self.c.execute("PRAGMA journal_mode=WAL")
        self.c.execute("PRAGMA foreign_keys=ON")
        self.c.executescript(ESQUEMA)
        self.c.commit()
        if nueva:
            os.chmod(ruta, 0o600)

    def q(self, sql, *a):
        with self.lock:
            return [dict(r) for r in self.c.execute(sql, a).fetchall()]

    def uno(self, sql, *a):
        r = self.q(sql, *a)
        return r[0] if r else None

    def x(self, sql, *a):
        with self.lock:
            cur = self.c.execute(sql, a)
            self.c.commit()
            return cur.lastrowid if sql.lstrip().upper().startswith("INSERT") else cur.rowcount


# ════════════════════════════════════════════════════════════════════════
#  GitHub (sólo desde aquí: el token nunca sale del servidor)
# ════════════════════════════════════════════════════════════════════════
def huella_git(ruta):
    """El SHA-1 que GitHub le pone a un archivo (blob <tamaño>\\0<contenido>)."""
    h = hashlib.sha1(f"blob {os.path.getsize(ruta)}\0".encode())
    with open(ruta, "rb") as f:
        for trozo in iter(lambda: f.read(1 << 20), b""):
            h.update(trozo)
    return h.hexdigest()


class GitHub:
    def __init__(self, repo, token, rama):
        self.repo, self.token, self.rama = repo, token, rama

    def pedir(self, metodo, ruta, cuerpo=None, permiso="«Contents: Read and write»", intentos=3):
        url = GITHUB_API + ruta
        datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
        for i in range(intentos):
            req = urllib.request.Request(url, data=datos, method=metodo, headers={
                "Accept": "application/vnd.github+json", "Authorization": f"Bearer {self.token}",
                "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "librito-servidor/" + VERSION,
                **({"Content-Type": "application/json"} if datos is not None else {})})
            try:
                with urllib.request.urlopen(req, timeout=90) as r:
                    texto = r.read()
                    return json.loads(texto) if texto else None
            except urllib.error.HTTPError as e:
                try:
                    m = json.loads(e.read() or b"{}").get("message", "")
                except ValueError:
                    m = ""
                if e.code in (502, 503, 504) and i < intentos - 1:
                    time.sleep(2 * (i + 1))
                    continue
                f = Falla({401: "El token de GitHub no es válido o ya caducó (cámbialo en el panel → GitHub).",
                           403: f"Al token de GitHub le falta permiso ({permiso}).",
                           404: "GitHub no encontró eso (repositorio, rama o carpeta), o el token no tiene acceso."}.get(e.code, m or f"GitHub contestó {e.code}"), 502)
                f.estado_github = e.code
                f.mensaje_github = m
                raise f
            except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
                if i < intentos - 1:
                    time.sleep(2 * (i + 1))
                    continue
                raise Falla(f"No hay conexión con GitHub ({getattr(e, 'reason', e)}).", 502)

    # — Lo básico —
    def info(self):
        return self.pedir("GET", f"/repos/{self.repo}")

    def pages(self):
        try:
            pg = self.pedir("GET", f"/repos/{self.repo}/pages", permiso="«Pages: Read»", intentos=1)
            url = (pg or {}).get("html_url") or sitio_de(self.repo)
            return {"activo": True, "rama": ((pg or {}).get("source") or {}).get("branch", ""), "sitio": url if url.endswith("/") else url + "/", "estado": (pg or {}).get("status", "")}
        except Falla as e:
            if getattr(e, "estado_github", 0) == 404:
                return {"activo": False, "sitio": sitio_de(self.repo)}
            return {"activo": None, "sitio": sitio_de(self.repo), "error": str(e)}

    def encender_pages(self, rama):
        cuerpo = {"build_type": "legacy", "source": {"branch": rama, "path": "/"}}
        permiso = "«Pages: Read and write» y «Administration: Read and write»"
        try:
            self.pedir("POST", f"/repos/{self.repo}/pages", cuerpo, permiso=permiso, intentos=1)
        except Falla as e:
            if getattr(e, "estado_github", 0) not in (409, 422):
                raise
            self.pedir("PUT", f"/repos/{self.repo}/pages", cuerpo, permiso=permiso, intentos=1)

    def reconstruir(self):
        try:
            self.pedir("POST", f"/repos/{self.repo}/pages/builds", permiso="«Pages: Read and write»", intentos=1)
        except Falla:
            pass   # si no hay permiso de Pages, GitHub publica solo igual

    def ramas(self):
        l = self.pedir("GET", f"/repos/{self.repo}/branches?per_page=100") or []

        def fecha(b):
            try:
                k = self.pedir("GET", f"/repos/{self.repo}/git/commits/{b['commit']['sha']}", intentos=1)
                return (k.get("committer") or {}).get("date", "")
            except Falla:
                return ""
        with concurrent.futures.ThreadPoolExecutor(4) as ex:
            fechas = list(ex.map(fecha, l[:12]))
        r = [{"nombre": b["name"], "fecha": f} for b, f in zip(l[:12], fechas)]
        r.sort(key=lambda x: x["fecha"], reverse=True)
        return r + [{"nombre": b["name"], "fecha": ""} for b in l[12:]]

    # — Git por dentro —
    def cabeza(self):
        ref = self.pedir("GET", f"/repos/{self.repo}/git/ref/heads/{urllib.parse.quote(self.rama)}")
        commit = self.pedir("GET", f"/repos/{self.repo}/git/commits/{ref['object']['sha']}")
        return commit["sha"], commit["tree"]["sha"]

    def bajo(self, arbol, ruta):
        """Los archivos que hay bajo `ruta` ({ruta_relativa: sha}), bajando carpeta por carpeta (sin pedir el árbol entero)."""
        sha = arbol
        for parte in [p for p in ruta.split("/") if p]:
            t = self.pedir("GET", f"/repos/{self.repo}/git/trees/{sha}")
            hijo = next((n for n in t.get("tree", []) if n["path"] == parte and n["type"] == "tree"), None)
            if not hijo:
                return {}
            sha = hijo["sha"]
        t = self.pedir("GET", f"/repos/{self.repo}/git/trees/{sha}?recursive=1")
        return {n["path"]: n["sha"] for n in t.get("tree", []) if n["type"] == "blob"}

    def carpetas_bajo(self, arbol, ruta):
        sha = arbol
        for parte in [p for p in ruta.split("/") if p]:
            t = self.pedir("GET", f"/repos/{self.repo}/git/trees/{sha}")
            hijo = next((n for n in t.get("tree", []) if n["path"] == parte and n["type"] == "tree"), None)
            if not hijo:
                return set()
            sha = hijo["sha"]
        t = self.pedir("GET", f"/repos/{self.repo}/git/trees/{sha}")
        return {n["path"] for n in t.get("tree", []) if n["type"] == "tree"}

    def leer(self, ruta, ref):
        try:
            r = self.pedir("GET", f"/repos/{self.repo}/contents/{urllib.parse.quote(ruta)}?ref={ref}", intentos=2)
            return base64.b64decode(r.get("content", "")) if r else None
        except Falla as e:
            if getattr(e, "estado_github", 0) == 404:
                return None
            raise

    def blob(self, datos):
        if len(datos) > 95 * 1024 * 1024:
            raise Falla("Un archivo pesa más de 95 MB: GitHub no lo acepta. Achícalo en el editor (Recursos → Optimizar).")
        return self.pedir("POST", f"/repos/{self.repo}/git/blobs", {"content": base64.b64encode(datos).decode(), "encoding": "base64"})["sha"]

    def confirmar(self, armar, mensaje):
        """Un commit con lo que devuelva armar(arbol_base) (que se vuelve a armar si la rama se movió mientras tanto)."""
        for intento in range(4):
            commit, arbol = self.cabeza()
            entradas = armar(commit, arbol)
            nuevo_arbol = self.pedir("POST", f"/repos/{self.repo}/git/trees", {"base_tree": arbol, "tree": entradas})["sha"]
            nuevo = self.pedir("POST", f"/repos/{self.repo}/git/commits", {"message": mensaje, "tree": nuevo_arbol, "parents": [commit]})["sha"]
            try:
                self.pedir("PATCH", f"/repos/{self.repo}/git/refs/heads/{urllib.parse.quote(self.rama)}", {"sha": nuevo, "force": False}, intentos=1)
                return nuevo
            except Falla as e:
                if getattr(e, "estado_github", 0) == 422 and intento < 3:
                    time.sleep(1 + intento)
                    continue
                raise
        raise Falla("La rama cambió varias veces mientras publicaba; inténtalo otra vez.", 409)


def sitio_de(repo):
    dueno, _, nombre = (repo or "/").partition("/")
    if nombre.lower() == f"{dueno.lower()}.github.io":
        return f"https://{dueno.lower()}.github.io/"
    return f"https://{dueno.lower()}.github.io/{nombre}/"


# ════════════════════════════════════════════════════════════════════════
#  El servidor: estado compartido
# ════════════════════════════════════════════════════════════════════════
class Estado:
    def __init__(self):
        for d in ("publicaciones", "proyectos", "tmp"):
            os.makedirs(os.path.join(DATOS, d), exist_ok=True)
        os.chmod(DATOS, 0o700)
        self.aj = Ajustes()
        self.caja = Caja()
        self.db = Base(os.path.join(DATOS, "librito.db"))
        self.trabajos = {}
        self.lock_trabajos = threading.Lock()
        self.lock_github = threading.Lock()      # un commit a la vez
        self.lock_nombres = threading.Lock()
        self.url_tunel = ""
        self.anunciada = ""
        self._sitio = None
        self._carpetas = (0, set())
        self.intentos = {}                       # ip/usuario → [fallos, bloqueado_hasta]
        self.lock_intentos = threading.Lock()
        self.codigo_instalacion = None
        if not self.db.uno("SELECT id FROM usuarios WHERE rol='admin' AND estado='activo'"):
            self.codigo_instalacion = "-".join("".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(4)) for _ in range(2))
            escribir_seguro(os.path.join(DATOS, "codigo-instalacion.txt"), self.codigo_instalacion + "\n")
        for f in os.listdir(os.path.join(DATOS, "tmp")):
            try:
                p = os.path.join(DATOS, "tmp", f)
                shutil.rmtree(p) if os.path.isdir(p) else os.unlink(p)
            except OSError:
                pass

    # — GitHub —
    def github(self):
        g = self.aj["github"]
        token = self.caja.leer().get("github_token", "")
        if not (g.get("repo") and g.get("rama") and token):
            return None
        return GitHub(g["repo"], token, g["rama"])

    def sitio(self):
        gh = self.github()
        if not gh:
            return ""
        if not self._sitio or self._sitio[0] != gh.repo or ahora() - self._sitio[2] > 600:
            pg = gh.pages()
            self._sitio = (gh.repo, pg.get("sitio") or sitio_de(gh.repo), ahora())
        return self._sitio[1]

    def url_publica(self):
        return (self.aj["url_publica"] or self.url_tunel or "").rstrip("/")

    def origenes(self):
        o = set(x.rstrip("/") for x in self.aj["origenes"] if isinstance(x, str))
        repo = self.aj["github"].get("repo") or ""
        if "/" in repo:
            o.add(f"https://{repo.split('/')[0].lower()}.github.io")
        return o

    def actividad(self, usuario, accion, detalle="", ip=""):
        self.db.x("INSERT INTO actividad(t,usuario,accion,detalle,ip) VALUES(?,?,?,?,?)", ahora(), usuario or "", accion, str(detalle)[:300], ip or "")
        if secrets.randbelow(50) == 0:
            self.db.x("DELETE FROM actividad WHERE id < (SELECT MAX(id) - 3000 FROM actividad)")

    # — Freno a la fuerza bruta —
    def frenado(self, clave):
        with self.lock_intentos:
            f = self.intentos.get(clave)
            return f and f[1] > ahora()

    def fallo(self, clave, limite=5, base=60):
        with self.lock_intentos:
            f = self.intentos.setdefault(clave, [0, 0])
            f[0] += 1
            if f[0] >= limite:
                f[1] = ahora() + min(3600, base * 2 ** (f[0] - limite))

    def acierto(self, clave):
        with self.lock_intentos:
            self.intentos.pop(clave, None)

    # — Trabajos largos (publicar, quitar): el editor pregunta cómo van —
    def trabajo(self, tipo, usuario_id, funcion, *args):
        t = {"id": secrets.token_urlsafe(12), "tipo": tipo, "estado": "esperando", "paso": "En la fila…", "hechos": 0, "total": 0,
             "resultado": None, "error": "", "usuario_id": usuario_id, "t": ahora()}
        with self.lock_trabajos:
            for k in [k for k, v in self.trabajos.items() if ahora() - v["t"] > 3600]:
                del self.trabajos[k]
            self.trabajos[t["id"]] = t

        def correr():
            try:
                with self.lock_github:
                    t["estado"] = "trabajando"
                    t["resultado"] = funcion(t, *args)
                t["estado"], t["paso"] = "listo", "¡Listo!"
            except Falla as e:
                t["estado"], t["error"] = "error", str(e)
            except Exception as e:   # noqa: BLE001 — que un error raro nunca tumbe el servidor
                log("Error en un trabajo:", repr(e))
                t["estado"], t["error"] = "error", "Algo salió mal en el servidor (está en servidor.log)."
        threading.Thread(target=correr, daemon=True).start()
        return t

    # — Nombres de las publicaciones —
    def carpetas_github(self):
        if ahora() - self._carpetas[0] < 60:
            return self._carpetas[1]
        gh = self.github()
        nombres = set()
        if gh:
            try:
                _, arbol = gh.cabeza()
                nombres = gh.carpetas_bajo(arbol, CARPETA_PUB)
            except Falla as e:
                log("No pude ver las carpetas de GitHub:", e)
        self._carpetas = (ahora(), nombres)
        return nombres

    def reservar_nombre(self, base_nombre, usuario_id, titulo):
        with self.lock_nombres:
            usados = {r["slug"] for r in self.db.q("SELECT slug FROM publicaciones")} | self.carpetas_github() | RESERVADOS
            slug, n = base_nombre, 2
            while slug in usados:
                sufijo = f"-{n}"
                slug = base_nombre[:40 - len(sufijo)] + sufijo
                n += 1
            self.db.x("INSERT INTO publicaciones(slug,titulo,usuario_id,creado,actualizado,estado) VALUES(?,?,?,?,?,?)", slug, titulo, usuario_id, ahora(), ahora(), "preparando")
            self._carpetas[1].add(slug)
            return slug


E = None   # el Estado, al arrancar


# ════════════════════════════════════════════════════════════════════════
#  Los .zip que llegan: revisados antes de abrirlos
# ════════════════════════════════════════════════════════════════════════
def ruta_segura(r):
    if not r or len(r) > 300 or "\\" in r or "\0" in r or r.startswith("/") or re.match(r"^[a-zA-Z]:", r):
        return False
    partes = r.split("/")
    return all(p not in ("", ".", "..") for p in partes)


def revisar_zip(ruta, maximo_total):
    """Devuelve (entradas [(ZipInfo, ruta_dentro)], ficha publicar.json). Lanza Falla si algo huele mal."""
    try:
        z = zipfile.ZipFile(ruta)
    except zipfile.BadZipFile:
        raise Falla("Eso no es un .zip válido.")
    with z:
        infos = [i for i in z.infolist() if not i.is_dir()]
        if not infos:
            raise Falla("El .zip viene vacío.")
        if len(infos) > 6000:
            raise Falla("El .zip trae demasiados archivos.")
        if sum(i.file_size for i in infos) > maximo_total:
            raise Falla("Lo que viene dentro del .zip pesa demasiado.")
        nombres = [i.filename for i in infos]
        prefijo = ""
        if "index.html" not in nombres:
            primeros = {n.split("/")[0] for n in nombres if not n.startswith("__MACOSX/")}
            if len(primeros) == 1 and all("/" in n for n in nombres if not n.startswith("__MACOSX/")):
                prefijo = primeros.pop() + "/"
        entradas, ficha = [], {}
        for i in infos:
            n = i.filename
            if n.startswith("__MACOSX/") or n.endswith(".DS_Store"):
                continue
            if not n.startswith(prefijo):
                continue
            rel = n[len(prefijo):]
            if not ruta_segura(rel):
                raise Falla(f"El .zip trae una ruta no permitida: {n[:80]}")
            if stat.S_ISLNK(i.external_attr >> 16):
                raise Falla("El .zip trae enlaces simbólicos: no se aceptan.")
            if rel == "project.json" or rel.startswith("EditorData/"):
                continue     # nunca se publica lo editable
            if rel == "publicar.json":
                try:
                    ficha = json.loads(z.read(i).decode("utf-8"))
                except (ValueError, UnicodeDecodeError):
                    ficha = {}
                continue
            entradas.append((i, rel))
        if not any(rel == "index.html" for _, rel in entradas):
            raise Falla("El .zip no trae index.html (¿es el que arma el editor?).")
        return entradas, ficha if isinstance(ficha, dict) else {}


def abrir_zip(ruta, entradas, destino):
    os.makedirs(destino, exist_ok=True)
    base = os.path.realpath(destino)
    total = 0
    with zipfile.ZipFile(ruta) as z:
        for info, rel in entradas:
            final = os.path.realpath(os.path.join(base, rel))
            if not final.startswith(base + os.sep):
                raise Falla("Ruta no permitida dentro del .zip.")
            os.makedirs(os.path.dirname(final), exist_ok=True)
            with z.open(info) as src, open(final, "wb") as dst:
                shutil.copyfileobj(src, dst, 1 << 20)
            total += os.path.getsize(final)
    return total


def archivos_de(carpeta):
    out = []
    for raiz, dirs, archivos in os.walk(carpeta):
        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(raiz, d))]
        for a in archivos:
            p = os.path.join(raiz, a)
            if not os.path.islink(p):
                out.append((os.path.relpath(p, carpeta).replace(os.sep, "/"), p))
    return sorted(out)


def tamano_carpeta(c):
    return sum(os.path.getsize(p) for _, p in archivos_de(c)) if os.path.isdir(c) else 0


# ════════════════════════════════════════════════════════════════════════
#  Publicar y quitar (corren como trabajos, de uno en uno)
# ════════════════════════════════════════════════════════════════════════
def _lista_nueva(gh, commit, quitar=None, poner=None):
    crudo = gh.leer(f"{CARPETA_PUB}/lista.json", commit)
    try:
        lista = json.loads(crudo.decode("utf-8")).get("paginas", []) if crudo else []
    except ValueError:
        lista = []
    lista = [p for p in lista if p.get("slug") not in {quitar, (poner or {}).get("slug")}]
    if poner:
        lista.insert(0, poner)
    return json.dumps({"paginas": lista}, ensure_ascii=False, indent=1).encode("utf-8") + b"\n"


def trabajo_publicar(t, slug, carpeta, ficha, usuario):
    pub = E.db.uno("SELECT * FROM publicaciones WHERE slug=?", slug)
    titulo, paginas = pub["titulo"], pub["paginas"] or 0
    archivos = archivos_de(carpeta)
    gh = E.github()
    local = f"/p/{slug}/"
    if not gh:
        E.db.x("UPDATE publicaciones SET estado='local', actualizado=?, enlace=?, error='' WHERE slug=?", ahora(), "", slug)
        t["paso"] = "Guardada en el servidor (GitHub todavía no está conectado)."
        return {"slug": slug, "enlace": "", "local": local, "github": False}
    base = f"{CARPETA_PUB}/{slug}"
    t["paso"], t["total"] = "Comparando con lo que ya está en GitHub…", len(archivos)
    huellas = {rel: huella_git(p) for rel, p in archivos}
    subidos, lock = set(), threading.Lock()

    def subir(item):
        rel, p = item
        with open(p, "rb") as f:
            sha = gh.blob(f.read())
        with lock:
            subidos.add(rel)
            t["hechos"] += 1
            t["paso"] = f"Subiendo a GitHub: {t['hechos']} de {t['total']}…"
        return sha

    sitio = E.sitio() or sitio_de(gh.repo)
    enlace = f"{sitio}{base}/"
    estado_final = {}

    def armar(commit, arbol):
        viejos = gh.bajo(arbol, base)
        cambian = [(rel, p) for rel, p in archivos if viejos.get(f"{rel}") != huellas[rel]]
        faltan = [(rel, p) for rel, p in cambian if rel not in subidos]
        t["hechos"] = len(archivos) - len(faltan)
        if faltan:
            with concurrent.futures.ThreadPoolExecutor(2) as ex:   # 2 a la vez: el teléfono viejo no se ahoga
                list(ex.map(subir, faltan))
        t["paso"] = "Guardando en GitHub…"
        entradas = [{"path": f"{base}/{rel}", "mode": "100644", "type": "blob", "sha": huellas[rel]} for rel, _ in cambian]
        nuevos = {rel for rel, _ in archivos}
        borrar = [r for r in viejos if r not in nuevos]
        entradas += [{"path": f"{base}/{r}", "mode": "100644", "type": "blob", "sha": None} for r in borrar]
        ficha_lista = {"slug": slug, "titulo": titulo, "paginas": paginas, "fecha": iso(), "enlace": enlace}
        entradas.append({"path": f"{CARPETA_PUB}/lista.json", "mode": "100644", "type": "blob", "sha": gh.blob(_lista_nueva(gh, commit, poner=ficha_lista))})
        estado_final.update(subidos=len(cambian), borrados=len(borrar))
        return entradas

    sha = gh.confirmar(armar, f"Publicar «{titulo}» desde el servidor ({usuario})")
    gh.reconstruir()
    E.db.x("UPDATE publicaciones SET estado='publicada', actualizado=?, enlace=?, commit_sha=?, error='' WHERE slug=?", ahora(), enlace, sha, slug)
    E._carpetas[1].add(slug)
    return {"slug": slug, "enlace": enlace, "local": local, "github": True, **estado_final}


def trabajo_quitar(t, slug, usuario):
    gh = E.github()
    if gh:
        base = f"{CARPETA_PUB}/{slug}"
        t["paso"] = "Quitándola de GitHub…"

        def armar(commit, arbol):
            viejos = gh.bajo(arbol, base)
            entradas = [{"path": f"{base}/{r}", "mode": "100644", "type": "blob", "sha": None} for r in viejos]
            entradas.append({"path": f"{CARPETA_PUB}/lista.json", "mode": "100644", "type": "blob", "sha": gh.blob(_lista_nueva(gh, commit, quitar=slug))})
            return entradas
        gh.confirmar(armar, f"Quitar «{slug}» (desde el servidor, {usuario})")
        gh.reconstruir()
        E._carpetas[1].discard(slug)
    shutil.rmtree(os.path.join(DATOS, "publicaciones", slug), ignore_errors=True)
    E.db.x("DELETE FROM publicaciones WHERE slug=?", slug)
    return {"slug": slug}


def anunciar_direccion():
    """Escribe servidor.json en tu sitio para que el editor encuentre el servidor solo."""
    url = E.url_publica()
    gh = E.github()
    if not (url and gh and E.aj["anunciar"]) or url == E.anunciada:
        return
    cuerpo = json.dumps({"url": url, "nombre": E.aj["nombre"], "actualizado": iso()}, ensure_ascii=False, indent=1).encode() + b"\n"

    def hacer(t):
        def armar(commit, arbol):
            actual = gh.leer(ARCHIVO_ANUNCIO, commit)
            if actual:
                try:
                    if json.loads(actual).get("url") == url:
                        return []
                except ValueError:
                    pass
            return [{"path": ARCHIVO_ANUNCIO, "mode": "100644", "type": "blob", "sha": gh.blob(cuerpo)}]
        commit, arbol = gh.cabeza()
        if not armar(commit, arbol):
            return {}
        gh.confirmar(armar, "Dirección del servidor del librito")
        gh.reconstruir()
        return {}
    E.anunciada = url
    E.trabajo("anunciar", None, hacer)
    log("La dirección del servidor se anuncia en", ARCHIVO_ANUNCIO, "→", url)


# ════════════════════════════════════════════════════════════════════════
#  El túnel (cloudflared): para que el editor en internet llegue al teléfono
# ════════════════════════════════════════════════════════════════════════
class Tunel(threading.Thread):
    URL = re.compile(r"https://[-a-z0-9]+\.trycloudflare\.com")

    def __init__(self, puerto):
        super().__init__(daemon=True)
        self.puerto, self.proc, self.parar = puerto, None, False

    def run(self):
        espera = 5
        while not self.parar:
            exe = shutil.which("cloudflared")
            if not exe:
                log("Túnel: no está cloudflared (instálalo con «pkg install cloudflared»). El servidor sólo se ve en tu red.")
                return
            log("Túnel: abriendo con cloudflared…")
            try:
                self.proc = subprocess.Popen([exe, "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{self.puerto}"],
                                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            except OSError as e:
                log("Túnel: no se pudo abrir:", e)
                return
            inicio = ahora()
            for linea in self.proc.stdout:
                m = self.URL.search(linea)
                if m and m.group(0) != E.url_tunel:
                    E.url_tunel = m.group(0)
                    log("Túnel listo:", E.url_tunel)
                    try:
                        anunciar_direccion()
                    except Exception as e:   # noqa: BLE001
                        log("No se pudo anunciar la dirección:", e)
            self.proc.wait()
            E.url_tunel = ""
            if self.parar:
                return
            espera = 5 if ahora() - inicio > 120 else min(300, espera * 2)
            log(f"Túnel: se cerró; lo vuelvo a abrir en {espera} s.")
            time.sleep(espera)

    def cerrar(self):
        self.parar = True
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()


TUNEL = None


# ════════════════════════════════════════════════════════════════════════
#  HTTP
# ════════════════════════════════════════════════════════════════════════
RUTAS = []


def ruta(metodo, patron, quien="todos"):
    """quien: todos · sesion · admin"""
    def poner(f):
        RUTAS.append((metodo, re.compile("^" + patron + "$"), quien, f))
        return f
    return poner


class Manejador(BaseHTTPRequestHandler):
    server_version = "librito"
    sys_version = ""
    protocol_version = "HTTP/1.1"
    timeout = 120

    def log_message(self, *a):   # el registro propio ya cuenta lo importante
        pass

    # — Quién y desde dónde —
    def ip(self):
        ip = self.client_address[0]
        if ip in ("127.0.0.1", "::1"):
            ip = (self.headers.get("CF-Connecting-IP") or (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip() or ip)
        return ip[:64]

    def de_aqui(self):
        """¿Llega por este mismo teléfono (el túnel)? Sólo entonces se creen las cabeceras X-Forwarded-*."""
        return self.client_address[0] in ("127.0.0.1", "::1")

    def es_https(self):
        return self.de_aqui() and (self.headers.get("X-Forwarded-Proto") == "https" or "https" in (self.headers.get("Cf-Visitor") or ""))

    def mi_origen(self):
        host = (self.de_aqui() and self.headers.get("X-Forwarded-Host")) or self.headers.get("Host") or ""
        return ("https://" if self.es_https() else "http://") + host

    def es_mio(self, o):
        return o == self.mi_origen() or (bool(E.url_publica()) and o == E.url_publica())

    def origen_ok(self, o):
        if not o or self.es_mio(o):
            return True
        if o in E.origenes():
            return True
        if E.aj["permitir_local"] and re.match(r"^http://(localhost|127\.0\.0\.1)(:\d+)?$", o):
            return True
        return False

    # — Respuestas —
    def cabeceras_comunes(self, extra=None):
        o = self.headers.get("Origin")
        if o and not self.es_mio(o) and self.origen_ok(o):
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Access-Control-Expose-Headers", "Content-Disposition")
        self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        for k, v in (extra or {}).items():
            self.send_header(k, v)

    def responder(self, codigo, cuerpo=b"", tipo="application/json; charset=utf-8", extra=None):
        if isinstance(cuerpo, (dict, list)):
            cuerpo = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        elif isinstance(cuerpo, str):
            cuerpo = cuerpo.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        if tipo.startswith("application/json"):
            self.send_header("Cache-Control", "no-store")
        self.cabeceras_comunes(extra)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(cuerpo)

    def error(self, codigo, mensaje):
        self.responder(codigo, {"error": mensaje})

    def archivo(self, ruta, extra=None, cache="no-cache"):
        tam = os.path.getsize(ruta)
        ext = os.path.splitext(ruta)[1].lower()
        tipo = MIME_EXTRA.get(ext) or mimetypes.guess_type(ruta)[0] or "application/octet-stream"
        if tipo.startswith("text/") or tipo in ("application/json", "application/manifest+json"):
            tipo += "; charset=utf-8"
        ini, fin, codigo = 0, tam - 1, 200
        rango = self.headers.get("Range")
        m = re.match(r"^bytes=(\d*)-(\d*)$", rango or "")
        if m and tam:
            if m.group(1):
                ini = int(m.group(1))
                fin = min(int(m.group(2)) if m.group(2) else tam - 1, tam - 1)
            elif m.group(2):
                ini = max(0, tam - int(m.group(2)))
            if ini > fin or ini >= tam:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{tam}")
                self.send_header("Content-Length", "0")
                self.cabeceras_comunes()
                self.end_headers()
                return
            codigo = 206
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(fin - ini + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", cache)
        if codigo == 206:
            self.send_header("Content-Range", f"bytes {ini}-{fin}/{tam}")
        self.cabeceras_comunes(extra)
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(ruta, "rb") as f:
            f.seek(ini)
            falta = fin - ini + 1
            while falta > 0:
                trozo = f.read(min(1 << 16, falta))
                if not trozo:
                    break
                self.wfile.write(trozo)
                falta -= len(trozo)

    # — Lo que llega —
    def cuerpo_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 64 * 1024:
            raise Falla("Demasiado grande.", 413)
        if n and "json" not in (self.headers.get("Content-Type") or ""):
            raise Falla("Se esperaba JSON.", 415)
        try:
            return json.loads(self.rfile.read(n) or b"{}") if n else {}
        except ValueError:
            raise Falla("JSON inválido.")

    def cuerpo_a_archivo(self):
        try:
            n = int(self.headers.get("Content-Length") or -1)
        except ValueError:
            n = -1
        if n < 0:
            raise Falla("Falta el tamaño de lo que se sube (Content-Length).", 411)
        if n > E.aj["max_subida_mb"] * 1024 * 1024:
            self.close_connection = True
            raise Falla(f"Pesa más de {E.aj['max_subida_mb']} MB (se puede cambiar en el panel → Ajustes).", 413)
        fd, tmp = tempfile.mkstemp(dir=os.path.join(DATOS, "tmp"), suffix=".zip")
        try:
            with os.fdopen(fd, "wb") as f:
                falta = n
                while falta > 0:
                    trozo = self.rfile.read(min(1 << 20, falta))
                    if not trozo:
                        raise Falla("La subida se cortó.", 400)
                    f.write(trozo)
                    falta -= len(trozo)
        except BaseException:
            os.unlink(tmp)
            raise
        return tmp

    def parametros(self):
        return {k: v[0] for k, v in urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).items()}

    # — La sesión: «Authorization: Bearer …» (editor) o la galleta del panel —
    def sesion(self):
        token, por_galleta = "", False
        a = self.headers.get("Authorization") or ""
        if a.startswith("Bearer "):
            token = a[7:].strip()
        else:
            for parte in (self.headers.get("Cookie") or "").split(";"):
                k, _, v = parte.strip().partition("=")
                if k == "librito_sesion":
                    token, por_galleta = v, True
        if not token or len(token) > 200:
            return None
        if por_galleta and self.command not in ("GET", "HEAD"):
            # Defensa extra contra pedidos falsificados: la galleta sólo vale desde el propio panel.
            o = self.headers.get("Origin")
            if self.headers.get("X-Librito") != "panel" or (o and not self.es_mio(o)):
                return None
        sid = hashlib.sha256(token.encode()).hexdigest()
        s = E.db.uno("SELECT s.*, u.usuario, u.rol, u.estado FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id WHERE s.id=?", sid)
        if not s or s["expira"] < ahora() or s["estado"] != "activo":
            return None
        if ahora() - (s["ultimo"] or 0) > 300:
            E.db.x("UPDATE sesiones SET ultimo=?, ip=? WHERE id=?", ahora(), self.ip(), sid)
            E.db.x("UPDATE usuarios SET ultimo=? WHERE id=?", ahora(), s["usuario_id"])
        return s

    # — Reparto —
    def atender(self):
        partes = urllib.parse.urlsplit(self.path)
        camino = urllib.parse.unquote(partes.path)
        if camino.startswith("/api/"):
            o = self.headers.get("Origin")
            if o and not self.origen_ok(o):
                return self.error(403, "Este origen no puede usar el servidor (agrégalo en el panel → Ajustes → Orígenes).")
            for metodo, patron, quien, f in RUTAS:
                m = patron.match(camino)
                if m and metodo == self.command.replace("HEAD", "GET"):
                    s = self.sesion() if quien != "todos" or camino in ("/api/yo", "/api/salir") else None
                    if quien != "todos" and not s:
                        return self.error(401, "Inicia sesión otra vez.")
                    if quien == "admin" and s["rol"] != "admin":
                        return self.error(403, "Sólo un administrador puede hacer esto.")
                    try:
                        return f(self, s, *m.groups())
                    except Falla as e:
                        return self.error(e.codigo, str(e))
            return self.error(404, "No existe esa ruta de la API.")
        if self.command not in ("GET", "HEAD"):
            return self.error(405, "Método no permitido.")
        return self.estatico(camino)

    def do_OPTIONS(self):
        o = self.headers.get("Origin")
        if not o or not self.origen_ok(o):
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", o)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Librito")
        self.send_header("Access-Control-Max-Age", "600")
        if self.headers.get("Access-Control-Request-Private-Network") == "true":
            self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _seguro(self):
        try:
            self.atender()
        except Falla as e:
            self.error(e.codigo, str(e))
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:   # noqa: BLE001
            log("Error atendiendo", self.command, self.path.split("?")[0], repr(e))
            try:
                self.error(500, "Algo salió mal en el servidor.")
            except OSError:
                pass

    do_GET = do_HEAD = do_POST = do_PUT = do_PATCH = do_DELETE = _seguro

    # — Archivos: el panel y las publicaciones guardadas aquí —
    def estatico(self, camino):
        if camino in ("/", "/index.html"):
            return self.panel("index.html")
        if camino.startswith("/panel/"):
            return self.panel(camino[7:])
        if camino == "/favicon.ico":
            return self.panel("icono.svg")
        m = re.match(r"^/p/([a-z0-9-]{1,40})(/.*)?$", camino)
        if m:
            slug, resto = m.group(1), m.group(2)
            if resto is None:
                return self.responder(301, b"", "text/plain", {"Location": f"/p/{slug}/"})
            base = os.path.realpath(os.path.join(DATOS, "publicaciones", slug))
            rel = resto.lstrip("/") or "index.html"
            if rel.endswith("/"):
                rel += "index.html"
            final = os.path.realpath(os.path.join(base, rel))
            if not final.startswith(base + os.sep) or not os.path.isfile(final):
                return self.error(404, "No existe.")
            # Lo publicado corre AISLADO (origen opaco): aunque traiga JavaScript,
            # no puede tocar el panel ni la API del servidor con tu sesión.
            return self.archivo(final, {
                "Content-Security-Policy": "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads allow-pointer-lock allow-presentation allow-orientation-lock",
                "X-Robots-Tag": "noindex, nofollow", "X-Frame-Options": "SAMEORIGIN"}, cache="public, max-age=300")
        return self.error(404, "No existe.")

    def panel(self, nombre):
        if not re.match(r"^[a-z0-9-]+\.(html|css|js|svg)$", nombre or ""):
            return self.error(404, "No existe.")
        p = os.path.join(PANEL, nombre)
        if not os.path.isfile(p):
            return self.error(404, "No existe.")
        self.archivo(p, {
            "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
            "X-Frame-Options": "DENY"})


# ════════════════════════════════════════════════════════════════════════
#  La API
# ════════════════════════════════════════════════════════════════════════
def publico_usuario(u):
    return {"id": u["id"], "usuario": u["usuario"], "rol": u["rol"], "estado": u["estado"], "creado": u.get("creado"), "ultimo": u.get("ultimo")}


def nueva_sesion(h, u, cliente, recordar):
    token = secrets.token_urlsafe(32)
    dura = 30 * 86400 if recordar else 12 * 3600
    E.db.x("INSERT INTO sesiones(id,usuario_id,creado,expira,ultimo,cliente,agente,ip) VALUES(?,?,?,?,?,?,?,?)",
           hashlib.sha256(token.encode()).hexdigest(), u["id"], ahora(), ahora() + dura, ahora(), cliente,
           (h.headers.get("User-Agent") or "")[:160], h.ip())
    E.db.x("DELETE FROM sesiones WHERE expira < ?", ahora())
    return token, dura


@ruta("GET", "/api/info")
def api_info(h, s):
    sitio = E.sitio() if E.github() else ""
    h.responder(200, {
        "nombre": E.aj["nombre"], "version": VERSION, "registro": E.aj["registro"],
        "instalado": E.codigo_instalacion is None, "github": bool(E.github()), "sitio": sitio,
        "url_publica": E.url_publica(), "editor": (sitio + "EditorDev/") if sitio else "",
        "max_subida_mb": E.aj["max_subida_mb"]})


@ruta("POST", "/api/instalar")
def api_instalar(h, s):
    if E.codigo_instalacion is None:
        raise Falla("El servidor ya tiene administrador.", 409)
    ip = h.ip()
    if E.frenado("instalar:" + ip):
        raise Falla("Demasiados intentos. Espera un poco.", 429)
    d = h.cuerpo_json()
    if not hmac.compare_digest(str(d.get("codigo", "")).strip().upper().encode(), E.codigo_instalacion.encode()):
        E.fallo("instalar:" + ip, limite=5)
        raise Falla("El código de instalación no es ese (míralo en la terminal de Termux).", 403)
    usuario = str(d.get("usuario", "")).strip().lower()
    if not USUARIO_RE.match(usuario):
        raise Falla("El usuario: de 3 a 32 letras minúsculas, números, punto, guion o guion bajo.")
    validar_contrasena(d.get("contrasena"))
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        E.db.x("UPDATE usuarios SET hash=?, rol='admin', estado='activo' WHERE usuario=?", hashear(d["contrasena"]), usuario)
    else:
        E.db.x("INSERT INTO usuarios(usuario,hash,rol,estado,creado) VALUES(?,?,?,?,?)", usuario, hashear(d["contrasena"]), "admin", "activo", ahora())
    E.codigo_instalacion = None
    try:
        os.unlink(os.path.join(DATOS, "codigo-instalacion.txt"))
    except OSError:
        pass
    E.actividad(usuario, "instalar", "Primer administrador", ip)
    log("Administrador creado:", usuario)
    u = E.db.uno("SELECT * FROM usuarios WHERE usuario=?", usuario)
    return entrar_y_responder(h, u, d)


def entrar_y_responder(h, u, d):
    cliente = "editor" if d.get("cliente") == "editor" else "panel"
    token, dura = nueva_sesion(h, u, cliente, bool(d.get("recordar", True)))
    cuerpo = {"usuario": publico_usuario(u)}
    extra = {}
    if cliente == "editor":
        cuerpo["token"] = token
    else:
        extra["Set-Cookie"] = f"librito_sesion={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={dura}" + ("; Secure" if h.es_https() else "")
    h.responder(200, cuerpo, extra=extra)


@ruta("POST", "/api/registro")
def api_registro(h, s):
    modo = E.aj["registro"]
    if modo == "cerrado":
        raise Falla("El registro está cerrado. Pídele una cuenta a quien administra el servidor.", 403)
    ip = h.ip()
    if E.frenado("registro:" + ip):
        raise Falla("Demasiados registros desde aquí. Espera un rato.", 429)
    d = h.cuerpo_json()
    usuario = str(d.get("usuario", "")).strip().lower()
    if not USUARIO_RE.match(usuario):
        raise Falla("El usuario: de 3 a 32 letras minúsculas, números, punto, guion o guion bajo.")
    validar_contrasena(d.get("contrasena"))
    inv = None
    if modo == "codigo":
        codigo = str(d.get("codigo", "")).strip().upper()
        inv = E.db.uno("SELECT * FROM invitaciones WHERE hash=? AND usado_por IS NULL AND expira>?", hashlib.sha256(codigo.encode()).hexdigest(), ahora())
        if not inv:
            E.fallo("registro:" + ip, limite=8)
            raise Falla("Ese código de invitación no sirve (o ya se usó).", 403)
    elif (E.db.uno("SELECT COUNT(*) n FROM usuarios WHERE estado='pendiente'") or {}).get("n", 0) >= 30:
        raise Falla("Hay demasiadas cuentas esperando aprobación. Inténtalo más tarde.", 429)
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        raise Falla("Ese usuario ya existe.", 409)
    estado = "activo" if inv else "pendiente"
    uid = E.db.x("INSERT INTO usuarios(usuario,hash,rol,estado,creado) VALUES(?,?,?,?,?)", usuario, hashear(d["contrasena"]), "editor", estado, ahora())
    if inv:
        E.db.x("UPDATE invitaciones SET usado_por=? WHERE id=?", uid, inv["id"])
    E.fallo("registro:" + ip, limite=6, base=600)   # cuenta los registros: muchos seguidos frenan
    E.actividad(usuario, "registro", "con invitación" if inv else "espera aprobación", ip)
    if estado == "activo":
        return entrar_y_responder(h, E.db.uno("SELECT * FROM usuarios WHERE id=?", uid), d)
    h.responder(202, {"pendiente": True, "mensaje": "Listo. Tu cuenta espera que el administrador la apruebe."})


@ruta("POST", "/api/entrar")
def api_entrar(h, s):
    d = h.cuerpo_json()
    usuario = str(d.get("usuario", "")).strip().lower()[:40]
    ip = h.ip()
    if E.frenado("ip:" + ip) or E.frenado("u:" + usuario):
        raise Falla("Demasiados intentos. Espera unos minutos y vuelve a probar.", 429)
    u = E.db.uno("SELECT * FROM usuarios WHERE usuario=?", usuario)
    ok = verificar(str(d.get("contrasena", ""))[:200], u["hash"] if u else HASH_FALSO)
    if not (u and ok):
        E.fallo("ip:" + ip, limite=10)
        E.fallo("u:" + usuario, limite=5)
        E.actividad(usuario, "entrar-fallo", "", ip)
        raise Falla("Usuario o contraseña incorrectos.", 401)
    if u["estado"] == "pendiente":
        raise Falla("Tu cuenta todavía espera la aprobación del administrador.", 403)
    if u["estado"] != "activo":
        raise Falla("Esta cuenta está desactivada.", 403)
    E.acierto("u:" + usuario)
    E.actividad(usuario, "entrar", d.get("cliente") or "panel", ip)
    entrar_y_responder(h, u, d)


@ruta("POST", "/api/salir")
def api_salir(h, s):
    if s:
        E.db.x("DELETE FROM sesiones WHERE id=?", s["id"])
    h.responder(200, {"ok": True}, extra={"Set-Cookie": "librito_sesion=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"})


@ruta("GET", "/api/yo")
def api_yo(h, s):
    if not s:
        return h.responder(200, {"usuario": None})
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    h.responder(200, {"usuario": publico_usuario(u)})


@ruta("POST", "/api/yo/contrasena", "sesion")
def api_contrasena(h, s):
    d = h.cuerpo_json()
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    if not verificar(str(d.get("actual", "")), u["hash"]):
        raise Falla("La contraseña actual no es esa.", 403)
    validar_contrasena(d.get("nueva"))
    E.db.x("UPDATE usuarios SET hash=? WHERE id=?", hashear(d["nueva"]), u["id"])
    E.db.x("DELETE FROM sesiones WHERE usuario_id=? AND id<>?", u["id"], s["id"])
    E.actividad(u["usuario"], "contrasena", "cambiada; se cerraron las otras sesiones", h.ip())
    h.responder(200, {"ok": True})


@ruta("GET", "/api/yo/sesiones", "sesion")
def api_sesiones(h, s):
    l = E.db.q("SELECT id, creado, ultimo, expira, cliente, agente, ip FROM sesiones WHERE usuario_id=? AND expira>? ORDER BY ultimo DESC", s["usuario_id"], ahora())
    for x in l:
        x["esta"] = x["id"] == s["id"]
        x["id"] = x["id"][:16]
    h.responder(200, {"sesiones": l})


@ruta("DELETE", "/api/yo/sesiones/([a-f0-9]{16})", "sesion")
def api_cerrar_sesion(h, s, corto):
    E.db.x("DELETE FROM sesiones WHERE usuario_id=? AND substr(id,1,16)=?", s["usuario_id"], corto)
    h.responder(200, {"ok": True})


# — Publicaciones —
def fila_pub(p, usuarios=None):
    return {"slug": p["slug"], "titulo": p["titulo"], "paginas": p["paginas"], "archivos": p["archivos"], "bytes": p["bytes"],
            "creado": iso(p["creado"]) if p["creado"] else "", "actualizado": iso(p["actualizado"]) if p["actualizado"] else "",
            "enlace": p["enlace"] or "", "local": f"/p/{p['slug']}/", "estado": p["estado"], "error": p["error"] or "",
            "autor": (usuarios or {}).get(p["usuario_id"], "")}


@ruta("GET", "/api/publicaciones", "sesion")
def api_publicaciones(h, s):
    todas = s["rol"] == "admin" and h.parametros().get("todas") == "1"
    l = E.db.q("SELECT * FROM publicaciones ORDER BY actualizado DESC") if todas else E.db.q("SELECT * FROM publicaciones WHERE usuario_id=? ORDER BY actualizado DESC", s["usuario_id"])
    nombres = {u["id"]: u["usuario"] for u in E.db.q("SELECT id, usuario FROM usuarios")}
    h.responder(200, {"publicaciones": [fila_pub(p, nombres) for p in l]})


@ruta("POST", "/api/publicaciones", "sesion")
def api_publicar(h, s):
    q = h.parametros()
    tmp = h.cuerpo_a_archivo()
    carpeta_nueva = None
    try:
        entradas, ficha = revisar_zip(tmp, E.aj["max_subida_mb"] * 1024 * 1024 * 4)
        titulo = (q.get("titulo") or ficha.get("titulo") or "Mi librito").strip()[:80]
        paginas = int(q.get("paginas") or ficha.get("paginas") or 0)
        reemplazar = (q.get("reemplazar") or "").strip()
        if reemplazar:
            p = E.db.uno("SELECT * FROM publicaciones WHERE slug=?", reemplazar)
            if not p:
                raise Falla("Esa publicación ya no existe.", 404)
            if p["usuario_id"] != s["usuario_id"] and s["rol"] != "admin":
                raise Falla("Sólo puedes actualizar tus propias publicaciones.", 403)
            if p["estado"] in ("preparando", "subiendo"):
                raise Falla("Esa publicación se está subiendo ahora mismo.", 409)
            slug = reemplazar
            E.db.x("UPDATE publicaciones SET titulo=?, estado='preparando', actualizado=? WHERE slug=?", titulo, ahora(), slug)
        else:
            slug = E.reservar_nombre(nombre_limpio(q.get("nombre") or titulo), s["usuario_id"], titulo)
        carpeta = os.path.join(DATOS, "publicaciones", slug)
        carpeta_nueva = carpeta + ".nueva"
        shutil.rmtree(carpeta_nueva, ignore_errors=True)
        total = abrir_zip(tmp, entradas, carpeta_nueva)
        shutil.rmtree(carpeta, ignore_errors=True)
        os.replace(carpeta_nueva, carpeta)
        carpeta_nueva = None
    except BaseException:
        if carpeta_nueva:
            shutil.rmtree(carpeta_nueva, ignore_errors=True)
        if "slug" in locals() and not reemplazar:
            E.db.x("DELETE FROM publicaciones WHERE slug=? AND estado='preparando'", slug)
        raise
    finally:
        os.unlink(tmp)
    E.db.x("UPDATE publicaciones SET paginas=?, archivos=?, bytes=?, estado='subiendo' WHERE slug=?", paginas, len(entradas), total, slug)
    E.actividad(s["usuario"], "publicar", f"{titulo} → {slug}", h.ip())

    def correr(t, slug):
        try:
            return trabajo_publicar(t, slug, os.path.join(DATOS, "publicaciones", slug), ficha, s["usuario"])
        except Falla as e:
            E.db.x("UPDATE publicaciones SET estado='error', error=? WHERE slug=?", str(e)[:300], slug)
            raise
    t = E.trabajo("publicar", s["usuario_id"], correr, slug)
    sitio = E.sitio()
    h.responder(202, {"trabajo": t["id"], "slug": slug, "local": f"/p/{slug}/", "enlace": f"{sitio}{CARPETA_PUB}/{slug}/" if sitio else ""})


@ruta("POST", "/api/publicaciones/([a-z0-9-]{1,40})/subir", "sesion")
def api_subir_otra_vez(h, s, slug):
    """Vuelve a subir a GitHub lo que ya está guardado aquí (lo publicado antes de conectar GitHub, o un error)."""
    p = E.db.uno("SELECT * FROM publicaciones WHERE slug=?", slug)
    if not p:
        raise Falla("Esa publicación no existe.", 404)
    if p["usuario_id"] != s["usuario_id"] and s["rol"] != "admin":
        raise Falla("Sólo puedes subir tus propias publicaciones.", 403)
    if not E.github():
        raise Falla("Primero conecta GitHub en el panel del servidor.", 409)
    carpeta = os.path.join(DATOS, "publicaciones", slug)
    if not os.path.isfile(os.path.join(carpeta, "index.html")):
        raise Falla("La copia guardada aquí ya no está; publícala otra vez desde el editor.", 410)
    E.db.x("UPDATE publicaciones SET estado='subiendo', error='' WHERE slug=?", slug)

    def correr(t):
        try:
            return trabajo_publicar(t, slug, carpeta, {}, s["usuario"])
        except Falla as e:
            E.db.x("UPDATE publicaciones SET estado='error', error=? WHERE slug=?", str(e)[:300], slug)
            raise
    t = E.trabajo("publicar", s["usuario_id"], correr)
    h.responder(202, {"trabajo": t["id"], "slug": slug})


@ruta("DELETE", "/api/publicaciones/([a-z0-9-]{1,40})", "sesion")
def api_quitar(h, s, slug):
    p = E.db.uno("SELECT * FROM publicaciones WHERE slug=?", slug)
    if not p:
        raise Falla("Esa publicación no existe.", 404)
    if p["usuario_id"] != s["usuario_id"] and s["rol"] != "admin":
        raise Falla("Sólo puedes quitar tus propias publicaciones.", 403)
    E.db.x("UPDATE publicaciones SET estado='quitando' WHERE slug=?", slug)
    E.actividad(s["usuario"], "quitar", slug, h.ip())
    t = E.trabajo("quitar", s["usuario_id"], trabajo_quitar, slug, s["usuario"])
    h.responder(202, {"trabajo": t["id"]})


@ruta("GET", "/api/trabajos/([A-Za-z0-9_-]{8,40})", "sesion")
def api_trabajo(h, s, tid):
    t = E.trabajos.get(tid)
    if not t or (t["usuario_id"] != s["usuario_id"] and s["rol"] != "admin"):
        raise Falla("Ese trabajo no existe (o ya pasó mucho tiempo).", 404)
    h.responder(200, {k: t[k] for k in ("id", "tipo", "estado", "paso", "hechos", "total", "resultado", "error")})


# — Proyectos (copias del .zip completo del editor) —
@ruta("GET", "/api/proyectos", "sesion")
def api_proyectos(h, s):
    todas = s["rol"] == "admin" and h.parametros().get("todas") == "1"
    l = E.db.q("SELECT * FROM proyectos ORDER BY creado DESC") if todas else E.db.q("SELECT * FROM proyectos WHERE usuario_id=? ORDER BY creado DESC", s["usuario_id"])
    nombres = {u["id"]: u["usuario"] for u in E.db.q("SELECT id, usuario FROM usuarios")}
    h.responder(200, {"proyectos": [{"id": p["id"], "nombre": p["nombre"], "bytes": p["bytes"], "paginas": p["paginas"], "creado": iso(p["creado"]), "autor": nombres.get(p["usuario_id"], "")} for p in l]})


@ruta("POST", "/api/proyectos", "sesion")
def api_guardar_proyecto(h, s):
    q = h.parametros()
    tmp = h.cuerpo_a_archivo()
    try:
        try:
            with zipfile.ZipFile(tmp) as z:
                pj = json.loads(z.read("project.json").decode("utf-8"))
        except (zipfile.BadZipFile, KeyError, ValueError):
            raise Falla("Eso no es un proyecto del editor (falta project.json).")
        nombre = (q.get("nombre") or pj.get("nombre") or "Mi librito").strip()[:80]
        pid = time.strftime("%Y%m%d-%H%M%S") + "-" + secrets.token_hex(3)
        carpeta = os.path.join(DATOS, "proyectos", str(s["usuario_id"]))
        os.makedirs(carpeta, exist_ok=True)
        destino = os.path.join(carpeta, pid + ".zip")
        shutil.move(tmp, destino)
        os.chmod(destino, 0o600)
        tam = os.path.getsize(destino)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    E.db.x("INSERT INTO proyectos(id,usuario_id,nombre,bytes,creado,paginas) VALUES(?,?,?,?,?,?)", pid, s["usuario_id"], nombre, tam, ahora(), len(pj.get("orden") or []))
    # Se quedan las 8 copias más nuevas de cada nombre.
    for viejo in E.db.q("SELECT id FROM proyectos WHERE usuario_id=? AND nombre=? ORDER BY creado DESC LIMIT -1 OFFSET 8", s["usuario_id"], nombre):
        borrar_proyecto(viejo["id"])
    E.actividad(s["usuario"], "proyecto", nombre, h.ip())
    h.responder(201, {"id": pid, "nombre": nombre, "bytes": tam})


def borrar_proyecto(pid):
    p = E.db.uno("SELECT * FROM proyectos WHERE id=?", pid)
    if p:
        try:
            os.unlink(os.path.join(DATOS, "proyectos", str(p["usuario_id"]), pid + ".zip"))
        except OSError:
            pass
        E.db.x("DELETE FROM proyectos WHERE id=?", pid)


def proyecto_de(s, pid):
    p = E.db.uno("SELECT * FROM proyectos WHERE id=?", pid)
    if not p or (p["usuario_id"] != s["usuario_id"] and s["rol"] != "admin"):
        raise Falla("Ese proyecto no existe.", 404)
    return p


@ruta("GET", "/api/proyectos/([0-9a-f-]{10,40})", "sesion")
def api_bajar_proyecto(h, s, pid):
    p = proyecto_de(s, pid)
    nombre = nombre_limpio(p["nombre"]) + ".zip"
    h.archivo(os.path.join(DATOS, "proyectos", str(p["usuario_id"]), pid + ".zip"),
              {"Content-Disposition": f'attachment; filename="{nombre}"'}, cache="no-store")


@ruta("DELETE", "/api/proyectos/([0-9a-f-]{10,40})", "sesion")
def api_borrar_proyecto(h, s, pid):
    p = proyecto_de(s, pid)
    borrar_proyecto(p["id"])
    E.actividad(s["usuario"], "proyecto-borrar", p["nombre"], h.ip())
    h.responder(200, {"ok": True})


# — Administración —
def uso_disco():
    total, usado, libre = shutil.disk_usage(DATOS)
    return {"total": total, "libre": libre, "telefono_usado": usado,
            "publicaciones": tamano_carpeta(os.path.join(DATOS, "publicaciones")),
            "proyectos": tamano_carpeta(os.path.join(DATOS, "proyectos")),
            "base": sum(os.path.getsize(os.path.join(DATOS, f)) for f in os.listdir(DATOS) if f.startswith("librito.db"))}


@ruta("GET", "/api/admin/resumen", "admin")
def api_resumen(h, s):
    g = E.aj["github"]
    caja = E.caja.leer()
    h.responder(200, {
        "disco": uso_disco(),
        "cuentas": {"usuarios": E.db.uno("SELECT COUNT(*) n FROM usuarios")["n"], "pendientes": E.db.uno("SELECT COUNT(*) n FROM usuarios WHERE estado='pendiente'")["n"]},
        "publicaciones": E.db.uno("SELECT COUNT(*) n FROM publicaciones")["n"], "proyectos": E.db.uno("SELECT COUNT(*) n FROM proyectos")["n"],
        "github": {"repo": g.get("repo", ""), "rama": g.get("rama", ""), "token": bool(caja.get("github_token")), "listo": bool(E.github())},
        "url_publica": E.url_publica(), "tunel": E.aj["tunel"], "cloudflared": bool(shutil.which("cloudflared")),
        "red_local": ip_local(), "puerto": E.aj["puerto"], "version": VERSION, "datos": DATOS,
        "trabajando": [{"tipo": t["tipo"], "paso": t["paso"]} for t in E.trabajos.values() if t["estado"] in ("esperando", "trabajando")]})


CAMPOS_AJUSTES = {"nombre": str, "registro": str, "origenes": list, "permitir_local": bool, "tunel": str, "url_publica": str, "anunciar": bool, "max_subida_mb": int}


@ruta("GET", "/api/admin/ajustes", "admin")
def api_ajustes(h, s):
    h.responder(200, {k: E.aj[k] for k in CAMPOS_AJUSTES} | {"puerto": E.aj["puerto"], "escuchar": E.aj["escuchar"]})


@ruta("PUT", "/api/admin/ajustes", "admin")
def api_poner_ajustes(h, s):
    d = h.cuerpo_json()
    cambios = {}
    for k, tipo in CAMPOS_AJUSTES.items():
        if k in d:
            v = d[k]
            if tipo is int:
                v = max(10, min(2000, int(v)))
            elif tipo is list:
                v = [str(x).strip().rstrip("/") for x in v if re.match(r"^https?://[A-Za-z0-9.-]+(:\d+)?/?$", str(x).strip())][:20]
            elif tipo is bool:
                v = bool(v)
            else:
                v = str(v).strip()[:120]
            cambios[k] = v
    if cambios.get("registro", "aprobacion") not in ("aprobacion", "codigo", "cerrado"):
        raise Falla("Registro: aprobacion, codigo o cerrado.")
    if cambios.get("tunel", "cloudflare") not in ("cloudflare", "ninguno"):
        raise Falla("Túnel: cloudflare o ninguno.")
    if cambios.get("url_publica") and not re.match(r"^https://[A-Za-z0-9.-]+(:\d+)?$", cambios["url_publica"].rstrip("/")):
        raise Falla("La dirección pública tiene que empezar con https:// (sin carpeta).")
    E.aj.poner(**cambios)
    E.actividad(s["usuario"], "ajustes", ", ".join(cambios), h.ip())
    if "url_publica" in cambios or "anunciar" in cambios:
        anunciar_direccion()
    h.responder(200, {k: E.aj[k] for k in CAMPOS_AJUSTES})


@ruta("GET", "/api/admin/github", "admin")
def api_github(h, s):
    g = E.aj["github"]
    t = E.caja.leer().get("github_token", "")
    h.responder(200, {"repo": g.get("repo", ""), "rama": g.get("rama", ""), "token": ("…" + t[-4:]) if t else "", "listo": bool(E.github())})


@ruta("PUT", "/api/admin/github", "admin")
def api_poner_github(h, s):
    d = h.cuerpo_json()
    repo = str(d.get("repo", "")).strip().replace("https://github.com/", "").strip("/").removesuffix(".git")
    if not re.match(r"^[\w.-]+/[\w.-]+$", repo):
        raise Falla("Escribe el repositorio como usuario/repositorio.")
    caja = E.caja.leer()
    token = str(d.get("token") or "").strip() or caja.get("github_token", "")
    if not token:
        raise Falla("Falta el token de GitHub.")
    if not re.match(r"^(github_pat_|ghp_|gho_|ghu_|ghs_)[A-Za-z0-9_]{20,}$", token):
        raise Falla("Eso no parece un token de GitHub (empieza con github_pat_ o ghp_).")
    gh = GitHub(repo, token, d.get("rama") or "")
    info = gh.info()
    if info.get("permissions") and not info["permissions"].get("push"):
        raise Falla("Ese token puede ver el repositorio pero no escribir en él (Contents: Read and write).")
    rama = str(d.get("rama") or "").strip()
    if not rama:
        pg = gh.pages()
        rama = pg.get("rama") or (gh.ramas() or [{}])[0].get("nombre") or info.get("default_branch", "main")
    gh.rama = rama
    gh.cabeza()   # comprueba que la rama existe
    caja["github_token"] = token
    E.caja.guardar(caja)
    E.aj.poner(github={"repo": repo, "rama": rama})
    E._sitio, E._carpetas, E.anunciada = None, (0, set()), ""
    E.actividad(s["usuario"], "github", f"{repo} · rama {rama}", h.ip())
    log("GitHub conectado:", repo, "rama", rama)
    anunciar_direccion()
    h.responder(200, {"repo": repo, "rama": rama, "token": "…" + token[-4:], "listo": True, "privado": bool(info.get("private"))})


@ruta("DELETE", "/api/admin/github", "admin")
def api_quitar_github(h, s):
    caja = E.caja.leer()
    caja.pop("github_token", None)
    E.caja.guardar(caja)
    E.actividad(s["usuario"], "github", "token borrado", h.ip())
    h.responder(200, {"ok": True})


def gh_o_falla():
    gh = E.github()
    if not gh:
        raise Falla("Primero conecta GitHub (repositorio, rama y token).", 409)
    return gh


@ruta("GET", "/api/admin/github/estado", "admin")
def api_estado_github(h, s):
    gh = gh_o_falla()
    info = gh.info()
    h.responder(200, {"repo": gh.repo, "rama": gh.rama, "privado": bool(info.get("private")), "pages": gh.pages(), "ramas": gh.ramas()})


@ruta("POST", "/api/admin/github/pages", "admin")
def api_encender_pages(h, s):
    gh = gh_o_falla()
    rama = str(h.cuerpo_json().get("rama") or gh.rama)
    gh.encender_pages(rama)
    gh.reconstruir()
    if rama != gh.rama:
        E.aj.poner(github={"rama": rama})
    E._sitio = None
    E.actividad(s["usuario"], "pages", f"encendido desde {rama}", h.ip())
    h.responder(200, {"pages": gh.pages()})


@ruta("POST", "/api/admin/github/reconstruir", "admin")
def api_reconstruir(h, s):
    gh_o_falla().reconstruir()
    h.responder(200, {"ok": True})


@ruta("GET", "/api/admin/usuarios", "admin")
def api_usuarios(h, s):
    h.responder(200, {"usuarios": [publico_usuario(u) | {"publicaciones": E.db.uno("SELECT COUNT(*) n FROM publicaciones WHERE usuario_id=?", u["id"])["n"]}
                                   for u in E.db.q("SELECT * FROM usuarios ORDER BY estado='pendiente' DESC, creado DESC")]})


@ruta("PATCH", "/api/admin/usuarios/(\\d+)", "admin")
def api_cambiar_usuario(h, s, uid):
    d = h.cuerpo_json()
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", int(uid))
    if not u:
        raise Falla("No existe.", 404)
    rol = d.get("rol", u["rol"])
    estado = d.get("estado", u["estado"])
    if rol not in ("admin", "editor") or estado not in ("activo", "pendiente", "desactivado"):
        raise Falla("Rol o estado no válido.")
    if u["id"] == s["usuario_id"] and (rol != "admin" or estado != "activo"):
        raise Falla("No puedes quitarte a ti mismo el permiso de administrador.")
    E.db.x("UPDATE usuarios SET rol=?, estado=? WHERE id=?", rol, estado, u["id"])
    if estado != "activo":
        E.db.x("DELETE FROM sesiones WHERE usuario_id=?", u["id"])
    E.actividad(s["usuario"], "usuario", f"{u['usuario']}: {rol}, {estado}", h.ip())
    h.responder(200, {"ok": True})


@ruta("POST", "/api/admin/usuarios/(\\d+)/contrasena", "admin")
def api_reiniciar_contrasena(h, s, uid):
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", int(uid))
    if not u:
        raise Falla("No existe.", 404)
    temporal = "-".join(secrets.token_urlsafe(4) for _ in range(3))
    E.db.x("UPDATE usuarios SET hash=? WHERE id=?", hashear(temporal), u["id"])
    E.db.x("DELETE FROM sesiones WHERE usuario_id=?", u["id"])
    E.actividad(s["usuario"], "usuario", f"{u['usuario']}: contraseña temporal", h.ip())
    h.responder(200, {"temporal": temporal})


@ruta("DELETE", "/api/admin/usuarios/(\\d+)", "admin")
def api_borrar_usuario(h, s, uid):
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", int(uid))
    if not u:
        raise Falla("No existe.", 404)
    if u["id"] == s["usuario_id"]:
        raise Falla("No puedes borrar tu propia cuenta desde aquí.")
    for p in E.db.q("SELECT id FROM proyectos WHERE usuario_id=?", u["id"]):
        borrar_proyecto(p["id"])
    E.db.x("UPDATE publicaciones SET usuario_id=? WHERE usuario_id=?", s["usuario_id"], u["id"])   # sus publicaciones pasan a ti
    E.db.x("DELETE FROM usuarios WHERE id=?", u["id"])
    E.actividad(s["usuario"], "usuario", f"{u['usuario']}: borrado", h.ip())
    h.responder(200, {"ok": True})


@ruta("GET", "/api/admin/invitaciones", "admin")
def api_invitaciones(h, s):
    nombres = {u["id"]: u["usuario"] for u in E.db.q("SELECT id, usuario FROM usuarios")}
    h.responder(200, {"invitaciones": [{"id": i["id"], "nota": i["nota"], "creado": iso(i["creado"]), "expira": iso(i["expira"]), "usada": nombres.get(i["usado_por"], "")}
                                       for i in E.db.q("SELECT * FROM invitaciones ORDER BY creado DESC LIMIT 50")]})


@ruta("POST", "/api/admin/invitaciones", "admin")
def api_nueva_invitacion(h, s):
    d = h.cuerpo_json()
    codigo = "-".join("".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(4)) for _ in range(3))
    dias = max(1, min(60, int(d.get("dias") or 7)))
    E.db.x("INSERT INTO invitaciones(id,hash,creado,expira,nota) VALUES(?,?,?,?,?)", secrets.token_hex(6), hashlib.sha256(codigo.encode()).hexdigest(), ahora(), ahora() + dias * 86400, str(d.get("nota") or "")[:60])
    E.actividad(s["usuario"], "invitacion", d.get("nota") or "", h.ip())
    h.responder(201, {"codigo": codigo, "dias": dias})


@ruta("DELETE", "/api/admin/invitaciones/([0-9a-f]{12})", "admin")
def api_borrar_invitacion(h, s, iid):
    E.db.x("DELETE FROM invitaciones WHERE id=?", iid)
    h.responder(200, {"ok": True})


@ruta("GET", "/api/admin/actividad", "admin")
def api_actividad(h, s):
    h.responder(200, {"actividad": [{"t": iso(a["t"]), "usuario": a["usuario"], "accion": a["accion"], "detalle": a["detalle"], "ip": a["ip"]}
                                    for a in E.db.q("SELECT * FROM actividad ORDER BY id DESC LIMIT 300")]})


@ruta("POST", "/api/admin/tunel/reiniciar", "admin")
def api_reiniciar_tunel(h, s):
    global TUNEL
    if TUNEL:
        TUNEL.cerrar()
    TUNEL = None
    if E.aj["tunel"] == "cloudflare":
        TUNEL = Tunel(E.aj["puerto"])
        TUNEL.start()
    h.responder(200, {"ok": True})


# ════════════════════════════════════════════════════════════════════════
#  Arranque y órdenes de la terminal
# ════════════════════════════════════════════════════════════════════════
def ip_local():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as so:
            so.connect(("10.255.255.255", 1))
            return so.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def iniciar(args):
    global E, TUNEL
    E = Estado()
    puerto = args.puerto or E.aj["puerto"]
    if args.puerto:
        E.aj.poner(puerto=puerto)
    srv = ThreadingHTTPServer((E.aj["escuchar"], puerto), Manejador)
    srv.daemon_threads = True
    log(f"Servidor del librito {VERSION} escuchando en el puerto {puerto}")
    log(f"  En este teléfono:  http://127.0.0.1:{puerto}/")
    log(f"  En tu wifi:        http://{ip_local()}:{puerto}/")
    log(f"  Datos en:          {DATOS}")
    if E.codigo_instalacion:
        log("")
        log("  ★ Código de instalación (para crear el administrador en el panel):", E.codigo_instalacion)
        log("")
    if not E.github():
        log("  GitHub todavía no está conectado: hazlo en el panel → GitHub (o con «python servidor.py github»).")
    if E.aj["tunel"] == "cloudflare" and not args.sin_tunel:
        TUNEL = Tunel(puerto)
        TUNEL.start()
    elif E.url_publica():
        threading.Timer(3, anunciar_direccion).start()

    def limpiar():
        while True:
            time.sleep(3600)
            try:
                E.db.x("DELETE FROM sesiones WHERE expira < ?", ahora())
            except Exception:   # noqa: BLE001
                pass
    threading.Thread(target=limpiar, daemon=True).start()
    # «librito detener» manda SIGTERM: se cierra igual que con Ctrl+C (y se lleva el túnel).
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        log("Hasta luego.")
    finally:
        if TUNEL:
            TUNEL.cerrar()


def orden_admin(args):
    global E
    E = Estado()
    usuario = (args.usuario or input("Usuario del administrador: ")).strip().lower()
    if not USUARIO_RE.match(usuario):
        raise SystemExit("Usuario no válido (3 a 32: letras minúsculas, números, . _ -).")
    c1 = getpass.getpass("Contraseña (mínimo 8): ")
    c2 = getpass.getpass("Repítela: ")
    if c1 != c2:
        raise SystemExit("No coinciden.")
    validar_contrasena(c1)
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        E.db.x("UPDATE usuarios SET hash=?, rol='admin', estado='activo' WHERE usuario=?", hashear(c1), usuario)
        print(f"Listo: «{usuario}» ahora es administrador con contraseña nueva.")
    else:
        E.db.x("INSERT INTO usuarios(usuario,hash,rol,estado,creado) VALUES(?,?,?,?,?)", usuario, hashear(c1), "admin", "activo", ahora())
        print(f"Listo: administrador «{usuario}» creado.")
    try:
        os.unlink(os.path.join(DATOS, "codigo-instalacion.txt"))
    except OSError:
        pass


def orden_github(args):
    global E
    E = Estado()
    g = E.aj["github"]
    repo = input(f"Repositorio (usuario/repo) [{g.get('repo') or 'yonathanpartida8/MarissaMiAmor'}]: ").strip() or g.get("repo") or "yonathanpartida8/MarissaMiAmor"
    token = getpass.getpass("Token de GitHub (no se ve al escribir; Enter = dejar el que está): ").strip() or E.caja.leer().get("github_token", "")
    if not token:
        raise SystemExit("Falta el token.")
    gh = GitHub(repo, token, "")
    try:
        info = gh.info()
    except Falla as e:
        raise SystemExit(f"No funcionó: {e}")
    if info.get("permissions") and not info["permissions"].get("push"):
        raise SystemExit("El token puede ver el repositorio pero no escribir (Contents: Read and write).")
    pg = gh.pages()
    sugerida = g.get("rama") or pg.get("rama") or (gh.ramas() or [{}])[0].get("nombre") or info.get("default_branch")
    rama = input(f"Rama donde publicar [{sugerida}]: ").strip() or sugerida
    gh.rama = rama
    try:
        gh.cabeza()
    except Falla as e:
        raise SystemExit(f"Esa rama no funcionó: {e}")
    caja = E.caja.leer()
    caja["github_token"] = token
    E.caja.guardar(caja)
    E.aj.poner(github={"repo": repo, "rama": rama})
    print(f"Listo: {repo} · rama {rama}. GitHub Pages: {'encendido' if pg.get('activo') else 'APAGADO (enciéndelo en el panel → GitHub)' if pg.get('activo') is False else 'no se pudo ver'}.")
    print("El token quedó cifrado en", E.caja.ruta, "(sólo tu usuario puede leerlo).")


def orden_estado(args):
    global E
    E = Estado()
    gh = E.github()
    print(f"Servidor del librito {VERSION}")
    print("  Datos:", DATOS)
    print("  Puerto:", E.aj["puerto"], "· Red local:", ip_local())
    print("  Registro:", E.aj["registro"], "· Túnel:", E.aj["tunel"], "· cloudflared:", "sí" if shutil.which("cloudflared") else "no")
    print("  GitHub:", f"{gh.repo} · rama {gh.rama}" if gh else "sin conectar")
    print("  Usuarios:", E.db.uno("SELECT COUNT(*) n FROM usuarios")["n"], "· Publicaciones:", E.db.uno("SELECT COUNT(*) n FROM publicaciones")["n"], "· Proyectos:", E.db.uno("SELECT COUNT(*) n FROM proyectos")["n"])
    if E.codigo_instalacion:
        print("  Código de instalación:", E.codigo_instalacion)


def orden_llave(args):
    global E
    E = Estado()
    E.caja.cambiar_llave()
    print("Llave nueva generada y secretos vueltos a cifrar.")


def principal():
    p = argparse.ArgumentParser(description="Servidor del librito (publicación y almacenamiento).")
    sub = p.add_subparsers(dest="orden")
    i = sub.add_parser("iniciar", help="arranca el servidor")
    i.add_argument("--puerto", type=int)
    i.add_argument("--sin-tunel", action="store_true", help="no abrir el túnel de cloudflared")
    a = sub.add_parser("admin", help="crea o reinicia un administrador")
    a.add_argument("usuario", nargs="?")
    sub.add_parser("github", help="guarda el token de GitHub (cifrado)")
    sub.add_parser("estado", help="cómo está todo")
    sub.add_parser("llave-nueva", help="cambia la llave que cifra los secretos")
    args = p.parse_args()
    os.umask(0o077)   # todo lo que se cree aquí, sólo para tu usuario
    os.makedirs(DATOS, exist_ok=True)
    {"iniciar": iniciar, "admin": orden_admin, "github": orden_github, "estado": orden_estado, "llave-nueva": orden_llave}.get(args.orden or "iniciar", iniciar)(args if args.orden else p.parse_args(["iniciar"]))


if __name__ == "__main__":
    principal()
