/*
 * LIBRITO · magia
 *
 * Efectos que acompañan a un elemento: chispas, brillitos, estela, resplandor,
 * ondas de energía, corazones, polvo mágico y halo. Se combinan entre sí y
 * con cualquier animación (anim.magia es una lista).
 *
 *   e.anim.magia = [{ tipo, momento, color, cantidad, retraso }]
 *     momento  "entrada" al terminar de llegar · "siempre" mientras está
 *              · "salida" al irse · "tocar" al tocarlo (en el librito)
 *
 * Todo son piezas chiquitas animadas con la API de animaciones del navegador
 * (sólo transform y opacidad: las mueve la tarjeta gráfica) y con el azar
 * «sembrado» por elemento: la línea de tiempo del editor puede ir a cualquier
 * instante y se ve SIEMPRE lo mismo. Hay un tope de piezas por elemento.
 */
(function (RT) {
  "use strict";

  RT.MAGIA = {
    chispas: { n: "Chispas" },
    brillitos: { n: "Brillitos" },
    estela: { n: "Estela" },
    resplandor: { n: "Resplandor" },
    ondas: { n: "Ondas de energía" },
    corazones: { n: "Corazones" },
    polvo: { n: "Polvo mágico" },
    halo: { n: "Halo" },
  };
  RT.MAGIA_MOMENTOS = [["entrada", "Al aparecer"], ["siempre", "Mientras está"], ["salida", "Al irse"], ["tocar", "Al tocarlo"]];

  const ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor"/></svg>';
  const CORAZON = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>';
  // Lo que no se copia para la estela (pesado o con vida propia).
  const SIN_ESTELA = /^(video|componente|html|pagina|escena3d|carrusel|album|musica)$/;

  /** Azar con semilla: el mismo elemento da siempre las mismas chispas. */
  function semilla(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function caja(n, e) {
    const b = n._rt && n._rt.caja;
    return { w: Math.max(8, (b && b.w) || e.w || 100), h: Math.max(8, (b && b.h) || e.h || 100) };
  }

  /** La capa de la magia dentro del elemento (detrás o delante del contenido). */
  function capa(A, n, detras) {
    const c = document.createElement("div");
    c.className = "rt-mg" + (detras ? " rt-mg-detras" : "");
    c.setAttribute("aria-hidden", "true");
    // Sin z-index: detrás = primero en el orden (se pinta antes que el contenido), delante = último.
    c.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible";
    if (detras) n.insertBefore(c, n.firstChild); else n.appendChild(c);
    A.extras = A.extras || [];
    A.extras.push(c);
    return c;
  }

  function pieza(c, tam, html, css) {
    const p = document.createElement("i");
    p.style.cssText = `position:absolute;left:50%;top:50%;width:${tam}px;height:${tam}px;margin:${-tam / 2}px 0 0 ${-tam / 2}px;display:block;opacity:0;${css || ""}`;
    if (html) p.innerHTML = html;
    c.appendChild(p);
    return p;
  }

  function animar(A, nodo, k, op) {
    try { const a = nodo.animate(k, op); A.anims.push(a); return a; } catch (err) { return null; }
  }

  /**
   * Una pasada de un efecto. `t0` = cuándo (ms desde que arranca la página),
   * `siempre` = se repite mientras está. Devuelve cuánto dura una pasada.
   */
  const EFECTOS = {
    chispas(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), R = Math.max(w, h) * 0.62, q = Math.round(12 * m.k), dur = 950;
      for (let i = 0; i < q; i++) {
        const a = (i / q) * Math.PI * 2 + (az() - 0.5) * 0.6, d = R * (0.75 + az() * 0.55), t = 8 + az() * 10;
        const p = pieza(c, t, ESTRELLA, `color:${i % 2 ? "#fff7cf" : m.color};filter:drop-shadow(0 0 4px ${m.color})`);
        const fin = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px) scale(0) rotate(270deg)`;
        const k = [
          { transform: "translate(0px,0px) scale(0) rotate(0deg)", opacity: 1, offset: 0 },
          { transform: `translate(${Math.cos(a) * d * 0.85}px,${Math.sin(a) * d * 0.85}px) scale(1) rotate(${120 + az() * 120}deg)`, opacity: 1, offset: siempre ? 0.22 : 0.55 },
          { transform: fin, opacity: 0, offset: siempre ? 0.4 : 1 },
        ];
        // Repitiéndose: estalla y descansa (el resto de la vuelta, quieta e invisible).
        if (siempre) k.push({ transform: fin, opacity: 0, offset: 1 });
        animar(A, p, k, { duration: siempre ? 2600 : dur, delay: t0 + az() * 80, iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.2,.7,.3,1)" });
      }
      return dur;
    },
    brillitos(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(9 * m.k), dur = 1500;
      for (let i = 0; i < q; i++) {
        // En el borde (un poquito fuera): se ve como un aura de destellos.
        const lado = az() * 4 | 0, u = az();
        const x = lado < 2 ? (u - 0.5) * w * 1.1 : (lado === 2 ? -0.55 : 0.55) * w, y = lado < 2 ? (lado === 0 ? -0.55 : 0.55) * h : (u - 0.5) * h * 1.1;
        const t = 7 + az() * 9, ret = az() * (siempre ? 2200 : 400);
        const p = pieza(c, t, ESTRELLA, `color:${az() < 0.35 ? "#ffffff" : m.color};filter:drop-shadow(0 0 3px ${m.color})`);
        animar(A, p, [
          { transform: `translate(${x}px,${y}px) scale(0) rotate(0deg)`, opacity: 0 },
          { transform: `translate(${x}px,${y}px) scale(1) rotate(45deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${x}px,${y - 6}px) scale(0) rotate(90deg)`, opacity: 0 },
        ], { duration: siempre ? 1300 + az() * 1200 : dur, delay: t0 + ret, iterations: siempre ? Infinity : 1, easing: "ease-in-out" });
      }
      return dur + 400;
    },
    ondas(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, true), d = Math.max(w, h) * 0.7, dur = 1100;
      for (let i = 0; i < 3; i++) {
        const p = pieza(c, d, "", `border-radius:50%;border:2px solid ${m.color};box-shadow:0 0 12px ${m.color},inset 0 0 10px ${m.color}`);
        animar(A, p, [{ transform: "scale(.35)", opacity: 0.95 }, { transform: `scale(${1.9 + m.k * 0.4})`, opacity: 0 }], { duration: dur, delay: t0 + i * 220, iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.2,.6,.3,1)", endDelay: siempre ? 900 : 0 });
      }
      return dur + 440;
    },
    resplandor(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, true), d = Math.max(w, h) * 1.25;
      const p = pieza(c, d, "", `border-radius:50%;background:radial-gradient(circle, ${m.color} 0%, ${m.color}99 30%, transparent 68%);filter:blur(10px)`);
      if (siempre) animar(A, p, [{ transform: "scale(.82)", opacity: 0.35 * m.k }, { transform: "scale(1.06)", opacity: Math.min(1, 0.85 * m.k) }, { transform: "scale(.82)", opacity: 0.35 * m.k }], { duration: 2400, delay: t0, iterations: Infinity, easing: "ease-in-out" });
      else animar(A, p, [{ transform: "scale(.5)", opacity: 0 }, { transform: "scale(1.1)", opacity: Math.min(1, 0.95 * m.k), offset: 0.35 }, { transform: "scale(1.25)", opacity: 0 }], { duration: 1200, delay: t0, easing: "ease-out" });
      return 1200;
    },
    corazones(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(6 * m.k), dur = 1700;
      for (let i = 0; i < q; i++) {
        const x0 = (az() - 0.5) * w * 0.8, sube = h * (0.6 + az() * 0.6) + 30, vaiven = 10 + az() * 16, t = 11 + az() * 10;
        const p = pieza(c, t, CORAZON, `color:${i % 3 ? m.color : "#ff8fb1"};filter:drop-shadow(0 2px 3px rgba(120,20,60,.25))`);
        animar(A, p, [
          { transform: `translate(${x0}px,${h * 0.3}px) scale(.3)`, opacity: 0 },
          { transform: `translate(${x0 + vaiven}px,${h * 0.3 - sube * 0.35}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x0 - vaiven}px,${h * 0.3 - sube * 0.7}px) scale(.95)`, opacity: 0.9, offset: 0.65 },
          { transform: `translate(${x0}px,${h * 0.3 - sube}px) scale(.8)`, opacity: 0 },
        ], { duration: siempre ? dur + az() * 900 : dur, delay: t0 + (siempre ? az() * 2600 : az() * 300), iterations: siempre ? Infinity : 1, easing: "linear" });
      }
      return dur + 300;
    },
    polvo(A, n, e, m, t0, siempre, az, dur0) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(18 * m.k), dur = Math.max(600, dur0 || 900);
      for (let i = 0; i < q; i++) {
        const x = (az() - 0.5) * w * 0.9, y = (az() - 0.5) * h * 0.9, t = 2 + az() * 4, dx = (az() - 0.5) * 50, dy = -(30 + az() * 70);
        const p = pieza(c, t, "", `border-radius:50%;background:${az() < 0.3 ? "#fff6d8" : m.color};box-shadow:0 0 6px ${m.color}`);
        animar(A, p, [
          { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0 },
          { transform: `translate(${x + dx * 0.3}px,${y + dy * 0.3}px) scale(1.2)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${x + dx}px,${y + dy}px) scale(.2)`, opacity: 0 },
        ], { duration: siempre ? 1800 + az() * 1400 : dur * (0.7 + az() * 0.5), delay: t0 + az() * (siempre ? 2400 : dur * 0.35), iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.3,.6,.4,1)" });
      }
      return dur;
    },
    halo(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, false), r = Math.max(w, h) * 0.62, q = 10;
      const anillo = pieza(c, 2 * r, "", "");
      for (let i = 0; i < q; i++) {
        const a = (i / q) * Math.PI * 2, t = i % 2 ? 5 : 8;
        const d = document.createElement("i");
        d.style.cssText = `position:absolute;left:50%;top:50%;width:${t}px;height:${t}px;margin:${-t / 2}px 0 0 ${-t / 2}px;border-radius:50%;background:${i % 3 ? m.color : "#fff"};box-shadow:0 0 8px ${m.color};transform:translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px)`;
        anillo.appendChild(d);
      }
      if (siempre) animar(A, anillo, [{ transform: "rotate(0deg) scale(1)", opacity: 0.9 }, { transform: "rotate(180deg) scale(1.04)", opacity: 0.6 }, { transform: "rotate(360deg) scale(1)", opacity: 0.9 }], { duration: 5200 / Math.max(0.3, m.k), delay: t0, iterations: Infinity, easing: "linear" });
      else animar(A, anillo, [{ transform: "rotate(-90deg) scale(.4)", opacity: 0 }, { transform: "rotate(90deg) scale(1)", opacity: 1, offset: 0.5 }, { transform: "rotate(200deg) scale(1.15)", opacity: 0 }], { duration: 1400, delay: t0, easing: "cubic-bezier(.2,.7,.3,1)" });
      return 1400;
    },
    /* La estela: copias del elemento que repiten SUS animaciones un pelín
       después, cada vez más transparentes (sólo mientras se mueve). */
    estela(A, n, e, m, t0, siempre, az, dur0, t) {
      if (SIN_ESTELA.test(e.tipo) || !n._rt) return 0;
      const capas = [n._rt.ae, n._rt.ab, n._rt.c];
      const propias = A.anims.filter((a) => a.effect && capas.indexOf(a.effect.target) >= 0);
      if (!propias.length) return 0;
      const copias = Math.max(2, Math.min(5, Math.round(3 * m.k)));
      for (let i = 1; i <= copias; i++) {
        const g = capa(A, n, true);
        g.style.opacity = String(0.42 * Math.pow(0.62, i - 1));
        g.style.filter = `blur(${i * 0.6}px)`;
        const ve = g.appendChild(document.createElement("div")), ae = ve.appendChild(document.createElement("div")), ab = ae.appendChild(document.createElement("div")), cc = ab.appendChild(n._rt.c.cloneNode(true));
        for (const x of [ve, ae, ab, cc]) x.style.cssText += ";position:relative;width:100%;height:100%;box-sizing:border-box";
        const mapa = new Map([[n._rt.ae, ae], [n._rt.ab, ab], [n._rt.c, cc]]);
        for (const a of propias) {
          const tm = a.effect.getTiming();
          animar(A, mapa.get(a.effect.target), a.effect.getKeyframes(), Object.assign({}, tm, { delay: (tm.delay || 0) + i * 55 }));
        }
        // Sólo se ve mientras hay movimiento: al terminar la entrada se apaga.
        if (!siempre) animar(A, ve, [{ opacity: 0 }, { opacity: 1, offset: 0.05 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: Math.max(200, (t.fin - t.ini) + i * 55 + 120), delay: t.ini, fill: "both" });
      }
      return 0;
    },
  };

  function datos(m, e, i) {
    return { tipo: m.tipo, color: m.color || "#ff7fae", k: RT.clamp(RT.num(+m.cantidad, 1), 0.3, 2.5), retraso: RT.num(+m.retraso, 0), az: semilla((e.id || "x") + ":" + i + ":" + m.tipo) };
  }

  /**
   * La magia de un elemento dentro de un animador de página (editor y librito).
   * `t` = { ini, fin, hasta } en ms de la página, o { salida: true, desde, dur }.
   */
  RT.magia = function (A, n, e, t) {
    const lista = ((e.anim && e.anim.magia) || []).slice();
    // La salida «polvo mágico» trae su polvo aunque no se haya puesto.
    const sa = e.anim && e.anim.salida, def = sa && RT.ANIM.salida[sa.tipo];
    if (def && def.magia && !lista.some((x) => x.tipo === def.magia && x.momento === "salida")) lista.push({ tipo: def.magia, momento: "salida", auto: true });
    lista.forEach((m0, i) => {
      const f = EFECTOS[m0.tipo];
      if (!f) return;
      const m = datos(m0, e, i);
      const mo = m0.momento || "entrada";
      if (t.salida) {
        if (mo === "salida") f(A, n, e, m, t.desde + m.retraso, false, m.az, t.dur, t);
        return;
      }
      if (mo === "entrada") f(A, n, e, m, (m0.tipo === "estela" ? 0 : Math.max(t.ini, t.fin - 160)) + m.retraso, false, m.az, 0, t);
      else if (mo === "siempre") f(A, n, e, m, t.fin + m.retraso, true, m.az, 0, t);
      else if (mo === "salida" && t.hasta != null) {
        const p = sa && RT.ANIM.salida[sa.tipo] && sa.tipo !== "ninguna" ? RT.num(sa.dur, 500) : 600;
        f(A, n, e, m, Math.max(t.ini, t.hasta - p) + m.retraso, false, m.az, p, t);
      }
    });
  };

  /** Al tocarlo (en el librito): la magia «tocar» suena una vez y se recoge sola. */
  RT.magiaAlTocar = function (n, e) {
    const lista = ((e.anim && e.anim.magia) || []).filter((m) => m.momento === "tocar" && EFECTOS[m.tipo] && m.tipo !== "estela");
    if (!lista.length || RT.menosMovimiento()) return;
    if (n._mgToque) { for (const a of n._mgToque.anims) { try { a.cancel(); } catch (err) { /* nada */ } } for (const x of n._mgToque.extras || []) x.remove(); }
    const A = { anims: [], extras: [] };
    n._mgToque = A;
    let max = 0;
    lista.forEach((m0, i) => { const m = datos(m0, e, i); m.az = semilla(e.id + ":" + i + ":" + performance.now()); max = Math.max(max, EFECTOS[m0.tipo](A, n, e, m, m.retraso, false, m.az, 900, { ini: 0, fin: 0 }) + m.retraso); });
    setTimeout(() => { if (n._mgToque !== A) return; for (const x of A.extras) x.remove(); n._mgToque = null; }, max + 1400);
  };

  /* ── Fase 43: una animación al tocarlo (de una vez; se suma a lo que ya haga y a su acción) ── */
  RT.AL_TOCAR = [["", "Nada"], ["saltito", "Saltito"], ["latido", "Latido"], ["giro", "Una vuelta"], ["gelatina", "Gelatina"], ["sacudir", "Sacudirse"], ["tada", "¡Tadá!"], ["brillo", "Brillo"], ["corazones", "Corazoncitos"]];
  const AL_TOCAR = {
    saltito: [[{ transform: "translateY(0)" }, { transform: "translateY(-18%)", offset: 0.35 }, { transform: "translateY(0)", offset: 0.7 }, { transform: "translateY(-5%)", offset: 0.85 }, { transform: "translateY(0)" }], 620],
    latido: [[{ transform: "scale(1)" }, { transform: "scale(1.18)", offset: 0.25 }, { transform: "scale(.97)", offset: 0.45 }, { transform: "scale(1.1)", offset: 0.65 }, { transform: "scale(1)" }], 760],
    giro: [[{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 700],
    gelatina: [[{ transform: "scale(1,1)" }, { transform: "scale(1.2,.82)", offset: 0.3 }, { transform: "scale(.88,1.12)", offset: 0.5 }, { transform: "scale(1.06,.95)", offset: 0.7 }, { transform: "scale(1,1)" }], 720],
    sacudir: [[{ transform: "translateX(0)" }, { transform: "translateX(-7%) rotate(-4deg)", offset: 0.2 }, { transform: "translateX(6%) rotate(3deg)", offset: 0.4 }, { transform: "translateX(-4%) rotate(-2deg)", offset: 0.6 }, { transform: "translateX(2%)", offset: 0.8 }, { transform: "translateX(0)" }], 560],
    tada: [[{ transform: "scale(1) rotate(0)" }, { transform: "scale(.9) rotate(-4deg)", offset: 0.15 }, { transform: "scale(1.14) rotate(4deg)", offset: 0.35 }, { transform: "scale(1.14) rotate(-4deg)", offset: 0.55 }, { transform: "scale(1.14) rotate(3deg)", offset: 0.75 }, { transform: "scale(1) rotate(0)" }], 900],
    brillo: [[{ filter: "brightness(1) drop-shadow(0 0 0 rgba(255,170,210,0))" }, { filter: "brightness(1.35) drop-shadow(0 0 16px rgba(255,170,210,.95))", offset: 0.4 }, { filter: "brightness(1) drop-shadow(0 0 0 rgba(255,170,210,0))" }], 800],
  };
  RT.animarAlTocar = function (n, tipo, ev) {
    if (!n || !n._rt || !n.animate) return;
    if (tipo === "corazones") {
      // Unos corazoncitos que salen del dedo (sin tocar al elemento).
      const r = n.getBoundingClientRect(), x = ev && ev.clientX != null ? ev.clientX : r.left + r.width / 2, y = ev && ev.clientY != null ? ev.clientY : r.top + r.height / 2;
      for (let i = 0; i < 7; i++) {
        const c = document.createElement("i"), a = (i / 7) * Math.PI * 2, d = 34 + Math.random() * 30;
        c.textContent = "♥";
        c.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:2147483000;pointer-events:none;font-style:normal;font-size:${14 + Math.random() * 10}px;color:${["#ff5c8a", "#ff8fbf", "#d8397a"][i % 3]}`;
        document.body.appendChild(c);
        c.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 20}px)) scale(1)`, opacity: 0 }], { duration: 900, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => c.remove();
      }
      return;
    }
    const k = AL_TOCAR[tipo];
    if (!k) return;
    try { n._rt.ab.animate(k[0], { duration: k[1], easing: "cubic-bezier(.3,1.2,.5,1)", composite: "add" }); }
    catch (er) { try { n._rt.ab.animate(k[0], { duration: k[1], easing: "ease-out" }); } catch (e2) { /* nada */ } }
  };

  /* ── Reacciones: lo que hace el elemento mientras lo presionan ───── */
  RT.REACCIONES = [["", "Nada"], ["hundir", "Hundirse"], ["crecer", "Crecer"], ["brillar", "Brillar"], ["gelatina", "Gelatina"], ["inclinar", "Inclinarse"]];
  const PRESION = {
    hundir: [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(.9)", filter: "brightness(.92)" }],
    crecer: [{ transform: "scale(1)" }, { transform: "scale(1.1)" }],
    brillar: [{ filter: "brightness(1) drop-shadow(0 0 0px rgba(255,170,210,0))" }, { filter: "brightness(1.3) drop-shadow(0 0 14px rgba(255,170,210,.95))" }],
    gelatina: [{ transform: "scale(1, 1)" }, { transform: "scale(1.12, .86)" }],
    inclinar: [{ transform: "perspective(500px) rotateX(0deg) scale(1)" }, { transform: "perspective(500px) rotateX(14deg) scale(.96)" }],
  };
  /** Presionar → se hunde (o crece, brilla…); soltar → vuelve con un rebotito. */
  RT.presionar = function (n, tipo, ev) {
    const k = PRESION[tipo];
    if (!k || !n || !n._rt || !n.animate) return;
    const c = n._rt.ab;
    try {
      if (c._presion) c._presion.cancel();
      // «add»: se suma a lo que ya haga (su bucle sigue debajo, sin saltos).
      const a = c.animate(k, { duration: 140, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards", composite: "add" });
      c._presion = a;
      const soltar = () => {
        removeEventListener("pointerup", soltar, true);
        removeEventListener("pointercancel", soltar, true);
        if (c._presion !== a) return;
        const vuelta = c.animate([k[1], k[0]], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)", composite: "add" });
        a.cancel();
        c._presion = vuelta;
        vuelta.onfinish = () => { if (c._presion === vuelta) c._presion = null; };
      };
      addEventListener("pointerup", soltar, true);
      addEventListener("pointercancel", soltar, true);
    } catch (err) { /* nada */ }
  };
})(window.LibritoRT = window.LibritoRT || {});
