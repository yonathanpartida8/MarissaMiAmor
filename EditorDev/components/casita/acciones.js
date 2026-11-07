/**
 * QUÉ PASA AL TOCAR CADA COSA. Cada objeto del catálogo dice su `al` y aquí está lo que hace.
 * `j` es el juego (index.js): caminar hasta algo, sentarse, dar algo en la mano, partículas, sonidos,
 * cambiar el estado del objeto (que se guarda y lo ve tu amorcito)…
 * Para agregar una interacción nueva: una función aquí y su nombre en el `al` del objeto.
 */
import * as P from "./paneles.js";
import { tocarMesa } from "./mesa.js";

const azar = (xs) => xs[Math.floor(Math.random() * xs.length)];
// (Un poquito de «rebote» en el objeto que tocaste.)
export function rebote(n, clase = "toque") { if (!n) return; n.classList.remove(clase); void n.offsetWidth; n.classList.add(clase); }
const alternar = (j, o, k, si, no) => { const on = !o.e?.[k]; j.estado(o, { [k]: on }); j.sonar(on ? si : no); return on; };

/** (Fase 73) ¿Ya se está cocinando algo ahí (o ya está listo)? Entonces tocarla es cuidarlo o tomarlo. */
const ocupada = async (j, o) => { const r = j.objs.get(o.id); return !!(r && (r.o.e?.coc || r.o.e?.listo) && (await j.cocina.tocar(r))); };
export const ACCIONES = {
  luz(j, o) { j.cuartoLuz(o.c); j.sonar("interruptor"); },
  /** (Fase 71) Un foco del techo: se apaga o se prende solito (con el apagador del cuarto se apagan todos). */
  foco(j, o, n) { alternar(j, o, "apagado", "interruptor", "interruptor"); rebote(n, "columpia"); },
  tele(j, o) {
    const canal = ((o.e?.canal | 0) + 1) % 4;
    j.estado(o, { canal });
    j.sonar(canal ? "tele" : "interruptor");
    if (canal) j.particulas("estrella", o, 0, -110, 3);
  },
  async refri(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1800); j.sonar("refri");
    setTimeout(() => j.dar(azar(["manzana", "helado", "sandia", "galleta", "uvas", "platano", "leche_fresa", "leche_platano", "leche_choco", "leche", "dona", "cuernito"]), o), 450);
  },
  // La cocina: se elige qué cocinar y se sirve en una mesa (mesa.js).
  // (Fase 73) Si ya hay algo cocinándose (o listo) ahí, tocarlo es ir a cuidarlo (o a tomarlo).
  async estufa(j, o) { if (await ocupada(j, o)) return; P.recetas(j, o, ["sarten", "olla", "horno"]); },
  async parrilla(j, o) { if (await ocupada(j, o)) return; P.recetas(j, o, "parrilla"); },
  micro(j, o) { j.cocinar(o, "palomitas"); },
  licuadora(j, o) { j.cocinar(o, "licuado"); },
  mesa(j, o, n) { return tocarMesa(j, o, n); },
  async frutero(j, o) {
    if (!(await j.irJunto(o))) return;
    j.sonar("fruta"); j.dar(azar(["manzana", "platano", "uvas"]), o);
  },
  async basura(j, o, n) {
    if (!j.yo.lleva) { rebote(n); j.sonar("tapa"); j.decir("Está limpiecito", false); return; }
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 900); j.sonar("tapa"); j.soltar(true); setTimeout(() => j.sonar("tirar"), 180);
  },
  async agua(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "corre", 1700); j.sonar("agua");
    j.particulas("burbuja", o, 0, -90, 4);
    // (Fase 58) Un vasito de agua: quita la sed.
    setTimeout(() => { if (!j.vivo) return; j.sonar("bebida"); j.necesidades?.bebio("agua"); j._globo(j.yo, "¡Qué rica agüita!", 1600); }, 1200);
  },
  async cafe(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "on", 1400); j.sonar("cafe");
    setTimeout(() => j.dar("cafe", o), 1200);
  },
  async tostador(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "salta", 900); j.sonar("tostador");
    setTimeout(() => j.dar("tostada", o), 650);
  },
  async libro(j, o) {
    if (!(await j.irJunto(o))) return;
    j.sonar("libro"); j.dar("libro", o);
  },
  // El buzón: si tu amorcito te dejó una cartita, se abre y la lees; si no, te deja un recadito.
  async buzon(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1500); j.sonar("buzon");
    const nueva = j.mensajes.cartaNueva();
    if (nueva) { setTimeout(() => j.sonar("campanita"), 260); setTimeout(() => { if (!j.vivo) return; j.mensajes.carta(nueva); j.dar("carta", o); }, 600); return; }
    j.decir(azar([`${j.pareja} te ama muchísimo`, "Hoy es un buen día para un abrazo", "Eres mi lugar favorito", "Te toca darle un besito", "Juntos todo es más bonito", "Alguien piensa en ti ahorita mismo", "Eres lo mejor que me pasó"]), false);
    setTimeout(() => j.dar("carta", o), 700);
  },
  async vestir(j, o) {
    j.mientras(o, "abierto", 1600); j.sonar("ropero");
    j.vestidor();
  },
  laptop(j, o) { alternar(j, o, "on", "laptop", "interruptor"); },
  fuego(j, o) { if (alternar(j, o, "on", "fuego", "poof")) j.particulas("chispa", o, 0, -60, 4); },
  musica(j, o) { if (alternar(j, o, "on", "interruptor", "interruptor")) { j.particulas("nota", o, 0, -o.def.h, 4); j.emote("baila"); } },
  pecera(j, o, n) { rebote(n, "susto"); j.sonar("pez"); j.particulas("burbuja", o, 0, -110, 5); },
  cortinas(j, o) { j.estado(o, { cerrada: !o.e?.cerrada }); j.sonar("cortina"); },
  // El reloj cambia la hora del día en la casita: día, tarde, noche o la de verdad (lo ven los dos).
  reloj(j, o, n) { rebote(n); j.sonar("tic"); j.cambiarHora(); },
  recoger(j, o) { return j.recoger(o); },
  async galletas(j, o, n) { if (!(await j.irJunto(o))) return; rebote(n); j.sonar("frasco"); j.dar("galleta", o); },
  async trampolin(j, o, n) {
    if (!(await j.irJunto(o))) return;
    j.trampolin(o, n);
  },
  async florecer(j, o, n) {
    const etapa = o.e?.etapa | 0;
    if (etapa < 2) { j.estado(o, { etapa: etapa + 1 }); j.sonar("crecer"); j.particulas("chispa", o, 0, -50, 5); rebote(n, "crece"); return; }
    if (!(await j.irJunto(o))) return;
    j.sonar("crecer"); j.dar("flor", o);
  },
  fuente(j, o) { j.sonar("agua", { volumen: 0.7 }); j.particulas("agua", o, 0, -120, 6); },
  // (Fase 63) La puerta de la casa es una puerta de verdad: tu monito va, la abre y entra a donde lleva.
  puerta(j, o) { j.puertasN.tocar("o:" + o.id); },
  sacude(j, o, n) { rebote(n, "baila"); j.sonar("hojas"); j.particulas("hoja", o, 0, -o.def.h * 0.7, 3); if (o.def.hojas) j.suciedad?.sacudir(o.gx, o.y, o.def.h * 0.7, o.def.hojas, 4); },
  // (Fase 64) Agarrar una herramienta de limpieza (tu monito la trae en la mano y te dice cómo se usa).
  async herramienta(j, o, n) {
    const h = o.def.herramienta, ayuda = { escoba: "Toca donde quieras barrer", rastrillo: "Toca donde quieras juntar las hojitas", trapeador: "Toca el piso para trapear", aspiradora: "Toca el piso para aspirar", plumero: "Toca un mueble para sacudirle el polvito", regadera: "Toca una planta para regarla" }[h] || "";
    if (j.yo.lleva === h) { rebote(n); j._globo(j.yo, ayuda, 2600); return; }
    if (!(await j.irJunto(o))) return;
    if (j.yo.lleva) j.soltar();
    // (Fase 65) La escoba y el rastrillo son una sola cosa: al agarrarlos dejan de estar donde estaban.
    if (o.def.larga && j.objs.has(o.id)) { j.sync.op({ o: "quita", id: o.id }); j._pintarCasa(j.sync.casa()); }
    rebote(n); j.sonar("levantar"); j._ponerLleva(j.yo, h); j._mandarYo({ lleva: h });
    j._globo(j.yo, ayuda, 3200);
  },
  async frutal(j, o, n) {
    if (!(await j.irJunto(o))) return;
    rebote(n, "baila"); j.sonar("hojas"); j.suciedad?.sacudir(o.gx, o.y, o.def.h * 0.7, o.def.hojas, 4);
    setTimeout(() => j.vivo && j.dar(o.def.fruta || "manzana", o), 380);
  },
  burbujas(j, o, n) { rebote(n, "baila"); j.sonar("burbujas"); j.particulas("burbuja", o, 0, -50, 6); },
  boing(j, o, n) { rebote(n, "salta"); j.sonar("boing"); },
  cuac(j, o, n) { rebote(n, "salta"); j.sonar("cuac"); j.particulas("burbuja", o, 0, -40, 3); },
  chillido(j, o, n) { rebote(n, "salta"); j.sonar("chillido"); j.particulas("corazon", o, 0, -70, 3); },
  miau(j, o, n) { rebote(n, "salta"); j.sonar("miau"); j.particulas("corazon", o, 0, -60, 4); },
  guau(j, o, n) { rebote(n, "salta"); j.sonar("guau"); j.particulas("corazon", o, 0, -70, 4); },
  pio(j, o, n) { rebote(n, "salta"); j.sonar("pio"); j.particulas("nota", o, 0, -o.def.h * 0.7, 3); },
  tortuga(j, o) { j.mientras(o, "esconde", 1600); j.sonar("pop", { volumen: 0.6 }); setTimeout(() => j.particulas("corazon", o, 0, -40, 2), 1400); },
  async inodoro(j, o) {
    if (!(await j.usarLugar(o, 0))) return;
    await j.esperar(2200);
    if (!j.sigueEn(o)) return;
    j.sonar("descarga"); j.particulas("burbuja", o, 0, -60, 4);
  },
  // (Fase 54) El estudio.
  async piano(j, o) { if (!(await j.irJunto(o))) return; j._mirar(j.yo, o.gx - j.yo.gx); P.piano(j, o); },
  guitarra(j, o, n) { rebote(n, "baila"); j.sonar("guitarra"); j.particulas("nota", o, 0, -o.def.h * 0.8, 4); j._mandarYo({ ev: { k: "toca", t: "guitarra" } }); },
  consola(j, o) { if (alternar(j, o, "on", "consola", "clic")) j.particulas("estrella", o, 0, -100, 3); },
  pintar(j, o, n) { j.estado(o, { etapa: ((o.e?.etapa | 0) + 1) % 4 }); j.sonar("pincel"); rebote(n, "toque"); j.particulas("chispa", o, 0, -o.def.h * 0.6, 4); },
  async telescopio(j, o) {
    if (!(await j.irJunto(o))) return;
    j.sonar("telescopio");
    const noche = j.esNoche();
    if (noche) { j.particulas("estrella", { gx: o.gx + 40, y: o.y - 200 }, 0, 0, 5); j.decir("¡Una estrella fugaz! Pide un deseo", false); }
    else j.decir("De día sólo se ven nubes… vuelvan de noche", false);
  },
  gira(j, o, n) { rebote(n, "gira"); j.sonar("whoosh"); },
  neon(j, o) { const ap = !o.e?.apagado; j.estado(o, { apagado: ap }); j.sonar(ap ? "interruptor" : "neon"); },
  karaoke(j, o, n) { rebote(n, "baila"); j.probarMusica("musica-fiesta", 4200); j.emote("baila"); j.particulas("nota", o, 0, -120, 5); j.decir("¡A cantar!", false); },
  // El baño y la recámara.
  async ducha(j, o) {
    if (!(await j.usarLugar(o, 0))) return;
    j.sonar("regadera"); j.particulas("burbuja", { gx: j.yo.gx, y: j.yo.y - 80 }, 0, 0, 4);
  },
  async lavadora(j, o) { if (!(await j.irJunto(o))) return; j.mientras(o, "lava", 3200); j.sonar("lavadora"); j.particulas("burbuja", o, 0, -70, 4); },
  lava(j, o) { alternar(j, o, "on", "interruptor", "interruptor"); },
  // (Fase 69) El organizador: al tocarlo se abren (o se cierran) sus puertitas; abierto, sale su hojita para sacar u ordenar.
  guarda(j, o) {
    const ab = !o.e?.abierto;
    j.estado(o, { abierto: ab });
    j.sonar(ab ? "abrir" : "cerrar");
    if (ab) setTimeout(() => j.vivo && j.panelGuarda(o.id), 380); else j.cerrarPanelGuarda();
  },
  async baul(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1500); j.sonar("baul");
    setTimeout(() => j.dar(azar(["pelotita", "osito", "estrellita"]), o), 500);
  },
  // La terraza.
  async alberca(j, o) {
    if (!(await j.usarLugar(o))) return;
    j.sonar("alberca"); j.particulas("agua", { gx: j.yo.gx, y: j.yo.y - 30 }, 0, 0, 6);
  },
  async regar(j, o, n) {
    rebote(n, "baila"); j.sonar("regar"); j.particulas("agua", o, 18, -30, 5);
    // Las flores de junto crecen.
    for (const r of j.objs.values()) if (r.d.al === "florecer" && r.o.c === o.c && Math.abs(r.gx - o.gx) < 170 && (r.o.e?.etapa | 0) < 2) { j.estado({ id: r.o.id }, { etapa: (r.o.e?.etapa | 0) + 1 }); rebote(r.n, "crece"); }
  },
  async hielera(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1300); j.sonar("hielera");
    setTimeout(() => j.dar(azar(["paleta", "limonada", "helado", "sandia", "refresco", "leche_fresa"]), o), 450);
  },
  async fogata(j, o) {
    if (!o.e?.on) { j.estado(o, { on: true }); j.sonar("fuego"); j.particulas("chispa", o, 0, -60, 5); return; }
    if (!(await j.irJunto(o))) return;
    j.sonar("fuego"); j.dar("malvavisco", o);
  },
  bici(j, o, n) { rebote(n, "salta"); j.sonar("bici"); },
  cactus(j, o, n) { rebote(n, "susto"); j.sonar("auch"); j.decir("¡Auch! Pica tantito", false); },
};

/** Las caritas y gestos de tu monito (al tocarlo) y lo que pueden hacer juntos (al tocar al de tu amorcito). */
export const GESTOS = [
  ["saluda", "Saludar", "saludo", 1300], ["baila", "Bailar", "risa", 3200], ["brinca", "Brincar", "brinco", 900],
  ["besito", "Besito", "beso", 1300], ["volado", "Beso volado", "beso", 1600], ["corazon", "Corazón", "regalito", 1900],
  ["aplaude", "Aplaudir", "aplauso", 1500], ["rie", "Reír", "risa", 1600], ["guino", "Guiñar", "pop", 1100],
  ["sorpresa", "¡Sorpresa!", "boing", 1300], ["piensa", "Pensar", "tic", 2200], ["estira", "Estirarse", "whoosh", 1700],
  ["triste", "Tristecito", "nop", 2200], ["enojado", "Enojadito", "nop", 1900],
];
export const JUNTOS = [["abrazo", "Abrazar"], ["beso", "Besito"], ["manita", "De la mano"], ["choca", "Chócalas"], ["bailemos", "Bailar juntos"], ["cosquillas", "Cosquillas"], ["selfie", "Selfie"]];
