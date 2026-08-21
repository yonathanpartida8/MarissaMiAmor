/**
 * GLSTAGE — el único contexto WebGL2 del proyecto.
 *
 * Un solo canvas, un solo renderer, un solo bucle. Dentro conviven:
 *   · la atmósfera (quad a pantalla completa, siempre presente)
 *   · el polvo en suspensión (partículas GPU)
 *   · una escena 3D vacía donde las páginas montan lo suyo y luego lo retiran
 *
 * Tener dos contextos WebGL en un móvil es la forma más rápida de que el
 * navegador tire uno de los dos sin avisar. Por eso, uno.
 */

import * as THREE from "three";
import { atmosphereVertex, atmosphereFragment } from "./shaders/atmosphere.js";
import { dustVertex, dustFragment } from "./shaders/dust.js";
import { damp, clamp01 } from "../utils/math.js";
import { seeded } from "../utils/rng.js";

const MOODS = {
  dawn: 0.15,
  night: 0.3,
  amber: 0.4,
  bloom: 0.55,
  storm: 1.0,
  glass: 0.2,
  winter: 0.25,
  cosmos: 0.75,
  light: 0.1,
};

const SPREAD = 22;

export class GLStage {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} ctx  { caps, viewport, loop, pointer }
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.caps = ctx.caps;
    this.viewport = ctx.viewport;
    this.pointer = ctx.pointer;

    this.ready = false;
    this.enabled = this.caps.webgl2;
    this.textures = new Map();

    this.pulse = this.pulse.bind(this);

    if (!this.enabled) {
      // Sin WebGL2 el libro sigue en pie: el CSS ya pinta un fondo digno.
      canvas.style.display = "none";
      return;
    }

    this.#initRenderer();
    this.#initAtmosphere();
    this.#initDust();
    this.#initScene3D();

    this.viewport.on("resize", () => this.resize());
    this.caps.on("tier", () => this.#applyBudget());

    this.resize();
    this.stopTicker = ctx.loop.add((dt, t) => this.tick(dt, t), 15);
    this.ready = true;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Montaje
  // ═══════════════════════════════════════════════════════════════════

  #initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.caps.budget.antialias,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      // Sin preserveDrawingBuffer: en móvil cuesta memoria y no lo necesitamos.
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearColor(0x06030b, 1);
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // El contexto puede perderse (app en segundo plano, GPU ocupada).
    // Lo recuperamos en silencio en vez de dejar el libro en negro.
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.ready = false;
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.resize();
      this.ready = true;
    });
  }

  #initAtmosphere() {
    this.atmoScene = new THREE.Scene();
    this.atmoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.atmoUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uDeep: { value: new THREE.Color("#0a0510") },
      uAccentA: { value: new THREE.Color("#ec6f92") },
      uAccentB: { value: new THREE.Color("#4c1d95") },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0.0 },
      uPulse: { value: 0 },
      uFlash: { value: 0 },
      uMood: { value: 0.3 },
      uQuality: { value: this.caps.tierName === "high" ? 1 : this.caps.tierName === "mid" ? 0.6 : 0 },
    };

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: this.atmoUniforms,
        depthTest: false,
        depthWrite: false,
      })
    );
    quad.frustumCulled = false;
    this.atmoScene.add(quad);

    // Colores objetivo: se interpolan suavemente hacia ellos.
    this.target = {
      deep: new THREE.Color("#0a0510"),
      a: new THREE.Color("#ec6f92"),
      b: new THREE.Color("#4c1d95"),
      mood: 0.3,
      intensity: 0.0,
    };
  }

  #initDust() {
    const count = this.caps.budget.particles;
    const rng = seeded("polvo-de-estrellas");

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const tints = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = rng.range(-SPREAD * 0.6, SPREAD * 0.6);
      positions[i * 3 + 1] = rng.range(-SPREAD * 0.5, SPREAD * 0.5);
      positions[i * 3 + 2] = rng.range(-16, -3);

      seeds[i * 3] = rng.next();
      seeds[i * 3 + 1] = rng.next();
      seeds[i * 3 + 2] = rng.range(0.35, 1.6);

      tints[i] = rng.next();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    // Sin culling: las partículas se mueven en el shader, la caja no vale.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SPREAD * 2);

    this.dustUniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uSize: { value: 2.4 },
      uSpread: { value: SPREAD },
      uPulse: { value: 0 },
      uPixelRatio: { value: 1 },
      uColorA: { value: new THREE.Color("#ffd9e8") },
      uColorB: { value: new THREE.Color("#d7ae72") },
      uOpacity: { value: 0 },
    };

    this.dust = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        uniforms: this.dustUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.dust.frustumCulled = false;
  }

  #initScene3D() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 0, 8);
    this.scene.add(this.dust);

    // Luz suave por si alguna página monta geometría con material físico.
    this.ambient = new THREE.AmbientLight(0xffffff, 1.1);
    this.keyLight = new THREE.DirectionalLight(0xffe6f0, 1.4);
    this.keyLight.position.set(2, 3, 4);
    this.scene.add(this.ambient, this.keyLight);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  API para las páginas
  // ═══════════════════════════════════════════════════════════════════

  /** Cambia el humor de la atmósfera. Se interpola, nunca salta. */
  setMood(palette = {}, mood = "night") {
    if (!this.ready) return;
    if (palette.deep) this.target.deep.set(palette.deep);
    if (palette.a) {
      this.target.a.set(palette.a);
      this.dustTargetA = new THREE.Color(palette.a).lerp(new THREE.Color("#ffffff"), 0.45);
    }
    if (palette.b) this.target.b.set(palette.b);
    this.target.mood = MOODS[mood] ?? 0.3;
  }

  /** Sube la intensidad general (0 durante el arranque, 1 con el libro abierto). */
  setIntensity(value) {
    this.target.intensity = clamp01(value);
  }

  /** Golpe de energía: se usa en cada transición. */
  pulse(amount = 1) {
    if (!this.ready) return;
    this.atmoUniforms.uPulse.value = Math.max(this.atmoUniforms.uPulse.value, amount);
    this.dustUniforms.uPulse.value = Math.max(this.dustUniforms.uPulse.value, amount * 0.8);
  }

  /**
   * Modo ahorro mientras dura una transición.
   *
   * El momento más caro del libro es el cambio de página: la hoja que se va
   * lleva un desenfoque a pantalla completa, la que entra otro, y por debajo
   * la atmósfera sigue calculando ruido fractal píxel a píxel. Justo ahí,
   * bajar la resolución del lienzo WebGL a dos tercios cuesta la mitad de
   * fragmentos y no se ve: todo lo que hay en pantalla está desenfocado o en
   * movimiento. Al aterrizar vuelve a resolución completa.
   */
  setEconomy(on) {
    if (!this.ready || this.economy === on) return;
    this.economy = on;
    this.#applyPixelRatio();
  }

  #applyPixelRatio() {
    const dpr = this.economy ? Math.max(0.6, this.caps.dpr * 0.66) : this.caps.dpr;
    this.renderer.setPixelRatio(dpr);
    const { width, height } = this.viewport;
    this.atmoUniforms.uResolution.value.set(width * dpr, height * dpr);
    this.dustUniforms.uPixelRatio.value = dpr;

    // Y SE VUELVE A DIBUJAR AHORA MISMO.
    //
    // Cambiar la resolución redimensiona el buffer de WebGL, y un buffer
    // recién redimensionado sale VACÍO. Si el navegador compone un fotograma
    // entre el redimensionado y el siguiente dibujado, ese fotograma sale
    // negro a pantalla completa. Como esto se llama al entrar y al salir del
    // modo ahorro, pasaba dos veces en CADA cambio de página: era el
    // parpadeo negro que se veía en casi todas las transiciones del libro.
    this.#draw();
  }

  /** Los dos dibujados, en orden: primero el fondo, después la escena. */
  #draw() {
    if (!this.ready) return;
    this.renderer.clear();
    this.renderer.render(this.atmoScene, this.atmoCamera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }

  /** Destello blanco muy corto. Para los momentos importantes. */
  flash(amount = 0.6) {
    if (!this.ready) return;
    this.atmoUniforms.uFlash.value = Math.max(this.atmoUniforms.uFlash.value, amount);
  }

  /** Monta un objeto 3D de una página. Devuelve la función para retirarlo. */
  mount(object3D) {
    if (!this.ready) return () => {};
    this.scene.add(object3D);
    return () => this.unmount(object3D);
  }

  unmount(object3D) {
    if (!object3D) return;
    this.scene.remove(object3D);
    disposeDeep(object3D);
  }

  /**
   * Convierte una imagen ya cargada en textura, con caché.
   * Las páginas nunca crean texturas a mano: así se liberan todas juntas.
   */
  texture(img) {
    if (!this.ready || !img) return null;
    const key = img.currentSrc || img.src;
    if (this.textures.has(key)) return this.textures.get(key);

    const tex = new THREE.Texture(img);
    // Marca de "compartida": varias páginas pueden usar la misma ilustración,
    // así que la limpieza de una escena no puede liberarla por su cuenta.
    tex.userData.shared = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    tex.needsUpdate = true;

    this.textures.set(key, tex);
    return tex;
  }

  /** Libera texturas que ya no se usan (las llama el router al hacer limpieza). */
  releaseTextures(keepSrcs = []) {
    const keep = new Set(keepSrcs);
    for (const [key, tex] of [...this.textures]) {
      if (keep.has(key)) continue;
      tex.userData.shared = false;
      tex.dispose();
      this.textures.delete(key);
    }
  }

  /** Altura visible del mundo 3D a una distancia dada. Para encajar planos. */
  worldHeightAt(distance) {
    const fov = (this.camera.fov * Math.PI) / 180;
    return 2 * Math.tan(fov / 2) * distance;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Ciclo
  // ═══════════════════════════════════════════════════════════════════

  resize() {
    if (!this.enabled) return;
    const { width, height } = this.viewport;

    this.renderer.setSize(width, height, false);
    this.#applyPixelRatio();

    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();

    // En vertical estrecho, aleja un poco la cámara para que quepa todo.
    this.camera.position.z = this.viewport.aspect < 0.62 ? 9.4 : 8;
  }

  /** ¿Toca dibujar a media cadencia? Lo decide el nivel del aparato. */
  get frameSkip() {
    return this.caps.tierName !== "high";
  }

  #applyBudget() {
    this.atmoUniforms.uQuality.value =
      this.caps.tierName === "high" ? 1 : this.caps.tierName === "mid" ? 0.6 : 0;
    this.#applyPixelRatio();
    // Reducir el número de partículas exigiría rehacer el buffer; en su lugar
    // bajamos opacidad y tamaño, que es gratis y casi no se nota.
    if (this.caps.tierName === "low") {
      this.dustUniforms.uSize.value = 1.8;
      this.dustBudget = 0.45;
    } else {
      this.dustUniforms.uSize.value = 2.4;
      this.dustBudget = 1;
    }
  }

  dustBudget = 1;
  dustTargetA = null;
  /** Resolución reducida mientras cambia la página. */
  economy = false;

  tick(dt, time) {
    if (!this.ready) return;

    const p = this.pointer.influence;

    // Interpolación de color y humor: nunca hay un corte brusco de paleta.
    const u = this.atmoUniforms;
    u.uTime.value = time;
    u.uDeep.value.lerp(this.target.deep, 1 - Math.exp(-2.2 * dt));
    u.uAccentA.value.lerp(this.target.a, 1 - Math.exp(-2.2 * dt));
    u.uAccentB.value.lerp(this.target.b, 1 - Math.exp(-2.2 * dt));
    u.uMood.value = damp(u.uMood.value, this.target.mood, 1.8, dt);
    u.uIntensity.value = damp(u.uIntensity.value, this.target.intensity, 1.6, dt);
    u.uPointer.value.set(p.x, p.y);

    // Los picos decaen exponencialmente: golpe seco y desvanecido suave.
    u.uPulse.value *= Math.exp(-3.4 * dt);
    u.uFlash.value *= Math.exp(-6.5 * dt);

    const d = this.dustUniforms;
    d.uTime.value = time;
    d.uPointer.value.set(p.x, p.y);
    d.uPulse.value *= Math.exp(-2.8 * dt);
    d.uOpacity.value = damp(
      d.uOpacity.value,
      this.target.intensity * 0.85 * this.dustBudget,
      1.4,
      dt
    );
    if (this.dustTargetA) d.uColorA.value.lerp(this.dustTargetA, 1 - Math.exp(-2 * dt));

    // Deriva lentísima de la cámara: el mundo nunca está del todo quieto.
    this.camera.position.x = damp(this.camera.position.x, p.x * 0.34, 1.6, dt);
    this.camera.position.y = damp(this.camera.position.y, p.y * 0.26, 1.6, dt);
    this.camera.lookAt(0, 0, 0);

    // La atmósfera es fondo: nadie la mira fijamente. En gama media y baja se
    // DIBUJA a 30 imágenes por segundo en vez de a 60, y eso es la mitad de
    // trabajo de GPU en el elemento más caro del libro —un shader de ruido
    // fractal a pantalla completa— sin que se note absolutamente nada.
    //
    // El salto va aquí abajo, y no arriba del todo como estaba: todo lo de
    // encima es aritmética de CPU que no cuesta nada, y saltársela hacía que
    // en gama media los colores y la cámara se suavizaran a la mitad de
    // velocidad —el fondo iba a tirones y los cambios de paleta llegaban
    // tarde—. Ahora la cuenta corre siempre lisa y sólo se ahorra el pintado.
    if (this.frameSkip) {
      this.skipAcc = (this.skipAcc || 0) + 1;
      if (this.skipAcc % 2 === 0) return;
    }

    this.#draw();
  }

  destroy() {
    this.stopTicker?.();
    for (const tex of this.textures.values()) tex.dispose();
    this.textures.clear();
    disposeDeep(this.scene);
    disposeDeep(this.atmoScene);
    this.renderer?.dispose();
    this.ready = false;
  }
}

/** Libera geometrías, materiales y texturas de un subárbol completo. */
function disposeDeep(root) {
  root?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of materials) {
      if (!mat) continue;
      for (const value of Object.values(mat)) {
        // Las texturas del caché compartido las libera GLStage, no la escena.
        if (value && value.isTexture && !value.userData?.shared) value.dispose();
      }
      mat.dispose?.();
    }
  });
}
