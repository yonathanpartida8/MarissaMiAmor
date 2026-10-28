/**
 * EXPORTAR — tres caminos para tu página:
 *   1 · Descargar página completa (el .zip de siempre, con todo).
 *   2 · Publicar en servidor M.YNTHN (en línea, con su enlace).
 *   3 · Enviar Detallito (se abre el menú de Detallitos, con su transición).
 * En el teléfono es una hoja que sube; en la computadora, una tarjeta. Tiene
 * «atrás» (la flecha, Escape o el «atrás» del teléfono).
 */
import { el, esMovil } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";
import { bloquePublicar } from "./myn.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export class MenuExportar {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.pila = [];
  }

  abrir() {
    if (this.abierto) return;
    this.abierto = true;
    this.cab = el("header.ex-cab");
    this.cuerpo = el("div.ex-cuerpo");
    this.hoja = el("div.ex-hoja" + (esMovil() ? ".abajo" : ""), { role: "dialog", "aria-modal": "true", "aria-label": "Exportar" }, [el("i.ex-asa"), this.cab, this.cuerpo]);
    this.capa = el("div.ex-capa", {}, [this.hoja]);
    this.capa.addEventListener("pointerdown", (e) => { if (e.target === this.capa) this.cerrar(); });
    this._tecla = (e) => { if (e.key === "Escape" && this.abierto && !this.app.detallitos?.abierto) { e.stopPropagation(); this.atras(); } };
    addEventListener("keydown", this._tecla, true);
    document.body.append(this.capa);
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
    this.pila = [];
    this.ir("inicio");
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    removeEventListener("keydown", this._tecla, true);
    const c = this.capa;
    c.classList.remove("ver");
    setTimeout(() => c.remove(), 320);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
  }

  atras() {
    if (this.pila.length > 1) { this.pila.pop(); this._pintar(this.pila[this.pila.length - 1], -1); }
    else this.cerrar();
    return true;
  }

  ir(v) { this.pila.push(v); this._pintar(v, 1); }

  _pintar(v, dir) {
    const app = this.app;
    const atras = el("button.ex-atras", { type: "button", html: ico(this.pila.length > 1 ? "izquierda" : "cerrar"), "aria-label": this.pila.length > 1 ? "Atrás" : "Cerrar", onClick: () => this.atras() });
    const pantalla = el("div.ex-pantalla" + (dir < 0 ? ".vuelve" : ""));
    if (v === "inicio") {
      this.cab.replaceChildren(el("h2", { html: I("exportar", "Exportar") }), atras);
      const opcion = (icono, titulo, texto, al, clase = "", extra = null) => el("button.ex-opcion" + (clase ? "." + clase : ""), { type: "button", onClick: al }, [
        el("i", { html: ico(icono) }), el("span", {}, [el("b", { text: titulo }), el("small", { text: texto })]), extra, el("em", { html: ico("derecha") }),
      ].filter(Boolean));
      const nuevos = app.amorNuevos || 0;
      pantalla.append(
        opcion("exportar", "Descargar página completa", "Un .zip con todo (páginas, fotos, música y el proyecto) para guardarlo o pasarlo a otro lado.", () => { this.cerrar(); app.exportar(); }),
        opcion("publicar", `Publicar en servidor ${SRV.NOMBRE}`, "En línea, con su propio enlace, a pantalla completa y sólo para ver.", () => this.ir("publicar")),
        opcion("detallito", "Enviar Detallito", "Mándale esta página a tu amorcito y miren su colección.", (e) => { this.cerrar(); app.detallitos.abrir(e.currentTarget); }, "amor", nuevos ? el("i.dt-globo", { text: String(nuevos) }) : null),
      );
    } else if (v === "publicar") {
      this.cab.replaceChildren(el("h2", { html: I("publicar", `Publicar en ${SRV.NOMBRE}`) }), atras);
      const pintar = () => {
        pantalla.textContent = "";
        if (!SRV.conectado()) {
          pantalla.append(el("small.ed-nota.suave", { text: "Entra con tu cuenta (o créala al momento) y listo." }), formularioCuenta(app, { compacto: true, alEntrar: () => pintar() }));
          return;
        }
        pantalla.append(bloquePublicar(app, { alOtro: () => this.cerrar() }), el("button.ex-enlace", { type: "button", html: I("libro", "Ver mis páginas publicadas"), onClick: () => { this.cerrar(); app.abrirSeccion("publicadas"); } }));
      };
      pintar();
    }
    this.cuerpo.replaceChildren(pantalla);
  }
}
