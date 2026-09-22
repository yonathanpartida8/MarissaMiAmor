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
import { clamp01, damp } from "../../utils/math.js";
import escondidos from "../../data/escondidos.js";
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

    // ── El círculo, que ES el corazón ─────────────────────────────────
    //
    // Antes eran dos cosas separadas: un corazón a media página y, trescientos
    // píxeles más abajo, un círculo que tocar. Con el pulgar puesto abajo, el
    // latido pasaba lejísimos de donde estaba el dedo y la página parecía no
    // responder al contacto. Ahora late lo que tocas, debajo del dedo.
    //
    // El corazón va en SVG y no con tres cajas de CSS: con cuadrado + dos
    // círculos se veían las costuras entre las piezas porque cada una recibía
    // su propio trozo de degradado. Un solo trazado no tiene costuras.
    this.pad = el("button.pulse__pad", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Mantén el pulgar aquí para sentir el pulso",
    });
    this.pad.innerHTML = `
      <span class="pulse__aura" aria-hidden="true"></span>
      <span class="pulse__disc" aria-hidden="true"></span>
      <svg class="pulse__shape" viewBox="0 0 32 29" aria-hidden="true">
        <defs>
          <linearGradient id="pulso-${this.id}" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%"  stop-color="var(--heart-hi)"/>
            <stop offset="52%" stop-color="var(--heart-mid)"/>
            <stop offset="100%" stop-color="var(--heart-lo)"/>
          </linearGradient>
        </defs>
        <path fill="url(#pulso-${this.id})" d="M16 28.5C6.2 21.3 0 15.4 0 8.9 0 3.9 3.8 0 8.6 0c2.9 0 5.7 1.4 7.4 3.7C17.7 1.4 20.5 0 23.4 0 28.2 0 32 3.9 32 8.9c0 6.5-6.2 12.4-16 19.6z"/>
      </svg>
      <svg class="pulse__shape pulse__shape--dos" viewBox="0 0 32 29" aria-hidden="true">
        <path fill="url(#pulso-${this.id})" d="M16 28.5C6.2 21.3 0 15.4 0 8.9 0 3.9 3.8 0 8.6 0c2.9 0 5.7 1.4 7.4 3.7C17.7 1.4 20.5 0 23.4 0 28.2 0 32 3.9 32 8.9c0 6.5-6.2 12.4-16 19.6z"/>
      </svg>
      <span class="pulse__hint">${textos.invitacion}</span>`;

    // Tres anillos que se reciclan: en cada latido se relanza el siguiente.
    // Van sincronizados con el corazón de verdad, no a un compás propio —que
    // era lo que hacía que el ritmo no se leyera como un ritmo.
    this.ondas = [0, 1, 2].map(() => el("span.pulse__onda", { "aria-hidden": "true" }));
    this.siguienteOnda = 0;

    this.core = el("div.pulse__core", {}, [...this.ondas, this.pad]);

    this.sayEl = el("p.pulse__say", { "aria-live": "polite" });
    this.revealEl = el("p.pulse__reveal", { text: textos.revelacion || ch?.reveal });

    this.root.append(
      el("header.pulse__head", {}, [
        el("span.kicker", { text: textos.arriba || ch?.kicker }),
        el("h2.pulse__title", { text: textos.titulo || ch?.title }),
      ]),
      this.monitor,
      el("p.pulse__text", { text: textos.texto || ch?.text }),
      this.core,
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
    this.ciclo = 1;
    this.x = 0;
    this.brillo = 0;
    this.bpm = BPM_REPOSO;
    this.golpe = 0;
    this.dormido = true;

    // Si el aparato no vibra (iPhone en Safari), se sustituye por un golpe
    // grave muy bajito. Es un cambio de sentido, no una función menos.
    this.puedeVibrar = this.ctx.haptics.enabled;

    this.#medir();
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));

    // EL PULSO SE PUEDE SENTIR SIEMPRE.
    //
    // Antes, en cuanto la frase aparecía una vez, la página se marcaba como
    // hecha y ni siquiera se enganchaban los gestos: al volver, la
    // almohadilla estaba ahí, decía «mantén el pulgar aquí» y no pasaba
    // absolutamente nada. Justo la página que va de sentir un corazón era la
    // única que sólo funcionaba una vez.
    //
    // Ahora la frase se recuerda —eso sí es de una vez— pero el latido no:
    // se puede volver a poner el dedo las veces que quiera.
    if (this.ctx.store.hasSecret(this.entry.secret)) {
      this.finished = true;
      this.root.classList.add("is-read", "is-said");
    }

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

    this.#dosDedos();
    this.addTicker((dt, time, realDt) => this.#frame(realDt ?? dt, time), 11);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El dedo
  // ═══════════════════════════════════════════════════════════════════

  /**
   * El dedo se pone.
   *
   * El primer latido sale AHORA, no cuando al ciclo le toque. Si la fase
   * viene corriendo por su cuenta, entre poner el dedo y notar el primer
   * golpe puede pasar casi un segundo entero, y en ese segundo la página
   * parece que no ha respondido. Reiniciando la fase, el corazón arranca
   * debajo del dedo en el mismo instante en que lo apoyas.
   */
  #poner() {
    if (this.holding) return;
    this.holding = true;
    this.dormido = false;
    this.fase = 0;
    this.golpe = 0;
    this.latidos = 0;
    this.ciclo = this.#nuevoCiclo();
    this.root.classList.add("is-holding");
    this.ctx.haptics.play("tap");
    this.ctx.audio.duck(0.5, 30_000);
    this.#latir();
  }

  /**
   * Cuánto dura el próximo latido, en ciclos.
   *
   * Un corazón no es un metrónomo: entre latido y latido hay siempre una
   * variación pequeña, y es justo eso lo que distingue un pulso de verdad de
   * una animación en bucle. Un tres por ciento arriba o abajo no se ve, pero
   * se nota.
   */
  #nuevoCiclo() {
    return 1 + (Math.random() - 0.5) * 0.06;
  }

  /**
   * Escondido: dos dedos a la vez en el círculo.
   *
   * Uno es su pulso. Dos son los dos, y entonces el corazón late acompañado.
   * Se cuenta con `pointerdown` a pelo y no con el reconocedor de gestos
   * porque ése, a propósito, ignora el segundo dedo para no confundir un
   * arrastre con una pinza.
   */
  #dosDedos() {
    const dedos = new Set();
    this.on(this.pad, "pointerdown", (e) => {
      dedos.add(e.pointerId);
      if (dedos.size < 2 || this.root.classList.contains("is-dos")) return;
      this.root.classList.add("is-dos");
      this.escondite("pulso-dos-dedos", escondidos.pulso, e);
    });
    const soltar = (e) => dedos.delete(e.pointerId);
    this.on(window, "pointerup", soltar);
    this.on(window, "pointercancel", soltar);
  }

  /**
   * El dedo se va.
   *
   * No se corta en seco: el latido pierde fuerza, el trazo se desvanece y la
   * página se duerme sola cuando ya no queda nada encendido. Y la vibración
   * se para AQUÍ, en el mismo instante, sin esperar a nada.
   */
  #quitar() {
    if (!this.holding) return;
    this.holding = false;
    this.root.classList.remove("is-holding");
    this.ctx.haptics.stop();
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

  /**
   * Un frame.
   *
   * Cuando no hay dedo y el rastro ya se apagó, esto NO HACE NADA: ni avanza
   * la fase, ni escribe variables, ni dibuja, ni vibra. La página se duerme
   * de verdad. Antes el corazón latía siempre —flojito, pero latía—, así que
   * al soltar el dedo seguía escribiendo estilos y pintando en el lienzo
   * sesenta veces por segundo para nadie.
   */
  #frame(dt, time) {
    if (!this.w || this.dormido) return;

    // El brillo general sube y baja con el dedo, nunca de golpe.
    this.brillo = damp(this.brillo, this.holding ? 1 : 0, 4.2, dt);

    // El ritmo se acelera mientras hay dedo y vuelve al reposo al soltar.
    const objetivo = this.holding
      ? BPM_REPOSO + (BPM_MAXIMO - BPM_REPOSO) * clamp01(this.latidos / LATIDOS_META)
      : BPM_REPOSO;
    this.bpm = damp(this.bpm, objetivo, 1.1, dt);

    this.fase += (dt * this.bpm) / 60;

    // La envolvente se lee sobre la duración de ESTE ciclo, que no es
    // exactamente uno: de ahí sale la irregularidad de un pulso de verdad.
    const dentro = clamp01((this.fase % this.ciclo) / this.ciclo);
    const fuerza = envolvente(dentro) * (0.10 + this.brillo * 0.90);
    this.golpe = damp(this.golpe, fuerza, 22, dt);

    // `--on` sube y baja con el dedo y se queda quieto: puede vivir en la raíz,
    // porque `setVars` deja de escribirlo en cuanto se asienta.
    setVars(this.root, { "--on": this.brillo.toFixed(3) });

    // `--beat`, en cambio, no para mientras hay dedo. Las variables de CSS se
    // heredan, así que escribirlo en la raíz obligaba a recalcular el estilo
    // de las setecientas y pico cajas de la página sesenta veces por segundo
    // —era, con diferencia, la página más cara del libro—. Escrito aquí sólo
    // despierta al puñado de cosas que de verdad laten.
    const beat = this.golpe.toFixed(3);
    setVars(this.core, { "--beat": beat });
    setVars(this.bpmEl, { "--beat": beat });

    // Cruce de ciclo: un latido.
    if (this.fase >= this.ciclo) {
      this.fase -= this.ciclo;
      this.ciclo = this.#nuevoCiclo();
      if (this.holding) this.#latir();
    }

    if (this.holding) this.#dibujar(dt);
    else this.#apagar(dt);

    this.bpmEl.textContent = this.holding || this.brillo > 0.08
      ? String(Math.round(this.bpm))
      : "—";

    // Ya no queda nada encendido: se apaga del todo hasta el próximo dedo.
    if (!this.holding && this.brillo < 0.02) this.#dormir();
  }

  /**
   * Se acabó por ahora.
   *
   * Deja el lienzo limpio, el corazón quieto y las variables en cero, y a
   * partir de aquí `#frame` sale por la primera línea. Sin esto, una página
   * que ya no está haciendo nada seguía costando lo mismo que en pleno
   * latido.
   */
  #dormir() {
    this.dormido = true;
    this.brillo = 0;
    this.golpe = 0;
    this.fase = 0;
    this.ctx2d?.clearRect(0, 0, this.w, this.h);
    this.x = 0;
    setVars(this.root, { "--on": "0" });
    setVars(this.core, { "--beat": "0" });
    setVars(this.bpmEl, { "--beat": "0" });
    this.bpmEl.textContent = "—";
  }

  #latir() {
    this.latidos++;
    this.#anillo();

    // Vibración al compás. El patrón imita el lub-dub: golpe corto, hueco,
    // golpe más corto. Suave a propósito: esto tiene que sentirse como un
    // corazón debajo del dedo, no como una notificación.
    if (this.puedeVibrar) {
      this.ctx.haptics.play("heart");
    } else {
      // Sin vibración —los iPhone en Safari no la tienen— el latido se
      // sustituye por un golpe grave y muy bajo, de los que se sienten más
      // que se oyen, y por el propio corazón de la pantalla, que se hincha
      // y se encoge en el mismo instante. Nunca se queda sin respuesta.
      this.ctx.audio.play("turn", { volume: 0.16, rate: 0.42 });
    }

    // Un sonido bajito acompaña siempre, vibre o no.
    this.ctx.audio.play("turn", { volume: 0.07, rate: 0.6 });
    this.ctx.gl?.pulse(0.22);

    // Las frases del principio son de la primera vez. Quien vuelve a poner el
    // dedo lo hace por sentirlo, no por que le vuelvan a contar lo mismo.
    if (!this.finished) {
      const frase = textos.latidos[this.latidos - 1];
      if (frase) this.#decir(frase);
      if (this.latidos >= LATIDOS_META) this.#terminar();
    }
  }

  /**
   * Suelta un anillo desde el círculo, UNO POR LATIDO.
   *
   * Se reciclan tres nodos en vez de crear y tirar uno cada vez: a un latido
   * por segundo durante minutos, crear nodos sin parar es basura que el
   * navegador acaba teniendo que recoger, y se recoge justo cuando peor
   * viene, a mitad de animación.
   */
  #anillo() {
    if (this.ctx.caps.reducedMotion) return;
    const onda = this.ondas[this.siguienteOnda];
    this.siguienteOnda = (this.siguienteOnda + 1) % this.ondas.length;
    onda.classList.remove("is-out");
    void onda.offsetWidth; // relanza la animación desde el principio
    onda.classList.add("is-out");
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

  /**
   * Los ocho latidos: aparece la frase.
   *
   * Sólo pasa una vez en la vida del libro. Lo que NO hace es apagar la
   * almohadilla: el dedo sigue mandando, y el corazón sigue latiendo mientras
   * esté puesto.
   */
  async #terminar() {
    if (this.finished) return;
    this.finished = true;
    this.root.classList.add("is-read");

    this.ctx.gl?.pulse(1);
    this.ctx.gl?.flash(0.2);
    this.#decir("");
    await wait(360);
    this.root.classList.add("is-said");
    this.unlockSecret();
  }

  async leave(direction) {
    await super.leave(direction);
    // Se va la página: no puede quedarse nada corriendo detrás.
    this.#quitar();
    this.#dormir();
    this.ctx.haptics.stop();
    this.ctx.audio.duck(1, 0);
  }

  destroy() {
    clearTimeout(this.sayTimer);
    this.ctx.haptics?.stop();
    this.ctx.audio?.duck(1, 0);
    super.destroy();
  }
}
