/*
 * LAS VENTANAS — cada ventana de la ciudad, una por una.
 *
 * Antes las ventanas eran parte de la textura de la pared (todas prendidas
 * o todas apagadas, y las «especiales» flotaban encima sin coincidir). Ahora
 * cada hueco de cada fachada tiene su ventana de verdad, todas en UNA malla
 * instanciada (una sola llamada de dibujo para miles):
 *
 *   · De día el vidrio refleja el cielo; al atardecer se van prendiendo
 *     poco a poco (cada una tiene su propia hora), y de madrugada se van
 *     apagando. Nada de eso lo calcula el procesador: lo hace el shader con
 *     la hora y el «umbral» de cada ventana.
 *   · Adentro: luz cálida de distintos tonos, cortinas, a veces una silueta
 *     o la luz azul de una tele.
 *   · Cualquier ventana se puede prender o apagar tocándola (sobre todo
 *     desde la banca, con la vista de frente).
 *   · 83 de ellas guardan una escena (las de «Enciende las luces»): con la
 *     cortina cerrada y una rendijita de luz rosa hasta que las prendes.
 *     Sus escenas se pintan una vez en un atlas; la última que tocaste y la
 *     del K-drama se animan de verdad mientras estás cerca.
 *
 * Debajo de cada ventana va su alféizar (instanciado, con sombra) y en
 * algunas un balconcito: eso le da relieve a la fachada.
 */
import { J, THREE, rnd, elegir, memo, guardar, contar, lienzo, textura, toon, aPantalla } from "./base.js";
import { fachadas, ventanasEscena, lugares, CELDA, PISO0, MANZANAS } from "./mundo.js";
import { pintarEscena } from "./escenas.js";

export const ventanas = [];   // { x, y, z, ry, nx, nz, ancho, alto, i, f, fila, col, escena?, manual }
const ANCHO = 1.6, ALTO = 1.9, SEP = 0.05;
const CW = 204, CH = 227, AT = 2048, COLS = 10;
let malla, aV, atlasX, atlasT;
const vivo = { v: null, malla: null, c: null, x: null, t: null }, kd = { v: null, malla: null, c: null, x: null, t: null };

export function construirVentanas(esc, ESCENAS) {
  const enCiudad = (f) => Math.abs((f.ax + f.bx) / 2) < 70 && Math.abs((f.az + f.bz) / 2) < 70;
  // 1) todas las ventanas de todas las fachadas
  for (const f of fachadas) {
    const cols = Math.round(f.L / CELDA), filas = Math.floor((f.h - PISO0 - 0.4) / CELDA);
    const ry = Math.atan2(f.nx, f.nz);
    for (let fila = 0; fila < filas; fila++) for (let col = 0; col < cols; col++) {
      const s = CELDA * (col + 0.5), y = PISO0 + CELDA * (fila + 0.5);
      ventanas.push({ x: f.ax + f.ux * s + f.nx * SEP, y, z: f.az + f.uz * s + f.nz * SEP, ry, nx: f.nx, nz: f.nz, ancho: ANCHO, alto: ALTO, f, fila, col, manual: -1, umbral: Math.random(), semilla: Math.random(), ciudad: enCiudad(f) });
    }
  }
  // 2) las 83 con escena: la del K-drama en su lugar, las demás en los pisos bajos, más cerca del principio
  const vk = ventanas.find((v) => v.f.ed === lugares.kdrama.ed && v.fila === lugares.kdrama.celda.fila && v.col === lugares.kdrama.celda.col);
  const kdrama = ESCENAS.find((e) => e.id === "kdrama");
  if (vk && kdrama) { vk.escena = kdrama; vk.ancho = 2.3; vk.alto = 2.1; }
  const cand = ventanas.filter((v) => v.ciudad && !v.escena && v.fila < 3 && v.f.ed.especial !== "burger" && v.f.ed.frente)
    .map((v) => ({ v, d: Math.hypot(v.x - 31, v.z - 6) + v.fila * 7 + rnd(0, 26) })).sort((a, b) => a.d - b.d);
  const resto = ESCENAS.filter((e) => e.id !== "kdrama").sort(() => Math.random() - 0.5);
  let k = 0;
  for (const esc2 of resto) { while (k < cand.length && (cand[k].v.escena || vecinaConEscena(cand[k].v))) k++; if (k >= cand.length) break; cand[k].v.escena = esc2; k++; }
  ventanas.forEach((v, i) => { v.i = i; });
  ventanasEscena.length = 0;
  for (const v of ventanas) if (v.escena) { v.vez = memo.ventanas[v.escena.id] || 0; v.encendida = v.vez > 0; v.manual = v.encendida ? 1 : 0; ventanasEscena.push(v); }
  // 3) el atlas de escenas
  let atlas; [atlas, atlasX] = lienzo(AT, AT); atlasT = textura(atlas); atlasT.anisotropy = 4;
  ventanasEscena.forEach((v, n) => { v.celda = n; if (v.encendida) pintarCelda(v); });
  // 4) la malla
  const n = ventanas.length, geo = new THREE.PlaneGeometry(1, 1);
  aV = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  geo.setAttribute("aV", aV);
  const mat = new THREE.MeshBasicMaterial({ map: atlasT, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const u = { uNoche: { value: 0 }, uOscuro: { value: 0 }, uDia: { value: 1 }, uCieloA: { value: new THREE.Color() }, uCieloH: { value: new THREE.Color() }, uT: { value: 0 }, uTam: { value: new THREE.Vector2(CW / AT, CH / AT) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = "attribute vec4 aV; uniform vec2 uTam; varying vec4 vV; varying vec2 vQ;\n" + sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
      vV = aV; vQ = uv;
      float cel = max(aV.w, 0.0); vec2 off = vec2(mod(cel, ${COLS}.0) * uTam.x, 1.0 - (floor(cel / ${COLS}.0) + 1.0) * uTam.y);
      vMapUv = uv * uTam + off;`);
    sh.fragmentShader = "uniform float uNoche, uOscuro, uDia, uT; uniform vec3 uCieloA, uCieloH; varying vec4 vV; varying vec2 vQ;\n" + sh.fragmentShader.replace("#include <map_fragment>", `
      vec2 p = vQ; float sem = vV.x;
      float encendida = vV.z >= 0.0 ? vV.z : step(vV.y, uNoche);
      // el vidrio apagado: refleja el cielo, con un brillo en diagonal
      float diag = p.x * 0.8 + p.y * 0.55;
      vec3 vidrio = mix(uCieloH, uCieloA, smoothstep(0.1, 1.0, p.y)) * mix(0.28, 0.75, uDia);
      vidrio += vec3(1.0) * (smoothstep(0.5, 0.53, diag) - smoothstep(0.62, 0.66, diag)) * mix(0.05, 0.22, uDia);
      vidrio = mix(vidrio, vidrio * vec3(0.55, 0.6, 0.8), 0.4);
      // el cuarto prendido: un tono cálido distinto en cada una
      vec3 c1 = vec3(1.0, 0.78, 0.45), c2 = vec3(1.0, 0.62, 0.38), c3 = vec3(1.0, 0.86, 0.66), c4 = vec3(1.0, 0.7, 0.72), c5 = vec3(0.72, 0.8, 1.0);
      float q = fract(sem * 5.0);
      vec3 calido = q < 0.25 ? c1 : q < 0.5 ? c2 : q < 0.72 ? c3 : q < 0.9 ? c4 : c5;
      vec3 cuarto = calido * (1.05 - p.y * 0.35);
      cuarto *= 0.8 + 0.2 * smoothstep(0.0, 0.5, p.y);
      float tele = step(fract(sem * 13.7), 0.08);
      cuarto = mix(cuarto, vec3(0.45, 0.62, 1.0) * (0.75 + 0.25 * sin(uT * 7.0 + sem * 40.0) * sin(uT * 3.1)), tele);
      // cortinas a los lados (o una a medio cerrar)
      float tela = fract(sem * 7.31);
      float ancho = tela < 0.5 ? 0.2 : tela < 0.75 ? 0.36 : 0.0;
      float cort = step(p.x, ancho) + step(1.0 - ancho, p.x);
      vec3 colTela = mix(vec3(0.95, 0.55, 0.6), vec3(0.6, 0.7, 0.95), fract(sem * 3.3));
      float pliegue = 0.75 + 0.25 * sin(p.x * 60.0);
      cuarto = mix(cuarto, cuarto * colTela * pliegue * 0.85, clamp(cort, 0.0, 1.0));
      // a veces alguien adentro
      float sil = step(fract(sem * 17.3), 0.13);
      vec2 sp = p - vec2(0.3 + 0.4 * fract(sem * 9.1), 0.0);
      float cuerpo = step(length((sp - vec2(0.0, 0.55)) * vec2(1.0, 0.9)), 0.075) + step(abs(sp.x), 0.1) * step(p.y, 0.47);
      cuarto = mix(cuarto, cuarto * 0.18, clamp(cuerpo, 0.0, 1.0) * sil);
      float fuerza = mix(0.85, 2.3, uOscuro);
      vec3 col = mix(vidrio, cuarto * fuerza, encendida);
      // las de escena
      if (vV.w >= 0.0) {
        vec3 escena = texture2D(map, vMapUv).rgb;
        float rend = smoothstep(0.035, 0.0, abs(p.x - 0.5));
        vec3 cerrada = mix(vec3(0.62, 0.3, 0.42), vec3(0.75, 0.4, 0.52), 0.5 + 0.5 * sin(p.x * 70.0)) * mix(0.6, 1.0, uDia) + vec3(1.0, 0.6, 0.75) * rend * mix(0.7, 2.4, uOscuro);
        col = mix(cerrada, escena * mix(1.0, 1.75, uOscuro), encendida);
      }
      // el marco y sus travesaños
      float marco = max(max(step(p.x, 0.055), step(0.945, p.x)), max(step(p.y, 0.045), step(0.955, p.y)));
      float trav = (1.0 - step(0.0, vV.w)) * max(step(abs(p.x - 0.5), 0.018), step(abs(p.y - 0.66), 0.016));
      col = mix(col, vColor * mix(0.22, 0.95, uDia), max(marco, trav));
      diffuseColor.rgb = col;`).replace("#include <color_fragment>", "");
  };
  mat.customProgramCacheKey = () => "ventanasCiudad";
  malla = new THREE.InstancedMesh(geo, mat, n);
  malla.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3();
  const MARCOS = { ladrillo: "#f2e4cc", deco: "#fff4e2", colonial: "#ffffff", pastel: "#fff6ea", vidrio: "#d8e2f0" };
  const col = new THREE.Color();
  ventanas.forEach((v, i) => {
    q.setFromAxisAngle(Y, v.ry); m.compose(P.set(v.x, v.y, v.z), q, S.set(v.ancho, v.alto, 1));
    malla.setMatrixAt(i, m); malla.setColorAt(i, col.set(MARCOS[v.f.estilo] || "#ffffff"));
    ponerDatos(v);
  });
  esc.add(malla);
  J.ventanasU = u;
  // 5) alféizares y balconcitos (con sombra: le dan relieve a la fachada)
  const sombras = J.calidad.sombras;
  const alfeizar = new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 0.09, 0.24), toon({ color: "#ffffff" }), ventanas.length);
  const balcones = ventanas.filter((v) => (v.f.estilo === "colonial" || v.f.estilo === "pastel") && v.fila >= 1 && !v.escena && v.semilla < 0.4);
  const losa = new THREE.InstancedMesh(new THREE.BoxGeometry(2.3, 0.12, 0.85), toon({ color: "#ffffff" }), Math.max(1, balcones.length));
  const [bc, bx] = lienzo(128, 64); bx.clearRect(0, 0, 128, 64); bx.fillStyle = "#2a2430"; bx.fillRect(0, 0, 128, 6); bx.fillRect(0, 58, 128, 6); for (let i = 0; i <= 16; i++) bx.fillRect(i * 8 - 1, 0, 3, 64);
  const tb = textura(bc);
  const barandal = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.3, 0.9), toon({ map: tb, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }), Math.max(1, balcones.length));
  ventanas.forEach((v, i) => {
    q.setFromAxisAngle(Y, v.ry); m.compose(P.set(v.x + v.nx * 0.08, v.y - v.alto / 2 - 0.03, v.z + v.nz * 0.08), q, S.set(v.ancho / ANCHO, 1, 1));
    alfeizar.setMatrixAt(i, m); alfeizar.setColorAt(i, col.set(MARCOS[v.f.estilo] || "#ffffff").multiplyScalar(0.92));
  });
  balcones.forEach((v, i) => {
    q.setFromAxisAngle(Y, v.ry);
    m.compose(P.set(v.x + v.nx * 0.42, v.y - v.alto / 2 - 0.1, v.z + v.nz * 0.42), q, S.set(1, 1, 1)); losa.setMatrixAt(i, m); losa.setColorAt(i, col.set("#f2e8dc"));
    m.compose(P.set(v.x + v.nx * 0.82, v.y - v.alto / 2 + 0.36, v.z + v.nz * 0.82), q, S.set(1, 1, 1)); barandal.setMatrixAt(i, m);
  });
  losa.count = barandal.count = balcones.length;
  alfeizar.castShadow = losa.castShadow = barandal.castShadow = sombras; alfeizar.receiveShadow = losa.receiveShadow = sombras;
  esc.add(alfeizar, losa, barandal);
  // 6) las dos que se animan de verdad
  for (const o of [vivo, kd]) {
    [o.c, o.x] = lienzo(o === kd ? 320 : 200, o === kd ? 290 : 226); o.t = textura(o.c);
    o.malla = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: o.t, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    o.malla.visible = false; esc.add(o.malla);
  }
  if (vk) { if (!vk.encendida) { vk.vez = 1; vk.encendida = true; vk.manual = 1; memo.ventanas.kdrama = 1; guardar(); pintarCelda(vk); ponerDatos(vk); } animarEn(kd, vk); }
  J.ventanas = ventanas;
}
function vecinaConEscena(v) { return ventanas.some((o) => o.escena && o.f === v.f && Math.abs(o.col - v.col) <= 1 && Math.abs(o.fila - v.fila) <= 0); }
function ponerDatos(v) { aV.setXYZW(v.i, v.semilla, v.umbral, v.manual, v.escena ? v.celda : -1); aV.needsUpdate = true; }
function pintarCelda(v) {
  const ox = (v.celda % COLS) * CW, oy = Math.floor(v.celda / COLS) * CH;
  atlasX.save(); atlasX.beginPath(); atlasX.rect(ox, oy, CW, CH); atlasX.clip(); atlasX.translate(ox, oy);
  try { pintarEscena(atlasX, v.escena.id, CW, CH, 2.2, { encendida: true }); } catch (e) { atlasX.fillStyle = "#ffcf8a"; atlasX.fillRect(0, 0, CW, CH); }
  atlasX.restore();
  atlasT.needsUpdate = true;
}
function animarEn(o, v) {
  o.v = v;
  o.malla.position.set(v.x + v.nx * 0.03, v.y, v.z + v.nz * 0.03); o.malla.rotation.set(0, v.ry, 0);
  o.malla.scale.set(v.ancho * 0.89, v.alto * 0.91, 1);
  o.malla.visible = true;
}
/* ¿Está prendida ahora? (lo que el shader decide, pero aquí) */
export function prendida(v) { return v.manual >= 0 ? v.manual > 0.5 : v.umbral < (J.ventanasU ? J.ventanasU.uNoche.value : 0); }
/* Prender o apagar una ventana cualquiera. Devuelve si quedó prendida. */
export function alternar(v) {
  const ahora = !prendida(v);
  v.manual = ahora ? 1 : 0;
  if (v.escena) {
    v.encendida = ahora;
    if (ahora) { if (!v.vez) { v.vez = 0; } pintarCelda(v); if (v !== kd.v) animarEn(vivo, v); }
    else if (vivo.v === v) vivo.malla.visible = false;
  }
  ponerDatos(v);
  return ahora;
}
/* La ventana bajo el dedo (la más cercana que mire a la cámara). */
const _p = { x: 0, y: 0, visible: true };
export function ventanaEn(px, py) {
  const cam = J.camara.position, f = (J.alto / 2) / Math.tan(THREE.MathUtils.degToRad(J.camara.fov / 2));
  let mejor = null, md = 1e9;
  for (const v of ventanas) {
    const dx = v.x - cam.x, dz = v.z - cam.z;
    if (Math.abs(dx) > 70 || Math.abs(dz) > 70) continue;
    if (dx * v.nx + dz * v.nz > 0) continue;   // de espaldas
    const d = Math.hypot(dx, v.y - cam.y, dz);
    if (d > 70 || d > md) continue;
    aPantalla(v.x, v.y, v.z, _p); if (!_p.visible) continue;
    const w = v.ancho / d * f, h = v.alto / d * f;
    if (Math.abs(px - _p.x) < w / 2 + 6 && Math.abs(py - _p.y) < h / 2 + 6) { md = d; mejor = v; }
  }
  return mejor;
}
export function contarEscenas() { return ventanasEscena.filter((v) => v.vez > 0).length; }
export function marcarVista(v) { v.vez = (v.vez || 0) + 1; memo.ventanas[v.escena.id] = v.vez; guardar(); }

/* Cada cuadro: la hora llega al shader y las dos ventanas vivas se repintan. */
let cadaVivo = 0;
export function actualizarVentanas(dt, ciclo) {
  const u = J.ventanasU;
  u.uNoche.value = ciclo.ventanas; u.uOscuro.value = ciclo.noche; u.uDia.value = Math.max(ciclo.dia, 0.12);
  u.uCieloA.value.copy(ciclo.medio); u.uCieloH.value.copy(ciclo.horizonte); u.uT.value = J.t;
  if ((cadaVivo -= dt) > 0) return;
  cadaVivo = J.calidad.nivel === "baja" ? 0.12 : 0.066;
  const cam = J.camara.position;
  for (const o of [vivo, kd]) {
    if (!o.v) continue;
    const d = Math.hypot(o.v.x - cam.x, o.v.z - cam.z);
    o.malla.visible = d < 60 && o.v.encendida;
    if (!o.malla.visible || d > 42) continue;
    try { pintarEscena(o.x, o.v.escena.id, o.c.width, o.c.height, J.t + 2, { encendida: true }); } catch (e) { /* nada */ }
    o.t.needsUpdate = true;
    o.malla.material.color.setScalar(1 + ciclo.noche * 0.7);
  }
}
export function ventanaKdrama() { return kd.v; }
export function animarVentana(v) { if (v !== kd.v) animarEn(vivo, v); }
void elegir; void contar; void MANZANAS;
