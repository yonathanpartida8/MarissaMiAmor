/**
 * FOTOGRAFÍAS — el inventario de imágenes del libro.
 *
 * ── CÓMO CAMBIAR LAS IMÁGENES ─────────────────────────────────────────
 * Sustituye los archivos de `assets/img/` conservando el nombre
 * (imagen1.png, imagen2.png…). No hay que tocar ni una línea de código:
 * cada página coge las suyas de los grupos de aquí abajo.
 *
 * Si quieres cambiar QUÉ foto sale en QUÉ página, mueve los números en
 * `groups`. Y si añades más imágenes, sube TOTAL y créate un grupo nuevo.
 * ──────────────────────────────────────────────────────────────────────
 */

const BASE = "assets/img/";
const TOTAL = 85;

/** Inventario completo, en orden. */
export const photos = Array.from({ length: TOTAL }, (_, i) => {
  const n = i + 1;
  return { id: `f${n}`, src: `${BASE}imagen${n}.png`, index: i, number: n };
});

export const photoSrc = (n) => `${BASE}imagen${n}.png`;

/** Rango inclusivo por número de archivo: range(6, 13) → imagen6…imagen13 */
export const range = (from, to) => photos.slice(from - 1, to);

/** Sólo las rutas, que es lo que suele querer el precargador. */
export const srcs = (list) => list.map((p) => p.src);

/**
 * GRUPOS — qué fotos usa cada página.
 * El nombre del grupo coincide con el id del capítulo, para que sea evidente
 * de un vistazo a dónde va cada cosa.
 */
export const groups = {
  // ── Acto I ───────────────────────────────────────────────
  portada: range(1, 1),
  tresDeLaManana: range(2, 2),
  loQueNoDije: range(3, 3),
  postalPrimera: range(4, 4),
  tuVoz: range(5, 5),
  nuestroDesorden: range(6, 13),
  llueveAlla: range(14, 14),

  // ── Acto II ──────────────────────────────────────────────
  listaPendiente: range(15, 16),
  porPedacitos: range(17, 17),
  meCaigoMejor: range(18, 18),
  nuestraPelicula: range(19, 28),
  laCombinacion: range(29, 29),
  miNorte: range(30, 30),
  todoLoQueGuardo: range(31, 46),
  enVozBaja: range(47, 47),

  // ── Acto III ─────────────────────────────────────────────
  regalo: range(48, 48),
  mismoCielo: range(49, 58),
  postalSegunda: range(59, 59),
  teLoDigoBajito: range(60, 60),
  debajoDeEsto: range(61, 61),
  sinAdornos: range(62, 62),

  // ── Acto IV ──────────────────────────────────────────────
  aburridos: range(63, 63),
  rompecabezasDos: range(64, 64),
  acariciar: range(65, 66),
  mejorar: range(67, 67),
  cosasTuyas: range(68, 75),
  noSeMePasa: range(76, 81),
  gracias: range(82, 82),
  ultimoSecreto: range(83, 83),
  teElijo: range(84, 84),
  final: range(85, 85),
};

/**
 * Comprobación de que ninguna foto se queda huérfana ni sale dos veces.
 * Se ejecuta sola en local (ver main.js); en producción no cuesta nada.
 */
export function auditGroups() {
  const used = new Map();
  for (const [name, list] of Object.entries(groups)) {
    for (const photo of list) {
      if (used.has(photo.id)) used.get(photo.id).push(name);
      else used.set(photo.id, [name]);
    }
  }
  const missing = photos.filter((p) => !used.has(p.id)).map((p) => p.number);
  const duplicated = [...used]
    .filter(([, where]) => where.length > 1)
    .map(([id, where]) => `${id}: ${where.join(" + ")}`);
  return { total: TOTAL, assigned: used.size, missing, duplicated };
}
