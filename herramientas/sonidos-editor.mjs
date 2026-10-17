// Genera los sonidos del editor: UN archivo por interacción, con su nombre, en assets/sonidos-editor/.
//   node herramientas/sonidos-editor.mjs            (sobrescribe los <nombre>.wav de la lista)
//   node herramientas/sonidos-editor.mjs tocar-boton zoom-acercar   (sólo esos)
// Fase 25: una mezcla de «Cute UI / Pop» y «Glass UI / Glassmorphism»: burbujitas redondas que hacen
// «plop», pulsaditos de madera suave y gotitas, con el tink limpio de una copa, copas que se quedan
// sonando y el aire de un vidrio esmerilado al abrir o deslizar algo. Suaves, sin cascadas de notas ni
// fanfarrias, y cada uno con su propia figura (no hay dos iguales).
// Cada uno sale en TRES versiones (nombre.wav, nombre-2.wav, nombre-3.wav) que el editor turna sin
// repetir la última: las de fábrica, a otro tono; las reacciones, con su propia figura.
// (Los que suben por la escala al repetirse —elegir, imán, colocar…— van en una sola versión.)
// WAV mono 16 bits a 24 000 Hz (lo agudo de más se omite: nada chilla ni se dobla).
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 24000, DIR = new URL("../assets/sonidos-editor/", import.meta.url).pathname;
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// Notas (Hz) de do mayor pentatónica.
const N = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093, D7: 2349.32, E7: 2637.02, G7: 3135.96, A7: 3520 };
// Timbres: [proporción, volumen, cuánto más rápido se apaga].
const TIMBRE = {
  kalimba: [[1, 1, 1], [2.01, 0.1, 1.8], [5.43, 0.22, 3.8], [9.1, 0.06, 6]],
  marimba: [[1, 1, 1], [3.93, 0.3, 3], [9.2, 0.1, 6]],
  campana: [[1, 1, 1], [2.76, 0.42, 1.6], [5.4, 0.22, 2.4], [8.93, 0.1, 3.4]],
  celesta: [[1, 1, 1], [2, 0.32, 1.4], [3, 0.12, 2.2], [4.17, 0.06, 3]],
  suave: [[1, 1, 1], [2, 0.18, 1.6], [3, 0.05, 2.4]],
  // Fase 22: cristal (copa golpeada: parciales inarmónicos que se apagan antes que la base),
  // vidrio (borde de copa: casi puro, larguísimo) y arpa (cuerda pulsada).
  cristal: [[1, 1, 1], [2.32, 0.34, 1.7], [4.25, 0.17, 2.6], [6.63, 0.08, 3.6], [9.38, 0.035, 5]],
  vidrio: [[1, 1, 1], [2.005, 0.1, 1.5], [3.01, 0.035, 2.2]],
  arpa: [[1, 1, 1], [2, 0.42, 1.6], [3, 0.18, 2.4], [4, 0.08, 3.2], [5, 0.04, 4]],
  // Fase 23: piano de fieltro (redondo, sin filo) y lengüeta de piano eléctrico (tibia).
  fieltro: [[1, 1, 1], [2, 0.45, 1.5], [3, 0.16, 2.2], [4, 0.06, 3], [5.02, 0.03, 3.6]],
  lengueta: [[1, 1, 1], [2, 0.14, 1.3], [3, 0.03, 2], [7.1, 0.035, 9]],
};
// El tono de la versión que se está haciendo (1 = la original).
let T = 1;

const lienzo = (dur) => new Float32Array(Math.round(SR * dur));
/** Una nota afinada con su timbre: ataque de pluma y caída natural. */
function nota(m, f, ini, { timbre = "kalimba", vol = 0.3, caida = 7, dur = 0.6, ataque = 0.003, glide = 1, vib = 0 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  for (const [p, a, k] of TIMBRE[timbre]) {
    let fase = azar() * 6.28;
    if (f * T * p > SR * 0.45) continue;
    for (let i = 0; i < n; i++) {
      const t = i / SR, x = i / n;
      const ff = f * T * p * Math.pow(glide, x) * (1 + vib * Math.sin(2 * Math.PI * 6 * t));
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
    const x = i / n, f = f0 * T * Math.pow(f1 / f0, Math.pow(x, curva));
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
    const x = i / n, f = f0 * Math.sqrt(T) * Math.pow(f1 / f0, x);
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
  for (let i = 0; i < m.length; i++) { y += (m[i] - y) * 0.72; m[i] = y; }
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
// Fase 23: en vez de brillitos, cosas que dan gusto: una burbujita que hace «plop» (sube o baja),
// un golpecito de madera grave y acordes de piano de fieltro.
const plop = (m, ini, f, vol, baja = false) => barrido(m, baja ? f : f * 0.55, baja ? f * 0.6 : f, ini, 0.065, vol, { curva: 0.35, caida: 1.5 });
const tum = (m, ini, vol, f = 150) => barrido(m, f, f * 0.6, ini, 0.07, vol, { curva: 0.5, caida: 3 });
const FIELTRO = { timbre: "fieltro", ataque: 0.006 };

/* ── Fase 25: mezcla de «Cute UI / Pop» (burbujitas, pulsaditos de madera suave, gotitas) y
   «Glass UI» (el tink de una copa, una copa que se queda sonando y el aire de vidrio esmerilado).
   Sin cascadas ni fanfarrias: como mucho dos o tres notas; cada sonido con su propia figura. ── */
Object.assign(N, { B4: 493.88, F5: 698.46, B5: 987.77, F6: 1396.91, B6: 1975.53 });
const SALA = { reverb: 0.2, tam: 1.25 };          // vidrio: un aire de sala chiquita
const SALA_GRANDE = { reverb: 0.3, tam: 1.7 };
const rueda = (m, notas, ini, paso, op) => notas.forEach((f, i) => nota(m, f, ini + i * paso + azar() * 0.006, op));
// Cute: una burbujita que hace «plop» (sube; con `baja`, al revés), una gotita y un pulsadito de madera.
function pop(m, ini, f, vol, { dur = 0.07, baja = false } = {}) {
  const a = baja ? f : f * 0.55, b = baja ? f * 0.62 : f;
  barrido(m, a, b, ini, dur, vol, { curva: baja ? 0.4 : 0.35, caida: 1.5 });
  barrido(m, a * 2, b * 2, ini, dur * 0.6, vol * 0.12, { curva: 0.35, caida: 2 });
}
const gota = (m, ini, f, vol) => barrido(m, f * 1.9, f, ini, 0.06, vol, { curva: 0.3, caida: 2.2 });
const madera = (m, ini, f, vol, caida = 16) => nota(m, f, ini, { timbre: "kalimba", vol, caida, dur: 0.35 });
// Glass: el «tink» de una copa, una copa que se queda sonando y el aire de vidrio esmerilado.
const tink = (m, ini, f, vol, caida = 10) => nota(m, f, ini, { timbre: "cristal", vol, caida, ataque: 0.0015, dur: 0.7 });
const copa = (m, ini, f, vol, caida = 3, dur = 1.2) => nota(m, f, ini, { timbre: "vidrio", vol, caida, dur, ataque: 0.006 });
const escarcha = (m, ini, dur, vol, f0, f1, op = {}) => aire(m, ini, dur, vol, { f0, f1, q: 1.5, forma: sube, ...op });

// nombre → [duración, (m, v) => …, pico, final]. El pico es el volumen relativo: lo frecuente, más bajito.
const SON = {
  // — Tocar y elegir (lo que más suena: cortito y bajito) —
  "tocar-boton": [0.16, (m) => { pop(m, 0, 620, 0.55); tink(m, 0.012, N.G6, 0.06, 22); }, 0.36],
  "seleccionar-elemento": [0.2, (m) => { pop(m, 0, 700, 0.5); tink(m, 0.01, N.E6, 0.1, 14); }, 0.38],
  "seleccionar-varios": [0.24, (m) => { pop(m, 0, 650, 0.45); pop(m, 0.045, 820, 0.4); tink(m, 0.05, N.A6, 0.07, 14); }, 0.36],
  deseleccionar: [0.16, (m) => pop(m, 0, 760, 0.45, { baja: true }), 0.3],
  "elegir-herramienta": [0.24, (m) => { madera(m, 0, N.A5, 0.45, 18); pop(m, 0, 520, 0.25, { dur: 0.05 }); }, 0.36],
  "menu-mantener": [0.4, (m) => { escarcha(m, 0, 0.26, 0.35, 1200, 2600); copa(m, 0.06, N.G5, 0.2, 5, 0.34); }, 0.34],
  deslizador: [0.08, (m) => tink(m, 0, N.D6, 0.3, 32), 0.2],
  "arrastrar-pintura": [0.34, (m) => { escarcha(m, 0, 0.28, 0.6, 900, 2200, { q: 1.1 }); pop(m, 0.02, 420, 0.12, { dur: 0.06 }); }, 0.36],
  "pincel-roce": [0.22, (m) => aire(m, 0, 0.18, 0.9, { f0: 1500, f1: 2300, q: 1.6, forma: sube }), 0.22],
  "soltar-objeto": [0.24, (m) => { pop(m, 0, 430, 0.6, { baja: true, dur: 0.09 }); tink(m, 0.03, N.C6, 0.08, 14); }, 0.42],
  "iman-pegar": [0.16, (m) => { clic(m, 0, 0.12, { brillo: 0.6 }); tink(m, 0.004, N.A6, 0.22, 26); pop(m, 0, 900, 0.15, { dur: 0.04 }); }, 0.34],
  "mover-hoja": [0.3, (m) => escarcha(m, 0, 0.26, 0.8, 380, 900, { q: 0.9 }), 0.22],
  "girar-objeto": [0.36, (m) => { escarcha(m, 0, 0.26, 0.4, 1100, 1700, { am: 20 }); tink(m, 0.2, N.E6, 0.1, 12); }, 0.36],
  "cambiar-tamano": [0.3, (m) => { barrido(m, 300, 700, 0, 0.12, 0.5, { curva: 0.5 }); pop(m, 0.11, 640, 0.3, { dur: 0.05 }); }, 0.38],
  "zoom-acercar": [0.44, (m) => { escarcha(m, 0, 0.22, 0.35, 900, 2800); copa(m, 0.17, N.G6, 0.12, 8, 0.3); }, 0.38],
  "zoom-alejar": [0.44, (m) => { escarcha(m, 0, 0.22, 0.35, 2800, 900); copa(m, 0.17, N.C6, 0.12, 8, 0.3); }, 0.38],
  "zoom-paso": [0.1, (m) => tink(m, 0, N.A6, 0.3, 32), 0.2],
  "colocar-objeto": [0.32, (m) => { pop(m, 0, 560, 0.5); pop(m, 0.05, 840, 0.35); tink(m, 0.06, N.E6, 0.1, 12); }, 0.42],
  duplicar: [0.3, (m) => { pop(m, 0, 700, 0.45); pop(m, 0.075, 700, 0.22); tink(m, 0.08, N.A6, 0.06, 14); }, 0.38],
  "borrar-objeto": [0.4, (m) => { escarcha(m, 0, 0.3, 0.6, 2600, 500, { forma: golpe }); pop(m, 0.08, 500, 0.3, { baja: true }); }, 0.4],
  agrupar: [0.4, (m) => { nota(m, N.G5, 0, { timbre: "cristal", vol: 0.22, caida: 6, glide: N.E6 / N.G5, dur: 0.4 }); nota(m, N.C6, 0, { timbre: "cristal", vol: 0.18, caida: 6, glide: N.E6 / N.C6, dur: 0.4 }); pop(m, 0.3, 600, 0.2, { dur: 0.05 }); }, 0.38],
  desagrupar: [0.4, (m) => { pop(m, 0, 600, 0.2, { dur: 0.05 }); nota(m, N.E6, 0.04, { timbre: "cristal", vol: 0.22, caida: 6, glide: N.C6 / N.E6, dur: 0.4 }); nota(m, N.E6, 0.04, { timbre: "cristal", vol: 0.18, caida: 6, glide: N.G6 / N.E6, dur: 0.4 }); }, 0.38],
  "ordenar-capas": [0.22, (m) => { madera(m, 0, N.E6, 0.4, 22); madera(m, 0.055, N.A6, 0.35, 22); }, 0.36],
  bloquear: [0.3, (m) => { clic(m, 0, 0.5, { brillo: 0.7 }); clic(m, 0.05, 0.4, { brillo: 0.5 }); pop(m, 0.05, 320, 0.4, { baja: true }); tink(m, 0.06, N.G6, 0.05, 18); }, 0.38],
  desbloquear: [0.3, (m) => { clic(m, 0, 0.4, { brillo: 0.5 }); clic(m, 0.05, 0.5, { brillo: 0.7 }); pop(m, 0.05, 520, 0.35); tink(m, 0.07, N.C7, 0.08, 14); }, 0.38],
  ocultar: [0.3, (m) => { escarcha(m, 0, 0.2, 0.4, 2000, 600); pop(m, 0.1, 600, 0.2, { baja: true }); }, 0.3],
  mostrar: [0.3, (m) => { escarcha(m, 0, 0.2, 0.4, 600, 2000); pop(m, 0.1, 600, 0.22); }, 0.3],
  "dibujar-trazo": [0.18, (m) => aire(m, 0, 0.15, 0.9, { f0: 3200, f1: 3800, q: 2.2, forma: sube, granos: 0.02 }), 0.26],
  borrador: [0.24, (m) => { aire(m, 0, 0.1, 0.7, { f0: 2400, f1: 2000, q: 1.2, forma: golpe }); aire(m, 0.1, 0.1, 0.6, { f0: 2200, f1: 1800, q: 1.2, forma: golpe }); }, 0.26],
  "elegir-color": [0.3, (m) => { gota(m, 0, 1100, 0.4); pop(m, 0.06, 520, 0.3); tink(m, 0.07, N.D6, 0.07, 14); }, 0.38],
  "aplicar-efecto": [0.62, (m) => { escarcha(m, 0, 0.3, 0.35, 700, 2400); copa(m, 0.14, N.C6, 0.16, 4, 0.45); tink(m, 0.22, N.G6, 0.08, 9); }, 0.4, SALA],
  "aplicar-animacion": [0.4, (m) => { pop(m, 0, 600, 0.35, { dur: 0.06 }); pop(m, 0.07, 760, 0.32, { dur: 0.06 }); pop(m, 0.14, 900, 0.3, { dur: 0.06 }); }, 0.38],
  fotograma: [0.24, (m) => { tink(m, 0, N.A6, 0.2, 12); madera(m, 0.004, N.A5, 0.25, 20); }, 0.34],
  "escribir-texto": [0.08, (m) => { clic(m, 0, 0.6, { brillo: 0.55, dur: 0.006 }); pop(m, 0.002, 1100, 0.08, { dur: 0.03 }); }, 0.24],
  deshacer: [0.2, (m) => { pop(m, 0, 820, 0.4, { baja: true }); escarcha(m, 0, 0.12, 0.2, 1800, 900); }, 0.34],
  rehacer: [0.2, (m) => { pop(m, 0, 820, 0.4); escarcha(m, 0, 0.12, 0.2, 900, 1800); }, 0.34],
  // — Guardar y avisos —
  guardar: [0.7, (m) => { pop(m, 0, 500, 0.3); copa(m, 0.03, N.C6, 0.2, 4, 0.6); tink(m, 0.11, N.G6, 0.1, 8); }, 0.42, SALA],
  "listo-exito": [0.9, (m) => { pop(m, 0, 600, 0.3); copa(m, 0.04, N.E6, 0.22, 3, 0.8); copa(m, 0.04, N.E5, 0.1, 3, 0.8); tink(m, 0.12, N.B6, 0.06, 7); }, 0.44, SALA],
  "aviso-error": [0.4, (m) => { madera(m, 0, N.E5, 0.4, 10); madera(m, 0.13, N.C5, 0.4, 10); pop(m, 0.13, 300, 0.25, { baja: true }); }, 0.42],
  // — Menús —
  "abrir-menu": [0.4, (m) => { escarcha(m, 0, 0.2, 0.4, 600, 2300); pop(m, 0.12, 700, 0.3); }, 0.36, SALA],
  "cerrar-menu": [0.36, (m) => { escarcha(m, 0, 0.19, 0.4, 2300, 600); pop(m, 0.1, 700, 0.26, { baja: true }); }, 0.34],
  // El cajón de recursos: un panel de vidrio esmerilado que se desliza y asienta con una burbujita.
  "abrir-recursos": [0.7, (m) => { escarcha(m, 0, 0.24, 0.45, 500, 2000); pop(m, 0.14, 560, 0.4); copa(m, 0.16, N.G5, 0.14, 4, 0.5); tink(m, 0.2, N.D6, 0.05, 10); }, 0.42, SALA],
  "cerrar-recursos": [0.5, (m) => { escarcha(m, 0, 0.2, 0.45, 2000, 500); pop(m, 0.1, 640, 0.35, { baja: true }); copa(m, 0.12, N.C5, 0.12, 6, 0.36); }, 0.38],
  "bajar-hoja": [0.24, (m) => escarcha(m, 0, 0.2, 0.6, 1500, 480, { q: 1.1 }), 0.24],
  "subir-hoja": [0.24, (m) => escarcha(m, 0, 0.2, 0.6, 480, 1500, { q: 1.1 }), 0.24],
  atras: [0.24, (m) => { pop(m, 0, 700, 0.4, { baja: true }); escarcha(m, 0, 0.14, 0.2, 1600, 700); }, 0.32],
  "interruptor-encender": [0.3, (m) => { clic(m, 0, 0.3, { brillo: 0.6 }); pop(m, 0.01, 900, 0.4); tink(m, 0.04, N.E6, 0.08, 14); }, 0.36],
  "interruptor-apagar": [0.24, (m) => { clic(m, 0, 0.3, { brillo: 0.4 }); pop(m, 0.01, 900, 0.36, { baja: true }); }, 0.32],
  "probar-pagina": [1, (m) => { escarcha(m, 0, 0.5, 0.35, 500, 3000); pop(m, 0.3, 620, 0.3); copa(m, 0.32, N.C6, 0.16, 2.6, 0.7); copa(m, 0.46, N.G6, 0.1, 3, 0.55); }, 0.42, SALA_GRANDE],
  // — Páginas —
  "pagina-nueva": [0.5, (m) => { aire(m, 0, 0.26, 0.7, { f0: 1800, f1: 5200, q: 0.9, am: 38, forma: sube }); pop(m, 0.22, 720, 0.3); }, 0.4],
  "pagina-duplicar": [0.5, (m) => { aire(m, 0, 0.16, 0.6, { f0: 2000, f1: 4800, q: 0.9, am: 40, forma: sube }); aire(m, 0.16, 0.16, 0.6, { f0: 2200, f1: 5000, q: 0.9, am: 40, forma: sube }); tink(m, 0.3, N.A6, 0.08, 12); }, 0.38],
  "pagina-cambiar": [0.34, (m) => { aire(m, 0, 0.26, 0.8, { f0: 1600, f1: 4600, q: 0.9, am: 36, forma: sube }); pop(m, 0.2, 560, 0.15, { dur: 0.05 }); }, 0.34],
  "pagina-borrar": [0.5, (m) => { for (let i = 0; i < 8; i++) aire(m, i * 0.034 + azar() * 0.01, 0.05, 0.6, { f0: 1500 + azar() * 2500, f1: 1200 + azar() * 1500, q: 1.4, forma: golpe }); pop(m, 0.3, 460, 0.25, { baja: true }); }, 0.36],
  "pagina-reordenar": [0.34, (m) => { escarcha(m, 0, 0.22, 0.4, 900, 1700); madera(m, 0.18, N.E6, 0.3, 18); }, 0.34],
  // — Música —
  reproducir: [0.4, (m) => { pop(m, 0, 520, 0.4); tink(m, 0.03, N.E6, 0.1, 9); }, 0.38],
  pausar: [0.34, (m) => { pop(m, 0, 620, 0.36, { baja: true }); tink(m, 0.03, N.C6, 0.08, 11); }, 0.36],
  // — Publicar —
  publicar: [1.4, (m) => { escarcha(m, 0, 0.45, 0.35, 600, 2600); pop(m, 0.3, 560, 0.3); [N.C5, N.G5, N.E6].forEach((f, i) => copa(m, 0.32 + i * 0.1, f, 0.15, 2.4, 1)); }, 0.46, SALA_GRANDE],
  // — Fase 20 y 22: menús, la pareja, Detallitos y el gatito —
  brillo: [0.7, (m) => { pop(m, 0, 640, 0.35); copa(m, 0.03, N.E6, 0.16, 4, 0.6); }, 0.38, SALA],
  "girar-tarjeta": [0.6, (m) => { escarcha(m, 0, 0.3, 0.45, 700, 2600); tink(m, 0.24, N.G6, 0.14, 8); }, 0.38, SALA],
  "abrir-sobre": [0.7, (m) => { aire(m, 0, 0.3, 0.6, { f0: 500, f1: 1800, q: 0.9, am: 30, forma: sube }); pop(m, 0.26, 600, 0.35); tink(m, 0.3, N.C6, 0.1, 8); }, 0.4, SALA],
  latido: [0.5, (m) => { barrido(m, 140, 70, 0, 0.12, 0.9, { curva: 0.5, caida: 3 }); barrido(m, 125, 62, 0.19, 0.14, 0.7, { curva: 0.5, caida: 3 }); }, 0.5, { reverb: 0.08 }],
  "vincular-pareja": [1.8, (m) => { pop(m, 0, 560, 0.3); rueda(m, [N.C5, N.E5, N.G5], 0.04, 0.08, { timbre: "vidrio", vol: 0.2, caida: 1.8, dur: 1.5, ataque: 0.01 }); tink(m, 0.3, N.C6, 0.1, 5); tink(m, 0.42, N.E6, 0.07, 5); }, 0.46, SALA_GRANDE],
  desvincular: [1, (m) => { rueda(m, [N.G5, N.E5, N.C5], 0, 0.14, { timbre: "vidrio", vol: 0.18, caida: 3, dur: 0.8 }); escarcha(m, 0.1, 0.5, 0.2, 1800, 500); }, 0.4, SALA_GRANDE],
  "tecla-codigo": [0.12, (m) => { clic(m, 0, 0.4, { brillo: 0.6, dur: 0.005 }); tink(m, 0.002, N.E6, 0.1, 30); }, 0.26],
  "coleccion-abrir": [1.1, (m) => { aire(m, 0, 0.36, 0.5, { f0: 400, f1: 1600, q: 1, am: 26, forma: sube }); pop(m, 0.22, 520, 0.3); copa(m, 0.24, N.C5, 0.14, 2.6, 0.8); copa(m, 0.32, N.G5, 0.12, 2.8, 0.7); }, 0.42, SALA_GRANDE],
  "detallito-abrir": [0.8, (m) => { aire(m, 0, 0.24, 0.5, { f0: 600, f1: 1800, q: 0.9, am: 30, forma: sube }); pop(m, 0.18, 700, 0.35); tink(m, 0.22, N.D6, 0.1, 7); }, 0.4, SALA],
  // El gatito del menú, si lo tocas: un «prrp» y ronronea.
  "gatito-ronroneo": [1.7, (m) => {
    const am = 22 + azar() * 6, f = (x) => Math.sin(Math.PI * x) ** 1.4;
    pop(m, 0, 340, 0.18, { dur: 0.09 });
    aire(m, 0.04, 0.7, 1, { f0: 150, f1: 210, q: 1.6, am, forma: f });
    aire(m, 0.84, 0.76, 0.9, { f0: 170, f1: 140, q: 1.6, am: am * 1.05, forma: f });
  }, 0.5, { reverb: 0.05 }],
  // — La abejita (su voz, su hola, su adiós…) y el huevito de pascua —
  "abejita-habla": [0.12, (m) => { pop(m, 0, 760, 0.4, { dur: 0.055 }); tink(m, 0.01, N.A6, 0.03, 30); }, 0.26],
  "abejita-hola": [0.32, (m) => { pop(m, 0, 620, 0.35); pop(m, 0.09, 830, 0.35); }, 0.32],
  "abejita-adios": [0.34, (m) => { pop(m, 0, 830, 0.35, { baja: true }); pop(m, 0.1, 620, 0.32, { baja: true }); }, 0.32],
  "abejita-feliz": [0.4, (m) => { [700, 880, 1040].forEach((f, i) => pop(m, i * 0.06, f, 0.3, { dur: 0.05 })); tink(m, 0.14, N.E6, 0.06, 12); }, 0.34],
  "abejita-susto": [0.3, (m) => { barrido(m, 500, 1300, 0, 0.1, 0.4, { curva: 0.4 }); tink(m, 0.08, N.G6, 0.08, 14); }, 0.32],
  "abejita-zumbido": [0.6, (m) => aire(m, 0, 0.55, 1, { f0: 220, f1: 250, q: 6, am: 34, forma: sube }), 0.24],
  "secreto-interferencia": [0.6, (m) => { for (let i = 0; i < 9; i++) aire(m, i * 0.055 + azar() * 0.02, 0.05, 0.8, { f0: 600 + azar() * 4000, f1: 500 + azar() * 4000, q: 0.8, forma: golpe }); }, 0.28],
  "secreto-campanita": [0.9, (m) => { copa(m, 0, N.E6, 0.2, 3, 0.8); tink(m, 0.02, N.B6, 0.06, 8); }, 0.32, SALA_GRANDE],
};

// Reacciones a una página de tu amorcito: cada una con TRES figuras distintas (v = 0, 1, 2).
const SON_REACCION = {
  "reaccion-te-amo": [1.6, (m, v) => {
    const ac = [[N.C5, N.E5, N.G5], [N.G4, N.C5, N.E5], [N.E5, N.G5, N.C6]][v];
    pop(m, 0, [560, 520, 620][v], 0.35);
    rueda(m, ac, 0.04, 0.07, { timbre: "vidrio", vol: 0.18, caida: 2, dur: 1.3, ataque: 0.01 });
    tink(m, 0.26, ac[2] * 2, 0.08, 6);
  }, 0.46, SALA_GRANDE],
  "reaccion-me-encanto": [1, (m, v) => {
    [[600, 760, 940], [640, 820, 1000], [580, 720, 900]][v].forEach((f, i) => pop(m, i * 0.065, f, 0.32, { dur: 0.06 }));
    tink(m, 0.2, [N.G6, N.A6, N.E6][v], 0.1, 7);
  }, 0.42, SALA],
  "reaccion-llore": [1.6, (m, v) => {
    const f = [N.A5, N.E5, N.G5][v];
    gota(m, 0, f * 1.2, 0.4);
    copa(m, 0.06, f, 0.18, 2.2, 1.2);
    copa(m, 0.3, f * 2 ** (-3 / 12), 0.12, 2.4, 1);
  }, 0.42, { reverb: 0.36, tam: 1.9 }],
  "reaccion-abrazo": [1.6, (m, v) => {
    for (const f of [[N.C4, N.G4, N.E5], [N.A4, N.E5, N.C6], [N.G4, N.D5, N.G5]][v]) nota(m, f, 0, { timbre: "vidrio", vol: 0.18, caida: 1.3, dur: 1.5, ataque: 0.16 });
    pop(m, 0.02, 400, 0.25, { dur: 0.09 });
  }, 0.44, SALA_GRANDE],
  "reaccion-beso": [0.8, (m, v) => {
    aire(m, 0, 0.05, 0.3, { f0: 2400, f1: 3400, q: 2, forma: golpe });
    pop(m, 0.03, [880, 960, 820][v], 0.4, { dur: 0.06 });
    tink(m, 0.07, [N.E6, N.G6, N.D6][v], 0.12, 9);
  }, 0.42, SALA],
  "reaccion-risa": [0.8, (m, v) => {
    [[700, 860, 760, 940], [640, 780, 900, 820], [760, 700, 880, 820]][v].forEach((f, i) => pop(m, i * 0.075, f, 0.3, { dur: 0.055 }));
  }, 0.4],
  "reaccion-quitar": [0.5, (m, v) => {
    pop(m, 0, [700, 640, 760][v], 0.35, { baja: true });
    escarcha(m, 0, 0.26, 0.25, 2600, 800);
  }, 0.34, SALA],
};

const PROPIAS = new Set(Object.keys(SON_REACCION));
Object.assign(SON, SON_REACCION);
// Los que suben por la escala al repetirse (o marcan escalones): con una versión basta.
const UNA_SOLA = new Set(["seleccionar-elemento", "seleccionar-varios", "colocar-objeto", "iman-pegar", "duplicar", "ordenar-capas", "fotograma", "zoom-paso", "deslizador"]);
// Las tres versiones de las de fábrica: el original, un tono arriba y un tono abajo.
const TONOS = [1, 1.1225, 0.8909];

mkdirSync(DIR, { recursive: true });
const solo = process.argv.slice(2);
let total = 0, n = 0;
for (const [nombre, [dur, hacer, pico, fin]] of Object.entries(SON)) {
  const versiones = UNA_SOLA.has(nombre) ? 1 : 3;
  for (let v = 0; v < versiones; v++) {
    semilla = 11 + v * 7919 + nombre.length * 31;
    T = PROPIAS.has(nombre) ? 1 : TONOS[v];
    const m = lienzo(dur + 0.12 + (fin?.reverb > 0.2 ? 0.3 : 0));
    hacer(m, v);
    const b = wav(terminar(m, pico, fin));
    if (solo.length && !solo.includes(nombre)) continue;
    writeFileSync(DIR + nombre + (v ? "-" + (v + 1) : "") + ".wav", b);
    total += b.length; n++;
  }
}
T = 1;
console.log(`${n} archivos · ${(total / 1024).toFixed(0)} KB en assets/sonidos-editor/`);
