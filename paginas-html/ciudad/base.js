/*
 * BASE — lo que comparten todas las piezas de la ciudad.
 *
 * `J` es el estado del juego: cada módulo cuelga aquí lo suyo (la escena,
 * el jugador, la gente…) y lee lo de los demás. Así no hay importaciones
 * en círculo y cualquier pieza puede preguntar «¿dónde está ella?».
 */
import * as THREE from "three";
export { THREE };

export const J = {
  t: 0,                 // segundos de juego
  dt: 0,
  calidad: null,        // ver main.js
  escena: null, camara: null, render: null,
  jugador: null, novia: null,
  gente: [], animales: [], coches: [],
  dios: { on: false, nivel: 0 },
  caos: 0,
  luz: 1,               // cuánta luz de luna hay (baja cuando la luna se rompe)
  congelado: 0,
};

/* ── matemáticas ── */
export const TAU = Math.PI * 2;
export const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const elegir = (l) => l[Math.floor(Math.random() * l.length)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const suave = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
/* Acercar con amortiguación independiente de los fps. */
export const amort = (v, o, k, dt) => o + (v - o) * Math.exp(-k * dt);
export const difAng = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const amortAng = (v, o, k, dt) => v + difAng(o, v) * (1 - Math.exp(-k * dt));
export const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

/* ── El bus de eventos del mundo ──
   Lo que pasa (una explosión, un rayo, un coche volando) se anuncia aquí
   con su posición, su radio y su fuerza; quien esté cerca y le importe,
   reacciona. Los que están lejos ni se enteran: no cuesta nada. */
const oyentes = [];
export function oir(f) { oyentes.push(f); }
export function anunciar(ev) { ev.t = J.t; for (const f of oyentes) f(ev); }

/* ── Rejilla espacial ──
   Para preguntar «¿quién está cerca de aquí?» sin recorrer a todos. */
export class Rejilla {
  constructor(celda = 10) { this.c = celda; this.m = new Map(); }
  limpiar() { for (const l of this.m.values()) l.length = 0; }
  clave(x, z) { return ((Math.floor(x / this.c) + 512) << 10) | (Math.floor(z / this.c) + 512); }
  meter(o, x, z) { const k = this.clave(x, z); let l = this.m.get(k); if (!l) this.m.set(k, (l = [])); l.push(o); }
  cerca(x, z, r, fuera = []) {
    fuera.length = 0;
    const c = this.c, x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), z0 = Math.floor((z - r) / c), z1 = Math.floor((z + r) / c);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const l = this.m.get(((i + 512) << 10) | (j + 512)); if (l) for (const o of l) fuera.push(o); }
    return fuera;
  }
}

/* ── Texturas hechas a mano en un canvas ── */
export function lienzo(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
export function textura(c, repetir = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}
/* Un brillo redondo (para halos, fuego, humo, chispas). */
export function brillo(paradas, tam = 64) {
  const [c, x] = lienzo(tam, tam), r = x.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
  for (const [o, col] of paradas) r.addColorStop(o, col);
  x.fillStyle = r; x.fillRect(0, 0, tam, tam);
  return textura(c);
}

/* ── Juntar geometrías ──
   Toda la ciudad que no se mueve se junta en unas pocas mallas: menos
   llamadas de dibujo es lo que más se nota en un teléfono. Cada pieza
   lleva su color en los vértices, así un solo material sirve para todo. */
export class Juntador {
  constructor() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.base = 0; }
  meter(geo, matriz, color, uvEscala = null) {
    const g = geo.index ? geo : geo;
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    const v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(matriz);
    const col = new THREE.Color(color);
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(matriz); this.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z);
      this.c.push(col.r, col.g, col.b);
      if (uv) this.u.push(uv.getX(k) * (uvEscala ? uvEscala[0] : 1), uv.getY(k) * (uvEscala ? uvEscala[1] : 1)); else this.u.push(0, 0);
    }
    if (g.index) for (let k = 0; k < g.index.count; k++) this.i.push(g.index.getX(k) + this.base);
    else for (let k = 0; k < pos.count; k++) this.i.push(k + this.base);
    this.base += pos.count;
  }
  caja(x, y, z, w, h, d, color, ry = 0) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(w, h, d));
    this.meter(CAJA, m, color);
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.base > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    return g;
  }
}
export const CAJA = new THREE.BoxGeometry(1, 1, 1);

/* ── Luz de contorno ──
   Un borde de luz lila-rosita en las siluetas: hace que la ropa negra se
   lea de noche y le da a todo el mismo aire de «ilustración nocturna». */
export function contorno(mat, color = "#b8a0ff", fuerza = 0.55, exp = 2.4) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRim = { value: new THREE.Color(color).multiplyScalar(fuerza) };
    sh.fragmentShader = "uniform vec3 uRim;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance += uRim * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), " + exp.toFixed(1) + ");");
  };
  mat.customProgramCacheKey = () => "rim" + color + fuerza + exp;
  return mat;
}

/* ── Proyectar un punto del mundo a la pantalla (para los globitos) ── */
const _v = new THREE.Vector3();
export function aPantalla(x, y, z, fuera) {
  _v.set(x, y, z).project(J.camara);
  fuera.x = (_v.x * 0.5 + 0.5) * J.ancho;
  fuera.y = (-_v.y * 0.5 + 0.5) * J.alto;
  fuera.visible = _v.z < 1 && _v.z > -1;
  return fuera;
}

/* ── Memoria: lo que se descubre se queda ── */
const CLAVE = "ciudad_dormida_3d_v1";
export const memo = (() => { try { const m = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (m && m.misterios) return m; } catch (e) { /* sin memoria */ } return { misterios: {}, poderes: {}, cuenta: {}, ventanas: {} }; })();
export function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(memo)); } catch (e) { /* sin memoria */ } }
export function contar(k, n = 1) { memo.cuenta[k] = (memo.cuenta[k] || 0) + n; guardar(); return memo.cuenta[k]; }
