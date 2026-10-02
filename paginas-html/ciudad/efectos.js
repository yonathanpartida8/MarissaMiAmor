/*
 * LOS EFECTOS — chispas, fuego, humo, polvo, agua, corazones, escombros,
 * rayos, ondas expansivas, la lluvia y el aura del Modo Dios.
 *
 * Nada se crea ni se tira mientras se juega: todo sale de pools fijos que
 * se reciclan. Las partículas son tres sistemas de puntos (brillantes,
 * opacas y corazones): tres llamadas de dibujo para todas. La lluvia se
 * calcula entera en la GPU.
 */
import { J, THREE, rnd, clamp, TAU, brillo, lienzo, textura } from "./base.js";

/* ══════════════════ PARTÍCULAS ══════════════════ */
const VS = `
attribute float tam; attribute vec4 col;
uniform float uEsc;
varying vec4 vC;
void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = tam * uEsc / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`;
const FS = `uniform sampler2D uMap; varying vec4 vC; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); if (gl_FragColor.a < 0.01) discard; }`;
class Sistema {
  constructor(escena, max, mapa, aditivo) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3); this.t = new Float32Array(max); this.c = new Float32Array(max * 4);
    this.d = []; for (let i = 0; i < max; i++) this.d.push({ vx: 0, vy: 0, vz: 0, vida: 0, dur: 1, tam: 1, crece: 0, g: 0, roce: 0, r: 1, gg: 1, b: 1, a: 1, tipo: 0, piso: 0 });
    const geo = new THREE.BufferGeometry();
    this.ap = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage);
    this.at = new THREE.BufferAttribute(this.t, 1).setUsage(THREE.DynamicDrawUsage);
    this.ac = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", this.ap); geo.setAttribute("tam", this.at); geo.setAttribute("col", this.ac);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uMap: { value: mapa }, uEsc: { value: 300 } } });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = aditivo ? 5 : 4;
    escena.add(this.pts);
  }
  emitir(x, y, z, o) {
    if (this.n >= this.max * J.calidad.particulas) return;
    const i = this.n++, d = this.d[i];
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    d.vx = o.vx || 0; d.vy = o.vy || 0; d.vz = o.vz || 0; d.vida = 0; d.dur = o.dur || 1; d.tam = o.tam || 1; d.crece = o.crece || 0; d.g = o.g || 0; d.roce = o.roce || 0;
    const c = o.color || [1, 1, 1]; d.r = c[0]; d.gg = c[1]; d.b = c[2]; d.a = o.a ?? 1; d.piso = o.piso ?? -1e9; d.rebota = o.rebota || 0;
  }
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
      this.c[i * 4] = d.r; this.c[i * 4 + 1] = d.gg; this.c[i * 4 + 2] = d.b; this.c[i * 4 + 3] = Math.max(0, a);
    }
    this.pts.geometry.setDrawRange(0, this.n);
    this.ap.needsUpdate = this.at.needsUpdate = this.ac.needsUpdate = true;
    this.mat.uniforms.uEsc.value = J.alto * 0.7 * J.dpr;
  }
}
let luz, opaco, amor;
/* ── escombros (cubitos que rebotan) ── */
const ESC = 160; let escombros = null; const escD = []; let escN = 0;
/* ── ondas expansivas, rayos, destellos ── */
const ondas = []; const rayos = []; let luces = [];

export function iniciarEfectos(escena) {
  luz = new Sistema(escena, 1400, brillo([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,0)"]], 64), true);
  opaco = new Sistema(escena, 700, brillo([[0, "rgba(255,255,255,.9)"], [0.5, "rgba(255,255,255,.4)"], [1, "rgba(255,255,255,0)"]], 64), false);
  const [c, x] = lienzo(64, 64);
  x.fillStyle = "#fff"; x.beginPath(); x.moveTo(32, 54); x.bezierCurveTo(4, 36, 8, 10, 32, 22); x.bezierCurveTo(56, 10, 60, 36, 32, 54); x.fill();
  amor = new Sistema(escena, 300, textura(c), false);
  escombros = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), ESC);
  escombros.instanceMatrix.setUsage(THREE.DynamicDrawUsage); escombros.frustumCulled = false; escombros.castShadow = J.calidad.sombras;
  for (let i = 0; i < ESC; i++) { escD.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, vr: 0, s: 1, vida: 0, dur: 1 }); escombros.setColorAt(i, new THREE.Color("#555")); }
  escombros.count = 0; escena.add(escombros);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffe6b0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; escena.add(m); ondas.push({ m, t: 1, dur: 1, r: 1 });
  }
  for (let i = 0; i < 3; i++) { const l = new THREE.PointLight("#ffb070", 0, 30, 2); escena.add(l); luces.push({ l, t: 1, dur: 1, i: 0 }); }
  iniciarLluvia(escena);
  iniciarAura(escena);
}

/* ── lo que piden los demás ── */
const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const COL = { chispa: C("#ffe2a0"), fuego: C("#ff8a3a"), fuego2: C("#ffcf6a"), humo: C("#3a3644"), polvo: C("#8a8090"), agua: C("#bfe6ff"), oro: C("#ffd36e"), rosa: C("#ff7ab0"), azul: C("#a8c8ff"), blanco: C("#ffffff"), verde: C("#8affb0") };
export function chispas(x, y, z, n, fuerza = 8, color = "chispa") {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), e = rnd(-0.3, 1), v = rnd(fuerza * 0.3, fuerza); luz.emitir(x, y, z, { vx: Math.cos(a) * v * (1 - Math.abs(e)), vy: e * v + 2, vz: Math.sin(a) * v * (1 - Math.abs(e)), dur: rnd(0.3, 0.8), tam: rnd(0.12, 0.28), g: 14, color: COL[color] || color, piso: 0.05, rebota: 0.3 }); }
}
export function fuego(x, y, z, n = 1, k = 1) {
  for (let i = 0; i < n; i++) luz.emitir(x + rnd(-0.4, 0.4) * k, y, z + rnd(-0.4, 0.4) * k, { vx: rnd(-0.5, 0.5), vy: rnd(1.2, 2.6) * k, vz: rnd(-0.5, 0.5), dur: rnd(0.4, 0.9), tam: rnd(0.9, 1.6) * k, crece: -0.4, color: Math.random() < 0.5 ? COL.fuego : COL.fuego2, roce: 1 });
}
export function humo(x, y, z, n = 1, k = 1, oscuro = true) {
  for (let i = 0; i < n; i++) opaco.emitir(x + rnd(-0.3, 0.3), y, z + rnd(-0.3, 0.3), { vx: rnd(-0.4, 0.4), vy: rnd(0.8, 1.8), vz: rnd(-0.4, 0.4), dur: rnd(1.6, 3.2), tam: rnd(1.2, 2) * k, crece: 2.2, color: oscuro ? COL.humo : COL.polvo, a: 0.55, roce: 0.6 });
}
export function polvo(x, y, z, n = 6, k = 1) {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(1, 4) * k; opaco.emitir(x, y + 0.2, z, { vx: Math.cos(a) * v, vy: rnd(0.3, 1.5), vz: Math.sin(a) * v, dur: rnd(0.8, 1.6), tam: rnd(0.7, 1.3) * k, crece: 1.8, color: COL.polvo, a: 0.5, roce: 2 }); }
}
export function agua(x, y, z, n = 6, k = 1) {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(1, 5) * k; luz.emitir(x, y, z, { vx: Math.cos(a) * v, vy: rnd(3, 8) * k, vz: Math.sin(a) * v, dur: rnd(0.5, 1.1), tam: rnd(0.2, 0.45), g: 16, color: COL.agua, a: 0.7, piso: 0.05 }); }
}
export function brillos(x, y, z, n = 6, color = "oro", r = 0.6, vel = 1.2) {
  for (let i = 0; i < n; i++) luz.emitir(x + rnd(-r, r), y + rnd(-r, r), z + rnd(-r, r), { vx: rnd(-vel, vel), vy: rnd(-vel, vel) + 0.5, vz: rnd(-vel, vel), dur: rnd(0.5, 1.2), tam: rnd(0.12, 0.3), color: COL[color] || color, roce: 1.5 });
}
export function corazones(x, y, z, n = 6, fuerza = 2) {
  for (let i = 0; i < n; i++) amor.emitir(x + rnd(-0.3, 0.3), y, z + rnd(-0.3, 0.3), { vx: rnd(-fuerza, fuerza) * 0.5, vy: rnd(1, 2.4) * fuerza * 0.6, vz: rnd(-fuerza, fuerza) * 0.5, dur: rnd(1.4, 2.4), tam: rnd(0.35, 0.6), g: -0.3, color: Math.random() < 0.5 ? COL.rosa : C("#ff4d7d"), roce: 1 });
}
export function lluviaDeCorazones(cx, cz, r) { amor.emitir(cx + rnd(-r, r), rnd(14, 20), cz + rnd(-r, r), { vx: rnd(-0.5, 0.5), vy: -rnd(1.5, 2.5), vz: rnd(-0.5, 0.5), dur: 7, tam: rnd(0.4, 0.7), color: Math.random() < 0.5 ? COL.rosa : C("#ffb0d0"), piso: 0.2 }); }
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
  o.t = 0; o.dur = dur; o.r = radio; o.m.position.set(x, y + 0.1, z); o.m.material.color.set(color); o.m.visible = true;
}
export function destello(x, y, z, intensidad = 8, color = "#ffb070", dur = 0.5) {
  const l = luces.find((q) => q.t >= q.dur) || luces[0];
  l.t = 0; l.dur = dur; l.i = intensidad; l.l.color.set(color); l.l.position.set(x, y, z);
}
/* Un rayo de verdad: ramificado, con cintas que miran a la cámara. */
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
  for (let k = 0; k < 3; k++) { const i = 2 + Math.floor(rnd(pts.length - 4)), a = pts[i]; const b = a.clone().add(new THREE.Vector3(rnd(-3, 3), rnd(-3, 0), rnd(-3, 3))); ramas.push([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(-0.5, 0.5))), b]); }
  const cam = J.camara.position, pos = [], idx = [];
  for (const [r, lista] of ramas.entries()) {
    const w = r === 0 ? grosor : grosor * 0.5;
    for (let i = 0; i < lista.length - 1; i++) {
      const a = lista[i], b = lista[i + 1], dir = b.clone().sub(a), aCam = cam.clone().sub(a), lado = dir.clone().cross(aCam).normalize().multiplyScalar(w);
      const base = pos.length / 3;
      pos.push(a.x - lado.x, a.y - lado.y, a.z - lado.z, a.x + lado.x, a.y + lado.y, a.z + lado.z, b.x + lado.x, b.y + lado.y, b.z + lado.z, b.x - lado.x, b.y - lado.y, b.z - lado.z);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  let r = rayos.find((q) => q.t >= 0.5);
  if (!r) {
    if (rayos.length >= 4) r = rayos[0];
    else { r = { m: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), t: 0 }; r.m.frustumCulled = false; J.escena.add(r.m); rayos.push(r); }
  }
  if (r.m.geometry !== geo) { r.m.geometry.dispose(); r.m.geometry = geo; }
  r.m.material.color.set(color); r.t = 0; r.m.visible = true;
  destello(hasta.x, hasta.y + 1, hasta.z, 20, "#c8c0ff", 0.4);
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
    vertexShader: "attribute float sem; attribute float punta; uniform float uT; uniform vec3 uCentro; varying float vA; void main(){ vec3 p = position + vec3(floor(uCentro.x/70.0)*70.0, 0.0, floor(uCentro.z/70.0)*70.0); p.x += (uCentro.x - p.x) > 35.0 ? 70.0 : ((uCentro.x - p.x) < -35.0 ? -70.0 : 0.0); p.z += (uCentro.z - p.z) > 35.0 ? 70.0 : ((uCentro.z - p.z) < -35.0 ? -70.0 : 0.0); float y = mod(sem*40.0 - uT*(22.0+sem*6.0), 40.0); p.y = y + uCentro.y*0.0 - punta*0.9; p.x += punta*0.18; vA = 0.35 + sem*0.35; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }",
    fragmentShader: "uniform float uNivel; varying float vA; void main(){ gl_FragColor = vec4(0.75,0.82,1.0, vA*uNivel); }",
  });
  lluvia = new THREE.LineSegments(g, m); lluvia.frustumCulled = false; lluvia.renderOrder = 6; lluvia.visible = false;
  escena.add(lluvia);
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
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,240,190,.75)"], [0.3, "rgba(255,200,110,.3)"], [1, "rgba(255,170,90,0)"]], 128), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(4.2, 4.2, 1); g.add(halo);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 6, 48), new THREE.MeshBasicMaterial({ color: "#ffe2a0", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  anillo.rotation.x = Math.PI / 2; g.add(anillo);
  const anillo2 = anillo.clone(); anillo2.material = anillo.material.clone(); anillo2.material.color.set("#ff9ec8"); anillo2.scale.setScalar(0.8); g.add(anillo2);
  const pl = new THREE.PointLight("#ffd28a", 0, 9, 2); pl.position.y = 0.4; g.add(pl);
  g.visible = false; escena.add(g);
  aura = { g, halo, anillo, anillo2, pl };
}
export function actualizarAura(x, y, z, nivel, dt) {
  if (!aura) return;
  aura.g.visible = nivel > 0.01;
  if (!aura.g.visible) return;
  aura.g.position.set(x, y + 1.05, z);
  const p = 1 + Math.sin(J.t * 4) * 0.06;
  aura.halo.material.opacity = nivel * 0.9; aura.halo.scale.set(4.2 * p * nivel, 4.6 * p * nivel, 1);
  aura.anillo.rotation.z += dt * 2; aura.anillo.position.y = Math.sin(J.t * 2) * 0.6; aura.anillo.material.opacity = nivel * 0.8;
  aura.anillo2.rotation.z -= dt * 3; aura.anillo2.position.y = -Math.sin(J.t * 2) * 0.6; aura.anillo2.material.opacity = nivel * 0.6;
  aura.pl.intensity = 6 * nivel;
  if (Math.random() < dt * 22 * nivel) { const a = rnd(TAU), r = rnd(0.4, 0.8); luz.emitir(x + Math.cos(a) * r, y + rnd(0.1, 1.8), z + Math.sin(a) * r, { vx: 0, vy: rnd(0.8, 2), vz: 0, dur: rnd(0.6, 1.1), tam: rnd(0.08, 0.2), color: Math.random() < 0.7 ? COL.oro : COL.rosa, roce: 1 }); }
}

/* ══════════════════ CADA CUADRO ══════════════════ */
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
export function actualizarEfectos(dt) {
  luz.actualizar(dt); opaco.actualizar(dt); amor.actualizar(dt);
  for (let i = 0; i < escN; i++) {
    const d = escD[i]; d.vida += dt;
    if (d.vida >= d.dur) { const u = --escN; if (i !== u) { const t = escD[i]; escD[i] = escD[u]; escD[u] = t; const ci = new THREE.Color(); escombros.getColorAt(u, ci); escombros.setColorAt(i, ci); i--; } continue; }
    d.vy -= 18 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.rx += d.vr * dt;
    if (d.y < d.s / 2) { d.y = d.s / 2; d.vy *= -0.35; d.vx *= 0.6; d.vz *= 0.6; d.vr *= 0.6; }
    const s = d.s * Math.min(1, (d.dur - d.vida) * 2);
    M.compose(V.set(d.x, d.y, d.z), Q.setFromEuler(E.set(d.rx, d.ry, d.rx * 0.5)), S.set(s, s * 0.7, s * 1.2));
    escombros.setMatrixAt(i, M);
  }
  escombros.count = escN; escombros.instanceMatrix.needsUpdate = true; escombros.instanceColor.needsUpdate = true;
  for (const o of ondas) { if (o.t >= o.dur) { o.m.visible = false; continue; } o.t += dt; const k = o.t / o.dur, r = o.r * (1 - Math.pow(1 - k, 3)); o.m.scale.set(r, 1, r); o.m.material.opacity = (1 - k) * 0.85; }
  for (const r of rayos) { if (r.t >= 0.5) { r.m.visible = false; continue; } r.t += dt; r.m.material.opacity = r.t < 0.06 || (r.t > 0.12 && r.t < 0.2) ? 1 : Math.max(0, 0.45 - r.t * 0.6); }
  for (const l of luces) { if (l.t >= l.dur) { l.l.intensity = 0; continue; } l.t += dt; l.l.intensity = l.i * (1 - l.t / l.dur) ** 2; }
  if (lluvia) lluvia.material.uniforms.uT.value = J.t, lluvia.material.uniforms.uCentro.value.copy(J.oyente ? new THREE.Vector3(J.oyente.x, 0, J.oyente.z) : J.camara.position);
}
void clamp;
