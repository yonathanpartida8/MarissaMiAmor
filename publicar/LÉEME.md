# publicar/ — publicar sin token

Aquí se suben los `.zip` que arma el editor en **Páginas publicadas → Publicar sin token**.

1. En el editor: «1 · Descargar el .zip para subir».
2. «2 · Subirlo en GitHub» abre esta carpeta en GitHub (Add file → Upload files):
   arrastra el `.zip` y toca **Commit changes**.
3. La acción **Publicar páginas subidas** (`.github/workflows/publicar-subidas.yml`)
   lo abre en `publicaciones/<nombre-del-zip>/` (si ya existe, `<nombre>-2`, `-3`…), lo añade a `publicaciones/lista.json`,
   borra el `.zip` y le pide a GitHub Pages que publique. En 1 a 3 minutos queda en
   `https://<usuario>.github.io/<repositorio>/publicaciones/<nombre>/`.

Para quitar una publicada: borra su carpeta `publicaciones/<nombre>/` en GitHub (y su línea
en `publicaciones/lista.json`), o usa el botón de quitar con token.

Importante: GitHub Pages tiene que estar **encendido** (Settings → Pages → Deploy from a
branch → la rama del librito → `/ (root)`). Si está apagado, todo da 404.
