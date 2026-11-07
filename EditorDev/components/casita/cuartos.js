/**
 * LOS CUARTOS de la casita: cuánto miden, sus colores de entrada y lo que tienen la primera vez.
 * Para agregar un cuarto: una fila en CUARTOS y su acomodo en INICIAL (todo lo demás se ajusta solo).
 * Cada cosa vive en su cuarto con x (desde la orilla izquierda del cuarto) y y (dónde toca el piso).
 */
export const H = 720;          // el alto del mundo (Fase 58: piso todavía más hondo: todo el suelo se usa)
export const PISO = 432;       // donde termina la pared y empieza el piso
export const FONDO = 452;      // lo más atrás que se puede pisar
export const FRENTE = 712;     // lo más adelante
export const SUELO = 572;      // donde se para un monito
/** (Fase 64) Hasta dónde se puede acomodar algo en el piso de un cuarto (lo de más adelante es para caminar). */
export const LIMITE_EDIT = 584;
/** (Fase 71) EL TECHO de los cuartos de adentro: la pared de atrás llega hasta TECHO_ATRAS y la orilla de enfrente del
 *  techo queda en TECHO_FRENTE (en medio se ve el techo en perspectiva, con su moldura). */
export const TECHO_ATRAS = 58, TECHO_FRENTE = 18;
/** Dónde queda lo de abajo de un foco colgado del techo (con la escala de la pared de atrás, 0.75). */
export const colgadoY = (h) => Math.round(TECHO_ATRAS - 2 + h * 0.75);

export const CUARTOS = [
  // (Fase 64) El jardín es un patio grande para explorar (exterior.js): tres cuartos de largo y hondo hacia abajo.
  { k: "jardin", n: "Jardín", w: 2400, afuera: true, mapa: true, pared: "#bfe6ff", patron: "liso", piso: "pasto" },
  { k: "sala", n: "Sala", w: 820, foco: 470, pared: "#ffe1ec", patron: "rayas", piso: "madera" },
  { k: "cocina", n: "Cocina", w: 780, foco: 300, pared: "#f9e4d6", patron: "ladrillo", piso: "mosaico" },
  { k: "recamara", n: "Recámara", w: 820, foco: 600, pared: "#ece3ff", patron: "corazones", piso: "alfombra" },
  { k: "bano", n: "Baño", w: 720, foco: 210, pared: "#dff3fb", patron: "azulejo", piso: "mosaico" },
  { k: "estudio", n: "Estudio", w: 800, foco: 330, pared: "#e3ecff", patron: "estrellas", piso: "clara" },
  { k: "terraza", n: "Terraza", w: 880, afuera: true, terraza: true, pared: "#bfe6ff", patron: "liso", piso: "duela" },
  // (Fase 72) Cuartos que se pueden OBTENER desde el mapita de la casa (para agrandarla): ya existen en el mundo, pero
  // ninguna puerta llega a ellos hasta que los obtienes; entonces les pones nombre y los decoras como quieras.
  { k: "extra1", n: "Cuarto nuevo", w: 800, extra: true, foco: 400, pared: "#fff4c8", patron: "puntos", piso: "clara" },
  { k: "extra2", n: "Cuarto nuevo", w: 800, extra: true, foco: 400, pared: "#d8f0e6", patron: "rayas", piso: "madera" },
  { k: "extra3", n: "Cuarto nuevo", w: 800, extra: true, foco: 400, pared: "#ffd6e0", patron: "corazones", piso: "alfombra" },
  { k: "extra4", n: "Cuarto nuevo", w: 800, extra: true, foco: 400, pared: "#e3ecff", patron: "cuadros", piso: "mosaico" },
];
/** (Fase 72) Los cuartos que sí son parte de la casa ahorita (los que se pueden obtener, sólo si ya los obtuviste). */
export const enLaCasa = (cfgDe) => CUARTOS.filter((c) => !c.extra || cfgDe(c.k)?.tiene);
/** Los cuartos que llegaron después: a una casita que ya existía se le agregan con su acomodo de entrada. */
export const CUARTOS_NUEVOS = ["estudio", "terraza"];
export const ANCHO = CUARTOS.reduce((a, c) => a + c.w, 0);
const INICIO = {};
{ let x = 0; for (const c of CUARTOS) { INICIO[c.k] = x; x += c.w; } }
export const inicioDe = (k) => INICIO[k] ?? 0;
export const cuarto = (k) => CUARTOS.find((c) => c.k === k) || CUARTOS[1];
/** De una x de todo el mundo, el cuarto y la x dentro de él. */
export function enCuarto(gx) {
  let x = 0;
  for (const c of CUARTOS) { if (gx < x + c.w) return { c: c.k, x: Math.max(0, gx - x) }; x += c.w; }
  const u = CUARTOS[CUARTOS.length - 1];
  return { c: u.k, x: u.w };
}
export const global = (c, x) => inicioDe(c) + (x || 0);
/** (Fase 64) Lo más adelante que se pisa y lo alto del mundo de cada cuarto (el patio es mucho más hondo). */
export const MAPA_FRENTE = 1580, MAPA_ALTO = 1640;
export const frenteDe = (k) => (cuarto(k).mapa ? MAPA_FRENTE : FRENTE);
export const altoDe = (k) => (cuarto(k).mapa ? MAPA_ALTO : H);

export const PAREDES = ["#ffe1ec", "#ffd6e0", "#fde8d0", "#f9e4d6", "#fff4c8", "#e6f6ea", "#dff3fb", "#e3ecff", "#ece3ff", "#f3e7da", "#ffffff", "#ffc9de", "#d8f0e6", "#f6dbe9"];
export const PATRONES = [["liso", "Liso"], ["rayas", "Rayitas"], ["puntos", "Puntitos"], ["corazones", "Corazones"], ["ladrillo", "Ladrillo"], ["azulejo", "Azulejo"], ["cuadros", "Cuadritos"], ["estrellas", "Estrellitas"]];
export const PISOS = [["madera", "Madera"], ["clara", "Madera clara"], ["mosaico", "Mosaico"], ["alfombra", "Alfombrita"], ["barro", "Barro"], ["pasto", "Pasto"], ["duela", "Duela de terraza"]];

/** Lo que hay la primera vez en cada cuarto: [tipo, x, y?, volteado?]. */
const INICIAL = {
  // (Fase 64) En el patio grande: el árbol del columpio en el jardín de flores, la banca y el farol junto al caminito.
  jardin: [["arbol", 790, 800], ["banca", 970, 650], ["flores", 1050, 540], ["flores", 1350, 540], ["buzon", 1300, 690], ["farol", 1110, 700], ["perrito", 1480, 660], ["casita_perro", 1530, 600]],
  sala: [["ventana", 345, 330], ["fotos", 150, 250], ["reloj", 545, 190], ["colgante", 44, 200], ["alfombra", 230, 556], ["lampara", 46, 505], ["sofa", 205, 500], ["mesita", 222, 548], ["tele", 478, 505], ["tocadiscos", 600, 505], ["gatito", 370, 553], ["foco_campana", 470, "techo"]],
  cocina: [["alacena", 170, 240], ["ventana", 440, 320], ["refri", 60, 505], ["estufa", 180, 505], ["fregadero", 315, 505], ["mesa", 480, 538], ["silla", 400, 532], ["silla", 560, 532, true], ["foco_pelon", 300, "techo"], ["foco_pelon", 470, "techo"]],
  recamara: [["ventana", 230, 320], ["guirnalda", 330, 104], ["cuadro", 480, 250], ["buro", 46, 505], ["cama", 212, 512], ["ropero", 408, 505], ["escritorio", 566, 505], ["silla_esc", 566, 545], ["peluche", 330, 553], ["candil", 600, "techo"]],
  bano: [["espejo", 420, 330], ["toallero", 275, 350], ["tapete", 140, 557], ["tina", 138, 512], ["inodoro", 295, 508], ["lavabo", 420, 506], ["patito", 60, 552], ["maceta", 515, 548], ["plafon", 210, "techo"]],
  estudio: [["ventana", 455, 320], ["neon", 250, 200], ["corcho", 110, 250], ["poster", 592, 250], ["tapete_redondo", 300, 557], ["librero_alto", 64, 505], ["piano", 210, 506], ["guitarra", 312, 540], ["sillon_lectura", 395, 512], ["lampara_arco", 486, 505], ["consola", 562, 506], ["puff", 214, 550], ["globo_mundo", 600, 552], ["farol_papel", 330, "techo"]],
  terraza: [["luces", 330, 466], ["hamaca", 128, 476], ["sombrilla", 640, 490], ["mesa_picnic", 560, 512], ["alberca", 300, 545], ["camastro", 112, 552], ["flamenco", 214, 554], ["cactus", 462, 552], ["maceta_grande", 672, 552]],
  // (Fase 72) Los cuartos por obtener nacen con su ventana y su foco (lo demás lo decoras tú).
  extra1: [["ventana", 300, 330], ["foco_campana", 400, "techo"]],
  extra2: [["ventana", 520, 330], ["foco_pelon", 400, "techo"]],
  extra3: [["ventana", 300, 330], ["candil", 420, "techo"]],
  extra4: [["ventana", 500, 330], ["farol_papel", 400, "techo"]],
};

/** La casa de entrada (v2). Si había una casita de antes (v1), se respetan sus colores y sus cositas. */
export function casaInicial(antes) {
  const objetos = [];
  for (const [c, lista] of Object.entries(INICIAL)) if (!cuarto(c).extra) lista.forEach(([t, x, y, f], i) => objetos.push({ id: `${c.slice(0, 2)}${i}`, t, c, x, y: yDe(t, y), f: !!f, e: {} }));
  const cuartos = {};
  for (const c of CUARTOS) cuartos[c.k] = { pared: c.pared, patron: c.patron, piso: c.piso, ...(c.afuera ? {} : { t71: 1 }), ...(antes?.cuartos?.[c.k] || {}) };
  cuartos.jardin.mapa = 1;   // (Fase 64: ya nace con el patio grande)
  for (const c of Object.values(cuartos)) { if (!PATRONES.some(([k]) => k === c.patron)) c.patron = "liso"; if (!PISOS.some(([k]) => k === c.piso)) c.piso = "madera"; }
  for (const [k, v] of Object.entries(antes?.luces || {})) if (cuartos[k]) cuartos[k].luz = v !== false;
  // Las cositas de la casita de antes (en cuartos de 420 de ancho) a su lugar nuevo.
  const VIEJAS = { oso: "peluche", globo: "globo", cuadro: "cuadro", maceta: "maceta", estrellas: "estrellas", guirnalda: "guirnalda", gatito: "gatito", cojin: "cojin" };
  const ORDEN = ["jardin", "sala", "cocina", "recamara", "bano"];
  for (const v of (Array.isArray(antes?.cosas) ? antes.cosas : []).slice(0, 40)) {
    const t = VIEJAS[v.k];
    if (!t) continue;
    const c = ORDEN[Math.max(0, Math.min(4, Math.floor((+v.x || 0) / 420)))], w = CUARTOS.find((q) => q.k === c).w;
    const pared = ["cuadro", "estrellas", "guirnalda"].includes(t);
    objetos.push({ id: "v" + String(v.id || Math.random().toString(36).slice(2, 8)).slice(0, 10), t, c, x: Math.round((((+v.x || 0) % 420) / 420) * w), y: pared ? Math.min(PISO - 20, Math.max(80, +v.y || 200)) : 550, f: false, e: {} });
  }
  return { v: 2, cuartos, objetos };
}

/** Lo que hay que mandar para que una casita de antes también tenga un cuarto nuevo (con ids fijos: si los
 *  dos teléfonos lo hacen a la vez, queda igual). */
export function opsCuartoNuevo(k) {
  const c = CUARTOS.find((q) => q.k === k);
  if (!c) return [];
  return [{ o: "cuarto", k, v: { pared: c.pared, patron: c.patron, piso: c.piso, ...(c.afuera ? {} : { t71: 1 }) } },
    ...(INICIAL[k] || []).map(([t, x, y, f], i) => ({ o: "pon", obj: { id: `${k.slice(0, 2)}${i}`, t, c: k, x, y: yDe(t, y), f: !!f, e: {} } }))];
}
/** (Fase 71) Lo alto de lo que cuelga del techo (lo resuelve el catálogo: depende de lo que mide cada foco). */
let altoDe_ = () => 100;
export const usarAltos = (f) => { altoDe_ = f; };
const yDe = (t, y) => (y === "techo" ? colgadoY(altoDe_(t)) : y);
/** (Fase 71) Una casita de antes estrena su techo: a cada cuarto de adentro (que ya tenía) le toca su foco colgado
 *  donde estaba el de siempre (con ids fijos: si los dos teléfonos lo hacen a la vez, queda igual). */
export function opsTecho(casa) {
  const ops = [];
  for (const [k, lista] of Object.entries(INICIAL)) {
    const cu = cuarto(k);
    if (cu.afuera || !casa?.cuartos?.[k] || casa.cuartos[k].t71) continue;
    lista.forEach(([t, x, y, f], i) => { if (y === "techo") ops.push({ o: "pon", obj: { id: `${k.slice(0, 2)}${i}`, t, c: k, x, y: yDe(t, y), f: !!f, e: {} } }); });
    ops.push({ o: "cuarto", k, v: { t71: 1 } });
  }
  return ops;
}

/* ═══ (Fase 61) Cada cuarto de adentro es una cajita en 3D: lo del fondo se ve más chiquito y más hacia el centro
 *  (perspectiva de un punto, como una casita de muñecas). El mundo (x, y) no cambia —todo se guarda igual—;
 *  sólo cambia dónde se DIBUJA. Afuera (jardín y terraza) se queda plano. ═══ */
export const FONDO_3D = 0.75;
/** (Fase 62) Enfrente la cajita también es un poquito más angosta que el cuarto: entre cuarto y cuarto queda el
 *  grueso de la pared (el «corte» de la casita de muñecas), de arriba abajo, en lugar de una V. */
export const FRENTE_3D = 0.95;
/** Lo que mide de cada lado el corte de la pared (en el mundo) para un cuarto de adentro. */
export const corteDe = (k) => (cuarto(k).afuera ? 0 : ((1 - FRENTE_3D) / 2) * cuarto(k).w);            // qué tan chiquito se ve lo del fondo (1 = plano)
export const PARED_3D = 300;            // lo hondo de las paredes de los lados (para su textura)
const lim01 = (v) => Math.max(0, Math.min(1, v));
/** La escala a esa hondura (y del piso; lo de la pared de atrás, como el fondo). */
export function escala3d(c, prof) {
  const cu = cuarto(c);
  if (cu.afuera) return 1;
  return FONDO_3D + (FRENTE_3D - FONDO_3D) * lim01((prof - PISO) / (H - PISO));
}
/** Del mundo a donde se dibuja: x global y su escala. */
export function proyectar(gx, prof) {
  const { c, x } = enCuarto(gx), cu = cuarto(c);
  if (cu.afuera) return { x: gx, s: 1 };
  const s = escala3d(c, prof), mitad = cu.w / 2;
  return { x: inicioDe(c) + mitad + (x - mitad) * s, s };
}
/** De donde se tocó en la pantalla al mundo (a esa hondura). */
export function desproyectar(X, prof) {
  const { c, x } = enCuarto(X), cu = cuarto(c);
  if (cu.afuera) return X;
  const s = escala3d(c, prof), mitad = cu.w / 2;
  return inicioDe(c) + Math.max(4, Math.min(cu.w - 4, mitad + (x - mitad) / s));
}

/**
 * (Fase 63) LAS PUERTAS DE CADA CUARTO: en la pared de atrás (x dentro del cuarto) o en la de un lado (izq/der).
 * `va` es a qué cuarto llevan de entrada; cada puerta se puede cambiar (o quitar) al acomodar. Además, la «Puerta de
 * la casa» (un objeto del catálogo) también es puerta: se pone donde quieras y le eliges a dónde lleva.
 * (Las de atrás quedan donde no estorban las cosas de pared de entrada.)
 */
export const PUERTAS = {
  jardin: [{ id: "ja-a", pared: "atras", x: 1200, va: "sala" }],   // (Fase 64) la puerta de la fachada
  sala: [{ id: "sa-i", pared: "izq", va: "jardin" }, { id: "sa-a", pared: "atras", x: 720, va: "recamara" }, { id: "sa-d", pared: "der", va: "cocina" }],
  cocina: [{ id: "co-i", pared: "izq", va: "sala" }, { id: "co-a", pared: "atras", x: 640, va: "jardin" }, { id: "co-d", pared: "der", va: "recamara" }],
  recamara: [{ id: "re-i", pared: "izq", va: "cocina" }, { id: "re-a", pared: "atras", x: 700, va: "sala" }, { id: "re-d", pared: "der", va: "bano" }],
  bano: [{ id: "ba-i", pared: "izq", va: "recamara" }, { id: "ba-d", pared: "der", va: "estudio" }],
  estudio: [{ id: "es-i", pared: "izq", va: "bano" }, { id: "es-d", pared: "der", va: "terraza" }],
  terraza: [{ id: "te-a", pared: "atras", x: 76, va: "estudio" }],
  extra1: [{ id: "x1-i", pared: "izq", va: "" }, { id: "x1-d", pared: "der", va: "" }],
  extra2: [{ id: "x2-i", pared: "izq", va: "" }, { id: "x2-d", pared: "der", va: "" }],
  extra3: [{ id: "x3-i", pared: "izq", va: "" }, { id: "x3-d", pared: "der", va: "" }],
  extra4: [{ id: "x4-i", pared: "izq", va: "" }, { id: "x4-d", pared: "der", va: "" }],
};
/** El color de las puertas de cada cuarto (su identidad): rosita en la sala, madera en la cocina, lila en la recámara… */
export const COLOR_PUERTA = { jardin: "#e8b48a", sala: "#f2b1c6", cocina: "#e6bd92", recamara: "#c8b5f0", bano: "#a6d9ec", estudio: "#a9c3ea", terraza: "#e0ae84", extra1: "#ffd27a", extra2: "#94dfbd", extra3: "#ff9cbf", extra4: "#8fd0ff" };
/** (Fase 72) Cómo quedan las puertas con la casa en fila (como en el mapita): cada cuarto con sus vecinos de los lados
 *  (el primero, con el jardín: por ahí se entra), sin atajos por atrás; lo de afuera que sólo tiene puerta atrás (la
 *  terraza) va al final. `fila`: los cuartos de la casa, en orden, sin el jardín. */
export function opsFila(fila) {
  const sinLados = (k) => !(PUERTAS[k] || []).some((s) => s.pared === "izq" || s.pared === "der");
  const orden = [...fila.filter((k) => !sinLados(k)), ...fila.filter((k) => sinLados(k))], todos = ["jardin", ...orden], ops = [];
  todos.forEach((k, i) => {
    if (!i) return;
    const izq = todos[i - 1], der = todos[i + 1] || "", v = { orden: i };
    for (const s of PUERTAS[k] || []) v["p:" + s.id] = s.pared === "izq" ? izq : s.pared === "der" ? der : sinLados(k) ? izq : "";
    ops.push({ o: "cuarto", k, v });
  });
  // Del jardín, la puerta de la fachada lleva al primer cuarto.
  ops.push({ o: "cuarto", k: "jardin", v: { "p:ja-a": orden[0] || "sala" } });
  return { ops, orden };
}
/** (Fase 72) Los objetos de entrada de un cuarto que se acaba de obtener. */
export const opsObtener = (k) => (INICIAL[k] || []).map(([t, x, y, f], i) => ({ o: "pon", obj: { id: `${k.slice(0, 2)}${k.slice(-1)}${i}`, t, c: k, x, y: yDe(t, y), f: !!f, e: {} } }));

/** (Fase 64) Una casita de antes con el jardín chiquito: sus cositas de entrada (si no se movieron) van a su lugar en el
 *  patio grande, la «Puerta de la casa» de entrada se quita (ya está la de la fachada) y lo que quedó sobre las espinas,
 *  el seto o un camino se recorre al pasto libre más cercano. Sale igual en los dos teléfonos (todo es fijo). */
const VIEJO_JARDIN = { ja0: [150, 515], ja1: [350, 512], ja2: [44, 552], ja3: [252, 548], ja4: [470, 520], ja5: [540, 522], ja6: [626, 470], ja7: [340, 553], ja8: [430, 470] };
export function opsMudanza(casa, MUDANZA, editable, capaDe) {
  const ops = [];
  for (const o of casa?.objetos || []) {
    if (o.c !== "jardin") continue;
    const v = VIEJO_JARDIN[o.id], quieto = v && Math.abs(o.x - v[0]) < 3 && Math.abs(o.y - v[1]) < 3;
    if (quieto && o.id === "ja6" && o.t === "puerta") { ops.push({ o: "quita", id: o.id }); continue; }
    if (quieto && MUDANZA[o.id]) { ops.push({ o: "pon", obj: { ...o, x: MUDANZA[o.id][0], y: MUDANZA[o.id][1] } }); continue; }
    const capa = capaDe(o.t);
    if (capa === "pared" || capa == null || editable(o.x, o.y)) continue;
    let mejor = null;
    for (let r = 24; r <= 480 && !mejor; r += 24) for (let a = 0; a < 16 && !mejor; a++) { const x = Math.round(o.x + Math.cos(a * Math.PI / 8) * r), y = Math.round(o.y + Math.sin(a * Math.PI / 8) * r * 0.6); if (editable(x, y)) mejor = [x, y]; }
    if (mejor) ops.push({ o: "pon", obj: { ...o, x: mejor[0], y: mejor[1] } });
  }
  ops.push({ o: "cuarto", k: "jardin", v: { mapa: 1 } });
  return ops;
}
