/**
 * MENSAJITOS — el chat de los dos (Fase 30), dentro de Detallitos.
 *
 *   · burbujas: las tuyas a la derecha (rosas), las suyas a la izquierda, por día
 *     («Hoy», «Ayer»…) y pegaditas cuando se mandan seguido; sólo emojis = grandotes
 *   · GIFs de GIPHY como mensajito, y stickers pegados ENCIMA de cualquier mensajito:
 *     eliges uno, tocas dónde y ahí se queda, chuequito (los ven los dos)
 *   · tocar un mensajito: reaccionar a lo suyo (las mismas seis de las páginas, con su
 *     fiesta), pegarle un sticker, copiarlo o borrar lo tuyo (para los dos)
 *   · se sube para ver lo de antes (de a poquito); lo nuevo llega solo mientras está
 *     abierto, con su sonido, y se marca como visto
 *   · todo lo que escriben se pone como TEXTO, nunca como HTML
 */
import { el, aviso, confirmar, debounce } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as G from "../integraciones/giphy.js";
import * as PF from "./perfil.js";
import { REACCIONES, reaccion, svgReaccion, estallido } from "./reacciones.js";
import { sinMovimiento as reducido } from "./transiciones.js";

export const ICONO_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.4 5.8l-.8 3.6 3.9-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.3 9-7.4S17 3.6 12 3.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 13.8s-2.8-1.6-3.4-3.3c-.4-1.3.4-2.5 1.6-2.5.8 0 1.4.5 1.8 1.1.4-.6 1-1.1 1.8-1.1 1.2 0 2 1.2 1.6 2.5-.6 1.7-3.4 3.3-3.4 3.3z" fill="currentColor"/></svg>';
const ENVIAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 10.9 19.4 4.3c.9-.4 1.8.5 1.4 1.4l-6.6 15.8c-.4.9-1.7.8-1.9-.1l-1.5-6.2-6.2-1.5c-.9-.2-1-1.5-.1-1.9z" fill="currentColor"/><path d="m11 13 4.2-4.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/></svg>';
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const CADA = 3500;              // cada cuánto se pregunta si hay algo nuevo (con el chat abierto)
const SEGUIDOS = 4 * 60 * 1000; // los de menos de 4 minutos, del mismo, van pegaditos
const SUGERIDOS = { gifs: ["te amo", "abrazo", "beso", "te extraño", "buenas noches", "jaja", "gatito"], stickers: ["love", "corazón", "abrazo", "beso", "gatito", "osito", "flores"] };
const PRIMEROS = ["Te amo 🤍", "Te extraño 🥺", "¿Cómo amaneciste, mi amor?", "Buenas noches, mi vida 🌙"];

const real = (m) => typeof m.id === "number";
const orden = (a, b) => (real(a) ? 0 : 1) - (real(b) ? 0 : 1) || (real(a) && real(b) ? a.id - b.id : 0);
const firma = (m) => JSON.stringify([m.texto, m.gif?.u, m.reaccion, m.visto, (m.stickers || []).length]);
const diaDe = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const hora = (iso) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
function nombreDia(iso) {
  const d = new Date(iso), h = new Date();
  const n = Math.round((new Date(h.getFullYear(), h.getMonth(), h.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (n === 0) return "Hoy";
  if (n === 1) return "Ayer";
  const t = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", ...(d.getFullYear() !== h.getFullYear() ? { year: "numeric" } : {}) });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
/** Sólo uno, dos o tres emojis: se ven grandotes, sin burbuja. */
function soloEmoji(t) {
  const s = (t || "").replace(/\s/g, "");
  if (!s || s.length > 24 || /^[\d#*]+$/.test(s) || !/^[\p{Extended_Pictographic}\p{Emoji_Component}‍️]+$/u.test(s)) return false;
  return ("Segmenter" in Intl ? [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(s)].length : [...s].length) <= 3;
}
const juntos = (a, b) => !!(a && b && a.mio === b.mio && diaDe(a.creado) === diaDe(b.creado) && Math.abs(new Date(b.creado) - new Date(a.creado)) < SEGUIDOS);
const mensajeError = (e) => (e?.status === 404 ? `Tu ${SRV.NOMBRE} todavía no sabe de mensajitos: actualízalo («librito actualizar»).` : e?.message || "No se pudo.");

/** La pantalla del chat. `det` es Detallitos (su capa, su app, su amorcito y sus limpiezas). */
export function vistaChat(det) {
  const app = det.app, son = app.sonidos;
  const nombre = PF.nombreDe(det.amor?.pareja) || "tu amorcito";
  const S = { ms: [], nodos: new Map(), dias: new Map(), nuevos: new Set(), ultimo: 0, desde: 0, hayMas: false, antes: false, vivo: true, pegado: true, sinVer: 0, temp: 0, pegar: null, destino: null, menu: null, listo: false };

  /* — Lo que se ve — */
  const lista = el("div.ch-lista", { role: "log", "aria-label": `Mensajitos con ${nombre}`, "aria-live": "polite" });
  const inicio = el("div.ch-inicio");
  const vacio = el("div.ch-vacio", {}, [
    el("i.ch-vacio-ico", { html: ICONO_CHAT }),
    el("b", { text: "Su chat empieza aquí" }),
    el("p", { text: `Mándale el primer mensajito a ${nombre}: texto, un GIF o un sticker encima.` }),
    el("div.ch-sugeridos", {}, PRIMEROS.map((t) => el("button.ch-sugerido", { type: "button", text: t, onClick: () => { input.value = t; alEscribir(); input.focus(); } }))),
  ]);
  const bajarT = el("span");
  const bajar = el("button.ch-bajar", { type: "button", hidden: "", "aria-label": "Ir a lo más nuevo", onClick: () => alFondo(true) }, [el("i", { html: ico("abajo") }), bajarT]);
  const input = el("textarea.ch-input", { rows: 1, maxlength: 2000, placeholder: `Escríbele a ${nombre}…`, "aria-label": "Tu mensajito", enterkeyhint: "send", autocomplete: "off", onInput: () => alEscribir() });
  const bGif = el("button.ch-b.ch-b-gif", { type: "button", "aria-label": "Mandar un GIF", "aria-expanded": "false", html: "<b>GIF</b>", onClick: () => panel("gifs") });
  const bSt = el("button.ch-b", { type: "button", "aria-label": "Pegar un sticker encima de un mensajito", "aria-expanded": "false", html: ico("sticker"), onClick: () => panel("stickers") });
  const bMandar = el("button.ch-mandar.vacio", { type: "button", "aria-label": "Mandar", html: ENVIAR, onClick: () => mandarTexto() });
  // Tocar «Mandar» no le quita el teclado al campo (en el teléfono se queda abierto para seguir escribiendo).
  bMandar.addEventListener("mousedown", (e) => e.preventDefault());
  const escribir = el("div.ch-escribir", {}, [bGif, bSt, el("div.ch-caja", {}, [input]), bMandar]);
  const pegandoImg = el("img", { alt: "", referrerpolicy: "no-referrer", draggable: "false" });
  const pegandoT = el("span");
  const pegando = el("div.ch-pegando", { hidden: "", role: "status" }, [pegandoImg, pegandoT, el("button.ch-pegando-x", { type: "button", text: "Cancelar", onClick: () => salirPegar() })]);

  /* — GIFs y stickers de GIPHY — */
  const P = { tipo: "", q: "", sig: 0, total: 0, cargando: false, ctl: null };
  const tabs = ["gifs", "stickers"].map((t) => el("button.ch-tab", { type: "button", role: "tab", dataset: { t }, text: t === "gifs" ? "GIFs" : "Stickers", onClick: () => { if (P.tipo !== t) panel(t); } }));
  const buscar = el("input.ch-buscar", { type: "search", enterkeyhint: "search", autocomplete: "off", "aria-label": "Buscar en GIPHY" });
  const chips = el("div.ch-chips");
  const rejilla = el("div.ch-rejilla");
  const panelN = el("div.ch-panel", { hidden: "", role: "dialog", "aria-label": "GIFs y stickers" }, [
    el("div.ch-panel-cab", {}, [el("div.ch-tabs", { role: "tablist" }, tabs), el("button.ch-panel-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: () => panel(null) })]),
    el("label.ch-buscar-caja", {}, [el("i", { html: ico("buscar") }), buscar]),
    chips, rejilla,
    el("small.ch-giphy", { text: "Con GIPHY" }),
  ]);
  const raiz = el("section.dt-pantalla.ch", {}, [el("div.ch-marco", {}, [lista, bajar]), panelN, pegando, escribir]);

  /* — Una burbuja — */
  function nodo(m) {
    const rx = reaccion(m.reaccion), em = !m.gif && soloEmoji(m.texto);
    const b = el("button.ch-burbuja" + (m.gif ? ".gif" : "") + (em ? ".emoji" : ""), { type: "button", "aria-haspopup": "menu", "aria-label": `${m.mio ? "Tú" : nombre}: ${m.texto || "un GIF"}${rx ? ", " + rx.corto : ""}` });
    if (m.gif) {
      const k = Math.min(1, 230 / m.gif.w, 260 / m.gif.h);
      const im = el("img.ch-gif", { src: m.gif.u, alt: "GIF", width: Math.round(m.gif.w * k), height: Math.round(m.gif.h * k), decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      im.addEventListener("load", () => { if (S.pegado) alFondo(false); }, { once: true });
      b.append(im);
    }
    if (m.texto) b.append(el("span.ch-texto", { text: m.texto }));
    if (m.stickers?.length) b.append(el("span.ch-pegados", { "aria-hidden": "true" }, m.stickers.map((st) => {
      const i = el("img.ch-sticker", { src: st.u, alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      i.style.left = (st.x * 100).toFixed(1) + "%"; i.style.top = (st.y * 100).toFixed(1) + "%";
      i.style.setProperty("--r", (+st.r || 0) + "deg"); i.style.setProperty("--s", +st.s || 1);
      return i;
    })));
    if (rx) b.append(el("span.ch-rx", { title: m.mio ? `${nombre} ${rx.largo}` : rx.tuyo, html: svgReaccion(rx.id) }));
    const f = el("div.ch-fila." + (m.mio ? "mio" : "suyo") + (m._enviando ? ".enviando" : "") + (rx ? ".con-rx" : ""), { dataset: { id: String(m.id) } }, [
      m.mio ? null : el("span.ch-av", {}, [PF.avatar("pareja", "ch-av-i")]),
      el("div.ch-cuerpo", {}, [b, el("small.ch-hora")]),
    ]);
    b.addEventListener("click", (e) => tocar(e, f));
    return f;
  }

  /** Pone la lista al día moviendo sólo lo que cambió (lo que ya está no se vuelve a animar ni a cargar). */
  function pintar() {
    const hijos = [inicio];
    let prev = null, ultimoMio = null;
    for (const m of S.ms) if (m.mio && real(m)) ultimoMio = m;
    S.ms.forEach((m, i) => {
      const dk = diaDe(m.creado);
      if (!prev || diaDe(prev.creado) !== dk) {
        let d = S.dias.get(dk);
        if (!d) S.dias.set(dk, (d = el("div.ch-dia", {}, [el("span", { text: nombreDia(m.creado) })])));
        hijos.push(d);
        prev = null;
      }
      let f = S.nodos.get(m.id);
      if (!f) { f = nodo(m); S.nodos.set(m.id, f); }
      if (S.nuevos.delete(m.id) && !reducido()) { f.classList.add("llega"); setTimeout(() => f.classList.remove("llega"), 600); }
      const fin = !juntos(m, S.ms[i + 1]);
      f.classList.toggle("primero", !juntos(prev, m));
      f.classList.toggle("ultimo", fin);
      f.querySelector(".ch-hora").textContent = m._enviando ? "Mandando…" : fin ? hora(m.creado) + (m === ultimoMio && m.visto ? " · Visto" : "") : "";
      hijos.push(f);
      prev = m;
    });
    if (!S.ms.length && S.listo) hijos.push(vacio);
    const quiero = new Set(hijos);
    for (const n of [...lista.children]) if (!quiero.has(n)) n.remove();
    let ref = lista.firstChild;
    for (const n of hijos) { if (n === ref) { ref = ref.nextSibling; continue; } lista.insertBefore(n, ref); }
  }
  function pintarInicio() {
    inicio.replaceChildren(...(S.hayMas ? [el("i.ch-girando")] : S.ms.length ? [
      el("span.ch-inicio-av", {}, [PF.avatar("yo", "ch-av-i"), el("i", { html: ico("corazon") }), PF.avatar("pareja", "ch-av-i")]),
      el("small", { text: `Aquí empieza su chat` }),
    ] : []));
  }

  /* — Moverse — */
  const cerca = () => lista.scrollHeight - lista.scrollTop - lista.clientHeight < 140;
  function alFondo(suave) {
    lista.scrollTo({ top: lista.scrollHeight, behavior: suave && !reducido() ? "smooth" : "auto" });
    S.sinVer = 0; bajar.hidden = true; S.pegado = true;
  }
  lista.addEventListener("scroll", () => {
    S.pegado = cerca();
    if (S.menu) colocarMenu();
    if (S.pegado && !bajar.hidden) { S.sinVer = 0; bajar.hidden = true; }
    if (lista.scrollTop < 160 && S.hayMas && !S.antes) cargarAntes();
  }, { passive: true });
  // Si TÚ deslizas, el menú de un mensajito se cierra (si se mueve solo, porque llegó algo, no).
  for (const t of ["wheel", "touchmove"]) lista.addEventListener(t, () => { if (S.menu) cerrarMenu(); }, { passive: true });

  /* — Hablar con el servidor — */
  async function cargar() {
    lista.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Abriendo sus mensajitos…" })]));
    try {
      const d = await SRV.chat({ n: 40 });
      if (!S.vivo) return;
      lista.replaceChildren();
      S.ms = d.mensajes.slice().sort(orden); S.hayMas = !!d.hay_mas; S.desde = d.ahora; S.listo = true;
      S.ultimo = Math.max(0, ...S.ms.map((m) => m.id));
      pintarInicio(); pintar(); alFondo(false);
      requestAnimationFrame(() => alFondo(false));
      if (S.ms.some((m) => !m.mio && !m.visto)) marcarVistos();
      latir();
    } catch (e) {
      if (!S.vivo) return;
      lista.replaceChildren(el("div.ch-vacio", {}, [el("i.ch-vacio-ico", { html: ICONO_CHAT }), el("p", { text: mensajeError(e) }), el("button.ch-sugerido", { type: "button", text: "Intentar otra vez", onClick: () => cargar() })]));
    }
  }
  async function cargarAntes() {
    const primero = S.ms.find(real);
    if (!primero) return;
    S.antes = true;
    try {
      const d = await SRV.chat({ n: 30, antes: primero.id });
      if (!S.vivo) return;
      const h0 = lista.scrollHeight, t0 = lista.scrollTop, ya = new Set(S.ms.map((m) => m.id));
      S.ms = [...d.mensajes.filter((m) => !ya.has(m.id)), ...S.ms].sort(orden);
      S.hayMas = !!d.hay_mas;
      pintarInicio(); pintar();
      lista.scrollTop = t0 + (lista.scrollHeight - h0);
    } catch (e) { /* al volver a subir */ }
    finally { S.antes = false; }
  }
  let reloj = 0;
  const latir = () => { clearTimeout(reloj); if (S.vivo) reloj = setTimeout(sondear, CADA); };
  async function sondear() {
    if (!S.vivo) return;
    if (!document.hidden) {
      try {
        const d = await SRV.chat(S.ultimo ? { despues: S.ultimo, desde: S.desde } : { n: 40 });
        if (!S.vivo) return;
        S.desde = d.ahora;
        recibir(d.mensajes || [], d.cambios || []);
      } catch (e) { /* sin conexión: la próxima */ }
    }
    latir();
  }
  const alVolver = () => { if (!document.hidden && S.listo) sondear(); };
  document.addEventListener("visibilitychange", alVolver);
  const marcarVistos = () => SRV.chatVistos().then(() => dispatchEvent(new CustomEvent("ed-chat-visto"))).catch(() => {});

  /** Lo que llegó (nuevos) y lo que cambió (reacciones, stickers, vistos, borrados). */
  function recibir(nuevos, cambios, propio = false) {
    const pegado = cerca();
    let llegaron = 0, suyo = false;
    for (const m of nuevos) {
      if (m.borrado || S.nodos.has(m.id)) continue;
      S.ms.push(m); S.nuevos.add(m.id); llegaron++;
      if (!m.mio) suyo = true;
    }
    S.ms.sort(orden);
    S.ultimo = Math.max(S.ultimo, ...S.ms.filter(real).map((m) => m.id));
    for (const c of cambios) {
      const a = S.ms.find((m) => m.id === c.id);
      if (!a) continue;
      if (c.borrado) { quitar(c.id); continue; }
      if (firma(a) === firma(c)) continue;
      aplicar(c);
      if (c.mio && c.reaccion && c.reaccion !== a.reaccion) festejar(c);
      const st = c.stickers || [];
      if (st.length > (a.stickers || []).length && !st[st.length - 1].mio) son?.sonar("sticker-pegar");
    }
    pintar();
    if (llegaron) {
      if (pegado || propio) alFondo(true);
      else { S.sinVer += llegaron; bajarT.textContent = S.sinVer === 1 ? "1 nuevo" : `${S.sinVer} nuevos`; bajar.hidden = false; }
    }
    if (suyo) { son?.sonar("mensaje-llega"); if (!document.hidden) marcarVistos(); }
  }

  /** Cambia un mensajito por su versión nueva (en su lugar). */
  function aplicar(m) {
    const i = S.ms.findIndex((x) => x.id === m.id);
    if (i < 0) return;
    const antes = S.ms[i];
    S.ms[i] = m;
    const viejo = S.nodos.get(m.id), n = nodo(m);
    S.nodos.set(m.id, n);
    if (viejo?.isConnected) viejo.replaceWith(n);
    const n0 = (antes.stickers || []).length;
    n.querySelectorAll(".ch-sticker").forEach((s, k) => { if (k >= n0) s.classList.add("nuevo"); });
    if (m.reaccion && m.reaccion !== antes.reaccion) n.querySelector(".ch-rx")?.classList.add("nueva");
    pintar();
  }
  function quitar(id) {
    const f = S.nodos.get(id);
    S.ms = S.ms.filter((m) => m.id !== id);
    S.nodos.delete(id);
    if (f?.isConnected && !reducido()) f.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.6)" }], { duration: 260, easing: "ease-in" }).onfinish = () => pintar();
    else pintar();
  }
  /** Tu amorcito reaccionó a lo tuyo, con el chat abierto: su fiesta. */
  function festejar(m) {
    son?.sonar("reaccion-" + m.reaccion);
    const r = S.nodos.get(m.id)?.querySelector(".ch-rx")?.getBoundingClientRect();
    const l = lista.getBoundingClientRect();
    if (r && r.bottom > l.top && r.top < l.bottom) estallido(r.left + r.width / 2, r.top + r.height / 2, m.reaccion);
  }

  /* — Mandar — */
  function alEscribir() {
    input.style.height = "auto";
    input.style.height = Math.min(124, input.scrollHeight) + "px";
    bMandar.classList.toggle("vacio", !input.value.trim());
    if (!panelN.hidden && input.value) panel(null);
  }
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); mandarTexto(); }
  });
  input.addEventListener("focus", () => { if (!panelN.hidden) panel(null); if (S.pegado) setTimeout(() => alFondo(false), 260); });
  function mandarTexto() {
    const t = input.value.trim();
    if (!t) { input.focus(); return; }
    input.value = ""; alEscribir();
    mandar({ texto: t });
  }
  async function mandar({ texto = "", gif = null }) {
    const t = { id: "t" + ++S.temp, mio: true, texto, gif, creado: new Date().toISOString(), visto: "", reaccion: "", stickers: [], _enviando: true };
    S.ms.push(t); S.ms.sort(orden); S.nuevos.add(t.id); S.listo = true;
    pintar(); alFondo(true);
    son?.sonar("mensaje-enviar");
    try {
      const m = await SRV.mandarMensaje({ texto, gif });
      if (!S.vivo) return true;
      // La burbuja que ya se ve se queda (no se vuelve a animar): sólo pasa a ser la de verdad.
      const f = S.nodos.get(t.id);
      S.ms = S.ms.filter((x) => x !== t);
      S.nodos.delete(t.id);
      if (!S.nodos.has(m.id)) {
        S.ms.push(m); S.ms.sort(orden);
        if (f) { f.dataset.id = String(m.id); f.classList.remove("enviando"); S.nodos.set(m.id, f); }
      } else f?.remove();
      S.ultimo = Math.max(S.ultimo, m.id);
      pintar();
      return true;
    } catch (e) {
      S.nodos.get(t.id)?.remove();
      S.nodos.delete(t.id);
      S.ms = S.ms.filter((x) => x !== t);
      pintar();
      if (texto && !input.value) { input.value = texto; alEscribir(); }
      aviso(mensajeError(e), 5000, "error");
      son?.sonar("error");
      return false;
    }
  }

  /* — Tocar un mensajito: su menú (o, pegando un sticker, ahí se pega) — */
  const deFila = (f) => S.ms.find((m) => String(m.id) === f.dataset.id);
  function tocar(e, f) {
    const m = deFila(f);
    if (!m || !real(m)) return;
    if (S.pegar) { pegarEn(m, f, e); return; }
    abrirMenu(m, f, e.detail === 0);
  }
  function abrirMenu(m, f, conTeclado) {
    cerrarMenu();
    const b = f.querySelector(".ch-burbuja");
    const partes = [];
    if (!m.mio) partes.push(el("div.ch-menu-rx", { role: "group", "aria-label": "Reaccionar" }, REACCIONES.map((r) => el("button.ch-menu-rxb" + (m.reaccion === r.id ? ".on" : ""), {
      type: "button", title: r.corto, "aria-label": r.corto, "aria-pressed": String(m.reaccion === r.id), html: svgReaccion(r.id), onClick: () => reaccionar(m, r.id),
    }))));
    partes.push(el("div.ch-menu-acc", {}, [
      el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("sticker", "Pegarle un sticker"), onClick: () => { cerrarMenu(); S.destino = m.id; panel("stickers"); } }),
      m.texto ? el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("copiar", "Copiar"), onClick: async () => { cerrarMenu(); try { await navigator.clipboard.writeText(m.texto); aviso("Copiado"); } catch (err) { aviso("No se pudo copiar aquí", 2600, "error"); } } }) : null,
      m.mio ? el("button.ch-menu-b.peligro", { type: "button", role: "menuitem", html: I("borrar", "Borrar para los dos"), onClick: () => { cerrarMenu(); borrar(m); } }) : null,
    ]));
    const caja = el("div.ch-menu" + (m.mio ? ".mio" : ""), { role: "menu", "aria-label": "Qué hacer con este mensajito" }, partes);
    const velo = el("div.ch-velo", { onClick: () => cerrarMenu() });
    det.capa.append(velo, caja);
    b.classList.add("elegida");
    S.menu = { caja, velo, b, mio: m.mio };
    colocarMenu();
    son?.sonar("abrir");
    if (conTeclado) caja.querySelector("button")?.focus({ preventScroll: true });
  }
  /** Junto a su burbuja: arriba si cabe (si no, abajo), del lado de quien lo mandó; la sigue si la lista se mueve. */
  function colocarMenu() {
    const { caja, b, mio } = S.menu, r = b.getBoundingClientRect(), w = caja.offsetWidth, h = caja.offsetHeight;
    const x = Math.max(10, Math.min(innerWidth - w - 10, mio ? r.right - w : r.left));
    const arriba = r.top - h - 10 > 70;
    const y = arriba ? r.top - h - 10 : Math.min(innerHeight - h - 10, r.bottom + 10);
    caja.style.left = x + "px"; caja.style.top = Math.max(10, y) + "px";
    caja.style.transformOrigin = `${mio ? "right" : "left"} ${arriba ? "bottom" : "top"}`;
  }
  function cerrarMenu() {
    const m = S.menu;
    if (!m) return false;
    S.menu = null;
    m.b.classList.remove("elegida");
    m.velo.remove();
    if (reducido()) m.caja.remove();
    else m.caja.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.9)" }], { duration: 140, easing: "ease-in" }).onfinish = () => m.caja.remove();
    return true;
  }
  async function reaccionar(m, id) {
    const antes = S.ms.find((x) => x.id === m.id) || m, nueva = antes.reaccion === id ? "" : id;
    cerrarMenu();
    aplicar({ ...antes, reaccion: nueva });
    if (nueva) {
      son?.sonar("reaccion-" + nueva);
      const r = S.nodos.get(m.id)?.querySelector(".ch-burbuja")?.getBoundingClientRect();
      if (r) estallido(r.left + r.width / 2, r.top + r.height / 2, nueva);
    } else son?.sonar("reaccion-quitar");
    try { aplicar(await SRV.reaccionarMensaje(m.id, nueva)); }
    catch (e) { aplicar(antes); aviso(mensajeError(e), 4500, "error"); }
  }
  async function borrar(m) {
    if (!(await confirmar("¿Borrar este mensajito? Se borra para los dos.", "Borrar"))) return;
    try { await SRV.borrarMensaje(m.id); son?.sonar("borrar"); quitar(m.id); }
    catch (e) { aviso(mensajeError(e), 4000, "error"); }
  }

  /* — Pegar un sticker encima — */
  function modoPegar(st) {
    S.pegar = st;
    pegandoImg.src = st.u;
    pegandoT.textContent = S.destino ? "Toca dónde quieres pegarlo en su mensajito" : "Toca el mensajito donde lo quieres pegar";
    pegando.hidden = false;
    raiz.classList.add("pegando");
    const f = S.destino && S.nodos.get(S.destino);
    if (f) { f.classList.add("destino"); f.scrollIntoView({ block: "center", behavior: reducido() ? "auto" : "smooth" }); }
  }
  function salirPegar() {
    if (!S.pegar) return false;
    S.pegar = null;
    pegando.hidden = true;
    raiz.classList.remove("pegando");
    if (S.destino) S.nodos.get(S.destino)?.classList.remove("destino");
    S.destino = null;
    return true;
  }
  async function pegarEn(m, f, e) {
    const b = f.querySelector(".ch-burbuja"), r = b.getBoundingClientRect();
    const cl = (v) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
    // Con el dedo o el ratón, donde tocaste; con el teclado, en su esquinita de arriba.
    const x = e.detail === 0 ? (m.mio ? 0.1 : 0.9) : cl((e.clientX - r.left) / r.width);
    const y = e.detail === 0 ? 0.05 : cl((e.clientY - r.top) / r.height);
    const it = S.pegar.it, st = { u: S.pegar.u, x, y, r: Math.round(Math.random() * 280 - 140) / 10, s: 1 };
    salirPegar();
    const antes = S.ms.find((z) => z.id === m.id) || m;
    aplicar({ ...antes, stickers: [...(antes.stickers || []), { ...st, mio: true }] });
    son?.sonar("sticker-pegar");
    try { aplicar(await SRV.pegarSticker(m.id, st)); G.contar(it, "onsent"); }
    catch (err) { aplicar(antes); aviso(mensajeError(err), 4500, "error"); }
  }

  /* — El panel de GIFs y stickers — */
  function panel(tipo) {
    if (!tipo || (tipo === P.tipo && !panelN.hidden)) {
      if (panelN.hidden) return false;
      P.ctl?.abort();
      P.tipo = "";
      [bGif, bSt].forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-expanded", "false"); });
      if (reducido()) panelN.hidden = true;
      else panelN.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(18px) scale(.98)" }], { duration: 180, easing: "ease-in" }).onfinish = () => { if (!P.tipo) panelN.hidden = true; };
      if (!S.pegar) S.destino = null;
      son?.sonar("cerrar");
      return true;
    }
    const abriendo = panelN.hidden;
    P.tipo = tipo; P.q = "";
    buscar.value = "";
    buscar.placeholder = tipo === "gifs" ? "Busca un GIF…" : "Busca un sticker…";
    tabs.forEach((b) => { const on = b.dataset.t === tipo; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    [[bGif, "gifs"], [bSt, "stickers"]].forEach(([b, t]) => { b.classList.toggle("on", t === tipo); b.setAttribute("aria-expanded", String(t === tipo)); });
    chips.replaceChildren(...SUGERIDOS[tipo].map((q) => el("button.ch-chip", { type: "button", text: q, onClick: () => { buscar.value = q; P.q = q; marcarChip(); hacerBusqueda(true); } })));
    if (abriendo) {
      panelN.hidden = false;
      input.blur();
      if (!reducido()) panelN.animate([{ opacity: 0, transform: "translateY(24px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: "cubic-bezier(.2,.9,.3,1.15)" });
      son?.sonar("abrir");
      if (S.pegado) setTimeout(() => alFondo(false), 40);
    }
    hacerBusqueda(true);
    return true;
  }
  const marcarChip = () => chips.querySelectorAll(".ch-chip").forEach((c) => c.classList.toggle("on", c.textContent === P.q));
  buscar.addEventListener("input", debounce(() => { P.q = buscar.value.trim(); marcarChip(); hacerBusqueda(true); }, 380));
  async function hacerBusqueda(desde0) {
    if (!desde0 && (P.cargando || P.sig >= P.total)) return;
    P.ctl?.abort();
    const ctl = (P.ctl = new AbortController());
    if (desde0) { P.sig = 0; P.total = 0; rejilla.scrollTop = 0; rejilla.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Buscando…" })])); }
    P.cargando = true;
    const tipo = P.tipo;
    try {
      const r = await G.buscar(tipo, P.q || SUGERIDOS[tipo][0], P.sig, 24, ctl.signal);
      if (ctl !== P.ctl) return;
      if (desde0) rejilla.replaceChildren();
      P.sig = r.siguiente; P.total = r.total;
      for (const it of r.items) rejilla.append(mini(it, tipo));
      if (!rejilla.children.length) rejilla.append(el("p.ch-nada", { text: "No salió nada. Prueba con otra palabra." }));
    } catch (e) {
      if (e.name === "AbortError" || ctl !== P.ctl) return;
      rejilla.replaceChildren(el("p.ch-nada", { text: e instanceof G.SinConexion ? "GIPHY todavía no está conectado en este aparato. Conéctalo una vez en el editor, en la sección de GIFs." : e.message }));
    } finally { if (ctl === P.ctl) P.cargando = false; }
  }
  rejilla.addEventListener("scroll", () => { if (rejilla.scrollTop + rejilla.clientHeight > rejilla.scrollHeight - 320) hacerBusqueda(false); }, { passive: true });
  function mini(it, tipo) {
    const fw = it.im?.fixed_width || {};
    const g = { u: fw.webp || fw.url || it.mini, w: +fw.width || it.w || 200, h: +fw.height || it.h || 200 };
    const b = el("button.ch-mini" + (tipo === "stickers" ? ".st" : ""), { type: "button", "aria-label": it.titulo, title: it.titulo, style: { aspectRatio: `${g.w} / ${g.h}` } }, [
      el("img", { src: it.mini || g.u, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" }),
    ]);
    b.addEventListener("click", () => elegir(it, g, tipo));
    return b;
  }
  async function elegir(it, g, tipo) {
    G.contar(it, "onclick");
    if (tipo === "gifs") { panel(null); if (await mandar({ gif: g })) G.contar(it, "onsent"); return; }
    if (!S.ms.some(real)) { aviso("Primero mándale un mensajito: los stickers se pegan encima de ellos.", 3800); return; }
    const destino = S.destino;
    panel(null);
    S.destino = destino;
    modoPegar({ u: g.u, it });
  }

  /* — El teclado del iPhone no tapa lo que escribes — */
  const vv = window.visualViewport;
  const ajustarVV = () => {
    const c = det.capa;
    if (!vv || !c) return;
    const h = Math.round(vv.height), t = Math.round(vv.offsetTop);
    if (Math.abs(h - innerHeight) < 2 && t <= 0) { c.style.top = c.style.height = c.style.bottom = ""; }
    else { c.style.top = t + "px"; c.style.height = h + "px"; c.style.bottom = "auto"; }
    if (S.pegado) alFondo(false);
  };
  vv?.addEventListener("resize", ajustarVV);
  vv?.addEventListener("scroll", ajustarVV);

  // Atrás (o Esc): primero se cierra lo que esté abierto encima del chat.
  det._chatAtras = () => cerrarMenu() || salirPegar() || panel(null);
  det._limpiezas.push(() => {
    S.vivo = false;
    clearTimeout(reloj);
    P.ctl?.abort();
    document.removeEventListener("visibilitychange", alVolver);
    vv?.removeEventListener("resize", ajustarVV);
    vv?.removeEventListener("scroll", ajustarVV);
    if (S.menu) { S.menu.velo.remove(); S.menu.caja.remove(); S.menu = null; }
    if (det.capa) det.capa.style.top = det.capa.style.height = det.capa.style.bottom = "";
    det._chatAtras = null;
  });
  // Si había un aviso de «te mandó mensajitos», ya no hace falta: aquí están.
  const av = app.avisoChat;
  if (av?.isConnected) { av.classList.remove("ver"); setTimeout(() => av.remove(), 300); }
  cargar();
  return raiz;
}
