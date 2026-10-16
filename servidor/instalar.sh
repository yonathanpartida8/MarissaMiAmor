#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  Instalador del servidor del librito (una sola línea en Termux):
#
#    curl -fsSL https://raw.githubusercontent.com/yonathanpartida8/MarissaMiAmor/refs/heads/claude/interactive-love-book-redesign-5p93fv/servidor/instalar.sh | bash
#
#  Baja SÓLO la carpeta servidor/ (no el repositorio entero, que pesa mucho)
#  a ~/librito-servidor, instala python y cloudflared y deja listo el
#  comando «librito». Tus datos (~/librito-datos) nunca se tocan.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="${REPO:-yonathanpartida8/MarissaMiAmor}"
RAMA="${RAMA:-claude/interactive-love-book-redesign-5p93fv}"
DESTINO="${LIBRITO_APP:-$HOME/librito-servidor}"
BASE="https://raw.githubusercontent.com/$REPO/refs/heads/$RAMA/servidor"
ARCHIVOS="servidor.py librito.sh instalar.sh L%C3%89EME.md panel/index.html panel/panel.css panel/panel.js panel/icono.svg"

if [ -n "${PREFIX:-}" ] && command -v pkg >/dev/null 2>&1; then
  command -v curl >/dev/null 2>&1 || pkg install -y curl
fi

echo "♥ Bajando el servidor del librito ($RAMA)…"
mkdir -p "$DESTINO/panel"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
for f in $ARCHIVOS; do
  nombre="$(printf '%s' "$f" | sed 's/%C3%89/É/')"
  mkdir -p "$tmp/$(dirname "$nombre")"
  curl -fsSL "$BASE/$f" -o "$tmp/$nombre"
done
# Todo bajó bien: recién ahora se reemplaza lo de antes.
cp -R "$tmp/." "$DESTINO/"
chmod +x "$DESTINO/librito.sh" "$DESTINO/instalar.sh"
echo "✓ Archivos en $DESTINO"

[ "${1:-}" = "--solo-archivos" ] && exit 0
exec bash "$DESTINO/librito.sh" instalar
