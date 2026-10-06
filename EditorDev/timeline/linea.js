/**
 * LA LÍNEA DE TIEMPO — como en un editor de vídeo.
 *
 *   regla        tocar o arrastrar = ir a ese instante (la hoja lo muestra)
 *   Página       cuánto dura (si pasa sola) y su transición al llegar
 *   Música       la canción que suena en esta página (escúchala con ♪)
 *   una pista por elemento (la de arriba es la que se ve delante):
 *     el clip     cuándo está en la página: arrastrarlo lo mueve en el
 *                 tiempo; sus bordes cambian cuándo aparece y cuándo se va
 *     rosa        la entrada (arrastrar = retraso, su borde = duración)
 *     morado      la animación propia
 *     rayado      el bucle, mientras está
 *     gris        la salida (termina justo cuando se va)
 *     marcas      sonido al aparecer · acción al tocarlo · empieza escondido
 *   el nombre     tocar = elegir · arrastrar el asa = cambiar la capa
 *
 * Reproducir, pausar, avanzar y retroceder pintan la página de verdad
 * (las mismas animaciones que el librito) y hacen sonar sus sonidos.
 * Dos dedos o Ctrl+rueda acercan; todo se arrastra con el dedo.
 */
import { el, menu, ordenable } from "../components/ui.js";
import { ico } from "../components/iconos.js";
import { TIPOS } from "../core/modelo.js";
import { holgura, TOQUE_LARGO, vibrar, enCuadro } from "../canvas/gestos.js";

const RT = window.LibritoRT;
const ET = 132;           // ancho de la columna de nombres (px)
const PASO = 50;          // los tiempos se redondean a 50 ms
const ALTO = "editordev:tl-alto";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (ms) => { const s = Math.max(0, ms) / 1000; const m = Math.floor(s / 60); return `${m}:${(s % 60).toFixed(1).padStart(4, "0")}`; };

export class Linea {
  constructor(app, raiz) {
    this.app = app;
    this.E = app.estado;
    this.raiz = raiz;
    this.abierta = false;
    this.anim = null;
    this.t = 0;
    this.pps = matchMedia("(pointer: coarse)").matches ? 90 : 120; // píxeles por segundo
    this.conMusica = false;
    this._relojes = [];
    const re = () => { if (this.abierta && !this._arrastrando) { cancelAnimationFrame(this._r); this._r = requestAnimationFrame(() => this.pintar()); } };
    this.E.on("el", ({ rutas }) => {
      if (!this.abierta || this._arrastrando) return;
      if ((rutas || []).some((r) => /^anim|^nombre|^oculto|^tiempo|^sonidos|^accion|^inicioOculto|^bloqueado|^grupo/.test(r))) { re(); this._refrescarAnim(); }
    });
    this.E.on("els", () => { re(); this._refrescarAnim(); });
    this.E.on("actual", () => { this.parar(false); this.t = 0; re(); });
    this.E.on("sel", re);
    this.E.on("pagina", ({ ruta }) => { if (/^duracion|^musica|^transicion/.test(ruta || "")) re(); });
  }

  /* ── Abrir y cerrar ─────────────────────────────────────────────── */
  alternar(forzar) {
    this.abierta = forzar ?? !this.abierta;
    this.raiz.hidden = !this.abierta;
    document.body.classList.toggle("con-linea", this.abierta);
    if (this.abierta) {
      let alto = 0;
      try { alto = +localStorage.getItem(ALTO) || 0; } catch (e) { /* nada */ }
      this._alto(alto || (matchMedia("(max-width: 1023px), (max-height: 560px)").matches ? Math.round(innerHeight * 0.38) : 260));
      this.app.cerrarHoja?.();
      this.app.lateral?.cerrar();
      this.pintar();
    } else this.parar();
  }

  _alto(px) {
    const max = Math.max(160, Math.round(innerHeight * 0.7));
    px = clamp(Math.round(px), 150, max);
    this.altoPx = px;
    document.body.style.setProperty("--tl", px + "px");
  }

  /* ── Medidas ────────────────────────────────────────────────────── */
  _total() {
    const p = this.E.pagina;
    let t = 0;
    for (const e of p?.els || []) {
      t = Math.max(t, RT.finEntrada(e));
      const s = e.anim?.salida;
      if (RT.finDe(e) == null && s && s.tipo !== "ninguna" && e.tiempo?.inicio) t = Math.max(t, RT.inicioDe(e));
    }
    return Math.max(t, (p?.duracion || 0) * 1000);
  }

  _largo() { return Math.max(6000, Math.ceil((Math.max(this._total(), this.t) + 2500) / 1000) * 1000); }
  x(ms) { return (ms / 1000) * this.pps; }
  ms(px) { return (px / this.pps) * 1000; }

  /* ── Pintar ─────────────────────────────────────────────────────── */
  pintar() {
    const p = this.E.pagina;
    const r = this.raiz;
    const y = this.cuerpo?.scrollTop || 0, x = this.cuerpo?.scrollLeft || 0;
    r.textContent = "";
    if (!p) return;
    const T = this._largo();
    this.T = T;
    const W = this.x(T);
    // Cabecera: transporte y herramientas.
    const b = (i, t, al, cls = "") => el("button.ed-tl-b" + (cls ? "." + cls : ""), { type: "button", title: t, "aria-label": t, html: ico(i), onClick: al });
    this.btnPlay = b(this.anim && !this.anim.quieto ? "pausa" : "play", "Reproducir / pausar (espacio)", () => this.alternarPlay(), "grande");
    this.reloj = el("span.ed-tl-reloj", { text: `${fmt(this.t)} / ${fmt(this._total())}` });
    const sel = this.E.unico;
    const cab = el("div.ed-tl-cab", {}, [
      el("div.ed-tl-tirador", { title: "Arrastra para cambiar el alto" }),
      el("div.ed-tl-transporte", {}, [
        b("inicio", "Al principio", () => this.ir(0)),
        b("retroceder", "Atrás medio segundo", () => this.ir(this.t - 500)),
        this.btnPlay,
        b("avanzar", "Adelante medio segundo", () => this.ir(this.t + 500)),
        b("final", "Al final", () => this.ir(this._total())),
      ]),
      this.reloj,
      el("div.ed-tl-herr", {}, [
        sel ? b("izqA", "Que aparezca aquí (en el cabezal)", () => this._ponerTiempo(sel, "inicio")) : null,
        sel ? b("derA", "Que se vaya aquí (en el cabezal)", () => this._ponerTiempo(sel, "fin")) : null,
        b("audio", "Escuchar la música de la página al reproducir", () => { this.conMusica = !this.conMusica; this.pintar(); }, this.conMusica ? "on" : ""),
        b("zoomMenos", "Alejar", () => this._zoom(this.pps / 1.4)),
        b("zoomMas", "Acercar", () => this._zoom(this.pps * 1.4)),
        b("cerrar", "Cerrar la línea de tiempo", () => this.alternar(false)),
      ].filter(Boolean)),
    ]);
    // Cuerpo: un solo lienzo que se desplaza en los dos sentidos (nombres y regla fijos).
    const lienzo = el("div.ed-tl-lienzo", { style: { width: ET + W + 40 + "px" } });
    const regla = el("div.ed-tl-regla");
    const paso = this.pps >= 160 ? 250 : this.pps >= 80 ? 500 : 1000;
    for (let s = 0; s <= T; s += paso) regla.append(el("i" + (s % 1000 ? ".m" : ""), { style: { left: this.x(s) + "px" }, text: s % 1000 ? "" : fmt(s).replace(/\.0$/, "") }));
    lienzo.append(el("div.ed-tl-fila.ed-tl-fregla", {}, [el("div.ed-tl-et", {}, [el("small", { text: "tiempo" })]), regla]));
    lienzo.append(this._filaPagina(p, T));
    lienzo.append(this._filaMusica(p, T));
    const els = [...p.els].reverse();
    const filas = el("div.ed-tl-filas");
    for (const e of els) filas.append(this._fila(e, T));
    if (!els.length) filas.append(el("p.ed-vacio-txt", { text: "Nada en esta página todavía: lo que añadas aparece aquí con su pista." }));
    lienzo.append(filas);
    this.cabezal = el("div.ed-tl-cabezal", { style: { transform: `translateX(${ET + this.x(this.t)}px)` } }, [el("i")]);
    lienzo.append(this.cabezal);
    this.cuerpo = el("div.ed-tl-cuerpo", {}, [lienzo]);
    r.append(cab, this.cuerpo);
    this.cuerpo.scrollTop = y;
    this.cuerpo.scrollLeft = x;
    this._enlazar(regla, cab, filas, els);
  }

  _filaPagina(p, T) {
    const pista = el("div.ed-tl-pista.pagina");
    const tr = p.transicion?.tipo ? p.transicion : this.E.proyecto.ajustes.transicion;
    if (tr && tr.tipo && tr.tipo !== "ninguna") pista.append(el("div.ed-tl-trans", { style: { width: this.x(tr.dur || 700) + "px" }, title: "Transición al llegar: " + (RT.TRANS?.[tr.tipo]?.n || tr.tipo) }, [el("span", { text: "transición" })]));
    const d = (p.duracion || 0) * 1000;
    const fin = el("div.ed-tl-pfin" + (d ? "" : ".nada"), { dataset: { arr: "pagina-fin" }, style: { transform: `translateX(${this.x(d || T - 1000)}px)` }, title: d ? `Pasa sola a los ${d / 1000} s · arrastra para cambiarlo` : "Espera a que pase la hoja · arrastra para que pase sola" }, [el("i"), el("span", { text: d ? `pasa sola · ${(d / 1000).toFixed(1)} s` : "pasa al tocar" })]);
    pista.append(fin);
    return el("div.ed-tl-fila.ed-tl-fpag", {}, [el("div.ed-tl-et", {}, [el("b", { html: ico("paginas") }), el("span", { text: "Página" })]), pista]);
  }

  _filaMusica(p, T) {
    const g = this.E.proyecto.ajustes.musica || {};
    const m = p.musica || {};
    const id = m.modo === "silencio" ? null : m.modo === "propia" ? m.asset : g.asset;
    const nombre = id ? this.E.proyecto.assets[id]?.nombre || "canción" : m.modo === "silencio" ? "silencio" : "sin música";
    const pista = el("div.ed-tl-pista.musica");
    if (id) pista.append(el("div.ed-tl-onda", { style: { width: this.x(T) + "px" } }, [el("span", { html: ico("audio") + nombre + (m.modo === "propia" ? "" : " · la del librito") })]));
    else pista.append(el("small.ed-tl-nada", { text: nombre }));
    return el("div.ed-tl-fila.ed-tl-fmus", {}, [el("div.ed-tl-et", {}, [el("b", { html: ico("audio") }), el("span", { text: "Música" })]), pista]);
  }

  _fila(e, T) {
    const sel = this.E.sel.includes(e.id);
    const ini = RT.inicioDe(e), fin = RT.finDe(e);
    const hasta = fin != null ? fin : T;
    const a = e.anim || {};
    const clip = el("div.ed-tl-clip" + (fin == null ? ".abierto" : "") + (e.inicioOculto ? ".escondido" : "") + (sel ? ".on" : ""), {
      dataset: { arr: "clip", id: e.id },
      style: { transform: `translateX(${this.x(ini)}px)`, width: Math.max(14, this.x(hasta - ini)) + "px" },
      title: `${e.nombre}: aparece en ${fmt(ini)}${fin != null ? `, se va en ${fmt(fin)}` : ", se queda"}${e.inicioOculto ? " · empieza escondido (lo muestra una acción)" : ""}`,
    });
    const seg = (cls, desde, dur, arr, txt, borde) => {
      const s = el("div.ed-tl-seg." + cls, { dataset: { arr, id: e.id }, style: { left: this.x(desde) + "px", width: Math.max(8, this.x(dur)) + "px" } }, [txt ? el("span", { text: txt }) : null, borde ? el("i.ed-tl-borde", { dataset: { arr: borde, id: e.id } }) : null].filter(Boolean));
      clip.append(s);
      return s;
    };
    let finEnt = 0;
    const en = a.entrada;
    if (en && en.tipo && en.tipo !== "ninguna") {
      const ret = en.retraso || 0, dur = en.dur || 800;
      seg("entrada", ret, dur, "entrada", RT.ANIM.entrada[en.tipo]?.n || en.tipo, "entrada-dur");
      finEnt = ret + dur;
    }
    const pr = a.propia;
    if (pr && (pr.raw || pr.fotogramas)) {
      const ret = pr.retraso || 0, dur = pr.dur || 1000;
      seg("propia", ret, dur, "propia", "propia", "propia-dur");
      finEnt = Math.max(finEnt, ret + dur);
    }
    const bu = a.bucle;
    if (bu && bu.tipo && bu.tipo !== "ninguno") {
      const desde = finEnt + (bu.retraso || 0);
      if (hasta - ini > desde) seg("bucle", desde, hasta - ini - desde, "clip", "bucle · " + (RT.ANIM.bucle[bu.tipo]?.n || ""));
    }
    const sa = a.salida;
    if (fin != null && sa && sa.tipo && sa.tipo !== "ninguna") {
      const dur = Math.min(sa.dur || 500, fin - ini);
      const s = seg("salida", fin - ini - dur, dur, "clip", RT.ANIM.salida[sa.tipo]?.n || "salida");
      s.prepend(el("i.ed-tl-borde.izq", { dataset: { arr: "salida-dur", id: e.id } }));
    }
    // Las asas para recortar: cuándo aparece y cuándo se va.
    clip.append(el("i.ed-tl-asa.izq", { dataset: { arr: "ini", id: e.id }, title: "Cuándo aparece" }), el("i.ed-tl-asa.der", { dataset: { arr: "fin", id: e.id }, title: "Cuándo se va" }));
    const so = e.sonidos;
    if (so?.aparecer) clip.append(el("i.ed-tl-marca", { style: { left: this.x((en && en.tipo !== "ninguna" ? en.retraso || 0 : 0)) + "px" }, title: "Suena al aparecer", html: ico("campana") }));
    const pista = el("div.ed-tl-pista", {}, [clip]);
    const marcas = [e.accion?.tipo ? el("i", { title: "Hace algo al tocarlo", html: ico("toque") }) : null, so?.tocar ? el("i", { title: "Suena al tocarlo", html: ico("sonido") }) : null, e.inicioOculto ? el("i", { title: "Empieza escondido", html: ico("ojoNo") }) : null].filter(Boolean);
    const et = el("div.ed-tl-et" + (sel ? ".on" : ""), { dataset: { id: e.id } }, [
      el("button.ed-asa", { type: "button", html: ico("agarre"), title: "Arrastra para cambiar la capa", "aria-label": "Cambiar la capa" }),
      el("b", { html: ico(TIPOS[e.tipo]?.ico || "elementos") }),
      el("span", { text: e.nombre }),
      marcas.length ? el("em", {}, marcas) : null,
    ].filter(Boolean));
    return el("div.ed-tl-fila" + (sel ? ".on" : "") + (e.oculto ? ".oculto" : ""), { dataset: { id: e.id } }, [et, pista]);
  }

  /* ── Gestos ─────────────────────────────────────────────────────── */
  _enlazar(regla, cab, filas, els) {
    // La regla y el cabezal: ir a un instante (arrastrando se ve la página en ese momento).
    const buscar = (ev) => {
      ev.preventDefault();
      const rr = regla.getBoundingClientRect();
      const ir = enCuadro((m) => this.ir(this.ms(m.clientX - rr.left), true));
      ir(ev);
      const t = ev.currentTarget;
      try { t.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      const mover = (m) => ir(m);
      const fin = () => { ir.ya(); t.removeEventListener("pointermove", mover); t.removeEventListener("pointerup", fin); t.removeEventListener("pointercancel", fin); };
      t.addEventListener("pointermove", mover);
      t.addEventListener("pointerup", fin);
      t.addEventListener("pointercancel", fin);
    };
    regla.addEventListener("pointerdown", buscar);
    this.cabezal.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); buscar.call(regla, Object.defineProperty(ev, "currentTarget", { value: this.cabezal })); });
    // Clips, segmentos y bordes.
    this.cuerpo.addEventListener("pointerdown", (ev) => {
      const n = ev.target.closest("[data-arr]");
      if (!n || ev.button > 0) return;
      this._arrastre(ev, n.dataset.arr, n.dataset.id, n);
    });
    // Elegir tocando el nombre.
    filas.addEventListener("click", (ev) => {
      const et = ev.target.closest(".ed-tl-et");
      if (et && !ev.target.closest(".ed-asa")) this.E.seleccionar([et.dataset.id], ev.shiftKey || ev.metaKey || ev.ctrlKey);
    });
    // Cambiar la capa arrastrando el asa (la lista va al revés: arriba = delante).
    ordenable(filas, { item: ".ed-tl-fila", asa: ".ed-asa", alSoltar: (de, a) => { const n = els.length; this.E.moverCapa(els[de].id, n - 1 - a); } });
    // Cambiar el alto arrastrando el borde de arriba.
    const tir = cab.querySelector(".ed-tl-tirador");
    tir.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      tir.setPointerCapture(ev.pointerId);
      const y0 = ev.clientY, a0 = this.altoPx;
      const mover = enCuadro((m) => this._alto(a0 - (m.clientY - y0)));
      const fin = () => { mover.ya(); tir.removeEventListener("pointermove", mover); tir.removeEventListener("pointerup", fin); try { localStorage.setItem(ALTO, this.altoPx); } catch (e) { /* nada */ } };
      tir.addEventListener("pointermove", mover);
      tir.addEventListener("pointerup", fin);
    });
    // Acercar: Ctrl+rueda o dos dedos.
    this.cuerpo.addEventListener("wheel", (ev) => {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      ev.preventDefault();
      this._zoom(this.pps * Math.exp(-ev.deltaY * 0.01), ev.clientX);
    }, { passive: false });
    const dedos = new Map();
    let pz = null;
    this.cuerpo.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType !== "touch") return;
      dedos.set(ev.pointerId, ev.clientX);
      if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pz = { d0: Math.abs(a - b) || 1, p0: this.pps, cx: (a + b) / 2 }; this._cancelarArrastre?.(); }
    });
    this.cuerpo.addEventListener("pointermove", (ev) => {
      if (!dedos.has(ev.pointerId)) return;
      dedos.set(ev.pointerId, ev.clientX);
      if (pz && dedos.size === 2) { const [a, b] = [...dedos.values()]; this._zoom(pz.p0 * (Math.abs(a - b) / pz.d0), pz.cx, true); }
    });
    const quitar = (ev) => { dedos.delete(ev.pointerId); if (dedos.size < 2) pz = null; };
    this.cuerpo.addEventListener("pointerup", quitar);
    this.cuerpo.addEventListener("pointercancel", quitar);
  }

  _zoom(pps, cx, suave) {
    pps = clamp(pps, 20, 600);
    if (Math.abs(pps - this.pps) < 0.5) return;
    const c = this.cuerpo;
    const r = c.getBoundingClientRect();
    const ancla = (cx ?? r.left + ET + (r.width - ET) / 2) - r.left - ET;
    const msAncla = this.ms(c.scrollLeft + ancla);
    this.pps = pps;
    const pintar = () => { this.pintar(); this.cuerpo.scrollLeft = Math.max(0, this.x(msAncla) - ancla); };
    if (suave) { cancelAnimationFrame(this._rz); this._rz = requestAnimationFrame(pintar); } else pintar();
  }

  /** Arrastrar un clip, un segmento o un borde (con imán a los otros bordes y al cabezal). */
  _arrastre(ev, arr, id, nodo) {
    const E = this.E;
    const p = E.pagina;
    const e = id ? E.el(id) : null;
    if (arr !== "pagina-fin" && !e) return;
    ev.preventDefault();
    ev.stopPropagation();
    // El dedo se «engancha» al contenedor (que no cambia): la pista se repinta
    // mientras se arrastra y, si se enganchara al clip, el navegador lo soltaría.
    const blanco = this.cuerpo;
    try { blanco.setPointerCapture(ev.pointerId); } catch (x) { /* nada */ }
    const id0 = ev.pointerId;
    const x0 = ev.clientX, y0 = ev.clientY;
    const ini0 = e ? RT.inicioDe(e) : 0, fin0 = e ? RT.finDe(e) : null;
    const en0 = { ...(e?.anim?.entrada || {}) }, pr0 = { ...(e?.anim?.propia || {}) }, sa0 = { ...(e?.anim?.salida || {}) };
    const dur0 = (p.duracion || 0) * 1000 || this.T - 1000;
    const imanes = [0, this.t];
    for (const o of p.els) if (o.id !== id) { imanes.push(RT.inicioDe(o)); const f = RT.finDe(o); if (f != null) imanes.push(f); }
    const umbral = this.ms(9);
    const pegar = (v) => { let m = null; for (const t of imanes) if (Math.abs(t - v) <= umbral && (m == null || Math.abs(t - v) < Math.abs(m - v))) m = t; return m != null ? m : Math.round(v / PASO) * PASO; };
    let fin = null, movio = false, largo = null;
    if (e && ev.pointerType !== "mouse") {
      largo = setTimeout(() => { if (movio) return; largo = "hecho"; vibrar(10); this._menuClip(e, x0, y0); }, TOQUE_LARGO);
    }
    const mover = enCuadro((m) => {
      if (m.pointerId !== id0) return;
      const d = this.ms(m.clientX - x0);
      if (!movio) {
        if (Math.hypot(m.clientX - x0, m.clientY - y0) < holgura(m)) return;
        movio = true;
        if (largo !== "hecho") clearTimeout(largo);
        if (largo === "hecho") return;
        fin = E.gesto("Línea de tiempo");
        this._arrastrando = true;
        if (e && !E.sel.includes(e.id)) E.seleccionar([e.id]);
      }
      if (!fin) return;
      const c = {};
      switch (arr) {
        case "clip": {
          const ni = Math.max(0, pegar(ini0 + d));
          c["tiempo.inicio"] = ni;
          if (fin0 != null) c["tiempo.fin"] = ni + (fin0 - ini0);
          break;
        }
        case "ini": c["tiempo.inicio"] = clamp(pegar(ini0 + d), 0, (fin0 ?? Infinity) - 100); break;
        case "fin": c["tiempo.fin"] = Math.max(ini0 + 100, pegar((fin0 ?? this.T) + d)); break;
        case "entrada": c["anim.entrada.retraso"] = Math.max(0, Math.round(((en0.retraso || 0) + d) / PASO) * PASO); break;
        case "entrada-dur": c["anim.entrada.dur"] = Math.max(PASO, Math.round(((en0.dur || 800) + d) / PASO) * PASO); break;
        case "propia": c["anim.propia.retraso"] = Math.max(0, Math.round(((pr0.retraso || 0) + d) / PASO) * PASO); break;
        case "propia-dur": c["anim.propia.dur"] = Math.max(PASO, Math.round(((pr0.dur || 1000) + d) / PASO) * PASO); break;
        case "salida-dur": c["anim.salida.dur"] = clamp(Math.round(((sa0.dur || 500) - d) / PASO) * PASO, PASO, (fin0 ?? 0) - ini0); break;
        case "pagina-fin": E.setPag({ duracion: Math.max(0.5, Math.round((dur0 + d) / 100) / 10) }, "Pasa sola"); break;
      }
      if (e && Object.keys(c).length) E.setEl(e.id, c, "Línea de tiempo");
      this._repintarFila(e);
    });
    const soltar = (u) => {
      if (u.pointerId !== id0) return;
      blanco.removeEventListener("pointermove", mover);
      blanco.removeEventListener("pointerup", soltar);
      blanco.removeEventListener("pointercancel", soltar);
      this._cancelarArrastre = null;
      if (largo !== "hecho") clearTimeout(largo);
      mover.ya();
      this._arrastrando = false;
      if (fin) { fin(); this.pintar(); this._refrescarAnim(); return; }
      if (largo === "hecho" || u.type === "pointercancel") return;
      if (!e) return;
      // Un toque: elegir; dos toques: abrir sus animaciones.
      const t = performance.now();
      if (this._ultimo && this._ultimo.id === e.id && t - this._ultimo.t < 380) { this._ultimo = null; this.app.insp.abrir("animar"); return; }
      this._ultimo = { id: e.id, t };
      this.E.seleccionar([e.id], u.shiftKey || u.metaKey || u.ctrlKey);
    };
    this._cancelarArrastre = () => { if (fin) { fin(false); fin = null; } this._arrastrando = false; mover.cancelar(); clearTimeout(largo); largo = "hecho"; this.pintar(); };
    blanco.addEventListener("pointermove", mover);
    blanco.addEventListener("pointerup", soltar);
    blanco.addEventListener("pointercancel", soltar);
  }

  /** Mientras se arrastra, sólo se repinta la pista que cambia. */
  _repintarFila(e) {
    if (!e) { const p = this.E.pagina; const f = this.cuerpo?.querySelector(".ed-tl-fpag"); if (f && p) f.replaceWith(this._filaPagina(p, this.T)); return; }
    const x = this.E.el(e.id);
    const vieja = this.cuerpo?.querySelector(`.ed-tl-filas > .ed-tl-fila[data-id="${e.id}"]`);
    if (!x || !vieja) return;
    const nueva = this._fila(x, this.T);
    vieja.replaceWith(nueva);
  }

  _menuClip(e, x, y) {
    const E = this.E;
    const t = (i, s) => `${ico(i)}<span>${s}</span>`;
    menu({ x, y }, [
      { t: t("izqA", `Que aparezca en ${fmt(this.t)}`), al: () => this._ponerTiempo(e, "inicio") },
      { t: t("derA", `Que se vaya en ${fmt(this.t)}`), al: () => this._ponerTiempo(e, "fin") },
      { t: t("bucle", "Que se quede hasta el final"), al: () => E.setEl(e.id, { "tiempo.fin": null }, "Se queda"), off: RT.finDe(e) == null },
      { t: t("inicio", "Que esté desde el principio"), al: () => E.setEl(e.id, { "tiempo.inicio": 0 }, "Desde el principio"), off: !RT.inicioDe(e) },
      "-",
      { t: t("animar", "Sus animaciones…"), al: () => { E.seleccionar([e.id]); this.app.insp.abrir("animar"); } },
      { t: t("play", "Probar sólo éste"), al: () => this.probar([e.id]) },
    ]);
  }

  _ponerTiempo(e, cual) {
    const E = this.E;
    const t = Math.round(this.t / PASO) * PASO;
    if (cual === "inicio") {
      const f = RT.finDe(e);
      E.setEl(e.id, { "tiempo.inicio": f != null && t >= f - 100 ? Math.max(0, f - 100) : t }, "Aparece aquí");
    } else E.setEl(e.id, { "tiempo.fin": Math.max(RT.inicioDe(e) + 100, t) }, "Se va aquí");
  }

  /* ── Reproducir ─────────────────────────────────────────────────── */
  _preparar(ids) {
    this._quitarAnim();
    const L = this.app.lienzo;
    if (!L.pag) return null;
    const p = this.E.pagina;
    const pagina = ids ? { ...p, els: p.els.filter((e) => ids.includes(e.id)) } : p;
    this.anim = new RT.Animador(pagina, L.pag.nodos);
    this.anim.componentes = [];
    this.anim.entrar();
    this.anim.ids = ids;
    document.body.classList.add("animando");
    return this.anim;
  }

  /** Ir a un instante: la hoja se queda quieta mostrando ese momento. */
  ir(ms, desdeRegla) {
    const tocando = this.anim && !this.anim.quieto;
    this.t = clamp(Math.round(ms), 0, this.T || this._largo());
    if (tocando) { this._play(this.t); return; }
    if (!this.anim) this._preparar(null);
    if (this.anim) { this.anim.quieto = true; this.anim.ir(this.t); }
    this._pintarCabezal(desdeRegla);
  }

  alternarPlay() { if (this.anim && !this.anim.quieto) this.pausar(); else this._play(this.t >= this._total() + 400 ? 0 : this.t); }

  /** Reproduce las entradas (de todo o de unos pocos) sobre el lienzo. */
  probar(ids) {
    if (!this.abierta) {
      // Sin la línea abierta: se reproduce y al terminar todo vuelve a su sitio.
      const a = this._preparar(ids || null);
      if (!a) return;
      const fin = Math.max(a.total + 1200, 1800);
      this._sonidos(0, ids);
      clearTimeout(this._fin);
      this._fin = setTimeout(() => this.parar(false), fin);
      return;
    }
    this._play(0, ids);
  }

  _play(desde = 0, ids) {
    const a = this.anim && !this.anim.ids && !ids ? this.anim : this._preparar(ids || null);
    if (!a) return;
    a.quieto = false;
    a.ir(desde);
    a.seguir();
    this.t = desde;
    this._sonidos(desde, ids);
    if (this.conMusica) {
      const p = this.E.pagina, g = this.E.proyecto.ajustes.musica || {}, m = p.musica || {};
      const id = m.modo === "silencio" ? null : m.modo === "propia" ? m.asset : g.asset;
      if (id) this.app.audio.pista(this.app.bib.url(id), m.modo === "propia" ? m.volumen ?? 0.8 : g.volumen ?? 0.7, desde);
    }
    const t0 = performance.now() - desde;
    const total = this._total() + 400;
    cancelAnimationFrame(this._raf);
    const paso = () => {
      if (this.anim !== a || a.quieto) return;
      this.t = performance.now() - t0;
      if (this.t >= total) { this.t = total; this.pausar(); return; }
      this._pintarCabezal(false, true);
      this._raf = requestAnimationFrame(paso);
    };
    this._raf = requestAnimationFrame(paso);
    this._icono();
  }

  pausar() {
    cancelAnimationFrame(this._raf);
    this._quitarRelojes();
    this.app.audio?.pararPista();
    if (this.anim) { this.anim.pausar(); this.anim.quieto = true; this.anim.ir(this.t); }
    this._pintarCabezal();
    this._icono();
  }

  /** Los sonidos «al aparecer» a su hora (desde `desde`). */
  _sonidos(desde, ids) {
    this._quitarRelojes();
    for (const e of this.E.pagina?.els || []) {
      if (ids && !ids.includes(e.id)) continue;
      const so = e.sonidos;
      if (!so?.aparecer || e.oculto || e.inicioOculto) continue;
      const en = e.anim?.entrada;
      const t = RT.inicioDe(e) + (en && en.tipo !== "ninguna" ? en.retraso || 0 : 0);
      if (t < desde - 30) continue;
      const url = this.app.bib.url(so.aparecer);
      this._relojes.push(setTimeout(() => RT.sonar(url, so.volumen), t - desde));
    }
  }

  _quitarRelojes() { for (const r of this._relojes) clearTimeout(r); this._relojes = []; }

  _quitarAnim() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._fin);
    this._quitarRelojes();
    if (this.anim) { this.anim.cancelar(); this.anim = null; }
    document.body.classList.remove("animando");
  }

  /** Si cambió algo mientras está detenida en un instante, se vuelve a armar ahí mismo. */
  _refrescarAnim() {
    if (!this.anim || !this.anim.quieto) return;
    cancelAnimationFrame(this._ra);
    this._ra = requestAnimationFrame(() => { const t = this.t; this._preparar(null); if (this.anim) { this.anim.quieto = true; this.anim.ir(t); } });
  }

  parar(repintar = true) {
    this._quitarAnim();
    this.app.audio?.pararPista();
    if (repintar && this.abierta) this.pintar();
  }

  _icono() { if (this.btnPlay) this.btnPlay.innerHTML = ico(this.anim && !this.anim.quieto ? "pausa" : "play"); }

  _pintarCabezal(desdeRegla, siguiendo) {
    if (!this.cabezal) return;
    const x = this.x(this.t);
    this.cabezal.style.transform = `translateX(${ET + x}px)`;
    if (this.reloj) this.reloj.textContent = `${fmt(this.t)} / ${fmt(this._total())}`;
    // Que el cabezal no se salga de lo que se ve al reproducir.
    const c = this.cuerpo;
    if (c && siguiendo && !desdeRegla) {
      const vis = c.clientWidth - ET;
      if (x > c.scrollLeft + vis - 40 || x < c.scrollLeft) c.scrollLeft = Math.max(0, x - vis * 0.2);
    }
  }
}
