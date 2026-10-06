/**
 * AUDIO — sencillo y visual.
 *
 *   Pistas de esta página   cada audio con su onda: escuchar/pausar, volumen,
 *                           cuándo empieza y cuánto suena, verlo en la línea de
 *                           tiempo (ahí se arrastra y se recorta) y quitarlo
 *   Añadir audio            de tu biblioteca, de «musica assets/», de assets/ o subido
 *   Música del editor       MusicaDev.mp3 (sólo mientras editas)
 *   Música del librito y de la página   la de fondo, con sus fundidos
 */
import { el, seccion, fila, boton, control, aviso, formatoBytes } from "../ui.js";
import { ico } from "../iconos.js";
import { elegir } from "../../assets/selector.js";
import { catalogo } from "../../componentes/catalogo.js";
import { rutaAUrl } from "../../assets/biblioteca.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const fmt = (ms) => { const s = Math.max(0, ms || 0) / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`; };

export const AUDIO = {
  /** El botón de la línea de tiempo «añadir pista aquí». */
  async agregarPista(inicio = 0) {
    const [id] = await elegir(this.app, "audio", { titulo: "Audio para esta página" });
    if (!id) return;
    this.app.tiempo.agregarPista(id, inicio);
    aviso("Pista añadida: arrástrala en la línea de tiempo para moverla o recortarla");
  },

  _audio(c) {
    const E = this.E;
    const app = this.app;
    const T = app.tiempo;
    const AU = app.audio;
    const p = this._proy();
    const g = this._pag();
    const nombre = (id) => (id && this.P.assets[id]?.nombre) || null;
    const escuchar = (id) => this._botonEscuchar(() => app.bib.url(id));
    // ── Pistas de esta página ──
    const pistas = E.pagina?.audios || [];
    const lista = el("div.ed-pistas", {}, pistas.map((a) => {
      const url = app.bib.url(a.asset);
      const onda = AU?.ondaUrl(url);
      if (url && AU && !onda) AU.onda(url).then(() => { if (this.actual === "audio") this.rehacer(); }).catch(() => {});
      const dur = T._durPista(a);
      const play = el("button.ed-play", { type: "button", html: ico("play"), title: "Escuchar", "aria-label": "Escuchar" });
      play.addEventListener("click", () => {
        const on = play.classList.toggle("on");
        play.innerHTML = ico(on ? "pausa" : "play");
        if (on) { AU.pistas([T._datosPista(a)], a.inicio || 0, true); clearTimeout(play._t); play._t = setTimeout(() => { play.classList.remove("on"); play.innerHTML = ico("play"); }, dur + 400); }
        else { AU.pararPistas(); clearTimeout(play._t); }
      });
      return el("div.ed-pista" + (T.audioSel === a.id ? ".on" : ""), { dataset: { id: a.id } }, [
        el("div.ed-pista-cab", {}, [
          play,
          el("b", { text: a.nombre || nombre(a.asset) || "audio" }),
          el("small", { text: `${fmt(a.inicio)} · suena ${fmt(dur)}${a.bucle ? " · bucle" : ""}` }),
        ]),
        el("div.ed-pista-onda", { style: onda ? { backgroundImage: `url("${onda}")` } : {} }),
        fila("Volumen", control(this.v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => (E.pagina?.audios || []).find((x) => x.id === a.id)?.vol ?? 0.9, escribir: (vol) => T._ponerPista(a.id, { vol }, "Volumen de la pista", "vol" + a.id) })),
        el("div.ed-botonera", {}, [
          boton(I("tiempo", "En la línea"), () => { T.audioSel = a.id; T.alternar(true); }, "chico"),
          boton(I("bucle", a.bucle ? "Sin bucle" : "En bucle"), () => T._ponerPista(a.id, { bucle: !a.bucle }, "Bucle"), "chico"),
          boton(I("borrar", "Quitar"), () => T.quitarPista(a.id), "chico peligro"),
        ]),
      ]);
    }));
    c.append(seccion("Pistas de esta página", [
      pistas.length ? lista : el("p.ed-vacio-txt", { text: "Sin pistas todavía. Una pista es un audio que suena en un momento de la página (una voz, un efecto, una canción cortita)." }),
      boton(I("mas", "Añadir audio a esta página"), () => this.agregarPista(Math.round((T.t || 0) / 50) * 50), "primario ancho"),
      el("small.ed-ayuda", { text: "En la línea de tiempo: arrastra la pista para moverla, sus bordes para recortarla; dos toques para su menú." }),
    ]));
    // ── Música del editor ──
    const estado = el("small.ed-ayuda");
    const pintarEstado = () => {
      estado.textContent = !AU ? "" : AU.disponible
        ? AU.pref.on ? (AU.sonando ? "Sonando mientras editas. Baja sola cuando suena otra cosa." : "Empieza al primer toque.") : "Apagada."
        : "No encontré MusicaDev.mp3: déjala en EditorDev/ (o en «musica assets/») y vuelve a abrir el editor.";
    };
    pintarEstado();
    if (AU) { const quitar = AU.alCambiar(pintarEstado); const antes = this._limpiar; this._limpiar = () => { quitar(); antes?.(); }; }
    c.append(seccion("Música del editor", [
      fila("Encendida", control(this.v, { tipo: "toggle", leer: () => AU?.pref.on, escribir: (on) => AU?.ponerPref({ on }) })),
      fila("Volumen", control(this.v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => AU?.pref.vol ?? 0.45, escribir: (vol) => AU?.ponerPref({ vol }) })),
      estado,
    ], { abierta: false }));
    // ── Música del librito y de la página ──
    const gm = this.P.ajustes.musica;
    c.append(seccion("Música de todo el librito", [
      el("div.ed-cancion", {}, [el("b", { html: ico("audio") }), el("span", { text: nombre(gm.asset) || "Sin música" }), gm.asset ? escuchar(gm.asset) : null].filter(Boolean)),
      el("div.ed-botonera", {}, [
        boton(gm.asset ? I("cambiar", "Cambiar canción") : I("mas", "Añadir canción"), async () => { const [id] = await elegir(app, "audio", { titulo: "Música del librito" }); if (id) E.setProy({ "ajustes.musica.asset": id }, "Música del librito"); }, gm.asset ? "chico" : "chico primario"),
        gm.asset ? boton("Quitar", () => E.setProy({ "ajustes.musica.asset": null }, "Quitar música"), "chico") : null,
      ].filter(Boolean)),
      fila("Volumen", p("ajustes.musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05 })),
      fila("En bucle", p("ajustes.musica.bucle", { tipo: "toggle" })),
    ], { abierta: false }));
    const pm = E.pagina?.musica || { modo: "global" };
    const pag = [fila("Aquí suena", g("musica.modo", { tipo: "segmento", opciones: [["global", "La del librito"], ["propia", "Su canción"], ["silencio", "Silencio"]], def: "global" }))];
    if (pm.modo === "propia") pag.push(
      el("div.ed-cancion", {}, [el("b", { html: ico("audio") }), el("span", { text: nombre(pm.asset) || "Elige una canción" }), pm.asset ? escuchar(pm.asset) : null].filter(Boolean)),
      boton(pm.asset ? I("cambiar", "Cambiar canción") : I("mas", "Añadir canción"), async () => { const [id] = await elegir(app, "audio", { titulo: "Canción de esta página" }); if (id) E.setPag({ "musica.asset": id }, "Canción de la página"); }, pm.asset ? "chico" : "chico primario"),
      fila("Volumen", g("musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05, def: 0.85 })),
      fila("En bucle", g("musica.bucle", { tipo: "toggle", def: true })),
    );
    pag.push(el("small.ed-ayuda", { text: "En el librito, al cambiar de canción se funden: una baja mientras la otra sube. Los sonidos y las pistas bajan la música un momento." }));
    c.append(seccion("Música de esta página", pag, { abierta: pm.modo !== "global" }));
    // ── Biblioteca ──
    const lib = el("div");
    c.append(seccion("Biblioteca de audio", [lib, boton(I("subir", "Subir canción o sonido"), async () => { await elegir(app, "audio"); this.rehacer(); }, "chico")], { abierta: false }));
    const fila_ = (nom, ruta, peso) => {
      const a = () => app.bib.delLibrito(ruta, "audio", nom, { tam: peso });
      const parar = () => app.audio?.detenerEscucha();
      return el("div.ed-asset", {}, [this._botonEscuchar(() => rutaAUrl(ruta)), el("span", { text: nom }), peso ? el("small", { text: formatoBytes(peso) }) : null,
        el("button.ed-btn.chico", { type: "button", html: I("onda", "Pista"), title: "Una pista en esta página (línea de tiempo)", onClick: () => { parar(); T.agregarPista(a().id, Math.round((T.t || 0) / 50) * 50); } }),
        el("button.ed-btn.chico", { type: "button", text: "De fondo", title: "Música de todo el librito (no suena mientras editas)", onClick: () => { parar(); E.setProy({ "ajustes.musica.asset": a().id }, "Música del librito"); aviso("Guardada como música del librito. Suena en la vista previa y en el librito."); } }),
        el("button.ed-btn.chico", { type: "button", text: "Aquí", title: "Música sólo de esta página", onClick: () => { parar(); E.setPag({ musica: { modo: "propia", asset: a().id, volumen: 0.85, bucle: true } }, "Canción de la página"); } }),
      ].filter(Boolean));
    };
    catalogo().then((cat) => {
      const musica = cat.musica.filter((m) => !/^musicadev\./i.test(m.ruta.split("/").pop())).map((m) => fila_(m.nombre, m.ruta, m.peso));
      const sonidos = [];
      for (const gr of cat.categorias) for (const it of gr.items) if (it.tipo === "audio") sonidos.push(fila_(`${it.nombre} · ${gr.nombre.toLowerCase()}`, it.ruta, it.peso));
      const mios = Object.values(this.P.assets).filter((a) => a.tipo === "audio" && a.fuente === "local").map((a) => el("div.ed-asset", {}, [escuchar(a.id), el("span", { text: a.nombre }), el("small", { text: formatoBytes(a.tam) }), el("button.ed-btn.chico", { type: "button", html: I("onda", "Pista"), onClick: () => T.agregarPista(a.id, Math.round((T.t || 0) / 50) * 50) })]));
      lib.append(
        el("b.ed-sub", { text: "Música (musica assets/)" }),
        musica.length ? el("div.ed-rejilla-assets.lista", {}, musica) : el("p.ed-vacio-txt", { text: "Deja tus canciones en la carpeta «musica assets/» y aparecen aquí solas." }),
        el("b.ed-sub", { text: "Sonidos (assets/)" }),
        sonidos.length ? el("div.ed-rejilla-assets.lista", {}, sonidos) : el("p.ed-vacio-txt", { text: "Pon .mp3 cortos en cualquier carpeta de assets/." }),
        mios.length ? el("b.ed-sub", { text: "Subidas a este librito" }) : null,
        mios.length ? el("div.ed-rejilla-assets.lista", {}, mios) : null,
      );
    });
    c.append(seccion("Reproducción", [
      fila("Tocar para empezar", p("ajustes.reproduccion.tocarParaEmpezar", { tipo: "toggle" }), "los teléfonos no dejan sonar música hasta el primer toque"),
      el("small.ed-ayuda", { text: "Los sonidos de cada elemento se eligen en su sección «Sonidos» (inspector); el de pasar página, en Transiciones." }),
    ], { abierta: false }));
    const antes = this._limpiar;
    this._limpiar = () => { app.audio?.detenerEscucha(); app.audio?.pararPistas(); antes?.(); };
  },
};
