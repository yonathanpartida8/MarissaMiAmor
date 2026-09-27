/**
 * ORNAMENTOS — la sorpresa pequeña de cada capítulo de papel.
 *
 * Una página de texto no tiene por qué ser sólo texto. Cada capítulo recibe
 * un ornamento distinto: una foto que se revela, un cristal que hay que
 * limpiar, un reflejo que te sigue, una brújula que gira. Son piezas
 * autónomas con el mismo contrato: { node, enter, tick, destroy }.
 *
 * Añadir uno nuevo es escribir una función y ponerla en el mapa del final.
 */

import { el, qs, setVars } from "../utils/dom.js";
import { Gestures } from "../core/Gestures.js";
import { ScratchSurface, fogLayer } from "./ScratchSurface.js";
import { createPhotoFrame } from "./PhotoFrame.js";
import { damp, clamp01 } from "../utils/math.js";
import { seeded } from "../utils/rng.js";
import { tween, easeOutExpo } from "../utils/easing.js";
import contenido from "../data/contenido.js";

/* ══════════════════════════════════════════════════════════════════
   MEDALLÓN — una fotografía que se revela como si se estuviera
   revelando de verdad: primero el grano, luego la luz, luego ella.
   ══════════════════════════════════════════════════════════════════ */
function medallion(ctx, { photo, accent }) {
  // Toda la presentación (revelado, paralaje, brillo, pellizco para acercar)
  // vive en PhotoFrame, compartida con las demás páginas que enseñan fotos.
  const frame = createPhotoFrame(ctx, {
    photo,
    shape: "oval",
    ratio: "4 / 5",
    parallax: 1,
    zoomable: true,
  });

  const node = el("figure.orn.orn--medallion", { style: { "--accent": accent } }, [
    el("div.medallion__glow"),
    frame.node,
  ]);

  return {
    node,
    async enter() {
      const img = await frame.load();
      // Una foto acostada (con letras, casi siempre) no cabe en un óvalo
      // sin perder las orillas: el marco toma su forma y se ve entera.
      const w = img?.naturalWidth, h = img?.naturalHeight;
      if (w && h && w > h * 1.12) {
        frame.node.dataset.shape = "rect";
        frame.node.style.setProperty("--ratio", `${w} / ${h}`);
        node.classList.add("is-acostada");
      }
      node.classList.add("is-developing");
    },
    tick(dt, time) {
      frame.tick(dt, time);
    },
    destroy() {
      frame.destroy();
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   VENTANA EMPAÑADA — la noche de tormenta. Hay que limpiar el vaho
   con el dedo para ver lo que hay fuera. Con lluvia que corre por
   el cristal y relámpagos de vez en cuando.
   ══════════════════════════════════════════════════════════════════ */
function fogWindow(ctx, { photo, accent, onReveal }) {
  const node = el("div.orn.orn--fog", { style: { "--accent": accent } }, [
    el("div.fog__scene"),
    el("canvas.fog__rain"),
    el("canvas.fog__glass", { "data-claim-drag": "" }),
    el("div.fog__flash"),
  ]);

  const scene = qs(".fog__scene", node);
  const glass = qs(".fog__glass", node);
  const rainCanvas = qs(".fog__rain", node);
  const flash = qs(".fog__flash", node);
  const rainCtx = rainCanvas.getContext("2d");

  let surface = null;
  let gestures = null;
  let drops = [];
  let nextBolt = 3 + Math.random() * 6;
  let revealed = false;

  const resize = () => {
    const rect = node.getBoundingClientRect();
    if (!rect.width) return;
    surface?.resize(rect.width, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    rainCanvas.width = rect.width * dpr;
    rainCanvas.height = rect.height * dpr;
    rainCanvas.style.width = `${rect.width}px`;
    rainCanvas.style.height = `${rect.height}px`;
    rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rng = seeded("lluvia");
    const count = ctx.caps.tierName === "low" ? 40 : 110;
    drops = Array.from({ length: count }, () => ({
      x: rng.range(0, rect.width),
      y: rng.range(0, rect.height),
      len: rng.range(8, 26),
      speed: rng.range(260, 620),
      alpha: rng.range(0.08, 0.3),
    }));
    node._size = rect;
  };

  return {
    node,
    async enter() {
      if (photo) {
        await ctx.assets.load(photo.src).catch(() => {});
        scene.style.backgroundImage = `url("${photo.src}")`;
      }

      surface = new ScratchSurface(glass, {
        paint: fogLayer(),
        brush: 40,
        threshold: 0.46,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        onProgress: (p) => {
          setVars(node, { "--clear": p.toFixed(3) });
          if (p > 0.05) ctx.haptics.scrub(p);
        },
        onComplete: async () => {
          if (revealed) return;
          revealed = true;
          ctx.haptics.play("reveal");
          await surface.dissolve(700);
          node.classList.add("is-clear");
          onReveal?.();
        },
      });

      resize();
      window.addEventListener("resize", resize);

      const toLocal = (e) => {
        const rect = glass.getBoundingClientRect();
        return { x: e.x - rect.left, y: e.y - rect.top };
      };

      gestures = new Gestures(
        glass,
        {
          onDown: (e) => {
            const p = toLocal(e);
            surface.scratch(p.x, p.y);
          },
          onPan: (e) => {
            const p = toLocal(e);
            surface.scratch(p.x, p.y, Math.min(1, Math.hypot(e.vx, e.vy) * 2));
          },
          onPanEnd: () => surface.lift(),
          onUp: () => surface.lift(),
        },
        { exclusive: true, threshold: 2 }
      );

      node.classList.add("is-live");
    },

    tick(dt, time) {
      const size = node._size;
      if (!size || !drops.length) return;

      // Lluvia
      rainCtx.clearRect(0, 0, size.width, size.height);
      rainCtx.strokeStyle = "#ffd9e2";
      rainCtx.lineWidth = 1;
      for (const drop of drops) {
        drop.y += drop.speed * dt;
        if (drop.y > size.height) {
          drop.y = -drop.len;
          drop.x = Math.random() * size.width;
        }
        rainCtx.globalAlpha = drop.alpha;
        rainCtx.beginPath();
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x - 1.5, drop.y + drop.len);
        rainCtx.stroke();
      }
      rainCtx.globalAlpha = 1;

      // Relámpagos ocasionales: dos destellos seguidos, como los de verdad.
      nextBolt -= dt;
      if (nextBolt <= 0) {
        nextBolt = 5 + Math.random() * 9;
        flash.classList.remove("is-bolt");
        void flash.offsetWidth;
        flash.classList.add("is-bolt");
        ctx.gl?.pulse(0.5);
      }
    },

    destroy() {
      window.removeEventListener("resize", resize);
      gestures?.destroy();
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   ESPEJO — la fotografía y su reflejo. El reflejo no copia: va con
   retraso y se ondula, como el agua. Y sigue la inclinación al revés.
   ══════════════════════════════════════════════════════════════════ */
function mirror(ctx, { photo, accent }) {
  const node = el("div.orn.orn--mirror", { style: { "--accent": accent } }, [
    el("div.mirror__real"),
    el("div.mirror__reflection", {}, [el("div.mirror__ripple")]),
  ]);

  const real = qs(".mirror__real", node);
  const reflection = qs(".mirror__reflection", node);
  let lag = { x: 0, y: 0 };

  return {
    node,
    async enter() {
      if (!photo) return;
      await ctx.assets.load(photo.src).catch(() => {});
      const url = `url("${photo.src}")`;
      real.style.backgroundImage = url;
      reflection.style.backgroundImage = url;
      requestAnimationFrame(() => node.classList.add("is-visible"));
    },
    tick(dt, time) {
      const p = ctx.pointer.influence;
      // El reflejo llega tarde: es lo que lo hace inquietante y bonito.
      lag.x = damp(lag.x, p.x, 2.4, dt);
      lag.y = damp(lag.y, p.y, 2.4, dt);

      // Redondeado: con el teléfono quieto los valores convergen y el
      // navegador deja de recalcular. La onda del agua ya no se calcula
      // aquí: es una animación CSS, que corre en el compositor y sale gratis.
      real.style.transform =
        `translate3d(${(p.x * 9).toFixed(1)}px, ${(p.y * -6).toFixed(1)}px, 0) scale(1.02)`;
      reflection.style.transform =
        `translate3d(${(lag.x * -13).toFixed(1)}px, ${(lag.y * 5).toFixed(1)}px, 0) ` +
        `scaleY(-1) skewX(${(lag.x * 2.4).toFixed(2)}deg)`;
      reflection.style.opacity = (0.3 + Math.abs(lag.x) * 0.18).toFixed(3);
    },
    destroy() {},
  };
}

/* ══════════════════════════════════════════════════════════════════
   BRÚJULA — gira al tocarla y, dé las vueltas que dé, siempre acaba
   apuntando al mismo sitio. Ése es todo el chiste, y es el capítulo.
   ══════════════════════════════════════════════════════════════════ */
function compass(ctx, { accent, onReveal }) {
  const node = el("div.orn.orn--compass", { style: { "--accent": accent } }, [
    el("div.compass__dial", {}, [
      el("div.compass__ring"),
      el("div.compass__marks"),
      el("div.compass__needle"),
      el("div.compass__pin"),
    ]),
    el("div.compass__label", { text: "tócala" }),
  ]);

  const needle = qs(".compass__needle", node);
  const label = qs(".compass__label", node);
  let gestures = null;
  let spinning = false;
  let angle = 0;
  let idle = 0;

  const spin = async () => {
    if (spinning) return;
    spinning = true;
    ctx.haptics.play("tap");
    ctx.audio.play("turn", { volume: 0.3, rate: 1.5 });
    label.textContent = "";

    const turns = 3 + Math.floor(Math.random() * 3);
    const from = angle;
    const to = from + 360 * turns + (360 - (from % 360)); // siempre acaba en 0

    await tween({
      from,
      to,
      duration: 1500,
      ease: easeOutExpo,
      onUpdate: (v) => {
        angle = v;
        needle.style.transform = `rotate(${v}deg)`;
        // Un clic al cruzar cada marca, cada vez más espaciado.
        const marks = Math.floor(v / 45);
        if (marks !== needle._marks) {
          needle._marks = marks;
          ctx.haptics.scrub(0.3);
        }
      },
    });

    node.classList.add("is-settled");
    label.textContent = "siempre tú";
    ctx.haptics.play("heart");
    onReveal?.();
    spinning = false;
  };

  return {
    node,
    async enter() {
      gestures = new Gestures(node, { onTap: spin }, { exclusive: true });
      requestAnimationFrame(() => node.classList.add("is-visible"));
    },
    tick(dt, time) {
      if (spinning) return;
      // En reposo la aguja tiembla un poco, como una brújula de verdad.
      idle = damp(idle, Math.sin(time * 1.7) * 2.4 + ctx.pointer.influence.x * 5, 3, dt);
      needle.style.transform = `rotate(${angle + idle}deg)`;
    },
    destroy() {
      gestures?.destroy();
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   SUSURRO — el texto está escrito tan bajito que casi no se lee.
   Hay que mantener el dedo encima para que suba la voz.
   ══════════════════════════════════════════════════════════════════ */
function whisper(ctx, { accent, target, onReveal }) {
  const node = el("div.orn.orn--whisper", { style: { "--accent": accent } }, [
    el("div.whisper__pad", { "data-claim-drag": "" }, [
      el("div.whisper__ring"),
      el("div.whisper__hint", { text: "mantén el dedo aquí" }),
    ]),
  ]);

  const pad = qs(".whisper__pad", node);
  let gestures = null;
  let holding = false;
  let volume = 0;
  let done = false;

  return {
    node,
    async enter() {
      target?.classList.add("is-whispered");
      gestures = new Gestures(
        pad,
        {
          onDown: () => {
            holding = true;
            ctx.haptics.play("tap");
          },
          onUp: () => (holding = false),
        },
        { exclusive: true }
      );
      requestAnimationFrame(() => node.classList.add("is-visible"));
    },
    tick(dt, time, realDt = dt) {
      const before = volume;
      // Sube despacio al mantener, baja despacio al soltar: hay que insistir.
      // En tiempo real: subir la voz no puede costar más en un móvil lento.
      volume = clamp01(volume + (holding ? realDt * 0.55 : -realDt * 0.32));
      if (volume === before) return;

      target?.style.setProperty("--voice", String(volume));
      node.style.setProperty("--voice", String(volume));
      if (holding && Math.random() < realDt * 6) ctx.haptics.scrub(volume * 0.6);

      if (volume >= 0.99 && !done) {
        done = true;
        target?.classList.add("is-heard");
        ctx.haptics.play("reveal");
        onReveal?.();
      }
    },
    destroy() {
      gestures?.destroy();
      target?.classList.remove("is-whispered");
      target?.style.removeProperty("--voice");
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   VELITA — una vela apagada. Se enciende al tocarla y se queda
   encendida, con su luz tibia sobre el papel. Tocarla otra vez la hace
   titilar, como si alguien le soplara despacito.
   ══════════════════════════════════════════════════════════════════ */
function vela(ctx, { accent, onReveal }) {
  const node = el("div.orn.orn--vela", { style: { "--accent": accent } }, [
    el("div.vela__halo"),
    el("div.vela__cuerpo", {}, [
      el("span.vela__llama"),
      el("span.vela__mecha"),
      el("span.vela__cera"),
      el("span.vela__plato"),
    ]),
    el("div.vela__label", { text: "enciéndela" }),
  ]);
  const label = qs(".vela__label", node);
  let gestures = null;
  let encendida = false;

  const tocar = () => {
    if (encendida) {
      node.classList.remove("is-soplo");
      void node.offsetWidth;
      node.classList.add("is-soplo");
      ctx.haptics.play("tap");
      return;
    }
    encendida = true;
    node.classList.add("is-encendida");
    label.textContent = "una velita, por quedarte";
    ctx.haptics.play("heart");
    ctx.audio.play("turn", { volume: 0.22, rate: 0.55 });
    onReveal?.();
  };

  return {
    node,
    async enter() {
      gestures = new Gestures(node, { onTap: tocar }, { exclusive: true });
      requestAnimationFrame(() => node.classList.add("is-visible"));
    },
    tick(dt, time) {
      if (!encendida) return;
      // Una llama de verdad no late: tiembla con dos ritmos que no cuadran.
      const f = 0.93 + Math.sin(time * 9.3) * 0.04 + Math.sin(time * 23.1) * 0.03;
      node.style.setProperty("--flama", f.toFixed(3));
    },
    destroy() {
      gestures?.destroy();
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   ONDA — la voz dibujada, como una nota de voz.

   Si en la carpeta `audio/` está `audio.mp3` (ver `audio/LÉEME.md`), es
   una nota de voz de verdad: se toca para escucharla, las barritas se
   van encendiendo conforme avanza y la música del libro se aparta para
   que se oiga bien. Mientras suena, el texto va apareciendo.

   Si no hay audio, se queda como antes: se mantiene el dedo y la onda se
   anima como si alguien hablara bajito.
   ══════════════════════════════════════════════════════════════════ */
function onda(ctx, { accent, target, onReveal }) {
  const archivo = contenido?.sonidos?.voz || null;
  const N = 27;
  const barras = Array.from({ length: N }, () => el("span.onda__barra"));
  // Una forma de onda fija, como la de un audio de WhatsApp.
  const forma = barras.map((_, i) => 0.28 + 0.72 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43)));
  const boton = el("span.onda__play", { "aria-hidden": "true" });
  const tiempo = el("span.onda__tiempo", { text: "0:00" });
  const pista = el("div.onda__hint", {
    text: archivo ? "toca para escuchar mi voz 🎧" : "mantén el dedo y escucha",
  });
  const node = el("div.orn.orn--onda", { style: { "--accent": accent } }, [
    el("div.onda__pad" + (archivo ? ".is-nota" : ""), { "data-claim-drag": "", role: archivo ? "button" : null, "aria-label": archivo ? "Escuchar mi nota de voz" : null }, [
      el("div.onda__fila", {}, [archivo ? boton : null, el("div.onda__barras", {}, barras), archivo ? tiempo : null]),
      pista,
    ]),
  ]);
  const pad = qs(".onda__pad", node);
  let gestures = null;
  let holding = false;
  let volume = 0;
  let done = false;

  // La nota de voz.
  let voz = null;
  let sonando = false;
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const parar = () => {
    if (!voz) return;
    voz.pause();
    sonando = false;
    node.classList.remove("is-sonando");
    ctx.audio?.soltar?.("nota-de-voz");
  };
  const tocar = () => {
    if (!archivo) return;
    if (!voz) {
      voz = new Audio(archivo.split("/").map(encodeURIComponent).join("/"));
      voz.preload = "auto";
      voz.addEventListener("loadedmetadata", () => { tiempo.textContent = fmt(voz.duration || 0); });
      voz.addEventListener("ended", () => {
        parar();
        voz.currentTime = 0;
        pista.textContent = "otra vez 🥹";
        if (!done) {
          done = true;
          target?.classList.add("is-heard");
          onReveal?.();
        }
      });
      voz.addEventListener("error", () => {
        parar();
        pista.textContent = "no se pudo abrir el audio 😢";
      });
    }
    if (sonando) {
      parar();
      pista.textContent = "toca para seguir escuchando";
      return;
    }
    sonando = true;
    node.classList.add("is-sonando");
    ctx.audio?.mantener?.("nota-de-voz", 0.05);
    pista.textContent = "escuchando… 🤍";
    voz.play().catch(() => parar());
  };

  return {
    node,
    async enter() {
      target?.classList.add("is-whispered");
      gestures = new Gestures(
        pad,
        archivo
          ? {
              onTap: () => {
                ctx.haptics.play("tap");
                tocar();
              },
            }
          : {
              onDown: () => {
                holding = true;
                ctx.haptics.play("tap");
              },
              onUp: () => (holding = false),
            },
        { exclusive: true }
      );
      requestAnimationFrame(() => node.classList.add("is-visible"));
    },
    leave() {
      parar();
    },
    tick(dt, time, realDt = dt) {
      const habla = archivo ? sonando : holding;
      volume = clamp01(volume + (habla ? realDt * (archivo ? 0.35 : 0.55) : -realDt * 0.32));
      if (archivo && (done || sonando)) volume = Math.max(volume, done ? 1 : volume);
      target?.style.setProperty("--voice", String(volume));
      node.style.setProperty("--voice", String(volume));
      const avance = voz && voz.duration ? voz.currentTime / voz.duration : 0;
      if (sonando && voz) tiempo.textContent = fmt(Math.max(0, (voz.duration || 0) - voz.currentTime));
      // Las barras respiran siempre un poquito; con la voz, hablan.
      barras.forEach((b, i) => {
        let h;
        if (archivo) {
          const vivo = sonando ? 0.55 + 0.45 * Math.abs(Math.sin(time * (6 + (i % 4)) + i)) : 1;
          h = forma[i] * vivo;
          b.classList.toggle("is-oida", i / N < avance || (done && !sonando && avance === 0));
        } else {
          const hablando = Math.abs(Math.sin(time * (5.3 + (i % 5)) + i * 0.7)) * (0.35 + 0.65 * Math.abs(Math.sin(time * 1.3 + i)));
          h = 0.12 + volume * 0.88 * hablando + Math.sin(time * 1.6 + i * 0.5) * 0.04;
        }
        b.style.transform = `scaleY(${Math.max(0.08, h).toFixed(3)})`;
      });
      if (habla && Math.random() < realDt * 6) ctx.haptics.scrub(volume * 0.6);
      if (!archivo && volume >= 0.99 && !done) {
        done = true;
        target?.classList.add("is-heard");
        ctx.haptics.play("reveal");
        onReveal?.();
      }
    },
    destroy() {
      parar();
      voz = null;
      gestures?.destroy();
      target?.classList.remove("is-whispered");
      target?.style.removeProperty("--voice");
    },
  };
}

/* ══════════════════════════════════════════════════════════════════ */

const ORNAMENTS = {
  vela,
  onda,
  medallion,
  fog: fogWindow,
  mirror,
  compass,
  whisper,
};

/**
 * Crea el ornamento indicado. Si no existe, cae en el medallón, que
 * funciona siempre y nunca desentona.
 */
export function createOrnament(name, ctx, options) {
  const factory = ORNAMENTS[name] || ORNAMENTS.medallion;
  return factory(ctx, options);
}

