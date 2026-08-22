/**
 * AUDIOBUS — la banda sonora del libro.
 *
 * Los navegadores móviles prohíben sonar antes del primer gesto, así que todo
 * queda armado y se desbloquea con el primer toque real. La música entra con
 * un fundido lento (nada de golpes de volumen) y se silencia sola si la
 * pestaña pasa a segundo plano.
 */

import { Emitter } from "./Emitter.js";
import { clamp01 } from "../utils/math.js";

const SOURCES = {
  music: { src: "assets/audio/musica.mp3", loop: true, volume: 0.3 },
  open: { src: "assets/audio/abrir.mp3", loop: false, volume: 0.65 },
};

/** Pasar página suena tantas veces seguidas que tiene su propia reserva. */
const TURN = { src: "assets/audio/sonido.mp3", volume: 0.42, copias: 3 };

export class AudioBus extends Emitter {
  constructor(store) {
    super();
    this.store = store;
    this.unlocked = false;
    this.muted = false;
    this.tracks = new Map();
    this.#build();

    document.addEventListener("visibilitychange", () => {
      const music = this.tracks.get("music");
      if (!music) return;
      if (document.hidden) music.el.pause();
      else if (this.playingMusic && !this.muted) music.el.play().catch(() => {});
    });
  }

  #build() {
    for (const [name, cfg] of Object.entries(SOURCES)) {
      const audio = new Audio();
      audio.src = cfg.src;
      audio.loop = cfg.loop;
      audio.volume = 0;
      // La música son 5 MB: pedirla entera antes de la primera página compite
      // con las ilustraciones y retrasa la apertura del libro en datos móviles.
      // Con "none" no se toca hasta que suena, y suena en streaming.
      audio.preload = name === "music" ? "none" : "auto";
      // Silencia errores de red: el libro debe funcionar sin sonido.
      audio.addEventListener("error", () => this.tracks.delete(name));
      this.tracks.set(name, { el: audio, base: cfg.volume });
    }

    // Reserva de "pasar página", para toques rápidos encadenados.
    //
    // Antes había ADEMÁS una pista suelta llamada `turn` que no sonaba nunca
    // —`play("turn")` siempre tira de la reserva—, y encima pedida con CORS
    // mientras la reserva la pedía sin él. Entre las dos cosas, el mismo
    // archivo de cuatrocientos kilos se descargaba cuatro veces.
    //
    // Sólo la primera copia se trae el sonido; las otras dos lo encuentran
    // en la caché del navegador porque piden exactamente lo mismo.
    this.turnPool = Array.from({ length: TURN.copias }, (_, i) => {
      const a = new Audio(TURN.src);
      a.volume = 0;
      a.preload = i === 0 ? "auto" : "metadata";
      return a;
    });
    this.turnIndex = 0;
  }

  /** Debe llamarse dentro de un gesto del usuario (click/touch). */
  async unlock() {
    if (this.unlocked) return true;
    const attempts = [...this.tracks.values(), ...this.turnPool.map((el) => ({ el, base: 0 }))];
    for (const track of attempts) {
      try {
        track.el.muted = true;
        await track.el.play();
        track.el.pause();
        track.el.currentTime = 0;
        track.el.muted = false;
      } catch {
        /* seguimos: quizá otro sí arranque */
      }
    }
    this.unlocked = true;
    this.emit("unlocked");
    return true;
  }

  playingMusic = false;

  /** Efecto puntual. */
  play(name, { volume = 1, rate = 1 } = {}) {
    if (this.muted) return;

    if (name === "turn") {
      const el = this.turnPool[this.turnIndex];
      this.turnIndex = (this.turnIndex + 1) % this.turnPool.length;
      el.volume = clamp01(TURN.volume * volume);
      el.playbackRate = rate;
      el.currentTime = 0;
      el.play().catch(() => {});
      return;
    }

    const track = this.tracks.get(name);
    if (!track) return;
    track.el.volume = clamp01(track.base * volume);
    track.el.playbackRate = rate;
    try {
      track.el.currentTime = 0;
    } catch {
      /* aún cargando */
    }
    track.el.play().catch(() => {});
  }

  /** Arranca la música con fundido de entrada. */
  startMusic(fade = 3200) {
    const track = this.tracks.get("music");
    if (!track || this.muted) return;
    this.playingMusic = true;
    track.el.volume = 0;
    track.el
      .play()
      .then(() => this.#fade(track.el, track.base, fade))
      .catch(() => {
        this.playingMusic = false;
      });
    this.emit("music", true);
  }

  stopMusic(fade = 800) {
    const track = this.tracks.get("music");
    if (!track) return;
    this.playingMusic = false;
    this.#fade(track.el, 0, fade, () => track.el.pause());
    this.emit("music", false);
  }

  toggleMusic() {
    if (this.playingMusic) this.stopMusic();
    else this.startMusic(1400);
    this.store?.set("musicOn", this.playingMusic);
    return this.playingMusic;
  }

  /** Baja la música un momento (por ejemplo, al abrir una carta). */
  duck(amount = 0.4, ms = 2600) {
    const track = this.tracks.get("music");
    if (!track || !this.playingMusic) return;
    clearTimeout(this.#duckTimer);
    this.#fade(track.el, track.base * amount, 400);
    this.#duckTimer = setTimeout(() => this.#fade(track.el, track.base, 900), ms);
  }

  #duckTimer = 0;
  #fades = new WeakMap();

  #fade(el, to, ms, onDone) {
    cancelAnimationFrame(this.#fades.get(el) || 0);
    const from = el.volume;
    const start = performance.now();
    if (ms <= 0) {
      el.volume = clamp01(to);
      onDone?.();
      return;
    }
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      el.volume = clamp01(from + (to - from) * t);
      if (t < 1) this.#fades.set(el, requestAnimationFrame(step));
      else onDone?.();
    };
    this.#fades.set(el, requestAnimationFrame(step));
  }

  setMuted(muted) {
    this.muted = muted;
    for (const { el } of this.tracks.values()) el.muted = muted;
    for (const el of this.turnPool) el.muted = muted;
    this.emit("muted", muted);
  }
}
