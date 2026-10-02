/*
 * EL POSTPROCESO — lo que convierte la imagen en «dibujo».
 *
 * 1. La escena se pinta en una textura con antialiasing (MSAA) y su
 *    profundidad, en luz lineal sin recortar (para que lo brillante pueda
 *    pasar de 1).
 * 2. Contornos: donde la profundidad «se quiebra» (siluetas y esquinas) se
 *    traza una línea de tinta violeta, que se va desvaneciendo a lo lejos.
 *    Se mide sobre 1/profundidad, que en una superficie plana cambia en
 *    línea recta: así el piso y las paredes no se llenan de rayas falsas.
 *    La tinta se pone SÓLO sobre lo sólido: los efectos transparentes
 *    (fuego, humo, chispas, haces, portal…) viven en la capa 1 y se pintan
 *    después, encima de la tinta. Así el humo tapa los contornos de lo que
 *    hay detrás en vez de dejar un «boceto» fantasma flotando.
 * 3. Resplandor (bloom): lo que brilla de verdad (farolas, ventanas,
 *    neón, poderes) se difumina en una cadena de texturas cada vez más
 *    chicas y se suma, como luz que se derrama.
 * 4. Al final, el color: tono ACES, un poco más de saturación, el matiz
 *    de la hora del día y una viñeta suave.
 *
 * En calidad baja no hay resplandor ni MSAA: sólo contornos y color.
 */
import { J, THREE } from "./base.js";

const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

export class Post {
  constructor(render, nivel) {
    this.r = render;
    const ext = render.extensions;
    this.hdr = ext.has("EXT_color_buffer_float") || ext.has("EXT_color_buffer_half_float");
    this.tipo = this.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quad.frustumCulled = false;
    this.escena = new THREE.Scene(); this.escena.add(this.quad);
    this.niveles = 0; this.rts = [];
    this.principal = null;
    this.ponerNivel(nivel);
    // ── los materiales de cada paso ──
    this.mBrillo = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: null }, uUmbral: { value: 1.0 }, uSuave: { value: 0.5 } },
      fragmentShader: `uniform sampler2D tColor; uniform float uUmbral, uSuave; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tColor, vUv).rgb; float l = max(c.r, max(c.g, c.b));
          float k = clamp(l - uUmbral + uSuave, 0.0, 2.0 * uSuave); k = k * k / (4.0 * uSuave + 1e-4);
          float w = max(k, l - uUmbral) / max(l, 1e-4); gl_FragColor = vec4(min(c * w, vec3(12.0)), 1.0); }`,
    });
    this.mBajar = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: null }, uTexel: { value: new THREE.Vector2() } },
      fragmentShader: `uniform sampler2D tColor; uniform vec2 uTexel; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tColor, vUv).rgb * 4.0;
          c += texture2D(tColor, vUv + uTexel * vec2(-1.0, -1.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(1.0, -1.0)).rgb;
          c += texture2D(tColor, vUv + uTexel * vec2(-1.0, 1.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(1.0, 1.0)).rgb;
          gl_FragColor = vec4(c / 8.0, 1.0); }`,
    });
    this.mSubir = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true,
      uniforms: { tColor: { value: null }, uTexel: { value: new THREE.Vector2() }, uPeso: { value: 1 } },
      fragmentShader: `uniform sampler2D tColor; uniform vec2 uTexel; uniform float uPeso; varying vec2 vUv;
        void main(){ vec3 c = vec3(0.0);
          c += texture2D(tColor, vUv + uTexel * vec2(-2.0, 0.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(2.0, 0.0)).rgb;
          c += texture2D(tColor, vUv + uTexel * vec2(0.0, -2.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(0.0, 2.0)).rgb;
          c += 2.0 * texture2D(tColor, vUv + uTexel * vec2(-1.0, -1.0)).rgb; c += 2.0 * texture2D(tColor, vUv + uTexel * vec2(1.0, -1.0)).rgb;
          c += 2.0 * texture2D(tColor, vUv + uTexel * vec2(-1.0, 1.0)).rgb; c += 2.0 * texture2D(tColor, vUv + uTexel * vec2(1.0, 1.0)).rgb;
          gl_FragColor = vec4(c / 12.0 * uPeso, 1.0); }`,
    });
    // la tinta: dónde va contorno (sólo con la profundidad de lo sólido)
    this.mTinta = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false,
      uniforms: { tProf: { value: null }, uTexel: { value: new THREE.Vector2() }, uCerca: { value: 0.3 }, uLejos: { value: 900 }, uLinea: { value: 1 } },
      fragmentShader: `#include <packing>
        uniform sampler2D tProf; uniform float uCerca, uLejos, uLinea; uniform vec2 uTexel; varying vec2 vUv;
        float inv(vec2 uv){ float d = texture2D(tProf, uv).x; float z = -perspectiveDepthToViewZ(d, uCerca, uLejos); return 1.0 / max(z, 0.05); }
        void main(){
          vec2 o = uTexel * uLinea;
          float w = inv(vUv), wl = inv(vUv - vec2(o.x, 0.0)), wr = inv(vUv + vec2(o.x, 0.0)), wd = inv(vUv - vec2(0.0, o.y)), wu = inv(vUv + vec2(0.0, o.y));
          float lap = (abs(wl + wr - 2.0 * w) + abs(wd + wu - 2.0 * w)) / max(w, 1e-5);
          float salto = max(max(abs(wl - w), abs(wr - w)), max(abs(wd - w), abs(wu - w))) / max(w, 1e-5);
          float borde = smoothstep(0.06, 0.2, lap) + smoothstep(0.12, 0.35, salto);
          float z = 1.0 / w;
          borde = clamp(borde, 0.0, 1.0) * (1.0 - smoothstep(55.0, 140.0, z)) * step(z, uLejos * 0.9);
          gl_FragColor = vec4(borde, 0.0, 0.0, 1.0); }`,
    });
    // …y se mezcla sobre la imagen: color·(1 − k + 0.65·k·tinta) + 0.35·k·tinta (con la mezcla del GPU, sin leer la imagen)
    this.mMezcla = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { tTinta: { value: null }, uTinta: { value: new THREE.Color("#2a1838") }, uFuerza: { value: 0.78 } },
      fragmentShader: `uniform sampler2D tTinta; uniform vec3 uTinta; uniform float uFuerza; varying vec2 vUv;
        void main(){ float k = texture2D(tTinta, vUv).r * uFuerza; float lt = dot(uTinta, vec3(0.3333));
          gl_FragColor = vec4(0.35 * k * uTinta, 1.0 - k + 0.65 * k * lt); }`,
    });
    this.mFinal = new THREE.ShaderMaterial({
      vertexShader: VS, depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: {
        tColor: { value: null }, tBrillo: { value: null }, uHayBrillo: { value: 0 }, uFuerzaBrillo: { value: 0.75 },
        uMatiz: { value: new THREE.Color("#ffffff") }, uSat: { value: 1.12 }, uVineta: { value: 0.32 }, uDestello: { value: 0 },
      },
      fragmentShader: `uniform sampler2D tColor, tBrillo; uniform float uHayBrillo, uFuerzaBrillo, uSat, uVineta, uDestello;
        uniform vec3 uMatiz; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tColor, vUv).rgb;
          // ── resplandor ──
          if (uHayBrillo > 0.5) c += texture2D(tBrillo, vUv).rgb * uFuerzaBrillo;
          c += uDestello;
          // ── color ──
          c *= uMatiz;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          vec3 s = gl_FragColor.rgb; float l = dot(s, vec3(0.299, 0.587, 0.114));
          s = mix(vec3(l), s, uSat);
          vec2 v = vUv - 0.5; s *= 1.0 - uVineta * dot(v, v) * 1.6;
          gl_FragColor = vec4(clamp(s, 0.0, 1.0), 1.0);
        }`,
    });
  }
  ponerNivel(nivel) {
    this.nivel = nivel;
    this.muestras = nivel === "alta" ? 4 : nivel === "media" ? 2 : 0;
    this.bloom = nivel === "baja" ? 0 : nivel === "media" ? 3 : 4;
    if (this.ancho) this.medir(this.ancho, this.alto, this.dpr);
  }
  medir(w, h, dpr) {
    this.ancho = w; this.alto = h; this.dpr = dpr;
    const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
    if (this.principal) { this.principal.depthTexture.dispose(); this.principal.dispose(); this.tinta.dispose(); }
    for (const r of this.rts) r.dispose();
    this.rts = [];
    const prof = new THREE.DepthTexture(W, H); prof.type = THREE.UnsignedIntType;
    this.principal = new THREE.WebGLRenderTarget(W, H, { type: this.tipo, samples: this.muestras, depthTexture: prof, depthBuffer: true });
    this.tinta = new THREE.WebGLRenderTarget(W, H, { type: THREE.UnsignedByteType, depthBuffer: false });
    // la cadena del resplandor: 1/2, 1/4, 1/8, 1/16
    let bw = W, bh = H;
    for (let i = 0; i < this.bloom; i++) { bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); this.rts.push(new THREE.WebGLRenderTarget(bw, bh, { type: this.tipo, depthBuffer: false })); }
    this.mTinta.uniforms.uTexel.value.set(1 / W, 1 / H);
    this.mTinta.uniforms.uLinea.value = Math.max(1, dpr * 0.7);
  }
  paso(mat, destino) { this.quad.material = mat; this.r.setRenderTarget(destino); this.r.render(this.escena, this.camara); }
  dibujar(escena, camara) {
    const r = this.r, capas = camara.layers.mask;
    // las luces alumbran en las dos capas (y así su estado no cambia entre pasadas)
    if ((this.cadaLuces = (this.cadaLuces || 0) - 1) <= 0) { this.cadaLuces = 30; escena.traverse((o) => { if (o.isLight) o.layers.enable(1); }); }
    // 1) lo sólido
    camara.layers.set(0);
    r.setRenderTarget(this.principal);
    r.render(escena, camara);
    // 2) la tinta, sólo sobre lo sólido
    const t = this.mTinta.uniforms;
    t.tProf.value = this.principal.depthTexture; t.uCerca.value = camara.near; t.uLejos.value = camara.far;
    this.paso(this.mTinta, this.tinta);
    r.autoClear = false;
    this.mMezcla.uniforms.tTinta.value = this.tinta.texture;
    this.paso(this.mMezcla, this.principal);
    // 3) los efectos transparentes, encima (con la profundidad de lo sólido; sin volver a calcular sombras)
    const sombras = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false;
    camara.layers.set(1);
    r.setRenderTarget(this.principal);
    r.render(escena, camara);
    r.shadowMap.autoUpdate = sombras; camara.layers.mask = capas; r.autoClear = true;
    const f = this.mFinal.uniforms;
    if (this.rts.length) {
      this.mBrillo.uniforms.tColor.value = this.principal.texture;
      this.mBrillo.uniforms.uUmbral.value = this.hdr ? 1.0 : 0.82;
      this.paso(this.mBrillo, this.rts[0]);
      for (let i = 1; i < this.rts.length; i++) {
        const de = this.rts[i - 1];
        this.mBajar.uniforms.tColor.value = de.texture; this.mBajar.uniforms.uTexel.value.set(0.5 / de.width, 0.5 / de.height);
        this.paso(this.mBajar, this.rts[i]);
      }
      r.autoClear = false;
      for (let i = this.rts.length - 1; i > 0; i--) {
        const de = this.rts[i];
        this.mSubir.uniforms.tColor.value = de.texture; this.mSubir.uniforms.uTexel.value.set(0.5 / de.width, 0.5 / de.height); this.mSubir.uniforms.uPeso.value = 0.9;
        this.paso(this.mSubir, this.rts[i - 1]);
      }
      r.autoClear = true;
      f.tBrillo.value = this.rts[0].texture; f.uHayBrillo.value = 1;
    } else f.uHayBrillo.value = 0;
    f.tColor.value = this.principal.texture;
    this.paso(this.mFinal, null);
  }
}
void J;
