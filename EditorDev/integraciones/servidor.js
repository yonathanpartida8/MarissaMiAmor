/**
 * TU SERVIDOR — el editor habla con el servidor del librito (servidor/ en el
 * repositorio, corriendo en tu teléfono viejo con Termux).
 *
 * Aquí NO hay ninguna llave de GitHub: el editor sólo guarda la dirección del
 * servidor y la sesión de TU cuenta del servidor (usuario y contraseña
 * propios). El servidor es quien tiene el token de GitHub, cifrado, y quien
 * publica en tu repositorio.
 *
 *   · Emparejar: la dirección se pega a mano, llega en un enlace
 *     (…/EditorDev/#servidor=https://…) o se encuentra sola en servidor.json
 *     de tu GitHub Pages (el servidor la anuncia cuando cambia el túnel).
 *   · La sesión va en «Authorization: Bearer …» (nunca en galletas de otro
 *     sitio). En localStorage si eliges «recordarme»; si no, se olvida al
 *     cerrar.
 */
const CLAVE = "editordev:servidor";

export function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || sessionStorage.getItem(CLAVE) || "null") || {}; } catch (e) { return {}; }
}
export function guardar(c, recordar = leer()._recordar !== false) {
  const s = JSON.stringify({ ...c, _recordar: recordar });
  try {
    (recordar ? localStorage : sessionStorage).setItem(CLAVE, s);
    (recordar ? sessionStorage : localStorage).removeItem(CLAVE);
  } catch (e) { /* nada */ }
}
export function olvidarSesion() { const c = leer(); delete c.token; delete c.usuario; guardar(c); }
export function olvidarTodo() { try { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }

/** Deja la dirección limpia: https://algo.trycloudflare.com (sin barra final ni rutas). */
export function limpiarUrl(u) {
  u = String(u || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = (/^(localhost|127\.|192\.168\.|10\.)/.test(u) ? "http://" : "https://") + u;
  try { const x = new URL(u); return x.origin; } catch (e) { return ""; }
}

/** ¿El navegador la va a bloquear? (una página https no puede hablar con http, salvo localhost). */
export function bloqueada(url) {
  try {
    const u = new URL(url);
    return location.protocol === "https:" && u.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch (e) { return true; }
}

/** Un enlace …#servidor=… en la barra: se guarda la dirección y se limpia la barra. */
export function revisarEnlace() {
  const m = /[#&]servidor=([^&]+)/.exec(location.hash || "");
  if (!m) return "";
  const url = limpiarUrl(decodeURIComponent(m[1]));
  try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) { /* nada */ }
  if (!url) return "";
  const c = leer();
  if (c.url !== url) guardar({ url });
  return url;
}

/** La dirección que anunció el servidor en tu GitHub Pages (servidor.json, junto al librito). */
export async function descubrir() {
  try {
    const r = await fetch(new URL("../servidor.json", location.href), { cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    const url = limpiarUrl(d.url);
    return url ? { url, nombre: d.nombre || "", actualizado: d.actualizado || "" } : null;
  } catch (e) { return null; }
}

async function pedir(ruta, { method = "GET", body, token, url } = {}) {
  const c = leer();
  const base = url || c.url;
  if (!base) throw new Error("Primero conecta tu servidor.");
  if (bloqueada(base)) throw new Error("Desde internet el navegador no deja usar una dirección http://… Usa la dirección https del túnel (la que muestra el panel del servidor).");
  let r;
  try {
    r = await fetch(base + "/api/" + ruta, {
      method, cache: "no-store", referrerPolicy: "no-referrer", credentials: "omit",
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...((token || c.token) ? { Authorization: "Bearer " + (token || c.token) } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) { throw new Error("No hay conexión con tu servidor. ¿Está prendido el teléfono y el túnel? (en Termux: librito estado)"); }
  let d = {};
  try { d = await r.json(); } catch (e) { /* nada */ }
  if (r.status === 401 && ruta !== "entrar") olvidarSesion();
  if (!r.ok) { const err = new Error(d.error || `El servidor contestó ${r.status}`); err.status = r.status; throw err; }
  return d;
}

export const info = (url) => pedir("info", { url });
export async function entrar(url, usuario, contrasena, recordar) {
  const d = await pedir("entrar", { url, method: "POST", body: { usuario, contrasena, cliente: "editor", recordar } });
  guardar({ url, token: d.token, usuario: d.usuario }, recordar);
  return d.usuario;
}
export async function registrar(url, usuario, contrasena, codigo, recordar) {
  const d = await pedir("registro", { url, method: "POST", body: { usuario, contrasena, codigo, cliente: "editor", recordar } });
  if (d.token) guardar({ url, token: d.token, usuario: d.usuario }, recordar);
  return d;
}
export async function salir() { try { await pedir("salir", { method: "POST", body: {} }); } catch (e) { /* nada */ } olvidarSesion(); }
export const yo = () => pedir("yo");
export const publicaciones = () => pedir("publicaciones").then((d) => d.publicaciones || []);
export const proyectos = () => pedir("proyectos").then((d) => d.proyectos || []);
export const quitar = (slug) => pedir("publicaciones/" + encodeURIComponent(slug), { method: "DELETE" });
export const subirOtraVez = (slug) => pedir(`publicaciones/${encodeURIComponent(slug)}/subir`, { method: "POST", body: {} });
export const borrarProyecto = (id) => pedir("proyectos/" + encodeURIComponent(id), { method: "DELETE" });
export const trabajo = (id) => pedir("trabajos/" + encodeURIComponent(id));

/** Sube un .zip con avance (XHR: fetch no cuenta lo que sube). */
function subir(ruta, blob, alAvance) {
  const c = leer();
  if (bloqueada(c.url)) return Promise.reject(new Error("Usa la dirección https del túnel (no http)."));
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("POST", c.url + "/api/" + ruta);
    x.setRequestHeader("Authorization", "Bearer " + c.token);
    x.setRequestHeader("Content-Type", "application/zip");
    x.timeout = 30 * 60 * 1000;
    x.upload.onprogress = (e) => { if (e.lengthComputable) alAvance?.(e.loaded / e.total); };
    x.onload = () => {
      let d = {};
      try { d = JSON.parse(x.responseText || "{}"); } catch (e) { /* nada */ }
      if (x.status === 401) olvidarSesion();
      if (x.status >= 200 && x.status < 300) ok(d);
      else mal(Object.assign(new Error(d.error || `El servidor contestó ${x.status}`), { status: x.status }));
    };
    x.onerror = () => mal(new Error("Se cortó la conexión con tu servidor mientras subía."));
    x.ontimeout = () => mal(new Error("Tardó demasiado en subir."));
    x.send(blob);
  });
}

/** Espera a que el servidor termine un trabajo, contando cómo va. */
export async function esperar(id, alPaso) {
  for (let i = 0; i < 1800; i++) {
    const t = await trabajo(id);
    alPaso?.(t);
    if (t.estado === "listo") return t.resultado || {};
    if (t.estado === "error") throw new Error(t.error || "No se pudo.");
    await new Promise((r) => setTimeout(r, i < 10 ? 600 : 1500));
  }
  throw new Error("El servidor sigue trabajando; mira cómo va en su panel.");
}

/** Publica: sube el .zip (sólo para ver) y espera a que el servidor lo deje en GitHub. */
export async function publicar(blob, { titulo, nombre, paginas, reemplazar }, alPaso) {
  const q = new URLSearchParams({ titulo, nombre: nombre || "", paginas: String(paginas || 0) });
  if (reemplazar) q.set("reemplazar", reemplazar);
  const r = await subir("publicaciones?" + q, blob, (p) => alPaso?.(`Subiendo a tu servidor… ${Math.round(p * 100)} %`, p));
  alPaso?.("Tu servidor lo está guardando en GitHub…");
  const res = await esperar(r.trabajo, (t) => alPaso?.(t.paso, t.total ? t.hechos / t.total : null));
  return { ...r, ...res, local: leer().url + (res.local || r.local) };
}

/** Guarda una copia completa del proyecto en el servidor. */
export const guardarProyecto = (blob, nombre, alAvance) => subir("proyectos?" + new URLSearchParams({ nombre }), blob, alAvance);

/** Baja una copia guardada (para abrirla en el editor). */
export async function bajarProyecto(id) {
  const c = leer();
  const r = await fetch(c.url + "/api/proyectos/" + encodeURIComponent(id), { headers: { Authorization: "Bearer " + c.token }, cache: "no-store", credentials: "omit" });
  if (!r.ok) throw new Error(`El servidor contestó ${r.status}`);
  return r.blob();
}
