/**
 * LA COCINA Y LA MESA (Fase 54): elegir qué cocinar, cocinarlo (sartén, olla, horno, asador, micro o
 * licuadora), servirlo en una mesa (un plato de cada lado: para los dos) y comer juntitos sentados.
 * Lo servido vive en el estado de la mesa, un lugar por clave (`e.p0`, `e.p1`…: así, si los dos comen a la
 * vez, nadie le borra los bocados al otro), y se guarda solo, se mueve con la mesa y tu amorcito lo ve al
 * momento. `j` es el juego (index.js).
 */
import { el } from "../ui.js";
import { vibrar } from "../../integraciones/plataforma.js";
import { COSAS_MANO, RECETAS, baseDe } from "./catalogo/index.js";

export const BOCADOS = 3;
const SONIDO_DE = { sarten: "sarten", olla: "burbujas", horno: "tic", parrilla: "sarten", micro: "micro", licuadora: "licuadora" };
const hayComida = (p) => !!(p && RECETAS[p.k] && (p.b | 0) > 0);
const platosDe = (r) => (r?.d.superficie || []).map((_, i) => r.o.e?.["p" + i] || null);
/** Dónde queda (en todo el mundo) el lugar `i` de la mesa (la mesa volteada lo refleja). */
const lugarPlato = (r, i) => { const [x] = r.d.superficie[i]; return r.gx - r.d.w / 2 + (r.o.f ? r.d.w - x : x); };

/** Los platitos servidos (dentro del dibujo de la mesa: se mueven y se van con ella). */
export function pintarPlatos(r) {
  const lugares = r.d.superficie;
  if (!lugares) return;
  const platos = platosDe(r), firma = JSON.stringify(platos) + (r.o.f ? "f" : "");
  if (r._firmaPlatos === firma) return;
  r._firmaPlatos = firma;
  r.platosN ||= r.n.appendChild(el("div.ca-platos"));
  r.n.classList.toggle("con-platos", platos.some(hayComida));
  lugares.forEach(([x0, y], i) => {
    const p = platos[i], rc = hayComida(p) ? RECETAS[p.k] : null, x = r.o.f ? r.d.w - x0 : x0;
    let n = r.platosN.querySelector(`:scope > [data-i="${i}"]:not(.se-acaba)`);
    if (n && (!rc || n.dataset.k !== rc.k)) { const v = n; v.classList.add("se-acaba"); setTimeout(() => v.remove(), 400); n = null; }
    if (!rc) return;
    if (!n) {
      n = el("i.ca-plato", { dataset: { i: String(i), k: rc.k } }, [
        el("i.ca-plato-base", { html: `<svg viewBox="0 0 44 30" aria-hidden="true">${baseDe(rc)}</svg>` }),
        el("i.ca-plato-comida", { html: `<svg viewBox="0 0 44 30" aria-hidden="true">${rc.comida}</svg>` }),
        el("i.ca-plato-vapor"),
      ]);
      r.platosN.append(n);
    }
    n.style.left = x - 22 + "px"; n.style.top = y - 24 + "px";
    n.dataset.b = String(Math.min(BOCADOS, p.b | 0));
  });
}

/** Dónde se pueden sentar a comer en esa mesa: sus propias bancas o las sillas (y sillones) de junto. */
export function asientosDe(j, r) {
  const out = [];
  r.d.lugares?.forEach((l, i) => { if (l.pose === "sentado") out.push({ r, i }); });
  for (const s of j.objs.values()) {
    if (s === r || s.o.c !== r.o.c || !s.d.lugares || s.d.superficie || s.d.lugares[0]?.pose !== "sentado") continue;
    if (Math.abs(s.gx - r.gx) > r.d.w / 2 + 64 || Math.abs(s.o.y - r.o.y) > 60) continue;
    s.d.lugares.forEach((l, i) => { if (l.pose === "sentado") out.push({ r: s, i }); });
  }
  return out;
}
const xAsiento = (a) => a.r.gx + (a.r.d.lugares[a.i].dx || 0) * (a.r.o.f ? -1 : 1);
const ocupa = (m, a) => m.mueble === `${a.r.o.id}:${a.i}` || m.destino === `${a.r.o.id}:${a.i}`;

/** Ir a sentarse a la mesa (si ya estás en uno de sus lugares, ahí te quedas). */
async function sentarseEn(j, r) {
  const m = j.yo, as = asientosDe(j, r);
  if (as.some((a) => ocupa(m, a))) return true;
  const libres = as.filter((a) => !ocupa(j.suyo, a)).sort((a, b) => Math.abs(xAsiento(a) - m.gx) - Math.abs(xAsiento(b) - m.gx));
  if (libres.length) return j.usarLugar({ id: libres[0].r.o.id }, libres[0].i);
  return j.irJunto({ id: r.o.id });
}

/** ¿Los dos sentados en la misma mesa? Fiestita: corazones, ojitos de amor y su sonido. */
export function juntosEnMesa(j, r) {
  const as = asientosDe(j, r);
  if (!as.some((a) => ocupa(j.yo, a)) || !as.some((a) => ocupa(j.suyo, a))) return false;
  if (performance.now() - (j._fiestaMesa || 0) < 9000) return true;
  j._fiestaMesa = performance.now();
  j.sonar("juntos");
  j.particulas("corazon", { gx: (j.yo.gx + j.suyo.gx) / 2, y: Math.min(j.yo.y, j.suyo.y) - 110 }, 0, 0, 9);
  for (const m of [j.yo, j.suyo]) { m.n.classList.add("enamorado"); setTimeout(() => m.n.classList.remove("enamorado"), 2600); }
  j._globo(j.yo, "¡Provecho, amor!", 2400);
  vibrar(14);
  return true;
}

/** Cocinar una receta en lo que tocaste (la estufa, el asador, el micro o la licuadora). */
export async function cocinar(j, o, k) {
  const rc = RECETAS[k], r = j.objs.get(o.id);
  if (!rc || !r) return;
  // En la estufa y el asador se queda ahí cocinando; en el micro y la licuadora, junto.
  const conLugar = !!r.d.lugares;
  if (!(conLugar ? await j.usarLugar({ id: o.id }, 0) : await j.irJunto({ id: o.id }))) return;
  const trasto = rc.en === "olla" || rc.en === "horno" ? rc.en : "sarten";
  j.estado({ id: o.id }, { on: true, receta: k, trasto });
  j._mandarYo({ ev: { k: "cocina", t: k } });
  const sitio = j.yo.mueble, pasos = Math.max(2, Math.round(rc.ms / 900));
  for (let i = 0; i < pasos; i++) {
    j.sonar(SONIDO_DE[rc.en] || "sarten", { volumen: 0.8 });
    j.particulas(rc.en === "horno" ? "chispa" : "vapor", { gx: r.gx - 10, y: r.o.y - r.d.h - 4 }, 0, 0, 2);
    await j.esperar(rc.ms / pasos);
    if (!j.vivo || !j.objs.has(o.id)) return;
    if (conLugar && j.yo.mueble !== sitio) { j.estado({ id: o.id }, { on: false }); return; }
  }
  j.estado({ id: o.id }, { on: false });
  j.sonar("horno-listo");
  j.dar(k, { gx: r.gx, y: r.o.y, def: r.d });
  if (conLugar) j.pararse();
  setTimeout(() => { if (j.vivo && j.yo.lleva === k) j._globo(j.yo, `¡${rc.n} listo! Sírvelo en una mesa`, 2800); }, 700);
}

/** Servir lo que traes en una mesa: un plato cerca de ti y otro enfrente, para tu amorcito. */
export async function servir(j, r) {
  const m = j.yo, k = m.lleva, rc = RECETAS[k];
  if (!rc || !r.d.superficie) return false;
  if (!(await j.irJunto({ id: r.o.id }))) return false;
  if (!j.vivo || !j.objs.has(r.o.id) || m.lleva !== k) return false;
  r = j.objs.get(r.o.id);
  const libres = platosDe(r).map((p, i) => (hayComida(p) ? -1 : i)).filter((i) => i >= 0).sort((a, b) => Math.abs(lugarPlato(r, a) - m.gx) - Math.abs(lugarPlato(r, b) - m.gx));
  if (!libres.length) { j.decir("La mesa ya está llena: primero a comer", false); j.sonar("nop"); return false; }
  const cambios = { ["p" + libres[0]]: { k, b: BOCADOS } }, dos = libres.length > 1;
  if (dos) cambios["p" + libres[libres.length - 1]] = { k, b: BOCADOS };
  j._ponerLleva(m, "");
  j.estado({ id: r.o.id }, cambios);
  j._mandarYo({ lleva: "", ev: { k: "sirve", t: k } });
  j.sonar("mesa");
  j.particulas("chispa", { gx: r.gx, y: r.o.y - r.d.h }, 0, 0, 5);
  j._globo(m, dos ? "¡Servido para los dos!" : "¡Servido!", 2400);
  vibrar(8);
  return true;
}

/** Sentarse y comer de su plato (tres bocaditos con cuchara). */
export async function comerEnMesa(j, r) {
  const m = j.yo;
  if (!(await sentarseEn(j, r)) || !j.vivo || !j.objs.has(r.o.id)) return;
  r = j.objs.get(r.o.id);
  let i = -1, d = 1e9;
  platosDe(r).forEach((p, k) => { if (!hayComida(p)) return; const dd = Math.abs(lugarPlato(r, k) - m.gx); if (dd < d) { d = dd; i = k; } });
  if (i < 0) { j.decir("Ya no hay comida en la mesa", false); return; }
  const comida = platosDe(r)[i].k, sitio = m.mueble;
  j._mirar(m, lugarPlato(r, i) - m.gx);
  j._mandarYo({ mira: m.mira, ev: { k: "comemesa", t: r.o.id } });
  juntosEnMesa(j, r);
  m.n.classList.add("comiendo");
  try {
    for (;;) {
      j.sonar("cuchara");
      j.particulas("migaja", { gx: m.gx + 14 * m.mira, y: m.y - 64 }, 0, 0, 2);
      await j.esperar(950);
      const rr = j.objs.get(r.o.id);
      if (!j.vivo || !rr || m.mueble !== sitio) return;
      const p = platosDe(rr)[i];
      if (!hayComida(p) || p.k !== comida) return;
      const b = (p.b | 0) - 1;
      j.estado({ id: r.o.id }, { ["p" + i]: b > 0 ? { ...p, b } : null });
      j.necesidades?.sumar("hambre", 45 / BOCADOS);   // (Fase 58) un platillo llena mucho
      if (b <= 0) {
        j.sonar("comer");
        j._globo(m, "¡Qué rico!", 1800);
        j.particulas("corazon", { gx: m.gx, y: m.y - 120 }, 0, 0, 3);
        return;
      }
    }
  } finally { m.n.classList.remove("comiendo"); }
}

/** Tocar una mesa: si traes un platillo, se sirve; si hay comida, a comer; si no, a sentarse. */
export async function tocarMesa(j, o, n) {
  const r = j.objs.get(o.id);
  if (!r) return;
  if (COSAS_MANO[j.yo.lleva]?.plato) { await servir(j, r); return; }
  if (platosDe(r).some(hayComida)) { await comerEnMesa(j, r); return; }
  if (asientosDe(j, r).length) await sentarseEn(j, r);
  else { n?.classList.remove("toque"); void n?.offsetWidth; n?.classList.add("toque"); j.sonar("mesa", { volumen: 0.5 }); }
  j.decir("Cocinen algo en la estufa y sírvanlo aquí", false);
}

/** Cuando tu amorcito come en una mesa (en tu teléfono): su monito come y, si estás ahí, fiestita. */
export function laPareja(j, ev, espera) {
  const m = j.suyo;
  if (ev.k !== "comemesa") return;
  setTimeout(() => {
    if (!j.vivo) return;
    m.n.classList.add("comiendo");
    clearTimeout(m.tcome);
    m.tcome = setTimeout(() => m.n.classList.remove("comiendo"), BOCADOS * 950 + 200);
    if (j._visible(m)) j.sonar("cuchara", { volumen: 0.6 });
    const r = j.objs.get(ev.t);
    if (r) juntosEnMesa(j, r);
  }, espera + 420);
}
