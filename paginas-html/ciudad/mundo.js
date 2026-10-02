/*
 * EL MUNDO — la ciudad dormida en 2.5D.
 *
 * Una cuadrícula de 3 × 3 manzanas con su calle alrededor. En medio, la
 * plaza con su fuente; a la derecha del inicio, Angelos Burger y el
 * edificio de la pareja del K-drama. Todo lo que no se mueve se junta en
 * pocas mallas (una por estilo de fachada, una para el resto), y lo que se
 * repite mucho (farolas, árboles) va instanciado: así cabe una ciudad
 * entera en un teléfono.
 *
 * Unidades: metros. El suelo es y = 0; x hacia la derecha, z hacia el sur.
 */
import { J, THREE, rnd, elegir, clamp, lienzo, textura, brillo, Juntador, CAJA, TAU } from "./base.js";

export const CALLES = [-72, -24, 24, 72];      // ejes de las calles (x y z)
export const MANZANAS = [-48, 0, 48];          // centros de las manzanas
export const MEDIA = 18;                       // media manzana (con banqueta)
export const BANQ = 3;                         // ancho de la banqueta
export const BORDE_MUNDO = 80;                 // hasta dónde se camina
export const ACERA_Y = 0.16;

export const edificios = [];   // { x0, x1, z0, z1, h, puerta: {x,z}, especial }
export const bancas = [];      // { x, z, ry, ocupada }
export const faroles = [];     // { x, z, ry }
export const nodosAcera = [];  // { x, z, vecinos: [] }
export const nodosCalle = [];  // { x, z, vecinos: [] }
export const ventanasEscena = []; // { x, y, z, ry, ancho, alto, escena, encendida… }
export const lugares = {};     // puntos con nombre: inicio, burger, kdrama, plaza, jardin…

/* ══════════════════ LAS TEXTURAS ══════════════════ */
/* Fachada: 8 × 8 ventanas cada 3 m (24 m de textura). El mapa de emisión
   lleva sólo las ventanas prendidas, que son las que se ven de noche. */
const ESTILOS = {
  ladrillo: { muro: "#6a3236", junta: "#4a2024", marco: "#2a1418", vidrio: "#141a30", ladrillo: true },
  deco: { muro: "#2e3058", junta: "#24264a", marco: "#c8b88a", vidrio: "#121630", franjas: true },
  colonial: { muro: "#4f7484", junta: "#3c5c6a", marco: "#e8dcc8", vidrio: "#141c2e", balcon: true },
  vidrio: { muro: "#1d2f48", junta: "#162438", marco: "#2c4462", vidrio: "#0d1626", cristal: true },
};
function pintarFachada(est, semilla) {
  const T = 512, C = T / 8;
  const [c, x] = lienzo(T, T), [e, ex] = lienzo(T, T);
  x.fillStyle = est.muro; x.fillRect(0, 0, T, T);
  ex.fillStyle = "#000"; ex.fillRect(0, 0, T, T);
  if (est.ladrillo) { x.fillStyle = est.junta; for (let y = 0; y < T; y += 8) { x.fillRect(0, y, T, 1); for (let xx = (y / 8) % 2 ? 0 : 8; xx < T; xx += 16) x.fillRect(xx, y, 1, 8); } }
  if (est.franjas) { x.fillStyle = est.junta; for (let k = 0; k < 8; k++) x.fillRect(k * C + C / 2 - 3, 0, 6, T); }
  if (est.cristal) { const g = x.createLinearGradient(0, 0, T, T); g.addColorStop(0, "rgba(140,190,255,.12)"); g.addColorStop(1, "rgba(140,190,255,0)"); x.fillStyle = g; x.fillRect(0, 0, T, T); }
  let s = semilla;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const calidos = ["#ffd38a", "#ffc070", "#ffe0a8", "#ffb880", "#fff0c8", "#c8d8ff", "#ffb0c8"];
  for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 8; fx++) {
    const wx = fx * C + C * 0.22, wy = fy * C + C * 0.18, ww = C * 0.56, wh = C * 0.64;
    if (est.cristal) { x.fillStyle = est.vidrio; x.fillRect(fx * C + 2, fy * C + 4, C - 4, C - 8); }
    x.fillStyle = est.marco; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    x.fillStyle = est.vidrio; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.moveTo(wx, wy + wh * 0.6); x.lineTo(wx + ww * 0.5, wy); x.lineTo(wx + ww * 0.7, wy); x.lineTo(wx, wy + wh); x.fill();
    x.fillStyle = est.marco; x.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    if (est.balcon) { x.strokeStyle = "#1a1a1a"; x.lineWidth = 2; x.strokeRect(wx - 6, wy + wh * 0.72, ww + 12, wh * 0.3); for (let k = 0; k <= 5; k++) { x.beginPath(); x.moveTo(wx - 6 + k * (ww + 12) / 5, wy + wh * 0.72); x.lineTo(wx - 6 + k * (ww + 12) / 5, wy + wh * 1.02); x.stroke(); } }
    else { x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(wx - 4, wy + wh + 3, ww + 8, 4); }
    // ¿prendida? (más o menos la mitad, con cortinas de colores)
    if (r() < 0.42) {
      const col = calidos[Math.floor(r() * calidos.length)];
      const g = ex.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, col); g.addColorStop(1, "#8a5030");
      ex.fillStyle = g; ex.fillRect(wx, wy, ww, wh);
      x.fillStyle = col; x.fillRect(wx, wy, ww, wh);
      if (r() < 0.5) { ex.fillStyle = "rgba(0,0,0,.55)"; ex.fillRect(wx + ww * (r() < 0.5 ? 0 : 0.55), wy, ww * 0.45, wh); }
      if (r() < 0.25) { ex.fillStyle = "rgba(20,10,20,.8)"; const px = wx + ww * (0.25 + r() * 0.5); ex.beginPath(); ex.arc(px, wy + wh * 0.55, 4, 0, TAU); ex.fill(); ex.fillRect(px - 5, wy + wh * 0.62, 10, wh * 0.38); }
      ex.fillStyle = "rgba(0,0,0,.6)"; ex.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    }
  }
  const tc = textura(c, true), te = textura(e, true);
  return { tc, te };
}
/* Planta baja: escaparates, puertas y letreritos, 12 m por textura. */
function pintarTiendas() {
  const [c, x] = lienzo(512, 128), [e, ex] = lienzo(512, 128);
  x.fillStyle = "#2a1e2a"; x.fillRect(0, 0, 512, 128); ex.fillStyle = "#000"; ex.fillRect(0, 0, 512, 128);
  const tonos = ["#ffd090", "#ffb8d0", "#b8e0ff", "#ffe6a0"];
  for (let k = 0; k < 4; k++) {
    const x0 = k * 128;
    x.fillStyle = "#3a2c3a"; x.fillRect(x0 + 6, 22, 116, 100);
    const t = tonos[k];
    const g = ex.createLinearGradient(0, 30, 0, 120); g.addColorStop(0, t); g.addColorStop(1, "#6a3a2a");
    if (k !== 2) { ex.fillStyle = g; ex.fillRect(x0 + 10, 32, 70, 84); x.fillStyle = t; x.fillRect(x0 + 10, 32, 70, 84); ex.fillStyle = "rgba(0,0,0,.5)"; for (let j = 0; j < 3; j++) ex.fillRect(x0 + 14 + j * 22, 92, 14, 24); }
    else { x.fillStyle = "#141420"; x.fillRect(x0 + 10, 32, 70, 84); x.fillStyle = "#5a5a6a"; for (let j = 0; j < 10; j++) x.fillRect(x0 + 10, 34 + j * 8, 70, 2); }
    x.fillStyle = "#0c0a14"; x.fillRect(x0 + 88, 40, 28, 82);
    ex.fillStyle = "rgba(255,200,140,.35)"; ex.fillRect(x0 + 90, 42, 24, 30);
    ex.fillStyle = ["#ff6fa5", "#7ae0ff", "#ffd36a", "#a8ff9a"][k]; ex.font = "bold 13px sans-serif"; ex.fillText(["FLORES", "CAFÉ", "", "PAN"][k], x0 + 16, 18);
    x.fillStyle = ex.fillStyle; x.font = ex.font; x.fillText(["FLORES", "CAFÉ", "", "PAN"][k], x0 + 16, 18);
  }
  return { tc: textura(c, true), te: textura(e, true) };
}
/* El piso: asfalto, rayas, pasos de cebra, alcantarillas y charquitos. */
function pintarSuelo() {
  const T = 2048, L = 180, m = T / L, aP = (v) => (v + L / 2) * m;
  const [c, x] = lienzo(T, T), [r, rx] = lienzo(256, 256);
  x.fillStyle = "#24222f"; x.fillRect(0, 0, T, T);
  for (let i = 0; i < 26000; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)"; x.fillRect(Math.random() * T, Math.random() * T, 2, 2); }
  for (const cc of CALLES) {
    // rayas amarillas del centro y blancas de los lados
    x.fillStyle = "rgba(255,206,110,.75)";
    for (let s = -L / 2; s < L / 2; s += 4) { if (CALLES.some((q) => Math.abs(s + 1 - q) < 7)) continue; x.fillRect(aP(cc) - 2, aP(s), 4, 2 * m); x.fillRect(aP(s), aP(cc) - 2, 2 * m, 4); }
    x.fillStyle = "rgba(230,230,240,.35)";
    for (const lado of [-5.6, 5.6]) for (let s = -L / 2; s < L / 2; s += 1) { if (CALLES.some((q) => Math.abs(s - q) < 6.5)) continue; x.fillRect(aP(cc + lado) - 1, aP(s), 2, m); x.fillRect(aP(s), aP(cc + lado) - 1, m, 2); }
  }
  // pasos de cebra en cada cruce
  x.fillStyle = "rgba(235,235,245,.6)";
  for (const cx of CALLES) for (const cz of CALLES) for (const [dx, dz] of [[0, -8.2], [0, 8.2], [-8.2, 0], [8.2, 0]]) {
    for (let k = -5; k <= 5; k += 1.2) {
      if (dx === 0) x.fillRect(aP(cx + k - 0.3), aP(cz + dz - 1.4), 0.6 * m, 2.8 * m);
      else x.fillRect(aP(cx + dx - 1.4), aP(cz + k - 0.3), 2.8 * m, 0.6 * m);
    }
  }
  // alcantarillas
  for (let i = 0; i < 24; i++) { const cc = elegir(CALLES), s = rnd(-70, 70); const [px, pz] = Math.random() < 0.5 ? [cc + rnd(-3, 3), s] : [s, cc + rnd(-3, 3)]; x.fillStyle = "#121018"; x.beginPath(); x.arc(aP(px), aP(pz), 0.55 * m, 0, TAU); x.fill(); x.strokeStyle = "#3a3646"; x.lineWidth = 2; x.stroke(); }
  // rugosidad: los charcos brillan más
  rx.fillStyle = "#c8c8c8"; rx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const g = rx.createRadialGradient(0, 0, 0, 0, 0, 1); const px = Math.random() * 256, py = Math.random() * 256, rr = rnd(2, 9); const gr = rx.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, "#202020"); gr.addColorStop(1, "rgba(200,200,200,0)"); rx.fillStyle = gr; rx.fillRect(px - rr, py - rr, rr * 2, rr * 2); void g; }
  const t = textura(c); t.anisotropy = 8;
  const tr = new THREE.CanvasTexture(r); tr.wrapS = tr.wrapT = THREE.RepeatWrapping; tr.repeat.set(12, 12);
  return { t, tr };
}

/* ══════════════════ LOS EDIFICIOS ══════════════════ */
/* Una caja con UV en metros (para que las ventanas midan siempre igual). */
function muros(j, x0, x1, z0, z1, y0, y1, tinte, uEsc = 24, vFn = (y) => (y - 4) / 24) {
  const caras = [
    [[x0, z1], [x1, z1], [0, 0, 1]], [[x1, z1], [x1, z0], [1, 0, 0]],
    [[x1, z0], [x0, z0], [0, 0, -1]], [[x0, z0], [x0, z1], [-1, 0, 0]],
  ];
  const col = new THREE.Color(tinte);
  for (const [[ax, az], [bx, bz], n] of caras) {
    const largo = Math.hypot(bx - ax, bz - az), u0 = ((ax + az) * 0.37) % 3;   // desfase para que no todos empiecen igual
    const b = j.base;
    const vs = [[ax, y0, az, u0, y0], [bx, y0, bz, u0 + largo, y0], [bx, y1, bz, u0 + largo, y1], [ax, y1, az, u0, y1]];
    for (const [px, py, pz, u, v] of vs) { j.p.push(px, py, pz); j.n.push(...n); j.c.push(col.r, col.g, col.b); j.u.push(u / uEsc, vFn(v)); }
    j.i.push(b, b + 1, b + 2, b, b + 2, b + 3); j.base += 4;
  }
}
const juntaEstilo = {}, juntaTiendas = new Juntador(), juntaResto = new Juntador(), juntaBrillo = new Juntador();
function hacerEdificio(x0, x1, z0, z1, h, estilo, frente, especial) {
  const tintes = { ladrillo: ["#ffffff", "#f0d8d8", "#e8e0ff"], deco: ["#ffffff", "#e0e8ff", "#f4e0ff"], colonial: ["#ffffff", "#ffd8e8", "#fff0d0", "#d8ffe8"], vidrio: ["#ffffff", "#d8e8ff"] };
  const j = juntaEstilo[estilo] || (juntaEstilo[estilo] = new Juntador());
  muros(j, x0, x1, z0, z1, 4, h, elegir(tintes[estilo]));
  // la planta baja, un poquito salida
  const sal = 0.15;
  if (especial !== "burger") muros(juntaTiendas, x0 - sal, x1 + sal, z0 - sal, z1 + sal, 0, 4, "#ffffff", 12, (y) => y / 4);
  // azotea, cornisa y cosas en el techo
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  juntaResto.caja(cx, h + 0.15, cz, w + 0.4, 0.3, d + 0.4, estilo === "deco" ? "#c8b88a" : "#2a2232");
  juntaResto.caja(cx, h - 0.02, cz, w, 0.04, d, "#1c1824");
  juntaResto.caja(cx, 4.05, cz, w + 0.5, 0.18, d + 0.5, "#3a2e3a");
  if (Math.random() < 0.55) { const tx = cx + rnd(-w / 4, w / 4), tz = cz + rnd(-d / 4, d / 4); juntaResto.caja(tx, h + 1.6, tz, 2.2, 2.4, 2.2, "#3a3040"); juntaResto.caja(tx, h + 3, tz, 2.6, 0.4, 2.6, "#4a3e50"); for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) juntaResto.caja(tx + a, h + 0.4, tz + b, 0.15, 0.8, 0.15, "#2a2030"); }
  for (let k = 0; k < Math.floor(rnd(1, 4)); k++) juntaResto.caja(cx + rnd(-w / 3, w / 3), h + 0.5, cz + rnd(-d / 3, d / 3), 1.2, 0.8, 0.9, "#8a8a9a");
  if (Math.random() < 0.3) { const ax = cx + rnd(-w / 3, w / 3), az = cz + rnd(-d / 3, d / 3); juntaResto.caja(ax, h + 3, az, 0.12, 6, 0.12, "#2a2a34"); juntaBrillo.caja(ax, h + 6.1, az, 0.3, 0.3, 0.3, "#ff3a4a"); }
  // un toldo de vez en cuando
  if (!especial && Math.random() < 0.45 && frente) {
    const [fx, fz] = frente, ancho = Math.abs(fx) > 0 ? d : w, col = elegir(["#c8384a", "#3a6a8a", "#4a8a5a", "#c88a3a", "#8a4ac0"]);
    if (fx) juntaResto.caja(fx > 0 ? x1 + 0.9 : x0 - 0.9, 3.6, cz, 1.6, 0.12, ancho * 0.7, col, 0);
    else juntaResto.caja(cx, 3.6, fz > 0 ? z1 + 0.9 : z0 - 0.9, ancho * 0.7, 0.12, 1.6, col, 0);
  }
  const puerta = frente ? { x: frente[0] ? (frente[0] > 0 ? x1 + 1.5 : x0 - 1.5) : cx + rnd(-w / 4, w / 4), z: frente[1] ? (frente[1] > 0 ? z1 + 1.5 : z0 - 1.5) : cz + rnd(-d / 4, d / 4) } : null;
  const ed = { x0, x1, z0, z1, h, estilo, puerta, frente, especial };
  edificios.push(ed);
  return ed;
}

/* ══════════════════ LA CUADRÍCULA ══════════════════ */
function construirCuadricula() {
  const estilos = ["ladrillo", "deco", "colonial", "vidrio"];
  for (const bx of MANZANAS) for (const bz of MANZANAS) {
    // la banqueta y su guarnición
    juntaResto.caja(bx, ACERA_Y / 2, bz, MEDIA * 2, ACERA_Y, MEDIA * 2, "#3c3a4e");
    for (const [dx, dz, w, d] of [[0, MEDIA, MEDIA * 2, 0.3], [0, -MEDIA, MEDIA * 2, 0.3], [MEDIA, 0, 0.3, MEDIA * 2], [-MEDIA, 0, 0.3, MEDIA * 2]]) juntaResto.caja(bx + dx, ACERA_Y / 2 + 0.01, bz + dz, w, ACERA_Y + 0.02, d, "#56526a");
    const n = nodosAcera.length, r = MEDIA - 1.5;
    nodosAcera.push({ x: bx - r, z: bz - r, vecinos: [] }, { x: bx + r, z: bz - r, vecinos: [] }, { x: bx + r, z: bz + r, vecinos: [] }, { x: bx - r, z: bz + r, vecinos: [] });
    for (let k = 0; k < 4; k++) { nodosAcera[n + k].vecinos.push(n + (k + 1) % 4, n + (k + 3) % 4); nodosAcera[n + k].manzana = [bx, bz]; }
    if (bx === 0 && bz === 0) { construirPlaza(); continue; }
    const especial = bx === 48 && bz === 0;
    // edificios a lo largo de los cuatro lados
    const lados = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [fx, fz] of lados) {
      let s = -15;
      while (s < 15 - 1) {
        let w = Math.min(15 - s, rnd(8, 13)); if (15 - s - w < 6) w = 15 - s;
        const h = elegir([9, 12, 15, 18, 21, 27, 33]) + rnd(-1, 1);
        const est = elegir(estilos), prof = 11;
        let x0, x1, z0, z1;
        if (fz) { x0 = bx + s; x1 = bx + s + w; z0 = fz > 0 ? bz + 15 - prof : bz - 15; z1 = z0 + prof; }
        else { z0 = bz + s; z1 = bz + s + w; x0 = fx > 0 ? bx + 15 - prof : bx - 15; x1 = x0 + prof; }
        // la esquina de Angelos Burger y del K-drama: se quedan libres
        const libre = especial && fx === -1;
        if (!libre) hacerEdificio(x0, x1, z0, z1, h, est, [fx, fz]);
        s += w;
      }
    }
    juntaResto.caja(bx, 6, bz, 8, 12, 8, "#1a1622");
    if (especial) construirBurgerYKdrama(bx, bz);
  }
  // los cruces peatonales unen las esquinas de manzanas vecinas
  const buscar = (x, z) => nodosAcera.findIndex((q) => Math.abs(q.x - x) < 0.1 && Math.abs(q.z - z) < 0.1);
  for (const q of nodosAcera.slice()) {
    for (const [dx, dz] of [[15, 0], [0, 15]]) {
      const k = buscar(q.x + dx, q.z + dz); const a = nodosAcera.indexOf(q);
      if (k >= 0) { nodosAcera[a].vecinos.push(k); nodosAcera[k].vecinos.push(a); nodosAcera[a].cruce = nodosAcera[a].cruce || []; }
    }
  }
  // la calle de los coches: un nodo por cruce
  for (const x of CALLES) for (const z of CALLES) nodosCalle.push({ x, z, vecinos: [] });
  for (const a of nodosCalle) for (const b of nodosCalle) if (a !== b && ((a.x === b.x && Math.abs(a.z - b.z) === 48) || (a.z === b.z && Math.abs(a.x - b.x) === 48))) a.vecinos.push(nodosCalle.indexOf(b));
  // los edificios de la orilla, para que la ciudad no se acabe en la nada
  for (const lado of [-1, 1]) for (let s = -84; s < 84; s += rnd(10, 16)) {
    const w = rnd(9, 15), h = rnd(14, 40), est = elegir(estilos);
    hacerEdificio(lado * 80 - (lado > 0 ? 0 : 12), lado * 80 + (lado > 0 ? 12 : 0), s, s + w, h, est, null);
    hacerEdificio(s, s + w, lado * 80 - (lado > 0 ? 0 : 12), lado * 80 + (lado > 0 ? 12 : 0), h * rnd(0.8, 1.1), est, null);
  }
  for (const lado of [-1, 1]) { juntaResto.caja(lado * 79, ACERA_Y / 2, 0, 2, ACERA_Y, 168, "#3c3a4e"); juntaResto.caja(0, ACERA_Y / 2, lado * 79, 168, ACERA_Y, 2, "#3c3a4e"); }
}

/* La plaza: la fuente, las bancas, los árboles, la estatua y los faroles. */
const arboles = [];
function construirPlaza() {
  juntaResto.caja(0, ACERA_Y + 0.01, 0, 30, 0.02, 30, "#4a4458");
  for (let k = -14; k <= 14; k += 2) { juntaResto.caja(k, ACERA_Y + 0.02, 0, 0.06, 0.02, 30, "#3e3a4c"); juntaResto.caja(0, ACERA_Y + 0.02, k, 30, 0.02, 0.06, "#3e3a4c"); }
  // la fuente
  const cil = new THREE.CylinderGeometry(1, 1, 1, 28);
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(0, 0.5, 0), new THREE.Quaternion(), new THREE.Vector3(5, 0.7, 5)); juntaResto.meter(cil, m, "#8a8098");
  m.compose(new THREE.Vector3(0, 0.75, 0), new THREE.Quaternion(), new THREE.Vector3(4.5, 0.3, 4.5)); juntaResto.meter(cil, m, "#2a3a58");
  m.compose(new THREE.Vector3(0, 1.5, 0), new THREE.Quaternion(), new THREE.Vector3(0.5, 2, 0.5)); juntaResto.meter(cil, m, "#9a90a8");
  m.compose(new THREE.Vector3(0, 2.5, 0), new THREE.Quaternion(), new THREE.Vector3(1.6, 0.25, 1.6)); juntaResto.meter(cil, m, "#9a90a8");
  // la estatua (con su secreto)
  m.compose(new THREE.Vector3(0, 3.2, 0), new THREE.Quaternion(), new THREE.Vector3(0.35, 1.2, 0.35)); juntaResto.meter(cil, m, "#7a8a84");
  edificios.push({ x0: -5, x1: 5, z0: -5, z1: 5, h: 0.9, fuente: true });
  for (const [x, z, ry] of [[-9, -4, Math.PI / 2], [-9, 4, Math.PI / 2], [9, -4, -Math.PI / 2], [9, 4, -Math.PI / 2], [-4, 9, Math.PI], [4, 9, Math.PI], [-4, -9, 0], [4, -9, 0]]) bancas.push({ x, z, ry, ocupada: null });
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11], [-12, 0], [12, 0], [0, -12], [0, 12]]) arboles.push({ x, z, s: rnd(0.9, 1.25) });
  for (const [x, z] of [[-6, -12], [6, 12], [12, -6], [-12, 6]]) faroles.push({ x, z, ry: 0 });
  lugares.plaza = { x: 0, z: 0 };
  // flores
  for (let k = 0; k < 60; k++) { const a = rnd(TAU), r = rnd(6, 7.2); juntaBrillo.caja(Math.cos(a) * r, ACERA_Y + 0.15, Math.sin(a) * r, 0.18, 0.18, 0.18, elegir(["#ff6fa5", "#ffd36a", "#ffffff", "#c89aff"])); juntaResto.caja(Math.cos(a) * r, ACERA_Y + 0.06, Math.sin(a) * r, 0.25, 0.12, 0.25, "#2f5a3a"); }
}

/* Angelos Burger y, al lado, el edificio de la pareja del K-drama. */
function construirBurgerYKdrama(bx, bz) {
  const x0 = bx - 15, fx = x0;    // la fachada mira hacia x negativa (la calle x = 24)
  // ── Angelos Burger: z de -9 a 5, dos pisos ──
  const bz0 = bz - 9, bz1 = bz + 5;
  const ed = hacerEdificio(x0, x0 + 11, bz0, bz1, 9.5, "ladrillo", [-1, 0], "burger");
  lugares.burger = { x: fx - 1.6, z: (bz0 + bz1) / 2, frente: fx, z0: bz0, z1: bz1, ed };
  // ── el edificio del K-drama: z de 5 a 15 ──
  const ek = hacerEdificio(x0, x0 + 11, bz + 5, bz + 15, 18, "colonial", [-1, 0], "kdrama");
  lugares.kdrama = { x: fx - 0.05, y: 6.6, z: bz + 10, ed: ek };
  // y del otro lado del Burger, uno más
  hacerEdificio(x0, x0 + 11, bz - 15, bz0, 24, "deco", [-1, 0]);
  lugares.inicio = { x: fx - 1.6, z: bz + 8 };
}

/* Los faroles de las banquetas, los árboles y las bancas de las calles. */
function construirMobiliario() {
  for (const bx of MANZANAS) for (const bz of MANZANAS) {
    for (const s of [-10, 6]) for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = fz ? bx + s : bx + fx * (MEDIA - 0.6), z = fz ? bz + fz * (MEDIA - 0.6) : bz + s;
      faroles.push({ x, z, ry: Math.atan2(fx, fz) });
    }
    if (bx === 0 && bz === 0) continue;
    for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const s = rnd(-12, 12), x = fz ? bx + s : bx + fx * (MEDIA - 0.9), z = fz ? bz + fz * (MEDIA - 0.9) : bz + s;
      const frenteBurger = bx === 48 && bz === 0 && fx === -1;   // la banqueta del Burger y del K-drama, despejada
      if (Math.random() < 0.7 && !frenteBurger) arboles.push({ x, z, s: rnd(0.7, 1) });
      const s2 = s + (s > 0 ? -5 : 5), x2 = fz ? bx + s2 : bx + fx * (MEDIA - 1.1), z2 = fz ? bz + fz * (MEDIA - 1.1) : bz + s2;
      if (Math.random() < 0.55) bancas.push({ x: x2, z: z2, ry: Math.atan2(-fx, -fz), ocupada: null });
    }
  }
}

/* ══════════════════ EL CIELO ══════════════════ */
export const luna = { dir: new THREE.Vector3(-0.35, 0.42, -0.84).normalize(), dist: 340, r: 26, malla: null, halo: null, grietas: null, gx: null, estado: "entera", t: 0 };
function construirCielo(esc) {
  const geo = new THREE.SphereGeometry(450, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uArriba: { value: new THREE.Color("#060920") }, uMedio: { value: new THREE.Color("#1a1a46") }, uHorizonte: { value: new THREE.Color("#5a3466") }, uRojo: { value: 0 } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 uArriba,uMedio,uHorizonte; uniform float uRojo; varying vec3 vP; void main(){ float h = clamp(vP.y,0.0,1.0); vec3 c = mix(uHorizonte, uMedio, smoothstep(0.0,0.25,h)); c = mix(c, uArriba, smoothstep(0.25,0.8,h)); c = mix(c, vec3(0.35,0.06,0.12), uRojo*(1.0-h)*0.8); gl_FragColor = vec4(c,1.0); }",
  });
  const cielo = new THREE.Mesh(geo, mat); cielo.renderOrder = -10; esc.add(cielo);
  J.cieloMat = mat;
  // estrellas
  const n = 1800, pos = new Float32Array(n * 3), tam = new Float32Array(n), fase = new Float32Array(n);
  for (let i = 0; i < n; i++) { const y = rnd(0.08, 1), a = rnd(TAU), r = Math.sqrt(1 - y * y); pos.set([Math.cos(a) * r * 420, y * 420, Math.sin(a) * r * 420], i * 3); tam[i] = Math.random() < 0.1 ? rnd(3, 5) : rnd(1, 2.4); fase[i] = rnd(TAU); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); eg.setAttribute("tam", new THREE.BufferAttribute(tam, 1)); eg.setAttribute("fase", new THREE.BufferAttribute(fase, 1));
  const em = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uLuz: { value: 1 }, uDpr: { value: 1 } },
    vertexShader: "attribute float tam; attribute float fase; uniform float uT, uDpr; varying float vA; void main(){ vA = 0.55 + 0.45*sin(uT*(0.6+fase*0.3)+fase*7.0); vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = tam*uDpr; gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform float uLuz; varying float vA; void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(1.0,0.96,0.98), a*vA*uLuz); }",
  });
  const est = new THREE.Points(eg, em); est.renderOrder = -9; esc.add(est); J.estrellasMat = em;
  // la luna: un disco con su textura, un halo y su capa de grietas
  const [c, x] = lienzo(256, 256);
  const g = x.createRadialGradient(100, 96, 10, 128, 128, 126); g.addColorStop(0, "#fffdf0"); g.addColorStop(0.7, "#f2e6c8"); g.addColorStop(1, "#d8c8a4");
  x.fillStyle = g; x.beginPath(); x.arc(128, 128, 126, 0, TAU); x.fill();
  x.fillStyle = "rgba(170,150,120,.32)"; for (const [a, b, r] of [[90, 100, 26], [160, 150, 20], [140, 80, 14], [80, 170, 16], [180, 100, 10], [110, 140, 9]]) { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); }
  const tluna = textura(c);
  luna.malla = new THREE.Mesh(new THREE.CircleGeometry(luna.r, 48), new THREE.MeshBasicMaterial({ map: tluna, transparent: true, fog: false, depthWrite: false }));
  luna.malla.renderOrder = -8;
  const [gc, gx] = lienzo(256, 256); luna.gx = gx; luna.gc = gc;
  luna.grietas = new THREE.Mesh(new THREE.CircleGeometry(luna.r * 1.001, 48), new THREE.MeshBasicMaterial({ map: textura(gc), transparent: true, fog: false, depthWrite: false }));
  luna.grietas.renderOrder = -7;
  luna.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,240,210,.55)"], [0.35, "rgba(255,220,200,.16)"], [1, "rgba(255,200,220,0)"]], 128), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  luna.halo.scale.set(luna.r * 9, luna.r * 9, 1); luna.halo.renderOrder = -9;
  esc.add(luna.halo, luna.malla, luna.grietas);
  // el horizonte de ciudad, en 2D y en dos capas que se mueven distinto
  for (const [r, alto, tono, dens, vy] of [[300, 90, "#151634", 0.1, -4], [230, 64, "#1d1b3e", 0.16, -2]]) {
    const [hc, hx] = lienzo(2048, 256);
    hx.clearRect(0, 0, 2048, 256);
    let px = 0;
    while (px < 2048) { const bw = rnd(20, 70), bh = rnd(60, 240); hx.fillStyle = tono; hx.fillRect(px, 256 - bh, bw, bh); if (Math.random() < 0.15) hx.fillRect(px + bw / 2, 256 - bh - 30, 3, 30); for (let yy = 256 - bh + 6; yy < 250; yy += 10) for (let xx = px + 4; xx < px + bw - 4; xx += 8) if (Math.random() < dens) { hx.fillStyle = `rgba(255,${(rnd(190, 230)) | 0},140,${rnd(0.3, 0.8)})`; hx.fillRect(xx, yy, 3, 4); hx.fillStyle = tono; } px += bw + rnd(0, 6); }
    const t = textura(hc); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, alto, 64, 1, true), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }));
    anillo.position.y = alto / 2 + vy; anillo.renderOrder = -6; esc.add(anillo);
  }
}
export function colocarLuna(cam) {
  const p = cam.position;
  const x = p.x + luna.dir.x * luna.dist, y = p.y + luna.dir.y * luna.dist, z = p.z + luna.dir.z * luna.dist;
  const sx = luna.sx || 0, sy = luna.sy || 0;
  for (const m of [luna.malla, luna.grietas, luna.halo]) { m.position.set(x + sx, y + sy, z); m.quaternion.copy(cam.quaternion); }
  luna.pos = luna.malla.position;
  if (J.cieloSigue) J.cieloSigue(p, cam);
}

/* ══════════════════ LAS VENTANAS CON ESCENA ══════════════════
   Las 83 escenas de «Enciende las luces» viven en ventanas de verdad, en
   los pisos bajos de las calles más cercanas. Van en una sola malla
   instanciada: oscuras, se ven como cualquier ventana; prendidas, brillan. */
function repartirVentanas(ESCENAS) {
  const cand = [];
  for (const e of edificios) {
    if (!e.frente || e.especial) continue;
    const [fx, fz] = e.frente, largo = fz ? e.x1 - e.x0 : e.z1 - e.z0;
    const dCentro = Math.hypot((e.x0 + e.x1) / 2 - 33, (e.z0 + e.z1) / 2);
    for (let piso = 0; piso < Math.min(3, Math.floor((e.h - 4) / 3)); piso++) for (let s = 1.5; s < largo - 1; s += 3) {
      if (Math.random() < 0.4) continue;
      const y = 4 + 1.5 + piso * 3;
      let x, z, ry;
      if (fz) { x = e.x0 + s; z = fz > 0 ? e.z1 + 0.06 : e.z0 - 0.06; ry = fz > 0 ? 0 : Math.PI; }
      else { z = e.z0 + s; x = fx > 0 ? e.x1 + 0.06 : e.x0 - 0.06; ry = fx > 0 ? Math.PI / 2 : -Math.PI / 2; }
      cand.push({ x, y, z, ry, d: dCentro + piso * 6 + rnd(0, 20) });
    }
  }
  cand.sort((a, b) => a.d - b.d);
  const mezcla = [...ESCENAS].sort(() => Math.random() - 0.5);
  mezcla.forEach((esc, k) => { const c = cand[k]; if (c) ventanasEscena.push({ ...c, ancho: 1.7, alto: 1.95, escena: esc, encendida: false, luz: 0, vez: 0, t: 0 }); });
}

/* ══════════════════ ARMARLO TODO ══════════════════ */
export const materiales = {};
export function construirMundo(esc, ESCENAS) {
  construirCuadricula();
  construirMobiliario();
  repartirVentanas(ESCENAS);
  const sombras = J.calidad.sombras;
  // las fachadas, una malla por estilo
  let semilla = 11;
  for (const [nombre, j] of Object.entries(juntaEstilo)) {
    const { tc, te } = pintarFachada(ESTILOS[nombre], (semilla += 997));
    const mat = new THREE.MeshStandardMaterial({ map: tc, emissiveMap: te, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 1.15, vertexColors: true, roughness: 0.82, metalness: nombre === "vidrio" ? 0.3 : 0 });
    materiales["fachada_" + nombre] = mat;
    const m = new THREE.Mesh(j.geometria(), mat); m.castShadow = sombras; m.receiveShadow = sombras; esc.add(m);
  }
  const { tc, te } = pintarTiendas();
  const mt = new THREE.Mesh(juntaTiendas.geometria(), new THREE.MeshStandardMaterial({ map: tc, emissiveMap: te, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 1.25, roughness: 0.6 }));
  mt.receiveShadow = sombras; esc.add(mt);
  const mr = new THREE.Mesh(juntaResto.geometria(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
  mr.castShadow = sombras; mr.receiveShadow = sombras; esc.add(mr);
  const mb = new THREE.Mesh(juntaBrillo.geometria(), new THREE.MeshBasicMaterial({ vertexColors: true }));
  esc.add(mb);
  // el suelo
  const { t, tr } = pintarSuelo();
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshStandardMaterial({ map: t, roughnessMap: tr, roughness: 0.75, metalness: 0.15 }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = sombras; esc.add(suelo); materiales.suelo = suelo.material;
  const lejos = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: "#14121e", roughness: 1 }));
  lejos.rotation.x = -Math.PI / 2; lejos.position.y = -0.02; esc.add(lejos);
  // los faroles, instanciados: poste, brazo, lámpara y halo
  const nF = faroles.length, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  const poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.11, 5, 8).translate(0, 2.5, 0), new THREE.MeshStandardMaterial({ color: "#1c1a28", roughness: 0.5, metalness: 0.6 }), nF);
  const brazo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 1.3).translate(0, 4.95, 0.6), poste.material, nF);
  const lamp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 12, 8).translate(0, 4.8, 1.2), new THREE.MeshBasicMaterial({ color: "#ffe2a8" }), nF);
  const halos = new Float32Array(nF * 3);
  faroles.forEach((f, i) => { Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.ry + Math.PI); P.set(f.x, ACERA_Y, f.z); M.compose(P, Q, S); poste.setMatrixAt(i, M); brazo.setMatrixAt(i, M); lamp.setMatrixAt(i, M); const lx = f.x - Math.sin(f.ry) * 1.2, lz = f.z - Math.cos(f.ry) * 1.2; f.lx = lx; f.lz = lz; halos.set([lx, ACERA_Y + 4.8, lz], i * 3); });
  poste.castShadow = sombras; esc.add(poste, brazo, lamp);
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.BufferAttribute(halos, 3));
  const halo = new THREE.Points(hg, new THREE.PointsMaterial({ size: 5.5, map: brillo([[0, "rgba(255,236,190,.95)"], [0.25, "rgba(255,210,150,.35)"], [1, "rgba(255,200,140,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  esc.add(halo);
  // charquitos de luz bajo cada farol (un disco aditivo instanciado)
  const charco = new THREE.InstancedMesh(new THREE.CircleGeometry(3.4, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: brillo([[0, "rgba(255,200,140,.3)"], [1, "rgba(255,200,140,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), nF);
  faroles.forEach((f, i) => { M.makeTranslation(f.lx, ACERA_Y + 0.02, f.lz); charco.setMatrixAt(i, M); });
  esc.add(charco);
  // los árboles, instanciados con un tono propio cada uno
  const nA = arboles.length;
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 2.6, 7).translate(0, 1.3, 0), new THREE.MeshStandardMaterial({ color: "#3a2a22", roughness: 1 }), nA);
  const copaG = new THREE.IcosahedronGeometry(1.5, 1);
  const copa = new THREE.InstancedMesh(copaG, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, flatShading: true }), nA * 3);
  let k = 0;
  arboles.forEach((a, i) => {
    M.compose(P.set(a.x, ACERA_Y, a.z), Q.identity(), S.set(a.s, a.s, a.s)); tronco.setMatrixAt(i, M);
    for (const [dx, dy, dz, s] of [[0, 3.6, 0, 1], [-0.7, 3.1, 0.3, 0.7], [0.6, 3.2, -0.4, 0.75]]) {
      M.compose(P.set(a.x + dx * a.s, ACERA_Y + dy * a.s, a.z + dz * a.s), Q.setFromEuler(new THREE.Euler(rnd(TAU), rnd(TAU), 0)), S.set(s * a.s, s * a.s * 0.9, s * a.s));
      copa.setMatrixAt(k, M); copa.setColorAt(k, new THREE.Color(elegir(["#1e3a2a", "#24442e", "#1a3424", "#2a4a30"]))); k++;
    }
  });
  tronco.castShadow = copa.castShadow = sombras; esc.add(tronco, copa);
  J.arboles = arboles;
  // foquitos de colores en los árboles de la plaza
  const fq = [];
  for (const a of arboles) if (Math.abs(a.x) < 15 && Math.abs(a.z) < 15) for (let i = 0; i < 14; i++) { const q = rnd(TAU), r = rnd(1, 1.6) * a.s; fq.push(a.x + Math.cos(q) * r, ACERA_Y + (3 + rnd(-0.8, 1)) * a.s, a.z + Math.sin(q) * r); }
  const fqG = new THREE.BufferGeometry(); fqG.setAttribute("position", new THREE.Float32BufferAttribute(fq, 3));
  const cols = []; for (let i = 0; i < fq.length / 3; i++) { const c = new THREE.Color(elegir(["#ffd36a", "#ff8ac0", "#8ad8ff", "#b8ff9a"])); cols.push(c.r, c.g, c.b); }
  fqG.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  J.foquitos = new THREE.Points(fqG, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, map: brillo([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,255,255,.5)"], [1, "rgba(255,255,255,0)"]], 32), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  esc.add(J.foquitos);
  // las bancas (fijas)
  const banca = new Juntador();
  for (const b of bancas) {
    const c = Math.cos(b.ry), s = Math.sin(b.ry);
    const pon = (dx, dy, dz, w, h, d, col) => banca.caja(b.x + dx * c + dz * s, ACERA_Y + dy, b.z - dx * s + dz * c, w, h, d, col, b.ry);
    pon(0, 0.45, 0, 1.8, 0.08, 0.5, "#8a5a32"); pon(0, 0.8, -0.24, 1.8, 0.35, 0.06, "#8a5a32");
    pon(-0.8, 0.22, 0, 0.08, 0.45, 0.45, "#2a2a30"); pon(0.8, 0.22, 0, 0.08, 0.45, 0.45, "#2a2a30");
  }
  const mBanca = new THREE.Mesh(banca.geometria(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  mBanca.castShadow = sombras; esc.add(mBanca);
  construirCielo(esc);
}

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
  return Math.abs(Math.abs(x) - 79) < 1 || Math.abs(Math.abs(z) - 79) < 1;
}
/* Empuja un círculo (x, z, r) fuera de los edificios que tenga a su altura. */
export function chocarEdificios(o, r, y = 0) {
  let golpe = false;
  for (const e of edificios) {
    if (y >= e.h - 0.05) continue;
    if (o.x + r < e.x0 || o.x - r > e.x1 || o.z + r < e.z0 || o.z - r > e.z1) continue;
    const cx = clamp(o.x, e.x0, e.x1), cz = clamp(o.z, e.z0, e.z1);
    let dx = o.x - cx, dz = o.z - cz, d = Math.hypot(dx, dz);
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
void CAJA;
