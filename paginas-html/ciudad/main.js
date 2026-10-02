/*
 * EL ARRANQUE Y EL BUCLE.
 *
 * · La calidad se elige sola al empezar (núcleos, memoria, pantalla) y se
 *   ajusta mientras se juega mirando los fps reales: alta → media → baja.
 *   Baja la resolución interna, las sombras, cuánta gente se simula de
 *   cerca y cuántas partículas caben; nunca el estilo.
 * · La cámara sigue al personaje con un pequeño retraso, se gira con el
 *   dedo, se acerca con pellizco, se aleja al volar y hace sus movimientos
 *   de cine en los eventos grandes, siempre suave (nada que maree).
 */
import { J, THREE, clamp, lerp, amort, amortAng, memo } from "./base.js";
import { construirMundo, colocarLuna, luna, lugares, faroles, materiales, edificioEn } from "./mundo.js";
import { iniciarAudio, actualizarAudio, bucleEn } from "./audio.js";
import { iniciarEfectos, actualizarEfectos, actualizarAura, lluviaNivel } from "./efectos.js";
import { armarUI, limpiarEntrada, actualizarGlobos, E, decir } from "./ui.js";
import { crearJugador, actualizarJugador, actualizarElla } from "./jugador.js";
import { ESCENAS } from "./escenas.js";
import * as gente from "./gente.js";
import * as coches from "./vehiculos.js";
import * as poderes from "./poderes.js";
import * as eventos from "./eventos.js";
import * as lugaresMod from "./lugares.js";
import * as objetos from "./objetos.js";

/* ══════════════════ LA CALIDAD ══════════════════ */
const NIVELES = {
  alta: { nivel: "alta", dpr: 1.75, sombras: true, sombraTam: 2048, particulas: 1, gente: 64, distIA: 50, lejos: 230, niebla: 0.0085 },
  media: { nivel: "media", dpr: 1.3, sombras: true, sombraTam: 1024, particulas: 0.65, gente: 44, distIA: 38, lejos: 190, niebla: 0.0105 },
  baja: { nivel: "baja", dpr: 1, sombras: false, sombraTam: 512, particulas: 0.4, gente: 28, distIA: 28, lejos: 150, niebla: 0.013 },
};
function elegirCalidad() {
  const q = new URLSearchParams(location.search).get("calidad");
  if (q && NIVELES[q]) return q;
  const nucleos = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  const movil = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent) || matchMedia("(pointer: coarse)").matches;
  if (nucleos <= 4 || mem <= 3) return "baja";
  if (movil) return "media";
  return "alta";
}
J.calidad = { ...NIVELES[elegirCalidad()] };

/* ══════════════════ LA ESCENA ══════════════════ */
const lienzo = document.getElementById("lienzo");
const gl2 = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();
if (!gl2) location.replace("ciudad-calle.html");
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: J.calidad.nivel !== "baja", powerPreference: "high-performance" });
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1.12;
render.shadowMap.enabled = J.calidad.sombras; render.shadowMap.type = THREE.PCFSoftShadowMap;
const escena = new THREE.Scene();
escena.fog = new THREE.FogExp2("#241e44", J.calidad.niebla);
const camara = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
Object.assign(J, { escena, camara, render });

// la luz: la luna (con sombra que sigue al jugador), el cielo y el rebote cálido de las ventanas
const hemi = new THREE.HemisphereLight("#6a6ac8", "#2a1c2e", 0.75); escena.add(hemi);
const ambiente = new THREE.AmbientLight("#4a3a6a", 0.35); escena.add(ambiente);
const lunaLuz = new THREE.DirectionalLight("#b8c4ff", 1.1);
lunaLuz.castShadow = J.calidad.sombras;
lunaLuz.shadow.mapSize.set(J.calidad.sombraTam, J.calidad.sombraTam);
Object.assign(lunaLuz.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
lunaLuz.shadow.bias = -0.0008; lunaLuz.shadow.normalBias = 0.04;
escena.add(lunaLuz, lunaLuz.target);
J.luces = { hemi, ambiente, lunaLuz };
// las farolas de verdad: sólo unas pocas luces se van pasando a las farolas más cercanas
const lucesFarol = [];
for (let i = 0; i < (J.calidad.nivel === "baja" ? 3 : 6); i++) { const l = new THREE.PointLight("#ffc890", 0, 16, 1.6); escena.add(l); lucesFarol.push(l); }

/* ══════════════════ LA CÁMARA ══════════════════ */
const cam = { yaw: -Math.PI / 2 + 0.55, pitch: 0.36, dist: 10.5, x: 0, y: 1.5, z: 0, cine: null, sacude: 0 };
J.cam = cam;
function actualizarCamara(dt) {
  const yo = J.jugador, foco = yo.coche || yo;
  cam.yaw -= E.camDX * 0.0065; cam.pitch = clamp(cam.pitch + E.camDY * 0.004, 0.08, 1.15);
  cam.dist = clamp(cam.dist + E.zoom, 4.5, 28);
  // al caminar, la cámara se acomoda poquito a poquito detrás (sin pelearse con el dedo)
  if (Math.abs(E.camDX) < 0.5 && foco.vel > 2 && !yo.vuela) cam.yaw = amortAng(cam.yaw, (yo.coche ? yo.coche.ry : yo.ry) + Math.PI, 0.6, dt);
  const extra = (yo.vuela ? 4 + clamp(Math.hypot(yo.vx, yo.vz) / 4, 0, 5) : 0) + (yo.coche ? 5 : 0) + (J.combateCerca ? -1.2 : 0);
  let d = cam.dist + extra, pitch = cam.pitch + (yo.vuela ? 0.08 : 0), yaw = cam.yaw;
  let fx = foco.x, fy = foco.y + (yo.coche ? 1.6 : 1.45), fz = foco.z;
  // cinemática: mira hacia el evento un ratito
  if (cam.cine) {
    const c = cam.cine; c.t += dt;
    const k = Math.min(1, c.t / 1.2) * Math.min(1, (c.dur - c.t) / 1.2);
    if (c.t > c.dur) cam.cine = null;
    else { pitch = lerp(pitch, c.pitch ?? pitch, k); d = lerp(d, c.dist ?? d, k); if (c.yaw != null) yaw = yaw + ((c.yaw - yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI) * k; if (c.foco) { fx = lerp(fx, c.foco.x, k * 0.5); fy = lerp(fy, c.foco.y, k * 0.5); fz = lerp(fz, c.foco.z, k * 0.5); } }
  }
  cam.x = amort(cam.x, fx, 10, dt); cam.y = amort(cam.y, fy, 8, dt); cam.z = amort(cam.z, fz, 10, dt);
  let px = cam.x + Math.sin(yaw) * Math.cos(pitch) * d, py = cam.y + Math.sin(pitch) * d, pz = cam.z + Math.cos(yaw) * Math.cos(pitch) * d;
  py = Math.max(py, 0.6);
  // si hay un edificio entre el personaje y la cámara, se acerca
  for (let k = 0.25; k <= 1.001; k += 0.125) {
    const sx = lerp(cam.x, px, k), sy = lerp(cam.y, py, k), sz = lerp(cam.z, pz, k), e = edificioEn(sx, sz);
    if (e && sy < e.h + 0.5) { const kk = Math.max(0.12, k - 0.15); px = lerp(cam.x, px, kk); py = lerp(cam.y, py, kk); pz = lerp(cam.z, pz, kk); break; }
  }
  const s = (J.temblor || 0);
  if (s > 0) { px += (Math.random() - 0.5) * s * 0.5; py += (Math.random() - 0.5) * s * 0.4; pz += (Math.random() - 0.5) * s * 0.5; J.temblor = Math.max(0, s - dt * 1.4); }
  camara.position.set(px, py, pz);
  if (cam.cine && cam.cine.mirar) { const c = cam.cine, k = Math.min(1, c.t / 1.2) * Math.min(1, (c.dur - c.t) / 1.2) * (c.mezcla ?? 1); camara.lookAt(lerp(cam.x, c.mirar.x, k), lerp(cam.y, c.mirar.y, k), lerp(cam.z, c.mirar.z, k)); }
  else camara.lookAt(cam.x, cam.y, cam.z);
  const fov = (J.ancho < J.alto ? 64 : 52) + (yo.vuela ? clamp(Math.hypot(yo.vx, yo.vz) / 26, 0, 1) * 9 : 0);
  if (Math.abs(camara.fov - fov) > 0.05) { camara.fov = amort(camara.fov, fov, 3, dt); camara.updateProjectionMatrix(); }
  J.camYaw = yaw;
  J.oyente = { x: yo.x, z: yo.z };
}
export function cinematica(o) { cam.cine = { t: 0, dur: 5, ...o }; }
J.cinematicaCam = cinematica;

/* ══════════════════ TAMAÑO ══════════════════ */
function medir() {
  J.ancho = innerWidth; J.alto = innerHeight;
  J.dpr = Math.min(window.devicePixelRatio || 1, J.calidad.dpr);
  render.setPixelRatio(J.dpr); render.setSize(J.ancho, J.alto, false);
  camara.aspect = J.ancho / J.alto; camara.updateProjectionMatrix();
  if (J.estrellasMat) J.estrellasMat.uniforms.uDpr.value = J.dpr;
}
addEventListener("resize", medir);

/* ══════════════════ LA CALIDAD QUE SE AJUSTA SOLA ══════════════════ */
let ventanaFps = 0, cuadros = 0, bueno = 0;
function vigilarFps(dt) {
  ventanaFps += dt; cuadros++;
  if (ventanaFps < 3) return;
  const fps = cuadros / ventanaFps; ventanaFps = 0; cuadros = 0;
  J.fps = fps;
  const orden = ["baja", "media", "alta"], i = orden.indexOf(J.calidad.nivel);
  if (fps < 38 && i > 0) { bajarA(orden[i - 1]); bueno = 0; }
  else if (fps > 57) { bueno++; if (bueno > 4 && i < 2 && !J.calidad.bajada) { subirA(orden[i + 1]); bueno = 0; } }
  else bueno = 0;
}
function bajarA(n) {
  const nv = NIVELES[n];
  J.calidad.bajada = true;
  Object.assign(J.calidad, { nivel: n, dpr: nv.dpr, particulas: nv.particulas, gente: nv.gente, distIA: nv.distIA, niebla: nv.niebla });
  escena.fog.density = nv.niebla;
  if (!nv.sombras && render.shadowMap.enabled) { render.shadowMap.enabled = false; lunaLuz.castShadow = false; escena.traverse((o) => { if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach((q) => (q.needsUpdate = true)); } }); }
  medir();
}
function subirA(n) { const nv = NIVELES[n]; Object.assign(J.calidad, { nivel: n, dpr: Math.min(nv.dpr, J.calidad.dpr + 0.25), particulas: nv.particulas, gente: nv.gente, distIA: nv.distIA }); medir(); }

/* ══════════════════ CADA CUADRO ══════════════════ */
let t0 = performance.now(), cadaFarol = 0;
const TOPE_DT = /rapido/.test(location.search) ? 0.15 : 0.05;   // «rapido» sólo para probar en máquinas lentas
function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  let dt = (ahora - t0) / 1000; t0 = ahora;
  if (!(dt > 0)) return;
  if (document.hidden) return;
  if (dt < 2) vigilarFps(dt);   // los fps de verdad (sin el tope), para que la calidad sepa cuándo bajar
  dt = Math.min(dt, TOPE_DT);
  const dtM = J.congelado > 0 ? 0 : dt;     // el tiempo detenido congela al mundo, no a mí
  J.t += dt; J.dt = dt;
  actualizarJugador(dt);
  actualizarElla(dtM || dt * 0.0001);
  poderes.actualizar(dt, dtM);
  gente.actualizar(dtM, dt);
  coches.actualizar(dtM, dt);
  objetos.actualizar(dtM);
  eventos.actualizar(dt, dtM);
  lugaresMod.actualizar(dt);
  actualizarCamara(dt);
  colocarLuna(camara);
  // luz de luna: viene de donde está la luna y su sombra cubre lo que rodea al jugador
  const yo = J.jugador;
  lunaLuz.position.set(yo.x + luna.dir.x * 60, 60 * luna.dir.y + 10, yo.z + luna.dir.z * 60);
  lunaLuz.target.position.set(yo.x, 0, yo.z);
  lunaLuz.intensity = 1.1 * J.luz; hemi.intensity = 0.75 * (0.5 + 0.5 * J.luz) * (1 - (J.lloviendo || 0) * 0.3) + (J.relampago || 0) * 2.2;
  if (J.estrellasMat) { J.estrellasMat.uniforms.uT.value = J.t; J.estrellasMat.uniforms.uLuz.value = (1 - (J.lloviendo || 0) * 0.85); }
  // las farolas cercanas prestan su luz de verdad
  if ((cadaFarol -= dt) <= 0) {
    cadaFarol = 0.5;
    const cerca = faroles.slice().sort((a, b) => Math.hypot(a.lx - yo.x, a.lz - yo.z) - Math.hypot(b.lx - yo.x, b.lz - yo.z));
    lucesFarol.forEach((l, i) => { const f = cerca[i]; l.position.set(f.lx, 4.6, f.lz); l.userData.obj = f.apagado ? 0 : 7; });
  }
  for (const l of lucesFarol) l.intensity = amort(l.intensity, (l.userData.obj || 0) * J.luzCiudad, 4, dt);
  actualizarAura(yo.x, yo.y, yo.z, J.dios.nivel, dt);
  lluviaNivel(J.lloviendo || 0);
  if (materiales.suelo) materiales.suelo.roughness = 0.75 - (J.lloviendo || 0) * 0.45;
  actualizarEfectos(dtM);
  actualizarAudio();
  actualizarGlobos(dt);
  limpiarEntrada();
  render.render(escena, camara);
}
J.luzCiudad = 1; J.caos = 0; J.luz = J.luz ?? 1;

/* ══════════════════ EMPEZAR ══════════════════ */
armarUI();
medir();
construirMundo(escena, ESCENAS);
iniciarEfectos(escena);
crearJugador();
gente.iniciar(); coches.iniciar(); poderes.iniciar(); eventos.iniciar(); lugaresMod.iniciar();
{ const yo = J.jugador; cam.x = yo.x; cam.y = 1.5; cam.z = yo.z; }
// el primer toque despierta el sonido
let despierto = false;
J.alTocarAlgo = () => { if (!despierto) { despierto = true; iniciarAudio(); bucleEn("ciudad", 0.05); } };
// la primera toma: los dos mirando la ventana del K-drama
{ const k = lugares.kdrama; cinematica({ dur: 7.5, dist: 8.5, pitch: 0.1, mezcla: 0.5, mirar: { x: k.x, y: k.y - 1.2, z: k.z } }); cam.cine.t = 1.2; }
setTimeout(() => decir("Mira… como nosotros próximamente 🤍", "yo", 4200), 1200);
setTimeout(() => decir(memo.visto ? "Bienvenida otra vez a nuestra ciudad 🌙" : "Camina con el dedo a la izquierda; con el de la derecha giras la cámara 🌙", "yo", 4200), 6200);
memo.visto = 1;
if (/prueba/.test(location.search)) window.__J = J;
requestAnimationFrame(cuadro);
void lerp;
