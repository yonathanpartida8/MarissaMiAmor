/**
 * VIDEOPAGE — un vídeo suyo.
 *
 * Lo delicado de un vídeo en un libro que se abre desde el móvil no es
 * reproducirlo: es no descargarlo. Aquí no se pide un solo byte hasta que ella
 * llega a la página, y ni siquiera entonces: se pide al darle al play. Al
 * pasar de página se pausa y se suelta la memoria.
 *
 * Mientras tanto se ve la carátula (`poster`), que pesa lo que una foto.
 *
 * Y como los navegadores móviles no dejan reproducir con sonido sin un gesto,
 * el botón de play ES ese gesto: arranca con sonido a la primera.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { clamp01 } from "../../utils/math.js";

export default class VideoPage extends BasePage {
  static type = "video";

  /** El vídeo no es un asset del precargador: se pide al reproducir. */
  get criticalAssets() {
    const poster = this.chapter?.poster;
    return poster ? [poster] : [];
  }

  build() {
    const ch = this.chapter;
    this.src = ch?.video || "";
    this.poster = ch?.poster || this.photos[0]?.src || "";

    this.root = el("section.page.mine.mine--video", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // preload="none": ni un byte hasta que se le dé al play.
    this.video = el("video.vid__el", {
      playsinline: "",
      "webkit-playsinline": "",
      preload: "none",
      poster: this.poster || null,
      "aria-label": ch?.title || "Vídeo",
    });
    this.video.playsInline = true;

    this.playBtn = el("button.vid__play", {
      type: "button",
      "aria-label": "Reproducir el vídeo",
      html: `<span class="vid__triangle"></span>`,
    });

    this.progress = el("div.vid__progress", {}, [el("i")]);
    this.progressFill = this.progress.firstElementChild;

    this.frame = el("div.vid__frame", { "data-claim-drag": "" }, [
      el("div.vid__poster"),
      this.video,
      el("div.vid__veil"),
      this.playBtn,
      this.progress,
      el("div.vid__badge", { text: "" }),
    ]);

    this.badge = this.frame.querySelector(".vid__badge");
    if (this.poster) {
      this.frame.querySelector(".vid__poster").style.backgroundImage = `url("${this.poster}")`;
    }

    this.proseEl = el("div.mine__prose.selectable");
    if (ch?.text) this.proseEl.append(splitWords(ch.text).frag);

    this.sparkles = createSparkles(this.ctx, { seed: `vid-${this.id}`, scale: 0.5 });

    this.root.append(
      el("div.mine__stage", {}, [this.frame]),
      el("div.vidrio.mine__panel.hueco-barra", {}, [
        ch?.kicker ? el("span.kicker", { text: ch.kicker }) : null,
        el("h2.mine__title", { text: ch?.title || "" }),
        ch?.text ? el("hr.rule") : null,
        ch?.text ? el("div.lectura.mine__scroll", {}, [this.proseEl]) : null,
      ]),
      this.sparkles.node
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    this.playing = false;
    this.armed = false;

    if (!this.src) {
      this.root.classList.add("is-broken");
      this.badge.textContent = "falta el vídeo";
      return;
    }

    // Si el archivo no existe o el formato no se puede reproducir, se dice
    // claramente en vez de dejar un rectángulo negro para siempre.
    this.on(this.video, "error", () => {
      this.root.classList.add("is-broken");
      this.badge.textContent = "este vídeo no se pudo abrir";
    });
    this.on(this.video, "waiting", () => this.root.classList.add("is-buffering"));
    this.on(this.video, "playing", () => this.root.classList.remove("is-buffering"));
    this.on(this.video, "ended", () => this.#onEnded());
    this.on(this.video, "timeupdate", () => this.#onProgress());
    this.on(this.video, "loadedmetadata", () => {
      const secs = Math.round(this.video.duration || 0);
      if (secs) this.badge.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    });

    // Sin carátula, se enseña el primer fotograma en vez de un cuadro negro:
    // sólo se piden los metadatos y un trocito, no el vídeo entero.
    if (!this.poster) {
      this.armed = true;
      this.video.preload = "metadata";
      this.video.src = `${this.src}#t=0.1`;
    }

    this.addGestures(
      new Gestures(
        this.frame,
        { onTap: () => this.#toggle() },
        { exclusive: true, threshold: 14 }
      )
    );
  }

  /** El primer play también baja la música del libro, para no pisarse. */
  async #toggle() {
    if (this.root.classList.contains("is-broken")) return;

    if (!this.armed) {
      this.armed = true;
      // El src se pone AHORA: hasta este momento no se ha pedido nada.
      this.video.src = this.src;
      this.video.load();
    }

    if (this.playing) {
      this.video.pause();
      this.playing = false;
      this.root.classList.remove("is-playing");
      this.ctx.audio.play("turn", { volume: 0.2, rate: 1.4 });
      return;
    }

    this.ctx.haptics.play("tap");
    this.ctx.audio.duck(0.12, 60_000); // la música se aparta mientras suena

    try {
      await this.video.play();
      this.playing = true;
      this.root.classList.add("is-playing");
      this.unlockSecret();
    } catch {
      // Algunos navegadores sólo dejan arrancar sin sonido. Mejor mudo que
      // nada: se avisa y ella puede quitarle el silencio si quiere.
      this.video.muted = true;
      this.root.classList.add("is-muted");
      this.badge.textContent = "sin sonido · toca para activarlo";
      try {
        await this.video.play();
        this.playing = true;
        this.root.classList.add("is-playing");
      } catch {
        this.root.classList.add("is-broken");
        this.badge.textContent = "este vídeo no se pudo abrir";
      }
    }
  }

  #onProgress() {
    const d = this.video.duration;
    if (!d || !Number.isFinite(d)) return;
    this.progressFill.style.transform = `scaleX(${clamp01(this.video.currentTime / d)})`;
  }

  #onEnded() {
    this.playing = false;
    this.root.classList.remove("is-playing");
    this.progressFill.style.transform = "scaleX(0)";
    this.ctx.audio.duck(1, 0); // devuelve la música a su sitio
  }

  /**
   * Al salir de la página: pausar, soltar el archivo y devolver la música.
   * Sin esto, un vídeo grande se queda en memoria y en iOS la pestaña muere.
   */
  async leave(direction) {
    await super.leave(direction);
    this.#release();
  }

  #release() {
    if (!this.video) return;
    try {
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
    } catch {
      /* nada que hacer */
    }
    this.playing = false;
    this.armed = false;
    this.root?.classList.remove("is-playing", "is-buffering");
  }

  destroy() {
    this.#release();
    this.sparkles?.destroy();
    super.destroy();
  }
}
