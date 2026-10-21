/**
 * MENSAJES DE VOZ (Fase 34): grabar con el micrófono y el reproductor chiquito de las burbujas.
 *
 *   · se graba con lo que sepa el navegador (webm/opus, mp4/aac…, a 128 kbps) y se pasa a WAV mono
 *     de 48 kHz (HD, Fase 35): así suena claro en TODOS los teléfonos y compus (iPhone incluido).
 *     Sin el «volumen automático» del navegador (que la deformaba): se limpian los graves que retumban,
 *     un compresor suavecito empareja la voz y se sube al volumen justo, sin saturar
 *   · las ondas (48 rayitas de 0 a 31) se calculan al grabar: el reproductor las dibuja sin bajar nada
 *   · velocidades x1, x1.5, x2 y x3 (el navegador conserva el tono: nada de voz de ardilla)
 *   · sólo suena un audio a la vez
 */
import { el } from "./ui.js";
import { sinMovimiento as reducido } from "./transiciones.js";

export const MAX_SEG = 240; // 4 minutos: el WAV de 48 kHz (≈23 MB) cabe en lo que acepta el servidor
export const VELOCIDADES = [1, 1.5, 2, 3];
const BARRAS = 48;
const AC = () => window.AudioContext || window.webkitAudioContext;

export const puedeGrabar = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && AC());
export const minutos = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/**
 * Empieza a grabar (llamarla desde un toque: el iPhone sólo deja prender el audio así).
 * Devuelve { nivel() de 0 a 1, segundos(), parar() → { blob, dur, ondas }, cancelar() }.
 */
export async function grabar() {
  const ctx = new (AC())(); // se crea ya, dentro del toque
  let flujo;
  try { flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false, channelCount: 1, sampleRate: 48000 } }); }
  catch (e) { ctx.close().catch(() => {}); throw e; }
  ctx.resume?.().catch(() => {});
  const tipo = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
  let rec;
  try { rec = new MediaRecorder(flujo, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 128000 }); }
  catch (e) { rec = new MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined); }
  const trozos = [];
  rec.ondataavailable = (e) => { if (e.data?.size) trozos.push(e.data); };
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  ctx.createMediaStreamSource(flujo).connect(an);
  const muestra = new Uint8Array(an.fftSize);
  const t0 = performance.now();
  rec.start(250);
  const apagar = () => { flujo.getTracks().forEach((t) => t.stop()); ctx.close().catch(() => {}); };
  return {
    nivel() {
      an.getByteTimeDomainData(muestra);
      let s = 0;
      for (const v of muestra) { const x = (v - 128) / 128; s += x * x; }
      return Math.min(1, Math.sqrt(s / muestra.length) * 3.4);
    },
    segundos: () => (performance.now() - t0) / 1000,
    cancelar() { rec.onstop = null; try { rec.stop(); } catch (e) { /* ya estaba */ } apagar(); },
    parar() {
      return new Promise((ok, mal) => {
        rec.onstop = async () => {
          apagar();
          try { ok(await aWav(new Blob(trozos, { type: rec.mimeType || tipo || "audio/webm" }))); } catch (e) { mal(e); }
        };
        try { rec.stop(); } catch (e) { mal(e); }
      });
    },
  };
}

/** Lo grabado → WAV mono de 48 kHz (HD): sin retumbos, parejito y al volumen justo; y sus ondas. */
async function aWav(blob) {
  const datos = await blob.arrayBuffer();
  const ctx = new (AC())();
  let audio;
  try { audio = await new Promise((ok, mal) => { const p = ctx.decodeAudioData(datos, ok, mal); p?.catch?.(mal); }); }
  finally { ctx.close().catch(() => {}); }
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let pcm = null, hz = 48000;
  for (const h of [48000, 44100, audio.sampleRate]) {
    try {
      const off = new OAC(1, Math.max(1, Math.ceil(audio.duration * h)), h);
      const f = off.createBufferSource();
      f.buffer = audio;
      // Sin retumbos (graves de menos de 80 Hz: golpes, viento, el teléfono en la mesa)…
      const graves = off.createBiquadFilter();
      graves.type = "highpass"; graves.frequency.value = 80; graves.Q.value = 0.7;
      // …y la voz pareja: lo fuerte baja tantito y lo bajito se entiende (suave, sin «bombeo»).
      const comp = off.createDynamicsCompressor();
      comp.threshold.value = -22; comp.knee.value = 14; comp.ratio.value = 2.6; comp.attack.value = 0.006; comp.release.value = 0.22;
      f.connect(graves); graves.connect(comp); comp.connect(off.destination); f.start();
      pcm = (await off.startRendering()).getChannelData(0);
      hz = h;
      break;
    } catch (e) { /* esa frecuencia no: la siguiente */ }
  }
  if (!pcm) throw new Error("Este aparato no pudo preparar el audio.");
  // Al volumen justo (hasta −1 dB) sin saturar: si queda bajito se sube, como mucho 3 veces.
  let pico = 0;
  for (let i = 0; i < pcm.length; i++) pico = Math.max(pico, Math.abs(pcm[i]));
  const k = pico > 0.001 ? Math.min(3, 0.89 / pico) : 1;
  if (Math.abs(k - 1) > 0.02) for (let i = 0; i < pcm.length; i++) pcm[i] *= k;
  return { blob: wav(pcm, hz), dur: Math.round(audio.duration * 100) / 100, ondas: ondas(pcm) };
}
function wav(pcm, hz) {
  const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, "RIFF"); v.setUint32(4, 36 + pcm.length * 2, true); s(8, "WAVE"); s(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, hz, true);
  v.setUint32(28, hz * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, "data"); v.setUint32(40, pcm.length * 2, true);
  // (Con un «dither» chiquitito: lo muy bajito no suena granuloso al pasarlo a 16 bits.)
  for (let i = 0; i < pcm.length; i++) {
    const x = Math.max(-1, Math.min(1, pcm[i] + (Math.random() - Math.random()) / 65536));
    v.setInt16(44 + i * 2, Math.round(x < 0 ? x * 0x8000 : x * 0x7fff), true);
  }
  return new Blob([b], { type: "audio/wav" });
}
function ondas(pcm) {
  const out = [], paso = Math.max(1, Math.floor(pcm.length / BARRAS));
  for (let i = 0; i < BARRAS; i++) {
    const a = i * paso, z = Math.min(pcm.length, a + paso);
    let s = 0;
    for (let j = a; j < z; j++) s += pcm[j] * pcm[j];
    out.push(Math.sqrt(s / Math.max(1, z - a)));
  }
  const max = Math.max(...out, 1e-4);
  return out.map((x) => Math.round(Math.pow(x / max, 0.7) * 31));
}

/* — El reproductor de una burbuja — */
let sonando = null;
export function pararVoz() { sonando?.pausar(); }
const SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 5.6c0-1.1 1.2-1.8 2.2-1.2l9 5.9c.9.6.9 1.9 0 2.5l-9 5.9c-1 .6-2.2-.1-2.2-1.2z" fill="currentColor"/></svg>';
const SVG_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.4" y="4.8" width="4.2" height="14.4" rx="1.8" fill="currentColor"/><rect x="13.4" y="4.8" width="4.2" height="14.4" rx="1.8" fill="currentColor"/></svg>';

/**
 * `a` = { u, dur, ondas }. `url` es la dirección para sonar; `vel()` y `alVel(v)` guardan la velocidad
 * (la misma para todos los audios, como en WhatsApp); `alSonar()` cuando empieza.
 */
export function reproductor(a, { url, vel, alVel, alSonar, alError }) {
  const dur = Math.max(0.2, +a.dur || 0);
  const lista = (a.ondas?.length ? a.ondas : Array.from({ length: BARRAS }, (_, i) => 8 + ((i * 7) % 13)));
  const barras = lista.map((h) => el("i", { style: { "--h": Math.max(3, h) / 31 } }));
  const t = el("small.ch-voz-t", { text: minutos(dur) });
  const bPlay = el("button.ch-voz-play", { type: "button", "aria-label": "Escuchar", html: `<i class="pl">${SVG_PLAY}</i><i class="pa">${SVG_PAUSA}</i>` });
  const bVel = el("button.ch-voz-vel", { type: "button", "aria-label": "Velocidad", text: "x" + vel() });
  const ondasN = el("div.ch-voz-ondas", { role: "slider", "aria-label": "Avanzar en el audio", "aria-valuemin": "0", "aria-valuemax": String(Math.round(dur)), "aria-valuenow": "0", tabindex: "-1" }, barras);
  const raiz = el("div.ch-voz", {}, [bPlay, el("div.ch-voz-medio", {}, [ondasN, t]), bVel]);
  let au = null, cuadro = 0, encendidas = -1;

  const pintar = () => {
    const p = au ? Math.min(1, au.currentTime / (au.duration && isFinite(au.duration) ? au.duration : dur)) : 0;
    const n = Math.round(p * barras.length);
    if (n !== encendidas) {
      barras.forEach((b, i) => { b.classList.toggle("on", i < n); b.classList.toggle("ahora", i === n - 1 && raiz.classList.contains("sonando")); });
      encendidas = n;
    }
    raiz.style.setProperty("--p", p);
    t.textContent = minutos(au && (raiz.classList.contains("sonando") || au.currentTime > 0) ? au.currentTime : dur);
    ondasN.setAttribute("aria-valuenow", String(Math.round(au?.currentTime || 0)));
  };
  const lazo = () => { pintar(); if (raiz.classList.contains("sonando")) cuadro = requestAnimationFrame(lazo); };
  const crear = () => {
    if (au) return au;
    au = new Audio(url);
    au.preload = "auto";
    au.addEventListener("ended", () => { raiz.classList.remove("sonando"); bPlay.setAttribute("aria-label", "Escuchar"); au.currentTime = 0; if (sonando === api) sonando = null; encendidas = -1; pintar(); });
    au.addEventListener("pause", () => { raiz.classList.remove("sonando"); bPlay.setAttribute("aria-label", "Escuchar"); cancelAnimationFrame(cuadro); encendidas = -1; pintar(); });
    au.addEventListener("error", () => { raiz.classList.remove("sonando"); alError?.(); });
    return au;
  };
  const api = {
    pausar() { au?.pause(); },
    async tocar() {
      if (sonando && sonando !== api) sonando.pausar();
      crear();
      au.playbackRate = vel();
      try {
        await au.play();
        sonando = api;
        raiz.classList.add("sonando");
        bPlay.setAttribute("aria-label", "Pausar");
        alSonar?.();
        encendidas = -1;
        lazo();
      } catch (e) { if (e.name !== "AbortError") alError?.(); }
    },
  };
  bPlay.addEventListener("click", () => (raiz.classList.contains("sonando") ? api.pausar() : api.tocar()));
  bVel.addEventListener("click", () => {
    const v = VELOCIDADES[(VELOCIDADES.indexOf(vel()) + 1) % VELOCIDADES.length];
    alVel(v);
    if (au) au.playbackRate = v;
    document.querySelectorAll(".ch-voz-vel").forEach((b) => { b.textContent = "x" + v; });
    if (!reducido()) bVel.animate([{ transform: "scale(.8)" }, { transform: "scale(1.12)" }, { transform: "none" }], { duration: 300, easing: "ease-out" });
  });
  // Tocar las ondas: brincar a esa parte (y si no estaba sonando, empieza ahí).
  ondasN.addEventListener("click", (e) => {
    const r = ondasN.getBoundingClientRect(), p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    crear();
    const ir = () => { au.currentTime = p * (isFinite(au.duration) && au.duration ? au.duration : dur); pintar(); };
    if (au.readyState >= 1) ir(); else au.addEventListener("loadedmetadata", ir, { once: true });
    if (!raiz.classList.contains("sonando")) api.tocar();
  });
  raiz._voz = api;
  return raiz;
}
