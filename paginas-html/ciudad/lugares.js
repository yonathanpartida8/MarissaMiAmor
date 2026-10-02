/*
 * LOS LUGARES — Angelos Burger, la ventana del K-drama, las 83 ventanas
 * con escena, y lo que se puede hacer en cada sitio (el botón de acción
 * y los toques en la pantalla).
 *
 * · Angelos Burger tiene planta baja de verdad: por el vidrio se ven las
 *   mesas, la barra, el menú y la gente cenando. 🟢 ABIERTO de 12:00 a
 *   23:30 (hora de quien juega); 🔴 CERRADO el resto.
 * · Las ventanas con escena van en UNA malla instanciada con un atlas:
 *   cada escena se pinta una vez al prenderla. La última que tocaste (y
 *   la del K-drama) se animan de verdad mientras estás cerca.
 */
import { J, THREE, rnd, elegir, clamp, amort, amortAng, memo, guardar, contar, lienzo, textura, brillo, contorno, Juntador, aPantalla, TAU } from "./base.js";
import { son, bucleEn, piezasEscena } from "./audio.js";
import * as fx from "./efectos.js";
import { E, decir, decirYa, globito, aviso, contador, botonAccion, abrirTarjeta, tarjetaAbierta } from "./ui.js";
import { lugares, ventanasEscena, bancas, ACERA_Y } from "./mundo.js";
import { pintarEscena, sonarEscena, linea, FINAL } from "./escenas.js";
import { acariciar, FRASES } from "./gente.js";
import { subirAlCoche, bajarDelCoche } from "./vehiculos.js";
import { decirElla } from "./jugador.js";

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
const FX = 33, Z0 = -9, Z1 = 5, PUERTA_Z0 = -2.6, PUERTA_Z1 = -1.4;   // la fachada mira a x negativa

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
  const caja = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.9, 13.9), mats.map((m) => { m.side = THREE.BackSide; return m; }));
  caja.position.set(FX + 5.45, ACERA_Y + 1.95, (Z0 + Z1) / 2); esc.add(caja); B.caja = caja; B.matsInt = mats;
  // ── muebles: mesas, sillas, barra, lámparas (todo junto) ──
  const j = new Juntador();
  B.mesas = [];
  for (const z of [-7.6, -5.1, 0.6, 3.1]) {
    const x = FX + 1.5;
    j.meter(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), new THREE.Matrix4().makeTranslation(x, ACERA_Y + 0.75, z), "#f2efe8");
    j.caja(x, ACERA_Y + 0.37, z, 0.1, 0.72, 0.1, "#3a3036");
    for (const s of [-1, 1]) { j.caja(x, ACERA_Y + 0.45, z + s * 0.75, 0.5, 0.08, 0.45, "#b8343a"); j.caja(x, ACERA_Y + 0.75, z + s * 0.97, 0.5, 0.6, 0.08, "#b8343a"); B.mesas.push({ x, z: z + s * 0.72, ry: s > 0 ? Math.PI : 0 }); }
    j.caja(x - 0.15, ACERA_Y + 0.82, z, 0.16, 0.1, 0.16, "#e8b040");   // la hamburguesa
    j.caja(x + 0.18, ACERA_Y + 0.85, z + 0.1, 0.08, 0.16, 0.08, "#ff7ab0");   // la malteada
  }
  j.caja(FX + 8.6, ACERA_Y + 0.55, 0.5, 1.1, 1.1, 6.5, "#6a2a2a"); j.caja(FX + 8.6, ACERA_Y + 1.13, 0.5, 1.3, 0.08, 6.7, "#e8d8c0");
  j.caja(FX + 8.4, ACERA_Y + 1.35, -1.6, 0.4, 0.35, 0.35, "#2a2a30");   // la caja registradora
  for (const z of [-6.4, -3, 0.6, 3.6]) { j.caja(FX + 2.5, ACERA_Y + 3.6, z, 0.03, 0.6, 0.03, "#2a2020"); j.meter(new THREE.ConeGeometry(0.32, 0.3, 12, 1, true), new THREE.Matrix4().makeTranslation(FX + 2.5, ACERA_Y + 3.2, z), "#d84a3a"); }
  // ── la fachada: marcos, zoclo, viga, puerta y vidrios ──
  const f = new Juntador(), mx0 = FX - 0.06;
  f.caja(mx0, ACERA_Y + 0.25, (Z0 + Z1) / 2, 0.2, 0.5, Z1 - Z0, "#3a1a1e");
  f.caja(mx0, ACERA_Y + 3.82, (Z0 + Z1) / 2, 0.24, 0.35, Z1 - Z0, "#3a1a1e");
  for (const z of [Z0 + 0.12, PUERTA_Z0 - 0.4, PUERTA_Z0 - 0.06, PUERTA_Z1 + 0.06, PUERTA_Z1 + 0.4, Z1 - 0.12]) f.caja(mx0, ACERA_Y + 2, z, 0.22, 4, 0.18, "#3a1a1e");
  f.caja(mx0, ACERA_Y + 2.9, PUERTA_Z0 - 0.23, 0.16, 0.04, 0.3, "#c8a050"); f.caja(mx0, ACERA_Y + 2.9, PUERTA_Z1 + 0.23, 0.16, 0.04, 0.3, "#c8a050");
  const fachada = new THREE.Mesh(f.geometria(), contorno(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), "#ffb8a0", 0.3));
  fachada.castShadow = J.calidad.sombras; esc.add(fachada);
  const muebles = new THREE.Mesh(j.geometria(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: "#2a1408" }));
  esc.add(muebles);
  // las lucecitas de las lámparas
  B.focos = [];
  for (const z of [-6.4, -3, 0.6, 3.6]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,220,160,.9)"], [0.4, "rgba(255,180,110,.25)"], [1, "rgba(255,160,90,0)"]], 64), blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(FX + 2.5, ACERA_Y + 3.05, z); s.scale.set(1.6, 1.6, 1); esc.add(s); B.focos.push(s); }
  // vidrio (casi invisible: sólo un reflejo)
  const vidrio = new THREE.MeshBasicMaterial({ color: "#a8c8ff", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const [a, b] of [[Z0 + 0.2, PUERTA_Z0 - 0.4], [PUERTA_Z1 + 0.4, Z1 - 0.2]]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 3.2), vidrio); v.rotation.y = -Math.PI / 2; v.position.set(FX - 0.08, ACERA_Y + 2.1, (a + b) / 2); esc.add(v); }
  // la puerta (gira hacia afuera) con su letrerito de ABIERTO/CERRADO
  const puerta = new THREE.Group(); puerta.position.set(FX - 0.08, ACERA_Y, PUERTA_Z0); esc.add(puerta);
  const hoja = new THREE.Group(); puerta.add(hoja);
  const marcoP = new THREE.MeshStandardMaterial({ color: "#5a2a2a", roughness: 0.4 });
  for (const [z, w, y, h] of [[0.03, 0.06, 1.35, 2.7], [1.17, 0.06, 1.35, 2.7], [0.6, 1.2, 0.05, 0.1], [0.6, 1.2, 2.67, 0.08], [0.6, 1.2, 1.0, 0.06]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, w), marcoP); m.position.set(0, y, z); hoja.add(m); }
  const vP = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.5), vidrio); vP.rotation.y = -Math.PI / 2; vP.position.set(-0.01, 1.35, 0.6); hoja.add(vP);
  const manija = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: "#d8b060", metalness: 0.8, roughness: 0.3 })); manija.position.set(-0.07, 1.2, 1.02); hoja.add(manija);
  const [lc, lx] = lienzo(256, 128); B.letrero = { c: lc, x: lx, t: textura(lc) };
  const letrero = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: B.letrero.t, transparent: true }));
  letrero.rotation.y = -Math.PI / 2; letrero.position.set(-0.05, 1.62, 0.6); hoja.add(letrero);
  B.puerta = { hoja, abre: 0, obj: 0 };
  // el toldo a rayas con su olán
  const [tc, tx] = lienzo(256, 64); for (let i = 0; i < 16; i++) { tx.fillStyle = i % 2 ? "#f2e8d8" : "#c8303c"; tx.fillRect(i * 16, 0, 16, 64); }
  const tTol = textura(tc, true); tTol.repeat.set(4, 1);
  const tol = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0 + 0.4, 1.5), new THREE.MeshStandardMaterial({ map: tTol, side: THREE.DoubleSide, roughness: 0.8 }));
  tol.rotation.set(0, -Math.PI / 2, 0); tol.rotateX(-1.1); tol.position.set(FX - 0.65, ACERA_Y + 4.25, (Z0 + Z1) / 2); tol.castShadow = J.calidad.sombras; esc.add(tol);
  const [oc, ox] = lienzo(256, 32); for (let i = 0; i < 16; i++) { ox.fillStyle = i % 2 ? "#f2e8d8" : "#c8303c"; ox.beginPath(); ox.moveTo(i * 16, 0); ox.lineTo(i * 16 + 16, 0); ox.lineTo(i * 16 + 16, 18); ox.arc(i * 16 + 8, 18, 8, 0, Math.PI); ox.fill(); }
  const tOl = textura(oc, true); tOl.repeat.set(4, 1);
  const olan = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0 + 0.4, 0.32), new THREE.MeshStandardMaterial({ map: tOl, transparent: true, side: THREE.DoubleSide, roughness: 0.8 }));
  olan.rotation.y = -Math.PI / 2; olan.position.set(FX - 1.3, ACERA_Y + 3.82, (Z0 + Z1) / 2); esc.add(olan);
  // el letrero de neón
  const [nc, nx] = lienzo(1024, 192); B.neon = { c: nc, x: nx, t: textura(nc), parpadeo: 0 };
  pintarNeon(1);
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshBasicMaterial({ map: B.neon.t, transparent: true, depthWrite: false, toneMapped: false }));
  neon.rotation.y = -Math.PI / 2; neon.position.set(FX - 0.12, 5.4, (Z0 + Z1) / 2); esc.add(neon); B.neon.malla = neon;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), new THREE.MeshBasicMaterial({ map: brillo([[0, "rgba(255,110,170,.5)"], [0.5, "rgba(255,90,150,.14)"], [1, "rgba(255,90,150,0)"]], 128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.rotation.y = -Math.PI / 2; halo.position.set(FX - 0.1, 5.4, (Z0 + Z1) / 2); esc.add(halo); B.neon.halo = halo;
  // la luz que sale a la banqueta
  const charco = new THREE.Mesh(new THREE.PlaneGeometry(3.2, Z1 - Z0 - 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: brillo([[0, "rgba(255,200,130,.42)"], [0.6, "rgba(255,170,110,.12)"], [1, "rgba(255,160,100,0)"]], 64), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  charco.position.set(FX - 1.4, ACERA_Y + 0.02, (Z0 + Z1) / 2); esc.add(charco); B.charco = charco;
  // la pizarra de la banqueta
  const [pz, pzx] = lienzo(128, 160); pzx.fillStyle = "#1e2a24"; pzx.fillRect(0, 0, 128, 160); pzx.strokeStyle = "#8a5a3a"; pzx.lineWidth = 8; pzx.strokeRect(0, 0, 128, 160);
  pzx.fillStyle = "#f2f0e8"; pzx.textAlign = "center"; pzx.font = "bold 17px Georgia"; pzx.fillText("HOY", 64, 30); pzx.font = "15px Georgia"; pzx.fillText("Malteada", 64, 62); pzx.fillText("de fresa", 64, 82); pzx.fillStyle = "#ff8ab8"; pzx.font = "22px Georgia"; pzx.fillText("🍓 🤍", 64, 118); pzx.fillStyle = "#f2f0e8"; pzx.font = "12px Georgia"; pzx.fillText("para 2 💕", 64, 146);
  const piz = new THREE.Group(); piz.position.set(FX - 2.1, ACERA_Y, PUERTA_Z1 + 1.6); piz.rotation.y = -Math.PI / 2 + 0.35; esc.add(piz);
  for (const s of [-1, 1]) { const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), new THREE.MeshStandardMaterial({ map: textura(pz), side: THREE.DoubleSide })); tab.position.set(0, 0.45, s * 0.15); tab.rotation.x = s * 0.2; piz.add(tab); }
  // la gente que cena adentro (se sientan; los que entran de la calle se suman)
  B.comensales = [];
  B.mesas.forEach((m, i) => {
    const a = J.crearPersona({ controlado: true, estado: "SENTADO", x: m.x, z: m.z, ry: m.ry, caracter: i % 3 === 0 ? "chismoso" : "nada" });
    a.y = ACERA_Y; a.anim.sentado = 1; a.adentro = true; a.oculto = true; B.comensales.push(a);
  });
  const cajero = J.crearPersona({ controlado: true, estado: "MIRA", x: FX + 9.4, z: -1, ry: -Math.PI / 2, caracter: "nada" });
  cajero.y = ACERA_Y; cajero.mirarA = { x: FX, y: 1, z: -1 }; cajero.colores.ropa = new THREE.Color("#c8303c"); cajero.colores.gorra = new THREE.Color("#c8303c"); cajero.peinado = 3; B.cajero = cajero;
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
  B.neon.halo.visible = v; B.charco.visible = v;
  for (const s of B.focos) s.visible = v;
  for (const m of B.matsInt) m.emissiveIntensity = v ? 1 : 0.15;
  for (const a of B.comensales) a.oculto = !v;
  B.cajero.oculto = !v;
  if (!inicio) aviso(v ? "🟢 Angelos Burger ya abrió" : "🔴 Angelos Burger ya cerró");
}
function abrirPuerta() { B.puerta.obj = 1.6; son("ding", FX, (PUERTA_Z0 + PUERTA_Z1) / 2, 0.6); }
let reloj = 0, chisme = 2;
function actualizarBurger(dt) {
  const yo = J.jugador, d = Math.hypot(yo.x - (FX - 1), yo.z + 2);
  if ((reloj -= dt) <= 0) { reloj = 20; const v = burgerAbierto(); if (v !== abierto) ponerAbierto(v); }
  // la puerta
  const p = B.puerta; if (p.obj > 0) p.obj -= dt;
  p.abre = amort(p.abre, p.obj > 0 ? 1.15 : 0, p.obj > 0 ? 5 : 3, dt); p.hoja.rotation.y = -p.abre;
  // el neón parpadea de vez en cuando (sólo la "B")
  if (abierto) {
    if (B.neon.parpadeo > 0) { B.neon.parpadeo -= dt; const on = Math.random() < 0.5; pintarNeon(on ? 1 : 0); if (B.neon.parpadeo <= 0) pintarNeon(1); }
    else if (Math.random() < dt * 0.04 && d < 50) B.neon.parpadeo = 0.6;
    B.neon.halo.material.opacity = 0.85 + Math.sin(J.t * 3) * 0.08;
  }
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

/* ══════════════════ LAS VENTANAS ══════════════════ */
const CW = 204, CH = 227, AT = 2048, COLS = 10;
let atlas, atlasX, atlasT, ventMalla, aCelda;
const vivo = { v: null, malla: null, c: null, x: null, t: null };   // la ventana que se anima (la última que toqué)
const kd = { v: null, malla: null, c: null, x: null, t: null };
function celda(i) { return [(i % COLS) * CW, Math.floor(i / COLS) * CH]; }
function marco(x, ox, oy, w, h) {
  x.strokeStyle = "#2a1e2a"; x.lineWidth = 10; x.strokeRect(ox + 5, oy + 5, w - 10, h - 10);
  x.strokeStyle = "#5a4450"; x.lineWidth = 3; x.strokeRect(ox + 11, oy + 11, w - 22, h - 22);
  x.fillStyle = "#2a1e2a"; x.fillRect(ox + w / 2 - 2, oy + 8, 4, h - 16); x.fillRect(ox + 8, oy + h * 0.42, w - 16, 4);
  x.fillStyle = "#4a3a44"; x.fillRect(ox, oy + h - 14, w, 14);   // el alféizar
}
function pintarCelda(i, v) {
  const [ox, oy] = celda(i);
  atlasX.save(); atlasX.beginPath(); atlasX.rect(ox + 8, oy + 8, CW - 16, CH - 22); atlasX.clip(); atlasX.translate(ox + 8, oy + 8);
  try { pintarEscena(atlasX, v.escena.id, CW - 16, CH - 22, 2.2, { encendida: true }); } catch (e) { atlasX.fillStyle = "#ffcf8a"; atlasX.fillRect(0, 0, CW, CH); }
  atlasX.restore();
  marco(atlasX, ox, oy, CW, CH);
  atlasT.needsUpdate = true;
}
function pintarApagada() {   // la celda de todas las ventanas apagadas: cortinas cerradas con una rendijita de luz
  const [ox, oy] = celda(89), x = atlasX;
  const g = x.createLinearGradient(ox, oy, ox, oy + CH); g.addColorStop(0, "#3a2a40"); g.addColorStop(1, "#1e1626"); x.fillStyle = g; x.fillRect(ox, oy, CW, CH);
  // la rendija del centro, tibia
  const r = x.createLinearGradient(ox + CW / 2 - 14, 0, ox + CW / 2 + 14, 0); r.addColorStop(0, "rgba(255,190,120,0)"); r.addColorStop(0.5, "rgba(255,200,130,.75)"); r.addColorStop(1, "rgba(255,190,120,0)");
  x.fillStyle = r; x.fillRect(ox + CW / 2 - 14, oy + 10, 28, CH - 24);
  // dos cortinas con sus pliegues
  for (const lado of [0, 1]) {
    const x0 = ox + 8 + lado * (CW / 2 + 3), w = CW / 2 - 11;
    for (let k = 0; k < w; k += 2) { const l = 0.55 + 0.45 * Math.sin(k / w * Math.PI * 5 + lado); x.fillStyle = `rgb(${Math.round(70 + 60 * l)},${Math.round(40 + 30 * l)},${Math.round(70 + 40 * l)})`; x.fillRect(x0 + k, oy + 10, 2, CH - 26); }
  }
  x.fillStyle = "rgba(255,200,140,.25)"; x.fillRect(ox + 10, oy + CH - 32, CW - 20, 8);
  marco(x, ox, oy, CW, CH);
}
function construirVentanas() {
  [atlas, atlasX] = lienzo(AT, AT); atlasT = textura(atlas); atlasT.anisotropy = 4;
  pintarApagada();
  // la del K-drama va en su ventana grande del edificio del principio
  const vk = ventanasEscena.find((v) => v.escena.id === "kdrama");
  if (vk) Object.assign(vk, { x: lugares.kdrama.x - 0.02, y: lugares.kdrama.y, z: lugares.kdrama.z, ry: -Math.PI / 2, ancho: 2.6, alto: 2.2 });
  const n = ventanasEscena.length;
  const geo = new THREE.PlaneGeometry(1, 1);
  aCelda = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  geo.setAttribute("aCelda", aCelda);
  const mat = new THREE.MeshBasicMaterial({ map: atlasT });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTam = { value: new THREE.Vector2(CW / AT, CH / AT) };
    sh.vertexShader = "attribute vec3 aCelda; uniform vec2 uTam; varying float vLuz;\n" + sh.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n vMapUv = uv * uTam + aCelda.xy; vLuz = aCelda.z;");
    sh.fragmentShader = "varying float vLuz;\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb *= mix(0.9, 1.35, vLuz);");
  };
  mat.customProgramCacheKey = () => "ventanasAtlas";
  ventMalla = new THREE.InstancedMesh(geo, mat, n); ventMalla.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  ventanasEscena.forEach((v, i) => {
    v.i = i; v.vez = memo.ventanas[v.escena.id] || 0; v.encendida = v.vez > 0;
    const nx = Math.sin(v.ry), nz = Math.cos(v.ry);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), v.ry);
    m.compose(new THREE.Vector3(v.x + nx * 0.03, v.y, v.z + nz * 0.03), q, new THREE.Vector3(v.ancho, v.alto, 1));
    ventMalla.setMatrixAt(i, m);
    if (v.encendida) pintarCelda(i, v);
    ponerCelda(v);
  });
  J.escena.add(ventMalla);
  // las dos que se animan
  for (const o of [vivo, kd]) {
    [o.c, o.x] = lienzo(o === kd ? 320 : 200, o === kd ? 270 : 226); o.t = textura(o.c);
    o.malla = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: o.t })); o.malla.visible = false; J.escena.add(o.malla);
  }
  if (vk) { animarEn(kd, vk); if (!vk.encendida) { vk.vez = 1; vk.encendida = true; memo.ventanas.kdrama = 1; guardar(); pintarCelda(vk.i, vk); ponerCelda(vk); } }
  // el resplandor de la ventana del K-drama
  if (vk) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,190,220,.5)"], [0.5, "rgba(255,160,200,.12)"], [1, "rgba(255,160,200,0)"]], 64), blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(vk.x - 0.3, vk.y, vk.z); s.scale.set(6, 5, 1); J.escena.add(s); }
  contarVentanas();
}
function ponerCelda(v) {
  const [ox, oy] = celda(v.encendida ? v.i : 89);
  aCelda.setXYZ(v.i, ox / AT, 1 - (oy + CH) / AT, v.encendida ? 1 : 0); aCelda.needsUpdate = true;
}
function animarEn(o, v) {
  o.v = v;
  const nx = Math.sin(v.ry), nz = Math.cos(v.ry), mar = 8 / CW;
  o.malla.position.set(v.x + nx * 0.05, v.y + v.alto * 0.03, v.z + nz * 0.05); o.malla.rotation.set(0, v.ry, 0);
  o.malla.scale.set(v.ancho * (1 - mar * 2), v.alto * (1 - 22 / CH), 1);
  o.malla.visible = true;
}
function contarVentanas() {
  const n = ventanasEscena.filter((v) => v.encendida).length;
  contador("#nVen", n);
  return n;
}
function tocarVentana(v) {
  const yo = J.jugador;
  v.vez = (v.vez || 0) + 1;
  memo.ventanas[v.escena.id] = v.vez; guardar();
  try { sonarEscena(v.escena.id, piezasEscena()); } catch (e) { /* sin sonido */ }
  if (!v.encendida) {
    v.encendida = true; pintarCelda(v.i, v); ponerCelda(v);
    fx.brillos(v.x, v.y, v.z, 14, "oro", 0.8, 1); son("ding", v.x, v.z, 0.5);
    const n = contarVentanas();
    if (n === ventanasEscena.length) setTimeout(() => { decirYa(FINAL, "yo", 5000); J.misterio && J.misterio("ventanas"); for (let k = 0; k < 40; k++) setTimeout(() => fx.lluviaDeCorazones(yo.x, yo.z, 20), k * 80); son("corazon"); }, 1800);
  } else if (v.vez >= 2) {
    // la segunda vez: verla de cerca
    abrirVentana(v);
  }
  if (v.escena.grita) globito(v, v.escena.grita, "gente", 1.8, 0.6);
  decirYa(linea(v.escena.dice, v.vez), "yo", 3400);
  if (v !== kd.v) animarEn(vivo, v);
  if (v.escena.id === "kdrama" && v.vez >= 2) { if (contar("kdramaCerca") >= 3) { J.desbloquear && J.desbloquear("corazones"); } J.misterio && J.misterio("kdrama"); }
  J.novia.saludaT = 0; J.novia.hablando = 1.5;
}
function abrirVentana(v) {
  abrirTarjeta(`<canvas id="vent" width="360" height="300"></canvas><p class="mano">${linea(v.escena.dice, v.vez)}</p><button data-cerrar>Seguir paseando</button>`);
  const c = document.getElementById("vent"), x = c.getContext("2d"), t0 = performance.now();
  const dibujar = () => { if (!tarjetaAbierta()) return; try { pintarEscena(x, v.escena.id, 360, 300, (performance.now() - t0) / 1000 + 2, { encendida: true }); } catch (e) { /* nada */ } requestAnimationFrame(dibujar); };
  dibujar();
}
let cadaVivo = 0;
function actualizarVentanas(dt) {
  const cam = J.camara.position;
  if ((cadaVivo -= dt) > 0) return;
  cadaVivo = J.calidad.nivel === "baja" ? 0.12 : 0.066;
  for (const o of [vivo, kd]) {
    if (!o.v) continue;
    const d = Math.hypot(o.v.x - cam.x, o.v.z - cam.z);
    o.malla.visible = d < 60 && o.v.encendida;
    if (!o.malla.visible || d > 40) continue;
    try { pintarEscena(o.x, o.v.escena.id, o.c.width, o.c.height, J.t + 2, { encendida: true }); } catch (e) { /* nada */ }
    o.t.needsUpdate = true;
  }
}

/* ══════════════════ LOS TOQUES EN LA PANTALLA ══════════════════ */
const _p = { x: 0, y: 0, visible: true }, _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
function focal() { return (J.alto / 2) / Math.tan(THREE.MathUtils.degToRad(J.camara.fov / 2)); }
function alTocar(px, py) {
  if (tarjetaAbierta()) return;
  const cam = J.camara.position, f = focal();
  // 1) el ovni
  const o = J.ovni && J.ovni();
  if (o) { aPantalla(o.x, o.y, o.z, _p); const d = Math.hypot(o.x - cam.x, o.y - cam.y, o.z - cam.z), r = 4.5 / d * f + 20; if (_p.visible && Math.hypot(px - _p.x, py - _p.y) < r) { if (J.dios.on) J.rayoA({ x: o.x, y: o.y, z: o.z }); else { globito(o, elegir(["👽👋", "👽💚", "👽❓"]), "gente", 1.6, -1); son("ovni", o.x, o.z, 0.6); } return; } }
  // 2) la luna
  if (J.sobreLuna && J.sobreLuna(px, py)) { J.tocarLuna(); return; }
  // 3) una ventana
  let mejor = null, md = 1e9;
  for (const v of ventanasEscena) {
    const dx = v.x - cam.x, dz = v.z - cam.z, d = Math.hypot(dx, v.y - cam.y, dz);
    if (d > 55) continue;
    if (dx * Math.sin(v.ry) + dz * Math.cos(v.ry) > 0) continue;   // de espaldas
    aPantalla(v.x, v.y, v.z, _p); if (!_p.visible) continue;
    const w = v.ancho / d * f, h = v.alto / d * f;
    if (Math.abs(px - _p.x) < w / 2 + 12 && Math.abs(py - _p.y) < h / 2 + 12 && d < md) { md = d; mejor = v; }
  }
  if (mejor) { tocarVentana(mejor); return; }
  // 4) un perrito o una persona
  for (const an of J.animales) { if (an.casilla == null) continue; aPantalla(an.x, an.y + 0.4, an.z, _p); const d = Math.hypot(an.x - cam.x, an.z - cam.z); if (_p.visible && d < 30 && Math.hypot(px - _p.x, py - _p.y) < 0.6 / d * f + 16) { if (Math.hypot(an.x - J.jugador.x, an.z - J.jugador.z) < 6) acariciar(an); else { globito(an, an.tipo === "perro" ? "🐶❤️" : "🐱", "perro", 1.4, 1); son(an.tipo === "perro" ? "ladrido" : "miau", an.x, an.z); } return; } }
  for (const a of J.gente) { if (!a.ver || a.oculto || a.adentro) continue; aPantalla(a.x, a.y + 1.1 * a.escala, a.z, _p); const d = Math.hypot(a.x - cam.x, a.z - cam.z); if (_p.visible && d < 35 && Math.hypot(px - _p.x, py - _p.y) < 0.55 / d * f + 14) { saludar(a); return; } }
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
  const yo = J.jugador, ella = J.novia, cerca = (o, r) => Math.hypot(o.x - yo.x, o.z - yo.z) < r;
  if (yo.coche) return { txt: "🚪 Bajar", f: () => bajarDelCoche() };
  if (yo.vuela) return null;
  if (yo.banca) return { txt: "🧍 Pararse", f: () => { yo.banca.ocupada = null; yo.banca = null; } };
  if (Math.hypot(yo.x - (FX - 1.2), yo.z - (PUERTA_Z0 + PUERTA_Z1) / 2) < 3.2) return { txt: "🍔 Burger", f: tarjetaBurger };
  const c = J.cocheEn && J.cocheEn(yo.x, yo.z, 1.4);
  if (c && c.estado !== "agarrado" && !c.poli && c.fase !== "ARDIENDO" && c.fase !== "RESTOS" && c.fase !== "RECUPERANDO" && (c.estado !== "maneja" || c.vel < 1) && c.y < 2) return { txt: "🚗 Subir", f: () => subirAlCoche(c) };
  if (cerca(ella, 1.8) && ella.estado !== "huye") return { txt: "🤗 Abrazar", f: abrazar };
  const an = J.animales.find((q) => cerca(q, 1.8));
  if (an) return { txt: an.tipo === "perro" ? "🐶 Acariciar" : "🐱 Acariciar", f: () => acariciar(an) };
  const b = bancas.find((q) => !q.ocupada && cerca(q, 1.6));
  if (b) return { txt: "🪑 Sentarse", f: () => sentarse(b) };
  if (kd.v && cerca(kd.v, 7)) return { txt: "👀 Mirar", f: () => tocarVentana(kd.v) };
  return null;
}
function abrazar() {
  const yo = J.jugador, ella = J.novia;
  yo.ry = Math.atan2(ella.x - yo.x, ella.z - yo.z); ella.ry = yo.ry + Math.PI;
  yo.abrazaT = 3; ella.abrazaT = 3; ella.estado = "sigue";
  fx.corazones(ella.x, ella.y + 1.7, ella.z, 10, 1.8); son("corazon", ella.x, ella.z);
  const n = contar("abrazos");
  setTimeout(() => decirElla(elegir(["Mmm… quédate así tantito 🥹", "Te amo, mi amor 🤍", "Ya te extrañaba aunque estuvieras aquí 🥰", "Así… sin soltarme 🤍"])), 600);
  if (n === 1 || n % 5 === 0) setTimeout(() => decir(elegir(["Te amo, mi niña bonita 🤍", "Ojalá ya fuera de verdad y no a distancia 🥹", "Pronto, ¿eh? Pronto así de verdad 🤍"]), "yo"), 3000);
  J.misterio && J.misterio("abrazo");
  // la gente alrededor: «aww»
  for (const a of J.gente) if (a.ver && Math.hypot(a.x - yo.x, a.z - yo.z) < 12 && Math.random() < 0.3 && !a.controlado) { a.mirarA = { x: yo.x, y: 1, z: yo.z }; a.estado = "MIRA"; a.te = 2.5; if (Math.random() < 0.5) globito(a, elegir(FRASES.amor), "gente", 2, 2.1 * a.escala); }
}
function sentarse(b) {
  const yo = J.jugador, ella = J.novia;
  const cx = Math.cos(b.ry), sz = -Math.sin(b.ry);
  b.ocupada = yo; yo.banca = b;
  b.sx = b.x + Math.sin(b.ry) * 0.25 - cx * 0.42; b.sz = b.z + Math.cos(b.ry) * 0.25 - sz * 0.42;
  if (Math.hypot(ella.x - yo.x, ella.z - yo.z) < 8 && ella.estado !== "huye") {
    const lado = { x: b.x + cx * 0.42, z: b.z + sz * 0.42, ry: b.ry, ocupada: ella };
    if (ella.banca) ella.banca.ocupada = null;
    ella.banca = lado; ella.estado = "a_banca";
    setTimeout(() => { if (yo.banca === b) { decirElla(elegir(["Qué rico sentarnos un ratito juntos 🥹", "Recárgate en mí, amor 🤍", "Mira las estrellas desde aquí 🌙"])); ella.abrazaT = 2; } }, 2500);
  }
}

/* ══════════════════ ARRANCAR Y CADA CUADRO ══════════════════ */
export function iniciar() {
  construirBurger();
  construirVentanas();
  J.alTocar = alTocar; J.ventanas = ventanasEscena;
}
export function actualizar(dt) {
  actualizarBurger(dt);
  actualizarVentanas(dt);
  if ((cadaAccion -= dt) <= 0) { cadaAccion = 0.2; accion = elegirAccion(); botonAccion(accion ? accion.txt : ""); }
  if (E.accion && accion && !tarjetaAbierta()) { accion.f(); cadaAccion = 0; }
}
void clamp; void amortAng; void rnd;
