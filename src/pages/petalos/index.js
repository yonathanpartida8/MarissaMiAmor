/**
 * PETALSPAGE — deshojar la margarita.
 *
 * Ocho pétalos alrededor de un corazón. Cada uno se arranca tirando de él: se
 * desprende con la inercia que llevara el dedo, cae girando, y al caer deja
 * escrita su frase. Cuando no queda ninguno aparece la última.
 *
 * El chiste de la página es que el juego está amañado: todos los pétalos dicen
 * que sí. Ella lo descubre a la tercera o la cuarta.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, setVars, wait } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

const PULL_DISTANCE = 52; // px que hay que tirar para que ceda
const GRAVITY = 900;      // px/s² de caída

export default class PetalsPage extends BasePage {
  static type = "petals";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.paper.petals", {
      "data-page": this.id,
      "aria-label": ch?.title,
    });
    setVars(this.root, {
      "--accent": this.palette.a,
      "--drop-color": this.palette.a,
      "--accent-line": this.palette.a,
    });

    this.lines = (ch?.lines || []).slice();
    const count = Math.max(4, this.lines.length);
    const rng = seeded(`petalos-${this.id}`);

    this.flower = el("div.petals__flower");
    this.petals = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360 + rng.range(-5, 5);
      const petal = el("button.petal", {
        type: "button",
        "data-claim-drag": "",
        "aria-label": "Arranca este pétalo",
      }, [el("span.petal__body")]);

      petal.style.setProperty("--a", `${angle}deg`);
      petal.style.setProperty("--i", String(i));
      petal.style.setProperty("--tint", rng.range(0.86, 1.06).toFixed(2));

      this.flower.append(petal);
      this.petals.push({
        node: petal,
        line: this.lines[i % this.lines.length],
        angle,
        taken: false,
        x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0,
      });
    }

    this.flower.append(
      el("div.petals__core", {}, [el("span.petals__heart")])
    );

    this.said = el("p.petals__said", { "aria-live": "polite" });
    this.counter = el("span.petals__count", { text: `${count}` });
    this.sparkles = createSparkles(this.ctx, { seed: `pet-${this.id}`, kind: "hearts", scale: 0.5 });

    this.root.append(
      el("header.petals__head", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.petals__title", { text: ch?.title || "" }),
      ]),
      el("div.petals__field", {}, [this.flower]),
      el("footer.petals__foot", {}, [
        this.said,
        el("span.petals__left", {}, [this.counter, el("i", { text: " que quedan" })]),
      ]),
      this.sparkles.node
    );

    this.intro = ch?.text || "";
    this.reveal = ch?.reveal || "";
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.said.textContent = this.intro;
    this.remaining = this.petals.length;
    this.finished = false;

    for (const petal of this.petals) this.#bind(petal);

    this.fieldHeight = 0;
    // Si gira el teléfono, el suelo cambia de sitio: se vuelve a medir, pero
    // sólo entonces, no en cada frame.
    this.track(this.ctx.viewport.on("resize", () => (this.fieldHeight = 0)));

    this.addTicker((dt) => this.#physics(dt), 11);
  }

  #bind(petal) {
    let start = null;

    this.addGestures(
      new Gestures(
        petal.node,
        {
          onPanStart: () => {
            if (petal.taken) return;
            start = { x: 0, y: 0 };
            petal.node.classList.add("is-pulling");
            this.ctx.haptics.play("tick");
          },
          onPan: (e) => {
            if (petal.taken || !start) return;
            const dist = Math.hypot(e.dx, e.dy);
            // Tira con resistencia: el pétalo se estira antes de ceder.
            const give = Math.min(1, dist / PULL_DISTANCE);
            setVars(petal.node, {
              "--pull": give.toFixed(3),
              "--px": `${e.dx * 0.4}px`,
              "--py": `${e.dy * 0.4}px`,
            });
            if (dist >= PULL_DISTANCE) this.#pluck(petal, e);
          },
          onPanEnd: () => {
            if (petal.taken) return;
            petal.node.classList.remove("is-pulling");
            setVars(petal.node, { "--pull": "0", "--px": "0px", "--py": "0px" });
          },
          onTap: (e) => {
            // Tocarlo también sirve: no todo el mundo va a arrastrar.
            if (!petal.taken) this.#pluck(petal, { vx: 0.18, vy: -0.1, dx: 0, dy: 0 });
          },
        },
        { exclusive: true, threshold: 5 }
      )
    );
  }

  #pluck(petal, e) {
    if (petal.taken) return;
    petal.taken = true;
    this.remaining--;

    petal.node.classList.remove("is-pulling");
    petal.node.classList.add("is-taken");

    // Sale con la velocidad del gesto; si sólo lo tocó, con un empujón suave.
    petal.vx = (e.vx || 0) * 620 + (Math.random() - 0.5) * 90;
    petal.vy = (e.vy || 0) * 620 - 180;
    petal.vrot = (Math.random() - 0.5) * 420;

    this.ctx.haptics.play("reveal");
    this.ctx.audio.play("turn", { volume: 0.2, rate: 1.7 + Math.random() * 0.3 });

    this.#say(petal.line);
    this.counter.textContent = String(this.remaining);

    if (this.remaining <= 0) this.#finish();
  }

  /** Cambia la frase de abajo con un relevo suave. */
  #say(text) {
    if (!text) return;
    this.said.classList.remove("is-in");
    void this.said.offsetWidth;
    this.said.textContent = text;
    this.said.classList.add("is-in");
  }

  async #finish() {
    if (this.finished) return;
    this.finished = true;
    this.root.classList.add("is-bare");

    await wait(700);
    this.#say(this.reveal || "Siempre sale lo mismo.");
    this.root.classList.add("is-finished");
    this.ctx.haptics.play("heart");
    this.ctx.gl?.pulse(0.8);
    this.ctx.gl?.flash(0.25);
    this.unlockSecret();
  }

  /** Caída de los pétalos arrancados. */
  #physics(dt) {
    // La altura se mide una vez y se guarda. Leerla en cada frame obliga al
    // navegador a recalcular el layout justo en mitad de la animación, que es
    // exactamente lo que produce los tirones.
    const height = this.fieldHeight || (this.fieldHeight = this.root.clientHeight || 800);
    let moving = false;

    for (const petal of this.petals) {
      if (!petal.taken || petal.landed) continue;
      moving = true;

      petal.vy += GRAVITY * dt;
      // Resistencia del aire: los pétalos no caen como piedras.
      petal.vx *= Math.exp(-1.1 * dt);
      petal.vy *= Math.exp(-0.35 * dt);

      petal.x += petal.vx * dt;
      petal.y += petal.vy * dt;
      petal.rot += petal.vrot * dt;
      petal.vrot *= Math.exp(-0.9 * dt);

      // Aleteo lateral mientras cae.
      petal.x += Math.sin(petal.y * 0.02) * 26 * dt;

      setVars(petal.node, {
        "--fx": `${petal.x.toFixed(1)}px`,
        "--fy": `${petal.y.toFixed(1)}px`,
        "--fr": `${petal.rot.toFixed(1)}deg`,
      });

      if (petal.y > height) {
        petal.landed = true;
        petal.node.style.display = "none"; // fuera del árbol de composición
      }
    }

    return moving;
  }

  destroy() {
    this.sparkles?.destroy();
    super.destroy();
  }
}
