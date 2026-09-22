/**
 * SHADER DE LO QUE FLOTA.
 *
 * Delante de la niebla flota una nube de cosas pequeñas: motas de luz,
 * destellos de cuatro puntas, estrellitas y algún corazón. Cada una sube a su
 * ritmo, se mece, parpadea y se aparta si le pasas el dedo por encima.
 *
 * Todo el movimiento ocurre en el vertex shader a partir de tres atributos y
 * del tiempo: la CPU no toca ni una posición por frame, que es la única forma
 * de tener mil quinientas de estas en un móvil sin que se note.
 *
 * La forma la decide `aTipo`, y se dibuja en el fragment con matemáticas: ni
 * una textura que descargar, ni un atlas que se vea pixelado al acercarse.
 * Todos los fragmentos de una misma partícula toman la misma rama, que es el
 * caso que las GPUs resuelven sin penalización.
 */

export const dustVertex = /* glsl */ `
  precision highp float;

  attribute vec3  aSeed;    // x: fase, y: velocidad, z: tamaño
  attribute float aTint;    // 0..1 mezcla entre los dos acentos
  attribute float aTipo;    // 0 mota · 1 destello · 2 estrella · 3 corazón

  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uSize;
  uniform float uSpread;
  uniform float uPulse;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vTint;
  varying float vTipo;
  varying float vGiro;

  void main() {
    vec3 pos = position;

    float fase = aSeed.x * 6.2831;
    float velocidad = 0.12 + aSeed.y * 0.35;

    // Ascenso lento con deriva: nada se mueve en línea recta.
    pos.y += mod(uTime * velocidad + aSeed.x * uSpread, uSpread) - uSpread * 0.5;
    pos.x += sin(uTime * velocidad * 0.7 + fase) * 0.42;
    pos.z += cos(uTime * velocidad * 0.5 + fase * 1.7) * 0.32;

    // Repulsión suave alrededor del dedo: lo que flota se aparta al tocarlo.
    vec2 alDedo = pos.xy - uPointer * uSpread * 0.5;
    float d = length(alDedo);
    float empuje = smoothstep(2.6, 0.0, d) * (0.55 + uPulse);
    pos.xy += normalize(alDedo + 0.0001) * empuje;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Parpadeo lento e irregular.
    float titileo = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.y * 2.0) + fase);

    // Las formas con silueta piden bastante más sitio que una mota redonda:
    // un corazón de cuatro píxeles no es un corazón, es una pelusa. Y como
    // son las raras de la nube, agrandarlas no llena la pantalla de nada:
    // simplemente, cuando aparece una, se ve.
    float porForma = 1.0;
    if (aTipo > 2.5)      porForma = 3.4;   // corazón
    else if (aTipo > 1.5) porForma = 2.9;   // estrellita
    else if (aTipo > 0.5) porForma = 2.2;   // destello
    float tam = uSize * aSeed.z * porForma * (1.0 + uPulse * 0.6);
    gl_PointSize = tam * uPixelRatio * (14.0 / max(-mv.z, 0.35));

    // Se desvanecen al acercarse demasiado a la cámara y en los bordes.
    float profundidad = smoothstep(0.0, 3.0, -mv.z) * smoothstep(26.0, 12.0, -mv.z);
    vAlpha = titileo * profundidad;
    vTint = aTint;
    vTipo = aTipo;
    // Cada una cae con su propia inclinación, y muy despacio va cambiando.
    vGiro = fase + uTime * (0.05 + aSeed.y * 0.12);

    gl_Position = projectionMatrix * mv;
  }
`;

export const dustFragment = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vTint;
  varying float vTipo;
  varying float vGiro;

  /** Mota de luz: un punto con su halo. Lo más discreto de la nube. */
  float mota(vec2 q) {
    float d = dot(q, q);
    return (1.0 - smoothstep(0.0, 0.25, d)) * 0.75 + exp(-d * 9.0) * 0.55;
  }

  /** Destello: dos husos cruzados, como el brillo de una lente. */
  float destello(vec2 q) {
    float h = max(0.0, 1.0 - length(q * vec2(11.0, 1.9)));
    float v = max(0.0, 1.0 - length(q * vec2(1.9, 11.0)));
    return h * h + v * v + exp(-dot(q, q) * 42.0) * 0.9;
  }

  /**
   * Estrellita de cinco puntas.
   *
   * Con coordenadas polares: el radio permitido ondula cinco veces por
   * vuelta, así que el borde entra y sale y dibuja las puntas. Sale suave
   * porque es un «smoothstep» sobre una función continua, no un recorte.
   */
  float estrella(vec2 q) {
    float a = atan(q.y, q.x);
    float r = length(q);
    float punta = 0.30 + 0.17 * cos(a * 5.0);
    return 1.0 - smoothstep(punta * 0.55, punta, r);
  }

  /**
   * Corazón.
   *
   * La curva de toda la vida: (x² + y² − 1)³ − x²·y³ = 0. Dentro da negativo,
   * fuera positivo, y el «smoothstep» sobre ese valor le pone el borde blando.
   */
  float corazon(vec2 q) {
    vec2 c = q * 3.1;
    c.y = -c.y - 0.32;
    float k = c.x * c.x + c.y * c.y - 1.0;
    float f = k * k * k - c.x * c.x * c.y * c.y * c.y;
    return 1.0 - smoothstep(-0.30, 0.14, f);
  }

  void main() {
    vec2 q = gl_PointCoord - 0.5;

    // Cada partícula cae con su inclinación: una nube de estrellas todas
    // derechas se lee como un patrón, y esto tiene que leerse como azar.
    float c = cos(vGiro);
    float s = sin(vGiro);
    vec2 qr = vec2(q.x * c - q.y * s, q.x * s + q.y * c);

    float forma;
    if (vTipo < 0.5)      forma = mota(q);
    else if (vTipo < 1.5) forma = destello(qr);
    else if (vTipo < 2.5) forma = estrella(qr);
    else                  forma = corazon(qr);

    float alpha = clamp(forma, 0.0, 1.0) * vAlpha * uOpacity;
    // Nada de «discard»: en los móviles obliga a la GPU a renunciar a saltarse
    // fragmentos y cuesta más que dejar el alfa a cero, que no pinta nada.
    if (alpha <= 0.0015) { gl_FragColor = vec4(0.0); return; }

    vec3 color = mix(uColorA, uColorB, vTint);
    // El centro tira a blanco: le da temperatura de luz real.
    color = mix(color, vec3(1.0), clamp(forma, 0.0, 1.0) * 0.42);

    gl_FragColor = vec4(color, alpha);
  }
`;
