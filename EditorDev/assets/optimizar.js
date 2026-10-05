/**
 * OPTIMIZAR FOTOS — al subirlas, no al exportar.
 *
 * Una foto del teléfono pesa 3–6 MB y mide 4000 px: el librito la enseña a
 * 400. Se reduce a 2048 px por el lado largo y se guarda en WebP (o JPEG si
 * el navegador no sabe escribir WebP), salvo que lo nuevo pese más que lo
 * original, que entonces se queda la original. Los GIF y SVG no se tocan
 * (se romperían la animación y los vectores).
 */

const LADO = 2048;
const UMBRAL = 900 * 1024;

function aBlob(canvas, tipo, calidad) {
  return new Promise((ok) => canvas.toBlob(ok, tipo, calidad));
}

function tieneTransparencia(bmp) {
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(bmp, 0, 0, 48, 48);
  const d = g.getImageData(0, 0, 48, 48).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

/** Devuelve { blob, w, h } listo para guardar. */
export async function optimizarImagen(file) {
  if (/gif|svg/i.test(file.type)) {
    const dim = await medir(file).catch(() => ({ w: 0, h: 0 }));
    return { blob: file, ...dim };
  }
  let bmp;
  try { bmp = await createImageBitmap(file); } catch (e) {
    const dim = await medir(file).catch(() => ({ w: 0, h: 0 }));
    return { blob: file, ...dim };
  }
  const w0 = bmp.width, h0 = bmp.height;
  const k = Math.min(1, LADO / Math.max(w0, h0));
  if (k === 1 && file.size < UMBRAL) { bmp.close?.(); return { blob: file, w: w0, h: h0 }; }
  const w = Math.round(w0 * k), h = Math.round(h0 * k);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(bmp, 0, 0, w, h);
  const alfa = /png|webp/i.test(file.type) && tieneTransparencia(bmp);
  bmp.close?.();
  let blob = await aBlob(c, "image/webp", 0.86);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(c, alfa ? "image/png" : "image/jpeg", 0.86);
  if (!blob || blob.size >= file.size) return { blob: file, w: w0, h: h0 };
  return { blob, w, h };
}

export function medir(blob) {
  return new Promise((ok, mal) => {
    const u = URL.createObjectURL(blob);
    const i = new Image();
    i.onload = () => { ok({ w: i.naturalWidth, h: i.naturalHeight }); URL.revokeObjectURL(u); };
    i.onerror = () => { URL.revokeObjectURL(u); mal(new Error("imagen")); };
    i.src = u;
  });
}

export function medirVideo(blob) {
  return new Promise((ok) => {
    const u = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { ok({ w: v.videoWidth, h: v.videoHeight, dur: v.duration }); URL.revokeObjectURL(u); };
    v.onerror = () => { ok({ w: 0, h: 0 }); URL.revokeObjectURL(u); };
    v.src = u;
  });
}
