/**
 * BURBUJAS — cada burbuja que revienta suelta una palabra.
 *
 * Suben despacio y se mecen. Al tocar una, estalla y la siguiente palabra de
 * la frase aparece abajo; cuando la frase está completa, sale lo último. La
 * que revienta vuelve a nacer abajo al rato: siempre queda alguna.
 *
 * EL POP. Cada una suena al reventar, hecho aquí con WebAudio: un chasquido
 * de aire y un «blup» que cae de tono. Las grandes suenan más graves que las
 * chiquitas, y si se revientan seguidas, cada una suena un poquito más
 * aguda que la anterior (como una escala): da gusto encadenarlas. Al
 * romperse sueltan gotitas.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

const CUANTAS = 11;

export default class BurbujasPage extends BasePage {
  static type = "burbujas";

  build() {
    const ch = this.chapter;
    this.palabras = ch?.lines || [];
    this.root = el("section.page.burbujas", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--b": this.palette.b });

    this.cielo = el("div.bur__cielo", { "data-claim-drag": "" });
    this.frase = el("p.bur__frase.escena__frase", { "aria-live": "polite" });
    this.reveal = el("p.bur__reveal.escena__reveal", { text: ch?.reveal || "" });

    this.root.append(
      el("header.bur__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.bur__title.escena__title", { text: ch?.title || "" }),
      ]),
      this.cielo,
      el("div.bur__pie.hueco-barra", {}, [this.frase, this.reveal])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.dichas === undefined) this.dichas = 0;
    this.rng = seeded(`burbujas-${Date.now()}`);
    this.cielo.textContent = "";
    const medir = () => setVars(this.cielo, { "--alto": `${this.cielo.clientHeight}px` });
    medir();
    this.track(this.ctx.viewport.on("resize", medir));
    for (let i = 0; i < CUANTAS; i++) this.#nacer(i * 0.9);
  }

  #nacer(retraso = 0) {
    const r = this.rng;
    const tam = r.range(46, 84);
    const b = el("button.bur__burbuja", { type: "button", "aria-label": "Una burbuja" });
    setVars(b, {
      "--x": `${r.range(4, 96 - (tam / 4)).toFixed(1)}%`,
      "--tam": `${tam.toFixed(0)}px`,
      "--dur": `${r.range(9, 15).toFixed(1)}s`,
      "--delay": `-${(retraso + r.range(0, 8)).toFixed(1)}s`,
      "--meneo": `${r.range(10, 26).toFixed(0)}px`,
      "--tono": `${r.range(-30, 40).toFixed(0)}deg`,
    });
    b.dataset.tam = tam.toFixed(0);
    this.on(b, "pointerdown", (e) => this.#reventar(b, e), { passive: true });
    this.cielo.append(b);
  }

  #reventar(b, e) {
    if (b.classList.contains("is-rota")) return;
    b.classList.add("is-rota");
    this.#pop(Number(b.dataset.tam) || 60);
    this.#gotitas(b);
    this.ctx.haptics.play("tick");
    this.later(() => b.remove(), 420);
    this.later(() => this.active && this.#nacer(), 2200);

    if (this.dichas < this.palabras.length) {
      const palabra = el("span.bur__palabra", { text: this.palabras[this.dichas] });
      this.frase.append(palabra, " ");
      this.dichas++;
      if (this.dichas === this.palabras.length) {
        this.root.classList.add("is-completa");
        this.unlockSecret();
        for (let k = 0; k < 6; k++) this.later(() => this.corazon(e.clientX, e.clientY), k * 110);
      }
    } else {
      this.corazon(e.clientX, e.clientY);
    }
  }

  /**
   * El sonido del pop: un chasquido de aire (ruido filtrado, cortísimo) y un
   * «blup» (un tono que cae una octava en 70 ms). Seguidas en menos de un
   * segundo, cada una sube medio tono: la racha se oye.
   */
  #pop(tam) {
    const audio = this.ctx.audio;
    const salida = audio.efectos(420, 0.5);
    if (!salida) return;
    const ac = audio.ac;
    const t = ac.currentTime + 0.002;

    const ahora = performance.now();
    this.racha = ahora - (this.ultimoPop || 0) < 900 ? Math.min((this.racha || 0) + 1, 12) : 0;
    this.ultimoPop = ahora;
    const escala = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21][this.racha];
    const base = 1500 - (tam - 46) * 12; // grande → grave
    const tono = base * 2 ** (escala / 12) * (0.97 + Math.random() * 0.06);

    // El «blup».
    const osc = ac.createOscillator();
    const vol = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(tono, t);
    osc.frequency.exponentialRampToValueAtTime(tono * 0.48, t + 0.07);
    vol.gain.setValueAtTime(0.0001, t);
    vol.gain.exponentialRampToValueAtTime(0.42, t + 0.004);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(vol).connect(salida);
    osc.start(t);
    osc.stop(t + 0.14);

    // El chasquido: ruido blanco por un filtro de banda, 30 ms.
    if (!this.ruido) {
      const n = Math.floor(ac.sampleRate * 0.05);
      this.ruido = ac.createBuffer(1, n, ac.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    }
    const src = ac.createBufferSource();
    const filtro = ac.createBiquadFilter();
    const vr = ac.createGain();
    src.buffer = this.ruido;
    filtro.type = "bandpass";
    filtro.frequency.value = 2600 + Math.random() * 1600;
    filtro.Q.value = 1.4;
    vr.gain.value = 0.55;
    src.connect(filtro).connect(vr).connect(salida);
    src.start(t);
  }

  /** Unas gotitas que salen disparadas desde donde estaba la burbuja. */
  #gotitas(b) {
    if (this.ctx.caps.reducedMotion) return;
    const r = b.getBoundingClientRect();
    const c = this.cielo.getBoundingClientRect();
    const grupo = el("span.bur__estallido", { "aria-hidden": "true" });
    setVars(grupo, { "--gx": `${(r.left - c.left + r.width / 2).toFixed(0)}px`, "--gy": `${(r.top - c.top + r.height / 2).toFixed(0)}px`, "--r": `${(r.width / 2).toFixed(0)}px` });
    grupo.append(el("span.bur__aro"));
    for (let k = 0; k < 8; k++) {
      const g = el("span.bur__gota");
      setVars(g, { "--a": `${(k * 45 + Math.random() * 20).toFixed(0)}deg`, "--d": `${(r.width * (0.55 + Math.random() * 0.4)).toFixed(0)}px` });
      grupo.append(g);
    }
    this.cielo.append(grupo);
    this.later(() => grupo.remove(), 700);
  }
}
