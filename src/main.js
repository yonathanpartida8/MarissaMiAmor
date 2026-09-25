/**
 * Punto de entrada.
 *
 *   Para Marissa.
 *   Que cada página te encuentre bien. 🤍
 */

import { App } from "./core/App.js";

/* Chrome en Android: una pulsación larga abría el menú de «descargar
   imagen / copiar», y arrastrar una foto la sacaba de la página. Aquí se
   mantienen el dedo y la foto dentro del libro; el texto que se puede
   seleccionar (`.selectable`) sigue funcionando como siempre. */
const esTexto = (t) => t?.closest?.(".selectable, input, textarea, [contenteditable]");
window.addEventListener("contextmenu", (e) => { if (!esTexto(e.target)) e.preventDefault(); });
window.addEventListener("dragstart", (e) => { if (!esTexto(e.target)) e.preventDefault(); });

const app = new App();

app.start().catch((error) => {
  console.error("[libro] no se pudo abrir:", error);

  // Nunca dejar una pantalla negra sin explicación: si algo falla, que al
  // menos quede escrito lo único que de verdad importa.
  const boot = document.querySelector("#boot");
  if (!boot) return;
  boot.classList.remove("is-done");
  boot.innerHTML = `
    <div class="boot__inner">
      <p class="boot__kicker">algo se atascó</p>
      <h1 class="boot__name">Te amo</h1>
      <p class="boot__status">recarga la página, mi amor · el libro sigue aquí</p>
    </div>`;
});

// Ayuda mientras se prepara el libro en el ordenador: `window.libro` para
// mirarlo desde la consola, y un repaso de que todas las fotos de `fotos.js`
// existen de verdad —con el nombre del archivo y la página que lo pide, para
// no tener que buscar dónde está la errata—. En el libro publicado no corre.
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  window.libro = app;
  import("./data/fotos.js").then(({ revisarFotos }) => revisarFotos());
}
