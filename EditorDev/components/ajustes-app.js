/**
 * CONFIGURACIÓN DE LA APP (Fase 46) — el apartado del menú principal.
 *
 * Lo que más se usa, bonito y en grupitos: Rendimiento (Normal o Ultra Rendimiento), Sonidos,
 * Animaciones, Apariencia, Abejita, Idioma y Notificaciones. Todo es lo MISMO que ya usa la app
 * (config/preferencias.js, los sonidos, la música y las notificaciones): aquí no hay ajustes de
 * mentira; lo más fino del editor sigue en «Ajustes avanzados» (la ventana de Configuración).
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { PREF, poner, alCambiar, VERSION } from "../config/preferencias.js";
import * as SRV from "../integraciones/servidor.js";
import * as PUSH from "../integraciones/avisos.js";
import { donde } from "../integraciones/plataforma.js";

/** Un interruptor (role=switch): `leer()` dice si está prendido; `escribir(on)` lo cambia. */
function interruptor(etq, leer, escribir) {
  const b = el("button.mp-aj-sw", { type: "button", role: "switch", "aria-label": etq }, [el("i")]);
  const pintar = () => b.setAttribute("aria-checked", String(!!leer()));
  b.addEventListener("click", () => { const r = escribir(!leer()); if (r?.then) r.then(pintar, pintar); else pintar(); });
  pintar();
  b._pintar = pintar;
  return b;
}

/** Botoncitos de «uno de varios» (como pastillas). */
function segmentos(etq, opciones, leer, escribir) {
  const g = el("div.mp-aj-seg", { role: "radiogroup", "aria-label": etq });
  const pintar = () => { for (const b of g.children) { const on = String(leer()) === b.dataset.v; b.setAttribute("aria-checked", String(on)); b.classList.toggle("on", on); } };
  for (const [v, t] of opciones) g.append(el("button", { type: "button", role: "radio", dataset: { v: String(v) }, text: t, onClick: () => { escribir(v); pintar(); } }));
  pintar();
  g._pintar = pintar;
  return g;
}

const fila = (titulo, desc, control) => el("div.mp-aj-fila", {}, [el("div.mp-aj-t", {}, [el("b", { text: titulo }), desc ? el("small", { text: desc }) : null]), control]);
const grupo = (i, icono, titulo, hijos, clase = "") => el("section.mp-aj-grupo" + clase, { style: { "--i": i } }, [el("h3", {}, [el("i", { html: ico(icono) }), el("span", { text: titulo })]), ...hijos]);

export function vistaAjustes(app, { alVolver }) {
  const SE = app.sonidos, AU = app.audio;
  const vivos = [];
  const con = (n) => { vivos.push(n); return n; };
  const sonar = () => SE?.sonar("seleccionar");

  const modo = con(segmentos("Rendimiento", [["equilibrado", "Normal"], ["ultra", "Ultra Rendimiento"]], () => (PREF.modo === "ultra" ? "ultra" : "equilibrado"),
    (v) => { poner({ modo: v }); sonar(); aviso(v === "ultra" ? "Ultra Rendimiento prendido: todo más ligero y rapidito ⚡" : "Rendimiento normal: con todos sus brillitos ✨", 2600); }));
  const mov = con(segmentos("Animaciones", [["completo", "Completas"], ["reducido", "Suaves"], ["nada", "Sin movimiento"]], () => PREF.movimiento, (v) => { poner({ movimiento: v }); sonar(); }));
  const tema = con(segmentos("Tema", [["auto", "Como el teléfono"], ["claro", "Claro"], ["oscuro", "Oscuro"]], () => PREF.tema, (v) => { poner({ tema: v }); sonar(); }));
  const tam = con(segmentos("Tamaño", [[0.9, "Chico"], [1, "Normal"], [1.12, "Grande"]], () => PREF.escala, (v) => { poner({ escala: v }); sonar(); }));
  const idioma = con(segmentos("Idioma", [["latam", "Latinoamérica"], ["mx", "México"]], () => (PREF.idioma === "mx" ? "mx" : "latam"), (v) => { poner({ idioma: v }); sonar(); }));

  // Notificaciones: lo que de verdad dice este aparato (y se prenden/apagan de verdad).
  const notiEst = el("small", { text: "Revisando…" });
  let prendidas = false;
  const noti = interruptor("Notificaciones", () => prendidas, async (on) => {
    if (!SRV.conectado()) { aviso("Entra a tu cuenta para recibir notificaciones", 3200); return; }
    try { if (on) await PUSH.prender(); else await PUSH.apagar(); prendidas = on; notiEst.textContent = on ? "Prendidas en este aparato" : "Apagadas en este aparato"; sonar(); }
    catch (e) { aviso(e.message || "No se pudieron cambiar las notificaciones", 4200, "error"); }
  });
  PUSH.estado().then((e) => {
    prendidas = !!e.prendidas;
    noti._pintar();
    notiEst.textContent = !e.soportado ? (e.necesitaInstalar ? "En iPhone: agrégala a tu pantalla de inicio y ábrela desde ahí." : "Este navegador no puede recibir notificaciones.") : !SRV.conectado() ? "Entra a tu cuenta para recibirlas." : prendidas ? "Prendidas en este aparato" : e.permiso === "denied" ? "Bloqueadas: permítelas en los ajustes del teléfono." : "Apagadas en este aparato";
    if (!e.soportado) noti.disabled = true;
  }).catch(() => { notiEst.textContent = "No se pudo revisar."; });

  const v = el("div.mp-vista.mp-ajustes", {}, [
    el("div.mp-perfil-cab", { style: { "--i": 0 } }, [el("button.mp-volver", { type: "button", html: `${ico("izquierda")}<span>Volver</span>`, onClick: () => alVolver() }), el("h2", { text: "Configuración" })]),
    el("p.mp-aj-intro", { style: { "--i": 1 }, text: "Cómo se ve, se oye y se siente My Love Pages en este aparato." }),
    grupo(2, "rayo", "Rendimiento", [
      fila("Modo", "Ultra Rendimiento: las animaciones siguen, pero cortitas y sencillas; sin desenfoques ni brillitos. Ideal para teléfonos sencillos.", modo),
    ], ".destacado"),
    grupo(3, "sonido", "Sonidos", [
      fila("Sonidos de la app", "Toques, avisos y mensajitos", con(interruptor("Sonidos de la app", () => SE?.pref.on, (on) => { SE?.ponerPref({ on }); if (on) sonar(); }))),
      fila("Música del editor", "La canción de fondo mientras editas", con(interruptor("Música del editor", () => AU?.pref.on, (on) => AU?.ponerPref({ on })))),
      fila("Vibración", "Al tocar botones (Android)", con(interruptor("Vibración", () => PREF.haptic, (on) => poner({ haptic: on })))),
    ]),
    grupo(4, "animar", "Animaciones", [fila("Movimiento", "Suaves: menos movimiento. Sin movimiento: todo quieto.", mov)]),
    grupo(5, "diseno", "Apariencia", [fila("Tema", "", tema), fila("Tamaño de las letras y botones", "", tam)]),
    grupo(6, "foco", "Abejita y ayudas", [
      fila("Abejita", "Tu compañera en el editor", con(interruptor("Abejita", () => PREF.abeja, (on) => poner({ abeja: on })))),
      fila("Consejos (foquito)", "", con(interruptor("Consejos", () => PREF.ayudas, (on) => poner({ ayudas: on })))),
    ]),
    grupo(7, "texto", "Idioma", [fila("Español de", "", idioma)]),
    grupo(8, "campana", "Notificaciones", [fila("Avisos de tu amorcito", null, noti), notiEst]),
    grupo(9, "tuerca", "Más", [
      el("button.mp-aj-mas", { type: "button", onClick: () => app.config?.abrir() }, [el("i", { html: ico("herramientas") }), el("span", {}, [el("b", { text: "Ajustes avanzados del editor" }), el("small", { text: "Refresco, calidad, estilo del editor y más" })]), el("i.mp-aj-f", { html: ico("derecha") })]),
      el("div.mp-aj-acerca", {}, [
        el("b", { text: `My Love Pages · versión ${VERSION} · beta · ${{ web: "en la web", apk: "app de Android", nativa: "app nativa" }[donde()]}` }),
        el("small", { text: "La hace una sola persona y todavía está en beta: puede haber errores. ¡Gracias por tu paciencia y tu cariño! ♡" }),
      ]),
    ]),
  ]);
  // Si algo cambia desde otro lado (la ventana avanzada, otro aparato), aquí se ve al momento.
  const quitar = alCambiar(() => { if (!v.isConnected) { quitar(); return; } for (const n of vivos) n._pintar?.(); });
  return v;
}
