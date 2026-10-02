/*
 * LA INTERFAZ Y LOS CONTROLES — discretos, para que se vea la ciudad.
 *
 * Teléfono:
 *   · Dedo en la mitad izquierda: aparece el joystick donde lo pongas.
 *   · Deslizar en la derecha: gira la cámara. Pellizcar: acerca/aleja.
 *   · Tocar algo del mundo (una ventana, la luna, un perrito…): lo toca.
 *   · Botones a la derecha: golpe (mantener = fuerte), saltar (en el aire
 *     y con Modo Dios = volar), la acción del momento, el poder elegido y ✨.
 *   · Dos dedos sobre la luna, quietos un ratito… (no se dice qué pasa).
 * Teclado: WASD/flechas, Shift correr, Espacio saltar/subir, C bajar,
 *   F golpe, E acción, G Modo Dios, Q poder, 1-9 elegir poder, ratón para
 *   la cámara (arrastrar) y la rueda para el zoom.
 */
import { J, clamp, aPantalla } from "./base.js";

export const E = J.entrada = { mx: 0, mz: 0, mag: 0, correr: false, saltar: false, saltarSuelto: true, subir: false, bajar: false, golpe: false, golpeFuerte: false, golpeT: 0, accion: false, poder: false, poderSostenido: false, dios: false, toques: [], camDX: 0, camDY: 0, zoom: 0 };

const raiz = document.getElementById("ui");
const $ = (s) => raiz.querySelector(s);
function el(tag, clase, padre = raiz, html = "") { const e = document.createElement(tag); if (clase) e.className = clase; if (html) e.innerHTML = html; padre.appendChild(e); return e; }

/* ══════════════════ LO QUE SE VE ══════════════════ */
export function armarUI() {
  raiz.innerHTML = `
  <div class="cd-arriba">
    <button class="cd-chip" id="bMis" aria-label="Misterios">📜 <b id="nMis">0</b></button>
    <span class="cd-chip" id="nVen" title="Ventanas encendidas">🪟 <b>0</b>/83</span>
    <span class="cd-caos" id="caos"></span>
  </div>
  <div class="cd-aviso" id="aviso"></div>
  <div class="cd-envivo" id="envivo">🔴 EN VIVO · Un héroe misterioso ilumina la ciudad dormida</div>
  <div class="cd-burbujas" id="burbujas"></div>
  <p class="cd-dialogo is-fuera" id="dialogo" role="status" aria-live="polite"></p>
  <div class="cd-joy" id="joy"><i></i></div>
  <div class="cd-botones" id="botones">
    <button class="cd-b cd-dios" id="bDios" aria-label="Modo Dios">✨</button>
    <button class="cd-b cd-poder oculto" id="bPoder" aria-label="Usar poder">⚡</button>
    <button class="cd-b cd-mini oculto" id="bPoderes" aria-label="Elegir poder">⋯</button>
    <button class="cd-b cd-accion oculto" id="bAccion"><span></span></button>
    <button class="cd-b cd-saltar" id="bSaltar" aria-label="Saltar">⤒</button>
    <button class="cd-b cd-bajar oculto" id="bBajar" aria-label="Bajar">⤓</button>
    <button class="cd-b cd-golpe" id="bGolpe" aria-label="Golpe">👊</button>
  </div>
  <div class="cd-rueda oculto" id="rueda"></div>
  <div class="cd-luna" id="anilloLuna"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/></svg></div>
  <div class="cd-capa oculto" id="capa"><div class="cd-tarjeta" id="tarjeta"></div></div>
  <div class="cd-titulo" id="titulo"><h1>La ciudad dormida</h1><p>una noche cualquiera… o eso parece</p></div>`;
  for (const id of ["bDios", "bPoder", "bPoderes", "bAccion", "bSaltar", "bBajar", "bGolpe", "bMis"]) for (const ev of ["pointerdown", "pointerup", "pointercancel", "pointermove"]) $("#" + id).addEventListener(ev, (e) => e.stopPropagation());
  $("#bSaltar").addEventListener("pointerdown", () => { E.saltar = true; E.subir = true; });
  $("#bSaltar").addEventListener("pointerup", () => { E.subir = false; });
  $("#bSaltar").addEventListener("pointercancel", () => { E.subir = false; });
  $("#bBajar").addEventListener("pointerdown", () => { E.bajar = true; });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) $("#bBajar").addEventListener(ev, () => { E.bajar = false; });
  $("#bGolpe").addEventListener("pointerdown", () => { E.golpeAbajo = performance.now(); E.cargandoGolpe = true; });
  $("#bGolpe").addEventListener("pointerup", () => { const d = performance.now() - (E.golpeAbajo || 0); E.cargandoGolpe = false; if (d > 380) E.golpeFuerte = true; else E.golpe = true; });
  $("#bGolpe").addEventListener("pointercancel", () => { E.cargandoGolpe = false; });
  $("#bAccion").addEventListener("pointerdown", () => { E.accion = true; });
  $("#bDios").addEventListener("pointerdown", () => { E.dios = true; });
  $("#bPoder").addEventListener("pointerdown", () => { E.poder = true; E.poderSostenido = true; });
  for (const ev of ["pointerup", "pointercancel"]) $("#bPoder").addEventListener(ev, () => { E.poderSostenido = false; E.poderSuelto = true; });
  $("#bPoderes").addEventListener("pointerdown", () => abrirRueda());
  $("#bMis").addEventListener("click", () => J.abrirMisterios && J.abrirMisterios());
  const capa = $("#capa");
  for (const ev of ["pointerdown", "pointermove", "pointerup"]) capa.addEventListener(ev, (e) => e.stopPropagation());
  capa.addEventListener("click", (e) => { if (e.target === capa || e.target.closest("[data-cerrar]")) cerrarTarjeta(); });
  setTimeout(() => $("#titulo").classList.add("fuera"), 3400);
}

/* ── la rueda de poderes ── */
let rueda = null;
export function definirPoderes(lista, actual) {
  const r = $("#rueda"); r.innerHTML = "";
  for (const p of lista) {
    const b = el("button", "cd-rp" + (p.id === actual ? " activo" : "") + (p.bloq ? " bloq" : ""), r, p.bloq ? "❓" : p.ico);
    b.title = p.bloq ? p.como : p.nombre;
    b.addEventListener("pointerdown", (e) => { e.stopPropagation(); if (p.bloq) { aviso("❓ " + p.como); return; } J.elegirPoder(p.id); cerrarRueda(); });
  }
  rueda = r;
}
function abrirRueda() { if (!rueda) return; rueda.classList.toggle("oculto"); }
function cerrarRueda() { if (rueda) rueda.classList.add("oculto"); }
export function botonPoder(ico, visible) { const b = $("#bPoder"); b.textContent = ico; b.classList.toggle("oculto", !visible); $("#bPoderes").classList.toggle("oculto", !visible); if (!visible) cerrarRueda(); }
export function botonDios(on) { $("#bDios").classList.toggle("on", on); $("#botones").classList.toggle("dios", on); }
export function botonBajar(v) { $("#bBajar").classList.toggle("oculto", !v); }
export function botonSaltar(ico) { const b = $("#bSaltar"); if (b.textContent !== ico) b.textContent = ico; }
let accionTxt = "";
export function botonAccion(txt) {
  if (txt === accionTxt) return; accionTxt = txt;
  const b = $("#bAccion"); b.classList.toggle("oculto", !txt); if (txt) b.querySelector("span").textContent = txt;
}
export function contador(id, n) { const e = $(id + " b"); if (e && e.textContent !== String(n)) e.textContent = n; }
export function caos(txt) { const e = $("#caos"); if (e.textContent !== txt) e.textContent = txt; }
export function enVivo(v) { $("#envivo").classList.toggle("ver", v); }
export function cargaGolpe() { return E.cargandoGolpe ? clamp((performance.now() - E.golpeAbajo) / 380, 0, 1) : 0; }

/* ── el diálogo de abajo ── */
let relojD = null, colaD = [], hablandoHasta = 0;
export function decir(txt, quien = "yo", dur) {
  const ahora = performance.now();
  const d = dur || Math.max(2600, txt.length * 60);
  if (ahora < hablandoHasta && quien !== "urgente") { if (colaD.length < 3 && !colaD.some((q) => q.txt === txt)) colaD.push({ txt, quien, d }); return; }
  mostrar(txt, quien, d);
}
/* Para los momentos importantes: corta lo que se estaba diciendo. */
export function decirYa(txt, quien = "yo", dur) { colaD = []; mostrar(txt, quien, dur || Math.max(2600, txt.length * 60)); }
function mostrar(txt, quien, d) {
  const e = $("#dialogo");
  clearTimeout(relojD);
  e.classList.add("is-fuera");
  setTimeout(() => {
    e.textContent = txt;
    e.className = "cd-dialogo es-" + (quien === "urgente" ? "yo" : quien);
    relojD = setTimeout(() => { e.classList.add("is-fuera"); const s = colaD.shift(); if (s) setTimeout(() => mostrar(s.txt, s.quien, s.d), 300); }, d);
  }, 220);
  hablandoHasta = performance.now() + d + 300;
}

/* ── los globitos sobre la gente ── */
const globos = [];   // { el, quien (objeto con x,y,z), alto, t, dur }
export function globito(quien, txt, estilo = "gente", dur = 2.4, alto = 2.2) {
  if (estilo === "gente" && globos.filter((g) => g.estilo === "gente").length >= 4) return;
  const caja = $("#burbujas"), e = el("div", "cd-globo " + estilo, caja); e.textContent = txt;
  globos.push({ el: e, quien, alto, t: 0, dur, estilo });
}
const _p = { x: 0, y: 0, visible: true };
export function actualizarGlobos(dt) {
  const ocup = [];
  for (let i = globos.length - 1; i >= 0; i--) {
    const g = globos[i]; g.t += dt;
    if (g.t > g.dur || !g.quien) { g.el.remove(); globos.splice(i, 1); continue; }
    aPantalla(g.quien.x, (g.quien.y || 0) + g.alto, g.quien.z, _p);
    const d = Math.hypot(g.quien.x - J.camara.position.x, g.quien.z - J.camara.position.z);
    if (!_p.visible || d > 60) { g.el.style.opacity = 0; continue; }
    const w = g.el.offsetWidth, h = g.el.offsetHeight;
    let x = clamp(_p.x, w / 2 + 8, J.ancho - w / 2 - 8), y = Math.max(_p.y, h + 70);
    for (let n = 0; n < 4 && ocup.some((o) => Math.abs(o[0] - x) < (o[2] + w) / 2 && Math.abs(o[1] - y) < h + 4); n++) y -= h + 6;
    ocup.push([x, y, w]);
    const k = Math.min(1, g.t / 0.2) * Math.min(1, (g.dur - g.t) / 0.35);
    g.el.style.opacity = k;
    g.el.style.transform = `translate(${x - w / 2}px, ${y - h - (1 - k) * 8}px)`;
  }
}

/* ── avisos y tarjetas ── */
let relojA = null;
export function aviso(t) { const e = $("#aviso"); e.textContent = t; e.classList.add("ver"); clearTimeout(relojA); relojA = setTimeout(() => e.classList.remove("ver"), 3200); }
export function abrirTarjeta(html) { $("#tarjeta").innerHTML = html; $("#capa").classList.remove("oculto"); J.pausaSuave = true; }
export function cerrarTarjeta() { $("#capa").classList.add("oculto"); J.pausaSuave = false; if (J.alCerrarTarjeta) { const f = J.alCerrarTarjeta; J.alCerrarTarjeta = null; f(); } }
export const tarjetaAbierta = () => !$("#capa").classList.contains("oculto");
export function anilloLuna(x, y, k) { const a = $("#anilloLuna"); a.style.opacity = k > 0 ? 1 : 0; if (k > 0) { a.style.transform = `translate(${x - 50}px, ${y - 50}px)`; a.querySelector("circle").style.strokeDashoffset = 277 * (1 - k); } }

/* ══════════════════ LOS DEDOS ══════════════════ */
const lienzo = document.getElementById("lienzo");
const dedos = new Map();   // id → { x0, y0, x, y, t0, tipo }
let joy = null, pinza = null;
const joyEl = () => $("#joy");
lienzo.addEventListener("pointerdown", (e) => {
  J.alTocarAlgo && J.alTocarAlgo();
  const d = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), tipo: "?" };
  dedos.set(e.pointerId, d);
  try { lienzo.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
  if (dedos.size === 2) {
    const [a, b] = [...dedos.values()];
    if (a.tipo === "joy") return;   // joystick + otro dedo: el otro gira la cámara
    // ¿los dos sobre la luna? entonces no es pinza
    if (J.sobreLuna && J.sobreLuna(a.x, a.y) && J.sobreLuna(b.x, b.y)) { a.tipo = b.tipo = "luna"; J.lunaDedos = { t0: performance.now() }; return; }
    a.tipo = b.tipo = "pinza"; pinza = Math.hypot(a.x - b.x, a.y - b.y);
    return;
  }
  if (e.pointerType === "mouse" && e.button !== 0) { d.tipo = "cam"; return; }
  if (e.clientX < J.ancho * 0.45 && e.clientY > J.alto * 0.3 && !joy && e.clientX > 46) {
    d.tipo = "joy"; joy = d; const j = joyEl(); j.classList.add("ver"); j.style.transform = `translate(${d.x0 - 60}px, ${d.y0 - 60}px)`;
  }
});
lienzo.addEventListener("pointermove", (e) => {
  const d = dedos.get(e.pointerId); if (!d) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  d.x = e.clientX; d.y = e.clientY;
  if (d.tipo === "luna") return;
  if (d.tipo === "pinza" && dedos.size >= 2) { const [a, b] = [...dedos.values()]; const n = Math.hypot(a.x - b.x, a.y - b.y); E.zoom += (pinza - n) * 0.05; pinza = n; return; }
  if (d.tipo === "joy") {
    let jx = d.x - d.x0, jy = d.y - d.y0; const m = Math.hypot(jx, jy), R = 52;
    if (m > R) { d.x0 += (jx / m) * (m - R); d.y0 += (jy / m) * (m - R); jx = d.x - d.x0; jy = d.y - d.y0; joyEl().style.transform = `translate(${d.x0 - 60}px, ${d.y0 - 60}px)`; }
    E.mx = jx / R; E.mz = jy / R; E.mag = Math.min(1, Math.hypot(jx, jy) / R);
    joyEl().querySelector("i").style.transform = `translate(${jx}px, ${jy}px)`;
    return;
  }
  if (d.tipo === "?" && Math.hypot(d.x - d.x0, d.y - d.y0) > 9) d.tipo = "cam";
  if (d.tipo === "cam") { E.camDX += dx; E.camDY += dy; }
});
function soltar(e) {
  const d = dedos.get(e.pointerId); if (!d) return;
  dedos.delete(e.pointerId);
  if (d.tipo === "joy") { joy = null; E.mx = E.mz = E.mag = 0; joyEl().classList.remove("ver"); joyEl().querySelector("i").style.transform = ""; }
  if (d.tipo === "luna") { J.lunaDedos = null; for (const o of dedos.values()) if (o.tipo === "luna") o.tipo = "x"; }
  if (d.tipo === "?" && performance.now() - d.t0 < 450 && J.alTocar) J.alTocar(d.x, d.y);
}
lienzo.addEventListener("pointerup", soltar);
lienzo.addEventListener("pointercancel", soltar);
lienzo.addEventListener("wheel", (e) => { E.zoom += e.deltaY * 0.01; e.preventDefault(); }, { passive: false });
lienzo.addEventListener("contextmenu", (e) => e.preventDefault());

const teclas = new Set();
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  J.alTocarAlgo && J.alTocarAlgo();
  const k = e.key.toLowerCase();
  if (!teclas.has(k)) {
    if (k === " ") { E.saltar = true; E.subir = true; }
    if (k === "f") E.golpe = true;
    if (k === "r") E.golpeFuerte = true;
    if (k === "e") E.accion = true;
    if (k === "g") E.dios = true;
    if (k === "q") { E.poder = true; E.poderSostenido = true; }
    if (k >= "1" && k <= "9" && J.elegirPoderN) J.elegirPoderN(+k - 1);
    if (k === "escape" && tarjetaAbierta()) cerrarTarjeta();
  }
  teclas.add(k);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  teclado();
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase(); teclas.delete(k);
  if (k === " ") E.subir = false;
  if (k === "q") { E.poderSostenido = false; E.poderSuelto = true; }
  teclado();
});
function teclado() {
  if (joy) return;
  const x = (teclas.has("d") || teclas.has("arrowright") ? 1 : 0) - (teclas.has("a") || teclas.has("arrowleft") ? 1 : 0);
  const z = (teclas.has("s") || teclas.has("arrowdown") ? 1 : 0) - (teclas.has("w") || teclas.has("arrowup") ? 1 : 0);
  const m = Math.hypot(x, z) || 1;
  E.mx = x / m; E.mz = z / m; E.mag = x || z ? 1 : 0;
  E.correr = teclas.has("shift");
  E.bajar = teclas.has("c") || teclas.has("control");
}
/* Lo que se consume una vez por cuadro. */
export function limpiarEntrada() { E.saltar = false; E.golpe = false; E.golpeFuerte = false; E.accion = false; E.poder = false; E.poderSuelto = false; E.dios = false; E.camDX = 0; E.camDY = 0; E.zoom = 0; }
export const dedosEnLuna = () => [...dedos.values()].filter((d) => d.tipo === "luna");
