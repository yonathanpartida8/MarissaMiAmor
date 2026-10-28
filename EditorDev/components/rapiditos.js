/**
 * MENSAJITOS RÁPIDOS (Fase 46) — «Besitos», «Te amo», «Cuídate» o uno escrito por ti, desde el mapa.
 *
 *   · Se mandan de verdad por su M.YNTHN (/api/toques): a tu amorcito le llega una notificación al instante
 *     y, si tiene la app abierta, el mensajito aparece arriba con su animación y SU sonido (cada uno suena
 *     distinto: los besitos «muak», el te amo con su latido, el cuídate como campanita y el tuyo como cartita).
 *   · Llegan con el latido de la app (app.js); al verlos se marcan como vistos para no repetirse.
 *   · El texto propio es sólo texto (hasta 140 letras): nunca se interpreta como HTML.
 */
import { el, aviso } from "./ui.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import { vibrar } from "../config/preferencias.js";
import { sinMovimiento as reducido } from "./transiciones.js";

export const TOQUES = [
  { id: "besitos", n: "Besitos", e: "😘", c: "rosa", frase: "te mandó besitos", mia: "Le mandaste besitos" },
  { id: "teamo", n: "Te amo", e: "💗", c: "lila", frase: "te dijo «te amo»", mia: "Le dijiste «te amo»" },
  { id: "cuidate", n: "Cuídate", e: "🫶", c: "menta", frase: "te pide que te cuides", mia: "Le pediste que se cuide" },
  { id: "propio", n: "Escribir", e: "💌", c: "durazno", frase: "te mandó un mensajito", mia: "Le mandaste un mensajito" },
];
export const toque = (id) => TOQUES.find((t) => t.id === id) || TOQUES[3];
const sonido = (id) => "toque-" + (toque(id).id);

/** Mandarlo (suena aquí también, para que sientas que salió). */
export async function mandar(app, tipo, texto = "") {
  const t = await SRV.mandarToque(tipo, texto);
  app.sonidos?.sonar(sonido(tipo));
  vibrar(12);
  return t;
}

/* ── Cuando llegan: una tarjetita arriba, una tras otra (sin amontonarse) ── */
let cola = [], mostrando = false, vistoHasta = 0;
const yaVistos = new Set();

/** El último mensajito rápido que ya llegó a este aparato (el chat lo manda para recibir sólo los nuevos). */
export const ultimoToque = () => vistoHasta;

export function llegaron(app, lista = []) {
  const nuevos = lista.filter((x) => !x.mio && !yaVistos.has(x.id));
  if (!nuevos.length) return;
  for (const x of nuevos) { yaVistos.add(x.id); vistoHasta = Math.max(vistoHasta, x.id); }
  // Se marcan vistos en cuanto llegan (en este aparato ya se van a ver).
  SRV.toquesVistos(vistoHasta).catch(() => {});
  cola.push(...nuevos.slice(-3));
  dispatchEvent(new CustomEvent("ed-toques"));
  if (!mostrando) siguiente(app);
}

function siguiente(app) {
  const x = cola.shift();
  if (!x) { mostrando = false; return; }
  mostrando = true;
  const T = toque(x.tipo), nombre = PF.nombreDe(PF.datos().pareja) || "Tu amorcito";
  app.sonidos?.sonar(sonido(x.tipo));
  vibrar(20);
  const chispas = reducido() || document.body.classList.contains("ed-ultra") ? [] : Array.from({ length: 6 }, (_, i) => el("i.tq-chispa", { text: T.e, style: { "--i": i } }));
  const n = el("button.tq-llega." + T.c, { type: "button", role: "status", "aria-live": "polite", "aria-label": `${nombre} ${T.frase}${x.texto ? ": " + x.texto : ""}. Abrir el mapa` }, [
    el("span.tq-emoji", { text: T.e, "aria-hidden": "true" }),
    el("span.tq-t", {}, [el("b", { text: `${nombre} ${T.frase}` }), x.texto ? el("span.tq-txt", { text: x.texto }) : null, el("small", { text: "Toca para verlo en el mapa" })]),
    ...chispas,
  ]);
  let fuera = false;
  const quitar = () => {
    if (fuera) return;
    fuera = true;
    clearTimeout(t);
    n.classList.add("sale");
    setTimeout(() => { n.remove(); siguiente(app); }, reducido() ? 0 : 260);
  };
  n.addEventListener("click", () => { quitar(); if (SRV.conectado()) app.juntitos?.abrir("mapa"); });
  document.body.append(n);
  const t = setTimeout(quitar, x.texto ? 6500 : 4600);
}

/** Lo último de los dos (para la sección del mapa). */
export const historial = () => SRV.toques();

/** Quién llegó o salió de sus lugares (con la app abierta; con ella cerrada avisa la notificación). */
const CLAVE_EV = () => `editordev:lugares-visto:${SRV.usuario()?.usuario || ""}`;
export function ultimoEvento() { try { const v = localStorage.getItem(CLAVE_EV()); return v == null ? null : +v; } catch (e) { return null; } }
export function lugares(app, r) {
  if (r.ev_ultimo == null) return;
  const antes = ultimoEvento();
  try { localStorage.setItem(CLAVE_EV(), String(r.ev_ultimo)); } catch (e) { /* nada */ }
  if (antes == null) return;   // la primera vez sólo se aprende dónde va (no se avisa lo viejito)
  const nombre = PF.nombreDe(PF.datos().pareja) || "Tu amorcito";
  for (const e of (r.lugares || []).slice(-2)) {
    const llega = e.tipo === "entro";
    app.sonidos?.sonar(llega ? "lugar-llega" : "lugar-sale");
    aviso(`📍 ${e.mio ? (llega ? "Llegaste a" : "Saliste de") : `${nombre} ${llega ? "llegó a" : "salió de"}`} «${e.lugar}»`, 6000, "", { t: "Ver mapa", al: () => app.juntitos?.abrir("mapa") });
  }
  if (r.lugares?.length) dispatchEvent(new CustomEvent("ed-lugares"));
}
