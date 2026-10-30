/** El jardín: árbol con columpio, banca, buzón, flores que crecen, fuente, farol, asador y más. */
import { svg, OL, OL2, tono, brillo, corazon, hoja, sentado, MADERA, MADERA_O, MADERA_C } from "./arte.js";

export const ITEMS = {
  arbol: {
    n: "Árbol con columpio", cat: "jardin", w: 270, h: 362, y: 515,
    lugares: [{ ...sentado(71, -62), pose: "columpio" }],
    arte: () => svg(270, 362, `
      <path d="M118 362c6-60 4-150 6-214h26c2 64 0 154 8 214z" fill="#b07a52" ${OL}/>
      <path d="M126 220c-10-10-24-12-34-8M150 200c10-10 26-14 40-10" stroke="#b07a52" stroke-width="9" stroke-linecap="round" fill="none"/>
      <path d="M132 300q6-8 4-30" stroke="#8f6040" stroke-width="3" fill="none" opacity=".6"/>
      <g class="copa"><circle cx="135" cy="104" r="92" fill="#7fd29b" ${OL}/><circle cx="74" cy="118" r="54" fill="#6cc589" ${OL}/><circle cx="196" cy="124" r="56" fill="#8fdcab" ${OL}/><circle cx="130" cy="58" r="50" fill="#94e0b0"/>
        <path d="M90 60q30-30 70-20" stroke="#fff" stroke-opacity=".35" stroke-width="10" stroke-linecap="round" fill="none"/>
        ${[[70, 90], [150, 60], [200, 130], [110, 140], [176, 92], [60, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#ff7a8a" ${OL2}/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#fff" opacity=".7"/>`).join("")}</g>
      <path d="M176 172h62" stroke="#8f6040" stroke-width="10" stroke-linecap="round"/>
      <g class="columpio"><path d="M186 172v128M226 172v128" stroke="#8a6a52" stroke-width="3"/><rect x="174" y="296" width="64" height="12" rx="6" fill="#ff9cbf" ${OL}/></g>`),
  },
  banca: {
    n: "Banca", cat: "jardin", w: 178, h: 96, colores: ["#ffc98b", "#ff9cbf", "#8fd0ff", "#94dfbd", "#ffffff"],
    lugares: [sentado(-40, -50), sentado(40, -50)],
    arte: (e, C) => svg(178, 96, `
      ${[8, 26, 44].map((y) => `<rect x="6" y="${y}" width="166" height="12" rx="6" fill="${C}" ${OL2}/>`).join("")}
      <rect x="2" y="46" width="174" height="14" rx="7" fill="${tono(C, 0.9)}" ${OL}/>${brillo(8, 48, 150, 4, 2)}
      <path d="M18 2v92M160 2v92" stroke="#6b5a66" stroke-width="7" stroke-linecap="round"/><path d="M10 70h22M146 70h22" stroke="#6b5a66" stroke-width="6" stroke-linecap="round"/>`),
  },
  buzon: {
    n: "Buzón", cat: "jardin", w: 62, h: 134, al: "buzon",
    arte: () => svg(62, 134, `
      <rect x="26" y="54" width="10" height="80" fill="#b07a52"/>
      <path d="M4 30a27 27 0 0 1 54 0v28H4z" fill="#ff86b0" ${OL}/>${brillo(10, 12, 6, 34, 3)}
      <path d="M8 58h46" stroke="#e0457f" stroke-width="3"/>${corazon(31, 40, 1, "#fff")}
      <g class="banderita"><rect x="54" y="12" width="5" height="30" fill="#6b5a66"/><rect x="54" y="12" width="18" height="11" rx="2" fill="#ff5c93"/></g>
      <g class="carta"><rect x="14" y="16" width="34" height="22" rx="3" fill="#fff" ${OL2}/><path d="M14 18l17 12 17-12" stroke="#ff9cbf" stroke-width="2" fill="none"/></g>`),
  },
  flores: {
    n: "Flores", cat: "jardin", w: 102, h: 80, y: 548, al: "florecer",
    arte: () => {
      const flor = (x, y, c) => `<g><circle cx="${x}" cy="${y - 7}" r="6.5" fill="${c}"/><circle cx="${x - 7}" cy="${y}" r="6.5" fill="${c}"/><circle cx="${x + 7}" cy="${y}" r="6.5" fill="${c}"/><circle cx="${x - 4}" cy="${y + 7}" r="6.5" fill="${c}"/><circle cx="${x + 4}" cy="${y + 7}" r="6.5" fill="${c}"/><circle cx="${x}" cy="${y + 1}" r="5" fill="#ffd84d"/></g>`;
      return svg(102, 80, `
        <ellipse cx="51" cy="72" rx="48" ry="8" fill="#8a6a52" opacity=".55"/>
        ${[[20, 72, -60, 26], [34, 72, -100, 28], [52, 72, -80, 34], [70, 72, -110, 26], [84, 72, -70, 24]].map(([x, y, a, l]) => hoja(x, y, a, l, "#6cc589")).join("")}
        <g class="e0">${[24, 50, 78].map((x) => `<circle cx="${x}" cy="56" r="5" fill="#94e0b0" ${OL2}/>`).join("")}</g>
        <g class="e1">${[24, 50, 78].map((x, i) => `<path d="M${x} 70V${40 - i * 4}" stroke="#57b884" stroke-width="3"/><ellipse cx="${x}" cy="${38 - i * 4}" rx="6" ry="8" fill="${["#ff9cbf", "#ffd96b", "#c9a7ff"][i]}" ${OL2}/>`).join("")}</g>
        <g class="e2">${[24, 50, 78].map((x, i) => `<path d="M${x} 70V${34 - i * 4}" stroke="#57b884" stroke-width="3"/>${flor(x, 26 - i * 4, ["#ff9cbf", "#ffb84a", "#c9a7ff"][i])}`).join("")}</g>`);
    },
  },
  fuente: {
    n: "Fuente", cat: "jardin", w: 154, h: 142, al: "fuente",
    arte: () => svg(154, 142, `
      <ellipse cx="77" cy="116" rx="72" ry="20" fill="#cfd8e6" ${OL}/><ellipse cx="77" cy="112" rx="62" ry="13" fill="#8fd0ff"/>
      <rect x="66" y="56" width="22" height="56" rx="6" fill="#dfe6f0" ${OL}/><ellipse cx="77" cy="58" rx="34" ry="9" fill="#cfd8e6" ${OL}/><ellipse cx="77" cy="56" rx="26" ry="5" fill="#8fd0ff"/>
      <g class="agua"><path d="M77 54c-2-22 0-36 0-44M77 12c-14 6-26 22-30 44M77 12c14 6 26 22 30 44" stroke="#bfe8ff" stroke-width="5" stroke-linecap="round" fill="none"/></g>
      <path d="M8 116a69 18 0 0 0 138 0v8a69 18 0 0 1-138 0z" fill="#b9c3d2"/>${brillo(30, 108, 40, 4, 2, 0.5)}`),
  },
  farol: {
    n: "Farol", cat: "jardin", w: 56, h: 182, al: "luz", luz: true,
    arte: () => svg(56, 182, `
      <circle class="luz" cx="28" cy="36" r="34" fill="#fff3b0" opacity=".45"/>
      <rect x="24" y="52" width="8" height="122" rx="3" fill="#6b5a66"/><rect x="14" y="170" width="28" height="10" rx="4" fill="#6b5a66"/>
      <path d="M12 52h32L38 18H18z" fill="#fff7d6" ${OL}/><path d="M8 18h40L28 2z" fill="#6b5a66" ${OL2}/><rect x="10" y="50" width="36" height="6" rx="3" fill="#6b5a66"/>
      <path d="M28 22v26M20 34h16" stroke="#6b5a66" stroke-width="2" opacity=".5"/>`),
  },
  parrilla: {
    n: "Asador", cat: "jardin", w: 106, h: 120, al: "parrilla", lugares: [{ dx: 0, dy: 24, pose: "cocinando" }],
    arte: () => svg(106, 120, `
      <path d="M24 64l-12 54M82 64l12 54M53 66v50" stroke="#6b5a66" stroke-width="6" stroke-linecap="round"/>
      <path d="M6 30h94a47 36 0 0 1-94 0z" fill="#ff7a8a" ${OL}/>${brillo(16, 38, 30, 6, 3)}
      <rect x="2" y="24" width="102" height="10" rx="5" fill="#4f4458"/>
      <g class="comida"><rect x="26" y="14" width="24" height="10" rx="5" fill="#ffd84d" ${OL2}/><rect x="56" y="12" width="26" height="12" rx="6" fill="#a96a3f" ${OL2}/></g>
      <g class="vapor"><path d="M40 8c-5-7 5-9 0-16M62 6c-5-7 5-9 0-16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>`),
  },
  arbusto: {
    n: "Arbusto", cat: "jardin", w: 132, h: 88, y: 530,
    arte: () => svg(132, 88, `
      <circle cx="34" cy="54" r="32" fill="#6cc589" ${OL}/><circle cx="98" cy="54" r="32" fill="#6cc589" ${OL}/><circle cx="66" cy="40" r="38" fill="#7fd29b" ${OL}/>
      <rect x="4" y="66" width="124" height="22" rx="11" fill="#6cc589"/>
      ${[[40, 34, "#ff9cbf"], [74, 22, "#ffd96b"], [96, 46, "#ff9cbf"], [58, 56, "#c9a7ff"], [26, 60, "#fff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#ffd84d"/>`).join("")}
      <path d="M50 16q16-10 32 0" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round" fill="none"/>`),
  },
  puerta: {
    n: "Puerta de la casa", cat: "jardin", w: 102, h: 212, al: "puerta", colores: ["#ffb066", "#ff86b0", "#8fd0ff", "#94dfbd", "#c9a7ff"],
    arte: (e, C) => svg(102, 212, `
      <rect x="0" y="0" width="102" height="212" rx="51" ry="44" fill="#fff6ea" ${OL}/>
      <rect x="10" y="12" width="82" height="200" rx="41" ry="36" fill="${C}" ${OL}/>
      <rect x="22" y="30" width="58" height="70" rx="29" ry="26" fill="${tono(C, 1.25)}" ${OL2}/>${corazon(51, 62, 1.6, "#ff5c93")}
      <rect x="22" y="112" width="58" height="80" rx="8" fill="${tono(C, 1.12)}" ${OL2}/>
      <circle cx="78" cy="120" r="6" fill="#ffd84d" ${OL2}/>`),
  },
  casita_perro: {
    n: "Casita del perrito", cat: "jardin", w: 126, h: 114, y: 520, colores: ["#ff9cbf", "#8fd0ff", "#ffd96b", "#94dfbd"],
    arte: (e, C) => svg(126, 114, `
      <path d="M12 52h102v60H12z" fill="${MADERA_C}" ${OL}/>${[64, 76, 88, 100].map((y) => `<path d="M14 ${y}h98" stroke="${MADERA}" stroke-width="2"/>`).join("")}
      <path d="M4 56L63 6l59 50z" fill="${C}" ${OL}/>${brillo(30, 34, 40, 5, 2)}
      <path d="M44 112V86a19 19 0 0 1 38 0v26z" fill="#4a3b46"/>${corazon(63, 64, 0.9, "#ff5c93")}
      <g class="perro-dentro"><ellipse cx="63" cy="100" rx="15" ry="12" fill="#e8c39e"/><path d="M48 96q-4 10 4 14M78 96q4 10-4 14" fill="#c8956d"/><circle cx="57" cy="97" r="2.2" fill="#3a2a35"/><circle cx="69" cy="97" r="2.2" fill="#3a2a35"/><ellipse cx="63" cy="104" rx="3" ry="2.2" fill="#3a2a35"/><path d="M60 108q3 3 6 0" stroke="#3a2a35" stroke-width="1.4" fill="none"/></g>`),
  },
};
