/**
 * INICIO — «Crear detallito» (empezar uno: de página o un dibujito) y «Mis libritos» (copias de seguridad).
 *
 * En «Mis libritos», la lista junta los de este aparato y los de tu nube (M.YNTHN): cada uno dice si ya
 * está en tu nube, si sólo está aquí o si allá hay uno más nuevo; los de la nube se bajan al tocarlos.
 * (Fase 46: «Crear detallito» ya no lleva borradores: sólo crear, con su nombre obligatorio.)
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
import { ajustar } from "./transiciones.js";
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const RT = window.LibritoRT;

// Nombre corto de cada portada en el selector (las nuevas usan su nombre).
const CORTO = { "portada-clasica": "Clásica", portada: "Con corazón", "portada-revista": "Revista", "portada-tu-foto": "Tu foto", "portada-corazones": "Corazones", "portada-polaroids": "Polaroids", "portada-cine": "Estreno", "portada-foto": "Con foto", "portada-noche": "Noche", "portada-baddie": "Baddie", "portada-sobre": "Sobre", "portada-minimal": "Minimal" };
const ORDEN = Object.keys(CORTO);

/**
 * Elegir la portada del librito nuevo: cada estilo pintado en chiquito (la
 * portada de verdad) y, si eliges tu imagen, ya se ve puesta en cada uno.
 */
function selectorDePortada(formatoSel) {
  const portadas = PLANTILLAS.filter((t) => t.cat === "portadas").sort((a, b) => (ORDEN.indexOf(a.id) + 1 || 99) - (ORDEN.indexOf(b.id) + 1 || 99));
  let elegida = "portada-clasica", foto = null, url = null, vivas = [];
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
export function quitarInicio() { const c = document.querySelector(".ed-inicio"); c?._destruir?.(); c?.remove(); document.body.classList.remove("con-inicio"); }

// Cómo está cada librito frente a tu nube.
const ETQ = {
  igual: ["nubeOk", "En tu nube"], aqui: ["telefono", "Sólo en este aparato"], quitado: ["telefono", "Sólo en este aparato"],
  subir: ["nube", "Subiendo a tu nube pronto"], nube: ["nube", "Hay uno más nuevo en tu nube"], "los-dos": ["aviso", "Cambió en dos aparatos"],
};

export async function pantallaInicio(app, { cerrable = false, a = "", tipo: tipo0 = "pagina" } = {}) {
  quitarInicio();
  const lista = await listar().catch(() => []);
  const borradores = el("section.ed-inicio-borradores");
  const formato = el("select.ed-sel", {}, Object.entries(FORMATOS).map(([k, f]) => el("option", { value: k, text: f.auto ? f.n : `${f.n} · ${f.w}×${f.h}` })));
  formato.value = "movil";
  formato.setAttribute("aria-label", "Tamaño de la hoja");
  // Fase 46: el nombre es obligatorio y empieza vacío (nada de nombres puestos de antemano).
  const nombre = el("input.ed-txt", { type: "text", placeholder: "Ej. Para mi amor ♡", value: "", maxlength: "60", required: "", autocomplete: "off", "aria-label": "Nombre del detallito", "aria-required": "true" });
  // Enter en el nombre = Crear.
  nombre.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); capa.querySelector(".ed-crear-fila .ed-btn")?.click(); } });
  // «Mis libritos» (del menú principal) es sólo para tus borradores y sus copias de seguridad (Fase 33).
  const respaldo = a === "borradores";
  const portada = respaldo ? null : selectorDePortada(formato);
  const cerrar = () => { portada?.destruir(); capa.remove(); document.body.classList.remove("con-inicio"); };
  // — Crear detallito (Fase 46): 1 qué vas a crear · 2 su nombre · 3 su portada (o tu hoja) · 4 el tamaño —
  let tipo = tipo0 === "dibujito" ? "dibujito" : "pagina";
  const crear = respaldo ? null : (() => {
    const error = el("small.ed-nuevo-error", { role: "alert", hidden: "", text: "Ponle un nombre a tu detallito para crearlo." });
    const paso = (n, titulo, hijos, clase = "") => el("div.ed-paso" + clase, {}, [el("h2.ed-paso-t", {}, [el("i.ed-paso-n", { text: String(n) }), el("span", { text: titulo })]), ...hijos]);
    const tipos = el("div.ed-ques", { role: "radiogroup", "aria-label": "¿Qué vas a crear?" }, [
      ["pagina", "pagina", "Detallito de página", "Páginas con fotos, textos, música y animaciones."],
      ["dibujito", "dibujo", "Dibujito", "Una hoja en blanco para dibujarle algo con tus manos."],
    ].map(([k, ic, t, d]) => el("button.ed-que" + (k === tipo ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(k === tipo), dataset: { k } }, [
      el("i.ed-que-ico", { html: ico(ic) }), el("b", { text: t }), el("small", { text: d }),
    ])));
    const pasoPortada = paso(3, "Su portada", [el("small.ed-paso-d", { text: "Elige un estilo (o pon tu propia imagen). Después puedes cambiar todo." }), ...portada.nodos], ".ed-paso-portada");
    // Fase 47: el dibujito tiene su propio estudio (pinceles, regla, stickers y texto) y le llega como dibujo.
    const guardado = app.dibujoGuardado?.();
    const pasoHoja = paso(3, "Tu hojita", [
      el("small.ed-paso-d", { text: "Una hojita para dibujarle con tus manos: pinceles, regla, stickers y texto. Le llega a sus Detallitos como dibujo y lo ve dibujarse solito." }),
      guardado ? el("div.ed-dibujo-sigue", {}, [
        guardado.mini ? el("img", { src: guardado.mini, alt: "", draggable: "false" }) : el("i", { html: ico("dibujo") }),
        el("span", {}, [el("b", { text: `«${guardado.nombre}» sin mandar` }), el("small", { text: "Lo dejaste a medias: síguelo donde te quedaste." })]),
        boton(I("lapiz", "Seguirlo"), () => { cerrar(); app.dibujar({ seguir: true }); }, "chico"),
      ]) : null,
    ], ".ed-paso-hoja");
    pasoHoja.hidden = tipo === "pagina";
    pasoPortada.hidden = tipo !== "pagina";
    const pasoTam = paso(4, "Tamaño de la hoja", [el("label.ed-nuevo-campo", {}, [el("span", { text: "Tamaño" }), formato])]);
    pasoTam.hidden = tipo !== "pagina";
    const crearB = boton(I("nuevo", "Crear detallito"), (ev) => {
      const b = ev?.currentTarget;
      if (b?.disabled || capa._creando) return;
      const n = nombre.value.trim();
      if (!n) {
        error.hidden = false; nombre.classList.add("mal"); nombre.focus();
        nombre.animate?.([{ translate: "0" }, { translate: "-6px" }, { translate: "6px" }, { translate: "-3px" }, { translate: "0" }], { duration: 320 });
        return;
      }
      if (tipo === "dibujito") {
        const empezar = () => { cerrar(); app.dibujar({ nombre: n }); };
        if (!guardado) { capa._creando = true; empezar(); return; }
        confirmar(`Tienes «${guardado.nombre}» sin mandar. ¿Empezar uno nuevo? (Ése se borra)`, "Empezar nuevo").then((si) => { if (si) empezar(); });
        return;
      }
      capa._creando = true;
      if (b) b.disabled = true;
      const v = portada.valor(); cerrar(); app.nuevo(n, formato.value, { ...v, tipo });
    }, "primario");
    const pintarListo = () => { const hay = !!nombre.value.trim(); crearB.setAttribute("aria-disabled", String(!hay)); if (hay) { error.hidden = true; nombre.classList.remove("mal"); } };
    nombre.addEventListener("input", pintarListo);
    tipos.addEventListener("click", (e) => {
      const b = e.target.closest(".ed-que");
      if (!b) return;
      tipo = b.dataset.k;
      for (const x of tipos.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); }
      pasoPortada.hidden = tipo !== "pagina"; pasoHoja.hidden = tipo === "pagina"; pasoTam.hidden = tipo !== "pagina";
      crearB.innerHTML = tipo === "dibujito" ? I("dibujo", "A dibujar") : I("nuevo", "Crear detallito");
      app.sonidos?.sonar("seleccionar");
    });
    pintarListo();
    if (tipo === "dibujito") crearB.innerHTML = I("dibujo", "A dibujar");
    return el("section.ed-inicio-nuevo.ed-crear", {}, [
      el("div.ed-tarjeta.ed-tarjeta-nuevo", {}, [
        paso(1, "¿Qué vas a crear?", [tipos]),
        paso(2, "¿Cómo se llama?", [el("label.ed-nuevo-campo", {}, [el("span", { text: "Nombre del detallito" }), nombre]), error]),
        pasoPortada, pasoHoja,
        pasoTam,
        // «Crear» siempre a la mano (en el teléfono se queda abajo) y un solo toque: nunca crea dos.
        el("div.ed-crear-fila", {}, [crearB]),
      ]),
      el("div.ed-crear-otro", {}, [
        el("small", { text: "¿Ya tienes uno que exportaste antes?" }),
        boton(I("subir", "Abrir archivo (.zip)"), () => { cerrar(); app.abrirArchivo(); }, "chico"),
      ]),
    ]);
  })();
  const capa = el("div.ed-inicio" + (respaldo ? ".respaldo" : ""), { role: "dialog", "aria-label": respaldo ? "Mis libritos" : "Crear detallito" }, [
    el("div.ed-inicio-caja", {}, [
      el("header", {}, [
        respaldo
          ? el("div", {}, [el("h1", { text: "Mis libritos" }), el("p", { text: "Tus borradores y sus copias de seguridad: guarda todo en un archivo o tráelo de vuelta." })])
          : el("div", {}, [el("h1", { text: "Crear detallito" }), el("p", { text: "Elige qué vas a hacer, ponle nombre y listo: lo demás lo decides en el editor." })]),
        cerrable ? el("button.ed-x", { type: "button", html: ico("cerrar"), "aria-label": "Cerrar", onClick: () => cerrar() }) : null,
      ]),
      respaldo ? el("section.ed-inicio-nuevo", {}, [
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("subir", "Importar copia de seguridad") }),
          el("small", { text: "Trae de vuelta tus borradores desde un .zip de copia de seguridad (la de todos tus datos o la de un solo librito)." }),
          boton("Elegir archivo", () => { cerrar(); app.importarCopia(); }),
        ]),
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("escudo", "Hacer copia de seguridad de mis datos") }),
          el("small", { text: "Un .zip con todos tus borradores de este aparato, con sus fotos, sonidos, videos y dibujos, para guardarlo donde quieras." }),
          boton("Descargar copia", () => app.copiaDeTodo(), "primario"),
        ]),
      ]) : crear,
      respaldo ? borradores : null,
    ]),
  ]);
  capa._destruir = portada?.destruir;
  document.body.append(capa);
  // (Mientras esto está abierto, la abejita no llega ni se queda: Fase 46.)
  document.body.classList.add("con-inicio");
  if (!respaldo) return capa;   // «Crear detallito» ya no lleva la lista de borradores

  const otraVez = () => pantallaInicio(app, { cerrable: cerrable && !!app.estado.proyecto, a });
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
      const txt = `${paginas(p.nPaginas ?? p.orden?.length ?? 0)} · ${hace(p.editado)}`;
      return el("li", { dataset: { id: p.id, k: [p.id, p.nombre, txt, c, !!fila].join("|") } }, [
        el("button.ed-borrador", { type: "button", onClick: abrirlo }, [
          el("b", { text: p.nombre }),
          el("small", { text: txt }),
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
    for (const l of soloNube) items.push(el("li", { dataset: { id: "n:" + l.clave, k: ["n", l.clave, l.nombre, l.paginas, l.editado, l.aparato].join("|") } }, [
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
    // Se cambia sólo lo que cambió: las filas iguales se quedan (nada parpadea al llegar tu nube)
    // y la caja crece suave; las que llegan nuevas aparecen con un fundido.
    const antes = new Map([...borradores.querySelectorAll("li[data-k]")].map((li) => [li.dataset.k, li]));
    const idsAntes = new Set([...antes.values()].map((li) => li.dataset.id));
    const filas = items.map((li) => antes.get(li.dataset.k) || li);
    const llegan = borradores._pintado ? filas.filter((li) => !idsAntes.has(li.dataset.id)) : [];
    const h2t = items.length ? (respaldo ? "Borradores y copias" : "Tus borradores") : "Todavía no hay borradores";
    ajustar(borradores, () => {
      let h2 = borradores.querySelector(":scope > h2");
      if (!h2) h2 = el("h2");
      if (h2.textContent !== h2t) h2.textContent = h2t;
      let cuerpo = borradores.querySelector(":scope > ul.ed-borradores");
      if (items.length) {
        cuerpo ||= el("ul.ed-borradores");
        const ya = [...cuerpo.children];
        if (ya.length !== filas.length || ya.some((n, i) => n !== filas[i])) cuerpo.replaceChildren(...filas);
      } else cuerpo = el("p.ed-vacio-txt", { text: conectado ? "Empieza uno nuevo: se guarda aquí y en tu nube mientras editas." : "Lo que hagas se guarda solo mientras editas." });
      const notaVieja = borradores._nota;
      const mismaNota = notaVieja && nota && notaVieja.textContent === nota.textContent && notaVieja.className === nota.className;
      const n = mismaNota ? notaVieja : nota;
      borradores._nota = n;
      const quiero = [h2, cuerpo, n].filter(Boolean);
      const hay = [...borradores.children];
      if (hay.length !== quiero.length || hay.some((x, i) => x !== quiero[i])) borradores.replaceChildren(...quiero);
    }, llegan);
    borradores._pintado = true;
  };
  const cargarNube = () => {
    pintar(null);
    if (!SRV.conectado()) return;
    NUBE.listaNube(true).then((d) => { if (capa.isConnected) pintar(d); }).catch((e) => { if (capa.isConnected) pintar(null, e.message); });
  };
  cargarNube();
  // «Mis libritos» (del menú principal): directo a tus borradores.
  // (Ahora es su propia sección: ya no hace falta bajar hasta ellos.)
  // Entraste o saliste de tu cuenta con esto abierto: la lista se pone al día.
  const alCuenta = () => { if (capa.isConnected) cargarNube(); else removeEventListener("ed-cuenta", alCuenta); };
  addEventListener("ed-cuenta", alCuenta);
  return capa;
}
