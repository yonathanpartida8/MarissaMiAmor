/**
 * PULSO — el corazón que late mientras la tocas.
 *
 * Una almohadilla grande abajo, donde cae el pulgar sin recolocar la mano. Con
 * el dedo puesto:
 *   · el corazón late con ritmo de verdad (lub-dub: golpe fuerte, silencio
 *     corto, golpe flojo, silencio largo), no con un pulso plano;
 *   · la línea del monitor avanza dibujándose sola;
 *   · el teléfono vibra al compás, y si no puede vibrar —los iPhone en Safari
 *     no dejan— suena un golpe grave muy bajito en su lugar. Nunca se queda
 *     sin respuesta física;
 *   · el ritmo se acelera poco a poco: empieza en reposo y se va animando.
 *
 * Al levantar el dedo no se corta: el corazón desacelera y la línea se apaga.
 *
 * Esto NO mide nada. Es una representación, y el texto lo dice.
 *
 * Todo lo que dice está en `textos.js`, al lado, y MANDA sobre lo que diga
 * el capítulo: ése es el archivo que hay que abrir para cambiar la página.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars, wait } from "../../utils/dom.js";
import { clamp, clamp01, damp } from "../../utils/math.js";
import textos from "./textos.js";

/** Cuántos latidos hay que sostener para que aparezca la frase. */
const LATIDOS_META = 8;

/** De cuánto a cuánto se acelera. */
const BPM_REPOSO = 58;
const BPM_MAXIMO = 96;

/**
 * El corazón dentro de un ciclo, de 0 a 1.
 * Dos golpes: uno fuerte al principio y otro más flojo justo después. Es lo
 * que distingue un latido de un parpadeo.
 */
function envolvente(t) {
  if (t < 0.13) return Math.sin((t / 0.13) * Math.PI) ** 0.7;        // lub
  if (t < 0.22) return 0;
  if (t < 0.34) return Math.sin(((t - 0.22) / 0.12) * Math.PI) * 0.45; // dub
  return 0;
}

export default class PulsoPage extends BasePage {
  static type = "pulse";

  build() {
    const ch = this.chapter;

    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: textos.titulo };

    this.root = el("section.page.pulse", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": textos.titulo || ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--beat": "0", "--on": "0" });

    // ── El monitor ────────────────────────────────────────────────────
    this.canvas = el("canvas.pulse__trace", { "aria-hidden": "true" });
    this.monitor = el("div.pulse__monitor", {}, [
      el("div.pulse__grid", { "aria-hidden": "true" }),
      this.canvas,
      el("div.pulse__readout", {}, [
        el("span.pulse__bpm", { text: "—" }),
        el("span.pulse__unit", { text: textos.pieDelNumero }),
      ]),
    ]);

    // ── El corazón ────────────────────────────────────────────────────
    // En SVG y no con tres cajas de CSS: con cuadrado + dos círculos se veían
    // las costuras entre las piezas porque cada una recibía su propio trozo
    // de degradado. Un solo trazado no tiene costuras y escala perfecto.
    this.heart = el("div.pulse__heart", { "aria-hidden": "true" });
    this.heart.innerHTML = `
      <span class="pulse__glow"></span>
      <svg class="pulse__shape" viewBox="0 0 32 29" aria-hidden="true">
        <defs>
          <linearGradient id="pulso-${this.id}" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%"  stop-color="var(--heart-hi)"/>
            <stop offset="52%" stop-color="var(--heart-mid)"/>
            <stop offset="100%" stop-color="var(--heart-lo)"/>
          </linearGradient>
        </defs>
        <path fill="url(#pulso-${this.id})" d="M16 28.5C6.2 21.3 0 15.4 0 8.9 0 3.9 3.8 0 8.6 0c2.9 0 5.7 1.4 7.4 3.7C17.7 1.4 20.5 0 23.4 0 28.2 0 32 3.9 32 8.9c0 6.5-6.2 12.4-16 19.6z"/>
      </svg>`;

    // ── La almohadilla ────────────────────────────────────────────────
    this.pad = el("button.pulse__pad", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Mantén el pulgar aquí para sentir el pulso",
    }, [
      el("span.pulse__halo"),
      el("span.pulse__ring"),
      el("span.pulse__ring.pulse__ring--2"),
      el("span.pulse__print"),
      el("span.pulse__hint", { text: textos.invitacion }),
    ]);

    this.sayEl = el("p.pulse__say", { "aria-live": "polite" });
    this.revealEl = el("p.pulse__reveal", { text: textos.revelacion || ch?.reveal });

    this.root.append(
      el("header.pulse__head", {}, [
        el("span.kicker", { text: textos.arriba || ch?.kicker }),
        el("h2.pulse__title", { text: textos.titulo || ch?.title }),
      ]),
      this.monitor,
      el("div.pulse__middle", {}, [this.heart]),
      el("p.pulse__text", { text: textos.texto || ch?.text }),
      this.pad,
      this.sayEl,
      this.revealEl
    );

    this.bpmEl = this.monitor.querySelector(".pulse__bpm");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.ctx2d = this.canvas.getContext("2d");
    this.holding = false;
    this.latidos = 0;
    this.fase = 0;
    this.x = 0;
    this.brillo = 0;
    this.bpm = BPM_REPOSO;
    this.golpe = 0;
    this.done = this.ctx.store.hasSecret(this.entry.secret);

    // Si el aparato no vibra (iPhone en Safari), se sustituye por un golpe
    // grave muy bajito. Es un cambio de sentido, no una función menos.
    this.puedeVibrar = this.ctx.haptics.enabled;

    this.#medir();
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));

    if (this.done) {
      this.#terminar(false);
    } else {
      this.addGestures(
        new Gestures(
          this.pad,
          {
            onDown: () => this.#poner(),
            onUp: () => this.#quitar(),
          },
          // Umbral altísimo: mover el dedo mientras se sostiene no cancela.
          { exclusive: true, threshold: 999 }
        )
      );
    }

    this.addTicker((dt, time, realDt) => this.#frame(realDt ?? dt, time), 11);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El dedo
  // ═══════════════════════════════════════════════════════════════════

  #poner() {
    if (this.done) return;
    this.holding = true;
    this.root.classList.add("is-holding");
    this.ctx.haptics.play("tap");
    this.ctx.audio.duck(0.5, 30_000);
  }

  #quitar() {
    if (!this.holding) return;
    this.holding = false;
    this.root.classList.remove("is-holding");
    this.ctx.audio.duck(1, 0);
    if (!this.finished && this.latidos > 0) this.#decir(textos.suelto);
  }

  #decir(frase) {
    if (!frase) return;
    this.sayEl.textContent = frase;
    this.sayEl.classList.remove("is-visible");
    void this.sayEl.offsetWidth;
    this.sayEl.classList.add("is-visible");
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => this.sayEl.classList.remove("is-visible"), 2400);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El latido
  // ═══════════════════════════════════════════════════════════════════

  #frame(dt, time) {
    if (!this.w) return;

    // El brillo general sube y baja con el dedo, nunca de golpe.
    this.brillo = damp(this.brillo, this.holding ? 1 : 0, 4.2, dt);

    // El ritmo se acelera mientras hay dedo y vuelve al reposo al soltar.
    const objetivo = this.holding
      ? BPM_REPOSO + (BPM_MAXIMO - BPM_REPOSO) * clamp01(this.latidos / LATIDOS_META)
      : BPM_REPOSO;
    this.bpm = damp(this.bpm, objetivo, 1.1, dt);

    // El corazón late SIEMPRE, sólo que muy flojito si no hay dedo: así la
    // página está viva desde que se llega, y el dedo la enciende.
    const anterior = this.fase;
    this.fase += (dt * this.bpm) / 60;

    const dentro = this.fase % 1;
    const fuerza = envolvente(dentro) * (0.22 + this.brillo * 0.78);
    this.golpe = damp(this.golpe, fuerza, 22, dt);

    setVars(this.root, {
      "--on": this.brillo.toFixed(3),
      "--beat": this.golpe.toFixed(3),
    });

    // Cruce de ciclo: un latido.
    if (Math.floor(this.fase) > Math.floor(anterior) && this.holding && !this.finished) {
      this.#latir();
    }

    if (this.holding && !this.done) this.#dibujar(dt);
    else if (this.brillo > 0.01) this.#apagar(dt);

    if (this.holding || this.brillo > 0.02) {
      this.bpmEl.textContent = String(Math.round(this.bpm));
    }
  }

  #latir() {
    this.latidos++;

    // Vibración al compás. El patrón imita el lub-dub: golpe, hueco, golpe.
    if (this.puedeVibrar) {
      this.ctx.haptics.play("heart");
    } else {
      // Sin vibración: un golpe grave, muy bajo, que se siente más que se oye.
      this.ctx.audio.play("turn", { volume: 0.16, rate: 0.42 });
    }

    // Un sonido bajito acompaña siempre, vibre o no.
    this.ctx.audio.play("turn", { volume: 0.07, rate: 0.6 });
    this.ctx.gl?.pulse(0.22);

    const frase = textos.latidos[this.latidos - 1];
    if (frase) this.#decir(frase);

    if (this.latidos >= LATIDOS_META) this.#terminar(true);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El monitor
  // ═══════════════════════════════════════════════════════════════════

  #medir() {
    const rect = this.monitor?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    this.x = 0;
    this.ctx2d.clearRect(0, 0, this.w, this.h);
  }

  /**
   * Forma de onda de un latido. No es un electrocardiograma de verdad, pero
   * tiene sus golpes en el sitio y se reconoce al instante, que es lo único
   * que hace falta aquí.
   */
  #onda(t) {
    if (t < 0.10) return Math.sin((t / 0.10) * Math.PI) * 0.14;   // P
    if (t < 0.16) return -((t - 0.10) / 0.06) * 0.22;             // Q
    if (t < 0.21) return -0.22 + ((t - 0.16) / 0.05) * 1.22;      // R
    if (t < 0.27) return 1.0 - ((t - 0.21) / 0.06) * 1.34;        // S
    if (t < 0.34) return -0.34 + ((t - 0.27) / 0.07) * 0.34;
    if (t < 0.52) return Math.sin(((t - 0.34) / 0.18) * Math.PI) * 0.3; // T
    return 0;
  }

  #dibujar(dt) {
    const ctx = this.ctx2d;
    // La aguja avanza a la velocidad del ritmo: tres ciclos por pantalla.
    const avance = ((this.w / (60 / this.bpm)) / 3) * dt;
    const medio = this.h * 0.5;
    const amp = this.h * 0.3;
    const pasos = Math.max(1, Math.ceil(avance));

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.palette.a;
    ctx.shadowColor = this.palette.a;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let i = 0; i < pasos; i++) {
      const x = this.x + (avance * i) / pasos;
      const t = ((x / this.w) * 3) % 1;
      const y = medio - this.#onda(t) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.x += avance;
    if (this.x >= this.w) {
      this.x = 0;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  /** Sin dedo, el trazo se desvanece en vez de borrarse de golpe. */
  #apagar(dt) {
    const ctx = this.ctx2d;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.45, dt * 1.4)})`;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "source-over";
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El final
  // ═══════════════════════════════════════════════════════════════════

  async #terminar(celebrar) {
    if (this.finished) return;
    this.finished = true;
    this.done = true;
    this.root.classList.add("is-read");

    // Si ya lo hizo otro día, la página aparece directamente en su estado
    // final: con la frase puesta y la almohadilla apagada. Sin esto se quedaba
    // a medias —almohadilla encendida que no hacía nada y frase sin salir—,
    // que es la peor manera posible de volver a una página.
    if (!celebrar) {
      this.root.classList.add("is-said");
      return;
    }

    this.ctx.haptics.play("heart");
    this.ctx.gl?.pulse(1);
    this.ctx.gl?.flash(0.2);
    this.#decir("");
    await wait(360);
    this.root.classList.add("is-said");
    this.unlockSecret();
  }

  async leave(direction) {
    await super.leave(direction);
    this.ctx.audio.duck(1, 0);
  }

  destroy() {
    clearTimeout(this.sayTimer);
    this.ctx.audio?.duck(1, 0);
    super.destroy();
  }
}
