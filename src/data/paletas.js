/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  LOS COLORES DEL LIBRO                                           ║
 * ║                                                                  ║
 * ║  Todo lo que se ve —la luz del fondo, el brillo de los bordes,    ║
 * ║  el tono del papel, la barra de abajo— sale de aquí.             ║
 * ║                                                                  ║
 * ║  Para repintar el libro entero: cambia estos trece. No hay que    ║
 * ║  tocar ni una página.                                            ║
 * ║  Para cambiar el color de UN capítulo: escribe otro nombre en su  ║
 * ║  línea de `chapters.js`.                                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ── POR QUÉ ESTO EXISTE ───────────────────────────────────────────────
 * Antes cada capítulo llevaba su propio trío de hexadecimales escrito a
 * mano: treinta y siete tríos, ciento once colores sueltos. Cambiar el
 * tono del libro era buscarlos uno por uno, y en el camino se habían
 * colado azules, verdes y turquesas que no tenían nada que ver con lo
 * que este libro cuenta.
 *
 * Ahora un capítulo dice de qué color es, no cuál es su hexadecimal.
 *
 * ── QUÉ ES CADA UNO ───────────────────────────────────────────────────
 *   a     la luz. El acento vivo: bordes, brillos, el hilo de progreso.
 *   b     el hondo. El segundo color de la niebla, más oscuro y saturado.
 *   deep  el fondo. Casi negro, pero nunca negro: siempre queda el rescoldo.
 *
 * Una paleta romántica con personalidad: rosas vivos y limpios, corales,
 * albaricoque, champán, lavanda, violeta, un azul de estrellas y una menta
 * perla para respirar. Las noches (el `deep`) son índigo, añil y ciruela,
 * nunca un rojo sucio: así los colores brillan limpios encima.
 */

export const paletas = {
  // ── Los claros ────────────────────────────────────────────────────
  /** Primera luz. Rosa fresco sobre frambuesa, con la noche en índigo. */
  amanecer: { a: "#ffb0cb", b: "#e0457f", deep: "#1a1030" },

  /** Rubor. Rosa vivo y limpio, el de cuando algo sale a la cara. */
  rubor: { a: "#ff9fc3", b: "#d8397a", deep: "#1c0e2e" },

  /** Seda. Champán y durazno: lo suave, lo que se acaricia. */
  seda: { a: "#ffd6ae", b: "#ec7a62", deep: "#23142b" },

  /** Nácar. Menta perla y aguamarina: la luz limpia, un respiro fresco. */
  nacar: { a: "#bff3e6", b: "#35a894", deep: "#0d1b2a" },

  /** Melocotón. Albaricoque y mandarina: lo cálido, la tarde. */
  melocoton: { a: "#ffc98f", b: "#f27d4c", deep: "#26142a" },

  // ── Los encendidos ────────────────────────────────────────────────
  /** Azúcar. Algodón de azúcar y orquídea: el juguetón. */
  azucar: { a: "#ffa6e3", b: "#c83fb8", deep: "#1c0e30" },

  /** Brasa. Coral salmón sobre un rojo claro y limpio: lo que arde. */
  brasa: { a: "#ffa58a", b: "#ea4a5a", deep: "#221029" },

  /** Latido. El rosa del corazón, el más vivo de todos: úsalo poco. */
  latido: { a: "#ff82a8", b: "#e2266a", deep: "#1f0b2a" },

  // ── Los de lavanda y cielo ────────────────────────────────────────
  /** Lila. Lavanda y violeta: lo tierno y un poco soñado. */
  lila: { a: "#d9bdff", b: "#8b5cf0", deep: "#140f33" },

  /** Ciruela. Orquídea sobre ciruela clara: lo íntimo, con elegancia. */
  ciruela: { a: "#f6b0ec", b: "#a13597", deep: "#1a0c2c" },

  /** Medianoche. Azul de estrellas sobre un añil muy hondo: el cielo de
      las páginas que pasan de noche. */
  medianoche: { a: "#b3ccff", b: "#5264e0", deep: "#0b1134" },

  // ── Los hondos ────────────────────────────────────────────────────
  /** Vino → baya. Frambuesa madura sobre la noche: lo que se dice bajito. */
  vino: { a: "#ffa3c9", b: "#b8337a", deep: "#1a0b2c" },

  /** Granate → rosa de noche. Magenta hondo, para lo que pesa. */
  granate: { a: "#ffb4d6", b: "#a52c86", deep: "#170b2e" },
};

/** Si un capítulo no dice de qué color es. */
export const PALETA_POR_DEFECTO = "rubor";

/**
 * Traduce lo que ponga un capítulo en su `palette` a los tres colores.
 *
 * Acepta un nombre («vino») o, para las páginas de él en `mis-paginas/`,
 * un trío escrito a mano. Si el nombre no existe, avisa por consola y usa
 * el de por defecto en vez de dejar la página sin color.
 */
export function resolverPaleta(valor) {
  if (valor && typeof valor === "object" && valor.a) return valor;

  const nombre = typeof valor === "string" ? valor : PALETA_POR_DEFECTO;
  const paleta = paletas[nombre];
  if (paleta) return paleta;

  console.warn(
    `[colores] no existe la paleta "${nombre}". Las que hay: ${Object.keys(paletas).join(", ")}`
  );
  return paletas[PALETA_POR_DEFECTO];
}
