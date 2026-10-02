/*
 * EL CICLO — día, tarde y noche.
 *
 * Una hora del juego (0–24) avanza sola, despacito (un día entero son
 * unos 16 minutos). De ella sale todo lo demás, interpolado entre
 * «fotografías» del cielo a cada hora: los colores del cielo y de la
 * niebla, el sol (que de noche le pasa la luz a la luna), el rebote del
 * cielo y del piso, cuántas ventanas tienen la luz prendida, cuándo se
 * encienden las farolas y cuántas estrellas se ven.
 *
 * El botón 🕒 salta a la siguiente parte del día (día → tarde → noche)
 * sin cortes: la hora corre rápido hasta llegar, y todo se mueve con ella.
 */
import { J, THREE, clamp, lerp } from "./base.js";

const C = (h) => new THREE.Color(h);
/* hora, cielo arriba/medio/horizonte, luz del sol (color, fuerza), luz de luna, cielo y piso del rebote (y su fuerza),
   niebla (color, densidad), ventanas prendidas, farolas, estrellas, nubes (color) */
const FOTOS = [
  [0, "#04061a", "#10143e", "#2a2250", "#000000", 0, 0.62, "#5a66c0", "#1e1830", 0.5, "#1a1736", 0.0105, 0.85, 1, 1, "#272a4e"],
  [4.6, "#05071c", "#121842", "#30264e", "#000000", 0, 0.6, "#5a66c0", "#1e1830", 0.5, "#1c1838", 0.0105, 0.3, 1, 1, "#272a4e"],
  [5.7, "#0e1438", "#2a3270", "#86587a", "#ff8a6a", 0.15, 0.35, "#6a6cb8", "#2a2030", 0.55, "#3a2e50", 0.0085, 0.35, 1, 0.55, "#5a4a6a"],
  [6.7, "#3a5aa0", "#8aa2d4", "#ffb48c", "#ffb27a", 1.4, 0, "#a8b4e2", "#6a5048", 0.85, "#c8a2a8", 0.006, 0.18, 0.25, 0, "#ffc8b0"],
  [8.6, "#3a78d0", "#7ab2e8", "#d2e4f2", "#fff0d8", 2.7, 0, "#b8d8ff", "#7a6a58", 1.05, "#b8d0e8", 0.0042, 0, 0, 0, "#ffffff"],
  [13, "#2e6cc8", "#68a8ea", "#dceef8", "#fff8ee", 3.0, 0, "#c0dcff", "#806e5a", 1.1, "#c0d8ee", 0.004, 0, 0, 0, "#ffffff"],
  [16.6, "#3a6ac0", "#82aae0", "#f2dcc0", "#ffe2b4", 2.6, 0, "#bcd0f0", "#7a6650", 1.0, "#d2cac2", 0.0048, 0.05, 0, 0, "#fff4e8"],
  [18.2, "#4a5aa8", "#c892aa", "#ff9c5a", "#ff9452", 1.9, 0, "#c8a2c2", "#5a3a40", 0.85, "#d89c8a", 0.0062, 0.45, 0.55, 0, "#ffb08a"],
  [19.2, "#1e2462", "#6a4a8c", "#e2728c", "#ff6a6a", 0.35, 0.2, "#8a7cba", "#2a2032", 0.66, "#5a3c6a", 0.0085, 0.8, 1, 0.3, "#8a5a8a"],
  [20.4, "#070a22", "#181a4a", "#3a2a5a", "#000000", 0, 0.62, "#5c66c0", "#1e1830", 0.52, "#241e44", 0.0098, 1, 1, 1, "#2e2e56"],
  [22.6, "#05081e", "#141844", "#30265a", "#000000", 0, 0.62, "#5a66c0", "#1e1830", 0.5, "#1e1a3c", 0.0102, 0.95, 1, 1, "#2a2c52"],
];
const LLAVES = ["arriba", "medio", "horizonte", "solColor", "solFuerza", "lunaFuerza", "hemiCielo", "hemiSuelo", "hemiFuerza", "niebla", "densidad", "ventanas", "farolas", "estrellas", "nubes"];
const fotos = FOTOS.map((f) => { const o = { h: f[0] }; LLAVES.forEach((k, i) => { const v = f[i + 1]; o[k] = typeof v === "string" ? C(v) : v; }); return o; });

export const ciclo = {
  hora: 18.1, velocidad: 1 / 60, meta: null,     // 1 hora del juego = 60 s de verdad
  arriba: C("#000"), medio: C("#000"), horizonte: C("#000"), solColor: C("#000"), hemiCielo: C("#000"), hemiSuelo: C("#000"), niebla: C("#000"), nubes: C("#000"),
  solFuerza: 0, lunaFuerza: 0, hemiFuerza: 0, densidad: 0.01, ventanas: 0, farolas: 0, estrellas: 0,
  sol: new THREE.Vector3(), luz: new THREE.Vector3(), luzFuerza: 0, luzColor: C("#fff"), dia: 0, noche: 0,
  fase: "tarde",
};
J.ciclo = ciclo;

function mezclar(h) {
  let a = fotos[fotos.length - 1], b = fotos[0], ha = a.h - 24, hb = b.h;
  for (let i = 0; i < fotos.length; i++) {
    const f = fotos[i], g = fotos[(i + 1) % fotos.length], hg = i + 1 < fotos.length ? g.h : g.h + 24;
    if (h >= f.h && h < hg) { a = f; b = g; ha = f.h; hb = hg; break; }
  }
  if (h < fotos[0].h) { a = fotos[fotos.length - 1]; b = fotos[0]; ha = a.h - 24; hb = b.h; }
  let k = clamp((h - ha) / (hb - ha), 0, 1); k = k * k * (3 - 2 * k);
  for (const n of LLAVES) {
    if (a[n].isColor) ciclo[n].copy(a[n]).lerp(b[n], k);
    else ciclo[n] = lerp(a[n], b[n], k);
  }
}

/* Hacia dónde está el sol a esta hora (sale por +x, se pone por −x). */
function posicionSol(h, v) {
  const th = (h - 6.2) / 12.6 * Math.PI;
  v.set(Math.cos(th) * 0.82, Math.sin(th) * 0.95, 0.38).normalize();
  return v;
}

const DIR_LUNA = new THREE.Vector3(-0.35, 0.42, -0.84).normalize();
const PARTES = [["dia", 11.5], ["tarde", 18.0], ["noche", 21.5]];
/* El botón 🕒: a la siguiente parte del día, corriendo (sin cortes). */
export function siguienteParte() {
  const i = PARTES.findIndex((p) => p[0] === ciclo.fase);
  const [nombre, h] = PARTES[(i + 1) % PARTES.length];
  ciclo.meta = h; ciclo.fase = nombre;
  return nombre;
}
export function irA(nombre) { const p = PARTES.find((q) => q[0] === nombre); if (p) { ciclo.hora = p[1]; ciclo.fase = nombre; ciclo.meta = null; } }

export function actualizarCiclo(dt) {
  if (ciclo.meta != null) {
    // correr la hora hacia la meta (siempre hacia adelante)
    let falta = ciclo.meta - ciclo.hora; if (falta < 0) falta += 24;
    const paso = Math.min(falta, dt * Math.max(1.2, falta * 1.1));
    ciclo.hora += paso;
    if (falta - paso < 0.01) ciclo.meta = null;
  } else ciclo.hora += dt * ciclo.velocidad;
  ciclo.hora %= 24;
  const h = ciclo.hora;
  if (ciclo.meta == null) ciclo.fase = h >= 7 && h < 17 ? "dia" : h >= 17 && h < 20 ? "tarde" : "noche";
  mezclar(h);
  posicionSol(h, ciclo.sol);
  const y = ciclo.sol.y;
  const solK = clamp(y / 0.12, 0, 1), lunaK = clamp((-0.02 - y) / 0.14, 0, 1);
  ciclo.dia = clamp(y / 0.25 + 0.15, 0, 1);
  ciclo.noche = 1 - clamp((y + 0.12) / 0.3, 0, 1);
  if (solK >= lunaK) { ciclo.luz.copy(ciclo.sol); ciclo.luzColor.copy(ciclo.solColor); ciclo.luzFuerza = ciclo.solFuerza * solK; }
  else { ciclo.luz.copy(DIR_LUNA); ciclo.luzColor.set("#a8b8ff"); ciclo.luzFuerza = ciclo.lunaFuerza * lunaK * (J.luz ?? 1); }
}
