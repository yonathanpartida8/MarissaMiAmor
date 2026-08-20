/**
 * DEPTHPAGE — la ilustración deja de ser plana.
 *
 * La imagen se monta en la escena WebGL como un plano a sangre y se deforma
 * en el shader según hacia dónde inclines el teléfono (o dónde pongas el
 * ratón). El texto flota encima, en DOM, con su propio paralaje más lento:
 * dos planos que se mueven a distinta velocidad son toda la ilusión.
 */

import * as THREE from "three";
import { BasePage } from "../BasePage.js";
import { depthVertex, depthFragment } from "../../gl/shaders/depth.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { damp, clamp01 } from "../../utils/math.js";

export default class DepthPage extends BasePage {
  static type = "depth";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.depth", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent });

    this.proseEl = el("div.prose.depth__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    // Respaldo en DOM: si no hay WebGL, la ilustración se ve igual,
    // sólo que sin profundidad. Nunca una página vacía.
    this.fallback = el("div.depth__fallback");

    this.card = el("div.depth__card", {}, [
      el("span.kicker.depth__kicker", { text: ch?.kicker || "" }),
      el("h2.title.depth__title", { text: ch?.title || "" }),
      el("hr.rule.depth__rule"),
      el("div.depth__scroll", {}, [this.proseEl]),
    ]);

    this.root.append(this.fallback, el("div.depth__veil"), this.card);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    const img = photo ? await this.ctx.assets.load(photo.src).catch(() => null) : null;

    if (img) this.fallback.style.backgroundImage = `url("${photo.src}")`;

    const gl = this.ctx.gl;
    const useGL = gl?.ready && this.ctx.caps.budget.depthPhotos && img;

    if (useGL) {
      this.#mountPlane(img);
      this.root.classList.add("has-gl");
    }

    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    this.reveal = 0;
    this.px = 0;
    this.py = 0;
    this.addTicker((dt, t) => this.#frame(dt, t), 12);
  }

  #mountPlane(img) {
    const gl = this.ctx.gl;
    const texture = gl.texture(img);

    // El plano cubre toda la pantalla en el mundo 3D.
    const distance = gl.camera.position.z;
    const worldHeight = gl.worldHeightAt(distance);
    const worldWidth = worldHeight * gl.camera.aspect;

    // Corrección de encuadre: la ilustración se recorta, nunca se estira.
    const planeAspect = worldWidth / worldHeight;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cover =
      imgAspect > planeAspect
        ? new THREE.Vector2(planeAspect / imgAspect, 1)
        : new THREE.Vector2(1, imgAspect / planeAspect);

    this.uniforms = {
      uMap: { value: texture },
      uParallax: { value: new THREE.Vector2() },
      uStrength: { value: 0.055 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uTint: { value: new THREE.Color(this.palette.a) },
      uSteps: { value: this.ctx.caps.tierName === "high" ? 8 : this.ctx.caps.tierName === "mid" ? 4 : 1 },
      uCover: { value: cover },
    };

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(worldWidth * 1.06, worldHeight * 1.06),
      new THREE.ShaderMaterial({
        vertexShader: depthVertex,
        fragmentShader: depthFragment,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
      })
    );
    this.mesh.position.z = 0.2;
    this.unmountGL = gl.mount(this.mesh);
  }

  #frame(dt, time) {
    this.reveal = clamp01(this.reveal + dt * 0.85);

    const p = this.ctx.pointer.influence;
    this.px = damp(this.px, p.x, 3.2, dt);
    this.py = damp(this.py, p.y, 3.2, dt);

    if (this.uniforms) {
      this.uniforms.uParallax.value.set(this.px, this.py);
      this.uniforms.uTime.value = time;
      this.uniforms.uReveal.value = this.reveal;
    }

    // El texto se mueve menos que la imagen: eso es lo que crea la
    // sensación de que está delante y no pegado.
    setVars(this.root, {
      "--card-x": `${(this.px * -5).toFixed(1)}px`,
      "--card-y": `${(this.py * 4).toFixed(1)}px`,
      "--fb-x": `${(this.px * -14).toFixed(1)}px`,
      "--fb-y": `${(this.py * 11).toFixed(1)}px`,
    });
  }

  async leave(direction) {
    await super.leave(direction);
    // La ilustración no puede quedarse flotando sobre la página siguiente,
    // pero tampoco desaparecer de golpe: se apaga mientras la hoja se va.
    const unmount = this.unmountGL;
    const uniforms = this.uniforms;
    this.unmountGL = null;
    this.fadeOutGL(unmount, (k) => {
      if (uniforms) uniforms.uReveal.value = this.reveal * k;
    });
  }

  destroy() {
    this.unmountGL?.();
    super.destroy();
  }
}
