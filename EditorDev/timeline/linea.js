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
 *
 * Como un editor de vídeo de verdad:
 *   Dividir      parte lo elegido en el cabezal (dos clips seguidos, sin salto)
 *   Marcadores   banderitas en la regla: se tocan para ir, y los clips se pegan
 *   Imán         los clips se pegan al cabezal, a los bordes de los demás y a
 *                los marcadores (apagado: sólo a pasos de 50 ms)
 *   Bucle        al llegar al final vuelve a empezar
 *   Zoom         −/+ , deslizador y «Ver todo»
 *   Cada pista   ojo (esconder en el editor) y candado (bloquear)
 *   Teclado      (con la línea tocada) Espacio reproduce · ←/→ 0,1 s (Mayús 1 s)
 *                · Inicio/Fin · S divide · M marcador · +/− zoom · 0 ver todo
 *                · ↑/↓ salta al corte anterior/siguiente · Supr quita lo elegido
 *                · Ctrl/Cmd+D lo duplica · Alt+←/→ lo corre 0,1 s (Mayús 1 s)
 *   Efectos      la campanita: efectos de sonido listos (pop, latido, ¡tadá!…)
 *                que se ponen en el cabezal como una pista más
 *   Audio        cada pista se puede silenciar (sin quitarla)
 *   Fotogramas   (Fase 11) la flechita de una pista abre sus propiedades
 *                (posición, escala, giro, opacidad, desenfoque, color,
 *                brillo), cada una con sus rombos ◆: arrastrarlos los mueve
 *                en el tiempo; tocarlos abre sus valores, su ritmo (también
 *                una curva a mano), duplicar, copiar y quitar. El botón ◆+
 *                pone un fotograma en el cabezal (K). ↑/↓ saltan también
 *                entre fotogramas.
 */
import { alCuadro } from "../config/cuadros.js";
import { ocupar } from "../components/rendimiento.js";
import { el, menu, ordenable, COMPACTO, popover, control, Vinculos, fila, aviso } from "../components/ui.js";
import { abrirEfectos } from "../components/efectos-sonido.js";
import { ico } from "../components/iconos.js";
import { TIPOS, uid } from "../core/modelo.js";
import { holgura, TOQUE_LARGO, vibrar, enCuadro } from "../canvas/gestos.js";
import { hijos, parchear } from "../components/morfo.js";
import { resorte } from "../components/hoja.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { abrirCurva } from "../components/curva.js";
import { PROPS, CAMPOS, editable, aV2, claves, ventana, ponerClave, cambiarClave, moverClave, quitarClave, duplicarClave, valoresEn, claveEn } from "./fotogramas.js";

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
    this.iman = true;
    this.bucle = false;
    this.audioSel = null;
    this._relojes = [];
    this.abiertos = new Set(); // pistas con sus propiedades a la vista
    this.kf = null;            // el fotograma elegido { id, i, k }
    this._kfCopia = null;
    this._montar();
    const re = () => { if (this.abierta && !this._arrastrando) { cancelAnimationFrame(this._r); this._r = requestAnimationFrame(() => this.pintar()); } };
    this.E.on("el", ({ rutas }) => {
      if (!this.abierta || this._arrastrando) return;
      if ((rutas || []).some((r) => /^anim|^nombre|^oculto|^tiempo|^sonidos|^accion|^inicioOculto|^bloqueado|^grupo/.test(r))) { re(); this._refrescarAnim(); }
    });
    this.E.on("els", () => { re(); this._refrescarAnim(); });
    this.E.on("actual", () => { this.parar(false); this.t = 0; this.audioSel = null; this._off = this._segs?.find((s) => s.pid === this.E.paginaId)?.ini || 0; re(); });
    this.E.on("sel", () => { if (this.E.sel.length) this.audioSel = null; re(); });
    this.E.on("pagina", ({ ruta }) => { if (/^duracion|^musica|^transicion|^audios|^marcas/.test(ruta || "")) re(); });
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
      el("div.ed-tl-transporte", {}, [b("inicio", "inicio", "Al principio (Inicio)"), b("atras", "retroceder", "Atrás 0,1 s (←)"), this.btnPlay, b("adelante", "avanzar", "Adelante 0,1 s (→)"), b("final", "final", "Al final (Fin)")]),
      this.reloj, this.herr,
    ]);
    this.cRegla = el("div.ed-tl-fila.ed-tl-fregla");
    this.cFijas = el("div.ed-tl-grupo");
    this.cAudios = el("div.ed-tl-grupo.ed-tl-audios");
    this.filas = el("div.ed-tl-filas");
    this.cabezal = el("div.ed-tl-cabezal", {}, [el("i")]);
    this.lienzo = el("div.ed-tl-lienzo", {}, [this.cRegla, this.cFijas, this.cAudios, this.filas, this.cabezal]);
    this.cuerpo = el("div.ed-tl-cuerpo", {}, [this.lienzo]);
    // Ancho y desplazamiento guardados (los lee el cabezal en cada cuadro sin forzar cálculos).
    this._cw = 0; this._sl = 0;
    new ResizeObserver(() => { const w = this.cuerpo.clientWidth; if (w !== this._cw) { this._cw = w; if (this.centro && this.abierta) this._re?.(); } }).observe(this.cuerpo);
    this.cuerpo.addEventListener("scroll", () => { this._sl = this.cuerpo.scrollLeft; this._alDesplazar(); }, { passive: true });
    this.raiz.append(this.asaEl, this.cab, this.cuerpo);
    this._enlazar();
  }

  /* ── Abrir y cerrar ─────────────────────────────────────────────── */
  /** Abrir o cerrar: la línea vive en el modo profesional (Fase 38), que la abre con su transición. */
  alternar(forzar) {
    const abrir = forzar ?? !this.abierta;
    if (this.app.pro) { if (abrir) this.app.pro.abrir(); else this.app.pro.cerrar(); return; }
    this._alternarCrudo(abrir);
  }

  _alternarCrudo(forzar) {
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
    // Que la hoja se acomode encima (o vuelva a como estaba al cerrar).
    dispatchEvent(new CustomEvent("ed-hoja", { detail: this.abierta ? "abrir" : "cerrar" }));
  }

  _max() { return Math.max(MIN + 10, Math.round(innerHeight * 0.74)); }

  _alto(px, libre) {
    px = libre ? Math.round(px) : clamp(Math.round(px), MIN, this._max());
    this.altoPx = px;
    document.body.style.setProperty("--tl", Math.max(0, px) + "px");
  }

  /* ── Medidas ────────────────────────────────────────────────────── */
  _total(p = this.E.pagina) {
    let t = 0;
    for (const e of p?.els || []) {
      t = Math.max(t, RT.finEntrada(e));
      const s = e.anim?.salida;
      if (RT.finDe(e) == null && s && s.tipo !== "ninguna" && e.tiempo?.inicio) t = Math.max(t, RT.inicioDe(e));
    }
    for (const a of p?.audios || []) t = Math.max(t, a.inicio + this._durPista(a));
    return Math.max(t, (p?.duracion || 0) * 1000);
  }

  /** Lo que dura la página como clip (en el modo CapCut): cuando pasa sola, o lo que dura lo de adentro. */
  _finPag(p = this.E.pagina) { const d = (p?.duracion || 0) * 1000; return d || Math.max(3000, this._total(p)); }

  /** Fase 41 — LovEdit continuo: TODAS las páginas seguidas en un solo tiempo (como los clips de CapCut).
   *  Cada página empieza donde acaba la anterior; al desplazar o reproducir, la página cambia sola. */
  _paginasLinea() {
    const P = this.E.proyecto, l = [];
    let ini = 0;
    for (const pid of P?.orden || []) {
      const p = P.paginas[pid];
      if (!p) continue;
      const dur = this._finPag(p);
      l.push({ pid, p, ini, dur });
      ini += dur;
    }
    return l;
  }
  _segsAlDia() { this._segs = this._paginasLinea(); this._totalG = this._segs.reduce((a, x) => a + x.dur, 0); this._off = this._segs.find((x) => x.pid === this.E.paginaId)?.ini || 0; return this._segs; }

  /** Ir a un instante del librito entero (en LovEdit): si cae en otra página, se pasa a ella sola. */
  irGlobal(tg, desde) {
    const segs = this._segs?.length ? this._segs : this._segsAlDia();
    const total = this._totalG || 0;
    tg = clamp(tg, 0, total);
    const s = segs.find((x) => tg < x.ini + x.dur) || segs[segs.length - 1];
    if (!s) return this.ir(tg, desde);
    if (s.pid !== this.E.paginaId) {
      const tocando = this.anim && !this.anim.quieto;
      const P = this.E.proyecto, de = P.orden.indexOf(this.E.paginaId), a = P.orden.indexOf(s.pid);
      // Al pasar con el dedo a la página de al lado también se ve su transición (rapidito).
      const L = this.app.lienzo, vecina = desde === "scroll" && Math.abs(a - de) === 1;
      const viejo = vecina ? this._fotoHoja(L) : null;
      this.E.irPagina(s.pid);   // (lo que escucha «actual» pone el tiempo en 0: aquí se corrige)
      this._off = s.ini;
      if (viejo) {
        const llega = P.paginas[P.orden[Math.max(a, de)]], cfg = llega?.transicion?.tipo ? llega.transicion : P.ajustes.transicion;
        if (cfg?.tipo && cfg.tipo !== "ninguna" && L.pag?.nodo) {
          L.hoja.classList.add("transicionando");
          RT.transicion(viejo, L.pag.nodo, { ...cfg, dur: Math.min(450, RT.num?.(cfg.dur, 700) ?? 450) }, a < de).finally(() => { viejo.remove(); L.hoja.classList.remove("transicionando"); });
        } else viejo.remove();
      }
      if (tocando) { this._play(tg - s.ini); return; }
    }
    this.ir(tg - s.ini, desde);
  }

  _largo() { return Math.max(6000, Math.ceil((Math.max(this._total(), this.t) + 2500) / 1000) * 1000); }
  x(ms) { return (ms / 1000) * this.pps; }
  /** El ancho de verdad de la columna de nombres (cambia con el CSS del teléfono; 0 en el modo profesional). */
  get et() { return this._etw ?? ET; }
  /** Fase 39 — en el modo profesional la línea va como en CapCut: el cabezal se queda fijo al centro
   *  y lo que se mueve es la línea (desplazar = ir en el tiempo). */
  get centro() { return document.body.classList.contains("modo-pro"); }
  get pad() { return this.centro ? Math.round(Math.max(0, (this._cw || this.cuerpo.clientWidth) - this.et) / 2) : 0; }
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
    const centro = this.centro;
    // En LovEdit: las pistas de la página llegan hasta su final; la regla y lo ancho son del librito entero.
    if (centro) this._segsAlDia();
    const T = centro ? Math.max(this._finPag(), this.t + 200) : this._largo();
    this.T = T;
    const Tg = centro ? Math.ceil((this._totalG + 1000) / 1000) * 1000 : T;
    const W = this.x(Tg);
    this._icono();
    this.reloj.textContent = centro ? `${fmt(this._off + this.t)} / ${fmt(this._totalG)}` : `${fmt(this.t)} / ${fmt(this._total())}`;
    hijos(this.herr, this._herramientas());
    // El nodo del deslizador se reutiliza: su valor se pone a mano (si no se está arrastrando).
    const zm = this.herr.querySelector(".ed-tl-zoom");
    if (zm && !zm.matches(":active")) zm.value = String(this._zoomPct());
    hijos(this.cRegla, this._regla(Tg));
    this._etw = centro ? 0 : this.cRegla.firstChild?.offsetWidth || ET;
    const pad = this.pad;
    this.lienzo.style.setProperty("--tl-pad", pad + "px");
    this.lienzo.style.setProperty("--tl-off", (centro ? this.x(this._off) : 0) + "px");
    this.lienzo.style.width = this.et + W + (centro ? pad * 2 : 40) + "px";
    hijos(this.cFijas, el("div", {}, [centro ? this._filaPrincipal(p, T) : this._filaPagina(p, T), this._filaMusica(p, T)]));
    hijos(this.cAudios, el("div", {}, [...(p.audios || []).map((a) => this._filaAudio(a, T)), centro ? this._filaMasAudio() : null].filter(Boolean)));
    const els = [...p.els].reverse();
    hijos(this.filas, el("div", {}, els.length ? els.map((e) => this._fila(e, T)) : centro ? [] : [el("p.ed-vacio-txt", { dataset: { k: "vacio" }, text: "Nada en esta página todavía: lo que añadas aparece aquí con su pista." })]));
    this._pintarCabezal();
    // Lo elegido (o la pista que se acaba de abrir) se trae a la vista, sin saltos.
    const u = this.E.unico?.id || null, clave = u + (u && this.abiertos.has(u) ? ":a" : "");
    if (u && clave !== this._visto) {
      this._visto = clave;
      requestAnimationFrame(() => {
        const f = this.filas.querySelector(`.ed-tl-fila[data-k="${CSS.escape(u)}"]`);
        if (!f) return;
        const c = this.cuerpo, cr = c.getBoundingClientRect(), fr = f.getBoundingClientRect();
        const arriba = cr.top + (this.cRegla.offsetHeight || 0);
        if (fr.top < arriba || fr.bottom > cr.bottom) c.scrollBy({ top: fr.top - arriba - 4, behavior: "smooth" });
      });
    } else if (!u) this._visto = null;
    this.app.pro?.refrescar();
  }

  _herramientas() {
    const b = (ac, i, t, cls = "") => el("button.ed-tl-b" + (cls ? "." + cls : ""), { type: "button", title: t, "aria-label": t, dataset: { ac, k: ac }, html: ico(i) });
    const sel = this.E.unico;
    const dividible = sel && this.t > RT.inicioDe(sel) + 50 && (RT.finDe(sel) == null || this.t < RT.finDe(sel) - 50);
    // El zoom también con un deslizador (escala logarítmica, como en los editores).
    const zoom = el("input.ed-tl-zoom", { type: "range", min: "0", max: "100", step: "1", "aria-label": "Zoom de la línea", title: "Zoom" });
    zoom.value = String(this._zoomPct());
    return el("div", {}, [
      el("div.ed-tl-g", {}, [
        sel ? b("dividir", "tijeras", "Dividir lo elegido en el cabezal (S)", dividible ? "" : "apagado") : null,
        sel ? b("aparece", "izqA", "Que aparezca aquí (en el cabezal)") : null,
        sel ? b("sevay", "derA", "Que se vaya aquí (en el cabezal)") : null,
        sel ? b("fotograma", "fotogramaMas", "Fotograma en el cabezal: posición, escala, giro, opacidad, color… (K)") : null,
        sel && this._kfCopia ? b("pegarKf", "pegar", "Pegar el fotograma copiado en el cabezal") : null,
        b("marca", "estrella", "Poner un marcador en el cabezal (M)"),
      ].filter(Boolean)),
      el("div.ed-tl-g", {}, [
        b("iman", "iman", "Imán: pegar al cabezal, a otros clips y a los marcadores", this.iman ? "on" : ""),
        b("bucle", "bucle", "Repetir en bucle al reproducir", this.bucle ? "on" : ""),
        b("musica", "audio", "Escuchar la música de la página al reproducir", this.conMusica ? "on" : ""),
        b("sfx", "campana", "Efectos de sonido en el cabezal"),
        b("pista", "onda", "Añadir una pista de audio aquí"),
      ]),
      el("div.ed-tl-g.zoom", {}, [b("menos", "zoomMenos", "Alejar (−)"), zoom, b("mas", "zoomMas", "Acercar (+)"), b("todo", "ajustar", "Ver todo (0)")]),
      b("cerrar", "cerrar", "Cerrar LovEdit"),
    ]);
  }

  _zoomPct() { return Math.round((Math.log(this.pps / 20) / Math.log(600 / 20)) * 100); }

  /** Dividir en el cabezal: el clip sigue igual hasta ahí y una copia sigue desde ahí. */
  dividir(e = this.E.unico) {
    const E = this.E, t = Math.round(this.t / PASO) * PASO;
    if (!e) return;
    const ini = RT.inicioDe(e), fin = RT.finDe(e);
    if (t <= ini + 50 || (fin != null && t >= fin - 50)) { aviso("Pon el cabezal dentro del clip para dividirlo"); return; }
    const c = JSON.parse(JSON.stringify(e));
    c.id = uid("e");
    c.nombre = e.nombre + " (2)";
    c.tiempo = { ...(e.tiempo || {}), inicio: t, fin: fin ?? null };
    c.anim = { ...(c.anim || {}), entrada: { tipo: "ninguna" } };
    const i = E.pagina.els.findIndex((x) => x.id === e.id);
    E.transaccion("Dividir en el cabezal", () => {
      E.setEl(e.id, { "tiempo.fin": t, "anim.salida": { tipo: "ninguna" } }, "Dividir");
      E.agregarEl(c, i + 1, E.paginaId, false);
    });
    E.seleccionar([c.id]);
  }

  /** Supr: quita la pista de audio elegida, o lo elegido de la hoja. */
  borrarClip() {
    const a = this.audioSel && this._pista(this.audioSel);
    if (a) { this.quitarPista(a.id); this.audioSel = null; return; }
    if (this.E.sel.length) this.app.acciones?.borrar?.();
  }

  /** Ctrl/Cmd+D: duplica la pista elegida (justo después de ella) o lo elegido de la hoja. */
  duplicarClip() {
    const a = this.audioSel && this._pista(this.audioSel);
    if (a) { const { id, inicio, ...resto } = a; this.agregarPista(a.asset, (inicio || 0) + this._durPista(a), resto); return; }
    if (this.E.sel.length) this.app.acciones?.duplicar?.();
  }

  /** Alt+←/→: corre en el tiempo lo elegido (la pista o los elementos), sin moverlo de la hoja. */
  empujar(dt) {
    const a = this.audioSel && this._pista(this.audioSel);
    if (a) { this._ponerPista(a.id, { inicio: Math.max(0, (a.inicio || 0) + dt) }, "Mover pista", "mover" + a.id); return; }
    const E = this.E, sel = E.seleccionados;
    if (!sel.length) return;
    E.transaccion("Correr en el tiempo", () => {
      for (const e of sel) {
        const ini = RT.inicioDe(e), fin = RT.finDe(e), d = Math.max(-ini, dt);
        E.setEl(e.id, { "tiempo.inicio": ini + d, ...(fin != null ? { "tiempo.fin": fin + d } : {}) }, "Correr en el tiempo");
      }
    });
  }

  /** ↑/↓: el cabezal salta al corte anterior o siguiente (inicios y finales de clips y pistas, marcadores). */
  saltar(dir) {
    const p = this.E.pagina;
    if (!p) return;
    const puntos = new Set([0, this._total(), ...this._marcas()]);
    for (const e of p.els) { puntos.add(RT.inicioDe(e)); const f = RT.finDe(e); if (f != null) puntos.add(f); }
    for (const a of p.audios || []) { puntos.add(a.inicio || 0); puntos.add((a.inicio || 0) + this._durPista(a)); }
    // Y los fotogramas de lo elegido.
    for (const e of this.E.seleccionados) { if (!editable(e.anim?.propia)) continue; const { base, dur } = ventana(e); for (const f of e.anim.propia.fotogramas) puntos.add(Math.round(base + (+f.t || 0) * dur)); }
    const lista = [...puntos].filter(Number.isFinite).sort((x, y) => x - y);
    const dest = dir < 0 ? [...lista].reverse().find((x) => x < this.t - 20) : lista.find((x) => x > this.t + 20);
    if (dest != null) this.ir(dest);
  }

  /** Marcadores de la página (banderitas en la regla). */
  _marcas() { return (this.E.pagina?.marcas || []).slice().sort((a, b) => a - b); }
  marcar(t = this.t) {
    const ms = Math.round(t / PASO) * PASO;
    const m = this._marcas();
    if (m.some((x) => Math.abs(x - ms) < 60)) { this.E.setPag({ marcas: m.filter((x) => Math.abs(x - ms) >= 60) }, "Quitar marcador"); return; }
    this.E.setPag({ marcas: [...m, ms] }, "Marcador");
  }

  /** Que se vea toda la página (de 0 al final) en el ancho de la línea. */
  verTodo() {
    const ancho = Math.max(120, this.cuerpo.clientWidth - this.et - 40);
    this._zoom((ancho / Math.max(1500, (this.centro ? this._totalG || this._total() : this._total()) + 600)) * 1000);
    if (this.centro) this.irGlobal(0); else this.cuerpo.scrollLeft = 0;
  }

  _regla(T) {
    const regla = el("div.ed-tl-regla", { dataset: { k: "regla" } });
    const paso = this.pps >= 320 ? 100 : this.pps >= 160 ? 250 : this.pps >= 80 ? 500 : 1000;
    const cada = this.pps < 45 ? 2000 : 1000; // con la línea muy lejos, un número cada 2 s
    for (let s = 0; s <= T; s += paso) regla.append(el("i" + (s % cada ? ".m" : ""), { style: { left: this.x(s) + "px" }, text: s % cada ? "" : fmt(s).replace(/\.0$/, "") }));
    for (const m of this._marcas()) regla.append(el("b.ed-tl-marcador", { dataset: { marca: String(m) }, style: { left: this.x(m) + "px" }, title: `Marcador en ${fmt(m)} · tócalo para ir · mantén para quitarlo` }));
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

  /* ── Fase 39: la pista principal como en CapCut ─────────────────────
     La página es el clip grande (con su miniatura repetida, como los cuadros de un vídeo). Antes del
     0 se asoma la página anterior y después del final la siguiente; entre ellas, el cuadrito de la
     transición (tócalo para elegirla) y al final el «+» para añadir otra página. */
  _filaPrincipal(p, T) {
    const P = this.E.proyecto;
    const segs = this._segs || this._segsAlDia();
    const pista = el("div.ed-tl-pista.principal");
    const tr = (pag) => { const t = pag?.transicion?.tipo ? pag.transicion : P.ajustes.transicion; return t?.tipo && t.tipo !== "ninguna" ? t : null; };
    for (const [k, s0] of segs.entries()) {
      const pag = s0.p, x0 = this.x(s0.ini), ancho = Math.max(24, this.x(s0.dur)), actual = pag.id === p.id;
      // Cada página es un clip con sus cuadritos (tocar uno lleva a su principio); la de ahora, resaltada.
      pista.append(el("button.ed-tl-pclip" + (actual ? ".on" : ""), { type: "button", dataset: { k: "pclip:" + pag.id, irpag: pag.id }, style: { left: x0 + "px", width: ancho + "px" }, "aria-label": `Ir a «${pag.nombre}»` }, [
        this._miniPag(pag, Math.max(1, Math.min(24, Math.ceil(ancho / 40)))),
        el("span.ed-tl-pnom", { text: `${k + 1} · ${pag.nombre} · ${(s0.dur / 1000).toFixed(1)} s` }),
      ]));
      // Entre una página y la siguiente: el cuadrito de su transición.
      if (k > 0) {
        const t = tr(pag);
        pista.append(el("button.ed-tl-tcuad" + (t ? ".on" : ""), { type: "button", dataset: { k: "tr:" + pag.id, trans: pag.id }, style: { left: x0 + "px" }, title: `Transición al llegar a «${pag.nombre}»: ${t ? RT.TRANS?.[t.tipo]?.n || t.tipo : "ninguna"}`, "aria-label": "Elegir la transición", html: ico(t ? "transiciones" : "mas") }));
      }
      if (actual) {
        const d = (pag.duracion || 0) * 1000;
        pista.append(el("div.ed-tl-pfin" + (d ? "" : ".nada"), { dataset: { arr: "pagina-fin", k: "pfin" }, style: { transform: `translateX(${x0 + this.x(s0.dur)}px)` }, title: d ? `Pasa sola a los ${d / 1000} s · arrastra para cambiarlo` : "Pasa al tocar · arrastra para que pase sola" }, [el("i"), el("span", { text: d ? "pasa sola" : "al tocar" })]));
      }
    }
    const fin = this.x(this._totalG || 0);
    pista.append(el("button.ed-tl-maspag", { type: "button", dataset: { k: "mas", maspag: "1" }, style: { left: fin + 14 + "px" }, title: "Añadir una página al final", "aria-label": "Añadir página", html: ico("mas") }));
    return el("div.ed-tl-fila.ed-tl-fprin", { dataset: { k: "prin" } }, [el("div.ed-tl-et", {}, [el("b", { html: ico("paginas") }), el("span", { text: "Páginas" })]), pista]);
  }

  /** «+ Añadir audio» (como en CapCut): una pista nueva en el cabezal. */
  _filaMasAudio() {
    return el("div.ed-tl-fila.ed-tl-fmas", { dataset: { k: "masaudio" } }, [el("div.ed-tl-et"), el("div.ed-tl-pista", {}, [
      el("button.ed-tl-masaudio", { type: "button", dataset: { masaudio: "1" } }, [el("i", { html: ico("mas") }), el("span", { text: "Añadir audio" })]),
    ])]);
  }

  /** Cuadritos de una página (una miniatura de verdad, copiada `n` veces). Se rehace sólo si la página cambió. */
  _miniPag(p, n) {
    const { ancho: W, alto: H } = this.E.proyecto.ajustes;
    const tw = 40, th = 46, k = Math.max(tw / W, th / H);
    this._minis = this._minis || new Map();
    let m = this._minis.get(p.id);
    if (!m || (m.p !== p && performance.now() - m.t > 900)) {
      m?.pag?.destruir?.();
      let pag = null, nodo;
      try {
        pag = new RT.Pagina(p, { modo: "mini", url: (id) => this.app.bib.url(id), ruta: (r) => rutaAUrl(r) }, W, H);
        nodo = pag.nodo;
      } catch (e) { nodo = el("div"); }
      nodo.style.transform = `translate(${(tw - W * k) / 2}px, ${(th - H * k) / 2}px) scale(${k})`;
      nodo.style.transformOrigin = "0 0";
      m = { p, pag, nodo, t: performance.now(), v: (m?.v || 0) + 1 };
      this._minis.set(p.id, m);
      // Las de páginas que ya no existen se sueltan.
      for (const [id, x] of this._minis) if (!this.E.proyecto.paginas[id]) { x.pag?.destruir?.(); this._minis.delete(id); }
    } else if (m.p !== p) { clearTimeout(this._tMini); this._tMini = setTimeout(() => this._re?.(), 950); }
    const cuadros = el("span.ed-tl-cuadros", { dataset: { k: `${p.id}:${m.v}:${n}` } });
    for (let i = 0; i < n; i++) {
      const c = i ? m.nodo.cloneNode(true) : m.nodo;
      if (i) c.querySelectorAll("video, iframe, audio, canvas, script").forEach((x) => x.remove());
      cuadros.append(el("i.ed-tl-cuadro", {}, [c]));
    }
    return cuadros;
  }

  /** Elegir la transición al llegar a una página (el cuadrito entre dos páginas). */
  _elegirTrans(pid, ancla) {
    const P = this.E.proyecto, pag = P.paginas[pid];
    if (!pag) return;
    const actual = pag.transicion?.tipo || "";
    // Al elegirla, LovEdit la enseña: reproduce desde un poquito antes de esa página.
    const verla = () => setTimeout(() => {
      if (!this.centro) return;
      const seg = this._segsAlDia().find((x) => x.pid === pid);
      if (!seg || !seg.ini) return;
      if (this.anim && !this.anim.quieto) this.pausar();
      this.irGlobal(Math.max(0, seg.ini - 1200));
      this._play(this.t);
    }, 120);
    const poner = (tipo) => { this.E.setPag({ transicion: tipo ? { tipo, dur: pag.transicion?.dur || 700 } : { tipo: "ninguna" } }, "Transición", null, pid); if (tipo) verla(); };
    const tipos = Object.entries(RT.TRANS || {}).filter(([k]) => k !== "ninguna");
    menu(ancla, [
      { t: `${ico("cerrar")}<span>Sin transición</span>`, al: () => poner(""), clase: actual === "ninguna" ? "on" : "" },
      { t: `${ico("ajustes")}<span>La del librito</span>`, al: () => this.E.setPag({ transicion: null }, "Transición", null, pid), clase: actual ? "" : "on" },
      "-",
      ...tipos.map(([k, v]) => ({ t: `${ico("transiciones")}<span>${v.n || k}</span>`, al: () => poner(k), clase: actual === k ? "on" : "" })),
    ]);
  }

  /** Fase 39 — cortar la página en el cabezal: lo de antes se queda y lo de después pasa a una página
   *  nueva justo detrás (como dividir un clip). La primera pasa sola a la segunda en ese instante. */
  dividirPagina() {
    const E = this.E, p = E.pagina;
    if (!p) return;
    const t = Math.round(this.t / PASO) * PASO, total = Math.max(this._total(), (p.duracion || 0) * 1000);
    if (t < 200 || t > total - 200) { aviso("Pon el cabezal a la mitad de la página para cortarla en dos"); return; }
    const q = JSON.parse(JSON.stringify(p));
    q.id = uid("p");
    q.nombre = p.nombre.replace(/ \(\d+\)$/, "") + " (2)";
    q.transicion = { tipo: "ninguna" }; // sigue sin brinco; el cuadrito entre las dos la cambia
    q.duracion = p.duracion ? Math.max(0, Math.round((p.duracion * 1000 - t) / 100) / 10) : 0;
    const mapa = {}, quedan = [];
    q.els = [];
    for (const e of p.els) {
      const ini = RT.inicioDe(e), fin = RT.finDe(e);
      if (ini >= t) quedan.push(e.id); // empieza después del corte: sólo en la segunda
      if (fin != null && fin <= t) continue; // ya se fue: sólo en la primera
      const c = JSON.parse(JSON.stringify(e));
      mapa[e.id] = c.id = uid("e");
      const ni = Math.max(0, ini - t), nf = fin != null ? fin - t : null;
      if (c.tiempo || ni || nf != null) c.tiempo = { ...(c.tiempo || {}), inicio: ni, fin: nf };
      if (ini < t && c.anim?.entrada) c.anim.entrada = { tipo: "ninguna" }; // ya estaba a la vista
      q.els.push(c);
    }
    for (const c of q.els) {
      if (c.origen?.de && mapa[c.origen.de]) c.origen.de = mapa[c.origen.de];
      if (c.accion?.destino && mapa[c.accion.destino]) c.accion.destino = mapa[c.accion.destino];
    }
    const audios = [];
    q.audios = [];
    for (const a of p.audios || []) {
      const s0 = a.inicio || 0, d = this._durPista(a);
      if (s0 < t) audios.push(s0 + d > t ? { ...a, dur: t - s0 } : a);
      if (s0 + d <= t) continue;
      q.audios.push(s0 >= t ? { ...a, id: uid("au"), inicio: s0 - t } : { ...a, id: uid("au"), inicio: 0, desde: (a.desde || 0) + (t - s0), dur: d - (t - s0) });
    }
    q.marcas = (p.marcas || []).filter((m) => m > t).map((m) => m - t);
    const i = E.proyecto.orden.indexOf(p.id);
    E.transaccion("Cortar la página en dos", () => {
      E.setPag({ duracion: t / 1000, audios, marcas: (p.marcas || []).filter((m) => m < t) }, "Cortar la página");
      if (quedan.length) E.quitarEls(quedan);
      E.agregarPagina(q, i + 1);
    });
    aviso("Listo: la página quedó en dos · toca el cuadrito entre ellas para ponerle transición");
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
    const clip = el("div.ed-tl-clip.ed-tl-aclip" + (sel ? ".on" : "") + (a.silencio ? ".mudo" : ""), {
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
      el("button.ed-tl-pp" + (a.silencio ? ".on" : ""), { type: "button", dataset: { mudo: a.id }, html: ico(a.silencio ? "silencio" : "volumen"), title: a.silencio ? "Que vuelva a sonar" : "Silenciar esta pista (sin quitarla)", "aria-label": "Silenciar o no" }),
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
    if (this.centro) {
      clip.classList.add("t-" + e.tipo);
      clip.append(el("span.ed-tl-cnom", { html: ico(TIPOS[e.tipo]?.ico || "elementos") + `<b>${(e.nombre || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])}</b>` }));
      const as = e.imagen?.asset || e.album?.fotos?.[0]?.asset || e.carrusel?.fotos?.[0]?.asset || null;
      const src = as && this.app.bib.url(as);
      if (src) clip.style.setProperty("--tl-img", `url("${String(src).replace(/"/g, "%22")}")`);
    }
    const pista = el("div.ed-tl-pista", {}, [clip]);
    const conKf = editable(pr);
    const abierta = conKf && this.abiertos.has(e.id) && !this.centro;
    const marcas = [e.accion?.tipo ? el("i", { title: "Hace algo al tocarlo", html: ico("toque") }) : null, so?.tocar ? el("i", { title: "Suena al tocarlo", html: ico("sonido") }) : null, e.inicioOculto ? el("i", { title: "Empieza escondido", html: ico("ojoNo") }) : null].filter(Boolean);
    const et = el("div.ed-tl-et" + (sel ? ".on" : ""), { dataset: { id: e.id } }, [
      el("button.ed-asa", { type: "button", html: ico("agarre"), title: "Arrastra para cambiar la capa", "aria-label": "Cambiar la capa" }),
      conKf ? el("button.ed-tl-abrir" + (abierta ? ".on" : ""), { type: "button", dataset: { abrir: e.id }, html: ico("derecha"), title: abierta ? "Ocultar sus fotogramas" : "Ver sus fotogramas por propiedad", "aria-label": abierta ? "Ocultar sus fotogramas" : "Ver sus fotogramas", "aria-expanded": String(abierta) }) : null,
      el("b", { html: ico(TIPOS[e.tipo]?.ico || "elementos") }),
      el("span", { text: e.nombre }),
      marcas.length ? el("em", {}, marcas) : null,
      el("button.ed-tl-pp" + (e.oculto ? ".on" : ""), { type: "button", dataset: { pp: "oculto", id: e.id }, html: ico(e.oculto ? "ojoNo" : "ojo"), title: e.oculto ? "Mostrar en el editor" : "Esconder en el editor", "aria-label": "Esconder o mostrar" }),
      el("button.ed-tl-pp" + (e.bloqueado ? ".on" : ""), { type: "button", dataset: { pp: "bloqueado", id: e.id }, html: ico(e.bloqueado ? "candado" : "abierto"), title: e.bloqueado ? "Desbloquear" : "Bloquear (que no se mueva)", "aria-label": "Bloquear o desbloquear" }),
    ].filter(Boolean));
    return el("div.ed-tl-fila" + (sel ? ".on" : "") + (e.oculto ? ".oculto" : "") + (abierta ? ".abierta" : ""), { dataset: { id: e.id, k: e.id } }, [et, pista, abierta ? this._propiedades(e) : null].filter(Boolean));
  }

  /** Las pistas de cada propiedad de su animación propia, con sus fotogramas ◆. */
  _propiedades(e) {
    const pr = e.anim.propia, ks = claves(pr), { base, dur } = ventana(e);
    const def = pr.facil || "suave";
    const lanes = Object.keys(PROPS).filter((k) => ks[k]).map((k) => {
      const l = ks[k];
      const hijosL = [el("i.ed-tl-kfv", { style: { left: this.x(base) + "px", width: Math.max(2, this.x(dur)) + "px" } })];
      for (let j = 0; j < l.length - 1; j++) {
        const a = l[j], b = l[j + 1], propio = a.facil && a.facil !== def;
        hijosL.push(el("i.ed-tl-kfl" + (propio ? ".ritmo" : ""), { style: { left: this.x(base + a.t * dur) + "px", width: Math.max(0, this.x((b.t - a.t) * dur)) + "px" }, title: propio ? "Con su propio ritmo" : "" }));
      }
      for (const c of l) {
        const on = this.kf && this.kf.id === e.id && this.kf.i === c.i && this.kf.k === k;
        const ms = base + c.t * dur;
        hijosL.push(el("button.ed-tl-kf" + (on ? ".on" : ""), { type: "button", dataset: { kf: k, i: c.i, id: e.id, k: "kf" + k + c.i }, style: { left: this.x(ms) + "px" }, title: `${PROPS[k].n} en ${fmt(ms)} · arrastra para moverlo, toca para cambiarlo`, "aria-label": `Fotograma de ${PROPS[k].n} en ${fmt(ms)}` }));
      }
      return el("div.ed-tl-prop", { dataset: { k: "p:" + k } }, [el("div.ed-tl-et.chica", { dataset: { kfet: e.id } }, [el("i", { html: ico("fotograma") }), el("span", { text: PROPS[k].n })]), el("div.ed-tl-pista", {}, hijosL)]);
    });
    return el("div.ed-tl-props", { dataset: { k: "props" } }, lanes);
  }

  /* ── Fotogramas ─────────────────────────────────────────────────── */
  /** Un fotograma: con el dedo/ratón se arrastra en el tiempo; un toque abre sus valores. */
  _tocarKf(ev, n) {
    const E = this.E, id = n.dataset.id, k = n.dataset.kf, i = +n.dataset.i;
    const e = E.el(id);
    if (!e || !editable(e.anim?.propia)) return;
    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();
    const pid = ev.pointerId, x0 = ev.clientX, y0 = ev.clientY;
    const blanco = this.cuerpo;
    try { blanco.setPointerCapture(pid); } catch (x) { /* nada */ }
    const elegido = E.sel.includes(id);
    const { base, dur } = ventana(e);
    const pr0 = aV2(e.anim.propia);
    const t0 = pr0.fotogramas[i]?.t ?? 0;
    // Se pega al cabezal, a los marcadores y a los demás fotogramas.
    const imanes = [this.t, ...this._marcas(), ...pr0.fotogramas.filter((_, j) => j !== i).map((f) => base + f.t * dur)];
    const umbral = this.iman ? this.ms(9) : -1;
    let fin = null, idx = i;
    const mover = enCuadro((m) => {
      if (m.pointerId !== pid) return;
      if (!fin) {
        if (Math.hypot(m.clientX - x0, m.clientY - y0) < holgura(m)) return;
        if (!elegido && m.pointerType !== "mouse") return; // con el dedo, primero se elige
        fin = E.gesto("Mover fotograma");
        this._arrastrando = true;
      }
      let ms = base + t0 * dur + this.ms(m.clientX - x0);
      let mejor = null;
      for (const t of imanes) if (Math.abs(t - ms) <= umbral && (mejor == null || Math.abs(t - ms) < Math.abs(mejor - ms))) mejor = t;
      ms = mejor != null ? mejor : Math.round(ms / 10) * 10;
      const r = moverClave(pr0, i, k, (ms - base) / dur);
      idx = r.i;
      E.setEl(id, { "anim.propia": r.pr }, "Mover fotograma");
      this.kf = { id, i: idx, k };
      this._repintarFila(e);
    });
    const soltar = (u) => {
      if (u.pointerId !== pid) return;
      blanco.removeEventListener("pointermove", mover);
      blanco.removeEventListener("pointerup", soltar);
      blanco.removeEventListener("pointercancel", soltar);
      mover.ya();
      this._arrastrando = false;
      if (fin) { fin(); this.kf = { id, i: idx, k }; this.pintar(); this._refrescarAnim(); return; }
      if (u.type === "pointercancel") return;
      if (!elegido) E.seleccionar([id]);
      this.kf = { id, i, k };
      this.pintar();
      const nodo = this.filas.querySelector(`.ed-tl-kf[data-k="kf${k}${i}"]`) || n;
      this._popKf(id, i, k, nodo);
    };
    blanco.addEventListener("pointermove", mover);
    blanco.addEventListener("pointerup", soltar);
    blanco.addEventListener("pointercancel", soltar);
  }

  /** Los valores de un fotograma, su ritmo hasta el siguiente y sus acciones. */
  _popKf(id, i0, k, ancla) {
    const E = this.E;
    let i = i0;
    const v = new Vinculos();
    const e0 = E.el(id);
    if (!e0) return;
    const { base, dur } = ventana(e0);
    const fila_ = () => E.el(id)?.anim?.propia?.fotogramas?.[i];
    const escribir = (cambios, nombre = "Fotograma") => {
      const e = E.el(id);
      if (!e) return;
      const r = cambiarClave(e.anim.propia, i, k, cambios);
      i = r.i;
      this.kf = { id, i, k };
      E.setEl(id, { "anim.propia": r.pr }, nombre, "kf" + id + i + k);
    };
    const PASOS = { x: 1, y: 1, curva: 2, escala: 0.05, rot: 1, opacidad: 0.05, desenfoque: 0.5, tono: 5, brillo: 0.05 };
    const NOMBRES = { x: "X", y: "Y", curva: "Curva del camino", escala: "Escala", rot: "Giro", opacidad: "Opacidad", desenfoque: "Desenfoque", tono: "Tono", brillo: "Brillo" };
    const campos = CAMPOS[k].map((c) => fila(NOMBRES[c], control(v, {
      tipo: "numero", paso: PASOS[c], min: c === "opacidad" ? 0 : undefined, max: c === "opacidad" ? 1 : undefined,
      unidad: c === "rot" || c === "tono" ? "°" : c === "x" || c === "y" || c === "curva" || c === "desenfoque" ? "px" : "",
      leer: () => fila_()?.[c] ?? (c === "escala" || c === "brillo" || c === "opacidad" ? 1 : 0),
      escribir: (x) => escribir({ [c]: x }),
    })));
    const FACILES = Object.entries(RT.FACIL).map(([kk, x]) => [kk, x.n]);
    const ritmo = control(v, { tipo: "select", opciones: [["", "Como toda la animación"], ...FACILES], leer: () => fila_()?.facil || "", escribir: (x) => escribir({ facil: x || null }, "Ritmo del fotograma") });
    const bc = el("button.ed-btn.chico.ico", { type: "button", html: ico("curva"), title: "Dibujar la curva a mano", "aria-label": "Dibujar la curva a mano" });
    bc.addEventListener("click", () => abrirCurva(bc, fila_()?.facil || E.el(id)?.anim?.propia?.facil || "suave", (x) => { escribir({ facil: x }, "Curva del fotograma"); this.pintar(); }, `Ritmo de ${PROPS[k].n.toLowerCase()} hasta el siguiente`));
    const t = () => base + (fila_()?.t ?? 0) * dur;
    const acc = (txt, icono, fn, cls = "") => el("button.ed-btn.chico" + (cls ? "." + cls : ""), { type: "button", html: `${ico(icono)}<span>${txt}</span>`, onClick: fn });
    let pop = null;
    const cerrar = () => pop?.cerrar?.();
    pop = popover(ancla, [
      el("div.ed-kf-cab", {}, [el("b", { html: `${ico("fotograma")}<span>${PROPS[k].n}</span>` }), el("small", { text: "en " + fmt(t()) })]),
      ...campos,
      fila("Ritmo hasta el siguiente", el("div.ed-ritmo", {}, [ritmo, bc])),
      el("div.ed-botonera", {}, [
        acc("Ir aquí", "play", () => this.ir(t())),
        acc("Duplicar", "duplicar", () => { const e = E.el(id); if (!e) return; const du = Math.max(100, dur * 0.12) / dur; const r = duplicarClave(e.anim.propia, i, k, (fila_()?.t ?? 0) + du); E.setEl(id, { "anim.propia": r.pr }, "Duplicar fotograma"); this.kf = { id, i: r.i, k }; cerrar(); }),
        acc("Copiar", "copiar", () => { const f = fila_(); if (!f) return; const vals = {}; for (const c of CAMPOS[k]) if (f[c] != null) vals[c] = f[c]; this._kfCopia = { k, vals, facil: f.facil || null }; aviso("Fotograma copiado: ponlo con «Pegar» en el cabezal", 2200); this.pintar(); cerrar(); }),
        acc("Quitar", "borrar", () => { this.kf = { id, i, k }; this.quitarFotograma(); cerrar(); }, "peligro"),
      ]),
    ], { clase: "ed-pop-kf" });
    v.refrescar();
    const al = () => v.refrescar();
    E.on("el", al);
    const obs = new MutationObserver(() => { if (!pop.nodo.isConnected) { E.off?.("el", al); obs.disconnect(); } });
    obs.observe(document.body, { childList: true });
  }

  /** ◆+ : un fotograma en el cabezal para lo elegido (crea la animación propia si no tiene). */
  fotogramaAqui(ancla) {
    const E = this.E, e0 = E.unico;
    if (!e0) { aviso("Elige primero algo de la hoja"); return; }
    ancla = ancla || this.herr.querySelector('[data-ac="fotograma"]') || this.cab;
    const id = e0.id, v = new Vinculos();
    const ms = () => Math.round(this.t / 10) * 10;
    const val = (c) => valoresEn(E.el(id), ms())[c];
    const poner = (k, cambios) => {
      const e = E.el(id);
      if (!e) return;
      const actual = valoresEn(e, ms());
      const vals = {};
      for (const c of CAMPOS[k]) vals[c] = cambios[c] ?? (c === "curva" ? undefined : actual[c]);
      const nueva = ponerClave(e, k, ms(), vals);
      this.abiertos.add(id);
      E.setEl(id, { "anim.propia": nueva }, "Fotograma", "kfa" + id + k + ms());
      this.app.sonidos?.sonar("fotograma");
    };
    const NOMBRES = { x: "X", y: "Y", escala: "Escala", rot: "Giro", opacidad: "Opacidad", desenfoque: "Desenfoque", tono: "Tono", brillo: "Brillo" };
    const PASOS = { x: 1, y: 1, escala: 0.05, rot: 1, opacidad: 0.05, desenfoque: 0.5, tono: 5, brillo: 0.05 };
    const filas = Object.keys(PROPS).map((k) => {
      const hay = () => claveEn(E.el(id), k, ms()) >= 0;
      const rombo = el("button.ed-kf-rombo", { type: "button", html: ico("fotograma"), title: "Poner o quitar el fotograma de " + PROPS[k].n.toLowerCase() + " aquí" });
      rombo.addEventListener("click", () => {
        const e = E.el(id), j = claveEn(e, k, ms());
        if (j >= 0) E.setEl(id, { "anim.propia": quitarClave(e.anim.propia, j, k) }, "Quitar fotograma");
        else poner(k, {});
      });
      v.add(() => rombo.classList.toggle("on", hay()));
      const ins = CAMPOS[k].filter((c) => c !== "curva").map((c) => el("label.ed-kf-campo", {}, [el("small", { text: NOMBRES[c] }), control(v, { tipo: "numero", paso: PASOS[c], leer: () => +(+val(c)).toFixed(3), escribir: (x) => poner(k, { [c]: x }) })]));
      return el("div.ed-kf-fila", {}, [rombo, el("b", { text: PROPS[k].n }), el("div.ed-kf-ins", {}, ins)]);
    });
    popover(ancla, [
      el("div.ed-kf-cab", {}, [el("b", { html: `${ico("fotogramaMas")}<span>Fotograma en ${fmt(ms())}</span>` }), el("small", { text: "«" + e0.nombre + "»" })]),
      el("p.ed-ayuda", { text: "Cambia un valor y queda un ◆ en el cabezal para esa propiedad. Mueve el cabezal y cambia otro: la animación va de uno a otro con su ritmo." }),
      ...filas,
      el("div.ed-botonera", {}, [el("button.ed-btn.chico", { type: "button", html: `${ico("fotograma")}<span>Fijar todo aquí</span>`, onClick: () => E.transaccion("Fotograma de todo", () => { for (const k of Object.keys(PROPS)) poner(k, {}); }) })]),
    ], { clase: "ed-pop-kf" });
    v.refrescar();
    const al = () => v.refrescar();
    E.on("el", al);
    setTimeout(() => { const obs = new MutationObserver(() => { if (!document.querySelector(".ed-pop-kf")) { E.off?.("el", al); obs.disconnect(); } }); obs.observe(document.body, { childList: true }); }, 0);
  }

  pegarFotograma() {
    const E = this.E, e = E.unico, c = this._kfCopia;
    if (!e || !c) return;
    const nueva = ponerClave(e, c.k, Math.round(this.t / 10) * 10, c.vals);
    if (c.facil) { const j = nueva.fotogramas.findIndex((f) => RT.tieneProp(f, c.k) && Math.abs(ventana({ ...e, anim: { ...e.anim, propia: nueva } }).base + f.t * nueva.dur - this.t) < 15); if (j >= 0) nueva.fotogramas[j].facil = c.facil; }
    this.abiertos.add(e.id);
    E.setEl(e.id, { "anim.propia": nueva }, "Pegar fotograma");
    this.app.sonidos?.sonar("fotograma");
  }

  quitarFotograma() {
    const E = this.E, kf = this.kf;
    const e = kf && E.el(kf.id);
    if (!e || !editable(e.anim?.propia)) { this.kf = null; return; }
    E.setEl(e.id, { "anim.propia": quitarClave(e.anim.propia, kf.i, kf.k) }, "Quitar fotograma");
    this.kf = null;
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
        case "atras": this.ir(this.t - 100); break;
        case "play": this.alternarPlay(); break;
        case "adelante": this.ir(this.t + 100); break;
        case "dividir": this.dividir(sel); break;
        case "marca": this.marcar(); break;
        case "iman": this.iman = !this.iman; this.pintar(); break;
        case "bucle": this.bucle = !this.bucle; this.pintar(); break;
        case "todo": this.verTodo(); break;
        case "sfx": abrirEfectos(this.app, b); break;
        case "final": this.ir(this._total()); break;
        case "aparece": if (sel) this._ponerTiempo(sel, "inicio"); break;
        case "sevay": if (sel) this._ponerTiempo(sel, "fin"); break;
        case "pista": this.app.paneles?.agregarPista?.(Math.round(this.t / PASO) * PASO); break;
        case "fotograma": this.fotogramaAqui(b); break;
        case "pegarKf": this.pegarFotograma(); break;
        case "musica": this.conMusica = !this.conMusica; this.pintar(); break;
        case "menos": this._zoom(this.pps / 1.4); break;
        case "mas": this._zoom(this.pps * 1.4); break;
        case "cerrar": this.alternar(false); break;
      }
    });
    this.cab.addEventListener("input", (ev) => { if (ev.target.matches(".ed-tl-zoom")) this._zoom(20 * Math.pow(600 / 20, +ev.target.value / 100), null, true); });
    // Atajos de teclado, sólo mientras la línea tiene el foco (se tocó).
    addEventListener("pointerdown", (ev) => { this._foco = this.abierta && this.raiz.contains(ev.target); }, true);
    addEventListener("keydown", (ev) => {
      if (!this.abierta || !this._foco) return;
      const af = document.activeElement;
      if (af?.isContentEditable || (/INPUT|TEXTAREA|SELECT/.test(af?.tagName || "") && af.type !== "range")) return;
      const k = ev.key, paso = ev.shiftKey ? 1000 : 100, mod = ev.ctrlKey || ev.metaKey;
      let hacer = null;
      if (mod && !ev.altKey) hacer = /^d$/i.test(k) ? () => this.duplicarClip() : null;
      else if (ev.altKey && !mod) hacer = k === "ArrowLeft" ? () => this.empujar(-paso) : k === "ArrowRight" ? () => this.empujar(paso) : null;
      else if (!mod && !ev.altKey) hacer = { " ": () => this.alternarPlay(), ArrowLeft: () => this.ir(this.t - paso), ArrowRight: () => this.ir(this.t + paso), ArrowUp: () => this.saltar(-1), ArrowDown: () => this.saltar(1), Home: () => this.ir(0), End: () => this.ir(this._total()), Delete: () => (this.kf ? this.quitarFotograma() : this.borrarClip()), Backspace: () => (this.kf ? this.quitarFotograma() : this.borrarClip()), k: () => this.fotogramaAqui(), K: () => this.fotogramaAqui(), s: () => this.dividir(), S: () => this.dividir(), m: () => this.marcar(), M: () => this.marcar(), "+": () => this._zoom(this.pps * 1.4), "=": () => this._zoom(this.pps * 1.4), "-": () => this._zoom(this.pps / 1.4), 0: () => this.verTodo() }[k];
      if (!hacer) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      hacer();
    }, true);
    // El asa de arriba: el alto sigue al dedo.
    this.asaEl.addEventListener("pointerdown", (ev) => this._arrastrarAlto(ev));
    // Tocar, arrastrar, agarrar.
    this.cuerpo.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      if (this._dedo(ev)) return;
      if (ev.target.closest(".ed-asa")) return; // cambiar la capa (ordenable)
      if (ev.target.closest("[data-marca]")) {
        // Mantener un marcador lo quita.
        const m = +ev.target.closest("[data-marca]").dataset.marca;
        clearTimeout(this._tMarca);
        this._tMarca = setTimeout(() => { vibrar(8); this.marcar(m); }, TOQUE_LARGO);
        const fuera = () => { clearTimeout(this._tMarca); removeEventListener("pointerup", fuera); };
        addEventListener("pointerup", fuera);
        return;
      }
      if (ev.target.closest(".ed-tl-pp, [data-abrir], [data-irpag], [data-trans], [data-maspag], [data-masaudio]")) return;
      const kf = ev.target.closest(".ed-tl-kf");
      if (kf) { this._tocarKf(ev, kf); return; }
      if (ev.target.closest(".ed-tl-cabezal, .ed-tl-regla, .ed-tl-fregla")) { this._buscar(ev); return; }
      const n = ev.target.closest("[data-arr]");
      if (n) this._tocarArr(ev, n);
    });
    // Mientras se tiene «agarrado» un clip, el dedo no desplaza la línea.
    this.cuerpo.addEventListener("touchmove", (ev) => { if (this._agarrado) ev.preventDefault(); }, { passive: false });
    // Elegir tocando el nombre.
    this.cuerpo.addEventListener("click", (ev) => {
      if (ev.target.closest(".ed-asa")) return;
      // Fase 39: la pista principal (páginas vecinas, transiciones, «+») y «Añadir audio».
      const ip = ev.target.closest("[data-irpag]");
      if (ip) { this.E.irPagina(ip.dataset.irpag); return; }
      const tq = ev.target.closest("[data-trans]");
      if (tq) { this._elegirTrans(tq.dataset.trans, tq); return; }
      if (ev.target.closest("[data-maspag]")) { this.app.acciones?.nuevaPagina?.(undefined, this.E.proyecto.orden.length); return; }
      if (ev.target.closest("[data-masaudio]")) { this.app.paneles?.agregarPista?.(Math.round(this.t / PASO) * PASO); return; }
      // Ojo y candado de cada pista.
      const mu = ev.target.closest("[data-mudo]");
      if (mu) { const a = this._pista(mu.dataset.mudo); if (a) this._ponerPista(a.id, { silencio: !a.silencio }, a.silencio ? "Pista con sonido" : "Silenciar pista"); return; }
      const ab = ev.target.closest("[data-abrir]");
      if (ab) { const id = ab.dataset.abrir; if (this.abiertos.has(id)) this.abiertos.delete(id); else this.abiertos.add(id); this.pintar(); return; }
      const ke = ev.target.closest("[data-kfet]");
      if (ke) { if (!this.E.sel.includes(ke.dataset.kfet)) this.E.seleccionar([ke.dataset.kfet]); return; }
      const pp = ev.target.closest("[data-pp]");
      if (pp) { const x = this.E.el(pp.dataset.id); if (x) this.E.setEl(x.id, { [pp.dataset.pp]: !x[pp.dataset.pp] }, pp.dataset.pp === "oculto" ? (x.oculto ? "Mostrar" : "Esconder") : (x.bloqueado ? "Desbloquear" : "Bloquear")); return; }
      // Marcadores: tocar = ir.
      const mk = ev.target.closest("[data-marca]");
      if (mk) { this.ir(+mk.dataset.marca); return; }
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
    const ir = enCuadro((m) => (this.centro ? this.irGlobal(this.ms(m.clientX - rr.left), true) : this.ir(this.ms(m.clientX - rr.left), true)));
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
    const pintar = this.centro ? () => { this.pintar(); this._irScroll(this.x((this._off || 0) + this.t)); } : () => { this.pintar(); this.cuerpo.scrollLeft = Math.max(0, this.x(msAncla) - ancla); };
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
      dispatchEvent(new CustomEvent("ed-hoja-quieta"));
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
    const dur0 = (p.duracion || 0) * 1000 || (this.centro ? this._finPag() : this.T - 1000);
    const imanes = [0, this.t];
    for (const o of p.els) if (o.id !== id) { imanes.push(RT.inicioDe(o)); const f = RT.finDe(o); if (f != null) imanes.push(f); }
    for (const o of p.audios || []) if (o.id !== id) { imanes.push(o.inicio || 0); imanes.push((o.inicio || 0) + this._durPista(o)); }
    imanes.push(...this._marcas());
    const umbral = this.iman ? this.ms(9) : -1;
    const pegar = (v) => { let m = null; for (const t of imanes) if (Math.abs(t - v) <= umbral && (m == null || Math.abs(t - v) < Math.abs(m - v))) m = t; return m != null ? m : Math.round(v / PASO) * PASO; };
    let fin = null, movio = !!op.agarrado, largo = null;
    // Ratón o clip ya elegido: mantener sin mover = su menú.
    if (!op.agarrado && ev.pointerType !== "mouse" && (e || pa)) {
      largo = setTimeout(() => { if (movio) return; largo = "hecho"; vibrar(10); if (pa) this._menuAudio(pa, x0, y0); else this._menuClip(e, x0, y0); }, TOQUE_LARGO);
    }
    const empezar = () => {
      fin = E.gesto(esAudio ? "Pista de audio" : "LovEdit");
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
      if (e && Object.keys(c).length) E.setEl(e.id, c, "LovEdit");
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
      { t: t("tijeras", `Dividir en ${fmt(this.t)}`), al: () => this.dividir(e) },
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
      { t: t(a.silencio ? "volumen" : "silencio", a.silencio ? "Que vuelva a sonar" : "Silenciar (sin quitarla)"), al: () => this._ponerPista(a.id, { silencio: !a.silencio }, "Silenciar pista") },
      { t: t("duplicar", "Duplicar (justo después)"), al: () => { this.audioSel = a.id; this.duplicarClip(); } },
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
    this.t = clamp(Math.round(ms), 0, this.centro ? this._finPag() : this.T || this._largo());
    if (tocando) { this._play(this.t); return; }
    if (!this.anim) this._preparar(null);
    if (this.anim) { this.anim.quieto = true; this.anim.ir(this.t); }
    this._pintarCabezal(desdeRegla);
    this._videos(false);
  }

  alternarPlay() {
    if (this.anim && !this.anim.quieto) { this.pausar(); return; }
    if (this.centro) {
      // Al final de una página se sigue con la siguiente; al final del librito, desde el principio.
      if (this.t >= this._finPag() - 30) { this._segsAlDia(); const g = this._off + this._finPag(); this.irGlobal(g >= this._totalG - 30 ? 0 : g); }
      this._play(this.t);
      return;
    }
    this._play(this.t >= this._total() + 400 ? 0 : this.t);
  }

  /** LovEdit reproduciendo: al acabar la página pasa a la siguiente CON su transición, sin parar. */
  _siguiente() {
    const P = this.E.proyecto, pid = P.orden[P.orden.indexOf(this.E.paginaId) + 1];
    if (!pid) return false;
    const L = this.app.lienzo, viejo = this._fotoHoja(L);
    const seg = (this._segs || []).find((x) => x.pid === pid);
    this.E.irPagina(pid);
    if (seg) this._off = seg.ini;
    this.t = 0;
    const pag = P.paginas[pid], cfg = pag.transicion?.tipo ? pag.transicion : P.ajustes.transicion;
    if (viejo && cfg?.tipo && cfg.tipo !== "ninguna" && L?.pag?.nodo) {
      L.hoja.classList.add("transicionando");
      RT.transicion(viejo, L.pag.nodo, cfg).finally(() => { viejo.remove(); L.hoja.classList.remove("transicionando"); });
    } else viejo?.remove();
    requestAnimationFrame(() => this._play(0));
    return true;
  }

  /** Una copia quieta de la página que se va (para su transición en la vista previa). */
  _fotoHoja(L) {
    const n = L?.pag?.nodo;
    if (!n) return null;
    const c = n.cloneNode(true);
    c.querySelectorAll("video, audio, iframe").forEach((v) => v.remove());
    c.querySelectorAll("[data-id]").forEach((v) => v.removeAttribute("data-id"));   // (que nadie la confunda con la de verdad)
    c.classList.add("ed-hoja-sale");
    c.setAttribute("aria-hidden", "true");
    L.hoja.append(c);
    return c;
  }

  /** Reproduce las entradas (de todo o de unos pocos) sobre el lienzo. */
  probar(ids) {
    if (!this.abierta) {
      // Sin la línea abierta: se reproduce y al terminar todo vuelve a su sitio.
      const a = this._preparar(ids || null);
      if (!a) return;
      const fin = Math.max(a.total + 1200, 1800);
      this.app.audio?.pausarParaVista(true, "linea");
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
    // Reproducir la página es probarla: la música de trabajo del editor se calla.
    this.app.audio?.pausarParaVista(true, "linea");
    a.quieto = false;
    a.ir(desde);
    a.seguir();
    this.t = desde;
    this._sonidos(desde, ids);
    const p = this.E.pagina;
    if (!ids && p.audios?.length) this.app.audio?.pistas(p.audios.filter((x) => !x.silencio).map((x) => this._datosPista(x)), desde);
    if (this.conMusica) {
      const g = this.E.proyecto.ajustes.musica || {}, m = p.musica || {};
      const id = m.modo === "silencio" ? null : m.modo === "propia" ? m.asset : g.asset;
      if (id) this.app.audio.pista(this.app.bib.url(id), m.modo === "propia" ? m.volumen ?? 0.8 : g.volumen ?? 0.7, desde);
    }
    const t0 = performance.now() - desde;
    const total = this.centro && !ids ? this._finPag() : this._total() + 400;
    this._raf?.();
    ocupar("linea");
    // Un solo bucle, al ritmo de la pantalla (o al tope de Configuración).
    this._raf = alCuadro(() => {
      if (this.anim !== a || a.quieto) return false;
      this.t = performance.now() - t0;
      if (this.t >= total) {
        if (this.centro && !this.anim?.ids && this._siguiente()) return false;
        if (this.bucle && !this.anim?.ids) { this.t = 0; requestAnimationFrame(() => this._play(0)); return false; }
        this.t = total; this.pausar(); return false;
      }
      this._pintarCabezal(false, true);
      if ((this._vf = (this._vf || 0) + 1) % 12 === 0) this._videos(true);
    });
    this._videos(true);
    this._icono();
  }

  /** Fase 39: los vídeos de la hoja siguen a la línea (a su hora y desde su punto); en pausa muestran ese cuadro. */
  _videos(sonando) {
    const hoja = this.app.lienzo?.hoja, p = this.E.pagina;
    if (!hoja || !p || !this.abierta) return;
    for (const e of p.els) {
      if (e.tipo !== "video") continue;
      const n = hoja.querySelector(`.rt-el[data-id="${CSS.escape(e.id)}"] video`);
      if (!n) continue;
      const ini = RT.inicioDe(e), fin = RT.finDe(e), dentro = this.t >= ini && (fin == null || this.t < fin);
      let pos = Math.max(0, (this.t - ini) / 1000);
      const dur = n.duration;
      if (Number.isFinite(dur) && dur > 0) pos = e.video?.bucle ? pos % dur : Math.min(pos, dur - 0.05);
      const ir = (x) => { try { n.currentTime = x; } catch (er) { /* aún no cargó */ } };
      if (sonando && dentro) {
        n.muted = !!e.video?.silencio || !this.conMusica;
        if (n.paused) { ir(pos); n.play().catch(() => { n.muted = true; n.play().catch(() => {}); }); }
        else if (Math.abs(n.currentTime - pos) > 0.35) ir(pos);
      } else {
        if (!n.paused) n.pause();
        n.muted = true;
        if (Math.abs(n.currentTime - pos) > 0.04) ir(pos);
      }
    }
  }

  pausar() {
    this._raf?.();
    this._quitarRelojes();
    this.app.audio?.pararPista();
    this.app.audio?.pararPistas();
    this.app.audio?.pausarParaVista(false, "linea");
    if (this.anim) { this.anim.pausar(); this.anim.quieto = true; this.anim.ir(this.t); }
    this._pintarCabezal();
    this._videos(false);
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
    ocupar("linea", false);
    this._quitarAnim();
    this._videos(false);
    this.app.audio?.pararPista();
    this.app.audio?.pararPistas();
    this.app.audio?.pausarParaVista(false, "linea");
    if (repintar && this.abierta) this.pintar();
  }

  _icono() {
    const i = this.anim && !this.anim.quieto ? "pausa" : "play";
    if (this.btnPlay.dataset.i !== i) { this.btnPlay.dataset.i = i; this.btnPlay.innerHTML = ico(i); }
  }

  _pintarCabezal(desdeRegla, siguiendo) {
    const x = this.x(this.t);
    // Primero se lee y después se escribe: leer el ancho DESPUÉS de mover el
    // cabezal obligaba a recalcular toda la página en cada cuadro (el tirón al reproducir).
    const c = this.cuerpo;
    let ir = null;
    const centro = this.centro;
    const xg = centro ? this.x((this._off || 0) + this.t) : x;
    if (centro) { if (desdeRegla !== "scroll" && Math.abs(this._sl - xg) > 0.5) ir = xg; }
    else if (siguiendo && !desdeRegla) {
      const vis = (this._cw || c.clientWidth) - this.et, sl = this._sl;
      if (x > sl + vis - 40 || x < sl) ir = Math.max(0, x - vis * 0.2);
    }
    const tr = `translateX(${this.et + (centro ? this.pad : 0) + xg}px)`;
    if (this._tr !== tr) { this._tr = tr; this.cabezal.style.transform = tr; }
    const txt = centro ? `${fmt((this._off || 0) + this.t)} / ${fmt(this._totalG || 0)}` : `${fmt(this.t)} / ${fmt(this._total())}`;
    if (this.reloj.textContent !== txt) this.reloj.textContent = txt;
    // «Dividir» sólo se ve activo con el cabezal dentro del clip elegido.
    if (!this._dv?.isConnected) this._dv = this.herr.querySelector('[data-ac="dividir"]');
    const dv = this._dv, s = this.E.unico;
    if (dv && s) {
      const off = !(this.t > RT.inicioDe(s) + 50 && (RT.finDe(s) == null || this.t < RT.finDe(s) - 50));
      if (dv._off !== off) { dv._off = off; dv.classList.toggle("apagado", off); }
    }
    // Que el cabezal no se salga de lo que se ve al reproducir.
    if (ir != null) this._irScroll(ir);
  }

  /** Mover la línea desde aquí (y que el oyente de desplazamiento no lo tome por el dedo). */
  _irScroll(px) {
    const c = this.cuerpo;
    c.scrollLeft = px;
    this._sl = c.scrollLeft;
    this._slYo = this._sl;
  }

  /** Desplazar con el dedo en el modo CapCut = mover el cabezal (y si estaba sonando, se pausa ahí). */
  _alDesplazar() {
    if (!this.centro || !this.abierta) return;
    if (this._slYo != null && Math.abs(this._sl - this._slYo) < 1.5) return;
    this._slYo = null;
    cancelAnimationFrame(this._rs);
    this._rs = requestAnimationFrame(() => {
      if (this.anim && !this.anim.quieto) this.pausar();
      this.irGlobal(this.ms(this._sl), "scroll");
    });
  }
}
