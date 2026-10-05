/**
 * ZIP — escribir y leer archivos .zip sin librerías.
 *
 * Fotos, canciones y vídeos ya vienen comprimidos: se guardan tal cual
 * («store»). El código y los datos (html, js, css, json) se comprimen con el
 * `CompressionStream` del navegador si lo tiene; si no, también tal cual.
 * El resultado es un .zip normal que abre cualquier teléfono o computadora.
 */

const TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(datos) {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const enc = new TextEncoder();

async function comprimir(datos) {
  if (typeof CompressionStream !== "function") return null;
  try {
    const s = new Blob([datos]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(s).arrayBuffer());
  } catch (e) { return null; }
}

async function descomprimir(datos) {
  const s = new Blob([datos]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

function fechaDos(d = new Date()) {
  const t = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const f = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return [t, f];
}

const TEXTO = /\.(html?|js|mjs|css|json|txt|md|svg|webmanifest)$/i;

export class Zip {
  constructor() { this.entradas = []; this.nombres = new Set(); }

  tiene(nombre) { return this.nombres.has(nombre); }

  /** datos: string, Uint8Array o Blob. */
  agregar(nombre, datos) {
    if (this.nombres.has(nombre)) return;
    this.nombres.add(nombre);
    this.entradas.push({ nombre, datos });
  }

  get tamano() { return this.entradas.length; }

  async generar(alProgreso) {
    const partes = [];
    const central = [];
    let pos = 0;
    const [hora, dia] = fechaDos();
    let i = 0;
    for (const e of this.entradas) {
      alProgreso?.(i++, this.entradas.length, e.nombre);
      let datos = e.datos;
      if (typeof datos === "string") datos = enc.encode(datos);
      else if (datos instanceof Blob) datos = new Uint8Array(await datos.arrayBuffer());
      const crc = crc32(datos);
      let metodo = 0, cuerpo = datos;
      if (TEXTO.test(e.nombre) && datos.length > 512) {
        const c = await comprimir(datos);
        if (c && c.length < datos.length) { metodo = 8; cuerpo = c; }
      }
      const nom = enc.encode(e.nombre);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, metodo, true);
      lh.setUint16(10, hora, true);
      lh.setUint16(12, dia, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, cuerpo.length, true);
      lh.setUint32(22, datos.length, true);
      lh.setUint16(26, nom.length, true);
      lh.setUint16(28, 0, true);
      partes.push(lh.buffer, nom, cuerpo);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, metodo, true);
      ch.setUint16(12, hora, true);
      ch.setUint16(14, dia, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, cuerpo.length, true);
      ch.setUint32(24, datos.length, true);
      ch.setUint16(28, nom.length, true);
      ch.setUint32(42, pos, true);
      central.push(ch.buffer, nom);
      pos += 30 + nom.length + cuerpo.length;
    }
    const tamCentral = central.reduce((s, b) => s + (b.byteLength ?? b.length), 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true);
    fin.setUint16(8, this.entradas.length, true);
    fin.setUint16(10, this.entradas.length, true);
    fin.setUint32(12, tamCentral, true);
    fin.setUint32(16, pos, true);
    return new Blob([...partes, ...central, fin.buffer], { type: "application/zip" });
  }
}

/** Lee un .zip: devuelve { nombre: async () => Uint8Array }. */
export async function leerZip(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("no es un .zip");
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const dec = new TextDecoder();
  const archivos = {};
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("zip dañado");
    const metodo = dv.getUint16(p + 10, true);
    const tam = dv.getUint32(p + 20, true);
    const ln = dv.getUint16(p + 28, true), lx = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const nombre = dec.decode(buf.subarray(p + 46, p + 46 + ln));
    const ini = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const datos = buf.subarray(ini, ini + tam);
    archivos[nombre] = () => (metodo === 8 ? descomprimir(datos) : Promise.resolve(datos));
    p += 46 + ln + lx + lc;
  }
  return archivos;
}
