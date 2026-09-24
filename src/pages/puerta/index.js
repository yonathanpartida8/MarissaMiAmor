/**
 * PUERTA — el candado de la entrada.
 *
 * Es el mismo candado de rodillos de `combinacion/`, pero en vez de guardar
 * una carta dentro, guarda el libro entero: el router no deja pasar de esta
 * página (`router.barrera`) hasta que se pone la fecha. Una vez abierto se
 * apunta para siempre y pasa sola a la página siguiente.
 */

import CombinacionPage from "../combinacion/index.js";
import { el } from "../../utils/dom.js";
import textos from "./textos.js";

export default class PuertaPage extends CombinacionPage {
  static type = "puerta";

  get t() {
    return textos;
  }

  get yaAbierto() {
    return !!this.ctx.store.get("puertaAbierta");
  }

  marcarAbierto() {
    this.ctx.store.set("puertaAbierta", true);
    this.ctx.router.abrirBarrera();
  }

  build() {
    super.build();
    this.root.classList.add("lock--puerta");
    this.root.dataset.type = "puerta";

    const kicker = this.root.querySelector(".lock__kicker");
    kicker.after(
      el("header.puerta__cabeza", {}, [
        el("h2.puerta__titulo", { text: textos.titulo }),
        el("p.puerta__sub", { text: textos.sub }),
      ])
    );

    this.bienvenida = el("div.puerta__abierta", { "aria-live": "polite" }, [
      el("p.puerta__hola", { text: textos.bienvenida }),
      el("button.puerta__seguir", {
        type: "button",
        text: textos.seguir,
        onClick: () => this.ctx.router.next(),
      }),
    ]);
    this.root.querySelector(".lock__stage").append(this.bienvenida);
    return this.root;
  }

  alAbrir(celebrar) {
    this.root?.classList.add("is-bienvenida");
    if (celebrar) this.later(() => this.active && this.ctx.router.next(), 2200);
  }
}
