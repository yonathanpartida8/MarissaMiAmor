/*
 * LIBRITO · escenas 3D (WebGL2)
 *
 * El elemento «Escena 3D» dibuja con WebGL2 una figura (corazón, esfera,
 * toro, estrella…) o un modelo tuyo (.glb, .gltf o .obj, con sus colores,
 * texturas y animaciones), con su material, su luz y una cámara que se gira
 * con el dedo y se acerca con dos.
 *
 * Usa three.js (el que ya vive en vendor/three) y SÓLO se descarga cuando
 * una página tiene una escena 3D. Cada escena:
 *   · no dibuja nada si no se ve (fuera de pantalla o en otra pestaña),
 *   · dibuja una sola vez si está quieta (sin girar ni animarse),
 *   · suelta su memoria de la tarjeta gráfica al quitarla de la página.
 *
 * Si el aparato no tiene WebGL2, lo dice en vez de quedarse en blanco.
 */
(function (RT) {
  "use strict";
  const h = RT.h;

  // Dónde está three.js: junto al editor (EditorDev/runtime → ../../vendor)
  // o junto al librito exportado (scripts/librito.js → ../vendor).
  const yo = document.currentScript && document.currentScript.src;
  if (!RT.rutaThree) {
    try { RT.rutaThree = new URL(/\/runtime\/rt-3d\.js(\?|$)/.test(yo || "") ? "../../vendor/three/three.module.min.js" : "../vendor/three/three.module.min.js", yo || location.href).href; }
    catch (e) { RT.rutaThree = "vendor/three/three.module.min.js"; }
  }
  let promesa = null;
  RT.cargarThree = function () { return promesa || (promesa = import(RT.rutaThree)); };
  RT.hayWebGL2 = function () { return typeof WebGL2RenderingContext !== "undefined"; };

  RT.FIGURAS3D = {
    corazon: "Corazón", esfera: "Esfera", cubo: "Cubo", toro: "Dona", nudo: "Nudo", estrella: "Estrella",
    diamante: "Diamante", anillo: "Anillo", cono: "Cono", cilindro: "Cilindro", capsula: "Cápsula",
  };

  /* ── Figuras ────────────────────────────────────────────────────── */
  function figura(T, nombre) {
    const ext = { depth: 0.42, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5, curveSegments: 28 };
    switch (nombre) {
      case "esfera": return new T.SphereGeometry(1, 64, 40);
      case "cubo": return new T.BoxGeometry(1.4, 1.4, 1.4, 2, 2, 2);
      case "toro": return new T.TorusGeometry(0.8, 0.32, 40, 120);
      case "nudo": return new T.TorusKnotGeometry(0.62, 0.2, 200, 28);
      case "diamante": return new T.OctahedronGeometry(1, 0);
      case "anillo": return new T.TorusGeometry(0.9, 0.11, 24, 120);
      case "cono": return new T.ConeGeometry(0.8, 1.6, 64);
      case "cilindro": return new T.CylinderGeometry(0.75, 0.75, 1.5, 64);
      case "capsula": return T.CapsuleGeometry ? new T.CapsuleGeometry(0.55, 0.9, 12, 32) : new T.SphereGeometry(1, 48, 32);
      case "estrella": {
        const s = new T.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.45 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        s.closePath();
        return new T.ExtrudeGeometry(s, { ...ext, depth: 0.3 });
      }
      default: {
        // Corazón: la curva clásica, de punta hacia abajo.
        const s = new T.Shape();
        s.moveTo(0.5, 0.5);
        s.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0);
        s.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7);
        s.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9);
        s.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7);
        s.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0);
        s.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5);
        const g = new T.ExtrudeGeometry(s, ext);
        g.rotateZ(Math.PI);
        return g;
      }
    }
  }

  /** Centrado y del mismo tamaño siempre (cabe en una esfera de radio 1). */
  function normalizar(T, obj) {
    const caja = new T.Box3().setFromObject(obj);
    if (caja.isEmpty()) return obj;
    const c = caja.getCenter(new T.Vector3());
    const r = caja.getBoundingSphere(new T.Sphere()).radius || 1;
    const g = new T.Group();
    obj.position.sub(c);
    g.add(obj);
    g.scale.setScalar(1 / r);
    return g;
  }

  /* ── glTF / GLB (lector propio, pequeño) ───────────────────────── */
  const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  function leer(dv, o, ct) {
    switch (ct) {
      case 5120: return dv.getInt8(o);
      case 5121: return dv.getUint8(o);
      case 5122: return dv.getInt16(o, true);
      case 5123: return dv.getUint16(o, true);
      case 5125: return dv.getUint32(o, true);
      default: return dv.getFloat32(o, true);
    }
  }

  async function cargarGLTF(T, buf, base) {
    let json = null, bin = null;
    const dv = new DataView(buf);
    if (buf.byteLength > 12 && dv.getUint32(0, true) === 0x46546c67) {
      let o = 12;
      while (o + 8 <= buf.byteLength) {
        const largo = dv.getUint32(o, true), tipo = dv.getUint32(o + 4, true);
        const datos = buf.slice(o + 8, o + 8 + largo);
        if (tipo === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(datos));
        else if (tipo === 0x004e4942) bin = datos;
        o += 8 + largo;
      }
    } else json = JSON.parse(new TextDecoder().decode(buf));
    if (!json) throw new Error("No es un glTF");
    const buffers = await Promise.all((json.buffers || []).map(async (b) => {
      if (!b.uri) return bin;
      return (await fetch(/^data:/.test(b.uri) ? b.uri : new URL(b.uri, base).href)).arrayBuffer();
    }));
    const accesor = (i) => {
      const a = json.accessors[i];
      const C = COMP[a.componentType], n = NUM[a.type];
      let arr;
      if (a.bufferView == null) arr = new C(a.count * n);
      else {
        const v = json.bufferViews[a.bufferView];
        const b = buffers[v.buffer];
        const o = (v.byteOffset || 0) + (a.byteOffset || 0);
        const tam = C.BYTES_PER_ELEMENT;
        if (v.byteStride && v.byteStride !== n * tam) {
          arr = new C(a.count * n);
          const d = new DataView(b);
          for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) arr[k * n + j] = leer(d, o + k * v.byteStride + j * tam, a.componentType);
        } else arr = new C(b.slice(o, o + a.count * n * tam));
      }
      return { arr, n, norm: !!a.normalized };
    };
    const texturas = new Map();
    const textura = async (i, srgb) => {
      const k = i + ":" + srgb;
      if (texturas.has(k)) return texturas.get(k);
      const tx = json.textures[i];
      const im = json.images[tx.source];
      let blob;
      if (im.bufferView != null) {
        const v = json.bufferViews[im.bufferView];
        blob = new Blob([buffers[v.buffer].slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)], { type: im.mimeType || "image/png" });
      } else blob = await (await fetch(/^data:/.test(im.uri) ? im.uri : new URL(im.uri, base).href)).blob();
      const bm = await createImageBitmap(blob, { imageOrientation: "none" });
      const t = new T.Texture(bm);
      t.flipY = false;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      const s = json.samplers?.[tx.sampler];
      if (s) { t.wrapS = s.wrapS === 33071 ? T.ClampToEdgeWrapping : s.wrapS === 33648 ? T.MirroredRepeatWrapping : T.RepeatWrapping; t.wrapT = s.wrapT === 33071 ? T.ClampToEdgeWrapping : s.wrapT === 33648 ? T.MirroredRepeatWrapping : T.RepeatWrapping; }
      t.needsUpdate = true;
      texturas.set(k, t);
      return t;
    };
    const materiales = new Map();
    const material = async (i) => {
      if (materiales.has(i)) return materiales.get(i);
      const m = json.materials[i] || {};
      const p = m.pbrMetallicRoughness || {};
      const c = p.baseColorFactor || [1, 1, 1, 1];
      const mat = new T.MeshStandardMaterial({
        metalness: p.metallicFactor ?? 1, roughness: p.roughnessFactor ?? 1,
        side: m.doubleSided ? T.DoubleSide : T.FrontSide,
        transparent: m.alphaMode === "BLEND", opacity: c[3] ?? 1, alphaTest: m.alphaMode === "MASK" ? m.alphaCutoff ?? 0.5 : 0,
      });
      mat.color.setRGB(c[0], c[1], c[2], T.LinearSRGBColorSpace);
      if (p.baseColorTexture) mat.map = await textura(p.baseColorTexture.index, true);
      if (p.metallicRoughnessTexture) mat.metalnessMap = mat.roughnessMap = await textura(p.metallicRoughnessTexture.index, false);
      if (m.normalTexture) mat.normalMap = await textura(m.normalTexture.index, false);
      if (m.emissiveTexture) mat.emissiveMap = await textura(m.emissiveTexture.index, true);
      if (m.emissiveFactor) mat.emissive.setRGB(m.emissiveFactor[0], m.emissiveFactor[1], m.emissiveFactor[2], T.LinearSRGBColorSpace);
      materiales.set(i, mat);
      return mat;
    };
    const malla = async (mi) => {
      const g = new T.Group();
      for (const p of json.meshes[mi].primitives) {
        const geo = new T.BufferGeometry();
        for (const [nom, ai] of Object.entries(p.attributes)) {
          const k = { POSITION: "position", NORMAL: "normal", TEXCOORD_0: "uv", COLOR_0: "color" }[nom];
          if (!k) continue;
          const a = accesor(ai);
          geo.setAttribute(k, new T.BufferAttribute(a.arr, a.n, a.norm));
        }
        if (p.indices != null) geo.setIndex(new T.BufferAttribute(accesor(p.indices).arr, 1));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        let mat = p.material != null ? await material(p.material) : new T.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
        if (geo.attributes.color) { mat = mat.clone(); mat.vertexColors = true; }
        const modo = p.mode ?? 4;
        g.add(modo === 4 || modo == null ? new T.Mesh(geo, mat) : modo === 0 ? new T.Points(geo, new T.PointsMaterial({ color: mat.color, size: 0.02 })) : new T.LineSegments(geo, new T.LineBasicMaterial({ color: mat.color })));
      }
      return g;
    };
    const nodos = [];
    const nodo = async (i) => {
      const nd = json.nodes[i];
      const o = nd.mesh != null ? await malla(nd.mesh) : new T.Object3D();
      o.name = nd.name || "";
      if (nd.matrix) { const m = new T.Matrix4().fromArray(nd.matrix); m.decompose(o.position, o.quaternion, o.scale); }
      else {
        if (nd.translation) o.position.fromArray(nd.translation);
        if (nd.rotation) o.quaternion.fromArray(nd.rotation);
        if (nd.scale) o.scale.fromArray(nd.scale);
      }
      nodos[i] = o;
      for (const c of nd.children || []) o.add(await nodo(c));
      return o;
    };
    const esc = json.scenes?.[json.scene || 0];
    const hijos = new Set((json.nodes || []).flatMap((n) => n.children || []));
    const raices = esc ? esc.nodes : (json.nodes || []).map((_, i) => i).filter((i) => !hijos.has(i));
    const raiz = new T.Group();
    for (const i of raices) raiz.add(await nodo(i));
    const clips = (json.animations || []).map((an, k) => {
      const pistas = [];
      for (const ch of an.channels) {
        const s = an.samplers[ch.sampler];
        const o = nodos[ch.target.node];
        if (!o || !/translation|rotation|scale/.test(ch.target.path)) continue;
        const t = accesor(s.input).arr;
        let v = accesor(s.output).arr;
        const n = ch.target.path === "rotation" ? 4 : 3;
        if (s.interpolation === "CUBICSPLINE") { const w = new Float32Array(t.length * n); for (let j = 0; j < t.length; j++) for (let q = 0; q < n; q++) w[j * n + q] = v[j * 3 * n + n + q]; v = w; }
        else if (!(v instanceof Float32Array)) v = Float32Array.from(v);
        const interp = s.interpolation === "STEP" ? T.InterpolateDiscrete : T.InterpolateLinear;
        const Pista = ch.target.path === "rotation" ? T.QuaternionKeyframeTrack : T.VectorKeyframeTrack;
        pistas.push(new Pista(o.uuid + "." + { translation: "position", rotation: "quaternion", scale: "scale" }[ch.target.path], Float32Array.from(t), v, interp));
      }
      return new T.AnimationClip(an.name || "animación " + (k + 1), -1, pistas);
    });
    return { raiz, clips };
  }

  /* ── OBJ ────────────────────────────────────────────────────────── */
  function cargarOBJ(T, texto, mat) {
    const v = [], vn = [], vt = [], pos = [], nor = [], uv = [];
    for (const linea of texto.split(/\r?\n/)) {
      const p = linea.trim().split(/\s+/);
      if (p[0] === "v") v.push(+p[1], +p[2], +p[3]);
      else if (p[0] === "vn") vn.push(+p[1], +p[2], +p[3]);
      else if (p[0] === "vt") vt.push(+p[1], +p[2]);
      else if (p[0] === "f") {
        const c = p.slice(1).map((x) => x.split("/").map((q) => (q ? parseInt(q, 10) : 0)));
        const idx = (q, lista, n) => (q < 0 ? lista.length / n + q : q - 1);
        for (let i = 1; i < c.length - 1; i++) for (const k of [c[0], c[i], c[i + 1]]) {
          const a = idx(k[0], v, 3); pos.push(v[a * 3], v[a * 3 + 1], v[a * 3 + 2]);
          if (k[1]) { const b = idx(k[1], vt, 2); uv.push(vt[b * 2], vt[b * 2 + 1]); }
          if (k[2]) { const d = idx(k[2], vn, 3); nor.push(vn[d * 3], vn[d * 3 + 1], vn[d * 3 + 2]); }
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    if (nor.length === pos.length) geo.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); else geo.computeVertexNormals();
    if (uv.length / 2 === pos.length / 3) geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    return new T.Mesh(geo, mat);
  }

  /* ── La escena de un elemento ───────────────────────────────────── */
  class Escena {
    constructor(lienzo, e, ctx) {
      this.lienzo = lienzo;
      this.ctx = ctx;
      this.e = e;
      this.vivo = true;
      this.visible = true;
      this.usr = { x: 0, y: 0, z: 1 };
      this._carga = 0;
      if (!RT.hayWebGL2()) { this._aviso("Este aparato no tiene WebGL2: la escena 3D no se puede mostrar."); return; }
      RT.cargarThree().then((T) => { if (this.vivo) this._montar(T); }).catch((err) => { console.warn(err); this._aviso("No se pudo cargar el motor 3D."); });
    }

    _aviso(t) {
      const c = this.lienzo.parentNode;
      if (!c) return;
      const a = h("div", "rt-marcador rt-3d-aviso", c);
      a.textContent = t;
    }

    _montar(T) {
      this.T = T;
      const r = new T.WebGLRenderer({ canvas: this.lienzo, antialias: true, alpha: true, powerPreference: "low-power" });
      r.outputColorSpace = T.SRGBColorSpace;
      r.toneMapping = T.ACESFilmicToneMapping;
      this.r = r;
      this.escena = new T.Scene();
      this.cam = new T.PerspectiveCamera(32, 1, 0.05, 50);
      this.cam.position.set(0, 0, 4.2);
      this.cielo = new T.HemisphereLight(0xffffff, 0x8a7a9a, 0.8);
      this.sol = new T.DirectionalLight(0xffffff, 1.4);
      this.sol.position.set(2.5, 3.5, 4);
      this.contra = new T.DirectionalLight(0xffd6e8, 0.45);
      this.contra.position.set(-3, -1, -2);
      this.escena.add(this.cielo, this.sol, this.contra);
      this.pivote = new T.Group();
      this.escena.add(this.pivote);
      this.reloj = new T.Clock();
      this.ro = new ResizeObserver(() => this._medir());
      this.ro.observe(this.lienzo);
      this.io = new IntersectionObserver((xs) => { this.visible = xs.some((x) => x.isIntersecting); this._pedir(); });
      this.io.observe(this.lienzo);
      this._vis = () => this._pedir();
      document.addEventListener("visibilitychange", this._vis);
      this._dedos();
      this._medir();
      this._cargar();
      this.actualizar(this.e);
    }

    async _cargar() {
      const T = this.T;
      const d = this.e.escena3d || {};
      const n = ++this._carga;
      this._clave = clave(this.e);
      this._quitarModelo();
      let obj = null, clips = [];
      try {
        if (d.fuente === "archivo" && d.asset) {
          const url = this.ctx.url ? this.ctx.url(d.asset) : null;
          if (!url) throw new Error("Falta el modelo");
          const res = await fetch(url);
          const formato = (d.formato || "").toLowerCase();
          if (formato === "obj") obj = cargarOBJ(T, await res.text(), this._material());
          else { const g = await cargarGLTF(T, await res.arrayBuffer(), new URL(url, location.href).href); obj = g.raiz; clips = g.clips; }
          this.propios = formato !== "obj";
        } else {
          obj = new T.Mesh(figura(T, d.figura || "corazon"), this._material());
          this.propios = false;
        }
      } catch (err) {
        console.warn(err);
        obj = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0x999999, wireframe: true }));
      }
      if (!this.vivo || n !== this._carga) { tirar(obj); return; }
      this.modelo = normalizar(T, obj);
      this.pivote.add(this.modelo);
      if (clips.length) { this.mixer = new T.AnimationMixer(this.modelo); this.acciones = clips.map((c) => this.mixer.clipAction(c)); }
      this.actualizar(this.e);
    }

    _material() {
      const d = this.e.escena3d || {};
      return new this.T.MeshStandardMaterial({ color: d.color || "#d8397a", metalness: d.metal ?? 0.15, roughness: d.rugosidad ?? 0.4, wireframe: !!d.alambre, flatShading: !!d.plano });
    }

    _quitarModelo() {
      if (this.mixer) { this.mixer.stopAllAction(); this.mixer = null; this.acciones = null; }
      if (this.modelo) { this.pivote.remove(this.modelo); tirar(this.modelo); this.modelo = null; }
    }

    /** Cambió algo (color, luz, giro…): se aplica sin rehacer la escena. */
    actualizar(e) {
      this.e = e;
      if (!this.T) return;
      const T = this.T;
      const d = e.escena3d || {};
      // El elemento cambia «en su sitio»: se compara con lo que se cargó, no con el objeto.
      if (this._clave != null && clave(e) !== this._clave) return this._cargar();
      this.sol.intensity = d.luz ?? 1.4;
      this.sol.color.set(d.luzColor || "#ffffff");
      this.cielo.intensity = d.ambiente ?? 0.7;
      this.escena.background = d.fondo ? new T.Color(d.fondo) : null;
      if (this.modelo) {
        const usarPropios = this.propios && d.colores !== "uno";
        this.modelo.traverse((o) => {
          if (!o.isMesh) return;
          if (!usarPropios) {
            if (!o.material._nuestro) { o.material = this._material(); o.material._nuestro = true; }
            o.material.color.set(d.color || "#d8397a");
            o.material.metalness = d.metal ?? 0.15;
            o.material.roughness = d.rugosidad ?? 0.4;
          }
          o.material.wireframe = !!d.alambre;
          if (o.material.flatShading !== !!d.plano) { o.material.flatShading = !!d.plano; o.material.needsUpdate = true; }
        });
      }
      if (this.acciones) for (const a of this.acciones) { if (d.animar !== false) a.play(); else a.stop(); }
      this._pedir();
    }

    _medir() {
      if (!this.r) return;
      const w = this.lienzo.clientWidth, hh = this.lienzo.clientHeight;
      if (!w || !hh) return;
      const k = this.ctx.escala ? this.ctx.escala() : 1;
      this.r.setPixelRatio(Math.min(2.5, Math.max(1, (devicePixelRatio || 1) * Math.min(2, k))));
      this.r.setSize(w, hh, false);
      this.cam.aspect = w / hh;
      this.cam.updateProjectionMatrix();
      this._pedir();
    }

    /** Arrastrar = girarla; dos dedos o rueda = acercar (en el librito, o al «Probar aquí»). */
    _dedos() {
      const c = this.lienzo;
      const p = new Map();
      let base = null;
      c.addEventListener("pointerdown", (ev) => {
        if ((this.e.escena3d || {}).orbitar === false) return;
        p.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        try { c.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
        base = null;
        this.tocando = true;
        this._pedir();
      });
      c.addEventListener("pointermove", (ev) => {
        const q = p.get(ev.pointerId);
        if (!q) return;
        if (p.size === 1) {
          this.usr.y += (ev.clientX - q.x) * 0.012;
          this.usr.x = Math.max(-1.4, Math.min(1.4, this.usr.x + (ev.clientY - q.y) * 0.012));
        }
        q.x = ev.clientX; q.y = ev.clientY;
        if (p.size === 2) {
          const [a, b] = [...p.values()];
          const dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (base) this.usr.z = Math.max(0.4, Math.min(3, this.usr.z * (dd / base)));
          base = dd;
        }
        this._pedir();
      });
      const fin = (ev) => { p.delete(ev.pointerId); base = null; if (!p.size) this.tocando = false; };
      c.addEventListener("pointerup", fin);
      c.addEventListener("pointercancel", fin);
      c.addEventListener("wheel", (ev) => { if ((this.e.escena3d || {}).orbitar === false) return; ev.preventDefault(); this.usr.z = Math.max(0.4, Math.min(3, this.usr.z * Math.exp(-ev.deltaY * 0.0015))); this._pedir(); }, { passive: false });
    }

    _pedir() {
      if (!this.vivo || !this.r || this._raf) return;
      this._raf = requestAnimationFrame((t) => this._cuadro(t));
    }

    _cuadro(t) {
      this._raf = 0;
      if (!this.vivo || !this.r) return;
      const d = this.e.escena3d || {};
      const dt = Math.min(0.1, this.reloj.getDelta());
      const mueve = (d.girar || 0) !== 0 || (this.mixer && d.animar !== false) || this.tocando;
      if (!this.visible || document.hidden) return;
      // En el editor, a 30 cuadros: sobra para ver cómo queda.
      if (this.ctx.modo !== "vista" && mueve && t - (this._ult || 0) < 30) { this._raf = requestAnimationFrame((x) => this._cuadro(x)); return; }
      this._ult = t;
      this.giro = (this.giro || 0) + (d.girar || 0) * dt;
      if (this.mixer && d.animar !== false) this.mixer.update(dt);
      this.pivote.rotation.set((d.rotX ?? -0.25) + this.usr.x, (d.rotY ?? 0.5) + this.usr.y + this.giro, 0);
      this.cam.position.z = 4.2 / Math.max(0.2, (d.zoom ?? 1) * this.usr.z);
      this.r.render(this.escena, this.cam);
      if (mueve) this._raf = requestAnimationFrame((x) => this._cuadro(x));
    }

    /** Se quita de la página: suelta todo lo de la tarjeta gráfica. Si en el
        mismo instante se vuelve a pedir (sólo cambió un ajuste), se reusa. */
    destruir() {
      this._muere = true;
      queueMicrotask(() => { if (this._muere) this._destruirYa(); });
    }

    _destruirYa() {
      this.vivo = false;
      cancelAnimationFrame(this._raf);
      this.ro?.disconnect();
      this.io?.disconnect();
      document.removeEventListener("visibilitychange", this._vis);
      this._quitarModelo();
      if (this.r) { this.r.dispose(); try { this.r.forceContextLoss(); } catch (e) { /* nada */ } this.r = null; }
    }
  }

  function clave(e) { const d = e.escena3d || {}; return [d.fuente, d.figura, d.asset, d.colores, d.formato].join("|"); }

  function tirar(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material || [])) {
        for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) m[k]?.dispose?.();
        m.dispose?.();
      }
    });
  }

  RT.componentes = RT.componentes || {};
  RT.componentes.escena3d = function (c, e, ctx, n) {
    if (ctx.modo === "mini") { c.innerHTML = '<div class="rt-marcador">3D</div>'; return null; }
    const ya = n && n._rt && n._rt.escena3d;
    if (ya && ya.vivo && ya.lienzo.parentNode === c) { ya._muere = false; ya.actualizar(e); return ya; }
    c.textContent = "";
    const lienzo = h("canvas", "rt-3d", c);
    const esc = new Escena(lienzo, e, ctx);
    if (n && n._rt) n._rt.escena3d = esc;
    return esc;
  };
})(window.LibritoRT = window.LibritoRT || {});
