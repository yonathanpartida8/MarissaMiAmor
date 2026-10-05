/*
 * LIBRITO · la música
 *
 * Una canción para todo el librito y, si una página quiere, la suya (o
 * silencio). Al cambiar se funden: la que se va baja mientras la nueva sube.
 *
 * El volumen va por Web Audio porque en iPhone `audio.volume` no hace nada
 * (siempre suena al máximo). Y nada suena hasta el primer toque: los
 * navegadores no dejan que una página empiece a sonar sola.
 */
(function (RT) {
  "use strict";

  RT.Musica = class {
    constructor() {
      this.ac = null;
      this.actual = null;   // { src, audio, gain, vol }
      this.listo = false;
      this.silencio = false;
      this.deseo = null;
      this._vis = () => {
        if (!this.actual) return;
        if (document.hidden) this.actual.audio.pause();
        else if (this.listo && !this.silencio) this.actual.audio.play().catch(() => {});
      };
      document.addEventListener("visibilitychange", this._vis);
    }

    /** Llamar dentro de un toque. */
    desbloquear() {
      if (this.listo) return;
      this.listo = true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && location.protocol !== "file:") this.ac = new AC();
      } catch (err) { this.ac = null; }
      if (this.ac && this.ac.state === "suspended") this.ac.resume().catch(() => {});
      if (this.deseo) { const d = this.deseo; this.deseo = null; this.poner(d.src, d.vol, d.bucle); }
    }

    _crear(src, bucle) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.loop = bucle !== false;
      audio.src = src;
      let gain = null;
      if (this.ac) {
        try {
          const nodo = this.ac.createMediaElementSource(audio);
          gain = this.ac.createGain();
          gain.gain.value = 0;
          nodo.connect(gain).connect(this.ac.destination);
        } catch (err) { gain = null; }
      }
      if (!gain) audio.volume = 0;
      return { src: src, audio: audio, gain: gain, vol: 0 };
    }

    _fundir(p, hasta, ms, alFin) {
      const v = this.silencio ? 0 : RT.clamp(hasta, 0, 1);
      if (p.gain) {
        const t = this.ac.currentTime;
        p.gain.gain.cancelScheduledValues(t);
        p.gain.gain.setValueAtTime(p.gain.gain.value, t);
        p.gain.gain.linearRampToValueAtTime(v, t + ms / 1000);
      } else {
        const desde = p.audio.volume, t0 = performance.now();
        clearInterval(p.reloj);
        p.reloj = setInterval(() => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          p.audio.volume = desde + (v - desde) * k;
          if (k >= 1) clearInterval(p.reloj);
        }, 40);
      }
      p.vol = hasta;
      if (alFin) setTimeout(alFin, ms + 30);
    }

    /** Lo que debería sonar ahora (src null = nada). */
    poner(src, vol, bucle) {
      vol = RT.num(vol, 0.8);
      if (!this.listo) { this.deseo = src ? { src: src, vol: vol, bucle: bucle } : null; return; }
      const act = this.actual;
      if (act && act.src === src) { act.audio.loop = bucle !== false; this._fundir(act, vol, 500); return; }
      if (act) {
        this._fundir(act, 0, 700, () => { act.audio.pause(); act.audio.removeAttribute("src"); try { act.audio.load(); } catch (err) { /* nada */ } });
        this.actual = null;
      }
      if (!src) return;
      const p = this._crear(src, bucle);
      this.actual = p;
      if (!document.hidden) p.audio.play().catch(() => {});
      this._fundir(p, vol, 900);
    }

    alternar() {
      this.silencio = !this.silencio;
      if (this.actual) {
        if (!this.silencio && this.actual.audio.paused) this.actual.audio.play().catch(() => {});
        this._fundir(this.actual, this.actual.vol, 300);
      }
      return !this.silencio;
    }

    destruir() {
      document.removeEventListener("visibilitychange", this._vis);
      if (this.actual) { this.actual.audio.pause(); this.actual.audio.removeAttribute("src"); }
      this.actual = null;
      if (this.ac) this.ac.close().catch(() => {});
    }
  };
})(window.LibritoRT = window.LibritoRT || {});
