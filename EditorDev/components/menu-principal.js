/**
 * MENÚ PRINCIPAL — lo primero que se ve al abrir el editor: un álbum de
 * recortes de los dos (Fase 22). Mientras está a la vista, el editor se va
 * cargando por detrás.
 *
 *   Arriba      el corazón de píxeles, My Love Pages (la app; su servidor es M.YNTHN) y su lema; tu cuenta en una
 *               etiqueta de papel con su coronita (tu foto y tu nombre → perfil).
 *   La pareja   dos polaroids con cinta washi (tu foto y la de tu amorcito o,
 *               sin foto, un atardecer y una ciudad de noche), unidas por un
 *               hilo rojo que se hace corazón y late; la notita «Juntos
 *               siempre es mejor».
 *   Los días    una tarjetita de papel rasgado con su clip: cuántos días
 *               llevan juntos (sube al abrir), lo que viene (mesiversario,
 *               aniversario o un cumpleaños) y su barrita que se llena.
 *   Crear       el botón grande «Crear detallito» y, a su lado, un gatito
 *               dormido que respira, mueve la cola y suelta sus «z» (si lo
 *               tocas, ronronea y se acomoda).
 *   Tarjetas    Mensajitos (con tu amorcito vinculado), Detallitos (la colección de los
 *               dos), Mis libritos y la Tiendita Cool (en construcción): de dos en dos.
 *
 * Todo cabe en la pantalla sin deslizar (Fase 34): los tamaños se ajustan al alto
 * de la pantalla y lo que sobra se reparte parejito.
 *   Abajo       nada que tape: el editor es un proyecto aparte, ya no hay «Volver
 *               al librito» (Fase 35).
 *
 * Todo se anima con transform y opacity (nada se repinta: el gatito va en
 * piezas, cada una en su capa) y espera quieto hasta que llegan las letras.
 * Sin parpadeos: un latido o un cambio chiquito sólo cambia su pedacito; la
 * pantalla se rehace (con transición) sólo si cambia lo grande.
 */
import { el, aviso, quitarAviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";
import { cambiar, ajustar, letrasListas, sinMovimiento } from "./transiciones.js";
import * as PF from "./perfil.js";
import * as A from "./album-arte.js";
import { ICONO_CHAT } from "./chat.js";
import { vistaAjustes } from "./ajustes-app.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

function saludoDeLaHora() {
  const h = new Date().getHours();
  return h < 6 ? "Qué desvelo tan bonito" : h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/* Cómo se va de una pantalla a otra (las que no están: «zoom»). */
const CAMINO = { "inicio>cuenta": "carta", "cuenta>inicio": "atras", "inicio>perfil": "pagina", "perfil>inicio": "regresa", "cuenta>perfil": "pagina", "inicio>ajustes": "pagina", "ajustes>inicio": "regresa" };
/* El hilo rojo: dos tramos fijos y, en medio, el corazón que late (en su propia capa). */
// (Fase 36) El hilo rojo: una curva suave de foto a foto que se hunde un poquito hacia el corazón,
// con su brillo que lo recorre; el corazón, fino y redondito, con relleno rosado muy suave y su latido.
const HILO_CORAZON = '<svg viewBox="0 0 48 44" aria-hidden="true"><defs><linearGradient id="mpCorRelleno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd3e2" stop-opacity=".9"/><stop offset="1" stop-color="#ff8db4" stop-opacity=".55"/></linearGradient></defs><path class="mp-cor-relleno" d="M24 39.4C17.6 34.2 8.4 27.8 8.1 18.4 7.9 12.3 12.2 8 17.5 8c3 0 5.3 1.6 6.5 4 1.2-2.4 3.5-4 6.5-4 5.3 0 9.6 4.3 9.4 10.4-.3 9.4-9.5 15.8-15.9 21z" fill="url(#mpCorRelleno)"/><path class="mp-cor-linea" d="M24 39.4C17.6 34.2 8.4 27.8 8.1 18.4 7.9 12.3 12.2 8 17.5 8c3 0 5.3 1.6 6.5 4 1.2-2.4 3.5-4 6.5-4 5.3 0 9.6 4.3 9.4 10.4-.3 9.4-9.5 15.8-15.9 21z" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.4 15.6c.8-1.8 2.3-2.8 4-2.9" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/></svg>';
const LAPIZ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m13.8 7 3.2 3.2M4 20h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TIENDITA = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 21h30v17a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3z" fill="#fff6ea" stroke="#3f8f78" stroke-width="2.4" stroke-linejoin="round"/><path d="M7 13l3-6h28l3 6v3.5a4.5 4.5 0 0 1-8.5 2 4.5 4.5 0 0 1-8.5 0 4.5 4.5 0 0 1-8.5 0A4.5 4.5 0 0 1 7 16.5z" fill="#ff9ec2" stroke="#3f8f78" stroke-width="2.4" stroke-linejoin="round"/><path d="M16.5 7l-1.5 9.5M24 7v9.5M31.5 7l1.5 9.5" stroke="#3f8f78" stroke-width="2" stroke-linecap="round"/><rect x="14" y="27" width="9" height="14" rx="1.5" fill="#bfe8da" stroke="#3f8f78" stroke-width="2.2"/><path d="M33 30.6s-3.6-2.1-3.6-4.4a1.9 1.9 0 0 1 3.6-1 1.9 1.9 0 0 1 3.6 1c0 2.3-3.6 4.4-3.6 4.4z" fill="#ff5f8f"/></svg>';
const corto = (s, n = 11) => { s = String(s || "").trim(); return s.length > n ? s.slice(0, 1).toUpperCase() : s; };
/** En las fotitos sólo la inicial (en mayúscula) junto a su corazoncito (Fase 39). */
const inicial = (s) => (String(s || "").trim().slice(0, 1) || "?").toUpperCase();

export class MenuPrincipal {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.vista = null;
  }

  abrir(vista = "inicio") {
    if (!this._ajusteListo) {
      this._ajusteListo = true;
      const aj = () => { if (this.abierto) this._ajustar(); };
      addEventListener("resize", aj);
      visualViewport?.addEventListener("resize", aj);
      document.fonts?.ready.then(aj);
      addEventListener("ed-perfil", () => setTimeout(aj, 120));
    }
    setTimeout(() => this._ajustar(), 900);
    if (this.abierto) { this.ir(vista); return; }
    this.abierto = true;
    this.vista = null;
    this.contado = false;
    // El fondo: garabatitos que suben y destellos (sólo transform y opacity).
    const fondo = el("div.mp-fondo", { "aria-hidden": "true" });
    for (let i = 0; i < 7; i++) {
      const f = el("i.mp-sube", { html: i % 3 ? A.GARABATO_CORAZON : A.DESTELLO });
      f.style.left = (4 + Math.random() * 92).toFixed(1) + "%";
      f.style.setProperty("--t", (15 + Math.random() * 10).toFixed(1) + "s");
      f.style.setProperty("--d", (-Math.random() * 24).toFixed(1) + "s");
      f.style.setProperty("--s", (0.45 + Math.random() * 0.5).toFixed(2));
      f.style.setProperty("--x", (Math.random() * 50 - 25).toFixed(0) + "px");
      fondo.append(f);
    }
    for (let i = 0; i < 7; i++) {
      const b = el("i.mp-destello", { html: A.DESTELLO_LLENO });
      b.style.left = (Math.random() * 100).toFixed(1) + "%";
      b.style.top = (Math.random() * 100).toFixed(1) + "%";
      b.style.setProperty("--d", (-Math.random() * 4).toFixed(2) + "s");
      fondo.append(b);
    }
    this.chip = el("button.mp-chip", { type: "button" });
    // Fase 46: la Configuración de la app, junto a tu nombre.
    this.ajustesB = el("button.mp-ajustes-b", { type: "button", "aria-label": "Configuración", title: "Configuración", html: ico("tuerca"), onClick: (e) => this.ir("ajustes", { desde: e.currentTarget }) });
    this.chip.addEventListener("click", () => this.ir(SRV.conectado() ? "perfil" : "cuenta", { desde: this.chip }));
    this.escena = el("div.mp-escena");
    const marca = el("div.mp-marca", {}, [
      el("i.mp-pixel", { html: A.CORAZON_PIXEL }),
      el("div.mp-marca-t", {}, [el("b", { text: "My Love Pages" }), el("small", {}, [el("span", { text: "Pequeños mundos, grandes historias…" }), el("i", { html: A.GARABATO_CORAZON })])]),
    ]);
    // Los papeles rasgados llevan su «sombra» como otro papelito debajo (un filtro repintaría a cada cuadro).
    const rasgoEtq = A.rasgado(["arriba", "abajo", "izq", "der"], 3.2, 10, 5);
    const etiqueta = el("div.mp-etiqueta", {}, [el("i.mp-sombra", { style: { clipPath: rasgoEtq } }), el("i.mp-etiqueta-papel", { style: { clipPath: rasgoEtq } }), el("i.mp-corona", { html: A.CORONITA }), this.chip]);
    this.tarjeta = el("div.mp-tarjeta", {}, [el("header.mp-arriba", {}, [marca, el("div.mp-arriba-der", {}, [etiqueta, this.ajustesB])]), this.escena]);
    const decor = el("div.mp-decor", { "aria-hidden": "true" }, [
      el("i.mp-cuadricula", { style: { clipPath: A.rasgado(["der", "arriba", "abajo"], 6, 12, 2) } }),
      el("i.mp-rama", { html: A.RAMA_SECA }),
      el("i.mp-rama-rosa", { html: A.RAMA_ROSA }),
      el("i.mp-garabato.g1", { html: A.GARABATO_CORAZON }),
      el("i.mp-garabato.g2", { html: A.GARABATO_CORAZONES }),
      el("i.mp-garabato.g3", { html: A.DESTELLO }),
      el("i.mp-garabato.g4", { html: A.DESTELLO }),
      el("i.mp-garabato.g5", { html: A.FLECHITA }),
    ]);
    const tex = A.texturaPapel();
    this.capa = el("div.mp-capa.mp-album", { role: "dialog", "aria-label": "Menú principal", style: { "--papel-tex": tex ? `url("${tex}")` : "none" } }, [
      fondo, el("div.mp-columna", {}, [decor, this.tarjeta]),
    ]);
    document.body.append(this.capa);
    document.body.classList.add("con-menu-principal");
    // Lo chiquito se cambia en su lugar; lo grande, con transición.
    this._cuenta = () => {
      if (!this.abierto) return;
      this._pintarChip();
      // Acabas de entrar desde «Tu cuenta»: todo crece en un círculo desde el botón (lo hace quien te dejó entrar).
      if (this.vista === "cuenta" && SRV.conectado()) { setTimeout(() => { if (this.vista === "cuenta") this.ir("inicio", { tipo: "circulo" }); }, 60); return; }
      this.ir(this.vista === "perfil" || this.vista === "cuenta" ? "inicio" : this.vista || "inicio", { tipo: "zoom", forzar: true });
    };
    this._amor = () => { if (this.abierto) this._alCambiar(); };
    addEventListener("ed-cuenta", this._cuenta);
    addEventListener("ed-amor", this._amor);
    addEventListener("ed-perfil", this._amor);
    this._pintarChip();
    let seVio;
    this._alVer = new Promise((r) => { seVio = r; });
    this.ir(vista, { sinSonido: true });
    // Se muestra cuando ya están las letras (sin el salto de una letra a otra) y, la primera vez
    // en este aparato, tu perfil (así no cambia de golpe al llegar); si tardan, al rato igual.
    const capa = this.capa, antes = [letrasListas(1200)];
    if (SRV.conectado()) { const p = PF.refrescar(); if (!PF.tieneCopia()) antes.push(p); }
    Promise.race([Promise.all(antes), new Promise((r) => setTimeout(r, 1200))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => { if (this.capa === capa && this.abierto) capa.classList.add("ver"); seVio(); })));
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    for (const [t, f] of [["ed-cuenta", this._cuenta], ["ed-amor", this._amor], ["ed-perfil", this._amor]]) removeEventListener(t, f);
    const c = this.capa;
    c.classList.add("fuera");
    document.body.classList.remove("con-menu-principal");
    setTimeout(() => c.remove(), sinMovimiento() ? 10 : 720);
    this.app.sonidos?.sonar("abrir");
    // Sin librito abierto, debajo del menú no hay nada que editar: ahí va «Crear detallito».
    setTimeout(() => { if (!this.abierto && !this.app.estado?.proyecto && !document.querySelector(".ed-inicio")) this.app.inicio?.(); }, 60);
  }

  /** (Lo usan otras partes: «Entrar o crear mi cuenta» abre el menú en «cuenta».) */
  pintar(modo = "") { this.ir(modo || "inicio"); }

  ir(vista, { tipo, desde, sinSonido = false, forzar = false } = {}) {
    if (!this.abierto) return this.abrir(vista);
    if (vista === "perfil" && !SRV.conectado()) vista = "cuenta";
    if (vista === this.vista && !forzar) return;
    const antes = this.vista;
    this.vista = vista;
    const nodo = vista === "cuenta" ? this._vCuenta() : vista === "perfil" ? this._vPerfil() : vista === "ajustes" ? this._vAjustes() : this._vInicio();
    // Se mide cuando ya terminó el cambio: a media transición conviven las dos vistas y el menú
    // se veía chiquito y separado (Fase 49).
    cambiar(this.escena, nodo, { tipo: tipo || CAMINO[antes + ">" + vista] || "zoom", desde, sonidos: this.app.sonidos, sinSonido: sinSonido || !antes }).then(() => this._ajustar());
    this._ajustar();
  }

  /**
   * El inicio NUNCA se desliza (Fase 39): si en este aparato (barras del navegador, letra grande del
   * sistema, nombres largos…) no cabe en el alto que de verdad se ve, todo se acomoda un poquito más
   * chico, en proporción. Las demás vistas (tu cuenta, tu perfil) sí se deslizan.
   */
  _ajustar() {
    cancelAnimationFrame(this._rAj);
    this._rAj = requestAnimationFrame(() => {
      const c = this.capa, col = c?.querySelector(".mp-columna");
      if (!col) return;
      c.classList.toggle("mp-fijo", this.vista === "inicio");
      if (this.vista !== "inicio") { col.style.zoom = ""; return; }
      // Oculto o a media transición: medir ahí da un zoom equivocado.
      if (c.clientHeight < 240 || this.escena.childElementCount > 1 || document.hidden) return;
      // Misma pantalla y mismo inicio que la última vez (p. ej. al volver del editor): se parte del zoom
      // que quedó y basta una medida; antes se volvía a 1 y se medía hasta 4 veces el menú entero (~100 ms).
      const llave = [innerWidth, innerHeight, Math.round(visualViewport?.height || 0), this._clave()].join("|");
      col.style.zoom = llave === this._zLlave ? this._zoom : "";
      for (let i = 0; i < 4; i++) {
        // (El alto que de verdad se ve: sin la barra del navegador que tapa abajo.)
        const alto = Math.min(c.clientHeight, Math.round(visualViewport?.height || c.clientHeight)), todo = c.scrollHeight;
        if (todo <= alto + 1) break;
        const z = (+col.style.zoom || 1) * (alto / todo) * 0.995;
        col.style.zoom = String(Math.max(0.6, z));
      }
      this._zLlave = llave; this._zoom = col.style.zoom;
    });
  }

  /* — Arriba a la derecha: tu cuenta, en su etiqueta de papel — */
  _pintarChip() {
    const c = this.chip, con = SRV.conectado();
    const k = con ? "1" + PF.miNombre() : "0";
    if (c._k === k) return;
    c._k = k;
    c.classList.toggle("sin", !con);
    c.setAttribute("aria-label", con ? "Mi perfil" : "Entrar o crear mi cuenta");
    c.replaceChildren(...(con ? [PF.avatar("yo", "mp-chip-av"), el("span", { text: PF.miNombre() })] : [el("i.mp-chip-ico", { html: ico("cuenta") }), el("span", { text: "Entrar" })]), el("i.mp-chip-v", { html: A.CHEVRON }));
  }

  /** Llegó un latido, una foto o un nombre: se cambia sólo lo que cambió. */
  _alCambiar() {
    this._pintarChip();
    if (this.vista !== "inicio" || !this.r) return;
    const d = PF.datos(), clave = this._clave();
    const seVe = this.capa.classList.contains("ver");
    if (clave !== this.r.clave) {
      // Todavía no se ve (esperando letras y tu perfil): se rehace en silencio, sin transición.
      if (!seVe) { this.escena._terminar?.(); this.escena.replaceChildren(); this.escena._actual = null; this.vista = null; this.ir("inicio", { sinSonido: true }); }
      else this.ir("inicio", { tipo: "zoom", forzar: true });
      return;
    }
    const r = this.r, pa = d.pareja;
    if (r.nombreYo) r.nombreYo.textContent = inicial(PF.miNombre());
    if (r.nombrePa && pa) r.nombrePa.textContent = inicial(PF.nombreDe(pa));
    r.polaPa?.classList.toggle("en-linea", !!pa?.en_linea);
    r.saludo.textContent = this._saludo();
    if (r.subDet) r.subDet.textContent = this._subDetallitos();
    const nuevos = (this.app.amorNuevos || 0) + (this.app.amorReacciones || 0), g = r.tarjetaDet.querySelector(".dt-globo");
    if (nuevos && !g) r.tarjetaDet.append(el("em.dt-globo", { text: String(nuevos) }));
    else if (!nuevos && g) g.remove();
    else if (g && g.textContent !== String(nuevos)) g.textContent = String(nuevos);
    this._globoChat();
    // Llegó (o se quitó) una foto: sólo cambia la de su polaroid.
    for (const [quien, nodo] of [["yo", r.fotoYo], ["pareja", r.fotoPa]]) {
      if (!nodo) continue;
      const tiene = !!(quien === "yo" ? d.yo : pa)?.foto;
      if (tiene !== nodo._conFoto) { const n = this._fotoPola(quien); nodo.replaceWith(n); if (quien === "yo") r.fotoYo = n; else r.fotoPa = n; }
    }
    // Si cambió la fecha de novios o lo que viene, se rehace sólo la tarjetita de los días.
    const ahora = this._firmaDias();
    if (ahora !== r.fechas) {
      r.fechas = ahora;
      const s = this._dias(false);
      const poner = () => { r.stats.replaceWith(s); r.stats = s; };
      if (seVe) ajustar(r.vistaInicio, poner, [s]); else poner();
    }
  }

  /** Con tu amorcito vinculado: la tarjeta de los mensajitos (con su globito de los que no has leído). */
  _cartaChat() {
    const pa = SRV.conectado() ? PF.datos().pareja : null;
    if (!pa) { this.r.chatG = null; return null; }
    this.r.chatG = el("em.dt-globo", { hidden: "" });
    const b = this._carta("rosa", ICONO_CHAT, "Mensajitos", el("small", { text: `Escríbele a ${PF.nombreDe(pa)}` }), (e) => this.app.detallitos.abrir(e.currentTarget, "chat"), 4);
    b.dataset.ir = "chat";
    b.append(this.r.chatG);
    this.r.chatB = b;
    this._globoChat();
    return b;
  }
  _globoChat() {
    const g = this.r?.chatG, n = this.app.amorChat || 0;
    if (!g) return;
    g.hidden = !n; g.textContent = String(n);
    this.r.chatB.classList.toggle("con-nuevos", !!n);
  }

  _clave() { const d = PF.datos(); return SRV.conectado() ? (d.pareja ? "pareja" : "sola") : "fuera"; }
  _saludo() { return SRV.conectado() ? `${saludoDeLaHora()}, ${PF.miNombre()}` : `${saludoDeLaHora()} · con ${SRV.NOMBRE}`; }
  _subDetallitos() {
    const pa = SRV.conectado() ? PF.datos().pareja : null;
    return pa ? `con ${PF.nombreDe(pa)}` : SRV.conectado() ? "Vincula a tu amorcito" : "Páginas para tu amorcito";
  }
  _firmaDias() { const d = PF.datos(), p = PF.proximo(d); return JSON.stringify([SRV.conectado(), !!d.pareja, d.pareja?.novios || d.yo?.novios, p?.linea1, p?.linea2]); }

  /* — Las dos polaroids y el hilo rojo — */
  _fotoPola(quien) {
    const d = PF.datos(), p = quien === "yo" ? d.yo : d.pareja;
    const n = p?.foto ? PF.avatar(quien, "mp-pola-foto") : el("span.mp-pola-foto.arte", { html: quien === "yo" ? A.FOTO_ATARDECER : A.FOTO_CIUDAD });
    n._conFoto = !!p?.foto;
    return n;
  }

  _pareja() {
    const r = this.r, con = SRV.conectado(), pa = con ? PF.datos().pareja : null;
    r.nombreYo = el("b", { text: con ? inicial(PF.miNombre()) : "Tú" });
    r.fotoYo = this._fotoPola("yo");
    const polaYo = el("figure.mp-pola.yo", {}, [el("i.mp-cinta"), el("span.mp-pola-marco", {}, [r.fotoYo]), el("figcaption.mp-pola-etq", {}, [r.nombreYo, el("i", { html: ico("corazon") })]), el("i.mp-pin.der")]);
    // Fase 50: el hilo rojo va de alfiler a alfiler (uno en cada foto) y el corazón cuelga justo a la mitad.
    const hilo = el("div.mp-hilo", { "aria-hidden": "true" });
    const lazo = el("div.mp-lazo", { "aria-hidden": "true", html: '<svg preserveAspectRatio="none"><path class="mp-hilo-sombra"/><path class="mp-hilo-cuerda"/></svg>' }, [el("i.mp-hilo-corazon", { html: HILO_CORAZON })]);
    if (pa) {
      r.nombrePa = el("b", { text: inicial(PF.nombreDe(pa)) });
      r.fotoPa = this._fotoPola("pareja");
      r.polaPa = el("button.mp-pola.ella" + (pa.en_linea ? ".en-linea" : ""), { type: "button", "aria-label": `Nuestro vínculo con ${PF.nombreDe(pa)}`, onClick: (e) => this.app.detallitos.abrir(e.currentTarget, "vincular") }, [
        el("i.mp-cinta"), el("span.mp-pola-marco", {}, [r.fotoPa]),
        el("figcaption.mp-pola-etq", {}, [r.nombrePa, el("i", { html: ico("corazon") })]),
        el("i.mp-en-linea", { title: "En línea" }), el("i.mp-pin.izq"),
      ]);
    } else {
      r.nombrePa = null; r.fotoPa = null;
      r.polaPa = el("button.mp-pola.ella.vacia", { type: "button", "aria-label": con ? "Vincular a mi amorcito" : "Entrar a mi cuenta", onClick: (e) => (con ? this.app.detallitos.abrir(e.currentTarget, "vincular") : this.ir("cuenta", { desde: e.currentTarget })) }, [
        el("i.mp-cinta"), el("span.mp-pola-marco", {}, [el("span.mp-pola-foto.arte", { html: A.FOTO_VACIA })]),
        el("figcaption.mp-pola-etq", {}, [el("b", { text: con ? "¿tu amor?" : "¿y tu amor?" })]), el("i.mp-pin.izq"),
      ]);
    }
    const nota = el("p.mp-nota-pegada", { "aria-hidden": "true" }, [el("span", { text: "Juntos siempre es mejor" }), el("i", { html: ico("corazon") })]);
    const pareja = el("div.mp-pareja" + (pa ? "" : ".sola"), {}, [nota, polaYo, hilo, r.polaPa, lazo]);
    this._atarHilo(pareja, lazo);
    return pareja;
  }

  /** Dibuja el hilo entre los dos alfileres (mide dónde quedaron las fotos, aunque el menú esté encogido). */
  _atarHilo(pareja, lazo) {
    const svg = lazo.querySelector("svg"), cor = lazo.querySelector(".mp-hilo-corazon");
    const atar = () => {
      if (!pareja.isConnected) { ro.disconnect(); return; }
      const R = pareja.getBoundingClientRect(), W = pareja.clientWidth, H = pareja.clientHeight;
      const a = pareja.querySelector(".mp-pin.der")?.getBoundingClientRect(), b = pareja.querySelector(".mp-pin.izq")?.getBoundingClientRect();
      if (!W || !a || !b) return;
      const k = R.width / W || 1;   // (el zoom con el que se encoge el menú)
      const x1 = (a.left + a.width / 2 - R.left) / k, y1 = (a.top + a.height / 2 - R.top) / k;
      const x2 = (b.left + b.width / 2 - R.left) / k, y2 = (b.top + b.height / 2 - R.top) / k;
      const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + Math.max(22, Math.abs(x2 - x1) * 0.42);
      const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      for (const p of svg.children) p.setAttribute("d", d);
      cor.style.left = cx.toFixed(1) + "px";
      cor.style.top = ((y1 + 2 * cy + y2) / 4).toFixed(1) + "px";
      lazo.classList.add("listo");
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(atar));
    ro.observe(pareja);
    // (Las fotos caen con su animación: se vuelve a atar cuando ya llegaron.)
    pareja.addEventListener("animationend", (e) => { if (e.target.classList?.contains("mp-pola")) atar(); });
    setTimeout(atar, 1000); setTimeout(atar, 1600);
  }

  /** La tarjetita de los días: «3 días juntos» y lo que viene, con su barrita. */
  _dias(animar = true) {
    const d = PF.datos(), pa = d.pareja, con = SRV.conectado();
    const rasgo = A.rasgado(["arriba", "abajo", "izq", "der"], 2.2, 14, 4);
    const papel = () => [el("i.mp-sombra", { style: { clipPath: rasgo } }), el("i.mp-dias-papel", { style: { clipPath: rasgo } })];
    const adornos = () => [el("i.mp-dias-clip", { html: A.CLIP }), el("i.mp-dias-cinta")];
    const invita = (texto, boton, al) => el("div.mp-dias.invita", {}, [...papel(), ...adornos(), el("i.mp-dias-cal", { html: A.ICONO_CALENDARIO }), el("p", { text: texto }), el("button.mp-dias-btn", { type: "button", onClick: al }, [el("span", { text: boton }), el("i", { html: FLECHA })])]);
    if (!con) return invita("Entra a tu cuenta y tus libritos van contigo a cualquier aparato.", "Entrar o crear mi cuenta", (e) => this.ir("cuenta", { desde: e.currentTarget }));
    if (!pa) return invita("Vincúlate con tu amorcito: se mandan páginas y aquí cuentan sus días juntos.", "Vincularnos", (e) => this.app.detallitos.abrir(e.currentTarget, "vincular"));
    const j = PF.juntos(pa.novios || d.yo?.novios);
    if (!j) return invita("¿Desde cuándo son novios? Ponlo y aquí van sus días juntos.", "Poner la fecha", (e) => this.ir("perfil", { desde: e.currentTarget }));
    const num = el("b.mp-dias-num", { text: String(animar && !this.contado && !sinMovimiento() ? 0 : j.dias) });
    if (animar && !this.contado && !sinMovimiento() && j.dias > 0) {
      this.contado = true;
      // Empieza a contar cuando el menú ya se ve (no a escondidas mientras llegan las letras).
      let t0 = 0;
      const dur = Math.min(1800, 500 + j.dias * 2);
      const paso = (t) => { t0 ||= t; const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); num.textContent = String(Math.round(j.dias * e)); if (k < 1 && num.isConnected) requestAnimationFrame(paso); };
      (this._alVer || Promise.resolve()).then(() => setTimeout(() => requestAnimationFrame(paso), 420));
    }
    const p = PF.proximo(d);
    const barra = el("span.mp-barra", { "aria-hidden": "true" }, [el("i.mp-barra-relleno", { style: { "--p": (p?.progreso ?? 0.5).toFixed(3) } })]);
    // Con tres o más cifras, el número se achica y el calendario se hace a un lado (lo que viene no se aprieta).
    const caja = el("div.mp-dias" + (p?.hoy ? ".hoy" : "") + (j.dias >= 100 ? ".largo" : ""), { title: PF.textoJuntos(j), role: "button", tabindex: "0", "aria-label": `${PF.textoJuntos(j)}. Abrir Cositas Juntitos` }, [
      ...papel(), ...adornos(),
      el("div.mp-dias-fila", {}, [
        el("i.mp-dias-cal", { html: A.ICONO_CALENDARIO }),
        el("div.mp-dias-cuenta", {}, [el("div", {}, [num, el("span", { text: j.dias === 1 ? "día" : "días" })]), el("small", { text: "juntos" })]),
        p ? el("i.mp-dias-sep") : null,
        p ? el("div.mp-dias-viene", {}, [el("i.mp-dias-cor" + (p.icono === "pastel" || p.icono === "anillos" ? "" : ".lleno"), { html: ico(p.icono === "pastel" || p.icono === "anillos" ? p.icono : "corazon") }), el("div", {}, [el("b", { text: p.linea1 }), el("small", { text: p.linea2 })])]) : null,
      ]),
      p ? barra : el("small.mp-dias-texto", { text: PF.textoJuntos(j) }),
      p?.mes ? el("small.mp-dias-mes", {}, [el("i", { html: ico("corazon") }), el("span", { text: p.mes.texto })]) : null,
    ]);
    // Tocar los días juntos abre «Cositas Juntitos» (Fase 38). El día que cumplen un mes más, una
    // cintita lo dice y abre sus Mesecitos (para hacerle su página especial, si quieren).
    const meses = j.a * 12 + j.m, hoyMes = j.d === 0 && meses > 0;
    if (hoyMes) { caja.classList.add("mesecito"); caja.append(el("span.mp-mesecito", { text: `¡Hoy cumplen ${meses} ${meses === 1 ? "mes" : "meses"}!` })); }
    // (Fase 46) El día de su cumpleaños, tu amorcito lo ve aquí (y tú, el tuyo): cada quien con su nombre.
    const cumplePa = pa.cumple && PF.cumpleDe(pa.cumple).hoy, cumpleYo = d.yo?.cumple && PF.cumpleDe(d.yo.cumple).hoy;
    if ((cumplePa || cumpleYo) && !hoyMes) {
      caja.classList.add("cumple");
      caja.append(el("span.mp-mesecito.cumple", { text: cumplePa ? `¡Hoy es el cumple de ${PF.nombreDe(pa)}!` : "¡Feliz cumpleaños!" }));
      this._felicitar(cumplePa ? pa : null);
    }
    const pronto = () => this.app.juntitos?.abrir(hoyMes ? "mesecitos" : "inicio");
    caja.addEventListener("click", pronto);
    caja.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pronto(); } });
    return caja;
  }


  /** Una vez al día, el día de su cumpleaños: un avisito para felicitarle (o para ti, si es el tuyo). */
  _felicitar(pa) {
    const k = `editordev:cumple-visto:${SRV.usuario()?.usuario || ""}:${SRV.hoyLocal()}:${pa ? "pa" : "yo"}`;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (e) { return; }
    setTimeout(() => {
      if (!this.abierto) return;
      this.app.sonidos?.sonar("brillo");
      if (pa) aviso(`¡Hoy es el cumpleaños de ${PF.nombreDe(pa)}! Cumple ${PF.cumpleDe(pa.cumple).anios}`, 8000, "", { t: "Felicitar", al: () => this.app.detallitos.abrir(null, "chat") });
      else aviso("¡Feliz cumpleaños! Hoy es tu día", 6000);
    }, 1400);
  }

  /** Una tarjeta de abajo: su cinta, su dibujito, título, subtítulo y su flechita. */
  _carta(color, dibujo, titulo, sub, al, i) {
    return el("button.mp-carta." + color, { type: "button", style: { "--i": i }, onClick: al }, [
      el("i.mp-carta-cinta"),
      typeof dibujo === "string" ? el("span.mp-carta-ico", { html: dibujo }) : el("span.mp-carta-ico", {}, [dibujo]),
      el("b", { text: titulo }), sub,
      el("span.mp-carta-ir", { html: FLECHA }),
    ]);
  }

  /** El gatito dormido (si lo tocas, ronronea y se acomoda). */
  _gatito() {
    // Sin onda ni recuadro al tocarlo (data-sin-onda): sólo suelta sus «Zzz».
    const g = el("button.mp-gato", { type: "button", "data-sin-onda": "", "aria-label": "El gatito está dormido. Hazle cariño" }, [
      el("i.mp-gato-cola", { html: A.GATO_COLA }),
      el("i.mp-gato-cuerpo", { html: A.GATO_CUERPO }),
      el("i.mp-gato-cabeza", { html: A.GATO_CABEZA }),
      el("span.mp-gato-z", { "aria-hidden": "true" }, [el("b", { text: "z" }), el("b", { text: "z" }), el("b", { text: "z" })]),
    ]);
    g.addEventListener("click", () => {
      if (g.classList.contains("mimos")) return;
      g.classList.add("mimos");
      this.app.sonidos?.sonar("gatito");
      if (!sinMovimiento()) [["Z", 21, 0], ["z", 16, 170], ["z", 12, 340]].forEach(([t, tam, d], i) => {
        const z = el("b.mp-gato-zz", { text: t, "aria-hidden": "true", style: { fontSize: tam + "px" } });
        g.append(z);
        const dx = 14 + i * 9, dy = 34 + i * 12;
        z.animate([
          { transform: "translate(0, 0) scale(.4) rotate(-8deg)", opacity: 0 },
          { transform: `translate(${dx * 0.4}px, ${-dy * 0.35}px) scale(1.05) rotate(4deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx * 0.75}px, ${-dy * 0.7}px) scale(1) rotate(-3deg)`, opacity: 0.9, offset: 0.65 },
          { transform: `translate(${dx}px, ${-dy}px) scale(1.15) rotate(10deg)`, opacity: 0 },
        ], { duration: 1500, delay: d, easing: "cubic-bezier(.3, .6, .4, 1)", fill: "backwards" }).onfinish = () => z.remove();
      });
      setTimeout(() => g.classList.remove("mimos"), 2000);
    });
    return g;
  }

  /* — Las pantallas — */
  _vInicio() {
    const app = this.app, con = SRV.conectado();
    this.r = { clave: this._clave() };
    const r = this.r;
    r.saludo = el("span", { text: this._saludo() });
    r.subDet = el("small", { text: this._subDetallitos() });
    const nuevos = (app.amorNuevos || 0) + (app.amorReacciones || 0);
    r.tarjetaDet = this._carta("menta", A.ICONO_CARPETA, "Detallitos", r.subDet, (e) => app.detallitos.abrir(e.currentTarget, "coleccion"), 5);
    if (nuevos) r.tarjetaDet.append(el("em.dt-globo", { text: String(nuevos) }));
    const libritos = this._carta("cielo", A.ICONO_LIBRO, "Mis libritos", el("small", { text: con ? "Aquí y en tu nube" : "Tus borradores" }), () => app.inicio?.({ a: "borradores", sobreMenu: true }), 6);   // (encima del menú: al salir, vuelves aquí)
    // La Tiendita Cool (Fase 35): todavía en construcción. Tu perfil se abre desde tu nombre, arriba.
    const tiendita = this._carta("durazno", TIENDITA, "Tiendita Cool", el("small", { text: "Muy pronto" }), () => aviso("En construcción xd...", 2600), 7);
    r.fechas = this._firmaDias();
    r.stats = this._dias(true);
    const crear = el("button.mp-btn.primario.mp-crear", { type: "button", onClick: () => { quitarAviso(this._sinProyectos); this.cerrar(); app.inicio?.(); } }, [
      el("i.mp-crear-libro", { html: A.LIBRO_BRILLOS }),
      el("span.mp-crear-txt", {}, [
        el("span.mp-crear-t", {}, [el("span", { text: "Crear Detallito" }), el("i.mp-crear-flecha", { html: FLECHA })]),
        el("small.mp-crear-d", { text: "Convierte sus momentos juntos en una página hecha por ti, llena de recuerdos." }),
      ]),
    ]);
    // Fase 46: abre el que estabas editando (o el último guardado). Si no hay ninguno, lo dice claro
    // (y ofrece crear uno) en vez de mandarte a una pantalla vacía.
    const seguir = el("button.mp-seguir.mp-editor-ir", { type: "button", style: { "--i": 3 }, onClick: async (e) => {
      const b = e.currentTarget;
      if (b._yendo) return;
      b._yendo = true;
      try {
        if (await app.irAlEditor?.()) { this.cerrar(); return; }
        app.sonidos?.sonar("seleccionar");
        this._sinProyectos = aviso("Todavía no hay proyectos guardados. Crea tu primer detallito y aquí lo encuentras", 5200, "", { t: `${ico("nuevo")}<span>Crear detallito</span>`, al: () => { this.cerrar(); app.inicio?.(); } });
      } finally { b._yendo = false; }
    } }, [
      el("i.mp-editor-ico", { html: LAPIZ }),
      el("span.mp-editor-t", {}, [el("b", { text: "Ir al editor" }), el("small", { text: "Edita, organiza y personaliza tus páginas." })]),
      el("i.mp-editor-ir-b", { html: FLECHA }),
    ]);
    r.vistaInicio = el("div.mp-vista.mp-inicio", {}, [
      el("div.mp-hero", { style: { "--i": 0 } }, [this._pareja()]),
      el("div.mp-dias-caja", { style: { "--i": 1 } }, [r.stats]),
      el("div.mp-crear-fila", { style: { "--i": 2 } }, [crear, el("i.mp-crear-chispa.c1", { html: A.DESTELLO_LLENO }), el("i.mp-crear-chispa.c2", { html: A.DESTELLO_LLENO }), el("i.mp-crear-chispa.c3", { html: A.DESTELLO }), this._gatito()]),
      seguir,
      el("p.mp-saludo", { style: { "--i": 4 } }, [el("i.mp-raya-s"), r.saludo, el("i", { html: ico("corazon") }), el("i.mp-raya-s")]),
      el("div.mp-cartas", {}, [this._cartaChat(), r.tarjetaDet, libritos, tiendita].filter(Boolean)),
    ]);
    return r.vistaInicio;
  }

  _vCuenta() {
    this.r = null;
    const form = formularioCuenta(this.app, { compacto: true, alEntrar: () => { this.app.sonidos?.sonar("brillo"); this.ir("inicio", { tipo: "circulo", desde: form.querySelector(".cu-ir") }); } });
    return el("div.mp-vista.mp-cuenta", {}, [
      el("button.mp-volver", { type: "button", style: { "--i": 0 }, html: I("izquierda", "Volver"), onClick: () => this.ir("inicio") }),
      el("div.mp-cuenta-cab", { style: { "--i": 1 } }, [el("i", { html: ico("cuenta") }), el("h2", { text: "Tu cuenta" }), el("p", { text: `Con tu usuario y tu contraseña, tus libritos se guardan en tu nube de ${SRV.NOMBRE} y te vinculas con tu amorcito.` })]),
      el("div.mp-cuenta-form", { style: { "--i": 2 } }, [form]),
    ]);
  }

  _vAjustes() {
    this.r = null;
    return vistaAjustes(this.app, { alVolver: () => this.ir("inicio") });
  }

  _vPerfil() {
    this.r = null;
    const v = PF.vistaPerfil(this.app, {
      alListo: () => setTimeout(() => this.ir("inicio", { tipo: "regresa" }), 650),
      alVincular: (b) => this.app.detallitos.abrir(b, "vincular"),
      alSalir: async () => { await SRV.salir(); aviso(`Saliste de ${SRV.NOMBRE}`); },
    });
    return el("div.mp-vista.mp-perfil", {}, [
      el("div.mp-perfil-cab", { style: { "--i": 0 } }, [el("button.mp-volver", { type: "button", html: I("izquierda", "Volver"), onClick: () => this.ir("inicio") }), el("h2", { text: "Mi perfil" })]),
      el("div", { style: { "--i": 1 } }, [v]),
    ]);
  }
}
