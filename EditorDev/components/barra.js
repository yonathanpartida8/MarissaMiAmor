/**
 * LA BARRA CONTEXTUAL — lo de siempre a un toque (como en Canva).
 *
 * Cambia según lo que esté elegido: letra, tamaño, color y estilo para un
 * texto; marco y forma para una foto; probar y fondo para un componente…
 * Y para todo: animar, transparencia, posición y «más». Lo avanzado sigue
 * en el inspector, pero lo normal se hace desde aquí sin buscar.
 *
 * En la computadora va sobre el lienzo; en el teléfono, abajo, encima de
 * las pestañas, con botones grandes y desplazable de lado.
 */
import { el, control, Vinculos, popover, menu, esMovil, elegirFuente } from "./ui.js";
import { leerRuta } from "../core/estado.js";
import { ico } from "./iconos.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const PASTEL = ["#3b2a3f", "#ffffff", "#d8397a", "#ff8fb8", "#ffc4d9", "#f7b787", "#ffe08a", "#9fd8c2", "#a7c7e7", "#c3b1e1", "#8e2f86", "#f6efe6"];

export class BarraContextual {
  constructor(app, raiz) {
    this.app = app;
    this.E = app.estado;
    this.raiz = raiz;
    this.v = new Vinculos();
    const E = this.E;
    const rehacer = () => { cancelAnimationFrame(this._r); this._r = requestAnimationFrame(() => this.pintar()); };
    E.on("sel", rehacer);
    E.on("actual", rehacer);
    E.on("cargado", rehacer);
    E.on("el", ({ e, ruta, rutas }) => {
      if (!E.sel.includes(e)) return;
      if ((rutas || [ruta]).some((x) => /^(tipo|grupo|bloqueado|componente\.sinFondo|imagen\.asset|escena3d\.fuente)$/.test(x || ""))) rehacer();
      else { cancelAnimationFrame(this._rv); this._rv = requestAnimationFrame(() => this.v.refrescar()); }
    });
  }

  _b(html, titulo, al, clase = "") {
    return el("button.ed-cb" + (clase ? "." + clase.split(" ").join(".") : ""), { type: "button", title: titulo, "aria-label": titulo, html, onClick: (ev) => al(ev.currentTarget) });
  }

  /** Un control ligado a una ruta del elemento elegido (o de todos los elegidos). */
  _ctl(ruta, op) {
    const E = this.E;
    return control(this.v, {
      ...op,
      leer: () => { const x = E.seleccionados[0]; return x ? leerRuta(x, ruta) ?? op.def : undefined; },
      escribir: (val) => {
        E.transaccion(op.nombre || "Editar", () => { for (const x of E.seleccionados) E.setEl(x.id, { [ruta]: val }, op.nombre || "Editar", ruta + "barra"); }, ruta + "barra");
        if (op.alto) for (const x of E.seleccionados) this.app.lienzo.ajustarAlto(x.id);
      },
    });
  }

  _color(ruta, titulo, def) {
    const E = this.E;
    const muestra = el("i.ed-cb-muestra");
    const b = this._b("", titulo, (a) => {
      const pon = (c) => { E.transaccion(titulo, () => { for (const x of E.seleccionados) E.setEl(x.id, { [ruta]: c }, titulo); }); };
      const tema = this.E.proyecto.ajustes.tema;
      const colores = [...new Set([tema.texto, tema.acento, tema.fondo, ...PASTEL])];
      popover(a, [
        el("b.ed-pop-t", { text: titulo }),
        el("div.ed-pop-colores", {}, colores.map((c) => el("button", { type: "button", style: { background: c }, title: c, onClick: () => pon(c) }))),
        this._ctl(ruta, { tipo: "color", nombre: titulo }),
      ]);
      this.v.refrescar();
    }, "color");
    b.append(muestra);
    this.v.add(() => { const x = this.E.seleccionados[0]; muestra.style.background = (x && leerRuta(x, ruta)) || def || "#fff"; });
    return b;
  }

  pintar() {
    const r = this.raiz;
    const E = this.E;
    this.v.vaciar();
    r.textContent = "";
    if (!E.proyecto || !E.pagina) { r.hidden = true; return; }
    r.hidden = false;
    const sel = E.seleccionados;
    const A = this.app.acciones;
    const L = this.app.lienzo;
    const ins = this.app.insp;
    const grupo = (...xs) => el("div.ed-cb-grupo", {}, xs.filter(Boolean));
    const partes = [];
    if (!sel.length) {
      partes.push(grupo(
        this._b(I("diseno", "Fondo"), "Fondo de la página", () => { ins.abrir("diseno", "Fondo"); }),
        this._b(ico("transiciones") + "<span>Transición</span>", "Transición al llegar", () => this.app.abrirSeccion("transiciones")),
        this._b(ico("audio") + "<span>Música</span>", "Música de la página", () => this.app.abrirSeccion("audio")),
        this._b(ico("animar") + "<span>Animar página</span>", "Animaciones de la página", () => ins.abrir("animar")),
        this._b(I("tiempo", "Tiempo"), "Línea de tiempo", () => this.app.tiempo.alternar()),
      ));
      partes.push(el("small.ed-cb-pista", { text: "Toca algo de la hoja para editarlo" }));
    } else {
      const uno = sel.length === 1 ? sel[0] : null;
      const t = uno?.tipo;
      if (sel.every((x) => x.tipo === "texto")) {
        const fuente = this._b("", "Letra", (a) => elegirFuente(a, () => E.seleccionados[0]?.texto?.fuente, (f) => {
          E.transaccion("Letra", () => { for (const x of E.seleccionados) E.setEl(x.id, { "texto.fuente": f }, "Letra"); });
        }), "fuente");
        this.v.add(() => { const f = E.seleccionados[0]?.texto?.fuente || "—"; fuente.textContent = f.split(",")[0].replace(/["']/g, ""); fuente.style.fontFamily = RT.pilaFuente(f); });
        const tam = this._ctl("texto.tam", { tipo: "numero", min: 6, max: 300, nombre: "Tamaño", alto: true });
        const paso = (d) => this._b(ico(d > 0 ? "mas" : "menos"), d > 0 ? "Más grande" : "Más chico", () => { E.transaccion("Tamaño", () => { for (const x of E.seleccionados) E.setEl(x.id, { "texto.tam": Math.max(6, Math.round((x.texto.tam || 24) + d)) }, "Tamaño", "tam"); }, "tam"); for (const x of E.seleccionados) L.ajustarAlto(x.id); }, "chico");
        const conm = (ruta, html, titulo, on, off) => {
          const b = this._b(html, titulo, () => { const x = E.seleccionados[0]; const v = leerRuta(x, ruta) === on ? off : on; E.transaccion(titulo, () => { for (const y of E.seleccionados) E.setEl(y.id, { [ruta]: v }, titulo); }); }, "chico");
          this.v.add(() => b.classList.toggle("on", leerRuta(E.seleccionados[0] || {}, ruta) === on));
          return b;
        };
        const alin = this._b("", "Alineación", () => {
          const orden = ["left", "center", "right", "justify"];
          const x = E.seleccionados[0];
          const v = orden[(orden.indexOf(x.texto.alin || "center") + 1) % 4];
          E.transaccion("Alinear texto", () => { for (const y of E.seleccionados) E.setEl(y.id, { "texto.alin": v }, "Alinear texto"); });
        }, "chico");
        this.v.add(() => { const k = { left: "alinIzq", center: "alinCentro", right: "alinDer", justify: "alinJust" }[E.seleccionados[0]?.texto?.alin || "center"]; if (alin._k !== k) { alin._k = k; alin.innerHTML = ico(k); } });
        partes.push(grupo(fuente, paso(-2), tam, paso(2)));
        partes.push(grupo(this._color("texto.color", "Color del texto"), conm("texto.peso", "<b>B</b>", "Negrita", 700, 400), conm("texto.cursiva", "<i>I</i>", "Cursiva", true, false), conm("texto.subrayado", "<u>U</u>", "Subrayado", true, false), alin,
          this._b(I("espaciado", "Espaciado"), "Espaciado", (a) => popover(a, [el("b.ed-pop-t", { text: "Espaciado" }),
            el("label.ed-fila", {}, [el("span.ed-et", { text: "Letras" }), this._ctl("texto.interletra", { tipo: "rango", min: -4, max: 20, paso: 0.5, def: 0, unidad: "px", alto: true })]),
            el("label.ed-fila", {}, [el("span.ed-et", { text: "Líneas" }), this._ctl("texto.interlinea", { tipo: "rango", min: 0.8, max: 2.6, paso: 0.05, def: 1.3, alto: true })])]), "chico"),
          uno ? this._b(ico("editar"), "Escribir", () => L.editarTexto(uno), "chico") : null));
      } else if (t === "imagen") {
        partes.push(grupo(
          this._b(uno.imagen?.asset ? I("cambiar", "Cambiar") : I("mas", "Foto"), "Foto", () => A.pedirArchivoPara(uno)),
          uno.imagen?.asset ? this._b(I("recortar", "Recortar"), "Recortar / encuadrar", () => L.recortar(uno)) : null,
          this._b(I("marco", "Marco"), "Marco", (a) => popover(a, [el("b.ed-pop-t", { text: "Marco" }), this._ctl("imagen.marco", { tipo: "select", def: "", opciones: [["", "Ninguno"], ["polaroid", "Polaroid"], ["cinta", "Con cinta"], ["washi", "Washi"], ["vintage", "Vintage"], ["sello", "Sello"], ["doble", "Doble"]] })])),
          this._b(I("forma", "Forma"), "Forma", (a) => popover(a, [el("b.ed-pop-t", { text: "Forma" }), this._ctl("imagen.forma", { tipo: "select", def: "", opciones: [["", "Normal"], ["circulo", "Círculo"], ["corazon", "Corazón"], ["estrella", "Estrella"], ["arco", "Arco"], ["gota", "Gota"], ["hexagono", "Hexágono"], ["nube", "Nube"]] })])),
          this._b(I("filtros", "Filtros"), "Filtros", () => ins.abrir("diseno", "Foto")),
          // Un GIF o sticker animado: quitarle el fondo sin perder la animación.
          uno.imagen?.gif || /gif|webp/.test(E.proyecto.assets[uno.imagen?.asset]?.mime || "") ? this._b(I("tijeras", "Quitar fondo"), "Quitar el fondo (la animación se conserva)", () => this.app.gifs.quitarFondoGif(uno)) : null,
        ));
      } else if (t === "forma") {
        partes.push(grupo(this._color("forma.relleno", "Relleno"), this._b(I("borde", "Borde"), "Borde", (a) => popover(a, [el("b.ed-pop-t", { text: "Borde" }), el("label.ed-fila", {}, [el("span.ed-et", { text: "Grosor" }), this._ctl("forma.grosor", { tipo: "rango", min: 0, max: 30, def: 0, unidad: "px" })]), el("label.ed-fila", {}, [el("span.ed-et", { text: "Color" }), this._ctl("forma.trazo", { tipo: "color" })])]))));
      } else if (t === "dibujo") partes.push(grupo(this._color("dibujo.color", "Color")));
      else if (t === "trazo") partes.push(grupo(this._color("trazo.color", "Color"), this._b(I("borde", "Grosor"), "Grosor", (a) => popover(a, [el("b.ed-pop-t", { text: "Grosor" }), this._ctl("trazo.grosor", { tipo: "rango", min: 1, max: 40, unidad: "px" })]))));
      else if (t === "boton") partes.push(grupo(this._color("boton.fondo", "Color del botón"), this._color("boton.color", "Color de la letra"), this._b(I("editar", "Texto"), "Texto y acción", () => ins.abrir("diseno", "Botón")), this._b(I("toque", "Al tocarlo"), "Qué hace al tocarlo", () => ins.abrir("diseno", "Al tocarlo"))));
      else if (t === "componente") {
        const k = uno.componente || {};
        partes.push(grupo(
          this._b(I("herramientas", "Personalizar"), "Parámetros del componente", () => ins.abrir("diseno", "Componente")),
          this._b(ico("play") + "<span>Probar</span>", "Probar aquí (tocarlo de verdad)", () => L.probarAqui(uno)),
          this._b(k.sinFondo ? I("deshacer", "Poner fondo") : I("tijeras", "Eliminar fondo"), k.sinFondo ? "Volver a poner su fondo" : "Quitar su fondo (sólo en esta copia)", () => E.setEl(uno.id, { "componente.sinFondo": !k.sinFondo }, k.sinFondo ? "Poner fondo" : "Eliminar fondo")),
        ));
      } else if (t === "album" || t === "carrusel") partes.push(grupo(this._b(I("mas", "Fotos"), "Añadir fotos", () => A.pedirArchivoPara(uno)), this._b(I("herramientas", "Opciones"), "Opciones", () => ins.abrir("diseno"))));
      else if (t === "html") partes.push(grupo(this._b(I("html", "Editar HTML"), "Editar HTML", () => A.editarHtml(uno)), this._b(I("play", "Probar"), "Probar la página a pantalla completa", () => this.app.prueba.abrir()), this._b(I("toque", "Aquí"), "Tocarlo aquí mismo, en la hoja", () => L.probarAqui(uno), "chico")));
      else if (t === "pagina") partes.push(grupo(this._b(I("editar", "Hacer editable"), "Sacar textos y fotos a capas", () => this.app.importar.hacerEditable(uno)), this._b(I("play", "Probar"), "Probar aquí", () => L.probarAqui(uno))));
      else if (t === "video") partes.push(grupo(this._b(I("cambiar", "Cambiar"), "Cambiar el vídeo", () => A.pedirArchivoPara(uno)), this._b(I("herramientas", "Opciones"), "Cómo se reproduce", () => ins.abrir("diseno", "Vídeo"))));
      else if (t === "escena3d") partes.push(grupo(this._color("escena3d.color", "Color"), this._b(I("cubo", "3D"), "Figura, luz y cámara", () => ins.abrir("diseno", "Escena 3D")), this._b(I("orbita", "Probar"), "Girarla con el dedo aquí", () => L.probarAqui(uno))));
      if (sel.length > 1) {
        const mismo = sel.every((x) => x.grupo && x.grupo === sel[0].grupo);
        partes.push(grupo(
          mismo ? this._b(I("desenlazar", "Desagrupar"), "Desagrupar", () => A.desagrupar()) : this._b(I("enlazar", "Agrupar"), "Agrupar", () => A.agrupar()),
          this._b(I("alinearH", "Alinear"), "Alinear", (a) => A.menuAlinear(a)),
        ));
      }
      // Lo de todos.
      partes.push(grupo(
        this._b(ico("animar") + "<span>Animar</span>", "Animar", () => (esMovil() ? this.app.abrirSeccion("animar") : ins.abrir("animar"))),
        this._b(ico("luz") + "<span>Ajustes</span>", "Luz, brillo, contraste, color (o mantén presionado)", () => this.app.ajustes.abrir(sel[0].id)),
        this._b(ico("efectos") + "<span>Efectos</span>", "Efectos con previsualización", () => this.app.abrirSeccion("efectos")),
        this._b(ico("toque") + "<span>Al tocar</span>", "Efectos al tocar, con vista previa", () => this.app.abrirSeccion("toques")),
        this._b(ico("opacidad"), "Transparencia", (a) => popover(a, [el("b.ed-pop-t", { text: "Transparencia" }), this._ctl("opacidad", { tipo: "rango", min: 0, max: 1, paso: 0.01, def: 1, nombre: "Opacidad" })]), "chico"),
        this._b(ico("capas"), "Posición", (a) => popover(a, [
          el("b.ed-pop-t", { text: "Posición" }),
          el("div.ed-botonera", {}, [
            this._b(I("alFrente", "Al frente"), "Al frente", () => A.capa("frente"), "chico"), this._b(I("subirCapa", "Adelante"), "Adelante", () => A.capa("subir"), "chico"),
            this._b(I("bajarCapa", "Atrás"), "Atrás", () => A.capa("bajar"), "chico"), this._b(I("alFondo", "Al fondo"), "Al fondo", () => A.capa("fondo"), "chico"),
          ]),
          el("div.ed-botonera", {}, ["izq", "centroH", "der", "arriba", "centroV", "abajo"].map((m, i) => this._b(ico(["izqA", "alinearH", "derA", "arribaA", "centroV", "abajoA"][i]), "Alinear", () => A.alinear(m), "chico"))),
          el("div.ed-botonera", {}, [this._b(I("capas", "Ver capas"), "Capas", () => ins.abrir("capas"), "chico"), this._b(I("recuperar", "Traer a la hoja"), "Meterlo dentro de la hoja", () => L.traerALaHoja(E.sel), "chico")]),
        ]), "chico"),
        this._b(ico("mas"), "Más", (a) => menu(a, [
          { t: I("duplicar", "Duplicar"), al: () => A.duplicar() },
          { t: I("copiar", "Copiar"), al: () => A.copiar() },
          { t: I("pegar", "Pegar"), al: () => A.pegar(), off: !A.portapapeles },
          "-",
          { t: I("efectos", "Efectos"), al: () => ins.abrir("diseno", "Efectos") },
          { t: I("sonido", "Sonidos"), al: () => ins.abrir("diseno", "Sonidos") },
          { t: I("toque", "Al tocarlo…"), al: () => ins.abrir("diseno", "Al tocarlo") },
          { t: I("ojoNo", "Empieza escondido / tiempo…"), al: () => ins.abrir("diseno", "Visibilidad") },
          { t: I("mano", "Permisos…"), al: () => ins.abrir("diseno", "Permisos") },
          { t: sel.every((x) => x.bloqueado) ? I("abierto", "Desbloquear") : I("candado", "Bloquear"), al: () => A.alternar("bloqueado") },
          { t: I("ojo", "Ocultar en el editor"), al: () => A.alternar("oculto") },
          "-",
          { t: I("borrar", "Borrar"), al: () => A.borrar(), peligro: true },
        ]), "chico"),
      ));
    }
    r.append(...partes);
    this.v.refrescar();
    r.classList.toggle("movil", esMovil());
  }
}
