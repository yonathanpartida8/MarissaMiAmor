/*
 * LOS CUERPOS — un esqueleto sencillo y una forma de moverlo bonito.
 *
 * Todos (yo, ella, la gente, la policía) comparten el mismo esqueleto:
 * raíz → cuerpo (pivote en la cadera) → torso → cabeza / brazos, y
 * cadera → piernas. Cada cuadro se calcula la POSE QUE TOCA a partir de lo
 * que el personaje está haciendo (velocidad, aire, vuelo, miedo, golpe…) y
 * los ángulos de verdad se acercan a ella con amortiguación: así caminar
 * → correr → saltar → aterrizar se encadenan sin saltos, como un «blend
 * tree» pero sin archivos de animación.
 *
 * Yo y ella somos mallas propias, con más detalle. La gente va
 * instanciada: una malla por pieza del cuerpo para TODOS los peatones
 * (≈ 12 llamadas de dibujo para la ciudad entera).
 */
import { J, THREE, clamp, lerp, amort, TAU, contorno } from "./base.js";

/* ══════════════════ LA POSE ══════════════════ */
export const ANG0 = { torsoX: 0, torsoY: 0, torsoZ: 0, cabezaX: 0, cabezaY: 0, hLX: 0, hLZ: 0.08, cLX: 0.15, hRX: 0, hRZ: 0.08, cRX: 0.15, pLX: 0, pLZ: 0, rLX: 0, pRX: 0, pRZ: 0, rRX: 0, pieL: 0, pieR: 0, cuerpoX: 0, cuerpoZ: 0, bajar: 0 };
export function nuevaAnim() {
  return { vel: 0, fase: 0, aire: 0, vuelo: 0, velVuelo: 0, sentado: 0, miedo: 0, arriba: 0, caido: 0, tel: 0, abraza: 0, saluda: 0, habla: 0, agacha: 0, grabar: 0, cargar: 0, apunta: 0, golpe: null, impacto: 0, mirarY: 0, temblor: 0, poder: 0 };
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
    o.torsoX = 0.04 + run * 0.22; o.torsoY = Math.sin(f) * 0.08 * A;
    o.bajar = -Math.abs(Math.cos(f)) * 0.035 * (A + run) + run * 0.04;
    o.pieL = Math.max(0, Math.sin(f)) * 0.3 * A; o.pieR = Math.max(0, -Math.sin(f)) * 0.3 * A;
  } else {
    // respirar de pie
    const r = Math.sin(t * 1.7 + (a.semilla || 0)) * 0.02;
    o.torsoX = r; o.hLZ = 0.1 + r; o.hRZ = 0.1 + r; o.cabezaX = -r * 0.5;
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
    o.cabezaX = lerp(o.cabezaX, -rap * 0.9, k); o.torsoX = lerp(o.torsoX, 0, k); o.bajar = 0;
    o.pieL = o.pieR = lerp(0, 0.6, k);
  }
  // sentado
  if (a.sentado > 0) { const k = a.sentado; o.pLX = lerp(o.pLX, 1.5, k); o.pRX = lerp(o.pRX, 1.5, k); o.rLX = lerp(o.rLX, 1.5, k); o.rRX = lerp(o.rRX, 1.5, k); o.bajar = lerp(o.bajar, -0.47, k); o.hLX = lerp(o.hLX, 0.35, k); o.hRX = lerp(o.hRX, 0.35, k); o.cLX = lerp(o.cLX, 0.9, k); o.cRX = lerp(o.cRX, 0.9, k); o.torsoX = lerp(o.torsoX, -0.08, k); }
  // agachado
  if (a.agacha > 0) { const k = a.agacha; o.pLX = lerp(o.pLX, 1.1, k); o.pRX = lerp(o.pRX, 0.8, k); o.rLX = lerp(o.rLX, 2.0, k); o.rRX = lerp(o.rRX, 1.7, k); o.bajar = lerp(o.bajar, -0.42, k); o.torsoX = lerp(o.torsoX, 0.55, k); }
  // con miedo: brazos a la cabeza y temblando
  if (a.miedo > 0) { const k = a.miedo, tr = Math.sin(t * 40) * 0.04; o.hLX = lerp(o.hLX, 2.2, k); o.hRX = lerp(o.hRX, 2.2, k); o.cLX = lerp(o.cLX, 2.0, k); o.cRX = lerp(o.cRX, 2.0, k); o.hLZ = lerp(o.hLZ, 0.5 + tr, k); o.hRZ = lerp(o.hRZ, 0.5 - tr, k); o.cabezaX = lerp(o.cabezaX, 0.25, k); }
  // mirando hacia arriba (un rayo, la luna, alguien volando)
  if (a.arriba > 0) { const k = a.arriba; o.cabezaX = lerp(o.cabezaX, -0.75, k); o.torsoX = lerp(o.torsoX, -0.14, k); }
  // el teléfono / grabando
  if (a.tel > 0) { const k = a.tel; o.hRX = lerp(o.hRX, 0.75, k); o.cRX = lerp(o.cRX, 1.9, k); o.hRZ = lerp(o.hRZ, -0.15, k); o.cabezaX = lerp(o.cabezaX, 0.45, k); }
  if (a.grabar > 0) { const k = a.grabar; o.hRX = lerp(o.hRX, 1.6, k); o.cRX = lerp(o.cRX, 0.5, k); o.cabezaX = lerp(o.cabezaX, -0.1, k); }
  // saludando
  if (a.saluda > 0) { const k = a.saluda; o.hRX = lerp(o.hRX, 2.6, k); o.hRZ = lerp(o.hRZ, 0.5, k); o.cRX = lerp(o.cRX, 0.6 + Math.sin(t * 9) * 0.5, k); }
  // abrazando
  if (a.abraza > 0) { const k = a.abraza; o.hLX = lerp(o.hLX, 1.3, k); o.hRX = lerp(o.hRX, 1.3, k); o.hLZ = lerp(o.hLZ, -0.35, k); o.hRZ = lerp(o.hRZ, -0.35, k); o.cLX = lerp(o.cLX, 1.2, k); o.cRX = lerp(o.cRX, 1.2, k); }
  // hablando: la cabeza asiente y una mano acompaña
  if (a.habla > 0) { const k = a.habla; o.cabezaX += Math.sin(t * 7) * 0.06 * k; o.hLX = lerp(o.hLX, 0.6 + Math.sin(t * 3) * 0.25, k * 0.8); o.cLX = lerp(o.cLX, 1.4, k * 0.8); }
  // levantando cosas con poder / apuntando
  if (a.cargar > 0) { const k = a.cargar, s = Math.sin(t * 6) * 0.05; o.hRX = lerp(o.hRX, 1.7 + s, k); o.cRX = lerp(o.cRX, 0.1, k); o.hLX = lerp(o.hLX, 1.4 - s, k); o.cLX = lerp(o.cLX, 0.3, k); o.hLZ = lerp(o.hLZ, 0.3, k); o.torsoX = lerp(o.torsoX, -0.12, k); }
  if (a.apunta > 0) { const k = a.apunta; o.hRX = lerp(o.hRX, 1.55, k); o.cRX = lerp(o.cRX, 0.05, k); o.hLX = lerp(o.hLX, 1.45, k); o.cLX = lerp(o.cLX, 0.3, k); }
  // el poder del Modo Dios (brazos que se abren al transformarse)
  if (a.poder > 0) { const k = a.poder; o.hLZ = lerp(o.hLZ, 1.3, k); o.hRZ = lerp(o.hRZ, 1.3, k); o.hLX = lerp(o.hLX, 0.3, k); o.hRX = lerp(o.hRX, 0.3, k); o.cabezaX = lerp(o.cabezaX, -0.5, k); o.torsoX = lerp(o.torsoX, -0.2, k); }
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
      // brazos arriba… y al piso
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
  o.cabezaY = clamp(a.mirarY, -1.1, 1.1);
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
  j.cabeza.rotation.set(g.cabezaX, g.cabezaY, 0);
  // (el izquierdo está en +x: girar en +z lo abre hacia afuera; el derecho, al revés)
  j.hL.rotation.set(-g.hLX, 0, g.hLZ); j.cL.rotation.set(-g.cLX, 0, 0);
  j.hR.rotation.set(-g.hRX, 0, -g.hRZ); j.cR.rotation.set(-g.cRX, 0, 0);
  j.pL.rotation.set(-g.pLX, 0, g.pLZ); j.rL.rotation.set(g.rLX, 0, 0); j.fL.rotation.set(g.pieL, 0, 0);
  j.pR.rotation.set(-g.pRX, 0, -g.pRZ); j.rR.rotation.set(g.rRX, 0, 0); j.fR.rotation.set(g.pieR, 0, 0);
}

/* ══════════════════ EL ESQUELETO ══════════════════ */
const H = { cadera: 0.93, muslo: 0.45, pierna: 0.43, torso: 0.56, brazo: 0.29, ante: 0.27, hombro: 0.19 };
/* Arma la jerarquía de articulaciones (vacía); las piezas se cuelgan después. */
export function esqueleto() {
  const G = () => new THREE.Group();
  const j = { raiz: G(), cuerpo: G(), cadera: G(), torso: G(), cuello: G(), cabeza: G(), hL: G(), cL: G(), manoL: G(), hR: G(), cR: G(), manoR: G(), pL: G(), rL: G(), fL: G(), pR: G(), rR: G(), fR: G() };
  j.raiz.add(j.cuerpo); j.cuerpo.add(j.cadera);
  j.cadera.add(j.torso); j.torso.add(j.cuello); j.cuello.position.y = H.torso; j.cuello.add(j.cabeza);
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

/* Las formas: cápsulas que cuelgan hacia abajo desde su articulación. */
const capsula = (r, l, seg = 6) => new THREE.CapsuleGeometry(r, l, 3, seg).translate(0, -l / 2, 0);
function torsoGeo(ancho = 1, cintura = 1) {
  const g = new THREE.CapsuleGeometry(0.16, 0.3, 4, 10).translate(0, 0.3, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = clamp((y - 0.05) / 0.45, 0, 1); p.setX(i, p.getX(i) * lerp(0.95 * cintura, 1.25 * ancho, k)); p.setZ(i, p.getZ(i) * 0.72); }
  g.computeVertexNormals(); return g;
}

/* ══════════════════ YO Y ELLA (con detalle) ══════════════════ */
export function crearProtagonista(quien) {
  const j = esqueleto();
  const ella = quien === "ella";
  const piel = new THREE.MeshStandardMaterial({ color: ella ? "#d0a07c" : "#c4946c", roughness: 0.62 });
  const negro = new THREE.MeshStandardMaterial({ color: "#17151d", roughness: 0.55, metalness: 0.08 });
  const negro2 = new THREE.MeshStandardMaterial({ color: "#221f2a", roughness: 0.7 });
  const pelo = new THREE.MeshStandardMaterial({ color: "#0b0910", roughness: 0.38, metalness: 0.15 });
  const blanco = new THREE.MeshStandardMaterial({ color: "#f2eef4", roughness: 0.5 });
  const acento = new THREE.MeshStandardMaterial({ color: ella ? "#ff7aa8" : "#8a7aff", roughness: 0.4, emissive: ella ? "#4a1028" : "#14104a" });
  const M = (geo, mat, padre, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; padre.add(m); return m; };
  // torso con su ropa
  M(torsoGeo(ella ? 0.88 : 1.05, ella ? 0.82 : 1), negro, j.torso);
  if (!ella) { M(new THREE.TorusGeometry(0.085, 0.025, 6, 14).rotateX(Math.PI / 2), negro2, j.torso, 0, H.torso - 0.02, 0.02); M(new THREE.BoxGeometry(0.02, 0.2, 0.01), blanco, j.torso, 0.05, 0.38, 0.13); M(new THREE.BoxGeometry(0.02, 0.2, 0.01), blanco, j.torso, -0.05, 0.38, 0.13); }
  else M(new THREE.SphereGeometry(0.035, 8, 6), acento, j.torso, 0.08, 0.46, 0.11);   // un broche rosita
  M(new THREE.SphereGeometry(0.15, 12, 8).scale(1.1, 0.75, 0.85), ella ? negro2 : negro2, j.cadera, 0, 0, 0);
  if (ella) { const falda = new THREE.CylinderGeometry(0.15, 0.27, 0.36, 18, 1, true).translate(0, -0.12, 0); M(falda, negro, j.cadera).material = negro.clone(); }
  // cuello y cabeza
  M(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8).translate(0, 0.05, 0), piel, j.cuello);
  M(new THREE.SphereGeometry(0.125, 16, 12).scale(0.95, 1.08, 1).translate(0, 0.16, 0.005), piel, j.cabeza);
  for (const s of [-1, 1]) { M(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: "#120e14" }), j.cabeza, s * 0.045, 0.17, 0.112); M(new THREE.SphereGeometry(0.006, 6, 4), new THREE.MeshBasicMaterial({ color: "#ffffff" }), j.cabeza, s * 0.045 + 0.006, 0.178, 0.127); }
  M(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 0.6, 0.4), new THREE.MeshBasicMaterial({ color: ella ? "#e88aa0" : "#c87a7a", transparent: true, opacity: 0.55 }), j.cabeza, 0.075, 0.13, 0.1);
  M(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 0.6, 0.4), new THREE.MeshBasicMaterial({ color: ella ? "#e88aa0" : "#c87a7a", transparent: true, opacity: 0.55 }), j.cabeza, -0.075, 0.13, 0.1);
  M(new THREE.TorusGeometry(0.022, 0.006, 4, 10, Math.PI).rotateZ(Math.PI), new THREE.MeshBasicMaterial({ color: "#6a2a30" }), j.cabeza, 0, 0.115, 0.118);
  // el pelo
  if (!ella) {
    M(new THREE.SphereGeometry(0.135, 16, 10, 0, TAU, 0, Math.PI * 0.55).scale(1, 1.05, 1.06).translate(0, 0.17, -0.008), pelo, j.cabeza);
    M(new THREE.SphereGeometry(0.07, 10, 8).scale(1.6, 0.6, 1).translate(0.02, 0.28, 0.07), pelo, j.cabeza);   // el copete
  } else {
    M(new THREE.SphereGeometry(0.14, 16, 10, 0, TAU, 0, Math.PI * 0.58).scale(1, 1.06, 1.08).translate(0, 0.165, -0.01), pelo, j.cabeza);
    const largo = new THREE.Group(); largo.position.set(0, 0.2, -0.06); j.cabeza.add(largo); j.melena = largo;
    M(new THREE.CapsuleGeometry(0.12, 0.34, 4, 10).scale(1.05, 1, 0.45).translate(0, -0.2, -0.03), pelo, largo);
    M(new THREE.CapsuleGeometry(0.035, 0.24, 3, 6).translate(0, -0.12, 0), pelo, j.cabeza, 0.12, 0.17, 0.03);
    M(new THREE.CapsuleGeometry(0.035, 0.24, 3, 6).translate(0, -0.12, 0), pelo, j.cabeza, -0.12, 0.17, 0.03);
    M(new THREE.SphereGeometry(0.03, 8, 6).scale(1.5, 0.7, 0.7), acento, j.cabeza, 0.1, 0.27, -0.01);   // pasador
    for (const s of [-1, 1]) M(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshStandardMaterial({ color: "#ffe0a0", metalness: 0.8, roughness: 0.2 }), j.cabeza, s * 0.123, 0.11, 0.0);
  }
  // brazos (mangas negras, manos de piel)
  for (const [h, c, m] of [[j.hL, j.cL, j.manoL], [j.hR, j.cR, j.manoR]]) {
    M(capsula(ella ? 0.048 : 0.056, H.brazo - 0.04), negro, h);
    M(capsula(ella ? 0.04 : 0.047, H.ante - 0.05), ella ? piel : negro, c);
    M(new THREE.SphereGeometry(ella ? 0.042 : 0.048, 8, 6).scale(0.8, 1.1, 0.6), piel, m, 0, -0.02, 0);
  }
  // piernas y zapatos
  for (const [p, r, f] of [[j.pL, j.rL, j.fL], [j.pR, j.rR, j.fR]]) {
    M(capsula(ella ? 0.068 : 0.075, H.muslo - 0.06), ella ? piel : negro2, p);
    M(capsula(ella ? 0.052 : 0.06, H.pierna - 0.06), ella ? piel : negro2, r);
    M(new THREE.BoxGeometry(ella ? 0.08 : 0.095, 0.06, 0.2).translate(0, -0.035, 0.045), ella ? negro : blanco, f);
    if (!ella) M(new THREE.BoxGeometry(0.1, 0.02, 0.21).translate(0, -0.065, 0.045), negro, f);
  }
  for (const m of [piel, negro, negro2, pelo, blanco]) contorno(m, ella ? "#ffa8d8" : "#b8a8ff", 0.6);
  j.mats = { piel, negro, pelo };
  return j;
}

/* ══════════════════ LA GENTE, INSTANCIADA ══════════════════ */
/* Cada pieza del cuerpo es UNA malla instanciada para todos. Por peatón se
   pone el esqueleto de plantilla en su pose, se recalculan sus matrices y
   se copian a su casilla. Las casillas libres quedan en escala 0. */
const PIEZAS_GENTE = [
  ["torso", () => torsoGeo(1, 1), "ropa"],
  ["cadera", () => new THREE.SphereGeometry(0.15, 10, 6).scale(1.1, 0.75, 0.85), "pantalon"],
  ["falda", () => new THREE.CylinderGeometry(0.15, 0.26, 0.34, 12, 1, true).translate(0, -0.12, 0), "ropa2", (a) => a.falda],
  ["cabeza", () => new THREE.SphereGeometry(0.125, 12, 8).scale(0.95, 1.08, 1).translate(0, 0.16, 0), "piel"],
  ["peloCorto", () => new THREE.SphereGeometry(0.135, 12, 8, 0, TAU, 0, Math.PI * 0.55).translate(0, 0.17, -0.008), "pelo", (a) => a.peinado === 0],
  ["peloLargo", () => new THREE.CapsuleGeometry(0.13, 0.3, 3, 8).scale(1, 1, 0.55).translate(0, 0.02, -0.06), "pelo", (a) => a.peinado === 1],
  ["chongo", () => new THREE.SphereGeometry(0.075, 8, 6).translate(0, 0.3, -0.07), "pelo", (a) => a.peinado === 2],
  ["gorra", () => new THREE.CylinderGeometry(0.135, 0.14, 0.08, 12).translate(0, 0.27, 0), "gorra", (a) => a.peinado === 3],
  ["visera", () => new THREE.BoxGeometry(0.2, 0.02, 0.12).translate(0, 0.24, 0.14), "gorra", (a) => a.peinado === 3],
  ["calvo", () => new THREE.SphereGeometry(0.128, 10, 6, 0, TAU, Math.PI * 0.3, Math.PI * 0.3).translate(0, 0.16, 0), "pelo", (a) => a.peinado === 4],
  ["brazo", () => capsula(0.052, H.brazo - 0.04), "ropa", null, ["hL", "hR"]],
  ["ante", () => capsula(0.045, H.ante - 0.05), "ropa", null, ["cL", "cR"]],
  ["mano", () => new THREE.SphereGeometry(0.045, 6, 5), "piel", null, ["manoL", "manoR"]],
  ["muslo", () => capsula(0.072, H.muslo - 0.06), "pantalon", null, ["pL", "pR"]],
  ["pierna", () => capsula(0.058, H.pierna - 0.06), "pantalon", null, ["rL", "rR"]],
  ["zapato", () => new THREE.BoxGeometry(0.09, 0.06, 0.19).translate(0, -0.035, 0.045), "zapato", null, ["fL", "fR"]],
  ["telefono", () => new THREE.BoxGeometry(0.06, 0.11, 0.012).translate(0, -0.06, 0.04), "telefono", (a) => a.anim.tel > 0.3 || a.anim.grabar > 0.3, ["manoR"]],
  ["bolsa", () => new THREE.BoxGeometry(0.2, 0.22, 0.1).translate(0, -0.13, 0.02), "bolsa", (a) => a.bolsa, ["manoL"]],
];
const PADRE = { torso: "torso", cadera: "cadera", falda: "cadera", cabeza: "cabeza", peloCorto: "cabeza", peloLargo: "cabeza", chongo: "cabeza", gorra: "cabeza", visera: "cabeza", calvo: "cabeza" };
export class Gentio {
  constructor(escena, max) {
    this.max = max; this.libres = []; for (let i = max - 1; i >= 0; i--) this.libres.push(i);
    this.plantilla = esqueleto();
    this.mallas = [];
    const mat = contorno(new THREE.MeshStandardMaterial({ roughness: 0.75 }), "#a898ff", 0.4);
    for (const [nombre, geo, color, cuando, juntas] of PIEZAS_GENTE) {
      const g = geo(); if (!g) continue;
      const n = juntas ? max * juntas.length : max;
      const im = new THREE.InstancedMesh(g, mat, n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.castShadow = J.calidad.sombras; im.frustumCulled = false;
      const cero = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < n; i++) { im.setMatrixAt(i, cero); im.setColorAt(i, new THREE.Color("#ffffff")); }
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
      const col = a.colores[m.color] || a.colores.ropa;
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
   Perritos y gatos: un cuerpo, cabeza, cola y cuatro patas. Instanciados
   también, con un trote que depende de su velocidad. */
export class Animalitos {
  constructor(escena, max) {
    this.max = max; this.libres = []; for (let i = max - 1; i >= 0; i--) this.libres.push(i);
    const mat = contorno(new THREE.MeshStandardMaterial({ roughness: 0.85 }), "#c8b8ff", 0.4);
    const P = (g, n) => { const im = new THREE.InstancedMesh(g, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = J.calidad.sombras; const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < n; i++) { im.setMatrixAt(i, z); im.setColorAt(i, new THREE.Color("#fff")); } escena.add(im); return im; };
    this.cuerpo = P(new THREE.CapsuleGeometry(0.13, 0.32, 3, 8).rotateX(Math.PI / 2), max);
    this.cabeza = P(new THREE.SphereGeometry(0.12, 10, 8), max);
    this.hocico = P(new THREE.SphereGeometry(0.06, 8, 6).scale(1, 0.8, 1.4), max);
    this.oreja = P(new THREE.ConeGeometry(0.045, 0.11, 6), max * 2);
    this.cola = P(new THREE.CapsuleGeometry(0.025, 0.2, 2, 5).translate(0, 0.12, 0), max);
    this.pata = P(new THREE.CapsuleGeometry(0.03, 0.18, 2, 5).translate(0, -0.11, 0), max * 4);
    this.escudo = P(new THREE.SphereGeometry(1, 20, 14), max);
    this.escudo.material = new THREE.MeshBasicMaterial({ color: "#9ad8ff", transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    this.escudo.castShadow = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.base = new THREE.Matrix4(); this.loc = new THREE.Matrix4();
  }
  alta(a) {
    if (a.casilla != null) return true; const c = this.libres.pop(); if (c == null) return false; a.casilla = c;
    const col = new THREE.Color(a.color), osc = col.clone().multiplyScalar(0.7);
    this.cuerpo.setColorAt(c, col); this.cabeza.setColorAt(c, col); this.hocico.setColorAt(c, a.tipo === "perro" ? osc : col); this.cola.setColorAt(c, col);
    for (let k = 0; k < 2; k++) this.oreja.setColorAt(c * 2 + k, osc);
    for (let k = 0; k < 4; k++) this.pata.setColorAt(c * 4 + k, col);
    for (const im of [this.cuerpo, this.cabeza, this.hocico, this.cola, this.oreja, this.pata]) im.instanceColor.needsUpdate = true;
    return true;
  }
  baja(a) {
    if (a.casilla == null) return; const c = a.casilla, z = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const [im, n] of [[this.cuerpo, 1], [this.cabeza, 1], [this.hocico, 1], [this.cola, 1], [this.escudo, 1], [this.oreja, 2], [this.pata, 4]]) { for (let k = 0; k < n; k++) im.setMatrixAt(c * n + k, z); im.instanceMatrix.needsUpdate = true; }
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
      for (let k = 0; k < 2; k++) { const sx = k ? 1 : -1; this.pon(this.oreja, c * 2 + k, sx * 0.07, alto + (perro ? 0.25 : 0.27) + sube, perro ? 0.28 : 0.25, perro ? 0.5 : 0, 0, sx * (perro ? 0.9 : 0.2), 1, perro ? 0.8 : 1); }
      const cola = perro ? Math.sin(t * (a.feliz ? 18 : 6)) * 0.6 : Math.sin(t * 2) * 0.4;
      this.pon(this.cola, c, 0, alto + 0.08, -0.26, -0.6, 0, cola, 1);
      for (let k = 0; k < 4; k++) { const sx = k % 2 ? 1 : -1, sz = k < 2 ? 1 : -1, ph = (k === 0 || k === 3 ? 0 : Math.PI); this.pon(this.pata, c * 4 + k, sx * 0.08, alto - 0.04, sz * 0.15, Math.sin(f + ph) * 0.7 * trote, 0, 0, 1, perro ? 1 : 0.75); }
      const esc = a.escudo || 0;
      if (esc > 0.01) this.pon(this.escudo, c, 0, alto, 0, 0, t, 0, 0.75 * Math.min(1, esc * 2) * (1 + Math.sin(t * 6) * 0.03)); else this.escudo.setMatrixAt(c, this.m.makeScale(0, 0, 0));
    }
    for (const im of [this.cuerpo, this.cabeza, this.hocico, this.cola, this.oreja, this.pata, this.escudo]) im.instanceMatrix.needsUpdate = true;
  }
}
