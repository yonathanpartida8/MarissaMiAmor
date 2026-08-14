/**
 * SHADER DE PROFUNDIDAD.
 *
 * Convierte una ilustración plana en algo con volumen. No hay mapa de
 * profundidad: se deduce de la propia imagen (lo claro se acerca, lo oscuro
 * se aleja) y se recorre el rayo en varios pasos, como en el parallax
 * occlusion mapping clásico, para que el desplazamiento no "resbale".
 *
 * El resultado: al inclinar el teléfono, el fondo se mueve menos que la
 * figura, y la imagen deja de ser un papel para ser una ventana.
 */

export const depthVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const depthFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2  uParallax;   // desplazamiento en UV
  uniform float uStrength;
  uniform float uTime;
  uniform float uReveal;     // 0..1 aparición
  uniform vec3  uTint;
  uniform float uSteps;      // 1 en gama baja, 8 en gama alta
  uniform vec2  uCover;      // corrección de encuadre (object-fit: cover)

  varying vec2 vUv;

  float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  void main() {
    // Encuadre tipo "cover": la ilustración nunca se deforma.
    vec2 uv = (vUv - 0.5) * uCover + 0.5;

    vec2 dir = uParallax * uStrength;
    vec2 coord = uv;

    // Marcha por el rayo: cada paso se hunde un poco más donde está oscuro.
    float steps = max(uSteps, 1.0);
    for (int i = 0; i < 8; i++) {
      if (float(i) >= steps) break;
      float d = 1.0 - luma(texture2D(uMap, coord).rgb);
      coord = uv + dir * d;
    }

    // Aberración cromática mínima, proporcional al desplazamiento: al
    // moverse, la imagen "respira" como a través de una lente.
    float ab = length(dir) * 0.35;
    vec3 color;
    color.r = texture2D(uMap, coord + dir * ab).r;
    color.g = texture2D(uMap, coord).g;
    color.b = texture2D(uMap, coord - dir * ab).b;

    // Luz que entra por donde está el dedo.
    float lightFall = 1.0 - length((uv - 0.5) - uParallax * 0.4) * 0.9;
    color *= 0.82 + max(lightFall, 0.0) * 0.4;
    color = mix(color, color * uTint, 0.18);

    // Bordes fundidos: la imagen no termina en un canto, se disuelve.
    vec2 edge = smoothstep(0.0, 0.14, vUv) * smoothstep(0.0, 0.14, 1.0 - vUv);
    float alpha = edge.x * edge.y;

    // Aparición: primero el centro, después los bordes.
    float radial = 1.0 - length(vUv - 0.5) * 1.42;
    float reveal = smoothstep(0.0, 0.55, uReveal * 1.55 - (1.0 - radial));
    alpha *= reveal;

    gl_FragColor = vec4(color, alpha);
  }
`;
