/**
 * Las cositas (Fase 55): cosas chiquitas para llenar los huecos, encima de mesas, repisas, burós y
 * barras (se pueden poner en el aire sobre un mueble y se quedan ahí). Y unas cosas grandes para jugar.
 */
import { svg, OL, OL2, tono, brillo, corazon, estrella, hoja } from "./arte.js";

export const ITEMS = {
  florero: {
    n: "Florero", cat: "cositas", w: 40, h: 58, y: 548, al: "sacude",
    arte: () => svg(40, 58, `
      <path d="M12 30h16l-2 26H14z" fill="#bfe8ff" ${OL}/>${brillo(15, 34, 3, 16, 1.5, 0.6)}
      <path d="M20 30V14M20 22l-8-8M20 22l9-9" stroke="#57b884" stroke-width="2"/>
      ${[[20, 10, "#ff86b0"], [11, 13, "#ffd84d"], [29, 12, "#c39bff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${c}" ${OL2}/><circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join("")}`),
  },
  velas: {
    n: "Velitas", cat: "cositas", w: 48, h: 46, y: 548, brilla: { x: 24, y: 12, r: 60, c: "#ffcf7a", siempre: true },
    arte: () => svg(48, 46, `
      <ellipse cx="24" cy="42" rx="22" ry="4" fill="#e8dce6" ${OL2}/>
      ${[[12, 22], [24, 16], [36, 24]].map(([x, y]) => `<rect x="${x - 5}" y="${y}" width="10" height="${42 - y}" rx="2" fill="#fff6ea" ${OL2}/><path class="vela" d="M${x} ${y - 9}c3 4 3 7 0 8-3-1-3-4 0-8z" fill="#ffb02e"/>`).join("")}`),
  },
  taza: {
    n: "Taza", cat: "cositas", w: 34, h: 32, y: 550, colores: ["#ff9cbf", "#8fd0ff", "#ffd36e", "#94dfbd"],
    arte: (e, C) => svg(34, 32, `
      <path d="M4 8h20v14a7 7 0 0 1-7 7h-6a7 7 0 0 1-7-7z" fill="${C}" ${OL}/><path d="M24 12h3a4 4 0 0 1 0 8h-3" stroke="${C}" stroke-width="3" fill="none"/>
      <ellipse cx="14" cy="9" rx="9" ry="2.4" fill="#8a5a3b"/>${corazon(14, 19, 0.45, "#fff")}
      <path d="M10 5c-2-3 2-4 0-7M16 5c-2-3 2-4 0-7" stroke="#d9cfd6" stroke-width="1.6" fill="none"/>`),
  },
  libros_pila: {
    n: "Pila de libros", cat: "cositas", w: 52, h: 40, y: 550,
    arte: () => svg(52, 40, `
      <rect x="4" y="28" width="44" height="10" rx="2" fill="#c9a7ff" ${OL2}/><rect x="8" y="18" width="38" height="10" rx="2" fill="#ff9cbf" ${OL2}/><rect x="2" y="8" width="42" height="10" rx="2" fill="#8fd0ff" ${OL2}/>
      <path d="M8 31h30M12 21h26M6 11h30" stroke="#fff" stroke-width="1.5" opacity=".7"/>${corazon(40, 6, 0.4, "#ff5c93")}`),
  },
  portarretrato: {
    n: "Portarretrato", cat: "cositas", w: 40, h: 44, y: 550, colores: ["#ffd36e", "#ff9cbf", "#ffffff", "#c9a7ff"],
    arte: (e, C) => svg(40, 44, `
      <path d="M26 42l6-6" stroke="${tono(C, 0.8)}" stroke-width="3"/><rect x="4" y="4" width="32" height="36" rx="3" fill="${C}" ${OL}/>
      <rect x="9" y="9" width="22" height="26" rx="2" fill="#bfe6ff"/><circle cx="16" cy="20" r="4" fill="#ffe0c8"/><circle cx="25" cy="20" r="4" fill="#e8b896"/><path d="M11 33q5-8 9 0M20 33q5-8 9 0" fill="#ff9cbf"/>${corazon(20, 13, 0.35, "#ff5c93")}`),
  },
  lamparita: {
    n: "Lamparita", cat: "cositas", w: 36, h: 52, y: 550, al: "lava", brilla: { x: 18, y: 16, r: 70, propio: "on" },
    arte: () => svg(36, 52, `
      <path class="luz" d="M6 22L-6 52h48L30 22z" fill="#fff3b0" opacity=".35"/>
      <rect x="16" y="22" width="4" height="24" fill="#b39a8a"/><ellipse cx="18" cy="48" rx="11" ry="3.5" fill="#9c8577" ${OL2}/>
      <path d="M6 24L11 4h14l5 20z" fill="#ffd0e2" ${OL}/>${corazon(18, 14, 0.4, "#ff86b0")}`),
  },
  radio: {
    n: "Radio", cat: "cositas", w: 56, h: 40, y: 550, al: "musica", musica: "musica-baile", colores: ["#ff9cbf", "#8fd0ff", "#94dfbd", "#ffd36e"],
    arte: (e, C) => svg(56, 40, `
      <path d="M12 10L38 2" stroke="#6b5a66" stroke-width="2" stroke-linecap="round"/>
      <rect x="2" y="10" width="52" height="28" rx="7" fill="${C}" ${OL}/><circle cx="16" cy="24" r="8" fill="#4a3346"/><circle cx="16" cy="24" r="3" fill="#6b5a66"/>
      <rect x="30" y="16" width="18" height="7" rx="2" fill="#fff6d8" ${OL2}/><circle cx="34" cy="30" r="2.5" fill="#fff"/><circle cx="43" cy="30" r="2.5" fill="#fff"/>
      <g class="notas"><path d="M44 2v-8l6-2v8" stroke="#ff86b0" stroke-width="1.6" fill="none"/></g>`),
  },
  frasco: {
    n: "Frasco de galletas", cat: "cositas", w: 38, h: 48, y: 550, al: "galletas",
    arte: () => svg(38, 48, `
      <rect x="8" y="2" width="22" height="8" rx="3" fill="#ff86b0" ${OL2}/>
      <path d="M6 10h26v32a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#e6f4ff" fill-opacity=".8" ${OL}/>
      ${[[13, 22], [24, 26], [15, 36], [26, 38], [19, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#e7b46c"/><circle cx="${x - 1.5}" cy="${y - 1}" r="1" fill="#6b4632"/>`).join("")}
      ${brillo(9, 14, 3, 22, 1.5, 0.6)}`),
  },
  tetera: {
    n: "Tetera", cat: "cositas", w: 50, h: 40, y: 550, colores: ["#ffffff", "#ffd0e2", "#cdeeff"],
    arte: (e, C) => svg(50, 40, `
      <path d="M8 20q-8-2-6-10" stroke="${tono(C, 0.85)}" stroke-width="3" fill="none"/><path d="M38 18q10-4 10 6" stroke="${tono(C, 0.85)}" stroke-width="3" fill="none"/>
      <ellipse cx="24" cy="26" rx="16" ry="13" fill="${C}" ${OL}/><rect x="16" y="10" width="16" height="5" rx="2.5" fill="${tono(C, 0.9)}" ${OL2}/><circle cx="24" cy="8" r="3" fill="#ff86b0"/>
      ${corazon(24, 25, 0.6, "#ff9cbf")}`),
  },
  despertador: {
    n: "Despertador", cat: "cositas", w: 40, h: 42, y: 550, al: "reloj", colores: ["#ff9cbf", "#8fd0ff", "#ffd36e"],
    arte: (e, C) => svg(40, 42, `
      <circle cx="9" cy="8" r="6" fill="${tono(C, 0.85)}" ${OL2}/><circle cx="31" cy="8" r="6" fill="${tono(C, 0.85)}" ${OL2}/>
      <path d="M10 36l-4 5M30 36l4 5" stroke="#6b5a66" stroke-width="3" stroke-linecap="round"/>
      <circle cx="20" cy="22" r="15" fill="${C}" ${OL}/><circle cx="20" cy="22" r="11" fill="#fff"/><path d="M20 22v-7M20 22l5 3" stroke="#4a3346" stroke-width="2" stroke-linecap="round"/>`),
  },
  pecerita: {
    n: "Pecerita", cat: "cositas", w: 46, h: 44, y: 550, al: "pecera",
    arte: () => svg(46, 44, `
      <path d="M8 10h30a20 18 0 1 1-30 0z" fill="#cdeeff" fill-opacity=".85" ${OL}/><path d="M6 18h34a17 15 0 0 1-34 0z" fill="#8fd0ff" opacity=".7"/>
      <g class="pez1"><path d="M18 26q6-6 12 0-6 6-12 0zM18 26l-5-4v8z" fill="#ff8a3d"/><circle cx="26" cy="25" r="1" fill="#3a2a35"/></g>
      <rect x="6" y="6" width="34" height="5" rx="2.5" fill="#fff" ${OL2}/><circle class="burbu" cx="32" cy="18" r="2" fill="#fff" opacity=".8"/>`),
  },
  planta_chica: {
    n: "Plantita", cat: "cositas", w: 40, h: 46, y: 550, al: "sacude",
    arte: () => svg(40, 46, `<g class="hojas">${hoja(20, 26, -150, 16, "#7fd29b")}${hoja(20, 26, -30, 16, "#57b884")}${hoja(20, 26, -95, 18, "#94dfbd")}${hoja(20, 26, -60, 13, "#7fd29b")}</g>
      <path d="M8 26h24l-3 18H11z" fill="#ffb48a" ${OL}/><path d="M11 32h18" stroke="#fff" stroke-width="2" opacity=".6"/>`),
  },
  pastel_cumple: {
    n: "Pastel de cumple", cat: "cositas", w: 54, h: 52, y: 550, brilla: { x: 27, y: 8, r: 50, c: "#ffcf7a", siempre: true },
    arte: () => svg(54, 52, `
      <ellipse cx="27" cy="48" rx="25" ry="4" fill="#fff" ${OL2}/><rect x="6" y="20" width="42" height="26" rx="5" fill="#ffd0e2" ${OL}/>
      <path d="M6 26q5 5 10 0t10 0 11 0 11 0" fill="#fff"/><rect x="6" y="34" width="42" height="3" fill="#ff86b0"/>
      ${[17, 27, 37].map((x) => `<rect x="${x - 2}" y="10" width="4" height="11" rx="1" fill="${x === 27 ? "#8fd0ff" : "#ffd84d"}"/><path class="vela" d="M${x} 3c3 3 2 6 0 6-2 0-3-3 0-6z" fill="#ffb02e"/>`).join("")}`),
  },
  // Cosas grandes para jugar.
  trampolin: {
    n: "Trampolín", cat: "terraza", w: 170, h: 60, y: 545, al: "trampolin", colores: ["#8fd0ff", "#ff9cbf", "#94dfbd", "#ffd36e"],
    arte: (e, C) => svg(170, 60, `
      ${[22, 66, 104, 148].map((x) => `<path d="M${x} 30l${x < 85 ? -6 : 6} 28" stroke="#6b5a66" stroke-width="5" stroke-linecap="round"/>`).join("")}
      <ellipse cx="85" cy="26" rx="82" ry="16" fill="${C}" ${OL}/><ellipse class="lona" cx="85" cy="25" rx="66" ry="10" fill="#4a3346"/>
      <path d="M26 20q59-12 118 0" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none"/>${estrella(85, 25, 5, "#ffd84d")}`),
  },
  arcade: {
    n: "Maquinita de arcade", cat: "estudio", w: 92, h: 196, al: "consola", colores: ["#c9a7ff", "#ff9cbf", "#8fd0ff", "#94dfbd"], brilla: { x: 46, y: 60, r: 90, c: "#a9d8ff", propio: "on" },
    arte: (e, C) => svg(92, 196, `
      <path d="M8 6h76v184H8z" fill="${C}" ${OL}/><path d="M8 6h76v20H8z" fill="${tono(C, 0.8)}"/>${estrella(46, 16, 7, "#ffd84d")}
      <rect class="pantalla" x="16" y="34" width="60" height="50" rx="4" fill="#3d3440"/>
      <g class="juego"><rect x="16" y="72" width="60" height="12" fill="#7fd29b"/><g class="brinca-j">${corazon(34, 66, 0.6, "#ff5c93")}</g><g class="monedas"><circle cx="54" cy="52" r="3" fill="#ffd84d"/><circle cx="64" cy="52" r="3" fill="#ffd84d"/></g></g>
      <path d="M4 92h84l-6 22H10z" fill="${tono(C, 1.1)}" ${OL}/><circle cx="30" cy="102" r="5" fill="#ff5c7a"/><path d="M30 102v-8" stroke="#4a3346" stroke-width="3"/>
      <circle cx="56" cy="104" r="4" fill="#ffd84d"/><circle cx="68" cy="100" r="4" fill="#8fd0ff"/>
      <rect x="34" y="140" width="24" height="12" rx="3" fill="#4a3346"/><rect x="40" y="144" width="12" height="3" rx="1.5" fill="#ffd84d"/>
      ${brillo(12, 30, 4, 140, 2, 0.3)}`),
  },
  // Lo que se queda tirado en el piso (lo que soltaste): se dibuja con lo que es y se recoge al tocarlo.
  cosita: { n: "Cosita", cat: "oculto", w: 40, h: 40, y: 552, al: "recoger", arte: () => "" },
};
