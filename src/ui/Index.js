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
        this.#buildAjustes(),
      ]),
    ]);

    this.list = qs(".toc__scroll", this.root);
    this.sub = qs(".toc__sub", this.root);
    qs(".toc__scrim", this.root).addEventListener("click", () => this.close());

    this.#buildList();
    this.built = true;
    return this.root;
  }

  /**
   * El pie del índice: instalar el librito y empezarlo de cero.
   *
   * Van aquí y no en la barra de abajo por una razón de peso: ninguno de
   * los dos es algo que se quiera tocar sin querer. La barra se toca a
   * cada rato para pasar página, y un botón que borra toda la historia a
   * un dedo de distancia del de «siguiente» es una bomba esperando.
   * Aquí hay que abrir el índice a propósito y bajar hasta el final.
   */
  #buildAjustes() {
    this.instalarBtn = el("button.toc__accion", {
      type: "button",
      html: "<span>📲</span><b>Instalar el librito</b><i>se abre a pantalla completa, sin barras</i>",
      onClick: () => this.#instalar(),
    });
    this.borrarBtn = el("button.toc__accion.toc__accion--peligro", {
      type: "button",
      html: "<span>↺</span><b>Empezar de cero</b><i>se borra todo lo descubierto</i>",
      onClick: () => this.#pedirBorrar(),
    });
    this.pie = el("footer.toc__pie", {}, [this.instalarBtn, this.borrarBtn]);
    return this.pie;
  }

  /**
   * Instalar.
   *
   * En Android hay diálogo del sistema y basta con pedirlo. En iPhone NO
   * existe ese diálogo —Apple no lo ofrece a las páginas— así que lo
   * único honrado es explicar los dos toques que hay que dar. Poner un
   * botón que en iPhone no hace nada sería peor que no ponerlo.
   */
  async #instalar() {
    const inst = this.ctx.instalacion;
    if (inst?.instalado) {
      this.ctx.ui?.toast?.("Ya lo tienes instalado 🤍");
      return;
    }
    if (inst?.puedeInstalar) {
      const si = await inst.instalar();
      if (si) this.ctx.ui?.toast?.("Listo. Búscalo en tu pantalla de inicio 🤍");
      return;
    }
    if (inst?.esIOS) {
      this.ctx.ui?.toast?.("Toca «Compartir» ⬆️ y luego «Añadir a pantalla de inicio»", 6500);
      return;
    }
    this.ctx.ui?.toast?.("Busca «Instalar aplicación» en el menú de tu navegador", 6000);
  }

  /**
   * Empezar de cero, con su aviso de verdad.
   *
   * Dos toques y el segundo dice exactamente qué se pierde. No se usa el
   * `confirm()` del navegador porque en pantalla completa instalada sale
   * feo y, en iOS, a veces ni sale.
   */
  #pedirBorrar() {
    if (this.borrarBtn.dataset.seguro === "si") return;
    this.borrarBtn.dataset.seguro = "si";
    this.borrarBtn.innerHTML =
      "<span>⚠️</span><b>Toca otra vez para borrarlo todo</b>"
      + "<i>la historia, los secretos, el bosque y la cacería vuelven al principio</i>";
    this.borrarBtn.classList.add("is-armado");

    const cancelar = setTimeout(() => this.#desarmarBorrar(), 6000);
    this.borrarBtn.onclick = () => {
      clearTimeout(cancelar);
      this.#borrarTodo();
    };
  }

  #desarmarBorrar() {
    if (!this.borrarBtn) return;
    delete this.borrarBtn.dataset.seguro;
    this.borrarBtn.classList.remove("is-armado");
    this.borrarBtn.innerHTML =
      "<span>↺</span><b>Empezar de cero</b><i>se borra todo lo descubierto</i>";
    this.borrarBtn.onclick = () => this.#pedirBorrar();
  }

  /**
   * Borra TODO lo que el libro haya podido dejar por ahí.
   *
   * No basta con vaciar el almacén del libro: la noche estrellada guarda
   * lo suyo en su propia llave, y el ayudante de segundo plano tiene una
   * copia de los archivos. Si se borra sólo una de las tres, algo se
   * queda: el bosque se acuerda de la pala aunque el libro no se acuerde
   * de nada, y eso desconcierta más que no borrar.
   */
  async #borrarTodo() {
    this.borrarBtn.disabled = true;
    this.borrarBtn.innerHTML = "<span>…</span><b>Borrando</b><i>un momento</i>";
    try { this.ctx.store.reset(); } catch { /* seguimos */ }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("marissa.") || k.startsWith("noche-estrellada"))) {
          localStorage.removeItem(k);
        }
      }
    } catch { /* ventana privada: no había nada que borrar */ }
    try { sessionStorage.clear(); } catch { /* igual */ }
    await this.ctx.instalacion?.olvidarTodo?.();
    /* Recarga limpia, sin el número de página en la dirección. */
    location.replace(location.pathname);
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

      // Y el nombre se pone al día.
      //
      // El índice se construye una vez, al abrirlo, y hay páginas que aún no
      // saben cómo se llaman en ese momento: una página de `paginas-html/` se
      // llama «Página 3» hasta que su archivo se abre y se mira el `<title>`.
      // Sin esto, la que aprendió su nombre después seguía apareciendo aquí
      // con el provisional para siempre.
      const nombre = button.querySelector(".toc__name");
      const actual = chapterById[entry.chapter]?.title || this.#fallbackName(entry);
      if (nombre && nombre.textContent !== actual) nombre.textContent = actual;

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
