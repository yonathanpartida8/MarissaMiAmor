/**
 * FINALEPAGE — el cierre.
 *
 * Miles de partículas dispersas por el espacio que, al tocarlas, se recogen y
 * forman un corazón. Es la única página que no pide nada más: se toca una vez
 * y se queda ahí, latiendo, con las últimas palabras debajo.
 *
 * Todo el movimiento va en el shader: la CPU sólo mueve un número entre 0 y 1.
 */

import * as THREE from "three";
import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars, wait, textoPlano } from "../../utils/dom.js";
import { damp, clamp01 } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import { allSecrets } from "../../data/manifest.js";
import { finale } from "../../data/chapters.js";
import escondidos from "../../data/escondidos.js";
import { resolverPaleta } from "../../data/paletas.js";

const heartVertex = /* glsl */ `
  precision highp float;

  attribute vec3 aTarget;   // su sitio dentro del corazón
  attribute vec3 aSeed;     // fase, velocidad, tamaño

  uniform float uTime;
  uniform float uForm;      // 0 = disperso, 1 = corazón
  uniform float uBeat;
  uniform float uPixelRatio;
  uniform vec2  uPointer;

  varying float vAlpha;
  varying float vForm;

  void main() {
    float phase = aSeed.x * 6.2831;

    // Deriva del estado disperso.
    vec3 loose = position;
    loose.x += sin(uTime * (0.2 + aSeed.y * 0.3) + phase) * 1.1;
    loose.y += cos(uTime * (0.16 + aSeed.y * 0.24) + phase * 1.4) * 0.9;

    // El corazón late: se hincha y se deshincha alrededor de su centro.
    vec3 formed = aTarget * (1.0 + uBeat * 0.055);
    formed.x += sin(uTime * 1.4 + phase) * 0.035;
    formed.y += cos(uTime * 1.2 + phase) * 0.035;

    // Cada partícula llega con su propio retraso: el corazón se forma
    // desordenadamente, como algo que se junta, no como un interruptor.
    float t = clamp((uForm - aSeed.x * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(loose, formed, t);

    // Y se apartan un poco del dedo.
    vec2 away = pos.xy - uPointer * 3.0;
    pos.xy += normalize(away + 0.0001) * smoothstep(2.2, 0.0, length(away)) * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.2 + aSeed.z * 2.8 + uBeat * 1.4) * uPixelRatio * (10.0 / max(-mv.z, 0.5));

    vAlpha = 0.5 + 0.5 * t;
    vForm = t;
    gl_Position = projectionMatrix * mv;
  }
`;

const heartFragment = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vAlpha;
  varying float vForm;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    float core = 1.0 - smoothstep(0.0, 0.22, d);
    float halo = exp(-d * 8.0);

    vec3 color = mix(uColorA, uColorB, vForm);
    color = mix(color, vec3(1.0), core * 0.5);

    gl_FragColor = vec4(color, (core * 0.7 + halo * 0.45) * vAlpha);
  }
`;

export default class FinalePage extends BasePage {
  static type = "finale";

  get palette() {
    // Termina donde empieza el pulso: el rojo más vivo del libro.
    return resolverPaleta("latido");
  }

  get mood() {
    return "cosmos";
  }

  build() {
    this.root = el("section.page.finale", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": "Final",
    });
    setVars(this.root, { "--accent": this.palette.a });

    this.root.append(
      el("div.finale__backdrop"),
      // Sin `data-claim-drag`. Esta capa sólo escucha el toque y el pulsado
      // largo, y ninguno de los dos mueve el dedo: reclamar el arrastre no
      // le servía de nada y sí impedía pasar de página desde aquí.
      //
      // Antes daba igual, porque el final era la última hoja del libro y no
      // había adónde ir. Ahora detrás pueden venir sus páginas de
      // `paginas-html/` y sus fotos de `images/amores/`, y quedarse
      // encallado en el final sin poder deslizar sería lo primero que
      // pasara al llegar hasta aquí.
      el("div.finale__touch"),
      // Estrellas fugaces que cruzan el cielo cuando ya se formó el corazón.
      el("div.finale__fugaces", { "aria-hidden": "true" }, [0, 1, 2].map(() => el("span.finale__fugaz"))),
      el("div.finale__content", {}, [
        el("p.finale__kicker", { text: finale.kicker }),
        el("h2.finale__line.finale__line--1", { text: finale.lines[0] }),
        finale.lines[1] ? el("h2.finale__line.finale__line--2", { text: finale.lines[1] }) : null,
        // La carta del cierre, en su propio cristal: se lee igual de bien
        // sobre el cielo oscuro que sobre el rosa del tema pastel.
        el("div.finale__carta", {}, [
          el("div.lectura.finale__scroll", {}, [
            ...String(finale.body || "")
              .split("\n")
              .filter(Boolean)
              .map((parrafo, i) => {
                const p = el("p.finale__body", {}, [textoPlano(parrafo)]);
                p.style.setProperty("--n", String(i));
                return p;
              }),
            el("p.finale__sign", {}, [textoPlano(finale.sign)]),
            el("p.finale__continuara", { text: finale.continuara || "continuará" }),
          ]),
        ]),
        el("button.finale__again", {
          type: "button",
          text: "seguir →",
          onClick: () => this.ctx.router.next(),
        }),
      ]),
      el("div.finale__prompt", { text: "toca la pantalla" }),
      el("div.finale__secrets")
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    if (photo) {
      await this.ctx.assets.load(photo.src).catch(() => {});
      this.root.querySelector(".finale__backdrop").style.backgroundImage = `url("${photo.src}")`;
    }

    // Balance de secretos: lo que encontró por el camino.
    const found = this.ctx.store.secretsFound;
    const total = allSecrets().length;
    this.root.querySelector(".finale__secrets").textContent =
      found >= total
        ? `✦ encontraste los ${total} secretos`
        : `✦ ${found} de ${total} secretos encontrados`;

    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.form = 0;
    this.targetForm = 0;
    this.beat = 0;
    this.formed = false;

    if (this.ctx.gl?.ready) this.#buildHeart();

    this.addGestures(
      new Gestures(
        this.root.querySelector(".finale__touch"),
        {
          onTap: () => this.#formHeart(),
          // Escondido: no soltar cuando el corazón ya está formado. Mientras
          // haya dedo no se deshace, y ésa es toda la idea del libro.
          onLongPress: (e) => {
            if (!this.formed) return;
            this.sujetando = true;
            this.root.classList.add("is-held");
            this.escondite("final-sostenido", escondidos.final, e);
          },
          onLongPressEnd: () => {
            this.sujetando = false;
            this.root.classList.remove("is-held");
          },
          onUp: () => {
            this.sujetando = false;
            this.root.classList.remove("is-held");
          },
        },
        // Sin `exclusive`. Marcarlo cortaba el evento antes de que llegara al
        // escenario, y con él se iba también el arrastre que pasa la hoja.
        // Aquí no hace falta: de esta capa sólo salen el toque y el pulsado
        // largo, y ninguno de los dos mueve el dedo, así que no hay nada que
        // se pueda confundir con un pase de página.
        { longPressMs: 900 }
      )
    );

    this.addTicker((dt, t) => this.#frame(dt, t), 12);
  }

  #buildHeart() {
    const gl = this.ctx.gl;
    const count = this.ctx.caps.tierName === "low" ? 900 : this.ctx.caps.tierName === "mid" ? 2200 : 4200;
    const rng = seeded("corazon");

    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Punto de partida: disperso por el volumen visible.
      positions[i * 3] = rng.range(-6, 6);
      positions[i * 3 + 1] = rng.range(-6, 6);
      positions[i * 3 + 2] = rng.range(-4, 1.5);

      // Destino: dentro de la curva del corazón, con algo de grosor.
      const t = rng.range(0, Math.PI * 2);
      // Curva cardioide clásica de Descartes.
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      // La mayoría en el borde, algunas rellenando: así el contorno se lee.
      const fill = rng.next() < 0.42 ? Math.sqrt(rng.next()) : 1;
      const scale = 0.155;

      targets[i * 3] = hx * scale * fill + rng.range(-0.05, 0.05);
      targets[i * 3 + 1] = hy * scale * fill + rng.range(-0.05, 0.05);
      targets[i * 3 + 2] = rng.range(-0.35, 0.35);

      seeds[i * 3] = rng.next();
      seeds[i * 3 + 1] = rng.next();
      seeds[i * 3 + 2] = rng.range(0.3, 1.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    this.uniforms = {
      uTime: { value: 0 },
      uForm: { value: 0 },
      uBeat: { value: 0 },
      uPixelRatio: { value: this.ctx.caps.dpr },
      uPointer: { value: new THREE.Vector2() },
      // Las dos puntas de las estrellas del final salen de su propia
      // paleta: antes una era lavanda, el último violeta que quedaba.
      uColorA: { value: new THREE.Color(this.palette.a) },
      uColorB: { value: new THREE.Color(this.palette.b) },
    };

    this.points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: heartVertex,
        fragmentShader: heartFragment,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.points.frustumCulled = false;
    this.#encuadrar();
    this.track(this.ctx.viewport.on("resize", () => this.#encuadrar()));
    this.unmountGL = gl.mount(this.points);
  }

  /**
   * El corazón tiene que verse ENTERO en la parte de arriba, en cualquier
   * pantalla. Antes tenía un tamaño fijo pensado para pantallas anchas: en
   * el teléfono de pie se salía por los lados y por arriba, y sólo se veían
   * las dos puntas de abajo.
   */
  #encuadrar() {
    if (!this.points) return;
    const cam = this.ctx.gl?.camera;
    const z = cam?.position?.z || 9.4;
    const aspecto = cam?.aspect || window.innerWidth / Math.max(1, window.innerHeight);
    const medioAlto = z * Math.tan((21 * Math.PI) / 180);
    const medioAncho = medioAlto * aspecto;
    // El corazón mide ~2.5 de medio ancho y ~2.25 de medio alto (escala 1).
    const k = Math.min(1, (medioAncho * 0.78) / 2.5, (medioAlto * 0.36) / 2.25);
    this.escala = k;
    this.points.scale.setScalar(k);
    // Su centro, a un cuarto de pantalla desde arriba.
    this.points.position.y = medioAlto * 0.5 + 0.4 * k;
  }

  async #formHeart() {
    if (this.formed) return;
    this.formed = true;
    this.targetForm = 1;

    this.ctx.haptics.play("heart");
    this.ctx.audio.play("open", { volume: 0.7 });
    this.ctx.gl?.pulse(1);
    this.root.classList.add("is-formed");
    this.unlockSecret();

    await wait(1600);
    this.root.classList.add("is-said");
    this.ctx.haptics.play("heart");
  }

  #frame(dt, time) {
    // Sujetándolo, el corazón no sólo no se deshace: se aprieta un poco más.
    this.form = damp(this.form, this.sujetando ? 1.18 : this.targetForm, 1.3, dt);

    // Latido: dos golpes seguidos y una pausa, como uno de verdad.
    const cycle = (time * 1.05) % 1;
    const pulse =
      Math.exp(-Math.pow((cycle - 0.06) * 11, 2)) * 1.0 +
      Math.exp(-Math.pow((cycle - 0.24) * 13, 2)) * 0.55;
    this.beat = pulse * this.form;

    if (this.uniforms) {
      const p = this.ctx.pointer.influence;
      this.uniforms.uTime.value = time;
      this.uniforms.uForm.value = clamp01(this.form);
      this.uniforms.uBeat.value = this.beat;
      this.uniforms.uPointer.value.set(p.x, p.y);
    }

    setVars(this.root, { "--beat": this.beat.toFixed(3), "--form": this.form.toFixed(3) });
  }

  async leave(direction) {
    await super.leave(direction);
    const unmount = this.unmountGL;
    const uniforms = this.uniforms;
    const points = this.points;
    this.unmountGL = null;
    // El shader del corazón no tiene uniforme de opacidad, pero con mezcla
    // aditiva encoger es apagar: los puntos se recogen hacia el centro y se
    // desvanecen solos mientras la hoja se va.
    const base = this.escala || 1;
    this.fadeOutGL(unmount, (k) => {
      if (points) points.scale.setScalar(Math.max(0.001, k * base));
    });
  }

  destroy() {
    this.unmountGL?.();
    super.destroy();
  }
}
