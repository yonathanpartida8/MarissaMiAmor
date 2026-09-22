/**
 * AMOR — una foto suya, a pantalla completa, como una experiencia.
 *
 * Estas páginas no las escribe nadie: salen solas de lo que él deje en
 * `images/amores/`. Una imagen, una página, al final del libro.
 *
 * Lo que hace que no sea «foto → pantalla → siguiente»:
 *   · entra desde el fondo, desenfocada, y se enfoca al llegar;
 *   · una vez ahí no se queda quieta: deriva lentísima (Ken Burns) y se
 *     mueve con la inclinación del teléfono;
 *   · un barrido de luz la cruza una sola vez, al llegar;
 *   · se puede tocar —sale un corazón donde toque—, pellizcar para acercar
 *     y tocar dos veces para ver el detalle;
 *   · al irse, se aleja: la transición de salida la lleva el router.
 *
 * Sin texto encima salvo que él quiera: eso se decide en `textos.js`.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import textos from "./textos.js";

export default class AmorPage extends BasePage {
  static type = "amor";

  /** La foto es lo único que hay: se espera a que esté antes de mostrarla. */
  get criticalAssets() {
    return this.photos.slice(0, 1).map((p) => p.src);
  }

  build() {
    const numero = this.entry.amor;
    const frase = textos.frases?.[numero];

    this.root = el("section.page.amor", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": frase || `Foto ${numero}`,
    });
    setVars(this.root, {
      "--accent": this.palette.a,
      "--px": "0px",
      "--py": "0px",
      "--zoom": "1",
      "--pan-x": "0px",
      "--pan-y": "0px",
    });

    // El fondo desenfocado rellena las bandas cuando la foto no cubre entera:
    // así nunca hay barras negras, sino la propia foto difuminada detrás.
    this.fondo = el("div.amor__fondo", { "aria-hidden": "true" });
    this.imagen = el("div.amor__img");
    // Ni grano ni viñeta propios: el libro ya pinta los suyos por encima de
    // todas las páginas (`#grain` y `#vignette`). Repetirlos aquí era pagar
    // dos capas a pantalla completa —una de ellas con mezcla— para nada.
    this.marco = el("div.amor__marco", { "data-claim-drag": "" }, [
      this.fondo,
      this.imagen,
      el("div.amor__luz", { "aria-hidden": "true" }),
    ]);

    // Ojo con el filtro: `append` nativo convierte un `null` en el TEXTO
    // "null" y lo planta en la página. Aquí sólo entra lo que existe.
    const hijos = [
      this.marco,
      el("div.amor__folio", { "aria-hidden": "true" }, [
        el("span.amor__num", { text: String(numero).padStart(2, "0") }),
        el("span.amor__de", { text: `de ${this.entry.total ?? "—"}` }),
      ]),
      frase ? el("p.amor__frase", { text: frase }) : null,
    ];
    this.root.append(...hijos.filter(Boolean));

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    this.rng = seeded(`amor-${this.id}`);
    this.px = 0;
    this.py = 0;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.panX = 0;
    this.panY = 0;
    this.deriva = 0;

    const src = this.photos[0]?.src;
    if (src) {
      const img = await this.ctx.assets.load(src).catch(() => null);
      if (img) {
        this.imagen.style.backgroundImage = `url("${src}")`;
        this.fondo.style.backgroundImage = `url("${src}")`;
      } else {
        this.root.classList.add("is-broken");
        console.warn(`[amores] no se pudo cargar "${src}"`);
      }
    }

    // Tres tiempos, como el revelado de una foto: llega, se enfoca, respira.
    requestAnimationFrame(() => this.root.classList.add("is-in"));
    this.later(() => this.root.classList.add("is-sharp"), 260);
    this.later(() => this.root.classList.add("is-alive"), 900);

    this.#gestos();
    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  #gestos() {
    this.addGestures(
      new Gestures(
        this.marco,
        {
          // El corazón sale al POSAR el dedo, no al soltarlo: cuando hay
          // doble toque, `onTap` espera 280 ms por si llega el segundo, y ese
          // retraso se nota muchísimo. Así responde en el mismo fotograma.
          onDown: (e) => {
            this.corazon(e.x, e.y);
            this.ctx.haptics.play("tap");
          },
          // Dos toques acercan y alejan.
          onDoubleTap: () => {
            this.zoomTarget = this.zoomTarget > 1.2 ? 1 : 2.1;
            if (this.zoomTarget === 1) this.panX = this.panY = 0;
            this.root.classList.toggle("is-zoomed", this.zoomTarget > 1.2);
            this.ctx.haptics.play("tap");
            this.ctx.audio.play("turn", { volume: 0.14, rate: 1.8 });
          },
          onPinch: ({ scale }) => {
            this.zoomTarget = clamp(scale, 1, 3.2);
            this.root.classList.toggle("is-zoomed", this.zoomTarget > 1.2);
          },
          onPinchEnd: () => {
            if (this.zoomTarget < 1.15) {
              this.zoomTarget = 1;
              this.panX = this.panY = 0;
              this.root.classList.remove("is-zoomed");
            }
            this.ctx.haptics.play("tick");
          },
          // Con la foto acercada, el arrastre la recorre en vez de pasar página.
          onPan: (e) => {
            if (this.zoomTarget <= 1.05) return;
            const limite = (this.zoom - 1) * 130;
            this.panX = clamp(this.panX + e.vx * 14, -limite, limite);
            this.panY = clamp(this.panY + e.vy * 14, -limite, limite);
          },
        },
        { pinch: true, exclusive: true, threshold: 10 }
      )
    );
  }

  #frame(dt, time) {
    const p = this.ctx.pointer.influence;

    this.px = damp(this.px, p.x, 3, dt);
    this.py = damp(this.py, p.y, 3, dt);
    this.zoom = damp(this.zoom, this.zoomTarget, 8, dt);

    // Deriva lentísima: la foto nunca está del todo quieta, pero tampoco se
    // nota que se mueve. Un ciclo completo dura casi un minuto.
    this.deriva = time * 0.08;
    const dx = Math.sin(this.deriva) * 6;
    const dy = Math.cos(this.deriva * 0.73) * 5;

    setVars(this.root, {
      "--px": `${(this.px * -11 + dx).toFixed(1)}px`,
      "--py": `${(this.py * 9 + dy).toFixed(1)}px`,
      "--zoom": this.zoom.toFixed(3),
      "--pan-x": `${this.panX.toFixed(1)}px`,
      "--pan-y": `${this.panY.toFixed(1)}px`,
      "--tilt": `${(this.px * 2.2).toFixed(2)}deg`,
    });
  }

}
