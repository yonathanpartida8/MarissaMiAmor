/**
 * ESTILO DE LA PÁGINA (Fase 43) — el fondo de esta página, rápido y bonito: un color, un degradado,
 * un estilo de hoja (papel), una foto; y, si te gusta, el mismo en todas las páginas.
 * Lo del librito entero (colores y letras) sigue en Temas.
 */
import { el, seccion, fila, boton, control, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { PAPELES, fondoDePapel, muestraPapel } from "../temas-hoja.js";
import { elegir } from "../../assets/selector.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const COLORES = ["#ffffff", "#fff8f0", "#ffe4ec", "#ffd6e7", "#f9d1e6", "#f3e8ff", "#e0f2ff", "#e3f9ee", "#fff6d6", "#ffe8d6", "#2b1d2a", "#1d1b3a"];
const DEGRADADOS = [
  ["Rosita", "#ffd9ea", "#ff9fc3"], ["Atardecer", "#ffd6a5", "#ff7eb3"], ["Lavanda", "#efe2ff", "#b69cff"], ["Cielo", "#dff3ff", "#9ccaff"],
  ["Menta", "#dcfbea", "#8fe3c0"], ["Durazno", "#ffe8d6", "#ffb08a"], ["Algodón", "#fff0f6", "#cde7ff"], ["Noche", "#2b1d4a", "#0f1030"],
];
const igual = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

export const ESTILO = {
  _estilo(c) {
    const E = this.E, app = this.app;
    const f = () => E.pagina?.fondo || {};
    const limpio = (cambio) => ({ ...f(), css: undefined, papel: undefined, ...cambio });
    const ponerFondo = (fondo, nombre) => E.setPag({ fondo }, nombre);
    const tema = this.P.ajustes.tema || {};

    const colores = el("div.ed-estilo-colores", { role: "radiogroup", "aria-label": "Color de fondo" }, [tema.fondo, ...COLORES].filter((x, i, l) => x && l.findIndex((y) => igual(y, x)) === i).map((col) => {
      const b = el("button", { type: "button", role: "radio", title: col, "aria-label": "Fondo " + col, style: { background: col }, onClick: () => ponerFondo(limpio({ tipo: "color", color: col }), "Color de fondo") });
      this.v.add(() => { const on = f().tipo !== "gradiente" && !f().css && igual(f().color, col); b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
      return b;
    }));
    c.append(seccion("Color de fondo", [
      colores,
      fila("Otro color", control(this.v, { tipo: "color", leer: () => f().color || "#ffffff", escribir: (col) => ponerFondo(limpio({ tipo: f().tipo === "gradiente" ? "gradiente" : "color", color: col }), "Color de fondo") })),
    ]));

    const degs = el("div.ed-estilo-degs", {}, DEGRADADOS.map(([n, a, b2]) => {
      const b = el("button", { type: "button", title: n, "aria-label": "Degradado " + n, style: { background: `linear-gradient(160deg, ${a}, ${b2})` }, onClick: () => ponerFondo(limpio({ tipo: "gradiente", color: a, gradiente: { a, b: b2, angulo: 160, tipo: "lineal" } }), "Degradado " + n) }, [el("small", { text: n })]);
      this.v.add(() => b.classList.toggle("on", f().tipo === "gradiente" && igual(f().gradiente?.a, a) && igual(f().gradiente?.b, b2)));
      return b;
    }));
    c.append(seccion("Degradados", [degs]));

    const papeles = el("div.ed-papeles", {}, PAPELES.map(([id, n]) => {
      const b = el("button", { type: "button", title: n, "aria-label": n, style: { background: muestraPapel(id) }, onClick: () => ponerFondo({ ...fondoDePapel(id, f()), ...(id === "liso" && f().color ? { color: f().color } : {}) }, "Estilo de hoja: " + n) }, [el("small", { text: n })]);
      this.v.add(() => b.classList.toggle("on", (f().papel || (f().css ? "" : "liso")) === id));
      return b;
    }));
    c.append(seccion("Estilo de hoja", [papeles]));

    const foto = boton(I("imagen", "Foto de fondo"), async () => {
      const [id] = await elegir(app, "imagen", { titulo: "Foto de fondo" });
      if (id) E.setPag({ "fondo.imagen": { asset: id, ajuste: "cover", opacidad: 1, desenfoque: 0, pos: "center" } }, "Foto de fondo");
    }, "chico");
    const quitarFoto = boton("Quitar la foto", () => E.setPag({ "fondo.imagen": null }, "Quitar foto de fondo"), "chico");
    this.v.add(() => { quitarFoto.hidden = !f().imagen?.asset; });
    c.append(seccion("Más", [
      el("div.ed-botonera", {}, [foto, quitarFoto]),
      el("div.ed-botonera", {}, [
        boton(I("paginas", "Este fondo en todas las páginas"), () => {
          const fondo = JSON.parse(JSON.stringify(f()));
          E.transaccion("Fondo en todas las páginas", () => { for (const pid of this.P.orden) if (pid !== E.paginaId) E.setPag({ fondo: JSON.parse(JSON.stringify(fondo)) }, "Fondo", null, pid); });
          aviso("Listo: todas las páginas con este fondo ✨", 2200);
        }, "chico"),
        boton(I("diseno", "Tema sólo para esta hoja…"), () => app.temaDeHoja?.(), "chico"),
        boton(I("diseno", "Colores y letras del librito"), () => app.abrirSeccion("diseno"), "chico"),
      ]),
    ]));
  },
};
