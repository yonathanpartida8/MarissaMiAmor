#!/bin/bash
# Arranque de las sesiones de Claude Code en la web.
#
# El librito no tiene dependencias que instalar: es HTML, CSS y JavaScript
# sin empaquetador, y Three.js va dentro de vendor/. Lo único que hace falta
# para revisarlo es Node (20 o más), que es lo que usan:
#
#   node herramientas/contenido.mjs    rehace las listas de las carpetas
#   node herramientas/verificar.mjs    revisa el libro entero (sintaxis
#                                      de todo el código incluida)
#
# Este script comprueba que Node esté y sea lo bastante nuevo. Es idempotente
# y no escribe nada en el proyecto.
set -euo pipefail

# Sólo en la web: en local cada quien tiene su Node.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "session-start: falta Node; herramientas/verificar.mjs no va a poder correr." >&2
  exit 0
fi

MAYOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$MAYOR" -lt 20 ]; then
  echo "session-start: Node $(node --version) es viejo; verificar.mjs necesita 20 o más." >&2
  exit 0
fi

echo "session-start: Node $(node --version) listo (el proyecto no tiene dependencias que instalar)."
