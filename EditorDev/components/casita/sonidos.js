/**
 * LOS SONIDOS DE LA CASITA: suavecitos y de juguete, hechos al momento (nada que descargar). Respetan
 * el volumen y el «sin sonidos» de la app (y se callan mientras grabas un mensaje de voz).
 *
 * Cada sonido es una lista de notas: [forma, de, a, duración, volumen, retraso]; la forma «ruido» es un
 * soplido filtrado (de / a = el filtro). Para agregar uno: una fila en SON.
 */
const SON = {
  pop: [["sine", 520, 1180, 0.09, 0.32], ["triangle", 1400, 1700, 0.05, 0.1, 0.03]],
  boing: [["sine", 220, 620, 0.12, 0.3], ["sine", 620, 330, 0.16, 0.22, 0.1]],
  levantar: [["triangle", 420, 980, 0.13, 0.22], ["sine", 1300, 1600, 0.06, 0.08, 0.06]],
  soltar: [["sine", 420, 180, 0.12, 0.32], ["ruido", 900, 400, 0.08, 0.12]],
  poof: [["ruido", 2600, 300, 0.32, 0.32], ["sine", 620, 120, 0.26, 0.2]],
  paso: [["ruido", 1300, 900, 0.035, 0.07]],
  paso2: [["ruido", 1100, 800, 0.035, 0.07]],
  sentar: [["ruido", 700, 260, 0.16, 0.2], ["sine", 300, 210, 0.12, 0.14]],
  dormir: [["sine", 784, 784, 0.45, 0.1], ["sine", 659, 659, 0.45, 0.1, 0.24], ["sine", 523, 523, 0.7, 0.1, 0.48]],
  burbujas: [["sine", 900, 1500, 0.05, 0.12], ["sine", 1200, 1900, 0.05, 0.1, 0.09], ["sine", 1000, 1700, 0.05, 0.1, 0.2], ["sine", 1400, 2100, 0.05, 0.08, 0.31]],
  comer: [["ruido", 1800, 1200, 0.05, 0.22], ["ruido", 1600, 1000, 0.05, 0.2, 0.14], ["ruido", 1900, 1300, 0.05, 0.2, 0.28], ["sine", 700, 900, 0.06, 0.08, 0.42]],
  sarten: [["ruido", 5200, 3800, 1.4, 0.07], ["ruido", 4200, 3000, 1.4, 0.05, 0.3]],
  whoosh: [["ruido", 500, 2200, 0.32, 0.16]],
  tele: [["square", 880, 880, 0.06, 0.05], ["square", 1320, 1320, 0.08, 0.05, 0.07]],
  clic: [["square", 1800, 1600, 0.02, 0.08], ["sine", 900, 700, 0.04, 0.1, 0.01]],
  cortina: [["ruido", 3400, 1400, 0.34, 0.13]],
  abrazo: [["sine", 523, 523, 0.3, 0.13], ["sine", 659, 659, 0.3, 0.13, 0.07], ["sine", 784, 784, 0.32, 0.13, 0.14], ["sine", 1046, 1046, 0.5, 0.12, 0.21], ["sine", 2093, 2093, 0.3, 0.04, 0.24]],
  beso: [["sine", 1500, 600, 0.11, 0.2], ["sine", 900, 1900, 0.09, 0.14, 0.1]],
  miau: [["triangle", 620, 1040, 0.16, 0.2], ["triangle", 1040, 560, 0.28, 0.18, 0.14]],
  guau: [["sawtooth", 320, 190, 0.11, 0.08], ["sawtooth", 300, 180, 0.12, 0.08, 0.17]],
  cuac: [["square", 950, 620, 0.12, 0.08], ["square", 900, 600, 0.12, 0.07, 0.14]],
  chillido: [["sine", 1300, 1900, 0.12, 0.16], ["sine", 1900, 1400, 0.1, 0.12, 0.1]],
  campanita: [["sine", 1568, 1568, 0.6, 0.13], ["sine", 2093, 2093, 0.6, 0.1, 0.1], ["sine", 3136, 3136, 0.4, 0.04, 0.1]],
  agua: [["ruido", 1600, 1300, 1.3, 0.1], ["sine", 1200, 1700, 0.05, 0.06, 0.3], ["sine", 1100, 1600, 0.05, 0.06, 0.8]],
  descarga: [["ruido", 900, 260, 1.3, 0.2], ["sine", 400, 900, 0.2, 0.06, 0.9]],
  brinco: [["sine", 300, 950, 0.14, 0.24]],
  aplauso: [["ruido", 2600, 2400, 0.03, 0.26], ["ruido", 2600, 2400, 0.03, 0.24, 0.16], ["ruido", 2600, 2400, 0.03, 0.26, 0.32], ["ruido", 2600, 2400, 0.03, 0.22, 0.48]],
  risa: [["sine", 760, 820, 0.08, 0.14], ["sine", 900, 960, 0.08, 0.14, 0.12], ["sine", 760, 820, 0.08, 0.13, 0.24], ["sine", 1000, 1060, 0.1, 0.12, 0.36]],
  saludo: [["sine", 660, 880, 0.12, 0.16], ["sine", 990, 1180, 0.14, 0.14, 0.12]],
  ding: [["sine", 1046, 1046, 0.25, 0.18], ["sine", 1568, 1568, 0.35, 0.14, 0.08]],
  nop: [["triangle", 320, 220, 0.18, 0.14]],
  fuego: [["ruido", 600, 400, 0.7, 0.1], ["ruido", 2400, 2000, 0.04, 0.08, 0.2], ["ruido", 2400, 2000, 0.04, 0.08, 0.45]],
  puerta: [["sine", 190, 170, 0.06, 0.32], ["sine", 190, 170, 0.06, 0.32, 0.16]],
  regalo: [["sine", 784, 784, 0.14, 0.14], ["sine", 988, 988, 0.14, 0.14, 0.08], ["sine", 1175, 1175, 0.14, 0.14, 0.16], ["sine", 1568, 1568, 0.4, 0.14, 0.24]],
  crecer: [["sine", 400, 1200, 0.32, 0.14], ["sine", 2093, 2093, 0.3, 0.06, 0.28], ["sine", 2637, 2637, 0.3, 0.05, 0.36]],
  pez: [["sine", 1200, 1700, 0.06, 0.12], ["sine", 1500, 2000, 0.05, 0.08, 0.1]],
  tostador: [["triangle", 300, 900, 0.1, 0.24], ["square", 1800, 1600, 0.02, 0.06, 0.1]],
  cafe: [["ruido", 2000, 1700, 0.7, 0.08], ["sine", 500, 700, 0.06, 0.06, 0.2], ["sine", 520, 760, 0.06, 0.06, 0.5]],
  abrir: [["triangle", 360, 520, 0.12, 0.14], ["ruido", 1800, 1200, 0.1, 0.06]],
  hoja: [["sine", 700, 1100, 0.12, 0.16], ["sine", 1100, 1400, 0.1, 0.1, 0.08]],
  cerrar: [["sine", 900, 600, 0.12, 0.14]],
  tic: [["square", 2400, 2400, 0.015, 0.06], ["square", 1800, 1800, 0.015, 0.05, 0.25]],
};

// Las melodías (tocadiscos y cajita musical): [nota MIDI o 0 = silencio, duración en pasos].
const MELODIAS = {
  baile: { paso: 0.16, tipo: "triangle", vol: 0.07, notas: [[72, 1], [76, 1], [79, 1], [76, 1], [77, 2], [74, 2], [72, 1], [76, 1], [79, 2], [84, 2], [81, 1], [79, 1], [77, 1], [76, 1], [74, 2], [72, 2]], bajo: [48, 48, 53, 55] },
  cuna: { paso: 0.34, tipo: "sine", vol: 0.075, notas: [[76, 2], [79, 1], [84, 3], [83, 2], [79, 1], [76, 3], [74, 2], [76, 1], [79, 3], [72, 4]], bajo: null },
};
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function crearSonidos(app) {
  let ruido = null;
  const cuando = {};
  const ac = () => app.audio?.ac;
  const puede = () => { const s = app.sonidos; return ac() && ac().state === "running" && s?.pref?.on !== false && !s?.callado; };
  const salida = () => app.audio?.general || ac().destination;
  const vol = () => Math.max(0, Math.min(1, app.sonidos?.pref?.vol ?? 0.7));
  function bufRuido() {
    if (ruido && ruido.sampleRate === ac().sampleRate) return ruido;
    const b = ac().createBuffer(1, ac().sampleRate * 1.5, ac().sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (ruido = b);
  }
  function nota([forma, de, a, dur, g, retraso = 0], t0, k, v) {
    const c = ac(), t = t0 + retraso, gan = c.createGain();
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(Math.max(0.0002, g * v), t + Math.min(0.02, dur / 3));
    gan.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    gan.connect(salida());
    if (forma === "ruido") {
      const s = c.createBufferSource(), f = c.createBiquadFilter();
      s.buffer = bufRuido(); f.type = "bandpass"; f.Q.value = 1.4;
      f.frequency.setValueAtTime(de * k, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, a * k), t + dur);
      s.connect(f); f.connect(gan); s.start(t, Math.random()); s.stop(t + dur + 0.02);
    } else {
      const o = c.createOscillator();
      o.type = forma; o.frequency.setValueAtTime(de * k, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, a * k), t + dur);
      o.connect(gan); o.start(t); o.stop(t + dur + 0.02);
    }
  }
  /** Suena uno (con un pelín de tono distinto cada vez, para que no canse). */
  function sonar(n, { tono = 1, volumen = 1 } = {}) {
    const s = SON[n];
    if (!s || !puede()) return;
    const ahora = performance.now();
    if (ahora - (cuando[n] || 0) < 45) return;
    cuando[n] = ahora;
    const k = tono * (0.97 + Math.random() * 0.06), v = vol() * volumen;
    try { for (const x of s) nota(x, ac().currentTime + 0.005, k, v); } catch (e) { /* nada */ }
  }
  /** Una melodía en bucle; devuelve cómo pararla. */
  function musica(nombre) {
    const m = MELODIAS[nombre];
    if (!m) return () => {};
    let i = 0, t = 0, vivo = true, bajo = 0;
    const tic = () => {
      if (!vivo) return;
      if (puede()) {
        const c = ac(), ahora = c.currentTime;
        if (t < ahora) t = ahora + 0.05;
        while (t < ahora + 0.4) {
          const [n, d] = m.notas[i % m.notas.length];
          if (n) nota([m.tipo, hz(n), hz(n), m.paso * d * 0.95, m.vol], t, 1, vol());
          if (m.bajo && i % 4 === 0) nota(["sine", hz(m.bajo[bajo++ % m.bajo.length]), hz(m.bajo[(bajo - 1) % m.bajo.length]), m.paso * 3.5, m.vol * 0.8], t, 1, vol());
          t += m.paso * d; i++;
        }
      }
    };
    tic();
    const id = setInterval(tic, 150);
    return () => { vivo = false; clearInterval(id); };
  }
  return { sonar, musica };
}
