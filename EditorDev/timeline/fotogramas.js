/**
 * FOTOGRAMAS POR PROPIEDAD — las cuentas de la animación propia.
 *
 * Cada fotograma es { t (0–1 dentro de la animación), …propiedades, facil }
 * y en la versión 2 (pr.v = 2) cada propiedad tiene SUS fotogramas: un
 * fotograma puede traer sólo la escala, otro sólo la posición… Así en la
 * línea de tiempo cada propiedad es una pista con sus rombos (◆).
 *
 * Todo devuelve una animación NUEVA (nada se toca en su sitio: el historial
 * de deshacer guarda la de antes).
 */
const RT = window.LibritoRT;
export const PROPS = RT.PROPS;
export const CAMPOS = { pos: ["x", "y", "curva"], escala: ["escala"], rot: ["rot"], opacidad: ["opacidad"], desenfoque: ["desenfoque"], tono: ["tono"], brillo: ["brillo"] };
const DEF = { x: 0, y: 0, curva: 0, escala: 1, rot: 0, opacidad: 1, desenfoque: 0, tono: 0, brillo: 1 };
const CERCA = 0.004;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const copia = (pr) => JSON.parse(JSON.stringify(pr));

/** ¿Tiene fotogramas a mano (no una animación importada)? */
export const editable = (pr) => !!(pr && !pr.raw && Array.isArray(pr.fotogramas));

/** A la versión 2: los fotogramas de antes traen todo explícito (se ve igual). */
export function aV2(pr) {
  const n = copia(pr);
  if (n.v >= 2) return n;
  n.v = 2;
  n.fotogramas = (n.fotogramas || []).map((f) => {
    const g = { t: clamp(+f.t || 0, 0, 1) };
    for (const k of ["x", "y", "escala", "rot", "opacidad", "desenfoque"]) g[k] = f[k] ?? DEF[k];
    for (const k of ["tono", "brillo", "curva", "facil"]) if (f[k] != null) g[k] = f[k];
    // El ritmo de antes valía para toda la animación: ahora va en cada tramo.
    if (g.facil == null && pr.facil) g.facil = pr.facil;
    return g;
  });
  return n;
}

/** Por propiedad: [{ i (fila), t, vals, facil }] ordenados en el tiempo. */
export function claves(pr) {
  const out = {};
  if (!editable(pr)) return out;
  (pr.fotogramas || []).forEach((f, i) => {
    for (const k in CAMPOS) {
      if (!RT.tieneProp(f, k)) continue;
      const vals = {};
      for (const c of CAMPOS[k]) vals[c] = f[c] ?? DEF[c];
      (out[k] = out[k] || []).push({ i, t: clamp(+f.t || 0, 0, 1), vals, facil: f.facil || null });
    }
  });
  for (const k in out) out[k].sort((a, b) => a.t - b.t);
  return out;
}

/** Cuándo empieza y cuánto dura (ms de la página). */
export function ventana(e) {
  const pr = e.anim?.propia;
  const base = RT.inicioDe(e) + (pr ? +pr.retraso || 0 : 0);
  return { base, dur: Math.max(50, pr ? +pr.dur || 1000 : 1000) };
}

/** Saca la propiedad `k` de la fila `i` a una fila propia (si la fila trae más cosas). Devuelve su índice. */
function separar(n, i, k) {
  const f = n.fotogramas[i];
  const otras = Object.keys(CAMPOS).filter((x) => x !== k && RT.tieneProp(f, x));
  if (!otras.length) return i;
  const nueva = { t: f.t };
  for (const c of CAMPOS[k]) { if (f[c] != null) nueva[c] = f[c]; delete f[c]; }
  if (f.facil) nueva.facil = f.facil;
  n.fotogramas.push(nueva);
  return n.fotogramas.length - 1;
}

/** Quita las filas que se quedaron vacías. */
function limpiar(n) { n.fotogramas = n.fotogramas.filter((f) => Object.keys(CAMPOS).some((k) => RT.tieneProp(f, k))); return n; }

/**
 * Pone (o actualiza) un fotograma de `k` en el instante `ms` de la página con
 * `vals`. Si cae fuera de la animación, ésta se estira (los demás fotogramas
 * se quedan en su instante). Devuelve la animación nueva.
 */
export function ponerClave(e, k, ms, vals) {
  const ini = RT.inicioDe(e);
  const pr0 = e.anim?.propia;
  let n = editable(pr0) ? aV2(pr0) : { v: 2, dur: 1000, retraso: Math.max(0, Math.round(ms - ini)), repetir: 1, direccion: "normal", facil: "suave", relleno: "both", fotogramas: [] };
  let base = ini + (+n.retraso || 0), dur = Math.max(50, +n.dur || 1000);
  const abs = (f) => base + f.t * dur;
  if (n.fotogramas.length && (ms < base || ms > base + dur)) {
    // Estirar sin mover lo que ya estaba.
    const tiempos = n.fotogramas.map(abs);
    const nb = Math.max(ini, Math.min(base, ms)), nf = Math.max(base + dur, ms);
    base = nb; dur = Math.max(50, nf - nb);
    n.fotogramas.forEach((f, j) => { f.t = clamp((tiempos[j] - base) / dur, 0, 1); });
    n.retraso = Math.round(base - ini);
    n.dur = Math.round(dur);
  } else if (!n.fotogramas.length) { base = Math.max(ini, ms); n.retraso = Math.round(base - ini); }
  const u = clamp((ms - base) / dur, 0, 1);
  let i = n.fotogramas.findIndex((f) => Math.abs(f.t - u) < CERCA && RT.tieneProp(f, k));
  if (i < 0) { n.fotogramas.push({ t: u }); i = n.fotogramas.length - 1; }
  else i = separar(n, i, k);
  for (const c of CAMPOS[k]) if (vals[c] != null) n.fotogramas[i][c] = +vals[c];
  if (k === "pos") { if (n.fotogramas[i].x == null) n.fotogramas[i].x = 0; if (n.fotogramas[i].y == null) n.fotogramas[i].y = 0; }
  return n;
}

/** Cambia valores (o el ritmo) de un fotograma ya puesto. → { pr, i } (i: dónde quedó). */
export function cambiarClave(pr, i, k, vals) {
  const n = aV2(pr);
  if (!n.fotogramas[i]) return { pr: n, i };
  const j = separar(n, i, k);
  for (const c in vals) { if (vals[c] == null || vals[c] === "") delete n.fotogramas[j][c]; else n.fotogramas[j][c] = c === "facil" ? vals[c] : +vals[c]; }
  return { pr: n, i: j };
}

/** Mueve un fotograma de `k` a otro instante (0–1). → { pr, i } */
export function moverClave(pr, i, k, u) {
  const n = aV2(pr);
  if (!n.fotogramas[i]) return { pr: n, i };
  const j = separar(n, i, k);
  n.fotogramas[j].t = clamp(u, 0, 1);
  return { pr: n, i: j };
}

export function quitarClave(pr, i, k) {
  const n = aV2(pr);
  const f = n.fotogramas[i];
  if (!f) return n;
  for (const c of CAMPOS[k]) delete f[c];
  return limpiar(n);
}

/** Una copia del fotograma en `u` (0–1). → { pr, i } */
export function duplicarClave(pr, i, k, u) {
  const n = aV2(pr);
  const f = n.fotogramas[i];
  if (!f) return { pr: n, i };
  const g = { t: clamp(u, 0, 1) };
  for (const c of CAMPOS[k]) if (f[c] != null) g[c] = f[c];
  if (f.facil) g.facil = f.facil;
  n.fotogramas.push(g);
  return { pr: n, i: n.fotogramas.length - 1 };
}

/** ¿Hay un fotograma de `k` justo en `ms`? → su fila o -1. */
export function claveEn(e, k, ms) {
  const pr = e.anim?.propia;
  if (!editable(pr)) return -1;
  const { base, dur } = ventana(e);
  return (pr.fotogramas || []).findIndex((f) => RT.tieneProp(f, k) && Math.abs(base + (+f.t || 0) * dur - ms) < Math.max(12, dur * CERCA));
}

/** Los valores de cada propiedad en el instante `ms` (lo que se ve). */
export function valoresEn(e, ms) {
  const pr = e.anim?.propia;
  if (!editable(pr)) return { ...DEF };
  const { base, dur } = ventana(e);
  const v = RT.valoresPropios(aV2(pr), clamp((ms - base) / dur, 0, 1));
  return { ...DEF, ...v };
}
