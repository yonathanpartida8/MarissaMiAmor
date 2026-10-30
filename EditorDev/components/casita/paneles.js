/**
 * LAS HOJITAS de la casita: vestidor, pared y piso, el catálogo de «Acomodar», qué cocinar, el piano,
 * los ajustes de sonido y el menú flotante de los monitos. Reciben `j` (el juego) y le avisan lo que
 * eligió quien juega. (Los mensajes y las cartitas están en mensajes.js.)
 */
import { el, aviso, jalarParaCerrar } from "../ui.js";
import { ICO } from "./iconos.js";
import { monitoSVG, PIELES, COLOR_PELO, COLOR_ROPA, PEINADOS, ARRIBAS, ABAJOS, ACCESORIOS, CALZADOS, OJOS, PECAS } from "./monito.js";
import { CATEGORIAS, deCategoria, colorDe, recetasDe, arteReceta } from "./catalogo/index.js";
import { CUARTOS, PAREDES, PATRONES, PISOS, cuarto } from "./cuartos.js";
import { SONIDOS } from "./sonidos.js";

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
export function vestidor(j) {
  const r = { ...j.yo.ropa };
  const vista = el("div.ca-vest-vista", { html: monitoSVG(r) });
  const poner = (c) => { Object.assign(r, c); vista.innerHTML = monitoSVG(r); j.vestir(r); j.sonar("pop", { volumen: 0.6 }); };
  hoja(j, "Vestidor", el("div.ca-vest", {}, [
    vista,
    el("div.ca-vest-ops", {}, [
      sec("Peinado", chips(PEINADOS, r.pelo, (k) => poner({ pelo: k })), colores(COLOR_PELO, r.peloColor, (c) => poner({ peloColor: c }))),
      sec("Ojitos", chips(OJOS, r.ojos || "redondos", (k) => poner({ ojos: k })), chips(PECAS, r.pecas || "no", (k) => poner({ pecas: k }))),
      sec("Arriba", chips(ARRIBAS, r.arriba, (k) => poner({ arriba: k })), colores(COLOR_ROPA, r.arribaColor, (c) => poner({ arribaColor: c }))),
      sec("Abajo", chips(ABAJOS, r.abajo, (k) => poner({ abajo: k })), colores(COLOR_ROPA, r.abajoColor, (c) => poner({ abajoColor: c }))),
      sec("Zapatitos", chips(CALZADOS, r.calzado || "tenis", (k) => poner({ calzado: k })), colores(COLOR_ROPA, r.zapatos, (c) => poner({ zapatos: c }))),
      sec("Accesorio", chips(ACCESORIOS, r.accesorio, (k) => poner({ accesorio: k }))),
      sec("Piel", colores(PIELES, r.piel, (c) => poner({ piel: c }))),
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

/** El piano: dos octavitas para tocar (cada tecla con su nota). */
export function piano(j, o) {
  const BLANCAS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84], NOMBRES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
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
  hoja(j, "Piano", el("div.ca-piano", {}, [el("div.ca-teclado", {}, [...BLANCAS.map((m, i) => tecla(m, false, i)), ...negras])]), "piano-hoja");
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
    sec("La música del editor", el("p.ca-nota", { text: "Mientras juegan en la casita, la canción del editor se calla sola y vuelve al salir." })),
  ]), "ajustes");
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

/** El cajón de «Acomodar»: categorías arriba y sus cosas en una tira que se desliza. */
export function cajonCatalogo(j) {
  const tira = el("div.ca-cat-tira");
  let cat = CATEGORIAS[0][0];
  const pintar = () => {
    tira.replaceChildren(...deCategoria(cat).map((d) => el("button.ca-cat-b", { type: "button", "aria-label": `Poner ${d.n}`, dataset: { t: d.k }, onClick: () => j.agregar(d.k) }, [
      el("i.ca-cat-mini", { html: d.arte({}, colorDe(d, {})) }), el("small", { text: d.n }),
    ])));
    tira.scrollLeft = 0;
  };
  const tabs = el("div.ca-cat-tabs", { role: "tablist" }, CATEGORIAS.map(([k, t]) => {
    const b = el("button.ca-cat-tab" + (k === cat ? ".on" : ""), { type: "button", role: "tab", text: t, onClick: () => { cat = k; marcar(b); pintar(); j.sonar("hoja", { volumen: 0.5 }); } });
    return b;
  }));
  pintar();
  const n = el("div.ca-cajon", {}, [el("div.ca-cajon-cab", {}, [tabs, el("button.ca-chip.ca-pared-b", { type: "button", onClick: () => estiloCuarto(j) }, [el("i", { html: ICO.pared }), el("span", { text: "Pared y piso" })])]), tira]);
  /** Al abrir «Acomodar», empieza en lo del cuarto donde estás. */
  n.ponerCat = (k) => {
    const i = CATEGORIAS.findIndex(([x]) => x === k);
    if (i < 0 || k === cat) return;
    cat = k; marcar(tabs.children[i]); pintar();
    tabs.scrollLeft = Math.max(0, tabs.children[i].offsetLeft - 24);
  };
  return n;
}

/** El menú flotante de un monito: sus gestos (o lo que pueden hacer juntos). */
export function menuMonito(j, m, opciones) {
  j.cerrarMenu();
  const p = j.enPantalla(m.gx, m.y - 160);
  const menu = el("div.ca-menu", { role: "menu" }, opciones.map(([k, t, al]) => el("button.ca-menu-b", { type: "button", role: "menuitem", onClick: () => { j.cerrarMenu(); al(); } }, [el("i", { html: ICO[k] || ICO.corazon }), el("span", { text: t })])));
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
