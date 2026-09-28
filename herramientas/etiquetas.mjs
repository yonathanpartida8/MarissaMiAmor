/**
 * ETIQUETAS — el título y el artista que trae dentro un .mp3.
 *
 * Los teléfonos y las páginas de descarga guardan el nombre de la canción
 * dentro del archivo (ID3). Así el tocadiscos enseña «Beso · Jósean Log»
 * aunque el archivo se llame `musica3.mp3`, sin que haya que escribirlo.
 *
 *   import { etiquetas } from "./etiquetas.mjs";
 *   etiquetas(buffer)   // { titulo, artista } o null
 */

const limpiar = (s) => String(s || "").replace(/^﻿/, "").replace(/\u0000+$/g, "").replace(/\u0000/g, " ").trim();

function texto(cuerpo) {
  const cod = cuerpo[0];
  const datos = cuerpo.subarray(1);
  try {
    if (cod === 0) return limpiar(datos.toString("latin1"));
    if (cod === 3) return limpiar(datos.toString("utf8"));
    if (cod === 1 || cod === 2) {
      // UTF-16 con o sin marca de orden.
      let b = datos;
      let be = cod === 2;
      if (b[0] === 0xfe && b[1] === 0xff) { be = true; b = b.subarray(2); }
      else if (b[0] === 0xff && b[1] === 0xfe) { be = false; b = b.subarray(2); }
      const par = Buffer.from(b.subarray(0, b.length - (b.length % 2)));
      if (be) par.swap16();
      return limpiar(par.toString("utf16le"));
    }
  } catch { /* se ignora */ }
  return "";
}

const sincrono = (b, i) => ((b[i] & 0x7f) << 21) | ((b[i + 1] & 0x7f) << 14) | ((b[i + 2] & 0x7f) << 7) | (b[i + 3] & 0x7f);

export function etiquetas(buf) {
  if (!buf || buf.length < 10) return null;
  const out = {};
  if (buf.toString("latin1", 0, 3) === "ID3") {
    const ver = buf[3];
    const fin = Math.min(buf.length, 10 + sincrono(buf, 6));
    let i = 10;
    if (buf[5] & 0x40) i += ver === 4 ? sincrono(buf, 10) : buf.readUInt32BE(10) + 4; // cabecera extendida
    while (i + 10 <= fin) {
      const id = buf.toString("latin1", i, i + 4);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const tam = ver === 4 ? sincrono(buf, i + 4) : buf.readUInt32BE(i + 4);
      if (tam <= 0 || i + 10 + tam > buf.length) break;
      if (id === "TIT2") out.titulo = texto(buf.subarray(i + 10, i + 10 + tam));
      if (id === "TPE1") out.artista = texto(buf.subarray(i + 10, i + 10 + tam));
      i += 10 + tam;
    }
  }
  // ID3v1, al final del archivo, por si no había v2.
  if (!out.titulo && buf.length > 128 && buf.toString("latin1", buf.length - 128, buf.length - 125) === "TAG") {
    const b = buf.subarray(buf.length - 128);
    out.titulo = limpiar(b.toString("latin1", 3, 33));
    out.artista = limpiar(b.toString("latin1", 33, 63));
  }
  return out.titulo ? { titulo: out.titulo, artista: out.artista || "" } : null;
}
