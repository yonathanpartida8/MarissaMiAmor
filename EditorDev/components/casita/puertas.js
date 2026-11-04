/**
 * LAS PUERTAS DE LA CASA (Fase 63).
 *
 *   · Cada cuarto se ve solito: para ir a otro, tu monito camina hasta una puerta, la abre (gira de verdad, en 3D),
 *     se mete y, con una transición de iris, aparece saliendo por la puerta del otro cuarto, que luego se cierra.
 *   · Hay puertas en la pared de atrás y en las de los lados (PUERTAS en cuartos.js), y la «Puerta de la casa»
 *     del catálogo también cuenta. Al acomodar, tocas una puerta y eliges a qué cuarto lleva (o la quitas).
 *   · Para ir a un cuarto lejano se busca el camino por las puertas (de cuarto en cuarto); tu amorcito ve lo mismo.
 */
import { el } from "../ui.js";
import { CUARTOS, PUERTAS, COLOR_PUERTA, cuarto, inicioDe, PISO, H, FONDO, FRENTE, FONDO_3D, FRENTE_3D, proyectar } from "./cuartos.js";
import { ICO } from "./iconos.js";
import * as P from "./paneles.js";

export const PUERTA_T = 0.41;
const U0 = 0.16, U1 = 0.66, ALTO_LADO = 186, ANCHO_A = 96, ALTO_A = 196;
export const hondoPuerta = () => PISO + (H - PISO) * PUERTA_T;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nombre = (k) => cuarto(k).n;

export class Puertas {
  constructor(j) { this.j = j; this.ap = new Map(); this.nodos = new Map(); }

  /** Las puertas de un cuarto ahorita (con su destino). */
  de(c) {
    const j = this.j, cfg = j.cfgCuarto(c), lista = [];
    for (const s of PUERTAS[c] || []) {
      const va = cfg["p:" + s.id] ?? s.va;
      if (va && va !== c && CUARTOS.some((q) => q.k === va)) lista.push({ ...s, c, va });
    }
    for (const r of j.objs.values()) if (r.o.c === c && r.d.al === "puerta") lista.push({ id: "o:" + r.o.id, c, pared: "obj", r, va: this._vaObj(r) });
    return lista;
  }
  _vaObj(r) { const v = r.o.e?.va; return v && v !== r.o.c && CUARTOS.some((q) => q.k === v) ? v : r.o.c === "jardin" ? "sala" : "jardin"; }
  porId(id) {
    for (const c of CUARTOS) { const p = this.de(c.k).find((q) => q.id === id) || this.quitadas(c.k).find((q) => q.id === id); if (p) return p; }
    return null;
  }
  /** Dónde se para el monito para entrar (gx, y), por dónde se mete (hx, hy) y hacia dónde sale. */
  pie(p) {
    const cu = cuarto(p.c), x0 = inicioDe(p.c), yp = hondoPuerta();
    if (p.pared === "izq") return { gx: x0 + 26, y: yp, hx: x0 + 2, hy: yp, sx: 70, sy: 10, lado: -1 };
    if (p.pared === "der") return { gx: x0 + cu.w - 26, y: yp, hx: x0 + cu.w - 2, hy: yp, sx: -70, sy: 10, lado: 1 };
    if (p.pared === "obj") return { gx: p.r.gx, y: Math.min(FRENTE, p.r.o.y + 18), hx: p.r.gx, hy: p.r.o.y - 4, sx: 0, sy: 46, lado: 0 };
    return { gx: x0 + p.x, y: FONDO + 6, hx: x0 + p.x, hy: PISO + 4, sx: 0, sy: 48, lado: 0 };
  }
  /** La puerta de `desde` por la que se empieza el camino más corto hacia `hasta` (de puerta en puerta). */
  siguiente(desde, hasta) {
    if (desde === hasta) return null;
    const prev = new Map([[desde, null]]), cola = [desde];
    while (cola.length) {
      const c = cola.shift();
      for (const p of this.de(c)) {
        if (prev.has(p.va)) continue;
        prev.set(p.va, { c, p });
        if (p.va === hasta) { let k = hasta, paso = prev.get(k); while (paso.c !== desde) { k = paso.c; paso = prev.get(k); } return paso.p; }
        cola.push(p.va);
      }
    }
    return null;
  }
  /** Por cuál puerta se llega a `c` viniendo de `desde`. */
  llegada(c, desde) { const l = this.de(c); return l.find((p) => p.va === desde) || l[0] || null; }

  /* ── Dibujo ── */
  /** Las puertas de atrás (con su hoja que gira) y las zonas que se tocan de las de los lados; se rehace al cambiar algo. */
  pintar() {
    const j = this.j;
    if (!j.mundo) return;
    const vistos = new Set();
    for (const c of CUARTOS) for (const p of [...this.de(c.k), ...(j.editando ? this.quitadas(c.k) : [])]) {
      if (p.pared === "obj") continue;
      vistos.add(p.id);
      let n = this.nodos.get(p.id);
      const firma = `${p.c}|${p.va}|${p.pared}|${p.quitada ? 1 : 0}`;
      if (!n || n._firma !== firma) { n?.remove(); n = this._nodo(p); n._firma = firma; this.nodos.set(p.id, n); j.mundo.append(n); }
      n.classList.toggle("abierta", (this.ap.get(p.id) || 0) > 0.5);
      n.classList.toggle("lejos", c.k !== j.vistaCuarto);
    }
    for (const [id, n] of this.nodos) if (!vistos.has(id)) { n.remove(); this.nodos.delete(id); }
  }
  _letrero(p) { return el("b.pu-letrero", { "aria-hidden": "true", html: p.quitada ? ICO.mas : ICO[p.va] || ICO.corazon }); }
  _nodo(p) {
    const j = this.j, cu = cuarto(p.c), x0 = inicioDe(p.c), color = COLOR_PUERTA[p.c] || "#f2b1c6";
    const etiqueta = p.quitada ? "Poner una puerta aquí" : `Puerta a ${nombre(p.va)}`;
    const comun = { role: "button", tabindex: "0", "aria-label": etiqueta, title: etiqueta, dataset: { puerta: p.id } };
    if (p.pared === "atras") {
      // (Fase 64) La del patio está en la fachada de la casa (con su marco pintado): sin el muro suelto de afuera.
      const P0 = proyectar(x0 + p.x, PISO), s = cu.afuera ? 1 : P0.s, base = cu.mapa ? FONDO + 2 : cu.afuera ? PISO + 34 : PISO;
      return el("div.ca-puerta.atras" + (cu.afuera ? ".afuera" : "") + (cu.mapa ? ".fachada" : "") + (p.quitada ? ".quitada" : ""), { ...comun, style: { left: (P0.x - ANCHO_A / 2).toFixed(1) + "px", top: (base - ALTO_A).toFixed(1) + "px", "--s3": s.toFixed(3), "--hoja": color } }, [
        cu.afuera && !cu.mapa ? el("i.pu-muro") : null,
        el("i.pu-marco"), el("i.pu-hueco"), el("i.pu-hoja", {}, [el("i.pu-tablero.t1"), el("i.pu-tablero.t2"), el("i.pu-perilla")]), el("i.pu-umbral"), this._letrero(p),
      ].filter(Boolean));
    }
    // De lado: la puerta se dibuja en la cajita (con perspectiva); aquí sólo la zona que se toca y su letrerito.
    const B = FONDO_3D, F = FRENTE_3D, w = cu.w, cx = w / 2, izq = p.pared === "izq";
    const X = (u) => { const se = B + u * (F - B); return izq ? cx - se * w / 2 : cx + se * w / 2; };
    const Ye = (u) => PISO + u * (H - PISO), se0 = B + U0 * (F - B);
    const xa = Math.min(X(U0), X(U1)), xb = Math.max(X(U0), X(U1)), top = Ye(U0) - ALTO_LADO * se0, bot = Ye(U1);
    return el("div.ca-puerta.lado." + p.pared + (p.quitada ? ".quitada" : ""), { ...comun, style: { left: (x0 + xa - 6).toFixed(1) + "px", top: top.toFixed(1) + "px", width: (xb - xa + 12).toFixed(1) + "px", height: (bot - top).toFixed(1) + "px" } }, [this._letrero(p)]);
  }
  /** Qué tan abierta está la puerta de un lado del cuarto (para la cajita): 0 cerrada … 1 abierta. */
  apDe(c, pared) { const p = this.de(c).find((q) => q.pared === pared); return p ? this.ap.get(p.id) || 0 : 0; }
  colorDe(c) { return COLOR_PUERTA[c]; }
  /** Abrir o cerrar (las de atrás giran; las de lado se redibujan en 4 pasitos; la del catálogo, la suya). */
  abrir(p, on) {
    if (!p) return;
    const j = this.j, meta = on ? 1 : 0, antes = this.ap.get(p.id) || 0;
    if (p.pared === "obj") { p.r.n.classList.toggle("abierto", on); this.ap.set(p.id, meta); return; }
    if (p.pared === "atras") { this.ap.set(p.id, meta); this.nodos.get(p.id)?.classList.toggle("abierta", on); return; }
    clearInterval(this["_t" + p.id]);
    let paso = 0;
    this["_t" + p.id] = setInterval(() => {
      paso++;
      this.ap.set(p.id, antes + (meta - antes) * Math.min(1, paso / 4));
      j._caja(p.c, j.cfgCuarto(p.c), true);
      if (paso >= 4) clearInterval(this["_t" + p.id]);
    }, 60);
  }

  /* ── Cruzar ── */
  /** El monito cruza la puerta `p` (ya parado en su pie) y sigue con `luego` en el otro cuarto. */
  async cruzar(m, p, luego) {
    const j = this.j, yo = m === j.yo, tk = (m.tkPuerta = (m.tkPuerta || 0) + 1), vigente = () => m.tkPuerta === tk && j.vivo;
    const pi = this.pie(p), visto = () => j.vistaCuarto === p.c || yo;
    m._cruzando = true;
    // 1) Mira hacia la puerta y la abre.
    if (pi.lado) j._mirar(m, pi.lado); else j._orientar?.(m, "atras");
    if (visto()) { this.abrir(p, true); j.sonar("puerta-cuarto", { volumen: yo ? 0.8 : 0.45 }); await espera(300); }
    if (!vigente()) { m._cruzando = false; this.abrir(p, false); return; }
    // 2) Se mete por el hueco (se va desvaneciendo).
    if (visto()) { m.n.classList.add("entra"); m.n.style.transitionDuration = ".34s"; j._ponerMono(m, pi.hx, pi.hy, pi.hy); await espera(320); }
    // 3) Del otro lado: tu monito pasa con el iris (lo demás, de una vez).
    const dest = p.va, ll = this.llegada(dest, p.c), pl = ll ? this.pie(ll) : { gx: inicioDe(dest) + cuarto(dest).w / 2, y: FONDO + 60, hx: inicioDe(dest) + cuarto(dest).w / 2, hy: FONDO + 40, sx: 0, sy: 30 };
    if (yo) await j._iris(true, j.enPantalla(pi.hx, pi.hy - 60, Math.max(PISO, pi.hy)));
    this.abrir(p, false);
    m.n.style.transitionDuration = "0s";
    m.n.classList.add("entra");
    m.gx = pl.hx; m.y = Math.max(FONDO, Math.min(FRENTE, pl.hy));
    j._ponerMono(m, pl.hx, pl.hy, Math.max(PISO, pl.hy));
    if (yo) j._mostrarCuarto(dest, pl.gx, pl.y);
    const seVe = yo || j.vistaCuarto === dest;
    if (ll && seVe) this.abrir(ll, true);
    void m.n.offsetWidth;
    if (yo) j._iris(false, j.enPantalla(pl.hx, pl.hy - 60, Math.max(PISO, pl.hy)));
    // 4) Sale unos pasitos y la puerta se cierra detrás.
    m.n.classList.remove("entra");
    m._cruzando = false;
    if (!vigente()) { if (ll) setTimeout(() => this.abrir(ll, false), 300); return; }
    j._caminar(m, pl.gx + pl.sx * 0.4, Math.max(FONDO, Math.min(FRENTE, pl.y + pl.sy * 0.5)), () => {
      if (ll) setTimeout(() => this.abrir(ll, false), 200);
      luego?.();
    }, !seVe, true);
  }

  /* ── Tocar una puerta ── */
  tocar(id) {
    const j = this.j, p = this.porId(id);
    if (!p) return;
    if (j.editando) return this.configurar(p);
    if (p.quitada) return;
    const m = j.yo;
    m.orden++;
    j._caminarAPuerta(m, p, () => { m._enRuta = false; j._mandarYo({ accion: "", mueble: "" }); });
    // (A tu amorcito le llega que vas al otro cuarto: su monito de ti hace el mismo camino.)
    m.meta = { gx: inicioDe(p.va) + cuarto(p.va).w / 2, y: FONDO + 80 }; m._enRuta = true;
    j._mandarYo({ accion: "", mueble: "" });
  }
  /** Elegir a qué cuarto lleva una puerta (o quitarla, si el cuarto tiene otra). */
  configurar(p) {
    const j = this.j, cerrar = () => j.cerrarHoja();
    const elegir = (va) => {
      if (p.pared === "obj") j.sync.op({ o: "estado", id: p.r.o.id, e: { va } });
      else j.sync.op({ o: "cuarto", k: p.c, v: { ["p:" + p.id]: va } });
      j._pintarCasa(j.sync.casa());
      j.sonar("clic"); cerrar();
    };
    const otras = this.de(p.c).filter((q) => q.id !== p.id).length;
    const opciones = CUARTOS.filter((c) => c.k !== p.c).map((c) => el("button.ca-pu-op" + (c.k === p.va ? ".on" : ""), { type: "button", onClick: () => elegir(c.k) }, [el("i", { html: ICO[c.k] || ICO.corazon }), el("span", { text: c.n })]));
    if (p.pared !== "obj" && otras > 0) opciones.push(el("button.ca-pu-op.quitar", { type: "button", onClick: () => elegir("") }, [el("i", { html: ICO.borrar }), el("span", { text: "Sin puerta" })]));
    P.hoja(j, "¿A dónde lleva esta puerta?", el("div.ca-pu-opciones", {}, [el("p.ca-pu-ayuda", { text: p.va ? `Está en ${nombre(p.c)}. Ahorita lleva a ${nombre(p.va)}.` : `Aquí no hay puerta. Elige a dónde llevaría.` }), ...opciones]));
  }
  /** Las puertas que se quitaron, para poder volver a ponerlas (en el panel del cuarto). */
  quitadas(c) { const cfg = this.j.cfgCuarto(c); return (PUERTAS[c] || []).filter((s) => cfg["p:" + s.id] === "").map((s) => ({ ...s, c, va: "", quitada: true })); }
}
