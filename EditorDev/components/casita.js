/**
 * NUESTRA CASITA (Fase 52) — un jueguito tipo Toca World, en 2D, para los dos.
 *
 * La casita es una tira de cuartos que se desliza de lado (jardín, sala, cocina, recámara y baño), lindos,
 * animados y con su día o su noche según la hora. Cada quien tiene su monito (con la ropa y el peinado que
 * quiera; de entrada, según lo que eligió en su perfil: mujer u hombre) y tu amorcito está ahí contigo: lo
 * que hace su monito lo ves en tiempo real (camina, se sienta, se duerme, se baña, se columpia…).
 *
 * Se juega tocando: tocar el piso camina hasta ahí; tocar un mueble lo usa (el sillón y las sillas para
 * sentarse, la cama para dormir, la tina para bañarse, el refri para comer, la tele, las lámparas, las
 * cortinas…); a tu monito lo puedes cargar con el dedo y soltarlo donde quieras (si lo sueltas en un mueble,
 * lo usa). El ropero y el espejo abren el vestidor. «Decorar» cambia los colores de cada cuarto y pone
 * cositas que se acomodan con el dedo. Todo lo de la casa lo comparten los dos.
 *
 * Todo es DOM y SVG (nada que descargar); las animaciones son de CSS (transform/opacity) y se aquietan
 * solas en reposo, como el resto de la app.
 */
import { el, aviso } from "./ui.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import { vibrar } from "../integraciones/plataforma.js";
import { sinMovimiento as reducido } from "./transiciones.js";

const W = 420, H = 560, SUELO = 528;   // cada cuarto mide W × H (unidades del mundo); los pies van en SUELO
const CUARTOS = [
  { k: "jardin", n: "Jardín", pared: "#bfe6ff", patron: "liso", piso: "pasto" },
  { k: "sala", n: "Sala", pared: "#ffe1ec", patron: "rayas", piso: "madera" },
  { k: "cocina", n: "Cocina", pared: "#e6f6ea", patron: "puntos", piso: "mosaico" },
  { k: "recamara", n: "Recámara", pared: "#ece3ff", patron: "corazones", piso: "alfombra" },
  { k: "bano", n: "Baño", pared: "#dff3fb", patron: "puntos", piso: "mosaico" },
];
const PAREDES = ["#ffe1ec", "#ffd6e0", "#fde8d0", "#fff4c8", "#e6f6ea", "#dff3fb", "#ece3ff", "#f3e7da", "#ffffff", "#ffc9de"];
const PATRONES = [["liso", "Liso"], ["rayas", "Rayitas"], ["puntos", "Puntitos"], ["corazones", "Corazones"]];
const PISOS = [["madera", "Madera"], ["mosaico", "Mosaico"], ["alfombra", "Alfombrita"], ["pasto", "Pasto"]];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─────────────── Los dibujitos (SVG) ─────────────── */
const svg = (w, h, cuerpo, clase = "") => `<svg viewBox="0 0 ${w} ${h}" class="${clase}" aria-hidden="true">${cuerpo}</svg>`;
const ARTE = {
  sofa: svg(200, 110, '<rect x="8" y="10" width="184" height="62" rx="26" fill="#ff9cbf"/><rect x="0" y="44" width="36" height="52" rx="16" fill="#ff86b0"/><rect x="164" y="44" width="36" height="52" rx="16" fill="#ff86b0"/><rect x="26" y="52" width="72" height="34" rx="14" fill="#ffc1d6"/><rect x="102" y="52" width="72" height="34" rx="14" fill="#ffc1d6"/><rect x="18" y="82" width="164" height="16" rx="8" fill="#f06c9b"/><rect x="26" y="96" width="10" height="14" rx="3" fill="#a0673f"/><rect x="164" y="96" width="10" height="14" rx="3" fill="#a0673f"/><path d="M98 30c-4-6-14-4-12 4 1 5 12 11 12 11s11-6 12-11c2-8-8-10-12-4z" fill="#fff" opacity=".7"/>'),
  tele: svg(120, 140, '<rect x="52" y="96" width="16" height="22" fill="#9a8a96"/><rect x="22" y="116" width="76" height="22" rx="8" fill="#c9a98a"/><rect x="2" y="4" width="116" height="92" rx="14" fill="#4a3f52"/><rect class="ca-tele-pantalla" x="10" y="12" width="100" height="76" rx="8" fill="#2c2735"/><g class="ca-tele-show"><circle cx="38" cy="52" r="12" fill="#ff86b0"/><circle cx="62" cy="40" r="9" fill="#ffd36e"/><circle cx="84" cy="58" r="11" fill="#86d6f2"/><path d="M60 70c-4-6-14-4-12 4 1 5 12 11 12 11s11-6 12-11c2-8-8-10-12-4z" fill="#fff"/></g>'),
  lampara: svg(60, 180, '<rect x="27" y="58" width="6" height="110" fill="#b39a8a"/><ellipse cx="30" cy="172" rx="22" ry="6" fill="#b39a8a"/><path d="M8 58L18 10h24l10 48z" fill="#ffe08a"/><path class="ca-luz-cono" d="M8 58l-40 120h124l-40-120z" fill="#fff3b0" opacity=".35"/>'),
  planta: svg(70, 110, '<g class="ca-hojas"><path d="M35 62C20 52 8 34 14 18c14 6 22 24 21 44z" fill="#6fcf97"/><path d="M35 62c15-10 27-28 21-44-14 6-22 24-21 44z" fill="#57b884"/><path d="M35 64C33 44 36 24 35 6c-8 14-10 36 0 58z" fill="#7fdba5"/></g><path d="M14 64h42l-6 44H20z" fill="#ff9e7a"/><rect x="10" y="60" width="50" height="10" rx="4" fill="#ff8862"/>'),
  alfombra: svg(220, 40, '<ellipse cx="110" cy="20" rx="108" ry="18" fill="#ffd0e2"/><ellipse cx="110" cy="20" rx="88" ry="12" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/>'),
  refri: svg(100, 200, '<rect x="4" y="4" width="92" height="192" rx="18" fill="#bfe8ff"/><rect x="4" y="66" width="92" height="4" fill="#9ccfee"/><rect x="78" y="22" width="6" height="30" rx="3" fill="#7fb6d8"/><rect x="78" y="86" width="6" height="40" rx="3" fill="#7fb6d8"/><g class="ca-refri-dentro"><rect x="10" y="74" width="80" height="114" rx="10" fill="#fffaf2"/><circle cx="30" cy="100" r="9" fill="#ff7a8a"/><rect x="48" y="90" width="24" height="18" rx="5" fill="#ffd36e"/><path d="M24 140l10-20 10 20z" fill="#ffb3cf"/><rect x="50" y="128" width="26" height="14" rx="6" fill="#a0d995"/><circle cx="36" cy="168" r="8" fill="#c39bff"/></g><path class="ca-refri-puerta" d="M4 70h92v108a18 18 0 0 1-18 18H22A18 18 0 0 1 4 178z" fill="#ccefff"/><circle cx="28" cy="30" r="6" fill="#ff86b0"/><path d="M50 26c-2-3-7-2-6 2 1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z" fill="#ff5c93"/>'),
  estufa: svg(110, 120, '<rect x="4" y="30" width="102" height="88" rx="10" fill="#f3e7da"/><rect x="16" y="56" width="78" height="46" rx="8" fill="#c9b6a6"/><rect x="4" y="22" width="102" height="12" rx="4" fill="#d9c7b8"/><g class="ca-olla"><rect x="28" y="2" width="54" height="24" rx="8" fill="#ff9e7a"/><rect x="22" y="6" width="8" height="5" rx="2" fill="#e07a5f"/><rect x="80" y="6" width="8" height="5" rx="2" fill="#e07a5f"/></g><g class="ca-vapor"><path d="M44 -6c-6-8 6-12 0-20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M62 -4c-6-8 6-12 0-20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></g><circle class="ca-fuego" cx="55" cy="28" r="5" fill="#ff8a3d"/>'),
  mesa: svg(140, 90, '<rect x="0" y="0" width="140" height="18" rx="9" fill="#d9a77a"/><rect x="14" y="16" width="10" height="72" rx="4" fill="#c18e62"/><rect x="116" y="16" width="10" height="72" rx="4" fill="#c18e62"/><circle cx="50" cy="-6" r="10" fill="#ff86b0"/><rect x="74" y="-14" width="22" height="14" rx="4" fill="#fff" stroke="#ffd0e2" stroke-width="3"/>'),
  silla: svg(56, 100, '<rect x="6" y="0" width="44" height="54" rx="12" fill="#ffc98b"/><rect x="0" y="50" width="56" height="12" rx="6" fill="#ffb066"/><rect x="6" y="60" width="7" height="40" rx="3" fill="#c18e62"/><rect x="43" y="60" width="7" height="40" rx="3" fill="#c18e62"/>'),
  cama: svg(230, 120, '<rect x="0" y="0" width="34" height="110" rx="14" fill="#c39bff"/><path d="M17 30c-5-8-17-5-15 5 1 6 15 14 15 14s14-8 15-14c2-10-10-13-15-5z" fill="#fff" opacity=".8"/><rect x="20" y="52" width="206" height="44" rx="18" fill="#fff"/><rect x="40" y="40" width="58" height="26" rx="12" fill="#ffd0e2"/><rect x="104" y="40" width="58" height="26" rx="12" fill="#e6dcff"/><path d="M90 58h136v26a14 14 0 0 1-14 14H90z" fill="#ff9cbf"/><path d="M90 58h136" stroke="#ffc1d6" stroke-width="6"/><rect x="24" y="94" width="10" height="24" rx="4" fill="#a0673f"/><rect x="212" y="94" width="10" height="24" rx="4" fill="#a0673f"/>'),
  buro: svg(70, 150, '<rect x="4" y="84" width="62" height="64" rx="10" fill="#e8c8a8"/><rect x="12" y="98" width="46" height="18" rx="5" fill="#f6dcc0"/><circle cx="35" cy="107" r="3" fill="#c18e62"/><rect x="31" y="34" width="8" height="50" fill="#b39a8a"/><path d="M14 36l8-30h26l8 30z" fill="#ffd36e"/><path class="ca-luz-cono" d="M14 36l-34 110h108l-34-110z" fill="#fff3b0" opacity=".32"/>'),
  ropero: svg(110, 200, '<rect x="4" y="4" width="102" height="192" rx="12" fill="#d9a7ff"/><rect x="12" y="14" width="42" height="170" rx="8" fill="#e6c8ff"/><rect x="56" y="14" width="42" height="170" rx="8" fill="#e6c8ff"/><circle cx="48" cy="100" r="4" fill="#9b6be0"/><circle cx="62" cy="100" r="4" fill="#9b6be0"/><path d="M33 40c-3-5-11-3-10 3 1 4 10 9 10 9s9-5 10-9c1-6-7-8-10-3z" fill="#fff" opacity=".8"/><path d="M77 40c-3-5-11-3-10 3 1 4 10 9 10 9s9-5 10-9c1-6-7-8-10-3z" fill="#fff" opacity=".8"/>'),
  espejo: svg(80, 140, '<ellipse cx="40" cy="56" rx="34" ry="50" fill="#c39bff"/><ellipse cx="40" cy="56" rx="27" ry="42" fill="#e8f7ff"/><path d="M26 34l10-10M24 50l20-20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="34" y="104" width="12" height="34" rx="4" fill="#b39a8a"/>'),
  tina: svg(190, 110, '<rect x="0" y="22" width="190" height="14" rx="7" fill="#ffffff"/><path d="M8 34h174v28a40 40 0 0 1-40 40H48A40 40 0 0 1 8 62z" fill="#ffffff" stroke="#bfe8ff" stroke-width="4"/><rect x="14" y="30" width="162" height="12" rx="6" fill="#86d6f2"/><g class="ca-espuma"><circle cx="40" cy="28" r="12" fill="#fff"/><circle cx="62" cy="22" r="14" fill="#fff"/><circle cx="88" cy="26" r="12" fill="#fff"/><circle cx="118" cy="22" r="14" fill="#fff"/><circle cx="146" cy="28" r="12" fill="#fff"/></g><rect x="160" y="0" width="8" height="26" rx="4" fill="#b39a8a"/><rect x="150" y="0" width="22" height="8" rx="4" fill="#b39a8a"/><rect x="30" y="100" width="10" height="10" rx="3" fill="#ffc98b"/><rect x="150" y="100" width="10" height="10" rx="3" fill="#ffc98b"/>'),
  lavabo: svg(90, 140, '<rect x="36" y="56" width="18" height="82" rx="6" fill="#ffffff" stroke="#bfe8ff" stroke-width="3"/><path d="M4 40h82v6a26 26 0 0 1-26 26H30A26 26 0 0 1 4 46z" fill="#ffffff" stroke="#bfe8ff" stroke-width="3"/><rect x="40" y="22" width="10" height="20" rx="4" fill="#b39a8a"/><rect x="40" y="18" width="24" height="8" rx="4" fill="#b39a8a"/>'),
  patito: svg(50, 46, '<ellipse cx="24" cy="32" rx="20" ry="13" fill="#ffd84d"/><circle cx="34" cy="16" r="11" fill="#ffd84d"/><path d="M44 16l8 3-8 3z" fill="#ff9e3d"/><circle cx="37" cy="13" r="2" fill="#3a2a35"/>'),
  arbol: svg(200, 330, '<rect x="88" y="150" width="26" height="180" rx="10" fill="#b07a52"/><circle class="ca-copa" cx="100" cy="100" r="90" fill="#7fd29b"/><circle cx="54" cy="96" r="44" fill="#6cc589"/><circle cx="146" cy="104" r="48" fill="#8fdcab"/><circle cx="60" cy="70" r="7" fill="#ff7a8a"/><circle cx="130" cy="60" r="7" fill="#ff7a8a"/><circle cx="150" cy="120" r="7" fill="#ff7a8a"/><circle cx="84" cy="130" r="7" fill="#ff7a8a"/><path d="M140 150v130M178 150v130" stroke="#8a6a52" stroke-width="3"/>'),
  columpio: svg(60, 20, '<rect x="2" y="4" width="56" height="12" rx="6" fill="#ff9cbf"/>'),
  buzon: svg(60, 130, '<rect x="26" y="52" width="10" height="78" fill="#b07a52"/><path d="M4 30a26 26 0 0 1 52 0v26H4z" fill="#ff86b0"/><rect x="4" y="30" width="52" height="26" fill="#ff86b0"/><rect x="40" y="10" width="5" height="26" fill="#6b5a66"/><rect x="40" y="10" width="16" height="10" fill="#ff5c93"/>'),
  flor: svg(40, 70, '<path d="M20 70V30" stroke="#57b884" stroke-width="4"/><path d="M20 50c-10-2-14-10-12-16 8 2 12 8 12 16z" fill="#6fcf97"/><g class="ca-petalos"><circle cx="20" cy="16" r="8" fill="#ff9cbf"/><circle cx="10" cy="24" r="8" fill="#ffb3cf"/><circle cx="30" cy="24" r="8" fill="#ffb3cf"/><circle cx="14" cy="34" r="8" fill="#ff9cbf"/><circle cx="26" cy="34" r="8" fill="#ff9cbf"/><circle cx="20" cy="26" r="6" fill="#ffd84d"/></g>'),
  cerca: svg(420, 70, Array.from({ length: 11 }, (_, i) => `<path d="M${i * 40 + 8} 70V18l12-14 12 14v52z" fill="#fff" stroke="#f0d6e0" stroke-width="2"/>`).join("") + '<rect x="0" y="34" width="420" height="10" fill="#fff"/>'),
  puerta: svg(100, 220, '<rect x="2" y="2" width="96" height="216" rx="48" ry="40" fill="#ffb066"/><rect x="14" y="20" width="72" height="190" rx="36" ry="30" fill="#ffc98b"/><circle cx="74" cy="120" r="6" fill="#a0673f"/><path d="M50 60c-4-7-14-5-12 3 1 5 12 11 12 11s11-6 12-11c2-8-8-10-12-3z" fill="#ff5c93"/>'),
  repisa: svg(160, 60, '<rect x="0" y="44" width="160" height="10" rx="5" fill="#c18e62"/><rect x="12" y="14" width="22" height="30" rx="6" fill="#ffd36e"/><rect x="40" y="6" width="22" height="38" rx="6" fill="#ff9cbf"/><rect x="68" y="18" width="22" height="26" rx="6" fill="#86d6f2"/><path d="M112 44c-4-14 6-24 12-28 6 4 16 14 12 28z" fill="#6fcf97"/>'),
  toalla: svg(60, 100, '<rect x="0" y="0" width="60" height="8" rx="4" fill="#b39a8a"/><rect x="6" y="6" width="48" height="90" rx="10" fill="#ff9cbf"/><rect x="6" y="70" width="48" height="8" fill="#fff" opacity=".7"/>'),
};
// Las cositas para decorar (se ponen y se acomodan con el dedo).
const COSITAS = {
  oso: svg(70, 80, '<circle cx="16" cy="16" r="12" fill="#c8956d"/><circle cx="54" cy="16" r="12" fill="#c8956d"/><circle cx="35" cy="34" r="24" fill="#d9a77a"/><ellipse cx="35" cy="66" rx="26" ry="16" fill="#d9a77a"/><ellipse cx="35" cy="40" rx="10" ry="8" fill="#f2d2b0"/><circle cx="27" cy="30" r="3" fill="#3a2a35"/><circle cx="43" cy="30" r="3" fill="#3a2a35"/><circle cx="35" cy="38" r="3" fill="#3a2a35"/><path d="M35 56c-3-5-11-3-10 3 1 4 10 9 10 9s9-5 10-9c1-6-7-8-10-3z" fill="#ff5c93"/>'),
  globo: svg(50, 110, '<path d="M25 64c2 14-6 22 0 44" stroke="#b39a8a" stroke-width="2" fill="none"/><path d="M25 66C8 54 2 38 6 24 10 8 40 8 44 24c4 14-2 30-19 42z" fill="#ff7aa8"/><path d="M14 22c2-6 8-9 12-8" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>'),
  cuadro: svg(90, 80, '<rect x="2" y="2" width="86" height="76" rx="8" fill="#ffc98b"/><rect x="10" y="10" width="70" height="60" rx="4" fill="#fff4e6"/><path d="M45 34c-5-8-18-5-15 4 2 7 15 14 15 14s13-7 15-14c3-9-10-12-15-4z" fill="#ff5c93"/>'),
  maceta: svg(60, 80, '<circle cx="18" cy="18" r="10" fill="#ffb3cf"/><circle cx="42" cy="14" r="10" fill="#c39bff"/><circle cx="30" cy="26" r="10" fill="#ffd84d"/><path d="M30 40V26M18 40V22M42 40V18" stroke="#57b884" stroke-width="3"/><path d="M8 40h44l-6 38H14z" fill="#86d6f2"/>'),
  estrellas: svg(90, 60, '<path d="M20 4l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffd84d"/><path d="M64 14l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffb3cf"/><path d="M44 38l3 6 7 1-5 4 1 7-6-4-6 4 1-7-5-4 7-1z" fill="#c39bff"/>'),
  guirnalda: svg(180, 50, '<path d="M2 6q88 40 176 0" stroke="#b39a8a" stroke-width="2" fill="none"/>' + [20, 50, 80, 110, 140, 165].map((x, i) => `<circle cx="${x}" cy="${12 + Math.sin((x / 176) * Math.PI) * 18}" r="7" fill="${["#ff86b0", "#ffd84d", "#86d6f2", "#a0d995", "#c39bff", "#ff9e7a"][i]}" class="ca-foquito"/>`).join("")),
  gatito: svg(80, 50, '<ellipse cx="40" cy="34" rx="34" ry="14" fill="#9a8aa4"/><circle cx="62" cy="26" r="13" fill="#9a8aa4"/><path d="M52 16l4-10 6 8zM66 14l6-8 2 10z" fill="#9a8aa4"/><path d="M57 27q3 3 6 0M65 27q3 3 6 0" stroke="#3a2a35" stroke-width="1.6" fill="none"/><path d="M8 34q-8-12 4-18" stroke="#9a8aa4" stroke-width="6" stroke-linecap="round" fill="none"/>'),
  cojin: svg(70, 50, '<rect x="4" y="6" width="62" height="40" rx="16" fill="#ffd0e2"/><path d="M35 20c-3-5-11-3-10 3 1 4 10 9 10 9s9-5 10-9c1-6-7-8-10-3z" fill="#ff5c93"/>'),
};
const NOMBRE_COSITA = { oso: "Osito", globo: "Globo", cuadro: "Cuadrito", maceta: "Florecitas", estrellas: "Estrellitas", guirnalda: "Foquitos", gatito: "Gatito", cojin: "Cojín" };

/**
 * Los muebles: dónde están (x del centro en su cuarto; `y` = dónde va su pie), su tamaño y qué pasa al
 * tocarlos. `lugares` = dónde se pone un monito para usarlo (dx desde el centro, y = sus pies, la pose).
 */
const MUEBLES = [
  { k: "arbol", c: "jardin", x: 110, y: 520, w: 200, h: 330, fondo: true },
  { k: "columpio", c: "jardin", x: 169, y: 476, w: 60, h: 20, accion: "columpio", lugares: [{ dx: 0, y: 494, pose: "columpio" }] },
  { k: "buzon", c: "jardin", x: 290, y: 528, w: 60, h: 130, al: "buzon" },
  { k: "flor", c: "jardin", x: 236, y: 540, w: 40, h: 70, al: "flor" }, { k: "flor", c: "jardin", x: 30, y: 546, w: 40, h: 70, al: "flor" }, { k: "flor", c: "jardin", x: 62, y: 552, w: 40, h: 70, al: "flor" },
  { k: "puerta", c: "jardin", x: 372, y: 506, w: 90, h: 200, al: "puerta" },
  { k: "alfombra", c: "sala", x: 200, y: 556, w: 240, h: 40, piso: true },
  { k: "sofa", c: "sala", x: 190, y: 512, w: 200, h: 110, accion: "sentado", lugares: [{ dx: -44, y: 500, pose: "sentado" }, { dx: 44, y: 500, pose: "sentado" }] },
  { k: "tele", c: "sala", x: 360, y: 512, w: 110, h: 130, al: "tele" },
  { k: "lampara", c: "sala", x: 50, y: 512, w: 56, h: 170, al: "luz" },
  { k: "planta", c: "sala", x: 386, y: 384, w: 50, h: 80, al: "planta", z: 5 },
  { k: "refri", c: "cocina", x: 60, y: 516, w: 96, h: 196, accion: "comiendo", al: "refri", lugares: [{ dx: 62, y: SUELO, pose: "comiendo" }] },
  { k: "estufa", c: "cocina", x: 175, y: 516, w: 104, h: 116, accion: "cocinando", al: "estufa", lugares: [{ dx: 0, y: SUELO, pose: "cocinando" }] },
  { k: "repisa", c: "cocina", x: 110, y: 270, w: 150, h: 56, alto: true },
  { k: "silla", c: "cocina", x: 270, y: 520, w: 54, h: 98, accion: "sentado", lugares: [{ dx: 0, y: 510, pose: "sentado" }] },
  { k: "mesa", c: "cocina", x: 330, y: 520, w: 120, h: 80 },
  { k: "silla", c: "cocina", x: 395, y: 520, w: 54, h: 98, accion: "sentado", lugares: [{ dx: 0, y: 510, pose: "sentado", mira: -1 }] },
  { k: "buro", c: "recamara", x: 40, y: 516, w: 66, h: 146, al: "luz" },
  { k: "cama", c: "recamara", x: 180, y: 516, w: 230, h: 120, accion: "dormido", lugares: [{ dx: -18, y: 524, pose: "dormido" }, { dx: 46, y: 524, pose: "dormido" }] },
  { k: "ropero", c: "recamara", x: 350, y: 516, w: 104, h: 196, al: "vestir" },
  { k: "tina", c: "bano", x: 130, y: 520, w: 190, h: 110, accion: "banando", lugares: [{ dx: -34, y: 510, pose: "banando" }, { dx: 36, y: 510, pose: "banando" }] },
  { k: "patito", c: "bano", x: 70, y: 418, w: 44, h: 40, al: "patito", z: 5 },
  { k: "toalla", c: "bano", x: 260, y: 370, w: 54, h: 96, alto: true },
  { k: "lavabo", c: "bano", x: 340, y: 520, w: 86, h: 136 },
  { k: "espejo", c: "bano", x: 340, y: 360, w: 74, h: 128, al: "vestir", alto: true },
];
const VENTANAS = { sala: 250, cocina: 300, recamara: 210 };

/* ─────────────── El monito ─────────────── */
const PIELES = ["#ffe0c8", "#f6d3b8", "#e8b896", "#c98e68", "#9a6644", "#6e4630"];
const COLOR_PELO = ["#3a2a35", "#5a3b2e", "#8a5a3b", "#d9a05b", "#f2d27a", "#ff86b0", "#9b6be0", "#2f2f3a"];
const COLOR_ROPA = ["#ff8fb8", "#ff5c93", "#ffb3cf", "#c39bff", "#9b6be0", "#7aa7ff", "#86d6f2", "#6fd3a6", "#ffd36e", "#ff9e7a", "#ffffff", "#3a2a35"];
const PEINADOS = [["largo", "Largo"], ["coletas", "Coletas"], ["chongo", "Chongo"], ["corto", "Corto"], ["chino", "Chinito"], ["copete", "Copete"]];
const ARRIBAS = [["playera", "Playera"], ["vestido", "Vestido"], ["sudadera", "Sudadera"], ["tirantes", "Blusita"]];
const ABAJOS = [["pantalon", "Pantalón"], ["falda", "Falda"], ["short", "Short"]];
const ACCESORIOS = [["ninguno", "Nada"], ["mono", "Moño"], ["flores", "Flores"], ["gorra", "Gorra"], ["lentes", "Lentes"], ["corona", "Corona"], ["audifonos", "Audífonos"]];

/** La ropa de entrada, según lo que eligió en su perfil (mujer u hombre; si no, algo lindo para todos). */
export function ropaDe(genero) {
  if (genero === "Mujer") return { piel: PIELES[1], pelo: "largo", peloColor: "#5a3b2e", arriba: "vestido", arribaColor: "#ff8fb8", abajo: "falda", abajoColor: "#c39bff", zapatos: "#e5679a", accesorio: "mono" };
  if (genero === "Hombre") return { piel: PIELES[2], pelo: "corto", peloColor: "#3a2a35", arriba: "playera", arribaColor: "#7aa7ff", abajo: "pantalon", abajoColor: "#4a5a8a", zapatos: "#3a2a35", accesorio: "ninguno" };
  return { piel: PIELES[1], pelo: "chino", peloColor: "#8a5a3b", arriba: "sudadera", arribaColor: "#c39bff", abajo: "pantalon", abajoColor: "#5a6a9a", zapatos: "#ff5c93", accesorio: "ninguno" };
}
const oscuro = (c, k = 0.82) => { const n = parseInt(String(c).slice(1), 16) || 0; return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`; };
const seguro = (c, d) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : d);

/** El monito en SVG (100 × 170; los pies en y = 166). Por piezas, para que camine, salude y se siente. */
export function monitoSVG(r0) {
  const r = { ...ropaDe(""), ...r0 };
  const piel = seguro(r.piel, PIELES[1]), pelo = seguro(r.peloColor, "#5a3b2e"), arriba = seguro(r.arribaColor, "#ff8fb8"), abajo = seguro(r.abajoColor, "#7aa7ff"), zap = seguro(r.zapatos, "#3a2a35");
  const vestido = r.arriba === "vestido";
  const pierna = (x, cl) => `<g class="${cl}"><rect x="${x}" y="116" width="11" height="44" rx="5.5" fill="${vestido || r.abajo === "falda" || r.abajo === "short" ? piel : abajo}"/>${r.abajo === "short" && !vestido ? `<rect x="${x - 1}" y="114" width="13" height="18" rx="5" fill="${abajo}"/>` : ""}<ellipse cx="${x + 5.5}" cy="161" rx="8" ry="5" fill="${zap}"/></g>`;
  const brazo = (x, cl, rot) => `<g class="${cl}" style="transform-origin:${x + 5}px 84px"><g transform="rotate(${rot} ${x + 5} 84)"><rect x="${x}" y="80" width="10" height="34" rx="5" fill="${r.arriba === "tirantes" ? piel : arriba}"/><circle cx="${x + 5}" cy="115" r="5.5" fill="${piel}"/></g></g>`;
  let torso;
  if (vestido) torso = `<path d="M36 78h28l12 60H24z" fill="${arriba}"/><path d="M24 138h52" stroke="${oscuro(arriba)}" stroke-width="3"/><circle cx="50" cy="96" r="3" fill="#fff" opacity=".8"/>`;
  else if (r.arriba === "sudadera") torso = `<rect x="29" y="76" width="42" height="48" rx="14" fill="${arriba}"/><path d="M38 78q12 10 24 0" stroke="${oscuro(arriba)}" stroke-width="3" fill="none"/><rect x="38" y="104" width="24" height="10" rx="4" fill="${oscuro(arriba, 0.9)}"/>`;
  else if (r.arriba === "tirantes") torso = `<rect x="31" y="80" width="38" height="44" rx="12" fill="${arriba}"/><path d="M37 80v-6M63 80v-6" stroke="${arriba}" stroke-width="3"/>`;
  else torso = `<rect x="30" y="77" width="40" height="46" rx="13" fill="${arriba}"/><path d="M42 78q8 6 16 0" stroke="${oscuro(arriba)}" stroke-width="2.5" fill="none"/>`;
  const falda = !vestido && r.abajo === "falda" ? `<path d="M30 116h40l6 22H24z" fill="${abajo}"/>` : "";
  const pantalon = !vestido && r.abajo === "pantalon" ? `<rect x="31" y="112" width="38" height="12" rx="5" fill="${abajo}"/>` : "";
  // El pelo: lo de atrás (va detrás de la cara) y el fleco (adelante).
  const atras = { largo: `<path d="M20 46Q20 16 50 16q30 0 30 30l3 64q-16 9-33 5-17 4-33-5z" fill="${pelo}"/>`, coletas: `<circle cx="17" cy="60" r="11" fill="${pelo}"/><circle cx="83" cy="60" r="11" fill="${pelo}"/><path d="M14 66q-4 18 6 30M86 66q4 18-6 30" stroke="${pelo}" stroke-width="9" stroke-linecap="round" fill="none"/>`, chongo: `<circle cx="50" cy="14" r="12" fill="${pelo}"/>`, chino: "", corto: "", copete: "" }[r.pelo] || "";
  const fleco = {
    largo: `<path d="M22 46q2-30 28-30t28 30q-12-14-22-12-8-8-34 12z" fill="${pelo}"/>`,
    coletas: `<path d="M22 46q2-30 28-30t28 30q-14-12-28-10-14-2-28 10z" fill="${pelo}"/>`,
    chongo: `<path d="M22 46q2-30 28-30t28 30q-10-16-28-14-18-2-28 14z" fill="${pelo}"/>`,
    corto: `<path d="M21 48q0-32 29-32t29 32q-6-14-14-16-6 4-15 3-9 1-15-3-8 2-14 16z" fill="${pelo}"/>`,
    copete: `<path d="M21 48q0-32 29-32t29 32q-6-12-14-14-10-10-24-2-12 0-20 16z" fill="${pelo}"/><path d="M40 20q8-14 22-6-10 0-14 10z" fill="${pelo}"/>`,
    chino: `<g fill="${pelo}">${[[24, 36], [32, 24], [44, 18], [56, 18], [68, 24], [76, 36], [20, 50], [80, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join("")}</g>`,
  }[r.pelo] || "";
  const acc = {
    mono: `<path d="M66 20l12-8v18zM66 20l-12-8v18z" fill="#ff5c93"/><circle cx="66" cy="20" r="4" fill="#ff86b0"/>`,
    flores: `<g>${[[30, 22, "#ff9cbf"], [42, 16, "#ffd36e"], [56, 16, "#c39bff"], [68, 22, "#86d6f2"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join("")}</g>`,
    gorra: `<path d="M20 40q2-26 30-26t30 26z" fill="#ff5c93"/><path d="M50 40h38q-4 8-38 6z" fill="#e0457f"/><circle cx="50" cy="15" r="3.5" fill="#fff"/>`,
    lentes: `<g fill="none" stroke="#3a2a35" stroke-width="2.6"><circle cx="40" cy="52" r="8"/><circle cx="60" cy="52" r="8"/><path d="M48 52h4"/></g>`,
    corona: `<path d="M32 22l6-14 12 10 12-10 6 14z" fill="#ffd84d"/><circle cx="50" cy="16" r="2.5" fill="#ff5c93"/>`,
    audifonos: `<path d="M20 50q0-36 30-36t30 36" stroke="#9b6be0" stroke-width="5" fill="none"/><rect x="14" y="44" width="12" height="18" rx="5" fill="#c39bff"/><rect x="74" y="44" width="12" height="18" rx="5" fill="#c39bff"/>`,
  }[r.accesorio] || "";
  return `<svg viewBox="0 0 100 170" class="ca-mono-svg" aria-hidden="true">
    <ellipse class="ca-sombra" cx="50" cy="165" rx="26" ry="4.5" fill="rgba(60,30,50,.18)"/>
    ${atras}
    ${pierna(38, "ca-pi")}${pierna(51, "ca-pd")}
    ${brazo(21, "ca-bi", 14)}
    ${torso}${falda}${pantalon}
    ${brazo(69, "ca-bd", -14)}
    <circle cx="23" cy="52" r="5" fill="${piel}"/><circle cx="77" cy="52" r="5" fill="${piel}"/>
    <circle cx="50" cy="48" r="28" fill="${piel}"/>
    <g class="ca-ojos"><ellipse cx="40" cy="52" rx="3.6" ry="4.6" fill="#3a2a35"/><ellipse cx="60" cy="52" rx="3.6" ry="4.6" fill="#3a2a35"/><circle cx="41.4" cy="50.4" r="1.3" fill="#fff"/><circle cx="61.4" cy="50.4" r="1.3" fill="#fff"/></g>
    <g class="ca-ojos-cerrados"><path d="M36 53q4 3 8 0M56 53q4 3 8 0" stroke="#3a2a35" stroke-width="2" fill="none" stroke-linecap="round"/></g>
    <ellipse cx="33" cy="60" rx="5" ry="3" fill="#ff9cbf" opacity=".6"/><ellipse cx="67" cy="60" rx="5" ry="3" fill="#ff9cbf" opacity=".6"/>
    <path class="ca-boca" d="M45 62q5 5 10 0" stroke="#c2336b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${fleco}${acc}
  </svg>`;
}

/* ─────────────── La casita ─────────────── */
export class Casita {
  constructor(app, { pareja = "tu amorcito" } = {}) {
    this.app = app;
    this.pareja = pareja;
    this.vivo = false;
    this.v = -1;
    this.casa = { cuartos: {}, cosas: [], luces: {}, cortinas: {} };
    this.yo = null; this.suyo = null;
  }

  montar(cont) {
    this.vivo = true;
    const d = PF.datos();
    this.mundo = el("div.ca-mundo" + (this._esNoche() ? ".noche" : ""), { style: { width: W * CUARTOS.length + "px", height: H + "px" } });
    this.cuartosN = new Map();
    CUARTOS.forEach((c, i) => {
      const n = el("div.ca-cuarto." + c.k, { dataset: { k: c.k }, style: { left: i * W + "px", width: W + "px", height: H + "px" } }, [
        el("div.ca-pared"), el("div.ca-piso"), el("div.ca-zoclo"), el("div.ca-sombras"),
      ]);
      if (c.k === "jardin") n.append(el("div.ca-cielo", {}, [el("i.ca-sol"), el("i.ca-nube.n1"), el("i.ca-nube.n2"), el("i.ca-nube.n3"), el("i.ca-estrellas")]), el("div.ca-cerca", { html: ARTE.cerca }), el("div.ca-fachada", {}, [el("i.ca-techo"), el("i.ca-fachada-ventana")]));
      if (VENTANAS[c.k]) n.append(this._ventana(c.k, VENTANAS[c.k]));
      if (c.k === "sala") n.append(this._cuadroFotos());
      this.mundo.append(n);
      this.cuartosN.set(c.k, n);
    });
    // Los muebles.
    this.mueblesN = MUEBLES.map((m, i) => {
      const ci = CUARTOS.findIndex((c) => c.k === m.c);
      const n = el("button.ca-mueble." + m.k + (m.fondo ? ".fondo" : "") + (m.piso ? ".piso" : ""), {
        type: "button", "aria-label": this._nombreMueble(m), dataset: { i: String(i) }, html: ARTE[m.k] || "",
        style: { left: ci * W + m.x - m.w / 2 + "px", top: m.y - m.h + "px", width: m.w + "px", height: m.h + "px", zIndex: m.z || (m.piso ? 1 : m.fondo ? 2 : m.alto ? 3 : 4) },
      });
      if (!m.accion && !m.al) n.tabIndex = -1;
      this.mundo.append(n);
      return n;
    });
    // La cobija va aparte (delante de quien se duerma); las cositas que decoran, encima de los muebles.
    const cama = MUEBLES.find((m) => m.k === "cama"), cc = CUARTOS.findIndex((c) => c.k === "recamara");
    this.mundo.append(el("i.ca-cobija", { style: { left: cc * W + cama.x - cama.w / 2 + 86 + "px", top: cama.y - cama.h + 64 + "px" } }));
    this.cositasN = el("div.ca-cositas");
    this.mundo.append(this.cositasN);
    // Los monitos.
    // (La primera vez, cada quien en su lado de la sala: el mismo lugar en los dos teléfonos, sin encimarse.)
    const izq = String(d.yo?.usuario || "") <= String(d.pareja?.usuario || "");
    this.yo = this._monito("yo", { ...ropaDe(d.yo?.genero), x: W + (izq ? 110 : 330) }, "Tú");
    this.suyo = this._monito("pareja", { ...ropaDe(d.pareja?.genero), x: W + (izq ? 330 : 110) }, PF.nombreDe(d.pareja) || this.pareja);
    this.mundo.append(this.yo.n, this.suyo.n);
    // La luz de cada cuarto (de noche, o con la luz apagada, se oscurece todo lo que hay en él).
    this.oscuroN = new Map(CUARTOS.map((c, i) => [c.k, el("i.ca-oscuro." + c.k, { style: { left: i * W + "px", width: W + "px" } })]));
    this.mundo.append(...this.oscuroN.values());
    this.lienzo = el("div.ca-lienzo", {}, [this.mundo]);
    this.vistaN = el("div.ca-vista", {}, [this.lienzo]);
    // Arriba: el cuarto en el que estás y los botones; abajo, los cuartos.
    this.tituloN = el("b.ca-titulo", { text: "Sala" });
    const b = (cl, t, ico, al) => el("button.ca-b." + cl, { type: "button", "aria-label": t, onClick: al }, [el("i", { html: ico }), el("span", { text: t })]);
    this.barra = el("div.ca-barra", {}, [
      this.tituloN,
      el("span.ca-hueco"),
      b("decir", "Decir", ICO.globo, () => this._decir()),
      b("vestir", "Vestir", ICO.ropa, () => this._vestidor()),
      b("decorar", "Decorar", ICO.brocha, () => this._decorar()),
    ]);
    this.tabsN = el("div.ca-tabs", { role: "tablist" }, CUARTOS.map((c, i) => el("button.ca-tab", { type: "button", role: "tab", dataset: { i: String(i) }, onClick: () => this._irCuarto(i) }, [el("i", { html: ICO[c.k] }), el("span", { text: c.n })])));
    this.estadoN = el("small.ca-estado", { text: "Entrando a su casita…" });
    this.raiz = el("div.ca", {}, [this.barra, this.vistaN, this.tabsN, this.estadoN]);
    cont.replaceChildren(this.raiz);
    this._enlazar();
    this._medir();
    this._ro = new ResizeObserver(() => this._medir());
    this._ro.observe(this.vistaN);
    this.vistaN.addEventListener("scroll", () => {
      if (this.vistaN.scrollTop) this.vistaN.scrollTop = 0;   // (sólo de lado: enfocar un mueble con el teclado no la sube)
      cancelAnimationFrame(this._rqS); this._rqS = requestAnimationFrame(() => this._alDeslizar());
    }, { passive: true });
    requestAnimationFrame(() => this._irCuarto(1, false));
    this._reloj = setInterval(() => this.mundo.classList.toggle("noche", this._esNoche()), 60000);
    this._escuchar();
  }

  limpiar() {
    this.vivo = false;
    this._ro?.disconnect();
    clearInterval(this._reloj);
    clearTimeout(this._tCasa); clearTimeout(this._tRopa);
    for (const m of [this.yo, this.suyo]) if (m) { clearTimeout(m.tc); clearTimeout(m.tg); }
    this.panel?.remove();
  }

  _esNoche() { const h = new Date().getHours(); return h >= 20 || h < 7; }
  _nombreMueble(m) { return { sofa: "Sillón: sentarse", tele: "Tele", lampara: "Lámpara", planta: "Planta", refri: "Refri: comer algo", estufa: "Estufa: cocinar", silla: "Silla: sentarse", cama: "Cama: dormir", buro: "Lamparita", ropero: "Ropero: vestirse", tina: "Tina: bañarse", patito: "Patito", lavabo: "Lavabo", espejo: "Espejo: vestirse", columpio: "Columpio", buzon: "Buzón", flor: "Florecita", puerta: "Puerta", arbol: "Árbol", alfombra: "Alfombra", mesa: "Mesa", repisa: "Repisa", toalla: "Toalla" }[m.k] || m.k; }

  _ventana(k, x) {
    const cortina = el("button.ca-ventana", { type: "button", "aria-label": "Ventana: abrir o cerrar las cortinas", style: { left: x - 70 + "px" } }, [
      el("div.ca-ventana-cielo", {}, [el("i.ca-sol"), el("i.ca-nube.n1"), el("i.ca-estrellas")]),
      el("i.ca-ventana-cruz"), el("i.ca-cortina.izq"), el("i.ca-cortina.der"),
    ]);
    cortina.addEventListener("click", (e) => { e.stopPropagation(); this.casa.cortinas[k] = !this.casa.cortinas[k]; this._pintarCasa(); this._guardarCasa(); this._son("abrir"); });
    return cortina;
  }
  /** En la pared de la sala, un cuadrito con sus dos fotos. */
  _cuadroFotos() {
    return el("div.ca-fotos", { "aria-hidden": "true" }, [PF.avatar("yo", "ca-foto"), el("i.ca-foto-cor"), PF.avatar("pareja", "ca-foto")]);
  }

  /* — El tamaño: el alto manda (se ve un cuarto y un pedacito del que sigue) — */
  _medir() {
    const h = this.vistaN.clientHeight, w = this.vistaN.clientWidth;
    if (!h || !w) return;
    // (Con transform y no con zoom: así el dedo y el dibujo coinciden en todos los navegadores.)
    this.k = Math.max(0.45, Math.min(h / H, (w * 1.22) / W, 1.5));
    this.mundo.style.transform = `scale(${this.k})`;
    this.lienzo.style.width = W * CUARTOS.length * this.k + "px";
    this.lienzo.style.height = H * this.k + "px";
  }
  _irCuarto(i, suave = true) {
    const x = (i * W + W / 2) * this.k - this.vistaN.clientWidth / 2;
    this.vistaN.scrollTo({ left: Math.max(0, x), behavior: suave && !reducido() ? "smooth" : "auto" });
  }
  _alDeslizar() {
    const centro = (this.vistaN.scrollLeft + this.vistaN.clientWidth / 2) / (this.k || 1);
    const i = Math.max(0, Math.min(CUARTOS.length - 1, Math.floor(centro / W)));
    if (i === this._cuarto) return;
    this._cuarto = i;
    this.tituloN.textContent = CUARTOS[i].n;
    for (const t of this.tabsN.children) { const on = +t.dataset.i === i; t.classList.toggle("on", on); t.setAttribute("aria-selected", String(on)); }
  }
  /** Del dedo al mundo. */
  _xy(e) { const r = this.mundo.getBoundingClientRect(); return { x: (e.clientX - r.left) / this.k, y: (e.clientY - r.top) / this.k }; }

  /* — Los monitos — */
  _monito(quien, datos, nombre) {
    const cuerpo = el("div.ca-mono-cuerpo", { html: monitoSVG(datos) });
    const globo = el("div.ca-globo", { hidden: "" });
    const n = el("div.ca-monito." + quien, { role: "img", "aria-label": nombre, style: { left: datos.x + "px", top: SUELO + "px" } }, [el("div.ca-mono-caja", {}, [cuerpo]), globo, el("span.ca-mono-nombre", { text: nombre })]);
    return { quien, n, cuerpo, globo, x: datos.x, y: SUELO, ropa: { ...datos }, accion: "", mueble: "", mira: 1, t: 0, dt: 0 };
  }
  _vestir(m, ropa) { m.ropa = { ...m.ropa, ...ropa }; m.cuerpo.innerHTML = monitoSVG(m.ropa); }
  _mirar(m, lado) { m.mira = lado < 0 ? -1 : 1; m.n.classList.toggle("izq", m.mira < 0); }
  /** Caminar hasta (x, y) y luego `luego()`. La velocidad es parejita: más lejos, más tiempo. */
  _caminar(m, x, y = SUELO, luego = null, ya = false) {
    clearTimeout(m.tc);
    this._pose(m, "");
    const d = Math.hypot(x - m.x, y - m.y);
    if (Math.abs(x - m.x) > 2) this._mirar(m, x - m.x);
    const s = ya || reducido() ? 0 : Math.max(0.2, d / 190);
    m.n.style.transitionDuration = s + "s";
    m.n.style.left = x + "px"; m.n.style.top = y + "px";
    m.x = x; m.y = y;
    if (s > 0.2) m.n.classList.add("camina");
    m.tc = setTimeout(() => { m.n.classList.remove("camina"); luego?.(); }, s * 1000 + 20);
    if (m.quien === "yo" && !ya) this._seguir(x);
  }
  /** Que la cámara siga a tu monito si se va a salir de la vista. */
  _seguir(x) {
    const v = this.vistaN, px = x * this.k;
    if (px < v.scrollLeft + 40 || px > v.scrollLeft + v.clientWidth - 40) v.scrollTo({ left: px - v.clientWidth / 2, behavior: reducido() ? "auto" : "smooth" });
  }
  _pose(m, pose, mueble = "") {
    m.accion = pose; m.mueble = mueble;
    m.n.classList.remove("sentado", "dormido", "banando", "columpio", "comiendo", "cocinando", "abrazo", "tele", "saluda");
    if (pose) m.n.classList.add(pose);
    if (pose === "dormido") { m.globo.hidden = false; m.globo.textContent = "z z z"; }
    else if (m.globo.textContent === "z z z") m.globo.hidden = true;
    // Los muebles con alguien (la tina hace espuma, el columpio se mece).
    for (const [i, n] of this.mueblesN.entries()) n.classList.toggle("con-alguien", [this.yo, this.suyo].some((o) => o?.mueble.startsWith(i + ":")));
  }
  /** Un lugar libre de un mueble (si tu amorcito ya está en uno, el otro). */
  _lugar(i, quien) {
    const M = MUEBLES[i], otro = quien === "yo" ? this.suyo : this.yo;
    const libres = M.lugares.map((l, j) => ({ ...l, j })).filter((l) => otro.mueble !== `${i}:${l.j}`);
    return libres[0] || null;
  }
  /** Llevar a un monito a un lugar de un mueble (caminando, o de una vez) y ponerle su pose. */
  _irLugar(m, i, j, ya = false, luego = null) {
    const M = MUEBLES[i], l = M?.lugares?.[j];
    if (!l) return null;
    const ci = CUARTOS.findIndex((c) => c.k === M.c), x = ci * W + M.x + l.dx;
    this._caminar(m, x, SUELO, () => {
      if (!this.vivo) return;
      m.n.style.transitionDuration = ya ? "0s" : ".35s";
      m.n.style.top = l.y + "px"; m.y = l.y;
      if (l.mira) this._mirar(m, l.mira);
      this._pose(m, l.pose, `${i}:${j}`);
      luego?.();
    }, ya);
    return x;
  }
  _usar(i) {
    const M = MUEBLES[i], m = this.yo;
    if (!M?.lugares) return;
    if (m.mueble.startsWith(i + ":")) return;
    const l = this._lugar(i, "yo");
    if (!l) { this._dice(m, "Ya está ocupado", 1800); return; }
    const x = this._irLugar(m, i, l.j, false, () => { vibrar(8); this._son(l.pose === "dormido" ? "minimizar" : "seleccionar"); });
    this._mandarYo({ x, accion: l.pose, mueble: `${i}:${l.j}`, mira: l.mira || m.mira });
  }

  /* — Tocar, cargar y soltar — */
  _enlazar() {
    let g = null;
    this.mundo.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const mono = e.target.closest(".ca-monito"), cos = e.target.closest(".ca-cosa");
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, mono: mono === this.yo.n ? this.yo : null, cosa: cos, blanco: e.target, t: performance.now(), mov: 0 };
      if (g.mono || g.cosa) { try { this.mundo.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
      // Mantener presionada una cosita (sin moverla) la quita; con «Deshacer» por si fue sin querer.
      if (cos) { const G = g; G.tl = setTimeout(() => { if (g === G && G.mov < 8) { g = null; this._arrastrando = null; this._quitarCosa(cos.dataset.id); vibrar(16); } }, 650); }
    });
    this.mundo.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      g.mov = Math.max(g.mov, Math.hypot(e.clientX - g.x0, e.clientY - g.y0));
      if (g.mov < 8) return;
      const p = this._xy(e);
      if (g.mono) {
        // Cargar a tu monito: se balancea colgadito del dedo.
        const m = this.yo;
        if (!g.cargando) { g.cargando = true; clearTimeout(m.tc); this._pose(m, ""); m.n.classList.add("cargado"); m.n.classList.remove("camina"); m.n.style.transitionDuration = "0s"; vibrar(10); }
        m.n.style.left = p.x + "px"; m.n.style.top = Math.min(SUELO, p.y + 70) + "px"; m.x = p.x; m.y = Math.min(SUELO, p.y + 70);
        this._mirar(m, e.movementX || m.mira);
        e.preventDefault();
      } else if (g.cosa) {
        g.arrastra = true; this._arrastrando = g.cosa.dataset.id;
        g.cosa.style.left = p.x + "px"; g.cosa.style.top = p.y + "px";
        e.preventDefault();
      }
    });
    const soltar = (e) => {
      if (!g || e.pointerId !== g.id) return;
      const G = g; g = null;
      clearTimeout(G.tl);
      const p = this._xy(e);
      if (G.cargando) {
        const m = this.yo;
        m.n.classList.remove("cargado");
        // ¿Lo soltaste en un mueble? Lo usa. Si no, cae al piso con un rebotito.
        const i = this._muebleEn(p.x, p.y + 40);
        if (i >= 0 && MUEBLES[i].lugares) { this._usar(i); return; }
        m.n.style.transitionDuration = ".35s";
        m.n.style.top = SUELO + "px"; m.y = SUELO;
        m.n.classList.add("aterriza"); setTimeout(() => m.n.classList.remove("aterriza"), 450);
        this._pose(m, "");
        this._mandarYo({ x: m.x, accion: "", mueble: "", mira: m.mira });
        return;
      }
      this._arrastrando = null;
      if (G.cosa && G.arrastra) {
        const c = this.casa.cosas.find((x) => x.id === G.cosa.dataset.id);
        if (c) { c.x = Math.round(p.x); c.y = Math.round(p.y); this._guardarCasa(); }
        return;
      }
      if (G.mov > 10 || performance.now() - G.t > 600) return;
      // Un toque.
      // (Con el dedo capturado, e.target es el mundo: lo que tocaste es lo que había al poner el dedo.)
      if (G.blanco.closest?.(".ca-ventana")) return;
      const mueble = G.blanco.closest?.(".ca-mueble"), mono = G.blanco.closest?.(".ca-monito");
      if (mono === this.yo.n) { this._saluda(this.yo); this._mandarYo({ accion: "saluda" }); return; }
      if (mono === this.suyo.n) { this._abrazar(); return; }
      if (G.cosa) { this._son("seleccionar"); G.cosa.animate?.([{ transform: "translate(-50%, -50%) scale(1.15)" }, { transform: "translate(-50%, -50%)" }], { duration: 300 }); return; }
      if (mueble) { this._tocarMueble(+mueble.dataset.i); return; }
      // El piso (o la pared): camina hasta ahí.
      const x = Math.max(20, Math.min(W * CUARTOS.length - 20, p.x));
      this._caminar(this.yo, x, SUELO);
      this._pose(this.yo, "");
      this._mandarYo({ x, accion: "", mueble: "", mira: this.yo.mira });
    };
    this.mundo.addEventListener("pointerup", soltar);
    this.mundo.addEventListener("pointercancel", (e) => { if (g?.cargando || g?.arrastra) soltar(e); else { clearTimeout(g?.tl); g = null; } });
    // Con el teclado (Enter o espacio sobre un mueble), lo mismo que tocarlo.
    this.mundo.addEventListener("click", (e) => { const m = e.detail === 0 && e.target.closest(".ca-mueble"); if (m) this._tocarMueble(+m.dataset.i); });
    this.mundo.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  _muebleEn(x, y) {
    for (let i = MUEBLES.length - 1; i >= 0; i--) {
      const M = MUEBLES[i], ci = CUARTOS.findIndex((c) => c.k === M.c), x0 = ci * W + M.x - M.w / 2;
      if (x >= x0 && x <= x0 + M.w && y >= M.y - M.h && y <= M.y + 20) return i;
    }
    return -1;
  }
  _tocarMueble(i) {
    const M = MUEBLES[i], n = this.mueblesN[i];
    n.classList.remove("toque"); void n.offsetWidth; n.classList.add("toque");
    const c = M.c;
    switch (M.al) {
      case "luz": this.casa.luces[c] = this.casa.luces[c] === false; this._pintarCasa(); this._guardarCasa(); this._son("seleccionar"); return;
      case "tele": n.classList.toggle("prendida"); this._son("seleccionar"); if (n.classList.contains("prendida")) { this._usarTele(); } return;
      case "planta": case "flor": n.classList.remove("baila"); void n.offsetWidth; n.classList.add("baila"); this._son("brillo"); return;
      case "patito": n.classList.remove("salta"); void n.offsetWidth; n.classList.add("salta"); this._son("seleccionar"); return;
      case "buzon": this._buzon(); return;
      case "puerta": this._irCuarto(1); this._caminar(this.yo, W + 60, SUELO); this._mandarYo({ x: W + 60, accion: "", mueble: "" }); return;
      case "vestir": this._vestidor(); return;
      case "refri": n.classList.add("abierto"); setTimeout(() => n.classList.remove("abierto"), 2400); break;
      case "estufa": n.classList.add("prendida"); setTimeout(() => n.classList.remove("prendida"), 6000); break;
      default:
    }
    if (M.lugares) this._usar(i);
  }
  _usarTele() {
    // Con la tele prendida, tu monito se sienta en el sillón a verla (si hay lugar).
    const i = MUEBLES.findIndex((m) => m.k === "sofa");
    if (this.yo.mueble.startsWith(i + ":")) return;
    this._usar(i);
  }
  _saluda(m) { m.n.classList.remove("saluda"); void m.n.offsetWidth; m.n.classList.add("saluda"); setTimeout(() => m.n.classList.remove("saluda"), 1300); if (m.quien === "yo") this._son("seleccionar"); }
  /** Tocar a tu amorcito: tu monito va con él y lo abraza (salen corazoncitos para los dos). */
  _abrazar() {
    const o = this.suyo, lado = this.yo.x < o.x ? -1 : 1, x = o.x + lado * 46;
    this._pose(this.yo, "");
    this._caminar(this.yo, x, o.y === SUELO ? SUELO : SUELO, () => { if (!this.vivo) return; this._mirar(this.yo, -lado); this._pose(this.yo, "abrazo"); this._corazones(this.yo.x + -lado * 22, this.yo.y - 120); vibrar(14); this._son("reaccion-abrazo"); });
    this._mandarYo({ x, accion: "abrazo", mueble: "", mira: -lado });
  }
  _corazones(x, y) {
    if (reducido()) return;
    for (let i = 0; i < 6; i++) {
      const c = el("i.ca-corazon", { style: { left: x + (Math.random() * 50 - 25) + "px", top: y + "px", animationDelay: i * 0.12 + "s" } });
      this.mundo.append(c);
      setTimeout(() => c.remove(), 1900 + i * 120);
    }
  }
  _dice(m, txt, ms = 4200) {
    m.globo.hidden = false;
    m.globo.textContent = txt;
    m.globo.classList.remove("sale"); void m.globo.offsetWidth; m.globo.classList.add("sale");
    clearTimeout(m.tg);
    m.tg = setTimeout(() => { if (m.accion !== "dormido") m.globo.hidden = true; else m.globo.textContent = "z z z"; }, ms);
  }
  _buzon() {
    const frases = [`${this.pareja} te quiere muchísimo`, "Hoy es un buen día para un abrazo", "Eres mi lugar favorito", "Te toca darle un beso", "Juntos todo es más bonito", "Alguien piensa en ti ahorita mismo"];
    this._dice(this.yo, frases[Math.floor(Math.random() * frases.length)], 4600);
    this._son("brillo");
  }
  _decir() {
    const frases = ["Te amo", "Ven conmigo", "¿Vemos la tele?", "Tengo hambre", "Buenas noches", "Te extraño", "Abrazo", "Hola, amor"];
    this._hoja("Decir algo", el("div.ca-frases", {}, frases.map((f) => el("button.ca-chip", { type: "button", text: f, onClick: () => { this._cerrarPanel(); this._dice(this.yo, f); this._mandarYo({ dice: f }); this._son("mensaje-enviar"); } }))));
  }

  /* — El vestidor (el ropero o el espejo) — */
  _vestidor() {
    const r = { ...this.yo.ropa };
    const vista = el("div.ca-vest-vista", { html: monitoSVG(r) });
    const pintar = () => { vista.innerHTML = monitoSVG(r); };
    const poner = (cambio) => { Object.assign(r, cambio); pintar(); this._vestir(this.yo, r); clearTimeout(this._tRopa); this._tRopa = setTimeout(() => this._mandarYo({ ropa: { ...r } }), 600); this._son("seleccionar"); };
    const opciones = (lista, clave) => el("div.ca-ops", {}, lista.map(([k, t]) => { const b = el("button.ca-chip" + (r[clave] === k ? ".on" : ""), { type: "button", text: t, onClick: () => { poner({ [clave]: k }); for (const x of b.parentElement.children) x.classList.toggle("on", x === b); } }); return b; }));
    const colores = (lista, clave) => el("div.ca-colores", {}, lista.map((c) => { const b = el("button.ca-color" + (r[clave] === c ? ".on" : ""), { type: "button", "aria-label": c, style: { "--c": c }, onClick: () => { poner({ [clave]: c }); for (const x of b.parentElement.children) x.classList.toggle("on", x === b); } }); return b; }));
    const sec = (t, ...h) => el("section.ca-vest-sec", {}, [el("b", { text: t }), ...h]);
    this._hoja("Vestidor", el("div.ca-vest", {}, [
      vista,
      el("div.ca-vest-ops", {}, [
        sec("Peinado", opciones(PEINADOS, "pelo"), colores(COLOR_PELO, "peloColor")),
        sec("Arriba", opciones(ARRIBAS, "arriba"), colores(COLOR_ROPA, "arribaColor")),
        sec("Abajo", opciones(ABAJOS, "abajo"), colores(COLOR_ROPA, "abajoColor")),
        sec("Zapatitos", colores(COLOR_ROPA, "zapatos")),
        sec("Accesorio", opciones(ACCESORIOS, "accesorio")),
        sec("Piel", colores(PIELES, "piel")),
      ]),
    ]), "vestidor");
    this._saluda(this.yo);
  }

  /* — Decorar — */
  _decorar() {
    const i = this._cuarto ?? 1, c = CUARTOS[i], cfg = this._cfg(c.k);
    const poner = (cambio) => { this.casa.cuartos[c.k] = { ...cfg, ...this.casa.cuartos[c.k], ...cambio }; this._pintarCasa(); this._guardarCasa(); this._son("seleccionar"); };
    const marcar = (b) => { for (const x of b.parentElement.children) x.classList.toggle("on", x === b); };
    const sec = (t, ...h) => el("section.ca-vest-sec", {}, [el("b", { text: t }), ...h]);
    this._hoja(`Decorar: ${c.n}`, el("div.ca-deco", {}, [
      c.k === "jardin" ? null : sec("Color de la pared", el("div.ca-colores", {}, PAREDES.map((p) => { const b = el("button.ca-color" + (cfg.pared === p ? ".on" : ""), { type: "button", "aria-label": p, style: { "--c": p }, onClick: () => { poner({ pared: p }); marcar(b); } }); return b; }))),
      c.k === "jardin" ? null : sec("Tapiz", el("div.ca-ops", {}, PATRONES.map(([k, t]) => { const b = el("button.ca-chip" + (cfg.patron === k ? ".on" : ""), { type: "button", text: t, onClick: () => { poner({ patron: k }); marcar(b); } }); return b; }))),
      sec("Piso", el("div.ca-ops", {}, PISOS.map(([k, t]) => { const b = el("button.ca-chip" + (cfg.piso === k ? ".on" : ""), { type: "button", text: t, onClick: () => { poner({ piso: k }); marcar(b); } }); return b; }))),
      sec("Cositas (luego las acomodas con el dedo; mantenlas presionadas para quitarlas)", el("div.ca-cositas-ops", {}, Object.keys(COSITAS).map((k) => el("button.ca-cosita-b", { type: "button", "aria-label": NOMBRE_COSITA[k], onClick: () => this._ponerCosa(k, i) }, [el("i", { html: COSITAS[k] }), el("small", { text: NOMBRE_COSITA[k] })])))),
    ].filter(Boolean)), "decorar");
  }
  _cfg(k) { const base = CUARTOS.find((c) => c.k === k); return { pared: base.pared, patron: base.patron, piso: base.piso, ...(this.casa.cuartos?.[k] || {}) }; }
  _ponerCosa(k, i) {
    if (this.casa.cosas.length >= 40) { aviso("Ya hay muchas cositas: quita alguna para poner otra", 2800); return; }
    const id = Math.random().toString(36).slice(2, 9);
    this.casa.cosas.push({ id, k, x: i * W + W / 2 + Math.round(Math.random() * 80 - 40), y: 300 + Math.round(Math.random() * 60) });
    this._cerrarPanel();
    this._pintarCasa(); this._guardarCasa();
    this._son("colocar"); vibrar(8);
    aviso("Acomódala con el dedo", 1800);
  }
  _quitarCosa(id) {
    const antes = this.casa.cosas.find((c) => c.id === id);
    if (!antes) return;
    this.casa.cosas = this.casa.cosas.filter((c) => c.id !== id);
    this._pintarCasa(); this._guardarCasa(); this._son("borrar");
    aviso(`${NOMBRE_COSITA[antes.k] || "Cosita"} quitada`, 3200, "", { t: "Deshacer", al: () => { if (!this.vivo || this.casa.cosas.some((c) => c.id === id)) return; this.casa.cosas.push(antes); this._pintarCasa(); this._guardarCasa(); } });
  }
  _pintarCasa() {
    for (const c of CUARTOS) {
      const n = this.cuartosN.get(c.k), cfg = this._cfg(c.k);
      n.style.setProperty("--pared", cfg.pared);
      n.dataset.patron = cfg.patron; n.dataset.piso = cfg.piso;
      this.oscuroN.get(c.k).classList.toggle("apagado", this.casa.luces?.[c.k] === false);
      n.classList.toggle("cortinas", !!this.casa.cortinas?.[c.k]);
    }
    for (const [i, n] of this.mueblesN.entries()) if (MUEBLES[i].al === "luz") n.classList.toggle("apagada", this.casa.luces?.[MUEBLES[i].c] === false);
    // Las cositas: sólo se rehacen las que cambiaron.
    const ya = new Map([...this.cositasN.children].map((n) => [n.dataset.id, n]));
    for (const c of this.casa.cosas || []) {
      if (!COSITAS[c.k]) continue;
      let n = ya.get(c.id);
      if (!n) { n = el("button.ca-cosa." + c.k, { type: "button", "aria-label": NOMBRE_COSITA[c.k], dataset: { id: c.id }, html: COSITAS[c.k] }); this.cositasN.append(n); }
      ya.delete(c.id);
      if (c.id === this._arrastrando) continue;
      n.style.left = c.x + "px"; n.style.top = c.y + "px";
    }
    for (const n of ya.values()) n.remove();
  }
  _guardarCasa() {
    clearTimeout(this._tCasa);
    this._casaSucia = true;
    this._tCasa = setTimeout(() => {
      const txt = JSON.stringify(this.casa);
      SRV.ponerCasa(this.casa)
        .then(() => { this._casaMandada = txt; if (JSON.stringify(this.casa) === txt) this._casaSucia = false; })
        .catch((e) => { this._casaSucia = false; aviso(e.message, 3000, "error"); });
    }, 450);
  }

  /* — Hojitas (vestidor, decorar, decir) — */
  _hoja(titulo, cuerpo, clase = "") {
    this._cerrarPanel();
    const cerrar = el("button.ca-hoja-x", { type: "button", "aria-label": "Cerrar", html: ICO.cerrar, onClick: () => this._cerrarPanel() });
    this.panel = el("section.ca-hoja" + (clase ? "." + clase : ""), { role: "dialog", "aria-label": titulo }, [el("i.ca-hoja-asa"), el("header", {}, [el("b", { text: titulo }), cerrar]), cuerpo]);
    this.raiz.append(this.panel);
    requestAnimationFrame(() => this.panel?.classList.add("ver"));
    this._son("abrir");
    // Jalar la pestañita hacia abajo la cierra.
    let y0 = null;
    const asa = this.panel.querySelector(".ca-hoja-asa"), p = this.panel;
    asa.addEventListener("pointerdown", (e) => { y0 = e.clientY; asa.setPointerCapture(e.pointerId); p.style.transition = "none"; });
    asa.addEventListener("pointermove", (e) => { if (y0 != null) p.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
    const fin = (e) => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; p.style.transition = ""; p.style.transform = ""; if (dy > 70) this._cerrarPanel(); };
    asa.addEventListener("pointerup", fin); asa.addEventListener("pointercancel", fin);
  }
  _cerrarPanel() {
    const p = this.panel;
    if (!p) return false;
    this.panel = null;
    p.classList.remove("ver");
    setTimeout(() => p.remove(), 260);
    return true;
  }
  /** Atrás: primero la hojita. */
  atras() { return this._cerrarPanel(); }

  /* — En tiempo real — */
  _mandarYo(d) {
    SRV.ponerMonito(d).catch(() => { this.estadoN.textContent = "Sin conexión: tu monito se moverá cuando vuelva"; });
  }
  async _escuchar() {
    let primera = true;
    while (this.vivo) {
      try {
        const r = await SRV.casita(this.v, primera ? 0 : 20);
        if (!this.vivo) return;
        this.v = r.v;
        this._recibir(r, primera);
        primera = false;
        this.estadoN.textContent = r.pareja_aqui ? `${this.pareja} está en la casita` : `${this.pareja} no está ahorita (verá lo que hagas cuando entre)`;
        this.suyo.n.classList.toggle("ausente", !r.pareja_aqui);
      } catch (e) {
        if (!this.vivo) return;
        this.estadoN.textContent = e.status === 409 ? "Primero vincúlate con tu amorcito" : "Sin conexión con su servidor: reintentando…";
        if (e.status === 409) return;
        await dormir(4000);
      }
    }
  }
  _recibir(r, primera) {
    // (Si tienes cambios de la casa sin mandar, mandan los tuyos.)
    if (r.casa && !this._casaSucia && JSON.stringify(r.casa) !== this._casaMandada) {
      const c = r.casa;
      this.casa = { cuartos: c.cuartos || {}, cosas: Array.isArray(c.cosas) ? c.cosas : [], luces: c.luces || {}, cortinas: c.cortinas || {} };
      this._casaMandada = JSON.stringify(this.casa);
    }
    this._pintarCasa();
    if (primera) {
      const y = r.yo;
      if (y) {
        if (y.ropa) this._vestir(this.yo, y.ropa);
        if (y.mira) this._mirar(this.yo, y.mira);
        const [i, j] = String(y.mueble || "").split(":").map(Number);
        if (y.mueble && MUEBLES[i]?.lugares?.[j]) this._irLugar(this.yo, i, j, true);
        else if (y.x != null) this._caminar(this.yo, y.x, SUELO, null, true);
      } else this._mandarYo({ x: this.yo.x, ropa: this.yo.ropa });
      requestAnimationFrame(() => this._irCuarto(Math.floor(this.yo.x / W), false));
    }
    const p = r.pareja, m = this.suyo;
    if (!p) return;
    if (p.ropa && JSON.stringify(p.ropa) !== m._ropaVista) { m._ropaVista = JSON.stringify(p.ropa); this._vestir(m, p.ropa); }
    if (p.t === m.t) return;
    m.t = p.t;
    // Dónde está y qué hace: si está en un mueble, va a su lugar; si no, camina hasta su x.
    const [i, j] = String(p.mueble || "").split(":").map(Number);
    if (p.mueble && MUEBLES[i]?.lugares?.[j]) { if (m.mueble !== p.mueble) this._irLugar(m, i, j, primera); }
    else if (p.x != null && (Math.abs(p.x - m.x) > 1 || m.mueble || p.accion === "abrazo")) {
      this._caminar(m, p.x, SUELO, () => {
        if (p.accion !== "abrazo" || !this.vivo) return;
        this._mirar(m, p.mira || 1); this._pose(m, "abrazo");
        if (!primera) { this._corazones(m.x + (p.mira || 1) * 22, m.y - 120); this._son("reaccion-abrazo"); }
      }, primera);
    } else if (p.mira) this._mirar(m, p.mira);
    if (p.accion === "saluda" && !primera) this._saluda(m);
    // Lo que dijo (sólo si es nuevo).
    if (p.dt && p.dt !== m.dt) { if (!primera && p.dice) this._dice(m, p.dice); m.dt = p.dt; }
  }

  _son(n) { this.app.sonidos?.sonar(n); }
}

/* Los iconitos de la barra y de los cuartos (línea, del color del texto). */
const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO = {
  globo: ic('<path d="M4 5h16v11H9l-5 4z"/>'),
  ropa: ic('<path d="M8 4l4 3 4-3 4 4-3 3v9H7v-9L4 8z"/>'),
  brocha: ic('<path d="M14 4l6 6-8 8-6-6z"/><path d="M6 12l-3 7 7-3"/>'),
  cerrar: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  jardin: ic('<path d="M12 21v-7"/><path d="M12 14c-4 0-6-3-6-6 3 0 6 2 6 6zM12 14c4 0 6-3 6-6-3 0-6 2-6 6z"/><path d="M5 21h14"/>'),
  sala: ic('<path d="M4 12h16v6H4z"/><path d="M6 12V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M6 18v2M18 18v2"/>'),
  cocina: ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 10h14M9 6v1M9 13v3"/>'),
  recamara: ic('<path d="M3 18V8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3H10v3"/><circle cx="6.5" cy="11" r="1.5"/>'),
  bano: ic('<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>'),
};
