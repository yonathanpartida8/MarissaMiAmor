/**
 * UBICACIÓN COMPARTIDA (Fase 38) — la de verdad (GPS / servicios de ubicación del aparato), nunca a escondidas.
 *
 *   · Sólo se comparte si TÚ tocas «Compartir mi ubicación» (y el navegador pide su permiso). Se guarda
 *     esa decisión en este aparato; «Dejar de compartir» la apaga y borra tu ubicación del servidor.
 *   · Mientras la app está a la vista se mira la posición con poca exigencia (sin GPS de alta precisión
 *     salvo que haga falta) y se manda sólo si te moviste 25 m o pasaron 2 minutos: cuida la pila.
 *     Con la app oculta o cerrada NO se manda nada (la web no puede; ver LÉEME: app nativa).
 *   · Los lugares (casa, escuela…) los revisa el servidor con cada posición que llega: si entras o sales,
 *     avisa (notificación) a quien elegiste. Por lo mismo, sólo funciona mientras la app está abierta.
 *   · El mapa usa Leaflet y los mapas de OpenStreetMap; se cargan sólo al abrir el mapa.
 */
import * as SRV from "../integraciones/servidor.js";
import { cuandoVisible } from "./rendimiento.js";

const CLAVE = () => `editordev:ubicacion:${SRV.usuario()?.usuario || ""}`;
const MIN_METROS = 25, MIN_MS = 120000;
export const puede = () => "geolocation" in navigator && window.isSecureContext !== false;

let mira = null, ultimo = null, ultimoEnvio = 0, estado = { compartiendo: false, error: "", enviado: null };
const oyentes = new Set();
const avisar = () => { for (const f of oyentes) { try { f(estado); } catch (e) { console.warn(e); } } };
export const alCambiar = (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); };
export const estadoUbicacion = () => estado;

const metros = (a, b) => {
  const r = Math.PI / 180, x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
};
const decidido = () => { try { return localStorage.getItem(CLAVE()) === "si"; } catch (e) { return false; } };
const decidir = (si) => { try { if (si) localStorage.setItem(CLAVE(), "si"); else localStorage.removeItem(CLAVE()); } catch (e) { /* nada */ } };

const ERRORES = { 1: "No diste permiso de ubicación (actívalo en los ajustes del navegador).", 2: "Este aparato no pudo saber dónde estás ahora.", 3: "La ubicación tardó demasiado; se vuelve a intentar." };

async function mandar(p, forzar = false) {
  const pos = { lat: p.coords.latitude, lng: p.coords.longitude, prec: Math.round(p.coords.accuracy || 0) };
  const t = Date.now();
  if (!forzar && ultimo && metros(ultimo, pos) < MIN_METROS && t - ultimoEnvio < MIN_MS) return;
  ultimo = pos; ultimoEnvio = t;
  try { const r = await SRV.ponerUbicacion(pos); estado = { ...estado, error: "", enviado: r.yo }; }
  catch (e) { estado = { ...estado, error: e.message || "Sin conexión con el servidor." }; }
  avisar();
}

function mirar() {
  if (mira != null || !estado.compartiendo || document.hidden || !puede()) return;
  mira = navigator.geolocation.watchPosition((p) => mandar(p), (e) => { estado = { ...estado, error: ERRORES[e.code] || e.message }; avisar(); if (e.code === 1) dejar(); },
    { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
}
function noMirar() { if (mira != null) { navigator.geolocation.clearWatch(mira); mira = null; } }

/** Empezar a compartir (sólo por decisión tuya: se llama desde el botón). */
export function compartir() {
  return new Promise((ok) => {
    if (!puede()) { estado = { ...estado, error: "Este navegador no da la ubicación (hace falta https)." }; avisar(); ok(false); return; }
    navigator.geolocation.getCurrentPosition(async (p) => {
      decidir(true);
      estado = { compartiendo: true, error: "", enviado: null };
      await mandar(p, true);
      mirar();
      ok(true);
    }, (e) => { estado = { ...estado, compartiendo: false, error: ERRORES[e.code] || e.message }; avisar(); ok(false); }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
  });
}

/** Dejar de compartir: se apaga aquí y se borra del servidor. */
export async function dejar() {
  decidir(false);
  noMirar();
  ultimo = null;
  estado = { compartiendo: false, error: estado.error, enviado: null };
  avisar();
  try { await SRV.dejarUbicacion(); } catch (e) { /* sin conexión: el servidor la olvida igual en cuanto se pueda */ }
}

/** Al abrir la app (con tu decisión ya tomada): sigue compartiendo mientras se vea. */
export function iniciar() {
  if (!SRV.conectado() || !decidido()) return;
  estado = { ...estado, compartiendo: true };
  mirar();
  avisar();
}
document.addEventListener("visibilitychange", async () => {
  if (document.hidden) { noMirar(); return; }
  await cuandoVisible();
  mirar();
});
addEventListener("ed-cuenta", () => { noMirar(); estado = { compartiendo: false, error: "", enviado: null }; setTimeout(iniciar, 500); });

/* ── El mapa (Leaflet + OpenStreetMap), cargado sólo cuando se abre ── */
let cargando = null;
export function cargarMapa() {
  if (window.L?.map) return Promise.resolve(window.L);
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.async = true;
    s.onload = () => (window.L?.map ? ok(window.L) : mal(new Error("No cargó el mapa.")));
    s.onerror = () => { cargando = null; mal(new Error("No se pudo cargar el mapa (¿sin internet?).")); };
    document.head.append(s);
  });
  return cargando;
}
