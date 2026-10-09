/**
 * ICONOS — un solo juego de iconos para todo el editor.
 *
 * Son SVG de líneas en una cuadrícula de 24 × 24, todos con el mismo grosor
 * y las mismas puntas redondas, y pintan con `currentColor`. No dependen de
 * los emojis del sistema (que se ven distintos en Android y en iPhone) y no
 * se descarga nada.
 *
 *   ico("texto")            → el <svg> como texto (para innerHTML)
 *   icoEt("texto", "Texto") → icono con su nombre debajo (riel, piezas)
 */
const T = (d) => `<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const P = {
  // Secciones
  cursor: '<path d="M5 3l13 7.2-5.6 1.6L10 18z"/><path d="M12.4 11.8l4.6 6.2"/>',
  borrador: '<path d="M15.5 3.5l5 5L10 19H5.5L2.5 16z"/><path d="M8.5 10.5l5 5M13 21h8"/>',
  tuerca: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.6 2.3 2.7-.8.5 2.8 2.7.9-.9 2.7 2.2 1.7-2.2 1.7.9 2.7-2.7.9-.5 2.8-2.7-.8L12 21.2l-1.6-2.3-2.7.8-.5-2.8-2.7-.9.9-2.7L3.2 12l2.2-1.7-.9-2.7 2.7-.9.5-2.8 2.7.8z"/>',
  musica: '<path d="M9 18V5.5l11-2.2v12.4"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="15.7" r="2.6"/>',
  musicaNo: '<path d="M9 18V5.5l11-2.2v12.4"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="15.7" r="2.6"/><path d="M3 3l18 18"/>',
  rapido: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  paginas: '<rect x="5" y="3" width="12" height="16" rx="2"/><path d="M8 7h6M8 11h6M8 15h3"/><path d="M19 7v12a2 2 0 0 1-2 2H8"/>',
  elementos: '<circle cx="8" cy="8" r="4"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><path d="M16.5 3l3.5 6h-7z"/><path d="M4 20l4-6 4 6z"/>',
  texto: '<path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/>',
  imagen: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8.5 8.5"/>',
  video: '<rect x="3" y="5.5" width="13" height="13" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/>',
  audio: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  efectos: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9zM5.5 15.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/>',
  animar: '<path d="M4 17c3-8 6-10 9-10"/><circle cx="16" cy="7" r="3"/><path d="M4 12h3M5 8h2"/><path d="M14 17h6M17 14v6"/>',
  transiciones: '<rect x="3" y="5" width="10" height="14" rx="2"/><path d="M16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/><path d="M9 12h9M15 9l3 3-3 3"/>',
  interactivo: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.5 15.6a1.6 1.6 0 0 1 2.3-2.2L9 15"/>',
  componentes: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M17 3v8M13 7h8"/><circle cx="7" cy="17" r="4"/>',
  html: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  cubo: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>',
  diseno: '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.4 1.2-2.6-.9-1.3 0-2.9 1.6-2.9H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/>',
  herramientas: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  capas: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
  tiempo: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 4v5M14 13h4M6 13h5M9 17h7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  // Básicos
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  puntos: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  ok: '<path d="M4.5 12.5l5 5 10-11"/>',
  izquierda: '<path d="M15 5l-7 7 7 7"/>',
  derecha: '<path d="M9 5l7 7-7 7"/>',
  arriba: '<path d="M5 15l7-7 7 7"/>',
  abajo: '<path d="M5 9l7 7 7-7"/>',
  volver: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  aviso: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  // Historia y archivo
  deshacer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  rehacer: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  guardar: '<path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2z"/><path d="M8 3v5h7V3M7 21v-7h10v7"/>',
  exportar: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  subir: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  carpeta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  nuevo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  biblioteca: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M15.5 5.2l3.8-1 3.2 15.3-3.8 1z"/>',
  // Reproducir
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  pausa: '<path d="M8 5v14M16 5v14"/>',
  parar: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  inicio: '<path d="M6 5v14M18 5l-9 7 9 7z"/>',
  final: '<path d="M18 5v14M6 5l9 7-9 7z"/>',
  retroceder: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
  avanzar: '<path d="M13 6l6 6-6 6M5 6l6 6-6 6"/>',
  bucle: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11V9.5a4 4 0 0 1 4-4h12"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v1.5a4 4 0 0 1-4 4H4"/>',
  // Editar
  editar: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  lapiz: '<path d="M3 21c2.5-1 4-3.5 6-6l9.5-9.5a2.1 2.1 0 0 0-3-3L6 12c-2.5 2-5 3.5-6 6"/><path d="M14 6l3 3"/>',
  duplicar: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 16H4.5A1.5 1.5 0 0 1 3 14.5v-10A1.5 1.5 0 0 1 4.5 3h10A1.5 1.5 0 0 1 16 4.5V5"/>',
  copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  pegar: '<path d="M9 4h6v3H9z"/><path d="M15 5.5h2a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h2"/>',
  borrar: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  recortar: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  cambiar: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
  tijeras: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 8.2L20 20M8.2 15.8L20 4"/>',
  enlazar: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  desenlazar: '<path d="M15 9.5l1.5-1.5a3.5 3.5 0 0 0-5-5L10 4.5M9 14.5L7.5 16a3.5 3.5 0 0 0 5 5l1.5-1.5"/><path d="M4 4l16 16"/>',
  candado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  abierto: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 7.8-1.3"/>',
  ojo: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/>',
  ojoNo: '<path d="M10 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.6 3.4M6.6 6.6A15.6 15.6 0 0 0 2.5 12s3.5 7 9.5 7a9 9 0 0 0 5-1.4"/><path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  agarre: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  mano: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.6 15.4a1.6 1.6 0 0 1 2.4-2.2L7 13.3"/>',
  girar: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5"/><path d="M20 3.5v5h-5"/>',
  mover: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  tamano: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  proporcion: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10v4h4M17 14v-4h-4"/>',
  recuperar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  limpiar: '<path d="M14.5 3.5l6 6M9 9l6 6M3 21l6-1.5L19.5 9 15 4.5 4.5 15z"/>',
  estrella: '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  corazon: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
  // Elementos
  forma: '<rect x="3.5" y="11" width="9.5" height="9.5" rx="1.5"/><circle cx="16" cy="8" r="5"/>',
  dibujo: '<path d="M12 7.5a3 3 0 1 1 3-3 3 3 0 0 1 3 3 3 3 0 1 1-3 3 3 3 0 0 1-3 3 3 3 0 1 1-3-3 3 3 0 0 1-3-3 3 3 0 1 1 3 3z"/><circle cx="12" cy="7.5" r="1.4"/><path d="M12 13.5V21M12 17c-2.5 0-4-1.5-4.5-3.5M12 18.5c2.2 0 3.6-1.2 4.2-3"/>',
  boton: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M8 12h8"/>',
  album: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  carrusel: '<rect x="6" y="5" width="12" height="14" rx="2"/><path d="M3 7v10M21 7v10"/>',
  pagina: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  marco: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  tarjeta: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19M6 15h5"/>',
  nota: '<path d="M4 4h16v11l-5 5H4z"/><path d="M15 20v-5h5M8 9h8M8 13h4"/>',
  sobre: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  boleto: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.4"/>',
  polaroid: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><rect x="7" y="6" width="10" height="9"/>',
  sticker: '<path d="M20 12A8 8 0 1 1 12 4h3a5 5 0 0 0 5 5z"/><path d="M15 4v2a3 3 0 0 0 3 3h2"/>',
  // Texto
  alinIzq: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  alinCentro: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alinDer: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  alinJust: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  espaciado: '<path d="M10 6h10M10 12h10M10 18h10M4.5 4v16M2.5 6.5L4.5 4l2 2.5M2.5 17.5l2 2.5 2-2.5"/>',
  fuente: '<path d="M4 20L10 4h1l6 16M6.5 14h8"/><path d="M17 20h4"/>',
  // Posición
  alinearH: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  izqA: '<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4" rx="1"/><rect x="7" y="14" width="7" height="4" rx="1"/>',
  derA: '<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4" rx="1"/><rect x="10" y="14" width="7" height="4" rx="1"/>',
  arribaA: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1"/><rect x="14" y="7" width="4" height="7" rx="1"/>',
  centroV: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
  abajoA: '<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1"/><rect x="14" y="10" width="4" height="7" rx="1"/>',
  alFrente: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  alFondo: '<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v11a1 1 0 0 1-1 1H8"/>',
  subirCapa: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  bajarCapa: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  repartir: '<path d="M4 3v18M20 3v18"/><rect x="9" y="7" width="6" height="10" rx="1"/>',
  // Apariencia
  opacidad: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" fill-opacity=".35"/>',
  filtros: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  borde: '<rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 2.6"/>',
  gota: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z"/>',
  sombra: '<rect x="3.5" y="3.5" width="12" height="12" rx="2"/><path d="M19 8.5v9a2 2 0 0 1-2 2H8.5"/>',
  // Sonido e interacción
  sonido: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.5a7.8 7.8 0 0 1 0 11"/>',
  silencio: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  toque: '<circle cx="12" cy="9" r="3"/><path d="M12 9v12M8.5 4.8a6 6 0 0 1 7 0"/>',
  enlace: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  // Lienzo
  iman: '<path d="M5 4v8a7 7 0 0 0 14 0V4h-4.5v8a2.5 2.5 0 0 1-5 0V4z"/><path d="M5 8h4.5M14.5 8H19"/>',
  rejilla: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  regla: '<path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7 12.5l1.5 1.5M10 9.5l2 2M13 6.5l1.5 1.5"/>',
  zoomMas: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3M11 8v6M8 11h6"/>',
  zoomMenos: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3M8 11h6"/>',
  ajustar: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
  telefono: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  tableta: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  horizontal: '<rect x="2.5" y="6.5" width="19" height="11" rx="2.5"/><path d="M18.5 11v2"/>',
  pantalla: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  automatico: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 3v4M3 8h4M16 21v-4M21 16h-4"/><path d="M9 15l3-7 3 7M10 13h4"/>',
  // 3D y luz
  luz: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  orbita: '<ellipse cx="12" cy="12" rx="9.5" ry="4"/><circle cx="12" cy="12" r="2.5"/><path d="M19 8.5l2 .5-.6 2"/>',
  esfera: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><path d="M12 3a12 12 0 0 1 0 18"/>',
  // Fase 2
  gif: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 9.5H8a1.5 1.5 0 0 0-1.5 1.5v2A1.5 1.5 0 0 0 8 14.5h2V12H9M12.8 9.5v5M15.6 14.5v-5h2.9M15.6 12h2.1"/>',
  foco: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  onda: '<path d="M3 12h1M6 9v6M9 6v12M12 9v6M15 4v16M18 8v8M21 11v2"/>',
  volumen: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  exposicion: '<circle cx="12" cy="12" r="9"/><path d="M5.6 18.4L18.4 5.6"/><path d="M7 9.5h4M9 7.5v4M13.5 15h4"/>',
  contraste: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  temperatura: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  salir: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  fondo: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><path d="M15.5 6.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
  varita: '<path d="M4 20L15 9l-1.5-1.5L2.5 18.5z"/><path d="M17 3v3M20 6h-3M19.6 3.4l-1.4 1.4M17 10v2M12 4h2"/>',
  refrescar: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  ver: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
};// Nombres que se usan igual (para leer más fácil en cada sitio).
P.fotos = P.imagen;
P.ajustes = P.herramientas;
P.mas3 = P.puntos;
P.letra = P.fuente;
P.musica = P.audio;
P.codigo = P.html;
P.saturacion = P.gota;
P.brillo = P.luz;

P.bloques = '<rect x="3.5" y="3.5" width="17" height="6" rx="1.5"/><rect x="3.5" y="12" width="7.5" height="8.5" rx="1.5"/><rect x="13" y="12" width="7.5" height="3.6" rx="1.2"/><rect x="13" y="17" width="7.5" height="3.5" rx="1.2"/>';
P.zonas = '<rect x="3" y="3.5" width="11" height="8.5" rx="1.5" stroke-dasharray="2.6 2"/><rect x="10" y="12" width="11" height="8.5" rx="1.5" stroke-dasharray="2.6 2"/><circle cx="15.5" cy="16.3" r="1.7"/>';
P.rotar = P.girar; P.seleccionar = P.cursor; P.interactuar = P.toque;
P.fuera = '<rect x="7" y="7" width="10" height="10" rx="1.5" stroke-dasharray="2 2"/><path d="M3 3l4 4M21 3l-4 4M3 21l4-4M21 21l-4-4"/>';
export const ICONOS = Object.fromEntries(Object.entries(P).map(([k, d]) => [k, T(d)]));

export const ico = (n) => ICONOS[n] || "";

/** Un icono con su nombre debajo (para el riel y las piezas). */
export const icoEt = (n, nombre) => `${ico(n)}<span>${nombre}</span>`;
