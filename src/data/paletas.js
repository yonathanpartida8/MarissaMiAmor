/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  LOS COLORES DEL LIBRO                                           ║
 * ║                                                                  ║
 * ║  Todo lo que se ve —la luz del fondo, el brillo de los bordes,    ║
 * ║  el tono del papel, la barra de abajo— sale de aquí.             ║
 * ║                                                                  ║
 * ║  Para repintar el libro entero: cambia estos nueve. No hay que    ║
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
 * Los tres son de la misma familia a propósito. Este libro va de una sola
 * cosa, y su color también: rosas, rubores, corales, vino y champán. Ni un
 * azul. Ni un verde. Amor y nada más.
 */

export const paletas = {
  // ── Los claros ────────────────────────────────────────────────────
  /** Primera luz. El rosa más tierno, el de empezar. */
  amanecer: { a: "#ffc2d1", b: "#a83c66", deep: "#1d0a13" },

  /** Rubor. Cuando algo se dice y sale color a la cara. */
  rubor: { a: "#ffa9bf", b: "#93264b", deep: "#1a0710" },

  /** Seda. Rosa pálido con champán: lo suave, lo que se acaricia. */
  seda: { a: "#ffd6c6", b: "#b45f7c", deep: "#1f0d14" },

  /** Nácar. Casi blanco cálido, para los momentos de luz limpia. */
  nacar: { a: "#ffe6d9", b: "#c4818a", deep: "#1e1013" },

  // ── Los encendidos ────────────────────────────────────────────────
  /** Azúcar. Rosa de algodón, el juguetón. */
  azucar: { a: "#ffbcda", b: "#ab3f8c", deep: "#1c0a0f" },

  /** Brasa. Coral encendido sobre rojo hondo: lo que arde despacio.
      El hondo tira a carmín y no a naranja: un naranja puro deja de ser
      amor y se convierte en fuego, y este libro no va de fuego. */
  brasa: { a: "#ffa593", b: "#ae3446", deep: "#1c0810" },

  /** Latido. El rojo del corazón. El más vivo de todos: úsalo poco. */
  latido: { a: "#ff8096", b: "#ad1039", deep: "#1a040c" },

  // ── Los hondos ────────────────────────────────────────────────────
  /** Vino. La intimidad, la noche larga, lo que se dice bajito. */
  vino: { a: "#f2a2b6", b: "#71142f", deep: "#14040a" },

  /** Granate. El más profundo. Para lo que pesa. */
  granate: { a: "#e98da0", b: "#631028", deep: "#120309" },
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
