/**
 * VOZ — saca el audio de un .mp4 (o de un «.mp3» que en realidad es un
 * vídeo) y lo deja como un .m4a limpio, sin tocar ni un bit del sonido.
 *
 * Por qué: un vídeo del teléfono renombrado a `audio.mp3` pesa muchísimo
 * (trae la imagen), el servidor lo anuncia como MP3 y Safari se niega a
 * abrirlo; y como su índice va al final, ni siquiera Chrome empieza a
 * sonar hasta tenerlo casi entero. Aquí se copia tal cual la pista de
 * sonido (AAC) a un archivo nuevo que sólo tiene eso, con el índice al
 * principio: pesa una fracción, suena en todos lados y arranca al instante.
 *
 * No recodifica nada: son los mismos bytes de audio, en otra caja.
 *
 *   import { extraerAudio } from "./voz.mjs";
 *   const m4a = extraerAudio(bufferDelMp4);   // Buffer, o null si no hay audio
 */

/** Las cajas hijas de una caja (o del archivo entero). */
function cajas(buf, ini = 0, fin = buf.length) {
  const out = [];
  let i = ini;
  while (i + 8 <= fin) {
    let tam = buf.readUInt32BE(i);
    const tipo = buf.toString("latin1", i + 4, i + 8);
    let cab = 8;
    if (tam === 1) {
      tam = Number(buf.readBigUInt64BE(i + 8));
      cab = 16;
    } else if (tam === 0) tam = fin - i;
    if (tam < cab || i + tam > fin) break;
    out.push({ tipo, ini: i, cab, fin: i + tam, datos: i + cab });
    i += tam;
  }
  return out;
}
const hija = (buf, caja, tipo) => cajas(buf, caja.datos, caja.fin).find((c) => c.tipo === tipo);
const hijas = (buf, caja) => cajas(buf, caja.datos, caja.fin);

/** Escribe una caja: tamaño + tipo + contenido. */
function caja(tipo, ...partes) {
  const cuerpo = Buffer.concat(partes.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));
  const cab = Buffer.alloc(8);
  cab.writeUInt32BE(8 + cuerpo.length, 0);
  cab.write(tipo, 4, "latin1");
  return Buffer.concat([cab, cuerpo]);
}
const copia = (buf, c) => buf.subarray(c.ini, c.fin);

export function extraerAudio(buf) {
  if (!buf || buf.length < 16 || buf.toString("latin1", 4, 8) !== "ftyp") return null;
  const moov = cajas(buf).find((c) => c.tipo === "moov");
  if (!moov) return null;
  const mvhd = hija(buf, moov, "mvhd");

  // La pista de sonido.
  let trak = null;
  for (const t of hijas(buf, moov).filter((c) => c.tipo === "trak")) {
    const mdia = hija(buf, t, "mdia");
    const hdlr = mdia && hija(buf, mdia, "hdlr");
    if (hdlr && buf.toString("latin1", hdlr.datos + 8, hdlr.datos + 12) === "soun") { trak = t; break; }
  }
  if (!trak || !mvhd) return null;
  const tkhd = hija(buf, trak, "tkhd");
  const edts = hija(buf, trak, "edts");
  const mdia = hija(buf, trak, "mdia");
  const mdhd = hija(buf, mdia, "mdhd");
  const hdlr = hija(buf, mdia, "hdlr");
  const minf = hija(buf, mdia, "minf");
  const stbl = hija(buf, minf, "stbl");
  const hijosStbl = hijas(buf, stbl);
  const stsz = hijosStbl.find((c) => c.tipo === "stsz");
  const stsc = hijosStbl.find((c) => c.tipo === "stsc");
  const stco = hijosStbl.find((c) => c.tipo === "stco" || c.tipo === "co64");
  if (!stsz || !stsc || !stco) return null;

  // Tamaño de cada muestra.
  const tamUnico = buf.readUInt32BE(stsz.datos + 4);
  const nMuestras = buf.readUInt32BE(stsz.datos + 8);
  const tamDe = (k) => (tamUnico || buf.readUInt32BE(stsz.datos + 12 + k * 4));

  // Dónde empieza cada trozo (chunk) en el archivo original.
  const nTrozos = buf.readUInt32BE(stco.datos + 4);
  const offs = [];
  for (let k = 0; k < nTrozos; k++) {
    offs.push(stco.tipo === "co64"
      ? Number(buf.readBigUInt64BE(stco.datos + 8 + k * 8))
      : buf.readUInt32BE(stco.datos + 8 + k * 4));
  }

  // Cuántas muestras lleva cada trozo (stsc va por tramos).
  const nTramos = buf.readUInt32BE(stsc.datos + 4);
  const tramos = [];
  for (let k = 0; k < nTramos; k++) {
    const p = stsc.datos + 8 + k * 12;
    tramos.push([buf.readUInt32BE(p), buf.readUInt32BE(p + 4)]);
  }
  const porTrozo = [];
  for (let k = 0; k < nTramos; k++) {
    const [primero, cuantas] = tramos[k];
    const hasta = k + 1 < nTramos ? tramos[k + 1][0] : nTrozos + 1;
    for (let c = primero; c < hasta; c++) porTrozo[c - 1] = cuantas;
  }

  // Los bytes de cada trozo, seguidos, tal cual.
  const pedazos = [];
  let muestra = 0;
  for (let c = 0; c < nTrozos; c++) {
    let tam = 0;
    for (let s = 0; s < (porTrozo[c] || 0) && muestra < nMuestras; s++) tam += tamDe(muestra++);
    if (offs[c] + tam > buf.length) return null;
    pedazos.push(buf.subarray(offs[c], offs[c] + tam));
  }
  if (muestra !== nMuestras) return null;

  // El archivo nuevo: ftyp · moov (sólo el sonido) · mdat.
  const ftyp = caja("ftyp", "M4A ", Buffer.alloc(4), "M4A mp42isom");

  const nuevoMvhd = Buffer.from(copia(buf, mvhd));
  // next_track_ID (los últimos 4 bytes de mvhd) = 2.
  nuevoMvhd.writeUInt32BE(2, nuevoMvhd.length - 4);
  const nuevoTkhd = Buffer.from(copia(buf, tkhd));
  const v = nuevoTkhd[8];
  nuevoTkhd.writeUInt32BE(1, 8 + (v === 1 ? 20 : 12)); // track_ID = 1

  const armar = (offsetDatos) => {
    const tabla = Buffer.alloc(8 + pedazos.length * 4);
    tabla.writeUInt32BE(pedazos.length, 4);
    let o = offsetDatos;
    pedazos.forEach((p, k) => { tabla.writeUInt32BE(o, 8 + k * 4); o += p.length; });
    const nuevoStbl = caja(
      "stbl",
      ...hijosStbl.filter((c) => c.tipo !== "stco" && c.tipo !== "co64").map((c) => copia(buf, c)),
      caja("stco", tabla)
    );
    const nuevoMinf = caja("minf", ...hijas(buf, minf).filter((c) => c.tipo !== "stbl").map((c) => copia(buf, c)), nuevoStbl);
    const nuevaMdia = caja("mdia", copia(buf, mdhd), copia(buf, hdlr), nuevoMinf);
    const nuevoTrak = caja("trak", nuevoTkhd, ...(edts ? [copia(buf, edts)] : []), nuevaMdia);
    return caja("moov", nuevoMvhd, nuevoTrak);
  };
  // Dos pasadas: la primera para saber cuánto mide el moov (y así dónde
  // empezará el sonido); el tamaño no cambia al poner los números buenos.
  const tamMoov = armar(0).length;
  const moovNuevo = armar(ftyp.length + tamMoov + 8);
  const total = pedazos.reduce((a, p) => a + p.length, 0);
  const cabMdat = Buffer.alloc(8);
  cabMdat.writeUInt32BE(8 + total, 0);
  cabMdat.write("mdat", 4, "latin1");
  return Buffer.concat([ftyp, moovNuevo, cabMdat, ...pedazos]);
}

/** Si el buffer es un contenedor MP4 (y no un MP3 de verdad). */
export const esMp4 = (buf) => buf && buf.length > 12 && buf.toString("latin1", 4, 8) === "ftyp";
