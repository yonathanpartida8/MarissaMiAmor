/**
 * LOS MENSAJITOS DE LA CASITA (Fase 54): un chat chiquito dentro del juego (sale como globito arriba del
 * monito de quien lo manda, con «Visto») y las cartitas, que llegan al buzón del jardín con su banderita
 * arriba. Lo guarda el servidor (/api/casita/mensaje y /api/casita/leer) y llega con la misma escucha de la
 * casita (`r.msgs`). Todo se pinta como texto (textContent), nunca como HTML.
 */
import { el, aviso } from "../ui.js";
import * as SRV from "../../integraciones/servidor.js";
import { ICO } from "./iconos.js";
import { hoja } from "./paneles.js";

const FRASES = ["Te amo", "Ven conmigo", "¿Comemos juntos?", "Ya está la comida", "¿Vemos la tele?", "Te extraño", "Abrazo", "Hola, amor", "¿Bailamos?", "Buenas noches", "Eres hermosa", "Eres hermoso"];
const MAX = { msg: 300, carta: 1000 };
const enMs = (t) => (typeof t === "number" ? (t > 1e12 ? t : t * 1000) : Date.parse(t) || Date.now());
const hora = (t) => new Date(enMs(t)).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
const dia = (t) => new Date(enMs(t)).toLocaleDateString("es-MX", { day: "numeric", month: "long" });

export class Mensajes {
  constructor(j) { this.j = j; this.lista = []; this.ult = 0; this.vista = "msg"; }

  /** Lo que llega con la casita (cada vez que algo cambia). */
  recibir(lista, primera) {
    if (!Array.isArray(lista)) return;
    const antes = this.ult;
    this.lista = lista.filter((m) => m && Number.isFinite(+m.id));
    const max = this.lista.reduce((a, m) => Math.max(a, +m.id), 0);
    // (Lo que ya estaba al entrar no suena: sólo lo que llega mientras juegan.)
    if (!primera && this._yaVisto) for (const m of this.lista) if (+m.id > antes && !m.mio) this._llega(m);
    this._yaVisto = true;
    this.ult = Math.max(antes, max);
    this.marcas();
    if (this.abierto()) this.pintar();
  }
  _llega(m) {
    const j = this.j;
    if (m.tipo === "carta") { j.sonar("carta-llega"); aviso(`${j.pareja} te dejó una cartita en el buzón del jardín`, 3600); return; }
    j._globo(j.suyo, m.texto, 5200);
    j.sonar("mensaje-llega");
  }
  sinLeer() { return this.lista.filter((m) => !m.mio && !m.leido && m.tipo !== "carta").length; }
  cartaNueva() { return this.lista.find((m) => !m.mio && !m.leido && m.tipo === "carta") || null; }
  /** El numerito del botón y la banderita del buzón. */
  marcas() {
    const j = this.j, n = this.sinLeer(), c = !!this.cartaNueva();
    if (j.badgeN) { j.badgeN.textContent = n > 9 ? "9+" : String(n || (c ? 1 : 0)); j.badgeN.hidden = !n && !c; }
    for (const r of j.objs.values()) if (r.d.k === "buzon") r.n.classList.toggle("hay-carta", c);
  }
  abierto() { return !!this.j.panel?.isConnected && this.j.panel.classList.contains("mensajes"); }

  async mandar(texto, tipo = "msg") {
    const j = this.j;
    texto = String(texto || "").replace(/\s+$/g, "").slice(0, MAX[tipo] || 300);
    if (!texto.trim()) return false;
    try {
      const m = await SRV.casitaMensaje(texto, tipo);
      if (m && !this.lista.some((x) => +x.id === +m.id)) this.lista = [...this.lista, m];
      this.ult = Math.max(this.ult, +(m?.id || 0));
      if (tipo === "carta") { j.sonar("carta"); aviso("Tu cartita va volando a su buzón", 2800); }
      else { j._globo(j.yo, texto.trim().slice(0, 120), 4600); j.sonar("mensaje"); }
      if (this.abierto()) this.pintar();
      return true;
    } catch (e) {
      aviso(e.status === 429 ? "Vas muy rápido: espera tantito" : e.message || "No se pudo mandar", 3000, "error");
      j.sonar("nop");
      return false;
    }
  }
  _leerMensajes() {
    const ids = this.lista.filter((m) => !m.mio && !m.leido && m.tipo !== "carta").map((m) => +m.id);
    if (!ids.length) return;
    const hasta = Math.max(...ids);
    for (const m of this.lista) if (!m.mio && m.tipo !== "carta" && +m.id <= hasta) m.leido = 1;
    this.marcas();
    SRV.casitaLeer({ hasta }).catch(() => {});
  }
  _leerCarta(m) {
    if (m.mio || m.leido) return;
    m.leido = 1;
    this.marcas();
    SRV.casitaLeer({ id: +m.id }).catch(() => {});
  }

  /* ── El panel: Mensajitos y Cartitas ── */
  panel(vista = this.vista) {
    const j = this.j;
    this.vista = vista;
    this.listaN = el("div.ca-msgs", { role: "log", "aria-live": "polite" });
    this.campo = el("textarea.ca-campo.ca-msg-campo", { rows: "1", maxlength: String(MAX.msg), placeholder: "Escríbele algo bonito…", enterkeyhint: "send" });
    const enviar = el("button.ca-boton.ca-msg-enviar", { type: "button", "aria-label": "Mandar", html: ICO.enviar, onClick: () => this._enviarCampo() });
    this.campo.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this._enviarCampo(); } });
    this.campo.addEventListener("input", () => { this.campo.style.height = "auto"; this.campo.style.height = Math.min(110, this.campo.scrollHeight) + "px"; });
    this.frasesN = el("div.ca-frases.ca-msg-frases", {}, FRASES.map((f) => el("button.ca-chip", { type: "button", text: f, onClick: () => this.mandar(f) })));
    this.pieN = el("div.ca-msg-pie", {}, [this.frasesN, el("div.ca-msg-fila", {}, [this.campo, enviar])]);
    const tab = (k, t) => el("button.ca-cat-tab" + (k === vista ? ".on" : ""), { type: "button", role: "tab", "aria-selected": String(k === vista), text: t, onClick: () => { if (this.vista === k) return; this.vista = k; for (const b of tabs.children) { const on = b === tab0[k]; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); } this.pintar(); j.sonar("hoja", { volumen: 0.5 }); } });
    const tab0 = { msg: tab("msg", "Mensajitos"), carta: tab("carta", "Cartitas") };
    const tabs = el("div.ca-cat-tabs.ca-msg-tabs", { role: "tablist" }, [tab0.msg, tab0.carta]);
    hoja(j, "Mensajes", el("div.ca-msg", {}, [tabs, this.listaN, this.pieN]), "mensajes");
    this.pintar();
  }
  _enviarCampo() {
    const t = this.campo.value;
    if (!t.trim()) { this.campo.focus(); return; }
    this.campo.value = ""; this.campo.style.height = "auto";
    this.mandar(t);
  }
  pintar() {
    if (!this.listaN?.isConnected) return;
    const j = this.j, cartas = this.vista === "carta";
    this.pieN.hidden = cartas;
    if (cartas) {
      const ls = this.lista.filter((m) => m.tipo === "carta").slice().reverse();
      this.listaN.className = "ca-msgs cartas";
      this.listaN.replaceChildren(
        el("button.ca-carta-nueva", { type: "button", onClick: () => this.escribirCarta() }, [el("i", { html: ICO.escribir }), el("span", {}, [el("b", { text: "Escribir una cartita" }), el("small", { text: "Le llega a su buzón del jardín, con su banderita arriba" })])]),
        ...(ls.length ? ls.map((m) => el("button.ca-carta-b" + (!m.mio && !m.leido ? ".nueva" : ""), { type: "button", onClick: () => this.carta(m) }, [
          el("i", { html: ICO.carta }),
          el("span", {}, [el("b", { text: m.mio ? "Tu cartita" : `De ${j.pareja}` }), el("small", { text: String(m.texto || "").split("\n")[0].slice(0, 70) })]),
          el("em", { text: !m.mio && !m.leido ? "Nueva" : dia(m.t) }),
        ])) : [el("p.ca-msg-vacio", { text: "Todavía no hay cartitas. ¡Escribe la primera!" })]),
      );
      return;
    }
    const ls = this.lista.filter((m) => m.tipo !== "carta");
    this.listaN.className = "ca-msgs";
    const ultMio = [...ls].reverse().find((m) => m.mio);
    this.listaN.replaceChildren(...(ls.length ? ls.map((m) => el("div.ca-burbuja" + (m.mio ? ".mia" : ""), {}, [
      el("p", { text: m.texto }),
      el("small", { text: hora(m.t) + (m === ultMio && m.leido ? " · Visto" : "") }),
    ])) : [el("p.ca-msg-vacio", { text: `Escríbele a ${j.pareja}: le sale en un globito arriba de tu monito.` })]));
    requestAnimationFrame(() => { this.listaN.scrollTop = this.listaN.scrollHeight; });
    this._leerMensajes();
  }
  /** Leer una cartita (la tuya o la suya). */
  carta(m) {
    const j = this.j;
    this._leerCarta(m);
    j.sonar("carta");
    hoja(j, m.mio ? "Tu cartita" : `Cartita de ${j.pareja}`, el("div.ca-carta", {}, [
      el("div.ca-carta-papel", {}, [el("small", { text: dia(m.t) }), el("p", { text: m.texto }), el("b", { text: m.mio ? "Con amor, tú" : `Con amor, ${j.pareja}` })]),
      el("button.ca-chip", { type: "button", text: "Ver todas las cartitas", onClick: () => this.panel("carta") }),
    ]), "carta-hoja");
  }
  escribirCarta() {
    const j = this.j;
    const texto = el("textarea.ca-carta-campo", { maxlength: String(MAX.carta), placeholder: `Querido amor:\n\n…`, rows: "8" });
    const cuenta = el("small.ca-carta-cuenta", { text: `0 / ${MAX.carta}` });
    texto.addEventListener("input", () => { cuenta.textContent = `${texto.value.length} / ${MAX.carta}`; });
    const mandarB = el("button.ca-boton", { type: "button", text: "Mandar al buzón", onClick: async () => {
      if (!texto.value.trim()) { texto.focus(); return; }
      mandarB.disabled = true;
      if (await this.mandar(texto.value, "carta")) this.panel("carta"); else mandarB.disabled = false;
    } });
    hoja(j, "Escribir una cartita", el("div.ca-carta", {}, [el("div.ca-carta-papel.escribe", {}, [texto]), el("div.ca-msg-fila", {}, [cuenta, el("span.ca-hueco"), mandarB])]), "carta-hoja");
    setTimeout(() => texto.focus({ preventScroll: true }), 320);
  }
}
