/**
 * MENÚ PRINCIPAL — lo primero que se ve al abrir el editor. Mientras está a
 * la vista, el editor se va cargando por detrás.
 *
 *   Arriba     M.YNTHN y tu cuenta (tu foto y tu nombre → tu perfil).
 *   La pareja  tu polaroid y la de tu amorcito, unidas por un hilo rojo con
 *              un corazón que late; cuántos días llevan juntos (cuenta hacia
 *              arriba al abrir) y lo que viene: aniversario, mesiversario o
 *              un cumpleaños. Sin vincular: tu polaroid y una vacía que invita.
 *   Después    «Crear librito», entrar al editor y tres tarjetas: Detallitos,
 *              Mis libritos y tu perfil (o tu cuenta).
 *
 * Cada pantalla llega con su propia transición y su sonidito (transiciones.js):
 * el perfil se abre como una hoja que se da vuelta, la cuenta gira como una
 * tarjeta y, al entrar, todo crece en un círculo desde el botón.
 *
 * Sin parpadeos: la pantalla no se rehace cuando llega un latido o cambia
 * algo chiquito (en línea, un detallito nuevo, una foto): sólo se cambia ese
 * pedacito. Se vuelve a armar (con transición) únicamente si cambia lo grande:
 * entrar, salir, vincularse o desvincularse.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";
import { cambiar, ajustar, letrasListas, sinMovimiento } from "./transiciones.js";
import * as PF from "./perfil.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

function saludoDeLaHora() {
  const h = new Date().getHours();
  return h < 6 ? "Qué desvelo tan bonito" : h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/* Cómo se va de una pantalla a otra (las que no están: «zoom»). */
const CAMINO = { "inicio>cuenta": "carta", "cuenta>inicio": "atras", "inicio>perfil": "pagina", "perfil>inicio": "regresa", "cuenta>perfil": "pagina" };

export class MenuPrincipal {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.vista = null;
  }

  abrir(vista = "inicio") {
    if (this.abierto) { this.ir(vista); return; }
    this.abierto = true;
    this.vista = null;
    this.contado = false;
    // El fondo: luces suaves, corazones que suben y destellos (sólo transform y opacity).
    const fondo = el("div.mp-fondo", { "aria-hidden": "true" }, [el("i.mp-orbe"), el("i.mp-orbe"), el("i.mp-orbe")]);
    for (let i = 0; i < 12; i++) {
      const f = el("i.mp-sube", { html: ico(i % 4 ? "corazon" : "estrella") });
      f.style.left = (4 + Math.random() * 92).toFixed(1) + "%";
      f.style.setProperty("--t", (13 + Math.random() * 11).toFixed(1) + "s");
      f.style.setProperty("--d", (-Math.random() * 24).toFixed(1) + "s");
      f.style.setProperty("--s", (0.5 + Math.random() * 0.8).toFixed(2));
      f.style.setProperty("--x", (Math.random() * 60 - 30).toFixed(0) + "px");
      fondo.append(f);
    }
    for (let i = 0; i < 9; i++) {
      const b = el("i.mp-destello");
      b.style.left = (Math.random() * 100).toFixed(1) + "%";
      b.style.top = (Math.random() * 100).toFixed(1) + "%";
      b.style.setProperty("--d", (-Math.random() * 4).toFixed(2) + "s");
      fondo.append(b);
    }
    this.chip = el("button.mp-chip", { type: "button" });
    this.chip.addEventListener("click", () => this.ir(SRV.conectado() ? "perfil" : "cuenta", { desde: this.chip }));
    this.escena = el("div.mp-escena");
    this.tarjeta = el("div.mp-tarjeta", {}, [
      el("header.mp-arriba", {}, [el("span.mp-marca", { html: `${ico("corazon")}<b>${SRV.NOMBRE}</b>` }), this.chip]),
      this.escena,
      el("small.mp-pie", { html: `${ico("corazon")}<span>${SRV.NOMBRE} · hecho con amor</span>` }),
    ]);
    this.capa = el("div.mp-capa", { role: "dialog", "aria-label": "Menú principal" }, [fondo, this.tarjeta]);
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
    // La tarjeta se inclina apenas siguiendo el mouse (con el dedo se queda quieta).
    this._mover = (e) => {
      if (sinMovimiento() || e.pointerType !== "mouse") return;
      this.tarjeta.classList.add("inclina");
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      this.tarjeta.style.setProperty("--rx", (-y * 2).toFixed(2) + "deg");
      this.tarjeta.style.setProperty("--ry", (x * 2.5).toFixed(2) + "deg");
    };
    this.capa.addEventListener("pointermove", this._mover);
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
  }

  /** (Lo usan otras partes: «Entrar o crear mi cuenta» abre el menú en «cuenta».) */
  pintar(modo = "") { this.ir(modo || "inicio"); }

  ir(vista, { tipo, desde, sinSonido = false, forzar = false } = {}) {
    if (!this.abierto) return this.abrir(vista);
    if (vista === "perfil" && !SRV.conectado()) vista = "cuenta";
    if (vista === this.vista && !forzar) return;
    const antes = this.vista;
    this.vista = vista;
    const nodo = vista === "cuenta" ? this._vCuenta() : vista === "perfil" ? this._vPerfil() : this._vInicio();
    cambiar(this.escena, nodo, { tipo: tipo || CAMINO[antes + ">" + vista] || "zoom", desde, sonidos: this.app.sonidos, sinSonido: sinSonido || !antes });
  }

  /* — Arriba a la derecha: tu cuenta — */
  _pintarChip() {
    const c = this.chip, con = SRV.conectado();
    const k = con ? "1" + PF.miNombre() : "0";
    if (c._k === k) return;
    c._k = k;
    c.classList.toggle("sin", !con);
    c.setAttribute("aria-label", con ? "Mi perfil" : "Entrar o crear mi cuenta");
    c.replaceChildren(...(con ? [PF.avatar("yo", "mp-chip-av"), el("span", { text: PF.miNombre() })] : [el("i", { html: ico("cuenta") }), el("span", { text: "Entrar" })]));
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
    const r = this.r, pa = d.pareja, nuevos = this.app.amorNuevos || 0;
    if (r.nombreYo) r.nombreYo.textContent = PF.miNombre();
    if (r.nombrePa && pa) r.nombrePa.textContent = PF.nombreDe(pa);
    r.polaPa?.classList.toggle("en-linea", !!pa?.en_linea);
    r.saludo.textContent = this._saludo();
    if (r.subDet) r.subDet.textContent = this._subDetallitos();
    const g = r.tarjetaDet.querySelector(".dt-globo");
    if (nuevos && !g) r.tarjetaDet.append(el("em.dt-globo", { text: String(nuevos) }));
    else if (!nuevos && g) g.remove();
    else if (g && g.textContent !== String(nuevos)) g.textContent = String(nuevos);
    // Si cambió la fecha de novios, se rehace sólo el contador.
    const ahora = JSON.stringify([pa?.novios || d.yo?.novios, PF.proximo(d)?.texto]);
    if (ahora !== r.fechas) {
      r.fechas = ahora;
      const c = this._contador(false), p = this._proximo();
      const poner = () => { r.contador?.replaceWith(c); r.proximo?.replaceWith(p); r.contador = c; r.proximo = p; };
      if (seVe) ajustar(r.hero, poner, [c, p]); else poner();
    }
  }

  _clave() { const d = PF.datos(); return SRV.conectado() ? (d.pareja ? "pareja" : "sola") : "fuera"; }
  _saludo() { return SRV.conectado() ? `${saludoDeLaHora()}, ${PF.miNombre()}` : `${saludoDeLaHora()} · con ${SRV.NOMBRE}`; }
  _subDetallitos() {
    const pa = SRV.conectado() ? PF.datos().pareja : null;
    return pa ? `con ${PF.nombreDe(pa)}${pa.en_linea ? " · en línea" : ""}` : SRV.conectado() ? "Vincula a tu amorcito" : "Páginas para tu amorcito";
  }

  /* — La pareja (o el librito, sin cuenta) — */
  _pareja() {
    const r = this.r, d = PF.datos(), con = SRV.conectado();
    if (!con) {
      return el("div.mp-libro", { "aria-hidden": "true" }, [
        el("i.mp-tapa"), el("i.mp-hoja"), el("i.mp-hoja"), el("i.mp-hoja"),
        el("b.mp-latido", { html: ico("corazon") }),
        el("span.mp-brillo"), el("span.mp-brillo"), el("span.mp-brillo"),
      ]);
    }
    const pa = d.pareja;
    r.nombreYo = el("figcaption", { text: PF.miNombre() });
    const polaYo = el("figure.mp-pola.yo", {}, [el("i.mp-cinta"), PF.avatar("yo", "mp-pola-foto"), r.nombreYo]);
    const hilo = el("div.mp-hilo", { "aria-hidden": "true", html: '<svg viewBox="0 0 120 40" preserveAspectRatio="none"><path class="mp-hilo-cuerda" d="M2 8 C 34 40, 86 40, 118 8"/><path class="mp-hilo-luz" d="M2 8 C 34 40, 86 40, 118 8"/></svg>' }, []);
    hilo.append(el("i.mp-hilo-corazon", { html: ico("corazon") }));
    if (pa) {
      r.nombrePa = el("figcaption", { text: PF.nombreDe(pa) });
      r.polaPa = el("figure.mp-pola.ella" + (pa.en_linea ? ".en-linea" : ""), {}, [el("i.mp-cinta"), PF.avatar("pareja", "mp-pola-foto"), r.nombrePa, el("i.mp-en-linea", { title: "En línea" })]);
      const ir = (e) => this.app.detallitos.abrir(e.currentTarget, "vincular");
      r.polaPa.addEventListener("click", ir);
      return el("div.mp-pareja", {}, [polaYo, hilo, r.polaPa]);
    }
    r.polaPa = null; r.nombrePa = null;
    const vacia = el("button.mp-pola.ella.vacia", { type: "button", "aria-label": "Vincular a mi amorcito", onClick: (e) => this.app.detallitos.abrir(e.currentTarget, "vincular") }, [el("i.mp-cinta"), el("span.av.vacio.mp-pola-foto", {}, [el("b", { text: "?" })]), el("figcaption", { text: "¿tu amorcito?" })]);
    return el("div.mp-pareja.sola", {}, [polaYo, hilo, vacia]);
  }

  /** «Juntos desde hace 423 días» (el número sube al abrir; después ya no). */
  _contador(animar = true) {
    const d = PF.datos(), pa = d.pareja;
    if (!SRV.conectado()) return el("span.mp-nada");
    if (!pa) return el("p.mp-invita", { text: "Vincúlate con tu amorcito para mandarse detallitos y ver cuántos días llevan juntos." });
    const j = PF.juntos(pa.novios || d.yo?.novios);
    if (!j) return el("button.mp-poner-fecha", { type: "button", html: I("calendario", "¿Desde cuándo son novios? Ponlo aquí"), onClick: (e) => this.ir("perfil", { desde: e.currentTarget }) });
    const num = el("b.mp-dias-num", { text: String(animar && !this.contado && !sinMovimiento() ? 0 : j.dias) });
    if (animar && !this.contado && !sinMovimiento() && j.dias > 0) {
      this.contado = true;
      // Empieza a contar cuando el menú ya se ve (no a escondidas mientras llegan las letras).
      let t0 = 0;
      const dur = Math.min(1800, 500 + j.dias * 2);
      const paso = (t) => { t0 ||= t; const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); num.textContent = String(Math.round(j.dias * e)); if (k < 1 && num.isConnected) requestAnimationFrame(paso); };
      (this._alVer || Promise.resolve()).then(() => setTimeout(() => requestAnimationFrame(paso), 380));
    }
    return el("div.mp-dias", {}, [el("small", { text: "Juntos desde hace" }), el("div", {}, [num, el("span", { text: j.dias === 1 ? "día" : "días" })]), el("em", { text: PF.textoJuntos(j) })]);
  }

  _proximo() {
    const p = SRV.conectado() ? PF.proximo() : null;
    return p ? el("div.mp-proximo" + (p.hoy ? ".hoy" : ""), {}, [el("i", { html: ico(p.icono) }), el("span", { text: p.texto })]) : el("span.mp-nada");
  }

  /* — Las pantallas — */
  _vInicio() {
    const app = this.app, con = SRV.conectado();
    this.r = { clave: this._clave() };
    const r = this.r;
    r.saludo = el("p.mp-sub", { text: this._saludo() });
    r.subDet = el("small", { text: this._subDetallitos() });
    const nuevos = app.amorNuevos || 0;
    r.tarjetaDet = el("button.mp-carta.amor", { type: "button", style: { "--i": 4 }, onClick: (e) => app.detallitos.abrir(e.currentTarget) }, [
      el("i", { html: ico("detallito") }), el("b", { text: "Detallitos" }), r.subDet,
      nuevos ? el("em.dt-globo", { text: String(nuevos) }) : null,
    ]);
    const libritos = el("button.mp-carta", { type: "button", style: { "--i": 5 }, onClick: () => { this.cerrar(); app.inicio?.(); } }, [
      el("i", { html: ico("biblioteca") }), el("b", { text: "Mis libritos" }), el("small", { text: con ? "Aquí y en tu nube" : "Tus borradores" }),
    ]);
    const cuenta = con
      ? el("button.mp-carta", { type: "button", style: { "--i": 6 }, onClick: (e) => this.ir("perfil", { desde: e.currentTarget }) }, [PF.avatar("yo", "mp-carta-av"), el("b", { text: "Mi perfil" }), el("small", { text: "Foto, nombre y fechas" })])
      : el("button.mp-carta", { type: "button", style: { "--i": 6 }, onClick: (e) => this.ir("cuenta", { desde: e.currentTarget }) }, [el("i", { html: ico("cuenta") }), el("b", { text: "Mi cuenta" }), el("small", { text: "Entrar o crear una" })]);
    r.fechas = JSON.stringify([PF.datos().pareja?.novios || PF.datos().yo?.novios, PF.proximo()?.texto]);
    r.contador = this._contador(true);
    r.proximo = this._proximo();
    const entrar = el("button.mp-btn.primario", { type: "button", style: { "--i": 3 }, html: I("editar", "Entrar al editor"), onClick: () => this.cerrar() });
    return el("div.mp-vista.mp-inicio", {}, [
      r.hero = el("div.mp-hero", { style: { "--i": 0 } }, [this._pareja(), r.contador, r.proximo]),
      el("div.mp-titulo", { style: { "--i": 1 } }, [
        el("h1", {}, ["Crear librito", el("span.mp-subrayado", { "aria-hidden": "true", html: '<svg viewBox="0 0 220 18" preserveAspectRatio="none"><path d="M4 12 C 50 2, 90 18, 130 8 S 200 4, 216 10"/></svg>' })]),
        r.saludo,
      ]),
      entrar,
      el("div.mp-cartas", {}, [r.tarjetaDet, libritos, cuenta]),
      el("a.mp-btn.suave", { style: { "--i": 7 }, href: document.querySelector(".ed-volver")?.getAttribute("href") || "../index.html", html: I("libro", "Volver al librito") }),
    ]);
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
