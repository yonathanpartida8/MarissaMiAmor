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
 *
 * Fase 11:
 *   · trayectorias de verdad (arcos, espirales, órbitas, ochos, deriva
 *     orgánica), rebotes con física, entradas con profundidad 3D
 *   · «intensidad» en todas (escala distancias, giros y tamaños) y
 *     «velocidad» en los bucles
 *   · animación propia con fotogramas POR PROPIEDAD (posición con curva,
 *     escala, giro, opacidad, desenfoque, color, brillo), cada uno con su
 *     propio ritmo, también curvas a mano (cubic-bezier)
 *   · magia (rt-magia.js): chispas, brillitos, estelas, resplandor, ondas…
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
  RT.facil = facil;

  /* Un ritmo como función (0→1): para muestrear trayectorias y fotogramas. */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      if (!(t >= 0 && t <= 1) || Math.abs(sx(t) - x) > 1e-4) { let a = 0, b = 1; t = x; for (let i = 0; i < 30; i++) { const v = sx(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) a = t; else b = t; t = (a + b) / 2; } }
      return sy(t);
    };
  }
  const CSS_FACIL = { ease: [0.25, 0.1, 0.25, 1], "ease-in": [0.42, 0, 1, 1], "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1] };
  RT.facilFn = function (f) {
    const v = facil(f);
    const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(v);
    if (m) return bezier(+m[1], +m[2], +m[3], +m[4]);
    if (CSS_FACIL[v]) return bezier.apply(null, CSS_FACIL[v]);
    return (x) => x;
  };

  /* Una trayectoria muestreada: fn(u) → { x, y, r, s | sx sy, o, b (desenfoque), br (brillo), z, rx, ry }.
     Con perspectiva, todas las piezas 3D van siempre (así el navegador interpola suave). */
  const f2 = (v) => (Math.abs(v) < 1e-4 ? 0 : +v.toFixed(3));
  function tray(n, fn, persp) {
    const out = [];
    const conFiltro = (() => { const p0 = fn(0); return p0.b != null || p0.br != null; })();
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = fn(u);
      let t = persp ? `perspective(${persp}px) translateZ(${f2(p.z || 0)}px) rotateX(${f2(p.rx || 0)}deg) rotateY(${f2(p.ry || 0)}deg) ` : "";
      t += `translate(${f2(p.x || 0)}px, ${f2(p.y || 0)}px) rotate(${f2(p.r || 0)}deg) scale(${f2(p.sx != null ? p.sx : p.s != null ? p.s : 1)}, ${f2(p.sy != null ? p.sy : p.s != null ? p.s : 1)})`;
      const k = { offset: u, transform: t };
      if (p.o != null) k.opacity = Math.max(0, Math.min(1, p.o));
      if (conFiltro) k.filter = `blur(${f2(Math.max(0, p.b || 0))}px) brightness(${f2(p.br != null ? p.br : 1)})`;
      if (p.origen) k.transformOrigin = p.origen;
      out.push(k);
    }
    return out;
  }
  /** Al revés (para las salidas que deshacen una entrada). */
  const alReves = (k) => k.slice().reverse().map((x) => Object.assign({}, x, { offset: x.offset != null ? 1 - x.offset : undefined }));
  const perp = (dir) => { const m = mov(dir, 1); return [-m[1], m[0]]; };
  const CAE = "cubic-bezier(.5,0,1,.6)", SUBE = "cubic-bezier(0,.4,.5,1)", VAIVEN = "cubic-bezier(.45,0,.55,1)";
  /** Rebotes con física: cae, toca el suelo (se aplasta un poquito) y rebota cada vez menos. */
  function rebotes(p) {
    const n = Math.max(1, Math.min(6, Math.round(RT.num(p.rebotes, 3)))), H = Math.max(16, p.dist * 3), e = 0.52;
    const alturas = [];
    let h = H, T = 1;
    for (let i = 0; i < n; i++) { h *= e * e; alturas.push(h); T += 2 * Math.sqrt(h / H); }
    const o = "50% 100%";
    const k = [{ offset: 0, transform: `translateY(${-H}px) scale(.94, 1.08)`, opacity: 0, transformOrigin: o, easing: CAE }];
    let t = 1;
    k.push({ offset: t / T, transform: "translateY(0px) scale(1.16, .84)", opacity: 1, transformOrigin: o, easing: SUBE });
    alturas.forEach((a, i) => {
      const d = Math.sqrt(a / H);
      t += d; k.push({ offset: t / T, transform: `translateY(${f2(-a)}px) scale(.97, 1.03)`, opacity: 1, transformOrigin: o, easing: CAE });
      t += d; const q = 0.16 * Math.pow(e, i + 1);
      k.push({ offset: Math.min(1, t / T), transform: `translateY(0px) scale(${f2(1 + q)}, ${f2(1 - q)})`, opacity: 1, transformOrigin: o, easing: SUBE });
    });
    k[k.length - 1] = { offset: 1, transform: "translateY(0px) scale(1, 1)", opacity: 1, transformOrigin: o };
    return k;
  }
  /** Una curva periódica suave (empieza y acaba en 0: el bucle no salta). */
  const onda = (u, armonicos) => { let v = 0, v0 = 0; for (const [a, f, fase] of armonicos) { v += a * Math.sin(2 * Math.PI * f * u + fase); v0 += a * Math.sin(fase); } return v - v0; };

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
      arco: { n: "Llegar en arco", usa: ["dir", "dist"], f: (p) => {
        const m = mov(p.dir, 1), q = perp(p.dir), d = p.dist * 2.4, s = [-m[0] * d, -m[1] * d], c = [s[0] / 2 + q[0] * d * 0.6, s[1] / 2 + q[1] * d * 0.6];
        return tray(20, (u) => { const v = 1 - u; return { x: v * v * s[0] + 2 * v * u * c[0], y: v * v * s[1] + 2 * v * u * c[1], r: -16 * v * v, s: 0.82 + 0.18 * u, o: Math.min(1, u * 2.6) }; });
      } },
      espiral: { n: "Espiral", usa: ["dist", "giro"], f: (p) => tray(26, (u) => { const v = 1 - u, a = v * (p.giro / 90) * Math.PI * 3, r = p.dist * 1.7 * v; return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: -v * p.giro * 2, s: 0.25 + 0.75 * u, o: Math.min(1, u * 3) }; }) },
      profundidad: { n: "Desde el fondo (3D)", usa: ["dist"], f: (p) => tray(12, (u) => { const v = 1 - u; return { z: -p.dist * 14 * v, rx: 18 * v * v, o: Math.min(1, u * 2.2), b: 7 * v * v, br: 1 + 0.25 * v }; }, 900) },
      caer3d: { n: "Caer en 3D", f: () => { const o = "50% 0%"; return [{ opacity: 0, transform: "perspective(900px) rotateX(-92deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateX(16deg)", transformOrigin: o, offset: 0.6 }, { opacity: 1, transform: "perspective(900px) rotateX(-6deg)", transformOrigin: o, offset: 0.82 }, { opacity: 1, transform: "perspective(900px) rotateX(0deg)", transformOrigin: o }]; } },
      desplegar: { n: "Desplegar (3D)", f: () => { const o = "0% 50%"; return [{ opacity: 0, transform: "perspective(900px) rotateY(-95deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateY(12deg)", transformOrigin: o, offset: 0.65 }, { opacity: 1, transform: "perspective(900px) rotateY(0deg)", transformOrigin: o }]; } },
      rebotes: { n: "Rebotes (con física)", usa: ["dist", "rebotes"], lineal: true, f: rebotes },
      organico: { n: "Llegar y acomodarse (orgánico)", usa: ["dist", "giro"], lineal: true, f: (p) => tray(28, (u) => {
        if (u >= 1) return { o: 1 };
        const a = Math.exp(-4.6 * u), w = Math.PI * 4.6 * u;
        return { y: p.dist * a * Math.cos(w), r: p.giro * 0.1 * a * Math.sin(w), sx: 1 + 0.1 * a * Math.sin(w + 0.6), sy: 1 - 0.1 * a * Math.sin(w + 0.6), o: Math.min(1, u * 4) };
      }) },
      cine: { n: "Cinematográfica", f: () => [{ opacity: 0, transform: "scale(1.45)", filter: "blur(14px) brightness(1.6)" }, { opacity: 1, transform: "scale(1.04)", filter: "blur(2px) brightness(1.15)", offset: 0.55 }, { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }] },
      magica: { n: "Aparición mágica", f: () => [{ opacity: 0, transform: "scale(.4) rotate(-20deg)", filter: "brightness(3) saturate(0) blur(6px)" }, { opacity: 1, transform: "scale(1.12) rotate(4deg)", filter: "brightness(1.8) saturate(1.4) blur(0px)", offset: 0.55 }, { opacity: 1, transform: "scale(.97) rotate(-1deg)", filter: "brightness(1.1) saturate(1.1) blur(0px)", offset: 0.8 }, { opacity: 1, transform: "scale(1) rotate(0deg)", filter: "brightness(1) saturate(1) blur(0px)" }] },
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
      arco: { n: "Irse en arco", usa: ["dir", "dist"], f: (p) => alReves(RT.ANIM.entrada.arco.f(Object.assign({}, p, { dir: { arriba: "abajo", abajo: "arriba", izquierda: "derecha", derecha: "izquierda" }[p.dir] || "arriba" }))) },
      espiral: { n: "Espiral", usa: ["dist", "giro"], f: (p) => alReves(RT.ANIM.entrada.espiral.f(p)) },
      fondo: { n: "Hacia el fondo (3D)", usa: ["dist"], f: (p) => alReves(RT.ANIM.entrada.profundidad.f(p)) },
      saltito: { n: "Saltito y se va", usa: ["dist"], f: (p) => { const o = "50% 100%"; return [{ opacity: 1, transform: "translateY(0px) scale(1, 1)", transformOrigin: o }, { opacity: 1, transform: "translateY(0px) scale(1.12, .86)", transformOrigin: o, offset: 0.18 }, { opacity: 1, transform: `translateY(${-p.dist}px) scale(.94, 1.08)`, transformOrigin: o, offset: 0.45 }, { opacity: 0, transform: `translateY(${p.dist * 4}px) scale(1, 1)`, transformOrigin: o }]; } },
      polvo: { n: "Deshacerse en polvo mágico", usa: ["dist"], magia: "polvo", f: (p) => [{ opacity: 1, transform: "translateY(0px) scale(1)", filter: "blur(0px) brightness(1)" }, { opacity: 0.85, transform: "translateY(-4px) scale(1.02)", filter: "blur(1px) brightness(1.5)", offset: 0.3 }, { opacity: 0, transform: `translateY(${-p.dist}px) scale(1.08)`, filter: "blur(10px) brightness(2)" }] },
      caer3d: { n: "Caer en 3D", f: () => { const o = "50% 100%"; return [{ opacity: 1, transform: "perspective(900px) rotateX(0deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateX(-12deg)", transformOrigin: o, offset: 0.3 }, { opacity: 0, transform: "perspective(900px) rotateX(92deg)", transformOrigin: o }]; } },
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
      orbita: { n: "Órbita (círculo)", usa: ["dist"], lineal: true, f: (p) => { const r = p.dist * 0.7; return tray(32, (u) => ({ x: Math.cos(u * 2 * Math.PI) * r - r, y: Math.sin(u * 2 * Math.PI) * r })); } },
      ocho: { n: "Ocho (infinito)", usa: ["dist"], lineal: true, f: (p) => { const r = p.dist * 0.8; return tray(40, (u) => ({ x: Math.sin(u * 2 * Math.PI) * r, y: Math.sin(u * 4 * Math.PI) * r * 0.45, r: Math.cos(u * 2 * Math.PI) * 4 - 4 })); } },
      deriva: { n: "Deriva orgánica", usa: ["dist", "giro"], lineal: true, f: (p) => tray(48, (u) => ({
        x: onda(u, [[p.dist * 0.5, 1, 0.4], [p.dist * 0.22, 2, 1.7], [p.dist * 0.1, 3, 0.2]]),
        y: onda(u, [[p.dist * 0.45, 1, 2.1], [p.dist * 0.2, 3, 0.9]]),
        r: onda(u, [[p.giro * 0.5, 1, 1.1], [p.giro * 0.25, 2, 0.3]]),
        s: 1 + onda(u, [[0.025, 2, 0.5]]),
      })) },
      pendulo: { n: "Péndulo", usa: ["giro"], lineal: true, f: (p) => { const g = RT.num(p.giro, 6) * 2, o = "50% 0%"; return [{ transform: `rotate(${-g}deg)`, transformOrigin: o, easing: VAIVEN }, { transform: `rotate(${g}deg)`, transformOrigin: o, easing: VAIVEN, offset: 0.5 }, { transform: `rotate(${-g}deg)`, transformOrigin: o }]; } },
      gelatina: { n: "Gelatina", f: () => [{ transform: "scale(1, 1)" }, { transform: "scale(1.12, .88)", offset: 0.3 }, { transform: "scale(.9, 1.1)", offset: 0.45 }, { transform: "scale(1.05, .95)", offset: 0.6 }, { transform: "scale(.98, 1.02)", offset: 0.75 }, { transform: "scale(1, 1)" }] },
      latidoLuz: { n: "Latido con luz", f: () => [{ transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))" }, { transform: "scale(1.08)", filter: "brightness(1.2) drop-shadow(0 0 12px rgba(255,150,200,.9))", offset: 0.18 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 2px rgba(255,150,200,.3))", offset: 0.36 }, { transform: "scale(1.05)", filter: "brightness(1.12) drop-shadow(0 0 8px rgba(255,150,200,.7))", offset: 0.5 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))", offset: 0.75 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))" }] },
    },
  };

  RT.ANIM_DEF = {
    entrada: { tipo: "ninguna", dur: 800, retraso: 0, facil: "suave", dir: "arriba", dist: 40, escala: 0.6, giro: 90, intensidad: 1, rebotes: 3 },
    salida: { tipo: "ninguna", dur: 500, retraso: 0, facil: "suave", dir: "abajo", dist: 40, escala: 0.6, giro: 90, intensidad: 1, rebotes: 3 },
    bucle: { tipo: "ninguno", dur: 2400, retraso: 0, facil: "entraSale", dir: "arriba", dist: 20, escala: 1.08, giro: 6, repetir: "inf", alterna: false, intensidad: 1, velocidad: 1 },
  };

  /** Los ajustes de una fase, con la intensidad ya aplicada a distancias, giros y tamaños. */
  function param(fase, a) {
    const d = RT.ANIM_DEF[fase];
    const p = {};
    for (const k in d) p[k] = a && a[k] != null ? a[k] : d[k];
    const k = RT.clamp(RT.num(+p.intensidad, 1), 0, 4);
    if (k !== 1) {
      p.dist *= k;
      p.giro *= k;
      p.escala = fase === "bucle" ? 1 + (p.escala - 1) * k : RT.clamp(1 - (1 - p.escala) * k, 0.02, 3);
    }
    return p;
  }
  RT.paramAnim = param;

  /* Las propiedades de la animación propia (y su valor si no se dice nada). */
  RT.PROPS = {
    pos: { n: "Posición", campos: ["x", "y"], def: 0 },
    escala: { n: "Escala", def: 1 },
    rot: { n: "Giro", def: 0, unidad: "°" },
    opacidad: { n: "Opacidad", def: 1 },
    desenfoque: { n: "Desenfoque", def: 0, unidad: "px" },
    tono: { n: "Color (tono)", def: 0, unidad: "°" },
    brillo: { n: "Brillo", def: 1 },
  };
  const tienePos = (f) => f.x != null || f.y != null;
  RT.tieneProp = (f, k) => (k === "pos" ? tienePos(f) : f[k] != null);

  /** Fotogramas a mano → fotogramas del navegador.
   *  v1 (los de antes): cada fotograma trae todo; lo que falta vale lo de siempre.
   *  v2 (por propiedad): cada propiedad tiene SUS fotogramas y su ritmo entre
   *  uno y otro; la posición puede ir en curva (`curva`, px hacia un lado). */
  RT.fotogramasPropios = function (pr) {
    if (pr.raw && pr.raw.length) return pr.raw;
    const fs = (pr.fotogramas || []).slice().sort((a, b) => a.t - b.t);
    if (fs.length < 2) return null;
    if (!(pr.v >= 2)) {
      const blur = fs.some((f) => f.desenfoque), color = fs.some((f) => f.tono || (f.brillo != null && f.brillo !== 1));
      return fs.map((f) => {
        const k = {
          offset: RT.clamp(RT.num(f.t, 0), 0, 1),
          transform: `translate(${RT.num(f.x, 0)}px, ${RT.num(f.y, 0)}px) rotate(${RT.num(f.rot, 0)}deg) scale(${RT.num(f.escala, 1)})`,
          opacity: RT.num(f.opacidad, 1),
        };
        if (blur || color) k.filter = `blur(${RT.num(f.desenfoque, 0)}px)` + (color ? ` hue-rotate(${RT.num(f.tono, 0)}deg) brightness(${RT.num(f.brillo, 1)})` : "");
        if (f.facil) k.easing = facil(f.facil);
        return k;
      });
    }
    // v2: cada propiedad por su lado; se muestrea para respetar el ritmo de cada tramo.
    const def = pr.facil || "suave";
    const claves = {};
    for (const k in RT.PROPS) {
      const l = fs.filter((f) => RT.tieneProp(f, k));
      if (l.length) claves[k] = l;
    }
    const usadas = Object.keys(claves);
    if (!usadas.length) return null;
    const tiempos = new Set([0, 1]);
    for (const f of fs) tiempos.add(RT.clamp(RT.num(f.t, 0), 0, 1));
    const N = 48;
    for (let i = 1; i < N; i++) tiempos.add(i / N);
    const ts = [...tiempos].sort((a, b) => a - b);
    // Valor de una propiedad en el instante u.
    const tramo = (l, u) => {
      if (u <= l[0].t) return [l[0], l[0], 0];
      const z = l[l.length - 1];
      if (u >= z.t) return [z, z, 0];
      let i = 0;
      while (i < l.length - 2 && l[i + 1].t < u) i++;
      const a = l[i], b = l[i + 1];
      const w = b.t - a.t || 1;
      return [a, b, RT.facilFn(a.facil || def)((u - a.t) / w)];
    };
    const valor = (k, u) => {
      const l = claves[k], d = RT.PROPS[k].def;
      if (!l) return d;
      const [a, b, e] = tramo(l, u);
      return RT.num(a[k], d) + (RT.num(b[k], d) - RT.num(a[k], d)) * e;
    };
    const posicion = (u) => {
      const l = claves.pos;
      if (!l) return [0, 0];
      const [a, b, e] = tramo(l, u);
      const ax = RT.num(a.x, 0), ay = RT.num(a.y, 0), bx = RT.num(b.x, 0), by = RT.num(b.y, 0);
      const c = RT.num(a.curva, 0);
      if (!c || a === b) return [ax + (bx - ax) * e, ay + (by - ay) * e];
      // Curva: el tramo se dobla hacia un lado (bezier cuadrática).
      const L = Math.hypot(bx - ax, by - ay) || 1, mx = (ax + bx) / 2 - ((by - ay) / L) * c, my = (ay + by) / 2 + ((bx - ax) / L) * c, v = 1 - e;
      return [v * v * ax + 2 * v * e * mx + e * e * bx, v * v * ay + 2 * v * e * my + e * e * by];
    };
    const filtro = usadas.some((k) => k === "desenfoque" || k === "tono" || k === "brillo");
    return ts.map((u) => {
      const [x, y] = posicion(u);
      const k = { offset: u, transform: `translate(${f2(x)}px, ${f2(y)}px) rotate(${f2(valor("rot", u))}deg) scale(${f2(valor("escala", u))})`, opacity: f2(RT.clamp(valor("opacidad", u), 0, 1)) };
      if (filtro) k.filter = `blur(${f2(Math.max(0, valor("desenfoque", u)))}px) hue-rotate(${f2(valor("tono", u))}deg) brightness(${f2(Math.max(0, valor("brillo", u)))})`;
      return k;
    });
  };

  /** Valores de la animación propia en un instante (0–1): para el editor de fotogramas. */
  RT.valoresPropios = function (pr, u) {
    const fr = RT.fotogramasPropios(Object.assign({}, pr, { v: 2 }));
    const out = { x: 0, y: 0, escala: 1, rot: 0, opacidad: 1, desenfoque: 0, tono: 0, brillo: 1 };
    const fs = (pr.fotogramas || []).slice().sort((a, b) => a.t - b.t);
    if (!fr || !fs.length) return out;
    // Se interpola sobre los fotogramas reales de cada propiedad (con su ritmo).
    const def = pr.facil || "suave";
    for (const k of ["x", "y", "escala", "rot", "opacidad", "desenfoque", "tono", "brillo"]) {
      const l = fs.filter((f) => f[k] != null);
      if (!l.length) continue;
      if (u <= l[0].t) { out[k] = l[0][k]; continue; }
      const z = l[l.length - 1];
      if (u >= z.t) { out[k] = z[k]; continue; }
      let i = 0;
      while (i < l.length - 2 && l[i + 1].t < u) i++;
      const a = l[i], b = l[i + 1];
      out[k] = a[k] + (b[k] - a[k]) * RT.facilFn(a.facil || def)((u - a.t) / ((b.t - a.t) || 1));
    }
    return out;
  };

  function repetir(r) { return r === "inf" || r === Infinity || r == null ? Infinity : Math.max(1, +r || 1); }

  /* Cuándo está un elemento en la página (línea de tiempo):
       tiempo.inicio  ms en que aparece (antes no se ve)        · 0 = desde el principio
       tiempo.fin     ms en que se va (su salida termina ahí)   · null = se queda
     Las animaciones de entrada y la propia cuentan desde su inicio. */
  RT.inicioDe = function (e) { return Math.max(0, RT.num(e.tiempo && e.tiempo.inicio, 0)); };
  RT.finDe = function (e) { const f = e.tiempo && e.tiempo.fin; return f == null || f === "" ? null : Math.max(RT.inicioDe(e) + 50, RT.num(f, 0)); };

  /** Cuánto dura la entrada de un elemento (con su retraso y su inicio). */
  RT.finEntrada = function (e) {
    const a = e.anim || {};
    const ini = RT.inicioDe(e);
    let fin = ini;
    if (a.entrada && a.entrada.tipo && a.entrada.tipo !== "ninguna") fin = ini + RT.num(a.entrada.retraso, 0) + RT.num(a.entrada.dur, 800);
    const pr = a.propia;
    if (pr && (pr.raw || pr.fotogramas)) {
      const n = repetir(pr.repetir);
      if (n !== Infinity) fin = Math.max(fin, ini + RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * n);
    }
    const f = RT.finDe(e);
    return f != null ? Math.max(fin, f) : fin;
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
        const ini = RT.inicioDe(e), hasta = RT.finDe(e);
        let fin = ini;
        // Cuándo está: antes de su inicio y después de su fin no se ve.
        if (ini > 0 || hasta != null) {
          const D = (hasta != null ? hasta : ini) + 1;
          const k = [];
          if (ini > 0) k.push({ visibility: "hidden", offset: 0 }, { visibility: "hidden", offset: ini / D });
          k.push({ visibility: "visible", offset: ini / D });
          if (hasta != null) k.push({ visibility: "visible", offset: hasta / D }, { visibility: "hidden", offset: hasta / D }, { visibility: "hidden", offset: 1 });
          else k.push({ visibility: "visible", offset: 1 });
          this._anim(n, k, { duration: D, easing: "linear", fill: "both" });
        }
        const en = a.entrada && RT.ANIM.entrada[a.entrada.tipo];
        if (en && en.f) {
          const p = param("entrada", a.entrada);
          const dur = poco ? Math.min(p.dur, 200) : p.dur;
          this._anim(n._rt.ae, en.f(p), { duration: dur, delay: ini + p.retraso, easing: en.lineal ? "linear" : facil(p.facil), fill: "both" });
          fin = ini + p.retraso + dur;
        }
        const pr = a.propia;
        const fr = pr && RT.fotogramasPropios(pr);
        if (fr && !poco) {
          this._anim(n._rt.c, fr, {
            duration: RT.num(pr.dur, 1000), delay: ini + RT.num(pr.retraso, 0), easing: pr.v >= 2 ? "linear" : facil(pr.facil),
            iterations: repetir(pr.repetir), direction: pr.direccion || "normal", fill: pr.relleno || "both",
          });
          if (repetir(pr.repetir) !== Infinity) fin = Math.max(fin, ini + RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * repetir(pr.repetir));
        }
        // Se va a su hora: la salida termina justo en su fin.
        const sa = hasta != null && a.salida && RT.ANIM.salida[a.salida.tipo];
        if (sa && sa.f) {
          const p = param("salida", a.salida);
          this._anim(n._rt.ae, sa.f(p), { duration: p.dur, delay: Math.max(ini, hasta - p.dur), easing: sa.lineal ? "linear" : facil(p.facil), fill: "forwards" });
        }
        const bu = a.bucle && RT.ANIM.bucle[a.bucle.tipo];
        if (bu && bu.f && !poco) {
          const p = param("bucle", a.bucle);
          this._anim(n._rt.ab, bu.f(p), {
            duration: p.dur / RT.clamp(RT.num(+p.velocidad, 1), 0.1, 10), delay: fin + p.retraso, iterations: repetir(p.repetir),
            direction: p.alterna ? "alternate" : "normal", easing: bu.lineal ? "linear" : facil(p.facil), fill: "none",
          });
        }
        // La magia (chispas, estelas, resplandor…): después, porque la estela copia lo de arriba.
        if (RT.magia && !poco) RT.magia(this, n, e, { ini: ini, fin: fin, hasta: hasta });
        total = Math.max(total, hasta != null ? Math.max(fin, hasta) : fin);
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
        if (!n || e.oculto || !def || !def.f || RT.finDe(e) != null) continue;
        const p = param("salida", s);
        this._anim(n._rt.ae, def.f(p), { duration: p.dur, delay: p.retraso, easing: def.lineal ? "linear" : facil(p.facil), fill: "forwards" });
        if (RT.magia && !RT.menosMovimiento()) RT.magia(this, n, e, { salida: true, desde: p.retraso, dur: p.dur });
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
    cancelar() {
      for (const a of this.anims) { try { a.cancel(); } catch (err) { /* nada */ } }
      this.anims = [];
      for (const x of this.extras || []) x.remove();
      this.extras = [];
    }
  };

  /** Una animación de entrada suelta (las fotos de un álbum, por ejemplo). */
  RT.animarUno = function (nodo, tipo, p) {
    const def = RT.ANIM.entrada[tipo];
    if (!def || !def.f || !nodo.animate) return null;
    const q = param("entrada", p);
    try { return nodo.animate(def.f(q), { duration: q.dur, delay: q.retraso, easing: facil(q.facil), fill: "both" }); } catch (err) { return null; }
  };
})(window.LibritoRT = window.LibritoRT || {});
