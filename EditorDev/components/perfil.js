/**
 * TU PERFIL — tu foto, tu nombre, tu cumpleaños y desde cuándo son novios (y
 * lo mismo de tu amorcito, si están vinculados). Vive en M.YNTHN; aquí se
 * guarda una copia chiquita, con las fotos ya listas, para que el menú y
 * Detallitos se vean al instante y sin parpadeos aunque el servidor tarde.
 *
 *   avatar("yo" | "pareja")   un circulito con la foto (o la inicial) que se
 *                             pone al día solo cuando algo cambia
 *   juntos(fecha)             cuántos días (y años, meses, días) llevan
 *   proximo()                 lo que viene: aniversario, mesiversario o un cumpleaños
 *   vistaPerfil(app, …)       la pantalla para cambiar todo eso
 *   recortar(archivo)         elegir el pedacito de la foto (arrastrar y acercar)
 */
import * as SRV from "../integraciones/servidor.js";
import { el, aviso, modal } from "./ui.js";
import { ico } from "./iconos.js";
import { elegirArchivos } from "../assets/biblioteca.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const yoU = () => SRV.usuario()?.usuario || "";
const CLAVE = () => "editordev:perfil:" + yoU();
const vacio = () => ({ yo: null, pareja: null });
let D = null;

function leer() { try { return { ...vacio(), ...(JSON.parse(localStorage.getItem(CLAVE()) || "null") || {}) }; } catch (e) { return vacio(); } }
function guardarLocal() { try { localStorage.setItem(CLAVE(), JSON.stringify(D)); } catch (e) { /* lleno: sin copia local */ } }

/** Lo que se sabe ahora (de la copia local; `refrescar()` lo trae del servidor). */
export function datos() {
  if (!SRV.conectado()) return vacio();
  if (!D || D._de !== yoU()) { D = leer(); D._de = yoU(); if (!D.yo) D.yo = { usuario: yoU(), nombre: SRV.usuario()?.nombre || "" }; }
  return D;
}
/** ¿Ya hay una copia de tu perfil en este aparato? (la primera vez, no) */
export function tieneCopia() { try { return !!localStorage.getItem(CLAVE()); } catch (e) { return false; } }
export const nombreDe = (p) => (p?.nombre || "").trim() || p?.usuario || "";
export const miNombre = () => nombreDe(datos().yo) || yoU();

/* Sólo lo que se ve: el «visto hace…» de tu amorcito cambia cada latido y no debe repintar nada. */
const firma = (x) => JSON.stringify(x ? [x.usuario, x.nombre, x.cumple, x.novios, x.foto_v, !!x.foto, !!x.en_linea, x.desde] : null);

async function aDatos(blob, lado = 256) {
  try {
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = c.height = lado;
    const g = c.getContext("2d"), k = Math.max(lado / bmp.width, lado / bmp.height);
    g.drawImage(bmp, (lado - bmp.width * k) / 2, (lado - bmp.height * k) / 2, bmp.width * k, bmp.height * k);
    bmp.close?.();
    return c.toDataURL("image/jpeg", 0.86);
  } catch (e) {
    return new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(""); r.readAsDataURL(blob); });
  }
}
async function fotoDe(quien, v, antes) {
  if (!v) return "";
  if (antes?.foto_v === v && antes.foto) return antes.foto;
  try { return await aDatos(await (quien === "yo" ? SRV.miFoto() : SRV.fotoPareja())); } catch (e) { return antes?.foto || ""; }
}

/** Pone al día con lo que contestó el servidor (perfil, latido o amor). Baja sólo las fotos que cambiaron. */
export async function poner({ perfil, pareja } = {}) {
  const d = datos(), antes = firma(d.yo) + firma(d.pareja);
  if (perfil) d.yo = { ...perfil, foto: await fotoDe("yo", perfil.foto_v, d.yo) };
  if (pareja !== undefined) d.pareja = pareja ? { ...pareja, foto: await fotoDe("pareja", pareja.foto_v, d.pareja) } : null;
  guardarLocal();
  if (firma(d.yo) + firma(d.pareja) !== antes) dispatchEvent(new CustomEvent("ed-perfil"));
}
let trayendo = null;
export function refrescar() {
  if (!SRV.conectado()) return Promise.resolve();
  trayendo ||= SRV.perfil().then(poner).catch(() => {}).finally(() => { trayendo = null; });
  return trayendo;
}
addEventListener("ed-cuenta", () => { D = null; if (SRV.conectado()) refrescar(); dispatchEvent(new CustomEvent("ed-perfil")); });

/* ── El circulito con la foto ── */
function pintarAvatar(n) {
  const d = datos(), p = n.dataset.quien === "yo" ? d.yo : d.pareja;
  const foto = p?.foto || "", letra = (nombreDe(p) || "?").trim().slice(0, 1).toUpperCase();
  const k = (p ? "1" : "0") + foto.length + foto.slice(-24) + letra;
  if (n._k === k) return;   // ya está igual: no se toca (nada parpadea)
  n._k = k;
  const marcar = () => { n.classList.toggle("con-foto", !!foto); n.classList.toggle("vacio", !p); };
  if (foto) {
    // La foto nueva se decodifica ANTES de ponerse: nunca se ve el circulito vacío un instante.
    if (n.querySelector("img")?.src === foto) return marcar();
    const img = el("img", { alt: "", draggable: "false" });
    img.decoding = "sync";
    img.src = foto;
    const poner = () => { if (n._k === k) { marcar(); n.replaceChildren(img); } };
    if (img.complete || !img.decode) poner(); else img.decode().then(poner, poner);
  } else { marcar(); n.replaceChildren(el("b", { text: p ? letra : "?" })); }
}
export function avatar(quien, clase = "") {
  const n = el("span.av" + (clase ? "." + clase.split(" ").join(".") : ""), { dataset: { quien }, "aria-hidden": "true" });
  pintarAvatar(n);
  return n;
}
export function refrescarAvatares(raiz = document) { for (const n of raiz.querySelectorAll(".av[data-quien]")) pintarAvatar(n); }
addEventListener("ed-perfil", () => refrescarAvatares());

/* ── Fechas ── */
const hoy = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const aFecha = (s) => { const [a, m, d] = String(s).split("-").map(Number); return new Date(a, m - 1, d); };
const DIA = 86400000;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export const largaFecha = (s) => (s ? aFecha(s).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Cuánto llevan juntos: { dias, a, m, d } (o null sin fecha). */
export function juntos(novios) {
  if (!novios) return null;
  const ini = aFecha(novios), h = hoy(), dias = Math.round((h - ini) / DIA);
  if (!(dias >= 0)) return null;
  let a = h.getFullYear() - ini.getFullYear(), m = h.getMonth() - ini.getMonth(), d = h.getDate() - ini.getDate();
  if (d < 0) { m--; d += new Date(h.getFullYear(), h.getMonth(), 0).getDate(); }
  if (m < 0) { a--; m += 12; }
  return { dias, a, m, d };
}
export function textoJuntos(j) {
  if (!j) return "";
  const p = [];
  if (j.a) p.push(plural(j.a, "año", "años"));
  if (j.m) p.push(plural(j.m, "mes", "meses"));
  if (j.d || !p.length) p.push(plural(j.d, "día", "días"));
  return p.length > 1 ? p.slice(0, -1).join(", ") + " y " + p[p.length - 1] : p[0];
}
const enDias = (f) => Math.round((f - hoy()) / DIA);
function siguienteAnual(s) { const f = aFecha(s), h = hoy(); let p = new Date(h.getFullYear(), f.getMonth(), f.getDate()); if (p < h) p = new Date(h.getFullYear() + 1, f.getMonth(), f.getDate()); return p; }
function siguienteMensual(s) {
  const dia = aFecha(s).getDate(), h = hoy();
  for (let i = 0; i < 3; i++) {
    const ult = new Date(h.getFullYear(), h.getMonth() + i + 1, 0).getDate();
    const p = new Date(h.getFullYear(), h.getMonth() + i, Math.min(dia, ult));
    if (p >= h) return p;
  }
  return null;
}

/** Lo que viene más pronto: { icono, texto, dias, hoy }. */
export function proximo(d = datos()) {
  const ev = [], pa = d.pareja, yo = d.yo, novios = pa?.novios || yo?.novios;
  const j = juntos(novios);
  if (j) {
    const an = siguienteAnual(novios), n = enDias(an), anios = an.getFullYear() - aFecha(novios).getFullYear();
    if (anios > 0) ev.push({ icono: "anillos", dias: n, texto: n === 0 ? `¡Hoy cumplen ${plural(anios, "año", "años")} de novios!` : `Faltan ${plural(n, "día", "días")} para su aniversario (${plural(anios, "año", "años")})` });
    const me = siguienteMensual(novios);
    if (me && j.dias > 0) { const k = enDias(me), meses = (me.getFullYear() - aFecha(novios).getFullYear()) * 12 + me.getMonth() - aFecha(novios).getMonth(); if (meses % 12) ev.push({ icono: "corazon", dias: k, texto: k === 0 ? `¡Hoy cumplen ${plural(meses, "mes", "meses")} juntos!` : `Faltan ${plural(k, "día", "días")} para sus ${plural(meses, "mes", "meses")}` }); }
  }
  if (pa?.cumple) { const n = enDias(siguienteAnual(pa.cumple)); ev.push({ icono: "pastel", dias: n, texto: n === 0 ? `¡Hoy es el cumpleaños de ${nombreDe(pa)}!` : `Faltan ${plural(n, "día", "días")} para el cumpleaños de ${nombreDe(pa)}` }); }
  if (yo?.cumple) { const n = enDias(siguienteAnual(yo.cumple)); ev.push({ icono: "pastel", dias: n, texto: n === 0 ? "¡Hoy es tu cumpleaños! Feliz cumpleaños" : `Faltan ${plural(n, "día", "días")} para tu cumpleaños` }); }
  const e = ev.sort((a, b) => a.dias - b.dias)[0];
  return e ? { ...e, hoy: e.dias === 0 } : null;
}

/* ── Elegir el pedacito de la foto ── */
export async function recortar(archivo) {
  const url = URL.createObjectURL(archivo);
  const img = el("img", { src: url, alt: "", draggable: "false" });
  try { await img.decode(); } catch (e) { /* se revisa abajo */ }
  if (!img.naturalWidth) { URL.revokeObjectURL(url); throw new Error("No pude leer esa foto."); }
  const V = 232, W = img.naturalWidth, H = img.naturalHeight, base = Math.max(V / W, V / H);
  let z = 1, x = 0, y = 0;
  const ventana = el("div.pf-recorte", { style: { width: V + "px", height: V + "px" } }, [img, el("i.pf-recorte-aro")]);
  Object.assign(img.style, { width: W + "px", height: H + "px" });
  const pintar = () => {
    const w = W * base * z, h = H * base * z;
    x = Math.max(-(w - V) / 2, Math.min((w - V) / 2, x));
    y = Math.max(-(h - V) / 2, Math.min((h - V) / 2, y));
    img.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${base * z})`;
  };
  const zoom = el("input", { type: "range", min: 1, max: 3, step: 0.01, value: 1, "aria-label": "Acercar la foto" });
  zoom.addEventListener("input", () => { z = +zoom.value; pintar(); });
  let toque = null;
  ventana.addEventListener("pointerdown", (e) => { ventana.setPointerCapture(e.pointerId); toque = { x: e.clientX - x, y: e.clientY - y }; });
  ventana.addEventListener("pointermove", (e) => { if (!toque) return; x = e.clientX - toque.x; y = e.clientY - toque.y; pintar(); });
  for (const t of ["pointerup", "pointercancel"]) ventana.addEventListener(t, () => { toque = null; });
  ventana.addEventListener("wheel", (e) => { e.preventDefault(); z = Math.max(1, Math.min(3, z - e.deltaY / 500)); zoom.value = z; pintar(); }, { passive: false });
  pintar();
  const r = await modal({
    titulo: "Tu foto", ancho: 380, clase: "pf-modal",
    contenido: [el("p.pf-recorte-ayuda", { text: "Muévela con el dedo y acércala hasta que quede como te gusta." }), ventana, el("label.pf-zoom", {}, [el("span", { html: ico("zoomMenos") }), zoom, el("span", { html: ico("zoomMas") })])],
    acciones: [["Cancelar", null], [I("ok", "Usar esta foto"), "si", "primario"]],
  });
  if (r !== "si") { URL.revokeObjectURL(url); return null; }
  const L = 512, k = L / V, c = document.createElement("canvas");
  c.width = c.height = L;
  const g = c.getContext("2d"), w = W * base * z * k, h = H * base * z * k;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, L, L);
  g.drawImage(img, L / 2 + x * k - w / 2, L / 2 + y * k - h / 2, w, h);
  URL.revokeObjectURL(url);
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/jpeg", 0.88));
}

/* ── La pantalla del perfil ── */
export function vistaPerfil(app, { alListo, alVincular, alSalir } = {}) {
  const d = datos(), yo = d.yo || {}, pa = d.pareja;
  const son = app.sonidos;
  const nombre = el("input.pf-input", { type: "text", value: yo.nombre || "", maxlength: 40, placeholder: yoU(), autocomplete: "nickname", "aria-label": "Tu nombre" });
  const cumple = el("input.pf-input", { type: "date", value: yo.cumple || "", max: new Date().toISOString().slice(0, 10), "aria-label": "Tu cumpleaños" });
  const novios = el("input.pf-input", { type: "date", value: pa?.novios || yo.novios || "", max: new Date().toISOString().slice(0, 10), "aria-label": "Novios desde" });
  const estado = el("small.pf-estado", { role: "status" });
  const grande = avatar("yo", "pf-av");
  const subiendo = el("i.pf-girando");
  const fotoB = el("button.pf-foto", { type: "button", "aria-label": "Cambiar mi foto" }, [grande, el("span.pf-camara", { html: ico("camara") }), subiendo]);
  const quitarB = el("button.pf-quitar", { type: "button", html: I("borrar", "Quitar foto"), hidden: !yo.foto_v });
  fotoB.addEventListener("click", async () => {
    const [f] = await elegirArchivos({ accept: "image/*", multiple: false });
    if (!f) return;
    let b;
    try { b = await recortar(f); } catch (e) { aviso(e.message, 3500, "error"); return; }
    if (!b) return;
    fotoB.classList.add("cargando");
    try {
      await SRV.subirFoto(b);
      await refrescar();
      son?.sonar("brillo");
      fotoB.classList.add("brilla"); setTimeout(() => fotoB.classList.remove("brilla"), 900);
      quitarB.hidden = false;
      aviso("¡Qué linda foto!", 2200);
    } catch (e) { aviso(e.message, 4000, "error"); son?.sonar("error"); }
    finally { fotoB.classList.remove("cargando"); }
  });
  quitarB.addEventListener("click", async () => {
    try { await SRV.quitarFoto(); await refrescar(); quitarB.hidden = true; son?.sonar("borrar"); } catch (e) { aviso(e.message, 3500, "error"); }
  });
  const guardar = el("button.mp-btn.primario.pf-guardar", { type: "button", html: I("ok", "Guardar") });
  guardar.addEventListener("click", async () => {
    guardar.disabled = true; estado.textContent = "Guardando…"; estado.className = "pf-estado";
    try {
      await poner(await SRV.guardarPerfil({ nombre: nombre.value, cumple: cumple.value, novios: novios.value }));
      son?.sonar("exito");
      estado.textContent = "¡Listo! Así te ve tu amorcito.";
      estado.className = "pf-estado bien";
      alListo?.(guardar);
    } catch (e) { estado.textContent = e.message; estado.className = "pf-estado mal"; son?.sonar("error"); }
    finally { guardar.disabled = false; }
  });
  const campo = (icono, et, input, nota) => el("label.pf-campo", {}, [el("span.pf-et", { html: I(icono, et) }), input, nota ? el("small", { text: nota }) : null]);
  const j = juntos(pa?.novios || yo.novios);
  return el("div.pf", {}, [
    el("div.pf-cabeza", {}, [
      fotoB,
      el("div.pf-quien", {}, [el("b", { text: nombreDe(yo) || yoU() }), el("small", { text: "@" + yoU() }), quitarB]),
    ]),
    campo("cuenta", "Tu nombre", nombre, "Así te ve tu amorcito (tu usuario para entrar no cambia)."),
    campo("pastel", "Tu cumpleaños", cumple),
    campo("calendario", "Somos novios desde", novios, pa ? `Es de los dos: a ${nombreDe(pa)} le aparece igual.` : "Cuando te vincules, le aparece igual a tu amorcito."),
    guardar, estado,
    el("div.pf-pareja", {}, pa
      ? [avatar("pareja", "pf-av-mini"), el("div", {}, [el("b", { text: nombreDe(pa) }), el("small", { text: j ? `Juntos ${textoJuntos(j)}` : "Tu amorcito" })]), el("button.mp-btn.suave.chico", { type: "button", html: I("vincular", "Ver"), onClick: (e) => alVincular?.(e.currentTarget) })]
      : [el("span.av.vacio.pf-av-mini", {}, [el("b", { text: "?" })]), el("div", {}, [el("b", { text: "Sin vincular" }), el("small", { text: "Vincula a tu amorcito con su código" })]), el("button.mp-btn.suave.chico", { type: "button", html: I("vincular", "Vincular"), onClick: (e) => alVincular?.(e.currentTarget) })]),
    el("button.mp-btn.suave.pf-salir", { type: "button", html: I("salir", "Salir de mi cuenta"), onClick: () => alSalir?.() }),
  ]);
}
