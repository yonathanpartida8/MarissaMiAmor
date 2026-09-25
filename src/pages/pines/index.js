/**
 * PINES — un carrusel de pines, como un tablero de Pinterest que se pasa
 * con el dedo.
 *
 * Cada foto es un pin clavado con su chincheta, un poquito torcido; el del
 * centro se endereza, crece y brilla. Tocar el del centro lo abre en
 * grande. Al final del carrusel está la carta (el texto del capítulo).
 *
 * La usan dos páginas: «Pines que me recordaron a ti» y «Pines que te
 * dedico». Cada una lee las fotos de SU carpeta de `fotos-paginas/`.
 *
 * Escondido: con doble toque en un pin se le pone un corazoncito, como
 * cuando se guarda uno; el libro se acuerda de cuáles.
 */

import { BasePage } from "../BasePage.js";
import { el, qs, splitWords, setVars } from "../../utils/dom.js";
import { clamp } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import { PRIORITY } from "../../core/AssetLoader.js";

const CHINCHETAS = ["#ff5c8a", "#ffb547", "#7cc6ff", "#b28bff", "#5fd3a5", "#ff8f6b"];

export default class PinesPage extends BasePage {
  static type = "pines";

  get criticalAssets() {
    return this.photos.slice(0, 3).map((p) => p.src);
  }

  build() {
    const ch = this.chapter;
    this.root = el("section.page.pines", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const rng = seeded(`pines-${this.id}`);
    this.reel = el("div.pin__reel", { "data-claim-drag": "", tabindex: "0" });
    this.pines = this.photos.map((photo, i) => {
      const nodo = el("figure.pin__pin", { dataset: { index: String(i) } }, [
        el("span.pin__chincheta", { "aria-hidden": "true" }),
        el("div.pin__img", { role: "img", "aria-label": `pin ${i + 1}` }),
        el("span.pin__guardado", { "aria-hidden": "true", text: "♥" }),
      ]);
      setVars(nodo, {
        "--giro": `${rng.range(-5, 5).toFixed(1)}deg`,
        "--chincheta": CHINCHETAS[i % CHINCHETAS.length],
        "--alto": `${rng.range(1.18, 1.46).toFixed(2)}`,
      });
      this.reel.append(nodo);
      return { node: nodo, photo, loaded: false };
    });

    // Si todavía no hay fotos en la carpeta, un pin vacío muy discreto en
    // vez de un carrusel roto.
    if (!this.pines.length) {
      this.reel.append(
        el("figure.pin__pin.pin__pin--vacio", {}, [
          el("span.pin__chincheta", { "aria-hidden": "true" }),
          el("p.pin__vacio", { text: "todavía los estoy escogiendo…" }),
        ])
      );
    }

    // La última tarjeta es la carta.
    this.prosa = el("div.prose.pin__prosa.selectable");
    this.prosa.append(splitWords(ch?.text || "").frag);
    this.carta = el("figure.pin__pin.pin__pin--carta", {}, [
      el("span.pin__chincheta", { "aria-hidden": "true" }),
      el("div.pin__carta-dentro", {}, [
        el("h3.pin__carta-titulo", { text: ch?.title || "" }),
        el("div.lectura.pin__carta-scroll", {}, [this.prosa]),
      ]),
    ]);
    setVars(this.carta, { "--chincheta": "#ff5c8a", "--giro": "1.5deg" });
    this.reel.append(this.carta);

    this.puntos = el("div.pin__puntos", { "aria-hidden": "true" }, [...this.reel.children].map(() => el("span")));
    this.contador = el("span.pin__contador");

    this.root.append(
      el("header.pin__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.pin__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.pin__tablero", {}, [
        this.reel,
        el("button.pin__nav.pin__nav--prev", { type: "button", "aria-label": "Pin anterior", html: "‹", onClick: () => this.#paso(-1) }),
        el("button.pin__nav.pin__nav--next", { type: "button", "aria-label": "Pin siguiente", html: "›", onClick: () => this.#paso(1) }),
      ]),
      el("div.pin__pie.hueco-barra", {}, [this.puntos, this.contador]),
      (this.lupa = el("div.pin__lupa", {
        "data-claim-drag": "",
        role: "button",
        "aria-label": "Cerrar el pin",
        onClick: () => this.root.classList.remove("is-lupa"),
      }))
    );
    return this.root;
  }

  get #guardados() {
    return new Set(this.ctx.store.get(`pines-${this.id}`) || []);
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    const g = this.#guardados;
    this.pines.forEach((p, i) => p.node.classList.toggle("is-guardado", g.has(i)));

    this.activo = -1;
    this.#medir();
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));

    let pendiente = false;
    this.on(this.reel, "scroll", () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        this.#pintar();
      });
    }, { passive: true });

    // Un toque centra o abre; dos seguidos, lo guardan.
    //
    // Con eventos de puntero y no con `click`: en el móvil, el navegador se
    // traga el `click` del segundo toque de un doble toque, y el pin no se
    // guardaba nunca. Si el dedo arrastra, el propio carrusel se queda el
    // gesto (llega `pointercancel`) y no cuenta como toque.
    let abajo = null;
    let ultimo = { t: 0, i: -1 };
    this.on(this.reel, "pointerdown", (e) => {
      abajo = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    });
    this.on(this.reel, "pointercancel", () => (abajo = null));
    this.on(this.reel, "pointerup", (e) => {
      const a = abajo;
      abajo = null;
      if (!a || a.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 12 || performance.now() - a.t > 450) return;
      const nodo = e.target.closest?.(".pin__pin");
      if (!nodo || !nodo.dataset.index) return;
      const i = Number(nodo.dataset.index);
      const ahora = performance.now();
      clearTimeout(this.relojLupa);
      if (ultimo.i === i && ahora - ultimo.t < 380) {
        this.#guardar(i, e);
        ultimo = { t: 0, i: -1 };
        return;
      }
      ultimo = { t: ahora, i };
      // Se espera un poquito antes de abrirlo, por si es un doble toque.
      if (i === this.activo) this.relojLupa = this.later(() => this.#abrirLupa(i), 380);
      else this.#centrar(i);
    });

    this.#pintar();
    this.#cargarCerca(Math.max(0, this.activo));
  }

  get #nodos() {
    return [...this.reel.children];
  }

  #medir() {
    const primero = this.reel.firstElementChild;
    if (!primero) return;
    const pad = Math.max(8, (this.reel.clientWidth - primero.getBoundingClientRect().width) / 2);
    this.reel.style.paddingLeft = `${pad}px`;
    this.reel.style.paddingRight = `${pad}px`;
    this.#pintar();
  }

  #pintar() {
    const centro = this.reel.scrollLeft + this.reel.clientWidth / 2;
    let mejor = 0;
    let menor = Infinity;
    this.#nodos.forEach((nodo, i) => {
      const d = Math.abs(nodo.offsetLeft + nodo.offsetWidth / 2 - centro);
      if (d < menor) { menor = d; mejor = i; }
      nodo.style.setProperty("--cerca", Math.max(0, 1 - d / (nodo.offsetWidth * 1.1)).toFixed(3));
    });
    if (mejor !== this.activo) {
      this.activo = mejor;
      this.#alCambiar(mejor);
    }
  }

  #alCambiar(i) {
    const total = this.pines.length;
    const enCarta = i >= this.#nodos.length - 1;
    this.root.classList.toggle("en-principio", i <= 0);
    this.root.classList.toggle("en-final", enCarta);
    this.contador.textContent = enCarta ? "la carta" : total ? `${i + 1} de ${total}` : "";
    [...this.puntos.children].forEach((p, k) => p.classList.toggle("is-ahora", k === i));
    this.ctx.haptics.play("tick");
    this.#cargarCerca(i);
    if (enCarta) {
      this.prosa.classList.add("is-writing");
      this.unlockSecret();
    }
  }

  #paso(d) {
    this.#centrar(clamp((this.activo < 0 ? 0 : this.activo) + d, 0, this.#nodos.length - 1));
  }

  #centrar(i) {
    const nodo = this.#nodos[i];
    if (!nodo) return;
    this.reel.scrollTo({ left: nodo.offsetLeft + nodo.offsetWidth / 2 - this.reel.clientWidth / 2, behavior: this.ctx.caps.reducedMotion ? "auto" : "smooth" });
    this.ctx.haptics.play("tap");
  }

  #abrirLupa(i) {
    const src = this.pines[i]?.photo.src;
    if (!src) return;
    this.lupa.style.backgroundImage = `url("${src}")`;
    this.root.classList.add("is-lupa");
    this.ctx.haptics.play("tap");
  }

  #guardar(i, e) {
    const g = this.#guardados;
    const ya = g.has(i);
    if (ya) g.delete(i);
    else g.add(i);
    this.ctx.store.set(`pines-${this.id}`, [...g]);
    const nodo = this.pines[i]?.node;
    nodo?.classList.toggle("is-guardado", !ya);
    if (!ya) {
      this.corazon(e.clientX, e.clientY);
      this.escondite(`pines-guardado-${this.id}`, "");
    } else this.ctx.haptics.play("tap");
  }

  #cargarCerca(i) {
    for (let k = i - 2; k <= i + 3; k++) {
      const pin = this.pines[k];
      if (!pin || pin.loaded) continue;
      pin.loaded = true;
      this.ctx.assets
        .load(pin.photo.src, Math.abs(k - i) <= 1 ? PRIORITY.CRITICAL : PRIORITY.NEXT)
        .then((img) => {
          const hueco = qs(".pin__img", pin.node);
          hueco.style.backgroundImage = `url("${pin.photo.src}")`;
          // El pin toma la forma de su foto (como en Pinterest), con tope.
          const w = img?.naturalWidth || img?.width;
          const h = img?.naturalHeight || img?.height;
          if (w && h) setVars(pin.node, { "--alto": clamp(h / w, 0.9, 1.6).toFixed(3) });
          hueco.classList.add("is-cargada");
        })
        .catch(() => {});
    }
  }
}
