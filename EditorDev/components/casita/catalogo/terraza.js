/** La terraza: alberca, hamaca, camastro, sombrilla, mesa de picnic, foquitos, fogata y más cosas de afuera. */
import { svg, OL, OL2, tono, brillo, corazon, estrella, hoja, MADERA, MADERA_O, MADERA_C } from "./arte.js";

const maceta = (x, y, w, h, c) => `<path d="M${x} ${y}h${w}l-${w * 0.1} ${h}h-${w * 0.8}z" fill="${c}" ${OL}/><rect x="${x - 3}" y="${y - 4}" width="${w + 6}" height="9" rx="4" fill="${tono(c, 0.88)}" ${OL2}/>`;

export const ITEMS = {
  alberca: {
    n: "Alberca inflable", cat: "terraza", w: 224, h: 92, y: 536, al: "alberca", colores: ["#8fd0ff", "#ff9cbf", "#c9a7ff", "#94dfbd", "#ffd36e"],
    // Como la tina: el monito va entre el agua de atrás y la orilla de enfrente.
    lugares: [{ dx: -46, dy: -24, pose: "banando", z: 1 }, { dx: 46, dy: -24, pose: "banando", z: 1 }],
    arte: (e, C) => svg(224, 92, `
      <ellipse cx="112" cy="42" rx="108" ry="27" fill="${C}" ${OL}/><ellipse cx="112" cy="46" rx="94" ry="17" fill="#8fd8ff"/>
      <path class="ola" d="M36 46q12-6 24 0t24 0 24 0 24 0 24 0 24 0" stroke="#fff" stroke-opacity=".65" stroke-width="2.5" fill="none"/>
      <path d="M30 30q82-20 164 0" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>`),
    frente: (e, C) => svg(224, 92, `
      <path d="M18 52a94 17 0 0 0 188 0z" fill="#8fd8ff" opacity=".55"/>
      <path d="M4 44a108 27 0 0 0 216 0v22a108 22 0 0 1-216 0z" fill="${C}" ${OL}/>
      <path d="M12 56q100 30 200 0" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${[30, 70, 112, 154, 194].map((x, i) => `<circle cx="${x}" cy="${66 + (i % 2 ? 4 : 0) - Math.abs(112 - x) / 14}" r="4.5" fill="#fff" opacity=".85"/>`).join("")}
      <g class="patito-a"><ellipse cx="160" cy="48" rx="11" ry="7" fill="#ffd84d" ${OL2}/><circle cx="167" cy="40" r="6" fill="#ffd84d" ${OL2}/><path d="M172 40l5 1-5 2z" fill="#ff8a3d"/><circle cx="168" cy="38.6" r="1.1" fill="#3a2a35"/></g>`),
  },
  hamaca: {
    n: "Hamaca", cat: "terraza", w: 212, h: 134, colores: ["#ff9cbf", "#8fd0ff", "#ffd36e", "#c9a7ff", "#94dfbd"],
    // Acostadito en la hamaca: la tela de enfrente lo tapa hasta el pecho.
    lugares: [{ dx: 0, dy: 25, pose: "dormido", z: 1 }],
    arte: (e, C) => svg(212, 134, `
      <rect x="4" y="8" width="10" height="124" rx="4" fill="${MADERA_O}" ${OL2}/><rect x="198" y="8" width="10" height="124" rx="4" fill="${MADERA_O}" ${OL2}/>
      <ellipse cx="9" cy="132" rx="9" ry="2.5" fill="#6b4632" opacity=".4"/><ellipse cx="203" cy="132" rx="9" ry="2.5" fill="#6b4632" opacity=".4"/>
      <path d="M14 28L36 62M14 28l30 30M198 28l-22 34M198 28l-30 30" stroke="#e7d3b0" stroke-width="2"/>
      <path d="M36 62q70 52 140 0" stroke="${tono(C, 0.82)}" stroke-width="12" fill="none" stroke-linecap="round"/>`),
    frente: (e, C) => svg(212, 134, `
      <path d="M36 62q70 62 140 0q-70 30-140 0z" fill="${C}" ${OL}/>
      <path d="M52 78q54 30 108 0M66 88q40 18 80 0" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/>
      ${[50, 70, 90, 110, 130, 150].map((x) => `<path d="M${x} ${70 + (106 - Math.abs(106 - x)) * 0.3}v8" stroke="${tono(C, 0.8)}" stroke-width="2" stroke-linecap="round"/>`).join("")}`),
  },
  camastro: {
    n: "Camastro", cat: "terraza", w: 160, h: 74, y: 540, colores: ["#8fd0ff", "#ff9cbf", "#ffd36e", "#94dfbd"],
    lugares: [{ dx: 4, dy: 33, pose: "dormido", z: 1 }],
    arte: (e, C) => svg(160, 74, `
      <path d="M22 50l-6 22M138 50l6 22M80 52v20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M22 50l-6 22M138 50l6 22M80 52v20" stroke="#4b2e42" stroke-opacity=".15" stroke-width="5" stroke-linecap="round"/>
      <rect x="8" y="42" width="146" height="11" rx="5.5" fill="#fff" ${OL}/>
      <path d="M44 44L16 8l-8 6 26 34z" fill="${C}" ${OL}/>
      <rect x="40" y="32" width="112" height="14" rx="7" fill="${C}" ${OL}/>${[56, 76, 96, 116, 136].map((x) => `<path d="M${x} 33v12" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`).join("")}
      <path d="M90 32q14-14 30 0" fill="#fff" ${OL2}/>`),
    frente: (e, C) => svg(160, 74, `<path d="M70 40q30 10 70 2v6q-36 8-70-2z" fill="#fff" opacity=".9"/><path d="M78 44h56" stroke="${tono(C, 0.8)}" stroke-width="2"/>`),
  },
  sombrilla: {
    n: "Sombrilla", cat: "terraza", w: 162, h: 212, colores: ["#ff9cbf", "#8fd0ff", "#ffd36e", "#94dfbd", "#c9a7ff"],
    arte: (e, C) => {
      let gajos = "";
      for (let i = 0; i < 6; i++) { const x0 = 4 + i * 25.7, x1 = x0 + 25.7; if (i % 2) gajos += `<path d="M81 12L${x0.toFixed(1)} 66h${(x1 - x0).toFixed(1)}z" fill="#fff" opacity=".85"/>`; }
      return svg(162, 212, `
        <ellipse cx="81" cy="208" rx="24" ry="5" fill="#6b5a66" ${OL2}/><rect x="78" y="40" width="6" height="168" rx="3" fill="#fff" ${OL2}/>
        <path d="M4 66Q81 -16 158 66z" fill="${C}" ${OL}/>${gajos}
        ${Array.from({ length: 6 }, (_, i) => `<path d="M${(4 + i * 25.7).toFixed(1)} 66a12.85 7 0 0 0 25.7 0" fill="${i % 2 ? "#fff" : C}" ${OL2}/>`).join("")}
        <circle cx="81" cy="10" r="5" fill="${tono(C, 0.85)}" ${OL2}/><path d="M30 44q30-30 60-34" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    },
  },
  mesa_picnic: {
    n: "Mesa de picnic", cat: "terraza", w: 194, h: 112, al: "mesa", colores: ["#ff7a8a", "#8fd0ff", "#94dfbd", "#c9a7ff"],
    // Se comen juntos sentados en las bancas de las orillas (mirando hacia la mesa).
    lugares: [{ dx: -78, dy: -8, pose: "sentado", z: 1, mira: 1 }, { dx: 78, dy: -8, pose: "sentado", z: 1, mira: -1 }],
    superficie: [[64, 36], [130, 36]],
    arte: (e, C) => {
      let cuadros = "";
      for (let i = 0; i < 18; i++) cuadros += `<rect x="${28 + i * 7.6}" y="${i % 2 ? 36 : 43}" width="7.6" height="7" fill="${C}" opacity=".85"/>`;
      return svg(194, 112, `
        <path d="M56 50l-20 60M138 50l20 60" stroke="${MADERA_O}" stroke-width="8" stroke-linecap="round"/><path d="M44 84h106" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>
        <rect x="0" y="70" width="40" height="10" rx="4" fill="${MADERA}" ${OL}/><path d="M8 80v30M32 80v30" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>
        <rect x="154" y="70" width="40" height="10" rx="4" fill="${MADERA}" ${OL}/><path d="M162 80v30M186 80v30" stroke="${MADERA_O}" stroke-width="6" stroke-linecap="round"/>
        <rect x="22" y="38" width="150" height="13" rx="5" fill="${MADERA}" ${OL}/>
        <path d="M26 36h142v14l-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-4 4V36z" fill="#fff" ${OL2}/>${cuadros}
        <g class="adorno"><path d="M84 34c0-12 26-12 26 0z" fill="none" stroke="#c9905c" stroke-width="3"/><rect x="82" y="22" width="30" height="14" rx="4" fill="#e7b46c" ${OL2}/><path d="M86 27h22M86 31h22" stroke="#c9905c" stroke-width="1.5"/><circle cx="90" cy="20" r="4" fill="#ff5c6c"/><circle cx="104" cy="20" r="4" fill="#ffd84d"/></g>`);
    },
  },
  luces: {
    n: "Foquitos", cat: "terraza", w: 266, h: 198, brilla: { x: 133, y: 62, r: 150, c: "#ffe2a0", siempre: true },
    arte: () => {
      let focos = "";
      const C = ["#fff3a0", "#ffb3cf", "#bfe6ff", "#c9f2c4"];
      for (let i = 1; i < 12; i++) {
        const t = i / 12, x = 10 + 246 * t, y = 26 + 2 * t * (1 - t) * 64;
        focos += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}v5" stroke="#6b5a66" stroke-width="1.5"/><circle class="luz" cx="${x.toFixed(1)}" cy="${(y + 11).toFixed(1)}" r="10" fill="${C[i % 4]}" opacity=".45"/><ellipse class="foco f${i % 3}" cx="${x.toFixed(1)}" cy="${(y + 10).toFixed(1)}" rx="4" ry="5.5" fill="${C[i % 4]}" ${OL2}/>`;
      }
      return svg(266, 198, `
        <rect x="5" y="18" width="8" height="178" rx="3" fill="${MADERA_O}" ${OL2}/><rect x="253" y="18" width="8" height="178" rx="3" fill="${MADERA_O}" ${OL2}/>
        <path d="M10 26q123 64 246 0" stroke="#6b5a66" stroke-width="1.8" fill="none"/>${focos}
        <path d="M2 196h20M244 196h20" stroke="#6b4632" stroke-width="3" stroke-linecap="round" opacity=".4"/>`);
    },
  },
  maceta_grande: {
    n: "Planta tropical", cat: "terraza", w: 98, h: 158, al: "sacude",
    arte: () => svg(98, 158, `<g class="hojas">
      ${[[-120, 58], [-80, 62], [-50, 54], [-140, 46], [-30, 46], [-100, 40], [-65, 40]].map(([a, l], i) => `<path transform="translate(49 106) rotate(${a})" d="M0 0C${l * 0.25}-${l * 0.3} ${l * 0.7}-${l * 0.32} ${l} 0 ${l * 0.7} ${l * 0.32} ${l * 0.25} ${l * 0.3} 0 0z" fill="${i % 2 ? "#57b884" : "#7fd29b"}" ${OL2}/><path transform="translate(49 106) rotate(${a})" d="M4 0H${l - 6}" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>`).join("")}</g>
      ${maceta(24, 110, 50, 44, "#ffb48a")}<path d="M30 126h38" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>`),
  },
  cactus: {
    n: "Cactus", cat: "terraza", w: 58, h: 90, y: 548, al: "cactus",
    arte: () => svg(58, 90, `
      <rect x="21" y="14" width="16" height="56" rx="8" fill="#7fd29b" ${OL}/><path d="M21 44h-6a6 6 0 0 1-6-6V26a4 4 0 0 1 8 0v8h4M37 36h6a6 6 0 0 0 6-6v-8a4 4 0 0 0-8 0v4h-4" fill="#7fd29b" ${OL}/>
      <path d="M29 18v48M25 22v40M33 22v40" stroke="#57b884" stroke-width="1.2"/>${[[24, 26], [34, 34], [26, 46], [33, 56], [12, 30], [46, 24]].map(([x, y]) => `<path d="M${x} ${y}l-2-2M${x} ${y}l2-2" stroke="#fff" stroke-width="1"/>`).join("")}
      <circle cx="29" cy="12" r="5" fill="#ff86b0" ${OL2}/><circle cx="29" cy="12" r="2" fill="#ffd84d"/>
      ${maceta(12, 68, 34, 20, "#ff9cbf")}<circle cx="24" cy="78" r="2" fill="#fff" opacity=".7"/><circle cx="34" cy="78" r="2" fill="#fff" opacity=".7"/>`),
  },
  flamenco: {
    n: "Flamenco inflable", cat: "terraza", w: 78, h: 98, y: 550, al: "boing",
    arte: () => svg(78, 98, `
      <ellipse cx="38" cy="80" rx="34" ry="15" fill="#ff86b0" ${OL}/><ellipse cx="38" cy="78" rx="20" ry="7" fill="#ffd0e2"/>
      <path d="M56 74c10-8 10-30 4-44-4-10-16-12-20-4" stroke="#ff86b0" stroke-width="11" fill="none" stroke-linecap="round" ${OL}/><path d="M56 74c10-8 10-30 4-44-4-10-16-12-20-4" stroke="#ff9cbf" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="42" cy="24" r="9" fill="#ff9cbf" ${OL}/><path d="M33 24l-10 4 2 6 9-4z" fill="#fff" ${OL2}/><path d="M23 28l2 6-4-2z" fill="#3a2a35"/><circle cx="43" cy="21" r="1.6" fill="#3a2a35"/>
      <path d="M22 76q16 8 32 0" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  },
  regadera_j: {
    n: "Regadera de plantas", cat: "terraza", w: 60, h: 46, y: 551, al: "regar", colores: ["#94dfbd", "#8fd0ff", "#ff9cbf", "#ffd36e"],
    arte: (e, C) => svg(60, 46, `
      <path d="M14 14h26v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="${C}" ${OL}/><path d="M18 8q9-8 18 0" stroke="${tono(C, 0.8)}" stroke-width="3.5" fill="none"/>
      <path d="M40 22l14-12" stroke="${tono(C, 0.8)}" stroke-width="4.5" stroke-linecap="round"/><rect x="50" y="4" width="9" height="9" rx="2.5" fill="${tono(C, 0.7)}" transform="rotate(-40 54 8)"/>
      ${brillo(17, 18, 5, 18, 2.5, 0.5)}${corazon(27, 29, 0.6, "#fff", 'opacity=".8"')}`),
  },
  hielera: {
    n: "Hielera", cat: "terraza", w: 86, h: 64, y: 548, al: "hielera", colores: ["#8fd0ff", "#ff9cbf", "#94dfbd", "#ffd36e"],
    arte: (e, C) => svg(86, 64, `
      <rect x="6" y="22" width="74" height="40" rx="7" fill="${C}" ${OL}/><rect x="6" y="40" width="74" height="22" rx="7" fill="#fff" opacity=".9"/>
      <g class="tapa"><rect x="3" y="14" width="80" height="12" rx="5" fill="#fff" ${OL}/><rect x="30" y="8" width="26" height="7" rx="3.5" fill="none" stroke="${tono(C, 0.75)}" stroke-width="3"/></g>
      <rect x="14" y="30" width="10" height="5" rx="2" fill="${tono(C, 0.8)}"/>${estrella(62, 50, 6, "#8fd0ff")}`),
  },
  fogata: {
    n: "Fogata", cat: "terraza", w: 114, h: 86, y: 545, al: "fogata", brilla: { x: 57, y: 46, r: 180, c: "#ffae5c", propio: "on" },
    arte: () => svg(114, 86, `
      ${[[10, 74], [26, 80], [46, 82], [68, 82], [88, 79], [102, 73]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#b9aab6" ${OL2}/>`).join("")}
      <rect x="22" y="58" width="70" height="12" rx="6" fill="#8a5a3b" transform="rotate(14 57 64)" ${OL2}/><rect x="22" y="58" width="70" height="12" rx="6" fill="#9a6644" transform="rotate(-14 57 64)" ${OL2}/>
      <g class="brasas"><ellipse cx="57" cy="66" rx="26" ry="6" fill="#ff8a3d" opacity=".75"/></g>
      <g class="fuego"><path d="M57 18c10 12 20 20 16 34-2 8-8 12-16 12s-14-4-16-12c-3-12 8-16 16-34z" fill="#ff8a3d"/><path d="M57 34c6 8 10 12 8 20-1 4-4 6-8 6s-7-2-8-6c-2-8 4-12 8-20z" fill="#ffd84d"/></g>`),
  },
  bici: {
    n: "Bicicleta", cat: "terraza", w: 148, h: 94, al: "bici", colores: ["#ff9cbf", "#8fd0ff", "#94dfbd", "#ffd36e", "#c9a7ff"],
    arte: (e, C) => svg(148, 94, `
      ${[30, 118].map((x) => `<circle cx="${x}" cy="66" r="25" fill="none" stroke="#4a3346" stroke-width="5"/><circle cx="${x}" cy="66" r="21" fill="none" stroke="#d9cfd6" stroke-width="1.5" stroke-dasharray="2 5"/><circle cx="${x}" cy="66" r="4" fill="#6b5a66"/>`).join("")}
      <path d="M30 66l26-34h50M56 32l18 34h-44M74 66l32-34M106 32l12 34" stroke="${C}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M56 32l-6-12M42 18h16" stroke="#4a3346" stroke-width="5" stroke-linecap="round"/><path d="M106 32l-4-14h12" stroke="#4a3346" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M88 32h32a6 6 0 0 1-6 10H92z" fill="#e7b46c" ${OL2}/><path d="M90 32q14-10 28 0" fill="none" stroke="#c9905c" stroke-width="2.5"/>${corazon(104, 34, 0.5, "#ff5c93")}
      <circle cx="74" cy="66" r="6" fill="#6b5a66"/>${hoja(110, 26, -40, 12, "#7fd29b")}`),
  },
};
