/**
 * DIÁLOGOS — lo que dice la abejita, leído de `dialogos.txt` (en la raíz).
 *
 *   texto normal   → una frase
 *   # algo         → comentario
 *   - texto        → EVENTO ESPECIAL «hackeo» (sólo activa la secuencia ya
 *                    programada; el texto se muestra como texto y nada más)
 *
 * Nada de lo que venga del archivo se ejecuta ni se mete como HTML.
 */
const POR_DEFECTO = [
  "Hola amorcito 🥹💖", "¿Ya guardaste tu creación?", "Jeje, esto está quedando bonito.",
  "¿Necesitas una ayudita? 🐝", "¡Ánimo, bbsita!", "Creo que esta parte necesita un poquito más de brillo ✨",
  "No olvides guardar tu trabajo.",
];
const MAX = 300; // un tope sano de caracteres por frase

let lista = null;
let ultima = -1;
let ultimoEvento = 0;

/** Lee y separa las líneas (una sola vez; `recargar` para volver a leer). */
export async function cargar(recargar = false) {
  if (lista && !recargar) return lista;
  let texto = "";
  try {
    const r = await fetch(new URL("../dialogos.txt", location.href), { cache: "no-store" });
    if (r.ok && !/text\/html/.test(r.headers.get("content-type") || "")) texto = await r.text();
  } catch (e) { /* sin archivo: las de siempre */ }
  lista = interpretar(texto);
  if (!lista.some((d) => d.tipo === "normal")) lista.push(...POR_DEFECTO.map((t) => ({ tipo: "normal", texto: t })));
  return lista;
}

/** Texto → [{ tipo: "normal" | "hackeo", texto }] (sólo texto plano). */
export function interpretar(texto) {
  const r = [];
  for (let l of String(texto || "").replace(/^﻿/, "").split(/\r?\n/)) {
    l = l.trim();
    if (!l || l.startsWith("#") || l.startsWith("//")) continue;
    const ev = /^-\s*(.+)$/.exec(l);
    const t = (ev ? ev[1] : l).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX);
    if (t) r.push({ tipo: ev ? "hackeo" : "normal", texto: t });
  }
  return r;
}

/**
 * Una al azar sin repetir la anterior. Los eventos especiales salen menos
 * (cuentan la mitad) y nunca dos veces en menos de 5 minutos.
 */
export async function siguiente() {
  const l = await cargar();
  const puedeEvento = Date.now() - ultimoEvento > 5 * 60e3;
  const pesos = l.map((d, i) => (i === ultima && l.length > 1 ? 0 : d.tipo === "hackeo" ? (puedeEvento ? 0.5 : 0) : 1));
  let total = pesos.reduce((a, b) => a + b, 0), x = Math.random() * total;
  let i = 0;
  for (; i < l.length - 1; i++) { x -= pesos[i]; if (x <= 0 && pesos[i] > 0) break; }
  ultima = i;
  if (l[i].tipo === "hackeo") ultimoEvento = Date.now();
  return l[i];
}

/** El primer evento especial (para «Probar el evento» en Configuración). */
export async function evento() {
  const l = await cargar();
  return l.find((d) => d.tipo === "hackeo") || { tipo: "hackeo", texto: "Hola amorcito, soy yop :> te amo mucho 🥹💖" };
}
