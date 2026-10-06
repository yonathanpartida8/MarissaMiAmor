/**
 * EL FOQUITO Y LA ABEJITA — consejos que no estorban.
 *
 * Un foquito chiquito en una esquina. Nunca abre nada solo: cuando hay un
 * consejo que todavía no viste para lo que estás haciendo (una foto elegida,
 * la línea de tiempo, el editor de HTML, Animar, GIFs…), brilla suave.
 * Al tocarlo llega volando una ABEJITA que te cuenta el consejo de ese
 * momento en un globito (con un «bzz-pip» cada vez que habla). Si el consejo
 * habla de un botón, vuela hasta él para enseñártelo. Mientras está, flota
 * despacito cerca de la esquina sin tapar la hoja. Tocar fuera sólo esconde el
 * globito; tocar la abejita la hace hablar otra vez. Al volver a tocar el
 * foquito (o «Entendido») se va volando y desaparece.
 * Los consejos son texto o { t, a } (a = el botón al que vuela).
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";

const VISTOS = "editordev:ayuda-vista";
const OCULTO = "editordev:ayuda-oculta";
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)");

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
  "el:video": ["En el inspector eliges si el vídeo empieza solo o al tocarlo, su marco y un resplandor con sus propios colores.", "Mantén presionado el vídeo para ajustar su luz y su color."],
  "el:componente": ["Las piezas salen de assets/<carpeta>/: deja ahí un .html (con su CSS y JS dentro) y aparece solo en «Piezas»."],
};

const ABEJA = `<svg viewBox="0 0 72 60" aria-hidden="true">
<defs><clipPath id="ed-abeja-c"><ellipse cx="30" cy="36" rx="19" ry="15"/></clipPath></defs>
<g class="ala ala-a"><ellipse cx="27" cy="17" rx="10" ry="14" transform="rotate(-18 27 17)"/></g>
<g class="ala ala-b"><ellipse cx="37" cy="16" rx="9" ry="13" transform="rotate(14 37 16)"/></g>
<path d="M12 37l-7 2 7 3z" fill="#3b2a1a"/>
<ellipse cx="30" cy="36" rx="19" ry="15" fill="#ffd23f"/>
<g clip-path="url(#ed-abeja-c)" fill="#3b2a1a"><rect x="19" y="18" width="6" height="36" rx="3"/><rect x="31" y="18" width="6" height="36" rx="3"/></g>
<ellipse cx="30" cy="36" rx="19" ry="15" fill="none" stroke="#3b2a1a" stroke-width="2.4"/>
<path d="M52 21c1-5 3-8 6-9M57 23c3-4 6-5 9-5" fill="none" stroke="#3b2a1a" stroke-width="2" stroke-linecap="round"/>
<circle cx="58.5" cy="12" r="2.4" fill="#3b2a1a"/><circle cx="66" cy="18" r="2.4" fill="#3b2a1a"/>
<circle cx="53" cy="32" r="11.5" fill="#ffd23f" stroke="#3b2a1a" stroke-width="2.4"/>
<circle class="ojo" cx="56.5" cy="29.5" r="2.3" fill="#3b2a1a"/><circle cx="57.3" cy="28.7" r=".8" fill="#fff"/>
<circle cx="58.5" cy="35.5" r="2.6" fill="#ff8fa3" opacity=".7"/>
<path d="M52.5 36.5q2.8 2.6 5.6.2" fill="none" stroke="#3b2a1a" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const textoDe = (tip) => (typeof tip === "string" ? tip : tip.t);
const metaDe = (tip) => (typeof tip === "string" ? null : tip.a);

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
    addEventListener("resize", () => { if (this.abeja && !this._volando) this._volar(this._casa(), 420); });
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
    this.boton.classList.toggle("con-abeja", !!this.abeja);
    if (!k && this.abeja) this.irse();
  }

  alternar() { if (this.abeja) this.irse(); else this.venir(); }

  /* ── La abejita ─────────────────────────────────────────────────── */

  /** Su sitio de descanso: cerca del foquito, sin tapar la hoja. */
  _casa() {
    const r = this.boton.getBoundingClientRect();
    return { x: Math.max(8, Math.min(innerWidth - 80, r.left - 62)), y: Math.max(60, r.top - 74) };
  }

  /** Junto a un botón de la interfaz (para enseñarlo). */
  _junto(sel) {
    const n = sel && document.querySelector(sel);
    if (!n || !n.offsetParent) return null;
    const r = n.getBoundingClientRect();
    const x = r.right + 76 < innerWidth ? r.right + 4 : r.left - 76;
    const y = r.bottom + 70 < innerHeight ? r.bottom + 2 : r.top - 62;
    return { x: Math.max(4, Math.min(innerWidth - 76, x)), y: Math.max(4, Math.min(innerHeight - 64, y)), n };
  }

  _poner(p) { this.pos = p; this.abeja.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`; }

  /** Vuela en curva de donde está a `p`; mira hacia donde va. */
  _volar(p, ms = 900) {
    const a = this.abeja;
    if (!a) return Promise.resolve();
    const o = this.pos || p;
    const dx = p.x - o.x, dy = p.y - o.y;
    if (Math.abs(dx) > 2) a.classList.toggle("izq", dx < 0);
    if (QUIETO.matches) ms = Math.min(ms, 260);
    const lado = Math.min(90, Math.hypot(dx, dy) * 0.3);
    const mx = (o.x + p.x) / 2 - (dy / (Math.hypot(dx, dy) || 1)) * lado, my = (o.y + p.y) / 2 + (dx / (Math.hypot(dx, dy) || 1)) * lado * 0.6 - 20;
    this._volando = true;
    this._quieto?.();
    const anim = a.animate([
      { transform: `translate3d(${o.x}px, ${o.y}px, 0)` },
      { transform: `translate3d(${mx}px, ${my}px, 0) rotate(${dx < 0 ? -8 : 8}deg)`, offset: 0.5 },
      { transform: `translate3d(${p.x}px, ${p.y}px, 0)` },
    ], { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)" });
    this._poner(p);
    return anim.finished.catch(() => {}).then(() => { this._volando = false; if (this.abeja === a) this._pasear(p); });
  }

  /** Flota despacito alrededor de su sitio (sin moverse si se pidió menos movimiento). */
  _pasear(base) {
    this._quieto?.();
    if (QUIETO.matches) return;
    let t = 0, vivo = true;
    const paso = () => {
      if (!vivo || !this.abeja || document.hidden) { if (vivo) t = setTimeout(paso, 2000); return; }
      const p = { x: base.x + (Math.random() * 2 - 1) * 16, y: base.y + (Math.random() * 2 - 1) * 10 };
      const a = this.abeja, o = this.pos;
      a.animate([{ transform: `translate3d(${o.x}px, ${o.y}px, 0)` }, { transform: `translate3d(${p.x}px, ${p.y}px, 0)` }], { duration: 2400, easing: "ease-in-out" });
      this._poner(p);
      this._globoSigue();
      t = setTimeout(paso, 2600 + Math.random() * 1600);
    };
    t = setTimeout(paso, 1800);
    this._quieto = () => { vivo = false; clearTimeout(t); this._quieto = null; };
  }

  venir() {
    if (this.abeja) return;
    const r = this.boton.getBoundingClientRect();
    const a = el("button.ed-abeja", { type: "button", "aria-label": "La abejita: toca para otro consejo", html: `<span class="ed-abeja-in">${ABEJA}</span>` });
    a.addEventListener("click", () => { if (this.globo?.classList.contains("ver")) this.otro(); else this.hablar(this.i); });
    document.body.append(a);
    this.abeja = a;
    this.pos = { x: r.left + r.width / 2 - 36, y: r.top + r.height / 2 - 30 };
    this._poner(this.pos);
    a.animate([{ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }], { duration: 260, easing: "ease-out" });
    this.boton.classList.add("con-abeja");
    const tips = this._tips();
    this.i = 0;
    this._volar(this._casa(), 820).then(() => this.hablar(0));
    this.vistos.add(this.k || "hoja");
    try { localStorage.setItem(VISTOS, JSON.stringify([...this.vistos])); } catch (e) { /* nada */ }
    this.revisar();
    this._fuera = (ev) => { if (this.globo && !this.globo.contains(ev.target) && !a.contains(ev.target) && !this.boton.contains(ev.target)) this._callar(); };
    document.addEventListener("pointerdown", this._fuera, true);
    return tips;
  }

  _tips() { return TIPS[this.k] || TIPS.hoja; }

  /** Dice un consejo: vuela hasta su botón (si tiene) y lo cuenta en el globito. */
  async hablar(i) {
    const tips = this._tips();
    this.i = ((i % tips.length) + tips.length) % tips.length;
    const tip = tips[this.i];
    const junto = this._junto(metaDe(tip));
    const destino = junto || this._casa();
    this._callar(true);
    if (Math.hypot(destino.x - this.pos.x, destino.y - this.pos.y) > 24) await this._volar(destino, 700);
    if (!this.abeja) return;
    if (junto) { junto.n.classList.add("ed-senalado"); clearTimeout(this._sen); this._sen = setTimeout(() => junto.n.classList.remove("ed-senalado"), 2400); }
    this._globo(textoDe(tip), tips.length);
    this.app.sonidos?.voz?.();
    this.abeja.classList.remove("habla"); void this.abeja.offsetWidth; this.abeja.classList.add("habla");
  }

  otro() { this.hablar(this.i + 1); }

  _globo(texto, total) {
    let g = this.globo;
    if (!g) {
      g = el("div.ed-abeja-globo", { role: "status", "aria-live": "polite" }, [
        el("p"),
        el("div.ed-abeja-pie", {}, [
          el("small"),
          el("button.ed-btn.chico", { type: "button", html: `${ico("refrescar")}<span>Otro consejo</span>`, onClick: () => this.otro() }),
          el("button.ed-btn.chico.primario", { type: "button", text: "Entendido", onClick: () => this.irse() }),
        ]),
      ]);
      document.body.append(g);
      this.globo = g;
    }
    const p = g.firstChild;
    const [cuenta, otro] = g.lastChild.children;
    cuenta.textContent = total > 1 ? `${this.i + 1} de ${total}` : "";
    otro.hidden = total < 2;
    // Escribe rapidito, como si hablara. El resto del texto ya ocupa su sitio
    // (invisible), así el globito no cambia de tamaño ni salta mientras escribe.
    clearInterval(this._tecla);
    p.setAttribute("aria-label", texto);
    const ya = el("span"), falta = el("span.falta", { text: texto });
    p.replaceChildren(ya, falta);
    let n = 0;
    const cada = QUIETO.matches ? texto.length : 3;
    this._tecla = setInterval(() => { n += cada; ya.textContent = texto.slice(0, n); falta.textContent = texto.slice(n); if (n >= texto.length) clearInterval(this._tecla); }, 16);
    this._globoSigue();
    g.classList.add("ver");
  }

  /** El globito se acomoda junto a la abejita, dentro de la pantalla. */
  _globoSigue() {
    const g = this.globo;
    if (!g || !this.pos) return;
    const w = Math.min(280, innerWidth - 24);
    g.style.width = w + "px";
    const izq = this.pos.x + 36 > innerWidth / 2;
    const x = Math.max(12, Math.min(innerWidth - w - 12, izq ? this.pos.x - w + 30 : this.pos.x + 40));
    const h = g.offsetHeight || 120;
    const arriba = this.pos.y - h - 8 > 8;
    const y = arriba ? this.pos.y - h - 6 : Math.min(innerHeight - h - 12, this.pos.y + 62);
    g.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    g.classList.toggle("abajo", !arriba);
    g.style.setProperty("--cola", `${Math.max(16, Math.min(w - 24, this.pos.x + 36 - x))}px`);
  }

  _callar(rapido) {
    clearInterval(this._tecla);
    this.globo?.classList.remove("ver");
    if (!rapido) this._volar(this._casa(), 600);
  }

  irse() {
    const a = this.abeja;
    if (!a) return;
    this.abeja = null;
    this._quieto?.();
    clearInterval(this._tecla);
    document.removeEventListener("pointerdown", this._fuera, true);
    const g = this.globo;
    this.globo = null;
    if (g) { g.classList.remove("ver"); setTimeout(() => g.remove(), 260); }
    const o = this.pos;
    const p = { x: innerWidth + 40, y: Math.max(-80, o.y - 160) };
    a.classList.remove("izq");
    const vuelo = a.animate([
      { transform: `translate3d(${o.x}px, ${o.y}px, 0)`, opacity: 1 },
      { transform: `translate3d(${o.x - 30}px, ${o.y - 20}px, 0) rotate(-6deg)`, opacity: 1, offset: 0.25 },
      { transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(10deg)`, opacity: 0 },
    ], { duration: QUIETO.matches ? 200 : 900, easing: "cubic-bezier(.5,0,.6,1)", fill: "forwards" });
    vuelo.finished.catch(() => {}).then(() => a.remove());
    this.boton.classList.remove("con-abeja");
  }

  /** Esconder o mostrar el foquito (Herramientas). */
  ponerOculto(on) {
    this.oculto = !!on;
    try { localStorage.setItem(OCULTO, on ? "1" : "0"); } catch (e) { /* nada */ }
    this.boton.hidden = this.oculto;
    if (on) this.irse();
  }

  /** (compatibilidad) cerrar = que se vaya. */
  cerrar() { this.irse(); }
}
