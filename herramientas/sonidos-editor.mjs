// Genera los sonidos del editor: UN archivo por interacción, con su nombre, en assets/sonidos-editor/.
//   node herramientas/sonidos-editor.mjs            (sobrescribe los <nombre>.wav de la lista)
//   node herramientas/sonidos-editor.mjs tocar-boton zoom-acercar   (sólo esos)
// Fase 26: sonidos de interfaz PROFESIONALES, como los de un sistema operativo o una app de trabajo:
//   · las interacciones son toques táctiles: un contacto cortito y la resonancia de un material
//     suave (polímero, madera mate o metal suave) que se apaga enseguida; casi sin nota;
//   · lo que se abre o se desliza es aire limpio y filtrado (sin temblores);
//   · sólo los avisos (guardar, listo, error, publicar, Detallitos) llevan tono: un piano eléctrico
//     suave (FM), todos en re mayor para que combinen; nunca más de dos o tres notas;
//   · cortos, bajitos y con una sala muy discreta. Cada uno con su propia figura (no hay dos iguales).
// Cada uno sale en TRES versiones (nombre.wav, nombre-2.wav, nombre-3.wav) que el editor turna sin
// repetir la última: las de fábrica, a otro tono; las reacciones, con su propia figura.
// (Los que suben por la escala al repetirse —elegir, imán, colocar…— van en una sola versión.)
// WAV mono 16 bits a 24 000 Hz.
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 24000, DIR = new URL("../assets/sonidos-editor/", import.meta.url).pathname;
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// Re mayor (pentatónica): todo combina con todo.
const N = { D3: 146.83, Fs3: 185, G3: 196, A3: 220, B3: 246.94, Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392, A4: 440, B4: 493.88, Cs5: 554.37, D5: 587.33, E5: 659.26, Fs5: 739.99, A5: 880, B5: 987.77, D6: 1174.66 };
// El tono de la versión que se está haciendo (1 = la original).
let T = 1;
const lienzo = (dur) => new Float32Array(Math.round(SR * dur));
const cola = (i, n) => (i > n - 48 ? (n - i) / 48 : 1);

// Materiales para los toques: [proporción, volumen, cuánto más rápido se apaga].
const MATERIAL = {
  polimero: [[1, 1, 1], [1.73, 0.32, 1.5], [2.91, 0.12, 2.2], [4.6, 0.05, 3]],
  madera: [[1, 1, 1], [2.11, 0.38, 1.7], [3.7, 0.14, 2.6], [5.3, 0.05, 3.4]],
  metal: [[1, 1, 1], [2.76, 0.22, 0.8], [5.4, 0.08, 1.2]],
};

/** Ruido filtrado con un pasa-banda que se mueve (contactos, aire, papel). */
function aire(m, ini, dur, vol, { f0 = 1200, f1 = 2400, q = 1.1, forma = (x) => 0.5 - 0.5 * Math.cos(2 * Math.PI * x), am = 0 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n, f = Math.min(SR * 0.45, f0 * Math.sqrt(T) * Math.pow(f1 / f0, x));
    const w = (2 * Math.PI * f) / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const ent = azar() * 2 - 1;
    const y = (al * ent - al * x2 + 2 * c * y1 - (1 - al) * y2) / (1 + al);
    x2 = x1; x1 = ent; y2 = y1; y1 = y;
    let env = forma(x);
    if (am) env *= 0.6 + 0.4 * Math.sin(2 * Math.PI * am * (i / SR));
    m[i0 + i] += y * env * vol;
  }
}
/**
 * Un toque táctil: un contacto de ruido cortísimo y la resonancia del material (modos que se
 * apagan solos). `f` es su tono base; `caida`, qué tan seco; `contacto`, cuánto se oye el roce.
 */
function toque(m, ini, f, vol, { material = "polimero", caida = 45, contacto = 0.3 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(0.5 * SR));
  for (const [p, a, k] of MATERIAL[material]) {
    const ff = f * T * p;
    if (ff > SR * 0.42) continue;
    let fase = azar() * 6.28;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      fase += (2 * Math.PI * ff) / SR;
      m[i0 + i] += Math.sin(fase) * a * Math.min(1, t / 0.0006) * Math.exp(-t * caida * k) * cola(i, n) * vol;
    }
  }
  if (contacto) aire(m, ini, 0.006, vol * contacto * 3, { f0: f * 2.2, f1: f * 1.6, q: 0.8, forma: (x) => (1 - x) ** 2 });
}
/**
 * Un tono de piano eléctrico suave (FM): brilla un instante al empezar y queda redondo.
 * `ataque` largo = entra despacito; `glide` = se desliza a esa proporción.
 */
function fm(m, ini, f, vol, { ratio = 1, indice = 1.3, caida = 6, caidaIndice = 16, dur = 0.7, ataque = 0.004, glide = 1, vib = 0 } = {}) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let fc = azar() * 6.28, fmod = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, x = i / n, ff = f * T * Math.pow(glide, x) * (1 + vib * Math.sin(2 * Math.PI * 5 * t));
    fc += (2 * Math.PI * ff) / SR;
    fmod += (2 * Math.PI * ff * ratio) / SR;
    const I = indice * Math.exp(-t * caidaIndice);
    m[i0 + i] += Math.sin(fc + I * Math.sin(fmod)) * Math.min(1, t / ataque) * Math.exp(-t * caida) * cola(i, n) * vol;
  }
}
/** Un golpecito grave (algo que se asienta). */
function asiento(m, ini, vol, f0 = 170, f1 = 90, dur = 0.06) {
  const i0 = Math.round(ini * SR), n = Math.min(m.length - i0, Math.round(dur * SR));
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    fase += (2 * Math.PI * f0 * T * Math.pow(f1 / f0, Math.sqrt(x))) / SR;
    m[i0 + i] += Math.sin(fase) * Math.min(1, i / 24) * Math.exp(-x * 5) * cola(i, n) * vol;
  }
}
// Aire limpio que sube o baja (paneles que se abren, hojas, deslizar).
const soplo = (m, ini, dur, vol, f0, f1, q = 1) => aire(m, ini, dur, vol, { f0, f1, q });
// Un clic de contacto, solo (interruptores, teclas, seguros).
const clic = (m, ini, vol, f = 3200) => aire(m, ini, 0.008, vol, { f0: f, f1: f * 0.8, q: 1.2, forma: (x) => (1 - x) ** 3 });

/** Una sala muy discreta (sólo para que no suene «de computadora»). */
function sala(m, mezcla, tam = 1) {
  const d = [0.0297, 0.0371, 0.0411, 0.0437].map((s) => Math.round(s * tam * SR)), g = 0.7;
  const sal = new Float32Array(m.length);
  for (const L of d) { const b = new Float32Array(L); let k = 0; for (let i = 0; i < m.length; i++) { const v = b[k]; b[k] = m[i] + v * g; sal[i] += v; k = (k + 1) % L; } }
  for (let i = 0; i < m.length; i++) m[i] = m[i] * (1 - mezcla * 0.4) + sal[i] * mezcla * 0.22;
}
function terminar(m, pico, { reverb = 0.06, tam = 1 } = {}) {
  if (reverb) sala(m, reverb, tam);
  let y = 0;
  for (let i = 0; i < m.length; i++) { y += (m[i] - y) * 0.8; m[i] = y; }
  let x1 = 0, y1 = 0;
  for (let i = 0; i < m.length; i++) { const v = m[i] - x1 + 0.995 * y1; x1 = m[i]; y1 = v; m[i] = v; }
  let max = 0;
  for (const v of m) max = Math.max(max, Math.abs(v));
  const k = max ? pico / max : 1, f = Math.round(SR * 0.006);
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
const SALA = { reverb: 0.14, tam: 1.2 };
const SALA_GRANDE = { reverb: 0.22, tam: 1.6 };
const P = "polimero", W = "madera", MET = "metal";

// nombre → [duración, (m, v) => …, pico, final]. El pico es el volumen relativo: lo frecuente, más bajito.
const SON = {
  // — Tocar y elegir (lo que más suena: cortito y bajito) —
  "tocar-boton": [0.1, (m) => toque(m, 0, 1150, 0.6, { caida: 60 }), 0.26],
  "seleccionar-elemento": [0.12, (m) => toque(m, 0, 980, 0.6, { material: W, caida: 50 }), 0.28],
  "seleccionar-varios": [0.14, (m) => { toque(m, 0, 980, 0.55, { material: W, caida: 55 }); toque(m, 0.035, 1240, 0.45, { material: W, caida: 60 }); }, 0.28],
  deseleccionar: [0.1, (m) => toque(m, 0, 820, 0.5, { caida: 65, contacto: 0.15 }), 0.22],
  "elegir-herramienta": [0.12, (m) => { toque(m, 0, 1320, 0.5, { material: W, caida: 55 }); asiento(m, 0, 0.2, 200, 120, 0.04); }, 0.28],
  "menu-mantener": [0.32, (m) => { soplo(m, 0, 0.26, 0.25, 400, 1200, 0.8); fm(m, 0.04, N.A4, 0.25, { dur: 0.26, ataque: 0.06, caida: 7, indice: 0.6 }); }, 0.26],
  deslizador: [0.05, (m) => toque(m, 0, 2100, 0.5, { caida: 110, contacto: 0.2 }), 0.14],
  "arrastrar-pintura": [0.3, (m) => soplo(m, 0, 0.28, 0.6, 600, 1500, 0.9), 0.16],
  "pincel-roce": [0.18, (m) => soplo(m, 0, 0.16, 0.6, 1800, 2400, 2), 0.13],
  "soltar-objeto": [0.14, (m) => { asiento(m, 0, 0.6, 160, 90, 0.07); toque(m, 0.004, 700, 0.35, { material: W, caida: 55, contacto: 0.15 }); }, 0.32],
  "iman-pegar": [0.1, (m) => { clic(m, 0, 0.5); toque(m, 0.002, 1700, 0.45, { material: MET, caida: 70, contacto: 0 }); }, 0.24],
  "mover-hoja": [0.28, (m) => soplo(m, 0, 0.26, 0.6, 300, 700, 0.8), 0.15],
  "girar-objeto": [0.22, (m) => { for (let i = 0; i < 4; i++) toque(m, i * 0.045, 1500 + i * 40, 0.35 - i * 0.05, { material: P, caida: 120, contacto: 0.35 }); }, 0.2],
  "cambiar-tamano": [0.2, (m) => { soplo(m, 0, 0.12, 0.35, 500, 900, 1.2); toque(m, 0.1, 900, 0.4, { caida: 60 }); }, 0.24],
  "zoom-acercar": [0.3, (m) => { soplo(m, 0, 0.2, 0.4, 700, 1800, 1); fm(m, 0.14, N.A5, 0.14, { dur: 0.16, caida: 18, indice: 0.5 }); }, 0.24],
  "zoom-alejar": [0.3, (m) => { soplo(m, 0, 0.2, 0.4, 1800, 700, 1); fm(m, 0.14, N.D5, 0.14, { dur: 0.16, caida: 18, indice: 0.5 }); }, 0.24],
  "zoom-paso": [0.06, (m) => toque(m, 0, 1600, 0.5, { material: MET, caida: 100, contacto: 0.1 }), 0.14],
  "colocar-objeto": [0.14, (m) => { asiento(m, 0, 0.5, 200, 110, 0.06); toque(m, 0.005, 1050, 0.4, { caida: 55 }); }, 0.3],
  duplicar: [0.16, (m) => { toque(m, 0, 1100, 0.5, { caida: 60 }); toque(m, 0.06, 1100, 0.28, { caida: 70 }); }, 0.26],
  "borrar-objeto": [0.24, (m) => { soplo(m, 0, 0.18, 0.45, 1600, 400, 1); asiento(m, 0.1, 0.3, 140, 80, 0.07); }, 0.28],
  agrupar: [0.14, (m) => { toque(m, 0, 1300, 0.45, { material: W, caida: 60 }); toque(m, 0.04, 1000, 0.5, { material: W, caida: 55 }); }, 0.26],
  desagrupar: [0.14, (m) => { toque(m, 0, 1000, 0.5, { material: W, caida: 55 }); toque(m, 0.04, 1300, 0.45, { material: W, caida: 60 }); }, 0.26],
  "ordenar-capas": [0.1, (m) => { toque(m, 0, 1400, 0.45, { material: W, caida: 70 }); toque(m, 0.03, 1200, 0.35, { material: W, caida: 70 }); }, 0.22],
  bloquear: [0.16, (m) => { clic(m, 0, 0.5, 2600); toque(m, 0.03, 1300, 0.45, { material: MET, caida: 55, contacto: 0 }); asiento(m, 0.03, 0.25, 180, 110, 0.05); }, 0.28],
  desbloquear: [0.16, (m) => { toque(m, 0, 1500, 0.4, { material: MET, caida: 55, contacto: 0 }); clic(m, 0.035, 0.45, 3000); }, 0.26],
  ocultar: [0.18, (m) => soplo(m, 0, 0.16, 0.45, 1400, 500, 1.1), 0.18],
  mostrar: [0.18, (m) => soplo(m, 0, 0.16, 0.45, 500, 1400, 1.1), 0.18],
  "dibujar-trazo": [0.12, (m) => soplo(m, 0, 0.1, 0.5, 3000, 3300, 2.5), 0.1],
  borrador: [0.22, (m) => { soplo(m, 0, 0.1, 0.5, 1800, 1500, 1.2); soplo(m, 0.1, 0.1, 0.45, 1700, 1400, 1.2); }, 0.14],
  "elegir-color": [0.2, (m) => { toque(m, 0, 1250, 0.45, { caida: 60 }); fm(m, 0.01, N.Fs5, 0.12, { dur: 0.16, caida: 16, indice: 0.6 }); }, 0.26],
  "aplicar-efecto": [0.5, (m) => { soplo(m, 0, 0.22, 0.3, 600, 1600, 1); fm(m, 0.12, N.D5, 0.2, { dur: 0.36, caida: 8 }); fm(m, 0.12, N.A5, 0.12, { dur: 0.32, caida: 9 }); }, 0.28, SALA],
  "aplicar-animacion": [0.18, (m) => { [1000, 1150, 1300].forEach((f, i) => toque(m, i * 0.04, f, 0.4, { material: W, caida: 70 })); }, 0.24],
  fotograma: [0.06, (m) => toque(m, 0, 1800, 0.45, { material: MET, caida: 110, contacto: 0.15 }), 0.18],
  "escribir-texto": [0.05, (m) => { clic(m, 0, 0.4, 4200); toque(m, 0.001, 2400, 0.25, { caida: 140, contacto: 0 }); }, 0.12],
  deshacer: [0.14, (m) => { toque(m, 0, 1000, 0.45, { caida: 60 }); soplo(m, 0, 0.1, 0.18, 1400, 700, 1.2); }, 0.22],
  rehacer: [0.14, (m) => { toque(m, 0, 1000, 0.45, { caida: 60 }); soplo(m, 0, 0.1, 0.18, 700, 1400, 1.2); }, 0.22],
  // — Guardar y avisos (los únicos con tono) —
  guardar: [0.5, (m) => { fm(m, 0, N.D5, 0.3, { dur: 0.14, caida: 18 }); fm(m, 0.09, N.A5, 0.26, { dur: 0.32, caida: 9 }); }, 0.3, SALA],
  "listo-exito": [0.8, (m) => { fm(m, 0, N.A4, 0.22, { dur: 0.16, caida: 14 }); fm(m, 0, N.D5, 0.22, { dur: 0.16, caida: 14 }); fm(m, 0.12, N.Fs5, 0.26, { dur: 0.5, caida: 5 }); }, 0.32, SALA],
  "aviso-error": [0.4, (m) => { fm(m, 0, N.Fs4, 0.3, { dur: 0.12, caida: 18, indice: 0.9 }); fm(m, 0.11, N.D4, 0.3, { dur: 0.22, caida: 11, indice: 0.9 }); asiento(m, 0.11, 0.2, 130, 80, 0.06); }, 0.3],
  // — Menús —
  "abrir-menu": [0.22, (m) => { soplo(m, 0, 0.16, 0.4, 400, 1400, 1); toque(m, 0.13, 900, 0.3, { caida: 60, contacto: 0.15 }); }, 0.22],
  "cerrar-menu": [0.2, (m) => { soplo(m, 0, 0.15, 0.4, 1400, 400, 1); toque(m, 0.11, 700, 0.28, { caida: 65, contacto: 0.15 }); }, 0.2],
  // El cajón de recursos: un panel que se desliza limpio y asienta con un toque de madera.
  "abrir-recursos": [0.4, (m) => { soplo(m, 0, 0.22, 0.45, 350, 1200, 0.9); toque(m, 0.19, 760, 0.4, { material: W, caida: 45, contacto: 0.2 }); fm(m, 0.2, N.D5, 0.08, { dur: 0.18, caida: 12, indice: 0.4 }); }, 0.26, SALA],
  "cerrar-recursos": [0.32, (m) => { soplo(m, 0, 0.2, 0.45, 1200, 350, 0.9); toque(m, 0.17, 620, 0.38, { material: W, caida: 50, contacto: 0.2 }); }, 0.24],
  "bajar-hoja": [0.2, (m) => soplo(m, 0, 0.18, 0.5, 1200, 450, 0.9), 0.16],
  "subir-hoja": [0.2, (m) => soplo(m, 0, 0.18, 0.5, 450, 1200, 0.9), 0.16],
  atras: [0.14, (m) => { toque(m, 0, 880, 0.45, { caida: 60 }); soplo(m, 0.01, 0.1, 0.16, 1200, 600, 1.2); }, 0.22],
  "interruptor-encender": [0.1, (m) => { clic(m, 0, 0.45, 3400); toque(m, 0.012, 1300, 0.4, { caida: 70, contacto: 0 }); }, 0.24],
  "interruptor-apagar": [0.1, (m) => { clic(m, 0, 0.45, 2800); toque(m, 0.012, 900, 0.38, { caida: 70, contacto: 0 }); }, 0.22],
  "probar-pagina": [0.6, (m) => { soplo(m, 0, 0.34, 0.35, 300, 1500, 0.9); fm(m, 0.26, N.D5, 0.18, { dur: 0.32, caida: 7 }); fm(m, 0.26, N.A5, 0.1, { dur: 0.3, caida: 8 }); }, 0.28, SALA],
  // — Páginas —
  "pagina-nueva": [0.3, (m) => { soplo(m, 0, 0.2, 0.45, 1200, 2600, 0.8); toque(m, 0.18, 900, 0.3, { caida: 60, contacto: 0.15 }); }, 0.22],
  "pagina-duplicar": [0.34, (m) => { soplo(m, 0, 0.13, 0.4, 1300, 2500, 0.8); soplo(m, 0.13, 0.13, 0.35, 1400, 2700, 0.8); toque(m, 0.26, 1000, 0.28, { caida: 60, contacto: 0.15 }); }, 0.22],
  "pagina-cambiar": [0.22, (m) => soplo(m, 0, 0.2, 0.55, 1000, 2300, 0.8), 0.18],
  "pagina-borrar": [0.3, (m) => { soplo(m, 0, 0.22, 0.45, 2200, 500, 0.9); asiento(m, 0.18, 0.28, 150, 85, 0.07); }, 0.24],
  "pagina-reordenar": [0.2, (m) => { soplo(m, 0, 0.14, 0.4, 700, 1300, 1); toque(m, 0.12, 1150, 0.35, { material: W, caida: 60 }); }, 0.22],
  // — Música —
  reproducir: [0.3, (m) => { toque(m, 0, 1000, 0.25, { caida: 70, contacto: 0.15 }); fm(m, 0.01, N.D5, 0.2, { dur: 0.24, caida: 10 }); }, 0.24],
  pausar: [0.26, (m) => { toque(m, 0, 900, 0.25, { caida: 70, contacto: 0.15 }); fm(m, 0.01, N.A4, 0.2, { dur: 0.2, caida: 12 }); }, 0.22],
  // — Publicar —
  publicar: [1, (m) => { soplo(m, 0, 0.36, 0.3, 400, 1800, 0.9); [N.D5, N.Fs5, N.A5].forEach((f, i) => fm(m, 0.28 + i * 0.06, f, 0.16, { dur: 0.6, caida: 4.5 })); }, 0.32, SALA_GRANDE],
  // — Fase 20 y 22: menús, la pareja, Detallitos y el gatito —
  brillo: [0.5, (m) => { fm(m, 0, N.A4, 0.22, { dur: 0.14, caida: 16 }); fm(m, 0.08, N.D5, 0.24, { dur: 0.36, caida: 7 }); }, 0.28, SALA],
  "girar-tarjeta": [0.3, (m) => { soplo(m, 0, 0.22, 0.4, 600, 1800, 1); toque(m, 0.2, 1400, 0.25, { material: MET, caida: 70, contacto: 0 }); }, 0.22],
  "abrir-sobre": [0.34, (m) => { soplo(m, 0, 0.14, 0.45, 900, 2600, 0.9); toque(m, 0.13, 820, 0.35, { caida: 55, contacto: 0.2 }); }, 0.24],
  latido: [0.45, (m) => { asiento(m, 0, 0.9, 110, 55, 0.13); asiento(m, 0.19, 0.7, 100, 50, 0.15); }, 0.42, { reverb: 0.04 }],
  "vincular-pareja": [1.4, (m) => { fm(m, 0, N.D4, 0.18, { dur: 1.2, caida: 2.4, ataque: 0.02 }); fm(m, 0.05, N.A4, 0.16, { dur: 1.1, caida: 2.6, ataque: 0.02 }); fm(m, 0.1, N.Fs5, 0.14, { dur: 1, caida: 3, ataque: 0.02 }); }, 0.36, SALA_GRANDE],
  desvincular: [0.8, (m) => { fm(m, 0, N.A4, 0.2, { dur: 0.22, caida: 10 }); fm(m, 0.14, N.Fs4, 0.2, { dur: 0.24, caida: 9 }); fm(m, 0.28, N.D4, 0.2, { dur: 0.4, caida: 5 }); }, 0.3, SALA],
  "tecla-codigo": [0.06, (m) => { clic(m, 0, 0.35, 3800); toque(m, 0.001, 1500, 0.35, { caida: 90, contacto: 0 }); }, 0.18],
  "coleccion-abrir": [0.7, (m) => { soplo(m, 0, 0.26, 0.35, 400, 1500, 0.9); fm(m, 0.2, N.D5, 0.16, { dur: 0.44, caida: 5 }); fm(m, 0.26, N.A5, 0.1, { dur: 0.4, caida: 6 }); }, 0.28, SALA],
  "detallito-abrir": [0.5, (m) => { soplo(m, 0, 0.16, 0.4, 800, 2200, 0.9); fm(m, 0.14, N.Fs5, 0.16, { dur: 0.34, caida: 7 }); }, 0.26, SALA],
  // Fase 30 · los mensajitos: mandarlo (un airecito que sale y dos notas que suben), que te llegue
  // uno (dos notas tibias de marimba, como un «toc toc») y pegar un sticker (se despega y se aprieta).
  "mensaje-enviar": [0.42, (m) => { soplo(m, 0, 0.16, 0.32, 700, 2600, 0.9); fm(m, 0.07, N.A4, 0.16, { dur: 0.12, caida: 18 }); fm(m, 0.13, N.D5, 0.17, { dur: 0.3, caida: 8 }); }, 0.26, SALA],
  "mensaje-llega": [0.62, (m) => { toque(m, 0, N.Fs5, 0.3, { material: W, caida: 22, contacto: 0.15 }); fm(m, 0.005, N.Fs5, 0.1, { dur: 0.3, caida: 9 }); toque(m, 0.13, N.D5, 0.34, { material: W, caida: 16, contacto: 0.15 }); fm(m, 0.135, N.A5, 0.07, { dur: 0.42, caida: 6 }); }, 0.3, SALA],
  "sticker-pegar": [0.32, (m) => { aire(m, 0, 0.09, 0.55, { f0: 3200, f1: 1400, q: 1.2, forma: (x) => (1 - x) ** 1.5 }); asiento(m, 0.08, 0.5, 170, 90, 0.07); toque(m, 0.085, 980, 0.28, { caida: 60, contacto: 0.3 }); }, 0.26],
  // El gatito del menú, si lo tocas: ronronea bajito.
  "gatito-ronroneo": [1.6, (m) => {
    const am = 22 + azar() * 6, f = (x) => Math.sin(Math.PI * x) ** 1.4;
    aire(m, 0, 0.7, 1, { f0: 150, f1: 200, q: 1.6, am, forma: f });
    aire(m, 0.8, 0.74, 0.9, { f0: 165, f1: 140, q: 1.6, am: am * 1.05, forma: f });
  }, 0.36, { reverb: 0.03 }],
  // — La abejita (su voz, su hola, su adiós…) y el huevito de pascua —
  "abejita-habla": [0.08, (m) => fm(m, 0, N.B4, 0.3, { dur: 0.06, caida: 30, indice: 0.8, glide: 1.04 }), 0.18],
  "abejita-hola": [0.3, (m) => { fm(m, 0, N.A4, 0.25, { dur: 0.1, caida: 20 }); fm(m, 0.08, N.D5, 0.25, { dur: 0.18, caida: 12 }); }, 0.24],
  "abejita-adios": [0.32, (m) => { fm(m, 0, N.D5, 0.25, { dur: 0.1, caida: 20 }); fm(m, 0.09, N.A4, 0.25, { dur: 0.2, caida: 11 }); }, 0.24],
  "abejita-feliz": [0.3, (m) => { fm(m, 0, N.E5, 0.24, { dur: 0.1, caida: 20 }); fm(m, 0.07, N.A5, 0.22, { dur: 0.18, caida: 12 }); }, 0.24],
  "abejita-susto": [0.2, (m) => { soplo(m, 0, 0.08, 0.3, 900, 2600, 1.2); toque(m, 0.05, 1600, 0.3, { material: MET, caida: 60, contacto: 0 }); }, 0.22],
  "abejita-zumbido": [0.6, (m) => aire(m, 0, 0.55, 1, { f0: 220, f1: 250, q: 6, am: 34, forma: (x) => Math.sin(Math.PI * x) }), 0.16],
  "secreto-interferencia": [0.6, (m) => { for (let i = 0; i < 8; i++) aire(m, i * 0.06 + azar() * 0.02, 0.04, 0.6, { f0: 800 + azar() * 3000, f1: 700 + azar() * 3000, q: 0.9, forma: (x) => (1 - x) ** 2 }); }, 0.2],
  "secreto-campanita": [0.9, (m) => fm(m, 0, N.Fs5, 0.25, { dur: 0.8, caida: 4, ratio: 3.5, indice: 0.9, caidaIndice: 6 }), 0.24, SALA_GRANDE],
};

// Reacciones a una página de tu amorcito (Fase 29): más largas y bonitas — piano eléctrico tibio
// sobre un colchón suave que entra despacito, con su eco de sala; nada de brillitos agudos.
// Cada una con TRES figuras distintas (v = 0, 1, 2).
const colchon = (m, ini, notas, vol, dur = 1.6, ataque = 0.28) => notas.forEach((f) => fm(m, ini, f, vol, { dur, ataque, caida: 1.4, indice: 0.35, caidaIndice: 3 }));
const rodar = (m, ini, notas, paso, vol, op = {}) => notas.forEach((f, i) => fm(m, ini + i * paso, f, vol, { dur: 1.5, caida: 2.4, ...op }));
const SON_REACCION = {
  // Te amo: un latido suave y un acorde de amor que se abre nota a nota.
  "reaccion-te-amo": [2.2, (m, v) => {
    const ac = [[N.D4, N.Fs4, N.A4, N.Cs5], [N.G4, N.B4, N.D5, N.Fs5], [N.A3, N.Cs4, N.E4, N.A4]][v];
    asiento(m, 0, 0.45, 120, 62, 0.11); asiento(m, 0.17, 0.32, 110, 58, 0.12);
    rodar(m, 0.3, ac, 0.085, 0.17);
    colchon(m, 0.3, [ac[0] / 2, ac[2] / 2], 0.07, 1.7);
    fm(m, 0.72, ac[3] * 2, 0.07, { dur: 1, caida: 3.5, indice: 0.5 });
  }, 0.46, SALA_GRANDE],
  // Me encantó: tres notas que suben y quedan cantando, con un airecito que sube.
  "reaccion-me-encanto": [1.9, (m, v) => {
    const ns = [[N.D5, N.Fs5, N.A5], [N.A4, N.Cs5, N.E5], [N.Fs4, N.A4, N.D5]][v];
    soplo(m, 0, 0.42, 0.18, 500, 2200, 0.9);
    ns.forEach((f, i) => fm(m, 0.06 + i * 0.11, f, 0.2, { dur: i === 2 ? 1.4 : 0.5, caida: i === 2 ? 2.2 : 6, vib: i === 2 ? 0.005 : 0 }));
    colchon(m, 0.1, [ns[0] / 2, ns[2] / 2], 0.06, 1.4);
  }, 0.44, SALA_GRANDE],
  // Lloré: una melodía tierna que baja, con su temblorcito, sobre un acorde grave.
  "reaccion-llore": [2.3, (m, v) => {
    const ns = [[N.A5, N.Fs5, N.E5, N.D5], [N.Fs5, N.E5, N.Cs5, N.B4], [N.E5, N.D5, N.B4, N.A4]][v];
    ns.forEach((f, i) => fm(m, i * 0.2, f, 0.17, { dur: i === 3 ? 1.4 : 0.5, caida: i === 3 ? 2 : 4.5, vib: 0.008 }));
    colchon(m, 0.05, [[N.B3, N.D4, N.Fs4], [N.Fs3, N.A3, N.Cs4], [N.Fs3, N.B3, N.D4]][v], 0.07, 2);
  }, 0.4, { reverb: 0.3, tam: 1.9 }],
  // Abrazo: un acorde grave y tibio que crece despacio y te envuelve.
  "reaccion-abrazo": [2.2, (m, v) => {
    const ac = [[N.D3, N.A3, N.D4, N.Fs4], [N.G3, N.D4, N.G4, N.B4], [N.A3, N.E4, N.A4, N.Cs5]][v];
    colchon(m, 0, ac, 0.12, 2, 0.4);
    asiento(m, 0.38, 0.35, 95, 55, 0.14);
    fm(m, 0.5, ac[3], 0.1, { dur: 1.4, caida: 2.2, indice: 0.6 });
  }, 0.44, SALA_GRANDE],
  // Beso: un besito (aire cortito), una nota que sube y un acorde que queda.
  "reaccion-beso": [1.5, (m, v) => {
    const [a, b] = [[N.D5, N.A5], [N.E5, N.B5], [N.A4, N.Fs5]][v];
    aire(m, 0, 0.05, 0.4, { f0: 2200, f1: 3200, q: 2, forma: (x) => (1 - x) ** 2 });
    fm(m, 0.04, a, 0.18, { dur: 0.22, caida: 9, glide: b / a });
    rodar(m, 0.2, [a, b], 0.06, 0.15, { dur: 1.1, caida: 3 });
  }, 0.42, SALA],
  // Me reí: notitas que rebotan, juguetonas pero suaves.
  "reaccion-risa": [1.2, (m, v) => {
    [[N.D5, N.Fs5, N.E5, N.A5, N.Fs5], [N.A4, N.Cs5, N.B4, N.E5, N.D5], [N.Fs5, N.A5, N.E5, N.D5, N.Fs5]][v]
      .forEach((f, i) => fm(m, i * 0.085, f, 0.18, { dur: i === 4 ? 0.6 : 0.12, caida: i === 4 ? 5 : 20 }));
  }, 0.38, SALA],
  "reaccion-quitar": [0.5, (m, v) => {
    soplo(m, 0, 0.22, 0.35, 1600, 500, 1);
    toque(m, 0.16, [800, 740, 860][v], 0.35, { caida: 55, contacto: 0.15 });
  }, 0.24],
};
const PROPIAS = new Set(Object.keys(SON_REACCION));
Object.assign(SON, SON_REACCION);
// Los que suben por la escala al repetirse (o marcan escalones): con una versión basta.
const UNA_SOLA = new Set(["seleccionar-elemento", "seleccionar-varios", "colocar-objeto", "iman-pegar", "duplicar", "ordenar-capas", "fotograma", "zoom-paso", "deslizador"]);
// Las tres versiones de las de fábrica: el original, un tono arriba y un tono abajo.
const TONOS = [1, 1.1225, 0.8909];

mkdirSync(DIR, { recursive: true });
const solo = process.argv.slice(2);
let total = 0, cuantos = 0;
for (const [nombre, [dur, hacer, pico, fin]] of Object.entries(SON)) {
  const versiones = UNA_SOLA.has(nombre) ? 1 : 3;
  for (let v = 0; v < versiones; v++) {
    semilla = 11 + v * 7919 + nombre.length * 31;
    T = PROPIAS.has(nombre) ? 1 : TONOS[v];
    const m = lienzo(dur + 0.08 + (fin?.reverb > 0.1 ? 0.25 : 0));
    hacer(m, v);
    const b = wav(terminar(m, pico, fin));
    if (solo.length && !solo.includes(nombre)) continue;
    writeFileSync(DIR + nombre + (v ? "-" + (v + 1) : "") + ".wav", b);
    total += b.length; cuantos++;
  }
}
T = 1;
console.log(`${cuantos} archivos · ${(total / 1024).toFixed(0)} KB en assets/sonidos-editor/`);
