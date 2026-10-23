/**
 * EFECTOS DE SONIDO — elegir y poner, sin buscar archivos.
 *
 * Tocar un efecto lo hace sonar; su «+» lo pone donde digas:
 *   · en LovEdit, en el cabezal (como una pista: se mueve,
 *     se recorta, se silencia y se duplica como cualquier otra)
 *   · al tocar lo elegido, o al aparecer lo elegido
 * Se abre desde LovEdit (botón de la campanita), desde Audio y
 * desde los sonidos del elemento.
 */
import { el, popover, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { SFX, GRUPOS_SFX, oirEfecto, assetEfecto } from "../audio/efectos.js";

const fmt = (ms) => { const s = Math.max(0, ms || 0) / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`; };

/** La rejilla: tocar = escuchar; «+» = usar(efecto). */
export function rejillaEfectos(usar, textoUsar = "Poner") {
  const cont = el("div.ed-sfx");
  for (const [g, n] of GRUPOS_SFX) {
    cont.append(el("div.ed-sub-t", { text: n }), el("div.ed-sfx-fila", {}, SFX.filter((s) => s.g === g).map((s) => {
      const caja = el("div.ed-sfx-item", { dataset: { id: s.id } });
      caja.append(
        el("button.ed-sfx-oir", { type: "button", "aria-label": "Escuchar «" + s.n + "»", html: `${ico("sonido")}<span>${s.n}</span>`, onClick: () => { caja.classList.remove("suena"); void caja.offsetWidth; caja.classList.add("suena"); oirEfecto(s.id); } }),
        el("button.ed-sfx-usar", { type: "button", title: `${textoUsar} «${s.n}»`, "aria-label": `${textoUsar} «${s.n}»`, html: ico("mas"), onClick: () => usar(s, caja) }),
      );
      return caja;
    })));
  }
  return cont;
}

/** La ventanita de efectos. `donde`: "linea" (por defecto), "tocar" o "aparecer". */
export function abrirEfectos(app, ancla, { donde = "linea" } = {}) {
  const E = app.estado, T = app.tiempo;
  const sel = E.unico;
  let dest = sel ? donde : "linea";
  const opciones = [["linea", "En LovEdit"], ...(sel ? [["tocar", "Al tocarlo"], ["aparecer", "Al aparecer"]] : [])];
  const seg = el("div.ed-seg.ed-sfx-donde", { role: "radiogroup" }, opciones.map(([k, t]) => el("button" + (k === dest ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(k === dest), dataset: { k }, text: t })));
  const ayuda = el("small.ed-ayuda");
  const pintarAyuda = () => { ayuda.textContent = dest === "linea" ? `Toca uno para oírlo; con «+» se pone en LovEdit donde está el cabezal (${fmt(T?.t)}).` : `Toca uno para oírlo; con «+» suena ${dest === "tocar" ? "al tocar" : "al aparecer"} «${sel?.nombre || "lo elegido"}».`; };
  seg.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-k]");
    if (!b) return;
    dest = b.dataset.k;
    for (const x of seg.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); }
    pintarAyuda();
  });
  pintarAyuda();
  const usar = async (s, caja) => {
    caja.classList.add("cargando");
    try {
      const id = await assetEfecto(app, s.id);
      if (dest === "linea") {
        const t = Math.round((T?.t || 0) / 50) * 50;
        T.agregarPista(id, t, { nombre: s.n });
        aviso(`«${s.n}» en ${fmt(t)} de LovEdit`, 2400);
      } else if (sel) {
        E.setEl(sel.id, { ["sonidos." + dest]: id }, "Sonido " + (dest === "tocar" ? "al tocar" : "al aparecer"));
        aviso(`«${s.n}» suena ${dest === "tocar" ? "al tocar" : "al aparecer"} «${sel.nombre}»`, 2400);
      }
      caja.classList.add("puesto");
      setTimeout(() => caja.classList.remove("puesto"), 900);
    } catch (e) {
      aviso("No se pudo preparar ese efecto en este navegador", 3000, "error");
    } finally { caja.classList.remove("cargando"); }
  };
  return popover(ancla, [el("div.ed-sfx-cab", {}, [el("b", { html: `${ico("campana")}<span>Efectos de sonido</span>` }), opciones.length > 1 ? seg : null, ayuda].filter(Boolean)), rejillaEfectos(usar, "Poner")], { clase: "ed-pop-sfx" });
}
