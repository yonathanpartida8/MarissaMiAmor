/**
 * VERSO — el reverso de la hoja.
 *
 * Cuando una página gira, durante medio segundo se ve su otra cara. En los
 * libros baratos esa cara está en blanco; aquí lleva su número, un ornamento
 * y la fibra del papel a contraluz. Es medio segundo, pero es la diferencia
 * entre "una animación" y "un libro".
 */

import { el } from "../utils/dom.js";

const ORNAMENTS = ["❦", "✦", "❧", "✧", "◆"];

/**
 * @param {object} options
 * @param {number} options.number  número de página
 * @param {number} options.total
 * @param {string} [options.accent]
 * @param {string} [options.title]
 */
export function createVerso({ number, total, accent = "#ff87a6", title = "" }) {
  const ornament = ORNAMENTS[number % ORNAMENTS.length];

  const node = el("div.verso", { style: { "--verso-accent": accent } }, [
    el("div.verso__rule"),
    el("div.verso__mark", { text: ornament }),
    el("div.verso__num", { text: String(number).padStart(2, "0") }),
    title ? el("div.verso__title", { text: title }) : null,
    el("div.verso__rule"),
  ]);

  // Marca de agua en la esquina, sólo perceptible a contraluz.
  node.append(el("div.verso__watermark", { text: "M" }));
  return node;
}
