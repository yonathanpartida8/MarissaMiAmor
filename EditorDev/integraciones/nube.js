/**
 * LA NUBE — tus libritos guardados en M.YNTHN, para abrirlos desde cualquier
 * aparato (teléfono, tableta o computadora) con tu misma cuenta. Nadie tiene
 * que instalar nada: sólo entrar con su usuario y su contraseña.
 *
 *   Mientras editas   todo se guarda primero AQUÍ, al instante y aunque no
 *                     haya internet (storage/). Si entraste a tu cuenta, unos
 *                     segundos después se sube a tu nube SÓLO lo que cambió.
 *   Fotos, música y videos  se reconocen por su huella (SHA-256): lo que ya
 *                     está en la nube no se vuelve a subir; lo nuevo sube por
 *                     partes y, si se corta, sigue donde quedó.
 *   El librito        (páginas, textos, ajustes) va en un solo project.json.
 *   En otro aparato   tus libritos salen en «Tus borradores»; al abrir uno se
 *                     baja con todo lo que usa. Si lo cambiaste allá y aquí no,
 *                     se trae solo la versión más nueva.
 *   En dos a la vez   si cambió en los dos, se pregunta con cuál quedarse (o
 *                     se guardan los dos): nunca se pisa nada sin preguntar.
 *   Tus ajustes       del editor también viajan (gana el último que cambió).
 */
import * as SRV from "./servidor.js";
import { cargar, listar, guardarCambios, guardarArchivo, leerArchivo } from "../storage/db.js";
import { normalizar, uid, clonar } from "../core/modelo.js";
import { aviso, modal, el } from "../components/ui.js";

const PARTE = 8 * 1024 * 1024;          // cada parte de una subida (lejos del tope de 100 MB del túnel)
const CON_SUBTLE = 64 * 1024 * 1024;    // hasta aquí, la huella la calcula el navegador de un jalón
const AJUSTES = ["editordev:config", "editordev:autoguardar", "editordev:sonidos", "editordev:musicadev", "editordev:letras", "editordev:colores", "editordev:mis-extras"];

let app = null;
const estado = { st: "fuera", texto: "", p: null, cuando: 0 };
const oyentes = new Set();
/** Estados: fuera · revisando · pendiente · subiendo · bajando · al-dia · sin-conexion · conflicto · llena · error. */
export const estadoNube = () => estado;
export function alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }
function poner(st, texto = "", p = null) {
  Object.assign(estado, { st, texto, p, ...(st === "al-dia" ? { cuando: Date.now() } : {}) });
  for (const f of oyentes) { try { f(estado); } catch (e) { console.warn(e); } }
}

/* ── Lo que este aparato recuerda de la nube (por cuenta) ── */
function leerJ(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch (e) { return d; } }
function guardarJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } }
const yo = () => SRV.usuario()?.usuario || "";
const llave = (n) => `editordev:nube:${n}:${yo()}`;
/** «editado» de la última versión de cada librito que este aparato subió o bajó (para saber quién cambió qué). */
const bases = () => leerJ(llave("bases"), {});
export const base = (clave) => bases()[clave] || 0;
function ponerBase(clave, editado) { const b = bases(); if (editado) b[clave] = editado; else delete b[clave]; guardarJ(llave("bases"), b); }
/** Libritos que se borraron de la nube desde otro aparato: aquí se quedan, pero ya no se suben solos. */
export const quitado = (clave) => !!leerJ(llave("quitados"), {})[clave];
function marcarQuitado(clave, si) { const q = leerJ(llave("quitados"), {}); if (si) q[clave] = Date.now(); else delete q[clave]; guardarJ(llave("quitados"), q); }
/** De qué cuenta es cada librito de este aparato (para no subir los de otra persona a tu nube). */
function dueno(clave) { return leerJ("editordev:nube:duenos", {})[clave] || ""; }
function ponerDueno(clave) { const d = leerJ("editordev:nube:duenos", {}); d[clave] = yo(); guardarJ("editordev:nube:duenos", d); }
export const esMio = (clave) => { const d = dueno(clave); return !d || d === yo(); };
const pausados = new Set();   // con un conflicto sin resolver: no se suben hasta elegir

/** Un nombre corto para este aparato («iPhone», «Teléfono Android»…), para saber dónde se cambió algo. */
export function aparato() {
  const u = navigator.userAgent || "";
  if (/iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/iPhone|iPod/.test(u)) return "iPhone";
  if (/Android/.test(u)) return /Mobile/.test(u) ? "Teléfono Android" : "Tableta Android";
  if (/CrOS/.test(u)) return "Chromebook";
  if (/Windows/.test(u)) return "Computadora con Windows";
  if (/Macintosh/.test(u)) return "Mac";
  if (/Linux/.test(u)) return "Computadora con Linux";
  return "Otro aparato";
}

/* ── La huella de un archivo (SHA-256 completo) ── */
const K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
/** SHA-256 por pedazos (para videos grandes: el navegador no tiene uno que vaya leyendo de a poco). */
export class Sha256 {
  constructor() { this.h = Uint32Array.from([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]); this.w = new Uint32Array(64); this.buf = new Uint8Array(64); this.n = 0; this.len = 0; }
  _bloque(d, o) {
    const w = this.w, H = this.h;
    for (let i = 0; i < 16; i++) w[i] = (d[o + 4 * i] << 24) | (d[o + 4 * i + 1] << 16) | (d[o + 4 * i + 2] << 8) | d[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      w[i] = (w[i - 16] + (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + w[i - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) | 0;
    }
    let a = H[0], b = H[1], c = H[2], e3 = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (e3 + t1) | 0; e3 = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += e3; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  update(d) {
    let i = 0;
    this.len += d.length;
    if (this.n) {
      const k = Math.min(64 - this.n, d.length);
      this.buf.set(d.subarray(0, k), this.n);
      this.n += k; i = k;
      if (this.n < 64) return this;
      this._bloque(this.buf, 0); this.n = 0;
    }
    for (; i + 64 <= d.length; i += 64) this._bloque(d, i);
    if (i < d.length) { this.buf.set(d.subarray(i), 0); this.n = d.length - i; }
    return this;
  }
  hex() {
    const bits = this.len * 8, fin = new Uint8Array((this.n < 56 ? 56 : 120) - this.n + 8);
    fin[0] = 0x80;
    const L = fin.length, hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    for (let i = 0; i < 4; i++) { fin[L - 8 + i] = (hi >>> (24 - 8 * i)) & 255; fin[L - 4 + i] = (lo >>> (24 - 8 * i)) & 255; }
    this.update(fin);
    return [...this.h].map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
}
const hex = (u8) => [...u8].map((x) => x.toString(16).padStart(2, "0")).join("");
const pausa = () => new Promise((r) => setTimeout(r, 0));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function huella(blob) {
  if (globalThis.crypto?.subtle && blob.size <= CON_SUBTLE) return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())));
  const h = new Sha256();
  for (let i = 0; i < blob.size; i += 4 << 20) { h.update(new Uint8Array(await blob.slice(i, i + (4 << 20)).arrayBuffer())); await pausa(); }
  return h.hex();
}

/**
 * Las huellas de los archivos de un librito (se calculan una vez y quedan
 * anotadas en cada asset: `sha` y `shaTam`). Devuelve huella → { llave, tam, tipo }.
 */
async function huellasDe(P, { ids = null, originales = true } = {}) {
  const mapa = new Map();
  let cambio = false;
  for (const a of Object.values(P.assets || {})) {
    if (a.fuente !== "local" || (ids && !ids.includes(a.id))) continue;
    const partes = [[a.id, a], ...(originales && a.original ? [["orig:" + a.id, a.original]] : [])];
    for (const [k, obj] of partes) {
      const b = await leerArchivo(k).catch(() => null);
      if (!b || !b.size) continue;   // no está en este aparato: si ya tenía huella, sigue en la nube
      if (!(obj.sha && obj.shaTam === b.size)) { obj.sha = await huella(b); obj.shaTam = b.size; cambio = true; }
      mapa.set(obj.sha, { llave: k, tam: b.size, tipo: b.type || obj.mime || a.mime || "" });
    }
  }
  return { mapa, cambio };
}

/** Las huellas nuevas se guardan con el librito (sin que cuente como un cambio tuyo). */
async function anotarHuellas(P) {
  const E = app?.estado;
  if (E?.proyecto?.id === P.id) {
    // Con el guardado automático apagado no se escribe nada por su cuenta (se recalculan la próxima vez).
    if (app.auto?.activo !== false) { E.sucio.meta = true; app.auto?.programar(); }
    return;
  }
  await guardarCambios(P, [], []).catch(() => {});
}

/* ── Subir ── */
async function subirArchivo(sha, blob, tipo, alBytes) {
  let desde = 0, fallos = 0;
  for (;;) {
    const trozo = blob.slice(desde, Math.min(blob.size, desde + PARTE));
    let r;
    try { r = await SRV.nubeParte(sha, trozo, { desde, tam: blob.size, tipo }, (n) => alBytes?.(desde + n)); }
    catch (e) { if (++fallos > 4 || !navigator.onLine) throw e; await espera(1500 * fallos); continue; }
    const d = r.datos || {};
    if (r.status === 200 || r.status === 201) { alBytes?.(blob.size); return; }
    if (r.status === 202 || (r.status === 409 && typeof d.tengo === "number")) {
      if (r.status === 409 && ++fallos > 6) throw new Error("La subida no pudo seguir donde quedó. Inténtalo otra vez.");
      desde = d.tengo; alBytes?.(desde);
      continue;
    }
    if (r.status === 422 && fallos++ < 2) { desde = 0; continue; }   // llegó dañado: otra vez desde el principio
    throw Object.assign(new Error(d.error || `${SRV.NOMBRE} contestó ${r.status}`), { status: r.status, datos: d });
  }
}

async function subirFaltantes(mapa, alAvance) {
  const shas = [...mapa.keys()];
  if (!shas.length) return 0;
  const faltan = [];
  for (let i = 0; i < shas.length; i += 4000) faltan.push(...await SRV.nubeFaltan(shas.slice(i, i + 4000)));
  const total = faltan.reduce((s, x) => s + (mapa.get(x)?.tam || 0), 0) || 1;
  let listos = 0;
  for (const [i, sha] of faltan.entries()) {
    const x = mapa.get(sha);
    const b = x && await leerArchivo(x.llave).catch(() => null);
    if (!b) continue;   // se quitó mientras tanto
    await subirArchivo(sha, b, x.tipo, (n) => alAvance?.(`Subiendo a tu nube: archivo ${i + 1} de ${faltan.length}`, (listos + n) / total));
    listos += x.tam;
  }
  return faltan.length;
}

/** El librito como va a la nube (sin lo que sólo le importa a este aparato). */
function paraNube(P) {
  const { rev, guardado, nPaginas, ...resto } = P;
  void rev; void guardado; void nPaginas;
  return resto;
}

let ocupado = null;
/** De a uno: dos subidas a la vez sólo se estorbarían (y el túnel es uno). */
async function enFila(fn) {
  while (ocupado) await ocupado.catch(() => {});
  const p = fn();
  ocupado = p;
  try { return await p; } finally { if (ocupado === p) ocupado = null; }
}

async function subirLibrito(P, { forzar = false, alAvance } = {}) {
  const clave = P.id;
  const { mapa, cambio } = await huellasDe(P);
  if (cambio) await anotarHuellas(P);
  // La foto de AHORA: lo que cambie mientras sube va en la próxima vuelta.
  const texto = JSON.stringify(paraNube(P));
  const editado = P.editado || 0;
  await subirFaltantes(mapa, alAvance);
  alAvance?.("Guardando el librito en tu nube…", 1);
  let r;
  for (let intento = 0; ; intento++) {
    try { r = await SRV.nubeGuardar(clave, texto, { base: base(clave), forzar, aparato: aparato() }); break; }
    catch (e) {
      // Faltaba algo (se borró de la nube mientras tanto): se sube y otra vez.
      if (e.status === 409 && e.datos?.faltan && intento < 2) { await subirFaltantes(new Map([...mapa].filter(([s]) => e.datos.faltan.includes(s))), alAvance); continue; }
      if (e.status === 409 && e.datos?.faltan) throw Object.assign(new Error("A este librito le faltan fotos o videos que no están ni en este aparato ni en tu nube."), { status: 409 });
      throw e;
    }
  }
  ponerBase(clave, editado);
  ponerDueno(clave);
  marcarQuitado(clave, false);
  if (cacheLista) { const f = cacheLista.libritos.find((l) => l.clave === clave); if (f) f.editado = editado; else cacheLista.libritos.unshift({ clave, nombre: P.nombre, editado, paginas: P.orden.length, aparato: aparato() }); }
  return r;
}

/* ── Bajar ── */
async function bajarArchivos(P, alAvance, lib = P.id) {
  const lista = Object.values(P.assets || {}).filter((a) => a.fuente === "local" && a.sha);
  let i = 0;
  for (const a of lista) {
    alAvance?.(`Bajando de tu nube: archivo ${++i} de ${lista.length}`, i / lista.length);
    const ya = await leerArchivo(a.id).catch(() => null);
    if (ya && ya.size === a.shaTam) continue;
    try {
      const b = await SRV.nubeArchivo(a.sha);
      await guardarArchivo(lib, a.id, b.slice(0, b.size, a.mime || b.type));
    } catch (e) {
      if (!navigator.onLine || /no contesta|sin internet/i.test(e.message)) throw e;
      console.warn("[nube] no se pudo bajar", a.nombre, e);   // ése se verá como hueco; lo demás abre igual
    }
  }
}

async function traer(clave, alAvance) {
  poner("bajando", "Bajando de tu nube…");
  const d = await SRV.nubeLibrito(clave);
  if (!d || !Array.isArray(d.orden) || !d.paginas || typeof d.paginas !== "object") throw new Error("Lo que llegó de tu nube no es un librito.");
  const P = normalizar({ ...d, id: clave });
  await bajarArchivos(P, alAvance);
  const viejo = await cargar(clave).catch(() => null);
  const borradas = viejo ? Object.keys(viejo.paginas || {}).filter((pid) => !P.paginas[pid]) : [];
  P.rev = (viejo?.rev || 0) + 1;
  P.guardado = Date.now();
  await guardarCambios(P, P.orden, borradas);
  ponerBase(clave, P.editado || 0);
  ponerDueno(clave);
  marcarQuitado(clave, false);
  pausados.delete(clave);
  poner("al-dia", "Al día con tu nube");
  return P;
}

/** Abre un librito de tu nube (lo baja con todo lo que usa; si ya estaba aquí, lo pone al día). */
export async function abrirDeLaNube(clave, { alAvance, avisoTxt = "" } = {}) {
  if (app.auto?.pendiente) await app.auto.ahora();
  try {
    const P = await enFila(() => traer(clave, alAvance));
    await app.abrirProyecto(P, false);
    if (avisoTxt) aviso(avisoTxt, 4500);
    return P;
  } catch (e) { error(e); throw e; }
}

/* ── La lista de tu nube ── */
let cacheLista = null, cacheT = 0;
export async function listaNube(fresca = false) {
  if (!fresca && cacheLista && Date.now() - cacheT < 15000) return cacheLista;
  const d = await SRV.nube();
  cacheLista = { ...d, libritos: d.libritos || [] };
  cacheT = Date.now();
  return cacheLista;
}

/** Cómo está un librito de este aparato frente a la nube: igual · aqui (sólo aquí) · subir · nube (más nuevo allá) · los-dos · quitado. */
export function comparar(m, fila) {
  const b = base(m.id), ed = m.editado || 0;
  if (!fila) return b || quitado(m.id) ? "quitado" : "aqui";
  if (Math.abs(fila.editado - ed) <= 1) return "igual";
  const allaCambio = fila.editado > b + 1, aquiCambio = ed > b + 1;
  if (allaCambio && aquiCambio) return "los-dos";
  return allaCambio ? "nube" : "subir";
}

/* ── Automático: subir lo que cambió unos segundos después de guardarlo aquí ── */
let reloj = 0, primero = 0, fallos = 0, ultimaRevision = 0, ultimosTodos = 0;
export function programar(ms = 10000) {
  if (!SRV.conectado() || !app?.estado?.proyecto) return;
  const ahora = Date.now();
  if (!reloj) primero = ahora;
  clearTimeout(reloj);
  reloj = setTimeout(() => { reloj = 0; auto(); }, Math.max(400, Math.min(ms, 60000 - (ahora - primero))));
  if (["al-dia", "fuera", "revisando"].includes(estado.st)) poner("pendiente", "Hay cambios por subir a tu nube");
}
function reintentar() {
  clearTimeout(reloj);
  fallos++;
  reloj = setTimeout(() => { reloj = 0; auto(); }, Math.min(5 * 60000, 15000 * 2 ** Math.min(4, fallos - 1)));
}

async function auto() {
  const P = app?.estado?.proyecto;
  if (!SRV.conectado()) { poner("fuera"); return; }
  if (!P) return;
  if (!navigator.onLine) { poner("sin-conexion", "Sin internet: se sube cuando vuelva"); return; }
  if (pausados.has(P.id)) { poner("conflicto", "Cambió en dos aparatos: elige con cuál quedarte"); return; }
  if (quitado(P.id) || !esMio(P.id)) { await subirAjustes().catch(() => {}); poner("al-dia", "Este librito sólo está en este aparato"); return; }
  try {
    if (Math.abs((P.editado || 0) - base(P.id)) > 1) {
      poner("subiendo", "Subiendo a tu nube…");
      await enFila(() => subirLibrito(P, { alAvance: (t, p) => poner("subiendo", t, p) }));
    }
    await subirAjustes().catch(() => {});
    fallos = 0;
    poner("al-dia", "Al día con tu nube");
    // Los demás de este aparato (una copia, uno abierto de un .zip…), de vez en cuando.
    if (Date.now() - ultimosTodos > 2 * 60000) setTimeout(subirTodos, 4000);
  } catch (e) {
    if (!manejar(e, P)) reintentar();
  }
}

/** Errores que se entienden solos; devuelve true si no hay que reintentar. */
function manejar(e, P) {
  if (e.status === 409 && e.datos?.conflicto) { pausados.add(P.id); poner("conflicto", "Cambió en dos aparatos: elige con cuál quedarte"); if (app.estado.proyecto?.id === P.id) preguntar(P, e.datos); return true; }
  if (e.status === 410) {
    ponerBase(P.id, 0); marcarQuitado(P.id, true);
    poner("al-dia", "Este librito sólo está en este aparato");
    aviso(`«${P.nombre}» se borró de tu nube desde otro aparato. Aquí sigue guardado; si quieres volver a subirlo, toca el indicador de guardado.`, 7000);
    return true;
  }
  if (e.status === 413) { poner("llena", e.message); avisoUnaVez("llena", `Tu nube de ${SRV.NOMBRE} está llena: ${e.message} Lo de este aparato sigue a salvo.`); return true; }
  if (e.status === 401) { poner("fuera"); return true; }
  error(e);
  return false;
}
function error(e) {
  const sinRed = !navigator.onLine || /no contesta|sin internet|no está disponible|se cortó/i.test(e.message || "");
  poner(sinRed ? "sin-conexion" : "error", sinRed ? `${SRV.NOMBRE} no contesta: se sube solo cuando vuelva` : e.message || "No se pudo subir");
}
const avisados = new Set();
function avisoUnaVez(k, t) { if (avisados.has(k)) return; avisados.add(k); aviso(t, 7000, "error"); }

/** «Subir ahora» (lo pediste tú): sube el librito abierto, aunque antes se hubiera quitado de la nube o fuera de otra cuenta. */
export async function subirAhora({ alAvance } = {}) {
  const P = app?.estado?.proyecto;
  if (!P || !SRV.conectado()) throw new Error("Primero entra a tu cuenta.");
  if (pausados.has(P.id)) { preguntar(P, {}); throw new Error("Primero elige con qué versión te quedas."); }
  if (app.auto?.pendiente) await app.auto.ahora();
  if (!esMio(P.id)) ponerBase(P.id, 0);
  poner("subiendo", "Subiendo a tu nube…");
  try {
    await enFila(() => subirLibrito(P, { alAvance: (t, p) => { poner("subiendo", t, p); alAvance?.(t, p); } }));
    await subirAjustes().catch(() => {});
    fallos = 0;
    poner("al-dia", "Al día con tu nube");
  } catch (e) { manejar(e, P); throw e; }
}

/** Guardar a mano: lo sube y además deja una copia (una instantánea) en tu nube. */
export async function guardarCopia({ alAvance } = {}) {
  const P = app?.estado?.proyecto;
  if (!P || !SRV.conectado()) return null;
  await subirAhora({ alAvance });
  const r = await SRV.nubeCopia(P.id);
  dispatchEvent(new CustomEvent("ed-nube", { detail: r }));
  return r;
}

/* ── Dos aparatos ── */
let preguntando = false;
/** Lo cambiaste aquí y allá: ¿con cuál te quedas? */
export async function preguntar(P = app?.estado?.proyecto, info = {}) {
  if (!P || preguntando) return;
  preguntando = true;
  pausados.add(P.id);
  poner("conflicto", "Cambió en dos aparatos: elige con cuál quedarte");
  try {
    if (!info.editado) { const f = (await listaNube(true).catch(() => ({ libritos: [] }))).libritos.find((l) => l.clave === P.id); Object.assign(info, f || {}); }
    const cuando = info.editado ? new Date(info.editado).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    const r = await modal({
      titulo: "Lo cambiaste en dos aparatos", ancho: 470,
      contenido: [
        el("p", { text: `«${P.nombre}» también cambió en ${info.aparato || "otro aparato"}${cuando ? ` (${cuando})` : ""}, después de la última vez que estuvo al día aquí. ¿Con cuál te quedas?` }),
        el("small.ed-ayuda", { text: "«Las dos» guarda la de este aparato como un librito aparte y abre la de tu nube: así no se pierde nada. Si cierras esto, se queda como está hasta que elijas." }),
      ],
      // Cerrarla es «más tarde»: no se sube nada hasta elegir (el indicador de guardado lo recuerda).
      acciones: [["Las dos", "dos"], ["La de mi nube", "nube"], ["La de aquí", "aqui", "primario"]],
    });
    if (r === "aqui") {
      pausados.delete(P.id);
      poner("subiendo", "Subiendo la de este aparato…");
      await enFila(() => subirLibrito(P, { forzar: true }));
      poner("al-dia", "Al día con tu nube");
      aviso("Listo: tu nube quedó con la versión de este aparato", 3500);
    } else if (r === "nube" || r === "dos") {
      if (r === "dos") await app.duplicarProyecto(P.id, { nombre: `${P.nombre} (de ${aparato()})` });
      await abrirDeLaNube(P.id, { avisoTxt: r === "dos" ? `Abrí la de tu nube; la de este aparato quedó aparte como «${P.nombre} (de ${aparato()})»` : "Abrí la versión de tu nube" });
      if (r === "dos") setTimeout(subirTodos, 3000);   // la de aquí también queda en tu nube, como librito aparte
    }
  } catch (e) { aviso(e.message || "No se pudo", 4500, "error"); }
  finally { preguntando = false; }
}

/**
 * Al abrir un librito (o al volver a esta pestaña): si en la nube hay uno más
 * nuevo y aquí no cambiaste nada, se trae solo; si cambió en los dos, se pregunta.
 */
export async function revisarAbierto() {
  const P = app?.estado?.proyecto;
  if (!SRV.conectado() || !P || !navigator.onLine) return;
  ultimaRevision = Date.now();
  const ed = P.editado;
  let fila;
  try { fila = (await listaNube(true)).libritos.find((l) => l.clave === P.id); } catch (e) { error(e); return; }
  if (app.estado.proyecto !== P) return;   // mientras tanto se abrió otro
  const c = comparar(P, fila);
  if (c === "igual") { if (!base(P.id)) { ponerBase(P.id, fila.editado); ponerDueno(P.id); } poner("al-dia", "Al día con tu nube"); return; }
  if (!esMio(P.id) || c === "quitado") { if (c === "quitado" && base(P.id)) { ponerBase(P.id, 0); marcarQuitado(P.id, true); } poner("al-dia", "Este librito sólo está en este aparato"); return; }
  if (c === "aqui" || c === "subir") { programar(2500); return; }
  // Cambió allá. Si aquí no se ha tocado desde que se abrió, se trae sin preguntar.
  if (c === "nube" && P.editado === ed && !app.auto?.pendiente) {
    try { await abrirDeLaNube(P.id, { avisoTxt: `Traje la versión más nueva de «${P.nombre}» (la cambiaste en ${fila.aparato || "otro aparato"})` }); } catch (e) { /* ya avisó */ }
    return;
  }
  preguntar(P, { ...fila });
}

/** Después de entrar: todos los libritos de este aparato que no están (o no al día) en la nube, de a uno y sin estorbar. */
let subiendoTodos = false;
export async function subirTodos() {
  if (subiendoTodos || !SRV.conectado() || !navigator.onLine) return;
  subiendoTodos = true;
  ultimosTodos = Date.now();
  try {
    const [lista, nubeL] = await Promise.all([listar(), listaNube(true)]);
    const enNube = new Map(nubeL.libritos.map((l) => [l.clave, l]));
    for (const m of lista) {
      if (!SRV.conectado()) break;
      if (app?.estado?.proyecto?.id === m.id || !esMio(m.id) || quitado(m.id) || pausados.has(m.id)) continue;
      const c = comparar(m, enNube.get(m.id));
      if (c === "igual") { if (!base(m.id)) { ponerBase(m.id, enNube.get(m.id).editado); ponerDueno(m.id); } continue; }
      if (c === "quitado") { ponerBase(m.id, 0); marcarQuitado(m.id, true); continue; }
      if (c !== "aqui" && c !== "subir") continue;   // más nuevo allá: se pone al día al abrirlo
      const P = await cargar(m.id).catch(() => null);
      if (!P || app?.estado?.proyecto?.id === m.id) continue;
      poner("subiendo", `Subiendo «${P.nombre}» a tu nube…`);
      try { await enFila(() => subirLibrito(P, { alAvance: (t, p) => poner("subiendo", `«${P.nombre}»: ${t}`, p) })); }
      catch (e) {
        if (e.status === 409 || e.status === 410) { if (e.status === 410) marcarQuitado(m.id, true); continue; }
        manejar(e, P);
        return;
      }
    }
    if (!["conflicto", "llena"].includes(estado.st)) poner("al-dia", "Todo está en tu nube");
  } catch (e) { error(e); }
  finally { subiendoTodos = false; }
}

/** Borrar un librito de tu nube (y sus copias). Lo de este aparato no se toca. */
export async function borrarDeLaNube(clave) {
  await SRV.nubeBorrar(clave);
  ponerBase(clave, 0);
  pausados.delete(clave);
  if (cacheLista) cacheLista.libritos = cacheLista.libritos.filter((l) => l.clave !== clave);
}

/** Una copia guardada en tu nube, abierta como borrador NUEVO (con sus fotos con otro nombre: cada borrador tiene las suyas). */
export async function abrirCopia(id, nombre, alAvance) {
  if (app.auto?.pendiente) await app.auto.ahora();
  const d = await SRV.nubeAbrirCopia(id);
  if (!d || !Array.isArray(d.orden)) throw new Error("Esa copia no es un librito.");
  const P = normalizar(clonar(d));
  P.id = uid("lib");
  P.nombre = `${P.nombre || nombre} (copia)`;
  P.creado = P.editado = Date.now();
  delete P.rev; delete P.guardado;
  const mapa = {}, assets = {};
  for (const a of Object.values(P.assets)) {
    if (a.fuente !== "local") { assets[a.id] = a; continue; }
    const nid = uid("a");
    mapa[a.id] = nid;
    assets[nid] = { ...a, id: nid };
  }
  P.assets = assets;
  const cambiar = (o) => { let t = JSON.stringify(o); for (const [v, n] of Object.entries(mapa)) t = t.split(JSON.stringify(v)).join(JSON.stringify(n)); return JSON.parse(t); };
  P.paginas = cambiar(P.paginas);
  P.ajustes = cambiar(P.ajustes);
  await enFila(() => bajarArchivos(P, alAvance));
  await guardarCambios(P, P.orden, []);
  await app.abrirProyecto(P, false);
  app.menuPrincipal?.cerrar();
  aviso(`«${P.nombre}» abierto como borrador nuevo`);
  return P;
}

/**
 * Para publicar o mandar un detallito: sube a tu nube (si falta) cada archivo
 * usado y devuelve id → huella. Así el .zip lleva sólo una referencia y el
 * servidor pone el archivo él mismo: nada grande cruza el túnel dos veces.
 */
export async function asegurarArchivos(P, ids, alAvance) {
  if (!SRV.conectado() || !ids.length) return null;
  const { mapa, cambio } = await huellasDe(P, { ids, originales: false });
  if (cambio) await anotarHuellas(P);
  await enFila(() => subirFaltantes(mapa, alAvance));
  const r = new Map();
  for (const [sha, x] of mapa) r.set(x.llave, sha);
  return r;
}

/** El original de una foto achicada, si este aparato no lo tiene pero tu nube sí (copia de seguridad completa). */
export async function originalDeLaNube(a) {
  if (!SRV.conectado() || !a?.original?.sha) return null;
  try { const b = await SRV.nubeArchivo(a.original.sha); return b.slice(0, b.size, a.original.mime || b.type); } catch (e) { return null; }
}

/* ── Tus ajustes del editor ── */
const ajustesDeAqui = () => { const o = {}; for (const k of AJUSTES) { try { const v = localStorage.getItem(k); if (v != null) o[k] = v; } catch (e) { /* nada */ } } return o; };
const firma = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
async function traerAjustes() {
  const r = await SRV.misAjustes();
  const yo = leerJ(llave("ajustes"), { editado: 0, firma: "" });
  if (!r.ajustes || !(r.editado > yo.editado)) return;
  if (firma(r.ajustes) !== firma(ajustesDeAqui())) {
    for (const [k, v] of Object.entries(r.ajustes)) if (AJUSTES.includes(k) && typeof v === "string") { try { localStorage.setItem(k, v); } catch (e) { /* nada */ } }
    // La configuración se aplica ya; lo demás (sonidos, letras…) al volver a abrir el editor.
    try { const C = await import("../config/preferencias.js"); C.poner(JSON.parse(r.ajustes["editordev:config"] || "{}")); } catch (e) { /* nada */ }
  }
  guardarJ(llave("ajustes"), { editado: r.editado, firma: firma(ajustesDeAqui()) });
}
async function subirAjustes() {
  const aqui = ajustesDeAqui(), f = firma(aqui);
  if (f === leerJ(llave("ajustes"), { firma: "" }).firma) return;
  const editado = Date.now();
  await SRV.guardarMisAjustes(aqui, editado);
  guardarJ(llave("ajustes"), { editado, firma: f });
}

/* ── Arranque ── */
async function alEntrar() {
  if (!SRV.conectado()) return;
  poner("revisando", "Revisando tu nube…");
  try { await traerAjustes(); } catch (e) { /* sin ajustes guardados */ }
  if (app.estado?.proyecto) await revisarAbierto();
  else poner("al-dia", "Al día con tu nube");
  setTimeout(subirTodos, 12000);
}

export function conectar(a) {
  app = a;
  const E = app.estado;
  E.on("cargado", () => setTimeout(revisarAbierto, 600));
  addEventListener("ed-cuenta", () => {
    cacheLista = null; pausados.clear(); clearTimeout(reloj); reloj = 0;
    if (SRV.conectado()) alEntrar(); else poner("fuera");
  });
  addEventListener("online", () => { if (SRV.conectado()) programar(1500); });
  document.addEventListener("visibilitychange", () => {
    if (!SRV.conectado()) return;
    // Al irte: lo pendiente sube ya. Al volver: ¿lo cambiaste en otro aparato mientras?
    if (document.hidden) { if (reloj) { clearTimeout(reloj); reloj = 0; auto(); } }
    else if (Date.now() - ultimaRevision > 30000 && !reloj && !ocupado) revisarAbierto();
  });
  import("../config/preferencias.js").then((C) => C.alCambiar(() => { if (SRV.conectado()) programar(8000); })).catch(() => {});
  if (SRV.conectado()) setTimeout(() => { traerAjustes().catch(() => {}); setTimeout(subirTodos, 15000); }, 2500);
}
