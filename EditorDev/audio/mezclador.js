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
 * Dónde se busca la música del editor: primero la carpeta **DevMusic/** (en
 * la raíz; cualquier canción que dejes ahí, y si hay varias suenan una tras
 * otra), y si no, MusicaDev.mp3 en EditorDev/, «musica assets/» o la raíz.
 */
const RT = window.LibritoRT;
const PREF = "editordev:musicadev";
const CANDIDATAS = ["MusicaDev.mp3", "../musica assets/MusicaDev.mp3", "../MusicaDev.mp3"];
const AUD = /\.(mp3|m4a|ogg|wav|aac)$/i;
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
    this.ondas = new Map();    // url → { picos, dur, svg } (la onda de cada pista)
    this._sonando = [];        // las pistas de la línea de tiempo que suenan ahora
    this.listo = this._buscar();
    // El primer toque desbloquea el sonido (y arranca MusicaDev).
    this._toque = () => this._desbloquear();
    addEventListener("pointerdown", this._toque, true);
    addEventListener("keydown", this._toque, true);
    addEventListener("touchend", this._toque, true); // iPhone: el gesto que de verdad desbloquea
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
    // 1) MusicaDev.mp3 (la de siempre). 2) Lo que haya en DevMusic/ suena después, en orden al azar.
    for (const c of CANDIDATAS) {
      const u = new URL(c, location.href).href;
      try {
        const r = await fetch(u, { method: "HEAD", cache: "no-store" });
        if (r.ok && !/text\/html/.test(r.headers.get("content-type") || "")) { this.url = u; break; }
      } catch (e) { /* sigue buscando */ }
    }
    try {
      const { catalogo, listar } = await import("../componentes/catalogo.js");
      let lista = ((await catalogo()).devMusic || []).map((m) => m.ruta);
      if (!lista.length) lista = ((await listar("DevMusic/")) || []).filter((f) => AUD.test(f)).map((f) => "DevMusic/" + f);
      const extra = lista.map((r) => new URL("../" + r.split("/").map(encodeURIComponent).join("/"), location.href).href);
      if (extra.length) { this.lista = [...new Set([this.url, ...extra].filter(Boolean))]; this.url = this.url || this.lista[0]; }
    } catch (e) { /* sólo MusicaDev */ }
    this._avisar();
    // Intenta empezar ya (si el navegador lo permite); si no, empieza con el primer toque.
    this._desbloquear();
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
      removeEventListener("touchend", this._toque, true);
    }
  }

  _arrancarDev() {
    if (!this.ac || !this.url || !this.pref.on || this._pausaVista) return;
    if (!this.dev) {
      const audio = new Audio();
      const varias = (this.lista?.length || 0) > 1;
      audio.loop = !varias;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = this.url;
      // Varias canciones en DevMusic/: una tras otra, sin repetir la misma seguida.
      if (varias) audio.addEventListener("ended", () => {
        const l = this.lista, i = l.indexOf(audio.src);
        let j = Math.floor(Math.random() * l.length);
        if (j === i) j = (j + 1) % l.length;
        audio.src = this.url = l[j];
        if (this.pref.on && !this._pausaVista && !document.hidden) audio.play().catch(() => {});
      });
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
  /* ── Pistas de audio de la página (línea de tiempo) ──────────────── */
  /** Cuánto dura un archivo (ms), si ya se sabe. */
  duracionDe(url) { return url ? this.ondas.get(url)?.dur || null : null; }

  /** La onda como imagen (dirección blob: de un SVG), si ya está. */
  ondaUrl(url) { return url ? this.ondas.get(url)?.svg || null : null; }

  /**
   * Calcula la onda de un archivo (una vez): decodifica, saca 40 picos por
   * segundo y suelta el audio decodificado (no se guarda en memoria).
   */
  onda(url) {
    if (!url) return Promise.reject(new Error("sin archivo"));
    const ya = this.ondas.get(url);
    if (ya) return ya.promesa || Promise.resolve(ya);
    const o = { picos: null, dur: null, svg: null };
    o.promesa = (async () => {
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const r = await fetch(url);
      const datos = await r.arrayBuffer();
      if (datos.byteLength > 40 * 1024 * 1024 || !AC) throw new Error("muy grande");
      const ctx = this.ac || new AC(1, 2, 44100);
      const b = await new Promise((ok, mal) => { const p = ctx.decodeAudioData(datos, ok, mal); if (p?.then) p.then(ok, mal); });
      o.dur = Math.round(b.duration * 1000);
      const n = Math.max(8, Math.min(12000, Math.round(b.duration * 40)));
      const picos = new Float32Array(n);
      const canales = [];
      for (let c = 0; c < Math.min(2, b.numberOfChannels); c++) canales.push(b.getChannelData(c));
      const paso = Math.max(1, Math.floor(b.length / n));
      let max = 0.0001;
      for (let i = 0; i < n; i++) {
        let m = 0;
        const ini = i * paso, fin = Math.min(b.length, ini + paso);
        for (const d of canales) for (let j = ini; j < fin; j += 16) { const v = Math.abs(d[j]); if (v > m) m = v; }
        picos[i] = m;
        if (m > max) max = m;
      }
      for (let i = 0; i < n; i++) picos[i] = Math.sqrt(picos[i] / max);
      o.picos = picos;
      let d = "M0 50";
      for (let i = 0; i < n; i++) d += `L${i} ${(50 - picos[i] * 46).toFixed(1)}`;
      for (let i = n - 1; i >= 0; i--) d += `L${i} ${(50 + picos[i] * 46).toFixed(1)}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} 100" preserveAspectRatio="none"><path d="${d}Z" fill="#e0558e" fill-opacity=".5"/></svg>`;
      o.svg = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      delete o.promesa;
      return o;
    })().catch((e) => { delete o.promesa; o.dur = o.dur || null; throw e; });
    this.ondas.set(url, o);
    return o.promesa;
  }

  /**
   * Hace sonar varias pistas desde el instante `desde` (ms de la página):
   * cada una empieza a su hora, desde su recorte, con su volumen y un
   * fundido corto al entrar y al salir. `solo` = sólo ésas (para escuchar una).
   */
  pistas(lista, desde = 0, solo = false) {
    this.pararPistas();
    if (!this.ac) this._desbloquear();
    const t0 = performance.now() - desde;
    for (const p of lista) {
      if (!p.url) continue;
      const dur = p.dur || (this.duracionDe(p.url) ? this.duracionDe(p.url) - (p.desde || 0) : null);
      const fin = dur != null ? p.inicio + dur : Infinity;
      if (fin <= desde) continue;
      const s = { relojes: [], audio: null, gain: null };
      const arrancar = () => {
        const ahora = performance.now() - t0;
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.loop = !!p.bucle;
        audio.src = p.url;
        const dentro = Math.max(0, ahora - p.inicio);
        try { audio.currentTime = ((p.desde || 0) + (p.bucle && this.duracionDe(p.url) ? dentro % Math.max(1, this.duracionDe(p.url) - (p.desde || 0)) : dentro)) / 1000; } catch (e) { /* nada */ }
        let gain = null;
        if (this.ac) {
          gain = this.ac.createGain();
          gain.gain.value = 0;
          try { this.ac.createMediaElementSource(audio).connect(gain); } catch (e) { /* nada */ }
          gain.connect(this.general);
          gain.gain.setTargetAtTime(Math.max(0, Math.min(1, p.vol ?? 0.9)), this.ac.currentTime, 0.06);
        } else audio.volume = Math.max(0, Math.min(1, p.vol ?? 0.9));
        s.audio = audio; s.gain = gain;
        audio.play().catch(() => {});
        if (fin !== Infinity) s.relojes.push(setTimeout(() => this._apagar(s), Math.max(0, fin - (performance.now() - t0))));
      };
      s.relojes.push(setTimeout(arrancar, Math.max(0, p.inicio - desde)));
      this._sonando.push(s);
    }
    if (this._sonando.length) this.agachar("pista#varias", true);
    void solo;
  }

  _apagar(s) {
    for (const r of s.relojes) clearTimeout(r);
    s.relojes = [];
    const a = s.audio;
    if (!a) return;
    if (s.gain && this.ac) {
      const t = this.ac.currentTime;
      s.gain.gain.cancelScheduledValues(t);
      s.gain.gain.setValueAtTime(s.gain.gain.value, t);
      s.gain.gain.linearRampToValueAtTime(0, t + 0.18);
      setTimeout(() => { a.pause(); a.removeAttribute("src"); }, 220);
    } else a.pause();
    s.audio = null;
  }

  pararPistas() {
    const hay = this._sonando.length;
    for (const s of this._sonando) this._apagar(s);
    this._sonando = [];
    if (hay) this.agachar("pista#varias", false);
  }
}
