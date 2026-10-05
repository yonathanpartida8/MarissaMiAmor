/**
 * LÍNEA DE TIEMPO — cuándo entra cada cosa y cuánto tarda.
 *
 * Una fila por elemento animado. La barra rosa es la entrada: arrastrarla
 * cambia el retraso y estirar su borde cambia la duración. La morada es la
 * animación propia y la rayada, el bucle que sigue después. Tocando la
 * regla de arriba se ve la página en ese instante.
 */
import { el, boton } from "../components/ui.js";

const RT = window.LibritoRT;

export class Linea {
  constructor(app, raiz) {
    this.app = app;
    this.E = app.estado;
    this.raiz = raiz;
    this.abierta = false;
    this.anim = null;
    this.t = 0;
    const re = () => { if (this.abierta) { cancelAnimationFrame(this._r); this._r = requestAnimationFrame(() => this.pintar()); } };
    this.E.on("el", ({ ruta }) => { if (!ruta || /^anim|^nombre|^oculto/.test(ruta)) re(); });
    this.E.on("els", re);
    this.E.on("actual", () => { this.parar(); re(); });
    this.E.on("sel", re);
  }

  alternar(forzar) {
    this.abierta = forzar ?? !this.abierta;
    this.raiz.hidden = !this.abierta;
    document.body.classList.toggle("con-linea", this.abierta);
    if (this.abierta) this.pintar(); else this.parar();
  }

  _escala(total) { return Math.max(3000, Math.ceil((total + 800) / 1000) * 1000); }

  pintar() {
    const p = this.E.pagina;
    const r = this.raiz;
    r.textContent = "";
    if (!p) return;
    const els = [...p.els].reverse().filter((e) => !e.oculto);
    let total = 0;
    for (const e of els) total = Math.max(total, RT.finEntrada(e));
    const T = this._escala(total);
    this.T = T;
    const pct = (ms) => (ms / T) * 100 + "%";
    const cab = el("div.ed-tl-cab", {}, [
      el("b", { text: "⏱ Línea de tiempo" }),
      boton(this.anim ? "⏹ Parar" : "▶ Reproducir", () => (this.anim ? this.parar() : this.probar()), "chico" + (this.anim ? "" : " primario")),
      el("small", { text: `${(total / 1000).toFixed(1)} s de entrada` }),
      boton("✕", () => this.alternar(false), "ico", "Cerrar"),
    ]);
    const regla = el("div.ed-tl-regla");
    for (let s = 0; s <= T; s += 500) regla.append(el("i" + (s % 1000 ? ".m" : ""), { style: { left: pct(s) }, text: s % 1000 ? "" : s / 1000 + "s" }));
    this.cabezal = el("div.ed-tl-cabezal", { style: { left: pct(this.t) } });
    const filas = el("div.ed-tl-filas");
    for (const e of els) {
      const a = e.anim || {};
      const pista = el("div.ed-tl-pista");
      const en = a.entrada;
      const tieneEn = en && en.tipo && en.tipo !== "ninguna";
      let fin = 0;
      if (tieneEn) {
        const ret = en.retraso || 0, dur = en.dur || 800;
        fin = ret + dur;
        const barra = el("div.ed-tl-barra.entrada", { style: { left: pct(ret), width: pct(dur) }, title: `${RT.ANIM.entrada[en.tipo]?.n || en.tipo}: empieza en ${ret} ms, dura ${dur} ms` }, [el("span", { text: RT.ANIM.entrada[en.tipo]?.n || "" }), el("i.ed-tl-borde")]);
        this._arrastre(barra, e, "anim.entrada", ret, dur, T);
        pista.append(barra);
      }
      const pr = a.propia;
      if (pr && (pr.raw || pr.fotogramas)) {
        const ret = pr.retraso || 0, dur = pr.dur || 1000;
        const barra = el("div.ed-tl-barra.propia", { style: { left: pct(ret), width: pct(dur) }, title: "Animación propia" }, [el("span", { text: "propia" }), el("i.ed-tl-borde")]);
        this._arrastre(barra, e, "anim.propia", ret, dur, T);
        pista.append(barra);
        fin = Math.max(fin, ret + dur);
      }
      const bu = a.bucle;
      if (bu && bu.tipo && bu.tipo !== "ninguno") {
        const ini = fin + (bu.retraso || 0);
        pista.append(el("div.ed-tl-barra.bucle", { style: { left: pct(ini), right: "0" }, title: "Se repite: " + (RT.ANIM.bucle[bu.tipo]?.n || "") }, [el("span", { text: "↻ " + (RT.ANIM.bucle[bu.tipo]?.n || "") })]));
      }
      if (!pista.childElementCount) pista.append(el("small.ed-tl-nada", { text: "sin animación · elige y ve a ✨" }));
      const fila = el("div.ed-tl-fila" + (this.E.sel.includes(e.id) ? ".on" : ""), {}, [el("button.ed-tl-nombre", { type: "button", text: e.nombre, onClick: () => this.E.seleccionar([e.id]) }), pista]);
      filas.append(fila);
    }
    if (!els.length) filas.append(el("p.ed-vacio-txt", { text: "Nada que animar en esta página todavía." }));
    const cuerpo = el("div.ed-tl-cuerpo", {}, [el("div.ed-tl-esq"), regla, filas, this.cabezal]);
    regla.addEventListener("pointerdown", (ev) => this._buscar(ev, regla));
    r.append(cab, cuerpo);
  }

  _arrastre(barra, e, base, ret0, dur0, T) {
    barra.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const borde = ev.target.classList.contains("ed-tl-borde");
      const ancho = barra.parentElement.getBoundingClientRect().width;
      const x0 = ev.clientX;
      const fin = this.E.gesto(borde ? "Duración" : "Retraso");
      barra.setPointerCapture(ev.pointerId);
      const mover = (m) => {
        const d = Math.round((((m.clientX - x0) / ancho) * T) / 50) * 50;
        if (borde) this.E.setEl(e.id, { [base + ".dur"]: Math.max(50, dur0 + d) }, "Duración");
        else this.E.setEl(e.id, { [base + ".retraso"]: Math.max(0, ret0 + d) }, "Retraso");
      };
      const soltar = () => { barra.removeEventListener("pointermove", mover); barra.removeEventListener("pointerup", soltar); barra.removeEventListener("pointercancel", soltar); fin(); };
      barra.addEventListener("pointermove", mover);
      barra.addEventListener("pointerup", soltar);
      barra.addEventListener("pointercancel", soltar);
    });
  }

  _buscar(ev, regla) {
    const r = regla.getBoundingClientRect();
    const ir = (x) => {
      this.t = Math.max(0, Math.min(this.T, ((x - r.left) / r.width) * this.T));
      if (!this.anim || !this.anim.quieto) this._preparar(null, true);
      this.anim.ir(this.t);
      this.cabezal.style.left = (this.t / this.T) * 100 + "%";
    };
    ir(ev.clientX);
    const m = (e) => ir(e.clientX);
    const u = () => { removeEventListener("pointermove", m); removeEventListener("pointerup", u); };
    addEventListener("pointermove", m);
    addEventListener("pointerup", u);
  }

  _preparar(ids, quieto) {
    this.parar(false);
    const L = this.app.lienzo;
    if (!L.pag) return null;
    const p = this.E.pagina;
    const pagina = ids ? { ...p, els: p.els.filter((e) => ids.includes(e.id)) } : p;
    this.anim = new RT.Animador(pagina, L.pag.nodos);
    this.anim.componentes = [];
    this.anim.entrar();
    this.anim.quieto = !!quieto;
    if (quieto) this.anim.pausar();
    document.body.classList.add("animando");
    return this.anim;
  }

  /** Reproduce las entradas (de todo o de unos pocos) sobre el lienzo. */
  probar(ids) {
    const a = this._preparar(ids || null, false);
    if (!a) return;
    if (this.abierta) this.pintar();
    const t0 = performance.now();
    const fin = Math.max(a.total + 1500, 2500);
    const paso = () => {
      if (this.anim !== a) return;
      this.t = performance.now() - t0;
      if (this.cabezal) this.cabezal.style.left = Math.min(100, (this.t / (this.T || 3000)) * 100) + "%";
      if (this.t < fin) this._raf = requestAnimationFrame(paso);
      else this.parar();
    };
    this._raf = requestAnimationFrame(paso);
  }

  parar(repintar = true) {
    cancelAnimationFrame(this._raf);
    if (this.anim) { this.anim.cancelar(); this.anim = null; }
    document.body.classList.remove("animando");
    if (repintar && this.abierta) this.pintar();
  }
}
