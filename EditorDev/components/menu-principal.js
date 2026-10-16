/**
 * MENÚ PRINCIPAL — lo primero que se ve al abrir el editor: entrar al
 * editor, Detallitos, tu cuenta de M.YNTHN y volver al librito. Mientras
 * está a la vista, el editor ya se va cargando por detrás.
 *
 * Un librito que pasa sus hojas, un saludo según la hora, tarjetas que se
 * inclinan un poquito con el dedo (o el mouse) y un cielo de auroras suaves.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function saludoDeLaHora() {
  const h = new Date().getHours();
  return h < 6 ? "Qué desvelo tan bonito" : h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export class MenuPrincipal {
  constructor(app) {
    this.app = app;
    this.abierto = false;
  }

  abrir() {
    this.abierto = true;
    const flores = el("div.mp-flores", { "aria-hidden": "true" });
    for (let i = 0; i < 18; i++) {
      const f = el("i", { html: i % 4 ? ico("corazon") : ico("estrella") });
      f.style.left = (Math.random() * 100).toFixed(1) + "%";
      f.style.setProperty("--t", (10 + Math.random() * 10).toFixed(1) + "s");
      f.style.setProperty("--d", (-Math.random() * 20).toFixed(1) + "s");
      f.style.setProperty("--s", (0.55 + Math.random() * 0.9).toFixed(2));
      flores.append(f);
    }
    const auroras = el("div.mp-auroras", { "aria-hidden": "true" }, [el("i"), el("i"), el("i")]);
    this.tarjeta = el("div.mp-tarjeta");
    this.capa = el("div.mp-capa", { role: "dialog", "aria-label": "Menú principal" }, [auroras, flores, this.tarjeta]);
    document.body.append(this.capa);
    document.body.classList.add("con-menu-principal");
    this._cuenta = () => { if (this.abierto) this.pintar(); };
    addEventListener("ed-cuenta", this._cuenta);
    addEventListener("ed-amor", this._cuenta);
    // La tarjeta se inclina apenas, siguiendo el dedo o el mouse.
    this._mover = (e) => {
      // Sólo con mouse: con el dedo, la tarjeta se queda quieta (inclinarla al tocar se siente raro).
      if (reducido() || !this.tarjeta || e.pointerType !== "mouse") return;
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      this.tarjeta.style.setProperty("--rx", (-y * 2).toFixed(2) + "deg");
      this.tarjeta.style.setProperty("--ry", (x * 2.5).toFixed(2) + "deg");
    };
    this.capa.addEventListener("pointermove", this._mover);
    this.pintar();
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    removeEventListener("ed-cuenta", this._cuenta);
    removeEventListener("ed-amor", this._cuenta);
    const c = this.capa;
    c.classList.add("fuera");
    document.body.classList.remove("con-menu-principal");
    setTimeout(() => c.remove(), reducido() ? 10 : 700);
    this.app.sonidos?.sonar("abrir");
  }

  pintar(modo = "") {
    const app = this.app, yo = SRV.usuario();
    const conectado = SRV.conectado() && yo;
    const nuevos = app.amorNuevos || 0;
    const pareja = conectado ? app.pareja : null;
    const libro = el("div.mp-libro", { "aria-hidden": "true" }, [
      el("i.mp-tapa"), el("i.mp-hoja"), el("i.mp-hoja"), el("i.mp-hoja"),
      el("b.mp-latido", { html: ico("corazon") }),
      el("span.mp-brillo"), el("span.mp-brillo"), el("span.mp-brillo"),
    ]);
    const cuenta = conectado
      ? el("div.mp-chip", { title: `Conectado a ${SRV.NOMBRE}` }, [el("i", { text: yo.usuario.slice(0, 1).toUpperCase() }), el("span", { text: yo.usuario }), el("em")])
      : el("div.mp-chip.sin", {}, [el("i", { html: ico("cuenta") }), el("span", { text: "Sin cuenta" })]);
    const partes = [
      el("div.mp-arriba", {}, [cuenta]),
      libro,
      el("h1", {}, ["Crear librito", el("span.mp-subrayado", { "aria-hidden": "true", html: '<svg viewBox="0 0 220 18" preserveAspectRatio="none"><path d="M4 12 C 50 2, 90 18, 130 8 S 200 4, 216 10"/></svg>' })]),
      el("p.mp-sub", { text: conectado ? `${saludoDeLaHora()}, ${yo.usuario}` : `${saludoDeLaHora()} · con ${SRV.NOMBRE}` }),
    ];
    if (modo === "cuenta") {
      partes.push(
        el("div.mp-cuenta", {}, [formularioCuenta(app, { compacto: true, alEntrar: () => this.pintar() })]),
        el("button.mp-btn.suave", { type: "button", html: I("izquierda", "Volver"), onClick: () => this.pintar() }),
      );
    } else {
      const entrar = el("button.mp-btn.primario", { type: "button", html: I("editar", "Entrar al editor"), onClick: () => this.cerrar() });
      const tarjetaDetallitos = el("button.mp-carta.amor", { type: "button", onClick: (e) => app.detallitos.abrir(e.currentTarget) }, [
        el("i", { html: ico("detallito") }),
        el("b", { text: "Detallitos" }),
        el("small", { text: pareja ? `${pareja.usuario}${pareja.en_linea ? " · en línea" : ""}` : conectado ? "Vincula a tu amorcito" : "Páginas para tu amorcito" }),
        nuevos ? el("em.dt-globo", { text: String(nuevos) }) : null,
        pareja?.en_linea ? el("span.mp-punto") : null,
      ]);
      const tarjetaCuenta = conectado
        ? el("button.mp-carta", { type: "button", onClick: async () => { await SRV.salir(); aviso(`Saliste de ${SRV.NOMBRE}`); } }, [
          el("i", { html: ico("salir") }), el("b", { text: "Salir" }), el("small", { text: "de mi cuenta" })])
        : el("button.mp-carta", { type: "button", onClick: () => this.pintar("cuenta") }, [
          el("i", { html: ico("cuenta") }), el("b", { text: "Mi cuenta" }), el("small", { text: "Entrar o crear una" })]);
      partes.push(el("div.mp-botones", {}, [
        entrar,
        el("div.mp-cartas", {}, [tarjetaDetallitos, tarjetaCuenta]),
        el("a.mp-btn.suave", { href: document.querySelector(".ed-volver")?.getAttribute("href") || "../index.html", html: I("libro", "Volver al librito") }),
      ]));
    }
    partes.push(el("small.mp-pie", { html: `${ico("corazon")}<span>${SRV.NOMBRE} · hecho con amor</span>` }));
    this.tarjeta.replaceChildren(...partes);
  }
}
