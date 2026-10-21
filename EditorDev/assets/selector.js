/**
 * ELEGIR ARCHIVOS — «+ Añadir foto», «+ Añadir canción»…
 *
 * Subir algo nuevo o reusar algo que ya subiste a este librito (Fase 35: el
 * editor es un proyecto aparte; ya no toma nada del librito de Marissa).
 * Las canciones son tuyas (.mp3 o .wav) y se listan por nombre.
 * El editor nunca elige por ti: sólo enseña lo que hay.
 */
import { el, modal, aviso, formatoBytes } from "../components/ui.js";
import { elegirArchivos } from "./biblioteca.js";
import { ico } from "../components/iconos.js";

const ACEPTA = { imagen: "image/*", audio: ".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave", video: "video/*", modelo: ".glb,.gltf,.obj,model/gltf-binary,model/gltf+json" };
const NOMBRE = { imagen: "fotos", audio: "canciones", video: "vídeos", modelo: "modelos 3D" };
const ICO = { imagen: "imagen", audio: "audio", video: "video", modelo: "cubo" };
const SUBIR = { imagen: ["Subir una foto", "Subir fotos"], audio: ["Subir una canción (.mp3 o .wav)"], video: ["Subir un vídeo"], modelo: ["Subir un modelo 3D (.glb, .gltf, .obj)"] };
const TITULO = { imagen: "Añadir foto", audio: "Añadir canción", video: "Añadir vídeo", modelo: "Modelo 3D" };

/** Devuelve una lista de ids de assets (vacía si se cancela). */
export async function elegir(app, tipo = "imagen", { multiple = false, titulo } = {}) {
  const bib = app.bib;
  const elegidos = new Set();
  let resolver;
  const fin = new Promise((r) => { resolver = r; });

  const subir = el("button.ed-subir", { type: "button" }, [
    el("b", { html: ico("subir") }),
    el("span", { text: (multiple && SUBIR[tipo][1]) || SUBIR[tipo][0] }),
    el("small", { text: tipo === "imagen" ? "se optimizan solas para que el librito no pese" : "se guarda en tu navegador hasta que exportes" }),
  ]);
  const progreso = el("p.ed-progreso", { hidden: "" });
  subir.addEventListener("click", async () => {
    let files = await elegirArchivos({ accept: ACEPTA[tipo], multiple });
    if (tipo === "audio") { const n = files.length; files = files.filter((f) => /\.(mp3|wav)$/i.test(f.name) || /^audio\/(mpeg|mp3|wav|x-wav|wave)$/.test(f.type)); if (n && !files.length) { aviso("Sólo canciones .mp3 o .wav"); return; } }
    if (!files.length) return;
    progreso.hidden = false;
    const nuevos = await bib.subir(files, (i, n, nom) => { progreso.textContent = i < n ? `Guardando ${i + 1} de ${n}${nom ? " · " + nom : ""}…` : "Listo"; });
    if (!nuevos.length) { aviso("Ese archivo no es " + ({ imagen: "una foto", audio: "una canción", video: "un vídeo", modelo: "un modelo 3D" })[tipo]); return; }
    caja.cerrar?.();
    resolver(nuevos.map((a) => a.id));
  });

  const mios = Object.values(bib.assets).filter((a) => a.tipo === tipo && (tipo !== "audio" || a.fuente !== "librito"))
    .sort(tipo === "audio" ? (a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { numeric: true }) : (a, b) => b.creado - a.creado);
  const rejilla = el("div.ed-rejilla-assets" + (tipo !== "imagen" ? ".lista" : ""));
  const pintarItem = (a, url) => {
    const b = el("button.ed-asset", { type: "button", title: a.nombre, dataset: { id: a.id } }, tipo === "imagen"
      ? [el("img", { src: url, loading: "lazy", decoding: "async", alt: "" })]
      : [el("b", { html: ico(ICO[tipo]) }), el("span", { text: a.nombre }), a.tam ? el("small", { text: formatoBytes(a.tam) }) : null]);
    b.addEventListener("click", () => {
      if (!multiple) { caja.cerrar?.(); resolver([a.id]); return; }
      b.classList.toggle("on");
      if (elegidos.has(a.id)) elegidos.delete(a.id); else elegidos.add(a.id);
      listo.disabled = !elegidos.size;
      listo.textContent = elegidos.size ? `Usar ${elegidos.size}` : "Elige algunas";
    });
    return b;
  };
  for (const a of mios) rejilla.append(pintarItem(a, bib.url(a.id)));
  const vacioMios = el("p.ed-vacio-txt", { text: `Todavía no has subido ${NOMBRE[tipo]} a este librito.` });

  const cuerpoMios = el("div", {}, [mios.length ? rejilla : vacioMios]);

  const listo = el("button.ed-btn.primario", { type: "button", text: "Elige algunas", disabled: "" });
  listo.addEventListener("click", () => { caja.cerrar?.(); resolver([...elegidos]); });

  const contenido = [subir, progreso, cuerpoMios, multiple ? el("div.ed-pie-elegir", {}, [listo]) : null];
  const p = modal({ titulo: titulo || TITULO[tipo], contenido, ancho: 640, clase: "ed-elegir" });
  const caja = modal.ultima;
  p.then(() => resolver([]));
  return fin;
}
