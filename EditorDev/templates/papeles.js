/**
 * PAPELES — estilos de hoja en CSS puro (sin archivos): se repiten o se
 * estiran, así que se adaptan a cualquier tamaño de hoja y se ven igual en el
 * librito exportado. Los usan los temas por hoja, el inspector de la página y
 * las plantillas.
 */
const corazon = (c) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 31s-7-4.3-9-8.6C11.6 19.3 13.5 16 16.8 16c1.9 0 3.3 1.1 4 2.2.8-1.1 2.2-2.2 4.1-2.2 3.3 0 5.2 3.3 3.8 6.4C29 26.7 22 31 22 31z' fill='%23${c}'/%3E%3C/svg%3E") 0 0/44px 44px`;
// Rosetas en rejillas de tamaños distintos: juntas no se nota que se repiten.
const roseta = (x, y, a, b, w, h) => `radial-gradient(ellipse ${a}px ${b}px at 50% 50%, #9a6a35 0 40%, #2a170a 47% 68%, transparent 74%) ${x}px ${y}px/${w}px ${h}px`;
const mancha = (x, y, r, w, h) => `radial-gradient(circle at 50% 50%, #2a170a 0 ${r}px, transparent ${r + 0.6}px) ${x}px ${y}px/${w}px ${h}px`;

/** [id, nombre, color base, css]. El color base va debajo (se puede cambiar en el inspector). */
export const PAPELES = [
  ["liso", "Liso", "#fffaf6", ""],
  ["rayada", "Rayada", "#fffdf7", "repeating-linear-gradient(180deg, transparent 0 27px, rgba(90,120,170,.26) 27px 28px), linear-gradient(90deg, transparent 0 42px, rgba(224,69,127,.38) 42px 43.5px, transparent 43.5px)"],
  ["cuadros", "Cuadriculada", "#fdfdfb", "linear-gradient(rgba(90,120,170,.17) 1px, transparent 1px) 0 0/22px 22px, linear-gradient(90deg, rgba(90,120,170,.17) 1px, transparent 1px) 0 0/22px 22px"],
  ["puntitos", "Puntitos", "#fffaf6", "radial-gradient(rgba(60,40,60,.24) 1.2px, transparent 1.7px) 0 0/18px 18px"],
  ["acuarela", "Acuarela", "#fffaf7", "radial-gradient(60% 42% at 18% 16%, rgba(255,179,207,.55), transparent 70%), radial-gradient(55% 40% at 86% 82%, rgba(159,211,199,.45), transparent 70%), radial-gradient(42% 32% at 78% 24%, rgba(255,217,184,.5), transparent 70%)"],
  ["pergamino", "Pergamino", "#f2dfb8", "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(120,80,30,.24)), linear-gradient(175deg, rgba(255,250,235,.5), rgba(200,160,100,.15))"],
  ["kraft", "Kraft", "#d2b07f", "radial-gradient(rgba(255,255,255,.13) 1px, transparent 1.5px) 0 0/7px 7px, radial-gradient(rgba(70,40,10,.12) 1px, transparent 1.5px) 3px 4px/9px 9px"],
  ["vichy", "Picnic", "#ffffff", "linear-gradient(90deg, rgba(224,69,127,.2) 50%, transparent 0) 0 0/28px 28px, linear-gradient(rgba(224,69,127,.2) 50%, transparent 0) 0 0/28px 28px"],
  ["corazones", "Corazoncitos", "#fff5f8", corazon("ffc4d9")],
  ["noche", "Noche estrellada", "#1b1035", "radial-gradient(1.6px 1.6px at 20px 30px, #fff, transparent) 0 0/150px 120px, radial-gradient(1px 1px at 90px 80px, rgba(255,255,255,.7), transparent) 0 0/150px 120px, radial-gradient(1.2px 1.2px at 125px 18px, rgba(255,236,200,.9), transparent) 0 0/150px 120px, linear-gradient(180deg, #1b1035, #3a1d4f)"],
  ["pizarron", "Pizarrón", "#26332d", "radial-gradient(120% 100% at 50% 35%, rgba(255,255,255,.07), transparent 70%)"],
  ["corcho", "Corcho", "#b98a5a", "radial-gradient(rgba(90,50,20,.35) 1px, transparent 1.6px) 0 0/6px 6px, radial-gradient(rgba(255,230,190,.25) 1px, transparent 1.6px) 3px 2px/8px 8px"],
  ["leopardo", "Leopardo", "#d6b48c", [roseta(0, 0, 13, 10, 86, 74), roseta(43, 37, 11, 9, 86, 74), roseta(20, 12, 9, 12, 61, 67), roseta(7, 40, 12, 8, 97, 83), mancha(5, 9, 2.6, 37, 41), mancha(11, 7, 2, 53, 29)].join(", ")],
];
const PAPEL = Object.fromEntries(PAPELES.map((p) => [p[0], p]));

/** Fondo de página para un papel (conserva la foto/HTML de fondo que hubiera). */
export function fondoDePapel(id, antes = {}) {
  const p = PAPEL[id] || PAPEL.liso;
  const f = { tipo: "color", color: p[2] };
  if (p[3]) { f.css = p[3]; f.papel = p[0]; }
  if (antes.imagen) f.imagen = antes.imagen;
  if (antes.html) f.html = antes.html;
  return f;
}
export const nombrePapel = (id) => PAPEL[id]?.[1] || "";
/** Estilo para pintar una muestra (ficha) de un papel. */
export const muestraPapel = (id) => { const p = PAPEL[id] || PAPEL.liso; return p[3] ? `${p[3]}, ${p[2]}` : p[2]; };
