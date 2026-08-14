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
import { manifest } from "../data/manifest.js";
import { warmup } from "../pages/registry.js";
import { PRIORITY } from "./AssetLoader.js";
import { el, qs, wait } from "../utils/dom.js";

export class App {
  constructor() {
    this.ctx = createContext();
    this.boot = qs("#boot");
    this.stage = qs("#stage");
    this.uiRoot = qs("#ui");
    this.canvas = qs("#gl");
  }

  async start() {
    installTextures();

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

    // 2. Lo mínimo imprescindible para abrir: la portada y su módulo.
    setStatus("buscando la portada…");
    setProgress(0.35);
    warmup("cover");
    warmup(manifest[1]?.type || "envelope");

    const firstPhotos = (manifest[0].photos || []).map((p) => p.src);
    await this.ctx.assets
      .loadAll(firstPhotos, PRIORITY.CRITICAL, (p) => setProgress(0.35 + p * 0.45))
      .catch(() => {});

    // 3. Router y UI.
    setStatus("encuadernando…");
    setProgress(0.9);
    this.ctx.router = new Router(this.ctx, this.stage);
    this.ctx.ui = new UI(this.ctx, this.uiRoot);
    this.ctx.ui.mount();

    this.#wire();

    setProgress(1);
    setStatus("listo");
    await wait(280);

    // 4. La puerta: un toque real que desbloquea audio y sensores.
    await this.#awaitEntry();

    this.boot.classList.add("is-done");
    setTimeout(() => this.boot.remove(), 1000);

    this.ctx.gl?.setIntensity(1);

    // 5. Abrimos por donde lo dejó, si ya había estado aquí.
    const saved = this.ctx.store.get("page") || 0;
    const resume = saved > 0 && !this.ctx.store.isFirstVisit;
    await this.ctx.router.go(resume ? saved : 0, { transition: "none", direction: "none" });

    if (resume) this.ctx.ui.toast(`Seguimos donde lo dejamos · página ${saved + 1}`);

    // 6. Lo demás se va cargando solo, sin estorbar.
    this.#backgroundPreload();
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
