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
  const c = nivel(k) >= 3 ? 3 : 4, r = c === 3 ? 1.5 : 2, o = c === 3 ? 1 : 1.5;
  return `<svg class="ca-filtros" aria-hidden="true" width="0" height="0"><filter id="ca-pixel" x="-30%" y="-30%" width="160%" height="160%"><feFlood x="${o}" y="${o}" height="1" width="1"/><feComposite width="${c}" height="${c}"/><feTile result="t"/><feComposite in="SourceGraphic" in2="t" operator="in"/><feMorphology operator="dilate" radius="${r}"/></filter></svg>`;
}

/* ═════════════ La capa WebGL 2 (sólo Ultra) ═════════════ */
const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `#version 300 es
precision mediump float;
in vec2 uv; out vec4 color;
uniform vec2 res; uniform float t, noche, lluvia, viento, flash, afuera;
uniform vec3 ambiente;
uniform int n; uniform vec4 luz[16]; uniform vec3 tono[16];
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 px = vec2(uv.x, 1.0 - uv.y) * res;
  // Ambiente: de noche (o con tormenta) todo se tiñe y se oscurece un poquito; las luces lo abren.
  float oscuro = noche * 0.42 + lluvia * 0.16;
  vec3 suma = vec3(0.0); float abre = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    vec4 L = luz[i];
    float d = length((px - L.xy) / vec2(1.0, 0.82)) / L.z;
    float f = L.w * smoothstep(1.0, 0.0, d);
    f *= f;
    suma += tono[i] * f * (0.35 + noche * 0.5);
    abre = max(abre, f);
  }
  float a = oscuro * (1.0 - abre * 0.9);
  vec3 c = ambiente * a;
  // Luciérnagas y polvito de luz.
  if (afuera > 0.5 && noche > 0.5 && lluvia < 0.1) {
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      vec2 q = vec2(fract(h(vec2(fi, 1.0)) + sin(t * 0.13 + fi) * 0.08), 0.45 + 0.4 * fract(h(vec2(fi, 7.0)) + cos(t * 0.11 + fi * 2.0) * 0.06)) * res;
      float b = 0.5 + 0.5 * sin(t * (1.4 + fi * 0.2) + fi * 3.0);
      float g = smoothstep(9.0, 0.0, length(px - q)) * b;
      suma += vec3(1.0, 0.95, 0.55) * g * 0.9;
    }
  }
  // La lluvia: rayitas que caen chuecas con el viento.
  if (lluvia > 0.0) {
    vec2 q = px / res.y * vec2(70.0, 9.0);
    q.x += q.y * viento * 0.18;
    q.y += t * (14.0 + lluvia * 8.0);
    vec2 cel = floor(q); vec2 fr = fract(q);
    float r = h(cel);
    float gota = step(1.0 - lluvia * 0.55, r) * smoothstep(0.1, 0.0, abs(fr.x - 0.5)) * smoothstep(0.0, 0.6, fr.y) * (1.0 - fr.y);
    suma += vec3(0.75, 0.82, 0.95) * gota * (afuera > 0.5 ? 0.55 : 0.12);
  }
  // El relámpago: ilumina todo desde arriba (y más afuera).
  suma += vec3(0.82, 0.88, 1.0) * flash * (afuera > 0.5 ? 0.75 : 0.35) * (1.2 - uv.y * 0.5);
  // Viñeta suavecita.
  vec2 v = uv - 0.5; float vi = smoothstep(0.42, 0.85, length(v * vec2(1.0, 1.2)));
  float va = vi * 0.3;
  c = c * (1.0 - va) + vec3(0.06, 0.04, 0.12) * va; a = a + va * (1.0 - a);
  color = vec4(c + suma, a);
}`;

/** Crea la capa; devuelve null si el teléfono no tiene WebGL 2 (entonces se usa lo de Calidad). */
export function crearCapaGL(j) {
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
  for (const k of ["res", "t", "noche", "lluvia", "viento", "flash", "afuera", "ambiente", "n", "luz", "tono"]) U[k] = gl.getUniformLocation(pr, k);
  const luces = new Float32Array(64), tonos = new Float32Array(48);
  let rq = 0, ult = 0, perdido = false, escala = 0.5, ultFirma = "";
  const t0 = performance.now();
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || "").trim()); const v = m ? parseInt(m[1], 16) : 0xffd68c; return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; };
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); perdido = true; cancelAnimationFrame(rq); j._sinGL?.("Se perdió la capa de luces"); });

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
    if (ahora - ult < 32) return;             // 30 cuadros por segundo, como mucho
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
    const anima = e.lluvia > 0 || e.flash > 0 || (e.afuera && e.noche > 0.5);
    const firma = anima ? "" : `${W}x${H}|${e.noche}|${n}|${luces.subarray(0, n * 4).join(",")}`;
    if (firma && firma === ultFirma) return;
    ultFirma = firma;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.t, (ahora - t0) / 1000);
    gl.uniform1f(U.noche, e.noche); gl.uniform1f(U.lluvia, e.lluvia); gl.uniform1f(U.viento, e.viento);
    gl.uniform1f(U.flash, e.flash); gl.uniform1f(U.afuera, e.afuera ? 1 : 0);
    gl.uniform3fv(U.ambiente, e.ambiente);
    gl.uniform1i(U.n, n);
    gl.uniform4fv(U.luz, luces); gl.uniform3fv(U.tono, tonos);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  return {
    n: cv,
    prender() { if (!rq && !perdido) { ult = 0; ultFirma = ""; rq = requestAnimationFrame(cuadro); } },
    parar() { cancelAnimationFrame(rq); rq = 0; },
    destruir() { cancelAnimationFrame(rq); rq = 0; try { gl.deleteProgram(pr); gl.deleteBuffer(buf); gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (e) { /* nada */ } cv.remove(); },
  };
}
