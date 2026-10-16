/**
 * PÁGINAS PUBLICADAS — publicar el librito en tu GitHub Pages con su propio
 * enlace, actualizarlo y quitarlo, sin salir del editor.
 *
 * Lo publicado es SÓLO para ver: va sin project.json ni EditorData/ (nadie
 * puede abrirlo en el editor y llevárselo editable), con «noindex» para que no
 * salga en buscadores, y en una dirección que sólo conoce quien tenga el enlace.
 * La conexión con GitHub está en integraciones/github.js.
 */
import { el, seccion, boton, aviso, confirmar } from "../ui.js";
import { ico } from "../iconos.js";
import * as GH from "../../integraciones/github.js";

const fecha = (iso) => { try { return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

async function copiar(t) {
  try { await navigator.clipboard.writeText(t); aviso("Enlace copiado"); }
  catch (e) { prompt("Copia el enlace:", t); }
}
function compartir(t, titulo) {
  if (navigator.share) navigator.share({ title: titulo, url: t }).catch(() => {});
  else copiar(t);
}

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
    if (!cfg?.token) this._pubConectar(c);
    else this._pubPanel(c, cfg);
  },

  _pubConectar(c) {
    const repo = el("input", { type: "text", value: GH.repoDeAqui() || "yonathanpartida8/MarissaMiAmor", placeholder: "usuario/repositorio", autocomplete: "off", spellcheck: "false" });
    const token = el("input", { type: "password", placeholder: "github_pat_…", autocomplete: "off", spellcheck: "false" });
    const rama = el("input", { type: "text", placeholder: "la de GitHub Pages (automático)", autocomplete: "off", spellcheck: "false" });
    const recordar = el("input", { type: "checkbox", checked: true });
    const estado = el("small.ed-pub-estado");
    const ir = boton(I("enlace", "Conectar con GitHub"), async () => {
      const c0 = { repo: repo.value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, ""), token: token.value.trim(), rama: rama.value.trim() };
      if (!/^[\w.-]+\/[\w.-]+$/.test(c0.repo)) { estado.textContent = "Escribe el repositorio como usuario/repositorio."; return; }
      if (c0.token.length < 20) { estado.textContent = "Pega tu token de GitHub."; return; }
      ir.disabled = true; estado.textContent = "Comprobando…";
      try {
        const info = await GH.conectar(c0);
        GH.guardarConfig({ ...c0, rama: info.rama, sitio: info.sitio }, recordar.checked);
        this.app.sonidos?.sonar("exito");
        aviso("Conectado con GitHub");
        this.rehacer();
      } catch (e) { estado.textContent = e.message; this.app.sonidos?.sonar("error"); ir.disabled = false; }
    }, "primario ed-pub-btn");
    c.append(seccion("Conectar tu GitHub", [
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
          el("li", { text: "En «Permissions» → «Contents»: Read and write (y «Pages»: Read-only, para que encuentre la rama solo)." }),
          el("li", { text: "Genera el token, cópialo y pégalo aquí. Se queda sólo en este aparato." }),
        ]),
        boton(I("enlace", "Abrir la página del token"), () => open("https://github.com/settings/personal-access-tokens/new", "_blank", "noopener")),
      ]),
    ]));
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
        await app.guardarYa?.();
        const { exportar } = await import("../../export/exportar.js");
        const { leerZip } = await import("../../export/zip.js");
        const { blob } = await exportar(app, { alProgreso: poner });
        const zip = await leerZip(blob);
        const archivos = [];
        for (const [r, leer] of Object.entries(zip)) {
          // Sólo lo que hace falta para VERLO: nada del proyecto editable.
          if (r.endsWith("/") || r === "project.json" || r.startsWith("EditorData/")) continue;
          archivos.push({ ruta: r, datos: await leer() });
        }
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
            boton(ico("ver"), () => open(p.enlace, "_blank", "noopener"), "", "Abrir"),
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
    c.append(seccion("Conexión", [
      el("small.ed-nota.suave", { text: `Conectado a ${cfg.repo} (rama ${cfg.rama}).` }),
      boton(I("salir", "Desconectar este aparato"), () => { GH.olvidarConfig(); aviso("Se olvidó el token de este aparato"); this.rehacer(); }),
    ], { abierta: "plegada" }));
    cargar();
  },
};
