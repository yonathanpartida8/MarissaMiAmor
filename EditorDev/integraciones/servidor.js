/**
 * M.YNTHN — el servidor del librito (servidor/ en el repositorio, corriendo en
 * un teléfono con Termux). Es el mismo para TODOS: cada quien entra sólo con su
 * usuario y su contraseña, y desde ahí publica, guarda copias de sus proyectos
 * y se manda Detallitos con su amorcito.
 *
 * En el editor no hay ninguna llave ni hay que poner direcciones:
 *   · La dirección del servidor se encuentra sola: el servidor la anuncia en
 *     servidor.json, junto al librito, cada vez que cambia su túnel.
 *     (Para probar, también llega en un enlace …/EditorDev/#servidor=https://…)
 *   · La sesión de tu cuenta va en «Authorization: Bearer …». Con «recordarme»
 *     se queda en este aparato; sin él, se olvida al cerrar.
 *   · El token de GitHub vive cifrado en el servidor. Nunca llega aquí.
 */
export const NOMBRE = "M.YNTHN";
export const CARPETA = "publicaciones";
const CLAVE = "editordev:servidor";

export const nombreLimpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

export function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || sessionStorage.getItem(CLAVE) || "null") || {}; } catch (e) { return {}; }
}
function guardar(c, recordar = leer()._recordar !== false) {
  const s = JSON.stringify({ ...c, _recordar: recordar });
  try {
    (recordar ? localStorage : sessionStorage).setItem(CLAVE, s);
    (recordar ? sessionStorage : localStorage).removeItem(CLAVE);
  } catch (e) { /* nada */ }
}
const avisarCambio = () => dispatchEvent(new CustomEvent("ed-cuenta"));
export function olvidarSesion() { const c = leer(); if (!c.token) return; delete c.token; delete c.usuario; guardar(c); avisarCambio(); }

/** ¿Hay sesión? (sin preguntarle al servidor). */
export const conectado = () => !!leer().token;
export const usuario = () => leer().usuario || null;

export function limpiarUrl(u) {
  u = String(u || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { return new URL(u).origin; } catch (e) { return ""; }
}
function bloqueada(url) {
  try {
    const u = new URL(url);
    return location.protocol === "https:" && u.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch (e) { return true; }
}

/** Un enlace …#servidor=… (para probar): se guarda la dirección y se limpia la barra. */
export function revisarEnlace() {
  const m = /[#&]servidor=([^&]+)/.exec(location.hash || "");
  if (!m) return "";
  const url = limpiarUrl(decodeURIComponent(m[1]));
  try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) { /* nada */ }
  if (url) guardar({ ...leer(), url });
  return url;
}

let buscando = null, buscadoEn = 0;
/** La dirección de M.YNTHN: la que el servidor anunció en servidor.json (o la última que funcionó). */
export async function asegurarUrl(forzar = false) {
  if (!forzar && buscando && Date.now() - buscadoEn < 5 * 60 * 1000) return buscando;
  buscadoEn = Date.now();
  buscando = (async () => {
    try {
      // «?t=» salta la caché de GitHub Pages (guarda hasta 10 min): si el túnel cambió, se sabe ya.
      const r = await fetch(new URL("../servidor.json?t=" + Math.floor(Date.now() / 15000), location.href), { cache: "no-store" });
      if (r.ok) {
        const url = limpiarUrl((await r.json()).url);
        if (url && url !== leer().url) guardar({ ...leer(), url });   // el túnel cambió: la sesión sigue valiendo
      }
    } catch (e) { /* sin anuncio: se usa la que había */ }
    return leer().url || "";
  })();
  return buscando;
}

const DORMIDO = `${NOMBRE} no contesta ahora mismo (el teléfono del servidor puede estar apagado o sin internet). Tus cosas siguen guardadas en este aparato; inténtalo en un ratito.`;

async function pedir(ruta, { method = "GET", body } = {}, otraVez = true) {
  const base = await asegurarUrl();
  if (!base) throw new Error(`${NOMBRE} no está disponible ahora mismo. Inténtalo en un ratito.`);
  if (bloqueada(base)) throw new Error(`${NOMBRE} no tiene una dirección segura (https) ahora mismo.`);
  const c = leer();
  let r;
  try {
    r = await fetch(base + "/api/" + ruta, {
      method, cache: "no-store", referrerPolicy: "no-referrer", credentials: "omit",
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(c.token ? { Authorization: "Bearer " + c.token } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (!navigator.onLine) throw new Error("Este aparato está sin internet.");
    // Quizá el túnel cambió de dirección (el teléfono se reinició): se busca la nueva y se vuelve a intentar UNA vez.
    const nueva = await asegurarUrl(true);
    if (otraVez && nueva && nueva !== base) return pedir(ruta, { method, body }, false);
    throw new Error(DORMIDO);
  }
  let d = {};
  try { d = await r.json(); } catch (e) { /* nada */ }
  if (r.status === 401 && ruta !== "entrar") olvidarSesion();
  if (!r.ok) { const err = new Error(d.error || `${NOMBRE} contestó ${r.status}`); err.status = r.status; throw err; }
  return d;
}

/** Sube un .zip con avance (XHR: fetch no cuenta lo que sube). */
async function subir(ruta, blob, alAvance) {
  const base = await asegurarUrl();
  if (!base) throw new Error(`${NOMBRE} no está disponible ahora mismo.`);
  const c = leer();
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("POST", base + "/api/" + ruta);
    x.setRequestHeader("Authorization", "Bearer " + c.token);
    x.setRequestHeader("Content-Type", "application/zip");
    x.timeout = 30 * 60 * 1000;
    x.upload.onprogress = (e) => { if (e.lengthComputable) alAvance?.(e.loaded / e.total); };
    x.onload = () => {
      let d = {};
      try { d = JSON.parse(x.responseText || "{}"); } catch (e) { /* nada */ }
      if (x.status === 401) olvidarSesion();
      if (x.status >= 200 && x.status < 300) ok(d);
      else mal(Object.assign(new Error(d.error || `${NOMBRE} contestó ${x.status}`), { status: x.status }));
    };
    x.onerror = () => { asegurarUrl(true); mal(new Error(navigator.onLine ? `Se cortó la conexión con ${NOMBRE} mientras subía. Inténtalo otra vez.` : "Este aparato se quedó sin internet mientras subía.")); };
    x.ontimeout = () => mal(new Error("Tardó demasiado en subir."));
    x.send(blob);
  });
}

async function bajar(ruta) {
  const base = await asegurarUrl();
  if (!base) throw new Error(DORMIDO);
  let r;
  try { r = await fetch(base + "/api/" + ruta, { headers: { Authorization: "Bearer " + leer().token }, cache: "no-store", credentials: "omit" }); }
  catch (e) { asegurarUrl(true); throw new Error(DORMIDO); }
  if (r.status === 401) olvidarSesion();
  if (!r.ok) throw new Error(`${NOMBRE} contestó ${r.status}`);
  return r.blob();
}

/** La dirección completa de algo del servidor (/p/…, /d/…). */
export const enlace = (ruta) => (leer().url || "") + ruta;

/* ── Cuenta ── */
export const info = () => pedir("info");
export async function entrar(usuario, contrasena, recordar = true) {
  const d = await pedir("entrar", { method: "POST", body: { usuario, contrasena, cliente: "editor", recordar } });
  guardar({ ...leer(), token: d.token, usuario: d.usuario }, recordar);
  avisarCambio();
  return d.usuario;
}
export async function registrar(usuario, contrasena, codigo = "", recordar = true) {
  const d = await pedir("registro", { method: "POST", body: { usuario, contrasena, codigo, cliente: "editor", recordar } });
  if (d.token) { guardar({ ...leer(), token: d.token, usuario: d.usuario }, recordar); avisarCambio(); }
  return d;
}
export async function salir() { try { await pedir("salir", { method: "POST", body: {} }); } catch (e) { /* nada */ } olvidarSesion(); }

/* ── Publicar ── */
export const trabajo = (id) => pedir("trabajos/" + encodeURIComponent(id));
export async function esperar(id, alPaso) {
  for (let i = 0; i < 1800; i++) {
    const t = await trabajo(id);
    alPaso?.(t);
    if (t.estado === "listo") return t.resultado || {};
    if (t.estado === "error") throw new Error(t.error || "No se pudo.");
    await new Promise((r) => setTimeout(r, i < 10 ? 600 : 1500));
  }
  throw new Error(`${NOMBRE} sigue trabajando; vuelve a mirar en un ratito.`);
}
export async function publicar(blob, { titulo, nombre, paginas, reemplazar }, alPaso) {
  const q = new URLSearchParams({ titulo, nombre: nombre || "", paginas: String(paginas || 0) });
  if (reemplazar) q.set("reemplazar", reemplazar);
  const r = await subir("publicaciones?" + q, blob, (p) => alPaso?.(`Subiendo a ${NOMBRE}… ${Math.round(p * 100)} %`, p));
  alPaso?.(`${NOMBRE} lo está guardando en GitHub…`);
  const res = await esperar(r.trabajo, (t) => alPaso?.(t.paso, t.total ? t.hechos / t.total : null));
  return { ...r, ...res, local: enlace(res.local || r.local) };
}
export const publicaciones = () => pedir("publicaciones").then((d) => d.publicaciones || []);
export const quitar = (slug) => pedir("publicaciones/" + encodeURIComponent(slug), { method: "DELETE" });
export const subirOtraVez = (slug) => pedir(`publicaciones/${encodeURIComponent(slug)}/subir`, { method: "POST", body: {} });

/* ── Copias de los proyectos (una carpeta por proyecto, una copia por cada vez que guardas a mano) ── */
export const proyectos = () => pedir("proyectos");
export const guardarProyecto = (blob, { nombre, proyecto }, alAvance) => subir("proyectos?" + new URLSearchParams({ nombre, proyecto: proyecto || "" }), blob, alAvance);
export const bajarProyecto = (id) => bajar("proyectos/" + encodeURIComponent(id));
export const borrarProyecto = (id) => pedir("proyectos/" + encodeURIComponent(id), { method: "DELETE" });

/* ── Vincular a tu Amorcito y Detallitos ── */
export const amor = () => pedir("amor");
export const vincular = (codigo) => pedir("amor/vincular", { method: "POST", body: { codigo } });
export const desvincular = () => pedir("amor", { method: "DELETE" });
export const codigoNuevo = () => pedir("amor/codigo", { method: "POST", body: {} });
export const latido = () => pedir("latido");
export const detallitos = () => pedir("detallitos");
export const mandarDetallito = (blob, { titulo, mensaje, color }, alAvance) => subir("detallitos?" + new URLSearchParams({ titulo, mensaje: mensaje || "", color: color || "" }), blob, alAvance).then((d) => d.detallito);
export const visto = (id) => pedir(`detallitos/${encodeURIComponent(id)}/visto`, { method: "POST", body: {} });
export const paqueteDetallito = (id) => bajar(`detallitos/${encodeURIComponent(id)}/paquete`);
export const borrarDetallito = (id) => pedir("detallitos/" + encodeURIComponent(id), { method: "DELETE" });
