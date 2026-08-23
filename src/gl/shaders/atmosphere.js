/**
 * SHADER DE ATMÓSFERA.
 *
 * Es el aire del libro: la luz de color que hay detrás de todas las páginas y
 * que cambia de humor con cada capítulo. Se dibuja en un solo quad a pantalla
 * completa.
 *
 * ── POR QUÉ YA NO HAY RUIDO FRACTAL ───────────────────────────────────
 * Antes esto eran dos capas de `fbm` sobre ruido de valor. El ruido de valor
 * se apoya en una REJILLA: se sortea un número en cada esquina de cada celda
 * y se interpola por dentro. Con muchas octavas la rejilla se disimula; con
 * pocas —que es lo que le tocaba a cualquier móvil que no fuera de gama
 * alta— se veía tal cual: cuadros. Y encima el tramado final usaba esa misma
 * función de sorteo a escala de píxel, donde los números se hacen enormes y
 * pierden precisión, así que en vez de un grano fino salían manchas
 * cuadradas que se movían a saltos. Eso era el glitch.
 *
 * Ahora la niebla son VELOS: gaussianas elípticas que giran y se cruzan. Un
 * velo es suave por definición matemática, no hay rejilla que pueda asomar,
 * y cada uno recorre su propia elipse con periodos que no son múltiplos
 * entre sí, así que la formación no se repite nunca.
 *
 * De paso cuesta bastante menos: cuatro exponenciales frente a las treinta y
 * dos consultas de ruido que había antes, y el mismo dibujo en todas las
 * gamas —sin la versión pobre que era justo la que enseñaba los cuadros—.
 *
 * Capas, de atrás hacia delante:
 *   1. degradado radial profundo (el "vacío")
 *   2. tres o cuatro velos de color que se cruzan
 *   3. haz de luz vertical que respira
 *   4. fuga de luz que sigue al dedo / a la inclinación del móvil
 *   5. viñeta y tramado contra el bandeado
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
  uniform float uMood;      // 0..1 ajusta amplitud y velocidad
  uniform float uQuality;   // 0 = móvil humilde, 1 = todo

  varying vec2 vUv;

  /**
   * Un velo de luz: gaussiana elíptica, girada.
   *
   * «exp(-d·d)» no tiene bordes, ni escalones, ni rejilla: es suave hasta
   * donde llegue la precisión del hardware. Es la razón de que este fondo ya
   * no pueda enseñar cuadros por mucho que se le baje la calidad.
   */
  float velo(vec2 p, vec2 centro, vec2 radio, float giro) {
    vec2 d = p - centro;
    float c = cos(giro);
    float s = sin(giro);
    d = vec2(d.x * c - d.y * s, d.x * s + d.y * c) / radio;
    return exp(-dot(d, d));
  }

  /**
   * Tramado de gradiente entrelazado.
   *
   * Rompe el bandeado de los degradados —esas franjas que se ven en las
   * pantallas OLED— con un patrón finísimo y regular. No usa sorteos a
   * escala de píxel, que era de donde salían las manchas cuadradas.
   */
  float tramado(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  void main() {
    // Coordenadas corregidas de aspecto: la luz no se estira en apaisado.
    vec2 uv = vUv;
    float aspecto = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspecto, 1.0);

    // El humor sólo cambia el ritmo y la amplitud del vaivén, nunca la
    // manera de dibujar: una tormenta y un amanecer son el mismo fondo a
    // distinta velocidad, y ninguno de los dos puede glitchear.
    float t = uTime * mix(0.030, 0.058, uMood);
    float vaiven = mix(0.34, 0.52, uMood);

    // --- 1. Vacío --------------------------------------------------------
    float radial = length(p * vec2(0.86, 1.02));
    vec3 color = mix(uDeep * 1.55, uDeep * 0.32, smoothstep(0.10, 1.15, radial));

    // --- 2. Velos --------------------------------------------------------
    // Los periodos (0.83, 0.61, 0.47, 0.72…) no son múltiplos entre sí, así
    // que los velos no vuelven nunca a la misma formación: el fondo no se
    // repite aunque se mire un rato largo.
    float a1 = velo(
      p,
      vec2(sin(t * 0.83) * vaiven - 0.14, cos(t * 0.61) * vaiven * 0.8 + 0.08),
      vec2(0.40, 0.30),
      t * 0.30
    );
    float a2 = velo(
      p,
      vec2(sin(t * 0.47 + 2.1) * vaiven * 1.1 + 0.18, cos(t * 0.72 + 1.3) * vaiven * 0.7 - 0.16),
      vec2(0.31, 0.44),
      -t * 0.22
    );
    float b1 = velo(
      p,
      vec2(cos(t * 0.55 + 4.0) * vaiven * 1.2, sin(t * 0.39 + 0.7) * vaiven * 0.9 + 0.20),
      vec2(0.52, 0.26),
      t * 0.17
    );

    // El cuarto velo es lo único que se reserva la gama alta, y sólo añade
    // una capa más de profundidad: quitarlo no cambia el dibujo, lo aclara.
    float b2 = uQuality * velo(
      p,
      vec2(sin(t * 0.31 + 5.2) * vaiven, cos(t * 0.44 + 3.1) * vaiven * 0.6 - 0.06),
      vec2(0.28, 0.22),
      -t * 0.36
    );

    // Se apagan hacia los bordes, pero con sitio de sobra: si el corte va
    // muy pegado al centro los tres velos se solapan ahí mismo y se leen
    // como una sola mancha. Dejándoles campo, cada uno se distingue.
    float centro = 1.0 - smoothstep(0.42, 1.30, radial);

    color += uAccentA * (a1 * 0.78 + a2 * 0.52) * centro * uIntensity;
    color += uAccentB * (b1 * 0.62 + b2 * 0.44) * centro * uIntensity;

    // --- 3. Haz de luz que respira --------------------------------------
    float aliento = 0.5 + 0.5 * sin(uTime * 0.22);
    float haz = exp(-abs(p.x + 0.15) * 3.4) * smoothstep(0.9, -0.5, p.y);
    color += uAccentA * haz * 0.14 * (0.6 + aliento * 0.4) * uIntensity;

    // --- 4. Fuga de luz que sigue al dedo -------------------------------
    vec2 fuga = p - uPointer * vec2(0.42, 0.32);
    float brillo = exp(-dot(fuga, fuga) * 5.5);
    color += mix(uAccentA, uAccentB, 0.45) * brillo * (0.20 + uPulse * 0.75);

    // Aberración cromática mínima en los bordes: sabor de lente real.
    float borde = smoothstep(0.35, 1.0, radial);
    color.r *= 1.0 + borde * 0.06;
    color.b *= 1.0 + borde * 0.09;

    // --- 5. Acabado ------------------------------------------------------
    color *= 1.0 - borde * 0.42;                 // viñeta
    color += vec3(uFlash) * uFlash;              // destello de transición

    // Tramado finísimo contra el bandeado. Va en coordenadas de pantalla y
    // sin depender del tiempo: un tramado que parpadea es ruido que se ve.
    color += (tramado(gl_FragCoord.xy) - 0.5) * 0.014;

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;
