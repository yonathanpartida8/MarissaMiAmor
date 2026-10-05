/*
 * LOS CALLEJONES — cuatro manzanas tienen un pasillo que las cruza de calle
 * a calle (ver `callejones` en mundo.js). Aquí se llenan de vida:
 *
 *   · contenedores de basura (te puedes subir), bolsas, cajas y huacales;
 *   · aires acondicionados que gotean, tubos por las paredes;
 *   · un tendedero con ropa que se mece y una serie de foquitos;
 *   · charcos que reflejan el cielo y una rejilla que echa vapor;
 *   · un letrero de neón que parpadea y grafitis («M ♥ Y», «te amo»);
 *   · y en uno de ellos, un gato negro sentado en el contenedor… que guarda
 *     un secreto (misterio «el callejón»), y una cartita escondida.
 *
 * Todo lo fijo va junto en pocas mallas (rápido en el teléfono).
 */
import { J, THREE, rnd, elegir, Juntador, toon, pbr, lienzo, textura, brillo, capaEfectos, sinManchaCerca, contar } from "./base.js";
import { callejones, edificios, ACERA_Y } from "./mundo.js";
import { son } from "./audio.js";
import * as fx from "./efectos.js";
import { abrirTarjeta, globito } from "./ui.js";
import { decirElla } from "./jugador.js";

const ropa = [], vapores = [], neones = [], goteos = [];
let gato = null, carta = null, foquitos = null, luz = null;

/* Un grafiti en canvas (letras de aerosol con contorno). */
function grafiti(txt, colores) {
  const [c, x] = lienzo(512, 256);
  x.clearRect(0, 0, 512, 256);
  x.font = "bold 120px 'Arial Black', Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineJoin = "round"; x.lineWidth = 22; x.strokeStyle = "#1a1020"; x.strokeText(txt, 256, 132);
  const g = x.createLinearGradient(0, 60, 0, 200); g.addColorStop(0, colores[0]); g.addColorStop(1, colores[1]);
  x.fillStyle = g; x.fillText(txt, 256, 132);
  // escurridos de pintura
  x.fillStyle = colores[1]; for (let i = 0; i < 9; i++) { const px = rnd(110, 400); x.fillRect(px, rnd(160, 180), 5, rnd(20, 60)); }
  const t = textura(c); return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
}
/* El letrero de neón (texto que brilla). */
function neon(txt, color) {
  const [c, x] = lienzo(512, 160);
  x.clearRect(0, 0, 512, 160); x.font = "italic bold 92px 'Brush Script MT', 'Segoe Script', cursive"; x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = color; x.shadowBlur = 26; x.fillStyle = "#ffffff"; x.fillText(txt, 256, 82); x.fillText(txt, 256, 82);
  const m = new THREE.MeshBasicMaterial({ map: textura(c), transparent: true, depthWrite: false, color: new THREE.Color(color).multiplyScalar(2.2) });
  return m;
}

export function iniciar(esc) {
  if (!callejones.length) return;
  const J1 = new Juntador();   // lo fijo con colores (contenedores, cajas, tubos…)
  const charcos = [], focos = [];
  const matCharco = new THREE.MeshStandardMaterial({ color: "#0c0e16", roughness: 0.04, metalness: 0.9, envMapIntensity: 1.6 });
  callejones.forEach((cj, i) => {
    const { x0, x1, z0, z1 } = cj, zc = (z0 + z1) / 2, L = x1 - x0;
    // el piso del callejón: asfalto viejo, un poquito más oscuro que la banqueta
    J1.caja((x0 + x1) / 2, ACERA_Y + 0.005, zc, L - 0.6, 0.01, z1 - z0 - 0.2, "#4a4652");
    // contenedores de basura (dos por callejón), uno de cada lado; te puedes subir
    for (const [fx0, lado, col] of [[0.28, -1, elegir(["#2f6a4a", "#2a4a7a", "#5a3a2a"])], [0.72, 1, elegir(["#2f6a4a", "#2a4a7a", "#6a2a2a"])]]) {
      const x = x0 + L * fx0, z = lado < 0 ? z0 + 0.75 : z1 - 0.75;
      J1.caja(x, ACERA_Y + 0.62, z, 1.9, 1.2, 1.1, col); J1.caja(x, ACERA_Y + 1.26, z - lado * 0.06, 2.0, 0.08, 1.25, "#1e2a24");
      for (const s of [-1, 1]) J1.caja(x + s * 0.8, ACERA_Y + 0.1, z, 0.12, 0.2, 0.12, "#222");
      edificios.push({ x0: x - 0.95, x1: x + 0.95, z0: z - 0.55, z1: z + 0.55, h: ACERA_Y + 1.3, mueble: true });
      // bolsas de basura y cajas junto al contenedor
      for (let k = 0; k < 3; k++) J1.meter(new THREE.SphereGeometry(0.32, 10, 8).scale(1, 0.75, 0.9), new THREE.Matrix4().makeTranslation(x + 1.25 + k * 0.45, ACERA_Y + 0.22, z + rnd(-0.2, 0.2)), elegir(["#14141a", "#1c1c24", "#2a2a3a"]));
      J1.caja(x - 1.4, ACERA_Y + 0.3, z, 0.7, 0.6, 0.6, "#a87a4a", rnd(-0.3, 0.3)); J1.caja(x - 1.35, ACERA_Y + 0.85, z + 0.05, 0.55, 0.5, 0.5, "#b88a5a", rnd(-0.3, 0.3));
    }
    // tubos por las paredes y aires acondicionados que gotean
    for (const z of [z0 + 0.12, z1 - 0.12]) {
      for (let k = 0; k < 3; k++) J1.meter(new THREE.CylinderGeometry(0.07, 0.07, 9, 8), new THREE.Matrix4().makeTranslation(x0 + 3 + k * 9 + rnd(-1, 1), 4.5, z), "#6a6470");
      for (let k = 0; k < 3; k++) { const ax = x0 + rnd(4, L - 4), ay = rnd(4.5, 8.5), az = z + (z < zc ? 0.35 : -0.35); J1.caja(ax, ay, az, 0.9, 0.6, 0.6, "#c8c8d0"); J1.caja(ax, ay, az + (z < zc ? 0.31 : -0.31), 0.5, 0.5, 0.02, "#2a2a30"); goteos.push({ x: ax, y: ay - 0.3, z: az, t: rnd(2) }); }
    }
    // charcos (reflejan el cielo de verdad)
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.6, 1.2), 20).scale(1, rnd(0.5, 0.8), 1).rotateX(-Math.PI / 2), matCharco); m.position.set(x0 + rnd(3, L - 3), ACERA_Y + 0.02, zc + rnd(-1.4, 1.4)); m.receiveShadow = true; charcos.push(m); esc.add(m); }
    // la rejilla con vapor
    { const vx = x0 + L * 0.5 + rnd(-3, 3), vz = zc + rnd(-1, 1); J1.caja(vx, ACERA_Y + 0.02, vz, 1, 0.03, 0.7, "#2a2a30"); vapores.push({ x: vx, z: vz, t: 0 }); }
    // el tendedero con ropa (cada prenda se mece sola)
    { const cx = x0 + L * rnd(0.35, 0.65), h = rnd(5.2, 6.2);
      J1.meter(new THREE.CylinderGeometry(0.012, 0.012, z1 - z0, 4).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(cx, h, zc), "#ddd");
      for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rnd(0.5, 0.8), rnd(0.6, 0.9)).translate(0, -0.35, 0), new THREE.MeshStandardMaterial({ color: elegir(["#ff8ab0", "#8ad0ff", "#fff2c0", "#b0f0c0", "#ffffff", "#d0a0ff"]), side: THREE.DoubleSide, roughness: 0.9 }));
        m.position.set(cx, h, z0 + 0.9 + k * (z1 - z0 - 1.8) / 4); m.rotation.y = Math.PI / 2; esc.add(m); ropa.push({ m, f: rnd(10) }); } }
    // la serie de foquitos en zigzag a lo largo del callejón
    for (let s = 0; s < 6; s++) { const xa = x0 + 2 + s * (L - 4) / 6, xb = xa + (L - 4) / 6, za = s % 2 ? z0 + 0.3 : z1 - 0.3, zb = s % 2 ? z1 - 0.3 : z0 + 0.3;
      for (let k = 0; k <= 6; k++) { const u = k / 6; focos.push(xa + (xb - xa) * u, 4.6 - Math.sin(u * Math.PI) * 0.5, za + (zb - za) * u); } }
    // grafitis y un neón
    const pared = (txt, cols, x, z, ancho) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, ancho / 2), grafiti(txt, cols)); m.position.set(x, 1.7, z < zc ? z0 + 0.03 : z1 - 0.03); m.rotation.y = z < zc ? 0 : Math.PI; esc.add(m); };
    pared(elegir(["M ♥ Y", "M + Y", "TE AMO"]), ["#ff7ab0", "#c03070"], x0 + L * 0.22, z0, 3.4);
    pared(elegir(["SIEMPRE", "TE AMO", "AMOR", "♥ ♥ ♥"]), ["#7ae0ff", "#3060c0"], x0 + L * 0.62, z1, 3.2);
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), neon(elegir(["Bar ♥", "Tattoo", "Café ☾", "Open"]), elegir(["#ff4fa0", "#4fd8ff", "#ffb04f"])));
    nm.position.set(x0 + L * 0.8, 3.2, z0 + 0.05); esc.add(capaEfectos(nm)); neones.push({ m: nm, f: rnd(10) });
    // el gato negro (en el primer callejón) y la cartita escondida (en el último)
    if (i === 0) {
      const g = new THREE.Group(), negro = pbr({ color: "#121218", roughness: 0.6 });
      const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10).scale(1, 0.85, 1.4), negro); cuerpo.position.y = 0.2; g.add(cuerpo);
      const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), negro); cabeza.position.set(0, 0.42, 0.18); g.add(cabeza);
      for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), negro); o.position.set(s * 0.07, 0.55, 0.17); g.add(o);
        const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.5, 0.3) })); ojo.position.set(s * 0.05, 0.44, 0.29); g.add(ojo); }
      const cola = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.4, 4, 6).translate(0, 0.2, 0), negro); cola.position.set(0, 0.15, -0.25); cola.rotation.x = -0.6; g.add(cola);
      const x = x0 + L * 0.28, z = z0 + 0.75; g.position.set(x, ACERA_Y + 1.3, z); g.rotation.y = 0.4; esc.add(g);
      gato = { g, cola, x, z, visto: false };
    }
    if (i === callejones.length - 1) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.22), new THREE.MeshStandardMaterial({ color: "#fff2e6", emissive: "#ff9ac0", emissiveIntensity: 0.35 }));
      m.position.set(x0 + L * 0.72 - 1.4, ACERA_Y + 1.12, z1 - 0.75); m.rotation.y = 0.3; esc.add(m); carta = { m, x: m.position.x, z: m.position.z, abierta: false };
    }
  });
  const mf = new THREE.Mesh(J1.geometria(), toon({ vertexColors: true })); mf.castShadow = J.calidad.sombras; mf.receiveShadow = true; esc.add(mf);
  // los foquitos: un solo Points para todos
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(focos, 3));
  foquitos = new THREE.Points(g, sinManchaCerca(new THREE.PointsMaterial({ size: 0.42, map: brillo([[0, "rgba(255,240,200,1)"], [0.3, "rgba(255,200,130,.6)"], [1, "rgba(255,180,100,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.3, 0.9) })));
  foquitos.frustumCulled = false; esc.add(capaEfectos(foquitos));
  // una sola luz cálida que se va al callejón donde estoy (la de los foquitos)
  luz = new THREE.PointLight("#ffc890", 0, 24, 1.6); luz.position.set(0, -50, 0); esc.add(luz);
}

export function actualizar(dt) {
  if (!callejones.length) return;
  const yo = J.jugador, t = J.t, noche = J.ciclo ? J.ciclo.farolas : 1;
  const cerca = (x, z, r) => Math.hypot(x - yo.x, z - yo.z) < r;
  // la ropa se mece con el aire
  for (const r of ropa) r.m.rotation.x = Math.sin(t * 1.6 + r.f) * 0.18 + Math.sin(t * 3.7 + r.f) * 0.05;
  // el vapor de las rejillas y las gotas de los aires (sólo si estoy cerca: barato)
  for (const v of vapores) if (cerca(v.x, v.z, 40) && Math.random() < dt * 6) fx.humo(v.x + rnd(-0.3, 0.3), ACERA_Y + 0.1, v.z + rnd(-0.2, 0.2), 1, 0.9, false);
  for (const gt of goteos) if (cerca(gt.x, gt.z, 25) && (gt.t -= dt) < 0) { gt.t = rnd(1.2, 3); fx.agua(gt.x, gt.y, gt.z, 1, 0.3); }
  // los neones parpadean (de vez en cuando se apagan un instante)
  for (const n of neones) { const fallo = Math.sin(t * 13 + n.f) > 0.96 || Math.sin(t * 0.7 + n.f) > 0.985; n.m.material.opacity = fallo ? 0.25 : 0.65 + 0.35 * noche; }
  if (foquitos) foquitos.material.opacity = 0.35 + 0.65 * noche;
  // la luz cálida: en el callejón más cercano, si estoy cerca
  if (luz) {
    let mejor = null, md = 1e9;
    for (const c of callejones) { const d = Math.hypot((c.x0 + c.x1) / 2 - yo.x, (c.z0 + c.z1) / 2 - yo.z); if (d < md) { md = d; mejor = c; } }
    const quiere = md < 32 ? (6 + 30 * noche) : 0;
    if (mejor) luz.position.set(Math.max(mejor.x0 + 3, Math.min(mejor.x1 - 3, yo.x)), 4.3, (mejor.z0 + mejor.z1) / 2);
    luz.intensity += (quiere * (0.92 + 0.08 * Math.sin(t * 9)) - luz.intensity) * Math.min(1, dt * 3);
  }
  // el gato: mueve la cola; si llego cerca, maúlla… y me enseña el secreto
  if (gato) {
    gato.cola.rotation.z = Math.sin(t * 2.2) * 0.5;
    if (!gato.visto && cerca(gato.x, gato.z, 2.4)) {
      gato.visto = true; son("miau", gato.x, gato.z, 1);
      fx.corazones(gato.x, ACERA_Y + 1.9, gato.z, 6, 1.2);
      globito({ x: gato.x, y: ACERA_Y + 1.3, z: gato.z }, "Miau 🐾", "gente", 2, 0.9);
      setTimeout(() => decirElla(elegir(["¡Un gatito negro! Dicen que traen mala suerte… a mí me trajo a ti 🖤", "Mira cómo nos mira… creo que nos aprueba 🐈‍⬛"])), 900);
      J.misterio && J.misterio("callejon");
    }
  }
  // la cartita escondida
  if (carta && !carta.abierta) {
    carta.m.position.y = ACERA_Y + 1.12 + Math.sin(t * 2) * 0.03; carta.m.material.emissiveIntensity = 0.3 + 0.25 * Math.sin(t * 3);
    if (cerca(carta.x, carta.z, 1.6)) {
      carta.abierta = true; carta.m.visible = false; son("magia"); contar("cartaCallejon");
      abrirTarjeta(`<h2>Una cartita en el callejón</h2><p>«Si algún día te pierdes en esta ciudad, busca los foquitos. Siempre te llevan a mí.»</p><p style="opacity:.7">— Y.</p><button class="cd-btn" data-cerrar>Guardarla 💌</button>`);
    }
  }
}
