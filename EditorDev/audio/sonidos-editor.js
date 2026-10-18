/**
 * LOS SONIDOS DEL EDITOR — un archivo por interacción en assets/sonidos-editor/,
 * con el nombre de lo que hace: seleccionar-elemento.wav, soltar-objeto.wav,
 * zoom-acercar.wav… (la lista entera, en ARCHIVO, abajo, y en el LÉEME de la
 * carpeta). Cambiar un sonido = poner otro archivo con el MISMO nombre (wav,
 * mp3, ogg o m4a). Con «-2», «-3»… al final del nombre, varias versiones que se
 * turnan. Sin archivo, ese momento suena con un sonidito hecho aquí mismo.
 *
 * Antes (Fase 12) eran carpetas <categoría>/<acción>/: si alguien las pone,
 * siguen valiendo (CARPETA), pero el archivo con nombre manda.
 *
 *   interaccion · movimiento · transformacion · organizacion · interfaz ·
 *   edicion · paginas · multimedia · animaciones   (ver CARPETA, abajo)
 *
 * Cambiar un sonido = cambiar los archivos de su carpeta (aparecen solos).
 * Que un momento suene con otra carpeta = cambiar su línea en CARPETA.
 *
 * Para que no se sienta robótico:
 *   · cada vez se elige uno al azar de su carpeta, sin repetir el último;
 *   · cada uno suena con un tono y un volumen un poquito distintos;
 *   · entra y sale con un fundido de milisegundos (nada de chasquidos);
 *   · el mismo momento no se repite enseguida y nunca suenan más de unos
 *     pocos a la vez (se puede elegir cuántos).
 * Mezcla (Fase 12): pasan por un limitador suave (varios a la vez nunca
 * saturan) y, mientras suenan, MusicaDev se hace un poquito a un lado y
 * vuelve sola («agachar» del mezclador): los volúmenes elegidos no cambian.
 * Los de poca importancia (tocar un botón, elegir, soltar la selección)
 * esperan 28 ms y ceden si llega uno más importante: nunca dos por una acción.
 * Se apagan, se suben o se bajan en Herramientas → Sonidos del editor.
 *
 * Fase 11: los momentos sin carpeta (duplicar, colocar, ajustar,
 * herramienta, fotograma… o cualquiera que falte) suenan con un sonidito
 * digital hecho aquí mismo: suaves, cortitos, nunca iguales dos veces
 * seguidas y sin cargar archivos.
 */
import { extras } from "../recursos/extras.js";
import { rutaAUrl } from "../assets/biblioteca.js";

const PREF = "editordev:sonidos";
/** Cada momento del editor → su carpeta. (Una carpeta suelta con el nombre del momento, como antes, también vale.) */
export const CARPETA = {
  botones: "interaccion/pulsar", seleccionar: "interaccion/seleccionar", deseleccionar: "interaccion/deseleccionar", exito: "interaccion/confirmar", herramienta: "interaccion/herramienta",
  arrastrar: "movimiento/arrastrar", desplazar: "movimiento/desplazar", soltar: "movimiento/soltar",
  rotar: "transformacion/rotar", zoom: "transformacion/zoom", redimensionar: "transformacion/redimensionar",
  agrupar: "organizacion/agrupar", desagrupar: "organizacion/desagrupar", duplicar: "organizacion/duplicar", borrar: "organizacion/eliminar", capas: "organizacion/ordenar-capas",
  abrir: "interfaz/abrir", cerrar: "interfaz/cerrar", minimizar: "interfaz/minimizar", restaurar: "interfaz/restaurar", guardar: "interfaz/guardar", error: "interfaz/error",
  dibujar: "edicion/dibujar", borrador: "edicion/borrar", colorear: "edicion/colorear", efecto: "edicion/aplicar-efectos", deshacer: "edicion/deshacer", colocar: "edicion/colocar", ajustar: "edicion/ajustar",
  pagina: "paginas/crear", "pagina-duplicar": "paginas/duplicar", "pagina-cambiar": "paginas/cambiar",
  reproducir: "multimedia/reproducir", pausar: "multimedia/pausar",
  animar: "animaciones/aplicar", fotograma: "animaciones/fotograma",
  // Más momentos: atrás en los menús, interruptores, imán, menú, probar, bloquear/ocultar, páginas y escribir.
  atras: "interfaz/atras", probar: "interfaz/probar", activar: "interaccion/activar", desactivar: "interaccion/desactivar", menu: "interaccion/menu",
  iman: "movimiento/iman", bloquear: "organizacion/bloquear", desbloquear: "organizacion/desbloquear", ocultar: "organizacion/ocultar", mostrar: "organizacion/mostrar",
  "pagina-eliminar": "paginas/eliminar", "pagina-reordenar": "paginas/reordenar", escribir: "edicion/escribir",
};
/** Cada momento del editor → el archivo que suena (assets/sonidos-editor/<nombre>.wav). */
export const ARCHIVO = {
  botones: "tocar-boton", seleccionar: "seleccionar-elemento", "seleccionar-varios": "seleccionar-varios", deseleccionar: "deseleccionar",
  exito: "listo-exito", herramienta: "elegir-herramienta", menu: "menu-mantener", ajustar: "deslizador",
  arrastrar: "arrastrar-pintura", pincel: "pincel-roce", soltar: "soltar-objeto", iman: "iman-pegar", desplazar: "mover-hoja",
  rotar: "girar-objeto", redimensionar: "cambiar-tamano", zoom: "zoom-acercar", "zoom-acercar": "zoom-acercar", "zoom-alejar": "zoom-alejar", "zoom-paso": "zoom-paso",
  colocar: "colocar-objeto", duplicar: "duplicar", borrar: "borrar-objeto", agrupar: "agrupar", desagrupar: "desagrupar", capas: "ordenar-capas",
  bloquear: "bloquear", desbloquear: "desbloquear", ocultar: "ocultar", mostrar: "mostrar",
  dibujar: "dibujar-trazo", borrador: "borrador", colorear: "elegir-color", efecto: "aplicar-efecto", animar: "aplicar-animacion", fotograma: "fotograma",
  escribir: "escribir-texto", deshacer: "deshacer", rehacer: "rehacer", guardar: "guardar", error: "aviso-error",
  abrir: "abrir-menu", cerrar: "cerrar-menu", minimizar: "bajar-hoja", restaurar: "subir-hoja", atras: "atras",
  activar: "interruptor-encender", desactivar: "interruptor-apagar", probar: "probar-pagina",
  pagina: "pagina-nueva", "pagina-duplicar": "pagina-duplicar", "pagina-cambiar": "pagina-cambiar", "pagina-eliminar": "pagina-borrar", "pagina-reordenar": "pagina-reordenar",
  reproducir: "reproducir", pausar: "pausar", publicar: "publicar",
  "abrir-recursos": "abrir-recursos", "cerrar-recursos": "cerrar-recursos",
  // Fase 20: si pones un archivo con estos nombres, suena ése; si no, uno hecho aquí.
  brillo: "brillo", giro: "girar-tarjeta", sobre: "abrir-sobre", latido: "latido", campanas: "vincular-pareja", separar: "desvincular", tecla: "tecla-codigo",
  // Fase 22: Detallitos (la colección, abrir una página y las reacciones), el gatito del menú,
  // la voz de la abejita y el huevito de pascua. Todo lo que suena en el editor tiene su nombre.
  coleccion: "coleccion-abrir", "detallito-abrir": "detallito-abrir", gatito: "gatito-ronroneo",
  "reaccion-te-amo": "reaccion-te-amo", "reaccion-me-encanto": "reaccion-me-encanto", "reaccion-llore": "reaccion-llore",
  "reaccion-abrazo": "reaccion-abrazo", "reaccion-beso": "reaccion-beso", "reaccion-risa": "reaccion-risa", "reaccion-quitar": "reaccion-quitar",
  "abeja-habla": "abejita-habla", "abeja-hola": "abejita-hola", "abeja-feliz": "abejita-feliz", "abeja-susto": "abejita-susto", "abeja-adios": "abejita-adios", "abeja-zumbido": "abejita-zumbido",
  "glitch-ruido": "secreto-interferencia", "glitch-campanita": "secreto-campanita",
  // Fase 30: los mensajitos.
  "mensaje-enviar": "mensaje-enviar", "mensaje-llega": "mensaje-llega", "sticker-pegar": "sticker-pegar",
};
/* Lo que se repite seguido sube por la escala (do, re, mi, sol, la, do…) en vez
   de sonar igual: elegir cinco cosas seguidas es una escalerita, no un martillo.
   Tras una pausa vuelve a empezar desde abajo. */
const ESCALA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
const COMBO = new Set(["seleccionar", "seleccionar-varios", "colocar", "iman", "duplicar", "capas", "fotograma"]);
// Los de poca importancia: ceden ante cualquier otro.
const SUAVES = new Set(["botones", "seleccionar", "deseleccionar"]);
// Cuánto se hace a un lado MusicaDev mientras suena un efecto del editor (1 = nada).
const AGACHAR = 0.6;
// Lo mínimo entre dos sonidos del mismo momento (ms): sin metralletas.
const MIN = { coleccion: 600, "mensaje-llega": 350, "mensaje-enviar": 120, "sticker-pegar": 120, "detallito-abrir": 400, gatito: 1600, "reaccion-quitar": 300, "zoom-paso": 55, "zoom-acercar": 380, "zoom-alejar": 380, pincel: 240, "seleccionar-varios": 90, rehacer: 120, publicar: 800, botones: 70, seleccionar: 90, deseleccionar: 120, arrastrar: 160, soltar: 120, abrir: 140, cerrar: 140, minimizar: 140, restaurar: 140, ajustar: 65, herramienta: 90, fotograma: 110, duplicar: 120, colocar: 120, desplazar: 400, zoom: 350, rotar: 200, redimensionar: 200, capas: 150, dibujar: 200, borrador: 150, colorear: 150, "pagina-cambiar": 250, atras: 150, activar: 100, desactivar: 100, menu: 150, iman: 260, escribir: 200, probar: 400, "abrir-recursos": 200, "cerrar-recursos": 200 };
/* Sonidos hechos a mano: [forma, frec. inicial, frec. final, duración s, volumen, retraso s]. */
const SINTE = {
  colocar: [["sine", 520, 250, 0.11, 0.5], ["triangle", 1040, 900, 0.03, 0.12]],
  duplicar: [["sine", 880, 900, 0.05, 0.32], ["sine", 1320, 1360, 0.07, 0.3, 0.055]],
  ajustar: [["sine", 1750, 1650, 0.016, 0.16]],
  herramienta: [["triangle", 420, 780, 0.11, 0.26]],
  fotograma: [["sine", 1568, 1568, 0.28, 0.24], ["sine", 2349, 2349, 0.2, 0.09]],
  seleccionar: [["sine", 990, 1180, 0.06, 0.22]],
  soltar: [["sine", 360, 240, 0.08, 0.32]],
  arrastrar: [["triangle", 260, 330, 0.06, 0.16]],
  exito: [["sine", 784, 784, 0.12, 0.26], ["sine", 1046, 1046, 0.14, 0.24, 0.09], ["sine", 1568, 1568, 0.22, 0.2, 0.18]],
  // Fase 20 · menús con transiciones y la pareja
  brillo: [["sine", 385, 700, 0.06, 0.2], ["triangle", 659, 659, 0.3, 0.14, 0.02], ["triangle", 880, 880, 0.3, 0.12, 0.08]],
  // Fase 23: el cajón de recursos hace «plop» con un acorde tibio (ya no brillitos).
  "abrir-recursos": [["sine", 150, 90, 0.07, 0.3, 0.1], ["sine", 350, 640, 0.065, 0.28, 0.1], ["triangle", 523, 523, 0.4, 0.16, 0.13], ["triangle", 784, 784, 0.4, 0.1, 0.165]],
  giro: [["triangle", 320, 760, 0.16, 0.2], ["sine", 980, 1260, 0.09, 0.1, 0.12]],
  sobre: [["triangle", 520, 280, 0.12, 0.22], ["sine", 1180, 940, 0.07, 0.1, 0.11], ["sine", 1568, 1568, 0.12, 0.08, 0.2]],
  latido: [["sine", 96, 58, 0.13, 0.7], ["sine", 88, 52, 0.15, 0.55, 0.19]],
  campanas: [["sine", 523, 523, 0.55, 0.2], ["sine", 659, 659, 0.55, 0.18, 0.09], ["sine", 784, 784, 0.6, 0.18, 0.18], ["sine", 1046, 1046, 0.8, 0.18, 0.27], ["sine", 2093, 2093, 0.5, 0.05, 0.27]],
  separar: [["triangle", 700, 220, 0.24, 0.22], ["sine", 300, 180, 0.2, 0.18, 0.08]],
  tecla: [["sine", 1400, 1300, 0.03, 0.12]],
  // Fase 22 (por si falta su archivo): copitas de cristal.
  "reaccion-te-amo": [["sine", 1046, 1046, 0.9, 0.16], ["sine", 1318, 1318, 0.9, 0.14, 0.07], ["sine", 1568, 1568, 1, 0.13, 0.14], ["sine", 2093, 2093, 1.1, 0.1, 0.21]],
  "reaccion-me-encanto": [["sine", 2093, 2093, 0.3, 0.1], ["sine", 2349, 2349, 0.3, 0.1, 0.04], ["sine", 2637, 2637, 0.3, 0.1, 0.08], ["sine", 3136, 3136, 0.4, 0.09, 0.12], ["sine", 1318, 1318, 0.8, 0.1, 0.2]],
  "reaccion-llore": [["sine", 1900, 950, 0.08, 0.14], ["sine", 1760, 1730, 1.1, 0.16, 0.05], ["sine", 880, 880, 1.2, 0.08, 0.3]],
  "reaccion-abrazo": [["sine", 523, 523, 1.2, 0.14], ["sine", 784, 784, 1.2, 0.12], ["sine", 2093, 2093, 0.6, 0.08, 0.36]],
  "reaccion-beso": [["sine", 2637, 2637, 0.4, 0.12, 0.02], ["sine", 3520, 3520, 0.45, 0.1, 0.09]],
  "reaccion-risa": [["sine", 2093, 2093, 0.2, 0.1], ["sine", 2637, 2637, 0.2, 0.1, 0.07], ["sine", 2349, 2349, 0.2, 0.1, 0.14], ["sine", 3136, 3136, 0.3, 0.1, 0.21]],
  "reaccion-quitar": [["sine", 1568, 1170, 0.4, 0.12]],
  "mensaje-enviar": [["sine", 440, 440, 0.12, 0.14], ["sine", 587, 587, 0.3, 0.15, 0.06]],
  "mensaje-llega": [["sine", 740, 740, 0.25, 0.16], ["sine", 587, 587, 0.35, 0.16, 0.13]],
  "sticker-pegar": [["sine", 180, 90, 0.08, 0.2], ["sine", 980, 980, 0.06, 0.08, 0.02]],
  coleccion: [["triangle", 520, 1046, 0.2, 0.12], ["sine", 1318, 1318, 0.5, 0.1, 0.16], ["sine", 1568, 1568, 0.5, 0.09, 0.23]],
  "detallito-abrir": [["triangle", 700, 1400, 0.14, 0.1], ["sine", 1568, 1568, 0.6, 0.12, 0.12]],
  gatito: [["sawtooth", 62, 58, 0.7, 0.05], ["sawtooth", 60, 64, 0.7, 0.045, 0.8]],
};

const ALIAS = { "cerrar-recursos": "soltar", "seleccionar-varios": "seleccionar", rehacer: "deshacer", pincel: "arrastrar", publicar: "exito", "zoom-paso": "ajustar" };

function leerPref() {
  try { return { on: true, vol: 0.35, max: 3, ...JSON.parse(localStorage.getItem(PREF) || "{}") }; } catch (e) { return { on: true, vol: 0.35, max: 3 }; }
}

export class SonidosEditor {
  constructor(audio) {
    this.audio = audio;
    this.pref = leerPref();
    this.lista = {};
    this.buffers = new Map();
    this.ultimo = {};
    this.cuando = {};
    this.voces = 0;
    this.listo = extras().then((ex) => { this.lista = ex.sonidos || {}; }).catch(() => {});
  }

  get hay() { return Object.keys(this.lista).length > 0; }
  /** ¿Ese momento tiene archivo (tuyo o de fábrica) en assets/sonidos-editor/? */
  tiene(momento) { return !!this._de(momento)?.length; }
  /** Los archivos de un momento: su carpeta de CARPETA o, como antes, la carpeta con su nombre. */
  _de(momento) { return this.lista[ARCHIVO[momento]] || this.lista[CARPETA[momento]] || this.lista[momento]; }
  get momentos() { return Object.keys(this.lista); }

  ponerPref(c) {
    this.pref = { ...this.pref, ...c };
    try { localStorage.setItem(PREF, JSON.stringify(this.pref)); } catch (e) { /* nada */ }
  }

  async _buffer(url) {
    let b = this.buffers.get(url);
    if (b) return b;
    const ac = this.audio.ac;
    if (!ac) return null;
    b = fetch(url).then((r) => r.arrayBuffer()).then((d) => new Promise((ok, mal) => { const p = ac.decodeAudioData(d, ok, mal); if (p?.then) p.then(ok, mal); })).catch(() => null);
    this.buffers.set(url, b);
    return b;
  }

  /** Suena un momento («botones», «guardar»…). Si es «botones», espera un pelito por si llega uno más importante. */
  sonar(momento, op = {}) {
    if (!this.pref.on) return;
    if (SUAVES.has(momento)) {
      clearTimeout(this._boton);
      this._boton = setTimeout(() => { if (performance.now() - (this._fuerte || 0) > 160) this._tocar(momento, op); }, 28);
      return;
    }
    clearTimeout(this._boton);
    this._fuerte = performance.now();
    this._tocar(momento, op);
  }

  _tocar(momento, op) {
    if (COMBO.has(momento) && op.tono == null) {
      const c = this._combo ||= {}, ahora = performance.now(), k = c[momento];
      const paso = k && ahora - k.t < 1400 ? Math.min(ESCALA.length - 1, k.i + 1) : 0;
      c[momento] = { i: paso, t: ahora };
      op = { ...op, tono: ESCALA[paso] };
    }
    if (this._de(momento)?.length) this._sonar(momento, op);
    else if (SINTE[momento] || SINTE[ALIAS[momento]]) this._sintetizar(SINTE[momento] ? momento : ALIAS[momento], op);
  }

  /** Acercar o alejar la hoja (botones, rueda o dos dedos): un barrido al empezar y un «tin» por cada escalón, más agudo cuanto más cerca. */
  zoomCambio(z0, z1) {
    if (!this.pref.on || !(z0 > 0) || !(z1 > 0) || Math.abs(z1 - z0) < 1e-4) return;
    const ahora = performance.now(), nivel = Math.round(Math.log(z1) / Math.log(1.18));
    if (ahora - (this._zt || 0) > 420) { this._zDir = 0; this._zNivel = Math.round(Math.log(z0) / Math.log(1.18)); }
    this._zt = ahora;
    const dir = Math.sign(z1 - z0);
    if (dir && dir !== this._zDir) { this._zDir = dir; this.sonar(dir > 0 ? "zoom-acercar" : "zoom-alejar"); }
    if (nivel !== this._zNivel) {
      this._zNivel = nivel;
      this.sonar("zoom-paso", { tono: Math.max(0.6, Math.min(1.9, Math.pow(1.06, nivel))), vol: 0.8 });
    }
  }

  /** Por donde pasan todos: un limitador suave hacia la mezcla general. */
  _bus() {
    const ac = this.audio.ac;
    if (this._b?.context === ac) return this._b;
    const c = ac.createDynamicsCompressor();
    c.threshold.value = -14; c.knee.value = 8; c.ratio.value = 10; c.attack.value = 0.002; c.release.value = 0.12;
    c.connect(this.audio.general);
    this._b = c;
    return c;
  }

  /** MusicaDev se hace un poquito a un lado mientras suena (y vuelve sola al terminar el último). */
  _agachar(dur) {
    if (!this.audio.agachar) return;
    const ahora = performance.now();
    this._finAg = Math.max(this._finAg || 0, ahora + dur * 1000);
    this.audio.agachar("sfx", true, AGACHAR);
    clearTimeout(this._tAg);
    this._tAg = setTimeout(() => this.audio.agachar("sfx", false), this._finAg - ahora + 140);
  }

  /** La voz de la abejita: un sonido de assets/sonidos-editor/abeja/ o un «bzz-pip» hecho aquí mismo. */
  voz() {
    if (!this.pref.on) return;
    if (this.lista.abeja?.length) { this._sonar("abeja"); return; }
    if (this.tiene("abeja-habla")) { this._sonar("abeja-habla"); return; }
    const ac = this.audio.ac;
    if (!ac || ac.state !== "running") return;
    const t = ac.currentTime, vol = Math.max(0, Math.min(1, this.pref.vol)) * 0.45;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain();
    const f0 = 600 + Math.random() * 180;
    o.type = "triangle";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.07);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.25, t + 0.2);
    lfo.frequency.value = 36; lg.gain.value = f0 * 0.05; // el zumbido
    lfo.connect(lg).connect(o.frequency);
    o.connect(g).connect(this._bus());
    this._agachar(0.24);
    o.start(t); lfo.start(t); o.stop(t + 0.24); lfo.stop(t + 0.24);
    o.onended = () => { try { g.disconnect(); lg.disconnect(); } catch (e) { /* nada */ } };
  }

  /** Un sonidito digital hecho con osciladores (sin archivos). */
  _sintetizar(momento, op = {}) {
    const ahora = performance.now();
    if (ahora - (this.cuando[momento] || 0) < (MIN[momento] ?? 80)) return;
    if (this.voces >= Math.max(1, this.pref.max | 0)) return;
    const ac = this.audio.ac;
    if (!ac || ac.state !== "running") return;
    this.cuando[momento] = ahora;
    const t0 = ac.currentTime, vol = Math.max(0, Math.min(1, this.pref.vol));
    // Nunca dos iguales seguidos: un pelín de tono distinto cada vez.
    const k = (op.tono || 1) * (0.985 + Math.random() * 0.03);
    let fin = 0;
    this.voces++;
    for (let [forma, f0, f1, dur, v, ret = 0] of SINTE[momento]) {
      const t = t0 + ret, o = ac.createOscillator(), g = ac.createGain();
      // Fase 25: tonos redondos (burbuja y copa); lo áspero se vuelve triangular, siempre filtrado y suave.
      o.type = forma === "sine" ? "sine" : "triangle";
      o.frequency.setValueAtTime(f0 * k, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * k), t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v * vol, t + Math.min(0.006, dur / 4));
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 5200; lp.Q.value = 0.5;
      o.connect(lp).connect(g).connect(this._bus());
      o.start(t); o.stop(t + dur + 0.02);
      o.onended = () => { try { g.disconnect(); } catch (e) { /* nada */ } };
      fin = Math.max(fin, ret + dur);
    }
    this._agachar(fin);
    setTimeout(() => { this.voces = Math.max(0, this.voces - 1); }, fin * 1000 + 30);
  }

  async _sonar(momento, op = {}) {
    const l = this._de(momento);
    const ahora = performance.now();
    if (ahora - (this.cuando[momento] || 0) < (MIN[momento] ?? 80)) return;
    if (this.voces >= Math.max(1, this.pref.max | 0)) return;
    const ac = this.audio.ac;
    if (!ac || ac.state !== "running") return;
    this.cuando[momento] = ahora;
    let i = Math.floor(Math.random() * l.length);
    if (l.length > 1 && i === this.ultimo[momento]) i = (i + 1 + Math.floor(Math.random() * (l.length - 1))) % l.length;
    this.ultimo[momento] = i;
    const b = await this._buffer(rutaAUrl(l[i]));
    if (!b || this.voces >= Math.max(1, this.pref.max | 0)) return;
    const src = ac.createBufferSource();
    src.buffer = b;
    const rate = (op.tono || 1) * (0.985 + Math.random() * 0.03);
    src.playbackRate.value = rate;
    const g = ac.createGain();
    const t = ac.currentTime;
    const vol = Math.max(0, Math.min(1, this.pref.vol)) * (op.vol ?? 1) * (0.9 + Math.random() * 0.14);
    const dur = b.duration / rate;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setValueAtTime(vol, t + Math.max(0.012, dur - 0.035));
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(g).connect(this._bus());
    this._agachar(dur);
    this.voces++;
    src.onended = () => { this.voces = Math.max(0, this.voces - 1); try { g.disconnect(); } catch (e) { /* nada */ } };
    src.start(t);
  }

  /** Engancha los momentos del editor (sin tocar cada botón uno por uno). */
  conectar(app) {
    const E = app.estado;
    // Botones, piezas, pestañas y menús (no lo que pasa dentro de la hoja ni al escribir).
    document.addEventListener("click", (ev) => {
      const b = ev.target.closest?.("button, .ed-pieza, [role=menuitem], summary, .ed-asset, .ed-comp, label.ed-fila");
      if (!b || b.disabled || ev.target.closest(".ed-vista, input, textarea, select, .ed-tl-cuerpo")) return;
      // Interruptores: suena cómo QUEDAN (encendido o apagado), ya cambiados.
      if (b.matches(".ed-toggle")) { setTimeout(() => this.sonar(b.classList.contains("on") ? "activar" : "desactivar"), 0); return; }
      // «Atrás» / «Cancelar» de las ventanas y vistas previas: suena a volver (y no además a cerrar).
      if (b.matches(".ed-hojita-pie .ed-btn:not(.primario), .ed-modal footer .ed-btn:not(.primario):not(.peligro)")) { this._tAtras = performance.now(); this.sonar("atras"); return; }
      // Las herramientas (el riel, la barrita de la línea de tiempo) suenan distinto.
      if (b.closest(".ed-riel")) { setTimeout(() => { if (performance.now() - (this._tRec || 0) > 250) this.sonar("herramienta"); }, 0); return; }
      this.sonar(b.closest(".ed-tl-herr") ? "herramienta" : "botones");
    }, true);
    // El botón «atrás» del teléfono (o del navegador).
    addEventListener("popstate", () => { this._tAtras = performance.now(); this.sonar("atras"); });
    addEventListener("ed-menu-abierto", () => this.sonar("menu"));
    const S = this, envolver = (obj, k, momento, cuando) => {
      const f = obj?.[k];
      if (typeof f !== "function") return;
      obj[k] = function (...a) { if (!cuando || cuando(...a)) S.sonar(momento); return f.apply(obj, a); };
    };
    // Ajustar un deslizador: un «tic» muy suave (con tope: no ametralla).
    document.addEventListener("input", (ev) => { if (ev.target.matches?.("input[type=range]") && !ev.target.closest(".ed-tl")) this.sonar("ajustar"); }, true);
    let antes = "";
    E.on("sel", () => { const k = E.sel.join(","); if (k && k !== antes) this.sonar(E.sel.length > 1 ? "seleccionar-varios" : "seleccionar"); else if (!k && antes) this.sonar("deseleccionar"); antes = k; });
    // Paneles y hojas: abrir, cerrar, bajar a una parada más chica (minimizar) o volver a subir (restaurar).
    addEventListener("ed-hoja", (ev) => {
      if (ev.detail === "cerrar" && performance.now() - (this._tAtras || 0) < 300) return; // ya sonó «atrás»
      if (ev.detail === "abrir" && performance.now() - (this._tProbar || 0) < 300) return; // ya sonó «probar»
      if (!["abrir", "cerrar", "minimizar", "restaurar"].includes(ev.detail)) return;
      // Un instante después: si la que se movió fue la hojita de recursos, ya sonó la suya.
      setTimeout(() => { if (performance.now() - (this._tRec || 0) > 250) this.sonar(ev.detail); }, 0);
    });
    // El menú de recursos (Elementos, Stickers, Efectos, GIFs…): al sacarlo y al guardarlo, su propio sonido,
    // venga de donde venga (el riel, el cajón del teléfono que sigue al dedo, su hojita, la X o «atrás»).
    const B = document.body.classList, hs = document.querySelector(".ed-hoja-sec");
    // La hojita cuenta como guardada desde que empieza a bajar (no cuando termina).
    const fuera = () => (B.contains("con-hoja-sec") && !hs?.classList.contains("cerrando")) || (app.lateral?.compacto ? !!app.lateral.abierto : !B.contains("sin-panel"));
    // Lo que cambie al arrancar (antes de tocar nada) no suena: sólo lo que hace ella.
    let estaba = false, toco = false;
    const marcar = () => { if (!toco) { toco = true; estaba = fuera(); } };
    addEventListener("pointerdown", marcar, true);
    addEventListener("keydown", marcar, true);
    const obs = new MutationObserver(() => {
      const ahora = fuera();
      if (ahora === estaba) return;
      estaba = ahora;
      if (!toco) return;
      if (document.querySelector(".ed-prueba, .ed-modal-fondo")) return;
      this._tRec = performance.now();
      this.sonar(ahora ? "abrir-recursos" : "cerrar-recursos");
    });
    for (const n of [document.body, hs]) if (n) obs.observe(n, { attributes: true, attributeFilter: ["class"] });
    addEventListener("ed-color", () => this.sonar("colorear"));
    addEventListener("ed-aviso", (ev) => { if (ev.detail === "error") this.sonar("error"); });
    // Mover, girar, cambiar tamaño, la línea de tiempo…: uno al empezar (según el gesto) y otro al soltar.
    const INICIO = { Girar: "rotar", "Cambiar tamaño": "redimensionar", "Escalar grupo": "redimensionar", Pellizcar: "redimensionar", "Acercar foto": "zoom", Borrador: null };
    const gesto = E.gesto.bind(E);
    E.gesto = (nombre) => {
      const m = nombre in INICIO ? INICIO[nombre] : "arrastrar";
      if (m) this.sonar(m);
      const fin = gesto(nombre);
      return (guardar = true) => { if (guardar && m) this.sonar("soltar"); return fin(guardar); };
    };
    // Organizar, páginas, animaciones y efectos (una vez por acción, nunca por cuadro).
    envolver(app.acciones, "agrupar", "agrupar");
    envolver(app.acciones, "desagrupar", "desagrupar");
    envolver(app.acciones, "capa", "capas");
    const pag = () => { this._pag = performance.now(); return true; };
    envolver(app.acciones, "nuevaPagina", "pagina", pag);
    envolver(E, "duplicarPagina", "pagina-duplicar", pag);
    envolver(E, "irPagina", "pagina-cambiar", (pid) => pid !== E.paginaId && performance.now() - (this._pag || 0) > 300);
    envolver(E, "moverPagina", "pagina-reordenar", pag);
    envolver(app.prueba, "abrir", "probar", () => { this._tProbar = performance.now(); return true; });
    const tx = E.transaccion.bind(E);
    E.transaccion = (nombre, ...a) => {
      const m = /^(Animación|Entrada en cascada|Secuencia|Pegar animación)/.test(nombre) ? "animar" : /^Efecto/.test(nombre) ? "efecto"
        : { Bloquear: "bloquear", Desbloquear: "desbloquear", Ocultar: "ocultar", Mostrar: "mostrar", "Borrar página": "pagina-eliminar" }[nombre] || null;
      if (m === "pagina-eliminar") this._pag = performance.now();
      if (m) this.sonar(m);
      return tx(nombre, ...a);
    };
    // Escuchar una canción de la biblioteca: suena «reproducir» o «pausar» (el mismo botón la para).
    const esc = app.audio.escuchar?.bind(app.audio);
    if (esc) app.audio.escuchar = (...a) => { const r = esc(...a); this.sonar(r === false ? "pausar" : "reproducir"); return r; };
    for (const k of ["deshacer", "rehacer"]) {
      const f = E[k].bind(E);
      E[k] = (...a) => { if (k === "deshacer" ? E.historial.puedeDeshacer : E.historial.puedeRehacer) this.sonar(k); return f(...a); };
    }
    const quitar = E.quitarEls.bind(E);
    E.quitarEls = (...a) => { this.sonar("borrar"); return quitar(...a); };
  }

  /** La vista de la hoja: desplazarla y escribir (acercar/alejar lo avisa el lienzo: zoomCambio). */
  conectarLienzo(L) {
    const pan = L._panDesde.bind(L);
    L._panDesde = (...a) => { this.sonar("desplazar"); return pan(...a); };
    const txt = L.editarTexto?.bind(L);
    if (txt) L.editarTexto = (...a) => { this.sonar("escribir"); return txt(...a); };
  }
}
