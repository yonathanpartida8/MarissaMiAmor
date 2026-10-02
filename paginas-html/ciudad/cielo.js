/*
 * EL CIELO — de día, de tarde y de noche, y visible desde cualquier ángulo.
 *
 * Una cúpula que sigue a la cámara con:
 *   · el degradado de la hora (arriba, en medio y en el horizonte),
 *   · el sol con su halo (rosa al atardecer),
 *   · nubes «de dibujo»: ruido suave con bordes marcados, iluminadas por el
 *     lado del sol y que se van moviendo despacito,
 *   · las estrellas (se apagan con la luz del día),
 *   · la luna (de día se ve tenue, como en la vida real) con su capa de
 *     grietas para el evento,
 *   · y dos anillos de edificios lejanos con sus ventanitas, que de día son
 *     siluetas azuladas y de noche se prenden.
 */
import { J, THREE, rnd, TAU, lienzo, textura, brillo } from "./base.js";

export const luna = { dir: new THREE.Vector3(-0.35, 0.42, -0.84).normalize(), dist: 340, r: 26, malla: null, halo: null, grietas: null, gx: null, estado: "entera", t: 0 };
const cosas = { cielo: null, estrellas: null, anillos: [] };

export function construirCielo(esc) {
  const geo = new THREE.SphereGeometry(450, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uArriba: { value: new THREE.Color() }, uMedio: { value: new THREE.Color() }, uHorizonte: { value: new THREE.Color() },
      uSol: { value: new THREE.Vector3(0, 1, 0) }, uSolColor: { value: new THREE.Color() }, uSolVis: { value: 1 },
      uNubes: { value: new THREE.Color() }, uT: { value: 0 }, uNoche: { value: 0 }, uRojo: { value: 0 }, uLluvia: { value: 0 },
    },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",
    fragmentShader: `uniform vec3 uArriba, uMedio, uHorizonte, uSol, uSolColor, uNubes; uniform float uSolVis, uT, uNoche, uRojo, uLluvia; varying vec3 vP;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float ruido(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * ruido(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vP); float h = d.y;
        float hh = clamp(h, 0.0, 1.0);
        vec3 c = mix(uHorizonte, uMedio, smoothstep(0.0, 0.28, hh));
        c = mix(c, uArriba, smoothstep(0.28, 0.85, hh));
        if (h < 0.0) c = mix(uHorizonte, uHorizonte * 0.55, smoothstep(0.0, -0.2, h));
        // el sol y su halo
        float s = max(dot(d, normalize(uSol)), 0.0);
        c += uSolColor * (pow(s, 6.0) * 0.35 + pow(s, 48.0) * 0.9) * uSolVis;
        c = mix(c, uSolColor * 6.0 + vec3(1.0), smoothstep(0.9985, 0.9993, s) * uSolVis);
        // las nubes (en un techo imaginario: así tienen perspectiva)
        if (h > 0.02) {
          vec2 q = d.xz / (h + 0.12) * 1.6 + vec2(uT * 0.012, uT * 0.004);
          float n = fbm(q) * 0.8 + fbm(q * 2.6 + 3.0) * 0.3;
          float cob = mix(0.56, 0.36, uLluvia);
          float m = smoothstep(cob, cob + 0.07, n) * smoothstep(0.02, 0.22, h);
          float borde = smoothstep(cob + 0.07, cob + 0.2, n);
          float lado = clamp(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSol.x, 0.0, uSol.z))) * 0.5 + 0.5, 0.0, 1.0);
          vec3 nube = mix(uNubes * 0.72, uNubes, borde * 0.6 + lado * 0.4);
          nube += uSolColor * pow(s, 4.0) * 0.6 * uSolVis;
          c = mix(c, nube, m * mix(0.95, 0.75, uNoche));
        }
        c = mix(c, vec3(0.35, 0.06, 0.12), uRojo * (1.0 - hh) * 0.8);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const cielo = new THREE.Mesh(geo, mat); cielo.renderOrder = -10; cielo.frustumCulled = false; esc.add(cielo);
  cosas.cielo = cielo; J.cieloMat = mat;
  // estrellas
  const n = 1800, pos = new Float32Array(n * 3), tam = new Float32Array(n), fase = new Float32Array(n);
  for (let i = 0; i < n; i++) { const y = rnd(0.06, 1), a = rnd(TAU), r = Math.sqrt(1 - y * y); pos.set([Math.cos(a) * r * 420, y * 420, Math.sin(a) * r * 420], i * 3); tam[i] = Math.random() < 0.1 ? rnd(3, 5) : rnd(1, 2.4); fase[i] = rnd(TAU); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); eg.setAttribute("tam", new THREE.BufferAttribute(tam, 1)); eg.setAttribute("fase", new THREE.BufferAttribute(fase, 1));
  const em = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uLuz: { value: 1 }, uDpr: { value: 1 } },
    vertexShader: "attribute float tam; attribute float fase; uniform float uT, uDpr; varying float vA; void main(){ vA = 0.55 + 0.45*sin(uT*(0.6+fase*0.3)+fase*7.0); vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = tam*uDpr; gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform float uLuz; varying float vA; void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(1.0,0.96,0.98)*1.6, a*vA*uLuz); }",
  });
  const est = new THREE.Points(eg, em); est.renderOrder = -9; est.frustumCulled = false; esc.add(est); J.estrellasMat = em; cosas.estrellas = est;
  // la luna
  const [c, x] = lienzo(256, 256);
  const g = x.createRadialGradient(100, 96, 10, 128, 128, 126); g.addColorStop(0, "#fffdf0"); g.addColorStop(0.7, "#f2e6c8"); g.addColorStop(1, "#d8c8a4");
  x.fillStyle = g; x.beginPath(); x.arc(128, 128, 126, 0, TAU); x.fill();
  x.fillStyle = "rgba(170,150,120,.32)"; for (const [a, b, r] of [[90, 100, 26], [160, 150, 20], [140, 80, 14], [80, 170, 16], [180, 100, 10], [110, 140, 9]]) { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); }
  luna.malla = new THREE.Mesh(new THREE.CircleGeometry(luna.r, 48), new THREE.MeshBasicMaterial({ map: textura(c), transparent: true, fog: false, depthWrite: false, color: new THREE.Color(1.6, 1.55, 1.45) }));
  luna.malla.renderOrder = -8;
  const [gc, gx] = lienzo(256, 256); luna.gx = gx; luna.gc = gc;
  luna.grietas = new THREE.Mesh(new THREE.CircleGeometry(luna.r * 1.001, 48), new THREE.MeshBasicMaterial({ map: textura(gc), transparent: true, fog: false, depthWrite: false }));
  luna.grietas.renderOrder = -7;
  luna.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo([[0, "rgba(255,240,210,.55)"], [0.35, "rgba(255,220,200,.16)"], [1, "rgba(255,200,220,0)"]], 128), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  luna.halo.scale.set(luna.r * 9, luna.r * 9, 1); luna.halo.renderOrder = -9;
  for (const m of [luna.malla, luna.grietas, luna.halo]) m.frustumCulled = false;
  esc.add(luna.halo, luna.malla, luna.grietas);
  // el horizonte de ciudad: dos anillos (silueta + ventanitas en otra textura que sólo brilla de noche)
  for (const [r, alto, dens, vy] of [[300, 90, 0.1, -4], [230, 64, 0.16, -2]]) {
    const [hc, hx] = lienzo(2048, 256), [lc, lx] = lienzo(2048, 256);
    let px = 0;
    while (px < 2048) {
      const bw = rnd(20, 70), bh = rnd(60, 240);
      hx.fillStyle = "#ffffff"; hx.fillRect(px, 256 - bh, bw, bh); if (Math.random() < 0.15) hx.fillRect(px + bw / 2, 256 - bh - 30, 3, 30);
      for (let yy = 256 - bh + 6; yy < 250; yy += 10) for (let xx = px + 4; xx < px + bw - 4; xx += 8) if (Math.random() < dens) { lx.fillStyle = `rgba(255,${(rnd(190, 230)) | 0},140,${rnd(0.4, 0.9)})`; lx.fillRect(xx, yy, 3, 4); }
      px += bw + rnd(0, 6);
    }
    const t = textura(hc); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
    const tl = textura(lc); tl.wrapS = THREE.RepeatWrapping; tl.repeat.set(3, 1);
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, alto, 64, 1, true), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false, color: new THREE.Color("#1a1a3a") }));
    const luces = new THREE.Mesh(anillo.geometry, new THREE.MeshBasicMaterial({ map: tl, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    anillo.position.y = luces.position.y = alto / 2 + vy; anillo.renderOrder = -6; luces.renderOrder = -5;
    anillo.frustumCulled = luces.frustumCulled = false;
    esc.add(anillo, luces); cosas.anillos.push({ anillo, luces, lejos: r > 260 });
  }
}

const _c = new THREE.Color();
/* Cada cuadro: la cúpula sigue a la cámara y se pinta con la hora. */
export function actualizarCielo(cam, ciclo, dt) {
  const p = cam.position;
  cosas.cielo.position.copy(p); cosas.estrellas.position.copy(p);
  for (const a of cosas.anillos) { a.anillo.position.x = a.luces.position.x = p.x; a.anillo.position.z = a.luces.position.z = p.z; }
  const u = J.cieloMat.uniforms;
  u.uArriba.value.copy(ciclo.arriba); u.uMedio.value.copy(ciclo.medio); u.uHorizonte.value.copy(ciclo.horizonte);
  u.uSol.value.copy(ciclo.sol); u.uSolColor.value.copy(ciclo.solColor); u.uSolVis.value = Math.max(0, Math.min(1, (ciclo.sol.y + 0.08) / 0.12));
  u.uNubes.value.copy(ciclo.nubes); u.uT.value += dt; u.uNoche.value = ciclo.noche; u.uLluvia.value = J.lloviendo || 0;
  J.estrellasMat.uniforms.uLuz.value = ciclo.estrellas * (1 - (J.lloviendo || 0) * 0.85);
  // los edificios lejanos: del color del horizonte (un poco más oscuros) y sus ventanas sólo de noche
  for (const a of cosas.anillos) {
    _c.copy(ciclo.horizonte).lerp(ciclo.medio, a.lejos ? 0.25 : 0.45).multiplyScalar(a.lejos ? 0.62 : 0.5);
    a.anillo.material.color.copy(_c);
    a.luces.material.opacity = ciclo.ventanas; a.luces.visible = ciclo.ventanas > 0.02;
  }
  // la luna: tenue de día
  const k = 0.3 + 0.7 * ciclo.noche;
  luna.malla.material.opacity = k; luna.halo.material.opacity = 0.15 + 0.85 * ciclo.noche;
}
export function colocarLuna(cam) {
  const p = cam.position;
  const x = p.x + luna.dir.x * luna.dist, y = p.y + luna.dir.y * luna.dist, z = p.z + luna.dir.z * luna.dist;
  const sx = luna.sx || 0, sy = luna.sy || 0;
  for (const m of [luna.malla, luna.grietas, luna.halo]) { m.position.set(x + sx, y + sy, z); m.quaternion.copy(cam.quaternion); }
  luna.pos = luna.malla.position;
  if (J.cieloSigue) J.cieloSigue(p, cam);
}
