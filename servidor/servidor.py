#!/usr/bin/env python3
"""
M.YNTHN — el servidor del librito: publicación, almacenamiento y Detallitos,
corriendo en tu propio teléfono.

Pensado para Termux en un teléfono viejo (también corre en cualquier Linux,
macOS o Windows con Python 3.9+). Sólo usa la biblioteca estándar de Python:
no hay que instalar nada más que `python` (y `cloudflared` si quieres que se
vea desde internet).

Qué hace:
  · Cuentas propias: cualquiera que abra el editor crea su usuario y su
    contraseña y ya puede publicar (o, si prefieres, registro con aprobación,
    con invitación o cerrado). Nadie más necesita GitHub ni tokens.
  · Guarda TU token de GitHub cifrado aquí, en el teléfono. Nunca viaja al
    editor ni a ningún navegador: el editor le manda el librito al servidor y
    es el servidor quien lo sube a tu repositorio.
  · Publica cada librito en publicaciones/<nombre>/ de tu GitHub Pages (si el
    nombre ya existe, usa <nombre>-2, -3…) y guarda una copia aquí mismo, que
    también se ve en /p/<nombre>/.
  · Guarda las copias de los proyectos de cada usuario, cada uno en su carpeta
    (proyectos/<usuario>/<proyecto>/), una copia nueva cada vez que guarda a mano.
  · Detallitos: cada cuenta tiene un código único; con el código de tu amorcito
    quedan vinculados y se mandan páginas que se van coleccionando.
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

VERSION = "1.6.0"
AQUI = os.path.dirname(os.path.abspath(__file__))
PANEL = os.path.join(AQUI, "panel")
DATOS = os.path.abspath(os.path.expanduser(os.environ.get("LIBRITO_DATOS", "~/librito-datos")))
GITHUB_API = os.environ.get("LIBRITO_GITHUB_API", "https://api.github.com").rstrip("/")
CARPETA_PUB = "publicaciones"
ARCHIVO_ANUNCIO = "servidor.json"
RUTA_CODIGO = os.path.join(DATOS, "codigo-instalacion.txt")   # el código para crear el primer administrador
RUTA_ESTADO = os.path.join(DATOS, "estado.json")              # pid, puerto y dirección del servidor PRENDIDO (para «librito»)
VIGIA_S = max(5, int(os.environ.get("LIBRITO_VIGIA_S", "150")))  # cada cuánto se prueba el túnel desde internet
# La API de GitHub no acepta archivos grandes («Sorry, your input was too large to process»):
# lo que pase de esto se sube con git (como desde una copia del repositorio).
LIMITE_API = int(float(os.environ.get("LIBRITO_LIMITE_API_MB", "20")) * 1024 * 1024)
GIT_URL = os.environ.get("LIBRITO_GIT_URL", "")   # para pruebas (si no, https://github.com/<repo>.git)

AJUSTES_BASE = {
    "nombre": "M.YNTHN",
    "puerto": 8787,
    "escuchar": "0.0.0.0",
    "registro": "abierto",             # abierto (entra al momento) · codigo (con invitación) · cerrado
    "origenes": [],                    # orígenes extra que pueden usar la API (además de tu GitHub Pages)
    "permitir_local": True,            # http://localhost y 127.0.0.1 (para probar)
    "tunel": "cloudflare",             # cloudflare · ninguno
    "url_publica": "",                 # si tienes un dominio o túnel fijo, ponlo aquí
    "anunciar": True,                  # escribir la dirección del túnel en servidor.json de tu sitio
    "max_subida_mb": 300,
    "max_usuarios": 1000,              # cuentas como máximo (para que el teléfono no se llene)
    "cuota_mb": 1024,                  # espacio por usuario (su nube: libritos, fotos, videos y copias + detallitos enviados)
    "max_publicaciones": 30,           # publicaciones por usuario (el administrador no tiene tope)
    "copias_por_proyecto": 15,         # copias que se guardan de cada proyecto (las más nuevas)
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
    """config.json. Si otra orden lo cambia (p. ej. «librito github» con el servidor
    prendido), el servidor lo relee solo: no hace falta reiniciarlo."""
    def __init__(self):
        self.ruta = os.path.join(DATOS, "config.json")
        self.lock = threading.RLock()
        self._mtime, self._revisado = 0, 0
        self.d = json.loads(json.dumps(AJUSTES_BASE))
        if os.path.exists(self.ruta):
            self._leer()
        else:
            self.guardar()

    def _leer(self):
        d = json.loads(json.dumps(AJUSTES_BASE))
        try:
            with open(self.ruta, encoding="utf-8") as f:
                guardado = json.load(f)
            for k, v in guardado.items():
                if k == "github" and isinstance(v, dict):
                    d["github"].update(v)
                elif k in d:
                    d[k] = v
            if d.get("nombre") in ("Servidor del librito", "", None):
                d["nombre"] = "M.YNTHN"
            if d.get("registro") not in ("abierto", "codigo", "cerrado"):
                d["registro"] = "abierto"   # el antiguo «aprobacion» ya no existe: se entra sin aprobación
            self.d = d
            self._mtime = os.path.getmtime(self.ruta)
        except (OSError, ValueError) as e:
            log("config.json no se pudo leer, se usan los valores que había:", e)

    def _al_dia(self):
        if ahora() - self._revisado < 1:
            return
        self._revisado = ahora()
        try:
            m = os.path.getmtime(self.ruta)
        except OSError:
            return
        if m != self._mtime:
            with self.lock:
                self._leer()

    def __getitem__(self, k):
        self._al_dia()
        return self.d[k]

    def guardar(self):
        with self.lock:
            escribir_seguro(self.ruta, json.dumps(self.d, ensure_ascii=False, indent=1))
            try:
                self._mtime = os.path.getmtime(self.ruta)
            except OSError:
                pass

    def poner(self, **cambios):
        with self.lock:
            self._al_dia()
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
CREATE TABLE IF NOT EXISTS detallitos(id TEXT PRIMARY KEY, de INTEGER, para INTEGER, titulo TEXT, mensaje TEXT, color TEXT,
  creado REAL, visto REAL, bytes INTEGER, borrado_de INTEGER DEFAULT 0, borrado_para INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS archivos(sha TEXT PRIMARY KEY, tam INTEGER, mime TEXT, creado REAL);
CREATE TABLE IF NOT EXISTS archivos_de(usuario_id INTEGER, sha TEXT, creado REAL, PRIMARY KEY(usuario_id, sha));
CREATE TABLE IF NOT EXISTS libritos(usuario_id INTEGER, clave TEXT, nombre TEXT, editado REAL, subido REAL, paginas INTEGER,
  tam INTEGER, aparato TEXT, PRIMARY KEY(usuario_id, clave));
CREATE TABLE IF NOT EXISTS copias(id TEXT PRIMARY KEY, usuario_id INTEGER, clave TEXT, nombre TEXT, creado REAL, paginas INTEGER, tam INTEGER);
CREATE TABLE IF NOT EXISTS ajustes_de(usuario_id INTEGER PRIMARY KEY, datos TEXT, editado REAL);
CREATE TABLE IF NOT EXISTS mensajes(id INTEGER PRIMARY KEY AUTOINCREMENT, de INTEGER, para INTEGER, texto TEXT, gif TEXT,
  creado REAL, visto REAL, reaccion TEXT, reaccion_t REAL, stickers TEXT, borrado INTEGER DEFAULT 0, actualizado REAL);
CREATE INDEX IF NOT EXISTS mensajes_par ON mensajes(de, para, id);
"""
# Columnas que llegaron después (se agregan solas a una base vieja).
COLUMNAS_NUEVAS = {
    "usuarios": [("codigo_amor", "TEXT"), ("pareja_id", "INTEGER"), ("pareja_desde", "REAL"), ("visto", "REAL"),
                 ("nombre", "TEXT"), ("cumple", "TEXT"), ("novios", "TEXT"), ("foto_v", "REAL")],
    "proyectos": [("clave", "TEXT"), ("ruta", "TEXT")],
    # Fase 22: la reacción de quien lo recibió (y si quien lo mandó ya la vio) y su portadita.
    "detallitos": [("reaccion", "TEXT"), ("reaccion_t", "REAL"), ("reaccion_vista", "INTEGER DEFAULT 1"), ("portadita", "TEXT")],
}
LETRAS_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class Base:
    def __init__(self, ruta):
        self.lock = threading.RLock()
        nueva = not os.path.exists(ruta)
        self.c = sqlite3.connect(ruta, check_same_thread=False, timeout=15)
        self.c.row_factory = sqlite3.Row
        self.c.execute("PRAGMA journal_mode=WAL")
        self.c.execute("PRAGMA foreign_keys=ON")
        self.c.executescript(ESQUEMA)
        for tabla, cols in COLUMNAS_NUEVAS.items():
            tiene = {r[1] for r in self.c.execute(f"PRAGMA table_info({tabla})").fetchall()}
            for nombre, tipo in cols:
                if nombre not in tiene:
                    self.c.execute(f"ALTER TABLE {tabla} ADD COLUMN {nombre} {tipo}")
        self.c.execute("CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_amor ON usuarios(codigo_amor)")
        # Ya no hay aprobación: las cuentas que quedaron esperando de antes entran directo.
        self.c.execute("UPDATE usuarios SET estado='activo' WHERE estado='pendiente'")
        self.c.commit()
        for u in self.q("SELECT id FROM usuarios WHERE codigo_amor IS NULL"):
            self.x("UPDATE usuarios SET codigo_amor=? WHERE id=?", self.codigo_libre(), u["id"])
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

    def codigo_libre(self):
        """El código único de cada cuenta para vincularse con su amorcito: AMOR-XXXX-XXXX."""
        while True:
            c = "AMOR-" + "-".join("".join(secrets.choice(LETRAS_CODIGO) for _ in range(4)) for _ in range(2))
            if not self.uno("SELECT id FROM usuarios WHERE codigo_amor=?", c):
                return c

    def crear_usuario(self, usuario, contrasena, rol, estado):
        return self.x("INSERT INTO usuarios(usuario,hash,rol,estado,creado,codigo_amor) VALUES(?,?,?,?,?,?)",
                      usuario, hashear(contrasena), rol, estado, ahora(), self.codigo_libre())


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
                if e.code in (413, 422) and re.search(r"too large|too big|demasiado", m, re.I):
                    f = Falla("GitHub no acepta un archivo tan grande por su API. Instala git en Termux («pkg install git») y vuelve a publicar: los archivos grandes se suben con git.", 413)
                    f.estado_github = e.code
                    f.mensaje_github = m
                    raise f
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

    def shas_del_repo(self, arbol):
        """Todas las huellas de archivos que YA están en la rama: esos no se vuelven a subir (los videos del librito, por ejemplo)."""
        try:
            t = self.pedir("GET", f"/repos/{self.repo}/git/trees/{arbol}?recursive=1", intentos=2)
            return {n["sha"] for n in (t or {}).get("tree", []) if n.get("type") == "blob"}
        except Falla:
            return set()

    def subir_con_git(self, archivos):
        """Los archivos grandes: con git, a una rama temporal (sin bajar el repositorio). Sus huellas
        quedan en GitHub y el commit de la publicación las usa. Devuelve el nombre de la rama temporal."""
        git = shutil.which("git")
        if not git:
            raise Falla("Hay archivos de más de %d MB y para subirlos a GitHub hace falta git: en Termux escribe «pkg install git» y vuelve a publicar." % (LIMITE_API // 1048576), 409)
        for _, p in archivos:
            if os.path.getsize(p) > 95 * 1024 * 1024:
                raise Falla("Un archivo pesa más de 95 MB: GitHub no lo acepta. Achícalo en el editor (Recursos → Optimizar).")
        tmp = tempfile.mkdtemp(dir=os.path.join(DATOS, "tmp"), prefix="git-")
        llave = base64.b64encode(f"x-access-token:{self.token}".encode()).decode()
        # El token va por variables del proceso (no en la línea de órdenes ni en la dirección).
        env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_CONFIG_NOSYSTEM": "1", "HOME": tmp,
               "GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "http.extraHeader", "GIT_CONFIG_VALUE_0": f"Authorization: Basic {llave}"}

        def g(*args, entrada=None):
            r = subprocess.run([git, "-C", tmp, *args], input=entrada, capture_output=True, env=env, timeout=3600)
            if r.returncode:
                error = r.stderr.decode("utf-8", "replace").replace(self.token, "…").strip().splitlines()[-1:] or ["?"]
                raise Falla(f"git no pudo subir los archivos grandes: {error[0][:200]}", 502)
            return r.stdout.decode().strip()
        try:
            g("init", "-q")
            lineas = []
            for i, (_, p) in enumerate(archivos):
                lineas.append(f"100644 blob {g('hash-object', '-w', p)}\tarchivo-{i}")
            arbol = g("mktree", entrada=("\n".join(lineas) + "\n").encode())
            commit = g("-c", "user.name=M.YNTHN", "-c", "user.email=servidor@librito.invalid", "commit-tree", arbol, "-m", "Archivos grandes de una publicación (rama temporal)")
            nombre = "librito-subida-" + secrets.token_hex(4)
            g("push", "-q", GIT_URL or f"https://github.com/{self.repo}.git", f"{commit}:refs/heads/{nombre}")
            return nombre
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def borrar_rama(self, nombre):
        try:
            self.pedir("DELETE", f"/repos/{self.repo}/git/refs/heads/{urllib.parse.quote(nombre)}", intentos=1)
        except Falla:
            pass

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
def normal_codigo(c):
    """«k7p2 9qx4», «K7P29QX4» o «K7P2-9QX4» → «K7P2-9QX4»."""
    c = re.sub(r"[^A-Z0-9]", "", str(c or "").upper())
    return c[:4] + "-" + c[4:8] if len(c) == 8 else c


class Estado:
    def __init__(self, arranque=False):
        for d in ("publicaciones", "proyectos", "detallitos", "tmp", "nube", "fotos", os.path.join("nube", "archivos"), os.path.join("tmp", "subidas")):
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
        self.anunciando = ""
        self.arranque_id = secrets.token_hex(8)  # para que el vigía del túnel sepa que contesta ESTE servidor
        self.tunel_ok = 0                        # la última vez que el túnel se probó desde internet y contestó
        if arranque:
            # Sólo al prender: lo que quedó a medias de la vez anterior. (Las otras
            # órdenes —estado, admin, github— corren MIENTRAS el servidor trabaja.)
            for f in os.listdir(os.path.join(DATOS, "tmp")):
                if f == "subidas":
                    continue   # las subidas a medias se pueden seguir (se limpian a los 2 días)
                try:
                    p = os.path.join(DATOS, "tmp", f)
                    shutil.rmtree(p) if os.path.isdir(p) else os.unlink(p)
                except OSError:
                    pass

    # — El primer administrador —
    def instalado(self):
        return bool(self.db.uno("SELECT id FROM usuarios WHERE rol='admin' AND estado='activo'"))

    def codigo_instalacion(self):
        """El código para crear el primer administrador desde otro aparato.
        Es SIEMPRE el mismo hasta que se usa: vive en codigo-instalacion.txt y
        todas las órdenes (iniciar, estado…) leen ese mismo archivo."""
        if self.instalado():
            try:
                os.unlink(RUTA_CODIGO)
            except OSError:
                pass
            return None
        try:
            with open(RUTA_CODIGO, encoding="utf-8") as f:
                c = normal_codigo(f.read())
            if re.match(r"^[A-Z0-9]{4}-[A-Z0-9]{4}$", c):
                return c
        except OSError:
            pass
        c = "-".join("".join(secrets.choice(LETRAS_CODIGO) for _ in range(4)) for _ in range(2))
        try:
            # O_EXCL: si dos órdenes llegan a la vez, gana una y la otra lee ese mismo.
            fd = os.open(RUTA_CODIGO, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(c + "\n")
            return c
        except FileExistsError:
            with open(RUTA_CODIGO, encoding="utf-8") as f:
                return normal_codigo(f.read())

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

    temporales = []

    def armar(commit, arbol):
        viejos = gh.bajo(arbol, base)
        cambian = [(rel, p) for rel, p in archivos if viejos.get(f"{rel}") != huellas[rel]]
        # Lo que ya está en algún lado del repositorio (mismo contenido) no se sube: se reutiliza.
        en_repo = gh.shas_del_repo(arbol) if cambian else set()
        faltan = [(rel, p) for rel, p in cambian if rel not in subidos and huellas[rel] not in en_repo]
        t["hechos"] = len(archivos) - len(faltan)
        grandes = [(rel, p) for rel, p in faltan if os.path.getsize(p) > LIMITE_API]
        chicos = [x for x in faltan if x not in grandes]
        if grandes:
            t["paso"] = f"Subiendo {len(grandes)} archivo{'s' if len(grandes) > 1 else ''} grande{'s' if len(grandes) > 1 else ''} con git…"
            temporales.append(gh.subir_con_git(grandes))
            with lock:
                subidos.update(rel for rel, _ in grandes)
                t["hechos"] += len(grandes)
        if chicos:
            with concurrent.futures.ThreadPoolExecutor(2) as ex:   # 2 a la vez: el teléfono viejo no se ahoga
                list(ex.map(subir, chicos))
        t["paso"] = "Guardando en GitHub…"
        entradas = [{"path": f"{base}/{rel}", "mode": "100644", "type": "blob", "sha": huellas[rel]} for rel, _ in cambian]
        nuevos = {rel for rel, _ in archivos}
        borrar = [r for r in viejos if r not in nuevos]
        entradas += [{"path": f"{base}/{r}", "mode": "100644", "type": "blob", "sha": None} for r in borrar]
        ficha_lista = {"slug": slug, "titulo": titulo, "paginas": paginas, "fecha": iso(), "enlace": enlace}
        entradas.append({"path": f"{CARPETA_PUB}/lista.json", "mode": "100644", "type": "blob", "sha": gh.blob(_lista_nueva(gh, commit, poner=ficha_lista))})
        estado_final.update(subidos=len(cambian), borrados=len(borrar))
        return entradas

    try:
        sha = gh.confirmar(armar, f"Publicar «{titulo}» desde el servidor ({usuario})")
    finally:
        for r in temporales:   # la rama temporal ya no hace falta (sus archivos quedan en el commit)
            gh.borrar_rama(r)
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
    """Escribe servidor.json en tu sitio para que el editor encuentre el servidor solo.
    Si falla (sin internet, GitHub caído), el mantenimiento lo vuelve a intentar cada
    pocos minutos: la dirección sólo se da por anunciada cuando el commit entró."""
    url = E.url_publica()
    gh = E.github()
    if not (url and gh and E.aj["anunciar"]) or url in (E.anunciada, E.anunciando):
        return
    cuerpo = json.dumps({"url": url, "nombre": E.aj["nombre"], "actualizado": iso()}, ensure_ascii=False, indent=1).encode() + b"\n"

    def hacer(t):
        try:
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
            if armar(commit, arbol):
                gh.confirmar(armar, "Dirección del servidor del librito")
                gh.reconstruir()
            if E.url_publica() == url:
                E.anunciada = url
                log("Dirección anunciada en", ARCHIVO_ANUNCIO, "→", url, "(el editor la ve en uno o dos minutos)")
            return {}
        except Falla as e:
            log("No se pudo anunciar la dirección (lo vuelvo a intentar en unos minutos):", e)
            raise
        finally:
            E.anunciando = ""
    E.anunciando = url
    E.trabajo("anunciar", None, hacer)


def escribir_estado(borrar=False):
    """estado.json: lo que «librito» necesita saber del servidor PRENDIDO (nunca secretos)."""
    if borrar:
        try:
            os.unlink(RUTA_ESTADO)
        except OSError:
            pass
        return
    try:
        escribir_seguro(RUTA_ESTADO, json.dumps({
            "pid": os.getpid(), "version": VERSION, "puerto": E.aj["puerto"], "red_local": ip_local(),
            "url": E.url_publica(), "tunel": E.aj["tunel"], "tunel_listo": bool(E.url_tunel), "tunel_probado": iso(E.tunel_ok) if E.tunel_ok else "",
            "instalado": E.instalado(), "github": bool(E.github()), "desde": iso()}, ensure_ascii=False, indent=1))
    except OSError:
        pass


# ════════════════════════════════════════════════════════════════════════
#  El túnel (cloudflared): para que el editor en internet llegue al teléfono
#
#  · La dirección se da por buena sólo cuando cloudflared dice que conectó
#    («Registered tunnel connection»), no apenas la inventa.
#  · Un vigía la prueba DESDE INTERNET cada pocos minutos (pide /api/salud por
#    la dirección pública). Si deja de contestar 3 veces seguidas, se reabre.
#  · Si no logra conectar, la siguiente vez prueba con http2 (algunas redes de
#    datos bloquean QUIC, que es lo que usa de fábrica).
# ════════════════════════════════════════════════════════════════════════
class Tunel(threading.Thread):
    URL = re.compile(r"https://[-a-z0-9]+\.trycloudflare\.com")
    CONECTADO = re.compile(r"Registered tunnel connection|Connection [0-9a-f-]+ registered", re.I)

    def __init__(self, puerto):
        super().__init__(daemon=True)
        self.puerto, self.proc, self.parar = puerto, None, False
        self.url = ""            # la dirección de ESTE túnel (la global la puede tener ya otro)
        self.protocolo = "auto"
        self.fallos_vigia = 0

    def poner(self, url):
        if self.parar or not url or E.url_tunel == url:
            return
        E.url_tunel = url
        log("Túnel listo:", url)
        escribir_estado()
        try:
            anunciar_direccion()
        except Exception as e:   # noqa: BLE001
            log("No se pudo anunciar la dirección:", e)

    def run(self):
        espera, sin_conectar = 5, 0
        threading.Thread(target=self.vigia, daemon=True).start()
        while not self.parar:
            exe = shutil.which("cloudflared")
            if not exe:
                log("Túnel: no está cloudflared (instálalo con «pkg install cloudflared» y «librito reiniciar»). El servidor sólo se ve en tu wifi.")
                return
            orden = [exe, "tunnel", "--no-autoupdate"] + (["--protocol", self.protocolo] if self.protocolo != "auto" else []) + ["--url", f"http://127.0.0.1:{self.puerto}"]
            log("Túnel: abriendo con cloudflared" + (f" ({self.protocolo})" if self.protocolo != "auto" else "") + "…")
            try:
                self.proc = subprocess.Popen(orden, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, errors="replace")
            except OSError as e:
                log("Túnel: no se pudo abrir:", e)
                return
            inicio, self.url, conectado, ultimas = ahora(), "", False, []
            respaldo = None
            for linea in self.proc.stdout:
                ultimas = (ultimas + [linea.strip()])[-6:]
                m = self.URL.search(linea)
                if m and not self.url:
                    self.url = m.group(0)
                    # Por si esta versión de cloudflared no avisa al conectar: a los 25 s se da por buena igual.
                    respaldo = threading.Timer(25, lambda u=self.url: self.poner(u) if self.url == u else None)
                    respaldo.daemon = True
                    respaldo.start()
                if self.url and not conectado and self.CONECTADO.search(linea):
                    conectado = True
                    self.fallos_vigia = 0
                    self.poner(self.url)
            self.proc.wait()
            if respaldo:
                respaldo.cancel()
            if E.url_tunel == self.url:
                E.url_tunel = ""
                escribir_estado()
            if self.parar:
                return
            if not conectado:
                sin_conectar += 1
                errores = [l for l in ultimas if re.search(r"\b(ERR|error|failed)\b", l, re.I)] or ultimas[-1:]
                dijo = re.sub(r"^\S+Z\s+", "", errores[-1] if errores else "").strip()
                log("Túnel: no logró conectar." + (f" cloudflared dijo: {dijo[:200]}" if dijo else ""))
                if sin_conectar % 2 == 0:
                    self.protocolo = "http2" if self.protocolo == "auto" else "auto"
            else:
                sin_conectar = 0
            espera = 5 if ahora() - inicio > 120 else min(300, espera * 2)
            log(f"Túnel: se cerró; lo vuelvo a abrir en {espera} s.")
            for _ in range(espera):
                if self.parar:
                    return
                time.sleep(1)

    def vigia(self):
        """Prueba el túnel desde internet; si no contesta 3 veces seguidas, lo reabre."""
        while not self.parar:
            for _ in range(VIGIA_S):
                if self.parar:
                    return
                time.sleep(1)
            url = E.url_tunel
            if not url or url != self.url or not self.proc or self.proc.poll() is not None:
                continue
            try:
                req = urllib.request.Request(url + "/api/salud", headers={"User-Agent": "librito-vigia/" + VERSION})
                with urllib.request.urlopen(req, timeout=20) as r:
                    ok = json.loads(r.read() or b"{}").get("id") == E.arranque_id
            except Exception:   # noqa: BLE001 — cualquier cosa cuenta como «no contestó»
                ok = False
            if ok:
                self.fallos_vigia = 0
                E.tunel_ok = ahora()
                escribir_estado()
                continue
            self.fallos_vigia += 1
            log(f"Túnel: no contestó desde internet ({self.fallos_vigia} de 3).")
            if self.fallos_vigia >= 3:
                self.fallos_vigia = 0
                log("Túnel: lo reabro para que tenga una conexión nueva.")
                try:
                    self.proc.terminate()
                except OSError:
                    pass

    def cerrar(self):
        self.parar = True
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
        if E.url_tunel == self.url:
            E.url_tunel = ""


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

    def en_el_telefono(self):
        """¿Lo abriste en el navegador del MISMO teléfono (http://127.0.0.1:8787), sin pasar por el túnel?
        Ahí no hace falta el código de instalación: quien tiene el teléfono en la mano ya es el dueño."""
        ip = self.client_address[0]
        if ip not in ("127.0.0.1", "::1") and ip != ip_local():
            return False
        if any(self.headers.get(k) for k in ("CF-Connecting-IP", "CF-Ray", "Cf-Visitor", "X-Forwarded-For", "X-Forwarded-Host", "X-Forwarded-Proto")):
            return False   # llegó por el túnel (o por otro proxy)
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]").lower()
        return host in ("127.0.0.1", "localhost", "::1", ip_local())

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
        self._leido = True
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise Falla("Content-Length inválido.")
        if n > 64 * 1024:
            raise Falla("Demasiado grande.", 413)
        if n and "json" not in (self.headers.get("Content-Type") or ""):
            raise Falla("Se esperaba JSON.", 415)
        try:
            return json.loads(self.rfile.read(n) or b"{}") if n else {}
        except ValueError:
            raise Falla("JSON inválido.")

    def cuerpo_a_archivo(self):
        self._leido = True
        try:
            n = int(self.headers.get("Content-Length") or -1)
        except ValueError:
            n = -1
        if n < 0:
            raise Falla("Falta el tamaño de lo que se sube (Content-Length).", 411)
        if n > E.aj["max_subida_mb"] * 1024 * 1024:
            self._leido = False
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
        self._leido = False
        try:
            self.atender()
        except Falla as e:
            self.error(e.codigo, str(e))
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True
            return
        except Exception as e:   # noqa: BLE001
            log("Error atendiendo", self.command, self.path.split("?")[0], repr(e))
            try:
                self.error(500, "Algo salió mal en el servidor.")
            except OSError:
                pass
        self._vaciar()

    def _vaciar(self):
        """Si se contestó (un error, casi siempre) sin leer lo que mandaron, se lee y se tira:
        así la conexión queda limpia para el pedido siguiente y el navegador no ve un «corte»."""
        if self._leido:
            return
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = -1
        if n == 0:
            return
        if n < 0 or n > 64 * 1024 * 1024:
            self.close_connection = True
            return
        try:
            while n > 0:
                trozo = self.rfile.read(min(1 << 20, n))
                if not trozo:
                    break
                n -= len(trozo)
        except OSError:
            self.close_connection = True

    do_GET = do_HEAD = do_POST = do_PUT = do_PATCH = do_DELETE = _seguro

    # — Archivos: el panel y las publicaciones guardadas aquí —
    def estatico(self, camino):
        if camino in ("/", "/index.html"):
            return self.panel("index.html")
        if camino.startswith("/panel/"):
            return self.panel(camino[7:])
        if camino == "/favicon.ico":
            return self.panel("icono.svg")
        m = re.match(r"^/(p|d)/([A-Za-z0-9_-]{1,40})(/.*)?$", camino)
        if m:
            tipo, slug, resto = m.group(1), m.group(2), m.group(3)
            if resto is None:
                return self.responder(301, b"", "text/plain", {"Location": f"/{tipo}/{slug}/"})
            if tipo == "p":
                if not re.match(r"^[a-z0-9-]{1,40}$", slug):
                    return self.error(404, "No existe.")
                base = os.path.realpath(os.path.join(DATOS, "publicaciones", slug))
            else:
                # Un detallito: su dirección es larga y al azar (sólo la conocen los dos).
                if len(slug) < 20 or not E.db.uno("SELECT id FROM detallitos WHERE id=?", slug):
                    return self.error(404, "No existe.")
                base = os.path.realpath(os.path.join(DATOS, "detallitos", slug, "ver"))
            rel = resto.lstrip("/") or "index.html"
            if rel.endswith("/"):
                rel += "index.html"
            final = os.path.realpath(os.path.join(base, rel))
            if not final.startswith(base + os.sep) or not os.path.isfile(final):
                return self.error(404, "No existe.")
            # Lo publicado corre AISLADO (origen opaco): aunque traiga JavaScript,
            # no puede tocar el panel ni la API del servidor con tu sesión.
            csp = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads allow-pointer-lock allow-presentation allow-orientation-lock"
            extra = {"X-Robots-Tag": "noindex, nofollow"}
            if tipo == "d":
                # El editor (tu GitHub Pages) muestra el detallito dentro de su ventanita.
                marcos = ["'self'"] + sorted(E.origenes()) + ([u for u in [E.url_publica()] if u])
                if E.aj["permitir_local"]:
                    marcos += ["http://localhost:*", "http://127.0.0.1:*"]
                csp += "; frame-ancestors " + " ".join(marcos)
            else:
                extra["X-Frame-Options"] = "SAMEORIGIN"
            extra["Content-Security-Policy"] = csp
            return self.archivo(final, extra, cache="public, max-age=300")
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
    return {"id": u["id"], "usuario": u["usuario"], "rol": u["rol"], "estado": u["estado"], "creado": u.get("creado"), "ultimo": u.get("ultimo"),
            "nombre": u.get("nombre") or "", "foto_v": int(u.get("foto_v") or 0)}


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
    instalado = E.instalado()
    h.responder(200, {
        "nombre": E.aj["nombre"], "version": VERSION, "registro": E.aj["registro"],
        "instalado": instalado, "en_el_telefono": (not instalado) and h.en_el_telefono(),
        "github": bool(E.github()), "sitio": sitio,
        "url_publica": E.url_publica(), "editor": (sitio + "EditorDev/") if sitio else "",
        "max_subida_mb": E.aj["max_subida_mb"]})


@ruta("GET", "/api/salud")
def api_salud(h, s):
    """Para el vigía del túnel (y para ti): ¿contesta este servidor?"""
    h.responder(200, {"ok": True, "id": E.arranque_id, "version": VERSION})


@ruta("POST", "/api/instalar")
def api_instalar(h, s):
    if E.instalado():
        raise Falla("El servidor ya tiene administrador: entra con su usuario y contraseña.", 409)
    ip = h.ip()
    if E.frenado("instalar:" + ip):
        raise Falla("Demasiados intentos. Espera un poco.", 429)
    d = h.cuerpo_json()
    if not h.en_el_telefono():
        esperado = E.codigo_instalacion() or ""
        if not hmac.compare_digest(normal_codigo(d.get("codigo")).encode(), esperado.encode()):
            E.fallo("instalar:" + ip, limite=8)
            raise Falla("Ese no es el código. En Termux escribe «librito estado» y cópialo tal cual (o abre el panel en el mismo teléfono: ahí no hace falta).", 403)
    usuario = str(d.get("usuario", "")).strip().lower()
    if not USUARIO_RE.match(usuario):
        raise Falla("El usuario: de 3 a 32 letras minúsculas, números, punto, guion o guion bajo.")
    validar_contrasena(d.get("contrasena"))
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        E.db.x("UPDATE usuarios SET hash=?, rol='admin', estado='activo' WHERE usuario=?", hashear(d["contrasena"]), usuario)
    else:
        E.db.crear_usuario(usuario, d["contrasena"], "admin", "activo")
    E.codigo_instalacion()   # ya hay administrador: el código se borra
    escribir_estado()
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
    if E.db.uno("SELECT COUNT(*) n FROM usuarios")["n"] >= E.aj["max_usuarios"]:
        raise Falla("M.YNTHN ya está lleno por ahora. Inténtalo más tarde.", 503)
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        raise Falla("Ese usuario ya existe: elige otro.", 409)
    # Sin aprobación: la cuenta queda lista y entra al momento (con código, sólo con invitación).
    uid = E.db.crear_usuario(usuario, d["contrasena"], "editor", "activo")
    if inv:
        E.db.x("UPDATE invitaciones SET usado_por=? WHERE id=?", uid, inv["id"])
    E.fallo("registro:" + ip, limite=6, base=600)   # cuenta los registros: muchos seguidos frenan
    E.actividad(usuario, "registro", "con invitación" if inv else "abierto", ip)
    return entrar_y_responder(h, E.db.uno("SELECT * FROM usuarios WHERE id=?", uid), d)


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
    if u["estado"] == "pendiente":   # ya no hay aprobación: una cuenta que quedó esperando entra directo
        E.db.x("UPDATE usuarios SET estado='activo' WHERE id=?", u["id"])
        u["estado"] = "activo"
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


# — Cuotas: que nadie llene el teléfono —
def uso_de(uid):
    p = E.db.uno("SELECT COALESCE(SUM(bytes),0) n FROM proyectos WHERE usuario_id=?", uid)["n"]
    d = E.db.uno("SELECT COALESCE(SUM(bytes),0) n FROM detallitos WHERE de=? AND NOT (borrado_de=1 AND borrado_para=1)", uid)["n"]
    return p + d + uso_nube(uid)


def revisar_cuota(s, extra):
    if s["rol"] == "admin":
        return
    tope = E.aj["cuota_mb"] * 1024 * 1024
    if uso_de(s["usuario_id"]) + extra > tope:
        raise Falla(f"Llegaste a tu espacio en M.YNTHN ({E.aj['cuota_mb']} MB). Borra libritos o copias que ya no uses (o detallitos enviados).", 413)


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
    if s["rol"] != "admin" and not q.get("reemplazar") and E.db.uno("SELECT COUNT(*) n FROM publicaciones WHERE usuario_id=?", s["usuario_id"])["n"] >= E.aj["max_publicaciones"]:
        raise Falla(f"Ya tienes {E.aj['max_publicaciones']} páginas publicadas: quita alguna o actualiza una que ya esté.", 413)
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
        extra, n_nube = llenar_desde_nube(s, ficha, carpeta_nueva)
        total += extra
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
    E.db.x("UPDATE publicaciones SET paginas=?, archivos=?, bytes=?, estado='subiendo' WHERE slug=?", paginas, len(entradas) + n_nube, total, slug)
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
    h.responder(200, {"proyectos": [{"id": p["id"], "nombre": p["nombre"], "clave": p["clave"] or nombre_limpio(p["nombre"]), "bytes": p["bytes"], "paginas": p["paginas"], "creado": iso(p["creado"]), "autor": nombres.get(p["usuario_id"], "")} for p in l],
                      "uso": uso_de(s["usuario_id"]), "cuota": E.aj["cuota_mb"] * 1024 * 1024})


@ruta("POST", "/api/proyectos", "sesion")
def api_guardar_proyecto(h, s):
    """Una copia nueva del proyecto, en proyectos/<usuario>/<proyecto>/<fecha>.zip (se quedan las más nuevas)."""
    q = h.parametros()
    tmp = h.cuerpo_a_archivo()
    try:
        revisar_cuota(s, os.path.getsize(tmp))
        try:
            with zipfile.ZipFile(tmp) as z:
                pj = json.loads(z.read("project.json").decode("utf-8"))
        except (zipfile.BadZipFile, KeyError, ValueError):
            raise Falla("Eso no es un proyecto del editor (falta project.json).")
        nombre = (q.get("nombre") or pj.get("nombre") or "Mi librito").strip()[:80]
        clave = nombre_limpio(q.get("proyecto") or pj.get("id") or nombre, "proyecto")
        pid = time.strftime("%Y%m%d-%H%M%S") + "-" + secrets.token_hex(3)
        rel = os.path.join(nombre_limpio(s["usuario"], "usuario"), clave, pid + ".zip")
        destino = os.path.join(DATOS, "proyectos", rel)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.move(tmp, destino)
        os.chmod(destino, 0o600)
        tam = os.path.getsize(destino)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    E.db.x("INSERT INTO proyectos(id,usuario_id,nombre,bytes,creado,paginas,clave,ruta) VALUES(?,?,?,?,?,?,?,?)", pid, s["usuario_id"], nombre, tam, ahora(), len(pj.get("orden") or []), clave, rel)
    viejas = E.db.q("SELECT id FROM proyectos WHERE usuario_id=? AND clave=? ORDER BY creado DESC LIMIT -1 OFFSET ?", s["usuario_id"], clave, max(1, E.aj["copias_por_proyecto"]))
    for viejo in viejas:
        borrar_proyecto(viejo["id"])
    E.actividad(s["usuario"], "proyecto", nombre, h.ip())
    h.responder(201, {"id": pid, "nombre": nombre, "clave": clave, "bytes": tam, "copias": E.db.uno("SELECT COUNT(*) n FROM proyectos WHERE usuario_id=? AND clave=?", s["usuario_id"], clave)["n"]})


def ruta_proyecto(p):
    if p.get("ruta"):
        return os.path.join(DATOS, "proyectos", p["ruta"])
    return os.path.join(DATOS, "proyectos", str(p["usuario_id"]), p["id"] + ".zip")   # copias de antes de las carpetas


def borrar_proyecto(pid):
    p = E.db.uno("SELECT * FROM proyectos WHERE id=?", pid)
    if p:
        f = ruta_proyecto(p)
        try:
            os.unlink(f)
            d = os.path.dirname(f)
            if not os.listdir(d):
                os.rmdir(d)
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
    h.archivo(ruta_proyecto(p), {"Content-Disposition": f'attachment; filename="{nombre}"'}, cache="no-store")


@ruta("DELETE", "/api/proyectos/([0-9a-f-]{10,40})", "sesion")
def api_borrar_proyecto(h, s, pid):
    p = proyecto_de(s, pid)
    borrar_proyecto(p["id"])
    E.actividad(s["usuario"], "proyecto-borrar", p["nombre"], h.ip())
    h.responder(200, {"ok": True})


# ════════════════════════════════════════════════════════════════════════
#  LA NUBE — cada cuenta guarda AQUÍ sus libritos, fotos, música y videos,
#  para abrirlos desde cualquier aparato.
#
#  · Los archivos se guardan por su huella SHA-256 (nube/archivos/ab/abcd…):
#    la misma foto se guarda una sola vez aunque esté en mil libritos. Cada
#    cuenta «tiene» las huellas que subió (eso cuenta para su espacio).
#  · Cada librito es su project.json (nube/libritos/<cuenta>/<clave>.json),
#    con la huella de cada archivo. Guardar = mandar sólo lo que cambió.
#  · Las copias (guardar a mano) son instantáneas del project.json: no
#    duplican fotos ni videos.
#  · Las subidas son por partes y se pueden seguir donde se cortaron.
#  · Lo que ya ningún librito ni copia usa se borra solo.
# ════════════════════════════════════════════════════════════════════════
SHA_RE = r"([0-9a-f]{64})"
CLAVE_RE = r"([A-Za-z0-9_-]{3,64})"
SHA_OK = re.compile(r"^[0-9a-f]{64}$")


def nube(*p):
    return os.path.join(DATOS, "nube", *p)


def ruta_archivo(sha):
    return nube("archivos", sha[:2], sha)


def uso_nube(uid):
    a = E.db.uno("SELECT COALESCE(SUM(a.tam),0) n FROM archivos_de d JOIN archivos a ON a.sha=d.sha WHERE d.usuario_id=?", uid)["n"]
    l = E.db.uno("SELECT COALESCE(SUM(tam),0) n FROM libritos WHERE usuario_id=?", uid)["n"]
    c = E.db.uno("SELECT COALESCE(SUM(tam),0) n FROM copias WHERE usuario_id=?", uid)["n"]
    return a + l + c


def tiene_archivo(uid, sha):
    return bool(E.db.uno("SELECT 1 FROM archivos_de WHERE usuario_id=? AND sha=?", uid, sha))


def shas_de(d):
    """Las huellas de los archivos que usa un librito (y sus originales)."""
    out = set()
    for a in ((d or {}).get("assets") or {}).values():
        if not isinstance(a, dict):
            continue
        org = a.get("original") if isinstance(a.get("original"), dict) else {}
        for x in (a.get("sha"), org.get("sha")):
            if isinstance(x, str) and SHA_OK.match(x):
                out.add(x)
    return out


def leer_json(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def huella_sha256(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for trozo in iter(lambda: f.read(1 << 20), b""):
            h.update(trozo)
    return h.hexdigest()


def limpiar_nube(uid=None):
    """Quita lo que ya ningún librito ni copia usa (de una cuenta, o de todas)."""
    cuentas = [uid] if uid else [r["usuario_id"] for r in E.db.q("SELECT DISTINCT usuario_id FROM archivos_de")]
    viejo = ahora() - 3600   # lo recién subido se respeta: su librito puede estar por llegar
    for u in cuentas:
        usados = set()
        for r in E.db.q("SELECT clave FROM libritos WHERE usuario_id=?", u):
            usados |= shas_de(leer_json(nube("libritos", str(u), r["clave"] + ".json")))
        for r in E.db.q("SELECT id, clave FROM copias WHERE usuario_id=?", u):
            usados |= shas_de(leer_json(nube("copias", str(u), r["clave"], r["id"] + ".json")))
        for r in E.db.q("SELECT sha FROM archivos_de WHERE usuario_id=? AND creado < ?", u, viejo):
            if r["sha"] not in usados:
                E.db.x("DELETE FROM archivos_de WHERE usuario_id=? AND sha=?", u, r["sha"])
    for r in E.db.q("SELECT sha FROM archivos WHERE sha NOT IN (SELECT sha FROM archivos_de)"):
        try:
            os.unlink(ruta_archivo(r["sha"]))
        except OSError:
            pass
        E.db.x("DELETE FROM archivos WHERE sha=?", r["sha"])


@ruta("GET", "/api/nube", "sesion")
def api_nube(h, s):
    uid = s["usuario_id"]
    h.responder(200, {
        "libritos": [{"clave": r["clave"], "nombre": r["nombre"], "editado": r["editado"], "subido": iso(r["subido"]) if r["subido"] else "",
                      "paginas": r["paginas"], "tam": r["tam"], "aparato": r["aparato"] or ""}
                     for r in E.db.q("SELECT * FROM libritos WHERE usuario_id=? ORDER BY editado DESC", uid)],
        "uso": uso_de(uid), "cuota": E.aj["cuota_mb"] * 1024 * 1024, "sin_tope": s["rol"] == "admin"})


@ruta("POST", "/api/nube/faltan", "sesion")
def api_nube_faltan(h, s):
    """¿Cuáles de estos archivos te faltan en la nube? (lo que ya está, aunque lo haya subido otra cuenta, no se vuelve a subir)."""
    uid = s["usuario_id"]
    shas = [x for x in (h.cuerpo_json().get("shas") or [])[:5000] if isinstance(x, str) and SHA_OK.match(x)]
    faltan = []
    for sha in dict.fromkeys(shas):
        if tiene_archivo(uid, sha):
            continue
        if E.db.uno("SELECT 1 FROM archivos WHERE sha=?", sha) and os.path.isfile(ruta_archivo(sha)):
            E.db.x("INSERT OR IGNORE INTO archivos_de(usuario_id,sha,creado) VALUES(?,?,?)", uid, sha, ahora())
            continue
        faltan.append(sha)
    h.responder(200, {"faltan": faltan})


@ruta("PUT", f"/api/nube/archivos/{SHA_RE}", "sesion")
def api_nube_subir_archivo(h, s, sha):
    """Una parte de un archivo (?desde=<byte>&tam=<total>). Si se cortó, se sigue desde donde quedó."""
    uid = s["usuario_id"]
    q = h.parametros()
    try:
        desde, total = int(q.get("desde") or 0), int(q.get("tam") or 0)
    except ValueError:
        raise Falla("desde/tam no son números.")
    if total <= 0:
        raise Falla("Falta el tamaño del archivo (tam).")
    if total > E.aj["max_subida_mb"] * 1024 * 1024:
        raise Falla(f"Ese archivo pesa más de {E.aj['max_subida_mb']} MB.", 413)
    if tiene_archivo(uid, sha) or (E.db.uno("SELECT 1 FROM archivos WHERE sha=?", sha) and os.path.isfile(ruta_archivo(sha))):
        h._leido = False   # ya estaba: lo que mandaron se tira
        E.db.x("INSERT OR IGNORE INTO archivos_de(usuario_id,sha,creado) VALUES(?,?,?)", uid, sha, ahora())
        return h.responder(200, {"sha": sha, "listo": True, "tam": total})
    parte = os.path.join(DATOS, "tmp", "subidas", f"{uid}-{sha}")
    tengo = os.path.getsize(parte) if os.path.exists(parte) else 0
    if desde != tengo:
        h._leido = False
        return h.responder(409, {"error": "Esa parte no sigue a la anterior.", "tengo": tengo})
    if desde == 0:
        revisar_cuota(s, total)
    tmp = h.cuerpo_a_archivo()
    try:
        if tengo + os.path.getsize(tmp) > total:
            os.unlink(parte) if os.path.exists(parte) else None
            raise Falla("Llegó más de lo que dijiste que pesaba.")
        with open(parte, "ab") as dst, open(tmp, "rb") as src:
            shutil.copyfileobj(src, dst, 1 << 20)
    finally:
        os.unlink(tmp)
    tengo = os.path.getsize(parte)
    if tengo < total:
        return h.responder(202, {"sha": sha, "listo": False, "tengo": tengo})
    if huella_sha256(parte) != sha:
        os.unlink(parte)
        raise Falla("El archivo llegó dañado (su huella no coincide). Se vuelve a subir solo.", 422)
    final = ruta_archivo(sha)
    os.makedirs(os.path.dirname(final), exist_ok=True)
    os.replace(parte, final)
    os.chmod(final, 0o600)
    mime = q.get("tipo") if re.match(r"^[a-z]+/[A-Za-z0-9.+-]{1,60}$", q.get("tipo") or "") else ""
    E.db.x("INSERT OR IGNORE INTO archivos(sha,tam,mime,creado) VALUES(?,?,?,?)", sha, total, mime, ahora())
    E.db.x("INSERT OR IGNORE INTO archivos_de(usuario_id,sha,creado) VALUES(?,?,?)", uid, sha, ahora())
    h.responder(201, {"sha": sha, "listo": True, "tam": total})


@ruta("GET", f"/api/nube/archivos/{SHA_RE}", "sesion")
def api_nube_bajar_archivo(h, s, sha):
    if not (tiene_archivo(s["usuario_id"], sha) or s["rol"] == "admin") or not os.path.isfile(ruta_archivo(sha)):
        raise Falla("Ese archivo no está en tu nube.", 404)
    h.archivo(ruta_archivo(sha), cache="private, max-age=31536000, immutable")


def json_de_subida(h):
    tmp = h.cuerpo_a_archivo()
    try:
        d = leer_json(tmp)
        if not isinstance(d, dict) or not isinstance(d.get("orden"), list) or not isinstance(d.get("paginas"), dict):
            raise Falla("Eso no es un librito del editor.")
        return d, tmp
    except BaseException:
        os.unlink(tmp)
        raise


@ruta("PUT", f"/api/nube/libritos/{CLAVE_RE}", "sesion")
def api_nube_guardar(h, s, clave):
    """El librito como está ahora (?base=<editado que conocías>; ?forzar=1 para pisar otro aparato)."""
    uid, q = s["usuario_id"], h.parametros()
    d, tmp = json_de_subida(h)
    try:
        faltan = [x for x in shas_de(d) if not tiene_archivo(uid, x)]
        if faltan:
            return h.responder(409, {"error": "Faltan archivos en la nube; súbelos primero.", "faltan": faltan[:500]})
        ex = E.db.uno("SELECT * FROM libritos WHERE usuario_id=? AND clave=?", uid, clave)
        try:
            editado, base = float(d.get("editado") or 0), float(q.get("base") or 0)
        except (TypeError, ValueError):
            editado, base = 0.0, 0.0
        if not ex and base > 0 and q.get("forzar") != "1":
            # Ya estuvo en la nube y alguien lo borró desde otro aparato: no se revive solo.
            return h.responder(410, {"quitado": True, "error": "Este librito se borró de tu nube desde otro aparato."})
        if ex and q.get("forzar") != "1" and ex["editado"] and ex["editado"] > base + 1 and abs(ex["editado"] - editado) > 1:
            return h.responder(409, {"conflicto": True, "editado": ex["editado"], "aparato": ex["aparato"] or "",
                                     "error": "Este librito cambió en otro aparato después de la última vez que lo abriste aquí."})
        tam = os.path.getsize(tmp)
        revisar_cuota(s, tam - (ex["tam"] if ex else 0))
        destino = nube("libritos", str(uid), clave + ".json")
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        os.replace(tmp, destino)
        os.chmod(destino, 0o600)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    nombre = str(d.get("nombre") or "Mi librito")[:80]
    aparato = (q.get("aparato") or "")[:60]
    E.db.x("INSERT INTO libritos(usuario_id,clave,nombre,editado,subido,paginas,tam,aparato) VALUES(?,?,?,?,?,?,?,?) "
           "ON CONFLICT(usuario_id,clave) DO UPDATE SET nombre=excluded.nombre, editado=excluded.editado, subido=excluded.subido, "
           "paginas=excluded.paginas, tam=excluded.tam, aparato=excluded.aparato",
           uid, clave, nombre, editado or ahora() * 1000, ahora(), len(d["orden"]), tam, aparato)
    h.responder(200, {"clave": clave, "editado": editado, "subido": iso()})


@ruta("GET", f"/api/nube/libritos/{CLAVE_RE}", "sesion")
def api_nube_abrir(h, s, clave):
    ruta_j = nube("libritos", str(s["usuario_id"]), clave + ".json")
    if not os.path.isfile(ruta_j):
        raise Falla("Ese librito no está en tu nube.", 404)
    h.archivo(ruta_j, cache="no-store")


def borrar_copia(uid, cid):
    c = E.db.uno("SELECT * FROM copias WHERE id=? AND usuario_id=?", cid, uid)
    if c:
        try:
            os.unlink(nube("copias", str(uid), c["clave"], cid + ".json"))
        except OSError:
            pass
        E.db.x("DELETE FROM copias WHERE id=?", cid)


@ruta("DELETE", f"/api/nube/libritos/{CLAVE_RE}", "sesion")
def api_nube_borrar(h, s, clave):
    uid = s["usuario_id"]
    try:
        os.unlink(nube("libritos", str(uid), clave + ".json"))
    except OSError:
        pass
    E.db.x("DELETE FROM libritos WHERE usuario_id=? AND clave=?", uid, clave)
    for c in E.db.q("SELECT id FROM copias WHERE usuario_id=? AND clave=?", uid, clave):
        borrar_copia(uid, c["id"])
    E.actividad(s["usuario"], "nube-borrar", clave, h.ip())
    E.db.x("UPDATE archivos_de SET creado=0 WHERE usuario_id=?", uid)   # se puede limpiar ya
    limpiar_nube(uid)
    h.responder(200, {"ok": True})


@ruta("POST", f"/api/nube/libritos/{CLAVE_RE}/copia", "sesion")
def api_nube_copia(h, s, clave):
    """Guardar a mano: una instantánea del librito (no duplica fotos ni videos)."""
    uid = s["usuario_id"]
    l = E.db.uno("SELECT * FROM libritos WHERE usuario_id=? AND clave=?", uid, clave)
    origen = nube("libritos", str(uid), clave + ".json")
    if not l or not os.path.isfile(origen):
        raise Falla("Primero tiene que estar en tu nube.", 404)
    revisar_cuota(s, l["tam"] or 0)
    cid = time.strftime("%Y%m%d-%H%M%S") + "-" + secrets.token_hex(3)
    destino = nube("copias", str(uid), clave, cid + ".json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copyfile(origen, destino)
    os.chmod(destino, 0o600)
    E.db.x("INSERT INTO copias(id,usuario_id,clave,nombre,creado,paginas,tam) VALUES(?,?,?,?,?,?,?)", cid, uid, clave, l["nombre"], ahora(), l["paginas"], l["tam"])
    for viejo in E.db.q("SELECT id FROM copias WHERE usuario_id=? AND clave=? ORDER BY creado DESC LIMIT -1 OFFSET ?", uid, clave, max(1, E.aj["copias_por_proyecto"])):
        borrar_copia(uid, viejo["id"])
    E.actividad(s["usuario"], "copia", l["nombre"], h.ip())
    h.responder(201, {"id": cid, "copias": E.db.uno("SELECT COUNT(*) n FROM copias WHERE usuario_id=? AND clave=?", uid, clave)["n"]})


@ruta("GET", "/api/nube/copias", "sesion")
def api_nube_copias(h, s):
    h.responder(200, {"copias": [{"id": c["id"], "clave": c["clave"], "nombre": c["nombre"], "creado": iso(c["creado"]), "paginas": c["paginas"], "tam": c["tam"]}
                                 for c in E.db.q("SELECT * FROM copias WHERE usuario_id=? ORDER BY creado DESC", s["usuario_id"])],
                      "uso": uso_de(s["usuario_id"]), "cuota": E.aj["cuota_mb"] * 1024 * 1024})


@ruta("GET", r"/api/nube/copias/([0-9a-f-]{10,40})", "sesion")
def api_nube_abrir_copia(h, s, cid):
    c = E.db.uno("SELECT * FROM copias WHERE id=? AND usuario_id=?", cid, s["usuario_id"])
    ruta_j = c and nube("copias", str(s["usuario_id"]), c["clave"], cid + ".json")
    if not c or not os.path.isfile(ruta_j):
        raise Falla("Esa copia no existe.", 404)
    h.archivo(ruta_j, cache="no-store")


@ruta("DELETE", r"/api/nube/copias/([0-9a-f-]{10,40})", "sesion")
def api_nube_borrar_copia(h, s, cid):
    borrar_copia(s["usuario_id"], cid)
    E.db.x("UPDATE archivos_de SET creado=0 WHERE usuario_id=?", s["usuario_id"])
    limpiar_nube(s["usuario_id"])
    h.responder(200, {"ok": True})


@ruta("GET", "/api/yo/ajustes", "sesion")
def api_mis_ajustes(h, s):
    r = E.db.uno("SELECT * FROM ajustes_de WHERE usuario_id=?", s["usuario_id"])
    h.responder(200, {"ajustes": json.loads(r["datos"]) if r and r["datos"] else None, "editado": r["editado"] if r else 0})


@ruta("PUT", "/api/yo/ajustes", "sesion")
def api_poner_mis_ajustes(h, s):
    d = h.cuerpo_json()
    if not isinstance(d.get("ajustes"), dict):
        raise Falla("Faltan los ajustes.")
    try:
        editado = float(d.get("editado") or ahora() * 1000)
    except (TypeError, ValueError):
        editado = ahora() * 1000
    E.db.x("INSERT INTO ajustes_de(usuario_id,datos,editado) VALUES(?,?,?) ON CONFLICT(usuario_id) DO UPDATE SET datos=excluded.datos, editado=excluded.editado",
           s["usuario_id"], json.dumps(d["ajustes"], ensure_ascii=False)[:60000], editado)
    h.responder(200, {"ok": True, "editado": editado})


def llenar_desde_nube(s, ficha, destino, paquete=None):
    """Lo que el editor no mandó en el .zip porque ya estaba en tu nube («nube» en publicar.json): se copia aquí."""
    refs = (ficha or {}).get("nube") or {}
    if not isinstance(refs, dict) or not refs:
        return 0, 0
    base = os.path.realpath(destino)
    total = n = 0
    z = zipfile.ZipFile(paquete, "a") if paquete else None
    try:
        nombres = set(z.namelist()) if z else set()
        for rel, sha in list(refs.items())[:5000]:
            if not (isinstance(rel, str) and ruta_segura(rel) and rel.startswith("assets/") and isinstance(sha, str) and SHA_OK.match(sha)):
                raise Falla("Una referencia a la nube no es válida.")
            if not (tiene_archivo(s["usuario_id"], sha) or s["rol"] == "admin") or not os.path.isfile(ruta_archivo(sha)):
                raise Falla("Falta un archivo en tu nube (¿se cortó la subida?). Vuelve a intentarlo.", 409)
            final = os.path.realpath(os.path.join(base, rel))
            if not final.startswith(base + os.sep):
                raise Falla("Ruta no permitida.")
            os.makedirs(os.path.dirname(final), exist_ok=True)
            shutil.copyfile(ruta_archivo(sha), final)
            total += os.path.getsize(final)
            n += 1
            if z and rel not in nombres:
                z.write(ruta_archivo(sha), rel, compress_type=zipfile.ZIP_STORED)
    finally:
        if z:
            z.close()
    return total, n


# — Vincular a tu Amorcito —
def pareja_de(uid):
    u = E.db.uno("SELECT pareja_id, pareja_desde FROM usuarios WHERE id=?", uid)
    if not u or not u["pareja_id"]:
        return None
    p = E.db.uno("SELECT id, usuario, visto, nombre, cumple, novios, foto_v FROM usuarios WHERE id=? AND estado='activo'", u["pareja_id"])
    if not p:
        return None
    return {"usuario": p["usuario"], "desde": iso(u["pareja_desde"]) if u["pareja_desde"] else "", "en_linea": bool(p["visto"] and ahora() - p["visto"] < 120),
            "visto": iso(p["visto"]) if p["visto"] else "", "nombre": p["nombre"] or "", "cumple": p["cumple"] or "", "novios": p["novios"] or "",
            "foto_v": int(p["foto_v"] or 0)}


# — Tu perfil: foto, nombre, cumpleaños y desde cuándo son novios —
FECHA_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FOTO_MAX = 2 * 1024 * 1024
FOTO_TIPOS = ((b"\xff\xd8\xff", ".jpg"), (b"\x89PNG\r\n\x1a\n", ".png"), (b"RIFF", ".webp"))


def fecha_valida(v):
    """AAAA-MM-DD de verdad (o vacío para quitarla)."""
    v = str(v or "").strip()[:10]
    if not v:
        return ""
    if not FECHA_RE.match(v):
        raise Falla("La fecha va como AAAA-MM-DD.")
    a, m, d = (int(x) for x in v.split("-"))
    try:
        t = time.mktime((a, m, d, 12, 0, 0, 0, 0, -1))
    except (OverflowError, ValueError):
        raise Falla("Esa fecha no existe.")
    if time.localtime(t)[:3] != (a, m, d) or a < 1900 or t > ahora() + 86400:
        raise Falla("Esa fecha no puede ser.")
    return v


def perfil_de(u):
    return {"usuario": u["usuario"], "nombre": u["nombre"] or "", "cumple": u["cumple"] or "", "novios": u["novios"] or "", "foto_v": int(u["foto_v"] or 0)}


def ruta_foto(uid):
    """La foto de perfil de una cuenta (la que haya: .jpg, .png o .webp), o None."""
    for _, ext in FOTO_TIPOS:
        r = os.path.join(DATOS, "fotos", f"{uid}{ext}")
        if os.path.isfile(r):
            return r
    return None


def borrar_foto(uid):
    for _, ext in FOTO_TIPOS:
        try:
            os.unlink(os.path.join(DATOS, "fotos", f"{uid}{ext}"))
        except OSError:
            pass


@ruta("GET", "/api/yo/perfil", "sesion")
def api_mi_perfil(h, s):
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    h.responder(200, {"perfil": perfil_de(u), "pareja": pareja_de(u["id"])})


@ruta("PUT", "/api/yo/perfil", "sesion")
def api_poner_perfil(h, s):
    d = h.cuerpo_json()
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    cambios = {}
    if "nombre" in d:
        nombre = re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f<>]", "", str(d.get("nombre") or ""))).strip()
        if len(nombre) > 40:
            raise Falla("Tu nombre: hasta 40 letras.")
        cambios["nombre"] = nombre
    for k in ("cumple", "novios"):
        if k in d:
            cambios[k] = fecha_valida(d.get(k))
    for k, v in cambios.items():
        E.db.x(f"UPDATE usuarios SET {k}=? WHERE id=?", v, u["id"])
    # Desde cuándo son novios es de los dos: se le pone igual a tu amorcito.
    if "novios" in cambios and u["pareja_id"]:
        E.db.x("UPDATE usuarios SET novios=? WHERE id=? AND pareja_id=?", cambios["novios"], u["pareja_id"], u["id"])
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", u["id"])
    h.responder(200, {"perfil": perfil_de(u), "pareja": pareja_de(u["id"])})


@ruta("PUT", "/api/yo/foto", "sesion")
def api_poner_foto(h, s):
    """Tu foto de perfil (jpg, png o webp, hasta 2 MB; el editor ya la manda recortada y chiquita)."""
    try:
        n = int(h.headers.get("Content-Length") or -1)
    except ValueError:
        n = -1
    if n <= 0 or n > FOTO_MAX:
        h._leido = False
        raise Falla("La foto tiene que pesar menos de 2 MB.", 413)
    datos = h.rfile.read(n)
    h._leido = True
    ext = next((e for m, e in FOTO_TIPOS if datos.startswith(m) and (e != ".webp" or datos[8:12] == b"WEBP")), None)
    if not ext:
        raise Falla("Eso no es una foto (jpg, png o webp).", 415)
    uid = s["usuario_id"]
    os.makedirs(os.path.join(DATOS, "fotos"), exist_ok=True)
    borrar_foto(uid)
    final = os.path.join(DATOS, "fotos", f"{uid}{ext}")
    with open(final + ".tmp", "wb") as f:
        f.write(datos)
    os.replace(final + ".tmp", final)
    os.chmod(final, 0o600)
    v = int(ahora() * 1000)
    E.db.x("UPDATE usuarios SET foto_v=? WHERE id=?", v, uid)
    h.responder(200, {"foto_v": v})


@ruta("DELETE", "/api/yo/foto", "sesion")
def api_quitar_foto(h, s):
    borrar_foto(s["usuario_id"])
    E.db.x("UPDATE usuarios SET foto_v=0 WHERE id=?", s["usuario_id"])
    h.responder(200, {"foto_v": 0})


@ruta("GET", "/api/yo/foto", "sesion")
def api_mi_foto(h, s):
    r = ruta_foto(s["usuario_id"])
    if not r:
        raise Falla("Todavía no tienes foto.", 404)
    h.archivo(r, cache="private, max-age=31536000, immutable")


@ruta("GET", "/api/amor/foto", "sesion")
def api_foto_pareja(h, s):
    u = E.db.uno("SELECT pareja_id FROM usuarios WHERE id=?", s["usuario_id"])
    r = u and u["pareja_id"] and pareja_de(s["usuario_id"]) and ruta_foto(u["pareja_id"])
    if not r:
        raise Falla("Tu amorcito todavía no tiene foto.", 404)
    h.archivo(r, cache="private, max-age=31536000, immutable")


@ruta("GET", "/api/amor", "sesion")
def api_amor(h, s):
    u = E.db.uno("SELECT codigo_amor FROM usuarios WHERE id=?", s["usuario_id"])
    h.responder(200, {"codigo": u["codigo_amor"], "pareja": pareja_de(s["usuario_id"])})


@ruta("POST", "/api/amor/vincular", "sesion")
def api_vincular(h, s):
    ip = h.ip()
    if E.frenado("amor:" + str(s["usuario_id"])):
        raise Falla("Demasiados intentos. Espera unos minutos.", 429)
    codigo = re.sub(r"[^A-Z0-9]", "", str(h.cuerpo_json().get("codigo", "")).upper())
    if codigo.startswith("AMOR"):
        codigo = codigo[4:]
    codigo = "AMOR-" + codigo[:4] + "-" + codigo[4:8]
    yo = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    if yo["pareja_id"] and pareja_de(yo["id"]):
        raise Falla("Ya estás vinculado con tu amorcito. Para cambiar, primero desvincúlate.", 409)
    otro = E.db.uno("SELECT * FROM usuarios WHERE codigo_amor=? AND estado='activo'", codigo)
    if not otro:
        E.fallo("amor:" + str(s["usuario_id"]), limite=8)
        raise Falla("Ese código no es de nadie. Revísalo con tu amorcito (se ve como AMOR-XXXX-XXXX).", 404)
    if otro["id"] == yo["id"]:
        raise Falla("Ese es tu propio código: pega el de tu amorcito.")
    if otro["pareja_id"] and otro["pareja_id"] != yo["id"] and pareja_de(otro["id"]):
        raise Falla("Esa cuenta ya está vinculada con alguien más.", 409)
    t = ahora()
    E.db.x("UPDATE usuarios SET pareja_id=?, pareja_desde=? WHERE id=?", otro["id"], t, yo["id"])
    E.db.x("UPDATE usuarios SET pareja_id=?, pareja_desde=? WHERE id=?", yo["id"], t, otro["id"])
    # «Novios desde»: si uno de los dos ya lo había puesto, queda para los dos.
    novios = yo["novios"] or otro["novios"]
    if novios:
        E.db.x("UPDATE usuarios SET novios=? WHERE id IN (?,?)", novios, yo["id"], otro["id"])
    E.acierto("amor:" + str(s["usuario_id"]))
    E.actividad(s["usuario"], "vincular", f"con {otro['usuario']}", ip)
    h.responder(200, {"pareja": pareja_de(yo["id"])})


@ruta("DELETE", "/api/amor", "sesion")
def api_desvincular(h, s):
    yo = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    if yo["pareja_id"]:
        E.db.x("UPDATE usuarios SET pareja_id=NULL, pareja_desde=NULL WHERE id=? AND pareja_id=?", yo["pareja_id"], yo["id"])
    E.db.x("UPDATE usuarios SET pareja_id=NULL, pareja_desde=NULL WHERE id=?", yo["id"])
    E.actividad(s["usuario"], "desvincular", "", h.ip())
    h.responder(200, {"ok": True})


@ruta("POST", "/api/amor/codigo", "sesion")
def api_codigo_nuevo(h, s):
    if pareja_de(s["usuario_id"]):
        raise Falla("Mientras estés vinculado tu código no cambia.", 409)
    c = E.db.codigo_libre()
    E.db.x("UPDATE usuarios SET codigo_amor=? WHERE id=?", c, s["usuario_id"])
    h.responder(200, {"codigo": c})


@ruta("GET", "/api/latido", "sesion")
def api_latido(h, s):
    """El editor pregunta cada tanto: así se sabe quién está en línea y si llegó un detallito."""
    E.db.x("UPDATE usuarios SET visto=? WHERE id=?", ahora(), s["usuario_id"])
    n = E.db.uno("SELECT COUNT(*) n FROM detallitos WHERE para=? AND visto IS NULL AND borrado_para=0", s["usuario_id"])["n"]
    r = E.db.uno("SELECT COUNT(*) n FROM detallitos WHERE de=? AND reaccion IS NOT NULL AND reaccion_vista=0 AND borrado_de=0", s["usuario_id"])["n"]
    c = E.db.uno("SELECT COUNT(*) n FROM mensajes WHERE para=? AND visto IS NULL AND borrado=0", s["usuario_id"])["n"]
    h.responder(200, {"nuevos": n, "reacciones": r, "chat": c, "pareja": pareja_de(s["usuario_id"])})


# — Detallitos: páginas que se mandan entre los dos y se van coleccionando —
DETALLITO_RE = r"([A-Za-z0-9_-]{20,40})"


# Las reacciones que se pueden dejar en una página de tu amorcito (el editor pone su dibujo y su sonido).
REACCIONES = ("te-amo", "me-encanto", "llore", "abrazo", "beso", "risa")
PORTADITA_MAX = 600 * 1024


def fila_detallito(d, nombres, apodos=None):
    apodos = apodos or {}
    return {"id": d["id"], "titulo": d["titulo"], "mensaje": d["mensaje"], "color": d["color"], "creado": iso(d["creado"]),
            "visto": iso(d["visto"]) if d["visto"] else "", "ver": f"/d/{d['id']}/", "de": nombres.get(d["de"], ""), "para": nombres.get(d["para"], ""),
            "de_nombre": apodos.get(d["de"], ""), "para_nombre": apodos.get(d["para"], ""), "bytes": d["bytes"],
            "reaccion": d["reaccion"] or "", "reaccion_t": iso(d["reaccion_t"]) if d["reaccion_t"] else "",
            "reaccion_nueva": bool(d["reaccion"] and not d["reaccion_vista"]),
            "portadita": f"/d/{d['id']}/portadita.{d['portadita']}" if d["portadita"] else ""}


@ruta("GET", "/api/detallitos", "sesion")
def api_detallitos(h, s):
    uid = s["usuario_id"]
    filas = E.db.q("SELECT id, usuario, nombre FROM usuarios")
    nombres = {u["id"]: u["usuario"] for u in filas}
    apodos = {u["id"]: u["nombre"] or u["usuario"] for u in filas}
    h.responder(200, {
        "recibidos": [fila_detallito(d, nombres, apodos) for d in E.db.q("SELECT * FROM detallitos WHERE para=? AND borrado_para=0 ORDER BY creado DESC LIMIT 300", uid)],
        "enviados": [fila_detallito(d, nombres, apodos) for d in E.db.q("SELECT * FROM detallitos WHERE de=? AND borrado_de=0 ORDER BY creado DESC LIMIT 300", uid)],
        "pareja": pareja_de(uid)})


@ruta("POST", "/api/detallitos", "sesion")
def api_mandar_detallito(h, s):
    q = h.parametros()
    yo = E.db.uno("SELECT * FROM usuarios WHERE id=?", s["usuario_id"])
    if not (yo["pareja_id"] and pareja_de(yo["id"])):
        raise Falla("Primero vincúlate con tu amorcito (Vincular a tu Amorcito).", 409)
    tmp = h.cuerpo_a_archivo()
    did = secrets.token_urlsafe(18)
    carpeta = os.path.join(DATOS, "detallitos", did)
    try:
        revisar_cuota(s, os.path.getsize(tmp))
        entradas, ficha = revisar_zip(tmp, E.aj["max_subida_mb"] * 1024 * 1024 * 4)
        abrir_zip(tmp, entradas, os.path.join(carpeta, "ver"))
        shutil.move(tmp, os.path.join(carpeta, "paquete.zip"))
        # Lo que venía de tu nube va al detallito y a su paquete (para que tu amorcito pueda guardarlo entero).
        llenar_desde_nube(s, ficha, os.path.join(carpeta, "ver"), os.path.join(carpeta, "paquete.zip"))
    except BaseException:
        shutil.rmtree(carpeta, ignore_errors=True)
        raise
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    titulo = (q.get("titulo") or "Un detallito").strip()[:80]
    mensaje = (q.get("mensaje") or "").strip()[:280]
    color = q.get("color") if re.match(r"^#[0-9a-fA-F]{3,8}$", q.get("color") or "") else "#ffd1e6"
    tam = tamano_carpeta(carpeta)
    E.db.x("INSERT INTO detallitos(id,de,para,titulo,mensaje,color,creado,bytes) VALUES(?,?,?,?,?,?,?,?)", did, yo["id"], yo["pareja_id"], titulo, mensaje, color, ahora(), tam)
    E.actividad(s["usuario"], "detallito", titulo, h.ip())
    nombres = {u["id"]: u["usuario"] for u in E.db.q("SELECT id, usuario FROM usuarios WHERE id IN (?,?)", yo["id"], yo["pareja_id"])}
    h.responder(201, {"detallito": fila_detallito(E.db.uno("SELECT * FROM detallitos WHERE id=?", did), nombres)})


def detallito_de(s, did):
    d = E.db.uno("SELECT * FROM detallitos WHERE id=?", did)
    if not d or s["usuario_id"] not in (d["de"], d["para"]):
        raise Falla("Ese detallito no existe.", 404)
    return d


@ruta("POST", f"/api/detallitos/{DETALLITO_RE}/visto", "sesion")
def api_detallito_visto(h, s, did):
    d = detallito_de(s, did)
    if d["para"] == s["usuario_id"] and not d["visto"]:
        E.db.x("UPDATE detallitos SET visto=? WHERE id=?", ahora(), did)
    h.responder(200, {"ok": True})


@ruta("PUT", f"/api/detallitos/{DETALLITO_RE}/reaccion", "sesion")
def api_reaccionar(h, s, did):
    """Reaccionar a una página que te mandó tu amorcito (sólo quien la recibió). Vacío = quitarla."""
    d = detallito_de(s, did)
    if d["para"] != s["usuario_id"]:
        raise Falla("Sólo puedes reaccionar a las páginas que te mandaron.", 403)
    r = str(h.cuerpo_json().get("reaccion") or "").strip()
    if r and r not in REACCIONES:
        raise Falla("Esa reacción no existe.", 400)
    if r:
        E.db.x("UPDATE detallitos SET reaccion=?, reaccion_t=?, reaccion_vista=0 WHERE id=?", r, ahora(), did)
    else:
        E.db.x("UPDATE detallitos SET reaccion=NULL, reaccion_t=NULL, reaccion_vista=1 WHERE id=?", did)
    h.responder(200, {"reaccion": r})


@ruta("POST", "/api/detallitos/reacciones/vistas", "sesion")
def api_reacciones_vistas(h, s):
    """Quien mandó las páginas ya vio cómo reaccionó su amorcito."""
    E.db.x("UPDATE detallitos SET reaccion_vista=1 WHERE de=? AND reaccion IS NOT NULL AND reaccion_vista=0", s["usuario_id"])
    h.responder(200, {"ok": True})


# — Fase 30: mensajitos entre los dos (texto, GIFs, stickers pegados encima y reacciones) —
GIPHY_OK = re.compile(r"^https://(media[0-9]*|i)\.giphy\.com/[A-Za-z0-9_./?=&%-]{4,400}$")
CHAT_MAX_TEXTO = 2000
CHAT_MAX_STICKERS = 8


def _par_chat(s):
    """El otro de la pareja (sin pareja no hay chat)."""
    u = E.db.uno("SELECT pareja_id FROM usuarios WHERE id=?", s["usuario_id"])
    if not u or not u["pareja_id"]:
        raise Falla("Primero vincúlate con tu amorcito.", 409)
    return u["pareja_id"]


def _gif_ok(g):
    if not isinstance(g, dict):
        return None
    u = str(g.get("u") or "")
    if not GIPHY_OK.match(u):
        raise Falla("Ese GIF no es de GIPHY.", 400)
    try:
        w, hh = int(g.get("w") or 200), int(g.get("h") or 200)
    except (TypeError, ValueError):
        raise Falla("Medidas de GIF no válidas.", 400)
    return {"u": u, "w": max(1, min(2000, w)), "h": max(1, min(2000, hh))}


def fila_mensaje(m, uid):
    if m["borrado"]:
        return {"id": m["id"], "borrado": True}
    return {"id": m["id"], "mio": m["de"] == uid, "texto": m["texto"] or "", "gif": json.loads(m["gif"]) if m["gif"] else None,
            "creado": iso(m["creado"]), "visto": iso(m["visto"]) if m["visto"] else "", "reaccion": m["reaccion"] or "",
            "stickers": [{k: v for k, v in st.items() if k != "de"} | {"mio": st.get("de") == uid} for st in (json.loads(m["stickers"]) if m["stickers"] else [])]}


def _mensaje_de(s, mid):
    p = _par_chat(s)
    m = E.db.uno("SELECT * FROM mensajes WHERE id=? AND borrado=0 AND ((de=? AND para=?) OR (de=? AND para=?))", mid, s["usuario_id"], p, p, s["usuario_id"])
    if not m:
        raise Falla("Ese mensaje ya no está.", 404)
    return m


@ruta("GET", "/api/chat", "sesion")
def api_chat(h, s):
    """Los mensajitos de los dos: los últimos (n), los de antes de `antes`, o los nuevos después de `despues`
    más los que cambiaron (reacción, sticker, borrado) desde `desde`."""
    uid, p = s["usuario_id"], _par_chat(s)
    q = h.parametros()
    par = "((de=? AND para=?) OR (de=? AND para=?))"
    a = (uid, p, p, uid)
    try:
        n = max(1, min(100, int(q.get("n") or 40)))
        antes, despues, desde = int(q.get("antes") or 0), int(q.get("despues") or 0), float(q.get("desde") or 0)
    except ValueError:
        raise Falla("Parámetros no válidos.", 400)
    if despues:
        filas = E.db.q(f"SELECT * FROM mensajes WHERE {par} AND id>? ORDER BY id LIMIT 300", *a, despues)
        cambios = E.db.q(f"SELECT * FROM mensajes WHERE {par} AND id<=? AND actualizado>? ORDER BY id", *a, despues, desde) if desde else []
        h.responder(200, {"mensajes": [fila_mensaje(m, uid) for m in filas], "cambios": [fila_mensaje(m, uid) for m in cambios], "ahora": ahora()})
        return
    if antes:
        filas = E.db.q(f"SELECT * FROM mensajes WHERE {par} AND borrado=0 AND id<? ORDER BY id DESC LIMIT ?", *a, antes, n + 1)
    else:
        filas = E.db.q(f"SELECT * FROM mensajes WHERE {par} AND borrado=0 ORDER BY id DESC LIMIT ?", *a, n + 1)
    hay_mas = len(filas) > n
    filas = list(reversed(filas[:n]))
    h.responder(200, {"mensajes": [fila_mensaje(m, uid) for m in filas], "hay_mas": hay_mas, "ahora": ahora()})


@ruta("POST", "/api/chat", "sesion")
def api_chat_mandar(h, s):
    """Mandar un mensajito: texto, un GIF de GIPHY, o los dos."""
    uid, p = s["usuario_id"], _par_chat(s)
    d = h.cuerpo_json()
    texto = str(d.get("texto") or "").strip()[:CHAT_MAX_TEXTO]
    gif = _gif_ok(d.get("gif")) if d.get("gif") else None
    if not texto and not gif:
        raise Falla("El mensaje está vacío.", 400)
    if E.db.uno("SELECT COUNT(*) n FROM mensajes WHERE de=? AND creado>?", uid, ahora() - 10)["n"] >= 25:
        raise Falla("Más despacito: muchos mensajes seguidos.", 429)
    t = ahora()
    mid = E.db.x("INSERT INTO mensajes(de, para, texto, gif, creado, actualizado) VALUES(?,?,?,?,?,?)", uid, p, texto, json.dumps(gif) if gif else None, t, t)
    h.responder(200, {"mensaje": fila_mensaje(E.db.uno("SELECT * FROM mensajes WHERE id=?", mid), uid)})


@ruta("PUT", r"/api/chat/([0-9]{1,12})/reaccion", "sesion")
def api_chat_reaccion(h, s, mid):
    """Reaccionar a un mensaje de tu amorcito (vacío = quitarla)."""
    m = _mensaje_de(s, int(mid))
    if m["para"] != s["usuario_id"]:
        raise Falla("Sólo puedes reaccionar a los mensajes que te mandaron.", 403)
    r = str(h.cuerpo_json().get("reaccion") or "").strip()
    if r and r not in REACCIONES:
        raise Falla("Esa reacción no existe.", 400)
    E.db.x("UPDATE mensajes SET reaccion=?, reaccion_t=?, actualizado=? WHERE id=?", r or None, ahora() if r else None, ahora(), m["id"])
    h.responder(200, {"mensaje": fila_mensaje(E.db.uno("SELECT * FROM mensajes WHERE id=?", m["id"]), s["usuario_id"])})


@ruta("POST", r"/api/chat/([0-9]{1,12})/sticker", "sesion")
def api_chat_sticker(h, s, mid):
    """Pegar un sticker de GIPHY encima de un mensaje (cualquiera de los dos), en (x, y) del 0 al 1."""
    m = _mensaje_de(s, int(mid))
    d = h.cuerpo_json()
    g = _gif_ok({"u": d.get("u"), "w": 1, "h": 1})
    try:
        x, y = max(0.0, min(1.0, float(d.get("x", 0.8)))), max(0.0, min(1.0, float(d.get("y", 0.2))))
        r, k = max(-40.0, min(40.0, float(d.get("r", 0)))), max(0.5, min(2.0, float(d.get("s", 1))))
    except (TypeError, ValueError):
        raise Falla("Posición no válida.", 400)
    l = json.loads(m["stickers"]) if m["stickers"] else []
    if len(l) >= CHAT_MAX_STICKERS:
        raise Falla("Ese mensaje ya tiene muchos stickers.", 409)
    l.append({"u": g["u"], "x": round(x, 3), "y": round(y, 3), "r": round(r, 1), "s": round(k, 2), "de": s["usuario_id"]})
    E.db.x("UPDATE mensajes SET stickers=?, actualizado=? WHERE id=?", json.dumps(l), ahora(), m["id"])
    h.responder(200, {"mensaje": fila_mensaje(E.db.uno("SELECT * FROM mensajes WHERE id=?", m["id"]), s["usuario_id"])})


@ruta("DELETE", r"/api/chat/([0-9]{1,12})", "sesion")
def api_chat_borrar(h, s, mid):
    """Borrar un mensaje tuyo (para los dos)."""
    m = _mensaje_de(s, int(mid))
    if m["de"] != s["usuario_id"]:
        raise Falla("Sólo puedes borrar tus mensajes.", 403)
    E.db.x("UPDATE mensajes SET borrado=1, texto='', gif=NULL, stickers=NULL, actualizado=? WHERE id=?", ahora(), m["id"])
    h.responder(200, {"ok": True})


@ruta("POST", "/api/chat/vistos", "sesion")
def api_chat_vistos(h, s):
    """Ya leíste lo que te mandó."""
    n = E.db.x("UPDATE mensajes SET visto=?, actualizado=? WHERE para=? AND visto IS NULL", ahora(), ahora(), s["usuario_id"])
    h.responder(200, {"vistos": n})


@ruta("PUT", f"/api/detallitos/{DETALLITO_RE}/portadita", "sesion")
def api_portadita(h, s, did):
    """La miniatura de la portada (la dibuja el editor al mandarla): jpg, png o webp, chiquita."""
    d = detallito_de(s, did)
    # Quien la mandó, siempre; quien la recibió, sólo si todavía no tiene (las de antes: la dibuja su editor).
    if d["de"] != s["usuario_id"] and d["portadita"]:
        raise Falla("Sólo quien mandó la página le cambia su portadita.", 403)
    try:
        n = int(h.headers.get("Content-Length") or -1)
    except ValueError:
        n = -1
    if n <= 0 or n > PORTADITA_MAX:
        h._leido = False
        raise Falla("La portadita tiene que pesar menos de 600 KB.", 413)
    datos = h.rfile.read(n)
    h._leido = True
    ext = next((e for m, e in FOTO_TIPOS if datos.startswith(m) and (e != ".webp" or datos[8:12] == b"WEBP")), None)
    if not ext:
        raise Falla("Eso no es una imagen (jpg, png o webp).", 415)
    ver = os.path.join(DATOS, "detallitos", did, "ver")
    os.makedirs(ver, exist_ok=True)
    for _, e in FOTO_TIPOS:
        try:
            os.unlink(os.path.join(ver, "portadita" + e))
        except FileNotFoundError:
            pass
    final = os.path.join(ver, "portadita" + ext)
    with open(final + ".tmp", "wb") as f:
        f.write(datos)
    os.replace(final + ".tmp", final)
    E.db.x("UPDATE detallitos SET portadita=?, bytes=? WHERE id=?", ext[1:], tamano_carpeta(os.path.join(DATOS, "detallitos", did)), did)
    h.responder(200, {"portadita": f"/d/{did}/portadita{ext}"})


@ruta("GET", f"/api/detallitos/{DETALLITO_RE}/paquete", "sesion")
def api_detallito_paquete(h, s, did):
    d = detallito_de(s, did)
    h.archivo(os.path.join(DATOS, "detallitos", did, "paquete.zip"), {"Content-Disposition": f'attachment; filename="{nombre_limpio(d["titulo"], "detallito")}.zip"'}, cache="no-store")


@ruta("DELETE", f"/api/detallitos/{DETALLITO_RE}", "sesion")
def api_borrar_detallito(h, s, did):
    d = detallito_de(s, did)
    if d["de"] == s["usuario_id"]:
        E.db.x("UPDATE detallitos SET borrado_de=1 WHERE id=?", did)
    if d["para"] == s["usuario_id"]:
        E.db.x("UPDATE detallitos SET borrado_para=1 WHERE id=?", did)
    d = E.db.uno("SELECT * FROM detallitos WHERE id=?", did)
    if d["borrado_de"] and d["borrado_para"]:
        shutil.rmtree(os.path.join(DATOS, "detallitos", did), ignore_errors=True)
        E.db.x("DELETE FROM detallitos WHERE id=?", did)
    h.responder(200, {"ok": True})


# — Administración —
def uso_disco():
    total, usado, libre = shutil.disk_usage(DATOS)
    return {"total": total, "libre": libre, "telefono_usado": usado,
            "publicaciones": tamano_carpeta(os.path.join(DATOS, "publicaciones")),
            "proyectos": tamano_carpeta(os.path.join(DATOS, "proyectos")),
            "detallitos": tamano_carpeta(os.path.join(DATOS, "detallitos")),
            "nube": tamano_carpeta(os.path.join(DATOS, "nube")),
            "base": sum(os.path.getsize(os.path.join(DATOS, f)) for f in os.listdir(DATOS) if f.startswith("librito.db"))}


@ruta("GET", "/api/admin/resumen", "admin")
def api_resumen(h, s):
    g = E.aj["github"]
    caja = E.caja.leer()
    h.responder(200, {
        "disco": uso_disco(),
        "cuentas": {"usuarios": E.db.uno("SELECT COUNT(*) n FROM usuarios")["n"], "pendientes": E.db.uno("SELECT COUNT(*) n FROM usuarios WHERE estado='pendiente'")["n"]},
        "publicaciones": E.db.uno("SELECT COUNT(*) n FROM publicaciones")["n"], "proyectos": E.db.uno("SELECT COUNT(*) n FROM proyectos")["n"],
        "nube": {"libritos": E.db.uno("SELECT COUNT(*) n FROM libritos")["n"], "archivos": E.db.uno("SELECT COUNT(*) n FROM archivos")["n"], "copias": E.db.uno("SELECT COUNT(*) n FROM copias")["n"]},
        "detallitos": E.db.uno("SELECT COUNT(*) n FROM detallitos")["n"], "parejas": E.db.uno("SELECT COUNT(*) n FROM usuarios WHERE pareja_id IS NOT NULL")["n"] // 2,
        "github": {"repo": g.get("repo", ""), "rama": g.get("rama", ""), "token": bool(caja.get("github_token")), "listo": bool(E.github())},
        "url_publica": E.url_publica(), "tunel": E.aj["tunel"], "cloudflared": bool(shutil.which("cloudflared")),
        "tunel_probado": iso(E.tunel_ok) if E.tunel_ok else "", "anunciada": E.anunciada == E.url_publica() and bool(E.anunciada),
        "red_local": ip_local(), "puerto": E.aj["puerto"], "version": VERSION, "datos": DATOS,
        "trabajando": [{"tipo": t["tipo"], "paso": t["paso"]} for t in E.trabajos.values() if t["estado"] in ("esperando", "trabajando")]})


CAMPOS_AJUSTES = {"nombre": str, "registro": str, "origenes": list, "permitir_local": bool, "tunel": str, "url_publica": str, "anunciar": bool, "max_subida_mb": int,
                  "max_usuarios": int, "cuota_mb": int, "max_publicaciones": int, "copias_por_proyecto": int}
TOPES = {"max_subida_mb": (10, 2000), "max_usuarios": (1, 100000), "cuota_mb": (10, 100000), "max_publicaciones": (1, 1000), "copias_por_proyecto": (1, 100)}


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
                lo, hi = TOPES[k]
                try:
                    v = max(lo, min(hi, int(v)))
                except (TypeError, ValueError):
                    raise Falla(f"«{k}» tiene que ser un número.")
            elif tipo is list:
                v = [str(x).strip().rstrip("/") for x in v if re.match(r"^https?://[A-Za-z0-9.-]+(:\d+)?/?$", str(x).strip())][:20]
            elif tipo is bool:
                v = bool(v)
            else:
                v = str(v).strip()[:120]
            cambios[k] = v
    if cambios.get("registro", "abierto") not in ("abierto", "codigo", "cerrado"):
        raise Falla("Registro: abierto, codigo o cerrado.")
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
    nombres = {u["id"]: u["usuario"] for u in E.db.q("SELECT id, usuario FROM usuarios")}
    h.responder(200, {"usuarios": [publico_usuario(u) | {"publicaciones": E.db.uno("SELECT COUNT(*) n FROM publicaciones WHERE usuario_id=?", u["id"])["n"],
                                                         "pareja": nombres.get(u["pareja_id"], ""), "uso": uso_de(u["id"])}
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


def borrar_cuenta(u, heredero):
    """Borra una cuenta con todo lo suyo (nube, copias, detallitos, foto). Sus publicaciones pasan a `heredero`."""
    for p in E.db.q("SELECT id FROM proyectos WHERE usuario_id=?", u["id"]):
        borrar_proyecto(p["id"])
    E.db.x("UPDATE publicaciones SET usuario_id=? WHERE usuario_id=?", heredero, u["id"])
    E.db.x("UPDATE usuarios SET pareja_id=NULL, pareja_desde=NULL WHERE pareja_id=?", u["id"])
    for d in E.db.q("SELECT id FROM detallitos WHERE de=? OR para=?", u["id"], u["id"]):
        shutil.rmtree(os.path.join(DATOS, "detallitos", d["id"]), ignore_errors=True)
    E.db.x("DELETE FROM detallitos WHERE de=? OR para=?", u["id"], u["id"])
    for t in ("libritos", "copias", "archivos_de", "ajustes_de"):
        E.db.x(f"DELETE FROM {t} WHERE usuario_id=?", u["id"])
    for carpeta in (nube("libritos", str(u["id"])), nube("copias", str(u["id"]))):
        shutil.rmtree(carpeta, ignore_errors=True)
    borrar_foto(u["id"])
    E.db.x("DELETE FROM usuarios WHERE id=?", u["id"])


@ruta("DELETE", "/api/admin/usuarios/(\\d+)", "admin")
def api_borrar_usuario(h, s, uid):
    u = E.db.uno("SELECT * FROM usuarios WHERE id=?", int(uid))
    if not u:
        raise Falla("No existe.", 404)
    if u["id"] == s["usuario_id"]:
        raise Falla("No puedes borrar tu propia cuenta desde aquí.")
    borrar_cuenta(u, s["usuario_id"])   # sus publicaciones pasan a ti
    limpiar_nube()
    E.actividad(s["usuario"], "usuario", f"{u['usuario']}: borrado", h.ip())
    h.responder(200, {"ok": True})


@ruta("POST", "/api/admin/usuarios/borrar-todas", "admin")
def api_borrar_todas(h, s):
    """Las cuentas de prueba: todas menos las de administrador (con «BORRAR» escrito, para no hacerlo por error)."""
    if str(h.cuerpo_json().get("confirmar", "")).strip().upper() != "BORRAR":
        raise Falla("Escribe BORRAR para confirmarlo.")
    n = 0
    for u in E.db.q("SELECT * FROM usuarios WHERE rol<>'admin'"):
        borrar_cuenta(u, s["usuario_id"])
        n += 1
    limpiar_nube()
    E.actividad(s["usuario"], "usuario", f"{n} cuentas borradas (todas menos administradores)", h.ip())
    h.responder(200, {"borradas": n})


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
        threading.Thread(target=TUNEL.cerrar, daemon=True).start()
    TUNEL = None
    E.url_tunel = ""
    if E.aj["tunel"] == "cloudflare":
        TUNEL = Tunel(E.aj["puerto"])
        TUNEL.start()
    escribir_estado()
    h.responder(200, {"ok": True, "cloudflared": bool(shutil.which("cloudflared"))})


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


def mantenimiento():
    """Cada minuto: anunciar la dirección si quedó pendiente; cada hora: sesiones vencidas y restos."""
    vuelta = 0
    while True:
        time.sleep(60)
        vuelta += 1
        try:
            if vuelta % 5 == 0:
                anunciar_direccion()        # si falló antes (sin internet), aquí se reintenta
            if vuelta % 360 == 0:
                limpiar_nube()
                sub = os.path.join(DATOS, "tmp", "subidas")
                for f in os.listdir(sub):
                    if ahora() - os.path.getmtime(os.path.join(sub, f)) > 2 * 86400:
                        os.unlink(os.path.join(sub, f))
            if vuelta % 60 == 0:
                E.db.x("DELETE FROM sesiones WHERE expira < ?", ahora())
                tmp = os.path.join(DATOS, "tmp")
                for f in os.listdir(tmp):
                    if f == "subidas":
                        continue
                    p = os.path.join(tmp, f)
                    if ahora() - os.path.getmtime(p) > 86400:
                        shutil.rmtree(p, ignore_errors=True) if os.path.isdir(p) else os.unlink(p)
        except Exception as e:   # noqa: BLE001 — el mantenimiento nunca tumba el servidor
            log("Mantenimiento:", repr(e))


def iniciar(args):
    global E, TUNEL
    E = Estado(arranque=True)
    puerto = args.puerto or E.aj["puerto"]
    if args.puerto:
        E.aj.poner(puerto=puerto)
    try:
        srv = ThreadingHTTPServer((E.aj["escuchar"], puerto), Manejador)
    except OSError as e:
        if e.errno in (48, 98, 10048):
            raise SystemExit(f"El puerto {puerto} ya está ocupado: el servidor ya está prendido (mira «librito estado») u otra app lo usa.")
        raise
    srv.daemon_threads = True
    log(f"{E.aj['nombre']} {VERSION} escuchando en el puerto {puerto}")
    log(f"  En este teléfono:  http://127.0.0.1:{puerto}/")
    log(f"  En tu wifi:        http://{ip_local()}:{puerto}/")
    log(f"  Datos en:          {DATOS}")
    codigo = E.codigo_instalacion()
    if codigo:
        log("")
        log("  ★ Todavía no hay administrador. Créalo así (lo más fácil):")
        log("      · en Termux: librito admin")
        log(f"      · o en el navegador de ESTE teléfono: http://127.0.0.1:{puerto}/ (no pide código)")
        log(f"      · o desde otro aparato, con el código de instalación: {codigo}")
        log("")
    if not E.github():
        log("  GitHub todavía no está conectado: «librito github» (o en el panel → GitHub).")
    escribir_estado()
    if E.aj["tunel"] == "cloudflare" and not args.sin_tunel:
        TUNEL = Tunel(puerto)
        TUNEL.start()
    elif E.url_publica():
        threading.Timer(3, anunciar_direccion).start()
    threading.Thread(target=mantenimiento, daemon=True).start()
    # «librito detener» manda SIGTERM: se cierra igual que con Ctrl+C (y se lleva el túnel).
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        log("Hasta luego.")
    finally:
        if TUNEL:
            TUNEL.cerrar()
        escribir_estado(borrar=True)


def orden_admin(args):
    global E
    E = Estado()
    usuario = (args.usuario or input("Usuario del administrador (ej. yonathan): ")).strip().lower()
    if not USUARIO_RE.match(usuario):
        raise SystemExit("Usuario no válido: de 3 a 32 letras minúsculas, números, punto, guion o guion bajo (sin espacios).")
    for _ in range(3):
        c1 = getpass.getpass("Contraseña (mínimo 8; no se ve al escribir): ")
        c2 = getpass.getpass("Repítela: ")
        try:
            if c1 != c2:
                raise Falla("No coinciden.")
            validar_contrasena(c1)
            break
        except Falla as e:
            print(f"  {e} Otra vez.")
    else:
        raise SystemExit("No se creó el administrador. Vuelve a intentarlo con «librito admin».")
    if E.db.uno("SELECT id FROM usuarios WHERE usuario=?", usuario):
        E.db.x("UPDATE usuarios SET hash=?, rol='admin', estado='activo' WHERE usuario=?", hashear(c1), usuario)
        print(f"✓ Listo: «{usuario}» ahora es administrador con contraseña nueva.")
    else:
        E.db.crear_usuario(usuario, c1, "admin", "activo")
        print(f"✓ Listo: administrador «{usuario}» creado. Con él entras al panel.")
    E.codigo_instalacion()   # ya hay administrador: el código de instalación se borra
    E.actividad(usuario, "instalar", "administrador desde la terminal")


def orden_borrar_cuentas(args):
    """librito borrar-cuentas: borra TODAS las cuentas que no son de administrador (las de prueba)."""
    global E
    E = Estado()
    cuentas = E.db.q("SELECT * FROM usuarios WHERE rol<>'admin' ORDER BY creado")
    admins = [u["usuario"] for u in E.db.q("SELECT usuario FROM usuarios WHERE rol='admin'")]
    if not cuentas:
        print("No hay cuentas que borrar (sólo administradores: " + ", ".join(admins) + ").")
        return
    print(f"Se van a borrar {len(cuentas)} cuentas, con su nube, sus copias, sus detallitos y su foto:")
    for u in cuentas:
        print("  ·", u["usuario"])
    print("Se quedan los administradores:", ", ".join(admins) or "(ninguno)")
    if not args.si:
        if input("Para confirmar escribe BORRAR: ").strip().upper() != "BORRAR":
            raise SystemExit("No se borró nada.")
    heredero = E.db.uno("SELECT id FROM usuarios WHERE rol='admin' ORDER BY creado")
    for u in cuentas:
        borrar_cuenta(u, heredero["id"] if heredero else None)
    limpiar_nube()
    E.actividad("terminal", "usuario", f"{len(cuentas)} cuentas borradas (todas menos administradores)")
    print(f"✓ Listo: {len(cuentas)} cuentas borradas. Si el servidor está prendido, no hace falta reiniciarlo.")


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


def leer_estado():
    """Lo que dejó escrito el servidor prendido (si de verdad sigue vivo)."""
    try:
        with open(RUTA_ESTADO, encoding="utf-8") as f:
            d = json.load(f)
        os.kill(int(d.get("pid") or 0), 0)
        return d
    except (OSError, ValueError, TypeError):
        return None


def orden_estado(args):
    global E
    E = Estado()
    gh = E.github()
    vivo = leer_estado()
    admins = [u["usuario"] for u in E.db.q("SELECT usuario FROM usuarios WHERE rol='admin' AND estado='activo'")]
    if getattr(args, "json", False):
        print(json.dumps({"prendido": bool(vivo), "url": (vivo or {}).get("url", ""), "admins": admins, "github": bool(gh),
                          "codigo": E.codigo_instalacion() or "", "puerto": E.aj["puerto"]}, ensure_ascii=False))
        return
    print(f"{E.aj['nombre']} {VERSION}")
    print("  Datos:", DATOS)
    print("  Puerto:", E.aj["puerto"], "· Red local:", ip_local())
    print("  Registro:", E.aj["registro"], "· Túnel:", E.aj["tunel"], "· cloudflared:", "sí" if shutil.which("cloudflared") else "no (pkg install cloudflared)")
    print("  GitHub:", f"{gh.repo} · rama {gh.rama}" if gh else "sin conectar (librito github)")
    print("  Administrador:", ", ".join(admins) if admins else "todavía ninguno (librito admin)")
    print("  Usuarios:", E.db.uno("SELECT COUNT(*) n FROM usuarios")["n"], "· Publicaciones:", E.db.uno("SELECT COUNT(*) n FROM publicaciones")["n"], "· Proyectos:", E.db.uno("SELECT COUNT(*) n FROM proyectos")["n"], "· Detallitos:", E.db.uno("SELECT COUNT(*) n FROM detallitos")["n"])
    if vivo and vivo.get("tunel_probado"):
        print("  Túnel probado desde internet:", vivo["tunel_probado"].replace("T", " ").replace("Z", " UTC"))
    codigo = E.codigo_instalacion()
    if codigo:
        print("  Código de instalación:", codigo, "(sólo para crear el administrador desde otro aparato)")


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
    e = sub.add_parser("estado", help="cómo está todo")
    e.add_argument("--json", action="store_true")
    sub.add_parser("llave-nueva", help="cambia la llave que cifra los secretos")
    b = sub.add_parser("borrar-cuentas", help="borra todas las cuentas que no son de administrador (las de prueba)")
    b.add_argument("--si", action="store_true", help="sin preguntar")
    args = p.parse_args()
    os.umask(0o077)   # todo lo que se cree aquí, sólo para tu usuario
    os.makedirs(DATOS, exist_ok=True)
    {"iniciar": iniciar, "admin": orden_admin, "github": orden_github, "estado": orden_estado, "llave-nueva": orden_llave,
     "borrar-cuentas": orden_borrar_cuentas}.get(args.orden or "iniciar", iniciar)(args if args.orden else p.parse_args(["iniciar"]))


if __name__ == "__main__":
    principal()
