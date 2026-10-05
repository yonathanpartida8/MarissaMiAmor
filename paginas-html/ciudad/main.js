/*
 * EL ARRANQUE Y EL BUCLE.
 *
 * · La calidad se elige sola al empezar (núcleos, memoria, pantalla) y se
 *   ajusta mientras se juega mirando los fps reales: alta → media → baja.
 *   Baja la resolución interna, las sombras, el antialiasing, el
 *   resplandor y cuánta gente se simula de cerca; nunca el estilo.
 * · Cada cuadro: la hora del día → el mundo (gente, coches, poderes,
 *   eventos) → la cámara → el cielo, las luces y las ventanas → y la
 *   imagen pasa por el postproceso (contornos de dibujo, resplandor, color).
 */
import { J, THREE, memo, lienzo as lienzo2D, TAU } from "./base.js";
import { iniciarVida, actualizarVida } from "./vida.js";
import { actualizarLadrones } from "./ladrones.js";
import { construirMundo, colocarLuna, lugares, actualizarMundo } from "./mundo.js";
import { actualizarCielo } from "./cielo.js";
import { construirVentanas, actualizarVentanas } from "./ventanas.js";
import { ciclo, actualizarCiclo, siguienteParte } from "./ciclo.js";
import { iniciarLuces, actualizarLuces } from "./luces.js";
import { actualizarCamara, cinematica, cam, ponerModo } from "./camara.js";
import { Post } from "./post.js";
import { iniciarAudio, actualizarAudio, bucleEn } from "./audio.js";
import { iniciarEfectos, actualizarEfectos, actualizarAura, lluviaNivel } from "./efectos.js";
import { armarUI, limpiarEntrada, actualizarGlobos, E, decir, botonHora, modoDron, pista } from "./ui.js";
import { crearJugador, actualizarJugador, actualizarElla } from "./jugador.js";
import { ESCENAS } from "./escenas.js";
import * as gente from "./gente.js";
import * as coches from "./vehiculos.js";
import * as poderes from "./poderes.js";
import * as eventos from "./eventos.js";
import * as lugaresMod from "./lugares.js";
import * as objetos from "./objetos.js";
import * as cositas from "./cositas.js";
import * as callejonesMod from "./callejones.js";

/* ══════════════════ LA CALIDAD ══════════════════ */
const NIVELES = {
  alta: { nivel: "alta", dpr: 1.75, sombras: true, sombraTam: 2048, particulas: 1, gente: 60, distIA: 50, lejos: 260 },
  media: { nivel: "media", dpr: 1.35, sombras: true, sombraTam: 1024, particulas: 0.7, gente: 42, distIA: 38, lejos: 210 },
  baja: { nivel: "baja", dpr: 1, sombras: false, sombraTam: 512, particulas: 0.45, gente: 28, distIA: 28, lejos: 160 },
};
function elegirCalidad() {
  const q = new URLSearchParams(location.search).get("calidad");
  if (q && NIVELES[q]) return q;
  const nucleos = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  const movil = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent) || matchMedia("(pointer: coarse)").matches;
  if (nucleos <= 4 || mem <= 3) return "baja";
  if (movil) return "media";   // (iPhone 12 y parecidos: media, sin MSAA; si no aguanta, baja sola)
  return "alta";
}
J.calidad = { ...NIVELES[elegirCalidad()] };
if (J.ios) J.calidad.dpr = Math.min(J.calidad.dpr, 1.3);   // las pantallas de iPhone tienen 3× pixeles: 1.3 se ve nítido y vuela

/* ══════════════════ LA ESCENA ══════════════════ */
const lienzo = document.getElementById("lienzo");
const gl2 = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();
if (!gl2) { if (window.parent !== window) window.parent.postMessage({ ciudad: "2d" }, "*"); else location.replace("página.html26.html"); }
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: "high-performance", stencil: false });
render.outputColorSpace = THREE.SRGBColorSpace;
render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1.0;
render.shadowMap.enabled = J.calidad.sombras; render.shadowMap.type = THREE.PCFSoftShadowMap;
const escena = new THREE.Scene();
escena.fog = new THREE.FogExp2("#241e44", 0.01);
const camara = new THREE.PerspectiveCamera(60, 1, 0.3, 900);
Object.assign(J, { escena, camara, render });
let post = null;

/* ══════════════════ TAMAÑO ══════════════════ */
function medir() {
  J.ancho = innerWidth; J.alto = innerHeight;
  J.dpr = Math.min(window.devicePixelRatio || 1, J.calidad.dpr);
  render.setPixelRatio(J.dpr); render.setSize(J.ancho, J.alto, false);
  camara.aspect = J.ancho / J.alto; camara.updateProjectionMatrix();
  if (J.estrellasMat) J.estrellasMat.uniforms.uDpr.value = J.dpr;
  if (post) post.medir(J.ancho, J.alto, J.dpr);
}
addEventListener("resize", medir);

/* ══════════════════ LOS REFLEJOS ══════════════════
   Un cielito chiquito (64×32) pintado con los colores de la hora, más el sol
   o la luna. Se convierte en mapa de entorno y la escena entera lo usa: la
   pintura de los coches, los vidrios y la piel reflejan el cielo que de
   verdad hay en ese momento. Se vuelve a pintar cada pocos segundos, así que
   no cuesta casi nada. */
const pmrem = new THREE.PMREMGenerator(render);
const [cEnv, xEnv] = lienzo2D(64, 32);
let envTex = null, envRT = null, envCada = 0;
function refrescarEntorno() {
  const g = xEnv.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, "#" + ciclo.arriba.getHexString());
  g.addColorStop(0.4, "#" + ciclo.medio.getHexString());
  g.addColorStop(0.52, "#" + ciclo.horizonte.getHexString());
  g.addColorStop(1, "#" + ciclo.hemiSuelo.getHexString());
  xEnv.fillStyle = g; xEnv.fillRect(0, 0, 64, 32);
  // el sol o la luna: el brillito que se pasea por la pintura al girar
  const sx = ((Math.atan2(ciclo.luz.x, ciclo.luz.z) / TAU + 0.5) % 1) * 64;
  const sy = (1 - (ciclo.luz.y * 0.5 + 0.5)) * 32, c = ciclo.luzColor, br = 0.45 + ciclo.luzFuerza * 0.5;
  const r = xEnv.createRadialGradient(sx, sy, 0, sx, sy, 10);
  r.addColorStop(0, `rgba(${Math.min(255, c.r * 255 * br) | 0},${Math.min(255, c.g * 255 * br) | 0},${Math.min(255, c.b * 255 * br) | 0},1)`);
  r.addColorStop(1, "rgba(0,0,0,0)");
  xEnv.fillStyle = r; xEnv.fillRect(0, 0, 64, 32);
  if (!envTex) { envTex = new THREE.CanvasTexture(cEnv); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace; }
  envTex.needsUpdate = true;
  const rt = pmrem.fromEquirectangular(envTex);
  if (envRT) envRT.dispose();
  envRT = rt; escena.environment = rt.texture; J.entorno = rt.texture;
}

/* ══════════════════ LA CALIDAD QUE SE AJUSTA SOLA ══════════════════ */
let ventanaFps = 0, cuadros = 0, bueno = 0;
function vigilarFps(dt) {
  ventanaFps += dt; cuadros++;
  if (ventanaFps < 3) return;
  const fps = cuadros / ventanaFps; ventanaFps = 0; cuadros = 0;
  J.fps = fps;
  const orden = ["baja", "media", "alta"], i = orden.indexOf(J.calidad.nivel);
  if (fps < 36 && i > 0) { cambiarA(orden[i - 1]); bueno = 0; J.calidad.bajada = true; }
  else if (fps > 57) { bueno++; if (bueno > 5 && i < 2 && !J.calidad.bajada) { cambiarA(orden[i + 1]); bueno = 0; } }
  else bueno = 0;
}
function cambiarA(n) {
  const nv = NIVELES[n];
  Object.assign(J.calidad, { nivel: n, dpr: J.ios ? Math.min(nv.dpr, 1.3) : nv.dpr, particulas: nv.particulas, gente: nv.gente, distIA: nv.distIA, lejos: nv.lejos });
  if (post) post.ponerNivel(n);
  medir();
}

/* ══════════════════ CADA CUADRO ══════════════════ */
let t0 = performance.now();
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
  // 🕒 la hora: día → tarde → noche (con su transición suave)
  if (E.hora) siguienteParte();
  actualizarCiclo(dt);
  if ((envCada -= dt) <= 0) { envCada = 2.5; refrescarEntorno(); }
  botonHora(ciclo.fase);
  // 🎥 la cámara libre (dron) y de regreso
  if (E.camara) {
    const dron = cam.modo !== "dron";
    ponerModo(dron ? "dron" : "seguir"); modoDron(dron);
    if (dron && !memo.vistoDron) { memo.vistoDron = 1; const txt = "Joystick para volar · ⤒ ⤓ para subir y bajar · el dedo gira"; pista(txt); setTimeout(() => { if (document.getElementById("pista").textContent === txt) pista(""); }, 5200); }
  }
  actualizarJugador(dt);
  actualizarElla(dtM || dt * 0.0001);
  actualizarVida(dt);
  if (dtM > 0) actualizarLadrones(dtM);
  poderes.actualizar(dt, dtM);
  gente.actualizar(dtM, dt);
  coches.actualizar(dtM, dt);
  objetos.actualizar(dtM);
  eventos.actualizar(dt, dtM);
  lugaresMod.actualizar(dt);
  cositas.actualizar(dt); callejonesMod.actualizar(dt);
  actualizarCamara(dt, E);
  colocarLuna(camara);
  actualizarCielo(camara, ciclo, dt);
  const yo = J.jugador, foco = cam.modo === "dron" ? camara.position : yo;
  actualizarLuces(dt, ciclo, foco);
  actualizarMundo(dt, ciclo);
  actualizarVentanas(dt, ciclo);
  escena.fog.color.copy(ciclo.niebla); escena.fog.density = ciclo.densidad * (1 + (J.lloviendo || 0) * 0.6);
  if (J.estrellasMat) J.estrellasMat.uniforms.uT.value = J.t;
  actualizarAura(yo.x, yo.y, yo.z, J.dios.nivel, dt);
  lluviaNivel(J.lloviendo || 0);
  actualizarEfectos(dtM);
  actualizarAudio();
  actualizarGlobos(dt);
  limpiarEntrada();
  post.mFinal.uniforms.uDestello.value = J.destelloPantalla || 0;
  J.destelloPantalla = Math.max(0, (J.destelloPantalla || 0) - dt * 2.5);
  post.dibujar(escena, camara);
  // la selfie: se toma justo después de dibujar (el cuadro aún está en el lienzo)
  if (J.pedirFoto) { const f = J.pedirFoto; J.pedirFoto = null; try { f(lienzo.toDataURL("image/jpeg", 0.9)); } catch (e) { f(null); } }
}
J.luzCiudad = 1; J.caos = 0; J.luz = J.luz ?? 1;

/* ══════════════════ EMPEZAR ══════════════════ */
armarUI();
medir();
post = new Post(render, J.calidad.nivel); post.medir(J.ancho, J.alto, J.dpr);
J.post = post;
construirMundo(escena, ESCENAS);
construirVentanas(escena, ESCENAS);
iniciarEfectos(escena);
iniciarLuces(escena);
crearJugador();
iniciarVida();
gente.iniciar(); coches.iniciar(); poderes.iniciar(); eventos.iniciar(); lugaresMod.iniciar(); cositas.iniciar(escena); callejonesMod.iniciar(escena);
{ const yo = J.jugador; cam.x = yo.x; cam.y = 1.5; cam.z = yo.z; }
// la primera toma: los dos mirando la ventana del K-drama
{ const k = lugares.kdrama; cinematica({ dur: 7.5, dist: 8.5, pitch: 0.1, mezcla: 0.5, mirar: { x: k.x, y: k.y - 1.2, z: k.z } }); cam.cine.t = 1.2; }
// el primer toque despierta el sonido
let despierto = false;
J.alTocarAlgo = () => { if (!despierto) { despierto = true; iniciarAudio(); bucleEn("ciudad", 0.05); } };
setTimeout(() => decir("Mira… como nosotros próximamente 🤍", "yo", 4200), 1200);
if (!memo.visto3d) setTimeout(() => { const txt = "Joystick (abajo a la izquierda): caminar · el resto de la pantalla: mover la cámara"; pista(txt); setTimeout(() => { if (document.getElementById("pista").textContent === txt) pista(""); }, 6000); }, 6200);
memo.visto3d = 1;
if (/prueba/.test(location.search)) window.__J = J;
requestAnimationFrame(cuadro);
