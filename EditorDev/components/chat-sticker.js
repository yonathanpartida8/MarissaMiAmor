/**
 * CREAR UN STICKER (Fase 34) a partir de una foto tuya, como en WhatsApp.
 *
 *   · la mueves con un dedo y la acercas con dos (o con la rueda / la barrita, en la compu)
 *   · su forma: corazón, círculo, cuadradito redondo o la imagen completa (si tiene fondo transparente,
 *     se respeta), y su borde blanco de sticker
 *   · sale un WebP de 512 × 512 con transparencia (o PNG, en los navegadores que no saben hacer WebP)
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { sinMovimiento as reducido } from "./transiciones.js";

const LADO = 512, MAX_BYTES = 780 * 1024;
const CORAZON = new Path2D("M.5 .93C.5 .93 .05 .65 .05 .34C.05 .16 .19 .05 .33 .05C.42 .05 .47 .1 .5 .16C.53 .1 .58 .05 .67 .05C.81 .05 .95 .16 .95 .34C.95 .65 .5 .93 .5 .93Z");
const FORMAS = [
  { id: "corazon", t: "Corazón", s: '<path d="M12 20.3s-7.6-4.6-8.8-9.7C2.4 7.2 4.6 4.6 7.6 4.6c1.9 0 3.3 1.1 4.4 2.7 1.1-1.6 2.5-2.7 4.4-2.7 3 0 5.2 2.6 4.4 6-1.2 5.1-8.8 9.7-8.8 9.7z"/>' },
  { id: "circulo", t: "Círculo", s: '<circle cx="12" cy="12" r="8.4"/>' },
  { id: "cuadro", t: "Redondito", s: '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.6"/>' },
  { id: "completa", t: "Completa", s: '<path d="M4 16.5 9 11l3.6 3.8 2.4-2.4 5 5"/><rect x="3.4" y="4.4" width="17.2" height="15.2" rx="3"/>' },
];

/** El selector de archivos (una imagen). */
export function elegirImagen() {
  return new Promise((ok) => {
    const i = el("input", { type: "file", accept: "image/*", style: { position: "fixed", left: "-9999px" } });
    i.addEventListener("change", () => { ok(i.files?.[0] || null); i.remove(); }, { once: true });
    i.addEventListener("cancel", () => { ok(null); i.remove(); }, { once: true });
    // Si cierran el selector sin elegir, nadie avisa en todos los navegadores: al volver el foco se espera
    // (el iPhone tarda en preparar la foto después de cerrar el selector).
    addEventListener("focus", () => { const t0 = Date.now(); const mirar = () => { if (!i.isConnected) return; if (i.files?.length) { ok(i.files[0]); i.remove(); } else if (Date.now() - t0 > 30000) { ok(null); i.remove(); } else setTimeout(mirar, 500); }; setTimeout(mirar, 900); }, { once: true });
    document.body.append(i);
    i.click();
  });
}

async function cargar(archivo) {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => mal(new Error("Esa imagen no se pudo abrir.")); im.src = url; });
    // Las fotos enormes se achican primero: así mover y acercar va suavecito.
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

/** Dibuja el sticker en un cuadro de `tam` px. */
function dibujar(ctx, img, E, tam) {
  ctx.clearRect(0, 0, tam, tam);
  const b = E.borde ? Math.round(tam * 0.038) : 0;
  const completa = E.forma === "completa";
  const base = completa ? Math.min((tam - 2 * b) / img.width, (tam - 2 * b) / img.height) : Math.max(tam / img.width, tam / img.height);
  const k = base * E.zoom, w = img.width * k, h = img.height * k;
  const x = (tam - w) / 2 + E.dx * tam, y = (tam - h) / 2 + E.dy * tam;
  if (completa) {
    if (b) {
      // El borde blanco sigue la silueta (sirve con fotos de fondo transparente).
      const s = document.createElement("canvas");
      s.width = s.height = tam;
      const sc = s.getContext("2d");
      sc.drawImage(img, x, y, w, h);
      sc.globalCompositeOperation = "source-in";
      sc.fillStyle = "#fff";
      sc.fillRect(0, 0, tam, tam);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.drawImage(s, Math.cos(a) * b, Math.sin(a) * b); }
    }
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  // Primero el borde (la forma en blanco) y encima la foto recortada un poquito más adentro.
  if (b) { ctx.save(); recortar(ctx, E.forma, 0, tam); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, tam, tam); ctx.restore(); }
  ctx.save();
  recortar(ctx, E.forma, b, tam);
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}
/** El recorte de la forma (en su lugar, `inset` px hacia adentro). */
function recortar(ctx, forma, inset, tam) {
  const t = tam - 2 * inset;
  if (forma === "corazon") {
    const m = new DOMMatrix().translate(inset, inset).scale(t, t);
    const p = new Path2D();
    p.addPath(CORAZON, m);
    ctx.clip(p);
    return;
  }
  ctx.beginPath();
  if (forma === "circulo") ctx.arc(tam / 2, tam / 2, t / 2, 0, Math.PI * 2);
  else if (ctx.roundRect) ctx.roundRect(inset, inset, t, t, t * 0.2);
  else ctx.rect(inset, inset, t, t);
  ctx.clip();
}

/**
 * Abre el creador. `flota(n)` pone algo encima de todo; `alCrear({ blob, w, h })` lo sube (si falla,
 * el creador se queda abierto para intentar otra vez). Devuelve una promesa que termina al cerrarse.
 */
export async function creadorSticker({ archivo, flota, sonar, alCrear }) {
  let img;
  try { img = await cargar(archivo); }
  catch (e) { aviso(e.message, 4000, "error"); return; }
  const E = { forma: "corazon", borde: true, zoom: 1, dx: 0, dy: 0 };
  const lienzo = el("canvas.ch-crear-lienzo", { "aria-label": "Tu sticker: muévelo con un dedo y acércalo con dos" });
  const zoom = el("input.ch-crear-zoom", { type: "range", min: "0.5", max: "4", step: "0.01", value: "1", "aria-label": "Acercar" });
  const borde = el("button.ch-crear-borde", { type: "button", role: "switch", "aria-checked": "true" }, [el("i.ch-switch-i", {}, [el("i")]), el("span", { text: "Borde blanco" })]);
  const formas = FORMAS.map((f) => el("button.ch-crear-forma" + (f.id === E.forma ? ".on" : ""), { type: "button", "aria-pressed": String(f.id === E.forma), dataset: { f: f.id } }, [
    el("i", { html: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round">${f.s}</svg>` }), el("span", { text: f.t }),
  ]));
  const bCrear = el("button.ch-crear-si", { type: "button" }, [el("i", { html: ico("ok") }), el("span", { text: "Crear sticker" })]);
  const bNo = el("button.ch-crear-no", { type: "button", text: "Cancelar" });
  const velo = flota(el("div.ch-velo.foco"));
  const caja = flota(el("div.ch-crear", { role: "dialog", "aria-modal": "true", "aria-label": "Crear un sticker" }, [
    el("div.ch-crear-cab", {}, [el("b", { text: "Tu sticker nuevo" }), el("button.ch-crear-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: () => cerrar() })]),
    el("div.ch-crear-marco", {}, [lienzo]),
    el("small.ch-crear-pista", { text: "Muévela con un dedo y acércala con dos" }),
    el("div.ch-crear-formas", { role: "group", "aria-label": "Forma" }, formas),
    el("div.ch-crear-fila", {}, [el("i.ch-crear-lupa", { html: ico("zoomMas") }), zoom, borde]),
    el("div.ch-crear-pie", {}, [bNo, bCrear]),
  ]));
  sonar?.("abrir");

  const pintar = () => {
    const css = lienzo.clientWidth || 280, d = Math.min(3, devicePixelRatio || 1), px = Math.round(css * d);
    if (lienzo.width !== px) { lienzo.width = lienzo.height = px; }
    dibujar(lienzo.getContext("2d"), img, E, px);
  };
  let cuadro = 0;
  const luego = () => { if (!cuadro) cuadro = requestAnimationFrame(() => { cuadro = 0; pintar(); }); };
  requestAnimationFrame(pintar);
  const ro = new ResizeObserver(luego);
  ro.observe(lienzo);

  formas.forEach((b) => b.addEventListener("click", () => {
    E.forma = b.dataset.f;
    formas.forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    if (!reducido()) lienzo.animate([{ transform: "scale(.94)" }, { transform: "scale(1.02)" }, { transform: "none" }], { duration: 320, easing: "ease-out" });
    sonar?.("clic");
    luego();
  }));
  borde.addEventListener("click", () => { E.borde = !E.borde; borde.setAttribute("aria-checked", String(E.borde)); luego(); });
  const ponerZoom = (z) => { E.zoom = Math.max(0.5, Math.min(4, z)); zoom.value = String(E.zoom); luego(); };
  zoom.addEventListener("input", () => ponerZoom(+zoom.value));
  lienzo.addEventListener("wheel", (e) => { e.preventDefault(); ponerZoom(E.zoom * Math.exp(-e.deltaY * 0.0016)); }, { passive: false });
  // Mover con un dedo, acercar con dos.
  const dedos = new Map();
  let antes = null;
  const estado = () => {
    const p = [...dedos.values()];
    if (p.length === 1) return { x: p[0].x, y: p[0].y, d: 0 };
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
  };
  lienzo.addEventListener("pointerdown", (e) => { lienzo.setPointerCapture?.(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); antes = estado(); });
  lienzo.addEventListener("pointermove", (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ahora = estado(), t = lienzo.clientWidth || 280;
    E.dx += (ahora.x - antes.x) / t; E.dy += (ahora.y - antes.y) / t;
    if (antes.d && ahora.d) ponerZoom(E.zoom * (ahora.d / antes.d));
    E.dx = Math.max(-1.5, Math.min(1.5, E.dx)); E.dy = Math.max(-1.5, Math.min(1.5, E.dy));
    antes = ahora;
    luego();
  });
  for (const k of ["pointerup", "pointercancel"]) lienzo.addEventListener(k, (e) => { dedos.delete(e.pointerId); antes = dedos.size ? estado() : null; });

  let fin;
  const listo = new Promise((r) => { fin = r; });
  function cerrar() {
    ro.disconnect();
    velo.remove();
    if (reducido()) caja.remove();
    else caja.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(24px) scale(.94)" }], { duration: 200, easing: "ease-in" }).onfinish = () => caja.remove();
    sonar?.("cerrar");
    removeEventListener("keydown", esc, true);
    fin();
  }
  const esc = (e) => { if (e.key === "Escape") { e.stopPropagation(); cerrar(); } };
  addEventListener("keydown", esc, true);
  velo.addEventListener("click", cerrar);
  bNo.addEventListener("click", cerrar);
  bCrear.addEventListener("click", async () => {
    if (bCrear.disabled) return;
    bCrear.disabled = true;
    caja.classList.add("creando");
    bCrear.lastChild.textContent = "Creando…";
    try {
      const c = document.createElement("canvas");
      c.width = c.height = LADO;
      dibujar(c.getContext("2d"), img, E, LADO);
      const blob = await exportar(c);
      await alCrear({ blob, w: LADO, h: LADO });
      cerrar();
    } catch (e) {
      aviso(e.message || "No se pudo crear el sticker.", 4500, "error");
      bCrear.disabled = false;
      caja.classList.remove("creando");
      bCrear.lastChild.textContent = "Crear sticker";
    }
  });
  return listo;
}

const aBlob = (c, tipo, q) => new Promise((ok) => c.toBlob((b) => ok(b), tipo, q));
async function exportar(c) {
  for (const q of [0.9, 0.78, 0.62]) {
    const b = await aBlob(c, "image/webp", q);
    if (b && b.type === "image/webp") { if (b.size <= MAX_BYTES) return b; continue; }
    break; // este navegador no hace WebP: PNG
  }
  let b = await aBlob(c, "image/png");
  if (b && b.size <= MAX_BYTES) return b;
  const chico = document.createElement("canvas");
  chico.width = chico.height = 360;
  chico.getContext("2d").drawImage(c, 0, 0, 360, 360);
  b = await aBlob(chico, "image/png");
  if (b && b.size <= MAX_BYTES) return b;
  throw new Error("Ese sticker quedó muy pesado. Prueba con otra foto.");
}
