/**
 * LOS EFECTOS DE LA CÁMARA (Fase 44) — en las videollamadas.
 *
 *   · los DEL TELÉFONO, si el navegador los deja usar (fondo borroso, encuadre automático, luz y
 *     mirada a la cámara): se detectan solos (getCapabilities) y se prenden ahí mismo. Ojo: los
 *     «Efectos de videollamada» de Samsung (suavizar la cara, fondo, luz) el teléfono sólo se los
 *     presta a las apps que Samsung eligió (WhatsApp, Meet, Zoom…), no a las páginas web; por eso
 *     también van los NUESTROS, hechos en el propio teléfono:
 *   · Suavizar: la piel de tu cara más tersita (los ojos y la boca siguen nítidos) y una luz cálida
 *   · Fondo borroso: tú nítido(a) y lo de atrás desenfocado
 *   · Teletransporte (Goku): el índice y el medio juntitos en tu frente 3 segundos… se junta la
 *     energía, ¡desapareces! (5 segundos invisible: donde estabas se ve el fondo, de tu tamaño) y
 *     vuelves con un destello. Tu amorcito lo ve igualito (y oye el «fiuuu»).
 * Para separarte del fondo y ver tu cara y tus manos se usa MediaPipe, que corre EN el teléfono (nada
 * de tu cámara sale a otro lado); se descarga la primera vez que prendes un efecto y queda guardado.
 * Lo que sale por la llamada es un lienzo (captureStream): sin efectos va la cámara tal cual.
 */
import { dedosEnFrente, Carga } from "./gesto.js";

const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODELOS = "https://storage.googleapis.com/mediapipe-models";
const MAX_LADO = [1280, 960, 640];        // si el teléfono no alcanza, se baja un escalón
const IDA = 650, INVISIBLE = 5000, VUELTA = 750;

/* — Los del teléfono — */
export const NATIVOS = [
  ["backgroundBlur", "Fondo borroso del teléfono"],
  ["faceFraming", "Encuadre automático"],
  ["lightingCorrection", "Luz automática"],
  ["eyeGazeCorrection", "Mirada a la cámara"],
];
export function nativos(track) {
  let c = {}, s = {};
  try { c = track?.getCapabilities?.() || {}; s = track?.getSettings?.() || {}; } catch (e) { /* nada */ }
  return NATIVOS.filter(([k]) => (Array.isArray(c[k]) ? c[k].includes(true) : c[k] === true))
    .map(([k, t]) => ({ k, t, on: !!s[k], fijo: Array.isArray(c[k]) && c[k].length === 1 }));
}
/** Prende o apaga uno del teléfono (sin perder la resolución que ya se pidió). */
export async function ponerNativo(track, k, on) {
  await track.applyConstraints({ ...track.getConstraints(), [k]: on });
  return !!track.getSettings()[k];
}

/* — MediaPipe (una sola vez para toda la app) — */
let _vision = null;
const vision = () => (_vision ||= (async () => {
  const m = await import(/* webpackIgnore: true */ MP + "/vision_bundle.mjs");
  return { m, fs: await m.FilesetResolver.forVisionTasks(MP + "/wasm") };
})().catch((e) => { _vision = null; throw e; }));
async function tarea(clase, ruta, extra) {
  const { m, fs } = await vision();
  const op = (delegate) => ({ baseOptions: { modelAssetPath: MODELOS + ruta, delegate }, runningMode: "VIDEO", ...extra });
  try { return await m[clase].createFromOptions(fs, op("GPU")); } catch (e) { return m[clase].createFromOptions(fs, op("CPU")); }
}
const MOD = {
  seg: () => tarea("ImageSegmenter", "/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite", { outputCategoryMask: false, outputConfidenceMasks: true }),
  cara: () => tarea("FaceDetector", "/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite", { minDetectionConfidence: 0.5 }),
  mano: () => tarea("HandLandmarker", "/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", { numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.4 }),
};
const NECESITA = { suave: ["cara"], fondo: ["seg"], goku: ["seg", "cara", "mano"] };
const _cargados = {};
const cargar = (k) => (_cargados[k] ||= MOD[k]().catch((e) => { delete _cargados[k]; throw e; }));

const lienzo = (w = 2, h = 2) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const ctx2 = (c) => c.getContext("2d", { alpha: true });
const ajustar = (c, w, h) => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; };
const suave = (t) => t * t * (3 - 2 * t);

export class Efectos {
  /** `alCambio(qué, valor)`: «carga» (0…1), «ida», «invisible», «vuelta», «normal», «lento». */
  constructor({ alCambio } = {}) {
    this.on = { suave: false, fondo: false, goku: false };
    this.alCambio = alCambio || (() => {});
    this.m = {};                               // las tareas de MediaPipe ya listas
    this.v = Object.assign(document.createElement("video"), { muted: true, playsInline: true });
    this.v.setAttribute("playsinline", "");
    this.v.className = "ll-fuente";
    this.salida = lienzo(1280, 720);
    this.o = ctx2(this.salida);
    this.fase = "normal"; this.t0 = 0; this.descanso = 0;
    this.carga = new Carga(3000, 450);
    this._ts = 0; this._n = 0; this._lento = 0; this._escalon = 0;
    this.c = { chico: lienzo(), muy: lienzo(), persona: lienzo(), cara: lienzo(), mc: lienzo(), md: lienzo(), placa: lienzo(), solo: lienzo(), relleno: lienzo(), hueco: lienzo(), aura: lienzo() };
    this.x = Object.fromEntries(Object.entries(this.c).map(([k, c]) => [k, ctx2(c)]));
    this.piramide = [];
    this.cam = null; this.track = null; this._caja = null; this._manos = null; this._centro = null; this.hayMascara = false; this.hayPlaca = false;
  }

  get activo() { return this.on.suave || this.on.fondo || this.on.goku || this.fase !== "normal"; }

  /** La cámara de verdad (al voltearla se cambia aquí y la salida sigue siendo la misma). */
  camara(track) {
    this.cam = track;
    this.v.srcObject = track ? new MediaStream([track]) : null;
    if (track) { if (!this.v.isConnected) document.body.append(this.v); this.v.play().catch(() => {}); this.hayPlaca = false; this._bucle(); }
  }

  /** Lo que tiene que salir por la llamada: con efectos, el lienzo; sin ellos, la cámara tal cual. */
  pista() {
    if (!this.activo) return this.cam;
    if (!this.track || this.track.readyState === "ended") this.track = this.salida.captureStream(30).getVideoTracks()[0];
    if (this.track) this.track.contentHint = "motion";
    return this.track;
  }

  /** Prende o apaga uno (descarga lo que haga falta la primera vez). */
  async poner(k, on) {
    if (on) {
      const faltan = NECESITA[k].filter((t) => !this.m[t]);
      const listos = await Promise.all(faltan.map(cargar));
      faltan.forEach((t, i) => { this.m[t] = listos[i]; });
    }
    this.on[k] = !!on;
    if (k === "goku" && !on) { this.carga.reiniciar(); this.alCambio("carga", 0); }
    if (k === "goku" && on) this.hayPlaca = false;
    this._bucle();
  }

  /** ¡Teletransporte! (también se puede sin el gesto, con el botón). */
  async teletransportar() {
    if (this.fase !== "normal") return;
    if (!this.on.goku) await this.poner("goku", true);
    this._fase("ida");
  }

  _fase(f) {
    this.fase = f; this.t0 = performance.now();
    if (f === "normal") { this.carga.reiniciar(); this.descanso = this.t0 + 1500; }
    this.alCambio(f);
  }

  cerrar() {
    this.on = { suave: false, fondo: false, goku: false }; this.fase = "normal";
    this.track?.stop(); this.track = null;
    this.v.srcObject = null; this.v.remove();
    this.cam = null;
  }

  _bucle() {
    if (this._corre || !this.cam) return;
    this._corre = true;
    const v = this.v;
    const paso = () => {
      if (!this.activo || !this.cam) { this._corre = false; return; }
      const t = performance.now();
      try { this._cuadro(t); } catch (e) { console.warn("efecto:", e); }
      this._medir(performance.now() - t);
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(paso); else requestAnimationFrame(paso);
    };
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(paso); else requestAnimationFrame(paso);
  }

  /** Si cada cuadro tarda demasiado (teléfono lento o calientito), se baja la resolución un escalón. */
  _medir(ms) {
    this._lento = this._lento * 0.95 + ms * 0.05;
    if (this._lento > 42 && this._n > 90 && this._escalon < MAX_LADO.length - 1) { this._escalon++; this._lento = 20; this.alCambio("lento", MAX_LADO[this._escalon]); }
  }

  _cuadro(t) {
    const v = this.v, vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || v.readyState < 2) return;
    const k = Math.min(1, MAX_LADO[this._escalon] / Math.max(vw, vh));
    const W = Math.round((vw * k) / 2) * 2, H = Math.round((vh * k) / 2) * 2;
    ajustar(this.salida, W, H);
    const ts = (this._ts = Math.max(this._ts + 1, t));
    const n = ++this._n, goku = this.on.goku || this.fase !== "normal";

    // 1) Lo que ve la inteligencia: la persona (cada cuadro), la cara y las manos (uno sí y uno no).
    if ((this.on.fondo || goku) && this.m.seg) this.m.seg.segmentForVideo(v, ts, (r) => { const m = r.confidenceMasks?.[0]; if (m) this._mascara(m, goku); });
    if ((this.on.suave || goku) && this.m.cara && (n % 2 === 0 || !goku)) this._verCara(this.m.cara.detectForVideo(v, ts).detections?.[0], W, H);
    if (goku && this.m.mano && this.fase === "normal" && n % 2 === 1) this._manos = this.m.mano.detectForVideo(v, ts).landmarks || [];

    // 2) El gesto: 3 segundos con los dedos en la frente.
    if (this.on.goku && this.fase === "normal" && t > this.descanso) {
      const si = !!(this._puntosCara && this._manos?.some((m) => dedosEnFrente(m, this._puntosCara, vw / vh)));
      const antes = this.carga.valor, p = this.carga.paso(si, t);
      if (p !== antes) this.alCambio("carga", p);
      if (p >= 1) this._fase("ida");
    }
    const dura = { ida: IDA, invisible: INVISIBLE, vuelta: VUELTA }[this.fase];
    if (dura && t - this.t0 > dura) this._fase({ ida: "invisible", invisible: "vuelta", vuelta: "normal" }[this.fase]);
    const tf = performance.now() - this.t0;   // (ya con la fase nueva: si no, ese cuadro se te vería un instante)

    // 3) Armar el cuadro.
    const o = this.o, X = this.x;
    o.globalAlpha = 1; o.globalCompositeOperation = "source-over"; o.imageSmoothingEnabled = true; o.imageSmoothingQuality = "high";
    const necesitaChico = this.on.suave || this.on.fondo;
    if (necesitaChico) { ajustar(this.c.chico, Math.max(2, W >> 3), Math.max(2, H >> 3)); X.chico.drawImage(v, 0, 0, this.c.chico.width, this.c.chico.height); }
    if (this.on.fondo && this.hayMascara) {
      const mu = ajustar(this.c.muy, Math.max(2, W >> 5), Math.max(2, H >> 5));
      X.muy.drawImage(this.c.chico, 0, 0, mu.width, mu.height);
      o.drawImage(mu, 0, 0, W, H);                       // lo de atrás, muy borroso
      o.drawImage(this._persona(v, W, H, "mc"), 0, 0);   // y tú, nítido(a)
    } else o.drawImage(v, 0, 0, W, H);
    if (this.on.suave && this._caja) this._suavizar(W, H);
    if (goku) this._goku(v, W, H, t, tf, n);
  }

  /** La máscara de la persona: suave (para recortar bonito) y engordadita (para desaparecer sin dejar orillas). */
  _mascara(m, engordar) {
    const w = m.width, h = m.height, f = m.getAsFloat32Array();
    if (!this._img || this._img.width !== w || this._img.height !== h) {
      this._img = new ImageData(w, h); this._img2 = new ImageData(w, h);
      this._bin = new Uint8Array(w * h); this._tmp = new Uint8Array(w * h);
      ajustar(this.c.mc, w, h); ajustar(this.c.md, w, h);
    }
    const a = this._img.data, bin = this._bin;
    let sx = 0, cnt = 0, x0 = w, x1 = 0;
    for (let i = 0, j = 3; i < f.length; i++, j += 4) {
      const c = f[i];
      a[j] = c <= 0.3 ? 0 : c >= 0.7 ? 255 : ((c - 0.3) * 637.5) | 0;
      const b = c > 0.15 ? 1 : 0;
      bin[i] = b;
      if (b) { const x = i % w; sx += x; cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    }
    this.x.mc.putImageData(this._img, 0, 0);
    this.hayMascara = true;
    this._centro = cnt > w * h * 0.01 ? { x: sx / cnt / w, ancho: (x1 - x0 + 1) / w } : null;
    if (!engordar) return;
    this._engordar(w, h, Math.max(3, Math.round(w / 36)));
    this.x.md.putImageData(this._img2, 0, 0);
  }

  /** Engorda la máscara r píxeles (un «máximo» por filas y luego por columnas, en tiempo lineal). */
  _engordar(w, h, r) {
    const bin = this._bin, tmp = this._tmp, out = this._img2.data;
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let ult = -1e9;
      for (let x = 0; x < w; x++) { if (bin[o + x]) ult = x; tmp[o + x] = x - ult <= r ? 1 : 0; }
      ult = 1e9;
      for (let x = w - 1; x >= 0; x--) { if (bin[o + x]) ult = x; if (ult - x <= r) tmp[o + x] = 1; }
    }
    for (let x = 0; x < w; x++) {
      let ult = -1e9;
      for (let y = 0; y < h; y++) { const i = y * w + x; if (tmp[i]) ult = y; out[i * 4 + 3] = y - ult <= r ? 255 : 0; }
      ult = 1e9;
      for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (tmp[i]) ult = y; if (ult - y <= r) out[i * 4 + 3] = 255; }
    }
  }

  /** Tú, recortado(a) del fondo (con la máscara suave o la gordita). */
  _persona(v, W, H, cual) {
    const p = ajustar(this.c.persona, W, H), x = this.x.persona;
    x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, W, H);
    x.drawImage(v, 0, 0, W, H);
    x.globalCompositeOperation = "destination-in";
    x.drawImage(this.c[cual], 0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    return p;
  }

  _verCara(det, W, H) {
    if (!det) { this._sinCara = (this._sinCara || 0) + 1; if (this._sinCara > 8) { this._caja = null; this._puntosCara = null; } return; }
    this._sinCara = 0;
    const b = det.boundingBox, vw = this.v.videoWidth, k = W / vw;
    const nueva = { x: b.originX * k, y: b.originY * k, w: b.width * k, h: b.height * k };
    const c = this._caja;
    // Suavizado (si no, la zona tersita «tiembla» con la cara).
    this._caja = c ? { x: c.x * 0.6 + nueva.x * 0.4, y: c.y * 0.6 + nueva.y * 0.4, w: c.w * 0.6 + nueva.w * 0.4, h: c.h * 0.6 + nueva.h * 0.4 } : nueva;
    this._puntosCara = det.keypoints?.length >= 4 ? det.keypoints : null;
  }

  /** La piel más tersita: una copia borrosita sólo en la cara (sin los ojos ni la boca) y luz cálida. */
  _suavizar(W, H) {
    const c = this._caja, o = this.o;
    const rx = c.w * 0.62, ry = c.h * 0.78, cx = c.x + c.w / 2, cy = c.y + c.h * 0.42;
    const zx = Math.max(0, Math.floor(cx - rx)), zy = Math.max(0, Math.floor(cy - ry));
    const zw = Math.min(W - zx, Math.ceil(rx * 2)), zh = Math.min(H - zy, Math.ceil(ry * 2));
    if (zw < 8 || zh < 8) return;
    const s = ajustar(this.c.cara, zw, zh), x = this.x.cara;
    x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, zw, zh);
    const ch = this.c.chico, kx = ch.width / W, ky = ch.height / H;
    x.imageSmoothingQuality = "high";
    x.drawImage(ch, zx * kx, zy * ky, zw * kx, zh * ky, 0, 0, zw, zh);
    // Sólo dentro del óvalo de la cara, con la orilla difuminada.
    x.globalCompositeOperation = "destination-in";
    x.save(); x.translate(cx - zx, cy - zy); x.scale(1, ry / rx);
    const g = x.createRadialGradient(0, 0, rx * 0.45, 0, 0, rx);
    g.addColorStop(0, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore();
    // Los ojos y la boca, nítidos.
    const kp = this._puntosCara;
    if (kp) {
      x.globalCompositeOperation = "destination-out";
      const vw = this.v.videoWidth, vh = this.v.videoHeight, kk = W / vw;
      for (const [i, r] of [[0, 0.2], [1, 0.2], [3, 0.26]]) {
        const p = kp[i]; if (!p) continue;
        const px = p.x * vw * kk - zx, py = p.y * vh * kk - zy, rr = c.w * r;
        const gg = x.createRadialGradient(px, py, rr * 0.35, px, py, rr);
        gg.addColorStop(0, "#000"); gg.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = gg; x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
    }
    x.globalCompositeOperation = "source-over";
    o.globalAlpha = 0.6; o.drawImage(s, zx, zy); o.globalAlpha = 1;
    // Una luz cálida y suavecita.
    o.globalCompositeOperation = "soft-light"; o.fillStyle = "rgba(255, 214, 190, .22)"; o.fillRect(0, 0, W, H);
    o.globalCompositeOperation = "source-over";
  }

  /* ── Teletransporte ── */
  _goku(v, W, H, t, tf, n) {
    const PW = Math.max(2, W >> 1), PH = Math.max(2, H >> 1), X = this.x, C = this.c;
    // La «placa»: el fondo que hay detrás de ti, que se va guardando (donde no estás) cuadro a cuadro.
    if (this.hayMascara && n % 2 === 0) {
      ajustar(C.solo, PW, PH); X.solo.globalCompositeOperation = "source-over"; X.solo.clearRect(0, 0, PW, PH);
      X.solo.drawImage(v, 0, 0, PW, PH);
      X.solo.globalCompositeOperation = "destination-out"; X.solo.drawImage(C.md, 0, 0, PW, PH);
      X.solo.globalCompositeOperation = "source-over";
      if (C.placa.width !== PW || C.placa.height !== PH) { ajustar(C.placa, PW, PH); this.hayPlaca = false; }
      X.placa.globalAlpha = this.hayPlaca ? 0.3 : 1; X.placa.drawImage(C.solo, 0, 0); X.placa.globalAlpha = 1;
      this.hayPlaca = true;
    }
    const sinMi = this.fase === "invisible" || (this.fase === "ida" && tf > IDA * 0.3) || (this.fase === "vuelta" && tf < VUELTA * 0.6);
    if (sinMi && this.hayPlaca) {
      if (n % 3 === 0 || !this._rellenoListo) this._rellenar(PW, PH);
      // Donde estás tú se pone el fondo (de tu tamaño, aunque te muevas).
      const hu = ajustar(C.hueco, PW, PH), xh = X.hueco;
      xh.globalCompositeOperation = "source-over"; xh.clearRect(0, 0, PW, PH);
      xh.drawImage(C.relleno, 0, 0);
      xh.globalCompositeOperation = "destination-in"; xh.drawImage(C.md, 0, 0, PW, PH);
      xh.globalCompositeOperation = "source-over";
      this.o.drawImage(hu, 0, 0, W, H);
    } else this._rellenoListo = false;
    const cx = (this._centro?.x ?? 0.5) * W, ancho = (this._centro?.ancho ?? 0.4) * W;
    if (this.fase === "normal" && this.carga.valor > 0) this._energia(W, H, this.carga.valor, t);
    else if (this.fase === "ida") this._destello(v, W, H, cx, ancho, tf / IDA, true, n);
    else if (this.fase === "vuelta") this._destello(v, W, H, cx, ancho, tf / VUELTA, false, n);
  }

  /** Rellena los huecos de la placa (lo que nunca se vio detrás de ti) con los colores de alrededor:
   *  se achica en escalones hasta quedar chiquita y se vuelve a agrandar, tapando los huecos. */
  _rellenar(PW, PH) {
    const niveles = [];
    let w = PW, h = PH, prev = this.c.placa;
    for (let i = 0; w > 6 && h > 6; i++) {
      w = Math.max(2, w >> 1); h = Math.max(2, h >> 1);
      const c = (this.piramide[i] ||= lienzo());
      ajustar(c, w, h);
      const x = ctx2(c); x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, w, h); x.imageSmoothingQuality = "high";
      x.drawImage(prev, 0, 0, w, h);
      niveles.push(c); prev = c;
    }
    const ult = niveles[niveles.length - 1];
    if (ult) {
      // Lo más chiquito queda sin huecos: lo que nunca se vio (justo detrás de ti) toma el color de
      // alrededor, y si ni así, el color promedio del fondo.
      const x = ctx2(ult);
      for (let i = 0; i < 4; i++) x.drawImage(ult, 0, 0);
      this._uno ||= lienzo(1, 1);
      const xu = (this._xu ||= this._uno.getContext("2d", { willReadFrequently: true }));
      xu.clearRect(0, 0, 1, 1); xu.drawImage(ult, 0, 0, 1, 1);
      const [r, g, b, a] = xu.getImageData(0, 0, 1, 1).data;
      x.globalCompositeOperation = "destination-over"; x.fillStyle = a ? `rgb(${r},${g},${b})` : "#777"; x.fillRect(0, 0, ult.width, ult.height);
      x.globalCompositeOperation = "source-over";
    }
    // De lo chiquito a lo grande: cada escalón tapa sus huecos con el de abajo, agrandado.
    for (let i = niveles.length - 2; i >= 0; i--) {
      const x = ctx2(niveles[i]);
      x.globalCompositeOperation = "destination-over"; x.drawImage(niveles[i + 1], 0, 0, niveles[i].width, niveles[i].height);
      x.globalCompositeOperation = "source-over";
    }
    const r = ajustar(this.c.relleno, PW, PH), x = ctx2(r);
    x.clearRect(0, 0, PW, PH);
    if (niveles[0]) x.drawImage(niveles[0], 0, 0, PW, PH);
    x.drawImage(this.c.placa, 0, 0);
    this._rellenoListo = true;
  }

  /** Juntando energía: una lucecita en tus dedos que crece, chispitas y un aura azul. */
  _energia(W, H, p, t) {
    const o = this.o, m = this._manos?.[0];
    const e = W / 1280;
    if (m) {
      const px = ((m[8].x + m[12].x) / 2) * W, py = ((m[8].y + m[12].y) / 2) * H, r = (18 + 70 * p) * e;
      o.globalCompositeOperation = "lighter";
      const g = o.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(255,255,255,${0.95 * p})`); g.addColorStop(0.35, `rgba(150,230,255,${0.7 * p})`); g.addColorStop(1, "rgba(80,160,255,0)");
      o.fillStyle = g; o.fillRect(px - r, py - r, r * 2, r * 2);
      for (let i = 0; i < 7; i++) {
        const a = t / 260 + (i * Math.PI * 2) / 7, rr = r * (1.1 + 0.25 * Math.sin(t / 140 + i));
        o.fillStyle = `rgba(200,245,255,${0.85 * p})`;
        o.beginPath(); o.arc(px + Math.cos(a) * rr, py + Math.sin(a) * rr, (2 + 3 * p) * e, 0, Math.PI * 2); o.fill();
      }
      o.globalCompositeOperation = "source-over";
    }
    if (p > 0.35 && this.hayMascara) this._aura(W, H, ((p - 0.35) / 0.65) * 0.55, "rgb(120, 210, 255)");
  }

  _aura(W, H, a, color) {
    const A = ajustar(this.c.aura, Math.max(2, W >> 2), Math.max(2, H >> 2)), x = this.x.aura;
    x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, A.width, A.height);
    x.drawImage(this.c.md, 0, 0, A.width, A.height);
    x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, A.width, A.height);
    x.globalCompositeOperation = "source-over";
    const o = this.o;
    o.globalCompositeOperation = "screen"; o.globalAlpha = a;
    o.drawImage(A, -W * 0.02, -H * 0.02, W * 1.04, H * 1.04);
    o.globalAlpha = 1; o.globalCompositeOperation = "source-over";
  }

  /** Desaparecer (ida) o aparecer (vuelta): te vuelves luz, te estiras en una rayita y ¡fiuuu! */
  _destello(v, W, H, cx, ancho, t, ida, n) {
    t = Math.max(0, Math.min(1, t));
    const o = this.o;
    // Cuánto de ti se ve (a lo ancho) y qué tan blanco(a).
    let sx, blanco;
    if (ida) { sx = t < 0.3 ? 1 : 1 - suave((t - 0.3) / 0.7); blanco = Math.min(1, t / 0.3); }
    else { sx = t < 0.15 ? 0 : suave(Math.min(1, (t - 0.15) / 0.45)); blanco = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4; }
    if (ida && t < 0.3 && n % 2) blanco *= 0.55;   // parpadea mientras se va
    if (sx > 0.01 && this.hayMascara) {
      const p = this._persona(v, W, H, "mc"), x = this.x.persona;
      if (blanco > 0) { x.globalCompositeOperation = "source-atop"; x.fillStyle = `rgba(235,250,255,${0.9 * blanco})`; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over"; }
      // (Al irte, primero sólo brillas; al volver, al final ya estás y sólo se te quita lo blanco.)
      if (ida ? t >= 0.3 : t < 0.6) { o.save(); o.translate(cx, 0); o.scale(sx, 1); o.translate(-cx, 0); o.drawImage(p, 0, 0); o.restore(); }
      else o.drawImage(p, 0, 0);
    }
    // Las rayitas de velocidad (de arriba a abajo) donde estás.
    const fuerza = ida ? (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75) : (t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5);
    if (fuerza > 0) {
      o.globalCompositeOperation = "lighter";
      let s = (n * 9301 + 49297) % 233280;
      const azar = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      const anchoR = Math.max(ancho * Math.max(sx, 0.08), W * 0.02);
      for (let i = 0; i < 14; i++) {
        const lx = cx + (azar() - 0.5) * anchoR * 1.3, lw = (1 + azar() * 3) * (W / 640), ly = azar() * H * 0.5, lh = H * (0.35 + azar() * 0.6);
        const g = o.createLinearGradient(0, ly, 0, ly + lh);
        g.addColorStop(0, "rgba(160,230,255,0)"); g.addColorStop(0.5, `rgba(225,248,255,${0.8 * fuerza})`); g.addColorStop(1, "rgba(160,230,255,0)");
        o.fillStyle = g; o.fillRect(lx, ly, lw, lh);
      }
      // La rayita de luz en el centro (cuando ya casi no estás, o cuando vas llegando).
      const brillo = ida ? (t > 0.55 ? 1 - (t - 0.55) / 0.45 : t > 0.3 ? 1 : 0) : (t < 0.35 ? t / 0.35 : Math.max(0, 1 - (t - 0.35) / 0.3));
      if (brillo > 0) {
        const lw = W * 0.012 * (1 + (ida ? 0 : 1 - sx));
        const g = o.createLinearGradient(cx - lw * 3, 0, cx + lw * 3, 0);
        g.addColorStop(0, "rgba(140,220,255,0)"); g.addColorStop(0.5, `rgba(255,255,255,${0.95 * brillo})`); g.addColorStop(1, "rgba(140,220,255,0)");
        o.fillStyle = g; o.fillRect(cx - lw * 3, 0, lw * 6, H);
      }
      o.globalCompositeOperation = "source-over";
    }
    // El destello en toda la pantalla.
    const fl = ida ? (t > 0.3 && t < 0.6 ? 1 - (t - 0.3) / 0.3 : 0) : (t < 0.3 ? 1 - Math.abs(t - 0.12) / 0.18 : 0);
    if (fl > 0) {
      const g = o.createRadialGradient(cx, H * 0.45, 0, cx, H * 0.45, Math.max(W, H) * 0.75);
      g.addColorStop(0, `rgba(255,255,255,${0.75 * fl})`); g.addColorStop(0.4, `rgba(190,235,255,${0.35 * fl})`); g.addColorStop(1, "rgba(190,235,255,0)");
      o.fillStyle = g; o.fillRect(0, 0, W, H);
    }
  }
}
