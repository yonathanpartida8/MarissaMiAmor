/**
 * EL FONDO EN PIXEL ART (Fase 56): el cielo con nubes, la ciudad a lo lejos con sus ventanitas, casitas,
 * árboles y faroles, dibujados pixel por pixel una sola vez en un lienzo chiquito y agrandado sin suavizar
 * (como un atardecer lila con nubes rosas). Cambia con la hora (día, tarde, noche) y el clima; sólo se
 * vuelve a dibujar cuando algo de eso cambia, así que no gasta nada mientras juegan.
 */
const PX = 3;                       // un pixel del dibujo = 3 del mundo
export const ARRIBA = -330, ABAJO = 436;   // lo que cubre del mundo (y)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mezcla = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function azar(semilla) { let s = semilla >>> 0 || 7; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

const PALETAS = {
  dia: { cielo: ["#4f9be3", "#74b6ee", "#9dcff5", "#c6e6fb", "#e6f5ff"], nube: "#ffffff", nubeS: "#d4e3f3", nubeL: "#ffffff", lejos: ["#9cb1d4", "#8ca2c6", "#aebfdc"], ventana: "#d8e4f4", luz: "#fff6c8", prende: 0.04,
    casas: ["#d98a7e", "#b7b2c8", "#e6c79f", "#9db5ca"], techo: "#6a5a76", arbol: ["#3c8a47", "#55a557", "#78c266"], otono: ["#b98a2e", "#d4a540", "#e6c35a"], pasto: "#5a9c47", pasto2: "#478a3a", farol: "#4a4458", sol: "#fff1a8" },
  tarde: { cielo: ["#5a69b6", "#8a7dc8", "#c08bc6", "#ec9db3", "#f7b58c"], nube: "#a08ccc", nubeS: "#8672b6", nubeL: "#ffb3cb", lejos: ["#5e4d71", "#6c5a7f", "#7b698d"], ventana: "#4b4060", luz: "#f8e4a0", prende: 0.45,
    casas: ["#a6514d", "#7e7991", "#8d6971", "#6e6985"], techo: "#3a2f45", arbol: ["#2b3a2b", "#3e5833", "#5a6a2c"], otono: ["#7a5a22", "#9c7a2a", "#b8902e"], pasto: "#2e3c26", pasto2: "#24301f", farol: "#2b2735", sol: "#ffcf8a" },
  noche: { cielo: ["#0e0f2e", "#1a1946", "#29245e", "#3a2e6e", "#4a3a78"], nube: "#353172", nubeS: "#28265a", nubeL: "#5a53a0", lejos: ["#211f3b", "#2a2747", "#343055"], ventana: "#1c1a30", luz: "#ffd877", prende: 0.72,
    casas: ["#4d2f3f", "#3d3b51", "#493947", "#35354f"], techo: "#1b1625", arbol: ["#131d17", "#1d2b1d", "#2a3923"], otono: ["#3a3016", "#4a3c1a", "#5a4a20"], pasto: "#161f14", pasto2: "#10170f", farol: "#1b1923", sol: "#fff3c4" },
};
const GRIS = rgb("#8a90a6");

/** Dibuja el fondo de un cuarto de afuera en `lienzo` (ancho del cuarto en el mundo). */
export function pintarFondo(lienzo, { ancho, hora = "dia", clima = "sol", tipo = "barrio", semilla = 1 }) {
  const W = Math.ceil(ancho / PX), H = Math.ceil((ABAJO - ARRIBA) / PX);
  lienzo.width = W; lienzo.height = H;
  const c = lienzo.getContext("2d"), img = c.createImageData(W, H), d = img.data;
  const P = PALETAS[hora] || PALETAS.dia, R = azar(semilla * 9301 + 49297);
  const nublado = { sol: 0, lluvia: 0.55, tormenta: 0.78, extra: 0.92 }[clima] ?? 0;
  const col = (h) => (nublado ? mezcla(rgb(h), GRIS, nublado * (hora === "noche" ? 0.35 : 0.6)) : rgb(h));
  const pon = (x, y, k) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255; };
  const caja = (x, y, w, h, k) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pon(x + i, y + j, k); };
  const horizonte = Math.round((330 - ARRIBA) / PX);

  // 1) Cielo: degradado por bandas con tramado (dithering), como en los juegos de antes.
  const C = P.cielo.map(col);
  for (let y = 0; y < H; y++) {
    const t = Math.min(0.999, y / horizonte) * (C.length - 1), i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) pon(x, y, f > BAYER[(y % 4) * 4 + (x % 4)] ? C[Math.min(C.length - 1, i + 1)] : C[i]);
  }
  // Estrellitas (de noche y sin nubes) y el sol o la luna.
  if (hora === "noche" && nublado < 0.6) for (let n = 0; n < W * 0.5; n++) { const x = R() * W, y = R() * horizonte * 0.8; pon(x, y, R() < 0.2 ? [255, 246, 200] : [200, 200, 240]); }
  if (nublado < 0.6) {
    const sx = Math.round(W * 0.78), sy = hora === "tarde" ? Math.round(horizonte * 0.78) : Math.round(horizonte * 0.25), r = 6;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const dd = x * x + y * y;
      if (dd <= r * r) { if (hora === "noche" && (x + 3) * (x + 3) + (y - 2) * (y - 2) < r * r) continue; pon(sx + x, sy + y, rgb(P.sol)); }
      else if (dd <= (r + 2) * (r + 2) && BAYER[((sy + y) % 4 + 4) % 4 * 4 + ((sx + x) % 4 + 4) % 4] > 0.5) pon(sx + x, sy + y, mezcla(rgb(P.sol), C[2], 0.5));
    }
  }
  // 2) Nubes: grupitos de óvalos, con orilla de abajo iluminada (rosita en la tarde).
  const nNubes = Math.round(W / 26 * (1 + nublado * 1.6));
  for (let n = 0; n < nNubes; n++) {
    const cx = R() * W, cy = 8 + R() * horizonte * (0.75 + nublado * 0.2), ancho = 16 + R() * 32 * (1 + nublado), alto = 4 + R() * 5;
    const bolas = Array.from({ length: 4 + (R() * 4) | 0 }, () => [cx + (R() - 0.5) * ancho, cy + (R() - 0.5) * alto, ancho * (0.18 + R() * 0.2), alto * (0.7 + R() * 0.6)]);
    const dentro = (x, y) => bolas.some(([bx, by, rx, ry]) => ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 <= 1);
    for (let y = Math.floor(cy - alto * 2); y <= cy + alto * 2; y++) for (let x = Math.floor(cx - ancho); x <= cx + ancho; x++) {
      if (!dentro(x, y)) continue;
      pon(x, y, !dentro(x, y + 1) || !dentro(x, y + 2) ? col(P.nubeL) : !dentro(x, y - 1) ? col(P.nube) : col(dentro(x - 1, y - 2) ? P.nubeS : P.nube));
    }
  }
  // 3) La ciudad a lo lejos (edificios con ventanitas que se prenden en la tarde y la noche).
  // (El barrio queda arriba de la cerca del jardín; la ciudad, arriba del barandal de la terraza.)
  const sueloY = tipo === "ciudad" ? 404 : 388, base = Math.round((sueloY - 2 - ARRIBA) / PX);
  const capas = tipo === "ciudad" ? [[0.55, 0], [0.8, 1], [1, 2]] : [[0.45, 0], [0.7, 1]];
  for (const [alturaMax, capa] of capas) {
    let x = Math.round(-R() * 10);
    while (x < W) {
      const w = 7 + (R() * 12 | 0), h = Math.round((10 + R() * 34) * alturaMax * (tipo === "ciudad" ? 1.5 : 1)), y0 = base - h - capa * 3;
      const k = col(P.lejos[(capa + (R() * 2 | 0)) % P.lejos.length]);
      caja(x, y0, w, base - y0, k);
      if (R() < 0.3) caja(x + (w >> 1), y0 - 3, 1, 3, k);            // antenita
      if (R() < 0.4) caja(x + 1, y0 - 2, w - 2, 2, mezcla(k, [0, 0, 0], 0.12));
      caja(x + w - 1, y0, 1, base - y0, mezcla(k, [0, 0, 0], 0.18));   // sombrita del lado
      for (let wy = y0 + 2; wy < base - 2; wy += 3) for (let wx = x + 2; wx < x + w - 2; wx += 2) pon(wx, wy, R() < P.prende ? rgb(P.luz) : mezcla(k, rgb(P.ventana), 0.5));
      x += w + (R() < 0.3 ? 1 + (R() * 3 | 0) : 0);
    }
  }
  // 4) El barrio: casitas con techito, árboles redonditos y faroles; luego el pasto con arbustos.
  const suelo = Math.round((sueloY - ARRIBA) / PX);
  if (tipo !== "ciudad") {
    let x = Math.round(R() * 8);
    while (x < W - 6) {
      if (R() < 0.55) {
        const w = 18 + (R() * 10 | 0), h = 12 + (R() * 6 | 0), y0 = suelo - h, k = col(P.casas[R() * P.casas.length | 0]), techo = col(P.techo);
        caja(x, y0, w, h, k);
        caja(x + w - 2, y0, 2, h, mezcla(k, [0, 0, 0], 0.15));
        for (let i = 0; i <= (w >> 1) + 1; i++) caja(x - 1 + i, y0 - i * 0.6 | 0, w + 2 - i * 2, 1, techo);   // techo de dos aguas
        const puerta = x + (w >> 1) - 1;
        caja(puerta, suelo - 5, 3, 5, mezcla(k, [0, 0, 0], 0.35));
        for (const vx of [x + 3, x + w - 6]) { const on = R() < P.prende + 0.15; caja(vx, y0 + 3, 3, 3, on ? rgb(P.luz) : mezcla(k, rgb(P.ventana), 0.6)); pon(vx + 1, y0 + 3, mezcla(k, [255, 255, 255], 0.3)); }
        if (R() < 0.5) caja(x + w - 5, y0 - (w >> 2) - 2, 2, 4, techo);   // chimenea
        x += w + 2;
      } else x += 4;
      // Un árbol entre casa y casa.
      if (R() < 0.7 && x < W - 4) {
        const r = 4 + (R() * 4 | 0), tx = x + r, ty = suelo - r - 4, hojas = (R() < 0.3 ? P.otono : P.arbol).map(col);
        caja(tx, suelo - 5, 1, 5, col(P.techo));
        for (let y = -r; y <= r; y++) for (let xx = -r; xx <= r; xx++) {
          const dd = xx * xx + y * y * 1.2;
          if (dd > r * r) continue;
          const luz = (-xx - y) / (r * 1.6) + 0.5;     // luz de arriba a la izquierda
          pon(tx + xx, ty + y, hojas[luz > 0.75 ? 2 : luz > BAYER[((ty + y) % 4 + 4) % 4 * 4 + ((tx + xx) % 4 + 4) % 4] * 0.6 ? 1 : 0]);
        }
        x += r * 2 + 1;
      }
      // Un farol de vez en cuando (prendido en la tarde y la noche).
      if (R() < 0.25 && x < W - 3) {
        caja(x, suelo - 12, 1, 12, col(P.farol)); caja(x - 1, suelo - 14, 3, 2, P.prende > 0.3 ? rgb(P.luz) : col(P.farol));
        if (P.prende > 0.3) for (const [a, b] of [[-2, -13], [2, -13], [0, -16], [-1, -11], [1, -11]]) pon(x + a, suelo + b, mezcla(rgb(P.luz), C[3], 0.55));
        x += 4;
      }
    }
  }
  // El pasto de enfrente con arbustitos.
  const pasto = col(P.pasto), pasto2 = col(P.pasto2);
  for (let x = 0; x < W; x++) {
    const bump = Math.round(Math.sin(x * 0.45 + semilla) * 1.5 + Math.sin(x * 0.13) * 1.5);
    for (let y = suelo - 1 - Math.max(0, bump); y < H; y++) pon(x, y, (y + x) % 5 === 0 || y > suelo + 3 ? pasto2 : pasto);
  }
  c.putImageData(img, 0, 0);
  return { W, H, arriba: `rgb(${C[0].join(",")})` };
}
