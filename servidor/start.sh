#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  start my — My Love Pages en Termux, bonito y con menú (Fase 40).
#
#    start my              el menú (prender, apagar, la nube, el dueño, traer…)
#    start my <orden>      directo: start my encender · apagar · estado · traer · panel…
#
#  Por dentro usa «librito» (librito.sh) y el servidor (servidor.py): nada
#  cambia de lugar, tus datos siguen en ~/librito-datos.
# ─────────────────────────────────────────────────────────────────────────
set -uo pipefail

APP="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
LIBRITO="$APP/librito.sh"
PY="$(command -v python3 || command -v python || true)"
export LIBRITO_DATOS="${LIBRITO_DATOS:-$HOME/librito-datos}"

e=$'\e'; fin="$e[0m"; neg="$e[1m"; tenue="$e[2m"; gris="$e[38;5;245m"
rosa="$e[38;5;205m"; rosa2="$e[38;5;211m"; lila="$e[38;5;141m"; menta="$e[38;5;121m"; ama="$e[38;5;221m"; rojo="$e[38;5;203m"
fondo="$e[48;5;53m"

if [ "${1:-}" != "my" ]; then
  printf '\n  %s♥%s Para abrir %sMy Love Pages%s escribe: %sstart my%s\n\n' "$rosa" "$fin" "$neg" "$fin" "$neg$rosa" "$fin"
  exit 0
fi
shift

# «start my encender», «start my traer»…: directo a librito, con nombres amigables.
if [ $# -gt 0 ]; then
  orden="$1"; shift
  case "$orden" in
    encender|prender|on) orden=iniciar ;;
    apagar|off) orden=detener ;;
    nube) orden=panel ;;
  esac
  exec bash "$LIBRITO" "$orden" "$@"
fi

[ -n "$PY" ] || { echo "Falta Python: pkg install python"; exit 1; }
[ -t 0 ] || { echo "start my necesita una terminal (ábrelo en Termux)."; exit 1; }

ancho() { local c; c="$(tput cols 2>/dev/null || echo 44)"; [ "$c" -gt 60 ] && c=60; [ "$c" -lt 34 ] && c=34; echo "$c"; }
linea() { local n; n="$(ancho)"; printf '%s' "$1"; printf '%*s' "$((n - 4))" '' | sed "s/ /${2:-─}/g"; printf '%s\n' "$fin"; }
pausa() { printf '\n  %sToca una tecla para volver…%s' "$gris" "$fin"; read -rsn1 _ || true; }

latido() {
  # Un corazoncito que late al abrir (corto: no estorba).
  local f
  for f in "♡" "♥" "❤" "♥"; do printf '\r  %s%s%s  %sMy Love Pages%s' "$rosa" "$f" "$fin" "$neg" "$fin"; sleep 0.09; done
  printf '\r%*s\r' "$(ancho)" ''
}

encabezado() {
  clear 2>/dev/null || printf '\e[2J\e[H'
  local n; n="$(ancho)"
  printf '\n'
  printf '  %s%s%*s%s\n' "$fondo" "$rosa" "$((n - 4))" '' "$fin"
  printf '  %s  %s♥ %sMy Love Pages%s%s%s  ·  servidor %s%*s%s\n' "$fondo" "$rosa" "$neg$rosa2" "$fin" "$fondo" "$lila" "M.YNTHN" "$((n - 37 > 0 ? n - 37 : 0))" '' "$fin"
  printf '  %s%s%*s%s\n' "$fondo" "$rosa" "$((n - 4))" '' "$fin"
}

# La tarjeta de estado (la arma Python con lo que dice el servidor).
tarjeta() {
  local j
  j="$("$PY" "$APP/servidor.py" estado --json --aparato 2>/dev/null || echo '{}')"
  ESTADO_JSON="$j" "$PY" - "$rosa" "$menta" "$ama" "$rojo" "$gris" "$fin" "$neg" "$lila" <<'PY'
import json, os, sys
rosa, menta, ama, rojo, gris, fin, neg, lila = sys.argv[1:9]
try:
    d = json.loads(os.environ.get("ESTADO_JSON") or "{}")
except ValueError:
    d = {}
a = d.get("aparato") or {}
def gb(b): return f"{b / 1073741824:.1f} GB" if b >= 1073741824 else f"{b / 1048576:.0f} MB"
p = []
if d.get("relevado"):
    p.append(f"  {ama}●{fin} {neg}Este teléfono ya no es el servidor{fin} {gris}(se pasó a otro){fin}")
elif d.get("prendido"):
    p.append(f"  {menta}●{fin} {neg}Prendido{fin}  " + (f"{lila}{d['url']}{fin}" if d.get("url") else f"{gris}abriendo el túnel…{fin}"))
else:
    p.append(f"  {rojo}●{fin} {neg}Apagado{fin}  {gris}(1 para encender){fin}")
if d.get("otro"):
    p.append(f"  {ama}!{fin} Hay otro teléfono siendo el servidor: {d['otro']}")
fila = []
if a.get("bateria") is not None:
    color = menta if a.get("cargando") or a["bateria"] >= 40 else ama if a["bateria"] >= 20 else rojo
    fila.append(f"{color}▮{fin} pila {a['bateria']} %" + (" ⚡" if a.get("cargando") else ""))
if a.get("temp") is not None:
    color = menta if a["temp"] < 40 else ama if a["temp"] < 44 else rojo
    fila.append(f"{color}≋{fin} {a['temp']:.0f} °C")
if a.get("ritmo"):
    fila.append({"normal": f"{menta}ritmo normal{fin}", "ahorro": f"{ama}modo ahorro{fin}", "fresco": f"{ama}enfriándose{fin}"}[a["ritmo"]])
if fila: p.append("  " + "  ·  ".join(fila))
fila = []
if a.get("disco_libre"): fila.append(f"{gb(a['disco_libre'])} libres")
if a.get("ram_total"): fila.append(f"RAM {gb(a['ram_total'] - a.get('ram_libre', 0))} / {gb(a['ram_total'])}")
if a.get("nucleos"): fila.append(f"{a['nucleos']} núcleos")
if fila: p.append(f"  {gris}" + "  ·  ".join(fila) + fin)
dueno = f"{menta}YonathanPG ✓{fin}" if d.get("dueno") else f"{ama}YonathanPG (falta: 6){fin}"
p.append(f"  {gris}Dueño{fin} {dueno}  {gris}·{fin} {d.get('usuarios', 0)} cuentas  {gris}·{fin} GitHub " + (f"{menta}✓{fin}" if d.get("github") else f"{ama}falta (8){fin}")
         + ("" if d.get("cloudflared", True) else f"  {gris}·{fin} {ama}sin cloudflared{fin}"))
print("\n".join(p))
PY
}

opcion() { printf '   %s%s%s  %s%s\n' "$neg$rosa" "$1" "$fin" "$2" "${3:+  $gris$3$fin}"; }

menu() {
  encabezado
  printf '\n'
  tarjeta
  printf '\n'
  linea "  $tenue$rosa" "┄"
  local prendido=0 relevado=0 j
  j="$("$PY" "$APP/servidor.py" estado --json 2>/dev/null || echo '{}')"
  case "$j" in *'"prendido": true'*) prendido=1 ;; esac
  case "$j" in *'"relevado": {}'*|*'"relevado": null'*) ;; *'"relevado": {'*) relevado=1 ;; esac
  if [ "$prendido" = 1 ]; then opcion 1 "Apagar"; else opcion 1 "Encender"; fi
  opcion 2 "Reiniciar"
  opcion 3 "La dirección y cómo va todo"
  opcion 4 "Abrir la nube" "(el panel)"
  opcion 5 "Ver lo que pasa" "(registro en vivo)"
  opcion 6 "Cuenta del dueño" "(YonathanPG)"
  opcion 7 "Traer el servidor a este teléfono"
  opcion 8 "Conectar GitHub"
  opcion 9 "Prenderse solo al encender el teléfono"
  [ "$relevado" = 1 ] && opcion v "Volver a ser el servidor aquí"
  opcion r "Respaldar" "(copia de tus datos)"
  opcion a "Actualizar" "(versión nueva; tus datos no se tocan)"
  opcion s "Si se apaga solo…"
  opcion 0 "Salir"
  linea "  $tenue$rosa" "┄"
  printf '   %s›%s ' "$rosa" "$fin"
}

ayuda_apaga() {
  encabezado
  cat <<EOF

  ${neg}Si el servidor se apaga solo${fin}

  ${rosa}1.${fin} Ajustes de Android → Apps → Termux → Batería → ${neg}Sin restricciones${fin}.
  ${rosa}2.${fin} Al encender, start my toma el ${neg}wake lock${fin} (la notificación de Termux
     «wake lock held»): así Android no lo duerme. No la quites.
  ${rosa}3.${fin} Android 12 o más nuevo cierra los procesos «de fondo» de Termux
     (aparece «Process completed (signal 9)»). Para que no:
       · Android 14+: Opciones de desarrollador → ${neg}Desactivar restricciones
         de procesos secundarios${fin}.
       · Android 12 y 13 (desde una compu con adb):
         ${gris}adb shell "settings put global settings_enable_monitor_phantom_procs false"${fin}
  ${rosa}4.${fin} Déjalo con cargador y en wifi. Con poca pila o caliente, el servidor
     baja el ritmo solo (lo ves en la tarjeta).
  ${rosa}5.${fin} Abrir otra terminal NO lo apaga: corre aparte. Para verlo, start my.
EOF
  local v; v="$(getprop ro.build.version.release 2>/dev/null || true)"
  [ -n "$v" ] && printf '\n  %sEste teléfono: Android %s%s\n' "$gris" "$v" "$fin"
  pausa
}

dueno() {
  encabezado
  printf '\n  %sCuenta del dueño: YonathanPG%s\n' "$neg" "$fin"
  printf '  %sCon ella entras al editor y a la nube como administrador, y puedes traer\n  el servidor a otro teléfono. La contraseña se escribe aquí (no se ve) y\n  queda cifrada en este teléfono: nunca va en el código.%s\n\n' "$gris" "$fin"
  "$PY" "$APP/servidor.py" admin yonathanpg
  pausa
}

# Fase 46: un teléfono recién instalado no se prende sin la cuenta del dueño (si no, YonathanPG no
# entra a ningún lado). Si este teléfono no tiene NADA, primero se ofrece traer el servidor de siempre.
encender() {
  local j; j="$("$PY" "$APP/servidor.py" estado --json 2>/dev/null || echo '{}')"
  case "$j" in
    *'"dueno": true'*) ;;
    *)
      printf '\n  %sEste teléfono todavía no tiene la cuenta del dueño (YonathanPG).%s\n' "$ama" "$fin"
      case "$j" in
        *'"usuarios": 0'*)
          printf '  %s¿Es para traer el servidor de siempre (con todo)? Elige 7. Si es uno nuevo, sigue aquí.%s\n' "$gris" "$fin"
          read -r -p "   ¿Crear la cuenta del dueño aquí y prenderlo nuevo? [s/N] " r || true
          case "${r:-n}" in [sS]*) ;; *) return ;; esac ;;
      esac
      "$PY" "$APP/servidor.py" admin yonathanpg || return ;;
  esac
  bash "$LIBRITO" iniciar
}

traer() {
  encabezado
  printf '\n  %sTraer el servidor a este teléfono%s\n' "$neg" "$fin"
  printf '  %sSe trae TODO del teléfono que es el servidor ahora (cuentas, nubes, chats,\n  fotos, ajustes y GitHub), con la cuenta del dueño. El otro se apaga solo\n  y este queda de servidor, con la misma dirección para el editor.\n  Lo que haya en este teléfono se guarda aparte (no se borra).%s\n\n' "$gris" "$fin"
  read -r -p "   ¿Seguimos? [S/n] " r || true
  case "${r:-s}" in [nN]*) return ;; esac
  # Sin cloudflared este teléfono no contestaría desde internet: se instala ANTES de traer nada
  # (el de antes no se apaga hasta que éste conteste, pero así no se espera de balde).
  if ! command -v cloudflared >/dev/null 2>&1; then
    printf '   %sFalta cloudflared (el túnel a internet). Lo instalo…%s\n' "$gris" "$fin"
    pkg install -y cloudflared >/dev/null 2>&1 || true
    command -v cloudflared >/dev/null 2>&1 || { printf '   %sNo se pudo instalar: «pkg install cloudflared» y vuelve a intentarlo.%s\n' "$ama" "$fin"; pausa; return; }
  fi
  # La dirección se busca sola (en tu página y en GitHub): ya no hay que escribirla.
  bash "$LIBRITO" traer
  pausa
}

[ "${START_MY_SIN_LATIDO:-}" ] || latido
while true; do
  menu
  read -rsn1 k || exit 0
  printf '%s\n' "$k"
  case "$k" in
    1) if bash "$LIBRITO" estado 2>/dev/null | grep -q "Prendido (PID"; then bash "$LIBRITO" detener; else encender; fi; pausa ;;
    2) bash "$LIBRITO" reiniciar; pausa ;;
    3) bash "$LIBRITO" estado; pausa ;;
    4) bash "$LIBRITO" panel; pausa ;;
    5) printf '  %s(Ctrl+C para volver)%s\n' "$gris" "$fin"; trap ':' INT; bash "$LIBRITO" registro; trap - INT ;;
    6) dueno ;;
    7) traer ;;
    8) bash "$LIBRITO" github; pausa ;;
    9) bash "$LIBRITO" arranque; pausa ;;
    v|V) bash "$LIBRITO" recuperar && bash "$LIBRITO" iniciar; pausa ;;
    r|R) bash "$LIBRITO" respaldar; pausa ;;
    a|A) bash "$LIBRITO" actualizar; pausa ;;
    s|S) ayuda_apaga ;;
    0|q|Q|$'\e') clear 2>/dev/null; printf '\n  %s♥%s Hasta luego. Para volver: %sstart my%s\n\n' "$rosa" "$fin" "$neg" "$fin"; exit 0 ;;
  esac
done
