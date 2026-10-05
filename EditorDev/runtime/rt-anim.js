/*
 * LIBRITO · animaciones
 *
 * Todas con la API de animaciones del navegador (Web Animations): se
 * mueven en el compositor como las de CSS, pero además se pueden pausar y
 * llevar a cualquier milisegundo, que es lo que necesita la línea de tiempo
 * del editor para que lo que se ve al arrastrar sea lo que sale.
 *
 * Cada elemento puede tener cuatro, y cada una mueve su propia capa:
 *   entrada  → .rt-ae   al llegar a la página
 *   bucle    → .rt-ab   empieza cuando termina la entrada
 *   salida   → .rt-ae   al irse de la página
 *   propia   → .rt-c    fotogramas a mano (o las que traía una página importada)
 *
 * Los nombres y sus ajustes viven aquí y el editor los lee de aquí: así el
 * menú del editor y lo que sabe hacer el librito nunca se desincronizan.
 */
(function (RT) {
  "use strict";

  RT.FACIL = {
    suave: { n: "Suave", v: "cubic-bezier(.22,.8,.26,1)" },
    entraSale: { n: "Entra y sale suave", v: "cubic-bezier(.65,0,.35,1)" },
    frena: { n: "Frena al final", v: "cubic-bezier(.1,.7,.2,1)" },
    acelera: { n: "Acelera", v: "cubic-bezier(.55,0,.9,.45)" },
    rebote: { n: "Con rebote", v: "cubic-bezier(.34,1.56,.64,1)" },
    elastico: { n: "Elástico", v: "cubic-bezier(.68,-0.55,.27,1.55)" },
    lineal: { n: "Constante", v: "linear" },
  };
  const facil = (f) => (RT.FACIL[f] ? RT.FACIL[f].v : f && /\(|^ease|^linear|^step/.test(f) ? f : RT.FACIL.suave.v);

  RT.DIRS = { arriba: "Hacia arriba", abajo: "Hacia abajo", izquierda: "Hacia la izquierda", derecha: "Hacia la derecha" };
  function mov(dir, d) {
    switch (dir) {
      case "arriba": return [0, -d];
      case "izquierda": return [-d, 0];
      case "derecha": return [d, 0];
      default: return [0, d];
    }
  }
  const tr = (x, y) => `translate(${x}px, ${y}px)`;
  const RECORTE = { derecha: "inset(0 100% 0 0)", izquierda: "inset(0 0 0 100%)", abajo: "inset(0 0 100% 0)", arriba: "inset(100% 0 0 0)" };

  /* Cada una: n (nombre), usa (qué ajustes tiene sentido mostrar), f (fotogramas). */
  RT.ANIM = {
    entrada: {
      ninguna: { n: "Ninguna" },
      aparecer: { n: "Aparecer", f: () => [{ opacity: 0 }, { opacity: 1 }] },
      deslizar: { n: "Deslizar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir, p.dist); return [{ opacity: 0, transform: tr(-m[0], -m[1]) }, { opacity: 1, transform: tr(0, 0) }]; } },
      zoom: { n: "Aparecer y crecer", usa: ["escala"], f: (p) => [{ opacity: 0, transform: `scale(${RT.num(p.escala, 0.6)})` }, { opacity: 1, transform: "scale(1)" }] },
      rebote: { n: "Rebote", f: () => [{ opacity: 0, transform: "scale(.3)", offset: 0 }, { opacity: 1, transform: "scale(1.08)", offset: 0.55 }, { transform: "scale(.96)", offset: 0.8 }, { opacity: 1, transform: "scale(1)", offset: 1 }] },
      latido: { n: "Latido", f: () => [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1.22)", offset: 0.5 }, { transform: "scale(.92)", offset: 0.75 }, { opacity: 1, transform: "scale(1)" }] },
      girar: { n: "Girar", usa: ["giro"], f: (p) => [{ opacity: 0, transform: `rotate(${-RT.num(p.giro, 90)}deg) scale(.6)` }, { opacity: 1, transform: "rotate(0deg) scale(1)" }] },
      caer: { n: "Caer", usa: ["dist"], f: (p) => [{ opacity: 0, transform: `translateY(${-p.dist * 2}px)` }, { opacity: 1, transform: "translateY(0px)", offset: 0.6 }, { transform: `translateY(${-p.dist * 0.25}px)`, offset: 0.8 }, { opacity: 1, transform: "translateY(0px)" }] },
      desenfoque: { n: "Desde borroso", f: () => [{ opacity: 0, filter: "blur(14px)", transform: "scale(1.04)" }, { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }] },
      revelar: { n: "Revelar (como si se escribiera)", usa: ["dir"], f: (p) => [{ clipPath: RECORTE[p.dir] || RECORTE.derecha }, { clipPath: "inset(0 0 0 0)" }] },
      voltear: { n: "Voltear", f: () => [{ opacity: 0, transform: "perspective(800px) rotateY(85deg)" }, { opacity: 1, transform: "perspective(800px) rotateY(0deg)" }] },
      destello: { n: "Destello", f: () => [{ opacity: 0, filter: "brightness(2.4) blur(6px)" }, { opacity: 1, filter: "brightness(1) blur(0px)" }] },
      sello: { n: "Sello (como estampado)", f: () => [{ opacity: 0, transform: "scale(1.8) rotate(-12deg)" }, { opacity: 1, transform: "scale(.94) rotate(2deg)", offset: 0.6 }, { opacity: 1, transform: "scale(1) rotate(0deg)" }] },
      circulo: { n: "Aparecer en círculo", f: () => [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }] },
      elastico: { n: "Elástico", f: () => [{ opacity: 0, transform: "scale(.2, 1.4)" }, { opacity: 1, transform: "scale(1.2, .85)", offset: 0.45 }, { transform: "scale(.92, 1.08)", offset: 0.7 }, { opacity: 1, transform: "scale(1, 1)" }] },
      pegar: { n: "Pegarse (como sticker)", f: () => [{ opacity: 0, transform: "translateY(-30px) rotate(-8deg) scale(1.15)" }, { opacity: 1, transform: "translateY(2px) rotate(1deg) scale(.98)", offset: 0.7 }, { opacity: 1, transform: "translateY(0) rotate(0deg) scale(1)" }] },
    },
    salida: {
      ninguna: { n: "Ninguna" },
      desaparecer: { n: "Desvanecer", f: () => [{ opacity: 1 }, { opacity: 0 }] },
      deslizar: { n: "Deslizar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir, p.dist); return [{ opacity: 1, transform: tr(0, 0) }, { opacity: 0, transform: tr(m[0], m[1]) }]; } },
      zoom: { n: "Desvanecer y encoger", usa: ["escala"], f: (p) => [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: `scale(${RT.num(p.escala, 0.6)})` }] },
      crecer: { n: "Crecer y desvanecer", f: () => [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.35)" }] },
      girar: { n: "Girar", usa: ["giro"], f: (p) => [{ opacity: 1, transform: "rotate(0deg) scale(1)" }, { opacity: 0, transform: `rotate(${RT.num(p.giro, 90)}deg) scale(.6)` }] },
      desenfoque: { n: "Hacia borroso", f: () => [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(14px)" }] },
      voltear: { n: "Voltear", f: () => [{ opacity: 1, transform: "perspective(800px) rotateY(0deg)" }, { opacity: 0, transform: "perspective(800px) rotateY(-85deg)" }] },
    },
    bucle: {
      ninguno: { n: "Ninguno" },
      flotar: { n: "Flotar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir || "arriba", p.dist * 0.4); return [{ transform: tr(0, 0) }, { transform: tr(m[0], m[1]) }, { transform: tr(0, 0) }]; } },
      latir: { n: "Latir", usa: ["escala"], f: (p) => [{ transform: "scale(1)" }, { transform: `scale(${RT.num(p.escala, 1.08)})` }, { transform: "scale(1)" }] },
      palpitar: { n: "Palpitar (corazón)", f: () => [{ transform: "scale(1)", offset: 0 }, { transform: "scale(1.12)", offset: 0.14 }, { transform: "scale(1)", offset: 0.28 }, { transform: "scale(1.08)", offset: 0.42 }, { transform: "scale(1)", offset: 0.7 }, { transform: "scale(1)", offset: 1 }] },
      balancear: { n: "Balancear", usa: ["giro"], f: (p) => { const g = RT.num(p.giro, 6); return [{ transform: `rotate(${-g}deg)` }, { transform: `rotate(${g}deg)` }, { transform: `rotate(${-g}deg)` }]; } },
      girar: { n: "Girar sin parar", lineal: true, f: () => [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }] },
      brillar: { n: "Brillar", f: () => [{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }] },
      respirar: { n: "Respirar", f: () => [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.03)", opacity: 0.9 }, { transform: "scale(1)", opacity: 1 }] },
      temblar: { n: "Temblar", f: () => [{ transform: "translateX(0)" }, { transform: "translateX(-3px)", offset: 0.2 }, { transform: "translateX(3px)", offset: 0.4 }, { transform: "translateX(-2px)", offset: 0.6 }, { transform: "translateX(2px)", offset: 0.8 }, { transform: "translateX(0)" }] },
      rebotar: { n: "Rebotar", usa: ["dist"], f: (p) => [{ transform: "translateY(0)", offset: 0 }, { transform: `translateY(${-p.dist}px)`, offset: 0.3 }, { transform: "translateY(0)", offset: 0.55 }, { transform: `translateY(${-p.dist * 0.3}px)`, offset: 0.72 }, { transform: "translateY(0)", offset: 0.88 }, { transform: "translateY(0)", offset: 1 }] },
      aletear: { n: "Aletear", f: () => [{ transform: "scaleX(1)" }, { transform: "scaleX(.55)" }, { transform: "scaleX(1)" }] },
      arcoiris: { n: "Arcoíris", lineal: true, f: () => [{ filter: "hue-rotate(0deg)" }, { filter: "hue-rotate(360deg)" }] },
      resplandor: { n: "Resplandor", f: () => [{ filter: "drop-shadow(0 0 0px rgba(255,190,220,0))" }, { filter: "drop-shadow(0 0 14px rgba(255,170,210,.95))" }, { filter: "drop-shadow(0 0 0px rgba(255,190,220,0))" }] },
      parpadear: { n: "Parpadear", f: () => [{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0.15, offset: 0.5 }, { opacity: 1, offset: 0.55 }, { opacity: 1 }] },
    },
  };

  RT.ANIM_DEF = {
    entrada: { tipo: "ninguna", dur: 800, retraso: 0, facil: "suave", dir: "arriba", dist: 40, escala: 0.6, giro: 90 },
    salida: { tipo: "ninguna", dur: 500, retraso: 0, facil: "suave", dir: "abajo", dist: 40, escala: 0.6, giro: 90 },
    bucle: { tipo: "ninguno", dur: 2400, retraso: 0, facil: "entraSale", dir: "arriba", dist: 20, escala: 1.08, giro: 6, repetir: "inf", alterna: false },
  };

  function param(fase, a) {
    const d = RT.ANIM_DEF[fase];
    const p = {};
    for (const k in d) p[k] = a && a[k] != null ? a[k] : d[k];
    return p;
  }

  /** Fotogramas a mano → fotogramas del navegador. */
  RT.fotogramasPropios = function (pr) {
    if (pr.raw && pr.raw.length) return pr.raw;
    const fs = (pr.fotogramas || []).slice().sort((a, b) => a.t - b.t);
    if (fs.length < 2) return null;
    const blur = fs.some((f) => f.desenfoque);
    return fs.map((f) => {
      const k = {
        offset: RT.clamp(RT.num(f.t, 0), 0, 1),
        transform: `translate(${RT.num(f.x, 0)}px, ${RT.num(f.y, 0)}px) rotate(${RT.num(f.rot, 0)}deg) scale(${RT.num(f.escala, 1)})`,
        opacity: RT.num(f.opacidad, 1),
      };
      if (blur) k.filter = `blur(${RT.num(f.desenfoque, 0)}px)`;
      return k;
    });
  };

  function repetir(r) { return r === "inf" || r === Infinity || r == null ? Infinity : Math.max(1, +r || 1); }

  /** Cuánto dura la entrada de un elemento (con su retraso). */
  RT.finEntrada = function (e) {
    const a = e.anim || {};
    let fin = 0;
    if (a.entrada && a.entrada.tipo && a.entrada.tipo !== "ninguna") fin = RT.num(a.entrada.retraso, 0) + RT.num(a.entrada.dur, 800);
    const pr = a.propia;
    if (pr && (pr.raw || pr.fotogramas)) {
      const n = repetir(pr.repetir);
      if (n !== Infinity) fin = Math.max(fin, RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * n);
    }
    return fin;
  };

  /* ── El animador de una página ─────────────────────────────────── */
  RT.Animador = class {
    constructor(pagina, nodos) {
      this.pagina = pagina;
      this.nodos = nodos;
      this.anims = [];
      this.total = 0;
    }

    _anim(capa, frames, op) {
      try {
        const a = capa.animate(frames, op);
        this.anims.push(a);
        return a;
      } catch (err) { return null; }
    }

    /** Arranca todas las entradas, y los bucles detrás de cada una. */
    entrar(opciones) {
      opciones = opciones || {};
      this.cancelar();
      const poco = opciones.vista && RT.menosMovimiento();
      let total = 0;
      for (const e of this.pagina.els || []) {
        const n = this.nodos.get(e.id);
        if (!n || e.oculto || !e.anim) continue;
        const a = e.anim;
        let fin = 0;
        const en = a.entrada && RT.ANIM.entrada[a.entrada.tipo];
        if (en && en.f) {
          const p = param("entrada", a.entrada);
          const dur = poco ? Math.min(p.dur, 200) : p.dur;
          this._anim(n._rt.ae, en.f(p), { duration: dur, delay: p.retraso, easing: facil(p.facil), fill: "both" });
          fin = p.retraso + dur;
        }
        const pr = a.propia;
        const fr = pr && RT.fotogramasPropios(pr);
        if (fr && !poco) {
          this._anim(n._rt.c, fr, {
            duration: RT.num(pr.dur, 1000), delay: RT.num(pr.retraso, 0), easing: facil(pr.facil),
            iterations: repetir(pr.repetir), direction: pr.direccion || "normal", fill: pr.relleno || "both",
          });
          if (repetir(pr.repetir) !== Infinity) fin = Math.max(fin, RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * repetir(pr.repetir));
        }
        const bu = a.bucle && RT.ANIM.bucle[a.bucle.tipo];
        if (bu && bu.f && !poco) {
          const p = param("bucle", a.bucle);
          this._anim(n._rt.ab, bu.f(p), {
            duration: p.dur, delay: fin + p.retraso, iterations: repetir(p.repetir),
            direction: p.alterna ? "alternate" : "normal", easing: bu.lineal ? "linear" : facil(p.facil), fill: "none",
          });
        }
        total = Math.max(total, fin);
      }
      if (this.componentes) for (const c of this.componentes) total = Math.max(total, c.entrar ? c.entrar(this) || 0 : 0);
      this.total = total;
      return this;
    }

    /** Las salidas; la promesa se cumple cuando termina la última. */
    salir() {
      let max = 0;
      for (const e of this.pagina.els || []) {
        const n = this.nodos.get(e.id);
        const s = e.anim && e.anim.salida;
        const def = s && RT.ANIM.salida[s.tipo];
        if (!n || e.oculto || !def || !def.f) continue;
        const p = param("salida", s);
        this._anim(n._rt.ae, def.f(p), { duration: p.dur, delay: p.retraso, easing: facil(p.facil), fill: "forwards" });
        max = Math.max(max, p.retraso + p.dur);
      }
      return new Promise((r) => setTimeout(r, Math.min(max, 2500)));
    }

    /** Lleva todas a un instante (línea de tiempo del editor). */
    ir(ms) {
      for (const a of this.anims) { try { a.pause(); a.currentTime = ms; } catch (err) { /* nada */ } }
    }
    pausar() { for (const a of this.anims) a.pause(); }
    seguir() { for (const a of this.anims) a.play(); }
    cancelar() { for (const a of this.anims) { try { a.cancel(); } catch (err) { /* nada */ } } this.anims = []; }
  };

  /** Una animación de entrada suelta (las fotos de un álbum, por ejemplo). */
  RT.animarUno = function (nodo, tipo, p) {
    const def = RT.ANIM.entrada[tipo];
    if (!def || !def.f || !nodo.animate) return null;
    const q = param("entrada", p);
    try { return nodo.animate(def.f(q), { duration: q.dur, delay: q.retraso, easing: facil(q.facil), fill: "both" }); } catch (err) { return null; }
  };
})(window.LibritoRT = window.LibritoRT || {});
