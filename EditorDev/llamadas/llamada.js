/**
 * LLAMADAS Y VIDEOLLAMADAS (Fase 44) — como en WhatsApp, sólo entre ustedes dos.
 *
 *   · tocas 📞 o 🎥 en Mensajitos y a tu amorcito le suena: en la app (con su tonito y vibración) o,
 *     con la app cerrada, con una notificación que se queda hasta que la toque
 *   · la voz y el video van DIRECTO de teléfono a teléfono (WebRTC, cifrado); el servidor sólo los
 *     presenta. Buena calidad: hasta 720p a 30 cuadros (2.5 Mbps) y voz HD (Opus) con cancelación de
 *     eco, supresión de ruido y volumen automático; si la red se pone mala baja sola, y luego vuelve
 *   · en la llamada: su video grande y el tuyo chiquito (arrástralo a cualquier esquina; tócalo para
 *     cambiarlos), el tiempo, silenciar, cámara, voltear la cámara, efectos ✨ y colgar. Tocar la
 *     pantalla esconde o enseña los botones; ⌄ la hace chiquita para seguir en el chat
 *   · si cambias de red (wifi → datos) se reconecta sola; la pantalla no se apaga en la videollamada
 *   · efectos (efectos.js): los del teléfono si los presta, suavizar, fondo borroso y el
 *     teletransporte de Goku (dos dedos en la frente 3 segundos)
 */
import { el, aviso } from "../components/ui.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "../components/perfil.js";
import { Efectos, nativos, ponerNativo } from "./efectos.js";

const svg = (c) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${c}</svg>`;
const TEL = '<path d="M6.7 3.6h2.5l1.4 4-2 1.5a12.2 12.2 0 0 0 6.3 6.3l1.5-2 4 1.4v2.5a2 2 0 0 1-2.2 2A17.4 17.4 0 0 1 4.7 5.8a2 2 0 0 1 2-2.2z"/>';
const IC = {
  tel: svg(TEL),
  colgar: svg(`<g transform="rotate(135 12 12)">${TEL}</g>`),
  mic: svg('<rect x="9" y="3.2" width="6" height="11" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6V21"/>'),
  micNo: svg('<rect x="9" y="3.2" width="6" height="11" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6V21M4 4l16 16"/>'),
  cam: svg('<rect x="2.6" y="6.2" width="12.6" height="11.6" rx="3.2"/><path d="m15.2 10.4 5.2-3v9.2l-5.2-3"/>'),
  camNo: svg('<rect x="2.6" y="6.2" width="12.6" height="11.6" rx="3.2"/><path d="m15.2 10.4 5.2-3v9.2l-5.2-3M3 3l18 18"/>'),
  voltear: svg('<path d="M4 9.5A8 8 0 0 1 18.4 6.4L20 8M20 4v4h-4M20 14.5a8 8 0 0 1-14.4 3.1L4 16M4 20v-4h4"/>'),
  magia: svg('<path d="M12 3.5l1.6 4.2 4.2 1.6-4.2 1.6L12 15.1l-1.6-4.2-4.2-1.6 4.2-1.6zM18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM5.5 15l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L3.5 17l1.4-.6z"/>'),
  min: svg('<path d="m6 9.5 6 6 6-6"/>'),
  candado: svg('<rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>'),
};
const MOTIVOS = { colgo: "Llamada terminada", rechazo: "No puede contestar ahorita", sin_respuesta: "No contestó", se_corto: "Se cortó la llamada" };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return (s >= 3600 ? Math.floor(s / 3600) + ":" : "") + String(Math.floor((s % 3600) / 60)).padStart(s >= 3600 ? 2 : 1, "0") + ":" + String(s % 60).padStart(2, "0"); };
const vib = (p) => { try { navigator.vibrate?.(p); } catch (e) { /* nada */ } };
/** Las notificaciones de «te está llamando» se quitan en cuanto la app ya está sonando (o contestaste). */
const quitarNotificaciones = () => navigator.serviceWorker?.getRegistration?.().then((r) => r?.getNotifications?.({ tag: "llamada" })).then((ns) => ns?.forEach((n) => n.close())).catch(() => {});

const AUDIO = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 };
const VIDEO = (frente = true) => ({ facingMode: frente ? "user" : { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } });

export class Llamadas {
  constructor(app) {
    this.app = app;
    this.n = 0;          // el último aviso que ya vi
    this.l = null;       // la llamada de ahorita
    this._ice = null;
    document.addEventListener("visibilitychange", () => { this.escuchar(); if (!document.hidden && this.l) this._despierta(); });
    addEventListener("ed-cuenta", () => { this.n = 0; this.escuchar(); });
    addEventListener("pagehide", () => { if (this.l?.id) SRV.colgarYa(this.l.id); });
    setTimeout(() => this.escuchar(), 1800);
  }

  get enLlamada() { return !!this.l; }

  /* ── Esperar avisos (mientras la app está a la vista, o durante una llamada) ── */
  async escuchar() {
    if (this._bucle || !SRV.conectado() || (document.hidden && !this.l)) return;
    this._bucle = true;
    let fallos = 0;
    try {
      while (SRV.conectado() && (!document.hidden || this.l)) {
        try {
          const r = await SRV.eventosLlamada(this.n, this.n ? 25 : 0);
          fallos = 0;
          this.n = r.n || this.n;
          const ev = r.eventos || [], terminadas = new Set(ev.filter((e) => e.t === "fin").map((e) => e.id));
          for (const e of ev) {
            if (e.t === "entrante" && terminadas.has(e.id)) continue;   // sonó y colgó mientras no veías: no vale la pena timbrar
            try { await this._aviso(e); } catch (x) { console.warn("llamada:", x); }
          }
        } catch (e) {
          if (e.status === 404 || e.status === 401) return;   // un servidor de antes (sin llamadas) o sin sesión
          fallos++;
          await dormir(Math.min(20000, 1000 * 2 ** Math.min(fallos, 5)));
        }
      }
    } finally { this._bucle = false; }
  }

  async _aviso(e) {
    const l = this.l;
    if (e.t === "entrante") {
      if (l?.id === e.id) return;
      if (l) this._fin("", true);   // (el servidor ya terminó la de antes)
      return this._entrante(e);
    }
    if (!l || l.id !== e.id) return;
    if (e.t === "contestada") return this._contestada(l, e.d);
    if (e.t === "desc") return this._desc(l, e.d);
    if (e.t === "ice") return this._iceRemoto(l, e.c);
    if (e.t === "estado") return this._estadoRemoto(l, e);
    if (e.t === "fin") {
      if (e.motivo === "en_otro") return this._fin("", true);
      return this._fin(l.estado === "entrante" ? "Llamada perdida" : MOTIVOS[e.motivo] || "Llamada terminada");
    }
  }

  /* ── Llamar ── */
  async llamar(tipo = "voz") {
    if (this.l) { this._ui?.capa.classList.remove("mini"); return; }
    if (!SRV.conectado()) { aviso("Entra a tu cuenta para llamar.", 3000); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) { aviso("Este navegador no puede hacer llamadas: ábrelo en Chrome o Safari.", 4200); return; }
    const l = (this.l = this._nueva({ tipo, mia: true, estado: "llamando" }));
    this._abrirUI(l);
    try {
      await this._medios(l, tipo === "video");
      if (this.l !== l) return this._soltarMedios(l);   // colgó mientras pedía permiso
      const pc = await this._pc(l);
      l.tA = pc.addTransceiver(l.mic, { direction: "sendrecv" });
      l.tV = pc.addTransceiver(this._pistaVideo(l) || "video", { direction: "sendrecv" });
      this._codecs(l.tV);
      await pc.setLocalDescription(await pc.createOffer());
      const r = await SRV.llamar(tipo, pc.localDescription.toJSON());
      if (this.l !== l) { if (r.llamada) SRV.senalLlamada(r.llamada.id, { t: "colgar" }).catch(() => {}); return; }
      if (r.entrante) {
        // Nos llamamos al mismo tiempo: contesto la suya (las dos queríamos hablar).
        pc.close();
        Object.assign(l, { pc: null, tA: null, tV: null, id: r.entrante.id, mia: false, oferta: r.entrante.oferta, iceRem: r.entrante.ice || [] });
        return this._conectarRespuesta(l);
      }
      l.id = r.llamada.id; l.listoIce = true; this._soltarIce(l);
      this._estado(l, "sonando");
      this._tono("espera");
      this.escuchar();
    } catch (e) {
      if (this.l === l) this._fin(e.message || "No se pudo llamar.", false, true);
    }
  }

  _nueva(x) {
    return { id: null, mia: true, iceCola: [], iceRem: [], micOn: true, camOn: x.tipo === "video", frente: true, remCam: x.tipo === "video", remMic: true, desde: 0, ...x };
  }

  /* ── Que te llamen ── */
  _entrante(e) {
    const l = (this.l = this._nueva({ id: e.id, tipo: e.tipo, mia: false, estado: "entrante", oferta: e.oferta, iceRem: [...(e.ice || [])], de: e.de }));
    this._abrirUI(l);
    this._tono("timbre");
    quitarNotificaciones();
  }

  async contestar(conCamara = true) {
    const l = this.l;
    if (!l || l.estado !== "entrante") return;
    this._callar();
    this._estado(l, "conectando");
    try {
      await this._medios(l, l.tipo === "video" && conCamara);
      if (this.l !== l) return this._soltarMedios(l);
      await this._conectarRespuesta(l);
    } catch (e) {
      if (this.l !== l) return;
      SRV.senalLlamada(l.id, { t: "rechazar" }).catch(() => {});
      this._fin(e.message || "No se pudo contestar.", false, true);
    }
  }

  async _conectarRespuesta(l) {
    if (!l.mic) await this._medios(l, l.tipo === "video");
    this._estado(l, "conectando");
    const pc = await this._pc(l);
    await pc.setRemoteDescription(l.oferta);
    for (const t of pc.getTransceivers()) {
      const k = t.receiver.track?.kind;
      if (k === "audio" && !l.tA) { l.tA = t; await t.sender.replaceTrack(l.mic); t.direction = "sendrecv"; }
      else if (k === "video" && !l.tV) { l.tV = t; await t.sender.replaceTrack(this._pistaVideo(l)); t.direction = "sendrecv"; this._codecs(t); }
    }
    await pc.setLocalDescription(await pc.createAnswer());
    const r = await SRV.senalLlamada(l.id, { t: "contestar", d: pc.localDescription.toJSON() });
    if (this.l !== l) return;
    if (r.fin) { this._fin("Ya colgó"); return; }
    l.listoIce = true; this._soltarIce(l);
    await this._iceRemoto(l, l.iceRem.splice(0));
    this._negociado(l);
    quitarNotificaciones();
  }

  async _contestada(l, d) {
    if (!l.pc || l.pc.signalingState !== "have-local-offer") return;
    await l.pc.setRemoteDescription(d);
    await this._iceRemoto(l, l.iceRem.splice(0));
    this._callar();
    this._estado(l, "conectando");
    this._negociado(l);
  }

  _negociado(l) {
    l.negociado = true;
    this._calidad(l);
    this._contarMedios(l);
    // Si en 25 s no se encuentran (redes que no se dejan hablar directo), se avisa en vez de quedarse así.
    clearTimeout(l._tConecta);
    l._tConecta = setTimeout(() => { if (this.l === l && !l.desde) this.colgar("No se pudieron conectar: prueben con wifi."); }, 25000);
  }

  rechazar() { this.colgar("Rechazaste la llamada"); }

  /** Colgar (o cancelar, o rechazar). */
  colgar(texto) {
    const l = this.l;
    if (!l) return;
    if (l.id) SRV.senalLlamada(l.id, { t: l.estado === "entrante" ? "rechazar" : "colgar" }).catch(() => {});
    this._fin(texto || (l.desde ? `Llamada terminada · ${mmss(Date.now() - l.desde)}` : l.mia ? "Llamada cancelada" : "Llamada terminada"));
  }

  /* ── Cámara y micrófono ── */
  async _medios(l, video) {
    let s;
    try { s = await navigator.mediaDevices.getUserMedia({ audio: AUDIO, video: video ? VIDEO(true) : false }); }
    catch (e) {
      let err = e;
      if (video) {
        try { s = await navigator.mediaDevices.getUserMedia({ audio: AUDIO }); aviso("No se pudo usar la cámara: va sólo con voz.", 3500); err = null; } catch (e2) { err = e2; }
      }
      if (err) throw new Error(err.name === "NotAllowedError" ? "Dale permiso al micrófono (y a la cámara) para llamar." : err.name === "NotFoundError" ? "Este aparato no tiene micrófono." : "No se pudo usar el micrófono.");
    }
    l.mic = s.getAudioTracks()[0];
    l.mic.contentHint = "speech";
    l.cam = s.getVideoTracks()[0] || null;
    l.camOn = !!l.cam;
    if (l.cam) this._prepararCam(l);
    this._verYo(l);
    this._contarCamaras(l);
  }

  _prepararCam(l) {
    l.cam.contentHint = "motion";
    if (!l.ef) l.ef = new Efectos({ alCambio: (f, v) => this._efecto(l, f, v) });
    l.ef.camara(l.cam);
  }

  /** Lo que sale por la llamada: la cámara (o con efectos, su lienzo); nada si la apagaste. */
  _pistaVideo(l) { return l.camOn && l.cam ? (l.ef?.activo ? l.ef.pista() : l.cam) : null; }

  async _ponerVideo(l) {
    const p = this._pistaVideo(l);
    try { await l.tV?.sender.replaceTrack(p); } catch (e) { /* nada */ }
    this._verYo(l);
    this._contarMedios(l);
    this._pintar(l);
  }

  _soltarMedios(l) { l.ef?.cerrar(); l.mic?.stop(); l.cam?.stop(); }

  async _contarCamaras(l) {
    try { l.camaras = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").length; } catch (e) { l.camaras = 1; }
    this._pintar(l);
  }

  async alternarMic() {
    const l = this.l; if (!l?.mic) return;
    l.micOn = !l.micOn; l.mic.enabled = l.micOn;
    vib(8); this._contarMedios(l); this._pintar(l);
  }

  async alternarCam() {
    const l = this.l; if (!l) return;
    vib(8);
    if (l.camOn) {
      l.camOn = false;
      await this._ponerVideo(l);
      l.ef?.camara(null);
      l.cam?.stop(); l.cam = null;            // (se apaga de verdad: también su lucecita)
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: VIDEO(l.frente) }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
      if (this.l !== l) { s.getTracks().forEach((t) => t.stop()); return; }
      l.cam = s.getVideoTracks()[0]; l.camOn = true;
      this._prepararCam(l);
      await this._ponerVideo(l);
      this._contarCamaras(l);
    } catch (e) { aviso("No se pudo prender la cámara.", 3000); }
  }

  async voltear() {
    const l = this.l; if (!l?.cam) return;
    vib(8);
    const frente = !l.frente;
    let s;
    try { s = await navigator.mediaDevices.getUserMedia({ video: VIDEO(frente) }); }
    catch (e) {
      try { s = await navigator.mediaDevices.getUserMedia({ video: { ...VIDEO(frente), facingMode: frente ? "user" : "environment" } }); } catch (e2) { aviso("Este aparato sólo tiene una cámara.", 2600); return; }
    }
    if (this.l !== l) { s.getTracks().forEach((t) => t.stop()); return; }
    const vieja = l.cam;
    l.cam = s.getVideoTracks()[0]; l.frente = frente;
    this._prepararCam(l);
    await this._ponerVideo(l);
    vieja?.stop();
  }

  /* ── La conexión (WebRTC) ── */
  async _servidoresIce() {
    if (this._ice && Date.now() - this._ice.t < 10 * 60 * 1000) return this._ice.v;
    let v = [{ urls: ["stun:stun.l.google.com:19302"] }];
    try { v = (await SRV.llamadaIce()).ice || v; } catch (e) { /* con el de fábrica */ }
    this._ice = { v, t: Date.now() };
    return v;
  }

  async _pc(l) {
    const pc = new RTCPeerConnection({ iceServers: await this._servidoresIce(), bundlePolicy: "max-bundle", rtcpMuxPolicy: "require" });
    l.pc = pc;
    pc.onicecandidate = (ev) => { if (ev.candidate) this._mandarIce(l, ev.candidate.toJSON()); };
    pc.ontrack = (ev) => {
      l.remoto ||= new MediaStream();
      if (!l.remoto.getTracks().includes(ev.track)) l.remoto.addTrack(ev.track);
      ev.track.onunmute = ev.track.onmute = () => this._pintar(l);
      const v = this._ui?.remoto;
      if (v && v.srcObject !== l.remoto) { v.srcObject = l.remoto; this._reproducir(v); }
      this._pintar(l);
    };
    pc.onconnectionstatechange = pc.oniceconnectionstatechange = () => this._conexion(l);
    pc.onnegotiationneeded = () => this._renegociar(l);
    return pc;
  }

  _reproducir(v) {
    v.play().catch(() => {
      // El navegador no deja que suene solo: un botón para escucharlo.
      if (this._ui?.oir) this._ui.oir.hidden = false;
    });
  }

  _conexion(l) {
    if (this.l !== l || !l.pc) return;
    const s = l.pc.connectionState || l.pc.iceConnectionState;
    if (s === "connected" || s === "completed") {
      clearTimeout(l._tRec); clearTimeout(l._tCae); l._tCae = 0;
      if (!l.desde) {
        l.desde = Date.now();
        clearTimeout(l._tConecta);
        this._tono("conecta"); vib(30);
        l._reloj = setInterval(() => this._pintarTiempo(l), 1000);
        this._despierta();
      }
      this._estado(l, "activa");
      this._pintar(l);
    } else if (s === "disconnected" && l.desde) {
      this._estado(l, "reconectando");
      clearTimeout(l._tRec);
      l._tRec = setTimeout(() => { if (l.mia && l.pc?.connectionState !== "connected") l.pc?.restartIce?.(); }, 2500);
      this._caida(l);
    } else if (s === "failed") {
      if (!l.desde) return;   // (lo de los 25 s avisa si nunca se encontraron)
      this._estado(l, "reconectando");
      if (l.mia) l.pc.restartIce?.();
      this._caida(l);
    }
  }

  _caida(l) { if (!l._tCae) l._tCae = setTimeout(() => { if (this.l === l && l.pc?.connectionState !== "connected") this.colgar("Se cortó la llamada"); }, 25000); }

  /** Volver a negociar (cambio de red): quien llamó propone; si chocan, cede quien contestó. */
  async _renegociar(l) {
    if (!l.negociado || this.l !== l || !l.pc) return;
    try {
      l.ofreciendo = true;
      await l.pc.setLocalDescription();
      await SRV.senalLlamada(l.id, { t: "desc", d: l.pc.localDescription.toJSON() });
    } catch (e) { /* la próxima */ } finally { l.ofreciendo = false; }
  }

  async _desc(l, d) {
    const pc = l.pc;
    if (!pc) return;
    const choque = d.type === "offer" && (l.ofreciendo || pc.signalingState !== "stable");
    if (choque && l.mia) return;
    await pc.setRemoteDescription(d);
    if (d.type === "offer") {
      await pc.setLocalDescription();
      await SRV.senalLlamada(l.id, { t: "desc", d: pc.localDescription.toJSON() });
    }
  }

  _mandarIce(l, c) {
    l.iceCola.push(c);
    if (!l.listoIce || l._tIce) return;
    l._tIce = setTimeout(() => this._soltarIce(l), 120);   // de a poquitos juntos (menos viajes)
  }

  _soltarIce(l) {
    clearTimeout(l._tIce); l._tIce = 0;
    if (!l.listoIce || !l.id || !l.iceCola.length || this.l !== l) return;
    const c = l.iceCola.splice(0, 30);
    SRV.senalLlamada(l.id, { t: "ice", c }).catch(() => {});
    if (l.iceCola.length) this._soltarIce(l);
  }

  async _iceRemoto(l, cs) {
    if (!l.pc?.remoteDescription) { l.iceRem.push(...cs); return; }
    for (const c of cs) { try { await l.pc.addIceCandidate(c); } catch (e) { /* uno que no sirvió */ } }
  }

  /** Buena calidad: hasta 2.5 Mbps y 30 cuadros de video, voz HD; H.264 primero (lo hace el chip del teléfono: menos calor). */
  async _calidad(l) {
    for (const [t, max] of [[l.tV, 2_500_000], [l.tA, 96_000]]) {
      const s = t?.sender;
      if (!s?.getParameters) continue;
      try {
        const p = s.getParameters();
        if (!p.encodings?.length) p.encodings = [{}];
        p.encodings[0].maxBitrate = max;
        if (t === l.tV) { p.encodings[0].maxFramerate = 30; p.degradationPreference = "balanced"; }
        await s.setParameters(p);
      } catch (e) { /* el navegador decide */ }
    }
  }

  _codecs(t) {
    try {
      const cs = RTCRtpReceiver.getCapabilities?.("video")?.codecs;
      if (!cs || !t?.setCodecPreferences) return;
      const f = (c) => c.sdpFmtpLine || "";
      const peso = (c) => (/h264/i.test(c.mimeType) ? (/42e01f/i.test(f(c)) && /packetization-mode=1/.test(f(c)) ? 0 : 1) : /vp8/i.test(c.mimeType) ? 2 : /vp9/i.test(c.mimeType) ? 3 : 4);
      t.setCodecPreferences([...cs].sort((a, b) => peso(a) - peso(b)));
    } catch (e) { /* los de siempre */ }
  }

  _contarMedios(l) {
    if (!l.id || !l.negociado) return;
    SRV.senalLlamada(l.id, { t: "estado", cam: !!(l.camOn && l.cam), mic: l.micOn, ef: l.efAviso || "" }).catch(() => {});
    l.efAviso = "";
  }

  _estadoRemoto(l, e) {
    l.remCam = !!e.cam; l.remMic = !!e.mic;
    if (e.ef === "ida" || e.ef === "vuelta") this._tono(e.ef === "ida" ? "fiuu" : "fiuu-vuelta");
    this._pintar(l);
  }

  /* ── Efectos ── */
  _efecto(l, f, v) {
    const u = this._ui;
    if (!u || this.l !== l) return;
    if (f === "carga") { u.yo.style.setProperty("--carga", String(v)); u.capa.classList.toggle("cargando", v > 0); return; }
    if (f === "lento") { aviso("Tu teléfono va lento con los efectos: bajé un poquito la calidad.", 3600); return; }
    u.capa.dataset.goku = f;
    u.capa.classList.remove("cargando");
    if (f === "ida" || f === "vuelta") {
      this._tono(f === "ida" ? "fiuu" : "fiuu-vuelta"); vib(f === "ida" ? [40, 30, 90] : 60);
      l.efAviso = f; this._contarMedios(l);
    }
    // Con un efecto (o sin ninguno) cambia lo que sale por la llamada.
    if (f === "normal" || f === "ida") this._ponerVideo(l);
  }

  async ponerEfecto(k, on, boton) {
    const l = this.l;
    if (!l?.ef) { aviso("Prende tu cámara para usar los efectos.", 2600); return; }
    boton?.classList.add("cargando");
    try {
      await l.ef.poner(k, on);
      await this._ponerVideo(l);
      if (k === "goku" && on) aviso("Pon el índice y el medio juntitos en tu frente 3 segundos 🫡", 4200);
    } catch (e) {
      aviso("No se pudo cargar el efecto (¿estás sin internet?).", 3600);
      l.ef.on[k] = false;
    } finally { boton?.classList.remove("cargando"); this._pintarEfectos(l); }
  }

  /* ── La pantalla ── */
  _abrirUI(l) {
    this._cerrarUI(true);
    const nombre = (l.mia ? PF.nombreDe(PF.datos().pareja) : l.de) || "Tu amorcito";
    const b = (cls, html, etiqueta, al) => el("button.ll-b" + (cls ? "." + cls : ""), { type: "button", "aria-label": etiqueta, title: etiqueta, html, onClick: (ev) => { ev.stopPropagation(); al(ev); } });
    const remoto = el("video.ll-remoto", { autoplay: true, playsinline: true });
    const local = el("video.ll-local", { autoplay: true, playsinline: true });
    local.muted = true;
    const u = (this._ui = {
      remoto, local, nombre,
      estado: el("span.ll-estado", { text: "" }),
      tiempo: el("span.ll-tiempo"),
      oir: el("button.ll-oir", { type: "button", hidden: true, text: "🔊 Toca para escucharlo", onClick: () => { remoto.play().catch(() => {}); u.oir.hidden = true; } }),
    });
    u.bMic = b("", IC.mic, "Silenciar", () => this.alternarMic());
    u.bCam = b("", IC.cam, "Cámara", () => this.alternarCam());
    u.bVoltear = b("", IC.voltear, "Voltear la cámara", () => this.voltear());
    u.bMagia = b("", IC.magia, "Efectos", () => this._hojaEfectos());
    u.bColgar = b("rojo", IC.colgar, "Colgar", () => this.colgar());
    u.yo = el("div.ll-yo", {}, [local, el("span.ll-yo-off", { html: IC.camNo }), el("i.ll-yo-carga")]);
    u.capa = el("div.ll-capa", { role: "dialog", "aria-modal": "true", "aria-label": l.tipo === "video" ? "Videollamada" : "Llamada", dataset: { estado: l.estado, tipo: l.tipo } }, [
      el("div.ll-fondo", {}, [PF.avatar("pareja", "ll-fondo-av")]),
      remoto,
      el("div.ll-arriba", {}, [
        b("ll-min", IC.min, "Hacer chiquita", () => this.minimizar(true)),
        el("span.ll-cifrado", { html: IC.candado + "<span>Cifrada</span>" }),
      ]),
      el("div.ll-quien", {}, [el("div.ll-anillos", {}, [PF.avatar("pareja", "ll-av")]), el("b.ll-nombre", { text: nombre }), u.estado, u.tiempo]),
      u.yo,
      u.oir,
      el("div.ll-goku-letrero", { "aria-live": "polite" }),
      el("div.ll-botones", {}, [u.bMagia, u.bVoltear, u.bCam, u.bMic, u.bColgar]),
      el("div.ll-entrante", {}, [
        el("div.ll-ent-b", {}, [b("rojo.grande", IC.colgar, "Rechazar", () => this.rechazar()), el("span", { text: "Rechazar" })]),
        el("div.ll-ent-b", {}, [b("verde.grande", l.tipo === "video" ? IC.cam : IC.tel, "Contestar", () => this.contestar(true)), el("span", { text: "Contestar" })]),
        l.tipo === "video" ? el("button.ll-sin-cam", { type: "button", text: "Contestar sin cámara", onClick: () => this.contestar(false) }) : null,
      ]),
    ]);
    // Tocar la pantalla esconde/enseña los botones (en video); en chiquito, la agranda.
    u.capa.addEventListener("click", (ev) => {
      if (u.capa.classList.contains("mini")) { this.minimizar(false); return; }
      if (ev.target.closest("button, .ll-yo, .ll-hoja")) return;
      if (u.capa.classList.contains("con-video")) this._botones(u.capa.classList.contains("sin-botones"));
    });
    this._arrastrable(u.yo, l);
    document.body.append(u.capa);
    document.body.classList.add("en-llamada");
    requestAnimationFrame(() => u.capa.classList.add("ver"));
    this._estado(l, l.estado);
    this._pintar(l);
  }

  _cerrarUI(ya) {
    const u = this._ui;
    if (!u) return;
    this._ui = null;
    document.body.classList.remove("en-llamada");
    u.hoja?.remove();
    if (ya) u.capa.remove();
    else { u.capa.classList.add("termina"); setTimeout(() => u.capa.remove(), 1500); }
  }

  minimizar(si) {
    const u = this._ui; if (!u) return;
    u.capa.classList.toggle("mini", si);
    u.hoja?.remove(); u.hoja = null;
    vib(6);
  }

  _botones(ver) {
    const u = this._ui; if (!u) return;
    u.capa.classList.toggle("sin-botones", !ver);
    clearTimeout(this._tBotones);
    if (ver && u.capa.classList.contains("con-video")) this._tBotones = setTimeout(() => { if (this._ui === u && !u.hoja) u.capa.classList.add("sin-botones"); }, 5000);
  }

  _estado(l, e) {
    l.estado = e;
    const u = this._ui;
    if (!u || this.l !== l) return;
    u.capa.dataset.estado = e;
    const video = l.tipo === "video";
    u.estado.textContent = {
      llamando: "Llamando…", sonando: video ? "Videollamada · sonando…" : "Sonando…",
      entrante: video ? "Videollamada entrante" : "Llamada entrante", conectando: "Conectando…",
      activa: "", reconectando: "Reconectando…",
    }[e] ?? "";
    if (e === "activa") this._botones(true);
    this._pintarTiempo(l);
  }

  _pintarTiempo(l) {
    const u = this._ui;
    if (u && this.l === l) u.tiempo.textContent = l.desde && l.estado !== "reconectando" ? mmss(Date.now() - l.desde) : "";
  }

  /** Acomoda la pantalla según quién tiene la cámara prendida. */
  _pintar(l) {
    const u = this._ui;
    if (!u || this.l !== l) return;
    const vRem = l.remoto?.getVideoTracks()[0];
    const suVideo = !!(l.remCam && vRem && !vRem.muted && l.desde);
    const miVideo = !!(l.camOn && l.cam);
    u.capa.classList.toggle("con-video", suVideo);
    u.capa.classList.toggle("mi-video", miVideo);
    u.capa.classList.toggle("su-mic-no", !l.remMic);
    u.bMic.innerHTML = l.micOn ? IC.mic : IC.micNo;
    u.bMic.classList.toggle("apagado", !l.micOn);
    u.bMic.setAttribute("aria-label", l.micOn ? "Silenciar" : "Quitar silencio");
    u.bCam.innerHTML = miVideo ? IC.cam : IC.camNo;
    u.bCam.classList.toggle("apagado", !miVideo);
    u.bCam.setAttribute("aria-label", miVideo ? "Apagar la cámara" : "Prender la cámara");
    u.bVoltear.hidden = !miVideo || (l.camaras || 0) < 2;
    u.bMagia.hidden = !miVideo;
    u.yo.classList.toggle("espejo", l.frente);
    if (!suVideo && !miVideo) this._botones(true);
  }

  _verYo(l) {
    const u = this._ui; if (!u) return;
    const p = this._pistaVideo(l);
    if (!p) { u.local.srcObject = null; return; }
    if (u.local.srcObject?.getVideoTracks()[0] !== p) { u.local.srcObject = new MediaStream([p]); u.local.play().catch(() => {}); }
  }

  /** Tu cuadrito: se arrastra a cualquier esquina; tocarlo cambia quién se ve grande. */
  _arrastrable(n, l) {
    let g = null;
    n.addEventListener("pointerdown", (ev) => {
      if (this._ui?.capa.classList.contains("mini")) return;
      g = { x: ev.clientX, y: ev.clientY, r: n.getBoundingClientRect(), mov: false };
      n.setPointerCapture(ev.pointerId);
    });
    n.addEventListener("pointermove", (ev) => {
      if (!g) return;
      const dx = ev.clientX - g.x, dy = ev.clientY - g.y;
      if (!g.mov && Math.hypot(dx, dy) < 6) return;
      g.mov = true;
      n.style.transition = "none";
      n.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const soltar = (ev) => {
      if (!g) return;
      const r = n.getBoundingClientRect(), mov = g.mov;
      g = null;
      n.style.transition = ""; n.style.transform = "";
      if (!mov) { if (this._ui?.capa.classList.contains("con-video") && l.camOn) this._ui.capa.classList.toggle("cambiados"); return; }
      const der = r.left + r.width / 2 > innerWidth / 2, abajo = r.top + r.height / 2 > innerHeight / 2;
      n.dataset.esquina = (abajo ? "abajo" : "arriba") + "-" + (der ? "der" : "izq");
      vib(6);
    };
    n.addEventListener("pointerup", soltar);
    n.addEventListener("pointercancel", soltar);
  }

  /** ✨ Efectos: los del teléfono (si los presta) y los nuestros. */
  _hojaEfectos() {
    const u = this._ui, l = this.l;
    if (!u || !l) return;
    if (u.hoja) { u.hoja.remove(); u.hoja = null; return; }
    clearTimeout(this._tBotones);
    const tel = l.cam ? nativos(l.cam) : [];
    const chip = (k, t, emoji) => el("button.ll-ef", { type: "button", dataset: { k }, "aria-pressed": "false", onClick: (ev) => this.ponerEfecto(k, !l.ef?.on[k], ev.currentTarget) }, [el("i", { text: emoji }), el("span", { text: t })]);
    u.hoja = el("div.ll-hoja", { role: "dialog", "aria-label": "Efectos" }, [
      el("div.ll-hoja-cab", {}, [el("b", { text: "Efectos ✨" }), el("button.ll-hoja-x", { type: "button", "aria-label": "Cerrar", text: "✕", onClick: () => { u.hoja.remove(); u.hoja = null; this._botones(true); } })]),
      el("p.ll-hoja-sub", { text: "Del teléfono" }),
      tel.length
        ? el("div.ll-hoja-fila", {}, tel.map((x) => el("button.ll-ef.nativo", { type: "button", "aria-pressed": String(x.on), disabled: x.fijo || null, onClick: async (ev) => {
          const bt = ev.currentTarget;
          try { const on = await ponerNativo(l.cam, x.k, bt.getAttribute("aria-pressed") !== "true"); bt.setAttribute("aria-pressed", String(on)); } catch (e) { aviso("Tu teléfono no dejó cambiarlo.", 2600); }
        } }, [el("i", { text: "📱" }), el("span", { text: x.t })])))
        : el("p.ll-hoja-nota", { text: "Tu teléfono no le presta sus efectos de cámara a las páginas (los de Samsung sólo funcionan en apps como WhatsApp). Pero aquí tienes los nuestros, hechos para ustedes 👇" }),
      el("p.ll-hoja-sub", { text: "Nuestros" }),
      el("div.ll-hoja-fila", {}, [chip("suave", "Suavizar", "🌸"), chip("fondo", "Fondo borroso", "🌫️"), chip("goku", "Teletransporte", "🫡")]),
      el("div.ll-goku-ayuda", {}, [
        el("span", { text: "Índice y medio juntitos en tu frente, 3 segundos… ¡y desapareces 5 segundos! Tip: muévete un poquito antes, así se aprende el fondo detrás de ti y desapareces perfecto." }),
        el("button.ll-probar", { type: "button", text: "Probar ahora", onClick: async (ev) => { const bt = ev.currentTarget; bt.disabled = true; try { await l.ef?.teletransportar(); await this._ponerVideo(l); } catch (e) { aviso("No se pudo cargar el efecto (¿estás sin internet?).", 3600); } bt.disabled = false; this._pintarEfectos(l); } }),
      ]),
    ]);
    u.capa.append(u.hoja);
    this._pintarEfectos(l);
  }

  _pintarEfectos(l) {
    const h = this._ui?.hoja;
    if (!h) return;
    for (const b of h.querySelectorAll(".ll-ef[data-k]")) b.setAttribute("aria-pressed", String(!!l.ef?.on[b.dataset.k]));
    h.classList.toggle("goku", !!l.ef?.on.goku);
  }

  /* ── Timbres (hechos con WebAudio: nada que descargar) ── */
  _audio() {
    try { this._ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (this._ac.state === "suspended") this._ac.resume().catch(() => {}); return this._ac; } catch (e) { return null; }
  }

  _nota(ac, f, t, dura, vol, tipo = "sine") {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dura);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dura + 0.02);
  }

  _tono(cual) {
    const ac = this._audio();
    if (cual === "timbre" || cual === "espera") {
      this._callar();
      const una = () => {
        if (cual === "timbre") vib([500, 250, 500]);
        const a = this._audio();
        if (!a || a.state !== "running") return;   // (sin tocar la pantalla antes, el navegador no deja sonar: sólo vibra)
        const t = a.currentTime + 0.02;
        if (cual === "timbre") {
          // Una melodía de marimba, como la de un teléfono bonito.
          [[784, 0], [988, 0.16], [1175, 0.32], [988, 0.48], [1319, 0.7], [1175, 0.86]].forEach(([f, d]) => { this._nota(a, f, t + d, 0.5, 0.22); this._nota(a, f * 2, t + d, 0.18, 0.04); });
        } else { this._nota(a, 523, t, 0.9, 0.06); this._nota(a, 659, t + 0.05, 0.9, 0.05); }
      };
      una();
      this._tTono = setInterval(una, cual === "timbre" ? 2600 : 3200);
      return;
    }
    if (!ac) return;
    const t = ac.currentTime + 0.01;
    if (cual === "conecta") { this._nota(ac, 660, t, 0.18, 0.12); this._nota(ac, 990, t + 0.12, 0.25, 0.12); }
    else if (cual === "colgar") { this._nota(ac, 660, t, 0.2, 0.12); this._nota(ac, 440, t + 0.15, 0.32, 0.12); }
    else if (cual === "fiuu" || cual === "fiuu-vuelta") {
      // ¡Fiuuu! (ruido que se afina y una campanita).
      const ida = cual === "fiuu", dura = 0.45, n = Math.floor(ac.sampleRate * dura);
      const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = buf; f.type = "bandpass"; f.Q.value = 6;
      f.frequency.setValueAtTime(ida ? 500 : 3200, t); f.frequency.exponentialRampToValueAtTime(ida ? 3600 : 450, t + dura);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dura);
      s.connect(f).connect(g).connect(ac.destination); s.start(t);
      this._nota(ac, ida ? 1760 : 1320, t + (ida ? 0.3 : 0.02), 0.5, 0.08); this._nota(ac, ida ? 2637 : 1976, t + (ida ? 0.34 : 0.06), 0.4, 0.04);
    }
  }

  _callar() { clearInterval(this._tTono); this._tTono = 0; vib(0); }

  /** La pantalla encendida durante la videollamada. */
  async _despierta() {
    const l = this.l;
    if (!l?.desde || document.hidden || !("wakeLock" in navigator)) return;
    try { this._wl?.release?.(); this._wl = await navigator.wakeLock.request("screen"); } catch (e) { /* nada */ }
  }

  /** Terminar: soltar todo (cámara, micrófono, conexión) y decir por qué. */
  _fin(texto = "Llamada terminada", silencioso = false, error = false) {
    const l = this.l;
    if (!l) return;
    this.l = null;
    this._callar();
    for (const t of ["_tRec", "_tCae", "_tConecta", "_tIce"]) clearTimeout(l[t]);
    clearInterval(l._reloj);
    try { this._wl?.release?.(); } catch (e) { /* nada */ }
    this._wl = null;
    this._soltarMedios(l);
    try { l.pc?.close(); } catch (e) { /* nada */ }
    quitarNotificaciones();
    const u = this._ui;
    if (!u) return;
    if (silencioso) { this._cerrarUI(true); return; }
    u.estado.textContent = texto; u.tiempo.textContent = "";
    u.capa.dataset.estado = "fin";
    u.capa.classList.remove("con-video", "mini");
    if (!error) this._tono("colgar");
    else aviso(texto, 4200);
    this._cerrarUI(false);
  }
}
