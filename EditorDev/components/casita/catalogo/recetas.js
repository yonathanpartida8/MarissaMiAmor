/**
 * LAS RECETAS: lo que se cocina en la estufa (sartén, olla u horno), en el asador, el micro o la
 * licuadora. Cada una dice dónde se hace, cuánto tarda y cómo se ve servida (plato, tazón o sola).
 * Al terminar, el platillo queda en la mano de tu monito; tocando una mesa se sirve para los dos.
 * Para agregar una receta: una fila aquí y aparece sola en «¿Qué cocinamos?».
 *
 * La comida se dibuja en un cuadrito de 44 × 30 (el plato al fondo y la comida encima, centrada en x = 22).
 */
import { OL2, corazon } from "./arte.js";

const BASES = {
  plato: `<ellipse cx="22" cy="23.5" rx="20.5" ry="6.2" fill="#fff" ${OL2}/><ellipse cx="22" cy="22.6" rx="14.5" ry="3.8" fill="#f4edf3"/><path d="M5 24q17 7 34 0" stroke="#ffb3cf" stroke-width="1.4" fill="none" opacity=".8"/>`,
  tazon: `<path d="M4 14h36a18 13.5 0 0 1-36 0z" fill="#fff" ${OL2}/><path d="M7.5 19.5q14.5 6 29 0" stroke="#ff9cbf" stroke-width="2" fill="none"/><circle cx="12" cy="22" r="1.1" fill="#ff9cbf"/><circle cx="32" cy="22" r="1.1" fill="#ff9cbf"/><ellipse cx="22" cy="28.4" rx="8" ry="1.6" fill="#e8dce6"/>`,
  nada: "",
};

/** [clave, nombre, dónde se hace, segundos, color (lo que se ve en el sartén), base, dibujo de la comida] */
const LISTA = [
  ["hotcakes", "Hotcakes", "sarten", 3, "#f2b45a", "plato", `
    <ellipse cx="22" cy="19.5" rx="13" ry="4" fill="#e3994a" ${OL2}/><ellipse cx="22" cy="16" rx="13" ry="4" fill="#efad57" ${OL2}/><ellipse cx="22" cy="12.5" rx="13" ry="4" fill="#f7c271" ${OL2}/>
    <path d="M11 12.6q3 5.5 6 1.2 3 6 7 1 4 5.4 8-.8" stroke="#a85a1c" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    <rect x="18.5" y="7.6" width="7" height="4.2" rx="1.3" fill="#fff4b0" ${OL2}/><circle cx="30" cy="9.2" r="2.7" fill="#ff5c6c"/><path d="M30 6.8l1.2-1.6" stroke="#57b884" stroke-width="1.4"/>`],
  ["huevos", "Huevitos con tocino", "sarten", 3, "#fff3c4", "plato", `
    <path d="M7 18.5c-2-5 4-8 8-6 4-3 10 0 8 5 1 4-6 6-10 5-4 1-7-1-6-4z" fill="#fff" ${OL2}/><circle cx="14.6" cy="16.6" r="3.3" fill="#ffc83d"/><circle cx="13.7" cy="15.7" r="1" fill="#fff" opacity=".7"/>
    <path d="M21 17.5c-1-5 5-7 8-5 4-2 9 1 7 5 1 4-5 5-8 4-4 1-8-1-7-4z" fill="#fff" ${OL2}/><circle cx="28.6" cy="16" r="3.3" fill="#ffc83d"/><circle cx="27.7" cy="15.1" r="1" fill="#fff" opacity=".7"/>
    <path d="M11 22.4q4-3 8 0t8 0 6 0" stroke="#d9534f" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M11 22.4q4-3 8 0t8 0 6 0" stroke="#ffb3a8" stroke-width="1" fill="none" stroke-linecap="round"/>`],
  ["quesadillas", "Quesadillas", "sarten", 3, "#f3d38a", "plato", `
    <path d="M5 20.5a10.5 9.5 0 0 1 21 0z" fill="#f0cf86" ${OL2}/><path d="M8.5 20.4q7-2.6 14 0" stroke="#ffd84d" stroke-width="2.4"/><circle cx="12" cy="15" r=".9" fill="#c79a5a"/><circle cx="18" cy="13.6" r=".9" fill="#c79a5a"/>
    <path d="M18 20.5a10.5 9.5 0 0 1 21 0z" fill="#e9c27a" ${OL2}/><path d="M21.5 20.4q7-2.6 14 0" stroke="#ffd84d" stroke-width="2.4"/><circle cx="26" cy="14.4" r=".9" fill="#c79a5a"/><circle cx="32" cy="15.6" r=".9" fill="#c79a5a"/>
    <ellipse cx="36" cy="22" rx="4" ry="2" fill="#d94a4a" ${OL2}/><circle cx="8" cy="22" r="2" fill="#7fd29b"/>`],
  ["sopa", "Sopita calientita", "olla", 4, "#ffb46b", "tazon", `
    <ellipse cx="22" cy="14" rx="17" ry="3.6" fill="#ffb46b"/><ellipse cx="22" cy="13.6" rx="13" ry="2.2" fill="#ffc98a"/>
    <circle cx="14" cy="13.5" r="1.8" fill="#ff8a3d"/><circle cx="20" cy="14.6" r="1.6" fill="#7fd29b"/><circle cx="27" cy="13.2" r="1.8" fill="#ff8a3d"/><circle cx="31" cy="14.6" r="1.4" fill="#7fd29b"/><rect x="23" y="11.6" width="5" height="1.6" rx=".8" fill="#fff6d8"/>`],
  ["pasta", "Espagueti con albóndigas", "olla", 4, "#ffe08a", "plato", `
    <ellipse cx="22" cy="17" rx="13" ry="5.4" fill="#ffe08a" ${OL2}/>
    <path d="M11 17q3-4 6 0t6 0 6 0 5 0M12 19.5q3-3 6 0t6 0 6 0M14 14.6q3-3 6 0t6 0 4 0" stroke="#f2c14e" stroke-width="1.3" fill="none"/>
    <path d="M15 13c2-4 12-4 14 0 1 3-3 5-7 5s-8-2-7-5z" fill="#e8513f" opacity=".92"/>
    <circle cx="18" cy="13" r="3" fill="#9a4a2c" ${OL2}/><circle cx="26" cy="12.4" r="3" fill="#9a4a2c" ${OL2}/><circle cx="22" cy="10" r="2.7" fill="#a85636" ${OL2}/><circle cx="21" cy="9.2" r=".8" fill="#fff" opacity=".5"/>
    <path d="M27 8.6l3-2" stroke="#57b884" stroke-width="2" stroke-linecap="round"/>`],
  ["ramen", "Ramen", "olla", 4, "#f6c38a", "tazon", `
    <ellipse cx="22" cy="14" rx="17" ry="3.6" fill="#f2b06a"/>
    <path d="M9 14q3-3 6 0t6 0 6 0 6 0" stroke="#fff1b0" stroke-width="1.6" fill="none"/>
    <ellipse cx="15" cy="12.4" rx="4" ry="2.6" fill="#fff" ${OL2}/><ellipse cx="15" cy="12.4" rx="2" ry="1.4" fill="#ffb02e"/>
    <circle cx="25" cy="12.6" r="2.8" fill="#fff" ${OL2}/><path d="M23.6 12.6q1.4-1.6 2.8 0" stroke="#ff7aa8" stroke-width="1" fill="none"/>
    <rect x="29" y="6" width="5" height="9" rx="1" fill="#2f4a3a" transform="rotate(12 31 10)"/><path d="M33 5l4-4M35 6l4-4" stroke="#b07a4a" stroke-width="1.6" stroke-linecap="round"/>`],
  ["pozole", "Pozolito", "olla", 4, "#e8603c", "tazon", `
    <ellipse cx="22" cy="14" rx="17" ry="3.6" fill="#e8603c"/><ellipse cx="22" cy="13.6" rx="13" ry="2.2" fill="#f07a4f"/>
    ${[[13, 13.4], [17, 14.6], [24, 13], [29, 14.4], [20, 12.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff8e6"/>`).join("")}
    <path d="M26 10.6q3-3 6 0-3 1.5-6 0z" fill="#8fdc7a"/><circle cx="12" cy="11.6" r="2" fill="#ff5c7a"/><circle cx="12" cy="11.6" r=".9" fill="#fff"/>`],
  ["pizza", "Pizza", "horno", 5, "#ffcf5c", "plato", `
    <ellipse cx="22" cy="17.5" rx="16.5" ry="6" fill="#dd9445" ${OL2}/><ellipse cx="22" cy="17" rx="14" ry="4.8" fill="#e8513f"/><ellipse cx="22" cy="16.8" rx="13" ry="4.2" fill="#ffd35c"/>
    <path d="M22 12.6v8.6M9.6 15l24.8 4M9.6 19l24.8-4" stroke="#e7a83b" stroke-width=".8" opacity=".8"/>
    ${[[15, 15.4], [27, 15], [20, 19.2], [30, 18.4], [13, 18.4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.1" ry="1.4" fill="#c8402f"/>`).join("")}
    <circle cx="24" cy="17" r=".9" fill="#57b884"/><circle cx="17.5" cy="17.6" r=".9" fill="#57b884"/>`],
  ["pastel", "Pastelito de fresa", "horno", 5, "#ffd0e2", "plato", `
    <rect x="10" y="10" width="24" height="12" rx="3" fill="#ffd0e2" ${OL2}/><rect x="10" y="15" width="24" height="2.4" fill="#ff86b0"/>
    <path d="M10 12.4q3 3.4 6 0t6 0 6 0 6 0V10H10z" fill="#fff" ${OL2}/>
    <circle cx="17" cy="8.4" r="2.6" fill="#ff5c6c"/><circle cx="27" cy="8.4" r="2.6" fill="#ff5c6c"/><path d="M17 6l1-1.4M27 6l1-1.4" stroke="#57b884" stroke-width="1.3"/>
    ${corazon(22, 8.6, 0.42, "#ff5c93")}`],
  ["galletas", "Galletitas", "horno", 4, "#e7b46c", "plato", `
    ${[[13, 18.5], [31, 18.5], [22, 14.5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.6" fill="#e7b46c" ${OL2}/><ellipse cx="${x}" cy="${y - 0.8}" rx="6.4" ry="3.2" fill="#efc27e"/><circle cx="${x - 2.6}" cy="${y - 1}" r="1.2" fill="#6b4632"/><circle cx="${x + 2.4}" cy="${y - 1.6}" r="1.2" fill="#6b4632"/><circle cx="${x + 0.4}" cy="${y + 0.8}" r="1.1" fill="#6b4632"/>`).join("")}`],
  ["chocolate", "Chocolate caliente", "olla", 3, "#7a4a32", "nada", `
    <path d="M9 7h22v13a7 7 0 0 1-7 7h-8a7 7 0 0 1-7-7z" fill="#ffd0e2" ${OL2}/><path d="M31 10h3a4.4 4.4 0 0 1 0 8.8h-3" stroke="#ffd0e2" stroke-width="3" fill="none"/>
    <ellipse cx="20" cy="7.6" rx="10.4" ry="2.6" fill="#7a4a32"/>
    <rect x="13" y="4" width="5" height="4" rx="1.2" fill="#fff" ${OL2}/><rect x="20" y="3.2" width="5" height="4" rx="1.2" fill="#fff" ${OL2}/><rect x="16" y="1.4" width="5" height="4" rx="1.2" fill="#ffe3ec" ${OL2}/>
    ${corazon(20, 17, 0.55, "#fff", 'opacity=".9"')}<ellipse cx="22" cy="28" rx="12" ry="1.6" fill="#e8dce6"/>`],
  ["elote", "Elotito asado", "parrilla", 3, "#ffd84d", "plato", `
    <path d="M9 19c-1-5 2-9 8-11l14-3c4 0 5 4 2 6l-13 8c-5 3-10 3-11 0z" fill="#ffd84d" ${OL2}/>
    ${[13, 17, 21, 25, 29].map((x) => `<path d="M${x} ${17 - (x - 13) * 0.6}l2 3" stroke="#e8b828" stroke-width="1.2"/>`).join("")}
    <path d="M12 12q8-2 16-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><path d="M12 14q8-2 16-6" stroke="#e8513f" stroke-width="1.2" stroke-dasharray="1.4 2" fill="none"/>
    <path d="M6 22l5-3" stroke="#b07a4a" stroke-width="2" stroke-linecap="round"/>`],
  ["hamburguesa", "Hamburguesa", "parrilla", 4, "#9a4a2c", "plato", `
    <path d="M10 19h24a4 4 0 0 1-4 3H14a4 4 0 0 1-4-3z" fill="#e3994a" ${OL2}/>
    <rect x="9.6" y="15.6" width="24.8" height="4" rx="2" fill="#7a3f24"/>
    <path d="M9 15.4l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2" stroke="#7fd29b" stroke-width="2" fill="none"/>
    <path d="M12 14.4h20l-3 3.4z" fill="#ffd84d"/>
    <path d="M10 14.2a12 8 0 0 1 24 0z" fill="#f2b45a" ${OL2}/>${[[16, 10], [21, 8.4], [27, 10], [24, 11.4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".9" ry=".55" fill="#fff6d8"/>`).join("")}`],
  ["brochetas", "Brochetitas", "parrilla", 4, "#e8513f", "plato", `
    ${[14, 21].map((y, i) => `<path d="M5 ${y}h34" stroke="#b07a4a" stroke-width="1.6" stroke-linecap="round"/>${[["#e8513f", 0], ["#7fd29b", 6], ["#9a4a2c", 12], ["#ffd84d", 18], ["#e8513f", 24]].map(([c, dx]) => `<rect x="${8 + dx + i * 2}" y="${y - 3}" width="5" height="6" rx="1.6" fill="${c}" ${OL2}/>`).join("")}`).join("")}`],
  ["palomitas", "Palomitas", "micro", 3, "#fff6d8", "nada", `
    <path d="M10 10h24l-3 18H13z" fill="#fff" ${OL2}/><path d="M14 10l1.4 18M20 10v18M26 10l-.6 18M31 10l-1.4 18" stroke="#ff5c7a" stroke-width="2.6"/>
    ${[[12, 9], [17, 7], [22, 6], [27, 7], [32, 9], [15, 4.6], [20, 3.4], [25, 3.8], [29, 5.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff6d8" ${OL2}/>`).join("")}`],
  ["licuado", "Licuado de fresa", "licuadora", 3, "#ff9cbf", "nada", `
    <path d="M13 6h18l-2.4 21h-13.2z" fill="#fff" fill-opacity=".7" ${OL2}/><path d="M13.8 11h16.4l-1.8 15.6h-12.8z" fill="#ff9cbf"/>
    <ellipse cx="22" cy="11" rx="8.2" ry="1.8" fill="#ffc4d8"/><path d="M25 11l5-10" stroke="#8fd0ff" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="14" cy="7" r="3" fill="#ff5c6c"/><path d="M14 4.6l1-1.4" stroke="#57b884" stroke-width="1.3"/>`],
];

export const RECETAS = {};
for (const [k, n, en, s, color, base, comida] of LISTA) RECETAS[k] = { k, n, en, ms: s * 1000, color, base, comida, horno: en === "horno" };
export const recetasDe = (en) => Object.values(RECETAS).filter((r) => (Array.isArray(en) ? en.includes(r.en) : r.en === en));
export const baseDe = (r) => BASES[r.base] || "";
/** El platillo completo (para la mano, el panel y lo servido en la mesa). */
export const arteReceta = (r) => `<svg viewBox="0 0 44 30" aria-hidden="true">${baseDe(r)}${r.comida}</svg>`;
