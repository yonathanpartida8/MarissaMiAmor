/**
 * EDITOR DE HTML — para los bloques </> .
 *
 * A la izquierda el código, a la derecha cómo se ve (en el mismo marco
 * aislado que usará el librito: sin acceso al editor ni a las demás
 * páginas). La vista se actualiza un momento después de dejar de escribir.
 */
import { el, modal, boton } from "../components/ui.js";

const RT = window.LibritoRT;

const EJEMPLOS = {
  "Corazón que late": `<style>
  body{display:grid;place-items:center;background:transparent}
  .c{font-size:90px;animation:l 1.3s ease-in-out infinite}
  @keyframes l{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(1)}45%{transform:scale(1.1)}}
</style>
<div class="c">💗</div>`,
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
  <p>Eres lo más bonito de mi vida 🤍</p>
</div>`,
};

export class EditorHtml {
  constructor(app) { this.app = app; }

  async abrir(e) {
    const E = this.app.estado;
    const id = e.id;
    const area = el("textarea.ed-codigo", { spellcheck: "false", autocapitalize: "off", autocomplete: "off", wrap: "off" });
    area.value = e.html?.codigo || "";
    const vista = el("iframe.ed-codigo-vista", { sandbox: "allow-scripts allow-forms allow-modals", title: "Vista previa" });
    const pintar = () => { vista.srcdoc = RT.envolverHtml(area.value); };
    let t = null;
    area.addEventListener("input", () => { clearTimeout(t); t = setTimeout(pintar, 450); });
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
    pintar();
    const r = await modal({
      titulo: "</> " + (e.nombre || "HTML"),
      clase: "ed-modal-codigo",
      ancho: 1100,
      contenido: [
        el("div.ed-codigo-barra", {}, [ejemplos, el("small", { text: "HTML, CSS y JavaScript. Va aislado: no puede tocar el librito ni el editor." })]),
        el("div.ed-codigo-caja", {}, [area, el("div.ed-codigo-marco", { style: { aspectRatio: `${e.w} / ${e.h}` } }, [vista])]),
      ],
      acciones: [["Cancelar", null], ["Guardar", () => area.value, "primario"]],
    });
    if (r != null && E.el(id)) E.setEl(id, { "html.codigo": r }, "Editar HTML");
  }
}

export { boton };
