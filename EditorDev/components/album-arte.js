/**
 * EL ARTE DEL ÁLBUM — los dibujitos del menú principal (todo en SVG o en un
 * lienzo, nada que descargar): la textura del papel, los bordes rasgados, el
 * corazón de píxeles, las flores secas, los garabatos, las fotos de las
 * polaroids cuando todavía no hay foto, los iconos de las tarjetas y el
 * gatito dormido (en piezas, para que respire y mueva la cola sin repintar).
 */

/** La textura del papel: una vez, en un lienzo chiquito que se repite (fibras y motitas). */
let TEX = null;
export function texturaPapel() {
  if (TEX) return TEX;
  try {
    const c = document.createElement("canvas"), n = 220;
    c.width = c.height = n;
    const g = c.getContext("2d");
    let s = 7;
    const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      const v = az() < 0.5 ? 0 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${0.025 + az() * 0.05})`;
      g.fillRect(az() * n, az() * n, 1 + az() * 1.6, 1 + az() * 1.6);
    }
    g.lineCap = "round";
    for (let i = 0; i < 46; i++) {
      const x = az() * n, y = az() * n, a = az() * Math.PI, l = 4 + az() * 14;
      g.strokeStyle = `rgba(120, 80, 70, ${0.04 + az() * 0.05})`;
      g.lineWidth = 0.5 + az() * 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + az() * 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    TEX = c.toDataURL("image/png");
  } catch (e) { TEX = ""; }
  return TEX;
}

/**
 * Un borde rasgado (clip-path) para un papel: dientes chiquitos al azar en los
 * lados que se pidan («arriba», «abajo», «izq», «der»). `d` = cuánto muerde (%).
 */
export function rasgado(lados = ["arriba", "abajo"], d = 2.4, pasos = 26, semilla = 1) {
  let s = semilla * 9301 + 49297;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const L = new Set(lados), pts = [];
  const borde = (desde, hasta, fijo, eje, hacia) => {
    for (let i = 0; i <= pasos; i++) {
      const t = desde + ((hasta - desde) * i) / pasos;
      const m = (az() * d * (i % 2 ? 1 : 0.45)) * hacia;
      pts.push(eje === "x" ? `${t.toFixed(2)}% ${(fijo + m).toFixed(2)}%` : `${(fijo + m).toFixed(2)}% ${t.toFixed(2)}%`);
    }
  };
  if (L.has("arriba")) borde(0, 100, 0, "x", 1); else pts.push("0% 0%", "100% 0%");
  if (L.has("der")) borde(0, 100, 100, "y", -1); else pts.push("100% 100%");
  if (L.has("abajo")) borde(100, 0, 100, "x", -1); else pts.push("0% 100%");
  if (L.has("izq")) borde(100, 0, 0, "y", 1);
  return `polygon(${pts.join(", ")})`;
}

/* ── El corazón de píxeles de M.YNTHN ── */
const PIX = ["  XX   XX  ", " XPPX XMMX ", "XPPMMXMMMMX", "XPMMMMMMMMX", "XMMMMMMMMMX", " XMMMMMMMX ", "  XMMMMMX  ", "   XMMMX   ", "    XMX    ", "     X     "];
const PIXC = { X: "#3a1734", M: "#6b2d5e", P: "#ff8fb4" };
export const CORAZON_PIXEL = `<svg viewBox="0 0 11 10" shape-rendering="crispEdges" aria-hidden="true">${PIX.map((f, y) => [...f].map((c, x) => (PIXC[c] ? `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${PIXC[c]}"/>` : "")).join("")).join("")}</svg>`;

export const CORONITA = '<svg viewBox="0 0 26 18" aria-hidden="true"><path d="M3 15.5L4.8 5.5l5 5.2L13 2.8l3.2 7.9 5-5.2L23 15.5z" fill="none" stroke="#b98fb6" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="2.4" r="1.3" fill="#e9a3c3"/><circle cx="4.6" cy="5" r="1" fill="#e9a3c3"/><circle cx="21.4" cy="5" r="1" fill="#e9a3c3"/></svg>';
export const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ── Garabatos de marcador ── */
export const GARABATO_CORAZON = '<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M20 32C11 25 4 19 4.5 11.5 5 6 10 3.5 14.5 5c2.6.9 4.3 3.2 5.5 5.6 1.3-2.6 3.3-5 6.2-5.7C30.8 3.8 35.6 7 35.4 12.6 35.1 20 28 25.6 20 32z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 30.5c-7.4-5.8-13-10.6-13.4-17" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".55"/></svg>';
export const GARABATO_CORAZONES = '<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M14 24c-5-4-9-7-8.6-11.3.3-3 3.3-4.6 5.8-3.6 1.4.6 2.3 1.8 2.9 3.1.7-1.4 1.8-2.6 3.4-3 2.6-.6 5.2 1.3 5 4.4-.3 4.1-4.3 7.2-8.5 10.4z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 36c-3.4-2.7-6.2-4.8-5.9-7.7.2-2 2.3-3.1 4-2.5 1 .4 1.6 1.2 2 2.1.5-1 1.2-1.8 2.3-2 1.8-.4 3.6.9 3.4 3-.2 2.8-2.9 4.9-5.8 7.1z" fill="currentColor" opacity=".85"/></svg>';
export const DESTELLO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 4.6 2.4 6.9 7 8-4.6 1.1-6.4 3.4-7 8-.6-4.6-2.4-6.9-7-8 4.6-1.1 6.4-3.4 7-8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
export const DESTELLO_LLENO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 4.6 2.4 6.9 7 8-4.6 1.1-6.4 3.4-7 8-.6-4.6-2.4-6.9-7-8 4.6-1.1 6.4-3.4 7-8z" fill="currentColor"/></svg>';
export const FLECHITA = '<svg viewBox="0 0 40 26" aria-hidden="true"><path d="M3 20c9-1 20-6 30-15M33 5l-7 .6M33 5l-1.6 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 12l4-3M10 15l4-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

/* ── Flores secas (la rama de la derecha) y florecitas rosas (la de abajo) ── */
const flor = (x, y, r, c, centro, giro = 0) => `<g transform="translate(${x} ${y}) rotate(${giro})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.42}" ry="${r * 0.62}" fill="${c}" transform="rotate(${a})"/>`).join("")}<circle r="${r * 0.3}" fill="${centro}"/></g>`;
export const RAMA_SECA = `<svg viewBox="0 0 90 150" aria-hidden="true"><path d="M78 148C66 118 60 92 52 64S36 22 30 6" fill="none" stroke="#a8826a" stroke-width="2" stroke-linecap="round"/><path d="M58 90c-10-6-20-6-28-2M50 56c8-8 18-10 26-8M42 34c-8-4-15-2-20 3" fill="none" stroke="#a8826a" stroke-width="1.4" stroke-linecap="round"/><path d="M66 112c6-4 12-4 16-1-4 4-10 5-16 1zM44 74c-6-1-10 2-12 6 6 1 10-1 12-6z" fill="#c9a98a"/>${flor(30, 86, 9, "#f1b394", "#c9785c", 12)}${flor(76, 46, 8, "#f6c3a6", "#c9785c", -20)}${flor(22, 36, 7.5, "#eeb08e", "#b96a50", 30)}${flor(30, 8, 6, "#f3bc9d", "#c9785c", 0)}<circle cx="52" cy="62" r="3.4" fill="#e7a283"/><circle cx="60" cy="96" r="2.8" fill="#eab08f"/></svg>`;
export const RAMA_ROSA = `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M2 88C24 70 46 58 70 44S104 18 118 8" fill="none" stroke="#8a5a6a" stroke-width="2" stroke-linecap="round"/><path d="M40 62c-2-10 2-18 10-22M78 38c4-8 12-12 20-11" fill="none" stroke="#8a5a6a" stroke-width="1.3" stroke-linecap="round"/>${flor(50, 40, 9, "#ffb3cb", "#d9467a", 10)}${flor(98, 26, 8, "#ffc6d8", "#d9467a", -14)}${flor(24, 72, 7, "#ffaac4", "#c93a6c", 24)}${flor(72, 50, 6, "#ffd0de", "#d9467a", 0)}<circle cx="112" cy="12" r="3" fill="#ffb3cb"/><circle cx="8" cy="84" r="2.6" fill="#ffc6d8"/></svg>`;

/* ── Las fotos de las polaroids cuando todavía no hay foto ── */
const estrellas = (n, semilla, alto = 55) => { let s = semilla; const az = () => ((s = (s * 16807) % 2147483647) / 2147483647); return Array.from({ length: n }, () => `<circle cx="${(az() * 100).toFixed(1)}" cy="${(az() * alto).toFixed(1)}" r="${(0.35 + az() * 0.6).toFixed(2)}" fill="#fff" opacity="${(0.5 + az() * 0.5).toFixed(2)}"/>`).join(""); };
export const FOTO_ATARDECER = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="fa-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3f86"/><stop offset=".45" stop-color="#b8679f"/><stop offset=".78" stop-color="#ee9b8a"/><stop offset="1" stop-color="#f7c59a"/></linearGradient></defs><rect width="100" height="100" fill="url(#fa-c)"/>${estrellas(14, 3, 40)}<ellipse cx="30" cy="48" rx="26" ry="5" fill="#f7a7c0" opacity=".45"/><ellipse cx="74" cy="58" rx="30" ry="6" fill="#ffc4b0" opacity=".4"/><ellipse cx="52" cy="38" rx="22" ry="4" fill="#d58cc0" opacity=".35"/><path d="M0 100V80c6-4 10-12 14-12s6 6 9 6 5-10 10-10 6 10 9 12c6 2 10 8 14 6V100z" fill="#2c1f3d"/><path d="M80 100V58M74 64h12M76 70h8" stroke="#2c1f3d" stroke-width="1.6"/><path d="M86 64C92 70 98 76 100 78" fill="none" stroke="#2c1f3d" stroke-width=".7"/><path d="M50 60c-6-4.6-10-8-9.6-12.2.3-3 3.4-4.5 6-3.4 1.6.7 2.6 2 3.6 3.6 1-1.6 2-3 3.6-3.6 2.6-1 5.7.4 6 3.4.4 4.2-3.6 7.6-9.6 12.2z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" opacity=".92"/><path d="M60 40l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/></svg>`;
export const FOTO_CIUDAD = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="fc-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f1b46"/><stop offset=".55" stop-color="#5a3f86"/><stop offset="1" stop-color="#b47aa6"/></linearGradient></defs><rect width="100" height="100" fill="url(#fc-c)"/>${estrellas(26, 11, 60)}<path d="M78 16a8 8 0 1 0 6 13 7 7 0 1 1-6-13z" fill="#ffe7b3"/><path d="M62 30l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#fff"/><path d="M0 100V74h8v-6h7v10h6V62h8v14h5V70h7v8h6V52l3-6 3 6v26h5V66h8v10h6V60h9v40z" fill="#1a1430"/>${[[10, 76], [24, 66], [26, 72], [38, 74], [48, 58], [50, 66], [62, 70], [64, 76], [76, 64], [86, 68], [88, 74]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="2" fill="#ffd27a" opacity=".9"/>`).join("")}</svg>`;
export const FOTO_ESQUINA = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="fe-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4a8c"/><stop offset=".6" stop-color="#d27aa0"/><stop offset="1" stop-color="#f5b58e"/></linearGradient></defs><rect width="100" height="100" fill="url(#fe-c)"/><path d="M30 100V18M22 26h16M24 32h12M34 38h0" stroke="#2a1d3a" stroke-width="2.2"/><path d="M0 34C14 30 24 28 30 28S60 34 100 44M0 40C14 36 26 34 38 34S70 42 100 52" fill="none" stroke="#2a1d3a" stroke-width=".8"/><path d="M0 100V86c10-2 18-8 26-6s14 8 24 6 22-10 30-8 14 6 20 4V100z" fill="#2a1d3a"/><path d="M66 62c-5-3.8-8.6-6.6-8.2-10 .3-2.5 2.8-3.7 5-2.8 1.3.5 2.2 1.6 3.2 3 .9-1.4 1.8-2.5 3.1-3 2.2-.9 4.8.3 5.1 2.8.3 3.4-3.1 6.2-8.2 10z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
export const FOTO_VACIA = '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="100" fill="#f6e9ef"/><path d="M50 66c-9-7-15-12-14.4-18.5.4-4.4 5-6.8 8.9-5.1 2.5 1 4 3 5.5 5.4 1.5-2.4 3-4.4 5.5-5.4 3.9-1.7 8.5.7 8.9 5.1C65 54 59 59 50 66z" fill="none" stroke="#d9a3bd" stroke-width="2.2" stroke-dasharray="4 4" stroke-linecap="round"/></svg>';

/* ── Los iconos de las tarjetas, la tarjeta de los días y el botón grande ── */
export const ICONO_CARPETA = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 15.5c0-2 1.6-3.5 3.5-3.5h8.4c1.2 0 2.3.6 3 1.6l1.6 2.2h13.9c2 0 3.6 1.6 3.6 3.6v1.8H7z" fill="#f08aab"/><rect x="7" y="18" width="34" height="21" rx="4" fill="#e0507f"/><path d="M11 18h26" stroke="#ff9fbe" stroke-width="2" stroke-linecap="round"/><path d="M24 34.5c-4.6-3.5-7.6-6-7.3-9.1.2-2.2 2.5-3.4 4.4-2.5 1.2.5 2 1.5 2.9 2.7.8-1.2 1.6-2.2 2.8-2.7 2-.9 4.3.3 4.5 2.5.3 3.1-2.7 5.6-7.3 9.1z" fill="#fff"/></svg>';
export const ICONO_LIBRO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14c-4-2.8-9.6-3.6-16-2.6v24c6.4-1 12 0 16 2.6 4-2.6 9.6-3.6 16-2.6v-24c-6.4-1-12-.2-16 2.6z" fill="#fff" stroke="#6d55b8" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 14v24" stroke="#6d55b8" stroke-width="2"/><path d="M12.5 18c3-.3 5.6 0 8 1M12.5 23c3-.3 5.6 0 8 1M12.5 28c2.2-.2 4.2 0 6 .6" stroke="#b6a4e8" stroke-width="1.6" stroke-linecap="round"/><path d="M32 29c-3-2.3-5-4-4.8-6 .1-1.4 1.6-2.2 2.9-1.6.8.3 1.3 1 1.9 1.8.5-.8 1-1.5 1.8-1.8 1.3-.6 2.8.2 3 1.6.2 2-1.8 3.7-4.8 6z" fill="#e0507f"/><path d="M38 9l.7 1.8 1.8.7-1.8.7L38 14l-.7-1.8-1.8-.7 1.8-.7z" fill="#b6a4e8"/></svg>';
export const ICONO_PERSONA = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="#bfe6da" stroke="#2f8f78" stroke-width="2.2"/><circle cx="24" cy="20.5" r="5.4" fill="#2f8f78"/><path d="M14.6 35c1.6-4.6 5.2-7 9.4-7s7.8 2.4 9.4 7" fill="#2f8f78"/></svg>';
export const ICONO_CALENDARIO = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="10" width="34" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 19h34M16 6v8M32 6v8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M14 26h4M22 26h4M30 26h4M14 33h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".55"/><path d="M27.5 36.5c-2.6-2-4.3-3.4-4.1-5.2.1-1.2 1.4-1.9 2.5-1.4.7.3 1.1.8 1.6 1.5.4-.7.9-1.2 1.6-1.5 1.1-.5 2.4.2 2.5 1.4.2 1.8-1.5 3.2-4.1 5.2z" fill="#e0325f"/></svg>';
export const CLIP = '<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M8 30V10a6 6 0 0 1 12 0v24a8 8 0 0 1-16 0V14" fill="none" stroke="#a99bbd" stroke-width="2.6" stroke-linecap="round"/><path d="M8 30V10a6 6 0 0 1 12 0" fill="none" stroke="#e4ddf0" stroke-width="1" stroke-linecap="round" opacity=".8"/></svg>';
export const LIBRO_BRILLOS = '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M32 12c-5-3.6-12-4.6-20-3.4v28c8-1.2 15-.2 20 3.4 5-3.6 12-4.6 20-3.4v-28c-8-1.2-15-.2-20 3.4z" fill="none" stroke="#ffe9da" stroke-width="2.4" stroke-linejoin="round"/><path d="M32 12v28" stroke="#ffe9da" stroke-width="2"/><path d="M17 17c3.6-.4 6.6 0 9.6 1.2M17 23c3.6-.4 6.6 0 9.6 1.2M37.4 18.2c3-1.2 6-1.6 9.6-1.2" stroke="#ffd2c0" stroke-width="1.6" stroke-linecap="round"/><path d="M42 28.5c-2.6-2-4.2-3.4-4-5.1.1-1.2 1.4-1.9 2.5-1.4.7.3 1.1.9 1.5 1.5.4-.6.9-1.2 1.5-1.5 1.1-.5 2.4.2 2.5 1.4.2 1.7-1.5 3.1-4 5.1z" fill="#ffe9da"/><path d="M8 6l.9 2.3 2.3.9-2.3.9L8 12.4l-.9-2.3-2.3-.9 2.3-.9zM57 38l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#ffe9da"/></svg>';

/* ── El gatito dormido, en piezas (cada una en su capa: respira y mueve la cola sin repintar) ── */
const GATO = "var(--gato, #3a2440)", OREJA = "#7a4a6e";
export const GATO_COLA = `<svg viewBox="0 0 120 72" aria-hidden="true"><path d="M97 58c14 1 22-8 19-19-2-7-9-9-13-6-3 2-2 6 1 6 4 0 6 5 3 9-3 5-9 6-14 5" style="fill:${GATO}"/></svg>`;
export const GATO_CUERPO = `<svg viewBox="0 0 120 72" aria-hidden="true"><path d="M32 62C24 46 36 26 60 24c24-2 41 10 40 27-1 10-10 15-27 15H40c-5 0-7-1-8-4z" style="fill:${GATO}"/><path d="M62 30c12-1 24 4 30 12" fill="none" style="stroke:var(--gato-l, #5a3a62)" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><ellipse cx="50" cy="65" rx="11" ry="3.6" style="fill:${GATO}"/></svg>`;
export const GATO_CABEZA = `<svg viewBox="0 0 120 72" aria-hidden="true"><path d="M13 59c-4-12 2-24 16-26 14-2 22 8 21 19-1 9-8 14-20 14-9 0-15-2-17-7z" style="fill:${GATO}"/><path d="M16 40l-1-15 12 9zM37 33l8-12 2 15z" style="fill:${GATO}"/><path d="M18.5 37l-.5-7 5.4 4.2zM40 32l3.4-5.2.8 6.4z" fill="${OREJA}"/><path d="M21 49.5q3.2 3 6.4 0M33.5 48.5q3.2 3 6.4 0" fill="none" stroke="#f4c6d8" stroke-width="1.6" stroke-linecap="round"/><path d="M29.4 53.4l1.4 1.2 1.4-1.2z" fill="#f49ab9"/><circle cx="20" cy="55" r="2.2" fill="#f49ab9" opacity=".35"/><circle cx="42" cy="54" r="2.2" fill="#f49ab9" opacity=".35"/></svg>`;
