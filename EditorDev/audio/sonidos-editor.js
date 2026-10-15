/**
 * LOS SONIDOS DEL EDITOR — los de assets/sonidos-editor/<momento>/.
 *
 *   botones · seleccionar · abrir · cerrar · arrastrar · soltar · guardar ·
 *   deshacer · borrar · error · exito   (y cualquier carpeta nueva que se use)
 *
 * Para que no se sienta robótico:
 *   · cada vez se elige uno al azar de su carpeta, sin repetir el último;
 *   · cada uno suena con un tono y un volumen un poquito distintos;
 *   · entra y sale con un fundido de milisegundos (nada de chasquidos);
 *   · el mismo momento no se repite enseguida y nunca suenan más de unos
 *     pocos a la vez (se puede elegir cuántos).
 * Van por la misma mezcla que MusicaDev (Web Audio), sin bajarla.
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
// Lo mínimo entre dos sonidos del mismo momento (ms): sin metralletas.
const MIN = { botones: 70, seleccionar: 90, arrastrar: 160, soltar: 120, abrir: 140, cerrar: 140, ajustar: 65, herramienta: 90, fotograma: 110, duplicar: 120, colocar: 120 };
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
    if (!this.lista[momento]?.length) { if (SINTE[momento]) this._sintetizar(momento); return; }
    if (momento === "botones") {
      clearTimeout(this._boton);
      this._boton = setTimeout(() => this._sonar("botones"), 28);
      return;
    }
    clearTimeout(this._boton);
    this._sonar(momento);
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
    o.connect(g).connect(this.audio.general);
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
      o.connect(g).connect(this.audio.general);
      o.start(t); o.stop(t + dur + 0.02);
      o.onended = () => { try { g.disconnect(); } catch (e) { /* nada */ } };
      fin = Math.max(fin, ret + dur);
    }
    setTimeout(() => { this.voces = Math.max(0, this.voces - 1); }, fin * 1000 + 30);
  }

  async _sonar(momento) {
    const l = this.lista[momento];
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
    src.connect(g).connect(this.audio.general);
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
    // Ajustar un deslizador: un «tic» muy suave (con tope: no ametralla).
    document.addEventListener("input", (ev) => { if (ev.target.matches?.("input[type=range]") && !ev.target.closest(".ed-tl")) this.sonar("ajustar"); }, true);
    let antes = "";
    E.on("sel", () => { const k = E.sel.join(","); if (k && k !== antes) this.sonar("seleccionar"); antes = k; });
    addEventListener("ed-hoja", (ev) => this.sonar(ev.detail === "abrir" ? "abrir" : "cerrar"));
    addEventListener("ed-aviso", (ev) => { if (ev.detail === "error") this.sonar("error"); });
    // Mover, cambiar tamaño, girar, la línea de tiempo…: al empezar y al soltar.
    const gesto = E.gesto.bind(E);
    E.gesto = (nombre) => {
      this.sonar("arrastrar");
      const fin = gesto(nombre);
      return (guardar = true) => { if (guardar) this.sonar("soltar"); return fin(guardar); };
    };
    for (const k of ["deshacer", "rehacer"]) {
      const f = E[k].bind(E);
      E[k] = (...a) => { if (k === "deshacer" ? E.historial.puedeDeshacer : E.historial.puedeRehacer) this.sonar("deshacer"); return f(...a); };
    }
    const quitar = E.quitarEls.bind(E);
    E.quitarEls = (...a) => { this.sonar("borrar"); return quitar(...a); };
  }
}
