/*
 * LAS COSAS DE LA CALLE — botes de basura, buzones, hidrantes, conos,
 * cajas, macetas y señales. Se levantan con el poder, se avientan, chocan
 * y se rompen.
 *
 * Estados: NORMAL → DAÑADO → DESTRUIDO → RECUPERANDO → RESTAURADO. Lo roto
 * no se queda roto para siempre: al rato vuelve a aparecer en su lugar,
 * poquito a poco. Así la ciudad se siente destruible sin cargar miles de
 * pedazos para siempre.
 *
 * Una malla instanciada por tipo de objeto (siete llamadas para todos).
 */
import { J, THREE, rnd, elegir, clamp, amort, Juntador, contorno, toon } from "./base.js";
import { MANZANAS, MEDIA, ACERA_Y, chocarEdificios, alturaSuelo } from "./mundo.js";
import { son } from "./audio.js";
import { chispas, polvo, escombro, agua, corazones } from "./efectos.js";
import { derribar, rejilla } from "./gente.js";

const TIPOS = {
  bote: { r: 0.32, h: 0.95, masa: 0.5, color: "#3a5a4a", armar: (j) => { j.caja(0, 0.45, 0, 0.55, 0.9, 0.55, "#3a5a4a"); j.caja(0, 0.92, 0, 0.62, 0.08, 0.62, "#4a6e5a"); j.caja(0, 0.6, 0, 0.57, 0.04, 0.57, "#2a4a3a"); } },
  buzon: { r: 0.3, h: 1.2, masa: 0.8, color: "#2a5ab8", armar: (j) => { j.caja(0, 0.75, 0, 0.5, 0.65, 0.42, "#2a5ab8"); j.caja(0, 0.25, 0, 0.12, 0.5, 0.12, "#1a2a4a"); j.caja(0, 0.92, 0.215, 0.32, 0.04, 0.01, "#e8e8f0"); } },
  hidrante: { r: 0.25, h: 0.75, masa: 1.4, color: "#d02a2a", armar: (j) => { j.caja(0, 0.35, 0, 0.32, 0.7, 0.32, "#d02a2a"); j.caja(0, 0.45, 0, 0.55, 0.12, 0.14, "#b02020"); j.caja(0, 0.74, 0, 0.24, 0.08, 0.24, "#e8b020"); } },
  cono: { r: 0.22, h: 0.7, masa: 0.15, color: "#ff7a1a", armar: (j) => { const g = new THREE.ConeGeometry(0.22, 0.65, 10).translate(0, 0.36, 0); j.meter(g, new THREE.Matrix4(), "#ff7a1a"); j.caja(0, 0.03, 0, 0.5, 0.06, 0.5, "#1a1a1a"); j.caja(0, 0.38, 0, 0.3, 0.08, 0.3, "#ffffff"); } },
  caja: { r: 0.35, h: 0.6, masa: 0.3, color: "#b88a54", armar: (j) => { j.caja(0, 0.3, 0, 0.7, 0.6, 0.6, "#b88a54"); j.caja(0, 0.3, 0, 0.1, 0.61, 0.61, "#e8d8b0"); } },
  maceta: { r: 0.3, h: 0.9, masa: 0.6, color: "#b0603a", armar: (j) => { j.caja(0, 0.25, 0, 0.55, 0.5, 0.55, "#b0603a"); const g = new THREE.IcosahedronGeometry(0.38, 0).translate(0, 0.72, 0); j.meter(g, new THREE.Matrix4(), "#2f7a3a"); j.caja(0.1, 0.95, 0.1, 0.12, 0.12, 0.12, "#ff7ab0"); } },
  senal: { r: 0.2, h: 2.6, masa: 0.7, color: "#d82a2a", armar: (j) => { j.caja(0, 1.2, 0, 0.08, 2.4, 0.08, "#6a6a74"); const g = new THREE.CylinderGeometry(0.34, 0.34, 0.04, 8).rotateX(Math.PI / 2).translate(0, 2.35, 0.05); j.meter(g, new THREE.Matrix4(), "#d82a2a"); } },
};
const mallas = {};
export const objetos = [];

export function iniciar() {
  for (const [nombre, T] of Object.entries(TIPOS)) {
    const j = new Juntador(); T.armar(j);
    const im = new THREE.InstancedMesh(j.geometria(), contorno(toon({ vertexColors: true }), "#a898ff", 0.3), 60);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.castShadow = J.calidad.sombras; im.count = 0; im.frustumCulled = false;
    J.escena.add(im); mallas[nombre] = im;
  }
  // repartirlos por las banquetas
  for (const bx of MANZANAS) for (const bz of MANZANAS) for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    for (let k = 0; k < 2; k++) {
      const s = rnd(-14, 14), x = fz ? bx + s : bx + fx * (MEDIA - 0.8), z = fz ? bz + fz * (MEDIA - 0.8) : bz + s;
      if (Math.hypot(x - 31.4, z - 8) < 5) continue;   // el lugar del inicio, despejado
      crear(elegir(["bote", "bote", "buzon", "hidrante", "cono", "caja", "maceta", "senal"]), x, z);
    }
  }
  J.objetos = objetos;
}
function crear(tipo, x, z) {
  const T = TIPOS[tipo];
  const o = { tipo, T, x, y: ACERA_Y, z, ox: x, oz: z, ry: rnd(Math.PI * 2), q: new THREE.Quaternion(), vx: 0, vy: 0, vz: 0, w: new THREE.Vector3(), estado: "NORMAL", libre: false, dano: 0, t: 0, escala: 1 };
  o.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.ry);
  objetos.push(o);
  return o;
}

/* Que algo le pegue (mi golpe, una explosión, un coche). */
export function empujar(o, vx, vy, vz, k) {
  if (o.estado === "DESTRUIDO" || o.estado === "RECUPERANDO") return;
  o.libre = true; o.vx += vx / o.T.masa; o.vy += vy / o.T.masa; o.vz += vz / o.T.masa;
  o.w.set(rnd(-4, 4), rnd(-2, 2), rnd(-4, 4)).multiplyScalar(k);
  danar(o, k * 0.45 / o.T.masa);
}
function danar(o, d) {
  o.dano += d;
  if (o.dano > 0.25 && o.estado === "NORMAL") o.estado = "DAÑADO";
  if (o.dano >= 1) romper(o);
}
function romper(o) {
  if (o.estado === "DESTRUIDO") return;
  o.estado = "DESTRUIDO"; o.t = rnd(14, 22);
  son("romper", o.x, o.z);
  escombro(o.x, o.y + 0.4, o.z, 8, o.T.color, 5, 0.18);
  if (o.tipo === "hidrante") { J.fuentes = J.fuentes || []; J.fuentes.push({ x: o.ox, z: o.oz, t: 9 }); J.misterio && J.misterio("hidrante"); son("ola", o.x, o.z, 0.4); }
  if (o.tipo === "caja") corazones(o.x, o.y + 0.5, o.z, 8, 2);   // las cajas guardaban corazones
  if (o === J.agarrado) J.soltarAgarre && J.soltarAgarre();
  J.caos += 2;
}
export function golpearObjetos(h) {
  let pego = false;
  for (const o of objetos) {
    if (o.estado === "DESTRUIDO" || o.estado === "RECUPERANDO") continue;
    const dx = o.x - h.x, dz = o.z - h.z, d = Math.hypot(dx, dz);
    if (d > h.r + o.T.r) continue;
    const m = d || 1, f = h.k * (J.dios.on ? 9 : 4);
    empujar(o, (dx / m) * f, f * 0.6, (dz / m) * f, h.k);
    son("golpe", o.x, o.z, 0.6); chispas(o.x, o.y + 0.5, o.z, 5, 4);
    pego = true;
  }
  return pego;
}
/* Todo de vuelta a su lugar (al apagar el Modo Dios). */
export function restaurarTodos() {
  for (const o of objetos) { o.estado = "NORMAL"; o.x = o.ox; o.z = o.oz; o.y = ACERA_Y; o.vx = o.vy = o.vz = 0; o.w.set(0, 0, 0); o.libre = false; o.dano = 0; o.t = 0; o.escala = 1; o.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.ry); }
  if (J.fuentes) J.fuentes.length = 0;
}
export function objetoEn(x, z, r = 1.2) { let m = null, md = 1e9; for (const o of objetos) { if (o.estado === "DESTRUIDO" || o.estado === "RECUPERANDO") continue; const d = Math.hypot(o.x - x, o.z - z); if (d < r + o.T.r && d < md) { md = d; m = o; } } return m; }

const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _e = new THREE.Euler();
export function actualizar(dt) {
  const cuentas = {}; for (const k in mallas) cuentas[k] = 0;
  const yo = J.jugador;
  for (const o of objetos) {
    if (dt > 0) {
      if (o.estado === "DESTRUIDO") { o.t -= dt; if (o.t < 0) { o.estado = "RECUPERANDO"; o.t = 0; o.x = o.ox; o.z = o.oz; o.y = ACERA_Y; o.vx = o.vy = o.vz = 0; o.w.set(0, 0, 0); o.libre = false; o.dano = 0; o.q.setFromAxisAngle(_v.set(0, 1, 0), o.ry); } continue; }
      if (o.estado === "RECUPERANDO") { o.t += dt; o.escala = Math.min(1, o.t / 1.2); if (o.t > 1.2) { o.estado = "NORMAL"; o.escala = 1; } }
      if (o.libre && o !== J.agarrado) {
        o.vy -= 18 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
        const ang = o.w.length(); if (ang > 1e-4) { _q.setFromAxisAngle(_v.copy(o.w).divideScalar(ang), ang * dt); o.q.premultiply(_q); }
        const piso = alturaSuelo(o.x, o.z, o.y + 0.3);
        if (o.y < piso) {
          const v = -o.vy; o.y = piso;
          if (v > 4) { danar(o, v / 30); son("golpe", o.x, o.z, clamp(v / 14, 0.2, 0.8)); polvo(o.x, piso, o.z, 3, 0.5); if (o.tipo === "cono") son("pop", o.x, o.z); }
          o.vy = v > 3 ? v * 0.3 : 0; o.vx *= 0.7; o.vz *= 0.7; o.w.multiplyScalar(0.6);
        }
        const antes = { x: o.x, z: o.z };
        if (chocarEdificios(o, o.T.r, o.y)) { const vv = Math.hypot(o.vx, o.vz); if (vv > 5) { danar(o, vv / 25); son("golpe", o.x, o.z, 0.5); } o.vx *= -0.4; o.vz *= -0.4; void antes; }
        // le pega a la gente y a los coches que encuentra
        const vv = Math.hypot(o.vx, o.vy, o.vz);
        if (vv > 6) {
          rejilla.cerca(o.x, o.z, 1.5, _c);
          for (const a of _c) if (a.estado !== "HERIDO" && a.estado !== "DENTRO" && Math.hypot(a.x - o.x, a.z - o.z) < 0.8 && Math.abs(a.y + 1 - o.y) < 1.2) derribar(a, o.vx / vv, o.vz / vv, 0.7);
          const c = J.cocheEn && J.cocheEn(o.x, o.z, 0.6);
          if (c && Math.abs(c.y - o.y) < 1.6) { J.golpearCoches({ x: o.x, y: o.y, z: o.z, r: 0.5, k: vv / 14, circular: true }); o.vx *= -0.3; o.vz *= -0.3; danar(o, 0.5); }
        }
        if (o.y <= piso + 0.01 && vv < 0.3 && o.w.length() < 0.3) { o.vx = o.vz = 0; o.w.set(0, 0, 0); _e.setFromQuaternion(o.q); if (Math.abs(_e.x) < 0.3 && Math.abs(_e.z) < 0.3) { o.libre = false; } }
        if (Math.hypot(o.x - o.ox, o.z - o.oz) > 3 && !o.libre && o.estado === "NORMAL") { o.estado = "DAÑADO"; }
      }
      // los que quedaron tirados lejos de su lugar regresan solos al rato
      if (!o.libre && o.estado === "DAÑADO" && o !== J.agarrado) { o.t += dt; if (o.t > 25) { o.estado = "DESTRUIDO"; o.t = 0.01; } }
    }
    if (Math.hypot(o.x - yo.x, o.z - yo.z) > 75) continue;
    const im = mallas[o.tipo], i = cuentas[o.tipo]++;
    _m.compose(_v.set(o.x, o.y, o.z), o.q, _s.set(o.escala, o.escala, o.escala));
    im.setMatrixAt(i, _m);
  }
  for (const k in mallas) { mallas[k].count = cuentas[k]; mallas[k].instanceMatrix.needsUpdate = true; }
  // las fuentes improvisadas de los hidrantes
  if (J.fuentes) for (let i = J.fuentes.length - 1; i >= 0; i--) { const f = J.fuentes[i]; f.t -= dt; if (Math.random() < dt * 30) agua(f.x, 0.5, f.z, 2, 1.6); if (f.t < 0) J.fuentes.splice(i, 1); }
}
const _c = [];
void amort;
