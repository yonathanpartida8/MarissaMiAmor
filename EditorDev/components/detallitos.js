/**
 * DETALLITOS — páginas que se mandan entre los dos, como notitas, y se van
 * coleccionando. Se abre desde Exportar → «Enviar Detallito» (o desde el menú
 * principal) con una transición que crece desde el botón, y es un menú
 * completo con «atrás» (la flecha, Escape o el «atrás» del teléfono).
 *
 *   · Cada cuenta de M.YNTHN tiene un código único (AMOR-XXXX-XXXX).
 *   · «Vincular a tu Amorcito»: pegas su código y quedan vinculados los dos.
 *   · «Enviar Detallito»: la página que tienes abierta le llega a tu amorcito
 *     (con un mensajito); a ti te llega lo que te manda. Se ven a pantalla
 *     completa y se pueden abrir como borrador para guardarlas en tu librito.
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { formularioCuenta } from "./cuenta.js";
import { zipParaVer, abrirComoBorrador, copiar, abrir } from "./myn.js";
import { datosDe } from "./prueba.js";
import { fuentesUsadas } from "../core/modelo.js";
import { RAIZ } from "../assets/biblioteca.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const cuando = (iso) => {
  if (!iso) return "";
  const t = new Date(iso), d = (Date.now() - t) / 1000;
  if (d < 60) return "ahorita";
  if (d < 3600) return `hace ${Math.round(d / 60)} min`;
  if (d < 86400) return `hace ${Math.round(d / 3600)} h`;
  return t.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};
const ROTAR = [-2.2, 1.6, -1, 2.4, -1.8, 1.1, -2.6, 0.8];
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Detallitos {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.pila = [];
    this.datos = null;
    this.amor = null;
    this.pestana = "recibidos";
    this.borrador = null;   // título y mensajito que se van escribiendo (sobreviven al ir y volver)
    this._limpiezas = [];
  }

  _limpiar() { for (const f of this._limpiezas.splice(0)) { try { f(); } catch (e) { /* nada */ } } }

  /**
   * La página tal cual le va a llegar: el MISMO reproductor del librito, en un
   * marco chiquito, sin sonido. Devuelve el marco (se muestra al estar listo).
   */
  _marcoPrevia(interactiva = false) {
    const app = this.app, P = app.estado.proyecto, pg = app.estado.pagina;
    const marco = el("iframe.dt-previa-marco", { src: "runtime/reproductor.html", title: "Así le va a llegar", allow: "autoplay; fullscreen", tabindex: interactiva ? "0" : "-1" });
    if (!interactiva) marco.setAttribute("aria-hidden", "true");
    const al = async (ev) => {
      if (ev.source !== marco.contentWindow || ev.data?.tipo !== "vista-lista") return;
      const datosUrls = await datosDe(app, pg).catch(() => ({}));
      marco.contentWindow?.postMessage({
        tipo: "librito", datos: { nombre: P.nombre, ajustes: P.ajustes, orden: P.orden, paginas: P.paginas, titulos: {} },
        urls: app.bib.mapa(), datosUrls, base: RAIZ, inicio: app.estado.paginaId, portadilla: false, soloPagina: true, silencio: true,
        fuentes: [...fuentesUsadas(P)], fijar: app.lienzo?.pantallaDeHoja?.() || null,
      }, location.origin);
      setTimeout(() => marco.classList.add("listo"), 160);
    };
    addEventListener("message", al);
    this._limpiezas.push(() => removeEventListener("message", al));
    return marco;
  }

  /** El tamaño de la vista previa dentro de una caja, con la forma de la hoja (la de «Ver como» si es automática). */
  _tam(maxW, maxH) {
    const m = this.app.lienzo?.m, a = this.app.estado.proyecto?.ajustes || {};
    const W = m?.auto ? m.W : a.ancho || 390, H = m?.auto ? m.H : a.alto || 844;
    const k = Math.min(maxW / W, maxH / H);
    return { width: Math.round(W * k) + "px", height: Math.round(H * k) + "px" };
  }

  /** Abre el menú. `desde`: el elemento (o rectángulo) de donde crece la transición. */
  abrir(desde, vista = "inicio") {
    if (this.abierto) { this.ir(vista); return; }
    this.abierto = true;
    const r = desde?.getBoundingClientRect ? desde.getBoundingClientRect() : desde || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    this.cx = r.left + r.width / 2; this.cy = r.top + r.height / 2;
    this.atrasB = el("button.dt-atras", { type: "button", html: ico("izquierda"), "aria-label": "Atrás", onClick: () => this.atras() });
    this.titulo = el("div.dt-titulo", {}, [el("b", { text: "Detallitos" }), el("small", { text: "con tu amorcito" })]);
    this.pill = el("div.dt-pill");
    this.vista = el("main.dt-vista");
    const burbujas = el("div.dt-burbujas", { "aria-hidden": "true" });
    for (let i = 0; i < 16; i++) {
      const b = el("i");
      b.style.left = (Math.random() * 100).toFixed(1) + "%";
      b.style.setProperty("--t", (9 + Math.random() * 9).toFixed(1) + "s");
      b.style.setProperty("--d", (-Math.random() * 18).toFixed(1) + "s");
      b.style.setProperty("--s", (0.5 + Math.random() * 0.9).toFixed(2));
      burbujas.append(b);
    }
    this.capa = el("div.dt-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Detallitos" }, [
      burbujas,
      el("div.dt-marco", {}, [el("header.dt-cab", {}, [this.atrasB, this.titulo, this.pill]), this.vista]),
    ]);
    this.capa.style.setProperty("--x", this.cx + "px");
    this.capa.style.setProperty("--y", this.cy + "px");
    this._tecla = (e) => { if (e.key === "Escape" && this.abierto) { e.stopPropagation(); this.atras(); } };
    addEventListener("keydown", this._tecla, true);
    document.body.append(this.capa);
    document.body.classList.add("con-detallitos");
    this._chispas(this.cx, this.cy);
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
    this.app.sonidos?.sonar("abrir-recursos");
    this._cuenta = () => { if (this.abierto) { this.pila = []; this.ir("inicio"); } };
    addEventListener("ed-cuenta", this._cuenta);
    this.pila = [];
    this.ir(vista);
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    this._limpiar();
    removeEventListener("keydown", this._tecla, true);
    removeEventListener("ed-cuenta", this._cuenta);
    this.app.sonidos?.sonar("cerrar-recursos");
    const c = this.capa;
    c.classList.remove("ver");
    c.classList.add("fuera");
    setTimeout(() => { c.remove(); if (!this.abierto) document.body.classList.remove("con-detallitos"); }, reducido() ? 10 : 520);
    dispatchEvent(new CustomEvent("ed-detallitos", { detail: "cerrado" }));
  }

  /** Atrás: la vista anterior, o cerrar. */
  atras() {
    if (this.pila.length > 1) { this.pila.pop(); this._pintar(this.pila[this.pila.length - 1], -1); return true; }
    this.cerrar();
    return true;
  }

  ir(vista, datos) {
    this.pila.push({ vista, datos });
    this._pintar({ vista, datos }, 1);
  }

  async _pintar({ vista, datos }, dir) {
    this._limpiar();
    const v = el("section.dt-pantalla" + (dir < 0 ? ".vuelve" : ""));
    this.vista.replaceChildren(v);
    this.atrasB.setAttribute("aria-label", this.pila.length > 1 ? "Atrás" : "Cerrar Detallitos");
    if (!SRV.conectado()) return this._vCuenta(v);
    await this._refrescarAmor();
    if (!this.abierto) return;
    if (vista === "vincular" || !this.amor?.pareja) return this._vVincular(v);
    if (vista === "ver") return this._vVer(v, datos);
    if (vista === "previa") return this._vPrevia(v);
    return this._vInicio(v);
  }

  async _refrescarAmor() {
    try { this.amor = await SRV.amor(); } catch (e) { this.amor = this.amor || null; }
    const p = this.amor?.pareja;
    this.pill.replaceChildren(p
      ? el("span.dt-pareja" + (p.en_linea ? ".en-linea" : ""), {}, [el("i"), el("span", { text: `${p.usuario}${p.en_linea ? " · en línea" : ""}` })])
      : el("span.dt-pareja.sola", { html: `${ico("vincular")}<span>Sin vincular</span>` }));
  }

  /* — Sin cuenta: entrar — */
  _vCuenta(v) {
    this.titulo.lastChild.textContent = SRV.NOMBRE;
    v.append(
      el("div.dt-tarjeta-grande.dt-entra", {}, [
        el("div.dt-sobre", { html: ico("detallito") }),
        el("h2", { text: "Entra para mandarle detallitos" }),
        el("p", { text: "Con tu cuenta de M.YNTHN te vinculas con tu amorcito y se mandan páginas que se van coleccionando." }),
      ]),
      el("div.dt-tarjeta.dt-entra", { style: { "--i": 1 } }, [formularioCuenta(this.app, { compacto: true })]),
    );
  }

  /* — Vincular a tu Amorcito — */
  _vVincular(v) {
    const a = this.amor || {};
    this.titulo.lastChild.textContent = "Vincular a tu Amorcito";
    const codigoEl = el("div.dt-codigo", { text: a.codigo || "…" });
    const pegar = el("input.dt-input", { type: "text", placeholder: "AMOR-XXXX-XXXX", autocapitalize: "characters", spellcheck: "false", autocomplete: "off", "aria-label": "Código de tu amorcito" });
    const estado = el("small.dt-estado");
    const vincular = el("button.ed-btn.primario.dt-btn", { type: "button", html: I("vincular", "Vincular"), onClick: async () => {
      if (pegar.value.trim().length < 8) { estado.textContent = "Pega el código completo de tu amorcito."; return; }
      vincular.disabled = true; estado.textContent = "Vinculando…";
      try {
        const r = await SRV.vincular(pegar.value.trim());
        this.app.sonidos?.sonar("publicar");
        this._corazones();
        aviso(`¡Ya están vinculados, ${r.pareja.usuario} y tú!`, 4000);
        this.pila = [];
        setTimeout(() => this.ir("inicio"), reducido() ? 0 : 900);
      } catch (e) { estado.textContent = e.message; this.app.sonidos?.sonar("error"); vincular.disabled = false; }
    } });
    pegar.addEventListener("keydown", (e) => { if (e.key === "Enter") vincular.click(); });
    const pareja = a.pareja;
    v.append(el("div.dt-tarjeta-grande", { style: { "--i": 0 } }, [
      el("div.dt-dos", { "aria-hidden": "true" }, [el("i"), el("i")]),
      el("h2", { text: pareja ? `Vinculados: ${pareja.usuario} y tú` : "Vincúlate con tu amorcito" }),
      el("p", { text: pareja ? `Desde ${new Date(pareja.desde).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}. Todo lo que se manden aparece en su colección.` : "Pásale tu código, o pega aquí el suyo. Con uno de los dos basta: quedan conectados." }),
    ]));
    v.append(el("div.dt-tarjeta", { style: { "--i": 1 } }, [
      el("small.dt-etq", { text: "Tu código" }),
      codigoEl,
      el("div.dt-fila", {}, [
        el("button.ed-btn.chico", { type: "button", html: I("copiar", "Copiar"), onClick: () => copiar(a.codigo) }),
        navigator.share ? el("button.ed-btn.chico", { type: "button", html: I("compartir", "Mandárselo"), onClick: () => navigator.share({ title: "Mi código de amor", text: `Vincúlate conmigo en M.YNTHN: ${a.codigo}` }).catch(() => {}) }) : null,
        !pareja ? el("button.ed-btn.chico", { type: "button", html: I("refrescar", "Otro código"), onClick: async () => { try { const r = await SRV.codigoNuevo(); this.amor.codigo = r.codigo; codigoEl.textContent = r.codigo; } catch (e) { aviso(e.message, 3500, "error"); } } }) : null,
      ].filter(Boolean)),
    ]));
    if (!pareja) {
      v.append(el("div.dt-tarjeta", { style: { "--i": 2 } }, [
        el("small.dt-etq", { text: "El código de tu amorcito" }),
        el("div.dt-fila", {}, [pegar, navigator.clipboard?.readText ? el("button.ed-btn.chico", { type: "button", html: I("pegar", "Pegar"), onClick: async () => { try { pegar.value = (await navigator.clipboard.readText()).trim(); } catch (e) { /* sin permiso */ } } }) : null].filter(Boolean)),
        vincular, estado,
      ]));
    } else {
      v.append(el("div.dt-tarjeta", { style: { "--i": 2 } }, [
        el("button.ed-btn.dt-btn", { type: "button", html: I("detallito", "Ir a nuestros detallitos"), onClick: () => { this.pila = []; this.ir("inicio"); } }),
        el("button.ed-btn.peligro-suave.dt-btn", { type: "button", html: I("cerrar", "Desvincular"), onClick: async () => {
          if (!(await confirmar(`¿Desvincularte de ${pareja.usuario}? Sus detallitos se quedan en sus colecciones, pero ya no podrán mandarse nuevos.`, "Desvincular"))) return;
          try { await SRV.desvincular(); aviso("Se desvincularon"); this.pila = []; this.ir("vincular"); } catch (e) { aviso(e.message, 3500, "error"); }
        } }),
      ]));
    }
    if (!pareja) setTimeout(() => pegar.focus({ preventScroll: true }), 400);
  }

  /* — Inicio: mandar esta página y la colección — */
  async _vInicio(v) {
    const app = this.app, P = app.estado.proyecto, pareja = this.amor.pareja;
    this.titulo.lastChild.textContent = `con ${pareja.usuario}`;
    const pg = P?.paginas?.[app.estado.paginaId];
    const color = pg?.fondo?.color || P?.ajustes?.tema?.fondo || "#ffd1e6";
    if (!this.borrador || this.borrador.pagina !== app.estado.paginaId) this.borrador = { pagina: app.estado.paginaId, titulo: pg?.nombre || "Un detallito", mensaje: "" };
    const B = this.borrador;
    const titulo = el("input.dt-input", { type: "text", value: B.titulo, maxlength: 60, "aria-label": "Título del detallito", onInput: () => { B.titulo = titulo.value; } });
    const mensaje = el("textarea.dt-input.dt-mensaje", { maxlength: 280, rows: 2, placeholder: "Escríbele algo bonito… (opcional)", "aria-label": "Mensajito", onInput: () => { B.mensaje = mensaje.value; nota.textContent = mensaje.value.trim() || "…"; } });
    mensaje.value = B.mensaje;
    const avance = el("div.dt-avance", { hidden: "" }, [el("i")]);
    const estado = el("small.dt-estado");
    const sobre = el("div.dt-sobre-envio.abierto", { "aria-hidden": "true" }, [el("i.dt-carta"), el("i.dt-solapa"), el("i.dt-sello", { html: ico("corazon") })]);
    sobre.style.setProperty("--c", color);
    // La vista previa: un teléfono chiquito con la página de verdad (se toca para verla en grande).
    const nota = el("span.dt-previa-nota", { text: B.mensaje.trim() || "…" });
    const previa = pg ? el("button.dt-previa", { type: "button", title: "Verla en grande", "aria-label": "Ver en grande cómo le va a llegar", onClick: () => this.ir("previa"), style: { ...this._tam(118, 178), "--c": color } }, [
      el("span.dt-previa-pantalla", {}, [this._marcoPrevia(), el("i.dt-previa-brillo")]),
      el("span.dt-previa-lupa", { html: I("ver", "Verla") }),
    ]) : null;
    const enviar = el("button.ed-btn.primario.dt-btn.dt-enviar", { type: "button", html: I("detallito", "Enviar Detallito"), onClick: async () => {
      enviar.disabled = true; avance.hidden = false; estado.textContent = "Envolviendo tu página…";
      const poner = (p) => { avance.firstChild.style.width = Math.round(p * 100) + "%"; };
      // 1 · La página se mete al sobre y el sobre se cierra (mientras sube, late).
      previa?.classList.add("adentro");
      setTimeout(() => sobre.classList.replace("abierto", "cerrado"), reducido() ? 0 : 560);
      setTimeout(() => sobre.classList.add("esperando"), reducido() ? 0 : 1000);
      try {
        const z = await zipParaVer(app, { titulo: titulo.value, slug: "detallito", soloPaginas: [app.estado.paginaId], conProyecto: true, alProgreso: (t) => { estado.textContent = t; } });
        estado.textContent = "Mandándolo…";
        await SRV.mandarDetallito(z.blob, { titulo: titulo.value.trim() || "Un detallito", mensaje: mensaje.value.trim(), color }, poner);
        // 2 · Llegó: el sobre sale volando con chispitas.
        sobre.classList.remove("esperando");
        sobre.classList.add("vuela");
        const r = sobre.getBoundingClientRect();
        this._chispas(r.left + r.width / 2, r.top + r.height / 2);
        app.sonidos?.sonar("publicar");
        estado.textContent = `¡Le llegó a ${pareja.usuario}!`;
        mensaje.value = ""; B.mensaje = ""; nota.textContent = "…";
        this.pestana = "enviados";
        setTimeout(() => {
          sobre.classList.remove("vuela", "cerrado"); sobre.classList.add("abierto", "regresa");
          previa?.classList.remove("adentro"); previa?.classList.add("regresa");
          setTimeout(() => { sobre.classList.remove("regresa"); previa?.classList.remove("regresa"); }, 700);
          this._coleccion(col);
        }, reducido() ? 0 : 1300);
      } catch (e) {
        // No se pudo: el sobre se abre y la página vuelve a salir, para intentarlo otra vez.
        sobre.classList.remove("esperando", "cerrado"); sobre.classList.add("abierto");
        previa?.classList.remove("adentro");
        estado.textContent = e.message; app.sonidos?.sonar("error");
      } finally { enviar.disabled = false; avance.hidden = true; poner(0); }
    } });
    const col = el("div.dt-coleccion");
    v.append(
      el("div.dt-tarjeta-grande.dt-mandar", { style: { "--i": 0 } }, [
        pg ? el("div.dt-mesa", {}, [previa, sobre, el("i.dt-mesa-nota", {}, [nota])]) : sobre,
        el("div.dt-mandar-texto", {}, [
          el("h2", { text: "Mandar esta página" }),
          el("p", { text: pg ? `«${pg.nombre || "Página"}» le llega a ${pareja.usuario} igualita, con sus animaciones, y se guarda en su colección.` : "Abre la página que quieras mandarle." }),
          pg ? el("small.dt-mandar-tip", { text: "Toca la vista previa para verla en grande." }) : null,
        ]),
      ]),
      pg
        ? el("div.dt-tarjeta", { style: { "--i": 1 } }, [
          el("label.dt-campo", {}, [el("span", { text: "Título" }), titulo]),
          el("label.dt-campo", {}, [el("span", { text: "Mensajito" }), mensaje]),
          enviar, avance, estado,
        ])
        : el("div.dt-tarjeta", { style: { "--i": 1 } }, [
          el("p.dt-nota-suave", { text: "Abre o crea un librito: la página que tengas abierta es la que le llega." }),
          el("button.ed-btn.primario.dt-btn", { type: "button", html: I("editar", "Ir al editor"), onClick: () => { this.cerrar(); app.menuPrincipal?.cerrar(); } }),
        ]),
      col,
      el("button.dt-enlace", { type: "button", html: I("vincular", "Vincular a tu Amorcito"), onClick: () => this.ir("vincular") }),
    );
    this._coleccion(col);
  }

  /* — La vista previa en grande (y se puede tocar, como la verá) — */
  _vPrevia(v) {
    const app = this.app, P = app.estado.proyecto, pg = app.estado.pagina;
    if (!pg) return this.atras();
    this.titulo.lastChild.textContent = "Así le va a llegar";
    const color = pg.fondo?.color || P?.ajustes?.tema?.fondo || "#ffd1e6";
    v.append(
      el("div.dt-ver", { style: { "--c": color } }, [
        el("div.dt-ver-hoja.dt-previa-grande", { style: this._tam(Math.min(innerWidth - 40, 440), innerHeight * 0.6) }, [this._marcoPrevia(true)]),
        this.borrador?.mensaje?.trim() ? el("p.dt-ver-msg", { text: `«${this.borrador.mensaje.trim()}»` }) : null,
        el("small.dt-ver-de", { text: "Se puede tocar: así la va a ver (sin sonido aquí)." }),
        el("div.dt-fila.dt-ver-acc", {}, [
          el("button.ed-btn.primario", { type: "button", html: I("detallito", "Listo, quiero mandarla"), onClick: () => this.atras() }),
          el("button.ed-btn", { type: "button", html: I("editar", "Seguir editándola"), onClick: () => { this.cerrar(); app.menuPrincipal?.cerrar(); } }),
        ]),
      ].filter(Boolean)),
    );
  }

  async _coleccion(col) {
    col.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Buscando sus detallitos…" })]));
    try { this.datos = await SRV.detallitos(); } catch (e) { col.replaceChildren(el("p.dt-vacio", { text: e.message })); return; }
    const d = this.datos, nuevos = d.recibidos.filter((x) => !x.visto).length;
    const tab = (k, t, n) => el("button" + (this.pestana === k ? ".on" : ""), { type: "button", role: "tab", onClick: () => { this.pestana = k; this._coleccion(col); } }, [el("span", { text: t }), n ? el("i.dt-globo", { text: String(n) }) : null].filter(Boolean));
    const lista = this.pestana === "recibidos" ? d.recibidos : d.enviados;
    const rejilla = el("div.dt-rejilla");
    if (!lista.length) rejilla.append(el("p.dt-vacio", { text: this.pestana === "recibidos" ? "Todavía no te llega ninguno. Cuando tu amorcito te mande uno, aparece aquí." : "Todavía no mandas ninguno. ¡Manda el primero!" }));
    lista.forEach((x, i) => {
      const t = el("button.dt-nota" + (!x.visto && this.pestana === "recibidos" ? ".nueva" : ""), { type: "button", onClick: () => this.ir("ver", x) }, [
        el("i.dt-cinta"),
        el("b", { text: x.titulo }),
        x.mensaje ? el("p", { text: x.mensaje }) : null,
        el("small", { text: `${this.pestana === "recibidos" ? "de " + x.de : "para " + x.para} · ${cuando(x.creado)}${this.pestana === "enviados" && x.visto ? " · ya lo vio" : ""}` }),
        !x.visto && this.pestana === "recibidos" ? el("em", { text: "Nuevo" }) : null,
      ].filter(Boolean));
      t.style.setProperty("--c", x.color || "#ffd1e6");
      t.style.setProperty("--r", ROTAR[i % ROTAR.length] + "deg");
      t.style.setProperty("--i", Math.min(i, 12));
      rejilla.append(t);
    });
    col.replaceChildren(el("div.dt-tabs", { role: "tablist" }, [tab("recibidos", "De mi amorcito", nuevos), tab("enviados", "Mis enviados", 0)]), rejilla);
  }

  /* — Ver un detallito — */
  _vVer(v, x) {
    this.titulo.lastChild.textContent = x.titulo;
    const recibido = x.de && x.de !== SRV.usuario()?.usuario;
    const url = SRV.enlace(x.ver);
    const marco = el("iframe.dt-marco-ver", { src: url, title: x.titulo, sandbox: "allow-scripts allow-popups allow-forms allow-modals allow-pointer-lock", allow: "autoplay; fullscreen" });
    if (recibido && !x.visto) SRV.visto(x.id).then(() => { x.visto = new Date().toISOString(); dispatchEvent(new CustomEvent("ed-detallito-visto")); }).catch(() => {});
    v.append(
      el("div.dt-ver", { style: { "--c": x.color || "#ffd1e6" } }, [
        el("div.dt-ver-hoja", {}, [marco]),
        x.mensaje ? el("p.dt-ver-msg", { text: `«${x.mensaje}»` }) : null,
        el("small.dt-ver-de", { text: `${recibido ? "De " + x.de : "Para " + x.para} · ${cuando(x.creado)}` }),
        el("div.dt-fila.dt-ver-acc", {}, [
          el("button.ed-btn.primario", { type: "button", html: I("pantalla", "Pantalla completa"), onClick: () => abrir(url) }),
          el("button.ed-btn", { type: "button", html: I("guardar", "Guardar en mis borradores"), onClick: async (ev) => {
            const b = ev.currentTarget; b.disabled = true;
            try { const blob = await SRV.paqueteDetallito(x.id); this.cerrar(); await abrirComoBorrador(this.app, blob, x.titulo); }
            catch (e) { aviso("No se pudo abrir: " + e.message, 4500, "error"); b.disabled = false; }
          } }),
          el("button.ed-btn.peligro-suave", { type: "button", html: I("borrar", recibido ? "Quitar de mi colección" : "Quitar de mis enviados"), onClick: async () => {
            if (!(await confirmar(recibido ? "¿Quitarlo de tu colección?" : "¿Quitarlo de tus enviados? (A tu amorcito se le queda)", "Quitar"))) return;
            try { await SRV.borrarDetallito(x.id); aviso("Quitado"); this.atras(); } catch (e) { aviso(e.message, 3500, "error"); }
          } }),
        ]),
      ].filter(Boolean)),
    );
  }

  /* — Adornos — */
  _chispas(x, y) {
    if (reducido()) return;
    for (let i = 0; i < 14; i++) {
      const s = el("i.dt-chispa", { html: i % 3 ? ico("corazon") : ico("estrella") });
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4, d = 60 + Math.random() * 90;
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d - 30 + "px");
      s.style.setProperty("--rot", (Math.random() * 80 - 40) + "deg");
      document.body.append(s);
      setTimeout(() => s.remove(), 1200);
    }
  }

  _corazones() {
    if (reducido() || !this.capa) return;
    const c = el("div.dt-union", { "aria-hidden": "true" }, [el("i"), el("i")]);
    this.capa.append(c);
    setTimeout(() => c.remove(), 1600);
  }
}
