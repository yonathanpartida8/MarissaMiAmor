/**
 * PÁGINAS PUBLICADAS — publicar el librito en tu GitHub Pages con su propio
 * enlace, actualizarlo y quitarlo, sin salir del editor.
 *
 * Lo publicado es SÓLO para ver: va sin project.json ni EditorData/ (nadie
 * puede abrirlo en el editor y llevárselo editable), con «noindex» para que no
 * salga en buscadores, y en una dirección que sólo conoce quien tenga el enlace.
 * La conexión con GitHub está en integraciones/github.js.
 *
 * Todo va a publicaciones/<nombre>/ (si el nombre ya existe: <nombre>-2…).
 * Tres caminos:
 *   · Tu servidor (Fase 16, el recomendado): entras con TU usuario y
 *     contraseña del servidor (servidor/ en Termux) y él publica en GitHub con
 *     el token que guarda cifrado. En el editor no hay ninguna llave.
 *   · Con token: un toque y se sube solo (y se puede quitar, y encender Pages).
 *   · Sin token: se descarga un .zip, se sube a la carpeta publicar/ desde la
 *     web de GitHub y la acción «Publicar páginas subidas» lo publica.
 * Y una sección «GitHub Pages» que dice si está encendido (si no, todo da 404)
 * y, con token, lo enciende con la rama correcta.
 */
import { el, seccion, boton, aviso, confirmar } from "../ui.js";
import { ico } from "../iconos.js";
import * as GH from "../../integraciones/github.js";
import * as SRV from "../../integraciones/servidor.js";

const fecha = (iso) => { try { return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const REPO_BASE = "yonathanpartida8/MarissaMiAmor";
const CLAVE_SIN = "editordev:publicar-sin-token";
const RAMA_LIBRITO = "claude/interactive-love-book-redesign-5p93fv";
const pesoTxt = (b) => { b = +b || 0; const u = ["B", "KB", "MB", "GB"]; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return (i ? b.toFixed(b < 10 ? 1 : 0) : b) + " " + u[i]; };

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

/** El librito en un .zip sólo para VER (sin project.json ni EditorData/, con el visor a pantalla completa) y su ficha. */
async function zipParaVer(app, { titulo, slug, alProgreso, actualizar = false }) {
  await app.guardarYa?.();
  const { exportar } = await import("../../export/exportar.js");
  const { leerZip, Zip } = await import("../../export/zip.js");
  const { blob } = await exportar(app, { alProgreso, publicar: true });
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
    z.agregar("publicar.json", JSON.stringify({ titulo, slug, paginas, fecha: new Date().toISOString(), ...(actualizar ? { actualizar: true } : {}) }, null, 1));
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
    this._pubServidor(c);
    const conServidor = !!SRV.leer().token;
    const cfg = GH.leerConfig();
    if (!cfg?.token) {
      const repo = GH.repoDeAqui() || leerSin().repo || REPO_BASE;
      this._pubPagesSinToken(c, repo, conServidor);
      this._pubSinToken(c, { abierta: conServidor ? "plegada" : true });
      this._pubConectar(c);
    } else {
      this._pubPanel(c, cfg);
    }
  },

  /* ── Tu servidor: publicar sin tokens (el servidor tiene la llave de GitHub) ── */
  _pubServidor(c) {
    const cuerpo = el("div.ed-srv");
    c.append(seccion("Tu servidor", [cuerpo], { clase: "ed-srv-sec" }));
    const pintar = () => {
      const cfg = SRV.leer();
      cuerpo.textContent = "";
      if (!cfg.url) return this._srvConectar(cuerpo, pintar);
      if (!cfg.token) return this._srvEntrar(cuerpo, cfg, pintar);
      return this._srvPanel(cuerpo, cfg, pintar);
    };
    pintar();
  },

  _srvConectar(cuerpo, pintar) {
    const url = el("input", { type: "url", placeholder: "https://algo.trycloudflare.com", autocomplete: "off", spellcheck: "false", inputmode: "url" });
    const estado = el("small.ed-pub-estado");
    const hallado = el("div");
    const ir = boton(I("enlace", "Conectar"), async () => {
      const u = SRV.limpiarUrl(url.value);
      if (!u) { estado.textContent = "Pega la dirección que muestra el panel de tu servidor."; return; }
      ir.disabled = true; estado.textContent = "Buscando tu servidor…";
      try {
        const inf = await SRV.info(u);
        SRV.guardar({ url: u, nombre: inf.nombre });
        this.app.sonidos?.sonar("exito");
        aviso(`Conectado a «${inf.nombre}». Ahora entra con tu cuenta.`);
        pintar();
      } catch (e) { estado.textContent = e.message; this.app.sonidos?.sonar("error"); ir.disabled = false; }
    }, "primario ed-pub-btn");
    cuerpo.append(
      el("small.ed-nota.suave", { text: "Publica directo en tu GitHub sin tokens ni claves: tu servidor (un teléfono con Termux) guarda la llave de GitHub y sube por ti. Aquí sólo entras con tu usuario y contraseña del servidor." }),
      hallado,
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Dirección" }), url]),
      ir, estado,
      el("details.ed-pub-ayuda", {}, [
        el("summary", { text: "¿Todavía no tienes servidor? (5 minutos)" }),
        el("ol", {}, [
          el("li", { text: "En el teléfono viejo instala Termux desde F-Droid (no el de Play Store)." }),
          el("li", { text: "En Termux pega la línea de instalación de servidor/LÉEME.md y luego escribe: librito iniciar." }),
          el("li", { text: "Abre http://127.0.0.1:8787 en ese teléfono, crea tu administrador y conecta GitHub." }),
          el("li", { text: "Toca «Abrir el editor emparejado» en el panel (o copia su dirección aquí)." }),
        ]),
        boton(I("enlace", "Ver la guía completa"), () => abrir(`https://github.com/${GH.repoDeAqui() || REPO_BASE}/tree/${RAMA_LIBRITO}/servidor`)),
      ]),
    );
    // ¿El servidor ya anunció su dirección en tu GitHub Pages?
    SRV.descubrir().then((d) => {
      if (!d || !cuerpo.isConnected) return;
      url.value = d.url;
      hallado.append(pastilla("ok", `Encontré tu servidor${d.nombre ? `: ${d.nombre}` : ""}`));
    });
  },

  _srvEntrar(cuerpo, cfg, pintar, modo = "entrar") {
    const app = this.app;
    const cab = el("div.ed-srv-cab", {}, [pastilla("espera", `Conectando con ${cfg.nombre || cfg.url}…`),
      boton(I("cambiar", "Cambiar"), () => { SRV.olvidarTodo(); pintar(); }, "chico")]);
    const usuario = el("input", { type: "text", autocomplete: "username", autocapitalize: "none", spellcheck: "false", placeholder: "tu usuario" });
    const c1 = el("input", { type: "password", autocomplete: modo === "entrar" ? "current-password" : "new-password" });
    const c2 = el("input", { type: "password", autocomplete: "new-password" });
    const codigo = el("input", { type: "text", autocapitalize: "characters", placeholder: "XXXX-XXXX-XXXX" });
    const recordar = el("input", { type: "checkbox", checked: true });
    const estado = el("small.ed-pub-estado");
    const filaCodigo = el("label.ed-fila", { hidden: "" }, [el("span.ed-et", { text: "Invitación" }), codigo]);
    const tabs = el("div.ed-srv-tabs", { hidden: "" }, [
      el("button", { type: "button", class: modo === "entrar" ? "on" : "", text: "Entrar", onClick: () => { cuerpo.textContent = ""; this._srvEntrar(cuerpo, cfg, pintar, "entrar"); } }),
      el("button", { type: "button", class: modo === "registro" ? "on" : "", text: "Crear cuenta", onClick: () => { cuerpo.textContent = ""; this._srvEntrar(cuerpo, cfg, pintar, "registro"); } }),
    ]);
    const ir = boton(I(modo === "entrar" ? "ok" : "mas", modo === "entrar" ? "Entrar" : "Crear mi cuenta"), async () => {
      if (!usuario.value.trim() || !c1.value) { estado.textContent = "Escribe tu usuario y tu contraseña."; return; }
      if (modo === "registro" && c1.value !== c2.value) { estado.textContent = "Las contraseñas no coinciden."; return; }
      ir.disabled = true; estado.textContent = modo === "entrar" ? "Entrando…" : "Creando tu cuenta…";
      try {
        if (modo === "entrar") {
          const u = await SRV.entrar(cfg.url, usuario.value.trim(), c1.value, recordar.checked);
          app.sonidos?.sonar("exito");
          aviso(`¡Hola, ${u.usuario}!`);
          pintar();
        } else {
          const r = await SRV.registrar(cfg.url, usuario.value.trim(), c1.value, codigo.value.trim(), recordar.checked);
          if (r.token) { app.sonidos?.sonar("exito"); pintar(); return; }
          estado.textContent = r.mensaje || "Cuenta creada: espera a que el administrador la apruebe y luego entra.";
          ir.disabled = false;
        }
      } catch (e) { estado.textContent = e.message; app.sonidos?.sonar("error"); ir.disabled = false; }
    }, "primario ed-pub-btn");
    for (const i of [usuario, c1, c2, codigo]) i.addEventListener("keydown", (e) => { if (e.key === "Enter") ir.click(); });
    cuerpo.append(...[cab, tabs,
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Usuario" }), usuario]),
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Contraseña" }), c1]),
      modo === "registro" ? el("label.ed-fila", {}, [el("span.ed-et", { text: "Repítela" }), c2]) : null,
      filaCodigo,
      el("label.ed-pub-check", {}, [recordar, el("span", { text: "Recordarme en este aparato" })]),
      ir, estado].filter(Boolean));
    SRV.info(cfg.url).then((inf) => {
      if (inf.nombre !== cfg.nombre) SRV.guardar({ ...SRV.leer(), nombre: inf.nombre });
      cab.firstChild.replaceWith(pastilla(inf.github ? "ok" : "nada", `${inf.nombre}${inf.github ? "" : " · sin GitHub todavía"}`));
      tabs.hidden = inf.registro === "cerrado";
      filaCodigo.hidden = !(modo === "registro" && inf.registro === "codigo");
      if (modo === "registro" && inf.registro === "aprobacion") estado.textContent = "Tu cuenta quedará esperando que el administrador la apruebe.";
    }).catch((e) => { cab.firstChild.replaceWith(pastilla("mal", e.message)); });
    setTimeout(() => usuario.focus({ preventScroll: true }), 50);
  },

  _srvPanel(cuerpo, cfg, pintar) {
    const app = this.app, P = this.P;
    let inf = { github: true, sitio: "" };
    const cab = el("div.ed-srv-cab", {}, [pastilla("ok", `${cfg.usuario?.usuario || "Tú"} · ${cfg.nombre || "tu servidor"}`),
      boton(I("salir", "Salir"), async () => { await SRV.salir(); aviso("Saliste de tu servidor"); pintar(); }, "chico")]);
    const aviso_gh = el("small.ed-nota", { hidden: "", text: "Tu servidor todavía no tiene GitHub conectado: lo publicado se guarda en el servidor (con su enlace) y se sube a GitHub cuando el administrador lo conecte." });
    const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60 });
    const ruta = el("small.ed-pub-ruta");
    const ponerRuta = () => { const sl = GH.nombreLimpio(titulo.value); ruta.textContent = inf.sitio ? `${inf.sitio}${GH.CARPETA}/${sl}/  (si ya existe, ${sl}-2…)` : `Carpeta: ${GH.CARPETA}/${sl}/`; };
    titulo.addEventListener("input", ponerRuta);
    const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span"), el("b.ed-srv-barra", {}, [el("i")])]);
    const resultado = el("div.ed-pub-listo", { hidden: "" });
    const lista = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando tus publicaciones…" })]);
    const proyectos = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando tus copias…" })]);
    const poner = (t, p) => { prog.children[1].textContent = t; const b = prog.children[2]; b.hidden = p == null; if (p != null) b.firstChild.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + "%"; };

    const mostrarListo = (r, nombre) => {
      const enlace = r.enlace || r.local;
      resultado.textContent = "";
      resultado.append(
        el("b", { html: `${ico("ok")} ¡Publicado!` }),
        el("a", { href: enlace, target: "_blank", rel: "noopener", text: enlace }),
        el("small", { text: r.github === false ? "Quedó guardado en tu servidor (GitHub todavía no está conectado)." : `En un minutito ya se puede abrir (GitHub Pages lo prepara).${r.slug && r.slug !== GH.nombreLimpio(titulo.value) ? ` Ese nombre ya existía: quedó como «${r.slug}».` : ""}` }),
        el("div.ed-pub-acciones", {}, [
          boton(I("pantalla", "Ver a pantalla completa"), () => abrir(enlace), "primario"),
          boton(I("copiar", "Copiar enlace"), () => copiar(enlace)),
          boton(I("compartir", "Compartir"), () => compartir(enlace, nombre)),
        ]),
      );
      resultado.hidden = false;
    };

    const publicar = async (reemplazar = "") => {
      const nombre = titulo.value.trim() || P.nombre;
      const slug = GH.nombreLimpio(titulo.value);
      btn.disabled = true; prog.hidden = false; resultado.hidden = true;
      try {
        poner("Preparando tu librito…");
        const v = await zipParaVer(app, { titulo: nombre, slug, alProgreso: (t) => poner(t), actualizar: !!reemplazar });
        poner("Armando el paquete…");
        const blob = await v.comoZip();
        const r = await SRV.publicar(blob, { titulo: nombre, nombre: slug, paginas: v.paginas, reemplazar }, poner);
        app.sonidos?.sonar("publicar");
        const L = app.lienzo;
        app.fx?.colocar?.({ x: L.v.px, y: L.v.py, w: L.W * L.v.z, h: L.H * L.v.z });
        mostrarListo(r, nombre);
        cargar();
      } catch (e) {
        app.sonidos?.sonar("error");
        aviso(e.message || "No se pudo publicar", 5000, "error");
        if (e.status === 401) pintar();
      } finally { btn.disabled = false; prog.hidden = true; }
    };
    const btn = boton(I("publicar", "Publicar en mi GitHub"), () => publicar(), "primario ed-pub-btn");

    const fila = (p) => el("div.ed-pub-item", {}, [
      el("i", { html: ico("libro") }),
      el("div", {}, [el("b", { text: p.titulo || p.slug }), el("small", { text: `${fecha(p.actualizado)} · ${p.paginas || "?"} ${p.paginas === 1 ? "página" : "páginas"} · ${{ publicada: "en GitHub", local: "sólo en el servidor", subiendo: "subiendo…", preparando: "preparando…", quitando: "quitando…", error: "error: " + (p.error || "") }[p.estado] || p.estado}` })]),
      el("div.ed-pub-mini", {}, [
        boton(ico("pantalla"), () => abrir(p.enlace || cfg.url + p.local), "", "Ver a pantalla completa"),
        boton(ico("copiar"), () => copiar(p.enlace || cfg.url + p.local), "", "Copiar enlace"),
        boton(ico("compartir"), () => compartir(p.enlace || cfg.url + p.local, p.titulo), "", "Compartir"),
        boton(ico("refrescar"), async () => {
          if (!(await confirmar(`¿Reemplazar «${p.titulo}» con el librito que tienes abierto? El enlace sigue siendo el mismo.`, "Actualizar"))) return;
          titulo.value = p.titulo || titulo.value; ponerRuta();
          publicar(p.slug);
        }, "", "Actualizar con este librito"),
        (p.estado === "local" || p.estado === "error") && inf.github ? boton(ico("subir"), async () => {
          try { const r = await SRV.subirOtraVez(p.slug); aviso("Subiéndola a GitHub…"); await SRV.esperar(r.trabajo); aviso("¡Ya está en GitHub!"); cargar(); } catch (e) { aviso(e.message, 4200, "error"); }
        }, "", "Subir a GitHub") : null,
        boton(ico("borrar"), async () => {
          if (!(await confirmar(`¿Quitar «${p.titulo}» de internet? El enlace dejará de funcionar (tu librito en el editor no se toca).`, "Quitar"))) return;
          try { const r = await SRV.quitar(p.slug); aviso("Quitándola…"); await SRV.esperar(r.trabajo); app.sonidos?.sonar("borrar"); aviso("Quitada de internet"); cargar(); }
          catch (e) { aviso(e.message, 4200, "error"); }
        }, "", "Quitar de internet"),
      ]),
    ]);
    const cargar = () => SRV.publicaciones().then((l) => {
      lista.textContent = "";
      if (!l.length) lista.append(el("small.ed-nota.suave", { text: "Todavía no publicaste ninguna desde tu servidor." }));
      else lista.append(...l.map(fila));
    }).catch((e) => { lista.textContent = ""; lista.append(el("small.ed-nota.suave", { text: e.message })); if (e.status === 401) pintar(); });

    const cargarProyectos = () => SRV.proyectos().then((l) => {
      proyectos.textContent = "";
      if (!l.length) { proyectos.append(el("small.ed-nota.suave", { text: "Todavía no guardaste copias aquí." })); return; }
      proyectos.append(...l.slice(0, 20).map((p) => el("div.ed-pub-item", {}, [
        el("i", { html: ico("guardar") }),
        el("div", {}, [el("b", { text: p.nombre }), el("small", { text: `${fecha(p.creado)} · ${p.paginas || "?"} pág. · ${pesoTxt(p.bytes)}` })]),
        el("div.ed-pub-mini", {}, [
          boton(ico("subir"), async () => {
            try {
              aviso("Bajando la copia…");
              const blob = await SRV.bajarProyecto(p.id);
              const { abrirArchivo } = await import("../../export/abrir.js");
              if (app.auto?.pendiente) await app.auto.ahora();
              const Pn = await abrirArchivo(new File([blob], GH.nombreLimpio(p.nombre) + ".zip", { type: "application/zip" }));
              await app.abrirProyecto(Pn, true);
              aviso(`«${Pn.nombre}» abierto como borrador nuevo`);
            } catch (e) { aviso("No se pudo abrir: " + e.message, 4500, "error"); }
          }, "", "Abrir como borrador nuevo"),
          boton(ico("borrar"), async () => {
            if (!(await confirmar(`¿Borrar la copia de «${p.nombre}» del ${fecha(p.creado)} en el servidor?`, "Borrar"))) return;
            try { await SRV.borrarProyecto(p.id); cargarProyectos(); } catch (e) { aviso(e.message, 4200, "error"); }
          }, "", "Borrar del servidor"),
        ]),
      ])));
    }).catch((e) => { proyectos.textContent = ""; proyectos.append(el("small.ed-nota.suave", { text: e.message })); });

    const guardarBtn = boton(I("guardar", "Guardar este proyecto en el servidor"), async () => {
      guardarBtn.disabled = true;
      try {
        await app.guardarYa?.();
        const { exportar } = await import("../../export/exportar.js");
        const { blob } = await exportar(app, { completo: true, alProgreso: (t) => { guardarBtn.querySelector("span").textContent = t; } });
        await SRV.guardarProyecto(blob, P.nombre || "Mi librito", (p) => { guardarBtn.querySelector("span").textContent = `Subiendo… ${Math.round(p * 100)} %`; });
        app.sonidos?.sonar("guardar");
        aviso("Copia guardada en tu servidor");
        cargarProyectos();
      } catch (e) { aviso(e.message, 4500, "error"); }
      finally { guardarBtn.disabled = false; guardarBtn.querySelector("span").textContent = "Guardar este proyecto en el servidor"; }
    }, "ed-pub-btn");

    cuerpo.append(cab, aviso_gh,
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Nombre" }), titulo]),
      ruta, btn, prog, resultado,
      el("h4.ed-srv-sub", { text: "Mis publicaciones" }), lista,
      el("h4.ed-srv-sub", { text: "Copias de mis proyectos" }), guardarBtn, proyectos);
    ponerRuta();
    SRV.info(cfg.url).then((i) => {
      inf = i; aviso_gh.hidden = !!i.github; ponerRuta(); cargar();
      cab.firstChild.replaceWith(pastilla(i.github ? "ok" : "nada", `${cfg.usuario?.usuario || "Tú"} · ${i.nombre}`));
    }).catch((e) => { cab.firstChild.replaceWith(pastilla("mal", e.message)); cargar(); });
    cargarProyectos();
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
  _pubPagesSinToken(c, repo, plegada = false) {
    const sitio = GH.sitioDe(repo);
    const estado = el("div.ed-pub-pages-est", {}, [pastilla("espera", "Revisando tu sitio…")]);
    const pasos = this._pubPasosPages(repo, leerSin().rama || "");
    const sec = seccion("GitHub Pages", [
      estado,
      boton(I("tuerca", "Abrir los ajustes de Pages en GitHub"), () => abrir(`https://github.com/${repo}/settings/pages`), "ed-pub-btn"),
      pasos,
    ], { abierta: plegada ? "plegada" : true });
    c.append(sec);
    (location.href.startsWith(sitio) ? Promise.resolve(true) : GH.sitioEnLinea(sitio)).then((ok) => {
      estado.textContent = "";
      if (ok === true) estado.append(pastilla("ok", `Encendido: ${sitio}`));
      else if (ok === false) { estado.append(pastilla("mal", "Apagado: por eso tu enlace da 404. Enciéndelo con los pasos de abajo (o desde el panel de tu servidor → GitHub).")); pasos.open = true; sec.open = true; }
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
    let usadosPublicos = new Set(["lista"]);
    const slug = () => GH.nombreLibre(GH.nombreLimpio(titulo.value), usadosPublicos);
    const enlace = () => `${GH.sitioDe(limpiarRepo(repo.value))}${GH.CARPETA}/${slug()}/`;
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
      usadosPublicos = new Set(["lista", ...publicas.map((p) => p.slug)]);
      ponerRuta();
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
      el("small.ed-pub-estado", { text: "3 · Listo: en 1 a 3 minutos el enlace funciona. Para quitar una, borra su carpeta publicaciones/<nombre>/ en GitHub (o usa tu servidor o el token)." }),
      lista,
    ], { abierta }));
    pintarLista();
  },

  _pubPanel(c, cfg) {
    const app = this.app, P = this.P;
    const titulo = el("input", { type: "text", value: P.nombre || "Mi librito", maxlength: 60 });
    const ruta = el("small.ed-pub-ruta");
    const ponerRuta = () => { const sl = GH.nombreLimpio(titulo.value); ruta.textContent = `${cfg.sitio}${GH.CARPETA}/${sl}/  (si ya existe, ${sl}-2…)`; };
    titulo.addEventListener("input", ponerRuta);
    ponerRuta();
    const prog = el("div.ed-pub-prog", { hidden: "" }, [el("i"), el("span")]);
    const resultado = el("div.ed-pub-listo", { hidden: "" });
    const lista = el("div.ed-pub-lista", {}, [el("small.ed-nota.suave", { text: "Buscando lo que ya publicaste…" })]);
    let publicadas = [];

    const publicarCon = async (reemplazar = "") => {
      const slug = GH.nombreLimpio(titulo.value), nombre = titulo.value.trim() || P.nombre;
      btn.disabled = true; prog.hidden = false; resultado.hidden = true;
      const poner = (t) => { prog.lastChild.textContent = t; };
      try {
        poner("Preparando tu librito…");
        const { archivos } = await zipParaVer(app, { titulo: nombre, slug, alProgreso: poner });
        const r = await GH.publicar(cfg, { slug, titulo: nombre, paginas: P.orden.length, archivos, alProgreso: poner, reemplazar });
        app.sonidos?.sonar("publicar");
        const L = app.lienzo;
        app.fx?.colocar?.({ x: L.v.px, y: L.v.py, w: L.W * L.v.z, h: L.H * L.v.z });
        resultado.textContent = "";
        resultado.append(
          el("b", { html: `${ico("ok")} ¡Publicado!` }),
          el("a", { href: r.enlace, target: "_blank", rel: "noopener", text: r.enlace }),
          el("small", { text: `En un minutito ya se puede abrir (GitHub Pages lo prepara). ${r.slug !== slug && !reemplazar ? `Ese nombre ya existía: quedó como «${r.slug}». ` : ""}${r.subidos ? `Se subieron ${r.subidos} archivos` : "No había nada nuevo que subir"}${r.borrados ? ` y se quitaron ${r.borrados} que ya no se usan` : ""}.` }),
          el("div.ed-pub-acciones", {}, [boton(I("pantalla", "Ver a pantalla completa"), () => abrir(r.enlace), "primario"), boton(I("copiar", "Copiar enlace"), () => copiar(r.enlace)), boton(I("compartir", "Compartir"), () => compartir(r.enlace, nombre))]),
        );
        resultado.hidden = false;
        cargar();
      } catch (e) {
        app.sonidos?.sonar("error");
        aviso(e.message || "No se pudo publicar", 4200, "error");
      } finally { btn.disabled = false; prog.hidden = true; }
    };
    const btn = boton(I("publicar", "Publicar este librito"), () => publicarCon(), "primario ed-pub-btn");

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
            boton(ico("refrescar"), async () => {
              if (!(await confirmar(`¿Reemplazar «${p.titulo}» con el librito que tienes abierto? El enlace sigue siendo el mismo.`, "Actualizar"))) return;
              titulo.value = p.titulo || titulo.value; ponerRuta();
              publicarCon(p.slug);
            }, "", "Actualizar con este librito"),
            boton(ico("borrar"), async () => {
              if (!(await confirmar(`¿Quitar «${p.titulo}» de internet? El enlace dejará de funcionar (tu librito en el editor no se toca).`, "Quitar"))) return;
              try { await GH.despublicar(cfg, p.slug); app.sonidos?.sonar("borrar"); aviso("Quitada de internet"); publicadas = publicadas.filter((x) => x.slug !== p.slug); pintarLista(); }
              catch (e) { aviso(e.message, 4200, "error"); }
            }, "", "Quitar de internet"),
          ]),
        ]));
      }
    };
    const cargar = () => GH.listar(cfg).then((l) => { publicadas = l; pintarLista(); }).catch((e) => { lista.textContent = ""; lista.append(el("small.ed-nota.suave", { text: e.message })); });

    c.append(seccion("Publicar con token", [
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
