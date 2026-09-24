/**
 * COMBINACIÓN — un candado que se abre con una fecha.
 *
 * Un cuerpo de metal con su arco arriba y tres rodillos engastados: día, mes
 * y año. Se giran con el dedo, con topes que se notan uno a uno. Cada rodillo
 * que se asienta hace su clic y el candado entero responde: no es un
 * formulario, es un objeto que se manipula.
 *
 * Si la fecha no es, el candado se sacude y el arco tintinea, pero no pasa
 * nada malo ni se borra lo que ya estaba puesto. A los pocos intentos aparece
 * una pista, y más adelante otra; y si insiste mucho, el candado le señala
 * qué rodillo ya está bien puesto.
 *
 * Lo que NO hace, nunca, bajo ninguna circunstancia: abrirse solo. Antes se
 * rendía a los siete fallos, y como cada cifra que pasaba girando contaba
 * como un fallo, se abría prácticamente siempre sin que nadie acertara nada.
 * Eso se ha ido: lo de dentro sale cuando está la fecha, y sólo entonces.
 *
 * Lo que dice está en `textos.js`, al lado. La fecha también.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createPhotoFrame } from "../../components/PhotoFrame.js";
import { el, setVars, wait, textoPlano } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import escondidos from "../../data/escondidos.js";
import textos from "./textos.js";

/** Píxeles de arrastre por posición. Menos = más nervioso. */
const PASO = 42;

/**
 * Cuánto tiene que estar todo quieto para que eso cuente como un intento.
 * Generoso a propósito: mientras siga girando rodillos está eligiendo, no
 * probando, y eso no se castiga.
 */
const ESPERA_INTENTO = 1100;

/** A partir de cuántos intentos fallidos ayuda el candado. */
const FALLOS_PISTA = 3;
const FALLOS_PISTA_DOS = 6;
const FALLOS_SOPLO = 9;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Cuántos años enseña la rueda, repartidos alrededor del de la fecha. */
const ANIOS_ANTES = 5;
const ANIOS_DESPUES = 4;

/**
 * Lee la fecha de `textos.js`. Si estuviera mal escrita, se cae a una válida
 * en vez de dejar el candado sin combinación: un candado sin combinación es
 * un candado que no se abre nunca.
 */
function leerFecha(texto) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(texto || "").trim());
  if (!m) {
    console.warn(`[candado] la fecha "${texto}" no se entiende; se espera "DD-MM-AAAA"`);
    return { dia: 1, mes: 1, anio: new Date().getFullYear() };
  }
  return {
    dia: clamp(+m[1], 1, 31),
    mes: clamp(+m[2], 1, 12),
    anio: +m[3],
  };
}

export default class CombinacionPage extends BasePage {
  static type = "lock";

  /** Lo que dice y la fecha que abre. Otra página puede traer los suyos. */
  get t() {
    return textos;
  }

  /** ¿Lo abrió ya otro día? */
  get yaAbierto() {
    return this.ctx.store.hasSecret(this.entry.secret);
  }

  /** Se apunta para siempre que se abrió. */
  marcarAbierto() {
    this.unlockSecret();
  }

  /** Lo que pasa cuando termina de abrirse. */
  alAbrir(celebrar) {}

  build() {
    const ch = this.chapter;
    const fecha = leerFecha(this.t.fecha);

    // Los tres rodillos, de izquierda a derecha. Cada uno sabe qué enseña y
    // en qué posición está lo correcto; el resto de la página no necesita
    // saber que esto es una fecha, sólo que hay tres ruedas que cuadrar.
    const anios = Array.from(
      { length: ANIOS_ANTES + ANIOS_DESPUES + 1 },
      (_, i) => String(fecha.anio - ANIOS_ANTES + i)
    );

    const RODILLOS = [
      {
        clave: "dia",
        etiqueta: "día",
        ancho: 2,
        valores: Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")),
        correcto: fecha.dia - 1,
      },
      {
        clave: "mes",
        etiqueta: "mes",
        ancho: 3,
        valores: MESES,
        correcto: fecha.mes - 1,
      },
      {
        clave: "anio",
        etiqueta: "año",
        ancho: 4,
        valores: anios,
        correcto: ANIOS_ANTES,
      },
    ];

    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: this.t.titulo };

    this.root = el("section.page.lock", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": this.t.titulo || ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ── Los rodillos ──────────────────────────────────────────────────
    this.wheels = RODILLOS.map((cfg, i) => {
      const wheel = el("div.lock__wheel", {
        "data-claim-drag": "",
        "data-rueda": cfg.clave,
        role: "spinbutton",
        "aria-label": cfg.etiqueta,
        "aria-valuemin": "1",
        "aria-valuemax": String(cfg.valores.length),
        tabindex: "0",
      });
      setVars(wheel, { "--ancho": String(cfg.ancho) });

      // La tira es más alta que su ventana a propósito: es el rodillo. Va
      // marcada como decorativa porque quien no la ve ya tiene el valor en
      // `aria-valuetext` de la rueda, y así nadie —ni un lector de pantalla
      // ni una revisión de recortes— la confunde con texto perdido.
      const strip = el("div.lock__strip", { "aria-hidden": "true" });
      // Tres vueltas de la lista: el rodillo gira sin fin y sin costuras.
      for (let v = 0; v < 3; v++) {
        for (const valor of cfg.valores) strip.append(el("span.lock__digit", { text: valor }));
      }
      setVars(strip, { "--pasos": String(cfg.valores.length) });

      wheel.append(strip, el("div.lock__gloss"), el("div.lock__notch"));

      return {
        node: wheel,
        strip,
        cfg,
        n: cfg.valores.length,
        value: 0,        // índice mostrado ahora mismo
        offset: 0,       // posición continua, la que mueve el dedo
        target: 0,       // a dónde se está imantando
        index: i,
        lastShown: -1,
      };
    });

    this.dial = el("div.lock__dial", { role: "group", "aria-label": "La fecha" },
      this.wheels.map((w) => w.node));

    // Debajo, en pequeñito, qué es cada rodillo. Sin esto el candado es un
    // acertijo de tres números sueltos; con esto se lee «día, mes, año» de
    // un vistazo y ya se sabe qué está pidiendo.
    this.pie = el("div.lock__pie", { "aria-hidden": "true" },
      RODILLOS.map((cfg) => el("span.lock__etiqueta", { text: cfg.etiqueta })));

    // ── El candado ────────────────────────────────────────────────────
    // El arco va DETRÁS del cuerpo para que parezca metido en él.
    this.shackle = el("div.lock__shackle", { "aria-hidden": "true" }, [
      el("div.lock__arc"),
    ]);

    this.body = el("div.lock__body", {}, [
      el("div.lock__plate"),
      el("span.lock__engrave", { text: this.t.grabado }),
      this.dial,
      this.pie,
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

    this.proseEl = el("p.lock__text", {}, [textoPlano(this.t.texto || ch?.text || "")]);

    this.inside = el("div.lock__inside", {}, [
      el("div.lock__photo", {}, [this.frame.node]),
      el("div.lock__note.paper.paper--aged", {}, [
        el("h2.lock__title", { text: this.t.titulo || ch?.title }),
        el("hr.rule"),
        el("div.lectura.lock__scroll", {}, [this.proseEl]),
        el("p.lock__reveal", { text: this.t.revelacion || ch?.reveal }),
      ]),
    ]);

    this.statusEl = el("p.lock__status.hueco-barra", { "aria-live": "polite" });

    this.root.append(
      el("span.lock__kicker", { text: this.t.arriba || ch?.kicker }),
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
    this.soplando = false;
    this.ultimoIntento = null;
    this.rng = seeded(`candado-${this.id}`);

    // ¿Ya lo abrió ella otro día? Entonces sigue abierto, sin volver a
    // pedirle la fecha. Es el ÚNICO camino que abre esto sin acertar, y
    // depende de que alguien acertara antes: `unlockSecret()` sólo se llama
    // en la apertura de verdad, así que recargar, tocar o volver a entrar no
    // lo abre nunca por su cuenta.
    if (this.yaAbierto) {
      this.#abrir(false);
      return;
    }

    for (const wheel of this.wheels) this.#bind(wheel);
    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Girar los rodillos
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
            // El reloj de la página hace `damp(offset → target)` sesenta veces
            // por segundo, y como al arrastrar sólo cambia `offset`, cada
            // frame lo devolvería al `target` de antes. El dedo empujaría y el
            // reloj tiraría: la rueda no se movería ni un paso.
            wheel.dragging = true;
            wheel.node.classList.add("is-turning");
            this.padlock.classList.add("is-handled");
          },
          onPan: (e) => {
            wheel.offset = desde - e.dy / PASO;
            const tope = Math.round(wheel.offset);
            if (tope !== ultimoTope) {
              ultimoTope = tope;
              // Un tope por posición: el rodillo se siente mecánico de verdad.
              this.ctx.haptics.play("tick");
              this.ctx.audio.play("turn", { volume: 0.1, rate: 2.2 });
            }
          },
          onPanEnd: () => {
            wheel.dragging = false;
            wheel.node.classList.remove("is-turning");
            this.padlock.classList.remove("is-handled");
            // SE QUEDA DONDE LO DEJASTE. Sin inercia.
            //
            // Un rodillo con inercia es precioso hasta que tienes que parar
            // en un valor exacto: medido, un giro decidido se pasaba de largo
            // un paso casi siempre —marcabas el 23 y salía el 24— y encontrar
            // la fecha se volvía cuestión de suerte. Aquí lo que importa es
            // acertar, así que el rodillo se imanta al valor más cercano al
            // sitio donde levantaste el dedo y ahí se queda.
            wheel.target = Math.round(wheel.offset);
            this.#comprobar();
          },
          onTap: () => {
            wheel.target = Math.round(wheel.target) + 1;
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
      wheel.target = Math.round(wheel.target) + (e.key === "ArrowUp" ? 1 : -1);
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
        // Y si ya está donde tiene que estar, no se recalcula nada: con los
        // tres rodillos quietos esta página deja de costar por completo.
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

      // El módulo mantiene el valor dentro de la lista aunque el rodillo gire
      // indefinidamente en cualquiera de los dos sentidos.
      wheel.value = ((Math.round(wheel.offset) % wheel.n) + wheel.n) % wheel.n;

      // Cada vez que el rodillo se posa en un valor nuevo, parpadea. Es la
      // respuesta visual a cada cosa que se elige.
      if (wheel.value !== wheel.lastShown) {
        wheel.lastShown = wheel.value;
        wheel.node.setAttribute("aria-valuenow", String(wheel.value + 1));
        wheel.node.setAttribute("aria-valuetext", wheel.cfg.valores[wheel.value]);
        wheel.node.classList.remove("is-set");
        void wheel.node.offsetWidth;
        wheel.node.classList.add("is-set");
        this.#templar();
        if (this.soplando) this.#soplar();
        // Se comprueba aquí y no sólo al soltar el dedo: así vale igual para
        // el teclado, para la inercia que aún se está frenando y para
        // cualquier otra forma de mover un rodillo.
        this.#comprobar();
      }

      // Se desplaza la tira dentro del hueco. El porcentaje es del alto de la
      // TIRA (tres vueltas), así que un paso son 100 / (3n) por ciento.
      const dentro = ((wheel.offset % wheel.n) + wheel.n) % wheel.n;
      const paso = 100 / (wheel.n * 3);
      wheel.strip.style.transform =
        `translate3d(0, ${-((dentro + wheel.n) * paso).toFixed(4)}%, 0)`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Acertar y fallar
  // ═══════════════════════════════════════════════════════════════════

  /** ¿Están los tres rodillos en su sitio? */
  get #acertada() {
    return this.wheels.every((w) => w.value === w.cfg.correcto);
  }

  /**
   * Juzga la fecha, pero SÓLO cuando de verdad hay un intento.
   *
   * Si se juzgara a cada valor que pasa por delante, girar el rodillo de los
   * días del 1 al 23 serían veintidós fallos seguidos. Un intento es lo que
   * parece un intento: los tres rodillos quietos, el dedo fuera, y una fecha
   * distinta de la última que ya se juzgó.
   */
  #comprobar() {
    if (this.opened) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // Con un dedo todavía puesto no hay nada que juzgar: sigue eligiendo.
      if (this.wheels.some((w) => w.dragging)) return this.#comprobar();

      if (this.#acertada) return this.#abrir(true);

      // La fecha de partida no es un intento: es no haber empezado… salvo
      // que haya vuelto a ella a propósito, dando la vuelta entera a los
      // tres rodillos. Eso sí es haber probado, y tiene premio.
      const enPartida = this.wheels.every((w) => w.value === 0);
      if (enPartida) {
        if (this.wheels.some((w) => Math.abs(w.target) > 0.5)) {
          this.escondite("candado-vuelta", escondidos.combinacion);
        }
        return;
      }

      // Y la misma fecha dos veces tampoco: si se queda mirándola, o vuelve
      // sobre sus pasos, no se le apunta un fallo nuevo.
      const huella = this.wheels.map((w) => w.value).join("-");
      if (huella === this.ultimoIntento) return;
      this.ultimoIntento = huella;

      this.#fallar();
    }, ESPERA_INTENTO);
  }

  /**
   * Una fecha que no es.
   *
   * El candado se sacude, suena a metal y lo dice con cariño. Lo que NO hace
   * es rendirse: por muchos intentos que lleve, esto no se abre sin la fecha.
   * Lo único que va creciendo es la ayuda.
   */
  #fallar() {
    this.fallos++;

    this.padlock.classList.remove("is-wrong");
    void this.padlock.offsetWidth;
    this.padlock.classList.add("is-wrong");
    this.ctx.haptics.play("error");
    this.ctx.audio.play("turn", { volume: 0.22, rate: 0.6 });

    const frase = this.t.fallo[Math.min(this.fallos - 1, this.t.fallo.length - 1)];
    this.#decir(frase);

    if (this.fallos === FALLOS_PISTA) {
      this.#decir(this.t.pista, 5200);
    } else if (this.fallos === FALLOS_PISTA_DOS) {
      this.#decir(this.t.pistaDos, 5200);
    } else if (this.fallos === FALLOS_SOPLO) {
      // A partir de aquí el candado señala qué rodillo ya está bien. Sigue
      // sin decir el valor de los otros dos: ayuda, no resuelve.
      this.soplando = true;
      this.#soplar();
      this.#decir(this.t.ayuda, 5200);
    }
  }

  /**
   * El candado se templa según cuántos rodillos están ya en su sitio.
   *
   * No dice cuáles —eso sería regalar el juego—, sólo quema un poco más. Es
   * la respuesta al PROCESO: se nota que te acercas antes de acertar, que es
   * lo que hace que girar rodillos sea un juego y no un formulario.
   */
  #templar() {
    const aciertos = this.wheels.reduce((n, w) => n + (w.value === w.cfg.correcto ? 1 : 0), 0);
    // Sólo desde dos: con uno solo bien es casualidad pura y encenderse por
    // eso convertiría el candado en un detector de valores.
    const cerca = aciertos < 2 ? 0 : (aciertos - 1) / (this.wheels.length - 1);
    setVars(this.padlock, { "--cerca": cerca.toFixed(2) });
  }

  /** Enciende los rodillos que ya están en su sitio. */
  #soplar() {
    for (const wheel of this.wheels) {
      wheel.node.classList.toggle("is-right", wheel.value === wheel.cfg.correcto);
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
   * algo y no que cambia una clase: primero los rodillos se asientan y el
   * metal se enciende, después el arco salta, y sólo entonces sale lo de
   * dentro.
   *
   * @param {boolean} celebrar  true = acaba de acertar. false = ya estaba
   *                            abierto de otro día y se restaura sin ruido.
   */
  async #abrir(celebrar) {
    if (this.opened) return;
    this.opened = true;
    clearTimeout(this.timer);
    this.soplando = false;
    // Se borra el rastro del último fallo: el candado que se abre no puede
    // llevar puesta todavía la marca de haberse equivocado.
    this.padlock.classList.remove("is-wrong");
    for (const w of this.wheels) w.node.classList.remove("is-right");

    if (celebrar) {
      // 1. Los rodillos se asientan en su sitio, con su clic. Ya están en la
      //    fecha buena; esto sólo remata el imantado para que el momento
      //    empiece con los tres perfectamente cuadrados.
      this.wheels.forEach((w, i) => {
        const vuelta = Math.round((w.offset - w.cfg.correcto) / w.n) * w.n;
        w.target = vuelta + w.cfg.correcto;
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
      this.#decir(this.t.abierto, 1800);
      // ÚNICO sitio donde esto se marca como abierto para siempre. Si esta
      // línea se llamara desde cualquier otro camino, el candado quedaría
      // abierto sin que nadie hubiera puesto la fecha.
      this.marcarAbierto();
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
    this.alAbrir(celebrar);
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
