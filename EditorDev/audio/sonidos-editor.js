/**
 * LOS SONIDOS DEL EDITOR — los de assets/sonidos-editor/<categoría>/<acción>/.
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
};
// Los de poca importancia: ceden ante cualquier otro.
const SUAVES = new Set(["botones", "seleccionar", "deseleccionar"]);
// Cuánto se hace a un lado MusicaDev mientras suena un efecto del editor (1 = nada).
const AGACHAR = 0.6;
// Lo mínimo entre dos sonidos del mismo momento (ms): sin metralletas.
const MIN = { botones: 70, seleccionar: 90, deseleccionar: 120, arrastrar: 160, soltar: 120, abrir: 140, cerrar: 140, minimizar: 140, restaurar: 140, ajustar: 65, herramienta: 90, fotograma: 110, duplicar: 120, colocar: 120, desplazar: 400, zoom: 350, rotar: 200, redimensionar: 200, capas: 150, dibujar: 200, borrador: 150, colorear: 150, "pagina-cambiar": 250 };
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
};

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
  /** Los archivos de un momento: su carpeta de CARPETA o, como antes, la carpeta con su nombre. */
  _de(momento) { return this.lista[CARPETA[momento]] || this.lista[momento]; }
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
  sonar(momento) {
    if (!this.pref.on) return;
    if (SUAVES.has(momento)) {
      clearTimeout(this._boton);
      this._boton = setTimeout(() => { if (performance.now() - (this._fuerte || 0) > 160) this._tocar(momento); }, 28);
      return;
    }
    clearTimeout(this._boton);
    this._fuerte = performance.now();
    this._tocar(momento);
  }

  _tocar(momento) {
    if (this._de(momento)?.length) this._sonar(momento);
    else if (SINTE[momento]) this._sintetizar(momento);
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
  _sintetizar(momento) {
    const ahora = performance.now();
    if (ahora - (this.cuando[momento] || 0) < (MIN[momento] ?? 80)) return;
    if (this.voces >= Math.max(1, this.pref.max | 0)) return;
    const ac = this.audio.ac;
    if (!ac || ac.state !== "running") return;
    this.cuando[momento] = ahora;
    const t0 = ac.currentTime, vol = Math.max(0, Math.min(1, this.pref.vol));
    // Nunca dos iguales seguidos: un pelín de tono distinto cada vez.
    const k = 0.96 + Math.random() * 0.08;
    let fin = 0;
    this.voces++;
    for (const [forma, f0, f1, dur, v, ret = 0] of SINTE[momento]) {
      const t = t0 + ret, o = ac.createOscillator(), g = ac.createGain();
      o.type = forma;
      o.frequency.setValueAtTime(f0 * k, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * k), t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v * vol, t + Math.min(0.006, dur / 4));
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g).connect(this._bus());
      o.start(t); o.stop(t + dur + 0.02);
      o.onended = () => { try { g.disconnect(); } catch (e) { /* nada */ } };
      fin = Math.max(fin, ret + dur);
    }
    this._agachar(fin);
    setTimeout(() => { this.voces = Math.max(0, this.voces - 1); }, fin * 1000 + 30);
  }

  async _sonar(momento) {
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
    const rate = 0.965 + Math.random() * 0.07;
    src.playbackRate.value = rate;
    const g = ac.createGain();
    const t = ac.currentTime;
    const vol = Math.max(0, Math.min(1, this.pref.vol)) * (0.86 + Math.random() * 0.2);
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
      // Las herramientas (el riel, la barrita de la línea de tiempo) suenan distinto.
      this.sonar(b.closest(".ed-riel, .ed-tl-herr") ? "herramienta" : "botones");
    }, true);
    const S = this, envolver = (obj, k, momento, cuando) => {
      const f = obj?.[k];
      if (typeof f !== "function") return;
      obj[k] = function (...a) { if (!cuando || cuando(...a)) S.sonar(momento); return f.apply(obj, a); };
    };
    // Ajustar un deslizador: un «tic» muy suave (con tope: no ametralla).
    document.addEventListener("input", (ev) => { if (ev.target.matches?.("input[type=range]") && !ev.target.closest(".ed-tl")) this.sonar("ajustar"); }, true);
    let antes = "";
    E.on("sel", () => { const k = E.sel.join(","); if (k && k !== antes) this.sonar("seleccionar"); else if (!k && antes) this.sonar("deseleccionar"); antes = k; });
    // Paneles y hojas: abrir, cerrar, bajar a una parada más chica (minimizar) o volver a subir (restaurar).
    addEventListener("ed-hoja", (ev) => { if (["abrir", "cerrar", "minimizar", "restaurar"].includes(ev.detail)) this.sonar(ev.detail); });
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
    const tx = E.transaccion.bind(E);
    E.transaccion = (nombre, ...a) => {
      const m = /^(Animación|Entrada en cascada|Secuencia|Pegar animación)/.test(nombre) ? "animar" : /^Efecto/.test(nombre) ? "efecto" : null;
      if (m) this.sonar(m);
      return tx(nombre, ...a);
    };
    // Escuchar una canción de la biblioteca: suena «reproducir» o «pausar» (el mismo botón la para).
    const esc = app.audio.escuchar?.bind(app.audio);
    if (esc) app.audio.escuchar = (...a) => { const r = esc(...a); this.sonar(r === false ? "pausar" : "reproducir"); return r; };
    for (const k of ["deshacer", "rehacer"]) {
      const f = E[k].bind(E);
      E[k] = (...a) => { if (k === "deshacer" ? E.historial.puedeDeshacer : E.historial.puedeRehacer) this.sonar("deshacer"); return f(...a); };
    }
    const quitar = E.quitarEls.bind(E);
    E.quitarEls = (...a) => { this.sonar("borrar"); return quitar(...a); };
  }

  /** La vista de la hoja: acercar/alejar (una vez por tanda) y desplazarla. */
  conectarLienzo(L) {
    const zoom = L.zoom.bind(L);
    L.zoom = (...a) => { const t = performance.now(); if (t - (this._tz || 0) > 350) this.sonar("zoom"); this._tz = t; return zoom(...a); };
    const pan = L._panDesde.bind(L);
    L._panDesde = (...a) => { this.sonar("desplazar"); return pan(...a); };
  }
}
