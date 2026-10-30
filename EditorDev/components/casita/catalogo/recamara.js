/** La recámara: cama para dos, buró, ropero (vestidor), escritorio, osito y cajita musical. */
import { svg, OL, OL2, tono, brillo, corazon, estrella, sentado, MADERA, MADERA_O, MADERA_C } from "./arte.js";

export const ITEMS = {
  cama: {
    n: "Cama", cat: "recamara", w: 252, h: 134, colores: ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#94dfbd", "#ffd96b"],
    // Acostaditos: la cabeza en su almohada y la cobija (el «frente») les tapa hasta el pecho.
    lugares: [{ dx: -23, dy: 9, pose: "dormido", z: 1 }, { dx: 41, dy: 9, pose: "dormido", z: 1 }],
    arte: (e, C) => svg(252, 134, `
      <rect x="0" y="6" width="38" height="122" rx="16" fill="${tono(C, 0.85)}" ${OL}/>${corazon(19, 40, 1.3, "#fff", 'opacity=".75"')}${brillo(6, 16, 8, 60, 4)}
      <rect x="20" y="62" width="228" height="42" rx="16" fill="#fff" ${OL}/>
      <rect x="40" y="46" width="60" height="28" rx="13" fill="#fff6fa" ${OL}/><rect x="104" y="46" width="60" height="28" rx="13" fill="#f6f0ff" ${OL}/>
      <rect x="22" y="100" width="226" height="16" rx="6" fill="${MADERA}" ${OL}/>
      <rect x="28" y="114" width="12" height="18" rx="4" fill="${MADERA_O}"/><rect x="228" y="114" width="12" height="18" rx="4" fill="${MADERA_O}"/>`),
    frente: (e, C) => svg(252, 134, `
      <path d="M58 84h184a8 8 0 0 1 8 8v16a10 10 0 0 1-10 10H68a10 10 0 0 1-10-10z" fill="${C}" ${OL}/>
      <path d="M58 84h192v11H58z" fill="${tono(C, 1.3)}"/>
      ${[110, 160, 210].map((x, i) => corazon(x, 108 - (i % 2) * 3, 0.8, "#fff", 'opacity=".6"')).join("")}`),
  },
  buro: {
    n: "Buró con lamparita", cat: "recamara", w: 74, h: 160, al: "luz", luz: true,
    arte: () => svg(74, 160, `
      <path class="luz" d="M14 44l-44 116h132L60 44z" fill="#fff3b0" opacity=".34"/>
      <rect x="4" y="90" width="66" height="66" rx="10" fill="${MADERA_C}" ${OL}/><rect x="12" y="104" width="50" height="18" rx="5" fill="#fff4e6" ${OL2}/><rect x="12" y="128" width="50" height="18" rx="5" fill="#fff4e6" ${OL2}/>
      <circle cx="37" cy="113" r="3" fill="${MADERA_O}"/><circle cx="37" cy="137" r="3" fill="${MADERA_O}"/>
      <rect x="33" y="44" width="8" height="40" fill="#b39a8a"/><ellipse cx="37" cy="86" rx="14" ry="4" fill="#9c8577"/>
      <path d="M14 46l8-34h30l8 34z" fill="#ffd0e2" ${OL}/>${corazon(37, 30, 0.8, "#ff86b0")}
      <rect x="54" y="76" width="12" height="14" rx="3" fill="#bfe8ff" ${OL2}/>`),
  },
  ropero: {
    n: "Ropero", cat: "recamara", w: 126, h: 216, al: "vestir", junto: { dx: 0, dy: 26 }, colores: ["#d9a7ff", "#ffb3cf", "#9fd8ff", "#94dfbd", "#ffe2a8"],
    arte: (e, C) => svg(126, 216, `
      <rect x="4" y="4" width="118" height="206" rx="12" fill="${C}" ${OL}/>
      <g class="dentro"><rect x="12" y="14" width="102" height="176" rx="6" fill="#fff8fb"/><rect x="14" y="30" width="98" height="4" fill="#b39a8a"/>
        ${[22, 44, 66, 88].map((x, i) => `<path d="M${x} 32l-8 16v36h18V48z" fill="${["#ff86b0", "#8fd0ff", "#ffd96b", "#94dfbd"][i]}" ${OL2}/>`).join("")}</g>
      <rect class="puerta-i" x="12" y="14" width="50" height="176" rx="6" fill="${tono(C, 1.15)}" ${OL2}/><rect class="puerta-d" x="64" y="14" width="50" height="176" rx="6" fill="${tono(C, 1.15)}" ${OL2}/>
      <circle cx="54" cy="104" r="4" fill="${tono(C, 0.65)}"/><circle cx="72" cy="104" r="4" fill="${tono(C, 0.65)}"/>
      ${corazon(37, 48, 1.1, "#fff", 'opacity=".8"')}${corazon(89, 48, 1.1, "#fff", 'opacity=".8"')}
      ${brillo(18, 20, 6, 70, 3, 0.35)}<rect x="10" y="206" width="12" height="8" fill="${MADERA_O}"/><rect x="104" y="206" width="12" height="8" fill="${MADERA_O}"/>`),
  },
  escritorio: {
    n: "Escritorio", cat: "recamara", w: 158, h: 116, al: "laptop",
    arte: () => svg(158, 116, `
      <rect x="4" y="40" width="150" height="12" rx="4" fill="${MADERA}" ${OL}/>
      <rect x="10" y="50" width="50" height="62" rx="5" fill="${MADERA_C}" ${OL}/><rect x="16" y="58" width="38" height="16" rx="4" fill="#fff4e6" ${OL2}/><rect x="16" y="80" width="38" height="16" rx="4" fill="#fff4e6" ${OL2}/>
      <path d="M144 50v62" stroke="${MADERA_O}" stroke-width="8" stroke-linecap="round"/>
      <path d="M70 40l6-34h56l6 34z" fill="#c9c2cc" ${OL2}/><path class="pantalla" d="M78 34l5-24h44l5 24z" fill="#4f4458"/>
      <g class="en-pantalla">${corazon(105, 22, 0.9, "#ff5c93")}</g>
      <rect x="64" y="36" width="80" height="6" rx="3" fill="#b8b0bc"/>
      <rect x="16" y="22" width="16" height="18" rx="4" fill="#ffb3cf" ${OL2}/><path d="M20 22l-2-12M26 22l2-14M24 22v-10" stroke="#ffd96b" stroke-width="3"/>`),
  },
  silla_esc: {
    n: "Silla del escritorio", cat: "recamara", w: 66, h: 110, y: 540, colores: ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#ffd96b"],
    lugares: [sentado(0, -52)],
    arte: (e, C) => svg(66, 110, `
      <rect x="10" y="4" width="46" height="48" rx="16" fill="${C}" ${OL}/>${brillo(16, 10, 12, 30, 6)}
      <rect x="4" y="54" width="58" height="14" rx="7" fill="${tono(C, 0.88)}" ${OL}/>
      <rect x="30" y="66" width="6" height="26" fill="#9c8577"/><path d="M12 104l21-12 21 12" stroke="#9c8577" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="104" r="5" fill="#6b5a66"/><circle cx="54" cy="104" r="5" fill="#6b5a66"/>`),
  },
  peluche: {
    n: "Osito", cat: "recamara", w: 66, h: 78, y: 548, al: "chillido", colores: ["#d9a77a", "#ffc1d6", "#f2f2f2", "#c9a7ff"],
    arte: (e, C) => svg(66, 78, `
      <circle cx="16" cy="16" r="11" fill="${tono(C, 0.85)}" ${OL2}/><circle cx="50" cy="16" r="11" fill="${tono(C, 0.85)}" ${OL2}/>
      <ellipse cx="33" cy="58" rx="25" ry="19" fill="${C}" ${OL}/><circle cx="33" cy="32" r="22" fill="${C}" ${OL}/>
      <ellipse cx="33" cy="40" rx="10" ry="8" fill="${tono(C, 1.35)}"/><circle cx="25" cy="29" r="3" fill="#3a2a35"/><circle cx="41" cy="29" r="3" fill="#3a2a35"/>
      <ellipse cx="33" cy="37" rx="3.5" ry="2.5" fill="#3a2a35"/><ellipse cx="20" cy="38" rx="4" ry="2.5" fill="#ff9cbf" opacity=".7"/><ellipse cx="46" cy="38" rx="4" ry="2.5" fill="#ff9cbf" opacity=".7"/>
      ${corazon(33, 60, 1.1, "#ff5c93")}<ellipse cx="14" cy="70" rx="8" ry="6" fill="${tono(C, 0.9)}" ${OL2}/><ellipse cx="52" cy="70" rx="8" ry="6" fill="${tono(C, 0.9)}" ${OL2}/>`),
  },
  cajita: {
    n: "Cajita musical", cat: "recamara", w: 60, h: 66, y: 548, al: "musica", musica: "cuna",
    arte: () => svg(60, 66, `
      <path d="M6 30L2 4h56l-4 26z" fill="#ffc1d6" ${OL2}/>${estrella(30, 16, 6, "#fff")}
      <g class="gira">${corazon(30, 32, 0.9, "#ff5c93")}<rect x="29" y="34" width="2" height="8" fill="#b39a8a"/></g>
      <rect x="4" y="40" width="52" height="24" rx="5" fill="#ff9cbf" ${OL}/>${brillo(8, 43, 30, 4, 2)}
      <rect x="22" y="48" width="16" height="8" rx="3" fill="#ffd96b"/>`),
  },
};
