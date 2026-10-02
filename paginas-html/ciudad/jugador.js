/*
 * YO Y ELLA.
 *
 * Yo: aceleración, frenado e inercia suaves; giro progresivo; salto con
 * «tiempo de coyote»; aterrizajes que se notan; con Modo Dios, vuelo libre.
 * Golpe básico (combo izquierda-derecha), golpe fuerte (patada; con Modo
 * Dios, un golpe al piso con onda). Las cosas que llevan su tiempo se hacen
 * con su animación completa, sin saltos:
 *   · subir al coche: camina a la puerta, la abre, se sienta, la cierra;
 *     bajar es al revés. Mientras maneja se le ve adentro, con las manos en
 *     el volante.
 *   · sentarse en una banca: llega, se voltea y se sienta despacito;
 *     al moverse, se levanta.
 *
 * Ella: no es un adorno. Me sigue y camina conmigo (si vamos despacio, de
 * la mano), me espera si me alejo, se sienta en una banca a ver K-dramas,
 * mira al cielo si vuelo, se asusta y se aleja del peligro, me busca si
 * desaparezco. Si me subo a un coche y está cerca, se sube conmigo (por su
 * puerta, de copiloto). Las actividades juntos (selfie, bailar, ver el
 * cielo…) las dirige pareja.js.
 *
 * Lo que dice sale en un globito sobre su cabeza, y sólo si está cerca:
 * nada de cajas de texto a cada rato.
 */
import { J, THREE, clamp, lerp, amort, amortAng, difAng, rnd, elegir, anunciar, oir, TAU } from "./base.js";
import { crearProtagonista, nuevaAnim, animar, aplicar, ALTURA_CADERA } from "./cuerpos.js";
import { alturaSuelo, chocarEdificios, lugares, bancas, BORDE_MUNDO } from "./mundo.js";
import { son, bucleEn } from "./audio.js";
import { polvo, brillos, corazones, onda, chispas } from "./efectos.js";
import { E, decir, globito, pista } from "./ui.js";
import { puerta, puntoDelCoche, subirAlCoche, bajarDelCoche, prepararParaSubir } from "./vehiculos.js";
import { cam, mirarDesdeBanca } from "./camara.js";

const V = new THREE.Vector3(), P = {};
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
  ella.ry = Math.PI / 2; ella.estado = "kdrama"; ella.te = 0; ella.dicho = {}; ella.miedoT = 0; ella.ultimaVista = { x: p.x, z: p.z }; ella.sinVerme = 0; ella.mano = 0; ella.charla = rnd(50, 80);
  J.novia = ella;
  oir(alEvento);
}

export function camaraAdelante() { const y = J.camYaw || 0; return [-Math.sin(y), -Math.cos(y)]; }
/* El dedo, convertido en una dirección del mundo (vista desde la cámara). */
function direccion() {
  const [fx, fz] = camaraAdelante(), rx = -fz, rz = fx;
  let dx = rx * E.mx - fx * E.mz, dz = rz * E.mx - fz * E.mz;
  const m = Math.hypot(dx, dz); if (m > 0.01) { dx /= m; dz /= m; }
  return [dx, dz, Math.min(1, m)];
}

/* ── subir / bajar del coche ── */
export function empezarSubir(c) {
  const yo = J.jugador;
  if (yo.subir || yo.bajar || yo.coche) return;
  yo.subir = { c, fase: "ir", t: 0 };
  prepararParaSubir(c);
  if (yo.banca) levantarse();
  J.alSubirCoche && J.alSubirCoche(c);
}
export function empezarBajar() {
  const yo = J.jugador; if (!yo.coche || yo.bajar) return;
  const c = yo.coche;
  yo.bajar = { c, fase: "abrir", t: 0 };
  c.vel = 0;
  J.alBajarCoche && J.alBajarCoche(c);
}
function puntoPuerta(c, s, fuera) { return puntoDelCoche(c, s * (c.T.A / 2 + 0.55), 0, c.m.asiento[2] + 0.25, fuera); }
function puntoAsiento(c, s, fuera) { const a = c.m.asiento; return puntoDelCoche(c, s * a[0], a[1], a[2], fuera); }
function secuenciaCoche(yo, dt) {
  const q = yo.subir || yo.bajar; q.t += dt;
  const c = q.c, pp = puntoPuerta(c, 1, {}), pa = puntoAsiento(c, 1, {});
  if (yo.subir) {
    if (q.fase === "ir") {
      const dx = pp.x - yo.x, dz = pp.z - yo.z, d = Math.hypot(dx, dz);
      if (d < 0.22 || q.t > 2.6) { q.fase = "abrir"; q.t = 0; q.x0 = yo.x; q.z0 = yo.z; puerta(c, 1, true); }
      else { const v = Math.min(2.6, d * 3 + 0.6); yo.vx = dx / d * v; yo.vz = dz / d * v; yo.x += yo.vx * dt; yo.z += yo.vz * dt; yo.ry = amortAng(yo.ry, Math.atan2(dx, dz), 10, dt); yo.vel = v; yo.anim.vel = v; yo.anim.fase += dt * v * 2.9; }
    } else if (q.fase === "abrir") {
      yo.x = lerp(q.x0, pp.x, Math.min(1, q.t / 0.3)); yo.z = lerp(q.z0, pp.z, Math.min(1, q.t / 0.3)); yo.vel = 0; yo.anim.vel = 0;
      yo.ry = amortAng(yo.ry, c.ry + Math.PI, 8, dt);   // de espaldas al asiento
      if (q.t > 0.4) { q.fase = "entrar"; q.t = 0; q.y0 = yo.y; }
    } else if (q.fase === "entrar") {
      const k = Math.min(1, q.t / 0.75), s = k * k * (3 - 2 * k);
      yo.x = lerp(pp.x, pa.x, s); yo.z = lerp(pp.z, pa.z, s); yo.y = lerp(q.y0, pa.y, s);
      yo.ry = amortAng(yo.ry, c.ry, 5, dt);
      yo.anim.sentado = Math.max(yo.anim.sentado, Math.min(1, k * 1.6));
      if (k >= 1) { q.fase = "cerrar"; q.t = 0; puerta(c, 1, false); subirAlCoche(c); }
    } else if (q.fase === "cerrar") { if (q.t > 0.3) yo.subir = null; }
  } else {
    if (q.fase === "abrir") { puerta(c, 1, true); if (q.t > 0.35) { q.fase = "salir"; q.t = 0; bajarDelCoche(); } }
    else if (q.fase === "salir") {
      const k = Math.min(1, q.t / 0.7), s = k * k * (3 - 2 * k);
      yo.x = lerp(pa.x, pp.x, s); yo.z = lerp(pa.z, pp.z, s); yo.y = lerp(pa.y, alturaSuelo(pp.x, pp.z, 0.5), s);
      yo.ry = amortAng(yo.ry, c.ry + Math.PI / 2, 6, dt);
      yo.anim.sentado = Math.min(yo.anim.sentado, 1 - k);
      if (k >= 1) { q.fase = "cerrar"; q.t = 0; puerta(c, 1, false); }
    } else if (q.fase === "cerrar") { if (q.t > 0.3) yo.bajar = null; }
  }
}

/* ── sentarse en una banca y levantarse ── */
export function sentarseEn(b) {
  const yo = J.jugador; if (yo.sentarse || yo.banca) return;
  const fx = Math.sin(b.ry), fz = Math.cos(b.ry), cx = Math.cos(b.ry), sz = -Math.sin(b.ry);
  b.ocupada = yo;
  // mi lugar: la mitad izquierda de la banca (la otra es para ella)
  const sx = b.x + fx * 0.06 + cx * 0.42, szz = b.z + fz * 0.06 + sz * 0.42;
  yo.sentarse = { b, fase: "ir", t: 0, sx, sz: szz, ax: sx + fx * 0.55, az: szz + fz * 0.55 };
}
export function levantarse() {
  const yo = J.jugador; if (!yo.banca) return;
  yo.levantarse = { b: yo.banca, t: 0, x0: yo.x, z0: yo.z };
  yo.banca.ocupada = null; yo.banca = null;
  mirarDesdeBanca(null);
  J.alLevantarse && J.alLevantarse();
}
function secuenciaBanca(yo, dt) {
  if (yo.sentarse) {
    const q = yo.sentarse; q.t += dt;
    if (q.fase === "ir") {
      const dx = q.ax - yo.x, dz = q.az - yo.z, d = Math.hypot(dx, dz);
      if (d < 0.15 || q.t > 3) { q.fase = "girar"; q.t = 0; }
      else { const v = Math.min(2.4, d * 3 + 0.5); yo.vx = dx / d * v; yo.vz = dz / d * v; yo.x += yo.vx * dt; yo.z += yo.vz * dt; yo.ry = amortAng(yo.ry, Math.atan2(dx, dz), 10, dt); yo.vel = v; yo.anim.vel = v; yo.anim.fase += dt * v * 2.9; }
    } else if (q.fase === "girar") {
      yo.vel = yo.anim.vel = 0; yo.ry = amortAng(yo.ry, q.b.ry, 9, dt);
      if (Math.abs(difAng(yo.ry, q.b.ry)) < 0.12 || q.t > 0.6) { q.fase = "sentar"; q.t = 0; q.x0 = yo.x; q.z0 = yo.z; }
    } else {
      const k = Math.min(1, q.t / 0.8), s = k * k * (3 - 2 * k);
      yo.x = lerp(q.x0, q.sx, s); yo.z = lerp(q.z0, q.sz, s); yo.ry = amortAng(yo.ry, q.b.ry, 9, dt);
      yo.anim.sentado = s;
      if (k >= 1) { yo.banca = q.b; q.b.sx = q.sx; q.b.sz = q.sz; yo.sentarse = null; mirarDesdeBanca(q.b); J.alSentarse && J.alSentarse(q.b); }
    }
    return true;
  }
  if (yo.levantarse) {
    const q = yo.levantarse; q.t += dt;
    const k = Math.min(1, q.t / 0.6), fx = Math.sin(q.b.ry), fz = Math.cos(q.b.ry);
    yo.x = q.x0 + fx * 0.5 * k; yo.z = q.z0 + fz * 0.5 * k;
    yo.anim.sentado = 1 - k;
    if (k >= 1) yo.levantarse = null;
    return true;
  }
  return false;
}

export function actualizarJugador(dt) {
  const yo = J.jugador, dios = J.dios.on;
  yo.oculta = false;
  // ── en el coche (o subiendo / bajando) ──
  if (yo.subir || yo.bajar) {
    secuenciaCoche(yo, dt);
    terminar(yo, dt);
    return;
  }
  if (yo.coche) {
    const c = yo.coche, pa = puntoAsiento(c, 1, P);
    yo.x = pa.x; yo.z = pa.z; yo.y = pa.y; yo.ry = c.ry; yo.vel = 0; yo.vx = yo.vz = 0;
    yo.anim.sentado = 1; yo.anim.maneja = amort(yo.anim.maneja || 0, 1, 6, dt); yo.anim.vel = 0;
    yo.anim.volante = clamp((c.rgiro || 0) * 1.5, -0.6, 0.6);
    // si el coche se voltea o vuela, me salgo
    if (c.estado !== "conducido") { bajarDelCoche(true); yo.anim.sentado = 0; }
    terminar(yo, dt, c);
    return;
  }
  yo.anim.maneja = amort(yo.anim.maneja || 0, 0, 6, dt);
  // ── sentarse / levantarse (con su animación) ──
  if (secuenciaBanca(yo, dt)) { terminar(yo, dt); return; }
  const [dx, dz, mag] = cam.modo === "dron" || J.actividad ? [0, 0, 0] : direccion();
  const ocupado = yo.stun > 0 || (yo.anim.golpe && yo.anim.golpe.tipo === "tierra") || J.cinematica || J.actividad;
  const fuerza = ocupado ? 0 : (cam.modo === "dron" ? 0 : E.mag || mag);
  if (yo.stun > 0) yo.stun -= dt;
  if (yo.banca) {
    yo.vx = yo.vz = 0; yo.vel = 0;
    yo.x = amort(yo.x, yo.banca.sx, 8, dt); yo.z = amort(yo.z, yo.banca.sz, 8, dt); yo.ry = amortAng(yo.ry, yo.banca.ry, 8, dt);
    yo.anim.sentado = amort(yo.anim.sentado, 1, 6, dt);
    if (fuerza > 0.3 || (E.saltar && cam.modo !== "dron")) levantarse();
    terminar(yo, dt);
    return;
  }
  if (yo.vuela) {
    // ── VOLAR ──
    const vmax = E.correr ? 26 : 16, acel = 9;
    yo.vx = amort(yo.vx, dx * fuerza * vmax, fuerza > 0 ? acel / vmax * 3 : 1.6, dt);
    yo.vz = amort(yo.vz, dz * fuerza * vmax, fuerza > 0 ? acel / vmax * 3 : 1.6, dt);
    const sube = cam.modo === "dron" ? 0 : (E.subir ? 1 : 0) - (E.bajar ? 1 : 0);
    yo.vy = amort(yo.vy, sube * 9 + Math.sin(J.t * 2) * 0.3, 3, dt);
    yo.x += yo.vx * dt; yo.z += yo.vz * dt; yo.y += yo.vy * dt;
    yo.y = clamp(yo.y, 0, 90);
    const piso = Math.max(alturaSuelo(yo.x, yo.z, yo.y + 0.5), J.nivelAgua ? J.nivelAgua(yo.x) : -1);
    if (yo.y <= piso + 0.05 && sube < 0) aterrizar(yo, piso, 2);
    else if (yo.y < piso) yo.y = piso;
    if (!dios) { yo.vuela = false; yo.suelo = false; }
    const h = Math.hypot(yo.vx, yo.vz);
    if (h > 0.4) yo.ry = amortAng(yo.ry, Math.atan2(yo.vx, yo.vz), 4, dt);
    yo.anim.vuelo = amort(yo.anim.vuelo, 1, 5, dt); yo.anim.velVuelo = h; yo.anim.vel = 0; yo.anim.aire = 0;
    bucleEn("vuelo", clamp(h / 26, 0, 1) * 0.22 + 0.02);
    if (h > 12 && Math.random() < dt * 30) brillos(yo.x - yo.vx * 0.05, yo.y + 1, yo.z - yo.vz * 0.05, 1, Math.random() < 0.5 ? "oro" : "rosa", 0.3, 0.4);
  } else {
    // ── CAMINAR / CORRER ──
    bucleEn("vuelo", 0);
    yo.anim.vuelo = amort(yo.anim.vuelo, 0, 6, dt);
    const corre = E.correr || fuerza > 0.88;
    const vmax = (corre ? 6.4 : 2.7 * Math.max(0.55, fuerza / 0.85)) * (dios ? 1.25 : 1);
    const obj = fuerza > 0.08 ? vmax : 0;
    const k = yo.suelo ? (obj > yo.vel ? 9 : 12) : 2.2;
    yo.vx = amort(yo.vx, dx * obj, k, dt); yo.vz = amort(yo.vz, dz * obj, k, dt);
    if (yo.anim.golpe) { yo.vx *= Math.exp(-10 * dt); yo.vz *= Math.exp(-10 * dt); }
    yo.vel = Math.hypot(yo.vx, yo.vz);
    if (yo.vel > 0.3 && fuerza > 0.08) yo.ry = amortAng(yo.ry, Math.atan2(dx, dz), corre ? 9 : 11, dt);
    if (E.saltar && !ocupado && cam.modo !== "dron") {
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
      if (yo.suelo && yo.y - piso > 0.25) yo.suelo = false;
      if (!yo.suelo) yo.coyote -= dt;
      if (yo.suelo && yo.y - piso <= 0.25) yo.y = piso;   // escalones (la banqueta)
    }
    yo.anim.aire = amort(yo.anim.aire, yo.suelo ? 0 : 1, 10, dt);
    yo.anim.vel = yo.suelo ? yo.vel : yo.anim.vel;
    if (yo.suelo && yo.vel > 0.6) { const antes = yo.anim.fase; yo.anim.fase += dt * yo.vel * (yo.vel > 3 ? 2.1 : 2.9); if (Math.floor(antes / Math.PI) !== Math.floor(yo.anim.fase / Math.PI)) son("paso", yo.x, yo.z, yo.vel > 3 ? 1 : 0.6); }
  }
  // no atravesar paredes ni salirse del mundo
  chocarEdificios(yo, 0.35, yo.y);
  const lim = yo.vuela || yo.y > 3 ? 150 : BORDE_MUNDO;
  yo.x = clamp(yo.x, -lim, lim); yo.z = clamp(yo.z, -lim, lim);
  golpes(yo, dt);
  yo.anim.sentado = amort(yo.anim.sentado, 0, 6, dt);
  terminar(yo, dt);
}
/* Lo de siempre al final de cada cuadro: animación y huesos en su lugar. */
function terminar(yo, dt, coche) {
  yo.anim.cargar = amort(yo.anim.cargar, J.levantando ? 1 : 0, 8, dt);
  yo.anim.apunta = amort(yo.anim.apunta, J.cargandoPoder ? 1 : 0, 10, dt);
  yo.anim.poder = Math.max(0, yo.anim.poder - dt * 0.7);
  yo.anim.abraza = amort(yo.anim.abraza, yo.abrazaT > 0 ? 1 : 0, 6, dt); if (yo.abrazaT > 0) yo.abrazaT -= dt;
  if (yo.aterriza > 0) yo.aterriza -= dt;
  yo.anim.agacha = Math.max(yo.aterriza > 0 ? yo.aterriza * 3 : 0, 0);
  const ella = J.novia;
  yo.anim.mirarY = amort(yo.anim.mirarY, yo.mirar != null ? clamp(difAng(yo.mirar, yo.ry), -1, 1) : 0, 4, dt);
  animar(yo, dt, yo.vuela ? 7 : 12);
  if (ella.mano > 0.3 && yo.vel < 3.2 && !coche) { yo.ang.hLZ = lerp(yo.ang.hLZ, 0.42, ella.mano); yo.ang.hLX = lerp(yo.ang.hLX, 0.2, ella.mano); yo.ang.cLX = lerp(yo.ang.cLX, 0.25, ella.mano); }
  yo.j.raiz.position.set(yo.x, yo.y, yo.z);
  if (coche) yo.j.raiz.quaternion.copy(coche.m.raiz.quaternion); else yo.j.raiz.rotation.set(0, yo.ry, 0);
  aplicar(yo.j, yo.ang, ALTURA_CADERA);
}
function aterrizar(yo, piso, vImp) {
  yo.y = piso; yo.vy = 0; yo.suelo = true; yo.vuela = false;
  if (vImp > 7) { yo.aterriza = 0.35; son("aterriza", yo.x, yo.z, clamp(vImp / 14, 0.3, 1)); polvo(yo.x, piso, yo.z, Math.round(vImp), clamp(vImp / 12, 0.6, 1.6)); }
  if (vImp > 14) { J.temblor = Math.max(J.temblor || 0, 0.4); onda(yo.x, piso, yo.z, 6, 0.6, "#d8d0ff"); anunciar({ tipo: "aterriza", x: yo.x, z: yo.z, radio: 18, fuerza: 0.6 }); }
}

/* ── golpes ── */
function golpes(yo, dt) {
  if (J.cinematica || J.actividad || (yo.vuela && !J.dios.on) || cam.modo === "dron") return;
  const g = yo.anim.golpe;
  if (!g && (E.golpe || E.golpeFuerte) && !yo.banca) {
    if (E.golpeFuerte) yo.anim.golpe = { tipo: J.dios.on ? "tierra" : "patada", t: 0, dur: J.dios.on ? 0.9 : 0.55 };
    else { yo.combo = (yo.combo + 1) % 2; yo.anim.golpe = { tipo: yo.combo ? "punoR" : "punoL", t: 0, dur: 0.38 }; }
    yo.golpeHecho = false;
    yo.vx += Math.sin(yo.ry) * 2.2; yo.vz += Math.cos(yo.ry) * 2.2;
    son("whoosh", yo.x, yo.z, 0.5);
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
  const yo = J.jugador; if (yo.coche || yo.banca) return;
  if (J.dios.on) { yo.escudo = 0.6; return; }
  yo.vx += dx * 6 * k; yo.vz += dz * 6 * k; yo.vy = Math.max(yo.vy, 2.5 * k); yo.suelo = false;
  yo.anim.impacto = 1; yo.stun = 0.4 * k;
  son("golpe", yo.x, yo.z, 0.6);
}

/* ══════════════════ ELLA ══════════════════ */
/* Lo que dice: un globito sobre ella (si está cerca); si es importante, también abajo. */
export function decirElla(txt, importante = false) {
  const ella = J.novia; if (ella.estado === "fuera" || ella.oculta) return;
  ella.hablando = Math.max(ella.hablando || 0, 1.6);
  decir(txt, "ella", importante ? Math.max(2800, txt.length * 60) : undefined);
}
const LINEAS = {
  espera: ["Aquí te espero, amor 🤍", "Ve, yo te espero aquí 😌", "No te tardes, ¿eh? 🥺"],
  kdrama: ["Voy a ver un capítulo en lo que regresas 📱🥹", "Me pongo mi K-drama mientras 📱", "Ya empezó lo bueno del capítulo 😭"],
  vuelve: ["¡Volviste! 🥰", "Te extrañé, ¿eh? 🤍", "Ya, ya, vámonos juntitos 🤍"],
  vuela: ["¡¿Amor?! ¡Bájate de ahí! 😳", "¿Desde cuándo vuelas? 😳", "¡Ten cuidado allá arriba! 🥺"],
  miedo: ["¡Ay! ¡¿Qué fue eso?! 😱", "¡Amor! ¡Ten cuidado! 😳", "¡Me asusté! 😭"],
  busca: ["¿Amor? ¿Dónde estás? 🥺", "¿Amorcito…? 🥺", "¿Hola? ¿Te perdiste? 😢"],
  charla: ["Qué bonita está la noche, ¿verdad? 🌙", "¿Vamos a Angelos Burger? 🍔", "Me encanta caminar contigo 🤍", "Mira la luna, amor 🌙", "¿Ya viste a la parejita del K-drama? Como nosotros 🥹", "Te amo 🤍", "¿Te digo un secreto? …me encantas 🥰", "Así me imaginaba caminar contigo 🤍", "Falta poquito para vernos de verdad 🥹"],
  dia: ["Qué bonito día para caminar contigo ☀️", "¿Vamos por un helado? 🍦", "Hasta los edificios se ven felices hoy ☀️"],
  tarde: ["Mira el cielo, amor… está rosita 🌇", "Me encantan los atardeceres contigo 🌇"],
  auto: ["¡Vámonos! 🚗", "Yo pongo la música 🎶", "Maneja con cuidadito, ¿eh? 🥺", "¿A dónde me llevas? 🥰"],
  luna: ["¡¿LA LUNA?! 😱", "Amor… la luna… 😨"],
  lunaVuelve: ["Uff… ya volvió. Qué susto 😮‍💨", "La luna se volvió a armar… ¿viste? 🥹"],
  portal: ["¿Eso fue un portal? 😳", "Amor… ¿quiénes eran esos? 😳"],
  ovni: ["¡Un ovni! ¡Amor, mira! 👽", "¿Viste eso en el cielo? 😳"],
};
export const lineaElla = (k) => elegir(LINEAS[k]);
function alEvento(ev) {
  const ella = J.novia, d = Math.hypot(ev.x - ella.x, ev.z - ella.z);
  if (["fuera", "bano", "en_auto", "al_auto", "actividad"].includes(ella.estado)) return;
  const peligro = ["explosion", "choque", "rayo", "sismo", "ola", "balas", "tornado", "meteoro"].includes(ev.tipo);
  if (peligro && d < Math.max(14, ev.radio * 0.7) && ella.estado !== "huye") {
    ella.estado = "huye"; ella.te = rnd(2.5, 4); ella.miedoDe = { x: ev.x, z: ev.z }; dejarBanca(ella);
    if (J.t - (ella.ultMiedo || -99) > 10) { ella.ultMiedo = J.t; setTimeout(() => decirElla(lineaElla("miedo")), 250); }
    son("gritito", ella.x, ella.z, 1, true);
  }
  if (ev.tipo === "luna" && ella.estado !== "sentada") { ella.estado = "cielo"; ella.te = 10; }
}
function dejarBanca(ella) { if (ella.banca) { if (ella.banca.ocupada === ella) ella.banca.ocupada = null; ella.banca = null; } }
/* Que se suba conmigo (si está cerca y puede). */
J.alSubirCoche = (c) => {
  const ella = J.novia, yo = J.jugador;
  if (Math.hypot(ella.x - yo.x, ella.z - yo.z) > 9 || !["sigue", "espera", "sentada", "telefono", "kdrama", "busca", "cielo"].includes(ella.estado) || !c.m.puertas.length) return;
  dejarBanca(ella);
  ella.estado = "al_auto"; ella.coche = c; ella.subir = { fase: "ir", t: 0 };
  setTimeout(() => decirElla(lineaElla("auto")), 900);
};
J.alBajarCoche = (c) => { const ella = J.novia; if (ella.coche === c && ella.estado === "en_auto") { ella.estado = "bajar_auto"; ella.subir = { fase: "abrir", t: 0 }; } };
J.esperandoElla = () => J.novia.estado === "al_auto";
function autoElla(ella, dt) {
  const c = ella.coche, q = ella.subir; q.t += dt;
  const pp = puntoPuerta(c, -1, {}), pa = puntoAsiento(c, -1, {});
  if (ella.estado === "al_auto") {
    if (q.fase === "ir") {
      const dx = pp.x - ella.x, dz = pp.z - ella.z, d = Math.hypot(dx, dz);
      if (d < 0.22 || q.t > 6) { q.fase = "abrir"; q.t = 0; q.x0 = ella.x; q.z0 = ella.z; puerta(c, -1, true); return null; }
      const v = Math.min(3.2, d * 2 + 0.8); return { x: ella.x + dx / d * v * 0.5, z: ella.z + dz / d * v * 0.5, rapido: d > 3 };
    }
    if (q.fase === "abrir") { ella.x = lerp(q.x0, pp.x, Math.min(1, q.t / 0.3)); ella.z = lerp(q.z0, pp.z, Math.min(1, q.t / 0.3)); ella.ry = amortAng(ella.ry, c.ry + Math.PI, 8, dt); if (q.t > 0.4) { q.fase = "entrar"; q.t = 0; q.y0 = ella.y; } return "fijo"; }
    if (q.fase === "entrar") {
      const k = Math.min(1, q.t / 0.75), s = k * k * (3 - 2 * k);
      ella.x = lerp(pp.x, pa.x, s); ella.z = lerp(pp.z, pa.z, s); ella.y = lerp(q.y0, pa.y, s); ella.ry = amortAng(ella.ry, c.ry, 5, dt);
      ella.anim.sentado = Math.max(ella.anim.sentado, Math.min(1, k * 1.6));
      if (k >= 1) { q.fase = "cerrar"; q.t = 0; puerta(c, -1, false); }
      return "fijo";
    }
    if (q.fase === "cerrar" && q.t > 0.3) { ella.estado = "en_auto"; }
    return "fijo";
  }
  if (ella.estado === "en_auto") return "auto";
  // bajar
  if (q.fase === "abrir") { puerta(c, -1, true); if (q.t > 0.35) { q.fase = "salir"; q.t = 0; } return "auto"; }
  if (q.fase === "salir") {
    const k = Math.min(1, q.t / 0.7), s = k * k * (3 - 2 * k);
    ella.x = lerp(pa.x, pp.x, s); ella.z = lerp(pa.z, pp.z, s); ella.y = lerp(pa.y, alturaSuelo(pp.x, pp.z, 0.5), s); ella.ry = amortAng(ella.ry, c.ry - Math.PI / 2, 6, dt);
    ella.anim.sentado = Math.min(ella.anim.sentado, 1 - k);
    if (k >= 1) { q.fase = "cerrar"; q.t = 0; puerta(c, -1, false); }
    return "fijo";
  }
  if (q.t > 0.3) { ella.estado = "sigue"; ella.coche = null; ella.subir = null; }
  return "fijo";
}

export function actualizarElla(dt) {
  const ella = J.novia, yo = J.jugador, a = ella.anim;
  const dx = yo.x - ella.x, dz = yo.z - ella.z, d = Math.hypot(dx, dz);
  const alto = yo.y - ella.y;
  const veo = d < 45 && !yo.coche;
  if (veo) { ella.ultimaVista = { x: yo.x, z: yo.z }; ella.sinVerme = 0; } else ella.sinVerme += dt;
  let meta = null, rapido = false, fijo = false, enAuto = null;
  ella.te -= dt;
  // ── las cosas que no son caminar ──
  if (ella.estado === "fuera") { ella.j.raiz.visible = false; ella.oculta = true; return; }
  ella.oculta = false; ella.j.raiz.visible = true;
  if (["al_auto", "en_auto", "bajar_auto"].includes(ella.estado)) {
    const r = autoElla(ella, dt);
    if (r === "auto") { enAuto = ella.coche; const pa = puntoAsiento(enAuto, -1, P); ella.x = pa.x; ella.z = pa.z; ella.y = pa.y; ella.ry = enAuto.ry; a.sentado = 1; fijo = true; }
    else if (r === "fijo") fijo = true;
    else if (r) { meta = r; rapido = r.rapido; }
  } else if (ella.estado === "actividad" || ella.estado === "bano") {
    const r = J.pareja && J.pareja.mover(ella, dt);
    if (r === "fijo") fijo = true; else if (r) { meta = r; rapido = r.rapido; }
  } else switch (ella.estado) {
    case "kdrama":   // la escena del inicio: los dos viendo la ventana
      if (yo.vel > 0.5 || d > 3) ella.estado = "sigue";
      break;
    case "sigue":
      if (yo.vuela && alto > 4) { ella.estado = "cielo"; ella.te = 6; if (J.t - (ella.dicho.vuela || -99) > 40) { ella.dicho.vuela = J.t; setTimeout(() => decirElla(lineaElla("vuela")), 400); } break; }
      if (d > 26 || yo.coche) { ella.estado = "espera"; ella.te = rnd(4, 7); if (J.t - (ella.dicho.espera || -99) > 50) { ella.dicho.espera = J.t; decirElla(lineaElla("espera")); } break; }
      // camina a mi lado: un poquito atrás y a la izquierda
      { const lado = Math.atan2(dx, dz); const ox = -Math.cos(lado) * 0.75 - Math.sin(lado) * (yo.vel > 0.5 ? 0.5 : 0.9), oz = Math.sin(lado) * 0.75 - Math.cos(lado) * (yo.vel > 0.5 ? 0.5 : 0.9); meta = { x: yo.x + ox, z: yo.z + oz }; rapido = yo.vel > 3.5 || d > 6; }
      break;
    case "espera":
      if (d < 7 && !yo.vuela && !yo.coche) { ella.estado = "sigue"; if (J.t - (ella.dicho.vuelve || -99) > 40) { ella.dicho.vuelve = J.t; decirElla(lineaElla("vuelve")); } break; }
      if (ella.te < 0) {
        const b = bancas.filter((q) => !q.ocupada && Math.hypot(q.x - ella.x, q.z - ella.z) < 16).sort((p, q) => Math.hypot(p.x - ella.x, p.z - ella.z) - Math.hypot(q.x - ella.x, q.z - ella.z))[0];
        if (b) { ella.banca = b; b.ocupada = ella; ella.estado = "a_banca"; ella.sola = true; } else { ella.estado = "telefono"; }
      }
      if (ella.sinVerme > 25) { ella.estado = "busca"; ella.te = 0; }
      break;
    case "a_banca": {
      const b = ella.banca; if (!b) { ella.estado = "sigue"; break; }
      const sx = b.ex ?? b.x + Math.sin(b.ry) * 0.06, sz = b.ez ?? b.z + Math.cos(b.ry) * 0.06;
      const fx = Math.sin(b.ry), fz = Math.cos(b.ry);
      const ax = sx + fx * 0.55, az = sz + fz * 0.55, da = Math.hypot(ax - ella.x, az - ella.z);
      if (da > 0.18 && !ella.sentandose) meta = { x: ax, z: az };
      else {
        // ya llegó: se voltea y se sienta despacito
        ella.sentandose = (ella.sentandose || 0) + dt; fijo = true;
        ella.ry = amortAng(ella.ry, b.ry, 9, dt);
        const k = clamp((ella.sentandose - 0.35) / 0.8, 0, 1), s = k * k * (3 - 2 * k);
        ella.x = lerp(ax, sx, s); ella.z = lerp(az, sz, s); a.sentado = Math.max(a.sentado, s);
        if (k >= 1) { ella.estado = "sentada"; ella.sentandose = 0; b.esx = sx; b.esz = sz; ella.te = rnd(3, 6); if (ella.sola && J.t - (ella.dicho.kdrama || -99) > 70) { ella.dicho.kdrama = J.t; setTimeout(() => decirElla(lineaElla("kdrama")), 1200); } }
      }
      if (ella.sola && d < 6 && !yo.banca && !yo.sentarse) { ella.estado = "sigue"; dejarBanca(ella); ella.sentandose = 0; }
      break;
    }
    case "sentada":
    case "telefono":
      if (ella.estado === "sentada" && ella.banca) { fijo = true; ella.x = amort(ella.x, ella.banca.esx ?? ella.x, 8, dt); ella.z = amort(ella.z, ella.banca.esz ?? ella.z, 8, dt); ella.ry = amortAng(ella.ry, ella.banca.ry, 8, dt); }
      if (d < 5 && !yo.vuela && !yo.banca && !yo.sentarse) { pararse(ella); if (J.t - (ella.dicho.vuelve || -99) > 40) { ella.dicho.vuelve = J.t; decirElla(lineaElla("vuelve")); } break; }
      if (ella.sinVerme > 40) { pararse(ella); ella.estado = "busca"; }
      break;
    case "parandose": {
      ella.parar = (ella.parar || 0) + dt; fijo = true;
      const k = clamp(ella.parar / 0.6, 0, 1); a.sentado = Math.min(a.sentado, 1 - k);
      ella.x += Math.sin(ella.ry) * dt * 0.8; ella.z += Math.cos(ella.ry) * dt * 0.8;
      if (k >= 1) { ella.parar = 0; ella.estado = "sigue"; }
      break;
    }
    case "cielo":
      if (!yo.vuela || alto < 3) { ella.estado = d > 26 ? "espera" : "sigue"; break; }
      if (d > 40) meta = { x: yo.x, z: yo.z };
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
      if (ella.te < 0) { ella.te = rnd(9, 14); if (d < 30) decirElla(lineaElla("busca")); }
      if (Math.hypot(meta.x - ella.x, meta.z - ella.z) < 1.5) { ella.estado = "espera"; ella.te = 5; }
      break;
  }
  // ── moverse hacia la meta ──
  if (!fijo) {
    let vObj = 0, dirX = 0, dirZ = 0;
    if (meta) {
      const mx = meta.x - ella.x, mz = meta.z - ella.z, md = Math.hypot(mx, mz);
      if (md > 0.3) { dirX = mx / md; dirZ = mz / md; vObj = rapido ? Math.min(6, md * 1.6 + 2) : Math.min(2.6, md * 1.5 + 0.6); if (ella.estado === "sigue" && yo.vel > 0.5) vObj = Math.min(Math.max(vObj, yo.vel * (md > 1.2 ? 1.15 : 0.95)), 6.4); }
    }
    ella.vx = amort(ella.vx, dirX * vObj, 8, dt); ella.vz = amort(ella.vz, dirZ * vObj, 8, dt);
    ella.x += ella.vx * dt; ella.z += ella.vz * dt;
    chocarEdificios(ella, 0.3, ella.y);
    const agua = J.nivelAgua ? J.nivelAgua(ella.x) : -1;   // con la ola, flota en su burbujita
    const piso = Math.max(alturaSuelo(ella.x, ella.z, ella.y + 0.3), agua > 0 ? agua + 0.4 : -1); ella.y = amort(ella.y, piso, agua > 0 ? 3 : 20, dt);
    ella.vel = Math.hypot(ella.vx, ella.vz);
    a.sentado = amort(a.sentado, 0, 5, dt);
  } else { ella.vx = ella.vz = 0; ella.vel = 0; }
  // hacia dónde mira
  let mira = null;
  if (!fijo) {
    if (ella.vel > 0.3) mira = Math.atan2(ella.vx, ella.vz);
    else if (ella.estado === "kdrama") mira = Math.atan2(lugares.kdrama.x - ella.x, lugares.kdrama.z - ella.z);
    else if (d < 30) mira = Math.atan2(dx, dz);
    if (mira != null) ella.ry = amortAng(ella.ry, mira, 6, dt);
  }
  const haciaMi = Math.atan2(dx, dz);
  const sentadaConmigo = ella.estado === "sentada" && yo.banca && ella.banca && yo.banca === ella.banca.de;
  a.mirarY = amort(a.mirarY, ella.estado === "telefono" || (ella.estado === "sentada" && ella.sola) ? 0 : clamp(difAng(haciaMi, ella.ry), -1.1, 1.1) * (sentadaConmigo ? 0.6 : 1), 4, dt);
  // las poses
  if (ella.vel > 0.3) a.fase += dt * ella.vel * (ella.vel > 3 ? 2.2 : 3.1);
  a.vel = ella.vel;
  if (ella.estado === "sentada" || enAuto) a.sentado = amort(a.sentado, 1, 5, dt);
  a.tel = amort(a.tel, ((ella.estado === "sentada" && ella.sola) || ella.estado === "telefono") ? 1 : 0, 3, dt);
  a.arriba = amort(a.arriba, ella.estado === "cielo" || ella.mirandoCielo || (J.lunaEvento && J.lunaEvento.activo) ? 1 : 0, 3, dt);
  a.miedo = amort(a.miedo, ella.estado === "huye" ? 1 : 0, 6, dt);
  a.habla = amort(a.habla, ella.hablando > 0 ? 1 : 0, 5, dt); ella.hablando = Math.max(0, (ella.hablando || 0) - dt);
  a.abraza = amort(a.abraza, ella.abrazaT > 0 ? 1 : 0, 5, dt); if (ella.abrazaT > 0) ella.abrazaT -= dt;
  a.saluda = amort(a.saluda, ella.saludaT > 0 ? 1 : 0, 6, dt); if (ella.saludaT > 0) ella.saludaT -= dt;
  a.recarga = amort(a.recarga || 0, sentadaConmigo ? 1 : 0, 2, dt);
  // de la mano: si vamos los dos despacito y juntos
  ella.mano = amort(ella.mano, ella.estado === "sigue" && d < 1.5 && yo.vel < 3.2 && !yo.vuela && yo.suelo && !yo.anim.golpe && !yo.coche ? 1 : 0, 4, dt);
  animar(ella, dt, 11);
  if (ella.mano > 0.3) { ella.ang.hRZ = lerp(ella.ang.hRZ, 0.42, ella.mano); ella.ang.hRX = lerp(ella.ang.hRX, 0.2, ella.mano); ella.ang.cRX = lerp(ella.ang.cRX, 0.25, ella.mano); }
  if (ella.j.melena) ella.j.melena.rotation.x = amort(ella.j.melena.rotation.x, clamp(ella.vel * 0.06, 0, 0.35) + Math.sin(J.t * 2) * 0.03, 6, dt);
  ella.j.raiz.position.set(ella.x, ella.y, ella.z);
  if (enAuto) ella.j.raiz.quaternion.copy(enAuto.m.raiz.quaternion); else ella.j.raiz.rotation.set(0, ella.ry, 0);
  aplicar(ella.j, ella.ang, ALTURA_CADERA);
  // platica de vez en cuando (sólo si vamos juntos y cerquita)
  if (ella.estado === "sigue" && !J.dios.on && d < 3) {
    ella.charla -= dt;
    if (ella.charla < 0) { ella.charla = rnd(70, 120); const f = J.ciclo && J.ciclo.fase; decirElla(lineaElla(f === "dia" && Math.random() < 0.5 ? "dia" : f === "tarde" && Math.random() < 0.5 ? "tarde" : "charla")); }
  }
  if (ella.estado === "en_auto" && ella.coche && Math.abs(ella.coche.vel) > 6 && Math.random() < dt * 0.012) decirElla(elegir(["¡Más despacito! 😳", "Me encanta pasear contigo así 🥰", "Pon la ventana, ¿sí? 🌙"]));
}
function pararse(ella) {
  if (ella.estado === "sentada") { ella.estado = "parandose"; ella.parar = 0; } else ella.estado = "sigue";
  dejarBanca(ella); ella.sola = false;
}
/* Que se siente conmigo en la banca (a mi derecha). */
export function sentarseConmigo(b) {
  const ella = J.novia;
  if (["fuera", "bano", "al_auto", "en_auto", "actividad"].includes(ella.estado)) return;
  if (Math.hypot(ella.x - b.x, ella.z - b.z) > 14) return;
  dejarBanca(ella);
  const cx = Math.cos(b.ry), sz = -Math.sin(b.ry);
  ella.banca = { x: b.x, z: b.z, ry: b.ry, ex: b.x + Math.sin(b.ry) * 0.06 - cx * 0.42, ez: b.z + Math.cos(b.ry) * 0.06 - sz * 0.42, ocupada: ella, de: b };
  ella.estado = "a_banca"; ella.sola = false; ella.sentandose = 0;
}
void TAU; void V; void corazones; void globito; void pista;
