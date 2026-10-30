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
      <g class="sarten"><ellipse cx="46" cy="24" rx="30" ry="7" fill="#4f4458"/><rect x="74" y="20" width="34" height="6" rx="3" fill="#6b5a66"/><g class="hotcake"><ellipse cx="46" cy="19" rx="18" ry="5" fill="#f2b45a"/><ellipse cx="46" cy="17" rx="14" ry="3.5" fill="#ffd28a" opacity=".7"/></g></g>
      <g class="olla"><path d="M20 20h-6M74 20h6" stroke="#6b5a66" stroke-width="4" stroke-linecap="round"/><rect x="20" y="4" width="54" height="26" rx="7" fill="#ff9cbf" ${OL}/><rect x="16" y="1" width="62" height="7" rx="3.5" fill="#ff86b0" ${OL2}/><ellipse class="caldo" cx="47" cy="4.6" rx="25" ry="3"/>${corazon(47, 18, 0.7, "#fff", 'opacity=".8"')}</g>
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
    n: "Mesa", cat: "cocina", w: 176, h: 104, y: 535, al: "mesa", colores: ["#ffffff", "#ffd0e2", "#cdeeff", "#fff0b8"],
    // Donde se sirven los platillos (uno de cada lado, para los dos) y las sillas de junto para comer.
    superficie: [[42, 36], [134, 36]],
    arte: (e, C) => svg(176, 104, `
      <path d="M48 46l-2 52M128 46l2 52" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
      <path d="M20 40l-6 62M156 40l6 62" stroke="${MADERA_O}" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="88" cy="38" rx="86" ry="12" fill="${MADERA}" ${OL}/><path d="M18 34q70-10 140 0" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M8 36q80 14 160 0v14q-80 14-160 0z" fill="${C}" ${OL2}/>${[24, 56, 88, 120, 152].map((x) => `<circle cx="${x}" cy="${46 + Math.sin(x) * 1.5}" r="3" fill="#ff9cbf"/>`).join("")}
      <path d="M70 31h36l3 8H67z" fill="#fff" opacity=".75"/>
      <g class="adorno"><rect x="81" y="18" width="14" height="16" rx="4" fill="#bfe8ff" ${OL2}/><path d="M88 18c-2-8 2-12 2-12M88 18c2-6 7-8 7-8" stroke="#57b884" stroke-width="2" fill="none"/>${corazon(90, 5, 0.5, "#ff5c93")}<circle cx="96" cy="9" r="3" fill="#ffd96b"/></g>`),
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
  barra_micro: {
    n: "Microondas", cat: "cocina", w: 120, h: 128, al: "micro", junto: { dx: 0, dy: 24 }, colores: ["#ffd0e2", "#bfe8ff", "#94dfbd", "#ffe2a8"],
    arte: (e, C) => svg(120, 128, `${barra(C)}
      <rect x="14" y="0" width="92" height="38" rx="7" fill="#fff" ${OL}/><rect x="20" y="6" width="58" height="26" rx="5" fill="#4f4458"/>
      <g class="dentro-micro"><rect x="22" y="8" width="54" height="22" rx="4" fill="#ffd77a" opacity=".0"/><ellipse class="plato-micro" cx="49" cy="26" rx="16" ry="3" fill="#fff" opacity=".8"/></g>
      <rect x="22" y="8" width="20" height="5" rx="2.5" fill="#fff" opacity=".18"/>
      <rect x="84" y="7" width="16" height="7" rx="2" fill="#94dfbd"/>${[17, 23, 29].map((y) => `<circle cx="88" cy="${y}" r="2" fill="#d9cfd6"/><circle cx="96" cy="${y}" r="2" fill="#d9cfd6"/>`).join("")}`),
  },
  barra_licuadora: {
    n: "Licuadora", cat: "cocina", w: 120, h: 128, al: "licuadora", junto: { dx: 0, dy: 24 }, colores: ["#bfe8ff", "#ffd0e2", "#94dfbd", "#ffe2a8"],
    arte: (e, C) => svg(120, 128, `${barra(C)}
      <rect x="40" y="24" width="34" height="14" rx="4" fill="#ff86b0" ${OL}/><circle cx="57" cy="31" r="3" fill="#fff"/>
      <g class="vaso-l"><path d="M42 24l-4-24h38l-4 24z" fill="#fff" fill-opacity=".55" ${OL}/><path d="M43 22l-2.6-14h33.2L71 22z" fill="#ff9cbf"/><rect x="38" y="-4" width="38" height="6" rx="3" fill="#6b5a66"/></g>
      <circle cx="94" cy="28" r="9" fill="#ffd84d" ${OL2}/><path d="M90 24q4 4 8 0" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="20" cy="30" r="7" fill="#ff5c6c" ${OL2}/>`),
  },
  barra_fruta: {
    n: "Frutero", cat: "cocina", w: 120, h: 128, al: "frutero", junto: { dx: 0, dy: 24 }, colores: ["#94dfbd", "#ffd0e2", "#bfe8ff", "#ffe2a8"],
    arte: (e, C) => svg(120, 128, `${barra(C)}
      <path d="M28 22h64a32 14 0 0 1-64 0z" fill="#fff" ${OL}/><path d="M32 28q28 10 56 0" stroke="#ff9cbf" stroke-width="2" fill="none"/>
      <circle cx="44" cy="16" r="9" fill="#ff5c6c" ${OL2}/><circle cx="60" cy="13" r="9" fill="#ffd84d" ${OL2}/><circle cx="76" cy="16" r="9" fill="#a0d995" ${OL2}/>
      <path d="M50 8c8-10 26-12 34-2-10-2-24 0-34 2z" fill="#ffe066" ${OL2}/><path d="M44 7l1-4M76 7l2-4" stroke="#8a5a3b" stroke-width="2"/>
      ${[[90, 10], [95, 14], [92, 18], [98, 9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#b48ae8" ${OL2}/>`).join("")}`),
  },
  bote_basura: {
    n: "Bote de basura", cat: "cocina", w: 54, h: 72, y: 548, al: "basura", colores: ["#94dfbd", "#ff9cbf", "#8fd0ff", "#ffd36e"],
    arte: (e, C) => svg(54, 72, `
      <path d="M8 18h38l-4 50a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="${C}" ${OL}/><path d="M18 26v38M27 26v38M36 26v38" stroke="#fff" stroke-opacity=".45" stroke-width="2.5"/>
      <g class="tapa"><rect x="4" y="10" width="46" height="9" rx="4.5" fill="${tono(C, 0.88)}" ${OL}/><rect x="21" y="4" width="12" height="7" rx="3" fill="${tono(C, 0.75)}"/></g>
      <rect x="20" y="66" width="14" height="5" rx="2" fill="#6b5a66"/>`),
  },
  especiero: {
    n: "Especiero", cat: "cocina", capa: "pared", w: 126, h: 70, y: 262,
    arte: () => svg(126, 70, `
      <rect x="0" y="34" width="126" height="9" rx="4" fill="${MADERA}" ${OL}/><path d="M10 43l3 6M116 43l-3 6" stroke="${MADERA_O}" stroke-width="4"/>
      ${[["#ff8a3d", 8], ["#ffd84d", 26], ["#7fd29b", 44], ["#ff5c6c", 62]].map(([c, x]) => `<rect x="${x}" y="12" width="14" height="22" rx="4" fill="#fff" ${OL2}/><rect x="${x + 1.5}" y="20" width="11" height="12" rx="2" fill="${c}"/><rect x="${x - 1}" y="8" width="16" height="6" rx="2" fill="#c9a7ff"/>`).join("")}
      <path d="M92 0v26M104 0v30M116 0v24" stroke="#b39a8a" stroke-width="2"/><ellipse cx="92" cy="30" rx="5" ry="6" fill="#d9cfd6" ${OL2}/><rect x="99" y="30" width="10" height="12" rx="2" fill="#ff9cbf" ${OL2}/><circle cx="116" cy="29" r="6" fill="none" stroke="#d9cfd6" stroke-width="2.4"/>`),
  },
};
