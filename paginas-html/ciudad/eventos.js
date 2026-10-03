/*
 * LOS EVENTOS DE LA CIUDAD — un director que decide qué pasa y cuándo.
 *
 * Grandes (sólo uno a la vez, por prioridad): la luna que se rompe (5),
 * el portal (4), el ovni (3). La policía y los helicópteros dependen del
 * caos que haga con el Modo Dios. Los pequeños (estrellas fugaces, la
 * tormenta, las grietas del suelo) pasan cuando no estorban.
 *
 * Y los misterios: cada cosa rara que se descubre queda guardada.
 */
import { J, THREE, rnd, elegir, clamp, lerp, amort, amortAng, anunciar, oir, memo, guardar, contar, aPantalla, lienzo, textura, brillo, contorno, toon, capaEfectos, TAU } from "./base.js";
import { son, bucleEn } from "./audio.js";
import * as fx from "./efectos.js";
import { decir, decirYa, globito, aviso, contador, enVivo, abrirTarjeta, anilloLuna } from "./ui.js";
import { luna, nodosCalle, alturaSuelo, edificioEn, CALLES } from "./mundo.js";
import { crearCoche, aLaCalle } from "./vehiculos.js";
import { decirElla, lineaElla, recibirGolpe } from "./jugador.js";

/* ══════════════════ LOS MISTERIOS ══════════════════ */
export const MISTERIOS = {
  luna: ["🌙", "La luna se rompió… y se volvió a armar sola", "Dos dedos sobre la luna, quietitos…"],
  ovni: ["🛸", "Hay un ovni paseando sobre la ciudad", "Mira al cielo de vez en cuando"],
  abduccion: ["👽", "Se llevaron a alguien… y lo devolvieron", "Sigue al ovni cuando aparezca"],
  ovniRayo: ["⚡", "Le diste al ovni con un rayo", "¿Y si le avientas un rayo?"],
  portal: ["🌀", "Un portal verde se abrió en la calle", "Muy, muy raro… sólo hay que esperar"],
  estrella: ["🌠", "Una estrella fugaz cruzó el cielo", "Quédate un rato mirando arriba"],
  escudo: ["🛡️", "Los animalitos siempre quedan a salvo", "¿Qué pasa con los perritos si hay peligro?"],
  perrito: ["🐶", "Un perrito ahora nos sigue", "Acaricia mucho a los perritos"],
  hidrante: ["⛲", "Una fuente improvisada", "Algo rojo en la banqueta…"],
  surf: ["🏄", "Alguien surfeó el tsunami", "Hay gente muy valiente…"],
  tiempo: ["⏳", "El tiempo se detuvo un ratito", "Un poder escondido"],
  audifonos: ["🎧", "El señor de los audífonos no se entera de nada", "Hay alguien que nunca voltea"],
  kdrama: ["📺", "La parejita del K-drama… como nosotros", "La ventana del principio"],
  burger: ["🍔", "Angelos Burger, nuestro restaurante favorito", "Entra a cenar con ella"],
  policia: ["🚓", "«¡Jamás! ¡Quiero impresionar a mi novia!»", "Haz muuucho caos con el Modo Dios"],
  noticias: ["📡", "Saliste en las noticias", "Que te vean desde el cielo"],
  tormenta: ["⛈️", "Una tormenta de verdad", "A veces la noche cambia sola"],
  ventanas: ["🪟", "Las 83 ventanas encendidas", "Toca las ventanas que tienen escena"],
  heli: ["🚁", "Tumbaste un helicóptero (nadie salió herido)", "Algo que vuela demasiado cerca…"],
  abrazo: ["🤍", "Un abrazo en medio de la ciudad", "Acércate a ella y abrázala"],
};
function misterio(id) {
  if (!MISTERIOS[id] || memo.misterios[id]) return;
  memo.misterios[id] = Date.now(); guardar();
  const [ico, txt] = MISTERIOS[id];
  aviso(`📜 Misterio: ${ico} ${txt}`); son("ding");
  contador("#nMis", Object.keys(memo.misterios).length);
}
function abrirMisterios() {
  const ids = Object.keys(MISTERIOS), n = ids.filter((k) => memo.misterios[k]).length;
  abrirTarjeta(`<h2>📜 Misterios de la ciudad</h2><p>${n} de ${ids.length} descubiertos</p><ul>${ids.map((k) => { const [ico, txt, pista] = MISTERIOS[k]; return memo.misterios[k] ? `<li class="si">${ico} ${txt}</li>` : `<li>❓ <small>${pista}</small></li>`; }).join("")}</ul><button data-cerrar>Seguir paseando</button>`);
}

/* ══════════════════ PIEZAS COMPARTIDAS ══════════════════ */
const _p = { x: 0, y: 0, visible: true }, _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const cielo = new THREE.Group();   // lo que vive "en el cielo" sigue a la cámara (como la luna)

/* ── trazos de bala: segmentos que brillan un instante ── */
const MAXT = 24;
let trazos, trazoPos, trazoCol; const trazoVida = new Float32Array(MAXT);
function armarTrazos() {
  const g = new THREE.BufferGeometry(); trazoPos = new Float32Array(MAXT * 6); trazoCol = new Float32Array(MAXT * 6);
  g.setAttribute("position", new THREE.BufferAttribute(trazoPos, 3)); g.setAttribute("color", new THREE.BufferAttribute(trazoCol, 3));
  trazos = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  trazos.frustumCulled = false; J.escena.add(capaEfectos(trazos));
}
let trazoI = 0;
function trazo(a, b) {
  const i = trazoI++ % MAXT; trazoVida[i] = 0.12;
  trazoPos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
}
function pintarTrazos(dt) {
  for (let i = 0; i < MAXT; i++) {
    if (trazoVida[i] > 0) trazoVida[i] -= dt;
    const k = Math.max(0, trazoVida[i] / 0.12);
    trazoCol.set([1 * k, 0.85 * k, 0.5 * k, 0.6 * k, 0.4 * k, 0.2 * k], i * 6);
  }
  trazos.geometry.attributes.position.needsUpdate = true; trazos.geometry.attributes.color.needsUpdate = true;
}

/* ── grietas en el suelo (terremoto, meteoritos) ── */
const MAXG = 24, grietas = [];
let grietaMalla;
function armarGrietas() {
  const [c, x] = lienzo(256, 256);
  x.strokeStyle = "rgba(10,6,14,.95)"; x.lineCap = "round";
  for (let r = 0; r < 7; r++) {
    let px = 128, py = 128, a = r / 7 * TAU + rnd(-0.3, 0.3); x.lineWidth = 7;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 9; k++) { a += rnd(-0.5, 0.5); px += Math.cos(a) * 13; py += Math.sin(a) * 13; x.lineTo(px, py); x.lineWidth = Math.max(1, 7 - k * 0.7); }
    x.stroke();
  }
  x.strokeStyle = "rgba(255,120,60,.35)"; x.lineWidth = 1.5; x.beginPath(); x.arc(128, 128, 10, 0, TAU); x.stroke();
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  grietaMalla = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: textura(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), MAXG);
  grietaMalla.count = 0; grietaMalla.frustumCulled = false; grietaMalla.renderOrder = 1; J.escena.add(grietaMalla);
}
function grieta(x, z, grande = false) {
  if (grietas.length >= MAXG) grietas.shift();
  grietas.push({ x, z, y: alturaSuelo(x, z, 1) + 0.02, tam: grande ? rnd(7, 9) : rnd(3.5, 6), ry: rnd(TAU), t: 0, dur: rnd(16, 24) });
  fx.polvo(x, 0.1, z, 6, 1.2);
}
function pintarGrietas(dt) {
  let n = 0;
  for (let i = grietas.length - 1; i >= 0; i--) { const g = grietas[i]; g.t += dt; if (g.t > g.dur) grietas.splice(i, 1); }
  for (const g of grietas) {
    const k = Math.min(1, g.t / 0.4) * Math.min(1, (g.dur - g.t) / 3);
    _q.setFromAxisAngle(_v.set(0, 1, 0), g.ry);
    _m.compose(_v.set(g.x, g.y, g.z), _q, _s.set(g.tam * k, 1, g.tam * k));
    grietaMalla.setMatrixAt(n++, _m);
  }
  grietaMalla.count = n; grietaMalla.instanceMatrix.needsUpdate = true;
}

/* ══════════════════ LA POLICÍA ══════════════════ */
const patrullas = [];   // { c, ruta, i, fase, polis: [], t }
J._patrullas = patrullas;
let porPatrulla = 0, sinCaos = 0, dichoRindete = false;
function nodoCercano(x, z) { let m = 0, md = 1e9; nodosCalle.forEach((n, i) => { const d = Math.hypot(n.x - x, n.z - z); if (d < md) { md = d; m = i; } }); return m; }
function ruta(desde, hasta) {   // BFS en la rejilla de calles
  const prev = new Map([[desde, -1]]), cola = [desde];
  while (cola.length) { const a = cola.shift(); if (a === hasta) break; for (const b of nodosCalle[a].vecinos) if (!prev.has(b)) { prev.set(b, a); cola.push(b); } }
  const r = []; let k = hasta; while (k !== -1 && k != null) { r.unshift(k); k = prev.get(k); }
  return r;
}
function llamarPatrulla() {
  const yo = J.jugador, meta = nodoCercano(yo.x, yo.z);
  const opciones = nodosCalle.map((n, i) => i).filter((i) => { const d = Math.hypot(nodosCalle[i].x - yo.x, nodosCalle[i].z - yo.z); return d > 45 && d < 110; });
  if (!opciones.length) return;
  const ini = elegir(opciones), r = ruta(ini, meta);
  if (r.length < 2) return;
  const c = crearCoche("patrulla", { poli: true, estado: "controlado", conductor: true });
  const A = nodosCalle[r[0]], B = nodosCalle[r[1]], L = Math.hypot(B.x - A.x, B.z - A.z);
  c.ry = Math.atan2(B.x - A.x, B.z - A.z); c.x = A.x - (B.z - A.z) / L * 2.8; c.z = A.z + (B.x - A.x) / L * 2.8; c.vel = 12;
  patrullas.push({ c, ruta: r, i: 1, fase: "llega", polis: [], t: 0 });
  if (contar("patrullas") === 1) setTimeout(() => decirElla("Amor… ¿esa es una sirena? 😳"), 1200);
}
function manejarPatrulla(p, dt) {
  const c = p.c, yo = J.jugador;
  if (c.estado === "fuera" || c.fase === "ARDIENDO" || c.fase === "RESTOS" || c.estado === "fisica" || c.estado === "agarrado") {
    // le pasó algo a la patrulla: los policías corren
    for (const a of p.polis) { a.controlado = false; a.estado = "CORRE"; a.te = rnd(3, 5); a.huye = { x: a.x - yo.x, z: a.z - yo.z }; const m = Math.hypot(a.huye.x, a.huye.z) || 1; a.huye.x /= m; a.huye.z /= m; }
    if (p.polis.length && Math.random() < 0.6) globito(p.polis[0], elegir(["¡Retirada! 😱", "¡Esto no viene en el manual!", "¡Pidan refuerzos! 😭"]), "poli", 2.2, 2.2);
    p.polis = []; p.fase = "perdida"; return;
  }
  bucleEn("sirena", 0.06, c.x, c.z);
  if (p.fase === "llega") {
    const ultimo = p.i >= p.ruta.length - 1;
    let tx, tz;
    if (p.final) { tx = p.final.x; tz = p.final.z; }
    else {
      const n = nodosCalle[p.ruta[p.i]], prev = nodosCalle[p.ruta[p.i - 1]];
      const L = Math.hypot(n.x - prev.x, n.z - prev.z) || 1, rx = -(n.z - prev.z) / L, rz = (n.x - prev.x) / L;
      tx = n.x + rx * 2.8; tz = n.z + rz * 2.8;
      if (ultimo && Math.hypot(tx - c.x, tz - c.z) < 5) {
        // del último cruce, al punto de la calle más cercano a mí
        let mejor = null, md = 1e9;
        for (const v of n.vecinos) { const B = nodosCalle[v], ux = (B.x - n.x) / 48, uz = (B.z - n.z) / 48, t = clamp((yo.x - n.x) * ux + (yo.z - n.z) * uz, 4, 40), px = n.x + ux * t - uz * 2.8, pz = n.z + uz * t + ux * 2.8, dd = Math.hypot(px - yo.x, pz - yo.z); if (dd < md) { md = dd; mejor = { x: px, z: pz }; } }
        p.final = mejor;
      }
    }
    const d = Math.hypot(tx - c.x, tz - c.z), dyo = Math.hypot(yo.x - c.x, yo.z - c.z);
    let vObj = dyo < 22 ? Math.max(0, (dyo - 10) * 1.2) : d < 8 && !ultimo ? 7 : 15;
    if (ultimo || p.final) vObj = Math.min(vObj, Math.max(0, d - 0.5) * 1.4);
    c.vel = amort(c.vel, vObj, vObj < c.vel ? 4 : 1.5, dt);
    c.ry = amortAng(c.ry, Math.atan2(tx - c.x, tz - c.z), 4, dt);
    c.x += Math.sin(c.ry) * c.vel * dt; c.z += Math.cos(c.ry) * c.vel * dt;
    if (d < 3 && !ultimo) p.i++;
    if ((dyo < 14 || (p.final && d < 1.5)) && c.vel < 1.5) {
      p.fase = "parada"; c.vel = 0; son("frenazo", c.x, c.z); son("puerta", c.x, c.z);
      for (const s of [-1, 1]) {
        const a = J.crearPersona({ poli: true, controlado: true, estado: "poli_apunta", fem: Math.random() < 0.3, caracter: "valiente", x: c.x + Math.cos(c.ry) * s * 1.6, z: c.z - Math.sin(c.ry) * s * 1.6 });
        a.y = alturaSuelo(a.x, a.z, 0.5); a.disparo = rnd(1.5, 2.5); p.polis.push(a);
      }
      if (!dichoRindete) {
        dichoRindete = true;
        globito(p.polis[0], "¡Ríndete!", "poli", 2.2, 2.3);
        setTimeout(() => decirYa("¡Ríndete! ¡Estás rodeado!", "poli", 2400), 200);
        setTimeout(() => { if (J.dios.on) { decirYa("¡Jamás! ¡Quiero impresionar a mi novia!", "dios", 3200); globito(J.jugador, "¡Jamás! 😤", "dios", 2, 2.3); misterio("policia"); } }, 2700);
        setTimeout(() => { if (J.dios.on) { globito(J.novia, "Ay, amor… 🙈", "ella", 2.4, 2.1); } }, 6000);
      }
    }
  } else if (p.fase === "parada") {
    for (const a of p.polis) {
      if (a.estado === "HERIDO" || a.fuera) continue;
      a.estado = "poli_apunta"; a.controlado = true; a.vel = 0;
      a.ry = amortAng(a.ry, Math.atan2(yo.x - a.x, yo.z - a.z), 6, dt);
      // disparan sólo si el héroe brilla (sin Modo Dios no hay a quién dispararle)
      if (J.dios.on && (a.disparo -= dt) < 0 && Math.hypot(yo.x - a.x, yo.z - a.z) < 34) {
        a.disparo = rnd(0.7, 1.5);
        const boca = { x: a.x + Math.sin(a.ry) * 0.6, y: a.y + 1.35, z: a.z + Math.cos(a.ry) * 0.6 };
        const dest = { x: yo.x + rnd(-0.3, 0.3), y: yo.y + rnd(0.8, 1.7), z: yo.z + rnd(-0.3, 0.3) };
        trazo(boca, dest); son("disparo", a.x, a.z, 0.7);
        fx.chispas(boca.x, boca.y, boca.z, 3, 3, "fuego2");
        anunciar({ tipo: "balas", x: a.x, z: a.z, radio: 20, fuerza: 0.6 });
        setTimeout(() => {   // la bala rebota en el héroe
          const ang = rnd(TAU), reb = { x: dest.x + Math.cos(ang) * 6, y: dest.y + rnd(-1, 3), z: dest.z + Math.sin(ang) * 6 };
          trazo(dest, reb); son("rebote", dest.x, dest.z); fx.chispas(dest.x, dest.y, dest.z, 6, 5, "oro");
          if (!J.dios.on) recibirGolpe(Math.sin(a.ry), Math.cos(a.ry), 0.3);
          if (contar("rebotes") === 4) globito(a, elegir(["¡Las balas le rebotan! 😳", "¿De qué está hecho este tipo?"]), "poli", 2.2, 2.3);
        }, 60);
      }
    }
  } else if (p.fase === "se_va") {
    // los policías regresan a la patrulla y se van
    let todos = true;
    for (const a of p.polis) {
      if (a.fuera) continue;
      const dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz);
      if (d < 1.2) { a.fuera = true; continue; }
      todos = false; a.estado = "VUELVE_P"; a.controlado = true; a.vel = 1.6; a.ry = amortAng(a.ry, Math.atan2(dx, dz), 8, dt);
      a.x += (dx / d) * 1.6 * dt; a.z += (dz / d) * 1.6 * dt;
    }
    p.t += dt;
    if (todos || p.t > 12) { for (const a of p.polis) a.fuera = true; p.polis = []; aLaCalle(c); c.velMax = 9; p.fase = "fin"; son("puerta", c.x, c.z); }
  }
}
function retirarPolicia(confundidos) {
  for (const p of patrullas) if (p.fase === "parada" || p.fase === "llega") {
    p.fase = "se_va"; p.t = 0;
    if (confundidos && p.polis[0]) globito(p.polis[0], elegir(["¿Y el héroe? Juraría que estaba aquí… 🤔", "Se nos peló… 😑", "¿Era él? No, ese es un muchacho normal…"]), "poli", 2.6, 2.3);
    else if (p.polis[0]) globito(p.polis[0], elegir(["Ya se calmó todo… vámonos.", "Mejor me regreso a la estación 😮‍💨"]), "poli", 2.4, 2.3);
  }
}
function actualizarPolicia(dt) {
  const est = Math.ceil(J.caos / 30), quiero = J.dios.on && est >= 2 ? Math.min(3, est - 1) : 0;
  const activas = patrullas.filter((p) => p.fase === "llega" || p.fase === "parada").length;
  porPatrulla -= dt;
  if (quiero > activas && porPatrulla <= 0) { porPatrulla = 7; llamarPatrulla(); }
  if (quiero === 0 && activas) { sinCaos += dt; if (sinCaos > 6) { sinCaos = 0; retirarPolicia(!J.dios.on); } } else sinCaos = 0;
  if (est >= 3 && J.dios.on && !helis.some((h) => h.tipo === "policia" && h.fase !== "se_va")) llamarHeli("policia");
  if (est >= 4 && J.dios.on && !helis.some((h) => h.tipo === "noticias" && h.fase !== "se_va")) llamarHeli("noticias");
  for (let i = patrullas.length - 1; i >= 0; i--) {
    const p = patrullas[i]; manejarPatrulla(p, dt);
    if (p.fase === "fin" || p.fase === "perdida") patrullas.splice(i, 1);
  }
  if (!patrullas.some((p) => p.fase !== "fin")) bucleEn("sirena", 0);
}

/* ══════════════════ LOS HELICÓPTEROS ══════════════════ */
const helis = [];
const focos = [];   // dos reflectores de verdad (helicópteros / ovni)
let luzPortal = null;
function armarLucesEventos() {
  for (let i = 0; i < 2; i++) { const l = new THREE.SpotLight("#eef2ff", 0, 90, 0.2, 0.55, 1.3); l.castShadow = false; J.escena.add(l, l.target); focos.push({ l, de: null }); }
  luzPortal = new THREE.PointLight("#7aff6a", 0, 18, 1.6); J.escena.add(luzPortal);
}
function pedirFoco(de) { const f = focos.find((q) => q.de === de) || focos.find((q) => !q.de); if (f) f.de = de; return f ? f.l : null; }
function soltarFoco(de) { for (const f of focos) if (f.de === de) { f.de = null; f.l.intensity = 0; } }
function modeloHeli(tipo) {
  const g = new THREE.Group(), poli = tipo === "policia";
  const col = poli ? "#1f3270" : "#c8304a", col2 = "#f2f0f6";
  const mat = contorno(toon({ color: col }), "#c8c0ff", 0.4), mat2 = toon({ color: col2 }), oscuro = toon({ color: "#22222c" }), metal = toon({ color: "#8a8c98" });
  const vidrioM = toon({ color: "#6a9ad0", emissive: "#14243e", transparent: true, opacity: 0.88 });
  // el cuerpo: una gota redondita, más ancha adelante
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 2.0, 8, 18).rotateX(Math.PI / 2), mat); cuerpo.scale.set(1, 0.95, 1); g.add(cuerpo);
  const vidrio = new THREE.Mesh(new THREE.SphereGeometry(1.06, 20, 12, 0, TAU, 0, Math.PI * 0.55).rotateX(Math.PI / 2.3), vidrioM); vidrio.position.set(0, 0.22, 1.25); g.add(vidrio);
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(1.115, 1.115, 1.4, 20, 1, true).rotateX(Math.PI / 2), mat2); franja.scale.set(1, 0.42, 1); franja.position.set(0, -0.32, -0.2); g.add(franja);
  // el letrero de cada lado (POLICÍA / CANAL 7)
  const [lc, lx] = lienzo(256, 64); lx.fillStyle = poli ? "#f2f0f6" : "#ffe9a8"; lx.font = "bold 40px system-ui, sans-serif"; lx.textAlign = "center"; lx.textBaseline = "middle"; lx.fillText(poli ? "POLICÍA" : "CANAL 7 📡", 128, 34);
  const letreroM = new THREE.MeshBasicMaterial({ map: textura(lc), transparent: true, depthWrite: false });
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), letreroM); l.position.set(sx * 1.13, 0.12, -0.45); l.rotation.y = sx * Math.PI / 2; g.add(l); }
  // el motor arriba y el mástil
  const motor = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 4, 10).rotateX(Math.PI / 2), mat); motor.position.set(0, 1.0, -0.5); g.add(motor);
  const toma = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 10), oscuro); toma.rotation.x = Math.PI / 2; toma.position.set(0, 1.0, -1.35); g.add(toma);
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8), metal); mastil.position.set(0, 1.4, 0); g.add(mastil);
  // la cola: un tubo que se adelgaza, con su aleta y su estabilizador
  const cola = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 4.4, 12).rotateX(Math.PI / 2), mat); cola.position.set(0, 0.32, -3.5); g.add(cola);
  const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.25, 0.75), mat2); aleta.position.set(0, 0.85, -5.6); aleta.rotation.x = -0.25; g.add(aleta);
  const estab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.45), mat2); estab.position.set(0, 0.32, -4.9); g.add(estab);
  // patines con sus soportes
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8).rotateX(Math.PI / 2), oscuro); p.position.set(s * 0.95, -1.42, 0.15); g.add(p);
    const punta = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 10, Math.PI / 2), oscuro); punta.rotation.y = s > 0 ? -Math.PI / 2 : -Math.PI / 2; punta.position.set(s * 0.95, -1.2, 1.85); g.add(punta);
    for (const z of [0.75, -0.55]) { const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 6), oscuro); pata.position.set(s * 0.82, -1.15, z); pata.rotation.z = s * 0.35; g.add(pata); }
  }
  // el rotor: aspas que giran y, encima, un disco «borroso» como en los dibujos
  const rotor = new THREE.Group(); rotor.position.y = 1.62; g.add(rotor);
  const cubo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), metal); rotor.add(cubo);
  const aspaG = new THREE.BoxGeometry(5, 0.045, 0.3).translate(2.5, 0, 0);
  for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(aspaG, oscuro); a.rotation.y = i * Math.PI / 2; a.rotation.x = 0.05; rotor.add(a); }
  const discoM = new THREE.MeshBasicMaterial({ map: brillo([[0, "rgba(40,40,52,0)"], [0.25, "rgba(40,40,52,.06)"], [0.92, "rgba(40,40,52,.16)"], [1, "rgba(40,40,52,0)"]], 128), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const disco = new THREE.Mesh(new THREE.CircleGeometry(5.05, 48).rotateX(-Math.PI / 2), discoM); disco.position.y = 1.64; g.add(disco);
  const rotorC = new THREE.Group(); rotorC.position.set(0.18, 0.95, -5.6); g.add(rotorC);
  for (let i = 0; i < 2; i++) { const ac = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.5, 0.14), oscuro); ac.rotation.x = i * Math.PI / 2; rotorC.add(ac); }
  // lucecitas de navegación (brillan de verdad con el resplandor)
  const nav = (c, x, y, z) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(3) })); l.position.set(x, y, z); g.add(l); return l; };
  nav("#ff3040", 1.05, -0.5, 0.6); nav("#40ff70", -1.05, -0.5, 0.6);
  const luzR = nav(poli ? "#ff3040" : "#ffffff", 0, -1.12, -1);
  const luzA = poli ? nav("#3a6aff", 0, 1.32, -1.25) : null;
  // el reflector: la lámpara y un haz suave (la luz que pinta el suelo es un SpotLight de verdad)
  const lampara = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 10), oscuro); lampara.position.set(0, -1.25, 1.1); g.add(lampara);
  const cono = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 4.2, 1, 24, 1, true).translate(0, -0.5, 0), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(poli ? "#dfe8ff" : "#fff0d0") }, uA: { value: 0 } },
    vertexShader: "varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 uC; uniform float uA; varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(vN, vV)); float a = uA * f * f * (0.25 + 0.75 * vU.y); gl_FragColor = vec4(uC * a, a); }",
  }));
  cono.frustumCulled = false;
  J.escena.add(g, capaEfectos(cono));
  for (const o of [cuerpo, motor, cola, aleta]) o.castShadow = J.calidad.sombras;
  return { g, rotor, rotorC, luzR, luzA, cono, mat, disco };
}
function llamarHeli(tipo) {
  if (helis.some((h) => h.tipo === tipo)) return;
  const yo = J.jugador, a = rnd(TAU), m = modeloHeli(tipo);
  const h = { tipo, m, x: yo.x + Math.cos(a) * 140, y: 34, z: yo.z + Math.sin(a) * 140, ry: 0, ang: a, fase: "llega", t: 0, dano: 0, vx: 0, vz: 0, calma: 0 };
  helis.push(h);
  if (tipo === "noticias") setTimeout(() => { if (helis.includes(h)) { enVivo(true); misterio("noticias"); decir("¿Eso es… un helicóptero de las noticias? 📡 Salude, amor 😅", "yo"); } }, 5000);
}
function actualizarHelis(dt) {
  const yo = J.jugador;
  let volHeli = 0, hx = 0, hz = 0;
  for (let i = helis.length - 1; i >= 0; i--) {
    const h = helis[i]; h.t += dt;
    const est = Math.ceil(J.caos / 30);
    if (h.fase !== "se_va" && h.fase !== "cae" && (!J.dios.on || est < 2)) { h.calma += dt; if (h.calma > 10) { h.fase = "se_va"; if (h.tipo === "noticias") enVivo(false); } } else h.calma = 0;
    let tx, ty, tz;
    if (h.fase === "llega" || h.fase === "orbita") {
      h.ang += dt * (h.tipo === "policia" ? 0.25 : -0.18);
      const r = h.tipo === "policia" ? 22 : 30; tx = yo.x + Math.cos(h.ang) * r; tz = yo.z + Math.sin(h.ang) * r; ty = Math.max(30, yo.y + 16);
      if (h.fase === "llega" && Math.hypot(tx - h.x, tz - h.z) < 10) h.fase = "orbita";
    } else if (h.fase === "se_va") { tx = h.x + Math.cos(h.ang) * 100; tz = h.z + Math.sin(h.ang) * 100; ty = 50; if (Math.hypot(h.x - yo.x, h.z - yo.z) > 170) { quitarHeli(h); helis.splice(i, 1); continue; } }
    else if (h.fase === "cae") {
      // cae girando, echando humo y fuego… y se estrella (y explota)
      h.vy = (h.vy || 0) - 7 * dt; h.y += h.vy * dt; h.ry += dt * (3 + h.t * 0.4);
      h.x += h.vx * dt; h.z += h.vz * dt; h.vx *= 1 - dt * 0.3; h.vz *= 1 - dt * 0.3;
      if (Math.random() < dt * 30) fx.humo(h.x, h.y, h.z, 1, 1.5, true);
      if (Math.random() < dt * 20) fx.fuego(h.x, h.y - 0.3, h.z, 1, 1.1);
      const e = edificioEn(h.x, h.z), piso = e ? e.h : alturaSuelo(h.x, h.z, h.y);
      if (h.y - 1.3 <= piso) { estrellarHeli(h, piso); helis.splice(i, 1); continue; }
    }
    if (h.fase !== "cae") {
      const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz), v = Math.min(18, d * 0.8);
      h.vx = amort(h.vx, d > 0.1 ? dx / d * v : 0, 1.2, dt); h.vz = amort(h.vz, d > 0.1 ? dz / d * v : 0, 1.2, dt);
      h.x += h.vx * dt; h.z += h.vz * dt; h.y = amort(h.y, ty, 0.8, dt);
      const haciaYo = Math.atan2(yo.x - h.x, yo.z - h.z), haciaVa = Math.atan2(h.vx, h.vz);
      h.ry = amortAng(h.ry, h.fase === "orbita" ? haciaYo : haciaVa, 1.5, dt);
    }
    if (h.dano > 0 && Math.random() < dt * 8) fx.humo(h.x, h.y, h.z, 1, 1.2, true);
    // ¿le pegó un coche volador?
    for (const c of J.coches) if (c.estado === "fisica" && Math.hypot(c.x - h.x, c.y - h.y, c.z - h.z) < 4 && h.fase !== "cae") { derribarHeli(h); son("chapa", h.x, h.z); fx.chispas(h.x, h.y, h.z, 20, 8); c.vx *= -0.3; c.vz *= -0.3; }
    const m = h.m, sp = Math.hypot(h.vx, h.vz);
    m.g.position.set(h.x, h.y + Math.sin(h.t * 1.3) * 0.25, h.z);
    m.g.rotation.set(clamp(sp * 0.02, 0, 0.25), h.ry, Math.sin(h.t * 0.9) * 0.04);
    m.rotor.rotation.y += dt * 28; m.rotorC.rotation.x += dt * 40; m.disco.rotation.y -= dt * 3;
    m.luzR.visible = Math.sin(h.t * 6) > 0.6; if (m.luzA) m.luzA.visible = Math.sin(h.t * 6 + 2.4) > 0.6;
    // el reflector apunta al héroe (el de noticias también, para la toma)
    const piso = Math.max(0, yo.y);
    const ax = h.x, ay = h.y - 1.4, az = h.z, bx = yo.x + Math.sin(h.t * 0.7) * 0.8, bz = yo.z + Math.cos(h.t * 0.6) * 0.8;
    const L = Math.hypot(bx - ax, piso - ay, bz - az);
    h.foco = amort(h.foco || 0, h.fase === "orbita" ? 1 : 0, 2, dt);
    m.cono.visible = h.foco > 0.02; m.cono.material.uniforms.uA.value = h.foco * 0.12;
    m.cono.position.set(ax, ay, az); m.cono.scale.set(1, L, 1);
    m.cono.quaternion.setFromUnitVectors(_v.set(0, -1, 0), new THREE.Vector3(bx - ax, piso - ay, bz - az).normalize());
    const lf = h.foco > 0.02 ? pedirFoco(h) : (soltarFoco(h), null);
    if (lf) { lf.position.set(ax, ay, az); lf.target.position.set(bx, alturaSuelo(bx, bz, piso + 1), bz); lf.color.set(h.tipo === "policia" ? "#e6ecff" : "#fff0d6"); lf.intensity = h.foco * 260; lf.distance = L + 30; lf.angle = Math.atan(4.4 / L); }
    const d = Math.hypot(h.x - yo.x, h.z - yo.z);
    if (1 - d / 160 > volHeli) { volHeli = Math.max(0, 1 - d / 160); hx = h.x; hz = h.z; }
  }
  bucleEn("heli", volHeli * 0.12, hx, hz);
}
/* Un golpe a los helicópteros (rayos, explosiones, coches aventados, un puñetazo en el aire). */
function golpearHelis(x, y, z, r, k = 1) {
  let pego = false;
  for (const h of helis) {
    if (h.fase === "cae" || h.fase === "se_va") continue;
    const d = Math.hypot(h.x - x, h.y - y, h.z - z);
    if (d > r + 3) continue;
    pego = true;
    h.dano += 0.45 + k * 0.5 * (1 - d / (r + 3));
    fx.chispas(h.x, h.y, h.z, 16, 8); fx.humo(h.x, h.y, h.z, 3, 1.3, true); son("chapa", h.x, h.z);
    if (h.dano >= 1) derribarHeli(h);
    else if (Math.random() < 0.6) globito(h, elegir(["¡Nos dieron!", "¡Estabilicen!", "¡Ay, mi helicóptero nuevo!"]), "poli", 1.8, 2);
  }
  return pego;
}
function derribarHeli(h) {
  if (h.fase === "cae") return;
  h.fase = "cae"; h.dano = 1; h.vy = 1.5; h.vx += rnd(-3, 3); h.vz += rnd(-3, 3);
  globito(h, h.tipo === "noticias" ? "¡Se cae la transmisión! 😱" : "¡Mayday, mayday! 😱", "poli", 2.4, 2);
  son("alarma", h.x, h.z); J.caos += 18;
  if (h.tipo === "noticias") setTimeout(() => enVivo(false), 900);
}
function estrellarHeli(h, piso) {
  J.explosion && J.explosion(h.x, piso + 0.8, h.z, 1.6);
  fx.escombro(h.x, piso + 1.2, h.z, 18, h.tipo === "policia" ? "#1f3270" : "#c8304a", 10, 0.35);
  fx.escombro(h.x, piso + 1.2, h.z, 8, "#22222c", 8, 0.5);
  quitarHeli(h);
  if (h.tipo === "noticias") enVivo(false);
  if (!memo.misterios.heli) setTimeout(() => decirElla("¡¿Tumbaste un helicóptero?! 😳"), 900);
  misterio("heli");
}
function quitarHeli(h) { for (const o of [h.m.g, h.m.cono]) J.escena.remove(o); soltarFoco(h); }
/* ══════════════════ EL OVNI ══════════════════ */
let ovni = null;
function modeloOvni() {
  const g = new THREE.Group();
  const metal = contorno(toon({ color: "#a8aec6" }), "#b8fff0", 0.6);
  const disco = new THREE.Mesh(new THREE.SphereGeometry(4, 36, 14), metal); disco.scale.set(1, 0.24, 1); g.add(disco);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(4.05, 0.22, 8, 48).rotateX(Math.PI / 2), toon({ color: "#5e6680" })); g.add(aro);
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 12, 0, TAU, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: "#8affd8", transparent: true, opacity: 0.55, emissive: "#2a8a6a", emissiveIntensity: 0.9, gradientMap: metal.gradientMap })); cupula.position.y = 0.6; g.add(cupula);
  const ojos = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), toon({ color: "#7ae07a", emissive: "#2a7a2a" })); ojos.position.y = 0.8; g.add(ojos);   // el piloto 👽
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: "#0a0a12" })); o.scale.set(1, 1.5, 0.6); o.position.set(s * 0.24, 0.95, 0.6); g.add(o); }
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#b8fff0").multiplyScalar(2.2) })); fondo.position.y = -0.95; g.add(fondo);
  const luces = [], cols = ["#ff5ab0", "#5affd0", "#ffe25a", "#5a9aff"];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(cols[i % 4]).multiplyScalar(2.6) })); l.position.set(Math.cos(a) * 3.55, 0.05, Math.sin(a) * 3.55); g.add(l); luces.push(l); }
  // el rayo tractor
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3.4, 1, 28, 1, true).translate(0, -0.5, 0), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform float uT, uA; varying vec2 vU; void main(){ float b = 0.55+0.45*sin(vU.y*40.0+uT*9.0); float s = 0.6+0.4*sin(vU.x*60.0-uT*3.0); gl_FragColor = vec4(vec3(0.55,1.0,0.85)*b*s, uA*0.22*(0.4+0.6*vU.y)); }",
  }));
  J.escena.add(g, capaEfectos(haz));
  return { g, luces, haz };
}
function llamarOvni(forzado) {
  if (ovni) { if (forzado) { ovni.fase = "pasea"; ovni.t = 0; } return; }
  const yo = J.jugador, a = rnd(TAU);
  ovni = { m: modeloOvni(), x: yo.x + Math.cos(a) * 150, y: 60, z: yo.z + Math.sin(a) * 150, vx: 0, vz: 0, fase: "llega", t: 0, meta: null, victima: null, haz: 0, giro: 0, visto: false, dur: rnd(60, 90) };
  bucleEn("ovni", 0);
  if (forzado) decir("Ven, amiguito… 🛸", "dios");
}
function actualizarOvni(dt) {
  const o = ovni; if (!o) return;
  const yo = J.jugador; o.t += dt; o.dur -= dt;
  let tx = o.x, ty = o.y, tz = o.z, vel = 10;
  const metaCerca = () => ({ x: yo.x + rnd(-35, 35), z: yo.z + rnd(-35, 35) });
  switch (o.fase) {
    case "llega": tx = yo.x + 20; tz = yo.z - 10; ty = 34; vel = 30; if (Math.hypot(tx - o.x, tz - o.z) < 12) { o.fase = "pasea"; o.t = 0; o.meta = metaCerca(); } break;
    case "pasea":
      tx = o.meta.x; tz = o.meta.z; ty = 30 + Math.sin(o.t * 0.5) * 3; vel = 7;
      if (Math.hypot(tx - o.x, tz - o.z) < 3) {
        o.meta = metaCerca();
        const r = Math.random();
        if (r < 0.35) { o.fase = "escanea"; o.t = 0; }
        else if (r < 0.6 && !memo.cuenta.abducidos || r < 0.42) { const v = J.gente.filter((a) => a.ver && a.estado === "CAMINA" && !a.poli && !a.controlado && !a.perro && Math.hypot(a.x - yo.x, a.z - yo.z) > 8 && Math.hypot(a.x - yo.x, a.z - yo.z) < 45)[0]; if (v) { o.fase = "abduce"; o.t = 0; o.victima = v; v.controlado = true; v.estado = "ATRAPADO"; } }
        else if (r < 0.72 && J.novia && !J.dios.on && Math.hypot(J.novia.x - yo.x, J.novia.z - yo.z) < 5) { o.fase = "corazon"; o.t = 0; }
      }
      if (yo.vuela && Math.hypot(yo.x - o.x, yo.y - o.y, yo.z - o.z) < 12) { o.fase = "huye"; o.t = 0; globito(o, "👽❗", "gente", 1.6, -1); son("ovni", o.x, o.z); }
      if (o.dur < 0) { o.fase = "se_va"; o.t = 0; }
      break;
    case "escanea": {
      tx = o.x; tz = o.z; ty = 22; vel = 4; o.haz = 1;
      if (o.t > 6) { o.fase = "pasea"; o.t = 0; o.haz = 0; }
      // si escanea a la pareja y estoy brillando, se arrepiente
      if (J.dios.on && Math.hypot(J.novia.x - o.x, J.novia.z - o.z) < 6 && !o.regaño) { o.regaño = true; decirYa("Ni lo pienses, amiguito. Ella se queda conmigo 😤", "dios", 3000); setTimeout(() => { if (ovni === o) { o.fase = "huye"; o.t = 0; } }, 1200); }
      break;
    }
    case "abduce": {
      const v = o.victima;
      if (!v || v.fuera) { o.fase = "pasea"; break; }
      tx = v.x; tz = v.z; ty = 18; vel = 9; o.haz = Math.hypot(v.x - o.x, v.z - o.z) < 2.5 ? 1 : 0;
      if (o.haz > 0.5) {
        if (!o.sube) { o.sube = true; son("tractor", v.x, v.z); globito(v, elegir(["¿Eh? ¿Qué…? 😳", "¡¿Qué está pasando?!", "¡Bájenme! 😭"]), "gente", 2.2, 2.2); anunciar({ tipo: "ovni", x: v.x, y: 10, z: v.z, radio: 40, fuerza: 0.4 }); if (Math.hypot(v.x - yo.x, v.z - yo.z) < 50) setTimeout(() => decirElla(lineaElla("ovni")), 700); }
        v.y += dt * 2.2; v.ry += dt * 2.5; v.anim.aire = 1; v.anim.miedo = 1; v.x = amort(v.x, o.x, 2, dt); v.z = amort(v.z, o.z, 2, dt);
        if (v.y > o.y - 1.6) { v.oculto = true; o.fase = "decide"; o.t = 0; o.sube = false; contar("abducidos"); son("pop", o.x, o.z); }
      }
      break;
    }
    case "decide": tx = o.x; tz = o.z; ty = 20; o.haz = 0; if (o.t > 3.5) { if (Math.random() < 0.7) { o.fase = "devuelve"; o.t = 0; const v = o.victima; v.oculto = false; v.y = o.y - 2; } else { o.fase = "se_va"; o.t = 0; const v = o.victima; v.fuera = true; setTimeout(() => decir("…¿y si se lo quedaron? 😳", "yo"), 1500); } } break;
    case "devuelve": {
      const v = o.victima; tx = o.x; tz = o.z; ty = 20; o.haz = 1;
      if (!v || v.fuera) { o.fase = "pasea"; break; }
      v.y -= dt * 2.6; v.ry += dt * 2;
      const piso = alturaSuelo(v.x, v.z, v.y);
      if (v.y <= piso) { v.y = piso; v.controlado = false; v.estado = "MIEDO"; v.te = 1.5; v.anim.aire = 0; globito(v, elegir(["¿Qué… qué pasó? 👽", "Me siento… diferente 👽", "Vi cosas… cosas que no puedo contar 😶", "Ya no me vuelvo a reír de los ovnis 😵"]), "gente", 3, 2.2); misterio("abduccion"); o.fase = "pasea"; o.haz = 0; o.victima = null; o.meta = metaCerca(); }
      break;
    }
    case "corazon":   // nos ve juntos y nos deja un corazón (con sus lucecitas)
      tx = J.novia.x; tz = J.novia.z; ty = 16; vel = 6;
      if (o.t > 2.5 && !o.amor) { o.amor = true; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); fx.brillos(o.x + hx * 0.25, o.y - 2 + hy * 0.25, o.z, 1, k % 2 ? "rosa" : "oro", 0.7, 0.05); } son("corazon", o.x, o.z); setTimeout(() => decirElla("Amor… ¡el ovni nos mandó un corazón! 🥹👽"), 600); }
      if (o.t > 6) { o.fase = "se_va"; o.t = 0; }
      break;
    case "huye": { const dx = o.x - yo.x, dz = o.z - yo.z, m = Math.hypot(dx, dz) || 1; tx = o.x + dx / m * 50; tz = o.z + dz / m * 50; ty = 45; vel = 40; if (o.t > 3) { o.fase = o.golpeado ? "se_va" : "pasea"; o.t = 0; o.meta = metaCerca(); } break; }
    case "se_va": tx = o.x + 10; tz = o.z + 10; ty = o.y + 60; vel = 60; o.haz = 0; if (o.t > 3) { quitarOvni(); return; } break;
  }
  if (o.victima && o.fase !== "abduce" && o.fase !== "decide" && o.fase !== "devuelve" && o.victima.estado === "ATRAPADO") { const v = o.victima; v.oculto = false; v.controlado = false; v.estado = "HERIDO"; v.vy = 0; v.te = 2; o.victima = null; }
  const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz), v = Math.min(vel, d * 1.2);
  o.vx = amort(o.vx, d > 0.05 ? dx / d * v : 0, 2, dt); o.vz = amort(o.vz, d > 0.05 ? dz / d * v : 0, 2, dt);
  o.x += o.vx * dt; o.z += o.vz * dt; o.y = amort(o.y, ty, o.fase === "se_va" ? 3 : 1.2, dt);
  o.giro += dt * (1.2 + Math.hypot(o.vx, o.vz) * 0.1);
  const m = o.m;
  m.g.position.set(o.x, o.y + Math.sin(J.t * 1.7) * 0.4, o.z);
  m.g.rotation.set(clamp(o.vz * 0.015, -0.3, 0.3) + (o.golpeado ? Math.sin(J.t * 20) * 0.15 : 0), o.giro, clamp(-o.vx * 0.015, -0.3, 0.3));
  m.luces.forEach((l, i) => { l.visible = Math.sin(J.t * 6 + i * 0.8) > -0.3; });
  // el rayo tractor
  const hz = m.haz.material.uniforms; hz.uT.value = J.t; hz.uA.value = amort(hz.uA.value, o.haz, 3, dt);
  const piso = alturaSuelo(o.x, o.z, 0.5);
  m.haz.visible = hz.uA.value > 0.02;
  m.haz.position.set(o.x, o.y - 0.9, o.z); m.haz.scale.set(1, Math.max(0.1, o.y - 0.9 - piso), 1);
  // el rayo tractor pinta el suelo con una luz verde de verdad
  const sp = m.haz.visible ? pedirFoco(o) : (soltarFoco(o), null);
  if (sp) { sp.position.set(o.x, o.y - 1, o.z); sp.target.position.set(o.x + Math.sin(m.haz.rotation.z) * 3, piso, o.z - Math.sin(m.haz.rotation.x) * 3); sp.color.set("#8affc8"); sp.intensity = hz.uA.value * 320; sp.distance = o.y + 20; sp.angle = Math.atan(3.6 / Math.max(4, o.y - piso)); }
  if (o.fase === "escanea") { m.haz.rotation.z = Math.sin(o.t * 1.4) * 0.35; m.haz.rotation.x = Math.cos(o.t * 1.1) * 0.3; } else m.haz.rotation.set(0, 0, 0);
  const dist = Math.hypot(o.x - yo.x, o.z - yo.z);
  bucleEn("ovni", clamp(1 - dist / 90, 0, 1) * 0.05, o.x, o.z);
  // la primera vez que lo veo
  if (!o.visto && dist < 60) { aPantalla(o.x, o.y, o.z, _p); if (_p.visible && _p.x > 0 && _p.x < J.ancho && _p.y > 0 && _p.y < J.alto) { o.visto = true; misterio("ovni"); setTimeout(() => decirElla(lineaElla("ovni")), 500); anunciar({ tipo: "ovni", x: o.x, y: o.y, z: o.z, radio: 50, fuerza: 0.3 }); } }
}
function quitarOvni() { if (!ovni) return; const m = ovni.m; for (const x of [m.g, m.haz]) J.escena.remove(x); soltarFoco(ovni); bucleEn("ovni", 0); ovni = null; proximoGrande = rnd(150, 260); }
function rayoAlOvni(p) {
  if (!ovni || Math.hypot(p.x - ovni.x, p.y - ovni.y, p.z - ovni.z) > 7) return;
  ovni.golpeado = true; ovni.fase = "huye"; ovni.t = 0;
  fx.chispas(ovni.x, ovni.y, ovni.z, 30, 10, "azul"); son("chapa", ovni.x, ovni.z);
  globito(ovni, "👽💢", "gente", 1.8, -1);
  misterio("ovniRayo"); J.desbloquear && J.desbloquear("ovni");
}

/* ══════════════════ LA LUNA ══════════════════ */
const lunaEv = { activo: false, fase: "", t: 0, cuenta: 0, grietas: [], dibujado: 0, frio: 0 };
J.lunaEvento = lunaEv;
let frag = null; const FR = 70, fdat = [];
function armarFragmentos() {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  frag = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: "#efe2c2", emissive: "#6a5a40", emissiveIntensity: 0.6, roughness: 0.9, fog: false, flatShading: true }), FR);
  frag.frustumCulled = false; frag.visible = false; frag.renderOrder = -7; cielo.add(frag);
  for (let i = 0; i < FR; i++) fdat.push({ o: new THREE.Vector3(), p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), w: new THREE.Vector3(), s: 1 });
}
J.sobreLuna = (x, y) => {
  if (!luna.pos || lunaEv.activo || !luna.malla.visible) return false;
  aPantalla(luna.pos.x, luna.pos.y, luna.pos.z, _p);
  if (!_p.visible) return false;
  const rpx = luna.r / luna.dist * (J.alto / 2) / Math.tan(THREE.MathUtils.degToRad(J.camara.fov / 2));
  return Math.hypot(x - _p.x, y - _p.y) < rpx * 1.35 + 18;
};
J.tocarLuna = () => {
  if (lunaEv.activo) return;
  fx.brillos(luna.pos.x, luna.pos.y, luna.pos.z, 1, "oro", 4, 0.1);
  luna.sx = rnd(-1, 1); setTimeout(() => (luna.sx = 0), 120);
  son("ding");
  if (J.dios.on && contar("lunaDios") >= 5) J.desbloquear && J.desbloquear("tiempo");
};
function grietasLuna() {
  lunaEv.grietas = [];
  for (let r = 0; r < 9; r++) {
    const pts = [[128 + rnd(-20, 20), 128 + rnd(-20, 20)]]; let a = r / 9 * TAU + rnd(-0.3, 0.3);
    for (let k = 0; k < 8; k++) { a += rnd(-0.6, 0.6); const [px, py] = pts[pts.length - 1]; pts.push([px + Math.cos(a) * rnd(10, 18), py + Math.sin(a) * rnd(10, 18)]); }
    lunaEv.grietas.push(pts);
  }
  lunaEv.dibujado = 0;
}
function dibujarGrietas(k) {
  const x = luna.gx; x.clearRect(0, 0, 256, 256);
  x.save(); x.beginPath(); x.arc(128, 128, 125, 0, TAU); x.clip();
  for (const capa of [["rgba(255,120,50,.55)", 5], ["rgba(40,20,20,.9)", 2]]) {
    x.strokeStyle = capa[0]; x.lineWidth = capa[1]; x.lineCap = "round";
    for (const pts of lunaEv.grietas) { const n = Math.max(1, Math.floor(pts.length * k)); x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); }
  }
  x.restore(); luna.grietas.material.map.needsUpdate = true;
}
function romperLuna() {
  if (lunaEv.activo) return;
  lunaEv.activo = true; lunaEv.fase = "tiembla"; lunaEv.t = 0; grande = "luna";
  grietasLuna(); son("luna");
  const yo = J.jugador;
  J.cinematicaCam({ dur: 9, pitch: 0.05, dist: 7, mirar: { x: yo.x + luna.dir.x * 120, y: 1.5 + luna.dir.y * 120, z: yo.z + luna.dir.z * 120 } });
  setTimeout(() => decirYa(J.dios.on ? "Mmm… ¿y si la toco tantito? 😳" : "Amor… ¿la luna está… temblando? 😳", J.dios.on ? "dios" : "yo", 2400), 300);
}
J.romperLuna = romperLuna;
function actualizarLuna(dt) {
  // el gesto: dos dedos quietos sobre la luna durante 1.6 s
  if (J.lunaDedos && !lunaEv.activo) {
    const k = (performance.now() - J.lunaDedos.t0) / 1600;
    aPantalla(luna.pos.x, luna.pos.y, luna.pos.z, _p);
    anilloLuna(_p.x, _p.y, Math.min(1, k));
    luna.sx = rnd(-1, 1) * k * 0.6; luna.sy = rnd(-1, 1) * k * 0.6;
    if (k >= 1 && lunaEv.frio <= 0) { J.lunaDedos = null; anilloLuna(0, 0, 0); romperLuna(); }
    else if (k >= 1) { J.lunaDedos = null; anilloLuna(0, 0, 0); decir("La luna todavía se está recuperando… 🌙", "yo"); }
  } else if (!lunaEv.activo) { anilloLuna(0, 0, 0); if (!lunaEv.activo) luna.sx = luna.sy = 0; }
  if (lunaEv.frio > 0) lunaEv.frio -= dt;
  if (!lunaEv.activo) return;
  const e = lunaEv; e.t += dt;
  const yo = J.jugador;
  if (e.fase === "tiembla") {
    const k = Math.min(1, e.t / 3);
    luna.sx = rnd(-1, 1) * k * 1.6; luna.sy = rnd(-1, 1) * k * 1.6;
    if (Math.floor(k * 12) !== e.dibujado) { e.dibujado = Math.floor(k * 12); dibujarGrietas(k); }
    J.cieloMat.uniforms.uRojo.value = k * 0.5; J.luz = 1 - k * 0.35;
    J.temblor = Math.max(J.temblor || 0, k * 0.35);
    luna.halo.material.color.setRGB(1, 1 - k * 0.4, 1 - k * 0.6);
    if (e.t > 3) {
      e.fase = "vacio"; e.t = 0;
      luna.malla.visible = luna.grietas.visible = false; luna.sx = luna.sy = 0;
      son("boom", yo.x, yo.z, 1.4); son("cristal"); J.temblor = 1;
      // los pedazos salen volando desde donde estaba
      const dir = luna.dir, der = new THREE.Vector3().crossVectors(dir, _v.set(0, 1, 0)).normalize(), arr = new THREE.Vector3().crossVectors(der, dir).normalize();
      for (const f of fdat) {
        const a = rnd(TAU), r = Math.sqrt(Math.random()) * luna.r * 0.85;
        f.o.copy(dir).multiplyScalar(luna.dist).addScaledVector(der, Math.cos(a) * r).addScaledVector(arr, Math.sin(a) * r);
        f.p.copy(f.o); f.s = rnd(1.6, 4.6);
        f.v.copy(der).multiplyScalar(Math.cos(a) * rnd(8, 26)).addScaledVector(arr, Math.sin(a) * rnd(8, 26)).addScaledVector(dir, rnd(-14, 6));
        f.q.random(); f.w.set(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2));
      }
      frag.visible = true;
      fx.destello(yo.x, yo.y + 40, yo.z, 40, "#ffd8a0", 1.2);
      anunciar({ tipo: "luna", x: yo.x, y: 60, z: yo.z, radio: 999, fuerza: 1 });
      for (const a of J.gente) a.lunaArriba = 10;
      setTimeout(() => decirElla(lineaElla("luna")), 500);
      setTimeout(() => decirYa(elegir(["…Ups. ¿Fui yo? 😳", "Ok… creo que me pasé 😳", "…¿Eso tenía arreglo? 😅"]), J.dios.on ? "dios" : "yo", 2800), 3200);
    }
  } else if (e.fase === "vacio") {
    for (const f of fdat) { f.p.addScaledVector(f.v, dt); f.v.multiplyScalar(Math.exp(-0.35 * dt)); }
    J.cieloMat.uniforms.uRojo.value = amort(J.cieloMat.uniforms.uRojo.value, 0.25, 0.6, dt); J.luz = amort(J.luz, 0.45, 0.8, dt);
    if (e.t > 9) { e.fase = "vuelve"; e.t = 0; son("rearmar"); setTimeout(() => decir("Espera… ¿se está… armando sola? ✨", "yo", 2800), 600); }
  } else if (e.fase === "vuelve") {
    const k = Math.min(1, e.t / 6), s = k * k * (3 - 2 * k);
    for (const f of fdat) { f.p.lerp(f.o, 1 - Math.exp(-(0.6 + s * 6) * dt)); f.w.multiplyScalar(Math.exp(-1.5 * dt)); }
    if (Math.random() < dt * 20) { const f = elegir(fdat); fx.brillos(J.camara.position.x + f.p.x * 0.25, J.camara.position.y + f.p.y * 0.25, J.camara.position.z + f.p.z * 0.25, 1, "oro", 0.6, 0.1); }
    J.cieloMat.uniforms.uRojo.value = (1 - s) * 0.25; J.luz = lerp(0.45, 1, s);
    if (e.t > 6) {
      e.fase = ""; e.activo = false; grande = null; e.frio = 60; proximoGrande = rnd(120, 200);
      frag.visible = false; luna.malla.visible = luna.grietas.visible = true;
      luna.gx.clearRect(0, 0, 256, 256); luna.grietas.material.map.needsUpdate = true;
      luna.halo.material.color.setRGB(1, 1, 1); J.luz = 1; J.cieloMat.uniforms.uRojo.value = 0;
      son("magia"); misterio("luna");
      setTimeout(() => decirElla(lineaElla("lunaVuelve")), 400);
      setTimeout(() => decir("Como si alguien la hubiera vuelto a armar… pedacito por pedacito 🌙", "yo", 3600), 3600);
    }
  }
  if (frag.visible) {
    let i = 0;
    for (const f of fdat) { const a = f.w.length(); if (a > 1e-4) { _q.setFromAxisAngle(_v.copy(f.w).divideScalar(a), a * dt); f.q.premultiply(_q); } _m.compose(f.p, f.q, _s.set(f.s, f.s, f.s)); frag.setMatrixAt(i++, _m); }
    frag.instanceMatrix.needsUpdate = true;
  }
}

/* ══════════════════ EL PORTAL (muy, muy raro) ══════════════════ */
let portal = null;
function modeloPortal() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: "varying vec2 vU; void main(){ vU = uv*2.0-1.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `uniform float uT, uA; varying vec2 vU;
      void main(){ float r = length(vU); if (r > 1.0) discard; float a = atan(vU.y, vU.x);
        float rem = sin(a*5.0 + r*14.0 - uT*6.0)*0.5+0.5; float rem2 = sin(a*3.0 - r*9.0 + uT*4.0)*0.5+0.5;
        vec3 c = mix(vec3(0.12,0.62,0.16), vec3(0.75,1.0,0.35), rem*0.7+rem2*0.3);
        c = mix(c, vec3(0.95,1.0,0.8), smoothstep(0.35,0.0,r)*0.6);
        float borde = smoothstep(1.0,0.82,r); float aro = smoothstep(0.7,0.93,r)*borde;
        c = c * (1.0 + aro * 1.6) + vec3(0.4,1.2,0.3) * aro * 1.4;
        gl_FragColor = vec4(c, uA*borde*(0.85+0.15*rem)); }`,
  });
  const g = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), mat);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(150,255,120,.55)"], [0.45, "rgba(90,230,80,.18)"], [1, "rgba(60,200,60,0)"]], 128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.4, 1.8, 1.2) }));
  halo.scale.set(6.5, 6.5, 1); g.add(halo);
  g.renderOrder = 5;
  J.escena.add(capaEfectos(g));
  return { g, mat, halo };
}
function abrirPortal(x, z, ry) { const m = modeloPortal(); m.g.position.set(x, 1.7 + alturaSuelo(x, z, 1), z); m.g.rotation.y = ry; return { m, x, z, ry, a: 0, cerrar: false }; }
function moverPortal(p, dt) {
  p.a = amort(p.a, p.cerrar ? 0 : 1, p.cerrar ? 4 : 3, dt);
  p.m.mat.uniforms.uT.value = J.t; p.m.mat.uniforms.uA.value = p.a;
  p.m.g.scale.setScalar(0.05 + p.a * 0.95); p.m.halo.material.opacity = p.a;
  if (Math.random() < dt * 20 * p.a) fx.brillos(p.x + rnd(-1, 1), p.m.g.position.y + rnd(-1.4, 1.4), p.z + rnd(-1, 1), 1, "verde", 0.4, 0.8);
}
function quitarPortal(p) { J.escena.remove(p.m.g); p.m.mat.dispose(); p.m.halo.material.dispose(); }
function caminar(a, x, z, v, dt) {
  const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
  if (d < 0.15) { a.vel = 0; return true; }
  const p = Math.min(d, v * dt); a.x += dx / d * p; a.z += dz / d * p; a.vel = v; a.ry = amortAng(a.ry, Math.atan2(dx, dz), 8, dt);
  a.y = alturaSuelo(a.x, a.z, a.y + 0.3);
  return false;
}
function iniciarPortal() {
  const yo = J.jugador, ay = J.camYaw || 0;
  // enfrente de mí (donde la cámara lo vea), en un lugar sin edificio
  let x = 0, z = 0, ok = false;
  for (const da of [0.12, -0.12, 0.3, -0.3, 0.6, -0.6, 1, -1]) for (const r of [6.5, 5, 8.5]) {
    if (ok) break;
    x = yo.x - Math.sin(ay + da) * r; z = yo.z - Math.cos(ay + da) * r;
    ok = !edificioEn(x, z) && !edificioEn((x + yo.x) / 2, (z + yo.z) / 2);
  }
  if (!ok) return false;
  grande = "portal";
  const ry = Math.atan2(yo.x - x, yo.z - z);
  portal = { p1: abrirPortal(x, z, ry), p2: null, t: 0, fase: "abre", rick: null, morty: null, paso: 0, guion: GUIONES[(memo.cuenta.portal || 0) % GUIONES.length] };
  son("portal", x, z); bucleEn("portal", 0.06, x, z);
  // la cámara los sigue durante toda la plática (a medias: el dedo todavía puede girarla)
  J.cinematicaCam({ dur: 24, dist: 9.5, pitch: 0.2, mezcla: 0.75, mirar: { x: (x + yo.x) / 2, y: 1.3, z: (z + yo.z) / 2 } });
  anunciar({ tipo: "portal", x, y: 1.5, z, radio: 30, fuerza: 0.4 });
  return true;
}
const GUIONES = [[
  [0.0, "rick", () => J.dios.on ? "*burp* Morty, esta no es la C-137… mira, hay un tipo brillando como foco." : "*burp* Morty, esta no es la C-137. Ni siquiera hay un Rick por aquí."],
  [4.2, "morty", () => "R-Rick, ¿y si es una trampa de Rick Prime? Esa pareja se ve sospechosamente… feliz."],
  [8.4, "rick", () => "Nah, Morty. Es una de esas dimensiones donde el amor *burp* sí funciona. Qué asco. Vámonos."],
  [12.6, "morty", () => "¡Perdón por interrumpir! Se ven muy lindos juntos 🥹"],
  [16.2, "rick", () => "Oye, tú. Cuídala. En casi todas las dimensiones la riegas."],
], [
  [0.0, "rick", () => "*burp* Morty, esta dimensión huele a… cursilería. Agarramos la semilla y nos vamos."],
  [4.2, "morty", () => "Rick, mira, esos dos se están viendo como en las películas."],
  [8.4, "rick", () => "Es una ciudad dormida, Morty. Aquí todos andan de la mano. *burp* Me da urticaria."],
  [12.6, "morty", () => "¡Perdón! Ya nos vamos, sigan con su cita 🥹"],
  [16.2, "rick", () => "Y tú, galán: no la hagas esperar. La distancia es sólo un número… *burp* y yo tengo pistola de portales."],
], [
  [0.0, "rick", () => "Morty, ¿por qué todos los portales nos traen a esta misma calle?"],
  [4.2, "morty", () => "¿Será que el universo quiere que veamos algo bonito, Rick?"],
  [8.4, "rick", () => "El universo no quiere nada, Morty. *burp* …Bueno, ok, se ven bien juntos. No se lo digas a nadie."],
  [12.6, "morty", () => "¡Hola otra vez! ¡Saludos de la C-137! 👋"],
  [16.2, "rick", () => "Oye, galán: en casi todas las dimensiones la riegas. En ésta no. No lo arruines."],
], [
  [0.0, "morty", () => "¡Rick! ¡Son ellos otra vez! Los de la ciudad bonita."],
  [4.2, "rick", () => "Ya sé, Morty. *burp* Es la quinta vez. Creo que mi pistola de portales está enamorada."],
  [8.4, "morty", () => "¿Las pistolas de portales se pueden enamorar?"],
  [12.6, "rick", () => "En esta dimensión parece que todo se puede, Morty. Hasta amarse de lejos."],
  [16.2, "morty", () => "¡Cuídense mucho! 💚"],
]];
function actualizarPortal(dt) {
  const P = portal; if (!P) return;
  P.t += dt; const yo = J.jugador;
  moverPortal(P.p1, dt); if (P.p2) moverPortal(P.p2, dt);
  { const q = P.p2 && P.p2.a > P.p1.a ? P.p2 : P.p1; luzPortal.position.set(q.x + Math.sin(q.ry) * 0.6, q.m.g.position.y, q.z + Math.cos(q.ry) * 0.6); luzPortal.intensity = q.a * 46; }
  const { x, z, ry } = P.p1;
  if (P.fase === "abre" && P.t > 1.4) {
    P.fase = "salen"; P.t = 0;
    const R = J.crearPersona({ controlado: true, estado: "PARADO", fem: false, tipo: "adulto", caracter: "nada", x: x + Math.sin(ry) * 0.3, z: z + Math.cos(ry) * 0.3 });
    R.escala = 1.08; R.peinado = 4; R.colores.pelo = new THREE.Color("#b8dcec"); R.colores.ropa = new THREE.Color("#f2f2f4"); R.colores.ropa2 = new THREE.Color("#8ab8d8"); R.colores.pantalon = new THREE.Color("#6a4a2a"); R.colores.zapato = new THREE.Color("#3a2a1a"); R.colores.piel = new THREE.Color("#e8c8a8");
    const M = J.crearPersona({ controlado: true, estado: "PARADO", fem: false, tipo: "adulto", caracter: "nada", x: x + Math.cos(ry) * 0.8, z: z - Math.sin(ry) * 0.8 });
    M.escala = 0.8; M.peinado = 0; M.colores.pelo = new THREE.Color("#6a3a1a"); M.colores.ropa = new THREE.Color("#f2d23a"); M.colores.ropa2 = new THREE.Color("#f2d23a"); M.colores.pantalon = new THREE.Color("#3a5aa8"); M.colores.zapato = new THREE.Color("#f2f2f2"); M.colores.piel = new THREE.Color("#f0d0b0");
    for (const a of [R, M]) { a.y = alturaSuelo(a.x, a.z, 1); a.anim.tel = 0; }
    P.rick = R; P.morty = M;
    misterio("portal");
  }
  if (P.fase === "salen") {
    const R = P.rick, M = P.morty;
    const fx0 = x + Math.sin(ry) * 2.6, fz0 = z + Math.cos(ry) * 2.6;
    caminar(R, fx0 + Math.cos(ry) * 0.5, fz0 - Math.sin(ry) * 0.5, 1.4, dt);
    caminar(M, fx0 - Math.cos(ry) * 0.6, fz0 + Math.sin(ry) * 0.6, 1.4, dt);
    if (R.vel === 0) R.ry = amortAng(R.ry, Math.atan2(yo.x - R.x, yo.z - R.z), 4, dt);
    if (M.vel === 0) M.ry = amortAng(M.ry, Math.atan2(J.novia.x - M.x, J.novia.z - M.z), 4, dt);
    R.anim.habla = M.anim.habla = 0;
    const GUION = P.guion;
    while (P.paso < GUION.length && P.t > GUION[P.paso][0] + 0.8) {
      const [, quien, f] = GUION[P.paso++], txt = f(), a = quien === "rick" ? R : M;
      a.anim.habla = 1;
      globito(a, txt, quien, 4, 2.3 * a.escala);
      if (txt.includes("*burp*")) son("eructo", a.x, a.z);
      if (P.paso === 4) setTimeout(() => { globito(J.novia, "Aww 🥹", "ella", 2, 2.1); }, 1400);
    }
    if (P.t > 21) {
      P.fase = "se_van"; P.t = 0;
      const a = ry + Math.PI / 2, x2 = x + Math.sin(a) * 5, z2 = z + Math.cos(a) * 5;
      P.p2 = abrirPortal(edificioEn(x2, z2) ? x - Math.sin(a) * 5 : x2, edificioEn(x2, z2) ? z - Math.cos(a) * 5 : z2, ry);
      P.p1.cerrar = true; son("portal", P.p2.x, P.p2.z);
      setTimeout(() => decirElla(lineaElla("portal")), 2500);
    }
  }
  if (P.fase === "se_van") {
    const p2 = P.p2; let dentro = 0;
    for (const a of [P.rick, P.morty]) { if (a.fuera) { dentro++; continue; } if (caminar(a, p2.x, p2.z, 1.8, dt)) { a.fuera = true; son("pop", a.x, a.z); } }
    if (dentro === 2 && !p2.cerrar) { p2.cerrar = true; P.fin = 0; }
    if (p2.cerrar) { P.fin += dt; if (P.fin > 1.2) { quitarPortal(P.p1); quitarPortal(p2); bucleEn("portal", 0); luzPortal.intensity = 0; portal = null; grande = null; memo.cuenta.portal = (memo.cuenta.portal || 0) + 1; guardar(); } }
  }
  if (portal) bucleEn("portal", 0.06 * P.p1.a, x, z);
}
J.forzarPortal = () => { if (!portal && !grande) iniciarPortal(); };

/* ══════════════════ LO PEQUEÑO: estrellas fugaces y la tormenta ══════════════════ */
let fugaz = null, porFugaz = rnd(40, 80), porTormenta = rnd(300, 520), tormentaT = 0, porRayo = 0;
function armarFugaz() {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array([3, 3, 3.4, 0, 0, 0]), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  l.frustumCulled = false; l.visible = false; l.renderOrder = -8; cielo.add(capaEfectos(l));
  return l;
}
let fugazLinea;
function lanzarFugaz() {
  const a = rnd(TAU), y = rnd(0.35, 0.7), r = Math.sqrt(1 - y * y);
  const p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(380);
  const d = new THREE.Vector3(rnd(-1, 1), rnd(-0.5, -0.2), rnd(-1, 1)).normalize().multiplyScalar(240);
  fugaz = { p, d, t: 0, dur: 1.1 };
  fugazLinea.visible = true;
  if (!memo.misterios.estrella) setTimeout(() => { decirElla("¡Amor, una estrella fugaz! Pide un deseo 🌠"); misterio("estrella"); }, 300);
}
function actualizarFugaz(dt) {
  if ((porFugaz -= dt) <= 0) { porFugaz = rnd(50, 130); if (!J.lloviendo || J.lloviendo < 0.3) lanzarFugaz(); }
  if (!fugaz) return;
  fugaz.t += dt; const k = fugaz.t / fugaz.dur;
  if (k >= 1) { fugaz = null; fugazLinea.visible = false; return; }
  const pos = fugazLinea.geometry.attributes.position.array, cab = fugaz.p.clone().addScaledVector(fugaz.d, k), col = cab.clone().addScaledVector(fugaz.d, -0.18);
  pos.set([cab.x, cab.y, cab.z, col.x, col.y, col.z]); fugazLinea.geometry.attributes.position.needsUpdate = true;
  fugazLinea.material.opacity = Math.sin(k * Math.PI);
}
function lluviaRayos(dt) {
  J.relampago = Math.max(0, (J.relampago || 0) - dt * 4);
  if ((J.lloviendo || 0) < 0.55) return;
  if ((porRayo -= dt) > 0) return;
  porRayo = rnd(4, 10);
  const yo = J.jugador, x = yo.x + rnd(-60, 60), z = yo.z + rnd(-60, 60), lejos = Math.hypot(x - yo.x, z - yo.z);
  J.relampago = 1;
  if (lejos > 20 && !edificioEn(x, z)) {
    fx.rayo(new THREE.Vector3(x + rnd(-10, 10), 70, z + rnd(-10, 10)), new THREE.Vector3(x, 0.2, z), "#dfe4ff", 0.25);
    fx.chispas(x, 0.2, z, 12, 6, "azul"); grieta(x, z);
  }
  setTimeout(() => son("trueno", x, z, 1), Math.min(2500, lejos * 12));
}
function actualizarTormenta(dt) {
  if (tormentaT > 0) {
    tormentaT -= dt; J.lluviaNatural = 0.85;
    if (tormentaT <= 0) { J.lluviaNatural = 0; decir("Ya está escampando… 🌙", "yo"); }
  } else if ((porTormenta -= dt) <= 0) {
    porTormenta = rnd(420, 700);
    if (!grande && !J.dios.on) { tormentaT = rnd(50, 80); decirElla("Amor… creo que va a llover 🌧️"); misterio("tormenta"); anunciar({ tipo: "lluvia", x: J.jugador.x, z: J.jugador.z, radio: 90, fuerza: 0.3 }); }
  }
}

/* ══════════════════ EL DIRECTOR ══════════════════ */
let grande = null, proximoGrande = rnd(70, 120), porPortal = rnd(50, 75);
function puedePortal() {
  const yo = J.jugador, ella = J.novia;
  return !grande && !ovni && !J.cinematica && !yo.coche && !yo.vuela && ella && ella.estado !== "fuera" && ella.estado !== "bano" && Math.hypot(ella.x - yo.x, ella.z - yo.z) < 12;
}
/* Al apagar el Modo Dios: fuera policías, patrullas, helicópteros, grietas y transmisión en vivo. */
function limpiarEventos() {
  for (const p of patrullas) { for (const a of p.polis) a.fuera = true; p.polis = []; }
  patrullas.length = 0;
  for (const c of J.coches) if (c.poli && c !== J.jugador.coche) c.estado = "fuera";
  for (const h of helis) quitarHeli(h);
  helis.length = 0;
  grietas.length = 0; grietaMalla.count = 0; trazoVida.fill(0);
  enVivo(false); bucleEn("sirena", 0); bucleEn("heli", 0);
  porPatrulla = 0; sinCaos = 0; dichoRindete = false;
}
export function iniciar() {
  J.escena.add(cielo);
  armarTrazos(); armarGrietas(); armarFragmentos(); armarLucesEventos(); fugazLinea = armarFugaz();
  J.limpiarEventos = limpiarEventos; J.lanzarFugaz = lanzarFugaz;
  J.cieloSigue = (p) => cielo.position.copy(p);
  J.misterio = misterio; J.abrirMisterios = abrirMisterios;
  J.grieta = grieta; J.lluviaRayos = lluviaRayos;
  J.llamarHeli = llamarHeli; J.llamarOvni = () => llamarOvni(true);
  J.alRayo = (mano, p) => { rayoAlOvni(p); golpearHelis(p.x, p.y, p.z, 4, 1.4); };
  J.golpearHelis = golpearHelis; J.helis = () => helis;
  J.alApagarDios = () => { retirarPolicia(true); for (const h of helis) h.calma = Math.max(h.calma, 7); };
  J.alPegarPoli = (a) => { if (Math.random() < 0.5) globito(a, elegir(["¡Oficial caído! 😵", "¡Agresión a la autoridad!", "¡Eso dolió! 😭"]), "poli", 1.8, 2.2); };
  J.ovni = () => ovni;
  contador("#nMis", Object.keys(memo.misterios).length);
  oir((ev) => {
    // el señor de los audífonos: ni con una explosión al lado se entera
    if (ev.tipo === "explosion" || ev.tipo === "sismo") for (const a of J.gente) if (a.audifonos && Math.hypot(a.x - ev.x, a.z - ev.z) < 14 && a.ver) { setTimeout(() => { globito(a, "♪ ♫ …¿eh? ¿Dijeron algo? 🎧", "gente", 2.6, 2.2); misterio("audifonos"); }, 900); break; }
  });
}
export function actualizar(dt, dtM) {
  // los grandes, de uno en uno
  if (!grande && !ovni) {
    proximoGrande -= dt;
    if (proximoGrande <= 0) {
      proximoGrande = rnd(90, 160);
      if (Math.random() < 0.5) llamarOvni(false);
    }
  }
  // Rick y Morty: el primero al minuto y luego cada dos a cuatro minutos
  if ((porPortal -= dt) <= 0) porPortal = puedePortal() && iniciarPortal() ? rnd(120, 230) : 8;
  actualizarLuna(dt);
  actualizarPortal(dtM);
  actualizarOvni(dtM);
  actualizarPolicia(dtM);
  actualizarHelis(dtM);
  actualizarFugaz(dt);
  actualizarTormenta(dt);
  pintarTrazos(dt); pintarGrietas(dtM);
}
void clamp; void CALLES; void decirYa;
