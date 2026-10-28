/**
 * DETALLITOS — páginas que se mandan entre los dos, como notitas, y se van
 * coleccionando. Se abre desde Exportar → «Enviar Detallito» o desde el menú
 * principal, creciendo en un círculo desde el botón; es un menú completo con
 * «atrás» (la flecha, Escape o el «atrás» del teléfono).
 *
 *   · Arriba, tu foto y la de tu amorcito (con un puntito si está en línea).
 *   · «Vincular a tu Amorcito»: una escenita con sus dos fotos y un hilo rojo.
 *     Tu código sale en fichitas; el suyo se escribe solito con su formato
 *     (AMOR-XXXX-XXXX) y se va llenando de corazones. Al vincularse, las fotos
 *     se acercan, el hilo se hace corazón y suenan campanitas.
 *   · «Mandar esta página» (sólo desde el editor): la página tal cual le llega.
 *   · La colección (lo único, si se abre desde el menú principal): las páginas
 *     de los dos juntas, por mes, cada una con su portadita, de quién es («Yo»
 *     o su nombre) y su reacción. En las que te mandó, reaccionas con un toque:
 *     te amo, me encantó, lloré, abrazo, beso o me reí, cada una con su sonido
 *     de cristal (tres versiones que se turnan) y su lluvia (reacciones.js).
 *
 * Cada pantalla llega con su transición (y su sonido): vincular gira como una
 * tarjeta, un detallito sale de su sobre, la vista previa se acerca…
 *
 * Sin parpadeos: las pantallas se arman al instante con lo que ya se sabe y lo
 * que llega del servidor sólo cambia su pedacito (o, si cambió lo grande, pasa
 * a la pantalla que toca con su transición). Nunca una pantalla en blanco.
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";
import { zipParaVer, abrirComoBorrador, copiar, abrir } from "./myn.js";
import { datosDe } from "./prueba.js";
import { fuentesUsadas } from "../core/modelo.js";
import { RAIZ } from "../assets/biblioteca.js";
import { cambiar, sinMovimiento as reducido } from "./transiciones.js";
import * as PF from "./perfil.js";
import { REACCIONES, reaccion, svgReaccion, estallido } from "./reacciones.js";
import { dibujarPortadita, portaditaDePaquete } from "./portadita.js";
import { vistaChat, ICONO_CHAT } from "./chat.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const cuando = (iso) => {
  if (!iso) return "";
  const t = new Date(iso), d = (Date.now() - t) / 1000;
  if (d < 60) return "ahorita";
  if (d < 3600) return `hace ${Math.round(d / 60)} min`;
  if (d < 86400) return `hace ${Math.round(d / 3600)} h`;
  return t.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};
const ROTAR = [-2.2, 1.6, -1, 2.4, -1.8, 1.1, -2.6, 0.8];
const HILO = '<svg viewBox="0 0 200 60" preserveAspectRatio="none"><path class="vn-cuerda" d="M2 14 C 60 62, 140 62, 198 14"/><path class="vn-luz" d="M2 14 C 60 62, 140 62, 198 14"/></svg>';
/* Cómo se llega a cada pantalla. */
const LLEGA = { vincular: "carta", ver: "sobre", previa: "zoom", inicio: "deslizar", coleccion: "deslizar", cuenta: "carta", cargando: "zoom", chat: "deslizar" };

export class Detallitos {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.pila = [];
    this.datos = null;
    this.amor = null;
    this.borrador = null;   // título y mensajito que se van escribiendo (sobreviven al ir y volver)
    this._limpiezas = [];
  }

  _limpiar() { for (const f of this._limpiezas.splice(0)) { try { f(); } catch (e) { /* nada */ } } }

  /**
   * La página tal cual le va a llegar: el MISMO reproductor del librito, en un
   * marco chiquito, sin sonido. Devuelve el marco (se muestra al estar listo).
   */
  _marcoPrevia(interactiva = false) {
    const app = this.app, P = app.estado.proyecto, pg = app.estado.pagina;
    const marco = el("iframe.dt-previa-marco", { src: "runtime/reproductor.html", title: "Así le va a llegar", allow: "autoplay; fullscreen", tabindex: interactiva ? "0" : "-1" });
    if (!interactiva) marco.setAttribute("aria-hidden", "true");
    const al = async (ev) => {
      if (ev.source !== marco.contentWindow || ev.data?.tipo !== "vista-lista") return;
      const datosUrls = await datosDe(app, pg).catch(() => ({}));
      marco.contentWindow?.postMessage({
        tipo: "librito", datos: { nombre: P.nombre, ajustes: P.ajustes, orden: P.orden, paginas: P.paginas, titulos: {} },
        urls: app.bib.mapa(), datosUrls, base: RAIZ, inicio: app.estado.paginaId, portadilla: false, soloPagina: true, silencio: true,
        fuentes: [...fuentesUsadas(P)], fijar: app.lienzo?.pantallaDeHoja?.() || null,
      }, location.origin);
      setTimeout(() => marco.classList.add("listo"), 160);
    };
    addEventListener("message", al);
    this._limpiezas.push(() => removeEventListener("message", al));
    return marco;
  }

  /** El tamaño de la vista previa dentro de una caja, con la forma de la hoja (la de «Ver como» si es automática). */
  _tam(maxW, maxH) {
    const m = this.app.lienzo?.m, a = this.app.estado.proyecto?.ajustes || {};
    const W = m?.auto ? m.W : a.ancho || 390, H = m?.auto ? m.H : a.alto || 844;
    const k = Math.min(maxW / W, maxH / H);
    return { width: Math.round(W * k) + "px", height: Math.round(H * k) + "px" };
  }

  /** Abre el menú. `desde`: el elemento (o rectángulo) de donde crece la transición. */
  abrir(desde, vista = "inicio") {
    if (this.abierto) { this.ir(vista, null, { desde }); return; }
    this.abierto = true;
    // Desde el menú principal (la colección o el vínculo) todo lleva a la colección; desde el editor, a mandar la página.
    this.casa = vista === "inicio" ? "inicio" : "coleccion";
    const r = desde?.getBoundingClientRect ? desde.getBoundingClientRect() : desde || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    this.cx = r.left + r.width / 2; this.cy = r.top + r.height / 2;
    this.atrasB = el("button.dt-atras", { type: "button", html: ico("izquierda"), "aria-label": "Atrás", onClick: () => this.atras() });
    this.tituloB = el("b", { text: "Detallitos" });
    this.tituloS = el("small", { text: "con tu amorcito" });
    this.titulo = el("div.dt-titulo", {}, [this.tituloB, this.tituloS]);
    this.cab = el("div.dt-cab-pareja");
    this.escena = el("div.dt-escena");
    this.vista = el("main.dt-vista", {}, [this.escena]);
    const burbujas = el("div.dt-burbujas", { "aria-hidden": "true" });
    for (let i = 0; i < 14; i++) {
      const b = el("i");
      b.style.left = (Math.random() * 100).toFixed(1) + "%";
      b.style.setProperty("--t", (10 + Math.random() * 9).toFixed(1) + "s");
      b.style.setProperty("--d", (-Math.random() * 18).toFixed(1) + "s");
      b.style.setProperty("--s", (0.5 + Math.random() * 0.9).toFixed(2));
      burbujas.append(b);
    }
    this.capa = el("div.dt-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Detallitos" }, [
      el("div.dt-cielo", { "aria-hidden": "true" }, [el("i"), el("i")]),
      burbujas,
      el("div.dt-marco", {}, [el("header.dt-cab", {}, [this.atrasB, this.titulo, this.cab]), this.vista]),
    ]);
    this.capa.style.setProperty("--x", this.cx + "px");
    this.capa.style.setProperty("--y", this.cy + "px");
    this._tecla = (e) => { if (e.key === "Escape" && this.abierto) { e.stopPropagation(); this.atras(); } };
    addEventListener("keydown", this._tecla, true);
    document.body.append(this.capa);
    document.body.classList.add("con-detallitos");
    this._chispas(this.cx, this.cy);
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
    // Desde el menú principal es la colección de los dos (un álbum que se abre); desde el editor, mandar.
    this.app.sonidos?.sonar(vista === "coleccion" ? "coleccion" : "abrir-recursos");
    this._cuenta = () => { if (!this.abierto) return; this.amor = null; this.datos = null; this.pila = [{ vista: this.casa }]; this._mostrar(this.pila[0], "zoom"); this._refrescar(); };
    this._cambio = () => { if (this.abierto) this._alCambiar(); };
    addEventListener("ed-cuenta", this._cuenta);
    addEventListener("ed-amor", this._cambio);
    addEventListener("ed-perfil", this._cambio);
    // Lo que ya se sabe (de tu perfil guardado) para que nada salga en blanco.
    if (!this.amor && SRV.conectado() && PF.datos().pareja) this.amor = { pareja: PF.datos().pareja, codigo: "" };
    this.pila = [{ vista }];
    this._mostrar(this.pila[0], null, { sinSonido: true });
    this._refrescar();
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    this._limpiar();
    removeEventListener("keydown", this._tecla, true);
    for (const [t, f] of [["ed-cuenta", this._cuenta], ["ed-amor", this._cambio], ["ed-perfil", this._cambio]]) removeEventListener(t, f);
    this.app.sonidos?.sonar("cerrar-recursos");
    const c = this.capa;
    c.classList.remove("ver");
    c.classList.add("fuera");
    setTimeout(() => { c.remove(); if (!this.abierto) document.body.classList.remove("con-detallitos"); }, reducido() ? 10 : 560);
    dispatchEvent(new CustomEvent("ed-detallitos", { detail: "cerrado" }));
  }

  /** Atrás: la pantalla anterior, o cerrar. */
  atras() {
    if (this._chatAtras?.() || this._grande(false)) return true;
    if (this.pila.length > 1) { this.pila.pop(); this._mostrar(this.pila[this.pila.length - 1], "atras"); return true; }
    this.cerrar();
    return true;
  }

  ir(vista, datos, op = {}) {
    this.pila.push({ vista, datos });
    this._mostrar({ vista, datos }, op.tipo, op);
  }

  /** La pantalla que de verdad toca (sin cuenta: entrar; sin vínculo: vincular; sin saber: buscando). */
  _real(vista) {
    if (!SRV.conectado()) return "cuenta";
    if (!this.amor) return "cargando";
    if (vista === "vincular" || !this.amor.pareja) return "vincular";
    return vista;
  }
  _forma() { return SRV.conectado() ? (this.amor ? (this.amor.pareja ? "pareja" : "sola") : "?") : "fuera"; }

  _mostrar({ vista, datos }, tipo, { desde = null, sinSonido = false } = {}) {
    this._limpiar();
    this._col = null;
    const real = this._real(vista);
    this.actual = real;
    const v = { cuenta: () => this._vCuenta(), cargando: () => this._vCargando(), vincular: () => this._vVincular(), ver: () => this._vVer(datos), previa: () => this._vPrevia(), coleccion: () => this._vColeccion(), chat: () => vistaChat(this) }[real]?.() || this._vInicio();
    if (!v) return;
    // El chat ocupa toda la pantalla (con su propia lista que se desliza); el detallito, todo lo ancho.
    this.capa.classList.toggle("en-chat", real === "chat");
    this.capa.classList.toggle("en-ver", real === "ver");
    this.atrasB.setAttribute("aria-label", this.pila.length > 1 ? "Atrás" : "Cerrar Detallitos");
    this._cabeza();
    this.vista.scrollTop = 0;
    cambiar(this.escena, v, { tipo: tipo || LLEGA[real] || "deslizar", desde, sonidos: this.app.sonidos, sinSonido });
  }

  /** Lo de arriba: tus fotos (con su puntito en línea) y el título. */
  _cabeza() {
    const pa = this.amor?.pareja, con = SRV.conectado();
    const sub = { cuenta: SRV.NOMBRE, cargando: "un momentito…", vincular: pa ? "su vínculo" : "vincular a tu amorcito", previa: "así le va a llegar" }[this.actual] || (pa ? `con ${PF.nombreDe(pa)}${pa.en_linea ? " · en línea" : ""}` : "con tu amorcito");
    this.tituloB.textContent = this.actual === "chat" ? "Mensajitos" : "Detallitos";
    if (this.actual === "ver") this.tituloS.textContent = this.tituloS.textContent || "";
    else this.tituloS.textContent = sub;
    const k = con ? (pa ? "p" + !!pa.en_linea + PF.nombreDe(pa) : this.amor ? "s" : "?") : "f";
    if (this.cab._k === k) return;
    this.cab._k = k;
    this.cab.title = pa ? `${PF.miNombre()} y ${PF.nombreDe(pa)}${pa.en_linea ? " · en línea" : ""}` : "";
    this.cab.replaceChildren(...(!con || !this.amor ? [] : [
      PF.avatar("yo", "dt-mini"),
      el("i.dt-mini-corazon" + (pa ? ".late" : ""), { html: ico("corazon") }),
      pa ? PF.avatar("pareja", "dt-mini") : el("span.av.vacio.dt-mini", {}, [el("b", { text: "?" })]),
      pa ? el("span.dt-mini-punto" + (pa.en_linea ? ".on" : "")) : null,
    ].filter(Boolean)));
  }

  /** Lo que se sabe del vínculo, del servidor. Si cambió lo grande, se pasa a la pantalla que toca. */
  async _refrescar() {
    if (!SRV.conectado()) return;
    try {
      const a = await SRV.amor();
      if (!this.abierto) return;
      const antes = this._forma(), codigoAntes = this.amor?.codigo;
      this.amor = a;
      PF.poner({ pareja: a.pareja });
      if (this._forma() !== antes || this._real(this.pila[this.pila.length - 1].vista) !== this.actual) {
        if (antes === "pareja" && !a.pareja) this.pila = [{ vista: "vincular" }];
        this._mostrar(this.pila[this.pila.length - 1], "zoom");
        return;
      }
      if (this.actual === "vincular" && a.codigo && a.codigo !== codigoAntes && this._fichas) this._fichas.replaceWith(this._fichas = this._hacerFichas(a.codigo));
      this._cabeza();
    } catch (e) {
      if (this.actual === "cargando" && this._esperaTxt) this._esperaTxt.textContent = e.message;
    }
  }

  /** Un latido, una foto o un nombre nuevo: se cambia sólo lo que cambió. */
  _alCambiar() {
    const pa = PF.datos().pareja;
    if (this.amor?.pareja && pa && pa.usuario === this.amor.pareja.usuario) this.amor.pareja = { ...this.amor.pareja, ...pa };
    if (!!pa !== !!this.amor?.pareja) { this._refrescar(); return; }
    this._cabeza();
    this._globoChat?.();
    if (this.actual === "inicio" || this.actual === "coleccion") this._recargarCol?.();
  }

  /** El botón para ir a los mensajitos, con su globito de los que no has leído. */
  _botonChat(clase, texto, sub, i) {
    const g = el("em.dt-globo", { hidden: "" });
    const b = el("button." + clase, { type: "button", style: { "--i": i }, onClick: (e) => this.ir("chat", null, { desde: e.currentTarget }) }, [
      el("i.dt-chat-ico", { html: ICONO_CHAT }), el("span.dt-chat-t", {}, [el("b", { text: texto }), sub ? el("small", { text: sub }) : null]), g, el("i.dt-ir-col-f", { html: ico("derecha") }),
    ]);
    this._globoChat = () => { const n = this.app.amorChat || 0; g.hidden = !n; g.textContent = String(n); b.classList.toggle("con-nuevos", !!n); };
    this._globoChat();
    return b;
  }

  /* — Sin cuenta: entrar — */
  _vCuenta() {
    return el("section.dt-pantalla", {}, [
      el("div.dt-tarjeta-grande", { style: { "--i": 0 } }, [
        el("div.dt-sobre", { html: ico("detallito") }),
        el("h2", { text: "Entra para mandarle detallitos" }),
        el("p", { text: `Con tu cuenta de ${SRV.NOMBRE} te vinculas con tu amorcito y se mandan páginas que se van coleccionando.` }),
      ]),
      el("div.dt-tarjeta", { style: { "--i": 1 } }, [formularioCuenta(this.app, { compacto: true })]),
    ]);
  }

  /* — Mientras se sabe si ya tienes amorcito (sólo la primera vez) — */
  _vCargando() {
    this._esperaTxt = el("p", { text: "Buscando a tu amorcito…" });
    return el("section.dt-pantalla.dt-espera", {}, [el("i.dt-espera-corazon", { style: { "--i": 0 }, html: ico("corazon") }), this._esperaTxt]);
  }

  /* — Tu código, en fichitas que se voltean — */
  _hacerFichas(codigo) {
    return el("div.vn-fichas", { role: "text", "aria-label": codigo }, [...codigo].map((ch, i) => el("span" + (ch === "-" ? ".guion" : ""), { text: ch, style: { "--i": i } })));
  }

  /** La escenita: tú, el hilo rojo con su corazón y tu amorcito (o un «?»). */
  _escena(pa) {
    const lado = (quien, nombre) => el("div.vn-lado." + quien, {}, [quien === "yo" ? PF.avatar("yo", "vn-av") : pa ? PF.avatar("pareja", "vn-av") : el("span.av.vacio.vn-av", {}, [el("b", { text: "?" })]), el("small", { text: nombre })]);
    const ella = lado("ella", pa ? PF.nombreDe(pa) : "Tu amorcito");
    const corazon = el("i.vn-corazon", { html: ico("corazon") });
    const e = el("div.vn-escena" + (pa ? ".unidos" : ""), { "aria-hidden": "true" }, [lado("yo", "Tú"), el("div.vn-hilo", { html: HILO }), corazon, ella]);
    e.corazon = corazon; e.ella = ella;
    return e;
  }

  /* — Vincular a tu Amorcito — */
  _vVincular() {
    const a = this.amor || {}, pa = a.pareja, son = this.app.sonidos;
    const escena = this._escena(pa);
    if (pa) {
      const j = PF.juntos(pa.novios || PF.datos().yo?.novios);
      const desde = pa.desde ? new Date(pa.desde).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "";
      return el("section.dt-pantalla", {}, [
        el("div.dt-tarjeta-grande.vn", { style: { "--i": 0 } }, [
          escena,
          el("h2", { text: `${PF.miNombre()} y ${PF.nombreDe(pa)}` }),
          el("p", { text: (desde ? `Unidos en ${SRV.NOMBRE} desde el ${desde}.` : "Unidos.") + (j ? ` Novios desde hace ${PF.textoJuntos(j)}.` : " Pon desde cuándo son novios en tu perfil.") }),
        ]),
        el("div.dt-tarjeta.vn-acciones", { style: { "--i": 1 } }, [
          el("button.ed-btn.primario.dt-btn", { type: "button", html: I("detallito", "Ir a nuestros detallitos"), onClick: () => { this.pila = [{ vista: this.casa }]; this._mostrar(this.pila[0], "deslizar"); } }),
          el("button.ed-btn.peligro-suave.dt-btn", { type: "button", html: I("cerrar", "Desvincular"), onClick: async () => {
            if (!(await confirmar(`¿Desvincularte de ${PF.nombreDe(pa)}? Sus detallitos se quedan en sus colecciones, pero ya no podrán mandarse nuevos.`, "Desvincular"))) return;
            try {
              await SRV.desvincular();
              son?.sonar("separar");
              escena.classList.add("separando");
              this.amor = { ...this.amor, pareja: null };
              await PF.poner({ pareja: null });
              setTimeout(() => { this.pila = [{ vista: "vincular" }]; this._mostrar(this.pila[0], "zoom"); this._refrescar(); }, reducido() ? 100 : 950);
            } catch (e) { aviso(e.message, 3500, "error"); }
          } }),
        ]),
      ]);
    }
    // Sin vincular: tu código y el suyo.
    this._fichas = this._hacerFichas(a.codigo || "AMOR-····-····");
    const pegar = el("input.dt-input.vn-input", { type: "text", placeholder: "AMOR-XXXX-XXXX", autocapitalize: "characters", spellcheck: "false", autocomplete: "off", maxlength: 16, enterkeyhint: "done", "aria-label": "Código de tu amorcito" });
    const puntos = el("div.vn-puntos", { "aria-hidden": "true" }, Array.from({ length: 8 }, () => el("i", { html: ico("corazon") })));
    const estado = el("small.dt-estado", { role: "status" });
    const vincular = el("button.ed-btn.primario.dt-btn.vn-ir", { type: "button", html: I("vincular", "Vincularnos") });
    let n = 0;
    const formatear = () => {
      let c = pegar.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (c.startsWith("AMOR")) c = c.slice(4);
      c = c.slice(0, 8);
      const v = c ? "AMOR-" + c.slice(0, 4) + (c.length > 4 ? "-" + c.slice(4) : "") : "";
      if (pegar.value !== v) pegar.value = v;
      [...puntos.children].forEach((p, i) => p.classList.toggle("on", i < c.length));
      if (c.length > n) son?.sonar("tecla", { tono: 1 + c.length * 0.07 });
      n = c.length;
      vincular.classList.toggle("listo", c.length === 8);
      return c;
    };
    pegar.addEventListener("input", formatear);
    pegar.addEventListener("keydown", (e) => { if (e.key === "Enter") vincular.click(); });
    vincular.addEventListener("click", async () => {
      const c = formatear();
      if (c.length < 8) { estado.textContent = "Escribe (o pega) el código completo de tu amorcito."; pegar.classList.remove("sacude"); void pegar.offsetWidth; pegar.classList.add("sacude"); son?.sonar("error"); return; }
      vincular.disabled = true; vincular.classList.add("latiendo"); estado.textContent = "Atando el hilo…";
      try {
        const r = await SRV.vincular(c);
        await PF.poner({ pareja: r.pareja });
        this.amor = { ...this.amor, pareja: r.pareja };
        son?.sonar("campanas");
        // El «?» se vuelve su foto, se acercan los dos y el hilo se hace corazón.
        escena.ella.replaceChildren(PF.avatar("pareja", "vn-av vn-llega"), el("small", { text: PF.nombreDe(r.pareja) }));
        escena.classList.add("uniendo");
        setTimeout(() => { const q = escena.corazon.getBoundingClientRect(); this._chispas(q.left + q.width / 2, q.top + q.height / 2, 22); son?.sonar("latido"); }, reducido() ? 0 : 620);
        estado.textContent = `¡Ya están unidos, ${PF.nombreDe(r.pareja)} y tú!`;
        this._cabeza();
        setTimeout(() => { this.pila = [{ vista: this.casa }]; this._mostrar(this.pila[0], "circulo", { desde: escena.corazon }); }, reducido() ? 300 : 1900);
      } catch (e) { estado.textContent = e.message; son?.sonar("error"); vincular.disabled = false; vincular.classList.remove("latiendo"); }
    });
    if (!sinTeclado()) setTimeout(() => { if (pegar.isConnected) pegar.focus({ preventScroll: true }); }, 800);
    return el("section.dt-pantalla", {}, [
      el("div.dt-tarjeta-grande.vn", { style: { "--i": 0 } }, [
        escena,
        el("h2", { text: "Vincúlate con tu amorcito" }),
        el("p", { text: "Pásale tu código, o escribe aquí el suyo. Con que uno de los dos lo ponga basta: el hilo rojo los une a los dos." }),
      ]),
      el("div.dt-tarjeta", { style: { "--i": 1 } }, [
        el("small.dt-etq", { text: "Tu código" }),
        this._fichas,
        el("div.dt-fila.vn-fila", {}, [
          el("button.ed-btn.chico", { type: "button", html: I("copiar", "Copiar"), onClick: () => { copiar(this.amor?.codigo || ""); son?.sonar("brillo"); } }),
          navigator.share ? el("button.ed-btn.chico", { type: "button", html: I("compartir", "Mandárselo"), onClick: () => navigator.share({ title: "Mi código de amor", text: `Vincúlate conmigo en ${SRV.NOMBRE}: ${this.amor?.codigo || ""}` }).catch(() => {}) }) : null,
          el("button.ed-btn.chico", { type: "button", html: I("refrescar", "Otro código"), onClick: async () => {
            try { const r = await SRV.codigoNuevo(); this.amor.codigo = r.codigo; this._fichas.replaceWith(this._fichas = this._hacerFichas(r.codigo)); son?.sonar("giro"); } catch (e) { aviso(e.message, 3500, "error"); }
          } }),
        ]),
      ]),
      el("div.dt-tarjeta", { style: { "--i": 2 } }, [
        el("small.dt-etq", { text: "El código de tu amorcito" }),
        el("div.dt-fila", {}, [pegar, navigator.clipboard?.readText ? el("button.ed-btn.chico", { type: "button", html: I("pegar", "Pegar"), onClick: async () => { try { pegar.value = (await navigator.clipboard.readText()).trim(); formatear(); } catch (e) { /* sin permiso */ } } }) : null]),
        puntos, vincular, estado,
      ]),
    ]);
  }

  /* — Inicio: mandar esta página y la colección — */
  _vInicio() {
    // (El editor puede seguir cargándose detrás del menú: sin librito abierto, se dice cómo.)
    const app = this.app, P = app.estado?.proyecto, pareja = this.amor.pareja, nombre = PF.nombreDe(pareja);
    const pg = P?.paginas?.[app.estado?.paginaId];
    const color = pg?.fondo?.color || P?.ajustes?.tema?.fondo || "#ffd1e6";
    if (!this.borrador || this.borrador.pagina !== app.estado?.paginaId) this.borrador = { pagina: app.estado?.paginaId, titulo: pg?.nombre || "Un detallito", mensaje: "" };
    const B = this.borrador;
    const titulo = el("input.dt-input", { type: "text", value: B.titulo, maxlength: 60, "aria-label": "Título del detallito", onInput: () => { B.titulo = titulo.value; } });
    const mensaje = el("textarea.dt-input.dt-mensaje", { maxlength: 280, rows: 2, placeholder: `Escríbele algo bonito a ${nombre}… (opcional)`, "aria-label": "Mensajito", onInput: () => { B.mensaje = mensaje.value; nota.textContent = mensaje.value.trim() || "…"; } });
    mensaje.value = B.mensaje;
    const avance = el("div.dt-avance", { hidden: "" }, [el("i")]);
    const estado = el("small.dt-estado");
    const sobre = el("div.dt-sobre-envio.abierto", { "aria-hidden": "true" }, [el("i.dt-carta"), el("i.dt-solapa"), el("i.dt-sello", { html: ico("corazon") })]);
    sobre.style.setProperty("--c", color);
    // La vista previa: un teléfono chiquito con la página de verdad (se toca para verla en grande).
    const nota = el("span.dt-previa-nota", { text: B.mensaje.trim() || "…" });
    const previa = pg ? el("button.dt-previa", { type: "button", title: "Verla en grande", "aria-label": "Ver en grande cómo le va a llegar", onClick: (e) => this.ir("previa", null, { desde: e.currentTarget }), style: { ...this._tam(118, 178), "--c": color } }, [
      el("span.dt-previa-pantalla", {}, [this._marcoPrevia(), el("i.dt-previa-brillo")]),
      el("span.dt-previa-lupa", { html: I("ver", "Verla") }),
    ]) : null;
    let enviado = false;
    const enviar = el("button.ed-btn.primario.dt-btn.dt-enviar", { type: "button", html: I("detallito", `Mandárselo a ${nombre}`), onClick: async () => {
      if (enviado || !app.estado.proyecto) { this.cerrar(); app.inicio?.(); return; }
      enviar.disabled = true; avance.hidden = false; estado.textContent = "Envolviendo tu página…";
      // Su portadita (para la colección) se dibuja mientras se envuelve.
      const mini = dibujarPortadita(app, undefined, 480).catch(() => null);
      const poner = (p) => { avance.firstChild.style.width = Math.round(p * 100) + "%"; };
      // 1 · La página se mete al sobre y el sobre se cierra (mientras sube, late).
      previa?.classList.add("adentro");
      app.sonidos?.sonar("sobre");
      setTimeout(() => sobre.classList.replace("abierto", "cerrado"), reducido() ? 0 : 560);
      setTimeout(() => sobre.classList.add("esperando"), reducido() ? 0 : 1000);
      try {
        const z = await zipParaVer(app, { titulo: titulo.value, slug: "detallito", soloPaginas: [app.estado.paginaId], conProyecto: true, alProgreso: (t) => { estado.textContent = t; } });
        estado.textContent = "Mandándolo…";
        const det = await SRV.mandarDetallito(z.blob, { titulo: titulo.value.trim() || "Un detallito", mensaje: mensaje.value.trim(), color }, poner);
        mini.then((b) => b && det?.id && SRV.subirPortadita(det.id, b)).catch(() => {}).finally(() => this._recargarCol?.());
        // 2 · Llegó: el sobre sale volando con chispitas.
        sobre.classList.remove("esperando");
        sobre.classList.add("vuela");
        const r = sobre.getBoundingClientRect();
        this._chispas(r.left + r.width / 2, r.top + r.height / 2);
        app.sonidos?.sonar("publicar");
        estado.textContent = `¡Le llegó a ${nombre}! Tu edición quedó en blanco para empezar otro.`;
        mensaje.value = ""; B.mensaje = ""; nota.textContent = "…";
        // Fase 46: ya se lo mandaste: la edición se limpia para empezar de cero (y «Mandar» se vuelve «Crear otro»).
        enviado = true;
        await app.limpiarTrasPublicar?.();
        enviar.innerHTML = I("nuevo", "Crear otro detallito");
        setTimeout(() => {
          sobre.classList.remove("vuela", "cerrado"); sobre.classList.add("abierto", "regresa");
          previa?.classList.remove("adentro"); previa?.classList.add("regresa");
          setTimeout(() => { sobre.classList.remove("regresa"); previa?.classList.remove("regresa"); }, 700);
        }, reducido() ? 0 : 1300);
      } catch (e) {
        // No se pudo: el sobre se abre y la página vuelve a salir, para intentarlo otra vez.
        sobre.classList.remove("esperando", "cerrado"); sobre.classList.add("abierto");
        previa?.classList.remove("adentro");
        estado.textContent = e.message; app.sonidos?.sonar("error");
      } finally { enviar.disabled = false; avance.hidden = true; poner(0); }
    } });
    // La colección vive en su propia pantalla: aquí, una tarjetita con las últimas portaditas.
    const minis = el("span.dt-ir-col-minis", { "aria-hidden": "true" });
    const col = el("button.dt-tarjeta.dt-ir-col", { type: "button", style: { "--i": 2 }, onClick: (e) => this.ir("coleccion", null, { desde: e.currentTarget }) }, [
      minis, el("span.dt-ir-col-t", {}, [el("b", { text: "Nuestra colección" }), el("small", { text: "Las páginas de los dos" })]), el("i.dt-ir-col-f", { html: ico("derecha") }),
    ]);
    const v = el("section.dt-pantalla", {}, [
      el("div.dt-tarjeta-grande.dt-mandar", { style: { "--i": 0 } }, [
        el("i.dt-washi", { "aria-hidden": "true" }),
        pg ? el("div.dt-mesa", {}, [previa, sobre, el("i.dt-mesa-nota", {}, [nota])]) : sobre,
        el("div.dt-mandar-texto", {}, [
          el("h2", { text: "Mandar esta página" }),
          el("p", { text: pg ? `«${pg.nombre || "Página"}» le llega a ${nombre} igualita, con sus animaciones, y se guarda en su colección.` : "Abre la página que quieras mandarle." }),
          pg ? el("small.dt-mandar-tip", { text: "Toca la vista previa para verla en grande." }) : null,
        ]),
      ]),
      pg
        ? el("div.dt-tarjeta.dt-carta-papel", { style: { "--i": 1 } }, [
          el("label.dt-campo", {}, [el("span", { text: "Título" }), titulo]),
          el("label.dt-campo", {}, [el("span", { text: "Mensajito" }), mensaje]),
          enviar, avance, estado,
        ])
        : el("div.dt-tarjeta", { style: { "--i": 1 } }, [
          el("p.dt-nota-suave", { text: "Abre o crea un librito: la página que tengas abierta es la que le llega." }),
          el("button.ed-btn.primario.dt-btn", { type: "button", html: I("editar", "Ir al editor"), onClick: () => { this.cerrar(); app.menuPrincipal?.cerrar(); } }),
        ]),
      col,
      el("button.dt-enlace", { type: "button", style: { "--i": 3 }, html: I("vincular", "Nuestro vínculo"), onClick: (e) => this.ir("vincular", null, { desde: e.currentTarget }) }),
    ]);
    const ponerMinis = () => {
      const d = this.datos;
      if (!d || !minis.isConnected) return;
      const ult = [...d.recibidos, ...d.enviados].sort((a, b) => (b.creado > a.creado ? 1 : -1)).slice(0, 3);
      minis.replaceChildren(...ult.map((x) => { const m = el("i.dt-ir-col-mini", { style: { "--c": x.color || "#ffd1e6" } }); if (x.portadita) m.style.backgroundImage = `url("${SRV.enlace(x.portadita)}")`; return m; }));
    };
    this._recargarCol = () => this._cargarDatos().then(ponerMinis).catch(() => {});
    ponerMinis();
    this._recargarCol();
    return v;
  }

  /** Trae la colección (y dice si cambió algo de lo que se ve). Las de cada uno quedan marcadas. */
  async _cargarDatos() {
    const d = await SRV.detallitos();
    for (const x of d.recibidos) x._mio = false;
    for (const x of d.enviados) x._mio = true;
    const firma = (d) => JSON.stringify([...d.recibidos, ...d.enviados].map((x) => [x.id, x.visto, x.reaccion, x.portadita, x.titulo]));
    const cambio = !this.datos || firma(d) !== firma(this.datos);
    if (cambio || !this.datos) this.datos = d;
    return cambio;
  }

  /* — La colección de los dos: por mes, con su portadita, de quién es y su reacción — */
  _vColeccion() {
    const nombre = PF.nombreDe(this.amor?.pareja) || "tu amorcito";
    this.filtro ||= "todas";
    const FIL = [["todas", "Todas"], ["suyas", `De ${nombre}`], ["mias", "Mías"]];
    const bs = FIL.map(([k, t]) => el("button", { type: "button", role: "tab", dataset: { k } }, [el("span", { text: t })]));
    const tabs = el("div.dt-tabs.tres", { role: "tablist", "aria-label": "Qué páginas ver" }, [el("i.dt-tab-luz"), ...bs]);
    const resumen = el("p.dt-col-resumen", { text: this.datos ? "" : "Buscando sus páginas…" });
    const caja = el("div.dt-rejilla-caja");
    const pintar = (tipo = null) => {
      const d = this.datos;
      tabs.dataset.on = this.filtro;
      bs.forEach((b) => { const on = b.dataset.k === this.filtro; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
      if (d) {
        const s = d.recibidos.length, m = d.enviados.length, t = s + m;
        resumen.textContent = t ? `${t} ${t === 1 ? "página" : "páginas"} · ${s} de ${nombre} · ${m} ${m === 1 ? "tuya" : "tuyas"}` : "Aquí se guarda todo lo que se manden";
      }
      const rej = d ? this._rejillaCol(d, nombre) : el("div.dt-cargando", {}, [el("i"), el("span", { text: "Buscando sus páginas…" })]);
      if (tipo && caja._actual) cambiar(caja, rej, { tipo, sonidos: this.app.sonidos, sinSonido: tipo === "zoom" });
      else { caja.replaceChildren(rej); caja._actual = rej; }
    };
    bs.forEach((b, i) => b.addEventListener("click", () => {
      if (b.dataset.k === this.filtro) return;
      const antes = FIL.findIndex((f) => f[0] === this.filtro);
      this.filtro = b.dataset.k;
      pintar(i > antes ? "deslizar" : "atras");
    }));
    pintar();
    this._recargarCol = async () => {
      try {
        const cambio = await this._cargarDatos();
        if (!caja.isConnected) return;
        // Lo que llega solo (un latido, una reacción) se pone en su lugar, sin zoom ni animación.
        if (cambio || caja._actual?.classList.contains("dt-cargando")) pintar();
        this._avisarReacciones(nombre);
      } catch (e) { if (!this.datos && caja.isConnected) { caja.replaceChildren(el("p.dt-vacio", { text: e.message })); caja._actual = caja.firstChild; } }
    };
    this._recargarCol();
    return el("section.dt-pantalla.dt-col", {}, [
      el("div.dt-col-cab", { style: { "--i": 0 } }, [el("h2", {}, [el("span", { text: "Nuestra colección" }), el("i.dt-col-corazon", { html: ico("corazon") })]), resumen]),
      this._botonChat("dt-tarjeta.dt-ir-chat", "Mensajitos", `Escríbele a ${nombre}, con GIFs y stickers`, 1),
      el("div.dt-col-filtros", { style: { "--i": 1 } }, [tabs]),
      el("div.dt-col-cuerpo", { style: { "--i": 2 } }, [caja]),
      el("button.dt-enlace", { type: "button", style: { "--i": 3 }, html: I("vincular", "Nuestro vínculo"), onClick: (e) => this.ir("vincular", null, { desde: e.currentTarget }) }),
    ]);
  }

  _rejillaCol(d, nombre) {
    const todas = [...d.recibidos, ...d.enviados].sort((a, b) => (b.creado > a.creado ? 1 : -1));
    const lista = todas.filter((x) => this.filtro === "todas" || (this.filtro === "mias" ? x._mio : !x._mio));
    const rej = el("div.dt-col-rejilla");
    if (!lista.length) {
      const [t, p] = { todas: ["Su colección empieza aquí", "Cada página que uno le mande al otro se guarda aquí, con su portadita."], suyas: [`Todavía no te llega ninguna de ${nombre}`, "En cuanto te mande una, aparece aquí."], mias: ["Todavía no le mandas ninguna", `Abre un librito y mándasela a ${nombre} desde Exportar.`] }[this.filtro];
      rej.append(el("div.dt-col-vacio", {}, [el("i.dt-col-vacio-sobre", { html: ico("detallito") }), el("b", { text: t }), el("p", { text: p })]));
      return rej;
    }
    let mes = "";
    lista.forEach((x, i) => {
      const m0 = new Date(x.creado).toLocaleDateString("es-MX", { month: "long", year: "numeric" }), m = m0.charAt(0).toUpperCase() + m0.slice(1);
      if (m !== mes) { mes = m; rej.append(el("h3.dt-col-mes", {}, [el("span", { text: m })])); }
      rej.append(this._tarjeta(x, i, nombre));
    });
    return rej;
  }

  /**
   * La portadita en su tapa (Fase 28): la página ENTERA (nunca recortada: antes se cortaba el título
   * de arriba de las páginas altas y los lados de las anchas), como una hojita con sombra, sobre un
   * velo hecho con sus propios colores. Mientras carga, la tapita de colores.
   */
  _ponerPortadita(tapa, url) {
    const fondo = el("img.dt-cv-fondo", { alt: "", loading: "lazy", decoding: "async", draggable: "false", "aria-hidden": "true" });
    const im = el("img.dt-cv-img", { alt: "", loading: "lazy", decoding: "async", draggable: "false" });
    const marco = el("span.dt-cv-marco", {}, [im]);
    im.onload = () => { tapa.classList.add("con-img"); im.classList.add("lista"); fondo.classList.add("lista"); };
    im.onerror = () => { fondo.remove(); marco.remove(); };
    fondo.src = url;
    im.src = url;
    tapa.append(fondo, marco);
  }

  /**
   * Las páginas que se mandaron sin portadita (las de antes): se dibuja con su
   * paquete, de una en una y sólo las que asoman en la pantalla, y se sube para
   * que a los dos ya les salga. Mientras, se ve su tapita de colores.
   */
  _sinPortadita(x, tapa) {
    const poner = (u) => this._ponerPortadita(tapa, u);
    this._minis ||= new Map();
    const ya = this._minis.get(x.id);
    if (ya) { if (typeof ya === "string") poner(ya); return; }
    if (!("IntersectionObserver" in window) || (x.bytes || 0) > 25e6) return;
    this._cola ||= [];
    this._vigia ||= new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { this._vigia.unobserve(e.target); if (e.target._pedir) this._cola.push(e.target._pedir); }
      this._siguiente();
    }, { rootMargin: "240px 0px" });
    tapa._pedir = async () => {
      if (this._minis.has(x.id)) return;
      this._minis.set(x.id, true);
      try {
        const b = await portaditaDePaquete(this.app, await SRV.paqueteDetallito(x.id));
        if (!b) return;
        const u = URL.createObjectURL(b);
        this._minis.set(x.id, u);
        if (tapa.isConnected) poner(u);
        SRV.subirPortadita(x.id, b).catch(() => {});
      } catch (e) { /* se queda con su tapita */ }
    };
    this._vigia.observe(tapa);
  }
  async _siguiente() {
    if (this._haciendo) return;
    this._haciendo = true;
    try { while (this._cola.length) await this._cola.shift()(); } finally { this._haciendo = false; }
  }

  /** Una página de la colección: su portadita (o una hecha con su color y su título), de quién es y su reacción. */
  _tarjeta(x, i, nombre) {
    const nuevo = !x._mio && !x.visto, rx = reaccion(x.reaccion);
    const tapa = el("span.dt-cv-tapa", { style: { "--c": x.color || "#ffd1e6" } }, [
      el("span.dt-cv-gen", { "aria-hidden": "true" }, [el("i.dt-cv-cinta"), el("b", { text: x.titulo }), el("i.dt-cv-cor", { html: ico("corazon") })]),
    ]);
    if (x.portadita) this._ponerPortadita(tapa, SRV.enlace(x.portadita));
    else this._sinPortadita(x, tapa);
    if (rx) tapa.append(el("span.dt-cv-rx", { title: x._mio ? `${nombre} ${rx.largo}` : rx.tuyo, html: svgReaccion(rx.id) }));
    const t = el("button.dt-cv" + (nuevo ? ".nueva" : "") + (x._mio && x.reaccion_nueva ? ".rx-nueva" : ""), {
      type: "button", "aria-label": `${x.titulo}, ${x._mio ? "tuya" : "de " + nombre}${rx ? ", " + rx.corto : ""}`,
      onClick: (e) => { this.app.sonidos?.sonar("detallito-abrir"); this.ir("ver", x, { desde: e.currentTarget, sinSonido: true }); },
    }, [
      tapa,
      el("span.dt-cv-quien" + (x._mio ? ".mia" : ""), {}, [PF.avatar(x._mio ? "yo" : "pareja", "dt-cv-av"), el("span", { text: x._mio ? "Yo" : nombre })]),
      nuevo ? el("em.dt-cv-nuevo", { text: "Nueva" }) : null,
      el("span.dt-cv-pie", {}, [el("b", { text: x.titulo }), el("small", { text: cuando(x.creado) + (x._mio && x.visto && !rx ? " · ya la vio" : "") })]),
    ]);
    t.style.setProperty("--i", Math.min(i, 10));
    t.style.setProperty("--r", (ROTAR[i % ROTAR.length] * 0.5).toFixed(2) + "deg");
    return t;
  }

  /** Tu amorcito reaccionó a tus páginas: se avisa una vez (y el servidor lo da por visto). */
  _avisarReacciones(nombre) {
    const nuevas = (this.datos?.enviados || []).filter((x) => x.reaccion_nueva);
    if (!nuevas.length || this._avisadas === nuevas.map((x) => x.id + x.reaccion).join()) return;
    this._avisadas = nuevas.map((x) => x.id + x.reaccion).join();
    const r = reaccion(nuevas[0].reaccion);
    aviso(nuevas.length === 1 && r ? `${nombre} ${r.largo} en «${nuevas[0].titulo}»` : `${nombre} reaccionó a ${nuevas.length} de tus páginas`, 5000);
    this.app.sonidos?.sonar("brillo");
    SRV.reaccionesVistas().then(() => { for (const x of nuevas) x.reaccion_nueva = false; dispatchEvent(new CustomEvent("ed-detallito-visto")); }).catch(() => {});
  }

  /** Reaccionar a una página que te mandó (un toque; otro toque en la misma, la quita). */
  _reaccionar(x) {
    const titulo = el("small.dt-rx-t");
    const bots = REACCIONES.map((r) => el("button.dt-rx-b", { type: "button", "aria-label": r.corto, html: svgReaccion(r.id) + `<span>${r.corto}</span>` }));
    const pintar = (id) => {
      x.reaccion = id;
      bots.forEach((b, i) => { const on = REACCIONES[i].id === id; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
      titulo.textContent = id ? reaccion(id).tuyo : "¿Qué sentiste?";
    };
    bots.forEach((b, i) => b.addEventListener("click", async () => {
      const r = REACCIONES[i], antes = x.reaccion || "", nueva = antes === r.id ? "" : r.id;
      pintar(nueva);
      if (nueva) {
        const rc = b.getBoundingClientRect();
        this.app.sonidos?.sonar("reaccion-" + nueva);
        estallido(rc.left + rc.width / 2, rc.top + rc.height / 3, nueva);
        if (!reducido()) b.querySelector("svg")?.animate([{ transform: "scale(1)" }, { transform: "scale(1.5) rotate(-10deg)", offset: 0.4 }, { transform: "scale(.92) rotate(4deg)", offset: 0.7 }, { transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
      } else this.app.sonidos?.sonar("reaccion-quitar");
      try { await SRV.reaccionar(x.id, nueva); }
      catch (e) { pintar(antes); aviso(e.status === 404 ? `Tu ${SRV.NOMBRE} todavía no sabe de reacciones: actualízalo («librito actualizar»).` : e.message, 5000, "error"); }
    }));
    pintar(x.reaccion || "");
    return el("div.dt-rx", { role: "group", "aria-label": "Reaccionar a esta página" }, [titulo, el("div.dt-rx-fila", {}, bots)]);
  }

  /** En las tuyas: cómo reaccionó tu amorcito. */
  _suReaccion(x) {
    const nombre = PF.nombreDe(this.amor?.pareja) || x.para_nombre || x.para, r = reaccion(x.reaccion);
    if (!r) return el("div.dt-rx.dt-rx-suya", {}, [el("small.dt-rx-t", { text: x.visto ? `${nombre} ya la vio · todavía no reacciona` : `${nombre} todavía no la abre` })]);
    return el("div.dt-rx.dt-rx-suya.con", {}, [
      el("span.dt-rx-grande", { html: svgReaccion(r.id) }),
      el("span.dt-rx-txt", {}, [el("b", { text: `${nombre} ${r.largo}` }), el("small", { text: cuando(x.reaccion_t) })]),
    ]);
  }

  /* — La vista previa en grande (y se puede tocar, como la verá) — */
  _vPrevia() {
    const app = this.app, P = app.estado?.proyecto, pg = app.estado?.pagina;
    if (!pg) { setTimeout(() => this.atras(), 0); return null; }
    const color = pg.fondo?.color || P?.ajustes?.tema?.fondo || "#ffd1e6";
    return el("section.dt-pantalla", {}, [
      el("div.dt-ver", { style: { "--c": color } }, [
        el("div.dt-ver-hoja.dt-previa-grande", { style: this._tam(Math.min(innerWidth - 40, 440), innerHeight * 0.6) }, [this._marcoPrevia(true)]),
        this.borrador?.mensaje?.trim() ? el("p.dt-ver-msg", { text: `«${this.borrador.mensaje.trim()}»` }) : null,
        el("small.dt-ver-de", { text: "Se puede tocar: así la va a ver (sin sonido aquí)." }),
        el("div.dt-fila.dt-ver-acc", {}, [
          el("button.ed-btn.primario", { type: "button", html: I("detallito", "Listo, quiero mandarla"), onClick: () => this.atras() }),
          el("button.ed-btn", { type: "button", html: I("editar", "Seguir editándola"), onClick: () => { this.cerrar(); app.menuPrincipal?.cerrar(); } }),
        ]),
      ]),
    ]);
  }

  /*
   * — Ver un detallito (Fases 29 y 30): la página dentro de un celular —
   * No se abre tal cual se subió (con su reproductor de entonces, la portada «Toca para abrir» y lo que
   * tuviera mal): se arma con su paquete y el reproductor de HOY, así todas las páginas ya mandadas se
   * ven bien, directo, con sus botones funcionando y con la pantalla con que se hicieron (sólo se
   * escalan). Fase 30, como la foto: el celular grande (aprovecha la pantalla), debajo su mensajito
   * escrito a mano y quién la mandó, «Ver en grande» y «Guardar en mis borradores» lado a lado, las
   * reacciones sueltas (sin tarjeta) y la lista de sus otros detallitos para pasar de uno a otro. En
   * la compu, el celular a la izquierda y todo lo demás a su lado.
   */
  _vVer(x) {
    if (!x) { setTimeout(() => this.atras(), 0); return null; }
    this.tituloS.textContent = x.titulo;
    const recibido = x._mio != null ? !x._mio : x.de && x.de !== SRV.usuario()?.usuario;
    const url = SRV.enlace(x.ver), nombre = PF.nombreDe(this.amor?.pareja) || x.de_nombre || x.de || "tu amorcito";
    if (recibido && !x.visto) SRV.visto(x.id).then(() => { x.visto = new Date().toISOString(); dispatchEvent(new CustomEvent("ed-detallito-visto")); }).catch(() => {});
    const marco = el("iframe.ed-prueba-marco.dt-marco-ver", { title: x.titulo, allow: "autoplay; fullscreen" });
    const movil = el("div.ed-movil.dt-movil", { style: { "--fondo": x.color || "#ffd1e6", "--mw": "390px", "--mh": "844px" } }, [
      el("i.ed-movil-boton.b1"), el("i.ed-movil-boton.b2"), el("i.ed-movil-boton.b3"),
      el("div.ed-movil-pantalla", {}, [marco, el("i.ed-movil-cargando")]),
      el("i.ed-movil-isla"), el("i.ed-movil-reflejo"),
    ]);
    const cerrarGrande = el("button.dt-ver-cerrar", { type: "button", html: I("cerrar", "Cerrar"), onClick: () => this._grande(false) });
    const escena = el("div.dt-ver-escena", {}, [el("i.dt-ver-luz"), movil, cerrarGrande]);
    const msg = x.mensaje ? el("p.dt-ver-msg", { text: x.mensaje }) : null;
    const de = el("small.dt-ver-de", {}, [PF.avatar(recibido ? "pareja" : "yo", "dt-ver-av"), el("span", { text: `${recibido ? "De " + (x.de_nombre || x.de) : "Tuya, para " + (x.para_nombre || x.para)} · ${cuando(x.creado)}` })]);
    const guardar = el("button.dt-pildora.lila", { type: "button", html: I("nota", "Guardar en mis borradores"), onClick: async (ev) => {
      const b = ev.currentTarget; b.disabled = true;
      try { const blob = await SRV.paqueteDetallito(x.id); this.cerrar(); await abrirComoBorrador(this.app, blob, x.titulo); }
      catch (e) { aviso("No se pudo abrir: " + e.message, 4500, "error"); b.disabled = false; }
    } });
    const acciones = el("div.dt-ver-acc", {}, [el("button.dt-pildora.rosa", { type: "button", html: I("ojo", "Ver en grande"), onClick: () => this._grande(true) }), guardar]);
    const rx = recibido ? this._reaccionar(x) : this._suReaccion(x);
    const chat = this.amor?.pareja ? el("button.dt-ver-chat", { type: "button", onClick: (e) => this.ir("chat", null, { desde: e.currentTarget }) }, [el("i", { html: ICONO_CHAT }), el("span", { text: recibido ? `Contestarle a ${nombre} con un mensajito` : `Escribirle a ${nombre}` })]) : null;
    const mas = el("div.dt-ver-mas");
    const quitar = el("button.dt-ver-quitar", { type: "button", html: I("borrar", recibido ? "Quitar de mi colección" : "Quitar de mis enviados"), onClick: async () => {
      if (!(await confirmar(recibido ? "¿Quitarlo de tu colección?" : "¿Quitarlo de tus enviados? (A tu amorcito se le queda)", "Quitar"))) return;
      try { await SRV.borrarDetallito(x.id); this.datos = null; aviso("Quitado"); this.app.sonidos?.sonar("borrar"); this.atras(); } catch (e) { aviso(e.message, 3500, "error"); }
    } });
    const lado = el("div.dt-ver-lado", {}, [msg, de, acciones, rx, chat, mas, quitar]);
    const raiz = el("div.dt-ver.dt-ver-movil", { style: { "--c": x.color || "#ffd1e6" } }, [escena, lado]);
    // Sus otros detallitos (los más nuevos primero): tocar uno lo abre aquí mismo.
    const ponerMas = () => {
      const d = this.datos;
      if (!d || !mas.isConnected) return;
      const otros = [...d.recibidos, ...d.enviados].filter((y) => y.id !== x.id).sort((a, b) => (b.creado > a.creado ? 1 : -1));
      if (!otros.length) { mas.replaceChildren(); return; }
      mas.replaceChildren(
        el("h3.dt-ver-mas-t", {}, [el("span", { text: "Más detallitos" }), el("button.dt-ver-todos", { type: "button", text: "Ver todos", onClick: () => this._aLaColeccion() })]),
        el("div.dt-ver-lista", {}, otros.slice(0, 6).map((y) => this._renglon(y, nombre))),
      );
    };
    if (this.datos) requestAnimationFrame(ponerMas); else this._cargarDatos().then(ponerMas).catch(() => {});
    // El tamaño del celular: lo más grande que quepa, dejando a la vista su mensajito, quién la mandó y
    // los dos botones (en la compu, a lo alto, con lo demás a un lado; en grande, toda la pantalla).
    const v = { W: 390, H: 844 };
    this._verMovil = { escena, movil, v, acomodar: () => {
      const grande = escena.classList.contains("grande"), B = 22, ancho = innerWidth >= 860;
      const cab = this.vista.getBoundingClientRect().top || 64;
      // Lo que va debajo, medido de verdad (un mensajito largo ocupa dos o tres renglones).
      const alto = (n, d) => (n?.isConnected && n.offsetHeight) || d;
      const debajo = alto(msg, msg ? 62 : 0) + alto(de, 34) + alto(acciones, 64) + 12 * 3 + 16;
      const aw = (grande ? innerWidth - 32 : ancho ? Math.min(560, this.vista.clientWidth * 0.5) : innerWidth - 36) - B;
      const ah = (grande ? innerHeight - 120 : ancho ? innerHeight - cab - 40 : innerHeight - cab - debajo) - B;
      movil.style.setProperty("--mw", v.W + "px");
      movil.style.setProperty("--mh", v.H + "px");
      movil.style.setProperty("--k", Math.max(0.2, Math.min(1.2, aw / v.W, Math.max(160, ah) / v.H)).toFixed(4));
      marco.style.width = v.W + "px"; marco.style.height = v.H + "px";
    } };
    this._verMovil.acomodar();
    requestAnimationFrame(() => this._verMovil?.acomodar());
    document.fonts?.ready.then(() => this._verMovil?.acomodar());
    addEventListener("resize", this._verMovil.acomodar);
    this._limpiezas.push(() => { removeEventListener("resize", this._verMovil?.acomodar); this._verMovil = null; document.body.classList.remove("dt-viendo-grande"); });
    this._cargarEnMovil(x, marco, movil, v, url).catch(() => { marco.src = url; marco.addEventListener("load", () => { marco.classList.add("listo"); movil.classList.add("lista"); }, { once: true }); });
    requestAnimationFrame(() => movil.classList.add("brilla"));
    return el("section.dt-pantalla", {}, [raiz]);
  }

  /** Un renglón de «Más detallitos»: su portadita, título o mensajito, cuándo y su reacción. */
  _renglon(y, nombre) {
    const rx = reaccion(y.reaccion), nuevo = !y._mio && !y.visto;
    const mini = el("span.dt-renglon-mini", { style: { "--c": y.color || "#ffd1e6" } }, [el("i", { html: ico("corazon") })]);
    if (y.portadita) { const im = el("img", { alt: "", loading: "lazy", decoding: "async", draggable: "false" }); im.onload = () => mini.classList.add("con-img"); im.onerror = () => im.remove(); im.src = SRV.enlace(y.portadita); mini.append(im); }
    return el("button.dt-renglon" + (nuevo ? ".nuevo" : ""), { type: "button", "aria-label": `${y.titulo}, ${y._mio ? "tuya" : "de " + nombre}`, onClick: (e) => {
      this.app.sonidos?.sonar("detallito-abrir");
      // Se cambia en su lugar: «atrás» sigue llevando a la colección (no de detallito en detallito).
      this.pila[this.pila.length - 1] = { vista: "ver", datos: y };
      this._mostrar(this.pila[this.pila.length - 1], "deslizar", { desde: e.currentTarget, sinSonido: true });
    } }, [
      mini,
      el("span.dt-renglon-t", {}, [el("b", { text: y.mensaje || y.titulo }), el("small", { text: `${y._mio ? "Tuya" : "De " + nombre} · ${cuando(y.creado)}` })]),
      rx ? el("span.dt-renglon-rx", { title: y._mio ? `${nombre} ${rx.largo}` : rx.tuyo, html: svgReaccion(rx.id) + `<span>${rx.corto}</span>` }) : nuevo ? el("em.dt-renglon-nuevo", { text: "Nueva" }) : null,
    ]);
  }

  /** «Ver todos»: la colección (la de abajo, si se llegó desde ahí). */
  _aLaColeccion() {
    const k = this.pila.findIndex((p) => p.vista === "coleccion");
    if (k >= 0) { this.pila.length = k + 1; this._mostrar(this.pila[k], "atras"); }
    else this.ir("coleccion");
  }

  /** «Ver en grande»: el mismo celular (sin recargar la página) a pantalla completa, y de vuelta. */
  _grande(si) {
    const m = this._verMovil;
    if (!m) return false;
    if (si === m.escena.classList.contains("grande")) return false;
    m.escena.classList.toggle("grande", si);
    m.escena.parentElement?.classList.toggle("grande-on", si);
    document.body.classList.toggle("dt-viendo-grande", si);
    m.acomodar();
    if (!reducido()) m.movil.animate([{ transform: si ? "scale(.82)" : "scale(1.12)", opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.15)" });
    this.app.sonidos?.sonar(si ? "abrir" : "cerrar");
    return true;
  }

  /** Arma la página del detallito con su paquete y el reproductor de hoy, dentro del celular. */
  async _cargarEnMovil(x, marco, movil, v, url) {
    const [{ leerZip }, { normalizar }] = await Promise.all([import("../export/zip.js"), import("../core/modelo.js")]);
    const zip = await leerZip(await SRV.paqueteDetallito(x.id));
    if (!zip["project.json"]) throw new Error("sin proyecto");
    const dec = new TextDecoder();
    const P = normalizar(JSON.parse(dec.decode(await zip["project.json"]())));
    // Lo que se mandó (orden y pantalla) viene en su datos.js; las de antes no traían la pantalla: su hoja base.
    let ver = {};
    try { const t = dec.decode(await zip["scripts/datos.js"]()); ver = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (e) { /* las de antes */ }
    const orden = (ver.orden || P.orden).filter((id) => P.paginas[id]);
    const pant = ver.pantalla && ver.pantalla.w > 0 ? ver.pantalla : { w: P.ajustes?.ancho || 390, h: P.ajustes?.alto || 844 };
    v.W = Math.round(pant.w); v.H = Math.round(pant.h);
    movil.classList.toggle("horizontal", v.W > v.H);
    this._verMovil?.acomodar();
    // Sus fotos, música y videos, del mismo paquete.
    const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
    const urls = {}, blobs = {}, hechas = [];
    for (const a of Object.values(P.assets || {})) {
      const ruta = a.archivoZip || ver.archivos?.[a.id];
      if (!ruta || !zip[ruta]) continue;
      const b = new Blob([await zip[ruta]()], { type: a.mime || MIME[ruta.split(".").pop().toLowerCase()] || "" });
      blobs[a.id] = b;
      hechas.push(urls[a.id] = URL.createObjectURL(b));
    }
    this._limpiezas.push(() => hechas.forEach((u) => URL.revokeObjectURL(u)));
    // Lo que piden sus HTML va como data: (un marco aislado no abre las blob:).
    const datosUrls = {};
    const aDatos = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(b); });
    for (const pid of orden) {
      const pg = P.paginas[pid];
      for (const id of [...(pg.els || []).flatMap((e) => Object.values(e.html?.archivos || {})), ...Object.values(pg.fondo?.html?.archivos || {})]) if (blobs[id] && !datosUrls[id]) datosUrls[id] = await aDatos(blobs[id]);
    }
    if (!marco.isConnected) return;
    const al = (ev) => {
      if (ev.source !== marco.contentWindow || ev.data?.tipo !== "vista-lista") return;
      marco.contentWindow.postMessage({
        tipo: "librito", datos: { nombre: P.nombre, ajustes: P.ajustes, orden, paginas: P.paginas, titulos: {} },
        urls, datosUrls, base: RAIZ, inicio: orden[0], portadilla: false, prueba: true, fuentes: [...fuentesUsadas(P)], fijar: { w: v.W, h: v.H },
      }, location.origin);
      // Fase 32: el celular toma la forma de la hoja DE VERDAD (las de tamaño fijo, p. ej. 1080×1350, se
      // guardaban con la forma de la pantalla del editor y sobraban franjas rellenas arriba y abajo).
      let vueltas = 0;
      const medir = () => {
        const L = marco.contentWindow?.LibritoRT?.libro;
        if (!(L?.W > 0 && L?.H > 0) && ++vueltas < 40) { setTimeout(medir, 50); return; }
        if (L?.W > 0 && Math.abs(L.W / L.H - v.W / v.H) > 0.004) {
          const f = Math.min(1, 900 / Math.max(L.W, L.H));
          v.W = Math.round(L.W * f); v.H = Math.round(L.H * f);
          movil.classList.toggle("horizontal", v.W > v.H);
          this._verMovil?.acomodar();
        }
        requestAnimationFrame(() => requestAnimationFrame(() => { marco.classList.add("listo"); movil.classList.add("lista"); }));
      };
      setTimeout(medir, 60);
    };
    addEventListener("message", al);
    this._limpiezas.push(() => removeEventListener("message", al));
    marco.src = "runtime/reproductor.html";
    void url;
  }

  /* — Adornos — */
  _chispas(x, y, n = 14) {
    if (reducido()) return;
    for (let i = 0; i < n; i++) {
      const s = el("i.dt-chispa", { html: ico("corazon") });
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 60 + Math.random() * 90;
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d - 30 + "px");
      s.style.setProperty("--rot", (Math.random() * 80 - 40) + "deg");
      document.body.append(s);
      setTimeout(() => s.remove(), 1200);
    }
  }
}

/** En el teléfono no se abre el teclado solo (taparía la escenita). */
const sinTeclado = () => matchMedia("(pointer: coarse)").matches;
