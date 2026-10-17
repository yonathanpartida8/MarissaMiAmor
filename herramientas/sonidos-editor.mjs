// Genera los sonidos del editor: UN archivo por interacción, con su nombre, en assets/sonidos-editor/.
//   node herramientas/sonidos-editor.mjs            (sobrescribe los <nombre>.wav de la lista)
//   node herramientas/sonidos-editor.mjs tocar-boton zoom-acercar   (sólo esos)
// Fase 24: TODOS en estilo pixel art (como una consola de 8 bits), pero suaves y serios:
//   · ondas de consola: cuadrada al 12, 25 y 50 % (sin aliasing), triangular de 4 bits y
//     ruido de registro de 15 bits (normal o metálico);
//   · tono y volumen cambian a pasitos de 1/120 s, con 16 escalones de volumen (eso es lo
//     que suena «a pixel»), suavizados lo justo para que nada truene;
//   · registro grave y medio, sin carreras agudas, sin fanfarrias ni «estrellitas»;
//   · un pasa-bajos al final (nada chilla) y, en los que abren algo, un eco cortito.
// Cada uno tiene su propia figura (notas, intervalos, onda y ritmo): no hay dos iguales.
// Cada uno sale en TRES versiones (nombre.wav, nombre-2.wav, nombre-3.wav) que el editor turna sin
// repetir la última: las de fábrica, a otro tono; las reacciones, con su propia figura.
// (Los que suben por la escala al repetirse —elegir, imán, colocar…— van en una sola versión.)
// WAV mono 16 bits a 24 000 Hz.
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 24000, DIR = new URL("../assets/sonidos-editor/", import.meta.url).pathname;
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// Notas: n("C5") → Hz (la4 = 440).
const LETRA = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
const n = (s) => { const k = /^([A-G])(#|b)?(\d)$/.exec(s); return 440 * 2 ** ((LETRA[k[1]] + (k[2] === "#" ? 1 : k[2] === "b" ? -1 : 0) + (k[3] - 4) * 12) / 12); };
// El tono de la versión que se está haciendo (1 = la original).
let T = 1;
// La consola cambia tono y volumen a pasitos.
const CUADRO = 1 / 120;
const lienzo = (dur) => new Float32Array(Math.round(SR * dur));
// Una curva de subir y bajar (para barridos de ruido y zumbidos).
const arco = (x) => Math.sin(Math.PI * Math.min(1, x));

// Corrige el escalón de la cuadrada para que no haya aliasing (lo que la haría chillona).
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
/** El volumen de consola: 16 escalones, suavizados ~1 ms para que no truenen. */
function escalon(estado, env) {
  estado.v += (Math.round(env * 15) / 15 - estado.v) * 0.06;
  return estado.v;
}

/**
 * Una voz de consola.
 *   onda   "tri" (triangular de 4 bits) | "p12" | "p25" | "p50" (cuadrada de ese ancho)
 *   hasta  el tono al que se desliza (a pasitos); arp: semitonos que se turnan cada `paso`
 *   caida  qué tan rápido se apaga; forma(x): otra curva de volumen (0..1 a lo largo)
 */
function tono(m, ini, f, { onda = "tri", dur = 0.1, vol = 0.5, ataque = 0.004, caida = 14, hasta = 0, curva = 1, arp = null, paso = 1 / 30, vib = 0, vibHz = 6, forma = null } = {}) {
  const i0 = Math.round(ini * SR), cant = Math.min(m.length - i0, Math.round(dur * SR));
  if (cant <= 0) return;
  const ancho = { p12: 0.125, p25: 0.25, p50: 0.5 }[onda];
  const est = { v: 0 };
  let fase = azar();
  for (let i = 0; i < cant; i++) {
    const t = i / SR, tq = Math.floor(t / CUADRO) * CUADRO, x = Math.min(1, tq / dur);
    let ff = f * T;
    if (hasta) ff *= Math.pow(hasta / f, Math.pow(x, curva));
    if (arp) ff *= 2 ** (arp[Math.min(arp.length - 1, Math.floor(tq / paso))] / 12);
    if (vib) ff *= 1 + vib * Math.sin(2 * Math.PI * vibHz * tq);
    const dt = ff / SR;
    fase += dt;
    if (fase >= 1) fase -= 1;
    let y;
    if (ancho) y = (fase < ancho ? 1 : -1) + blep(fase, dt) - blep((fase - ancho + 1) % 1, dt) - (2 * ancho - 1);
    else y = Math.round((fase < 0.5 ? fase * 4 - 1 : 3 - fase * 4) * 7.5) / 7.5;
    let env = forma ? forma(x) : Math.min(1, t / ataque) * Math.exp(-tq * caida);
    if (i > cant - 48) env *= (cant - i) / 48;
    m[i0 + i] += y * escalon(est, env) * vol;
  }
}

/**
 * Ruido de consola (registro de 15 bits). `hz`: qué tan seguido cambia (grave = rasposo,
 * alto = siseo), puede deslizarse `hasta` otro; `corto`: el modo metálico; `suave`: qué tanto se
 * redondea (menos = más suave); `am`: un temblorcito de volumen (hojas que aletean, ronroneo).
 */
function ruido(m, ini, dur, vol, { hz = 4000, hasta = 0, corto = false, ataque = 0.003, caida = 18, am = 0, suave = 0.5, forma = null } = {}) {
  const i0 = Math.round(ini * SR), cant = Math.min(m.length - i0, Math.round(dur * SR));
  if (cant <= 0) return;
  const est = { v: 0 };
  let reg = 1 + Math.floor(azar() * 32766), acc = 0, y = -1, lp = 0;
  for (let i = 0; i < cant; i++) {
    const t = i / SR, tq = Math.floor(t / CUADRO) * CUADRO, x = Math.min(1, tq / dur);
    acc += (hasta ? hz * Math.pow(hasta / hz, x) : hz) * Math.sqrt(T) / SR;
    while (acc >= 1) {
      acc -= 1;
      const b = (reg ^ (reg >> (corto ? 6 : 1))) & 1;
      reg = (reg >> 1) | (b << 14);
      y = reg & 1 ? 1 : -1;
    }
    lp += (y - lp) * suave;
    let env = forma ? forma(x) : Math.min(1, t / ataque) * Math.exp(-tq * caida);
    if (am) env *= 0.55 + 0.45 * Math.sin(2 * Math.PI * am * tq);
    if (i > cant - 48) env *= (cant - i) / 48;
    m[i0 + i] += lp * escalon(est, env) * vol;
  }
}

/** Eco cortito de consola (una sola repetición, más bajita), pasa-bajos suave, sin zumbido de fondo y al volumen justo. */
function terminar(m, pico, { eco = 0, retardo = 0.11, luz = 0.5 } = {}) {
  if (eco) { const d = Math.round(retardo * SR); for (let i = m.length - 1; i >= d; i--) m[i] += m[i - d] * eco; }
  const a1 = 0.35 + 0.35 * luz;
  let a = 0, b = 0;
  for (let i = 0; i < m.length; i++) { a += (m[i] - a) * a1; b += (a - b) * 0.72; m[i] = b; }
  let x1 = 0, y1 = 0;
  for (let i = 0; i < m.length; i++) { const y = m[i] - x1 + 0.995 * y1; x1 = m[i]; y1 = y; m[i] = y; }
  let max = 0;
  for (const v of m) max = Math.max(max, Math.abs(v));
  const k = max ? pico / max : 1, f = Math.round(SR * 0.006);
  for (let i = 0; i < m.length; i++) m[i] *= k * (i > m.length - f ? (m.length - i) / f : 1) * Math.min(1, i / 24);
  return m;
}
function wav(m) {
  const cant = m.length, b = Buffer.alloc(44 + cant * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + cant * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(cant * 2, 40);
  for (let i = 0; i < cant; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, m[i])) * 32767), 44 + i * 2);
  return b;
}

// «sopla»: un barrido de ruido que sube y baja (papel, hojas, cajones). «clic»: un golpecito metálico.
const sopla = (m, ini, dur, vol, hz, hasta, op = {}) => ruido(m, ini, dur, vol, { hz, hasta, forma: arco, suave: 0.28, ...op });
const clic = (m, ini, vol, hz = 8000) => ruido(m, ini, 0.02, vol, { hz, corto: true, caida: 140 });

// nombre → [duración, (m, v) => …, pico, final]. El pico es el volumen relativo: lo frecuente, más bajito.
const SON = {
  // — Tocar y elegir (lo que más suena: cortito y bajito) —
  "tocar-boton": [0.08, (m) => { tono(m, 0, n("E5"), { dur: 0.06, caida: 45, vol: 0.6 }); tono(m, 0, n("E6"), { onda: "p12", dur: 0.017, vol: 0.12, caida: 80 }); }, 0.34],
  "seleccionar-elemento": [0.1, (m) => { tono(m, 0, n("A5"), { onda: "p25", dur: 0.05, caida: 40, vol: 0.35 }); tono(m, 0, n("A4"), { dur: 0.08, caida: 30 }); }, 0.36],
  "seleccionar-varios": [0.14, (m) => tono(m, 0, n("A4"), { onda: "p25", dur: 0.12, arp: [0, 5, 12], paso: 0.033, caida: 22, vol: 0.4 }), 0.34],
  deseleccionar: [0.1, (m) => tono(m, 0, n("D5"), { onda: "p25", dur: 0.08, hasta: n("A4"), caida: 30, vol: 0.35 }), 0.28],
  "elegir-herramienta": [0.12, (m) => tono(m, 0, n("G4"), { dur: 0.1, arp: [0, 7], paso: 0.025, caida: 25 }), 0.36],
  "menu-mantener": [0.3, (m) => tono(m, 0, n("F4"), { onda: "p12", dur: 0.28, hasta: n("G4"), ataque: 0.05, caida: 6, vib: 0.008, vol: 0.4 }), 0.32],
  deslizador: [0.04, (m) => tono(m, 0, n("C6"), { dur: 0.03, caida: 90 }), 0.2],
  "arrastrar-pintura": [0.28, (m) => sopla(m, 0, 0.26, 0.5, 1500, 3200, { suave: 0.3 }), 0.24],
  "pincel-roce": [0.16, (m) => ruido(m, 0, 0.15, 0.5, { hz: 5200, forma: arco, suave: 0.25 }), 0.16],
  "soltar-objeto": [0.14, (m) => { tono(m, 0, n("G4"), { dur: 0.11, hasta: n("C4"), caida: 22, vol: 0.6 }); ruido(m, 0, 0.03, 0.2, { hz: 2400, caida: 90 }); }, 0.38],
  "iman-pegar": [0.08, (m) => { tono(m, 0, n("C6"), { onda: "p50", dur: 0.025, vol: 0.25, caida: 70 }); tono(m, 0.012, n("C5"), { dur: 0.06, caida: 40 }); }, 0.3],
  "mover-hoja": [0.26, (m) => sopla(m, 0, 0.24, 0.5, 800, 2000, { suave: 0.25 }), 0.2],
  "girar-objeto": [0.22, (m) => tono(m, 0, n("C5"), { onda: "p25", dur: 0.2, hasta: n("G5"), curva: 0.7, caida: 9, vib: 0.01, vibHz: 14, vol: 0.3 }), 0.28],
  "cambiar-tamano": [0.22, (m) => { tono(m, 0, n("A4"), { dur: 0.13, hasta: n("E5"), caida: 10 }); tono(m, 0.12, n("D5"), { dur: 0.08, caida: 30, vol: 0.45 }); }, 0.32],
  "zoom-acercar": [0.2, (m) => { tono(m, 0, n("A4"), { onda: "p12", dur: 0.18, hasta: n("A5"), caida: 8, vol: 0.35 }); tono(m, 0, n("A3"), { dur: 0.18, hasta: n("A4"), caida: 8, vol: 0.35 }); }, 0.3],
  "zoom-alejar": [0.2, (m) => { tono(m, 0, n("A5"), { onda: "p12", dur: 0.18, hasta: n("A4"), caida: 8, vol: 0.35 }); tono(m, 0, n("A4"), { dur: 0.18, hasta: n("A3"), caida: 8, vol: 0.35 }); }, 0.3],
  "zoom-paso": [0.05, (m) => tono(m, 0, n("A5"), { dur: 0.035, caida: 70 }), 0.18],
  "colocar-objeto": [0.14, (m) => { tono(m, 0, n("E5"), { dur: 0.1, hasta: n("A4"), curva: 0.5, caida: 20 }); tono(m, 0, n("A5"), { onda: "p25", dur: 0.02, vol: 0.18, caida: 80 }); }, 0.36],
  duplicar: [0.2, (m) => { tono(m, 0, n("D5"), { onda: "p25", dur: 0.05, caida: 40, vol: 0.4 }); tono(m, 0.08, n("D5"), { onda: "p25", dur: 0.05, caida: 40, vol: 0.22 }); tono(m, 0, n("D4"), { dur: 0.06, caida: 35, vol: 0.4 }); }, 0.34],
  "borrar-objeto": [0.24, (m) => { ruido(m, 0, 0.18, 0.45, { hz: 3000, hasta: 600, caida: 10 }); tono(m, 0.04, n("C4"), { dur: 0.14, hasta: n("G3"), caida: 18 }); }, 0.34],
  agrupar: [0.16, (m) => { tono(m, 0, n("F4"), { dur: 0.14, arp: [0, 7], paso: 0.045, caida: 16 }); tono(m, 0, n("C5"), { onda: "p25", dur: 0.14, arp: [0, -5], paso: 0.045, caida: 16, vol: 0.25 }); }, 0.34],
  desagrupar: [0.16, (m) => { tono(m, 0, n("C5"), { dur: 0.14, arp: [0, -7], paso: 0.045, caida: 16 }); tono(m, 0, n("F4"), { onda: "p25", dur: 0.14, arp: [0, 5], paso: 0.045, caida: 16, vol: 0.25 }); }, 0.34],
  "ordenar-capas": [0.08, (m) => tono(m, 0, n("B4"), { onda: "p12", dur: 0.06, caida: 40 }), 0.28],
  bloquear: [0.18, (m) => { clic(m, 0, 0.4, 9000); tono(m, 0.03, n("G4"), { dur: 0.12, arp: [0, -7], paso: 0.04, caida: 20 }); }, 0.34],
  desbloquear: [0.18, (m) => { clic(m, 0, 0.4, 9000); tono(m, 0.03, n("D4"), { dur: 0.12, arp: [0, 5], paso: 0.04, caida: 20 }); }, 0.34],
  ocultar: [0.18, (m) => tono(m, 0, n("E5"), { onda: "p25", dur: 0.16, hasta: n("B4"), caida: 16, vol: 0.32 }), 0.26],
  mostrar: [0.18, (m) => tono(m, 0, n("B4"), { onda: "p25", dur: 0.16, hasta: n("E5"), caida: 16, vol: 0.32 }), 0.26],
  "dibujar-trazo": [0.12, (m) => ruido(m, 0, 0.1, 0.5, { hz: 6500, forma: arco, suave: 0.2 }), 0.14],
  borrador: [0.2, (m) => ruido(m, 0, 0.18, 0.5, { hz: 2600, am: 16, forma: arco, suave: 0.3 }), 0.2],
  "elegir-color": [0.12, (m) => { tono(m, 0, n("G5"), { onda: "p25", dur: 0.03, caida: 60, vol: 0.3 }); tono(m, 0.03, n("D5"), { dur: 0.08, caida: 28 }); }, 0.32],
  "aplicar-efecto": [0.3, (m) => { sopla(m, 0, 0.22, 0.25, 1000, 2600, { suave: 0.3 }); tono(m, 0.02, n("A4"), { dur: 0.26, hasta: n("A5"), curva: 0.6, caida: 9 }); }, 0.34],
  "aplicar-animacion": [0.3, (m) => tono(m, 0, n("D5"), { onda: "p25", dur: 0.26, vib: 0.03, vibHz: 7, caida: 9, vol: 0.35 }), 0.3],
  fotograma: [0.08, (m) => { tono(m, 0, n("B5"), { onda: "p12", dur: 0.03, caida: 70, vol: 0.3 }); tono(m, 0.035, n("E5"), { dur: 0.04, caida: 60, vol: 0.45 }); }, 0.28],
  "escribir-texto": [0.05, (m) => { clic(m, 0, 0.35, 7000); tono(m, 0, n("F5"), { onda: "p50", dur: 0.02, vol: 0.12, caida: 120 }); }, 0.2],
  deshacer: [0.12, (m) => tono(m, 0, n("G5"), { onda: "p25", dur: 0.1, hasta: n("D5"), caida: 22, vol: 0.32 }), 0.28],
  rehacer: [0.12, (m) => tono(m, 0, n("D5"), { onda: "p25", dur: 0.1, hasta: n("G5"), caida: 22, vol: 0.32 }), 0.28],
  // — Guardar y avisos —
  guardar: [0.22, (m) => { tono(m, 0, n("G4"), { dur: 0.07, caida: 30 }); tono(m, 0.08, n("C5"), { dur: 0.12, caida: 18 }); tono(m, 0.08, n("C4"), { onda: "p12", dur: 0.12, caida: 18, vol: 0.2 }); }, 0.34],
  "listo-exito": [0.4, (m) => { tono(m, 0, n("C5"), { dur: 0.1, caida: 20 }); tono(m, 0.1, n("G5"), { dur: 0.22, caida: 10 }); tono(m, 0.1, n("G4"), { onda: "p25", dur: 0.22, caida: 10, vol: 0.18 }); }, 0.36, { eco: 0.18 }],
  "aviso-error": [0.24, (m) => { tono(m, 0, n("E4"), { onda: "p50", dur: 0.07, caida: 25, vol: 0.3 }); tono(m, 0.1, n("Eb4"), { onda: "p50", dur: 0.1, caida: 20, vol: 0.3 }); tono(m, 0, n("E3"), { dur: 0.2, caida: 12, vol: 0.4 }); }, 0.34],
  // — Menús —
  "abrir-menu": [0.2, (m) => { sopla(m, 0, 0.1, 0.18, 1200, 2400, { suave: 0.3 }); tono(m, 0.02, n("D4"), { dur: 0.16, arp: [0, 7], paso: 0.04, caida: 14 }); }, 0.32, { eco: 0.15 }],
  "cerrar-menu": [0.18, (m) => { sopla(m, 0, 0.1, 0.18, 2400, 1200, { suave: 0.3 }); tono(m, 0.02, n("A4"), { dur: 0.14, arp: [0, -7], paso: 0.04, caida: 16 }); }, 0.3],
  // El cajón de recursos: se desliza como papel y asienta con dos notitas de madera.
  "abrir-recursos": [0.32, (m) => { sopla(m, 0, 0.16, 0.25, 600, 1800, { suave: 0.25 }); tono(m, 0.08, n("G4"), { dur: 0.2, arp: [0, 5], paso: 0.05, caida: 12 }); tono(m, 0.13, n("C5"), { onda: "p25", dur: 0.16, caida: 14, vol: 0.16 }); }, 0.36, { eco: 0.16 }],
  "cerrar-recursos": [0.26, (m) => { sopla(m, 0, 0.14, 0.25, 1800, 600, { suave: 0.25 }); tono(m, 0.06, n("C5"), { dur: 0.16, arp: [0, -5], paso: 0.05, caida: 14 }); }, 0.32],
  "bajar-hoja": [0.18, (m) => sopla(m, 0, 0.16, 0.5, 1500, 650), 0.2],
  "subir-hoja": [0.18, (m) => sopla(m, 0, 0.16, 0.5, 650, 1500), 0.2],
  atras: [0.12, (m) => { tono(m, 0, n("A5"), { onda: "p25", dur: 0.06, hasta: n("E5"), caida: 30, vol: 0.3 }); tono(m, 0.02, n("E4"), { dur: 0.08, caida: 30, vol: 0.45 }); }, 0.3],
  "interruptor-encender": [0.12, (m) => { clic(m, 0, 0.35, 8000); tono(m, 0.01, n("E5"), { onda: "p25", dur: 0.1, arp: [0, 7], paso: 0.035, caida: 24, vol: 0.32 }); }, 0.3],
  "interruptor-apagar": [0.12, (m) => { clic(m, 0, 0.35, 6000); tono(m, 0.01, n("B5"), { onda: "p25", dur: 0.1, arp: [0, -7], paso: 0.035, caida: 24, vol: 0.28 }); }, 0.28],
  "probar-pagina": [0.5, (m) => { sopla(m, 0, 0.3, 0.2, 500, 1600, { suave: 0.25 }); tono(m, 0.06, n("A4"), { dur: 0.4, arp: [0, 5, 10], paso: 0.07, caida: 6 }); tono(m, 0.06, n("A3"), { onda: "p12", dur: 0.4, caida: 6, vol: 0.18 }); }, 0.36, { eco: 0.2 }],
  // — Páginas —
  "pagina-nueva": [0.3, (m) => { sopla(m, 0, 0.2, 0.4, 2400, 3600, { am: 28, suave: 0.3 }); tono(m, 0.18, n("D5"), { dur: 0.1, caida: 26 }); }, 0.3],
  "pagina-duplicar": [0.34, (m) => { ruido(m, 0, 0.12, 0.4, { hz: 2600, am: 30, forma: arco, suave: 0.3 }); ruido(m, 0.14, 0.12, 0.3, { hz: 2800, am: 30, forma: arco, suave: 0.3 }); tono(m, 0.26, n("F5"), { dur: 0.07, caida: 30, vol: 0.4 }); }, 0.3],
  "pagina-cambiar": [0.2, (m) => sopla(m, 0, 0.18, 0.5, 1800, 3400, { am: 32, suave: 0.3 }), 0.24],
  "pagina-borrar": [0.3, (m) => { for (let i = 0; i < 6; i++) ruido(m, i * 0.04 + azar() * 0.012, 0.03, 0.4, { hz: 1200 + azar() * 3000, caida: 60 }); tono(m, 0.22, n("C4"), { dur: 0.07, caida: 30, vol: 0.4 }); }, 0.3],
  "pagina-reordenar": [0.2, (m) => { ruido(m, 0, 0.08, 0.3, { hz: 1400, forma: arco, suave: 0.3 }); tono(m, 0.05, n("A4"), { dur: 0.13, hasta: n("D5"), curva: 0.5, caida: 18 }); }, 0.3],
  // — Música —
  reproducir: [0.16, (m) => { tono(m, 0, n("G4"), { dur: 0.06, caida: 30 }); tono(m, 0.05, n("D5"), { onda: "p25", dur: 0.1, caida: 22, vol: 0.3 }); }, 0.32],
  pausar: [0.16, (m) => { tono(m, 0, n("D5"), { onda: "p25", dur: 0.06, caida: 30, vol: 0.3 }); tono(m, 0.05, n("G4"), { dur: 0.1, caida: 22 }); }, 0.3],
  // — Publicar —
  publicar: [0.7, (m) => { sopla(m, 0, 0.3, 0.2, 700, 2000, { suave: 0.25 }); tono(m, 0.05, n("C4"), { dur: 0.5, arp: [0, 7, 12], paso: 0.09, caida: 4 }); tono(m, 0.14, n("G4"), { onda: "p25", dur: 0.42, arp: [0, 5], paso: 0.09, caida: 5, vol: 0.18 }); }, 0.38, { eco: 0.22 }],
  // — Fase 20 y 22: menús, la pareja, Detallitos y el gatito —
  brillo: [0.26, (m) => { tono(m, 0, n("B4"), { dur: 0.22, hasta: n("E5"), curva: 0.4, caida: 10 }); tono(m, 0.02, n("E4"), { onda: "p12", dur: 0.2, caida: 10, vol: 0.2 }); }, 0.32, { eco: 0.16 }],
  "girar-tarjeta": [0.26, (m) => { sopla(m, 0, 0.16, 0.25, 900, 2400, { suave: 0.3 }); tono(m, 0.04, n("E4"), { onda: "p12", dur: 0.2, hasta: n("B4"), vib: 0.02, vibHz: 18, caida: 10, vol: 0.32 }); }, 0.3],
  "abrir-sobre": [0.34, (m) => { ruido(m, 0, 0.12, 0.35, { hz: 1600, hasta: 4200, caida: 8 }); tono(m, 0.12, n("F4"), { dur: 0.2, arp: [0, 4], paso: 0.06, caida: 12 }); }, 0.32],
  latido: [0.45, (m) => { tono(m, 0, n("C3"), { dur: 0.12, hasta: n("G2"), caida: 20, vol: 0.9 }); tono(m, 0.19, n("A2"), { dur: 0.14, hasta: n("E2"), caida: 18, vol: 0.7 }); }, 0.48],
  "vincular-pareja": [1.2, (m) => { tono(m, 0, n("C4"), { dur: 1, arp: [0, 7, 12], paso: 0.14, caida: 2.6 }); tono(m, 0.07, n("E4"), { onda: "p25", dur: 0.95, arp: [0, 5, 12], paso: 0.14, caida: 3, vol: 0.16, vib: 0.006, vibHz: 5 }); }, 0.4, { eco: 0.24, retardo: 0.14 }],
  desvincular: [0.7, (m) => { tono(m, 0, n("G4"), { onda: "p25", dur: 0.6, arp: [0, -5, -12], paso: 0.16, caida: 4, vol: 0.28 }); tono(m, 0, n("C4"), { dur: 0.6, hasta: n("G3"), caida: 4, vol: 0.4 }); }, 0.34],
  "tecla-codigo": [0.06, (m) => { tono(m, 0, n("F5"), { onda: "p50", dur: 0.04, caida: 60, vol: 0.2 }); tono(m, 0, n("F4"), { dur: 0.045, caida: 55, vol: 0.4 }); }, 0.24],
  "coleccion-abrir": [0.5, (m) => { sopla(m, 0, 0.2, 0.3, 1500, 2800, { am: 26, suave: 0.3 }); tono(m, 0.14, n("E4"), { dur: 0.32, arp: [0, 7], paso: 0.08, caida: 6, vib: 0.008, vibHz: 5 }); }, 0.34, { eco: 0.18 }],
  "detallito-abrir": [0.36, (m) => { ruido(m, 0, 0.1, 0.3, { hz: 1200, hasta: 3000, caida: 10 }); tono(m, 0.08, n("A4"), { onda: "p25", dur: 0.24, hasta: n("E5"), curva: 0.4, caida: 9, vol: 0.3 }); }, 0.32, { eco: 0.16 }],
  // El gatito del menú, si lo tocas: ronronea (ruido grave que tiembla).
  "gatito-ronroneo": [1.5, (m) => {
    const am = 23 + azar() * 4, f = (x) => Math.sin(Math.PI * x) ** 1.3;
    ruido(m, 0, 0.66, 0.9, { hz: 260, forma: f, am, suave: 0.2 });
    ruido(m, 0.76, 0.7, 0.8, { hz: 230, forma: f, am: am * 1.04, suave: 0.2 });
  }, 0.42],
  // — La abejita (su voz, su hola, su adiós…) y el huevito de pascua —
  "abejita-habla": [0.08, (m) => tono(m, 0, n("A4"), { onda: "p25", dur: 0.065, arp: [0, 2], paso: 0.03, caida: 30, vol: 0.35 }), 0.24],
  "abejita-hola": [0.26, (m) => { tono(m, 0, n("G4"), { onda: "p25", dur: 0.1, caida: 18, vol: 0.32 }); tono(m, 0.1, n("C5"), { onda: "p25", dur: 0.14, caida: 14, vib: 0.02, vibHz: 9, vol: 0.32 }); }, 0.3],
  "abejita-adios": [0.3, (m) => { tono(m, 0, n("C5"), { onda: "p25", dur: 0.1, caida: 18, vol: 0.32 }); tono(m, 0.11, n("G4"), { onda: "p25", dur: 0.17, caida: 10, vib: 0.02, vibHz: 9, vol: 0.32 }); }, 0.3],
  "abejita-feliz": [0.3, (m) => [n("E5"), n("G5"), n("E5")].forEach((f, i) => tono(m, i * 0.07, f, { dur: 0.08, caida: 25 })), 0.32],
  "abejita-susto": [0.22, (m) => { tono(m, 0, n("C5"), { onda: "p50", dur: 0.14, hasta: n("C6"), curva: 0.3, caida: 12, vol: 0.22 }); ruido(m, 0, 0.05, 0.2, { hz: 5000, caida: 40 }); }, 0.3],
  "abejita-zumbido": [0.6, (m) => tono(m, 0, n("F3"), { onda: "p12", dur: 0.55, forma: arco, vib: 0.03, vibHz: 28, vol: 0.4 }), 0.24],
  "secreto-interferencia": [0.6, (m) => { for (let i = 0; i < 9; i++) ruido(m, i * 0.06 + azar() * 0.02, 0.04 + azar() * 0.03, 0.45, { hz: 800 + azar() * 7000, corto: azar() < 0.5, caida: 20 }); }, 0.28],
  "secreto-campanita": [0.6, (m) => { tono(m, 0, n("E5"), { dur: 0.45, caida: 6 }); tono(m, 0, n("B5"), { onda: "p12", dur: 0.25, caida: 10, vol: 0.12 }); }, 0.3, { eco: 0.2 }],
};

// Reacciones a una página de tu amorcito: cada una con TRES figuras distintas (v = 0, 1, 2).
const SON_REACCION = {
  "reaccion-te-amo": [0.8, (m, v) => {
    const [a, b] = [["C5", "E5"], ["G4", "B4"], ["A4", "C#5"]][v].map(n);
    tono(m, 0, a, { dur: 0.16, caida: 14 });
    tono(m, 0.14, b, { dur: 0.5, caida: 4, vib: 0.006, vibHz: 5 });
    tono(m, 0.14, b / 2, { onda: "p25", dur: 0.5, caida: 4, vol: 0.14 });
  }, 0.4, { eco: 0.22 }],
  "reaccion-me-encanto": [0.7, (m, v) => {
    const f = [n("D5"), n("F5"), n("A4")][v];
    tono(m, 0, f, { onda: "p25", dur: 0.36, hasta: f * 2, curva: 0.5, caida: 6, vib: 0.012, vibHz: 7, vol: 0.3 });
    tono(m, 0, f / 2, { dur: 0.36, hasta: f, curva: 0.5, caida: 6 });
  }, 0.36, { eco: 0.18 }],
  "reaccion-llore": [0.9, (m, v) => {
    const f = [n("E5"), n("D5"), n("G5")][v];
    tono(m, 0, f, { dur: 0.7, hasta: f * 2 ** (-[3, 4, 5][v] / 12), curva: 0.8, caida: 3.2, vib: 0.012, vibHz: 4.5 });
    tono(m, 0.05, f / 2, { onda: "p12", dur: 0.6, caida: 4, vol: 0.14 });
  }, 0.36, { eco: 0.24, retardo: 0.15 }],
  "reaccion-abrazo": [0.9, (m, v) => {
    const r = [n("C4"), n("A3"), n("D4")][v];
    tono(m, 0, r, { dur: 0.8, ataque: 0.12, caida: 3 });
    tono(m, 0, r * 1.5, { dur: 0.8, ataque: 0.16, caida: 3, vol: 0.4 });
    tono(m, 0.05, r * 2, { onda: "p25", dur: 0.7, ataque: 0.2, caida: 3.5, vol: 0.12 });
  }, 0.4],
  "reaccion-beso": [0.4, (m, v) => {
    const f = [n("G5"), n("A5"), n("E5")][v];
    tono(m, 0, f * 0.7, { onda: "p25", dur: 0.08, hasta: f, curva: 0.4, caida: 20, vol: 0.32 });
    clic(m, 0.07, 0.3);
    tono(m, 0.09, f, { dur: 0.18, caida: 16 });
  }, 0.34, { eco: 0.14 }],
  "reaccion-risa": [0.45, (m, v) => {
    [["E5", "G5", "E5"], ["D5", "F5", "A5"], ["G5", "E5", "G5"]][v].map(n).forEach((f, i) => tono(m, i * 0.09, f, { onda: "p25", dur: 0.07, caida: 30, vol: 0.32 }));
  }, 0.34],
  "reaccion-quitar": [0.24, (m, v) => {
    const f = [n("G4"), n("E4"), n("A4")][v];
    ruido(m, 0, 0.06, 0.25, { hz: 2500, hasta: 800, caida: 20 });
    tono(m, 0.02, f, { dur: 0.18, hasta: f * 0.75, caida: 14 });
  }, 0.28],
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
    const m = lienzo(dur + 0.06 + (fin?.eco ? (fin.retardo || 0.11) + 0.12 : 0));
    hacer(m, v);
    const b = wav(terminar(m, pico, fin));
    if (solo.length && !solo.includes(nombre)) continue;
    writeFileSync(DIR + nombre + (v ? "-" + (v + 1) : "") + ".wav", b);
    total += b.length; cuantos++;
  }
}
T = 1;
console.log(`${cuantos} archivos · ${(total / 1024).toFixed(0)} KB en assets/sonidos-editor/`);
