/**
 * CONFIGURACIÓN DEL EDITOR — cómo se comporta el editor (nunca el librito).
 *
 * Un solo objeto guardado en este aparato. `poner()` lo guarda, lo aplica
 * (clases en <body>, variables CSS) y avisa a quien escuche. Lo de la música
 * y los sonidos vive en sus propios módulos (audio/), aquí sólo se enlaza.
 */
const CLAVE = "editordev:config";
export const VERSION = "3.1";

export const DEF = {
  modo: "equilibrado",   // equilibrado | rendimiento | calidad
  hz: "auto",            // auto | 30 | 60 | 90 | 120 | 144 (nunca más de lo que da la pantalla)
  calidad: "alta",       // baja | media | alta
  movimiento: "completo",// completo | reducido | nada
  intensidad: 1,         // 0.3 … 1.5 (cuánto se mueven las cosas)
  particulas: true,      // brillitos, fondos animados en el editor, chispas de la abejita
  efectos: true,         // filtros de los elementos mientras editas
  fps: false,
  haptic: true, hapticFuerza: 1,
  ayudas: true, tooltips: true, consejos: true,
  escala: 1, tema: "auto", transparencias: true,
  abeja: true, abejaSonido: true, dialogos: true, frecuencia: 75, // segundos entre charlitas
};

export const MODOS = {
  rendimiento: { calidad: "baja", hz: "60", particulas: false, efectos: false, movimiento: "reducido" },
  equilibrado: { calidad: "media", hz: "auto", particulas: true, efectos: true, movimiento: "completo" },
  calidad: { calidad: "alta", hz: "auto", particulas: true, efectos: true, movimiento: "completo" },
};

function leer() { try { return { ...DEF, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch (e) { return { ...DEF }; } }
export const PREF = leer();
const oyentes = new Set();

export function alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

export function poner(cambios) {
  if (cambios.modo && MODOS[cambios.modo]) cambios = { ...MODOS[cambios.modo], ...cambios };
  Object.assign(PREF, cambios);
  try { localStorage.setItem(CLAVE, JSON.stringify(PREF)); } catch (e) { /* nada */ }
  aplicar();
  for (const f of oyentes) { try { f(PREF, cambios); } catch (e) { console.warn(e); } }
}

export function restaurar() { for (const k of Object.keys(PREF)) delete PREF[k]; poner({ ...DEF }); }

/** Lo que se nota en la interfaz: clases en <body> y variables. */
export function aplicar() {
  const b = document.body, r = document.documentElement;
  if (!b) return;
  const sistemaQuieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mov = sistemaQuieto && PREF.movimiento === "completo" ? "reducido" : PREF.movimiento;
  b.classList.toggle("ed-mov-reducido", mov === "reducido");
  b.classList.toggle("ed-mov-nada", mov === "nada");
  b.classList.toggle("ed-calidad-baja", PREF.calidad === "baja");
  b.classList.toggle("ed-calidad-media", PREF.calidad === "media");
  b.classList.toggle("ed-sin-particulas", !PREF.particulas);
  b.classList.toggle("ed-sin-efectos", !PREF.efectos);
  b.classList.toggle("ed-sin-transparencias", !PREF.transparencias);
  b.classList.toggle("ed-sin-tooltips", !PREF.tooltips);
  r.style.setProperty("--anim-k", String(mov === "nada" ? 0 : (mov === "reducido" ? 0.5 : 1) * PREF.intensidad));
  r.style.setProperty("--ui-escala", String(PREF.escala));
  if (PREF.tema === "auto") delete r.dataset.tema; else r.dataset.tema = PREF.tema;
}

/** Vibración suavecita (Android; iPhone no la permite en la web). */
export function vibrar(ms = 8) {
  if (!PREF.haptic || !navigator.vibrate) return;
  try { navigator.vibrate(Math.max(1, Math.round(ms * PREF.hapticFuerza))); } catch (e) { /* nada */ }
}

/** ¿Hay que moverse? (0 = quieto). Para animaciones hechas en JS. */
export const movimiento = () => (document.body.classList.contains("ed-mov-nada") ? 0 : document.body.classList.contains("ed-mov-reducido") ? 0.5 : 1) * PREF.intensidad;
