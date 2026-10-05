/*
 * EL MODO DIOS Y LOS PODERES.
 *
 * Al tocar ✨ ella dice «Quédate aquí, que necesito ir al baño, ahorita
 * vuelvo.» y se va. Entonces llega la transformación: se abre de brazos,
 * flota, un destello de luz de verdad, el aura… Con el Modo Dios: volar
 * (saltar en el aire), rayos, levantar y aventar cosas y coches, explosión
 * cargada, terremoto, tsunami, lluvia, tornado, meteoritos, corazones,
 * detener el tiempo y llamar al ovni. Todos disponibles desde el principio.
 *
 * Al apagarlo, todo lo sobrenatural se desvanece: un fundido suave, y al
 * volver la ciudad ya está en paz (sin estrellas de caos, sin policía, sin
 * coches volteados) y yo estoy junto a ella, que acaba de regresar:
 * «¿Estás bien?» — «Ah, sí, gracias. Solo me quedé pensando de más, jaja.»
 */
import { J, THREE, rnd, elegir, clamp, lerp, amort, difAng, anunciar, oir, memo, guardar, contar, contorno, TAU, toon } from "./base.js";
import { son, bucleEn } from "./audio.js";
import * as fx from "./efectos.js";
import { E, decir, decirYa, globito, aviso, botonPoder, botonDios, botonBajar, botonSaltar, botonAccion, definirPoderes, caos as hudCaos, cargaGolpe, fundido, enVivo } from "./ui.js";
import { golpearGente, derribar, rejilla, calmarTodos } from "./gente.js";
import { soltarFisica, golpearCoches, restaurarTodos } from "./vehiculos.js";
import * as objetos from "./objetos.js";
import { decirElla, lineaElla } from "./jugador.js";
import { CALLES, alturaSuelo, chocarEdificios, edificios } from "./mundo.js";
import { irAlBano, regresar } from "./pareja.js";
import { cam } from "./camara.js";

export const PODERES = [
  { id: "rayo", ico: "⚡", nombre: "Rayos" },
  { id: "levantar", ico: "🪨", nombre: "Levantar y lanzar" },
  { id: "carga", ico: "💥", nombre: "Explosión cargada" },
  { id: "terremoto", ico: "🌎", nombre: "Terremoto" },
  { id: "tsunami", ico: "🌊", nombre: "Tsunami" },
  { id: "lluvia", ico: "🌧️", nombre: "Lluvia y tormenta" },
  { id: "tornado", ico: "🌪️", nombre: "Tornado" },
  { id: "meteoros", ico: "☄️", nombre: "Lluvia de meteoritos" },
  { id: "corazones", ico: "💗", nombre: "Lluvia de corazones" },
  { id: "tiempo", ico: "⏳", nombre: "Detener el tiempo" },
  { id: "ovni", ico: "🛸", nombre: "Llamar al ovni" },
  { id: "empuje", ico: "💨", nombre: "Onda de empuje" },
  { id: "escudo", ico: "🛡️", nombre: "Escudo para los dos" },
];
let poder = "rayo", burbuja = null;
J.dios = { on: false, nivel: 0, brilla: false };

/* ══════════════════ ARRANCAR ══════════════════ */
export function iniciar() {
  objetos.iniciar(); armarOla();
  J.nivelAgua = (x) => (J.ola ? nivelAgua(x) : -1);
  burbuja = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), contorno(new THREE.MeshToonMaterial({ color: "#ff9ec8", transparent: true, opacity: 0.2, depthWrite: false }), "#ffc8e0", 1.2, 2));
  burbuja.visible = false; J.escena.add(burbuja);
  J.golpear = (h) => { const a = golpearGente(h), b = golpearCoches(h), c = objetos.golpearObjetos(h), d = J.golpearHelis ? J.golpearHelis(h.x, h.y ?? J.jugador.y + 1, h.z, (h.r || 1) + 1, h.k || 1) : false; return a || b || c || d; };
  J.objetivoGolpe = (yo, r) => {
    let m = null, md = r;
    for (const a of J.gente) { if (a.estado === "DENTRO" || !a.ver) continue; const d = Math.hypot(a.x - yo.x, a.z - yo.z); if (d < md && Math.abs(difAng(Math.atan2(a.x - yo.x, a.z - yo.z), yo.ry)) < 1.3) { md = d; m = a; } }
    for (const c of J.coches) { if (c.estado === "fuera") continue; const d = Math.hypot(c.x - yo.x, c.z - yo.z) - c.T.L / 2; if (d < md) { md = d; m = c; } }
    return m;
  };
  J.explosion = explosion;
  J.elegirPoder = (id) => { poder = id; pintarBarra(); const p = PODERES.find((q) => q.id === id); aviso(p.nombre); };
  J.elegirPoderN = (n) => { if (PODERES[n] && J.dios.on) J.elegirPoder(PODERES[n].id); };
  J.desbloquear = () => {};   // ya están todos
  J.soltarAgarre = soltarAgarre;
  J.prenderDios = prenderDios; J.apagarDios = apagarDios;
  J.rayoA = (p) => { if (J.dios.on) lanzarRayo(p, null); };
  pintarBarra();
}
function pintarBarra() {
  definirPoderes(PODERES, poder);
  const p = PODERES.find((q) => q.id === poder);
  botonPoder(J.agarrado ? "agarrar" : p.id, J.dios.on);
  botonDios(J.dios.on);
}

/* ══════════════════ EL MODO DIOS ══════════════════ */
let tokenDios = 0, transicion = false;
function prenderDios() {
  const yo = J.jugador;
  if (transicion) return;
  if (yo.coche || yo.subir || yo.bajar) { decir("Primero bájate del coche 😅", "yo"); return; }
  if (yo.banca) { yo.banca.ocupada = null; yo.banca = null; }
  J.dios.on = true; J.dios.brilla = false; tokenDios++; const tok = tokenDios;
  // ella se va al baño (lo dice primero)
  irAlBano();
  pintarBarra();
  // la transformación, en cuanto ella termina de decirlo
  setTimeout(() => {
    if (!J.dios.on || tok !== tokenDios) return;
    J.cinematica = true; J.dios.brilla = true;
    yo.anim.poder = 1.6; yo.vy = 3; yo.suelo = false;
    son("magia"); bucleEn("dios", 0.045);
    fx.onda(yo.x, yo.y, yo.z, 8, 0.8, "#ffe6b0"); fx.onda(yo.x, yo.y + 0.1, yo.z, 5, 0.6, "#ff9ec8");
    fx.brillos(yo.x, yo.y + 1, yo.z, 50, "oro", 1, 4); fx.columnaLuz(yo.x, yo.y, yo.z, 1.6);
    setTimeout(() => { fx.destello(yo.x, yo.y + 1.5, yo.z, 40, "#ffd28a", 0.9); J.destelloPantalla = 0.32; J.temblor = Math.max(J.temblor || 0, 0.35); fx.chispas(yo.x, yo.y + 1, yo.z, 50, 10, "oro"); }, 450);
    setTimeout(() => { J.cinematica = false; }, 1500);
    J.cinematicaCam({ dur: 2.6, dist: 6.5, pitch: 0.2 });
    decirYa("Woah… mira, soy todo un héroe…", "dios", 3400);
    anunciar({ tipo: "dios", x: yo.x, y: yo.y + 2, z: yo.z, radio: 30, fuerza: 0.5 });
    if (contar("dios") === 1) setTimeout(() => { if (J.dios.on) aviso("Salta en el aire para volar · ⋯ para elegir poder"); }, 4200);
  }, 3800);
}
function apagarDios() {
  if (transicion) return;
  J.dios.on = false; J.dios.brilla = false; tokenDios++; const tok = tokenDios;
  const yo = J.jugador;
  soltarAgarre(); J.cargandoPoder = false; cargaPoder = 0; if (orbeCarga) { orbeCarga.soltar(); orbeCarga = null; }
  son("apagar"); bucleEn("dios", 0); bucleEn("tk", 0);
  fx.brillos(yo.x, yo.y + 1, yo.z, 24, "oro", 0.8, 1.5);
  // todo lo sobrenatural se empieza a ir…
  lluviaObj = 0;
  if (J.sismo) J.sismo.t = Math.max(J.sismo.t, J.sismo.dur - 1.5);
  if (J.ola && J.ola.fase === "avanza") J.ola.fase = "baja";
  for (const t of tornados) t.t = Math.max(t.t, t.dur - 1.2);
  J.congelado = 0; amorT = Math.min(amorT, 1.5);
  if (yo.vuela) { yo.vuela = false; yo.suelo = false; yo.vy = 0; yo.planea = 1.5; }
  pintarBarra();
  transicion = true; J.cinematica = true;
  // …y con un fundido suave la ciudad vuelve a la calma y estoy junto a ella
  setTimeout(() => fundido(true), 700);
  setTimeout(() => {
    limpiarCaos();
    const p = regresar(), ella = J.novia;
    // yo, a su lado, mirándola
    const a = Math.atan2(p.x - yo.x, p.z - yo.z);
    yo.x = p.x - Math.sin(a) * 1.1; yo.z = p.z - Math.cos(a) * 1.1;
    { const o = { x: yo.x, z: yo.z }; chocarEdificios(o, 0.4, 0); yo.x = o.x; yo.z = o.z; }
    yo.y = alturaSuelo(yo.x, yo.z, 0.5); yo.vx = yo.vz = yo.vy = 0; yo.suelo = true; yo.vuela = false; yo.planea = 0;
    yo.ry = Math.atan2(ella.x - yo.x, ella.z - yo.z); ella.ry = yo.ry + Math.PI;
    cam.x = yo.x; cam.y = yo.y + 1.45; cam.z = yo.z; cam.yawObj = cam.yaw = yo.ry + Math.PI / 2 + 0.3; cam.pitchObj = cam.pitch = 0.22; cam.distObj = cam.dist = 5.5;
    cam.modo = "seguir";
  }, 1400);
  setTimeout(() => { fundido(false); J.cinematica = false; transicion = false; }, 1900);
  setTimeout(() => { if (!J.dios.on && tok === tokenDios) { J.novia.hablando = 2.5; decir("¿Estás bien?", "ella", 2600, true); } }, 2600);
  setTimeout(() => { if (!J.dios.on && tok === tokenDios) { decir("Ah, sí, gracias. Solo me quedé pensando de más, jaja.", "yo", 3800, true); } }, 5200);
  setTimeout(() => { if (!J.dios.on && tok === tokenDios) { J.novia.abrazaT = 2.5; yo.abrazaT = 2.5; fx.corazones(J.novia.x, J.novia.y + 1.6, J.novia.z, 8, 1.6); son("corazon"); } }, 9200);
}
/* Que no quede nada del caos: estrellas, policía, coches volteados, cosas rotas, grietas, agua… */
function limpiarCaos() {
  J.caos = 0; hudCaos(""); enVivo(false);
  J.sismo = null; J.ola = null; bucleEn("sismo", 0); bucleEn("ola", 0); bucleEn("viento", 0);
  for (const t of tornados) { J.escena.remove(t.m); t.m.material.dispose(); } tornados.length = 0;
  for (const p of proyectiles) if (p.orbe) p.orbe.soltar(); if (orbeCarga) orbeCarga.soltar(); orbeCarga = null;
  proyectiles.length = 0; amorT = 0; lluviaObj = 0; J.lloviendo = J.lluviaNatural || 0; J.congelado = 0;
  J.limpiarEventos && J.limpiarEventos();
  restaurarTodos(); objetos.restaurarTodos(); calmarTodos(); fx.limpiar();
  J.temblor = 0;
}
/* ══════════════════ ELEGIR A QUIÉN ══════════════════ */
/* Lo que el poder apunta: lo que se tocó, o lo más cercano enfrente. */
/* ══════════════════ LA MIRA (sin autoapuntado) ══════════════════
   Los poderes salen hacia donde apunta la cámara: una línea desde la cámara
   por la mira (un poco arriba del centro, para no tapar al personaje) que
   avanza hasta chocar con lo primero que haya: una persona, un coche, un
   objeto, un helicóptero, un edificio o el piso. Nada se elige solo: si
   fallas, fallas. */
const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(0, 0.24);
export function mira(alcance = 90) {
  _ray.setFromCamera(_ndc, J.camara);
  const o = _ray.ray.origin, d = _ray.ray.direction, yo = J.jugador;
  // empezar ya pasando al personaje (lo que esté entre la cámara y yo no cuenta)
  const t0 = Math.max(0, (yo.x - o.x) * d.x + (yo.y + 1 - o.y) * d.y + (yo.z - o.z) * d.z) + 0.6;
  let mejor = null, tMejor = alcance;
  const probar = (obj, x, y, z, r) => {
    const t = (x - o.x) * d.x + (y - o.y) * d.y + (z - o.z) * d.z;
    if (t < t0 || t > tMejor) return;
    const px = o.x + d.x * t - x, py = o.y + d.y * t - y, pz = o.z + d.z * t - z;
    if (px * px + py * py + pz * pz < r * r) { tMejor = t; mejor = obj; }
  };
  for (const c of J.coches) if (c.estado !== "fuera" && c.estado !== "conducido" && c.fase !== "RESTOS") probar(c, c.x, c.y, c.z, c.T.L * 0.45);
  for (const ob of J.objetos) if (ob.estado !== "DESTRUIDO") probar(ob, ob.x, (ob.y || 0) + 0.4, ob.z, 0.75);
  for (const a of J.gente) if (a.ver && a.estado !== "DENTRO") probar(a, a.x, (a.y || 0) + 0.9, a.z, 0.55);
  if (J.helis) for (const h of J.helis()) if (h.fase !== "cae") probar(h, h.x, h.y, h.z, 2.6);
  // el piso y los edificios: avanzar por la línea hasta chocar
  for (let t = t0; t < tMejor; t += 0.35) {
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y <= 0.02) { tMejor = t; mejor = null; break; }
    let dentro = false; for (const e of edificios) if (x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1 && y < e.h) { dentro = true; break; }
    if (dentro) { tMejor = t; mejor = null; break; }
  }
  return { x: o.x + d.x * tMejor, y: Math.max(0.05, o.y + d.y * tMejor), z: o.z + d.z * tMejor, obj: mejor, dir: d };
}
function blanco(alcance = 35, soloLevantable = false) {
  const yo = J.jugador, ay = J.camYaw || 0, fwx = -Math.sin(ay), fwz = -Math.cos(ay);
  let mejor = null, punt = 1e9;
  const evaluar = (o, x, z, extra = 0) => {
    const dx = x - yo.x, dz = z - yo.z, d = Math.hypot(dx, dz);
    if (d > alcance || d < 0.8) return;
    const ang = Math.abs(difAng(Math.atan2(dx, dz), Math.atan2(fwx, fwz)));
    if (ang > 0.75) return;
    const p = d + ang * 14 + extra;
    if (p < punt) { punt = p; mejor = o; }
  };
  for (const c of J.coches) if (c.estado !== "fuera" && c.fase !== "RECUPERANDO" && c.fase !== "RESTOS" && c.estado !== "conducido") evaluar(c, c.x, c.z, soloLevantable ? -3 : 0);
  for (const o of J.objetos) if (o.estado !== "DESTRUIDO" && o.estado !== "RECUPERANDO") evaluar(o, o.x, o.z, 2);
  if (!soloLevantable) for (const a of J.gente) if (a.ver && a.estado !== "DENTRO" && !a.audifonos) evaluar(a, a.x, a.z, 4);
  // los helicópteros: si estoy mirando hacia arriba, son el blanco preferido
  if (!soloLevantable && J.helis) for (const h of J.helis()) if (h.fase !== "cae" && h.fase !== "se_va") evaluar(h, h.x, h.z, (J.cam && J.cam.pitch < 0.05) ? -6 : 10);
  return mejor;
}
function puntoAdelante(d = 18) { const yo = J.jugador, ay = J.camYaw || 0; return { x: yo.x - Math.sin(ay) * d, y: 0.2, z: yo.z - Math.cos(ay) * d }; }
J.tocarMundo = (p) => {   // un toque en la pantalla con un poder elegido
  if (!J.dios.on) return false;
  if (poder === "rayo") { lanzarRayo(p, null); return true; }
  if (poder === "tornado") { crearTornado(p.x, p.z); return true; }
  return false;
};

/* ══════════════════ LOS PODERES ══════════════════ */
let cargaPoder = 0, lluviaObj = 0, amorT = 0, orbeCarga = null;
const tornados = [];
function usarPoder() {
  const yo = J.jugador;
  switch (poder) {
    case "rayo": { const m = mira(); lanzarRayo({ x: m.x, y: m.y, z: m.z }, m.obj); break; }
    case "levantar": if (J.agarrado) aventar(); else { const m = mira(35); const b = m.obj && (m.obj.T || J.objetos.includes(m.obj)) ? m.obj : null; if (b) agarrar(b); else decir("Apunta la mira a un coche o a algo para levantarlo", "dios", 1800); } break;
    case "empuje": ondaEmpuje(); break;
    case "escudo": J.escudoT = 9; son("magia"); fx.onda(yo.x, yo.y + 0.1, yo.z, 3, 0.6, "#a8d8ff"); decir("Nada nos va a pasar 🛡️", "dios", 1800); break;
    case "terremoto": terremoto(); break;
    case "tsunami": tsunami(); break;
    case "lluvia": lluviaObj = lluviaObj ? 0 : 1; decir(lluviaObj ? "Que llueva… 🌧️" : "Ya, que vuelva a salir la luna 🌙", "dios", 2200); if (lluviaObj) anunciar({ tipo: "lluvia", x: yo.x, z: yo.z, radio: 90, fuerza: 0.3 }); break;
    case "tornado": { const m = mira(60); crearTornado(m.x, m.z); break; }
    case "meteoros": meteoros(); break;
    case "corazones": amorT = 12; decir("Para ti, mi niña bonita 💗", "dios"); son("corazon"); anunciar({ tipo: "amor", x: yo.x, z: yo.z, radio: 60, fuerza: 0.2 }); setTimeout(() => { if (J.dios.on) { decirElla("Amor… ¿eso lo hiciste tú? 🥹💗"); J.novia.abrazaT = 3; } }, 2600); break;
    case "tiempo": J.congelado = 7; son("magia"); decir("El tiempo se detuvo… sólo para mirarte un ratito más 🤍", "dios", 3400); J.misterio && J.misterio("tiempo"); break;
    case "ovni": J.llamarOvni && J.llamarOvni(); break;
  }
}
function lanzarRayo(p, quien) {
  const yo = J.jugador;
  yo.anim.golpe = { tipo: "rayo", t: 0, dur: 0.45 };
  yo.ry = Math.atan2(p.x - yo.x, p.z - yo.z);
  const mano = new THREE.Vector3(yo.x + Math.sin(yo.ry) * 0.55, yo.y + 1.45, yo.z + Math.cos(yo.ry) * 0.55);
  fx.rayo(mano, new THREE.Vector3(p.x, p.y, p.z));
  son("zap", yo.x, yo.z); son("trueno", p.x, p.z, 0.6);
  fx.chispas(p.x, p.y, p.z, 22, 9, "azul"); fx.onda(p.x, Math.max(0, p.y - 0.3), p.z, 3, 0.4, "#c8d8ff");
  J.temblor = Math.max(J.temblor || 0, 0.25);
  J.golpear({ x: p.x, y: p.y + 0.5, z: p.z, r: 1.6, k: 1.1, circular: true });
  if (quien && quien.anim) { quien.chamuscado = 4; }
  anunciar({ tipo: "rayo", x: p.x, y: p.y, z: p.z, radio: 30, fuerza: 0.7 });
  J.caos += 4;
  if (J.alRayo) J.alRayo(mano, p);
}
/* ── levantar y aventar ── */
function agarrar(o) {
  J.agarrado = o; J.levantando = true;
  if (o.T && o.m) { soltarFisica(o); o.estado = "agarrado"; if (o.conductor) { o.conductor = false; const p = J.crearPersona({ x: o.x + 1.5, z: o.z, estado: "CORRE", te: 4 }); p.y = 0; globito(p, elegir(["¡Mi coche!", "¡Oiga, ese es mío!", "¡Apenas lo terminé de pagar!"]), "gente", 2.2, 2.1); son("grito", p.x, p.z, 1, p.fem); } }
  else { o.libre = true; }
  bucleEn("tk", 0.05); son("whoosh", o.x, o.z, 0.6);
  fx.brillos(o.x, (o.y || 0) + 1, o.z, 20, "oro", 1, 2);
  anunciar({ tipo: "levanta", x: o.x, y: 3, z: o.z, radio: 30, fuerza: 0.5 });
  pintarBarra();
}
function soltarAgarre() {
  const o = J.agarrado; if (!o) return;
  J.agarrado = null; J.levantando = false; bucleEn("tk", 0);
  if (o.T && o.m) { o.estado = "fisica"; }
  pintarBarra();
}
function aventar() {
  const o = J.agarrado; if (!o) return;
  const yo = J.jugador, ay = J.camYaw || 0, v = o.m ? 26 : 30;
  o.vx = -Math.sin(ay) * v; o.vz = -Math.cos(ay) * v; o.vy = 7;
  if (o.w) o.w.set(rnd(-3, 3), rnd(-2, 2), rnd(-3, 3));
  soltarAgarre();
  yo.anim.golpe = { tipo: "lanzar", t: 0, dur: 0.5 };
  son("whoosh", yo.x, yo.z, 1.3);
  J.caos += 5;
}
function moverAgarrado(dt) {
  const o = J.agarrado; if (!o) return;
  const yo = J.jugador, ay = J.camYaw || 0;
  const tam = o.T && o.T.L ? o.T.L : 1;
  const tx = yo.x - Math.sin(ay) * (3 + tam * 0.6), tz = yo.z - Math.cos(ay) * (3 + tam * 0.6), ty = yo.y + 2.6 + tam * 0.25 + Math.sin(J.t * 2) * 0.25;
  const k = 1 - Math.exp(-6 * dt);
  o.vx = (tx - o.x) * 6; o.vy = (ty - o.y) * 6; o.vz = (tz - o.z) * 6;
  o.x += (tx - o.x) * k; o.y += (ty - o.y) * k; o.z += (tz - o.z) * k;
  if (o.q) { const r = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(J.t * 1.3) * 0.25, ay + J.t * 0.4, Math.sin(J.t * 1.7) * 0.2)); o.q.slerp(r, k * 0.5); }
  if (Math.random() < dt * 30) fx.brillos(o.x, o.y, o.z, 1, Math.random() < 0.6 ? "oro" : "rosa", 1.2, 0.6);
  if (o.m) { o.m.raiz.position.set(o.x, o.y, o.z); }
}
/* ── la explosión ── */
export function explosion(x, y, z, k, menos = null) {
  J.golpearHelis && J.golpearHelis(x, y, z, 4 + k * 5, k);
  fx.bolaFuego(x, y + 0.4, z, 1.5 + k * 2, 0.5 + k * 0.22);
  fx.fuego(x, y, z, Math.round(16 + k * 18), 1 + k * 0.6);
  fx.humo(x, y + 0.5, z, Math.round(6 + k * 8), 1.4 + k, true);
  fx.chispas(x, y, z, Math.round(16 + k * 20), 10 + k * 7, "fuego2");
  fx.escombro(x, y + 0.3, z, Math.round(6 + k * 8), "#3a3036", 7 + k * 4, 0.2);
  fx.onda(x, Math.max(0, y - 0.6), z, 6 + k * 10, 0.7);
  fx.destello(x, y + 1, z, 18 + k * 20, "#ff9a4a", 0.7);
  son("boom", x, z, Math.min(1.4, 0.5 + k * 0.6));
  J.temblor = Math.max(J.temblor || 0, (0.4 + k * 0.7) * clamp(1 - Math.hypot(x - J.jugador.x, z - J.jugador.z) / 70, 0.15, 1));
  const R = 4 + k * 7;
  for (const c of J.coches) {
    if (c === menos || c.estado === "fuera" || c.estado === "agarrado" || c.fase === "RECUPERANDO") continue;
    const dx = c.x - x, dz = c.z - z, d = Math.hypot(dx, dz); if (d > R) continue;
    const f = (1 - d / R) * (10 + k * 10) / c.T.masa;
    soltarFisica(c); c.vx += (dx / (d || 1)) * f; c.vz += (dz / (d || 1)) * f; c.vy += f * 0.8; c.w.add(new THREE.Vector3(rnd(-2, 2), rnd(-1, 1), rnd(-2, 2)).multiplyScalar(f * 0.15));
    c.dano += (1 - d / R) * k * 0.7 / c.T.masa;
    if (c.dano >= 1) setTimeout(() => J.explotarCoche(c), rnd(300, 700));
  }
  for (const o of J.objetos) { const dx = o.x - x, dz = o.z - z, d = Math.hypot(dx, dz); if (d < R) { const f = (1 - d / R) * (8 + k * 8); objetos.empujar(o, (dx / (d || 1)) * f, f * 0.9, (dz / (d || 1)) * f, k); } }
  rejilla.cerca(x, z, R, _c);
  for (const a of _c) { const dx = a.x - a.x + (a.x - x), dz = a.z - z, d = Math.hypot(dx, dz); if (d < R * 0.75 && a.estado !== "DENTRO") derribar(a, dx / (d || 1), dz / (d || 1), 1 - d / R + 0.3); }
  anunciar({ tipo: "explosion", x, y, z, radio: 24 + k * 22, fuerza: 0.8 + k });
  J.caos += 6 + k * 12;
  if (J.alExplosion) J.alExplosion(x, z, k);
}
const _c = [];
const proyectiles = [];
function soltarCarga() {
  const yo = J.jugador, k = cargaPoder; cargaPoder = 0; J.cargandoPoder = false;
  if (k < 0.08) { if (orbeCarga) orbeCarga.soltar(); orbeCarga = null; return; }
  const p = mira();
  const mano = { x: yo.x + Math.sin(yo.ry) * 0.6, y: yo.y + 1.45, z: yo.z + Math.cos(yo.ry) * 0.6 };
  proyectiles.push({ ...mano, tx: p.x, ty: p.y, tz: p.z, k, orbe: orbeCarga }); orbeCarga = null;
  yo.anim.golpe = { tipo: "lanzar", t: 0, dur: 0.45 };
  son("whoosh", yo.x, yo.z, 1);
}
/* ── la onda de empuje: un cono de fuerza hacia donde apunta la mira ── */
function ondaEmpuje() {
  const yo = J.jugador, m = mira(30), dx0 = m.x - yo.x, dz0 = m.z - yo.z, dl = Math.hypot(dx0, dz0) || 1, ux = dx0 / dl, uz = dz0 / dl;
  yo.anim.golpe = { tipo: "rayo", t: 0, dur: 0.4 }; yo.ry = Math.atan2(ux, uz);
  son("whoosh", yo.x, yo.z, 1.2); J.temblor = Math.max(J.temblor || 0, 0.3);
  for (let k = 0; k < 5; k++) fx.onda(yo.x + ux * (2 + k * 2.4), yo.y + 0.6, yo.z + uz * (2 + k * 2.4), 1.5 + k * 0.9, 0.35 + k * 0.08, "#c8e4ff");
  const enCono = (x, z) => { const ax = x - yo.x, az = z - yo.z, d = Math.hypot(ax, az); return d > 0.5 && d < 18 && (ax * ux + az * uz) / d > 0.75 ? 1 - d / 18 : 0; };
  for (const c of J.coches) { if (c.estado === "fuera" || c.estado === "conducido") continue; const f = enCono(c.x, c.z); if (!f) continue;
    soltarFisica(c); const F = (8 + f * 16) / c.T.masa; c.vx += ux * F; c.vz += uz * F; c.vy += F * 0.45; c.w.add(new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(F * 0.12)); c.dano += f * 0.15 / c.T.masa; }
  for (const o of J.objetos) { const f = enCono(o.x, o.z); if (f) objetos.empujar(o, ux * (6 + f * 12), 3 + f * 4, uz * (6 + f * 12), 0.6); }
  for (const a of J.gente) { if (a.estado === "DENTRO") continue; const f = enCono(a.x, a.z); if (f) derribar(a, ux, uz, 0.6 + f); }
  J.caos += 8;
}
/* ── el terremoto ── */
function terremoto() {
  if (J.sismo) return;
  const yo = J.jugador;
  J.sismo = { t: 0, dur: 7, prox: 0 }; J.novia.escudo = 8;
  decir("¡Que tiemble! 🌎", "dios", 1800);
  son("sismo"); J.caos += 30;
  anunciar({ tipo: "sismo", x: yo.x, z: yo.z, radio: 150, fuerza: 1.4 });
  for (let k = 0; k < 6; k++) J.grieta && J.grieta(yo.x + rnd(-22, 22), yo.z + rnd(-22, 22));
}
function sacudir(dt) {
  const s = J.sismo; if (!s) return;
  s.t += dt;
  const k = Math.pow(Math.max(0, Math.sin(Math.PI * s.t / s.dur)), 0.6);
  J.temblor = Math.max(J.temblor || 0, k * 1.1);
  bucleEn("sismo", 0.55 * k);
  if ((s.prox -= dt) <= 0) {
    s.prox = 0.25;
    const yo = J.jugador;
    for (const c of J.coches) {
      if (c.estado === "fuera" || c.estado === "agarrado" || c.estado === "conducido" || Math.hypot(c.x - yo.x, c.z - yo.z) > 70) continue;
      if (c.estado === "maneja" && Math.random() < 0.6) { soltarFisica(c); c.panico = 5; if (Math.random() < 0.4) son("claxon", c.x, c.z); }
      if (c.estado === "fisica" && c.suelo && Math.random() < 0.5) { c.vy = rnd(1, 3.5) * k / c.T.masa + 1; c.vx += rnd(-1.5, 1.5) * k; c.vz += rnd(-1.5, 1.5) * k; c.w.y += rnd(-0.6, 0.6) * k; }
    }
    for (const o of J.objetos) if (Math.random() < 0.25 * k && Math.hypot(o.x - yo.x, o.z - yo.z) < 60) objetos.empujar(o, rnd(-2, 2), rnd(1, 3), rnd(-2, 2), 0.3);
    if (Math.random() < 0.7) { const x = yo.x + rnd(-30, 30), z = yo.z + rnd(-30, 30); fx.polvo(x, 0, z, 4, 1); fx.escombro(x, rnd(6, 14), z, 2, "#5a4a5a", 2, 0.25); }
  }
  if (s.t >= s.dur) { J.sismo = null; bucleEn("sismo", 0); setTimeout(() => son("alarma", J.jugador.x + 8, J.jugador.z), 400); }
}
/* ── el tsunami ── */
function tsunami() {
  if (J.ola) return;
  const yo = J.jugador;
  J.ola = { t: 0, x: yo.x - 90, v: 32, alto: 9, fase: "avanza", nivel: 0 };
  decir("¡Que venga el mar! 🌊", "dios", 1800);
  son("ola", yo.x - 40, yo.z); J.caos += 40;
  anunciar({ tipo: "ola", x: yo.x - 30, z: yo.z, radio: 200, fuerza: 1.5 });
  J.novia.escudo = 14;
  for (const an of J.animales) an.escudo = 16;
  J.cinematicaCam({ dur: 3.2, yaw: Math.PI / 2 + 0.3, dist: 16, pitch: 0.25 });
  setTimeout(() => J.llamarHeli && J.llamarHeli("noticias"), 3500);
}
export function nivelAgua(x) {
  const o = J.ola; if (!o) return -1;
  if (o.fase === "baja") return o.nivel;
  const d = o.x - x;
  if (d < -2) return -1;
  if (d < 6) return o.alto * (d + 2) / 8;
  return Math.max(o.nivel, o.alto * Math.max(0.15, 1 - (d - 6) / 60));
}
function mover_ola(dt) {
  const o = J.ola; if (!o) return;
  o.t += dt;
  const yo = J.jugador;
  if (o.fase === "avanza") {
    o.x += o.v * dt; o.nivel = Math.min(2.2, o.nivel + dt * 0.8);
    bucleEn("ola", 0.5, o.x, yo.z);
    if (Math.random() < dt * 30) fx.agua(o.x, o.alto * 0.9, yo.z + rnd(-30, 30), 3, 2);
    // la gente y las cosas que alcanza, se las lleva
    for (const a of J.gente) if (a.estado !== "DENTRO" && a.estado !== "ARRASTRADO" && !a.controlado && a.x < o.x && a.x > o.x - 30 && Math.abs(a.z - yo.z) < 90) {
      a.estado = "ARRASTRADO"; a.vx = o.v * rnd(0.6, 0.85); a.vz = rnd(-1, 1); a.anim.caido = 0.6; a.mojado = 20;
      if (!a.surf && Math.random() < 0.06 && a.caracter === "valiente") { a.surf = true; }
      if (Math.random() < 0.25) son("gritito", a.x, a.z, 1, a.fem);
    }
    for (const c of J.coches) if (c.estado !== "fuera" && c.estado !== "agarrado" && c.estado !== "conducido" && c.x < o.x && c.x > o.x - 30) { soltarFisica(c); c.flota = 6; }
    for (const ob of J.objetos) if (ob.x < o.x && ob.x > o.x - 20 && ob.estado === "NORMAL") objetos.empujar(ob, o.v * 0.5, 2, 0, 0.2);
    if (o.x > yo.x + 140) { o.fase = "baja"; }
  } else {
    o.nivel = Math.max(0, o.nivel - dt * 0.5); bucleEn("ola", 0.2 * o.nivel / 2.2, yo.x, yo.z);
    if (o.nivel <= 0) { J.ola = null; bucleEn("ola", 0); setTimeout(() => decir("Ya se fue el agua… la ciudad vuelve poquito a poco a la normalidad 🌙", "yo"), 800); }
  }
  for (const a of J.gente) if (a.estado === "ARRASTRADO") {
    const n = nivelAgua(a.x);
    a.x += a.vx * dt; a.z += a.vz * dt; a.vx *= Math.exp(-0.25 * dt);
    if (n > 0.3) { a.y = amort(a.y, n - 0.6, 4, dt); a.anim.caido = a.surf ? 0 : 0.7; a.anim.aire = a.surf ? 1 : 0; if (a.surf && !a.surfDicho) { a.surfDicho = true; globito(a, "¡Wiii! 🏄", "gente", 2.4, 2.4); J.misterio && J.misterio("surf"); } }
    else { a.estado = "HERIDO"; a.te = rnd(1, 2); a.vx = a.vz = 0; a.vy = 0; a.anim.aire = 0; }
  }
  for (const c of J.coches) if (c.flota > 0 && c.estado === "fisica") {
    c.flota -= dt; const n = nivelAgua(c.x);
    if (n > 0.6) { c.vy = (n - c.y) * 3; c.vx = amort(c.vx, o.fase === "avanza" ? o.v * 0.55 : 0, 1.5, dt); c.w.y = Math.sin(J.t + c.x) * 0.4; }
  }
  // ella y yo: en una burbujita (y yo, con Modo Dios, no me muevo)
}
/* La ola que se ve: un plano que sube con el perfil de nivelAgua (en el shader). */
let olaMalla = null;
function armarOla() {
  const geo = new THREE.PlaneGeometry(320, 320, 160, 2).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: "#1e5a7a", roughness: 0.18, metalness: 0.2, transparent: true, opacity: 0.86, emissive: "#0a2a3a" });
  const u = { uFrente: { value: 0 }, uAlto: { value: 9 }, uNivel: { value: 0 }, uBaja: { value: 0 }, uT: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = "uniform float uFrente, uAlto, uNivel, uBaja, uT; varying float vEspuma;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 wp = modelMatrix * vec4(position, 1.0); float d = uFrente - wp.x; float h;
      if (uBaja > 0.5) h = uNivel; else if (d < -2.0) h = -3.0; else if (d < 6.0) h = uAlto * (d + 2.0) / 8.0; else h = max(uNivel, uAlto * max(0.15, 1.0 - (d - 6.0) / 60.0));
      h += sin(wp.z * 0.35 + uT * 2.0) * 0.25 + sin(wp.x * 0.5 - uT * 3.0) * 0.18;
      transformed.y += h; vEspuma = uBaja > 0.5 ? 0.15 : smoothstep(10.0, 0.0, abs(d - 1.0));`);
    sh.fragmentShader = "varying float vEspuma;\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.95, 1.0), vEspuma * 0.8);");
  };
  mat.customProgramCacheKey = () => "ola";
  olaMalla = new THREE.Mesh(geo, mat); olaMalla.frustumCulled = false; olaMalla.visible = false; olaMalla.userData.u = u;
  J.escena.add(olaMalla);
}
function pintarOla(dt) {
  const o = J.ola; if (!olaMalla) return;
  olaMalla.visible = !!o; if (!o) return;
  const yo = J.jugador, u = olaMalla.userData.u;
  olaMalla.position.set(yo.x, 0.1, yo.z);
  u.uFrente.value = o.x; u.uAlto.value = o.alto; u.uNivel.value = o.nivel; u.uBaja.value = o.fase === "baja" ? 1 : 0; u.uT.value += dt;
}

/* ── el tornado ── */
let embudoGeo = null;
function embudo() {
  if (!embudoGeo) embudoGeo = new THREE.CylinderGeometry(8, 0.9, 30, 28, 10, true).translate(0, 15, 0);
  const m = new THREE.Mesh(embudoGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: "uniform float uT; varying vec2 vU; void main(){ vU = uv; vec3 p = position; float k = uv.y; p.x += sin(uT*1.7 + k*5.0) * k * 2.5; p.z += cos(uT*1.3 + k*4.0) * k * 2.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }",
    fragmentShader: "uniform float uT, uA; varying vec2 vU; void main(){ float r = sin(vU.x*40.0 + vU.y*18.0 - uT*14.0)*0.5+0.5; float r2 = sin(vU.x*17.0 - vU.y*9.0 - uT*9.0)*0.5+0.5; float a = (0.25 + 0.45*r*r2) * smoothstep(0.0, 0.12, vU.y) * smoothstep(1.0, 0.75, vU.y); gl_FragColor = vec4(mix(vec3(0.32,0.3,0.4), vec3(0.75,0.72,0.82), r), a * uA); }",
  }));
  m.frustumCulled = false; J.escena.add(m);
  return m;
}
function crearTornado(x, z) {
  tornados.push({ x, z, t: 0, dur: 9, dir: rnd(TAU), m: embudo() });
  decir("¡Tornado! 🌪️", "dios", 1500); J.caos += 20; J.novia.escudo = 10;
  anunciar({ tipo: "tornado", x, z, radio: 45, fuerza: 1.2 });
  J.alTornado && J.alTornado(tornados[tornados.length - 1]);
}
function moverTornados(dt) {
  bucleEn("viento", tornados.length ? 0.35 : 0, tornados[0] && tornados[0].x, tornados[0] && tornados[0].z);
  for (let i = tornados.length - 1; i >= 0; i--) {
    const t = tornados[i]; t.t += dt;
    t.dir += rnd(-0.6, 0.6) * dt; t.x += Math.sin(t.dir) * 5 * dt; t.z += Math.cos(t.dir) * 5 * dt;
    const o = { x: t.x, z: t.z }; if (chocarEdificios(o, 2, 0)) t.dir += Math.PI * 0.7; t.x = clamp(o.x, -76, 76); t.z = clamp(o.z, -76, 76);
    const k = Math.min(1, t.t / 0.8) * Math.min(1, (t.dur - t.t) / 1.2);
    for (const c of J.coches) {
      if (c.estado === "fuera" || c.estado === "agarrado" || c.estado === "conducido" || c.T.masa > 3) continue;
      const dx = c.x - t.x, dz = c.z - t.z, d = Math.hypot(dx, dz); if (d > 12) continue;
      soltarFisica(c); const f = (1 - d / 12) * k;
      c.vx += (-dz / (d || 1) * 14 - dx / (d || 1) * 4) * f * dt; c.vz += (dx / (d || 1) * 14 - dz / (d || 1) * 4) * f * dt; c.vy += 22 * f * dt * (c.y < 14 ? 1 : 0);
      c.w.y += 3 * f * dt;
    }
    for (const ob of J.objetos) { const d = Math.hypot(ob.x - t.x, ob.z - t.z); if (d < 9 && ob.estado !== "DESTRUIDO") { ob.libre = true; ob.vx += -(ob.z - t.z) * 0.9 * k * dt * 10; ob.vz += (ob.x - t.x) * 0.9 * k * dt * 10; ob.vy += 20 * k * dt; } }
    rejilla.cerca(t.x, t.z, 7, _c);
    for (const a of _c) if (a.estado !== "HERIDO" && a.estado !== "DENTRO" && Math.hypot(a.x - t.x, a.z - t.z) < 5 && k > 0.4) { derribar(a, a.x - t.x, a.z - t.z, 1.2); a.vy = 7; }
    if (Math.random() < dt * 12) fx.polvo(t.x + rnd(-2, 2), 0, t.z + rnd(-2, 2), 2, 1.6);
    t.m.position.set(t.x, 0, t.z); t.m.rotation.y -= dt * 3; t.m.material.uniforms.uT.value += dt; t.m.material.uniforms.uA.value = k;
    if (t.t > t.dur) { J.escena.remove(t.m); t.m.material.dispose(); tornados.splice(i, 1); }
  }
  J.tornados = tornados;
}
/* ── los meteoritos ── */
function meteoros() {
  const yo = J.jugador;
  decir("¡Lluvia de meteoritos! ☄️", "dios", 1800);
  for (let k = 0; k < 7; k++) setTimeout(() => {
    const tx = yo.x + rnd(-28, 28), tz = yo.z + rnd(-28, 28);
    proyectiles.push({ x: tx - rnd(30, 50), y: 70, z: tz - rnd(10, 30), tx, ty: 0.2, tz, k: 0.9, meteoro: true, v: 55 });
    son("cohete", tx, tz);
  }, k * 520);
  J.caos += 25;
}

/* ══════════════════ CADA CUADRO ══════════════════ */
/* La burbuja del escudo (una para mí y otra para ella). */
let burbujas = null;
function actualizarEscudo(dt) {
  if (!burbujas) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    burbujas = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1.15, 28, 18), mat); m.layers.set(1); m.visible = false; J.escena.add(m); return m; });
  }
  J.escudoT = Math.max(0, (J.escudoT || 0) - dt);
  const k = Math.min(1, J.escudoT * 2), on = J.escudoT > 0;
  burbujas[0].material.opacity = 0.16 * k + Math.sin(J.t * 9) * 0.03 * k;
  [J.jugador, J.novia].forEach((p, i) => { const b = burbujas[i]; b.visible = on && !p.coche; if (on) { b.position.set(p.x, p.y + 0.95, p.z); b.scale.setScalar(1 + Math.sin(J.t * 3 + i) * 0.03); } });
}
/* ¿La mira se ve? (con un poder que apunta, o cargando la explosión) */
const APUNTAN = new Set(["rayo", "levantar", "carga", "tornado", "empuje"]);
let miraVisible = false;
export function actualizar(dt, dtM) {
  const yo = J.jugador, ella = J.novia;
  actualizarEscudo(dt);
  const ver = J.dios.on && APUNTAN.has(poder) && !yo.coche;
  if (ver !== miraVisible) { miraVisible = ver; document.body.classList.toggle("apunta", ver); }
  // el botón ✨
  if (E.dios) { if (J.dios.on) apagarDios(); else prenderDios(); }
  J.dios.nivel = clamp(J.dios.nivel + (J.dios.on && J.dios.brilla ? dt * 1.4 : -dt * 0.6), 0, 1);   // el brillo, sólo ya transformado
  // los botones según lo que pasa
  botonBajar(yo.vuela || cam.modo === "dron");
  botonSaltar(!yo.vuela && J.dios.on && !yo.suelo ? "volar" : "saltar");
  if (yo.planea > 0) { yo.planea -= dt; if (!yo.suelo) yo.vy = Math.max(yo.vy, -3); }
  // el poder
  if (J.dios.on) {
    if (E.poder && poder !== "carga") usarPoder();
    if (poder === "carga") {
      if (E.poderSostenido) { J.cargandoPoder = true; cargaPoder = Math.min(1, cargaPoder + dt / 1.6); if (!orbeCarga) orbeCarga = fx.orbe("#ffcf8a"); orbeCarga.poner(yo.x + Math.sin(yo.ry) * 0.7, yo.y + 1.5, yo.z + Math.cos(yo.ry) * 0.7, 0.12 + cargaPoder * 0.42 + Math.sin(J.t * 20) * 0.02); if (Math.random() < dt * 40) { const m = { x: yo.x + Math.sin(yo.ry) * 0.6, y: yo.y + 1.45, z: yo.z + Math.cos(yo.ry) * 0.6 }; fx.brillos(m.x, m.y, m.z, 1, Math.random() < 0.5 ? "oro" : "rosa", 0.6 * (1 - cargaPoder) + 0.15, 0.3); } if (Math.random() < dt * 6) son("carga", yo.x, yo.z, cargaPoder); if (cargaPoder >= 1) J.temblor = Math.max(J.temblor || 0, 0.12); }
      else if (J.cargandoPoder || E.poderSuelto) soltarCarga();
    }
    moverAgarrado(dt);
  } else if (J.agarrado) soltarAgarre();
  // los proyectiles (la carga y los meteoritos)
  for (let i = proyectiles.length - 1; i >= 0; i--) {
    const p = proyectiles[i], dx = p.tx - p.x, dy = p.ty - p.y, dz = p.tz - p.z, d = Math.hypot(dx, dy, dz), paso = (p.v || 30) * dt;
    if (d <= paso) { proyectiles.splice(i, 1); if (p.orbe) p.orbe.soltar(); explosion(p.tx, p.ty + 0.4, p.tz, 0.3 + p.k * 1.3); if (p.meteoro) J.grieta && J.grieta(p.tx, p.tz, true); continue; }
    p.x += dx / d * paso; p.y += dy / d * paso; p.z += dz / d * paso;
    if (p.orbe) p.orbe.poner(p.x, p.y, p.z, 0.15 + p.k * 0.45);
    if (p.meteoro) { fx.fuego(p.x, p.y, p.z, 2, 1.4); fx.humo(p.x, p.y, p.z, 1, 1, true); }
    else fx.brillos(p.x, p.y, p.z, 3, Math.random() < 0.5 ? "oro" : "rosa", 0.25 + p.k * 0.3, 0.5);
  }
  // la lluvia
  J.lloviendo = amort(J.lloviendo || 0, J.dios.on || lluviaObj === 0 ? lluviaObj : 0, lluviaObj ? 0.5 : 0.8, dt);
  if (!J.dios.on && J.lluviaNatural) J.lloviendo = amort(J.lloviendo, J.lluviaNatural, 0.4, dt);
  bucleEn("lluvia", 0.18 * J.lloviendo);
  J.lluviaRayos && J.lluviaRayos(dt);
  if (dtM > 0) { sacudir(dtM); mover_ola(dtM); moverTornados(dtM); }
  pintarOla(dtM);
  if (amorT > 0) { amorT -= dt; for (let k = 0; k < 3; k++) if (Math.random() < dt * 14) fx.lluviaDeCorazones(yo.x, yo.z, 22); }
  // el caos: sube con lo que hago; baja solo, rápido si apago el Modo Dios
  J.caos = clamp(J.caos - dt * (J.dios.on ? 1.6 : 10), 0, 165);
  const est = Math.min(5, Math.ceil(J.caos / 30));
  hudCaos(J.dios.on && est ? "🚨 " + "★".repeat(est) + "☆".repeat(5 - est) : "");
  // la acción contextual (la elige lugares.js)
  // el golpe cargándose (mantener el botón)
  const cg = cargaGolpe(); if (cg > 0.95 && Math.random() < dt * 20) fx.brillos(yo.x, yo.y + 1, yo.z, 1, "oro", 0.6, 0.6);
  // la novia también tiene escudo si está cerca de algo feo
  if (ella.escudo > 0) ella.escudo -= dt;
  burbuja.visible = ella.escudo > 0 && (!!J.ola || !!J.sismo || tornados.length > 0);
  if (burbuja.visible) { burbuja.position.set(ella.x, ella.y + 0.9, ella.z); burbuja.scale.setScalar(1 + Math.sin(J.t * 3) * 0.03); }
  void botonAccion; void lerp;
}
void alturaSuelo; void CALLES; void oir;
