/**
 * EL MONITO (Fase 57): un personajito en pixel art, de tres cuartos y viendo hacia adelante (como los de los
 * juegos de antes), hecho cuadrito por cuadrito en una rejilla de 25 × 41. Cada parte va en su grupo para que
 * camine, salude, se siente y ponga caritas (las clases de siempre: ca-pi, ca-pd, ca-bi, ca-bd, ca-cabeza,
 * ojo-n, ojo-f, ojo-z, ojo-c, ojo-g, ojo-s, bo-n, bo-a, bo-o, bo-t, bo-b…; ver casita.css).
 * El sombreado (luz de arriba a la derecha) y el contorno oscuro de cada parte se calculan solos, así que
 * para agregar ropa o un peinado basta con dibujar su forma.
 * Mide lo mismo que antes (100 × 170, pies en y = 166): un cuadrito = 4.
 */
export const PIELES = ["#fff0e6", "#ffe6d2", "#ffe0c8", "#f6d3b8", "#e8b896", "#c98e68", "#9a6644", "#6e4630"];
export const COLOR_PELO = ["#3a2a35", "#5a3b2e", "#8a5a3b", "#c2603a", "#d9a05b", "#f2d27a", "#e8e1d9", "#ff86b0", "#9b6be0", "#5b8fd9", "#2f2f3a", "#6fbfa0"];
export const COLOR_OJOS = ["#5a3b2e", "#2f2a35", "#3f8a4f", "#3f78c9", "#c08a3e", "#7d8a99", "#8a5ac8", "#d9487f"];
export const COLOR_ROPA = ["#ff8fb8", "#ff5c93", "#ffb3cf", "#c39bff", "#9b6be0", "#7aa7ff", "#86d6f2", "#6fd3a6", "#ffd36e", "#ff9e7a", "#ffffff", "#f3e3d3", "#cfd6de", "#4a5a8a", "#3a3f4a", "#3a2a35", "#8a2e3f"];
export const PEINADOS = [["largo", "Largo"], ["lacio", "Lacio"], ["ondulado", "Ondulado"], ["trenza", "Trenza"], ["coletas", "Coletas"], ["chongo", "Chongo"], ["cola", "Cola alta"], ["bob", "Bob"], ["afro", "Afro"], ["corto", "Corto"], ["picos", "Picos"], ["copete", "Copete"], ["chino", "Chinito"], ["rapado", "Rapado"]];
export const ARRIBAS = [["playera", "Playera"], ["tirantes", "Tirantes"], ["vestido", "Vestido"], ["sudadera", "Sudadera"], ["sueter", "Suéter"], ["blusita", "Blusita"], ["camisa", "Camisa"], ["rayas", "Rayitas"], ["chamarra", "Chamarra"], ["pijama", "Pijama"], ["overol", "Overol"]];
export const ABAJOS = [["pantalon", "Pantalón"], ["jeans", "Jeans"], ["deportivo", "Deportivo"], ["falda", "Falda"], ["short", "Short"]];
export const CALZADOS = [["tenis", "Tenis"], ["botas", "Botas"], ["flats", "Flats"]];
export const OJOS = [["redondos", "Redonditos"], ["grandes", "Grandotes"], ["pestanas", "Pestañitas"], ["puntitos", "Puntitos"]];
export const PECAS = [["no", "Sin pecas"], ["si", "Con pecas"]];
export const ACCESORIOS = [["ninguno", "Nada"], ["mono", "Moño"], ["diadema", "Diadema"], ["flores", "Flores"], ["pasador", "Pasador"], ["orejitas", "Orejitas"], ["gorra", "Gorra"], ["gorro", "Gorrito"], ["lentes", "Lentes"], ["corona", "Corona"], ["audifonos", "Audífonos"], ["bufanda", "Bufanda"], ["aretes", "Aretes"]];

/** La ropa de entrada, según lo que eligió en su perfil (mujer u hombre; si no, algo lindo para todos). */
export function ropaDe(genero) {
  if (genero === "Mujer") return { piel: PIELES[2], pelo: "cola", peloColor: "#2f2f3a", ojosColor: "#3f78c9", arriba: "tirantes", arribaColor: "#cfd6de", abajo: "pantalon", abajoColor: "#8a2e3f", zapatos: "#ffd36e", calzado: "tenis", ojos: "pestanas", pecas: "no", accesorio: "mono" };
  if (genero === "Hombre") return { piel: PIELES[3], pelo: "picos", peloColor: "#5b8fd9", ojosColor: "#3f8a4f", arriba: "tirantes", arribaColor: "#cfd6de", abajo: "deportivo", abajoColor: "#3a3f4a", zapatos: "#ffd36e", calzado: "tenis", ojos: "redondos", pecas: "no", accesorio: "ninguno" };
  return { piel: PIELES[3], pelo: "chino", peloColor: "#8a5a3b", ojosColor: "#5a3b2e", arriba: "sudadera", arribaColor: "#c39bff", abajo: "pantalon", abajoColor: "#4a5a8a", zapatos: "#ff5c93", calzado: "tenis", ojos: "grandes", pecas: "no", accesorio: "ninguno" };
}

/* ── Colores ── */
const seguro = (c, d) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c.toLowerCase() : d);
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
/** Más oscuro, un poquito hacia el morado (las sombras se ven más bonitas que sólo grises). */
const osc = (h, k = 0.78) => { const [r, g, b] = rgb(h); return hex([r * k, g * k * 0.97, b * k + (1 - k) * 40]); };
/** La sombra de la piel: más cálida (hacia rosita), nunca grisácea. */
const sombraPiel = (h, t = 0.2) => { const [r, g, b] = rgb(h), w = [176, 92, 96]; return hex([r + (w[0] - r) * t, g + (w[1] - g) * t, b + (w[2] - b) * t]); };
const cla = (h, t = 0.3) => { const [r, g, b] = rgb(h); return hex([r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t * 0.9]); };

/* ── La rejilla ── */
const U = 4, Y0 = 2, ANCHO = 25;
class Capa {
  constructor() { this.m = new Map(); }
  static k(c, r) { return (r + 8) * 64 + c; }
  pon(c, r, col) { if (c < 0 || c >= ANCHO || r < -6 || r > 41) return this; this.m.set(Capa.k(c, r), [c, r, col]); return this; }
  hay(c, r) { return this.m.has(Capa.k(c, r)); }
  de(c, r) { return this.m.get(Capa.k(c, r))?.[2]; }
  quita(c, r) { this.m.delete(Capa.k(c, r)); return this; }
  fila(r, c0, c1, col) { for (let c = c0; c <= c1; c++) this.pon(c, r, col); return this; }
  caja(c0, r0, c1, r1, col) { for (let r = r0; r <= r1; r++) this.fila(r, c0, c1, col); return this; }
  /** Varias filas de una: [[fila, desde, hasta], …]. */
  filas(lista, col) { for (const [r, a, b] of lista) this.fila(r, a, b, col); return this; }
  ovalo(cx, cy, rx, ry, col, si = () => true) { for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) if (((c - cx) / rx) ** 2 + ((r - cy) / ry) ** 2 <= 1.02 && si(c, r)) this.pon(c, r, col); return this; }
  cada(f) { for (const [c, r, col] of [...this.m.values()]) f(c, r, col); }
  /** Sombrea lo que es de `base`: el lado de atrás (izquierda) y abajo más oscuros; arriba a la derecha, luz. */
  sombrea(base, { o = osc(base), l = cla(base, 0.28), luz = true } = {}) {
    const es = (c, r) => this.hay(c, r);   // (sólo en la orilla de la figura, no junto a los dibujitos)
    const cambios = [];
    this.cada((c, r, col) => {
      if (col !== base) return;
      if (!es(c - 1, r) || !es(c, r + 1)) cambios.push([c, r, o]);
      else if (luz && !es(c, r - 1) && es(c + 1, r)) cambios.push([c, r, l]);
    });
    for (const [c, r, col] of cambios) this.pon(c, r, col);
    return this;
  }
}
/** El contorno de un grupo de capas: cada orilla, del color de lo que bordea pero mucho más oscuro. */
function contorno(capas, k = 0.42) {
  const todo = new Map();
  for (const L of capas) for (const [key, v] of L.m) todo.set(key, v);
  const o = new Capa();
  for (const [, [c, r, col]] of todo) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k2 = Capa.k(c + dc, r + dr);
    if (!todo.has(k2) && !o.m.has(k2)) o.pon(c + dc, r + dr, osc(col, k));
  }
  return o;
}
/** Una capa en SVG: cuadritos juntados por fila (pocos elementos, bordes nítidos). */
function svgDe(L) {
  const filas = new Map();
  for (const [c, r, col] of L.m.values()) { if (!filas.has(r)) filas.set(r, []); filas.get(r).push([c, col]); }
  let s = "";
  for (const [r, l] of filas) {
    l.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < l.length;) {
      let j = i;
      while (j + 1 < l.length && l[j + 1][0] === l[j][0] + 1 && l[j + 1][1] === l[i][1]) j++;
      s += `<rect x="${l[i][0] * U}" y="${Y0 + r * U}" width="${(j - i + 1) * U}" height="${U}" fill="${l[i][1]}"/>`;
      i = j + 1;
    }
  }
  return s;
}
const grupo = (clase, capas, extra = "", { borde = true, attrs = "" } = {}) => `<g${clase ? ` class="${clase}"` : ""}${attrs}>${borde ? svgDe(contorno(capas)) : ""}${capas.map(svgDe).join("")}${extra}</g>`;

/* ── La cara (filas 3–13) ── */
const CARA = [[3, 9, 15], [4, 8, 16], [5, 7, 17], [6, 7, 17], [7, 7, 17], [8, 7, 17], [9, 7, 17], [10, 7, 17], [11, 8, 17], [12, 9, 16], [13, 10, 15]];

/* ── El pelo: la tapa de arriba (todos menos rapado/afro) y, por peinado, el fleco y lo de atrás ── */
function pelo(estilo, P) {
  const frente = new Capa(), atras = new Capa();
  const tapa = () => frente.filas([[0, 9, 14], [1, 7, 16], [2, 6, 17], [3, 5, 18], [4, 5, 18], [5, 5, 9], [6, 5, 9], [7, 6, 9], [8, 6, 8], [9, 6, 8], [10, 7, 8]], P);
  const fleco = (tipo = "normal") => {
    if (tipo === "recto") return frente.filas([[5, 10, 18], [6, 10, 17]], P);
    if (tipo === "picos") { frente.filas([[5, 10, 18]], P); for (const c of [10, 11, 13, 14, 16, 17]) frente.pon(c, 6, P); for (const c of [11, 14, 17]) frente.pon(c, 7, P); return frente; }
    if (tipo === "lado") { frente.filas([[5, 10, 18], [6, 10, 14], [7, 10, 12]], P); frente.pon(10, 8, P); return frente; }
    frente.filas([[5, 10, 18]], P); for (const c of [10, 11, 12, 15, 16]) frente.pon(c, 6, P); frente.pon(10, 7, P); frente.pon(15, 7, P);
    return frente;
  };
  const largo = (hasta, ancho = 4, onda = false) => {
    for (let r = 5; r <= hasta; r++) { const a = onda && r % 4 < 2 ? ancho - 1 : ancho; atras.fila(r, a, 10, P); }
    atras.fila(hasta + 1, ancho + 1, 9, P).fila(hasta + 2, ancho + 2, 8, P);
    atras.caja(13, 11, 16, 16, P);   // lo que cae detrás del hombro de enfrente
  };
  switch (estilo) {
    case "lacio": tapa(); fleco("recto"); largo(24, 4); atras.fila(26, 5, 10, P); break;
    case "ondulado": tapa(); fleco("lado"); largo(22, 4, true); break;
    case "trenza": tapa(); fleco("normal");
      for (let r = 9; r <= 23; r++) atras.fila(r, (r % 2) + 4, (r % 2) + 6, P);
      atras.pon(5, 24, "#ff86b0").pon(6, 24, "#ff86b0").pon(5, 25, P).pon(6, 26, P); break;
    case "coletas": tapa(); fleco("normal");
      atras.ovalo(4, 8, 2.2, 3.4, P).caja(3, 10, 5, 16, P).fila(17, 4, 4, P);
      atras.ovalo(18, 3, 2.2, 2.8, P).caja(18, 5, 20, 12, P).fila(13, 19, 19, P);
      atras.pon(5, 5, "#ff86b0").pon(17, 1, "#ff86b0"); break;
    case "chongo": tapa(); fleco("normal"); atras.ovalo(8, -2, 3, 2.4, P); frente.fila(0, 7, 9, "#ff86b0"); break;
    case "cola": tapa(); fleco("picos");
      atras.ovalo(5, 0, 2.5, 2, P).caja(2, 1, 5, 6, P).caja(1, 6, 4, 13, P).caja(2, 14, 3, 17, P).pon(2, 18, P);
      frente.pon(6, 1, "#c2336b").pon(6, 2, "#c2336b"); break;
    case "bob": tapa(); fleco("recto"); frente.caja(5, 5, 9, 13, P).fila(14, 6, 9, P).caja(16, 7, 18, 12, P); break;
    case "afro": frente.ovalo(12, 3, 9.4, 7, P, (c, r) => !(c >= 10 && c <= 18 && r >= 6)); fleco("normal"); break;
    case "corto": tapa(); fleco("normal"); break;
    case "picos": tapa(); frente.filas([[-1, 8, 9], [-2, 8, 8], [-1, 12, 13], [-2, 13, 13], [-1, 16, 16], [0, 15, 17], [2, 18, 18], [3, 19, 19]], P); fleco("picos"); frente.pon(4, 4, P).pon(4, 6, P); break;
    case "copete": tapa(); frente.filas([[-1, 11, 17], [-2, 13, 17], [-3, 15, 16], [0, 15, 18]], P); fleco("lado"); break;
    case "chino": {
      for (const [x, y] of [[8, 1], [11, 0], [14, 0], [17, 2], [6, 3], [5, 6], [6, 9], [18, 4], [10, 2], [13, 2]]) frente.ovalo(x, y, 2.2, 2.2, P, (c, r) => !(c >= 10 && r >= 6));
      for (const c of [10, 12, 14, 16]) frente.pon(c, 6, P);
      break;
    }
    case "rapado": frente.filas([[1, 8, 15], [2, 7, 16], [3, 6, 17], [4, 6, 17], [5, 6, 9], [6, 6, 9], [7, 6, 8], [8, 6, 8]], cla(P, 0.12)); break;
    default: tapa(); fleco("lado"); largo(21, 4);   // largo
  }
  // Sombra, luz y un brillito en la tapa.
  const base = estilo === "rapado" ? cla(P, 0.12) : P;
  frente.sombrea(base); atras.sombrea(base, { luz: false });
  if (estilo !== "rapado") for (const [c, r] of [[11, 2], [12, 1], [13, 1], [14, 1], [15, 2]]) if (frente.de(c, r)) frente.pon(c, r, cla(P, 0.32));
  // Mechones: rayitas más oscuras en lo largo de atrás.
  atras.cada((c, r, col) => { if (col === P && c % 3 === 1 && r > 8) atras.pon(c, r, osc(P, 0.86)); });
  return { frente, atras };
}

/* ── Los ojitos (con color) y las caritas ── */
const NEGRO = "#2a1d2b", BLANCO = "#ffffff", BOCA = "#b8325f";
function ojitos(estilo, I) {
  const n = new Capa();
  if (estilo === "grandes") n.caja(13, 8, 14, 8, NEGRO).caja(13, 9, 14, 9, I).pon(13, 10, BLANCO).pon(14, 10, osc(I, 0.7)).pon(16, 8, NEGRO).pon(16, 9, I).pon(16, 10, osc(I, 0.7));
  else if (estilo === "puntitos") n.pon(14, 8, NEGRO).pon(14, 9, NEGRO).pon(16, 8, NEGRO).pon(16, 9, NEGRO);
  else { n.fila(8, 13, 14, NEGRO).pon(13, 9, BLANCO).pon(14, 9, I).pon(16, 8, NEGRO).pon(16, 9, I); if (estilo === "pestanas") n.pon(15, 7, NEGRO).pon(12, 8, NEGRO).pon(17, 7, NEGRO); }
  return n;
}
const C = (lista, col) => { const L = new Capa(); for (const [c, r] of lista) L.pon(c, r, col); return L; };
function caritas(r, P, I, piel) {
  const ceja = osc(P, 0.8);
  const g = (cls, ...capas) => `<g class="${cls}">${capas.map(svgDe).join("")}</g>`;
  return [
    g("ca-cejas", C([[13, 7], [14, 7], [16, 7]], ceja)),
    g("ca-cejas-e", C([[13, 6], [14, 7], [16, 7], [17, 6]], ceja)),
    g("ca-ojos ojo-n", ojitos(r.ojos, I)),
    g("ojo-f", C([[13, 9], [14, 8], [15, 9], [16, 8], [17, 9]], NEGRO)),
    g("ojo-z", C([[13, 9], [14, 9], [16, 9]], NEGRO)),
    g("ojo-c", C([[12, 8], [14, 8], [12, 9], [13, 9], [14, 9], [13, 10], [16, 8], [16, 9]], "#ff4d8d"), C([[12, 8]], "#ffc2d6")),
    g("ojo-g", C([[13, 9], [14, 9]], NEGRO), C([[16, 8]], NEGRO), C([[16, 9]], I)),
    g("ojo-s", C([[13, 8], [14, 8], [13, 9], [13, 10], [14, 10], [16, 8], [16, 10]], BLANCO), C([[14, 9], [16, 9]], NEGRO)),
    g("bo-n", C([[15, 11], [16, 11]], BOCA), C([[14, 10]], osc(piel, 0.82))),
    g("bo-a", C([[15, 11], [16, 11]], "#7d1f42"), C([[15, 12], [16, 12]], "#ff6f9c")),
    g("bo-o", C([[16, 11], [16, 12]], "#7d1f42")),
    g("bo-t", C([[14, 12], [15, 11], [16, 11]], BOCA)),
    g("bo-b", C([[15, 11]], BOCA), C([[16, 11], [17, 10], [17, 11]], "#ff5c93")),
  ].join("");
}

/* ── Accesorios (en la cabeza; la bufanda va en el cuello) ── */
function accesorio(k, P) {
  const a = new Capa(), ROSA = "#ff5c93", ROSA2 = "#ff9cbf", ORO = "#ffd84d";
  switch (k) {
    case "mono": a.filas([[0, 5, 5], [1, 5, 6], [2, 5, 5]], ROSA).filas([[0, 9, 9], [1, 8, 9], [2, 9, 9]], ROSA).pon(7, 1, ROSA2); break;
    case "diadema": a.fila(3, 7, 9, ROSA).fila(2, 10, 15, ROSA).pon(16, 3, ROSA).pon(13, 1, ROSA2).pon(14, 1, ROSA2).pon(13, 0, ROSA2); break;
    case "flores": for (const [c, r, col] of [[7, 2, ROSA2], [9, 1, ORO], [11, 0, "#c39bff"], [13, 0, "#86d6f2"], [15, 1, ROSA2], [17, 3, ORO]]) a.pon(c, r, col); break;
    case "pasador": a.pon(16, 4, ORO).pon(17, 4, ORO).pon(16, 3, cla(ORO, 0.5)); break;
    case "orejitas": a.filas([[-3, 6, 6], [-2, 6, 7], [-1, 6, 8], [0, 6, 9]], P).filas([[-3, 16, 16], [-2, 15, 16], [-1, 14, 16], [0, 13, 16]], P).pon(7, -1, ROSA2).pon(15, -1, ROSA2); break;
    case "gorra": a.filas([[-1, 9, 14], [0, 7, 16], [1, 6, 17], [2, 5, 18], [3, 5, 19]], ROSA).fila(4, 15, 21, osc(ROSA, 0.8)).pon(12, -2, BLANCO); break;
    case "gorro": a.filas([[-1, 9, 14], [0, 7, 16], [1, 6, 17], [2, 5, 18]], ROSA2).filas([[3, 5, 18], [4, 5, 18]], ROSA).ovalo(12, -2.6, 1.6, 1.4, BLANCO); for (const c of [7, 10, 13, 16]) a.pon(c, 1, osc(ROSA2, 0.86)); break;
    case "lentes": a.fila(7, 12, 15, NEGRO).fila(10, 12, 15, NEGRO).pon(12, 8, NEGRO).pon(12, 9, NEGRO).pon(15, 8, NEGRO).pon(15, 9, NEGRO).fila(7, 16, 17, NEGRO).fila(10, 16, 17, NEGRO).pon(17, 8, NEGRO).pon(17, 9, NEGRO).fila(8, 9, 11, NEGRO); break;
    case "corona": a.fila(0, 9, 15, ORO).filas([[-1, 9, 9], [-1, 12, 12], [-1, 15, 15], [-2, 9, 9], [-2, 12, 12], [-2, 15, 15]], ORO).pon(12, 0, "#ff4d8d").pon(10, 0, cla(ORO, 0.5)); break;
    case "audifonos": a.filas([[-1, 9, 14], [0, 7, 8], [0, 15, 16], [1, 6, 6], [1, 17, 17]], "#9b6be0").caja(7, 7, 9, 11, "#c39bff").pon(9, 8, cla("#c39bff", 0.4)); break;
    case "aretes": a.pon(9, 11, ORO); break;
  }
  return a;
}

/** El monito en SVG (100 × 170; los pies en y = 166). */
export function monitoSVG(r0) {
  const r = { ...ropaDe(""), ...r0 };
  const piel = seguro(r.piel, PIELES[2]), P = seguro(r.peloColor, "#5a3b2e"), I = seguro(r.ojosColor, "#5a3b2e");
  const A = seguro(r.arribaColor, "#ff8fb8"), B = seguro(r.abajoColor, "#7aa7ff"), Z = seguro(r.zapatos, "#3a2a35");
  const piel2 = sombraPiel(piel);
  const vestido = r.arriba === "vestido", overol = r.arriba === "overol";
  const abajo = vestido ? "" : overol ? "pantalon" : r.abajo;
  const tela = ["pantalon", "jeans", "deportivo"].includes(abajo);

  /* Piernas (con su zapato): cada una en su grupo para que se muevan al caminar. */
  const pierna = (c0) => {
    const L = new Capa(), ropa = new Capa(), zap = new Capa();
    L.caja(c0, 27, c0 + 2, 36, piel);
    if (tela) ropa.caja(c0, 27, c0 + 2, r.calzado === "botas" ? 33 : 36, B);
    if (abajo === "short") ropa.caja(c0, 27, c0 + 2, 29, B);
    if (abajo === "jeans") for (let rr = 28; rr <= 35; rr += 2) ropa.pon(c0 + 2, rr, cla(B, 0.35));
    if (abajo === "jeans" && r.calzado !== "botas") ropa.fila(36, c0, c0 + 2, cla(B, 0.25));
    if (abajo === "deportivo") for (let rr = 27; rr <= 35; rr++) ropa.pon(c0 + 2, rr, rr % 2 ? "#ffffff" : cla(B, 0.7));
    if (r.calzado === "botas") { zap.caja(c0, 33, c0 + 2, 39, Z).pon(c0 + 3, 38, Z).pon(c0 + 3, 39, Z).fila(33, c0, c0 + 2, cla(Z, 0.3)).fila(40, c0, c0 + 3, osc(Z, 0.6)); }
    else if (r.calzado === "flats") { zap.fila(38, c0, c0 + 3, Z).fila(39, c0, c0 + 3, Z).fila(40, c0, c0 + 3, osc(Z, 0.7)).pon(c0 + 2, 38, cla(Z, 0.45)); }
    else { zap.fila(37, c0, c0 + 2, Z).fila(38, c0, c0 + 3, Z).fila(39, c0, c0 + 3, Z).fila(40, c0, c0 + 3, "#f4f1f6").pon(c0 + 2, 37, BLANCO).pon(c0 + 3, 39, cla(Z, 0.3)); }
    L.sombrea(piel, { o: piel2, luz: false }); ropa.sombrea(B, { luz: false }); zap.sombrea(Z);
    return [L, ropa, zap];
  };
  const pi = pierna(9), pd = pierna(13);

  /* Brazos (manga + brazo + mano). */
  const manga = { playera: 18, rayas: 18, overol: 18, vestido: 16, tirantes: 0, blusita: 0 }[r.arriba] ?? 23;
  const brazo = (c0, cuchara = false) => {
    const L = new Capa(), M = new Capa();
    L.caja(c0, 16, c0 + 1, 24, piel).pon(c0 + (c0 < 12 ? 1 : 0), 15, piel).caja(c0, 25, c0 + 1, 25, piel);
    if (manga) { M.caja(c0, 16, c0 + 1, manga, A).pon(c0 + (c0 < 12 ? 1 : 0), 15, A); if (manga === 23) M.fila(23, c0, c0 + 1, osc(A, 0.85)); if (r.arriba === "rayas") M.fila(17, c0, c0 + 1, cla(A, 0.7)); if (r.arriba === "pijama") M.pon(c0, 19, BLANCO); }
    L.sombrea(piel, { o: piel2, luz: false }); M.sombrea(A);
    L.pon(c0 + 1, 25, piel2);
    let cu = "";
    if (cuchara) { const k = new Capa(); k.pon(c0 + 2, 23, "#d8d2dc").pon(c0 + 2, 22, "#d8d2dc").pon(c0 + 2, 21, "#ece8ef").pon(c0 + 3, 21, "#ece8ef").pon(c0 + 2, 20, "#ece8ef"); cu = `<g class="ca-cuchara">${svgDe(contorno([k]))}${svgDe(k)}</g>`; }
    return [L, M, cu];
  };
  const bi = brazo(6), bd = brazo(17, true);

  /* El torso con su ropa (y cadera, falda o vestido). */
  const T = new Capa(), D = new Capa();
  const torsoF = [[15, 9, 15], ...[16, 17, 18, 19, 20, 21, 22, 23].map((rr) => [rr, 8, 16]), [24, 9, 15]];
  T.filas(torsoF, A);
  // Cadera.
  if (abajo && abajo !== "falda") T.filas([[25, 9, 15], [26, 9, 15]], B).fila(25, 9, 15, osc(B, 0.82));
  if (abajo === "falda") T.filas([[25, 9, 15], [26, 8, 16], [27, 8, 16], [28, 7, 17], [29, 7, 17]], B).fila(29, 7, 17, cla(B, 0.3));
  if (abajo === "short") T.pon(12, 26, osc(B, 0.8));
  if (abajo === "jeans") T.pon(12, 25, "#ffd36e");
  if (vestido) { T.filas([[25, 8, 16], [26, 8, 16], [27, 7, 17], [28, 7, 17], [29, 6, 18], [30, 6, 18], [31, 6, 18]], A); T.fila(24, 9, 15, osc(A, 0.8)); T.fila(31, 6, 18, cla(A, 0.35)); }
  const piel3 = (c, rr) => T.pon(c, rr, piel);
  switch (r.arriba) {
    case "tirantes": T.fila(15, 9, 15, piel); for (const c of [9, 10, 14, 15]) piel3(c, 16); T.pon(10, 15, A).pon(14, 15, A); break;
    case "blusita": T.fila(15, 9, 15, piel); T.fila(16, 9, 15, piel); T.pon(10, 16, A).pon(14, 16, A); for (let c = 9; c <= 15; c += 2) T.pon(c, 24, cla(A, 0.5)); break;
    case "playera": case "rayas": case "pijama": case "sueter": T.pon(12, 15, piel).pon(11, 15, osc(A, 0.85)).pon(13, 15, osc(A, 0.85)); break;
    case "vestido": T.pon(12, 15, piel); T.pon(11, 15, BLANCO).pon(13, 15, BLANCO); break;
    case "camisa": T.pon(11, 15, BLANCO).pon(13, 15, BLANCO).pon(12, 15, piel).pon(10, 16, BLANCO).pon(14, 16, BLANCO); for (let rr = 17; rr <= 23; rr++) T.pon(12, rr, osc(A, 0.85)); for (const rr of [18, 20, 22]) T.pon(12, rr, BLANCO); break;
    case "sudadera": T.fila(15, 9, 10, osc(A, 0.8)).pon(12, 15, piel); T.pon(11, 16, BLANCO).pon(13, 16, BLANCO).pon(11, 17, BLANCO).pon(13, 17, BLANCO); T.caja(10, 20, 14, 22, osc(A, 0.88)); T.fila(24, 9, 15, osc(A, 0.82)); break;
    case "chamarra": T.caja(11, 15, 13, 24, "#f4f1f6"); T.pon(12, 15, piel); for (let rr = 16; rr <= 24; rr++) { T.pon(10, rr, osc(A, 0.82)); T.pon(14, rr, osc(A, 0.82)); } T.pon(12, 19, "#ff86b0"); break;
    case "overol": T.pon(12, 15, piel); T.caja(9, 19, 15, 24, B); T.caja(9, 15, 9, 18, B); T.caja(15, 15, 15, 18, B); T.pon(9, 19, "#ffd36e").pon(15, 19, "#ffd36e"); T.caja(11, 20, 13, 21, osc(B, 0.86)); break;
  }
  if (r.arriba === "rayas") for (const rr of [17, 19, 21, 23]) T.fila(rr, 8, 16, cla(A, 0.7));
  if (r.arriba === "sueter") { T.fila(24, 9, 15, osc(A, 0.82)); for (const [c, rr] of [[11, 18], [13, 18], [11, 19], [12, 19], [13, 19], [12, 20]]) T.pon(c, rr, BLANCO); }
  if (r.arriba === "pijama") for (const [c, rr] of [[10, 17], [14, 19], [11, 22], [15, 23], [9, 20]]) T.pon(c, rr, BLANCO);
  if (r.arriba === "playera") for (const [c, rr] of [[11, 19], [13, 19], [11, 20], [12, 20], [13, 20], [12, 21]]) T.pon(c, rr, cla(A, 0.55));
  T.sombrea(A); if (abajo) T.sombrea(B, { luz: false });
  // El cuello y, si hay, la bufanda.
  D.caja(11, 14, 13, 14, piel2);
  if (r.accesorio === "bufanda") { D.filas([[14, 9, 15], [15, 9, 15]], "#ff5c93").caja(14, 16, 15, 20, "#ff5c93"); for (const c of [10, 12, 14]) D.pon(c, 15, "#ff9cbf"); D.pon(14, 20, "#ff9cbf"); }

  /* La cabeza: cara, orejita, pelo y accesorio. */
  const cara = new Capa().filas(CARA, piel);
  // Sombrita debajo del fleco y del lado de atrás; la nariz y los cachetes.
  for (const [c, rr] of [[10, 6], [11, 6], [12, 7], [15, 7], [16, 6], [17, 6], [8, 11], [9, 12], [10, 13], [17, 10]]) cara.pon(c, rr, piel2);
  cara.pon(17, 9, sombraPiel(piel, 0.12)).pon(12, 10, "#ffa3bd").pon(16, 10, "#ffa3bd");
  if (r.pecas === "si") for (const [c, rr] of [[11, 10], [13, 10], [17, 10]]) cara.pon(c, rr, sombraPiel(piel, 0.42));
  const oreja = new Capa().pon(9, 8, piel).pon(9, 9, piel2).pon(9, 10, piel).pon(10, 9, sombraPiel(piel, 0.32));
  const { frente, atras } = pelo(r.pelo, P);
  // (El pelo no tapa los ojitos ni la boca.)
  for (const [c, rr] of [[13, 8], [14, 8], [13, 9], [14, 9], [16, 8], [16, 9], [15, 11], [16, 11]]) frente.quita(c, rr);
  const acc = r.accesorio === "bufanda" ? new Capa() : accesorio(r.accesorio, P);
  const sombra = new Capa();
  for (let c = 6; c <= 18; c++) sombra.pon(c, 41, "rgba(60,30,50,.16)");
  for (let c = 8; c <= 16; c++) sombra.pon(c, 41, "rgba(60,30,50,.24)");

  return `<svg viewBox="0 0 100 170" class="ca-mono-svg pixel-mono" shape-rendering="crispEdges" aria-hidden="true">
    <g class="ca-sombra">${svgDe(sombra)}</g>
    ${atras.m.size ? grupo("ca-pelo-atras", [atras]) : ""}
    ${grupo("ca-bi", bi.slice(0, 2), bi[2], { attrs: ' style="transform-origin:28px 64px"' })}
    ${grupo("ca-pi", pi)}${grupo("ca-pd", pd)}
    ${grupo("", [T, D])}
    ${grupo("ca-bd", bd.slice(0, 2), bd[2], { attrs: ' style="transform-origin:72px 64px"' })}
    <g class="ca-cabeza">${svgDe(contorno([cara, frente, oreja, acc]))}${svgDe(cara)}${svgDe(oreja)}${caritas(r, P, I, piel)}${svgDe(frente)}${svgDe(acc)}</g>
  </svg>`;
}
