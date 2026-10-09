/**
 * ⚙ CONFIGURACIÓN DEL EDITOR — rendimiento, animaciones, audio, abejita,
 * interacción, interfaz y otros. Cambia cómo se comporta el editor, nunca
 * el librito. Todo se guarda en este aparato al momento.
 */
import { el, seccion, fila, boton, control, Vinculos, modal, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import { PREF, poner, restaurar, VERSION, alCambiar } from "../config/preferencias.js";
import { HZ, objetivo, medirHz, medirFps, mostrarFps, LARGAS } from "../config/cuadros.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const HZS = ["30", "60", "90", "120", "144"];

export class Configuracion {
  constructor(app) {
    this.app = app;
    mostrarFps(PREF.fps);
    alCambiar((p, c) => { if ("fps" in c) mostrarFps(p.fps); });
  }

  abrir() {
    const app = this.app, AU = app.audio, SE = app.sonidos;
    const v = new Vinculos();
    const p = (k, op) => control(v, { ...op, leer: () => PREF[k], escribir: (x) => { poner({ [k]: x }); v.refrescar(); } });
    const quitar = alCambiar(() => v.refrescar());
    // Los Hz que de verdad da esta pantalla: los de más arriba no se ofrecen.
    const hz = control(v, {
      tipo: "segmento",
      opciones: [["auto", `Auto (${HZ.real})`], ...HZS.filter((h) => +h <= HZ.real + 2).map((h) => [h, h])],
      leer: () => PREF.hz, escribir: (x) => poner({ hz: x }),
    });
    const notaHz = el("small.ed-ayuda");
    v.add(() => { notaHz.textContent = `Tu pantalla da ${HZ.real} Hz${HZS.some((h) => +h > HZ.real + 2) ? ` (por eso no aparecen ${HZS.filter((h) => +h > HZ.real + 2).join(", ")})` : ""}. Ahora el editor va a ${objetivo()} Hz. Bajar ahorra batería y calor.`; });
    const estilos = el("div.ed-config-estilos", {}, [["cuaderno", "Cuaderno", "crayón, papel y stickers"], ["retromylove", "RetroMyLove", "píxeles, papel viejo y grano vivo"]].map(([k, t, d]) => {
      const b = el("button.ed-config-estilo." + k, { type: "button", onClick: () => { poner({ estilo: k }); app.sonidos?.sonar("seleccionar"); } }, [el("i"), el("b", { text: t }), el("small", { text: d })]);
      v.add(() => b.classList.toggle("on", PREF.estilo === k));
      return b;
    }));
    const cuerpo = el("div.ed-config", {}, [
      el("b.ed-sub", { text: "Estilo del editor" }), estilos,
      el("div.ed-config-modos", {}, [["rendimiento", "rapido", "Rendimiento", "fluido y fresquito"], ["equilibrado", "ajustar", "Equilibrado", "lo mejor de los dos"], ["calidad", "estrella", "Calidad", "todo bonito"]].map(([m, i, t, d]) => {
        const b = el("button.ed-config-modo", { type: "button", onClick: () => { poner({ modo: m }); app.sonidos?.sonar("seleccionar"); } }, [el("b", { html: ico(i) }), el("span", { text: t }), el("small", { text: d })]);
        v.add(() => b.classList.toggle("on", PREF.modo === m));
        return b;
      })),
      seccion("Rendimiento", [
        fila("Refresco", hz), notaHz,
        fila("Calidad", p("calidad", { tipo: "segmento", opciones: [["baja", "Baja"], ["media", "Media"], ["alta", "Alta"]] }), "baja: sin sombras ni desenfoques de la interfaz"),
        fila("Partículas", p("particulas", { tipo: "toggle" }), "brillitos, fondos animados y chispas mientras editas"),
        fila("Efectos en la hoja", p("efectos", { tipo: "toggle" }), "apagados, los filtros sólo se ven al probar (más ligero)"),
        fila("Mostrar FPS", p("fps", { tipo: "toggle" })),
        boton(I("info", "Diagnóstico de rendimiento"), () => this.diagnostico(), "chico"),
      ]),
      seccion("Animaciones", [
        fila("Movimiento", p("movimiento", { tipo: "segmento", opciones: [["completo", "Completo"], ["reducido", "Reducido"], ["nada", "Sin movimiento"]] })),
        fila("Intensidad", p("intensidad", { tipo: "rango", min: 0.3, max: 1.5, paso: 0.1 }), "cuánto se mueven la abejita y las animaciones de la interfaz"),
      ], { abierta: false }),
      seccion("Audio", [
        fila("Música (MusicaDev.mp3)", control(v, { tipo: "toggle", leer: () => AU?.pref.on, escribir: (on) => AU?.ponerPref({ on }) })),
        fila("Volumen de la música", control(v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => AU?.pref.vol ?? 0.45, escribir: (vol) => AU?.ponerPref({ vol }) })),
        fila("Sonidos del editor", control(v, { tipo: "toggle", leer: () => SE?.pref.on, escribir: (on) => SE?.ponerPref({ on }) })),
        fila("Volumen de efectos", control(v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => SE?.pref.vol ?? 0.35, escribir: (vol) => SE?.ponerPref({ vol }) })),
        fila("Voz de la abejita", p("abejaSonido", { tipo: "toggle" })),
      ], { abierta: false }),
      seccion("Abejita", [
        fila("Abejita", p("abeja", { tipo: "toggle" }), "apagada, el foquito sólo da consejos"),
        fila("Charlitas (dialogos.txt)", p("dialogos", { tipo: "toggle" })),
        fila("Cada cuánto habla", p("frecuencia", { tipo: "segmento", opciones: [[30, "30 s"], [75, "1 min"], [180, "3 min"], [420, "7 min"]] })),
        el("div.ed-botonera", {}, [
          boton(I("foco", "Que diga algo"), () => { this.m?.cerrar(null); app.ayuda?.decirAlgo(); }, "chico"),
          boton(I("varita", "Probar el evento especial"), () => { this.m?.cerrar(null); app.ayuda?.hackeo(); }, "chico"),
        ]),
        el("small.ed-ayuda", { text: "Sus frases están en dialogos.txt (en la carpeta principal): una por línea; las que empiezan con «-» son el evento especial." }),
      ], { abierta: false }),
      seccion("Interacción", [
        fila("Vibración", p("haptic", { tipo: "toggle" }), "al tocar botones (Android; el iPhone no la permite en la web)"),
        fila("Fuerza", p("hapticFuerza", { tipo: "rango", min: 0.5, max: 3, paso: 0.5 })),
        fila("Ayudas (foquito)", p("ayudas", { tipo: "toggle" })),
        fila("Etiquetas al pasar el ratón", p("tooltips", { tipo: "toggle" })),
        fila("Consejos automáticos", p("consejos", { tipo: "toggle" }), "muy de vez en cuando, discretos"),
      ], { abierta: false }),
      seccion("Interfaz", [
        fila("Estilo", p("estilo", { tipo: "segmento", opciones: [["cuaderno", "Cuaderno"], ["retromylove", "RetroMyLove"]] }), "RetroMyLove: retro de los 90, píxeles, papel y grano vivo"),
        fila("Grano animado", p("grano", { tipo: "toggle" }), "sólo en RetroMyLove"),
        fila("Parpadeo analógico", p("parpadeo", { tipo: "toggle" }), "sutil, como un monitor viejo (sólo RetroMyLove)"),
        fila("Tema", p("tema", { tipo: "segmento", opciones: [["auto", "Como el teléfono"], ["claro", "Claro"], ["oscuro", "Oscuro"]] })),
        fila("Tamaño de la interfaz", p("escala", { tipo: "segmento", opciones: [[0.9, "Chica"], [1, "Normal"], [1.12, "Grande"]] })),
        fila("Transparencias", p("transparencias", { tipo: "toggle" })),
      ], { abierta: false }),
      seccion("Otros", [
        el("div.ed-botonera", {}, [
          boton(I("refrescar", "Restaurar configuración"), async () => { if (await confirmar("Toda la configuración del editor vuelve a como venía. Tu librito no cambia.", "Restaurar", "primario")) { restaurar(); aviso("Configuración restaurada"); } }, "chico"),
          boton(I("limpiar", "Limpiar datos temporales"), () => this.limpiar(), "chico"),
        ]),
        el("div.ed-config-info", {}, [
          el("b", { text: `Crear librito · versión ${VERSION}` }),
          el("small", { text: "Hecho con amor por YonathanPG. Tu librito se guarda en este aparato; expórtalo (.zip) para tener una copia." }),
        ]),
      ], { abierta: false }),
    ]);
    v.refrescar();
    this.m = { cerrar: () => {} };
    const pr = modal({ titulo: "Configuración", contenido: cuerpo, ancho: 560, clase: "ed-modal-config", acciones: [["Listo", true, "primario"]] });
    this.m = modal.ultima;
    pr.then(() => quitar());
    if (!HZ.medido) medirHz().then(() => v.refrescar());
  }

  async diagnostico() {
    const ocupado = el("p.ed-ayuda", { text: "Midiendo…" });
    modal({ titulo: "Diagnóstico", contenido: ocupado, ancho: 460, acciones: [["Cerrar", null]] });
    if (!HZ.medido) await medirHz();
    const fps = await medirFps(1500);
    const P = this.app.estado.proyecto;
    const els = P.orden.reduce((n, pid) => n + (P.paginas[pid]?.els.length || 0), 0);
    const marcos = document.querySelectorAll("iframe").length;
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB" : "—";
    let disco = "—";
    try { const e = await navigator.storage?.estimate(); if (e) disco = `${Math.round(e.usage / 1048576)} MB de ${Math.round(e.quota / 1048576)} MB`; } catch (e) { /* nada */ }
    const datos = [
      ["Pantalla", `${HZ.real} Hz · editor a ${objetivo()} Hz`], ["Cuadros por segundo", `${fps} fps`],
      ["Tirones (tareas largas)", LARGAS.n ? `${LARGAS.n} (${Math.round(LARGAS.ms)} ms)` : "ninguno"],
      ["Páginas · elementos", `${P.orden.length} · ${els}`], ["Marcos HTML activos", String(marcos)],
      ["Memoria del editor", mem], ["Guardado en el aparato", disco],
      ["Procesador · memoria", `${navigator.hardwareConcurrency || "?"} núcleos · ${navigator.deviceMemory ? navigator.deviceMemory + " GB" : "?"}`],
      ["Densidad de pantalla", `×${Math.round(devicePixelRatio * 100) / 100}`],
    ];
    const consejos = [];
    if (fps < objetivo() * 0.8) consejos.push("Va un poco lento: prueba el modo Rendimiento.");
    if (marcos > 8) consejos.push("Hay muchos bloques HTML vivos: apagar «Partículas» ayuda.");
    if (LARGAS.n > 20) consejos.push("Hubo varios tirones: cierra otras pestañas o baja la calidad.");
    if (!consejos.length) consejos.push("Todo va fluido 🐝✨");
    ocupado.replaceWith(el("div.ed-diag", {}, [
      el("dl", {}, datos.flatMap(([a, b]) => [el("dt", { text: a }), el("dd", { text: b })])),
      ...consejos.map((c) => el("p.ed-nota", { text: c })),
    ]));
  }

  async limpiar() {
    const app = this.app;
    app.audio?.ondas?.clear?.();
    app.audio?.buffers?.clear?.();
    for (const k of ["editordev:ayuda-vista", "editordev:mis-busquedas"]) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
    try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch (e) { /* nada */ }
    aviso("Listo: se limpiaron los datos temporales (tus libritos siguen intactos)");
  }
}
