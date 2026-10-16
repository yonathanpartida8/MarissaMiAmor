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
// <categoría>/<acción>: [cuántos de siempre, (v) => sonido]. Se generan EN ESTE ORDEN (así el
// ruido de los de siempre sale idéntico); al final, una variante más de cada uno (variedad).
const F = {
  "interaccion/pulsar": [3, (v) => sintetizar(0.06, [{ f0: 1050 + v * 90, f1: 760 + v * 60, ini: 0, dur: 0.055, vol: 0.28, caida: 6, brillo: 0.15 }])],
  "interaccion/seleccionar": [2, (v) => sintetizar(0.11, [{ f0: 660 + v * 40, f1: 690 + v * 40, ini: 0, dur: 0.05, vol: 0.22 }, { f0: 990 + v * 60, f1: 1010 + v * 60, ini: 0.045, dur: 0.06, vol: 0.2 }])],
  "interfaz/abrir": [2, (v) => sintetizar(0.17, [{ f0: 420 + v * 30, f1: 880 + v * 50, ini: 0, dur: 0.15, vol: 0.18, caida: 3 }], { ini: 0, dur: 0.14, vol: 0.08, filtro: 0.08 })],
  "interfaz/cerrar": [2, (v) => sintetizar(0.15, [{ f0: 880 + v * 40, f1: 430 + v * 30, ini: 0, dur: 0.13, vol: 0.17, caida: 3.5 }], { ini: 0, dur: 0.12, vol: 0.07, filtro: 0.06 })],
  "movimiento/arrastrar": [2, (v) => sintetizar(0.05, [{ f0: 330 + v * 30, f1: 260 + v * 20, ini: 0, dur: 0.045, vol: 0.25, caida: 7 }])],
  "movimiento/soltar": [2, (v) => sintetizar(0.08, [{ f0: 240 + v * 25, f1: 160 + v * 15, ini: 0, dur: 0.07, vol: 0.32, caida: 6 }], { ini: 0, dur: 0.02, vol: 0.1, filtro: 0.3 })],
  "interfaz/guardar": [2, (v) => sintetizar(0.32, [{ f0: 1046.5 + v * 20, f1: 1046.5 + v * 20, ini: 0, dur: 0.18, vol: 0.16, caida: 4 }, { f0: 1318.5 + v * 25, f1: 1318.5 + v * 25, ini: 0.09, dur: 0.22, vol: 0.15, caida: 4 }])],
  "edicion/deshacer": [2, (v) => sintetizar(0.09, [{ f0: 760 + v * 40, f1: 520 + v * 30, ini: 0, dur: 0.08, vol: 0.2, caida: 4 }])],
  "organizacion/eliminar": [2, (v) => sintetizar(0.14, [{ f0: 300 + v * 30, f1: 150, ini: 0, dur: 0.1, vol: 0.12, caida: 4 }], { ini: 0, dur: 0.13, vol: 0.16, filtro: 0.12 + v * 0.05 })],
  "interfaz/error": [1, (v) => sintetizar(0.24, [{ f0: 220 + v * 14, f1: 210 + v * 14, ini: 0, dur: 0.1, vol: 0.2, caida: 3 }, { f0: 196 + v * 12, f1: 186 + v * 12, ini: 0.11, dur: 0.12, vol: 0.2, caida: 3 }])],
  "interaccion/confirmar": [1, (v) => sintetizar(0.42, [{ f0: 784 + v * 16, f1: 784 + v * 16, ini: 0, dur: 0.14, vol: 0.15, caida: 4 }, { f0: 987.8 + v * 20, f1: 987.8 + v * 20, ini: 0.08, dur: 0.16, vol: 0.14, caida: 4 }, { f0: 1318.5 + v * 26, f1: 1318.5 + v * 26, ini: 0.16, dur: 0.25, vol: 0.14, caida: 3.5 }])],
  // Fase 12: una carpeta por acción del editor (suaves, cortitos, de la misma familia).
  "interaccion/deseleccionar": [2, (v) => sintetizar(0.1, [{ f0: 990 + v * 50, f1: 960 + v * 50, ini: 0, dur: 0.045, vol: 0.15 }, { f0: 660 + v * 30, f1: 630 + v * 30, ini: 0.04, dur: 0.055, vol: 0.14 }])],
  "interaccion/herramienta": [2, (v) => sintetizar(0.12, [{ f0: 420 + v * 30, f1: 780 + v * 40, ini: 0, dur: 0.11, vol: 0.2, caida: 3.5, brillo: 0.3 }])],
  "movimiento/desplazar": [2, (v) => sintetizar(0.17, [], { ini: 0, dur: 0.16, vol: 0.11 + v * 0.02, filtro: 0.05 + v * 0.02 })],
  "transformacion/rotar": [2, (v) => sintetizar(0.1, [{ f0: 520 + v * 40, f1: 700 + v * 50, ini: 0, dur: 0.09, vol: 0.17, caida: 3 }])],
  "transformacion/zoom": [2, (v) => sintetizar(0.09, [{ f0: (v % 2 ? 1100 : 700) + (v >> 1) * 60, f1: (v % 2 ? 700 : 1100) + (v >> 1) * 60, ini: 0, dur: 0.08, vol: 0.13, caida: 3 }])],
  "transformacion/redimensionar": [2, (v) => sintetizar(0.08, [{ f0: 440 + v * 30, f1: 560 + v * 40, ini: 0, dur: 0.07, vol: 0.17, caida: 4, brillo: 0.2 }])],
  "organizacion/agrupar": [2, (v) => sintetizar(0.14, [{ f0: 660 + v * 30, f1: 660 + v * 30, ini: 0, dur: 0.06, vol: 0.15 }, { f0: 880 + v * 40, f1: 880 + v * 40, ini: 0.05, dur: 0.08, vol: 0.15 }])],
  "organizacion/desagrupar": [2, (v) => sintetizar(0.14, [{ f0: 880 + v * 40, f1: 880 + v * 40, ini: 0, dur: 0.06, vol: 0.15 }, { f0: 660 + v * 30, f1: 640 + v * 30, ini: 0.05, dur: 0.08, vol: 0.15 }])],
  "organizacion/duplicar": [2, (v) => sintetizar(0.13, [{ f0: 880 + v * 40, f1: 900 + v * 40, ini: 0, dur: 0.05, vol: 0.24 }, { f0: 1320 + v * 60, f1: 1360 + v * 60, ini: 0.055, dur: 0.07, vol: 0.22 }])],
  "organizacion/ordenar-capas": [2, (v) => sintetizar(0.11, [{ f0: 520 + v * 30, f1: 620 + v * 30, ini: 0, dur: 0.05, vol: 0.17 }, { f0: 620 + v * 30, f1: 740 + v * 40, ini: 0.045, dur: 0.05, vol: 0.15 }])],
  "interfaz/minimizar": [2, (v) => sintetizar(0.11, [{ f0: 700 + v * 30, f1: 420 + v * 20, ini: 0, dur: 0.1, vol: 0.14, caida: 3.5 }], { ini: 0, dur: 0.08, vol: 0.05, filtro: 0.06 })],
  "interfaz/restaurar": [2, (v) => sintetizar(0.11, [{ f0: 420 + v * 20, f1: 700 + v * 30, ini: 0, dur: 0.1, vol: 0.14, caida: 3 }], { ini: 0, dur: 0.08, vol: 0.05, filtro: 0.06 })],
  "edicion/dibujar": [2, (v) => sintetizar(0.1, [], { ini: 0, dur: 0.09, vol: 0.1, filtro: 0.22 + v * 0.06 })],
  "edicion/borrar": [2, (v) => sintetizar(0.13, [], { ini: 0, dur: 0.12, vol: 0.12, filtro: 0.14 + v * 0.04 })],
  "edicion/colorear": [2, (v) => sintetizar(0.13, [{ f0: 1320 + v * 60, f1: 1400 + v * 60, ini: 0, dur: 0.06, vol: 0.12 }, { f0: 1760 + v * 80, f1: 1800 + v * 80, ini: 0.04, dur: 0.08, vol: 0.1 }])],
  "edicion/aplicar-efectos": [2, (v) => sintetizar(0.24, [{ f0: 1046.5 + v * 20, f1: 1046.5 + v * 20, ini: 0, dur: 0.09, vol: 0.12 }, { f0: 1318.5 + v * 25, f1: 1318.5 + v * 25, ini: 0.05, dur: 0.09, vol: 0.11 }, { f0: 1568 + v * 30, f1: 1568 + v * 30, ini: 0.1, dur: 0.12, vol: 0.1 }])],
  "edicion/colocar": [2, (v) => sintetizar(0.12, [{ f0: 520 + v * 30, f1: 250 + v * 15, ini: 0, dur: 0.11, vol: 0.38 }, { f0: 1040 + v * 50, f1: 900 + v * 40, ini: 0, dur: 0.03, vol: 0.09, brillo: 0.3 }])],
  "edicion/ajustar": [2, (v) => sintetizar(0.02, [{ f0: 1750 + v * 80, f1: 1650 + v * 80, ini: 0, dur: 0.016, vol: 0.14 }])],
  "paginas/crear": [2, (v) => sintetizar(0.24, [{ f0: 523.3 + v * 10, f1: 523.3 + v * 10, ini: 0, dur: 0.1, vol: 0.15, caida: 4 }, { f0: 784 + v * 15, f1: 784 + v * 15, ini: 0.07, dur: 0.14, vol: 0.14, caida: 4 }])],
  "paginas/duplicar": [2, (v) => sintetizar(0.17, [{ f0: 784 + v * 15, f1: 784 + v * 15, ini: 0, dur: 0.06, vol: 0.14 }, { f0: 784 + v * 15, f1: 790 + v * 15, ini: 0.07, dur: 0.08, vol: 0.13 }])],
  "paginas/cambiar": [2, (v) => sintetizar(0.19, [{ f0: 600 + v * 30, f1: 500 + v * 25, ini: 0.02, dur: 0.08, vol: 0.06 }], { ini: 0, dur: 0.18, vol: 0.14, filtro: 0.09 + v * 0.03 })],
  "multimedia/reproducir": [2, (v) => sintetizar(0.1, [{ f0: 660 + v * 30, f1: 990 + v * 40, ini: 0, dur: 0.09, vol: 0.15, caida: 3.5 }])],
  "multimedia/pausar": [2, (v) => sintetizar(0.1, [{ f0: 990 + v * 40, f1: 660 + v * 30, ini: 0, dur: 0.09, vol: 0.14, caida: 3.5 }])],
  "animaciones/aplicar": [2, (v) => sintetizar(0.22, [{ f0: 784 + v * 15, f1: 784 + v * 15, ini: 0, dur: 0.08, vol: 0.12 }, { f0: 987.8 + v * 20, f1: 987.8 + v * 20, ini: 0.05, dur: 0.08, vol: 0.12 }, { f0: 1174.7 + v * 25, f1: 1174.7 + v * 25, ini: 0.1, dur: 0.11, vol: 0.11 }])],
  "animaciones/fotograma": [2, (v) => sintetizar(0.3, [{ f0: 1568 + v * 30, f1: 1568 + v * 30, ini: 0, dur: 0.28, vol: 0.2, caida: 4 }, { f0: 2349 + v * 40, f1: 2349 + v * 40, ini: 0, dur: 0.2, vol: 0.08, caida: 4 }])],
  // Más momentos con su sonido: atrás en los menús, interruptores, imán, menú, probar, bloquear…
  "interfaz/atras": [2, (v) => sintetizar(0.13, [{ f0: 880 + v * 40, f1: 860 + v * 40, ini: 0, dur: 0.05, vol: 0.15 }, { f0: 587 + v * 26, f1: 560 + v * 26, ini: 0.05, dur: 0.07, vol: 0.15, caida: 4 }])],
  "interfaz/probar": [2, (v) => sintetizar(0.36, [{ f0: 659 + v * 14, f1: 659 + v * 14, ini: 0, dur: 0.1, vol: 0.12 }, { f0: 880 + v * 18, f1: 880 + v * 18, ini: 0.07, dur: 0.1, vol: 0.12 }, { f0: 1175 + v * 24, f1: 1200 + v * 24, ini: 0.14, dur: 0.2, vol: 0.12, caida: 3.5 }], { ini: 0, dur: 0.3, vol: 0.05, filtro: 0.05 })],
  "interaccion/activar": [2, (v) => sintetizar(0.09, [{ f0: 700 + v * 30, f1: 720 + v * 30, ini: 0, dur: 0.035, vol: 0.18 }, { f0: 1050 + v * 40, f1: 1080 + v * 40, ini: 0.035, dur: 0.05, vol: 0.18 }])],
  "interaccion/desactivar": [2, (v) => sintetizar(0.09, [{ f0: 1050 + v * 40, f1: 1030 + v * 40, ini: 0, dur: 0.035, vol: 0.16 }, { f0: 700 + v * 30, f1: 680 + v * 30, ini: 0.035, dur: 0.05, vol: 0.16 }])],
  "interaccion/menu": [2, (v) => sintetizar(0.08, [{ f0: 500 + v * 30, f1: 900 + v * 40, ini: 0, dur: 0.06, vol: 0.16, caida: 4 }])],
  "movimiento/iman": [2, (v) => sintetizar(0.05, [{ f0: 2200 + v * 120, f1: 2100 + v * 120, ini: 0, dur: 0.03, vol: 0.09, brillo: 0.4, caida: 7 }, { f0: 1400 + v * 60, f1: 1380 + v * 60, ini: 0.012, dur: 0.03, vol: 0.07, caida: 7 }])],
  "organizacion/bloquear": [2, (v) => sintetizar(0.12, [{ f0: 320 + v * 20, f1: 300 + v * 20, ini: 0, dur: 0.03, vol: 0.22, caida: 7, brillo: 0.3 }, { f0: 220 + v * 15, f1: 200 + v * 15, ini: 0.06, dur: 0.04, vol: 0.24, caida: 7, brillo: 0.3 }])],
  "organizacion/desbloquear": [2, (v) => sintetizar(0.12, [{ f0: 220 + v * 15, f1: 230 + v * 15, ini: 0, dur: 0.03, vol: 0.22, caida: 7, brillo: 0.3 }, { f0: 340 + v * 20, f1: 360 + v * 20, ini: 0.06, dur: 0.04, vol: 0.22, caida: 7, brillo: 0.3 }])],
  "organizacion/ocultar": [2, (v) => sintetizar(0.14, [{ f0: 900 + v * 40, f1: 480 + v * 20, ini: 0, dur: 0.13, vol: 0.1, caida: 2.5 }])],
  "organizacion/mostrar": [2, (v) => sintetizar(0.14, [{ f0: 480 + v * 20, f1: 900 + v * 40, ini: 0, dur: 0.13, vol: 0.1, caida: 2.5 }])],
  "paginas/eliminar": [2, (v) => sintetizar(0.22, [{ f0: 260 + v * 20, f1: 130, ini: 0, dur: 0.14, vol: 0.1, caida: 3 }], { ini: 0, dur: 0.2, vol: 0.17, filtro: 0.2 + v * 0.05 })],
  "paginas/reordenar": [2, (v) => sintetizar(0.16, [{ f0: 600 + v * 25, f1: 640 + v * 25, ini: 0.08, dur: 0.05, vol: 0.08 }], { ini: 0, dur: 0.14, vol: 0.12, filtro: 0.16 + v * 0.04 })],
  "edicion/escribir": [2, (v) => sintetizar(0.05, [{ f0: 1200 + v * 80, f1: 1100 + v * 80, ini: 0, dur: 0.02, vol: 0.1, caida: 8 }], { ini: 0, dur: 0.03, vol: 0.14, filtro: 0.45 })],
};
const SONIDOS = {};
for (const [k, [n, fn]] of Object.entries(F)) SONIDOS[k] = Array.from({ length: n }, (_, v) => fn(v));
// Una variante más de cada uno (al final: no cambia a los de siempre). Los de un solo sonido, dos más.
for (const [k, [n, fn]] of Object.entries(F)) for (let v = n; v < Math.max(n + 1, 3); v++) SONIDOS[k].push(fn(v));
let total = 0;
for (const [cat, lista] of Object.entries(SONIDOS)) {
  const accion = cat.split("/").pop();
  mkdirSync(DIR + cat, { recursive: true });
  lista.forEach((m, i) => { const b = wav(m); total += b.length; writeFileSync(`${DIR}${cat}/${accion}-${i + 1}.wav`, b); });
}
console.log("listo", Math.round(total / 1024) + " KB");
