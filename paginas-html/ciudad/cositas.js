/*
 * LAS COSITAS LINDAS — lo que uno se va encontrando al pasear sin rumbo.
 *
 *   · Guirnaldas de foquitos cruzando las calles (se prenden de noche).
 *   · Dibujos de gis en las banquetas: al pasar al lado, ella los comenta.
 *   · Globos de corazón amarrados a las bancas (al tocarlos, ¡pop!).
 *   · Luciérnagas en la plaza, de noche.
 *   · En las cuatro esquinas de la plaza: un músico callejero con su
 *     guitarra (se oye al acercarse), un carrito de helados, un puesto de
 *     flores y un buzón con cartitas.
 *
 * Todo es barato: instanciado o en una sola malla, sin sombras de más, y
 * las interacciones se cuelgan de lo que ya existe (el botón de acción, el
 * toque en la pantalla, los misterios).
 */
import { J, THREE, rnd, elegir, TAU, toon, contorno, lienzo, textura, brillo, capaEfectos, memo, contar, aPantalla } from "./base.js";
import { CALLES, MANZANAS, MEDIA, ACERA_Y, bancas, edificios } from "./mundo.js";
import { son, piezasEscena } from "./audio.js";
import * as fx from "./efectos.js";
import { globito, abrirTarjeta } from "./ui.js";
import { decirElla } from "./jugador.js";

let guirnaldas = null, luciernagas = null, lucData = [];
const globos = [], dibujos = [], puestos = [];
let musico = null, compas = 0, acorde = 0, comentarioT = 0;

/* ══════════════════ ARMARLO ══════════════════ */
export function iniciar(esc) {
  armarGuirnaldas(esc);
  armarGis(esc);
  armarGlobos(esc);
  armarLuciernagas(esc);
  armarPuestos(esc);
  J.tocarCosita = tocar;
  J.accionCosita = accion;
}

/* ── guirnaldas de foquitos sobre las calles ── */
function armarGuirnaldas(esc) {
  const pts = [], cols = [], cable = [];
  const COL = ["#ffd38a", "#ff9ec8", "#9ad8ff", "#c8ff9a", "#fff2c8", "#ffb07a"].map((c) => new THREE.Color(c));
  const una = (ax, az, bx, bz) => {
    const N = 16, alto = 5.6, comba = 1.1;
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const k = i / N, x = ax + (bx - ax) * k, z = az + (bz - az) * k, y = alto - comba * 4 * k * (1 - k);
      if (prev) cable.push(prev[0], prev[1], prev[2], x, y, z);
      prev = [x, y, z];
      if (i > 0 && i < N) { pts.push(x, y - 0.12, z); const c = COL[(((i + Math.round(ax + az)) % COL.length) + COL.length) % COL.length]; cols.push(c.r, c.g, c.b); }
    }
  };
  const posiciones = [-60, -48, -36, -12, 0, 12, 36, 48, 60];
  for (const C of [-24, 24]) for (const t of posiciones) { una(t, C - 7.4, t, C + 7.4); una(C - 7.4, t, C + 7.4, t); }
  const gc = new THREE.BufferGeometry(); gc.setAttribute("position", new THREE.Float32BufferAttribute(cable, 3));
  esc.add(new THREE.LineSegments(gc, new THREE.LineBasicMaterial({ color: "#2a2230" })));
  const gp = new THREE.BufferGeometry(); gp.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); gp.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  const mat = new THREE.PointsMaterial({ size: 0.55, vertexColors: true, map: brillo([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,.6)"], [1, "rgba(255,255,255,0)"]], 32), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  guirnaldas = new THREE.Points(gp, mat); guirnaldas.frustumCulled = false;
  esc.add(capaEfectos(guirnaldas));
}

/* ── dibujos de gis en la banqueta ── */
const GIS = [
  { id: "iniciales", dice: ["¿Quién habrá dibujado ese corazón con nuestras iniciales? 👀 …¿fuiste tú? 🥹", "M + Y… está bonito, ¿eh? 🤍"] },
  { id: "rayuela", dice: ["¡Una rayuela! Cuando nos veamos, jugamos 🥰", "Apuesto a que te gano en la rayuela 😝"] },
  { id: "teamo", dice: ["Alguien escribió «te amo» en la banqueta… yo te lo diría en cada esquina 🤍"] },
  { id: "flores", dice: ["Flores de gis… igual de bonitas que las que me regalas 🌷"] },
  { id: "avion", dice: ["Un avioncito de papel… para llegar más rápido a ti ✈️"] },
  { id: "sol", dice: ["Un solecito con carita, jaja, como tú cuando sonríes ☀️"] },
  { id: "estrellas", dice: ["Estrellitas en el piso… y tú brillando más 🌟"] },
  { id: "arcoiris", dice: ["Un arcoíris de gis 🌈 alguien está feliz hoy"] },
];
function pintarGis(id) {
  const [c, x] = lienzo(256, 256);
  const tiza = (col, w = 7) => { x.strokeStyle = col; x.fillStyle = col; x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round"; x.globalAlpha = 0.85; };
  const corazon = (cx, cy, s) => { x.beginPath(); x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.4); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9); };
  if (id === "iniciales") { tiza("#ff9ec8", 9); corazon(128, 132, 78); x.stroke(); tiza("#fff6ee", 8); x.font = "bold 54px Caveat, cursive, sans-serif"; x.textAlign = "center"; x.fillText("M + Y", 128, 140); }
  if (id === "rayuela") { tiza("#fff6ee", 6); const cel = [[98, 200], [98, 158], [78, 116, 1], [118, 116, 1], [98, 74], [78, 32, 1], [118, 32, 1]]; cel.forEach(([cx, cy, d], i) => { x.strokeRect(cx - (d ? 20 : 30) + (d ? 0 : 10), cy, 40, 40); x.font = "bold 22px sans-serif"; x.fillText(String(i + 1), cx + 14, cy + 28); }); }
  if (id === "teamo") { tiza("#ffd36e", 8); x.font = "italic bold 64px Caveat, cursive, serif"; x.textAlign = "center"; x.fillText("te amo", 128, 140); tiza("#ff9ec8", 6); corazon(204, 72, 18); x.stroke(); }
  if (id === "flores") for (const [cx, cy, col] of [[70, 150, "#ff9ec8"], [128, 110, "#ffd36e"], [186, 150, "#c8a8ff"]]) { tiza("#8ad890", 6); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy + 80); x.stroke(); tiza(col, 6); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.arc(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 11, 0, TAU); x.stroke(); } }
  if (id === "avion") { tiza("#9ad8ff", 7); x.beginPath(); x.moveTo(40, 150); x.lineTo(210, 80); x.lineTo(110, 170); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(210, 80); x.lineTo(120, 140); x.stroke(); tiza("#fff6ee", 4); x.setLineDash([8, 10]); x.beginPath(); x.moveTo(36, 160); x.bezierCurveTo(10, 200, 60, 230, 30, 250); x.stroke(); x.setLineDash([]); }
  if (id === "sol") { tiza("#ffd36e", 8); x.beginPath(); x.arc(128, 128, 48, 0, TAU); x.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 64, 128 + Math.sin(a) * 64); x.lineTo(128 + Math.cos(a) * 90, 128 + Math.sin(a) * 90); x.stroke(); } tiza("#fff6ee", 6); x.beginPath(); x.arc(110, 118, 4, 0, TAU); x.arc(146, 118, 4, 0, TAU); x.fill(); x.beginPath(); x.arc(128, 136, 18, 0.2, Math.PI - 0.2); x.stroke(); }
  if (id === "estrellas") for (const [cx, cy, s, col] of [[80, 90, 30, "#ffd36e"], [170, 120, 40, "#fff6ee"], [110, 190, 24, "#9ad8ff"]]) { tiza(col, 6); x.beginPath(); for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + k / 10 * TAU, r = k % 2 ? s * 0.45 : s; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.stroke(); }
  if (id === "arcoiris") ["#ff8a8a", "#ffc87a", "#ffe98a", "#9ae8a0", "#9ac8ff", "#c8a8ff"].forEach((col, i) => { tiza(col, 9); x.beginPath(); x.arc(128, 190, 100 - i * 11, Math.PI, 0); x.stroke(); });
  const t = textura(c); return t;
}
function armarGis(esc) {
  const lados = [];
  for (const bx of MANZANAS) for (const bz of MANZANAS) {
    if (bx === 0 && bz === 0) continue;
    for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) lados.push({ bx, bz, fx, fz });
  }
  const elegidos = lados.sort(() => Math.random() - 0.5).slice(0, 18);
  elegidos.forEach((l, i) => {
    const g = GIS[i % GIS.length], s = rnd(-6, 6);
    const x = l.fz ? l.bx + s : l.bx + l.fx * (MEDIA - 1.4), z = l.fz ? l.bz + l.fz * (MEDIA - 1.4) : l.bz + s;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6).rotateX(-Math.PI / 2), toon({ map: pintarGis(g.id), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.position.set(x, ACERA_Y + 0.012, z); m.rotation.y = Math.atan2(l.fx, l.fz) + rnd(-0.3, 0.3); m.renderOrder = 1;
    esc.add(m);
    dibujos.push({ x, z, g, dicho: false });
  });
}

/* ── globos de corazón amarrados a las bancas ── */
function formaCorazon() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.28); s.bezierCurveTo(-0.5, 0.02, -0.22, 0.38, 0, 0.16); s.bezierCurveTo(0.22, 0.38, 0.5, 0.02, 0, -0.28);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 14 });
  g.translate(0, 0, -0.06); return g;
}
function armarGlobos(esc) {
  const geo = formaCorazon();
  const plaza = bancas.filter((b) => b.plaza), calle = bancas.filter((b) => !b.plaza).sort(() => Math.random() - 0.5).slice(0, 6);
  for (const b of [...plaza.slice(0, 5), ...calle]) {
    const col = elegir(["#ff6f9f", "#ff8ab8", "#ff5a7a", "#ffb0cf", "#c89aff"]);
    const m = new THREE.Mesh(geo, contorno(toon({ color: col, emissive: new THREE.Color(col).multiplyScalar(0.12) }), "#ffd8ea", 0.6));
    m.castShadow = J.calidad.sombras;
    const hilo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: "#f8f0f4" }));
    const ax = b.x + Math.cos(b.ry) * 0.75, az = b.z - Math.sin(b.ry) * 0.75;   // la orilla de la banca
    esc.add(m, hilo);
    globos.push({ m, hilo, ax, az, ay: ACERA_Y + 0.6, fase: rnd(TAU), roto: 0, y: 2.3 + rnd(-0.2, 0.3) });
  }
}

/* ── luciérnagas en la plaza ── */
function armarLuciernagas(esc) {
  const N = 70, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = rnd(TAU), r = rnd(7, 16); lucData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: rnd(0.4, 3), f: rnd(TAU), v: rnd(0.3, 0.8) }); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  luciernagas = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.28, map: brillo([[0, "rgba(240,255,160,1)"], [0.3, "rgba(200,255,120,.5)"], [1, "rgba(160,255,90,0)"]], 32), color: new THREE.Color(2, 2.4, 1.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  luciernagas.frustumCulled = false; esc.add(capaEfectos(luciernagas));
}

/* ── los puestos de la plaza ── */
function armarPuestos(esc) {
  const T = (o) => contorno(toon(o), "#ffd8ea", 0.35);
  const caja = (g, w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), T({ color: col })); m.position.set(x, y, z); m.castShadow = J.calidad.sombras; g.add(m); return m; };
  const sombrilla = (g, y, cols) => {
    const n = 8;
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.5, 3, 1, true, i / n * TAU, TAU / n), T({ color: cols[i % cols.length], side: THREE.DoubleSide })); m.position.y = y; g.add(m); }
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, y, 6), T({ color: "#e8e0e8" })); palo.position.y = y / 2; g.add(palo);
  };
  const poner = (g, x, z, tipo) => { g.position.set(x, ACERA_Y, z); g.rotation.y = Math.atan2(-x, -z); esc.add(g); puestos.push({ g, x, z, tipo }); edificios.push({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, h: 1.1, puesto: true }); };
  // el carrito de helados
  { const g = new THREE.Group(); caja(g, 1.3, 0.8, 0.8, "#fff4f8", 0, 0.75, 0); caja(g, 1.32, 0.12, 0.82, "#ff9ec8", 0, 1.2, 0); caja(g, 1.32, 0.12, 0.82, "#ff9ec8", 0, 0.4, 0);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 14), T({ color: "#3a3040" })); r.position.set(s * 0.45, 0.2, 0.42); g.add(r); }
    for (const [i, col] of ["#ff9ec8", "#ffe2a0", "#a8e8c0"].entries()) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), T({ color: col })); b.position.set(-0.3 + i * 0.3, 1.35, 0); g.add(b); }
    sombrilla(g, 2.2, ["#ff9ec8", "#fff4f8"]); poner(g, -6.6, 6.6, "helado"); }
  // el puesto de flores
  { const g = new THREE.Group(); caja(g, 1.5, 0.9, 0.7, "#8a5a3a", 0, 0.45, 0);
    for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), T({ color: elegir(["#ff6fa5", "#ffd36a", "#ffffff", "#c89aff", "#ff9a6a"]) })); f.position.set(rnd(-0.6, 0.6), 1.0 + rnd(0, 0.2), rnd(-0.25, 0.25)); g.add(f); }
    sombrilla(g, 2.2, ["#8ad890", "#fff4e0"]); poner(g, 6.6, -6.6, "flores"); }
  // el buzón de cartitas
  { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), T({ color: "#2a2a34" })); p.position.y = 0.5; g.add(p);
    caja(g, 0.5, 0.45, 0.4, "#d8344a", 0, 1.2, 0); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), T({ color: "#d8344a" })); t.position.y = 1.42; g.add(t);
    const corazon = new THREE.Mesh(formaCorazon(), T({ color: "#ffd8ea" })); corazon.scale.setScalar(0.35); corazon.position.set(0, 1.22, 0.22); g.add(corazon);
    poner(g, -6.6, -6.6, "buzon"); }
  // el músico callejero (con su guitarra)
  const a = J.crearPersona({ controlado: true, estado: "PARADO", fem: false, tipo: "adulto", caracter: "nada", x: 6.6, z: 6.6 });
  a.y = ACERA_Y; a.ry = Math.atan2(-6.6, -6.6); a.musico = true; a.colores.ropa = new THREE.Color("#3a5a8a"); a.colores.gorra = new THREE.Color("#c8a070"); a.peinado = 3;
  const guit = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), T({ color: "#c8843a" })); cuerpo.scale.set(1, 1.25, 0.35); guit.add(cuerpo);
  const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.03), T({ color: "#5a3a22" })); brazo.position.y = 0.42; guit.add(brazo);
  esc.add(guit);
  const notas = [];
  const [nc, nx] = lienzo(64, 64); nx.fillStyle = "#fff"; nx.font = "bold 52px serif"; nx.textAlign = "center"; nx.fillText("♪", 32, 50);
  const nt = textura(nc);
  for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nt, color: new THREE.Color(1.6, 1.3, 1.5), transparent: true, depthWrite: false })); s.scale.setScalar(0.3); s.visible = false; esc.add(capaEfectos(s)); notas.push({ s, t: 9 }); }
  musico = { a, guit, notas, x: 6.6, z: 6.6, cancion: 0 };
}

/* ══════════════════ TOCAR Y ACCIONES ══════════════════ */
const _p = { x: 0, y: 0, visible: true };
function tocar(px, py) {
  const cam = J.camara.position, f = (J.alto / 2) / Math.tan(THREE.MathUtils.degToRad(J.camara.fov / 2));
  for (const g of globos) {
    if (g.roto > 0) continue;
    aPantalla(g.m.position.x, g.m.position.y, g.m.position.z, _p);
    const d = g.m.position.distanceTo(cam);
    if (_p.visible && d < 30 && Math.hypot(px - _p.x, py - _p.y) < 0.4 / d * f + 16) { reventar(g); return true; }
  }
  if (musico) {
    aPantalla(musico.x, 1.2, musico.z, _p);
    const d = Math.hypot(musico.x - cam.x, musico.z - cam.z);
    if (_p.visible && d < 25 && Math.hypot(px - _p.x, py - _p.y) < 0.6 / d * f + 18) { cancionDedicada(); return true; }
  }
  return false;
}
function reventar(g) {
  g.roto = 25; g.m.visible = g.hilo.visible = false;
  fx.corazones(g.m.position.x, g.m.position.y, g.m.position.z, 10, 1.6); fx.brillos(g.m.position.x, g.m.position.y, g.m.position.z, 12, "rosa", 0.4, 2);
  son("pop", g.m.position.x, g.m.position.z, 1);
  J.misterio && J.misterio("globo");
  if (contar("globos") % 3 === 1 && J.novia.estado !== "fuera") setTimeout(() => decirElla(elegir(["¡Jajaja, lo reventaste! 🙈", "¡Ay! Ese era mío 😤💕", "¡Pobrecito globo! 🥺"])), 500);
}
function cerca(x, z, r) { const yo = J.jugador; return Math.hypot(yo.x - x, yo.z - z) < r; }
function accion() {
  if (J.jugador.coche || J.dios.on) return null;
  for (const p of puestos) if (cerca(p.x, p.z, 2.3)) {
    if (p.tipo === "helado") return { txt: "Helado", f: helado };
    if (p.tipo === "flores") return { txt: "Flores", f: flores };
    if (p.tipo === "buzon") return { txt: "Cartita", f: cartita };
  }
  if (musico && cerca(musico.x, musico.z, 3)) return { txt: "Canción", f: cancionDedicada };
  return null;
}
function helado() {
  son("ding"); fx.corazones(J.jugador.x, J.jugador.y + 1.6, J.jugador.z, 6, 1.2);
  abrirTarjeta(`<h2>Dos de fresa 🍓</h2><p class="mano">uno para ti, uno para mí… y el tuyo con chispitas, porque así te gusta</p><button data-cerrar>¡Gracias, amor!</button>`);
  J.alCerrarTarjeta = () => decirElla(elegir(["Sabe a tarde contigo 🍓", "Cuando nos veamos, me compras uno de verdad, ¿eh? 🥹", "¿Me das de tu helado? jiji 😋"]));
  J.misterio && J.misterio("helado");
}
function flores() {
  son("ding"); fx.brillos(J.novia.x, J.novia.y + 1.4, J.novia.z, 18, "rosa", 0.6, 1.4);
  abrirTarjeta(`<h2>Una flor para ti 🌷</h2><p class="mano">no es tan bonita como tú, pero se esforzó mucho</p><button data-cerrar>Dársela</button>`);
  J.alCerrarTarjeta = () => { J.novia.abrazaT = 2; J.jugador.abrazaT = 2; fx.corazones(J.novia.x, J.novia.y + 1.6, J.novia.z, 10, 1.6); setTimeout(() => decirElla(elegir(["¡Ay, amor! Está hermosa 🌷🥹", "La voy a guardar en un libro 🤍", "Eres el más lindo, ¿sabías? 🌸"])), 400); };
  J.misterio && J.misterio("flores");
}
const CARTITAS = [
  "Aunque estemos lejos, cada noche miro la luna pensando que tú también la estás viendo.",
  "Te amo en todos los horarios: en el tuyo y en el mío.",
  "Un día vamos a caminar por una calle así, de la mano, y no voy a querer soltarte.",
  "Gracias por esperarme, por entenderme y por quedarte. Te amo muchísimo.",
  "Si te pudiera mandar un abrazo por carta, este sobre pesaría un montón.",
  "Eres mi lugar favorito, aunque estés a kilómetros.",
  "Cuento los días como quien cuenta estrellas: con paciencia y con ganas.",
  "Me encanta cómo dices mi nombre. Me encanta todo de ti, la verdad.",
  "Prometo seguir enamorándote, aunque sea por mensajitos, hasta que sea en persona.",
  "La distancia sólo me enseñó lo mucho que te amo.",
  "Si te sientes sola, lee esto otra vez: aquí estoy, siempre.",
  "Eres mi «buenas noches» favorito y mi «buenos días» más bonito.",
];
function cartita() {
  son("ding");
  const n = contar("cartitas"), txt = CARTITAS[(n - 1) % CARTITAS.length];
  abrirTarjeta(`<h2>💌 Una cartita</h2><p class="mano">${txt}</p><p style="opacity:.6;font-size:14px">${n} de ${CARTITAS.length}</p><button data-cerrar>Guardarla</button>`);
  J.misterio && J.misterio("buzon");
}
/* La canción dedicada: una melodía chiquita (y los dos se abrazan). */
function cancionDedicada() {
  if (!musico || musico.cancion > 0) return;
  musico.cancion = 9;
  globito(musico.a, "¡Esta va para la parejita! 🎸", "gente", 2.6, 2.2);
  try {
    const { ac, nota } = piezasEscena(), t = ac.currentTime + 0.2;
    const mel = [[659, 0], [659, 0.3], [698, 0.6], [784, 0.9], [784, 1.5], [698, 1.8], [659, 2.1], [587, 2.4], [523, 3.0], [523, 3.3], [587, 3.6], [659, 3.9], [659, 4.5], [587, 4.95], [587, 5.2]];
    for (const [f, d] of mel) nota(f, t + d, 0.5, 0.05, "triangle");
    for (const [f, d] of [[262, 0], [196, 1.2], [220, 2.4], [175, 3.6], [196, 4.8]]) nota(f, t + d, 1.4, 0.04, "sine");
  } catch (e) { /* sin sonido todavía */ }
  setTimeout(() => { if (J.novia.estado !== "fuera") { J.novia.abrazaT = 3; J.jugador.abrazaT = 3; decirElla(elegir(["¡Nos está tocando una canción! 🥹", "Ay, es nuestra canción ahora 🤍"])); } }, 1200);
  J.misterio && J.misterio("musico");
}

/* ══════════════════ CADA CUADRO ══════════════════ */
export function actualizar(dt) {
  const c = J.ciclo || { farolas: 1, noche: 1 };
  // los foquitos: tenues de día, encendidos de noche (titilan un poquito)
  if (guirnaldas) guirnaldas.material.color.setScalar((0.25 + 1.7 * c.farolas) * (0.92 + Math.sin(J.t * 3) * 0.08));
  // las luciérnagas (sólo de noche y sólo si estoy cerca de la plaza)
  if (luciernagas) {
    const yo = J.jugador, ver = c.noche > 0.3 && Math.hypot(yo.x, yo.z) < 60;
    luciernagas.visible = ver;
    if (ver) {
      const p = luciernagas.geometry.attributes.position.array;
      lucData.forEach((l, i) => { l.f += dt * l.v; p[i * 3] = l.x + Math.sin(l.f * 1.3) * 1.2; p[i * 3 + 1] = l.y + Math.sin(l.f * 2.1) * 0.4; p[i * 3 + 2] = l.z + Math.cos(l.f) * 1.2; });
      luciernagas.geometry.attributes.position.needsUpdate = true;
      luciernagas.material.opacity = Math.min(1, c.noche) * (0.7 + Math.sin(J.t * 5) * 0.3);
    }
  }
  // los globos se mecen con el viento (y vuelven a aparecer al rato)
  for (const g of globos) {
    if (g.roto > 0) { g.roto -= dt; if (g.roto <= 0) { g.m.visible = g.hilo.visible = true; } continue; }
    g.fase += dt;
    const x = g.ax + Math.sin(g.fase * 0.9) * 0.18, z = g.az + Math.cos(g.fase * 0.7) * 0.18, y = g.y + Math.sin(g.fase * 1.4) * 0.08;
    g.m.position.set(x, y, z); g.m.rotation.set(Math.sin(g.fase) * 0.12, g.fase * 0.3, Math.sin(g.fase * 0.8) * 0.15);
    const pos = g.hilo.geometry.attributes.position.array; pos.set([g.ax, g.ay, g.az, x, y - 0.28, z]); g.hilo.geometry.attributes.position.needsUpdate = true;
  }
  // el músico: rasguea, salen notitas y se oye al acercarse
  if (musico) {
    const m = musico, a = m.a, s = Math.sin(a.ry), co = Math.cos(a.ry);
    m.guit.position.set(a.x + s * 0.24 + co * 0.05, a.y + 1.0, a.z + co * 0.24 - s * 0.05); m.guit.rotation.set(0, a.ry, 0.9);
    a.anim.habla = 0; a.estado = "PARADO"; a.vel = 0;
    const d = Math.hypot(J.jugador.x - m.x, J.jugador.z - m.z);
    if (m.cancion > 0) m.cancion -= dt;
    if ((compas -= dt) <= 0) {
      compas = 2.4;
      if (d < 14 && m.cancion <= 0) {
        try { const { ac, nota } = piezasEscena(), t = ac.currentTime, v = 0.035 * (1 - d / 14);
          const ACORDES = [[262, 330, 392], [196, 247, 294], [220, 262, 330], [175, 220, 262]], ac1 = ACORDES[acorde++ % 4];
          ac1.forEach((f, i) => { nota(f, t + i * 0.07, 1.8, v, "triangle"); nota(f * 2, t + 1.2 + i * 0.07, 1.1, v * 0.6, "triangle"); });
        } catch (e) { /* sin sonido aún */ }
        const n = m.notas.find((q) => q.t > 2.2); if (n) { n.t = 0; n.s.visible = true; n.x0 = rnd(-0.4, 0.4); }
      }
    }
    for (const n of m.notas) { if (n.t > 2.2) { n.s.visible = false; continue; } n.t += dt; n.s.position.set(m.x + n.x0 + Math.sin(n.t * 3) * 0.15, 1.9 + n.t * 0.6, m.z); n.s.material.opacity = 1 - n.t / 2.2; }
  }
  // los dibujos de gis: al pasar al lado, ella los comenta (de vez en cuando)
  comentarioT -= dt;
  if (comentarioT <= 0) for (const g of dibujos) {
    if (g.dicho || !cerca(g.x, g.z, 2.4)) continue;
    g.dicho = true; comentarioT = 25;
    if (J.novia.estado === "sigue") decirElla(elegir(g.g.dice));
    J.misterio && J.misterio("gis");
    break;
  }
}
void memo;
