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
import { aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { Abeja } from "../mascota/abeja.js";
import { siguiente as dialogo, evento, deContexto } from "../mascota/dialogos.js";
import { revisar, resumen } from "../mascota/revisor.js";
import { opinar, REACCIONES, una1 } from "../mascota/opina.js";
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
    { t: "Con esta flecha vuelves al menú principal.", a: ".ed-volver" },
  ],
  varios: ["Con varios elegidos, muévelos juntos o alinéalos desde la barra de abajo.", "Mantén presionado uno de ellos para ajustar la luz y el color de todos a la vez."],
  "el:imagen": ["Toca dos veces la foto para encuadrarla.", "Mantén presionado para ajustar luz, exposición y temperatura.", "En Efectos, cada filtro se ve antes de usarlo («Atrás» lo deja como estaba)."],
  "el:texto": ["Toca dos veces el texto para escribir. Con el teclado abierto, la hoja se queda quieta y el texto se ve encima del teclado.", "Cambia la letra, el tamaño y el color desde la barra de abajo."],
  "el:html": ["Toca dos veces para abrir su código: pega tu index.html entero, Guardar y luego Probar.", "Si tu HTML usa fotos o música, súbelas en «Archivos» dentro del editor de HTML y se enlazan solas."],
  "el:boton": ["Elige qué hace al tocarlo (pasar de página, mostrar algo, sonar…) en el inspector, sección «Qué hace al tocarlo»."],
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
  "sec:audio": ["Aquí eliges la música: sube tu canción (.mp3 o .wav) y decide si suena sólo en esta página o en todo el librito.", "Las pistas de audio y los efectos de sonido están en la línea de tiempo (la campanita y la onda)."],
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

/* Consejos AL MOMENTO: la primera vez que se hace algo, una frase cortita
   sobre eso mismo (cada una sale una vez; el bloque, hasta tres). Nunca
   durante un gesto, ni con una ventana abierta, ni más de uno cada tanto. */
const AL_MOMENTO = {
  bloque: ["Es un bloque: un toque lo elige entero. Toca dos veces una pieza para elegirla sola.", "Un toque, el bloque; dos toques, una sola pieza.", "Doble toque sobre una pieza para editarla sin soltar el bloque."],
  pieza: ["Editas sólo esta pieza del bloque. Toca fuera de la hoja para volver a elegirlo entero."],
  mover: ["Arrastra para mover; las guías rosas te dicen cuándo queda centrado o alineado.", "Con dos dedos sobre lo elegido lo giras y le cambias el tamaño a la vez."],
  iman: ["El imán la pegó a la guía. Para moverla libre, apaga «Imán» en Lienzo (o mantén Alt en la computadora).", "Se pegó al borde o al centro: así todo queda alineado sin esfuerzo."],
  girar: ["El botón redondo de girar la gira; en la computadora, con Mayús va de 15 en 15 grados.", "Cerca de 0°, 45° o 90° se acomoda sola para quedar derechita."],
  tamano: ["Las esquinas cambian el tamaño; los lados lo estiran sólo hacia ese lado.", "Si algo quedó chiquito, sus esquinas se apartan para que el dedo alcance el centro."],
  capas: ["Lo de arriba en «Capas» se ve delante; «Al frente» y «Al fondo» lo mandan de un toque.", "Arrastra el asa en «Capas» para ponerlo exactamente entre otros dos."],
  efectos: ["Cada efecto se ve en la hoja antes de usarlo; «Atrás» lo deja como estaba.", "En la previsualización ajustas la intensidad antes de tocar «Usar»."],
  video: ["En «Opciones» del vídeo eliges si empieza solo o al tocarlo, y si muestra controles.", "Sin controles el vídeo se sigue tocando: un toque lo pausa o le da sonido."],
};
const MOMENTOS = "editordev:consejos-al-momento";

/* El recorrido guiado: la abejita va a cada parte, la ilumina y la explica.
   Cada paso usa el primer selector que se vea (computadora o teléfono). */
const RECORRIDO = [
  { sel: null, cara: "feliz", t: "¡Hola! Te enseño cómo funciona todo en un ratito. Puedes salir cuando quieras y volver a verlo desde mi foquito o desde ⋯." },
  { sel: [".ed-riel"], t: "A la izquierda, siempre a la vista, están las herramientas de arriba hacia abajo: Pasar página, Bloques, Recursos, Elementos, Texto, Músicas, Imágenes y Videos; luego ADORNAR, TOCAR y AVANZADO. Toca una y se abre su panel." },
  { sel: [".ed-hoja"], t: "Ésta es tu página. Toca algo para elegirlo y arrástralo para moverlo; con dos dedos acercas o alejas. Doble toque en un texto para escribir." },
  { sel: [".ed-dock"], t: "Lo de todo el rato, a un toque: deshacer, rehacer, pegar, duplicar, capas, el imán (para alinear solito) y «ver toda la hoja»." },
  { sel: [".ed-contexto"], t: "Esta barra cambia según lo que elijas: letra y color para un texto, marco para una foto, probar para un HTML… Sin nada elegido, es la de la página: fondo, transición y música." },
  { sel: [".ed-insp"], t: "Aquí están todos los detalles de lo elegido: posición, efectos al tocar, zonas táctiles, sonidos, animación y capas." },
  { sel: [".ed-paginas-b"], t: "Tus páginas: tócalo para verlas, cambiar de una a otra, ordenarlas o agregar más." },
  { sel: [".ed-probar"], t: "«Probar» abre la página como la verá ella, con sus animaciones, toques y música." },
  { sel: [".ed-musica-b"], t: "La notita prende o apaga la música mientras editas (mantén presionado para el volumen). Cada estilo trae su propia música." },
  { sel: [".ed-ajustes-b"], t: "En ⚙ eliges el estilo del editor (Cuaderno, RetroMyLove o Baddie), el rendimiento, las animaciones y cómo me porto yo." },
  { sel: [".ed-exportar", ".ed-mas"], t: "Cuando esté lista, Exportar arma tu librito para compartirlo. Lo de guardar también está aquí arriba." },
  { sel: [".ed-foco"], cara: "enamorada", t: "Y si te pierdes, toca mi foquito: te explico justo lo que estás haciendo. ¡A crear algo bonito!" },
];
const visible = (n) => { if (!n) return false; const r = n.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(n).visibility !== "hidden"; };

const textoDe = (tip) => (typeof tip === "string" ? tip : tip.t);
const metaDe = (tip) => (typeof tip === "string" ? null : tip.a);

export class Ayuda {
  constructor(app) {
    this.app = app;
    try { this.vistos = new Set(JSON.parse(localStorage.getItem(VISTOS) || "[]")); } catch (e) { this.vistos = new Set(); }
    try { if (localStorage.getItem(OCULTO) === "1") PREF.ayudas = false; } catch (e) { /* nada */ }
    this.i = 0;
    this.abeja = new Abeja(app);
    // La primera vez: ofrece el recorrido guiado (una sola vez; luego está en el foquito y en ⋯).
    app.estado.on("cargado", () => setTimeout(() => {
      let visto = false;
      try { visto = localStorage.getItem("editordev:recorrido") === "1"; localStorage.setItem("editordev:recorrido", "1"); } catch (e) { visto = true; }
      if (!visto && PREF.ayudas && PREF.abeja && !document.querySelector(".ed-modal-fondo")) aviso("¿Primera vez aquí? La abejita te enseña todo en un minuto", 9000, "", { t: `${ico("foco")}<span>Enséñame</span>`, al: () => this.recorrido() });
    }, 2500));
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
      const di = (l, cara = "feliz") => this.abeja.decir(una1(l), { espera: true, cara, dura: 3200 });
      // (Con personalidad, Fase 43: dice algo de LO QUE añadiste; deshacer y borrar también tienen lo suyo.)
      if (E._deshaciendo) { if (Math.random() < 0.15) di(REACCIONES.deshacer, "guino"); return; }
      if (n > antes) {
        this.abeja.reaccionar("insertar");
        const nuevo = E.pagina?.els?.[E.pagina.els.length - 1];
        if (Math.random() < 0.4) di(REACCIONES[nuevo?.tipo] || ["¡Qué lindo quedó eso! ✨", "Ooh, me gusta 🥹", "¡Eso! Así se hace 🐝"]);
      } else if (n < antes) { this.abeja.reaccionar("borrar"); if (Math.random() < 0.2) di(REACCIONES.borrar, "sorpresa"); }
    });
    this._npag = 0;
    E.on("actual", () => {
      const k = E.proyecto?.orden?.length || 0, antes = this._npag;
      this._npag = k;
      if (antes && k > antes && this.abeja.viva && !this.abeja.hablando && Math.random() < 0.4) this.abeja.decir(una1(REACCIONES.pagina), { espera: true, cara: "feliz", dura: 3000 });
    });
    // Llega sola un ratito después de abrir (Fase 43): platica cada cierto tiempo y opina de lo que haces.
    E.on("cargado", () => this._llegarSola(26000));
    E.on("sel", () => { if (this.abeja.viva && !this.abeja.hablando && Math.random() < 0.15) { const id = E.sel[0]; const n = id && document.querySelector(`.ed-hoja [data-id="${id}"]`); if (n) this.abeja.visitar(n.getBoundingClientRect()); } });
    addEventListener("ed-evento", (ev) => {
      if (!this.abeja.viva) return;
      if (ev.detail === "guardado") { this.abeja.reaccionar("guardar"); this.abeja.decir("¡Guardadito! 💾💖", { espera: true, cara: "enamorada", dura: 2600 }); }
      if (ev.detail === "exportado") { this.abeja.reaccionar("carino"); this.abeja.decir("¡Tu librito está listo! Qué orgullo 🥹", { espera: true, cara: "enamorada", dura: 3600 }); }
    });
    alCambiar((p, c) => {
      if ("ayudas" in c) this.revisar();
      if (("abeja" in c && !p.abeja) || ("ayudas" in c && !p.ayudas)) this.irse();
      if ("dialogos" in c || "frecuencia" in c) this._programarCharla();
      if ("consejos" in c || "idioma" in c) this._programarConsejo();
    });
    // Consejos al momento: bloques, mover/imán, girar, tamaño, capas (y efectos y vídeo por contexto).
    try { this._momentos = JSON.parse(localStorage.getItem(MOMENTOS) || "{}"); } catch (e) { this._momentos = {}; }
    E.on("sel", () => {
      const sel = E.seleccionados, L = app.lienzo;
      if (sel.length > 1 && sel[0].grupo && sel.every((x) => x.grupo === sel[0].grupo) && sel.length === E.pagina.els.filter((x) => x.grupo === sel[0].grupo && !x.oculto).length) this.alMomento("bloque", 4000);
      else if (sel.length === 1 && sel[0].grupo && L?.dentroGrupo === sel[0].grupo) this.alMomento("pieza", 4000);
    });
    const gesto = E.gesto.bind(E);
    E.gesto = (nombre) => {
      const fin = gesto(nombre);
      return (guardar = true) => {
        const r = fin(guardar);
        if (guardar) setTimeout(() => { const k = { Mover: this._pego ? "iman" : "mover", Girar: "girar", "Cambiar tamaño": "tamano", "Escalar grupo": "tamano" }[nombre]; this._pego = false; if (k) this.alMomento(k); }, 0);
        return r;
      };
    };
    addEventListener("ed-soltar", (ev) => { this._pego = !!ev.detail?.pego; });
    const A = app.acciones;
    if (A?.capa) { const capa = A.capa.bind(A); A.capa = (...a) => { const r = capa(...a); this.alMomento("capas"); return r; }; }
    this.revisar();
    this._programarConsejo();
  }

  /** Un consejo de AL_MOMENTO (si toca y si no estorba). `pausa`: lo mínimo desde el último. */
  alMomento(clave, pausa = 15000) {
    const lista = AL_MOMENTO[clave];
    // Fuera de «Dev» no salen solos los consejos de dónde va cada cosa (sí al tocar el foquito).
    if (!lista || !PREF.ayudas || PREF.idioma !== "dev") return;
    const n = this._momentos[clave] || 0;
    if (n >= lista.length) return;
    const ahora = Date.now();
    if (ahora - (this._ultMomento || 0) < pausa) return;
    if (this.abeja.hablando || this.app.lienzo?.g || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla") || document.body.classList.contains("ed-probando")) return;
    this._momentos[clave] = n + 1;
    try { localStorage.setItem(MOMENTOS, JSON.stringify(this._momentos)); } catch (e) { /* nada */ }
    this._ultMomento = ahora;
    if (this.abeja.viva) this.abeja.decir(lista[n], { espera: true, dura: 4200 });
    else this._consejito(lista[n], 4800);
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
    if (k !== this.k) { const m = { "sec:efectos": "efectos", "el:video": "video" }[k]; if (m) setTimeout(() => this.alMomento(m), 600); }
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
    // Si la mandas a volar, vuelve una vez, un buen rato después; la segunda, ya no viene sola.
    this._echada = (this._echada || 0) + 1;
    if (this._echada === 1) this._llegarSola(8 * 60000);
    else clearTimeout(this._tl);
  }

  /** Viene sola (si está encendida y no estás en algo importante) y saluda con su carácter. */
  _llegarSola(ms) {
    clearTimeout(this._tl);
    // (En pruebas automáticas no llega sola: cambiaría la pantalla a mitad de una medición.)
    if (!PREF.abeja || (this._echada || 0) >= 2 || navigator.webdriver) return;
    this._tl = setTimeout(() => {
      if (this.abeja.viva || !PREF.abeja) return;
      // (Fase 46: tampoco con «Crear detallito» o Mensajitos abiertos: llega ya en el editor.)
      if (document.hidden || document.body.classList.contains("ed-probando") || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla, .mp-capa.ver, .jt-capa.ver, .ed-inicio, .dt-capa.ver")) return this._llegarSola(20000);
      this.llegar();
    }, ms);
  }

  /** Llegar volando y saludar (sin abrir los consejos). */
  llegar() {
    if (this.abeja.viva || !PREF.abeja) return;
    const r = this.boton.getBoundingClientRect();
    this.abeja.venir({ x: r.left + r.width / 2, y: r.top + r.height / 2 }).then(() => this.abeja.decir(una1(this._echada ? REACCIONES.volver : REACCIONES.hola), { espera: true, cara: "feliz", dura: 3800 }));
    this._programarCharla();
  }

  _tips() { return TIPS[this.k] || TIPS.hoja; }

  /* ── Recorrido guiado ──────────────────────────────────────────── */
  async recorrido() {
    if (!PREF.abeja) { this._consejito("La abejita está apagada en ⚙ Configuración → Abejita."); return; }
    this.app.lateral?.cerrar?.();
    this.app.cerrarHojaSec?.();
    if (!this.abeja.viva) {
      this._consejitoFuera?.();
      const r = this.boton.getBoundingClientRect();
      await this.abeja.venir({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      this.revisar();
    }
    clearTimeout(this._charla);
    this.enTour = true;
    this._pasos = RECORRIDO.map((p) => ({ ...p, n: p.sel ? p.sel.map((s) => document.querySelector(s)).find(visible) || null : null })).filter((p) => !p.sel || p.n);
    try { localStorage.setItem("editordev:recorrido", "1"); } catch (e) { /* nada */ }
    this._paso(0);
  }

  async _paso(i) {
    const pasos = this._pasos || [];
    if (!this.enTour || !this.abeja.viva) return this.salirTour();
    if (i < 0) i = 0;
    if (i >= pasos.length) return this.salirTour(true);
    this.iTour = i;
    const p = pasos[i];
    let foco = this._focoTour;
    if (!foco) { foco = el("div.ed-tour-foco", { "aria-hidden": "true" }); document.body.append(foco); this._focoTour = foco; }
    this.abeja.callar();
    if (p.n) {
      const r = p.n.getBoundingClientRect(), m = 6;
      Object.assign(foco.style, { left: r.left - m + "px", top: r.top - m + "px", width: r.width + m * 2 + "px", height: r.height + m * 2 + "px" });
      foco.classList.add("ver");
      // Si es muy grande (la hoja, el riel), la abejita va a su orilla.
      await this.abeja.visitar(r.width > innerWidth * 0.5 || r.height > innerHeight * 0.6 ? { left: r.left, right: Math.min(r.right, r.left + 140), top: Math.max(r.top + 40, 60), bottom: r.bottom } : r);
    } else {
      foco.classList.remove("ver");
      await this.abeja.volarA({ x: innerWidth / 2 - 40, y: Math.max(70, innerHeight * 0.32) }, 700);
    }
    if (!this.enTour || this.iTour !== i) return;
    const ultimo = i === pasos.length - 1;
    this.abeja.decir(p.t, {
      aqui: true, cara: p.cara || "feliz", cuenta: `${i + 1} de ${pasos.length}`, evitar: p.n && p.n.getBoundingClientRect().width < innerWidth * 0.7 ? p.n.getBoundingClientRect() : null,
      botones: [
        ...(i > 0 ? [[`${ico("izquierda")}<span>Atrás</span>`, () => this._paso(i - 1)]] : []),
        [ultimo ? "<span>¡Listo!</span>" : `<span>Siguiente</span>${ico("derecha")}`, () => this._paso(i + 1), "primario"],
        ...(!ultimo ? [["<span>Salir</span>", () => this.salirTour()]] : []),
      ],
    });
  }

  salirTour(completo) {
    this.enTour = false;
    this.abeja._evitar = null;
    this._focoTour?.classList.remove("ver");
    if (!this.abeja.viva) return;
    this.abeja.callar();
    this.abeja.volarA(this.abeja.casa(), 700);
    if (completo) { this.abeja.reaccionar?.("carino"); }
    this._programarCharla();
  }

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
        [`${ico("buscar")}<span>Revisa mi librito</span>`, () => this.revisarLibrito()],
        [`${ico("play")}<span>Enséñame todo</span>`, () => this.recorrido()],
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
    if (this.enTour) return this._programarCharla();
    if (document.hidden || this.abeja.hablando || document.body.classList.contains("ed-probando") || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla")) return this._programarCharla();
    // Fase 41: a veces, en vez de charlar, mira la página y avisa (con cariño) si algo se ve mal…
    if (Math.random() < 0.35 && this._psst()) return this._programarCharla();
    // …o opina de la página que estás haciendo (lo que de verdad hay en ella).
    if (Math.random() < 0.45) {
      const o = opinar(this.app, PREF.idioma);
      if (o) { this.abeja.decir(o, { espera: true, cara: /te amo|amor|derret|ternura|🥹/.test(o) ? "enamorada" : "feliz", dura: Math.min(9000, 2600 + o.length * 55) }); this._programarCharla(); return; }
    }
    // …o comenta lo que está pasando (la hora, cuántas páginas, si hay música).
    if (PREF.idioma !== "dev" && Math.random() < 0.3) {
      const t = deContexto(this._contexto());
      if (t) { this.abeja.decir(t, { espera: true, cara: "feliz", dura: Math.min(9000, 2600 + t.length * 55) }); this._programarCharla(); return; }
    }
    const d = await dialogo();
    if (d.tipo === "hackeo") await this.hackeo(d.texto);
    else this.abeja.decir(d.texto, { espera: true, cara: /💖|🥹|amor|bbsita|lind|bonit/i.test(d.texto) ? "enamorada" : "feliz", dura: Math.min(9000, 2600 + d.texto.length * 55) });
    this._programarCharla();
  }

  _contexto() {
    const E = this.app.estado, P = E.proyecto;
    this._desde = this._desde || Date.now();
    return { paginas: P?.orden?.length || 0, els: (E.pagina?.els || []).filter((x) => x.tipo !== "musica").length, hora: new Date().getHours(),
      minutos: (Date.now() - this._desde) / 60000, musica: !!(P?.ajustes?.musica?.asset || P?.orden?.some((id) => P.paginas[id]?.musica?.modo === "propia")), idioma: PREF.idioma };
  }

  /** «Psst…»: algo de ESTA página se ve mal y no lo había dicho → lo dice (una vez cada cosa). */
  _psst() {
    if (!this.abeja.viva || this.abeja.hablando) return false;
    const E = this.app.estado;
    this._dichos = this._dichos || new Set();
    const h = revisar(this.app).find((x) => x.nivel === "mal" && x.pagina === E.paginaId && !this._dichos.has(x.texto));
    if (!h) return false;
    this._dichos.add(h.texto);
    const botones = [[`<span>Ahora no</span>`, () => this.abeja.callar()]];
    if (h.arreglar) botones.unshift([`${ico("varita")}<span>Arréglalo</span>`, () => { h.arreglar(); this.abeja.callar(); this.abeja.reaccionar("insertar"); aviso("¡Listo, arreglado! ✨", 1800); }, "primario"]);
    if (h.els?.length) E.seleccionar(h.els.filter((id) => E.el(id)));
    this.abeja.decir("Psst… " + h.texto, { espera: true, cara: "sorpresa", botones, cuenta: "Se ve un poco mal" });
    return true;
  }

  /**
   * Fase 41: «Revisa mi librito» — saca su lupa, mira cada página y dice qué se ve mal, qué se puede
   * mejorar e ideas; va a cada cosa (la elige en la hoja) y, si se puede, la arregla de un toque.
   */
  async revisarLibrito() {
    if (!PREF.abeja) { this._consejito("La abejita está apagada en ⚙ Configuración → Abejita."); return; }
    if (!this.abeja.viva) { this.venir(); await new Promise((ok) => setTimeout(ok, 1400)); }
    clearTimeout(this._charla);
    this.abeja.callar();
    this.abeja.lupa(true);
    this.abeja.cara("sorpresa", 900);
    const L = this.app.lienzo;
    if (L?.hoja) { const r = L.hoja.getBoundingClientRect(); await this.abeja.visitar(r); }
    await new Promise((ok) => setTimeout(ok, 700));
    const lista = revisar(this.app);
    this._hallazgos = lista;
    const n = this.app.estado.proyecto?.orden?.length || 0;
    this.abeja.lupa(true);
    if (!lista.length) { this.abeja.bailar(); this.abeja.decir(resumen(lista, n), { cara: "enamorada", botones: [[`<span>¡Gracias!</span>`, () => this.abeja.callar(), "primario"]] }); return; }
    this.abeja.decir(resumen(lista, n), { cara: lista.some((x) => x.nivel === "mal") ? "sorpresa" : "feliz", botones: [[`<span>Enséñamelos</span>`, () => this._hallazgo(0), "primario"], [`<span>Luego</span>`, () => this.abeja.callar()]] });
  }

  _hallazgo(i) {
    const l = this._hallazgos || [], E = this.app.estado;
    if (!l.length) { this.abeja.bailar(); this.abeja.decir("¡Ya quedó todo! Ahora sí está precioso 🐝💗", { cara: "enamorada", dura: 4200 }); return; }
    this._ih = ((i % l.length) + l.length) % l.length;
    const h = l[this._ih];
    if (h.pagina && E.proyecto.paginas[h.pagina] && E.paginaId !== h.pagina) E.irPagina(h.pagina);
    if (h.els?.length) setTimeout(() => E.seleccionar(h.els.filter((id) => E.el(id))), 60);
    const botones = [];
    if (h.arreglar) botones.push([`${ico("varita")}<span>Arréglalo</span>`, () => { try { h.arreglar(); } catch (e) { console.warn(e); } this.abeja.reaccionar("insertar"); l.splice(this._ih, 1); this._hallazgo(this._ih); }, "primario"]);
    if (l.length > 1) botones.push([`${ico("derecha")}<span>Siguiente</span>`, () => this._hallazgo(this._ih + 1)]);
    botones.push([`<span>Listo</span>`, () => this.abeja.callar()]);
    const nivel = { mal: "Se ve un poco mal", ojo: "Para que quede mejor", idea: "Una idea" }[h.nivel];
    this.abeja.lupa(true);
    this.abeja.decir(h.texto, { cara: h.nivel === "mal" ? "sorpresa" : h.nivel === "ojo" ? "normal" : "feliz", cuenta: `${nivel} · ${this._ih + 1} de ${l.length}`, botones });
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
    if (!PREF.consejos || !PREF.ayudas || PREF.idioma !== "dev") return;
    this._dados = this._dados || 0;
    if (this._dados >= 3) return;
    this._cons = setTimeout(() => {
      if (document.hidden || this.abeja.viva || document.querySelector(".ed-modal-fondo, .ed-hojita.abierta, .ed-codigo-pantalla") || document.body.classList.contains("ed-probando")) return this._programarConsejo();
      this._dados++;
      this._consejito(GENERALES[Math.random() * GENERALES.length | 0]);
      this._programarConsejo();
    }, azar(180, 300) * 1000);
  }

  _consejito(texto, dura = 6500) {
    this._consejitoFuera();
    const c = el("button.ed-consejito", { type: "button", "aria-live": "polite", html: `${ico("foco")}<span></span>`, onClick: () => this._consejitoFuera() });
    c.lastChild.textContent = texto;
    document.body.append(c);
    this._cn = c;
    requestAnimationFrame(() => c.classList.add("ver"));
    clearTimeout(this._tcn);
    this._tcn = setTimeout(() => this._consejitoFuera(), dura);
  }

  _consejitoFuera() { const c = this._cn; this._cn = null; if (c) { c.classList.remove("ver"); setTimeout(() => c.remove(), 300); } }

  /** Esconder o mostrar el foquito (compatibilidad con Herramientas). */
  ponerOculto(on) {
    try { localStorage.setItem(OCULTO, on ? "1" : "0"); } catch (e) { /* nada */ }
    import("../config/preferencias.js").then((m) => m.poner({ ayudas: !on }));
  }

  cerrar() { this.irse(); }
}
