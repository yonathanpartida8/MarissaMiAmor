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
import { el, control, Vinculos, popover, menu, esMovil } from "./ui.js";
import { leerRuta } from "../core/estado.js";
import { ico } from "./iconos.js";

const RT = window.LibritoRT;
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
    E.on("el", ({ e, ruta }) => {
      if (!E.sel.includes(e)) return;
      if (/^(tipo|grupo|bloqueado|componente\.sinFondo|imagen\.asset)$/.test(ruta || "")) rehacer();
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
        this._b("🎨 <span>Fondo</span>", "Fondo de la página", () => { ins.abrir("diseno", "Fondo"); }),
        this._b(ico("transiciones") + "<span>Transición</span>", "Transición al llegar", () => this.app.abrirSeccion("transiciones")),
        this._b(ico("audio") + "<span>Música</span>", "Música de la página", () => this.app.abrirSeccion("audio")),
        this._b(ico("animar") + "<span>Animar página</span>", "Animaciones de la página", () => ins.abrir("animar")),
        this._b("⏱ <span>Tiempo</span>", "Línea de tiempo", () => this.app.tiempo.alternar()),
      ));
      partes.push(el("small.ed-cb-pista", { text: "Toca algo de la hoja para editarlo" }));
    } else {
      const uno = sel.length === 1 ? sel[0] : null;
      const t = uno?.tipo;
      if (sel.every((x) => x.tipo === "texto")) {
        const fuente = this._b("", "Letra", (a) => {
          const lista = el("div.ed-pop-fuentes", {}, Object.keys(RT.FUENTES).map((f) => el("button", { type: "button", text: f, style: { fontFamily: RT.pilaFuente(f) }, onClick: () => { E.transaccion("Letra", () => { for (const x of E.seleccionados) E.setEl(x.id, { "texto.fuente": f }, "Letra"); }); for (const x of E.seleccionados) L.ajustarAlto(x.id); } })));
          RT.cargarFuentes(Object.keys(RT.FUENTES));
          popover(a, [el("b.ed-pop-t", { text: "Letra" }), lista]);
        }, "fuente");
        this.v.add(() => { const f = E.seleccionados[0]?.texto?.fuente || "—"; fuente.textContent = f.split(",")[0].replace(/["']/g, ""); fuente.style.fontFamily = RT.pilaFuente(f); });
        const tam = this._ctl("texto.tam", { tipo: "numero", min: 6, max: 300, nombre: "Tamaño", alto: true });
        const paso = (d) => this._b(d > 0 ? "＋" : "－", d > 0 ? "Más grande" : "Más chico", () => { E.transaccion("Tamaño", () => { for (const x of E.seleccionados) E.setEl(x.id, { "texto.tam": Math.max(6, Math.round((x.texto.tam || 24) + d)) }, "Tamaño", "tam"); }, "tam"); for (const x of E.seleccionados) L.ajustarAlto(x.id); }, "chico");
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
        this.v.add(() => { alin.textContent = { left: "⇤", center: "↔", right: "⇥", justify: "☰" }[E.seleccionados[0]?.texto?.alin || "center"]; });
        partes.push(grupo(fuente, paso(-2), tam, paso(2)));
        partes.push(grupo(this._color("texto.color", "Color del texto"), conm("texto.peso", "<b>B</b>", "Negrita", 700, 400), conm("texto.cursiva", "<i>I</i>", "Cursiva", true, false), conm("texto.subrayado", "<u>U</u>", "Subrayado", true, false), alin,
          this._b("↕ <span>Espaciado</span>", "Espaciado", (a) => popover(a, [el("b.ed-pop-t", { text: "Espaciado" }),
            el("label.ed-fila", {}, [el("span.ed-et", { text: "Letras" }), this._ctl("texto.interletra", { tipo: "rango", min: -4, max: 20, paso: 0.5, def: 0, unidad: "px", alto: true })]),
            el("label.ed-fila", {}, [el("span.ed-et", { text: "Líneas" }), this._ctl("texto.interlinea", { tipo: "rango", min: 0.8, max: 2.6, paso: 0.05, def: 1.3, alto: true })])]), "chico"),
          uno ? this._b("✎", "Escribir", () => L.editarTexto(uno), "chico") : null));
      } else if (t === "imagen") {
        partes.push(grupo(
          this._b(uno.imagen?.asset ? "⟳ <span>Cambiar</span>" : "＋ <span>Foto</span>", "Foto", () => A.pedirArchivoPara(uno)),
          uno.imagen?.asset ? this._b("⌗ <span>Recortar</span>", "Recortar / encuadrar", () => L.recortar(uno)) : null,
          this._b("▢ <span>Marco</span>", "Marco", (a) => popover(a, [el("b.ed-pop-t", { text: "Marco" }), this._ctl("imagen.marco", { tipo: "select", def: "", opciones: [["", "Ninguno"], ["polaroid", "Polaroid"], ["cinta", "Con cinta"], ["washi", "Washi"], ["vintage", "Vintage"], ["sello", "Sello"], ["doble", "Doble"]] })])),
          this._b("◯ <span>Forma</span>", "Forma", (a) => popover(a, [el("b.ed-pop-t", { text: "Forma" }), this._ctl("imagen.forma", { tipo: "select", def: "", opciones: [["", "Normal"], ["circulo", "Círculo"], ["corazon", "Corazón"], ["estrella", "Estrella"], ["arco", "Arco"], ["gota", "Gota"], ["hexagono", "Hexágono"], ["nube", "Nube"]] })])),
          this._b("🎚 <span>Filtros</span>", "Filtros", () => ins.abrir("diseno", "Foto")),
        ));
      } else if (t === "forma") {
        partes.push(grupo(this._color("forma.relleno", "Relleno"), this._b("◌ <span>Borde</span>", "Borde", (a) => popover(a, [el("b.ed-pop-t", { text: "Borde" }), el("label.ed-fila", {}, [el("span.ed-et", { text: "Grosor" }), this._ctl("forma.grosor", { tipo: "rango", min: 0, max: 30, def: 0, unidad: "px" })]), el("label.ed-fila", {}, [el("span.ed-et", { text: "Color" }), this._ctl("forma.trazo", { tipo: "color" })])]))));
      } else if (t === "dibujo") partes.push(grupo(this._color("dibujo.color", "Color")));
      else if (t === "trazo") partes.push(grupo(this._color("trazo.color", "Color"), this._b("◌ <span>Grosor</span>", "Grosor", (a) => popover(a, [el("b.ed-pop-t", { text: "Grosor" }), this._ctl("trazo.grosor", { tipo: "rango", min: 1, max: 40, unidad: "px" })]))));
      else if (t === "boton") partes.push(grupo(this._color("boton.fondo", "Color del botón"), this._color("boton.color", "Color de la letra"), this._b("✎ <span>Texto</span>", "Texto y acción", () => ins.abrir("diseno", "Botón"))));
      else if (t === "componente") {
        const k = uno.componente || {};
        partes.push(grupo(
          this._b("⚙ <span>Personalizar</span>", "Parámetros del componente", () => ins.abrir("diseno", "Componente")),
          this._b(ico("play") + "<span>Probar</span>", "Probar aquí (tocarlo de verdad)", () => L.probarAqui(uno)),
          this._b(k.sinFondo ? "↺ <span>Poner fondo</span>" : "✂ <span>Eliminar fondo</span>", k.sinFondo ? "Volver a poner su fondo" : "Quitar su fondo (sólo en esta copia)", () => E.setEl(uno.id, { "componente.sinFondo": !k.sinFondo }, k.sinFondo ? "Poner fondo" : "Eliminar fondo")),
        ));
      } else if (t === "album" || t === "carrusel") partes.push(grupo(this._b("＋ <span>Fotos</span>", "Añadir fotos", () => A.pedirArchivoPara(uno)), this._b("⚙ <span>Opciones</span>", "Opciones", () => ins.abrir("diseno"))));
      else if (t === "html") partes.push(grupo(this._b("&lt;/&gt; <span>Editar HTML</span>", "Editar HTML", () => A.editarHtml(uno))));
      else if (t === "pagina") partes.push(grupo(this._b("✨ <span>Hacer editable</span>", "Sacar textos y fotos a capas", () => this.app.importar.hacerEditable(uno))));
      if (sel.length > 1) {
        const mismo = sel.every((x) => x.grupo && x.grupo === sel[0].grupo);
        partes.push(grupo(
          mismo ? this._b("✂ <span>Desagrupar</span>", "Desagrupar", () => A.desagrupar()) : this._b("⛓ <span>Agrupar</span>", "Agrupar", () => A.agrupar()),
          this._b("⊞ <span>Alinear</span>", "Alinear", (a) => A.menuAlinear(a)),
        ));
      }
      // Lo de todos.
      partes.push(grupo(
        this._b(ico("animar") + "<span>Animar</span>", "Animar", () => ins.abrir("animar")),
        this._b(ico("opacidad"), "Transparencia", (a) => popover(a, [el("b.ed-pop-t", { text: "Transparencia" }), this._ctl("opacidad", { tipo: "rango", min: 0, max: 1, paso: 0.01, def: 1, nombre: "Opacidad" })]), "chico"),
        this._b(ico("capas"), "Posición", (a) => popover(a, [
          el("b.ed-pop-t", { text: "Posición" }),
          el("div.ed-botonera", {}, [
            this._b("⇈ Al frente", "Al frente", () => A.capa("frente"), "chico"), this._b("⇡ Adelante", "Adelante", () => A.capa("subir"), "chico"),
            this._b("⇣ Atrás", "Atrás", () => A.capa("bajar"), "chico"), this._b("⇊ Al fondo", "Al fondo", () => A.capa("fondo"), "chico"),
          ]),
          el("div.ed-botonera", {}, ["izq", "centroH", "der", "arriba", "centroV", "abajo"].map((m, i) => this._b(["⇤", "↔", "⇥", "⤒", "↕", "⤓"][i], "Alinear", () => A.alinear(m), "chico"))),
          this._b("☰ Ver capas", "Capas", () => ins.abrir("capas"), "chico"),
        ]), "chico"),
        this._b(ico("mas"), "Más", (a) => menu(a, [
          { t: "⧉ Duplicar", al: () => A.duplicar() },
          { t: "📋 Copiar", al: () => A.copiar() },
          { t: "📥 Pegar", al: () => A.pegar(), off: !A.portapapeles },
          "-",
          { t: "✨ Efectos", al: () => ins.abrir("diseno", "Efectos") },
          { t: "🔔 Sonidos", al: () => ins.abrir("diseno", "Sonidos") },
          { t: "👆 Al tocarlo…", al: () => ins.abrir("diseno", "Al tocarlo") },
          { t: "🙈 Empieza escondido…", al: () => ins.abrir("diseno", "Visibilidad") },
          { t: sel.every((x) => x.bloqueado) ? "🔓 Desbloquear" : "🔒 Bloquear", al: () => A.alternar("bloqueado") },
          { t: "👁 Ocultar en el editor", al: () => A.alternar("oculto") },
          "-",
          { t: "🗑 Borrar", al: () => A.borrar(), peligro: true },
        ]), "chico"),
      ));
    }
    r.append(...partes);
    this.v.refrescar();
    r.classList.toggle("movil", esMovil());
  }
}
