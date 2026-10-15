/**
 * INDICADOR DE GUARDADO — discreto, bonito y siempre a la vista.
 *
 *   Guardando…               mientras hay cambios por escribir o escribiéndose
 *   Guardado correctamente   sólo cuando el navegador confirmó la escritura y
 *                            se comprobó volviéndola a leer (luego, «Guardado»)
 *   Error al guardar         en rojo hasta que un guardado salga bien; tocarlo
 *                            explica el motivo y deja reintentar o bajar una
 *                            copia de seguridad
 *
 * En el teléfono es sólo el icono: el texto se asoma un momento al confirmar o
 * al fallar. Tocarlo abre «Tu trabajo está a salvo»: el último guardado, las
 * copias completas automáticas (abrir una como librito aparte), el espacio
 * usado, si el navegador lo protege y la copia de seguridad en archivo.
 */
import { el, popover, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { listarCopias } from "../storage/respaldos.js";
import { espacio, pedirPersistencia } from "../storage/db.js";

const TXT = { guardando: "Guardando…", ok: "Guardado correctamente", guardado: "Guardado", error: "Error al guardar", "sin-guardar": "Sin guardar" };
const hora = (t) => new Date(t).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
const hace = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 10 ? "ahora mismo" : s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : `a las ${hora(t)}`; };
const mb = (b) => (b / 1048576).toLocaleString("es-MX", { maximumFractionDigits: b < 10485760 ? 1 : 0 }) + " MB";
// Safari (no instalado como app) borra lo guardado tras 7 días sin abrir el sitio.
const safariSuelto = () => /^((?!chrome|chromium|crios|android|fxios|edg).)*safari/i.test(navigator.userAgent) && !navigator.standalone && !matchMedia("(display-mode: standalone)").matches;

export class IndicadorGuardado {
  constructor(app, nodo) {
    this.app = app;
    this.n = nodo;
    nodo.innerHTML = `<i class="ed-gd-ico" aria-hidden="true"><span class="ed-gd-giro"></span><span class="ed-gd-nube">${ico("nubeOk")}</span><span class="ed-gd-alerta">${ico("aviso")}</span></i><span class="ed-gd-t">Guardado</span>`;
    this.t = nodo.querySelector(".ed-gd-t");
    this.st = null;
    this._pintar("guardado");
    nodo.addEventListener("click", () => this.abrir());
  }

  /** Estados del autoguardado: pendiente · escribiendo · guardado · error · sin-guardar. */
  poner(st, err) {
    const v = st === "pendiente" || st === "escribiendo" ? "guardando" : st === "guardado" ? "ok" : st;
    clearTimeout(this._t);
    if (v === "error") this.err = err;
    if (v === "ok") {
      // «Guardando…» se ve al menos un instante: así nada parpadea.
      const falta = 450 - (performance.now() - (this._desde || 0));
      if (this.st === "guardando" && falta > 0) { this._t = setTimeout(() => this.poner("guardado"), falta); return; }
      this._pintar("ok");
      this._t = setTimeout(() => this._pintar("guardado"), 2600);
    } else this._pintar(v);
    if (this.panel) this._rellenar();
  }

  _pintar(v) {
    if (v === this.st) return;
    if (v === "guardando") this._desde = performance.now();
    this.st = v;
    this.n.dataset.st = v;
    this.t.textContent = TXT[v] || "Guardado";
    this.n.setAttribute("aria-label", `${TXT[v]} · tus copias`);
    this.n.title = v === "error" ? "No se pudo guardar: toca para ver qué hacer" : "Guardado y copias de seguridad";
    clearTimeout(this._as);
    this.n.classList.toggle("asoma", v === "ok" || v === "error");
    if (v === "error") this._as = setTimeout(() => this.n.classList.remove("asoma"), 5000);
  }

  cerrar() { this._pop?.cerrar?.(); this.panel = null; }

  abrir() {
    const c = el("div.ed-gd-panel", { role: "status" });
    this.panel = c;
    this._pop = popover(this.n, c, { clase: "ed-pop-guardado" });
    this._rellenar();
  }

  async _rellenar() {
    const c = this.panel;
    if (!c || !c.isConnected) { this.panel = null; return; }
    const app = this.app, A = app.auto, P = app.estado.proyecto;
    if (!P) return;
    const st = this.st;
    const b = (t, i, fn, cl = "") => el("button.ed-btn.chico" + (cl ? "." + cl : ""), { type: "button", html: `${ico(i)}<span>${t}</span>`, onClick: fn });
    const titulo = st === "error" ? "No se pudo guardar" : st === "guardando" ? "Guardando tus cambios…" : st === "sin-guardar" ? "Hay cambios sin guardar" : "Tu trabajo está a salvo";
    const partes = [
      el("div.ed-gd-cab", { dataset: { st } }, [
        el("i.ed-gd-grande", { html: ico(st === "error" ? "aviso" : st === "guardando" ? "nube" : "nubeOk") }),
        el("div", {}, [el("b", { text: titulo }), el("small", { text: A.ultimo || P.guardado ? `Último guardado ${hace(A.ultimo || P.guardado)} (${hora(A.ultimo || P.guardado)}), en este navegador` : "Se guarda solo en este navegador, al poco de cada cambio" })]),
      ]),
    ];
    if (st === "error") partes.push(el("p.ed-gd-error", { text: `${A.error?.message || "El navegador no dejó escribir"}. La última versión buena sigue intacta; lo nuevo queda pendiente y se reintenta solo.` }), el("div.ed-botonera", {}, [b("Reintentar ahora", "refrescar", () => app.guardarYa(), "primario"), b("Descargar copia (.zip)", "exportar", () => { this.cerrar(); app.exportar({ completo: true }); })]));
    else if (st === "sin-guardar") partes.push(el("p.ed-ayuda", { text: "El guardado automático está apagado (Herramientas → Guardar)." }), el("div.ed-botonera", {}, [b("Guardar ahora", "guardar", () => app.guardarYa(), "primario")]));
    else partes.push(el("div.ed-botonera", {}, [b("Guardar ahora", "guardar", () => app.guardarYa())]));

    // Copias completas automáticas.
    const copias = await listarCopias(P.id).catch(() => []);
    partes.push(el("section.ed-gd-sec", {}, [
      el("div.ed-sub-t", { text: "Copias completas automáticas" }),
      el("small.ed-ayuda", { text: "Cada 5 minutos (si hubo cambios), al abrir y al salir se guarda aparte una copia ENTERA del librito; quedan las 3 últimas. Abrir una crea un librito aparte: éste no se toca." }),
      copias.length
        ? el("ul.ed-gd-copias", {}, copias.map((cp) => el("li", {}, [
          el("span", {}, [el("b", { text: hora(cp.t) }), el("small", { text: `${new Date(cp.t).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} · ${cp.n} página${cp.n === 1 ? "" : "s"} · ${cp.motivo}` })]),
          b("Abrir copia", "carpeta", () => { this.cerrar(); app.abrirCopia(P.id, cp.hueco, cp.t); }),
        ])))
        : el("small", { text: "La primera se hace en unos segundos." }),
      el("div.ed-botonera", {}, [b("Hacer una copia ahora", "duplicar", async () => {
        A.cambiosCopia = true;
        const info = await A.copiaCompleta("a mano", true);
        aviso(info ? `Copia completa guardada (${hora(info.t)})` : "Ya estaba igual que la última copia", 2600);
        this._rellenar();
      })]),
    ]));

    // Espacio y protección del navegador.
    const e = await espacio();
    let prot = false;
    try { prot = !!(await navigator.storage?.persisted?.()); } catch (x) { prot = false; }
    const pct = e && e.quota ? Math.min(100, (e.usage / e.quota) * 100) : 0;
    partes.push(el("section.ed-gd-sec", {}, [
      el("div.ed-sub-t", { text: "Espacio en este navegador" }),
      e && e.quota ? el("div.ed-gd-barra", { style: { "--p": pct.toFixed(1) + "%" }, dataset: { lleno: pct > 85 ? "si" : "" } }, [el("i")]) : null,
      el("small", { text: e && e.quota ? `${mb(e.usage)} usados de ${mb(e.quota)}${pct > 85 ? " · casi lleno: descarga una copia" : ""}` : "Este navegador no dice cuánto espacio queda." }),
      el("small.ed-gd-prot" + (prot ? ".si" : ""), { html: prot ? `${ico("escudo")}<span>Protegido: el navegador no lo borra para hacer espacio.</span>` : `${ico("info")}<span>El navegador podría borrarlo si se queda sin espacio.</span>` }),
      !prot && navigator.storage?.persist ? el("div.ed-botonera", {}, [b("Pedir que no se borre", "escudo", async () => { await pedirPersistencia(); this._rellenar(); })]) : null,
      safariSuelto() ? el("p.ed-gd-nota", { text: "En Safari, si pasan 7 días sin abrir el editor, el navegador puede borrar lo guardado. Agrégalo a la pantalla de inicio (Compartir → Agregar a inicio) o descarga una copia de seguridad de vez en cuando." }) : null,
    ].filter(Boolean)));

    // Copia de seguridad en un archivo.
    let ult = 0;
    try { ult = +localStorage.getItem("editordev:copia-descargada:" + P.id) || 0; } catch (x) { ult = 0; }
    partes.push(el("section.ed-gd-sec", {}, [
      el("div.ed-sub-t", { text: "Copia de seguridad en un archivo" }),
      el("small.ed-ayuda", { text: `Un .zip con TODO el librito (páginas, textos, fotos, dibujos, sonidos, animaciones y ajustes) para guardarlo donde quieras o pasarlo a otro dispositivo.${ult ? ` Última descargada: ${new Date(ult).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}.` : ""}` }),
      el("div.ed-botonera", {}, [
        b("Descargar copia (.zip)", "exportar", () => { this.cerrar(); app.exportar({ completo: true }); }, "primario"),
        b("Restaurar desde archivo…", "subir", () => { this.cerrar(); app.abrirArchivo(); }),
      ]),
    ]));
    if (this.panel === c && c.isConnected) c.replaceChildren(...partes);
  }
}
