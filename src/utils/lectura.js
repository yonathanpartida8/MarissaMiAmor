/**
 * VIGILAR LECTURA — saber si a un texto le queda algo por leer.
 *
 * Marca cada zona `.lectura` con `data-mas="arriba|abajo|ambos"` según por
 * dónde siga habiendo texto. El CSS lo usa para desvanecer ese borde: se ve
 * que hay más sin poner una barra de desplazamiento encima del papel.
 *
 * Se hace en JavaScript porque en CSS no hay manera de preguntar «¿esto
 * desborda?», y hacerlo mal cuesta caro: la máscara es una capa más que
 * componer, y ponerla en textos que caben de sobra la pagaban todas las
 * páginas para nada.
 *
 * Lo barato está en los detalles:
 *   · un único ResizeObserver para todas las zonas de la página;
 *   · el listener de scroll es pasivo (no bloquea el desplazamiento);
 *   · sólo se escribe en el DOM cuando el valor CAMBIA, así que desplazar
 *     un texto largo de arriba abajo hace dos escrituras, no doscientas.
 */

const HOLGURA = 4; // píxeles de margen: un redondeo no es «hay más texto»

/**
 * @param {HTMLElement} raiz  la página; se miran sus `.lectura`
 * @returns {() => void} función para dejar de vigilar
 */
export function vigilarLectura(raiz) {
  const zonas = raiz?.querySelectorAll?.(".lectura");
  if (!zonas?.length) return () => {};

  const repasar = (zona) => {
    const arriba = zona.scrollTop > HOLGURA;
    const abajo = zona.scrollTop + zona.clientHeight < zona.scrollHeight - HOLGURA;
    const valor = arriba && abajo ? "ambos" : abajo ? "abajo" : arriba ? "arriba" : "";
    if (zona.dataset.mas !== valor) {
      if (valor) zona.dataset.mas = valor;
      else delete zona.dataset.mas;
    }
  };

  // Un solo observador para todas: cambia el tamaño de la hoja al girar el
  // móvil, o crece el texto al terminar de escribirse, y se repasa solo.
  const ojo =
    typeof ResizeObserver === "function"
      ? new ResizeObserver((entradas) => {
          for (const e of entradas) {
            const zona = e.target.closest(".lectura");
            if (zona) repasar(zona);
          }
        })
      : null;

  const sueltas = [];
  for (const zona of zonas) {
    repasar(zona);
    const alScroll = () => repasar(zona);
    zona.addEventListener("scroll", alScroll, { passive: true });
    sueltas.push(() => zona.removeEventListener("scroll", alScroll));
    ojo?.observe(zona);
    // Y su contenido: el hueco no cambia de tamaño cuando el texto crece
    // —se escribe palabra a palabra—, así que hay que mirar lo de dentro.
    for (const hijo of zona.children) ojo?.observe(hijo);
  }

  return () => {
    ojo?.disconnect();
    for (const soltar of sueltas) soltar();
  };
}
