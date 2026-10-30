/** El baño: tina con espuma (para dos), excusado, lavabo, espejo (vestidor), toallas, patito y tapete. */
import { svg, OL, OL2, tono, brillo, corazon, sentado, MADERA_O } from "./arte.js";

export const ITEMS = {
  tina: {
    n: "Tina", cat: "bano", w: 232, h: 122, colores: ["#ffffff", "#ffd0e2", "#cdeeff", "#e3d6ff"],
    // En la tina: el monito va entre lo de atrás (agua) y lo de enfrente (la tina y su espuma).
    lugares: [{ dx: -40, dy: -16, pose: "banando", z: 1 }, { dx: 42, dy: -16, pose: "banando", z: 1 }],
    arte: () => svg(232, 122, `
      <path d="M196 44V14a10 10 0 0 1 10-10h10" stroke="#b39a8a" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="184" y="36" width="24" height="8" rx="4" fill="#b39a8a"/>
      <ellipse cx="112" cy="48" rx="104" ry="12" fill="#e8f6ff" ${OL}/><ellipse cx="112" cy="50" rx="96" ry="8" fill="#9fd8ff"/>`),
    frente: (e, C) => svg(232, 122, `
      <path d="M8 46h208v26a42 42 0 0 1-42 42H50A42 42 0 0 1 8 72z" fill="${C}" ${OL}/>
      <rect x="2" y="40" width="220" height="12" rx="6" fill="${tono(C, 0.95)}" ${OL}/>${brillo(20, 58, 150, 6, 3, 0.45)}
      <g class="espuma">${[34, 62, 92, 124, 154, 184].map((x, i) => `<circle cx="${x}" cy="${40 - (i % 2) * 5}" r="${13 + (i % 3) * 2}" fill="#fff" ${OL2}/>`).join("")}<circle cx="80" cy="22" r="5" fill="#fff" opacity=".9"/><circle cx="150" cy="18" r="4" fill="#fff" opacity=".9"/></g>
      <path d="M40 110l-6 10M184 110l6 10" stroke="#ffc98b" stroke-width="8" stroke-linecap="round"/>
      ${corazon(112, 82, 1.1, "#ff9cbf", 'opacity=".8"')}`),
  },
  inodoro: {
    n: "Excusado", cat: "bano", w: 78, h: 116, al: "inodoro", lugares: [sentado(0, -54)],
    arte: () => svg(78, 116, `
      <rect x="12" y="4" width="54" height="46" rx="10" fill="#fff" ${OL}/><rect x="52" y="12" width="10" height="5" rx="2.5" fill="#b9c9d4"/>${brillo(18, 10, 8, 30, 4, 0.5)}
      <path d="M6 58h66a33 22 0 0 1-33 30A33 22 0 0 1 6 58z" fill="#fff" ${OL}/>
      <rect x="2" y="52" width="74" height="10" rx="5" fill="#f0e8ff" ${OL}/>
      <path d="M26 86h26l4 28H22z" fill="#fff" ${OL}/>`),
  },
  lavabo: {
    n: "Lavabo", cat: "bano", w: 104, h: 128, al: "agua", junto: { dx: 0, dy: 24 },
    arte: () => svg(104, 128, `
      <path d="M40 60h24l6 66H34z" fill="#fff" ${OL}/>
      <path d="M4 40h96v4a28 28 0 0 1-28 28H32A28 28 0 0 1 4 44z" fill="#fff" ${OL}/><ellipse cx="52" cy="42" rx="40" ry="5" fill="#cdeeff"/>
      <path d="M52 40V20h16" stroke="#b39a8a" stroke-width="6" fill="none" stroke-linecap="round"/><rect class="chorro" x="64" y="22" width="4" height="20" rx="2" fill="#8fd0ff"/>
      <rect x="10" y="26" width="14" height="14" rx="4" fill="#ffb3cf" ${OL2}/><rect x="84" y="24" width="8" height="16" rx="3" fill="#94dfbd" ${OL2}/><path d="M88 24l-2-8" stroke="#ff86b0" stroke-width="2"/>`),
  },
  espejo: {
    n: "Espejo", cat: "bano", capa: "pared", w: 92, h: 124, y: 330, al: "vestir", colores: ["#c39bff", "#ff9cbf", "#ffd96b", "#94dfbd"],
    arte: (e, C) => svg(92, 124, `
      <ellipse cx="46" cy="62" rx="42" ry="58" fill="${C}" ${OL}/><ellipse cx="46" cy="62" rx="34" ry="50" fill="#e8f7ff"/>
      <path d="M28 38l14-14M26 56l26-26" stroke="#fff" stroke-width="6" stroke-linecap="round"/>${corazon(46, 8, 0.8, "#fff")}`),
  },
  toallero: {
    n: "Toallas", cat: "bano", capa: "pared", w: 86, h: 106, y: 360, colores: ["#ff9cbf", "#8fd0ff", "#ffd96b", "#94dfbd", "#c9a7ff"],
    arte: (e, C) => svg(86, 106, `
      <rect x="0" y="4" width="86" height="8" rx="4" fill="#b39a8a"/>
      <rect x="6" y="10" width="40" height="92" rx="10" fill="${C}" ${OL}/><rect x="6" y="78" width="40" height="8" fill="#fff" opacity=".6"/>
      <rect x="40" y="10" width="40" height="70" rx="10" fill="${tono(C, 1.3)}" ${OL}/><rect x="40" y="58" width="40" height="7" fill="#fff" opacity=".7"/>`),
  },
  patito: {
    n: "Patito", cat: "bano", w: 50, h: 46, y: 550, al: "cuac",
    arte: () => svg(50, 46, `
      <ellipse cx="24" cy="32" rx="21" ry="13" fill="#ffd84d" ${OL}/><circle cx="34" cy="16" r="12" fill="#ffd84d" ${OL}/>
      <path d="M44 16l9 3-9 4z" fill="#ff9e3d"/><circle cx="37" cy="13" r="2.2" fill="#3a2a35"/><ellipse cx="18" cy="30" rx="8" ry="5" fill="#ffc21a"/>${brillo(28, 7, 8, 4, 2, 0.6)}`),
  },
  tapete: {
    n: "Tapete", cat: "bano", capa: "alfombra", w: 132, h: 34, y: 556, colores: ["#cdeeff", "#ffd0e2", "#d4f3e3", "#fff0b8"],
    arte: (e, C) => svg(132, 34, `<rect x="2" y="4" width="128" height="26" rx="13" fill="${C}" ${OL}/>${[18, 40, 62, 84, 106].map((x) => `<circle cx="${x + 4}" cy="17" r="4" fill="#fff" opacity=".7"/>`).join("")}`),
  },
  regadera: {
    n: "Regadera", cat: "bano", w: 118, h: 234, al: "ducha", colores: ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#94dfbd", "#ffd36e"],
    // En la regadera: el monito va entre la pared de azulejo y el vidrio con la cortina.
    lugares: [{ dx: 10, dy: -14, pose: "duchando", z: 1 }],
    arte: () => svg(118, 234, `
      <rect x="6" y="12" width="106" height="210" rx="8" fill="#eaf6fb" ${OL}/>
      <path d="M6 54h106M6 96h106M6 138h106M6 180h106M41 12v210M77 12v210" stroke="#fff" stroke-width="2.5"/>
      <path d="M90 222V40a14 14 0 0 0-14-14H62" stroke="#b39a8a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M46 24h28l-4 11H50z" fill="#d9cfd6" ${OL2}/><circle cx="92" cy="150" r="5" fill="#d9cfd6" ${OL2}/>
      <g class="agua-cae"><path d="M52 38v150M58 38v156M64 38v150M70 38v156" stroke="#8fd0ff" stroke-width="2.2" stroke-dasharray="7 9" stroke-linecap="round"/></g>
      <rect x="0" y="216" width="118" height="16" rx="6" fill="#fff" ${OL}/>`),
    frente: (e, C) => svg(118, 234, `
      <rect x="40" y="22" width="74" height="196" rx="6" fill="#cdeeff" fill-opacity=".2" stroke="#9fc9df" stroke-width="2"/>
      <path d="M58 44l12 140" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
      <path d="M4 16h40v196c-12 5-28 5-40 0z" fill="${C}" ${OL}/><path d="M14 22v186M26 22v188M36 22v186" stroke="${tono(C, 0.85)}" stroke-width="2"/>
      <rect x="0" y="12" width="118" height="6" rx="3" fill="#b39a8a"/><rect x="0" y="216" width="118" height="16" rx="6" fill="#fff" ${OL}/>`),
  },
  lavadora: {
    n: "Lavadora", cat: "bano", w: 98, h: 124, al: "lavadora", colores: ["#ffffff", "#ffd0e2", "#cdeeff", "#e3d6ff"],
    arte: (e, C) => svg(98, 124, `
      <rect x="4" y="6" width="90" height="116" rx="10" fill="${C}" ${OL}/><rect x="4" y="6" width="90" height="24" rx="10" fill="${tono(C, 0.94)}"/>
      <rect x="12" y="12" width="24" height="11" rx="3" fill="#94dfbd"/><circle cx="62" cy="18" r="5" fill="#d9cfd6" ${OL2}/><circle cx="78" cy="18" r="5" fill="#ff9cbf" ${OL2}/>
      <circle cx="49" cy="76" r="31" fill="#d9cfd6" ${OL}/><circle cx="49" cy="76" r="24" fill="#bfe6ff"/>
      <g class="tambor"><circle cx="40" cy="70" r="8" fill="#ff9cbf"/><circle cx="58" cy="72" r="7" fill="#ffd36e"/><circle cx="48" cy="86" r="8" fill="#c9a7ff"/><circle cx="56" cy="62" r="4" fill="#fff"/></g>
      <path d="M33 62a20 20 0 0 1 14-9" stroke="#fff" stroke-opacity=".7" stroke-width="3.5" stroke-linecap="round" fill="none"/>${brillo(10, 36, 6, 70, 3, 0.35)}`),
  },
  cesto: {
    n: "Cesto de ropa", cat: "bano", w: 68, h: 72, y: 548, al: "sacude",
    arte: () => svg(68, 72, `
      <path d="M14 10c4-8 14-10 20-2 4-6 14-8 20 0" fill="#ff9cbf" ${OL2}/><path d="M30 10c2-10 12-12 16-4" fill="#8fd0ff" ${OL2}/>
      <path d="M6 14h56l-6 54a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#e7c08e" ${OL}/>
      ${[24, 36, 48, 60].map((y) => `<path d="M${8 + (y - 14) * 0.11} ${y}h${52 - (y - 14) * 0.22}" stroke="#c9905c" stroke-width="2"/>`).join("")}${[18, 30, 42, 54].map((x) => `<path d="M${x} 16v52" stroke="#d9a46b" stroke-width="1.6"/>`).join("")}
      <rect x="2" y="10" width="64" height="8" rx="4" fill="#d9a46b" ${OL2}/>`),
  },
};
