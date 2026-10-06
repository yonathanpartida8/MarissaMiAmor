/**
 * EL SONIDO DEL EDITOR
 *
 * Mientras editas suena MusicaDev.mp3 (la música de trabajo del editor), no
 * la música del librito: las canciones que le pongas al proyecto se guardan
 * en él y sólo suenan cuando tú lo pides (▶ en la biblioteca, la vista
 * previa o la línea de tiempo).
 *
 * Todo pasa por aquí y se mezcla:
 *   MusicaDev ─┐
 *   efectos ───┼─► (ganancia general) ─► altavoz
 *   escuchar ──┘
 * Cuando suena algo importante (un efecto, un diálogo, una canción que
 * estás escuchando, un componente que pide silencio), MusicaDev baja sola
 * («ducking») y al terminar vuelve, poco a poco, a su volumen. Siempre con
 * rampas: nada de cortes.
 *
 * El volumen va por Web Audio (GainNode) porque en iPhone `audio.volume`
 * no hace nada. Nada suena hasta el primer toque (los navegadores no dejan).
 *
 * Dónde se busca MusicaDev.mp3: EditorDev/MusicaDev.mp3, «musica assets/»
 * o la raíz del proyecto (la primera que exista).
 */
const RT = window.LibritoRT;
const PREF = "editordev:musicadev";
const CANDIDATAS = ["MusicaDev.mp3", "../musica assets/MusicaDev.mp3", "../MusicaDev.mp3"];
const BAJAR = 0.09;   // constante de tiempo al bajar (s): ~0.3 s
const SUBIR = 0.45;   // al volver: ~1.5 s, gradual
const NIVEL = { efecto: 0.3, escuchar: 0.06, componente: 0.15, vista: 0, pista: 0.12 };

function leerPref() {
  try { return { on: true, vol: 0.45, ...JSON.parse(localStorage.getItem(PREF) || "{}") }; } catch (e) { return { on: true, vol: 0.45 }; }
}

export class AudioEditor {
  constructor(app) {
    this.app = app;
    this.ac = null;
    this.general = null;
    this.dev = null;          // { audio, gain }
    this.pref = leerPref();
    this.motivos = new Map(); // por qué está bajada la música: motivo → nivel
    this.buffers = new Map(); // efectos ya decodificados (los cortos suenan al instante)
    this.escucha = null;      // la canción que se está escuchando (sólo una)
    this.url = null;          // dónde está MusicaDev.mp3 (null = no está)
    this.oyentes = new Set();
    this.listo = this._buscar();
    // El primer toque desbloquea el sonido (y arranca MusicaDev).
    this._toque = () => this._desbloquear();
    addEventListener("pointerdown", this._toque, true);
    addEventListener("keydown", this._toque, true);
    document.addEventListener("visibilitychange", () => this._visibilidad());
    // Todo lo que suena con RT.sonar (inspector, línea de tiempo, componentes) pasa por la mezcla.
    RT.sonar = (url, vol) => this.efecto(url, vol);
    // Los componentes que se prueban en la hoja pueden pedir silencio.
    addEventListener("message", (ev) => {
      const d = ev.data && ev.data.librito;
      if (d === "bajarMusica") this.agachar("componente", true);
      else if (d === "subirMusica") this.agachar("componente", false);
      else if (d && d.sonido) this.efecto(d.sonido, d.volumen);
    });
  }

  /* ── Encontrar MusicaDev.mp3 ─────────────────────────────────────── */
  async _buscar() {
    for (const c of CANDIDATAS) {
      const u = new URL(c, location.href).href;
      try {
        const r = await fetch(u, { method: "HEAD", cache: "no-store" });
        if (r.ok && !/text\/html/.test(r.headers.get("content-type") || "")) { this.url = u; break; }
      } catch (e) { /* sigue buscando */ }
    }
    this._avisar();
    if (this.ac) this._arrancarDev();
    return this.url;
  }

  get disponible() { return !!this.url; }
  get sonando() { return !!(this.dev && !this.dev.audio.paused); }

  /** Quien quiera enterarse de cambios (el panel de Audio). */
  alCambiar(fn) { this.oyentes.add(fn); return () => this.oyentes.delete(fn); }
  _avisar() { for (const f of this.oyentes) { try { f(this); } catch (e) { /* nada */ } } }

  /* ── Desbloquear y arrancar ──────────────────────────────────────── */
  _desbloquear() {
    if (!this.ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.ac = new AC();
          this.general = this.ac.createGain();
          this.general.connect(this.ac.destination);
        }
      } catch (e) { this.ac = null; }
    }
    if (this.ac && this.ac.state === "suspended") this.ac.resume().catch(() => {});
    this._arrancarDev();
    // Sigue escuchando hasta que de verdad suene (iPhone a veces pide un segundo toque).
    if (this.ac && this.ac.state === "running" && (!this.url || !this.pref.on || this.sonando)) {
      removeEventListener("pointerdown", this._toque, true);
      removeEventListener("keydown", this._toque, true);
    }
  }

  _arrancarDev() {
    if (!this.ac || !this.url || !this.pref.on || this._pausaVista) return;
    if (!this.dev) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = this.url;
      const gain = this.ac.createGain();
      gain.gain.value = 0;
      try { this.ac.createMediaElementSource(audio).connect(gain); } catch (e) { /* sin mezcla: suena directo */ }
      gain.connect(this.general);
      this.dev = { audio, gain };
    }
    if (this.dev.audio.paused && !document.hidden) {
      this.dev.audio.play().then(() => { this._nivel(true); this._avisar(); }).catch(() => {});
    } else this._nivel(true);
  }

  /** El volumen que le toca ahora a MusicaDev (con los motivos para bajar). */
  _nivel(entrando) {
    if (!this.dev || !this.ac) return;
    let k = 1;
    for (const v of this.motivos.values()) k = Math.min(k, v);
    const objetivo = this.pref.on ? this.pref.vol * k : 0;
    const g = this.dev.gain.gain, t = this.ac.currentTime;
    const actual = g.value;
    g.cancelScheduledValues(t);
    g.setValueAtTime(actual, t);
    g.setTargetAtTime(objetivo, t, entrando ? 0.6 : objetivo < actual ? BAJAR : SUBIR);
  }

  /** Bajar (o devolver) la música del editor por un motivo; varios motivos se respetan a la vez. */
  agachar(motivo, on, nivel) {
    if (on) this.motivos.set(motivo, nivel ?? NIVEL[motivo.split("#")[0]] ?? 0.25);
    else this.motivos.delete(motivo);
    this._nivel(false);
  }

  _visibilidad() {
    if (!this.dev) return;
    if (document.hidden) this.dev.audio.pause();
    else if (this.pref.on && !this._pausaVista) this.dev.audio.play().catch(() => {});
  }

  /* ── Lo que se puede tocar desde la interfaz ─────────────────────── */
  ponerPref(cambios) {
    this.pref = { ...this.pref, ...cambios };
    try { localStorage.setItem(PREF, JSON.stringify(this.pref)); } catch (e) { /* nada */ }
    if (this.pref.on) this._arrancarDev();
    this._nivel(false);
    if (!this.pref.on && this.dev) setTimeout(() => { if (!this.pref.on) this.dev?.audio.pause(); }, 900);
    this._avisar();
  }

  /** La vista previa del librito tiene su propia música: MusicaDev se calla mientras tanto. */
  pausarParaVista(on) {
    this._pausaVista = on;
    this.agachar("vista", on, 0);
    this.detenerEscucha();
    if (on && this.dev) setTimeout(() => { if (this._pausaVista) this.dev?.audio.pause(); }, 500);
    if (!on) this._arrancarDev();
  }

  /* ── Efectos: cortos, al instante, con «ducking» ─────────────────── */
  async efecto(url, vol = 0.9) {
    if (!url) return null;
    if (!this.ac) this._desbloquear();
    if (!this.ac) return this._efectoSimple(url, vol);
    try {
      let b = this.buffers.get(url);
      if (!b) {
        const r = await fetch(url);
        const datos = await r.arrayBuffer();
        if (datos.byteLength > 6 * 1024 * 1024) return this._efectoLargo(url, vol);
        b = await this.ac.decodeAudioData(datos);
        this.buffers.set(url, b);
        if (this.buffers.size > 30) this.buffers.delete(this.buffers.keys().next().value);
      }
      const src = this.ac.createBufferSource();
      src.buffer = b;
      const g = this.ac.createGain();
      g.gain.value = Math.max(0, Math.min(1, +vol || 0.9));
      src.connect(g).connect(this.general);
      const motivo = "efecto#" + Math.random().toString(36).slice(2);
      this.agachar(motivo, true);
      src.onended = () => this.agachar(motivo, false);
      src.start();
      return src;
    } catch (e) { return this._efectoSimple(url, vol); }
  }

  _efectoLargo(url, vol) {
    const a = new Audio(url);
    a.crossOrigin = "anonymous";
    const g = this.ac.createGain();
    g.gain.value = Math.max(0, Math.min(1, +vol || 0.9));
    try { this.ac.createMediaElementSource(a).connect(g).connect(this.general); } catch (e) { /* nada */ }
    const motivo = "efecto#" + Math.random().toString(36).slice(2);
    this.agachar(motivo, true);
    const fin = () => this.agachar(motivo, false);
    a.addEventListener("ended", fin);
    a.addEventListener("pause", fin);
    a.play().catch(fin);
    return a;
  }

  _efectoSimple(url, vol) {
    try { const a = new Audio(url); a.volume = Math.max(0, Math.min(1, +vol || 0.9)); a.play().catch(() => {}); return a; } catch (e) { return null; }
  }

  /* ── Escuchar una canción de la biblioteca (una a la vez) ────────── */
  escuchar(url, alTerminar) {
    if (this.escucha && this.escucha.url === url) { this.detenerEscucha(); return false; }
    this.detenerEscucha();
    if (!this.ac) this._desbloquear();
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = url;
    let gain = null;
    if (this.ac) {
      gain = this.ac.createGain();
      gain.gain.value = 0;
      try { this.ac.createMediaElementSource(audio).connect(gain); } catch (e) { /* nada */ }
      gain.connect(this.general);
      gain.gain.setTargetAtTime(0.9, this.ac.currentTime, 0.12);
    }
    const e = { url, audio, gain, alTerminar };
    this.escucha = e;
    this.agachar("escuchar", true);
    audio.addEventListener("ended", () => { if (this.escucha === e) this.detenerEscucha(); });
    audio.play().catch(() => { if (this.escucha === e) this.detenerEscucha(); });
    return true;
  }

  /** Para la canción que se escucha (con un fundido cortito). */
  detenerEscucha() {
    const e = this.escucha;
    if (!e) return;
    this.escucha = null;
    this.agachar("escuchar", false);
    if (e.gain && this.ac) {
      const t = this.ac.currentTime;
      e.gain.gain.cancelScheduledValues(t);
      e.gain.gain.setValueAtTime(e.gain.gain.value, t);
      e.gain.gain.linearRampToValueAtTime(0, t + 0.25);
      setTimeout(() => { e.audio.pause(); e.audio.removeAttribute("src"); try { e.audio.load(); } catch (x) { /* nada */ } }, 300);
    } else { e.audio.pause(); }
    e.alTerminar?.();
  }

  get escuchando() { return this.escucha?.url || null; }

  /* ── Pista de la línea de tiempo (la canción de la página, a pedido) ─ */
  pista(url, vol = 0.8, desde = 0) {
    this.pararPista();
    if (!url) return;
    if (!this.ac) this._desbloquear();
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = url;
    let gain = null;
    if (this.ac) {
      gain = this.ac.createGain();
      gain.gain.value = 0;
      try { this.ac.createMediaElementSource(audio).connect(gain); } catch (e) { /* nada */ }
      gain.connect(this.general);
      gain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ac.currentTime, 0.2);
    }
    try { audio.currentTime = desde / 1000; } catch (e) { /* nada */ }
    this._pista = { audio, gain };
    this.agachar("pista", true);
    audio.play().catch(() => {});
  }

  pararPista() {
    const p = this._pista;
    if (!p) return;
    this._pista = null;
    this.agachar("pista", false);
    if (p.gain && this.ac) {
      const t = this.ac.currentTime;
      p.gain.gain.cancelScheduledValues(t);
      p.gain.gain.setValueAtTime(p.gain.gain.value, t);
      p.gain.gain.linearRampToValueAtTime(0, t + 0.3);
    }
    setTimeout(() => { p.audio.pause(); p.audio.removeAttribute("src"); }, 340);
  }
}
