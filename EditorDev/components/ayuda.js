/**
 * EL FOQUITO DE AYUDA — consejos que no estorban.
 *
 * Un foquito chiquito en una esquina. Nunca abre nada solo: cuando hay un
 * consejo que todavía no viste para lo que estás haciendo (una foto elegida,
 * la línea de tiempo, el editor de HTML, Animar, GIFs…), brilla suave.
 * Tocarlo abre una tarjetita con el consejo de ese momento («Otro consejo»
 * para ver más, «Entendido» para cerrarla). Se puede esconder en Herramientas.
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";

const VISTOS = "editordev:ayuda-vista";
const OCULTO = "editordev:ayuda-oculta";

const TIPS = {
  hoja: [
    "Toca algo para elegirlo y luego arrástralo para moverlo. Con el dedo, nada se mueve si no lo elegiste antes: deslizar encima sólo desplaza la hoja.",
    "Mantén presionado un elemento para ver sus ajustes: luz, exposición, brillo, contraste, saturación, temperatura y opacidad.",
    "Dos dedos sobre la hoja acercan o alejan; sobre lo elegido, le cambian el tamaño y lo giran.",
    "Desliza desde el borde izquierdo (o toca el botón de menú) para abrir todas las herramientas.",
    "«Probar» (arriba) abre la página a pantalla completa, como la verá ella.",
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
    "«Probar» la abre a pantalla completa, como una página de verdad.",
    "Si sales con cambios sin guardar, te pregunta antes: nada se pierde sin querer.",
  ],
  "sec:animar": ["Toca una animación para verla en lo elegido; «Usar» la deja puesta y «Atrás» no cambia nada.", "Crea las tuyas con CSS (@keyframes), JSON o JS en «Mías», o déjalas en assets/animaciones/."],
  "sec:efectos": ["Cada efecto se previsualiza en la hoja con su intensidad antes de usarlo.", "Los filtros de assets/efectos/ aparecen solos al final."],
  "sec:transiciones": ["Toca una transición para verla de la página anterior a ésta y elegir si va en esta página o en todo el librito."],
  "sec:gifs": ["Busca lo que quieras; abajo se cargan más solos.", "Al previsualizar un GIF puedes quitarle el fondo sin perder la animación."],
  "sec:stickers": ["Los stickers ya vienen sin fondo. Los tuyos (assets/stickers/) salen arriba."],
  "sec:audio": ["Una pista suena en un momento de la página: muévela y recórtala en la línea de tiempo.", "Mientras editas suena MusicaDev.mp3 y baja sola cuando suena otra cosa."],
  "sec:html": ["«Nueva página HTML» crea una página en blanco con tu HTML a pantalla completa."],
  "sec:diseno": ["Un fondo con HTML (partículas, degradados…) va detrás de todo y nunca estorba al editar."],
  "sec:herramientas": ["Aquí apagas o subes los sonidos del editor y decides si se guarda solo."],
};

export class Ayuda {
  constructor(app) {
    this.app = app;
    try { this.vistos = new Set(JSON.parse(localStorage.getItem(VISTOS) || "[]")); } catch (e) { this.vistos = new Set(); }
    try { this.oculto = localStorage.getItem(OCULTO) === "1"; } catch (e) { this.oculto = false; }
    this.i = 0;
    this.boton = el("button.ed-foco", { type: "button", title: "Consejos", "aria-label": "Consejos para este momento", html: ico("foco") });
    this.boton.hidden = this.oculto;
    this.boton.addEventListener("click", () => this.alternar());
    document.body.append(this.boton);
    const pronto = () => { if (this._r) return; this._r = requestAnimationFrame(() => { this._r = 0; this.revisar(); }); };
    const E = app.estado;
    E.on("sel", pronto);
    E.on("actual", pronto);
    addEventListener("ed-hoja", pronto);
    document.addEventListener("click", pronto, true);
    this.revisar();
  }

  /** Dónde está quien edita ahora mismo. */
  contexto() {
    const app = this.app;
    if (document.body.classList.contains("ed-probando")) return null;
    if (document.querySelector(".ed-codigo-pantalla")) return "html";
    if (app.tiempo?.abierta) return "linea";
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
    this.boton.classList.toggle("nuevo", !!k && !this.vistos.has(k));
    this.boton.classList.toggle("fuera", !k);
  }

  alternar() {
    if (this.tarjeta) return this.cerrar();
    const k = this.k || "hoja";
    const tips = TIPS[k] || TIPS.hoja;
    this.i = 0;
    const texto = el("p", { text: tips[0] });
    const cuenta = el("small", { text: tips.length > 1 ? `1 de ${tips.length}` : "" });
    const otro = el("button.ed-btn.chico", { type: "button", html: `${ico("refrescar")}<span>Otro consejo</span>`, hidden: tips.length < 2 || null, onClick: () => { this.i = (this.i + 1) % tips.length; texto.textContent = tips[this.i]; cuenta.textContent = `${this.i + 1} de ${tips.length}`; t.animate([{ opacity: 0.6, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" }); } });
    const t = el("div.ed-foco-tarjeta", { role: "status" }, [
      el("b", { html: `${ico("foco")}<span>Un consejo</span>` }),
      texto,
      el("div.ed-foco-pie", {}, [cuenta, otro, el("button.ed-btn.chico.primario", { type: "button", text: "Entendido", onClick: () => this.cerrar() })]),
    ]);
    document.body.append(t);
    this.tarjeta = t;
    requestAnimationFrame(() => t.classList.add("ver"));
    this.vistos.add(k);
    try { localStorage.setItem(VISTOS, JSON.stringify([...this.vistos])); } catch (e) { /* nada */ }
    this.revisar();
    this._fuera = (ev) => { if (!t.contains(ev.target) && !this.boton.contains(ev.target)) this.cerrar(); };
    setTimeout(() => document.addEventListener("pointerdown", this._fuera, true), 0);
  }

  cerrar() {
    const t = this.tarjeta;
    if (!t) return;
    this.tarjeta = null;
    document.removeEventListener("pointerdown", this._fuera, true);
    t.classList.remove("ver");
    setTimeout(() => t.remove(), 220);
  }

  /** Esconder o mostrar el foquito (Herramientas). */
  ponerOculto(on) {
    this.oculto = !!on;
    try { localStorage.setItem(OCULTO, on ? "1" : "0"); } catch (e) { /* nada */ }
    this.boton.hidden = this.oculto;
    if (on) this.cerrar();
  }
}
