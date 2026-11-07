/**
 * LA LUZ DE VERDAD (Fase 61): un mapa de luz por cuarto, en pixel art.
 *
 *   · Es un lienzo encima de TODO lo del cuarto (piso, paredes, muebles y monitos): de noche oscurece, y alrededor
 *     de cada lámpara prendida (y del foco del techo si la luz del cuarto está prendida) la oscuridad se abre en
 *     un charco de luz cálida, con tramado en escalones (pixel). Así la luz cae sobre las cosas y el piso de verdad,
 *     en lugar de manchas amarillas dibujadas.
 *   · Día, tarde y noche cambian suave (la opacidad del mapa pasa despacito); con la luz del cuarto apagada, más oscuro.
 *   · Las sombras de los muebles salen del lado contrario a la luz más cercana (y las del monito, igual).
 *   · Motitas de polvo que flotan en cada cuarto (de noche sólo se ven cerca de la luz).
 *   · En Máximo rendimiento se queda lo sencillo de antes.
 */
import { CUARTOS, inicioDe, cuarto, altoDe } from "./cuartos.js";
import { lucesCocina } from "./cocina.js";

const RES = 6, ARRIBA = -330, ALTO = 1130;          // un cuadrito del mapa = 6 del mundo
const OSCURO = [18, 12, 42];
const rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); const n = m ? parseInt(m[1], 16) : 0xffd68c; return [n >> 16, (n >> 8) & 255, n & 255]; };

export class Luces {
  constructor(j) { this.j = j; this.mapas = new Map(); this.claves = new Map(); }
  armar() {
    for (const c of CUARTOS) {
      const cv = document.createElement("canvas");
      cv.className = "ca-luzmapa " + c.k + (c.afuera ? " afuera" : "");
      cv.setAttribute("aria-hidden", "true");
      Object.assign(cv.style, { left: inicioDe(c.k) + "px", width: c.w + "px", top: ARRIBA + "px", height: this._alto(c.k) + "px" });
      this.j.mundo.append(cv);
      this.mapas.set(c.k, cv);
      // Motitas de polvo flotando (adentro).
      if (!c.afuera) {
        const n = this.j.cuartosN.get(c.k);
        for (let i = 0; i < 7; i++) {
          const m = document.createElement("i");
          m.className = "ca-mota";
          Object.assign(m.style, { left: (8 + Math.random() * 84).toFixed(1) + "%", top: Math.round(120 + Math.random() * 520) + "px", animationDelay: -(Math.random() * 9).toFixed(2) + "s", animationDuration: (7 + Math.random() * 6).toFixed(1) + "s" });
          n?.append(m);
        }
      }
    }
  }
  _alto(k) { return Math.max(ALTO, altoDe(k) - ARRIBA + 20); }
  /** Las luces que alumbran un cuarto ahorita (en coordenadas de donde se dibujan). */
  _fuentes(c) {
    const j = this.j, cu = cuarto(c), cfg = j.cfgCuarto(c), x0 = inicioDe(c), lista = [];
    for (const r of j.objs.values()) {
      if (!r.glow || r.o.c !== c || !r.glow.classList.contains("on")) continue;
      const b = r.d.brilla, v = r.v || { x: r.gx, y: r.o.y, s: 1 }, s = v.s;
      const x = v.x - x0 + ((r.o.f ? r.d.w - b.x : b.x) - r.d.w / 2) * s, y = v.y - (r.d.h - b.y) * s;
      // (Fase 72) Un foco del techo es LA luz del cuarto: su brillito junto al foco y un charco grande, cálido, que
      // llena todo el cuarto (paredes, muebles y piso), más fuerte debajo de él.
      if (b.cuarto) { lista.push({ x, y, r: 230, k: rgb(b.c), i: 0.9 }, { x, y: Math.max(y + 260, 360), r: 1050, k: rgb(b.c), i: 1 }); continue; }
      lista.push({ x, y, r: Math.max(150, b.r * 2.1) * s, k: rgb(b.c), i: 1 });
    }
    // (Fase 71) Ya no hay foco pintado: la luz del cuarto la dan sus focos del techo (catalogo/techo.js), cada uno
    // con su charco de luz grande. Sin focos prendidos, de noche el cuarto queda oscurito (sólo sus lámparas).
    void cfg;
    // (Fase 73) La lumbre de lo que se está cocinando (más grande al doble).
    try { lista.push(...lucesCocina(j, c, x0)); } catch (e) { /* nada */ }
    // (Fase 64) Los faroles de la fachada del patio.
    if (cu.mapa && j.patio) lista.push(...j.patio.luces());
    return lista;
  }
  /** Repinta los mapas que cambiaron (lámparas que se prenden o se apagan, cosas que se mueven). */
  pintar() {
    const j = this.j;
    if (!j.cuartosN) return;
    for (const c of CUARTOS) {
      const cv = this.mapas.get(c.k);
      if (!cv) continue;
      const apagado = !c.afuera && j.cfgCuarto(c.k).luz === false;   // (afuera, de día siempre hay sol)
      cv.classList.toggle("apagado", apagado);
      const fuentes = this._fuentes(c.k), clave = JSON.stringify(fuentes.map((f) => [f.x | 0, f.y | 0, f.r | 0, f.k]));
      this._sombras(c.k, fuentes);
      if (this.claves.get(c.k) === clave) continue;
      this.claves.set(c.k, clave);
      const W = Math.ceil(c.w / RES), Hh = Math.ceil(this._alto(c.k) / RES);
      cv.width = W; cv.height = Hh;
      const ctx = cv.getContext("2d"), img = ctx.createImageData(W, Hh), d = img.data;
      for (let jj = 0; jj < Hh; jj++) for (let ii = 0; ii < W; ii++) {
        const X = (ii + 0.5) * RES, Y = ARRIBA + (jj + 0.5) * RES;
        let L = 0, kr = 0, kg = 0, kb = 0;
        for (const f of fuentes) {
          const dd = Math.hypot(X - f.x, (Y - f.y) * 1.25) / f.r;
          if (dd >= 1) continue;
          const a = f.i * Math.pow(1 - dd, 1.5);
          L += a; kr += f.k[0] * a; kg += f.k[1] * a; kb += f.k[2] * a;
        }
        L = Math.min(1, L);
        // Escalones finos (pixel, sin degradado liso, pero sin anillos marcados).
        const q = Math.min(1, Math.floor(L * 18) / 18);
        const o = (jj * W + ii) * 4, tot = Math.max(0.0001, kr + kg + kb ? (kr + kg + kb) / 3 / 200 : 1);
        const warm = L > 0 ? [kr / tot / 1.4, kg / tot / 1.4, kb / tot / 1.4].map((v) => Math.min(255, v)) : OSCURO;
        d[o] = OSCURO[0] * (1 - q) + warm[0] * q; d[o + 1] = OSCURO[1] * (1 - q) + warm[1] * q; d[o + 2] = OSCURO[2] * (1 - q) + warm[2] * q;
        d[o + 3] = Math.round(255 * ((1 - q) * 0.96 + q * 0.1));
      }
      ctx.putImageData(img, 0, 0);
    }
  }
  /** Sombra de cada mueble del piso: del lado contrario a la luz más cercana (de día, una suavecita abajo). */
  _sombras(c, fuentes) {
    const j = this.j, noche = j.esNoche(), tarde = j.mundo.classList.contains("tarde"), x0 = inicioDe(c), cu = cuarto(c);
    // (Fase 62) Afuera de día, el sol (arriba a la derecha) hace sombras largas hacia la izquierda; en la tarde, más largas.
    const alSol = cu.afuera && !noche && !j.mundo.classList.contains("lluvia");
    for (const r of j.objs.values()) {
      if (r.o.c !== c || r.d.capa !== "piso") continue;
      let sx = 0, ss = 1;
      r.n.classList.toggle("al-sol", alSol);
      if (alSol) {
        const g = Math.min(1.6, 0.6 + r.d.h / 160); sx = -(tarde ? 26 : 15) * g; ss = (tarde ? 1.9 : 1.45) + g * 0.2;
        // (Que la sombra no se salga del cuarto: junto a la orilla, más cortita.)
        const izq = (r.v?.x ?? r.gx) - x0 - r.d.w * 0.42 * ss * (r.v?.s ?? 1) + sx;
        // (El jardín empieza en la orilla del mundo: ahí no hay otro cuarto que tapar.)
        if (izq < 6 && x0 > 0) { sx = Math.min(0, sx + (6 - izq)); ss = Math.max(1, ss - (6 - izq) / Math.max(20, r.d.w)); }
      }
      else if (noche && fuentes.length) {
        const x = (r.v?.x ?? r.gx) - x0;
        let f = fuentes[0];
        for (const g of fuentes) if (Math.abs(g.x - x) < Math.abs(f.x - x)) f = g;
        const dx = x - f.x, largo = Math.min(1.3, Math.abs(dx) / 260);
        sx = Math.sign(dx || 1) * largo * 16; ss = 1 + largo * 0.7;
      }
      r.n.style.setProperty("--osx", sx.toFixed(1) + "px"); r.n.style.setProperty("--oss", ss.toFixed(2));
    }
  }
  limpiar() { for (const cv of this.mapas.values()) cv.remove(); this.mapas.clear(); }
}
