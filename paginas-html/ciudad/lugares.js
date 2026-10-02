/*
 * LOS LUGARES — Angelos Burger, las ventanas que se tocan y lo que se
 * puede hacer en cada sitio (el botón de acción y los toques).
 *
 * · Angelos Burger tiene planta baja de verdad: por el vidrio se ven las
 *   mesas, la barra, el menú y la gente cenando, iluminados por una luz de
 *   verdad que también sale a la banqueta. 🟢 ABIERTO de 12:00 a 23:30
 *   (hora de quien juega); 🔴 CERRADO el resto. El neón brilla más cuanto
 *   más oscuro está.
 * · Las ventanas viven en ventanas.js; aquí se decide qué pasa al tocarlas.
 */
import { J, THREE, rnd, elegir, clamp, amort, memo, contar, lienzo, textura, brillo, contorno, Juntador, aPantalla, TAU, toon } from "./base.js";
import { son, bucleEn, piezasEscena } from "./audio.js";
import * as fx from "./efectos.js";
import { E, decir, decirYa, globito, aviso, contador, botonAccion, abrirTarjeta, tarjetaAbierta } from "./ui.js";
import { lugares, ventanasEscena, bancas, ACERA_Y } from "./mundo.js";
import { pintarEscena, sonarEscena, linea, FINAL } from "./escenas.js";
import { ventanaEn, alternar, contarEscenas, marcarVista, animarVentana, ventanaKdrama } from "./ventanas.js";
import * as pareja from "./pareja.js";
import { cam } from "./camara.js";
import { acariciar, FRASES } from "./gente.js";
import { decirElla, empezarSubir, empezarBajar, sentarseEn, levantarse } from "./jugador.js";

if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };

/* ══════════════════ ANGELOS BURGER ══════════════════ */
const ABRE = 12 * 60, CIERRA = 23 * 60 + 30;
function burgerAbierto() {
  const q = new URLSearchParams(location.search).get("burger");
  if (q) return q === "abierto";
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
  return m >= ABRE && m < CIERRA;
}
let abierto = burgerAbierto();
const B = {};   // las piezas del Burger
const FX = 33, Z0 = -9, Z1 = 6, PUERTA_Z0 = -2.1, PUERTA_Z1 = -0.9;   // la fachada mira a x negativa

function construirBurger() {
  const esc = J.escena, lb = lugares.burger;
  // ── el interior: una caja vista desde dentro ──
  const [mc, mx] = lienzo(512, 256);   // la pared del fondo con el menú
  pintarParedMenu(mx);
  const [pc, px] = lienzo(128, 128); px.fillStyle = "#f0d8b8"; px.fillRect(0, 0, 128, 128); px.fillStyle = "#e0c098"; px.fillRect(0, 80, 128, 48); px.fillStyle = "#8a3a2a"; px.fillRect(0, 78, 128, 4);
  const [sc, sx] = lienzo(128, 128); for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) { sx.fillStyle = (i + k) % 2 ? "#e8e0d0" : "#b8343a"; sx.fillRect(i * 16, k * 16, 16, 16); }
  const tPiso = textura(sc, true); tPiso.repeat.set(5, 6);
  const tPared = textura(pc);
  const lam = (o) => new THREE.MeshLambertMaterial({ ...o, emissive: "#3a2010", emissiveIntensity: 1 });
  const mats = [lam({ map: textura(mc) }), lam({ map: tPared }), lam({ color: "#f2e2c8" }), lam({ map: tPiso }), lam({ map: tPared }), lam({ map: tPared })];
  const caja = new THREE.Mesh(new THREE.BoxGeometry(11.8, 3.9, 14.9), mats.map((m) => { m.side = THREE.BackSide; return m; }));
  caja.position.set(FX + 5.95, ACERA_Y + 1.95, (Z0 + Z1) / 2); esc.add(caja); B.caja = caja; B.matsInt = mats;
  // ── muebles: mesas, sillas, barra, lámparas (todo junto) ──
  const j = new Juntador();
  B.mesas = [];
  for (const z of [-7.4, -4.9, 1.9, 4.4]) {
    const x = FX + 1.5;
    j.meter(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), new THREE.Matrix4().makeTranslation(x, ACERA_Y + 0.75, z), "#f2efe8");
    j.caja(x, ACERA_Y + 0.37, z, 0.1, 0.72, 0.1, "#3a3036");
    for (const s of [-1, 1]) { j.caja(x, ACERA_Y + 0.45, z + s * 0.75, 0.5, 0.08, 0.45, "#b8343a"); j.caja(x, ACERA_Y + 0.75, z + s * 0.97, 0.5, 0.6, 0.08, "#b8343a"); B.mesas.push({ x, z: z + s * 0.72, ry: s > 0 ? Math.PI : 0 }); }
    j.caja(x - 0.15, ACERA_Y + 0.82, z, 0.16, 0.1, 0.16, "#e8b040");   // la hamburguesa
    j.caja(x + 0.18, ACERA_Y + 0.85, z + 0.1, 0.08, 0.16, 0.08, "#ff7ab0");   // la malteada
  }
  j.caja(FX + 8.6, ACERA_Y + 0.55, 1.5, 1.1, 1.1, 6.5, "#8a3a3a"); j.caja(FX + 8.6, ACERA_Y + 1.13, 1.5, 1.3, 0.08, 6.7, "#f2e2c8");
  j.caja(FX + 8.4, ACERA_Y + 1.35, -0.6, 0.4, 0.35, 0.35, "#2a2a30");   // la caja registradora
  for (const z of [-6.2, -3.6, 1.4, 4.0]) { j.caja(FX + 2.5, ACERA_Y + 3.6, z, 0.03, 0.6, 0.03, "#2a2020"); j.meter(new THREE.ConeGeometry(0.32, 0.3, 12, 1, true), new THREE.Matrix4().makeTranslation(FX + 2.5, ACERA_Y + 3.2, z), "#d84a3a"); }
  // ── la fachada: marcos, zoclo, viga, puerta y vidrios ──
  const f = new Juntador(), mx0 = FX - 0.06;
  f.caja(mx0, ACERA_Y + 0.25, (Z0 + Z1) / 2, 0.2, 0.5, Z1 - Z0, "#3a1a1e");
  f.caja(mx0, ACERA_Y + 3.82, (Z0 + Z1) / 2, 0.24, 0.35, Z1 - Z0, "#3a1a1e");
  for (const z of [Z0 + 0.12, PUERTA_Z0 - 0.4, PUERTA_Z0 - 0.06, PUERTA_Z1 + 0.06, PUERTA_Z1 + 0.4, Z1 - 0.12]) f.caja(mx0, ACERA_Y + 2, z, 0.22, 4, 0.18, "#3a1a1e");
  f.caja(mx0, ACERA_Y + 2.9, PUERTA_Z0 - 0.23, 0.16, 0.04, 0.3, "#c8a050"); f.caja(mx0, ACERA_Y + 2.9, PUERTA_Z1 + 0.23, 0.16, 0.04, 0.3, "#c8a050");
  const fachada = new THREE.Mesh(f.geometria(), toon({ vertexColors: true }));
  fachada.castShadow = J.calidad.sombras; esc.add(fachada);
  const muebles = new THREE.Mesh(j.geometria(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: "#2a1408" }));
  esc.add(muebles);
  // las lucecitas de las lámparas
  B.focos = [];
  for (const z of [-6.2, -3.6, 1.4, 4.0]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,220,160,.9)"], [0.4, "rgba(255,180,110,.25)"], [1, "rgba(255,160,90,0)"]], 64), blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(FX + 2.5, ACERA_Y + 3.05, z); s.scale.set(1.6, 1.6, 1); esc.add(s); B.focos.push(s); }
  // vidrio (casi invisible: sólo un reflejo)
  const vidrio = new THREE.MeshBasicMaterial({ color: "#a8c8ff", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const [a, b] of [[Z0 + 0.2, PUERTA_Z0 - 0.4], [PUERTA_Z1 + 0.4, Z1 - 0.2]]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 3.2), vidrio); v.rotation.y = -Math.PI / 2; v.position.set(FX - 0.08, ACERA_Y + 2.1, (a + b) / 2); esc.add(v); }
  // la puerta (gira hacia afuera) con su letrerito de ABIERTO/CERRADO
  const puerta = new THREE.Group(); puerta.position.set(FX - 0.08, ACERA_Y, PUERTA_Z0); esc.add(puerta);
  const hoja = new THREE.Group(); puerta.add(hoja);
  const marcoP = toon({ color: "#7a3a3a" });
  for (const [z, w, y, h] of [[0.03, 0.06, 1.35, 2.7], [1.17, 0.06, 1.35, 2.7], [0.6, 1.2, 0.05, 0.1], [0.6, 1.2, 2.67, 0.08], [0.6, 1.2, 1.0, 0.06]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, w), marcoP); m.position.set(0, y, z); hoja.add(m); }
  const vP = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.5), vidrio); vP.rotation.y = -Math.PI / 2; vP.position.set(-0.01, 1.35, 0.6); hoja.add(vP);
  const manija = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), toon({ color: "#e8c070" })); manija.position.set(-0.07, 1.2, 1.02); hoja.add(manija);
  const [lc, lx] = lienzo(256, 128); B.letrero = { c: lc, x: lx, t: textura(lc) };
  const letrero = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: B.letrero.t, transparent: true }));
  letrero.rotation.y = -Math.PI / 2; letrero.position.set(-0.05, 1.62, 0.6); hoja.add(letrero);
  B.puerta = { hoja, abre: 0, obj: 0 };
  // el toldo a rayas con su olán
  const [tc, tx] = lienzo(256, 64); for (let i = 0; i < 16; i++) { tx.fillStyle = i % 2 ? "#f2e8d8" : "#c8303c"; tx.fillRect(i * 16, 0, 16, 64); }
  const tTol = textura(tc, true); tTol.repeat.set(4, 1);
  const tol = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0 + 0.4, 1.5), toon({ map: tTol, side: THREE.DoubleSide }));
  tol.rotation.set(0, -Math.PI / 2, 0); tol.rotateX(-1.1); tol.position.set(FX - 0.65, ACERA_Y + 4.25, (Z0 + Z1) / 2); tol.castShadow = J.calidad.sombras; esc.add(tol);
  const [oc, ox] = lienzo(256, 32); for (let i = 0; i < 16; i++) { ox.fillStyle = i % 2 ? "#f2e8d8" : "#c8303c"; ox.beginPath(); ox.moveTo(i * 16, 0); ox.lineTo(i * 16 + 16, 0); ox.lineTo(i * 16 + 16, 18); ox.arc(i * 16 + 8, 18, 8, 0, Math.PI); ox.fill(); }
  const tOl = textura(oc, true); tOl.repeat.set(4, 1);
  const olan = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0 + 0.4, 0.32), toon({ map: tOl, alphaTest: 0.5, side: THREE.DoubleSide }));
  olan.rotation.y = -Math.PI / 2; olan.position.set(FX - 1.3, ACERA_Y + 3.82, (Z0 + Z1) / 2); esc.add(olan);
  // el letrero de neón
  const [nc, nx] = lienzo(1024, 192); B.neon = { c: nc, x: nx, t: textura(nc), parpadeo: 0 };
  pintarNeon(1);
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshBasicMaterial({ map: B.neon.t, transparent: true, depthWrite: false }));
  neon.rotation.y = -Math.PI / 2; neon.position.set(FX - 0.12, 5.4, (Z0 + Z1) / 2); esc.add(neon); B.neon.malla = neon;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), new THREE.MeshBasicMaterial({ map: brillo([[0, "rgba(255,110,170,.5)"], [0.5, "rgba(255,90,150,.14)"], [1, "rgba(255,90,150,0)"]], 128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.rotation.y = -Math.PI / 2; halo.position.set(FX - 0.1, 5.4, (Z0 + Z1) / 2); esc.add(halo); B.neon.halo = halo;
  // la luz de adentro: una luz de verdad que ilumina las mesas y sale por el vidrio a la banqueta
  const luz = new THREE.PointLight("#ffc890", 0, 16, 1.4); luz.position.set(FX + 1.2, ACERA_Y + 3.0, (Z0 + Z1) / 2); esc.add(luz); B.luz = luz;
  const rosa = new THREE.PointLight("#ff6aa8", 0, 9, 1.6); rosa.position.set(FX - 1.2, 5.4, (Z0 + Z1) / 2); esc.add(rosa); B.rosa = rosa;
  // la pizarra de la banqueta
  const [pz, pzx] = lienzo(128, 160); pzx.fillStyle = "#1e2a24"; pzx.fillRect(0, 0, 128, 160); pzx.strokeStyle = "#8a5a3a"; pzx.lineWidth = 8; pzx.strokeRect(0, 0, 128, 160);
  pzx.fillStyle = "#f2f0e8"; pzx.textAlign = "center"; pzx.font = "bold 17px Georgia"; pzx.fillText("HOY", 64, 30); pzx.font = "15px Georgia"; pzx.fillText("Malteada", 64, 62); pzx.fillText("de fresa", 64, 82); pzx.fillStyle = "#ff8ab8"; pzx.font = "22px Georgia"; pzx.fillText("🍓 🤍", 64, 118); pzx.fillStyle = "#f2f0e8"; pzx.font = "12px Georgia"; pzx.fillText("para 2 💕", 64, 146);
  const piz = new THREE.Group(); piz.position.set(FX - 2.1, ACERA_Y, PUERTA_Z1 + 1.6); piz.rotation.y = -Math.PI / 2 + 0.35; esc.add(piz);
  for (const s of [-1, 1]) { const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), toon({ map: textura(pz), side: THREE.DoubleSide })); tab.position.set(0, 0.45, s * 0.15); tab.rotation.x = s * 0.2; piz.add(tab); }
  // la gente que cena adentro (se sientan; los que entran de la calle se suman)
  B.comensales = [];
  B.mesas.forEach((m, i) => {
    const a = J.crearPersona({ controlado: true, estado: "SENTADO", x: m.x, z: m.z, ry: m.ry, caracter: i % 3 === 0 ? "chismoso" : "nada" });
    a.y = ACERA_Y; a.anim.sentado = 1; a.adentro = true; a.oculto = true; B.comensales.push(a);
  });
  const cajero = J.crearPersona({ controlado: true, estado: "MIRA", x: FX + 9.4, z: 0.5, ry: -Math.PI / 2, caracter: "nada" });
  cajero.y = ACERA_Y; cajero.mirarA = { x: FX, y: 1, z: -1.5 }; cajero.colores.ropa = new THREE.Color("#c8303c"); cajero.colores.gorra = new THREE.Color("#c8303c"); cajero.peinado = 3; B.cajero = cajero;
  J.burgerAbierto = () => abierto;
  J.alEntrarBurger = () => { abrirPuerta(); };
  J.alSalirBurger = (a) => { abrirPuerta(); if (Math.random() < 0.3) globito(a, elegir(["¡Qué rica estaba! 🍔", "Ya me llené 😮‍💨", "Lo de siempre, delicioso 🤤"]), "gente", 2.2, 2.1); };
  ponerAbierto(abierto, true);
  void lb;
}
function pintarParedMenu(x) {
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#f8e4c4"); g.addColorStop(1, "#e8c8a0");
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.fillStyle = "#8a3a2a"; x.fillRect(0, 168, 512, 6); x.fillStyle = "#c8303c"; x.fillRect(0, 174, 512, 82);
  x.fillStyle = "#1e1a1e"; x.fillRect(150, 18, 212, 110); x.strokeStyle = "#c8a050"; x.lineWidth = 4; x.strokeRect(150, 18, 212, 110);
  x.fillStyle = "#fff4d8"; x.font = "bold 18px Georgia"; x.textAlign = "center"; x.fillText("MENÚ", 256, 42);
  x.font = "13px Georgia"; x.textAlign = "left";
  [["Hamburguesa Angelos", "$95"], ["Doble con queso", "$120"], ["Papas a la francesa", "$45"], ["Malteada de fresa", "$60"], ["Combo para dos 💕", "$199"]].forEach(([a, b], i) => { x.fillText(a, 162, 64 + i * 15); x.textAlign = "right"; x.fillText(b, 350, 64 + i * 15); x.textAlign = "left"; });
  x.font = "34px serif"; x.fillText("🍔", 40, 100); x.fillText("🍟", 420, 100);
}
function pintarNeon(k) {
  const { x } = B.neon; x.clearRect(0, 0, 1024, 192);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.font = "italic 700 96px Georgia, serif";
  const on = k > 0.5;
  x.shadowColor = on ? "#ff4aa0" : "transparent"; x.shadowBlur = on ? 28 : 0;
  x.fillStyle = on ? "#ffd8ec" : "#5a2a3a"; x.fillText("Angelos Burger", 540, 92);
  x.shadowBlur = on ? 18 : 0; x.font = "80px serif"; x.fillText("🍔", 92, 96);
  x.strokeStyle = on ? "rgba(255,120,190,.9)" : "#4a2a3a"; x.lineWidth = 5; x.shadowBlur = on ? 16 : 0; x.beginPath(); x.roundRect(10, 10, 1004, 172, 30); x.stroke();
  B.neon.t.needsUpdate = true;
}
function pintarLetrero() {
  const { x } = B.letrero; x.clearRect(0, 0, 256, 128);
  x.fillStyle = "#f8f4ea"; x.beginPath(); x.roundRect(4, 4, 248, 120, 16); x.fill();
  x.strokeStyle = abierto ? "#2a9a4a" : "#c8303c"; x.lineWidth = 8; x.stroke();
  x.fillStyle = abierto ? "#1a8a3a" : "#c8303c"; x.font = "bold 46px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(abierto ? "ABIERTO" : "CERRADO", 128, 66);
  B.letrero.t.needsUpdate = true;
}
function ponerAbierto(v, inicio = false) {
  abierto = v;
  pintarLetrero(); pintarNeon(v ? 1 : 0);
  B.neon.halo.visible = v;
  for (const s of B.focos) s.visible = v;
  for (const a of B.comensales) a.oculto = !v;
  B.cajero.oculto = !v;
  if (!inicio) aviso(v ? "🟢 Angelos Burger ya abrió" : "🔴 Angelos Burger ya cerró");
}
function abrirPuerta() { B.puerta.obj = 1.6; son("ding", FX, (PUERTA_Z0 + PUERTA_Z1) / 2, 0.6); }
let reloj = 0, chisme = 2;
function actualizarBurger(dt) {
  const yo = J.jugador, d = Math.hypot(yo.x - (FX - 1), yo.z + 1.5), c = J.ciclo;
  if ((reloj -= dt) <= 0) { reloj = 20; const v = burgerAbierto(); if (v !== abierto) ponerAbierto(v); }
  // la puerta
  const p = B.puerta; if (p.obj > 0) p.obj -= dt;
  p.abre = amort(p.abre, p.obj > 0 ? 1.15 : 0, p.obj > 0 ? 5 : 3, dt); p.hoja.rotation.y = -p.abre;
  // el neón parpadea de vez en cuando (sólo la "B")
  if (abierto) {
    if (B.neon.parpadeo > 0) { B.neon.parpadeo -= dt; const on = Math.random() < 0.5; pintarNeon(on ? 1 : 0); if (B.neon.parpadeo <= 0) pintarNeon(1); }
    else if (Math.random() < dt * 0.04 && d < 50) B.neon.parpadeo = 0.6;
    B.neon.halo.material.opacity = (0.25 + 0.65 * c.noche) * (0.92 + Math.sin(J.t * 3) * 0.08);
    B.neon.malla.material.color.setScalar(1 + c.noche * 1.4);
  }
  // la luz de adentro: más se nota cuanto más oscuro
  B.luz.intensity = amort(B.luz.intensity, abierto ? 6 + 26 * c.noche : 0, 2, dt);
  B.rosa.intensity = amort(B.rosa.intensity, abierto ? 9 * c.noche : 0, 2, dt);
  for (const m of B.matsInt) m.emissiveIntensity = abierto ? 0.4 + 0.6 * c.noche : 0.1;
  // los comensales platican (y algunos ven su teléfono)
  const dentro = J.gente.filter((a) => a.enBurger && a.estado === "DENTRO").length;
  B.comensales.forEach((a, i) => { a.oculto = !abierto || i >= 3 + dentro * 2; });
  if (abierto && d < 22 && (chisme -= dt) < 0) { chisme = rnd(4, 9); const a = elegir(B.comensales.filter((q) => !q.oculto)); if (a) { a.ry += rnd(-0.3, 0.3); if (Math.random() < 0.35) globito(a, elegir(["Está buenísima 🍔", "¿Me pasas la cátsup?", "¿Viste a la pareja de afuera? 🥹", "jajaja ¿en serio?", "Mmm… 🤤"]), "gente", 2, 2.1); } }
  bucleEn("murmullo", abierto ? 0.05 : 0, FX + 3, -2);
  // la primera vez que paso por enfrente
  if (d < 7 && !memo.cuenta.vioBurger) { contar("vioBurger"); setTimeout(() => decirElla(abierto ? "¡Angelos Burger! Nuestro restaurante favorito 🤍🥹" : "Nuestro restaurante favorito… ya cerró 🥺"), 300); }
}
function tarjetaBurger() {
  const ab = abierto;
  abrirTarjeta(`<h2>🍔 Angelos Burger</h2><p class="mano">Nuestro restaurante favorito 🤍🥹</p>
    <span class="estado ${ab ? "abierto" : "cerrado"}">${ab ? "🟢 ABIERTO" : "🔴 CERRADO"}</span> <small style="opacity:.7">de 12:00 a 23:30</small>
    <h3>Menú</h3><ul><li>🍔 Hamburguesa Angelos</li><li>🧀 Doble con queso</li><li>🍟 Papas a la francesa</li><li>🍓 Malteada de fresa (con dos popotes)</li><li>💕 Combo para dos</li></ul>
    ${ab ? '<button id="cenar">Entrar a cenar con ella</button>' : '<p class="mano">Ya cerró… mañana venimos, ¿sí? 🥺</p><button data-cerrar>Ni modo</button>'}`);
  const b = document.getElementById("cenar");
  if (b) b.addEventListener("click", () => cenar());
  else setTimeout(() => decirElla("Ya cerró… mañana venimos, ¿sí? 🥺"), 400);
}
function cenar() {
  abrirTarjeta(`<canvas id="cena" width="360" height="240"></canvas><p class="mano" id="cenaTxt">…</p><button data-cerrar>Salir juntitos</button>`);
  const c = document.getElementById("cena"), x = c.getContext("2d"), txt = document.getElementById("cenaTxt");
  const lineas = [["ella", "Pide lo de siempre, amor 🍔"], ["yo", "Lo de siempre: dos Angelos y una malteada de fresa para compartir 🤍"], ["ella", "Me encanta venir aquí contigo 🥹"], ["yo", "Y a mí me encanta verte comer papitas 😌"], ["ella", "Te amo 🤍"]];
  let i = 0, t0 = performance.now();
  const paso = setInterval(() => { if (!tarjetaAbierta() || i >= lineas.length) { clearInterval(paso); return; } const [q, l] = lineas[i++]; txt.textContent = l; txt.style.color = q === "ella" ? "#ffa6d5" : "#f2ecff"; }, 2400);
  txt.textContent = lineas[0][1]; txt.style.color = "#ffa6d5"; i = 1;
  const dibujar = () => {
    if (!tarjetaAbierta()) return;
    const t = (performance.now() - t0) / 1000;
    pintarCena(x, 360, 240, t);
    requestAnimationFrame(dibujar);
  };
  dibujar();
  son("puerta"); son("ding");
  J.misterio && J.misterio("burger");
  J.alCerrarTarjeta = () => { abrirPuerta(); decirElla("¡Qué rico estuvo! Gracias, amor 🥰"); J.novia.abrazaT = 2.5; J.jugador.abrazaT = 2.5; fx.corazones(J.novia.x, J.novia.y + 1.6, J.novia.z, 6, 1.4); };
}
function pintarCena(x, w, h, t) {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f2d4a8"); g.addColorStop(1, "#c88a5a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "#c8303c"; x.fillRect(0, h * 0.62, w, h * 0.38);
  for (let i = 0; i < 3; i++) { const lx = 60 + i * 120; x.fillStyle = "rgba(255,230,170,.35)"; x.beginPath(); x.arc(lx, 40, 40 + Math.sin(t * 2 + i) * 2, 0, TAU); x.fill(); x.fillStyle = "#d84a3a"; x.beginPath(); x.moveTo(lx - 16, 40); x.lineTo(lx + 16, 40); x.lineTo(lx, 24); x.fill(); }
  // la mesa y nosotros dos
  x.fillStyle = "#f2efe8"; x.fillRect(110, 150, 140, 12);
  const yo = (px, col, pelo, inc) => { x.save(); x.translate(px, 150); x.rotate(inc); x.fillStyle = col; x.beginPath(); x.ellipse(0, -30, 26, 34, 0, 0, TAU); x.fill(); x.fillStyle = "#b07a52"; x.beginPath(); x.arc(0, -78, 20, 0, TAU); x.fill(); x.fillStyle = pelo; x.beginPath(); x.arc(0, -84, 21, Math.PI, TAU); x.fill(); x.restore(); };
  yo(120, "#141418", "#0c0c10", Math.sin(t * 1.3) * 0.05 + 0.08);
  yo(240, "#141418", "#0c0c10", -Math.sin(t * 1.1) * 0.05 - 0.08);
  x.fillStyle = "#0c0c10"; x.beginPath(); x.ellipse(256, -60 + 150, 10, 34, -0.2, 0, TAU); x.fill();   // su melena
  x.fillStyle = "#ff7ab0"; x.fillRect(176, 124, 10, 26); x.fillStyle = "#fff"; x.fillRect(178, 112, 2, 14); x.fillRect(183, 110, 2, 16);   // la malteada con dos popotes
  x.fillStyle = "#e8b040"; x.beginPath(); x.ellipse(145, 146, 14, 6, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(215, 146, 14, 6, 0, 0, TAU); x.fill();
  for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i / 4) % 1; x.fillStyle = `rgba(255,120,180,${1 - k})`; x.font = `${14 + k * 8}px serif`; x.fillText("🤍", 172 + Math.sin(i * 2 + t) * 30, 100 - k * 80); }
}

/* ══════════════════ LAS VENTANAS (qué pasa al tocarlas) ══════════════════ */
function tocarVentana(v) {
  const yo = J.jugador;
  if (!v.escena) {
    // una ventana cualquiera: se prende o se apaga (con su clic)
    const on = alternar(v);
    son("ding", v.x, v.z, on ? 0.35 : 0.2);
    if (on) fx.brillos(v.x + v.nx * 0.3, v.y, v.z + v.nz * 0.3, 4, "oro", 0.5, 0.6);
    if (contar("ventanasNormales") === 6 && J.novia.estado !== "fuera") decirElla("¿Les estás prendiendo la luz a todos? jajaja 🙈");
    return;
  }
  const mirador = !!cam.mirador;
  if (!v.encendida) {
    alternar(v); marcarVista(v);
    try { sonarEscena(v.escena.id, piezasEscena()); } catch (e) { /* sin sonido */ }
    fx.brillos(v.x + v.nx * 0.3, v.y, v.z + v.nz * 0.3, 14, "oro", 0.8, 1); son("ding", v.x, v.z, 0.5);
    const n = contarEscenas(); contador("#nVen", n);
    if (n === ventanasEscena.length) setTimeout(() => { decirYa(FINAL, "yo", 5000); J.misterio && J.misterio("ventanas"); for (let k = 0; k < 40; k++) setTimeout(() => fx.lluviaDeCorazones(yo.x, yo.z, 20), k * 80); son("corazon"); }, 1800);
  } else if (mirador) {
    // desde la banca: prender y apagar, como en la calle 2D
    alternar(v); son("ding", v.x, v.z, 0.2);
    return;
  } else {
    marcarVista(v);
    try { sonarEscena(v.escena.id, piezasEscena()); } catch (e) { /* sin sonido */ }
    abrirVentana(v);
  }
  if (v.escena.grita) globito(v, v.escena.grita, "gente", 1.8, 0.6);
  decir(linea(v.escena.dice, v.vez), "yo", 3400);
  animarVentana(v);
  if (v.escena.id === "kdrama" && v.vez >= 2) { contar("kdramaCerca"); J.misterio && J.misterio("kdrama"); }
}
function abrirVentana(v) {
  abrirTarjeta(`<canvas id="vent" width="360" height="300"></canvas><p class="mano">${linea(v.escena.dice, v.vez)}</p><button data-cerrar>Seguir paseando</button>`);
  const c = document.getElementById("vent"), x = c.getContext("2d"), t0 = performance.now();
  const dibujar = () => { if (!tarjetaAbierta()) return; try { pintarEscena(x, v.escena.id, 360, 300, (performance.now() - t0) / 1000 + 2, { encendida: true }); } catch (e) { /* nada */ } requestAnimationFrame(dibujar); };
  dibujar();
}

/* ══════════════════ LOS TOQUES EN LA PANTALLA ══════════════════ */
const _p = { x: 0, y: 0, visible: true }, _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
function focal() { return (J.alto / 2) / Math.tan(THREE.MathUtils.degToRad(J.camara.fov / 2)); }
function alTocar(px, py) {
  if (tarjetaAbierta()) return;
  const cam3 = J.camara.position, f = focal();
  // 1) el ovni
  const o = J.ovni && J.ovni();
  if (o) { aPantalla(o.x, o.y, o.z, _p); const d = Math.hypot(o.x - cam3.x, o.y - cam3.y, o.z - cam3.z), r = 4.5 / d * f + 20; if (_p.visible && Math.hypot(px - _p.x, py - _p.y) < r) { if (J.dios.on) J.rayoA({ x: o.x, y: o.y, z: o.z }); else { globito(o, elegir(["👽👋", "👽💚", "👽❓"]), "gente", 1.6, -1); son("ovni", o.x, o.z, 0.6); } return; } }
  // 2) la luna
  if (J.sobreLuna && J.sobreLuna(px, py)) { J.tocarLuna(); return; }
  // 3) una ventana
  const v = ventanaEn(px, py);
  if (v) { tocarVentana(v); return; }
  // 4) un perrito o una persona
  for (const an of J.animales) { if (an.casilla == null) continue; aPantalla(an.x, an.y + 0.4, an.z, _p); const d = Math.hypot(an.x - cam3.x, an.z - cam3.z); if (_p.visible && d < 30 && Math.hypot(px - _p.x, py - _p.y) < 0.6 / d * f + 16) { if (Math.hypot(an.x - J.jugador.x, an.z - J.jugador.z) < 6) acariciar(an); else { globito(an, an.tipo === "perro" ? "🐶❤️" : "🐱", "perro", 1.4, 1); son(an.tipo === "perro" ? "ladrido" : "miau", an.x, an.z); } return; } }
  for (const a of J.gente) { if (!a.ver || a.oculto || a.adentro) continue; aPantalla(a.x, a.y + 1.1 * a.escala, a.z, _p); const d = Math.hypot(a.x - cam3.x, a.z - cam3.z); if (_p.visible && d < 35 && Math.hypot(px - _p.x, py - _p.y) < 0.55 / d * f + 14) { saludar(a); return; } }
  // 5) el suelo, si hay un poder que se apunta con el dedo
  if (J.dios.on && J.tocarMundo) {
    _ndc.set(px / J.ancho * 2 - 1, -(py / J.alto) * 2 + 1); _ray.setFromCamera(_ndc, J.camara);
    const r = _ray.ray; if (r.direction.y < -0.02) { const t = -(r.origin.y - 0.2) / r.direction.y; if (t < 120) J.tocarMundo({ x: r.origin.x + r.direction.x * t, y: 0.2, z: r.origin.z + r.direction.z * t }); }
  }
}
function saludar(a) {
  if (a.audifonos) { globito(a, "♪ ♫ ♪", "gente", 1.6, 2.1); if (contar("audifonos") >= 3) J.misterio && J.misterio("audifonos"); return; }
  if (a.poli) { globito(a, elegir(["Circule, joven.", "Buenas noches 👮", "No me distraiga, estoy trabajando."]), "poli", 2, 2.2); return; }
  a.saludaT = 1.5; a.mirarA = { x: J.jugador.x, y: 1, z: J.jugador.z };
  if (["CAMINA", "PARADO", "SENTADO", "MIRA"].includes(a.estado)) a.ry = Math.atan2(J.jugador.x - a.x, J.jugador.z - a.z);
  globito(a, elegir(FRASES.saludo), "gente", 2.2, 2.1 * a.escala);
  son("charla", a.x, a.z, 1, a.fem);
}

/* ══════════════════ LA ACCIÓN DEL MOMENTO ══════════════════ */
let accion = null, cadaAccion = 0;
function elegirAccion() {
  const yo = J.jugador, cerca = (o, r) => Math.hypot(o.x - yo.x, o.z - yo.z) < r;
  if (cam.modo === "dron" || J.actividad || yo.subir || yo.bajar || yo.sentarse) return null;
  if (yo.coche) return { txt: "🚪 Bajar", f: () => empezarBajar() };
  if (yo.vuela) return null;
  if (yo.banca) return { txt: "🧍 Pararse", f: () => levantarse() };
  if (Math.hypot(yo.x - (FX - 1.2), yo.z - (PUERTA_Z0 + PUERTA_Z1) / 2) < 3.2) return { txt: "🍔 Burger", f: tarjetaBurger };
  const c = J.cocheEn && J.cocheEn(yo.x, yo.z, 1.5);
  if (c && c.estado !== "agarrado" && !c.poli && c.m.puertas.length && c.fase !== "ARDIENDO" && c.fase !== "RESTOS" && c.fase !== "RECUPERANDO" && (c.estado !== "maneja" || c.vel < 4) && c.y < 2) return { txt: J.novia && Math.hypot(J.novia.x - yo.x, J.novia.z - yo.z) < 9 && !J.dios.on ? "🚗 Subirnos" : "🚗 Subir", f: () => empezarSubir(c) };
  const an = J.animales.find((q) => cerca(q, 1.8));
  if (an) return { txt: an.tipo === "perro" ? "🐶 Acariciar" : "🐱 Acariciar", f: () => acariciar(an) };
  const b = bancas.find((q) => !q.ocupada && cerca(q, 1.8));
  if (b) return { txt: "🪑 Sentarse", f: () => sentarseEn(b) };
  const vk = ventanaKdrama();
  if (vk && cerca(vk, 7)) return { txt: "👀 Mirar", f: () => tocarVentana(vk) };
  return null;
}

/* ══════════════════ ARRANCAR Y CADA CUADRO ══════════════════ */
export function iniciar() {
  construirBurger();
  J.alTocar = alTocar;
  contador("#nVen", contarEscenas());
}
export function actualizar(dt) {
  actualizarBurger(dt);
  pareja.actualizar(dt);
  if ((cadaAccion -= dt) <= 0) { cadaAccion = 0.2; accion = elegirAccion(); botonAccion(accion ? accion.txt : ""); }
  if (E.accion && accion && !tarjetaAbierta()) { accion.f(); cadaAccion = 0; }
}
void clamp; void rnd; void Juntador; void contorno; void memo; void lienzo;
