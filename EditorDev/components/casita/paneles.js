/**
 * LAS HOJITAS de la casita: vestidor, decir algo, pared y piso, el catálogo de «Acomodar» y el menú
 * flotante de los monitos. Reciben `j` (el juego) y le avisan lo que eligió quien juega.
 */
import { el, aviso, jalarParaCerrar } from "../ui.js";
import { ICO } from "./iconos.js";
import { monitoSVG, PIELES, COLOR_PELO, COLOR_ROPA, PEINADOS, ARRIBAS, ABAJOS, ACCESORIOS } from "./monito.js";
import { CATEGORIAS, deCategoria, colorDe } from "./catalogo/index.js";
import { CUARTOS, PAREDES, PATRONES, PISOS, cuarto } from "./cuartos.js";

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
      sec("Arriba", chips(ARRIBAS, r.arriba, (k) => poner({ arriba: k })), colores(COLOR_ROPA, r.arribaColor, (c) => poner({ arribaColor: c }))),
      sec("Abajo", chips(ABAJOS, r.abajo, (k) => poner({ abajo: k })), colores(COLOR_ROPA, r.abajoColor, (c) => poner({ abajoColor: c }))),
      sec("Zapatitos", colores(COLOR_ROPA, r.zapatos, (c) => poner({ zapatos: c }))),
      sec("Accesorio", chips(ACCESORIOS, r.accesorio, (k) => poner({ accesorio: k }))),
      sec("Piel", colores(PIELES, r.piel, (c) => poner({ piel: c }))),
    ]),
  ]), "vestidor");
}

/** Decir algo: frasecitas o lo que quieras (hasta 60 letras; siempre como texto). */
export function decir(j) {
  const frases = ["Te amo", "Ven conmigo", "¿Vemos la tele?", "Tengo hambre", "Buenas noches", "Te extraño", "Abrazo", "Hola, amor", "Eres hermosa", "Eres hermoso", "¿Bailamos?", "Qué bonito"];
  const campo = el("input.ca-campo", { type: "text", maxlength: "60", placeholder: "Escribe algo lindo…", enterkeyhint: "send" });
  const mandar = (t) => { t = String(t || "").trim().slice(0, 60); if (!t) return; j.cerrarHoja(); j.decir(t); };
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); mandar(campo.value); } });
  hoja(j, "Decir algo", el("div.ca-decir", {}, [
    el("div.ca-decir-fila", {}, [campo, el("button.ca-boton", { type: "button", text: "Decir", onClick: () => mandar(campo.value) })]),
    el("div.ca-frases", {}, frases.map((f) => el("button.ca-chip", { type: "button", text: f, onClick: () => mandar(f) }))),
  ]), "decir");
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
