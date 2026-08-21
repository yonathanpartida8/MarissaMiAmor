/**
 * TEXTURAS PROCEDURALES.
 *
 * El papel del libro necesita fibra y el aire necesita grano de película.
 * Descargar imágenes para eso serían cientos de kilobytes; aquí se generan
 * una sola vez en un canvas al arrancar y se reparten como data-URI, que el
 * navegador cachea en memoria y repite por CSS sin coste.
 */

import { seeded } from "../utils/rng.js";

const cache = new Map();

/** Ruido monocromo fino: el grano de película sobre toda la escena. */
function filmGrain(size = 180, opacity = 26) {
  const key = `grain-${size}-${opacity}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const rng = seeded("grano");

  for (let i = 0; i < image.data.length; i += 4) {
    const v = 128 + (rng.next() - 0.5) * 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = opacity;
  }
  ctx.putImageData(image, 0, 0);

  const url = `url("${canvas.toDataURL("image/png")}")`;
  cache.set(key, url);
  return url;
}

/**
 * Fibra de papel: ruido suave + hebras horizontales tenues, como el papel
 * de algodón de una carta buena.
 */
function paperFiber(size = 256) {
  const key = `paper-${size}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rng = seeded("papel");

  // Base cálida translúcida
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, size, size);

  // Motas de fibra
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = rng.next();
    const dark = v < 0.5;
    image.data[i] = dark ? 90 : 255;
    image.data[i + 1] = dark ? 78 : 250;
    image.data[i + 2] = dark ? 64 : 240;
    image.data[i + 3] = Math.floor(rng.next() * 16);
  }
  ctx.putImageData(image, 0, 0);

  // Hebras: trazos largos y casi invisibles que dan dirección al papel
  ctx.globalAlpha = 0.05;
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const y = rng.range(0, size);
    ctx.strokeStyle = rng.next() > 0.5 ? "#ffffff" : "#7a6a58";
    ctx.beginPath();
    ctx.moveTo(rng.range(-20, size), y);
    ctx.bezierCurveTo(
      rng.range(0, size), y + rng.range(-2, 2),
      rng.range(0, size), y + rng.range(-2, 2),
      rng.range(0, size + 20), y + rng.range(-3, 3)
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const url = `url("${canvas.toDataURL("image/png")}")`;
  cache.set(key, url);
  return url;
}


/** Instala las texturas como variables CSS globales. Se llama una vez. */
export function installTextures() {
  const root = document.documentElement;
  root.style.setProperty("--grain-src", filmGrain());
  root.style.setProperty("--paper-src", paperFiber());
}
