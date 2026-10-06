/**
 * ELEGIR ARCHIVOS — «+ Añadir foto», «+ Añadir canción»…
 *
 * Tres pestañas: subir algo nuevo, reusar algo que ya subiste a este
 * librito, o tomar una foto/canción que ya está en el librito de siempre.
 * El editor nunca elige por ti: sólo enseña lo que hay.
 */
import { el, modal, aviso, formatoBytes } from "../components/ui.js";
import { elegirArchivos, rutaAUrl } from "./biblioteca.js";
import { carpetasFotos, cancionesDelLibrito, videos } from "./librito.js";
import { catalogo } from "../componentes/catalogo.js";
import { ico } from "../components/iconos.js";

const ACEPTA = { imagen: "image/*", audio: "audio/*,.mp3,.m4a,.ogg,.wav", video: "video/*", modelo: ".glb,.gltf,.obj,model/gltf-binary,model/gltf+json" };
const NOMBRE = { imagen: "fotos", audio: "canciones", video: "vídeos", modelo: "modelos 3D" };
const ICO = { imagen: "imagen", audio: "audio", video: "video", modelo: "cubo" };
const SUBIR = { imagen: ["Subir una foto", "Subir fotos"], audio: ["Subir una canción"], video: ["Subir un vídeo"], modelo: ["Subir un modelo 3D (.glb, .gltf, .obj)"] };
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
    const files = await elegirArchivos({ accept: ACEPTA[tipo], multiple });
    if (!files.length) return;
    progreso.hidden = false;
    const nuevos = await bib.subir(files, (i, n, nom) => { progreso.textContent = i < n ? `Guardando ${i + 1} de ${n}${nom ? " · " + nom : ""}…` : "Listo"; });
    if (!nuevos.length) { aviso("Ese archivo no es " + ({ imagen: "una foto", audio: "una canción", video: "un vídeo", modelo: "un modelo 3D" })[tipo]); return; }
    caja.cerrar?.();
    resolver(nuevos.map((a) => a.id));
  });

  const mios = Object.values(bib.assets).filter((a) => a.tipo === tipo).sort((a, b) => b.creado - a.creado);
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

  // Lo del librito de siempre: se pide sólo al abrir esa pestaña.
  const delLibrito = el("div.ed-del-librito");
  let cargado = false;
  const cargarLibrito = async () => {
    if (cargado) return;
    cargado = true;
    delLibrito.textContent = "Buscando…";
    if (tipo === "imagen") {
      const cs = await carpetasFotos();
      const cat = await catalogo();
      for (const g of cat.categorias) {
        const imgs = g.items.filter((it) => it.tipo === "imagen");
        if (imgs.length) cs.unshift({ carpeta: "assets/" + g.id, nombre: g.nombre + " (assets)", fotos: imgs.map((it) => it.ruta) });
      }
      delLibrito.textContent = "";
      for (const c of cs) {
        const r = el("div.ed-rejilla-assets");
        const d = el("details.ed-carpeta", {}, [el("summary", { text: `${c.nombre} · ${c.fotos.length}` }), r]);
        d.addEventListener("toggle", () => {
          if (!d.open || r.childElementCount) return;
          for (const ruta of c.fotos) {
            const b = el("button.ed-asset", { type: "button", title: ruta }, [el("img", { src: rutaAUrl(ruta), loading: "lazy", decoding: "async", alt: "" })]);
            b.addEventListener("click", () => {
              const a = bib.delLibrito(ruta, "imagen", ruta.split("/").slice(-2).join(" · "));
              if (!multiple) { caja.cerrar?.(); resolver([a.id]); return; }
              b.classList.toggle("on");
              if (elegidos.has(a.id)) elegidos.delete(a.id); else elegidos.add(a.id);
              listo.disabled = !elegidos.size;
              listo.textContent = elegidos.size ? `Usar ${elegidos.size}` : "Elige algunas";
            });
            r.append(b);
          }
        });
        delLibrito.append(d);
      }
    } else {
      let lista;
      if (tipo === "audio") {
        // Primero lo de «musica assets/» y los sonidos de assets/, luego lo del librito de siempre.
        const cat = await catalogo();
        const sueltos = [];
        for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "audio") sueltos.push({ ruta: it.ruta, nombre: `${it.nombre} · ${g.nombre.toLowerCase()}`, tam: it.peso });
        lista = [...cat.musica.map((m) => ({ ruta: m.ruta, nombre: m.nombre + " · musica assets", tam: m.peso })), ...sueltos, ...(await cancionesDelLibrito())];
      } else if (tipo === "modelo") {
        const cat = await catalogo();
        lista = [];
        for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "modelo") lista.push({ ruta: it.ruta, nombre: `${it.nombre} · ${g.nombre.toLowerCase()}`, tam: it.peso });
      } else lista = await videos();
      delLibrito.textContent = "";
      const r = el("div.ed-rejilla-assets.lista");
      for (const c of lista) {
        const b = el("button.ed-asset", { type: "button" }, [el("b", { html: ico(ICO[tipo]) }), el("span", { text: c.nombre }), c.tam ? el("small", { text: formatoBytes(c.tam) }) : null]);
        b.addEventListener("click", () => { const a = bib.delLibrito(c.ruta, tipo, c.nombre, { tam: c.tam }); caja.cerrar?.(); resolver([a.id]); });
        r.append(b);
      }
      delLibrito.append(lista.length ? r : el("p.ed-vacio-txt", { text: "No hay nada de esto en el librito." }));
    }
  };

  const pestanas = el("div.ed-seg.ed-pestanas", {}, [
    el("button.on", { type: "button", text: "Mis " + NOMBRE[tipo], dataset: { p: "mios" } }),
    el("button", { type: "button", text: "Del librito", dataset: { p: "librito" } }),
  ]);
  const cuerpoMios = el("div", {}, [mios.length ? rejilla : vacioMios]);
  const cuerpoLib = el("div", { hidden: "" }, [delLibrito]);
  pestanas.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    for (const x of pestanas.children) x.classList.toggle("on", x === b);
    cuerpoMios.hidden = b.dataset.p !== "mios";
    cuerpoLib.hidden = b.dataset.p !== "librito";
    if (b.dataset.p === "librito") cargarLibrito();
  });

  const listo = el("button.ed-btn.primario", { type: "button", text: "Elige algunas", disabled: "" });
  listo.addEventListener("click", () => { caja.cerrar?.(); resolver([...elegidos]); });

  const contenido = [subir, progreso, pestanas, cuerpoMios, cuerpoLib, multiple ? el("div.ed-pie-elegir", {}, [listo]) : null];
  const p = modal({ titulo: titulo || TITULO[tipo], contenido, ancho: 640, clase: "ed-elegir" });
  const caja = modal.ultima;
  p.then(() => resolver([]));
  return fin;
}
