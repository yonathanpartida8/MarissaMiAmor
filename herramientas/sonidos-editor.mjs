// Genera los sonidos suaves del editor (assets/sonidos-editor/): WAV mono 16 bits, 22 050 Hz.
// node herramientas/sonidos-editor.mjs   (sobrescribe los que se llamen <categoría>-N.wav)
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 22050, DIR = new URL("../assets/sonidos-editor/", import.meta.url).pathname;
let semilla = 7; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
function wav(muestras) {
  const n = muestras.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, muestras[i])) * 32767), 44 + i * 2);
  return b;
}
/** Tonos: [{f0, f1, ini, dur, vol, forma}] con ataque corto y caída exponencial. */
function sintetizar(dur, tonos, ruido = null) {
  const n = Math.round(SR * dur), m = new Float32Array(n);
  for (const t of tonos) {
    let fase = 0;
    const i0 = Math.round(t.ini * SR), i1 = Math.min(n, i0 + Math.round(t.dur * SR));
    for (let i = i0; i < i1; i++) {
      const k = (i - i0) / (i1 - i0);
      const f = t.f0 * Math.pow(t.f1 / t.f0, k);
      fase += (2 * Math.PI * f) / SR;
      const env = Math.min(1, (i - i0) / (SR * 0.004)) * Math.exp(-k * (t.caida ?? 5));
      const s = Math.sin(fase) + (t.brillo || 0) * Math.sin(fase * 2);
      m[i] += s * env * t.vol;
    }
  }
  if (ruido) {
    let y = 0;
    const i0 = Math.round(ruido.ini * SR), i1 = Math.min(n, i0 + Math.round(ruido.dur * SR));
    for (let i = i0; i < i1; i++) {
      const k = (i - i0) / (i1 - i0);
      y += (azar() * 2 - 1 - y) * ruido.filtro;          // ruido suavizado (pasa-bajos)
      m[i] += y * ruido.vol * Math.sin(Math.PI * k) * Math.exp(-k * 2);
    }
  }
  // Un fundido de 3 ms al final: nunca un corte seco.
  const f = Math.round(SR * 0.003);
  for (let i = 0; i < f; i++) m[n - 1 - i] *= i / f;
  return m;
}
const SONIDOS = {
  botones: [0, 1, 2].map((v) => sintetizar(0.06, [{ f0: 1050 + v * 90, f1: 760 + v * 60, ini: 0, dur: 0.055, vol: 0.28, caida: 6, brillo: 0.15 }])),
  seleccionar: [0, 1].map((v) => sintetizar(0.11, [{ f0: 660 + v * 40, f1: 690 + v * 40, ini: 0, dur: 0.05, vol: 0.22 }, { f0: 990 + v * 60, f1: 1010 + v * 60, ini: 0.045, dur: 0.06, vol: 0.2 }])),
  abrir: [0, 1].map((v) => sintetizar(0.17, [{ f0: 420 + v * 30, f1: 880 + v * 50, ini: 0, dur: 0.15, vol: 0.18, caida: 3 }], { ini: 0, dur: 0.14, vol: 0.08, filtro: 0.08 })),
  cerrar: [0, 1].map((v) => sintetizar(0.15, [{ f0: 880 + v * 40, f1: 430 + v * 30, ini: 0, dur: 0.13, vol: 0.17, caida: 3.5 }], { ini: 0, dur: 0.12, vol: 0.07, filtro: 0.06 })),
  arrastrar: [0, 1].map((v) => sintetizar(0.05, [{ f0: 330 + v * 30, f1: 260 + v * 20, ini: 0, dur: 0.045, vol: 0.25, caida: 7 }])),
  soltar: [0, 1].map((v) => sintetizar(0.08, [{ f0: 240 + v * 25, f1: 160 + v * 15, ini: 0, dur: 0.07, vol: 0.32, caida: 6 }], { ini: 0, dur: 0.02, vol: 0.1, filtro: 0.3 })),
  guardar: [0, 1].map((v) => sintetizar(0.32, [{ f0: 1046.5 + v * 20, f1: 1046.5 + v * 20, ini: 0, dur: 0.18, vol: 0.16, caida: 4 }, { f0: 1318.5 + v * 25, f1: 1318.5 + v * 25, ini: 0.09, dur: 0.22, vol: 0.15, caida: 4 }])),
  deshacer: [0, 1].map((v) => sintetizar(0.09, [{ f0: 760 + v * 40, f1: 520 + v * 30, ini: 0, dur: 0.08, vol: 0.2, caida: 4 }])),
  borrar: [0, 1].map((v) => sintetizar(0.14, [{ f0: 300 + v * 30, f1: 150, ini: 0, dur: 0.1, vol: 0.12, caida: 4 }], { ini: 0, dur: 0.13, vol: 0.16, filtro: 0.12 + v * 0.05 })),
  error: [sintetizar(0.24, [{ f0: 220, f1: 210, ini: 0, dur: 0.1, vol: 0.2, caida: 3 }, { f0: 196, f1: 186, ini: 0.11, dur: 0.12, vol: 0.2, caida: 3 }])],
  exito: [sintetizar(0.42, [{ f0: 784, f1: 784, ini: 0, dur: 0.14, vol: 0.15, caida: 4 }, { f0: 987.8, f1: 987.8, ini: 0.08, dur: 0.16, vol: 0.14, caida: 4 }, { f0: 1318.5, f1: 1318.5, ini: 0.16, dur: 0.25, vol: 0.14, caida: 3.5 }])],
};
let total = 0;
for (const [cat, lista] of Object.entries(SONIDOS)) {
  mkdirSync(DIR + cat, { recursive: true });
  lista.forEach((m, i) => { const b = wav(m); total += b.length; writeFileSync(`${DIR}${cat}/${cat}-${i + 1}.wav`, b); });
}
console.log("listo", Math.round(total / 1024) + " KB");
