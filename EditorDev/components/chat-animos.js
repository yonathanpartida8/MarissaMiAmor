/**
 * LOS ÁNIMOS DEL CHAT (Fases 36 y 37): Happy, Sad, Enojado y Hormonal.
 *
 *   · Tocas uno y se enciende; si lo vuelves a tocar, se apaga y todo vuelve a ser como siempre.
 *     Al cambiar de uno a otro, lo del anterior se va (despacito) antes de que llegue lo nuevo.
 *   · Lo que se mueve vive en una capa DETRÁS de todo (de los mensajes, la barra y los botones),
 *     casi siempre en las orillas: nunca tapa un mensajito ni se mete donde tocas.
 *   · Hormonal, además, anima los mensajitos según el género de quien los manda (lo elige cada quien
 *     en su perfil; nunca se adivina): «Mujer» → rosa pastel (salpica agüita, late y escurre);
 *     cualquier otro → carmesí (se estira, late como corazón acelerado y escurre). Al apagarlo,
 *     los mensajitos se enfrían tantito y vuelven a ser los de siempre.
 *   · Sólo se anima transform y opacity (rápido en el celular), y cada gotita se borra al terminar.
 *     Con «menos movimiento» (o el aparato sufriendo) sólo cambian los colores.
 */
import { sinMovimiento as reducido } from "./transiciones.js";
import { R } from "./rendimiento.js";

const az = (a, b) => a + Math.random() * (b - a);
const sg = (v) => v.toFixed(2) + "s";
/** En las orillas: un poquito a la izquierda o un poquito a la derecha. */
const orilla = (i) => (i % 2 ? az(90, 97) : az(1, 6)).toFixed(1) + "%";
function P(clase, estilo = "", html = "") {
  const n = document.createElement("i");
  if (clase) n.className = clase;
  if (estilo) n.setAttribute("style", estilo);
  if (html) n.innerHTML = html;
  return n;
}

const SOL = `<svg viewBox="0 0 120 120"><defs><radialGradient id="anSol"><stop offset="0" stop-color="#fff7cf"/><stop offset=".6" stop-color="#ffd86e"/><stop offset="1" stop-color="#ffbb52"/></radialGradient></defs><g class="an-rayos" stroke="#ffcb63" stroke-width="5" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<line x1="60" y1="12" x2="60" y2="${i % 2 ? 22 : 26}" transform="rotate(${i * 30} 60 60)"/>`).join("")}</g><circle cx="60" cy="60" r="25" fill="url(#anSol)"/></svg>`;
const FLOR = (c, m = "#ffd66b") => `<svg viewBox="0 0 40 40">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="10.5" rx="6.4" ry="9" fill="${c}" transform="rotate(${a} 20 20)"/>`).join("")}<circle cx="20" cy="20" r="5.2" fill="${m}"/></svg>`;
const NUBE = '<svg viewBox="0 0 120 60"><path d="M26 54h66a18 18 0 0 0 2-35.9A26 26 0 0 0 44.6 14 20 20 0 0 0 26 54z"/></svg>';
const RAYO = '<svg viewBox="0 0 24 48"><path d="M14 1 3 27h8l-4 20 14-28h-8l5-18z" fill="#ffe7a3" stroke="#ffb44d" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const VENA = '<svg viewBox="0 0 24 24"><path d="M9.5 3.5c.4 3-1.4 5-4.4 5.4M14.5 3.5c-.4 3 1.4 5 4.4 5.4M9.5 20.5c.4-3-1.4-5-4.4-5.4M14.5 20.5c-.4-3 1.4-5 4.4-5.4" fill="none" stroke="#ff5b4a" stroke-width="2.6" stroke-linecap="round"/></svg>';
const PETALO = '<svg viewBox="0 0 24 30"><defs><linearGradient id="anPetalo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6f8e"/><stop offset="1" stop-color="#c3123c"/></linearGradient></defs><path d="M12 1C21 7 23 18 12 29 1 18 3 7 12 1z" fill="url(#anPetalo)"/><path d="M12 6c2.6 5 2.6 11 0 18" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/></svg>';
const CORA = '<svg viewBox="0 0 24 22"><path d="M12 21S1.5 14.4 1.5 7.4A5.4 5.4 0 0 1 12 4.6a5.4 5.4 0 0 1 10.5 2.8C22.5 14.4 12 21 12 21z" fill="currentColor"/></svg>';
const ONDA = `<svg viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 18${" q25-12 50 0 t50 0".repeat(4)}"/><path d="M0 30${" q25-9 50 0 t50 0".repeat(4)}" opacity=".6"/></svg>`;

/** Cada ánimo arma su escena: `mov` es si se puede mover; `luego` agenda algo (y se cancela al apagarlo). */
const ESCENAS = {
  // Un sol sin carita en la esquina y florecitas que se mecen en las orillas.
  happy(e, mov) {
    e.append(P("an-sol", "", SOL));
    const tonos = ["#ffb3cf", "#d2c2ff", "#ffffff", "#ffcfa6", "#bfe8cc"];
    [[3, 22], [93, 40], [4, 55], [94, 68], [2, 82], [6, 11]].forEach(([x, y], i) =>
      e.append(P("an-flor", `--x:${x}%;--y:${y}%;--t:${Math.round(az(16, 26))}px;--d:${sg(az(3.6, 6))};--r:-${sg(az(0, 4))}`, FLOR(tonos[i % 5]))));
    if (mov) for (let i = 0; i < 3; i++)
      e.append(P("an-flor sube", `--x:${orilla(i)};--t:${Math.round(az(12, 18))}px;--d:${sg(az(15, 21))};--r:-${sg(az(0, 15))};--dx:${Math.round(az(-14, 14))}px`, FLOR(tonos[(i + 2) % 5])));
  },
  // Nubecitas que van y vienen y una lluvia suave, detrás de los mensajes.
  sad(e, mov) {
    [[-8, 10, 150, 22, 13], [60, 7, 170, -26, 17], [24, 17, 110, 18, 11]].forEach(([x, y, t, dx, d]) =>
      e.append(P("an-nube", `--x:${x}%;--y:${y}%;--t:${t}px;--dx:${dx}px;--d:${d}s;--r:-${sg(az(0, d))}`, NUBE)));
    if (mov) for (let i = 0; i < 16; i++) e.append(P("an-gotita", `--x:${az(2, 98).toFixed(1)}%;--d:${sg(az(1.3, 2))};--r:-${sg(az(0, 2))}`));
  },
  // Enojado: nubes de tormenta con algún relámpago suave, vapor que sube por las orillas y venitas
  // de enojo que aparecen y se van. Al entrar, un destello rojo y la tormenta se sacude tantito.
  enojado(e, mov, luego) {
    e.append(P("an-luz"));
    [[-10, 8, 160, 18, 12], [58, 5, 180, -22, 15]].forEach(([x, y, t, dx, d]) =>
      e.append(P("an-nube tormenta", `--x:${x}%;--y:${y}%;--t:${t}px;--dx:${dx}px;--d:${d}s;--r:-${sg(az(0, d))}`, NUBE)));
    if (!mov) return;
    const entrada = [P("an-furia")];
    e.append(...entrada);
    luego(() => entrada.forEach((n) => n.remove()), 1600);
    e.append(P("an-relampago", `--d:${sg(az(7, 9))};--r:-${sg(az(2, 5))}`), P("an-rayo", `--x:${az(18, 70).toFixed(1)}%;--d:${sg(az(7, 9))};--r:-${sg(az(2, 5))}`, RAYO));
    for (let i = 0; i < 4; i++) e.append(P("an-vapor", `--x:${orilla(i)};--t:${Math.round(az(22, 34))}px;--dx:${Math.round(az(6, 16)) * (i % 2 ? -1 : 1)}px;--d:${sg(az(4.5, 6.5))};--r:-${sg(az(0, 6))}`));
    for (let i = 0; i < 3; i++) e.append(P("an-vena", `--x:${orilla(i + 1)};--y:${az(22, 78).toFixed(1)}%;--t:${Math.round(az(14, 20))}px;--d:${sg(az(6, 9))};--r:-${sg(az(0, 8))}`, VENA));
  },
  // Destello carmesí con pétalos y chispitas al entrar; luego brasas que suben por las orillas,
  // ondas de calor, pétalos de vez en cuando, corazoncitos que aparecen y se van y una brisa que quema.
  hormonal(e, mov, luego) {
    e.append(P("an-luz"));
    if (!mov) return;
    const entrada = [P("an-carmesi")];
    for (let i = 0; i < 9; i++) entrada.push(P("an-petalo cae", `--x:${(i % 2 ? az(62, 95) : az(2, 36)).toFixed(1)}%;--y:${az(8, 22).toFixed(1)}%;--t:${Math.round(az(12, 18))}px;--dx:${Math.round(az(-40, 40))}px;--g:${Math.round(az(-200, 200))}deg;--d:${sg(az(1.6, 2.3))};--r:${sg(az(0, 0.5))}`, PETALO));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      entrada.push(P("an-brillo", `--dx:${Math.round(Math.cos(a) * az(60, 120))}px;--dy:${Math.round(Math.sin(a) * az(50, 100) - 40)}px;--d:${sg(az(0.8, 1.2))};--r:${sg(az(0.1, 0.4))}`));
    }
    e.append(...entrada);
    luego(() => entrada.forEach((n) => n.remove()), 2700);
    for (let i = 0; i < 10; i++) e.append(P("an-chispa", `--x:${orilla(i)};--t:${Math.round(az(4, 8))}px;--dx:${Math.round(az(8, 22)) * (i % 2 ? -1 : 1)}px;--d:${sg(az(9, 14))};--r:-${sg(az(0, 13))}`));
    for (let i = 0; i < 4; i++) e.append(P("an-chispa brisa", `--x:${orilla(i + 1)};--t:${Math.round(az(3, 5))}px;--dx:${Math.round(az(40, 70)) * (i % 2 ? 1 : -1)}px;--d:${sg(az(6, 9))};--r:-${sg(az(0, 8))}`));
    [12, 30].forEach((y, i) => e.append(P("an-onda", `--y:${y}%;--d:${sg(az(5, 6.5))};--r:-${sg(i * 2.8)}`, ONDA)));
    for (let i = 0; i < 4; i++) e.append(P("an-petalo ronda", `--x:${orilla(i)};--y:${az(10, 30).toFixed(1)}%;--t:${Math.round(az(11, 15))}px;--dx:${Math.round(az(-18, 18))}px;--g:${Math.round(az(90, 260))}deg;--d:${sg(az(13, 19))};--r:-${sg(az(0, 18))}`, PETALO));
    for (let i = 0; i < 5; i++) e.append(P("an-cora", `--x:${orilla(i + 1)};--y:${az(20, 80).toFixed(1)}%;--t:${Math.round(az(10, 15))}px;--d:${sg(az(6, 9))};--r:-${sg(az(0, 8))}`, CORA));
  },
};

/**
 * Los ánimos de un chat. `raiz` es la pantalla del chat, `marco` lo que rodea la lista y `tono(mio)`
 * dice el color de quien manda («rosa» o «carmesi»).
 */
export function animosChat({ raiz, marco, lista, tono }) {
  const capa = document.createElement("div");
  capa.className = "an-capa";
  capa.setAttribute("aria-hidden", "true");
  raiz.prepend(capa);
  let actual = "", escena = null;
  const relojes = new Set(), vivas = new Set(), cajas = new Set();
  const luego = (fn, ms) => { const id = setTimeout(() => { relojes.delete(id); fn(); }, ms); relojes.add(id); };
  const seguir = (a) => { vivas.add(a); a.onfinish = a.oncancel = () => vivas.delete(a); return a; };
  const tonos = () => {
    raiz.classList.toggle("yo-rosa", tono(true) === "rosa");
    raiz.classList.toggle("ella-rosa", tono(false) === "rosa");
  };
  const burbuja = (f) => (f?.isConnected && !f.classList.contains("borrado") ? f.querySelector(".ch-burbuja:not(.eliminado)") : null);
  const sombra = (b) => getComputedStyle(b).boxShadow;
  const brillo = (t) => (t === "rosa" ? "rgba(255, 170, 205, .65)" : "rgba(255, 30, 80, .6)");
  /** Una cajita del tamaño de la burbuja (en su fila) para sus gotitas: no mueve nada y se borra sola. */
  function caja(f, b, t, ms) {
    let x = 0, y = 0, n = b;
    while (n && n !== f) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    if (n !== f) { const rf = f.getBoundingClientRect(), rb = b.getBoundingClientRect(); x = rb.left - rf.left; y = rb.top - rf.top; }
    const c = document.createElement("div");
    c.className = "an-liquido " + t;
    c.style.cssText = `left:${x}px;top:${y}px;width:${b.offsetWidth}px;height:${b.offsetHeight}px`;
    f.append(c);
    cajas.add(c);
    setTimeout(() => { c.remove(); cajas.delete(c); }, ms);
    return c;
  }

  /** El mensajito «líquido» de Hormonal (al mandarlo y al encenderlo). */
  function liquido(f) {
    const b = burbuja(f);
    if (!b) return;
    const mio = f.classList.contains("mio"), t = tono(mio), rosa = t === "rosa";
    const w = b.offsetWidth, h = b.offsetHeight, c = caja(f, b, t, 2800);
    // Rosa: primero salpica agüita alrededor (sin estirarse).
    if (rosa) for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + az(-0.2, 0.2);
      c.append(P("an-salpica", `--x:${(50 + Math.cos(a) * 50).toFixed(1)}%;--y:${(50 + Math.sin(a) * 50).toFixed(1)}%;--t:${Math.round(az(4, 7))}px;--dx:${Math.round(Math.cos(a) * az(10, 18))}px;--dy:${Math.round(Math.sin(a) * az(8, 14))}px;--r:${sg(az(0, 0.12))}`));
    }
    // Luego escurre por la orilla de abajo: chorritos, gotas que se resbalan y salpican al caer.
    const r0 = rosa ? 0.55 : 0.35, n = w > 150 ? 4 : w > 80 ? 3 : 2;
    c.append(P("an-borde", `--r:${sg(r0 - 0.1)}`), P("an-lado", `--h:${Math.round(h * 0.7)}px;--r:${sg(r0 + 0.2)}`));
    for (let i = 0; i < n; i++) {
      const x = (((i + 0.5) / n) * 76 + 12 + az(-5, 5)).toFixed(1), ww = (rosa ? az(4, 5.5) : az(5.5, 8)).toFixed(1), hh = Math.round(az(9, rosa ? 16 : 22)), r = r0 + az(0, 0.3);
      const st = `--x:${x}%;--w:${ww}px;--h:${hh}px;--r:${sg(r)}`;
      c.append(P("an-chorro", st), P("an-gota", st));
      if (!rosa || i % 2) for (const dx of [-9, 9]) c.append(P("an-salpica", `--x:${x}%;--y:calc(100% + ${hh + 26}px);--t:3px;--dx:${dx}px;--dy:-6px;--r:${sg(r + 1.45)}`));
    }
    const base = sombra(b), luz = brillo(t), origen = mio ? "100% 100%" : "0% 100%";
    seguir(b.animate([{ boxShadow: base }, { boxShadow: `0 0 0 2px ${luz}, 0 0 30px 4px ${luz}`, offset: 0.35 }, { boxShadow: base }], { duration: 1800, easing: "ease-in-out" }));
    const pasos = rosa
      ? [["scale(1)", 0], ["scale(1.045)", 0.22], ["scale(.995)", 0.42], ["scale(1.03)", 0.62], ["scale(1)", 0.86], ["scale(1)", 1]]
      : [["none", 0], ["scale(1.1, .9)", 0.16], ["scale(.95, 1.06)", 0.3], ["scale(1.02, .99)", 0.4], ["scale(1.06)", 0.54], ["scale(1)", 0.64], ["scale(1.045)", 0.74], ["none", 0.88], ["none", 1]];
    seguir(b.animate(pasos.map(([transform, offset]) => ({ transform, offset, transformOrigin: origen })), { duration: rosa ? 1100 : 1500, delay: rosa ? 380 : 0, easing: "ease-in-out" }));
  }
  /** Al llegarte uno en Hormonal: un pulso tibio y un corazoncito del color de quien lo manda. */
  function pulso(f) {
    const b = burbuja(f);
    if (!b) return;
    const t = tono(f.classList.contains("mio")), base = sombra(b), luz = brillo(t);
    seguir(b.animate([{ boxShadow: base, transform: "scale(1)" }, { boxShadow: `0 0 0 2px ${luz}, 0 0 24px 2px ${luz}`, transform: "scale(1.025)", offset: 0.4 }, { boxShadow: base, transform: "scale(1)" }], { duration: 900, easing: "ease-in-out" }));
    caja(f, b, t, 1400).append(P("an-corita", "", CORA));
  }
  /** Al apagar Hormonal: se enfrían tantito (un velo helado en las orillas y un temblorcito) y listo. */
  function frio() {
    if (reducido()) return;
    const velo = P("an-escarcha");
    marco.append(velo);
    setTimeout(() => velo.remove(), 1200);
    const r = lista.getBoundingClientRect();
    const bs = [...lista.querySelectorAll(".ch-fila:not(.borrado) .ch-burbuja")].filter((b) => { const q = b.getBoundingClientRect(); return q.bottom > r.top && q.top < r.bottom; }).slice(-12);
    for (const b of bs) seguir(b.animate([
      { filter: "saturate(.35) brightness(1.15)", boxShadow: "0 0 0 1.5px rgba(200, 230, 255, .85), 0 0 18px rgba(170, 215, 255, .6)", transform: "none" },
      { transform: "translateX(-1.2px)", offset: 0.18 }, { transform: "translateX(1.2px)", offset: 0.32 }, { transform: "translateX(-.6px)", offset: 0.46 },
      { filter: "none", boxShadow: sombra(b), transform: "none" },
    ], { duration: 1000, easing: "ease-out" }));
  }
  /** Los últimos que se ven de cada quien (para que al encender Hormonal se note en los dos). */
  function ultimos() {
    const r = lista.getBoundingClientRect(), fs = [...lista.querySelectorAll(".ch-fila:not(.borrado)")].reverse();
    return ["mio", "suyo"].map((k) => fs.find((f) => f.classList.contains(k) && burbuja(f)))
      .filter((f) => { if (!f) return false; const q = f.getBoundingClientRect(); return q.bottom > r.top && q.top < r.bottom; });
  }

  function apagar() {
    for (const id of relojes) clearTimeout(id);
    relojes.clear();
    for (const a of [...vivas]) a.cancel();
    for (const c of cajas) c.remove();
    cajas.clear();
    raiz.classList.remove("animo-" + actual, "yo-rosa", "ella-rosa");
    delete raiz.dataset.animo;
    const e = escena;
    escena = null;
    if (e) { e.classList.add("sale"); setTimeout(() => e.remove(), 450); }
  }
  function encender(id) {
    const mov = !reducido() && !R.ahorro;
    if (id === "hormonal") tonos();
    raiz.classList.add("animo-" + id);
    raiz.dataset.animo = id;
    escena = document.createElement("div");
    escena.className = "an-escena " + id + (mov ? "" : " quieta");
    ESCENAS[id](escena, mov, luego);
    capa.append(escena);
    if (id === "hormonal" && mov) ultimos().forEach((f, i) => luego(() => liquido(f), 650 + i * 380));
  }

  return {
    get actual() { return actual; },
    /** Toca un ánimo: lo enciende, o lo apaga si ya estaba. Devuelve el que quedó («» = ninguno). */
    poner(id) {
      const nuevo = id === actual ? "" : id, antes = actual;
      if (antes) apagar();
      actual = nuevo;
      if (antes === "hormonal") frio();
      if (nuevo) encender(nuevo);
      return nuevo;
    },
    /** Tu mensajito recién mandado (espera a que aterrice). */
    mando(f) { if (actual === "hormonal" && !reducido() && f) { tonos(); luego(() => liquido(f), 720); } },
    /** Uno que te llegó. */
    llego(f) { if (actual === "hormonal" && !reducido() && f) { tonos(); luego(() => pulso(f), 450); } },
    limpiar() { if (actual) apagar(); actual = ""; capa.remove(); },
  };
}
