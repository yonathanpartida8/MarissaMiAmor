/**
 * EL OJO DE LA ABEJITA (Fase 41) — revisa el librito y dice, con cariño, qué se ve un poco mal.
 *
 * No es magia ni manda nada a internet: son reglas de diseño que la abejita aplica a cada página.
 *   mal   se nota feo o no se puede usar: algo se sale de la hoja, letra que casi no se lee
 *         (muy chiquita o del mismo color que el fondo), una página vacía, no hay cómo pasar…
 *   ojo   se podría ver mejor: textos encimados, foto borrosa o estirada, casi centrado, texto larguísimo
 *   idea  detalles lindos: sin música, muchas letras distintas, transiciones de todos los colores…
 * Cada cosa trae su página y sus elementos (para ir a verla) y, cuando se puede, «Arreglar» de un toque.
 */

const hex = (c) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || "").trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const luz = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
export const contraste = (a, b) => { const x = hex(a), y = hex(b); if (!x || !y) return 21; const l1 = luz(x), l2 = luz(y); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const mezcla = (a, b) => { const x = hex(a), y = hex(b); if (!x || !y) return a || b; return "#" + x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, "0")).join(""); };
/** El color «de fondo» de una página (el promedio si es degradado). Con foto de fondo no se sabe: null. */
function fondoDe(p) {
  const f = p?.fondo || {};
  if (f.imagen?.asset || f.css || f.html) return null;
  if (f.tipo === "gradiente" && f.gradiente) return mezcla(f.gradiente.a || "#ffd9ea", f.gradiente.b || "#ff7fae");
  return f.color || "#ffffff";
}
/** Lo que hay DETRÁS de un elemento (lo de abajo que lo cubre): el color de una forma, null si es foto/vídeo o no se sabe. */
function detras(e, els, fondo) {
  const i = els.indexOf(e), cx = (e.x || 0) + (e.w || 0) / 2, cy = (e.y || 0) + (e.h || 0) / 2;
  for (let j = i - 1; j >= 0; j--) {
    const o = els[j];
    if (o.oculto || cx < o.x || cx > o.x + o.w || cy < o.y || cy > o.y + o.h) continue;
    if (o.tipo === "forma" && o.forma?.figura !== "linea") {
      const f = o.forma || {};
      if (f.gradiente) return mezcla(f.gradiente.a, f.gradiente.b);
      if (f.relleno && f.relleno !== "transparent") return hex(f.relleno) ? f.relleno : null;
      continue;
    }
    if (/^(imagen|video|album|componente|escena3d|gif)$/.test(o.tipo)) return null;
  }
  return fondo;
}
const DE_EJEMPLO = new Set(["https://open.spotify.com/", "https://wa.me/", "https://maps.google.com/"]);
const textoPlano = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const nombre = (e) => (e.nombre || e.tipo || "algo").toLowerCase();
const area = (a) => Math.max(0, a.w) * Math.max(0, a.h);
const cruce = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Revisa el proyecto entero. Devuelve [{ nivel, texto, pagina, els, arreglar? }] (lo peor primero).
 * `app` sólo hace falta para arreglar (estado, lienzo).
 */
export function revisar(app) {
  const E = app.estado, P = E.proyecto;
  if (!P) return [];
  const W = P.ajustes?.ancho || 390, H = P.ajustes?.alto || 844;
  const r = [];
  const add = (nivel, texto, pagina, els = [], arreglar = null) => r.push({ nivel, texto, pagina, els, arreglar });
  const fuentes = new Set(), trans = new Set(), botonMusica = [];
  let hayMusica = !!P.ajustes?.musica?.asset;
  P.orden.forEach((pid, i) => {
    const p = P.paginas[pid];
    if (!p) return;
    const n = i + 1;
    const els = (p.els || []).filter((e) => !e.oculto);
    if (p.musica?.modo === "propia" && p.musica.asset) hayMusica = true;
    if (p.transicion?.tipo) trans.add(p.transicion.tipo);
    const visibles = els.filter((e) => e.tipo !== "musica");
    if (!visibles.length) add("mal", `La página ${n} está vacía: ponle un bloque, una foto o una frase bonita.`, pid);
    const fondo = fondoDe(p);
    for (const e of els) {
      const caja = { x: e.x || 0, y: e.y || 0, w: e.w || 0, h: e.h || 0 };
      // Se sale de la hoja (más de un cuarto fuera, y no a propósito como un fondo enorme).
      const dentro = cruce(caja, { x: 0, y: 0, w: W, h: H });
      if (area(caja) > 0 && dentro < area(caja) * 0.75 && !(caja.w >= W * 0.9 && caja.h >= H * 0.9)) {
        add("mal", `En la página ${n}, «${nombre(e)}» se sale de la hoja: en el teléfono de ella no se va a ver entero.`, pid, [e.id], () => {
          if (E.paginaId !== pid) E.irPagina(pid);
          app.lienzo?.traerALaHoja?.([e.id]);
        });
      }
      if (e.tipo === "texto" && e.texto) {
        const t = e.texto, txt = textoPlano(t.html);
        if (t.fuente) fuentes.add(t.fuente);
        if (txt && (t.tam || 28) < 13) add("mal", `En la página ${n} hay una letra muy chiquita (${t.tam}px): en el teléfono casi no se lee.`, pid, [e.id], () => E.setEl(e.id, { "texto.tam": 16 }, "Letra más grande"));
        const atras = !e.caja?.fondo && !e.caja?.gradiente && fondo ? detras(e, els, fondo) : null;
        if (txt && atras && contraste(t.color || "#3a2440", atras) < 2.6) {
          const mejor = contraste("#2b1d2a", atras) >= contraste("#ffffff", atras) ? "#2b1d2a" : "#ffffff";
          add("mal", `En la página ${n}, «${txt.slice(0, 24)}${txt.length > 24 ? "…" : ""}» casi no se ve: su color se parece mucho al fondo.`, pid, [e.id], () => E.setEl(e.id, { "texto.color": mejor }, "Color que se lee"));
        }
        if (txt.length > 420) add("ojo", `En la página ${n} hay un texto larguísimo (${txt.length} letras): partirlo en dos páginas se lee más bonito.`, pid, [e.id]);
        // Casi centrado (a menos de 6 px del centro, pero no justo).
        const cx = caja.x + caja.w / 2, d = Math.abs(cx - W / 2);
        if (!e.rot && d > 0.5 && d < 6 && caja.w < W * 0.98) add("ojo", `En la página ${n}, «${txt.slice(0, 20) || nombre(e)}» está casi centrado… pero no. ¿Lo centro bien?`, pid, [e.id], () => E.setEl(e.id, { x: Math.round(W / 2 - caja.w / 2) }, "Centrar"));
      }
      if (e.tipo === "boton" && e.boton?.fuente) fuentes.add(e.boton.fuente);
      // Botones (y lo que se toca) que no harían nada, o que llevan a un enlace de ejemplo.
      const ac = e.accion, quien = `«${(e.boton?.texto || nombre(e)).slice(0, 24)}»`;
      if (ac?.tipo === "enlace") {
        if (!/^(https?:|mailto:|tel:)/i.test(ac.destino || "")) add("mal", `En la página ${n}, ${quien} abre un enlace… pero está vacío: no haría nada. Pon tu enlace (https://…).`, pid, [e.id]);
        else if (DE_EJEMPLO.has(ac.destino)) add("idea", `En la página ${n}, ${quien} lleva a un enlace de ejemplo: pon el tuyo (tu playlist, tu chat, tu lugar).`, pid, [e.id]);
      }
      if (/^(mostrar|ocultar|alternar)$/.test(ac?.tipo || "") && !(p.els || []).some((o) => o.id === ac.destino)) add("mal", `En la página ${n}, ${quien} debería mostrar algo que ya no existe: elige qué muestra o bórralo.`, pid, [e.id]);
      if (ac?.tipo === "ir" && !P.paginas[ac.destino]) add("mal", `En la página ${n}, ${quien} lleva a una página que ya borraste.`, pid, [e.id]);
      if (ac?.tipo === "musica" && e.tipo !== "musica") botonMusica.push([n, pid, e.id, quien]); // (el botoncito de música de siempre se esconde solo sin canción)
      if (e.tipo === "imagen" && !e.imagen?.asset && !e.imagen?.url) add("ojo", `En la página ${n} falta poner la foto en «${nombre(e)}» (tócala dos veces para elegirla).`, pid, [e.id]);
      if (e.tipo === "video" && !e.video?.asset && !e.video?.url) add("ojo", `En la página ${n} falta elegir el vídeo de «${nombre(e)}».`, pid, [e.id]);
      if (e.tipo === "imagen" && e.imagen?.asset) {
        const a = P.assets?.[e.imagen.asset];
        if (a?.w && a?.h) {
          if (a.w < caja.w * 1.15 && a.h < caja.h * 1.15) add("ojo", `En la página ${n}, una foto es más chica que su recuadro: se va a ver borrosa. Súbela en más calidad o hazla un poco más chica.`, pid, [e.id]);
          const pa = a.w / a.h, pc = caja.w / Math.max(1, caja.h);
          if (e.imagen.ajuste === "fill" && Math.abs(pa / pc - 1) > 0.12) add("ojo", `En la página ${n} hay una foto estirada (se ve aplastada). ¿La dejo con su forma?`, pid, [e.id], () => E.setEl(e.id, { "imagen.ajuste": "cover" }, "Foto con su forma"));
        }
      }
    }
    // Textos encimados (más de la mitad del más chico).
    const textos = visibles.filter((e) => e.tipo === "texto" && textoPlano(e.texto?.html));
    for (let a = 0; a < textos.length; a++) for (let b = a + 1; b < textos.length; b++) {
      const A = textos[a], B = textos[b];
      const c = cruce(A, B), m = Math.min(area(A), area(B));
      if (m > 0 && c > m * 0.5) { add("ojo", `En la página ${n} hay dos textos encimados: uno tapa al otro.`, pid, [A.id, B.id]); a = textos.length; break; }
    }
    // ¿Cómo se pasa a la siguiente? (sin flechas, sin botón y sin tiempo)
    const rep = P.ajustes?.reproduccion || {};
    if (i < P.orden.length - 1 && rep.flechas === false && rep.deslizar === false && !p.duracion && !els.some((e) => e.accion?.tipo === "siguiente" || e.accion?.tipo === "ir")) {
      add("mal", `De la página ${n} no hay cómo pasar a la siguiente (sin flechas, sin deslizar y sin botón).`, pid);
    }
  });
  if (!hayMusica && botonMusica.length) {
    const [n, pid, id, quien] = botonMusica[0], mas = botonMusica.length - 1;
    add("ojo", `En la página ${n}, ${quien}${mas ? ` (y ${mas} ${mas === 1 ? "botón más" : "botones más"})` : ""} pone la música… pero tu librito aún no tiene canción: elígela en Músicas.`, pid, [id]);
  }
  if (fuentes.size > 4) add("idea", `Usas ${fuentes.size} letras distintas: con 2 o 3 se ve más elegante.`, null);
  if (trans.size > 3) add("idea", `Hay ${trans.size} transiciones distintas: una o dos repetidas se sienten más profesionales.`, null);
  if (!hayMusica && P.orden.length > 1) add("idea", "Tu librito no tiene música: una canción le da mucha vida (en Músicas).", null);
  if (P.orden.length === 1) add("idea", "Es de una sola página: ¿le haces una portada y una carta? En Bloques hay unas listas.", null);
  const peso = { mal: 0, ojo: 1, idea: 2 };
  return r.sort((a, b) => peso[a.nivel] - peso[b.nivel]);
}

/** Un resumen cortito, con la voz de la abejita. */
export function resumen(lista, paginas) {
  const mal = lista.filter((x) => x.nivel === "mal").length, ojo = lista.filter((x) => x.nivel === "ojo").length, idea = lista.filter((x) => x.nivel === "idea").length;
  if (!lista.length) return `Revisé tus ${paginas} ${paginas === 1 ? "página" : "páginas"} con lupa y… ¡todo se ve precioso! 🐝✨`;
  const partes = [mal ? `${mal} ${mal === 1 ? "cosita que se ve un poco mal" : "cositas que se ven un poco mal"}` : "", ojo ? `${ojo} ${ojo === 1 ? "detalle" : "detalles"} para mejorar` : "", idea ? `${idea} ${idea === 1 ? "idea" : "ideas"}` : ""].filter(Boolean);
  return `Revisé tus ${paginas} ${paginas === 1 ? "página" : "páginas"}: encontré ${partes.join(", ").replace(/, ([^,]*)$/, " y $1")}. ¿Te los enseño?`;
}

