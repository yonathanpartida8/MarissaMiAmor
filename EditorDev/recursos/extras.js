/**
 * RECURSOS QUE SE AMPLÍAN SOLOS — sin tocar el código del editor.
 *
 *   assets/animaciones/<nombre>/animacion.json|css|js   → Animar
 *   assets/transiciones/<nombre>/transicion.json|css|js → Transiciones
 *   assets/efectos/<nombre>.json                         → Efectos (filtros listos)
 *   assets/fondos/<nombre>/index.html                    → fondos con HTML
 *   assets/sonidos-editor/<momento>/*.wav|mp3            → sonidos del editor
 *   assets/iconos/<icono>.svg                            → cambia un icono
 *
 * Lo encuentra `herramientas/catalogo.mjs` (en cada subida) y, si el servidor
 * deja listar carpetas (un servidor local, por ejemplo), también lo que se
 * acaba de dejar sin volver a generar el catálogo.
 *
 * Una animación o transición se puede escribir de tres formas:
 *   JSON  { nombre, fase, duracion, ritmo, fotogramas: [ … ] }
 *   CSS   @keyframes … (con  /* fase: entrada · duracion: 900 · ritmo: ease *\/ )
 *   JS    código que DEVUELVE los fotogramas; corre una sola vez, aislado en un
 *         marco sin permisos, así no puede romper nada del editor
 * Al usarla se copia DENTRO del proyecto como fotogramas (ajustes.extras): el
 * librito exportado no necesita la carpeta. «Mías» se guardan en este
 * aparato para usarlas en cualquier librito.
 */
import { catalogo, listar } from "../componentes/catalogo.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { ICONOS } from "../components/iconos.js";

const RT = window.LibritoRT;
const MIAS = "editordev:mis-extras";
const camel = (p) => p.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
const limpiarId = (s) => "x_" + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

/* ── Leer definiciones ───────────────────────────────────────────── */

/** Los @keyframes de un CSS → { nombre: fotogramas para Web Animations }. */
export function keyframesDe(css) {
  const st = document.createElement("style");
  st.media = "not all"; // se lee, pero no se aplica a nada
  st.textContent = css;
  document.head.append(st);
  const res = {};
  try {
    for (const r of st.sheet?.cssRules || []) {
      if (r.type !== 7 /* KEYFRAMES_RULE */) continue;
      const fs = [];
      for (const k of r.cssRules) {
        const props = {};
        for (let i = 0; i < k.style.length; i++) {
          const p = k.style[i];
          const v = k.style.getPropertyValue(p).trim();
          if (p === "animation-timing-function") props.easing = v; else props[camel(p)] = v;
        }
        for (const t of k.keyText.split(",")) {
          const x = t.trim();
          fs.push({ ...props, offset: x === "from" ? 0 : x === "to" ? 1 : parseFloat(x) / 100 });
        }
      }
      fs.sort((a, b) => a.offset - b.offset);
      res[r.name] = fs;
    }
  } finally { st.remove(); }
  return res;
}

/** «fase: entrada · duracion: 900 · ritmo: ease-out» de un comentario. */
function metaDe(texto) {
  const m = {};
  const com = (texto.match(/\/\*([\s\S]*?)\*\//) || texto.match(/^\s*\/\/(.*)$/m) || [])[1] || "";
  for (const x of com.matchAll(/(nombre|fase|duracion|duración|ritmo|encima)\s*:\s*([^·|\n*]+)/gi)) m[x[1].toLowerCase().replace("ó", "o")] = x[2].trim();
  return m;
}

/** Corre código de quien edita, aislado (sin acceso a nada), y devuelve lo que devuelva. */
export function correrJs(codigo, ms = 2000) {
  return new Promise((ok, mal) => {
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
    const id = Math.random().toString(36).slice(2);
    const cuerpo = String(codigo).replace(/<\/script/gi, "<\\/script");
    f.srcdoc = `<!doctype html><script>(function(){var r=null,e=null;try{r=(function(){\n${cuerpo}\n})();}catch(x){e=String(x&&x.message||x)}var d;try{d=JSON.parse(JSON.stringify(r===undefined?null:r))}catch(x){d=null;e=e||"Lo que devolvió no se puede guardar"}parent.postMessage({extra:"${id}",r:d,e:e},"*")})();<\/script>`;
    const al = (ev) => {
      if (!ev.data || ev.data.extra !== id) return;
      fin();
      if (ev.data.e) mal(new Error(ev.data.e)); else ok(ev.data.r);
    };
    const fin = () => { removeEventListener("message", al); clearTimeout(t); f.remove(); };
    const t = setTimeout(() => { fin(); mal(new Error("El código tardó demasiado (¿un bucle sin fin?)")); }, ms);
    addEventListener("message", al);
    document.body.append(f);
  });
}

/** Fotogramas válidos para el navegador (o un error que se entienda). */
function validar(k, que = "fotogramas") {
  if (!Array.isArray(k) || !k.length) throw new Error(`No encontré ${que} (una lista con al menos uno).`);
  const fs = k.map((f) => { const o = {}; for (const [p, v] of Object.entries(f || {})) o[p === "offset" || p === "easing" ? p : camel(p)] = v; return o; });
  try { document.createElement("div").animate(fs, 10).cancel(); } catch (e) { throw new Error("Los fotogramas no son válidos: " + e.message); }
  return fs;
}

/**
 * Lee una animación o transición escrita en JSON, CSS o JS.
 *   tipo: "animacion" → { n, fase, fotogramas, dur, facil, lineal }
 *         "transicion" → { n, entra, sale, encima, dur, facil }
 */
export async function interpretar(texto, formato, tipo, nombre = "") {
  texto = String(texto || "").trim();
  if (!formato) formato = /^[[{]/.test(texto) ? "json" : /@keyframes/i.test(texto) ? "css" : "js";
  let d = {};
  if (formato === "json") {
    try { d = JSON.parse(texto); } catch (e) { throw new Error("El JSON tiene un error: " + e.message); }
    if (Array.isArray(d)) d = tipo === "animacion" ? { fotogramas: d } : { entra: d };
  } else if (formato === "css") {
    const k = keyframesDe(texto);
    const nombres = Object.keys(k);
    if (!nombres.length) throw new Error("No encontré ningún @keyframes en el CSS.");
    const m = metaDe(texto);
    d = { nombre: m.nombre, fase: m.fase, duracion: m.duracion || m["duración"], ritmo: m.ritmo, encima: m.encima };
    if (tipo === "animacion") { d.fotogramas = k[nombres[0]]; d.nombre = d.nombre || nombres[0]; }
    else { d.entra = k.entra || k[nombres[0]]; d.sale = k.sale || (nombres[1] ? k[nombres[1]] : null); }
  } else {
    const r = await correrJs(texto);
    const m = metaDe(texto);
    d = Array.isArray(r) ? (tipo === "animacion" ? { fotogramas: r } : { entra: r }) : r || {};
    d = { nombre: m.nombre, fase: m.fase, duracion: m.duracion, ritmo: m.ritmo, encima: m.encima, ...d };
  }
  const n = String(d.nombre || d.n || nombre || "Mi " + tipo).slice(0, 40);
  const dur = Math.max(80, Math.min(20000, Math.round(+(d.duracion ?? d.dur) || (tipo === "animacion" ? 900 : 700))));
  const facil = String(d.ritmo || d.facil || (tipo === "animacion" ? "suave" : "entraSale"));
  if (tipo === "animacion") {
    const fase = ["entrada", "bucle", "salida"].includes(String(d.fase || "").toLowerCase()) ? String(d.fase).toLowerCase() : "entrada";
    return { n, fase, fotogramas: validar(d.fotogramas || d.keyframes), dur, facil, lineal: facil === "linear" };
  }
  const entra = d.entra ? validar(d.entra, "los fotogramas de «entra»") : null;
  const sale = d.sale ? validar(d.sale, "los fotogramas de «sale»") : null;
  if (!entra && !sale) throw new Error("Una transición necesita fotogramas en «entra» o «sale».");
  return { n, entra, sale, encima: d.encima === "sale" ? "sale" : "entra", dur, facil };
}

/* ── Lo que hay en las carpetas ──────────────────────────────────── */

let cache = null;
/** Todo lo de las carpetas especiales (catálogo + lo que se pueda listar ahora). */
export async function extras() {
  if (cache) return cache;
  const c = await catalogo();
  const ex = JSON.parse(JSON.stringify(c.extras || {}));
  for (const k of ["animaciones", "transiciones", "efectos", "fondos"]) ex[k] = ex[k] || [];
  ex.sonidos = ex.sonidos || {};
  ex.deslizar = ex.deslizar || [];
  const desl = await listar("assets/deslizar/");
  if (desl) for (const d of desl.filter((h) => h.endsWith("/"))) {
    const id = `deslizar/${d.slice(0, -1)}`;
    if (ex.deslizar.some((x) => x.id === id)) continue;
    const fs = (await listar(`assets/deslizar/${d}`)) || [];
    const izq = fs.find((f) => /^(izquierda|left)\.(svg|png|webp|gif|avif)$/i.test(f)), der = fs.find((f) => /^(derecha|right)\.(svg|png|webp|gif|avif)$/i.test(f));
    if (izq && der) ex.deslizar.push({ id, nombre: d.slice(0, -1).replace(/[-_]+/g, " "), izquierda: `assets/deslizar/${d}${izq}`, derecha: `assets/deslizar/${d}${der}` });
  }
  ex.iconos = ex.iconos || {};
  // Lo recién dejado (sin catálogo nuevo): sólo si el servidor lista carpetas.
  const tipos = [["animaciones", /^animacion\.(json|css|js)$/i], ["transiciones", /^transicion\.(json|css|js)$/i]];
  for (const [tipo, re] of tipos) {
    const hay = await listar(`assets/${tipo}/`);
    if (!hay) continue;
    for (const d of hay.filter((h) => h.endsWith("/"))) {
      const id = `${tipo}/${d.slice(0, -1)}`;
      if (ex[tipo].some((x) => x.id === id)) continue;
      const dentro = (await listar(`assets/${tipo}/${d}`)) || [];
      const def = dentro.filter((f) => re.test(f));
      if (def.length) ex[tipo].push({ id, nombre: d.slice(0, -1).replace(/[-_]+/g, " "), ruta: `assets/${tipo}/${d}`, definicion: def, miniatura: dentro.find((f) => /^(preview|miniatura|thumb)\./i.test(f)) ? `assets/${tipo}/${d}${dentro.find((f) => /^(preview|miniatura|thumb)\./i.test(f))}` : null });
    }
  }
  const sons = await listar("assets/sonidos-editor/");
  if (sons) for (const d of sons.filter((h) => h.endsWith("/"))) {
    const cat = d.slice(0, -1).toLowerCase();
    if (ex.sonidos[cat]?.length) continue;
    const fs = ((await listar(`assets/sonidos-editor/${d}`)) || []).filter((f) => /\.(mp3|m4a|ogg|wav|aac)$/i.test(f));
    if (fs.length) ex.sonidos[cat] = fs.map((f) => `assets/sonidos-editor/${d}${f}`);
  }
  cache = ex;
  return ex;
}

const leidos = new Map();
/** La definición de una animación o transición de assets/ (leída una vez). */
export async function leerDeCarpeta(item, tipo) {
  if (leidos.has(item.id)) return leidos.get(item.id);
  const archivo = item.definicion[0];
  const p = fetch(rutaAUrl(item.ruta + archivo)).then((r) => { if (!r.ok) throw new Error("No se pudo leer " + archivo); return r.text(); })
    .then((t) => interpretar(t, archivo.split(".").pop().toLowerCase(), tipo, item.nombre))
    .then((d) => ({ ...d, id: limpiarId(item.id), origen: item.id, miniatura: item.miniatura }));
  leidos.set(item.id, p);
  p.catch(() => leidos.delete(item.id));
  return p;
}

/** Un filtro listo de assets/efectos/. */
export async function leerEfecto(item) {
  if (leidos.has(item.id)) return leidos.get(item.id);
  const p = fetch(rutaAUrl(item.ruta)).then((r) => r.json()).then((d) => ({ n: d.nombre || item.nombre, efectos: d.efectos || {}, miniatura: item.miniatura }));
  leidos.set(item.id, p);
  return p;
}

/* ── «Mías» (en este aparato) ────────────────────────────────────── */
export function mias() {
  try { const x = JSON.parse(localStorage.getItem(MIAS) || "{}"); return { animaciones: x.animaciones || {}, transiciones: x.transiciones || {} }; } catch (e) { return { animaciones: {}, transiciones: {} }; }
}

export function guardarMia(tipo, def) {
  const m = mias();
  const id = def.id || limpiarId(def.n + "_" + Date.now().toString(36));
  m[tipo][id] = { ...def, id };
  try { localStorage.setItem(MIAS, JSON.stringify(m)); } catch (e) { /* lleno */ }
  return m[tipo][id];
}

export function borrarMia(tipo, id) {
  const m = mias();
  delete m[tipo][id];
  try { localStorage.setItem(MIAS, JSON.stringify(m)); } catch (e) { /* nada */ }
}

/* ── Meterlas en el proyecto ─────────────────────────────────────── */
/** Copia una animación o transición dentro del proyecto (para que viaje con él) y la registra. */
export function alProyecto(E, tipo, def) {
  const P = E.proyecto;
  const id = def.id || limpiarId(def.n);
  const ex = P.ajustes.extras || {};
  const grupo = tipo === "animacion" ? "animaciones" : "transiciones";
  const limpio = tipo === "animacion"
    ? { n: def.n, fase: def.fase, fotogramas: def.fotogramas, dur: def.dur, facil: def.facil, lineal: !!def.lineal }
    : { n: def.n, entra: def.entra, sale: def.sale, encima: def.encima, dur: def.dur, facil: def.facil };
  if (JSON.stringify(ex[grupo]?.[id]) !== JSON.stringify(limpio)) {
    E.setProy({ "ajustes.extras": { ...ex, [grupo]: { ...(ex[grupo] || {}), [id]: limpio } } }, tipo === "animacion" ? "Animación propia" : "Transición propia");
  }
  RT.registrarExtras(E.proyecto.ajustes);
  return id;
}

/** Iconos propios (assets/iconos/*.svg): se ponen antes de pintar el editor. */
export async function aplicarIconos() {
  const ex = await extras().catch(() => null);
  const lista = Object.entries(ex?.iconos || {});
  await Promise.all(lista.map(async ([n, ruta]) => {
    try {
      const t = await (await fetch(rutaAUrl(ruta))).text();
      if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(t) || /<script|on\w+=/i.test(t)) return;
      ICONOS[n] = t.replace(/^\s*(<\?xml[^>]*>\s*)?<svg/i, '<svg class="ed-ico" aria-hidden="true"');
    } catch (e) { /* se queda el de siempre */ }
  }));
  return lista.length;
}
