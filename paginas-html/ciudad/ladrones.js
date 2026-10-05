/*
 * LOS LADRONES — de vez en cuando alguien le arrebata la bolsa a un peatón
 * y sale corriendo. Si lo alcanzas y le das un golpe, suelta la bolsa (y te
 * ganas las gracias de la señora y un «mi héroe» de ella). Corre un poquito
 * más lento que tú corriendo, así que sí se puede, pero hay que perseguirlo
 * de verdad: no se marca solo ni se apunta solo. A veces se defiende.
 */
import { J, THREE, rnd, elegir, amortAng, contar } from "./base.js";
import { crearPersona } from "./gente.js";
import { chocarEdificios, alturaSuelo, BORDE_MUNDO } from "./mundo.js";
import { globito, aviso, decir } from "./ui.js";
import { son } from "./audio.js";
import { corazones } from "./efectos.js";

let reloj = 45, lad = null, marca = null;

function marcador() {
  if (marca) return marca;
  // una flechita roja que flota sobre el ladrón (para no perderlo entre la gente)
  const g = new THREE.ConeGeometry(0.16, 0.34, 4).rotateX(Math.PI);
  marca = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.35, 0.4) }));
  marca.layers.set(1); marca.visible = false; J.escena.add(marca);
  return marca;
}

function empezar() {
  const yo = J.jugador;
  // la víctima: alguien que vaya caminando cerca y a la vista
  const cand = J.gente.filter((a) => a.ver && a.estado === "CAMINA" && !a.poli && !a.perro && a.tipo !== "nino" && !a.controlado && Math.hypot(a.x - yo.x, a.z - yo.z) < 24 && Math.hypot(a.x - yo.x, a.z - yo.z) > 6);
  if (!cand.length) { reloj = 15; return; }
  const v = elegir(cand);
  // el ladrón aparece detrás de la víctima, ya vestido de negro, y se le acerca caminando
  const ang = v.ry + Math.PI + rnd(-0.5, 0.5), d = rnd(9, 13);
  const a = crearPersona({ fem: false, tipo: "adulto", x: v.x + Math.sin(ang) * d, z: v.z + Math.cos(ang) * d, caracter: "valiente", controlado: true, estado: "LADRON", peinado: 3 });
  a.colores.ropa = new THREE.Color("#16161c"); a.colores.ropa2 = new THREE.Color("#22222a"); a.colores.pantalon = new THREE.Color("#101016"); a.colores.gorra = new THREE.Color("#0c0c10");
  a.y = alturaSuelo(a.x, a.z, 1);
  lad = { a, v, fase: "acecha", t: 0, empuje: 2, dir: { x: 0, z: 0 }, giro: 0 };
}

function terminar(escapo) {
  const a = lad.a;
  if (escapo) { a.controlado = false; a.estado = "CAMINA"; decir(elegir(["Se nos escapó… ni modo, amor. Lo importante es que estamos bien 🤍", "Uy, se fue. Bueno, ya habrá otro héroe mañana."]), "ella"); }
  lad = null; reloj = rnd(70, 130);
  if (marca) marca.visible = false;
}

export function actualizarLadrones(dt) {
  const yo = J.jugador;
  if (!lad) { if ((reloj -= dt) <= 0) { if (!J.dios.on && !yo.coche && !yo.muerto) empezar(); else reloj = 10; } return; }
  const a = lad.a, v = lad.v; lad.t += dt;
  const m = marcador();
  // ¿lo tumbaron? (un golpe mío, un coche, un poder…)
  if (!a.controlado || a.estado === "HERIDO") {
    if (lad.fase === "huye" || lad.fase === "acecha") {
      lad.fase = "atrapado"; lad.tAtr = lad.t; m.visible = false; a.bolsa = false;
      globito(a, elegir(["¡Ya, ya! ¡Me rindo!", "¡Auch! ¡Ahí está su bolsa!", "¡Está bien, está bien!"]), "gente", 2.4, 2.1);
      if (lad.robo) {
        setTimeout(() => { if (v && v.ver) globito(v, elegir(["¡Gracias, joven! 🙏", "¡Ay, mi bolsa! ¡Gracias, mijo!", "¡Qué valiente! Gracias"]), "gente", 2.6, 2.1); }, 1200);
        setTimeout(() => decir(elegir(["¡Mi héroe! 🥹", "Así se hace, amor. Te amo 💗", "¡Lo atrapaste! Ahora sí te ganaste un beso"]), "ella"), 2400);
        corazones(J.novia.x, J.novia.y + 1.6, J.novia.z, 6, 1.4);
        J.misterio && J.misterio("ladron"); contar("ladrones");
      }
    }
    if (lad.t - lad.tAtr > 8) terminar(false);
    return;
  }
  const dYo = Math.hypot(a.x - yo.x, a.z - yo.z);
  let vel = 0, haciaX = 0, haciaZ = 0;
  if (lad.fase === "acecha") {
    // se acerca caminando a la víctima
    const dx = v.x - a.x, dz = v.z - a.z, d = Math.hypot(dx, dz);
    if (!v.ver && d > 30) { a.controlado = false; a.estado = "CAMINA"; terminar(false); return; }
    if (d < 0.9) {
      lad.fase = "huye"; lad.robo = true; a.bolsa = true; v.bolsa = false;
      son("grito", v.x, v.z, 1); globito(v, elegir(["¡Ladrón! ¡Me robó la bolsa!", "¡Mi bolsa! ¡Alguien deténgalo!", "¡Auxilio! ¡Un ladrón!"]), "gente", 2.8, 2.1);
      v.estado = "MIEDO"; v.te = 1.5;
      setTimeout(() => decir(elegir(["¡Amor, le robó a esa señora! ¡Atrápalo!", "¡Un ladrón! ¡Ve tras él, yo te espero aquí!"]), "ella", 2600, true), 700);
      aviso("¡Un ladrón! Alcánzalo corriendo y dale un golpe");
      lad.t = 0;
    } else { vel = 1.6; haciaX = dx / d; haciaZ = dz / d; }
  } else if (lad.fase === "huye") {
    // corre lejos de mí (un poco más lento que yo corriendo) y cambia de rumbo de vez en cuando
    if ((lad.giro -= dt) <= 0) {
      lad.giro = rnd(0.8, 1.6);
      const lejos = Math.atan2(a.x - yo.x, a.z - yo.z) + rnd(-0.7, 0.7);
      lad.dir = { x: Math.sin(lejos), z: Math.cos(lejos) };
    }
    vel = dYo < 9 ? 5.3 : 4.6; haciaX = lad.dir.x; haciaZ = lad.dir.z;
    // se defiende si lo alcanzo y no le pego rápido
    if (dYo < 1.3 && (lad.empuje -= dt) <= 0) {
      lad.empuje = rnd(1.4, 2.4);
      if (Math.random() < 0.45) {
        const ux = (yo.x - a.x) / (dYo || 1), uz = (yo.z - a.z) / (dYo || 1);
        a.anim.golpe = { tipo: "punoR", t: 0, dur: 0.4 };
        globito(a, elegir(["¡Quítate!", "¡Déjame!", "¡Hazte a un lado!"]), "gente", 1.6, 2.1);
        J.herir && J.herir(yo, 10, ux, uz); son("golpe", yo.x, yo.z, 0.7);
      }
    }
    // se escapa si me tardo mucho o se aleja demasiado
    if (lad.t > 50 || dYo > 75) { m.visible = false; terminar(true); return; }
  }
  // moverlo (chocando con los edificios, sin salirse del mundo)
  a.vel = vel;
  if (vel > 0) {
    a.x += haciaX * vel * dt; a.z += haciaZ * vel * dt;
    chocarEdificios(a, 0.3, a.y);
    const B = BORDE_MUNDO - 2; if (Math.abs(a.x) > B || Math.abs(a.z) > B) { lad.giro = 0; a.x = Math.max(-B, Math.min(B, a.x)); a.z = Math.max(-B, Math.min(B, a.z)); }
    a.ry = amortAng(a.ry, Math.atan2(haciaX, haciaZ), 10, dt);
    a.y = alturaSuelo(a.x, a.z, a.y + 0.3);
  }
  // la flechita
  m.visible = lad.fase === "huye"; if (m.visible) { m.position.set(a.x, a.y + 2.35 + Math.sin(J.t * 6) * 0.08, a.z); m.rotation.y += dt * 3; }
}
