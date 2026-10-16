/**
 * PÁGINAS PUBLICADAS — publicar el librito en tu GitHub Pages con su propio
 * enlace, actualizarlo y quitarlo, sin salir del editor.
 *
 * Lo publicado es SÓLO para ver: va sin project.json ni EditorData/ (nadie
 * puede abrirlo en el editor y llevárselo editable), con «noindex» para que no
 * salga en buscadores, y en una dirección que sólo conoce quien tenga el enlace.
 * La conexión con GitHub está en integraciones/github.js.
 *
 * Dos caminos (Fase 15):
 *   · Con token: un toque y se sube solo (y se puede quitar, y encender Pages).
 *   · Sin token: se descarga un .zip, se sube a la carpeta publicar/ desde la
 *     web de GitHub y la acción «Publicar páginas subidas» lo deja en
 *     publicadas/<nombre>/ (ver .github/workflows/publicar-subidas.yml).
 * Y una sección «GitHub Pages» que dice si está encendido (si no, todo da 404)
 * y, con token, lo enciende con la rama correcta.
 */
import { el, seccion, boton, aviso, confirmar } from "../ui.js";
import { ico } from "../iconos.js";
import * as GH from "../../integraciones/github.js";

const fecha = (iso) => { try { return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const REPO_BASE = "yonathanpartida8/MarissaMiAmor";
const CLAVE_SIN = "editordev:publicar-sin-token";

async function copiar(t) {
  try { await navigator.clipboard.writeText(t); aviso("Enlace copiado"); }
  catch (e) { prompt("Copia el enlace:", t); }
}
function compartir(t, titulo) {
  if (navigator.share) navigator.share({ title: titulo, url: t }).catch(() => {});
  else copiar(t);
}
const abrir = (u) => open(u, "_blank", "noopener");
const limpiarRepo = (s) => String(s || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
const repoValido = (r) => /^[\w.-]+\/[\w.-]+$/.test(r);
const rutaRama = (r) => String(r).split("/").map(encodeURIComponent).join("/");

function leerSin() { try { return JSON.parse(localStorage.getItem(CLAVE_SIN) || "{}"); } catch (e) { return {}; } }
function guardarSin(c) { try { localStorage.setItem(CLAVE_SIN, JSON.stringify({ ...leerSin(), ...c })); } catch (e) { /* nada */ } }

/** El librito en un .zip sólo para VER (sin project.json ni EditorData/), con su ficha. */
async function zipParaVer(app, { titulo, slug, alProgreso }) {
  await app.guardarYa?.();
  const { exportar } = await import("../../export/exportar.js");
  const { leerZip, Zip } = await import("../../export/zip.js");
  const { blob } = await exportar(app, { alProgreso });
  const zip = await leerZip(blob);
  const archivos = [];
  for (const [r, leer] of Object.entries(zip)) {
    if (r.endsWith("/") || r === "project.json" || r.startsWith("EditorData/")) continue;
    archivos.push({ ruta: r, datos: await leer() });
  }
  const paginas = app.estado.proyecto.orden.length;
  return { archivos, paginas, async comoZip() {
    const z = new Zip();
    for (const a of archivos) z.agregar(a.ruta, a.datos);
    z.agregar("publicar.json", JSON.stringify({ titulo, slug, paginas, fecha: new Date().toISOString() }, null, 1));
    return z.generar();
  } };
}

/** Un circulito de estado: ok · mal · espera · nada. */
const pastilla = (tipo, texto) => el(`div.ed-pub-pill.${tipo}`, {}, [el("i"), el("span", { text: texto })]);

export const PUBLICADAS = {
  _publicadas(c) {
    c.append(el("div.ed-pub-hero", {}, [
      el("i", { html: ico("publicar") }),
      el("div", {}, [
        el("b", { text: "Tus páginas, con su propio enlace" }),
        el("small", { text: "Se publican en tu GitHub Pages. Sólo las ve quien tenga el enlace: no salen en buscadores y van sin el archivo para editarlas." }),
      ]),
    ]));
    const cfg = GH.leerConfig();
    if (!cfg?.token) {
      const repo = GH.repoDeAqui() || leerSin().repo || REPO_BASE;
      this._pubPagesSinToken(c, repo);
      this._pubSinToken(c, { abierta: true });
      this._pubConectar(c);
    } else {
      this._pubPanel(c, cfg);
    }
  },

  _pubConectar(c) {
    const repo = el("input", { type: "text", value: GH.repoDeAqui() || leerSin().repo || REPO_BASE, placeholder: "usuario/repositorio", autocomplete: "off", spellcheck: "false" });
    const token = el("input", { type: "password", placeholder: "github_pat_…", autocomplete: "off", spellcheck: "false" });
    const rama = el("input", { type: "text", placeholder: "la de GitHub Pages (automático)", autocomplete: "off", spellcheck: "false" });
    const recordar = el("input", { type: "checkbox", checked: true });
    const estado = el("small.ed-pub-estado");
    const ir = boton(I("enlace", "Conectar con GitHub"), async () => {
      const c0 = { repo: limpiarRepo(repo.value), token: token.value.trim(), rama: rama.value.trim() };
      if (!repoValido(c0.repo)) { estado.textContent = "Escribe el repositorio como usuario/repositorio."; return; }
      if (c0.token.length < 20) { estado.textContent = "Pega tu token de GitHub."; return; }
      ir.disabled = true; estado.textContent = "Comprobando…";
      try {
        const info = await GH.conectar(c0);
        GH.guardarConfig({ ...c0, rama: info.rama, sitio: info.sitio }, recordar.checked);
        this.app.sonidos?.sonar("exito");
        aviso(info.pages?.activo === false ? "Conectado. Falta encender GitHub Pages (abajo)" : "Conectado con GitHub", 3600);
        this.rehacer();
      } catch (e) { estado.textContent = e.message; this.app.sonidos?.sonar("error"); ir.disabled = false; }
    }, "primario ed-pub-btn");
    c.append(seccion("Publicar con token (automático)", [
      el("small.ed-nota.suave", { text: "Con un token, publicar, actualizar y quitar es un solo toque, y el editor puede encender GitHub Pages por ti." }),
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Repositorio" }), repo]),
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Token" }), token]),
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Rama" }), rama]),
      el("label.ed-pub-check", {}, [recordar, el("span", { text: "Recordarlo en este aparato" })]),
      ir, estado,
      el("details.ed-pub-ayuda", {}, [
        el("summary", { text: "¿Cómo saco el token? (2 minutos)" }),
        el("ol", {}, [
          el("li", { text: "Entra a GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token." }),
          el("li", { text: "En «Repository access» elige «Only select repositories» y marca tu repositorio." }),
          el("li", { text: "En «Permissions»: «Contents» → Read and write. «Pages» → Read and write. Y, para que el editor pueda encender GitHub Pages, «Administration» → Read and write." }),
          el("li", { text: "Genera el token, cópialo y pégalo aquí. Se queda sólo en este aparato." }),
        ]),
        boton(I("enlace", "Abrir la página del token"), () => abrir("https://github.com/settings/personal-access-tokens/new")),
      ]),
    ], { abierta: "plegada" }));
  },

  /* ── GitHub Pages: ¿está encendido? (sin token sólo se puede mirar y explicar) ── */
  _pubPagesSinToken(c, repo) {
    const sitio = GH.sitioDe(repo);
    const estado = el("div.ed-pub-pages-est", {}, [pastilla("espera", "Revisando tu sitio…")]);
    const pasos = this._pubPasosPages(repo, leerSin().rama || "");
    c.append(seccion("GitHub Pages", [
      estado,
      boton(I("tuerca", "Abrir los ajustes de Pages en GitHub"), () => abrir(`https://github.com/${repo}/settings/pages`), "ed-pub-btn"),
      pasos,
    ]));
    (location.href.startsWith(sitio) ? Promise.resolve(true) : GH.sitioEnLinea(sitio)).then((ok) => {
      estado.textContent = "";
      if (ok === true) estado.append(pastilla("ok", `Encendido: ${sitio}`));
      else if (ok === false) { estado.append(pastilla("mal", "Apagado: por eso tu enlace da 404. Enciéndelo con los pasos de abajo (o conecta un token y lo enciendo yo).")); pasos.open = true; }
      else estado.append(pastilla("nada", "No pude revisarlo desde aquí. Si tu enlace da 404, sigue los pasos de abajo."));
    });
  },

  _pubPasosPages(repo, rama) {
    return el("details.ed-pub-ayuda", {}, [
      el("summary", { text: "¿Cómo lo enciendo a mano? (1 minuto)" }),
      el("ol", {}, [
        el("li", { text: `Abre GitHub → ${repo} → Settings → Pages (el botón de arriba te lleva directo).` }),
        el("li", { text: "En «Build and deployment» → «Source», elige «Deploy from a branch»." }),
        el("li", { text: `En «Branch» elige ${rama ? `«${rama}»` : "la rama donde está tu librito (la que tiene lo más nuevo)"} y la carpeta «/ (root)». Toca «Save».` }),
        el("li", { text: "Espera uno o dos minutos y vuelve a abrir tu enlace: ya no debe salir 404." }),
      ]),
    ]);
  },

  /* ── GitHub Pages con token: ver, encender, cambiar de rama y volver a publicar ── */
  _pubPages(c, cfg, alCambiar) {
    const caja = el("div.ed-pub-pages", {}, [pastilla("espera", "Revisando GitHub Pages…")]);
    const sec = seccion("GitHub Pages", [caja], { abierta: "plegada" });
    c.append(sec);
    const app = this.app;
    const recordado = (() => { try { return !!localStorage.getItem("editordev:github"); } catch (e) { return true; } })();
    const pintar = async () => {
      let pg, lista = [], ult = null;
      try { [pg, lista] = await Promise.all([GH.estadoPages(cfg), GH.ramas(cfg).catch(() => [])]); }
      catch (e) { caja.textContent = ""; caja.append(pastilla("mal", e.message)); return; }
      if (pg.activo) ult = await GH.ultimaPublicacion(cfg);
      caja.textContent = "";
      const elegida = pg.rama || cfg.rama || lista[0]?.nombre || "";
      if (pg.activo === true) {
        const fallo = ult?.estado === "errored";
        caja.append(pastilla(fallo ? "mal" : "ok", `Encendido · rama ${pg.rama || "?"}${pg.carpeta && pg.carpeta !== "/" ? ` (${pg.carpeta})` : ""}`));
        if (ult) caja.append(el("small.ed-pub-estado", { text: ult.estado === "built" ? `Última publicación: lista (${fecha(ult.fecha)}).` : ult.estado === "building" || ult.estado === "queued" ? "Publicando ahora mismo…" : fallo ? `La última publicación falló: ${ult.error || "sin detalle"}. Toca «Volver a publicar el sitio».` : `Estado: ${ult.estado}` }));
        if (cfg.rama && pg.rama && cfg.rama !== pg.rama) caja.append(el("small.ed-nota", { text: `Ojo: publicas en la rama «${cfg.rama}», pero GitHub Pages muestra «${pg.rama}». Elige la misma abajo para que se vea.` }));
      } else if (pg.activo === false) {
        sec.open = true;
        caja.append(pastilla("mal", "Apagado: por eso tu enlace da 404"), el("small.ed-pub-estado", { text: "Elige la rama con tu librito (la más nueva va primero) y enciéndelo." }));
      } else {
        caja.append(pastilla("nada", "No pude ver cómo está: al token le falta «Pages: Read and write»."));
      }
      const sel = el("select.ed-sel", { "aria-label": "Rama de GitHub Pages" });
      for (const r of lista.length ? lista : [{ nombre: elegida }]) if (r.nombre) sel.append(el("option", { value: r.nombre, text: r.nombre + (r.fecha ? ` · ${fecha(r.fecha)}` : ""), selected: r.nombre === elegida || null }));
      const estado = el("small.ed-pub-estado");
      const encender = boton(I("rayo", pg.activo ? "Publicar desde esta rama" : "Encender GitHub Pages"), async () => {
        encender.disabled = true; estado.textContent = "Encendiendo…";
        try {
          const nuevo = await GH.encenderPages(cfg, sel.value);
          await GH.reconstruirPages(cfg).catch(() => {});
          Object.assign(cfg, { rama: sel.value, sitio: nuevo.sitio || cfg.sitio });
          GH.guardarConfig(cfg, recordado);
          app.sonidos?.sonar("exito");
          aviso("GitHub Pages encendido. En uno o dos minutos tu enlace funciona", 4200);
          alCambiar?.();
          pintar();
        } catch (e) {
          app.sonidos?.sonar("error");
          estado.textContent = `${e.message} Si no, enciéndelo a mano con los pasos de abajo.`;
          encender.disabled = false;
        }
      }, (pg.activo ? "" : "primario ") + "ed-pub-btn");
      if (pg.activo && pg.rama === sel.value) encender.hidden = true;
      sel.addEventListener("change", () => { encender.hidden = !!(pg.activo && pg.rama === sel.value); });
      caja.append(el("label.ed-fila", {}, [el("span.ed-et", { text: "Rama" }), sel]), encender);
      if (pg.activo) caja.append(boton(I("refrescar", "Volver a publicar el sitio"), async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try { await GH.reconstruirPages(cfg); app.sonidos?.sonar("exito"); aviso("Listo: GitHub Pages lo está publicando otra vez"); setTimeout(pintar, 4000); }
        catch (e) { app.sonidos?.sonar("error"); aviso(e.message, 4200, "error"); }
        finally { b.disabled = false; }
      }, "ed-pub-btn"));
      caja.append(estado,
        boton(I("tuerca", "Abrir los ajustes de Pages en GitHub"), () => abrir(`https://github.com/${cfg.repo}/settings/pages`), "ed-pub-btn"),
        this._pubPasosPages(cfg.repo, sel.value));
    };
    pintar();
  },

  /* ── Publicar SIN token: .zip → carpeta publicar/ en GitHub → la acción lo publica ── */
  _pubSinToken(c, { abierta = "plegada", repoIni = "", ramaIni = "" } = {}) {
    const app = this.app, P = this.P, mem = leerSin();
    const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60 });
    const repo = el("input", { type: "text", value: repoIni || mem.repo || GH.repoDeAqui() || REPO_BASE, placeholder: "usuario/repositorio", autocomplete: "off", spellcheck: "false" });
    const rama = el("input", { type: "text", value: ramaIni || mem.rama || "", placeholder: "buscando la rama…", autocomplete: "off", spellcheck: "false" });
    const ruta = el("small.ed-pub-ruta");
    const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span")]);
    const listo = el("div.ed-pub-listo", { hidden: "" });
    const lista = el("div.ed-pub-lista");
    const slug = () => GH.nombreLimpio(titulo.value);
    const enlace = () => `${GH.sitioDe(limpiarRepo(repo.value))}publicadas/${slug()}/`;
    const ponerRuta = () => { ruta.textContent = enlace(); };
    for (const i of [titulo, repo]) i.addEventListener("input", ponerRuta);
    ponerRuta();
    // La rama: la de GitHub Pages si se puede ver; si no, la última a la que se subió algo.
    if (!rama.value) GH.ramaPublica(limpiarRepo(repo.value)).then((r) => { if (r && !rama.value) rama.value = r; }).finally(() => { rama.placeholder = "la de GitHub Pages"; });

    const paso1 = boton(I("exportar", "1 · Descargar el .zip para subir"), async () => {
      paso1.disabled = true; prog.hidden = false;
      const poner = (t) => { prog.lastChild.textContent = t; };
      try {
        poner("Preparando tu librito…");
        const nombre = titulo.value.trim() || P.nombre;
        const v = await zipParaVer(app, { titulo: nombre, slug: slug(), alProgreso: poner });
        poner("Armando el .zip…");
        const blob = await v.comoZip();
        const { descargar } = await import("../../export/exportar.js");
        descargar(blob, `${slug()}.zip`);
        app.sonidos?.sonar("guardar");
        guardarSin({ repo: limpiarRepo(repo.value), rama: rama.value.trim(), pendiente: { slug: slug(), titulo: nombre, paginas: v.paginas, fecha: new Date().toISOString(), enlace: enlace() } });
        aviso(`Se descargó «${slug()}.zip». Ahora el paso 2`, 3600);
        paso2.classList.add("primario");
      } catch (e) { app.sonidos?.sonar("error"); aviso(e.message || "No se pudo preparar el .zip", 4200, "error"); }
      finally { paso1.disabled = false; prog.hidden = true; }
    }, "primario ed-pub-btn");

    const paso2 = boton(I("subir", "2 · Subirlo en GitHub"), () => {
      const r = limpiarRepo(repo.value), b = rama.value.trim();
      if (!repoValido(r)) { aviso("Escribe el repositorio como usuario/repositorio.", 3600, "error"); return; }
      if (!b) { aviso("Escribe la rama (la de GitHub Pages).", 3600, "error"); return; }
      guardarSin({ repo: r, rama: b });
      abrir(`https://github.com/${r}/upload/${rutaRama(b)}/publicar`);
      const p = leerSin().pendiente;
      listo.textContent = "";
      listo.append(
        el("b", { html: `${ico("ok")} Ya casi` }),
        el("small", { text: `En la página de GitHub arrastra «${slug()}.zip» y toca «Commit changes». En 1 a 3 minutos tu librito estará aquí:` }),
        el("a", { href: p?.enlace || enlace(), target: "_blank", rel: "noopener", text: p?.enlace || enlace() }),
        el("div.ed-pub-acciones", {}, [boton(I("copiar", "Copiar enlace"), () => copiar(p?.enlace || enlace())), boton(I("compartir", "Compartir"), () => compartir(p?.enlace || enlace(), titulo.value))]),
      );
      listo.hidden = false;
      if (p) { const ya = (leerSin().subidas || []).filter((x) => x.slug !== p.slug); guardarSin({ subidas: [p, ...ya].slice(0, 30) }); pintarLista(); }
    }, "ed-pub-btn");

    const pintarLista = async () => {
      const sitio = GH.sitioDe(limpiarRepo(repo.value));
      const publicas = await GH.listarPublico(sitio);
      const mias = (leerSin().subidas || []).filter((m) => m.enlace?.startsWith(sitio));
      const todas = [...publicas, ...mias.filter((m) => !publicas.some((p) => p.slug === m.slug)).map((m) => ({ ...m, subiendo: true }))];
      lista.textContent = "";
      if (!todas.length) { lista.append(el("small.ed-nota.suave", { text: "Aquí aparecen las que publiques (se leen de tu sitio)." })); return; }
      for (const p of todas) lista.append(el("div.ed-pub-item", {}, [
        el("i", { html: ico("libro") }),
        el("div", {}, [el("b", { text: p.titulo || p.slug }), el("small", { text: p.subiendo ? "Subida: GitHub la está publicando…" : `${fecha(p.fecha)} · ${p.paginas || "?"} ${p.paginas === 1 ? "página" : "páginas"}` })]),
        el("div.ed-pub-mini", {}, [
          boton(ico("ver"), () => abrir(p.enlace), "", "Abrir"),
          boton(ico("copiar"), () => copiar(p.enlace), "", "Copiar enlace"),
          boton(ico("compartir"), () => compartir(p.enlace, p.titulo || p.slug), "", "Compartir"),
        ]),
      ]));
    };

    c.append(seccion("Publicar sin token", [
      el("small.ed-nota.suave", { text: "Sin claves ni tokens: descargas un .zip, lo subes a tu repositorio desde la página de GitHub y GitHub lo publica solo." }),
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Nombre" }), titulo]),
      ruta,
      el("details.ed-pub-ayuda", {}, [
        el("summary", { text: "Repositorio y rama" }),
        el("label.ed-fila", {}, [el("span.ed-et", { text: "Repositorio" }), repo]),
        el("label.ed-fila", {}, [el("span.ed-et", { text: "Rama" }), rama]),
      ]),
      paso1, paso2, prog, listo,
      el("small.ed-pub-estado", { text: "3 · Listo: en 1 a 3 minutos el enlace funciona. Para quitar una, borra su carpeta publicadas/<nombre>/ en GitHub (o usa el token)." }),
      lista,
    ], { abierta }));
    pintarLista();
  },

  _pubPanel(c, cfg) {
    const app = this.app, P = this.P;
    const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60 });
    const ruta = el("small.ed-pub-ruta");
    const ponerRuta = () => { ruta.textContent = `${cfg.sitio}publicadas/${GH.nombreLimpio(titulo.value)}/`; };
    titulo.addEventListener("input", ponerRuta);
    ponerRuta();
    const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span")]);
    const resultado = el("div.ed-pub-listo", { hidden: "" });
    const lista = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando lo que ya publicaste…" })]);
    let publicadas = [];

    const btn = boton(I("publicar", "Publicar este librito"), async () => {
      const slug = GH.nombreLimpio(titulo.value), nombre = titulo.value.trim() || P.nombre;
      btn.disabled = true; prog.hidden = false; resultado.hidden = true;
      const poner = (t) => { prog.lastChild.textContent = t; };
      try {
        poner("Preparando tu librito…");
        const { archivos } = await zipParaVer(app, { titulo: nombre, slug, alProgreso: poner });
        const r = await GH.publicar(cfg, { slug, titulo: nombre, paginas: P.orden.length, archivos, alProgreso: poner });
        app.sonidos?.sonar("publicar");
        const L = app.lienzo;
        app.fx?.colocar?.({ x: L.v.px, y: L.v.py, w: L.W * L.v.z, h: L.H * L.v.z });
        resultado.textContent = "";
        resultado.append(
          el("b", { html: `${ico("ok")} ¡Publicado!` }),
          el("a", { href: r.enlace, target: "_blank", rel: "noopener", text: r.enlace }),
          el("small", { text: `En un minutito ya se puede abrir (GitHub Pages lo prepara). ${r.subidos ? `Se subieron ${r.subidos} archivos` : "No había nada nuevo que subir"}${r.borrados ? ` y se quitaron ${r.borrados} que ya no se usan` : ""}.` }),
          el("div.ed-pub-acciones", {}, [boton(I("copiar", "Copiar enlace"), () => copiar(r.enlace)), boton(I("compartir", "Compartir"), () => compartir(r.enlace, nombre))]),
        );
        resultado.hidden = false;
        cargar();
      } catch (e) {
        app.sonidos?.sonar("error");
        aviso(e.message || "No se pudo publicar", 4200, "error");
      } finally { btn.disabled = false; prog.hidden = true; }
    }, "primario ed-pub-btn");

    const pintarLista = () => {
      lista.textContent = "";
      if (!publicadas.length) { lista.append(el("small.ed-nota.suave", { text: "Todavía no publicaste ninguna. La primera queda aquí." })); return; }
      for (const p of publicadas) {
        lista.append(el("div.ed-pub-item", {}, [
          el("i", { html: ico("libro") }),
          el("div", {}, [el("b", { text: p.titulo }), el("small", { text: `${fecha(p.fecha)} · ${p.paginas || "?"} ${p.paginas === 1 ? "página" : "páginas"}` })]),
          el("div.ed-pub-mini", {}, [
            boton(ico("ver"), () => abrir(p.enlace), "", "Abrir"),
            boton(ico("copiar"), () => copiar(p.enlace), "", "Copiar enlace"),
            boton(ico("compartir"), () => compartir(p.enlace, p.titulo), "", "Compartir"),
            boton(ico("borrar"), async () => {
              if (!(await confirmar(`¿Quitar «${p.titulo}» de internet? El enlace dejará de funcionar (tu librito en el editor no se toca).`, "Quitar"))) return;
              try { await GH.despublicar(cfg, p.slug); app.sonidos?.sonar("borrar"); aviso("Quitada de internet"); publicadas = publicadas.filter((x) => x.slug !== p.slug); pintarLista(); }
              catch (e) { aviso(e.message, 4200, "error"); }
            }, "", "Quitar de internet"),
          ]),
        ]));
      }
      const ya = publicadas.some((p) => p.slug === GH.nombreLimpio(titulo.value));
      btn.querySelector("span").textContent = ya ? "Actualizar la publicada" : "Publicar este librito";
    };
    const cargar = () => GH.listar(cfg).then((l) => { publicadas = l; pintarLista(); }).catch((e) => { lista.textContent = ""; lista.append(el("small.ed-nota.suave", { text: e.message })); });
    titulo.addEventListener("input", () => pintarLista());

    c.append(seccion("Publicar", [
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Nombre" }), titulo]),
      ruta, btn, prog, resultado,
    ]));
    c.append(seccion("Ya publicadas", [lista]));
    const conexion = el("small.ed-nota.suave", { text: `Conectado a ${cfg.repo} (rama ${cfg.rama}).` });
    this._pubPages(c, cfg, () => { ponerRuta(); conexion.textContent = `Conectado a ${cfg.repo} (rama ${cfg.rama}).`; });
    this._pubSinToken(c, { repoIni: cfg.repo, ramaIni: cfg.rama });
    c.append(seccion("Conexión", [
      conexion,
      boton(I("salir", "Desconectar este aparato"), () => { GH.olvidarConfig(); aviso("Se olvidó el token de este aparato"); this.rehacer(); }),
    ], { abierta: "plegada" }));
    cargar();
  },
};
