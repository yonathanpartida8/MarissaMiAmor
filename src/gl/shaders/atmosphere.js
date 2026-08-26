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

  /**
   * 0 = cuarto oscuro · 1 = habitación con luz.
   *
   * Es lo que separa el modo noche de los modos claro y pastel, y no es un
   * simple «sube el brillo»: cambia la FORMA de componer la niebla.
   *
   * Con 0 los velos SUMAN luz sobre un fondo casi negro, que es como se
   * pinta algo que brilla en la oscuridad. Con 1 los velos TIÑEN un fondo
   * casi blanco, que es como se pinta la luz que entra por una vidriera.
   * Sumar sobre blanco no da un modo claro: da una pantalla quemada, porque
   * a un blanco ya no se le puede añadir nada.
   *
   * La niebla es la misma y se mueve igual en los tres modos. Lo único que
   * cambia es si pone luz o si pone color.
   */
  uniform float uLight;

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
    // De noche el centro se abre (×1.55) y las esquinas se hunden (×0.32):
    // así el fondo tiene un pozo de luz en medio. A plena luz ese mismo
    // recorrido no sirve —×1.55 sobre un casi blanco lo quema y ×0.32 lo
    // vuelve gris ceniza—, así que el rango se estrecha casi a nada: la
    // pared es la pared, apenas con un respiro de sombra en los bordes.
    float radial = length(p * vec2(0.86, 1.02));
    float alto = mix(1.55, 1.02, uLight);
    float bajo = mix(0.32, 0.88, uLight);
    vec3 color = mix(uDeep * alto, uDeep * bajo, smoothstep(0.10, 1.15, radial));

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

    // La fuerza de cada velo, aparte de su color: sumando hace falta el
    // color entero, tiñendo hace falta saber CUÁNTO se tiñe.
    float fuerzaA = (a1 * 0.78 + a2 * 0.52) * centro * uIntensity;
    float fuerzaB = (b1 * 0.62 + b2 * 0.44) * centro * uIntensity;

    // Las dos maneras de componer, y la mezcla entre ellas. Se calculan las
    // dos siempre: son cuatro multiplicaciones por píxel, y una rama de
    // verdad en un shader a pantalla completa cuesta bastante más que eso.
    // (Los nombres van sin eñes ni tildes a propósito: GLSL sólo admite
    // ASCII en los identificadores, y un shader que no compila deja el
    // fondo en negro sin decir por qué.)
    vec3 sumado = color + uAccentA * fuerzaA + uAccentB * fuerzaB;

    vec3 tenido = mix(color, uAccentA, clamp(fuerzaA, 0.0, 1.0) * 0.82);
    tenido = mix(tenido, uAccentB, clamp(fuerzaB, 0.0, 1.0) * 0.66);

    color = mix(sumado, tenido, uLight);

    // --- 3. Haz de luz que respira --------------------------------------
    float aliento = 0.5 + 0.5 * sin(uTime * 0.22);
    float haz = exp(-abs(p.x + 0.15) * 3.4) * smoothstep(0.9, -0.5, p.y);
    // A plena luz el haz también tiñe: sumado sobre una pared clara no se
    // vería, y subido de fuerza la quemaría por una banda entera.
    float fuerzaHaz = haz * 0.14 * (0.6 + aliento * 0.4) * uIntensity;
    color = mix(
      color + uAccentA * fuerzaHaz,
      mix(color, uAccentA, clamp(fuerzaHaz * 2.6, 0.0, 1.0)),
      uLight
    );

    // --- 4. Fuga de luz que sigue al dedo -------------------------------
    vec2 fuga = p - uPointer * vec2(0.42, 0.32);
    float brillo = exp(-dot(fuga, fuga) * 5.5);
    vec3 colorFuga = mix(uAccentA, uAccentB, 0.45);
    float fuerzaFuga = brillo * (0.20 + uPulse * 0.75);
    color = mix(
      color + colorFuga * fuerzaFuga,
      mix(color, colorFuga, clamp(fuerzaFuga * 0.85, 0.0, 1.0)),
      uLight
    );

    // Aberración cromática mínima en los bordes: sabor de lente real.
    float borde = smoothstep(0.35, 1.0, radial);
    color.r *= 1.0 + borde * 0.06;
    color.b *= 1.0 + borde * 0.09;

    // --- 5. Acabado ------------------------------------------------------
    // La viñeta del fondo, muy rebajada a plena luz por la misma razón que
    // la del CSS: multiplicar un color claro por algo menor que uno le quita
    // el color antes que la luz, y las esquinas se van a gris de fotocopia.
    color *= 1.0 - borde * mix(0.42, 0.11, uLight);
    color += vec3(uFlash) * uFlash;              // destello de transición

    // Tramado finísimo contra el bandeado. Va en coordenadas de pantalla y
    // sin depender del tiempo: un tramado que parpadea es ruido que se ve.
    color += (tramado(gl_FragCoord.xy) - 0.5) * 0.014;

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;
