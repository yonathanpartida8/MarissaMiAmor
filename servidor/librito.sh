#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  librito — maneja el servidor del librito en Termux (o cualquier Linux).
#
#    librito instalar       paquetes (python, cloudflared) y la carpeta de datos
#    librito iniciar        lo arranca en segundo plano (con el túnel)
#    librito detener        lo apaga
#    librito reiniciar      detener + iniciar
#    librito estado         ¿está prendido?, dirección, GitHub, cuentas
#    librito direccion      la dirección https del túnel (para el editor)
#    librito registro       lo que va pasando (Ctrl+C para salir)
#    librito admin [usuario]  crea o reinicia un administrador
#    librito github         guarda el token de GitHub (cifrado) desde aquí
#    librito primer-plano   lo corre aquí mismo (para ver errores)
#    librito arranque       que se prenda solo al encender el teléfono (Termux:Boot)
#    librito respaldar      copia de los datos (sin la llave ni el token)
#    librito actualizar     baja la versión nueva (tus datos no se tocan)
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
export LIBRITO_DATOS="${LIBRITO_DATOS:-$HOME/librito-datos}"
DATOS="$LIBRITO_DATOS"
PID="$DATOS/servidor.pid"
LOG="$DATOS/servidor.log"
PY="$(command -v python3 || command -v python || true)"
ES_TERMUX=0; [ -n "${PREFIX:-}" ] && [ -d "${PREFIX}/bin" ] && command -v pkg >/dev/null 2>&1 && ES_TERMUX=1

rosa=$'\e[38;5;205m'; verde=$'\e[32m'; gris=$'\e[90m'; neg=$'\e[1m'; fin=$'\e[0m'
dice() { printf '%s♥%s %s\n' "$rosa" "$fin" "$*"; }
bien() { printf '%s✓%s %s\n' "$verde" "$fin" "$*"; }
nota() { printf '%s%s%s\n' "$gris" "$*" "$fin"; }

prendido() { [ -f "$PID" ] && kill -0 "$(cat "$PID")" 2>/dev/null; }
direccion() { [ -f "$LOG" ] && grep -oE 'https://[-a-z0-9]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true; }
necesita_python() { [ -n "$PY" ] || { echo "Falta Python. En Termux: pkg install python"; exit 1; }; }

instalar() {
  if [ "$ES_TERMUX" = 1 ]; then
    dice "Instalando lo necesario (python, cloudflared)…"
    pkg update -y >/dev/null 2>&1 || true
    pkg install -y python cloudflared openssl ca-certificates >/dev/null 2>&1 || pkg install -y python cloudflared
    PY="$(command -v python3 || command -v python)"
  fi
  necesita_python
  mkdir -p "$DATOS"; chmod 700 "$DATOS"
  "$PY" "$APP/servidor.py" estado
  if [ "$ES_TERMUX" = 1 ] && [ -d "$PREFIX/bin" ]; then
    ln -sf "$APP/librito.sh" "$PREFIX/bin/librito"
    bien "Ya puedes escribir «librito» desde cualquier carpeta."
  fi
  echo
  bien "Instalado. Lo que sigue:"
  echo "   1) ${neg}librito iniciar${fin}"
  echo "   2) Abre en el navegador del teléfono: ${neg}http://127.0.0.1:8787${fin}"
  echo "      y crea tu administrador con el código de instalación de arriba."
  echo "   3) En el panel → GitHub: tu repositorio y tu token (o aquí: ${neg}librito github${fin})."
}

iniciar() {
  necesita_python
  mkdir -p "$DATOS"
  if prendido; then dice "Ya estaba prendido (PID $(cat "$PID"))."; estado; return; fi
  command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock || true
  nohup "$PY" "$APP/servidor.py" iniciar >>"$LOG" 2>&1 &
  echo $! >"$PID"
  dice "Prendiendo…"
  for _ in $(seq 1 20); do sleep 1; prendido || break; [ -n "$(direccion)" ] && break; done
  if ! prendido; then echo "No arrancó. Mira: librito registro"; tail -n 20 "$LOG"; exit 1; fi
  estado
}

detener() {
  if prendido; then
    kill "$(cat "$PID")" 2>/dev/null || true
    for _ in $(seq 1 10); do prendido || break; sleep 0.5; done
    prendido && kill -9 "$(cat "$PID")" 2>/dev/null || true
    bien "Apagado."
  else
    dice "No estaba prendido."
  fi
  rm -f "$PID"
  pkill -f "cloudflared tunnel --no-autoupdate --url http://127.0.0.1" 2>/dev/null || true
  command -v termux-wake-unlock >/dev/null 2>&1 && termux-wake-unlock || true
}

estado() {
  if prendido; then bien "Prendido (PID $(cat "$PID"))"; else dice "Apagado — librito iniciar"; fi
  [ -n "$PY" ] && "$PY" "$APP/servidor.py" estado || true
  local d; d="$(direccion)"
  if prendido && [ -n "$d" ]; then
    echo; echo "   ${neg}Dirección para el editor:${fin} $d"
  fi
  echo "   ${neg}Panel:${fin} http://127.0.0.1:8787  ${gris}(o la dirección de arriba)${fin}"
  [ -f "$DATOS/codigo-instalacion.txt" ] && echo "   ${neg}Código de instalación:${fin} $(cat "$DATOS/codigo-instalacion.txt")"
  return 0
}

arranque() {
  [ "$ES_TERMUX" = 1 ] || { echo "Esto es para Termux con la app Termux:Boot."; exit 1; }
  mkdir -p "$HOME/.termux/boot"
  cat >"$HOME/.termux/boot/librito" <<EOF
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
LIBRITO_DATOS="$DATOS" "$APP/librito.sh" iniciar
EOF
  chmod +x "$HOME/.termux/boot/librito"
  bien "Listo. Instala la app Termux:Boot (F-Droid), ábrela una vez, y el servidor se prende solo al encender el teléfono."
}

respaldar() {
  local dest="$HOME/respaldos"
  [ -d "$HOME/storage/shared" ] && dest="$HOME/storage/shared/Librito"
  mkdir -p "$dest"
  local f; f="$dest/librito-respaldo-$(date +%Y%m%d-%H%M).tar.gz"
  tar -czf "$f" -C "$(dirname "$DATOS")" --exclude="$(basename "$DATOS")/tmp" --exclude="$(basename "$DATOS")/llave.bin" --exclude="$(basename "$DATOS")/secretos.bin" "$(basename "$DATOS")"
  bien "Respaldo: $f"
  nota "No lleva la llave ni el token de GitHub: al restaurarlo, vuelve a guardar el token (librito github)."
  [ -d "$HOME/storage/shared" ] || nota "Para guardarlo en la memoria del teléfono: termux-setup-storage (una vez)."
}

actualizar() {
  dice "Bajando la versión nueva…"
  LIBRITO_APP="$APP" bash -c "$(curl -fsSL "${LIBRITO_BASE:-https://yonathanpartida8.github.io/MarissaMiAmor/servidor}/instalar.sh?v=$(date +%s)")" -- --solo-archivos
  if prendido; then detener; iniciar; fi
}

orden="${1:-ayuda}"; shift || true
case "$orden" in
  instalar) instalar ;;
  iniciar|prender) iniciar ;;
  detener|apagar) detener ;;
  reiniciar) detener; iniciar ;;
  estado) estado ;;
  direccion|dirección) d="$(direccion)"; [ -n "$d" ] && echo "$d" || echo "Todavía no hay túnel (¿está prendido? ¿instalaste cloudflared?)" ;;
  registro|log) touch "$LOG"; tail -n 60 -f "$LOG" ;;
  admin) necesita_python; "$PY" "$APP/servidor.py" admin "$@" ;;
  github) necesita_python; "$PY" "$APP/servidor.py" github ;;
  llave-nueva) necesita_python; "$PY" "$APP/servidor.py" llave-nueva ;;
  primer-plano) necesita_python; exec "$PY" "$APP/servidor.py" iniciar "$@" ;;
  arranque) arranque ;;
  respaldar) respaldar ;;
  actualizar) actualizar ;;
  *) sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
