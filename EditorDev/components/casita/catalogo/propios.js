/**
 * (Fase 76) TUS OBJETOS EN LA CASITA: las imágenes de `assets/objetos-casita/<categoría>/` salen en «Acomodar» como
 * objetos de verdad (de su tamaño, con sombra, que se mueven, se giran, se abren y se prenden).
 *
 *   · La lista sale de `assets/objetos-casita/indice.json` (la arma la acción de GitHub o
 *     `node herramientas/objetos-casita.mjs`). Con el servidor de casa también se ve lo recién dejado.
 *   · Cómo se leen los nombres (frente, derecha, izquierda, atrás, abierto, funcionando1, 2…): propios-nombres.js.
 *   · Al girarlo se ve la imagen de ese lado (si no hay izquierda, la derecha al revés). Abierto: se ve su imagen de
 *     abierto. Funcionando: sus cuadros en bucle hasta que lo vuelvas a tocar.
 *   · A las .jpg se les quita el fondo liso de las orillas (no tienen transparencia).
 */
import { CATALOGO } from "./index.js";
import { armarObjetos, carpetaDe, CARPETAS, IMAGEN, medida } from "./propios-nombres.js";
import { rutaAUrl } from "../../../assets/biblioteca.js";
import { listar } from "../../../componentes/catalogo.js";

const LADOS = ["frente", "derecha", "atras", "izquierda"];   // 0°, 90°, 180°, 270°
const URLS = new Map();   // ruta → url lista (con el fondo quitado si era .jpg)

/** Carga una imagen (y, si es .jpg, le quita el fondo liso que toca las orillas). Las muy grandes se achican. */
function preparar(ruta) {
  if (URLS.has(ruta)) return URLS.get(ruta);
  const p = (async () => {
    const url = rutaAUrl(ruta), im = new Image();
    im.decoding = "async"; im.src = url;
    try { await im.decode(); } catch (e) { return null; }
    const W0 = im.naturalWidth, H0 = im.naturalHeight, jpg = /\.jpe?g$/i.test(ruta), MAX = 768;
    if (!jpg && Math.max(W0, H0) <= MAX) return { url, w: W0, h: H0 };
    const k = Math.min(1, MAX / Math.max(W0, H0)), W = Math.max(1, Math.round(W0 * k)), H = Math.max(1, Math.round(H0 * k));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.imageSmoothingEnabled = k < 1; cx.drawImage(im, 0, 0, W, H);
    if (jpg) quitarFondo(cx, W, H);
    return { url: cv.toDataURL("image/png"), w: W0, h: H0 };
  })();
  URLS.set(ruta, p);
  return p;
}
/** El fondo liso de una .jpg: desde las orillas, todo lo que se parece al color de las esquinas se vuelve transparente. */
function quitarFondo(cx, W, H) {
  const im = cx.getImageData(0, 0, W, H), d = im.data, ref = [];
  for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) { const i = (y * W + x) * 4; ref.push([d[i], d[i + 1], d[i + 2]]); }
  const parece = (i) => ref.some((c) => Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]) <= 54);
  const visto = new Uint8Array(W * H), cola = new Int32Array(W * H);
  let a = 0, b = 0;
  const meter = (q) => { if (!visto[q] && parece(q * 4)) { visto[q] = 1; cola[b++] = q; } };
  for (let x = 0; x < W; x++) { meter(x); meter((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { meter(y * W); meter(y * W + W - 1); }
  while (a < b) { const q = cola[a++], x = q % W; if (x > 0) meter(q - 1); if (x < W - 1) meter(q + 1); if (q >= W) meter(q - W); if (q < W * (H - 1)) meter(q + W); }
  if (b > W * H * 0.97) return;   // (casi todo era «fondo»: mejor no tocarla)
  for (let q = 0; q < W * H; q++) if (visto[q]) d[q * 4 + 3] = 0;
  cx.putImageData(im, 0, 0);
}

/** Los cuadros de la animación: una regla de CSS por cuántos cuadros tiene (cada cuadro se ve en su turno). */
const HECHAS = new Set();
function reglaCuadros(n) {
  if (HECHAS.has(n) || typeof document === "undefined") return;
  HECHAS.add(n);
  let st = document.getElementById("ca-propios-css");
  if (!st) { st = document.createElement("style"); st.id = "ca-propios-css"; document.head.append(st); }
  st.textContent += `@keyframes caCuadro${n}{0%{opacity:1}${(100 / n).toFixed(3)}%{opacity:0}100%{opacity:0}}`;
}

/** El dibujo de tu objeto: su imagen del lado al que mira y, encima, su estado (abierto, funcionando). */
function arteDe(d, e) {
  const g = ((((+e?.giro || 0) % 360) + 360) % 360), lado = LADOS[Math.round(g / 90) % 4];
  const F = d.fotos, w = d.w, h = d.h, liso = d.pixelado ? "image-rendering:pixelated;" : "";
  // Si falta ese lado: la izquierda es la derecha al revés (y al revés), y de espaldas, el frente.
  const pick = (tabla, l) => (tabla[l] ? [tabla[l], false] : l === "izquierda" && tabla.derecha ? [tabla.derecha, true] : l === "derecha" && tabla.izquierda ? [tabla.izquierda, true] : [tabla.frente || F.frente, false]);
  const img = ([u, espejo], clase = "", anim = "") => `<image href="${u}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"${espejo ? ` transform="translate(${w} 0) scale(-1 1)"` : ""}${clase ? ` class="${clase}"` : ""}${liso || anim ? ` style="${liso}${anim}"` : ""}/>`;
  let s = `<g class="prop-base">${img(pick(F, lado))}</g>`;
  if (d.fAbierto) s += `<g class="prop-abierto">${img(pick(d.fAbierto, lado))}</g>`;
  if (d.fAnim) {
    const cuadros = d.fAnim[lado] || d.fAnim.frente || Object.values(d.fAnim)[0], n = cuadros.length, dt = 1 / (d.fps || 8);
    reglaCuadros(n);
    const espejo = !d.fAnim[lado] && lado === "izquierda" && d.fAnim.derecha;
    s += `<g class="prop-anim">${cuadros.map((u, i) => img([u, !!espejo], "prop-c", `animation:caCuadro${n} ${(n * dt).toFixed(3)}s steps(1,end) ${((i - n) * dt).toFixed(3)}s infinite;`)).join("")}</g>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}

let cargando = null;
/** Busca tus objetos (una sola vez) y los pone en el catálogo. Regresa cuántos hay. */
export function cargarPropios() {
  return (cargando ||= (async () => {
    let objs = [];
    try { const r = await fetch(rutaAUrl("assets/objetos-casita/indice.json"), { cache: "no-cache" }); if (r.ok) objs = (await r.json()).objetos || []; } catch (e) { /* sin lista */ }
    // Con el servidor de casa: lo recién dejado (sin esperar a que se rehaga la lista).
    try {
      const raiz = await listar("assets/objetos-casita/");
      if (raiz) {
        const archivos = [], infos = {};
        for (const c of raiz.filter((x) => x.endsWith("/") && carpetaDe(x.slice(0, -1)))) {
          for (const f of (await listar(`assets/objetos-casita/${c}`)) || []) {
            if (f.endsWith("/")) {
              for (const g of (await listar(`assets/objetos-casita/${c}${f}`)) || []) {
                if (IMAGEN.test(g)) archivos.push({ carpeta: c.slice(0, -1), objeto: f.slice(0, -1), archivo: g, ruta: `assets/objetos-casita/${c}${f}${g}` });
                else if (/^(info|datos)\.txt$/i.test(g)) { try { const t = await (await fetch(rutaAUrl(`assets/objetos-casita/${c}${f}${g}`), { cache: "no-store" })).text(); infos[`${carpetaDe(c.slice(0, -1))}/${f.slice(0, -1).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/@\d+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`] = t; } catch (e) { /* nada */ } }
              }
            } else if (IMAGEN.test(f)) archivos.push({ carpeta: c.slice(0, -1), objeto: null, archivo: f, ruta: `assets/objetos-casita/${c}${f}` });
          }
        }
        if (archivos.length) objs = armarObjetos(archivos, infos);
      }
    } catch (e) { /* nada */ }
    let n = 0;
    await Promise.all(objs.slice(0, 120).map(async (o) => { try { if (await registrar(o)) n++; } catch (e) { /* esa no */ } }));
    return n;
  })());
}

/** Un objeto tuyo en el catálogo (con sus imágenes ya cargadas: así no aparece de a poquito). */
async function registrar(o) {
  const C = CARPETAS[o.carpeta];
  if (!C || !o.vistas?.frente) return false;
  const todas = [...Object.values(o.vistas), ...Object.values(o.abierto || {}), ...Object.values(o.funcionando || {}).flat()].filter(Boolean);
  const listo = new Map();
  await Promise.all([...new Set(todas)].map(async (r) => { const v = await preparar(r); if (v) listo.set(r, v); }));
  const fr = listo.get(o.vistas.frente);
  if (!fr) return false;
  const [w, h] = medida(o, fr.w, fr.h), mapa = (t) => Object.fromEntries(Object.entries(t || {}).filter(([, r]) => listo.has(r)).map(([l, r]) => [l, listo.get(r).url]));
  const anim = Object.fromEntries(Object.entries(o.funcionando || {}).map(([l, rs]) => [l, rs.filter((r) => listo.has(r)).map((r) => listo.get(r).url)]).filter(([, l]) => l.length));
  const capa = o.capa || C.capa || "piso", lados = mapa(o.vistas), k = "prop_" + o.id.replace(/[^a-z0-9]+/gi, "_");
  const d = {
    k, n: o.nombre, cat: C.cat, capa, w, h, propio: true, ya34: true, fotos: lados, pixelado: w / fr.w >= 2,
    fAbierto: Object.keys(mapa(o.abierto)).length ? mapa(o.abierto) : null, fAnim: Object.keys(anim).length ? anim : null, fps: o.fps || 8,
    y: capa === "pared" ? 300 : capa === "alfombra" ? 556 : 505,
  };
  d.arte = (e) => arteDe(d, e);
  d.vista = () => ({ url: lados.frente, w, h });
  if (d.fAbierto || d.fAnim) d.al = "propio";
  // Girar: con lados dibujados, en cuatro vistas; sólo con espaldas, frente y espaldas; si no, no se gira.
  if (!lados.derecha && !lados.izquierda) { if (lados.atras) d.forma = "plano"; else d.noGira = true; }
  if (C.portatil && h <= 120) { d.portatil = true; if (w <= 90) d.noEstorba = true; }
  CATALOGO[k] = d;
  return true;
}
