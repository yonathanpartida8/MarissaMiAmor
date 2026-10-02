/*
 * LOS CUERPOS — un esqueleto sencillo y una forma de moverlo bonito.
 *
 * Todos (yo, ella, la gente, la policía) comparten el mismo esqueleto:
 * raíz → cuerpo (pivote en la cadera) → torso → cuello → cabeza / brazos,
 * y cadera → piernas. Cada cuadro se calcula la POSE QUE TOCA a partir de
 * lo que el personaje está haciendo (velocidad, aire, vuelo, miedo, golpe,
 * manejar, bailar…) y los ángulos de verdad se acercan a ella con
 * amortiguación: así caminar → correr → saltar → aterrizar → sentarse se
 * encadenan sin saltos, como un «blend tree» pero sin archivos de
 * animación.
 *
 * Yo y ella somos mallas propias con detalle (cara dibujada, pelo con
 * volumen, manos, ropa negra con sus costuras). La gente va instanciada:
 * una malla por pieza del cuerpo para TODOS los peatones (≈ 20 llamadas
 * de dibujo para la ciudad entera), con su cara dibujada también.
 * Todo con material «de dibujo» (toon) y un borde de luz para que la ropa
 * negra se lea de noche.
 */
import { J, THREE, clamp, lerp, amort, TAU, contorno, toon, lienzo, textura } from "./base.js";

/* ══════════════════ LA POSE ══════════════════ */
export const ANG0 = { torsoX: 0, torsoY: 0, torsoZ: 0, cabezaX: 0, cabezaY: 0, cabezaZ: 0, hLX: 0, hLZ: 0.08, cLX: 0.15, hRX: 0, hRZ: 0.08, cRX: 0.15, pLX: 0, pLZ: 0, rLX: 0, pRX: 0, pRZ: 0, rRX: 0, pieL: 0, pieR: 0, cuerpoX: 0, cuerpoZ: 0, bajar: 0 };
export function nuevaAnim() {
  return { vel: 0, fase: 0, aire: 0, vuelo: 0, velVuelo: 0, sentado: 0, miedo: 0, arriba: 0, caido: 0, tel: 0, abraza: 0, saluda: 0, habla: 0, agacha: 0, grabar: 0, cargar: 0, apunta: 0, golpe: null, impacto: 0, mirarY: 0, temblor: 0, poder: 0, maneja: 0, volante: 0, baile: 0, selfie: 0, paz: 0, recarga: 0 };
}
/* Lo que el cuerpo QUIERE hacer ahora, según lo que está pasando. */
function objetivo(a, t, o) {
  for (const k in ANG0) o[k] = ANG0[k];
  const v = a.vel, A = clamp(v / 1.6, 0, 1) * 0.55, run = clamp((v - 2.6) / 2.4, 0, 1), f = a.fase;
  // caminar / correr
  if (A > 0.01) {
    const amp = A * (1 + run * 0.55);
    o.pLX = Math.sin(f) * amp; o.pRX = -Math.sin(f) * amp;
    o.rLX = 0.1 + Math.max(0, -Math.cos(f)) * amp * (1.3 + run); o.rRX = 0.1 + Math.max(0, Math.cos(f)) * amp * (1.3 + run);
    o.hLX = -Math.sin(f) * amp * (0.75 + run * 0.3); o.hRX = Math.sin(f) * amp * (0.75 + run * 0.3);
    o.cLX = 0.25 + run * 1.15; o.cRX = 0.25 + run * 1.15;
    o.torsoX = 0.04 + run * 0.22; o.torsoY = Math.sin(f) * 0.08 * A; o.cuerpoZ = Math.sin(f) * 0.025 * A;
    o.bajar = -Math.abs(Math.cos(f)) * 0.035 * (A + run) + run * 0.04;
    o.pieL = Math.max(0, Math.sin(f)) * 0.3 * A; o.pieR = Math.max(0, -Math.sin(f)) * 0.3 * A;
    o.cabezaX = -o.torsoX * 0.5;
  } else {
    // respirar de pie (y cambiar el peso de pierna de vez en cuando)
    const s = a.semilla || 0, r = Math.sin(t * 1.7 + s) * 0.02, peso = Math.sin(t * 0.21 + s * 3) * 0.5 + 0.5;
    o.torsoX = r; o.hLZ = 0.1 + r; o.hRZ = 0.1 + r; o.cabezaX = -r * 0.5;
    o.cuerpoZ = (peso - 0.5) * 0.04; o.pLZ = peso * 0.04; o.pRZ = (1 - peso) * 0.04; o.rLX = peso * 0.08; o.rRX = (1 - peso) * 0.08;
    o.cabezaY = Math.sin(t * 0.37 + s * 2) * 0.12;
  }
  // en el aire
  if (a.aire > 0) { const k = a.aire; o.pLX = lerp(o.pLX, 0.5, k); o.pRX = lerp(o.pRX, 0.1, k); o.rLX = lerp(o.rLX, 0.9, k); o.rRX = lerp(o.rRX, 0.5, k); o.hLZ = lerp(o.hLZ, 0.7, k); o.hRZ = lerp(o.hRZ, 0.7, k); o.hLX = lerp(o.hLX, -0.4, k); o.hRX = lerp(o.hRX, -0.4, k); }
  // volando: estirado como superhéroe si va rápido, flotando si va lento
  if (a.vuelo > 0) {
    const k = a.vuelo, rap = clamp(a.velVuelo / 14, 0, 1), sway = Math.sin(t * 2.2);
    o.cuerpoX = lerp(o.cuerpoX, 0.05 + rap * 1.25, k);
    o.pLX = lerp(o.pLX, -0.05 - rap * 0.15 + sway * 0.06, k); o.pRX = lerp(o.pRX, 0.1 - rap * 0.1 - sway * 0.06, k);
    o.rLX = lerp(o.rLX, 0.15 + (1 - rap) * 0.35, k); o.rRX = lerp(o.rRX, 0.35 + (1 - rap) * 0.2, k);
    o.hRX = lerp(o.hRX, rap * 2.9 + (1 - rap) * 0.2, k); o.cRX = lerp(o.cRX, 0.05, k); o.hRZ = lerp(o.hRZ, 0.05 + (1 - rap) * 0.5, k);
    o.hLX = lerp(o.hLX, rap * -0.3 + (1 - rap) * 0.1, k); o.hLZ = lerp(o.hLZ, 0.15 + (1 - rap) * 0.5, k); o.cLX = lerp(o.cLX, 0.3, k);
    o.cabezaX = lerp(o.cabezaX, -rap * 0.9, k); o.torsoX = lerp(o.torsoX, 0, k); o.bajar = lerp(o.bajar, 0, k);
    o.pieL = o.pieR = lerp(0, 0.6, k);
  }
  // sentado
  if (a.sentado > 0) { const k = a.sentado; o.pLX = lerp(o.pLX, 1.5, k); o.pRX = lerp(o.pRX, 1.5, k); o.rLX = lerp(o.rLX, 1.5, k); o.rRX = lerp(o.rRX, 1.5, k); o.bajar = lerp(o.bajar, -0.47, k); o.hLX = lerp(o.hLX, 0.35, k); o.hRX = lerp(o.hRX, 0.35, k); o.cLX = lerp(o.cLX, 0.9, k); o.cRX = lerp(o.cRX, 0.9, k); o.torsoX = lerp(o.torsoX, -0.08, k); o.cuerpoZ = lerp(o.cuerpoZ, 0, k); o.pLZ = lerp(o.pLZ, 0.05, k); o.pRZ = lerp(o.pRZ, 0.05, k); }
  // manejando: las manos al volante, que gira con las vueltas
  if (a.maneja > 0) { const k = a.maneja, v2 = a.volante || 0; o.hLX = lerp(o.hLX, 1.0 + v2 * 0.35, k); o.hRX = lerp(o.hRX, 1.0 - v2 * 0.35, k); o.cLX = lerp(o.cLX, 0.75, k); o.cRX = lerp(o.cRX, 0.75, k); o.hLZ = lerp(o.hLZ, -0.12, k); o.hRZ = lerp(o.hRZ, -0.12, k); o.torsoX = lerp(o.torsoX, 0.06, k); o.cabezaY = lerp(o.cabezaY, v2 * 0.4, k); }
  // recargada en el hombro del otro (sentados juntos)
  if (a.recarga > 0) { const k = a.recarga; o.cabezaZ = lerp(o.cabezaZ, -0.32, k); o.torsoZ = lerp(o.torsoZ, -0.07, k); o.cabezaX = lerp(o.cabezaX, 0.05, k); }
  // agachado
  if (a.agacha > 0) { const k = a.agacha; o.pLX = lerp(o.pLX, 1.1, k); o.pRX = lerp(o.pRX, 0.8, k); o.rLX = lerp(o.rLX, 2.0, k); o.rRX = lerp(o.rRX, 1.7, k); o.bajar = lerp(o.bajar, -0.42, k); o.torsoX = lerp(o.torsoX, 0.55, k); }
  // con miedo: brazos a la cabeza y temblando
  if (a.miedo > 0) { const k = a.miedo, tr = Math.sin(t * 40) * 0.04; o.hLX = lerp(o.hLX, 2.2, k); o.hRX = lerp(o.hRX, 2.2, k); o.cLX = lerp(o.cLX, 2.0, k); o.cRX = lerp(o.cRX, 2.0, k); o.hLZ = lerp(o.hLZ, 0.5 + tr, k); o.hRZ = lerp(o.hRZ, 0.5 - tr, k); o.cabezaX = lerp(o.cabezaX, 0.25, k); }
  // mirando hacia arriba (un rayo, la luna, alguien volando, las estrellas)
  if (a.arriba > 0) { const k = a.arriba; o.cabezaX = lerp(o.cabezaX, -0.75, k); o.torsoX = lerp(o.torsoX, -0.14, k); }
  // el teléfono / grabando
  if (a.tel > 0) { const k = a.tel; o.hRX = lerp(o.hRX, 0.75, k); o.cRX = lerp(o.cRX, 1.9, k); o.hRZ = lerp(o.hRZ, -0.15, k); o.cabezaX = lerp(o.cabezaX, 0.45, k); }
  if (a.grabar > 0) { const k = a.grabar; o.hRX = lerp(o.hRX, 1.6, k); o.cRX = lerp(o.cRX, 0.5, k); o.cabezaX = lerp(o.cabezaX, -0.1, k); }
  // la selfie: el brazo arriba con el teléfono, la otra mano haciendo «amor y paz»
  if (a.selfie > 0) { const k = a.selfie; o.hRX = lerp(o.hRX, 2.25, k); o.hRZ = lerp(o.hRZ, 0.35, k); o.cRX = lerp(o.cRX, 0.25, k); o.cabezaX = lerp(o.cabezaX, -0.25, k); o.cabezaZ = lerp(o.cabezaZ, 0.12, k); }
  if (a.paz > 0) { const k = a.paz; o.hLX = lerp(o.hLX, 1.4, k); o.hLZ = lerp(o.hLZ, 0.25, k); o.cLX = lerp(o.cLX, 2.1, k); o.cabezaZ = lerp(o.cabezaZ, -0.18, k); }
  // saludando
  if (a.saluda > 0) { const k = a.saluda; o.hRX = lerp(o.hRX, 2.6, k); o.hRZ = lerp(o.hRZ, 0.5, k); o.cRX = lerp(o.cRX, 0.6 + Math.sin(t * 9) * 0.5, k); }
  // abrazando
  if (a.abraza > 0) { const k = a.abraza; o.hLX = lerp(o.hLX, 1.3, k); o.hRX = lerp(o.hRX, 1.3, k); o.hLZ = lerp(o.hLZ, -0.35, k); o.hRZ = lerp(o.hRZ, -0.35, k); o.cLX = lerp(o.cLX, 1.2, k); o.cRX = lerp(o.cRX, 1.2, k); o.cabezaZ = lerp(o.cabezaZ, -0.15, k); }
  // bailando (los dos juntos, lentito)
  if (a.baile > 0) {
    const k = a.baile, s = Math.sin(t * 2.4), c = Math.cos(t * 2.4);
    o.hLX = lerp(o.hLX, 1.15, k); o.hRX = lerp(o.hRX, 1.15, k); o.hLZ = lerp(o.hLZ, -0.2, k); o.hRZ = lerp(o.hRZ, -0.2, k); o.cLX = lerp(o.cLX, 0.9, k); o.cRX = lerp(o.cRX, 0.9, k);
    o.cuerpoZ = lerp(o.cuerpoZ, s * 0.07, k); o.torsoY = lerp(o.torsoY, c * 0.12, k); o.bajar = lerp(o.bajar, -Math.abs(s) * 0.03, k);
    o.pLX = lerp(o.pLX, Math.max(0, s) * 0.25, k); o.pRX = lerp(o.pRX, Math.max(0, -s) * 0.25, k); o.rLX = lerp(o.rLX, Math.max(0, s) * 0.35, k); o.rRX = lerp(o.rRX, Math.max(0, -s) * 0.35, k);
    o.cabezaZ = lerp(o.cabezaZ, -s * 0.1, k);
  }
  // hablando: la cabeza asiente y una mano acompaña
  if (a.habla > 0) { const k = a.habla; o.cabezaX += Math.sin(t * 7) * 0.06 * k; if (a.sentado < 0.5 && a.maneja < 0.5) { o.hLX = lerp(o.hLX, 0.6 + Math.sin(t * 3) * 0.25, k * 0.8); o.cLX = lerp(o.cLX, 1.4, k * 0.8); } }
  // levantando cosas con poder / apuntando
  if (a.cargar > 0) { const k = a.cargar, s = Math.sin(t * 6) * 0.05; o.hRX = lerp(o.hRX, 1.7 + s, k); o.cRX = lerp(o.cRX, 0.1, k); o.hLX = lerp(o.hLX, 1.4 - s, k); o.cLX = lerp(o.cLX, 0.3, k); o.hLZ = lerp(o.hLZ, 0.3, k); o.torsoX = lerp(o.torsoX, -0.12, k); }
  if (a.apunta > 0) { const k = a.apunta; o.hRX = lerp(o.hRX, 1.55, k); o.cRX = lerp(o.cRX, 0.05, k); o.hLX = lerp(o.hLX, 1.45, k); o.cLX = lerp(o.cLX, 0.3, k); }
  // el poder del Modo Dios (brazos que se abren al transformarse)
  if (a.poder > 0) { const k = Math.min(1, a.poder); o.hLZ = lerp(o.hLZ, 1.3, k); o.hRZ = lerp(o.hRZ, 1.3, k); o.hLX = lerp(o.hLX, 0.3, k); o.hRX = lerp(o.hRX, 0.3, k); o.cabezaX = lerp(o.cabezaX, -0.5, k); o.torsoX = lerp(o.torsoX, -0.2, k); }
  // los golpes: preparar → pegar → regresar
  if (a.golpe) {
    const g = a.golpe, p = g.t / g.dur;
    const ida = p < 0.3 ? -p / 0.3 : p < 0.55 ? (p - 0.3) / 0.25 : 1 - (p - 0.55) / 0.45;   // -1 prepara, +1 pega
    const fu = clamp(ida, -1, 1);
    if (g.tipo === "punoR" || g.tipo === "punoL") {
      const R = g.tipo === "punoR";
      const h = fu > 0 ? 1.55 * fu : -0.5 * fu, c = fu > 0 ? 1.6 * (1 - fu) + 0.05 : 1.8;
      if (R) { o.hRX = h; o.cRX = c; o.torsoY = -0.45 * fu; } else { o.hLX = h; o.cLX = c; o.torsoY = 0.45 * fu; }
      o.torsoX = 0.15; o.pLX = 0.25; o.pRX = -0.2; o.rLX = 0.3; o.rRX = 0.3; o.bajar = -0.06;
    } else if (g.tipo === "patada") {
      o.pRX = fu > 0 ? 1.5 * fu : -0.4 * -fu; o.rRX = fu > 0 ? 0.2 : 1.4; o.torsoX = -0.25 * Math.max(0, fu); o.hLZ = 0.8; o.hRZ = 0.8; o.pLX = 0; o.rLX = 0.15;
    } else if (g.tipo === "tierra") {
      const up = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5;
      o.hLX = o.hRX = p < 0.5 ? 2.9 * up : 1.2; o.cLX = o.cRX = 0.2; o.torsoX = p < 0.5 ? -0.2 : 0.7 * (1 - up);
      o.bajar = p > 0.45 ? -0.35 * (1 - up) : 0; o.pLX = o.pRX = p > 0.45 ? 0.8 * (1 - up) : 0; o.rLX = o.rRX = p > 0.45 ? 1.3 * (1 - up) : 0;
    } else if (g.tipo === "lanzar") {
      o.hRX = fu > 0 ? 2.6 - 1.4 * fu : 2.9; o.cRX = fu > 0 ? 0.2 : 1.6; o.torsoX = 0.3 * fu; o.torsoY = -0.3 * fu;
    } else if (g.tipo === "rayo") {
      o.hRX = 1.55; o.cRX = 0.05; o.hRZ = 0.05; o.torsoY = -0.2; o.hLZ = 0.5;
    }
  }
  // un golpe recibido: el torso se sacude hacia atrás
  if (a.impacto > 0) { o.torsoX -= a.impacto * 0.5; o.cabezaX -= a.impacto * 0.4; o.hLZ += a.impacto * 0.6; o.hRZ += a.impacto * 0.6; }
  // tirado en el piso
  if (a.caido > 0) { const k = a.caido; o.cuerpoX = lerp(o.cuerpoX, -1.5, k); o.bajar = lerp(o.bajar, -0.72, k); o.hLZ = lerp(o.hLZ, 1.2, k); o.hRZ = lerp(o.hRZ, 0.5, k); o.pLX = lerp(o.pLX, 0.2, k); o.rLX = lerp(o.rLX, 0.6, k); o.pRX = lerp(o.pRX, 0, k); }
  if (a.temblor > 0) o.cuerpoZ += Math.sin(t * 50) * 0.04 * a.temblor;
  o.cabezaY = clamp(o.cabezaY + a.mirarY, -1.1, 1.1);
}
const _o = {};
/* Acerca los ángulos de verdad a los que tocan. `rapidez` más alta = más ágil. */
export function animar(act, dt, rapidez = 12) {
  const a = act.anim;
  if (!act.ang) act.ang = { ...ANG0 };
  objetivo(a, J.t, _o);
  const k = 1 - Math.exp(-rapidez * dt);
  for (const n in _o) act.ang[n] += (_o[n] - act.ang[n]) * (n === "cuerpoX" || n === "bajar" ? k * 0.6 : k);
  if (a.golpe) { a.golpe.t += dt; if (a.golpe.t >= a.golpe.dur) a.golpe = null; }
  a.impacto = Math.max(0, a.impacto - dt * 3);
}
/* Pone los ángulos en las articulaciones. */
export function aplicar(j, g, alturaCadera) {
  j.cuerpo.position.y = alturaCadera + g.bajar;
  j.cuerpo.rotation.set(g.cuerpoX, 0, g.cuerpoZ);
  j.torso.rotation.set(g.torsoX, g.torsoY, g.torsoZ);
  j.cabeza.rotation.set(g.cabezaX, g.cabezaY, g.cabezaZ || 0);
  // (el izquierdo está en +x: girar en +z lo abre hacia afuera; el derecho, al revés)
  j.hL.rotation.set(-g.hLX, 0, g.hLZ); j.cL.rotation.set(-g.cLX, 0, 0);
  j.hR.rotation.set(-g.hRX, 0, -g.hRZ); j.cR.rotation.set(-g.cRX, 0, 0);
  j.pL.rotation.set(-g.pLX, 0, g.pLZ); j.rL.rotation.set(g.rLX, 0, 0); j.fL.rotation.set(g.pieL, 0, 0);
  j.pR.rotation.set(-g.pRX, 0, -g.pRZ); j.rR.rotation.set(g.rRX, 0, 0); j.fR.rotation.set(g.pieR, 0, 0);
}

/* ══════════════════ EL ESQUELETO ══════════════════ */
const H = { cadera: 0.95, muslo: 0.46, pierna: 0.44, torso: 0.55, brazo: 0.29, ante: 0.27, hombro: 0.19 };
export function esqueleto() {
  const G = () => new THREE.Group();
  const j = { raiz: G(), cuerpo: G(), cadera: G(), torso: G(), cuello: G(), cabeza: G(), hL: G(), cL: G(), manoL: G(), hR: G(), cR: G(), manoR: G(), pL: G(), rL: G(), fL: G(), pR: G(), rR: G(), fR: G() };
  j.raiz.add(j.cuerpo); j.cuerpo.add(j.cadera);
  j.cadera.add(j.torso); j.torso.add(j.cuello); j.cuello.position.y = H.torso; j.cuello.add(j.cabeza); j.cabeza.position.y = 0.06;
  j.torso.add(j.hL, j.hR); j.hL.position.set(H.hombro, H.torso - 0.08, 0); j.hR.position.set(-H.hombro, H.torso - 0.08, 0);
  j.hL.add(j.cL); j.hR.add(j.cR); j.cL.position.y = -H.brazo; j.cR.position.y = -H.brazo;
  j.cL.add(j.manoL); j.cR.add(j.manoR); j.manoL.position.y = -H.ante; j.manoR.position.y = -H.ante;
  j.cadera.add(j.pL, j.pR); j.pL.position.x = 0.095; j.pR.position.x = -0.095;
  j.pL.add(j.rL); j.pR.add(j.rR); j.rL.position.y = -H.muslo; j.rR.position.y = -H.muslo;
  j.rL.add(j.fL); j.rR.add(j.fR); j.fL.position.y = -H.pierna; j.fR.position.y = -H.pierna;
  j.cuerpo.position.y = H.cadera;
  return j;
}
export const ALTURA_CADERA = H.cadera;

/* ── formas ── */
const capsula = (r, l, seg = 8) => new THREE.CapsuleGeometry(r, l, 4, seg).translate(0, -l / 2, 0);
/* Una cápsula que se adelgaza (muslo → rodilla, brazo → codo). */
function miembro(r0, r1, l, seg = 10) {
  const g = new THREE.CapsuleGeometry((r0 + r1) / 2, l, 5, seg).translate(0, -l / 2, 0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = clamp(-p.getY(i) / l, 0, 1), s = lerp(r0, r1, k) / ((r0 + r1) / 2); p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); }
  g.computeVertexNormals(); return g;
}
function torsoGeo(ancho = 1, cintura = 1, busto = 0) {
  const g = new THREE.CapsuleGeometry(0.16, 0.3, 6, 14).translate(0, 0.3, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), k = clamp((y - 0.05) / 0.45, 0, 1);
    p.setX(i, p.getX(i) * lerp(0.95 * cintura, 1.25 * ancho, k * k * (3 - 2 * k)));
    const z = p.getZ(i); p.setZ(i, z * 0.72 + (z > 0 ? busto * Math.exp(-((y - 0.4) ** 2) / 0.006) * 0.04 : 0));
  }
  g.computeVertexNormals(); return g;
}
/* La cara: ojos grandes (con su brillito), cejas, nariz, boca y chapitas,
   en una textura transparente. Los rasgos van grandes a propósito: es un
   dibujo, y a la distancia de la cámara tienen que leerse. */
let caraTex = {};
function cara(tipo) {
  if (caraTex[tipo]) return caraTex[tipo];
  const [c, x] = lienzo(256, 256);
  x.clearRect(0, 0, 256, 256);
  const ella = tipo === "ella", gente = tipo === "gente";
  const rx = gente ? 15 : ella ? 21 : 19, ry = gente ? 19 : ella ? 28 : 25, oy = 122;
  const ojo = (cx, s) => {
    x.fillStyle = "#1a1220"; x.beginPath(); x.ellipse(cx, oy, rx, ry, 0, 0, TAU); x.fill();
    if (!gente) { x.fillStyle = ella ? "#5a3426" : "#3e2a22"; x.beginPath(); x.ellipse(cx, oy + 5, rx * 0.66, ry * 0.66, 0, 0, TAU); x.fill(); }
    x.fillStyle = "#ffffff"; x.beginPath(); x.ellipse(cx + rx * 0.32, oy - ry * 0.38, rx * 0.34, ry * 0.3, 0, 0, TAU); x.fill();
    x.beginPath(); x.arc(cx - rx * 0.3, oy + ry * 0.42, rx * 0.15, 0, TAU); x.fill();
    // el párpado de arriba (más grueso) y, en ella, sus pestañas
    x.strokeStyle = "#140c18"; x.lineCap = "round"; x.lineWidth = gente ? 5 : 7;
    x.beginPath(); x.ellipse(cx, oy + 2, rx + 2, ry + 1, 0, Math.PI * 1.12, Math.PI * 1.88); x.stroke();
    if (ella) { x.lineWidth = 5; for (const k of [0, 1]) { const a = Math.PI * (s < 0 ? 1.14 + k * 0.08 : 1.86 - k * 0.08); const px = cx + Math.cos(a) * (rx + 2), py = oy + 2 + Math.sin(a) * (ry + 1); x.beginPath(); x.moveTo(px, py); x.lineTo(px + s * (9 - k * 3), py - 8 + k * 2); x.stroke(); } }
  };
  ojo(128 - 46, -1); ojo(128 + 46, 1);
  // cejas
  x.strokeStyle = "#1a1018"; x.lineWidth = ella ? 6 : gente ? 6 : 9; x.lineCap = "round";
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(128 + s * 24, oy - ry - 16); x.quadraticCurveTo(128 + s * 46, oy - ry - 26, 128 + s * 68, oy - ry - 15); x.stroke(); }
  // nariz (una curvita) y boca (sonrisa)
  x.strokeStyle = "rgba(120,60,50,.6)"; x.lineWidth = 4; x.beginPath(); x.moveTo(126, oy + ry + 8); x.quadraticCurveTo(119, oy + ry + 22, 131, oy + ry + 24); x.stroke();
  x.strokeStyle = ella ? "#c23a62" : "#7a3434"; x.lineWidth = 7; x.beginPath(); x.moveTo(108, oy + ry + 42); x.quadraticCurveTo(128, oy + ry + 58, 148, oy + ry + 42); x.stroke();
  if (ella) { x.fillStyle = "rgba(220,70,110,.55)"; x.beginPath(); x.moveTo(112, oy + ry + 44); x.quadraticCurveTo(128, oy + ry + 56, 144, oy + ry + 44); x.quadraticCurveTo(128, oy + ry + 50, 112, oy + ry + 44); x.fill(); }
  // chapitas
  x.fillStyle = ella ? "rgba(255,110,140,.45)" : gente ? "rgba(230,110,100,.22)" : "rgba(230,110,100,.28)";
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(128 + s * 66, oy + ry + 20, 22, 12, 0, 0, TAU); x.fill(); }
  const t = textura(c); caraTex[tipo] = t; return t;
}
/* La cara se dibuja sobre un casquete un poquito más grande que la cabeza (sólo el frente). */
const caraGeo = (r) => new THREE.SphereGeometry(r * 1.015, 24, 16, Math.PI * 0.5 - 0.61, 1.22, Math.PI * 0.5 - 0.53, 1.06);

/* ══════════════════ YO Y ELLA (con detalle) ══════════════════ */
export function crearProtagonista(quien) {
  const j = esqueleto();
  const ella = quien === "ella";
  const rim = ella ? "#ffa8d8" : "#b8a8ff";
  const T = (o) => contorno(toon(o), rim, 0.55);
  const piel = T({ color: ella ? "#d8a682" : "#c89670" });
  const negro = T({ color: "#232030" }), negro2 = T({ color: "#2e2a3c" }), negro3 = T({ color: "#1a1824" });
  const pelo = T({ color: "#16121c" });
  const blanco = T({ color: "#f4f0f6" });
  const acento = T({ color: ella ? "#ff7aa8" : "#8a7aff", emissive: ella ? "#4a1028" : "#14104a" });
  const M = (geo, mat, padre, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; padre.add(m); return m; };
  const R = 0.13;   // radio de la cabeza
  // ── el torso con su ropa ──
  M(torsoGeo(ella ? 0.86 : 1.06, ella ? 0.8 : 1, ella ? 1 : 0), negro, j.torso);
  if (!ella) {
    // chamarra: cuello alzado, cierre, bolsillos y la playera blanca asomándose
    M(new THREE.TorusGeometry(0.088, 0.03, 8, 18).rotateX(Math.PI / 2), negro2, j.torso, 0, H.torso - 0.02, 0);
    M(new THREE.CylinderGeometry(0.075, 0.08, 0.05, 12), blanco, j.torso, 0, H.torso - 0.035, 0.012);
    M(new THREE.BoxGeometry(0.012, 0.36, 0.01), T({ color: "#8a8898" }), j.torso, 0, 0.3, 0.128);
    for (const s of [-1, 1]) M(new THREE.BoxGeometry(0.09, 0.012, 0.01), negro3, j.torso, s * 0.085, 0.16, 0.12);
    M(new THREE.CapsuleGeometry(0.11, 0.06, 4, 10).scale(1.2, 0.7, 0.5), negro2, j.torso, 0, 0.47, -0.12);   // la capucha
  } else {
    // blusa con un listón rosita y su collar
    M(new THREE.TorusGeometry(0.075, 0.012, 6, 18).rotateX(Math.PI / 2 - 0.25), T({ color: "#e8d0b8" }), j.torso, 0, H.torso - 0.06, 0.018);
    M(new THREE.SphereGeometry(0.03, 10, 8).scale(1.6, 0.8, 0.6), acento, j.torso, 0, 0.42, 0.11);
    M(new THREE.SphereGeometry(0.018, 8, 6), acento, j.torso, 0, 0.42, 0.125);
  }
  M(new THREE.SphereGeometry(0.15, 14, 10).scale(1.1, 0.75, 0.85), negro2, j.cadera, 0, 0, 0);
  if (!ella) M(new THREE.TorusGeometry(0.15, 0.014, 6, 24).rotateX(Math.PI / 2).scale(1.08, 1, 0.82), T({ color: "#4a4050" }), j.cadera, 0, 0.06, 0);   // el cinturón
  if (ella) {
    // la falda, con vuelo
    const falda = new THREE.CylinderGeometry(0.15, 0.3, 0.4, 24, 3, true).translate(0, -0.15, 0);
    { const p = falda.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = clamp(-(p.getY(i) + 0.05) / 0.3, 0, 1); p.setX(i, p.getX(i) * (1 + Math.sin(a * 7) * 0.04 * k)); p.setZ(i, p.getZ(i) * (1 + Math.sin(a * 7) * 0.04 * k)); } falda.computeVertexNormals(); }
    const mf = M(falda, negro, j.cadera); mf.material = negro.clone(); mf.material.side = THREE.DoubleSide; contorno(mf.material, rim, 0.55);
  }
  // ── cuello y cabeza ──
  M(new THREE.CylinderGeometry(0.048, 0.056, 0.12, 10).translate(0, 0.02, 0), piel, j.cuello);
  M(new THREE.SphereGeometry(R, 24, 18).scale(0.94, 1.06, 1).translate(0, 0.14, 0.005), piel, j.cabeza);
  M(new THREE.SphereGeometry(0.07, 12, 8).scale(1, 0.6, 0.9), piel, j.cabeza, 0, 0.05, 0.02);   // la quijada
  const cr = new THREE.Mesh(caraGeo(R).scale(0.94, 1.06, 1).translate(0, 0.14, 0.005), new THREE.MeshToonMaterial({ map: cara(quien), transparent: true, alphaTest: 0.3, depthWrite: false, gradientMap: piel.gradientMap }));
  cr.renderOrder = 2; j.cabeza.add(cr);
  M(new THREE.SphereGeometry(0.018, 8, 6).scale(0.9, 1, 1.1), piel, j.cabeza, 0, 0.125, 0.128);   // la nariz
  for (const s of [-1, 1]) M(new THREE.SphereGeometry(0.03, 8, 6).scale(0.5, 1, 0.8), piel, j.cabeza, s * 0.12, 0.14, 0);   // orejas
  // ── el pelo ──
  if (!ella) {
    M(new THREE.SphereGeometry(R + 0.012, 20, 12, 0, TAU, 0, Math.PI * 0.6).rotateX(-0.42).scale(0.98, 1.06, 1.06).translate(0, 0.15, -0.012), pelo, j.cabeza);
    // mechones con volumen y el copete
    for (const [x, y, z, s, rz] of [[0.0, 0.29, 0.06, 1.2, 0.1], [0.06, 0.28, 0.02, 0.9, -0.4], [-0.06, 0.28, 0.03, 0.95, 0.5], [0.09, 0.24, 0.07, 0.7, -0.8], [-0.09, 0.24, 0.07, 0.7, 0.8], [0.0, 0.26, -0.07, 1, 0]])
      M(new THREE.SphereGeometry(0.06, 10, 8).scale(1.3 * s, 0.6 * s, 1 * s), pelo, j.cabeza, x, y, z).rotation.z = rz;
    for (const s of [-1, 1]) M(new THREE.BoxGeometry(0.03, 0.07, 0.04), pelo, j.cabeza, s * 0.118, 0.17, 0.035);   // patillas
  } else {
    M(new THREE.SphereGeometry(R + 0.015, 20, 12, 0, TAU, 0, Math.PI * 0.62).rotateX(-0.4).scale(1, 1.07, 1.08).translate(0, 0.148, -0.014), pelo, j.cabeza);
    const largo = new THREE.Group(); largo.position.set(0, 0.2, -0.06); j.cabeza.add(largo); j.melena = largo;
    M(new THREE.CapsuleGeometry(0.125, 0.36, 6, 14).scale(1.1, 1, 0.5).translate(0, -0.22, -0.03), pelo, largo);
    for (const s of [-1, 1]) {
      const m = M(new THREE.CapsuleGeometry(0.04, 0.3, 4, 8).translate(0, -0.15, 0), pelo, j.cabeza, s * 0.12, 0.2, 0.035); m.rotation.z = s * 0.06;
      M(new THREE.SphereGeometry(0.05, 10, 8).scale(1.4, 0.8, 0.7), pelo, j.cabeza, s * 0.05, 0.255, 0.1).rotation.z = s * 0.35;   // el fleco
    }
    M(new THREE.SphereGeometry(0.035, 8, 6).scale(1.5, 0.7, 0.7), acento, j.cabeza, 0.1, 0.26, 0.0);   // pasador
    for (const s of [-1, 1]) M(new THREE.SphereGeometry(0.012, 6, 4), T({ color: "#ffe0a0", emissive: "#3a2a00" }), j.cabeza, s * 0.123, 0.1, 0.0);   // aretes
  }
  // ── brazos: mangas, puños y manos con pulgar ──
  for (const [h, c, m, s] of [[j.hL, j.cL, j.manoL, 1], [j.hR, j.cR, j.manoR, -1]]) {
    M(miembro(ella ? 0.052 : 0.06, ella ? 0.044 : 0.05, H.brazo - 0.04), negro, h);
    M(miembro(ella ? 0.042 : 0.05, ella ? 0.034 : 0.042, H.ante - 0.06), ella ? piel : negro, c);
    if (!ella) M(new THREE.CylinderGeometry(0.046, 0.046, 0.05, 10), negro3, c, 0, -H.ante + 0.06, 0);
    M(new THREE.SphereGeometry(ella ? 0.038 : 0.044, 10, 8).scale(0.85, 1.2, 0.55), piel, m, 0, -0.035, 0);
    M(new THREE.CapsuleGeometry(0.014, 0.035, 3, 6), piel, m, s * 0.03, -0.03, 0.02).rotation.z = s * 0.6;
    if (ella && s > 0) M(new THREE.TorusGeometry(0.038, 0.008, 6, 14).rotateX(Math.PI / 2), acento, c, 0, -H.ante + 0.07, 0);   // pulsera
  }
  // el teléfono (para sus K-dramas y para la selfie)
  const tel = M(new THREE.BoxGeometry(0.065, 0.13, 0.012), T({ color: "#2a2a34" }), j.manoR, 0, -0.07, 0.035);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.11), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.2, 1.6) })); pantalla.position.z = 0.007; tel.add(pantalla);
  tel.visible = false; j.telefono = tel;
  // ── piernas y zapatos ──
  for (const [p, r, f] of [[j.pL, j.rL, j.fL], [j.pR, j.rR, j.fR]]) {
    M(miembro(ella ? 0.072 : 0.08, ella ? 0.056 : 0.064, H.muslo - 0.05), ella ? piel : negro2, p);
    M(miembro(ella ? 0.055 : 0.062, ella ? 0.04 : 0.05, H.pierna - 0.05), ella ? piel : negro2, r);
    if (ella) { M(new THREE.CapsuleGeometry(0.042, 0.13, 4, 8).rotateX(Math.PI / 2).translate(0, -0.035, 0.045), negro, f); M(new THREE.TorusGeometry(0.03, 0.006, 4, 10).rotateX(Math.PI / 2), acento, f, 0, -0.01, 0.07); }
    else { M(new THREE.CapsuleGeometry(0.05, 0.15, 4, 8).rotateX(Math.PI / 2).translate(0, -0.035, 0.05), blanco, f); M(new THREE.BoxGeometry(0.1, 0.025, 0.24).translate(0, -0.075, 0.05), negro3, f); }
  }
  j.mats = { piel, negro, pelo };
  return j;
}

/* ══════════════════ LA GENTE, INSTANCIADA ══════════════════ */
/* Cada pieza del cuerpo es UNA malla instanciada para todos. Por peatón se
   pone el esqueleto de plantilla en su pose, se recalculan sus matrices y
   se copian a su casilla. Las casillas libres quedan en escala 0. */
const PIEZAS_GENTE = [
  ["torso", () => torsoGeo(1, 1), "ropa"],
  ["cuelloP", () => new THREE.CylinderGeometry(0.045, 0.052, 0.1, 8).translate(0, 0.02, 0), "piel", null, ["cuello"]],
  ["cadera", () => new THREE.SphereGeometry(0.15, 12, 8).scale(1.1, 0.75, 0.85), "pantalon"],
  ["falda", () => new THREE.CylinderGeometry(0.15, 0.27, 0.36, 14, 1, true).translate(0, -0.13, 0), "ropa2", (a) => a.falda],
  ["cabeza", () => new THREE.SphereGeometry(0.125, 16, 12).scale(0.95, 1.06, 1).translate(0, 0.14, 0), "piel"],
  ["cara", () => caraGeo(0.125).scale(0.95, 1.06, 1).translate(0, 0.14, 0), "blanco", null, null, "cara"],
  ["nariz", () => new THREE.SphereGeometry(0.017, 6, 5).translate(0, 0.125, 0.123), "piel"],
  ["peloCorto", () => new THREE.SphereGeometry(0.137, 14, 8, 0, TAU, 0, Math.PI * 0.6).rotateX(-0.42).translate(0, 0.15, -0.01), "pelo", (a) => a.peinado === 0],
  ["copete", () => new THREE.SphereGeometry(0.07, 8, 6).scale(1.5, 0.6, 1).translate(0.01, 0.27, 0.05), "pelo", (a) => a.peinado === 0],
  ["peloLargo", () => new THREE.CapsuleGeometry(0.135, 0.3, 4, 10).scale(1, 1, 0.55).translate(0, 0.01, -0.06), "pelo", (a) => a.peinado === 1],
  ["peloLargoTapa", () => new THREE.SphereGeometry(0.14, 14, 8, 0, TAU, 0, Math.PI * 0.62).rotateX(-0.4).translate(0, 0.148, -0.012), "pelo", (a) => a.peinado === 1 || a.peinado === 2],
  ["chongo", () => new THREE.SphereGeometry(0.075, 10, 8).translate(0, 0.29, -0.08), "pelo", (a) => a.peinado === 2],
  ["gorra", () => new THREE.SphereGeometry(0.14, 14, 8, 0, TAU, 0, Math.PI * 0.5).translate(0, 0.16, 0), "gorra", (a) => a.peinado === 3],
  ["visera", () => new THREE.CylinderGeometry(0.12, 0.12, 0.018, 14, 1, false, -Math.PI / 2, Math.PI).translate(0, 0.17, 0.08), "gorra", (a) => a.peinado === 3],
  ["calvo", () => new THREE.SphereGeometry(0.129, 12, 6, Math.PI * 0.5 + 0.85, TAU - 1.7, Math.PI * 0.3, Math.PI * 0.3).translate(0, 0.14, 0), "pelo", (a) => a.peinado === 4],
  ["brazo", () => miembro(0.056, 0.047, H.brazo - 0.04), "ropa", null, ["hL", "hR"]],
  ["ante", () => miembro(0.046, 0.038, H.ante - 0.05), "ropa", null, ["cL", "cR"]],
  ["mano", () => new THREE.SphereGeometry(0.042, 8, 6).scale(0.85, 1.2, 0.6).translate(0, -0.03, 0), "piel", null, ["manoL", "manoR"]],
  ["muslo", () => miembro(0.078, 0.062, H.muslo - 0.05), "pantalon", null, ["pL", "pR"]],
  ["pierna", () => miembro(0.06, 0.046, H.pierna - 0.05), "pantalon", null, ["rL", "rR"]],
  ["zapato", () => new THREE.CapsuleGeometry(0.046, 0.14, 3, 8).rotateX(Math.PI / 2).translate(0, -0.035, 0.045), "zapato", null, ["fL", "fR"]],
  ["telefono", () => new THREE.BoxGeometry(0.06, 0.11, 0.012).translate(0, -0.06, 0.04), "telefono", (a) => a.anim.tel > 0.3 || a.anim.grabar > 0.3, ["manoR"]],
  ["bolsa", () => new THREE.BoxGeometry(0.2, 0.22, 0.1).translate(0, -0.13, 0.02), "bolsa", (a) => a.bolsa, ["manoL"]],
];
const PADRE = { torso: "torso", cadera: "cadera", falda: "cadera", cabeza: "cabeza", cara: "cabeza", nariz: "cabeza", peloCorto: "cabeza", copete: "cabeza", peloLargo: "cabeza", peloLargoTapa: "cabeza", chongo: "cabeza", gorra: "cabeza", visera: "cabeza", calvo: "cabeza" };
const BLANCO = new THREE.Color("#ffffff");
export class Gentio {
  constructor(escena, max) {
    this.max = max; this.libres = []; for (let i = max - 1; i >= 0; i--) this.libres.push(i);
    this.plantilla = esqueleto();
    this.mallas = [];
    const mat = contorno(toon({ color: "#ffffff" }), "#a898ff", 0.4);
    const matCara = new THREE.MeshToonMaterial({ map: cara("gente"), transparent: true, alphaTest: 0.3, depthWrite: false, gradientMap: mat.gradientMap });
    for (const [nombre, geo, color, cuando, juntas, especial] of PIEZAS_GENTE) {
      const g = geo(); if (!g) continue;
      const n = juntas ? max * juntas.length : max;
      const im = new THREE.InstancedMesh(g, especial === "cara" ? matCara : mat, n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.castShadow = J.calidad.sombras && especial !== "cara"; im.frustumCulled = false;
      if (especial === "cara") im.renderOrder = 2;
      const cero = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < n; i++) { im.setMatrixAt(i, cero); im.setColorAt(i, BLANCO); }
      escena.add(im);
      this.mallas.push({ nombre, im, color, cuando, juntas: juntas || [PADRE[nombre]], cero });
    }
    this.mat = mat;
  }
  alta(a) { if (a.casilla != null) return true; const c = this.libres.pop(); if (c == null) return false; a.casilla = c; this.pintar(a); return true; }
  baja(a) {
    if (a.casilla == null) return;
    for (const m of this.mallas) for (let k = 0; k < m.juntas.length; k++) m.im.setMatrixAt(a.casilla * m.juntas.length + k, m.cero);
    for (const m of this.mallas) m.im.instanceMatrix.needsUpdate = true;
    this.libres.push(a.casilla); a.casilla = null;
  }
  /* Pinta los colores de su ropa (una sola vez al darlo de alta). */
  pintar(a) {
    for (const m of this.mallas) {
      const col = m.color === "blanco" ? BLANCO : a.colores[m.color] || a.colores.ropa;
      for (let k = 0; k < m.juntas.length; k++) m.im.setColorAt(a.casilla * m.juntas.length + k, col);
      m.im.instanceColor.needsUpdate = true;
    }
  }
  /* Pone a cada quien en su pose. `lista` = los que se ven ahora. */
  dibujar(lista) {
    const j = this.plantilla;
    for (const a of lista) {
      if (a.casilla == null) continue;
      j.raiz.position.set(a.x, a.y, a.z);
      j.raiz.rotation.set(0, a.ry, 0);
      j.raiz.scale.setScalar(a.escala || 1);
      aplicar(j, a.ang || ANG0, ALTURA_CADERA);
      j.raiz.updateMatrixWorld(true);
      for (const m of this.mallas) {
        const ver = !m.cuando || m.cuando(a);
        for (let k = 0; k < m.juntas.length; k++) m.im.setMatrixAt(a.casilla * m.juntas.length + k, ver ? j[m.juntas[k]].matrixWorld : m.cero);
      }
    }
    for (const m of this.mallas) m.im.instanceMatrix.needsUpdate = true;
  }
}

/* ══════════════════ LOS ANIMALES ══════════════════
   Perritos y gatos: un cuerpo, cabeza, hocico, orejas, cola y cuatro
   patas. Instanciados también, con un trote que depende de su velocidad. */
export class Animalitos {
  constructor(escena, max) {
    this.max = max; this.libres = []; for (let i = max - 1; i >= 0; i--) this.libres.push(i);
    const mat = contorno(toon({ color: "#ffffff" }), "#c8b8ff", 0.4);
    const P = (g, n) => { const im = new THREE.InstancedMesh(g, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = J.calidad.sombras; const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < n; i++) { im.setMatrixAt(i, z); im.setColorAt(i, new THREE.Color("#fff")); } escena.add(im); return im; };
    this.cuerpo = P(new THREE.CapsuleGeometry(0.13, 0.32, 4, 10).rotateX(Math.PI / 2), max);
    this.cabeza = P(new THREE.SphereGeometry(0.12, 12, 10), max);
    this.hocico = P(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 0.8, 1.4), max);
    this.ojos = P(new THREE.SphereGeometry(0.018, 6, 5), max * 2);
    this.oreja = P(new THREE.ConeGeometry(0.045, 0.11, 6), max * 2);
    this.cola = P(new THREE.CapsuleGeometry(0.025, 0.2, 3, 6).translate(0, 0.12, 0), max);
    this.pata = P(new THREE.CapsuleGeometry(0.03, 0.18, 3, 6).translate(0, -0.11, 0), max * 4);
    this.escudo = P(new THREE.SphereGeometry(1, 20, 14), max);
    this.escudo.material = new THREE.MeshBasicMaterial({ color: "#9ad8ff", transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    this.escudo.castShadow = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.base = new THREE.Matrix4(); this.loc = new THREE.Matrix4();
  }
  alta(a) {
    if (a.casilla != null) return true; const c = this.libres.pop(); if (c == null) return false; a.casilla = c;
    const col = new THREE.Color(a.color), osc = col.clone().multiplyScalar(0.7), negro = new THREE.Color("#141018");
    this.cuerpo.setColorAt(c, col); this.cabeza.setColorAt(c, col); this.hocico.setColorAt(c, a.tipo === "perro" ? osc : col); this.cola.setColorAt(c, col);
    for (let k = 0; k < 2; k++) { this.oreja.setColorAt(c * 2 + k, osc); this.ojos.setColorAt(c * 2 + k, negro); }
    for (let k = 0; k < 4; k++) this.pata.setColorAt(c * 4 + k, col);
    for (const im of [this.cuerpo, this.cabeza, this.hocico, this.cola, this.oreja, this.pata, this.ojos]) im.instanceColor.needsUpdate = true;
    return true;
  }
  baja(a) {
    if (a.casilla == null) return; const c = a.casilla, z = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const [im, n] of [[this.cuerpo, 1], [this.cabeza, 1], [this.hocico, 1], [this.cola, 1], [this.escudo, 1], [this.oreja, 2], [this.ojos, 2], [this.pata, 4]]) { for (let k = 0; k < n; k++) im.setMatrixAt(c * n + k, z); im.instanceMatrix.needsUpdate = true; }
    this.libres.push(c); a.casilla = null;
  }
  pon(im, i, x, y, z, rx = 0, ry = 0, rz = 0, s = 1, sy) {
    this.loc.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.s.set(s, sy ?? s, s));
    this.m.multiplyMatrices(this.base, this.loc); im.setMatrixAt(i, this.m);
  }
  dibujar(lista) {
    for (const a of lista) {
      if (a.casilla == null) continue;
      const c = a.casilla, s = a.tam || 1, perro = a.tipo === "perro", t = J.t;
      const trote = clamp(a.vel / 1.2, 0, 1), f = a.fase;
      this.base.compose(this.v.set(a.x, a.y, a.z), this.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a.ry), this.s.set(s, s, s));
      const alto = perro ? 0.34 : 0.26, sube = Math.abs(Math.sin(f)) * 0.03 * trote;
      this.pon(this.cuerpo, c, 0, alto + sube, 0, 0, 0, 0, perro ? 1 : 0.82, perro ? 1 : 0.85);
      const cab = Math.sin(t * 1.3 + c) * 0.15 * (1 - trote);
      this.pon(this.cabeza, c, 0, alto + 0.15 + sube, perro ? 0.3 : 0.26, -0.1, cab, 0, perro ? 1 : 0.9);
      this.pon(this.hocico, c, 0, alto + 0.12 + sube, perro ? 0.41 : 0.35, 0, cab, 0, perro ? 1 : 0.5);
      for (let k = 0; k < 2; k++) { const sx = k ? 1 : -1; this.pon(this.oreja, c * 2 + k, sx * 0.07, alto + (perro ? 0.25 : 0.27) + sube, perro ? 0.28 : 0.25, perro ? 0.5 : 0, 0, sx * (perro ? 0.9 : 0.2), 1, perro ? 0.8 : 1); this.pon(this.ojos, c * 2 + k, sx * 0.045 + Math.sin(cab) * 0.02, alto + 0.19 + sube, (perro ? 0.3 : 0.26) + 0.1, 0, 0, 0, 1); }
      const cola = perro ? Math.sin(t * (a.feliz ? 18 : 6)) * 0.6 : Math.sin(t * 2) * 0.4;
      this.pon(this.cola, c, 0, alto + 0.08, -0.26, -0.6, 0, cola, 1);
      for (let k = 0; k < 4; k++) { const sx = k % 2 ? 1 : -1, sz = k < 2 ? 1 : -1, ph = (k === 0 || k === 3 ? 0 : Math.PI); this.pon(this.pata, c * 4 + k, sx * 0.08, alto - 0.04, sz * 0.15, Math.sin(f + ph) * 0.7 * trote, 0, 0, 1, perro ? 1 : 0.75); }
      const esc = a.escudo || 0;
      if (esc > 0.01) this.pon(this.escudo, c, 0, alto, 0, 0, t, 0, 0.75 * Math.min(1, esc * 2) * (1 + Math.sin(t * 6) * 0.03)); else this.escudo.setMatrixAt(c, this.m.makeScale(0, 0, 0));
    }
    for (const im of [this.cuerpo, this.cabeza, this.hocico, this.cola, this.oreja, this.pata, this.ojos, this.escudo]) im.instanceMatrix.needsUpdate = true;
  }
}
void amort;
