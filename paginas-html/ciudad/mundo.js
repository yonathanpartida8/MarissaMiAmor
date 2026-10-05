/*
 * EL MUNDO — la ciudad dormida, en 3D de verdad.
 *
 * Una cuadrícula de 3 × 3 manzanas con su calle alrededor. En medio, la
 * plaza con su fuente; a la derecha del inicio, Angelos Burger y el
 * edificio de la pareja del K-drama.
 *
 * TODO MIDE MÚLTIPLOS DE 3 METROS (frentes, fondos y pisos). Así cada
 * fachada es una rejilla exacta de ventanas: las ventanas de verdad (que
 * van aparte, en ventanas.js, y se prenden y apagan una por una) caen
 * justo en su hueco de la pared, sin solaparse ni parpadear.
 *
 * Las paredes que dan a la calle llevan la textura con huecos de ventana;
 * las que quedan contra el vecino (medianeras) van lisas. Las cornisas sólo
 * corren por las caras que dan a la calle, así dos edificios vecinos nunca
 * dibujan dos superficies en el mismo plano (eso era el parpadeo).
 *
 * Materiales «de dibujo» (toon) para todo; lo que se repite (farolas,
 * árboles, semáforos, bancas) va instanciado.
 *
 * Unidades: metros. El suelo es y = 0; x hacia el este, z hacia el sur.
 */
import { J, THREE, rnd, elegir, clamp, lienzo, textura, brillo, Juntador, CAJA, TAU, toon, capaEfectos, sinManchaCerca } from "./base.js";
export { luna, colocarLuna } from "./cielo.js";
import { construirCielo } from "./cielo.js";

export const CALLES = [-72, -24, 24, 72];      // ejes de las calles (x y z)
export const MANZANAS = [-48, 0, 48];          // centros de las manzanas
export const MEDIA = 18;                       // media manzana (con banqueta)
export const BANQ = 3;                         // ancho de la banqueta
export const BORDE_MUNDO = 80;                 // hasta dónde se camina
export const ACERA_Y = 0.16;
export const CELDA = 3;                        // una ventana cada 3 m, un piso cada 3 m
export const PISO0 = 4;                        // la planta baja (tiendas) mide 4 m

export const edificios = [];   // { x0, x1, z0, z1, h, estilo, puerta, frente, especial }
export const fachadas = [];    // caras que dan a la calle: { ax, az, bx, bz, nx, nz, L, h, ed }
export const bancas = [];      // { x, z, ry, ocupada }
export const faroles = [];     // { x, z, ry, lx, lz }
export const semaforos = [];
export const callejones = [];  // { bx, bz, x0, x1, z0, z1 }: el pasillo que cruza la manzana (ver callejones.js)   // { x, z, ry, eje, nodo }
export const nodosAcera = [];  // { x, z, vecinos: [] }
export const nodosCalle = [];  // { x, z, vecinos: [] }
export const ventanasEscena = []; // (las llena ventanas.js)
export const lugares = {};     // puntos con nombre: inicio, burger, kdrama, plaza…

/* ══════════════════ LAS TEXTURAS ══════════════════ */
/* Cada estilo: muro, junta, detalle y el tono de los huecos. Colores de día
   (la noche la pone la luz, no la pintura). */
const ESTILOS = {
  ladrillo: { muro: "#b86a52", junta: "#8e4c3c", detalle: "#e8d2b4", hueco: "#3a2228", ladrillo: true },
  deco: { muro: "#c8bce0", junta: "#a89cc8", detalle: "#f4ead2", hueco: "#2e2a48", franjas: true },
  colonial: { muro: "#7fb0b8", junta: "#6896a0", detalle: "#f6ecd8", hueco: "#24343e", molduras: true },
  pastel: { muro: "#f0b8a8", junta: "#d89a8a", detalle: "#fff2e2", hueco: "#3e2a32", molduras: true },
  vidrio: { muro: "#6a8cb8", junta: "#56769e", detalle: "#c8d8ec", hueco: "#1c2a40", cristal: true },
};
const ESTILOS_CIUDAD = ["ladrillo", "deco", "colonial", "pastel", "vidrio", "ladrillo", "colonial"];
/* 24 × 24 m de pared (8 × 8 celdas de 3 m) con el hueco de cada ventana. */
function pintarFachada(est) {
  const T = 512, C = T / 8, m = T / 24;   // m: píxeles por metro
  const [c, x] = lienzo(T, T);
  x.fillStyle = est.muro; x.fillRect(0, 0, T, T);
  // la textura del muro
  if (est.ladrillo) { x.fillStyle = est.junta; for (let y = 0; y < T; y += 6) { x.fillRect(0, y, T, 1); for (let xx = (y / 6) % 2 ? 0 : 7; xx < T; xx += 14) x.fillRect(xx, y, 1, 6); } }
  if (est.franjas) { x.fillStyle = est.junta; for (let k = 0; k < 8; k++) { x.fillRect(k * C - 3, 0, 6, T); } }
  if (est.cristal) { x.fillStyle = est.junta; for (let k = 0; k < 8; k++) { x.fillRect(k * C - 2, 0, 4, T); x.fillRect(0, k * C - 2, T, 4); } }
  for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.05)"; x.fillRect(Math.random() * T, Math.random() * T, rnd(2, 5), rnd(2, 5)); }
  // líneas de cada piso (una banda clarita)
  x.fillStyle = est.detalle;
  for (let fy = 0; fy < 8; fy++) { if (est.molduras || est.franjas) x.fillRect(0, fy * C + C - 4, T, 4); }
  // los huecos: un poco más grandes que la ventana (que mide 1.6 × 1.9 m), con su sombra arriba y su alféizar claro abajo
  for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 8; fx++) {
    const cx = fx * C + C / 2, cy = fy * C + C / 2, w = 1.84 * m, h = 2.14 * m;
    x.fillStyle = est.detalle; x.fillRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8);
    x.fillStyle = est.hueco; x.fillRect(cx - w / 2, cy - h / 2, w, h);
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(cx - w / 2, cy - h / 2, w, 6);
    if (est.molduras) { x.fillStyle = est.detalle; x.beginPath(); x.moveTo(cx - w / 2 - 8, cy - h / 2 - 4); x.lineTo(cx, cy - h / 2 - 16); x.lineTo(cx + w / 2 + 8, cy - h / 2 - 4); x.fill(); }
  }
  const t = textura(c, true); t.anisotropy = 8;
  return t;
}
/* Medianera: la pared lisa que da al vecino. */
function pintarLiso(est) {
  const [c, x] = lienzo(256, 256);
  x.fillStyle = est.muro; x.fillRect(0, 0, 256, 256);
  if (est.ladrillo) { x.fillStyle = est.junta; for (let y = 0; y < 256; y += 6) { x.fillRect(0, y, 256, 1); for (let xx = (y / 6) % 2 ? 0 : 7; xx < 256; xx += 14) x.fillRect(xx, y, 1, 6); } }
  for (let i = 0; i < 400; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.06)"; x.fillRect(Math.random() * 256, Math.random() * 256, rnd(2, 6), rnd(2, 6)); }
  return textura(c, true);
}
/* Planta baja: cuatro locales de 3 m (12 m por textura): escaparate, puerta y letrero.
   El mapa de emisión lleva lo que se prende de noche (vitrinas y letreros). */
function pintarTiendas() {
  const W = 768, Hh = 256, m = W / 12;
  const [c, x] = lienzo(W, Hh), [e, ex] = lienzo(W, Hh);
  x.fillStyle = "#4a3a44"; x.fillRect(0, 0, W, Hh); ex.fillStyle = "#000"; ex.fillRect(0, 0, W, Hh);
  const locales = [
    { letrero: "FLORES", col: "#ff7ab0", vitrina: "#ffd2e2", toldo: "#c8384a" },
    { letrero: "CAFÉ", col: "#7ae0ff", vitrina: "#ffe2b8", toldo: "#3a6a8a" },
    { letrero: "", col: "#ffd36a", vitrina: null, toldo: null },
    { letrero: "PAN", col: "#a8ff9a", vitrina: "#ffe6a0", toldo: "#c88a3a" },
  ];
  const yv = (y) => Hh - y * (Hh / 4);   // y en metros desde el piso → píxel
  locales.forEach((l, k) => {
    const x0 = k * 3 * m;
    // marco del local
    x.fillStyle = "#2e2430"; x.fillRect(x0 + 4, yv(3.4), 3 * m - 8, yv(0) - yv(3.4));
    if (l.vitrina) {
      // escaparate (de día: vidrio azulado; de noche: luz cálida)
      const g = x.createLinearGradient(0, yv(3.0), 0, yv(0.6)); g.addColorStop(0, "#8ab0d0"); g.addColorStop(1, "#50708e");
      x.fillStyle = g; x.fillRect(x0 + 10, yv(3.0), 1.7 * m, yv(0.6) - yv(3.0));
      x.fillStyle = "rgba(255,255,255,.25)"; x.beginPath(); x.moveTo(x0 + 14, yv(1.2)); x.lineTo(x0 + 50, yv(3.0)); x.lineTo(x0 + 66, yv(3.0)); x.lineTo(x0 + 22, yv(0.9)); x.fill();
      const ge = ex.createLinearGradient(0, yv(3.0), 0, yv(0.6)); ge.addColorStop(0, l.vitrina); ge.addColorStop(1, "#7a4a30");
      ex.fillStyle = ge; ex.fillRect(x0 + 10, yv(3.0), 1.7 * m, yv(0.6) - yv(3.0));
      ex.fillStyle = "rgba(0,0,0,.45)"; for (let j = 0; j < 3; j++) ex.fillRect(x0 + 16 + j * 34, yv(1.3), 22, yv(0.6) - yv(1.3));
      // la puerta
      x.fillStyle = "#5a4a3a"; x.fillRect(x0 + 1.95 * m, yv(2.5), 0.85 * m, yv(0) - yv(2.5));
      x.fillStyle = "#8ab0d0"; x.fillRect(x0 + 1.95 * m + 6, yv(2.35), 0.85 * m - 12, yv(1.0) - yv(2.35));
      ex.fillStyle = "rgba(255,210,150,.5)"; ex.fillRect(x0 + 1.95 * m + 6, yv(2.35), 0.85 * m - 12, yv(1.0) - yv(2.35));
      x.fillStyle = "#e8c070"; x.fillRect(x0 + 2.65 * m, yv(1.3), 4, 10);
    } else {
      // cortina metálica
      x.fillStyle = "#6a6a78"; x.fillRect(x0 + 10, yv(3.0), 3 * m - 20, yv(0) - yv(3.0));
      x.fillStyle = "#54545e"; for (let j = 0; j < 22; j++) x.fillRect(x0 + 10, yv(3.0) + j * 8, 3 * m - 20, 2);
    }
    // el letrero
    if (l.letrero) {
      x.fillStyle = "#241c28"; x.fillRect(x0 + 18, yv(3.85), 3 * m - 36, yv(3.35) - yv(3.85));
      x.font = "bold 26px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = l.col; x.fillText(l.letrero, x0 + 1.5 * m, (yv(3.85) + yv(3.35)) / 2);
      ex.font = x.font; ex.textAlign = "center"; ex.textBaseline = "middle"; ex.fillStyle = l.col; ex.fillText(l.letrero, x0 + 1.5 * m, (yv(3.85) + yv(3.35)) / 2);
    }
  });
  const tc = textura(c, true), te = textura(e, true);
  return { tc, te };
}
/* El piso de la calle: asfalto con parches, rayas, pasos de cebra y alcantarillas. */
function pintarSuelo() {
  const T = 2048, L = 180, m = T / L, aP = (v) => (v + L / 2) * m;
  const [c, x] = lienzo(T, T);
  x.fillStyle = "#555a6a"; x.fillRect(0, 0, T, T);
  for (let i = 0; i < 260; i++) { const r = rnd(10, 60); x.fillStyle = Math.random() < 0.5 ? "rgba(70,74,90,.35)" : "rgba(98,100,116,.3)"; x.beginPath(); x.ellipse(rnd(T), rnd(T), r, r * rnd(0.4, 1), rnd(TAU), 0, TAU); x.fill(); }
  for (let i = 0; i < 30000; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.07)"; x.fillRect(Math.random() * T, Math.random() * T, 2, 2); }
  for (const cc of CALLES) {
    x.fillStyle = "#f2c25a";
    for (let s = -L / 2; s < L / 2; s += 4) { if (CALLES.some((q) => Math.abs(s + 1 - q) < 7)) continue; x.fillRect(aP(cc) - 3, aP(s), 6, 2.2 * m); x.fillRect(aP(s), aP(cc) - 3, 2.2 * m, 6); }
    x.fillStyle = "rgba(240,240,248,.75)";
    for (const lado of [-5.6, 5.6]) for (let s = -L / 2; s < L / 2; s += 1) { if (CALLES.some((q) => Math.abs(s - q) < 6.5)) continue; x.fillRect(aP(cc + lado) - 2, aP(s), 4, m); x.fillRect(aP(s), aP(cc + lado) - 2, m, 4); }
  }
  // pasos de cebra y líneas de alto
  for (const cx of CALLES) for (const cz of CALLES) for (const [dx, dz] of [[0, -8.2], [0, 8.2], [-8.2, 0], [8.2, 0]]) {
    x.fillStyle = "rgba(245,245,250,.85)";
    for (let k = -5; k <= 5; k += 1.2) {
      if (dx === 0) x.fillRect(aP(cx + k - 0.3), aP(cz + dz - 1.4), 0.6 * m, 2.8 * m);
      else x.fillRect(aP(cx + dx - 1.4), aP(cz + k - 0.3), 2.8 * m, 0.6 * m);
    }
    x.fillStyle = "rgba(245,245,250,.7)";
    if (dx === 0) x.fillRect(aP(cx - 5.6), aP(cz + dz * 1.22) - 3, 11.2 * m, 6); else x.fillRect(aP(cx + dx * 1.22) - 3, aP(cz - 5.6), 6, 11.2 * m);
  }
  for (let i = 0; i < 28; i++) { const cc = elegir(CALLES), s = rnd(-70, 70); const [px, pz] = Math.random() < 0.5 ? [cc + rnd(-3, 3), s] : [s, cc + rnd(-3, 3)]; x.fillStyle = "#2a2a34"; x.beginPath(); x.arc(aP(px), aP(pz), 0.55 * m, 0, TAU); x.fill(); x.strokeStyle = "#7a7a88"; x.lineWidth = 3; x.stroke(); for (let k = -2; k <= 2; k++) { x.fillStyle = "#4a4a56"; x.fillRect(aP(px) - 0.4 * m, aP(pz) + k * 4 - 1, 0.8 * m, 2); } }
  const t = textura(c); t.anisotropy = 8;
  return t;
}
/* Las banquetas: losetas de 1.5 m con sus juntas. */
function pintarLosetas(base, junta) {
  const [c, x] = lienzo(256, 256);
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${rnd(0.02, 0.06)})`; x.fillRect(i * 128, k * 128, 128, 128); }
  for (let i = 0; i < 1500; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)"; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  x.fillStyle = junta; x.fillRect(0, 0, 256, 4); x.fillRect(0, 128, 256, 4); x.fillRect(0, 0, 4, 256); x.fillRect(128, 0, 4, 256);
  return textura(c, true);
}

/* ══════════════════ LOS EDIFICIOS ══════════════════ */
const juntaFachada = {}, juntaLiso = {}, juntaTiendas = new Juntador(), juntaResto = new Juntador(), juntaBrillo = new Juntador(), juntaAcera = new Juntador();
/* Una cara vertical de (ax,az) a (bx,bz), de y0 a y1, con UV en metros desde su esquina. */
function cara(j, ax, az, bx, bz, n, y0, y1, tinte, uEsc, vFn) {
  const largo = Math.hypot(bx - ax, bz - az), b = j.base, col = new THREE.Color(tinte);
  const vs = [[ax, y0, az, 0, y0], [bx, y0, bz, largo, y0], [bx, y1, bz, largo, y1], [ax, y1, az, 0, y1]];
  for (const [px, py, pz, u, v] of vs) { j.p.push(px, py, pz); j.n.push(...n); j.c.push(col.r, col.g, col.b); j.u.push(u / uEsc, vFn(v)); }
  j.i.push(b, b + 1, b + 2, b, b + 2, b + 3); j.base += 4;
}
/* Las cuatro caras de una caja (sentido antihorario visto desde arriba) y si dan a la calle. */
function carasDe(x0, x1, z0, z1, expuesta) {
  return [
    { a: [x0, z1], b: [x1, z1], n: [0, 0, 1], dentro: !expuesta.s },
    { a: [x1, z1], b: [x1, z0], n: [1, 0, 0], dentro: !expuesta.e },
    { a: [x1, z0], b: [x0, z0], n: [0, 0, -1], dentro: !expuesta.n },
    { a: [x0, z0], b: [x0, z1], n: [-1, 0, 0], dentro: !expuesta.o },
  ];
}
function hacerEdificio(x0, x1, z0, z1, h, estilo, frente, expuesta, especial) {
  const tintes = ["#ffffff", "#fff2ec", "#f2f0ff", "#f4fff6", "#fff8e6"];
  const tinte = elegir(tintes);
  const jf = juntaFachada[estilo] || (juntaFachada[estilo] = new Juntador());
  const jl = juntaLiso[estilo] || (juntaLiso[estilo] = new Juntador());
  const ed = { x0, x1, z0, z1, h, estilo, frente, especial, puerta: null };
  for (const k of carasDe(x0, x1, z0, z1, expuesta)) {
    const [ax, az] = k.a, [bx, bz] = k.b, L = Math.hypot(bx - ax, bz - az);
    if (k.dentro) { cara(jl, ax, az, bx, bz, k.n, 0, h, tinte, 6, (y) => y / 6); continue; }
    // pisos de arriba: la rejilla de ventanas empieza en y = 4
    cara(jf, ax, az, bx, bz, k.n, PISO0, h, tinte, 24, (y) => (y - PISO0) / 24);
    // planta baja: los locales (un poquito salidos de la pared)
    const sal = 0.12, nx = k.n[0], nz = k.n[2];
    if (especial !== "burger") cara(juntaTiendas, ax + nx * sal, az + nz * sal, bx + nx * sal, bz + nz * sal, k.n, 0, PISO0, "#ffffff", 12, (y) => y / PISO0);
    else cara(jl, ax, az, bx, bz, k.n, 0, PISO0, tinte, 6, (y) => y / 6);
    // la cornisa de arriba y la banda de la planta baja: sólo por esta cara
    const ux = (bx - ax) / L, uz = (bz - az) / L, cx = (ax + bx) / 2 + nx * 0.18, cz = (az + bz) / 2 + nz * 0.18, ry = Math.atan2(ux, uz) - Math.PI / 2;
    juntaResto.caja(cx, h + 0.1, cz, L, 0.42, 0.36, estilo === "deco" ? "#f0e2c0" : estilo === "vidrio" ? "#cfdced" : "#efe2cc", ry);
    juntaResto.caja(cx, PISO0 + 0.06, cz, L, 0.22, 0.36, "#5a4650", ry);
    if (estilo === "deco") for (let s = 0; s <= L + 0.01; s += CELDA * 2) juntaResto.caja(ax + ux * s + nx * 0.1, (PISO0 + h) / 2, az + uz * s + nz * 0.1, 0.5, h - PISO0, 0.2, "#e8dcc0", ry);
    fachadas.push({ ax, az, bx, bz, nx, nz, ux, uz, L, h, ed, estilo });
    if (!ed.puerta) ed.puerta = { x: (ax + bx) / 2 + nx * 1.5, z: (az + bz) / 2 + nz * 1.5 };
  }
  // la azotea (justo del tamaño del edificio: nada se solapa con el vecino)
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  juntaResto.caja(cx, h - 0.05, cz, w, 0.1, d, "#4a4250");
  if (Math.random() < 0.55) { const tx = cx + rnd(-w / 5, w / 5), tz = cz + rnd(-d / 5, d / 5); juntaResto.caja(tx, h + 1.7, tz, 2.0, 2.2, 2.0, "#7a6a5a"); juntaResto.caja(tx, h + 2.95, tz, 2.3, 0.3, 2.3, "#5a4a3e"); for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) juntaResto.caja(tx + a, h + 0.3, tz + b, 0.14, 0.6, 0.14, "#3a3238"); }
  for (let k = 0; k < Math.floor(rnd(1, 4)); k++) juntaResto.caja(cx + rnd(-w / 3, w / 3), h + 0.45, cz + rnd(-d / 3, d / 3), 1.1, 0.7, 0.8, "#b8b8c4");
  if (Math.random() < 0.3) { const ax = cx + rnd(-w / 3, w / 3), az = cz + rnd(-d / 3, d / 3); juntaResto.caja(ax, h + 3, az, 0.12, 6, 0.12, "#3a3a44"); juntaBrillo.caja(ax, h + 6.1, az, 0.3, 0.3, 0.3, "#ff3a4a"); }
  edificios.push(ed);
  return ed;
}

/* ══════════════════ LA CUADRÍCULA ══════════════════ */
const ALTURAS = [2, 2, 3, 3, 3, 4, 4, 5, 6, 7, 9];   // pisos encima de la planta baja
const alto = () => PISO0 + CELDA * elegir(ALTURAS);
/* Reparte un frente de `largo` m en anchos de 6, 9 o 12 (siempre múltiplos de 3). */
function partir(largo) { const r = []; let q = largo; while (q > 0) { const w = q <= 15 ? q : elegir([6, 9, 9, 12]); r.push(w); q -= w; } return r; }
function filaDeEdificios(bx, bz, fx, fz, desde, hasta) {
  // fila N/S: a lo largo de x, fondo de 12 desde la orilla; fila O/E: a lo largo de z
  let s = desde;
  for (const w of partir(hasta - desde)) {
    let x0, x1, z0, z1;
    if (fz) { x0 = bx + s; x1 = x0 + w; z0 = fz > 0 ? bz + 3 : bz - 15; z1 = z0 + 12; }
    else { z0 = bz + s; z1 = z0 + w; x0 = fx > 0 ? bx + 3 : bx - 15; x1 = x0 + 12; }
    const exp = { n: z0 === bz - 15, s: z1 === bz + 15, o: x0 === bx - 15, e: x1 === bx + 15 };
    hacerEdificio(x0, x1, z0, z1, alto(), elegir(ESTILOS_CIUDAD), [fx, fz], exp);
    s += w;
  }
}
function construirCuadricula() {
  for (const bx of MANZANAS) for (const bz of MANZANAS) {
    // la banqueta (losetas arriba, guarnición alrededor)
    const plaza = bx === 0 && bz === 0;
    juntaAcera.meter(new THREE.PlaneGeometry(MEDIA * 2, MEDIA * 2).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(bx, ACERA_Y, bz), plaza ? "#f2e2d0" : "#ffffff", [MEDIA * 2 / 1.5 / 2, MEDIA * 2 / 1.5 / 2]);
    for (const [dx, dz, w, d] of [[0, MEDIA, MEDIA * 2 + 0.3, 0.3], [0, -MEDIA, MEDIA * 2 + 0.3, 0.3], [MEDIA, 0, 0.3, MEDIA * 2 - 0.3], [-MEDIA, 0, 0.3, MEDIA * 2 - 0.3]]) juntaResto.caja(bx + dx, ACERA_Y / 2, bz + dz, w, ACERA_Y, d, "#b8b4c4");
    const n = nodosAcera.length, r = MEDIA - 1.5;
    nodosAcera.push({ x: bx - r, z: bz - r, vecinos: [] }, { x: bx + r, z: bz - r, vecinos: [] }, { x: bx + r, z: bz + r, vecinos: [] }, { x: bx - r, z: bz + r, vecinos: [] });
    for (let k = 0; k < 4; k++) { nodosAcera[n + k].vecinos.push(n + (k + 1) % 4, n + (k + 3) % 4); nodosAcera[n + k].manzana = [bx, bz]; }
    if (plaza) { construirPlaza(); continue; }
    const especial = bx === 48 && bz === 0;
    if (especial) {
      construirBurgerYKdrama(bx, bz);
      filaDeEdificios(bx, bz, 0, -1, -3, 15); filaDeEdificios(bx, bz, 0, 1, -3, 15);
    } else {
      filaDeEdificios(bx, bz, 0, -1, -15, 15); filaDeEdificios(bx, bz, 0, 1, -15, 15);
    }
    // algunas manzanas tienen un callejón que las cruza de lado a lado (de calle a calle)
    const callejon = !especial && ((bx === -48 && bz === -48) || (bx === 0 && bz === 48) || (bx === -48 && bz === 48) || (bx === 48 && bz === -48));
    if (callejon) { callejones.push({ bx, bz, x0: bx - 15, x1: bx + 15, z0: bz - 3, z1: bz + 3 }); continue; }
    if (!especial) filaDeEdificios(bx, bz, -1, 0, -3, 3);
    filaDeEdificios(bx, bz, 1, 0, -3, 3);
    // el patio de adentro (no se ve, pero que no quede un hueco)
    juntaResto.caja(bx + (especial ? 0 : 0), 4, bz, 6, 8, 6, "#3a3440");
  }
  // los cruces peatonales unen las esquinas de manzanas vecinas
  const buscar = (x, z) => nodosAcera.findIndex((q) => Math.abs(q.x - x) < 0.1 && Math.abs(q.z - z) < 0.1);
  for (const q of nodosAcera.slice()) for (const [dx, dz] of [[15, 0], [0, 15]]) {
    const k = buscar(q.x + dx, q.z + dz), a = nodosAcera.indexOf(q);
    if (k >= 0) { nodosAcera[a].vecinos.push(k); nodosAcera[k].vecinos.push(a); }
  }
  // la calle de los coches: un nodo por cruce
  for (const x of CALLES) for (const z of CALLES) nodosCalle.push({ x, z, vecinos: [] });
  for (const a of nodosCalle) for (const b of nodosCalle) if (a !== b && ((a.x === b.x && Math.abs(a.z - b.z) === 48) || (a.z === b.z && Math.abs(a.x - b.x) === 48))) a.vecinos.push(nodosCalle.indexOf(b));
  // los edificios de la orilla (miran hacia adentro), para que la ciudad no se acabe en la nada
  for (const lado of [-1, 1]) {
    let s = -93;
    for (const w of partir(186)) {
      const x0 = lado > 0 ? 81 : -93, x1 = x0 + 12;
      hacerEdificio(x0, x1, s, s + w, PISO0 + CELDA * elegir([3, 4, 5, 7, 9, 11]), elegir(ESTILOS_CIUDAD), null, { o: lado > 0, e: lado < 0, n: false, s: false });
      s += w;
    }
    s = -81;
    for (const w of partir(162)) {
      const z0 = lado > 0 ? 81 : -93, z1 = z0 + 12;
      hacerEdificio(s, s + w, z0, z1, PISO0 + CELDA * elegir([3, 4, 5, 7, 9, 11]), elegir(ESTILOS_CIUDAD), null, { n: lado > 0, s: lado < 0, o: false, e: false });
      s += w;
    }
  }
  // la banqueta de la orilla
  for (const lado of [-1, 1]) {
    juntaAcera.meter(new THREE.PlaneGeometry(1.5, 162).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(lado * 80.25, ACERA_Y, 0), "#ffffff", [1, 108]);
    juntaAcera.meter(new THREE.PlaneGeometry(162, 1.5).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(0, ACERA_Y, lado * 80.25), "#ffffff", [108, 1]);
  }
}

/* La plaza: la fuente, las bancas, los árboles, la estatua y los faroles. */
const arboles = [];
function construirPlaza() {
  const cil = new THREE.CylinderGeometry(1, 1, 1, 32), m = new THREE.Matrix4(), q = new THREE.Quaternion();
  m.compose(new THREE.Vector3(0, 0.45, 0), q, new THREE.Vector3(5, 0.6, 5)); juntaResto.meter(cil, m, "#d8ccdc");
  m.compose(new THREE.Vector3(0, 0.78, 0), q, new THREE.Vector3(5.2, 0.12, 5.2)); juntaResto.meter(cil, m, "#efe4f0");
  m.compose(new THREE.Vector3(0, 1.5, 0), q, new THREE.Vector3(0.5, 2, 0.5)); juntaResto.meter(cil, m, "#e0d6e6");
  m.compose(new THREE.Vector3(0, 2.5, 0), q, new THREE.Vector3(1.6, 0.25, 1.6)); juntaResto.meter(cil, m, "#e8dff0");
  m.compose(new THREE.Vector3(0, 3.2, 0), q, new THREE.Vector3(0.35, 1.2, 0.35)); juntaResto.meter(cil, m, "#8ab8a8");
  m.compose(new THREE.Vector3(0, 3.95, 0), q, new THREE.Vector3(0.26, 0.3, 0.26)); juntaResto.meter(new THREE.SphereGeometry(1, 16, 12), m, "#8ab8a8");
  edificios.push({ x0: -5, x1: 5, z0: -5, z1: 5, h: 0.9, fuente: true });
  lugares.fuente = { x: 0, z: 0, r: 4.6, y: 0.72 };
  // el agua de la fuente (se mueve en el shader de mundo)
  // bancas mirando a la fuente
  for (const [x, z, ry] of [[-9, -4, Math.PI / 2], [-9, 4, Math.PI / 2], [9, -4, -Math.PI / 2], [9, 4, -Math.PI / 2], [-4, 9, Math.PI], [4, 9, Math.PI], [-4, -9, 0], [4, -9, 0]]) bancas.push({ x, z, ry, ocupada: null, plaza: true });
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11], [-13, 0], [13, 0], [0, -13], [0, 13]]) arboles.push({ x, z, s: rnd(1.05, 1.35), plaza: true });
  for (const [x, z] of [[-6, -12], [6, 12], [12, -6], [-12, 6]]) faroles.push({ x, z, ry: 0 });
  lugares.plaza = { x: 0, z: 0 };
  // arriates con flores
  for (let k = 0; k < 70; k++) { const a = rnd(TAU), r = rnd(6, 7.2); juntaBrillo.caja(Math.cos(a) * r, ACERA_Y + 0.17, Math.sin(a) * r, 0.18, 0.14, 0.18, elegir(["#ff6fa5", "#ffd36a", "#ffffff", "#c89aff", "#ff9a6a"])); juntaResto.caja(Math.cos(a) * r, ACERA_Y + 0.06, Math.sin(a) * r, 0.28, 0.14, 0.28, "#4f8a4a"); }
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) juntaResto.caja(Math.cos(a) * 6.6, ACERA_Y + 0.12, Math.sin(a) * 6.6, a % Math.PI ? 0.3 : 3.2, 0.24, a % Math.PI ? 3.2 : 0.3, "#c8bcd0");
}

/* Angelos Burger y, al lado, el edificio de la pareja del K-drama. */
function construirBurgerYKdrama(bx, bz) {
  const x0 = bx - 15, x1 = bx - 3;   // la fachada mira hacia x negativa (la calle x = 24)
  // del lado norte, uno alto
  hacerEdificio(x0, x1, bz - 15, bz - 9, PISO0 + CELDA * 6, "deco", [-1, 0], { o: true, n: true });
  // ── Angelos Burger: z de -9 a 6, dos pisos ──
  const ed = hacerEdificio(x0, x1, bz - 9, bz + 6, PISO0 + CELDA * 2, "ladrillo", [-1, 0], { o: true }, "burger");
  lugares.burger = { x: x0 - 1.6, z: bz - 1.5, frente: x0, z0: bz - 9, z1: bz + 6, ed };
  // ── el edificio del K-drama: z de 6 a 15 ──
  const ek = hacerEdificio(x0, x1, bz + 6, bz + 15, PISO0 + CELDA * 5, "colonial", [-1, 0], { o: true, s: true }, "kdrama");
  lugares.kdrama = { x: x0 - 0.05, y: PISO0 + CELDA / 2, z: bz + 10.5, ed: ek, celda: { fila: 0, col: 1 } };
  lugares.inicio = { x: x0 - 1.7, z: bz + 8.6 };
}

/* Los faroles de las banquetas, los árboles, las bancas y los semáforos. */
function construirMobiliario() {
  for (const bx of MANZANAS) for (const bz of MANZANAS) {
    for (const s of [-10, 6]) for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = fz ? bx + s : bx + fx * (MEDIA - 0.6), z = fz ? bz + fz * (MEDIA - 0.6) : bz + s;
      faroles.push({ x, z, ry: Math.atan2(fx, fz) });
    }
    if (bx === 0 && bz === 0) continue;
    for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const frenteBurger = bx === 48 && bz === 0 && fx === -1;   // la banqueta del Burger y del K-drama, despejada
      for (const s of [rnd(-13, -5), rnd(2, 13)]) {
        const x = fz ? bx + s : bx + fx * (MEDIA - 0.9), z = fz ? bz + fz * (MEDIA - 0.9) : bz + s;
        if (Math.random() < 0.75 && !frenteBurger) arboles.push({ x, z, s: rnd(0.8, 1.05) });
      }
      // las bancas miran a la calle (y a los edificios de enfrente)
      for (const s of [-3.5, 9.5]) {
        if (frenteBurger && s > 0) continue;
        const x2 = fz ? bx + s : bx + fx * (MEDIA - 1.6), z2 = fz ? bz + fz * (MEDIA - 1.6) : bz + s;
        if (Math.random() < 0.7 || frenteBurger) bancas.push({ x: x2, z: z2, ry: Math.atan2(fx, fz), ocupada: null });
      }
    }
  }
  // semáforos: uno en cada esquina de cada cruce, mirando al carril que llega
  CALLES.forEach((cx) => CALLES.forEach((cz) => {
    const nodo = nodosCalle.findIndex((n) => n.x === cx && n.z === cz);
    for (const [dx, dz, ry, eje] of [[6.8, 6.8, 0, "NS"], [-6.8, -6.8, Math.PI, "NS"], [6.8, -6.8, Math.PI / 2, "EO"], [-6.8, 6.8, -Math.PI / 2, "EO"]]) {
      const x = cx + dx, z = cz + dz;
      if (Math.abs(x) > 79 || Math.abs(z) > 79) continue;
      semaforos.push({ x, z, ry, eje, nodo });
    }
  }));
}
/* ¿Qué luz tiene el semáforo de un cruce para un eje? (verde, ámbar o rojo) */
export function semaforo(nodo, eje) {
  const t = (J.t + nodo * 3.7) % 24;
  const ns = t < 9.5 ? "verde" : t < 12 ? "ambar" : "rojo";
  const eo = t < 12 ? "rojo" : t < 21.5 ? "verde" : "ambar";
  return eje === "NS" ? ns : eo;
}

/* Lo que se puede desvanecer (tramado) cuando queda muy cerca de la cámara de la banca. */
J.cercaU = { value: new THREE.Vector4(0, 0, 0, 0) };   // xyz: cámara, w: radio (0 = nada)
function ocultableCerca(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCerca = J.cercaU;
    sh.vertexShader = "varying vec3 vCercaW;\n" + sh.vertexShader.replace("#include <project_vertex>", `#include <project_vertex>
      #ifdef USE_INSTANCING
        vCercaW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vCercaW = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`);
    sh.fragmentShader = "uniform vec4 uCerca; varying vec3 vCercaW;\n" + sh.fragmentShader.replace("void main() {", `void main() {
      if (uCerca.w > 0.0) {
        float k = clamp((uCerca.w - distance(vCercaW.xz, uCerca.xz)) / 2.5, 0.0, 1.0);
        vec2 q = floor(mod(gl_FragCoord.xy, 4.0));
        vec2 q2 = mod(q, 2.0), q4 = floor(q / 2.0);   // tramado de Bayer 4×4
        float b = (4.0 * mod(2.0 * q2.x + 3.0 * q2.y, 4.0) + mod(2.0 * q4.x + 3.0 * q4.y, 4.0)) / 16.0 + 0.03;
        if (k > b) discard;
      }`);
  };
  mat.customProgramCacheKey = () => "cerca";
  return mat;
}

/* ══════════════════ ARMARLO TODO ══════════════════ */
export const materiales = {};
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
let lentes = null, bombillas = null, halo = null;
export function construirMundo(esc, ESCENAS) {
  construirCuadricula();
  construirMobiliario();
  void ESCENAS;
  const sombras = J.calidad.sombras;
  // las fachadas y las medianeras, una malla por estilo
  for (const [nombre, j] of Object.entries(juntaFachada)) {
    const mat = toon({ map: pintarFachada(ESTILOS[nombre]), vertexColors: true });
    const m = new THREE.Mesh(j.geometria(), mat); m.castShadow = sombras; m.receiveShadow = sombras; esc.add(m);
    materiales["fachada_" + nombre] = mat;
  }
  for (const [nombre, j] of Object.entries(juntaLiso)) {
    const m = new THREE.Mesh(j.geometria(), toon({ map: pintarLiso(ESTILOS[nombre]), vertexColors: true }));
    m.castShadow = sombras; m.receiveShadow = sombras; esc.add(m);
  }
  const { tc, te } = pintarTiendas();
  const matTiendas = toon({ map: tc, emissiveMap: te, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 });
  const mt = new THREE.Mesh(juntaTiendas.geometria(), matTiendas); mt.receiveShadow = sombras; mt.castShadow = sombras; esc.add(mt);
  materiales.tiendas = matTiendas;
  const mr = new THREE.Mesh(juntaResto.geometria(), toon({ vertexColors: true })); mr.castShadow = sombras; mr.receiveShadow = sombras; esc.add(mr);
  const mb = new THREE.Mesh(juntaBrillo.geometria(), new THREE.MeshBasicMaterial({ vertexColors: true })); esc.add(mb);
  const ma = new THREE.Mesh(juntaAcera.geometria(), toon({ map: pintarLosetas("#cfc8d4", "#9e96a8"), vertexColors: true })); ma.receiveShadow = sombras; esc.add(ma);
  // el piso de las calles y, más allá, el resto del mundo (más abajo: nunca se pelean)
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(186, 186), toon({ map: pintarSuelo() }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = sombras; esc.add(suelo); materiales.suelo = suelo.material;
  const lejos = new THREE.Mesh(new THREE.RingGeometry(92, 700, 48, 1).rotateX(-Math.PI / 2), toon({ color: "#3a3a4a" }));
  lejos.position.y = -0.05; esc.add(lejos);
  // ── los faroles: poste, brazo, lámpara (instanciados) ──
  const nF = faroles.length;
  const metal = toon({ color: "#2e2c3c" });
  const poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.12, 5, 10).translate(0, 2.5, 0), metal, nF);
  const base = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 10).translate(0, 0.25, 0), metal, nF);
  const brazo = new THREE.InstancedMesh(new THREE.TorusGeometry(0.6, 0.045, 6, 16, Math.PI / 2).rotateY(Math.PI / 2).translate(0, 4.4, 0.6), metal, nF);
  const tapa = new THREE.InstancedMesh(new THREE.ConeGeometry(0.34, 0.26, 12).translate(0, 5.12, 1.2), metal, nF);
  bombillas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 12, 8).scale(1, 0.7, 1).translate(0, 4.9, 1.2), new THREE.MeshBasicMaterial({ color: "#fff2d0" }), nF);
  const halos = new Float32Array(nF * 3);
  faroles.forEach((f, i) => {
    _q.setFromAxisAngle(_y, f.ry + Math.PI); _p.set(f.x, ACERA_Y, f.z); _m.compose(_p, _q, _s);
    for (const im of [poste, base, brazo, tapa, bombillas]) im.setMatrixAt(i, _m);
    f.lx = f.x - Math.sin(f.ry) * 1.2; f.lz = f.z - Math.cos(f.ry) * 1.2;
    halos.set([f.lx, ACERA_Y + 4.86, f.lz], i * 3);
  });
  poste.castShadow = brazo.castShadow = tapa.castShadow = base.castShadow = sombras;
  esc.add(poste, base, brazo, tapa, bombillas);
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.BufferAttribute(halos, 3));
  halo = new THREE.Points(hg, sinManchaCerca(new THREE.PointsMaterial({ size: 3.6, map: brillo([[0, "rgba(255,236,190,.95)"], [0.25, "rgba(255,210,150,.35)"], [1, "rgba(255,200,140,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, color: new THREE.Color(1.6, 1.4, 1.1) })));
  halo.frustumCulled = false; esc.add(capaEfectos(halo));
  // ── los árboles: tronco, maceta y copa en tres tonos (instanciados) ──
  // (en la vista de la banca, los que quedan pegados a la cámara se desvanecen y dejan ver la fachada)
  const nA = arboles.length;
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.18, 2.8, 8).translate(0, 1.4, 0), ocultableCerca(toon({ color: "#6a4a36" })), nA);
  const alcorque = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.12, 1.1).translate(0, 0.06, 0), toon({ color: "#7a6a66" }), nA);
  const copaG = new THREE.IcosahedronGeometry(1.4, 2);
  { const p = copaG.attributes.position; for (let i = 0; i < p.count; i++) { const v = _p.fromBufferAttribute(p, i); const k = 1 + Math.sin(v.x * 3.1) * 0.06 + Math.cos(v.z * 2.7 + v.y) * 0.06; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } copaG.computeVertexNormals(); }
  const copa = new THREE.InstancedMesh(copaG, ocultableCerca(toon({ color: "#ffffff" })), nA * 4);
  let k = 0;
  const VERDES = ["#4f8a4a", "#5a9a50", "#4a7e48", "#66a258", "#3f7a48"];
  arboles.forEach((a, i) => {
    _m.compose(_p.set(a.x, ACERA_Y, a.z), _q.identity(), _s.set(a.s, a.s, a.s)); tronco.setMatrixAt(i, _m);
    _m.compose(_p.set(a.x, ACERA_Y, a.z), _q.identity(), _s.set(1, 1, 1)); alcorque.setMatrixAt(i, _m);
    const verde = new THREE.Color(elegir(VERDES));
    for (const [dx, dy, dz, s] of [[0, 3.7, 0, 1], [-0.75, 3.2, 0.35, 0.72], [0.65, 3.3, -0.45, 0.76], [0.1, 4.5, 0.2, 0.62]]) {
      _m.compose(_p.set(a.x + dx * a.s, ACERA_Y + dy * a.s, a.z + dz * a.s), _q.setFromEuler(new THREE.Euler(rnd(TAU), rnd(TAU), 0)), _s.set(s * a.s, s * a.s * 0.88, s * a.s));
      copa.setMatrixAt(k, _m); copa.setColorAt(k, verde.clone().offsetHSL(rnd(-0.02, 0.02), 0, rnd(-0.05, 0.05))); k++;
    }
  });
  tronco.castShadow = copa.castShadow = sombras; copa.receiveShadow = sombras; alcorque.receiveShadow = sombras;
  esc.add(tronco, alcorque, copa);
  J.arboles = arboles;
  // foquitos de colores en los árboles de la plaza (de noche)
  const fq = [];
  for (const a of arboles) if (a.plaza) for (let i = 0; i < 16; i++) { const q = rnd(TAU), r = rnd(1.1, 1.7) * a.s; fq.push(a.x + Math.cos(q) * r, ACERA_Y + (3.4 + rnd(-0.8, 1)) * a.s, a.z + Math.sin(q) * r); }
  const fqG = new THREE.BufferGeometry(); fqG.setAttribute("position", new THREE.Float32BufferAttribute(fq, 3));
  const cols = []; for (let i = 0; i < fq.length / 3; i++) { const c = new THREE.Color(elegir(["#ffd36a", "#ff8ac0", "#8ad8ff", "#b8ff9a"])).multiplyScalar(1.8); cols.push(c.r, c.g, c.b); }
  fqG.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  J.foquitos = new THREE.Points(fqG, sinManchaCerca(new THREE.PointsMaterial({ size: 0.45, vertexColors: true, map: brillo([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,255,255,.5)"], [1, "rgba(255,255,255,0)"]], 32), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  J.foquitos.frustumCulled = false; esc.add(capaEfectos(J.foquitos));
  // ── las bancas: asiento de tablas, respaldo y patas de hierro ──
  const banca = new Juntador();
  for (const b of bancas) {
    const c = Math.cos(b.ry), s = Math.sin(b.ry);
    const pon = (dx, dy, dz, w, h, d, col) => banca.caja(b.x + dx * c + dz * s, ACERA_Y + dy, b.z - dx * s + dz * c, w, h, d, col, b.ry);
    for (let t = 0; t < 3; t++) pon(0, 0.45, -0.17 + t * 0.15, 1.8, 0.05, 0.12, "#b8784a");
    for (let t = 0; t < 2; t++) pon(0, 0.68 + t * 0.17, -0.27, 1.8, 0.11, 0.04, "#b8784a");
    for (const sx of [-0.8, 0.8]) { pon(sx, 0.22, 0, 0.07, 0.45, 0.42, "#2e2c3a"); pon(sx, 0.62, -0.27, 0.07, 0.42, 0.05, "#2e2c3a"); pon(sx, 0.6, 0.02, 0.07, 0.05, 0.4, "#2e2c3a"); }
  }
  const mBanca = new THREE.Mesh(banca.geometria(), toon({ vertexColors: true })); mBanca.castShadow = sombras; mBanca.receiveShadow = sombras; esc.add(mBanca);
  // ── los semáforos: poste, caja y tres lentes que cambian de color ──
  const nS = semaforos.length;
  const pS = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8).translate(0, 1.7, 0), metal, nS);
  const cS = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.98, 0.26).translate(0, 3.1, 0.12), toon({ color: "#2a2a30" }), nS);
  lentes = new THREE.InstancedMesh(new THREE.CircleGeometry(0.1, 14).translate(0, 0, 0.26), new THREE.MeshBasicMaterial({ color: "#ffffff" }), nS * 3);
  semaforos.forEach((sm, i) => {
    _q.setFromAxisAngle(_y, sm.ry); _m.compose(_p.set(sm.x, ACERA_Y, sm.z), _q, _s.set(1, 1, 1)); pS.setMatrixAt(i, _m); cS.setMatrixAt(i, _m);
    for (let l = 0; l < 3; l++) { _m.compose(_p.set(sm.x + Math.sin(sm.ry) * 0.0, ACERA_Y + 3.42 - l * 0.31, sm.z), _q, _s.set(1, 1, 1)); lentes.setMatrixAt(i * 3 + l, _m); lentes.setColorAt(i * 3 + l, new THREE.Color("#222")); }
  });
  pS.castShadow = cS.castShadow = sombras; esc.add(pS, cS, lentes);
  construirCielo(esc);
}

/* Cada cuadro: lo que cambia con la hora (farolas, letreros) y los semáforos. */
const APAG = new THREE.Color("#2a2a2a"), ROJO = new THREE.Color(3.2, 0.25, 0.2), AMB = new THREE.Color(3, 1.6, 0.2), VERDE = new THREE.Color(0.3, 2.8, 1.0);
let cadaSem = 0;
export function actualizarMundo(dt, ciclo) {
  const f = ciclo.farolas;
  bombillas.material.color.setRGB(0.9 + f * 2.6, 0.86 + f * 2.1, 0.75 + f * 1.4);
  halo.material.opacity = f; halo.visible = f > 0.02;
  if (J.foquitos) { J.foquitos.material.opacity = Math.max(0.15, ciclo.noche); }
  materiales.tiendas.emissiveIntensity = 0.15 + ciclo.ventanas * 1.5;
  if ((cadaSem -= dt) <= 0) {
    cadaSem = 0.25;
    const k = 0.35 + 0.65 * ciclo.noche;
    semaforos.forEach((sm, i) => {
      const e = semaforo(sm.nodo, sm.eje);
      lentes.setColorAt(i * 3, e === "rojo" ? _c.copy(ROJO).multiplyScalar(k) : APAG);
      lentes.setColorAt(i * 3 + 1, e === "ambar" ? _c.copy(AMB).multiplyScalar(k) : APAG);
      lentes.setColorAt(i * 3 + 2, e === "verde" ? _c.copy(VERDE).multiplyScalar(k) : APAG);
    });
    lentes.instanceColor.needsUpdate = true;
  }
}
const _c = new THREE.Color();

/* ══════════════════ PREGUNTAS AL MUNDO ══════════════════ */
/* La altura del piso en (x, z): calle, banqueta o azotea. */
export function alturaSuelo(x, z, yActual = 0) {
  let h = 0;
  for (const e of edificios) if (x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1 && yActual >= e.h - 0.6) h = Math.max(h, e.h);
  if (h) return h;
  if (enAcera(x, z)) return ACERA_Y;
  return 0;
}
export function enAcera(x, z) {
  for (const bx of MANZANAS) if (Math.abs(x - bx) < MEDIA) for (const bz of MANZANAS) if (Math.abs(z - bz) < MEDIA) return true;
  return Math.abs(Math.abs(x) - 80.25) < 0.75 || Math.abs(Math.abs(z) - 80.25) < 0.75;
}
/* Empuja un círculo (x, z, r) fuera de los edificios que tenga a su altura. */
export function chocarEdificios(o, r, y = 0) {
  let golpe = false;
  for (const e of edificios) {
    if (y >= e.h - 0.05) continue;
    if (o.x + r < e.x0 || o.x - r > e.x1 || o.z + r < e.z0 || o.z - r > e.z1) continue;
    const cx = clamp(o.x, e.x0, e.x1), cz = clamp(o.z, e.z0, e.z1);
    const dx = o.x - cx, dz = o.z - cz, d = Math.hypot(dx, dz);
    if (d === 0) { // adentro: sale por el lado más cercano
      const op = [[e.x0 - r - o.x, 0], [e.x1 + r - o.x, 0], [0, e.z0 - r - o.z], [0, e.z1 + r - o.z]].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]))[0];
      o.x += op[0]; o.z += op[1]; golpe = true; continue;
    }
    if (d < r) { o.x += (dx / d) * (r - d); o.z += (dz / d) * (r - d); golpe = true; }
  }
  return golpe;
}
export function edificioEn(x, z) { for (const e of edificios) if (x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1) return e; return null; }
export function puertaCercana(x, z) {
  let mejor = null, md = 1e9;
  for (const e of edificios) if (e.puerta && !e.especial) { const d = Math.hypot(e.puerta.x - x, e.puerta.z - z); if (d < md) { md = d; mejor = e.puerta; } }
  return mejor;
}
export function faroCercano(x, z) { let m = null, md = 1e9; for (const f of faroles) { const d = Math.hypot(f.x - x, f.z - z); if (d < md) { md = d; m = f; } } return m; }
/* La fachada que tengo enfrente (para la vista desde la banca). */
export function fachadaEnfrente(x, z, dx, dz, max = 45) {
  let mejor = null, md = max;
  for (const f of fachadas) {
    if (f.nx * dx + f.nz * dz > -0.7) continue;   // tiene que mirarme
    const d = (f.ax - x) * f.nx + (f.az - z) * f.nz;   // distancia al plano
    const t = -d;   // a lo largo de mi dirección
    if (t <= 0 || t >= md) continue;
    const px = x + dx * t, pz = z + dz * t, s = (px - f.ax) * f.ux + (pz - f.az) * f.uz;
    if (s < -0.5 || s > f.L + 0.5) continue;
    md = t; mejor = { f, d: t, s };
  }
  return mejor;
}
void CAJA;
