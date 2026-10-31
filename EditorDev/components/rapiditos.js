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
  { id: "besitos", n: "Besitos", e: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c2.5-3.5 5-5 7-4 1 .5 1.4 1 2 1s1-.5 2-1c2-1 4.5.5 7 4-2.5 3.5-5.5 5.5-9 5.5S5.5 15.5 3 12z" fill="#ff6f9c"/><path d="M3.5 12c3 1 5.8 1.4 8.5 1.4s5.5-.4 8.5-1.4" stroke="#c2336b" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>', c: "rosa", frase: "te mandó besitos", mia: "Le mandaste besitos" },
  { id: "teamo", n: "Te amo", e: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.9-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 16.1 12 21 12 21z" fill="#ff7fae"/><path d="M8 9.5a2.4 2.4 0 0 1 2.2-1.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>', c: "lila", frase: "te dijo «te amo»", mia: "Le dijiste «te amo»" },
  { id: "cuidate", n: "Cuídate", e: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" fill="#7fd1ae"/><path d="M12 16.5s-3.6-2.2-3.6-4.8a1.8 1.8 0 0 1 3.6-.6 1.8 1.8 0 0 1 3.6.6c0 2.6-3.6 4.8-3.6 4.8z" fill="#fff"/></svg>', c: "menta", frase: "te pide que te cuides", mia: "Le pediste que se cuide" },
  { id: "propio", n: "Escribir", e: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13.5" rx="2.5" fill="#ffc09a"/><path d="M3.5 7.5l8.5 6 8.5-6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M12 17.2s-2.4-1.5-2.4-3.2a1.2 1.2 0 0 1 2.4-.4 1.2 1.2 0 0 1 2.4.4c0 1.7-2.4 3.2-2.4 3.2z" fill="#e5679a"/></svg>', c: "durazno", frase: "te mandó un mensajito", mia: "Le mandaste un mensajito" },
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

/* ── Cuando llegan: una animación en pantalla, una tras otra (sin amontonarse) ── */
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

/** (Fase 57) Ya no sale una tarjetita para tocar: sólo una animación linda en toda la pantalla con lo que te
 *  mandó (corazones que suben con «Te amo», besitos que flotan, estrellitas con «Cuídate» y un sobrecito que se
 *  abre con su mensaje). No se puede tocar ni tapa nada: se va sola. Si están en su casita, su monito también
 *  te lo dice. */
function siguiente(app) {
  const x = cola.shift();
  if (!x) { mostrando = false; return; }
  mostrando = true;
  const T = toque(x.tipo), nombre = PF.nombreDe(PF.datos().pareja) || "Tu amorcito";
  app.sonidos?.sonar(sonido(x.tipo));
  vibrar(T.id === "teamo" ? 40 : 20);
  const poco = reducido() || document.body.classList.contains("ed-ultra");
  const n = el("div.tq-show." + T.c + ".k-" + T.id, { role: "status", "aria-live": "polite", "aria-label": `${nombre} ${T.frase}${x.texto ? ": " + x.texto : ""}` }, [
    el("i.tq-show-luz"),
    el("div.tq-show-centro", {}, [
      el("i.tq-show-ico", { html: T.e }),
      el("b.tq-show-t", { text: `${nombre} ${T.frase}` }),
      x.texto ? el("p.tq-show-txt", { text: x.texto }) : null,
    ]),
    ...(poco ? [] : Array.from({ length: 16 }, (_, i) => el("i.tq-show-p", { html: T.e, style: {
      "--x": (4 + Math.random() * 92).toFixed(1) + "vw", "--d": (i * 0.11 + Math.random() * 0.3).toFixed(2) + "s",
      "--s": (0.6 + Math.random() * 0.9).toFixed(2), "--r": (Math.random() * 60 - 30).toFixed(0) + "deg", "--v": (2.2 + Math.random() * 1.6).toFixed(2) + "s",
    } }))),
  ]);
  document.body.append(n);
  dispatchEvent(new CustomEvent("ed-toque-llega", { detail: { tipo: T.id, texto: x.texto || "" } }));
  const dura = x.texto ? Math.min(7800, 4200 + x.texto.length * 45) : 3300;
  setTimeout(() => { n.classList.add("sale"); setTimeout(() => { n.remove(); siguiente(app); }, reducido() ? 0 : 520); }, dura);
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
    aviso(`${e.mio ? (llega ? "Llegaste a" : "Saliste de") : `${nombre} ${llega ? "llegó a" : "salió de"}`} «${e.lugar}»`, 6000, "", { t: "Ver mapa", al: () => app.juntitos?.abrir("mapa") });
  }
  if (r.lugares?.length) dispatchEvent(new CustomEvent("ed-lugares"));
}
