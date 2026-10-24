/**
 * EL AYUDANTE DE FONDO (service worker) — sólo para las notificaciones push (Fase 33).
 *
 * Vive aunque el editor esté cerrado: cuando el servidor (M.YNTHN, en Termux) manda un aviso
 * cifrado, el navegador lo descifra y aquí se muestra con el ícono de la app, el sonido de
 * notificación del teléfono y una vibración; tocarlo abre el editor justo en el chat o en
 * Detallitos. No guarda nada en caché ni toca la página.
 */
const ICONO = "iconos/icono-192.png";
const INSIGNIA = "iconos/insignia-96.png";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : "" }; }
  const avisos = [self.registration.showNotification(d.t || "M.YNTHN 💗", {
    body: d.b || "", icon: ICONO, badge: INSIGNIA, tag: d.tag || "librito", renotify: true, silent: false,
    vibrate: [90, 50, 140], timestamp: Date.now(), lang: "es", data: { u: d.u || "" },
  })];
  // El numerito en el ícono de la app (Android y iPhone con la app en la pantalla de inicio).
  if (d.n && self.navigator.setAppBadge) avisos.push(self.navigator.setAppBadge(d.n).catch(() => {}));
  e.waitUntil(Promise.all(avisos));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const u = e.notification.data?.u || "";
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const abierta = ventanas.find((c) => c.url.startsWith(self.registration.scope));
    if (abierta) { await abierta.focus().catch(() => {}); abierta.postMessage({ tipo: "aviso-abrir", u }); return; }
    await self.clients.openWindow(new URL("index.html" + u, self.registration.scope).href);
  })());
});
