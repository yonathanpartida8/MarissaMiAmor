/**
 * LA LÍNEA DE TIEMPO — como en un editor de vídeo.
 *
 *   asa (arriba)  arrastrarla sube o baja la línea (sigue al dedo y se
 *                 acomoda sola al soltar); tocarla cambia de alto; bajarla
 *                 del todo la cierra
 *   regla        tocar o arrastrar = ir a ese instante (la hoja lo muestra)
 *   Página       cuánto dura (si pasa sola) y su transición al llegar
 *   Música       la canción que suena en esta página
 *   Audio        las pistas de audio de la página: cada una es un clip con
 *                su onda; arrastrarlo la mueve, sus bordes la recortan
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
 * Nada se mueve sin querer:
 *   · con el dedo, un clip que NO está elegido no se mueve: deslizar sobre él
 *     desplaza la línea. Tócalo para elegirlo y luego arrástralo, o mantenlo
 *     presionado para agarrarlo (vibra) y arrástralo de una vez.
 *   · con el ratón se arrastra directo, como en cualquier editor.
 *
 * Nada parpadea: la línea se arma una vez y después sólo se ACTUALIZA
 * (components/morfo.js): elegir o arrastrar un clip cambia un par de
 * atributos, nunca rehace las filas. Lo elegido es un borde fijo.
 *
 * Reproducir, pausar, avanzar y retroceder pintan la página de verdad
 * (las mismas animaciones que el librito) y hacen sonar sus sonidos y pistas.
 * Dos dedos o Ctrl+rueda acercan.
 */
import { alCuadro } from "../config/cuadros.js";
import { el, menu, ordenable, COMPACTO, popover, control, Vinculos, fila } from "../components/ui.js";
import { ico } from "../components/iconos.js";
import { TIPOS, uid } from "../core/modelo.js";
import { holgura, TOQUE_LARGO, vibrar, enCuadro } from "../canvas/gestos.js";
import { hijos, parchear } from "../components/morfo.js";
import { resorte } from "../components/hoja.js";

const RT = window.LibritoRT;
const ET = 132;           // ancho de la columna de nombres (px)
const PASO = 50;          // los tiempos se redondean a 50 ms
const ALTO = "editordev:tl-alto";
const MIN = 150;
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
    this.audioSel = null;
    this._relojes = [];
    this._montar();
    const re = () => { if (this.abierta && !this._arrastrando) { cancelAnimationFrame(this._r); this._r = requestAnimationFrame(() => this.pintar()); } };
    this.E.on("el", ({ rutas }) => {
      if (!this.abierta || this._arrastrando) return;
      if ((rutas || []).some((r) => /^anim|^nombre|^oculto|^tiempo|^sonidos|^accion|^inicioOculto|^bloqueado|^grupo/.test(r))) { re(); this._refrescarAnim(); }
    });
    this.E.on("els", () => { re(); this._refrescarAnim(); });
    this.E.on("actual", () => { this.parar(false); this.t = 0; this.audioSel = null; re(); });
    this.E.on("sel", () => { if (this.E.sel.length) this.audioSel = null; re(); });
    this.E.on("pagina", ({ ruta }) => { if (/^duracion|^musica|^transicion|^audios/.test(ruta || "")) re(); });
    this.E.on("assets", re);
    this._re = re;
  }

  /* ── El esqueleto (una sola vez) ────────────────────────────────── */
  _montar() {
    const b = (ac, i, t, cls = "") => el("button.ed-tl-b" + (cls ? "." + cls : ""), { type: "button", title: t, "aria-label": t, dataset: { ac }, html: ico(i) });
    this.asaEl = el("button.ed-asa-hoja.ed-tl-asa", { type: "button", "aria-label": "Arrastra para cambiar el alto · toca para cambiarlo" }, [el("i")]);
    this.btnPlay = b("play", "play", "Reproducir / pausar", "grande");
    this.reloj = el("span.ed-tl-reloj");
    this.herr = el("div.ed-tl-herr");
    this.cab = el("div.ed-tl-cab", {}, [
      el("div.ed-tl-transporte", {}, [b("inicio", "inicio", "Al principio"), b("atras", "retroceder", "Atrás medio segundo"), this.btnPlay, b("adelante", "avanzar", "Adelante medio segundo"), b("final", "final", "Al final")]),
      this.reloj, this.herr,
    ]);
    this.cRegla = el("div.ed-tl-fila.ed-tl-fregla");
    this.cFijas = el("div.ed-tl-grupo");
    this.cAudios = el("div.ed-tl-grupo.ed-tl-audios");
    this.filas = el("div.ed-tl-filas");
    this.cabezal = el("div.ed-tl-cabezal", {}, [el("i")]);
    this.lienzo = el("div.ed-tl-lienzo", {}, [this.cRegla, this.cFijas, this.cAudios, this.filas, this.cabezal]);
    this.cuerpo = el("div.ed-tl-cuerpo", {}, [this.lienzo]);
    this.raiz.append(this.asaEl, this.cab, this.cuerpo);
    this._enlazar();
  }

  /* ── Abrir y cerrar ─────────────────────────────────────────────── */
  alternar(forzar) {
    this.abierta = forzar ?? !this.abierta;
    this.raiz.hidden = !this.abierta;
    document.body.classList.toggle("con-linea", this.abierta);
    if (this.abierta) {
      let alto = 0;
      try { alto = +localStorage.getItem(ALTO) || 0; } catch (e) { /* nada */ }
      this._alto(alto || (matchMedia(COMPACTO).matches ? Math.round(innerHeight * 0.38) : 260));
      this.app.cerrarHoja?.();
      this.app.lateral?.cerrar();
      this.pintar();
    } else this.parar();
  }

  _max() { return Math.max(MIN + 10, Math.round(innerHeight * 0.74)); }

  _alto(px, libre) {
    px = libre ? Math.round(px) : clamp(Math.round(px), MIN, this._max());
    this.altoPx = px;
    document.body.style.setProperty("--tl", Math.max(0, px) + "px");
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
    for (const a of p?.audios || []) t = Math.max(t, a.inicio + this._durPista(a));
    return Math.max(t, (p?.duracion || 0) * 1000);
  }

  _largo() { return Math.max(6000, Math.ceil((Math.max(this._total(), this.t) + 2500) / 1000) * 1000); }
  x(ms) { return (ms / 1000) * this.pps; }
  /** El ancho de verdad de la columna de nombres (cambia con el CSS del teléfono). */
  get et() { return this._etw || ET; }
  ms(px) { return (px / this.pps) * 1000; }

  /** Cuánto suena una pista (su recorte, o el archivo entero desde `desde`). */
  _durPista(a) {
    if (a.dur) return a.dur;
    const largo = this.app.audio?.duracionDe(this.app.bib.url(a.asset));
    return largo ? Math.max(200, largo - (a.desde || 0)) : 8000;
  }

  /* ── Pintar (se actualiza lo que cambió, nada se rehace) ────────── */
  pintar() {
    const p = this.E.pagina;
    if (!p) { hijos(this.filas, el("div")); return; }
    const T = this._largo();
    this.T = T;
    const W = this.x(T);
    this._icono();
    this.reloj.textContent = `${fmt(this.t)} / ${fmt(this._total())}`;
    hijos(this.herr, this._herramientas());
    hijos(this.cRegla, this._regla(T));
    this._etw = this.cRegla.firstChild?.offsetWidth || ET;
    this.lienzo.style.width = this.et + W + 40 + "px";
    hijos(this.cFijas, el("div", {}, [this._filaPagina(p, T), this._filaMusica(p, T)]));
    hijos(this.cAudios, el("div", {}, (p.audios || []).map((a) => this._filaAudio(a, T))));
    const els = [...p.els].reverse();
    hijos(this.filas, el("div", {}, els.length ? els.map((e) => this._fila(e, T)) : [el("p.ed-vacio-txt", { dataset: { k: "vacio" }, text: "Nada en esta página todavía: lo que añadas aparece aquí con su pista." })]));
    this._pintarCabezal();
  }

  _herramientas() {
    const b = (ac, i, t, cls = "") => el("button.ed-tl-b" + (cls ? "." + cls : ""), { type: "button", title: t, "aria-label": t, dataset: { ac, k: ac }, html: ico(i) });
    const sel = this.E.unico;
    return el("div", {}, [
      sel ? b("aparece", "izqA", "Que aparezca aquí (en el cabezal)") : null,
      sel ? b("sevay", "derA", "Que se vaya aquí (en el cabezal)") : null,
      b("pista", "onda", "Añadir una pista de audio aquí"),
      b("musica", "audio", "Escuchar la música de la página al reproducir", this.conMusica ? "on" : ""),
      b("menos", "zoomMenos", "Alejar"),
      b("mas", "zoomMas", "Acercar"),
      b("cerrar", "cerrar", "Cerrar la línea de tiempo"),
    ].filter(Boolean));
  }

  _regla(T) {
    const regla = el("div.ed-tl-regla", { dataset: { k: "regla" } });
    const paso = this.pps >= 160 ? 250 : this.pps >= 80 ? 500 : 1000;
    for (let s = 0; s <= T; s += paso) regla.append(el("i" + (s % 1000 ? ".m" : ""), { style: { left: this.x(s) + "px" }, text: s % 1000 ? "" : fmt(s).replace(/\.0$/, "") }));
    return el("div", {}, [el("div.ed-tl-et", { dataset: { k: "et" } }, [el("small", { text: "tiempo" })]), regla]);
  }

  _filaPagina(p, T) {
    const pista = el("div.ed-tl-pista.pagina");
    const tr = p.transicion?.tipo ? p.transicion : this.E.proyecto.ajustes.transicion;
    if (tr && tr.tipo && tr.tipo !== "ninguna") pista.append(el("div.ed-tl-trans", { style: { width: this.x(tr.dur || 700) + "px" }, title: "Transición al llegar: " + (RT.TRANS?.[tr.tipo]?.n || tr.tipo) }, [el("span", { text: "transición" })]));
    const d = (p.duracion || 0) * 1000;
    const fin = el("div.ed-tl-pfin" + (d ? "" : ".nada"), { dataset: { arr: "pagina-fin" }, style: { transform: `translateX(${this.x(d || T - 1000)}px)` }, title: d ? `Pasa sola a los ${d / 1000} s · arrastra para cambiarlo` : "Espera a que pase la hoja · arrastra para que pase sola" }, [el("i"), el("span", { text: d ? `pasa sola · ${(d / 1000).toFixed(1)} s` : "pasa al tocar" })]);
    pista.append(fin);
    return el("div.ed-tl-fila.ed-tl-fpag", { dataset: { k: "pag" } }, [el("div.ed-tl-et", {}, [el("b", { html: ico("paginas") }), el("span", { text: "Página" })]), pista]);
  }

  _filaMusica(p, T) {
    const g = this.E.proyecto.ajustes.musica || {};
    const m = p.musica || {};
    const id = m.modo === "silencio" ? null : m.modo === "propia" ? m.asset : g.asset;
    const nombre = id ? this.E.proyecto.assets[id]?.nombre || "canción" : m.modo === "silencio" ? "silencio" : "sin música";
    const pista = el("div.ed-tl-pista.musica");
    if (id) pista.append(el("div.ed-tl-onda", { style: { width: this.x(T) + "px" } }, [el("span", { html: ico("audio") + nombre + (m.modo === "propia" ? "" : " · la del librito") })]));
    else pista.append(el("small.ed-tl-nada", { text: nombre }));
    return el("div.ed-tl-fila.ed-tl-fmus", { dataset: { k: "mus" } }, [el("div.ed-tl-et", {}, [el("b", { html: ico("audio") }), el("span", { text: "Música" })]), pista]);
  }

  /** Una pista de audio: su clip con la onda (recortada) y sus bordes. */
  _filaAudio(a, T) {
    const url = this.app.bib.url(a.asset);
    const AU = this.app.audio;
    const sel = this.audioSel === a.id;
    const dur = this._durPista(a);
    const nombre = a.nombre || this.E.proyecto.assets[a.asset]?.nombre || "audio";
    const onda = AU?.ondaUrl(url);
    const largo = AU?.duracionDe(url);
    if (url && AU && (!onda || !largo)) AU.onda(url).then(() => this._re()).catch(() => {});
    const est = { left: 0, right: 0 };
    if (onda && largo) Object.assign(est, { backgroundImage: `url("${onda}")`, backgroundSize: `${this.x(largo)}px 100%`, backgroundPositionX: `${-this.x(a.desde || 0)}px`, backgroundRepeat: a.bucle ? "repeat-x" : "no-repeat" });
    const clip = el("div.ed-tl-clip.ed-tl-aclip" + (sel ? ".on" : ""), {
      dataset: { arr: "audio", id: a.id },
      style: { transform: `translateX(${this.x(a.inicio || 0)}px)`, width: Math.max(16, this.x(dur)) + "px" },
      title: `${nombre}: empieza en ${fmt(a.inicio || 0)} y suena ${fmt(dur)}${a.bucle ? " (en bucle)" : ""} · volumen ${Math.round((a.vol ?? 0.9) * 100)} %`,
    }, [
      el("div.ed-tl-ondas", { style: est }),
      el("span.ed-tl-anom", { text: nombre }),
      el("i.ed-tl-asa.izq", { dataset: { arr: "audio-ini", id: a.id }, title: "Recortar el principio" }),
      el("i.ed-tl-asa.der", { dataset: { arr: "audio-fin", id: a.id }, title: "Recortar el final" }),
    ]);
    const et = el("div.ed-tl-et" + (sel ? ".on" : ""), { dataset: { audio: a.id } }, [
      el("b", { html: ico("onda") }), el("span", { text: nombre }), el("em", { text: Math.round((a.vol ?? 0.9) * 100) + "%" }),
    ]);
    return el("div.ed-tl-fila.ed-tl-faudio" + (sel ? ".on" : ""), { dataset: { k: "a:" + a.id } }, [et, el("div.ed-tl-pista", {}, [clip])]);
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
    return el("div.ed-tl-fila" + (sel ? ".on" : "") + (e.oculto ? ".oculto" : ""), { dataset: { id: e.id, k: e.id } }, [et, pista]);
  }

  /* ── Gestos (todos delegados: los nodos se reutilizan) ──────────── */
  _enlazar() {
    // Botones de la cabecera.
    this.cab.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ac]");
      if (!b) return;
      const sel = this.E.unico;
      switch (b.dataset.ac) {
        case "inicio": this.ir(0); break;
        case "atras": this.ir(this.t - 500); break;
        case "play": this.alternarPlay(); break;
        case "adelante": this.ir(this.t + 500); break;
        case "final": this.ir(this._total()); break;
        case "aparece": if (sel) this._ponerTiempo(sel, "inicio"); break;
        case "sevay": if (sel) this._ponerTiempo(sel, "fin"); break;
        case "pista": this.app.paneles?.agregarPista?.(Math.round(this.t / PASO) * PASO); break;
        case "musica": this.conMusica = !this.conMusica; this.pintar(); break;
        case "menos": this._zoom(this.pps / 1.4); break;
        case "mas": this._zoom(this.pps * 1.4); break;
        case "cerrar": this.alternar(false); break;
      }
    });
    // El asa de arriba: el alto sigue al dedo.
    this.asaEl.addEventListener("pointerdown", (ev) => this._arrastrarAlto(ev));
    // Tocar, arrastrar, agarrar.
    this.cuerpo.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      if (this._dedo(ev)) return;
      if (ev.target.closest(".ed-asa")) return; // cambiar la capa (ordenable)
      if (ev.target.closest(".ed-tl-cabezal, .ed-tl-regla, .ed-tl-fregla")) { this._buscar(ev); return; }
      const n = ev.target.closest("[data-arr]");
      if (n) this._tocarArr(ev, n);
    });
    // Mientras se tiene «agarrado» un clip, el dedo no desplaza la línea.
    this.cuerpo.addEventListener("touchmove", (ev) => { if (this._agarrado) ev.preventDefault(); }, { passive: false });
    // Elegir tocando el nombre.
    this.cuerpo.addEventListener("click", (ev) => {
      if (ev.target.closest(".ed-asa")) return;
      const et = ev.target.closest(".ed-tl-et");
      if (!et) return;
      if (et.dataset.id) { this.audioSel = null; this.E.seleccionar([et.dataset.id], ev.shiftKey || ev.metaKey || ev.ctrlKey); }
      else if (et.dataset.audio) this._elegirAudio(et.dataset.audio);
    });
    // Cambiar la capa arrastrando el asa (la lista va al revés: arriba = delante).
    ordenable(this.filas, { item: ".ed-tl-fila", asa: ".ed-asa", alSoltar: (de, a) => { const els = [...this.E.pagina.els].reverse(); const n = els.length; if (els[de]) this.E.moverCapa(els[de].id, n - 1 - a); } });
    // Acercar: Ctrl+rueda.
    this.cuerpo.addEventListener("wheel", (ev) => {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      ev.preventDefault();
      this._zoom(this.pps * Math.exp(-ev.deltaY * 0.01), ev.clientX);
    }, { passive: false });
    const quitar = (ev) => { this._dedos?.delete(ev.pointerId); if ((this._dedos?.size || 0) < 2) this._pz = null; };
    this.cuerpo.addEventListener("pointermove", (ev) => {
      if (!this._dedos?.has(ev.pointerId)) return;
      this._dedos.set(ev.pointerId, ev.clientX);
      if (this._pz && this._dedos.size === 2) { const [a, b] = [...this._dedos.values()]; this._zoom(this._pz.p0 * (Math.abs(a - b) / this._pz.d0), this._pz.cx, true); }
    });
    this.cuerpo.addEventListener("pointerup", quitar);
    this.cuerpo.addEventListener("pointercancel", quitar);
  }

  /** Dos dedos: zoom (y se suelta lo que el primero estuviera haciendo). */
  _dedo(ev) {
    if (ev.pointerType !== "touch") return false;
    this._dedos = this._dedos || new Map();
    this._dedos.set(ev.pointerId, ev.clientX);
    if (this._dedos.size === 2) {
      const [a, b] = [...this._dedos.values()];
      this._pz = { d0: Math.abs(a - b) || 1, p0: this.pps, cx: (a + b) / 2 };
      this._cancelarArrastre?.();
      return true;
    }
    return this._dedos.size > 2;
  }

  /** Regla y cabezal: ir a un instante (arrastrando se ve la página en ese momento). */
  _buscar(ev) {
    ev.preventDefault();
    const regla = this.cRegla.querySelector(".ed-tl-regla");
    const rr = regla.getBoundingClientRect();
    const ir = enCuadro((m) => this.ir(this.ms(m.clientX - rr.left), true));
    ir(ev);
    const id = ev.pointerId;
    const t = this.cuerpo;
    try { t.setPointerCapture(id); } catch (e) { /* nada */ }
    const mover = (m) => { if (m.pointerId === id) ir(m); };
    const fin = (u) => { if (u.pointerId !== id) return; ir.ya(); t.removeEventListener("pointermove", mover); t.removeEventListener("pointerup", fin); t.removeEventListener("pointercancel", fin); };
    t.addEventListener("pointermove", mover);
    t.addEventListener("pointerup", fin);
    t.addEventListener("pointercancel", fin);
  }

  _elegirAudio(id) {
    this.audioSel = id;
    if (this.E.sel.length) this.E.seleccionar([]); else this.pintar();
    this.app.alElegirPista?.(id);
  }

  /** Un dedo (o el ratón) sobre un clip, un borde o una pista. */
  _tocarArr(ev, n) {
    const arr = n.dataset.arr, id = n.dataset.id;
    const esAudio = arr.startsWith("audio");
    const elegido = arr === "pagina-fin" || (esAudio ? this.audioSel === id : this.E.sel.includes(id));
    if (ev.pointerType === "mouse" || elegido) return this._arrastre(ev, arr, id);
    // Con el dedo y sin elegir: tocar = elegir · mantener = agarrarlo · deslizar = desplazar la línea.
    const x0 = ev.clientX, y0 = ev.clientY, pid = ev.pointerId;
    let listo = false;
    const limpiar = () => {
      listo = true;
      clearTimeout(largo);
      this.cuerpo.removeEventListener("pointermove", mover);
      this.cuerpo.removeEventListener("pointerup", arriba);
      this.cuerpo.removeEventListener("pointercancel", limpiar);
    };
    const mover = (m) => { if (m.pointerId === pid && Math.hypot(m.clientX - x0, m.clientY - y0) > holgura(m)) limpiar(); };
    const arriba = (u) => {
      if (u.pointerId !== pid || listo) return;
      limpiar();
      this._toqueClip(esAudio, id, u);
    };
    const largo = setTimeout(() => {
      if (listo) return;
      limpiar();
      vibrar(12);
      this._agarrado = true;
      if (esAudio) this._elegirAudio(id); else if (!this.E.sel.includes(id)) this.E.seleccionar([id]);
      this._arrastre(ev, esAudio ? "audio" : "clip", id, { agarrado: true });
    }, TOQUE_LARGO);
    this.cuerpo.addEventListener("pointermove", mover);
    this.cuerpo.addEventListener("pointerup", arriba);
    this.cuerpo.addEventListener("pointercancel", limpiar);
  }

  /** Un toque: elegir; dos toques: su menú. */
  _toqueClip(esAudio, id, u) {
    const t = performance.now();
    const doble = this._ultimo && this._ultimo.id === id && t - this._ultimo.t < 380;
    this._ultimo = doble ? null : { id, t };
    if (esAudio) {
      if (doble) { const a = this._pista(id); if (a) this._menuAudio(a, u.clientX, u.clientY); return; }
      this._elegirAudio(id);
      return;
    }
    if (doble) { const e = this.E.el(id); if (e) this._menuClip(e, u.clientX, u.clientY); return; }
    this.audioSel = null;
    this.E.seleccionar([id], u.shiftKey || u.metaKey || u.ctrlKey);
  }

  _pista(id) { return (this.E.pagina?.audios || []).find((a) => a.id === id) || null; }

  _zoom(pps, cx, suave) {
    pps = clamp(pps, 20, 600);
    if (Math.abs(pps - this.pps) < 0.5) return;
    const c = this.cuerpo;
    const r = c.getBoundingClientRect();
    const et = this.et;
    const ancla = (cx ?? r.left + et + (r.width - et) / 2) - r.left - et;
    const msAncla = this.ms(c.scrollLeft + ancla);
    this.pps = pps;
    const pintar = () => { this.pintar(); this.cuerpo.scrollLeft = Math.max(0, this.x(msAncla) - ancla); };
    if (suave) { cancelAnimationFrame(this._rz); this._rz = requestAnimationFrame(pintar); } else pintar();
  }

  /** El alto de la línea sigue al dedo; al soltar se acomoda (o se cierra). */
  _arrastrarAlto(ev) {
    if (ev.button > 0) return;
    ev.preventDefault();
    const a = this.asaEl;
    const id = ev.pointerId;
    try { a.setPointerCapture(id); } catch (e) { /* nada */ }
    this._pararAlto?.();
    const y0 = ev.clientY, a0 = this.altoPx;
    const L = this.app.lienzo;
    let movio = false, vel = 0, ultY = y0, ultT = performance.now(), pend = null, cuadro = 0;
    const mover = (m) => {
      if (m.pointerId !== id) return;
      if (!movio) { if (Math.abs(m.clientY - y0) < holgura(m)) return; movio = true; L?.congelar?.(true); this.raiz.classList.add("arrastrando"); }
      const t = performance.now();
      vel = vel * 0.6 + (((m.clientY - ultY) / Math.max(1, t - ultT)) * 1000) * 0.4;
      ultY = m.clientY; ultT = t;
      let h = a0 - (m.clientY - y0);
      const max = this._max();
      if (h > max) h = max + Math.sqrt(h - max) * 3;
      pend = h;
      if (!cuadro) cuadro = requestAnimationFrame(() => { cuadro = 0; if (pend != null) this._alto(pend, true); });
    };
    const soltar = (u) => {
      if (u.pointerId !== id) return;
      a.removeEventListener("pointermove", mover);
      a.removeEventListener("pointerup", soltar);
      a.removeEventListener("pointercancel", soltar);
      cancelAnimationFrame(cuadro);
      this.raiz.classList.remove("arrastrando");
      const H = this._max();
      const paradas = [Math.max(MIN, Math.round(H * 0.42)), Math.round(H * 0.7), H].filter((v, i, xs) => xs.indexOf(v) === i);
      if (!movio) {
        // Un toque: siguiente alto.
        const i = paradas.findIndex((p) => p > this.altoPx + 8);
        this._irAlto(i >= 0 ? paradas[i] : paradas[0], 0);
        return;
      }
      if (performance.now() - ultT > 120) vel = 0;
      const actual = this.altoPx;
      const proy = actual - clamp(vel, -2600, 2600) * 0.2;
      if (proy < MIN * 0.7 || (vel > 1200 && actual < paradas[0] + 40)) { this._irAlto(0, -vel, () => { L?.congelar?.(false); this.alternar(false); }); vibrar(6); return; }
      let mejor = paradas[0];
      for (const p of paradas) if (Math.abs(p - proy) < Math.abs(mejor - proy)) mejor = p;
      this._irAlto(mejor, -vel);
    };
    a.addEventListener("pointermove", mover);
    a.addEventListener("pointerup", soltar);
    a.addEventListener("pointercancel", soltar);
  }

  _irAlto(h, v0, alFin) {
    const L = this.app.lienzo;
    L?.congelar?.(true);
    this._pararAlto?.();
    this._pararAlto = resorte(this.altoPx, h, { v0, cuadro: (x) => this._alto(x, true), fin: () => {
      this._pararAlto = null;
      if (h > 0) { this._alto(h); try { localStorage.setItem(ALTO, this.altoPx); } catch (e) { /* nada */ } }
      if (alFin) alFin(); else L?.congelar?.(false);
    } });
  }

  /** Arrastrar un clip, un segmento, un borde o una pista (con imán a los otros bordes y al cabezal). */
  _arrastre(ev, arr, id, op = {}) {
    const E = this.E;
    const p = E.pagina;
    const esAudio = arr.startsWith("audio");
    const e = id && !esAudio ? E.el(id) : null;
    const pa = esAudio ? this._pista(id) : null;
    if (arr !== "pagina-fin" && !e && !pa) { this._agarrado = false; return; }
    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();
    // El dedo se «engancha» al contenedor (que nunca cambia).
    const blanco = this.cuerpo;
    try { blanco.setPointerCapture(ev.pointerId); } catch (x) { /* nada */ }
    const id0 = ev.pointerId;
    const x0 = ev.clientX, y0 = ev.clientY;
    const ini0 = e ? RT.inicioDe(e) : pa ? pa.inicio || 0 : 0, fin0 = e ? RT.finDe(e) : null;
    const en0 = { ...(e?.anim?.entrada || {}) }, pr0 = { ...(e?.anim?.propia || {}) }, sa0 = { ...(e?.anim?.salida || {}) };
    const desde0 = pa?.desde || 0, durP0 = pa ? this._durPista(pa) : 0;
    const largoArchivo = pa ? this.app.audio?.duracionDe(this.app.bib.url(pa.asset)) : null;
    const dur0 = (p.duracion || 0) * 1000 || this.T - 1000;
    const imanes = [0, this.t];
    for (const o of p.els) if (o.id !== id) { imanes.push(RT.inicioDe(o)); const f = RT.finDe(o); if (f != null) imanes.push(f); }
    for (const o of p.audios || []) if (o.id !== id) { imanes.push(o.inicio || 0); imanes.push((o.inicio || 0) + this._durPista(o)); }
    const umbral = this.ms(9);
    const pegar = (v) => { let m = null; for (const t of imanes) if (Math.abs(t - v) <= umbral && (m == null || Math.abs(t - v) < Math.abs(m - v))) m = t; return m != null ? m : Math.round(v / PASO) * PASO; };
    let fin = null, movio = !!op.agarrado, largo = null;
    // Ratón o clip ya elegido: mantener sin mover = su menú.
    if (!op.agarrado && ev.pointerType !== "mouse" && (e || pa)) {
      largo = setTimeout(() => { if (movio) return; largo = "hecho"; vibrar(10); if (pa) this._menuAudio(pa, x0, y0); else this._menuClip(e, x0, y0); }, TOQUE_LARGO);
    }
    const empezar = () => {
      fin = E.gesto(esAudio ? "Pista de audio" : "Línea de tiempo");
      this._arrastrando = true;
      this.raiz.classList.add("moviendo");
      if (e && !E.sel.includes(e.id)) E.seleccionar([e.id]);
    };
    if (op.agarrado) empezar();
    const mover = enCuadro((m) => {
      if (m.pointerId !== id0) return;
      const d = this.ms(m.clientX - x0);
      if (!fin) {
        if (Math.hypot(m.clientX - x0, m.clientY - y0) < holgura(m)) return;
        movio = true;
        if (largo !== "hecho") clearTimeout(largo);
        if (largo === "hecho") return;
        empezar();
      }
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
        case "audio": this._ponerPista(id, { inicio: Math.max(0, pegar(ini0 + d)) }); break;
        case "audio-ini": {
          // Recortar el principio: empieza más tarde y salta esa parte del archivo.
          const ni = clamp(pegar(ini0 + d), Math.max(0, ini0 - desde0), ini0 + durP0 - 200);
          const k = ni - ini0;
          this._ponerPista(id, { inicio: ni, desde: Math.max(0, desde0 + k), dur: Math.max(200, durP0 - k) });
          break;
        }
        case "audio-fin": {
          let nd = Math.max(200, pegar(ini0 + durP0 + d) - ini0);
          if (largoArchivo && !pa.bucle) nd = Math.min(nd, largoArchivo - desde0);
          this._ponerPista(id, { dur: Math.round(nd) });
          break;
        }
      }
      if (e && Object.keys(c).length) E.setEl(e.id, c, "Línea de tiempo");
      this._repintarFila(e, pa);
    });
    const soltar = (u) => {
      if (u.pointerId !== id0) return;
      blanco.removeEventListener("pointermove", mover);
      blanco.removeEventListener("pointerup", soltar);
      blanco.removeEventListener("pointercancel", soltar);
      this._cancelarArrastre = null;
      this._agarrado = false;
      this.raiz.classList.remove("moviendo");
      if (largo !== "hecho") clearTimeout(largo);
      mover.ya();
      this._arrastrando = false;
      if (fin) { fin(); this.pintar(); this._refrescarAnim(); return; }
      if (largo === "hecho" || u.type === "pointercancel") return;
      if (op.agarrado) { if (pa) this._menuAudio(pa, u.clientX, u.clientY); else if (e) this._menuClip(e, u.clientX, u.clientY); return; }
      if (!e && !pa) return;
      this._toqueClip(!!pa, id, u);
    };
    this._cancelarArrastre = () => { if (fin) { fin(false); fin = null; } this._arrastrando = false; this._agarrado = false; this.raiz.classList.remove("moviendo"); mover.cancelar(); clearTimeout(largo); largo = "hecho"; this.pintar(); };
    blanco.addEventListener("pointermove", mover);
    blanco.addEventListener("pointerup", soltar);
    blanco.addEventListener("pointercancel", soltar);
  }

  _ponerPista(id, cambios, nombre = "Pista de audio", clave) {
    const lista = (this.E.pagina?.audios || []).map((a) => (a.id === id ? { ...a, ...cambios } : a));
    this.E.setPag({ audios: lista }, nombre, clave);
  }

  /** Mientras se arrastra, sólo se actualiza la pista que cambia (sin rehacerla). */
  _repintarFila(e, pa) {
    const T = this.T;
    if (pa) {
      const a = this._pista(pa.id);
      const vieja = this.cAudios.querySelector(`[data-k="a:${pa.id}"]`);
      if (a && vieja) hijos(this.cAudios, el("div", {}, (this.E.pagina.audios || []).map((x) => this._filaAudio(x, T))));
      return;
    }
    if (!e) { hijos(this.cFijas, el("div", {}, [this._filaPagina(this.E.pagina, T), this._filaMusica(this.E.pagina, T)])); return; }
    const x = this.E.el(e.id);
    const vieja = this.filas.querySelector(`.ed-tl-fila[data-k="${CSS.escape(e.id)}"]`);
    if (!x || !vieja) return;
    const nueva = this._fila(x, T);
    // Se comparan y se cambian sólo los atributos (nada se reemplaza: nada parpadea).
    parchear(vieja, nueva);
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

  _menuAudio(a, x, y) {
    const t = (i, s) => `${ico(i)}<span>${s}</span>`;
    const dur = this._durPista(a);
    menu({ x, y }, [
      { t: t("play", "Escuchar desde su principio"), al: () => this.app.audio?.pistas([this._datosPista(a)], a.inicio || 0, true) },
      { t: t("volumen", `Volumen · ${Math.round((a.vol ?? 0.9) * 100)} %`), al: () => this._volumenPista(a, x, y) },
      { t: t("bucle", a.bucle ? "Que no se repita" : "Que se repita (en bucle)"), al: () => this._ponerPista(a.id, { bucle: !a.bucle }, "Bucle") },
      "-",
      { t: t("izqA", `Que empiece en ${fmt(this.t)}`), al: () => this._ponerPista(a.id, { inicio: Math.round(this.t / PASO) * PASO }, "Mover pista") },
      { t: t("derA", `Que termine en ${fmt(this.t)}`), al: () => this._ponerPista(a.id, { dur: Math.max(200, Math.round(this.t / PASO) * PASO - (a.inicio || 0)) }, "Recortar pista"), off: this.t <= (a.inicio || 0) + 200 },
      { t: t("recuperar", "Sin recortes"), al: () => this._ponerPista(a.id, { desde: 0, dur: null }, "Sin recortes"), off: !a.desde && !a.dur },
      "-",
      { t: t("borrar", "Quitar la pista"), peligro: true, al: () => this.quitarPista(a.id) },
    ]);
    void dur;
  }

  _volumenPista(a, x, y) {
    const v = new Vinculos();
    const ancla = { getBoundingClientRect: () => ({ left: x, right: x, top: y, bottom: y, width: 0, height: 0 }), contains: () => false };
    popover(ancla, [fila("Volumen", control(v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => this._pista(a.id)?.vol ?? 0.9, escribir: (vol) => this._ponerPista(a.id, { vol }, "Volumen de la pista") }))]);
    v.refrescar();
  }

  quitarPista(id) {
    this.E.setPag({ audios: (this.E.pagina?.audios || []).filter((a) => a.id !== id) }, "Quitar pista");
    if (this.audioSel === id) this.audioSel = null;
  }

  /** Añade una pista (desde el panel de Audio o el botón de la línea). */
  agregarPista(asset, inicio = 0, extra = {}) {
    const p = this.E.pagina;
    if (!p) return null;
    const a = { id: uid("au"), asset, inicio: Math.max(0, Math.round(inicio)), desde: 0, dur: null, vol: 0.9, bucle: false, ...extra };
    this.E.setPag({ audios: [...(p.audios || []), a] }, "Añadir pista");
    this.audioSel = a.id;
    if (!this.abierta) this.alternar(true); else this.pintar();
    return a;
  }

  _datosPista(a) {
    return { url: this.app.bib.url(a.asset), inicio: a.inicio || 0, desde: a.desde || 0, dur: a.dur || null, vol: a.vol ?? 0.9, bucle: !!a.bucle };
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
    const p = this.E.pagina;
    if (!ids && p.audios?.length) this.app.audio?.pistas(p.audios.map((x) => this._datosPista(x)), desde);
    if (this.conMusica) {
      const g = this.E.proyecto.ajustes.musica || {}, m = p.musica || {};
      const id = m.modo === "silencio" ? null : m.modo === "propia" ? m.asset : g.asset;
      if (id) this.app.audio.pista(this.app.bib.url(id), m.modo === "propia" ? m.volumen ?? 0.8 : g.volumen ?? 0.7, desde);
    }
    const t0 = performance.now() - desde;
    const total = this._total() + 400;
    this._raf?.();
    // Un solo bucle, al ritmo de la pantalla (o al tope de Configuración).
    this._raf = alCuadro(() => {
      if (this.anim !== a || a.quieto) return false;
      this.t = performance.now() - t0;
      if (this.t >= total) { this.t = total; this.pausar(); return false; }
      this._pintarCabezal(false, true);
    });
    this._icono();
  }

  pausar() {
    this._raf?.();
    this._quitarRelojes();
    this.app.audio?.pararPista();
    this.app.audio?.pararPistas();
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
    this._raf?.();
    clearTimeout(this._fin);
    this._quitarRelojes();
    if (this.anim) { this.anim.cancelar(); this.anim = null; }
    document.body.classList.remove("animando");
  }

  /** Si cambió algo mientras está detenida en un instante, se vuelve a armar ahí mismo (en el mismo cuadro: sin destellos). */
  _refrescarAnim() {
    if (!this.anim || !this.anim.quieto) return;
    cancelAnimationFrame(this._ra);
    this._ra = requestAnimationFrame(() => { const t = this.t; this._preparar(null); if (this.anim) { this.anim.quieto = true; this.anim.ir(t); } });
  }

  parar(repintar = true) {
    this._quitarAnim();
    this.app.audio?.pararPista();
    this.app.audio?.pararPistas();
    if (repintar && this.abierta) this.pintar();
  }

  _icono() {
    const i = this.anim && !this.anim.quieto ? "pausa" : "play";
    if (this.btnPlay.dataset.i !== i) { this.btnPlay.dataset.i = i; this.btnPlay.innerHTML = ico(i); }
  }

  _pintarCabezal(desdeRegla, siguiendo) {
    const x = this.x(this.t);
    this.cabezal.style.transform = `translateX(${this.et + x}px)`;
    const txt = `${fmt(this.t)} / ${fmt(this._total())}`;
    if (this.reloj.textContent !== txt) this.reloj.textContent = txt;
    // Que el cabezal no se salga de lo que se ve al reproducir.
    const c = this.cuerpo;
    if (siguiendo && !desdeRegla) {
      const vis = c.clientWidth - this.et;
      if (x > c.scrollLeft + vis - 40 || x < c.scrollLeft) c.scrollLeft = Math.max(0, x - vis * 0.2);
    }
  }
}
