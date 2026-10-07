/**
 * BIBLIOTECA DE RECURSOS — todo lo de assets/ ordenado por categorías.
 *
 * Cada recurso tiene su vista previa REAL (los .html corren en un marco
 * aislado: sandbox sin acceso al editor), su nombre, categoría y
 * descripción, y «Insertar». Tocar la vista previa la abre en grande y se
 * puede probar (los botones se pueden tocar) antes de insertarlo.
 * Las vistas previas vivas sólo existen mientras se ven (IntersectionObserver):
 * lo que sale de la pantalla se apaga.
 * Añadir un recurso = dejar el archivo en su carpeta (assets/botones/…).
 */
import { el, aviso, debounce } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { catalogo } from "../../componentes/catalogo.js";
import { rutaAUrl } from "../../assets/biblioteca.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
export const CATEGORIAS = [
  ["todo", "Todo", "biblioteca"], ["botones", "Botones", "boton"], ["marcos", "Marcos", "marco"], ["tarjetas", "Tarjetas", "tarjeta"],
  ["hojas", "Hojas", "dibujo"], ["dibujos", "Dibujos", "lapiz"], ["efectos", "Efectos", "efectos"], ["animaciones", "Animaciones", "animar"],
  ["reproductores", "Reproductores", "play"], ["retratos", "Retratos", "polaroid"], ["gifs", "GIFs", "gif"], ["stickers", "Stickers", "sticker"],
  ["decoraciones", "Decoraciones", "estrella"], ["otros", "Otros", "puntos"],
];
const CARPETAS = {
  botones: "botones", buttons: "botones", marcos: "marcos", frames: "marcos", tarjetas: "tarjetas", cards: "tarjetas", hojas: "hojas",
  dibujos: "dibujos", "efectos-animados": "efectos", effects: "efectos", efectos: "efectos", animaciones: "animaciones", animations: "animaciones",
  reproductores: "reproductores", players: "reproductores", retratos: "retratos", portraits: "retratos", gifs: "gifs", stickers: "stickers",
  decoraciones: "decoraciones", decorations: "decoraciones", img: "decoraciones", imagenes: "decoraciones",
};
const categoriaDe = (it) => CARPETAS[String(it.id).split("/")[0].toLowerCase()] || "otros";
const nombreCat = (k) => CATEGORIAS.find((c) => c[0] === k)?.[1] || "Otros";
let elegida = "todo";

/** Un marco aislado para ver un .html (no puede tocar el editor). */
function marco(it, interactivo) {
  const W = it.ancho || 320, H = it.alto || 320;
  const f = el("iframe.ed-bib-vivo", { src: rutaAUrl(it.ruta + (it.entrada || "index.html")), title: it.nombre, sandbox: "allow-scripts", loading: "lazy", tabindex: interactivo ? "0" : "-1" });
  f.style.width = W + "px"; f.style.height = H + "px";
  f._tam = [W, H];
  return f;
}
/** Escala el marco para que quepa en su caja. */
function encajar(f, caja) {
  const [W, H] = f._tam, r = caja.getBoundingClientRect();
  const k = Math.min(r.width / W, r.height / H) || 0.3;
  f.style.transform = `translate(-50%, -50%) scale(${k})`;
}

export const BIBLIOTECA = {
  _componentes(c) {
    const app = this.app, A = app.acciones;
    const chips = el("div.ed-bib-chips", { role: "tablist" });
    const buscar = el("input.ed-txt.ed-buscar", { type: "search", placeholder: "Buscar recursos…", enterkeyhint: "search" });
    const rej = el("div.ed-bib");
    c.append(chips, buscar, rej);
    // Las vistas previas vivas: sólo mientras se ven.
    const io = new IntersectionObserver((xs) => {
      for (const x of xs) {
        const caja = x.target, it = caja._it;
        if (x.isIntersecting && !caja.firstChild) { const f = marco(it); caja.append(f); requestAnimationFrame(() => encajar(f, caja)); }
        else if (!x.isIntersecting && caja.firstChild?.tagName === "IFRAME") caja.firstChild.remove();
      }
    }, { root: c.closest(".ed-panel-cuerpo, .ed-hoja-sec-cuerpo") || null, rootMargin: "120px" });
    const antes = this._limpiar;
    this._limpiar = () => { io.disconnect(); antes?.(); };

    const insertar = async (it, tile) => {
      try {
        if (it.tipo === "componente") await A.componente(it); else A.imagenCatalogo(it);
        tile?.classList.remove("puesto"); void tile?.offsetWidth; tile?.classList.add("puesto");
        app.sonidos?.sonar("soltar");
        aviso(`«${it.nombre}» en la hoja ✨`, 1600);
        if (app.lateral?.abierto && matchMedia("(max-width: 1023px)").matches) app.lateral.cerrar();
        app.cerrarHojaSec?.();
      } catch (e) { aviso("No se pudo insertar: " + (e.message || e), 3500, "error"); }
    };
    const previa = (it) => {
      const caja = el("div.ed-bib-grande");
      let f = null;
      if (it.tipo === "componente") { f = marco(it, true); caja.append(f); }
      else caja.append(el("img", { src: rutaAUrl(it.ruta), alt: it.nombre }));
      hojita({
        titulo: it.nombre, clase: "ed-bib-previa",
        contenido: [caja, el("small.ed-bib-cat", { text: nombreCat(categoriaDe(it)) + (it.tipo === "componente" ? " · se puede tocar" : "") }), it.descripcion ? el("p.ed-ayuda", { text: it.descripcion }) : null].filter(Boolean),
        acciones: [[I("volver", "Atrás"), null], [I("mas", "Insertar"), "usar", "primario"]],
        alAbrir: () => f && requestAnimationFrame(() => encajar(f, caja)),
      }).then((r) => { if (r === "usar") insertar(it); });
      if (f) setTimeout(() => encajar(f, caja), 300);
    };
    const tarjeta = (it) => {
      const caja = el("div.ed-bib-prev" + (it.tipo === "componente" ? ".vivo" : ""));
      if (it.miniatura) caja.append(el("img", { src: rutaAUrl(it.miniatura), alt: "", loading: "lazy", draggable: "false" }));
      else if (it.tipo === "imagen") caja.append(el("img", { src: rutaAUrl(it.ruta), alt: "", loading: "lazy", draggable: "false" }));
      else { caja._it = it; io.observe(caja); }
      const t = el("div.ed-bib-t", {}, [
        el("button.ed-bib-ver", { type: "button", title: "Ver en grande y probar", "aria-label": `Ver ${it.nombre}`, onClick: () => previa(it) }, [caja]),
        el("b", { text: it.nombre }),
        el("small", { text: nombreCat(categoriaDe(it)) }),
        it.descripcion ? el("p", { text: it.descripcion }) : null,
        el("button.ed-btn.chico.primario.ed-bib-poner", { type: "button", html: I("mas", "Insertar"), onClick: (e) => insertar(it, e.currentTarget.closest(".ed-bib-t")) }),
      ].filter(Boolean));
      return t;
    };
    catalogo().then((cat) => {
      const todos = [];
      for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "componente" || it.tipo === "imagen") todos.push(it);
      const cuenta = {};
      for (const it of todos) cuenta[categoriaDe(it)] = (cuenta[categoriaDe(it)] || 0) + 1;
      const pintarChips = () => {
        chips.replaceChildren(...CATEGORIAS.filter(([k]) => k === "todo" || cuenta[k] || k === "gifs" || k === "stickers").map(([k, n, i]) => el("button.ed-bib-chip" + (elegida === k ? ".on" : ""), { type: "button", role: "tab", "aria-selected": String(elegida === k), html: `${ico(i)}<span>${n}</span>${k !== "todo" && cuenta[k] ? `<small>${cuenta[k]}</small>` : ""}`, onClick: () => { elegida = k; pintarChips(); pintar(); } })));
      };
      const pintar = () => {
        for (const x of rej.querySelectorAll(".ed-bib-prev")) io.unobserve(x);
        rej.textContent = "";
        const q = buscar.value.trim().toLowerCase();
        const lista = todos.filter((it) => (elegida === "todo" || categoriaDe(it) === elegida) && (!q || `${it.nombre} ${it.descripcion || ""} ${nombreCat(categoriaDe(it))}`.toLowerCase().includes(q)));
        if (elegida === "gifs" || elegida === "stickers") {
          const g = elegida === "gifs";
          rej.append(el("div.ed-bib-giphy", {}, [
            el("b", { html: I(g ? "gif" : "sticker", g ? "Millones de GIFs" : "Stickers sin fondo") }),
            el("p.ed-ayuda", { text: g ? "Busca, previsualiza e inserta GIFs de GIPHY (ya viene conectado)." : "Stickers animados de GIPHY, ya sin fondo." }),
            el("button.ed-btn.primario", { type: "button", html: I("buscar", g ? "Buscar GIFs" : "Buscar stickers"), onClick: () => app.abrirSeccion(g ? "gifs" : "stickers") }),
          ]));
        }
        if (!lista.length && !(elegida === "gifs" || elegida === "stickers")) rej.append(el("p.ed-vacio-txt", { text: q ? "Nada con ese nombre." : "Aún no hay recursos aquí: deja archivos en su carpeta de assets/." }));
        rej.append(...lista.map(tarjeta));
      };
      buscar.addEventListener("input", debounce(pintar, 180));
      pintarChips();
      pintar();
      requestAnimationFrame(() => chips.querySelector(".on")?.scrollIntoView({ inline: "center", block: "nearest" }));
    });
    c.append(el("details.ed-sec", {}, [el("summary", { text: "¿Cómo añado los míos?" }), el("div.ed-sec-cuerpo", {}, [el("p.ed-ayuda", { html: "Deja un archivo en su carpeta de <b>assets/</b>: <b>botones/</b>, <b>marcos/</b>, <b>tarjetas/</b>, <b>hojas/</b>, <b>dibujos/</b>, <b>efectos-animados/</b>, <b>reproductores/</b>, <b>retratos/</b>, <b>stickers/</b>, <b>decoraciones/</b> u <b>otros/</b>. Un <b>.html</b> (con su CSS y JS dentro) o una imagen. Aparece aquí solo." })])]));
  },
};
