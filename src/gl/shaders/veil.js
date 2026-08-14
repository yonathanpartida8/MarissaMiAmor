/**
 * SHADER DEL VELO.
 *
 * La ilustración está detrás de un velo: desenfocada, deshecha en ondas y sin
 * color. Donde el dedo ha pasado, el velo se retira. El borde entre lo velado
 * y lo revelado no es un corte: está distorsionado y brilla, como cuando se
 * limpia el agua de un cristal.
 *
 * La máscara del dedo llega como textura desde un canvas 2D, que es mucho más
 * barato de actualizar que reescribir un buffer de GPU en cada movimiento.
 */

export const veilVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const veilFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;      // la ilustración
  uniform sampler2D uMask;     // por dónde ha pasado el dedo
  uniform vec2  uCover;
  uniform float uTime;
  uniform float uReveal;       // aparición general de la página
  uniform vec3  uAccent;
  uniform vec2  uPointer;
  uniform float uQuality;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.7, 289.3))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uCover + 0.5;

    // Cuánto está revelado este píxel.
    float mask = texture2D(uMask, vUv).a;
    float veil = 1.0 - smoothstep(0.05, 0.75, mask);

    // Ondulación del velo: se mueve despacio, y más fuerte donde sigue velado.
    float n = noise(uv * 7.0 + uTime * 0.16);
    float n2 = noise(uv * 15.0 - uTime * 0.11);
    vec2 warp = vec2(n - 0.5, n2 - 0.5) * veil * 0.06;

    // Desenfoque barato: unas pocas muestras alrededor, sólo si hay velo.
    vec3 color = vec3(0.0);
    float blur = veil * 0.014 * mix(0.4, 1.0, uQuality);
    color += texture2D(uMap, uv + warp).rgb * 0.4;
    color += texture2D(uMap, uv + warp + vec2(blur, 0.0)).rgb * 0.15;
    color += texture2D(uMap, uv + warp - vec2(blur, 0.0)).rgb * 0.15;
    color += texture2D(uMap, uv + warp + vec2(0.0, blur)).rgb * 0.15;
    color += texture2D(uMap, uv + warp - vec2(0.0, blur)).rgb * 0.15;

    // Bajo el velo pierde color y se enfría; al revelarse recupera vida.
    vec3 grey = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
    color = mix(color, mix(grey, grey * vec3(0.72, 0.8, 1.05), 0.8), veil * 0.85);
    color *= mix(1.0, 0.58, veil);

    // El filo del descubrimiento brilla.
    float edge = smoothstep(0.16, 0.5, mask) * (1.0 - smoothstep(0.5, 0.9, mask));
    color += uAccent * edge * 0.75;

    // Y el dedo deja un resplandor que le sigue.
    float touch = exp(-length(vUv - (uPointer * 0.5 + 0.5)) * 9.0);
    color += uAccent * touch * 0.16;

    vec2 fade = smoothstep(0.0, 0.1, vUv) * smoothstep(0.0, 0.1, 1.0 - vUv);
    gl_FragColor = vec4(color, fade.x * fade.y * uReveal);
  }
`;
