/*
 * LIBRITO · el reproductor
 *
 * Enseña el librito página a página. Sólo existe en el DOM la página que
 * se ve (y, durante la transición, la que se va): las demás no gastan nada.
 * Los datos de cada página se piden cuando hacen falta, y mientras ella lee
 * se adelanta la siguiente para que pasar de hoja sea instantáneo.
 *
 * La hoja tiene un tamaño fijo (el del diseño) y se escala entera para
 * caber en la pantalla, así se ve igual en cualquier teléfono.
 */
(function (RT) {
  "use strict";
  const h = RT.h;

  /* ── Páginas que llegan en su propio archivo (librito exportado) ── */
  RT._pags = RT._pags || {};
  const esperando = {};
  RT.pagina = function (id, datos) {
    RT._pags[id] = datos;
    if (esperando[id]) { esperando[id].forEach((r) => r(datos)); delete esperando[id]; }
  };
  RT.cargarScript = function (src, id) {
    if (RT._pags[id]) return Promise.resolve(RT._pags[id]);
    return new Promise((resolver, fallar) => {
      (esperando[id] = esperando[id] || []).push(resolver);
      if (esperando[id].length > 1) return;
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onerror = () => { delete esperando[id]; fallar(new Error("No se pudo cargar " + src)); };
      document.head.appendChild(s);
    });
  };

  RT.Libro = class {
    constructor(raiz, datos, op) {
      this.raiz = raiz;
      this.datos = datos;
      this.op = op || {};
      const a = datos.ajustes || {};
      RT.registrarExtras && RT.registrarExtras(a);
      this.W = a.ancho || 390;
      this.H = a.alto || 844;
      this.rep = Object.assign({ flechas: true, progreso: true, deslizar: true, indice: true, tocarParaEmpezar: true, alFinal: "quedarse", autoAvance: 0 }, a.reproduccion || {});
      // «Probar página» (editor): sólo esa página, sin flechas, barrita ni índice.
      if (this.op.soloPagina) Object.assign(this.rep, { flechas: false, progreso: false, indice: false, deslizar: false, autoAvance: 0, tocarParaEmpezar: false });
      this._sonandoPistas = [];
      this.orden = datos.orden.slice();
      this.i = -1;
      this.actual = null;
      this.ocupado = false;
      this.musica = new RT.Musica();
      this.ctx = {
        modo: "vista", activo: true,
        url: (id) => this.op.url(id),
        urlDatos: (id) => (this.op.urlDatos ? this.op.urlDatos(id) : null),
        ruta: (r) => (this.op.ruta ? this.op.ruta(r) : r),
        accion: (ac, e) => this.accion(ac, e),
        sonido: (id, vol) => RT.sonar(this.op.url(id), vol),
        escala: () => this.escala || 1,
      };
      // Los componentes de assets/ pueden pedir cosas («siguiente», «musica»…).
      this._mensaje = (ev) => {
        const d = ev.data && ev.data.librito;
        if (!d || !this.actual) return;
        const ok = Array.prototype.some.call(this.marco.querySelectorAll("iframe"), (f) => f.contentWindow === ev.source);
        if (!ok) return;
        if (typeof d === "string") {
          if (d === "bajarMusica") this.musica.agachar(true);
          else if (d === "subirMusica") this.musica.agachar(false);
          else this.accion({ tipo: d });
        } else if (d.ir) this.accion({ tipo: "ir", destino: d.ir });
        else if (d.sonido) RT.sonar(d.sonido, d.volumen);
      };
      addEventListener("message", this._mensaje);
      RT.alSonar = (a) => this.musica.agacharPor(a);
      this._montar();
      const ini = typeof op.inicio === "string" ? Math.max(0, this.orden.indexOf(op.inicio)) : op.inicio || 0;
      const empezar = () => this.ir(ini, false, true);
      if (this.rep.tocarParaEmpezar && !op.sinPortadilla) this._portadilla(empezar);
      else { this.musica.desbloquear(); empezar(); }
    }

    _montar() {
      const r = this.raiz;
      r.classList.add("rt-libro");
      this.marco = h("div", "rt-escenario", r);
      this.marco.style.width = this.W + "px";
      this.marco.style.height = this.H + "px";
      const ui = h("div", "rt-ui", r);
      this.ant = h("button", "rt-nav rt-nav-ant", ui); this.ant.type = "button"; this.ant.setAttribute("aria-label", "Página anterior"); this.ant.innerHTML = "<span>‹</span>";
      this.sig = h("button", "rt-nav rt-nav-sig", ui); this.sig.type = "button"; this.sig.setAttribute("aria-label", "Página siguiente"); this.sig.innerHTML = "<span>›</span>";
      this.ant.addEventListener("click", () => this.anterior());
      this.sig.addEventListener("click", () => this.siguiente());
      if (!this.rep.flechas) { this.ant.hidden = true; this.sig.hidden = true; }
      this.prog = h("div", "rt-prog", ui);
      this.progBarra = h("i", "", this.prog);
      if (!this.rep.progreso) this.prog.hidden = true;
      const arriba = h("div", "rt-arriba", ui);
      this.btnMusica = h("button", "rt-chip", arriba); this.btnMusica.type = "button"; this.btnMusica.textContent = "♪"; this.btnMusica.setAttribute("aria-label", "Música");
      this.btnMusica.addEventListener("click", () => { const on = this.musica.alternar(); this.btnMusica.classList.toggle("rt-off", !on); });
      this.btnMusica.hidden = true;
      if (this.rep.indice && this.orden.length > 2) {
        const b = h("button", "rt-chip", arriba); b.type = "button"; b.textContent = "☰"; b.setAttribute("aria-label", "Índice");
        b.addEventListener("click", () => this._indice());
      }
      if (this.op.cerrar && !this.op.soloPagina) {
        const x = h("button", "rt-chip", arriba); x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Cerrar");
        x.addEventListener("click", () => this.op.cerrar());
      }
      this._escalar = () => {
        const vv = window.visualViewport;
        const w = vv ? vv.width : innerWidth, hh = vv ? vv.height : innerHeight;
        // Salió el teclado (mismo ancho, mucho menos alto, escribiendo): la hoja no se
        // reacomoda «como si se hubiera girado»; el teclado sólo tapa un poco.
        const ae = document.activeElement;
        const escribe = ae && (ae.tagName === "IFRAME" || /INPUT|TEXTAREA|SELECT/.test(ae.tagName) || ae.isContentEditable);
        if (this.medidas && escribe && Math.abs(w - this._ultW) < 2 && hh < this._ultH * 0.86) return;
        this._ultW = w; this._ultH = hh;
        // Hoja automática: la hoja toma la forma de la pantalla (vertical u
        // horizontal) y lo de dentro se recoloca; con tamaño fijo, se escala.
        const m = RT.medidas(this.datos.ajustes, w, hh);
        this.medidas = m;
        this.ctx.medidas = m;
        if (m.W !== this.W || m.H !== this.H) {
          this.W = m.W; this.H = m.H;
          this.marco.style.width = this.W + "px";
          this.marco.style.height = this.H + "px";
          if (this.actual) this.actual.redimensionar(this.W, this.H);
        }
        const s = Math.min(w / this.W, hh / this.H);
        this.escala = s;
        this.marco.style.transform = `translate(-50%, -50%) scale(${s})`;
      };
      this._escalar();
      this._rs = () => { cancelAnimationFrame(this._rf); this._rf = requestAnimationFrame(this._escalar); };
      addEventListener("resize", this._rs);
      addEventListener("orientationchange", this._rs);
      if (window.visualViewport) visualViewport.addEventListener("resize", this._rs);
      this._tecla = (ev) => {
        if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
        if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") { ev.preventDefault(); this.siguiente(); }
        else if (ev.key === "ArrowLeft" || ev.key === "PageUp") { ev.preventDefault(); this.anterior(); }
      };
      addEventListener("keydown", this._tecla);
      if (this.rep.deslizar) this._gestos();
    }

    _gestos() {
      let x0 = null, y0 = 0, t0 = 0;
      this.raiz.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest(".rt-toca, .rt-ui button, [data-claim-drag], .rt-indice")) { x0 = null; return; }
        x0 = ev.clientX; y0 = ev.clientY; t0 = performance.now();
      });
      this.raiz.addEventListener("pointerup", (ev) => {
        if (x0 == null) return;
        const dx = ev.clientX - x0, dy = ev.clientY - y0, dt = performance.now() - t0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 900) dx < 0 ? this.siguiente() : this.anterior();
      });
    }

    _portadilla(alEntrar) {
      const p = h("div", "rt-portadilla", this.raiz);
      const t = h("div", "rt-portadilla-t", p);
      t.innerHTML = `<b></b><span>Toca para abrir</span>`;
      t.firstChild.textContent = this.datos.nombre || "Mi librito";
      const ir = () => {
        this.musica.desbloquear();
        p.classList.add("rt-fuera");
        setTimeout(() => p.remove(), 500);
        alEntrar();
      };
      p.addEventListener("click", ir, { once: true });
    }

    async _pagina(i) {
      const id = this.orden[i];
      if (this.datos.paginas && this.datos.paginas[id]) return this.datos.paginas[id];
      return this.op.cargar(id);
    }

    siguiente() {
      if (this.i < this.orden.length - 1) this.ir(this.i + 1, false);
      else if (this.rep.alFinal === "portada") this.ir(0, false);
    }
    anterior() { if (this.i > 0) this.ir(this.i - 1, true); }

    async ir(i, atras, primera) {
      if (i < 0 || i >= this.orden.length || i === this.i) return;
      if (this.ocupado) { this._pendiente = [i, atras]; return; }
      this.ocupado = true;
      clearTimeout(this._auto);
      let pag;
      try { pag = await this._pagina(i); } catch (err) { console.warn(err); this.ocupado = false; return; }
      const viejo = this.actual;
      this._pararPistas();
      if (viejo && viejo.anim) await viejo.anim.salir();
      const nueva = new RT.Pagina(pag, this.ctx, this.W, this.H);
      this.marco.appendChild(nueva.nodo);
      const anim = new RT.Animador(pag, nueva.nodos);
      anim.componentes = Array.from(nueva.nodos.values()).map((n) => n._rt.vida).filter((v) => v && v.entrar);
      nueva.anim = anim;
      this.i = i;
      this.actual = nueva;
      this._pintarUI(pag);
      const cfg = pag.transicion && pag.transicion.tipo ? pag.transicion : (this.datos.ajustes || {}).transicion || { tipo: "fundido" };
      const dur = primera || !viejo ? 0 : RT.num(cfg.dur, 700);
      this._quitarRelojes();
      if (viejo && cfg.sonido) RT.sonar(this.op.url(cfg.sonido), cfg.volumen);
      for (const e of pag.els || []) { const so = e.sonidos; if (so && so.tocar) RT.precargarSonido(this.op.url(so.tocar)); }
      setTimeout(() => {
        if (this.actual !== nueva) return;
        anim.entrar({ vista: true });
        // Los vídeos que empiezan más tarde (línea de tiempo).
        for (const e of pag.els || []) {
          if (e.tipo !== "video" || !e.video || !e.video.auto || !RT.inicioDe(e)) continue;
          const v = nueva.nodos.get(e.id) && nueva.nodos.get(e.id).querySelector("video");
          if (v) this._relojes.push(setTimeout(() => v.play().catch(() => {}), RT.inicioDe(e)));
        }
        // Los sonidos «al aparecer», cuando empieza su entrada.
        for (const e of pag.els || []) {
          const so = e.sonidos;
          if (!so || !so.aparecer || e.oculto || e.inicioOculto) continue;
          const ret = RT.inicioDe(e) + (e.anim && e.anim.entrada && e.anim.entrada.tipo !== "ninguna" ? RT.num(e.anim.entrada.retraso, 0) : 0);
          this._relojes.push(setTimeout(() => RT.sonar(this.op.url(so.aparecer), so.volumen), ret));
        }
        this._pistas(pag);
      }, primera || !viejo ? 60 : dur * 0.45);
      if (viejo) {
        await RT.transicion(viejo.nodo, nueva.nodo, cfg, atras);
        if (viejo.anim) viejo.anim.cancelar();
        viejo.destruir();
      }
      this._sonar(pag);
      this.ocupado = false;
      this._adelantar(i + 1);
      const auto = this.op.soloPagina ? 0 : RT.num(pag.duracion, 0) || RT.num(this.rep.autoAvance, 0);
      if (auto > 0) this._auto = setTimeout(() => this.siguiente(), auto * 1000);
      if (this._pendiente) { const p = this._pendiente; this._pendiente = null; this.ir(p[0], p[1]); }
    }

    _pintarUI(pag) {
      const n = this.orden.length;
      this.progBarra.style.transform = `scaleX(${n > 1 ? this.i / (n - 1) : 1})`;
      this.ant.disabled = this.i === 0;
      this.sig.disabled = this.i === n - 1 && this.rep.alFinal !== "portada";
      const f = pag.fondo || {};
      this.raiz.style.background = f.tipo === "gradiente" && f.gradiente ? RT.gradiente(f.gradiente) : f.css || f.color || "#111";
    }

    _sonar(pag) {
      const g = (this.datos.ajustes || {}).musica || {};
      const m = pag.musica || {};
      let src = null, vol = 0.8, bucle = true;
      if (m.modo === "silencio") src = null;
      else if (m.modo === "propia" && m.asset) { src = this.op.url(m.asset); vol = RT.num(m.volumen, 0.8); bucle = m.bucle !== false; }
      else if (g.asset) { src = this.op.url(g.asset); vol = RT.num(g.volumen, 0.8); bucle = g.bucle !== false; }
      this.btnMusica.hidden = !src && !this.musica.actual;
      this.musica.poner(src, vol, bucle);
    }

    /** Deja lista la siguiente: sus datos y sus fotos, sin pintarla. */
    _adelantar(i) {
      if (i >= this.orden.length) return;
      const hacer = () => this._pagina(i).then((p) => {
        for (const e of p.els || []) {
          const ids = e.imagen ? [e.imagen.asset] : e.album ? e.album.fotos : e.carrusel ? (e.carrusel.fotos || []).slice(0, 2) : [];
          for (const id of ids || []) { const u = id && this.op.url(id); if (u) { const im = new Image(); im.decoding = "async"; im.src = u; } }
        }
        if (p.fondo && p.fondo.imagen && p.fondo.imagen.asset) { const im = new Image(); im.src = this.op.url(p.fondo.imagen.asset); }
      }).catch(() => {});
      if (window.requestIdleCallback) requestIdleCallback(hacer, { timeout: 2000 }); else setTimeout(hacer, 400);
    }

    _quitarRelojes() { for (const t of this._relojes || []) clearTimeout(t); this._relojes = []; }

    /* Las pistas de audio de la página (línea de tiempo del editor): cada una
       a su hora, desde su recorte, con su volumen; la música baja mientras suenan. */
    _pistas(pag) {
      this._pararPistas();
      for (const t of pag.audios || []) {
        const url = this.op.url(t.asset);
        if (!url) continue;
        const s = { relojes: [], a: null };
        s.relojes.push(setTimeout(() => {
          const a = new Audio();
          a.preload = "auto";
          a.loop = !!t.bucle;
          a.src = url;
          a.volume = RT.clamp(RT.num(t.vol, 0.9), 0, 1);
          const ir = () => { try { a.currentTime = RT.num(t.desde, 0) / 1000; } catch (err) { /* nada */ } };
          ir();
          a.addEventListener("loadedmetadata", ir, { once: true });
          a.play().catch(() => {});
          if (RT.alSonar) RT.alSonar(a);
          s.a = a;
          if (t.dur) s.relojes.push(setTimeout(() => this._apagarPista(s), RT.num(t.dur, 0)));
        }, Math.max(0, RT.num(t.inicio, 0))));
        this._sonandoPistas.push(s);
      }
    }

    _apagarPista(s) {
      for (const r of s.relojes) clearTimeout(r);
      s.relojes = [];
      const a = s.a;
      if (!a) return;
      s.a = null;
      // Un fundido cortito (en iPhone el volumen no cambia: se corta al final).
      const v0 = a.volume, t0 = performance.now();
      const paso = () => { const k = Math.min(1, (performance.now() - t0) / 220); try { a.volume = v0 * (1 - k); } catch (err) { /* nada */ } if (k < 1) requestAnimationFrame(paso); else { a.pause(); a.removeAttribute("src"); } };
      requestAnimationFrame(paso);
    }

    _pararPistas() { for (const s of this._sonandoPistas || []) this._apagarPista(s); this._sonandoPistas = []; }

    /** Un elemento de la página que se está viendo. */
    _nodo(id) { return this.actual && id ? this.actual.nodos.get(id) : null; }

    _mostrar(id, ver) {
      const n = this._nodo(id);
      if (!n) return;
      const e = n._rt.e;
      const visible = n.style.display !== "none";
      const quiere = ver == null ? !visible : ver;
      if (quiere === visible) return;
      n._rt.revelado = quiere;
      n.style.display = quiere ? "" : "none";
      if (quiere) {
        const en = e.anim && e.anim.entrada;
        RT.animarUno(n._rt.ae, en && en.tipo !== "ninguna" ? en.tipo : "zoom", Object.assign({}, en || {}, { retraso: 0 }));
        if (e.sonidos && e.sonidos.aparecer) RT.sonar(this.op.url(e.sonidos.aparecer), e.sonidos.volumen);
      }
    }

    accion(ac, desde) {
      if (!ac || !ac.tipo) return;
      switch (ac.tipo) {
        case "mostrar": this._mostrar(ac.destino, true); break;
        case "ocultar": this._mostrar(ac.destino, false); break;
        case "alternar": this._mostrar(ac.destino, null); break;
        case "animar": {
          const n = this._nodo(ac.destino) || (desde && this._nodo(desde.id));
          if (n) { const en = n._rt.e.anim && n._rt.e.anim.entrada; RT.animarUno(n._rt.ae, en && en.tipo !== "ninguna" ? en.tipo : "rebote", Object.assign({}, en || {}, { retraso: 0 })); }
          break;
        }
        case "sonido": if (ac.destino) RT.sonar(this.op.url(ac.destino), ac.volumen); break;
        case "siguiente": this.siguiente(); break;
        case "anterior": this.anterior(); break;
        case "inicio": this.ir(0, true); break;
        case "ir": { const j = this.orden.indexOf(ac.destino); if (j >= 0) this.ir(j, j < this.i); break; }
        case "enlace": if (/^(https?:|mailto:|tel:)/i.test(ac.destino || "")) window.open(ac.destino, "_blank", "noopener"); break;
        case "musica": { const on = this.musica.alternar(); this.btnMusica.classList.toggle("rt-off", !on); break; }
      }
    }

    _indice() {
      const capa = h("div", "rt-indice", this.raiz);
      const caja = h("div", "rt-indice-caja", capa);
      const t = h("b", "", caja); t.textContent = this.datos.nombre || "Índice";
      const l = h("ol", "", caja);
      this.orden.forEach((id, j) => {
        const li = h("li", j === this.i ? "rt-act" : "", l);
        const b = h("button", "", li); b.type = "button";
        b.textContent = (this.datos.titulos && this.datos.titulos[id]) || "Página " + (j + 1);
        b.addEventListener("click", () => { cerrar(); this.ir(j, j < this.i); });
      });
      const cerrar = () => { capa.classList.add("rt-fuera"); setTimeout(() => capa.remove(), 220); };
      capa.addEventListener("click", (ev) => { if (ev.target === capa) cerrar(); });
      requestAnimationFrame(() => capa.classList.add("rt-dentro"));
    }

    destruir() {
      clearTimeout(this._auto);
      this._quitarRelojes();
      this._pararPistas();
      removeEventListener("message", this._mensaje);
      if (RT.alSonar) RT.alSonar = null;
      removeEventListener("resize", this._rs);
      removeEventListener("orientationchange", this._rs);
      removeEventListener("keydown", this._tecla);
      if (window.visualViewport) visualViewport.removeEventListener("resize", this._rs);
      if (this.actual) { if (this.actual.anim) this.actual.anim.cancelar(); this.actual.destruir(); }
      this.musica.destruir();
      this.raiz.textContent = "";
    }
  };

  /** Arranque del librito exportado: lee `window.LIBRITO_DATOS`. */
  RT.arrancar = function () {
    const d = window.LIBRITO_DATOS;
    if (!d) return;
    document.title = d.nombre || "Mi librito";
    const raiz = document.getElementById("librito") || document.body;
    RT.libro = new RT.Libro(raiz, d, {
      url: (id) => (d.archivos && d.archivos[id]) || null,
      ruta: (r) => "pages/originales/" + r.split("/").map(encodeURIComponent).join("/"),
      cargar: (id) => RT.cargarScript(d.paginasArchivos[id], id),
    });
  };
})(window.LibritoRT = window.LibritoRT || {});
