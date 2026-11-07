/**
 * LAS HOJITAS de la casita: vestidor, pared y piso, el catálogo de «Acomodar», qué cocinar, el piano,
 * los ajustes de sonido y el menú flotante de los monitos. Reciben `j` (el juego) y le avisan lo que
 * eligió quien juega. (Los mensajes y las cartitas están en mensajes.js.)
 */
import { el, aviso, jalarParaCerrar } from "../ui.js";
import { ICO } from "./iconos.js";
import { monitoSVG, PIELES, COLOR_PELO, COLOR_OJOS, COLOR_ROPA, PEINADOS, ARRIBAS, ABAJOS, ACCESORIOS, CALZADOS, OJOS, PECAS } from "./monito.js";
import { CATALOGO, CATEGORIAS, deCategoria, colorDe, recetasDe, arteReceta } from "./catalogo/index.js";
import { CUARTOS, PAREDES, PATRONES, PISOS, cuarto } from "./cuartos.js";
import { SONIDOS } from "./sonidos.js";
import { PERFILES } from "./graficos.js";

/** Una hojita que sube desde abajo (se cierra con la ✕, jalando su pestañita o con Atrás). */
export function hoja(j, titulo, cuerpo, clase = "") {
  j.cerrarHoja();
  const cerrar = () => j.cerrarHoja();
  const h = el("section.ca-hoja" + (clase ? "." + clase : ""), { role: "dialog", "aria-label": titulo }, [
    el("i.ca-hoja-asa"),
    el("header", {}, [el("b", { text: titulo }), el("button.ca-hoja-x", { type: "button", "aria-label": "Cerrar", html: ICO.cerrar, onClick: cerrar })]),
    cuerpo,
  ]);
  j.raiz.append(h);
  jalarParaCerrar(h, cerrar, { asa: ".ca-hoja-asa" });
  requestAnimationFrame(() => h.classList.add("ver"));
  j.sonar("abrir");
  j.panel = h;
  return h;
}

const marcar = (b) => { for (const x of b.parentElement.children) x.classList.toggle("on", x === b); };
const chips = (lista, actual, al) => el("div.ca-ops", {}, lista.map(([k, t]) => { const b = el("button.ca-chip" + (actual === k ? ".on" : ""), { type: "button", text: t, onClick: () => { marcar(b); al(k); } }); return b; }));
const colores = (lista, actual, al) => el("div.ca-colores", {}, lista.map((c) => { const b = el("button.ca-color" + (actual === c ? ".on" : ""), { type: "button", "aria-label": "Color", style: { "--c": c }, onClick: () => { marcar(b); al(c); } }); return b; }));
const sec = (t, ...h) => el("section.ca-sec", {}, [el("b", { text: t }), ...h]);

/** El vestidor (botón, ropero o espejo): todo se ve al momento y se guarda solo. */
const ESTATURAS = [["0.88", "Más bajito"], ["0.94", "Bajito"], ["1", "Normal"], ["1.06", "Alto"], ["1.12", "Más alto"]];
export function vestidor(j) {
  const r = { ...j.yo.ropa };
  const vista = el("div.ca-vest-vista", { html: monitoSVG(r) });
  const poner = (c) => { Object.assign(r, c); vista.innerHTML = monitoSVG(r); j.vestir(r); j.sonar("pop", { volumen: 0.6 }); };
  hoja(j, "Vestidor", el("div.ca-vest", {}, [
    vista,
    el("div.ca-vest-ops", {}, [
      sec("Peinado", chips(PEINADOS, r.pelo, (k) => poner({ pelo: k })), colores(COLOR_PELO, r.peloColor, (c) => poner({ peloColor: c }))),
      sec("Ojitos", chips(OJOS, r.ojos || "redondos", (k) => poner({ ojos: k })), colores(COLOR_OJOS, r.ojosColor || COLOR_OJOS[0], (c) => poner({ ojosColor: c })), chips(PECAS, r.pecas || "no", (k) => poner({ pecas: k }))),
      sec("Arriba", chips(ARRIBAS, r.arriba, (k) => poner({ arriba: k })), colores(COLOR_ROPA, r.arribaColor, (c) => poner({ arribaColor: c }))),
      sec("Abajo", chips(ABAJOS, r.abajo, (k) => poner({ abajo: k })), colores(COLOR_ROPA, r.abajoColor, (c) => poner({ abajoColor: c }))),
      sec("Zapatitos", chips(CALZADOS, r.calzado || "tenis", (k) => poner({ calzado: k })), colores(COLOR_ROPA, r.zapatos, (c) => poner({ zapatos: c }))),
      sec("Accesorio", chips(ACCESORIOS, r.accesorio, (k) => poner({ accesorio: k }))),
      sec("Piel", colores(PIELES, r.piel, (c) => poner({ piel: c }))),
      // (Fase 65) La estatura de los dos monitos (se guarda para los dos).
      sec("Estatura", ...[["Tú", j.yoUsuario], [j.pareja, j.parejaUsuario]].map(([n, u]) => el("div.ca-estatura", {}, [el("small", { text: n }), chips(ESTATURAS, String(j.estaturaDe(u)), (k) => j.ponerEstatura(u, +k))]))),
    ]),
  ]), "vestidor");
}

/** «¿Qué cocinamos?»: las recetas de ese aparato (la estufa: sartén, olla y horno; el asador…). */
export function recetas(j, o, donde) {
  const LUGAR = { sarten: "Sartén", olla: "Olla", horno: "Horno", parrilla: "Asador", micro: "Micro", licuadora: "Licuadora" };
  hoja(j, "¿Qué cocinamos?", el("div.ca-recetas", {}, recetasDe(donde).map((rc) => el("button.ca-receta", { type: "button", "aria-label": `Cocinar ${rc.n}`, onClick: () => { j.cerrarHoja(); j.cocinar(o, rc.k); } }, [
    el("i.ca-receta-arte", { html: arteReceta(rc) }),
    el("b", { text: rc.n }),
    el("small", { text: `${LUGAR[rc.en] || ""} · ${Math.round(rc.ms / 1000)} s` }),
  ]))), "recetas");
}

/** El piano: tres octavas para tocar (cada tecla con su nota; se desliza a los lados). Sólo suena el piano,
 *  y tu amorcito lo oye si está cerca. */
export function piano(j, o) {
  const BLANCAS = [], NOMBRES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
  for (let oct = 48; oct <= 72; oct += 12) for (const d of [0, 2, 4, 5, 7, 9, 11]) BLANCAS.push(oct + d);
  BLANCAS.push(84);
  const tocar = (midi, b) => { j.tocarNota(o, midi); b.classList.remove("toca"); void b.offsetWidth; b.classList.add("toca"); };
  const tecla = (midi, negra, i) => {
    const b = el("button.ca-tecla" + (negra ? ".negra" : ""), { type: "button", "aria-label": negra ? "Tecla negra" : NOMBRES[i % 7], style: negra ? { "--i": i } : null });
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); tocar(midi, b); });
    b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tocar(midi, b); } });
    if (!negra) b.append(el("small", { text: NOMBRES[i % 7] }));
    return b;
  };
  const negras = [];
  BLANCAS.forEach((m, i) => { if (i < BLANCAS.length - 1 && [0, 1, 3, 4, 5].includes(i % 7)) negras.push(tecla(m + 1, true, i)); });
  const teclado = el("div.ca-teclado", { style: { "--n": BLANCAS.length } }, [...BLANCAS.map((m, i) => tecla(m, false, i)), ...negras]);
  const caja = el("div.ca-piano", {}, [teclado]);
  hoja(j, "Piano", el("div.ca-piano-marco", {}, [el("p.ca-nota", { text: `Desliza para ver más teclas. ${j.pareja} te oye si está cerquita.` }), caja]), "piano-hoja");
  // Empieza en el Do de en medio.
  requestAnimationFrame(() => { const b = teclado.children[7]; if (b) caja.scrollLeft = b.offsetLeft - 12; });
}

/** Ajustes de la casita: sus sonidos (aparte de los del editor), el volumen, la música y escuchar cada uno. */
export function ajustes(j) {
  const s = j.son, p = s.pref;
  const fila = (t, on, al) => { const b = el("button.ca-interruptor" + (on ? ".on" : ""), { type: "button", role: "switch", "aria-checked": String(on), "aria-label": t, onClick: () => { const v = !b.classList.contains("on"); b.classList.toggle("on", v); b.setAttribute("aria-checked", String(v)); al(v); } }, [el("i")]); return el("label.ca-ajuste", {}, [el("span", { text: t }), b]); };
  const vol = el("input.ca-vol", { type: "range", min: "0", max: "100", step: "5", value: String(Math.round((p.vol ?? 0.85) * 100)), "aria-label": "Volumen de los sonidos" });
  vol.addEventListener("input", () => s.ponerPref({ vol: +vol.value / 100 }));
  vol.addEventListener("change", () => j.sonar("pop"));
  const tuyos = s.tuyos();
  const lista = el("div.ca-sonidos", { hidden: "" }, SONIDOS.map(([n, cuando]) => el("button.ca-sonido-b", { type: "button", "aria-label": `Escuchar ${n}`, onClick: () => { if (n.startsWith("musica-")) j.probarMusica(n); else j.sonar(n); } }, [
    el("i", { html: ICO.play }), el("span", {}, [el("b", { text: n + (tuyos.includes(n) ? " · tuyo" : "") }), el("small", { text: cuando })]),
  ])));
  const verLista = el("button.ca-chip", { type: "button", text: "Escuchar cada sonido", onClick: () => { lista.hidden = !lista.hidden; verLista.textContent = lista.hidden ? "Escuchar cada sonido" : "Ocultar la lista"; } });
  hoja(j, "Ajustes de la casita", el("div.ca-deco", {}, [
    sec("Sonidos", fila("Sonidos del juego", p.on !== false, (v) => { s.ponerPref({ on: v }); if (v) j.sonar("ding"); }), el("label.ca-ajuste", {}, [el("span", { text: "Volumen" }), vol]), fila("Música de los aparatos", p.musica !== false, (v) => { s.ponerPref({ musica: v }); j.alCambiarMusica(); })),
    sec("Tus propios sonidos", el("p.ca-nota", { text: tuyos.length ? `Ya suenan ${tuyos.length} tuyos.` : "Todos suenan como de fábrica." }),
      el("p.ca-nota", { text: "Para cambiar uno, deja tu archivo (.mp3, .m4a, .ogg o .wav) en su carpeta, dentro de assets/sonidos-casita/ (cada sonido tiene la suya con su nombre), y súbelo." }), verLista, lista),
    sec("Gráficos", el("p.ca-nota", { text: "Elige cuánto se esfuerza tu teléfono. Si se calienta o va lento, baja un nivel." }),
      el("div.ca-gfx", { role: "radiogroup", "aria-label": "Perfil de gráficos" }, PERFILES.map(([k, t, d]) => {
        const b = el("button.ca-gfx-b" + (j.gfx === k ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(j.gfx === k), dataset: { k }, onClick: () => {
          for (const x of b.parentElement.children) { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", String(x === b)); }
          j.graficos(k); j.sonar("pop", { volumen: 0.6 });
        } }, [el("b", { text: t }), el("small", { text: d })]);
        return b;
      })),
      fila("Estilo pixel en las cosas", j.leerPixel(), (v) => j.pixel(v))),
    sec("La música del editor", el("p.ca-nota", { text: "Mientras juegan en la casita, la canción del editor se calla sola y vuelve al salir." })),
  ]), "ajustes");
}

/** El clima y la hora (los ven los dos). */
export function clima(j) {
  const ops = (lista, act, al) => el("div.ca-clima-ops", {}, lista.map(([k, t, ico]) => {
    const b = el("button.ca-clima-b" + (k === act ? ".on" : ""), { type: "button", dataset: { k }, "aria-pressed": String(k === act), onClick: () => {
      for (const x of b.parentElement.children) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }
      al(k);
    } }, [el("i", { html: ICO[ico] }), el("span", { text: t })]);
    return b;
  }));
  hoja(j, "El clima y la hora", el("div.ca-deco", {}, [
    sec("Clima", ops([["sol", "Soleado", "sol"], ["lluvia", "Lluvia", "lluvia"], ["tormenta", "Tormenta", "rayo"], ["extra", "Tormentota", "extra"]], j.climaActual(), (k) => j.ponerClima(k))),
    sec("Hora", ops([["dia", "Día", "sol"], ["tarde", "Tarde", "tarde"], ["noche", "Noche", "noche"], ["real", "La de verdad", "reloj"]], j.casa?.cuartos?.jardin?.hora || "real", (k) => j.ponerHora(k))),
    el("p.ca-nota", { text: `${j.pareja} ve el mismo clima y la misma hora.` }),
  ]), "clima");
}

/** Vaciar (al acomodar): este cuarto o toda la casa; se puede deshacer. */
export function vaciar(j) {
  const c = cuarto(j.cuartoActual);
  const op = (todo, t, d) => el("button.ca-vaciar-b" + (todo ? ".peligro" : ""), { type: "button", onClick: () => { j.cerrarHoja(); j.vaciar(todo); } }, [el("i", { html: ICO.vaciar }), el("span", {}, [el("b", { text: t }), el("small", { text: d })])]);
  hoja(j, "Vaciar", el("div.ca-deco", {}, [
    el("p.ca-nota", { text: "Quita todo de una vez. Si te arrepientes, toca «Deshacer»." }),
    op(false, "Vaciar este cuarto", `Todo lo de ${c.n}`),
    op(true, "Vaciar toda la casa", "Todos los cuartos quedan vacíos (no se vuelve a llenar sola)"),
  ]), "vaciar");
}

/** La pared y el piso del cuarto en el que estás. */
export function estiloCuarto(j) {
  const c = cuarto(j.cuartoActual), cfg = j.cfgCuarto(c.k);
  const poner = (v) => { j.ponerCuarto(c.k, v); j.sonar("pop", { volumen: 0.6 }); };
  hoja(j, `Pared y piso: ${c.n}`, el("div.ca-deco", {}, [
    c.afuera ? null : sec("Color de la pared", colores(PAREDES, cfg.pared, (p) => poner({ pared: p }))),
    c.afuera ? null : sec("Tapiz", chips(PATRONES, cfg.patron, (k) => poner({ patron: k }))),
    sec(c.afuera ? "Suelo" : "Piso", chips(PISOS, cfg.piso, (k) => poner({ piso: k }))),
  ].filter(Boolean)), "estilo");
}

/** (Fase 69) EL CAJÓN DE «ACOMODAR», NUEVO: una tiendita de cositas en pixel.
 *  · Arriba su asa (tócala o jálala para agrandarlo), un buscador y «Pared y piso».
 *  · Las categorías como chips con su dibujito, y las cosas en tarjetas con su imagen pixel nítida (se cargan al verse),
 *    con etiquetas de lo que se puede: «4 vistas» (se gira: de frente, de lado y de espaldas), «Encima» (va sobre mesas y estantes), «Nuevo».
 *  · Chiquito: dos filas que se deslizan de lado; toca para ponerla o ARRÁSTRALA hacia arriba y suéltala donde quieras.
 *  · Grande: todas en cuadrícula; tocar una la pone y el cajón se vuelve a hacer chiquito para que la veas. */
const sinAcentos = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** El dibujito de cada categoría (lo más reconocible de ella). */
const REPRESENTA = { sala: "sofa", cocina: "estufa", recamara: "cama", bano: "tina", estudio: "escritorio", cositas: "osito", adornos: "jarron_vidrio", plantas: "maceta", jardin: "arbolito", terraza: "hamaca", deco: "cuadro", techo: "foco_campana", limpieza: "escoba", mascotas: "gatito" };
const TINTE = { sala: "#ffd6e4", cocina: "#cdeedd", recamara: "#e4dafc", bano: "#d3ebfb", estudio: "#ffe2c9", cositas: "#fff0b8", adornos: "#ffd9ec", plantas: "#d6f2c6", jardin: "#cfeec0", rio: "#cdeefc", terraza: "#ffe0cc", deco: "#eadcff", techo: "#fff1c8", limpieza: "#d6eefa", mascotas: "#fff1c4", recientes: "#ffe3ec" };
/** La imagen pixel de una cosa, a escala entera (nítida), para la tarjeta o el chip. */
/* (Fase 73) Sin parpadeos: cada miniatura se hace UNA vez (se guarda su imagen y su tamaño) y ya no pasa primero por
   el dibujo liso: mientras se prepara queda su lugarcito vacío y luego aparece suavecito; la segunda vez sale al
   instante. Al abrir el cajón se van preparando solas, de pocas en pocas, en los ratos libres. */
const MINIS = new Map();
const tamMini = (nw, nh, caja, max) => { const f = Math.min(caja[0] / nw, caja[1] / nh), k = f < 1 ? f : Math.min(max, Math.floor(f)); return [Math.round(nw * k), Math.round(nh * k)]; };
const imgMini = (m) => { const im = new Image(); im.alt = ""; im.draggable = false; im.decoding = "sync"; im.width = m.w; im.height = m.h; im.src = m.url; return im; };
function miniPixel(d, caja, max = 5) {
  const clave = `${d.k}|${caja}|${max}`, ya = MINIS.get(clave);
  const i = el("i.ca-cat-mini.px");
  if (ya) { i.append(imgMini(ya)); return i; }
  i._cargar = () => {
    if (i._ya) return; i._ya = true;
    import("./girar.js").then((G) => G.vistaPlana(d, {}, colorDe(d, {}))).then((v) => {
      if (!v) { i.classList.remove("px"); i.innerHTML = d.arte({}, colorDe(d, {})); return; }
      const pre = new Image();
      pre.onload = () => {
        const [w, h] = tamMini(pre.naturalWidth, pre.naturalHeight, caja, max), m = { url: v.url, w, h };
        MINIS.set(clave, m);
        const im = imgMini(m); im.classList.add("llega");
        i.replaceChildren(im);
      };
      pre.src = v.url;
    }).catch(() => {});
  };
  return i;
}
/** (Fase 73) Prepara en los ratos libres las miniaturas que faltan (para que al deslizar ya estén listas). */
function prepararMinis(ds, caja, max = 5) {
  const faltan = ds.filter((d) => !MINIS.has(`${d.k}|${caja}|${max}`));
  const uno = () => {
    const d = faltan.shift(); if (!d) return;
    import("./girar.js").then((G) => G.vistaPlana(d, {}, colorDe(d, {}))).then((v) => {
      if (!v) return;
      const pre = new Image();
      pre.onload = () => { const [w, h] = tamMini(pre.naturalWidth, pre.naturalHeight, caja, max); MINIS.set(`${d.k}|${caja}|${max}`, { url: v.url, w, h }); };
      pre.src = v.url;
    }).catch(() => {}).finally(() => (window.requestIdleCallback ? requestIdleCallback(uno, { timeout: 400 }) : setTimeout(uno, 40)));
  };
  uno();
}
export function cajonCatalogo(j) {
  const recientes = () => j.recientes().map((k) => CATALOGO[k]).filter(Boolean);
  const cats = () => (recientes().length ? [["recientes", "Recientes"], ...CATEGORIAS] : CATEGORIAS);
  let cat = CATEGORIAS[0][0], q = "";
  const rejilla = el("div.ca-cat-tira", { role: "list" });
  const cuenta = el("small.ca-cat-cuenta");
  const vacio = el("p.ca-cat-vacio", { hidden: "" });
  // Las imágenes se hacen sólo cuando se ven (y de una en una), para que abrir el cajón sea ligerito.
  const io = "IntersectionObserver" in window ? new IntersectionObserver((l) => { for (const e of l) if (e.isIntersecting) { e.target._cargar?.(); io.unobserve(e.target); } }, { root: null, rootMargin: "60px" }) : null;
  // (Y sólo con el cajón abierto: cerrado no se prepara nada, para que la casita arranque ligerita.)
  let abierto = false;
  const ver = (n) => { if (abierto) io ? io.observe(n) : n._cargar?.(); };
  const girable = (d) => d.capa === "piso" && !d.mascota && !d.noGira && d.k !== "cosita";
  const tarjeta = (d) => {
    const mini = miniPixel(d, [60, 50]);
    const tags = [girable(d) ? el("em.t360", { text: "4 vistas" }) : null, d.portatil && d.noEstorba ? el("em.tencima", { text: "Encima" }) : null].filter(Boolean);
    const b = el("button.ca-cat-b", { type: "button", role: "listitem", "aria-label": `Poner ${d.n}`, dataset: { t: d.k }, style: { "--tinte": TINTE[d.cat] || "#ffe3ec" }, onClick: () => {
      if (b._arrastro) { b._arrastro = false; return; }
      j.agregar(d.k);
      if (n.classList.contains("grande")) agrandar(false);
    } }, [
      el("span.ca-cat-base", {}, [mini]),
      el("small", { text: d.n }),
      tags.length ? el("span.ca-cat-tags", {}, tags) : null,
      d.nuevo ? el("b.ca-cat-nuevo", { text: "Nuevo" }) : null,
    ].filter(Boolean));
    mini._cargar && (b._cargar = mini._cargar);
    // (Fase 73) Deslizar SIEMPRE desliza (de lado o hacia arriba y abajo): nunca saca nada sin querer. Para llevarla al
    // cuarto: déjala presionada un ratito (se levanta y vibra) y llévala a donde quieras; con el mouse, arrástrala.
    b.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const x0 = e.clientX, y0 = e.clientY, id = e.pointerId, dedo = e.pointerType !== "mouse";
      let ult = e, tPre = 0, tLev = 0;
      const levantar = () => {
        quitar(); b._arrastro = true; b.classList.remove("presionada");
        const grande = n.classList.contains("grande");
        try { navigator.vibrate?.(14); } catch (er) { /* nada */ }
        j.arrastrarNuevo(d.k, ult);
        // (Grande, al soltarla se hace chiquito para que veas dónde quedó.)
        if (grande) addEventListener("pointerup", function f(ev) { if (ev.pointerId !== id) return; removeEventListener("pointerup", f); agrandar(false); });
      };
      const mover = (ev) => {
        if (ev.pointerId !== id) return;
        ult = ev;
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (dedo) { if (Math.hypot(dx, dy) > 9) quitar(); return; }    // (se movió antes de tiempo: es deslizar)
        if (Math.hypot(dx, dy) > 8) levantar();                         // (con el mouse, arrastrar la saca)
      };
      const quitar = () => { clearTimeout(tPre); clearTimeout(tLev); b.classList.remove("presionada"); removeEventListener("pointermove", mover); removeEventListener("pointerup", quitar); removeEventListener("pointercancel", quitar); };
      if (dedo) { tPre = setTimeout(() => b.classList.add("presionada"), 110); tLev = setTimeout(levantar, 340); }
      addEventListener("pointermove", mover); addEventListener("pointerup", quitar); addEventListener("pointercancel", quitar);
    });
    // (Al dejarla presionada, el teléfono no abre su menú de copiar o guardar imagen.)
    b.addEventListener("contextmenu", (e) => e.preventDefault());
    return b;
  };
  const lista = () => {
    if (q) { const t = sinAcentos(q); return Object.values(CATALOGO).filter((d) => CATEGORIAS.some(([k]) => k === d.cat) && (sinAcentos(d.n).includes(t) || sinAcentos((CATEGORIAS.find(([k]) => k === d.cat) || [])[1]).includes(t))).slice(0, 80); }
    return cat === "recientes" ? recientes() : deCategoria(cat);
  };
  const pintar = () => {
    const l = lista();
    rejilla.replaceChildren(...l.map(tarjeta));
    if (abierto) prepararMinis(l, [60, 50]);
    for (const b of rejilla.children) ver(b);
    rejilla.scrollLeft = 0; rejilla.scrollTop = 0;
    cuenta.textContent = l.length === 1 ? "1 cosita" : `${l.length} cositas`;
    vacio.hidden = !!l.length;
    if (!l.length) vacio.textContent = q ? `No encontré nada con «${q}». Prueba con otra palabra.` : "Todavía no hay nada aquí.";
    n.classList.toggle("buscando", !!q);
  };
  const tabs = el("div.ca-cat-tabs", { role: "tablist" });
  const pintarTabs = () => {
    tabs.replaceChildren(...cats().map(([k, t]) => {
      const rep = k === "recientes" ? recientes()[0] : (CATALOGO[REPRESENTA[k]]?.cat === k && CATALOGO[REPRESENTA[k]]) || deCategoria(k).find((d) => d.pixel) || deCategoria(k)[0];
      const ico = rep ? miniPixel(rep, [22, 22], 3) : el("i.ca-cat-mini");
      // (El chip dice sólo su nombre: el dibujito no aporta letras, ni siquiera sus espacios.)
      for (const t of ico.querySelectorAll("text, title")) t.remove();
      const w = document.createTreeWalker(ico, NodeFilter.SHOW_TEXT), sueltos = [];
      while (w.nextNode()) sueltos.push(w.currentNode);
      for (const x of sueltos) x.remove();
      const b = el("button.ca-cat-tab" + (k === cat && !q ? ".on" : "") + (k === "recientes" ? ".recientes" : ""), { type: "button", role: "tab", "aria-label": t, style: { "--tinte": TINTE[k] || "#ffe3ec" }, onClick: () => { cat = k; if (q) { q = ""; campo.value = ""; } marcar(b); pintar(); j.sonar("hoja", { volumen: 0.5 }); } }, [ico, el("span", { text: t })]);
      if (ico._cargar) b._cargar = ico._cargar;
      return b;
    }));
    for (const b of tabs.children) ver(b);
  };
  const campo = el("input.ca-cat-buscar", { type: "search", placeholder: "Buscar una cosita", "aria-label": "Buscar una cosita", autocomplete: "off", enterkeyhint: "search", maxlength: "30" });
  let tq = 0;
  campo.addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(() => { q = campo.value.trim().slice(0, 30); if (!q) for (const b of tabs.children) b.classList.toggle("on", b.getAttribute("aria-label") === (cats().find(([k]) => k === cat) || [])[1]); else for (const b of tabs.children) b.classList.remove("on"); pintar(); }, 140); });
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") campo.blur(); if (e.key === "Escape") { campo.value = ""; campo.dispatchEvent(new Event("input")); } });
  const asa = el("button.ca-cajon-asa", { type: "button", "aria-label": "Agrandar el cajón", html: ICO.agrandar });
  const agrandar = (si = !n.classList.contains("grande")) => {
    // (Grande se pone ENCIMA de la casita: la cámara se queda como estaba con el cajón chiquito.)
    if (si && !n.classList.contains("grande")) n._altoChico = n.offsetHeight;
    if (!si) n._altoChico = 0;
    n.classList.toggle("grande", si);
    asa.setAttribute("aria-label", si ? "Hacer chiquito el cajón" : "Agrandar el cajón");
    pista.textContent = PISTA;
    j.sonar(si ? "abrir" : "cerrar", { volumen: 0.4 });
    rejilla.scrollLeft = 0; rejilla.scrollTop = 0;
  };
  asa.addEventListener("click", () => { if (!asa._jalo) agrandar(); asa._jalo = false; });
  // Jalar el asa hacia arriba lo agranda; hacia abajo lo hace chiquito.
  asa.addEventListener("pointerdown", (e) => {
    const y0 = e.clientY, id = e.pointerId;
    const mover = (ev) => { if (ev.pointerId !== id) return; const dy = ev.clientY - y0; if (Math.abs(dy) > 26) { asa._jalo = true; fin(); agrandar(dy < 0); } };
    const fin = () => { removeEventListener("pointermove", mover); removeEventListener("pointerup", fin); removeEventListener("pointercancel", fin); };
    addEventListener("pointermove", mover); addEventListener("pointerup", fin); addEventListener("pointercancel", fin);
  });
  const PISTA = matchMedia("(pointer: coarse)").matches ? "Toca una cosa para ponerla, o déjala presionada y llévala a donde quieras" : "Haz clic en una cosa para ponerla, o arrástrala a donde quieras";
  const pista = el("small.ca-cajon-pista", { text: PISTA });
  const n = el("div.ca-cajon.v69", {}, [
    asa,
    el("div.ca-cajon-cab", {}, [
      el("label.ca-cat-busca", {}, [el("i", { html: ICO.buscar }), campo]),
      el("button.ca-chip.ca-pared-b", { type: "button", onClick: () => estiloCuarto(j) }, [el("i", { html: ICO.pared }), el("span", { text: "Pared y piso" })]),
    ]),
    tabs,
    el("div.ca-cat-sub", {}, [cuenta]),
    rejilla, vacio,
    pista,
  ]);
  n.addEventListener("touchmove", (e) => { if (j.arrastrandoId && e.cancelable) e.preventDefault(); }, { passive: false });
  pintarTabs(); pintar();
  // En la compu, la ruedita del mouse desliza de lado las tiras (las categorías y, en chiquito, las cosas).
  for (const t of [tabs, rejilla]) t.addEventListener("wheel", (e) => {
    if ((t === rejilla && n.classList.contains("grande")) || Math.abs(e.deltaX) > Math.abs(e.deltaY) || t.scrollWidth <= t.clientWidth) return;
    e.preventDefault(); t.scrollLeft += e.deltaY;
  }, { passive: false });
  /** Al abrir «Acomodar», empieza en lo del cuarto donde estás (y «Recientes» al día), chiquito y sin búsqueda. */
  n.ponerCat = (k) => {
    abierto = true;
    if (q) { q = ""; campo.value = ""; }
    n.classList.remove("grande"); n._altoChico = 0;
    pintarTabs();
    const i = cats().findIndex(([x]) => x === k);
    if (i < 0) { pintar(); return; }
    cat = k; marcar(tabs.children[i]); pintar();
    tabs.scrollLeft = Math.max(0, tabs.children[i].offsetLeft - 24);
  };
  return n;
}

/** El menú flotante de un monito: sus gestos (o lo que pueden hacer juntos), en una tablita con título. */
export function menuMonito(j, m, opciones, titulo = "") {
  j.cerrarMenu();
  const C = m.caja.getBoundingClientRect(), p = { x: (C.left + C.right) / 2, y: C.top + 10 };   // (Fase 61: arriba de donde se ve)
  const menu = el("div.ca-menu", { role: "menu", "aria-label": titulo || "Gestos" }, [
    titulo ? el("b.ca-menu-t", { text: titulo }) : null,
    el("div.ca-menu-rejilla", {}, opciones.map(([k, t, al]) => el("button.ca-menu-b", { type: "button", role: "menuitem", dataset: { k }, onClick: () => { j.cerrarMenu(); al(); } }, [el("i", { html: ICO[k] || ICO.corazon }), el("span", { text: t })]))),
  ].filter(Boolean));
  j.raiz.append(menu);
  const R = j.raiz.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = Math.max(8, Math.min(R.width - w - 8, p.x - R.left - w / 2)) + "px";
  menu.style.top = Math.max(8, Math.min(R.height - h - 60, p.y - R.top - h)) + "px";
  requestAnimationFrame(() => menu.classList.add("ver"));
  j.menu = menu;
  j.sonar("pop", { volumen: 0.5 });
}

export const avisar = (t) => aviso(t, 2600);
export { CUARTOS };
