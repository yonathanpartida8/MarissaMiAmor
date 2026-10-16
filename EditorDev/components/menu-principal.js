/**
 * MENÚ PRINCIPAL — lo primero que se ve al abrir el editor: entrar al
 * editor, tu cuenta de M.YNTHN, Detallitos y volver al librito. Básico y
 * lindo por ahora (se va a mejorar). Mientras está a la vista, el editor ya
 * se va cargando por detrás.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

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
    this.tarjeta = el("div.mp-tarjeta");
    this.capa = el("div.mp-capa", { role: "dialog", "aria-label": "Menú principal" }, [flores, this.tarjeta]);
    document.body.append(this.capa);
    document.body.classList.add("con-menu-principal");
    this._cuenta = () => { if (this.abierto) this.pintar(); };
    addEventListener("ed-cuenta", this._cuenta);
    this._nuevos = () => { if (this.abierto) this.pintar(); };
    addEventListener("ed-amor", this._nuevos);
    this.pintar();
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    removeEventListener("ed-cuenta", this._cuenta);
    removeEventListener("ed-amor", this._nuevos);
    const c = this.capa;
    c.classList.add("fuera");
    document.body.classList.remove("con-menu-principal");
    setTimeout(() => c.remove(), 650);
    this.app.sonidos?.sonar("abrir");
  }

  pintar(modo = "") {
    const app = this.app, yo = SRV.usuario();
    const conectado = SRV.conectado() && yo;
    const nuevos = app.amorNuevos || 0;
    const btn = (icono, texto, al, clase = "", extra = null) => {
      const b = el("button.mp-btn" + (clase ? "." + clase : ""), { type: "button", html: I(icono, texto), onClick: al });
      if (extra) b.append(extra);
      return b;
    };
    const partes = [
      el("div.mp-logo", { "aria-hidden": "true" }, [el("i", { html: ico("libro") }), el("b", { html: ico("corazon") })]),
      el("h1", { text: "Crear librito" }),
      el("p.mp-sub", { text: conectado ? `Hola, ${yo.usuario}` : `con ${SRV.NOMBRE}` }),
    ];
    if (modo === "cuenta") {
      partes.push(el("div.mp-cuenta", {}, [formularioCuenta(app, { compacto: true, alEntrar: () => this.pintar() })]), btn("izquierda", "Volver", () => this.pintar(), "suave"));
    } else {
      partes.push(el("div.mp-botones", {}, [
        btn("editar", "Entrar al editor", () => this.cerrar(), "primario"),
        btn("detallito", "Detallitos", (e) => app.detallitos.abrir(e.currentTarget), "amor", nuevos ? el("i.dt-globo", { text: String(nuevos) }) : null),
        conectado
          ? btn("salir", "Salir de mi cuenta", async () => { await SRV.salir(); aviso(`Saliste de ${SRV.NOMBRE}`); }, "suave")
          : btn("cuenta", "Iniciar sesión o crear cuenta", () => this.pintar("cuenta")),
        el("a.mp-btn.suave", { href: document.querySelector(".ed-volver")?.getAttribute("href") || "../index.html", html: I("libro", "Volver al librito") }),
      ]));
    }
    partes.push(el("small.mp-pie", { text: `${SRV.NOMBRE} · hecho con amor` }));
    this.tarjeta.replaceChildren(...partes);
  }
}
