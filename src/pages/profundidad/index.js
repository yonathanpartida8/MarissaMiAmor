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
import { Gestures } from "../../core/Gestures.js";
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

    // Un reloj que marca la hora del capítulo (si la tiene) y sigue
    // corriendo mientras lees: ni así se duerme nadie.
    const cabeza = [el("span.kicker.depth__kicker", { text: ch?.kicker || "" })];
    if (ch?.reloj) {
      this.reloj = el("span.depth__reloj", { "aria-hidden": "true" });
      cabeza.push(this.reloj);
    }

    // Y un chat que se despide y no se va, si el capítulo lo trae.
    const lectura = [this.proseEl];
    if (ch?.platica?.length) lectura.push(this.#chat(ch));

    this.card = el("div.depth__card.hueco-barra", {}, [
      el("div.depth__cabeza", {}, cabeza),
      el("h2.title.depth__title", { text: ch?.title || "" }),
      el("hr.rule.depth__rule"),
      el("div.lectura.depth__scroll", {}, lectura),
    ]);

    // Si su carpeta de fotos está vacía, en vez de la ilustración sale un
    // recuadro: «Aquí va la foto 1».
    this.hueco = this.photos[0]?.hueco ? el("img.depth__hueco", { src: this.photos[0].src, alt: "Aquí va la foto 1" }) : null;
    if (this.hueco) this.root.classList.add("is-hueco");

    // Con `encuadre: "entera"` la foto no se recorta de fondo: va entera en
    // un marco arriba (el fondo es ella misma, desenfocada) y al tocarla se
    // abre en grande. Para fotos con letras o detalles que no se pueden perder.
    const foto = this.photos[0];
    this.entera = ch?.encuadre === "entera" && foto && !foto.hueco;
    if (this.entera) {
      this.root.classList.add("is-entera");
      this.marcoImg = el("img", { src: foto.src, alt: ch?.title || "foto", decoding: "async", draggable: "false" });
      this.marco = el("figure.depth__marco", { "data-claim-drag": "" }, [this.marcoImg, el("span.depth__lupa-pista", { text: "toca para verla en grande" })]);
    }

    this.root.append(this.fallback, ...(this.hueco ? [this.hueco] : []), ...(this.marco ? [this.marco] : []), el("div.depth__veil"), this.card);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0]?.hueco ? null : this.photos[0];
    const img = photo ? await this.ctx.assets.load(photo.src).catch(() => null) : null;

    if (img) this.fallback.style.backgroundImage = `url("${photo.src}")`;

    const gl = this.ctx.gl;
    const useGL = !this.entera && gl?.ready && this.ctx.caps.budget.depthPhotos && img;

    if (this.entera) {
      this.fotoAr = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 3 / 4;
      requestAnimationFrame(() => this.#medirMarco());
      this.track(this.ctx.viewport.on("resize", () => this.#medirMarco()));
      this.addGestures(new Gestures(this.marco, { onTap: () => this.#lupa(true) }, { exclusive: true, threshold: 10 }));
    }

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
    this.minuto = 0;
    this.relojT = 0;
    this.#reiniciarChat();
    // El chat sólo corre mientras se ve: quien todavía está leyendo el
    // texto de arriba no se pierde el principio.
    if (this.chatEl && "IntersectionObserver" in window) {
      this.chatVisto = false;
      const io = new IntersectionObserver(([e]) => { this.chatVisto = e.isIntersecting; }, { threshold: 0.35 });
      io.observe(this.chatEl);
      this.track(() => io.disconnect());
    } else {
      this.chatVisto = true;
    }
    this.addTicker((dt, t) => this.#frame(dt, t), 12);
  }

  /**
   * El chat: como en el teléfono. Arriba su nombre y «en línea», que pasa
   * a «escribiendo…» cuando le toca a ella; los mensajes entran de uno en
   * uno por abajo, con su hora, y los viejos se van por arriba. Un mensaje
   * `t: "…"` al final es el «escribiendo…» que ya no se va.
   */
  #chat(ch) {
    const datos = ch.chat || {};
    this.mensajes = ch.platica.filter((m) => m.t !== "…");
    this.sigue = ch.platica.some((m) => m.t === "…");
    this.estadoBase = datos.estado || "en línea";

    this.estadoEl = el("span.chat__estado", { text: this.estadoBase });
    this.escribeEl = el("div.chat__msg.chat__msg--tu.chat__escribe", { "aria-hidden": "true" }, [el("i"), el("i"), el("i")]);
    this.burbujas = this.mensajes.map((m) =>
      el(`div.chat__msg.chat__msg--${m.de === "yo" ? "yo" : "tu"}`, {}, [
        el("span.chat__texto", { text: m.t }),
        el("span.chat__hora", { text: m.h ? `${m.h} a. m.` : "" },
          m.de === "yo" ? [el("i.chat__visto", { text: " ✓✓", "aria-label": "visto" })] : []),
      ]));
    this.lista = el("div.chat__lista", { role: "log" }, [...this.burbujas, this.escribeEl]);

    this.chatEl = el("div.chat", {}, [
      el("div.chat__cabeza", {}, [
        el("span.chat__avatar", { text: "M", "aria-hidden": "true" }),
        el("div.chat__quien", {}, [el("b.chat__nombre", { text: datos.nombre || "Ella" }), this.estadoEl]),
      ]),
      el("div.chat__cuerpo", {}, [this.lista]),
    ]);
    return this.chatEl;
  }

  #reiniciarChat() {
    if (!this.burbujas) return;
    this.charla = { i: 0, t: -0.9, fase: "pausa" };
    this.horaChat = null;
    this.burbujas.forEach((b) => b.classList.remove("is-visible"));
    this.lista.classList.remove("is-borrando");
    this.#escribiendo(false);
  }

  #escribiendo(si) {
    this.escribeEl.classList.toggle("is-visible", si);
    this.estadoEl.textContent = si ? "escribiendo…" : this.estadoBase;
    this.estadoEl.classList.toggle("is-escribe", si);
  }

  /** El marco ocupa justo el hueco que deja la tarjeta, con la forma de la foto. */
  #medirMarco() {
    if (!this.marco || !this.root) return;
    const r = this.root.getBoundingClientRect();
    const c = this.card.getBoundingClientRect();
    const cs = getComputedStyle(this.root);
    const padT = parseFloat(cs.paddingTop) || 0;
    const padX = parseFloat(cs.paddingLeft) || 16;
    const apaisado = document.documentElement.dataset.orientation === "landscape";
    const maxW = apaisado ? (c.left - r.left) - padX * 2 : r.width - padX * 2;
    const maxH = apaisado ? r.height - padT * 2 : (c.top - r.top) - padT - 22;
    let w = maxW, h = w / this.fotoAr;
    if (h > maxH) { h = maxH; w = h * this.fotoAr; }
    setVars(this.marco, { "--marco-w": `${Math.max(60, Math.floor(w))}px`, "--marco-h": `${Math.max(80, Math.floor(h))}px` });
  }

  /** La foto en grande, encima de todo; un toque la cierra. */
  #lupa(abrir) {
    if (abrir && !this.lupaEl) {
      this.ctx.haptics.play("tap");
      const img = el("img", { src: this.marcoImg.src, alt: this.marcoImg.alt, draggable: "false" });
      this.lupaEl = el("div.depth__lupa", { role: "dialog", "aria-label": "Foto en grande", "data-claim-drag": "" }, [img, el("span.depth__lupa-cierra", { text: "toca para cerrar" })]);
      this.root.append(this.lupaEl);
      requestAnimationFrame(() => this.lupaEl?.classList.add("is-abierta"));
      this.addGestures(new Gestures(this.lupaEl, { onTap: () => this.#lupa(false) }, { exclusive: true, threshold: 10 }));
    } else if (!abrir && this.lupaEl) {
      const l = this.lupaEl;
      this.lupaEl = null;
      l.classList.remove("is-abierta");
      this.later(() => l.remove(), 360);
    }
  }

  /** 3:00, 3:01, 3:02… (los dos puntos parpadean solos, en CSS). */
  #reloj(dt) {
    if (!this.reloj) return;
    this.relojT += dt;
    if (this.relojT > 12) { this.relojT = 0; this.minuto = Math.min(59, this.minuto + 1); }
    let [h, m0] = String(this.chapter.reloj).split(":").map(Number);
    m0 = Math.min(59, (m0 || 0) + this.minuto);
    // Mientras el chat está a la vista, el reloj marca la hora del último
    // mensaje: se ve pasar la madrugada mientras nadie se va a dormir.
    if (this.chatVisto && this.horaChat) [h, m0] = this.horaChat;
    const m = String(m0).padStart(2, "0");
    const texto = `${h}:${m}`;
    if (texto === this.relojTexto) return;
    this.relojTexto = texto;
    this.reloj.replaceChildren(String(h), el("i", { text: ":" }), `${m} a. m.`);
  }

  /**
   * Los mensajes llegan de uno en uno, al ritmo de alguien que escribe:
   * los largos tardan más, y dos seguidos de la misma persona van casi
   * pegados. Al final se queda «escribiendo…» un buen rato y vuelta a
   * empezar, porque así son nuestras despedidas.
   */
  #platica(dt) {
    if (!this.burbujas || !this.chatVisto) return;
    const c = this.charla;
    c.t += dt;
    const m = this.mensajes[c.i];

    if (!m) {
      if (c.fase !== "final") {
        c.fase = "final";
        c.t = 0;
        if (this.sigue) this.later(() => this.#escribiendo(true), 900);
      } else if (c.t > 8.5) {
        this.#reiniciarChat();
      } else if (c.t > 7.6) {
        this.lista.classList.add("is-borrando");
      }
      return;
    }

    const escribe = m.de !== "yo";
    const tarda = Math.min(2.8, 0.7 + m.t.length * 0.032);
    if (c.fase === "pausa" && c.t >= 0) {
      c.fase = "escribe";
      c.t = 0;
      if (escribe) this.#escribiendo(true);
    } else if (c.fase === "escribe" && c.t >= tarda) {
      this.#escribiendo(false);
      this.burbujas[c.i].classList.add("is-visible");
      if (m.h) this.horaChat = m.h.split(":").map(Number);
      c.i += 1;
      c.fase = "pausa";
      const sig = this.mensajes[c.i];
      c.t = -(sig && sig.de === m.de ? 0.4 : 1.1);
    }
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
    this.#reloj(dt);
    this.#platica(dt);

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
    this.#lupa(false);
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
