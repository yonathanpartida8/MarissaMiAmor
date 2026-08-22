/**
 * INDEX — el índice del libro.
 *
 * Con cuarenta páginas (y las que vengan) ya no basta con pasar hojas: hace
 * falta poder ir a un sitio concreto. Se abre desde la barra, agrupa las
 * páginas por actos, marca por dónde va y cuáles esconden algo.
 *
 * No enseña de golpe todo lo que hay: las páginas a las que todavía no ha
 * llegado aparecen sin título, sólo con su número. Se puede ir igualmente
 * —esto no es un videojuego, no hay nada que desbloquear— pero así el
 * índice no revienta las sorpresas de un vistazo.
 */

import { el, qs } from "../utils/dom.js";
import { manifest, byAct, allSecrets } from "../data/manifest.js";
import { actById, chapterById } from "../data/chapters.js";

export class BookIndex {
  constructor(ctx) {
    this.ctx = ctx;
    this.open = false;
    this.built = false;
  }

  build() {
    this.root = el("div.toc", { role: "dialog", "aria-modal": "true", "aria-label": "Índice del libro", hidden: "" }, [
      el("div.toc__scrim"),
      el("div.toc__sheet", {}, [
        el("header.toc__head", {}, [
          el("div", {}, [
            el("h2.toc__title", { text: "El librito" }),
            el("p.toc__sub", { text: "" }),
          ]),
          el("button.toc__close", {
            type: "button",
            "aria-label": "Cerrar el índice",
            html: "✕",
            onClick: () => this.close(),
          }),
        ]),
        el("div.lectura.toc__scroll"),
      ]),
    ]);

    this.list = qs(".toc__scroll", this.root);
    this.sub = qs(".toc__sub", this.root);
    qs(".toc__scrim", this.root).addEventListener("click", () => this.close());

    this.#buildList();
    this.built = true;
    return this.root;
  }

  #buildList() {
    for (const [actId, entries] of byAct()) {
      const act = actById[actId];

      if (act) {
        this.list.append(
          el("h3.toc__act", {}, [
            el("span.toc__actnum", { text: String(act.number).padStart(2, "0") }),
            el("span.toc__actname", { text: act.title }),
          ])
        );
      }

      const group = el("ul.toc__group");
      for (const entry of entries) {
        const chapter = chapterById[entry.chapter];
        const item = el("li");
        const button = el("button.toc__item", {
          type: "button",
          dataset: { index: String(entry.index) },
          onClick: () => this.#goTo(entry.index),
        }, [
          el("span.toc__num", { text: String(entry.index + 1).padStart(2, "0") }),
          el("span.toc__name", { text: chapter?.title || this.#fallbackName(entry) }),
          entry.secret ? el("span.toc__gem", { title: "esconde algo", text: "✦" }) : null,
        ]);
        item.append(button);
        group.append(item);
      }
      this.list.append(group);
    }
  }

  #fallbackName(entry) {
    if (entry.type === "cover") return "Portada";
    if (entry.type === "finale") return "El final";
    return "";
  }

  /** Refleja el estado actual: dónde está, qué ha visto, qué ha encontrado. */
  refresh() {
    if (!this.built) return;

    const current = this.ctx.router?.index ?? 0;
    const furthest = this.ctx.store.get("furthest") ?? 0;
    const visited = new Set(this.ctx.store.get("visited") || []);

    for (const button of this.list.querySelectorAll(".toc__item")) {
      const index = Number(button.dataset.index);
      const entry = manifest[index];
      const seen = visited.has(entry.id) || index <= furthest;

      button.classList.toggle("is-current", index === current);
      button.classList.toggle("is-seen", seen);
      // Lo que aún no ha visto se queda sin nombre: no le reventamos nada.
      button.classList.toggle("is-veiled", !seen);

      const gem = button.querySelector(".toc__gem");
      if (gem) gem.classList.toggle("is-found", this.ctx.store.hasSecret(entry.secret));
    }

    const found = this.ctx.store.secretsFound;
    this.sub.textContent =
      `${Math.min(furthest + 1, manifest.length)} de ${manifest.length} páginas · ` +
      `${found} de ${allSecrets().length} secretos`;
  }

  #goTo(index) {
    this.close();
    // Un respiro para que el índice se cierre antes de que empiece el viaje.
    setTimeout(() => this.ctx.router.go(index, { transition: "iris" }), 220);
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.refresh();
    this.root.hidden = false;
    // Dos frames: uno para que exista en el layout, otro para que anime.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.root.classList.add("is-open"))
    );
    this.ctx.router?.lock();
    this.ctx.haptics.play("tap");

    // Lleva la vista a la página actual sin animación brusca.
    const current = qs(".toc__item.is-current", this.root);
    current?.scrollIntoView({ block: "center" });
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove("is-open");
    this.ctx.router?.unlock();
    this.ctx.haptics.play("tick");
    setTimeout(() => {
      if (!this.open) this.root.hidden = true;
    }, 420);
  }
}
