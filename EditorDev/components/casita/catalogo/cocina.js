/** La cocina: refri, estufa, fregadero, café, tostador, mesa, sillas y alacena. */
import { svg, OL, OL2, tono, brillo, corazon, sentado, MADERA, MADERA_O, MADERA_C } from "./arte.js";

const barra = (C) => `
  <rect x="4" y="44" width="112" height="80" rx="6" fill="${C}" ${OL}/>
  <rect x="12" y="56" width="46" height="60" rx="5" fill="${tono(C, 1.12)}" ${OL2}/><rect x="62" y="56" width="46" height="60" rx="5" fill="${tono(C, 1.12)}" ${OL2}/>
  <rect x="48" y="80" width="6" height="14" rx="3" fill="${tono(C, 0.7)}"/><rect x="66" y="80" width="6" height="14" rx="3" fill="${tono(C, 0.7)}"/>
  <rect x="0" y="36" width="120" height="12" rx="4" fill="#f6efe8" ${OL}/>`;

export const ITEMS = {
  refri: {
    n: "Refri", cat: "cocina", w: 104, h: 214, al: "refri", junto: { dx: 74, dy: 16 }, colores: ["#bfe8ff", "#ffd0e2", "#d4f3e3", "#fff0b8", "#f2f2f2"],
    arte: (e, C) => svg(104, 214, `
      <rect x="4" y="4" width="96" height="206" rx="18" fill="${C}" ${OL}/>
      <g class="dentro"><rect x="10" y="76" width="84" height="122" rx="8" fill="#fffaf2"/><rect x="10" y="120" width="84" height="4" fill="#e6dccf"/><rect x="10" y="160" width="84" height="4" fill="#e6dccf"/>
        <circle cx="28" cy="108" r="9" fill="#ff7a8a"/><rect x="44" y="96" width="22" height="22" rx="5" fill="#fff" ${OL2}/><rect x="70" y="100" width="16" height="18" rx="4" fill="#ffd96b"/>
        <path d="M24 156l12-24 12 24z" fill="#ffb3cf"/><rect x="56" y="142" width="28" height="16" rx="6" fill="#a0d995"/><circle cx="34" cy="186" r="9" fill="#c39bff"/><rect x="56" y="176" width="28" height="18" rx="4" fill="#ffb48a"/></g>
      <path class="puerta-b" d="M4 76h96v116a18 18 0 0 1-18 18H22A18 18 0 0 1 4 192z" fill="${tono(C, 1.08)}" ${OL}/>
      <rect x="4" y="70" width="96" height="6" fill="${tono(C, 0.85)}"/>
      <rect x="80" y="22" width="7" height="34" rx="3.5" fill="${tono(C, 0.7)}"/><rect class="manija" x="80" y="92" width="7" height="44" rx="3.5" fill="${tono(C, 0.7)}"/>
      ${brillo(12, 12, 8, 50, 4, 0.45)}
      <circle cx="28" cy="32" r="7" fill="#ff86b0" ${OL2}/>${corazon(52, 30, 0.9, "#ff5c93")}<rect x="22" y="46" width="22" height="16" rx="2" fill="#fff" transform="rotate(-6 33 54)" ${OL2}/>`),
  },
  estufa: {
    n: "Estufa", cat: "cocina", w: 122, h: 136, al: "estufa", lugares: [{ dx: 0, dy: 26, pose: "cocinando" }],
    arte: () => svg(122, 136, `
      <rect x="4" y="34" width="114" height="100" rx="10" fill="#f6efe8" ${OL}/>
      <rect x="16" y="62" width="90" height="56" rx="8" fill="#5e5260" ${OL2}/><rect class="horno" x="22" y="68" width="78" height="44" rx="6" fill="#3d3440"/>
      <rect x="22" y="70" width="40" height="6" rx="3" fill="#fff" opacity=".18"/>
      <rect x="2" y="26" width="118" height="12" rx="4" fill="#d9cfc6" ${OL}/>
      ${[24, 44, 78, 98].map((x) => `<circle cx="${x}" cy="48" r="5" fill="#b8aaa1" ${OL2}/>`).join("")}
      <g class="sarten"><ellipse cx="46" cy="24" rx="30" ry="7" fill="#4f4458"/><rect x="74" y="20" width="34" height="6" rx="3" fill="#6b5a66"/><g class="hotcake"><ellipse cx="46" cy="19" rx="18" ry="5" fill="#f2b45a"/><ellipse cx="46" cy="17" rx="14" ry="3.5" fill="#ffd28a"/></g></g>
      <g class="fuego"><path d="M34 32q4-8 6 0M44 32q4-10 6 0M54 32q4-8 6 0" stroke="#ff8a3d" stroke-width="3" fill="none"/></g>
      <g class="vapor"><path d="M38 4c-6-8 6-12 0-20M54 6c-6-8 6-12 0-20" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/></g>`),
  },
  fregadero: {
    n: "Fregadero", cat: "cocina", w: 152, h: 126, al: "agua", junto: { dx: 0, dy: 24 }, colores: ["#94dfbd", "#ffd0e2", "#bfe8ff", "#e3d6ff", "#ffe2a8"],
    arte: (e, C) => svg(152, 126, `
      <rect x="4" y="44" width="144" height="80" rx="6" fill="${C}" ${OL}/>
      ${[12, 60, 108].map((x) => `<rect x="${x}" y="56" width="${x === 108 ? 32 : 44}" height="60" rx="5" fill="${tono(C, 1.12)}" ${OL2}/>`).join("")}
      <rect x="0" y="36" width="152" height="12" rx="4" fill="#f6efe8" ${OL}/>
      <rect x="40" y="36" width="60" height="7" rx="3" fill="#b9c9d4"/>
      <path d="M70 36V14a10 10 0 0 1 10-10h8" stroke="#b39a8a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect class="chorro" x="86" y="8" width="5" height="30" rx="2.5" fill="#8fd0ff"/>
      <circle cx="62" cy="30" r="4" fill="#ff86b0"/><circle cx="96" cy="30" r="4" fill="#8fd0ff"/>
      <path d="M122 36c-6-12 0-24 8-26 6 8 4 20-2 26z" fill="#7fd29b" ${OL2}/><rect x="118" y="26" width="18" height="12" rx="3" fill="#ffb48a" ${OL2}/>
      <rect x="10" y="22" width="22" height="16" rx="3" fill="#fff" ${OL2}/><rect x="14" y="14" width="4" height="10" fill="#ffd96b"/><rect x="22" y="12" width="4" height="12" fill="#8fd0ff"/>`),
  },
  barra_cafe: {
    n: "Cafetera", cat: "cocina", w: 120, h: 128, al: "cafe", junto: { dx: 0, dy: 24 }, colores: ["#ffd0e2", "#bfe8ff", "#94dfbd", "#ffe2a8"],
    arte: (e, C) => svg(120, 128, `${barra(C)}
      <rect x="30" y="2" width="44" height="36" rx="8" fill="#6b5a66" ${OL}/><rect x="36" y="8" width="32" height="10" rx="3" fill="#8a7a86"/>
      <rect x="44" y="24" width="18" height="14" rx="3" fill="#fff" ${OL2}/><path d="M62 28h4a3 3 0 0 1 0 6h-4" stroke="#fff" stroke-width="2.5" fill="none"/>
      <g class="vapor"><path d="M50 18c-4-6 4-8 0-14M56 18c-4-6 4-8 0-14" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/></g>
      <rect x="86" y="22" width="16" height="15" rx="4" fill="#ff9cbf" ${OL2}/>${corazon(94, 29, 0.45, "#fff")}`),
  },
  barra_tostador: {
    n: "Tostador", cat: "cocina", w: 120, h: 128, al: "tostador", junto: { dx: 0, dy: 24 }, colores: ["#bfe8ff", "#ffd0e2", "#94dfbd", "#ffe2a8"],
    arte: (e, C) => svg(120, 128, `${barra(C)}
      <g class="pan"><rect x="40" y="2" width="16" height="22" rx="4" fill="#f2c27a" ${OL2}/><rect x="60" y="2" width="16" height="22" rx="4" fill="#f2c27a" ${OL2}/></g>
      <rect x="30" y="12" width="56" height="26" rx="10" fill="#ff9cbf" ${OL}/><rect x="38" y="12" width="40" height="4" rx="2" fill="#4f4458"/>
      ${brillo(36, 20, 24, 4, 2, 0.5)}<rect x="88" y="22" width="6" height="4" rx="2" fill="#b39a8a"/>
      <circle cx="16" cy="28" r="9" fill="#ff7a8a" ${OL2}/><path d="M16 19v-4" stroke="#57b884" stroke-width="2"/>`),
  },
  mesa: {
    n: "Mesa", cat: "cocina", w: 176, h: 104, y: 535, colores: ["#ffffff", "#ffd0e2", "#cdeeff", "#fff0b8"],
    arte: (e, C) => svg(176, 104, `
      <path d="M20 40l-6 62M156 40l6 62" stroke="${MADERA_O}" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="88" cy="38" rx="86" ry="12" fill="${MADERA}" ${OL}/>
      <path d="M8 36q80 14 160 0v14q-80 14-160 0z" fill="${C}" ${OL2}/>${[24, 56, 88, 120, 152].map((x) => `<circle cx="${x}" cy="${46 + Math.sin(x) * 1.5}" r="3" fill="#ff9cbf"/>`).join("")}
      <path d="M58 30q16 10 32 0z" fill="#fff" ${OL2}/><circle cx="66" cy="24" r="7" fill="#ff7a8a"/><circle cx="78" cy="22" r="7" fill="#ffd96b"/><circle cx="72" cy="16" r="6" fill="#a0d995"/>
      <rect x="112" y="16" width="14" height="16" rx="3" fill="#bfe8ff" ${OL2}/><path d="M119 16c-2-8 4-12 4-12" stroke="#57b884" stroke-width="2" fill="none"/>${corazon(123, 4, 0.5, "#ff5c93")}`),
  },
  silla: {
    n: "Silla", cat: "cocina", w: 64, h: 114, y: 530, colores: ["#ffc98b", "#ff9cbf", "#c9a7ff", "#94dfbd", "#8fd0ff"],
    lugares: [sentado(0, -52)],
    arte: (e, C) => svg(64, 114, `
      <rect x="8" y="2" width="48" height="58" rx="14" fill="${C}" ${OL}/>${corazon(32, 26, 0.9, "#fff", 'opacity=".7"')}
      <rect x="2" y="56" width="60" height="14" rx="7" fill="${tono(C, 0.88)}" ${OL}/>${brillo(8, 58, 44, 4, 2)}
      <path d="M10 68l-2 44M54 68l2 44" stroke="${MADERA_O}" stroke-width="7" stroke-linecap="round"/>`),
  },
  alacena: {
    n: "Alacena", cat: "cocina", capa: "pared", w: 176, h: 86, y: 230,
    arte: () => svg(176, 86, `
      <rect x="0" y="36" width="176" height="10" rx="4" fill="${MADERA}" ${OL}/><rect x="0" y="76" width="176" height="10" rx="4" fill="${MADERA}" ${OL}/>
      <path d="M12 46l4 6M164 46l-4 6M12 86l4 6M164 86l-4 6" stroke="${MADERA_O}" stroke-width="4"/>
      <rect x="14" y="10" width="22" height="26" rx="6" fill="#ffd96b" ${OL2}/><rect x="14" y="8" width="22" height="7" rx="3" fill="#ff86b0"/>
      <rect x="42" y="4" width="22" height="32" rx="6" fill="#ffb3cf" ${OL2}/><rect x="42" y="2" width="22" height="7" rx="3" fill="#c9a7ff"/>
      <rect x="70" y="14" width="22" height="22" rx="6" fill="#bfe8ff" ${OL2}/><rect x="70" y="12" width="22" height="6" rx="3" fill="#94dfbd"/>
      <circle cx="120" cy="20" r="16" fill="#fff" ${OL2}/><circle cx="120" cy="20" r="10" fill="none" stroke="#8fd0ff" stroke-width="3"/><circle cx="148" cy="22" r="14" fill="#fff" ${OL2}/><circle cx="148" cy="22" r="8" fill="none" stroke="#ff9cbf" stroke-width="3"/>
      ${[20, 46, 72].map((x, i) => `<path d="M${x} 76v-16a8 8 0 0 1 16 0v16" fill="${["#ff9cbf", "#8fd0ff", "#ffd96b"][i]}" ${OL2}/>`).join("")}
      <path d="M110 76c-2-14 6-22 12-26 6 4 14 12 12 26z" fill="#7fd29b" ${OL2}/><rect x="146" y="58" width="22" height="18" rx="4" fill="#fff" ${OL2}/><path d="M168 64h4a4 4 0 0 1 0 8h-4" stroke="#fff" stroke-width="3" fill="none"/>`),
  },
};
