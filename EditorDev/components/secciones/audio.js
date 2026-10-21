/**
 * SONIDOS — la música (Fases 35 y 36).
 *
 *   Música              la canción de esta página: elegirla de TUS canciones (o subir
 *                       una .mp3 o .wav), y con «Para todo el librito» suena en todas
 *                       las páginas. Su volumen y quitarla
 *   Tus músicas         TODAS tus canciones con su nombre: las que subes y las que pegas en la
 *                       carpeta EditorDev/musica/ (se detectan solas); escucharlas y usarlas
 *   Música del editor   la que suena MIENTRAS editas (sólo para ti): nunca toca la de las páginas
 *   Botón de música     el botoncito para pausarla en la hoja
 *
 * Las pistas de audio y los efectos de sonido viven en la línea de tiempo (sus
 * botones de la campanita y de la onda, y el menú de cada pista).
 */
import { el, seccion, fila, boton, control, aviso, modal } from "../ui.js";
import { ico } from "../iconos.js";
import { elegir } from "../../assets/selector.js";
import { catalogo, listar } from "../../componentes/catalogo.js";
import { rutaAUrl } from "../../assets/biblioteca.js";

/** Las canciones de la carpeta EditorDev/musica/ (del catálogo o, recién pegadas, mirando la carpeta). */
export async function musicaDeCarpeta() {
  const c = await catalogo().catch(() => ({}));
  if (c.musicaEditor?.length) return c.musicaEditor;
  const l = (await listar("EditorDev/musica/").catch(() => null)) || [];
  return l.filter((f) => /\.(mp3|wav)$/i.test(f)).sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((f) => ({ nombre: f.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\w/, (x) => x.toUpperCase()), ruta: "EditorDev/musica/" + f }));
}

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export const AUDIO = {
  /** El botón de la línea de tiempo «añadir pista aquí». */
  async agregarPista(inicio = 0) {
    const [id] = await elegir(this.app, "audio", { titulo: "Audio para esta página" });
    if (!id) return;
    this.app.tiempo.agregarPista(id, inicio);
    aviso("Pista añadida: arrástrala en la línea de tiempo para moverla o recortarla");
  },

  _audio(c) {
    const E = this.E, app = this.app, P = this.P;
    const gm = P.ajustes.musica || {};
    const pm = E.pagina?.musica || { modo: "global" };
    const propia = pm.modo === "propia";
    const actual = propia ? pm.asset : pm.modo === "silencio" ? null : gm.asset;
    const nombre = (id) => (id && P.assets[id]?.nombre) || null;
    /** Poner una canción: en esta página o, con «Para todo el librito», en todas. */
    const poner = (id, todo) => {
      if (todo) {
        E.transaccion("Música de todo el librito", () => {
          E.setProy({ "ajustes.musica.asset": id }, "Música del librito");
          for (const pid of P.orden) if (P.paginas[pid]?.musica?.modo !== "global") E.setPag({ musica: { modo: "global" } }, "Música", null, pid);
        });
      } else E.setPag({ musica: { modo: "propia", asset: id, volumen: pm.volumen ?? gm.volumen ?? 0.85, bucle: true } }, "Música de esta página");
    };
    // Al elegirla se pregunta dónde suena: sólo aquí o en todo el librito.
    const usar = async (id) => {
      const donde = await modal({
        titulo: "¿Dónde suena?", ancho: 420, clase: "ed-modal-chico",
        contenido: el("p", { text: `«${nombre(id) || "Tu canción"}»` }),
        acciones: [["Sólo en esta página", "pagina"], ["En todo el librito", "todo", "primario"]],
      });
      if (!donde) return;
      poner(id, donde === "todo");
      aviso(donde === "todo" ? "Suena en todo el librito" : "Suena en esta página", 2200);
    };
    const elegirCancion = async () => { const [id] = await elegir(app, "audio", { titulo: "Música" }); if (id) usar(id); };
    const quitar = () => {
      if (propia) E.setPag({ musica: { modo: "global" } }, "Quitar música de la página");
      else E.setProy({ "ajustes.musica.asset": null }, "Quitar música");
    };
    c.append(seccion("Música de la página", [
      el("div.ed-cancion", {}, [el("b", { html: ico("audio") }), el("span", { text: nombre(actual) || "Sin música" }), actual ? this._botonEscuchar(() => app.bib.url(actual)) : null].filter(Boolean)),
      el("div.ed-botonera", {}, [
        boton(actual ? I("cambiar", "Cambiar canción") : I("mas", "Elegir canción"), elegirCancion, actual ? "chico" : "chico primario"),
        actual ? boton(I("borrar", "Quitar"), quitar, "chico") : null,
      ].filter(Boolean)),
      actual ? el("small.ed-ayuda", { text: propia ? "Suena sólo en esta página." : "Suena en todo el librito." }) : null,
      actual ? fila("Volumen", propia
        ? this._pag()("musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05, def: 0.85 })
        : this._proy()("ajustes.musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05 })) : null,
    ].filter(Boolean)));
    // ── Tus músicas: todas, con su nombre ──
    const lista = el("div.ed-rejilla-assets.lista.ed-musicas", {}, [el("p.ed-vacio-txt", { text: "Buscando tus canciones…" })]);
    const fila_ = (n, url, alUsar, etiqueta) => el("div.ed-asset.ed-musica", {}, [
      this._botonEscuchar(url), el("span", { text: n }), el("small", { text: etiqueta }),
      el("button.ed-btn.chico", { type: "button", html: I("mas", "Usar"), title: "Ponerla en la página", onClick: alUsar }),
    ]);
    const pintarLista = async () => {
      const subidas = Object.values(P.assets).filter((a) => a.tipo === "audio" && a.fuente === "local").sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { numeric: true }));
      const carpeta = await musicaDeCarpeta();
      if (!lista.isConnected && this.actual !== "audio") return;
      const filas = [
        ...subidas.map((a) => fila_(a.nombre, () => app.bib.url(a.id), () => usar(a.id), "subida")),
        ...carpeta.map((m) => fila_(m.nombre, () => rutaAUrl(m.ruta), () => usar(app.bib.delLibrito(m.ruta, "audio", m.nombre, { tam: m.peso }).id), "carpeta")),
      ];
      lista.replaceChildren(...(filas.length ? filas : [el("p.ed-vacio-txt", { text: "Todavía no hay canciones. Sube una (.mp3 o .wav) o pégala en la carpeta EditorDev/musica/." })]));
    };
    pintarLista();
    c.append(seccion("Tus músicas", [
      lista,
      boton(I("subir", "Subir canción (.mp3 o .wav)"), async () => { const [id] = await elegir(app, "audio", { titulo: "Tus músicas" }); if (id) usar(id); this.rehacer(); }, "chico"),
      el("small.ed-ayuda", { text: "Las que pegas en la carpeta EditorDev/musica/ salen aquí solas." }),
    ]));
    // ── Música del editor (sólo mientras editas; nunca va en la página) ──
    const AU = app.audio;
    const cancionEd = el("select.ed-sel", { "aria-label": "Canción del editor" }, [el("option", { value: "", text: "La de siempre (la de tu estilo)" })]);
    musicaDeCarpeta().then((l) => {
      for (const m of l) cancionEd.append(el("option", { value: rutaAUrl(m.ruta), text: m.nombre }));
      cancionEd.value = AU?.pref.cancion || "";
      if (cancionEd.value !== (AU?.pref.cancion || "")) cancionEd.value = "";
    });
    cancionEd.addEventListener("change", () => { AU?.ponerCancion(cancionEd.value || null); if (!AU?.pref.on) AU?.ponerPref({ on: true }); });
    c.append(seccion("Música del editor", [
      el("p.ed-ayuda", { text: "Suena sólo mientras editas, para ti. No cambia ni toca la música de tus páginas." }),
      fila("Encendida", control(this.v, { tipo: "toggle", leer: () => AU?.pref.on, escribir: (on) => AU?.ponerPref({ on }) })),
      fila("Canción", cancionEd),
      fila("Volumen", control(this.v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => AU?.pref.vol ?? 0.45, escribir: (vol) => AU?.ponerPref({ vol }) })),
    ], { abierta: false }));
    // ── El botón de música que va en la hoja ──
    const tiene = (E.pagina?.els || []).some((x) => x.tipo === "musica");
    c.append(seccion("Botón de música", [
      el("p.ed-ayuda", { text: "Un botoncito para pausar o volver a poner la canción. Se mueve y se edita como cualquier cosa; en el librito sólo se ve si hay canción." }),
      fila("En las páginas nuevas", control(this.v, { tipo: "toggle", leer: () => P.ajustes.botonMusica !== false, escribir: (on) => E.setProy({ "ajustes.botonMusica": on }, "Botón de música en páginas nuevas") })),
      el("div.ed-botonera", {}, [boton(tiene ? I("ok", "Elegir el de esta página") : I("mas", "Ponerlo en esta página"), () => { app.acciones.botonMusica(); this.rehacer(); }, tiene ? "chico" : "chico primario")]),
    ]));
    const antes = this._limpiar;
    this._limpiar = () => { app.audio?.detenerEscucha(); antes?.(); };
  },
};
