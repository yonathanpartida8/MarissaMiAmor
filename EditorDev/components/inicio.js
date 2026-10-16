/**
 * INICIO — tus libritos guardados y cómo empezar uno.
 *
 * «Tus borradores» junta los de este aparato y los de tu nube (M.YNTHN):
 * cada uno dice si ya está en tu nube, si sólo está aquí o si allá hay uno más
 * nuevo; los que sólo están en la nube se bajan al tocarlos.
 */
import { el, boton, menu, confirmar, aviso } from "./ui.js";
import * as SRV from "../integraciones/servidor.js";
import * as NUBE from "../integraciones/nube.js";
import { listar, borrar } from "../storage/db.js";
import { borrarCopias } from "../storage/respaldos.js";
import { FORMATOS, nuevoProyecto } from "../core/modelo.js";
import { PLANTILLAS, ponerFotoDePortada, tieneHuecoDeFoto } from "../templates/plantillas.js";
import { elegirArchivos } from "../assets/biblioteca.js";
import { ico } from "./iconos.js";
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const RT = window.LibritoRT;

// Nombre corto de cada portada en el selector (las nuevas usan su nombre).
const CORTO = { portada: "Clásica", "portada-revista": "Como la de Marissa", "portada-tu-foto": "Tu foto", "portada-corazones": "Corazones", "portada-polaroids": "Polaroids", "portada-cine": "Estreno", "portada-foto": "Con foto", "portada-noche": "Noche", "portada-baddie": "Baddie", "portada-sobre": "Sobre", "portada-minimal": "Minimal" };
const ORDEN = Object.keys(CORTO);

/**
 * Elegir la portada del librito nuevo: cada estilo pintado en chiquito (la
 * portada de verdad) y, si eliges tu imagen, ya se ve puesta en cada uno.
 */
function selectorDePortada(formatoSel) {
  const portadas = PLANTILLAS.filter((t) => t.cat === "portadas").sort((a, b) => (ORDEN.indexOf(a.id) + 1 || 99) - (ORDEN.indexOf(b.id) + 1 || 99));
  let elegida = "portada", foto = null, url = null, vivas = [];
  const fila = el("div.ed-portadas", { role: "radiogroup", "aria-label": "Estilo de portada" });
  const pintar = () => {
    for (const v of vivas) v.destruir?.();
    vivas = [];
    const f = FORMATOS[formatoSel.value] || FORMATOS.movil;
    const P = nuevoProyecto("Mi librito", f.auto ? "movil" : formatoSel.value);
    const { ancho: W, alto: H } = P.ajustes;
    const fuentes = new Set();
    fila.replaceChildren(...portadas.map((t) => {
      const pg = t.crear(P);
      if (url) ponerFotoDePortada(pg, "tu-foto");
      for (const x of pg.els) if (x.texto?.fuente) fuentes.add(x.texto.fuente);
      const pag = new RT.Pagina(pg, { modo: "mini", url: (id) => (id === "tu-foto" ? url : null) }, W, H);
      vivas.push(pag);
      pag.nodo.style.transform = `scale(${72 / W})`;
      pag.nodo.style.transformOrigin = "0 0";
      const on = t.id === elegida;
      return el("button.ed-portada-op" + (on ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(on), title: t.d, dataset: { id: t.id } }, [
        el("div.ed-mini", { style: { aspectRatio: `${W} / ${H}` } }, [el("div.ed-mini-escala", {}, [pag.nodo])]),
        el("span", { text: CORTO[t.id] || t.n }),
      ]);
    }));
    RT.cargarFuentes?.([...fuentes]);
  };
  fila.addEventListener("click", (e) => {
    const b = e.target.closest(".ed-portada-op");
    if (!b) return;
    elegida = b.dataset.id;
    for (const x of fila.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); }
    b.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  });
  formatoSel.addEventListener("change", pintar);
  // Tu propia imagen de portada.
  const zona = el("div.ed-portada-foto");
  const pintarZona = () => zona.replaceChildren(...(url
    ? [el("img", { src: url, alt: "Tu imagen de portada" }), el("small", { text: "Tu imagen" }), boton(I("cambiar", "Cambiar"), elegir, "chico"), boton(I("cerrar", "Quitar"), () => { URL.revokeObjectURL(url); url = null; foto = null; pintarZona(); pintar(); }, "chico")]
    : [boton(I("imagen", "Usar mi propia imagen de portada"), elegir)]));
  async function elegir() {
    const [f] = await elegirArchivos({ accept: "image/*", multiple: false });
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(png|jpe?g|webp|gif|avif)$/i.test(f.name)) { aviso("Eso no parece una imagen"); return; }
    if (url) URL.revokeObjectURL(url);
    foto = f; url = URL.createObjectURL(f);
    // Si el estilo elegido no tiene dónde poner foto, se pasa al de «Tu foto».
    const t = portadas.find((x) => x.id === elegida);
    if (t && !tieneHuecoDeFoto(t.crear(nuevoProyecto()))) elegida = "portada-tu-foto";
    pintarZona(); pintar();
    fila.querySelector(".on")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  pintarZona(); pintar();
  return {
    nodos: [fila, zona],
    valor: () => ({ portada: elegida, imagen: foto }),
    destruir: () => { for (const v of vivas) v.destruir?.(); vivas = []; if (url) URL.revokeObjectURL(url); },
  };
}

const hace = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.round(s / 86400)} días`;
  return new Date(t).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

const paginas = (n) => `${n} ${n === 1 ? "página" : "páginas"}`;

/** Quita la pantalla de inicio (y suelta sus miniaturas). */
export function quitarInicio() { const c = document.querySelector(".ed-inicio"); c?._destruir?.(); c?.remove(); }

// Cómo está cada librito frente a tu nube.
const ETQ = {
  igual: ["nubeOk", "En tu nube"], aqui: ["telefono", "Sólo en este aparato"], quitado: ["telefono", "Sólo en este aparato"],
  subir: ["nube", "Subiendo a tu nube pronto"], nube: ["nube", "Hay uno más nuevo en tu nube"], "los-dos": ["aviso", "Cambió en dos aparatos"],
};

export async function pantallaInicio(app, { cerrable = false } = {}) {
  quitarInicio();
  const lista = await listar().catch(() => []);
  const borradores = el("section.ed-inicio-borradores");
  const formato = el("select.ed-sel", {}, Object.entries(FORMATOS).map(([k, f]) => el("option", { value: k, text: f.auto ? f.n : `${f.n} · ${f.w}×${f.h}` })));
  formato.value = "movil";
  const nombre = el("input.ed-txt", { type: "text", placeholder: "Nombre del librito", value: "Mi librito" });
  const portada = selectorDePortada(formato);
  const cerrar = () => { portada.destruir(); capa.remove(); };
  const capa = el("div.ed-inicio", { role: "dialog", "aria-label": "Crear librito" }, [
    el("div.ed-inicio-caja", {}, [
      el("header", {}, [
        el("a.ed-volver", { href: "../index.html", title: "Volver al librito", html: ico("volver") }),
        el("div", {}, [el("h1", { text: "Crear librito" }), el("p", { text: "Tu taller para armar libritos interactivos: páginas, fotos, música, animaciones y HTML propio." })]),
        cerrable ? el("button.ed-x", { type: "button", html: ico("cerrar"), "aria-label": "Cerrar", onClick: () => cerrar() }) : null,
      ]),
      el("section.ed-inicio-nuevo", {}, [
        el("div.ed-tarjeta.ed-tarjeta-nuevo", {}, [
          el("b", { html: I("nuevo", "Librito nuevo") }),
          el("small", { text: "Elige el estilo de su portada (o pon tu propia imagen). Después puedes cambiar todo." }),
          ...portada.nodos,
          el("div.ed-nuevo-datos", {}, [nombre, formato]),
          boton("Crear", () => { const v = portada.valor(); cerrar(); app.nuevo(nombre.value.trim() || "Mi librito", formato.value, v); }, "primario"),
        ]),
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("biblioteca", "Mi librito de siempre") }),
          el("small", { text: "Una copia editable de todo el librito, sin tocar el original." }),
          boton("Importarlo", () => { cerrar(); app.importar.importarLibrito(); }),
        ]),
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("subir", "Abrir archivo") }),
          el("small", { text: "Un .zip que exportaste antes (o su project.json)." }),
          boton("Elegir archivo", () => { cerrar(); app.abrirArchivo(); }),
        ]),
      ]),
      borradores,
    ]),
  ]);
  capa._destruir = portada.destruir;
  document.body.append(capa);

  const otraVez = () => pantallaInicio(app, { cerrable: cerrable && !!app.estado.proyecto });
  const borrarAqui = async (id) => { await borrar(id); borrarCopias(id).catch(() => {}); if (app.estado.proyecto?.id === id) app.estado.proyecto = null; };
  /** Bajar (o poner al día) un librito de tu nube y abrirlo; la pantalla se queda si algo falla. */
  const abrirNube = async (l) => {
    const t = el("p", { text: "Bajando de tu nube…" });
    const ocupado = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: `Abriendo «${l.nombre}»` }), t])]);
    document.body.append(ocupado);
    try { await NUBE.abrirDeLaNube(l.clave, { alAvance: (x, p) => { t.textContent = p != null && p < 1 ? `${x} · ${Math.round(p * 100)} %` : x; } }); }
    catch (e) { aviso(`No se pudo bajar de tu nube: ${e.message}`, 5000, "error"); }
    finally { ocupado.remove(); }
  };
  const etiqueta = (st, icono, texto) => el("em.ed-bd-nube", { dataset: { st }, html: `${ico(icono)}<span>${texto}</span>` });

  /** «Tus borradores»: los de aquí y, con tu cuenta, los de tu nube. */
  const pintar = (nubeL, errNube = "") => {
    const conectado = SRV.conectado();
    const enNube = new Map((nubeL?.libritos || []).map((l) => [l.clave, l]));
    const aqui = new Set(lista.map((p) => p.id));
    const soloNube = (nubeL?.libritos || []).filter((l) => !aqui.has(l.clave));
    const items = lista.map((p) => {
      const fila = enNube.get(p.id);
      const c = conectado && nubeL && NUBE.esMio(p.id) ? NUBE.comparar(p, fila) : null;
      const abrirlo = () => { if (c === "nube") abrirNube(fila); else { cerrar(); app.abrir(p.id); } };
      return el("li", {}, [
        el("button.ed-borrador", { type: "button", onClick: abrirlo }, [
          el("b", { text: p.nombre }),
          el("small", { text: `${paginas(p.nPaginas ?? p.orden?.length ?? 0)} · ${hace(p.editado)}` }),
          c ? etiqueta(c, ...ETQ[c]) : null,
        ]),
        el("button.ed-mas", { type: "button", html: ico("puntos"), "aria-label": "Más", onClick: (e) => menu(e.currentTarget, [
          { t: "Abrir", al: abrirlo },
          { t: I("duplicar", "Duplicar"), al: async () => { await app.duplicarProyecto(p.id); otraVez(); } },
          "-",
          { t: I("borrar", fila ? "Borrar de este aparato" : "Borrar"), peligro: true, al: async () => {
            if (!(await confirmar(fila ? `Se borrará «${p.nombre}» de este aparato. En tu nube sigue guardado.` : `Se borrará «${p.nombre}» de este navegador, con sus fotos subidas.`, "Borrar"))) return;
            await borrarAqui(p.id); otraVez();
          } },
          fila ? { t: I("borrar", "Borrar de todos lados"), peligro: true, al: async () => {
            if (!(await confirmar(`Se borrará «${p.nombre}» de este aparato y de tu nube (con sus copias). No se puede deshacer.`, "Borrar de todos lados"))) return;
            try { await NUBE.borrarDeLaNube(p.id); } catch (er) { aviso(`No se pudo borrar de tu nube (no se borró nada): ${er.message}`, 5000, "error"); return; }
            await borrarAqui(p.id); otraVez();
          } } : null,
        ].filter(Boolean)) }),
      ]);
    });
    for (const l of soloNube) items.push(el("li", {}, [
      el("button.ed-borrador.en-nube", { type: "button", onClick: () => abrirNube(l) }, [
        el("b", { text: l.nombre }),
        el("small", { text: `${paginas(l.paginas || 0)} · ${hace(l.editado)}${l.aparato ? ` · desde ${l.aparato}` : ""}` }),
        etiqueta("solo-nube", "nube", "En tu nube · tócalo para abrirlo aquí"),
      ]),
      el("button.ed-mas", { type: "button", html: ico("puntos"), "aria-label": "Más", onClick: (e) => menu(e.currentTarget, [
        { t: I("subir", "Abrirlo en este aparato"), al: () => abrirNube(l) },
        "-",
        { t: I("borrar", "Borrar de mi nube"), peligro: true, al: async () => {
          if (!(await confirmar(`Se borrará «${l.nombre}» de tu nube (con sus copias). No se puede deshacer.`, "Borrar"))) return;
          try { await NUBE.borrarDeLaNube(l.clave); otraVez(); } catch (er) { aviso(er.message, 4500, "error"); }
        } },
      ]) }),
    ]));
    const nota = !conectado
      ? el("div.ed-inicio-nube", {}, [
        el("p", { text: `Lo que hagas se guarda en este aparato. Entra a tu cuenta de ${SRV.NOMBRE} y tus libritos se guardan también en tu nube, para abrirlos desde cualquier teléfono o computadora.` }),
        boton(I("cuenta", "Entrar o crear mi cuenta"), () => { const M = app.menuPrincipal; if (!M.abierto) M.abrir(); M.pintar("cuenta"); }, "chico"),
      ])
      : errNube ? el("small.ed-nota.suave", { text: `No pude ver tu nube ahora (${errNube}). Lo de este aparato está aquí.` })
        : !nubeL ? el("small.ed-nota.suave", { text: "Buscando tus libritos en tu nube…" }) : null;
    borradores.replaceChildren(...[
      el("h2", { text: items.length ? "Tus borradores" : "Todavía no hay borradores" }),
      items.length ? el("ul.ed-borradores", {}, items) : el("p.ed-vacio-txt", { text: conectado ? "Empieza uno nuevo: se guarda aquí y en tu nube mientras editas." : "Lo que hagas se guarda solo mientras editas." }),
      nota,
    ].filter(Boolean));
  };
  const cargarNube = () => {
    pintar(null);
    if (!SRV.conectado()) return;
    NUBE.listaNube(true).then((d) => { if (capa.isConnected) pintar(d); }).catch((e) => { if (capa.isConnected) pintar(null, e.message); });
  };
  cargarNube();
  // Entraste o saliste de tu cuenta con esto abierto: la lista se pone al día.
  const alCuenta = () => { if (capa.isConnected) cargarNube(); else removeEventListener("ed-cuenta", alCuenta); };
  addEventListener("ed-cuenta", alCuenta);
  return capa;
}
