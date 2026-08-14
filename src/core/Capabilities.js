/**
 * CAPABILITIES — qué puede aguantar este dispositivo.
 *
 * Clasifica el aparato en tres niveles (low / mid / high) y expone un
 * presupuesto de efectos. El resto del motor jamás pregunta "¿es un iPhone?",
 * pregunta "¿cuántas partículas puedo permitirme?".
 *
 * El nivel no es fijo: Loop.js mide FPS reales y puede degradarlo en caliente.
 */

import { Emitter } from "./Emitter.js";

const TIERS = {
  low: {
    name: "low",
    dprCap: 1.25,
    particles: 220,
    antialias: false,
    grain: false,
    blur: false,
    shadowQuality: 0,
    depthPhotos: false,
    maxTextureSize: 1024,
  },
  mid: {
    name: "mid",
    dprCap: 1.75,
    particles: 650,
    antialias: false,
    grain: true,
    blur: true,
    shadowQuality: 1,
    depthPhotos: true,
    maxTextureSize: 1536,
  },
  high: {
    name: "high",
    dprCap: 2,
    particles: 1400,
    antialias: true,
    grain: true,
    blur: true,
    shadowQuality: 2,
    depthPhotos: true,
    maxTextureSize: 2048,
  },
};

function detectWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
    if (!gl) return { supported: false, renderer: "" };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    const loseCtx = gl.getExtension("WEBGL_lose_context");
    loseCtx?.loseContext();
    return { supported: true, renderer };
  } catch {
    return { supported: false, renderer: "" };
  }
}

function guessTier({ webgl2, renderer }) {
  if (!webgl2) return "low";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const r = renderer.toLowerCase();

  // GPUs de software o integradas muy antiguas: directo a low.
  if (/swiftshader|llvmpipe|software|mesa offscreen/.test(r)) return "low";

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : cores >= 4 ? 0 : -2;
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : memory >= 2 ? 0 : -2;

  // Apple: incluso los iPhone de gama media mueven WebGL muy bien.
  if (/apple/.test(r)) score += 2;
  if (/adreno\s*(7\d\d|6[5-9]\d)/.test(r)) score += 2;
  else if (/adreno\s*6\d\d/.test(r)) score += 1;
  if (/mali-g[7-9]\d/.test(r)) score += 2;
  else if (/mali-g[5-6]\d/.test(r)) score += 1;
  else if (/mali-[tt]/.test(r)) score -= 2;
  if (/nvidia|radeon rx|intel.*(iris|arc)/.test(r)) score += 2;

  // Pantallas enormes con GPU modesta sufren: penaliza.
  const pixels = window.screen.width * window.screen.height * (window.devicePixelRatio || 1);
  if (pixels > 4_000_000 && score < 3) score -= 1;

  if (score >= 4) return "high";
  if (score >= 1) return "mid";
  return "low";
}

export class Capabilities extends Emitter {
  constructor() {
    super();
    const gl = detectWebGL2();

    this.webgl2 = gl.supported;
    this.renderer = gl.renderer;
    this.touch = matchMedia("(hover: none) and (pointer: coarse)").matches;
    this.pointerFine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.vibrate = typeof navigator.vibrate === "function";
    this.deviceOrientation = "DeviceOrientationEvent" in window;
    this.needsMotionPermission =
      this.deviceOrientation &&
      typeof window.DeviceOrientationEvent.requestPermission === "function";
    this.standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    this.tierName = this.reducedMotion ? "low" : guessTier({ webgl2: this.webgl2, renderer: this.renderer });
    this.budget = { ...TIERS[this.tierName] };

    // Permite forzar el nivel desde la URL para depurar: ?tier=low
    const forced = new URLSearchParams(location.search).get("tier");
    if (forced && TIERS[forced]) this.setTier(forced);

    document.documentElement.dataset.tier = this.tierName;
    document.documentElement.dataset.input = this.touch ? "touch" : "pointer";

    // Si el usuario cambia su preferencia de movimiento en caliente.
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      this.reducedMotion = e.matches;
      if (e.matches) this.setTier("low");
      this.emit("motionpref", e.matches);
    });
  }

  /** Cambia de nivel (manual o por caída de FPS). */
  setTier(name) {
    if (!TIERS[name] || name === this.tierName) return false;
    this.tierName = name;
    this.budget = { ...TIERS[name] };
    document.documentElement.dataset.tier = name;
    this.emit("tier", this.budget);
    return true;
  }

  /** Baja un escalón. Lo llama el vigilante de FPS. */
  degrade() {
    if (this.tierName === "high") return this.setTier("mid");
    if (this.tierName === "mid") return this.setTier("low");
    return false;
  }

  /** DPR efectivo para cualquier canvas del proyecto. */
  get dpr() {
    return Math.min(window.devicePixelRatio || 1, this.budget.dprCap);
  }

  /** Pide permiso de giroscopio en iOS (debe salir de un gesto del usuario). */
  async requestMotionPermission() {
    if (!this.needsMotionPermission) return this.deviceOrientation;
    try {
      const state = await window.DeviceOrientationEvent.requestPermission();
      return state === "granted";
    } catch {
      return false;
    }
  }
}
