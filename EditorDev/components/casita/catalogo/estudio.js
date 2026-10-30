/** El estudio: piano, guitarra, videojuegos, bocina de fiesta, caballete, telescopio y su rincón de leer. */
import { svg, OL, OL2, tono, brillo, corazon, estrella, hoja, sentado, MADERA, MADERA_O, MADERA_C } from "./arte.js";

const LIBROS = ["#ff9cbf", "#8fd0ff", "#ffd36e", "#c9a7ff", "#94dfbd", "#ff9e7a", "#fff"];
const repisaLibros = (x0, y, n, semilla) => {
  let x = x0, s = "";
  for (let i = 0; i < n; i++) {
    const w = 7 + ((i * 7 + semilla) % 4) * 1.6, h = 30 + ((i * 5 + semilla) % 4) * 3.4, c = LIBROS[(i + semilla) % LIBROS.length];
    s += `<rect x="${x.toFixed(1)}" y="${(y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.6" fill="${c}" ${OL2}/><rect x="${x.toFixed(1)}" y="${(y - h + 5).toFixed(1)}" width="${w.toFixed(1)}" height="2" fill="#fff" opacity=".55"/>`;
    x += w + 1.2;
  }
  return s;
};

export const ITEMS = {
  piano: {
    n: "Piano", cat: "estudio", w: 156, h: 150, al: "piano", junto: { dx: 0, dy: 26 }, colores: ["#ffd0e2", "#c9a7ff", "#ffffff", "#8fd0ff", "#4a3346"],
    arte: (e, C) => {
      let teclas = "";
      for (let i = 0; i < 15; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) teclas += `<rect x="${(10 + (i + 1) * 9.06 - 2.7).toFixed(1)}" y="67" width="5.4" height="9.6" rx="1.2" fill="#3a2a35"/>`;
      return svg(156, 150, `
        <rect x="14" y="108" width="10" height="40" rx="3" fill="${tono(C, 0.8)}" ${OL2}/><rect x="132" y="108" width="10" height="40" rx="3" fill="${tono(C, 0.8)}" ${OL2}/>
        <rect x="6" y="18" width="144" height="96" rx="10" fill="${C}" ${OL}/>
        <rect x="14" y="26" width="128" height="34" rx="7" fill="${tono(C, 1.1)}" ${OL2}/>${corazon(78, 40, 0.9, tono(C, 0.82))}
        <rect x="48" y="2" width="60" height="28" rx="4" fill="#fffaf2" ${OL2}/><path d="M53 10h50M53 15h50M53 20h50" stroke="#e2d6de" stroke-width="1"/>
        <circle cx="61" cy="18" r="2.2" fill="#4a3346"/><path d="M63.2 18V9" stroke="#4a3346" stroke-width="1.2"/><circle cx="74" cy="13" r="2.2" fill="#4a3346"/><path d="M76.2 13V5" stroke="#4a3346" stroke-width="1.2"/>
        <circle cx="88" cy="20" r="2.2" fill="#4a3346"/><circle cx="96" cy="16" r="2.2" fill="#4a3346"/><path d="M90.2 20v-9h8v5" stroke="#4a3346" stroke-width="1.2" fill="none"/>
        <rect x="4" y="60" width="148" height="7" rx="3" fill="${tono(C, 0.86)}"/>
        <rect x="10" y="66" width="136" height="16" rx="2" fill="#fff" ${OL2}/>
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${(10 + (i + 1) * 9.06).toFixed(1)} 67v14" stroke="#d9cfd6" stroke-width=".9"/>`).join("")}${teclas}
        <rect x="6" y="82" width="144" height="7" rx="3" fill="${tono(C, 0.9)}"/>
        <rect x="70" y="136" width="6" height="9" rx="2" fill="#ffd36e" ${OL2}/><rect x="80" y="136" width="6" height="9" rx="2" fill="#ffd36e" ${OL2}/>
        ${brillo(14, 92, 128, 5, 2.5, 0.28)}<g class="notas">${["M120 8", "M134 20"].map((m) => `<path d="${m}v-10l7-2v10" stroke="#ff86b0" stroke-width="2" fill="none"/>`).join("")}<circle cx="118" cy="9" r="3" fill="#ff86b0"/><circle cx="132" cy="21" r="3" fill="#c39bff"/></g>`);
    },
  },
  guitarra: {
    n: "Guitarra", cat: "estudio", w: 64, h: 132, y: 540, al: "guitarra", colores: ["#ff9cbf", "#ffd36e", "#8fd0ff", "#c9a7ff", "#e7a95c"],
    arte: (e, C) => svg(64, 132, `
      <path d="M18 130l14-26 14 26" stroke="#6b5a66" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="29" y="10" width="6" height="56" rx="2" fill="#8a5a3b" ${OL2}/><rect x="27" y="0" width="10" height="13" rx="3" fill="#6b4632" ${OL2}/>
      <circle cx="26" cy="4" r="1.8" fill="#ffd36e"/><circle cx="38" cy="4" r="1.8" fill="#ffd36e"/><circle cx="26" cy="9" r="1.8" fill="#ffd36e"/><circle cx="38" cy="9" r="1.8" fill="#ffd36e"/>
      <path d="M32 56c-12 0-18 10-14 20-7 6-9 21 2 29 8 6 16 6 24 0 11-8 9-23 2-29 4-10-2-20-14-20z" fill="${C}" ${OL}/>
      <path d="M22 66c-3 4-3 8-1 11" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="32" cy="82" r="6.5" fill="#4b2e42" opacity=".8"/><circle cx="32" cy="82" r="8.5" fill="none" stroke="${tono(C, 0.8)}" stroke-width="1.5"/>
      <rect x="24" y="96" width="16" height="4" rx="2" fill="#6b4632"/>
      <path d="M30.5 12v86M32 12v86M33.5 12v86" stroke="#fff" stroke-width=".55" opacity=".85"/>${corazon(43, 100, 0.45, "#fff", 'opacity=".8"')}`),
  },
  consola: {
    n: "Videojuegos", cat: "estudio", w: 150, h: 130, al: "consola", colores: ["#ff9cbf", "#8fd0ff", "#94dfbd", "#ffd36e", "#c9a7ff"],
    brilla: { x: 70, y: 44, r: 120, c: "#a9d8ff", propio: "on" },
    arte: (e, C) => svg(150, 130, `
      <rect x="6" y="80" width="138" height="48" rx="8" fill="${MADERA_C}" ${OL}/><rect x="14" y="90" width="58" height="30" rx="5" fill="${tono(MADERA_C, 1.08)}" ${OL2}/><rect x="78" y="90" width="58" height="30" rx="5" fill="${tono(MADERA_C, 1.08)}" ${OL2}/>
      <path d="M60 10L46 0M90 10l14-10" stroke="#6b5a66" stroke-width="2.5" stroke-linecap="round"/><circle cx="46" cy="1" r="2.5" fill="#ff86b0"/><circle cx="104" cy="1" r="2.5" fill="#ff86b0"/>
      <rect x="22" y="8" width="106" height="74" rx="14" fill="${C}" ${OL}/>
      <rect class="pantalla" x="30" y="15" width="78" height="58" rx="10" fill="#3d3440"/>
      <g class="juego"><rect x="30" y="58" width="78" height="15" fill="#7fd29b"/><rect x="30" y="58" width="78" height="3" fill="#57b884"/>
        <g class="brinca-j">${corazon(52, 50, 0.7, "#ff5c93")}</g><g class="monedas"><circle cx="76" cy="40" r="3" fill="#ffd84d"/><circle cx="88" cy="40" r="3" fill="#ffd84d"/><circle cx="100" cy="40" r="3" fill="#ffd84d"/></g>
        <rect x="88" y="50" width="10" height="8" rx="1.5" fill="#ff9e7a"/><circle cx="40" cy="26" r="4" fill="#fff6a0"/></g>
      <rect x="32" y="17" width="30" height="6" rx="3" fill="#fff" opacity=".14"/>
      <circle cx="118" cy="30" r="4.5" fill="${tono(C, 0.78)}"/><circle cx="118" cy="46" r="4.5" fill="${tono(C, 0.78)}"/><rect x="113" y="58" width="10" height="3" rx="1.5" fill="${tono(C, 0.78)}"/>
      <rect x="44" y="84" width="40" height="12" rx="4" fill="#fff" ${OL2}/><circle cx="74" cy="90" r="2.2" fill="#ff5c7a"/><circle cx="79" cy="90" r="2.2" fill="#8fd0ff"/><rect x="48" y="88" width="14" height="3" rx="1.5" fill="#d9cfd6"/>
      <path d="M92 102h18a6 6 0 0 1 0 12H92a6 6 0 0 1 0-12z" fill="#ff86b0" ${OL2}/><circle cx="96" cy="108" r="2" fill="#fff"/><circle cx="107" cy="106" r="1.6" fill="#fff"/><circle cx="110" cy="110" r="1.6" fill="#fff"/>
      <path d="M116 108q10 0 8 16" stroke="#6b5a66" stroke-width="1.6" fill="none"/>`),
  },
  bocina: {
    n: "Bocina de fiesta", cat: "estudio", w: 66, h: 130, al: "musica", musica: "musica-fiesta", fiesta: true,
    arte: () => svg(66, 130, `
      <rect x="6" y="4" width="54" height="122" rx="11" fill="#4a3346" ${OL}/><rect x="10" y="8" width="46" height="114" rx="8" fill="#5a4356"/>
      <rect class="led" x="19" y="14" width="28" height="5" rx="2.5" fill="#ff86b0"/>
      <circle cx="33" cy="42" r="11" fill="#2f2533"/><circle cx="33" cy="42" r="6" fill="#6b5a66"/><circle cx="31" cy="40" r="1.8" fill="#fff" opacity=".4"/>
      <g class="cono"><circle cx="33" cy="88" r="20" fill="#2f2533"/><circle cx="33" cy="88" r="13" fill="#6b5a66"/><circle cx="33" cy="88" r="5" fill="#2f2533"/><circle cx="29" cy="83" r="3" fill="#fff" opacity=".25"/></g>
      <rect x="12" y="112" width="42" height="4" rx="2" fill="#ff86b0" opacity=".7"/>
      <g class="notas"><path d="M50 0v-12l8-2v12" stroke="#ff86b0" stroke-width="2" fill="none"/><circle cx="48" cy="1" r="3" fill="#ff86b0"/><circle cx="56" cy="-1" r="3" fill="#c39bff"/></g>`),
  },
  caballete: {
    n: "Caballete", cat: "estudio", w: 98, h: 162, al: "pintar",
    arte: () => svg(98, 162, `
      <path d="M49 6L16 158M49 6l33 152M49 20v138" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>
      <rect x="14" y="22" width="70" height="84" rx="4" fill="#fffaf2" ${OL}/>
      <g class="p0"><path d="M28 80q12-20 22-6t20-14M30 44a8 8 0 1 1 16 0" stroke="#c9b9c4" stroke-width="2" fill="none" stroke-dasharray="3 3"/></g>
      <g class="p1"><rect x="18" y="26" width="62" height="42" fill="#bfe6ff"/><path d="M18 68q18-14 34-2t28-6v42H18z" fill="#bde8c4"/><path d="M28 80q12-20 22-6t20-14" stroke="#c9b9c4" stroke-width="2" fill="none" stroke-dasharray="3 3"/></g>
      <g class="p2"><rect x="18" y="26" width="62" height="42" fill="#ffd2a8"/><circle cx="62" cy="44" r="9" fill="#ff9cbf"/><path d="M18 68q18-14 34-2t28-6v42H18z" fill="#94dfbd"/><path d="M18 84q22-10 62-2v20H18z" fill="#7fd29b"/>${corazon(40, 46, 0.8, "#fff")}${[28, 46, 66].map((x) => `<circle cx="${x}" cy="92" r="3" fill="#ff86b0"/>`).join("")}</g>
      <g class="p3"><rect x="18" y="26" width="62" height="76" fill="#ffe3ec"/>${[[36, "#ffe0c8", "#5a3b2e"], [62, "#e8b896", "#3a2a35"]].map(([x, p, c]) => `<circle cx="${x}" cy="56" r="11" fill="${p}" ${OL2}/><path d="M${x - 11} 54q1-12 11-12t11 12q-5-6-11-5-6-1-11 5z" fill="${c}"/><path d="M${x - 9} 100q0-26 9-30 9 4 9 30z" fill="${x < 50 ? "#ff9cbf" : "#8fd0ff"}"/><circle cx="${x - 4}" cy="57" r="1.4" fill="#3a2a35"/><circle cx="${x + 4}" cy="57" r="1.4" fill="#3a2a35"/>`).join("")}${corazon(49, 38, 0.9, "#ff5c93")}</g>
      <rect x="10" y="104" width="78" height="8" rx="3" fill="${MADERA}" ${OL2}/>
      <ellipse cx="70" cy="101" rx="13" ry="5" fill="#fff" ${OL2}/>${[["#ff5c7a", 64], ["#8fd0ff", 70], ["#ffd36e", 76]].map(([c, x]) => `<circle cx="${x}" cy="100" r="2" fill="${c}"/>`).join("")}
      <path d="M22 98l14-10" stroke="${MADERA_O}" stroke-width="3" stroke-linecap="round"/><path d="M36 88l3-2" stroke="#ff86b0" stroke-width="4" stroke-linecap="round"/>`),
  },
  telescopio: {
    n: "Telescopio", cat: "estudio", w: 92, h: 142, al: "telescopio", colores: ["#c9a7ff", "#8fd0ff", "#ff9cbf", "#ffd36e"],
    arte: (e, C) => svg(92, 142, `
      <path d="M46 82L18 140M46 82l28 58M46 82v58" stroke="#6b5a66" stroke-width="5" stroke-linecap="round"/>
      <g transform="rotate(-28 46 72)"><rect x="6" y="60" width="80" height="22" rx="10" fill="${C}" ${OL}/><rect x="74" y="55" width="15" height="32" rx="5" fill="${tono(C, 0.84)}" ${OL2}/><rect x="0" y="65" width="10" height="12" rx="3" fill="#6b5a66"/>${brillo(16, 63, 52, 4, 2, 0.45)}<rect x="40" y="58" width="6" height="26" rx="2" fill="${tono(C, 0.84)}"/></g>
      <circle cx="46" cy="78" r="6" fill="#6b5a66"/>${estrella(16, 18, 6, "#ffd84d")}${estrella(78, 8, 4, "#ffd84d", 'opacity=".8"')}`),
  },
  globo_mundo: {
    n: "Globo terráqueo", cat: "estudio", w: 62, h: 94, y: 548, al: "gira",
    arte: () => svg(62, 94, `
      <ellipse cx="31" cy="89" rx="18" ry="4.5" fill="${MADERA_O}" ${OL2}/><rect x="28" y="62" width="6" height="27" rx="2" fill="${MADERA_O}"/>
      <path d="M9 42a24 24 0 0 0 40 20" stroke="#d9a05b" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <circle cx="31" cy="37" r="24" fill="#8fd0ff" ${OL}/>
      <path d="M14 28c6-6 14-4 16 2-2 6-10 6-12 12-4-2-6-8-4-14zM34 18c6 0 12 4 14 10-6 2-8 8-14 6-2-6-4-10 0-16zM30 46c6-2 14 0 16 6-4 6-12 8-16 2z" fill="#7fd29b"/>
      <path d="M12 30a20 20 0 0 1 12-14" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round" fill="none"/>${corazon(40, 46, 0.42, "#ff5c93")}`),
  },
  librero_alto: {
    n: "Librero alto", cat: "estudio", w: 116, h: 216, al: "libro", junto: { dx: 0, dy: 26 },
    arte: () => svg(116, 216, `
      <rect x="4" y="12" width="108" height="200" rx="8" fill="${MADERA}" ${OL}/><rect x="11" y="19" width="94" height="186" rx="4" fill="${MADERA_O}" opacity=".32"/>
      ${[62, 108, 154, 200].map((y) => `<rect x="9" y="${y}" width="98" height="6" rx="2" fill="${MADERA_C}" ${OL2}/>`).join("")}
      ${repisaLibros(14, 62, 8, 1)}${repisaLibros(14, 108, 5, 3)}<rect x="74" y="80" width="26" height="28" rx="3" fill="#fff" ${OL2}/><rect x="78" y="84" width="18" height="16" rx="2" fill="#ffd0e2"/>${corazon(87, 91, 0.5, "#ff5c93")}
      <circle cx="28" cy="142" r="11" fill="#bfe6ff" ${OL2}/><path d="M22 140c3-4 9-4 12 1" stroke="#7fd29b" stroke-width="3" fill="none"/>${repisaLibros(46, 154, 6, 5)}${repisaLibros(14, 200, 9, 2)}
      <rect x="42" y="0" width="30" height="14" rx="4" fill="#ffb48a" ${OL2}/>${hoja(57, 2, -150, 22, "#7fd29b")}${hoja(57, 2, -30, 22, "#94dfbd")}${hoja(57, 2, -90, 18, "#7fd29b")}`),
  },
  puff: {
    n: "Puff", cat: "estudio", w: 86, h: 60, y: 546, colores: ["#ff9cbf", "#c9a7ff", "#ffd36e", "#94dfbd", "#8fd0ff"],
    lugares: [sentado(0, -28)],
    arte: (e, C) => svg(86, 60, `
      <path d="M8 56c-8-18 4-44 35-46 31 2 43 28 35 46-10 4-60 4-70 0z" fill="${C}" ${OL}/>
      <path d="M43 10c-2 14-2 30 0 46M20 22c6 10 8 22 6 34M66 22c-6 10-8 22-6 34" stroke="${tono(C, 0.86)}" stroke-width="1.6" fill="none"/>
      <path d="M22 24q20-12 42 0" stroke="#fff" stroke-opacity=".42" stroke-width="5" fill="none" stroke-linecap="round"/>${corazon(43, 38, 0.8, "#fff", 'opacity=".55"')}`),
  },
  sillon_lectura: {
    n: "Sillón de leer", cat: "estudio", w: 106, h: 126, colores: ["#ff9cbf", "#c9a7ff", "#94dfbd", "#ffd36e", "#8fd0ff"],
    lugares: [sentado(0, -58)],
    arte: (e, C) => svg(106, 126, `
      <path d="M18 102l-3 22M88 102l3 22" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>
      <rect x="15" y="4" width="76" height="84" rx="28" fill="${C}" ${OL}/>${[[38, 32], [68, 32], [53, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${tono(C, 0.78)}"/>`).join("")}
      <path d="M26 16q27-10 54 0" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="10" y="64" width="86" height="30" rx="11" fill="${tono(C, 1.08)}" ${OL}/>
      <rect x="0" y="48" width="24" height="56" rx="12" fill="${tono(C, 0.9)}" ${OL}/><rect x="82" y="48" width="24" height="56" rx="12" fill="${tono(C, 0.9)}" ${OL}/>
      <path d="M58 64l30 3-4 33-26-6z" fill="#fffaf2" ${OL2}/><path d="M60 72l26 2M59 80l26 2M58 88l24 2" stroke="#ffb3cf" stroke-width="2.5"/>`),
  },
  lampara_arco: {
    n: "Lámpara de arco", cat: "estudio", w: 132, h: 224, al: "luz", luz: true, brilla: { x: 107, y: 78, r: 150 },
    arte: () => svg(132, 224, `
      <path class="luz" d="M88 74L58 224h104L126 74z" fill="#fff3b0" opacity=".32"/>
      <ellipse cx="22" cy="216" rx="19" ry="6" fill="#6b5a66" ${OL2}/>
      <path d="M22 214V72Q22 14 80 14q26 0 27 34" stroke="#b39a8a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M85 72a22 22 0 0 1 44 0z" fill="#ffe08a" ${OL}/><path d="M93 62a14 14 0 0 1 10-10" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/>
      <ellipse cx="107" cy="74" rx="7" ry="4" fill="#fff6c4"/>`),
  },
  tapete_redondo: {
    n: "Tapete redondo", cat: "estudio", capa: "alfombra", w: 232, h: 46, colores: ["#ffd0e2", "#e3d6ff", "#cdeeff", "#fff0b8", "#d4f3e3"],
    arte: (e, C) => svg(232, 46, `
      <ellipse cx="116" cy="23" rx="113" ry="20" fill="${C}" ${OL}/>
      <ellipse cx="116" cy="23" rx="93" ry="15" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-dasharray="7 6"/>
      <ellipse cx="116" cy="23" rx="58" ry="9" fill="${tono(C, 1.1)}"/>${corazon(116, 21, 0.9, tono(C, 0.85))}`),
  },
  poster: {
    n: "Póster", cat: "estudio", capa: "pared", w: 94, h: 126, y: 250, colores: ["#c9a7ff", "#ff9cbf", "#8fd0ff", "#ffd36e"],
    arte: (e, C) => svg(94, 126, `
      <rect x="4" y="4" width="86" height="118" rx="4" fill="${C}" ${OL}/><rect x="10" y="10" width="74" height="106" rx="2" fill="${tono(C, 1.15)}"/>
      <circle cx="47" cy="52" r="26" fill="#3a2a35"/><circle cx="47" cy="52" r="18" fill="none" stroke="#5e5260" stroke-width="2"/><circle cx="47" cy="52" r="8" fill="#ff86b0"/><circle cx="47" cy="52" r="2" fill="#fff"/>
      <path d="M62 30v-14l10-3v14" stroke="#3a2a35" stroke-width="2.4" fill="none"/><circle cx="60" cy="31" r="3.5" fill="#3a2a35"/><circle cx="70" cy="28" r="3.5" fill="#3a2a35"/>
      <rect x="18" y="88" width="58" height="7" rx="3.5" fill="#fff"/><rect x="26" y="100" width="42" height="5" rx="2.5" fill="#fff" opacity=".7"/>${estrella(20, 20, 5, "#fff")}<circle cx="47" cy="2" r="3" fill="#ff5c93"/>`),
  },
  neon: {
    n: "Letrero de neón", cat: "estudio", capa: "pared", w: 138, h: 76, y: 210, al: "neon", brilla: { x: 69, y: 38, r: 120, c: "#ff6fae", propio: "!apagado" },
    arte: () => svg(138, 76, `
      <rect x="4" y="4" width="130" height="68" rx="16" fill="#fff" fill-opacity=".35" ${OL2}/>
      <g class="tubo"><path d="M30 44c-6-8-14-4-12 3 2 6 12 12 12 12s10-6 12-12c2-7-6-11-12-3z" stroke="#ff5c93" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M54 54V26M54 54h12M74 40a7 7 0 1 0 14 0 7 7 0 1 0-14 0M94 33l7 21 7-21M114 40h12c0-8-12-8-12 0s5 9 12 6" stroke="#ff86b0" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
      <circle cx="12" cy="12" r="2.5" fill="#d9cfd6"/><circle cx="126" cy="12" r="2.5" fill="#d9cfd6"/>`),
  },
  corcho: {
    n: "Tablero de corcho", cat: "estudio", capa: "pared", w: 126, h: 94, y: 240,
    arte: () => svg(126, 94, `
      <rect x="3" y="3" width="120" height="88" rx="6" fill="${MADERA}" ${OL}/><rect x="9" y="9" width="108" height="76" rx="3" fill="#d9a46b"/>
      ${[[14, 14], [40, 30], [70, 20], [96, 40], [22, 56], [60, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#b07a4a"/>`).join("")}
      <rect x="16" y="16" width="30" height="34" rx="2" fill="#fff" transform="rotate(-6 31 33)" ${OL2}/><rect x="19" y="19" width="24" height="22" fill="#ffd0e2" transform="rotate(-6 31 30)"/>${corazon(31, 31, 0.55, "#ff5c93")}
      <rect x="54" y="14" width="30" height="34" rx="2" fill="#fff" transform="rotate(5 69 31)" ${OL2}/><rect x="57" y="17" width="24" height="22" fill="#bfe6ff" transform="rotate(5 69 28)"/><circle cx="69" cy="28" r="5" fill="#ffd84d"/>
      <rect x="88" y="18" width="24" height="24" fill="#fff6a0" transform="rotate(-4 100 30)"/><path d="M92 26h14M92 31h12M92 36h9" stroke="#c9a060" stroke-width="1.4"/>
      <rect x="22" y="56" width="40" height="22" rx="2" fill="#ffe3ec" transform="rotate(3 42 67)"/><path d="M27 63h28M27 68h22" stroke="#ff86b0" stroke-width="1.6"/>
      <rect x="72" y="52" width="36" height="26" fill="#d4f3e3" transform="rotate(-5 90 65)"/>${estrella(90, 64, 7, "#94dfbd")}
      ${[[31, 16, "#ff5c7a"], [69, 15, "#8fd0ff"], [100, 19, "#ffd84d"], [42, 57, "#c39bff"], [90, 53, "#ff5c7a"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" ${OL2}/>`).join("")}`),
  },
  microfono: {
    n: "Micrófono de karaoke", cat: "estudio", w: 58, h: 158, al: "karaoke",
    arte: () => svg(58, 158, `
      <ellipse cx="29" cy="152" rx="20" ry="5" fill="#6b5a66" ${OL2}/><rect x="27" y="40" width="4" height="112" rx="2" fill="#b39a8a"/>
      <path d="M29 44l12-14" stroke="#b39a8a" stroke-width="3.5" stroke-linecap="round"/>
      <g transform="rotate(40 44 22)"><rect x="38" y="14" width="12" height="26" rx="5" fill="#4a3346" ${OL2}/><circle cx="44" cy="12" r="9" fill="#d9cfd6" ${OL}/><path d="M38 9h12M37 13h14M38 17h12" stroke="#b9aab6" stroke-width="1.2"/></g>
      ${corazon(14, 70, 0.7, "#ff86b0")}${estrella(46, 84, 5, "#ffd84d")}`),
  },
};
