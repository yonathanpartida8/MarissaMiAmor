#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  librito — maneja M.YNTHN, el servidor del librito, en Termux (o cualquier Linux).
#
#    librito                lo deja listo y prendido (la primera vez, te guía)
#    librito instalar       el asistente: paquetes, tu administrador, GitHub y prender
#    librito iniciar        lo prende en segundo plano (con el túnel)
#    librito detener        lo apaga
#    librito reiniciar      detener + iniciar
#    librito estado         ¿está prendido?, dirección, GitHub, cuentas
#    librito direccion      la dirección https del túnel (para el editor)
#    librito panel          abre el panel en el navegador de este teléfono
#    librito registro       lo que va pasando (Ctrl+C para salir)
#    librito admin [usuario]  crea o reinicia un administrador
#    librito borrar-cuentas   borra todas las cuentas de prueba (menos administradores)
#    librito github         guarda el token de GitHub (cifrado) desde aquí
#    librito primer-plano   lo corre aquí mismo (para ver errores)
#    librito arranque       que se prenda solo al encender el teléfono (Termux:Boot)
#    librito respaldar      copia de los datos (sin la llave ni el token)
#    librito actualizar     baja la versión nueva (tus datos no se tocan)
#    librito dueño          pone (o cambia) la contraseña de la cuenta del dueño: YnthnPG.MY
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
export LIBRITO_DATOS="${LIBRITO_DATOS:-$HOME/librito-datos}"
DATOS="$LIBRITO_DATOS"
PID="$DATOS/servidor.pid"
LOG="$DATOS/servidor.log"
ESTADO="$DATOS/estado.json"
PY="$(command -v python3 || command -v python || true)"
ES_TERMUX=0; [ -n "${PREFIX:-}" ] && [ -d "${PREFIX}/bin" ] && command -v pkg >/dev/null 2>&1 && ES_TERMUX=1

rosa=$'\e[38;5;205m'; verde=$'\e[32m'; gris=$'\e[90m'; neg=$'\e[1m'; ama=$'\e[33m'; fin=$'\e[0m'
dice() { printf '%s♥%s %s\n' "$rosa" "$fin" "$*"; }
bien() { printf '%s✓%s %s\n' "$verde" "$fin" "$*"; }
ojo()  { printf '%s!%s %s\n' "$ama" "$fin" "$*"; }
nota() { printf '%s%s%s\n' "$gris" "$*" "$fin"; }
paso() { printf '\n%s%s%s %s\n' "$neg$rosa" "$1" "$fin" "${neg}$2${fin}"; }

# ¿Hay a quién preguntarle? (con «curl … | bash» la entrada es el guion, no el teclado)
hay_teclado() {
  [ -t 0 ] && return 0
  if (: </dev/tty) 2>/dev/null; then exec </dev/tty; fi
  [ -t 0 ]
}

prendido() { [ -f "$PID" ] && kill -0 "$(cat "$PID")" 2>/dev/null; }
# La dirección la escribe el servidor prendido en estado.json (nunca una vieja del registro).
direccion() { prendido && [ -f "$ESTADO" ] && sed -n 's/^ *"url": *"\(https:[^"]*\)".*/\1/p' "$ESTADO" | head -n 1 || true; }
necesita_python() { [ -n "$PY" ] || { echo "Falta Python. En Termux: pkg install python"; exit 1; }; }
info() { "$PY" "$APP/servidor.py" estado --json 2>/dev/null || echo '{}'; }
campo() { printf '%s' "$1" | sed -n "s/.*\"$2\": *\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p"; }

paquetes() {
  if [ "$ES_TERMUX" = 1 ]; then
    local falta=""
    command -v python3 >/dev/null 2>&1 || falta="$falta python"
    command -v cloudflared >/dev/null 2>&1 || falta="$falta cloudflared"
    command -v git >/dev/null 2>&1 || falta="$falta git"   # para subir videos grandes a GitHub
    [ -f "$PREFIX/etc/resolv.conf" ] || falta="$falta resolv-conf"   # cloudflared necesita saber qué DNS usar
    if [ -n "$falta" ]; then
      dice "Instalando:$falta (la primera vez tarda unos minutos; no cierres Termux)…"
      pkg update -y >/dev/null 2>&1 || true
      # «yes» contesta solo si apt pregunta algo a medio camino.
      yes | pkg install -y $falta >/dev/null 2>&1 || true
      command -v python3 >/dev/null 2>&1 || yes | pkg install -y python || true
      command -v cloudflared >/dev/null 2>&1 || yes | pkg install -y cloudflared || true
      command -v git >/dev/null 2>&1 || yes | pkg install -y git || true
    fi
    PY="$(command -v python3 || command -v python || true)"
    command -v cloudflared >/dev/null 2>&1 && bien "python y cloudflared listos." || ojo "No se pudo instalar cloudflared: sin él el servidor sólo se ve en tu wifi (pkg install cloudflared)."
    command -v git >/dev/null 2>&1 || ojo "No se pudo instalar git: los videos grandes no podrán subirse a GitHub (pkg install git)."
  fi
  necesita_python
  mkdir -p "$DATOS"; chmod 700 "$DATOS"
  if [ "$ES_TERMUX" = 1 ] && [ -d "$PREFIX/bin" ]; then
    ln -sf "$APP/librito.sh" "$PREFIX/bin/librito"
  fi
}

asistente() {
  printf '\n%s  ♥  M.YNTHN · el servidor del librito  ♥%s\n' "$neg$rosa" "$fin"
  nota "   Lo dejamos listo en 3 pasitos. Tus datos quedan en $DATOS"

  paso "1/3" "Lo necesario"
  paquetes

  paso "2/3" "Tu administrador (con él entras al panel)"
  local i; i="$(info)"
  if printf '%s' "$i" | grep -q '"admins": \[\]'; then
    if hay_teclado; then
      "$PY" "$APP/servidor.py" admin || ojo "Sin administrador por ahora: luego escribe «librito admin»."
    else
      ojo "No hay teclado aquí: crea el administrador con «librito admin»."
    fi
  else
    bien "Ya tienes administrador: $(printf '%s' "$i" | sed -n 's/.*"admins": \[\([^]]*\)\].*/\1/p' | tr -d '"')"
  fi

  paso "3/3" "GitHub (para que lo publicado salga en tu página)"
  i="$(info)"
  if printf '%s' "$i" | grep -q '"github": true'; then
    bien "GitHub ya está conectado."
  elif hay_teclado; then
    local r=""
    read -r -p "   ¿Lo conectas ahora? Necesitas tu token (github_pat_…). [S/n] " r || true
    case "${r:-s}" in
      [nN]*) nota "   Va. Luego: «librito github» o en el panel → GitHub." ;;
      *) "$PY" "$APP/servidor.py" github || ojo "No quedó: inténtalo luego con «librito github»." ;;
    esac
  else
    nota "   Luego: «librito github» o en el panel → GitHub."
  fi

  echo
  if prendido; then reiniciar; else iniciar; fi
  if [ "$ES_TERMUX" = 1 ]; then
    bien "Ya puedes escribir «librito» desde cualquier carpeta."
    command -v termux-open-url >/dev/null 2>&1 && termux-open-url "http://127.0.0.1:$(puerto)/" >/dev/null 2>&1 || true
  fi
  nota "   Para que se prenda solo al encender el teléfono: librito arranque"
}

puerto() { local p; p="$(campo "$(info)" puerto)"; echo "${p:-8787}"; }

iniciar() {
  necesita_python
  mkdir -p "$DATOS"
  if prendido; then dice "Ya estaba prendido (PID $(cat "$PID"))."; estado; return; fi
  # Lo que quedó de una vez que Android lo cerró a la fuerza.
  rm -f "$ESTADO"
  pkill -f "cloudflared tunnel --no-autoupdate" 2>/dev/null || true
  command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock || true
  local antes=0; [ -f "$LOG" ] && antes="$(wc -l <"$LOG")"
  # El servidor ya escribe su propio registro; aquí sólo se juntan los errores graves (stderr).
  nohup "$PY" "$APP/servidor.py" iniciar >/dev/null 2>>"$LOG" &
  echo $! >"$PID"
  dice "Prendiendo…"
  local espera=8
  command -v cloudflared >/dev/null 2>&1 && espera=40
  for _ in $(seq 1 "$espera"); do
    sleep 1
    prendido || break
    [ -n "$(direccion)" ] && break
    [ "$espera" = 8 ] && [ -f "$ESTADO" ] && break
  done
  if ! prendido; then
    echo
    ojo "No arrancó. Esto dijo:"
    tail -n +"$((antes + 1))" "$LOG" | tail -n 12
    rm -f "$PID"
    exit 1
  fi
  [ -z "$(direccion)" ] && command -v cloudflared >/dev/null 2>&1 && nota "   El túnel todavía se está abriendo; «librito direccion» en un ratito."
  estado
}

detener() {
  if prendido; then
    kill "$(cat "$PID")" 2>/dev/null || true
    for _ in $(seq 1 12); do prendido || break; sleep 0.5; done
    prendido && kill -9 "$(cat "$PID")" 2>/dev/null || true
    bien "Apagado."
  else
    dice "No estaba prendido."
  fi
  rm -f "$PID" "$ESTADO"
  pkill -f "cloudflared tunnel --no-autoupdate" 2>/dev/null || true
  command -v termux-wake-unlock >/dev/null 2>&1 && termux-wake-unlock || true
}

reiniciar() { detener; iniciar; }

estado() {
  echo
  if prendido; then bien "Prendido (PID $(cat "$PID"))"; else dice "Apagado — escribe: librito iniciar"; fi
  [ -n "$PY" ] && "$PY" "$APP/servidor.py" estado || true
  local d; d="$(direccion)"
  echo
  if prendido && [ -n "$d" ]; then
    echo "   ${neg}Dirección para el editor:${fin} $d"
    nota "   (el editor la encuentra solo; no hace falta copiarla)"
  fi
  echo "   ${neg}Panel en este teléfono:${fin} http://127.0.0.1:$(puerto)  ${gris}(librito panel)${fin}"
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
  paquetes   # lo que la versión nueva necesite (git, por ejemplo) y aún no esté
  if prendido; then reiniciar; fi
}

panel() {
  local u="http://127.0.0.1:$(puerto)/"
  prendido || iniciar
  if command -v termux-open-url >/dev/null 2>&1; then termux-open-url "$u"; bien "Abriendo $u"; else echo "Abre en el navegador: $u"; fi
}

orden="${1:-}"; shift || true
case "$orden" in
  "")
    necesita_python
    if printf '%s' "$(info)" | grep -q '"admins": \[\]'; then asistente
    elif prendido; then estado
    else iniciar; fi ;;
  instalar|asistente) asistente ;;
  iniciar|prender) iniciar ;;
  detener|apagar) detener ;;
  reiniciar) reiniciar ;;
  estado) estado ;;
  direccion|dirección) d="$(direccion)"; [ -n "$d" ] && echo "$d" || echo "Todavía no hay túnel (¿está prendido? ¿instalaste cloudflared?)" ;;
  panel) panel ;;
  registro|log) touch "$LOG"; tail -n 60 -f "$LOG" ;;
  admin) necesita_python; "$PY" "$APP/servidor.py" admin "$@" ;;
  dueno|dueño) necesita_python; "$PY" "$APP/servidor.py" admin ynthnpg.my ;;
  github) necesita_python; "$PY" "$APP/servidor.py" github ;;
  llave-nueva) necesita_python; "$PY" "$APP/servidor.py" llave-nueva ;;
  borrar-cuentas) necesita_python; "$PY" "$APP/servidor.py" borrar-cuentas "$@" ;;
  primer-plano) necesita_python; exec "$PY" "$APP/servidor.py" iniciar "$@" ;;
  arranque) arranque ;;
  respaldar) respaldar ;;
  actualizar) actualizar ;;
  *) sed -n '3,21p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
