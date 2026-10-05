/*
 * LOS ICONOS — dibujados a trazo, sin emojis.
 *
 * Los emojis se ven distinto en cada teléfono (y algunos ni existen en los
 * viejos). Estos son trazos SVG de 24×24 que toman el color del botón
 * (`currentColor`), así que se ven igual en todos lados y van con la ciudad.
 */
const T = {
  golpe: '<path d="M7 11V7.5a1.6 1.6 0 0 1 3.2 0V10m0-3a1.6 1.6 0 0 1 3.2 0v3m0-2.4a1.6 1.6 0 0 1 3.2 0V11m0-1.4a1.5 1.5 0 0 1 3 0v4.2c0 3.6-2.6 6.2-6.2 6.2h-1.4c-2.6 0-4.4-1.2-5.6-3.4L5 13.8c-.7-1.3.9-2.6 2-1.6l1.2 1.1"/>',
  saltar: '<path d="M12 19V6m-5 5 5-5 5 5"/><path d="M6 21h12" opacity=".55"/>',
  volar: '<path d="M12 8c-2-3.2-5.8-4.2-9-3 1 3.4 3.6 5.4 7 5.6M12 8c2-3.2 5.8-4.2 9-3-1 3.4-3.6 5.4-7 5.6"/><path d="M12 8v9m-3-2 3 3 3-3"/>',
  bajar: '<path d="M12 5v13m-5-5 5 5 5-5"/>',
  pareja: '<path d="M8.5 19.5S3 16 3 11.2A3.6 3.6 0 0 1 9.5 9a3.6 3.6 0 0 1 4.4-1"/><path d="M15.5 20.5s-5.5-3.5-5.5-8.3A3.6 3.6 0 0 1 16.5 10a3.6 3.6 0 0 1 6.5 2.2c0 4.8-5.5 8.3-5.5 8.3z" transform="translate(-2 -1)"/>',
  dios: '<path d="M12 2.8l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  mas: '<circle cx="5.5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor"/>',
  misterios: '<path d="M7 4h10.5a2 2 0 0 1 0 4H17v10a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18v-1h9.5v1a2.5 2.5 0 0 0 2.5 2.5"/><path d="M7 4a2 2 0 0 0-2 2v11M9 9h5M9 12.5h5"/>',
  ventana: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M12 3.5v17M5 12h14"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  tarde: '<path d="M7 16a5 5 0 0 1 10 0"/><path d="M3 16h18M5 19.5h14M12 5v3M4.6 9.6l1.8 1.8M19.4 9.6l-1.8 1.8"/>',
  luna: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  camara: '<path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z"/><circle cx="12" cy="13.3" r="3.3"/>',
  dron: '<circle cx="5.5" cy="6.5" r="2.5"/><circle cx="18.5" cy="6.5" r="2.5"/><path d="M7.5 8.5 10 11h4l2.5-2.5M10 11v3.5a2 2 0 0 0 4 0V11"/>',
  libro: '<path d="M3.5 5.5c3-1.2 5.8-1 8.5.8 2.7-1.8 5.5-2 8.5-.8v13c-3-1.2-5.8-1-8.5.8-2.7-1.8-5.5-2-8.5-.8z"/><path d="M12 6.3v13"/>',
  // los poderes
  rayo: '<path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z"/>',
  levantar: '<path d="M6 19.5h12l-1.6-5.2a2 2 0 0 0-1.9-1.4h-5a2 2 0 0 0-1.9 1.4z"/><path d="M12 10V3m-3 3 3-3 3 3"/>',
  agarrar: '<path d="M7 12V6.5a1.4 1.4 0 0 1 2.8 0V11m0-5.8a1.4 1.4 0 0 1 2.8 0V11m0-4.6a1.4 1.4 0 0 1 2.8 0V12m0-3.4a1.4 1.4 0 0 1 2.8 0v5.6c0 3.4-2.6 6.3-6 6.3h-1c-2.4 0-4-1-5.3-3L5 14.6c-.6-1.1.7-2.2 1.7-1.4L7 13.6"/>',
  carga: '<path d="M12 2.5l1.6 5 4.8-2.2-2.2 4.8 5 1.6-5 1.6 2.2 4.8-4.8-2.2-1.6 5-1.6-5-4.8 2.2 2.2-4.8-5-1.6 5-1.6-2.2-4.8 4.8 2.2z"/>',
  terremoto: '<path d="M2.5 15h5l2-3 2.5 6 2.5-9 2 6h5"/><path d="M4 20.5h16" opacity=".55"/>',
  tsunami: '<path d="M2.5 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5"/><path d="M4 13.5C4 8 8.6 4.5 13.5 5c-2.6 1.2-3.6 3.6-2.6 5.8 1 2.2 3.6 2.6 5.6 1.4"/>',
  lluvia: '<path d="M7 15.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.4 1.6 3.3 3.3 0 0 1-.7 6.4z"/><path d="M8.5 18.5 7.5 21M12.5 18.5l-1 2.5M16.5 18.5l-1 2.5"/>',
  tornado: '<path d="M3.5 5h17M5.5 9h13M8 13h9M10 17h5.5M11.5 21h3"/>',
  meteoros: '<circle cx="15.5" cy="15.5" r="4.5"/><path d="M12.2 12.2 4 4M14 10.5 8 4.5M10.5 14l-6-6"/>',
  corazones: '<path d="M12 20.5S3.5 15.5 3.5 9.5A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.5 2.3c0 6-8.5 11-8.5 11z"/>',
  tiempo: '<path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9"/>',
  ovni: '<ellipse cx="12" cy="12.5" rx="9.5" ry="3"/><path d="M7.5 10.5a4.5 4.5 0 0 1 9 0"/><path d="M8 18l-1 2.5M16 18l1 2.5M12 18v3" opacity=".7"/>',
  // las acciones del momento y lo que hacemos juntos
  puerta: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17"/><circle cx="14.6" cy="12.5" r=".9" fill="currentColor"/>',
  persona: '<circle cx="12" cy="5" r="2.3"/><path d="M12 7.8v7.2m0-6 4 2.6M12 9l-4 2.6M12 15l-3 6m3-6 3 6"/>',
  burger: '<path d="M4.5 10.5a7.5 5 0 0 1 15 0z"/><path d="M3.5 13.5h17M4.5 16.5h15a0 0 0 0 1 0 0 2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5z"/>',
  banca: '<path d="M4 9h16M4 12.5h16M5.5 12.5V19M18.5 12.5V19M4 16h16"/><path d="M5.5 9V6M18.5 9V6" opacity=".6"/>',
  ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  coche: '<path d="M4 16.5V12l2-4.5h12l2 4.5v4.5z"/><path d="M4 12h16"/><circle cx="7.5" cy="16.8" r="1.8"/><circle cx="16.5" cy="16.8" r="1.8"/>',
  patita: '<ellipse cx="12" cy="16" rx="4.2" ry="3.4"/><circle cx="6.5" cy="10.5" r="1.7"/><circle cx="10" cy="7" r="1.7"/><circle cx="14" cy="7" r="1.7"/><circle cx="17.5" cy="10.5" r="1.7"/>',
  abrazo: '<circle cx="9" cy="6" r="2.2"/><circle cx="15" cy="6" r="2.2"/><path d="M5 20v-5.5A4 4 0 0 1 9 10.5h6a4 4 0 0 1 4 4V20M8 14.5l4 2.5 4-2.5"/>',
  selfie: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><circle cx="12" cy="9.5" r="2.4"/><path d="M9.5 15.5a3 3 0 0 1 5 0"/>',
  baile: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  helado: '<path d="M8 10.5h8l-4 11z"/><path d="M8 10.5a4 4 0 1 1 8 0"/><path d="M10 7.2a2.2 2.2 0 0 1 4 0"/>',
  flor: '<circle cx="12" cy="8" r="2"/><path d="M12 5.2c0-2.4 3.2-2.4 3.2 0M14.8 8c2.4 0 2.4 3.2 0 3.2M12 10.8c0 2.4-3.2 2.4-3.2 0M9.2 8c-2.4 0-2.4-3.2 0-3.2"/><path d="M12 11v10M12 17c-2-2.5-4.5-2.5-5.5-1.5M12 15c2-2 4-2 5-1"/>',
  carta: '<rect x="3.5" y="6" width="17" height="12.5" rx="1.5"/><path d="m4 7 8 6 8-6"/><path d="M12 15.5s-1.6-1-1.6-2.1a.9.9 0 0 1 1.6-.5.9.9 0 0 1 1.6.5c0 1.1-1.6 2.1-1.6 2.1z" fill="currentColor"/>',
  empuje: '<path d="M4 12h3M9 7.5c2 2.6 2 6.4 0 9M13 5c3.2 4 3.2 10 0 14M17 3c4.4 5.2 4.4 12.8 0 18"/>',
  escudo: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/><path d="M9.2 12.2l2 2 3.8-4"/>',
  linterna: '<path d="M8 6.5h8l1.3 10H6.7z"/><path d="M9.5 4h5M12 4V2.5M9 19.5h6M10.5 16.5v3M13.5 16.5v3"/><path d="M12 9.5c1 1.2 1 2.6 0 3.6-1-1-1-2.4 0-3.6z" fill="currentColor"/>',
  estrella: '<path d="M12 3.5l2.4 5 5.4.7-4 3.7 1 5.4L12 15.7l-4.8 2.6 1-5.4-4-3.7 5.4-.7z"/>',
  fuegos: '<path d="M12 21v-7M12 11.5V9M12 6.5V3M7.8 7.8 6 6M16.2 7.8 18 6M8.5 12H6M18 12h-2.5M7.8 16.2 6 18M16.2 16.2 18 18"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  cielo: '<path d="M14.5 13.5A6 6 0 0 1 8.5 5.5a6 6 0 1 0 6 8z"/><path d="M18 3.5l.7 1.8 1.8.7-1.8.7L18 8.5l-.7-1.8-1.8-.7 1.8-.7zM19 14l.5 1.2 1.2.5-1.2.5L19 17.4l-.5-1.2-1.2-.5 1.2-.5z"/>',
};

/** El SVG de un icono (o nada si no existe). */
export function icono(nombre, clase = "ico") {
  const p = T[nombre];
  return p ? `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : "";
}

/* Para los textos que traen su emoji al principio («🪑 Sentarse»): se le
   quita y se pone el icono que toca según la palabra. */
const POR_PALABRA = { helado: "helado", flores: "flor", cartita: "carta", "canción": "baile", bajar: "puerta", pararse: "persona", burger: "burger", sentarse: "banca", sentarnos: "banca", mirar: "ojo", subir: "coche", subirnos: "coche", acariciar: "patita", abrazo: "abrazo", selfie: "selfie", bailar: "baile", ver: "cielo", "pétalos": "flor", farolitos: "linterna", fuegos: "fuegos", "luciérnagas": "estrella" };
export function sinEmoji(txt) { return String(txt).replace(/^[^\p{L}\p{N}]+/u, "").trim(); }
export function conIcono(txt) {
  const limpio = sinEmoji(txt), palabra = limpio.split(/\s+/)[0].toLowerCase();
  return icono(POR_PALABRA[palabra]) + `<span>${limpio}</span>`;
}
