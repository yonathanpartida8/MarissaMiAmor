/*
 * LAS LUCES — luz de verdad, no dibujitos que parecen luz.
 *
 *   · El sol (de día) y la luna (de noche) son una sola luz direccional
 *     con sombra. Su caja de sombra sigue al jugador «a saltos de un
 *     texel»: así las sombras no tiemblan ni se arrastran al caminar.
 *   · El cielo y el piso rebotan luz (hemisférica) con los colores de la
 *     hora.
 *   · Las farolas cercanas encienden focos de verdad (SpotLight) que pintan
 *     su charco de luz en el piso, en la gente y en los coches; las dos más
 *     cercanas además proyectan sombra. Las lejanas sólo brillan (la cuenta
 *     de luces se queda fija: cambiarla obligaría a recompilar todo).
 *   · Los coches cercanos llevan sus faros prendidos de noche.
 */
import { J, THREE, amort } from "./base.js";
import { faroles, ACERA_Y } from "./mundo.js";

const L = { sol: null, hemi: null, farolas: [], faros: [], cada: 0 };
export function iniciarLuces(esc) {
  const q = J.calidad;
  L.hemi = new THREE.HemisphereLight("#a8c0ff", "#4a3a3a", 1); esc.add(L.hemi);
  const sol = new THREE.DirectionalLight("#ffffff", 2);
  sol.castShadow = q.sombras;
  sol.shadow.mapSize.set(q.sombraTam, q.sombraTam);
  const R = q.nivel === "alta" ? 38 : 32;
  Object.assign(sol.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 220 });
  sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.045; sol.shadow.radius = 2;
  esc.add(sol, sol.target); L.sol = sol; L.R = R;
  const nF = q.nivel === "alta" ? 7 : q.nivel === "media" ? 5 : 3, nS = q.nivel === "alta" ? 2 : q.nivel === "media" ? 1 : 0;
  for (let i = 0; i < nF; i++) {
    const s = new THREE.SpotLight("#ffcf92", 0, 19, 1.08, 0.7, 1.25);
    if (i < nS && q.sombras) { s.castShadow = true; s.shadow.mapSize.set(512, 512); s.shadow.camera.near = 0.6; s.shadow.camera.far = 12; s.shadow.bias = -0.0008; s.shadow.normalBias = 0.03; }
    esc.add(s, s.target); L.farolas.push({ s, f: null, obj: 0 });
  }
  const nC = q.nivel === "baja" ? 1 : 3;
  for (let i = 0; i < nC; i++) { const s = new THREE.SpotLight("#fff2d8", 0, 30, 0.5, 0.45, 1.4); esc.add(s, s.target); L.faros.push({ s, c: null }); }
  J.luces = L;
}

const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function actualizarLuces(dt, ciclo, foco) {
  const sol = L.sol;
  // ── el sol / la luna, con la caja de sombra pegada a los texeles ──
  sol.color.copy(ciclo.luzColor); sol.intensity = ciclo.luzFuerza;
  const d = ciclo.luz;
  _r.crossVectors(d, _up).normalize(); _u.crossVectors(_r, d).normalize();
  const tx = (L.R * 2) / sol.shadow.mapSize.x;
  _c.set(foco.x, 0, foco.z);
  const a = Math.round(_c.dot(_r) / tx) * tx, b = Math.round(_c.dot(_u) / tx) * tx, e = _c.dot(d);
  _c.copy(_r).multiplyScalar(a).addScaledVector(_u, b).addScaledVector(d, e);
  sol.target.position.copy(_c); sol.position.copy(_c).addScaledVector(d, 110);
  sol.target.updateMatrixWorld();
  L.hemi.color.copy(ciclo.hemiCielo); L.hemi.groundColor.copy(ciclo.hemiSuelo); L.hemi.intensity = ciclo.hemiFuerza * (1 - (J.lloviendo || 0) * 0.25) + (J.relampago || 0) * 2.2;
  // ── las farolas: las más cercanas prenden un foco de verdad ──
  const on = ciclo.farolas * (J.luzCiudad ?? 1);
  if ((L.cada -= dt) <= 0) {
    L.cada = 0.4;
    const cerca = faroles.map((f) => ({ f, d: (f.lx - foco.x) ** 2 + (f.lz - foco.z) ** 2 })).sort((p, q) => p.d - q.d).slice(0, L.farolas.length).map((o) => o.f);
    const libres = L.farolas.filter((l) => !cerca.includes(l.f));
    for (const f of cerca) if (!L.farolas.some((l) => l.f === f)) { const l = libres.shift(); if (!l) break; l.f = f; l.s.intensity = 0; l.s.position.set(f.lx, ACERA_Y + 4.78, f.lz); l.s.target.position.set(f.lx, 0, f.lz); l.s.target.updateMatrixWorld(); }
    // las que proyectan sombra, siempre las dos más cercanas
    const conSombra = L.farolas.filter((l) => l.s.castShadow), sinSombra = L.farolas.filter((l) => !l.s.castShadow);
    for (let i = 0; i < conSombra.length; i++) {
      const quiere = cerca[i]; if (!quiere || conSombra[i].f === quiere) continue;
      const otra = sinSombra.find((l) => l.f === quiere) || conSombra.find((l) => l.f === quiere);
      if (otra) { const t = otra.f; otra.f = conSombra[i].f; conSombra[i].f = t; for (const l of [otra, conSombra[i]]) if (l.f) { l.s.position.set(l.f.lx, ACERA_Y + 4.78, l.f.lz); l.s.target.position.set(l.f.lx, 0, l.f.lz); l.s.target.updateMatrixWorld(); } }
    }
  }
  for (const l of L.farolas) l.s.intensity = amort(l.s.intensity, l.f && !l.f.apagado ? 26 * on : 0, 3, dt);
  // ── los faros de los coches (de tarde y de noche) ──
  const faro = Math.max(0, ciclo.farolas * 1.2 - 0.1);
  const coches = J.coches.filter((c) => (c.estado === "maneja" || c.estado === "conducido" || c.estado === "controlado") && c.fase !== "ARDIENDO" && c.fase !== "RESTOS")
    .map((c) => ({ c, d: (c.x - foco.x) ** 2 + (c.z - foco.z) ** 2 + (c === (J.jugador && J.jugador.coche) ? -1e6 : 0) })).sort((p, q) => p.d - q.d);
  L.faros.forEach((f, i) => {
    const o = coches[i];
    if (!o || o.d > 2500 || faro < 0.02) { f.s.intensity = amort(f.s.intensity, 0, 6, dt); return; }
    const c = o.c, sx = Math.sin(c.ry), sz = Math.cos(c.ry);
    f.s.position.set(c.x + sx * (c.T.L / 2 + 0.1), c.y + 0.15, c.z + sz * (c.T.L / 2 + 0.1));
    f.s.target.position.set(c.x + sx * 14, 0, c.z + sz * 14); f.s.target.updateMatrixWorld();
    f.s.intensity = amort(f.s.intensity, 60 * faro, 6, dt);
  });
}
