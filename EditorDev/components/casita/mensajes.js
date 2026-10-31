/**
 * LOS MENSAJITOS DE LA CASITA (Fase 55, como en Roblox; Fase 56: se escribe dentro de la burbujita de tu
 * monito): lo que escriben sale en globitos arriba de su monito (hasta 3 seguidos: al llegar otro, se va el
 * más viejo). Un cajoncito chiquito guarda los de esta vez y se limpia al salir. Las cartitas siguen
 * llegando al buzón del jardín. Lo guarda el servidor (/api/casita/mensaje y /api/casita/leer) y llega con
 * la escucha de la casita (`r.msgs`). Todo se pinta como texto (textContent), nunca como HTML.
 */
import { el, aviso } from "../ui.js";
import * as SRV from "../../integraciones/servidor.js";
import { ICO } from "./iconos.js";
import { hoja } from "./paneles.js";

const MAX = { msg: 300, carta: 1000 };
const DURA = 9000;
const enMs = (t) => (typeof t === "number" ? (t > 1e12 ? t : t * 1000) : Date.parse(t) || Date.now());
const hora = (t) => new Date(enMs(t)).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
const dia = (t) => new Date(enMs(t)).toLocaleDateString("es-MX", { day: "numeric", month: "long" });

export class Mensajes {
  constructor(j) { this.j = j; this.lista = []; this.ult = 0; this.desde = null; this.sesion = []; }

  /** Lo que llega con la casita (cada vez que algo cambia). */
  recibir(lista, primera) {
    if (!Array.isArray(lista)) return;
    const antes = this.ult;
    this.lista = lista.filter((m) => m && Number.isFinite(+m.id));
    const max = this.lista.reduce((a, m) => Math.max(a, +m.id), 0);
    // (Lo que ya estaba al entrar no se muestra: el cajoncito empieza limpio cada vez.)
    if (this.desde == null) this.desde = max;
    if (!primera && this._yaVisto) for (const m of this.lista) if (+m.id > antes && !m.mio) this._llega(m);
    this._yaVisto = true;
    this.ult = Math.max(antes, max);
    this.marcas();
  }
  _llega(m) {
    const j = this.j;
    if (m.tipo === "carta") { j.sonar("carta-llega"); aviso(`${j.pareja} te dejó una cartita en el buzón del jardín`, 3600); return; }
    this._anotar(m);
    j._globo(j.suyo, m.texto, DURA);
    j.sonar("mensaje-llega");
    SRV.casitaLeer({ hasta: +m.id }).catch(() => {});
  }
  _anotar(m) {
    if (this.sesion.some((x) => +x.id === +m.id)) return;
    this.sesion.push(m);
    if (this.sesion.length > 80) this.sesion.shift();
    this._pintarLog();
  }
  cartaNueva() { return this.lista.find((m) => !m.mio && !m.leido && m.tipo === "carta") || null; }
  /** El puntito del botón (cartita nueva) y la banderita del buzón. */
  marcas() {
    const j = this.j, c = !!this.cartaNueva();
    if (j.badgeN) { j.badgeN.textContent = "1"; j.badgeN.hidden = !c; }
    for (const r of j.objs.values()) if (r.d.k === "buzon") r.n.classList.toggle("hay-carta", c);
  }
  abierto() { return !!this.barraN?.classList.contains("ver"); }

  async mandar(texto, tipo = "msg") {
    const j = this.j;
    texto = String(texto || "").replace(/\s+$/g, "").slice(0, MAX[tipo] || 300);
    if (!texto.trim()) return false;
    try {
      const m = await SRV.casitaMensaje(texto, tipo);
      if (m && !this.lista.some((x) => +x.id === +m.id)) this.lista = [...this.lista, m];
      this.ult = Math.max(this.ult, +(m?.id || 0));
      if (tipo === "carta") { j.sonar("carta"); aviso("Tu cartita va volando a su buzón", 2800); }
      else { if (m) this._anotar(m); j._globo(j.yo, texto.trim(), DURA); j.sonar("mensaje"); }
      return true;
    } catch (e) {
      aviso(e.status === 429 ? "Vas muy rápido: espera tantito" : e.message || "No se pudo mandar", 3000, "error");
      j.sonar("nop");
      return false;
    }
  }

  /* ── Escribir dentro de la burbujita de tu monito (Fase 56) ──
   * No hay cajón ni pantalla blanca: la burbujita sale arriba de su cabeza y ahí escribes. Al abrir el
   * teclado la casita NO cambia de tamaño (se congela la medida) y sólo se sube lo justo para que tu
   * monito y su burbujita queden arriba del teclado; al cerrarlo, todo regresa como estaba. */
  barra(on = !this.abierto()) {
    const j = this.j;
    j.protegerSalida();
    if (!this.barraN) {
      this.campo = el("input.ca-chat-campo", { type: "text", maxlength: String(MAX.msg), placeholder: "Escribe algo…", enterkeyhint: "send", autocomplete: "off", autocapitalize: "sentences", "aria-label": "Mensaje" });
      this.campo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this._enviar(); } else if (e.key === "Escape") this.barra(false); });
      this.campo.addEventListener("focus", () => this._teclado(true));
      this.campo.addEventListener("blur", () => setTimeout(() => {
        if (!this.abierto() || this.barraN.contains(document.activeElement)) return;
        this._teclado(false);
        if (!this.campo.value.trim()) this.barra(false);   // (si dejaste algo escrito, la burbujita se queda)
      }, 160));
      this.logN = el("div.ca-chat-log", { hidden: "", role: "log", "aria-label": "Mensajes de esta vez" });
      const b = (k, t, al, extra = "") => el("button.ca-chat-b" + extra, { type: "button", "aria-label": t, title: t, html: ICO[k], onPointerdown: (e) => e.preventDefault(), onClick: al });
      this.logB = b("historial", "Los mensajes de esta vez", () => { this.logN.hidden = !this.logN.hidden; this.logB.classList.toggle("on", !this.logN.hidden); this._pintarLog(); });
      this.barraN = el("div.ca-chat", { role: "dialog", "aria-label": "Escribir un mensajito" }, [
        el("div.ca-chat-globo", {}, [
          this.campo,
          el("div.ca-chat-fila", {}, [
            this.logB,
            b("carta", "Escribir una cartita", () => this.cartas()),
            el("span.ca-hueco"),
            b("cerrar", "Cerrar", () => this.barra(false)),
            b("enviar", "Mandar", () => this._enviar(), ".mandar"),
          ]),
        ]),
        el("i.ca-chat-cola"),
      ]);
      j.raiz.append(this.logN, this.barraN);
    }
    this.barraN.classList.toggle("ver", on);
    j.mensajesB?.classList.toggle("on", on);
    j.raiz.classList.toggle("con-chat", on);
    clearInterval(this._tU);
    if (on) {
      j._seguir(j.yo.gx);
      this._ubicar();
      this._tU = setInterval(() => this._ubicar(), 120);    // sigue a tu monito si camina
      setTimeout(() => this.abierto() && this.campo.focus({ preventScroll: true }), 60);
    } else {
      this.logN.hidden = true; this.logB.classList.remove("on");
      this.campo.blur();
      this._teclado(false);
    }
    j.sonar(on ? "abrir" : "cerrar", { volumen: 0.5 });
  }
  /** Teclado abierto: congela la medida de la casita y escucha cómo cambia la parte visible de la pantalla. */
  _teclado(on) {
    const j = this.j, vv = window.visualViewport;
    if (on === !!j._congelado) { this._ubicar(); return; }
    j._congelado = on;
    j.raiz.classList.toggle("escribiendo", on);
    document.body.classList.toggle("ca-escribiendo", on);
    if (on) {
      this._alVV = () => this._ubicar();
      vv?.addEventListener("resize", this._alVV); vv?.addEventListener("scroll", this._alVV);
      window.addEventListener("resize", this._alVV);
      // (Al salir el teclado, el navegador desplaza la página y sus cajas para mostrar el campo: eso hacía
      //  que todo brincara. Aquí no se mueve nada: lo regresamos y sólo sube la casita, a nuestra manera.)
      window.addEventListener("scroll", this._alVV, true);
    } else {
      vv?.removeEventListener("resize", this._alVV); vv?.removeEventListener("scroll", this._alVV);
      window.removeEventListener("resize", this._alVV);
      window.removeEventListener("scroll", this._alVV, true);
      this._sinDesplazar();
      j.protegerSalida();   // (el teclado se acaba de ir: un «Atrás» ahorita no te saca del juego)
      j._subir = 0;
      j.mundo.classList.remove("subiendo");
      requestAnimationFrame(() => { if (j.vivo) { j._medir(); this._ubicar(); } });
    }
  }
  /** Regresa a su lugar lo que el navegador haya desplazado (la página y las cajas de arriba de la casita). */
  _sinDesplazar() {
    const j = this.j;
    for (let n = j.raiz; n && n !== document.documentElement; n = n.parentElement) if (n.scrollTop) n.scrollTop = 0;
    for (const n of [j.escena, j.vistaN.parentElement]) if (n?.scrollTop) n.scrollTop = 0;
    if (window.scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0);
  }
  /** Pone la burbujita arriba de la cabeza de tu monito y, con el teclado abierto, sube la casita lo justo. */
  _ubicar() {
    const j = this.j, n = this.barraN;
    if (!n || !this.abierto() || !j.vivo) return;
    if (j._congelado) this._sinDesplazar();
    const R = j.raiz.getBoundingClientRect(), V = j.vistaN.getBoundingClientRect(), vv = window.visualViewport;
    const vTop = Math.max(V.top, vv ? vv.offsetTop : 0), vBot = Math.min(V.bottom, vv ? vv.offsetTop + vv.height : innerHeight);
    const C = j.yo.caja.getBoundingClientRect(), bh = n.offsetHeight, bw = n.offsetWidth;
    if (j._congelado) {
      // (Medidas sin lo que ya se subió: pies abajo del teclado → subir; burbujita que no se salga por arriba.)
      const s0 = j._subir || 0, pies = C.bottom + s0, arriba = C.top + s0 - 12 - bh;
      const s = Math.round(Math.max(0, Math.min(pies - (vBot - 10), arriba - (vTop + 6))));
      if (Math.abs(s - s0) > 1) { j._subir = s; j.mundo.classList.add("subiendo"); j._moverMundo(); }
    }
    const C2 = j.yo.caja.getBoundingClientRect(), cx = (C2.left + C2.right) / 2 - R.left;
    const x = Math.max(8, Math.min(R.width - bw - 8, cx - bw / 2)), y = Math.max(vTop - R.top + 6, C2.top - R.top - 12 - bh);
    n.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    n.style.setProperty("--cola", Math.max(16, Math.min(bw - 16, cx - x)).toFixed(0) + "px");
  }
  /** Al salir de la casita: nada se queda escuchando ni corriendo. */
  cerrarTodo() {
    clearInterval(this._tU);
    if (this.j._congelado) this._teclado(false);
    document.body.classList.remove("ca-escribiendo");
  }
  /** (Fase 58) Mandar y listo: la burbujita se cierra sola, el teclado se va y nada te saca del juego
   *  (el «Atrás» o un toque que caiga en «Volver atrás» justo cuando se cierra el teclado se ignoran un ratito). */
  _enviar() {
    const t = this.campo.value;
    if (!t.trim()) { this.campo.focus(); return; }
    this.campo.value = "";
    this.j.protegerSalida();
    this.mandar(t);
    this.barra(false);
  }
  _pintarLog() {
    if (!this.logN || this.logN.hidden) return;
    const j = this.j;
    this.logN.replaceChildren(...(this.sesion.length ? this.sesion.map((m) => el("p.ca-chat-l" + (m.mio ? ".mio" : ""), {}, [
      el("b", { text: (m.mio ? "Tú" : j.pareja) + ": " }), el("span", { text: m.texto }), el("small", { text: hora(m.t) }),
    ])) : [el("p.ca-chat-vacio", { text: "Aquí quedan los mensajes de esta vez (se borran al salir)." })]));
    this.logN.scrollTop = this.logN.scrollHeight;
  }

  /* ── Las cartitas (llegan al buzón) ── */
  _leerCarta(m) {
    if (m.mio || m.leido) return;
    m.leido = 1;
    this.marcas();
    SRV.casitaLeer({ id: +m.id }).catch(() => {});
  }
  /** La lista de cartitas (las tuyas y las suyas) y el botón para escribir una. */
  cartas() {
    const j = this.j, ls = this.lista.filter((m) => m.tipo === "carta").slice().reverse();
    hoja(j, "Cartitas", el("div.ca-carta", {}, [
      el("button.ca-carta-nueva", { type: "button", onClick: () => this.escribirCarta() }, [el("i", { html: ICO.escribir }), el("span", {}, [el("b", { text: "Escribir una cartita" }), el("small", { text: "Le llega a su buzón del jardín, con su banderita arriba" })])]),
      ...(ls.length ? ls.map((m) => el("button.ca-carta-b" + (!m.mio && !m.leido ? ".nueva" : ""), { type: "button", onClick: () => this.carta(m) }, [
        el("i", { html: ICO.carta }),
        el("span", {}, [el("b", { text: m.mio ? "Tu cartita" : `De ${j.pareja}` }), el("small", { text: String(m.texto || "").split("\n")[0].slice(0, 70) })]),
        el("em", { text: !m.mio && !m.leido ? "Nueva" : dia(m.t) }),
      ])) : [el("p.ca-msg-vacio", { text: "Todavía no hay cartitas. ¡Escribe la primera!" })]),
    ]), "carta-hoja");
  }
  /** Leer una cartita (la tuya o la suya). */
  carta(m) {
    const j = this.j;
    this._leerCarta(m);
    j.sonar("carta");
    hoja(j, m.mio ? "Tu cartita" : `Cartita de ${j.pareja}`, el("div.ca-carta", {}, [
      el("div.ca-carta-papel", {}, [el("small", { text: dia(m.t) }), el("p", { text: m.texto }), el("b", { text: m.mio ? "Con amor, tú" : `Con amor, ${j.pareja}` })]),
      el("button.ca-chip", { type: "button", text: "Ver todas las cartitas", onClick: () => this.cartas() }),
    ]), "carta-hoja");
  }
  escribirCarta() {
    const j = this.j;
    const texto = el("textarea.ca-carta-campo", { maxlength: String(MAX.carta), placeholder: "Querido amor:\n\n…", rows: "8" });
    const cuenta = el("small.ca-carta-cuenta", { text: `0 / ${MAX.carta}` });
    texto.addEventListener("input", () => { cuenta.textContent = `${texto.value.length} / ${MAX.carta}`; });
    const mandarB = el("button.ca-boton", { type: "button", text: "Mandar al buzón", onClick: async () => {
      if (!texto.value.trim()) { texto.focus(); return; }
      mandarB.disabled = true;
      if (await this.mandar(texto.value, "carta")) this.cartas(); else mandarB.disabled = false;
    } });
    hoja(j, "Escribir una cartita", el("div.ca-carta", {}, [el("div.ca-carta-papel.escribe", {}, [texto]), el("div.ca-msg-fila", {}, [cuenta, el("span.ca-hueco"), mandarB])]), "carta-hoja");
    setTimeout(() => texto.focus({ preventScroll: true }), 320);
  }
}
