/**
 * AUDIO — sólo lo de la música (Fase 35).
 *
 *   Música              la canción de esta página: elegirla de TUS canciones (o subir
 *                       una .mp3 o .wav), y con «Para todo el librito» suena en todas
 *                       las páginas. Su volumen y quitarla
 *   Botón de música     el botoncito para pausarla en la hoja
 *
 * Las pistas de audio y los efectos de sonido viven en la línea de tiempo (sus
 * botones de la campanita y de la onda, y el menú de cada pista).
 */
import { el, seccion, fila, boton, control, aviso, modal } from "../ui.js";
import { ico } from "../iconos.js";
import { elegir } from "../../assets/selector.js";

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
    const elegirCancion = async () => {
      const [id] = await elegir(app, "audio", { titulo: "Música" });
      if (!id) return;
      const donde = await modal({
        titulo: "¿Dónde suena?", ancho: 420, clase: "ed-modal-chico",
        contenido: el("p", { text: `«${nombre(id) || "Tu canción"}»` }),
        acciones: [["Sólo en esta página", "pagina"], ["En todo el librito", "todo", "primario"]],
      });
      if (!donde) return;
      poner(id, donde === "todo");
      aviso(donde === "todo" ? "Suena en todo el librito" : "Suena en esta página", 2200);
    };
    const quitar = () => {
      if (propia) E.setPag({ musica: { modo: "global" } }, "Quitar música de la página");
      else E.setProy({ "ajustes.musica.asset": null }, "Quitar música");
    };
    c.append(seccion("Música", [
      el("div.ed-cancion", {}, [el("b", { html: ico("audio") }), el("span", { text: nombre(actual) || "Sin música" }), actual ? this._botonEscuchar(() => app.bib.url(actual)) : null].filter(Boolean)),
      el("div.ed-botonera", {}, [
        boton(actual ? I("cambiar", "Cambiar canción") : I("mas", "Elegir canción"), elegirCancion, actual ? "chico" : "chico primario"),
        actual ? boton(I("borrar", "Quitar"), quitar, "chico") : null,
      ].filter(Boolean)),
      actual ? el("small.ed-ayuda", { text: propia ? "Suena sólo en esta página." : "Suena en todo el librito." }) : null,
      actual ? fila("Volumen", propia
        ? this._pag()("musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05, def: 0.85 })
        : this._proy()("ajustes.musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05 })) : null,
      el("small.ed-ayuda", { text: "Tus canciones (.mp3 o .wav) se guardan en el librito y se eligen de la lista, por nombre." }),
    ].filter(Boolean)));
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
