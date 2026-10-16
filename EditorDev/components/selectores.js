/**
 * SELECTORES DE LETRA Y DE COLOR — los mismos en todo el editor.
 *
 *   elegirLetra(ancla, leer, poner, { muestra })
 *       Pestañas (Recientes, Todas, A mano, Elegantes, Modernas, Divertidas,
 *       De máquina) y buscador. Cada letra se ve escrita con TU texto. Tocar
 *       una la aplica al momento (con un saltito y su palomita) y se puede
 *       seguir probando. Las letras se cargan mientras aparecen, no todas de
 *       golpe. Sin títulos pegajosos que tapen la primera de la lista.
 *
 *   elegirColor(ancla, { titulo, leer, poner, pagina })
 *       Cuadro de tono y barra de matiz que se arrastran con el dedo, el código
 *       (#rrggbb), cuentagotas (si el navegador lo tiene), los colores que ya
 *       hay en la página, los del tema, los recientes y una paleta.
 *       `poner(color, enVivo)`: mientras arrastras llega con enVivo = true y al
 *       soltar con false (quien lo usa junta todo en un solo «deshacer»).
 */
import { el, popover } from "./ui.js";

const RT = window.LibritoRT;
const GRUPOS = [["mano", "A mano"], ["serif", "Elegantes"], ["sans", "Modernas"], ["divertida", "Divertidas"], ["mono", "De máquina"]];
const nombreDe = (f) => String(f || "").split(",")[0].replace(/["']/g, "").trim();
const OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const leerLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
const recordar = (k, x, max) => { try { localStorage.setItem(k, JSON.stringify([x, ...leerLS(k).filter((y) => y !== x)].slice(0, max))); } catch (e) { /* sin memoria */ } };

/* ── Letras ──────────────────────────────────────────────────────── */
export function elegirLetra(ancla, leer, poner, { muestra } = {}) {
  const todas = Object.keys(RT.FUENTES);
  const texto = String(muestra || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 22) || "Te amo";
  const recientes = leerLS("editordev:letras").filter((f) => RT.FUENTES[f]).slice(0, 8);
  const tabs = [...(recientes.length ? [["recientes", "Recientes"]] : []), ["todas", "Todas"], ...GRUPOS.filter(([g]) => todas.some((f) => RT.FUENTES[f].tipo === g))];
  let tab = recientes.length ? "recientes" : "todas";
  const buscar = el("input.ed-txt.ed-buscar", { type: "search", placeholder: "Buscar letra…", enterkeyhint: "search", "aria-label": "Buscar letra" });
  const chips = el("div.ed-sel-chips", { role: "tablist" });
  const lista = el("div.ed-letras", { role: "listbox", "aria-label": "Letras" });
  // Cada letra se pide cuando aparece (de a varias juntas).
  const io = "IntersectionObserver" in window ? new IntersectionObserver((xs) => {
    const pedir = xs.filter((x) => x.isIntersecting).map((x) => x.target);
    if (!pedir.length) return;
    RT.cargarFuentes(pedir.map((b) => b.dataset.f), true).then(() => { for (const b of pedir) b.classList.add("cargada"); });
    for (const b of pedir) io.unobserve(b);
  }, { root: lista, rootMargin: "120px" }) : null;
  const pintarChips = () => {
    chips.textContent = "";
    for (const [k, t] of tabs) chips.append(el("button.ed-sel-chip" + (k === tab && !buscar.value.trim() ? ".on" : ""), { type: "button", role: "tab", text: t, onClick: () => { tab = k; buscar.value = ""; pintar(); } }));
  };
  const pintar = () => {
    const q = buscar.value.trim().toLowerCase();
    const actual = nombreDe(leer());
    const fs = q ? todas.filter((f) => f.toLowerCase().includes(q))
      : tab === "recientes" ? recientes
        : tab === "todas" ? todas
          : todas.filter((f) => RT.FUENTES[f].tipo === tab);
    lista.textContent = "";
    fs.forEach((f, i) => {
      const b = el("button.ed-letra" + (f === actual ? ".on" : ""), { type: "button", role: "option", "aria-selected": f === actual, dataset: { f }, style: { "--i": Math.min(i, 14) } }, [
        el("span.ed-letra-m", { text: texto, style: { fontFamily: RT.pilaFuente(f) } }),
        el("small", { text: f }),
        el("i.ed-letra-ok", { html: OK }),
      ]);
      b.addEventListener("click", () => {
        poner(f);
        recordar("editordev:letras", f, 8);
        for (const x of lista.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); }
        b.classList.remove("toca"); void b.offsetWidth; b.classList.add("toca");
      });
      if (io) io.observe(b); else b.classList.add("cargada");
      lista.append(b);
    });
    if (!fs.length) lista.append(el("p.ed-vacio-txt", { text: q ? "Ninguna letra con ese nombre." : "Todavía no hay letras recientes." }));
    pintarChips();
  };
  buscar.addEventListener("input", pintar);
  pintar();
  const p = popover(ancla, [el("b.ed-pop-t", { text: "Letra" }), buscar, chips, lista], { clase: "ed-pop-letras" });
  requestAnimationFrame(() => { const on = lista.querySelector(".on"); if (on) lista.scrollTop = on.offsetTop - lista.clientHeight / 2 + on.offsetHeight / 2; });
  // Al cerrarse, se deja de mirar.
  const quitar = p.nodo._cerrar;
  p.nodo._cerrar = () => { io?.disconnect(); quitar(); };
  return p;
}

/* ── Colores ─────────────────────────────────────────────────────── */
const PALETA = [
  "#ffffff", "#f6efe6", "#e8dccb", "#9a8f86", "#3b2a3f", "#000000",
  "#ffc4d9", "#ff8fb8", "#ff5c93", "#d8397a", "#a3101c", "#8e2f86",
  "#ffe08a", "#f7b787", "#ff9966", "#e0457f", "#c3b1e1", "#7c5cbf",
  "#9fd8c2", "#4fb39a", "#a7c7e7", "#3d6fd1", "#1b1035", "#d6b48c",
];
const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
export function normalHex(c) {
  let s = String(c || "").trim().toLowerCase();
  if (/^#?[0-9a-f]{3}$/.test(s)) s = "#" + s.replace("#", "").split("").map((x) => x + x).join("");
  if (/^[0-9a-f]{6}$/.test(s)) s = "#" + s;
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  const m = s.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
  return m ? "#" + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]) : null;
}
function aHsv(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}
function aHex({ h, s, v }) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return "#" + hex2(f(5) * 255) + hex2(f(3) * 255) + hex2(f(1) * 255);
}
/** Los colores que ya se usan en la página (sin repetir, los más usados primero). */
export function coloresDePagina(pagina) {
  const n = new Map();
  const sumar = (c) => { const h = normalHex(c); if (h) n.set(h, (n.get(h) || 0) + 1); };
  sumar(pagina?.fondo?.color);
  for (const e of pagina?.els || []) {
    sumar(e.texto?.color); sumar(e.forma?.relleno); sumar(e.forma?.trazo); sumar(e.dibujo?.color);
    sumar(e.boton?.fondo); sumar(e.boton?.color); sumar(e.trazo?.color); sumar(e.caja?.fondo); sumar(e.escena3d?.color);
  }
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 12);
}

export function elegirColor(ancla, { titulo = "Color", leer, poner, pagina = null, tema = null } = {}) {
  let hsv = aHsv(normalHex(leer()) || "#d8397a");
  let actual = aHex(hsv);
  const cuadro = el("div.ed-hsv", { role: "slider", "aria-label": "Saturación y brillo", tabindex: "0" }, [el("i.ed-hsv-p")]);
  const matiz = el("div.ed-matiz", { role: "slider", "aria-label": "Matiz", tabindex: "0" }, [el("i.ed-matiz-p")]);
  const muestra = el("span.ed-col-muestra");
  const hexIn = el("input.ed-txt.ed-col-hex", { type: "text", spellcheck: "false", autocomplete: "off", maxLength: 7, "aria-label": "Código del color" });
  const pintar = (desdeHex) => {
    cuadro.style.setProperty("--matiz", `hsl(${hsv.h} 100% 50%)`);
    cuadro.firstChild.style.left = hsv.s * 100 + "%";
    cuadro.firstChild.style.top = (1 - hsv.v) * 100 + "%";
    matiz.firstChild.style.left = (hsv.h / 360) * 100 + "%";
    muestra.style.background = actual;
    if (!desdeHex && document.activeElement !== hexIn) hexIn.value = actual;
    for (const b of caja.querySelectorAll(".ed-col-m")) b.classList.toggle("on", b.dataset.c === actual);
  };
  const usar = (c, enVivo) => {
    const h = normalHex(c);
    if (!h) return;
    actual = h;
    poner(h, !!enVivo);
    if (!enVivo) { recordar("editordev:colores", h, 12); dispatchEvent(new CustomEvent("ed-color")); }
  };
  const deUnColor = (c) => { const h = normalHex(c); if (!h) return; hsv = aHsv(h); usar(h, false); pintar(); };
  // Arrastrar (con un solo «deshacer» al soltar).
  const arrastre = (n, alMover) => {
    n.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      try { n.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      let rq = 0;
      const mover = (m) => {
        const r = n.getBoundingClientRect();
        alMover(Math.max(0, Math.min(1, (m.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (m.clientY - r.top) / r.height)));
        actual = aHex(hsv);
        pintar();
        if (!rq) rq = requestAnimationFrame(() => { rq = 0; usar(actual, true); });
      };
      const soltar = () => {
        n.removeEventListener("pointermove", mover); n.removeEventListener("pointerup", soltar); n.removeEventListener("pointercancel", soltar);
        cancelAnimationFrame(rq); rq = 0;
        usar(actual, false);
      };
      mover(ev);
      n.addEventListener("pointermove", mover); n.addEventListener("pointerup", soltar); n.addEventListener("pointercancel", soltar);
    });
  };
  arrastre(cuadro, (x, y) => { hsv.s = x; hsv.v = 1 - y; });
  arrastre(matiz, (x) => { hsv.h = x * 359.9; });
  // Con el teclado: flechas.
  cuadro.addEventListener("keydown", (e) => { const d = e.shiftKey ? 0.1 : 0.02; if (e.key === "ArrowLeft") hsv.s = Math.max(0, hsv.s - d); else if (e.key === "ArrowRight") hsv.s = Math.min(1, hsv.s + d); else if (e.key === "ArrowUp") hsv.v = Math.min(1, hsv.v + d); else if (e.key === "ArrowDown") hsv.v = Math.max(0, hsv.v - d); else return; e.preventDefault(); actual = aHex(hsv); pintar(); usar(actual, false); });
  matiz.addEventListener("keydown", (e) => { const d = e.shiftKey ? 20 : 4; if (e.key === "ArrowLeft") hsv.h = (hsv.h - d + 360) % 360; else if (e.key === "ArrowRight") hsv.h = (hsv.h + d) % 360; else return; e.preventDefault(); actual = aHex(hsv); pintar(); usar(actual, false); });
  hexIn.addEventListener("input", () => { const h = normalHex(hexIn.value); if (h) { hsv = aHsv(h); actual = h; pintar(true); usar(h, true); } });
  hexIn.addEventListener("change", () => { const h = normalHex(hexIn.value); if (h) deUnColor(h); else hexIn.value = actual; });
  const fila = (t, cs) => (cs.length ? el("div.ed-col-fila", {}, [el("small", { text: t }), el("div.ed-col-ms", {}, cs.map((c) => el("button.ed-col-m", { type: "button", title: c, "aria-label": c, dataset: { c }, style: { background: c }, onClick: () => deUnColor(c) })))]) : null);
  const gotero = "EyeDropper" in window ? el("button.ed-btn.chico.ico.ed-col-gotero", { type: "button", title: "Tomar un color de la pantalla", "aria-label": "Cuentagotas", html: '<svg viewBox="0 0 24 24"><path d="M15.5 3.5l5 5-2.3 2.3-1.4-1.4L9 17.2l-4.2 1.6 1.6-4.2 7.8-7.8-1.4-1.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>', onClick: async () => { try { const r = await new window.EyeDropper().open(); deUnColor(r.sRGBHex); } catch (e) { /* cancelado */ } } }) : null;
  const tem = tema ? [tema.texto, tema.acento, tema.fondo].map(normalHex).filter(Boolean) : [];
  const caja = el("div.ed-col", {}, [
    el("div.ed-col-arriba", {}, [muestra, hexIn, gotero].filter(Boolean)),
    cuadro,
    matiz,
    fila("En esta página", coloresDePagina(pagina)),
    fila("Del tema", [...new Set(tem)]),
    fila("Recientes", leerLS("editordev:colores").map(normalHex).filter(Boolean).slice(0, 12)),
    fila("Paleta", PALETA),
  ].filter(Boolean));
  pintar();
  return popover(ancla, [el("b.ed-pop-t", { text: titulo }), caja], { clase: "ed-pop-color" });
}
