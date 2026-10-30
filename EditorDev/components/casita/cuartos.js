/**
 * LOS CUARTOS de la casita: cuánto miden, sus colores de entrada y lo que tienen la primera vez.
 * Para agregar un cuarto: una fila en CUARTOS y su acomodo en INICIAL (todo lo demás se ajusta solo).
 * Cada cosa vive en su cuarto con x (desde la orilla izquierda del cuarto) y y (dónde toca el piso).
 */
export const H = 560;          // el alto del mundo
export const PISO = 432;       // donde termina la pared y empieza el piso
export const FONDO = 468;      // lo más atrás que se puede pisar
export const FRENTE = 552;     // lo más adelante
export const SUELO = 524;      // donde se para un monito

export const CUARTOS = [
  { k: "jardin", n: "Jardín", w: 700, afuera: true, pared: "#bfe6ff", patron: "liso", piso: "pasto" },
  { k: "sala", n: "Sala", w: 660, foco: 470, pared: "#ffe1ec", patron: "rayas", piso: "madera" },
  { k: "cocina", n: "Cocina", w: 620, foco: 300, pared: "#f9e4d6", patron: "ladrillo", piso: "mosaico" },
  { k: "recamara", n: "Recámara", w: 660, foco: 600, pared: "#ece3ff", patron: "corazones", piso: "alfombra" },
  { k: "bano", n: "Baño", w: 560, foco: 210, pared: "#dff3fb", patron: "azulejo", piso: "mosaico" },
  { k: "estudio", n: "Estudio", w: 640, foco: 330, pared: "#e3ecff", patron: "estrellas", piso: "clara" },
  { k: "terraza", n: "Terraza", w: 720, afuera: true, terraza: true, pared: "#bfe6ff", patron: "liso", piso: "duela" },
];
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

export const PAREDES = ["#ffe1ec", "#ffd6e0", "#fde8d0", "#f9e4d6", "#fff4c8", "#e6f6ea", "#dff3fb", "#e3ecff", "#ece3ff", "#f3e7da", "#ffffff", "#ffc9de", "#d8f0e6", "#f6dbe9"];
export const PATRONES = [["liso", "Liso"], ["rayas", "Rayitas"], ["puntos", "Puntitos"], ["corazones", "Corazones"], ["ladrillo", "Ladrillo"], ["azulejo", "Azulejo"], ["cuadros", "Cuadritos"], ["estrellas", "Estrellitas"]];
export const PISOS = [["madera", "Madera"], ["clara", "Madera clara"], ["mosaico", "Mosaico"], ["alfombra", "Alfombrita"], ["barro", "Barro"], ["pasto", "Pasto"], ["duela", "Duela de terraza"]];

/** Lo que hay la primera vez en cada cuarto: [tipo, x, y?, volteado?]. */
const INICIAL = {
  jardin: [["arbol", 150, 515], ["banca", 350, 512], ["flores", 44, 552], ["flores", 252, 548], ["buzon", 470, 520], ["farol", 540, 522], ["puerta", 626, 470], ["perrito", 340, 553]],
  sala: [["ventana", 345, 330], ["fotos", 150, 250], ["reloj", 545, 190], ["colgante", 44, 200], ["alfombra", 230, 556], ["lampara", 46, 505], ["sofa", 205, 500], ["mesita", 222, 548], ["tele", 478, 505], ["tocadiscos", 600, 505], ["gatito", 370, 553]],
  cocina: [["alacena", 170, 240], ["ventana", 440, 320], ["refri", 60, 505], ["estufa", 180, 505], ["fregadero", 315, 505], ["mesa", 480, 538], ["silla", 400, 532], ["silla", 560, 532, true]],
  recamara: [["ventana", 230, 320], ["guirnalda", 330, 104], ["cuadro", 480, 250], ["buro", 46, 505], ["cama", 212, 512], ["ropero", 408, 505], ["escritorio", 566, 505], ["silla_esc", 566, 545], ["peluche", 330, 553]],
  bano: [["espejo", 420, 330], ["toallero", 275, 350], ["tapete", 140, 557], ["tina", 138, 512], ["inodoro", 295, 508], ["lavabo", 420, 506], ["patito", 60, 552], ["maceta", 515, 548]],
  estudio: [["ventana", 455, 320], ["neon", 250, 200], ["corcho", 110, 250], ["poster", 592, 250], ["tapete_redondo", 300, 557], ["librero_alto", 64, 505], ["piano", 210, 506], ["guitarra", 312, 540], ["sillon_lectura", 395, 512], ["lampara_arco", 486, 505], ["consola", 562, 506], ["puff", 214, 550], ["globo_mundo", 600, 552]],
  terraza: [["luces", 330, 466], ["hamaca", 128, 476], ["sombrilla", 640, 490], ["mesa_picnic", 560, 512], ["alberca", 300, 545], ["camastro", 112, 552], ["flamenco", 214, 554], ["cactus", 462, 552], ["maceta_grande", 672, 552]],
};

/** La casa de entrada (v2). Si había una casita de antes (v1), se respetan sus colores y sus cositas. */
export function casaInicial(antes) {
  const objetos = [];
  for (const [c, lista] of Object.entries(INICIAL)) lista.forEach(([t, x, y, f], i) => objetos.push({ id: `${c.slice(0, 2)}${i}`, t, c, x, y, f: !!f, e: {} }));
  const cuartos = {};
  for (const c of CUARTOS) cuartos[c.k] = { pared: c.pared, patron: c.patron, piso: c.piso, ...(antes?.cuartos?.[c.k] || {}) };
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
  return [{ o: "cuarto", k, v: { pared: c.pared, patron: c.patron, piso: c.piso } },
    ...(INICIAL[k] || []).map(([t, x, y, f], i) => ({ o: "pon", obj: { id: `${k.slice(0, 2)}${i}`, t, c: k, x, y, f: !!f, e: {} } }))];
}
