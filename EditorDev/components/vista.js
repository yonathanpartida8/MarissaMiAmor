/**
 * VISTA PREVIA — el librito tal cual lo verá ella.
 *
 * Se abre el mismo reproductor que va dentro del .zip, en un marco, y se le
 * pasa el proyecto. En la computadora sale dentro de un teléfono dibujado;
 * en el teléfono, a pantalla completa.
 */
import { el } from "./ui.js";
import { fuentesUsadas } from "../core/modelo.js";
import { RAIZ } from "../assets/biblioteca.js";

export class Vista {
  constructor(app) { this.app = app; }

  abrir(inicio = 0, { avanzar = false, portadilla = false } = {}) {
    this.cerrar();
    const P = this.app.estado.proyecto;
    if (!P.orden.length) return;
    this.app.lienzo.terminarTexto();
    const marco = el("iframe.ed-vista-marco", { src: "runtime/reproductor.html", title: "Vista previa", allow: "autoplay; fullscreen" });
    const capa = el("div.ed-previsual", {}, [
      el("div.ed-vista-tel", { style: { aspectRatio: `${P.ajustes.ancho} / ${P.ajustes.alto}` } }, [marco]),
      el("button.ed-vista-x", { type: "button", html: "✕ Volver a editar", onClick: () => this.cerrar() }),
    ]);
    document.body.append(capa);
    requestAnimationFrame(() => capa.classList.add("ver"));
    this.capa = capa;
    const datos = {
      nombre: P.nombre,
      ajustes: P.ajustes,
      orden: P.orden,
      paginas: P.paginas,
      titulos: Object.fromEntries(P.orden.map((id) => [id, P.paginas[id].nombre])),
    };
    const al = (ev) => {
      if (ev.origin !== location.origin || ev.source !== marco.contentWindow) return;
      if (ev.data?.tipo === "vista-lista") {
        marco.contentWindow.postMessage({ tipo: "librito", datos, urls: this.app.bib.mapa(), base: RAIZ, inicio: P.orden[inicio], portadilla, fuentes: [...fuentesUsadas(P)] }, location.origin);
        if (avanzar) setTimeout(() => marco.contentWindow.LibritoRT?.libro?.siguiente(), 900);
      } else if (ev.data?.tipo === "cerrar-vista") this.cerrar();
    };
    addEventListener("message", al);
    this._tecla = (e) => { if (e.key === "Escape") this.cerrar(); };
    addEventListener("keydown", this._tecla);
    this._quitar = () => { removeEventListener("message", al); removeEventListener("keydown", this._tecla); };
  }

  cerrar() {
    if (!this.capa) return;
    const c = this.capa;
    this.capa = null;
    this._quitar?.();
    c.classList.remove("ver");
    // Quitar el marco corta la música y todo lo que estuviera corriendo.
    setTimeout(() => c.remove(), 220);
  }
}
