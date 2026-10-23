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
import { PREF } from "../config/preferencias.js";
const POR_DEFECTO = [
  "Hola amorcito 🥹💖", "¿Ya guardaste tu creación?", "Jeje, esto está quedando bonito.",
  "¿Necesitas una ayudita? 🐝", "¡Ánimo, bbsita!", "Creo que esta parte necesita un poquito más de brillo ✨",
  "No olvides guardar tu trabajo.",
];
const MAX = 300; // un tope sano de caracteres por frase

/* Fase 39 — idiomas. «Dev» es el de antes (las frases de dialogos.txt); los otros traen las suyas.
   El evento especial («hackeo») sigue saliendo de dialogos.txt en todos. */
const FRASES = {
  latam: [
    "Hola amorcito 🥹💖", "¿Cómo vas? Esto ya se ve precioso.", "Te amo, ¿sabías? 🐝💛", "¡Ánimo, bbsita! Vas súper bien.",
    "Un poquito de brillo aquí no le caería mal ✨", "¿Ya guardaste? Por si acaso 💾", "Me encanta cómo te está quedando.",
    "Tómate un respiro y un vasito de agua 💧", "Esa foto quedó hermosa 📸", "Bzz bzz… aquí ando, acompañándote.",
  ],
  mx: [
    "¡Holi, amorcito! 🥹💖", "¿Cómo vas? Ya quedó bien bonito.", "Te amo un chorro 🐝💛", "¡Échale ganas, bbsita, vas rebien!",
    "Ponle tantito brillo aquí, ¿no? ✨", "¿Ya guardaste? No vaya a ser… 💾", "Ay, qué chulada te está quedando.",
    "Tómate tu aguita, ándale 💧", "Esa foto quedó bien padre 📸", "Aquí ando de metiche, bzz bzz 🐝",
  ],
  // Sólo con «Habilitar lenguaje poquitito explícito» (se mezclan con las de arriba).
  explicito: [
    "¿Qué onda, wey? 🐝", "No manches, está quedando bien perrón 🔥", "Neta, qué chulada, wey.", "Chale, ¿y si guardas, wey? 💾",
    "¿Qué pedo, ya mero? Te amo 💛", "Órale, te está quedando de poca madre ✨", "Ay wey, qué bonito te quedó 🥹",
    "Ya, wey, tómate tu agua 💧", "Está bien chido, neta 😎", "No inventes, me encanta 💖",
  ],
};

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
  const l = await listaPara();
  const puedeEvento = Date.now() - ultimoEvento > 5 * 60e3;
  const pesos = l.map((d, i) => (i === ultima && l.length > 1 ? 0 : d.tipo === "hackeo" ? (puedeEvento ? 0.5 : 0) : 1));
  let total = pesos.reduce((a, b) => a + b, 0), x = Math.random() * total;
  let i = 0;
  for (; i < l.length - 1; i++) { x -= pesos[i]; if (x <= 0 && pesos[i] > 0) break; }
  ultima = i;
  if (l[i].tipo === "hackeo") ultimoEvento = Date.now();
  return l[i];
}

/** Las frases según el idioma de Configuración (Dev = dialogos.txt tal cual). */
let cache = { k: "", l: null };
async function listaPara() {
  const base = await cargar();
  const { idioma = "latam", explicito = false } = PREF;
  if (idioma === "dev") return base;
  const k = idioma + (explicito ? "+x" : "");
  if (cache.k !== k || cache.base !== base) {
    const frases = [...(FRASES[idioma] || FRASES.latam), ...(explicito ? FRASES.explicito : [])];
    cache = { k, base, l: [...frases.map((texto) => ({ tipo: "normal", texto })), ...base.filter((d) => d.tipo === "hackeo")] };
    ultima = -1;
  }
  return cache.l;
}

/** El primer evento especial (para «Probar el evento» en Configuración). */
export async function evento() {
  const l = await cargar();
  return l.find((d) => d.tipo === "hackeo") || { tipo: "hackeo", texto: "Hola amorcito, soy yop :> te amo mucho 🥹💖" };
}
