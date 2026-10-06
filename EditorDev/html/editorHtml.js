/**
 * EDITOR DE HTML — pegar tu index.html entero → Guardar → Probar.
 *
 * Empieza en blanco. Se pega (o se abre de un archivo) el HTML COMPLETO tal
 * cual: <!DOCTYPE html>, <head>, <style>, <script>, <body>… sin separar nada.
 * El editor lo reconoce solo y lo muestra en el mismo marco aislado que usará
 * el librito: botones, eventos, animaciones, canvas, WebGL, audio, vídeo,
 * SVG, formularios, diseño responsive… todo corre, y nada de dentro puede
 * romper el editor ni el librito.
 *
 *   Guardar        guarda EXACTAMENTE lo que está escrito (se puede volver a
 *                  editar cuando quieras: toca dos veces la página o «Editar»)
 *   Probar         la abre a pantalla completa, como una página de verdad
 *   Archivos       si tu HTML pide «foto.jpg», «musica.mp3», «estilo.css»…,
 *                  súbelos aquí y se enlazan solos (y viajan en el .zip)
 *   Usar como      página entera (ocupa toda la hoja) o un bloque en la hoja
 *
 * También edita el FONDO con HTML de una página (abrirFondo).
 * Si sales con cambios sin guardar, pregunta: Seguir editando · Salir sin
 * guardar · Guardar y salir.
 */
import { el, aviso, esMovil, confirmar } from "../components/ui.js";
import { elegirArchivos } from "../assets/biblioteca.js";
import { ico } from "../components/iconos.js";
import { preguntarCambios } from "../components/salir.js";

const RT = window.LibritoRT;

const EJEMPLOS = {
  "Página completa con canvas": `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Estrellitas</title>
<style>
  html,body{margin:0;height:100%;background:#1b1030;overflow:hidden}
  canvas{display:block;width:100%;height:100%}
  p{position:absolute;inset:auto 0 12%;margin:0;text-align:center;font:italic 26px Georgia,serif;color:#ffd9ea}
</style>
</head>
<body>
<canvas id="c"></canvas>
<p>Toca el cielo</p>
<script>
  const c = document.getElementById("c"), g = c.getContext("2d");
  let W, H, e = [];
  const medir = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; };
  addEventListener("resize", medir); medir();
  addEventListener("pointerdown", (ev) => { for (let i = 0; i < 24; i++) e.push({ x: ev.clientX * devicePixelRatio, y: ev.clientY * devicePixelRatio, a: Math.random() * 6.3, v: 1 + Math.random() * 4, t: 1 }); });
  (function paso() {
    g.fillStyle = "rgba(27,16,48,.25)"; g.fillRect(0, 0, W, H);
    for (const s of e) { s.x += Math.cos(s.a) * s.v; s.y += Math.sin(s.a) * s.v; s.t -= 0.012; g.fillStyle = "rgba(255,200,230," + s.t + ")"; g.fillRect(s.x, s.y, 3, 3); }
    e = e.filter((s) => s.t > 0);
    requestAnimationFrame(paso);
  })();
</script>
</body>
</html>`,
  "Corazón que late": `<style>
  body{display:grid;place-items:center;background:transparent}
  .c{width:120px;height:120px;background:#e0457f;transform:rotate(45deg);animation:l 1.3s ease-in-out infinite;border-radius:10px}
  .c::before,.c::after{content:"";position:absolute;width:120px;height:120px;border-radius:50%;background:#e0457f}
  .c::before{left:-60px}.c::after{top:-60px}
  @keyframes l{0%,100%{transform:rotate(45deg) scale(.8)}15%{transform:rotate(45deg) scale(.95)}30%{transform:rotate(45deg) scale(.8)}45%{transform:rotate(45deg) scale(.9)}}
</style>
<div class="c"></div>`,
  "Cuenta regresiva": `<style>
  body{display:grid;place-items:center;font:600 22px Georgia,serif;color:#8e2f86;text-align:center}
  b{display:block;font-size:44px}
</style>
<div>Faltan<b id="d">…</b>para vernos</div>
<script>
  // Cambia la fecha:
  const dia = new Date("2026-12-24T00:00:00");
  const pintar = () => {
    const ms = dia - new Date();
    const d = Math.max(0, Math.ceil(ms / 864e5));
    document.getElementById("d").textContent = d + " días";
  };
  pintar(); setInterval(pintar, 60000);
</script>`,
  "Texto que se escribe": `<style>
  body{display:grid;place-items:center;padding:20px;font:italic 26px Georgia,serif;color:#5a2a4a;text-align:center}
</style>
<p id="t"></p>
<script>
  const frase = "Te amo más de lo que caben las palabras.";
  let i = 0;
  const t = document.getElementById("t");
  const paso = () => { t.textContent = frase.slice(0, ++i); if (i < frase.length) setTimeout(paso, 70); };
  paso();
</script>`,
  "Botón con sorpresa": `<style>
  body{display:grid;place-items:center;font:500 18px system-ui}
  button{border:0;border-radius:99px;padding:14px 26px;background:#d8397a;color:#fff;font:inherit;cursor:pointer}
  p{opacity:0;transition:opacity .6s;font:italic 24px Georgia,serif;color:#8e2f86;text-align:center}
  p.ver{opacity:1}
</style>
<div>
  <button onclick="document.querySelector('p').classList.add('ver')">Toca aquí</button>
  <p>Eres lo más bonito de mi vida</p>
</div>`,
};

/** Qué trae el código (para decírselo a quien lo pega). */
export function analizarHtml(codigo) {
  const c = String(codigo || "");
  const titulo = (c.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || "";
  const partes = [];
  if (/<style[\s>]/i.test(c)) partes.push("CSS");
  if (/<script[\s>]/i.test(c)) partes.push("JavaScript");
  if (/<canvas[\s>]/i.test(c)) partes.push("canvas");
  if (/<svg[\s>]/i.test(c)) partes.push("SVG");
  if (/<(audio|video)[\s>]/i.test(c)) partes.push("audio/vídeo");
  if (/webgl2?|THREE\.|WebGLRenderer/i.test(c)) partes.push("WebGL");
  const externos = [...c.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
  return { completo: RT.esDocumento(c), titulo, partes, externos, archivos: referencias(c), bytes: new Blob([c]).size };
}

/** Los archivos propios que pide el HTML («img/foto.jpg», «musica.mp3», «estilo.css»…). */
export function referencias(codigo) {
  const re = /(?:\b(?:src|href|poster|data-src)\s*=\s*["']?|url\(\s*["']?)(?!https?:|data:|blob:|#|mailto:|tel:|javascript:|\/\/|about:)([^"'()\s>]+?\.(?:png|jpe?g|gif|webp|avif|svg|mp3|m4a|ogg|wav|aac|mp4|webm|mov|m4v|glb|gltf|woff2?|ttf|otf|css|js|json))(?=["')\s>?#]|$)/gi;
  return [...new Set([...String(codigo || "").matchAll(re)].map((m) => m[1].replace(/^\.\//, "")))];
}

const tipoDe = (n) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(n) ? "imagen" : /\.(mp3|m4a|ogg|wav|aac)$/i.test(n) ? "audio" : /\.(mp4|webm|mov|m4v)$/i.test(n) ? "video" : "archivo";

export class EditorHtml {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.s = null;
  }

  get sucio() { const s = this.s; return !!(s && (s.area.value !== s.original || JSON.stringify(s.archivos || {}) !== JSON.stringify(s.archivos0 || {}))); }

  /* ── Abrir: un bloque o página HTML ─────────────────────────────── */
  async abrir(e, op = {}) {
    const E = this.app.estado;
    const L = this.app.lienzo;
    const id = e.id;
    const pid = E.paginaId;
    const entera = e.w >= L.W - 2 && e.h >= L.H - 2;
    return this._abrir({
      titulo: e.nombre || "HTML",
      codigo: e.html?.codigo || "",
      archivos: e.html?.archivos || null,
      como: op.como || (entera || op.pagina ? "pagina" : "bloque"),
      nuevo: !!op.nuevo,
      alGuardar: (codigo, archivos, como) => {
        const x = E.el(id, pid);
        if (!x) return;
        const a = analizarHtml(codigo);
        const cambios = { "html.codigo": codigo, "html.completo": a.completo, "html.archivos": archivos && Object.keys(archivos).length ? archivos : null };
        if (a.titulo && /^(Bloque HTML|HTML|Página HTML)$/.test(x.nombre)) cambios.nombre = a.titulo;
        if (como === "pagina") Object.assign(cambios, L.guardarCaja(x, { x: 0, y: 0, w: L.W, h: L.H }, false), { rot: 0, ancla: { h: "estirar", v: "estirar" } });
        E.setEl(id, cambios, "Editar HTML", null, pid);
        if (a.titulo && op.paginaNueva && E.proyecto.paginas[pid]?.nombre === "Página HTML") E.setPag({ nombre: a.titulo }, "Nombre de la página", null, pid);
      },
      alCancelar: () => {
        const x = E.el(id, pid);
        if (!op.nuevo || !x || x.html?.codigo?.trim()) return;
        E.quitarEls([id], pid);
        // Una página HTML nueva que se dejó vacía: se quita también (se puede deshacer).
        if (op.paginaNueva && !E.proyecto.paginas[pid]?.els.length && E.proyecto.orden.length > 1) E.quitarPagina(pid);
      },
    });
  }

  /** El fondo con HTML de una página. */
  abrirFondo(pid = this.app.estado.paginaId) {
    const E = this.app.estado;
    const f = E.proyecto.paginas[pid]?.fondo || {};
    return this._abrir({
      titulo: "Fondo con HTML",
      fondo: true,
      codigo: f.html?.codigo || "",
      archivos: f.html?.archivos || null,
      alGuardar: (codigo, archivos) => {
        const actual = E.proyecto.paginas[pid]?.fondo?.html || {};
        E.setPag({ "fondo.html": codigo.trim() ? { ...actual, codigo, ruta: null, archivos: archivos && Object.keys(archivos).length ? archivos : null } : null }, "Fondo con HTML", null, pid);
      },
    });
  }

  /* ── La pantalla del editor ─────────────────────────────────────── */
  _abrir(op) {
    if (this.abierto) this._quitar();
    this.abierto = true;
    const s = { op, original: op.codigo, archivos: op.archivos ? { ...op.archivos } : null, archivos0: op.archivos ? { ...op.archivos } : null, como: op.como || "bloque" };
    this.s = s;
    const b = (i, t, al, cls = "") => el("button.ed-btn" + (cls ? "." + cls.split(" ").join(".") : ""), { type: "button", html: `${ico(i)}<span>${t}</span>`, onClick: al });
    const area = el("textarea.ed-codigo.ed-escribible", {
      spellcheck: "false", autocapitalize: "off", autocomplete: "off", autocorrect: "off", wrap: "off",
      placeholder: op.fondo
        ? "Pega aquí el HTML de tu fondo: partículas, un degradado que se mueve, un canvas…\n\nVa detrás de todo y no estorba al editar."
        : "Pega aquí tu index.html COMPLETO (<!DOCTYPE html> … </html>)\no sólo un trozo de HTML.\n\nPegar → Guardar → Probar.",
    });
    area.value = op.codigo;
    s.area = area;
    const vista = el("iframe.ed-codigo-vista", { sandbox: "allow-scripts allow-forms allow-modals allow-pointer-lock", allow: "autoplay; fullscreen", title: "Vista previa" });
    const marco = el("div.ed-codigo-marco", {}, [vista]);
    const info = el("div.ed-cp-info");
    const archivosBtn = b("carpeta", "Archivos", () => this._archivos(), "chico");
    const estado = el("small.ed-cp-estado");
    // Vista previa en vivo (sin trabar al escribir).
    const pintar = async () => {
      const a = analizarHtml(area.value);
      const faltan = a.archivos.filter((n) => !s.archivos?.[n]);
      archivosBtn.hidden = !a.archivos.length && !Object.keys(s.archivos || {}).length;
      archivosBtn.querySelector("span").textContent = a.archivos.length ? `Archivos · ${a.archivos.length - faltan.length}/${a.archivos.length}` : "Archivos";
      archivosBtn.classList.toggle("aviso", faltan.length > 0);
      info.innerHTML = area.value.trim()
        ? `${ico(a.completo ? "pagina" : "html")}<span><b>${a.completo ? "Página completa" : "Trozo de HTML"}</b>${a.partes.length ? " · " + a.partes.join(", ") : ""}${a.titulo ? ` · «${a.titulo}»` : ""} · ${Math.max(1, Math.round(a.bytes / 1024))} KB</span>`
          + (faltan.length ? `<span class="aviso">${ico("aviso")}falta${faltan.length > 1 ? "n" : ""} ${faltan.length} archivo${faltan.length > 1 ? "s" : ""}: súbelo${faltan.length > 1 ? "s" : ""} en «Archivos»</span>` : "")
          + (a.externos.length ? `<span class="suave">${ico("info")}usa ${a.externos.length} archivo(s) de internet</span>` : "")
        : `<span class="suave">Todavía en blanco: pega tu HTML o abre un archivo.</span>`;
      estado.textContent = this.sucio ? "Sin guardar" : "Guardado";
      estado.classList.toggle("sucio", this.sucio);
      if (a.completo && op.nuevo && !s.decidido && !op.fondo) ponerComo("pagina");
      for (const id of Object.values(s.archivos || {})) await this.app.bib.datos(id).catch(() => null);
      const ctx = { url: (id) => this.app.bib.url(id), urlDatos: (id) => this.app.bib.urlDatos(id) };
      const doc = RT.envolverHtml(RT.conArchivos(area.value, s.archivos, ctx));
      if (vista._doc !== doc) { vista._doc = doc; vista.srcdoc = doc; }
    };
    this._pintar = pintar;
    let t = null;
    area.addEventListener("input", () => { clearTimeout(t); t = setTimeout(pintar, 450); estado.textContent = "Sin guardar"; estado.classList.add("sucio"); });
    area.addEventListener("paste", () => { clearTimeout(t); t = setTimeout(pintar, 60); });
    area.addEventListener("keydown", (k) => {
      k.stopPropagation();
      if (k.key === "Tab") { k.preventDefault(); area.setRangeText("  ", area.selectionStart, area.selectionEnd, "end"); }
      if ((k.ctrlKey || k.metaKey) && k.key.toLowerCase() === "s") { k.preventDefault(); this.guardar(false); }
    });
    const ejemplos = el("select.ed-sel.chico", { "aria-label": "Ejemplos" }, [el("option", { value: "", text: "Ejemplos…" }), ...Object.keys(EJEMPLOS).map((k) => el("option", { value: k, text: k }))]);
    ejemplos.addEventListener("change", () => { if (ejemplos.value) { area.value = EJEMPLOS[ejemplos.value]; pintar(); ejemplos.value = ""; } });
    const pegar = b("pegar", "Pegar", async () => {
      try {
        const x = await navigator.clipboard.readText();
        if (x) { area.value = x; pintar(); aviso("Pegado. Ahora «Guardar» y luego «Probar»."); } else aviso("El portapapeles está vacío");
      } catch (er) { area.focus(); aviso("Mantén presionado el cuadro de código y elige «Pegar»"); }
    }, "chico");
    const abrir = b("carpeta", "Abrir .html", async () => {
      const [f] = await elegirArchivos({ accept: ".html,.htm,text/html", multiple: false });
      if (!f) return;
      area.value = await f.text();
      pintar();
    }, "chico");
    const limpiar = b("borrar", "Vaciar", async () => { if (!area.value || (await confirmar("¿Borrar todo el código del cuadro? No se guarda hasta que pulses «Guardar».", "Vaciar"))) { area.value = ""; pintar(); area.focus(); } }, "chico");
    const envolver = b("alinJust", "Ajustar líneas", () => { const on = area.getAttribute("wrap") !== "soft"; area.setAttribute("wrap", on ? "soft" : "off"); envolver.classList.toggle("on", on); }, "chico");
    const usar = el("div.ed-seg.chico", {}, [["pagina", "Página entera"], ["bloque", "Bloque"]].map(([v, txt]) => el("button", { type: "button", dataset: { v }, text: txt, onClick: (ev) => { s.decidido = ev.isTrusted; ponerComo(v); } })));
    const ponerComo = (v) => { s.como = v; for (const x of usar.children) x.classList.toggle("on", x.dataset.v === v); };
    ponerComo(s.como);
    // Teléfono: código o vista (pestañas); computadora: los dos lado a lado.
    const tabs = el("div.ed-seg.ed-cp-tabs", {}, [["codigo", "Código"], ["vista", "Vista previa"]].map(([v, txt]) => el("button", { type: "button", dataset: { v }, text: txt, onClick: () => { caja.dataset.ver = v; for (const x of tabs.children) x.classList.toggle("on", x.dataset.v === v); if (v === "vista") pintar(); } })));
    tabs.firstChild.classList.add("on");
    const caja = el("div.ed-cp-cuerpo", { dataset: { ver: "codigo" } }, [area, marco]);
    const raiz = el("section.ed-codigo-pantalla", { role: "dialog", "aria-modal": "true", "aria-label": op.titulo }, [
      el("header.ed-cp-cab", {}, [
        el("button.ed-btn.ico.ed-cp-atras", { type: "button", "aria-label": "Atrás", title: "Atrás", html: ico("volver"), onClick: () => this.cerrar() }),
        el("div.ed-cp-titulo", {}, [el("h2", { text: op.titulo }), estado]),
        b("play", "Probar", () => this.app.prueba.abrir({ html: area.value, archivos: s.archivos }), "ed-cp-probar"),
        b("guardar", "Guardar", () => this.guardar(true), "primario ed-cp-guardar"),
      ]),
      el("div.ed-cp-herr", {}, [pegar, abrir, ejemplos, archivosBtn, op.fondo ? null : el("span.ed-cp-usar", {}, [el("small", { text: "Usar como" }), usar]), envolver, limpiar, tabs].filter(Boolean)),
      info,
      caja,
    ]);
    s.raiz = raiz;
    s.tecla = (k) => { if (k.key === "Escape" && !document.querySelector(".ed-salir-fondo, .ed-prueba")) { k.preventDefault(); this.cerrar(); } };
    addEventListener("keydown", s.tecla);
    document.body.append(raiz);
    document.body.classList.add("con-codigo");
    requestAnimationFrame(() => raiz.classList.add("ver"));
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
    pintar();
    if (!op.codigo && !esMovil()) setTimeout(() => area.focus({ preventScroll: true }), 300);
    return new Promise((r) => { s.resolver = r; });
  }

  /** Subir los archivos que pide el HTML (se enlazan solos por su nombre). */
  async _archivos() {
    const s = this.s;
    if (!s) return;
    const pedidos = referencias(s.area.value);
    const fs = await elegirArchivos({ accept: "*/*", multiple: true });
    if (!fs.length) return;
    s.archivos = s.archivos || {};
    let n = 0;
    for (const f of fs) {
      // Se busca a qué referencia corresponde (por nombre, sin importar la carpeta).
      const ref = pedidos.find((r) => r === f.name || r.split("/").pop() === f.name) || f.name;
      const a = await this.app.bib.deBlob(f, tipoDe(f.name), f.name);
      s.archivos[ref] = a.id;
      n++;
    }
    aviso(`${n} archivo${n > 1 ? "s" : ""} enlazado${n > 1 ? "s" : ""} a tu HTML`);
    this._pintar?.();
  }

  /** Guarda exactamente lo escrito. `cerrar` = y salir del editor. */
  async guardar(cerrar = true) {
    const s = this.s;
    if (!s) return;
    const codigo = s.area.value;
    s.op.alGuardar(codigo, s.archivos, s.como);
    s.original = codigo;
    s.archivos0 = s.archivos ? { ...s.archivos } : null;
    this._pintar?.();
    dispatchEvent(new CustomEvent("ed-guardado"));
    if (!cerrar) { aviso("Guardado"); return; }
    this._quitar("guardado");
    if (!s.op.fondo && codigo.trim()) aviso("Guardado. Pruébala como una página de verdad:", 4200, "", { t: `${ico("play")}<span>Probar página</span>`, al: () => this.app.prueba.abrir() });
  }

  /** Cerrar (si hay cambios, pregunta). */
  async cerrar() {
    if (!this.s) return;
    if (this.sucio) {
      const r = await preguntarCambios({ titulo: "¿Salir del editor de HTML?", texto: "Hay cambios en el código que todavía no guardaste.", guardar: "Guardar y salir" });
      if (r === "seguir") return;
      if (r === "guardar") return this.guardar(true);
    }
    const op = this.s.op;
    this._quitar("cancelado");
    op.alCancelar?.();
  }

  descartar() { if (this.s) this.s.original = this.s.area.value; }

  _quitar(motivo) {
    const s = this.s;
    if (!s) return;
    this.s = null;
    this.abierto = false;
    removeEventListener("keydown", s.tecla);
    s.raiz.classList.remove("ver");
    s.raiz.classList.add("fuera");
    document.body.classList.remove("con-codigo");
    setTimeout(() => s.raiz.remove(), 260);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
    s.resolver?.(motivo);
  }
}
