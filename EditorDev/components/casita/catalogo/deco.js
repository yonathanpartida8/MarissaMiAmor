/** Para decorar: plantas, cuadros, sus fotos, reloj de verdad, ventanas, repisas, foquitos, globos y letreros. */
import { el } from "../../ui.js";
import * as PF from "../../perfil.js";
import { svg, OL, OL2, tono, brillo, corazon, estrella, hoja, MADERA, MADERA_O } from "./arte.js";

export const ITEMS = {
  planta: {
    n: "Planta grande", cat: "deco", w: 80, h: 128, al: "sacude", colores: ["#ff9e7a", "#8fd0ff", "#ffd96b", "#ffffff", "#c9a7ff"],
    arte: (e, C) => svg(80, 128, `
      <g class="hojas">${[[40, 80, -100, 64], [40, 80, -130, 52], [40, 80, -60, 56], [40, 84, -160, 40], [40, 84, -20, 42], [40, 80, -85, 74]].map(([x, y, a, l], i) => hoja(x, y, a, l, i % 2 ? "#6cc589" : "#7fd29b")).join("")}</g>
      <path d="M14 82h52l-7 44H21z" fill="${C}" ${OL}/><rect x="10" y="78" width="60" height="12" rx="5" fill="${tono(C, 0.88)}" ${OL}/>${brillo(20, 92, 6, 24, 3)}`),
  },
  maceta: {
    n: "Florecitas", cat: "deco", w: 56, h: 66, y: 548, al: "sacude", colores: ["#8fd0ff", "#ff9cbf", "#ffd96b", "#94dfbd"],
    arte: (e, C) => svg(56, 66, `
      <g class="hojas">${[[16, 16, "#ffb3cf"], [40, 12, "#c39bff"], [28, 24, "#ffd84d"]].map(([x, y, c]) => `<path d="M${x} 40V${y}" stroke="#57b884" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="${c}" ${OL2}/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`).join("")}</g>
      <path d="M8 40h40l-6 24H14z" fill="${C}" ${OL}/>${brillo(14, 44, 5, 14, 2)}`),
  },
  colgante: {
    n: "Planta colgante", cat: "deco", capa: "pared", w: 80, h: 124, y: 180, al: "sacude",
    arte: () => svg(80, 124, `
      <path d="M40 0v30M40 30L18 52M40 30l22 22" stroke="#b39a8a" stroke-width="2"/>
      <path d="M14 50h52l-8 24H22z" fill="#ffb48a" ${OL}/>
      <g class="hojas"><path d="M20 68c-6 20-2 38-8 54M32 72c-2 18 4 30 0 46M52 72c4 16-2 28 2 40M62 66c8 14 2 24 8 34" stroke="#57b884" stroke-width="3" fill="none"/>
        ${[[14, 96], [12, 118], [30, 96], [32, 114], [52, 92], [54, 108], [68, 84], [70, 98]].map(([x, y], i) => hoja(x, y, i % 2 ? 40 : 140, 12, i % 3 ? "#7fd29b" : "#6cc589")).join("")}
        ${[[24, 50], [40, 46], [56, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#7fd29b" ${OL2}/>`).join("")}</g>`),
  },
  cuadro: {
    n: "Cuadrito", cat: "deco", capa: "pared", w: 96, h: 86, y: 230, colores: ["#ffc98b", "#ff9cbf", "#c9a7ff", "#8fd0ff", "#94dfbd"],
    arte: (e, C) => svg(96, 86, `
      <rect x="2" y="2" width="92" height="82" rx="8" fill="${C}" ${OL}/><rect x="11" y="11" width="74" height="64" rx="4" fill="#fff8ee"/>
      <path d="M11 64l20-18 16 12 14-10 24 18v9H11z" fill="#bfe6c8"/><circle cx="70" cy="28" r="8" fill="#ffd96b"/>${corazon(40, 32, 1.3, "#ff5c93")}`),
  },
  fotos: {
    n: "Nuestras fotos", cat: "deco", capa: "pared", w: 160, h: 92, y: 240,
    arte: () => svg(160, 92, `<rect x="2" y="2" width="156" height="88" rx="14" fill="#fff" ${OL}/>${corazon(80, 46, 1, "#ff5c93")}`),
    // Las fotos de los dos de verdad (sus avatares), encima del marquito.
    dom: () => el("div.ca-fotos-dentro", {}, [PF.avatar("yo", "ca-foto"), PF.avatar("pareja", "ca-foto")]),
  },
  reloj: {
    n: "Reloj", cat: "deco", capa: "pared", w: 78, h: 78, y: 170, al: "reloj",
    arte: () => svg(78, 78, `
      <circle cx="39" cy="39" r="36" fill="#ff9cbf" ${OL}/><circle cx="39" cy="39" r="29" fill="#fffaf6"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<circle cx="${(39 + Math.sin(a) * 24).toFixed(1)}" cy="${(39 - Math.cos(a) * 24).toFixed(1)}" r="${i % 3 ? 1.6 : 2.6}" fill="#c98aa8"/>`; }).join("")}
      <path class="hora" d="M39 39V23" stroke="#4b2e42" stroke-width="4" stroke-linecap="round"/>
      <path class="min" d="M39 39V15" stroke="#ff5c93" stroke-width="3" stroke-linecap="round"/><circle cx="39" cy="39" r="3.5" fill="#4b2e42"/>`),
  },
  ventana: {
    n: "Ventana", cat: "deco", capa: "pared", w: 162, h: 184, y: 330, al: "cortinas", colores: ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#ffd96b", "#94dfbd"],
    arte: (e, C) => svg(162, 184, `
      <path d="M6 168V80a75 75 0 0 1 150 0v88z" fill="#fff" ${OL}/>
      <path class="cielo" d="M16 160V82a65 65 0 0 1 130 0v78z" fill="#9fd8ff"/>
      <g class="dia"><circle cx="116" cy="56" r="13" fill="#ffe17a"/><g class="nube"><ellipse cx="54" cy="96" rx="22" ry="8" fill="#fff"/><circle cx="48" cy="90" r="9" fill="#fff"/><circle cx="60" cy="88" r="7" fill="#fff"/></g></g>
      <g class="noche-o">${estrella(50, 60, 4, "#fff")}${estrella(110, 90, 3, "#fff")}${estrella(80, 40, 3, "#ffe17a")}<path d="M112 46a14 14 0 1 0 10 24 11 11 0 1 1-10-24z" fill="#fff3c4"/></g>
      <path d="M81 16v144M16 104h130" stroke="#fff" stroke-width="7"/>
      <g class="cortina-i"><path d="M10 14h50c-6 40 4 100-8 150H10z" fill="${C}" ${OL2}/>${[20, 32, 44].map((x) => `<path d="M${x} 18v140" stroke="${tono(C, 0.88)}" stroke-width="3"/>`).join("")}</g>
      <g class="cortina-d"><path d="M152 14h-50c6 40-4 100 8 150h42z" fill="${C}" ${OL2}/>${[118, 130, 142].map((x) => `<path d="M${x} 18v140" stroke="${tono(C, 0.88)}" stroke-width="3"/>`).join("")}</g>
      <rect x="0" y="8" width="162" height="9" rx="4.5" fill="${MADERA}" ${OL2}/>
      <rect x="0" y="164" width="162" height="14" rx="5" fill="#fff" ${OL}/>
      <path d="M126 164c-4-12 2-22 8-24 6 6 6 18 0 24z" fill="#7fd29b" ${OL2}/><rect x="122" y="156" width="22" height="10" rx="3" fill="#ffb48a"/>`),
  },
  repisa: {
    n: "Repisa", cat: "deco", capa: "pared", w: 160, h: 70, y: 200,
    arte: () => svg(160, 70, `
      <rect x="0" y="56" width="160" height="10" rx="4" fill="${MADERA}" ${OL}/><path d="M14 66l6 4M146 66l-6 4" stroke="${MADERA_O}" stroke-width="4"/>
      <rect x="10" y="26" width="10" height="30" rx="2" fill="#ff86b0" ${OL2}/><rect x="21" y="30" width="10" height="26" rx="2" fill="#8fd0ff" ${OL2}/><rect x="32" y="22" width="12" height="34" rx="2" fill="#ffd96b" ${OL2}/>
      <path d="M62 56c-2-18 8-28 14-32 6 4 16 14 14 32z" fill="#7fd29b" ${OL2}/><rect x="64" y="44" width="24" height="12" rx="3" fill="#ffb48a"/>
      <rect x="104" y="20" width="32" height="36" rx="5" fill="#fff" ${OL2}/>${corazon(120, 37, 1, "#ff5c93")}
      <circle cx="148" cy="48" r="8" fill="#c9a7ff" ${OL2}/>`),
  },
  guirnalda: {
    n: "Foquitos", cat: "deco", capa: "pared", w: 240, h: 60, y: 110,
    arte: () => svg(240, 60, `
      <path d="M2 8q118 46 236 0" stroke="#7d6a78" stroke-width="2" fill="none"/>
      ${[22, 52, 84, 120, 156, 188, 218].map((x, i) => { const y = 8 + Math.sin((x / 240) * Math.PI) * 22; return `<rect x="${x - 3}" y="${y - 2}" width="6" height="6" fill="#7d6a78"/><ellipse class="foco f${i % 3}" cx="${x}" cy="${y + 11}" rx="6.5" ry="9" fill="${["#ff86b0", "#ffd84d", "#8fd0ff", "#a0d995", "#c39bff", "#ff9e7a", "#ff86b0"][i]}" ${OL2}/>`; }).join("")}`),
  },
  globo: {
    n: "Globo", cat: "deco", w: 48, h: 136, y: 545, al: "boing", colores: ["#ff7aa8", "#c39bff", "#8fd0ff", "#ffd84d", "#94dfbd"],
    arte: (e, C) => svg(48, 136, `
      <path d="M24 66c3 16-6 26 0 44s-4 20 0 26" stroke="#b39a8a" stroke-width="2" fill="none"/>
      <g class="flota"><path d="M24 68C7 56 1 40 5 26 9 8 39 8 43 26c4 14-2 30-19 42z" fill="${C}" ${OL}/><path d="M20 66l4 6 4-6z" fill="${tono(C, 0.85)}"/>
        <path d="M13 24c2-7 8-10 12-9" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/></g>`),
  },
  cojin: {
    n: "Cojín", cat: "deco", w: 66, h: 46, y: 552, colores: ["#ffd0e2", "#e3d6ff", "#cdeeff", "#fff0b8", "#d4f3e3"],
    arte: (e, C) => svg(66, 46, `<rect x="3" y="6" width="60" height="38" rx="16" fill="${C}" ${OL}/>${corazon(33, 25, 1, "#ff5c93")}${brillo(10, 10, 30, 5, 2)}`),
  },
  estrellas: {
    n: "Estrellitas", cat: "deco", capa: "pared", w: 112, h: 80, y: 160,
    arte: () => svg(112, 80, `${estrella(24, 24, 18, "#ffd84d", 'class="tilin" ' + OL2)}${estrella(80, 20, 12, "#ffb3cf", 'class="tilin d2" ' + OL2)}${estrella(58, 58, 14, "#c39bff", 'class="tilin d3" ' + OL2)}`),
  },
  letrero: {
    n: "Letrero «Nuestro hogar»", cat: "deco", capa: "pared", w: 168, h: 66, y: 150, colores: ["#fff", "#ffd0e2", "#e3d6ff", "#fff0b8"],
    arte: (e, C) => svg(168, 66, `
      <path d="M58 6L84 0l26 6" stroke="#b39a8a" stroke-width="2" fill="none"/>
      <rect x="2" y="8" width="164" height="54" rx="14" fill="${C}" ${OL}/>
      <text x="84" y="44" text-anchor="middle" font-family="Caveat, Nunito, sans-serif" font-size="26" font-weight="700" fill="#c2336b">Nuestro hogar</text>
      ${corazon(16, 34, 0.7, "#ff86b0")}${corazon(152, 34, 0.7, "#ff86b0")}`),
  },
  banderines: {
    n: "Banderines", cat: "deco", capa: "pared", w: 246, h: 66, y: 120,
    arte: () => {
      const C = ["#ff9cbf", "#ffd36e", "#8fd0ff", "#94dfbd", "#c9a7ff"];
      let b = "";
      for (let i = 0; i < 9; i++) { const x = 14 + i * 25.4, y = 10 + Math.sin((i / 8) * Math.PI) * 16; b += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}h22l-11 ${i % 2 ? 26 : 30}z" fill="${C[i % 5]}" ${OL2}/><circle cx="${(x + 11).toFixed(1)}" cy="${(y + 9).toFixed(1)}" r="2.6" fill="#fff" opacity=".85"/>`; }
      return svg(246, 66, `<path d="M4 8q119 40 238 0" stroke="#b39a8a" stroke-width="2" fill="none"/>${b}`);
    },
  },
  calendario: {
    n: "Calendario", cat: "deco", capa: "pared", w: 74, h: 90, y: 236,
    dom: () => {
      const d = new Date();
      return el("div.ca-calendario", {}, [el("b", { text: String(d.getDate()) }), el("small", { text: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][d.getMonth()] })]);
    },
    arte: () => svg(74, 90, `
      <rect x="4" y="10" width="66" height="76" rx="8" fill="#fff" ${OL}/><rect x="4" y="10" width="66" height="22" rx="8" fill="#ff86b0"/><rect x="4" y="24" width="66" height="8" fill="#ff86b0"/>
      <rect x="18" y="4" width="6" height="14" rx="3" fill="#b39a8a"/><rect x="50" y="4" width="6" height="14" rx="3" fill="#b39a8a"/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${14 + i * 11.5}" cy="78" r="2" fill="#ffd0e2"/>`).join("")}`),
  },
  planta_alta: {
    n: "Planta alta", cat: "deco", w: 74, h: 178, al: "sacude",
    arte: () => svg(74, 178, `<g class="hojas">
      ${[[-6, 120, 30], [-14, 96, 18], [2, 132, 40], [10, 104, 52], [-20, 84, 26], [16, 90, 44]].map(([a, l, x], i) => `<path transform="translate(${x} 130) rotate(${a})" d="M0 0C-6-${l * 0.3}-5-${l * 0.7} 0-${l} 5-${l * 0.7} 6-${l * 0.3} 0 0z" fill="${i % 2 ? "#57b884" : "#7fd29b"}" ${OL2}/><path transform="translate(${x} 130) rotate(${a})" d="M0-6V-${l - 8}" stroke="#d4f3e3" stroke-width="1.3" stroke-dasharray="4 5"/>`).join("")}</g>
      <path d="M14 130h46l-5 44H19z" fill="#f3e3d3" ${OL}/><rect x="10" y="126" width="54" height="9" rx="4" fill="#e9d2bc" ${OL2}/><path d="M20 150h34" stroke="#ff9cbf" stroke-width="3"/>`),
  },
  espejo_sol: {
    n: "Espejo de sol", cat: "deco", capa: "pared", w: 100, h: 100, y: 222,
    arte: () => {
      let r = "";
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, l = i % 2 ? 44 : 49; r += `<path d="M${(50 + Math.cos(a) * 28).toFixed(1)} ${(50 + Math.sin(a) * 28).toFixed(1)}L${(50 + Math.cos(a) * l).toFixed(1)} ${(50 + Math.sin(a) * l).toFixed(1)}" stroke="#e9b94a" stroke-width="${i % 2 ? 4 : 6}" stroke-linecap="round"/>`; }
      return svg(100, 100, `${r}<circle cx="50" cy="50" r="30" fill="#f2c45e" ${OL}/><circle cx="50" cy="50" r="23" fill="#e6f4ff"/><path d="M38 42q6-10 14-11" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M44 62l16-16" stroke="#fff" stroke-width="2.5" opacity=".6"/>`);
    },
  },
};
