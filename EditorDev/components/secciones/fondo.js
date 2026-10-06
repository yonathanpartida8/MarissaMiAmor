/**
 * FONDO CON HTML — fondos animados, partículas, degradados, canvas…
 *
 * Va DETRÁS de todo lo de la página y en el editor no recibe toques (nunca
 * estorba al elegir o mover). Se elige de una galería (los de aquí y los de
 * assets/fondos/), con previsualización y «Atrás · Usar», o se pega uno propio.
 * En el librito puede ser tocable si se pide.
 */
import { el, seccion, fila, boton, control, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import { extras } from "../../recursos/extras.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** Unos fondos listos (pequeñitos: se ven todo el tiempo). */
export const FONDOS = {
  "Degradado vivo": `<style>html,body{margin:0;height:100%}body{background:linear-gradient(120deg,#ffd1e3,#ffe9d6,#e3d9ff,#d6f2ff);background-size:300% 300%;animation:m 14s ease-in-out infinite}@keyframes m{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}@media (prefers-reduced-motion:reduce){body{animation:none}}</style>`,
  "Burbujas": `<style>html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#e9f6ff,#fbe9f5)}i{position:absolute;bottom:-60px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,rgba(255,255,255,.15) 60%,rgba(255,170,210,.35));animation:s linear infinite}@keyframes s{to{transform:translateY(-120vh)}}</style><script>for(let i=0;i<16;i++){const b=document.createElement("i"),t=12+Math.random()*44;b.style.cssText="left:"+Math.random()*100+"%;width:"+t+"px;height:"+t+"px;animation-duration:"+(8+Math.random()*10)+"s;animation-delay:"+(-Math.random()*18)+"s";document.body.append(b)}<\/script>`,
  "Brillitos": `<style>html,body{margin:0;height:100%;overflow:hidden;background:#24163a}canvas{display:block;width:100%;height:100%}</style><canvas id="c"></canvas><script>const c=document.getElementById("c"),g=c.getContext("2d");let W,H,p=[];const d=Math.min(2,devicePixelRatio||1);function m(){W=c.width=innerWidth*d;H=c.height=innerHeight*d;p=Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*2+.5)*d,v:(Math.random()*.3+.1)*d,f:Math.random()*6}))}addEventListener("resize",m);m();(function q(t){g.clearRect(0,0,W,H);for(const s of p){s.y-=s.v;if(s.y<0)s.y=H;g.globalAlpha=.4+.6*Math.abs(Math.sin(s.f+t/900));g.fillStyle="#ffd6ec";g.beginPath();g.arc(s.x,s.y,s.r,0,6.3);g.fill()}requestAnimationFrame(q)})(0)<\/script>`,
};

export const FONDO_HTML = {
  _fondoHtml(c) {
    const E = this.E;
    const app = this.app;
    const f = E.pagina?.fondo?.html;
    const hay = !!(f && (String(f.codigo || "").trim() || f.ruta));
    const usar = (fondo, nombre, todas) => {
      if (todas) E.transaccion("Fondo en todas", () => { for (const pid of this.P.orden) E.setPag({ "fondo.html": fondo }, "Fondo con HTML", null, pid); });
      else E.setPag({ "fondo.html": fondo }, "Fondo con HTML");
      aviso(fondo ? `Fondo «${nombre}» puesto${todas ? " en todas las páginas" : ""}` : "Fondo animado quitado");
    };
    const previa = (nombre, fondo, src) => {
      const marco = el("iframe.ed-fondo-previa", { title: nombre, tabindex: "-1", ...(src ? { src } : { sandbox: "allow-scripts", srcdoc: RT.envolverHtml(fondo.codigo) }) });
      let todas = false;
      const seg = el("div.ed-seg", {}, [["una", "Esta página"], ["todas", "Todas"]].map(([v, t]) => el("button" + (v === "una" ? ".on" : ""), { type: "button", text: t, onClick: (ev) => { todas = v === "todas"; for (const x of seg.children) x.classList.toggle("on", x === ev.currentTarget); } })));
      hojita({
        titulo: "Previsualización del fondo",
        contenido: [el("div.ed-fondo-marco", {}, [marco]), el("b", { text: nombre }), el("div.ed-fila", {}, [el("span.ed-et", { text: "Usarlo en" }), seg])],
        acciones: [[I("volver", "Atrás"), null], [I("ok", "Usar"), "usar", "primario"]],
      }).then((r) => { if (r === "usar") usar({ nombre, ...fondo, interactivo: false }, nombre, todas); });
    };
    const tile = (nombre, fondo, mini) => el("button.ed-fondo-t", { type: "button", title: nombre, onClick: () => previa(nombre, fondo, fondo.ruta ? rutaAUrl(fondo.ruta) : null) }, [
      mini ? el("img", { src: mini, alt: "", loading: "lazy" }) : el("i", { html: ico("fondo") }),
      el("span", { text: nombre }),
    ]);
    const rej = el("div.ed-fondos", {}, Object.entries(FONDOS).map(([n, codigo]) => tile(n, { codigo })));
    extras().then((ex) => {
      for (const it of ex.fondos) {
        if (it.tipo === "html") rej.append(tile(it.nombre, { ruta: it.ruta, base: it.base, lista: it.archivos }, it.miniatura ? rutaAUrl(it.miniatura) : null));
      }
    });
    const actual = hay ? [
      el("div.ed-bloque", {}, [el("b", { html: ico("fondo") }), el("span", { text: f.nombre || (f.ruta ? f.ruta.split("/").slice(-2, -1)[0] : "Tu HTML") }),
        boton(I("editar", "Editar"), () => app.html.abrirFondo(), "chico"),
        boton(I("borrar", "Quitar"), () => usar(null), "chico")]),
      fila("Se puede tocar (en el librito)", control(this.v, { tipo: "toggle", leer: () => !!E.pagina?.fondo?.html?.interactivo, escribir: (x) => E.setPag({ "fondo.html.interactivo": x }, "Fondo tocable") }), "si es interactivo (por ejemplo, partículas que siguen al dedo)"),
    ] : [];
    c.append(seccion("Fondo animado (HTML)", [
      ...actual,
      rej,
      el("div.ed-botonera", {}, [boton(I("html", hay ? "Editar su HTML" : "Pegar mi propio HTML"), () => app.html.abrirFondo(), "chico")]),
      el("small.ed-ayuda", { text: "Va detrás de todo y no estorba al editar. Deja los tuyos en assets/fondos/<nombre>/index.html y aparecen aquí." }),
    ]));
  },
};
