/**
 * RENDIMIENTO INTELIGENTE (Fase 37): que el editor no caliente el celular ni se coma la pila.
 *
 *   oculto    la página está escondida o en segundo plano → <html class="rd-oculto">: se pausa todo lo
 *             animado y `cada()` no despierta al aparato; el chat, la abejita y la música esperan a que vuelvas.
 *   reposo    tras 15 s sin tocar nada → «rd-reposo»: lo decorativo que se repite sin fin (el menú, los
 *             ánimos del chat, la abejita, lo que se mueve en la hoja) se queda quieto donde estaba; al
 *             tocar, sigue. Nunca mientras algo «ocupado» (la línea de tiempo, un vídeo o un audio sonando,
 *             grabar). (Fase 45) Sólo lo que se repite para siempre: lo que está ENTRANDO nunca se congela
 *             (antes, una pantalla abierta sin tocar —el «atrás» del teléfono— o con el aparato en ahorro se
 *             quedaba en su primer cuadro: invisible). Ir y venir entre pantallas también cuenta como actividad.
 *   tapado    lo que queda debajo de una pantalla completa (el menú, Detallitos, Crear librito, Probar)
 *             no se ve: «rd-tapado» lo pausa.
 *   ahorro    si el aparato sufre (cuadros lentos seguidos, la presión del procesador, pila baja sin
 *             cargar, ahorro de datos o muy poca memoria) → «rd-ahorro»: sin desenfoques de fondo, lo
 *             decorativo quieto y las partículas fijas. Se queda al menos 2 minutos (para no ir y venir)
 *             y se quita solo cuando se recupera.
 *   una vez   `unaVez(clave, fn)`: si ese proceso ya va en curso, se reutiliza su promesa (no corre dos veces).
 *   fugas     `ambito()` junta escuchas, relojes, observadores y URLs para soltarlos de un jalón; cada
 *             minuto se mira si la memoria y los nodos sólo crecen (y se avisa en la consola y se liberan
 *             los cachés registrados con `alLiberar()`). `informe()` dice cómo va todo.
 */
const H = document.documentElement;
const REPOSO = 15000, AHORRO_MIN = 120000;

export const R = { oculto: document.hidden, reposo: false, ahorro: false, motivo: "", ocupado: new Set() };
// (Fase 45: va hasta arriba. Con «Ahorro de datos» o poca memoria el ahorro empieza al cargar y ya los
// necesita; declarados más abajo, la app entera no arrancaba en esos teléfonos.)
const liberadores = new Set();
const oyentes = new Set();
let antes = "";
function avisar() {
  const firma = `${R.oculto}${R.reposo}${R.ahorro}`;
  if (firma === antes) return;
  antes = firma;
  for (const f of oyentes) { try { f(R); } catch (e) { console.warn(e); } }
}
/** Te avisa cuando cambia algo (oculto, reposo o ahorro). Devuelve cómo dejar de escuchar. */
export function alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

/* ── Oculto ─────────────────────────────────────────────────────────── */
let esperanVer = [];
function alVisibilidad(oculto = document.hidden) {
  R.oculto = oculto;
  H.classList.toggle("rd-oculto", oculto);
  if (!oculto) { actividad(); const l = esperanVer; esperanVer = []; l.forEach((r) => r()); }
  avisar();
}
document.addEventListener("visibilitychange", () => alVisibilidad());
addEventListener("pagehide", () => alVisibilidad(true));
addEventListener("pageshow", () => alVisibilidad(document.hidden));
document.addEventListener("freeze", () => alVisibilidad(true));
document.addEventListener("resume", () => alVisibilidad(document.hidden));
/** Una promesa que se cumple cuando la página se ve (ya, si se ve). Sin relojes: no despierta al aparato. */
export const cuandoVisible = () => (document.hidden ? new Promise((r) => esperanVer.push(r)) : Promise.resolve());

/* ── Reposo ─────────────────────────────────────────────────────────── */
let ultimo = performance.now(), relojReposo = 0, esperanActividad = [];
function actividad() {
  ultimo = performance.now();
  if (R.reposo) { R.reposo = false; H.classList.remove("rd-reposo"); if (!R.ahorro) soltarQuietos(); avisar(); }
  if (esperanActividad.length) { const l = esperanActividad; esperanActividad = []; l.forEach((r) => r()); }
  if (!relojReposo) relojReposo = setTimeout(revisarReposo, REPOSO);
}
function revisarReposo() {
  relojReposo = 0;
  const falta = REPOSO - (performance.now() - ultimo);
  if (falta > 60 || ocupado()) { relojReposo = setTimeout(revisarReposo, Math.max(falta, 3000)); return; }
  if (document.hidden) return; // al volver, `actividad()` lo vuelve a armar
  R.reposo = true;
  aquietar();
  H.classList.add("rd-reposo");
  avisar();
}
for (const t of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"]) addEventListener(t, actividad, { passive: true, capture: true });
document.addEventListener("scroll", actividad, { passive: true, capture: true });
// Ir y venir sin tocar la pantalla (el «atrás» del teléfono, un aviso que abre algo) también es actividad.
for (const t of ["popstate", "hashchange", "focus", "orientationchange"]) addEventListener(t, actividad, { passive: true });

/* — Lo que se queda quieto: sólo lo decorativo que se repite sin fin («rd-q») — */
const DECOR = ".mp-capa, .jt-capa, .dt-capa, .an-capa, .ch-fondo, .ed-foco, .ed-abeja, .ed-hoja, .ed-tq-mini, .ed-musica-b, .dt-cielo, .dt-burbujas, .dt-globo, .dt-dos, .vn-hilo, .vn-luz, .vn-corazon, .dt-col-corazon, .dt-mini-corazon";
let quietos = [];
/** Marca los elementos cuyas animaciones (todas las que van corriendo) son de las que se repiten para siempre. */
function aquietar() {
  if (!document.getAnimations || typeof CSSAnimation === "undefined") return;
  const por = new Map();
  for (const a of document.getAnimations()) {
    const t = a.effect?.target;
    if (!t || !(a instanceof CSSAnimation) || a.playState !== "running") continue;
    por.set(t, (por.get(t) ?? true) && a.effect.getTiming().iterations === Infinity);
  }
  for (const [t, sinFin] of por) if (sinFin && !t.classList.contains("rd-q") && t.closest(DECOR)) { t.classList.add("rd-q"); quietos.push(t); }
}
function soltarQuietos() { for (const t of quietos) t.classList.remove("rd-q"); quietos = []; }
/** Algo que no debe quedarse quieto aunque nadie toque (reproducir, grabar…). */
export function ocupar(motivo, on = true) { if (on) { R.ocupado.add(motivo); actividad(); } else R.ocupado.delete(motivo); }
const ocupado = () => R.ocupado.size > 0 || [...document.querySelectorAll("video, audio")].some((m) => !m.paused && !m.muted && !m.ended);
/** Se cumple con la próxima vez que toques algo (ya, si no está en reposo ni oculta). */
export const cuandoActivo = () => (R.reposo || document.hidden ? new Promise((r) => esperanActividad.push(r)) : Promise.resolve());
actividad();

/* ── Tapado: lo que queda debajo de una pantalla completa ────────────── */
// (Fase 46) También Nuestros días y la bienvenida: con ellas abiertas, el menú de abajo (gatito, polaroids,
// brillitos…) seguía animándose a escondidas y gastaba un tercio del procesador.
const BASE = ".dt-capa, .mp-capa, .ed-inicio, .ed-prueba, .cm-capa, .jt-capa, .bv-capa, .dz-capa";
const ARRIBA = ".dt-capa.ver, .mp-capa.ver, .ed-inicio, .ed-prueba, .cm-capa.ver, .jt-capa.ver, .bv-capa.ver, .dz-capa.ver";
const zDe = (n) => parseInt(getComputedStyle(n).zIndex, 10) || 0;
let programado = 0;
function revisarCapas() {
  programado = 0;
  const hijos = [...document.body.children];
  let top = -Infinity;
  for (const n of hijos) if (n.matches(ARRIBA)) top = Math.max(top, zDe(n));
  for (const n of hijos) {
    if (/^(SCRIPT|STYLE|LINK|TEMPLATE|META)$/.test(n.tagName)) continue;
    const tapado = top > -Infinity && !n.matches(".rd-libre") && zDe(n) < top;
    if (n.classList.contains("rd-tapado") !== tapado) n.classList.toggle("rd-tapado", tapado);
  }
}
const programar = () => {
  if (!programado) programado = requestAnimationFrame(revisarCapas);
  // Se abrió o cerró una pantalla: es actividad; y en ahorro, lo nuevo que se repite se aquieta ya que terminó de entrar.
  actividad();
  if (R.ahorro) { clearTimeout(programar.t); programar.t = setTimeout(aquietar, 2500); }
};
const mirando = new WeakSet();
const obsClase = new MutationObserver(programar);
const obsHijos = new MutationObserver(() => {
  for (const n of document.body.children) if (!mirando.has(n) && n.matches(BASE)) { mirando.add(n); obsClase.observe(n, { attributes: true, attributeFilter: ["class", "hidden"] }); }
  programar();
});
const empezarCapas = () => { obsHijos.observe(document.body, { childList: true }); obsHijos.takeRecords(); for (const n of document.body.children) if (n.matches(BASE)) { mirando.add(n); obsClase.observe(n, { attributes: true, attributeFilter: ["class", "hidden"] }); } programar(); };
if (document.body) empezarCapas(); else addEventListener("DOMContentLoaded", empezarCapas, { once: true });

/* ── Ahorro: cuando el aparato sufre ─────────────────────────────────── */
let desdeAhorro = 0, ultimaQueja = 0, fijo = "", lentos = [];
function sufre(motivo) {
  const t = performance.now();
  ultimaQueja = t;
  if (R.ahorro) return;
  R.ahorro = true; R.motivo = motivo; desdeAhorro = t;
  aquietar();
  H.classList.add("rd-ahorro");
  liberar();
  avisar();
}
function quizaRecupera() {
  if (!R.ahorro || fijo) return;
  const t = performance.now();
  if (t - desdeAhorro < AHORRO_MIN || t - ultimaQueja < 60000) return;
  R.ahorro = false; R.motivo = "";
  H.classList.remove("rd-ahorro");
  if (!R.reposo) soltarQuietos();
  avisar();
}
/** Cuadros que tardan demasiado: muchos en 10 s = el aparato sufre. */
// (Al arrancar todo tarda un poco más: los primeros 15 s no cuentan; y uno que otro tirón tampoco.)
function cuadroLento(ms) {
  const t = performance.now();
  if (document.hidden || ms < 100 || t < 15000) return;
  lentos = lentos.filter((x) => t - x < 10000);
  lentos.push(t);
  if (lentos.length >= 10) sufre("cuadros lentos");
}
const tipos = (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes) || [];
const tipoLento = tipos.includes("long-animation-frame") ? "long-animation-frame" : tipos.includes("longtask") ? "longtask" : "";
if (tipoLento) {
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) cuadroLento(e.duration); }).observe({ type: tipoLento, buffered: false }); } catch (e) { /* nada */ }
}
/** Sin esa medida (iPhone): una muestra cortita de cuadros de vez en cuando, sólo si se ve y no está quieto. */
let lentasSeguidas = 0;
function muestra() {
  if (document.hidden || R.reposo) return;
  const d = [];
  let t0 = 0;
  const paso = (t) => {
    if (t0) d.push(t - t0);
    t0 = t;
    if (d.length < 40 && !document.hidden) requestAnimationFrame(paso);
    else if (d.length >= 20) {
      d.sort((a, b) => a - b);
      const med = d[d.length >> 1], rapido = d[2] || med;
      // La mediana muy por encima de lo que la pantalla puede (≈ 30 fps o menos con 60 Hz, o el iPhone en «Ahorro de batería»).
      lentasSeguidas = med > Math.max(30, rapido * 1.8) ? lentasSeguidas + 1 : 0;
      if (lentasSeguidas >= 2) sufre("cuadros lentos");
    }
  };
  requestAnimationFrame(paso);
}
/** La presión del procesador (Chrome, donde existe): «serious» o «critical» = ya se está calentando. */
if ("PressureObserver" in window) {
  try {
    new window.PressureObserver((r) => { const s = r[r.length - 1]?.state; if (s === "serious" || s === "critical") sufre("procesador caliente"); }).observe("cpu", { sampleInterval: 4000 }).catch(() => {});
  } catch (e) { /* nada */ }
}
/** Pila baja sin cargar (Android). */
navigator.getBattery?.().then((b) => {
  const ver = () => { if (b.level <= 0.15 && !b.charging) { fijo = "pila baja"; sufre("pila baja"); } else if (fijo === "pila baja") { fijo = ""; quizaRecupera(); } };
  b.addEventListener("levelchange", ver); b.addEventListener("chargingchange", ver); ver();
}).catch(() => {});
/**
 * Ultra Rendimiento (Fase 46, en Configuración): el ahorro queda fijo mientras esté prendido (los adornos que
 * se repiten se quedan quietos, nada se desenfoca) y se suelta en cuanto lo apagas.
 */
export function ultra(on) {
  if (on) { if (fijo !== "ultra") { fijo = "ultra"; if (R.ahorro) { R.motivo = "ultra rendimiento"; aquietar(); avisar(); } else sufre("ultra rendimiento"); } return; }
  if (fijo !== "ultra") return;
  fijo = "";
  R.ahorro = false; R.motivo = "";
  H.classList.remove("rd-ahorro");
  if (!R.reposo) soltarQuietos();
  avisar();
}
/** Ahorro de datos o un aparato con muy poca memoria: desde el principio. */
if (navigator.connection?.saveData) { fijo = "ahorro de datos"; sufre("ahorro de datos"); }
else if (navigator.deviceMemory && navigator.deviceMemory <= 1) { fijo = "poca memoria"; sufre("poca memoria"); }

/* ── Relojes que respetan la página oculta ───────────────────────────── */
/**
 * Como setInterval, pero con la página oculta no despierta al aparato: espera a que se vea.
 * Devuelve cómo pararlo.
 */
export function cada(fn, ms) {
  let vivo = true, t = 0;
  const vuelta = async () => {
    if (!vivo) return;
    if (document.hidden) await cuandoVisible();
    if (!vivo) return;
    try { await fn(); } catch (e) { console.warn(e); }
    if (vivo) t = setTimeout(vuelta, ms);
  };
  t = setTimeout(vuelta, ms);
  return () => { vivo = false; clearTimeout(t); };
}

/* ── Una sola vez a la vez ───────────────────────────────────────────── */
const enCurso = new Map();
/** Si `clave` ya va en curso, devuelve esa misma promesa; si no, corre `fn` (una sola vez a la vez). */
export function unaVez(clave, fn) {
  const ya = enCurso.get(clave);
  if (ya) return ya;
  const p = Promise.resolve().then(fn).finally(() => { if (enCurso.get(clave) === p) enCurso.delete(clave); });
  enCurso.set(clave, p);
  return p;
}

/* ── Fugas: soltar todo de un jalón ──────────────────────────────────── */
const ambitos = new Set();
/** Un «ámbito» (una pantalla, un panel): lo que registras aquí se suelta con `limpiar()`. */
export function ambito(nombre) {
  const sueltos = [];
  const A = {
    nombre,
    on(blanco, tipo, fn, op) { blanco?.addEventListener(tipo, fn, op); sueltos.push(() => blanco?.removeEventListener(tipo, fn, op)); return fn; },
    luego(fn, ms) { const id = setTimeout(fn, ms); sueltos.push(() => clearTimeout(id)); return id; },
    cada(fn, ms) { const p = cada(fn, ms); sueltos.push(p); return p; },
    url(blob) { const u = URL.createObjectURL(blob); sueltos.push(() => URL.revokeObjectURL(u)); return u; },
    observar(o) { sueltos.push(() => o.disconnect()); return o; },
    al(fn) { sueltos.push(fn); return fn; },
    get vivos() { return sueltos.length; },
    limpiar() { while (sueltos.length) { try { sueltos.pop()(); } catch (e) { /* nada */ } } ambitos.delete(A); },
  };
  ambitos.add(A);
  return A;
}
/** Un caché que se puede soltar cuando falta memoria o el aparato sufre. */
export function alLiberar(fn) { liberadores.add(fn); return () => liberadores.delete(fn); }
function liberar() { for (const f of liberadores) { try { f(); } catch (e) { /* nada */ } } }
const historia = [];
function revisarFugas() {
  const nodos = document.getElementsByTagName("*").length, mem = performance.memory?.usedJSHeapSize || 0;
  historia.push({ nodos, mem, ambitos: ambitos.size });
  if (historia.length > 6) historia.shift();
  if (historia.length < 6) return;
  const crece = (k) => historia.every((h, i) => !i || h[k] > historia[i - 1][k]) && historia[5][k] > historia[0][k] * 1.25;
  if (crece("nodos") || (mem && crece("mem")) || crece("ambitos")) {
    console.warn("[rendimiento] algo sólo crece (posible fuga): se liberan los cachés", historia.slice(-1)[0]);
    liberar();
    historia.length = 0;
  }
}

/** Cómo va todo (para la consola: `EditorDev.rendimiento.informe()`). */
export function informe() {
  return {
    oculto: R.oculto, reposo: R.reposo, ahorro: R.ahorro, motivo: R.motivo, ocupado: [...R.ocupado], quietos: quietos.length,
    animaciones: document.getAnimations?.().filter((a) => a.playState === "running").length,
    tapados: [...document.querySelectorAll(".rd-tapado")].map((n) => n.className.split(" ")[0]),
    ambitos: [...ambitos].map((a) => `${a.nombre}: ${a.vivos}`), enCurso: [...enCurso.keys()],
    nodos: document.getElementsByTagName("*").length, memoria: performance.memory?.usedJSHeapSize,
  };
}

// Lo que corre de fondo, poquito y sólo con la página a la vista.
cada(() => { revisarFugas(); quizaRecupera(); if (!tipoLento) muestra(); }, 30000);
