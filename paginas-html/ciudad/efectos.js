/*
 * LOS EFECTOS — chispas, fuego, humo, polvo, agua, corazones, escombros,
 * bolas de fuego, rayos, ondas, columnas de luz, orbes de energía, la lluvia
 * y el aura del Modo Dios.
 *
 * Todo trabaja en luz «de verdad» (valores por encima de 1): lo que brilla
 * mucho lo recoge el resplandor del postproceso y se derrama bonito, y los
 * destellos fuertes encienden una luz puntual real que ilumina el piso, las
 * paredes y a la gente de alrededor.
 *
 * Nada se crea ni se tira mientras se juega: todo sale de pools fijos que
 * se reciclan. Las partículas son tres sistemas de puntos (brillantes,
 * opacas y corazones): tres llamadas de dibujo para todas. La lluvia se
 * calcula entera en la GPU.
 */
import { J, THREE, rnd, clamp, TAU, brillo, lienzo, textura, toon, capaEfectos } from "./base.js";

/* ══════════════════ PARTÍCULAS ══════════════════ */
const VS = `
attribute float tam; attribute vec4 col;
uniform float uEsc;
varying vec4 vC;
void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0);
  // pegadas a la cámara se desvanecen (si no, una sola bolita de humo tapa media pantalla)
  vC.a *= smoothstep(0.8, 3.2, -mv.z);
  gl_PointSize = min(tam * uEsc / max(0.5, -mv.z), 420.0); gl_Position = projectionMatrix * mv; }`;
const FS = `uniform sampler2D uMap; varying vec4 vC; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); if (gl_FragColor.a < 0.01) discard; }`;
class Sistema {
  constructor(escena, max, mapa, aditivo) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3); this.t = new Float32Array(max); this.c = new Float32Array(max * 4);
    this.d = []; for (let i = 0; i < max; i++) this.d.push({ vx: 0, vy: 0, vz: 0, vida: 0, dur: 1, tam: 1, crece: 0, g: 0, roce: 0, r: 1, gg: 1, b: 1, r2: -1, g2: 0, b2: 0, a: 1, piso: 0 });
    const geo = new THREE.BufferGeometry();
    this.ap = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage);
    this.at = new THREE.BufferAttribute(this.t, 1).setUsage(THREE.DynamicDrawUsage);
    this.ac = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", this.ap); geo.setAttribute("tam", this.at); geo.setAttribute("col", this.ac);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uMap: { value: mapa }, uEsc: { value: 300 } } });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = aditivo ? 5 : 4;
    escena.add(capaEfectos(this.pts));
  }
  emitir(x, y, z, o) {
    if (this.n >= this.max * J.calidad.particulas) return;
    const i = this.n++, d = this.d[i];
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    d.vx = o.vx || 0; d.vy = o.vy || 0; d.vz = o.vz || 0; d.vida = 0; d.dur = o.dur || 1; d.tam = o.tam || 1; d.crece = o.crece || 0; d.g = o.g || 0; d.roce = o.roce || 0;
    const c = o.color || [1, 1, 1]; d.r = c[0]; d.gg = c[1]; d.b = c[2];
    const c2 = o.color2; if (c2) { d.r2 = c2[0]; d.g2 = c2[1]; d.b2 = c2[2]; } else d.r2 = -1;
    d.a = o.a ?? 1; d.piso = o.piso ?? -1e9; d.rebota = o.rebota || 0;
  }
  vaciar() { this.n = 0; this.pts.geometry.setDrawRange(0, 0); }
  actualizar(dt) {
    for (let i = 0; i < this.n; i++) {
      const d = this.d[i]; d.vida += dt;
      if (d.vida >= d.dur) { // se cambia por el último (sin huecos)
        const u = --this.n;
        if (i !== u) { this.p.copyWithin(i * 3, u * 3, u * 3 + 3); const tmp = this.d[i]; this.d[i] = this.d[u]; this.d[u] = tmp; i--; }
        continue;
      }
      d.vy -= d.g * dt;
      if (d.roce) { const k = Math.exp(-d.roce * dt); d.vx *= k; d.vy *= k; d.vz *= k; }
      let y = this.p[i * 3 + 1] + d.vy * dt;
      if (y < d.piso) { y = d.piso; d.vy = -d.vy * d.rebota; d.vx *= 0.6; d.vz *= 0.6; }
      this.p[i * 3] += d.vx * dt; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] += d.vz * dt;
      const k = d.vida / d.dur;
      this.t[i] = d.tam * (1 + d.crece * k);
      const a = d.a * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9);
      if (d.r2 >= 0) { this.c[i * 4] = d.r + (d.r2 - d.r) * k; this.c[i * 4 + 1] = d.gg + (d.g2 - d.gg) * k; this.c[i * 4 + 2] = d.b + (d.b2 - d.b) * k; }
      else { this.c[i * 4] = d.r; this.c[i * 4 + 1] = d.gg; this.c[i * 4 + 2] = d.b; }
      this.c[i * 4 + 3] = Math.max(0, a);
    }
    this.pts.geometry.setDrawRange(0, this.n);
    this.ap.needsUpdate = this.at.needsUpdate = this.ac.needsUpdate = true;
    this.mat.uniforms.uEsc.value = J.alto * 0.7 * J.dpr;
  }
}
let luz, opaco, amor, llama;
/* ── escombros (cubitos que rebotan) ── */
const ESC = 160; let escombros = null; const escD = []; let escN = 0;
/* ── ondas expansivas, rayos, destellos, bolas de fuego, orbes, columnas ── */
const ondas = [], rayos = [], luces = [], bolas = [], orbes = [];
let columna = null;

export function iniciarEfectos(escena) {
  luz = new Sistema(escena, 1600, brillo([[0, "rgba(255,255,255,1)"], [0.22, "rgba(255,255,255,.6)"], [0.55, "rgba(255,255,255,.12)"], [1, "rgba(255,255,255,0)"]], 64), true);
  // la llama: una gota de luz (más ancha abajo)
  const [lc, lx] = lienzo(64, 64); const g = lx.createRadialGradient(32, 40, 2, 32, 36, 30); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
  lx.fillStyle = g; lx.beginPath(); lx.moveTo(32, 2); lx.bezierCurveTo(52, 26, 60, 44, 32, 62); lx.bezierCurveTo(4, 44, 12, 26, 32, 2); lx.fill();
  llama = new Sistema(escena, 700, textura(lc), true);
  // el humo: bolitas suaves con borde «de dibujo»
  const [hc, hx] = lienzo(64, 64); const gh = hx.createRadialGradient(28, 26, 2, 32, 32, 30); gh.addColorStop(0, "rgba(255,255,255,.95)"); gh.addColorStop(0.62, "rgba(235,235,240,.8)"); gh.addColorStop(0.8, "rgba(200,200,215,.35)"); gh.addColorStop(1, "rgba(200,200,215,0)");
  hx.fillStyle = gh; hx.fillRect(0, 0, 64, 64);
  opaco = new Sistema(escena, 700, textura(hc), false);
  const [c, x] = lienzo(64, 64);
  x.fillStyle = "#fff"; x.beginPath(); x.moveTo(32, 54); x.bezierCurveTo(4, 36, 8, 10, 32, 22); x.bezierCurveTo(56, 10, 60, 36, 32, 54); x.fill();
  amor = new Sistema(escena, 300, textura(c), false);
  escombros = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon({ color: "#ffffff" }), ESC);
  escombros.instanceMatrix.setUsage(THREE.DynamicDrawUsage); escombros.frustumCulled = false; escombros.castShadow = J.calidad.sombras;
  for (let i = 0; i < ESC; i++) { escD.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, vr: 0, s: 1, vida: 0, dur: 1 }); escombros.setColorAt(i, new THREE.Color("#555")); }
  escombros.count = 0; escena.add(escombros);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffe6b0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; m.frustumCulled = false; escena.add(capaEfectos(m)); ondas.push({ m, t: 1, dur: 1, r: 1, col: new THREE.Color() });
  }
  const nL = J.calidad.nivel === "baja" ? 2 : 4;
  for (let i = 0; i < nL; i++) { const l = new THREE.PointLight("#ffb070", 0, 34, 1.6); escena.add(l); luces.push({ l, t: 1, dur: 1, i: 0 }); }
  // bolas de fuego (una esfera que se infla, caliente por dentro)
  const bolaMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uK: { value: 0 }, uT: { value: 0 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }",
    fragmentShader: `uniform float uK, uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        // fuego «de dibujo»: tres bandas de color (centro casi blanco, naranja, rojo) que se deshacen al final
        float f = clamp(dot(vN, vV), 0.0, 1.0);
        float n = sin(vP.x * 9.0 + uT * 7.0) * sin(vP.y * 8.0 - uT * 9.0) * sin(vP.z * 7.0 + uT * 5.0) * 0.5 + 0.5;
        float b = f * f * 0.85 + n * 0.35 - uK * 0.75;
        if (b < 0.02) discard;
        vec3 c = b > 0.62 ? vec3(4.0, 3.3, 1.9) : b > 0.36 ? vec3(3.4, 1.35, 0.32) : vec3(1.7, 0.36, 0.14);
        float a = (1.0 - uK * 0.7) * (0.35 + 0.65 * f) * smoothstep(0.02, 0.14, b);
        gl_FragColor = vec4(c * a, a); }`,
  });
  const esf = new THREE.IcosahedronGeometry(1, 3);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(esf, bolaMat()); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; escena.add(capaEfectos(m)); bolas.push({ m, t: 1, dur: 1, r: 1 }); }
  // orbes de energía (la explosión cargada, el aura del poder)
  const orbeMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: new THREE.Color(3, 2.2, 1.2) }, uT: { value: 0 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uT; varying vec3 vN; varying vec3 vV; void main(){ float f = clamp(dot(vN, vV), 0.0, 1.0); float a = pow(f, 1.5) * 0.9 + pow(1.0 - f, 3.0) * 0.6; gl_FragColor = vec4(uC * a * (0.9 + 0.1 * sin(uT * 30.0)), a); }",
  });
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(esf, orbeMat()); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; escena.add(capaEfectos(m)); orbes.push({ m, libre: true }); }
  // la columna de luz de la transformación
  columna = { m: new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 60, 32, 1, true).translate(0, 30, 0), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uA: { value: 0 }, uT: { value: 0 } },
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uA, uT; varying vec2 vU; void main(){ float r = 0.6 + 0.4 * sin(vU.x * 40.0 + uT * 6.0 + vU.y * 30.0); float a = uA * (1.0 - vU.y) * (1.0 - vU.y) * r; gl_FragColor = vec4(vec3(1.9, 1.5, 0.9) * a, a); }",
  })), t: 9, dur: 1.6 };
  columna.m.visible = false; columna.m.frustumCulled = false; escena.add(capaEfectos(columna.m));
  iniciarLluvia(escena);
  iniciarAura(escena);
}

/* ── lo que piden los demás ── */
const C = (h, k = 1) => { const c = new THREE.Color(h).multiplyScalar(k); return [c.r, c.g, c.b]; };
const COL = {
  chispa: C("#ffe2a0", 2.4), fuego: C("#ff8a3a", 2.2), fuego2: C("#ffcf6a", 2.6), humo: C("#4a4452"), polvo: C("#b8aca8"), agua: C("#cfeaff", 1.4),
  oro: C("#ffd36e", 2.4), rosa: C("#ff7ab0", 2.2), azul: C("#a8c8ff", 2.6), blanco: C("#ffffff", 2.4), verde: C("#8affb0", 2.2),
};
const LLAMA_A = C("#fff2c8", 3.4), LLAMA_B = C("#ff5a20", 1.6);
export function chispas(x, y, z, n, fuerza = 8, color = "chispa") {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), e = rnd(-0.3, 1), v = rnd(fuerza * 0.3, fuerza); luz.emitir(x, y, z, { vx: Math.cos(a) * v * (1 - Math.abs(e)), vy: e * v + 2, vz: Math.sin(a) * v * (1 - Math.abs(e)), dur: rnd(0.3, 0.8), tam: rnd(0.1, 0.24), g: 14, color: COL[color] || color, piso: 0.05, rebota: 0.3 }); }
}
export function fuego(x, y, z, n = 1, k = 1) {
  for (let i = 0; i < n; i++) llama.emitir(x + rnd(-0.4, 0.4) * k, y, z + rnd(-0.4, 0.4) * k, { vx: rnd(-0.4, 0.4), vy: rnd(1.4, 2.8) * k, vz: rnd(-0.4, 0.4), dur: rnd(0.45, 0.95), tam: rnd(1.0, 1.8) * k, crece: -0.55, color: LLAMA_A, color2: LLAMA_B, roce: 1 });
}
export function humo(x, y, z, n = 1, k = 1, oscuro = true) {
  for (let i = 0; i < n; i++) opaco.emitir(x + rnd(-0.3, 0.3), y, z + rnd(-0.3, 0.3), { vx: rnd(-0.4, 0.4), vy: rnd(0.8, 1.8), vz: rnd(-0.4, 0.4), dur: rnd(1.8, 3.4), tam: rnd(1.2, 2) * k, crece: 2.2, color: oscuro ? COL.humo : COL.polvo, color2: oscuro ? C("#8a8494") : C("#d8d0d0"), a: 0.6, roce: 0.6 });
}
export function polvo(x, y, z, n = 6, k = 1) {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(1, 4) * k; opaco.emitir(x, y + 0.2, z, { vx: Math.cos(a) * v, vy: rnd(0.3, 1.5), vz: Math.sin(a) * v, dur: rnd(0.8, 1.6), tam: rnd(0.7, 1.3) * k, crece: 1.8, color: COL.polvo, a: 0.55, roce: 2 }); }
}
export function agua(x, y, z, n = 6, k = 1) {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(1, 5) * k; luz.emitir(x, y, z, { vx: Math.cos(a) * v, vy: rnd(3, 8) * k, vz: Math.sin(a) * v, dur: rnd(0.5, 1.1), tam: rnd(0.2, 0.45), g: 16, color: COL.agua, a: 0.55, piso: 0.05 }); }
}
export function brillos(x, y, z, n = 6, color = "oro", r = 0.6, vel = 1.2) {
  for (let i = 0; i < n; i++) luz.emitir(x + rnd(-r, r), y + rnd(-r, r), z + rnd(-r, r), { vx: rnd(-vel, vel), vy: rnd(-vel, vel) + 0.5, vz: rnd(-vel, vel), dur: rnd(0.5, 1.2), tam: rnd(0.1, 0.26), color: COL[color] || color, roce: 1.5 });
}
export function corazones(x, y, z, n = 6, fuerza = 2) {
  for (let i = 0; i < n; i++) amor.emitir(x + rnd(-0.3, 0.3), y, z + rnd(-0.3, 0.3), { vx: rnd(-fuerza, fuerza) * 0.5, vy: rnd(1, 2.4) * fuerza * 0.6, vz: rnd(-fuerza, fuerza) * 0.5, dur: rnd(1.4, 2.4), tam: rnd(0.35, 0.6), g: -0.3, color: Math.random() < 0.5 ? C("#ff7ab0", 1.6) : C("#ff4d7d", 1.6), roce: 1 });
}
export function lluviaDeCorazones(cx, cz, r) { amor.emitir(cx + rnd(-r, r), rnd(14, 20), cz + rnd(-r, r), { vx: rnd(-0.5, 0.5), vy: -rnd(1.5, 2.5), vz: rnd(-0.5, 0.5), dur: 7, tam: rnd(0.4, 0.7), color: Math.random() < 0.5 ? C("#ff7ab0", 1.5) : C("#ffb0d0", 1.5), piso: 0.2 }); }
export function escombro(x, y, z, n, color, fuerza = 6, tam = 0.25) {
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    if (escN >= ESC) break;
    const k = escN++, d = escD[k], a = rnd(TAU), v = rnd(fuerza * 0.3, fuerza);
    Object.assign(d, { x, y, z, vx: Math.cos(a) * v, vy: rnd(2, 1.2 * fuerza), vz: Math.sin(a) * v, rx: rnd(TAU), ry: rnd(TAU), vr: rnd(-10, 10), s: tam * rnd(0.5, 1.4), vida: 0, dur: rnd(3, 5) });
    escombros.setColorAt(k, c.clone().multiplyScalar(rnd(0.7, 1.1)));
  }
  escombros.instanceColor.needsUpdate = true;
}
export function onda(x, y, z, radio, dur = 0.7, color = "#ffe6b0") {
  const o = ondas.find((q) => q.t >= q.dur) || ondas[0];
  o.t = 0; o.dur = dur; o.r = radio; o.m.position.set(x, y + 0.12, z); o.col.set(color).multiplyScalar(2.2); o.m.material.color.copy(o.col); o.m.visible = true;
}
/* Una luz de verdad, un instante (ilumina lo que tenga alrededor). */
export function destello(x, y, z, intensidad = 8, color = "#ffb070", dur = 0.5) {
  const l = luces.find((q) => q.t >= q.dur) || luces.reduce((a, b) => (a.t / a.dur > b.t / b.dur ? a : b));
  l.t = 0; l.dur = dur; l.i = intensidad * 4; l.l.color.set(color); l.l.position.set(x, y, z);
}
/* La bola de fuego de una explosión: se infla rapidísimo y se apaga. */
export function bolaFuego(x, y, z, r = 3, dur = 0.7) {
  const b = bolas.find((q) => q.t >= q.dur) || bolas[0];
  b.t = 0; b.dur = dur; b.r = r; b.m.position.set(x, y, z); b.m.visible = true;
}
/* La columna de luz (la transformación del Modo Dios). */
export function columnaLuz(x, y, z, k = 1) { columna.t = 0; columna.dur = 1.8 * k; columna.m.position.set(x, y, z); columna.m.visible = true; }
/* Un orbe de energía que alguien mueve (devuelve un objeto con .poner y .soltar). */
export function orbe(color = "#ffd28a") {
  const o = orbes.find((q) => q.libre) || orbes[0];
  o.libre = false; o.m.visible = true; o.m.material.uniforms.uC.value.set(color).multiplyScalar(2.6);
  return { poner: (x, y, z, r) => { o.m.position.set(x, y, z); o.m.scale.setScalar(r); }, soltar: () => { o.libre = true; o.m.visible = false; } };
}
/* Un rayo de verdad: ramificado, con cintas que miran a la cámara (y su halo). */
export function rayo(desde, hasta, color = "#e8e4ff", grosor = 0.12) {
  const pts = [desde.clone(), hasta.clone()];
  let desv = desde.distanceTo(hasta) * 0.22;
  for (let n = 0; n < 5; n++) {
    for (let i = pts.length - 1; i > 0; i--) {
      const a = pts[i - 1], b = pts[i], m = a.clone().add(b).multiplyScalar(0.5);
      m.x += rnd(-desv, desv); m.y += rnd(-desv, desv) * 0.5; m.z += rnd(-desv, desv);
      pts.splice(i, 0, m);
    }
    desv *= 0.55;
  }
  const ramas = [pts];
  for (let k = 0; k < 4; k++) { const i = 2 + Math.floor(rnd(pts.length - 4)), a = pts[i]; const b = a.clone().add(new THREE.Vector3(rnd(-3, 3), rnd(-3, 0), rnd(-3, 3))); ramas.push([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(-0.5, 0.5))), b]); }
  const cam = J.camara.position;
  const cinta = (ancho) => {
    const pos = [], idx = [];
    for (const [r, lista] of ramas.entries()) {
      const w = r === 0 ? ancho : ancho * 0.5;
      for (let i = 0; i < lista.length - 1; i++) {
        const a = lista[i], b = lista[i + 1], dir = b.clone().sub(a), aCam = cam.clone().sub(a), lado = dir.clone().cross(aCam).normalize().multiplyScalar(w);
        const base = pos.length / 3;
        pos.push(a.x - lado.x, a.y - lado.y, a.z - lado.z, a.x + lado.x, a.y + lado.y, a.z + lado.z, b.x + lado.x, b.y + lado.y, b.z + lado.z, b.x - lado.x, b.y - lado.y, b.z - lado.z);
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); return geo;
  };
  let r = rayos.find((q) => q.t >= 0.5);
  if (!r) {
    if (rayos.length >= 4) r = rayos[0];
    else {
      const mk = (op) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; J.escena.add(capaEfectos(m)); return m; };
      r = { m: mk(1), h: mk(0.25), t: 0 }; rayos.push(r);
    }
  }
  r.m.geometry.dispose(); r.m.geometry = cinta(grosor); r.h.geometry.dispose(); r.h.geometry = cinta(grosor * 5);
  r.m.material.color.set(color).multiplyScalar(4); r.h.material.color.set(color).multiplyScalar(1.6); r.t = 0; r.m.visible = r.h.visible = true;
  destello(hasta.x, hasta.y + 1, hasta.z, 26, "#c8c0ff", 0.4);
  J.destelloPantalla = Math.max(J.destelloPantalla || 0, 0.12);
}
/* Que no quede nada en el aire (al apagar el Modo Dios). */
export function limpiar() {
  luz.vaciar(); llama.vaciar(); opaco.vaciar(); amor.vaciar();
  escN = 0; escombros.count = 0;
  for (const o of ondas) { o.t = o.dur; o.m.visible = false; }
  for (const r of rayos) { r.t = 1; r.m.visible = r.h.visible = false; }
  for (const l of luces) { l.t = l.dur; l.l.intensity = 0; }
  for (const b of bolas) { b.t = b.dur; b.m.visible = false; }
  for (const o of orbes) { o.libre = true; o.m.visible = false; }
  columna.t = columna.dur; columna.m.visible = false;
}

/* ══════════════════ LA LLUVIA (en la GPU) ══════════════════ */
let lluvia = null;
function iniciarLluvia(escena) {
  const n = 2600, pos = new Float32Array(n * 2 * 3), sem = new Float32Array(n * 2), punta = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const x = rnd(-35, 35), z = rnd(-35, 35), s = Math.random(); for (let k = 0; k < 2; k++) { pos.set([x, 0, z], (i * 2 + k) * 3); sem[i * 2 + k] = s; punta[i * 2 + k] = k; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("sem", new THREE.BufferAttribute(sem, 1)); g.setAttribute("punta", new THREE.BufferAttribute(punta, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uNivel: { value: 0 } },
    // cada gota «da la vuelta» alrededor del centro: siempre llueve donde estás, sin costuras
    vertexShader: "attribute float sem; attribute float punta; uniform float uT; uniform vec3 uCentro; varying float vA; void main(){ vec3 p = position; p.xz = uCentro.xz + mod(position.xz - uCentro.xz + 35.0, 70.0) - 35.0; float y = mod(sem*40.0 - uT*(22.0+sem*6.0), 40.0); p.y = y - punta*0.9; p.x += punta*0.18; vA = 0.35 + sem*0.35; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }",
    fragmentShader: "uniform float uNivel; varying float vA; void main(){ gl_FragColor = vec4(0.75,0.82,1.0, vA*uNivel); }",
  });
  lluvia = new THREE.LineSegments(g, m); lluvia.frustumCulled = false; lluvia.renderOrder = 6; lluvia.visible = false;
  escena.add(capaEfectos(lluvia));
}
export function lluviaNivel(n) {
  if (!lluvia) return;
  lluvia.visible = n > 0.01;
  lluvia.material.uniforms.uNivel.value = n * (J.calidad.nivel === "baja" ? 0.7 : 1);
  if (n > 0.2 && Math.random() < n * 0.6) { const c = J.oyente || J.camara.position; luz.emitir(c.x + rnd(-14, 14), 0.1, c.z + rnd(-14, 14), { vx: 0, vy: 1.5, vz: 0, dur: 0.25, tam: 0.25, color: COL.agua, a: 0.5 }); }
}

/* ══════════════════ EL AURA DEL MODO DIOS ══════════════════ */
let aura = null;
function iniciarAura(escena) {
  const g = new THREE.Group();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,240,190,.75)"], [0.3, "rgba(255,200,110,.3)"], [1, "rgba(255,170,90,0)"]], 128), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: new THREE.Color(1.6, 1.4, 1.1) }));
  halo.scale.set(4.2, 4.2, 1); g.add(halo);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  anillo.rotation.x = Math.PI / 2; g.add(anillo);
  const anillo2 = anillo.clone(); anillo2.material = anillo.material.clone(); anillo2.material.color.set(3, 1.2, 2); anillo2.scale.setScalar(0.8); g.add(anillo2);
  // un velo de luz que sube alrededor del cuerpo
  const velo = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 2.6, 24, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uA: { value: 0 }, uT: { value: 0 } },
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uA, uT; varying vec2 vU; void main(){ float r = smoothstep(0.55, 1.0, sin(vU.x * 50.0 + vU.y * 6.0 - uT * 4.0) * 0.5 + 0.5); float a = uA * r * (1.0 - vU.y) * smoothstep(0.0, 0.15, vU.y + 0.05); gl_FragColor = vec4(vec3(2.6, 2.0, 1.1) * a, a); }",
  }));
  velo.position.y = 0.25; g.add(velo);
  const pl = new THREE.PointLight("#ffd28a", 0, 10, 1.6); pl.position.y = 0.4; g.add(pl);
  g.visible = false; escena.add(capaEfectos(g));
  aura = { g, halo, anillo, anillo2, pl, velo };
}
export function actualizarAura(x, y, z, nivel, dt) {
  if (!aura) return;
  aura.g.visible = nivel > 0.01;
  aura.pl.intensity = 18 * nivel;
  if (!aura.g.visible) return;
  aura.g.position.set(x, y + 1.05, z);
  const p = 1 + Math.sin(J.t * 4) * 0.06;
  aura.halo.material.opacity = nivel * 0.9; aura.halo.scale.set(4.2 * p * nivel, 4.6 * p * nivel, 1);
  aura.anillo.rotation.z += dt * 2; aura.anillo.position.y = Math.sin(J.t * 2) * 0.6; aura.anillo.material.opacity = nivel * 0.8;
  aura.anillo2.rotation.z -= dt * 3; aura.anillo2.position.y = -Math.sin(J.t * 2) * 0.6; aura.anillo2.material.opacity = nivel * 0.6;
  aura.velo.material.uniforms.uA.value = nivel * 0.7; aura.velo.material.uniforms.uT.value = J.t;
  if (Math.random() < dt * 26 * nivel) { const a = rnd(TAU), r = rnd(0.4, 0.8); luz.emitir(x + Math.cos(a) * r, y + rnd(0.1, 1.8), z + Math.sin(a) * r, { vx: 0, vy: rnd(0.8, 2), vz: 0, dur: rnd(0.6, 1.1), tam: rnd(0.08, 0.2), color: Math.random() < 0.7 ? COL.oro : COL.rosa, roce: 1 }); }
}

/* ══════════════════ CADA CUADRO ══════════════════ */
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
export function actualizarEfectos(dt) {
  luz.actualizar(dt); llama.actualizar(dt); opaco.actualizar(dt); amor.actualizar(dt);
  for (let i = 0; i < escN; i++) {
    const d = escD[i]; d.vida += dt;
    if (d.vida >= d.dur) { const u = --escN; if (i !== u) { const t = escD[i]; escD[i] = escD[u]; escD[u] = t; const ci = new THREE.Color(); escombros.getColorAt(u, ci); escombros.setColorAt(i, ci); i--; } continue; }
    d.vy -= 18 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.rx += d.vr * dt;
    if (d.y < d.s / 2) { d.y = d.s / 2; d.vy *= -0.35; d.vx *= 0.6; d.vz *= 0.6; d.vr *= 0.6; }
    const s = d.s * Math.min(1, (d.dur - d.vida) * 2);
    M.compose(V.set(d.x, d.y, d.z), Q.setFromEuler(E.set(d.rx, d.ry, d.rx * 0.5)), S.set(s, s * 0.7, s * 1.2));
    escombros.setMatrixAt(i, M);
  }
  escombros.count = escN; escombros.instanceMatrix.needsUpdate = true; if (escombros.instanceColor) escombros.instanceColor.needsUpdate = true;
  for (const o of ondas) { if (o.t >= o.dur) { o.m.visible = false; continue; } o.t += dt; const k = o.t / o.dur, r = o.r * (1 - Math.pow(1 - k, 3)); o.m.scale.set(r, 1, r); o.m.material.opacity = (1 - k) * 0.9; }
  for (const r of rayos) { if (r.t >= 0.5) { r.m.visible = r.h.visible = false; continue; } r.t += dt; const op = r.t < 0.06 || (r.t > 0.12 && r.t < 0.2) ? 1 : Math.max(0, 0.45 - r.t * 0.6); r.m.material.opacity = op; r.h.material.opacity = op * 0.3; }
  for (const l of luces) { if (l.t >= l.dur) { l.l.intensity = 0; continue; } l.t += dt; l.l.intensity = l.i * (1 - l.t / l.dur) ** 2; }
  for (const b of bolas) { if (b.t >= b.dur) { b.m.visible = false; continue; } b.t += dt; const k = Math.min(1, b.t / b.dur); b.m.scale.setScalar(b.r * (0.25 + 0.75 * (1 - Math.pow(1 - k, 3)))); b.m.material.uniforms.uK.value = k; b.m.material.uniforms.uT.value += dt; }
  if (columna.t < columna.dur) { columna.t += dt; const k = columna.t / columna.dur; columna.m.material.uniforms.uA.value = Math.sin(Math.PI * Math.min(1, k)) * 0.7; columna.m.material.uniforms.uT.value += dt; columna.m.scale.set(1.2 * (1 - k * 0.6), 1, 1.2 * (1 - k * 0.6)); } else columna.m.visible = false;
  for (const o of orbes) if (!o.libre) o.m.material.uniforms.uT.value = J.t;
  if (lluvia) lluvia.material.uniforms.uT.value = J.t, lluvia.material.uniforms.uCentro.value.set(J.oyente ? J.oyente.x : J.camara.position.x, 0, J.oyente ? J.oyente.z : J.camara.position.z);
}
void clamp;
