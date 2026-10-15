/**
 * EFECTOS DE SONIDO — una biblioteca propia, hecha en el navegador.
 *
 * No hace falta ningún archivo: cada efecto se fabrica con el sintetizador del
 * navegador (OfflineAudioContext) y sale SIEMPRE igual (los «al azar» usan una
 * semilla fija). Al usarlo en un librito se guarda como un audio más de su
 * biblioteca (un .wav cortito, 10–40 KB), así que suena igual en el editor,
 * al probar y en el librito exportado.
 *
 *   SFX                 la lista (id, nombre, grupo)
 *   blobEfecto(id)      el .wav del efecto
 *   assetEfecto(app,id) el audio del librito (lo reutiliza si ya estaba)
 *   oirEfecto(id)       escucharlo ya (vista previa)
 */
const SR = 22050;

export const GRUPOS_SFX = [["toques", "Toques"], ["magia", "Magia y brillo"], ["amor", "Amor"], ["movimiento", "Movimiento"], ["fiesta", "Celebración"]];

export const SFX = [
  { id: "pop", n: "Pop", g: "toques" },
  { id: "clic", n: "Clic suave", g: "toques" },
  { id: "burbuja", n: "Burbuja", g: "toques" },
  { id: "campanita", n: "Campanita", g: "toques" },
  { id: "destello", n: "Destello", g: "magia" },
  { id: "varita", n: "Varita mágica", g: "magia" },
  { id: "arpa", n: "Arpa", g: "magia" },
  { id: "brillitos", n: "Brillitos", g: "magia" },
  { id: "latido", n: "Latido", g: "amor" },
  { id: "besito", n: "Besito", g: "amor" },
  { id: "corazones", n: "Corazoncitos", g: "amor" },
  { id: "zumbido", n: "Zumbido", g: "movimiento" },
  { id: "deslizar", n: "Deslizar", g: "movimiento" },
  { id: "boing", n: "Boing", g: "movimiento" },
  { id: "pasar-hoja", n: "Pasar página", g: "movimiento" },
  { id: "tada", n: "¡Tadá!", g: "fiesta" },
  { id: "confeti", n: "Confeti", g: "fiesta" },
  { id: "logro", n: "Logro", g: "fiesta" },
];

/* ── Piezas del sintetizador ─────────────────────────────────────── */
function azar(semilla) { let s = semilla >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Un tono con su envolvente (sube en `a`, cae hasta `t0+dur`) y su glissando f0→f1. */
function tono(ctx, sal, { tipo = "sine", f0, f1 = f0, t0 = 0, dur = 0.3, vol = 0.5, a = 0.005, vib = 0, vibF = 6 }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vibF; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(sal);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/** Ruido filtrado (soplos, roces, zumbidos) con barrido de filtro f0→f1. */
function ruido(ctx, sal, { t0 = 0, dur = 0.3, vol = 0.4, tipo = "bandpass", f0 = 1000, f1 = f0, q = 1, a = 0.01, semilla = 7 }) {
  const n = Math.ceil(dur * SR) + 64, b = ctx.createBuffer(1, n, SR), d = b.getChannelData(0), r = azar(semilla);
  for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = tipo; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(sal);
  s.start(t0); s.stop(t0 + dur + 0.02);
}

const NOTA = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

/** Cada efecto: su duración y cómo se arma. */
const RECETAS = {
  pop: [0.18, (c, s) => { tono(c, s, { f0: 620, f1: 140, dur: 0.12, vol: 0.8, a: 0.002 }); ruido(c, s, { dur: 0.025, vol: 0.25, tipo: "highpass", f0: 3000 }); }],
  clic: [0.08, (c, s) => { tono(c, s, { tipo: "triangle", f0: 1900, f1: 1300, dur: 0.035, vol: 0.45, a: 0.001 }); ruido(c, s, { dur: 0.02, vol: 0.18, tipo: "highpass", f0: 4000 }); }],
  burbuja: [0.25, (c, s) => { tono(c, s, { f0: 280, f1: 980, dur: 0.16, vol: 0.6, a: 0.01 }); tono(c, s, { f0: 520, f1: 1500, t0: 0.05, dur: 0.12, vol: 0.2 }); }],
  campanita: [1.1, (c, s) => { tono(c, s, { f0: NOTA(91), dur: 1.0, vol: 0.45, a: 0.003 }); tono(c, s, { f0: NOTA(91) * 2.76, dur: 0.5, vol: 0.12, a: 0.002 }); tono(c, s, { f0: NOTA(98), t0: 0.09, dur: 0.9, vol: 0.25 }); }],
  destello: [0.85, (c, s) => { [79, 83, 86, 91, 95].forEach((m, i) => tono(c, s, { f0: NOTA(m), t0: i * 0.045, dur: 0.45, vol: 0.28, a: 0.003 })); ruido(c, s, { dur: 0.6, vol: 0.06, tipo: "highpass", f0: 6000, semilla: 3 }); }],
  varita: [0.9, (c, s) => { ruido(c, s, { dur: 0.8, vol: 0.18, tipo: "bandpass", f0: 1800, f1: 9000, q: 3, a: 0.05, semilla: 11 }); tono(c, s, { f0: 700, f1: 2600, dur: 0.75, vol: 0.22, a: 0.04, vib: 25, vibF: 9 }); }],
  arpa: [1.2, (c, s) => { [72, 76, 79, 84, 88].forEach((m, i) => tono(c, s, { tipo: "triangle", f0: NOTA(m), t0: i * 0.065, dur: 0.85, vol: 0.32, a: 0.004 })); }],
  brillitos: [1.0, (c, s) => { const r = azar(42); for (let i = 0; i < 9; i++) tono(c, s, { f0: 1900 + r() * 2400, t0: i * 0.085 + r() * 0.03, dur: 0.22, vol: 0.2, a: 0.002 }); }],
  latido: [0.6, (c, s) => { tono(c, s, { f0: 75, f1: 42, dur: 0.16, vol: 0.95, a: 0.006 }); tono(c, s, { f0: 68, f1: 40, t0: 0.21, dur: 0.18, vol: 0.75, a: 0.006 }); }],
  besito: [0.3, (c, s) => { ruido(c, s, { dur: 0.06, vol: 0.3, tipo: "bandpass", f0: 1700, q: 2, semilla: 5 }); tono(c, s, { f0: 850, f1: 1500, t0: 0.035, dur: 0.09, vol: 0.45, a: 0.004 }); tono(c, s, { f0: 1200, f1: 600, t0: 0.12, dur: 0.12, vol: 0.12 }); }],
  corazones: [1.1, (c, s) => { [84, 88, 91].forEach((m, i) => tono(c, s, { f0: NOTA(m), t0: i * 0.12, dur: 0.7, vol: 0.3, a: 0.01, vib: 6, vibF: 5 })); }],
  zumbido: [0.65, (c, s) => { ruido(c, s, { dur: 0.6, vol: 0.5, tipo: "bandpass", f0: 280, f1: 2600, q: 1.4, a: 0.18, semilla: 21 }); }],
  deslizar: [0.4, (c, s) => { ruido(c, s, { dur: 0.35, vol: 0.32, tipo: "lowpass", f0: 450, f1: 2200, q: 0.8, a: 0.06, semilla: 9 }); }],
  boing: [0.6, (c, s) => { tono(c, s, { f0: 420, f1: 170, dur: 0.55, vol: 0.55, a: 0.004, vib: 30, vibF: 16 }); }],
  "pasar-hoja": [0.45, (c, s) => { ruido(c, s, { dur: 0.18, vol: 0.32, tipo: "highpass", f0: 900, f1: 3200, q: 0.7, a: 0.02, semilla: 13 }); ruido(c, s, { t0: 0.12, dur: 0.28, vol: 0.22, tipo: "bandpass", f0: 2600, f1: 900, q: 0.9, a: 0.03, semilla: 17 }); }],
  tada: [1.3, (c, s) => {
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600; f.connect(s);
    [72, 76, 79].forEach((m) => tono(c, f, { tipo: "sawtooth", f0: NOTA(m), dur: 0.14, vol: 0.12, a: 0.005 }));
    [72, 76, 79, 84].forEach((m) => tono(c, f, { tipo: "sawtooth", f0: NOTA(m), t0: 0.16, dur: 1.05, vol: 0.12, a: 0.01, vib: 3, vibF: 5.5 }));
  }],
  confeti: [1.0, (c, s) => { const r = azar(77); for (let i = 0; i < 16; i++) ruido(c, s, { t0: r() * 0.75, dur: 0.035, vol: 0.18 + r() * 0.2, tipo: "bandpass", f0: 1500 + r() * 4000, q: 4, semilla: 100 + i }); for (let i = 0; i < 5; i++) tono(c, s, { f0: 2200 + r() * 1800, t0: 0.1 + r() * 0.6, dur: 0.18, vol: 0.12 }); }],
  logro: [0.6, (c, s) => { [79, 84, 88, 91].forEach((m, i) => tono(c, s, { tipo: "square", f0: NOTA(m), t0: i * 0.07, dur: i === 3 ? 0.35 : 0.09, vol: 0.12, a: 0.003 })); }],
};

/** Un AudioBuffer → .wav de 16 bits (mono). */
function wav(buf) {
  const d = buf.getChannelData(0), n = d.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
  const txt = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); txt(8, "WAVE"); txt(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); txt(36, "data"); v.setUint32(40, n * 2, true);
  let pico = 0; for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(d[i]));
  const k = pico > 0.001 ? 0.82 / pico : 1; // todos al mismo volumen, sin saturar
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * k)) * 0x7fff, true);
  return new Blob([ab], { type: "audio/wav" });
}

const hechos = new Map();
/** El .wav del efecto (se fabrica una vez por sesión). */
export function blobEfecto(id) {
  if (hechos.has(id)) return hechos.get(id);
  const r = RECETAS[id];
  if (!r) return Promise.reject(new Error("No existe el efecto " + id));
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const p = (async () => {
    const ctx = new OAC(1, Math.ceil(r[0] * SR), SR);
    const sal = ctx.createGain(); sal.gain.value = 0.9; sal.connect(ctx.destination);
    r[1](ctx, sal);
    return wav(await ctx.startRendering());
  })();
  p.catch(() => hechos.delete(id));
  hechos.set(id, p);
  return p;
}

let sonando = null;
/** Escucharlo ya (para elegir). */
export async function oirEfecto(id, vol = 0.9) {
  const b = await blobEfecto(id);
  try { sonando?.pause(); } catch (e) { /* nada */ }
  const u = URL.createObjectURL(b);
  const a = new Audio(u);
  a.volume = vol;
  a.addEventListener("ended", () => URL.revokeObjectURL(u), { once: true });
  sonando = a;
  await a.play().catch(() => {});
}

/** El audio del librito para ese efecto (si ya se había usado, el mismo). */
export async function assetEfecto(app, id) {
  const P = app.estado.proyecto;
  const ya = Object.values(P.assets || {}).find((a) => a.sfx === id && a.tipo === "audio");
  if (ya) return ya.id;
  const s = SFX.find((x) => x.id === id);
  const b = await blobEfecto(id);
  const a = await app.bib.deBlob(b, "audio", "Efecto · " + (s?.n || id), { sfx: id, archivo: `efecto-${id}.wav`, dur: Math.round(RECETAS[id][0] * 1000) });
  return a.id;
}
