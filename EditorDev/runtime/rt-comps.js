/*
 * LIBRITO · álbumes y carruseles
 *
 * Las fotos SIEMPRE las pone quien edita: aquí sólo se decide cómo se
 * enseñan. Ligeros a propósito: sólo se piden las fotos que se ven (y la
 * de al lado), el carrusel se para si la pestaña no está a la vista y todo
 * lo que se mueve es `transform` y `opacity`.
 */
(function (RT) {
  "use strict";
  const h = RT.h;
  RT.componentes = RT.componentes || {};

  function azar(semilla) {
    let s = 0;
    for (let i = 0; i < semilla.length; i++) s = (s * 31 + semilla.charCodeAt(i)) | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fotosDe(lista, ctx) {
    const r = [];
    for (const id of lista || []) { const u = ctx.url(id); if (u) r.push(u); }
    return r;
  }

  function vacio(c, ctx, e, texto) {
    c.textContent = "";
    if (ctx.modo !== "editor") return null;
    const v = h("div", "rt-vacio", c);
    v.innerHTML = `<span>＋</span><b>${texto}</b>`;
    v.dataset.pedir = e.id;
    return null;
  }

  function imagen(padre, url, perezosa) {
    const i = h("img", "", padre);
    i.decoding = "async"; i.draggable = false; i.alt = "";
    if (perezosa) i.loading = "lazy";
    i.src = url;
    return i;
  }

  /* ── Álbum ──────────────────────────────────────────────────────── */
  RT.componentes.album = function (c, e, ctx) {
    const a = e.album || {};
    const urls = fotosDe(a.fotos, ctx);
    if (!urls.length) return vacio(c, ctx, e, "Añadir fotos al álbum");
    c.textContent = "";
    const disp = a.disposicion || "cuadricula";
    const w = h("div", "rt-album rt-al-" + disp + " rt-marco-" + (a.marco || "ninguno"), c);
    w.style.setProperty("--gap", RT.num(a.espacio, 8) + "px");
    w.style.setProperty("--cols", Math.max(1, RT.num(a.columnas, 2)));
    w.style.setProperty("--radio", RT.num(a.radio, 10) + "px");
    w.style.setProperty("--prop", a.proporcion && a.proporcion !== "libre" ? a.proporcion : "auto");
    if (a.direccion === "vertical") w.classList.add("rt-al-vertical");
    const items = [];
    const rnd = azar(e.id);
    const n = urls.length;
    urls.forEach(function (u, i) {
      const f = h("figure", "rt-al-foto", w);
      imagen(f, u, ctx.modo !== "editor");
      f.style.setProperty("--i", i);
      if (disp === "polaroids") {
        const cols = Math.ceil(Math.sqrt(n * (e.w / Math.max(1, e.h))));
        const filas = Math.ceil(n / cols);
        const cw = 100 / cols, ch = 100 / filas;
        const x = (i % cols) * cw + cw / 2 + (rnd() - 0.5) * cw * 0.35;
        const y = Math.floor(i / cols) * ch + ch / 2 + (rnd() - 0.5) * ch * 0.3;
        f.style.left = x + "%"; f.style.top = y + "%";
        f.style.setProperty("--rot", ((rnd() - 0.5) * 18).toFixed(1) + "deg");
        f.style.width = Math.min(70, 118 / cols) + "%";
      } else if (disp === "pila") {
        f.style.setProperty("--rot", ((rnd() - 0.5) * 14).toFixed(1) + "deg");
        f.style.zIndex = n - i;
      } else if (disp === "mosaico" && i % 5 === 0) f.classList.add("rt-al-grande");
      items.push(f);
    });

    const vida = { destruir: function () {} };
    if (ctx.modo !== "vista") return vida;

    let quitar = null;
    if (disp === "pila") {
      const orden = items.map(function (_, j) { return j; });
      const pasar = function () {
        const f = items[orden[0]];
        f.animate([{ transform: "translate(-50%,-50%) rotate(var(--rot))" }, { transform: "translate(30%,-70%) rotate(16deg)", opacity: 0.3, offset: 0.5 }, { transform: "translate(-50%,-50%) rotate(var(--rot))" }], { duration: 650, easing: "cubic-bezier(.3,.7,.3,1)" });
        setTimeout(function () { orden.push(orden.shift()); orden.forEach(function (j, pos) { items[j].style.zIndex = n - pos; }); }, 320);
      };
      w.addEventListener("click", pasar);
      quitar = function () { w.removeEventListener("click", pasar); };
    } else if (a.ampliar !== false) {
      const abrir = function (ev) {
        const f = ev.target.closest(".rt-al-foto");
        if (f) RT.ampliar(urls, items.indexOf(f));
      };
      w.addEventListener("click", abrir);
      quitar = function () { w.removeEventListener("click", abrir); };
    }
    vida.destruir = function () { if (quitar) quitar(); };
    vida.entrar = function (animador) {
      const cas = a.cascada || {};
      if (!cas.tipo || cas.tipo === "ninguna") return 0;
      const base = RT.finEntrada(e) || 0;
      const paso = RT.num(cas.paso, 110), dur = RT.num(cas.dur, 650);
      items.forEach(function (f, i) {
        const def = RT.ANIM.entrada[cas.tipo];
        if (def && def.f) animador._anim(f, def.f({ dir: cas.dir || "arriba", dist: 30, escala: 0.7, giro: 25 }), { duration: dur, delay: base + i * paso, easing: "cubic-bezier(.22,.8,.26,1)", fill: "both" });
      });
      return base + (n - 1) * paso + dur;
    };
    return vida;
  };

  /* ── Carrusel ───────────────────────────────────────────────────── */
  RT.componentes.carrusel = function (c, e, ctx) {
    const k = e.carrusel || {};
    const urls = fotosDe(k.fotos, ctx);
    if (!urls.length) return vacio(c, ctx, e, "Añadir fotos al carrusel");
    c.textContent = "";
    const modo = k.modo || "deslizar";
    const vertical = k.direccion === "vertical";
    const n = urls.length;
    const vel = RT.num(k.velocidad, 600);
    const w = h("div", "rt-car rt-car-" + modo + (vertical ? " rt-car-v" : ""), c);
    w.style.setProperty("--gap", RT.num(k.espacio, 0) + "px");
    w.style.setProperty("--radio", RT.num(k.radio, 12) + "px");
    w.style.setProperty("--vel", vel + "ms");
    w.setAttribute("data-claim-drag", "");
    const pista = h("div", "rt-car-pista", w);
    const slides = urls.map(function (u) {
      const d = h("div", "rt-car-d", pista);
      d._url = u;
      return d;
    });
    let puntos = null;
    if (k.puntos !== false && n > 1) {
      puntos = h("div", "rt-car-puntos", w);
      for (let i = 0; i < n; i++) h("i", "", puntos);
    }
    let i = Math.min(n - 1, Math.max(0, RT.num(k.inicio, 0)));

    function cargar(j) {
      const d = slides[((j % n) + n) % n];
      if (d && !d.firstChild) { const im = imagen(d, d._url, false); im.style.objectFit = k.ajuste || "cover"; }
    }

    function pintar(arrastre) {
      const off = arrastre || 0;
      cargar(i); cargar(i + 1); cargar(i - 1);
      if (modo === "deslizar") {
        const pct = -i * 100;
        pista.style.transform = vertical
          ? `translateY(calc(${pct}% - ${i} * var(--gap) + ${off}px))`
          : `translateX(calc(${pct}% - ${i} * var(--gap) + ${off}px))`;
      } else {
        slides.forEach(function (d, j) {
          let dd = j - i;
          if (k.bucle !== false && n > 2) { if (dd > n / 2) dd -= n; if (dd < -n / 2) dd += n; }
          if (modo === "fundido") { d.classList.toggle("rt-act", dd === 0); return; }
          const ad = Math.abs(dd);
          const desp = dd * 58 + (off / Math.max(1, e.w)) * 60;
          d.style.transform = vertical
            ? `translateY(${desp}%) scale(${1 - Math.min(ad, 3) * 0.16})`
            : `translateX(${desp}%) scale(${1 - Math.min(ad, 3) * 0.16}) rotateY(${-dd * 22}deg)`;
          d.style.zIndex = 20 - ad;
          d.style.opacity = ad > 2 ? 0 : 1 - ad * 0.28;
        });
      }
      if (puntos) for (let j = 0; j < n; j++) puntos.children[j].classList.toggle("rt-act", j === i);
    }

    function ir(j) {
      if (k.bucle !== false) i = ((j % n) + n) % n;
      else i = Math.max(0, Math.min(n - 1, j));
      pintar();
    }
    pintar();

    const vida = { destruir: function () {} };
    if (ctx.modo !== "vista" || n < 2) return vida;

    if (k.flechas) {
      const a = h("button", "rt-car-f rt-car-ant", w); a.type = "button"; a.textContent = "‹";
      const b = h("button", "rt-car-f rt-car-sig", w); b.type = "button"; b.textContent = "›";
      a.addEventListener("click", function () { ir(i - 1); reiniciar(); });
      b.addEventListener("click", function () { ir(i + 1); reiniciar(); });
    }

    let reloj = null;
    function reiniciar() {
      if (reloj) clearInterval(reloj);
      reloj = null;
      if (k.auto !== false) reloj = setInterval(function () { if (!document.hidden) ir(i + 1); }, Math.max(1200, RT.num(k.intervalo, 3200)));
    }
    reiniciar();

    let x0 = null, y0 = 0, mov = 0;
    function abajo(ev) { x0 = ev.clientX; y0 = ev.clientY; mov = 0; w.classList.add("rt-arrastra"); try { w.setPointerCapture(ev.pointerId); } catch (err) { /* nada */ } ev.stopPropagation(); }
    function mueve(ev) {
      if (x0 == null) return;
      const esc = (w.getBoundingClientRect().width / Math.max(1, w.offsetWidth)) || 1;
      mov = (vertical ? ev.clientY - y0 : ev.clientX - x0) / esc;
      pintar(mov);
    }
    function arriba() {
      if (x0 == null) return;
      x0 = null; w.classList.remove("rt-arrastra");
      if (Math.abs(mov) > 40) ir(i + (mov < 0 ? 1 : -1)); else pintar();
      reiniciar();
    }
    w.addEventListener("pointerdown", abajo);
    w.addEventListener("pointermove", mueve);
    w.addEventListener("pointerup", arriba);
    w.addEventListener("pointercancel", arriba);
    vida.destruir = function () { if (reloj) clearInterval(reloj); };
    return vida;
  };

  /* ── Ver una foto en grande ─────────────────────────────────────── */
  RT.ampliar = function (urls, i) {
    if (!urls || !urls.length) return;
    const capa = h("div", "rt-ampliar", document.body);
    const img = h("img", "", capa);
    img.alt = "";
    const cerrar = h("button", "rt-amp-x", capa); cerrar.type = "button"; cerrar.textContent = "✕"; cerrar.setAttribute("aria-label", "Cerrar");
    let j = i || 0;
    function poner() { img.src = urls[(j + urls.length) % urls.length]; }
    poner();
    let x0 = null;
    capa.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; ev.stopPropagation(); });
    capa.addEventListener("pointerup", function (ev) {
      if (x0 == null) return;
      const d = ev.clientX - x0; x0 = null;
      if (Math.abs(d) > 50 && urls.length > 1) { j += d < 0 ? 1 : -1; poner(); }
      else if (ev.target !== img) fin();
    });
    function tecla(ev) {
      if (ev.key === "Escape") fin();
      else if (ev.key === "ArrowRight") { j++; poner(); }
      else if (ev.key === "ArrowLeft") { j--; poner(); }
      ev.stopPropagation();
    }
    function fin() { document.removeEventListener("keydown", tecla, true); capa.classList.add("rt-fuera"); setTimeout(function () { capa.remove(); }, 260); }
    cerrar.addEventListener("click", fin);
    document.addEventListener("keydown", tecla, true);
    requestAnimationFrame(function () { capa.classList.add("rt-dentro"); });
  };
})(window.LibritoRT = window.LibritoRT || {});
