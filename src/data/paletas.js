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
 * Todos son de la misma familia a propósito: rosas, rubores, corales,
 * duraznos, lavandas, ciruela y vino. Ni un azul frío. Ni un verde. Las
 * lavandas están para que el libro no sea un solo rojo de principio a fin:
 * las páginas de noche y de cielo respiran mejor en violeta.
 */

export const paletas = {
  // ── Los claros ────────────────────────────────────────────────────
  /** Primera luz. El rosa más tierno, el de empezar. */
  amanecer: { a: "#ffc4d6", b: "#b0406f", deep: "#1d0a14" },

  /** Rubor. Cuando algo se dice y sale color a la cara. */
  rubor: { a: "#ffa9c2", b: "#a02a58", deep: "#1a0712" },

  /** Seda. Rosa pálido con champán: lo suave, lo que se acaricia. */
  seda: { a: "#ffd1c4", b: "#b86478", deep: "#1f0d15" },

  /** Nácar. Rosa perla, para los momentos de luz limpia. */
  nacar: { a: "#ffdce6", b: "#b77391", deep: "#1c0e16" },

  /** Melocotón. Durazno tibio sobre rosa terracota: lo cálido, la tarde. */
  melocoton: { a: "#ffc6a8", b: "#c05a5e", deep: "#1d0c0f" },

  // ── Los encendidos ────────────────────────────────────────────────
  /** Azúcar. Rosa de algodón, el juguetón. */
  azucar: { a: "#ffb7d9", b: "#b0428f", deep: "#1c0a14" },

  /** Brasa. Coral encendido sobre rojo hondo: lo que arde despacio. */
  brasa: { a: "#ffa08c", b: "#b3364a", deep: "#1c0810" },

  /** Latido. El rojo del corazón. El más vivo de todos: úsalo poco. */
  latido: { a: "#ff7f9a", b: "#b01242", deep: "#1a040c" },

  // ── Los de lavanda ────────────────────────────────────────────────
  /** Lila. Lavanda con rubor: lo tierno y un poco soñado. */
  lila: { a: "#e8bdff", b: "#8a3fa8", deep: "#150a1c" },

  /** Ciruela. Orquídea sobre ciruela: lo íntimo, con elegancia. */
  ciruela: { a: "#f4a6d8", b: "#6e1f63", deep: "#140713" },

  /** Medianoche. Lavanda de estrellas sobre un violeta muy hondo: el
      cielo de las páginas que pasan de noche. */
  medianoche: { a: "#cdb8ff", b: "#4f2a7d", deep: "#0d0817" },

  // ── Los hondos ────────────────────────────────────────────────────
  /** Vino. La intimidad, la noche larga, lo que se dice bajito. */
  vino: { a: "#f3a3bd", b: "#74163a", deep: "#14040b" },

  /** Granate. El más profundo. Para lo que pesa. */
  granate: { a: "#ec8ea8", b: "#66112f", deep: "#12030a" },
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
