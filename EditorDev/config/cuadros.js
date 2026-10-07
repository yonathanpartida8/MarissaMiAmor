/**
 * REFRESCO DE PANTALLA — el de verdad, no uno inventado.
 *
 * Se mide con requestAnimationFrame lo que da la pantalla (60, 90, 120,
 * 144 Hz…). La opción elegida en Configuración sólo puede BAJAR ese ritmo
 * (para ahorrar batería y calor), nunca subirlo: si la pantalla da 60, el
 * editor no intenta 144. `alCuadro()` es el bucle que usan las animaciones
 * hechas en JS (reproducir la línea de tiempo…): respeta ese tope y se para
 * solo con la pestaña oculta.
 */
import { PREF } from "./preferencias.js";

const COMUNES = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240];
export const HZ = { real: 60, medido: false };

/** Mide el refresco real (unos 70 cuadros, con la mediana para ignorar tirones). */
export function medirHz() {
  return new Promise((ok) => {
    const d = [];
    let t0 = 0;
    const paso = (t) => {
      if (t0) d.push(t - t0);
      t0 = t;
      if (d.length < 70 && !document.hidden) requestAnimationFrame(paso);
      else {
        d.sort((a, b) => a - b);
        const med = d.length ? d[d.length >> 1] : 16.7;
        const hz = 1000 / med;
        HZ.real = COMUNES.reduce((m, c) => (Math.abs(c - hz) < Math.abs(m - hz) ? c : m), 60);
        HZ.medido = true;
        ok(HZ.real);
      }
    };
    requestAnimationFrame(paso);
  });
}

/** El ritmo al que trabaja el editor ahora. */
export const objetivo = () => (PREF.hz === "auto" ? HZ.real : Math.min(+PREF.hz || 60, HZ.real));

/** Un bucle de cuadros con tope de Hz. Devuelve cómo pararlo. */
export function alCuadro(fn) {
  let vivo = true, r = 0, ultimo = 0;
  const paso = (t) => {
    if (!vivo) return;
    r = requestAnimationFrame(paso);
    const min = 1000 / objetivo() - 1.5; // margen: un cuadro de 144 Hz no debe perderse por medio ms
    if (t - ultimo < min) return;
    const dt = ultimo ? t - ultimo : 16.7;
    ultimo = t;
    if (fn(dt, t) === false) parar();
  };
  const parar = () => { vivo = false; cancelAnimationFrame(r); };
  r = requestAnimationFrame(paso);
  return parar;
}

/* ── Contador de FPS (sólo existe mientras está encendido) ── */
let medidor = null;
export function mostrarFps(on) {
  if (!on) { medidor?.parar(); medidor?.n.remove(); medidor = null; return; }
  if (medidor) return;
  const n = document.createElement("div");
  n.className = "ed-fps";
  document.body.append(n);
  let cuadros = 0, desde = performance.now();
  const parar = alCuadro((dt, t) => {
    cuadros++;
    if (t - desde >= 500) { n.textContent = `${Math.round((cuadros * 1000) / (t - desde))} fps · ${objetivo()} Hz`; cuadros = 0; desde = t; }
  });
  medidor = { n, parar };
}

/** Cuántos cuadros por segundo de verdad durante `ms` (para el diagnóstico). */
export function medirFps(ms = 1500) {
  return new Promise((ok) => {
    let c = 0; const t0 = performance.now();
    const parar = alCuadro((dt, t) => { c++; if (t - t0 >= ms) { parar(); ok(Math.round((c * 1000) / (t - t0))); } });
  });
}

/* Tareas largas (> 50 ms) desde que se abrió el editor: el mejor termómetro de tirones. */
export const LARGAS = { n: 0, ms: 0 };
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { LARGAS.n++; LARGAS.ms += e.duration; } }).observe({ type: "longtask", buffered: true });
} catch (e) { /* Safari no lo tiene */ }
