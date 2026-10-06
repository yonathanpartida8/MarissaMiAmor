/**
 * EDITOR DE HTML — bloques y páginas HTML enteras, en un solo bloque.
 *
 * Se pega (o se abre de un archivo .html) el código COMPLETO tal cual:
 * <!DOCTYPE html>, <head>, <style>, <script>, <body>… sin separar nada. El
 * editor reconoce si es un documento entero o un trozo, y lo muestra en el
 * mismo marco aislado que usará el librito (sin acceso al editor ni a las
 * demás páginas): botones, formularios, canvas, WebGL, animaciones… todo
 * funciona dentro y nada de dentro puede romper el editor.
 *
 *   Usar como   «bloque» (un rectángulo en la hoja) o «página entera»
 *               (ocupa toda la hoja; en la hoja automática se estira)
 */
import { el, modal, aviso } from "../components/ui.js";
import { elegirArchivos } from "../assets/biblioteca.js";
import { ico } from "../components/iconos.js";

const RT = window.LibritoRT;

const EJEMPLOS = {
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
  if (RT.esDocumento(c)) partes.push("documento completo");
  if (/<style[\s>]/i.test(c)) partes.push("CSS");
  if (/<script[\s>]/i.test(c)) partes.push("JavaScript");
  if (/<canvas[\s>]/i.test(c)) partes.push("canvas");
  if (/webgl2?|THREE\.|WebGLRenderer/i.test(c)) partes.push("WebGL");
  const externos = [...c.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
  return { completo: RT.esDocumento(c), titulo, partes, externos, bytes: new Blob([c]).size };
}

export class EditorHtml {
  constructor(app) { this.app = app; }

  /** Abre el editor de un bloque HTML. `op.nuevo` = recién creado (cancelar lo quita). */
  async abrir(e, op = {}) {
    const E = this.app.estado;
    const id = e.id;
    const area = el("textarea.ed-codigo.ed-escribible", { spellcheck: "false", autocapitalize: "off", autocomplete: "off", wrap: "off", placeholder: "Pega aquí tu página entera (<!DOCTYPE html> … </html>) o sólo un trozo de HTML." });
    area.value = e.html?.codigo || "";
    const vista = el("iframe.ed-codigo-vista", { sandbox: "allow-scripts allow-forms allow-modals allow-pointer-lock", allow: "autoplay; fullscreen", title: "Vista previa" });
    const info = el("small.ed-codigo-info");
    const L = this.app.lienzo;
    let como = e.w >= L.W - 2 && e.h >= L.H - 2 ? "pagina" : "bloque";
    const marco = el("div.ed-codigo-marco");
    const proporcion = () => { marco.style.aspectRatio = como === "pagina" ? `${L.W} / ${L.H}` : `${e.w} / ${e.h}`; };
    const pintar = () => {
      vista.srcdoc = RT.envolverHtml(area.value);
      const a = analizarHtml(area.value);
      info.innerHTML = a.partes.length
        ? `${ico(a.completo ? "pagina" : "html")}<span>${a.completo ? "Página completa" : "Trozo de HTML"}${a.partes.length ? " · " + a.partes.filter((x) => x !== "documento completo").join(", ") : ""}${a.titulo ? ` · «${a.titulo}»` : ""}</span>${a.externos.length ? `<span class="aviso">${ico("aviso")}usa ${a.externos.length} archivo(s) de internet: sólo cargan con conexión</span>` : ""}`
        : `<span>Escribe o pega tu HTML.</span>`;
      if (a.completo && como === "bloque" && op.nuevo && !area._decidido) { como = "pagina"; usar.querySelector("[data-v=pagina]").click(); }
    };
    let t = null;
    area.addEventListener("input", () => { clearTimeout(t); t = setTimeout(pintar, 400); });
    area.addEventListener("paste", () => { clearTimeout(t); t = setTimeout(pintar, 60); });
    area.addEventListener("keydown", (k) => {
      k.stopPropagation();
      if (k.key === "Tab") {
        k.preventDefault();
        const s = area.selectionStart;
        area.setRangeText("  ", s, area.selectionEnd, "end");
      }
    });
    const ejemplos = el("select.ed-sel", {}, [el("option", { value: "", text: "Ejemplos…" }), ...Object.keys(EJEMPLOS).map((k) => el("option", { value: k, text: k }))]);
    ejemplos.addEventListener("change", () => { if (ejemplos.value) { area.value = EJEMPLOS[ejemplos.value]; pintar(); ejemplos.value = ""; } });
    const b = (i, t, al) => el("button.ed-btn.chico", { type: "button", html: `${ico(i)}<span>${t}</span>`, onClick: al });
    const pegar = b("pegar", "Pegar", async () => {
      try { const x = await navigator.clipboard.readText(); if (x) { area.value = x; pintar(); } else aviso("El portapapeles está vacío"); }
      catch (er) { area.focus(); aviso("Mantén presionado el cuadro de código y elige «Pegar»"); }
    });
    const abrir = b("carpeta", "Abrir .html", async () => {
      const [f] = await elegirArchivos({ accept: ".html,.htm,text/html", multiple: false });
      if (!f) return;
      area.value = await f.text();
      pintar();
    });
    const usar = el("div.ed-seg", {}, [["bloque", "Bloque en la hoja"], ["pagina", "Página entera"]].map(([v, t]) => el("button", { type: "button", dataset: { v }, text: t, class: v === como ? "on" : null, onClick: (ev) => {
      como = v;
      area._decidido = ev.isTrusted;
      for (const x of usar.children) x.classList.toggle("on", x.dataset.v === v);
      proporcion();
    } })));
    proporcion();
    pintar();
    marco.append(vista);
    const r = await modal({
      titulo: e.nombre || "HTML",
      clase: "ed-modal-codigo",
      ancho: 1100,
      contenido: [
        el("div.ed-codigo-barra", {}, [pegar, abrir, ejemplos, el("span.ed-codigo-usar", {}, [el("small", { text: "Usar como" }), usar])]),
        info,
        el("div.ed-codigo-caja", {}, [area, marco]),
        el("small.ed-ayuda", { text: "Pega la página ENTERA en un solo bloque: HTML, CSS y JavaScript juntos. Va aislada: puede tener botones, canvas, WebGL o formularios y no toca ni el librito ni el editor. Pruébala aquí mismo, a la derecha." }),
      ],
      acciones: [["Cancelar", null], ["Guardar", () => area.value, "primario"]],
    });
    const x = E.el(id);
    if (r == null) { if (op.nuevo && x && !x.html?.codigo?.trim()) E.quitarEls([id]); return; }
    if (!x) return;
    const a = analizarHtml(r);
    const cambios = { "html.codigo": r, "html.completo": a.completo };
    if (a.titulo && /^(Bloque HTML|HTML|Página HTML)$/.test(x.nombre)) cambios.nombre = a.titulo;
    if (como === "pagina") Object.assign(cambios, L.guardarCaja(x, { x: 0, y: 0, w: L.W, h: L.H }, false), { rot: 0, ancla: { h: "estirar", v: "estirar" } });
    E.setEl(id, cambios, "Editar HTML");
  }
}
