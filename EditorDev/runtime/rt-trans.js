/*
 * LIBRITO · transiciones entre páginas
 *
 * Cada transición dice qué le pasa a la página que se va y a la que llega.
 * La dirección «auto» sigue al dedo: hacia delante entra por la derecha y
 * hacia atrás por la izquierda. Si se fija una, al volver se invierte.
 */
(function (RT) {
  "use strict";

  function vec(dir, d) {
    switch (dir) {
      case "derecha": return [d, 0];
      case "arriba": return [0, -d];
      case "abajo": return [0, d];
      default: return [-d, 0];
    }
  }
  const pct = (v) => `translate(${v[0]}%, ${v[1]}%)`;

  RT.TRANS = {
    ninguna: { n: "Ninguna" },
    fundido: { n: "Fundido", f: () => ({ sale: [{ opacity: 1 }, { opacity: 0 }], entra: [{ opacity: 0 }, { opacity: 1 }] }) },
    disolver: { n: "Disolver", f: () => ({ sale: [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], entra: [{ opacity: 0, filter: "blur(8px) brightness(1.15)" }, { opacity: 1, filter: "blur(0px) brightness(1)" }] }) },
    deslizar: { n: "Deslizar", dir: true, f: (d) => { const v = vec(d, 100); return { sale: [{ opacity: 1 }, { opacity: 0.6 }], entra: [{ transform: pct([-v[0], -v[1]]) }, { transform: "translate(0,0)" }], encima: "entra" }; } },
    empujar: { n: "Desplazamiento", dir: true, f: (d) => { const v = vec(d, 100); return { sale: [{ transform: "translate(0,0)" }, { transform: pct(v) }], entra: [{ transform: pct([-v[0], -v[1]]) }, { transform: "translate(0,0)" }] }; } },
    zoom: { n: "Zoom", f: () => ({ sale: [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.15)" }], entra: [{ opacity: 0, transform: "scale(.88)" }, { opacity: 1, transform: "scale(1)" }] }) },
    voltear: { n: "Voltear", dir: true, f: (d) => {
      const g = d === "derecha" || d === "abajo" ? -1 : 1;
      const eje = d === "arriba" || d === "abajo" ? "rotateX" : "rotateY";
      return {
        sale: [{ transform: `perspective(1400px) ${eje}(0deg)`, opacity: 1 }, { transform: `perspective(1400px) ${eje}(${-90 * g}deg)`, opacity: 1, offset: 0.5 }, { transform: `perspective(1400px) ${eje}(${-90 * g}deg)`, opacity: 0 }],
        entra: [{ transform: `perspective(1400px) ${eje}(${90 * g}deg)`, opacity: 0 }, { transform: `perspective(1400px) ${eje}(${90 * g}deg)`, opacity: 1, offset: 0.5 }, { transform: `perspective(1400px) ${eje}(0deg)`, opacity: 1 }],
      };
    } },
    hoja: { n: "Pasar la hoja", f: (d, atras) => atras
      ? { entra: [{ transform: "perspective(1800px) rotateY(-100deg)", transformOrigin: "left center" }, { transform: "perspective(1800px) rotateY(0deg)", transformOrigin: "left center" }], sale: [{ filter: "brightness(1)" }, { filter: "brightness(.75)" }], encima: "entra" }
      : { sale: [{ transform: "perspective(1800px) rotateY(0deg)", transformOrigin: "left center", filter: "brightness(1)" }, { transform: "perspective(1800px) rotateY(-100deg)", transformOrigin: "left center", filter: "brightness(.8)" }], entra: [{ filter: "brightness(.75)" }, { filter: "brightness(1)" }], encima: "sale" } },
    desenfoque: { n: "Desenfoque", f: () => ({ sale: [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(18px)" }], entra: [{ opacity: 0, filter: "blur(18px)" }, { opacity: 1, filter: "blur(0px)" }] }) },
    circulo: { n: "Círculo", f: () => ({ sale: [{ opacity: 1 }, { opacity: 0.4 }], entra: [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], encima: "entra" }) },
    cortina: { n: "Cortina", dir: true, f: (d) => {
      const desde = { izquierda: "inset(0 0 0 100%)", derecha: "inset(0 100% 0 0)", arriba: "inset(100% 0 0 0)", abajo: "inset(0 0 100% 0)" }[d] || "inset(0 0 0 100%)";
      return { sale: [{ opacity: 1 }, { opacity: 0.7 }], entra: [{ clipPath: desde }, { clipPath: "inset(0 0 0 0)" }], encima: "entra" };
    } },
    personalizada: { n: "Personalizada", dir: false, f: (d, atras, p) => {
      p = p || {};
      const g = atras ? -1 : 1;
      const x = RT.num(p.x, 30) * g, y = RT.num(p.y, 0) * g, s = RT.num(p.escala, 0.95), r = RT.num(p.rot, 0) * g, o = RT.num(p.opacidad, 0), b = RT.num(p.desenfoque, 0);
      return {
        entra: [{ transform: `translate(${x}%, ${y}%) scale(${s}) rotate(${r}deg)`, opacity: o, filter: `blur(${b}px)` }, { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)" }],
        sale: [{ transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)" }, { transform: `translate(${-x}%, ${-y}%) scale(${2 - s}) rotate(${-r}deg)`, opacity: o, filter: `blur(${b}px)` }],
      };
    } },
  };

  /* Animaciones y transiciones propias (de assets/animaciones, assets/transiciones
     o escritas en el editor): viajan DENTRO del proyecto (ajustes.extras) como
     fotogramas, así el librito exportado no necesita las carpetas. */
  RT.registrarExtras = function (aj) {
    const x = aj && aj.extras;
    if (!x) return;
    for (const id in x.animaciones || {}) {
      const a = x.animaciones[id];
      const fase = RT.ANIM[a.fase] ? a.fase : "entrada";
      const k = a.fotogramas;
      if (!Array.isArray(k) || !k.length) continue;
      RT.ANIM[fase][id] = { n: a.n || id, propia: true, lineal: !!a.lineal, f: () => k };
    }
    for (const id in x.transiciones || {}) {
      const t = x.transiciones[id];
      if (!t || (!t.entra && !t.sale)) continue;
      RT.TRANS[id] = { n: t.n || id, propia: true, f: () => ({ entra: t.entra || null, sale: t.sale || null, encima: t.encima || "entra" }) };
    }
  };

  const DIR_INV = { izquierda: "derecha", derecha: "izquierda", arriba: "abajo", abajo: "arriba" };

  /** Pasa de `viejo` a `nuevo`. Se cumple cuando acaba (o enseguida si no hay). */
  RT.transicion = function (viejo, nuevo, cfg, atras) {
    cfg = cfg || {};
    const def = RT.TRANS[cfg.tipo] || RT.TRANS.fundido;
    if (!viejo || !def.f || !nuevo.animate) return Promise.resolve();
    let dir = cfg.dir && cfg.dir !== "auto" ? cfg.dir : "izquierda";
    if (atras) dir = DIR_INV[dir] || dir;
    const k = def.f(dir, !!atras, cfg.propia);
    let dur = RT.num(cfg.dur, 700);
    if (RT.menosMovimiento()) dur = Math.min(dur, 250);
    const op = { duration: dur, easing: (RT.FACIL[cfg.facil] || RT.FACIL.entraSale).v, fill: "both" };
    viejo.style.zIndex = k.encima === "sale" ? 2 : 1;
    nuevo.style.zIndex = k.encima === "sale" ? 1 : 2;
    const anims = [];
    try {
      if (k.sale) anims.push(viejo.animate(k.sale, op));
      if (k.entra) anims.push(nuevo.animate(k.entra, op));
    } catch (err) { return Promise.resolve(); }
    return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
      for (const a of anims) { try { a.cancel(); } catch (err) { /* nada */ } }
      nuevo.style.zIndex = "";
    });
  };
})(window.LibritoRT = window.LibritoRT || {});
