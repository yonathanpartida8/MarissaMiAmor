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
  ["todo", "Todo", "biblioteca"], ["elementos", "Elementos", "estrella"], ["botones", "Botones", "boton"], ["marcos", "Marcos", "marco"], ["tarjetas", "Tarjetas", "tarjeta"],
  ["hojas", "Hojas", "dibujo"], ["dibujos", "Dibujos", "lapiz"], ["efectos", "Efectos", "efectos"], ["animaciones", "Animaciones", "animar"],
  ["reproductores", "Reproductores", "play"], ["retratos", "Retratos", "polaroid"], ["gifs", "GIFs", "gif"], ["stickers", "Stickers", "sticker"],
  ["decoraciones", "Decoraciones", "estrella"], ["otros", "Otros", "puntos"],
];
const CARPETAS = {
  elementos: "elementos", botones: "botones", buttons: "botones", marcos: "marcos", frames: "marcos", tarjetas: "tarjetas", cards: "tarjetas", hojas: "hojas",
  dibujos: "dibujos", "efectos-animados": "efectos", effects: "efectos", efectos: "efectos", animaciones: "animaciones", animations: "animaciones",
  reproductores: "reproductores", players: "reproductores", retratos: "retratos", portraits: "retratos", gifs: "gifs", stickers: "stickers",
  decoraciones: "decoraciones", decorations: "decoraciones", img: "decoraciones", imagenes: "decoraciones",
};
// La carpeta se reconoce aunque tenga mayúsculas, espacios o tildes («Efectos Animados»).
const normCarpeta = (c) => String(c).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[\s_]+/g, "-");
Object.assign(CARPETAS, { "efectos-animado": "efectos", "animated-effects": "efectos", musica: "otros", reproductor: "reproductores", retrato: "retratos", marco: "marcos", tarjeta: "tarjetas", boton: "botones", dibujo: "dibujos", hoja: "hojas", elemento: "elementos" });
const categoriaDe = (it) => CARPETAS[normCarpeta(String(it.id).split("/")[0])] || "otros";
// «Nuevo»: lo que llegó en los últimos 10 días (o se acaba de dejar en la carpeta).
const esNuevo = (it) => it.nuevo || (it.fecha && Date.now() - it.fecha < 10 * 864e5);
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
    // Fondo de las vistas previas: oscuro (se notan brillos y detalles), cuadritos o claro.
    const FONDOS = [["oscuro", "Oscuro"], ["cuadros", "Cuadritos"], ["claro", "Claro"]];
    let fondo = "oscuro";
    try { fondo = localStorage.getItem("editordev:bibFondo") || "oscuro"; } catch (e) { /* nada */ }
    const ponerFondo = (k) => { fondo = k; document.body.dataset.bibFondo = k; try { localStorage.setItem("editordev:bibFondo", k); } catch (e) { /* nada */ } for (const b of selFondo.children) b.classList.toggle("on", b.dataset.k === k); };
    const selFondo = el("div.ed-seg.ed-bib-fondo", { role: "radiogroup", "aria-label": "Fondo de las vistas previas" }, FONDOS.map(([k, t]) => el("button", { type: "button", text: t, dataset: { k }, onClick: () => ponerFondo(k) })));
    ponerFondo(fondo);
    c.append(chips, el("div.ed-bib-barra", {}, [buscar, selFondo]), rej);
    // Las vistas previas vivas: sólo mientras se ven, y de una en una (abrir
    // la sección con diez HTML a la vez trababa el teléfono un momento).
    const cola = [];
    let reloj = 0;
    const bombear = () => {
      if (reloj) return;
      const paso = () => {
        const caja = cola.shift();
        if (!caja) { reloj = 0; return; }
        if (caja._ve && !caja.firstChild && caja.isConnected) { const f = marco(caja._it); caja.append(f); requestAnimationFrame(() => encajar(f, caja)); }
        reloj = setTimeout(paso, 110);
      };
      reloj = setTimeout(paso, 0);
    };
    const io = new IntersectionObserver((xs) => {
      for (const x of xs) {
        const caja = x.target;
        caja._ve = x.isIntersecting;
        if (x.isIntersecting && !caja.firstChild) { if (!cola.includes(caja)) cola.push(caja); bombear(); }
        else if (!x.isIntersecting && caja.firstChild?.tagName === "IFRAME") caja.firstChild.remove();
      }
    }, { root: c.closest(".ed-panel-cuerpo, .ed-hoja-sec-cuerpo") || null, rootMargin: "120px" });
    const antes = this._limpiar;
    this._limpiar = () => { io.disconnect(); clearTimeout(reloj); reloj = 0; cola.length = 0; antes?.(); };

    const insertar = async (it, tile) => {
      try {
        if (it.tipo === "componente") await A.componente(it); else A.imagenCatalogo(it);
        tile?.classList.remove("puesto"); void tile?.offsetWidth; tile?.classList.add("puesto");
        app.sonidos?.sonar("soltar");
        aviso(`«${it.nombre}» en la hoja ✨ (sigue eligiendo o cierra el panel)`, 1800);
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
        el("b", {}, [it.nombre, esNuevo(it) ? el("i.ed-bib-nuevo", { text: "Nuevo" }) : null].filter(Boolean)),
        el("small", { text: nombreCat(categoriaDe(it)) }),
        it.descripcion ? el("p", { text: it.descripcion }) : null,
        el("button.ed-btn.chico.primario.ed-bib-poner", { type: "button", html: I("mas", "Insertar"), onClick: (e) => insertar(it, e.currentTarget.closest(".ed-bib-t")) }),
      ].filter(Boolean));
      return t;
    };
    catalogo().then((cat) => {
      const todos = [];
      for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "componente" || it.tipo === "imagen") todos.push(it);
      // Lo más reciente arriba (lo recién dejado primero); a igual fecha, el orden de siempre.
      todos.sort((a, b) => (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0) || (b.fecha || 0) - (a.fecha || 0));
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
