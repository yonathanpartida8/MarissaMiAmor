/** La sala: sillones, tele, lámparas, libros, música, pecera y chimenea. */
import { svg, OL, OL2, tono, brillo, corazon, estrella, hoja, sentado, MADERA, MADERA_O, MADERA_C } from "./arte.js";

const PASTEL = ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#ffd96b", "#94dfbd", "#ffb48a", "#f2f2f2"];

export const ITEMS = {
  sofa: {
    n: "Sillón grande", cat: "sala", w: 220, h: 124, colores: PASTEL,
    lugares: [sentado(-39, -62), sentado(39, -62)],
    arte: (e, C) => svg(220, 124, `
      <rect x="12" y="14" width="196" height="72" rx="32" fill="${C}" ${OL}/>
      <rect x="28" y="22" width="164" height="14" rx="7" fill="#fff" opacity=".25"/>
      ${corazon(110, 46, 1.2, tono(C, 0.85))}
      <rect x="40" y="34" width="36" height="30" rx="12" fill="${tono(C, 1.4)}" ${OL2} transform="rotate(-12 58 49)"/>
      <rect x="146" y="34" width="36" height="30" rx="12" fill="${tono(C, 1.25)}" ${OL2} transform="rotate(10 164 49)"/>
      <rect x="2" y="48" width="44" height="62" rx="20" fill="${tono(C, 0.9)}" ${OL}/>
      <rect x="174" y="48" width="44" height="62" rx="20" fill="${tono(C, 0.9)}" ${OL}/>
      ${brillo(8, 54, 30, 8, 4)}${brillo(180, 54, 30, 8, 4)}
      <rect x="34" y="62" width="74" height="34" rx="14" fill="${tono(C, 1.18)}" ${OL}/>
      <rect x="112" y="62" width="74" height="34" rx="14" fill="${tono(C, 1.18)}" ${OL}/>
      ${brillo(40, 66, 62, 7, 4)}${brillo(118, 66, 62, 7, 4)}
      <rect x="16" y="92" width="188" height="20" rx="10" fill="${tono(C, 0.8)}" ${OL}/>
      <rect x="28" y="108" width="12" height="15" rx="4" fill="${MADERA_O}"/><rect x="180" y="108" width="12" height="15" rx="4" fill="${MADERA_O}"/>`),
  },
  sillon: {
    n: "Sillita", cat: "sala", w: 120, h: 118, colores: ["#c9a7ff", "#ff9cbf", "#ffd96b", "#94dfbd", "#8fd0ff"],
    lugares: [sentado(0, -58)],
    arte: (e, C) => svg(120, 118, `
      <path d="M18 70V30a30 30 0 0 1 30-28h24a30 30 0 0 1 30 28v40z" fill="${C}" ${OL}/>
      <path d="M30 26a20 20 0 0 1 20-14h20" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round" fill="none"/>
      ${[30, 50, 70, 90].map((x) => `<circle cx="${x}" cy="44" r="2.6" fill="${tono(C, 0.75)}"/>`).join("")}
      <rect x="2" y="50" width="30" height="54" rx="14" fill="${tono(C, 0.88)}" ${OL}/>
      <rect x="88" y="50" width="30" height="54" rx="14" fill="${tono(C, 0.88)}" ${OL}/>
      <rect x="24" y="58" width="72" height="34" rx="14" fill="${tono(C, 1.2)}" ${OL}/>${brillo(30, 62, 60, 7, 4)}
      <rect x="10" y="90" width="100" height="16" rx="8" fill="${tono(C, 0.8)}" ${OL}/>
      <path d="M20 104l-4 13M100 104l4 13" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>`),
  },
  mesita: {
    n: "Mesita", cat: "sala", w: 150, h: 70, y: 548,
    arte: () => svg(150, 70, `
      <path d="M58 10c0-8 6-10 10-10s10 2 10 10l-3 14h-14z" fill="#8fd0ff" ${OL2}/>
      <path d="M68 2c-4-6-1-12 4-12" stroke="#57b884" stroke-width="2.5" fill="none"/>${corazon(73, -12, 0.7, "#ff5c93")}
      <rect x="92" y="14" width="34" height="10" rx="3" fill="#ffb48a" ${OL2}/><rect x="96" y="6" width="28" height="9" rx="3" fill="#c9a7ff" ${OL2}/>
      <ellipse cx="75" cy="27" rx="73" ry="9" fill="${MADERA}" ${OL}/>${brillo(20, 22, 90, 4, 2)}
      <rect x="10" y="30" width="130" height="10" rx="4" fill="${MADERA_O}"/>
      <path d="M22 38l-6 30M128 38l6 30M48 40l-2 24M102 40l2 24" stroke="${MADERA_O}" stroke-width="7" stroke-linecap="round"/>`),
  },
  tele: {
    n: "Tele", cat: "sala", w: 150, h: 156, al: "tele",
    arte: () => svg(150, 156, `
      <rect x="6" y="108" width="138" height="44" rx="8" fill="${MADERA}" ${OL}/>
      <rect x="14" y="116" width="58" height="28" rx="5" fill="${MADERA_C}" ${OL2}/><rect x="78" y="116" width="58" height="28" rx="5" fill="${MADERA_C}" ${OL2}/>
      <circle cx="43" cy="130" r="3" fill="${MADERA_O}"/><circle cx="107" cy="130" r="3" fill="${MADERA_O}"/>
      <rect x="66" y="96" width="18" height="14" fill="#7d6a78"/>
      <rect x="4" y="2" width="142" height="98" rx="14" fill="#4f4458" ${OL}/>
      <rect x="12" y="10" width="126" height="80" rx="9" class="pantalla" fill="#2d2838"/>
      <g class="canal c1"><rect x="12" y="10" width="126" height="80" rx="9" fill="#ffd3e2"/>${corazon(50, 50, 2.2, "#ff5c93", 'class="flota"')}${corazon(96, 40, 1.4, "#ff86b0", 'class="flota d2"')}${corazon(110, 70, 1, "#fff", 'class="flota d3"')}</g>
      <g class="canal c2"><rect x="12" y="10" width="126" height="80" rx="9" fill="#2f2a63"/>${estrella(40, 34, 9, "#ffe17a", 'class="tilin"')}${estrella(100, 30, 6, "#fff", 'class="tilin d2"')}${estrella(76, 64, 7, "#ffd0e2", 'class="tilin d3"')}<path d="M18 86q30-22 60 0t60 0" fill="#5b4c93"/></g>
      <g class="canal c3"><rect x="12" y="10" width="126" height="80" rx="9" fill="#bfe8ff"/><g class="flota"><path d="M50 40l-6-14 14 8M100 40l6-14-14 8" fill="#ffb48a"/><ellipse cx="75" cy="56" rx="30" ry="24" fill="#ffb48a"/><circle cx="64" cy="52" r="3.5" fill="#3a2a35"/><circle cx="86" cy="52" r="3.5" fill="#3a2a35"/><path d="M71 62q4 4 8 0" stroke="#3a2a35" stroke-width="2" fill="none"/></g></g>
      <path d="M20 16l20 0-18 26z" fill="#fff" opacity=".12"/>
      <circle cx="130" cy="95" r="2.2" class="led" fill="#ff5c93"/>`),
  },
  lampara: {
    n: "Lámpara", cat: "sala", w: 64, h: 196, al: "luz", luz: true,
    arte: () => svg(64, 196, `
      <path class="luz" d="M10 62L-38 196h140L54 62z" fill="#fff3b0" opacity=".38"/>
      <rect x="29" y="58" width="6" height="128" rx="3" fill="#b39a8a"/>
      <ellipse cx="32" cy="188" rx="24" ry="7" fill="#9c8577" ${OL2}/>
      <path d="M10 62L20 8h24l10 54z" fill="#ffe08a" ${OL}/>
      <path d="M20 14l-5 40" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
      <path d="M10 62h44" stroke="#f0b94a" stroke-width="4"/>`),
  },
  librero: {
    n: "Librero", cat: "sala", w: 132, h: 204, al: "libro",
    arte: () => {
      const libros = (y, xs) => xs.map(([x, w, h, c]) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="2" fill="${c}" ${OL2}/><rect x="${x + 2}" y="${y - h + 6}" width="${w - 4}" height="3" fill="#fff" opacity=".45"/>`).join("");
      return svg(132, 204, `
        <rect x="4" y="4" width="124" height="196" rx="8" fill="${MADERA}" ${OL}/>
        <rect x="12" y="12" width="108" height="180" rx="4" fill="${MADERA_O}"/>
        ${[60, 112, 164].map((y) => `<rect x="10" y="${y}" width="112" height="8" fill="${MADERA}"/>`).join("")}
        ${libros(60, [[16, 12, 40, "#ff86b0"], [29, 10, 34, "#ffd96b"], [40, 14, 44, "#8fd0ff"], [55, 10, 38, "#c9a7ff"]])}
        <path d="M80 60c-2-14 6-22 12-26 6 4 14 12 12 26z" fill="#7fd29b" ${OL2}/><rect x="84" y="50" width="16" height="10" rx="3" fill="#ffb48a"/>
        ${libros(112, [[16, 14, 40, "#94dfbd"], [31, 11, 32, "#ff9cbf"], [70, 12, 42, "#ffb48a"], [83, 10, 36, "#8fd0ff"], [94, 14, 40, "#ffd96b"]])}
        <path d="M44 112l20-30 4 3-18 27z" fill="#c9a7ff" ${OL2}/>
        ${libros(164, [[16, 12, 36, "#c9a7ff"], [29, 14, 42, "#ff86b0"], [44, 10, 30, "#94dfbd"]])}
        <circle cx="90" cy="150" r="12" fill="#ffd0e2" ${OL2}/>${corazon(90, 151, 0.8, "#ff5c93")}
        <rect x="10" y="190" width="10" height="10" fill="${MADERA_O}"/><rect x="112" y="190" width="10" height="10" fill="${MADERA_O}"/>`);
    },
  },
  tocadiscos: {
    n: "Tocadiscos", cat: "sala", w: 112, h: 120, al: "musica", musica: "baile",
    arte: () => svg(112, 120, `
      <rect x="6" y="46" width="100" height="70" rx="8" fill="${MADERA}" ${OL}/>
      <rect x="14" y="56" width="40" height="52" rx="6" fill="#6b5a66"/>${[64, 72, 80, 88, 96].map((y) => `<rect x="18" y="${y}" width="32" height="3" rx="1.5" fill="#8a7a86"/>`).join("")}
      <circle cx="80" cy="74" r="6" fill="${MADERA_C}" ${OL2}/><circle cx="80" cy="94" r="6" fill="${MADERA_C}" ${OL2}/>
      <rect x="2" y="30" width="108" height="20" rx="6" fill="#ff9cbf" ${OL}/>
      <g class="disco"><ellipse cx="48" cy="30" rx="34" ry="9" fill="#3a2f40"/><ellipse cx="48" cy="30" rx="22" ry="5.5" fill="none" stroke="#5a4c62" stroke-width="1.5"/><ellipse cx="48" cy="30" rx="8" ry="2.6" fill="#ff5c93"/></g>
      <path d="M96 22l-6 6-20 4" stroke="#b39a8a" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="96" cy="22" r="5" fill="#b39a8a"/>
      <g class="notas"><path d="M30 14v-14l10-3v12" stroke="#ff5c93" stroke-width="3" fill="none"/><circle cx="27" cy="14" r="4" fill="#ff5c93"/><circle cx="37" cy="10" r="4" fill="#ff5c93"/><path class="d2" d="M70 8v-12" stroke="#c9a7ff" stroke-width="3"/><circle class="d2" cx="67" cy="8" r="4" fill="#c9a7ff"/></g>`),
  },
  pecera: {
    n: "Pecera", cat: "sala", w: 124, h: 142, al: "pecera",
    arte: () => svg(124, 142, `
      <rect x="14" y="92" width="96" height="48" rx="6" fill="${MADERA}" ${OL}/><rect x="22" y="100" width="80" height="30" rx="4" fill="${MADERA_C}" ${OL2}/>
      <rect x="4" y="6" width="116" height="88" rx="12" fill="#bfe8ff" ${OL}/>
      <rect x="10" y="22" width="104" height="66" rx="8" fill="#7cc8f0" opacity=".7"/>
      <path d="M10 80q14-8 26 0t28 0 26 0 24 0v8H10z" fill="#ffe0a8"/>
      <path d="M26 82c-6-14 4-28-2-40M34 82c4-12-4-22 2-34M96 82c-4-12 6-20 0-32" stroke="#57b884" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g class="pez1"><path d="M0 0c8-8 22-8 28 0-6 8-20 8-28 0zM28 0l10-7v14z" fill="#ff9e5a" transform="translate(44 44)"/><circle cx="64" cy="42" r="2" fill="#3a2a35"/></g>
      <g class="pez2"><path d="M0 0c6-6 16-6 20 0-4 6-14 6-20 0zM20 0l8-5v10z" fill="#ff86b0" transform="translate(66 64)"/><circle cx="80" cy="63" r="1.6" fill="#3a2a35"/></g>
      <g class="burbu"><circle cx="40" cy="36" r="3" fill="#fff" opacity=".8"/><circle cx="46" cy="28" r="2" fill="#fff" opacity=".8"/><circle cx="88" cy="40" r="2.5" fill="#fff" opacity=".8"/></g>
      <path d="M14 14h96" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/><path d="M110 22v40" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`),
  },
  chimenea: {
    n: "Chimenea", cat: "sala", w: 176, h: 182, al: "fuego",
    arte: () => {
      const ladrillos = Array.from({ length: 6 }, (_, f) => Array.from({ length: 6 }, (_, i) => { const x = 12 + i * 26 + (f % 2) * 13; return `<rect x="${x}" y="${44 + f * 20}" width="${Math.max(0, Math.min(23, 164 - x))}" height="17" rx="3" fill="${(i + f) % 3 ? "#f2b49d" : "#eaa38b"}"/>`; }).join("")).join("");
      return svg(176, 182, `
        <rect x="8" y="40" width="160" height="140" rx="6" fill="#e59d86" ${OL}/>
        ${ladrillos}
        <path d="M44 180v-64a44 44 0 0 1 88 0v64z" fill="#3b2c36" ${OL}/>
        <g class="brasas"><ellipse cx="88" cy="168" rx="36" ry="8" fill="#ff8a3d" opacity=".5"/></g>
        <path d="M58 172l60-10M62 162l56 10" stroke="#8a5a3b" stroke-width="9" stroke-linecap="round"/>
        <g class="fuego"><path d="M88 166c-22-4-24-26-10-40 0 12 8 12 8 4 0-14 8-22 14-28-2 14 12 20 10 38-1 14-10 24-22 26z" fill="#ff8a3d"/><path d="M88 166c-12-2-14-14-6-22 2 8 8 6 8 0 6 4 10 10 8 16-2 4-5 6-10 6z" fill="#ffd96b"/></g>
        <rect x="0" y="28" width="176" height="16" rx="5" fill="${MADERA}" ${OL}/>${brillo(8, 31, 120, 4, 2)}
        <rect x="18" y="6" width="10" height="22" rx="3" fill="#fff6ea" ${OL2}/><path d="M23 6c-3-4 0-8 0-8s3 4 0 8z" fill="#ffb84a" class="vela"/>
        <rect x="64" y="2" width="44" height="26" rx="4" fill="#fff" ${OL2}/>${corazon(86, 15, 0.9, "#ff5c93")}
        <path d="M140 28c-4-10 2-20 10-22 4 8 2 18-4 22z" fill="#7fd29b" ${OL2}/><rect x="138" y="20" width="16" height="9" rx="2" fill="#c9a7ff"/>`);
    },
  },
  alfombra: {
    n: "Alfombra", cat: "sala", capa: "alfombra", w: 270, h: 52, y: 556, colores: ["#ffd0e2", "#e3d6ff", "#cdeeff", "#fff0b8", "#d4f3e3"],
    arte: (e, C) => svg(270, 52, `
      <ellipse cx="135" cy="26" rx="132" ry="24" fill="${C}" ${OL}/>
      <ellipse cx="135" cy="26" rx="110" ry="17" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 8"/>
      <ellipse cx="135" cy="26" rx="70" ry="9" fill="${tono(C, 0.92)}"/>${corazon(135, 26, 0.9, "#fff")}`),
  },
};
