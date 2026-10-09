/**
 * EFECTOS AL TOCAR Y ZONAS TÁCTILES — lo que pasa cuando ella toca algo.
 *
 *   e.toque      = { efecto, mov, color, cantidad }
 *                  efecto: partículas u ondas que salen del dedo
 *                  mov:    lo que hace el propio elemento (latido, rebote…)
 *   e.zonas      = [{ id, nombre, x, y, w, h, efecto, mov, color, cantidad,
 *                     sonido, volumen, accion }]
 *                  rectángulos relativos (0..1) dentro del elemento. En el
 *                  librito son invisibles; cada uno hace lo suyo. Como viven
 *                  dentro del elemento, se mueven, giran y escalan con él.
 *   pagina.toque = { efecto, color, cantidad }   cualquier toque en la hoja
 *
 * Todo se dibuja en una capa fija encima de la pantalla que nunca recibe
 * toques, con animaciones del navegador (sin bucles propios) y con un tope
 * de piezas a la vez: no se traba ni con muchos toques seguidos.
 */
(function (RT) {
  "use strict";

  RT.TOQUES = [
    ["", "Nada"], ["ondas", "Ondas"], ["corazones", "Corazones"], ["chispas", "Destellos"],
    ["estrellas", "Estrellitas"], ["confeti", "Confeti"], ["burbujas", "Burbujas"], ["teamo", "«Te amo»"],
  ];
  RT.MOVS = [
    ["", "Nada"], ["pulso", "Latido"], ["rebote", "Rebote"], ["saltito", "Saltito"], ["sacudir", "Sacudida"],
    ["girar", "Giro"], ["crecer", "Crecer"], ["brillo", "Brillo"], ["color", "Color"], ["desvanecer", "Opacidad"],
  ];

  const CORAZON = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>';
  const DESTELLO = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="currentColor"/></svg>';
  const ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill="currentColor"/></svg>';
  const MAX_PIEZAS = 90;
  let capa = null, vivas = 0;

  const quieto = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "reducido"; } catch (e) { return false; }
  };
  const azar = (a, b) => a + Math.random() * (b - a);

  function laCapa() {
    if (capa && capa.isConnected) return capa;
    capa = document.createElement("div");
    capa.className = "rt-fx-capa";
    capa.setAttribute("aria-hidden", "true");
    capa.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;contain:strict";
    document.body.appendChild(capa);
    return capa;
  }

  /** Una pieza que vuela y se borra sola. */
  function pieza(x, y, tam, html, color, frames, dur, extra) {
    if (vivas >= MAX_PIEZAS) return;
    const p = document.createElement("i");
    p.style.cssText = `position:absolute;left:${x - tam / 2}px;top:${y - tam / 2}px;width:${tam}px;height:${tam}px;color:${color};display:block;will-change:transform,opacity;${extra || ""}`;
    if (html) p.innerHTML = html;
    laCapa().appendChild(p);
    vivas++;
    let fin = false;
    const quitar = () => { if (fin) return; fin = true; vivas--; p.remove(); };
    try { const a = p.animate(frames, { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }); a.onfinish = quitar; a.oncancel = quitar; } catch (e) { /* nada */ }
    setTimeout(quitar, dur + 200);
    return p;
  }

  function paleta(color) {
    return [color, "#ff8fb1", "#ffd23f", "#8fd3ff", "#b79cff", "#7be0a8", "#ffffff"];
  }

  /** Partículas u ondas en (x, y) de la pantalla. */
  RT.particulas = function (tipo, x, y, op) {
    if (!tipo) return;
    op = op || {};
    const color = op.color || "#ff5c93";
    const k = Math.max(0.3, Math.min(2.5, +op.cantidad || 1)) * (quieto() ? 0.4 : 1);
    const n = (base) => Math.max(1, Math.round(base * k));
    switch (tipo) {
      case "ondas":
        for (let i = 0; i < (quieto() ? 1 : 3); i++) {
          setTimeout(() => pieza(x, y, 22, "", color, [
            { transform: "scale(.3)", opacity: 0.95 },
            { transform: `scale(${5 + i * 1.6 * k})`, opacity: 0 },
          ], 760 + i * 160, `border:2.5px solid ${color};border-radius:50%;box-shadow:0 0 10px ${color}`), i * 110);
        }
        break;
      case "corazones":
        for (let i = 0; i < n(7); i++) {
          const a = azar(-Math.PI * 0.9, -Math.PI * 0.1), d = azar(50, 130) * k, t = azar(14, 28);
          pieza(x, y, t, CORAZON, i % 3 ? color : "#ff8fb1", [
            { transform: "translate(0,0) scale(.2) rotate(0deg)", opacity: 1 },
            { transform: `translate(${Math.cos(a) * d * 0.6}px,${Math.sin(a) * d * 0.6}px) scale(1.1) rotate(${azar(-20, 20)}deg)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 40}px) scale(.8) rotate(${azar(-30, 30)}deg)`, opacity: 0 },
          ], azar(900, 1300), "filter:drop-shadow(0 2px 4px rgba(120,20,60,.25))");
        }
        break;
      case "chispas":
      case "estrellas": {
        const forma = tipo === "chispas" ? DESTELLO : ESTRELLA;
        const cols = paleta(color);
        for (let i = 0; i < n(10); i++) {
          const a = (i / n(10)) * Math.PI * 2 + azar(-0.3, 0.3), d = azar(40, 110) * k, t = azar(9, 20);
          pieza(x, y, t, forma, tipo === "chispas" ? (i % 2 ? "#fff6c8" : color) : cols[i % cols.length], [
            { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(${azar(90, 200)}deg)`, opacity: 1, offset: 0.6 },
            { transform: `translate(${Math.cos(a) * d * 1.15}px,${Math.sin(a) * d * 1.15 + 10}px) scale(0) rotate(260deg)`, opacity: 0 },
          ], azar(650, 950), `filter:drop-shadow(0 0 5px ${color})`);
        }
        break;
      }
      case "confeti": {
        const cols = paleta(color);
        for (let i = 0; i < n(16); i++) {
          const vx = azar(-140, 140) * k, sube = azar(60, 150) * k, w = azar(6, 10);
          pieza(x, y, w, "", cols[i % cols.length], [
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${vx * 0.6}px,${-sube}px) rotate(${azar(180, 360)}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${vx}px,${azar(80, 200)}px) rotate(${azar(500, 900)}deg)`, opacity: 0 },
          ], azar(1100, 1600), `background:${cols[i % cols.length]};height:${w * 0.45}px;border-radius:1px`);
        }
        break;
      }
      case "burbujas":
        for (let i = 0; i < n(8); i++) {
          const t = azar(10, 26), dx = azar(-60, 60) * k;
          pieza(x + azar(-12, 12), y, t, "", color, [
            { transform: "translate(0,0) scale(.3)", opacity: 0.9 },
            { transform: `translate(${dx * 0.5}px,${-azar(40, 70) * k}px) scale(1)`, opacity: 0.9, offset: 0.5 },
            { transform: `translate(${dx}px,${-azar(110, 170) * k}px) scale(1.15)`, opacity: 0 },
          ], azar(1100, 1700), `border-radius:50%;border:1.5px solid ${color};background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.95) 0 12%,rgba(255,255,255,.18) 30%,transparent 70%)`);
        }
        break;
      case "teamo": {
        const p = pieza(x, y, 10, "", color, [
          { transform: "translate(-50%,0) scale(.6)", opacity: 0 },
          { transform: "translate(-50%,-26px) scale(1.08)", opacity: 1, offset: 0.25 },
          { transform: "translate(-50%,-74px) scale(1)", opacity: 0 },
        ], 1500, `width:auto;height:auto;white-space:nowrap;font:600 ${Math.round(26 * Math.min(1.6, k))}px Caveat,"Dancing Script",cursive;text-shadow:0 2px 8px rgba(0,0,0,.18),0 0 14px rgba(255,255,255,.7)`);
        if (p) p.textContent = op.texto || "te amo";
        break;
      }
    }
  };

  /** Lo que hace el propio elemento al tocarlo (no pisa sus otras animaciones). */
  RT.moverAlToque = function (n, mov, op) {
    if (!n || !mov || !n._rt) return;
    const c = n._rt.c;
    const color = (op && op.color) || "#ff5c93";
    const base = c.style.filter || "";
    const corto = quieto();
    const F = {
      pulso: [[{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: 0.25 }, { transform: "scale(.97)", offset: 0.5 }, { transform: "scale(1.06)", offset: 0.7 }, { transform: "scale(1)" }], 650],
      rebote: [[{ transform: "scale(1,1)" }, { transform: "scale(1.18,.84)", offset: 0.2 }, { transform: "scale(.9,1.12)", offset: 0.45 }, { transform: "scale(1.05,.96)", offset: 0.7 }, { transform: "scale(1,1)" }], 620],
      saltito: [[{ transform: "translateY(0)" }, { transform: "translateY(-18%)", offset: 0.35 }, { transform: "translateY(0)", offset: 0.7 }, { transform: "translateY(-4%)", offset: 0.85 }, { transform: "translateY(0)" }], 600],
      sacudir: [[{ transform: "translateX(0)" }, { transform: "translateX(-7%) rotate(-3deg)", offset: 0.2 }, { transform: "translateX(6%) rotate(3deg)", offset: 0.4 }, { transform: "translateX(-4%)", offset: 0.6 }, { transform: "translateX(2%)", offset: 0.8 }, { transform: "translateX(0)" }], 520],
      girar: [[{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 700],
      crecer: [[{ transform: "scale(1)" }, { transform: "scale(1.22)", offset: 0.4 }, { transform: "scale(1.22)", offset: 0.6 }, { transform: "scale(1)" }], 900],
      brillo: [[{ filter: base || "none" }, { filter: `${base} brightness(1.35) drop-shadow(0 0 14px ${color}) drop-shadow(0 0 4px ${color})`.trim(), offset: 0.3 }, { filter: base || "none" }], 900],
      color: [[{ filter: `${base} hue-rotate(0deg)`.trim() }, { filter: `${base} hue-rotate(180deg) saturate(1.5)`.trim(), offset: 0.5 }, { filter: `${base} hue-rotate(360deg)`.trim() }], 900],
      desvanecer: [[{ opacity: 1 }, { opacity: 0.25, offset: 0.4 }, { opacity: 1 }], 800],
    }[mov];
    if (!F) return;
    try {
      if (c._toque) c._toque.cancel();
      c._toque = c.animate(F[0], { duration: corto ? Math.min(F[1], 300) : F[1], easing: "ease-out" });
    } catch (e) { /* nada */ }
  };

  /** Un toque completo: partículas en el dedo + movimiento del elemento. */
  RT.efectoToque = function (n, t, x, y) {
    if (!t) return;
    if (t.efecto) RT.particulas(t.efecto, x, y, t);
    if (t.mov && n) RT.moverAlToque(n, t.mov, t);
  };
  RT.tieneToque = (t) => !!(t && (t.efecto || t.mov));

  /* ── Zonas táctiles (sólo en el librito; en el editor se editan aparte) ── */
  RT.pintarZonas = function (n, e, ctx) {
    const zs = ctx.modo === "vista" ? (e.zonas || []).filter((z) => z && z.w > 0 && z.h > 0) : [];
    let cont = n._rt.zonas;
    const firma = JSON.stringify(zs);
    if (cont && cont._firma === firma) return;
    if (!zs.length) { if (cont) { cont.remove(); n._rt.zonas = null; } return; }
    if (!cont) { cont = RT.h("div", "rt-zonas", n); n._rt.zonas = cont; }
    cont._firma = firma;
    cont.textContent = "";
    for (const z of zs) {
      const d = RT.h("div", "rt-zona", cont);
      d.style.left = z.x * 100 + "%"; d.style.top = z.y * 100 + "%";
      d.style.width = z.w * 100 + "%"; d.style.height = z.h * 100 + "%";
      if (z.accion && z.accion.tipo) { d.setAttribute("role", "button"); d.tabIndex = 0; if (z.nombre) d.setAttribute("aria-label", z.nombre); }
      d.addEventListener("pointerdown", (ev) => {
        ev._rtToque = true;
        RT.efectoToque(n, z, ev.clientX, ev.clientY);
        if (z.sonido && ctx.sonido) ctx.sonido(z.sonido, z.volumen);
        if (z.vibrar && navigator.vibrate) { try { navigator.vibrate(18); } catch (err) { /* nada */ } }
      });
      let ultimo = 0;
      d.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!(z.accion && z.accion.tipo && ctx.accion)) return;
        const ahora = performance.now();
        if (ahora - ultimo < 380) return;
        ultimo = ahora;
        ctx.accion(z.accion, e);
      });
      d.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const r = d.getBoundingClientRect(); RT.efectoToque(n, z, r.left + r.width / 2, r.top + r.height / 2); d.click(); } });
    }
  };
})(window.LibritoRT = window.LibritoRT || {});
