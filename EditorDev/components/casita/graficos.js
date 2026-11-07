/**
 * LOS GRÁFICOS DE LA CASITA (Fase 56): cinco perfiles que de verdad cambian lo que se dibuja.
 *
 *   max   Máximo rendimiento — sin animaciones de adorno, sin filtros ni sombras, 1 partícula.
 *   rend  Rendimiento        — animaciones básicas (fx1), pocas partículas.
 *   equi  Equilibrado        — + pixel art, brillos, rayos de sol y sombritas de pared (fx2).
 *   cal   Calidad            — + pixel más fino, sombras en el piso, polvito de luz (fx3).
 *   ultra Ultra calidad      — + capa WebGL 2 (fx4): luces en tiempo real, lluvia y relámpagos
 *                              con sombreado, luciérnagas, viñeta. Si no hay WebGL 2, se queda en
 *                              lo de Calidad y lo avisa.
 *
 * Las clases fx1..fx4 son acumulativas y el CSS (casita.css) sólo prende lo de cada nivel. La capa
 * WebGL dibuja a media resolución, a 30 cuadros por segundo como mucho, y se detiene sola si la casita
 * se esconde, se sale o se pierde el contexto.
 */
export const PERFILES = [
  ["max", "Máximo rendimiento", "Lo más ligero: sin efectos ni sombras, para que no se caliente"],
  ["rend", "Rendimiento", "Animaciones básicas, sin filtros"],
  ["equi", "Equilibrado", "Pixel art, brillos de lámparas y sombritas suaves"],
  ["cal", "Calidad", "Pixel más fino, sombras en el piso, polvito de luz y más partículas"],
  ["ultra", "Ultra calidad", "Luces en tiempo real (WebGL 2), lluvia y relámpagos con sombreado y luciérnagas"],
];
const NIVEL = { max: 0, rend: 1, equi: 2, cal: 3, ultra: 4 };
const PARTES = { max: 1, rend: 2, equi: 4, cal: 8, ultra: 12 };
const GFX = "editordev:casita-gfx";
const DESDE_MODO = { ultra: "max", rendimiento: "rend", equilibrado: "equi", calidad: "cal" };

export function leerGfx() {
  try { const v = localStorage.getItem(GFX); if (v in NIVEL) return v; } catch (e) { /* nada */ }
  return DESDE_MODO[document.documentElement.dataset.modo] || "equi";
}
export function guardarGfx(k) { try { localStorage.setItem(GFX, k); } catch (e) { /* nada */ } }
export const nivel = (k) => NIVEL[k] ?? 2;
export const maxParticulas = (k) => PARTES[k] ?? 4;

/** El filtro pixel: más fino en Calidad y Ultra (cuadritos de 3), más grueso en Equilibrado (de 4). */
export function filtroPixel(k) {
  // (Fase 68) Mejor pixel: la misma rejilla que los muebles (4 del mundo, empezando en la orilla de cada dibujo, así
  // lo que se mueve cae justo en los cuadritos de lo quieto), un cuadrito por muestra sin encimarse (antes se
  // engordaban y se mezclaban los colores), los colores en escalones y la orilla sin medias transparencias.
  const n = nivel(k) >= 3 ? 10 : 8, esc = Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(3)).join(" ");
  return `<svg class="ca-filtros" aria-hidden="true" width="0" height="0"><filter id="ca-pixel" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feFlood x="1" y="1" width="2" height="2"/><feComposite width="4" height="4"/><feTile result="t"/><feComposite in="SourceGraphic" in2="t" operator="in"/><feMorphology operator="dilate" radius="1"/><feComponentTransfer><feFuncR type="discrete" tableValues="${esc}"/><feFuncG type="discrete" tableValues="${esc}"/><feFuncB type="discrete" tableValues="${esc}"/><feFuncA type="discrete" tableValues="0 .55 1"/></feComponentTransfer></filter></svg>`;
}

/* ═════════════ La capa WebGL 2 (sólo Ultra) ═════════════ */
const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `#version 300 es
precision mediump float;
in vec2 uv; out vec4 color;
uniform vec2 res; uniform float t, noche, lluvia, viento, flash, afuera, oscuro, efectos;
uniform vec3 ambiente;
uniform int n; uniform vec4 luz[16]; uniform vec3 tono[16];
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); float a = mod(q.x + q.y * 2.0, 4.0); return (a * 4.0 + mod(q.x * 3.0 + q.y, 4.0)) / 16.0; }
void main() {
  vec2 px = vec2(uv.x, 1.0 - uv.y) * res;
  // (Fase 63) La luz ya no se SUMA encima (eso hacía manchas blancas): cada lámpara sólo abre la oscuridad a su alrededor,
  // con caída suave y en escalones de pixel, y deja un tinte cálido muy leve. De día, oscuro = 0: no pasa nada.
  float abre = 0.0; vec3 tinte = vec3(0.0); float peso = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    vec4 L = luz[i];
    float d = length((px - L.xy) / vec2(1.0, 0.8)) / L.z;
    float f = L.w * pow(clamp(1.0 - d, 0.0, 1.0), 1.6);
    abre = 1.0 - (1.0 - abre) * (1.0 - f);
    tinte += tono[i] * f; peso += f;
  }
  // (Fase 72) Escalones más finos (menos puntitos) y, con el foco del techo prendido, el cuarto queda bien alumbrado.
  abre = min(1.0, floor(abre * 18.0 + bayer(gl_FragCoord.xy) * 0.9) / 18.0);
  float a = oscuro * (1.0 - abre * 0.93);
  vec3 c = ambiente * a;
  if (peso > 0.0) c += (tinte / peso) * 0.055 * abre * smoothstep(0.05, 0.4, oscuro);
  // Luciérnagas chiquitas (afuera, de noche, sin lluvia).
  if (efectos > 0.5 && afuera > 0.5 && noche > 0.5 && lluvia < 0.1) {
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec2 q = vec2(fract(h(vec2(fi, 1.0)) + sin(t * 0.13 + fi) * 0.08), 0.45 + 0.4 * fract(h(vec2(fi, 7.0)) + cos(t * 0.11 + fi * 2.0) * 0.06)) * res;
      float b = 0.5 + 0.5 * sin(t * (1.4 + fi * 0.2) + fi * 3.0);
      // (Fase 66) En pixel: un cuadrito brillante con su orilla tenue (no una bolita borrosa).
      vec2 dq = abs(floor(px) - floor(q)); float m = max(dq.x, dq.y);
      c += vec3(1.0, 0.94, 0.6) * (step(m, 0.5) + 0.35 * step(m, 1.5)) * b * 0.32;
    }
  }
  // (Fase 66) La lluvia ya no se dibuja aquí: son las gotitas pixel de lluvia.js (las rayitas lisas no eran pixel).
  // El relámpago: aclara un poquito desde arriba (sin pantalla blanca).
  c += vec3(0.8, 0.86, 1.0) * flash * (afuera > 0.5 ? 0.26 : 0.1) * (1.1 - uv.y * 0.5);
  // (Fase 66) Sin viñeta: era un degradado liso, no pixel.
  color = vec4(c, a);
}`;

/** Crea la capa; devuelve null si el teléfono no tiene WebGL 2 (entonces se usa lo de Calidad). */
export function crearCapaGL(j, nv = 4) {
  const cv = document.createElement("canvas");
  cv.className = "ca-gl";
  cv.setAttribute("aria-hidden", "true");
  let gl = null;
  try { gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); } catch (e) { gl = null; }
  if (!gl) return null;
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader"); return s; };
  let pr;
  try {
    pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) || "link");
  } catch (e) { console.warn("[casita] WebGL 2:", e.message); return null; }
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = {};
  for (const k of ["res", "t", "noche", "lluvia", "viento", "flash", "afuera", "ambiente", "n", "luz", "tono", "oscuro", "efectos"]) U[k] = gl.getUniformLocation(pr, k);
  const luces = new Float32Array(64), tonos = new Float32Array(48);
  // (Fase 63) En todos los modos: los ligeros dibujan más chiquito y menos seguido (y sin lluvia ni luciérnagas).
  let rq = 0, ult = 0, perdido = false, muerto = false, escala = 0.5, ultFirma = "", cada = 32, efectos = 1;
  const ajustar = (k) => { escala = [0.3, 0.36, 0.45, 0.55, 0.65][k] ?? 0.5; cada = k <= 1 ? 66 : 32; efectos = k >= 2 ? 1 : 0; ultFirma = ""; };
  ajustar(nv);
  const t0 = performance.now();
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || "").trim()); const v = m ? parseInt(m[1], 16) : 0xffd68c; return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; };
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); perdido = true; cancelAnimationFrame(rq); if (!muerto) j._sinGL?.("Se perdió la capa de luces"); });

  function medir() {
    const w = cv.clientWidth, h = cv.clientHeight;
    const W = Math.max(1, Math.round(w * escala)), H = Math.max(1, Math.round(h * escala));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
    return [W, H];
  }
  function cuadro(ahora) {
    rq = 0;
    if (perdido || !j.vivo || document.hidden) return;
    rq = requestAnimationFrame(cuadro);
    if (ahora - ult < cada) return;           // 30 cuadros por segundo como mucho (15 en los modos ligeros)
    // Si el teléfono va lento (más de 70 ms entre cuadros seguido), baja la resolución.
    const dt = ahora - ult; ult = ahora;
    if (dt > 70 && dt < 500) { escala = Math.max(0.33, escala - 0.02); }
    const [W, H] = medir(), s = W / Math.max(1, cv.clientWidth);
    const e = j.estadoGL();
    let n = 0;
    for (const L of e.luces) {
      if (n >= 16) break;
      if (L.x < -L.r || L.x > cv.clientWidth + L.r) continue;
      luces.set([L.x * s, L.y * s, L.r * s, L.i], n * 4);
      tonos.set(hex(L.c), n * 3);
      n++;
    }
    // Si nada se mueve (sin lluvia, relámpago ni luciérnagas) y las luces siguen igual, no se vuelve a dibujar.
    const anima = efectos && e.afuera && e.noche > 0.5 && e.lluvia < 0.1 || e.flash > 0;
    const firma = anima ? "" : `${W}x${H}|${e.oscuro}|${n}|${luces.subarray(0, n * 4).join(",")}`;
    if (firma && firma === ultFirma) return;
    ultFirma = firma;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.t, (ahora - t0) / 1000);
    gl.uniform1f(U.noche, e.noche); gl.uniform1f(U.lluvia, e.lluvia); gl.uniform1f(U.viento, e.viento);
    gl.uniform1f(U.flash, e.flash); gl.uniform1f(U.afuera, e.afuera ? 1 : 0);
    gl.uniform1f(U.oscuro, e.oscuro); gl.uniform1f(U.efectos, efectos);
    gl.uniform3fv(U.ambiente, e.ambiente);
    gl.uniform1i(U.n, n);
    gl.uniform4fv(U.luz, luces); gl.uniform3fv(U.tono, tonos);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  return {
    n: cv,
    prender() { if (!rq && !perdido) { ult = 0; ultFirma = ""; rq = requestAnimationFrame(cuadro); } },
    parar() { cancelAnimationFrame(rq); rq = 0; },
    ajustar(k) { ajustar(k); this.nv = k; },
    destruir() { muerto = true; cancelAnimationFrame(rq); rq = 0; try { gl.deleteProgram(pr); gl.deleteBuffer(buf); gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (e) { /* nada */ } cv.remove(); },
  };
}
