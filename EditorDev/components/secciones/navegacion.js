/**
 * BOTONES PARA PASAR PÁGINA — siempre los de assets/deslizar/.
 *
 * Cada estilo es una carpeta con `izquierda.*` y `derecha.*`. El librito los
 * usa como flechas (y además se pasa deslizando con el dedo). Aquí se elige
 * el estilo, su tamaño, y se pueden poner sobre una página como dos botones
 * que se mueven como cualquier elemento (al tocarlos pasan la página).
 */
import { el, seccion, fila, boton, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import { extras } from "../../recursos/extras.js";
import { uid, nuevoEl } from "../../core/modelo.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** Una imagen de assets/ como asset del proyecto (sin copiarla), directo sobre el proyecto. */
function assetDe(P, ruta, nombre) {
  const ya = Object.values(P.assets).find((a) => a.fuente === "librito" && a.ruta === ruta);
  if (ya) return ya.id;
  const id = uid("a");
  P.assets[id] = { id, tipo: "imagen", nombre, archivo: ruta.split("/").pop(), fuente: "librito", ruta, creado: Date.now(), w: 64, h: 64 };
  return id;
}

/**
 * Al abrir un librito: si todavía no tiene botones de assets/deslizar/, se le
 * ponen los primeros (corazón si está). No pasa por el historial.
 */
export async function asegurarBotones(P) {
  const r = (P.ajustes.reproduccion = P.ajustes.reproduccion || {});
  const b = r.botones;
  if (b?.izq && P.assets[b.izq] && b.der && P.assets[b.der]) return;
  const lista = (await extras()).deslizar || [];
  const s = lista.find((x) => /corazon/i.test(x.id)) || lista[0];
  if (!s) return;
  r.botones = { estilo: s.id, tam: b?.tam || 52, izq: assetDe(P, s.izquierda, `${s.nombre} · izquierda`), der: assetDe(P, s.derecha, `${s.nombre} · derecha`) };
}

export const NAVEGACION = {
  _navegacion(c) {
    const E = this.E;
    const app = this.app;
    const b = () => this.P.ajustes.reproduccion?.botones || {};
    const rej = el("div.ed-deslizar");
    const usar = (s) => {
      E.transaccion("Botones para pasar página", () => {
        const izq = app.bib.delLibrito(s.izquierda, "imagen", `${s.nombre} · izquierda`, { w: 64, h: 64 }).id;
        const der = app.bib.delLibrito(s.derecha, "imagen", `${s.nombre} · derecha`, { w: 64, h: 64 }).id;
        E.setProy({ "ajustes.reproduccion.botones": { ...b(), estilo: s.id, izq, der } }, "Botones para pasar página");
      });
      for (const x of rej.children) x.classList.toggle("on", x.dataset.id === s.id);
      app.sonidos?.sonar("seleccionar");
    };
    const ponerAqui = (s) => {
      const L = app.lienzo;
      const t = Math.round(Math.min(L.W, L.H) * 0.13);
      const y = Math.round((L.H - t) / 2);
      E.transaccion("Botones en la página", () => {
        for (const [lado, ruta, x, tipo] of [["izquierda", s.izquierda, 10, "anterior"], ["derecha", s.derecha, L.W - t - 10, "siguiente"]]) {
          const a = app.bib.delLibrito(ruta, "imagen", `${s.nombre} · ${lado}`, { w: 64, h: 64 });
          E.agregarEl(nuevoEl("imagen", this.P, { nombre: lado === "izquierda" ? "Página anterior" : "Página siguiente", x, y, w: t, h: t, imagen: { asset: a.id, ajuste: "contain" }, accion: { tipo } }));
        }
      });
      aviso("Listo: al tocarlos en el librito pasan la página. Muévelos como quieras.");
    };
    extras().then((ex) => {
      const lista = ex.deslizar || [];
      if (!lista.length) { rej.append(el("p.ed-vacio-txt", { text: "No hay estilos en assets/deslizar/. Deja una carpeta con izquierda.svg y derecha.svg." })); return; }
      for (const s of lista) {
        rej.append(el("div.ed-deslizar-t" + (b().estilo === s.id ? ".on" : ""), { dataset: { id: s.id } }, [
          el("button.ed-deslizar-par", { type: "button", title: `Usar «${s.nombre}» en el librito`, onClick: () => usar(s) }, [
            el("img", { src: rutaAUrl(s.izquierda), alt: "", draggable: "false" }),
            el("img", { src: rutaAUrl(s.derecha), alt: "", draggable: "false" }),
          ]),
          el("b", { text: s.nombre }),
          el("button.ed-btn.chico", { type: "button", html: I("mas", "En esta página"), title: "Ponerlos sobre la página como botones", onClick: () => ponerAqui(s) }),
        ]));
      }
    });
    c.append(seccion("Botones para pasar página", [
      rej,
      fila("Tamaño", this._proy()("ajustes.reproduccion.botones.tam", { tipo: "rango", min: 36, max: 88, unidad: " px", def: 52 })),
      el("small.ed-ayuda", { text: "Salen de assets/deslizar/ (izquierda y derecha). En el librito también se pasa deslizando con el dedo; en el editor, desliza rápido de lado sobre la hoja entera." }),
    ]));
  },
};
