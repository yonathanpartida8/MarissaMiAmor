/**
 * Cositas lindas (Fase 58): más cosas tiernas para decorar (se ven en pixel art como todo lo demás):
 * cojín de corazón, lámpara de nube, estrellitas de luz, arbolito con foquitos, fuerte de cobijas, osito
 * gigante, juego de té, pizarrita de amor, gatito en su canasta y una rosita.
 */
import { svg, OL, OL2, tono, brillo, corazon, estrella, sentado } from "./arte.js";

export const ITEMS = {
  cojin_corazon: {
    n: "Cojín de corazón", cat: "sala", w: 70, h: 56, al: "boing", colores: ["#ff8fb8", "#c39bff", "#ffd36e", "#86d6f2"],
    lugares: [sentado(0, -26)],
    arte: (e, C) => svg(70, 56, `
      <path d="M35 54C18 44 4 34 4 18A14 14 0 0 1 35 12a14 14 0 0 1 31 6c0 16-14 26-31 36z" fill="${C}" ${OL}/>
      <path d="M35 46C22 38 12 30 12 19" stroke="${tono(C, 0.85)}" stroke-width="3" fill="none"/>${brillo(14, 12, 12, 6, 3, 0.45)}`),
  },
  lampara_nube: {
    n: "Lámpara de nube", cat: "recamara", capa: "pared", w: 96, h: 56, y: 170, brilla: { x: 48, y: 34, r: 140, c: "#fff1b8" },
    arte: () => svg(96, 56, `
      <path d="M18 50a14 14 0 0 1 2-28 20 20 0 0 1 38-6 16 16 0 0 1 22 14 10 10 0 0 1-2 20z" fill="#fffaf0" ${OL}/>
      <path d="M22 44h52" stroke="#ffe7a3" stroke-width="4" stroke-linecap="round"/>${brillo(30, 16, 18, 6, 3, 0.6)}
      <circle cx="38" cy="34" r="2" fill="#4b2e42"/><circle cx="56" cy="34" r="2" fill="#4b2e42"/><path d="M43 39q4 3 8 0" stroke="#4b2e42" stroke-width="1.6" fill="none"/>
      <ellipse cx="33" cy="38" rx="3" ry="2" fill="#ffb3cf"/><ellipse cx="61" cy="38" rx="3" ry="2" fill="#ffb3cf"/>`),
  },
  estrellas_luz: {
    n: "Estrellitas de luz", cat: "deco", capa: "pared", w: 150, h: 60, y: 120, brilla: { x: 75, y: 30, r: 120, c: "#fff1b8", siempre: true },
    arte: () => svg(150, 60, `
      <path d="M4 8q72 34 142 0" stroke="#8a7a86" stroke-width="1.6" fill="none"/>
      ${[[20, 16, "#ffd84d"], [44, 25, "#ffb3cf"], [70, 29, "#fff1b8"], [96, 26, "#c39bff"], [122, 18, "#86d6f2"]].map(([x, y, c], i) => `<g class="foco" style="animation-delay:${i * 0.25}s">${estrella(x, y + 8, 8, c, OL2)}</g>`).join("")}`),
  },
  arbolito: {
    n: "Arbolito con foquitos", cat: "deco", w: 76, h: 122, brilla: { x: 38, y: 50, r: 110, c: "#ffe9a8", siempre: true },
    arte: () => svg(76, 122, `
      <path d="M26 98h24l-3 22H29z" fill="#d98a6a" ${OL}/>
      <path d="M38 6L10 50h12L6 78h14L4 100h68L56 78h14L54 50h12z" fill="#57b884" ${OL}/>
      <path d="M38 6L22 32" stroke="#7fd29b" stroke-width="3"/>
      ${[[30, 40, "#ff86b0"], [46, 46, "#ffd84d"], [24, 66, "#86d6f2"], [50, 72, "#ff86b0"], [36, 86, "#c39bff"], [18, 92, "#ffd84d"], [58, 92, "#86d6f2"]].map(([x, y, c], i) => `<circle class="foco" style="animation-delay:${i * 0.18}s" cx="${x}" cy="${y}" r="3.6" fill="${c}"/>`).join("")}
      ${estrella(38, 8, 8, "#ffd84d", OL2)}`),
  },
  fuerte_cobijas: {
    n: "Fuerte de cobijas", cat: "recamara", w: 190, h: 140, colores: ["#ffd0e2", "#d9ccff", "#cdeeff", "#fff0b8"],
    lugares: [sentado(-30, -40), sentado(34, -40)],
    arte: (e, C) => svg(190, 140, `
      <path d="M8 138L95 10l87 128z" fill="${C}" ${OL}/>
      <path d="M95 10L60 138M95 10l35 128" stroke="${tono(C, 0.88)}" stroke-width="3"/>
      <path d="M95 52q-30 40-22 86h44q8-46-22-86z" fill="${tono(C, 0.7)}" ${OL2}/>
      ${[[40, 112], [150, 112], [96, 32]].map(([x, y]) => corazon(x, y, 0.9, "#fff")).join("")}
      <path d="M2 18q93 24 186 0" stroke="#8a7a86" stroke-width="1.4" fill="none"/>
      ${[24, 60, 96, 132, 168].map((x, i) => `<circle class="foco" style="animation-delay:${i * 0.2}s" cx="${x}" cy="${20 + Math.sin(i) * 4}" r="3" fill="#ffe9a8"/>`).join("")}`),
  },
  osito_gigante: {
    n: "Osito gigante", cat: "recamara", w: 110, h: 128, al: "chillido", colores: ["#d9a679", "#f4c6d7", "#e8e1d9"],
    arte: (e, C) => svg(110, 128, `
      <ellipse cx="55" cy="96" rx="40" ry="30" fill="${C}" ${OL}/><ellipse cx="55" cy="100" rx="22" ry="18" fill="${tono(C, 1.12)}"/>
      <circle cx="20" cy="112" r="13" fill="${C}" ${OL}/><circle cx="90" cy="112" r="13" fill="${C}" ${OL}/>
      <circle cx="24" cy="22" r="12" fill="${C}" ${OL}/><circle cx="86" cy="22" r="12" fill="${C}" ${OL}/>
      <circle cx="55" cy="44" r="32" fill="${C}" ${OL}/><ellipse cx="55" cy="54" rx="13" ry="10" fill="${tono(C, 1.15)}"/>
      <circle cx="43" cy="40" r="3.4" fill="#4b2e42"/><circle cx="67" cy="40" r="3.4" fill="#4b2e42"/><ellipse cx="55" cy="51" rx="4" ry="3" fill="#4b2e42"/>
      <ellipse cx="36" cy="52" rx="5" ry="3" fill="#ff9cbf" opacity=".7"/><ellipse cx="74" cy="52" rx="5" ry="3" fill="#ff9cbf" opacity=".7"/>
      ${corazon(55, 92, 1.4, "#ff5c93")}`),
  },
  juego_te: {
    n: "Juego de té", cat: "cositas", w: 70, h: 40, y: 548,
    arte: () => svg(70, 40, `
      <ellipse cx="35" cy="36" rx="33" ry="4" fill="#f0e6ee" ${OL2}/>
      <path d="M14 14h22v12a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z" fill="#fff" ${OL2}/><path d="M36 18h4a4 4 0 0 1 0 8h-4" stroke="#fff" stroke-width="3" fill="none"/>
      <path d="M10 18l-6-6" stroke="#fff" stroke-width="4" stroke-linecap="round"/><ellipse cx="25" cy="12" rx="8" ry="3" fill="#ffd0e2" ${OL2}/>
      <path d="M48 24h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" fill="#ffd0e2" ${OL2}/>${corazon(25, 24, 0.4, "#ff86b0")}`),
  },
  pizarra_amor: {
    n: "Pizarrita de amor", cat: "deco", capa: "pared", w: 92, h: 70, y: 210,
    arte: () => svg(92, 70, `
      <rect x="2" y="2" width="88" height="66" rx="5" fill="#c79a6d" ${OL}/><rect x="9" y="9" width="74" height="52" rx="3" fill="#3f5a4f"/>
      <text x="46" y="38" text-anchor="middle" font-family="Caveat, cursive" font-size="20" font-weight="700" fill="#fff">Te amo</text>
      ${corazon(46, 50, 0.55, "#ffb3cf")}<path d="M14 54h12" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`),
  },
  canasta_gatito: {
    n: "Gatito en su canasta", cat: "mascotas", w: 86, h: 62, al: "miau",
    arte: () => svg(86, 62, `
      <path d="M6 30h74l-6 30H12z" fill="#d9a679" ${OL}/>${[18, 30, 42, 54, 66].map((x) => `<path d="M${x} 32v26" stroke="#b8865c" stroke-width="2"/>`).join("")}
      <ellipse cx="43" cy="30" rx="34" ry="8" fill="#ffd0e2" ${OL2}/>
      <ellipse cx="43" cy="26" rx="22" ry="12" fill="#c9c3d6" ${OL}/><path d="M28 18l4-10 6 8M58 18l-4-10-6 8" fill="#c9c3d6" ${OL2}/>
      <path class="ojitos" d="M36 24q3 2 6 0M46 24q3 2 6 0" stroke="#4b2e42" stroke-width="1.6" fill="none"/>
      <text x="66" y="12" font-family="Nunito" font-size="10" font-weight="900" fill="#8f7a8c">z</text>`),
  },
  rosita: {
    n: "Rosita", cat: "cositas", w: 34, h: 56, y: 550, al: "sacude",
    arte: () => svg(34, 56, `
      <path d="M10 40h14l-2 14H12z" fill="#ff9cbf" ${OL2}/><path d="M17 40V20" stroke="#57b884" stroke-width="2.4"/>
      <path d="M17 30c-6-2-8-6-8-6 4-1 8 2 8 6zM17 26c5-2 8-5 8-5-4-1-8 1-8 5z" fill="#7fd29b"/>
      <circle cx="17" cy="14" r="9" fill="#ff4d7d" ${OL2}/><path d="M12 13q5-6 10 0M13 17q4 3 8 0" stroke="#c2336b" stroke-width="1.6" fill="none"/>`),
  },
};
