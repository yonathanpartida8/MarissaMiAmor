/**
 * GIFTPAGE — el regalo que hay que desatar, con físicas de verdad.
 *
 *   · Del nudo cuelgan DOS COLAS del listón, hechas como cuerdas (verlet):
 *     tienen peso, se mecen solas y, al soltarlas, se balancean hasta
 *     quedarse quietas. La de la derecha es la que se agarra.
 *   · Al tirar, la cola se estira, el lazo se aprieta y se encoge, y la
 *     caja se inclina un poquito hacia el tirón.
 *   · Cuando cede, el nudo SALTA: los dos lazos salen volando con su
 *     gravedad y su giro, las colas caen, la tapa se abre con una bisagra
 *     que rebota y sale confeti que cae de verdad (papelitos que giran y
 *     planean, y algún corazón).
 *
 * Todo lo que se mueve lo mueve un solo reloj, y todo se para y se borra al
 * irse de la página: nada se queda dando vueltas.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, splitWords, setVars } from "../../utils/dom.js";
import { clamp, clamp01 } from "../../utils/math.js";

const SEGMENTOS = 9;
const GRAVEDAD = 1400; // px/s², para el listón y los lazos
const TIRON = 110; // px de más que hay que estirar para desatarlo
const COLORES = ["#ffd36e", "#ff7aa2", "#ffb3c7", "#fff4e0", "#c8a2ff", "#ff9a6b", "#8fd3ff"];

/**
 * Una cuerda de puntos (verlet) colgando de un punto fijo.
 *
 * Cada punto recuerda dónde «quiere» estar (`rx`, `ry`): una cinta de
 * regalo no cuelga como un hilo, tiene algo de cuerpo y cae en diagonal
 * hacia su lado. Ese recuerdo es un muelle flojito: se deja tirar, mecer
 * y estirar, pero vuelve a su forma.
 */
function cuerda(x, y, largo, lado) {
  const pts = [];
  for (let i = 0; i <= SEGMENTOS; i++) {
    const k = i / SEGMENTOS;
    // Sale casi horizontal del nudo y va cayendo: una curva, no una recta.
    const rx = x + lado * largo * (0.62 * Math.sin(k * 1.2));
    const ry = y + largo * (0.2 * k + 0.62 * k * k);
    pts.push({ x: rx, y: ry, px: rx, py: ry, rx, ry });
  }
  return { pts, tramo: largo / SEGMENTOS, largo };
}

export default class GiftPage extends BasePage {
  static type = "gift";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.gift", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--untie": "0", "--tapa": "0deg", "--inclina": "0deg" });

    this.proseEl = el("div.gift__prose.selectable");
    this.proseEl.append(splitWords(ch?.text || "").frag);

    // Las dos colas del listón, dibujadas encima de la caja.
    this.colaIzq = svg("path", { class: "gift__cola" });
    this.colaDer = svg("path", { class: "gift__cola gift__cola--tira" });
    this.puntaIzq = svg("path", { class: "gift__punta" });
    this.puntaDer = svg("path", { class: "gift__punta gift__punta--tira" });
    this.colas = svg("svg", { class: "gift__colas", "aria-hidden": "true" }, [
      svg("defs", {}, [
        svg("linearGradient", { id: `liston-${this.id}`, x1: "0", y1: "0", x2: "1", y2: "0" }, [
          svg("stop", { offset: "0", "stop-color": "#b98a34" }),
          svg("stop", { offset: "0.45", "stop-color": "#ffe3a3" }),
          svg("stop", { offset: "1", "stop-color": "#c9973f" }),
        ]),
      ]),
      this.colaIzq,
      this.colaDer,
      this.puntaIzq,
      this.puntaDer,
    ]);
    this.colas.style.setProperty("--liston", `url(#liston-${this.id})`);

    // Lo que se agarra: una zona invisible que va con la punta de la cola.
    this.ribbonEnd = el("button.gift__end", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Tira del listón para desatar",
    });

    this.lazoIzq = el("span.gift__loop.gift__loop--l");
    this.lazoDer = el("span.gift__loop.gift__loop--r");
    this.nudo = el("span.gift__knot");
    this.box = el("div.gift__box", {}, [
      el("div.gift__body"),
      el("div.gift__lid", {}, [el("div.gift__lidface")]),
      el("div.gift__ribbon.gift__ribbon--v"),
      el("div.gift__ribbon.gift__ribbon--h"),
      this.colas,
      el("div.gift__bow", {}, [this.lazoIzq, this.lazoDer, this.nudo]),
      this.ribbonEnd,
    ]);

    this.confeti = el("canvas.gift__confeti", { "aria-hidden": "true" });

    this.card = el("div.gift__card.paper.paper--aged", {}, [
      el("span.kicker", { text: ch?.kicker || "" }),
      el("h2.gift__title", { text: ch?.title || "" }),
      el("hr.rule"),
      el("div.lectura.gift__scroll", {}, [this.proseEl]),
      ch?.reveal ? el("p.gift__reveal", { text: ch.reveal }) : null,
    ]);

    this.head = el("header.gift__head", {}, [el("h2.gift__heading", { text: ch?.title || "" })]);

    this.root.append(
      this.head,
      el("div.gift__stage", {}, [this.box, this.confeti, this.card]),
      el("p.gift__prompt.hueco-barra", { text: "tira de la cinta" })
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    if (this.opened === undefined) this.opened = false;
    this.agarre = null;
    this.untie = 0;
    this.#medir();
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));

    this.addGestures(
      new Gestures(
        this.ribbonEnd,
        {
          onPanStart: (e) => {
            if (this.opened) return;
            this.agarre = this.#local(e.x, e.y);
            this.root.classList.add("is-tirando");
          },
          onPan: (e) => {
            if (this.opened || !this.agarre) return;
            this.agarre = this.#local(e.x, e.y);
          },
          onPanEnd: () => {
            if (this.opened) return;
            this.agarre = null;
            this.root.classList.remove("is-tirando");
            this.ctx.haptics.play("tick");
          },
          onTap: () => {
            if (this.opened) return;
            // Un toquecito: la cola se sacude y la caja tiembla.
            const d = this.derecha.pts[SEGMENTOS];
            d.px -= 18;
            d.py += 10;
            this.empujon = 1;
            this.ctx.haptics.play("tap");
            this.ctx.audio.play("turn", { volume: 0.2, rate: 0.7 });
          },
        },
        { exclusive: true, threshold: 4 }
      )
    );

    this.addTicker((dt, t) => this.#tick(Math.min(dt, 1 / 30), t));
  }

  /** De la pantalla a coordenadas de la caja. */
  #local(x, y) {
    const r = this.box.getBoundingClientRect();
    return { x: x - r.left, y: y - r.top };
  }

  #medir() {
    const r = this.box.getBoundingClientRect();
    if (!r.width) return;
    this.w = r.width;
    this.h = r.height;
    this.colas.setAttribute("viewBox", `0 0 ${this.w.toFixed(1)} ${this.h.toFixed(1)}`);
    // El nudo, donde lo dibuja el CSS (arriba, en el centro del lazo).
    this.nudoPos = { x: this.w * 0.5, y: this.h * 0.2 };
    if (!this.derecha || !this.opened) {
      this.izquierda = cuerda(this.nudoPos.x, this.nudoPos.y, this.h * 0.5, -1);
      this.derecha = cuerda(this.nudoPos.x, this.nudoPos.y, this.h * 0.62, 1);
    }
    this.colas.style.setProperty("--ancho", `${(this.w * 0.075).toFixed(1)}px`);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = this.confeti.getBoundingClientRect();
    this.confeti.width = Math.round(s.width * dpr);
    this.confeti.height = Math.round(s.height * dpr);
    this.c2d = this.confeti.getContext("2d");
    this.c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cw = s.width;
    this.ch = s.height;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El reloj
  // ═══════════════════════════════════════════════════════════════════

  #tick(dt, t) {
    if (!this.w) return;
    // Un aire muy suave que mece las colas mientras nadie las toca.
    const brisa = Math.sin(t * 1.3) * 30 + Math.sin(t * 2.9) * 12;
    for (const [c, lado] of [[this.izquierda, -1], [this.derecha, 1]]) {
      const suelto = this.opened;
      this.#verlet(c, dt, brisa * lado, c === this.derecha && !suelto ? this.agarre : null, !suelto);
    }

    if (!this.opened) {
      // Cuánto se está estirando la cola de la derecha, más allá de su largo.
      const fin = this.derecha.pts[SEGMENTOS];
      const estirado = Math.hypot(fin.x - this.nudoPos.x, fin.y - this.nudoPos.y) - this.derecha.largo * 0.98;
      const objetivo = this.agarre ? clamp01(estirado / TIRON) : 0;
      this.untie += (objetivo - this.untie) * (1 - Math.exp(-14 * dt));
      // La caja se inclina un poco hacia el tirón, y tiembla si se la toca.
      this.empujon = (this.empujon || 0) * Math.exp(-6 * dt);
      const inclina = clamp((fin.x - this.nudoPos.x) / this.w, -1, 1) * this.untie * 6 + Math.sin(t * 38) * this.empujon * 2.2;
      setVars(this.root, { "--untie": this.untie.toFixed(3), "--inclina": `${inclina.toFixed(2)}deg` });
      if (this.agarre && Math.random() < 0.25) this.ctx.haptics.scrub(this.untie * 0.8);
      if (this.untie > 0.97 && this.agarre) this.#abrir();
    } else {
      this.#pasoLazos(dt);
      this.#pasoTapa(dt);
    }

    this.#pintarColas();
    this.#pasoConfeti(dt, t);

    // La zona que se agarra, siempre sobre la punta.
    const p = this.derecha.pts[SEGMENTOS];
    setVars(this.ribbonEnd, { "--ex": `${p.x.toFixed(1)}px`, "--ey": `${p.y.toFixed(1)}px` });
  }

  /** Un paso de la cuerda: inercia, gravedad, y que no se estire (mucho). */
  #verlet(c, dt, viento, agarre, atada) {
    const pts = c.pts;
    const dt2 = dt * dt;
    // Atada, la cinta tiene cuerpo (vuelve a su forma y pesa poco); suelta,
    // es sólo tela que cae.
    const memoria = atada ? 60 : 0;
    const peso = atada ? GRAVEDAD * 0.25 : GRAVEDAD;
    for (let i = atada ? 1 : 0; i < pts.length; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.975;
      const vy = (p.y - p.py) * 0.975;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + (viento + (p.rx - p.x) * memoria) * dt2;
      p.y += vy + (peso + (p.ry - p.y) * memoria) * dt2;
    }
    if (atada) {
      pts[0].x = this.nudoPos.x;
      pts[0].y = this.nudoPos.y;
    }
    const fin = pts[pts.length - 1];
    if (agarre) {
      fin.x = agarre.x;
      fin.y = agarre.y;
    }
    // Al tirar, el listón cede un poco (es tela): el tramo se alarga.
    const tramo = c.tramo * (agarre ? 1 + this.untie * 0.12 : 1);
    for (let k = 0; k < 7; k++) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const dif = (d - tramo) / d;
        const primeroFijo = i === 0 && atada;
        const ultimoFijo = i + 1 === pts.length - 1 && agarre;
        if (primeroFijo && ultimoFijo) continue;
        if (primeroFijo) {
          b.x -= dx * dif;
          b.y -= dy * dif;
        } else if (ultimoFijo) {
          a.x += dx * dif;
          a.y += dy * dif;
        } else {
          a.x += dx * dif * 0.5;
          a.y += dy * dif * 0.5;
          b.x -= dx * dif * 0.5;
          b.y -= dy * dif * 0.5;
        }
      }
    }
  }

  #pintarColas() {
    const trazo = (pts) => {
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
      }
      const u = pts[pts.length - 1];
      return `${d} L${u.x.toFixed(1)},${u.y.toFixed(1)}`;
    };
    // La punta, cortada en cola de golondrina, orientada con el último tramo.
    const punta = (pts) => {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const an = this.w * 0.0375;
      const la = an * 1.6;
      const cx = Math.cos(ang);
      const cy = Math.sin(ang);
      const nx = -cy;
      const ny = cx;
      const p = (u, v) => `${(b.x + cx * u + nx * v).toFixed(1)},${(b.y + cy * u + ny * v).toFixed(1)}`;
      return `M${p(-2, -an)} L${p(la, -an)} L${p(la * 0.45, 0)} L${p(la, an)} L${p(-2, an)}Z`;
    };
    this.colaIzq.setAttribute("d", trazo(this.izquierda.pts));
    this.colaDer.setAttribute("d", trazo(this.derecha.pts));
    this.puntaIzq.setAttribute("d", punta(this.izquierda.pts));
    this.puntaDer.setAttribute("d", punta(this.derecha.pts));
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Se abre
  // ═══════════════════════════════════════════════════════════════════

  #abrir() {
    if (this.opened) return;
    this.opened = true;
    this.agarre = null;

    this.ctx.haptics.play("open");
    this.ctx.audio.play("open", { volume: 0.7 });
    this.ctx.gl?.pulse(1);
    this.root.classList.remove("is-tirando");
    this.root.classList.add("is-untied");

    // Los lazos salen disparados, cada uno para su lado.
    const lazo = (nodo, lado) => ({ nodo, x: 0, y: 0, vx: lado * (220 + Math.random() * 120), vy: -520 - Math.random() * 160, r: 0, vr: lado * (420 + Math.random() * 300) });
    this.lazos = [lazo(this.lazoIzq, -1), lazo(this.lazoDer, 1), lazo(this.nudo, Math.random() < 0.5 ? -0.3 : 0.3)];
    // Las colas se sueltan del nudo: caen con un empujoncito.
    for (const c of [this.izquierda, this.derecha]) for (const p of c.pts) p.py = p.y + 6;

    // La tapa: una bisagra con muelle que se pasa y rebota.
    this.tapa = 0;
    this.tapaV = -900;
    this.later(() => {
      this.root.classList.add("is-lifting");
      this.#confeti();
      this.ctx.gl?.flash(0.5);
    }, 260);
    // La tarjeta sale cuando ya se vio volar el lazo y rebotar la tapa.
    this.later(() => {
      this.root.classList.add("is-open");
      this.proseEl.classList.add("is-writing");
      this.ctx.haptics.play("heart");
      this.unlockSecret();
    }, 1750);
  }

  #pasoLazos(dt) {
    for (const l of this.lazos || []) {
      l.vy += GRAVEDAD * dt;
      l.vx *= Math.exp(-0.6 * dt);
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.r += l.vr * dt;
      setVars(l.nodo, { "--vx": `${l.x.toFixed(1)}px`, "--vy": `${l.y.toFixed(1)}px`, "--vr": `${l.r.toFixed(0)}deg` });
    }
  }

  #pasoTapa(dt) {
    if (this.tapa === undefined) return;
    // Muelle hacia -112° (abierta), con poca amortiguación: rebota.
    const fuerza = (-112 - this.tapa) * 90 - this.tapaV * 7;
    this.tapaV += fuerza * dt;
    this.tapa += this.tapaV * dt;
    setVars(this.root, { "--tapa": `${this.tapa.toFixed(1)}deg` });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Confeti
  // ═══════════════════════════════════════════════════════════════════

  #confeti() {
    const r = this.box.getBoundingClientRect();
    const s = this.confeti.getBoundingClientRect();
    const ox = r.left - s.left + r.width / 2;
    const oy = r.top - s.top + r.height * 0.3;
    const n = this.ctx.caps.tierName === "low" ? 40 : this.ctx.caps.tierName === "mid" ? 80 : 130;
    this.papelitos = Array.from({ length: n }, () => {
      const ang = (-90 + (Math.random() - 0.5) * 110) * (Math.PI / 180);
      const v = 380 + Math.random() * 520;
      return {
        x: ox + (Math.random() - 0.5) * r.width * 0.4,
        y: oy,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        fase: Math.random() * 6.28,
        color: COLORES[(Math.random() * COLORES.length) | 0],
        corazon: Math.random() < 0.16,
        vida: 3.2 + Math.random() * 1.6,
      };
    });
  }

  #pasoConfeti(dt, t) {
    const c = this.c2d;
    if (!c) return;
    if (!this.papelitos?.length) {
      if (this.habiaConfeti) {
        c.clearRect(0, 0, this.cw, this.ch);
        this.habiaConfeti = false;
      }
      return;
    }
    this.habiaConfeti = true;
    c.clearRect(0, 0, this.cw, this.ch);
    const vivos = [];
    for (const p of this.papelitos) {
      p.vida -= dt;
      if (p.vida <= 0 || p.y > this.ch + 30) continue;
      // Gravedad, y el aire: frena y hace planear (más cuanto más cae).
      p.vy += 900 * dt;
      p.vx *= Math.exp(-1.8 * dt);
      p.vy *= Math.exp(-(p.vy > 0 ? 2.6 : 0.8) * dt);
      p.x += (p.vx + Math.sin(t * 5 + p.fase) * 40) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const giroVisible = Math.cos(t * 7 + p.fase); // el papel da vueltas: se ve de canto
      c.save();
      c.globalAlpha = Math.min(1, p.vida / 0.8);
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      if (p.corazon) {
        c.scale(0.9, 0.9);
        c.beginPath();
        c.moveTo(0, 4);
        c.bezierCurveTo(-7, -1, -4, -7, 0, -3);
        c.bezierCurveTo(4, -7, 7, -1, 0, 4);
        c.fill();
      } else {
        c.scale(1, Math.max(0.12, Math.abs(giroVisible)));
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      c.restore();
      vivos.push(p);
    }
    this.papelitos = vivos;
  }
}
