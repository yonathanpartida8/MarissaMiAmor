/*
 * LA VIDA — los dos se pueden lastimar (y yo me puedo morir).
 *
 *   · Los golpes que bajan vida: que me atropelle un coche, una caída
 *     desde muy alto, las balas (sin Modo Dios) y las explosiones cerca.
 *     Con Modo Dios o con el escudo no pasa nada.
 *   · La vida se recupera sola despacito si no me pegan en un rato.
 *   · Si llega a cero me muero: caigo al piso, la pantalla se pone gris,
 *     ella llega corriendo… y despierto en sus brazos con la vida llena.
 *   · Ella también: un golpe la tira (se levanta sola); si se le acaba la
 *     vida se queda en el piso hasta que llego a su lado.
 */
import { J, clamp, amort, elegir, rnd } from "./base.js";
import { son } from "./audio.js";
import { corazones, brillos } from "./efectos.js";
import { decir, globito } from "./ui.js";

const VIDA = 100;
let hud = null, barra = null, velo = null, letrero = null;
let muerte = null;   // { t } mientras dura la escena

export function iniciarVida() {
  const yo = J.jugador, ella = J.novia;
  yo.vida = VIDA; yo.sinDano = 99; ella.vida = VIDA; ella.sinDano = 99; ella.tirada = 0; ella.ko = false;
  // la barrita de vida (sólo se ve si me lastimaron)
  hud = document.createElement("div"); hud.className = "cd-vida";
  hud.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 20.3S3.8 15.1 3.8 9.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8.2 2.2c0 5.9-8.2 11.1-8.2 11.1z"/></svg><b><i></i></b>';
  barra = hud.querySelector("i");
  velo = document.createElement("div"); velo.className = "cd-muerte";
  letrero = document.createElement("p"); letrero.className = "cd-muerte-txt";
  document.body.append(hud, velo, letrero);
  // las explosiones cerca también lastiman
  const antes = J.alExplosion;
  J.alExplosion = (x, z, k) => {
    if (antes) antes(x, z, k);
    const R = 4 + k * 7;
    for (const p of [J.jugador, J.novia]) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < R) herir(p, (1 - d / R) * (35 + k * 45), (p.x - x) / (d || 1), (p.z - z) / (d || 1));
    }
  };
  J.herir = herir;
}

/* Lastimar a alguno de los dos. `dx, dz`: hacia dónde lo avienta el golpe. */
export function herir(p, cant, dx = 0, dz = 0) {
  if (!p || p.vida == null || cant <= 0) return;
  if (J.dios.on || (J.escudoT || 0) > 0 || p.coche || muerte) return;
  const yo = p === J.jugador;
  if (yo && p.muerto) return;
  if (!yo && p.ko) return;
  p.vida = Math.max(0, p.vida - cant); p.sinDano = 0;
  if (yo) {
    p.vx = (p.vx || 0) + dx * 4; p.vz = (p.vz || 0) + dz * 4; p.anim.impacto = 1; p.stun = Math.max(p.stun || 0, 0.3);
    try { navigator.vibrate && navigator.vibrate(cant > 25 ? [40, 30, 60] : 25); } catch (e) { /* nada */ }
    hud.classList.add("dolor"); setTimeout(() => hud.classList.remove("dolor"), 260);
    if (p.vida <= 0) morir();
  } else {
    // a ella un golpe la tira; si se le acabó la vida, se queda en el piso
    p.tirada = cant > 12 ? 2.4 : 0; p.mano = 0;
    if (p.vida <= 0) { p.ko = true; decir(elegir(["¡Amor! …ayúdame…", "Me… me pegaron… ven, porfa…"]), "ella", 3000, true); }
    else if (cant > 12) decir(elegir(["¡Ay! Eso dolió…", "¡Auch! Estoy bien, estoy bien…", "¡Ten cuidado, amor!"]), "ella");
  }
}

function morir() {
  const yo = J.jugador;
  yo.muerto = true; muerte = { t: 0 }; son("golpe", yo.x, yo.z, 1);
  velo.classList.add("ver");
  letrero.textContent = "Te moriste…"; letrero.classList.add("ver");
}

/* Ella en el piso: ¿se queda quieta? (lo pregunta su lógica cada cuadro) */
export function tiradaElla(ella, dt, dYo) {
  ella.sinDano = (ella.sinDano || 0) + dt;
  if (ella.ko) {
    ella.anim.caido = amort(ella.anim.caido, 1, 6, dt); ella.mano = 0;
    // llego a su lado: la ayudo a pararse
    if (dYo < 1.7 && !J.jugador.muerto) {
      ella.ko = false; ella.vida = 60; ella.tirada = 1.2;
      corazones(ella.x, ella.y + 0.8, ella.z, 8, 1.4); son("corazon");
      setTimeout(() => decir(elegir(["Sabía que vendrías por mí 🥹", "Gracias, amor… no me sueltes, ¿sí?", "Ya estoy bien… contigo siempre estoy bien"]), "ella"), 900);
    }
    return true;
  }
  if (ella.tirada > 0) { ella.tirada -= dt; ella.anim.caido = amort(ella.anim.caido, 1, 8, dt); ella.mano = 0; return true; }
  ella.anim.caido = amort(ella.anim.caido, 0, 4, dt);
  return false;
}

export function actualizarVida(dt) {
  const yo = J.jugador, ella = J.novia;
  if (yo.vida == null) return;
  // recuperarse despacito si no me pegan en un rato
  yo.sinDano += dt;
  if (!yo.muerto && yo.sinDano > 5) yo.vida = Math.min(VIDA, yo.vida + dt * 7);
  if (!ella.ko && ella.sinDano > 5) ella.vida = Math.min(VIDA, ella.vida + dt * 7);
  // los coches que vienen rápido atropellan (a mí y a ella)
  for (const p of [yo, ella]) {
    if (p.coche || p.oculta || (p === yo && yo.muerto)) continue;
    p.golpeCoche = Math.max(0, (p.golpeCoche || 0) - dt);
    if (p.golpeCoche > 0) continue;
    for (const c of J.coches) {
      if (c.estado === "fuera" || c.estado === "estacionado" || c === yo.coche && p === yo) continue;
      const v = c.estado === "fisica" ? Math.hypot(c.vx || 0, c.vz || 0) : Math.abs(c.vel || 0);
      if (v < 3.5 || Math.abs(p.y - c.y) > 2.2) continue;
      const dx = p.x - c.x, dz = p.z - c.z, s = Math.sin(c.ry), co = Math.cos(c.ry);
      const largo = dx * s + dz * co, ancho = dx * co - dz * s;
      if (Math.abs(largo) < c.T.L / 2 + 0.25 && Math.abs(ancho) < c.T.A / 2 + 0.25) {
        p.golpeCoche = 0.9;
        const d = Math.hypot(dx, dz) || 1;
        herir(p, v * 5.5, dx / d, dz / d);
        if (p === yo) { yo.vy = Math.max(yo.vy || 0, 2 + v * 0.25); yo.suelo = false; }
        son("golpe", p.x, p.z, clamp(v / 10, 0.4, 1.2));
        if (c.estado === "maneja") c.vel *= 0.4;
        break;
      }
    }
  }
  // la barrita
  const k = yo.vida / VIDA;
  barra.style.transform = `scaleX(${k.toFixed(3)})`;
  hud.classList.toggle("ver", k < 0.995 || !!yo.muerto);
  hud.classList.toggle("poca", k < 0.3);
  // la escena de la muerte
  if (muerte) {
    muerte.t += dt; yo.anim.caido = amort(yo.anim.caido, 1, 5, dt); yo.vx = yo.vz = 0; yo.stun = 1;
    if (muerte.t > 1.2 && !muerte.dijo) { muerte.dijo = true; decir(elegir(["¡AMOR! ¡No, no, no… despierta!", "¡Amor! ¡Abre los ojos, por favor!"]), "ella", 3200, true); }
    if (muerte.t > 3.4 && !muerte.t2) { muerte.t2 = true; letrero.textContent = "…pero ella no te soltó."; }
    if (muerte.t > 5.6) {
      // despertar en sus brazos
      muerte = null; yo.muerto = false; yo.vida = VIDA; yo.sinDano = 0; yo.stun = 0.6;
      velo.classList.remove("ver"); letrero.classList.remove("ver");
      if (!ella.ko) { ella.x = yo.x + Math.cos(yo.ry) * 0.7; ella.z = yo.z - Math.sin(yo.ry) * 0.7; }
      corazones(yo.x, yo.y + 1.2, yo.z, 10, 1.6); brillos(yo.x, yo.y + 1, yo.z, 14, "oro", 0.6, 2); son("corazon");
      setTimeout(() => decir(elegir(["Me asustaste muchísimo… no me vuelvas a hacer eso 😭", "Aquí estoy. Siempre voy a estar aquí 🤍", "Ya, ya… respira. Te tengo."]), "ella", 3200, true), 500);
      J.novia.abrazaT = 2.5; yo.abrazaT = 2.5;
    }
  } else if (yo.anim.caido > 0.001 && !yo.muerto) yo.anim.caido = amort(yo.anim.caido, 0, 3, dt);
  void rnd; void globito;
}
