/**
 * ESTILOS DE LA INTERFAZ — «Cuaderno» (el de siempre), «RetroMyLove» o «Baddie».
 *
 * Baddie vive entero en styles/baddie.css (negro, rosa fuerte, cromo y
 * brillitos; la abejita se pone pestañas, labial rojo y chapitas).
 *
 * RetroMyLove vive entero en styles/retromylove.css, bajo
 * :root[data-estilo="retromylove"]: cambia los tokens (colores, bordes,
 * sombras, letras) y algunos componentes, así cada parte del editor que ya
 * usa esos tokens se ve retro sin tocarla. Aquí sólo:
 *   · se pide su tipografía (una vez, sólo si se usa),
 *   · se crea la TEXTURA del grano UNA sola vez (un lienzo de 160 px con
 *     ruido) y se reutiliza en todo: el grano «vivo» es esa misma imagen
 *     desplazándose a saltitos con transform (sin repintar nada),
 *   · se pone o se quita el velo de grano y el parpadeo analógico.
 */
let textura = null;
const FUENTES = {
  retromylove: "https://fonts.googleapis.com/css2?family=Silkscreen&family=VT323&family=Nunito:wght@400;600;700&display=swap",
  baddie: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Poppins:wght@400;500;600&display=swap",
};
const pedidas = new Set();

function pedirFuentes(estilo) {
  if (!FUENTES[estilo] || pedidas.has(estilo)) return;
  pedidas.add(estilo);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = FUENTES[estilo];
  document.head.append(l);
}

/** Ruido fino (blanco y negro con alfa), una sola vez. */
function grano() {
  if (textura) return textura;
  const t = 160, c = document.createElement("canvas");
  c.width = c.height = t;
  const g = c.getContext("2d"), im = g.createImageData(t, t), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = Math.random() * 70;
  }
  g.putImageData(im, 0, 0);
  textura = c.toDataURL("image/png");
  return textura;
}

export function aplicarEstilo(p) {
  const r = document.documentElement, b = document.body;
  const retro = p.estilo === "retromylove";
  if (p.estilo === "retromylove" || p.estilo === "baddie") { r.dataset.estilo = p.estilo; pedirFuentes(p.estilo); } else delete r.dataset.estilo;
  // El grano sólo existe con RetroMyLove y si se quiere; quieto con «sin movimiento».
  let v = document.querySelector(".rml-grano");
  if (retro && p.grano) {
    if (!v) { v = document.createElement("div"); v.className = "rml-grano"; v.setAttribute("aria-hidden", "true"); b.append(v); }
    r.style.setProperty("--rml-ruido", `url("${grano()}")`);
  } else v?.remove();
  let f = document.querySelector(".rml-parpadeo");
  if (retro && p.parpadeo) {
    if (!f) { f = document.createElement("div"); f.className = "rml-parpadeo"; f.setAttribute("aria-hidden", "true"); b.append(f); }
  } else f?.remove();
}
