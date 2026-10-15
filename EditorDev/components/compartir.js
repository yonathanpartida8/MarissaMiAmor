/**
 * COMPARTIR — mandar el librito (o sus fotos y canciones) por WhatsApp o
 * cualquier app, con el menú «Compartir» del propio teléfono.
 *
 *   Para seguir editándolo   la copia completa (.zip): se abre en el editor
 *                            con «Abrir archivo» y trae todo, originales incluidos
 *   Sólo para verlo          el .zip normal (ligero: sólo lo que se usa)
 *   Fotos, música y vídeos   los archivos sueltos de la biblioteca
 *
 * Primero se prepara el archivo y DESPUÉS se toca «Compartir» (el teléfono
 * sólo deja abrir su menú justo tras un toque). Una app web no puede abrir un
 * chat de WhatsApp con un archivo: se elige WhatsApp en ese menú. Si el
 * navegador no deja compartir ese tipo de archivo (Chrome en Android no deja
 * los .zip), se descarga y se explica cómo mandarlo como documento.
 */
import { el, modal, aviso } from "./ui.js";
import { ico } from "./iconos.js";

const I = (i, t) => `${ico(i)}<span>${t}</span>`;
const mb = (b) => (b / 1048576).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " MB";
const puede = (files) => { try { return !!navigator.canShare?.({ files }); } catch (e) { return false; } };

/** Comparte (o descarga y explica). Devuelve "compartido" | "cancelado" | "descargado". */
export async function compartirArchivos(files, { titulo, texto } = {}) {
  if (puede(files)) {
    try { await navigator.share({ files, title: titulo, text: texto }); return "compartido"; } catch (e) { if (e?.name === "AbortError") return "cancelado"; }
  }
  const { descargar } = await import("../export/exportar.js");
  for (const f of files) descargar(f, f.name);
  modal({
    titulo: "Se descargó para que lo mandes",
    contenido: el("div.ed-comp-ayuda", {}, [
      el("p", { text: `Este navegador no deja pasar ${files.length > 1 ? "estos archivos" : "este archivo"} directo a otra app, así que ${files.length > 1 ? "se descargaron" : "se descargó"}: ${files.map((f) => "«" + f.name + "»").join(", ")}.` }),
      el("ol", {}, [
        el("li", { text: "Abre WhatsApp y entra al chat." }),
        el("li", { text: "Toca el clip (Adjuntar) → Documento." }),
        el("li", { text: "Busca en Descargas y elígelo." }),
      ]),
      el("small.ed-ayuda", { text: "Para abrirlo y seguir editándolo: en el editor, «Abrir archivo (.zip / .json)»." }),
    ]),
    acciones: [["Entendido", null, "primario"]],
    ancho: 440,
  });
  return "descargado";
}

export async function abrirCompartir(app) {
  const P = app.estado.proyecto;
  const cuerpo = el("div.ed-comp");
  const listo = (blob, nombre, tipo, texto) => {
    const file = new File([blob], nombre, { type: tipo });
    const directo = puede([file]);
    cuerpo.replaceChildren(
      el("div.ed-comp-listo", {}, [el("b", { html: I("ok", "Listo para mandar") }), el("small", { text: `${nombre} · ${mb(blob.size)}` })]),
      el("p.ed-ayuda", { text: directo ? "Toca «Compartir» y elige WhatsApp (o la app que quieras) en el menú del teléfono." : "Este navegador no deja compartir este tipo de archivo directo: al tocar se descarga y te digo cómo mandarlo por WhatsApp como documento." }),
      el("div.ed-botonera", {}, [
        el("button.ed-btn.primario", { type: "button", html: I(directo ? "compartir" : "exportar", directo ? "Compartir…" : "Descargar para mandar"), onClick: async () => { const r = await compartirArchivos([file], { titulo: P.nombre, texto }); if (r === "compartido") aviso("Enviado al menú de compartir", 2200); } }),
        el("button.ed-btn", { type: "button", html: I("volver", "Otra opción"), onClick: () => opciones() }),
      ]),
    );
  };
  const preparar = async (completo) => {
    if (app.auto.pendiente) await app.auto.ahora();
    const t = el("small.ed-ayuda", { text: "Juntando todo…" });
    cuerpo.replaceChildren(el("div.ed-comp-prep", {}, [el("i.ed-girando"), el("b", { text: completo ? "Preparando la copia completa…" : "Preparando el librito…" }), t]));
    try {
      const { exportar } = await import("../export/exportar.js");
      const r = await exportar(app, { completo, alProgreso: (x) => { t.textContent = x; } });
      listo(r.blob, r.nombre, "application/zip", completo ? `Nuestro librito «${P.nombre}» ♥ Ábrelo en el editor (Abrir archivo) para verlo y seguir editándolo.` : `Nuestro librito «${P.nombre}» ♥ Descomprímelo y abre index.html.`);
      if (r.faltan.length) aviso("No se encontraron: " + r.faltan.join(", "), 5000, "error");
    } catch (e) { cuerpo.replaceChildren(el("p.ed-gd-error", { text: "No se pudo preparar: " + e.message }), el("button.ed-btn", { type: "button", html: I("volver", "Atrás"), onClick: () => opciones() })); }
  };
  const sueltos = () => {
    const lista = Object.values(P.assets || {}).filter((a) => a.fuente === "local" && /imagen|audio|video/.test(a.tipo));
    const elegidos = new Set();
    const n = el("small.ed-ayuda", { text: "Elige qué mandar." });
    const btn = el("button.ed-btn.primario", { type: "button", disabled: "", html: I("compartir", "Compartir…") });
    btn.addEventListener("click", async () => {
      const files = [];
      for (const id of elegidos) { const a = P.assets[id], b = await app.bib.blob(id); if (b) files.push(new File([b], a.archivo || `${a.nombre}.${(b.type.split("/")[1] || "bin").replace("jpeg", "jpg")}`, { type: b.type || a.mime })); }
      if (files.length) await compartirArchivos(files, { titulo: P.nombre });
    });
    cuerpo.replaceChildren(
      lista.length ? el("div.ed-comp-sueltos", {}, lista.map((a) => {
        const c = el("button.ed-comp-item", { type: "button", "aria-pressed": "false" }, [a.tipo === "imagen" ? el("img", { src: app.bib.miniUrl(a.id) || "", alt: "", loading: "lazy", decoding: "async" }) : el("i", { html: ico(a.tipo === "audio" ? "audio" : "video") }), el("small", { text: a.nombre })]);
        c.addEventListener("click", () => { if (elegidos.has(a.id)) elegidos.delete(a.id); else elegidos.add(a.id); const on = elegidos.has(a.id); c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on)); n.textContent = elegidos.size ? `${elegidos.size} elegido${elegidos.size === 1 ? "" : "s"}` : "Elige qué mandar."; btn.disabled = !elegidos.size; });
        return c;
      })) : el("p.ed-ayuda", { text: "Todavía no subiste fotos, canciones ni vídeos a este librito." }),
      n,
      el("div.ed-botonera", {}, [btn, el("button.ed-btn", { type: "button", html: I("volver", "Atrás"), onClick: () => opciones() })]),
    );
  };
  const op = (i, t, sub, fn) => el("button.ed-comp-op", { type: "button", onClick: fn }, [el("i", { html: ico(i) }), el("span", {}, [el("b", { text: t }), el("small", { text: sub })])]);
  const opciones = () => cuerpo.replaceChildren(
    op("escudo", "Para seguir editándolo", "Todo el librito con sus fotos, música, animaciones y originales. Se abre en el editor.", () => preparar(true)),
    op("libro", "Sólo para verlo", "El librito ligero, con lo que se usa. Se abre como página.", () => preparar(false)),
    op("imagen", "Fotos, música y vídeos", "Los archivos sueltos de la biblioteca.", sueltos),
    el("small.ed-ayuda", { text: "Se usa el menú «Compartir» de tu teléfono: ahí eliges WhatsApp. Ninguna app web puede abrir un chat directamente con el archivo." }),
  );
  opciones();
  return modal({ titulo: "Compartir por WhatsApp", contenido: cuerpo, acciones: [["Cerrar", null]], ancho: 480, clase: "ed-modal-comp" });
}
