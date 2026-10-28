/**
 * ARRASTRAR COSITAS (Fase 46) — del cajón de recursos a la hoja.
 *
 *   · Cualquier cosita del cajón (piezas, adornos, dibujos, textos, tus fotos, stickers, GIFs, componentes
 *     y bloques) se puede arrastrar y soltar donde quieras en la hoja. Tocarla sigue siendo lo de siempre.
 *   · Con el ratón empieza al moverla; con el dedo, al mantenerla un ratito (así no choca con deslizar la
 *     lista) o al jalarla de lado, hacia la hoja.
 *   · Al empezar, el cajón se esconde (en el teléfono y la tableta tapa la hoja) para que veas dónde va;
 *     al soltarla, la cosita queda justo ahí, elegida, y el cajón vuelve a abrirse solo.
 *   · Por dentro: al soltar se hace lo MISMO que al tocarla (así funciona igual con todo lo que ya existe)
 *     y lo que nació se mueve a donde la soltaste; todo junto es un solo «deshacer».
 */
import { vibrar } from "../config/preferencias.js";

const COSITA = ":is(.ed-pieza, button.ed-asset, .ed-dibujos > button, .ed-texto-muestra, button.ed-gif, button.ed-comp, button.ed-bq-t)";
const ESPERA_DEDO = 320;   // ms manteniendo el dedo para levantarla
const UMBRAL = 7;          // px de movimiento para empezar (ratón) o para cancelar la espera (dedo)

export function arrastrarCositas(app) {
  let p = null;   // { b, id, x0, y0, t, tipo, arrastrando, fantasma, reabrir }
  let bloqueoClic = 0;

  const enHoja = (x, y) => {
    const h = app.lienzo?.hoja;
    if (!h || !app.estado.pagina) return null;
    const r = h.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const L = app.lienzo;
    return { x: ((x - r.left) / r.width) * L.W, y: ((y - r.top) / r.height) * L.H };
  };

  function empezar() {
    if (!p || p.arrastrando) return;
    p.arrastrando = true;
    clearTimeout(p.t);
    if (app.lateral) app.lateral._g = null;   // el cajón no la toma como «jalar para cerrar»
    vibrar(10);
    app.sonidos?.sonar("seleccionar");
    // La copia que sigue al dedo (con su dibujito).
    const r = p.b.getBoundingClientRect();
    const f = p.b.cloneNode(true);
    f.removeAttribute("id");
    f.classList.add("ed-cosita-vuela");
    const lado = Math.min(84, Math.max(48, Math.max(r.width, r.height)));
    f.style.cssText = `width:${Math.min(r.width, 140)}px;height:${Math.min(r.height, lado)}px;left:0;top:0;transform:translate(${p.x0 - Math.min(r.width, 140) / 2}px,${p.y0 - Math.min(r.height, lado) / 2}px)`;
    document.body.append(f);
    p.fantasma = f;
    p.mitad = [Math.min(r.width, 140) / 2, Math.min(r.height, lado) / 2];
    document.body.classList.add("ed-arrastrando-cosita");
    // El cajón se esconde mientras (sólo donde tapa la hoja).
    if (app.lateral?.compacto && app.lateral.abierto) { p.reabrir = true; app.lateral.cerrar(); }
  }

  function mover(x, y) {
    if (!p?.fantasma) return;
    p.fantasma.style.transform = `translate(${x - p.mitad[0]}px,${y - p.mitad[1]}px) scale(1.06) rotate(-3deg)`;
    const sobre = !!enHoja(x, y);
    if (sobre !== p.sobre) { p.sobre = sobre; p.fantasma.classList.toggle("sobre", sobre); document.body.classList.toggle("ed-cosita-sobre-hoja", sobre); }
  }

  async function soltar(x, y) {
    const q = p;
    p = null;
    document.body.classList.remove("ed-arrastrando-cosita", "ed-cosita-sobre-hoja");
    bloqueoClic = performance.now();
    const punto = enHoja(x, y);
    const f = q.fantasma;
    if (!punto) {
      // Fuera de la hoja: no pasa nada; la copia regresa a su lugar y el cajón vuelve.
      f?.animate?.([{ opacity: 1 }, { opacity: 0, transform: f.style.transform + " scale(.6)" }], { duration: 220, easing: "ease-in" }).finished.catch(() => {}).finally(() => f.remove());
      if (!f?.animate) f?.remove();
      if (q.reabrir) app.lateral.abrir();
      return;
    }
    f?.animate?.([{ opacity: 1 }, { opacity: 0, transform: f.style.transform.replace(/scale\([^)]*\)/, "scale(.4)") }], { duration: 200, easing: "ease-in" }).finished.catch(() => {}).finally(() => f.remove());
    if (!f?.animate) f?.remove();
    const E = app.estado, pid = E.paginaId;
    const antes = new Set((E.pagina?.els || []).map((e) => e.id));
    // Todo en un solo paso de «deshacer»: lo que hace el toque + moverlo a donde lo soltaste.
    const fin = E.gesto("Añadir");
    try {
      q.b.click();
      const nuevos = await esperarNuevos(E, pid, antes);
      if (nuevos.length) {
        const els = nuevos.map((id) => E.proyecto.paginas[pid]?.els.find((e) => e.id === id)).filter(Boolean);
        const x0 = Math.min(...els.map((e) => e.x)), y0 = Math.min(...els.map((e) => e.y));
        const x1 = Math.max(...els.map((e) => e.x + e.w)), y1 = Math.max(...els.map((e) => e.y + e.h));
        const W = app.lienzo.W, H = app.lienzo.H;
        // Su centro donde soltaste (sin salirse de la hoja).
        let dx = punto.x - (x0 + x1) / 2, dy = punto.y - (y0 + y1) / 2;
        dx = Math.min(Math.max(dx, -x0), W - x1); dy = Math.min(Math.max(dy, -y0), H - y1);
        if (x1 - x0 > W) dx = -x0;
        if (y1 - y0 > H) dy = -y0;
        for (const e of els) E.setEl(e.id, { x: Math.round(e.x + dx), y: Math.round(e.y + dy) }, "Añadir", "soltar:" + e.id, pid);
        E.seleccionar(nuevos);
        app.sonidos?.sonar("soltar");
      }
    } finally { fin(true); }
    if (q.reabrir) setTimeout(() => app.lateral.abrir(), 180);
  }

  function cancelar() {
    if (!p) return;
    clearTimeout(p.t);
    const q = p;
    p = null;
    document.body.classList.remove("ed-arrastrando-cosita", "ed-cosita-sobre-hoja");
    q.fantasma?.remove();
    if (q.reabrir) app.lateral.abrir();
  }

  document.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || p) return;
    const b = e.target instanceof Element ? e.target.closest(COSITA) : null;
    if (!b || !b.closest(".ed-panel-cuerpo, .pro-menu") || b.closest(".ed-no-arrastra") || b.disabled || !app.estado.pagina) return;
    p = { b, id: e.pointerId, x0: e.clientX, y0: e.clientY, tipo: e.pointerType, arrastrando: false, deLado: !!app.lateral?._desplazaDeLado?.(b) };
    if (e.pointerType !== "mouse") p.t = setTimeout(() => { if (p && !p.arrastrando) { empezar(); mover(p.x0, p.y0); } }, ESPERA_DEDO);
  }, { capture: true, passive: true });

  document.addEventListener("pointermove", (e) => {
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.x0, dy = e.clientY - p.y0, d = Math.hypot(dx, dy);
    if (!p.arrastrando) {
      if (d < UMBRAL) return;
      // Ratón: empieza al moverla. Dedo: si la jalas hacia la hoja (a la derecha); hacia arriba/abajo es deslizar
      // la lista, a la izquierda es cerrar el cajón, y en una fila que se desliza de lado sólo con mantenerla.
      if (p.tipo === "mouse" || (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.4 && !p.deLado)) { empezar(); }
      else { clearTimeout(p.t); p = null; return; }
    }
    mover(e.clientX, e.clientY);
  }, { capture: true, passive: true });

  // Ya arrastrando con el dedo, la lista no se desliza (la cosita va contigo). Sólo en el cajón y el menú de
  // LovEdit: escucharlo en toda la página haría esperar a cada deslizamiento de la app.
  const quieto = (e) => { if (p?.arrastrando && e.cancelable) e.preventDefault(); };
  for (const n of [app.lateral?.raiz, app.pro?.menuEl]) n?.addEventListener("touchmove", quieto, { passive: false });

  document.addEventListener("pointerup", (e) => {
    if (!p || e.pointerId !== p.id) return;
    if (p.arrastrando) soltar(e.clientX, e.clientY);
    else { clearTimeout(p.t); p = null; }
  }, { capture: true, passive: true });
  document.addEventListener("pointercancel", (e) => { if (p && e.pointerId === p.id) { if (p.arrastrando) cancelar(); else { clearTimeout(p.t); p = null; } } }, { capture: true, passive: true });
  addEventListener("blur", cancelar);

  // El clic que el navegador manda al soltar después de arrastrar no cuenta (ya se puso al soltar).
  addEventListener("click", (e) => {
    if (performance.now() - bloqueoClic < 450 && e.isTrusted && e.target instanceof Element && e.target.closest(COSITA)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // Al mantener el dedo, el teléfono no abre su menú (copiar imagen…).
  document.addEventListener("contextmenu", (e) => { if (e.target instanceof Element && e.target.closest(COSITA) && e.target.closest(".ed-panel-cuerpo")) e.preventDefault(); }, true);
}

/** Lo que nació en la hoja después de tocar la cosita (puede tardar: un sticker se baja, una foto se lee). */
function esperarNuevos(E, pid, antes, ms = 4000) {
  const ver = () => (E.proyecto?.paginas[pid]?.els || []).map((e) => e.id).filter((id) => !antes.has(id));
  // Si en vez de ponerse abrió una ventanita (elegir algo), ya no se espera: se pondrá como siempre.
  const pregunta = () => document.querySelector(".ed-modal-fondo");
  const ya = ver();
  if (ya.length) return Promise.resolve(ya);
  return new Promise((ok) => {
    const t0 = performance.now();
    const paso = () => {
      const n = ver();
      if (n.length) { requestAnimationFrame(() => ok(ver())); return; }
      if (performance.now() - t0 > ms || pregunta()) { ok([]); return; }
      setTimeout(paso, 60);
    };
    paso();
  });
}
