/**
 * COMBINACIÓN — un candado de verdad.
 *
 * Un cuerpo de metal con su arco arriba y cuatro ruedas engastadas. Se giran
 * con el dedo, con topes que se notan uno a uno. Cada rueda que se asienta
 * hace su clic y el candado entero responde: no es un formulario, es un
 * objeto que se manipula.
 *
 * Si la combinación no es, el candado se sacude y el arco tintinea, pero no
 * pasa nada malo ni se borra lo que ya se había puesto. A los tres fallos
 * aparece la pista; a los cinco se van encendiendo los dígitos correctos; a
 * los siete el candado cede solo. Esto es un regalo, no un examen.
 *
 * Si la combinación sí es, el arco salta, se abre una luz y salen corazones.
 *
 * Lo que dice está en `textos.js`, al lado. La combinación también.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createPhotoFrame } from "../../components/PhotoFrame.js";
import { el, setVars, wait } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import escondidos from "../../data/escondidos.js";
import textos from "./textos.js";

/** Píxeles de arrastre por dígito. Menos = más nervioso. */
const PASO = 42;

/**
 * Cuánto tiene que estar todo quieto para que eso cuente como un intento.
 * Generoso a propósito: mientras siga girando ruedas está eligiendo, no
 * probando, y eso no se castiga.
 */
const ESPERA_INTENTO = 1100;

/** A partir de cuántos fallos ayuda el candado. */
const FALLOS_PISTA = 3;
const FALLOS_SOPLO = 5;
const FALLOS_RENDICION = 7;

export default class CombinacionPage extends BasePage {
  static type = "lock";

  build() {
    const ch = this.chapter;
    // La combinación puede venir del capítulo (para las páginas de él) o de
    // `textos.js` (la del libro). Siempre cuatro cifras.
    const codigo = String(textos.combinacion ?? ch?.combination).padStart(4, "0").slice(0, 4);
    this.code = codigo.split("").map(Number);

    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: textos.titulo };

    this.root = el("section.page.lock", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": textos.titulo || ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ── Las ruedas ────────────────────────────────────────────────────
    this.wheels = this.code.map((_, i) => {
      const wheel = el("div.lock__wheel", {
        "data-claim-drag": "",
        role: "spinbutton",
        "aria-label": `Rueda ${i + 1} de 4`,
        "aria-valuemin": "0",
        "aria-valuemax": "9",
        tabindex: "0",
      });
      // La tira es más alta que su ventana a propósito: es el rodillo. Va
      // marcada como decorativa porque quien no la ve ya tiene el número
      // en `aria-valuenow` de la rueda, y así nadie —ni un lector de
      // pantalla ni una revisión de recortes— la confunde con texto perdido.
      const strip = el("div.lock__strip", { "aria-hidden": "true" });
      // 0–9 repetidos tres veces: la rueda gira sin fin y sin costuras.
      for (let r = 0; r < 3; r++) {
        for (let d = 0; d < 10; d++) strip.append(el("span.lock__digit", { text: String(d) }));
      }
      wheel.append(strip, el("div.lock__gloss"), el("div.lock__notch"));
      return { node: wheel, strip, value: 0, offset: 0, target: 0, index: i, lastShown: -1 };
    });

    this.dial = el("div.lock__dial", { role: "group", "aria-label": "Combinación" },
      this.wheels.map((w) => w.node));

    // ── El candado ────────────────────────────────────────────────────
    // El arco va DETRÁS del cuerpo para que parezca metido en él.
    this.shackle = el("div.lock__shackle", { "aria-hidden": "true" }, [
      el("div.lock__arc"),
    ]);

    this.body = el("div.lock__body", {}, [
      el("div.lock__plate"),
      el("span.lock__engrave", { text: textos.grabado }),
      this.dial,
      el("div.lock__shine"),
    ]);

    this.sparks = el("div.lock__sparks", { "aria-hidden": "true" });

    this.padlock = el("div.lock__padlock", {}, [
      el("div.lock__halo", { "aria-hidden": "true" }),
      this.shackle,
      this.body,
      this.sparks,
    ]);

    // ── Lo que hay guardado dentro ────────────────────────────────────
    this.frame = createPhotoFrame(this.ctx, {
      photo: this.photos[0] || null,
      shape: "rect",
      ratio: "4 / 5",
      parallax: 0.9,
      zoomable: true,
    });

    this.proseEl = el("p.lock__text", { text: textos.texto || ch?.text });

    this.inside = el("div.lock__inside", {}, [
      el("div.lock__photo", {}, [this.frame.node]),
      el("div.lock__note.paper.paper--aged", {}, [
        el("h2.lock__title", { text: textos.titulo || ch?.title }),
        el("hr.rule"),
        el("div.lectura.lock__scroll", {}, [this.proseEl]),
        el("p.lock__reveal", { text: textos.revelacion || ch?.reveal }),
      ]),
    ]);

    this.statusEl = el("p.lock__status", { "aria-live": "polite" });

    this.root.append(
      el("span.lock__kicker", { text: textos.arriba || ch?.kicker }),
      el("div.lock__stage", {}, [this.padlock, this.inside]),
      this.statusEl
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.fallos = 0;
    this.opened = false;
    this.rng = seeded(`candado-${this.id}`);

    // Si ya lo abrió otro día, no la obligamos a repetirlo.
    if (this.ctx.store.hasSecret(this.entry.secret)) {
      this.#abrir(false);
      return;
    }

    for (const wheel of this.wheels) this.#bind(wheel);
    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Girar las ruedas
  // ═══════════════════════════════════════════════════════════════════

  #bind(wheel) {
    let desde = 0;
    let ultimoTope = 0;

    this.addGestures(
      new Gestures(
        wheel.node,
        {
          onPanStart: () => {
            desde = wheel.offset;
            ultimoTope = Math.round(wheel.offset);
            // MIENTRAS EL DEDO MANDA, EL RELOJ NO TOCA ESTA RUEDA.
            //
            // Aquí estaba el fallo que dejaba el candado inservible: el reloj
            // de la página hace `damp(offset → target)` sesenta veces por
            // segundo, y como al arrastrar sólo cambiaba `offset`, cada frame
            // lo devolvía al `target` de antes. El dedo empujaba y el reloj
            // tiraba: la rueda no se movía ni un dígito.
            wheel.dragging = true;
            wheel.node.classList.add("is-turning");
            this.padlock.classList.add("is-handled");
          },
          onPan: (e) => {
            wheel.offset = desde - e.dy / PASO;
            const tope = Math.round(wheel.offset);
            if (tope !== ultimoTope) {
              ultimoTope = tope;
              // Un tope por dígito: la rueda se siente mecánica de verdad.
              this.ctx.haptics.play("tick");
              this.ctx.audio.play("turn", { volume: 0.1, rate: 2.2 });
            }
          },
          onPanEnd: (e) => {
            wheel.dragging = false;
            wheel.node.classList.remove("is-turning");
            this.padlock.classList.remove("is-handled");
            // Se imanta al dígito más cercano. La inercia suma poco y acotada:
            // con un multiplicador alto, un giro corto y decidido se pasaba
            // siempre un dígito y la combinación era imposible de acertar.
            wheel.target = Math.round(wheel.offset + clamp(-e.vy * 0.45, -2, 2));
            this.#comprobar();
          },
          onTap: () => {
            wheel.target = Math.round(wheel.offset) + 1;
            this.ctx.haptics.play("tick");
            this.#comprobar();
          },
        },
        { axis: "y", exclusive: true, threshold: 4 }
      )
    );

    // Teclado: las flechas también giran, para quien lo abra en un portátil.
    this.on(wheel.node, "keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      wheel.target = Math.round(wheel.offset) + (e.key === "ArrowUp" ? 1 : -1);
      this.ctx.haptics.play("tick");
      this.#comprobar();
    });
  }

  #frame(dt, time) {
    if (this.opened) {
      this.frame.tick(dt, time);
      return;
    }

    for (const wheel of this.wheels) {
      // Mientras el dedo la lleva, el reloj no la toca: `offset` ya lo escribe
      // el arrastre y suavizarlo hacia `target` sería deshacerlo cada frame.
      if (!wheel.dragging) {
        // Y si ya está donde tiene que estar, no se recalcula nada: con las
        // cuatro ruedas quietas esta página deja de costar por completo.
        if (Math.abs(wheel.target - wheel.offset) < 0.0005) {
          if (wheel.offset !== wheel.target) {
            wheel.offset = wheel.target;
          } else if (wheel.value === wheel.lastShown) {
            continue;
          }
        } else {
          wheel.offset = damp(wheel.offset, wheel.target, 12, dt);
        }
      }

      // El módulo mantiene el valor en 0–9 aunque la rueda gire indefinidamente.
      wheel.value = ((Math.round(wheel.offset) % 10) + 10) % 10;

      // Cada vez que la rueda se posa en un dígito nuevo, parpadea. Es la
      // respuesta visual a cada cifra que se introduce.
      if (wheel.value !== wheel.lastShown) {
        wheel.lastShown = wheel.value;
        wheel.node.setAttribute("aria-valuenow", String(wheel.value));
        wheel.node.classList.remove("is-set");
        void wheel.node.offsetWidth;
        wheel.node.classList.add("is-set");
        this.#templar();
        if (this.soplando) this.#soplar();
        // Se comprueba aquí y no sólo al soltar el dedo: así vale igual para
        // el teclado, para la inercia que aún se está frenando y para
        // cualquier otra forma de mover una rueda.
        this.#comprobar();
      }

      // Se desplaza la tira dentro del hueco. El porcentaje es del alto de la
      // TIRA (30 dígitos), así que un dígito son 100/30 = 3,33%.
      const dentro = ((wheel.offset % 10) + 10) % 10;
      wheel.strip.style.transform = `translate3d(0, ${-((dentro + 10) * (100 / 30)).toFixed(3)}%, 0)`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Acertar y fallar
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Juzga la combinación, pero SÓLO cuando de verdad hay un intento.
   *
   * Antes se juzgaba a los 420 ms de cada dígito, y eso convertía cada cifra
   * que pasaba por delante en un fallo: girar la última rueda de 0 a 8 eran
   * ocho fallos seguidos, así que el candado llegaba a los siete y se rendía
   * solo antes de que a ella le diera tiempo a marcar nada. El juego se abría
   * a sí mismo prácticamente siempre.
   *
   * Ahora un intento es lo que parece un intento: las cuatro ruedas quietas,
   * el dedo fuera, y una combinación distinta de la última que ya se juzgó.
   */
  #comprobar() {
    if (this.opened) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // Con un dedo todavía puesto no hay nada que juzgar: sigue eligiendo.
      if (this.wheels.some((w) => w.dragging)) return this.#comprobar();

      const actual = this.wheels.map((w) => w.value);
      if (actual.every((v, i) => v === this.code[i])) return this.#abrir(true);

      // Todo a ceros es el estado de partida, no un intento… salvo que haya
      // llegado ahí a propósito, dando la vuelta entera a las cuatro ruedas.
      // Eso no es no haber empezado: eso es haber probado el 0000.
      if (!actual.some((v) => v !== 0)) {
        if (this.wheels.some((w) => Math.abs(w.target) > 0.5)) {
          this.escondite("candado-ceros", escondidos.combinacion);
        }
        return;
      }

      // Y la misma combinación dos veces tampoco: si se queda mirándola, o
      // vuelve sobre sus pasos, no se le apunta un fallo nuevo.
      const huella = actual.join("");
      if (huella === this.ultimoIntento) return;
      this.ultimoIntento = huella;

      this.#fallar();
    }, ESPERA_INTENTO);
  }

  #fallar() {
    this.fallos++;

    this.padlock.classList.remove("is-wrong");
    void this.padlock.offsetWidth;
    this.padlock.classList.add("is-wrong");
    this.ctx.haptics.play("error");
    this.ctx.audio.play("turn", { volume: 0.22, rate: 0.6 });

    const frase = textos.fallo[Math.min(this.fallos - 1, textos.fallo.length - 1)];
    this.#decir(frase);

    if (this.fallos === FALLOS_PISTA) {
      this.#decir(textos.pista || this.chapter?.combinationHint, 5200);
    } else if (this.fallos === FALLOS_SOPLO) {
      // A partir de aquí el candado ayuda: enciende las que ya están bien.
      this.soplando = true;
      this.#soplar();
      this.#decir(textos.ayuda, 5200);
    } else if (this.fallos >= FALLOS_RENDICION) {
      this.#decir(textos.rendicion, 3000);
      setTimeout(() => this.#abrir(true), 700);
    }
  }

  /**
   * El candado se templa según cuántas cifras están ya en su sitio.
   *
   * No dice cuáles —eso sería regalar el juego—, sólo quema un poco más. Es
   * la respuesta al PROCESO: se nota que te acercas antes de acertar, que es
   * lo que hace que girar ruedas sea un juego y no un formulario.
   */
  #templar() {
    const aciertos = this.wheels.reduce(
      (n, w, i) => n + (w.value === this.code[i] ? 1 : 0),
      0
    );
    // Sólo desde dos: con una sola cifra bien es casualidad pura y encenderse
    // por eso convertiría el candado en un detector de dígitos.
    const cerca = aciertos < 2 ? 0 : (aciertos - 1) / (this.code.length - 1);
    setVars(this.padlock, { "--cerca": cerca.toFixed(2) });
  }

  /** Enciende las ruedas que ya están en su sitio. */
  #soplar() {
    for (const wheel of this.wheels) {
      wheel.node.classList.toggle("is-right", wheel.value === this.code[wheel.index]);
    }
  }

  #decir(texto, ms = 2600) {
    if (!texto) return;
    this.statusEl.textContent = texto;
    this.statusEl.classList.add("is-visible");
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => this.statusEl.classList.remove("is-visible"), ms);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Abrirse
  // ═══════════════════════════════════════════════════════════════════

  /**
   * La apertura tiene tiempos, y son los que hacen que parezca que se abre
   * algo y no que cambia una clase: primero las ruedas se alinean y el metal
   * se enciende, después el arco salta, y sólo entonces sale lo de dentro.
   */
  async #abrir(celebrar) {
    if (this.opened) return;
    this.opened = true;
    clearTimeout(this.timer);
    this.soplando = false;
    for (const w of this.wheels) w.node.classList.remove("is-right");

    if (celebrar) {
      // 1. Las ruedas se colocan solas en la combinación, con su clic.
      this.wheels.forEach((w, i) => {
        const vuelta = Math.round(w.offset / 10) * 10;
        w.target = vuelta + this.code[i];
        this.later(() => this.ctx.haptics.play("tick"), 90 * i);
      });
      this.padlock.classList.add("is-aligning");
      await wait(420);

      // 2. El metal se enciende.
      this.padlock.classList.add("is-glowing");
      this.ctx.haptics.play("secret");
      this.ctx.audio.play("turn", { volume: 0.35, rate: 1.6 });
      await wait(260);

      // 3. El arco salta.
      this.padlock.classList.add("is-open");
      this.ctx.haptics.play("open");
      this.ctx.audio.play("open", { volume: 0.7 });
      this.ctx.gl?.flash(0.45);
      this.ctx.gl?.pulse(1);
      this.#chispas();
      this.#decir(textos.abierto, 1800);
      this.unlockSecret();
      await wait(520);
    } else {
      this.padlock.classList.add("is-open", "is-glowing");
    }

    // 4. El candado se aparta y sale lo que guardaba.
    this.root.classList.add("is-open");
    await wait(celebrar ? 260 : 0);
    await this.frame.load();
    this.root.classList.add("is-showing");

    if (!this.tickerOn) {
      this.tickerOn = true;
      this.addTicker((dt, time) => this.frame.tick(dt, time), 11);
    }
  }

  /** Corazones y chispas al abrirse. Pocos y buenos. */
  #chispas() {
    if (this.ctx.caps.reducedMotion) return;
    const cuantos = this.ctx.caps.tierName === "low" ? 8 : 16;

    for (let i = 0; i < cuantos; i++) {
      const corazon = i % 3 === 0;
      const chispa = el(corazon ? "span.lock__heart" : "span.lock__spark", {
        text: corazon ? "♥" : "",
      });
      const angulo = (i / cuantos) * Math.PI * 2 + this.rng.range(-0.3, 0.3);
      const dist = this.rng.range(48, 132);
      setVars(chispa, {
        "--dx": `${(Math.cos(angulo) * dist).toFixed(1)}px`,
        "--dy": `${(Math.sin(angulo) * dist - 26).toFixed(1)}px`,
        "--rot": `${this.rng.range(-160, 160).toFixed(0)}deg`,
        "--dur": `${this.rng.range(900, 1500).toFixed(0)}ms`,
        "--delay": `${this.rng.range(0, 220).toFixed(0)}ms`,
        "--size": `${this.rng.range(0.6, 1.4).toFixed(2)}`,
      });
      this.sparks.append(chispa);
    }

    // Se retiran solas: no tiene sentido dejar dieciséis nodos ahí para siempre.
    this.later(() => (this.sparks.textContent = ""), 1900);
  }

  destroy() {
    clearTimeout(this.timer);
    clearTimeout(this.sayTimer);
    this.frame?.destroy();
    super.destroy();
  }
}
