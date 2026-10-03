/*
 * LA PAREJA — las cosas que hacemos juntos.
 *
 * Cuando ella está cerquita aparece 💞, que abre un menú pequeño:
 *   🤗 Abrazo       — se acerca, nos abrazamos, corazones.
 *   📸 Selfie       — se pone a mi lado, la cámara se voltea hacia
 *                     nosotros, ella hace «amor y paz», flash… y sale la
 *                     foto de verdad (la imagen del juego en ese instante).
 *   💃 Bailar       — frente a frente, lentito, con una melodía; la cámara
 *                     nos rodea despacio.
 *   🌙 Ver el cielo — lado a lado, mirando arriba; la cámara baja y mira
 *                     al cielo. De noche pasa una estrella fugaz.
 *   🪑 Sentarnos    — si hay una banca cerca, nos sentamos los dos (y la
 *                     vista se pone de frente a los edificios).
 * Subirse al coche conmigo es automático (ver jugador.js).
 *
 * Y el Modo Dios: al prenderlo ella dice «Quédate aquí, que necesito ir al
 * baño, ahorita vuelvo.» y se va caminando a la puerta más cercana. Al
 * apagarlo (lo dirige poderes.js) regresa por esa misma puerta.
 */
import { J, THREE, rnd, elegir, clamp, amort, amortAng, contar, TAU } from "./base.js";
import { son, piezasEscena } from "./audio.js";
import * as fx from "./efectos.js";
import { E, decir, globito, botonPareja, abrirMenu, abrirTarjeta, pista, menuAbierto } from "./ui.js";
import { bancas, puertaCercana, lugares, alturaSuelo } from "./mundo.js";
import { decirElla, sentarseEn, sentarseConmigo, levantarse } from "./jugador.js";
import { cinematica, cam } from "./camara.js";

let act = null;   // la actividad de ahora: { tipo, t, dur, … }
J.pareja = { mover };

/* ── ¿está libre para hacer algo conmigo? ── */
function disponible() {
  const ella = J.novia, yo = J.jugador;
  return !act && !J.dios.on && !yo.coche && !yo.subir && !yo.bajar && !yo.vuela && !yo.banca && !yo.sentarse && cam.modo !== "dron" &&
    ["sigue", "espera", "telefono", "kdrama", "cielo"].includes(ella.estado) && Math.hypot(ella.x - yo.x, ella.z - yo.z) < 3.6;
}
function opciones() {
  const yo = J.jugador, l = [
    { txt: "🤗 Abrazo", f: () => empezar("abrazo") },
    { txt: "📸 Selfie", f: () => empezar("selfie") },
    { txt: "💃 Bailar", f: () => empezar("baile") },
    { txt: "🌙 Ver el cielo", f: () => empezar("cielo") },
    // la magia romántica (sin Modo Dios: sólo para perdernos por la ciudad)
    { txt: "🌸 Pétalos", f: () => magia("petalos") },
    { txt: "🏮 Farolitos", f: () => magia("farolitos") },
    { txt: "🎆 Fuegos de corazón", f: () => magia("fuegos") },
    { txt: "✨ Luciérnagas", f: () => magia("luciernagas") },
  ];
  const b = bancas.filter((q) => !q.ocupada && Math.hypot(q.x - yo.x, q.z - yo.z) < 9).sort((p, q) => Math.hypot(p.x - yo.x, p.z - yo.z) - Math.hypot(q.x - yo.x, q.z - yo.z))[0];
  if (b) l.push({ txt: "🪑 Sentarnos", f: () => sentarseEn(b) });
  return l;
}

/* ── la magia romántica: dura un ratito y se actualiza en `mover` ── */
let magiaAct = null;
function magia(tipo) {
  const yo = J.jugador;
  magiaAct = { tipo, t: 0, dur: tipo === "fuegos" ? 6 : tipo === "farolitos" ? 4 : 12, cada: 0 };
  son("magia");
  const L = { petalos: ["Llueven pétalos… como en las películas 🥹", "Todo esto para mí? Te amo 🌸"], farolitos: ["Pide un deseo conmigo… el mío ya lo sabes: tú 🏮"], fuegos: ["¡Fuegos de corazón! Eres un exagerado… y te amo 🎆"], luciernagas: ["Luciérnagas… parece que la ciudad se llenó de estrellitas ✨"] };
  setTimeout(() => decirElla(elegir(L[tipo])), 700);
  J.novia.abrazaT = 2; yo.abrazaT = 2; fx.corazones(J.novia.x, J.novia.y + 1.6, J.novia.z, 6, 1.4);
}
function moverMagia(dt) {
  const m = magiaAct; if (!m) return;
  const yo = J.jugador; m.t += dt; m.cada -= dt;
  if (m.tipo === "petalos") for (let k = 0; k < 4; k++) { if (Math.random() < dt * 18) fx.petalos(yo.x, yo.z, 9); }
  else if (m.tipo === "farolitos") { if (m.cada <= 0) { m.cada = 0.28; fx.farolito((yo.x + J.novia.x) / 2, yo.y + 1.2, (yo.z + J.novia.z) / 2); } }
  else if (m.tipo === "luciernagas") { if (Math.random() < dt * 22) fx.luciernaga(yo.x, yo.y, yo.z); }
  else if (m.tipo === "fuegos" && m.cada <= 0) {
    m.cada = rnd(0.6, 1); const ry = (J.camara && J.camara.rotation) ? Math.atan2(J.camara.position.x - yo.x, J.camara.position.z - yo.z) : 0;
    const d = rnd(14, 22), lado = rnd(-8, 8), fx0 = yo.x - Math.sin(ry) * d + Math.cos(ry) * lado, fz0 = yo.z - Math.cos(ry) * d - Math.sin(ry) * lado;
    fx.fuegoCorazon(fx0, rnd(14, 20), fz0, ry, elegir(["#ff7ab0", "#ffc070", "#c79aff", "#ff8a8a"])); son("boom", fx0, fz0, 0.25);
  }
  if (m.t > m.dur) magiaAct = null;
}

/* ── empezar una actividad ── */
function empezar(tipo) {
  const yo = J.jugador, ella = J.novia;
  act = { tipo, t: 0, dur: { abrazo: 3.6, selfie: 4.2, baile: 10, cielo: 9 }[tipo], hecho: {} };
  J.actividad = act;
  ella.estado = "actividad"; ella.sentandose = 0;
  yo.vx = yo.vz = 0;
  // dónde se pone ella
  const fx = Math.sin(yo.ry), fz = Math.cos(yo.ry), rx = -Math.cos(yo.ry), rz = Math.sin(yo.ry);
  if (tipo === "abrazo") { act.px = yo.x + fx * 0.5; act.pz = yo.z + fz * 0.5; act.ry = yo.ry + Math.PI; }
  else if (tipo === "baile") { act.px = yo.x + fx * 0.48; act.pz = yo.z + fz * 0.48; act.ry = yo.ry + Math.PI; }
  else { act.px = yo.x + rx * 0.62; act.pz = yo.z + rz * 0.62; act.ry = yo.ry; }   // a mi derecha, viendo para el mismo lado
  if (tipo === "abrazo") cinematica({ dur: act.dur + 0.6, dist: 3.6, pitch: 0.14, yaw: yo.ry + Math.PI / 2 });
  if (tipo === "selfie") cinematica({ dur: act.dur, dist: 2.5, pitch: 0.08, yaw: yo.ry - 0.25, foco: { x: yo.x + rx * 0.3, y: yo.y + 1.5, z: yo.z + rz * 0.3 } });
  if (tipo === "baile") cinematica({ dur: act.dur, dist: 4.8, pitch: 0.22 });
  if (tipo === "cielo") cinematica({ dur: act.dur, dist: 3.2, pitch: -0.75, yaw: yo.ry + Math.PI });
  if (tipo === "cielo" && J.ciclo.fase === "noche") setTimeout(() => J.lanzarFugaz && J.lanzarFugaz(), 3200);
}
function terminar() {
  const yo = J.jugador, ella = J.novia;
  yo.anim.selfie = 0; ella.anim.paz = 0; yo.anim.baile = ella.anim.baile = 0; ella.mirandoCielo = false;
  ella.estado = "sigue"; act = null; J.actividad = null;
}
/* Ella durante la actividad (o yendo al baño): a dónde va. */
function mover(ella, dt) {
  moverMagia(dt);
  if (ella.estado === "bano") return moverBano(ella, dt);
  if (!act) { ella.estado = "sigue"; return null; }
  const d = Math.hypot(act.px - ella.x, act.pz - ella.z);
  if (d > 0.12 && !act.llego) return { x: act.px, z: act.pz, rapido: d > 2 };
  act.llego = true;
  ella.x = amort(ella.x, act.px, 8, dt); ella.z = amort(ella.z, act.pz, 8, dt);
  ella.ry = amortAng(ella.ry, act.ry, 8, dt);
  ella.y = amort(ella.y, alturaSuelo(ella.x, ella.z, ella.y + 0.3), 12, dt);
  return "fijo";
}
const _cols = [];
function actualizarActividad(dt) {
  const yo = J.jugador, ella = J.novia, a = act;
  a.t += dt;
  const listo = a.llego || a.t > 2.5; if (!a.llego && a.t > 2.5) { ella.x = a.px; ella.z = a.pz; a.llego = true; }
  // él se voltea a donde toca
  const ryObj = a.tipo === "abrazo" || a.tipo === "baile" ? Math.atan2(ella.x - yo.x, ella.z - yo.z) : yo.ry;
  yo.ry = amortAng(yo.ry, ryObj, 8, dt);
  if (!listo) return;
  if (a.inicio == null) a.inicio = a.t;
  const t = a.t - a.inicio;
  if (a.tipo === "abrazo") {
    yo.abrazaT = ella.abrazaT = 0.3;
    if (!a.hecho.c) { a.hecho.c = 1; fx.corazones(ella.x, ella.y + 1.7, ella.z, 12, 1.8); son("corazon", ella.x, ella.z); contar("abrazos"); J.misterio && J.misterio("abrazo"); setTimeout(() => decirElla(elegir(["Mmm… quédate así tantito 🥹", "Te amo, mi amor 🤍", "Ya te extrañaba aunque estuvieras aquí 🥰", "Así… sin soltarme 🤍"])), 500); }
    if (t > 2.4 && !a.hecho.yo) { a.hecho.yo = 1; globito(yo, elegir(["Te amo, mi niña bonita 🤍", "Pronto así de verdad, ¿eh? 🥹", "No te suelto 🤍"]), "yo", 2.6, 2.25); }
    if (t > 3.0) terminar();
  } else if (a.tipo === "selfie") {
    yo.anim.selfie = amort(yo.anim.selfie, 1, 6, dt); ella.anim.paz = amort(ella.anim.paz, 1, 6, dt);
    yo.anim.tel = 0; yo.j.telefono.visible = true;
    if (t > 0.4 && !a.hecho.l) { a.hecho.l = 1; decirElla(elegir(["¡Sonríe! 📸", "¡Ay, salgo bien fea! …tómala otra vez 🙈", "¡Una para nuestro álbum! 🥰"])); }
    if (t > 2.3 && !a.hecho.f) {
      a.hecho.f = 1; son("ding", yo.x, yo.z);
      J.pedirFoto = (url) => {
        J.destelloPantalla = 1.2;   // el flash, después de tomarla (si no, sale blanca)
        if (!url) return;
        const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
        setTimeout(() => {
          abrirTarjeta(`<h2>📸 Nosotros 🤍</h2><img src="${url}" alt="Nuestra foto en la ciudad dormida" style="width:100%;border-radius:12px;display:block;border:6px solid #fff8ee;box-shadow:0 10px 24px -10px #000"><p class="mano">La ciudad dormida · ${fecha}</p><a href="${url}" download="nosotros-ciudad-dormida.jpg" style="display:inline-block;margin-top:6px;color:#ffd9a8;font:700 15px system-ui">Guardar la foto</a><br><button data-cerrar>¡Qué bonitos! 🥹</button>`);
          J.alCerrarTarjeta = () => decirElla(elegir(["Esa va directo a mi fondo de pantalla 🥹", "Salimos bien bonitos, ¿verdad? 🤍"]));
        }, 500);
      };
    }
    if (t > 3.2) { yo.j.telefono.visible = false; terminar(); }
  } else if (a.tipo === "baile") {
    yo.anim.baile = amort(yo.anim.baile, 1, 4, dt); ella.anim.baile = amort(ella.anim.baile, 1, 4, dt);
    cam.yawObj += dt * 0.35;
    if ((a.nota = (a.nota || 0) - dt) <= 0) { a.nota = 0.85; musica(a); }
    if (Math.random() < dt * 2.5) fx.corazones((yo.x + ella.x) / 2, yo.y + 1.9, (yo.z + ella.z) / 2, 1, 1.2);
    if (t > 0.6 && !a.hecho.l) { a.hecho.l = 1; decirElla(elegir(["¿Ves? Sí sabes bailar 🥰", "Pisa con cuidado, ¿eh? jajaja 💃", "Me debías este baile 🤍"])); }
    if (t > 6 && !a.hecho.yo) { a.hecho.yo = 1; globito(yo, "Contigo, hasta yo bailo 🥹", "yo", 2.6, 2.25); }
    if (t > a.dur - 1) { yo.anim.baile = amort(yo.anim.baile, 0, 6, dt); ella.anim.baile = amort(ella.anim.baile, 0, 6, dt); }
    if (t > a.dur) terminar();
  } else if (a.tipo === "cielo") {
    ella.mirandoCielo = true; yo.anim.arriba = amort(yo.anim.arriba, 1, 3, dt);
    if (t > 0.8 && !a.hecho.l) {
      a.hecho.l = 1; const f = J.ciclo.fase;
      decirElla(f === "noche" ? "Mira cuántas estrellas… 🌙" : f === "tarde" ? "Mira qué colores, amor 🌇" : "Esa nube parece un corazón 🥹☁️");
    }
    if (t > 4.4 && !a.hecho.yo) { a.hecho.yo = 1; globito(yo, J.ciclo.fase === "noche" ? "¿Ves esa estrella? Es nuestra 🌠" : "Es el mismo cielo que vemos los dos, aunque estemos lejos 🤍", "yo", 3.4, 2.25); }
    if (t > a.dur - 1.5) yo.anim.arriba = amort(yo.anim.arriba, 0, 3, dt);
    if (t > a.dur) { yo.anim.arriba = 0; terminar(); }
  }
  void _cols;
}
/* Un vals chiquito mientras bailamos. */
const VALS = [[523, 659, 784], [494, 587, 784], [440, 523, 659], [494, 587, 698], [523, 659, 784], [587, 698, 880], [523, 659, 784], [392, 494, 587]];
function musica(a) {
  const p = piezasEscena(); if (!p.ac) return;
  const acorde = VALS[(a.compas = ((a.compas || 0) + 1) % VALS.length)], t = p.ac.currentTime;
  p.nota(acorde[0] / 2, t, 0.8, 0.035, "triangle");
  p.nota(acorde[1], t + 0.28, 0.4, 0.022, "sine"); p.nota(acorde[2], t + 0.56, 0.4, 0.022, "sine");
  p.nota(acorde[2] * 2, t, 0.7, 0.012, "sine");
}

/* ══════════════════ EL BAÑO (Modo Dios) ══════════════════ */
let bano = null;
export function irAlBano() {
  const ella = J.novia, yo = J.jugador;
  if (act) terminar();
  if (ella.estado === "en_auto" || ella.estado === "al_auto") { const c = ella.coche; ella.estado = "sigue"; ella.coche = null; if (c) { ella.x = c.x - Math.cos(c.ry) * 1.7; ella.z = c.z + Math.sin(c.ry) * 1.7; ella.y = 0.2; } }
  if (ella.banca) { if (ella.banca.ocupada === ella) ella.banca.ocupada = null; ella.banca = null; }
  // la puerta: la del Burger si queda cerca, si no la más cercana
  let p = puertaCercana(ella.x, ella.z);
  const b = lugares.burger;
  if (b && Math.hypot(b.x - ella.x, b.z - ella.z) < 40 && J.burgerAbierto && J.burgerAbierto()) p = { x: b.x + 0.6, z: b.z };
  if (!p || Math.hypot(p.x - ella.x, p.z - ella.z) > 60) p = { x: ella.x + rnd(-8, 8), z: ella.z + rnd(-8, 8) };
  bano = { p, t: 0, dijo: false };
  ella.estado = "bano"; ella.puntoRegreso = { x: p.x, z: p.z };
  ella.saludaT = 1.2;
  decir("Quédate aquí, que necesito ir al baño, ahorita vuelvo.", "ella", 3600, true);
  void yo;
}
function moverBano(ella, dt) {
  if (!bano) { ella.estado = "fuera"; return "fijo"; }
  bano.t += dt;
  if (bano.t < 1.2) { ella.ry = amortAng(ella.ry, Math.atan2(J.jugador.x - ella.x, J.jugador.z - ella.z), 6, dt); return "fijo"; }   // primero me lo dice
  const d = Math.hypot(bano.p.x - ella.x, bano.p.z - ella.z);
  if (d < 0.6 || bano.t > 14) {
    // entra (se desvanece encogiéndose un poquito, con brillitos)
    bano.sale = (bano.sale || 0) + dt;
    const k = Math.min(1, bano.sale / 0.5); ella.j.raiz.scale.setScalar(1 - k * 0.15);
    if (k >= 1) { ella.estado = "fuera"; ella.oculta = true; ella.j.raiz.visible = false; ella.j.raiz.scale.setScalar(1); bano = null; son("puerta", ella.x, ella.z, 0.5); }
    return "fijo";
  }
  return { x: bano.p.x, z: bano.p.z, rapido: false };
}
/* Que vuelva (al apagar el Modo Dios): aparece en su puerta, junto a mí. */
export function regresar() {
  const ella = J.novia, p = ella.puntoRegreso || { x: J.jugador.x + 1, z: J.jugador.z };
  bano = null;
  ella.x = p.x; ella.z = p.z; ella.y = alturaSuelo(p.x, p.z, 0.5);
  ella.estado = "sigue"; ella.oculta = false; ella.j.raiz.visible = true; ella.j.raiz.scale.setScalar(1);
  ella.vx = ella.vz = 0;
  return p;
}

/* ══════════════════ CADA CUADRO ══════════════════ */
J.alSentarse = (b) => {
  const ella = J.novia;
  sentarseConmigo(b);
  pista("Toca las ventanas · desliza para recorrer");
  setTimeout(() => { if (J.jugador.banca === b && ella.banca && ella.banca.de === b) { decirElla(elegir(["Qué rico sentarnos un ratito juntos 🥹", "Recárgate en mí, amor 🤍", "Desde aquí se ven todas las ventanitas 🥰"])); } }, 3200);
};
J.alLevantarse = () => pista("");
export function actualizar(dt) {
  const disp = disponible();
  botonPareja(disp);
  if (E.pareja && disp && !menuAbierto()) abrirMenu(opciones());
  if (act) actualizarActividad(dt);
}
void THREE; void clamp; void TAU; void levantarse;
