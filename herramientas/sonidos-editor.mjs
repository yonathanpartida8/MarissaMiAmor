// Genera los sonidos del editor: UN archivo por interacción, con su nombre, en assets/sonidos-editor/.
//   node herramientas/sonidos-editor.mjs            (sobrescribe los <nombre>.wav de la lista)
//   node herramientas/sonidos-editor.mjs tocar-boton zoom-acercar   (sólo esos)
// WAV mono 16 bits a 32 000 Hz. Todo está en la misma escala (do mayor pentatónica) para que, sonando
// juntos o seguidos, siempre combinen: kalimba, campanitas, marimba, gotitas, pincel, papel y aire.
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 32000, DIR = new URL("../assets/sonidos-editor/", import.meta.url).pathname;
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// Notas (Hz) de do mayor pentatónica.
const N = { C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093, D7: 2349.32, E7: 2637.02, G7: 3135.96, A7: 3520 };
// Timbres: [proporción, volumen, cuánto más rápido se apaga].
const TIMBRE = {
  kalimba: [[1, 1, 1], [2.01, 0.1, 1.8], [5.43, 0.22, 3.8], [9.1, 0.06, 6]],
  marimba: [[1, 1, 1], [3.93, 0.3, 3], [9.2, 0.1, 6]],
  campana: [[1, 1, 1], [2.76, 0.42, 1.6], [5.4, 0.22, 2.4], [8.93, 0.1, 3.4]],
  celesta: [[1, 1, 1], [2, 0.32, 1.4], [3, 0.12, 2.2], [4.17, 0.06, 3]],
  suave: [[1, 1, 1], [2, 0.18, 1.6], [3, 0.05, 2.4]],
};

const lienzo = (dur) => new Float32Array(Math.round(SR * dur));
/** Una nota afinada con su timbre: ataque de pluma y caída natural. */
function nota(m, f, ini, { timbre = "kalimba", vol = 0.3, caida = 7, dur = 0.6, ataque = 0.003, glide = 1, vib = 0 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  for (const [p, a, k] of TIMBRE[timbre]) {
    let fase = azar() * 6.28;
    for (let i = 0; i < n; i++) {
      const t = i / SR, x = i / n;
      const ff = f * p * Math.pow(glide, x) * (1 + vib * Math.sin(2 * Math.PI * 6 * t));
      fase += (2 * Math.PI * ff) / SR;
      const env = Math.min(1, t / ataque) * Math.exp(-t * caida * k) * (x > 0.92 ? (1 - x) / 0.08 : 1);
      m[i0 + i] += Math.sin(fase) * a * env * vol;
    }
  }
}
/** Un barrido de tono puro (gotitas, burbujas, resortes). */
function barrido(m, f0, f1, ini, dur, vol, { curva = 1, caida = 0, ataque = 0.004 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n, f = f0 * Math.pow(f1 / f0, Math.pow(x, curva));
    fase += (2 * Math.PI * f) / SR;
    const env = Math.min(1, i / (SR * ataque)) * Math.sin(Math.PI * Math.min(1, x * 1.15 + 0.0001)) ** 0.6 * Math.exp(-x * caida);
    m[i0 + i] += Math.sin(fase) * env * vol;
  }
}
/** Ruido filtrado con un pasa-banda que se mueve (pincel, papel, aire). */
function aire(m, ini, dur, vol, { f0 = 1200, f1 = 2400, q = 1.1, forma = (x) => Math.sin(Math.PI * x), am = 0, granos = 0 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n, f = f0 * Math.pow(f1 / f0, x);
    const w = (2 * Math.PI * f) / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const ent = azar() * 2 - 1;
    const y = (b0 * ent + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = ent; y2 = y1; y1 = y;
    let env = forma(x);
    if (am) env *= 0.6 + 0.4 * Math.sin(2 * Math.PI * am * (i / SR));
    if (granos && azar() < granos) env *= 2.2;
    m[i0 + i] += y * env * vol;
  }
}
/** Un golpecito sin tono (clic de tecla, llave, madera). */
function clic(m, ini, vol, { brillo = 0.35, dur = 0.008 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let y = 0;
  for (let i = 0; i < n; i++) { y += (azar() * 2 - 1 - y) * brillo; m[i0 + i] += y * Math.exp(-i / (n / 4)) * vol; }
}
/** Un aire de habitación chiquita: lo que hace que suene suave y no «de computadora». */
function sala(m, mezcla = 0.14, tam = 1) {
  const d = [0.0297, 0.0371, 0.0411, 0.0437].map((s) => Math.round(s * tam * SR)), g = 0.72;
  const sal = new Float32Array(m.length);
  for (const L of d) { const b = new Float32Array(L); let k = 0; for (let i = 0; i < m.length; i++) { const v = b[k]; b[k] = m[i] + v * g; sal[i] += v; k = (k + 1) % L; } }
  for (const L of [Math.round(0.005 * SR), Math.round(0.0017 * SR)]) {
    const b = new Float32Array(L); let k = 0;
    for (let i = 0; i < m.length; i++) { const v = b[k]; const e = sal[i] + v * 0.5; b[k] = e; sal[i] = v - e * 0.5; k = (k + 1) % L; }
  }
  for (let i = 0; i < m.length; i++) m[i] = m[i] * (1 - mezcla * 0.5) + sal[i] * mezcla * 0.25;
}
function terminar(m, pico, { reverb = 0.14, tam = 1 } = {}) {
  if (reverb) sala(m, reverb, tam);
  let y = 0; // un pasa-bajos muy suave: nada chilla
  for (let i = 0; i < m.length; i++) { y += (m[i] - y) * 0.62; m[i] = y; }
  let max = 0;
  for (const v of m) max = Math.max(max, Math.abs(v));
  const k = max ? pico / max : 1;
  const f = Math.round(SR * 0.006);
  for (let i = 0; i < m.length; i++) m[i] *= k * (i > m.length - f ? (m.length - i) / f : 1);
  return m;
}
function wav(m) {
  const n = m.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, m[i])) * 32767), 44 + i * 2);
  return b;
}
const sube = (x) => Math.sin(Math.PI * x) * (1 - x * 0.3);
const golpe = (x) => Math.min(1, x * 12) * Math.exp(-x * 4);

// nombre → [duración, (m) => …, pico]. El pico es el volumen relativo: lo frecuente, más bajito.
const SON = {
  // — Tocar y elegir —
  "tocar-boton": [0.16, (m) => { nota(m, N.C6, 0, { timbre: "marimba", vol: 0.5, caida: 22, dur: 0.12 }); clic(m, 0, 0.08); }, 0.42],
  "seleccionar-elemento": [0.42, (m) => { nota(m, N.E6, 0, { vol: 0.6, caida: 9 }); nota(m, N.E7, 0.012, { timbre: "campana", vol: 0.08, caida: 14 }); }, 0.5],
  "seleccionar-varios": [0.5, (m) => { nota(m, N.C6, 0, { vol: 0.5, caida: 8 }); nota(m, N.E6, 0.035, { vol: 0.45, caida: 8 }); nota(m, N.G6, 0.07, { vol: 0.38, caida: 9 }); }, 0.5],
  deseleccionar: [0.3, (m) => nota(m, N.G5, 0, { vol: 0.45, caida: 13, glide: 0.97 }), 0.34],
  "elegir-herramienta": [0.22, (m) => { nota(m, N.A5, 0, { timbre: "marimba", vol: 0.55, caida: 16 }); nota(m, N.E6, 0.03, { timbre: "marimba", vol: 0.25, caida: 20 }); }, 0.44],
  "menu-mantener": [0.32, (m) => { barrido(m, 480, 620, 0, 0.18, 0.5, { curva: 0.6 }); nota(m, N.C6, 0.1, { timbre: "suave", vol: 0.2, caida: 10, vib: 0.006 }); }, 0.44],
  deslizador: [0.05, (m) => { nota(m, N.E7, 0, { timbre: "suave", vol: 0.5, caida: 70, dur: 0.04 }); clic(m, 0, 0.05, { dur: 0.003 }); }, 0.2],
  // — Mover —
  "arrastrar-pintura": [0.34, (m) => { aire(m, 0, 0.26, 0.9, { f0: 900, f1: 2700, q: 1.3, forma: sube }); barrido(m, 520, 940, 0, 0.07, 0.12); }, 0.42],
  "pincel-roce": [0.22, (m) => aire(m, 0, 0.18, 0.9, { f0: 1500, f1: 2300, q: 1.6, forma: sube }), 0.24],
  "soltar-objeto": [0.4, (m) => { barrido(m, 190, 120, 0, 0.11, 0.7, { curva: 0.5, caida: 2 }); nota(m, N.G5, 0.02, { timbre: "marimba", vol: 0.3, caida: 12 }); aire(m, 0, 0.09, 0.25, { f0: 500, f1: 300, q: 0.8, forma: golpe }); }, 0.5],
  "iman-pegar": [0.18, (m) => { nota(m, N.C7, 0, { timbre: "marimba", vol: 0.5, caida: 30, dur: 0.1 }); nota(m, N.G7, 0.004, { timbre: "campana", vol: 0.12, caida: 26 }); clic(m, 0, 0.1, { brillo: 0.6 }); }, 0.38],
  "mover-hoja": [0.3, (m) => aire(m, 0, 0.26, 0.9, { f0: 300, f1: 720, q: 0.9, forma: sube }), 0.22],
  "girar-objeto": [0.32, (m) => { barrido(m, 620, 930, 0, 0.24, 0.35, { curva: 0.7 }); aire(m, 0, 0.24, 0.35, { f0: 1100, f1: 1700, q: 2, am: 22, forma: sube }); }, 0.38],
  "cambiar-tamano": [0.3, (m) => { barrido(m, 300, 760, 0, 0.1, 0.55, { curva: 0.5 }); barrido(m, 760, 660, 0.09, 0.12, 0.3, { caida: 3 }); }, 0.4],
  // — Zoom —
  "zoom-acercar": [0.42, (m) => { barrido(m, 640, 1280, 0, 0.22, 0.3, { curva: 0.8 }); aire(m, 0, 0.22, 0.3, { f0: 900, f1: 3200, q: 1.4, forma: sube }); nota(m, N.G6, 0.18, { timbre: "campana", vol: 0.25, caida: 9 }); }, 0.42],
  "zoom-alejar": [0.42, (m) => { barrido(m, 1280, 640, 0, 0.22, 0.3, { curva: 0.8 }); aire(m, 0, 0.22, 0.3, { f0: 3200, f1: 900, q: 1.4, forma: sube }); nota(m, N.C6, 0.18, { timbre: "campana", vol: 0.25, caida: 9 }); }, 0.42],
  "zoom-paso": [0.12, (m) => nota(m, N.A6, 0, { timbre: "campana", vol: 0.5, caida: 32, dur: 0.1 }), 0.2],
  // — Crear, copiar, borrar —
  "colocar-objeto": [0.5, (m) => { barrido(m, 360, 1150, 0, 0.09, 0.6, { curva: 0.4 }); nota(m, N.C7, 0.07, { timbre: "campana", vol: 0.18, caida: 8 }); nota(m, N.G7, 0.11, { timbre: "campana", vol: 0.08, caida: 10 }); }, 0.5],
  duplicar: [0.5, (m) => { nota(m, N.A5, 0, { vol: 0.5, caida: 11 }); nota(m, N.A6, 0.075, { vol: 0.42, caida: 9 }); nota(m, N.E7, 0.09, { timbre: "campana", vol: 0.06, caida: 12 }); }, 0.48],
  "borrar-objeto": [0.5, (m) => { aire(m, 0, 0.3, 0.9, { f0: 2600, f1: 380, q: 0.7, forma: golpe }); nota(m, N.E6, 0.06, { timbre: "campana", vol: 0.12, caida: 10, glide: 0.8 }); }, 0.42],
  agrupar: [0.45, (m) => { nota(m, N.G5, 0, { timbre: "campana", vol: 0.3, caida: 6, glide: N.E6 / N.G5 }); nota(m, N.C6 * 1.5, 0, { timbre: "campana", vol: 0.25, caida: 6, glide: N.E6 / (N.C6 * 1.5) }); }, 0.42],
  desagrupar: [0.45, (m) => { nota(m, N.E6, 0, { timbre: "campana", vol: 0.3, caida: 6, glide: N.C6 / N.E6 }); nota(m, N.E6, 0, { timbre: "campana", vol: 0.25, caida: 6, glide: N.G6 / N.E6 }); }, 0.42],
  "ordenar-capas": [0.26, (m) => { nota(m, N.E6, 0, { timbre: "marimba", vol: 0.45, caida: 22 }); nota(m, N.A6, 0.06, { timbre: "marimba", vol: 0.4, caida: 22 }); }, 0.4],
  bloquear: [0.26, (m) => { clic(m, 0, 0.5, { brillo: 0.7 }); clic(m, 0.05, 0.4, { brillo: 0.5 }); barrido(m, 260, 200, 0.05, 0.08, 0.4, { caida: 3 }); nota(m, N.G6, 0.06, { timbre: "campana", vol: 0.06, caida: 20 }); }, 0.4],
  desbloquear: [0.3, (m) => { clic(m, 0, 0.4, { brillo: 0.5 }); clic(m, 0.05, 0.5, { brillo: 0.7 }); nota(m, N.C7, 0.07, { timbre: "campana", vol: 0.16, caida: 12 }); }, 0.4],
  ocultar: [0.42, (m) => { aire(m, 0, 0.32, 0.5, { f0: 2400, f1: 700, q: 1.2, forma: sube }); nota(m, N.E6, 0.02, { timbre: "celesta", vol: 0.14, caida: 8, glide: 0.75 }); }, 0.36],
  mostrar: [0.42, (m) => { aire(m, 0, 0.3, 0.5, { f0: 700, f1: 2400, q: 1.2, forma: sube }); nota(m, N.C6, 0.08, { timbre: "celesta", vol: 0.14, caida: 8, glide: 1.25 }); }, 0.36],
  // — Editar —
  "dibujar-trazo": [0.18, (m) => aire(m, 0, 0.15, 0.9, { f0: 3200, f1: 3800, q: 2.2, forma: sube, granos: 0.02 }), 0.3],
  borrador: [0.2, (m) => aire(m, 0, 0.17, 0.9, { f0: 1700, f1: 2400, q: 3, am: 28, forma: sube }), 0.28],
  "elegir-color": [0.3, (m) => { barrido(m, 450, 1450, 0, 0.1, 0.7, { curva: 0.35 }); barrido(m, 600, 1700, 0.11, 0.07, 0.16, { curva: 0.35 }); }, 0.42],
  "aplicar-efecto": [0.62, (m) => { const ns = [N.C7, N.E7, N.G7, N.A7, N.D7, N.G7]; ns.forEach((f, i) => nota(m, f, i * 0.045 + azar() * 0.01, { timbre: "campana", vol: 0.16, caida: 9 })); }, 0.4],
  "aplicar-animacion": [0.7, (m) => { [N.C6, N.D6, N.E6, N.G6, N.A6, N.C7, N.E7].forEach((f, i) => nota(m, f, i * 0.04, { timbre: "celesta", vol: 0.2, caida: 7 })); }, 0.42],
  fotograma: [0.3, (m) => { nota(m, N.A6, 0, { timbre: "campana", vol: 0.4, caida: 11 }); nota(m, N.E7, 0.005, { timbre: "suave", vol: 0.08, caida: 18 }); }, 0.36],
  "escribir-texto": [0.12, (m) => { clic(m, 0, 0.6, { brillo: 0.55, dur: 0.006 }); nota(m, N.D7, 0.002, { timbre: "suave", vol: 0.06, caida: 50, dur: 0.05 }); }, 0.3],
  deshacer: [0.3, (m) => { barrido(m, 980, 620, 0, 0.12, 0.35, { curva: 0.6 }); nota(m, N.G5, 0.08, { vol: 0.3, caida: 12 }); }, 0.38],
  rehacer: [0.3, (m) => { barrido(m, 620, 980, 0, 0.12, 0.35, { curva: 0.6 }); nota(m, N.D6, 0.08, { vol: 0.3, caida: 12 }); }, 0.38],
  guardar: [0.6, (m) => { nota(m, N.C6, 0, { timbre: "campana", vol: 0.3, caida: 5 }); nota(m, N.E6, 0.1, { timbre: "campana", vol: 0.28, caida: 5 }); }, 0.42],
  "listo-exito": [0.8, (m) => { [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => nota(m, f, i * 0.075, { timbre: "campana", vol: 0.24, caida: 4.5 })); }, 0.44],
  "aviso-error": [0.42, (m) => { nota(m, N.E5, 0, { timbre: "marimba", vol: 0.45, caida: 9 }); nota(m, N.C5, 0.13, { timbre: "marimba", vol: 0.45, caida: 9 }); }, 0.44],
  // — Menús y hojas —
  "abrir-menu": [0.38, (m) => { aire(m, 0, 0.2, 0.45, { f0: 600, f1: 2300, q: 1.2, forma: sube }); nota(m, N.C6, 0.15, { vol: 0.3, caida: 10 }); }, 0.36],
  "cerrar-menu": [0.36, (m) => { aire(m, 0, 0.19, 0.45, { f0: 2300, f1: 600, q: 1.2, forma: sube }); nota(m, N.G5, 0.12, { vol: 0.26, caida: 12 }); }, 0.34],
  "bajar-hoja": [0.24, (m) => aire(m, 0, 0.2, 0.6, { f0: 1500, f1: 480, q: 1.1, forma: sube }), 0.24],
  "subir-hoja": [0.24, (m) => aire(m, 0, 0.2, 0.6, { f0: 480, f1: 1500, q: 1.1, forma: sube }), 0.24],
  atras: [0.36, (m) => { aire(m, 0, 0.18, 0.4, { f0: 1800, f1: 520, q: 1.2, forma: sube }); nota(m, N.E5, 0.09, { vol: 0.32, caida: 11 }); }, 0.36],
  "interruptor-encender": [0.26, (m) => { barrido(m, 500, 900, 0, 0.06, 0.55, { curva: 0.4 }); barrido(m, 720, 1320, 0.065, 0.07, 0.5, { curva: 0.4 }); }, 0.38],
  "interruptor-apagar": [0.26, (m) => { barrido(m, 900, 520, 0, 0.06, 0.5, { curva: 0.6 }); barrido(m, 640, 360, 0.065, 0.07, 0.45, { curva: 0.6 }); }, 0.36],
  "probar-pagina": [0.9, (m) => { aire(m, 0, 0.5, 0.35, { f0: 500, f1: 3000, q: 1, forma: sube }); [N.C6, N.G6, N.C7, N.E7, N.G7].forEach((f, i) => nota(m, f, 0.18 + i * 0.06, { timbre: "campana", vol: 0.16, caida: 5 })); }, 0.42],
  // — Páginas —
  "pagina-nueva": [0.6, (m) => { aire(m, 0, 0.26, 0.7, { f0: 1800, f1: 5200, q: 0.9, am: 38, forma: sube }); nota(m, N.G6, 0.2, { timbre: "campana", vol: 0.22, caida: 6 }); }, 0.42],
  "pagina-duplicar": [0.5, (m) => { aire(m, 0, 0.16, 0.6, { f0: 2000, f1: 4800, q: 0.9, am: 40, forma: sube }); aire(m, 0.16, 0.16, 0.6, { f0: 2200, f1: 5000, q: 0.9, am: 40, forma: sube }); nota(m, N.A6, 0.3, { timbre: "campana", vol: 0.14, caida: 8 }); }, 0.4],
  "pagina-cambiar": [0.32, (m) => aire(m, 0, 0.26, 0.8, { f0: 1600, f1: 4600, q: 0.9, am: 36, forma: sube }), 0.34],
  "pagina-borrar": [0.45, (m) => { for (let i = 0; i < 9; i++) aire(m, i * 0.032 + azar() * 0.01, 0.05, 0.7, { f0: 1500 + azar() * 2500, f1: 1200 + azar() * 1500, q: 1.4, forma: golpe }); }, 0.36],
  "pagina-reordenar": [0.32, (m) => { aire(m, 0, 0.22, 0.5, { f0: 900, f1: 1700, q: 1.2, forma: sube }); nota(m, N.E6, 0.18, { timbre: "marimba", vol: 0.25, caida: 18 }); }, 0.34],
  // — Música —
  reproducir: [0.45, (m) => { [N.C6, N.E6, N.G6].forEach((f, i) => nota(m, f, i * 0.055, { vol: 0.32, caida: 8 })); }, 0.4],
  pausar: [0.35, (m) => { nota(m, N.G6, 0, { vol: 0.3, caida: 10 }); nota(m, N.E6, 0.065, { vol: 0.3, caida: 10 }); }, 0.36],
  // — Publicar —
  publicar: [1.4, (m) => {
    [N.C6, N.E6, N.G6, N.C7, N.E7].forEach((f, i) => nota(m, f, i * 0.07, { timbre: "campana", vol: 0.22, caida: 3.2, dur: 1.1 }));
    [N.G7, N.A7, N.E7, N.G7, N.C7].forEach((f, i) => nota(m, f * 1.0, 0.42 + i * 0.05 + azar() * 0.02, { timbre: "celesta", vol: 0.08, caida: 8 }));
    nota(m, N.C5, 0.35, { timbre: "suave", vol: 0.16, caida: 2.2, dur: 1 });
  }, 0.5],
};

mkdirSync(DIR, { recursive: true });
const solo = process.argv.slice(2);
let total = 0;
for (const [nombre, [dur, hacer, pico]] of Object.entries(SON)) {
  const m = lienzo(dur + 0.12);
  hacer(m);
  const b = wav(terminar(m, pico));
  if (solo.length && !solo.includes(nombre)) continue;
  writeFileSync(DIR + nombre + ".wav", b);
  total += b.length;
}
console.log(`${solo.length || Object.keys(SON).length} sonidos · ${(total / 1024).toFixed(0)} KB en assets/sonidos-editor/`);
