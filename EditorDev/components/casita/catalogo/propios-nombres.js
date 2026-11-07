/**
 * (Fase 76) TUS OBJETOS: cómo se leen los nombres de las imágenes de `assets/objetos-casita/`. Lo usan la herramienta
 * que arma la lista (herramientas/objetos-casita.mjs, en la compu o en GitHub) y el juego (propios.js), así los dos
 * entienden igual los nombres. No toca la pantalla: sólo texto.
 *
 * Carpeta por categoría (sala, cocina, recamara, bano, estudio, terraza, jardin, cositas, adornos, plantas, pared,
 * limpieza) y, adentro, cada objeto en su propia carpeta o como archivos sueltos:
 *
 *   assets/objetos-casita/sala/sillon-rosa/frente.png         sala/sillon-rosa.png            (el frente)
 *   assets/objetos-casita/sala/sillon-rosa/derecha.png        sala/sillon-rosa-derecha.png    (de lado)
 *   assets/objetos-casita/sala/sillon-rosa/izquierda.png      sala/sillon-rosa-izquierda.png
 *   assets/objetos-casita/sala/sillon-rosa/atras.png          sala/sillon-rosa-atras.png      (de espaldas)
 *   assets/objetos-casita/cocina/horno/abierto.png            cocina/horno-abierto.png        (abierto)
 *   assets/objetos-casita/cocina/horno/funcionando1.png, 2…   cocina/horno-funcionando1.png…  (animación en bucle)
 *
 * También: `abierto-derecha.png`, `funcionando2-izquierda.png` (el estado visto de lado), `@150` en el nombre para su
 * alto (`sillon@150.png` o la carpeta `sillon@150`) y una notita `info.txt` en la carpeta del objeto con
 * `nombre: …`, `alto: …`, `velocidad: …` (cuadros por segundo de la animación).
 */
export const IMAGEN = /\.(png|jpe?g|webp)$/i;

/** Las carpetas de categoría: en qué categoría de «Acomodar» salen, en qué capa van y su alto de mueble. */
export const CARPETAS = {
  sala: { cat: "sala", alto: 120 }, cocina: { cat: "cocina", alto: 130 }, recamara: { cat: "recamara", alto: 120 }, bano: { cat: "bano", alto: 110 },
  estudio: { cat: "estudio", alto: 120 }, terraza: { cat: "terraza", alto: 110 }, jardin: { cat: "jardin", alto: 130 },
  cositas: { cat: "cositas", alto: 40, portatil: true }, adornos: { cat: "adornos", alto: 56, portatil: true }, plantas: { cat: "plantas", alto: 80 },
  pared: { cat: "deco", alto: 90, capa: "pared" }, limpieza: { cat: "limpieza", alto: 70, portatil: true },
};
export const LEEME_CARPETA = {
  sala: "Sofás, sillones, mesitas, teles, lámparas…", cocina: "Refris, estufas, alacenas, mesas…", recamara: "Camas, roperos, burós, tocadores…",
  bano: "Tinas, lavabos, regaderas…", estudio: "Escritorios, libreros, sillas…", terraza: "Muebles de afuera, asadores, hamacas…",
  jardin: "Árboles, bancas, columpios, fuentes…", cositas: "Cosas chiquitas que se cargan con la mano", adornos: "Adornitos para poner encima de los muebles",
  plantas: "Macetas y plantitas", pared: "Lo que se cuelga en la pared: cuadros, repisas, relojes…", limpieza: "Escobas, cubetas, trapitos…",
};

/** Sin acentos, en minúsculas. */
export const plano = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** La carpeta de categoría que corresponde a un nombre de carpeta (acepta «Baño», «Recámara», «Jardín»…). */
export const carpetaDe = (s) => { const k = plano(s).replace(/\s+/g, ""); return CARPETAS[k] ? k : { banio: "bano", cuartos: "recamara", cuarto: "recamara", recamaras: "recamara", paredes: "pared", afuera: "jardin", planta: "plantas", adorno: "adornos", cosita: "cositas" }[k] || null; };

const DIRS = { frente: ["frente", "frontal", "front", "delante", "adelante", "enfrente"], derecha: ["derecha", "derecho", "der", "right"], izquierda: ["izquierda", "izquierdo", "izq", "left"], atras: ["atras", "espalda", "espaldas", "detras", "back", "trasera", "trasero"] };
const ESTADOS = { abierto: ["abierto", "abierta", "abiertos", "open", "abrir"], funcionando: ["funcionando", "funciona", "animado", "animacion", "anim", "prendido", "encendido", "working", "frame"] };
const busca = (tabla, t) => Object.keys(tabla).find((k) => tabla[k].includes(t)) || null;

/** Lee un nombre de imagen: qué lado (frente, derecha…), qué estado (abierto, funcionando) y qué cuadro; lo demás es
 *  el nombre del objeto (cuando las imágenes van sueltas en la carpeta de categoría). */
export function leerNombre(archivo) {
  let s = plano(archivo).replace(IMAGEN, "");
  let alto = null;
  s = s.replace(/@(\d{2,3})\b/, (_, n) => { alto = +n; return " "; });
  const resto = [];
  let dir = null, estado = null, cuadro = null;
  const tokens = s.split(/[\s_\-.,()]+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], m = /^([a-z]+)(\d+)$/.exec(t), pal = m ? m[1] : t, num = m ? +m[2] : null;
    const d = busca(DIRS, pal), e = busca(ESTADOS, pal);
    if (d && !dir) { dir = d; continue; }
    if (e && !estado) {
      estado = e;
      if (num != null) cuadro = num;
      else if (/^\d+$/.test(tokens[i + 1] || "")) { cuadro = +tokens[i + 1]; i++; }
      continue;
    }
    if (/^\d+$/.test(t) && estado === "funcionando" && cuadro == null) { cuadro = +t; continue; }
    resto.push(t);
  }
  if (estado === "funcionando" && cuadro == null) cuadro = 1;
  return { dir: dir || "frente", estado, cuadro, alto, nombre: resto.join(" ") };
}

/** Lee la notita info.txt de un objeto: `clave: valor` por renglón. */
export function leerInfo(texto) {
  const r = {};
  for (const l of String(texto || "").split(/\r?\n/)) {
    const m = /^\s*([^:=]+?)\s*[:=]\s*(.+?)\s*$/.exec(l);
    if (!m) continue;
    const k = plano(m[1]).replace(/\s+/g, ""), v = m[2];
    if (k === "nombre" || k === "name") r.nombre = v.slice(0, 40);
    else if (["alto", "altura", "height", "tamano", "tamanio"].includes(k) && +v > 0) r.alto = Math.max(16, Math.min(320, +v));
    else if (["ancho", "width"].includes(k) && +v > 0) r.ancho = Math.max(16, Math.min(420, +v));
    else if (["velocidad", "fps", "cuadros"].includes(k) && +v > 0) r.fps = Math.max(1, Math.min(24, +v));
    else if (k === "capa" && /pared|piso|alfombra/.test(plano(v))) r.capa = plano(v).match(/pared|piso|alfombra/)[0];
  }
  return r;
}

/** Bonito: «sillon-rosa» → «Sillon rosa». */
export const bonito = (s) => { const t = String(s || "").replace(/[_\-]+/g, " ").replace(/@\d+/, "").replace(/\s+/g, " ").trim(); return t ? t[0].toUpperCase() + t.slice(1) : "Mi objeto"; };
const slug = (s) => plano(s).replace(/@\d+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "objeto";

/**
 * Arma la lista de objetos a partir de los archivos encontrados.
 * `archivos`: [{ carpeta: "sala", objeto: "sillon-rosa" | null, archivo: "frente.png", ruta: "assets/…", w, h }]
 * `infos`: { "sala/sillon-rosa": "texto de info.txt" }
 */
export function armarObjetos(archivos, infos = {}) {
  const porId = new Map();
  for (const a of archivos) {
    const c = carpetaDe(a.carpeta);
    if (!c || !IMAGEN.test(a.archivo)) continue;
    const L = leerNombre(a.archivo), base = a.objeto ? leerNombre(a.objeto + ".png") : null;
    const nombreObj = a.objeto ? a.objeto : L.nombre;
    if (!nombreObj) continue;
    const id = `${c}/${slug(nombreObj)}`;
    let o = porId.get(id);
    if (!o) { o = { id, carpeta: c, nombre: bonito(base?.nombre || nombreObj), alto: base?.alto || null, vistas: {}, abierto: {}, funcionando: {}, tam: {} }; porId.set(id, o); }
    if (L.alto && !o.alto) o.alto = L.alto;
    if (a.w && a.h) o.tam[a.ruta] = [a.w, a.h];
    if (L.estado === "abierto") o.abierto[L.dir] = a.ruta;
    else if (L.estado === "funcionando") { (o.funcionando[L.dir] ||= []).push([L.cuadro, a.ruta]); }
    else if (!o.vistas[L.dir] || a.archivo.length < (o._largo?.[L.dir] || 99)) { o.vistas[L.dir] = a.ruta; (o._largo ||= {})[L.dir] = a.archivo.length; }
  }
  const lista = [];
  for (const o of porId.values()) {
    for (const d of Object.keys(o.funcionando)) o.funcionando[d] = o.funcionando[d].sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    // Sin frente: el primero que haya (de lado, abierto o el primer cuadro) hace de frente.
    if (!o.vistas.frente) o.vistas.frente = o.vistas.derecha || o.vistas.izquierda || o.vistas.atras || o.abierto.frente || o.funcionando.frente?.[0] || Object.values(o.abierto)[0] || Object.values(o.funcionando)[0]?.[0];
    if (!o.vistas.frente) continue;
    const info = infos[o.id] ? leerInfo(infos[o.id]) : {};
    if (info.nombre) o.nombre = info.nombre;
    if (info.alto) o.alto = info.alto;
    if (info.ancho) o.ancho = info.ancho;
    if (info.fps) o.fps = info.fps;
    if (info.capa) o.capa = info.capa;
    delete o._largo;
    lista.push(o);
  }
  return lista.sort((a, b) => a.id.localeCompare(b.id));
}

/** El tamaño en el mundo: pixel art chiquito se agranda ×4 (cada pixel, un cuadrito del juego, como todo lo demás);
 *  una imagen grande se ajusta al alto de un mueble de su categoría (o al alto que digas). */
export function medida(o, w, h) {
  const C = CARPETAS[o.carpeta] || { alto: 100 };
  if (!(w > 0 && h > 0)) return [Math.round((C.alto || 100) * 0.8), C.alto || 100];
  let k;
  if (o.alto) k = o.alto / h;
  else if (o.ancho) k = o.ancho / w;
  else if (Math.max(w, h) <= 96) k = 4;
  else k = (C.alto || 100) / h;
  // Que no quede ni gigante ni diminuto.
  k = Math.min(k, 420 / w, 320 / h);
  k = Math.max(k, 16 / w, 16 / h);
  return [Math.max(8, Math.round(w * k)), Math.max(8, Math.round(h * k))];
}
