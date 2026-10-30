/**
 * LOS SONIDOS DE LA CASITA: suavecitos y de juguete. Cada uno tiene su nombre y su carpeta en
 * `assets/sonidos-casita/<nombre>/`: si dejas ahí tu archivo (.mp3, .m4a, .ogg o .wav, con el nombre
 * que quieras; si dejas varios, se turnan), suena el tuyo; si no, suena el hecho aquí mismo.
 * (La lista de lo que hay en cada carpeta la escribe `node herramientas/sonidos-casita.mjs` en
 * `assets/sonidos-casita/indice.json`; la acción de GitHub lo hace sola en cada subida.)
 *
 * Tienen su propio interruptor y volumen (Ajustes de la casita): no dependen de los del editor.
 * Mientras la casita está abierta, la canción del editor se calla y el motor de audio no se duerme.
 *
 * Cada sonido hecho aquí es una lista de notas: [forma, de, a, duración, volumen, retraso]; la forma
 * «ruido» es un soplido filtrado (de / a = el filtro). Para agregar uno: una fila en SONIDOS (su nombre
 * y cuándo suena) y otra en SON (cómo suena).
 */
import { rutaAUrl } from "../../assets/biblioteca.js";
import { listar } from "../../componentes/catalogo.js";

/** Todos los sonidos: nombre (= su carpeta) y cuándo suena. */
export const SONIDOS = [
  ["paso", "Cada pasito al caminar"], ["correr", "Los pasitos cuando corre lejos"], ["brinco", "Brincar"],
  ["levantar", "Cargar a tu monito o levantar algo"], ["soltar", "Soltar algo"], ["boing", "El rebotito al caer"],
  ["sentar", "Sentarse"], ["dormir", "Acostarse a dormir"], ["saludo", "Saludar"], ["risa", "Reír y bailar"],
  ["aplauso", "Aplaudir"], ["beso", "Besito"], ["abrazo", "Abrazo"], ["chocalas", "Chócalas"], ["whoosh", "Columpio y cambiar de cuarto"],
  ["pop", "Poner algo y tocar cositas"], ["poof", "Quitar algo"], ["clic", "Prender o apagar una luz"], ["tele", "Cambiar de canal"],
  ["abrir", "Abrir puertas, refri y hojitas"], ["cerrar", "Cerrar hojitas"], ["cortina", "Abrir o cerrar las cortinas"],
  ["agua", "La llave del agua"], ["regadera", "Bañarse en la regadera"], ["burbujas", "La tina y la pecera"], ["descarga", "Jalarle al excusado"],
  ["sarten", "Cocinar en la estufa o el asador"], ["horno-listo", "El platillo está listo"], ["tostador", "El pan salta del tostador"], ["cafe", "La cafetera"],
  ["comer", "Morder algo de la mano"], ["cuchara", "Comer sentados en la mesa"], ["mesa", "Poner un plato en la mesa"], ["juntos", "Comer juntitos (¡los dos en la mesa!)"],
  ["campanita", "El buzón"], ["carta", "Mandar una cartita"], ["carta-llega", "Te llegó una cartita"], ["mensaje", "Mandar un mensajito"], ["mensaje-llega", "Te llegó un mensajito"],
  ["regalo", "Regalarle algo a tu amorcito"], ["regalito", "Abrir el regalito del día"], ["crecer", "Las flores crecen"], ["hoja", "Plantas y libros"],
  ["pez", "Los pececitos"], ["fuego", "La chimenea"], ["puerta", "Tocar la puerta"], ["tic", "El reloj"],
  ["miau", "El gatito"], ["guau", "El perrito"], ["cuac", "El patito"], ["chillido", "El osito"], ["ding", "Listo (al acomodar y más)"], ["nop", "Cuando algo no se puede"],
  ["lavadora", "La lavadora"], ["consola", "Jugar videojuegos"], ["guitarra", "La guitarra"], ["piano", "Cada tecla del piano (se afina sola: deja una nota Do)"],
  ["telescopio", "Mirar las estrellas"], ["alberca", "Echarse a la alberca"], ["hamaca", "Mecerse en la hamaca"],
  ["pio", "El pajarito"], ["bici", "El timbre de la bici"], ["pincel", "Pintar en el caballete"], ["micro", "El microondas"], ["licuadora", "La licuadora"],
  ["musica-baile", "Canción del tocadiscos (se repite)"], ["musica-cuna", "Canción de la cajita musical (se repite)"], ["musica-fiesta", "Canción de la bocina (se repite)"],
];

const SON = {
  pop: [["sine", 520, 1180, 0.09, 0.32], ["triangle", 1400, 1700, 0.05, 0.1, 0.03]],
  boing: [["sine", 220, 620, 0.12, 0.3], ["sine", 620, 330, 0.16, 0.22, 0.1]],
  levantar: [["triangle", 420, 980, 0.13, 0.22], ["sine", 1300, 1600, 0.06, 0.08, 0.06]],
  soltar: [["sine", 420, 180, 0.12, 0.32], ["ruido", 900, 400, 0.08, 0.12]],
  poof: [["ruido", 2600, 300, 0.32, 0.32], ["sine", 620, 120, 0.26, 0.2]],
  paso: [["ruido", 1300, 900, 0.035, 0.07]],
  correr: [["ruido", 1500, 1000, 0.03, 0.07]],
  sentar: [["ruido", 700, 260, 0.16, 0.2], ["sine", 300, 210, 0.12, 0.14]],
  dormir: [["sine", 784, 784, 0.45, 0.1], ["sine", 659, 659, 0.45, 0.1, 0.24], ["sine", 523, 523, 0.7, 0.1, 0.48]],
  burbujas: [["sine", 900, 1500, 0.05, 0.12], ["sine", 1200, 1900, 0.05, 0.1, 0.09], ["sine", 1000, 1700, 0.05, 0.1, 0.2], ["sine", 1400, 2100, 0.05, 0.08, 0.31]],
  comer: [["ruido", 1800, 1200, 0.05, 0.22], ["ruido", 1600, 1000, 0.05, 0.2, 0.14], ["ruido", 1900, 1300, 0.05, 0.2, 0.28], ["sine", 700, 900, 0.06, 0.08, 0.42]],
  cuchara: [["triangle", 2400, 2300, 0.04, 0.08], ["ruido", 1700, 1100, 0.05, 0.16, 0.12], ["ruido", 1500, 1000, 0.05, 0.14, 0.26]],
  mesa: [["sine", 320, 280, 0.08, 0.28], ["triangle", 1800, 1700, 0.06, 0.06, 0.02]],
  juntos: [["sine", 523, 523, 0.22, 0.13], ["sine", 659, 659, 0.22, 0.13, 0.12], ["sine", 784, 784, 0.22, 0.13, 0.24], ["sine", 1046, 1046, 0.5, 0.14, 0.36], ["sine", 1318, 1318, 0.6, 0.08, 0.48], ["sine", 2093, 2093, 0.4, 0.04, 0.5]],
  sarten: [["ruido", 5200, 3800, 1.4, 0.07], ["ruido", 4200, 3000, 1.4, 0.05, 0.3]],
  "horno-listo": [["sine", 1318, 1318, 0.5, 0.16], ["sine", 1760, 1760, 0.6, 0.12, 0.14]],
  whoosh: [["ruido", 500, 2200, 0.32, 0.16]],
  tele: [["square", 880, 880, 0.06, 0.05], ["square", 1320, 1320, 0.08, 0.05, 0.07]],
  clic: [["square", 1800, 1600, 0.02, 0.08], ["sine", 900, 700, 0.04, 0.1, 0.01]],
  cortina: [["ruido", 3400, 1400, 0.34, 0.13]],
  abrazo: [["sine", 523, 523, 0.3, 0.13], ["sine", 659, 659, 0.3, 0.13, 0.07], ["sine", 784, 784, 0.32, 0.13, 0.14], ["sine", 1046, 1046, 0.5, 0.12, 0.21], ["sine", 2093, 2093, 0.3, 0.04, 0.24]],
  beso: [["sine", 1500, 600, 0.11, 0.2], ["sine", 900, 1900, 0.09, 0.14, 0.1]],
  chocalas: [["ruido", 3000, 2600, 0.04, 0.32], ["sine", 1046, 1568, 0.18, 0.12, 0.04]],
  miau: [["triangle", 620, 1040, 0.16, 0.2], ["triangle", 1040, 560, 0.28, 0.18, 0.14]],
  guau: [["sawtooth", 320, 190, 0.11, 0.08], ["sawtooth", 300, 180, 0.12, 0.08, 0.17]],
  cuac: [["square", 950, 620, 0.12, 0.08], ["square", 900, 600, 0.12, 0.07, 0.14]],
  chillido: [["sine", 1300, 1900, 0.12, 0.16], ["sine", 1900, 1400, 0.1, 0.12, 0.1]],
  pio: [["sine", 2200, 3300, 0.07, 0.12], ["sine", 2600, 3600, 0.06, 0.1, 0.11], ["sine", 2400, 3000, 0.05, 0.08, 0.2]],
  bici: [["sine", 2637, 2637, 0.32, 0.12], ["sine", 2637, 2637, 0.32, 0.1, 0.16]],
  pincel: [["ruido", 1800, 900, 0.18, 0.12], ["ruido", 1400, 700, 0.16, 0.1, 0.2]],
  micro: [["sine", 880, 880, 0.18, 0.12], ["sine", 880, 880, 0.18, 0.12, 0.26], ["sine", 1320, 1320, 0.3, 0.12, 0.52]],
  licuadora: [["sawtooth", 140, 220, 0.9, 0.05], ["ruido", 900, 1400, 0.9, 0.06]],
  campanita: [["sine", 1568, 1568, 0.6, 0.13], ["sine", 2093, 2093, 0.6, 0.1, 0.1], ["sine", 3136, 3136, 0.4, 0.04, 0.1]],
  agua: [["ruido", 1600, 1300, 1.3, 0.1], ["sine", 1200, 1700, 0.05, 0.06, 0.3], ["sine", 1100, 1600, 0.05, 0.06, 0.8]],
  regadera: [["ruido", 3800, 3200, 1.8, 0.09], ["ruido", 2200, 1900, 1.8, 0.05]],
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
  regalito: [["ruido", 2400, 900, 0.18, 0.16], ["sine", 784, 1568, 0.2, 0.14, 0.12], ["sine", 1046, 1046, 0.3, 0.12, 0.3], ["sine", 1318, 1318, 0.3, 0.12, 0.38], ["sine", 1568, 1568, 0.5, 0.12, 0.46]],
  crecer: [["sine", 400, 1200, 0.32, 0.14], ["sine", 2093, 2093, 0.3, 0.06, 0.28], ["sine", 2637, 2637, 0.3, 0.05, 0.36]],
  pez: [["sine", 1200, 1700, 0.06, 0.12], ["sine", 1500, 2000, 0.05, 0.08, 0.1]],
  tostador: [["triangle", 300, 900, 0.1, 0.24], ["square", 1800, 1600, 0.02, 0.06, 0.1]],
  cafe: [["ruido", 2000, 1700, 0.7, 0.08], ["sine", 500, 700, 0.06, 0.06, 0.2], ["sine", 520, 760, 0.06, 0.06, 0.5]],
  abrir: [["triangle", 360, 520, 0.12, 0.14], ["ruido", 1800, 1200, 0.1, 0.06]],
  hoja: [["sine", 700, 1100, 0.12, 0.16], ["sine", 1100, 1400, 0.1, 0.1, 0.08]],
  cerrar: [["sine", 900, 600, 0.12, 0.14]],
  tic: [["square", 2400, 2400, 0.015, 0.06], ["square", 1800, 1800, 0.015, 0.05, 0.25]],
  carta: [["ruido", 3000, 1800, 0.2, 0.1], ["sine", 1046, 1318, 0.2, 0.12, 0.16], ["sine", 1568, 1568, 0.3, 0.1, 0.3]],
  "carta-llega": [["sine", 1568, 1568, 0.4, 0.12], ["sine", 1318, 1318, 0.4, 0.12, 0.14], ["sine", 1760, 1760, 0.6, 0.12, 0.28]],
  mensaje: [["sine", 880, 1320, 0.1, 0.16], ["sine", 1320, 1760, 0.08, 0.1, 0.08]],
  "mensaje-llega": [["sine", 1320, 1320, 0.14, 0.14], ["sine", 1760, 1760, 0.22, 0.12, 0.1]],
  lavadora: [["ruido", 500, 700, 1.6, 0.12], ["sine", 90, 110, 1.6, 0.06]],
  consola: [["square", 660, 660, 0.06, 0.05], ["square", 880, 880, 0.06, 0.05, 0.08], ["square", 1320, 1320, 0.1, 0.05, 0.16], ["square", 1760, 1760, 0.12, 0.04, 0.26]],
  guitarra: [["triangle", 196, 196, 0.9, 0.12], ["triangle", 247, 247, 0.9, 0.1, 0.03], ["triangle", 294, 294, 0.9, 0.1, 0.06], ["triangle", 392, 392, 0.9, 0.08, 0.09]],
  piano: [["triangle", 262, 262, 0.9, 0.16], ["sine", 524, 524, 0.6, 0.06]],
  telescopio: [["sine", 2093, 2093, 0.4, 0.06], ["sine", 2637, 2637, 0.4, 0.05, 0.12], ["sine", 3136, 3136, 0.5, 0.04, 0.24]],
  alberca: [["ruido", 1400, 400, 0.5, 0.3], ["sine", 300, 900, 0.1, 0.06, 0.1], ["sine", 1200, 1800, 0.05, 0.06, 0.4]],
  hamaca: [["triangle", 180, 230, 0.4, 0.06], ["ruido", 900, 700, 0.3, 0.05, 0.1]],
};

// Las canciones (tocadiscos, cajita musical, bocina): [nota MIDI o 0 = silencio, duración en pasos].
const MELODIAS = {
  "musica-baile": { paso: 0.16, tipo: "triangle", vol: 0.07, notas: [[72, 1], [76, 1], [79, 1], [76, 1], [77, 2], [74, 2], [72, 1], [76, 1], [79, 2], [84, 2], [81, 1], [79, 1], [77, 1], [76, 1], [74, 2], [72, 2]], bajo: [48, 48, 53, 55] },
  "musica-cuna": { paso: 0.34, tipo: "sine", vol: 0.075, notas: [[76, 2], [79, 1], [84, 3], [83, 2], [79, 1], [76, 3], [74, 2], [76, 1], [79, 3], [72, 4]], bajo: null },
  "musica-fiesta": { paso: 0.13, tipo: "square", vol: 0.035, notas: [[69, 1], [0, 1], [72, 1], [76, 1], [74, 2], [72, 1], [69, 1], [67, 1], [0, 1], [69, 1], [72, 2], [76, 2], [74, 1], [72, 1], [69, 2]], bajo: [45, 45, 50, 52] },
};
const NOMBRES_VIEJOS = { baile: "musica-baile", cuna: "musica-cuna" };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const AUD = /\.(mp3|m4a|ogg|wav|aac)$/i;
const PREF = "editordev:casita-sonido";

export function leerPref() { try { return { on: true, vol: 0.85, musica: true, ...JSON.parse(localStorage.getItem(PREF) || "{}") }; } catch (e) { return { on: true, vol: 0.85, musica: true }; } }

/** Los archivos de cada carpeta: el índice (una sola petición) y, con un servidor de casa, lo recién dejado. */
let indice = null;
function cargarIndice() {
  return (indice ||= (async () => {
    const r = {};
    try { const x = await fetch(rutaAUrl("assets/sonidos-casita/indice.json"), { cache: "no-cache" }); if (x.ok) Object.assign(r, await x.json()); } catch (e) { /* nada */ }
    try {
      const dirs = await listar("assets/sonidos-casita/");
      if (dirs) for (const d of dirs.filter((h) => h.endsWith("/"))) {
        const n = d.slice(0, -1).toLowerCase();
        const fs = ((await listar(`assets/sonidos-casita/${d}`)) || []).filter((f) => AUD.test(f));
        if (fs.length) r[n] = fs.map((f) => `assets/sonidos-casita/${d}${f}`);
      }
    } catch (e) { /* nada */ }
    for (const [k, l] of Object.entries(r)) if (!Array.isArray(l) || !l.length) delete r[k];
    return r;
  })());
}

export function crearSonidos(app) {
  let ruido = null, pref = leerPref(), archivos = {};
  const buffers = new Map(), cuando = {}, ultimo = {};
  cargarIndice().then((r) => { archivos = r; });
  const ac = () => app.audio?.ac;
  const salida = () => app.audio?.general || ac().destination;
  const vol = () => Math.max(0, Math.min(1, +pref.vol || 0));
  const callado = () => !pref.on || !!app.sonidos?.callado;
  /** Que el motor esté despierto (se duerme para ahorrar pila) y luego sí, sonar. */
  function listo(cb) {
    if (!ac()) app.audio?._desbloquear?.();
    const c = ac();
    if (!c || document.hidden) return;
    if (c.state === "running") { cb(); return; }
    c.resume().then(() => { if (c.state === "running") cb(); }).catch(() => {});
  }
  function bufRuido() {
    if (ruido && ruido.sampleRate === ac().sampleRate) return ruido;
    const b = ac().createBuffer(1, ac().sampleRate * 1.5, ac().sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (ruido = b);
  }
  function nota([forma, de, a, dur, g, retraso = 0], t0, k, v, destino = salida()) {
    const c = ac(), t = t0 + retraso, gan = c.createGain();
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(Math.max(0.0002, g * v), t + Math.min(0.02, dur / 3));
    gan.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    gan.connect(destino);
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
  /** Tu archivo decodificado (se guarda para la próxima). */
  function buffer(url) {
    let b = buffers.get(url);
    if (!b) {
      b = fetch(rutaAUrl(url)).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("no")))).then((d) => new Promise((ok, mal) => { const p = ac().decodeAudioData(d, ok, mal); if (p?.then) p.then(ok, mal); })).catch(() => null);
      buffers.set(url, b);
    }
    return b;
  }
  /** Uno de tus archivos (si hay varios, se turnan sin repetir el último). */
  function deCarpeta(n) {
    const l = archivos[n];
    if (!l?.length) return null;
    let i = Math.floor(Math.random() * l.length);
    if (l.length > 1 && i === ultimo[n]) i = (i + 1) % l.length;
    ultimo[n] = i;
    return l[i];
  }
  function tocarArchivo(url, { tono = 1, volumen = 1, lazo = false } = {}) {
    return buffer(url).then((b) => {
      if (!b || !ac()) return null;
      const c = ac(), s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.loop = lazo; s.playbackRate.value = tono;
      g.gain.value = vol() * volumen;
      s.connect(g).connect(salida());
      s.start();
      return { s, g };
    });
  }
  /** Suena uno (con un pelín de tono distinto cada vez, para que no canse). `nota` (MIDI) afina el piano. */
  function sonar(n, { tono = 1, volumen = 1, nota: midi = null } = {}) {
    n = NOMBRES_VIEJOS[n] || n;
    if (callado() || (!SON[n] && !archivos[n])) return;
    const ahora = performance.now();
    if (ahora - (cuando[n] || 0) < (midi != null ? 20 : 45)) return;
    cuando[n] = ahora;
    listo(() => {
      const mio = deCarpeta(n);
      const afinar = midi != null ? Math.pow(2, (midi - 60) / 12) : 1;
      if (mio) { tocarArchivo(mio, { tono: afinar * (midi != null ? 1 : tono * (0.98 + Math.random() * 0.04)), volumen }); return; }
      const k = (midi != null ? afinar : tono * (0.97 + Math.random() * 0.06));
      try { for (const x of SON[n]) nota(x, ac().currentTime + 0.005, k, vol() * volumen); } catch (e) { /* nada */ }
    });
  }
  /** Una canción en bucle (tu archivo o la hecha aquí); devuelve cómo pararla. */
  function musica(nombre) {
    nombre = NOMBRES_VIEJOS[nombre] || nombre;
    const m = MELODIAS[nombre];
    let vivo = true, pararArchivo = null, id = 0;
    if (callado() || pref.musica === false) return () => {};
    const mio = deCarpeta(nombre);
    if (mio) {
      listo(() => tocarArchivo(mio, { lazo: true, volumen: 0.8 }).then((r) => {
        if (!r) return;
        if (!vivo) { try { r.s.stop(); } catch (e) { /* nada */ } return; }
        pararArchivo = () => { try { r.g.gain.setTargetAtTime(0, ac().currentTime, 0.12); r.s.stop(ac().currentTime + 0.5); } catch (e) { /* nada */ } };
      }));
      return () => { vivo = false; pararArchivo?.(); };
    }
    if (!m) return () => {};
    let i = 0, t = 0, bajo = 0;
    const tic = () => {
      if (!vivo || callado()) return;
      listo(() => {
        const c = ac(), ahora = c.currentTime;
        if (t < ahora) t = ahora + 0.05;
        while (t < ahora + 0.4) {
          const [n, d] = m.notas[i % m.notas.length];
          if (n) nota([m.tipo, hz(n), hz(n), m.paso * d * 0.95, m.vol], t, 1, vol());
          if (m.bajo && i % 4 === 0) { const b = m.bajo[bajo++ % m.bajo.length]; nota(["sine", hz(b), hz(b), m.paso * 3.5, m.vol * 0.8], t, 1, vol()); }
          t += m.paso * d; i++;
        }
      });
    };
    tic();
    id = setInterval(tic, 150);
    return () => { vivo = false; clearInterval(id); };
  }
  return {
    sonar, musica,
    get pref() { return pref; },
    ponerPref(c) { pref = { ...pref, ...c }; try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { /* nada */ } },
    /** (Para Ajustes) qué sonidos tienen archivo tuyo. */
    tuyos() { return Object.keys(archivos).filter((k) => archivos[k]?.length); },
  };
}
