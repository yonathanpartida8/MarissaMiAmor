/**
 * EL «HACKEO» — una broma romántica, no un hackeo de verdad.
 *
 * Lo activa una línea de dialogos.txt que empieza con «-». Sólo corre esta
 * secuencia ya programada; el mensaje del archivo se pone como TEXTO.
 *   1. Interferencia: la interfaz tiembla, líneas, ruido, letras corruptas.
 *   2. Alerta: un terminal falso, «OH...» y «ESTOY SIENDO HACKEADO...».
 *   3. Revelación: el mensaje de verdad, con corazones, y todo vuelve a la
 *      normalidad con una pequeña «recuperación».
 * Toda la secuencia dura unos 8 s; tocar después de la revelación la cierra.
 */
import { el } from "../../src/utils/dom.js";
import { PREF, movimiento } from "../config/preferencias.js";

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const RARO = "▓▒░█▚▞#@%&$*01<>/\\{}[]";
let corriendo = false;

/** Ruido de interferencia (Web Audio; sin archivos). */
function ruido(app, seg = 1.6, vol = 0.18) {
  const AU = app.audio, ac = AU?.ac;
  if (!ac || ac.state !== "running" || !PREF.abejaSonido) return;
  const n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.02 ? 1 : 0.35);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
  s.buffer = b; f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.7;
  g.gain.setValueAtTime(0, t);
  for (let k = 0; k < seg; k += 0.12) g.gain.setValueAtTime(vol * (Math.random() < 0.5 ? 1 : 0.15), t + k);
  g.gain.linearRampToValueAtTime(0, t + seg);
  s.connect(f).connect(g).connect(AU.general);
  s.start(t); s.onended = () => { try { g.disconnect(); } catch (e) { /* nada */ } };
}

function campanita(app) {
  const AU = app.audio, ac = AU?.ac;
  if (!ac || ac.state !== "running" || !PREF.abejaSonido) return;
  const t = ac.currentTime;
  [[784, 0], [988, 0.1], [1175, 0.2], [1568, 0.32]].forEach(([fr, d]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = fr; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.12, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + d + 0.9);
    o.connect(g).connect(AU.general); o.start(t + d); o.stop(t + d + 1);
  });
}

let saltar = false; // un toque durante la revelación termina de escribir al instante
async function escribir(n, texto, ms = 28) {
  if (!movimiento()) { n.textContent = texto; return; }
  for (let i = 1; i <= texto.length; i++) { if (saltar) { n.textContent = texto; return; } n.textContent = texto.slice(0, i); await espera(ms); }
}

export async function hackeo(app, mensaje, abeja) {
  if (corriendo) return;
  corriendo = true;
  const quieto = !movimiento();
  const b = document.body;
  const capa = el("div.ed-hack", { role: "alert", "aria-live": "assertive" }, [el("div.ed-hack-ruido"), el("div.ed-hack-lineas")]);
  b.append(capa);
  app.audio?.agachar("hackeo", true, 0.08);
  try {
    // 1 · Interferencia
    abeja?.reaccionar("hackeo");
    if (!quieto) b.classList.add("ed-glitcheando");
    ruido(app, 1.8);
    const letras = [];
    for (let i = 0; i < (quieto ? 0 : 14); i++) {
      const s = el("span.ed-hack-letra");
      s.style.cssText = `left:${Math.random() * 92}%;top:${Math.random() * 92}%`;
      capa.append(s); letras.push(s);
    }
    const t = setInterval(() => { for (const s of letras) s.textContent = Array.from({ length: 6 + (Math.random() * 10 | 0) }, () => RARO[Math.random() * RARO.length | 0]).join(""); }, 90);
    capa.classList.add("fase1");
    await espera(1700);
    // 2 · Alerta
    const term = el("pre.ed-hack-term");
    capa.append(term);
    const lineas = ["> conexión entrante desde: ♥♥♥.♥.♥", "> saltando el firewall… OK", "> leyendo corazon.exe ███████████ 100%"];
    for (const l of lineas) { const x = el("div"); term.append(x); await escribir(x, l, 18); await espera(140); }
    clearInterval(t);
    for (const s of letras) s.remove();
    const grito = el("b.ed-hack-grito");
    capa.append(grito);
    await escribir(grito, "OH...", 90);
    abeja?.decir("¡¿Qué pasa?! ¡Bzz!", { cara: "asustada", voz: "susto" });
    await espera(700);
    ruido(app, 0.9, 0.24);
    grito.classList.add("rojo");
    await escribir(grito, "ESTOY SIENDO HACKEADO...", 45);
    await espera(1100);
    // 3 · Revelación
    b.classList.remove("ed-glitcheando");
    abeja?.callar();
    capa.classList.remove("fase1");
    capa.classList.add("fase3");
    grito.remove(); term.remove();
    campanita(app);
    const texto = el("p");
    const carta = el("div.ed-hack-carta", {}, [el("i.ed-hack-cor", { text: "♥" }), texto, el("button.ed-btn.primario", { type: "button", text: "Yo también te amo 💖" })]);
    capa.append(carta);
    if (PREF.particulas && !quieto) for (let i = 0; i < 16; i++) {
      const c = el("i.ed-hack-flota", { text: ["♥", "✦", "💖"][i % 3] });
      c.style.cssText = `left:${Math.random() * 100}%;animation-delay:${Math.random() * 2}s;font-size:${14 + Math.random() * 16}px`;
      capa.append(c);
    }
    saltar = false;
    capa.addEventListener("click", () => { saltar = true; }, { once: true });
    await escribir(texto, String(mensaje || ""), 26);
    abeja?.reaccionar("carino");
    await espera(250);
    await new Promise((ok) => { capa.addEventListener("click", ok, { once: true }); setTimeout(ok, 25000); });
  } finally {
    // Recuperación: un último parpadeo y todo vuelve a la normalidad.
    b.classList.remove("ed-glitcheando");
    capa.classList.add("fin");
    await espera(quieto ? 50 : 420);
    capa.remove();
    app.audio?.agachar("hackeo", false);
    corriendo = false;
  }
}
