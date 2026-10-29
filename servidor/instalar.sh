#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  Instalador de M.YNTHN, el servidor del librito (una sola línea en Termux):
#
#    curl -fsSL https://raw.githubusercontent.com/yonathanpartida8/MarissaMiAmor/claude/interactive-love-book-redesign-5p93fv/servidor/instalar.sh | bash
#
#  Baja SÓLO la carpeta servidor/ (no el repositorio entero, que pesa mucho)
#  a ~/librito-servidor, instala python y cloudflared y deja listo el
#  comando «librito». Tus datos (~/librito-datos) nunca se tocan.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

DESTINO="${LIBRITO_APP:-$HOME/librito-servidor}"
ARCHIVOS="servidor.py librito.sh start.sh instalar.sh L%C3%89EME.md panel/index.html panel/panel.css panel/panel.js panel/icono.svg"

# ¿De dónde se bajan los archivos? Se prueban en orden y se usa el primero que contesta:
#   1) LIBRITO_BASE, si lo pones a mano;
#   2) los archivos crudos de GitHub en la rama principal;
#   3) los archivos crudos de la rama donde se está trabajando;
#   4) GitHub Pages (sólo sirve si la página está prendida en los ajustes del repositorio).
# Antes sólo existía (4): como Pages está apagado, cada «librito actualizar» daba error 404.
REPO="${LIBRITO_REPO:-yonathanpartida8/MarissaMiAmor}"
RAMA="${LIBRITO_RAMA:-claude/interactive-love-book-redesign-5p93fv}"
fuentes() {
  if [ -n "${LIBRITO_BASE:-}" ]; then printf '%s\n' "${LIBRITO_BASE%/}"; fi
  printf '%s\n' "https://raw.githubusercontent.com/$REPO/main/servidor"
  printf '%s\n' "https://raw.githubusercontent.com/$REPO/$RAMA/servidor"
  printf '%s\n' "https://${REPO%%/*}.github.io/${REPO##*/}/servidor"
}

if [ -n "${PREFIX:-}" ] && command -v pkg >/dev/null 2>&1; then
  command -v curl >/dev/null 2>&1 || pkg install -y curl
fi

echo "♥ Bajando My Love Pages (el servidor M.YNTHN)…"
BASE=""
for u in $(fuentes); do
  if curl -fsI --max-time 20 "$u/servidor.py" >/dev/null 2>&1; then BASE="$u"; break; fi
done
if [ -z "$BASE" ]; then
  echo "✘ No se pudo bajar: ninguna de estas direcciones contestó." >&2
  for u in $(fuentes); do echo "     $u/servidor.py" >&2; done
  echo "  Revisa el internet del teléfono. Nada se cambió." >&2
  exit 1
fi
echo "   desde $BASE"

mkdir -p "$DESTINO/panel"
tmp="$(mktemp -d "$DESTINO.nuevo.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
for f in $ARCHIVOS; do
  nombre="$(printf '%s' "$f" | sed 's/%C3%89/É/')"
  mkdir -p "$tmp/$(dirname "$nombre")"
  curl -fsSL --max-time 180 "$BASE/$f?v=$(date +%s)" -o "$tmp/$nombre"
done
# Todo bajó bien: recién ahora se reemplaza lo de antes. Se mueven (mv) en lugar de copiarse encima,
# porque librito.sh puede estar corriendo en este mismo momento y bash lo va leyendo mientras avanza:
# si se le escribiera encima del mismo archivo, se perdería a media línea.
for f in $ARCHIVOS; do
  nombre="$(printf '%s' "$f" | sed 's/%C3%89/É/')"
  mkdir -p "$DESTINO/$(dirname "$nombre")"
  mv -f "$tmp/$nombre" "$DESTINO/$nombre"
done
chmod +x "$DESTINO/librito.sh" "$DESTINO/start.sh" "$DESTINO/instalar.sh"
echo "✓ Archivos en $DESTINO"

# (Con «if», no con «&&»: con set -e, un «&&» que no se cumple apaga el guion aquí mismo y nunca
#  llegaba al asistente cuando se instala desde cero con «curl … | bash».)
if [ "${1:-}" = "--solo-archivos" ]; then exit 0; fi
exec bash "$DESTINO/librito.sh" instalar
