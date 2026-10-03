/*
 * LA GENTE Y LOS ANIMALES.
 *
 * Cada peatón tiene un estado (CAMINA, PARADO, PLATICA, SENTADO, COMPRA,
 * MIRA, GRABA, CURIOSO, MIEDO, CORRE, REFUGIO, HERIDO, VUELVE, ATRAPADO…)
 * y una personalidad que decide cómo reacciona: no todos hacen lo mismo.
 *
 * Simulación por niveles (lo más importante para el rendimiento):
 *   · cerca (≲ 50 m): IA completa, percepción y animación cada cuadro;
 *   · media (≲ 90 m): IA sencilla, animación cada tercer cuadro;
 *   · lejos: sólo avanzan por su banqueta, sin dibujarse;
 *   · fuera de zona: ni eso, se reciclan en otro lado.
 * La percepción no es un bucle de todos contra todos: los eventos llegan
 * por el bus (con su radio) y los coches se buscan en la rejilla.
 */
import { J, THREE, rnd, elegir, clamp, amort, amortAng, difAng, oir, anunciar, Rejilla, memo, guardar } from "./base.js";
import { Gentio, Animalitos, nuevaAnim, animar, ALTURA_CADERA } from "./cuerpos.js";
import { nodosAcera, chocarEdificios, alturaSuelo, bancas, puertaCercana, lugares, ACERA_Y } from "./mundo.js";
import { son } from "./audio.js";
import { globito, decir } from "./ui.js";
import { corazones, polvo, brillos } from "./efectos.js";

export const rejilla = new Rejilla(8);
let gentio, animalitos;
const PIEL = ["#c89a7a", "#a8765a", "#8a5a42", "#e0b89a", "#b88464", "#d4a888"].map((c) => new THREE.Color(c));
const PELO = ["#141018", "#2a1a12", "#4a2e1a", "#1a1a1a", "#6a4a2a", "#8a8a96"].map((c) => new THREE.Color(c));
const ROPA = ["#7a3a4e", "#3a4c78", "#4a6e5a", "#8a5e3a", "#62407a", "#6a6a7e", "#9a4a3a", "#2e426a", "#8a7a3a", "#3a6a7a", "#a85a7a", "#c8b8a0", "#5a3a5a"].map((c) => new THREE.Color(c));
const PANTS = ["#1e2230", "#2a2a3a", "#3a2e28", "#26304a", "#3a3a44", "#4a3a5a", "#5a5048"].map((c) => new THREE.Color(c));
const ZAP = ["#e8e4ee", "#2a2028", "#6a4a3a", "#1a1a22"].map((c) => new THREE.Color(c));
export const FRASES = {
  miedo: ["¡AAAH!", "¡Corran!", "¡Mamáaa!", "¡¿Qué fue eso?!", "¡Auxilio!", "¡Ay no, ay no, ay no!", "¡Sálvese quien pueda!", "¡Mi cafecito!", "¡Nooo!"],
  mira: ["¿Es en serio?", "¿Vieron eso?", "No manches…", "¡Qué padre!", "Órale…", "¿Eso es real?", "¿Qué está pasando?"],
  arriba: ["¿Es un pájaro? ¿Es un avión?", "¡Está volando!", "¡Miren arriba!", "¡¿Qué es eso?!"],
  graba: ["¡Lo estoy grabando!", "Esto va directo a TikTok 📱", "¡Nadie me va a creer!", "¡Esto es histórico!"],
  refugio: ["¡Al edificio!", "¡Adentro, rápido!", "¡Me meto aquí!"],
  calma: ["Ya pasó… creo.", "¿Alguien más vio eso?", "Mejor me voy a mi casa.", "Qué noche tan rara…"],
  heroe: ["¡Es un superhéroe!", "¡Está brillando!", "¿Es un ángel?", "¡Qué genio!"],
  coche: ["¡Oiga, fíjese!", "¡Casi me atropella!", "¡Ey!"],
  golpe: ["¡Ay!", "¡Oye!", "¡¿Qué te pasa?!", "¡Auch!"],
  saludo: ["¡Buenas noches!", "¿Qué onda?", "¡Qué bonita noche!", "Voy por unos tacos 🌮", "¿Ya viste la luna?", "¡Hacen bonita pareja! 🥹"],
  amor: ["Aww 🥹", "¡Qué bonito!", "¡Corazones!", "Ay, el amor…"],
  charla: ["…y entonces le dije…", "¿En serio? jajaja", "No te creo 😂", "¿Vamos al Burger?", "Ya me quiero ir a dormir", "¿Viste el partido?"],
};
const PELIGRO = new Set(["explosion", "choque", "rayo", "sismo", "ola", "balas", "tornado", "meteoro", "luna", "coche_vuela"]);

/* ══════════════════ CREAR GENTE ══════════════════ */
export function crearPersona(o = {}) {
  const fem = o.fem ?? Math.random() < 0.5, r = Math.random();
  const tipo = o.tipo || (r < 0.08 ? "nino" : r < 0.16 ? "abuelo" : "adulto");
  const a = {
    x: 0, y: ACERA_Y, z: 0, ry: rnd(Math.PI * 2), vx: 0, vz: 0, vy: 0, vel: 0, fem, tipo,
    escala: tipo === "nino" ? rnd(0.62, 0.72) : tipo === "abuelo" ? rnd(0.9, 0.97) : rnd(0.93, 1.07),
    peinado: fem ? elegir([1, 1, 2, 0]) : elegir([0, 0, 0, 3, 4]), falda: fem && Math.random() < 0.35,
    colores: { piel: elegir(PIEL), pelo: tipo === "abuelo" ? new THREE.Color("#c8c8d2") : elegir(PELO), ropa: elegir(ROPA), ropa2: elegir(ROPA), pantalon: elegir(PANTS), zapato: elegir(ZAP), gorra: elegir(ROPA), telefono: new THREE.Color("#101018"), bolsa: new THREE.Color("#c8a070") },
    caracter: elegir(["miedoso", "miedoso", "curioso", "curioso", "valiente", "grabador", "chismoso"]),
    estado: "CAMINA", te: rnd(2, 8), nodo: 0, prev: -1, lado: rnd(-0.9, 0.9), velBase: tipo === "abuelo" ? rnd(0.8, 1.1) : tipo === "nino" ? rnd(1.3, 1.7) : rnd(1.15, 1.55),
    anim: nuevaAnim(), nivel: 0, cuadro: Math.floor(rnd(3)), ver: true, mirarA: null, chequeo: rnd(0.3),
    ...o,
  };
  a.anim.semilla = rnd(10);
  if (a.colores.falda) a.falda = true;
  if (a.poli) { a.colores.ropa = new THREE.Color("#24407e"); a.colores.pantalon = new THREE.Color("#141a30"); a.colores.gorra = new THREE.Color("#1a2a5a"); a.peinado = 3; a.falda = false; a.escala = rnd(0.98, 1.06); }
  J.gente.push(a);
  return a;
}
function colocarEnAcera(a, lejosDe = null) {
  for (let k = 0; k < 20; k++) {
    const i = Math.floor(rnd(nodosAcera.length)), n = nodosAcera[i], v = elegir(n.vecinos), m = nodosAcera[v];
    const u = Math.random(), x = n.x + (m.x - n.x) * u, z = n.z + (m.z - n.z) * u;
    if (lejosDe && Math.hypot(x - lejosDe.x, z - lejosDe.z) < lejosDe.r) continue;
    a.x = x; a.z = z; a.prev = i; a.nodo = v; return;
  }
}

/* ══════════════════ ARRANCAR ══════════════════ */
export function iniciar() {
  gentio = new Gentio(J.escena, 90);
  animalitos = new Animalitos(J.escena, 16);
  J.gentio = gentio;
  const n = Math.round(J.calidad.gente * 1.15);
  for (let i = 0; i < n; i++) { const a = crearPersona(); colocarEnAcera(a); if (a.tipo === "adulto" && Math.random() < 0.18) crearAnimal("perro", a); }
  // un señor con audífonos que nunca se entera de nada (cerca del inicio)
  const aud = crearPersona({ audifonos: true, caracter: "nada", fem: false });
  aud.colores.ropa = new THREE.Color("#3a8a6a"); aud.peinado = 0;
  colocarEnAcera(aud); aud.x = lugares.inicio.x + 1; aud.z = lugares.inicio.z - 18;
  for (let i = 0; i < 4; i++) crearAnimal("gato");
  oir(alEvento);
  J.crearPersona = crearPersona;
}
export function crearAnimal(tipo, dueno = null) {
  const a = { tipo, dueno, x: 0, y: ACERA_Y, z: 0, ry: 0, vel: 0, fase: 0, escudo: 0, feliz: 0, tam: tipo === "perro" ? rnd(0.8, 1.2) : rnd(0.85, 1), color: tipo === "perro" ? elegir(["#8a5a3a", "#e8d8c0", "#2a2020", "#c89a5a", "#f2f0ea"]) : elegir(["#1a1a22", "#d8883a", "#e8e0d0", "#8a8a90"]), estado: "anda", te: rnd(3), nodo: 0, prev: -1 };
  if (dueno) { a.x = dueno.x - 1; a.z = dueno.z; dueno.perro = a; } else { const p = { x: 0, z: 0 }; colocarEnAcera(p); a.x = p.x; a.z = p.z; a.nodo = p.nodo; a.prev = p.prev; }
  J.animales.push(a);
  return a;
}

/* ══════════════════ LO QUE OYEN ══════════════════ */
function alEvento(ev) {
  const R = ev.radio || 30;
  for (const a of J.gente) {
    if (a.nivel > 1 || a.controlado || a.audifonos || a.estado === "DENTRO" || a.estado === "HERIDO" || a.estado === "ATRAPADO" || a.poli) continue;
    const d = Math.hypot(a.x - ev.x, a.z - ev.z);
    if (d > R * (ev.tipo === "luna" ? 99 : 1)) continue;
    a.reaccion = ev; a.retraso = rnd(0.08, 0.7) + d / 60;
  }
  // los animales: siempre a salvo
  if (PELIGRO.has(ev.tipo) && ev.tipo !== "luna") {
    let primero = null;
    for (const an of J.animales) if (Math.hypot(an.x - ev.x, an.z - ev.z) < R * 0.9) { an.escudo = 5; primero = primero || an; if (an.tipo === "perro") son("ladrido", an.x, an.z); }
    if (primero) {
      if (J.t - (J.dichoAnimal || -99) > 16) {
        J.dichoAnimal = J.t;
        decir("Lo siento, pero no daño a los animales.", J.dios.on ? "dios" : "yo", 3200);
        globito(primero, "🛡️", "perro", 1.8, 1);
      }
      if (!memo.misterios.escudo) J.misterio && J.misterio("escudo");
    }
  }
}
function reaccionar(a, ev) {
  const c = a.caracter, d = Math.hypot(a.x - ev.x, a.z - ev.z), cerca = d < (ev.radio || 30) * 0.45;
  const huirDe = () => { const dx = a.x - ev.x, dz = a.z - ev.z, m = Math.hypot(dx, dz) || 1; a.huye = { x: dx / m, z: dz / m }; };
  a.mirarA = { x: ev.x, y: ev.y || 0, z: ev.z };
  let r;
  if (ev.tipo === "amor") r = "AMOR";
  else if (ev.tipo === "vuelo" || ev.tipo === "dios" || ev.tipo === "levanta") r = c === "miedoso" ? elegir(["MIEDO", "MIRA"]) : elegir(["MIRA", "GRABA", "MIRA", "CURIOSO"]);
  else if (ev.tipo === "luna") r = c === "miedoso" || c === "chismoso" ? elegir(["MIEDO", "CORRE", "MIRA"]) : elegir(["MIRA", "GRABA", "MIRA"]);
  else if (ev.tipo === "lluvia") r = Math.random() < 0.5 ? "REFUGIO" : null;
  else if (PELIGRO.has(ev.tipo)) {
    if (cerca || ev.fuerza > 1.2) r = c === "valiente" ? elegir(["CORRE", "MIRA"]) : elegir(["MIEDO", "CORRE", "CORRE", "REFUGIO"]);
    else r = c === "miedoso" ? elegir(["MIEDO", "CORRE", "REFUGIO"]) : c === "grabador" ? "GRABA" : c === "curioso" ? elegir(["MIRA", "CURIOSO"]) : elegir(["MIRA", "CORRE", "GRABA"]);
  } else r = "MIRA";
  if (!r) return;
  huirDe();
  dejarBanca(a);
  a.estado = r;
  if (r === "MIRA") { a.te = rnd(2, 4.5); if (Math.random() < 0.45) globito(a, elegir(ev.y > 4 || ev.tipo === "vuelo" ? FRASES.arriba : J.dios.on && Math.random() < 0.4 ? FRASES.heroe : FRASES.mira), "gente", 2.2, 2.1 * a.escala); }
  else if (r === "GRABA") { a.te = rnd(3, 6); if (Math.random() < 0.5) globito(a, elegir(FRASES.graba), "gente", 2.2, 2.1 * a.escala); }
  else if (r === "CURIOSO") { a.te = rnd(3, 5); }
  else if (r === "MIEDO") { a.te = rnd(0.8, 1.8); son(Math.random() < 0.5 ? "grito" : "gritito", a.x, a.z, 1, a.fem); if (Math.random() < 0.45) globito(a, elegir(FRASES.miedo), "gente", 1.8, 2.1 * a.escala); }
  else if (r === "CORRE") { a.te = rnd(3, 6); if (Math.random() < 0.5) { son("grito", a.x, a.z, 1, a.fem); globito(a, elegir(FRASES.miedo), "gente", 1.8, 2.1 * a.escala); } }
  else if (r === "REFUGIO") { a.puerta = puertaCercana(a.x, a.z); a.te = 20; if (Math.random() < 0.35) globito(a, elegir(FRASES.refugio), "gente", 1.8, 2.1 * a.escala); }
  else if (r === "AMOR") { a.estado = "MIRA"; a.te = rnd(2.5, 5); if (Math.random() < 0.4) { son("aww", a.x, a.z); globito(a, elegir(FRASES.amor), "gente", 2.2, 2.1 * a.escala); } }
}
function dejarBanca(a) { if (a.banca) { a.banca.ocupada = null; a.banca = null; } }

/* Que alguien reciba un golpe (mío, de un coche, de una explosión). */
export function derribar(a, dx, dz, k) {
  if (a.adentro) return;   // los que cenan en el Burger están a salvo detrás del vidrio
  if (a.audifonos && k < 1.5) { globito(a, "♪ ♫", "gente", 1.4, 2.1); return; }
  dejarBanca(a);
  a.estado = "HERIDO"; a.te = rnd(1.6, 2.8) + k * 0.6; a.controlado = false;
  a.vx = dx * (3 + k * 5); a.vz = dz * (3 + k * 5); a.vy = 2.5 + k * 3.5;
  a.anim.impacto = 1;
  if (Math.random() < 0.6) son("gritito", a.x, a.z, 1, a.fem);
  if (Math.random() < 0.4) globito(a, elegir(FRASES.golpe), "gente", 1.6, 2.1 * a.escala);
}
/* Que todo el mundo vuelva a la calma (al apagar el Modo Dios). */
export function calmarTodos() {
  for (const a of J.gente) {
    if (a.controlado || a.adentro) continue;
    if (a.estado === "DENTRO" && !a.enBurger) a.te = Math.min(a.te, rnd(0.5, 3));
    if (["MIEDO", "CORRE", "REFUGIO", "HERIDO", "ARRASTRADO", "MIRA", "GRABA", "CURIOSO"].includes(a.estado)) { a.estado = "VUELVE"; a.vx = a.vz = a.vy = 0; a.y = alturaSuelo(a.x, a.z, a.y + 0.3); a.anim.caido = 0; a.anim.miedo = 0; a.reaccion = null; }
  }
  for (const an of J.animales) an.escudo = 0;
}
export function golpearGente(h) {
  let pego = false;
  rejilla.cerca(h.x, h.z, h.r + 1, _cerca);
  for (const a of _cerca) {
    if (a.estado === "DENTRO" || a.estado === "ATRAPADO") continue;
    const dx = a.x - h.x, dz = a.z - h.z, d = Math.hypot(dx, dz);
    if (d > h.r + 0.3) continue;
    if (!h.circular) { const ang = Math.atan2(a.x - h.de.x, a.z - h.de.z); if (Math.abs(difAng(ang, h.dir)) > 1.1 && d > 0.7) continue; }
    const m = d || 1;
    derribar(a, dx / m, dz / m, h.k);
    pego = true;
    if (a.poli && J.alPegarPoli) J.alPegarPoli(a);
  }
  return pego;
}
const _cerca = [];

/* ══════════════════ CADA CUADRO ══════════════════ */
let cadaNivel = 0, cuadro = 0;
export function actualizar(dt, dtReal) {
  const yo = J.jugador; cuadro++;
  // los niveles de simulación (cada medio segundo)
  if ((cadaNivel -= dtReal) <= 0) {
    cadaNivel = 0.5;
    const lista = [];
    for (const a of J.gente) { const d = Math.hypot(a.x - yo.x, a.z - yo.z); a.dist = d; a.nivel = d < J.calidad.distIA ? 0 : d < 90 ? 1 : d < 140 ? 2 : 3; if (a.estado !== "DENTRO") lista.push(a); }
    // sólo los más cercanos se dibujan (cuántos, lo decide la calidad)
    lista.sort((p, q) => p.dist - q.dist);
    const max = J.calidad.gente;
    lista.forEach((a, i) => { const ver = i < max && a.dist < 95 && !a.oculto; if (ver && a.casilla == null) gentio.alta(a); else if (!ver && a.casilla != null) gentio.baja(a); a.ver = ver; });
    for (const a of J.gente) if ((a.estado === "DENTRO" || a.oculto) && a.casilla != null) { gentio.baja(a); a.ver = false; }
    // los que se fueron demasiado lejos reaparecen cerca, en otra banqueta
    for (const a of J.gente) if (a.nivel === 3 && !a.controlado && !a.perro && !a.audifonos) { colocarEnAcera(a, { x: yo.x, z: yo.z, r: 60 }); if (Math.hypot(a.x - yo.x, a.z - yo.z) > 140) colocarEnAcera(a); a.estado = "CAMINA"; }
    for (const an of J.animales) { const d = Math.hypot(an.x - yo.x, an.z - yo.z); const ver = d < 70; if (ver && an.casilla == null) animalitos.alta(an); if (!ver && an.casilla != null) animalitos.baja(an); }
  }
  rejilla.limpiar();
  for (const a of J.gente) if (a.estado !== "DENTRO") rejilla.meter(a, a.x, a.z);
  const visibles = [];
  for (let i = J.gente.length - 1; i >= 0; i--) {
    const a = J.gente[i];
    if (a.fuera) { if (a.casilla != null) gentio.baja(a); J.gente.splice(i, 1); continue; }
    if (dt > 0) pensar(a, dt);
    if (a.ver && a.casilla != null) {
      // animación: completa cerca, a saltos lejos
      if (a.nivel === 0 || (cuadro + a.cuadro) % 3 === 0) animar(a, a.nivel === 0 ? dt : dt * 3, 11);
      visibles.push(a);
    }
  }
  gentio.dibujar(visibles);
  // animales
  const anVis = [];
  for (const an of J.animales) { if (dt > 0) pensarAnimal(an, dt); if (an.casilla != null) anVis.push(an); }
  animalitos.dibujar(anVis);
}

/* ── un peatón decide ── */
function pensar(a, dt) {
  if (a.retraso > 0) { a.retraso -= dt; if (a.retraso <= 0 && a.reaccion) { reaccionar(a, a.reaccion); a.reaccion = null; } }
  if (a.controlado) { posePorEstado(a, dt); return; }
  a.te -= dt;
  let mx = 0, mz = 0, v = 0;
  const yo = J.jugador;
  switch (a.estado) {
    case "CAMINA": {
      const n = nodosAcera[a.nodo];
      if (!n) { colocarEnAcera(a); break; }
      // objetivo: el nodo, corrido un poquito a su carril
      const p = nodosAcera[a.prev] || n;
      const ex = n.x - p.x, ez = n.z - p.z, el = Math.hypot(ex, ez) || 1;
      const tx = n.x - (ez / el) * a.lado, tz = n.z + (ex / el) * a.lado;
      const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
      if (d < 0.8) { // escoger por dónde seguir
        const opciones = n.vecinos.filter((q) => q !== a.prev);
        a.prev = a.nodo; a.nodo = opciones.length ? elegir(opciones) : n.vecinos[0];
        break;
      }
      mx = dx / d; mz = dz / d; v = a.velBase;
      // decisiones tranquilas
      if (a.te < 0) {
        a.te = rnd(5, 12);
        const r = Math.random();
        if (r < 0.15) { a.estado = "PARADO"; a.te = rnd(3, 7); }
        else if (r < 0.27) { const b = bancas.find((q) => !q.ocupada && Math.hypot(q.x - a.x, q.z - a.z) < 7); if (b) { a.banca = b; b.ocupada = a; a.estado = "A_BANCA"; } }
        else if (r < 0.37 && J.burgerAbierto && J.burgerAbierto() && lugares.burger && Math.hypot(lugares.burger.x - a.x, lugares.burger.z - a.z) < 45 && !a.perro) { a.estado = "COMPRA"; }
        else if (r < 0.47) { const otro = buscarCerca(a, 3, (o) => o !== a && o.estado === "CAMINA" && !o.controlado && !o.poli); if (otro) { a.estado = otro.estado = "PLATICA"; a.te = otro.te = rnd(5, 9); a.con = otro; otro.con = a; } }
      }
      break;
    }
    case "PARADO": a.anim.tel = 1; if (a.te < 0) { a.anim.tel = 0; a.estado = "CAMINA"; a.te = rnd(5, 10); } break;
    case "PLATICA": {
      const o = a.con; if (!o || o.estado !== "PLATICA") { a.estado = "CAMINA"; break; }
      a.ry = amortAng(a.ry, Math.atan2(o.x - a.x, o.z - a.z), 5, dt);
      if (Math.random() < dt * 0.25 && a.nivel === 0) { son("charla", a.x, a.z, 1, a.fem); if (Math.random() < 0.3) globito(a, elegir(FRASES.charla), "gente", 2, 2.1 * a.escala); }
      if (a.te < 0) { a.estado = "CAMINA"; o.estado = "CAMINA"; a.con = o.con = null; }
      break;
    }
    case "A_BANCA": {
      const b = a.banca; if (!b) { a.estado = "CAMINA"; break; }
      const sx = b.x + Math.sin(b.ry) * 0.25 + Math.cos(b.ry) * (b.lado || 0), sz = b.z + Math.cos(b.ry) * 0.25;
      const dx = sx - a.x, dz = sz - a.z, d = Math.hypot(dx, dz);
      if (d < 0.3) { a.estado = "SENTADO"; a.te = rnd(10, 25); a.sx = sx; a.sz = sz; } else { mx = dx / d; mz = dz / d; v = 1.1; }
      break;
    }
    case "SENTADO": { const b = a.banca; a.x = amort(a.x, a.sx, 6, dt); a.z = amort(a.z, a.sz, 6, dt); if (b) a.ry = amortAng(a.ry, b.ry, 6, dt); if (a.te < 0) { dejarBanca(a); a.estado = "CAMINA"; volverACamino(a); } break; }
    case "COMPRA": {
      const p = lugares.burger, dx = p.x - a.x, dz = p.z + (a.lado * 2) - a.z, d = Math.hypot(dx, dz);
      if (!J.burgerAbierto()) { a.estado = "CAMINA"; break; }
      if (d < 0.7) { a.estado = "DENTRO"; a.te = rnd(12, 30); a.enBurger = true; J.alEntrarBurger && J.alEntrarBurger(a); }
      else { mx = dx / d; mz = dz / d; v = a.velBase; }
      break;
    }
    case "DENTRO":
      if (a.te < 0 && !J.sismo && !J.ola) {
        const p = a.enBurger ? lugares.burger : a.puerta || { x: a.x, z: a.z };
        a.x = p.x; a.z = p.z; a.estado = "CAMINA"; a.bolsa = !!a.enBurger; a.enBurger = false; a.mojado = 0;
        if (a.bolsa && J.alSalirBurger) J.alSalirBurger(a);
        volverACamino(a);
      }
      break;
    case "MIRA": case "GRABA":
      if (a.mirarA) a.ry = amortAng(a.ry, Math.atan2(a.mirarA.x - a.x, a.mirarA.z - a.z), 5, dt);
      if (a.te < 0) { a.estado = "VUELVE"; if (Math.random() < 0.15 && a.nivel === 0) globito(a, elegir(FRASES.calma), "gente", 2, 2.1 * a.escala); }
      break;
    case "CURIOSO": {
      const m = a.mirarA; if (!m) { a.estado = "VUELVE"; break; }
      const dx = m.x - a.x, dz = m.z - a.z, d = Math.hypot(dx, dz);
      if (d > 7) { mx = dx / d; mz = dz / d; v = 1.0; } else a.ry = amortAng(a.ry, Math.atan2(dx, dz), 4, dt);
      if (a.te < 0) a.estado = "MIRA", a.te = rnd(2, 3);
      break;
    }
    case "MIEDO": if (a.te < 0) { a.estado = "CORRE"; a.te = rnd(2.5, 5); } break;
    case "CORRE": {
      const h = a.huye || { x: Math.sin(a.ry), z: Math.cos(a.ry) };
      mx = h.x; mz = h.z; v = a.tipo === "abuelo" ? 2.6 : rnd(4.4, 5.2);
      if (a.te < 0) { a.estado = "VUELVE"; if (Math.random() < 0.2 && a.nivel === 0) globito(a, elegir(FRASES.calma), "gente", 2, 2.1 * a.escala); }
      break;
    }
    case "REFUGIO": {
      const p = a.puerta; if (!p) { a.estado = "CORRE"; a.te = 3; break; }
      const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
      if (d < 0.8 || a.te < 0) { a.estado = "DENTRO"; a.te = rnd(8, 16); if (a.perro) a.perro.escondido = true; }
      else { mx = dx / d; mz = dz / d; v = 4.2; }
      break;
    }
    case "HERIDO": {
      a.vy -= 16 * dt; a.y += a.vy * dt; a.x += a.vx * dt; a.z += a.vz * dt;
      const piso = alturaSuelo(a.x, a.z, a.y + 0.3);
      if (a.y <= piso) { if (a.vy < -4) polvo(a.x, piso, a.z, 4, 0.6); a.y = piso; a.vy = 0; a.vx *= Math.exp(-8 * dt); a.vz *= Math.exp(-8 * dt); }
      if (a.te < 0) { a.estado = a.caracter === "valiente" ? "VUELVE" : "CORRE"; a.te = rnd(2, 4); a.huye = a.huye || { x: Math.sin(a.ry), z: Math.cos(a.ry) }; }
      break;
    }
    case "VUELVE": volverACamino(a); a.estado = "CAMINA"; break;
    case "ARRASTRADO": case "ATRAPADO": break;   // los mueve el poder o el evento
  }
  // apartarse de los coches que vienen (percepción cada 0.3 s)
  if ((a.chequeo -= dt) < 0 && a.nivel === 0 && ["CAMINA", "PARADO", "MIRA", "GRABA", "PLATICA"].includes(a.estado)) {
    a.chequeo = 0.3;
    for (const c of J.coches) {
      if (c.estado === "fuera" || c.oculto) continue;
      const dx = a.x - c.x, dz = a.z - c.z, d = Math.hypot(dx, dz);
      if (d > 7 || c.vel < 2.5) continue;
      const hacia = (dx * Math.sin(c.ry) + dz * Math.cos(c.ry)) / (d || 1);
      if (hacia > 0.6) { const lado = Math.sign(-dx * Math.cos(c.ry) + dz * Math.sin(c.ry)) || 1; a.esquiva = { x: Math.cos(c.ry) * lado * -1, z: -Math.sin(c.ry) * lado * -1, t: 0.7 }; a.mirarA = { x: c.x, z: c.z }; if (Math.random() < 0.3) globito(a, elegir(FRASES.coche), "gente", 1.6, 2.1 * a.escala); break; }
    }
    // si el héroe pasa volando o brillando cerquita, lo miran
    if (yo && (yo.vuela || J.dios.on) && a.estado === "CAMINA" && Math.hypot(yo.x - a.x, yo.z - a.z) < 12 && Math.random() < 0.08) reaccionar(a, { tipo: yo.vuela ? "vuelo" : "dios", x: yo.x, y: yo.y, z: yo.z, radio: 12, fuerza: 0.3 });
  }
  if (a.esquiva) { mx = a.esquiva.x; mz = a.esquiva.z; v = 3.2; a.esquiva.t -= dt; if (a.esquiva.t < 0) a.esquiva = null; }
  // moverse
  if (a.estado !== "HERIDO") {
    const k = v > 0 ? 6 : 10;
    a.vx = amort(a.vx, mx * v, k, dt); a.vz = amort(a.vz, mz * v, k, dt);
    a.x += a.vx * dt; a.z += a.vz * dt;
    if (a.nivel === 0) { // separarse un poquito de los demás
      rejilla.cerca(a.x, a.z, 0.8, _cerca);
      for (const o of _cerca) { if (o === a || o.estado === "DENTRO") continue; const dx = a.x - o.x, dz = a.z - o.z, d = Math.hypot(dx, dz); if (d > 0 && d < 0.55) { a.x += (dx / d) * (0.55 - d) * 0.5; a.z += (dz / d) * (0.55 - d) * 0.5; } }
      chocarEdificios(a, 0.3, a.y);
    }
    const piso = alturaSuelo(a.x, a.z, a.y + 0.3); a.y = amort(a.y, piso, 18, dt);
  }
  a.vel = Math.hypot(a.vx, a.vz);
  if (a.vel > 0.3 && a.estado !== "HERIDO" && !["MIRA", "GRABA", "PLATICA"].includes(a.estado)) a.ry = amortAng(a.ry, Math.atan2(a.vx, a.vz), 8, dt);
  posePorEstado(a, dt);
}
function posePorEstado(a, dt) {
  const an = a.anim, e = a.estado;
  an.vel = a.vel / (a.escala || 1);
  if (a.vel > 0.2) an.fase += dt * a.vel * (a.vel > 3 ? 2.2 : 3.1) / (a.escala || 1);
  an.sentado = amort(an.sentado, e === "SENTADO" ? 1 : 0, 5, dt);
  an.miedo = amort(an.miedo, e === "MIEDO" || (e === "CORRE" && a.caracter === "miedoso") ? 1 : 0, 8, dt);
  an.agacha = amort(an.agacha, e === "MIEDO" ? 0.6 : 0, 6, dt);
  an.grabar = amort(an.grabar, e === "GRABA" ? 1 : 0, 6, dt);
  an.tel = amort(an.tel, e === "PARADO" || (e === "SENTADO" && a.caracter === "chismoso") ? 1 : 0, 4, dt);
  an.habla = amort(an.habla, e === "PLATICA" ? 1 : 0, 5, dt);
  an.arriba = amort(an.arriba, (e === "MIRA" || e === "GRABA") && a.mirarA && (a.mirarA.y || 0) > 4 ? 1 : a.lunaArriba > 0 ? 1 : 0, 4, dt);
  an.caido = amort(an.caido, e === "HERIDO" && a.y < alturaSuelo(a.x, a.z, a.y) + 0.4 ? 1 : 0, e === "HERIDO" ? 9 : 4, dt);
  an.saluda = amort(an.saluda, a.saludaT > 0 ? 1 : 0, 6, dt); if (a.saludaT > 0) a.saludaT -= dt;
  an.apunta = amort(an.apunta, e === "poli_apunta" ? 1 : 0, 8, dt);
  an.temblor = e === "MIEDO" ? 1 : 0;
  an.mirarY = 0;
  if (a.lunaArriba > 0) a.lunaArriba -= dt;
}
function volverACamino(a) {
  // el nodo de banqueta más cercano
  let mejor = 0, md = 1e9;
  for (let i = 0; i < nodosAcera.length; i++) { const n = nodosAcera[i], d = Math.hypot(n.x - a.x, n.z - a.z); if (d < md) { md = d; mejor = i; } }
  a.nodo = mejor; a.prev = -1; a.te = rnd(4, 9);
}
function buscarCerca(a, r, f) { rejilla.cerca(a.x, a.z, r, _cerca); for (const o of _cerca) if (f(o) && Math.hypot(o.x - a.x, o.z - a.z) < r) return o; return null; }

/* ── los animales ── */
function pensarAnimal(an, dt) {
  an.escudo = Math.max(0, an.escudo - dt); an.feliz = Math.max(0, an.feliz - dt);
  let tx = an.x, tz = an.z, v = 0;
  const d = an.dueno;
  if (d && !d.fuera && d.estado !== "DENTRO" && d.estado !== "ARRASTRADO") {
    tx = d.x - Math.sin(d.ry) * 1.1 + Math.cos(d.ry) * 0.5; tz = d.z - Math.cos(d.ry) * 1.1 - Math.sin(d.ry) * 0.5;
    const dist = Math.hypot(tx - an.x, tz - an.z); v = dist > 0.3 ? Math.min(6, dist * 2.5) : 0;
  } else if (d && d.estado === "DENTRO") { v = 0; }
  else {
    an.te -= dt;
    if (an.te < 0) { an.te = rnd(3, 8); an.estado = Math.random() < 0.4 ? "quieto" : "anda"; an.ry += rnd(-1.2, 1.2); }
    if (an.estado === "anda") { tx = an.x + Math.sin(an.ry); tz = an.z + Math.cos(an.ry); v = an.tipo === "gato" ? 0.8 : 1.2; }
  }
  if (an.sigue) { tx = an.sigue.x - 1; tz = an.sigue.z - 1; const dist = Math.hypot(tx - an.x, tz - an.z); v = dist > 1 ? Math.min(5, dist * 2) : 0; }
  if (v > 0) {
    const dx = tx - an.x, dz = tz - an.z, m = Math.hypot(dx, dz) || 1;
    an.x += (dx / m) * v * dt; an.z += (dz / m) * v * dt;
    an.ry = amortAng(an.ry, Math.atan2(dx, dz), 6, dt);
    const antes = { x: an.x, z: an.z }; chocarEdificios(an, 0.3, 0); if (antes.x !== an.x || antes.z !== an.z) an.ry += Math.PI * 0.5;
  }
  an.vel = v; an.fase += dt * v * 6;
  an.y = alturaSuelo(an.x, an.z, 0.3);
}
/* Acariciar al perrito más cercano (desde la acción contextual). */
export function acariciar(an) {
  an.feliz = 3; an.escudo = Math.max(an.escudo, 1.2);
  son(an.tipo === "perro" ? "ladrido" : "miau", an.x, an.z);
  corazones(an.x, an.y + 0.8, an.z, 6, 1.6);
  globito(an, an.tipo === "perro" ? "¡Guau! 🐶" : "Miau 🐱", "perro", 1.8, 1);
  if ((memo.cuenta.caricias = (memo.cuenta.caricias || 0) + 1) >= 5 && an.tipo === "perro" && !an.dueno) { an.sigue = J.jugador; guardar(); J.misterio && J.misterio("perrito"); }
}
void anunciar; void brillos; void clamp; void ALTURA_CADERA;
