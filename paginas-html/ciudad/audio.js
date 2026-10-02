/*
 * EL SONIDO DE LA CIUDAD — todo hecho con WebAudio, sin archivos.
 *
 * · Cada sonido corto se pide con su posición y su prioridad. Se calcula
 *   cuánto se oye (distancia) y de qué lado (paneo). Si ya suenan
 *   demasiados, el menos importante no entra: así la ciudad puede estar
 *   llena de cosas sin que el navegador se ahogue.
 *   Prioridad: evento grande (3) > yo (2) > gente cerca (1) > ambiente (0).
 * · Los ambientes que duran (lluvia, sirena, helicóptero, el murmullo del
 *   restaurante…) son bucles que siempre existen y sólo cambian de volumen
 *   según dónde estén y dónde esté uno. No apartan la música del libro.
 */
import { J, rnd, clamp } from "./base.js";

let ac = null, salida = null, amb = null, bufRuido = null, bufMarron = null;
const MAX_VOCES = 14;
let voces = [];      // { fin, prio }
const bucles = {};   // nombre → { gain, pan, x, z, vol, alcance }

export function iniciarAudio() {
  if (ac) { if (ac.state === "suspended") ac.resume().catch(() => {}); return ac; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { ac = new AC(); } catch (e) { return null; }
  salida = ac.createGain(); salida.gain.value = 0.8;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
  salida.connect(comp); comp.connect(ac.destination);
  amb = ac.createGain(); amb.gain.value = 1;
  if (window.LibroSonido && window.LibroSonido.ambiente) window.LibroSonido.ambiente(amb); else amb.connect(ac.destination);
  const n = ac.sampleRate * 2;
  bufRuido = ac.createBuffer(1, n, ac.sampleRate); bufMarron = ac.createBuffer(1, n, ac.sampleRate);
  const d = bufRuido.getChannelData(0), m = bufMarron.getChannelData(0);
  let u = 0; for (let i = 0; i < n; i++) { d[i] = Math.random() * 2 - 1; u = (u + 0.02 * d[i]) / 1.02; m[i] = u * 4; }
  armarBucles();
  return ac;
}
export const audio = () => ac;

/* ── piezas sueltas ── */
function filtro(tipo, f, q = 0.8) { const b = ac.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; }
function osc(tipo, f) { const o = ac.createOscillator(); o.type = tipo; o.frequency.value = f; o.__libroCallado = true; return o; }
function fuente(buf) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.__libroCallado = true; return s; }

/* Dónde suena algo: volumen por distancia y paneo por el lado. */
function espacial(x, z, alcance) {
  if (x == null) return [1, 0];
  const c = J.camara, p = J.oyente || { x: c.position.x, z: c.position.z };
  const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
  const vol = clamp(1 - d / alcance, 0, 1) ** 1.6;
  // el lado: respecto a hacia dónde mira la cámara
  const yaw = J.camYaw || 0, derecha = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
  return [vol, clamp(derecha / Math.max(8, d), -0.85, 0.85)];
}
/* Pide una voz: devuelve el nodo al que conectar, o null si no entra. */
function voz(x, z, prio, dur, alcance = 70, v = 1) {
  if (!ac || ac.state !== "running") return null;
  const [vol, pan] = espacial(x, z, alcance);
  if (vol * v < 0.015) return null;
  const ahora = ac.currentTime;
  voces = voces.filter((q) => q.fin > ahora);
  if (voces.length >= MAX_VOCES) {
    let peor = null; for (const q of voces) if (!peor || q.prio < peor.prio) peor = q;
    if (!peor || peor.prio >= prio) return null;
    try { peor.g.gain.setTargetAtTime(0, ahora, 0.02); } catch (e) { /* ya se fue */ }
    voces.splice(voces.indexOf(peor), 1);
  }
  const g = ac.createGain(); g.gain.value = vol * v;
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  if (p) { p.pan.value = pan; g.connect(p).connect(salida); } else g.connect(salida);
  voces.push({ fin: ahora + dur, prio, g });
  return g;
}
function tono(dest, f, dur, o = {}) {
  const t0 = ac.currentTime + (o.en || 0), os = ac.createOscillator(), g = ac.createGain();
  os.type = o.tipo || "sine"; os.frequency.setValueAtTime(f, t0);
  if (o.fin) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.fin), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.1, t0 + (o.ataque || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  os.connect(g).connect(dest); os.start(t0); os.stop(t0 + dur + 0.05);
}
function soplo(dest, buf, tipo, f0, f1, dur, v, o = {}) {
  const t0 = ac.currentTime + (o.en || 0), s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
  const f = ac.createBiquadFilter(); f.type = tipo; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur); f.Q.value = o.q || 0.7;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + (o.ataque || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(dest); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
}
function vozHumana(dest, f0, f1, dur, v, fc, en = 0) {
  const t = ac.currentTime + en, o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter();
  o.type = "sawtooth"; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
  fl.type = "bandpass"; fl.frequency.value = fc; fl.Q.value = 3;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(fl).connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
const ultimo = {};
function cada(clave, ms) { const t = performance.now(); if (t - (ultimo[clave] || 0) < ms) return false; ultimo[clave] = t; return true; }

/* ── El catálogo: son(nombre, x, z, fuerza) ── */
const CAT = {
  paso(d, k) { tono(d, 90 + rnd(30), 0.06, { vol: 0.05 * k, tipo: "triangle" }); soplo(d, bufRuido, "lowpass", 900, 300, 0.05, 0.03 * k); },
  salto(d) { soplo(d, bufRuido, "bandpass", 500, 1400, 0.2, 0.06, { ataque: 0.04 }); },
  aterriza(d, k) { soplo(d, bufMarron, "lowpass", 500, 90, 0.25, 0.2 * k); },
  golpe(d, k) { soplo(d, bufMarron, "lowpass", 900, 120, 0.22 + k * 0.2, 0.3 + k * 0.3); soplo(d, bufRuido, "bandpass", 2500, 900, 0.12, 0.14 * k); tono(d, 160, 0.18, { fin: 60, vol: 0.2 * k, tipo: "triangle" }); },
  whoosh(d, k) { soplo(d, bufRuido, "bandpass", 300, 1900, 0.32, 0.16 * k, { ataque: 0.08 }); },
  chapa(d, k) { soplo(d, bufMarron, "lowpass", 700, 110, 0.3 + k * 0.3, 0.35 + k * 0.35); tono(d, 230, 0.4, { fin: 120, vol: 0.12 * k, tipo: "square" }); },
  vidrio(d) { for (let i = 0; i < 7; i++) soplo(d, bufRuido, "bandpass", 5000 + rnd(3000), 4000, 0.06 + rnd(0.05), 0.06, { en: i * 0.025 + rnd(0.04), q: 5 }); },
  boom(d, k) { tono(d, 130, 0.9 + k * 0.5, { fin: 30, vol: Math.min(0.7, 0.5 * k) }); soplo(d, bufMarron, "lowpass", 1500, 80, 1.2 + k, Math.min(0.9, 0.7 * k)); soplo(d, bufRuido, "bandpass", 2600, 600, 0.35, 0.2 * k); },
  trueno(d, k) { soplo(d, bufRuido, "highpass", 6000, 2000, 0.18, 0.32 * k); soplo(d, bufMarron, "lowpass", 600, 55, 2.8, 0.75 * k, { en: 0.06, ataque: 0.05 }); },
  zap(d) { tono(d, 900, 0.18, { fin: 160, vol: 0.06, tipo: "sawtooth" }); soplo(d, bufRuido, "highpass", 5000, 3000, 0.12, 0.2); },
  disparo(d) { soplo(d, bufRuido, "bandpass", 2400, 900, 0.09, 0.45); soplo(d, bufMarron, "lowpass", 420, 80, 0.3, 0.35); },
  rebote(d) { tono(d, 2800 + rnd(900), 0.32, { fin: 640, vol: 0.06 }); soplo(d, bufRuido, "highpass", 7000, 5000, 0.04, 0.16); },
  claxon(d) { tono(d, 392, 0.34, { vol: 0.05, tipo: "square" }); tono(d, 494, 0.34, { vol: 0.035, tipo: "square" }); },
  frenazo(d) { vozHumana(d, 2300, 1700, 0.5, 0.03, 2500); },
  grito(d, k, fem) { const b = fem ? rnd(620, 820) : rnd(300, 420); vozHumana(d, b, b * rnd(1.1, 1.35), rnd(0.35, 0.8), 0.06, fem ? 1500 : 950); },
  gritito(d, k, fem) { const b = fem ? rnd(700, 950) : rnd(350, 480); vozHumana(d, b, b * 0.8, 0.18, 0.05, fem ? 1600 : 1000); },
  aww(d) { vozHumana(d, 520, 400, 0.6, 0.04, 900); vozHumana(d, 640, 470, 0.6, 0.03, 1100, 0.05); },
  charla(d, k, fem) { const b = fem ? rnd(230, 300) : rnd(110, 160); for (let i = 0; i < 3; i++) vozHumana(d, b * rnd(0.9, 1.15), b * rnd(0.85, 1.1), rnd(0.08, 0.16), 0.022, fem ? 1300 : 800, i * 0.17); },
  ladrido(d) { vozHumana(d, 500, 260, 0.14, 0.13, 1100, 0.05); vozHumana(d, 500, 260, 0.14, 0.13, 1100, 0.33); },
  miau(d) { vozHumana(d, 700, 1000, 0.25, 0.05, 1200); vozHumana(d, 1000, 600, 0.3, 0.05, 1200, 0.25); },
  paloma(d) { for (let i = 0; i < 6; i++) soplo(d, bufRuido, "bandpass", 1500, 1200, 0.04, 0.07, { en: i * 0.05 }); },
  ding(d) { tono(d, 1568, 0.5, { vol: 0.03 }); tono(d, 2093, 0.7, { vol: 0.025, en: 0.12 }); },
  puerta(d) { soplo(d, bufMarron, "lowpass", 400, 150, 0.2, 0.15); tono(d, 340, 0.3, { fin: 280, vol: 0.02, tipo: "triangle", en: 0.05 }); },
  magia(d) { [392, 494, 587, 784, 988, 1175, 1568].forEach((f, i) => tono(d, f, 1.4, { vol: 0.035, tipo: "triangle", en: i * 0.07 })); tono(d, 200, 1.2, { fin: 1600, vol: 0.05 }); },
  apagar(d) { [1175, 988, 784, 587, 494].forEach((f, i) => tono(d, f, 0.9, { vol: 0.03, en: i * 0.09 })); },
  radio(d) { soplo(d, bufRuido, "bandpass", 2000, 1800, 0.25, 0.06, { q: 4 }); tono(d, 1400, 0.08, { vol: 0.02, tipo: "square", en: 0.26 }); },
  pop(d) { tono(d, 400, 0.1, { fin: 1200, vol: 0.04 }); },
  corazon(d) { [784, 988, 1318].forEach((f, i) => tono(d, f, 1, { vol: 0.022, en: i * 0.1 })); },
  romper(d) { soplo(d, bufRuido, "bandpass", 1600, 500, 0.3, 0.25); soplo(d, bufMarron, "lowpass", 300, 100, 0.1, 0.25); },
  ola(d) { soplo(d, bufMarron, "lowpass", 1400, 200, 1.8, 0.6); soplo(d, bufRuido, "bandpass", 3000, 900, 1.2, 0.2, { en: 0.1, ataque: 0.3 }); },
  alarma(d) { for (let i = 0; i < 14; i++) tono(d, i % 2 ? 880 : 1180, 0.18, { vol: 0.016, tipo: "square", en: i * 0.2 }); },
  ovni(d) { vozHumana(d, 600, 950, 1.2, 0.04, 900); vozHumana(d, 950, 420, 1.2, 0.04, 900, 1.2); },
  tractor(d) { tono(d, 180, 2.6, { fin: 640, vol: 0.05, ataque: 0.4 }); tono(d, 270, 2.6, { fin: 960, vol: 0.03, ataque: 0.4 }); },
  portal(d) { tono(d, 90, 1.8, { fin: 520, vol: 0.12, tipo: "sawtooth", ataque: 0.2 }); soplo(d, bufRuido, "bandpass", 300, 3000, 1.6, 0.18, { ataque: 0.3 }); tono(d, 1320, 0.5, { vol: 0.03, en: 1.4 }); },
  eructo(d) { vozHumana(d, 120, 85, 0.45, 0.12, 380); },
  luna(d) { soplo(d, bufMarron, "lowpass", 300, 40, 4, 0.7, { ataque: 1.2 }); tono(d, 40, 4, { fin: 28, vol: 0.3, ataque: 1 }); },
  cristal(d) { for (let i = 0; i < 5; i++) tono(d, 2000 + rnd(2500), 0.5, { vol: 0.02, en: rnd(0.4) }); },
  rearmar(d) { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tono(d, f, 1.4, { vol: 0.04, tipo: "triangle", en: i * 0.12 })); },
  cohete(d) { soplo(d, bufRuido, "bandpass", 800, 3000, 0.7, 0.16); },
  sismo(d) { soplo(d, bufMarron, "lowpass", 160, 50, 2.5, 0.8, { ataque: 0.3 }); },
  carga(d, k) { tono(d, 120 + k * 500, 0.25, { vol: 0.04, tipo: "sawtooth" }); },
};
const PRIO = { boom: 3, trueno: 3, ola: 3, luna: 3, portal: 3, sismo: 3, magia: 2, apagar: 2, zap: 2, golpe: 2, salto: 2, aterriza: 2, whoosh: 2, disparo: 2, rebote: 2, carga: 2 };
const DUR = { boom: 2.5, trueno: 3, ola: 2, luna: 4, portal: 2, sismo: 2.6, magia: 1.5, alarma: 3, tractor: 2.6, ovni: 2.4 };
const ALC = { boom: 260, trueno: 400, ola: 220, luna: 9999, portal: 160, sismo: 9999, disparo: 150, claxon: 80, grito: 60, ladrido: 60, alarma: 90 };
/* Toca un sonido. `x,z` puede ir vacío (suena «en la cabeza»). */
export function son(nombre, x, z, k = 1, extra) {
  if (!ac || !CAT[nombre]) return;
  if (!cada(nombre + (x | 0), nombre === "paso" ? 60 : 40)) return;
  const d = voz(x, z, PRIO[nombre] ?? 1, DUR[nombre] || 1, ALC[nombre] || 70, 1);
  if (d) CAT[nombre](d, k, extra);
}

/* ── Los bucles de ambiente ── */
function bucle(nombre, armar, alcance = 120) {
  const g = ac.createGain(); g.gain.value = 0;
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  armar(g);
  if (p) g.connect(p).connect(amb); else g.connect(amb);
  bucles[nombre] = { g, p, vol: 0, x: null, z: null, alcance, actual: 0 };
}
function armarBucles() {
  bucle("ciudad", (g) => { const s = fuente(bufMarron); s.connect(filtro("lowpass", 300)).connect(g); s.start(); });
  bucle("lluvia", (g) => { const s = fuente(bufRuido); s.connect(filtro("highpass", 900)).connect(filtro("lowpass", 6500)).connect(g); s.start(Math.random()); });
  bucle("viento", (g) => { const s = fuente(bufRuido), f = filtro("bandpass", 380, 1.2), l = osc("sine", 0.35), lg = ac.createGain(); lg.gain.value = 220; l.connect(lg).connect(f.frequency); s.connect(f).connect(g); s.start(1.1); l.start(); });
  bucle("vuelo", (g) => { const s = fuente(bufRuido); s.connect(filtro("bandpass", 700, 0.6)).connect(g); s.start(0.4); });
  bucle("sismo", (g) => { const s = fuente(bufMarron); s.connect(filtro("lowpass", 110)).connect(g); const o = osc("sine", 31), og = ac.createGain(); og.gain.value = 0.5; o.connect(og).connect(g); s.start(); o.start(); });
  bucle("ola", (g) => { const s = fuente(bufMarron), s2 = fuente(bufRuido), g2 = ac.createGain(); g2.gain.value = 0.25; s.connect(filtro("lowpass", 700)).connect(g); s2.connect(filtro("bandpass", 1800, 0.5)).connect(g2).connect(g); s.start(); s2.start(0.5); });
  bucle("heli", (g) => { const s = fuente(bufRuido), am = ac.createGain(); am.gain.value = 0.5; const l = osc("sine", 12.5), lg = ac.createGain(); lg.gain.value = 0.5; l.connect(lg).connect(am.gain); s.connect(filtro("lowpass", 460)).connect(am).connect(g); s.start(0.3); l.start(); }, 160);
  bucle("fuego", (g) => { const s = fuente(bufRuido); s.connect(filtro("bandpass", 900, 0.6)).connect(g); s.start(0.7); }, 50);
  bucle("dios", (g) => { for (const [f, v, tp] of [[110, 0.5, "sine"], [164.8, 0.35, "sine"], [220.5, 0.18, "triangle"], [330, 0.08, "sine"]]) { const o = osc(tp, f), og = ac.createGain(); og.gain.value = v; o.connect(og).connect(g); o.start(); } });
  bucle("tk", (g) => { const o = osc("sawtooth", 150), l = osc("sine", 6), lg = ac.createGain(); lg.gain.value = 12; l.connect(lg).connect(o.frequency); o.connect(filtro("lowpass", 520)).connect(g); o.start(); l.start(); });
  bucle("murmullo", (g) => { const s = fuente(bufRuido), am = ac.createGain(); am.gain.value = 0.6; const l = osc("sine", 0.9), lg = ac.createGain(); lg.gain.value = 0.35; l.connect(lg).connect(am.gain); s.connect(filtro("bandpass", 650, 1.4)).connect(am).connect(g); const s2 = fuente(bufRuido), g2 = ac.createGain(); g2.gain.value = 0.18; s2.connect(filtro("highpass", 5200)).connect(g2).connect(g); s.start(0.2); s2.start(1.3); l.start(); }, 40);
  bucle("sirena", (g) => { const o = osc("square", 760), l = osc("triangle", 0.55), lg = ac.createGain(); lg.gain.value = 230; l.connect(lg).connect(o.frequency); o.connect(filtro("lowpass", 1700)).connect(g); o.start(); l.start(); }, 180);
  bucle("motor", (g) => { const o = osc("sawtooth", 55), o2 = osc("square", 82); const f = filtro("lowpass", 260); o.connect(f); o2.connect(f); f.connect(g); o.start(); o2.start(); bucles.__motorOsc = [o, o2]; }, 60);
  bucle("ovni", (g) => { const o = osc("sine", 340), l = osc("sine", 3), lg = ac.createGain(); lg.gain.value = 40; l.connect(lg).connect(o.frequency); o.connect(g); o.start(); l.start(); }, 120);
  bucle("portal", (g) => { const s = fuente(bufRuido), f = filtro("bandpass", 600, 3), l = osc("sine", 2.2), lg = ac.createGain(); lg.gain.value = 400; l.connect(lg).connect(f.frequency); s.connect(f).connect(g); s.start(); l.start(); }, 90);
  setInterval(() => {   // los grillos
    if (!ac || ac.state !== "running" || J.lloviendo > 0.5) return;
    const t = ac.currentTime, g = ac.createGain(); g.gain.value = 0.01; g.connect(amb);
    for (let k = 0; k < 3; k++) { const o = osc("sine", 4400 + Math.random() * 300), e = ac.createGain(); e.gain.setValueAtTime(0, t + k * 0.07); e.gain.linearRampToValueAtTime(1, t + k * 0.07 + 0.01); e.gain.linearRampToValueAtTime(0, t + k * 0.07 + 0.04); o.connect(e).connect(g); o.start(t + k * 0.07); o.stop(t + k * 0.07 + 0.05); }
  }, 1400);
}
/* Pide que un bucle suene a `vol` desde (x, z) — o sin posición. */
export function bucleEn(nombre, vol, x = null, z = null) {
  const b = bucles[nombre]; if (!b) return;
  b.vol = vol; b.x = x; b.z = z;
}
export function motorRpm(k) { if (bucles.__motorOsc && ac) { bucles.__motorOsc[0].frequency.setTargetAtTime(45 + k * 70, ac.currentTime, 0.1); bucles.__motorOsc[1].frequency.setTargetAtTime(68 + k * 105, ac.currentTime, 0.1); } }
/* Una vez por cuadro (barato): ajusta volumen y lado de los bucles. */
export function actualizarAudio() {
  if (!ac) return;
  for (const k in bucles) {
    const b = bucles[k]; if (!b.g) continue;
    let vol = b.vol, pan = 0;
    if (vol > 0 && b.x != null) { const [v, p] = espacial(b.x, b.z, b.alcance); vol *= v; pan = p; }
    if (Math.abs(vol - b.actual) > 0.003) { b.actual = vol; b.g.gain.setTargetAtTime(vol, ac.currentTime, 0.2); }
    if (b.p && Math.abs(b.p.pan.value - pan) > 0.05) b.p.pan.setTargetAtTime(pan, ac.currentTime, 0.2);
  }
}
/* Las piezas que necesitan las escenas de las ventanas (sus sonidos). */
export function piezasEscena() {
  if (!ac) return {};
  const nota = (f, t, dur, v = 0.05, tipo = "sine") => { const o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(salida); o.start(t); o.stop(t + dur + 0.05); };
  const vozE = (f0, f1, dur, v = 0.12, tipo = "sawtooth", q = 2, fc = 900, retraso = 0) => { const t = ac.currentTime + retraso, o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur); fl.type = "bandpass"; fl.frequency.value = fc; fl.Q.value = q; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(fl).connect(g).connect(salida); o.start(t); o.stop(t + dur + 0.05); };
  const ruidoE = (dur, fc = 1200, q = 1, v = 0.1, retraso = 0, tipo = "bandpass") => { const t = ac.currentTime + retraso, s = ac.createBufferSource(); s.buffer = bufRuido; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = tipo; fl.frequency.value = fc; fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl).connect(g).connect(salida); s.start(t); s.stop(t + dur + 0.05); };
  return { ac, salida, nota, voz: vozE, ruido: ruidoE };
}
