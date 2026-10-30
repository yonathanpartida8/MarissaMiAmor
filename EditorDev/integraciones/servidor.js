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

/** ¿Contesta de verdad ese servidor (y no se pasó a otro teléfono)? */
async function contesta(url) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 7000);
  try {
    const r = await fetch(url + "/api/salud", { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: c.signal });
    const d = await r.json();
    return d.ok && !d.relevado;
  } catch (e) { return false; } finally { clearTimeout(t); }
}

/**
 * Dónde dice el librito que está el servidor. La página (GitHub Pages) tarda minutos en rehacerse cuando
 * el túnel cambia o el servidor se pasa a otro teléfono; GitHub mismo lo sabe al momento (Fase 46).
 */
async function anuncios(conGithub) {
  const lista = [];
  const poner = (d, de) => { const url = limpiarUrl(d?.url); if (url && !bloqueada(url)) lista.push({ url, en: String(d.actualizado || ""), de }); };
  let pag = null;
  try {
    // «?t=» salta la caché de GitHub Pages (guarda hasta 10 min).
    const r = await fetch(new URL("../servidor.json?t=" + Math.floor(Date.now() / 15000), location.href), { cache: "no-store" });
    if (r.ok) poner((pag = await r.json()), "página");
  } catch (e) { /* sin anuncio en la página */ }
  if (conGithub && /^[\w.-]+\/[\w.-]+$/.test(pag?.repo || "") && pag?.rama) {
    try {
      const r = await fetch(`https://api.github.com/repos/${pag.repo}/contents/servidor.json?ref=${encodeURIComponent(pag.rama)}`,
        { headers: { Accept: "application/vnd.github.raw+json" }, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
      if (r.ok) poner(await r.json(), "github");
    } catch (e) { /* sin GitHub: queda lo de la página */ }
  }
  return lista.sort((a, b) => b.en.localeCompare(a.en));
}

let buscando = null, buscadoEn = 0;
/**
 * La dirección de M.YNTHN: la que el servidor anunció en servidor.json (o la última que funcionó).
 * Con «forzar» (algo no contestó) se busca en serio: la página y GitHub, y se queda la que SÍ contesta.
 */
export async function asegurarUrl(forzar = false) {
  if (!forzar && buscando && Date.now() - buscadoEn < 5 * 60 * 1000) return buscando;
  buscadoEn = Date.now();
  buscando = (async () => {
    const antes = leer().url || "";
    const lista = await anuncios(forzar);
    let url = lista[0]?.url || "";
    if (forzar) {
      const candidatas = [...new Set([...lista.map((a) => a.url), antes].filter(Boolean))];
      url = "";
      for (const u of candidatas) if (await contesta(u)) { url = u; break; }
    }
    if (url && url !== antes) guardar({ ...leer(), url });   // el túnel cambió: la sesión sigue valiendo
    return leer().url || "";
  })();
  return buscando;
}

const DORMIDO = `${NOMBRE} no contesta ahora mismo (el teléfono del servidor puede estar apagado o sin internet). Tus cosas siguen guardadas en este aparato; inténtalo en un ratito.`;

/**
 * Lo mismo pedido dos veces a la vez (dos pantallas que preguntan lo mismo) viaja UNA sola vez:
 * la segunda espera a la primera y recibe su propia copia de la respuesta. (Sólo para leer: GET.)
 */
const enVuelo = new Map();
function pedir(ruta, op = {}, otraVez = true) {
  if ((op.method || "GET") !== "GET") return pedirYa(ruta, op, otraVez);
  const k = ruta + "|" + (leer().token || "");
  const ya = enVuelo.get(k);
  if (ya) return ya.then((d) => (typeof structuredClone === "function" ? structuredClone(d) : JSON.parse(JSON.stringify(d))));
  const p = pedirYa(ruta, op, otraVez).finally(() => { if (enVuelo.get(k) === p) enVuelo.delete(k); });
  enVuelo.set(k, p);
  return p;
}

async function pedirYa(ruta, { method = "GET", body } = {}, otraVez = true) {
  const base = await asegurarUrl();
  if (!base) throw new Error(`${NOMBRE} no está disponible ahora mismo. Inténtalo en un ratito.`);
  if (bloqueada(base)) throw new Error(`${NOMBRE} no tiene una dirección segura (https) ahora mismo.`);
  const c = leer();
  let r;
  try {
    r = await fetch(base + "/api/" + ruta, {
      method, cache: "no-store", referrerPolicy: "no-referrer", credentials: "omit",
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(c.token ? { Authorization: "Bearer " + c.token } : {}) },
      // Un texto ya armado (un librito entero) va tal cual; lo demás, como JSON.
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
  } catch (e) {
    if (!navigator.onLine) throw new Error("Este aparato está sin internet.");
    // Quizá el túnel cambió de dirección (el teléfono se reinició): se busca la nueva y se vuelve a intentar UNA vez.
    const nueva = await asegurarUrl(true);
    if (otraVez && nueva && nueva !== base) return pedirYa(ruta, { method, body }, false);
    throw new Error(DORMIDO);
  }
  let d = {};
  try { d = await r.json(); } catch (e) { /* nada */ }
  if (r.status === 401 && ruta !== "entrar") olvidarSesion();
  if (!r.ok) { const err = new Error(d.error || `${NOMBRE} contestó ${r.status}`); err.status = r.status; err.datos = d; throw err; }
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

/** Manda algo con XHR (para ver el avance) y devuelve { status, datos } sin lanzar por 4xx/5xx. */
async function enviar(metodo, ruta, cuerpo, tipo, alAvance) {
  const base = await asegurarUrl();
  if (!base) throw new Error(DORMIDO);
  if (bloqueada(base)) throw new Error(`${NOMBRE} no tiene una dirección segura (https) ahora mismo.`);
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open(metodo, base + "/api/" + ruta);
    x.setRequestHeader("Authorization", "Bearer " + leer().token);
    x.setRequestHeader("Content-Type", tipo || "application/octet-stream");
    x.timeout = 10 * 60 * 1000;
    x.upload.onprogress = (e) => { if (e.lengthComputable) alAvance?.(e.loaded, e.total); };
    x.onload = () => {
      let d = {};
      try { d = JSON.parse(x.responseText || "{}"); } catch (e) { /* nada */ }
      if (x.status === 401) olvidarSesion();
      ok({ status: x.status, datos: d });
    };
    x.onerror = () => { asegurarUrl(true); mal(new Error(navigator.onLine ? DORMIDO : "Este aparato está sin internet.")); };
    x.ontimeout = () => mal(new Error(`${NOMBRE} tardó demasiado en contestar.`));
    x.send(cuerpo);
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
export async function publicar(blob, { titulo, nombre, paginas, reemplazar, exacto }, alPaso) {
  const q = new URLSearchParams({ titulo, nombre: nombre || "", paginas: String(paginas || 0) });
  if (reemplazar) q.set("reemplazar", reemplazar);
  if (exacto) q.set("exacto", "1");
  const r = await subir("publicaciones?" + q, blob, (p) => alPaso?.(`Subiendo a ${NOMBRE}… ${Math.round(p * 100)} %`, p));
  alPaso?.(`${NOMBRE} lo está guardando en GitHub…`);
  const res = await esperar(r.trabajo, (t) => alPaso?.(t.paso, t.total ? t.hechos / t.total : null));
  return { ...r, ...res, local: enlace(res.local || r.local) };
}
export const publicaciones = () => pedir("publicaciones").then((d) => d.publicaciones || []);
/** Fase 41: ¿ese enlace propio está libre? → { slug, libre, sugerido, enlace } */
export const enlaceLibre = (nombre) => pedir("publicaciones/disponible?nombre=" + encodeURIComponent(nombre || ""));
export const quitar = (slug) => pedir("publicaciones/" + encodeURIComponent(slug), { method: "DELETE" });
export const subirOtraVez = (slug) => pedir(`publicaciones/${encodeURIComponent(slug)}/subir`, { method: "POST", body: {} });

/* ── Copias de antes (un .zip por copia; las nuevas viven en la nube) ── */
export const proyectos = () => pedir("proyectos");
export const guardarProyecto = (blob, { nombre, proyecto }, alAvance) => subir("proyectos?" + new URLSearchParams({ nombre, proyecto: proyecto || "" }), blob, alAvance);
export const bajarProyecto = (id) => bajar("proyectos/" + encodeURIComponent(id));
export const borrarProyecto = (id) => pedir("proyectos/" + encodeURIComponent(id), { method: "DELETE" });

/* ── La nube: tus libritos, fotos, música, videos y ajustes (ver nube.js) ── */
const C = (clave) => "nube/libritos/" + encodeURIComponent(clave);
export const nube = () => pedir("nube");
export const nubeFaltan = (shas) => pedir("nube/faltan", { method: "POST", body: { shas } }).then((d) => d.faltan || []);
export const nubeParte = (sha, trozo, { desde, tam, tipo }, alAvance) => enviar("PUT", `nube/archivos/${sha}?` + new URLSearchParams({ desde: String(desde), tam: String(tam), tipo: tipo || "" }), trozo, "application/octet-stream", alAvance);
export const nubeArchivo = (sha) => bajar("nube/archivos/" + sha);
export const nubeLibrito = (clave) => pedir(C(clave));
export const nubeGuardar = (clave, texto, { base = 0, forzar = false, aparato = "" } = {}) => pedir(C(clave) + "?" + new URLSearchParams({ base: String(base || 0), aparato, ...(forzar ? { forzar: "1" } : {}) }), { method: "PUT", body: texto });
export const nubeBorrar = (clave) => pedir(C(clave), { method: "DELETE" });
export const nubeCopia = (clave) => pedir(C(clave) + "/copia", { method: "POST", body: {} });
export const nubeCopias = () => pedir("nube/copias");
export const nubeAbrirCopia = (id) => pedir("nube/copias/" + encodeURIComponent(id));
export const nubeBorrarCopia = (id) => pedir("nube/copias/" + encodeURIComponent(id), { method: "DELETE" });
export const misAjustes = () => pedir("yo/ajustes");
export const guardarMisAjustes = (ajustes, editado) => pedir("yo/ajustes", { method: "PUT", body: { ajustes, editado } });

/* ── Tu perfil: foto, nombre, cumpleaños y desde cuándo son novios ── */
export const perfil = () => pedir("yo/perfil");
export const guardarPerfil = (d) => pedir("yo/perfil", { method: "PUT", body: d });
export async function subirFoto(blob) {
  const r = await enviar("PUT", "yo/foto", blob, blob.type || "image/jpeg");
  if (r.status < 200 || r.status >= 300) throw Object.assign(new Error(r.datos?.error || `${NOMBRE} contestó ${r.status}`), { status: r.status });
  return r.datos;
}
export const quitarFoto = () => pedir("yo/foto", { method: "DELETE" });
export const miFoto = () => bajar("yo/foto");
export const fotoPareja = () => bajar("amor/foto");

/* ── Vincular a tu Amorcito y Detallitos ── */
export const amor = () => pedir("amor");
export const vincular = (codigo) => pedir("amor/vincular", { method: "POST", body: { codigo } });
export const desvincular = () => pedir("amor", { method: "DELETE" });
export const codigoNuevo = () => pedir("amor/codigo", { method: "POST", body: {} });
/** `ev`: el último aviso de lugares que ya viste (Fase 46: así llegan solos quién llegó o salió). */
export const latido = (ev) => pedir("latido" + (ev != null ? "?ev=" + encodeURIComponent(ev) : ""));
export const detallitos = () => pedir("detallitos");
export const mandarDetallito = (blob, { titulo, mensaje, color, tipo = "pagina" }, alAvance) => subir("detallitos?" + new URLSearchParams({ titulo, mensaje: mensaje || "", color: color || "", tipo }), blob, alAvance).then((d) => d.detallito);
export const visto = (id) => pedir(`detallitos/${encodeURIComponent(id)}/visto`, { method: "POST", body: {} });
export const paqueteDetallito = (id) => bajar(`detallitos/${encodeURIComponent(id)}/paquete`);
export const borrarDetallito = (id) => pedir("detallitos/" + encodeURIComponent(id), { method: "DELETE" });
/* Fase 22: reaccionar a una página de tu amorcito («» = quitarla), ver las suyas y la portadita al mandar. */
export const reaccionar = (id, reaccion) => pedir(`detallitos/${encodeURIComponent(id)}/reaccion`, { method: "PUT", body: { reaccion: reaccion || "" } });
export const reaccionesVistas = () => pedir("detallitos/reacciones/vistas", { method: "POST", body: {} });
/* Los mensajitos de los dos (Fase 30). */
export const chat = (p = {}) => pedir("chat?" + new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]))));
export const mandarMensaje = ({ texto = "", gif = null, audio = null, espacio = 0, responde = 0 }) => pedir("chat", { method: "POST", body: espacio ? { espacio } : { texto, gif, audio, ...(responde ? { responde } : {}) } }).then((d) => d.mensaje);
export const editarMensaje = (id, texto) => pedir("chat/" + encodeURIComponent(id), { method: "PUT", body: { texto } }).then((d) => d.mensaje);
/* Fase 34: stickers hechos por ustedes y mensajes de voz (se suben tal cual) y su colección. */
export async function subirMedia(blob, tipo) {
  const r = await enviar("POST", "chat/media?tipo=" + tipo, blob, blob.type || "application/octet-stream");
  if (r.status < 200 || r.status >= 300) throw Object.assign(new Error(r.datos?.error || `${NOMBRE} contestó ${r.status}`), { status: r.status });
  return r.datos;
}
export const coleccion = () => pedir("chat/coleccion");
export const ponerEnColeccion = (d) => pedir("chat/coleccion", { method: "POST", body: d }).then((r) => r.item);
export const favoritoColeccion = (id, favorito) => pedir("chat/coleccion/" + encodeURIComponent(id), { method: "PUT", body: { favorito } }).then((r) => r.item);
export const quitarDeColeccion = (id) => pedir("chat/coleccion/" + encodeURIComponent(id), { method: "DELETE" });
/** Lo del chat que vive en el servidor (/m/…) se pide con su dirección completa; lo de GIPHY, tal cual. */
export const media = (u) => (u && u.startsWith("/m/") ? enlace(u) : u);
export const reaccionarMensaje = (id, reaccion) => pedir(`chat/${encodeURIComponent(id)}/reaccion`, { method: "PUT", body: { reaccion: reaccion || "" } }).then((d) => d.mensaje);
export const pegarSticker = (id, st) => pedir(`chat/${encodeURIComponent(id)}/sticker`, { method: "POST", body: st }).then((d) => d.mensaje);
export const borrarMensaje = (id) => pedir("chat/" + encodeURIComponent(id), { method: "DELETE" });
export const chatVistos = () => pedir("chat/vistos", { method: "POST", body: {} });
export const chatAjustes = (aj) => pedir("chat/ajustes", { method: "PUT", body: aj });
export const moverSticker = (id, sid, d) => pedir(`chat/${encodeURIComponent(id)}/sticker/${encodeURIComponent(sid)}`, { method: "PUT", body: d }).then((r) => r.mensaje);
export const quitarSticker = (id, sid) => pedir(`chat/${encodeURIComponent(id)}/sticker/${encodeURIComponent(sid)}`, { method: "DELETE" }).then((r) => r.mensaje);
export const trazoNuevo = (d) => pedir("chat/trazos", { method: "POST", body: d });
export const trazoMas = (id, d) => pedir("chat/trazos/" + encodeURIComponent(id), { method: "POST", body: d });
export const trazoBorrar = (id) => pedir("chat/trazos/" + encodeURIComponent(id), { method: "DELETE" });
export const trazosBorrar = () => pedir("chat/trazos", { method: "DELETE" });
/* Notificaciones push (Fase 33). */
export const pushClave = () => pedir("push/clave");
export const pushSuscribir = (sub) => pedir("push/suscribir", { method: "POST", body: sub });
export const pushQuitar = (endpoint) => pedir("push/suscribir", { method: "DELETE", body: { endpoint } });
export const pushProbar = () => pedir("push/probar", { method: "POST", body: {} });
export async function subirPortadita(id, blob) {
  const r = await enviar("PUT", `detallitos/${encodeURIComponent(id)}/portadita`, blob, blob.type || "image/jpeg");
  if (r.status < 200 || r.status >= 300) throw Object.assign(new Error(r.datos?.error || `${NOMBRE} contestó ${r.status}`), { status: r.status });
  return r.datos;
}

/* Fase 38: las páginas de cada mes, Cositas Juntitos y la ubicación compartida. */
/** El día de este aparato (no el del servidor): así «hoy» y los meses cumplidos son los tuyos. */
export const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const mesecitos = () => pedir("mesecitos?hoy=" + hoyLocal());
export const ponerMesecito = (mes, d) => pedir(`mesecitos/${mes}?hoy=${hoyLocal()}`, { method: "PUT", body: d }).then((r) => r.pagina);
export const borrarMesecito = (mes) => pedir(`mesecitos/${mes}`, { method: "DELETE" });
export const mesecitoVisto = (mes) => pedir(`mesecitos/${mes}/visto`, { method: "POST", body: {} });
export const cositas = () => pedir("cositas?hoy=" + hoyLocal());
// Nuestra casita (Fase 52): la casa compartida y los dos monitos (con `v` y `espera`, contesta cuando algo cambia).
export const casita = (v = -1, espera = 0) => pedir(`casita?v=${v}&espera=${espera}`);
export const ponerMonito = (d) => pedir("casita/yo", { method: "PUT", body: d }).then((r) => r.yo);
export const ponerCasa = (casa) => pedir("casita/casa", { method: "PUT", body: { casa } });
export const cosita = (tipo, extra = {}) => pedir("cositas", { method: "POST", body: { tipo, dia: hoyLocal(), ...extra } });
export const borrarCosita = (id) => pedir("cositas/" + encodeURIComponent(id), { method: "DELETE" });
export const compartirCosita = (id, compartida) => pedir("cositas/" + encodeURIComponent(id), { method: "PUT", body: { compartida } });
export const ajusteCosita = (tipo, compartir) => pedir("cositas/ajustes", { method: "PUT", body: { tipo, compartir } });
export const ubicacion = () => pedir("ubicacion");
export const ponerUbicacion = (d) => pedir("ubicacion", { method: "PUT", body: d });
export const dejarUbicacion = () => pedir("ubicacion", { method: "DELETE" });
export const nuevoLugar = (d) => pedir("lugares", { method: "POST", body: d }).then((r) => r.lugar);
export const editarLugar = (id, d) => pedir("lugares/" + encodeURIComponent(id), { method: "PUT", body: d }).then((r) => r.lugar);
export const borrarLugar = (id) => pedir("lugares/" + encodeURIComponent(id), { method: "DELETE" });
/* Fase 46: mensajitos rápidos del mapa y las cosas de los dos en Mesecitos (cápsula, momento, planes). */
export const mandarToque = (tipo, texto = "") => pedir("toques", { method: "POST", body: { tipo, texto } }).then((r) => r.toque);
export const toques = () => pedir("toques").then((r) => r.toques);
export const toquesVistos = (hasta) => pedir("toques/visto", { method: "POST", body: { hasta } });
const conHoy = (r) => `${r}?hoy=${hoyLocal()}`;
export const ponerCapsula = (mes, texto) => pedir(conHoy(`mesecitos/${mes}/capsula`), { method: "PUT", body: { texto } });
export const borrarCapsula = (mes) => pedir(conHoy(`mesecitos/${mes}/capsula`), { method: "DELETE" });
export const ponerMomento = (mes, d) => pedir(conHoy(`mesecitos/${mes}/momento`), { method: "PUT", body: d });
export const nuevoPlan = (mes, texto) => pedir(conHoy(`mesecitos/${mes}/plan`), { method: "POST", body: { texto } });
export const palomearPlan = (id, hecho) => pedir(conHoy(`mesecitos/plan/${encodeURIComponent(id)}`), { method: "PUT", body: { hecho } });
export const borrarPlan = (id) => pedir(conHoy(`mesecitos/plan/${encodeURIComponent(id)}`), { method: "DELETE" });
/* Fase 40: Dibujar Juntos (hojas de los dos, en tiempo real). */
export const lienzos = () => pedir("dibujo");
export const nuevoLienzo = (d = {}) => pedir("dibujo", { method: "POST", body: d }).then((r) => r.lienzo);
export const editarLienzo = (id, d) => pedir("dibujo/" + encodeURIComponent(id), { method: "PUT", body: d }).then((r) => r.lienzo);
export const borrarLienzo = (id) => pedir("dibujo/" + encodeURIComponent(id), { method: "DELETE" });
export const dibujo = (id, desde = 0, espera = 0) => pedir(`dibujo/${encodeURIComponent(id)}/trazos?desde=${desde}&espera=${espera}`);
export const dibujoTrazo = (id, d) => pedir(`dibujo/${encodeURIComponent(id)}/trazos`, { method: "POST", body: d }).then((r) => r.trazo);
export const dibujoMas = (id, tid, d) => pedir(`dibujo/${encodeURIComponent(id)}/trazos/${encodeURIComponent(tid)}`, { method: "POST", body: d });
export const dibujoDeshacer = (id, tid) => pedir(`dibujo/${encodeURIComponent(id)}/trazos/${encodeURIComponent(tid)}`, { method: "DELETE" });
export const dibujoLimpiar = (id, soloMio = false) => pedir(`dibujo/${encodeURIComponent(id)}/trazos${soloMio ? "?solo=mio" : ""}`, { method: "DELETE" });

