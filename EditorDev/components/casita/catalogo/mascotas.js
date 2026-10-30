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
  hamster: {
    n: "Hámster", cat: "mascotas", w: 98, h: 86, y: 548, al: "chillido",
    arte: () => svg(98, 86, `
      <rect x="4" y="70" width="90" height="14" rx="5" fill="#ff9cbf" ${OL}/>
      <path d="M8 72V34a41 30 0 0 1 82 0v38" fill="#fff" fill-opacity=".25" stroke="#b9aab6" stroke-width="2.5"/>${[18, 30, 42, 54, 66, 78].map((x) => `<path d="M${x} 72V${x < 49 ? 26 - (49 - x) * 0.25 : 26 - (x - 49) * 0.25}" stroke="#b9aab6" stroke-width="1.6"/>`).join("")}
      <g class="rueda"><circle cx="34" cy="48" r="20" fill="none" stroke="#8fd0ff" stroke-width="4"/><path d="M34 28v40M14 48h40M20 34l28 28M48 34L20 62" stroke="#bfe6ff" stroke-width="1.5"/></g>
      <ellipse cx="34" cy="62" rx="9" ry="6.5" fill="#f2b45a" ${OL2}/><circle cx="41" cy="59" r="5.5" fill="#f2b45a" ${OL2}/><circle cx="43" cy="58" r="1.2" fill="#3a2a35"/><circle cx="39" cy="54" r="2" fill="#ffb3cf"/><ellipse cx="33" cy="64" rx="5" ry="3" fill="#fff4e0"/>
      <rect x="72" y="28" width="9" height="26" rx="4" fill="#bfe6ff" ${OL2}/><path d="M76 54v8" stroke="#b9aab6" stroke-width="2"/><circle cx="49" cy="4" r="4" fill="none" stroke="#b9aab6" stroke-width="2"/>`),
  },
  pajarito: {
    n: "Pajarito", cat: "mascotas", w: 74, h: 162, al: "pio",
    arte: () => svg(74, 162, `
      <ellipse cx="37" cy="158" rx="20" ry="4" fill="#6b5a66" ${OL2}/><rect x="34" y="84" width="6" height="74" rx="3" fill="#b39a8a"/>
      <path d="M8 84V40a29 29 0 0 1 58 0v44" fill="#fff" fill-opacity=".2" stroke="#d9a05b" stroke-width="2.5"/>${[16, 26, 37, 48, 58].map((x) => `<path d="M${x} 84V${18 + Math.abs(37 - x) * 0.7}" stroke="#d9a05b" stroke-width="1.5"/>`).join("")}
      <rect x="4" y="82" width="66" height="7" rx="3" fill="#d9a05b" ${OL2}/><circle cx="37" cy="9" r="4" fill="none" stroke="#d9a05b" stroke-width="2.4"/>
      <path d="M16 62h42" stroke="#b07a4a" stroke-width="3" stroke-linecap="round"/>
      <g class="pajaro"><ellipse cx="36" cy="52" rx="10" ry="8.5" fill="#ffd84d" ${OL2}/><circle cx="42" cy="44" r="6.5" fill="#ffd84d" ${OL2}/><path d="M48 44l5 1.5-5 2z" fill="#ff8a3d"/><circle cx="44" cy="42.6" r="1.3" fill="#3a2a35"/><circle cx="41" cy="47" r="1.8" fill="#ff9cbf" opacity=".7"/><path d="M26 52q-6 2-8 8 6 0 10-4" fill="#f5c430" ${OL2}/><path d="M34 54q4 4 8 0" stroke="#f5c430" stroke-width="2" fill="none"/></g>`),
  },
  tortuga: {
    n: "Tortuguita", cat: "mascotas", w: 74, h: 46, y: 552, al: "tortuga",
    arte: () => svg(74, 46, `
      <g class="patas"><ellipse cx="18" cy="38" rx="6" ry="5" fill="#94dfbd" ${OL2}/><ellipse cx="50" cy="38" rx="6" ry="5" fill="#94dfbd" ${OL2}/><g class="cabeza"><circle cx="64" cy="26" r="8" fill="#94dfbd" ${OL2}/><circle cx="66" cy="23.5" r="1.4" fill="#3a2a35"/><path d="M64 30q3 2 6-1" stroke="#3a2a35" stroke-width="1.2" fill="none"/><ellipse cx="62" cy="28" rx="2" ry="1.3" fill="#ff9cbf" opacity=".7"/></g></g>
      <path d="M6 36a28 26 0 0 1 56 0z" fill="#7fbf6a" ${OL}/>
      <path d="M22 16l12-4 12 4 2 12-14 6-14-6z" fill="#9bd685" stroke="#5e9e4e" stroke-width="1.5"/><path d="M22 16l-10 10M46 16l10 10M20 28l-10 6M48 28l10 6M34 34v2" stroke="#5e9e4e" stroke-width="1.5"/>
      <rect x="4" y="33" width="60" height="5" rx="2.5" fill="#6aa85a"/>${corazon(34, 22, 0.45, "#fff", 'opacity=".6"')}`),
  },
};
