/*
 * YO Y ELLA.
 *
 * Yo: aceleración, frenado e inercia suaves; giro progresivo; salto con
 * «tiempo de coyote»; aterrizajes que se notan; con Modo Dios, vuelo libre.
 * Golpe básico (combo izquierda-derecha), golpe fuerte (patada; con Modo
 * Dios, un golpe al piso con onda). Recibe golpes y reacciona.
 *
 * Ella: no es un adorno. Me sigue y camina conmigo (si vamos despacio,
 * de la mano), me espera si me alejo, se sienta en una banca con su
 * teléfono a ver K-dramas, mira al cielo si vuelo, se asusta y se aleja del
 * peligro, me busca si desaparezco y comenta lo que pasa.
 */
import { J, THREE, clamp, lerp, amort, amortAng, difAng, rnd, elegir, anunciar, oir, TAU } from "./base.js";
import { crearProtagonista, nuevaAnim, animar, aplicar, ALTURA_CADERA } from "./cuerpos.js";
import { alturaSuelo, chocarEdificios, lugares, bancas, BORDE_MUNDO } from "./mundo.js";
import { son, bucleEn } from "./audio.js";
import { polvo, brillos, corazones, onda, chispas } from "./efectos.js";
import { E, decir, globito } from "./ui.js";

const V = new THREE.Vector3();
function nuevoCuerpo(quien, x, z) {
  const j = crearProtagonista(quien);
  J.escena.add(j.raiz);
  const c = { quien, j, x, y: 0.16, z, vx: 0, vy: 0, vz: 0, ry: 0, anim: nuevaAnim(), suelo: true, coyote: 0, vuela: false, vel: 0 };
  c.anim.semilla = rnd(10);
  return c;
}

/* ══════════════════ YO ══════════════════ */
export function crearJugador() {
  const p = lugares.inicio;
  const yo = nuevoCuerpo("yo", p.x, p.z - 0.6);
  yo.ry = Math.PI / 2; yo.combo = 0; yo.golpeHecho = false; yo.aterriza = 0; yo.caidaMax = 0; yo.stun = 0; yo.pasos = 0;
  J.jugador = yo;
  const ella = nuevoCuerpo("ella", p.x, p.z + 0.4);
  ella.ry = Math.PI / 2; ella.estado = "kdrama"; ella.te = 0; ella.dicho = {}; ella.miedoT = 0; ella.ultimaVista = { x: p.x, z: p.z }; ella.sinVerme = 0; ella.mano = 0; ella.charla = rnd(25, 40);
  J.novia = ella;
  oir(alEvento);
}

export function camaraAdelante() { const y = J.camYaw || 0; return [-Math.sin(y), -Math.cos(y)]; }

export function actualizarJugador(dt) {
  const yo = J.jugador;
  if (yo.coche) { // manejando: el coche manda
    yo.x = yo.coche.x; yo.z = yo.coche.z; yo.y = yo.coche.y; yo.j.raiz.visible = false;
    return;
  }
  yo.j.raiz.visible = true;
  const dios = J.dios.on;
  // ── la dirección que pide el dedo, vista desde la cámara ──
  const [fx, fz] = camaraAdelante(), rx = -fz, rz = fx;
  let dx = rx * E.mx - fx * E.mz, dz = rz * E.mx - fz * E.mz;
  const mag = Math.min(1, Math.hypot(dx, dz)); if (mag > 0.01) { dx /= Math.hypot(dx, dz); dz /= Math.hypot(dx, dz); }
  const ocupado = yo.stun > 0 || (yo.anim.golpe && yo.anim.golpe.tipo === "tierra") || J.cinematica;
  const fuerza = ocupado ? 0 : E.mag || mag;
  if (yo.stun > 0) yo.stun -= dt;

  if (yo.vuela) {
    // ── VOLAR ──
    const vmax = E.correr ? 26 : 16, acel = 9;
    const objX = dx * fuerza * vmax, objZ = dz * fuerza * vmax;
    yo.vx = amort(yo.vx, objX, fuerza > 0 ? acel / vmax * 3 : 1.6, dt);
    yo.vz = amort(yo.vz, objZ, fuerza > 0 ? acel / vmax * 3 : 1.6, dt);
    const sube = (E.subir ? 1 : 0) - (E.bajar ? 1 : 0);
    yo.vy = amort(yo.vy, sube * 9 + Math.sin(J.t * 2) * 0.3, 3, dt);
    yo.x += yo.vx * dt; yo.z += yo.vz * dt; yo.y += yo.vy * dt;
    yo.y = clamp(yo.y, 0, 90);
    const piso = Math.max(alturaSuelo(yo.x, yo.z, yo.y + 0.5), J.nivelAgua ? J.nivelAgua(yo.x) : -1);
    if (yo.y <= piso + 0.05 && sube < 0) aterrizar(yo, piso, 2);   // bajó hasta el piso
    else if (yo.y < piso) yo.y = piso;
    if (!dios) { yo.vuela = false; yo.suelo = false; }
    const h = Math.hypot(yo.vx, yo.vz);
    if (h > 0.4) yo.ry = amortAng(yo.ry, Math.atan2(yo.vx, yo.vz), 4, dt);
    yo.anim.vuelo = 1; yo.anim.velVuelo = h; yo.anim.vel = 0; yo.anim.aire = 0;
    bucleEn("vuelo", clamp(h / 26, 0, 1) * 0.22 + 0.02);
    if (h > 12 && Math.random() < dt * 30) brillos(yo.x - yo.vx * 0.05, yo.y + 1, yo.z - yo.vz * 0.05, 1, Math.random() < 0.5 ? "oro" : "rosa", 0.3, 0.4);
    if (E.saltar && yo.y - piso < 1.5 && sube <= 0) {} // (subir se hace dejando presionado)
  } else {
    // ── CAMINAR / CORRER ──
    bucleEn("vuelo", 0);
    yo.anim.vuelo = 0;
    const corre = E.correr || fuerza > 0.88;
    const vmax = (corre ? 6.4 : 2.7 * Math.max(0.55, fuerza / 0.85)) * (dios ? 1.25 : 1);
    const obj = fuerza > 0.08 ? vmax : 0;
    const ax = dx * obj, az = dz * obj;
    const k = yo.suelo ? (obj > yo.vel ? 9 : 12) : 2.2;   // en el aire casi no se cambia de rumbo
    yo.vx = amort(yo.vx, ax, k, dt); yo.vz = amort(yo.vz, az, k, dt);
    if (yo.anim.golpe) { yo.vx *= Math.exp(-10 * dt); yo.vz *= Math.exp(-10 * dt); }
    yo.vel = Math.hypot(yo.vx, yo.vz);
    if (yo.vel > 0.3 && fuerza > 0.08) yo.ry = amortAng(yo.ry, Math.atan2(dx, dz), corre ? 9 : 11, dt);
    // saltar (y, con Modo Dios, en el aire: volar)
    if (E.saltar && !ocupado) {
      if (yo.suelo || yo.coyote > 0) { yo.vy = dios ? 8.5 : 6.2; yo.suelo = false; yo.coyote = 0; son("salto", yo.x, yo.z); }
      else if (dios) { yo.vuela = true; yo.vy = 4; son("whoosh", yo.x, yo.z, 0.8); brillos(yo.x, yo.y + 0.5, yo.z, 14, "oro", 0.5, 2); anunciar({ tipo: "vuelo", x: yo.x, z: yo.z, radio: 30, fuerza: 0.4 }); }
    }
    yo.vy -= 20 * dt;
    yo.x += yo.vx * dt; yo.z += yo.vz * dt; yo.y += yo.vy * dt;
    const piso = Math.max(alturaSuelo(yo.x, yo.z, yo.y + 0.3), J.nivelAgua ? J.nivelAgua(yo.x) : -1);   // con la ola, camino sobre el agua
    if (yo.y <= piso) {
      if (!yo.suelo) aterrizar(yo, piso, -yo.vy);
      yo.y = piso; yo.vy = 0; yo.suelo = true; yo.coyote = 0.12;
    } else {
      if (yo.suelo && yo.y - piso > 0.25) { yo.suelo = false; }
      if (!yo.suelo) yo.coyote -= dt;
      if (yo.suelo && yo.y - piso <= 0.25) yo.y = piso;   // escalones (la banqueta)
    }
    yo.anim.aire = amort(yo.anim.aire, yo.suelo ? 0 : 1, 10, dt);
    yo.anim.vel = yo.suelo ? yo.vel : yo.anim.vel;
    // pasos
    if (yo.suelo && yo.vel > 0.6) { const antes = yo.anim.fase; yo.anim.fase += dt * yo.vel * (yo.vel > 3 ? 2.1 : 2.9); if (Math.floor(antes / Math.PI) !== Math.floor(yo.anim.fase / Math.PI)) son("paso", yo.x, yo.z, yo.vel > 3 ? 1 : 0.6); }
  }
  // no atravesar paredes ni salirse del mundo
  chocarEdificios(yo, 0.35, yo.y);
  const lim = yo.vuela || yo.y > 3 ? 150 : BORDE_MUNDO;
  yo.x = clamp(yo.x, -lim, lim); yo.z = clamp(yo.z, -lim, lim);
  // golpes
  golpes(yo, dt);
  yo.anim.cargar = amort(yo.anim.cargar, J.levantando ? 1 : 0, 8, dt);
  yo.anim.apunta = amort(yo.anim.apunta, J.cargandoPoder ? 1 : 0, 10, dt);
  yo.anim.poder = Math.max(0, yo.anim.poder - dt * 0.7);
  yo.anim.abraza = amort(yo.anim.abraza, yo.abrazaT > 0 ? 1 : 0, 6, dt); if (yo.abrazaT > 0) yo.abrazaT -= dt;
  yo.anim.sentado = amort(yo.anim.sentado, yo.banca ? 1 : 0, 5, dt);
  if (yo.banca && (fuerza > 0.2 || E.saltar)) { yo.banca.ocupada = null; yo.banca = null; }
  if (yo.banca) { yo.x = amort(yo.x, yo.banca.sx, 8, dt); yo.z = amort(yo.z, yo.banca.sz, 8, dt); yo.ry = amortAng(yo.ry, yo.banca.ry, 8, dt); yo.vx = yo.vz = 0; }
  if (yo.aterriza > 0) yo.aterriza -= dt;
  yo.anim.agacha = Math.max(yo.aterriza > 0 ? yo.aterriza * 3 : 0, 0);
  // mano con ella
  const ella = J.novia;
  yo.anim.mano = ella.mano;
  // mirar hacia ella cuando habla o hacia lo que se toca
  yo.anim.mirarY = amort(yo.anim.mirarY, yo.mirar != null ? clamp(difAng(yo.mirar, yo.ry), -1, 1) : 0, 4, dt);
  animar(yo, dt, yo.vuela ? 7 : 13);
  if (ella.mano > 0.3 && yo.vel < 3.2) { yo.ang.hLZ = lerp(yo.ang.hLZ, 0.42, ella.mano); yo.ang.hLX = lerp(yo.ang.hLX, 0.2, ella.mano); yo.ang.cLX = lerp(yo.ang.cLX, 0.25, ella.mano); }
  yo.j.raiz.position.set(yo.x, yo.y, yo.z); yo.j.raiz.rotation.y = yo.ry;
  aplicar(yo.j, yo.ang, ALTURA_CADERA);
}
function aterrizar(yo, piso, vImp) {
  yo.y = piso; yo.vy = 0; yo.suelo = true; yo.vuela = false;
  if (vImp > 7) { yo.aterriza = 0.35; son("aterriza", yo.x, yo.z, clamp(vImp / 14, 0.3, 1)); polvo(yo.x, piso, yo.z, Math.round(vImp), clamp(vImp / 12, 0.6, 1.6)); }
  if (vImp > 14) { J.temblor = Math.max(J.temblor || 0, 0.4); onda(yo.x, piso, yo.z, 6, 0.6, "#d8d0ff"); anunciar({ tipo: "aterriza", x: yo.x, z: yo.z, radio: 18, fuerza: 0.6 }); if (!J.novia.dicho.cae) { J.novia.dicho.cae = 1; setTimeout(() => decirElla("¡Amor! ¿Te lastimaste? 😳"), 500); } }
}

/* ── golpes ── */
function golpes(yo, dt) {
  if (J.cinematica || yo.vuela && !J.dios.on) return;
  const g = yo.anim.golpe;
  if (!g && (E.golpe || E.golpeFuerte) && !yo.banca) {
    if (E.golpeFuerte) yo.anim.golpe = { tipo: J.dios.on ? "tierra" : "patada", t: 0, dur: J.dios.on ? 0.9 : 0.55 };
    else { yo.combo = (yo.combo + 1) % 2; yo.anim.golpe = { tipo: yo.combo ? "punoR" : "punoL", t: 0, dur: 0.38 }; }
    yo.golpeHecho = false;
    // un pasito adelante
    yo.vx += Math.sin(yo.ry) * 2.2; yo.vz += Math.cos(yo.ry) * 2.2;
    son("whoosh", yo.x, yo.z, 0.5);
    // si hay alguien cerca, voltea hacia él (ayuda a pegarle)
    const obj = J.objetivoGolpe && J.objetivoGolpe(yo, 3);
    if (obj) yo.ry = Math.atan2(obj.x - yo.x, obj.z - yo.z);
  }
  if (g && !yo.golpeHecho && g.t / g.dur > (g.tipo === "tierra" ? 0.55 : 0.4)) {
    yo.golpeHecho = true;
    const fuerte = g.tipo === "patada" || g.tipo === "tierra";
    const alcance = g.tipo === "tierra" ? 7 : fuerte ? 1.9 : 1.5;
    const hx = yo.x + Math.sin(yo.ry) * (g.tipo === "tierra" ? 0 : 1), hz = yo.z + Math.cos(yo.ry) * (g.tipo === "tierra" ? 0 : 1);
    const k = g.tipo === "tierra" ? 2.2 : fuerte ? (J.dios.on ? 1.6 : 1) : (J.dios.on ? 1 : 0.55);
    const pego = J.golpear && J.golpear({ x: hx, y: yo.y + 1, z: hz, r: alcance, k, dir: yo.ry, de: yo, circular: g.tipo === "tierra" });
    if (g.tipo === "tierra") {
      J.temblor = Math.max(J.temblor || 0, 0.9); son("boom", yo.x, yo.z, 0.8); onda(yo.x, yo.y, yo.z, 9, 0.7); onda(yo.x, yo.y, yo.z, 5, 0.5, "#ff9ec8"); polvo(yo.x, yo.y, yo.z, 24, 2); chispas(yo.x, yo.y + 0.2, yo.z, 30, 10, "oro");
      anunciar({ tipo: "explosion", x: yo.x, z: yo.z, radio: 30, fuerza: 1 }); J.caos += 6;
    } else if (pego) { son("golpe", hx, hz, k); J.temblor = Math.max(J.temblor || 0, 0.12 * k); }
  }
}
/* Que me peguen (balas sin Modo Dios, una explosión cerca…). */
export function recibirGolpe(dx, dz, k) {
  const yo = J.jugador; if (yo.coche) return;
  if (J.dios.on) { yo.escudo = 0.6; return; }
  yo.vx += dx * 6 * k; yo.vz += dz * 6 * k; yo.vy = Math.max(yo.vy, 2.5 * k); yo.suelo = false;
  yo.anim.impacto = 1; yo.stun = 0.4 * k;
  son("golpe", yo.x, yo.z, 0.6);
}

/* ══════════════════ ELLA ══════════════════ */
export function decirElla(txt, dur) { decir(txt, "ella", dur); globito(J.novia, txt.length > 34 ? txt.slice(0, 32) + "…" : txt, "ella", 2.8, 2.1); }
const LINEAS = {
  espera: ["Aquí te espero, amor 🤍", "Ve, yo te espero aquí 😌", "No te tardes, ¿eh? 🥺"],
  kdrama: ["Voy a ver un capítulo en lo que regresas 📱🥹", "Me pongo mi K-drama mientras 📱", "Ya empezó lo bueno del capítulo 😭"],
  vuelve: ["¡Volviste! 🥰", "Te extrañé, ¿eh? 🤍", "Ya, ya, vámonos juntitos 🤍"],
  vuela: ["¡¿Amor?! ¡Bájate de ahí! 😳", "¿Desde cuándo vuelas? 😳", "¡Ten cuidado allá arriba! 🥺"],
  miedo: ["¡Ay! ¡¿Qué fue eso?! 😱", "¡Amor! ¡Ten cuidado! 😳", "¡Me asusté! 😭"],
  busca: ["¿Amor? ¿Dónde estás? 🥺", "¿Amorcito…? 🥺", "¿Hola? ¿Te perdiste? 😢"],
  charla: ["Qué bonita está la noche, ¿verdad? 🌙", "¿Vamos a Angelos Burger? 🍔", "Me encanta caminar contigo 🤍", "Mira la luna, amor 🌙", "¿Ya viste a la parejita del K-drama? Como nosotros 🥹", "Te amo 🤍", "¿Te digo un secreto? …me encantas 🥰"],
  dios: ["¿Amor…? ¿Estás… brillando? 😳", "Ok… esto no es normal 😳✨"],
  luna: ["¡¿LA LUNA?! 😱", "Amor… la luna… 😨"],
  lunaVuelve: ["Uff… ya volvió. Qué susto 😮‍💨", "La luna se volvió a armar… ¿viste? 🥹"],
  portal: ["¿Eso fue un portal? 😳", "Amor… ¿quiénes eran esos? 😳"],
  ovni: ["¡Un ovni! ¡Amor, mira! 👽", "¿Viste eso en el cielo? 😳"],
};
export const lineaElla = (k) => elegir(LINEAS[k]);
function alEvento(ev) {
  const ella = J.novia, d = Math.hypot(ev.x - ella.x, ev.z - ella.z);
  const peligro = ["explosion", "choque", "rayo", "sismo", "ola", "balas", "tornado", "meteoro"].includes(ev.tipo);
  if (peligro && d < Math.max(14, ev.radio * 0.7) && ella.estado !== "huye") {
    ella.estado = "huye"; ella.te = rnd(2.5, 4); ella.miedoDe = { x: ev.x, z: ev.z }; ella.banca && (ella.banca.ocupada = null); ella.banca = null;
    if (J.t - (ella.ultMiedo || -99) > 8) { ella.ultMiedo = J.t; setTimeout(() => decirElla(lineaElla("miedo")), 250); }
    son("gritito", ella.x, ella.z, 1, true);
  }
  if (ev.tipo === "luna") { ella.estado = ella.estado === "sentada" ? "sentada" : "cielo"; ella.te = 10; }
}
export function actualizarElla(dt) {
  const ella = J.novia, yo = J.jugador, a = ella.anim;
  const dx = yo.x - ella.x, dz = yo.z - ella.z, d = Math.hypot(dx, dz);
  const alto = yo.y - ella.y;
  const veo = d < 45 && !yo.coche;
  if (veo) { ella.ultimaVista = { x: yo.x, z: yo.z }; ella.sinVerme = 0; } else ella.sinVerme += dt;
  let meta = null, rapido = false;
  ella.te -= dt;
  // ── decidir qué hace ──
  switch (ella.estado) {
    case "kdrama":   // la escena del inicio: los dos viendo la ventana
      if (yo.vel > 0.5 || d > 3) ella.estado = "sigue";
      break;
    case "sigue":
      if (yo.vuela && alto > 4) { ella.estado = "cielo"; ella.te = 6; if (!ella.dicho.vuela || J.t - ella.dicho.vuela > 30) { ella.dicho.vuela = J.t; setTimeout(() => decirElla(lineaElla("vuela")), 400); } break; }
      if (d > 26) { ella.estado = "espera"; ella.te = rnd(4, 7); if (J.t - (ella.dicho.espera || -99) > 40) { ella.dicho.espera = J.t; decirElla(lineaElla("espera")); } break; }
      // camina a mi lado: un poquito atrás y a la izquierda
      { const lado = Math.atan2(dx, dz); const ox = -Math.cos(lado) * 0.75 - Math.sin(lado) * (yo.vel > 0.5 ? 0.5 : 0.9), oz = Math.sin(lado) * 0.75 - Math.cos(lado) * (yo.vel > 0.5 ? 0.5 : 0.9); meta = { x: yo.x + ox, z: yo.z + oz }; rapido = yo.vel > 3.5 || d > 6; }
      break;
    case "espera":
      if (d < 7 && !yo.vuela) { ella.estado = "sigue"; if (J.t - (ella.dicho.vuelve || -99) > 30) { ella.dicho.vuelve = J.t; decirElla(lineaElla("vuelve")); } break; }
      if (ella.te < 0) {
        const b = bancas.filter((q) => !q.ocupada && Math.hypot(q.x - ella.x, q.z - ella.z) < 16).sort((p, q) => Math.hypot(p.x - ella.x, p.z - ella.z) - Math.hypot(q.x - ella.x, q.z - ella.z))[0];
        if (b) { ella.banca = b; b.ocupada = ella; ella.estado = "a_banca"; } else { ella.estado = "telefono"; }
      }
      if (ella.sinVerme > 25) { ella.estado = "busca"; ella.te = 0; }
      break;
    case "a_banca": {
      const b = ella.banca, sx = b.x + Math.sin(b.ry) * 0.25, sz = b.z + Math.cos(b.ry) * 0.25;
      b.sx = sx; b.sz = sz;
      meta = { x: sx, z: sz };
      if (Math.hypot(sx - ella.x, sz - ella.z) < 0.35) { ella.estado = "sentada"; ella.te = rnd(3, 6); if (J.t - (ella.dicho.kdrama || -99) > 60) { ella.dicho.kdrama = J.t; setTimeout(() => decirElla(lineaElla("kdrama")), 1200); } }
      if (d < 6 && !yo.banca) { ella.estado = "sigue"; b.ocupada = null; ella.banca = null; }
      break;
    }
    case "sentada":
    case "telefono":
      if (d < 5 && !yo.vuela && !yo.banca) { ella.estado = "sigue"; if (ella.banca) { ella.banca.ocupada = null; ella.banca = null; } if (J.t - (ella.dicho.vuelve || -99) > 30) { ella.dicho.vuelve = J.t; decirElla(lineaElla("vuelve")); } break; }
      if (ella.sinVerme > 40) { if (ella.banca) { ella.banca.ocupada = null; ella.banca = null; } ella.estado = "busca"; }
      break;
    case "cielo":
      if (!yo.vuela || alto < 3) { ella.estado = d > 26 ? "espera" : "sigue"; break; }
      if (d > 40) { meta = { x: yo.x, z: yo.z }; }
      break;
    case "huye": {
      const m = ella.miedoDe, ax = ella.x - m.x, az = ella.z - m.z, am = Math.hypot(ax, az) || 1;
      meta = { x: ella.x + (ax / am) * 6, z: ella.z + (az / am) * 6 }; rapido = true;
      if (ella.te < 0) ella.estado = d < 30 ? "sigue" : "busca";
      break;
    }
    case "busca":
      meta = ella.ultimaVista; rapido = false;
      if (veo && d < 30) { ella.estado = "sigue"; decirElla(lineaElla("vuelve")); break; }
      if (ella.te < 0) { ella.te = rnd(7, 11); decirElla(lineaElla("busca")); }
      if (Math.hypot(meta.x - ella.x, meta.z - ella.z) < 1.5) { ella.estado = "espera"; ella.te = 5; }
      break;
  }
  // ── moverse hacia la meta ──
  let vObj = 0, dirX = 0, dirZ = 0;
  if (meta) {
    const mx = meta.x - ella.x, mz = meta.z - ella.z, md = Math.hypot(mx, mz);
    if (md > 0.35) { dirX = mx / md; dirZ = mz / md; vObj = rapido ? Math.min(6, md * 1.6 + 2) : Math.min(2.6, md * 1.5 + 0.6); if (ella.estado === "sigue" && yo.vel > 0.5) vObj = Math.min(Math.max(vObj, yo.vel * (md > 1.2 ? 1.15 : 0.95)), 6.4); }
  }
  ella.vx = amort(ella.vx, dirX * vObj, 8, dt); ella.vz = amort(ella.vz, dirZ * vObj, 8, dt);
  ella.x += ella.vx * dt; ella.z += ella.vz * dt;
  chocarEdificios(ella, 0.3, ella.y);
  ella.vel = Math.hypot(ella.vx, ella.vz);
  const agua = J.nivelAgua ? J.nivelAgua(ella.x) : -1;   // con la ola, flota en su burbujita
  const piso = Math.max(alturaSuelo(ella.x, ella.z, ella.y + 0.3), agua > 0 ? agua + 0.4 : -1); ella.y = amort(ella.y, piso, agua > 0 ? 3 : 20, dt);
  // hacia dónde mira
  let mira = null;
  if (ella.vel > 0.3) mira = Math.atan2(ella.vx, ella.vz);
  else if (ella.estado === "sentada" && ella.banca) mira = ella.banca.ry;
  else if (ella.estado === "kdrama") mira = Math.atan2(lugares.kdrama.x - ella.x, lugares.kdrama.z - ella.z) + 0.0;
  else if (d < 30) mira = Math.atan2(dx, dz);
  if (mira != null) ella.ry = amortAng(ella.ry, mira, 6, dt);
  // la cabeza la sigue mirándome (si no está en el teléfono)
  const haciaMi = Math.atan2(dx, dz);
  a.mirarY = amort(a.mirarY, ella.estado === "sentada" || ella.estado === "telefono" ? 0 : clamp(difAng(haciaMi, ella.ry), -1.1, 1.1), 4, dt);
  // las poses
  if (ella.vel > 0.3) a.fase += dt * ella.vel * (ella.vel > 3 ? 2.2 : 3.1);
  a.vel = ella.vel;
  a.sentado = amort(a.sentado, ella.estado === "sentada" ? 1 : 0, 4, dt);
  a.tel = amort(a.tel, (ella.estado === "sentada" || ella.estado === "telefono") ? 1 : 0, 3, dt);
  a.arriba = amort(a.arriba, ella.estado === "cielo" || (J.lunaEvento && J.lunaEvento.activo) ? 1 : 0, 3, dt);
  a.miedo = amort(a.miedo, ella.estado === "huye" ? 1 : 0, 6, dt);
  a.habla = amort(a.habla, ella.hablando > 0 ? 1 : 0, 5, dt); ella.hablando = Math.max(0, (ella.hablando || 0) - dt);
  a.abraza = amort(a.abraza, ella.abrazaT > 0 ? 1 : 0, 5, dt); if (ella.abrazaT > 0) ella.abrazaT -= dt;
  a.saluda = amort(a.saluda, ella.saludaT > 0 ? 1 : 0, 6, dt); if (ella.saludaT > 0) ella.saludaT -= dt;
  if (ella.estado === "sentada" && ella.banca) { ella.x = amort(ella.x, ella.banca.sx, 8, dt); ella.z = amort(ella.z, ella.banca.sz, 8, dt); }
  // de la mano: si vamos los dos despacito y juntos
  ella.mano = amort(ella.mano, ella.estado === "sigue" && d < 1.5 && yo.vel < 3.2 && !yo.vuela && yo.suelo && !yo.anim.golpe ? 1 : 0, 4, dt);
  animar(ella, dt, 11);
  if (ella.mano > 0.3) { ella.ang.hRZ = lerp(ella.ang.hRZ, 0.42, ella.mano); ella.ang.hRX = lerp(ella.ang.hRX, 0.2, ella.mano); ella.ang.cRX = lerp(ella.ang.cRX, 0.25, ella.mano); }
  // su melena se mueve con ella
  if (ella.j.melena) ella.j.melena.rotation.x = amort(ella.j.melena.rotation.x, clamp(ella.vel * 0.06, 0, 0.35) + Math.sin(J.t * 2) * 0.03, 6, dt);
  ella.j.raiz.position.set(ella.x, ella.y, ella.z); ella.j.raiz.rotation.y = ella.ry;
  aplicar(ella.j, ella.ang, ALTURA_CADERA);
  // platica de vez en cuando
  if (ella.estado === "sigue" && !J.dios.on) { ella.charla -= dt; if (ella.charla < 0) { ella.charla = rnd(35, 60); ella.hablando = 2.5; decirElla(lineaElla("charla")); } }
}
void TAU; void V; void corazones;
