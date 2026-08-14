/**
 * SHADER DE POLVO / LUCIÉRNAGAS.
 *
 * Las partículas que flotan delante de la niebla. Todo el movimiento ocurre en
 * el vertex shader a partir de un par de atributos y del tiempo: la CPU no
 * toca ni una posición por frame, que es la única forma de tener mil quinientas
 * partículas en un móvil sin que se note.
 */

export const dustVertex = /* glsl */ `
  precision highp float;

  attribute vec3 aSeed;    // x: fase, y: velocidad, z: tamaño
  attribute float aTint;   // 0..1 mezcla entre los dos acentos

  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uSize;
  uniform float uSpread;
  uniform float uPulse;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 pos = position;

    float phase = aSeed.x * 6.2831;
    float speed = 0.12 + aSeed.y * 0.35;

    // Ascenso lento con deriva sinusoidal: nada se mueve en línea recta.
    pos.y += mod(uTime * speed + aSeed.x * uSpread, uSpread) - uSpread * 0.5;
    pos.x += sin(uTime * speed * 0.7 + phase) * 0.42;
    pos.z += cos(uTime * speed * 0.5 + phase * 1.7) * 0.32;

    // Repulsión suave alrededor del dedo: el polvo se aparta al tocarlo.
    vec2 toPointer = pos.xy - uPointer * uSpread * 0.5;
    float d = length(toPointer);
    float push = smoothstep(2.6, 0.0, d) * (0.55 + uPulse);
    pos.xy += normalize(toPointer + 0.0001) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Atenuación por perspectiva + parpadeo lento e irregular.
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.y * 2.0) + phase);
    float size = uSize * aSeed.z * (1.0 + uPulse * 0.6);
    gl_PointSize = size * uPixelRatio * (14.0 / max(-mv.z, 0.35));

    // Se desvanecen al acercarse demasiado a la cámara y en los bordes del volumen.
    float depthFade = smoothstep(0.0, 3.0, -mv.z) * smoothstep(26.0, 12.0, -mv.z);
    vAlpha = twinkle * depthFade;
    vTint = aTint;

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

  void main() {
    // Disco suave dibujado en el propio fragment: sin textura que cargar.
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;

    float core = 1.0 - smoothstep(0.0, 0.25, d);
    float halo = exp(-d * 9.0);
    float alpha = (core * 0.65 + halo * 0.5) * vAlpha * uOpacity;

    vec3 color = mix(uColorA, uColorB, vTint);
    // El centro tira a blanco: le da temperatura de luz real.
    color = mix(color, vec3(1.0), core * 0.45);

    gl_FragColor = vec4(color, alpha);
  }
`;
