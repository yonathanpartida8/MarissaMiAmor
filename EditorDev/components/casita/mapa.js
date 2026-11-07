/**
 * EL MAPITA DE LA CASA (Fase 72).
 *
 *   · Se abre tocando el nombre del cuarto (arriba) o desde «Más». Se ve la casa entera en fila, como una casita de
 *     muñecas: el jardín (por donde se entra) y cada cuarto con su color de pared y de piso, su nombre, y quién está ahí.
 *   · Entre cuarto y cuarto, su puertita: cada puerta lleva al cuarto de junto (así siempre coinciden).
 *   · Arrastra un cuarto a otro lugar para acomodar la casa: las puertas se reacomodan solas (y tu amorcito lo ve igual).
 *   · Toca un cuarto: ir ahí (tu monito camina por las puertas), ponerle nombre o, si lo obtuviste, quitarlo de la casa.
 *   · «Cuarto nuevo»: obtienes otro cuarto (hasta cuatro), le pones nombre y lo decoras en «Acomodar» (ventanas, focos,
 *     muebles, pared y piso).
 *   · Los nombres son sólo texto (nunca se interpretan como código).
 */
import { el, aviso } from "../ui.js";
import { CUARTOS, cuarto, inicioDe, FONDO, enLaCasa, opsFila, opsObtener } from "./cuartos.js";
import { ICO } from "./iconos.js";
import * as P from "./paneles.js";

const IDEAS = ["Cuarto de juegos", "Biblioteca", "Cuarto de música", "Gimnasio", "Cuarto de invitados", "Cuarto del bebé", "Estudio de arte", "Cine en casa"];
const limpio = (t) => String(t || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 24);

/** Los cuartos de la casa, en su orden (sin el jardín). */
export function ordenCasa(j) {
  const cfg = (k) => j.cfgCuarto(k);
  return enLaCasa(cfg).filter((c) => c.k !== "jardin").sort((a, b) => (cfg(a.k).orden ?? CUARTOS.indexOf(a)) - (cfg(b.k).orden ?? CUARTOS.indexOf(b))).map((c) => c.k);
}
/** Acomoda la casa en ese orden: las puertas se reacomodan con sus vecinos. */
function acomodar(j, orden, extra = []) {
  const { ops } = opsFila(orden);
  j.sync.ops([...extra, ...ops]);
  j._pintarCasa(j.sync.casa());
}

export function abrirMapa(j) {
  const cuerpo = el("div.ca-mapa");
  const pintar = (sel = null) => {
    const orden = ordenCasa(j), libres = CUARTOS.filter((c) => c.extra && !j.cfgCuarto(c.k).tiene);
    const dondeYo = j.yo?.gx != null ? enCuartoDe(j.yo.gx) : "", dondeSuyo = j._parejaAqui && j.suyo?.gx != null ? enCuartoDe(j.suyo.gx) : "";
    const tarjeta = (k, fija = false) => {
      const cfg = j.cfgCuarto(k), cu = cuarto(k);
      return el("div.ca-mapa-c" + (fija ? ".fija" : "") + (k === sel ? ".sel" : "") + (cu.afuera ? ".afuera" : ""), {
        role: "button", tabindex: "0", dataset: { k }, "aria-label": `${j.nombreCuarto(k)}${fija ? "" : ". Arrástralo para cambiarlo de lugar"}`,
        style: { "--pared": cfg.pared || cu.pared, "--piso": colorPiso(cfg.piso || cu.piso) },
      }, [
        el("i.ca-mapa-mini", {}, [el("i.ca-mapa-ico", { html: ICO[k] || ICO.cuartos })]),
        el("b", { text: j.nombreCuarto(k) }),
        el("span.ca-mapa-quien", {}, [k === dondeYo ? el("em.yo", { text: "Tú" }) : null, k === dondeSuyo ? el("em.suyo", { text: j.pareja }) : null].filter(Boolean)),
      ]);
    };
    const fila = el("div.ca-mapa-fila", { role: "list" }, [
      tarjeta("jardin", true),
      ...orden.map((k) => tarjeta(k)),
      libres.length ? el("button.ca-mapa-c.nuevo" + (sel === "+" ? ".sel" : ""), { type: "button", onClick: () => pintar("+") }, [el("i.ca-mapa-mini", {}, [el("i.ca-mapa-ico", { html: ICO.mas })]), el("b", { text: "Cuarto nuevo" }), el("span.ca-mapa-quien", { text: `${libres.length} por obtener` })]) : null,
    ].filter(Boolean));
    arrastrable(j, fila, (nuevo) => { acomodar(j, nuevo); j.sonar("whoosh", { volumen: 0.5 }); aviso("Listo: las puertas ya llevan a sus vecinos", 1800); pintar(sel); }, (k) => pintar(k));
    cuerpo.replaceChildren(
      el("p.ca-mapa-ayuda", { text: "Arrastra un cuarto para acomodar la casa: cada puerta lleva al cuarto de junto. Toca uno para ir, o para ponerle nombre." }),
      fila,
      detalle(j, sel, pintar),
    );
    // Que el cuarto elegido quede a la vista en la fila (sin mover la hojita).
    requestAnimationFrame(() => { const c = fila.querySelector(".ca-mapa-c.sel"); if (c) fila.scrollLeft = c.offsetLeft - (fila.clientWidth - c.offsetWidth) / 2; });
  };
  const enCuartoDe = (gx) => { let x = 0; for (const c of CUARTOS) { if (gx < x + c.w) return c.k; x += c.w; } return ""; };
  P.hoja(j, "El mapita de la casa", cuerpo, "mapa");
  pintar(j.vistaCuarto);
}

/** Lo de abajo del mapa: lo que puedes hacer con el cuarto que tocaste (o crear uno nuevo). */
function detalle(j, sel, pintar) {
  if (!sel || sel === "jardin") return el("div.ca-mapa-det", {}, [el("p.ca-mapa-tip", { text: sel === "jardin" ? "El jardín es la entrada: el primer cuarto de la fila tiene la puerta que da a él." : "" })]);
  if (sel === "+") {
    const campo = el("input.ca-campo", { type: "text", maxlength: "24", placeholder: "¿Cómo se llama?", "aria-label": "Nombre del cuarto nuevo" });
    const crear = () => {
      const libre = CUARTOS.find((c) => c.extra && !j.cfgCuarto(c.k).tiene);
      if (!libre) return;
      const nombre = limpio(campo.value) || IDEAS[0];
      const orden = [...ordenCasa(j), libre.k];
      acomodar(j, orden, [{ o: "cuarto", k: libre.k, v: { tiene: 1, nombre, t71: 1, pared: libre.pared, patron: libre.patron, piso: libre.piso } }, ...opsObtener(libre.k)]);
      j.sonar("regalo"); aviso(`¡Tienen un cuarto nuevo: ${nombre}!`, 2400);
      pintar(libre.k);
    };
    return el("div.ca-mapa-det", {}, [
      el("b.ca-mapa-t", { text: "Un cuarto nuevo para la casa" }),
      el("div.ca-mapa-ideas", {}, IDEAS.map((t) => el("button.ca-chip", { type: "button", text: t, onClick: () => { campo.value = t; campo.focus(); } }))),
      el("div.ca-mapa-nombre", {}, [campo, el("button.ca-boton.primario", { type: "button", text: "Obtenerlo", onClick: crear })]),
      el("p.ca-mapa-tip", { text: "Nace con su ventana y su foco; lo demás lo decoras tú en «Acomodar»." }),
    ]);
  }
  const k = sel, cu = cuarto(k), campo = el("input.ca-campo", { type: "text", maxlength: "24", value: j.nombreCuarto(k), "aria-label": "Nombre del cuarto" });
  const guardarNombre = () => { const n = limpio(campo.value); j.sync.op({ o: "cuarto", k, v: { nombre: n } }); j._pintarCasa(j.sync.casa()); j.sonar("pop"); pintar(k); };
  return el("div.ca-mapa-det", {}, [
    el("b.ca-mapa-t", { text: j.nombreCuarto(k) }),
    el("div.ca-mapa-acc", {}, [
      el("button.ca-boton.primario", { type: "button", onClick: () => { j.cerrarHoja(); irA(j, k); } }, [el("i", { html: ICO.cuartos }), el("span", { text: "Ir aquí" })]),
      el("button.ca-boton", { type: "button", onClick: () => { j.cerrarHoja(); j.irCuarto(k); } }, [el("i", { html: ICO.enfocar }), el("span", { text: "Sólo ver" })]),
      cu.extra ? el("button.ca-boton.peligro", { type: "button", onClick: () => { acomodar(j, ordenCasa(j).filter((q) => q !== k), [{ o: "cuarto", k, v: { tiene: 0 } }]); j.sonar("poof"); pintar(); } }, [el("i", { html: ICO.borrar }), el("span", { text: "Quitar de la casa" })]) : null,
    ].filter(Boolean)),
    el("div.ca-mapa-nombre", {}, [campo, el("button.ca-boton", { type: "button", text: "Ponerle nombre", onClick: guardarNombre })]),
  ]);
}

/** Tu monito camina hasta ese cuarto (por las puertas). */
function irA(j, k) {
  const m = j.yo; if (!m) return;
  m.orden++;
  j._caminar(m, inicioDe(k) + cuarto(k).w / 2, FONDO + 90);
  j._mandarYo?.({ accion: "", mueble: "" });
}

/** Arrastrar las tarjetas para cambiar el orden (el jardín y «nuevo» se quedan). Un toque sin arrastrar las elige.
 *  Con el dedo: se deja presionado un ratito (la tarjeta se levanta) y luego se arrastra; si deslizas de una, la fila
 *  se desplaza como siempre (para ver los cuartos de la orilla). Con mouse: se arrastra directo. */
function arrastrable(j, fila, alSoltar, alTocar) {
  let g = null;
  const levantar = () => { if (!g || g.mov) return; g.mov = true; g.c.classList.add("arrastra"); try { fila.setPointerCapture(g.id); } catch (er) { /* nada */ } try { navigator.vibrate?.(12); } catch (er) { /* nada */ } j.sonar("clic", { volumen: 0.3 }); };
  // (Mientras arrastras con el dedo, la fila no se desplaza sola.)
  fila.addEventListener("touchmove", (e) => { if (g?.mov && e.cancelable) e.preventDefault(); }, { passive: false });
  fila.addEventListener("pointerdown", (e) => {
    const c = e.target.closest(".ca-mapa-c");
    if (!c || c.classList.contains("nuevo")) return;
    g = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, mov: false, fija: c.classList.contains("fija"), dedo: e.pointerType !== "mouse" };
    if (g.dedo && !g.fija) g.t = setTimeout(levantar, 300);
  });
  fila.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0;
    if (!g.mov) {
      if (g.dedo) { if (Math.hypot(dx, e.clientY - g.y0) > 10) { clearTimeout(g.t); g.desliza = true; } return; }
      if (g.fija || Math.abs(dx) < 8 || Math.abs(e.clientY - g.y0) > Math.abs(dx)) return;
      levantar();
    }
    e.preventDefault();
    // Junto a la orilla, la fila se desplaza para que alcances los de más allá.
    const F = fila.getBoundingClientRect();
    if (e.clientX < F.left + 34) fila.scrollLeft -= 10; else if (e.clientX > F.right - 34) fila.scrollLeft += 10;
    g.c.style.transform = `translateX(${dx}px) rotate(${Math.max(-4, Math.min(4, dx / 30))}deg)`;
    // ¿Pasó la mitad de su vecino? Se cambian de lugar (y la tarjeta sigue bajo tu dedo).
    const hermanos = [...fila.querySelectorAll(".ca-mapa-c:not(.fija):not(.nuevo)")];
    for (const h of hermanos) {
      if (h === g.c) continue;
      const R = h.getBoundingClientRect(), mid = R.left + R.width / 2;
      const C = g.c.getBoundingClientRect(), cx = C.left + C.width / 2;
      if (h.compareDocumentPosition(g.c) & Node.DOCUMENT_POSITION_FOLLOWING ? cx < mid : cx > mid) {
        const antes = g.c.getBoundingClientRect().left;
        if (cx < mid) fila.insertBefore(g.c, h); else h.after(g.c);
        g.x0 += g.c.getBoundingClientRect().left - antes; g.c.style.transform = `translateX(${e.clientX - g.x0}px)`;
        j.sonar("clic", { volumen: 0.25 });
        break;
      }
    }
  });
  const fin = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const G = g; g = null; clearTimeout(G.t);
    G.c.classList.remove("arrastra"); G.c.style.transform = "";
    if (!G.mov) { if (!G.desliza) alTocar(G.c.dataset.k); return; }
    alSoltar([...fila.querySelectorAll(".ca-mapa-c:not(.fija):not(.nuevo)")].map((n) => n.dataset.k));
  };
  fila.addEventListener("pointerup", fin);
  fila.addEventListener("pointercancel", (e) => { if (g && e.pointerId === g.id) { clearTimeout(g.t); g.c.classList.remove("arrastra"); g.c.style.transform = ""; g = null; } });
  // (Al dejar presionado, que el celular no abra su menú de copiar.)
  fila.addEventListener("contextmenu", (e) => { if (e.target.closest(".ca-mapa-c")) e.preventDefault(); });
  fila.addEventListener("keydown", (e) => { const c = e.target.closest?.(".ca-mapa-c"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); alTocar(c.dataset.k); } });
}

/** Un colorcito para el piso de cada tarjeta. */
function colorPiso(p) {
  return { madera: "#c9935e", clara: "#e8c99a", mosaico: "#b9cfe0", alfombra: "#d9b8e6", barro: "#d98a5c", pasto: "#86c873", duela: "#c99a6a" }[p] || "#d8c2a8";
}
