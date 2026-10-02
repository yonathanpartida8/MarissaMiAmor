/*
 * LA CÁMARA — en 3D de verdad.
 *
 * Tres maneras de mirar:
 *   · SEGUIR: orbita alrededor del personaje (o del coche). Con el dedo se
 *     gira para cualquier lado, se baja hasta casi el piso para MIRAR EL
 *     CIELO o se sube para verlo todo desde arriba; con pellizco, se acerca
 *     o se aleja muchísimo. Todo con inercia suave: el dedo marca a dónde
 *     va y la cámara llega deslizándose, sin tirones. No se acomoda sola
 *     detrás de él mientras camina (eso peleaba con el dedo); sólo en el
 *     coche y sólo si no la estás moviendo.
 *   · DRON: la cámara se suelta. El joystick la mueve, ⤒ / ⤓ la suben y la
 *     bajan, y el dedo la gira. Para recorrer la ciudad desde cualquier
 *     altura y ángulo.
 *   · BANCA (mirador): sentados en una banca, la cámara se pone detrás de
 *     los dos y mira de frente la fachada de enfrente, recta, como en la
 *     calle 2D. Ahí se tocan las ventanas para prenderlas y apagarlas.
 *     Deslizar recorre la fachada de lado a lado.
 *
 * Nunca atraviesa edificios: si uno se mete entre la cámara y el
 * personaje, se acerca; y nunca baja del piso.
 */
import { J, THREE, clamp, lerp, amort, amortAng, difAng } from "./base.js";
import { edificioEn, alturaSuelo, fachadaEnfrente, chocarEdificios } from "./mundo.js";

export const cam = {
  modo: "seguir",
  yaw: -Math.PI / 2 + 0.55, pitch: 0.3, dist: 9,
  yawObj: -Math.PI / 2 + 0.55, pitchObj: 0.3, distObj: 9,
  x: 0, y: 1.5, z: 0, quieto: 0,
  dron: { x: 0, y: 8, z: 0, vx: 0, vy: 0, vz: 0 },
  mirador: null, mezcla: 0, lado: 0, ladoObj: 0,
  cine: null,
  fov: 60,
};
J.cam = cam;
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _mira = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const PITCH_MIN = -1.2, PITCH_MAX = 1.45;

export function cinematica(o) { cam.cine = { t: 0, dur: 5, ...o }; }
J.cinematicaCam = cinematica;
export function ponerModo(m) {
  if (m === cam.modo) return;
  if (m === "dron") { const c = J.camara.position; Object.assign(cam.dron, { x: c.x, y: Math.max(c.y, 2), z: c.z, vx: 0, vy: 0, vz: 0 }); cam.yawObj = cam.yaw; }
  cam.modo = m;
}
/* Entrar a la vista de banca: busca la fachada de enfrente. */
export function mirarDesdeBanca(b) {
  if (!b) { cam.mirador = null; return; }
  const fx = Math.sin(b.ry), fz = Math.cos(b.ry);
  const hit = fachadaEnfrente(b.x, b.z, fx, fz, 48);
  cam.mirador = { b, fx, fz, hit };
  cam.lado = cam.ladoObj = 0;
}

export function actualizarCamara(dt, E) {
  const camara = J.camara, yo = J.jugador, foco = yo.coche || yo;
  const toque = Math.abs(E.camDX) + Math.abs(E.camDY) > 0.5;
  if (toque) cam.quieto = 0; else cam.quieto += dt;
  let fov = J.ancho < J.alto ? 62 : 50;
  // ── el dedo marca a dónde va; la cámara llega deslizándose ──
  if (cam.mirador && cam.modo !== "dron") {
    cam.ladoObj = clamp(cam.ladoObj - E.camDX * 0.035, -9, 9);
  } else {
    cam.yawObj -= E.camDX * 0.0062;
    cam.pitchObj = clamp(cam.pitchObj + E.camDY * 0.0048, PITCH_MIN, PITCH_MAX);
  }
  cam.distObj = clamp(cam.distObj + E.zoom * (cam.distObj / 9), 2.6, 48);
  cam.yaw = amortAng(cam.yaw, cam.yawObj, 14, dt);
  cam.pitch = amort(cam.pitch, cam.pitchObj, 14, dt);
  cam.dist = amort(cam.dist, cam.distObj, 9, dt);
  cam.lado = amort(cam.lado, cam.ladoObj, 6, dt);

  let px, py, pz, mx, my, mz;
  if (cam.modo === "dron") {
    // ── DRON: libre ──
    const d = cam.dron, fwx = -Math.sin(cam.yaw), fwz = -Math.cos(cam.yaw), rx = -fwz, rz = fwx;
    const v = 14 * (E.correr ? 2 : 1), vx = (rx * E.mx - fwx * E.mz) * v, vz = (rz * E.mx - fwz * E.mz) * v, vy = ((E.subir ? 1 : 0) - (E.bajar ? 1 : 0)) * v * 0.7;
    d.vx = amort(d.vx, vx, 5, dt); d.vz = amort(d.vz, vz, 5, dt); d.vy = amort(d.vy, vy, 5, dt);
    d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
    d.x = clamp(d.x, -140, 140); d.z = clamp(d.z, -140, 140); d.y = clamp(d.y, alturaSuelo(d.x, d.z, d.y) + 0.6, 160);
    chocarEdificios(d, 0.5, d.y);
    px = d.x; py = d.y; pz = d.z;
    // mirar hacia donde apunta (pitch positivo = hacia abajo)
    const cp = Math.cos(cam.pitch);
    mx = px - Math.sin(cam.yaw) * cp; my = py - Math.sin(cam.pitch); mz = pz - Math.cos(cam.yaw) * cp;
  } else {
    // ── SEGUIR ──
    // al subir al coche la cámara se va detrás (así «adelante» es adelante); luego se acomoda sola si no la mueves
    if (yo.coche && yo.coche !== cam.cocheVisto) { cam.cocheVisto = yo.coche; cam.yawObj = cam.yaw + difAng(yo.coche.ry + Math.PI, cam.yaw); cam.pitchObj = clamp(cam.pitchObj, 0.12, 0.45); }
    if (!yo.coche) cam.cocheVisto = null;
    if (yo.coche && cam.quieto > 1.6 && Math.abs(yo.coche.vel) > 2) cam.yawObj = amortAng(cam.yawObj, yo.coche.ry + Math.PI, 1.4, dt);
    const extra = (yo.vuela ? 3 + clamp(Math.hypot(yo.vx, yo.vz) / 4, 0, 5) : 0) + (yo.coche ? 3.5 : 0);
    let d = cam.dist + extra, pitch = cam.pitch, yaw = cam.yaw;
    let fx = foco.x, fy = foco.y + (yo.coche ? 1.2 : 1.45), fz = foco.z;
    if (yo.banca && !cam.mirador) fy = foco.y + 1.0;
    // cinemática: un ratito mira hacia el evento
    let kc = 0;
    if (cam.cine) {
      const c = cam.cine; c.t += dt;
      kc = Math.min(1, c.t / 1.2) * Math.min(1, (c.dur - c.t) / 1.2);
      if (c.t > c.dur) cam.cine = null;
      else { pitch = lerp(pitch, c.pitch ?? pitch, kc); d = lerp(d, c.dist ?? d, kc); if (c.yaw != null) yaw = yaw + difAng(c.yaw, yaw) * kc; if (c.foco) { fx = lerp(fx, c.foco.x, kc * 0.5); fy = lerp(fy, c.foco.y, kc * 0.5); fz = lerp(fz, c.foco.z, kc * 0.5); } }
    }
    cam.x = amort(cam.x, fx, 12, dt); cam.y = amort(cam.y, fy, 10, dt); cam.z = amort(cam.z, fz, 12, dt);
    const cp = Math.cos(pitch);
    _d.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);   // del personaje hacia la cámara
    px = cam.x + _d.x * d; py = cam.y + _d.y * d; pz = cam.z + _d.z * d;
    // si hay un edificio entre el personaje y la cámara, se acerca
    for (let k = 0.15; k <= 1.001; k += 0.085) {
      const sx = lerp(cam.x, px, k), sy = lerp(cam.y, py, k), sz = lerp(cam.z, pz, k), e = edificioEn(sx, sz);
      if (e && sy < e.h + 0.4) { const kk = Math.max(0.08, k - 0.12); px = lerp(cam.x, px, kk); py = lerp(cam.y, py, kk); pz = lerp(cam.z, pz, kk); break; }
    }
    // nunca debajo del piso (y si estás mirando al cielo, se queda abajito y mira hacia arriba)
    const piso = alturaSuelo(px, pz, py) + 0.35;
    if (py < piso) py = piso;
    mx = px - _d.x; my = py - _d.y; mz = pz - _d.z;
    if (cam.cine && cam.cine.mirar) { const m = cam.cine.mirar, k = kc * (cam.cine.mezcla ?? 1); mx = lerp(cam.x, m.x, k); my = lerp(cam.y, m.y, k); mz = lerp(cam.z, m.z, k); if (k < 0.01) { mx = px - _d.x; my = py - _d.y; mz = pz - _d.z; } }
  }
  // ── BANCA: detrás de los dos, mirando de frente la fachada ──
  cam.mezcla = amort(cam.mezcla, cam.mirador && cam.modo !== "dron" ? 1 : 0, 2.6, dt);
  if (cam.mezcla > 0.001 && cam.mirador) {
    const m = cam.mirador, b = m.b, rx = -m.fz, rz = m.fx;   // derecha de la banca
    // la fachada de frente (como en la calle 2D) y, abajo, nosotros dos de espaldas
    const dist = m.hit ? m.hit.d : 16;
    const alto = m.hit ? clamp(4.2 + (m.hit.f.h - 10) * 0.12, 4.4, 6) : 3;
    _a.set(b.x - m.fx * 3.6 + rx * cam.lado, (J.jugador.y || 0.16) + 2.4, b.z - m.fz * 3.6 + rz * cam.lado);
    _b.set(b.x + m.fx * dist + rx * cam.lado, alto, b.z + m.fz * dist + rz * cam.lado);
    const k = cam.mezcla * cam.mezcla * (3 - 2 * cam.mezcla);
    px = lerp(px, _a.x, k); py = lerp(py, _a.y, k); pz = lerp(pz, _a.z, k);
    mx = lerp(mx, _b.x, k); my = lerp(my, _b.y, k); mz = lerp(mz, _b.z, k);
    fov = lerp(fov, J.ancho < J.alto ? 62 : 50, k);
  }
  // en la banca, los árboles pegados a la cámara se desvanecen (para ver la fachada completa)
  if (J.cercaU) J.cercaU.value.set(px, py, pz, cam.mezcla > 0.01 ? 9 * cam.mezcla : 0);
  // temblor
  const s = J.temblor || 0;
  if (s > 0) { px += (Math.random() - 0.5) * s * 0.45; py += (Math.random() - 0.5) * s * 0.35; pz += (Math.random() - 0.5) * s * 0.45; J.temblor = Math.max(0, s - dt * 1.4); }
  camara.position.set(px, py, pz);
  _mira.set(mx, my, mz);
  camara.lookAt(_mira);
  if (yo.vuela && cam.modo === "seguir") fov += clamp(Math.hypot(yo.vx, yo.vz) / 26, 0, 1) * 9;
  cam.fov = amort(cam.fov, fov, 4, dt);
  if (Math.abs(camara.fov - cam.fov) > 0.02) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
  // hacia dónde es «adelante» para el joystick
  J.camYaw = cam.modo === "dron" ? cam.yaw : Math.atan2(px - mx, pz - mz);
  J.oyente = cam.modo === "dron" ? { x: px, z: pz } : { x: yo.x, z: yo.z };
}
void _p;
