/**
 * FOTOGRAFÍAS — las 85 imágenes del libro.
 *
 * No hay 85 páginas iguales de "una foto centrada". Las fotos se reparten en
 * experiencias: polaroids que se arrastran, una tira de cine, un campo 3D de
 * recuerdos, zonas que se rascan… Aquí sólo vive el inventario y los grupos;
 * quién usa qué lo decide el manifiesto.
 */

const BASE = "assets/img/";
const TOTAL = 85;

/** Inventario completo, en orden. */
export const photos = Array.from({ length: TOTAL }, (_, i) => {
  const n = i + 1;
  return {
    id: `f${n}`,
    src: `${BASE}imagen${n}.png`,
    index: i,
  };
});

export const photoSrc = (n) => `${BASE}imagen${n}.png`;

/** Rango inclusivo por número de archivo: range(4, 13) → imagen4…imagen13 */
export const range = (from, to) => photos.slice(from - 1, to);

/** Sólo las rutas, que es lo que suele querer el precargador. */
export const srcs = (list) => list.map((p) => p.src);

/**
 * GRUPOS — el reparto de las 85 fotos entre las experiencias del libro.
 * Cambiar un grupo aquí reorganiza el libro entero sin tocar ninguna página.
 */
export const groups = {
  cover: range(1, 1),          //  1  · la portada
  distancia: range(2, 2),      //  1  · profundidad 3D
  certeza: range(3, 3),        //  1  · rascar para revelar
  jardin: range(4, 13),        // 10  · polaroids arrastrables
  tormenta: range(14, 14),     //  1  · tras la lluvia
  gestos: range(15, 16),       //  2  · revelar con el dedo
  espejo: range(17, 17),       //  1  · reflejo
  invierno: range(18, 31),     // 14  · tira de cine
  conexion: range(32, 55),     // 24  · campo 3D de recuerdos
  solotu: range(56, 56),       //  1  · secreto con pulsación larga
  eleccion: range(57, 57),     //  1  · medallón
  contigo: range(58, 69),      // 12  · constelación
  loquesiento: range(70, 70),  //  1  · medallón
  amanera: range(71, 72),      //  2  · revelar con el dedo
  silencio: range(73, 73),     //  1  · medallón
  masdeloqueparece: range(74, 74), // 1 · rascar
  pornosotros: range(75, 75),  //  1  · medallón
  crecer: range(76, 76),       //  1  · profundidad 3D
  increible: range(77, 84),    //  8  · polaroids
  final: range(85, 85),        //  1  · el cierre
};

/** Comprobación en desarrollo: ninguna foto huérfana, ninguna repetida. */
export function auditGroups() {
  const used = new Map();
  for (const [name, list] of Object.entries(groups)) {
    for (const photo of list) {
      if (used.has(photo.id)) used.get(photo.id).push(name);
      else used.set(photo.id, [name]);
    }
  }
  const missing = photos.filter((p) => !used.has(p.id)).map((p) => p.id);
  const duplicated = [...used].filter(([, where]) => where.length > 1);
  return { total: TOTAL, assigned: used.size, missing, duplicated };
}
