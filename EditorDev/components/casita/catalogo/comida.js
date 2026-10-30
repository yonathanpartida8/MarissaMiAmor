/**
 * Lo que un monito puede traer en la mano (sale del refri, la estufa, el asador, el librero, el buzón…).
 * Lo de comer se come con «Comer»; lo demás se puede regalar a tu amorcito.
 */
import { svg, OL2, corazon, estrella } from "./arte.js";

const s = (cuerpo) => svg(40, 40, cuerpo);
export const COSAS_MANO = {
  manzana: { n: "Manzanita", comible: true, arte: s(`<circle cx="20" cy="24" r="13" fill="#ff5c6c" ${OL2}/><path d="M20 12q2-8 8-8" stroke="#8a5a3b" stroke-width="2.5" fill="none"/><path d="M22 10c4-4 10-2 10-2-2 4-6 6-10 2z" fill="#7fd29b"/><circle cx="15" cy="20" r="3" fill="#fff" opacity=".5"/>`) },
  hotcakes: { n: "Hotcakes", comible: true, arte: s(`<ellipse cx="20" cy="34" rx="17" ry="4" fill="#fff" ${OL2}/>${[28, 22, 16].map((y) => `<ellipse cx="20" cy="${y}" rx="14" ry="5" fill="#f2b45a" ${OL2}/>`).join("")}<path d="M10 14q10 6 20 0" stroke="#c46a2a" stroke-width="3" fill="none"/><circle cx="20" cy="9" r="4" fill="#ff5c6c"/><path d="M20 5l2-3" stroke="#7fd29b" stroke-width="2"/>`) },
  cafe: { n: "Cafecito", comible: true, arte: s(`<path d="M8 14h20v14a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#fff" ${OL2}/><path d="M28 18h3a4 4 0 0 1 0 8h-3" stroke="#fff" stroke-width="3" fill="none"/><ellipse cx="18" cy="15" rx="9" ry="2.5" fill="#8a5a3b"/>${corazon(18, 26, 0.5, "#ff86b0")}<path d="M14 9c-2-3 2-4 0-7M20 9c-2-3 2-4 0-7" stroke="#d9cfc6" stroke-width="2" fill="none"/>`) },
  tostada: { n: "Pan tostado", comible: true, arte: s(`<path d="M8 18a8 8 0 0 1 4-12h16a8 8 0 0 1 4 12v16H8z" fill="#e7a95c" ${OL2}/><path d="M12 18a5 5 0 0 1 3-8h10a5 5 0 0 1 3 8v12H12z" fill="#f6d39a"/>${corazon(20, 22, 0.55, "#ff5c93")}`) },
  elote: { n: "Elotito", comible: true, arte: s(`<path d="M14 34c-6-8-4-22 6-30 6 8 8 20 2 30z" fill="#ffd84d" ${OL2}/>${[10, 16, 22, 28].map((y) => `<path d="M12 ${y}h14" stroke="#e8b828" stroke-width="1.5"/>`).join("")}<path d="M14 34c-6-2-10-10-8-18 4 4 6 10 8 18zM22 34c6-2 10-10 8-18-4 4-6 10-8 18z" fill="#94dfbd" ${OL2}/>`) },
  helado: { n: "Helado", comible: true, arte: s(`<path d="M12 20l8 18 8-18z" fill="#e7a95c" ${OL2}/><circle cx="20" cy="16" r="9" fill="#ffb3cf" ${OL2}/><circle cx="20" cy="9" r="6" fill="#bfe8ff" ${OL2}/><circle cx="23" cy="4" r="2.5" fill="#ff5c6c"/>`) },
  sandia: { n: "Sandía", comible: true, arte: s(`<path d="M4 14a16 16 0 0 0 32 0z" fill="#7fd29b" ${OL2}/><path d="M7 14a13 13 0 0 0 26 0z" fill="#ff6b81"/>${[12, 20, 28].map((x) => `<ellipse cx="${x}" cy="20" rx="1.4" ry="2" fill="#3a2a35"/>`).join("")}`) },
  galleta: { n: "Galletita", comible: true, arte: s(`<circle cx="20" cy="20" r="14" fill="#e7b46c" ${OL2}/>${[[14, 16], [24, 14], [18, 26], [27, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#6b4632"/>`).join("")}`) },
  libro: { n: "Libro", arte: s(`<rect x="8" y="6" width="24" height="30" rx="3" fill="#c9a7ff" ${OL2}/><rect x="11" y="6" width="3" height="30" fill="#a985e8"/>${corazon(23, 19, 0.7, "#fff")}`) },
  flor: { n: "Ramito de flores", arte: s(`<path d="M20 38V20M20 26l-8-8M20 26l8-8" stroke="#57b884" stroke-width="2.5"/>${[[20, 12, "#ff9cbf"], [11, 16, "#ffd84d"], [29, 16, "#c39bff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" ${OL2}/><circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join("")}<path d="M14 30l6 8 6-8z" fill="#ff86b0"/>`) },
  carta: { n: "Cartita de amor", arte: s(`<rect x="4" y="10" width="32" height="22" rx="3" fill="#fff" ${OL2}/><path d="M4 12l16 11 16-11" stroke="#ff9cbf" stroke-width="2" fill="none"/>${corazon(20, 25, 0.6, "#ff5c93")}`) },
  estrellita: { n: "Estrellita", arte: s(estrella(20, 20, 15, "#ffd84d", OL2)) },
};
