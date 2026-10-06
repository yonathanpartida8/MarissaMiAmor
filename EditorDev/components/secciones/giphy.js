/**
 * GIFs y STICKERS (GIPHY).
 *
 *   GIFs       al abrir ya busca «Dragon Ball»; Stickers, «love»
 *   buscar     cualquier cosa (anime, funny, reaction, love…), con sugerencias
 *   más        se cargan solos al bajar (y con «Cargar más»)
 *   tocar      previsualización con sus opciones · Atrás · Usar
 *   Usar       se descarga y queda en el proyecto como una foto animada:
 *              se mueve, cambia de tamaño, gira, se borra, lleva efectos,
 *              animaciones y su clip en la línea de tiempo
 *   Quitar el fondo (GIF)   cuadro a cuadro, sin perder la animación
 * Arriba de los stickers de GIPHY salen los tuyos (assets/stickers/).
 * Sin clave ni proxy, primero pide conectar GIPHY (una sola vez).
 */
import { el, seccion, boton, aviso, fila, control, Vinculos, debounce } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { nuevoEl } from "../../core/modelo.js";
import { catalogo } from "../../componentes/catalogo.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import * as G from "../../integraciones/giphy.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const INICIO = { gifs: "Dragon Ball", stickers: "love" };
const IDEAS = { gifs: ["Dragon Ball", "anime", "love", "funny", "reaction", "beso", "abrazo", "te amo"], stickers: ["love", "corazón", "kawaii", "flores", "estrellas", "gatito", "besos", "brillos"] };

export const GIPHY = {
  _gifs(c) { this._giphy(c, "gifs"); },
  _stickers(c) { this._giphy(c, "stickers"); },

  async _giphy(c, tipo) {
    const yo = this.cont;
    if (!(await G.listo())) { if (this.cont === yo) this._conectarGiphy(c, tipo); return; }
    if (this.cont !== yo || !c.isConnected) return;
    const st = (this._gst = this._gst || {})[tipo] || (this._gst[tipo] = { q: INICIO[tipo] });
    const buscar = el("input.ed-txt.ed-buscar", { type: "search", value: st.q, placeholder: tipo === "gifs" ? "Buscar GIFs…" : "Buscar stickers…", enterkeyhint: "search", "aria-label": "Buscar" });
    const ideas = el("div.ed-gif-ideas", {}, IDEAS[tipo].map((q) => el("button" + (q === st.q ? ".on" : ""), { type: "button", text: q, onClick: () => { buscar.value = q; nueva(); } })));
    const rej = el("div.ed-gif-rejilla" + (tipo === "stickers" ? ".stickers" : ""));
    const mas = el("button.ed-btn.chico.ed-gif-mas", { type: "button", html: I("mas", "Cargar más"), hidden: "" });
    const estado = el("p.ed-vacio-txt", { hidden: "" });
    c.append(el("div.ed-gif-busca", {}, [buscar]), ideas);
    // Tus stickers (assets/stickers/) arriba de los de GIPHY.
    if (tipo === "stickers") {
      const mios = el("div.ed-gif-rejilla.stickers.mios");
      catalogo().then((cat) => {
        for (const g of cat.categorias) if (/^stickers$/i.test(g.id)) for (const it of g.items) if (it.tipo === "imagen") mios.append(el("button.ed-gif", { type: "button", title: it.nombre, onClick: () => this.app.acciones.imagenCatalogo(it) }, [el("img", { src: rutaAUrl(it.ruta), alt: "", loading: "lazy", decoding: "async", draggable: "false" })]));
        if (mios.childElementCount) mios.before(el("b.ed-sub", { text: "Tus stickers" }));
        else mios.remove();
      });
      c.append(mios);
    }
    c.append(rej, estado, mas, el("small.ed-giphy-marca", { html: `Powered by <b>GIPHY</b>` }));
    let siguiente = 0, total = Infinity, cargando = false, ctrl = null;
    const cargar = async (desde) => {
      if (cargando || desde >= total) return;
      cargando = true;
      ctrl?.abort();
      ctrl = new AbortController();
      estado.hidden = desde > 0;
      estado.textContent = "Buscando…";
      try {
        const r = await G.buscar(tipo, st.q, desde, 24, ctrl.signal);
        if (desde === 0) rej.textContent = "";
        total = r.total;
        siguiente = r.siguiente;
        for (const it of r.items) {
          const alto = Math.max(60, Math.round(it.h * (150 / Math.max(1, it.w))));
          const b = el("button.ed-gif", { type: "button", title: it.titulo, style: { aspectRatio: `${it.w} / ${it.h}` } }, [el("img", { src: it.mini, alt: it.titulo, loading: "lazy", decoding: "async", draggable: "false", width: 150, height: alto })]);
          b.addEventListener("click", () => this._previaGif(it, tipo));
          rej.append(b);
        }
        estado.hidden = !!rej.childElementCount;
        estado.textContent = rej.childElementCount ? "" : "No encontré nada con eso. Prueba otra palabra.";
        mas.hidden = siguiente >= total || !r.items.length;
      } catch (e) {
        if (e.name === "AbortError") return;
        estado.hidden = false;
        estado.textContent = e.message;
        if (e instanceof G.SinConexion) { c.textContent = ""; this._conectarGiphy(c, tipo); }
      } finally { cargando = false; }
    };
    const nueva = () => {
      st.q = buscar.value.trim() || INICIO[tipo];
      for (const b of ideas.children) b.classList.toggle("on", b.textContent === st.q);
      siguiente = 0; total = Infinity;
      cargar(0);
    };
    buscar.addEventListener("input", debounce(nueva, 450));
    buscar.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); nueva(); buscar.blur(); } });
    mas.addEventListener("click", () => cargar(siguiente));
    // Al llegar abajo, se cargan más solos.
    const ojo = new IntersectionObserver((xs) => { if (xs.some((x) => x.isIntersecting) && !mas.hidden) cargar(siguiente); }, { root: c.closest(".ed-panel-cuerpo, .ed-hoja-sec-cuerpo") || null, rootMargin: "300px" });
    ojo.observe(mas);
    const antes = this._limpiar;
    this._limpiar = () => { ojo.disconnect(); ctrl?.abort(); antes?.(); };
    cargar(0);
  },

  /** Conectar GIPHY: la clave se guarda sólo en este aparato (o se usa un proxy). */
  _conectarGiphy(c, tipo) {
    const clave = el("input.ed-txt", { type: "password", placeholder: "Pega aquí tu clave de GIPHY", autocomplete: "off", spellcheck: "false" });
    const proxy = el("input.ed-txt", { type: "url", placeholder: "https://mi-proxy.workers.dev", autocomplete: "off" });
    const probar = async () => {
      try { await G.probar(); aviso("GIPHY conectado"); this.rehacer(); }
      catch (e) { G.olvidar(); aviso(e.message, 4500, "error"); }
    };
    c.append(el("div.ed-giphy-conectar", {}, [
      el("b", { html: `${ico("gif")}<span>Conecta GIPHY para buscar ${tipo === "gifs" ? "GIFs" : "stickers"}</span>` }),
      el("p.ed-ayuda", { html: `Cuenta: <b>${G.USUARIO}</b>. Pega tu clave de <b>developers.giphy.com</b> una sola vez: se guarda <b>sólo en este aparato</b> (nunca en el proyecto, en el .zip ni en GitHub). Los GIF que uses se descargan dentro del librito, así que el librito no la necesita.` }),
      clave,
      el("div.ed-botonera", {}, [
        boton(I("pegar", "Pegar"), async () => { try { clave.value = (await navigator.clipboard.readText()).trim(); } catch (e) { clave.focus(); } }, "chico"),
        boton(I("ok", "Conectar"), () => { if (!clave.value.trim()) { clave.focus(); return; } G.ponerClave(clave.value); probar(); }, "chico primario"),
      ]),
      el("details.ed-carpeta", {}, [el("summary", { text: "¿Tienes un proxy? (la clave nunca llega al navegador)" }), el("p.ed-ayuda", { text: "Con el servidor local (node herramientas/servir.mjs y un archivo .giphy-clave) se conecta solo. Con un Worker de Cloudflare (herramientas/giphy-proxy/), pega aquí su dirección:" }), proxy, boton(I("ok", "Usar este proxy"), () => { if (!proxy.value.trim()) return; G.ponerProxy(proxy.value); probar(); }, "chico")]),
    ]));
  },

  /** Previsualización de un GIF o sticker, con sus opciones. */
  _previaGif(it, tipo) {
    const app = this.app;
    G.contar(it, "onclick");
    const img = el("img", { src: it.vista, alt: it.titulo, draggable: "false" });
    const caja = el("div.ed-gif-previa" + (tipo === "stickers" ? ".cuadros" : ""), {}, [img]);
    const v = new Vinculos();
    const op = { sinFondo: false, tolerancia: 40 };
    let original = null, cache = {};
    const pintarFondo = async () => {
      if (!op.sinFondo) { img.src = it.vista; caja.classList.remove("cuadros"); return; }
      caja.classList.add("cuadros", "procesando");
      try {
        const { primerCuadroSinFondo } = await import("../../integraciones/gif.js");
        original = original || (await G.descargar(G.rendicion(it, tipo, true)));
        const u = await primerCuadroSinFondo(original, op.tolerancia, cache);
        img.src = u;
      } catch (e) { aviso("No se pudo quitar el fondo: " + e.message, 4000, "error"); }
      caja.classList.remove("procesando");
    };
    const opciones = tipo === "gifs" ? [
      fila("Quitar el fondo", control(v, { tipo: "toggle", leer: () => op.sinFondo, escribir: (x) => { op.sinFondo = x; tol.hidden = !x; v.refrescar(); pintarFondo(); } })),
    ] : [];
    const tol = fila("Tolerancia", control(v, { tipo: "rango", min: 5, max: 120, paso: 1, leer: () => op.tolerancia, escribir: (x) => { op.tolerancia = x; clearTimeout(op._t); op._t = setTimeout(pintarFondo, 160); } }), "cuánto se parece un color al del fondo para borrarlo");
    tol.hidden = true;
    hojita({
      titulo: it.titulo,
      clase: "ed-previa-gif",
      contenido: [caja, el("small.ed-ayuda", { text: [it.autor && `de ${it.autor}`, "GIPHY"].filter(Boolean).join(" · ") }), ...opciones, tipo === "gifs" ? tol : null].filter(Boolean),
      acciones: [[I("volver", "Atrás"), null], [I("mas", "Usar"), "usar", "primario"]],
      alAbrir: () => v.refrescar(),
    }).then((r) => { if (r === "usar") this._usarGif(it, tipo, { ...op, original }); });
  },

  async _usarGif(it, tipo, op) {
    const app = this.app;
    const A = app.acciones;
    const P = this.P;
    const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("p", { text: op.sinFondo ? "Quitando el fondo cuadro por cuadro…" : "Descargando…" }), el("progress", { max: 1, value: 0 })])]);
    document.body.append(capa);
    const barra = capa.querySelector("progress");
    try {
      let blob, w, h;
      if (op.sinFondo) {
        const { quitarFondoAnimado } = await import("../../integraciones/gif.js");
        const original = op.original || (await G.descargar(G.rendicion(it, tipo, true)));
        const r = await quitarFondoAnimado(original, { tolerancia: op.tolerancia, alProgreso: (k) => { barra.value = k; } });
        ({ blob, w, h } = r);
      } else {
        const rd = G.rendicion(it, tipo);
        blob = await G.descargar(rd);
        w = rd.w; h = rd.h;
      }
      const nombre = (tipo === "gifs" ? "GIF · " : "Sticker · ") + it.titulo;
      const a = await app.bib.deBlob(blob, "imagen", nombre.slice(0, 60), { w, h, origen: { giphy: it.id, tipo, enlace: it.enlace }, animada: true });
      const max = Math.min(260, P.ajustes.ancho - 60);
      const k = Math.min(1, max / Math.max(w || 1, h || 1));
      A._poner(nuevoEl("imagen", P, { nombre: nombre.slice(0, 40), w: Math.round((w || 200) * k), h: Math.round((h || 200) * k), imagen: { asset: a.id, ajuste: "contain", gif: true } }));
      G.contar(it, "onsent");
      app.alAnadir?.();
    } catch (e) {
      console.error(e);
      aviso("No se pudo poner: " + e.message, 4500, "error");
    } finally { capa.remove(); }
  },

  /** Quitar el fondo a un GIF que ya está en la hoja (desde su barra). */
  async quitarFondoGif(e) {
    const app = this.app;
    const E = this.E;
    const id = e.imagen?.asset;
    if (!id) return;
    const v = new Vinculos();
    const op = { tolerancia: 40 };
    const img = el("img", { src: app.bib.url(id), alt: "", draggable: "false" });
    const caja = el("div.ed-gif-previa.cuadros", {}, [img]);
    let blob = null, cache = {};
    const pintar = async () => {
      caja.classList.add("procesando");
      try {
        blob = blob || (await app.bib.blob(id)) || (await (await fetch(app.bib.url(id))).blob());
        const { primerCuadroSinFondo } = await import("../../integraciones/gif.js");
        img.src = await primerCuadroSinFondo(blob, op.tolerancia, cache);
      } catch (er) { aviso("No se pudo leer el GIF: " + er.message, 4000, "error"); }
      caja.classList.remove("procesando");
    };
    const r = await hojita({
      titulo: "Quitar el fondo",
      clase: "ed-previa-gif",
      contenido: [caja, fila("Tolerancia", control(v, { tipo: "rango", min: 5, max: 120, paso: 1, leer: () => op.tolerancia, escribir: (x) => { op.tolerancia = x; clearTimeout(op._t); op._t = setTimeout(pintar, 160); } })), el("small.ed-ayuda", { text: "Funciona mejor con fondos lisos. La animación se conserva (se guarda como PNG animado)." })],
      acciones: [[I("volver", "Atrás"), null], [I("ok", "Usar"), "usar", "primario"]],
      alAbrir: () => { v.refrescar(); pintar(); },
    });
    if (r !== "usar") return;
    const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("p", { text: "Quitando el fondo cuadro por cuadro…" }), el("progress", { max: 1, value: 0 })])]);
    document.body.append(capa);
    try {
      const { quitarFondoAnimado } = await import("../../integraciones/gif.js");
      const res = await quitarFondoAnimado(blob || (await app.bib.blob(id)), { tolerancia: op.tolerancia, alProgreso: (k) => { capa.querySelector("progress").value = k; } });
      const a = await app.bib.deBlob(res.blob, "imagen", (P_nombre(E, id) + " sin fondo").slice(0, 60), { w: res.w, h: res.h, animada: true });
      E.setEl(e.id, { "imagen.asset": a.id, "imagen.ajuste": "contain" }, "Quitar fondo");
      aviso("Fondo quitado (la animación sigue)");
    } catch (er) { aviso("No se pudo: " + er.message, 4500, "error"); }
    finally { capa.remove(); }
  },
};

const P_nombre = (E, id) => E.proyecto.assets[id]?.nombre || "GIF";
