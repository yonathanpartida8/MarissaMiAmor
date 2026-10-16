/*
 * Panel del servidor del librito.
 * Habla sólo con /api de este mismo servidor, con la sesión en una galleta
 * HttpOnly (el JavaScript nunca la ve) y la cabecera X-Librito en cada cambio.
 * El token de GitHub jamás llega aquí: sólo se escribe; se ve «…abcd».
 */
(function () {
  "use strict";

  /* ── Utilidades ─────────────────────────────────────────────────── */
  // Lo que viene vacío (null, false) no se pinta: así cada vista puede decir «esto sólo si…» sin dejar un «null».
  for (const m of ["append", "replaceChildren"]) {
    const f = Element.prototype[m];
    Element.prototype[m] = function (...a) { return f.apply(this, a.flat().filter((x) => x != null && x !== false)); };
  }
  const RAIZ = document.getElementById("app");
  function h(tag, props, ...hijos) {
    const [nombre, ...clases] = tag.split(".");
    const e = document.createElement(nombre || "div");
    if (clases.length) e.className = clases.join(" ");
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "text") e.textContent = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "value") e.value = v;
      else if (k === "checked") e.checked = !!v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of hijos.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  const I = {
    inicio: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    pub: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    proy: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    actividad: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    cuenta: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    ver: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    borrar: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    bajar: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    disco: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    rayo: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    llave: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2"/><path d="M16 7l3 3"/><path d="M19 4l2 2"/>',
    ok: '<path d="M20 6L9 17l-5-5"/>',
    salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    refrescar: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    invitar: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>',
  };
  const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ""}</svg>`;
  function btn(texto, al, clase = "", icono = "") {
    const b = h("button.btn" + (clase ? "." + clase.split(" ").join(".") : ""), { type: "button", html: icono ? ico(icono) : "", onClick: al });
    b.append(h("span", { text: texto }));
    return b;
  }
  const peso = (b) => { b = +b || 0; const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (i ? b.toFixed(b < 10 ? 1 : 0) : b) + " " + u[i]; };
  const haceRato = (s) => { const m = Math.max(0, Math.round((Date.now() - new Date(s)) / 60000)); return m < 1 ? "hace un momento" : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };
  const fecha = (s) => { if (!s) return ""; try { return new Date(s).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return s; } };
  const avisos = document.querySelector(".avisos");
  function aviso(t, tipo = "") { const a = h("div.aviso" + (tipo ? "." + tipo : ""), { text: t }); avisos.append(a); setTimeout(() => { a.style.opacity = "0"; a.style.transition = "opacity .3s"; setTimeout(() => a.remove(), 320); }, 3200); }
  async function copiar(t) { try { await navigator.clipboard.writeText(t); aviso("Copiado", "ok"); } catch (e) { prompt("Cópialo:", t); } }
  function confirmar(titulo, texto, si = "Sí", peligro = true) {
    return new Promise((ok) => {
      const cerrar = (v) => { velo.remove(); ok(v); };
      const velo = h("div.velo", { onClick: (e) => { if (e.target === velo) cerrar(false); } },
        h("div.dialogo", { role: "dialog", "aria-modal": "true" }, h("h3", { text: titulo }), h("p", { text: texto }),
          h("div.fila", {}, btn("Cancelar", () => cerrar(false)), btn(si, () => cerrar(true), peligro ? "peligro" : "primario"))));
      document.body.append(velo);
    });
  }
  function mostrarSecreto(titulo, texto, valor) {
    const velo = h("div.velo", {}, h("div.dialogo", { role: "dialog" }, h("h3", { text: titulo }), h("p", { text: texto }), h("div.codigo-grande", { text: valor }),
      h("div.fila", {}, btn("Copiar", () => copiar(valor), "", "copiar"), btn("Listo", () => velo.remove(), "primario"))));
    document.body.append(velo);
  }

  /* ── La API ─────────────────────────────────────────────────────── */
  async function api(ruta, { method = "GET", body } = {}) {
    let r;
    try {
      r = await fetch("/api/" + ruta, { method, credentials: "same-origin", cache: "no-store", headers: { "X-Librito": "panel", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (e) { throw new Error("Sin conexión con el servidor."); }
    let d = {};
    try { d = await r.json(); } catch (e) { /* nada */ }
    if (r.status === 401 && ruta !== "entrar" && ruta !== "yo") { arrancar(); throw new Error(d.error || "Inicia sesión otra vez."); }
    if (!r.ok) { const err = new Error(d.error || `El servidor contestó ${r.status}`); err.status = r.status; throw err; }
    return d;
  }

  let INFO = {}, YO = null, VISTA = "inicio";

  /* ── Arranque ───────────────────────────────────────────────────── */
  async function arrancar() {
    try { INFO = await api("info"); } catch (e) { RAIZ.replaceChildren(h("div.entrada", {}, h("div.tarjeta-entrada", {}, h("h1", { text: "No hay servidor" }), h("p", { text: e.message })))); return; }
    document.title = INFO.nombre || "M.YNTHN";
    if (!INFO.instalado) return pantallaInstalar();
    try { YO = (await api("yo")).usuario; } catch (e) { YO = null; }
    if (!YO) return pantallaEntrar();
    pintarApp();
  }

  function marcaEntrada(titulo, texto) {
    return h("div.marca", {}, h("i"), h("div", {}, h("h1", { text: titulo }), h("p", { text: texto })));
  }
  const campo = (etiqueta, input, ayuda) => h("label.campo", {}, h("span", { text: etiqueta }), input, ayuda ? h("small", { text: ayuda }) : null);

  function pantallaInstalar() {
    const codigo = h("input", { autocomplete: "one-time-code", placeholder: "XXXX-XXXX", autocapitalize: "characters" });
    const usuario = h("input", { autocomplete: "username", placeholder: "tu-nombre", autocapitalize: "none" });
    const c1 = h("input", { type: "password", autocomplete: "new-password" });
    const c2 = h("input", { type: "password", autocomplete: "new-password" });
    const msg = h("p.mensaje");
    const local = !!INFO.en_el_telefono;
    const ir = btn("Crear administrador", async () => {
      if (c1.value !== c2.value) { msg.textContent = "Las contraseñas no coinciden."; return; }
      ir.disabled = true; msg.textContent = "";
      try { const r = await api("instalar", { method: "POST", body: { codigo: codigo.value, usuario: usuario.value, contrasena: c1.value } }); YO = r.usuario; INFO.instalado = true; aviso("¡Listo! Ya eres administrador.", "ok"); pintarApp(); }
      catch (e) { msg.textContent = e.message; ir.disabled = false; }
    }, "primario ancho");
    RAIZ.replaceChildren(h("div.entrada", {}, h("form.tarjeta-entrada", { onSubmit: (e) => { e.preventDefault(); ir.click(); } },
      marcaEntrada("Bienvenido a M.YNTHN", "Primero, crea tu cuenta de administrador."),
      local ? h("p.nota-ok", { text: "Estás en el mismo teléfono del servidor: no hace falta ningún código." })
        : campo("Código de instalación", codigo, "En Termux escribe «librito estado» y cópialo (con o sin guion, da igual). Más fácil: abre este panel en el mismo teléfono, o escribe «librito admin»."),
      campo("Usuario", usuario, "3 a 32: letras minúsculas, números, punto, guion."),
      campo("Contraseña", c1, "Mínimo 8 caracteres. Mejor una frase larga."),
      campo("Repítela", c2), ir, msg)));
    (local ? usuario : codigo).focus();
  }

  function pantallaEntrar(modo = "entrar") {
    const usuario = h("input", { autocomplete: "username", autocapitalize: "none", placeholder: "usuario" });
    const c1 = h("input", { type: "password", autocomplete: modo === "entrar" ? "current-password" : "new-password" });
    const c2 = h("input", { type: "password", autocomplete: "new-password" });
    const codigo = h("input", { placeholder: "XXXX-XXXX-XXXX", autocapitalize: "characters" });
    const msg = h("p.mensaje");
    const puedeRegistro = INFO.registro !== "cerrado";
    const ir = btn(modo === "entrar" ? "Entrar" : "Crear cuenta", async () => {
      ir.disabled = true; msg.className = "mensaje"; msg.textContent = "";
      try {
        if (modo === "entrar") {
          const r = await api("entrar", { method: "POST", body: { usuario: usuario.value, contrasena: c1.value, cliente: "panel", recordar: true } });
          YO = r.usuario; pintarApp();
        } else {
          if (c1.value !== c2.value) throw new Error("Las contraseñas no coinciden.");
          const r = await api("registro", { method: "POST", body: { usuario: usuario.value, contrasena: c1.value, codigo: codigo.value, cliente: "panel" } });
          if (r.usuario) { YO = r.usuario; pintarApp(); return; }
          msg.className = "mensaje bien"; msg.textContent = r.mensaje || "Cuenta creada; espera la aprobación.";
          ir.disabled = false;
        }
      } catch (e) { msg.textContent = e.message; ir.disabled = false; }
    }, "primario ancho");
    RAIZ.replaceChildren(h("div.entrada", {}, h("form.tarjeta-entrada", { onSubmit: (e) => { e.preventDefault(); ir.click(); } },
      marcaEntrada(INFO.nombre || "M.YNTHN", modo === "entrar" ? "Entra para administrar tus publicaciones y proyectos." : INFO.registro === "codigo" ? "Necesitas un código de invitación." : INFO.registro === "abierto" ? "Crea tu cuenta y entras al momento." : "Tu cuenta quedará esperando la aprobación del administrador."),
      puedeRegistro ? h("div.pestanas", {}, h("button", { type: "button", class: modo === "entrar" ? "on" : "", text: "Entrar", onClick: () => pantallaEntrar("entrar") }), h("button", { type: "button", class: modo === "registro" ? "on" : "", text: "Crear cuenta", onClick: () => pantallaEntrar("registro") })) : null,
      campo("Usuario", usuario), campo("Contraseña", c1),
      modo === "registro" ? campo("Repítela", c2) : null,
      modo === "registro" && INFO.registro === "codigo" ? campo("Código de invitación", codigo) : null,
      ir, msg)));
    usuario.focus();
  }

  /* ── La app ─────────────────────────────────────────────────────── */
  const VISTAS = [
    ["inicio", "Inicio", "inicio"], ["publicaciones", "Publicaciones", "pub"], ["proyectos", "Proyectos", "proy"],
    ["usuarios", "Usuarios", "usuarios", true], ["github", "GitHub", "github", true], ["ajustes", "Ajustes", "ajustes", true],
    ["actividad", "Actividad", "actividad", true], ["cuenta", "Mi cuenta", "cuenta"],
  ];
  let principal = null, pendientes = 0;

  function pintarApp() {
    const esAdmin = YO.rol === "admin";
    const lado = h("nav.lado", { "aria-label": "Secciones" },
      h("div.marca", {}, h("i"), h("div", {}, h("b", { text: INFO.nombre || "M.YNTHN" }), h("small", { text: `${YO.usuario} · ${esAdmin ? "administrador" : "editor"}` }))),
      VISTAS.filter((v) => !v[3] || esAdmin).map(([id, t, icono]) => {
        const b = h("button.nav" + (VISTA === id ? ".on" : ""), { type: "button", html: ico(icono), onClick: () => ir(id), "data-v": id });
        b.append(h("span", { text: t }));
        if (id === "usuarios" && pendientes) b.append(h("i.globo", { text: pendientes }));
        return b;
      }),
      h("div.pie", {}, btn("Salir", salir, "chico ancho", "salir")));
    principal = h("main.principal");
    RAIZ.replaceChildren(h("div.app", {}, lado, principal));
    ir(VISTA);
  }

  async function salir() { try { await api("salir", { method: "POST", body: {} }); } catch (e) { /* nada */ } YO = null; pantallaEntrar(); }

  function ir(id) {
    if (!VISTAS.some((v) => v[0] === id && (!v[3] || YO.rol === "admin"))) id = "inicio";
    VISTA = id;
    for (const b of document.querySelectorAll(".nav")) b.classList.toggle("on", b.dataset.v === id);
    const cont = h("section.vista");
    principal.replaceChildren(cont);
    ({ inicio, publicaciones, proyectos, usuarios, github, ajustes, actividad, cuenta })[id](cont);
    scrollTo(0, 0);
  }
  const cabeza = (titulo, texto, ...extra) => h("div.cabeza", {}, h("div", {}, h("h1", { text: titulo }), texto ? h("p", { text: texto }) : null), extra.length ? h("div.fila", {}, ...extra) : null);
  function caja(titulo, icono, ...hijos) {
    const c = h("div.caja");
    if (titulo) { const t = h("h2", { html: ico(icono) }); t.append(h("span", { text: titulo })); c.append(t); }
    c.append(...hijos.flat().filter(Boolean));
    return c;
  }
  const cargando = () => h("div.vacio", {}, h("i"), "Cargando…");
  const vacio = (t) => h("div.vacio", {}, h("i"), t);
  const pildora = (t, tipo = "") => h("span.pildora" + (tipo ? "." + tipo.split(" ").join(".") : ""), { text: t });

  /* — Inicio — */
  async function inicio(c) {
    c.append(cabeza(`Hola, ${YO.usuario}`, "Así está tu servidor ahora mismo."));
    const enlaceEditor = (url) => INFO.editor && url ? `${INFO.editor}#servidor=${encodeURIComponent(url)}` : "";
    if (YO.rol !== "admin") {
      const url = INFO.url_publica || location.origin;
      c.append(h("div.rejilla", {},
        caja("Conectar el editor", "enlace", h("p", { text: "Abre el editor ya emparejado con este servidor y entra con tu cuenta:" }), h("div.url", {}, h("span", { text: url })),
          h("div.fila", {}, btn("Copiar dirección", () => copiar(url), "chico", "copiar"), enlaceEditor(url) ? h("a.btn.chico.primario", { href: enlaceEditor(url), target: "_blank", rel: "noopener", text: "Abrir el editor" }) : null))));
      return;
    }
    const zona = h("div.rejilla", {}, cargando());
    c.append(zona);
    let r;
    try { r = await api("admin/resumen"); } catch (e) { zona.replaceChildren(vacio(e.message)); return; }
    pendientes = r.cuentas.pendientes;
    const globo = document.querySelector('.nav[data-v="usuarios"]');
    if (globo && pendientes && !globo.querySelector(".globo")) globo.append(h("i.globo", { text: pendientes }));
    const url = r.url_publica;
    const d = r.disco, total = d.total || 1;
    const seg = (cls, v) => { const i = h("i." + cls); i.style.width = Math.max(v > 0 ? 0.6 : 0, (v / total) * 100) + "%"; return i; };
    const otros = Math.max(0, d.telefono_usado - d.publicaciones - d.proyectos - (d.detallitos || 0) - d.base);
    zona.replaceChildren(
      h("div.caja.destacada.ancha", {}, h("h2", { html: ico("enlace") + "<span>Conectar el editor</span>" }),
        url ? h("p", { text: "Esta es la dirección de tu servidor en internet. El editor la encuentra solo: no hay que copiarla en ningún lado." })
          : h("p", { text: r.tunel === "cloudflare" ? (r.cloudflared ? "Abriendo el túnel… (tarda unos segundos)" : "Falta cloudflared: en Termux escribe «pkg install cloudflared» y reinicia el servidor.") : "El túnel está apagado: el servidor sólo se ve en tu wifi." }),
        url ? h("div.url", {}, h("span", { text: url })) : null,
        url ? h("div.fila.estados", {},
          r.tunel_probado ? pildora("Probado desde internet " + haceRato(r.tunel_probado), "ok") : pildora("Conectado; la primera prueba desde internet tarda ~3 min", "lila"),
          r.github.listo ? (r.anunciada ? pildora("El editor ya la conoce", "ok") : pildora("Avisándole al editor…", "aviso vivo")) : pildora("Conecta GitHub para que el editor la encuentre", "aviso")) : null,
        h("div.fila", {},
          url ? btn("Copiar", () => copiar(url), "chico", "copiar") : null,
          enlaceEditor(url) ? h("a.btn.chico.primario", { href: enlaceEditor(url), target: "_blank", rel: "noopener", text: "Abrir el editor emparejado" }) : null,
          btn("Reabrir túnel", async () => { await api("admin/tunel/reiniciar", { method: "POST", body: {} }); aviso("Reabriendo el túnel…"); setTimeout(() => ir("inicio"), 6000); }, "chico", "refrescar")),
        h("small", { text: `En tu wifi: http://${r.red_local}:${r.puerto}/ (sólo funciona con el editor abierto desde http, no desde GitHub Pages).` })),
      caja("Almacenamiento", "disco",
        h("div.cifra", {}, peso(d.libre), h("small", { text: "libres en el teléfono" })),
        h("div.barra", {}, seg("b1", d.publicaciones), seg("b2", d.proyectos), seg("b3", d.base), seg("b4", otros)),
        h("div.leyenda", {}, h("span", { html: '<i class="b1"></i>' }, `Publicaciones ${peso(d.publicaciones)}`), h("span", { html: '<i class="b2"></i>' }, `Proyectos ${peso(d.proyectos)}`), h("span", { html: '<i class="b3"></i>' }, `Base ${peso(d.base)}`), h("span", { html: '<i class="b4"></i>' }, `Otras cosas ${peso(otros)}`)),
        h("small", { text: `Datos en ${r.datos}` })),
      caja("Publicaciones", "pub", h("div.cifra", { text: r.publicaciones }), btn("Verlas", () => ir("publicaciones"), "chico")),
      caja("Proyectos guardados", "proy", h("div.cifra", { text: r.proyectos }), btn("Verlos", () => ir("proyectos"), "chico")),
      caja("Detallitos", "pub", h("div.cifra", {}, String(r.detallitos), h("small", { text: `· ${r.parejas} ${r.parejas === 1 ? "pareja vinculada" : "parejas vinculadas"}` })), h("small", { text: `Ocupan ${peso(r.disco.detallitos)} · son privados entre cada pareja.` })),
      caja("Cuentas", "usuarios", h("div.cifra", {}, String(r.cuentas.usuarios), r.cuentas.pendientes ? h("small", { text: `· ${r.cuentas.pendientes} esperando` }) : null), btn(r.cuentas.pendientes ? "Aprobar" : "Ver cuentas", () => ir("usuarios"), r.cuentas.pendientes ? "chico primario" : "chico")),
      caja("GitHub", "github",
        r.github.listo ? h("div", {}, pildora("Conectado", "ok"), h("p", { text: `${r.github.repo} · rama ${r.github.rama}` })) : h("div", {}, pildora("Sin conectar", "aviso"), h("p", { text: "Conéctalo para que lo publicado salga en tu GitHub Pages." })),
        btn(r.github.listo ? "Ver" : "Conectar", () => ir("github"), "chico")),
      r.trabajando.length ? caja("Trabajando ahora", "rayo", ...r.trabajando.map((t) => h("p", {}, pildora(t.tipo, "lila vivo"), " ", t.paso))) : null,
    );
  }

  /* — Publicaciones — */
  async function publicaciones(c) {
    const todas = YO.rol === "admin";
    c.append(cabeza("Publicaciones", "Cada librito publicado vive en su propia carpeta: publicaciones/<nombre>/. Se ven a pantalla completa y no se pueden editar."));
    const lista = h("div.lista", {}, cargando());
    c.append(lista);
    let d;
    try { d = await api("publicaciones" + (todas ? "?todas=1" : "")); } catch (e) { lista.replaceChildren(vacio(e.message)); return; }
    if (!d.publicaciones.length) { lista.replaceChildren(vacio("Todavía no hay publicaciones. En el editor: Exportar → Publicar en servidor M.YNTHN.")); return; }
    lista.replaceChildren(...d.publicaciones.map((p) => {
      const estado = { publicada: ["Publicada", "ok"], local: ["Sólo aquí", "lila"], subiendo: ["Subiendo…", "aviso vivo"], preparando: ["Preparando…", "aviso vivo"], quitando: ["Quitando…", "aviso vivo"], error: ["Error", "mal"] }[p.estado] || [p.estado, ""];
      return h("div.item", {}, h("div.icono", { html: ico("pub") }),
        h("div.datos", {}, h("b", { text: p.titulo || p.slug }), h("small", { text: `${p.slug} · ${p.paginas || "?"} pág. · ${peso(p.bytes)} · ${fecha(p.actualizado)}${todas && p.autor ? " · de " + p.autor : ""}` }), p.error ? h("small", { text: p.error }) : null),
        pildora(estado[0], estado[1]),
        h("div.acciones", {},
          h("a.btn.chico", { href: p.local, target: "_blank", rel: "noopener", html: ico("ver") + "<span>Ver aquí</span>" }),
          p.enlace ? h("a.btn.chico", { href: p.enlace, target: "_blank", rel: "noopener", html: ico("enlace") + "<span>GitHub Pages</span>" }) : null,
          p.enlace ? btn("Copiar", () => copiar(p.enlace), "chico", "copiar") : null,
          (p.estado === "local" || p.estado === "error") && INFO.github ? btn("Subir a GitHub", async () => {
            try { await api(`publicaciones/${p.slug}/subir`, { method: "POST", body: {} }); aviso("Subiéndola a GitHub…"); setTimeout(() => ir("publicaciones"), 3000); } catch (e) { aviso(e.message, "mal"); }
          }, "chico primario", "github") : null,
          btn("Quitar", async () => {
            if (!(await confirmar("¿Quitar esta publicación?", `«${p.titulo}» deja de verse en internet y se borra del servidor. El proyecto en el editor no se toca.`, "Quitar"))) return;
            try { await api("publicaciones/" + p.slug, { method: "DELETE" }); aviso("Quitándola…"); setTimeout(() => ir("publicaciones"), 2500); } catch (e) { aviso(e.message, "mal"); }
          }, "chico peligro", "borrar")));
    }));
  }

  /* — Proyectos — */
  async function proyectos(c) {
    const todas = YO.rol === "admin";
    c.append(cabeza("Proyectos guardados", "Copias completas de los libritos (con todo para volver a editarlos), en una carpeta por usuario y por proyecto. Se guardan solas cada vez que alguien guarda a mano en el editor."));
    const lista = h("div.lista", {}, cargando());
    c.append(lista);
    let d;
    try { d = await api("proyectos" + (todas ? "?todas=1" : "")); } catch (e) { lista.replaceChildren(vacio(e.message)); return; }
    if (!d.proyectos.length) { lista.replaceChildren(vacio("Todavía no hay proyectos guardados.")); return; }
    lista.replaceChildren(...d.proyectos.map((p) => h("div.item", {}, h("div.icono", { html: ico("proy") }),
      h("div.datos", {}, h("b", { text: p.nombre }), h("small", { text: `${p.paginas || "?"} pág. · ${peso(p.bytes)} · ${fecha(p.creado)}${todas && p.autor ? " · de " + p.autor : ""}` })),
      h("div.acciones", {},
        h("a.btn.chico", { href: "/api/proyectos/" + p.id, download: "", html: ico("bajar") + "<span>Descargar</span>" }),
        btn("Borrar", async () => {
          if (!(await confirmar("¿Borrar esta copia?", `Se borra la copia de «${p.nombre}» del ${fecha(p.creado)}.`, "Borrar"))) return;
          try { await api("proyectos/" + p.id, { method: "DELETE" }); aviso("Borrada", "ok"); ir("proyectos"); } catch (e) { aviso(e.message, "mal"); }
        }, "chico peligro", "borrar")))));
  }

  /* — Usuarios — */
  async function usuarios(c) {
    c.append(cabeza("Usuarios", "Quién puede entrar al editor y publicar. Nadie necesita GitHub: el servidor publica por ellos."));
    const [aj, us, inv] = await Promise.all([api("admin/ajustes"), api("admin/usuarios"), api("admin/invitaciones")]).catch((e) => { c.append(vacio(e.message)); return []; });
    if (!aj) return;
    const modo = h("select", {}, ...[["abierto", "Abierto: cualquiera crea su cuenta y ya puede publicar"], ["aprobacion", "Cualquiera se registra y tú lo apruebas"], ["codigo", "Sólo con código de invitación"], ["cerrado", "Cerrado (sólo tú creas cuentas)"]].map(([v, t]) => h("option", { value: v, text: t, selected: aj.registro === v })));
    modo.addEventListener("change", async () => { try { await api("admin/ajustes", { method: "PUT", body: { registro: modo.value } }); INFO.registro = modo.value; aviso("Guardado", "ok"); } catch (e) { aviso(e.message, "mal"); } });
    pendientes = us.usuarios.filter((u) => u.estado === "pendiente").length;
    const lista = h("div.lista", {}, ...us.usuarios.map((u) => {
      const yo = u.id === YO.id;
      const rol = h("select", { "aria-label": "Rol", disabled: yo }, h("option", { value: "editor", text: "Editor", selected: u.rol === "editor" }), h("option", { value: "admin", text: "Administrador", selected: u.rol === "admin" }));
      const cambiar = async (cambios) => { try { await api("admin/usuarios/" + u.id, { method: "PATCH", body: cambios }); aviso("Guardado", "ok"); ir("usuarios"); } catch (e) { aviso(e.message, "mal"); } };
      rol.addEventListener("change", () => cambiar({ rol: rol.value }));
      const est = { activo: ["Activo", "ok"], pendiente: ["Espera aprobación", "aviso vivo"], desactivado: ["Desactivado", "mal"] }[u.estado];
      return h("div.item", {}, h("div.icono", { html: ico("cuenta") }),
        h("div.datos", {}, h("b", { text: u.usuario + (yo ? " (tú)" : "") }), h("small", { text: `${u.publicaciones} publicaciones · ${peso(u.uso)}${u.pareja ? " · vinculada con " + u.pareja : ""} · desde ${fecha(u.creado ? new Date(u.creado * 1000).toISOString() : "")}${u.ultimo ? " · visto " + fecha(new Date(u.ultimo * 1000).toISOString()) : ""}` })),
        pildora(est[0], est[1]),
        h("div.acciones", {},
          u.estado === "pendiente" ? btn("Aprobar", () => cambiar({ estado: "activo" }), "chico primario", "ok") : null,
          !yo && u.estado === "activo" ? btn("Desactivar", () => cambiar({ estado: "desactivado" }), "chico") : null,
          !yo && u.estado === "desactivado" ? btn("Activar", () => cambiar({ estado: "activo" }), "chico") : null,
          rol,
          !yo ? btn("Contraseña temporal", async () => {
            if (!(await confirmar("¿Contraseña temporal?", `Se cierra la sesión de ${u.usuario} y recibe una contraseña nueva que tú le pasas.`, "Generar", false))) return;
            try { const r = await api(`admin/usuarios/${u.id}/contrasena`, { method: "POST", body: {} }); mostrarSecreto("Contraseña temporal", `Pásasela a ${u.usuario}; que la cambie en «Mi cuenta». No se vuelve a mostrar.`, r.temporal); } catch (e) { aviso(e.message, "mal"); }
          }, "chico", "llave") : null,
          !yo ? btn("Borrar", async () => {
            if (!(await confirmar("¿Borrar la cuenta?", `${u.usuario} ya no podrá entrar. Sus proyectos guardados se borran; sus publicaciones pasan a ti.`, "Borrar"))) return;
            try { await api("admin/usuarios/" + u.id, { method: "DELETE" }); aviso("Borrada", "ok"); ir("usuarios"); } catch (e) { aviso(e.message, "mal"); }
          }, "chico peligro", "borrar") : null));
    }));
    const nota = h("input", { placeholder: "Para quién (opcional)" });
    const dias = h("input", { type: "number", min: 1, max: 60, value: 7 });
    const invs = h("div.lista", {}, ...(inv.invitaciones.length ? inv.invitaciones.map((i) => h("div.item", {}, h("div.icono", { html: ico("invitar") }),
      h("div.datos", {}, h("b", { text: i.nota || "Invitación" }), h("small", { text: i.usada ? `Usada por ${i.usada}` : `Vence ${fecha(i.expira)}` })),
      h("div.acciones", {}, btn("Borrar", async () => { await api("admin/invitaciones/" + i.id, { method: "DELETE" }); ir("usuarios"); }, "chico peligro", "borrar")))) : [h("small", { text: "Sin invitaciones." })]));
    c.append(
      caja("Registro", "invitar", campo("¿Quién puede crear cuenta?", modo)),
      caja("Cuentas", "usuarios", lista),
      caja("Códigos de invitación", "invitar",
        h("p", { text: "Con el registro «sólo con código», cada código sirve una vez y entra sin esperar aprobación." }),
        h("div.fila", {}, campo("Nota", nota), campo("Días", dias), btn("Crear código", async () => {
          try { const r = await api("admin/invitaciones", { method: "POST", body: { nota: nota.value, dias: +dias.value } }); mostrarSecreto("Código de invitación", `Vale ${r.dias} días y una sola vez. No se vuelve a mostrar.`, r.codigo); ir("usuarios"); } catch (e) { aviso(e.message, "mal"); }
        }, "primario", "invitar")), invs));
  }

  /* — GitHub — */
  async function github(c) {
    c.append(cabeza("GitHub", "El servidor publica en tu repositorio con TU token, que se guarda cifrado aquí y nunca sale hacia el editor."));
    let g;
    try { g = await api("admin/github"); } catch (e) { c.append(vacio(e.message)); return; }
    const repo = h("input", { value: g.repo || "yonathanpartida8/MarissaMiAmor", placeholder: "usuario/repositorio", autocapitalize: "none", spellcheck: "false" });
    const token = h("input", { type: "password", placeholder: g.token ? `Guardado (${g.token}) · escribe otro para cambiarlo` : "github_pat_…", autocomplete: "off", spellcheck: "false" });
    const rama = h("input", { value: g.rama || "", placeholder: "automática (la de GitHub Pages o la más nueva)", autocapitalize: "none", spellcheck: "false" });
    const msg = h("p.mensaje");
    const guardar = btn("Guardar y probar", async () => {
      guardar.disabled = true; msg.className = "mensaje"; msg.textContent = "Probando con GitHub…";
      try { const r = await api("admin/github", { method: "PUT", body: { repo: repo.value, token: token.value, rama: rama.value } }); token.value = ""; msg.className = "mensaje bien"; msg.textContent = `Conectado: ${r.repo} · rama ${r.rama}${r.privado ? " (repositorio privado)" : ""}.`; aviso("GitHub conectado", "ok"); INFO = await api("info"); setTimeout(() => ir("github"), 900); }
      catch (e) { msg.textContent = e.message; }
      guardar.disabled = false;
    }, "primario", "ok");
    const estado = h("div", {}, g.listo ? cargando() : h("p", { text: "Conecta primero el repositorio." }));
    c.append(h("div.rejilla", {},
      caja("Conexión", "github", campo("Repositorio", repo), campo("Token", token, "Sólo se escribe; nunca se muestra entero."), campo("Rama donde publicar", rama),
        h("div.fila", {}, guardar, g.token ? btn("Borrar token", async () => { if (await confirmar("¿Borrar el token?", "El servidor dejará de publicar en GitHub hasta que pongas otro.", "Borrar")) { await api("admin/github", { method: "DELETE" }); aviso("Token borrado"); ir("github"); } }, "peligro", "borrar") : null), msg),
      caja("GitHub Pages", "rayo", estado),
      caja("¿Cómo saco el token? (2 minutos)", "llave", h("ol.pasos", {},
        h("li", { html: "GitHub → <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</b>." }),
        h("li", { html: "Nombre: <b>servidor del librito</b>. Expiración: la que quieras (al caducar, pegas otro aquí)." }),
        h("li", { html: "<b>Repository access → Only select repositories</b> → tu repositorio." }),
        h("li", { html: "<b>Permissions → Repository</b>: Contents <b>Read and write</b>, Pages <b>Read and write</b> y, para encender Pages desde aquí, Administration <b>Read and write</b>." }),
        h("li", { html: "Genera, copia y pégalo arriba. Mejor aún: en Termux, <code class=\"k\">python servidor.py github</code> (así ni pasa por el navegador)." })),
        h("a.btn.chico", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener", html: ico("enlace") + "<span>Abrir la página del token</span>" }))));
    if (!g.listo) return;
    try {
      const e = await api("admin/github/estado");
      const pg = e.pages;
      const sel = h("select", {}, ...e.ramas.map((r) => h("option", { value: r.nombre, text: r.nombre + (r.fecha ? " · " + fecha(r.fecha) : ""), selected: r.nombre === (pg.rama || e.rama) })));
      estado.replaceChildren(
        pg.activo ? pildora(`Encendido · rama ${pg.rama}`, pg.rama === e.rama ? "ok" : "aviso") : pg.activo === false ? pildora("Apagado: todo da 404", "mal vivo") : pildora("Sin permiso para verlo", "aviso"),
        pg.activo && pg.rama !== e.rama ? h("p", { text: `Ojo: el servidor publica en «${e.rama}», pero Pages muestra «${pg.rama}». Elige la misma.` }) : null,
        pg.sitio ? h("div.url", {}, h("span", { text: pg.sitio })) : null,
        campo("Rama de GitHub Pages", sel),
        h("div.fila", {},
          btn(pg.activo ? "Usar esta rama" : "Encender GitHub Pages", async () => {
            try { await api("admin/github/pages", { method: "POST", body: { rama: sel.value } }); aviso("GitHub Pages encendido: en 1–2 minutos funciona", "ok"); ir("github"); } catch (er) { aviso(er.message, "mal"); }
          }, "primario", "rayo"),
          pg.activo ? btn("Volver a publicar", async () => { try { await api("admin/github/reconstruir", { method: "POST", body: {} }); aviso("Publicando otra vez…", "ok"); } catch (er) { aviso(er.message, "mal"); } }, "", "refrescar") : null,
          h("a.btn", { href: `https://github.com/${e.repo}/settings/pages`, target: "_blank", rel: "noopener", html: ico("ajustes") + "<span>Ajustes en GitHub</span>" })));
    } catch (er) { estado.replaceChildren(vacio(er.message)); }
  }

  /* — Ajustes — */
  async function ajustes(c) {
    c.append(cabeza("Ajustes", "Cómo se ve el servidor desde fuera y quién puede hablarle."));
    let a;
    try { a = await api("admin/ajustes"); } catch (e) { c.append(vacio(e.message)); return; }
    const nombre = h("input", { value: a.nombre, maxlength: 60 });
    const tunel = h("select", {}, h("option", { value: "cloudflare", text: "Túnel de Cloudflare (dirección https gratis)", selected: a.tunel === "cloudflare" }), h("option", { value: "ninguno", text: "Sin túnel (sólo en mi wifi o con mi propio dominio)", selected: a.tunel === "ninguno" }));
    const urlFija = h("input", { value: a.url_publica, placeholder: "https://librito.midominio.com (opcional)" });
    const anunciar = h("input", { type: "checkbox", checked: a.anunciar });
    const local = h("input", { type: "checkbox", checked: a.permitir_local });
    const origenes = h("textarea", { placeholder: "https://otro-sitio.com\n(uno por línea)" });
    origenes.value = (a.origenes || []).join("\n");
    const maxMb = h("input", { type: "number", min: 10, max: 2000, value: a.max_subida_mb });
    const num = (v, min, max) => h("input", { type: "number", min, max, value: v });
    const cuota = num(a.cuota_mb, 10, 100000), maxUs = num(a.max_usuarios, 1, 100000), maxPub = num(a.max_publicaciones, 1, 1000), copias = num(a.copias_por_proyecto, 1, 100);
    const interruptor = (input, titulo, texto) => h("label.interruptor", {}, h("div", {}, h("b", { text: titulo }), h("small", { text: texto })), input);
    const guardar = btn("Guardar ajustes", async () => {
      try {
        await api("admin/ajustes", { method: "PUT", body: { nombre: nombre.value, tunel: tunel.value, url_publica: urlFija.value.trim(), anunciar: anunciar.checked, permitir_local: local.checked, origenes: origenes.value.split(/\s+/).filter(Boolean), max_subida_mb: +maxMb.value, cuota_mb: +cuota.value, max_usuarios: +maxUs.value, max_publicaciones: +maxPub.value, copias_por_proyecto: +copias.value } });
        INFO = await api("info"); aviso("Guardado", "ok");
        if (tunel.value !== a.tunel) { await api("admin/tunel/reiniciar", { method: "POST", body: {} }); aviso(tunel.value === "cloudflare" ? "Abriendo el túnel…" : "Túnel cerrado"); }
      } catch (e) { aviso(e.message, "mal"); }
    }, "primario", "ok");
    c.append(h("div.rejilla", {},
      caja("General", "ajustes", campo("Nombre del servidor", nombre), campo("Tamaño máximo de una subida (MB)", maxMb, "Un librito con vídeos pesa más. El teléfono tiene que tener ese espacio libre.")),
      caja("Para todos los usuarios", "usuarios",
        campo("Espacio por usuario (MB)", cuota, "Proyectos guardados + detallitos enviados. Tú (administrador) no tienes tope."),
        campo("Copias que se guardan de cada proyecto", copias, "Cada vez que alguien guarda a mano se hace una copia; se quedan las más nuevas."),
        campo("Páginas publicadas por usuario", maxPub),
        campo("Cuentas como máximo", maxUs)),
      caja("Dirección en internet", "enlace", campo("Túnel", tunel, "Instala cloudflared en Termux: pkg install cloudflared"), campo("Dirección fija (si tienes una)", urlFija, "Si usas un túnel con nombre o tu dominio. Gana sobre la del túnel rápido."),
        interruptor(anunciar, "Anunciar la dirección", "Escribe servidor.json en tu GitHub Pages para que el editor encuentre el servidor solo, aunque la dirección del túnel cambie.")),
      caja("Quién puede hablarle a la API", "llave",
        h("p", { text: `Tu GitHub Pages ya está permitido. ${INFO.sitio ? "(" + INFO.sitio + ")" : ""}` }),
        campo("Otros orígenes", origenes, "Sólo si abres el editor desde otra dirección."),
        interruptor(local, "Permitir localhost", "Para probar el editor en este mismo teléfono o en tu computadora."))),
      h("div.fila", {}, guardar));
  }

  /* — Actividad — */
  async function actividad(c) {
    c.append(cabeza("Actividad", "Lo último que pasó (entradas, publicaciones, cambios)."));
    let d;
    try { d = await api("admin/actividad"); } catch (e) { c.append(vacio(e.message)); return; }
    if (!d.actividad.length) { c.append(vacio("Nada todavía.")); return; }
    const NOM = { entrar: "Entró", "entrar-fallo": "Contraseña mal", registro: "Se registró", publicar: "Publicó", quitar: "Quitó", proyecto: "Guardó proyecto", "proyecto-borrar": "Borró proyecto", ajustes: "Ajustes", github: "GitHub", pages: "GitHub Pages", usuario: "Cuenta", invitacion: "Invitación", instalar: "Instalación", contrasena: "Contraseña", vincular: "Se vinculó", desvincular: "Se desvinculó", detallito: "Mandó un detallito" };
    c.append(h("div.caja", {}, h("div.desplazable", {}, h("table.tabla", {}, h("thead", {}, h("tr", {}, ...["Cuándo", "Quién", "Qué", "Detalle", "IP"].map((t) => h("th", { text: t })))),
      h("tbody", {}, ...d.actividad.map((a) => h("tr", {}, h("td", { text: fecha(a.t) }), h("td", { text: a.usuario }), h("td", {}, pildora(NOM[a.accion] || a.accion, a.accion === "entrar-fallo" ? "mal" : "")), h("td", { text: a.detalle }), h("td", {}, h("code", { text: a.ip })))))))));
  }

  /* — Mi cuenta — */
  async function cuenta(c) {
    c.append(cabeza("Mi cuenta", `${YO.usuario} · ${YO.rol === "admin" ? "administrador" : "editor"}`));
    const actual = h("input", { type: "password", autocomplete: "current-password" });
    const n1 = h("input", { type: "password", autocomplete: "new-password" });
    const n2 = h("input", { type: "password", autocomplete: "new-password" });
    const msg = h("p.mensaje");
    const sesiones = h("div.lista", {}, cargando());
    c.append(h("div.rejilla", {},
      caja("Cambiar contraseña", "llave", campo("Contraseña actual", actual), campo("Nueva", n1, "Mínimo 8 caracteres."), campo("Repítela", n2),
        btn("Cambiar", async () => {
          msg.className = "mensaje"; msg.textContent = "";
          if (n1.value !== n2.value) { msg.textContent = "No coinciden."; return; }
          try { await api("yo/contrasena", { method: "POST", body: { actual: actual.value, nueva: n1.value } }); msg.className = "mensaje bien"; msg.textContent = "Cambiada. Se cerraron tus otras sesiones."; actual.value = n1.value = n2.value = ""; } catch (e) { msg.textContent = e.message; }
        }, "primario"), msg),
      caja("Sesiones abiertas", "cuenta", sesiones, btn("Salir de aquí", salir, "chico", "salir"))));
    try {
      const d = await api("yo/sesiones");
      sesiones.replaceChildren(...d.sesiones.map((s) => h("div.item", {}, h("div.icono", { html: ico(s.cliente === "editor" ? "pub" : "ajustes") }),
        h("div.datos", {}, h("b", { text: (s.cliente === "editor" ? "Editor" : "Panel") + (s.esta ? " · esta" : "") }), h("small", { text: `${s.ip || ""} · ${fecha(new Date(s.ultimo * 1000).toISOString())}` }), h("small", { text: s.agente || "" })),
        s.esta ? null : h("div.acciones", {}, btn("Cerrar", async () => { await api("yo/sesiones/" + s.id, { method: "DELETE" }); ir("cuenta"); }, "chico peligro")))));
    } catch (e) { sesiones.replaceChildren(vacio(e.message)); }
  }

  arrancar();
})();
