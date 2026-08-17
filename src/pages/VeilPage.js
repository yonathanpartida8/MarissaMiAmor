/**
 * VEILPAGE — hay que acariciar la pantalla.
 *
 * Dos ilustraciones veladas, una detrás de otra. Al pasar el dedo el velo se
 * retira por donde pasas, con el filo brillando y el color volviendo. No hay
 * botones ni instrucciones: sólo una pantalla que reacciona al tacto y una
 * pista que aparece si tarda demasiado en probar.
 *
 * La máscara del dedo se pinta en un canvas 2D y se sube a la GPU sólo cuando
 * cambia, no en cada frame.
 */

import * as THREE from "three";
import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { veilVertex, veilFragment } from "../gl/shaders/veil.js";
import { el, splitWords, setVars } from "../utils/dom.js";
import { clamp01, damp } from "../utils/math.js";

const MASK_SIZE = 256;

export default class VeilPage extends BasePage {
  static type = "veil";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.veil", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent });

    this.proseEl = el("div.prose.veil__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.fallback = el("div.veil__fallback");

    this.root.append(
      this.fallback,
      el("div.veil__surface", { "data-claim-drag": "" }),
      el("div.veil__card", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.veil__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.veil__scroll", {}, [this.proseEl]),
      ]),
      el("div.veil__meter", {}, [el("i")])
    );

    this.surface = this.root.querySelector(".veil__surface");
    this.meterFill = this.root.querySelector(".veil__meter i");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const images = await Promise.all(
      this.photos.map((p) => this.ctx.assets.load(p.src).catch(() => null))
    );
    this.images = images.filter(Boolean);

    if (this.images.length) {
      this.fallback.style.backgroundImage = `url("${this.photos[0].src}")`;
    }

    const gl = this.ctx.gl;
    this.useGL = gl?.ready && this.ctx.caps.budget.depthPhotos && this.images.length > 0;

    if (this.useGL) {
      this.#buildMask();
      this.#mountPlane();
      this.root.classList.add("has-gl");
    } else {
      // Sin WebGL, el velo se hace con un filtro CSS que se retira al tocar.
      this.root.classList.add("no-gl");
    }

    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.revealed = 0;
    this.reveal = 0;
    this.strokes = 0;
    this.currentImage = 0;

    const toUv = (e) => {
      const rect = this.root.getBoundingClientRect();
      return {
        x: clamp01((e.x - rect.left) / rect.width),
        y: clamp01((e.y - rect.top) / rect.height),
      };
    };

    this.addGestures(
      new Gestures(
        this.surface,
        {
          onDown: (e) => this.#touch(toUv(e), 0.7),
          onPan: (e) => this.#touch(toUv(e), Math.min(1, Math.hypot(e.vx, e.vy) * 2.4)),
          onPanEnd: () => (this.lastPoint = null),
          onUp: () => (this.lastPoint = null),
          onDoubleTap: () => this.#swapImage(),
        },
        { exclusive: true, threshold: 2 }
      )
    );

    this.addTicker((dt, t) => this.#frame(dt, t), 12);
  }

  /** Canvas donde se pinta por dónde ha pasado el dedo. */
  #buildMask() {
    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = this.maskCanvas.height = MASK_SIZE;
    this.maskCtx = this.maskCanvas.getContext("2d");
    this.maskCtx.clearRect(0, 0, MASK_SIZE, MASK_SIZE);

    this.maskTexture = new THREE.CanvasTexture(this.maskCanvas);
    this.maskTexture.minFilter = THREE.LinearFilter;
    this.maskTexture.magFilter = THREE.LinearFilter;
    this.maskTexture.generateMipmaps = false;
  }

  #mountPlane() {
    const gl = this.ctx.gl;
    const img = this.images[this.currentImage || 0];
    const distance = gl.camera.position.z;
    const worldHeight = gl.worldHeightAt(distance);
    const worldWidth = worldHeight * gl.camera.aspect;

    const planeAspect = worldWidth / worldHeight;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cover =
      imgAspect > planeAspect
        ? new THREE.Vector2(planeAspect / imgAspect, 1)
        : new THREE.Vector2(1, imgAspect / planeAspect);

    this.uniforms = {
      uMap: { value: gl.texture(img) },
      uMask: { value: this.maskTexture },
      uCover: { value: cover },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uAccent: { value: new THREE.Color(this.palette.a) },
      uPointer: { value: new THREE.Vector2() },
      uQuality: { value: this.ctx.caps.tierName === "low" ? 0 : 1 },
    };

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(worldWidth * 1.04, worldHeight * 1.04),
      new THREE.ShaderMaterial({
        vertexShader: veilVertex,
        fragmentShader: veilFragment,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
      })
    );
    this.mesh.position.z = 0.2;
    this.unmountGL = gl.mount(this.mesh);
  }

  /** Pinta el paso del dedo en la máscara. */
  #touch(uv, pressure) {
    this.ctx.haptics.scrub(0.25 + pressure * 0.4);
    this.root.classList.add("is-touched");

    if (!this.useGL) {
      setVars(this.root, { "--cx": `${uv.x * 100}%`, "--cy": `${uv.y * 100}%` });
      this.revealed = clamp01(this.revealed + 0.02);
      this.#updateMeter();
      return;
    }

    const ctx = this.maskCtx;
    const x = uv.x * MASK_SIZE;
    const y = uv.y * MASK_SIZE;
    const radius = MASK_SIZE * 0.085 * (0.8 + pressure * 0.4);

    ctx.globalCompositeOperation = "source-over";

    // Trazo continuo entre la posición anterior y ésta.
    if (this.lastPoint) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Y una mancha suave en la punta, para que el borde no sea duro.
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    this.lastPoint = { x, y };
    this.maskTexture.needsUpdate = true;
    this.maskDirty = true;
    this.strokes++;
  }

  /** Segunda ilustración: al tocar dos veces, cambia lo que hay detrás. */
  #swapImage() {
    if (!this.useGL || this.images.length < 2) return;
    this.currentImage = (this.currentImage + 1) % this.images.length;
    this.uniforms.uMap.value = this.ctx.gl.texture(this.images[this.currentImage]);
    this.ctx.haptics.play("reveal");
    this.ctx.gl?.pulse(0.5);
  }

  /** Mide cuánto se ha descubierto, sin hacerlo en cada frame. */
  #measure() {
    if (!this.maskCtx) return;
    const step = 8;
    const data = this.maskCtx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
    let hit = 0;
    let total = 0;
    for (let y = 0; y < MASK_SIZE; y += step) {
      for (let x = 0; x < MASK_SIZE; x += step) {
        if (data[(y * MASK_SIZE + x) * 4 + 3] > 90) hit++;
        total++;
      }
    }
    this.revealed = clamp01(hit / total / 0.55);
    this.#updateMeter();
  }

  #updateMeter() {
    this.meterFill.style.transform = `scaleX(${this.revealed})`;
    if (this.revealed >= 1 && !this.done) {
      this.done = true;
      this.root.classList.add("is-revealed");
      this.proseEl.classList.add("is-writing");
      this.ctx.haptics.play("reveal");
      this.ctx.gl?.pulse(0.8);
      this.unlockSecret();
    }
  }

  #frame(dt, time) {
    this.reveal = clamp01(this.reveal + dt * 0.9);

    if (this.uniforms) {
      const p = this.ctx.pointer.smooth;
      this.uniforms.uTime.value = time;
      this.uniforms.uReveal.value = this.reveal;
      this.uniforms.uPointer.value.set(p.x, -p.y);
    }

    // El recuento cuesta una lectura de canvas: como mucho tres veces por segundo.
    this.sinceMeasure = (this.sinceMeasure || 0) + dt;
    if (this.maskDirty && this.sinceMeasure > 0.32) {
      this.sinceMeasure = 0;
      this.maskDirty = false;
      this.#measure();
    }
  }

  async leave(direction) {
    await super.leave(direction);
    // Se apaga en vez de cortarse: la página es transparente y todo lo que
    // se ve vive en el lienzo, así que quitarlo de golpe dejaba la hoja
    // vacía un instante antes de que la transición hubiera empezado.
    const unmount = this.unmountGL;
    const uniforms = this.uniforms;
    this.unmountGL = null;
    this.fadeOutGL(unmount, (k) => {
      if (uniforms) uniforms.uReveal.value = this.reveal * k;
    });
  }

  destroy() {
    this.unmountGL?.();
    this.maskTexture?.dispose();
    super.destroy();
  }
}
