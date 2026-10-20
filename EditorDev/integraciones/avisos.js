/**
 * NOTIFICACIONES PUSH (Fase 33) — que M.YNTHN te avise aunque el editor esté cerrado.
 *
 *   Android y compu   en Chrome, Edge, Firefox o Samsung Internet, directo
 *   iPhone / iPad     iOS 16.4 o más nuevo, con el editor agregado a la pantalla de inicio
 *                     (Compartir → Agregar a inicio) y abierto desde ese ícono
 *
 * El teléfono se suscribe con la llave pública (VAPID) de tu servidor; el servidor guarda esa
 * suscripción y, cuando tu amorcito te escribe, te manda una página o reacciona, manda el aviso
 * cifrado sólo para este aparato. El ayudante de fondo (sw.js) lo muestra con el ícono de la app
 * y el sonido de notificaciones del teléfono.
 */
import * as SRV from "./servidor.js";

const CLAVE = "editordev:push-clave";
const leer = () => { try { return localStorage.getItem(CLAVE) || ""; } catch (e) { return ""; } };
const poner = (v) => { try { localStorage.setItem(CLAVE, v); } catch (e) { /* nada */ } };

export const soportado = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && isSecureContext;
export const esIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalada = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

let reg = null;
/** El ayudante de fondo (sw.js): se registra al abrir el editor. */
export async function registrar() {
  if (!("serviceWorker" in navigator) || !isSecureContext) return null;
  try { reg = await navigator.serviceWorker.register("sw.js", { scope: "./" }); } catch (e) { reg = null; }
  return reg;
}
async function suscripcion() {
  const r = reg || (await navigator.serviceWorker.getRegistration("./").catch(() => null));
  return r ? r.pushManager.getSubscription().catch(() => null) : null;
}
/** Cómo está en este aparato. */
export async function estado() {
  if (!soportado()) return { soportado: false, necesitaInstalar: esIOS() && !instalada() };
  const sub = await suscripcion();
  return { soportado: true, permiso: Notification.permission, prendidas: !!sub && Notification.permission === "granted" };
}
const aBytes = (t) => Uint8Array.from(atob((t + "=".repeat((4 - (t.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const aparato = () => (esIOS() ? "iPhone" : /Android/i.test(navigator.userAgent) ? "Android" : "Compu") + (instalada() ? " · app" : "");
const mandarla = (sub) => SRV.pushSuscribir({ ...sub.toJSON(), origen: location.origin, aparato: aparato() });

/** Prenderlas. Hay que llamarla desde un toque (el iPhone sólo pregunta así). */
export async function prender() {
  if (!soportado()) throw new Error(esIOS() && !instalada() ? "En iPhone, primero agrega el editor a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrelo desde ese ícono." : "Este navegador no puede recibir notificaciones.");
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") throw new Error(permiso === "denied" ? "Las notificaciones están bloqueadas para el editor: permítelas en los ajustes del navegador (o del teléfono)." : "No diste permiso para las notificaciones.");
  const r = reg || (await registrar());
  if (!r) throw new Error("Este navegador no dejó preparar las notificaciones.");
  await navigator.serviceWorker.ready;
  const { clave } = await SRV.pushClave();
  let sub = await r.pushManager.getSubscription();
  // Si el servidor cambió de llave (se reinstaló), la suscripción vieja ya no sirve: se hace otra.
  if (sub && leer() && leer() !== clave) { await sub.unsubscribe().catch(() => {}); sub = null; }
  sub ||= await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) });
  poner(clave);
  await mandarla(sub);
  return true;
}

/** Apagarlas en este aparato. */
export async function apagar() {
  const sub = await suscripcion();
  if (!sub) return;
  await SRV.pushQuitar(sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

/** Al abrir el editor con tu cuenta: si ya estaban prendidas, el servidor se pone al día (por si cambió algo). */
export async function alDia() {
  if (!soportado() || Notification.permission !== "granted" || !SRV.conectado()) return;
  const sub = await suscripcion();
  if (!sub) return;
  try {
    const { clave } = await SRV.pushClave();
    if (leer() && leer() !== clave) await prender();
    else { poner(clave); await mandarla(sub); }
  } catch (e) { /* sin conexión: la próxima */ }
}

export const probar = () => SRV.pushProbar();

/** El numerito del ícono de la app (lo que no has visto). */
export function insignia(n) {
  try { if (n > 0) navigator.setAppBadge?.(n); else navigator.clearAppBadge?.(); } catch (e) { /* nada */ }
}
