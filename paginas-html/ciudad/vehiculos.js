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
import { J, THREE, rnd, elegir, clamp, lerp, amort, amortAng, difAng, anunciar, Juntador, contorno, toon, pbr, fisico, capaEfectos } from "./base.js";
import { nodosCalle, CALLES, chocarEdificios, edificioEn, ACERA_Y, semaforo } from "./mundo.js";
import { son, bucleEn, motorRpm } from "./audio.js";
import { chispas, humo, fuego, polvo, escombro, onda, destello, brillos } from "./efectos.js";
import { derribar, rejilla } from "./gente.js";
import { E, globito, decir } from "./ui.js";

const PINTURAS = ["#e05a6a", "#4a7ad8", "#f2ece0", "#3a3a4e", "#f0a838", "#5aa07a", "#9a5ad0", "#7ad0f0", "#f4d468", "#f08aa8"];
/* L largo, A ancho, H alto, cab: dónde empieza y acaba la cabina (en z), techo, capó y cajuela, ejes. */
const TIPOS = {
  sedan: { L: 4.4, A: 1.84, H: 1.45, cab: [-1.0, 0.85], techo: 1.45, cintura: 0.92, masa: 1.2, pintura: PINTURAS, ejes: [1.4, -1.35] },
  vocho: { L: 3.9, A: 1.7, H: 1.52, cab: [-0.75, 0.7], techo: 1.52, cintura: 0.86, masa: 0.9, redondo: true, pintura: ["#7ad0f0", "#f4d468", "#f08aa8", "#8ad89a", "#f6f2e8", "#e86a4a"], ejes: [1.2, -1.15] },
  taxi: { L: 4.4, A: 1.84, H: 1.48, cab: [-1.0, 0.85], techo: 1.48, cintura: 0.92, masa: 1.2, pintura: ["#f6c632"], taxi: true, ejes: [1.4, -1.35] },
  pickup: { L: 5.0, A: 1.96, H: 1.78, cab: [-0.2, 1.15], techo: 1.78, cintura: 1.05, masa: 1.6, caja: true, pintura: ["#6a7a8e", "#b84a3a", "#3a6a52", "#e2dac8"], ejes: [1.6, -1.55] },
  camion: { L: 9.5, A: 2.5, H: 3.1, cab: [-4.4, 4.4], techo: 3.1, cintura: 1.25, masa: 5, autobus: true, pintura: ["#f0a838", "#4a9ad0", "#d85a4a"], ejes: [3.2, -3.0] },
  patrulla: { L: 4.6, A: 1.86, H: 1.52, cab: [-1.0, 0.85], techo: 1.52, cintura: 0.92, masa: 1.3, pintura: ["#1e2234"], poli: true, ejes: [1.45, -1.4] },
};

/* ══════════════════ LOS MODELOS ══════════════════
   Todo «de dibujo» (toon). Por tipo se arman una vez las geometrías:
   · la lámina (con el color de cada coche): perfil lateral con capó,
     cajuela y los pasos de rueda recortados, extruido con orillas suaves;
   · la cabina de vidrio, el techo y los postes;
   · las dos puertas delanteras, que son piezas aparte (se abren);
   · el resto: defensas, parrilla, interior con asientos y volante,
     espejos, placas y manijas;
   · las luces (faros, calaveras y cuartos). */
const geoCache = {};
/* La carrocería y los vidrios llevan materiales de verdad: la pintura tiene
   barniz encima (clearcoat) y el vidrio refleja como espejo, los dos usando
   el cielo de la hora (J.entorno). Por eso ya no parecen bloques de color. */
const matVidrio = fisico({ color: "#101828", roughness: 0.06, metalness: 0.55, envMapIntensity: 1.5, emissive: "#0a1020" });
const matVidrioRoto = pbr({ color: "#6a7488", roughness: 0.75 });
const matResto = pbr({ vertexColors: true, roughness: 0.42, metalness: 0.45, envMapIntensity: 1.1 });
const matLuces = new THREE.MeshBasicMaterial({ vertexColors: true });
J.matLucesCoche = matLuces;   // luces.js le sube el brillo de noche
// el velo de los faros: se desvanece a lo largo y hacia los bordes (sin cortes duros en el piso)
// el charco de luz de los faros, pintado en el piso: un abanico suave que se abre y se apaga a lo lejos
const matHaz = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  uniforms: { uA: { value: 0 } },
  vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform float uA; varying vec2 vU; void main(){ float y = vU.y; float w = 0.28 + 0.72 * y; float x = abs(vU.x - 0.5) * 2.0 / w; float lat = 1.0 - smoothstep(0.35, 1.0, x); float lon = smoothstep(0.0, 0.14, y) * (1.0 - smoothstep(0.3, 1.0, y)); float a = uA * lat * lon; gl_FragColor = vec4(vec3(1.0, 0.9, 0.72) * a, a); }",
});
const extruir = (forma, ancho, bisel = 0.07) => { const g = new THREE.ExtrudeGeometry(forma, { depth: ancho, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -ancho / 2); g.rotateY(-Math.PI / 2); return g; };
function geometrias(tipo) {
  if (geoCache[tipo]) return geoCache[tipo];
  const T = TIPOS[tipo], L = T.L, A = T.A, cin = T.cintura, [zf, zr] = T.ejes, R = T.autobus ? 0.52 : 0.38, piso = 0.3;
  // ── la lámina: el perfil de lado, con los pasos de rueda ──
  const f = new THREE.Shape();
  const arco = (zc) => { f.lineTo(zc + R + 0.08, piso); f.absarc(zc, piso, R + 0.08, 0, Math.PI, false); };
  if (T.autobus) {
    f.moveTo(-L / 2, piso); f.lineTo(-L / 2, T.H - 0.2); f.quadraticCurveTo(-L / 2, T.H, -L / 2 + 0.25, T.H); f.lineTo(L / 2 - 0.4, T.H); f.quadraticCurveTo(L / 2, T.H, L / 2, T.H - 0.5); f.lineTo(L / 2, piso);
  } else if (T.redondo) {
    f.moveTo(-L / 2 + 0.1, piso); f.quadraticCurveTo(-L / 2 - 0.05, cin * 0.75, -L / 2 + 0.35, cin + 0.02);
    f.quadraticCurveTo(-0.2, T.techo + 0.12, T.cab[1] + 0.2, cin + 0.12); f.quadraticCurveTo(L / 2 - 0.1, cin + 0.02, L / 2, cin * 0.62); f.lineTo(L / 2 - 0.05, piso);
  } else {
    f.moveTo(-L / 2 + 0.05, piso); f.lineTo(-L / 2, cin - 0.18); f.quadraticCurveTo(-L / 2, cin + 0.02, -L / 2 + 0.3, cin + 0.04);
    f.lineTo(T.cab[0] - 0.2, cin + 0.06); f.lineTo(T.cab[1] + 0.25, cin + 0.04); f.lineTo(L / 2 - 0.35, cin - 0.02);
    f.quadraticCurveTo(L / 2 + 0.02, cin - 0.06, L / 2, cin - 0.32); f.lineTo(L / 2 - 0.04, piso);
  }
  // por abajo, de adelante hacia atrás, recortando las ruedas
  arco(zf); arco(zr); f.lineTo(-L / 2 + (T.autobus ? 0 : 0.05), piso);
  const lamina = extruir(f, A - 0.14, 0.07);
  const partes = [lamina];
  // ── techo y postes (también llevan la pintura) ──
  const [c0, c1] = T.cab, alto = T.techo;
  if (!T.autobus) {
    const t = new THREE.Shape(), r0 = c0 + 0.32, r1 = c1 - 0.28;
    t.moveTo(r0, alto - 0.07); t.lineTo(r1, alto - 0.07); t.quadraticCurveTo(r1 + 0.08, alto, r1 - 0.02, alto); t.lineTo(r0 + 0.02, alto); t.quadraticCurveTo(r0 - 0.08, alto, r0, alto - 0.07);
    partes.push(extruir(t, A - 0.32, 0.04));
    for (const s of [-1, 1]) for (const [za, zb] of [[c1 + 0.15, c1 - 0.3], [c0 - 0.1, c0 + 0.34], [(c0 + c1) / 2 + 0.05, (c0 + c1) / 2 + 0.05]]) {
      const largo = Math.hypot(zb - za, alto - cin), g = new THREE.BoxGeometry(0.07, largo, 0.09);
      g.rotateX(Math.atan2(zb - za, alto - cin)); g.translate(s * (A / 2 - 0.17), (cin + alto) / 2, (za + zb) / 2); partes.push(g);
    }
  }
  const pint = unir(partes); pint.computeVertexNormals();
  // ── la cabina de vidrio ──
  let vidrio;
  if (T.autobus) {
    const v = new Juntador(); for (const s of [-1, 1]) v.caja(s * (A / 2 - 0.02), 2.15, -0.2, 0.06, 0.95, L - 1.6); v.caja(0, 2.0, L / 2 - 0.02, A - 0.3, 1.25, 0.06); v.caja(0, 2.1, -L / 2 + 0.02, A - 0.4, 0.8, 0.06); vidrio = v.geometria(); vidrio.deleteAttribute("color");
  } else {
    const g = new THREE.Shape(), b0 = c0 - 0.15, b1 = c1 + 0.2;
    g.moveTo(b0, cin); g.lineTo(b1, cin); g.lineTo(c1 - 0.28, alto - 0.06); g.lineTo(c0 + 0.32, alto - 0.06); g.lineTo(b0, cin);
    vidrio = extruir(g, A - 0.36, 0.03);
  }
  // ── las puertas delanteras: piezas aparte, con la bisagra adelante ──
  const zp1 = T.autobus ? 0 : c1 + 0.1, zp0 = T.autobus ? 0 : (c0 + c1) / 2 + 0.02, lp = zp1 - zp0;
  const puerta = new THREE.BoxGeometry(0.06, cin - 0.38, lp).translate(0, (cin + 0.38) / 2, -lp / 2);
  const puertaV = new THREE.BoxGeometry(0.04, (alto - cin) * 0.8, lp * 0.9).translate(-0.01, cin + (alto - cin) * 0.42, -lp / 2);
  // ── el resto ──
  const j = new Juntador();
  const ruedas = []; for (const ez of [zf, zr]) for (const s of [-1, 1]) ruedas.push([s * (A / 2 - 0.12), R, ez]);
  j.caja(0, 0.38, L / 2 + 0.03, A - 0.06, 0.22, 0.16, "#3e3e48"); j.caja(0, 0.38, -L / 2 - 0.03, A - 0.06, 0.22, 0.16, "#3e3e48");   // defensas
  if (!T.autobus) { j.caja(0, cin - 0.24, L / 2 + 0.02, A * 0.46, 0.17, 0.05, "#26262e"); for (let k = 0; k < 4; k++) j.caja(0, cin - 0.3 + k * 0.045, L / 2 + 0.05, A * 0.44, 0.012, 0.02, "#8a8a96"); }   // parrilla
  j.caja(0, 0.46, L / 2 + 0.12, 0.42, 0.12, 0.02, "#f4f4f4"); j.caja(0, 0.5, -L / 2 - 0.12, 0.42, 0.12, 0.02, "#f4f4f4");   // placas
  // el interior: piso, asientos, tablero, volante
  j.caja(0, 0.48, 0, A - 0.3, 0.08, L - 1.2, "#3a2c3a");
  if (!T.autobus) {
    for (const s of [-1, 1]) { j.caja(s * 0.42, 0.62, -0.05 + (c0 + c1) * 0.18, 0.5, 0.18, 0.55, "#5a3a4a"); j.caja(s * 0.42, 0.95, -0.32 + (c0 + c1) * 0.18, 0.5, 0.6, 0.12, "#5a3a4a"); j.caja(s * 0.42, 1.3, -0.34 + (c0 + c1) * 0.18, 0.28, 0.16, 0.1, "#5a3a4a"); }
    if (c0 < -0.6) { j.caja(0, 0.62, c0 + 0.45, A - 0.45, 0.18, 0.55, "#5a3a4a"); j.caja(0, 0.95, c0 + 0.2, A - 0.45, 0.6, 0.12, "#5a3a4a"); }
    j.caja(0, cin + 0.02, c1 - 0.05, A - 0.36, 0.14, 0.42, "#2a2430");
    const vol = new THREE.TorusGeometry(0.17, 0.025, 6, 16).rotateX(Math.PI / 2 - 0.5).translate(0.42, cin + 0.12, c1 - 0.35);
    j.meter(vol, new THREE.Matrix4(), "#1e1a22");
    for (const s of [-1, 1]) { j.caja(s * (A / 2 + 0.06), cin + 0.1, c1 + 0.12, 0.14, 0.09, 0.16, "#2a2a32"); j.caja(s * (A / 2 + 0.035), cin - 0.12, (c0 + c1) / 2 + 0.25, 0.03, 0.03, 0.14, "#c8c8d0"); }
  }
  if (T.caja) { j.caja(0, cin + 0.12, -L / 2 + 1.05, A - 0.16, 0.3, 0.08, "#4a4a52"); for (const s of [-1, 1]) j.caja(s * (A / 2 - 0.1), cin + 0.12, -L / 2 + 1.0, 0.08, 0.3, 1.9, "#4a4a52"); }
  if (T.taxi) { j.caja(0, alto + 0.11, -0.05, 0.6, 0.2, 0.26, "#fff8e0"); }
  if (T.poli) { j.caja(0, alto + 0.05, -0.05, 1.2, 0.1, 0.32, "#14141c"); }
  const resto = j.geometria();
  // ── las luces ──
  const l = new Juntador();
  const yf = T.autobus ? 0.75 : cin - 0.2;
  for (const s of [-1, 1]) {
    l.caja(s * (A / 2 - 0.3), yf, L / 2 + 0.03, 0.36, 0.13, 0.05, "#fff4d8");
    l.caja(s * (A / 2 - 0.2), yf + 0.02, -L / 2 - 0.03, 0.3, 0.14, 0.05, "#ff3048");
    l.caja(s * (A / 2 - 0.06), yf - 0.04, L / 2 + 0.01, 0.1, 0.08, 0.05, "#ffb030");
  }
  if (T.taxi) l.caja(0, alto + 0.12, -0.05, 0.5, 0.12, 0.28, "#ffe8a0");
  const luces = l.geometria();
  geoCache[tipo] = { pint, resto, vidrio, luces, ruedas, puerta, puertaV, zp1, R, asiento: [0.42, 0.12, -0.05 + (c0 + c1) * 0.18] };
  return geoCache[tipo];
}
function unir(geos) {
  const j = new Juntador(); for (const g of geos) j.meter(g.index ? g : g, new THREE.Matrix4(), "#ffffff");
  const r = j.geometria(); r.deleteAttribute("color"); return r;
}
const matRueda = pbr({ color: "#1c1c22", roughness: 0.92, metalness: 0 });
const matRin = pbr({ color: "#d2d4de", roughness: 0.22, metalness: 0.95, envMapIntensity: 1.4 });
const ruedaGeo = {}, rinGeo = {};
const geoRueda = (R) => ruedaGeo[R] || (ruedaGeo[R] = new THREE.CylinderGeometry(R, R, 0.26, 18).rotateZ(Math.PI / 2));
const geoRin = (R) => rinGeo[R] || (rinGeo[R] = new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.28, 10).rotateZ(Math.PI / 2));
// los halitos de los faros y las calaveras (se prenden de tarde y de noche)
const texHalo = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const matHaloF = new THREE.SpriteMaterial({ map: texHalo, color: "#fff1d6", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
const matHaloR = new THREE.SpriteMaterial({ map: texHalo, color: "#ff3a3a", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
const hazGeo = (() => { const g = new THREE.PlaneGeometry(4.6, 10); g.rotateX(Math.PI / 2); g.translate(0, 0, 5); return g; })();
function construirCoche(tipo) {
  const G = geometrias(tipo), T = TIPOS[tipo];
  // el origen del coche es su centro (así gira bien al volar); el modelo cuelga medio alto abajo
  const raiz = new THREE.Group(), piv = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(piv); piv.position.y = -T.H / 2; piv.add(cuerpo);
  const pintura = contorno(fisico({ color: elegir(T.pintura), roughness: 0.3, metalness: 0.42, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.25 }), "#ffffff", 0.14, 3);
  const geoP = G.pint.clone();   // cada coche tiene su lámina (para abollarla)
  const mP = new THREE.Mesh(geoP, pintura), mR = new THREE.Mesh(G.resto, matResto), mV = new THREE.Mesh(G.vidrio, matVidrio), mL = new THREE.Mesh(G.luces, matLuces);
  for (const m of [mP, mR]) { m.castShadow = J.calidad.sombras; m.receiveShadow = true; }
  cuerpo.add(mP, mR, mV, mL);
  // las puertas (la izquierda es la del conductor: +x del coche)
  const puertas = T.autobus ? [] : [1, -1].map((s) => {
    const p = new THREE.Group(); p.position.set(s * (T.A / 2 - 0.02), 0, G.zp1); cuerpo.add(p);
    const a = new THREE.Mesh(G.puerta, pintura), b = new THREE.Mesh(G.puertaV, matVidrio); a.castShadow = J.calidad.sombras; p.add(a, b);
    return { p, s, ang: 0, obj: 0 };
  });
  const ruedas = G.ruedas.map(([x, y, z]) => { const r = new THREE.Group(); r.position.set(x, y, z); const a = new THREE.Mesh(geoRueda(G.R), matRueda), b = new THREE.Mesh(geoRin(G.R), matRin); a.castShadow = J.calidad.sombras; r.add(a, b); piv.add(r); return r; });
  const haces = [0].map(() => { const h = new THREE.Mesh(hazGeo, matHaz); h.position.set(0, 0.06, T.L / 2 - 0.2); h.renderOrder = 1; cuerpo.add(capaEfectos(h)); return h; });
  // halitos: dos adelante (faros) y dos atrás (calaveras)
  const halos = [];
  for (const s of [-1, 1]) for (const [z, m, t] of [[T.L / 2 + 0.06, matHaloF, 0.7], [-T.L / 2 - 0.06, matHaloR, 0.45]]) {
    const h = new THREE.Sprite(m); halos.push(h); h.scale.setScalar(t); h.position.set(s * (T.A / 2 - 0.32), T.autobus ? 0.8 : T.cintura - 0.18, z); cuerpo.add(capaEfectos(h));
  }
  let torreta = null;
  if (T.poli) {
    torreta = [new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), new THREE.MeshBasicMaterial({ color: "#ff2030" })), new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), new THREE.MeshBasicMaterial({ color: "#2050ff" }))];
    torreta[0].position.set(-0.29, T.techo + 0.16, -0.05); torreta[1].position.set(0.29, T.techo + 0.16, -0.05); cuerpo.add(...torreta);
    const letrero = new THREE.Mesh(new THREE.BoxGeometry(T.A - 0.08, 0.3, 1.5), toon({ color: "#f4f4f8" })); letrero.position.set(0, 0.68, -0.3); cuerpo.add(letrero);
  }
  J.escena.add(raiz);
  return { raiz, cuerpo, mP, mV, mL, ruedas, haces, halos, torreta, pintura, geoP, puertas, asiento: G.asiento, base: G.pint.attributes.position.array.slice() };
}
/* Abrir / cerrar una puerta (s: 1 conductor, -1 pasajero). */
export function puerta(c, s, abierta) { const p = c.m.puertas.find((q) => q.s === s); if (p) { if (abierta && p.obj === 0) son("puerta", c.x, c.z, 0.6); p.obj = abierta ? 1.05 : 0; } }
/* Dónde queda un punto del coche en el mundo (x local: + izquierda; z local: + adelante). */
export function puntoDelCoche(c, lx, ly, lz, fuera = {}) {
  const s = Math.sin(c.ry), co = Math.cos(c.ry);
  fuera.x = c.x + lx * co + lz * s; fuera.z = c.z - lx * s + lz * co; fuera.y = c.y - c.T.H / 2 + ly;
  return fuera;
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
    desde: 0, hacia: 1, carril: 1, desvio: 0, desvioObj: 0, bloqueado: 0, claxon: 0, panico: 0, mani: null, cabeceo: 0, balanceo: 0, rgiro: 0, conductor: Math.random() < 0.9,
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
  J.golpearCoches = golpearCoches; J.explotarCoche = explotar; J.incendiarCoche = incendiar; J.cocheEn = cocheEn;
}
export function cocheEn(x, z, r = 2.5) { let m = null, md = 1e9; for (const c of J.coches) { if (c.estado === "fuera" || c.fase === "RESTOS") continue; const d = Math.hypot(c.x - x, c.z - z); if (d < r + c.T.L / 2 && d < md) { md = d; m = c; } } return m; }

/* ══════════════════ MANEJAR (el tráfico) ══════════════════ */
const _c = [];
const _pt = { x: 0, z: 0 };
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
  if (c.paso > 0) c.paso -= dt;   // destrabe: si dos que se cruzan se esperan uno al otro, éste pasa primero
  for (const o of J.coches) if (o !== c && o.estado !== "fuera" && Math.abs(o.x - c.x) < 16 && Math.abs(o.z - c.z) < 16) {
    const cruza = o.estado === "maneja" && Math.cos(difAng(o.ry, c.ry)) < 0.3, tipo = cruza ? "cruce" : "coche";
    if (cruza && c.paso > 0) continue;
    // el centro, la trompa y la cola del otro (así uno atravesado o que cruza también lo frena)
    mirar(o, o.T.A / 2, tipo);
    if (Math.cos(difAng(o.ry, c.ry)) < 0.9) {
      const ox = Math.sin(o.ry) * o.T.L * 0.42, oz = Math.cos(o.ry) * o.T.L * 0.42;
      _pt.x = o.x + ox; _pt.z = o.z + oz; mirar(_pt, o.T.A / 2, tipo);
      _pt.x = o.x - ox; _pt.z = o.z - oz; mirar(_pt, o.T.A / 2, tipo);
    }
  }
  // el semáforo del cruce al que llega: en rojo (o ámbar, si alcanza a frenar) se para antes de la esquina
  if (!c.mani && c.panico <= 0) {
    const luz = semaforo(c.hacia, Math.abs(uz) > Math.abs(ux) ? "NS" : "EO"), alto = L - 9.6 - s;
    if (alto > -0.4 && alto < vision + 4 && (luz === "rojo" || (luz === "ambar" && alto > c.vel * 0.9))) { const d = alto + 1.5; if (d < freno) { freno = d; quien = "semaforo"; } }
  }
  // velocidad: frenar con suavidad hasta detenerse a 1.5 m
  let vObj = c.velMax * (c.panico > 0 ? 1.5 : 1);
  if (c.mani) vObj = Math.min(vObj, 6.5);
  if (freno < 1e8) vObj = Math.min(vObj, Math.max(0, (freno - 1.5) * 1.6));
  const frena = vObj < c.vel - 0.5;
  c.vel = amort(c.vel, vObj, frena ? 5 : 1.4, dt);
  c.cabeceo = amort(c.cabeceo, frena ? 0.035 : c.vel < vObj - 1 ? -0.02 : 0, 6, dt);
  if (c.panico > 0) c.panico -= dt;
  // bloqueado: claxon y, si se puede, rodear por el otro carril
  if (freno < 3 && c.vel < 0.6 && quien !== "coche" && quien !== "cruce" && quien !== "semaforo") {
    c.bloqueado += dt;
    if (c.bloqueado > 0.7 && c.claxon <= 0) { son("claxon", c.x, c.z); c.claxon = c.bloqueado > 4 ? 1.6 : 3; if (quien === "yo" && Math.random() < 0.5) globito(c, elegir(["¡Muévete, joven!", "¡Piii! ¡Quítate!", "¿Qué haces ahí parado?", "¡Oiga!"]), "gente", 2, 2.1); }
    if (c.bloqueado > 2.2 && !c.mani) {
      const libre = !J.coches.some((o) => o !== c && o.estado !== "fuera" && Math.abs((o.x - c.x) * rx + (o.z - c.z) * rz + 5.6) < 2.5 && Math.abs((o.x - c.x) * fx + (o.z - c.z) * fz) < 14);
      if (libre) { c.desvioObj = -5.6; c.rodeando = 3.5; }
    }
  } else c.bloqueado = 0;
  if (c.claxon > 0) c.claxon -= dt;
  if (quien === "cruce" && c.vel < 0.3) { c.esperaCoche = (c.esperaCoche || 0) + dt; if (c.esperaCoche > 5 + (c.desde % 3)) { c.esperaCoche = 0; c.paso = 1.6; } } else c.esperaCoche = 0;
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
  // la lámina se hunde de verdad (más hondo y más ancho cuanto más fuerte)
  abollar(c, x, y, z, clamp(0.1 + k * 0.32, 0, 0.62), 0.9 + k * 1.1);
  c.dano = Math.min(1.2, c.dano + k * 0.2 / c.T.masa);
  // una puerta del lado del golpe se bota y se queda colgando
  if (k > 0.5 && c.m.puertas.length && Math.random() < 0.45) {
    _l.set(x, y, z); c.m.raiz.worldToLocal(_l);
    const p = c.m.puertas.find((q) => Math.sign(q.s) === Math.sign(_l.x)) || c.m.puertas[0];
    if (!p.rota) { p.rota = true; p.obj = rnd(0.35, 0.9); son("puerta", x, z, 0.8); }
  }
  J.temblor = Math.max(J.temblor || 0, clamp(k * 0.35, 0, 0.6) * clamp(1 - Math.hypot(x - J.jugador.x, z - J.jugador.z) / 60, 0, 1));
  if (k > 0.45 && c.vidrios < 2) { c.vidrios++; c.m.mV.material = matVidrioRoto; son("vidrio", x, z); brillos(x, y + 1, z, 10, "azul", 0.6, 3); }
  if (k > 0.3 && c.conductor && c.estado !== "conducido" && Math.random() < 0.5) sacarConductor(c);
  if (k > 0.4) { c.alarma = 4; son("alarma", c.x, c.z); }
  if (c.fase === "NORMAL" && c.dano > 0.15) c.fase = "GOLPEADO";
  if (c.dano > 0.5 && c.fase !== "ARDIENDO") c.fase = "DAÑADO";
  J.caos += k * 4;
  if (k > 0.35) anunciar({ tipo: "choque", x, z, radio: 18 + k * 10, fuerza: k });
  // ya muy dañado, se prende el motor: humo negro, fuego en el cofre… y una mecha de
  // varios segundos antes de explotar (da tiempo de bajarse y correr)
  if (c.dano >= 0.85) incendiar(c, c.dano >= 1.1 ? rnd(3, 5) : rnd(7, 11));
}
/* El motor se prende: `t` segundos de fuego en el cofre y luego explota. */
export function incendiar(c, t) {
  if (c.fase === "ARDIENDO" || c.fase === "RESTOS" || c.fase === "RECUPERANDO" || c.estado === "fuera") return;
  if (c.mecha == null || t < c.mecha) c.mecha = t;
  if (!c.alarma) { c.alarma = 3; son("alarma", c.x, c.z); }
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
/* Que se detenga para subirme (y que el que manejaba se baje). */
export function prepararParaSubir(c) {
  if (c.conductor) sacarConductor(c);
  if (c.estado === "maneja") { c.estado = "estacionado"; c.vel = 0; }
  if (c.estado === "fisica") { c.q.setFromAxisAngle(arriba, c.ry); c.y = c.T.H / 2; c.estado = "estacionado"; c.vx = c.vz = c.vy = 0; c.w.set(0, 0, 0); }
}
export function subirAlCoche(c) {
  const yo = J.jugador;
  prepararParaSubir(c);
  c.estado = "conducido"; c.vel = 0; yo.coche = c; c.mani = null;
  bucleEn("motor", 0.08, c.x, c.z);
}
export function bajarDelCoche(rapido = false) {
  const yo = J.jugador, c = yo.coche; if (!c) return;
  yo.coche = null;
  bucleEn("motor", 0);
  if (rapido) { yo.x = c.x + Math.cos(c.ry) * 1.7; yo.z = c.z - Math.sin(c.ry) * 1.7; yo.y = 0.2; yo.vx = yo.vz = 0; yo.subir = yo.bajar = null; if (J.novia.coche === c) { J.novia.estado = "sigue"; J.novia.coche = null; J.novia.x = c.x - Math.cos(c.ry) * 1.7; J.novia.z = c.z + Math.sin(c.ry) * 1.7; J.novia.y = 0.2; } }
  if (c.estado === "conducido") { c.estado = "estacionado"; c.vel = 0; }
}
function conducir(c, dt) {
  /* Manejar de verdad: el volante (flechas) gira las llantas poco a poco y el
     coche da vuelta según su velocidad (modelo de bicicleta: parado no gira);
     el pedal acelera, y si pides reversa yendo hacia adelante, primero frena.
     Suelto, el coche rueda y se va frenando solo. */
  const vmax = 19;
  const libre = !(J.esperandoElla && J.esperandoElla()) && !J.jugador.subir && !J.jugador.bajar;
  const giroObj = libre ? E.giro : 0;
  c.volante = amort(c.volante || 0, giroObj, giroObj ? 4.5 : 6.5, dt);
  const L = c.T.L * 0.62, ang = c.volante * 0.62 / (1 + Math.abs(c.vel) / 13);
  const p = libre ? E.pedal : 0;
  let a;
  if (p > 0) a = c.vel < -0.3 ? 15 : 7.2 * (1 - clamp(c.vel / vmax, 0, 1));
  else if (p < 0) a = c.vel > 0.3 ? -15 : -4.8 * (1 - clamp(-c.vel / 7, 0, 1));
  else a = -Math.sign(c.vel) * Math.min(Math.abs(c.vel) / Math.max(dt, 1e-3), 1.4 + Math.abs(c.vel) * 0.16);
  c.vel += a * dt;
  if (!p && Math.abs(c.vel) < 0.06) c.vel = 0;
  const w = c.vel * Math.tan(ang) / L;            // qué tan rápido gira (rad/s)
  c.ry -= w * dt;
  c.rgiro = -c.volante * 0.25;                     // las llantas de adelante (dibujo)
  c.x += Math.sin(c.ry) * c.vel * dt; c.z += Math.cos(c.ry) * c.vel * dt;
  const antes = { x: c.x, z: c.z };
  if (chocarEdificios(c, c.T.A * 0.55, 0)) { if (Math.abs(c.vel) > 5) impacto(c, Math.abs(c.vel) * 0.8, antes.x + Math.sin(c.ry) * 2, 0.5, antes.z + Math.cos(c.ry) * 2); c.vel *= -0.3; }
  c.x = clamp(c.x, -79, 79); c.z = clamp(c.z, -79, 79); c.y = c.T.H / 2;
  // la carrocería: se va de nariz al frenar, se sienta al acelerar y se recarga hacia afuera en las curvas
  c.cabeceo = amort(c.cabeceo, clamp(-a * 0.0042, -0.035, 0.05), 6, dt);
  c.balanceo = amort(c.balanceo, clamp(-c.vel * w * 0.011, -0.075, 0.075), 5, dt);
  // derrapar: a mucha velocidad y con todo el volante, chillan las llantas
  if (Math.abs(c.vel * w) > 9 && Math.abs(c.vel) > 8) { if (Math.random() < dt * 8) son("frenazo", c.x, c.z, 0.35); }
  motorRpm(clamp(Math.abs(c.vel) / vmax, 0, 1)); bucleEn("motor", 0.08 + Math.abs(c.vel) / vmax * 0.06, c.x, c.z);
  // atropellar NO: la gente se quita (y si no alcanza, sólo se cae)
  rejilla.cerca(c.x, c.z, 4, _c);
  for (const a of _c) { const d = Math.hypot(a.x - c.x, a.z - c.z); if (d < 1.6 && a.estado !== "HERIDO" && a.estado !== "DENTRO") { derribar(a, (a.x - c.x) / (d || 1), (a.z - c.z) / (d || 1), 0.6); c.vel *= 0.6; } }
  if (E.saltar || E.golpe) { /* claxon */ son("claxon", c.x, c.z); }
}

/* ══════════════════ CADA CUADRO ══════════════════ */
export function actualizar(dt, dtReal) {
  const prendidas = Math.max(0, J.ciclo.farolas * 1.1 - 0.1);
  matHaz.uniforms.uA.value = 0.42 * prendidas; matHaloF.opacity = 0.75 * prendidas; matHaloR.opacity = 0.6 * prendidas + 0.08;
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
  if (c.mecha != null && c.fase !== "ARDIENDO" && c.fase !== "RESTOS") {
    c.mecha -= dt;
    const fx0 = c.x + Math.sin(c.ry) * c.T.L * 0.36, fz0 = c.z + Math.cos(c.ry) * c.T.L * 0.36, crece = clamp(1 - c.mecha / 8, 0.25, 1);
    if (Math.random() < dt * 16 * crece) fuego(fx0 + rnd(-0.3, 0.3), c.y + c.T.H * 0.45, fz0 + rnd(-0.3, 0.3), 1, 0.5 + crece * 0.8);
    if (Math.random() < dt * 9) humo(fx0, c.y + c.T.H * 0.7, fz0, 1, 1 + crece, true);
    if (c.mecha < 1.2 && Math.random() < dt * 10) chispas(fx0, c.y + 0.6, fz0, 3, 4, "fuego2");
    if (c.mecha <= 0) { c.mecha = null; explotar(c); }
  }
  if (c.fase === "ARDIENDO") {
    c.arde -= dt;
    if (Math.random() < dt * 22) fuego(c.x + rnd(-c.T.L / 3, c.T.L / 3), c.y + c.T.H * 0.6, c.z + rnd(-0.5, 0.5), 1, 1 + c.T.masa * 0.1);
    if (Math.random() < dt * 8) humo(c.x, c.y + c.T.H + 0.5, c.z, 1, 1.4, true);
    if (Math.random() < dt * 2) destello(c.x, c.y + 1.5, c.z, 4, "#ff8a3a", 0.6);
    if (c.arde < 0) { c.fase = "RESTOS"; c.restos = rnd(5, 8); }
  } else if (c.fase === "RESTOS") {
    c.restos -= dt;
    if (Math.random() < dt * 3) humo(c.x, c.y + c.T.H, c.z, 1, 1, false);
    if (c.restos < 0) { c.fase = "RECUPERANDO"; c.alfa = 1; }
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
  // ── la suspensión ──
  // El cuerpo cabecea al frenar y se balancea al girar; y cada rueda se
  // comprime o se estira lo que le toca según hacia dónde se recarga el
  // coche, así que las cuatro siguen tocando el piso aunque el coche se
  // incline. Más el temblorcito del motor al ralentí.
  c.m.cuerpo.rotation.set(c.cabeceo, 0, c.balanceo);
  const motor = Math.sin(J.t * 26 + c.x) * 0.0022 * (c.estado === "maneja" || c.estado === "conducido" ? 1 : 0);
  c.m.cuerpo.position.y = Math.sin(J.t * 9 + c.x) * 0.006 * clamp(c.vel / 8, 0, 1) + motor;
  for (let i = 0; i < c.m.ruedas.length; i++) {
    const w = c.m.ruedas[i], lado = Math.sign(w.position.x) || 1, frente = i < 2 ? 1 : -1;
    const comp = clamp(c.cabeceo * frente * 1.6 - c.balanceo * lado * 1.6, -0.045, 0.045);
    w.position.y = amort(w.position.y, (w.userData.y0 ?? (w.userData.y0 = w.position.y)) + comp, 14, dt);
  }
  const giro = (c.estado === "fisica" ? Math.hypot(c.vx, c.vz) : c.vel) * dt / 0.36;
  for (const w of c.m.ruedas) w.children[0].rotation.x += giro, w.children[1].rotation.x += giro;
  for (const p of c.m.puertas) {
    if (p.rota) { p.vang = (p.vang || 0) + ((p.obj - p.ang) * 30 - (p.vang || 0) * 2.2 + (c.vel || Math.hypot(c.vx || 0, c.vz || 0)) * rnd(-0.6, 0.6)) * dt; p.ang = clamp(p.ang + p.vang * dt, 0.05, 1.35); }
    else p.ang = amort(p.ang, p.obj, 9, dt);
    p.p.rotation.y = -p.s * p.ang;
  }
  // las ruedas de adelante giran con el volante
  if (c.estado === "conducido" || c.estado === "maneja") { const v = clamp((c.rgiro || 0) * 2.2, -0.5, 0.5); c.m.ruedas[0].rotation.y = c.m.ruedas[1].rotation.y = amort(c.m.ruedas[0].rotation.y, v, 8, dt); }
  if (c.m.torreta) { const on = Math.sin(J.t * 14) > 0; c.m.torreta[0].material.color.set(on ? "#ff2030" : "#3a0810"); c.m.torreta[1].material.color.set(on ? "#0a1240" : "#2a60ff"); }
  const lejos = Math.hypot(c.x - J.jugador.x, c.z - J.jugador.z) > 60;
  // el haz de los faros es sólo un velo en el aire de noche (la luz que pinta la calle es un SpotLight de verdad)
  for (const h of c.m.haces) h.visible = !lejos && J.ciclo.farolas > 0.12 && c.fase !== "ARDIENDO" && c.fase !== "RESTOS" && (c.estado === "maneja" || c.estado === "conducido" || (c.poli && c.estado !== "fisica"));
  const dc = Math.hypot(c.x - J.camara.position.x, c.z - J.camara.position.z);
  c.m.raiz.visible = dc < J.calidad.lejos * 0.6;
  // pegado a la cámara, el halito se volvería una mancha enorme
  for (const h of c.m.halos) h.visible = dc > 7 && J.ciclo.farolas > 0.05 && c.fase !== "RESTOS";
}
void lerp; void onda; void edificioEn; void CALLES; void ACERA_Y;

/* Al apagar el Modo Dios: los coches volteados, abollados o quemados se
   cambian por coches nuevos en la calle (durante el fundido: no se ve). */
export function restaurarTodos() {
  const yo = J.jugador;
  for (const c of J.coches.slice()) {
    if (c === yo.coche || c.poli || c.estado === "fuera" || c.estado === "controlado") continue;
    const tocado = c.fase !== "NORMAL" || c.estado === "fisica" || c.estado === "agarrado" || c.dano > 0.05 || c.y > c.T.H / 2 + 0.2;
    if (!tocado) continue;
    const estaba = c.estado; c.estado = "fuera";
    if (estaba === "estacionado") continue;
    const n = nuevoCoche(c.tipo === "camion" ? "camion" : elegir(["sedan", "vocho", "taxi", "pickup"])); ponerEnCalle(n, { x: yo.x, z: yo.z, r: 25 });
  }
  if (!J.coches.some((c) => c.estado === "estacionado" && c.estado !== "fuera")) { const est = nuevoCoche("vocho"); est.estado = "estacionado"; est.x = 27.2; est.z = 13; est.ry = Math.PI; est.y = est.T.H / 2; est.conductor = false; est.vel = 0; }
}
/* Para los eventos: un coche nuevo (la patrulla) y devolver uno al tráfico. */
export function crearCoche(tipo, o = {}) { const c = nuevoCoche(tipo, o); c.y = c.T.H / 2; return c; }
export function aLaCalle(c) { c.estado = "maneja"; c.q.identity(); retomarCalle(c); }
