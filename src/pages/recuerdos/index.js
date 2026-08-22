/**
 * MEMORYFIELDPAGE — veinticuatro recuerdos flotando alrededor.
 *
 * Los recuerdos no están en fila: están repartidos por una esfera, mirando
 * siempre hacia ti. Se arrastra para girarlos, siguen girando al soltar, y al
 * tocar uno se acerca hasta ponerse delante para que lo mires bien.
 *
 * Las texturas entran poco a poco, empezando por las que están de cara: subir
 * veinticuatro imágenes a la GPU de golpe congela cualquier móvil.
 */

import * as THREE from "three";
import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { damp, clamp } from "../../utils/math.js";
import { PRIORITY } from "../../core/AssetLoader.js";

/**
 * Radio de la esfera de recuerdos. A la distancia de cámara del libro, el
 * mundo visible mide unas 6 unidades de alto: con un radio mayor, media
 * esfera se queda fuera de cuadro y parece que faltan recuerdos.
 */
const RADIUS = 2.35;

export default class MemoryFieldPage extends BasePage {
  static type = "memoryfield";

  /** Ninguna es crítica: la página funciona vacía y se va llenando. */
  get criticalAssets() {
    return [];
  }

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.field", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent });

    this.proseEl = el("div.prose.field__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.root.append(
      el("div.field__surface", { "data-claim-drag": "" }),
      el("div.field__card.hueco-barra", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.field__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.lectura.field__scroll", {}, [this.proseEl]),
      ]),
      el("div.field__badge", { text: "" }),
      el("div.field__fallback")
    );

    this.surface = this.root.querySelector(".field__surface");
    this.badge = this.root.querySelector(".field__badge");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    const gl = this.ctx.gl;
    if (!gl?.ready) {
      // Sin WebGL: mosaico de recuerdos en DOM, que no es lo mismo pero es digno.
      this.#buildFallback();
      return;
    }

    this.group = new THREE.Group();
    this.cards = [];
    this.rotation = { x: 0, y: 0 };
    this.velocity = { x: 0.12, y: 0.18 };
    this.focused = null;
    this.appear = 0;

    // Cuántos recuerdos caben según el aparato.
    const budget = this.ctx.caps.tierName === "low" ? 10 : this.ctx.caps.tierName === "mid" ? 16 : this.photos.length;
    const chosen = this.photos.slice(0, budget);

    chosen.forEach((photo, i) => {
      const position = fibonacciPoint(i, chosen.length, RADIUS);
      const geometry = new THREE.PlaneGeometry(0.95, 0.95);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.palette.a).multiplyScalar(0.28),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData.index = i;
      this.group.add(mesh);

      // El retraso se reparte dentro de medio segundo: con `i * algo` fijo,
      // los últimos recuerdos tenían un retraso mayor que la propia
      // animación de aparición y no llegaban a hacerse visibles nunca.
      const delay = (i / Math.max(1, chosen.length - 1)) * 0.5;
      this.cards.push({ mesh, photo, material, home: position.clone(), loaded: false, delay });
    });

    // El campo se acomoda a la forma de la hoja: en vertical se sube para
    // dejar libre el tercio de abajo (ahí va el texto); con el teléfono
    // tumbado el texto se va al lado derecho, así que el campo se centra,
    // se corre a la izquierda y encoge, para no salirse del libro por arriba.
    this.#placeField();
    this.track(this.ctx.viewport.on("resize", () => this.#placeField()));

    this.unmountGL = gl.mount(this.group);
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();

    this.#bindGestures();
    this.#loadBatch(0);
    this.addTicker((dt, t) => this.#frame(dt, t), 12);
  }

  /**
   * Coloca la esfera de recuerdos según la forma de LA HOJA, no de la ventana.
   *
   * Los planos los pinta WebGL sobre un lienzo que ocupa la pantalla entera,
   * pero el libro no siempre la ocupa: en tablet y escritorio es una hoja
   * estrecha centrada sobre una mesa oscura. Sin esto, los recuerdos se
   * esparcían por fuera del libro, a los lados, como si se hubieran caído.
   *
   * Así que la esfera se encoge hasta caber dentro de la hoja, y se coloca
   * donde no estorbe al texto: arriba si el texto va abajo (vertical), a la
   * izquierda si el texto va a la derecha (móvil tumbado).
   */
  #placeField() {
    if (!this.group || !this.root?.isConnected) return;

    const leaf = this.root.getBoundingClientRect();
    if (!leaf.width || !leaf.height) return;

    const wide = leaf.width > leaf.height * 1.15;
    const fit = clamp((leaf.width / (window.innerWidth || 1)) * 1.25, 0.5, 1);

    this.group.position.set(wide ? -1.4 * fit : 0, wide ? 0.1 : 0.75 * fit, 0);
    this.group.scale.setScalar(wide ? fit * 0.85 : fit);
  }

  #bindGestures() {
    this.addGestures(
      new Gestures(
        this.surface,
        {
          onPanStart: () => {
            this.dragging = true;
            this.velocity.x = this.velocity.y = 0;
          },
          onPan: (e) => {
            // El arrastre gira el conjunto; el eje vertical va más limitado
            // para no poder ponerlo del revés.
            this.rotation.y += e.vx * 0.02;
            this.rotation.x = clamp(this.rotation.x + e.vy * 0.012, -0.7, 0.7);
          },
          onPanEnd: (e) => {
            this.dragging = false;
            this.velocity.y = e.vx * 1.4;
            this.velocity.x = e.vy * 0.8;
          },
          onTap: (e) => this.#pick(e),
        },
        { exclusive: true, threshold: 6 }
      )
    );
  }

  /** Elige el recuerdo que hay bajo el dedo. */
  #pick(e) {
    if (!this.raycaster) return;
    // Las coordenadas del rayo van referidas al LIENZO, no a la página.
    // La cámara pinta sobre el canvas, que ocupa toda la ventana; la hoja,
    // en tablet, escritorio y móvil apaisado, es más pequeña y va centrada.
    // Midiendo sobre la página, el dedo apuntaba a un sitio y el rayo salía
    // por otro, y tocar un recuerdo no lo enfocaba.
    const rect = (this.ctx.gl?.canvas || this.root).getBoundingClientRect();
    this.pointerNdc.set(
      ((e.x - rect.left) / rect.width) * 2 - 1,
      -(((e.y - rect.top) / rect.height) * 2 - 1)
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.ctx.gl.camera);
    const hits = this.raycaster.intersectObjects(this.group.children, false);

    if (!hits.length) {
      if (this.focused) this.#unfocus();
      return;
    }

    const card = this.cards.find((c) => c.mesh === hits[0].object);
    if (!card) return;

    if (this.focused === card) this.#unfocus();
    else this.#focus(card);
  }

  #focus(card) {
    this.focused = card;
    this.velocity.x = this.velocity.y = 0;
    this.ctx.haptics.play("reveal");
    this.ctx.audio.play("turn", { volume: 0.28, rate: 1.4 });
    this.ctx.gl?.pulse(0.5);
    this.root.classList.add("is-focused");
    this.badge.textContent = `recuerdo ${String(card.mesh.userData.index + 1).padStart(2, "0")}`;
    // Se carga a máxima prioridad aunque estuviera en la cola del fondo.
    this.#loadCard(card, PRIORITY.CRITICAL);
    this.unlockSecret();
  }

  #unfocus() {
    this.focused = null;
    this.root.classList.remove("is-focused");
    this.badge.textContent = "";
    this.ctx.haptics.play("tap");
  }

  /** Carga por tandas: seis, y las siguientes cuando el navegador respire. */
  #loadBatch(start) {
    const batch = this.cards.slice(start, start + 6);
    if (!batch.length) return;

    Promise.all(batch.map((card) => this.#loadCard(card, PRIORITY.NEAR))).then(() => {
      if (this.destroyed) return;
      const next = () => this.#loadBatch(start + 6);
      if ("requestIdleCallback" in window) requestIdleCallback(next, { timeout: 1500 });
      else this.later(next, 260);
    });
  }

  async #loadCard(card, priority) {
    if (card.loaded) return;
    card.loaded = true;
    const img = await this.ctx.assets.load(card.photo.src, priority).catch(() => null);
    if (!img || this.destroyed || !this.ctx.gl?.ready) return;

    const texture = this.ctx.gl.texture(img);
    card.material.map = texture;
    card.material.color.set(0xffffff);
    card.material.needsUpdate = true;

    // Proporción real: los recuerdos no se deforman. Se guarda aparte porque
    // la escala final es esta proporción por el zoom de enfoque.
    const aspect = img.naturalWidth / img.naturalHeight;
    card.aspect =
      aspect >= 1 ? { x: 1, y: 1 / aspect } : { x: aspect, y: 1 };
  }

  #frame(dt, time) {
    if (!this.group) return;

    // Llega hasta 1.5 para que también los de mayor retraso completen su entrada.
    this.appear = Math.min(1.5, this.appear + dt * 0.85);

    // Giro con inercia; cuando nadie toca, sigue girando muy despacio solo.
    if (!this.dragging && !this.focused) {
      this.rotation.y += this.velocity.y * dt;
      this.rotation.x = clamp(this.rotation.x + this.velocity.x * dt, -0.7, 0.7);
      this.velocity.y = damp(this.velocity.y, 0.14, 0.8, dt);
      this.velocity.x = damp(this.velocity.x, 0, 1.6, dt);

      // Y responde a la inclinación del teléfono.
      const p = this.ctx.pointer.tiltSmooth;
      this.rotation.y += p.x * dt * 0.35;
    }

    this.group.rotation.y = this.rotation.y;
    this.group.rotation.x = this.rotation.x;
    // Con la matriz al día, worldToLocal da la conversión exacta y nos ahorra
    // invertir rotaciones de Euler a mano (que es donde se cuelan los errores).
    this.group.updateMatrixWorld(true);

    const camera = this.ctx.gl.camera;

    // `position` de un hijo es local al grupo, así que el destino de enfoque
    // hay que convertirlo. `lookAt`, en cambio, espera coordenadas de mundo y
    // ya compensa la rotación del padre por dentro.
    this._v2.set(0, 0, camera.position.z - 2.8);
    const focusLocal = this.group.worldToLocal(this._v2);

    // TODOS LOS RECUERDOS MIRAN A CÁMARA, Y ESO SE RESUELVE UNA SOLA VEZ.
    //
    // Antes cada carta llamaba a `lookAt`, que monta una matriz de orientación
    // y la descompone en cuaternión. Con ochenta y cinco recuerdos girando eso
    // era, con diferencia, lo más caro de todo el libro. Como lo que se quiere
    // es que la carta quede plana hacia quien mira, basta con deshacer el giro
    // del grupo —una inversión— y copiar esa misma orientación a todas.
    this._q.copy(this.group.quaternion).invert();

    for (const card of this.cards) {
      const mesh = card.mesh;
      const isFocused = this.focused === card;

      const target = isFocused ? focusLocal : card.home;
      mesh.position.lerp(target, 1 - Math.exp(-(isFocused ? 6 : 4) * dt));

      // Siempre de cara: el recuerdo te mira a ti, no al centro de la esfera.
      mesh.quaternion.copy(this._q);

      // Profundidad: el que está detrás se apaga. mesh.position ya está en
      // coordenadas del grupo, así que hay que llevarlo al mundo para saber
      // si mira hacia nosotros.
      this._v3.copy(mesh.position).applyMatrix4(this.group.matrixWorld);
      // Suelo bajo a propósito: los de detrás casi se apagan, y eso es lo
      // que hace que se lea una esfera y no un collage plano.
      const depthFade = 0.1 + Math.max(0, (this._v3.z + RADIUS) / (RADIUS * 2)) * 0.9;

      const born = Math.min(1, Math.max(0, (this.appear - card.delay) * 2.2));
      const dim = this.focused && !isFocused ? 0.2 : 1;
      card.material.opacity = born * depthFade * dim;

      // Escala = proporción de la imagen × zoom de enfoque, interpolado.
      card.zoom = damp(card.zoom ?? 1, isFocused ? 2.2 : 1, 6, dt);
      const aspect = card.aspect || { x: 1, y: 1 };
      mesh.scale.set(aspect.x * card.zoom, aspect.y * card.zoom, 1);
    }
  }

  /** Vectores de trabajo reutilizados: cero basura por frame. */
  _v1 = new THREE.Vector3();
  _v2 = new THREE.Vector3();
  _v3 = new THREE.Vector3();
  _q = new THREE.Quaternion();

  /** Si no hay WebGL, un mosaico sencillo con las mismas imágenes. */
  #buildFallback() {
    const grid = this.root.querySelector(".field__fallback");
    grid.classList.add("is-active");
    this.photos.slice(0, 12).forEach(async (photo, i) => {
      const cell = el("div.field__cell");
      grid.append(cell);
      await this.ctx.assets.load(photo.src, PRIORITY.NEAR).catch(() => null);
      cell.style.backgroundImage = `url("${photo.src}")`;
      this.later(() => cell.classList.add("is-loaded"), i * 60);
    });
  }

  async leave(direction) {
    await super.leave(direction);
    // Los recuerdos se apagan y se encogen un poco mientras la hoja se va,
    // en vez de esfumarse de un fotograma para otro.
    const unmount = this.unmountGL;
    const group = this.group;
    const cards = this.cards.slice();
    const base = group ? group.scale.x : 1;
    const from = cards.map((c) => c.material?.opacity ?? 1);
    this.unmountGL = null;
    this.fadeOutGL(unmount, (k) => {
      if (group) group.scale.setScalar(base * (0.88 + 0.12 * k));
      cards.forEach((c, i) => {
        if (c.material) c.material.opacity = from[i] * k;
      });
    });
  }

  destroy() {
    this.unmountGL?.();
    this.group = null;
    this.cards = [];
    super.destroy();
  }
}

/**
 * Reparto en espiral de Fibonacci: es la forma conocida de repartir puntos
 * por una esfera sin que se amontonen en los polos.
 */
function fibonacciPoint(i, total, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / Math.max(1, total - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius);
}
