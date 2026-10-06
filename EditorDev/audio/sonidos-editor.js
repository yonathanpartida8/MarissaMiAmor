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
 */
import { extras } from "../recursos/extras.js";
import { rutaAUrl } from "../assets/biblioteca.js";

const PREF = "editordev:sonidos";
// Lo mínimo entre dos sonidos del mismo momento (ms): sin metralletas.
const MIN = { botones: 70, seleccionar: 90, arrastrar: 160, soltar: 120, abrir: 140, cerrar: 140 };

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
    if (!this.pref.on || !this.lista[momento]?.length) return;
    if (momento === "botones") {
      clearTimeout(this._boton);
      this._boton = setTimeout(() => this._sonar("botones"), 28);
      return;
    }
    clearTimeout(this._boton);
    this._sonar(momento);
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
      this.sonar("botones");
    }, true);
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
