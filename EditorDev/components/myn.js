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
export async function zipParaVer(app, { titulo, slug, alProgreso, actualizar = false, soloPaginas = null, conProyecto = false, compartir = null }) {
  if (app.auto?.pendiente) await app.auto.ahora();
  const { exportar } = await import("../export/exportar.js");
  const P = app.estado.proyecto;
  const paginas = conProyecto ? soloPaginas?.length || P.orden.length : P.orden.length;
  const ficha = { titulo, slug, paginas, fecha: new Date().toISOString(), ...(actualizar ? { actualizar: true } : {}) };
  const { blob } = await exportar(app, { alProgreso, publicar: true, soloPaginas, conProyecto, ficha, compartir, nube: (ids) => NUBE.asegurarArchivos(P, ids, alProgreso) });
  return { blob, paginas };
}

/** Un circulito de estado: ok · mal · espera · nada. */
export const pastilla = (tipo, texto) => el(`div.ed-pub-pill.${tipo}`, {}, [el("i"), el("span", { text: texto })]);

/**
 * Publicar en M.YNTHN: nombre, botón, barrita de avance y resultado.
 * `reemplazar` (slug) actualiza una que ya estaba.
 */
/**
 * La tarjeta para compartir (Fase 41): 1200×630, con la portada, el título y la descripción. Es la que
 * sale al mandar el enlace por WhatsApp, Instagram o Messenger.
 */
export async function tarjetaCompartir(app, titulo, descripcion) {
  const P = app.estado.proyecto, t = P.ajustes.tema || {}, acento = t.acento || "#d8397a";
  const cv = document.createElement("canvas");
  cv.width = 1200; cv.height = 630;
  const c = cv.getContext("2d");
  const g = c.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, "#fff0f6"); g.addColorStop(0.55, "#fff7f1"); g.addColorStop(1, "#efe6ff");
  c.fillStyle = g; c.fillRect(0, 0, 1200, 630);
  const corazon = (x, y, r, a) => { c.save(); c.globalAlpha = a; c.fillStyle = acento; c.translate(x, y); c.beginPath(); c.moveTo(0, r * 0.35); c.bezierCurveTo(-r * 1.1, -r * 0.35, -r * 0.55, -r * 1.15, 0, -r * 0.5); c.bezierCurveTo(r * 0.55, -r * 1.15, r * 1.1, -r * 0.35, 0, r * 0.35); c.fill(); c.restore(); };
  for (let i = 0; i < 16; i++) corazon(60 + ((i * 397) % 1100), 40 + ((i * 211) % 560), 10 + (i % 4) * 7, 0.08 + (i % 3) * 0.03);
  // La portada, como una tarjetita.
  try {
    const { dibujarPortadita } = await import("./portadita.js");
    const pag = P.paginas[P.ajustes.portada] || P.paginas[P.orden[0]];
    const b = pag && (await dibujarPortadita(app, pag, 300));
    if (b) {
      const im = await createImageBitmap(b);
      const h = Math.min(520, (im.height * 300) / im.width), w = (im.width * h) / im.height, x = 90, y = (630 - h) / 2;
      c.save(); c.shadowColor = "rgba(120,40,90,.28)"; c.shadowBlur = 40; c.shadowOffsetY = 14;
      c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 26) : c.rect(x, y, w, h); c.fillStyle = "#fff"; c.fill(); c.restore();
      c.save(); c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 26) : c.rect(x, y, w, h); c.clip(); c.drawImage(im, x, y, w, h); c.restore();
    }
  } catch (e) { /* sin portada: sólo el texto */ }
  const renglones = (txt, ancho, max) => {
    const r = []; let l = "";
    for (const p of String(txt || "").split(/\s+/)) { const k = l ? l + " " + p : p; if (c.measureText(k).width > ancho && l) { r.push(l); l = p; } else l = k; }
    if (l) r.push(l);
    if (r.length > max) { r.length = max; r[max - 1] = r[max - 1].replace(/\s*\S*$/, "") + "…"; }
    return r;
  };
  c.fillStyle = "#3a2440"; c.font = "bold 62px Georgia, 'Times New Roman', serif";
  let y = 190;
  for (const l of renglones(titulo, 640, 3)) { c.fillText(l, 470, y); y += 72; }
  c.fillStyle = "#6a5468"; c.font = "30px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  y += 10;
  for (const l of renglones(descripcion, 640, 3)) { c.fillText(l, 470, y); y += 42; }
  c.fillStyle = acento; c.font = "bold 28px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  c.fillText("My Love Pages ♥", 470, 560);
  return new Promise((ok) => cv.toBlob(ok, "image/png"));
}

let _qr = null;
/** El QR del enlace (la biblioteca se carga sólo cuando hace falta). */
async function qrDe(texto) {
  if (!_qr) _qr = new Promise((ok, mal) => {
    if (window.qrcode) return ok(window.qrcode);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
    s.async = true; s.onload = () => (window.qrcode ? ok(window.qrcode) : mal(new Error("sin QR"))); s.onerror = () => { _qr = null; mal(new Error("sin QR")); };
    document.head.append(s);
  });
  const q = (await _qr)(0, "M");
  q.addData(texto); q.make();
  return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
}

export function bloquePublicar(app, { alPublicar, alOtro } = {}) {
  const P = app.estado.proyecto;
  // (Fase 46: después de publicar, la edición queda en blanco: sin proyecto, se dice y se ofrece uno nuevo.)
  if (!P) return el("div.ed-pub.ed-pub-vacio", {}, [el("p", { text: "Ya no hay un detallito abierto: el que publicaste quedó guardado en tu página. Crea otro para publicarlo." }),
    el("button.ed-btn.primario", { type: "button", html: `${ico("nuevo")}<span>Crear otro detallito</span>`, onClick: () => { alOtro?.(); app.inicio?.(); } })]);
  const E = app.estado;
  const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60, "aria-label": "Título de la página" });
  // Fase 41: tu enlace propio (…/publicaciones/<enlace>/), con su comprobación al momento.
  const enlace = el("input.ed-pub-enlace", { type: "text", value: SRV.nombreLimpio(P.nombre), maxlength: 40, autocapitalize: "none", spellcheck: "false", "aria-label": "Tu enlace" });
  let aMano = !!P.ajustes.compartir?.enlace;
  if (aMano) enlace.value = P.ajustes.compartir.enlace;
  const prefijo = el("span.ed-pub-prefijo", { text: `…/${SRV.CARPETA}/` });
  const estado = el("small.ed-pub-estado");
  const desc = el("textarea.ed-pub-desc", { rows: 2, maxlength: 160, placeholder: "Una frase para cuando lo compartan (sale debajo del título)", "aria-label": "Descripción para compartir" });
  desc.value = P.ajustes.compartir?.descripcion || "";
  const previa = el("div.ed-pub-tarjeta", { hidden: "" }, [el("img", { alt: "Así se ve al compartirlo" }), el("div", {}, [el("b"), el("small")])]);
  let sitio = "", libre = null, tPrevia = 0, tLibre = 0;
  const slug = () => SRV.nombreLimpio(enlace.value || titulo.value);
  const revisar = () => {
    clearTimeout(tLibre);
    const s = slug();
    estado.className = "ed-pub-estado"; estado.textContent = "Revisando…"; libre = null;
    tLibre = setTimeout(async () => {
      if (!SRV.conectado()) { estado.textContent = `Entra a tu ${SRV.NOMBRE} para elegir tu enlace.`; return; }
      try {
        const r = await SRV.enlaceLibre(s);
        if (r.slug !== slug()) return;
        sitio = r.sitio || sitio;
        prefijo.textContent = sitio ? `${sitio.replace(/^https?:\/\//, "")}${r.carpeta || SRV.CARPETA}/` : `…/${SRV.CARPETA}/`;
        libre = r.libre;
        estado.replaceChildren();
        if (r.libre) { estado.className = "ed-pub-estado ok"; estado.textContent = "✓ Libre: es tuyo"; }
        else {
          estado.className = "ed-pub-estado mal";
          estado.append(`Ya es de otra página. `, el("button.ed-btn.chico", { type: "button", text: `Usar «${r.sugerido}»`, onClick: () => { enlace.value = r.sugerido; aMano = true; revisar(); } }));
        }
      } catch (e) { estado.textContent = e.message; }
    }, 380);
  };
  titulo.addEventListener("input", () => { if (!aMano) enlace.value = SRV.nombreLimpio(titulo.value); revisar(); pintarPrevia(); });
  enlace.addEventListener("input", () => { aMano = true; revisar(); });
  enlace.addEventListener("change", () => { enlace.value = slug(); });
  desc.addEventListener("input", () => pintarPrevia());
  const pintarPrevia = () => {
    clearTimeout(tPrevia);
    tPrevia = setTimeout(async () => {
      const b = await tarjetaCompartir(app, titulo.value.trim() || P.nombre, desc.value.trim()).catch(() => null);
      if (!b) return;
      const img = previa.querySelector("img");
      if (img.src) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(b);
      previa.querySelector("b").textContent = titulo.value.trim() || P.nombre;
      previa.querySelector("small").textContent = desc.value.trim() || "My Love Pages";
      previa.hidden = false;
    }, 500);
  };
  revisar();
  pintarPrevia();
  const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span"), el("b.ed-srv-barra", {}, [el("i")])]);
  const resultado = el("div.ed-pub-listo", { hidden: "" });
  const poner = (t, p) => { prog.children[1].textContent = t || ""; const b = prog.children[2]; b.hidden = p == null; if (p != null) b.firstChild.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + "%"; };

  const publicar = async (reemplazar = "", tituloForzado = "") => {
    if (tituloForzado) { titulo.value = tituloForzado; if (!aMano) enlace.value = SRV.nombreLimpio(tituloForzado); }
    const nombre = titulo.value.trim() || P.nombre;
    const s = slug();
    if (!reemplazar && aMano && libre === false) { aviso("Ese enlace ya es de otra página: elige otro (o toca el sugerido).", 3600, "error"); return; }
    btn.disabled = true; prog.hidden = false; resultado.hidden = true;
    try {
      // Se recuerda en el librito: la próxima vez sale igual.
      E.setProy({ "ajustes.compartir": { ...(P.ajustes.compartir || {}), descripcion: desc.value.trim(), ...(aMano ? { enlace: s } : {}) } }, "Cómo se comparte");
      poner("Preparando tu página…");
      const url = sitio ? `${sitio}${SRV.CARPETA}/${s}/` : "";
      const imagen = await tarjetaCompartir(app, nombre, desc.value.trim()).catch(() => null);
      const v = await zipParaVer(app, { titulo: nombre, slug: s, alProgreso: (t, p) => poner(t, p), actualizar: !!reemplazar, compartir: { descripcion: desc.value.trim(), imagen, url } });
      const r = await SRV.publicar(v.blob, { titulo: nombre, nombre: s, paginas: v.paginas, reemplazar, exacto: aMano && !reemplazar }, poner);
      app.sonidos?.sonar("publicar");
      if (app.ayuda?.abeja?.viva) app.ayuda.abeja.reaccionar("publicar");
      const L = app.lienzo;
      if (L) app.fx?.colocar?.({ x: L.v.px, y: L.v.py, w: L.W * L.v.z, h: L.H * L.v.z });
      const link = r.enlace || r.local;
      const qr = el("div.ed-pub-qr", { "aria-label": "Código QR del enlace" });
      qrDe(link).then((svg) => { qr.innerHTML = svg; }).catch(() => qr.remove());
      const pag = el("select.ed-pub-pag", { "aria-label": "Enlace a una página" }, P.orden.map((pid, i) => el("option", { value: String(i + 1), text: `${i + 1}. ${P.paginas[pid]?.nombre || "Página"}` })));
      resultado.textContent = "";
      resultado.append(
        el("b", { html: `${ico("ok")} ¡Publicada en ${SRV.NOMBRE}!` }),
        el("a", { href: link, target: "_blank", rel: "noopener", text: link }),
        el("small", { text: r.github === false ? `Quedó guardada en ${SRV.NOMBRE}; se sube a GitHub en cuanto se conecte.` : `En un minutito ya se puede abrir.${r.slug && r.slug !== s && !reemplazar ? ` (Ese nombre ya existía: quedó como «${r.slug}».)` : ""}` }),
        el("div.ed-pub-acciones", {}, [
          el("button.ed-btn.primario", { type: "button", html: I("pantalla", "Ver a pantalla completa"), onClick: () => abrir(link) }),
          el("button.ed-btn", { type: "button", html: I("copiar", "Copiar enlace"), onClick: () => copiar(link) }),
          el("button.ed-btn", { type: "button", html: I("compartir", "Compartir"), onClick: () => compartir(link, nombre) }),
        ]),
        el("div.ed-pub-extra", {}, [qr, el("div", {}, [
          el("b", { text: "Enlace a una página" }),
          el("small", { text: "Abre el librito directo en esa página." }),
          el("div.ed-pub-fila", {}, [pag, el("button.ed-btn.chico", { type: "button", html: I("copiar", "Copiar"), onClick: () => copiar(`${link}#${pag.value}`) })]),
        ])]),
      );
      resultado.hidden = false;
      alPublicar?.(r);
      // Fase 46: ya se publicó: la edición se limpia para empezar de cero (el enlace de arriba sigue sirviendo).
      await app.limpiarTrasPublicar?.();
      publicado = true;
      btn.innerHTML = I("nuevo", "Crear otro detallito");
      resultado.append(el("small.ed-pub-limpio", { text: "Tu edición quedó en blanco para que empieces otro detallito." }));
    } catch (e) {
      app.sonidos?.sonar("error");
      aviso(e.message || "No se pudo publicar", 5000, "error");
      if (e.status === 409) revisar();
    } finally { btn.disabled = false; prog.hidden = true; }
  };
  let publicado = false;
  const btn = el("button.ed-btn.primario.ed-pub-btn", { type: "button", html: I("publicar", `Publicar en ${SRV.NOMBRE}`), onClick: () => {
    if (publicado || !app.estado.proyecto) { alOtro?.(); app.inicio?.(); return; }
    publicar();
  } });
  const caja = el("div.ed-myn-pub", {}, [
    el("label.ed-fila", {}, [el("span.ed-et", { text: "Título" }), titulo]),
    el("label.ed-fila.ed-pub-enlace-fila", {}, [el("span.ed-et", { text: "Tu enlace" }), el("div.ed-pub-url", {}, [prefijo, enlace])]),
    estado,
    el("label.ed-fila", {}, [el("span.ed-et", { text: "Para compartir" }), desc]),
    previa,
    btn, prog, resultado,
  ]);
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
