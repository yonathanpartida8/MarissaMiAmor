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

    // Pantalla completa: sobre todo para los vídeos acostados, que en el
    // teléfono de pie se ven chiquitos.
    this.grandeBtn = el("button.vid__grande", {
      type: "button",
      "aria-label": "Ver el vídeo en pantalla completa",
      html: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    });

    this.frame = el("div.vid__frame", { "data-claim-drag": "" }, [
      el("div.vid__poster"),
      this.video,
      el("div.vid__veil"),
      this.playBtn,
      this.progress,
      el("div.vid__badge", { text: "" }),
      this.grandeBtn,
    ]);

    this.badge = this.frame.querySelector(".vid__badge");
    if (this.poster) {
      this.frame.querySelector(".vid__poster").style.backgroundImage = `url("${this.poster}")`;
    }

    this.proseEl = el("div.mine__prose.selectable");
    if (ch?.text) this.proseEl.append(splitWords(ch.text).frag);

    this.sparkles = createSparkles(this.ctx, { seed: `vid-${this.id}`, scale: 0.5 });

    this.root.append(
      el("div.mine__stage", {}, [
        this.frame,
        el("p.vid__pista", { text: "toca ⤢ para verlo en grande, o gira tu teléfono" }),
      ]),
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
      this.badge.textContent = "este navegador no pudo abrir el vídeo";
      // Plan B: abrirlo aparte, con el reproductor del propio teléfono.
      if (!this.frame.querySelector(".vid__aparte")) {
        const aparte = el("a.vid__aparte", { href: this.src, target: "_blank", rel: "noopener", text: "abrir el vídeo aparte ↗" });
        // Que el toque sea del enlace y no del reproductor de debajo.
        aparte.addEventListener("pointerdown", (e) => e.stopPropagation());
        this.frame.append(aparte);
      }
    });
    this.on(this.video, "waiting", () => this.root.classList.add("is-buffering"));
    this.on(this.video, "playing", () => this.root.classList.remove("is-buffering"));
    this.on(this.video, "ended", () => this.#onEnded());
    this.on(this.video, "timeupdate", () => this.#onProgress());
    this.on(this.video, "pause", () => {
      // Pausado, la música vuelve poquito a poco; si le da play otra vez,
      // se vuelve a apartar.
      if (!this.video.ended) this.ctx.audio.duck(0.12, 2500);
    });
    this.on(this.video, "loadedmetadata", () => {
      const secs = Math.round(this.video.duration || 0);
      if (secs) this.badge.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      // El marco toma la forma del vídeo: uno acostado no se recorta a una
      // tira vertical, se ve entero.
      const w = this.video.videoWidth, h = this.video.videoHeight;
      if (w && h) {
        this.frame.style.aspectRatio = `${w} / ${h}`;
        this.root.classList.toggle("is-acostado", w > h * 1.05);
      }
    });
    this.grandeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    this.on(this.grandeBtn, "click", (e) => {
      e.stopPropagation();
      this.#pantallaCompleta();
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
    this.#apartarMusica(); // la música se aparta mientras suena

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

  /**
   * La música del libro se aparta mientras el vídeo suene, dure lo que
   * dure: antes se apartaba un minuto fijo y en los vídeos largos volvía a
   * sonar encima. Se renueva sola mientras avanza (ver #onProgress).
   */
  #apartarMusica() {
    this.ctx.audio.duck(0.12, 30_000);
    this.apartadaEn = performance.now();
  }

  async #pantallaCompleta() {
    const v = this.video;
    this.ctx.haptics.play("tap");
    if (!this.playing) await this.#toggle();
    try {
      if (v.requestFullscreen) await v.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();   // iPhone
      else if (this.frame.webkitRequestFullscreen) this.frame.webkitRequestFullscreen();
      // En el teléfono, si el vídeo es acostado, que la pantalla gire.
      if (this.root.classList.contains("is-acostado")) screen.orientation?.lock?.("landscape").catch(() => {});
    } catch {
      /* si el navegador no deja, se sigue viendo en el libro */
    }
  }

  #onProgress() {
    if (this.playing && performance.now() - (this.apartadaEn || 0) > 15_000) this.#apartarMusica();
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
