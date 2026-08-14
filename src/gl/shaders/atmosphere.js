/**
 * SHADER DE ATMÓSFERA.
 *
 * Es el aire del libro: la niebla de color que hay detrás de todas las páginas
 * y que cambia de humor con cada capítulo. Se dibuja en un solo quad a pantalla
 * completa, así que cuesta un puñado de instrucciones por píxel y nada más.
 *
 * Capas, de atrás hacia delante:
 *   1. degradado radial profundo (el "vacío")
 *   2. dos capas de fbm a distinta velocidad → nubes suaves
 *   3. haz de luz vertical que respira
 *   4. fuga de luz que sigue al dedo / a la inclinación del móvil
 *   5. viñeta y ruido de banding
 */

export const atmosphereVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const atmosphereFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uDeep;      // color del fondo profundo
  uniform vec3  uAccentA;   // acento principal del capítulo
  uniform vec3  uAccentB;   // acento secundario
  uniform vec2  uPointer;   // -1..1, dedo + giroscopio
  uniform float uIntensity; // 0..1 presencia general de la niebla
  uniform float uPulse;     // pico transitorio en las transiciones
  uniform float uFlash;     // destello blanco
  uniform float uMood;      // 0..1 ajusta turbulencia y velocidad
  uniform float uQuality;   // 0 = móvil humilde, 1 = todo

  varying vec2 vUv;

  // --- Ruido de valor: barato y suficiente para niebla ------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Suavizado quintico: sin él se ven los rombos de la rejilla.
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p, float octaves) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 5; i++) {
      if (float(i) >= octaves) break;
      value += amplitude * noise(p);
      p *= 2.02;
      p += vec2(1.7, 9.2); // desplaza cada octava: evita el patrón repetido
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Coordenadas corregidas de aspecto: la niebla no se estira en apaisado.
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

    float t = uTime * 0.045;
    float octaves = mix(2.0, 4.0, uQuality);

    // --- 1. Vacío --------------------------------------------------------
    float radial = length(p * vec2(0.82, 1.05));
    vec3 color = mix(uDeep * 1.5, uDeep * 0.35, smoothstep(0.15, 1.15, radial));

    // --- 2. Nubes --------------------------------------------------------
    vec2 drift = vec2(t * 0.6, -t * 0.35);
    float turbulence = mix(1.0, 2.1, uMood);

    float cloudA = fbm(p * 1.35 * turbulence + drift, octaves);
    float cloudB = fbm(p * 2.7 * turbulence - drift * 1.6 + cloudA * 0.4, octaves);

    // La niebla se concentra donde el degradado es más denso.
    float density = smoothstep(0.05, 0.95, cloudA) * (1.0 - smoothstep(0.2, 1.3, radial));
    color += uAccentA * density * 0.42 * uIntensity;
    color += uAccentB * pow(cloudB, 2.2) * 0.34 * uIntensity;

    // --- 3. Haz de luz que respira --------------------------------------
    float breath = 0.5 + 0.5 * sin(uTime * 0.22);
    float shaft = exp(-abs(p.x + 0.15) * 3.4) * smoothstep(0.9, -0.5, p.y);
    color += uAccentA * shaft * 0.16 * (0.6 + breath * 0.4) * uIntensity;

    // --- 4. Fuga de luz que sigue al dedo -------------------------------
    vec2 leak = p - uPointer * vec2(0.42, 0.32);
    float glow = exp(-dot(leak, leak) * 5.5);
    color += mix(uAccentA, uAccentB, 0.45) * glow * (0.20 + uPulse * 0.75);

    // Aberración cromática mínima en los bordes: sabor de lente real.
    float edge = smoothstep(0.35, 1.0, radial);
    color.r *= 1.0 + edge * 0.06;
    color.b *= 1.0 + edge * 0.09;

    // --- 5. Acabado ------------------------------------------------------
    color *= 1.0 - edge * 0.42;                 // viñeta
    color += vec3(uFlash) * uFlash;             // destello de transición

    // Ruido finísimo: mata el banding de los degradados en pantallas OLED.
    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.016;
    color += grain;

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;
