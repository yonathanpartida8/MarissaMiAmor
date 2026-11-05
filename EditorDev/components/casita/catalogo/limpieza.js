/**
 * (Fase 64) LIMPIEZA, DECORACIÓN Y ÁRBOLES.
 *
 *   · Las cosas de limpieza se agarran (las trae tu monito en la mano) y sirven de verdad: con la escoba o el
 *     rastrillo se barren las hojitas del patio y el polvito de adentro; el trapeador y la aspiradora limpian
 *     adentro; el plumero sacude los muebles; la regadera riega las plantas (y hace crecer las flores).
 *   · Los árboles son pixel (los mismos del patio), se mecen y sueltan hojitas que luego hay que barrer;
 *     los frutales dan fruta.
 */
import { svg, OL, OL2, tono, brillo, corazon, MADERA, MADERA_O } from "./arte.js";
import { spriteEsc, MEDIDAS } from "../exterior.js";

const s40 = (c) => svg(40, 40, c);
/** Lo que se trae en la mano (las herramientas y la naranja del naranjo). */
export const MANO = {
  // (Fase 65) La escoba y el rastrillo se traen de su tamaño (del piso a arriba del hombro, el palo por la mano):
  // `larga` = el objeto del catálogo que se dibuja; `mano` = dónde va su dibujo dentro del monito [x, y].
  escoba: { n: "Escoba", herramienta: "barrer", larga: "escoba", mano: [47.5, 38], arte: s40(`<path d="M27 3L16 25" stroke="#b07a52" stroke-width="3" stroke-linecap="round"/><path d="M11 23l9 5-3 10c-5 0-9-3-11-7z" fill="#f2cf6e" ${OL2}/><path d="M10 27l7 3M9 31l6 3" stroke="#d8a93f" stroke-width="1.4"/><rect x="12" y="21" width="10" height="4" rx="2" fill="#ff9cbf" transform="rotate(28 17 23)"/>`) },
  rastrillo: { n: "Rastrillo", herramienta: "barrer", larga: "rastrillo", mano: [44, 35], arte: s40(`<path d="M28 3L17 24" stroke="#b07a52" stroke-width="3" stroke-linecap="round"/><path d="M7 24c6-4 14-2 18 3" stroke="#6fbf73" stroke-width="3" fill="none" stroke-linecap="round"/>${[8, 12, 16, 20, 24].map((x, i) => `<path d="M${x} ${25 + (i % 2)}l-1 9" stroke="#57a85f" stroke-width="2" stroke-linecap="round"/>`).join("")}`) },
  trapeador: { n: "Trapeador", herramienta: "trapear", arte: s40(`<path d="M24 2L18 26" stroke="#8fd0ff" stroke-width="3" stroke-linecap="round"/><path d="M10 26h16l2 10H8z" fill="#fff" ${OL2}/>${[11, 15, 19, 23].map((x) => `<path d="M${x} 28v8" stroke="#dfe8ef" stroke-width="2"/>`).join("")}`) },
  aspiradora: { n: "Aspiradora", herramienta: "aspirar", arte: s40(`<ellipse cx="14" cy="28" rx="11" ry="8" fill="#ff9cbf" ${OL2}/><circle cx="9" cy="34" r="3" fill="#6b5a66"/><circle cx="19" cy="34" r="3" fill="#6b5a66"/><path d="M22 24c6-4 9-10 9-18" stroke="#c9a7ff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="27" y="3" width="9" height="5" rx="2" fill="#a985e8"/>${brillo(8, 23, 10, 3, 2, 0.5)}`) },
  plumero: { n: "Plumero", herramienta: "sacudir", arte: s40(`<path d="M24 38L18 16" stroke="#b07a52" stroke-width="3" stroke-linecap="round"/>${[[16, 10, "#ff9cbf"], [21, 8, "#ffd36e"], [12, 14, "#c9a7ff"], [20, 13, "#8fd0ff"], [15, 6, "#ffb3cf"]].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="${c}" transform="rotate(-30 ${x} ${y})" ${OL2}/>`).join("")}`) },
  regadera: { n: "Regadera", herramienta: "regar", arte: s40(`<path d="M8 16h18v16a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#94dfbd" ${OL2}/><path d="M26 20l10-8" stroke="#94dfbd" stroke-width="4" stroke-linecap="round"/><path d="M12 16a5 5 0 0 1 10 0" stroke="#5fb38a" stroke-width="3" fill="none"/>${corazon(17, 26, 0.5, "#fff")}`) },
  naranja: { n: "Naranja", comible: true, arte: s40(`<circle cx="20" cy="23" r="13" fill="#ff9a3c" ${OL2}/><path d="M20 10q3-6 9-5-2 5-9 5z" fill="#6fbf73"/><circle cx="15" cy="18" r="3" fill="#fff" opacity=".45"/>`) },
};

/** Los árboles pixel del catálogo: el dibujo del patio dentro de un svg (la copa se mece sola). */
const arbolPx = (k, v = 0) => () => {
  const m = MEDIDAS[k], sp = spriteEsc(k, v);
  return svg(m.w, m.h, `<image href="${sp.tronco}" width="${m.w}" height="${m.h}" preserveAspectRatio="none" style="image-rendering:pixelated"/><g class="copa"><image href="${sp.copa}" width="${m.w}" height="${m.h}" preserveAspectRatio="none" style="image-rendering:pixelated"/></g>`);
};
const arbol = (k, n, v, extra = {}) => ({ n, cat: "jardin", w: MEDIDAS[k].w, h: MEDIDAS[k].h, y: 560, pie: 0.09, fondo: 16, hojas: MEDIDAS[k].hojas, noGira: true, al: "sacude", arte: arbolPx(k, v), ...extra });

const COLORES = ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#94dfbd", "#ffd36e"];
export const ITEMS = {
  // ── Limpieza ──
  escoba: { n: "Escoba", cat: "limpieza", w: 50, h: 132, y: 548, al: "herramienta", herramienta: "escoba", pie: 0.3, fondo: 14, larga: true, noGira: true, colores: ["#ff9cbf", "#8fd0ff", "#94dfbd"],
    arte: (e, C) => svg(50, 132, `<path d="M30 4L22 92" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/><path d="M30 4L22 92" stroke="${MADERA}" stroke-width="3" stroke-linecap="round"/>
      <rect x="13" y="86" width="20" height="9" rx="4" fill="${C}" ${OL2}/><path d="M12 94h22l8 34H4z" fill="#f2cf6e" ${OL}/>${[10, 16, 22, 28, 34].map((x) => `<path d="M${x + 1} 98l${(x - 22) * 0.25} 28" stroke="#d6a640" stroke-width="2"/>`).join("")}${brillo(14, 97, 16, 4, 2, 0.4)}`) },
  rastrillo: { n: "Rastrillo", cat: "limpieza", w: 56, h: 136, y: 548, al: "herramienta", herramienta: "rastrillo", pie: 0.3, fondo: 14, larga: true, noGira: true,
    arte: () => svg(56, 136, `<path d="M28 4v100" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/><path d="M28 4v100" stroke="${MADERA}" stroke-width="3" stroke-linecap="round"/>
      <path d="M6 112q22-18 44 0" stroke="#6fbf73" stroke-width="6" fill="none" stroke-linecap="round" ${OL2}/>${[8, 15, 22, 29, 36, 43, 50].map((x) => `<path d="M${x} ${113 - Math.abs(x - 28) * 0.3}v18" stroke="#57a85f" stroke-width="3" stroke-linecap="round"/>`).join("")}`) },
  trapeador: { n: "Trapeador y cubeta", cat: "limpieza", w: 96, h: 128, y: 550, al: "herramienta", herramienta: "trapeador", pie: 0.4, fondo: 28, colores: ["#8fd0ff", "#ff9cbf", "#94dfbd"],
    arte: (e, C) => svg(96, 128, `<path d="M64 6L50 92" stroke="#c9d6e0" stroke-width="5" stroke-linecap="round"/>${[42, 47, 52, 57].map((x, i) => `<path d="M50 90q${(i - 1.5) * 6} 12 ${x - 50 + (i - 1.5) * 4} 22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" ${OL2}/>`).join("")}
      <path d="M8 76h46l-5 48H13z" fill="${C}" ${OL}/><ellipse cx="31" cy="76" rx="23" ry="7" fill="${tono(C, 0.8)}" ${OL2}/><ellipse cx="31" cy="77" rx="18" ry="4.5" fill="#bfe8ff"/>${brillo(14, 84, 8, 30, 4, 0.35)}<path d="M10 78q21-26 42 0" stroke="#6b5a66" stroke-width="2.5" fill="none"/>
      ${[[24, 70], [36, 68], [30, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" opacity=".85" ${OL2}/>`).join("")}`) },
  aspiradora: { n: "Aspiradora", cat: "limpieza", w: 92, h: 104, y: 550, al: "herramienta", herramienta: "aspiradora", pie: 0.42, fondo: 30, colores: COLORES,
    arte: (e, C) => svg(92, 104, `<path d="M58 70c16-6 22-30 18-62" stroke="#c9a7ff" stroke-width="7" fill="none" stroke-linecap="round" ${OL2}/><rect x="66" y="2" width="22" height="10" rx="4" fill="#a985e8" ${OL2}/>
      <rect x="6" y="50" width="62" height="44" rx="20" fill="${C}" ${OL}/>${brillo(14, 56, 26, 8, 4, 0.4)}<circle cx="37" cy="72" r="9" fill="${tono(C, 1.3)}" ${OL2}/>${corazon(37, 72, 0.55, tono(C, 0.75))}
      <circle cx="18" cy="96" r="7" fill="#6b5a66"/><circle cx="56" cy="96" r="7" fill="#6b5a66"/><circle cx="18" cy="96" r="2.5" fill="#cfc6d6"/><circle cx="56" cy="96" r="2.5" fill="#cfc6d6"/>`) },
  plumero: { n: "Plumero", cat: "limpieza", w: 44, h: 104, y: 546, al: "herramienta", herramienta: "plumero", pie: 0.3, fondo: 12, portatil: true,
    arte: () => svg(44, 104, `<path d="M22 102V40" stroke="${MADERA_O}" stroke-width="5" stroke-linecap="round"/><path d="M22 102V40" stroke="${MADERA}" stroke-width="2.5" stroke-linecap="round"/>
      ${[[22, 28, "#ff9cbf", 0], [12, 34, "#ffd36e", -30], [32, 34, "#c9a7ff", 30], [16, 20, "#8fd0ff", -18], [28, 18, "#ffb3cf", 18], [22, 10, "#94dfbd", 0]].map(([x, y, c, a]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="13" fill="${c}" transform="rotate(${a} ${x} ${y})" ${OL2}/>`).join("")}`) },
  regadera: { n: "Regadera", cat: "limpieza", w: 74, h: 58, y: 552, al: "herramienta", herramienta: "regadera", pie: 0.4, fondo: 16, portatil: true, colores: ["#94dfbd", "#ff9cbf", "#8fd0ff", "#ffd36e"],
    arte: (e, C) => svg(74, 58, `<path d="M8 20h36v28a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="${C}" ${OL}/><path d="M44 28l22-16" stroke="${tono(C, 0.85)}" stroke-width="7" stroke-linecap="round"/><ellipse cx="67" cy="11" rx="5" ry="7" fill="${tono(C, 0.75)}" transform="rotate(-36 67 11)"/>
      <path d="M14 20a12 12 0 0 1 24 0" stroke="${tono(C, 0.7)}" stroke-width="5" fill="none"/>${brillo(12, 24, 6, 24, 3, 0.4)}${corazon(27, 38, 0.8, "#fff")}`) },
  cubeta_jabon: { n: "Cubeta con jabón", cat: "limpieza", w: 66, h: 64, y: 552, al: "burbujas", pie: 0.42, fondo: 22, colores: ["#ffd36e", "#8fd0ff", "#ff9cbf"],
    arte: (e, C) => svg(66, 64, `<path d="M6 22h54l-6 40H12z" fill="${C}" ${OL}/><ellipse cx="33" cy="22" rx="27" ry="7" fill="${tono(C, 0.8)}" ${OL2}/>${[[18, 16, 8], [32, 12, 10], [46, 16, 7], [26, 8, 5], [40, 6, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".9" ${OL2}/>`).join("")}${brillo(12, 28, 6, 26, 3, 0.35)}<rect x="40" y="34" width="14" height="10" rx="3" fill="#ffb3cf" ${OL2}/>`) },
  bote_patio: { n: "Bote de basura (patio)", cat: "limpieza", w: 70, h: 92, y: 552, al: "basura", pie: 0.4, fondo: 24, colores: ["#94dfbd", "#8fd0ff", "#c9a7ff"],
    arte: (e, C) => svg(70, 92, `<path d="M10 26h50l-5 62H15z" fill="${C}" ${OL}/>${[22, 35, 48].map((x) => `<path d="M${x} 34v46" stroke="${tono(C, 0.82)}" stroke-width="3" stroke-linecap="round"/>`).join("")}<rect x="4" y="14" width="62" height="14" rx="6" fill="${tono(C, 0.85)}" ${OL}/><rect x="27" y="6" width="16" height="9" rx="4" fill="${tono(C, 0.7)}" ${OL2}/>${brillo(14, 32, 5, 40, 3, 0.35)}`) },
  // ── Decoración ──
  gnomo: { n: "Gnomo de jardín", cat: "jardin", w: 50, h: 76, y: 556, al: "boing", pie: 0.36, fondo: 14, colores: ["#ff6f7f", "#8fd0ff", "#c9a7ff"],
    arte: (e, C) => svg(50, 76, `<ellipse cx="25" cy="72" rx="18" ry="4" fill="#000" opacity=".12"/><rect x="11" y="44" width="28" height="26" rx="10" fill="#6fbf73" ${OL}/><path d="M25 2L10 34h30z" fill="${C}" ${OL}/>${brillo(16, 18, 4, 12, 2, 0.4)}
      <circle cx="25" cy="38" r="9" fill="#ffd9c2" ${OL2}/><path d="M14 40q11 26 22 0q-4 6-11 6t-11-6z" fill="#fff" ${OL2}/><circle cx="21" cy="36" r="1.6" fill="#4b2e42"/><circle cx="29" cy="36" r="1.6" fill="#4b2e42"/><circle cx="25" cy="40" r="2.6" fill="#ffb3a8"/>`) },
  jardinera: { n: "Jardinera con flores", cat: "jardin", w: 132, h: 70, y: 556, al: "florecer", pie: 0.44, fondo: 24,
    arte: (e) => { const et = e?.etapa | 0; return svg(132, 70, `<rect x="6" y="40" width="120" height="28" rx="5" fill="${MADERA}" ${OL}/>${[24, 50, 76, 102].map((x) => `<path d="M${x} 42v24" stroke="${MADERA_O}" stroke-width="2"/>`).join("")}${brillo(10, 43, 112, 4, 2, 0.35)}
      ${Array.from({ length: 7 }, (_, i) => { const x = 16 + i * 17, h = 10 + et * 7 + (i % 2) * 4, c = ["#ff9cbf", "#ffd36e", "#c9a7ff", "#fff", "#ff8fa8", "#8fd0ff", "#ffb3cf"][i]; return `<path d="M${x} 42v-${h}" stroke="#57a85f" stroke-width="2.5"/><path d="M${x} ${38 - h / 2}q-6-2-7 3" stroke="#57a85f" stroke-width="2" fill="none"/>${et ? `<circle cx="${x}" cy="${40 - h}" r="${3 + et * 1.6}" fill="${c}" ${OL2}/><circle cx="${x}" cy="${40 - h}" r="1.6" fill="#ffe27a"/>` : `<circle cx="${x}" cy="${40 - h}" r="2.4" fill="#7ccf6f"/>`}`; }).join("")}`); } },
  rehilete: { n: "Rehilete", cat: "jardin", w: 44, h: 96, y: 556, pie: 0.2, fondo: 10, colores: COLORES, al: "gira",
    arte: (e, C) => svg(44, 96, `<path d="M22 30v64" stroke="#b07a52" stroke-width="3" stroke-linecap="round"/><g class="rehilete-aspas">${[0, 90, 180, 270].map((a, i) => `<path d="M22 22l0-18a10 10 0 0 1 10 10z" fill="${i % 2 ? C : tono(C, 1.35)}" transform="rotate(${a} 22 22)" ${OL2}/>`).join("")}</g><circle cx="22" cy="22" r="3" fill="#fff" ${OL2}/>`) },
  farolitos: { n: "Lucecitas del jardín", cat: "jardin", w: 124, h: 46, y: 558, pie: 0.45, fondo: 12, brilla: { x: 62, y: 18, r: 120, c: "#ffe08a", siempre: true },
    arte: () => svg(124, 46, [16, 62, 108].map((x) => `<path d="M${x} 44V24" stroke="#6b5a66" stroke-width="3"/><path d="M${x - 9} 24h18l-3-14h-12z" fill="#fff4c8" ${OL2}/><path d="M${x - 11} 10h22l-11-8z" fill="#6b5a66"/><circle class="luz" cx="${x}" cy="17" r="4" fill="#ffe08a"/>`).join("")) },
  carretilla: { n: "Carretilla con flores", cat: "jardin", w: 140, h: 84, y: 558, pie: 0.42, fondo: 30, colores: ["#ff9cbf", "#8fd0ff", "#94dfbd"],
    arte: (e, C) => svg(140, 84, `<path d="M8 34h96l-14 30H22z" fill="${C}" ${OL}/>${brillo(16, 37, 70, 5, 2, 0.4)}<path d="M100 40l34-8" stroke="${MADERA_O}" stroke-width="5" stroke-linecap="round"/><path d="M30 64l-6 16M84 64l6 16" stroke="#6b5a66" stroke-width="4" stroke-linecap="round"/><circle cx="56" cy="70" r="12" fill="#6b5a66" ${OL2}/><circle cx="56" cy="70" r="4" fill="#cfc6d6"/>
      ${[[24, 28, "#ffd36e"], [40, 22, "#fff"], [56, 26, "#ff8fa8"], [72, 20, "#c9a7ff"], [88, 28, "#ffe27a"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" ${OL2}/><circle cx="${x}" cy="${y}" r="2" fill="#ffb347"/>`).join("")}<path d="M14 34q20-10 80 0" stroke="#57a85f" stroke-width="4" fill="none"/>`) },
  monstera: { n: "Monstera", cat: "deco", w: 104, h: 132, y: 548, al: "sacude", pie: 0.3, fondo: 20, colores: ["#ffffff", "#ff9cbf", "#c9a7ff", "#ffd36e"],
    arte: (e, C) => svg(104, 132, `${[[-38, 52, 34], [32, 46, 32], [-8, 30, 34], [44, 74, 26], [-46, 80, 24]].map(([a, y, l]) => `<g transform="translate(52 ${y}) rotate(${a})"><path d="M0 0c-${l * 0.7}-${l * 0.2}-${l * 0.8}-${l}-0-${l * 1.25}c${l * 0.8} ${l * 0.25} ${l * 0.7} ${l * 1.05} 0 ${l * 1.25}z" fill="#57a85f" ${OL2}/><path d="M0 0v-${l * 1.1}M0 -${l * 0.4}l-${l * 0.35}-${l * 0.15}M0 -${l * 0.7}l${l * 0.32}-${l * 0.12}" stroke="#3f8a4a" stroke-width="2" fill="none"/></g>`).join("")}
      <path d="M52 96V60" stroke="#3f8a4a" stroke-width="3"/><path d="M24 96h56l-6 34H30z" fill="${C}" ${OL}/>${brillo(30, 99, 6, 26, 3, 0.35)}<rect x="20" y="92" width="64" height="8" rx="4" fill="${tono(C, 0.88)}" ${OL2}/>`) },
  macrame: { n: "Macramé", cat: "deco", capa: "pared", w: 76, h: 118, y: 250,
    arte: () => svg(76, 118, `<path d="M6 8h64" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>${[14, 26, 38, 50, 62].map((x, i) => `<path d="M${x} 10q${i % 2 ? 6 : -6} 30 ${x > 38 ? -6 : 6} 56" stroke="#fff4e6" stroke-width="3" fill="none"/>`).join("")}
      <path d="M14 40q24 22 48 0M18 60q20 16 40 0" stroke="#f3dfc8" stroke-width="3.5" fill="none"/>${corazon(38, 76, 1.1, "#ff9cbf", OL2)}${[20, 30, 46, 56].map((x) => `<path d="M${x} 82v${20 + (x % 3) * 6}" stroke="#fff4e6" stroke-width="2.5"/>`).join("")}`) },
  // ── Árboles (pixel, se mecen y sueltan hojitas) ──
  arbol_cerezo: arbol("cerezo", "Cerezo en flor", 0),
  arbol_roble: arbol("roble", "Roble frondoso", 1),
  arbol_pino: arbol("pino", "Pino", 0),
  arbol_abedul: arbol("abedul", "Abedul", 0),
  arbol_sauce: arbol("sauce", "Sauce llorón", 0),
  arbol_manzano: arbol("frutal", "Manzano", 0, { al: "frutal", fruta: "manzana" }),
  arbol_naranjo: arbol("frutal", "Naranjo", 1, { al: "frutal", fruta: "naranja" }),
};
