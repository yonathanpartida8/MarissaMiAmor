/**
 * APP — el arranque y el gobierno general.
 *
 * Orquesta: pantalla de apertura, desbloqueo de audio, permiso de giroscopio,
 * primera página y reanudación desde donde lo dejó.
 */

import { createContext } from "./Context.js";
import { Router } from "./Router.js";
import { GLStage } from "../gl/GLStage.js";
import { UI } from "../ui/UI.js";
import { installTextures } from "../components/textures.js";
import {
  manifest,
  registerCustomPages,
  registerPaginasHtml,
  registerAmores,
  indexOfPage,
} from "../data/manifest.js";
import { registerCustomChapters } from "../data/chapters.js";
import { loadCustomPages, customAct } from "../data/custom.js";
import { descubrirAmores, entradasDeAmores, actoAmores, CARPETA } from "../data/amores.js";
import {
  descubrirPaginasHtml,
  entradasDePaginasHtml,
  actoHtml,
  CARPETA as CARPETA_HTML,
} from "../data/paginas-html.js";
import { warmup } from "../pages/registry.js";
import { PRIORITY } from "./AssetLoader.js";
import { el, qs, wait } from "../utils/dom.js";
import { aplicarTema } from "../utils/luz.js";
import { temaActivo, temaSiguiente, temaDelSistema, fondoDelTema } from "../utils/temas.js";

export class App {
  constructor() {
    this.ctx = createContext();
    // La interfaz necesita poder pedir un cambio de modo, y el cambio de
    // modo toca cosas (el shader del fondo, la página en pantalla) que no
    // son suyas. En vez de repartir ese conocimiento por la barra, la barra
    // pide y aquí se hace.
    this.ctx.app = this;
    this.boot = qs("#boot");
    this.stage = qs("#stage");
    this.uiRoot = qs("#ui");
    this.canvas = qs("#gl");
  }

  async start() {
    installTextures();

    // LA HABITACIÓN, ANTES QUE NADA.
    //
    // Va la primera línea de todo, antes incluso de encender WebGL, porque
    // es lo único que decide de qué color es la pantalla. Puesto más tarde,
    // el libro abría de noche y se aclaraba de golpe medio segundo después:
    // un fogonazo en la cara justo al abrir, que es el peor sitio posible.
    //
    // Si nunca ha elegido, se le hace caso a su teléfono.
    this.#aplicarTema(this.ctx.store.get("tema") || temaDelSistema(), { guardar: false });

    const setStatus = (text) => {
      const node = qs(".boot__status", this.boot);
      if (node) node.textContent = text;
    };
    const setProgress = (p) => {
      const bar = qs(".boot__bar i", this.boot);
      if (bar) bar.style.width = `${Math.round(p * 100)}%`;
    };

    // 1. WebGL en cuanto sea posible: el fondo debe estar vivo desde el minuto uno.
    setStatus("encendiendo la luz…");
    setProgress(0.15);
    this.ctx.gl = new GLStage(this.canvas, this.ctx);
    this.ctx.loop.start();

    // 2. Se pone a buscar sus fotos de `images/amores/` YA, pero sin esperarla:
    //    la búsqueda son unas cuantas idas y venidas a la red, y no tiene
    //    ningún sentido que la portada se quede parada mirándolas. Se recoge
    //    más abajo, cuando la descarga de la portada ya ha pagado esa espera.
    const buscandoAmores = descubrirAmores().catch((err) => {
      console.error("[amores] no se pudieron buscar las fotos", err);
      return [];
    });

    //    Y lo mismo con sus páginas HTML de `paginas-html/`: preguntar por
    //    ellas son otras cuantas idas y venidas, así que las dos carpetas se
    //    buscan A LA VEZ y en paralelo con la descarga de la portada. Las dos
    //    se recogen más abajo, ya en orden y cada una en su sitio.
    const buscandoHtml = descubrirPaginasHtml().catch((err) => {
      console.error("[paginas-html] no se pudieron buscar las páginas", err);
      return [];
    });

    // 3. Sus páginas escritas a mano. Van antes que nada porque pueden colarse
    //    en cualquier sitio del libro, incluso justo después de la portada.
    await this.#loadMine();

    // 4. Lo mínimo imprescindible para abrir: la portada y su módulo.
    setStatus("buscando la portada…");
    setProgress(0.35);
    warmup("cover");
    warmup(manifest[1]?.type || "envelope");

    const firstPhotos = (manifest[0].photos || []).map((p) => p.src);
    await this.ctx.assets
      .loadAll(firstPhotos, PRIORITY.CRITICAL, (p) => setProgress(0.35 + p * 0.45))
      .catch(() => {});

    // 5. Ahora sí: lo que se ha encontrado en las dos carpetas se pega al
    //    final del libro. Antes de montar el router, para que el índice, el
    //    progreso y el «página N de M» nazcan sabiendo cuántas páginas hay de
    //    verdad.
    //
    //    EL ORDEN DE ESTAS DOS LÍNEAS ES EL ORDEN DEL LIBRO: primero las
    //    HTML, después las fotos. (Aun así, `registerPaginasHtml` busca su
    //    sitio delante de la primera foto en vez de fiarse de esto: si algún
    //    día se cambia el orden aquí, el libro seguirá saliendo bien.)
    await this.#loadPaginasHtml(buscandoHtml);
    await this.#loadAmores(buscandoAmores);

    // 6. Router y UI.
    setStatus("encuadernando…");
    setProgress(0.9);
    this.ctx.router = new Router(this.ctx, this.stage);
    this.ctx.ui = new UI(this.ctx, this.uiRoot);
    this.ctx.ui.mount();

    this.#wire();

    setProgress(1);
    setStatus("listo");
    await wait(280);

    // 5. La puerta: un toque real que desbloquea audio y sensores.
    await this.#awaitEntry();

    this.boot.classList.add("is-done");
    setTimeout(() => this.boot.remove(), 1000);

    this.ctx.gl?.setIntensity(1);

    // 6. Abrimos por donde lo dejó, si ya había estado aquí.
    //    Se busca por id: si él ha metido páginas suyas en medio desde la
    //    última visita, el número ya no vale pero el id sigue siendo el mismo.
    const savedId = this.ctx.store.get("pageId");
    const byId = savedId ? indexOfPage(savedId) : -1;
    const saved = byId >= 0 ? byId : this.ctx.store.get("page") || 0;
    const resume = saved > 0 && !this.ctx.store.isFirstVisit;
    await this.ctx.router.go(resume ? saved : 0, { transition: "none", direction: "none" });

    if (resume) this.ctx.ui.toast(`Seguimos donde lo dejamos · página ${saved + 1}`);

    // 7. Lo demás se va cargando solo, sin estorbar.
    this.#backgroundPreload();
  }

  /**
   * Cambia de habitación: claro, pastel o noche.
   *
   * Es el único sitio del libro donde se cambia de tema. Junta las cuatro
   * cosas que tienen que pasar A LA VEZ para que no se vea el cambio a
   * trozos: los tokens del CSS, la luz del fondo de WebGL, la marca en
   * `<html>` y el recuerdo de lo que ha elegido.
   *
   * @param {string} id
   * @param {{guardar?: boolean, avisar?: boolean}} [opciones]
   * @returns {boolean} si de verdad ha cambiado
   */
  #aplicarTema(id, { guardar = true, avisar = false } = {}) {
    if (!aplicarTema(id)) return false;
    const tema = temaActivo();

    // El fondo se entera aparte: no es CSS, es un shader. Y va interpolado,
    // así que esto no da un salto sino un amanecer de medio segundo.
    this.ctx.gl?.setAmbiente(tema.luzAmbiente);

    // Y la página que esté en pantalla vuelve a encenderse con la luz nueva:
    // su paleta es la misma, pero la habitación ya no.
    const actual = this.ctx.router?.current;
    if (actual) {
      this.ctx.gl?.setMood(fondoDelTema(actual.palette), actual.mood);
      // Y si guarda una copia de algún color donde el CSS no llega —un
      // lienzo, una escena, el documento de un iframe—, que la ponga al día.
      try {
        actual.alCambiarTema?.(tema);
      } catch (err) {
        // Una página que se queje aquí no puede impedir el cambio de modo.
        console.error("[temas] la página no pudo cambiar de luz", err);
      }
    }

    if (guardar) this.ctx.store.set("tema", tema.id);
    // Y el botón de la barra se pone al día. Va aquí y no en el botón para
    // que diga la verdad aunque el cambio no haya salido de él.
    this.ctx.ui?.refrescarTema?.();
    if (avisar) this.ctx.ui?.toast(`${tema.emoji}  ${tema.frase}`, 2200);
    return true;
  }

  /** Pasa al siguiente modo. Es lo que hace el botón de la barra. */
  siguienteTema() {
    return this.#aplicarTema(temaSiguiente(), { avisar: true });
  }

  /**
   * Carga `mis-paginas/paginas.js` — lo que él añada a mano.
   *
   * Todo lo que pueda salir mal aquí sale mal en silencio para ella y con un
   * aviso claro para él en la consola: el libro tiene que abrirse siempre,
   * aunque el archivo tenga una coma de más o falte una foto.
   */
  async #loadMine() {
    try {
      const { entries, chapters, problems } = await loadCustomPages();

      if (problems.length) {
        console.groupCollapsed(
          `%c mis-paginas %c ${problems.length} aviso${problems.length > 1 ? "s" : ""}`,
          "background:#ec6f92;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px",
          "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
        );
        problems.forEach((p) => console.warn("·", p));
        console.info("Cómo se escriben las páginas: mis-paginas/README.md");
        console.groupEnd();
      }

      if (entries.length) {
        registerCustomChapters(chapters, customAct);
        registerCustomPages(entries);
        console.info(
          `%c mis-paginas %c ${entries.length} página${entries.length > 1 ? "s" : ""} tuya${entries.length > 1 ? "s" : ""} añadida${entries.length > 1 ? "s" : ""}`,
          "background:#7ee0c0;color:#20080f;border-radius:3px 0 0 3px;padding:2px 6px",
          "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
        );
      }
    } catch (err) {
      // Red de seguridad final: pase lo que pase, el libro se abre.
      console.error("[mis-paginas] no se pudieron cargar", err);
    }
  }

  /**
   * Busca `paginas-html/página.html1.html`, `…2.html`… y convierte cada
   * archivo en una página, después del final y antes de las fotos.
   *
   * No hay nada que configurar: se deja el archivo en la carpeta y aparece.
   * Si la carpeta no existe —o está vacía, o la búsqueda falla— el libro es
   * exactamente el mismo libro y nadie se entera.
   */
  async #loadPaginasHtml(buscando) {
    try {
      const lista = await buscando;
      if (!lista?.length) return;

      const { entries, chapters } = entradasDePaginasHtml(lista);
      registerCustomChapters(chapters, actoHtml);
      registerPaginasHtml(entries);

      // El módulo se pide ya: cuando llegue a la primera, ya estará
      // descargado y la entrada será instantánea.
      warmup("html");

      const n = lista.length;
      console.info(
        `%c paginas-html %c ${n} página${n > 1 ? "s" : ""} de ${CARPETA_HTML} después del final`,
        "background:#ffd0dc;color:#3a0a1c;border-radius:3px 0 0 3px;padding:2px 6px",
        "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
      );
      console.info(
        `[paginas-html] los avisos de «404» de ${CARPETA_HTML} son normales: así es como ` +
          "se averigua cuántas páginas hay, porque un sitio de archivos no sabe decirlo."
      );
    } catch (err) {
      console.error("[paginas-html] no se pudieron añadir las páginas", err);
    }
  }

  /**
   * Busca `images/amores/amor1.png`, `amor2.png`… y convierte cada una en una
   * página, al final de todo.
   *
   * No hay nada que configurar: se deja el archivo en la carpeta y aparece.
   * Si la carpeta está vacía —o si la búsqueda falla, o tarda demasiado— el
   * libro es exactamente el mismo libro y nadie se entera.
   */
  async #loadAmores(buscando) {
    try {
      const lista = await buscando;
      if (!lista?.length) return;

      const entradas = entradasDeAmores(lista);
      registerCustomChapters([], actoAmores);
      registerAmores(entradas);

      // El módulo de la página se pide ya: cuando llegue a la primera foto,
      // ya estará descargado y la entrada será instantánea.
      warmup("amor");

      console.info(
        `%c amores %c ${lista.length} foto${lista.length > 1 ? "s" : ""} de ${CARPETA} al final del libro`,
        "background:#ffb0c8;color:#3a0a1c;border-radius:3px 0 0 3px;padding:2px 6px",
        "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
      );
      console.info(
        `[amores] los avisos de «404» de ${CARPETA} son normales: así es como se ` +
          "averigua cuántas fotos hay, porque un sitio de archivos no sabe decirlo."
      );
    } catch (err) {
      console.error("[amores] no se pudieron añadir las fotos", err);
    }
  }

  /**
   * Espera al primer toque. Sin él, ningún navegador móvil deja sonar música
   * ni dar acceso al giroscopio; y además es un momento bonito: el libro
   * pide que lo toques para abrirse.
   */
  #awaitEntry() {
    return new Promise((resolve) => {
      const button = el("button.boot__enter", {
        type: "button",
        text: "Tócame para abrir",
        "aria-label": "Abrir el libro",
      });
      qs(".boot__inner", this.boot).append(button);

      const open = async () => {
        button.disabled = true;
        button.textContent = "abriendo…";

        await this.ctx.audio.unlock();
        if (this.ctx.store.get("musicOn") !== false) this.ctx.audio.startMusic(4200);
        this.ctx.audio.play("open", { volume: 0.8 });
        this.ctx.haptics.play("open");

        // El giroscopio se pide aquí, dentro del gesto (iOS lo exige).
        this.ctx.pointer.enableTilt().catch(() => {});

        this.ctx.gl?.flash(0.55);
        this.ctx.gl?.pulse(1);
        resolve();
      };

      button.addEventListener("click", open, { once: true });
    });
  }

  #wire() {
    const { router, ui, gl, audio, store } = this.ctx;

    router.on("change", ({ index, entry, page }) => {
      ui.setPage(index, entry, page);
      // La música baja un poco al llegar a una página con carta.
      if (entry.type === "envelope" || entry.type === "handwriting") audio.duck(0.45, 4000);
    });

    router.on("willchange", () => ui.hideHint());

    // Si el rendimiento cae, se avisa por lo bajo y se recorta.
    this.ctx.loop.on("degraded", (budget) => {
      console.info("[perf] calidad reducida a", budget.name);
      document.documentElement.dataset.tier = budget.name;
    });

    store.on("secret", () => ui.updateSecrets());

    // Recalibrar la inclinación al rotar el teléfono.
    this.ctx.viewport.on("resize", () => this.ctx.pointer.recalibrate());
  }

  /**
   * Precarga de fondo con cabeza: primero las fotos de las tres páginas
   * siguientes, y sólo cuando el navegador esté ocioso, el resto.
   */
  #backgroundPreload() {
    const near = [];
    for (let i = 1; i <= 3; i++) {
      const entry = manifest[i];
      if (entry?.photos) near.push(...entry.photos.map((p) => p.src));
    }
    this.ctx.assets.idlePreload(near.slice(0, 12));
  }
}
