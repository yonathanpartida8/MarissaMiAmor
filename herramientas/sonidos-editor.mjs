// Genera los sonidos suaves del editor (assets/sonidos-editor/): WAV mono 16 bits, 22 050 Hz.
// node herramientas/sonidos-editor.mjs   (sobrescribe los que se llamen <categoría>/<acción>/<acción>-N.wav)
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
// <categoría>/<acción>: los primeros, en el mismo orden de siempre (así el ruido sale igual).
const dos = (fn) => [0, 1].map(fn);
const SONIDOS = {
  "interaccion/pulsar": [0, 1, 2].map((v) => sintetizar(0.06, [{ f0: 1050 + v * 90, f1: 760 + v * 60, ini: 0, dur: 0.055, vol: 0.28, caida: 6, brillo: 0.15 }])),
  "interaccion/seleccionar": dos((v) => sintetizar(0.11, [{ f0: 660 + v * 40, f1: 690 + v * 40, ini: 0, dur: 0.05, vol: 0.22 }, { f0: 990 + v * 60, f1: 1010 + v * 60, ini: 0.045, dur: 0.06, vol: 0.2 }])),
  "interfaz/abrir": dos((v) => sintetizar(0.17, [{ f0: 420 + v * 30, f1: 880 + v * 50, ini: 0, dur: 0.15, vol: 0.18, caida: 3 }], { ini: 0, dur: 0.14, vol: 0.08, filtro: 0.08 })),
  "interfaz/cerrar": dos((v) => sintetizar(0.15, [{ f0: 880 + v * 40, f1: 430 + v * 30, ini: 0, dur: 0.13, vol: 0.17, caida: 3.5 }], { ini: 0, dur: 0.12, vol: 0.07, filtro: 0.06 })),
  "movimiento/arrastrar": dos((v) => sintetizar(0.05, [{ f0: 330 + v * 30, f1: 260 + v * 20, ini: 0, dur: 0.045, vol: 0.25, caida: 7 }])),
  "movimiento/soltar": dos((v) => sintetizar(0.08, [{ f0: 240 + v * 25, f1: 160 + v * 15, ini: 0, dur: 0.07, vol: 0.32, caida: 6 }], { ini: 0, dur: 0.02, vol: 0.1, filtro: 0.3 })),
  "interfaz/guardar": dos((v) => sintetizar(0.32, [{ f0: 1046.5 + v * 20, f1: 1046.5 + v * 20, ini: 0, dur: 0.18, vol: 0.16, caida: 4 }, { f0: 1318.5 + v * 25, f1: 1318.5 + v * 25, ini: 0.09, dur: 0.22, vol: 0.15, caida: 4 }])),
  "edicion/deshacer": dos((v) => sintetizar(0.09, [{ f0: 760 + v * 40, f1: 520 + v * 30, ini: 0, dur: 0.08, vol: 0.2, caida: 4 }])),
  "organizacion/eliminar": dos((v) => sintetizar(0.14, [{ f0: 300 + v * 30, f1: 150, ini: 0, dur: 0.1, vol: 0.12, caida: 4 }], { ini: 0, dur: 0.13, vol: 0.16, filtro: 0.12 + v * 0.05 })),
  "interfaz/error": [sintetizar(0.24, [{ f0: 220, f1: 210, ini: 0, dur: 0.1, vol: 0.2, caida: 3 }, { f0: 196, f1: 186, ini: 0.11, dur: 0.12, vol: 0.2, caida: 3 }])],
  "interaccion/confirmar": [sintetizar(0.42, [{ f0: 784, f1: 784, ini: 0, dur: 0.14, vol: 0.15, caida: 4 }, { f0: 987.8, f1: 987.8, ini: 0.08, dur: 0.16, vol: 0.14, caida: 4 }, { f0: 1318.5, f1: 1318.5, ini: 0.16, dur: 0.25, vol: 0.14, caida: 3.5 }])],
  // Fase 12: una carpeta por acción del editor (suaves, cortitos, de la misma familia).
  "interaccion/deseleccionar": dos((v) => sintetizar(0.1, [{ f0: 990 + v * 50, f1: 960 + v * 50, ini: 0, dur: 0.045, vol: 0.15 }, { f0: 660 + v * 30, f1: 630 + v * 30, ini: 0.04, dur: 0.055, vol: 0.14 }])),
  "interaccion/herramienta": dos((v) => sintetizar(0.12, [{ f0: 420 + v * 30, f1: 780 + v * 40, ini: 0, dur: 0.11, vol: 0.2, caida: 3.5, brillo: 0.3 }])),
  "movimiento/desplazar": dos((v) => sintetizar(0.17, [], { ini: 0, dur: 0.16, vol: 0.11 + v * 0.02, filtro: 0.05 + v * 0.02 })),
  "transformacion/rotar": dos((v) => sintetizar(0.1, [{ f0: 520 + v * 40, f1: 700 + v * 50, ini: 0, dur: 0.09, vol: 0.17, caida: 3 }])),
  "transformacion/zoom": [sintetizar(0.09, [{ f0: 700, f1: 1100, ini: 0, dur: 0.08, vol: 0.13, caida: 3 }]), sintetizar(0.09, [{ f0: 1100, f1: 700, ini: 0, dur: 0.08, vol: 0.13, caida: 3 }])],
  "transformacion/redimensionar": dos((v) => sintetizar(0.08, [{ f0: 440 + v * 30, f1: 560 + v * 40, ini: 0, dur: 0.07, vol: 0.17, caida: 4, brillo: 0.2 }])),
  "organizacion/agrupar": dos((v) => sintetizar(0.14, [{ f0: 660 + v * 30, f1: 660 + v * 30, ini: 0, dur: 0.06, vol: 0.15 }, { f0: 880 + v * 40, f1: 880 + v * 40, ini: 0.05, dur: 0.08, vol: 0.15 }])),
  "organizacion/desagrupar": dos((v) => sintetizar(0.14, [{ f0: 880 + v * 40, f1: 880 + v * 40, ini: 0, dur: 0.06, vol: 0.15 }, { f0: 660 + v * 30, f1: 640 + v * 30, ini: 0.05, dur: 0.08, vol: 0.15 }])),
  "organizacion/duplicar": dos((v) => sintetizar(0.13, [{ f0: 880 + v * 40, f1: 900 + v * 40, ini: 0, dur: 0.05, vol: 0.24 }, { f0: 1320 + v * 60, f1: 1360 + v * 60, ini: 0.055, dur: 0.07, vol: 0.22 }])),
  "organizacion/ordenar-capas": dos((v) => sintetizar(0.11, [{ f0: 520 + v * 30, f1: 620 + v * 30, ini: 0, dur: 0.05, vol: 0.17 }, { f0: 620 + v * 30, f1: 740 + v * 40, ini: 0.045, dur: 0.05, vol: 0.15 }])),
  "interfaz/minimizar": dos((v) => sintetizar(0.11, [{ f0: 700 + v * 30, f1: 420 + v * 20, ini: 0, dur: 0.1, vol: 0.14, caida: 3.5 }], { ini: 0, dur: 0.08, vol: 0.05, filtro: 0.06 })),
  "interfaz/restaurar": dos((v) => sintetizar(0.11, [{ f0: 420 + v * 20, f1: 700 + v * 30, ini: 0, dur: 0.1, vol: 0.14, caida: 3 }], { ini: 0, dur: 0.08, vol: 0.05, filtro: 0.06 })),
  "edicion/dibujar": dos((v) => sintetizar(0.1, [], { ini: 0, dur: 0.09, vol: 0.1, filtro: 0.22 + v * 0.06 })),
  "edicion/borrar": dos((v) => sintetizar(0.13, [], { ini: 0, dur: 0.12, vol: 0.12, filtro: 0.14 + v * 0.04 })),
  "edicion/colorear": dos((v) => sintetizar(0.13, [{ f0: 1320 + v * 60, f1: 1400 + v * 60, ini: 0, dur: 0.06, vol: 0.12 }, { f0: 1760 + v * 80, f1: 1800 + v * 80, ini: 0.04, dur: 0.08, vol: 0.1 }])),
  "edicion/aplicar-efectos": dos((v) => sintetizar(0.24, [{ f0: 1046.5 + v * 20, f1: 1046.5 + v * 20, ini: 0, dur: 0.09, vol: 0.12 }, { f0: 1318.5 + v * 25, f1: 1318.5 + v * 25, ini: 0.05, dur: 0.09, vol: 0.11 }, { f0: 1568 + v * 30, f1: 1568 + v * 30, ini: 0.1, dur: 0.12, vol: 0.1 }])),
  "edicion/colocar": dos((v) => sintetizar(0.12, [{ f0: 520 + v * 30, f1: 250 + v * 15, ini: 0, dur: 0.11, vol: 0.38 }, { f0: 1040 + v * 50, f1: 900 + v * 40, ini: 0, dur: 0.03, vol: 0.09, brillo: 0.3 }])),
  "edicion/ajustar": dos((v) => sintetizar(0.02, [{ f0: 1750 + v * 80, f1: 1650 + v * 80, ini: 0, dur: 0.016, vol: 0.14 }])),
  "paginas/crear": dos((v) => sintetizar(0.24, [{ f0: 523.3 + v * 10, f1: 523.3 + v * 10, ini: 0, dur: 0.1, vol: 0.15, caida: 4 }, { f0: 784 + v * 15, f1: 784 + v * 15, ini: 0.07, dur: 0.14, vol: 0.14, caida: 4 }])),
  "paginas/duplicar": dos((v) => sintetizar(0.17, [{ f0: 784 + v * 15, f1: 784 + v * 15, ini: 0, dur: 0.06, vol: 0.14 }, { f0: 784 + v * 15, f1: 790 + v * 15, ini: 0.07, dur: 0.08, vol: 0.13 }])),
  "paginas/cambiar": dos((v) => sintetizar(0.19, [{ f0: 600 + v * 30, f1: 500 + v * 25, ini: 0.02, dur: 0.08, vol: 0.06 }], { ini: 0, dur: 0.18, vol: 0.14, filtro: 0.09 + v * 0.03 })),
  "multimedia/reproducir": dos((v) => sintetizar(0.1, [{ f0: 660 + v * 30, f1: 990 + v * 40, ini: 0, dur: 0.09, vol: 0.15, caida: 3.5 }])),
  "multimedia/pausar": dos((v) => sintetizar(0.1, [{ f0: 990 + v * 40, f1: 660 + v * 30, ini: 0, dur: 0.09, vol: 0.14, caida: 3.5 }])),
  "animaciones/aplicar": dos((v) => sintetizar(0.22, [{ f0: 784 + v * 15, f1: 784 + v * 15, ini: 0, dur: 0.08, vol: 0.12 }, { f0: 987.8 + v * 20, f1: 987.8 + v * 20, ini: 0.05, dur: 0.08, vol: 0.12 }, { f0: 1174.7 + v * 25, f1: 1174.7 + v * 25, ini: 0.1, dur: 0.11, vol: 0.11 }])),
  "animaciones/fotograma": dos((v) => sintetizar(0.3, [{ f0: 1568 + v * 30, f1: 1568 + v * 30, ini: 0, dur: 0.28, vol: 0.2, caida: 4 }, { f0: 2349 + v * 40, f1: 2349 + v * 40, ini: 0, dur: 0.2, vol: 0.08, caida: 4 }])),
};
let total = 0;
for (const [cat, lista] of Object.entries(SONIDOS)) {
  const accion = cat.split("/").pop();
  mkdirSync(DIR + cat, { recursive: true });
  lista.forEach((m, i) => { const b = wav(m); total += b.length; writeFileSync(`${DIR}${cat}/${accion}-${i + 1}.wav`, b); });
}
console.log("listo", Math.round(total / 1024) + " KB");
