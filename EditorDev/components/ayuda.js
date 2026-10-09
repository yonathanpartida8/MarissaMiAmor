/**
 * EL FOQUITO Y LA ABEJITA — consejos y compañía que no estorban.
 *
 * El foquito (esquina de abajo) brilla cuando hay un consejo nuevo para lo
 * que haces. Al tocarlo llega la abejita (mascota/abeja.js): da el consejo
 * del momento, se queda revoloteando, reacciona a lo que haces (insertar,
 * guardar, borrar…) y de vez en cuando dice algo de dialogos.txt
 * (mascota/dialogos.js). Las líneas con «-» lanzan el «hackeo» romántico
 * (mascota/glitch.js). Al volver a tocar el foquito se va volando.
 * Sin abejita, de vez en cuando aparece un consejito discreto (si se pide).
 * Todo se ajusta en ⚙ Configuración.
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";
import { Abeja } from "../mascota/abeja.js";
import { siguiente as dialogo, evento } from "../mascota/dialogos.js";
import { hackeo } from "../mascota/glitch.js";
import { PREF, alCambiar } from "../config/preferencias.js";

const VISTOS = "editordev:ayuda-vista";
const OCULTO = "editordev:ayuda-oculta";
const azar = (a, b) => a + Math.random() * (b - a);

/** Consejos generales (los automáticos y los de la abejita cuando no hay nada concreto). */
const GENERALES = [
  "Consejo: usa el modo rendimiento (⚙) si tienes muchos efectos.",
  "Puedes añadir nuevos recursos dejándolos en la carpeta assets/.",
  "Los diálogos de la abejita están en dialogos.txt: cámbialos cuando quieras.",
  "Puedes previsualizar un recurso antes de insertarlo (Recursos).",
  "Guarda seguido tu creación (o deja el guardado automático encendido).",
  "Toca la notita musical de arriba para apagar o encender la música.",
  "En «Bloques» hay secciones ya armadas: portada, carta, galería, frase… con tus colores.",
  "Cualquier cosa puede reaccionar al tocarla: corazones, destellos, un latido… (Efectos al tocar).",
  "Deja un .html en assets/elementos/ y aparece en Recursos con el nombre del archivo.",
  "En ⚙ → Estilo puedes probar «Baddie»: negro, rosa fuerte y brillo (yo también me arreglo).",
];

const TIPS = {
  hoja: [
    "Toca algo para elegirlo y luego arrástralo para moverlo. Con el dedo, nada se mueve si no lo elegiste antes: deslizar encima sólo desplaza la hoja.",
    "Mantén presionado un elemento para ver sus ajustes: luz, exposición, brillo, contraste, saturación, temperatura y opacidad.",
    "Dos dedos sobre la hoja acercan o alejan; sobre lo elegido, le cambian el tamaño y lo giran.",
    "Desliza desde el borde izquierdo (o toca el botón de menú) para abrir todas las herramientas.",
    { t: "«Probar» abre la página a pantalla completa, como la verá ella.", a: ".ed-probar" },
    { t: "Desliza rápido de lado sobre la hoja entera para pasar a la otra página.", a: null },
    { t: "Con esta flecha sales del editor; antes te pregunto si quieres guardar.", a: ".ed-volver" },
  ],
  varios: ["Con varios elegidos, muévelos juntos o alinéalos desde la barra de abajo.", "Mantén presionado uno de ellos para ajustar la luz y el color de todos a la vez."],
  "el:imagen": ["Toca dos veces la foto para encuadrarla.", "Mantén presionado para ajustar luz, exposición y temperatura.", "En Efectos, cada filtro se ve antes de usarlo («Atrás» lo deja como estaba)."],
  "el:texto": ["Toca dos veces el texto para escribir. Con el teclado abierto, la hoja se queda quieta y el texto se ve encima del teclado.", "Cambia la letra, el tamaño y el color desde la barra de abajo."],
  "el:html": ["Toca dos veces para abrir su código: pega tu index.html entero, Guardar y luego Probar.", "Si tu HTML usa fotos o música, súbelas en «Archivos» dentro del editor de HTML y se enlazan solas."],
  "el:boton": ["Elige qué hace al tocarlo (pasar de página, mostrar algo, sonar…) en el inspector, sección «Al tocarlo»."],
  "el:escena3d": ["En el librito, la escena se gira con el dedo y se acerca con dos.", "Cambia la figura, el color y la luz desde la barra de abajo."],
  linea: [
    "Toca un clip para elegirlo y luego arrástralo; si no está elegido, deslizar sólo mueve la línea.",
    "Mantén presionado un clip para agarrarlo de una vez (vibra) y llevarlo a otro momento.",
    "Arrastra el asa de colores de arriba para hacer la línea más alta o más baja; bájala del todo para cerrarla.",
    "Toca dos veces un clip para su menú: que aparezca o se vaya en el cabezal, probarlo solo…",
    "Las pistas de audio también están aquí: arrástralas o recorta sus bordes.",
  ],
  html: [
    "Pega tu página entera (con <!DOCTYPE html>, <style> y <script>) y pulsa «Guardar». No hay que separar nada.",
    { t: "«Probar» la abre a pantalla completa, como una página de verdad.", a: ".ed-probar" },
    "Si sales con cambios sin guardar, te pregunta antes: nada se pierde sin querer.",
  ],
  "sec:animar": ["Toca una animación para verla en lo elegido; «Usar» la deja puesta y «Atrás» no cambia nada.", "Crea las tuyas con CSS (@keyframes), JSON o JS en «Mías», o déjalas en assets/animaciones/."],
  "sec:efectos": ["Cada efecto se previsualiza en la hoja con su intensidad antes de usarlo.", "Los filtros de assets/efectos/ aparecen solos al final."],
  "sec:transiciones": ["Toca una transición para verla de la página anterior a ésta y elegir si va en esta página o en todo el librito."],
  "sec:gifs": ["Busca lo que quieras; abajo se cargan más solos.", "Al previsualizar un GIF puedes quitarle el fondo sin perder la animación."],
  "sec:stickers": ["Los stickers ya vienen sin fondo. Los tuyos (assets/stickers/) salen arriba."],
  "sec:audio": ["Una pista suena en un momento de la página: muévela y recórtala en la línea de tiempo.", "Mientras editas suena la música de la carpeta DevMusic/ y baja sola cuando suena otra cosa."],
  "sec:html": ["«Nueva página HTML» crea una página en blanco con tu HTML a pantalla completa."],
  "sec:diseno": ["Un fondo con HTML (partículas, degradados…) va detrás de todo y nunca estorba al editar."],
  "sec:herramientas": ["Aquí apagas o subes los sonidos del editor y decides si se guarda solo.", "En «Botones para pasar página» eliges las flechas del librito (salen de assets/deslizar/)."],
  "el:video": ["En el inspector eliges si el vídeo empieza solo o al tocarlo, su marco y un resplandor con sus propios colores.", "Mantén presionado el vídeo para ajustar su luz y su color.", "Prende «Resplandor épico» y elige un estilo (Sueño, Cine, VHS…): el brillo sale de los colores del vídeo.", "Si el teléfono no deja que suene solo, empieza en silencio y aparece «Toca para el sonido»."],
  "el:forma": ["En «Efectos al tocar» puedes hacer que suelte corazones o que lata cuando ella lo toque."],
  "sec:bloques": ["Toca un bloque y aparece en un hueco libre de la página, ya agrupado.", "Doble toque en una parte del bloque para editarla sola; «Desagrupar» los suelta del todo."],
  "sec:componentes": ["Arriba eliges el fondo de las vistas previas: oscuro para ver brillos y detalles.", "Tus elementos de assets/elementos/ salen primero, con el nombre de su archivo."],
  zonas: ["Arrastra sobre el elemento para dibujar una zona; toca una para decirle qué hace.", "«Probar» esconde las marcas: toca como lo haría ella. Al volver a editar, reaparecen.", "Las zonas se mueven y giran con el elemento: no hay que reacomodarlas."],
  "el:componente": ["Las piezas salen de assets/<carpeta>/: deja ahí un .html (con su CSS y JS dentro) y aparece solo en «Piezas».", "Con «Zonas táctiles» (en Efectos al tocar) haces que cada parte del HTML haga algo distinto: un sonido, corazones, pasar de página…"],
};

const textoDe = (tip) => (typeof tip === "string" ? tip : tip.t);
const metaDe = (tip) => (typeof tip === "string" ? null : tip.a);

export class Ayuda {
  constructor(app) {
    this.app = app;
    try { this.vistos = new Set(JSON.parse(localStorage.getItem(VISTOS) || "[]")); } catch (e) { this.vistos = new Set(); }
    try { if (localStorage.getItem(OCULTO) === "1") PREF.ayudas = false; } catch (e) { /* nada */ }
    this.i = 0;
    this.abeja = new Abeja(app);
    this.boton = el("button.ed-foco", { type: "button", title: "Consejos y la abejita", "aria-label": "Llamar a la abejita (consejos)", html: ico("foco") });
    this.boton.addEventListener("click", () => this.alternar());
    document.body.append(this.boton);
    const pronto = () => { if (this._r) return; this._r = requestAnimationFrame(() => { this._r = 0; this.revisar(); }); };
    const E = app.estado;
    E.on("sel", pronto);
    E.on("actual", pronto);
    addEventListener("ed-hoja", pronto);
    document.addEventListener("click", pronto, true);
    addEventListener("resize", () => { if (this.abeja.viva && !this.abeja.hablando) this.abeja.volarA(this.abeja.casa(), 400); else if (this.abeja.globoVisible) this.abeja._colocar(); });
    // Reacciones a lo que pasa en el editor.
    this._cuantos = this._contar();
    E.on("els", () => {
      const n = this._contar(), antes = this._cuantos;
      this._cuantos = n;
      if (!this.abeja.viva || this.abeja.hablando) return;
      if (n > antes) { this.abeja.reaccionar("insertar"); if (Math.random() < 0.35) this.abeja.decir(["¡Qué lindo quedó eso! ✨", "Ooh, me gusta 🥹", "¡Eso! Así se hace 🐝"][Math.random() * 3 | 0], { cara: "feliz", dura: 3200 }); }
      else if (n < antes && Math.random() < 0.3) this.abeja.reaccionar("borrar");
    });
    E.on("sel", () => { if (this.abeja.viva && !this.abeja.hablando && Math.random() < 0.15) { const id = E.sel[0]; const n = id && document.querySelector(`.ed-hoja [data-id="${id}"]`); if (n) this.abeja.visitar(n.getBoundingClientRect()); } });
    addEventListener("ed-evento", (ev) => {
      if (!this.abeja.viva) return;
      if (ev.detail === "guardado") { this.abeja.reaccionar("guardar"); this.abeja.decir("¡Guardadito! 💾💖", { cara: "enamorada", dura: 2600 }); }
      if (ev.detail === "exportado") { this.abeja.reaccionar("carino"); this.abeja.decir("¡Tu librito está listo! Qué orgullo 🥹", { cara: "enamorada", dura: 3600 }); }
    });
    alCambiar((p, c) => {
      if ("ayudas" in c) this.revisar();
      if (("abeja" in c && !p.abeja) || ("ayudas" in c && !p.ayudas)) this.irse();
      if ("dialogos" in c || "frecuencia" in c) this._programarCharla();
      if ("consejos" in c) this._programarConsejo();
    });
    this.revisar();
    this._programarConsejo();
  }

  _contar() { return this.app.estado.pagina?.els.length || 0; }

  /** Dónde está quien edita ahora mismo. */
  contexto() {
    const app = this.app;
    if (document.body.classList.contains("ed-probando")) return null;
    if (document.querySelector(".ed-codigo-pantalla")) return "html";
    if (app.tiempo?.abierta) return "linea";
    if (app.zonas?.id) return "zonas";
    const abierto = app.lateral?.abierto || document.querySelector(".ed-hoja-sec.abierta") || (!document.body.classList.contains("sin-panel") && !matchMedia("(max-width: 1023px)").matches);
    const sel = app.estado.sel;
    if (sel.length > 1) return "varios";
    const e = app.estado.unico;
    if (e && TIPS["el:" + e.tipo]) return "el:" + e.tipo;
    if (abierto && app.seccion && TIPS["sec:" + app.seccion]) return "sec:" + app.seccion;
    return "hoja";
  }

  revisar() {
    const k = this.contexto();
    this.k = k;
    this.boton.hidden = !PREF.ayudas;
    this.boton.classList.toggle("nuevo", !!k && !this.vistos.has(k) && !this.abeja.viva);
    this.boton.classList.toggle("fuera", !k);
    this.boton.classList.toggle("con-abeja", this.abeja.viva);
    document.body.classList.toggle("ed-con-abeja", this.abeja.viva);
    if (!k && this.abeja.viva) this.irse();
  }

  alternar() { if (this.abeja.viva) this.irse(); else this.venir(); }

  venir() {
    if (this.abeja.viva || !PREF.abeja) { if (!PREF.abeja) this._consejito("La abejita está apagada en ⚙ Configuración → Abejita."); return; }
    this._consejitoFuera();
    const r = this.boton.getBoundingClientRect();
    this.abeja.venir({ x: r.left + r.width / 2, y: r.top + r.height / 2 }).then(() => this.hablar(0));
    this.vistos.add(this.k || "hoja");
    try { localStorage.setItem(VISTOS, JSON.stringify([...this.vistos])); } catch (e) { /* nada */ }
    this._programarCharla();
    this.revisar();
  }

  irse() {
    if (!this.abeja.viva) return;
    clearTimeout(this._charla);
    this.abeja.irse();
    this.revisar();
  }

  _tips() { return TIPS[this.k] || TIPS.hoja; }

  /** Un consejo del momento (si habla de un botón, vuela a enseñárselo). */
  async hablar(i) {
    const tips = this._tips();
    this.i = ((i % tips.length) + tips.length) % tips.length;
    const tip = tips[this.i];
    const sel = metaDe(tip);
    const n = sel && document.querySelector(sel);
    if (n && n.offsetParent) {
      n.classList.add("ed-senalado"); clearTimeout(this._sen); this._sen = setTimeout(() => n.classList.remove("ed-senalado"), 2400);
    }
    this.abeja.decir(textoDe(tip), {
      cara: this.i === 0 ? "feliz" : "normal",
      cuenta: tips.length > 1 ? `${this.i + 1} de ${tips.length}` : "",
      botones: [
        ...(tips.length > 1 ? [[`${ico("refrescar")}<span>Otro</span>`, () => this.hablar(this.i + 1)]] : []),
        [`<span>Gracias</span>`, () => this.abeja.callar(), "primario"],
      ],
    });
  }

  /* ── Charlitas de dialogos.txt ─────────────────────────────────── */
  _programarCharla() {
    clearTimeout(this._charla);
    if (!this.abeja.viva || !PREF.dialogos) return;
    const s = Math.max(15, +PREF.frecuencia || 75);
    this._charla = setTimeout(() => this._charlar(), azar(0.7, 1.3) * s * 1000);
  }

  async _charlar() {
    if (!this.abeja.viva) return;
    if (document.hidden || this.abeja.hablando || document.body.classList.contains("ed-probando") || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla")) return this._programarCharla();
    const d = await dialogo();
    if (d.tipo === "hackeo") await this.hackeo(d.texto);
    else this.abeja.decir(d.texto, { cara: /💖|🥹|amor|bbsita|lind|bonit/i.test(d.texto) ? "enamorada" : "feliz", dura: Math.min(9000, 2600 + d.texto.length * 55) });
    this._programarCharla();
  }

  /** El evento especial (también lo prueba Configuración). */
  async hackeo(texto) {
    if (!texto) texto = (await evento()).texto;
    if (!this.abeja.viva && PREF.abeja) { this.venir(); await new Promise((ok) => setTimeout(ok, 1500)); }
    this.abeja.callar();
    await hackeo(this.app, texto, this.abeja.viva ? this.abeja : null);
  }

  /** Una frase de dialogos.txt ya (Configuración → «Que diga algo»). */
  async decirAlgo() {
    if (!this.abeja.viva) { this.venir(); await new Promise((ok) => setTimeout(ok, 1400)); }
    clearTimeout(this._charla);
    this.abeja.callar();
    this._charlar();
  }

  /* ── Consejos automáticos (sin abejita): discretos y pocos ─────── */
  _programarConsejo() {
    clearTimeout(this._cons);
    if (!PREF.consejos || !PREF.ayudas) return;
    this._dados = this._dados || 0;
    if (this._dados >= 3) return;
    this._cons = setTimeout(() => {
      if (document.hidden || this.abeja.viva || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla") || document.body.classList.contains("ed-probando")) return this._programarConsejo();
      this._dados++;
      this._consejito(GENERALES[Math.random() * GENERALES.length | 0]);
      this._programarConsejo();
    }, azar(180, 300) * 1000);
  }

  _consejito(texto) {
    this._consejitoFuera();
    const c = el("button.ed-consejito", { type: "button", "aria-live": "polite", html: `${ico("foco")}<span></span>`, onClick: () => this._consejitoFuera() });
    c.lastChild.textContent = texto;
    document.body.append(c);
    this._cn = c;
    requestAnimationFrame(() => c.classList.add("ver"));
    clearTimeout(this._tcn);
    this._tcn = setTimeout(() => this._consejitoFuera(), 6500);
  }

  _consejitoFuera() { const c = this._cn; this._cn = null; if (c) { c.classList.remove("ver"); setTimeout(() => c.remove(), 300); } }

  /** Esconder o mostrar el foquito (compatibilidad con Herramientas). */
  ponerOculto(on) {
    try { localStorage.setItem(OCULTO, on ? "1" : "0"); } catch (e) { /* nada */ }
    import("../config/preferencias.js").then((m) => m.poner({ ayudas: !on }));
  }

  cerrar() { this.irse(); }
}
