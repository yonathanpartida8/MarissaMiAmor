/**
 * DIBUJOS — adornos ligeros, en vectores, que cambian de color.
 *
 * Cada uno es un SVG de pocos cientos de bytes que pinta con
 * `currentColor`, así el color se elige desde el editor. No se descarga
 * nada: viven aquí.
 */

const S = (cuerpo, vb = "0 0 100 100") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="currentColor">${cuerpo}</svg>`;
const T = (cuerpo, g = 5, vb = "0 0 100 100") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`;

const CORAZON = "M50 88C24 70 6 55 6 34 6 19 17 8 31 8c8 0 15 4 19 11C54 12 61 8 69 8c14 0 25 11 25 26 0 21-18 36-44 54z";

export const DIBUJOS = [
  { id: "corazon", n: "Corazón", svg: S(`<path d="${CORAZON}"/>`) },
  { id: "corazon-linea", n: "Corazón a línea", svg: T(`<path d="${CORAZON}"/>`, 5) },
  { id: "corazones", n: "Corazoncitos", svg: S(`<path transform="translate(4 30) scale(.5)" d="${CORAZON}"/><path transform="translate(50 6) scale(.42)" d="${CORAZON}" opacity=".75"/><path transform="translate(56 56) scale(.36)" d="${CORAZON}" opacity=".55"/>`) },
  { id: "estrella", n: "Estrella", svg: S('<path d="M50 5l13 28 31 4-23 21 6 31-27-15-27 15 6-31L6 37l31-4z"/>') },
  { id: "brillo", n: "Brillo", svg: S('<path d="M50 2c4 30 18 44 48 48-30 4-44 18-48 48-4-30-18-44-48-48 30-4 44-18 48-48z"/>') },
  { id: "brillos", n: "Destellos", svg: S('<path d="M34 10c3 20 12 29 32 32-20 3-29 12-32 32-3-20-12-29-32-32 20-3 29-12 32-32z"/><path d="M76 52c2 12 7 17 19 19-12 2-17 7-19 19-2-12-7-17-19-19 12-2 17-7 19-19z" opacity=".7"/>') },
  { id: "flor", n: "Flor", svg: S('<g transform="translate(50 50)"><g opacity=".9"><ellipse rx="15" ry="26" cy="-24"/><ellipse rx="15" ry="26" cy="-24" transform="rotate(72)"/><ellipse rx="15" ry="26" cy="-24" transform="rotate(144)"/><ellipse rx="15" ry="26" cy="-24" transform="rotate(216)"/><ellipse rx="15" ry="26" cy="-24" transform="rotate(288)"/></g><circle r="13" fill="#ffe0a3"/></g>') },
  { id: "tulipan", n: "Tulipán", svg: S('<path d="M50 60C32 60 24 46 24 30l10 8 8-18 8 14 8-14 8 18 10-8c0 16-8 30-26 30z"/><path d="M48 60h4v36h-4z" opacity=".7"/><path d="M50 84c-10-2-18-10-20-20 10 2 18 8 20 20zM50 80c8-2 15-9 17-17-8 2-15 8-17 17z" opacity=".55"/>') },
  { id: "hoja", n: "Hojita", svg: S('<path d="M12 88C12 40 40 12 90 10 88 60 60 88 12 88z"/><path d="M14 86L80 20" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>') },
  { id: "rama", n: "Ramita", svg: T('<path d="M8 90C40 70 60 40 92 10"/><path d="M30 76c-12-2-18-12-16-22 10 4 16 12 16 22zM48 58c-2-12 4-22 16-24-2 12-8 20-16 24zM62 40c-12-4-16-14-12-24 10 6 14 14 12 24zM78 24c0-10 8-18 18-18-2 10-8 16-18 18z"/>', 4) },
  { id: "luna", n: "Luna", svg: S('<path d="M64 6A46 46 0 1 0 94 70 38 38 0 1 1 64 6z"/>') },
  { id: "sol", n: "Sol", svg: S('<circle cx="50" cy="50" r="20"/><g stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M50 6v14M50 80v14M6 50h14M80 50h14M19 19l10 10M71 71l10 10M19 81l10-10M71 29l10-10"/></g>') },
  { id: "nube", n: "Nube", svg: S('<path d="M26 78C13 78 5 70 5 59s8-19 19-19c2-14 13-24 27-24 13 0 23 9 26 21 10 0 18 8 18 19 0 12-9 22-21 22z"/>') },
  { id: "mariposa", n: "Mariposa", svg: S('<path d="M48 48C38 20 12 12 8 26c-4 16 14 26 38 26C22 56 12 72 22 82c10 8 24-6 26-26z"/><path d="M52 48C62 20 88 12 92 26c4 16-14 26-38 26 24 4 34 20 24 30-10 8-24-6-26-26z" opacity=".85"/><rect x="47" y="34" width="6" height="40" rx="3" opacity=".9"/>') },
  { id: "lazo", n: "Moño", svg: S('<path d="M50 44C38 26 10 18 8 34c-2 14 16 22 40 16zM50 44c12-18 40-26 42-10 2 14-16 22-40 16z"/><path d="M44 52L30 92l14-8 6 10 6-42z" opacity=".85"/><path d="M56 52l14 40-14-8-6 10z" opacity=".7"/><circle cx="50" cy="46" r="8"/>') },
  { id: "anillo", n: "Anillo", svg: T('<circle cx="50" cy="62" r="28"/><path d="M38 22l12-12 12 12-12 12z" fill="currentColor"/>', 7) },
  { id: "sobre", n: "Cartita", svg: T('<rect x="8" y="22" width="84" height="58" rx="6"/><path d="M10 26l40 30 40-30"/><path transform="translate(39 52) scale(.22)" d="' + CORAZON + '" fill="currentColor" stroke="none"/>', 5) },
  { id: "candado", n: "Candado", svg: S('<path d="M30 44V32a20 20 0 0 1 40 0v12h-8V32a12 12 0 0 0-24 0v12z"/><rect x="20" y="44" width="60" height="46" rx="8"/><path transform="translate(39 56) scale(.22)" d="' + CORAZON + '" fill="#fff"/>') },
  { id: "infinito", n: "Infinito", svg: T('<path d="M50 50c-10-14-20-20-30-20a20 20 0 0 0 0 40c10 0 20-6 30-20s20-20 30-20a20 20 0 0 1 0 40c-10 0-20-6-30-20z"/>', 7) },
  { id: "burbuja", n: "Globo de diálogo", svg: S('<path d="M14 12h72a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H40L20 90l4-18H14a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z"/>') },
  { id: "ola", n: "Línea ondulada", svg: T('<path d="M4 50c8-16 16-16 24 0s16 16 24 0 16-16 24 0 16 16 20 0"/>', 6) },
  { id: "flecha", n: "Flecha curva", svg: T('<path d="M10 78C30 30 60 18 88 24"/><path d="M72 12l16 12-14 14"/>', 6) },
  { id: "circulo", n: "Círculo a mano", svg: T('<path d="M52 10c26 0 40 18 40 38 0 24-20 42-44 42S8 74 8 50 26 12 46 12c6 0 10 2 12 4"/>', 4) },
  { id: "subrayado", n: "Subrayado", svg: T('<path d="M4 60c30-10 60-12 92-6M14 74c24-6 50-8 74-4"/>', 6) },
  { id: "esquina", n: "Esquina floral", svg: T('<path d="M8 92V40C8 22 22 8 40 8h52"/><path d="M8 60c12 0 20-8 20-20-12 0-20 8-20 20zM40 8c0 12 8 20 20 20 0-12-8-20-20-20z" fill="currentColor"/><circle cx="24" cy="24" r="6" fill="currentColor"/>', 4) },
  { id: "confeti", n: "Confeti", svg: S('<rect x="10" y="14" width="10" height="5" rx="2" transform="rotate(30 15 16)"/><circle cx="42" cy="12" r="4" opacity=".7"/><rect x="66" y="10" width="11" height="5" rx="2" transform="rotate(-25 71 12)" opacity=".85"/><circle cx="86" cy="34" r="3.5"/><rect x="24" y="40" width="10" height="5" rx="2" transform="rotate(-40 29 42)" opacity=".6"/><circle cx="56" cy="44" r="4.5" opacity=".9"/><rect x="74" y="60" width="11" height="5" rx="2" transform="rotate(50 79 62)"/><circle cx="14" cy="70" r="4" opacity=".75"/><rect x="40" y="72" width="10" height="5" rx="2" transform="rotate(15 45 74)" opacity=".8"/><circle cx="64" cy="88" r="3.5" opacity=".6"/><path transform="translate(80 80) scale(.16)" d="' + CORAZON + '"/>') },
  { id: "puntos", n: "Puntitos", svg: S('<circle cx="20" cy="20" r="5"/><circle cx="50" cy="20" r="5" opacity=".7"/><circle cx="80" cy="20" r="5" opacity=".5"/><circle cx="20" cy="50" r="5" opacity=".7"/><circle cx="50" cy="50" r="5" opacity=".5"/><circle cx="80" cy="50" r="5" opacity=".7"/><circle cx="20" cy="80" r="5" opacity=".5"/><circle cx="50" cy="80" r="5" opacity=".7"/><circle cx="80" cy="80" r="5"/>') },
];

export const FORMAS = [
  { id: "rect", n: "Rectángulo" },
  { id: "circulo", n: "Círculo" },
  { id: "linea", n: "Línea" },
  { id: "corazon", n: "Corazón" },
  { id: "estrella", n: "Estrella" },
  { id: "triangulo", n: "Triángulo" },
  { id: "rombo", n: "Rombo" },
  { id: "hexagono", n: "Hexágono" },
  { id: "arco", n: "Arco" },
  { id: "gota", n: "Gota" },
  { id: "nube", n: "Nube" },
  { id: "ola", n: "Ola" },
];
