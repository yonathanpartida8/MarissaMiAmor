/**
 * Punto de entrada.
 *
 *   Para Marissa.
 *   Que cada página te encuentre bien. 🤍
 */

import { App } from "./core/App.js";

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

// Ayuda en desarrollo: window.libro para inspeccionar desde la consola, y un
// aviso si alguna ilustración se ha quedado sin usar o sale dos veces (lo más
// fácil de romper al reordenar el libro).
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  window.libro = app;
  import("./data/photos.js").then(({ auditGroups }) => {
    const audit = auditGroups();
    if (audit.missing.length) console.warn("[fotos] sin usar:", audit.missing.join(", "));
    if (audit.duplicated.length) console.warn("[fotos] repetidas:", audit.duplicated.join(" | "));
    if (!audit.missing.length && !audit.duplicated.length) {
      console.info(`[fotos] ${audit.assigned}/${audit.total} repartidas, sin huecos ni repetidas`);
    }
  });
}
