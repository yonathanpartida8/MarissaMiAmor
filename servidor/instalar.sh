#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
#  Instalador de M.YNTHN, el servidor del librito (una sola línea en Termux):
#
#    curl -fsSL https://yonathanpartida8.github.io/MarissaMiAmor/servidor/instalar.sh | bash
#
#  Baja SÓLO la carpeta servidor/ (no el repositorio entero, que pesa mucho)
#  a ~/librito-servidor, instala python y cloudflared y deja listo el
#  comando «librito». Tus datos (~/librito-datos) nunca se tocan.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Se baja de tu GitHub Pages (la misma página del librito). Para bajarlo de
# otro lado: LIBRITO_BASE=https://…/servidor
DESTINO="${LIBRITO_APP:-$HOME/librito-servidor}"
BASE="${LIBRITO_BASE:-https://yonathanpartida8.github.io/MarissaMiAmor/servidor}"
ARCHIVOS="servidor.py librito.sh start.sh instalar.sh L%C3%89EME.md panel/index.html panel/panel.css panel/panel.js panel/icono.svg"

if [ -n "${PREFIX:-}" ] && command -v pkg >/dev/null 2>&1; then
  command -v curl >/dev/null 2>&1 || pkg install -y curl
fi

echo "♥ Bajando My Love Pages (el servidor M.YNTHN)…"
mkdir -p "$DESTINO/panel"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
for f in $ARCHIVOS; do
  nombre="$(printf '%s' "$f" | sed 's/%C3%89/É/')"
  mkdir -p "$tmp/$(dirname "$nombre")"
  curl -fsSL "$BASE/$f?v=$(date +%s)" -o "$tmp/$nombre"
done
# Todo bajó bien: recién ahora se reemplaza lo de antes.
cp -R "$tmp/." "$DESTINO/"
chmod +x "$DESTINO/librito.sh" "$DESTINO/start.sh" "$DESTINO/instalar.sh"
echo "✓ Archivos en $DESTINO"

[ "${1:-}" = "--solo-archivos" ] && exit 0
exec bash "$DESTINO/librito.sh" instalar
