/**
 * M.YNTHN EN EL EDITOR — lo que comparten Páginas publicadas, Exportar y
 * Detallitos: publicar (con su avance y su resultado), guardar una copia del
 * proyecto en el servidor y abrir una copia como borrador nuevo.
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as NUBE from "../integraciones/nube.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
export const fecha = (iso) => { try { return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
export const peso = (b) => { b = +b || 0; const u = ["B", "KB", "MB", "GB"]; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return (i ? b.toFixed(b < 10 ? 1 : 0) : b) + " " + u[i]; };
export async function copiar(t) { try { await navigator.clipboard.writeText(t); aviso("Copiado"); } catch (e) { prompt("Cópialo:", t); } }
export function compartir(t, titulo) { if (navigator.share) navigator.share({ title: titulo, url: t }).catch(() => {}); else copiar(t); }
export const abrir = (u) => open(u, "_blank", "noopener");

/**
 * El librito (o sólo algunas páginas) en un .zip para VER, con su ficha.
 * Las fotos, la música y los videos suben antes a tu nube (sólo los que
 * falten) y el .zip lleva nada más su huella: M.YNTHN los pone él mismo. Así
 * lo que cruza el túnel es chiquito, aunque el librito pese cientos de MB.
 */
export async function zipParaVer(app, { titulo, slug, alProgreso, actualizar = false, soloPaginas = null, conProyecto = false }) {
  if (app.auto?.pendiente) await app.auto.ahora();
  const { exportar } = await import("../export/exportar.js");
  const P = app.estado.proyecto;
  const paginas = conProyecto ? soloPaginas?.length || P.orden.length : P.orden.length;
  const ficha = { titulo, slug, paginas, fecha: new Date().toISOString(), ...(actualizar ? { actualizar: true } : {}) };
  const { blob } = await exportar(app, { alProgreso, publicar: true, soloPaginas, conProyecto, ficha, nube: (ids) => NUBE.asegurarArchivos(P, ids, alProgreso) });
  return { blob, paginas };
}

/** Un circulito de estado: ok · mal · espera · nada. */
export const pastilla = (tipo, texto) => el(`div.ed-pub-pill.${tipo}`, {}, [el("i"), el("span", { text: texto })]);

/**
 * Publicar en M.YNTHN: nombre, botón, barrita de avance y resultado.
 * `reemplazar` (slug) actualiza una que ya estaba.
 */
export function bloquePublicar(app, { alPublicar } = {}) {
  const P = app.estado.proyecto;
  const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60, "aria-label": "Nombre de la página" });
  const ruta = el("small.ed-pub-ruta");
  let sitio = "";
  const ponerRuta = () => { const sl = SRV.nombreLimpio(titulo.value); ruta.textContent = sitio ? `${sitio}${SRV.CARPETA}/${sl}/  ·  si ya existe ese nombre, se usa ${sl}-2` : `Se guarda en ${SRV.CARPETA}/${sl}/`; };
  titulo.addEventListener("input", ponerRuta);
  ponerRuta();
  SRV.info().then((i) => { sitio = i.sitio || ""; ponerRuta(); }).catch(() => {});
  const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span"), el("b.ed-srv-barra", {}, [el("i")])]);
  const resultado = el("div.ed-pub-listo", { hidden: "" });
  const poner = (t, p) => { prog.children[1].textContent = t || ""; const b = prog.children[2]; b.hidden = p == null; if (p != null) b.firstChild.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + "%"; };

  const publicar = async (reemplazar = "", tituloForzado = "") => {
    if (tituloForzado) { titulo.value = tituloForzado; ponerRuta(); }
    const nombre = titulo.value.trim() || P.nombre;
    const slug = SRV.nombreLimpio(titulo.value);
    btn.disabled = true; prog.hidden = false; resultado.hidden = true;
    try {
      poner("Preparando tu página…");
      const v = await zipParaVer(app, { titulo: nombre, slug, alProgreso: (t, p) => poner(t, p), actualizar: !!reemplazar });
      const r = await SRV.publicar(v.blob, { titulo: nombre, nombre: slug, paginas: v.paginas, reemplazar }, poner);
      app.sonidos?.sonar("publicar");
      const L = app.lienzo;
      if (L) app.fx?.colocar?.({ x: L.v.px, y: L.v.py, w: L.W * L.v.z, h: L.H * L.v.z });
      const link = r.enlace || r.local;
      resultado.textContent = "";
      resultado.append(
        el("b", { html: `${ico("ok")} ¡Publicada en ${SRV.NOMBRE}!` }),
        el("a", { href: link, target: "_blank", rel: "noopener", text: link }),
        el("small", { text: r.github === false ? `Quedó guardada en ${SRV.NOMBRE}; se sube a GitHub en cuanto se conecte.` : `En un minutito ya se puede abrir.${r.slug && r.slug !== slug && !reemplazar ? ` Ese nombre ya existía: quedó como «${r.slug}».` : ""}` }),
        el("div.ed-pub-acciones", {}, [
          el("button.ed-btn.primario", { type: "button", html: I("pantalla", "Ver a pantalla completa"), onClick: () => abrir(link) }),
          el("button.ed-btn", { type: "button", html: I("copiar", "Copiar enlace"), onClick: () => copiar(link) }),
          el("button.ed-btn", { type: "button", html: I("compartir", "Compartir"), onClick: () => compartir(link, nombre) }),
        ]),
      );
      resultado.hidden = false;
      alPublicar?.(r);
    } catch (e) {
      app.sonidos?.sonar("error");
      aviso(e.message || "No se pudo publicar", 5000, "error");
    } finally { btn.disabled = false; prog.hidden = true; }
  };
  const btn = el("button.ed-btn.primario.ed-pub-btn", { type: "button", html: I("publicar", `Publicar en ${SRV.NOMBRE}`), onClick: () => publicar() });
  const caja = el("div.ed-myn-pub", {}, [el("label.ed-fila", {}, [el("span.ed-et", { text: "Nombre" }), titulo]), ruta, btn, prog, resultado]);
  caja.publicar = publicar;
  return caja;
}

/** Sube el librito a tu nube y deja ahí una copia (una instantánea: no duplica fotos ni videos). */
export async function copiaEnNube(app, { alAvance, silencioso = false } = {}) {
  if (!SRV.conectado() || !app.estado.proyecto) return null;
  const r = await NUBE.guardarCopia({ alAvance: (t, p) => alAvance?.(p != null && p < 1 ? `${t} · ${Math.round(p * 100)} %` : t, p) });
  if (r && !silencioso) aviso(`Copia guardada en tu nube (${r.copias} ${r.copias === 1 ? "copia" : "copias"} de este librito)`, 3600);
  return r;
}

/** Abre una copia de M.YNTHN (o un paquete) como borrador nuevo. */
export async function abrirComoBorrador(app, blob, nombre) {
  const { abrirArchivo } = await import("../export/abrir.js");
  if (app.auto?.pendiente) await app.auto.ahora();
  const P = await abrirArchivo(new File([blob], SRV.nombreLimpio(nombre) + ".zip", { type: "application/zip" }));
  await app.abrirProyecto(P, true);
  // Se abre para editarlo: el menú principal (si estaba encima) se quita.
  app.menuPrincipal?.cerrar();
  aviso(`«${P.nombre}» abierto como borrador nuevo`);
  return P;
}

/** La lista de «Mis páginas publicadas» (ver, copiar, compartir, actualizar, subir, quitar). */
export function listaPublicaciones(app, { alActualizar } = {}) {
  const lista = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando tus páginas…" })]);
  const cargar = () => SRV.publicaciones().then((l) => {
    lista.textContent = "";
    if (!l.length) { lista.append(el("small.ed-nota.suave", { text: "Todavía no publicaste ninguna. La primera aparece aquí." })); return; }
    const mini = (icono, titulo, al) => el("button.ed-btn", { type: "button", html: ico(icono), title: titulo, "aria-label": titulo, onClick: al });
    for (const p of l) {
      const link = p.enlace || SRV.enlace(p.local);
      lista.append(el("div.ed-pub-item", {}, [
        el("i", { html: ico("libro") }),
        el("div", {}, [el("b", { text: p.titulo || p.slug }), el("small", { text: `${fecha(p.actualizado)} · ${p.paginas || "?"} ${p.paginas === 1 ? "página" : "páginas"} · ${{ publicada: "en línea", local: `sólo en ${SRV.NOMBRE}`, subiendo: "subiendo…", preparando: "preparando…", quitando: "quitando…", error: "error: " + (p.error || "") }[p.estado] || p.estado}` })]),
        el("div.ed-pub-mini", {}, [
          mini("pantalla", "Ver a pantalla completa", () => abrir(link)),
          mini("copiar", "Copiar enlace", () => copiar(link)),
          mini("compartir", "Compartir", () => compartir(link, p.titulo)),
          mini("refrescar", "Actualizar con el librito abierto", async () => {
            if (!(await confirmar(`¿Reemplazar «${p.titulo}» con el librito que tienes abierto? El enlace sigue siendo el mismo.`, "Actualizar"))) return;
            alActualizar?.(p);
          }),
          p.estado === "local" || p.estado === "error" ? mini("subir", "Subir a GitHub", async () => {
            try { const r = await SRV.subirOtraVez(p.slug); aviso("Subiéndola…"); await SRV.esperar(r.trabajo); aviso("¡Ya está en línea!"); cargar(); } catch (e) { aviso(e.message, 4200, "error"); }
          }) : null,
          mini("borrar", "Quitar de internet", async () => {
            if (!(await confirmar(`¿Quitar «${p.titulo}» de internet? El enlace dejará de funcionar (tu librito en el editor no se toca).`, "Quitar"))) return;
            try { const r = await SRV.quitar(p.slug); aviso("Quitándola…"); await SRV.esperar(r.trabajo); app.sonidos?.sonar("borrar"); aviso("Quitada de internet"); cargar(); }
            catch (e) { aviso(e.message, 4200, "error"); }
          }),
        ].filter(Boolean)),
      ]));
    }
  }).catch((e) => { lista.textContent = ""; lista.append(el("small.ed-nota.suave", { text: e.message })); });
  lista.cargar = cargar;
  cargar();
  return lista;
}

/**
 * «Copias de mis proyectos»: una carpeta por librito con sus copias de tu nube
 * (la más nueva arriba) y, si hay, las copias de antes (.zip).
 */
export function listaCopias(app) {
  const lista = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando tus copias…" })]);
  const uso = el("small.ed-pub-estado");
  const hora = (t) => new Date(t).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const cargar = () => Promise.all([SRV.nubeCopias(), SRV.proyectos().catch(() => ({ proyectos: [] }))]).then(([nueva, vieja]) => {
    lista.textContent = "";
    uso.textContent = nueva.cuota ? `Usas ${peso(nueva.uso)} de ${peso(nueva.cuota)} en ${SRV.NOMBRE}.` : "";
    const grupos = new Map();
    const grupo = (k) => { if (!grupos.has(k)) grupos.set(k, []); return grupos.get(k); };
    for (const c of nueva.copias || []) grupo(c.clave).push({ ...c, bytes: c.tam, nube: true });
    for (const p of vieja.proyectos || []) grupo("zip:" + p.clave).push({ ...p, nube: false });
    if (!grupos.size) { lista.append(el("small.ed-nota.suave", { text: "Todavía no hay copias. Cada vez que guardas a mano (Guardar o Ctrl+S) se hace una aquí." })); return; }
    for (const copias of grupos.values()) {
      const p = copias[0];
      const ver = el("details.ed-myn-copias", {}, [
        el("summary", {}, [el("i", { html: ico("carpeta") }), el("span", {}, [el("b", { text: p.nombre + (p.nube ? "" : " · copias de antes") }), el("small", { text: `${copias.length} ${copias.length === 1 ? "copia" : "copias"} · la última ${fecha(p.creado)} · ${p.paginas || "?"} pág.` })])]),
        el("div.ed-pub-lista", {}, copias.map((cp, i) => el("div.ed-pub-item", {}, [
          el("i", { html: ico(i === 0 ? "estrella" : "guardar") }),
          el("div", {}, [el("b", { text: i === 0 ? "La más nueva" : `Copia ${copias.length - i}` }), el("small", { text: `${hora(cp.creado)} · ${peso(cp.bytes)}${cp.nube ? "" : " · .zip"}` })]),
          el("div.ed-pub-mini", {}, [
            el("button.ed-btn", { type: "button", html: ico("subir"), title: "Abrir como borrador nuevo", "aria-label": "Abrir como borrador nuevo", onClick: async (e) => {
              const b = e.currentTarget;
              b.disabled = true;
              try {
                aviso("Bajando la copia…");
                if (cp.nube) await NUBE.abrirCopia(cp.id, cp.nombre);
                else await abrirComoBorrador(app, await SRV.bajarProyecto(cp.id), cp.nombre);
              } catch (er) { aviso("No se pudo abrir: " + er.message, 4500, "error"); }
              finally { b.disabled = false; }
            } }),
            el("button.ed-btn", { type: "button", html: ico("borrar"), title: "Borrar esta copia", "aria-label": "Borrar esta copia", onClick: async () => {
              if (!(await confirmar(`¿Borrar esta copia de «${cp.nombre}»?`, "Borrar"))) return;
              try { await (cp.nube ? SRV.nubeBorrarCopia(cp.id) : SRV.borrarProyecto(cp.id)); cargar(); } catch (er) { aviso(er.message, 4200, "error"); }
            } }),
          ]),
        ]))),
      ]);
      lista.append(ver);
    }
  }).catch((e) => { lista.textContent = ""; lista.append(el("small.ed-nota.suave", { text: e.message })); });
  const caja = el("div", {}, [uso, lista]);
  caja.cargar = cargar;
  addEventListener("ed-nube", () => { if (caja.isConnected) cargar(); });
  cargar();
  return caja;
}
