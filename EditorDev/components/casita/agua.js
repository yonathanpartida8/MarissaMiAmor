/**
 * EL AGUA VIVA (Fase 65): el río y el estanque se mueven de verdad, en pixel, pegados al terreno.
 *
 *   · Una capa del mismo tamaño de cuadrito que el terreno (3 del mundo), encima del agua pintada, que sólo pinta
 *     los cuadritos que son agua: el puente, las piedritas y la orilla se quedan como están.
 *   · Lo hondo es más oscuro y lo bajito más claro (la hondura sale del terreno). El cielo se refleja más mientras
 *     más lejos (arriba) se ve el agua, del color de la hora: azul de día, naranja en la tarde, oscuro de noche.
 *   · Olitas que corren con la corriente en el río (hacia la derecha) y ondas suavecitas en el estanque; con más
 *     viento, más olitas y más rápidas. Brillitos sueltos del sol (o de la luna).
 *   · En la orilla: espuma que va y viene y la arena mojada que se oscurece cuando llega la olita. Sombrita junto
 *     al puente y las piedras. Unos nenúfares en el estanque que se mecen.
 *   · Sólo se calcula lo que se ve, a ~12 cuadros por segundo (lo manda viento.js). La primera vez se mide el agua
 *     en pedacitos para no trabar la pantalla.
 */
import { el } from "../ui.js";
import { aguaEn, hash, MAPA } from "./exterior.js";

const PX = 3;
const ZONAS = [{ x0: 0, x1: MAPA.w, y0: 1098, y1: 1314, rio: true }, { x0: 264, x1: 597, y0: 624, y1: 778, rio: false, cx: 430, cy: 700 }];
const NENUFARES = [[372, 688, 1], [468, 716, 0], [516, 678, 0], [350, 726, 0], [440, 664, 1]];
const S = new Float32Array(256);
for (let i = 0; i < 256; i++) S[i] = Math.sin((i / 256) * Math.PI * 2);
const CIELO = { dia: [196, 232, 255], tarde: [255, 196, 160], noche: [52, 60, 112] };
const mezcla = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const BAJITO = [118, 200, 236], HONDO = [34, 104, 172], BLANCO = [244, 252, 255];

export class Agua {
  constructor(n) {
    this.n = n; this.zonas = []; this.listo = false; this.hora = "dia";
    for (const z of ZONAS) {
      const W = Math.ceil((z.x1 - z.x0) / PX), H = Math.ceil((z.y1 - z.y0) / PX);
      const cv = el("canvas.ca-agua", { "aria-hidden": "true", width: W, height: H, style: { left: z.x0 + "px", top: z.y0 + "px", width: W * PX + "px", height: H * PX + "px" } });
      n.append(cv);
      this.zonas.push({ ...z, W, H, cv, ctx: cv.getContext("2d"), img: null });
    }
  }
  /** Mide el agua (una vez, en pedacitos): qué cuadritos son agua, qué tan hondos, qué tan cerca de la orilla. */
  async medir() {
    if (this._midiendo) return this._midiendo;
    this._midiendo = (async () => {
      for (const z of this.zonas) {
        const { W, H } = z, hondo = new Float32Array(W * H), tipo = new Uint8Array(W * H);
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; i++) {
            const a = aguaEn(z.x0 + i * PX + 1.5, z.y0 + j * PX + 1.5), k = j * W + i;
            if (a > 0) { tipo[k] = 1; hondo[k] = a; } else if (a === -1) tipo[k] = 2; else if (a === -2) tipo[k] = 3;
          }
          if (j % 12 === 11) await new Promise((r) => setTimeout(r, 0));
        }
        // Distancia a la orilla (hasta 3) y la sombrita junto al puente y las piedras.
        const dist = new Uint8Array(W * H), sombra = new Uint8Array(W * H), moja = new Uint8Array(W * H);
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
          const k = j * W + i;
          if (tipo[k] === 1) {
            let d = 4;
            for (let r = 1; r <= 3 && d === 4; r++) for (const [di, dj] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W || jj >= H || tipo[jj * W + ii] !== 1) { d = r; if (tipo[jj * W + ii] === 3) sombra[k] = 1; break; } }
            dist[k] = d;
          } else if (tipo[k] === 2) {
            // La arena de la orilla que se moja: la que está junto al agua.
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < W && jj < H && tipo[jj * W + ii] === 1) { moja[k] = Math.abs(di) + Math.abs(dj); break; } }
          }
        }
        Object.assign(z, { hondo, tipo, dist, sombra, moja, img: z.ctx.createImageData(W, H) });
      }
      this.listo = true;
    })();
    return this._midiendo;
  }
  ponHora(h) { this.hora = h in CIELO ? h : "dia"; }
  /** Un cuadro: lo que se ve de cada zona. */
  cuadro(t, f = 0.3) {
    if (!this.listo) { this.medir(); return; }
    const v = this._vista?.();
    if (!v) return;
    // (Fase 68) El agua va mansita: unos 2 o 3 pasitos por segundo (con viento fuerte, algo más), y si no cambió nada (ni
    // el pasito ni lo que se ve), no se vuelve a pintar.
    // (Su fase avanza poquito a poquito, como la del viento: así nunca brinca.)
    const dt = this._tAnt ? Math.min(0.5, Math.max(0, t - this._tAnt)) : 0;
    this._tAnt = t;
    this._fase = (this._fase || 0) + dt * (2.2 + f * 2.2);
    const tt = Math.floor(this._fase), cielo = CIELO[this.hora], noche = this.hora === "noche", umbral = 1.22 - f * 0.38;
    const llave = `${tt}|${v.L | 0}|${v.T | 0}|${v.R | 0}|${v.B | 0}|${this.hora}`;
    if (llave === this._llave) return;
    this._llave = llave;
    for (const z of this.zonas) {
      const i0 = Math.max(0, Math.floor((v.L - z.x0) / PX)), i1 = Math.min(z.W, Math.ceil((v.R - z.x0) / PX)), j0 = Math.max(0, Math.floor((v.T - z.y0) / PX)), j1 = Math.min(z.H, Math.ceil((v.B - z.y0) / PX));
      if (i1 <= i0 || j1 <= j0) continue;
      const { W, H, tipo, hondo, dist, sombra, moja } = z, d = z.img.data;
      for (let jj = j0; jj < j1; jj++) {
        const lejos = 1 - jj / H, refl = 0.14 + lejos * 0.24;
        for (let ii = i0; ii < i1; ii++) {
          const k = jj * W + ii, ty = tipo[k], o = k * 4;
          if (ty === 2) {
            // Arena mojada: se oscurece cuando llega la olita.
            const m = moja[k];
            if (!m) { d[o + 3] = 0; continue; }
            const w = S[(ii * 7 + (z.rio ? 0 : jj * 5) + tt * 2) & 255];
            d[o] = 52; d[o + 1] = 66; d[o + 2] = 78; d[o + 3] = Math.max(0, (m === 1 ? 70 : 36) + w * (m === 1 ? 46 : 30)) | 0;
            continue;
          }
          if (ty !== 1) { d[o + 3] = 0; continue; }
          const p = hondo[k];
          let c = mezcla(BAJITO, HONDO, Math.min(1, p * 1.15));
          c = mezcla(c, cielo, refl);
          // El agua ondula toda, suavecito (en escaloncitos de color, como pixel): se ve líquida, no sólo con brillitos.
          const on = Math.round((0.6 * S[(ii * 3 + jj * 8 - tt * 2) & 255] + 0.4 * S[(ii * 2 - jj * 5 + tt) & 255]) * 2) * 5;
          c = [c[0] + on, c[1] + on, c[2] + on * 0.6];
          // Las olitas: en el río corren hacia la derecha; en el estanque, ondas que salen del centro.
          let w;
          if (z.rio) w = S[(ii * 4 + ((jj * 9) >> 1) - tt * 3) & 255] + 0.6 * S[(jj * 13 + ii * 2 + tt) & 255] + 0.3 * S[(ii * 11 - jj * 3 + tt) & 255];
          else { const dx = ii * PX + z.x0 - z.cx, dy = (jj * PX + z.y0 - z.cy) * 2.2, r = Math.sqrt(dx * dx + dy * dy); w = 1.1 * S[((r * 0.9) | 0) - tt * 2 & 255] + 0.5 * S[(ii * 5 + jj * 7 + tt) & 255]; }
          if (w > umbral + 0.32) c = mezcla(c, BLANCO, 0.5);
          else if (w > umbral) c = mezcla(c, BLANCO, 0.22);
          else if (w < -umbral - 0.1) c = mezcla(c, HONDO, 0.25);
          // La espuma de la orilla que va y viene.
          const dd = dist[k];
          if (dd === 1) { const fw = S[(ii * 9 + jj * 3 + tt * 2) & 255]; if (fw > -0.35) c = mezcla(c, BLANCO, 0.3 + fw * 0.3); }
          else if (dd === 2 && S[(ii * 9 + jj * 3 + tt * 2 + 40) & 255] > 0.72) c = mezcla(c, BLANCO, 0.22);
          if (sombra[k]) c = [c[0] * 0.76, c[1] * 0.8, c[2] * 0.86];
          // Brillitos sueltos (del sol o de la luna), más con viento.
          if (hash(ii >> 1, jj, (tt >> 2) + 1) < 0.0016 * (1 + f * 2)) c = BLANCO;
          if (noche) c = [c[0] * 0.5 + 8, c[1] * 0.52 + 10, c[2] * 0.62 + 26];
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      if (!z.rio) this._nenufares(z, d, tt);
      z.ctx.putImageData(z.img, 0, 0, i0, j0, i1 - i0, j1 - j0);
    }
  }
  /** Los nenúfares del estanque (se mecen tantito con las ondas). */
  _nenufares(z, d, tt) {
    const verde = [[78, 150, 82], [104, 182, 98], [140, 208, 120]], flor = [[255, 168, 204], [255, 232, 242]];
    NENUFARES.forEach(([x, y, fl], q) => {
      const ci = Math.round((x - z.x0) / PX), cj = Math.round((y - z.y0) / PX) + (S[(tt * 3 + q * 50) & 255] > 0.55 ? 1 : 0);
      for (let dj = -2; dj <= 2; dj++) for (let di = -4; di <= 4; di++) {
        if ((di / 4.4) ** 2 + (dj / 2.4) ** 2 > 1) continue;
        if (di > 0 && dj === 0 && di < 4) continue;     // su piquito abierto
        const ii = ci + di, jj = cj + dj, k = jj * z.W + ii;
        if (ii < 0 || jj < 0 || ii >= z.W || jj >= z.H || z.tipo[k] !== 1) continue;
        const c = dj <= -1 ? verde[2] : dj >= 1 ? verde[0] : verde[1], o = k * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      if (fl) for (const [di, dj, c] of [[0, -2, 0], [-1, -2, 1], [1, -2, 1], [0, -3, 1]]) { const ii = ci + di, jj = cj + dj, k = jj * z.W + ii; if (ii >= 0 && jj >= 0 && ii < z.W && jj < z.H) { const o = k * 4; d[o] = flor[c][0]; d[o + 1] = flor[c][1]; d[o + 2] = flor[c][2]; d[o + 3] = 255; } }
    });
  }
}
