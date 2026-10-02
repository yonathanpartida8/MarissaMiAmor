/*
 * LOS VEHÍCULOS.
 *
 * Modelos hechos de piezas (carrocería con su color, cabina, vidrios,
 * interior oscuro, llantas, faros y calaveras), con suspensión que se
 * mece al frenar y al girar.
 *
 * El tráfico va por las calles (un nodo por cruce). Cada coche:
 *   1. ve lo que tiene enfrente (yo, ella, gente, animales, otros coches);
 *   2. frena;
 *   3. toca el claxon (y otra vez si sigues ahí);
 *   4. si hay lugar, se pasa al otro carril para rodearte.
 *
 * Daño por estados — NORMAL → GOLPEADO → DAÑADO → ARDIENDO → RESTOS →
 * RECUPERANDO → (vuelve a salir como coche nuevo en otro lado). Los golpes
 * abollan de verdad la lámina (se hunden los vértices cerca del golpe), los
 * medianos rompen vidrios y sacan humo, los fuertes prenden fuego y los
 * extremos lo hacen explotar. Nada desaparece de golpe.
 */
import { J, THREE, rnd, elegir, clamp, lerp, amort, amortAng, difAng, anunciar, Juntador, contorno } from "./base.js";
import { nodosCalle, CALLES, chocarEdificios, edificioEn, ACERA_Y } from "./mundo.js";
import { son, bucleEn, motorRpm } from "./audio.js";
import { chispas, humo, fuego, polvo, escombro, onda, destello, brillos } from "./efectos.js";
import { derribar, rejilla } from "./gente.js";
import { E, globito, decir } from "./ui.js";

const PINTURAS = ["#c8384a", "#3a6ac8", "#e8e0d0", "#2a2a3a", "#e0a030", "#4a8a6a", "#8a4ac0", "#7ac8e8", "#f0d060", "#e87a9a"];
const TIPOS = {
  sedan: { L: 4.3, A: 1.8, H: 1.42, cab: [-0.55, 0.85], techo: 1.42, masa: 1.2, pintura: PINTURAS },
  vocho: { L: 3.7, A: 1.65, H: 1.5, cab: [-0.6, 0.6], techo: 1.5, masa: 0.9, redondo: true, pintura: ["#7ac8e8", "#f0d060", "#e87a9a", "#8ad08a", "#f0f0e8"] },
  taxi: { L: 4.3, A: 1.8, H: 1.45, cab: [-0.55, 0.85], techo: 1.45, masa: 1.2, pintura: ["#f2c230"], taxi: true },
  pickup: { L: 4.9, A: 1.95, H: 1.75, cab: [0.1, 1.3], techo: 1.75, masa: 1.6, caja: true, pintura: ["#5a6a7a", "#8a3a2a", "#2a4a3a", "#d8d0c0"] },
  camion: { L: 9.5, A: 2.5, H: 3.1, cab: [-4.4, 4.4], techo: 3.1, masa: 5, autobus: true, pintura: ["#e8a030", "#3a8ab8", "#c84a3a"] },
  patrulla: { L: 4.5, A: 1.85, H: 1.5, cab: [-0.55, 0.85], techo: 1.5, masa: 1.3, pintura: ["#14161e"], poli: true },
};

/* ══════════════════ LOS MODELOS ══════════════════ */
const geoCache = {};
const matVidrio = new THREE.MeshStandardMaterial({ color: "#1a2438", roughness: 0.15, metalness: 0.6, emissive: "#0a0e1a" });
const matVidrioRoto = new THREE.MeshStandardMaterial({ color: "#3a4458", roughness: 0.9, metalness: 0.1 });
const matResto = contorno(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.2 }), "#9a8ac8", 0.3);
const matLuces = new THREE.MeshBasicMaterial({ vertexColors: true });
const matHaz = new THREE.MeshBasicMaterial({ color: "#fff2c8", transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const matQuemado = new THREE.MeshStandardMaterial({ color: "#1c1818", roughness: 1 });
function geometrias(tipo) {
  if (geoCache[tipo]) return geoCache[tipo];
  const T = TIPOS[tipo], L = T.L, A = T.A;
  // la carrocería (lleva el color del coche): un perfil redondeado extruido
  const forma = new THREE.Shape(), h0 = 0.32, h1 = 0.95;
  if (T.redondo) {
    forma.moveTo(-L / 2, h0); forma.quadraticCurveTo(-L / 2 - 0.05, h1, -L / 2 + 0.6, h1 + 0.05); forma.quadraticCurveTo(0, T.techo + 0.05, L / 2 - 0.7, h1 + 0.1); forma.quadraticCurveTo(L / 2 + 0.05, h1, L / 2, h0); forma.lineTo(-L / 2, h0);
  } else if (T.autobus) {
    forma.moveTo(-L / 2, h0); forma.lineTo(-L / 2, T.H - 0.15); forma.quadraticCurveTo(-L / 2, T.H, -L / 2 + 0.2, T.H); forma.lineTo(L / 2 - 0.3, T.H); forma.quadraticCurveTo(L / 2, T.H, L / 2, T.H - 0.4); forma.lineTo(L / 2, h0); forma.lineTo(-L / 2, h0);
  } else {
    forma.moveTo(-L / 2, h0); forma.lineTo(-L / 2, h1 - 0.1); forma.quadraticCurveTo(-L / 2, h1, -L / 2 + 0.25, h1);
    forma.lineTo(L / 2 - 0.35, h1); forma.quadraticCurveTo(L / 2, h1 - 0.05, L / 2, h1 - 0.25); forma.lineTo(L / 2, h0); forma.lineTo(-L / 2, h0);
  }
  const carro = new THREE.ExtrudeGeometry(forma, { depth: A, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 6 });
  carro.translate(0, 0, -A / 2); carro.rotateY(Math.PI / 2);   // largo sobre z (adelante = +z)
  // la cabina (techo y pilares) también va pintada
  if (!T.redondo && !T.autobus) {
    const [c0, c1] = T.cab, cab = new THREE.Shape(), y0 = h1, y1 = T.techo;
    cab.moveTo(c0 - 0.35, y0); cab.lineTo(c0 + 0.1, y1); cab.lineTo(c1 - 0.25, y1); cab.lineTo(c1 + 0.35, y0); cab.lineTo(c0 - 0.35, y0);
    const g = new THREE.ExtrudeGeometry(cab, { depth: A - 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
    g.translate(0, 0, -(A - 0.16) / 2); g.rotateY(Math.PI / 2);
    carro.userData.cab = g;
  }
  const pint = carro.userData.cab ? unir([carro, carro.userData.cab]) : carro;
  pint.computeVertexNormals();
  // el resto: llantas, defensas, interior, rejilla, espejos
  const j = new Juntador(), rueda = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateZ(Math.PI / 2), rin = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10).rotateZ(Math.PI / 2);
  const ejes = T.autobus ? [L / 2 - 1.6, -L / 2 + 1.8] : [L / 2 - 0.85, -L / 2 + 0.85];
  const ruedas = [];
  for (const ez of ejes) for (const s of [-1, 1]) ruedas.push([s * (A / 2 - 0.08), 0.36, ez]);
  j.caja(0, 0.3, L / 2 + 0.02, A - 0.1, 0.18, 0.12, "#2a2a30"); j.caja(0, 0.3, -L / 2 - 0.02, A - 0.1, 0.18, 0.12, "#2a2a30");
  j.caja(0, 0.62, L / 2 + 0.04, A * 0.5, 0.18, 0.04, "#1a1a20");
  j.caja(0, 0.5, 0, A - 0.25, 0.4, L - 0.6, "#18141c");   // el interior oscuro (se ve por los vidrios)
  if (!T.autobus) { j.caja(0, h1 + 0.12, T.cab[1] - 0.2, A - 0.4, 0.06, 0.4, "#0e0c12"); j.caja(0.35, h1 + 0.25, T.cab[1] - 0.5, 0.2, 0.25, 0.04, "#2a2a30"); }   // tablero y volante
  for (const s of [-1, 1]) j.caja(s * (A / 2 + 0.08), h1 + 0.1, T.cab[1] + 0.05, 0.12, 0.08, 0.16, "#1a1a20");
  if (T.caja) { j.caja(0, h1 + 0.2, -L / 2 + 1.1, A - 0.1, 0.4, 0.08, "#3a3a40"); }
  if (T.taxi) { j.caja(0, T.techo + 0.12, 0.1, 0.55, 0.18, 0.25, "#f8f4e8"); }
  if (T.poli) { j.caja(0, T.techo + 0.08, 0.15, 1.1, 0.12, 0.3, "#0a0a10"); }
  if (T.autobus) { for (let k = 0; k < 2; k++) j.caja(-A / 2 - 0.01, 1.4, -1 + k * 4, 0.02, 1.9, 0.95, "#141018"); }
  const resto = j.geometria();
  // los vidrios (laterales, parabrisas y medallón)
  const v = new Juntador();
  if (T.autobus) { for (const s of [-1, 1]) v.caja(s * (A / 2 + 0.005), 2.1, 0, 0.02, 0.9, L - 1.2); v.caja(0, 2, L / 2 + 0.005, A - 0.3, 1.3, 0.02); }
  else if (T.redondo) { for (const s of [-1, 1]) v.caja(s * (A / 2 - 0.04), 1.2, 0, 0.02, 0.36, 1.4); v.caja(0, 1.2, 0.85, A - 0.4, 0.35, 0.02, "#fff", 0); v.caja(0, 1.2, -0.85, A - 0.4, 0.3, 0.02); }
  else { const [c0, c1] = T.cab, ym = (h1 + T.techo) / 2, hh = (T.techo - h1) * 0.7; for (const s of [-1, 1]) v.caja(s * (A / 2 - 0.05), ym + 0.02, (c0 + c1) / 2, 0.02, hh, c1 - c0 + 0.1); v.caja(0, ym, c1 + 0.12, A - 0.3, hh, 0.02); v.caja(0, ym, c0 - 0.12, A - 0.3, hh * 0.9, 0.02); }
  const vidrio = v.geometria();
  // las luces: faros, calaveras y (si es patrulla) torreta
  const l = new Juntador();
  for (const s of [-1, 1]) { l.caja(s * (A / 2 - 0.3), 0.72, L / 2 + 0.05, 0.36, 0.14, 0.04, "#fff4d8"); l.caja(s * (A / 2 - 0.25), 0.72, -L / 2 - 0.05, 0.32, 0.12, 0.04, "#ff2a3a"); }
  const luces = l.geometria();
  geoCache[tipo] = { pint, resto, vidrio, luces, ruedas, rueda, rin };
  return geoCache[tipo];
}
function unir(geos) {
  const j = new Juntador(); for (const g of geos) j.meter(g.index ? g : g, new THREE.Matrix4(), "#ffffff");
  const r = j.geometria(); r.deleteAttribute("color"); return r;
}
const matRueda = new THREE.MeshStandardMaterial({ color: "#121216", roughness: 0.8 });
const matRin = new THREE.MeshStandardMaterial({ color: "#8a8a98", roughness: 0.35, metalness: 0.8 });
const ruedaGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateZ(Math.PI / 2), rinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10).rotateZ(Math.PI / 2);
const hazGeo = (() => { const g = new THREE.ConeGeometry(2.2, 9, 16, 1, true); g.rotateX(-Math.PI / 2); g.translate(0, 0, 4.5); return g; })();
function construirCoche(tipo) {
  const G = geometrias(tipo), T = TIPOS[tipo];
  // el origen del coche es su centro (así gira bien al volar); el modelo cuelga medio alto abajo
  const raiz = new THREE.Group(), piv = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(piv); piv.position.y = -T.H / 2; piv.add(cuerpo);
  const pintura = contorno(new THREE.MeshStandardMaterial({ color: elegir(T.pintura), roughness: 0.32, metalness: 0.45 }), "#c8b8ff", 0.35, 3);
  const geoP = G.pint.clone();   // cada coche tiene su lámina (para abollarla)
  const mP = new THREE.Mesh(geoP, pintura), mR = new THREE.Mesh(G.resto, matResto), mV = new THREE.Mesh(G.vidrio, matVidrio), mL = new THREE.Mesh(G.luces, matLuces);
  for (const m of [mP, mR]) { m.castShadow = J.calidad.sombras; m.receiveShadow = false; }
  cuerpo.add(mP, mR, mV, mL);
  const ruedas = G.ruedas.map(([x, y, z]) => { const r = new THREE.Group(); r.position.set(x, y, z); const a = new THREE.Mesh(ruedaGeo, matRueda), b = new THREE.Mesh(rinGeo, matRin); r.add(a, b); piv.add(r); return r; });
  const haces = [-1, 1].map((s) => { const h = new THREE.Mesh(hazGeo, matHaz); h.position.set(s * (T.A / 2 - 0.3), 0.72, T.L / 2); h.rotation.x = 0.06; cuerpo.add(h); return h; });
  let torreta = null;
  if (T.poli) {
    torreta = [new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.22), new THREE.MeshBasicMaterial({ color: "#ff2030" })), new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.22), new THREE.MeshBasicMaterial({ color: "#2050ff" }))];
    torreta[0].position.set(-0.27, T.techo + 0.18, 0.15); torreta[1].position.set(0.27, T.techo + 0.18, 0.15); cuerpo.add(...torreta);
    const letrero = new THREE.Mesh(new THREE.BoxGeometry(T.A + 0.02, 0.32, 1.6), new THREE.MeshStandardMaterial({ color: "#f2f2f6", roughness: 0.4 })); letrero.position.set(0, 0.68, 0); cuerpo.add(letrero);
  }
  J.escena.add(raiz);
  return { raiz, cuerpo, mP, mV, mL, ruedas, haces, torreta, pintura, geoP, base: G.pint.attributes.position.array.slice() };
}

/* ══════════════════ EL ESTADO DE UN COCHE ══════════════════ */
function nuevoCoche(tipo, o = {}) {
  const T = TIPOS[tipo], m = construirCoche(tipo);
  const c = {
    tipo, T, m, x: 0, y: 0, z: 0, ry: 0, vel: 0, velMax: rnd(9, 13) * (T.autobus ? 0.7 : 1), estado: "maneja",
    // física libre
    vx: 0, vy: 0, vz: 0, q: new THREE.Quaternion(), w: new THREE.Vector3(), suelo: true,
    // daño
    dano: 0, fase: "NORMAL", arde: 0, restos: 0, vidrios: 0, humoT: 0, alfa: 1, alarma: 0,
    // conducción
    desde: 0, hacia: 1, carril: 1, desvio: 0, desvioObj: 0, bloqueado: 0, claxon: 0, mani: null, cabeceo: 0, balanceo: 0, rgiro: 0, conductor: Math.random() < 0.9,
    ...o,
  };
  J.coches.push(c);
  return c;
}
function ponerEnCalle(c, lejosDe = null) {
  for (let k = 0; k < 30; k++) {
    const a = Math.floor(rnd(nodosCalle.length)), b = elegir(nodosCalle[a].vecinos);
    const A = nodosCalle[a], B = nodosCalle[b], u = rnd(0.25, 0.75);
    const x = A.x + (B.x - A.x) * u, z = A.z + (B.z - A.z) * u;
    if (lejosDe && Math.hypot(x - lejosDe.x, z - lejosDe.z) < lejosDe.r) continue;
    if (J.coches.some((o) => o !== c && o.estado !== "fuera" && Math.hypot(o.x - x, o.z - z) < 9)) continue;
    c.desde = a; c.hacia = b;
    const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz);
    c.ry = Math.atan2(dx, dz);
    c.x = x + (dz / L) * -2.8 * -1; c.z = z + (-dx / L) * -2.8 * -1;
    // carril derecho: a la derecha de la dirección
    c.x = x - (dz / L) * 2.8; c.z = z + (dx / L) * 2.8;
    c.vel = c.velMax * 0.6; c.estado = "maneja"; c.mani = null; c.desvio = 0; c.desvioObj = 0;
    return true;
  }
  return false;
}

/* ══════════════════ ARRANCAR ══════════════════ */
export function iniciar() {
  const n = J.calidad.nivel === "alta" ? 14 : J.calidad.nivel === "media" ? 11 : 8;
  const tipos = ["sedan", "sedan", "vocho", "taxi", "pickup", "vocho", "sedan", "camion", "taxi", "sedan", "vocho", "pickup", "sedan", "vocho"];
  for (let i = 0; i < n; i++) { const c = nuevoCoche(tipos[i % tipos.length]); ponerEnCalle(c); }
  // uno estacionado junto al inicio (para subirse)
  const est = nuevoCoche("vocho"); est.estado = "estacionado"; est.x = 27.2; est.z = 13; est.ry = Math.PI; est.y = est.T.H / 2; est.conductor = false; est.vel = 0;
  J.golpearCoches = golpearCoches; J.explotarCoche = explotar; J.cocheEn = cocheEn;
}
export function cocheEn(x, z, r = 2.5) { let m = null, md = 1e9; for (const c of J.coches) { if (c.estado === "fuera" || c.fase === "RESTOS") continue; const d = Math.hypot(c.x - x, c.z - z); if (d < r + c.T.L / 2 && d < md) { md = d; m = c; } } return m; }

/* ══════════════════ MANEJAR (el tráfico) ══════════════════ */
const _c = [];
function manejar(c, dt) {
  const A = nodosCalle[c.desde], B = nodosCalle[c.hacia];
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const rx = -uz, rz = ux;   // derecha del sentido de la calle (hacia donde va el carril)
  // ¿qué tan lejos va en el tramo?
  const s = (c.x - A.x) * ux + (c.z - A.z) * uz;
  // obstáculos enfrente: yo, ella, gente, animales y coches
  const fx = Math.sin(c.ry), fz = Math.cos(c.ry), vision = 6 + c.vel * 1.2;
  let freno = 1e9, quien = null;
  const mirar = (o, r = 0.9, tipo) => {
    const ox = o.x - c.x, oz = o.z - c.z, adelante = ox * fx + oz * fz, lado = Math.abs(-ox * fz + oz * fx);
    if (adelante > c.T.L / 2 - 0.3 && adelante < vision && lado < c.T.A / 2 + r) { const d = adelante - c.T.L / 2; if (d < freno) { freno = d; quien = tipo; } }
  };
  const yo = J.jugador; if (!yo.coche && yo.y < 2) mirar(yo, 0.9, "yo");
  mirar(J.novia, 0.9, "gente");
  rejilla.cerca(c.x + fx * 6, c.z + fz * 6, 8, _c);
  for (const a of _c) if (a.estado !== "DENTRO" && a.y < 1) mirar(a, 0.7, "gente");
  for (const an of J.animales) if (Math.abs(an.x - c.x) < 12 && Math.abs(an.z - c.z) < 12) mirar(an, 0.6, "animal");
  for (const o of J.coches) if (o !== c && o.estado !== "fuera" && Math.abs(o.x - c.x) < 16 && Math.abs(o.z - c.z) < 16) { const mismo = Math.cos(difAng(o.ry, c.ry)) > 0.3 || o.estado !== "maneja"; if (mismo) mirar(o, o.T.A / 2, "coche"); }
  // velocidad: frenar con suavidad hasta detenerse a 1.5 m
  let vObj = c.velMax * (c.panico > 0 ? 1.5 : 1);
  if (c.mani) vObj = Math.min(vObj, 6.5);
  if (freno < 1e8) vObj = Math.min(vObj, Math.max(0, (freno - 1.5) * 1.6));
  const frena = vObj < c.vel - 0.5;
  c.vel = amort(c.vel, vObj, frena ? 5 : 1.4, dt);
  c.cabeceo = amort(c.cabeceo, frena ? 0.035 : c.vel < vObj - 1 ? -0.02 : 0, 6, dt);
  if (c.panico > 0) c.panico -= dt;
  // bloqueado: claxon y, si se puede, rodear por el otro carril
  if (freno < 3 && c.vel < 0.6 && quien !== "coche") {
    c.bloqueado += dt;
    if (c.bloqueado > 0.7 && c.claxon <= 0) { son("claxon", c.x, c.z); c.claxon = c.bloqueado > 4 ? 1.6 : 3; if (quien === "yo" && Math.random() < 0.5) globito(c, elegir(["¡Muévete, joven!", "¡Piii! ¡Quítate!", "¿Qué haces ahí parado?", "¡Oiga!"]), "gente", 2, 2.1); }
    if (c.bloqueado > 2.2 && !c.mani) {
      const libre = !J.coches.some((o) => o !== c && o.estado !== "fuera" && Math.abs((o.x - c.x) * rx + (o.z - c.z) * rz + 5.6) < 2.5 && Math.abs((o.x - c.x) * fx + (o.z - c.z) * fz) < 14);
      if (libre) { c.desvioObj = -5.6; c.rodeando = 3.5; }
    }
  } else c.bloqueado = 0;
  if (c.claxon > 0) c.claxon -= dt;
  if (c.rodeando > 0) { c.rodeando -= dt * (c.vel > 1 ? 1 : 0.3); if (c.rodeando <= 0) c.desvioObj = 0; }
  if (c.desvioObj < 0 && freno > 6 && c.bloqueado === 0) vObj = Math.min(vObj, 5);
  c.desvio = amort(c.desvio, c.desvioObj, 1.6, dt);
  // seguir el carril (o la vuelta en el cruce)
  let tx, tz;
  if (c.mani) {
    const m = c.mani; m.u = Math.min(1, m.u + c.vel * dt / m.largo);
    const u = m.u, a = (1 - u) * (1 - u), b2 = 2 * u * (1 - u), d2 = u * u;
    tx = a * m.p0.x + b2 * m.p1.x + d2 * m.p2.x; tz = a * m.p0.z + b2 * m.p1.z + d2 * m.p2.z;
    const nx = tx - c.x, nz = tz - c.z;
    if (Math.hypot(nx, nz) > 0.01) c.ry = amortAng(c.ry, Math.atan2(nx, nz), 10, dt);
    c.x = tx; c.z = tz;
    if (u >= 1) { c.desde = m.desde; c.hacia = m.hacia; c.mani = null; }
  } else {
    const lane = 2.8 + c.desvio;
    const adel = s + Math.max(3, c.vel * 0.6);
    tx = A.x + ux * adel + rx * lane; tz = A.z + uz * adel + rz * lane;
    const ang = Math.atan2(tx - c.x, tz - c.z);
    const giro = difAng(ang, c.ry);
    c.ry = amortAng(c.ry, ang, 3.5, dt);
    c.rgiro = giro;
    c.x += Math.sin(c.ry) * c.vel * dt; c.z += Math.cos(c.ry) * c.vel * dt;
    // al llegar al cruce, escoger para dónde y trazar la vuelta
    if (s > L - 9 && c.desvio > -1) {
      const op = B.vecinos.filter((q) => q !== c.desde); const nxt = op.length ? elegir(op) : c.desde;
      const C2 = nodosCalle[nxt], ex = C2.x - B.x, ez = C2.z - B.z, el = Math.hypot(ex, ez), eux = ex / el, euz = ez / el, erx = -euz, erz = eux;
      const p0 = { x: c.x, z: c.z }, p2 = { x: B.x + eux * 9 + erx * 2.8, z: B.z + euz * 9 + erz * 2.8 };
      // el punto de control: donde se cruzan las dos líneas de carril
      const p1 = { x: B.x + rx * 2.8 + erx * 2.8 - (Math.abs(ux * eux + uz * euz) > 0.9 ? 0 : 0), z: B.z + rz * 2.8 + erz * 2.8 };
      if (Math.abs(ux * eux + uz * euz) > 0.9) { p1.x = (p0.x + p2.x) / 2; p1.z = (p0.z + p2.z) / 2; }
      c.mani = { p0, p1, p2, u: 0, largo: Math.hypot(p1.x - p0.x, p1.z - p0.z) + Math.hypot(p2.x - p1.x, p2.z - p1.z), desde: c.hacia, hacia: nxt };
    }
  }
  c.y = c.T.H / 2;
  c.balanceo = amort(c.balanceo, clamp(-c.rgiro * c.vel * 0.02, -0.06, 0.06), 5, dt);
  // los coches lejos de todo se reciclan en una calle cerca
  const d = Math.hypot(c.x - yo.x, c.z - yo.z);
  if (d > 120) ponerEnCalle(c, { x: yo.x, z: yo.z, r: 50 });
}

/* ══════════════════ FÍSICA LIBRE ══════════════════ */
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _e = new THREE.Euler(), arriba = new THREE.Vector3(0, 1, 0);
function fisica(c, dt) {
  // cae, gira, rebota y se arrastra
  c.vy -= 18 * dt;
  c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
  const w = c.w, ang = w.length();
  if (ang > 1e-4) { _q.setFromAxisAngle(_v.copy(w).divideScalar(ang), ang * dt); c.q.premultiply(_q); }
  const piso = 0;
  // ¿qué tan bajo está su punto más bajo? (aprox: la mitad de su alto girado)
  _v.set(0, 1, 0).applyQuaternion(c.q);
  const alto = 0.5 * (Math.abs(_v.y) * c.T.H + (1 - Math.abs(_v.y)) * c.T.A * 0.9);
  if (c.y - alto < piso) {
    const vImp = -c.vy;
    c.y = alto + piso;
    if (vImp > 2) { impacto(c, vImp + Math.hypot(c.vx, c.vz) * 0.2, c.x, c.y - alto, c.z); c.vy = vImp > 6 ? vImp * 0.25 : 0; } else c.vy = 0;
    // fricción y tendencia a quedar sobre las llantas (o de lado / de techo)
    const k = Math.exp(-2.6 * dt); c.vx *= k; c.vz *= k; c.w.multiplyScalar(Math.exp(-4 * dt));
    _e.setFromQuaternion(c.q, "YXZ");
    const rx = Math.round(_e.x / (Math.PI / 2)) * (Math.PI / 2), rz = Math.round(_e.z / (Math.PI / 2)) * (Math.PI / 2);
    _e.x = amort(_e.x, Math.abs(rx) > 2 ? Math.sign(rx) * Math.PI : rx, 3, dt); _e.z = amort(_e.z, Math.abs(rz) > 2 ? Math.sign(rz) * Math.PI : rz, 3, dt);
    c.q.setFromEuler(_e);
    c.suelo = true;
  } else c.suelo = false;
  // paredes
  const antes = { x: c.x, z: c.z };
  if (chocarEdificios(c, c.T.A * 0.55, c.y)) {
    const v = Math.hypot(c.vx, c.vz); if (v > 3) impacto(c, v, c.x, c.y, c.z);
    const nx = c.x - antes.x, nz = c.z - antes.z, nm = Math.hypot(nx, nz) || 1;
    const dot = (c.vx * nx + c.vz * nz) / nm; if (dot < 0) { c.vx -= 1.4 * dot * nx / nm; c.vz -= 1.4 * dot * nz / nm; }
  }
  c.x = clamp(c.x, -150, 150); c.z = clamp(c.z, -150, 150);
  _e.setFromQuaternion(c.q, "YXZ"); c.ry = _e.y;
  // cuando se queda quieto y sano, vuelve a la calle a manejar
  if (c.suelo && Math.hypot(c.vx, c.vz) < 0.4 && c.w.length() < 0.2 && c.fase !== "ARDIENDO" && c.fase !== "RESTOS" && c.fase !== "RECUPERANDO") {
    c.quieto = (c.quieto || 0) + dt;
    _e.setFromQuaternion(c.q, "YXZ");
    const derecho = Math.abs(_e.x) < 0.2 && Math.abs(_e.z) < 0.2;
    if (c.quieto > 3 && derecho && c.dano < 0.55 && c.conductor && !J.sismo && !J.ola && !c.poli) { c.estado = "maneja"; c.q.identity(); retomarCalle(c); }
    else if (c.quieto > 3 && !derecho && c.fase === "NORMAL") c.fase = "GOLPEADO";
  } else c.quieto = 0;
}
function retomarCalle(c) {
  // la calle más cercana y su sentido
  let mejor = null, md = 1e9;
  for (let a = 0; a < nodosCalle.length; a++) for (const b of nodosCalle[a].vecinos) {
    const A = nodosCalle[a], B = nodosCalle[b], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz);
    const u = clamp(((c.x - A.x) * dx + (c.z - A.z) * dz) / (L * L), 0.05, 0.85);
    const px = A.x + dx * u - (dz / L) * 2.8, pz = A.z + dz * u + (dx / L) * 2.8;
    const d = Math.hypot(px - c.x, pz - c.z) + Math.abs(difAng(Math.atan2(dx, dz), c.ry)) * 2;
    if (d < md) { md = d; mejor = { a, b }; }
  }
  if (mejor) { c.desde = mejor.a; c.hacia = mejor.b; c.vel = 0; c.mani = null; c.desvio = 0; c.desvioObj = 0; }
}
/* Pasa a física libre (lo agarré, lo chocaron, lo aventó una explosión…). */
export function soltarFisica(c) {
  if (c.estado === "fisica") return;
  if (c.estado === "maneja") { c.vx = Math.sin(c.ry) * c.vel; c.vz = Math.cos(c.ry) * c.vel; }
  c.estado = "fisica"; c.q.setFromAxisAngle(arriba, c.ry); c.vy = c.vy || 0; c.suelo = true;
}

/* ══════════════════ EL DAÑO ══════════════════ */
const _l = new THREE.Vector3(), _m = new THREE.Matrix4();
function impacto(c, v, x, y, z) {
  if (c.fase === "RESTOS" || c.fase === "RECUPERANDO" || c.estado === "fuera") return;
  const k = v / 12;   // 1 = golpe fuerte
  if (k < 0.12) return;
  son(k > 0.4 ? "chapa" : "golpe", x, z, clamp(k, 0.2, 1.2));
  chispas(x, y + 0.4, z, Math.round(4 + k * 14), 4 + k * 5);
  if (k > 0.25) polvo(x, Math.max(0.1, y), z, Math.round(3 + k * 5), 0.6 + k * 0.5);
  abollar(c, x, y, z, clamp(0.08 + k * 0.22, 0, 0.42), 0.8 + k * 0.8);
  c.dano = Math.min(1.2, c.dano + k * 0.32 / c.T.masa);
  J.temblor = Math.max(J.temblor || 0, clamp(k * 0.35, 0, 0.6) * clamp(1 - Math.hypot(x - J.jugador.x, z - J.jugador.z) / 60, 0, 1));
  if (k > 0.45 && c.vidrios < 2) { c.vidrios++; c.m.mV.material = matVidrioRoto; son("vidrio", x, z); brillos(x, y + 1, z, 10, "azul", 0.6, 3); }
  if (k > 0.3 && c.conductor && c.estado !== "conducido" && Math.random() < 0.5) sacarConductor(c);
  if (k > 0.4) { c.alarma = 4; son("alarma", c.x, c.z); }
  if (c.fase === "NORMAL" && c.dano > 0.15) c.fase = "GOLPEADO";
  if (c.dano > 0.5 && c.fase !== "ARDIENDO") c.fase = "DAÑADO";
  J.caos += k * 4;
  if (k > 0.35) anunciar({ tipo: "choque", x, z, radio: 18 + k * 10, fuerza: k });
  if (k > 1.25 || c.dano >= 1) setTimeout(() => explotar(c), 60);
  else if (k > 0.9 && c.fase !== "ARDIENDO" && Math.random() < 0.5) { c.fase = "ARDIENDO"; c.arde = rnd(6, 9); }
}
function abollar(c, x, y, z, hondo, radio) {
  // pasar el punto del golpe a coordenadas del coche y hundir la lámina cerca
  c.m.cuerpo.updateMatrixWorld(true);
  _m.copy(c.m.cuerpo.matrixWorld).invert();
  _l.set(x, y + 0.5, z).applyMatrix4(_m);
  const p = c.m.geoP.attributes.position, a = p.array;
  // hacia dónde hundir: hacia el centro del coche
  for (let i = 0; i < p.count; i++) {
    const vx = a[i * 3], vy = a[i * 3 + 1], vz = a[i * 3 + 2];
    const d = Math.hypot(vx - _l.x, vy - _l.y, vz - _l.z);
    if (d > radio) continue;
    const f = hondo * (1 - d / radio) ** 2, cx = -vx, cy = 0.8 - vy, cz = -vz * 0.3, m = Math.hypot(cx, cy, cz) || 1;
    a[i * 3] += (cx / m) * f; a[i * 3 + 1] += (cy / m) * f * 0.6; a[i * 3 + 2] += (cz / m) * f;
  }
  p.needsUpdate = true; c.m.geoP.computeVertexNormals();
  // la pintura se opaca y se raya un poco
  c.m.pintura.roughness = Math.min(0.85, c.m.pintura.roughness + hondo * 0.6);
}
export function explotar(c) {
  if (c.fase === "ARDIENDO" && c.exploto || c.fase === "RESTOS" || c.fase === "RECUPERANDO" || c.estado === "fuera") return;
  c.exploto = true; c.fase = "ARDIENDO"; c.arde = rnd(6, 9); c.dano = 1.2;
  if (c === J.agarrado) J.soltarAgarre && J.soltarAgarre();
  if (c.estado === "conducido") bajarDelCoche(true);
  soltarFisica(c);
  c.vy = rnd(5, 8); c.w.set(rnd(-2, 2), rnd(-1, 1), rnd(-2, 2)); c.vx += rnd(-2, 2); c.vz += rnd(-2, 2);
  c.m.pintura.color.multiplyScalar(0.25); c.m.pintura.roughness = 1; c.m.pintura.metalness = 0;
  c.m.mV.material = matVidrioRoto; c.m.mL.visible = false; for (const h of c.m.haces) h.visible = false;
  abollar(c, c.x, c.y + 1, c.z, 0.3, 2.5);
  J.explosion && J.explosion(c.x, c.y + 0.8, c.z, 1.1, c);
  escombro(c.x, c.y + 1, c.z, 14, c.m.pintura.color.getStyle(), 9, 0.35);
  if (c.poli) globito(c, "¡Mi patrulla! 😭", "poli", 2.4, 2.4);
}
/* Golpes de mi puño / poder sobre los coches. */
export function golpearCoches(h) {
  let pego = false;
  for (const c of J.coches) {
    if (c.estado === "fuera" || c.fase === "RECUPERANDO") continue;
    const dx = c.x - h.x, dz = c.z - h.z, d = Math.hypot(dx, dz);
    if (d > h.r + c.T.L / 2) continue;
    if (!h.circular && Math.abs(difAng(Math.atan2(c.x - h.de.x, c.z - h.de.z), h.dir)) > 1.2 && d > c.T.L / 2) continue;
    const m = d || 1, f = h.k * (J.dios.on ? 8 : 2.2) / c.T.masa;
    soltarFisica(c);
    c.vx += (dx / m) * f; c.vz += (dz / m) * f; c.vy += f * (J.dios.on ? 0.55 : 0.2);
    c.w.add(_v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(f * 0.25));
    impacto(c, h.k * (J.dios.on ? 11 : 5), h.x, h.y - 0.5, h.z);
    pego = true;
  }
  return pego;
}
function sacarConductor(c) {
  if (!c.conductor) return;
  c.conductor = false;
  const p = J.crearPersona && J.crearPersona({ x: c.x - Math.cos(c.ry) * 1.6, z: c.z + Math.sin(c.ry) * 1.6, estado: "CORRE", te: rnd(3, 5) });
  if (p) { p.huye = { x: -Math.cos(c.ry), z: Math.sin(c.ry) }; p.y = 0; if (c.poli) { p.poli = true; } else globito(p, elegir(["¡Mi coche!", "¡Oiga, ese es mío!", "¡Apenas lo terminé de pagar!", "¡Mi carrito!"]), "gente", 2.2, 2.1); son("grito", p.x, p.z, 1, p.fem); }
}

/* ══════════════════ SUBIRSE Y MANEJAR ══════════════════ */
export function subirAlCoche(c) {
  const yo = J.jugador;
  if (c.conductor) sacarConductor(c);
  if (c.estado === "fisica") { c.q.setFromAxisAngle(arriba, c.ry); c.y = c.T.H / 2; }
  c.estado = "conducido"; c.vel = 0; yo.coche = c; c.mani = null;
  son("puerta", c.x, c.z); bucleEn("motor", 0.08, c.x, c.z);
  decir(elegir(["¡Vámonos, amor! 🚗", "Súbete… ah, no, tú espérame aquí 😅"]), "yo");
}
export function bajarDelCoche(rapido = false) {
  const yo = J.jugador, c = yo.coche; if (!c) return;
  yo.coche = null; if (!rapido) son("puerta", c.x, c.z);
  bucleEn("motor", 0);
  yo.x = c.x - Math.cos(c.ry) * 1.7; yo.z = c.z + Math.sin(c.ry) * 1.7; yo.y = 0.2; yo.vx = yo.vz = 0;
  if (c.estado === "conducido") { c.estado = "estacionado"; c.vel = 0; }
}
function conducir(c, dt) {
  const [fx, fz] = [-Math.sin(J.camYaw || 0), -Math.cos(J.camYaw || 0)], rx = -fz, rz = fx;
  const dx = rx * E.mx - fx * E.mz, dz = rz * E.mx - fz * E.mz, m = Math.min(1, Math.hypot(dx, dz));
  let gas = 0;
  if (m > 0.15) {
    const quiere = Math.atan2(dx, dz), dif = difAng(quiere, c.ry);
    if (Math.abs(dif) < 2.2) { gas = m; c.ry += clamp(dif, -1, 1) * dt * 2.2 * clamp(Math.abs(c.vel) / 4, 0.25, 1); }
    else { gas = -m * 0.6; c.ry -= clamp(dif, -1, 1) * dt * 1.5 * clamp(Math.abs(c.vel) / 4, 0.2, 1); }
  }
  const vmax = E.correr ? 22 : 16;
  c.vel = amort(c.vel, gas * vmax, gas ? 1.2 : 2.5, dt);
  c.x += Math.sin(c.ry) * c.vel * dt; c.z += Math.cos(c.ry) * c.vel * dt;
  const antes = { x: c.x, z: c.z };
  if (chocarEdificios(c, c.T.A * 0.55, 0)) { if (Math.abs(c.vel) > 5) impacto(c, Math.abs(c.vel) * 0.8, antes.x + Math.sin(c.ry) * 2, 0.5, antes.z + Math.cos(c.ry) * 2); c.vel *= -0.3; }
  c.x = clamp(c.x, -79, 79); c.z = clamp(c.z, -79, 79); c.y = c.T.H / 2;
  c.cabeceo = amort(c.cabeceo, gas < 0 && c.vel > 0 ? 0.04 : -gas * 0.025, 6, dt);
  c.balanceo = amort(c.balanceo, clamp(-difAng(Math.atan2(dx, dz), c.ry) * Math.abs(c.vel) * 0.012, -0.07, 0.07), 5, dt);
  motorRpm(clamp(Math.abs(c.vel) / vmax, 0, 1)); bucleEn("motor", 0.08 + Math.abs(c.vel) / vmax * 0.06, c.x, c.z);
  // atropellar NO: la gente se quita (y si no alcanza, sólo se cae)
  rejilla.cerca(c.x, c.z, 4, _c);
  for (const a of _c) { const d = Math.hypot(a.x - c.x, a.z - c.z); if (d < 1.6 && a.estado !== "HERIDO" && a.estado !== "DENTRO") { derribar(a, (a.x - c.x) / (d || 1), (a.z - c.z) / (d || 1), 0.6); c.vel *= 0.6; } }
  if (E.saltar || E.golpe) { /* claxon */ son("claxon", c.x, c.z); }
}

/* ══════════════════ CADA CUADRO ══════════════════ */
export function actualizar(dt, dtReal) {
  const yo = J.jugador;
  for (let i = J.coches.length - 1; i >= 0; i--) {
    const c = J.coches[i];
    if (c.estado === "fuera") { J.escena.remove(c.m.raiz); c.m.geoP.dispose(); c.m.pintura.dispose(); J.coches.splice(i, 1); continue; }
    if (dt > 0) {
      if (c.estado === "maneja") manejar(c, dt);
      else if (c.estado === "fisica") fisica(c, dt);
      else if (c.estado === "conducido") conducir(c, dtReal);
      else if (c.estado === "agarrado" || c.estado === "estacionado" || c.estado === "controlado") { /* lo mueve alguien más / no se mueve */ }
      // choques entre coches
      if (c.estado === "fisica" || c.estado === "conducido" || c.estado === "agarrado") for (const o of J.coches) {
        if (o === c || o.estado === "fuera" || o.fase === "RECUPERANDO") continue;
        const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), r = (c.T.A + o.T.A) * 0.5 + 0.35;
        if (d > Math.max(c.T.L, o.T.L) || Math.abs(o.y - c.y) > 2.2) continue;
        // dos círculos por coche (adelante y atrás) contra el centro del otro
        let cerca = d < r;
        for (const s of [-1, 1]) { const px = c.x + Math.sin(c.ry) * s * c.T.L * 0.3, pz = c.z + Math.cos(c.ry) * s * c.T.L * 0.3; if (Math.hypot(o.x - px, o.z - pz) < r) cerca = true; }
        if (!cerca) continue;
        const vrel = Math.hypot((c.vx || Math.sin(c.ry) * c.vel) - (o.vx || 0), (c.vz || Math.cos(c.ry) * c.vel) - (o.vz || 0));
        const nx = dx / (d || 1), nz = dz / (d || 1), empuje = (r - Math.min(d, r)) * 0.5 + 0.02;
        if (o.estado !== "agarrado") { soltarFisica(o); o.x += nx * empuje; o.z += nz * empuje; o.vx += nx * vrel * 0.55 * c.T.masa / o.T.masa; o.vz += nz * vrel * 0.55 * c.T.masa / o.T.masa; o.w.y += rnd(-1, 1) * vrel * 0.08; }
        if (c.estado === "fisica") { c.vx -= nx * vrel * 0.35; c.vz -= nz * vrel * 0.35; }
        if (c.estado === "conducido") c.vel *= 0.5;
        if (vrel > 3) { impacto(o, vrel, (c.x + o.x) / 2, Math.max(c.y, o.y), (c.z + o.z) / 2); impacto(c, vrel * 0.8, (c.x + o.x) / 2, Math.max(c.y, o.y), (c.z + o.z) / 2); }
      }
      // los coches que vuelan golpean a la gente (se caen y se levantan)
      if (c.estado === "fisica" && Math.hypot(c.vx, c.vy, c.vz) > 5) {
        rejilla.cerca(c.x, c.z, c.T.L, _c);
        for (const a of _c) { const d = Math.hypot(a.x - c.x, a.z - c.z); if (d < c.T.L / 2 + 0.5 && Math.abs(a.y + 1 - c.y) < 1.8 && a.estado !== "HERIDO") derribar(a, (a.x - c.x) / (d || 1), (a.z - c.z) / (d || 1), 1); }
        if (Math.hypot(J.novia.x - c.x, J.novia.z - c.z) < c.T.L) anunciar({ tipo: "coche_vuela", x: c.x, z: c.z, radio: 12, fuerza: 1 });
      }
      danoPorFase(c, dt);
    }
    pintar(c, dtReal);
  }
}
function danoPorFase(c, dt) {
  if (c.alarma > 0) c.alarma -= dt;
  if (c.fase === "DAÑADO" || (c.fase === "GOLPEADO" && c.dano > 0.35)) { c.humoT -= dt; if (c.humoT < 0) { c.humoT = 0.35 - c.dano * 0.15; humo(c.x + Math.sin(c.ry) * c.T.L * 0.35, c.y + 1, c.z + Math.cos(c.ry) * c.T.L * 0.35, 1, 0.7 + c.dano * 0.5, c.dano > 0.6); } }
  if (c.fase === "ARDIENDO") {
    c.arde -= dt;
    if (Math.random() < dt * 22) fuego(c.x + rnd(-c.T.L / 3, c.T.L / 3), c.y + c.T.H * 0.6, c.z + rnd(-0.5, 0.5), 1, 1 + c.T.masa * 0.1);
    if (Math.random() < dt * 8) humo(c.x, c.y + c.T.H + 0.5, c.z, 1, 1.4, true);
    if (Math.random() < dt * 2) destello(c.x, c.y + 1.5, c.z, 4, "#ff8a3a", 0.6);
    if (c.arde < 0) { c.fase = "RESTOS"; c.restos = rnd(5, 8); }
  } else if (c.fase === "RESTOS") {
    c.restos -= dt;
    if (Math.random() < dt * 3) humo(c.x, c.y + c.T.H, c.z, 1, 1, false);
    if (c.restos < 0) { c.fase = "RECUPERANDO"; c.alfa = 1; for (const m of [c.m.mP.material, matResto]) m.transparent = true; }
  } else if (c.fase === "RECUPERANDO") {
    c.alfa -= dt / 2.5;
    c.m.raiz.traverse((o) => { if (o.material && o.material !== matHaz) { if (!o.userData.propio) { o.material = o.material.clone(); o.userData.propio = true; } o.material.transparent = true; o.material.opacity = Math.max(0, c.alfa); } });
    if (c.alfa <= 0) {
      // RESTAURADO: sale un coche nuevo, en otra calle, lejos de la vista
      c.estado = "fuera";
      const n = nuevoCoche(elegir(["sedan", "vocho", "taxi", "pickup"])); ponerEnCalle(n, { x: J.jugador.x, z: J.jugador.z, r: 55 });
    }
  }
}
const _pq = new THREE.Quaternion(), _pe = new THREE.Euler();
function pintar(c, dt) {
  const r = c.m.raiz;
  r.position.set(c.x, c.y, c.z);
  if (c.estado === "fisica" || c.estado === "agarrado") r.quaternion.copy(c.q);
  else { _pe.set(0, c.ry, 0); r.quaternion.setFromEuler(_pe); }
  // suspensión: cabeceo al frenar, balanceo al girar
  c.m.cuerpo.rotation.set(c.cabeceo, 0, c.balanceo);
  c.m.cuerpo.position.y = Math.sin(J.t * 9 + c.x) * 0.006 * clamp(c.vel / 8, 0, 1);
  const giro = (c.estado === "fisica" ? Math.hypot(c.vx, c.vz) : c.vel) * dt / 0.36;
  for (const w of c.m.ruedas) w.children[0].rotation.x += giro, w.children[1].rotation.x += giro;
  if (c.m.torreta) { const on = Math.sin(J.t * 14) > 0; c.m.torreta[0].material.color.set(on ? "#ff2030" : "#3a0810"); c.m.torreta[1].material.color.set(on ? "#0a1240" : "#2a60ff"); }
  const lejos = Math.hypot(c.x - J.jugador.x, c.z - J.jugador.z) > 60;
  for (const h of c.m.haces) h.visible = !lejos && c.fase !== "ARDIENDO" && c.fase !== "RESTOS" && (c.estado === "maneja" || c.estado === "conducido" || c.poli);
  c.m.raiz.visible = Math.hypot(c.x - J.camara.position.x, c.z - J.camara.position.z) < J.calidad.lejos * 0.6;
}
void lerp; void onda; void edificioEn; void CALLES; void ACERA_Y;

/* Para los eventos: un coche nuevo (la patrulla) y devolver uno al tráfico. */
export function crearCoche(tipo, o = {}) { const c = nuevoCoche(tipo, o); c.y = c.T.H / 2; return c; }
export function aLaCalle(c) { c.estado = "maneja"; c.q.identity(); retomarCalle(c); }
