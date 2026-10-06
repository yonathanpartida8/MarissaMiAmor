/**
 * SALIR DEL EDITOR — sin perder nada sin querer.
 *
 * La flecha de volver (y el botón «atrás» del teléfono) ya no salen de golpe:
 *   · si TODO está guardado, sale directo;
 *   · si hay cambios sin guardar, pregunta con una tarjeta animada:
 *       Seguir editando · Salir sin guardar · Guardar y salir
 * El botón «atrás» del teléfono primero cierra lo que esté abierto (una hoja,
 * una ventana, la prueba, el editor de HTML) y sólo después pregunta.
 *
 * `preguntarCambios()` es la misma tarjeta para cualquier cosa con cambios
 * (el editor de HTML la usa al cerrarse).
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";
import { cerrarUltima, PILA } from "./hoja.js";
import { cerrarUltimoModal, MODALES } from "./ui.js";

/** La tarjeta: se cumple con "seguir" | "salir" | "guardar". */
export function preguntarCambios({ titulo = "¿Seguro que quieres salir?", texto = "Perderás todos los cambios que no hayas guardado.", salir = "Salir sin guardar", guardar = "Guardar y salir", seguir = "Seguir editando" } = {}) {
  return new Promise((resolver) => {
    const fin = (v) => {
      if (hecho) return;
      hecho = true;
      fondo.classList.remove("ver");
      fondo.classList.add("fuera");
      removeEventListener("keydown", tecla, true);
      setTimeout(() => fondo.remove(), 260);
      resolver(v);
    };
    let hecho = false;
    const tecla = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); fin("seguir"); } };
    const tarjeta = el("div.ed-salir", { role: "alertdialog", "aria-modal": "true", "aria-labelledby": "ed-salir-t" }, [
      el("div.ed-salir-ico", { html: ico("salir") }),
      el("h2", { id: "ed-salir-t", text: titulo }),
      el("p", { text: texto }),
      el("div.ed-salir-botones", {}, [
        el("button.ed-btn.primario", { type: "button", html: `${ico("guardar")}<span>${guardar}</span>`, onClick: () => fin("guardar") }),
        el("button.ed-btn.peligro-suave", { type: "button", html: `<span>${salir}</span>`, onClick: () => fin("salir") }),
        el("button.ed-btn", { type: "button", html: `<span>${seguir}</span>`, onClick: () => fin("seguir") }),
      ]),
    ]);
    const fondo = el("div.ed-salir-fondo", {}, [tarjeta]);
    fondo.addEventListener("pointerdown", (e) => { if (e.target === fondo) fin("seguir"); });
    addEventListener("keydown", tecla, true);
    document.body.append(fondo);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
    requestAnimationFrame(() => requestAnimationFrame(() => fondo.classList.add("ver")));
    setTimeout(() => tarjeta.querySelector(".primario")?.focus({ preventScroll: true }), 80);
  });
}

export class Salida {
  constructor(app) {
    this.app = app;
    this.saliendo = false;
    const volver = document.querySelector(".ed-volver");
    this.destino = volver?.getAttribute("href") || "../index.html";
    volver?.addEventListener("click", (ev) => { ev.preventDefault(); this.salir(); });
    // El botón «atrás» del teléfono (o del navegador): primero cierra lo abierto.
    try { history.pushState({ editor: true }, ""); } catch (e) { /* nada */ }
    addEventListener("popstate", () => {
      if (this.saliendo) return;
      try { history.pushState({ editor: true }, ""); } catch (e) { /* nada */ }
      if (this.cerrarLoAbierto()) return;
      this.salir();
    });
    // Cerrar la pestaña con cambios sin guardar (sólo si el guardado automático está apagado).
    addEventListener("beforeunload", (ev) => {
      if (this.saliendo || !this.hayCambios(true)) return;
      ev.preventDefault();
      ev.returnValue = "";
    });
  }

  /** Cierra la ventana, hoja o modo de más arriba. ¿Había algo? */
  cerrarLoAbierto() {
    const app = this.app;
    if (document.querySelector(".ed-salir-fondo")) return true;
    if (app.prueba?.abierta) { app.prueba.cerrar(); return true; }
    if (app.html?.abierto) { app.html.cerrar(); return true; }
    if (MODALES.length) return cerrarUltimoModal();
    if (PILA.length) return cerrarUltima();
    if (document.querySelector(".ed-menu")) { document.querySelector(".ed-menu").remove(); return true; }
    if (document.querySelector(".ed-pop")) { document.querySelector(".ed-pop")._cerrar?.(); return true; }
    if (app.lateral?.abierto) { app.lateral.cerrar(); return true; }
    if (app.vista?.capa) { app.vista.cerrar(); return true; }
    return false;
  }

  /** ¿Hay algo sin guardar? (`alCerrar` = sólo lo que el guardado automático no salvaría). */
  hayCambios(alCerrar = false) {
    const a = this.app.auto;
    if (this.app.html?.sucio) return true;
    if (!a) return false;
    if (alCerrar) return !a.activo && a.pendiente;
    return a.pendiente || !!a.guardando || !!a.error;
  }

  async salir() {
    const app = this.app;
    if (this.hayCambios()) {
      // Con el guardado automático encendido, lo pendiente se guarda solo en un instante.
      if (app.auto?.activo && !app.auto.error && !app.html?.sucio) await app.auto.ahora();
      if (this.hayCambios()) {
        const r = await preguntarCambios();
        if (r === "seguir") return;
        if (r === "guardar") {
          if (app.html?.sucio) await app.html.guardar(false);
          await app.auto?.ahora();
          if (app.auto?.error) return;
        } else {
          app.html?.descartar?.();
          app.auto?.descartar();
        }
      }
    }
    this.saliendo = true;
    document.body.classList.add("ed-saliendo");
    setTimeout(() => { location.href = this.destino; }, 160);
  }
}
