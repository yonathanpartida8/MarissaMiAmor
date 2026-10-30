/**
 * LOS MENSAJITOS DE LA CASITA (Fase 55, como en Roblox): una barrita delgada abajo para escribir sin tapar
 * la casa; lo que escriben sale en globitos arriba de su monito (hasta 3 seguidos: al llegar otro, se va el
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

  /* ── La barrita para escribir (no tapa la casa) ── */
  barra(on = !this.abierto()) {
    const j = this.j;
    if (!this.barraN) {
      this.campo = el("input.ca-chat-campo", { type: "text", maxlength: String(MAX.msg), placeholder: "Escribe algo…", enterkeyhint: "send", autocomplete: "off", "aria-label": "Mensaje" });
      this.campo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this._enviar(); } else if (e.key === "Escape") this.barra(false); });
      this.logN = el("div.ca-chat-log", { hidden: "", role: "log", "aria-label": "Mensajes de esta vez" });
      this.logB = el("button.ca-chat-b", { type: "button", "aria-label": "Ver los mensajes de esta vez", title: "Los de esta vez", html: ICO.historial, onClick: () => { this.logN.hidden = !this.logN.hidden; this.logB.classList.toggle("on", !this.logN.hidden); this._pintarLog(); } });
      this.barraN = el("div.ca-chat", {}, [
        this.logN,
        el("div.ca-chat-fila", {}, [
          this.logB,
          el("button.ca-chat-b", { type: "button", "aria-label": "Escribir una cartita", title: "Cartitas", html: ICO.carta, onClick: () => this.cartas() }),
          this.campo,
          el("button.ca-chat-b.mandar", { type: "button", "aria-label": "Mandar", html: ICO.enviar, onClick: () => this._enviar() }),
          el("button.ca-chat-b", { type: "button", "aria-label": "Cerrar", html: ICO.cerrar, onClick: () => this.barra(false) }),
        ]),
      ]);
      j.raiz.append(this.barraN);
    }
    this.barraN.classList.toggle("ver", on);
    j.mensajesB?.classList.toggle("on", on);
    j.raiz.classList.toggle("con-chat", on);
    if (on) setTimeout(() => this.campo.focus({ preventScroll: true }), 60);
    else this.campo.blur();
    j.sonar(on ? "abrir" : "cerrar", { volumen: 0.5 });
  }
  _enviar() {
    const t = this.campo.value;
    if (!t.trim()) { this.campo.focus(); return; }
    this.campo.value = "";
    this.mandar(t);
    this.campo.focus({ preventScroll: true });
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
