/**
 * PLATAFORMA (Fase 46) — lo que depende del aparato, en un solo lugar.
 *
 * Hoy la app es una página web (en el navegador o dentro del APK, que es una vista web). Mañana será una
 * app nativa de Android: cuando llegue, sólo este archivo aprende a hablar con ella y el resto de la app
 * sigue igual. Por eso lo del aparato (vibrar, ubicación, notificaciones, guardar archivos, compartir)
 * se pide AQUÍ y no directo al navegador.
 *
 *   donde()          "web" · "apk" (la vista web del APK de hoy) · "nativa" (la app de mañana)
 *   puede(algo)      ¿este aparato puede? ("vibrar", "ubicacion", "ubicacion-fondo", "push", "compartir")
 *   vibrar(ms)       una vibracioncita (si el aparato puede)
 *   compartir(d)     el menú de compartir del teléfono ({ title, text, url }); false si no hay
 *
 * El puente nativo (cuando exista) se llamará `window.MyLovePagesNativa` y dirá qué sabe hacer con
 * `capacidades()`; mientras no exista, todo funciona como siempre en la web. Ver android/NATIVA.md.
 */
const nativa = () => (typeof window !== "undefined" && window.MyLovePagesNativa) || null;
const enApk = () => typeof navigator !== "undefined" && / LibritoApp\/\d/.test(navigator.userAgent || "");

export function donde() {
  if (nativa()) return "nativa";
  return enApk() ? "apk" : "web";
}

let capNativas = null;
function caps() {
  if (capNativas) return capNativas;
  try { capNativas = new Set(JSON.parse(nativa()?.capacidades?.() || "[]")); } catch (e) { capNativas = new Set(); }
  return capNativas;
}

export function puede(algo) {
  if (nativa() && caps().has(algo)) return true;
  switch (algo) {
    case "vibrar": return typeof navigator !== "undefined" && "vibrate" in navigator;
    case "ubicacion": return typeof navigator !== "undefined" && "geolocation" in navigator && window.isSecureContext !== false;
    case "ubicacion-fondo": return false;   // la web (y la vista web) no pueden seguirte con la app cerrada
    case "push": return typeof window !== "undefined" && "PushManager" in window && "serviceWorker" in navigator && donde() !== "apk";
    case "compartir": return typeof navigator !== "undefined" && typeof navigator.share === "function";
    default: return false;
  }
}

export function vibrar(ms = 8) {
  const n = nativa();
  if (n?.vibrar && caps().has("vibrar")) { try { n.vibrar(ms); return; } catch (e) { /* sigue con la web */ } }
  try { navigator.vibrate?.(ms); } catch (e) { /* nada */ }
}

export async function compartir(d) {
  const n = nativa();
  if (n?.compartir && caps().has("compartir")) { try { n.compartir(JSON.stringify(d)); return true; } catch (e) { /* sigue con la web */ } }
  if (!puede("compartir")) return false;
  try { await navigator.share(d); return true; } catch (e) { return false; }
}
