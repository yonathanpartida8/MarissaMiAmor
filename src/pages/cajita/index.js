/**
 * CAJITA — una cajita musical que suena al girar la manivela.
 *
 * Cada cuarto de vuelta toca la nota siguiente (sonido de cajita hecho con
 * WebAudio, sin archivos). Al terminar la melodía se abre la tapa y sale la
 * frase. Easter egg: tocar tres veces a la parejita que baila y se dan un beso.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";

// Canción de cuna de Brahms (dominio público), en Hz.
const E4 = 329.6, F4 = 349.2, G4 = 392, A4 = 440, B4 = 493.9, C5 = 523.3, D4 = 293.7, D5 = 587.3;
const MELODIA = [E4, E4, G4, E4, E4, G4, E4, G4, C5, B4, A4, A4, G4, D4, E4, F4, D4, D4, E4, F4, D4, F4, B4, A4, G4, B4, C5];
const PASO = Math.PI / 2.4; // cuánto hay que girar por nota

export default class CajitaPage extends BasePage {
  static type = "cajita";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.cajita", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--giro": "0deg", "--avance": "0" });

    this.pareja = el("button.caj__pareja", { type: "button", "aria-label": "La parejita", text: "💃🕺" });
    this.manivela = el("div.caj__manivela", { "data-claim-drag": "", role: "slider", "aria-label": "Manivela" }, [
      el("span.caj__brazo"),
      el("span.caj__pomo"),
    ]);
    this.root.append(
      el("header.caj__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.caj__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.caj__mesa", {}, [
        el("div.caj__caja", {}, [
          el("div.caj__tapa"),
          el("div.caj__escenario", {}, [el("div.caj__plato", {}, [this.pareja])]),
          el("div.caj__frente", {}, [el("span.caj__barra")]),
          this.manivela,
        ]),
      ]),
      el("div.caj__pie.hueco-barra", {}, [
        el("p.caj__nota.escena__reveal", { text: ch?.reveal || "" }),
        el("p.caj__ayuda.escena__nota", { text: "gira la manivela en círculos ↻" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    this.nota = this.nota || 0;
    this.acumulado = 0;
    this.giro = 0;

    let prev = null;
    const angulo = (e) => {
      const r = this.manivela.getBoundingClientRect();
      return Math.atan2(e.y - (r.top + r.height / 2), e.x - (r.left + r.width / 2));
    };
    this.addGestures(
      new Gestures(
        this.manivela,
        {
          onPanStart: (e) => { prev = angulo(e); this.#despertarAudio(); },
          onPan: (e) => {
            const a = angulo(e);
            let d = a - prev;
            if (d > Math.PI) d -= Math.PI * 2;
            if (d < -Math.PI) d += Math.PI * 2;
            prev = a;
            this.giro += d;
            setVars(this.root, { "--giro": `${((this.giro * 180) / Math.PI).toFixed(1)}deg` });
            if (d > 0) {
              this.acumulado += d;
              while (this.acumulado >= PASO) {
                this.acumulado -= PASO;
                this.#tocar();
              }
            }
          },
          onTap: () => { this.#despertarAudio(); this.#tocar(); },
        },
        { axis: "free", exclusive: true, threshold: 2 }
      )
    );

    this.besos = 0;
    this.on(this.pareja, "click", () => {
      if (++this.besos % 3 !== 0) return;
      this.pareja.textContent = "💏";
      this.escondite("cajita-beso", "");
      const r = this.pareja.getBoundingClientRect();
      for (let k = 0; k < 4; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top, k === 1 ? "mua 💋" : ""), k * 120);
      this.later(() => (this.pareja.textContent = "💃🕺"), 2600);
    });
  }

  #despertarAudio() {
    if (!this.audio) {
      try {
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.audio = null;
      }
    }
    this.audio?.resume?.();
    this.ctx.audio?.duck?.(0.35, 5000);
  }

  #tocar() {
    const f = MELODIA[this.nota % MELODIA.length];
    this.nota++;
    setVars(this.root, { "--avance": Math.min(1, this.nota / MELODIA.length).toFixed(3) });
    // Cada nota, media vuelta: bailan al ritmo de la cajita.
    this.pareja.classList.toggle("is-vuelta");
    this.pareja.classList.remove("is-paso");
    void this.pareja.offsetWidth;
    this.pareja.classList.add("is-paso");
    this.ctx.haptics.play("tick");
    this.#campanita(f);
    if (this.nota === MELODIA.length) {
      this.root.classList.add("is-abierta");
      this.unlockSecret();
      const r = this.root.querySelector(".caj__tapa").getBoundingClientRect();
      for (let k = 0; k < 6; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2), k * 130);
    }
  }

  /** Sonido de cajita: un tono con su armónico y una caída rápida. */
  #campanita(freq) {
    const a = this.audio;
    if (!a || this.ctx.audio?.muted) return;
    const t = a.currentTime;
    const salida = a.createGain();
    salida.gain.setValueAtTime(0.0001, t);
    salida.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
    salida.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    salida.connect(a.destination);
    for (const [mult, tipo, vol] of [[2, "sine", 1], [4, "triangle", 0.25], [6.02, "sine", 0.08]]) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = tipo;
      o.frequency.value = freq * mult / 2;
      g.gain.value = vol;
      o.connect(g).connect(salida);
      o.start(t);
      o.stop(t + 1.5);
    }
  }

  destroy() {
    this.audio?.close?.().catch?.(() => {});
    super.destroy();
  }
}
