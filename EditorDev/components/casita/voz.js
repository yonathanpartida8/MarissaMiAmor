/**
 * LA VOZ EN VIVO DE LA CASITA (Fase 58): hablar los dos al mismo tiempo mientras juegan, como llamada.
 *
 *   · WebRTC directo entre los dos teléfonos: Opus a 48 kHz con 128 kbps (alta definición), cancelación
 *     de eco y supresión de ruido. El audio nunca pasa por el servidor: M.YNTHN sólo pasa la «oferta» y la
 *     «respuesta» (/api/casita/voz, con la escucha de la casita).
 *   · Uno toca «Voz» y al otro le sale «Contestar». Se puede silenciar el micrófono y colgar.
 *   · Mientras están en vivo, la canción del editor se calla; al salir de la casita se cuelga sola.
 */
import { aviso, quitarAviso } from "../ui.js";
import * as SRV from "../../integraciones/servidor.js";

const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
/** Opus en alta definición (estéreo, 128 kbps, con corrección de errores). */
function hd(sdp) {
  const m = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp);
  if (!m) return sdp;
  const pt = m[1], extra = "stereo=1;sprop-stereo=1;maxaveragebitrate=128000;useinbandfec=1;usedtx=0";
  const re = new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`);
  return re.test(sdp) ? sdp.replace(re, (x, p) => `a=fmtp:${pt} ${p.split(";").filter((k) => !/^(stereo|sprop-stereo|maxaveragebitrate|useinbandfec|usedtx)=/.test(k)).concat(extra).join(";")}`) : sdp.replace(m[0], `${m[0]}\r\na=fmtp:${pt} ${extra}`);
}
/** Espera a que se junten las direcciones (o 2.5 s): así va todo en una sola señal. */
const juntarIce = (pc) => new Promise((ok) => {
  if (pc.iceGatheringState === "complete") return ok();
  const t = setTimeout(ok, 2500);
  pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); ok(); } });
});

export const puedeVoz = () => !!(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);

export class VozEnVivo {
  constructor(j) {
    this.j = j; this.pc = null; this.mic = null; this.estado = "apagada"; this.mudo = false;
    this.sonido = new Audio(); this.sonido.autoplay = true; this.sonido.playsInline = true;
  }
  _pintar() { this.j.alCambiarVoz?.(this.estado, this.mudo); }
  async _micro() {
    this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 } });
    return this.mic;
  }
  _conexion() {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pc.ontrack = (e) => { this.sonido.srcObject = e.streams[0]; this.sonido.play().catch(() => {}); };
    pc.onconnectionstatechange = () => {
      if (pc !== this.pc) return;
      if (pc.connectionState === "connected") { this.estado = "en-vivo"; this._pintar(); this.j.sonar("ding", { volumen: 0.6 }); aviso(`Ya se escuchan: estás en vivo con ${this.j.pareja}`, 2600); }
      if (["failed", "closed"].includes(pc.connectionState)) { if (this.estado !== "apagada") aviso("Se cortó la voz (la red no dejó conectarse)", 3600, "error"); this.apagar(false); }
    };
    for (const t of this.mic.getTracks()) pc.addTrack(t, this.mic);
    // Que el teléfono no la achique: hasta 128 kbps.
    for (const s of pc.getSenders()) { try { const p = s.getParameters(); p.encodings = [{ ...(p.encodings?.[0] || {}), maxBitrate: 128000 }]; s.setParameters(p).catch(() => {}); } catch (e) { /* nada */ } }
    return pc;
  }
  /** Tocar «Voz»: llama, o cuelga si ya están. */
  async alternar() {
    if (this.estado !== "apagada") return this.apagar(true);
    if (!puedeVoz()) { aviso("Este navegador no deja hablar en vivo.", 3200, "error"); return; }
    try {
      this.estado = "llamando"; this._pintar();
      await this._micro();
      this.pc = this._conexion();
      this.j.app.audio?.pausarParaVista?.(true, "voz");
      const o = await this.pc.createOffer({ offerToReceiveAudio: true });
      await this.pc.setLocalDescription({ type: "offer", sdp: hd(o.sdp) });
      await juntarIce(this.pc);
      if (this.estado !== "llamando") return;
      await SRV.casitaVoz("oferta", { sdp: this.pc.localDescription.sdp });
      aviso(`Llamando a ${this.j.pareja}… (le sale «Contestar»)`, 3200);
      clearTimeout(this._tEspera);
      this._tEspera = setTimeout(() => { if (this.estado === "llamando") { aviso(`${this.j.pareja} no contestó`, 2600); this.apagar(true); } }, 45000);
    } catch (e) {
      aviso(e?.name === "NotAllowedError" ? "Para hablar en vivo, deja usar el micrófono." : e?.status === 404 ? "Para la voz en vivo, actualiza el servidor (librito actualizar)." : "No se pudo prender la voz: " + (e.message || e), 4200, "error");
      this.apagar(false);
    }
  }
  /** Las señales que llegan con la escucha de la casita. */
  recibir(lista) {
    for (const s of lista || []) {
      if (s.tipo === "oferta" && s.datos?.sdp) this._ofrecen(s.datos.sdp);
      else if (s.tipo === "respuesta" && s.datos?.sdp && this.pc && this.estado === "llamando") this.pc.setRemoteDescription({ type: "answer", sdp: s.datos.sdp }).catch(() => this.apagar(true));
      else if (s.tipo === "colgar") { if (this.estado !== "apagada") aviso(`${this.j.pareja} colgó la voz`, 2400); this.apagar(false); this._quitarInvitacion(); }
      else if (s.tipo === "ocupado" && this.estado === "llamando") { aviso(`${this.j.pareja} no puede ahorita`, 2400); this.apagar(false); }
    }
  }
  _ofrecen(sdp) {
    if (this.estado === "en-vivo") { SRV.casitaVoz("ocupado").catch(() => {}); return; }
    // Si los dos llamaron a la vez, se queda la llamada de quien tenga el nombre «menor» (igual en los dos).
    if (this.estado === "llamando") {
      const yo = String(this.j.yoUsuario || ""), ella = String(this.j.parejaUsuario || "");
      if (yo < ella) return;
      this.apagar(false, false);
    }
    this._quitarInvitacion();
    this.j.sonar("mensaje-llega");
    this._invitacion = aviso(`${this.j.pareja} quiere hablar en vivo contigo`, 30000, "", { t: "Contestar", al: () => this._contestar(sdp) });
  }
  _quitarInvitacion() { if (this._invitacion) { try { quitarAviso(this._invitacion); } catch (e) { /* nada */ } } this._invitacion = null; }
  async _contestar(sdp) {
    this._invitacion = null;
    try {
      this.estado = "llamando"; this._pintar();
      await this._micro();
      this.pc = this._conexion();
      this.j.app.audio?.pausarParaVista?.(true, "voz");
      await this.pc.setRemoteDescription({ type: "offer", sdp });
      const r = await this.pc.createAnswer();
      await this.pc.setLocalDescription({ type: "answer", sdp: hd(r.sdp) });
      await juntarIce(this.pc);
      await SRV.casitaVoz("respuesta", { sdp: this.pc.localDescription.sdp });
    } catch (e) {
      aviso(e?.name === "NotAllowedError" ? "Para hablar en vivo, deja usar el micrófono." : "No se pudo contestar la voz.", 3600, "error");
      this.apagar(true);
    }
  }
  silenciar(on = !this.mudo) { this.mudo = on; for (const t of this.mic?.getTracks() || []) t.enabled = !on; this._pintar(); }
  apagar(avisarle = true, sonar = true) {
    clearTimeout(this._tEspera);
    const habia = this.estado !== "apagada";
    if (avisarle && habia) SRV.casitaVoz("colgar").catch(() => {});
    try { this.pc?.close(); } catch (e) { /* nada */ }
    this.pc = null;
    for (const t of this.mic?.getTracks() || []) t.stop();
    this.mic = null;
    this.sonido.srcObject = null;
    this.estado = "apagada"; this.mudo = false;
    this.j.app.audio?.pausarParaVista?.(false, "voz");
    if (habia && sonar) this.j.sonar("cerrar", { volumen: 0.5 });
    this._pintar();
  }
}
