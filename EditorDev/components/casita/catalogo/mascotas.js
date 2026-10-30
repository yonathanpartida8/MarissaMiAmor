/** Las mascotitas: se mueven solitas un poquito y, al tocarlas, hacen su ruidito y sueltan corazones. */
import { svg, OL, OL2, tono, corazon } from "./arte.js";

export const ITEMS = {
  gatito: {
    n: "Gatito", cat: "mascotas", w: 80, h: 64, y: 548, al: "miau", colores: ["#9a8aa4", "#ffb366", "#f2f2f2", "#4f4458", "#e8c39e"],
    arte: (e, C) => svg(80, 64, `
      <path class="cola" d="M14 46q-14-6-8-24" stroke="${C}" stroke-width="8" stroke-linecap="round" fill="none"/>
      <ellipse cx="34" cy="48" rx="26" ry="14" fill="${C}" ${OL}/>
      <path d="M48 16l4-12 9 9M70 13l6-10 3 13" fill="${C}" ${OL2}/><path d="M51 9l2 4M74 8l-1 5" stroke="#ff9cbf" stroke-width="3" stroke-linecap="round"/>
      <circle cx="62" cy="28" r="16" fill="${C}" ${OL}/>
      <g class="ojitos"><ellipse cx="56" cy="27" rx="2.4" ry="3.2" fill="#3a2a35"/><ellipse cx="68" cy="27" rx="2.4" ry="3.2" fill="#3a2a35"/></g>
      <path d="M60 33q2 2 4 0" stroke="#3a2a35" stroke-width="1.6" fill="none"/><ellipse cx="62" cy="31" rx="1.6" ry="1.2" fill="#ff86b0"/>
      <path d="M48 31h-8M48 34l-7 2M76 31h8M76 34l7 2" stroke="#3a2a35" stroke-width="1" opacity=".5"/>
      <ellipse cx="52" cy="58" rx="6" ry="4" fill="${tono(C, 1.2)}" ${OL2}/><ellipse cx="22" cy="58" rx="6" ry="4" fill="${tono(C, 1.2)}" ${OL2}/>
      <ellipse cx="53" cy="33" rx="3" ry="2" fill="#ff9cbf" opacity=".6"/><ellipse cx="71" cy="33" rx="3" ry="2" fill="#ff9cbf" opacity=".6"/>`),
  },
  perrito: {
    n: "Perrito", cat: "mascotas", w: 90, h: 78, y: 548, al: "guau", colores: ["#e8c39e", "#ffffff", "#c8956d", "#4f4458", "#f2d27a"],
    arte: (e, C) => svg(90, 78, `
      <path class="cola" d="M12 40q-10-10-4-22" stroke="${C}" stroke-width="8" stroke-linecap="round" fill="none"/>
      <ellipse cx="36" cy="52" rx="28" ry="16" fill="${C}" ${OL}/>
      <rect x="18" y="58" width="10" height="18" rx="5" fill="${C}" ${OL2}/><rect x="44" y="58" width="10" height="18" rx="5" fill="${C}" ${OL2}/>
      <circle cx="66" cy="30" r="20" fill="${C}" ${OL}/>
      <path d="M50 18c-10 4-12 20-6 28 6-4 8-14 6-28zM82 18c10 4 12 20 6 28-6-4-8-14-6-28z" fill="${tono(C, 0.72)}" ${OL2}/>
      <ellipse cx="68" cy="40" rx="10" ry="7" fill="${tono(C, 1.3)}"/><ellipse cx="68" cy="35" rx="4" ry="3" fill="#3a2a35"/>
      <circle cx="59" cy="27" r="2.8" fill="#3a2a35"/><circle cx="76" cy="27" r="2.8" fill="#3a2a35"/>
      <path class="lengua" d="M66 44q2 8 6 0" fill="#ff86b0"/><rect x="48" y="44" width="30" height="5" rx="2.5" fill="#ff5c93" opacity=".9"/>${corazon(63, 52, 0.45, "#ffd84d")}`),
  },
  conejito: {
    n: "Conejito", cat: "mascotas", w: 62, h: 80, y: 548, al: "boing", colores: ["#ffffff", "#e8c39e", "#d9d0dc", "#ffd0e2"],
    arte: (e, C) => svg(62, 80, `
      <g class="orejas"><ellipse cx="22" cy="18" rx="7" ry="18" fill="${C}" ${OL2}/><ellipse cx="40" cy="18" rx="7" ry="18" fill="${C}" ${OL2}/><ellipse cx="22" cy="20" rx="3" ry="12" fill="#ffb3cf"/><ellipse cx="40" cy="20" rx="3" ry="12" fill="#ffb3cf"/></g>
      <ellipse cx="31" cy="62" rx="22" ry="16" fill="${C}" ${OL}/><circle cx="31" cy="42" r="16" fill="${C}" ${OL}/>
      <circle cx="25" cy="40" r="2.4" fill="#3a2a35"/><circle cx="37" cy="40" r="2.4" fill="#3a2a35"/><ellipse cx="31" cy="46" rx="2" ry="1.5" fill="#ff86b0"/>
      <ellipse cx="22" cy="47" rx="3" ry="2" fill="#ff9cbf" opacity=".6"/><ellipse cx="40" cy="47" rx="3" ry="2" fill="#ff9cbf" opacity=".6"/><circle cx="52" cy="66" r="6" fill="#fff" ${OL2}/>`),
  },
};
