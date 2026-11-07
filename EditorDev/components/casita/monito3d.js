/**
 * EL MONITO DE BULTO (Fase 66): el mismo monito pixel de siempre, pero en 3D (cubitos), para sentarse, acostarse,
 * bañarse o columpiarse en cualquier cosa y desde cualquier ángulo: si el sillón está de lado, se sienta de lado;
 * si la cama está girada, se acuesta a lo largo de la cama girada.
 *
 *   · El modelo sale del dibujo de monito.js (con su ropa, su peinado y su carita): la cabeza cruza su vista de frente
 *     con la de lado (un casco visual) y se pinta por fuera con la carita de frente, el perfil de lado y la nuca de
 *     espaldas; el cuerpo, los brazos y las piernas son bloquecitos con su grosor. Un cuadrito del dibujo = un cubito.
 *   · Tiene huesos (cadera, rodillas, hombros) y una pose los dobla: sentado (muslos al frente, canillas abajo),
 *     acostado de ladito (todo el cuerpo sobre la cama, las rodillas tantito dobladas), en la tina (sentado con los
 *     brazos en la orilla). Las transiciones (sentarse, pararse, acostarse) son cuadritos intermedios, como en pixel.
 *   · Se dibuja con la misma proyección que los muebles girados (girar.js) y ADENTRO del mueble: con lo hondo de cada
 *     pixel del mueble, lo que el mueble tiene más cerca (un descansabrazos, la orilla de la tina, la cobija) tapa al
 *     monito pixel por pixel, y lo que está atrás (el respaldo) queda atrás. Nada se atraviesa ni flota: el asiento
 *     y el colchón se miden del mueble.
 */
import { monitoSVG, ropaDe, PIELES } from "./monito.js";
import { rasterizar, ELEV_GIRO as E } from "./girar.js";

const CW = 25, R0 = -6, FILAS = 47, CEL = 3.52;   // (un cuadrito del monito mide 3.52 en el mundo: 100 → 88)
const MODELOS = new Map(), CUADROS = new Map();
const OCULTO = ".ca-sombra,.ca-contacto,.ca-sienta,.ca-sienta-lado,.ca-mano-cosa,.ca-mano-larga,.ojo-f,.ojo-z,.ojo-c,.ojo-s,.ojo-g,.bo-a,.bo-o,.bo-b,.bo-t,.ca-cejas-e,.ca-cuchara";
const CARAS = { normal: "", dormido: ".ojo-n{display:none!important}.ojo-z{display:inline!important}", feliz: ".ojo-n{display:none!important}.ojo-f{display:inline!important}.bo-n{display:none!important}.bo-a{display:inline!important}",
  // (Fase 73) Comiendo: la boquita abierta (para morder y masticar).
  come: ".bo-n{display:none!important}.bo-a{display:none!important}.bo-o{display:inline!important}" };
const VISTAS = { frente: ".ca-lado-solo,.ca-atras-solo", lado: ".ca-frente-solo,.ca-atras-solo", atras: ".ca-lado-solo,.ca-frente-solo" };
const PARTES = {
  cabeza: "svg>:not(.ca-cabeza):not(.ca-pelo-tras)",
  cuerpo: "svg>.ca-cabeza,svg>.ca-pelo-tras,svg>.ca-bi,svg>.ca-bd,svg>.ca-pi,svg>.ca-pd",
  bi: "svg>:not(.ca-bi)", bd: "svg>:not(.ca-bd)", pi: "svg>:not(.ca-pi)", pd: "svg>:not(.ca-pd)",
};
const osc = (c, k = 0.42) => [c[0] * k, c[1] * k * 0.97, c[2] * k + (1 - k) * 40];
const cerca = (a, b, t = 4) => Math.abs(a[0] - b[0]) <= t && Math.abs(a[1] - b[1]) <= t && Math.abs(a[2] - b[2]) <= t;

/** Los cuadritos de una parte del monito (sin su contorno): [fila][columna] → [r, g, b] o null. */
async function celdas(svg, vista, parte, cara = "normal", sinBorde = true) {
  const css = `${OCULTO}{display:none!important}${VISTAS[vista]}{display:none!important}${PARTES[parte]}{display:none!important}${CARAS[cara] || ""}`;
  const s = svg.replace('viewBox="0 0 100 170"', 'viewBox="0 -32 100 202"').replace(/^(<svg[^>]*>)/, `$1<style>${css}</style>`);
  const px = await rasterizar(s, 100, 202), col = new Array(FILAS * CW).fill(null);
  for (let r = 0; r < FILAS; r++) for (let c = 0; c < CW; c++) {
    const i = ((r * 4 + 12) * 100 + c * 4 + 2) * 4;
    if (px[i + 3] > 128) col[r * CW + c] = [px[i], px[i + 1], px[i + 2]];
  }
  // Fuera el contorno (cada orilla es el color de junto, mucho más oscuro): se vuelve a poner al final, ya girado.
  // (La cabeza se queda con el suyo: se dibuja tal cual, como en el dibujo de siempre.)
  if (!sinBorde) return col;
  const quita = [];
  for (let r = 0; r < FILAS; r++) for (let c = 0; c < CW; c++) {
    const k = r * CW + c, v = col[k];
    if (!v) continue;
    const vec = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].map(([cc, rr]) => (cc < 0 || rr < 0 || cc >= CW || rr >= FILAS ? null : col[rr * CW + cc]));
    if (!vec.some((x) => !x)) continue;
    if (vec.some((x) => x && cerca(v, osc(x)))) quita.push(k);
  }
  for (const k of quita) col[k] = null;
  return col;
}

/** El modelo de bulto de un monito con esa ropa (se hace una vez por ropa). */
export function modelo(ropa) {
  const clave = JSON.stringify(ropa || {});
  if (MODELOS.has(clave)) return MODELOS.get(clave);
  const p = (async () => {
    const svg = monitoSVG(ropa || {}), R = { ...ropaDe(""), ...(ropa || {}) };
    // (Fase 67) La cabeza ya no es de cubitos: son los dibujos pixel de la cabeza (de frente, de tres cuartos y de
    // espaldas, con su carita y su peinado tal cual), y se escoge el que toca según hacia dónde ve el monito.
    const [hF, hFz, hFf, hL, hLz, hLf, hA, cu, bi, bd, pi, pd, hFc, hLc] = await Promise.all([
      celdas(svg, "frente", "cabeza", "normal", false), celdas(svg, "frente", "cabeza", "dormido", false), celdas(svg, "frente", "cabeza", "feliz", false),
      celdas(svg, "lado", "cabeza", "normal", false), celdas(svg, "lado", "cabeza", "dormido", false), celdas(svg, "lado", "cabeza", "feliz", false),
      celdas(svg, "atras", "cabeza", "normal", false),
      celdas(svg, "frente", "cuerpo"), celdas(svg, "frente", "bi"), celdas(svg, "frente", "bd"), celdas(svg, "frente", "pi"), celdas(svg, "frente", "pd"),
      celdas(svg, "frente", "cabeza", "come", false), celdas(svg, "lado", "cabeza", "come", false),
    ]);
    const en = (L, c, r) => (c < 0 || r < 0 || c >= CW || r >= FILAS ? null : L[r * CW + c]);
    // De tres cuartos por detrás: la nuca de espaldas, con la orilla del cachete y la orejita del lado que se asoma.
    const pielH = /^#[0-9a-f]{6}$/i.test(R.piel || "") ? R.piel : PIELES[2], pp = [1, 3, 5].map((i) => parseInt(pielH.slice(i, i + 2), 16));
    const esPiel = (c) => !!c && Math.abs(c[0] - pp[0]) + Math.abs(c[1] - pp[1]) + Math.abs(c[2] - pp[2]) < 90;
    const a34 = hA.slice();
    for (let r = 12; r <= 20; r++) {
      for (let c = 16; c <= 19; c++) { const f = en(hF, c, r); if (f && (esPiel(f) || !en(hA, c, r))) a34[r * CW + c] = f; }
      for (let c = 4; c <= 7; c++) { const a = en(hA, c, r); if (esPiel(a)) a34[r * CW + c] = en(hA, c + 1, r) && !esPiel(en(hA, c + 1, r)) ? en(hA, c + 1, r) : en(hA, c + 2, r) || a; }
    }
    const cabezas = { frente: { normal: hF, dormido: hFz, feliz: hFf, come: hFc }, tres: { normal: hL, dormido: hLz, feliz: hLf, come: hLc }, espalda34: { normal: a34 }, espalda: { normal: hA } };
    const vox = [];   // { x, y, z, h (hueso), c: [frente, atrás, izq, der, arriba, abajo] }
    const pon = (x, y, z, h, c, cz = null) => vox.push({ x, y, z, h, c, cz });
    const zc = 5;
    // Cuerpo, brazos y piernas: bloquecitos con su grosor (las orillas de lado, del color de la orilla de su fila).
    // (Fase 67) Redonditos: las esquinas de lo hondo se recortan (el cuerpo y las piernas ya no son cajas).
    const bloque = (L, h, z0, z1, extra = null, redondo = false) => {
      const ancho = (x, r) => { let a = x, b = x; while (en(L, a - 1, r)) a--; while (en(L, b + 1, r)) b++; return [a, b]; };
      const esquina = (x, r, z) => { if (!redondo || (z !== z0 && z !== z1)) return false; const [a, b] = ancho(x, r); return b - a >= 2 && (x === a || x === b); };
      const lleno = (x, r, z) => (z >= z0 && z <= z1 && !!en(L, x, r) && !esquina(x, r, z)) || (extra && extra(x, r, z));
      for (let r = 0; r < FILAS; r++) for (let x = 0; x < CW; x++) {
        const v = en(L, x, r);
        if (!v) continue;
        const [a, b] = ancho(x, r);
        for (let z = z0 - 1; z <= z1; z++) {
          if (!lleno(x, r, z)) continue;
          const ex = [!lleno(x, r, z - 1), !lleno(x, r, z + 1), !lleno(x - 1, r, z), !lleno(x + 1, r, z), !lleno(x, r - 1, z), !lleno(x, r + 1, z)];
          if (!ex.some(Boolean)) continue;
          const at = v.map((q) => q * 0.92);
          pon(x, r, z, typeof h === "function" ? h(r) : h, [ex[0] && v, ex[1] && at, ex[2] && en(L, a, r), ex[3] && en(L, b, r), ex[4] && v, ex[5] && v]);
        }
      }
    };
    const filasDe = (L) => { let a = FILAS, b = -1; for (let r = 0; r < FILAS; r++) for (let c = 0; c < CW; c++) if (L[r * CW + c]) { a = Math.min(a, r); b = Math.max(b, r); } return [a, b]; };
    const [pa, pb] = filasDe(pi.map((v, i) => v || pd[i])), [ba] = filasDe(bi.map((v, i) => v || bd[i]));
    const cadera = pa - 0.5, rodilla = pa + Math.round((pb - pa) * 0.48) - 0.5, hombro = ba + 0.5;
    const zt = zc;
    bloque(cu, "t", zt - 2, zt + 2, null, true);
    bloque(bi, "bi", zt - 1, zt);
    bloque(bd, "bd", zt - 1, zt);
    // Las piernas: el zapato con su puntita al frente.
    const punta = (L) => (x, r, z) => z === zt - 2 && r >= pb - 1 && !!en(L, x, r);
    bloque(pi, (r) => (r < rodilla ? "mi" : "ci"), zt - 1, zt + 1, punta(pi), true);
    bloque(pd, (r) => (r < rodilla ? "md" : "cd"), zt - 1, zt + 1, punta(pd), true);
    const [cuello] = filasDe(cu);
    // (Lo ancho del cuerpo desde el centro: acostado de ladito, eso queda para arriba y para abajo.)
    let medio = 0; for (const v of vox) if (v.h !== "t" || v.y > cadera - 14) medio = Math.max(medio, Math.abs(v.x + 0.5 - 12.5));
    return { vox, cabezas, cuello, cadera, rodilla, hombro, pie: pb + 0.5, zc: zt, centro: (FILAS - 1) / 2 + 2, medio };
  })();
  MODELOS.set(clave, p);
  if (MODELOS.size > 12) MODELOS.delete(MODELOS.keys().next().value);
  return p;
}

/* ── Las poses: cuánto se dobla cada hueso (grados) ── */
export const POSES = {
  parado: { muslo: 0, rodilla: 0, brazo: 0, tronco: 0, rodar: 0 },
  agachado: { muslo: 50, rodilla: 58, brazo: 18, tronco: -12, rodar: 0 },
  sentado: { muslo: 88, rodilla: 86, brazo: 26, tronco: 5, rodar: 0 },
  tina: { muslo: 86, rodilla: 4, brazo: 58, tronco: 14, rodar: 0 },
  medio: { muslo: 60, rodilla: 50, brazo: 20, tronco: 20, rodar: -45 },
  acostado: { muslo: 28, rodilla: 40, brazo: 24, tronco: 0, rodar: -90 },
};
const mezclaPose = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * t]));
export { mezclaPose };

const rad = (g) => (g * Math.PI) / 180;
/** Gira (y, z) alrededor de (jy, jz): positivo = de «abajo» hacia «al frente». */
const doblar = (p, jy, jz, g) => { if (!g) return; const c = Math.cos(rad(g)), s = Math.sin(rad(g)), dy = p[1] - jy, dz = p[2] - jz; p[1] = jy + dy * c + dz * s; p[2] = jz - dy * s + dz * c; };

/**
 * Dibuja el monito en una pose, adentro de un mueble (o solo).
 *   o.g: lo girado del mueble (grados) · o.yaw: hacia dónde ve el monito en el mueble (0 = al frente del mueble)
 *   o.ancla: [x, y, z] del ancla en el mueble (en el mundo: x desde el centro del dibujo, y desde arriba, z desde la
 *   mitad de lo hondo; z positivo = hacia atrás) · o.ancla3d: "cadera" o "centro" · o.cel: tamaño de un cuadrito
 *   o.vg: la vista del mueble (girar.js) para que lo de enfrente lo tape · o.cara: "normal" o "dormido"
 *   Devuelve { url, x, y, w, h }: dónde va la imagen en el cuadro de la vista del mueble (en el mundo).
 */
/** (Fase 73) Dónde está el hombro derecho (de lado a lado): el centro de lo de arriba de su brazo. */
function hombroX(M) {
  let y0 = 1e9, sx = 0, n = 0;
  for (const v of M.vox) if (v.h === "bd" && v.y < y0) y0 = v.y;
  for (const v of M.vox) if (v.h === "bd" && v.y <= y0 + 1) { sx += v.x; n++; }
  return n ? sx / n + 0.5 : 8;
}
export function pintar(M, pose, o) {
  const clave = [o.clave, pose.muslo, pose.rodilla, pose.brazo, pose.brazoD ?? "", pose.brazoDz ?? 0, pose.cabezaY ?? 0, pose.tronco, pose.rodar, o.g, o.yaw, o.ancla.map((v) => v.toFixed(1)).join(","), o.ancla3d, o.cel.toFixed(2), o.cara, o.vg?.g ?? "-", o.vg ? o.vg.OW + "x" + o.vg.OH : ""].join("|");
  if (CUADROS.has(clave)) return CUADROS.get(clave);
  const cel = o.cel, co = Math.cos(rad(o.g)), si = Math.sin(rad(o.g)), cy = Math.cos(rad(o.yaw || 0)), sy = Math.sin(rad(o.yaw || 0));
  const ax = 12, ay = o.ancla3d === "centro" ? M.centro : M.cadera, az = M.zc;
  const hy = M.cadera, hz = M.zc, ky = M.rodilla, sh = M.hombro;
  const xr = (p, h) => {
    // Los huesos (en cuadritos del monito): rodilla, cadera, hombro; luego el cuerpo se inclina sobre la cadera.
    if (h === "ci" || h === "cd") doblar(p, ky, hz, -pose.rodilla);
    if (h[0] === "m" || h[0] === "c") doblar(p, hy, hz, pose.muslo);
    // (Fase 73) El brazo derecho se puede mover aparte (para comer: baja al plato y sube a la boca).
    if (h === "bi") doblar(p, sh, hz, pose.brazo);
    if (h === "bd") {
      doblar(p, sh, hz, pose.brazoD ?? pose.brazo);
      // (Fase 73) …y girar de lado (hacia la cara): así de frente se ve que la mano sube a la boca.
      if (pose.brazoDz) {
        const hx = M._hx ?? (M._hx = hombroX(M)), a = rad(pose.brazoDz * (hx < 12.5 ? -1 : 1)), c = Math.cos(a), s = Math.sin(a), dx = p[0] - hx, dy = p[1] - sh;
        p[0] = hx + dx * c - dy * s; p[1] = sh + dx * s + dy * c;
      }
    }
    if (h === "t" || h === "bi" || h === "bd") doblar(p, hy, hz, pose.tronco);
    // Acostarse de ladito: rueda sobre su centro (la cabeza hacia la izquierda con -90).
    if (pose.rodar) { const c = Math.cos(rad(pose.rodar)), s = Math.sin(rad(pose.rodar)), dx = p[0] - 12, dy = p[1] - M.centro; p[0] = 12 + dx * c - dy * s; p[1] = M.centro + dx * s + dy * c; }
  };
  // Del monito al mueble (mundo) y a la pantalla (la misma proyección de girar.js).
  const alMundo = (p) => {
    let x = (p[0] - ax) * cel, y = (p[1] - ay) * cel, z = (p[2] - az) * cel;
    const x2 = x * cy - z * sy, z2 = x * sy + z * cy;
    x = x2 + o.ancla[0]; y += o.ancla[1]; z = z2 + o.ancla[2];
    const X = x * co - z * si, Z = x * si + z * co;
    return [X, y - Z * E, Z];
  };
  // Las caras de cada cubito: normal y dos ejes sobre la cara.
  const CARA = [[[0, 0, -1], [1, 0, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]];
  const L = [0.42, -0.78, -0.46], pts = [];
  let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
  for (const v of M.vox) {
    const cols = v.c;
    for (let f = 0; f < 6; f++) {
      const col = cols[f];
      if (!col) continue;
      const [n, t1, t2] = CARA[f];
      // La normal ya girada (para saber si se ve y su luz).
      const c0b = [v.x + 0.5, v.y + 0.5, v.z + 0.5], c0 = [...c0b], c1 = [c0[0] + n[0], c0[1] + n[1], c0[2] + n[2]];
      xr(c0, v.h); xr(c1, v.h);
      const w0 = alMundo(c0), w1 = alMundo(c1), nx = w1[0] - w0[0], ny = w1[1] - w0[1] + (w1[2] - w0[2]) * E, nz = w1[2] - w0[2], nl = Math.hypot(nx, ny, nz) || 1;
      if (-E * ny - nz <= 0.02 * nl) continue;
      const luz = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nl), k = Math.max(0.74, Math.min(1.12, 1 + 0.6 * (luz - 0.46)));
      for (const [a, b] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const p = [0, 1, 2].map((q) => c0b[q] + n[q] * 0.5 + (a - 0.5) * t1[q] + (b - 0.5) * t2[q]);
        xr(p, v.h);
        const [X, Y, Z] = alMundo(p);
        pts.push(X, Y, Z, col[0] * k, col[1] * k, col[2] * k);
        if (X < X0) X0 = X; if (X > X1) X1 = X; if (Y < Y0) Y0 = Y; if (Y > Y1) Y1 = Y;
      }
    }
  }
  // (Fase 67) La cabeza: el dibujo pixel que toca según hacia dónde ve (8 direcciones, las de la izquierda en espejo),
  // con su carita (normal, ojitos cerrados o feliz), pegada al cuello y girada si está acostado.
  const phi = ((((o.g || 0) + (o.yaw || 0)) % 360) + 360) % 360;
  const [vista, espejo] = phi <= 22.5 || phi > 337.5 ? ["frente", false] : phi <= 112.5 ? ["tres", false] : phi <= 157.5 ? ["espalda34", false] : phi <= 202.5 ? ["espalda", false] : phi <= 247.5 ? ["espalda34", true] : ["tres", true];
  const caras = M.cabezas[vista], cab = caras[o.cara] || caras.normal;
  const n0 = [12.5, M.cuello, M.zc + 0.5]; xr(n0, "t");
  const [Xn, Yn0, Zn] = alMundo(n0), Yn = Yn0 + (pose.cabezaY || 0) * cel, rr = (Math.round((pose.rodar || 0) / 90) * 90 * Math.PI) / 180, rc = Math.round(Math.cos(rr)), rs = Math.round(Math.sin(rr));
  const celdasCab = [];
  for (let r = 0; r < FILAS; r++) for (let c = 0; c < CW; c++) {
    const col = cab[r * CW + c];
    if (!col) continue;
    const dc = (espejo ? -1 : 1) * (c + 0.5 - 12.5), dr = r - M.cuello, X = Xn + (dc * rc - dr * rs) * cel, Y = Yn + (dc * rs + dr * rc) * cel;
    celdasCab.push(X, Y, col);
    if (X - cel < X0) X0 = X - cel; if (X + cel > X1) X1 = X + cel; if (Y - cel < Y0) Y0 = Y - cel; if (Y + cel > Y1) Y1 = Y + cel;
  }
  // La imagen, en cuadritos del monito.
  const OX = Math.floor(X0 / cel) * cel - cel, OY = Math.floor(Y0 / cel) * cel - cel, W = Math.ceil((X1 - OX) / cel) + 2, H = Math.ceil((Y1 - OY) / cel) + 2;
  const zb = new Float32Array(W * H).fill(1e9), out = new Uint8ClampedArray(W * H * 4), vg = o.vg;
  // ¿Lo tapa el mueble aquí? (lo hondo del mueble en ese punto, en el mundo)
  const tapa = (X, Y, Z) => {
    if (!vg?.zb) return false;
    const i = Math.floor(X / 4 - vg.x0) + 1, j = Math.floor(Y / 4 - vg.y0) + 1;
    if (i < 0 || j < 0 || i >= vg.OW || j >= vg.OH) return false;
    const zm = vg.zb[j * vg.OW + i];
    return zm < 1e8 && zm * 4 < Z - 2.5;
  };
  for (let q = 0; q < pts.length; q += 6) {
    const X = pts[q], Y = pts[q + 1], Z = pts[q + 2], i = Math.floor((X - OX) / cel), j = Math.floor((Y - OY) / cel), k = j * W + i;
    if (i < 0 || j < 0 || i >= W || j >= H || Z >= zb[k]) continue;
    zb[k] = Z;
    if (tapa(X, Y, Z)) { out[k * 4 + 3] = 1; continue; }   // (tapado: no se pinta, pero ya no se ve lo de atrás)
    out[k * 4] = pts[q + 3]; out[k * 4 + 1] = pts[q + 4]; out[k * 4 + 2] = pts[q + 5]; out[k * 4 + 3] = 255;
  }
  for (let k = 0; k < W * H; k++) if (out[k * 4 + 3] === 1) out[k * 4 + 3] = 0;
  // Huequitos de un cuadrito (por lo doblado): se rellenan con el de junto.
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i;
    if (out[k * 4 + 3] || zb[k] < 1e8) continue;
    const vec = [k - 1, k + 1, k - W, k + W].filter((q) => out[q * 4 + 3] === 255);
    if (vec.length >= 3) { const q = vec[0]; out[k * 4] = out[q * 4]; out[k * 4 + 1] = out[q * 4 + 1]; out[k * 4 + 2] = out[q * 4 + 2]; out[k * 4 + 3] = 255; zb[k] = zb[q]; }
  }
  // El contorno oscuro de siempre (del color de junto), donde no lo tape el mueble.
  const borde = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i;
    if (out[k * 4 + 3]) continue;
    const vec = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].find(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && out[(b * W + a) * 4 + 3] === 255);
    if (!vec) continue;
    const q = vec[1] * W + vec[0];
    if (tapa(OX + (i + 0.5) * cel, OY + (j + 0.5) * cel, zb[q])) continue;
    borde.push([k, osc([out[q * 4], out[q * 4 + 1], out[q * 4 + 2]])]);
  }
  for (const [k, c] of borde) { out[k * 4] = c[0]; out[k * 4 + 1] = c[1]; out[k * 4 + 2] = c[2]; out[k * 4 + 3] = 255; }
  // La cabeza encima del cuerpo (con su propio contorno), y el mueble la tapa donde tiene algo más cerca.
  for (let q = 0; q < celdasCab.length; q += 3) {
    const X = celdasCab[q], Y = celdasCab[q + 1], col = celdasCab[q + 2], i = Math.floor((X - OX) / cel), j = Math.floor((Y - OY) / cel), k = j * W + i;
    if (i < 0 || j < 0 || i >= W || j >= H || tapa(X, Y, Zn)) continue;
    out[k * 4] = col[0]; out[k * 4 + 1] = col[1]; out[k * 4 + 2] = col[2]; out[k * 4 + 3] = 255; zb[k] = Zn - 2 * cel;
  }
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.getContext("2d").putImageData(new ImageData(out, W, H), 0, 0);
  const r = { url: cv.toDataURL(), x: OX, y: OY, w: W * cel, h: H * cel };
  CUADROS.set(clave, r);
  if (CUADROS.size > 160) CUADROS.delete(CUADROS.keys().next().value);
  return r;
}

/**
 * Dónde se pone el monito en un mueble (en el mundo del mueble), según la pose de su lugar.
 *   Sentado: la cadera sobre el asiento (medido: lo más alto de esa columna), la espalda pegadita al respaldo si
 *   hay. Acostado: a lo largo, la cabeza del lado de la cabecera (el lado más alto), el cuerpo sobre el colchón.
 *   Devuelve { ancla, ancla3d, yaw, pose, frente (para pararse) }.
 */
export function lugarEn(M, d, l, jx, vg, cel) {
  const PX = 4, Wc = vg ? vg.W : Math.ceil(d.w / PX), D = vg ? vg.D : 20, cz = vg ? vg.cz : (D - 1) / 2;
  const topeEn = (u, z) => { if (!vg) return -1; u = Math.max(0, Math.min(Wc - 1, Math.round(u))); z = Math.max(0, Math.min(D - 1, Math.round(z))); return vg.tope[u * D + z]; };
  const u0 = (d.w / 2 + (l.dx || 0)) / PX;
  // (En el dibujo de siempre la cadera queda aquí: para lo que no se puede medir.)
  const cadera2d = d.h + (l.dy || 0) - (188 - M.cadera * 4) * 0.88;
  if (l.pose === "dormido") {
    // La cabecera: el lado más alto del mueble a lo largo (si son iguales, la cabeza a la izquierda).
    let izq = 0, der = 0;
    for (let u = 0; u < Wc * 0.3; u++) { const t = topeEn(u, cz); if (t >= 0) izq = Math.max(izq, vg.H - t); }
    for (let u = Math.floor(Wc * 0.7); u < Wc; u++) { const t = topeEn(u, cz); if (t >= 0) der = Math.max(der, vg.H - t); }
    const cabeza = der > izq + 3 ? 1 : -1, largo = (FILAS - 6) * cel;
    // A lo largo del colchón: el cuerpo empieza junto a la cabecera y queda en medio de lo largo que alcance.
    // (Si son dos lugares, los dos a lo largo, uno más atrás y otro más adelante en lo hondo: como en una cama de dos.)
    const dos = d.lugares?.length > 1;
    let xc = dos ? 0 : l.dx || 0;
    if (Math.abs(xc) + largo / 2 > d.w / 2 - 6) xc = Math.sign(xc || 1) * Math.max(0, d.w / 2 - 6 - largo / 2);
    const dz = (dos ? (jx === 0 ? -0.22 : 0.22) : 0) * D * PX, zz = cz + dz / PX;
    // El colchón: lo alto de lo que queda debajo del cuerpo, sin contar almohadas ni cabecera (lo más común de abajo).
    const altos = [];
    for (let x = xc - largo / 2; x <= xc + largo / 2; x += PX) { const t = topeEn((d.w / 2 + x) / PX, zz); if (t >= 0) altos.push(t); }
    altos.sort((a, b) => a - b);
    const colchon = altos.length ? altos[Math.floor(altos.length * 0.65)] * PX : d.h + (l.dy || 0) - 81;
    // Acostado de ladito, lo que mide de grueso para arriba es lo ancho del cuerpo: se hunde tantito en el colchón.
    return { ancla: [xc, colchon - (M.medio - 2.4) * cel, dz], ancla3d: "centro", yaw: 0, pose: { ...POSES.acostado, rodar: cabeza < 0 ? -90 : 90 }, cabeza };
  }
  const yaw = l.mira ? (l.mira > 0 ? 90 : -90) : 0;
  // En la tina: sentado con las piernas estiradas al frente (adentro del agua) y los brazos en la orilla.
  // (A lo largo de la tina: el de la izquierda ve a la derecha y el de la derecha a la izquierda, frente a frente.)
  if (l.pose === "banando") return { ancla: [l.dx || 0, cadera2d + 2, 0], ancla3d: "cadera", yaw: (l.dx || 0) <= 0 ? 90 : -90, pose: POSES.tina };
  // Sentado: el respaldo (donde lo alto sube de golpe) y el asiento.
  let zAsiento = -1, zRes = D, tAs = -1;
  if (vg) {
    tAs = topeEn(u0, Math.floor(D * 0.25));
    for (let z = Math.floor(D * 0.25); z < D; z++) { const t = topeEn(u0, z); if (t >= 0 && tAs >= 0 && t < tAs - 3) { zRes = z; break; } }
    zAsiento = tAs;
  }
  const atras = (zRes - cz) * PX - 2.7 * cel;
  const y = zAsiento >= 0 && l.pose !== "columpio" ? zAsiento * PX - 1.4 * cel : cadera2d;
  return { ancla: [l.dx || 0, y, l.mira || zRes >= D ? 0 : atras], ancla3d: "cadera", yaw, pose: POSES.sentado };
}
export { CEL };
