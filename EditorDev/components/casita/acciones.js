/**
 * QUÉ PASA AL TOCAR CADA COSA. Cada objeto del catálogo dice su `al` y aquí está lo que hace.
 * `j` es el juego (index.js): caminar hasta algo, sentarse, dar algo en la mano, partículas, sonidos,
 * cambiar el estado del objeto (que se guarda y lo ve tu amorcito)…
 * Para agregar una interacción nueva: una función aquí y su nombre en el `al` del objeto.
 */
const azar = (xs) => xs[Math.floor(Math.random() * xs.length)];
// (Un poquito de «rebote» en el objeto que tocaste.)
export function rebote(n, clase = "toque") { if (!n) return; n.classList.remove(clase); void n.offsetWidth; n.classList.add(clase); }

export const ACCIONES = {
  luz(j, o) { j.cuartoLuz(o.c); j.sonar("clic"); },
  tele(j, o) {
    const canal = ((o.e?.canal | 0) + 1) % 4;
    j.estado(o, { canal });
    j.sonar(canal ? "tele" : "clic");
    if (canal) j.particulas("estrella", o, 0, -110, 3);
  },
  async refri(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1800); j.sonar("abrir");
    setTimeout(() => j.dar(azar(["manzana", "helado", "sandia", "galleta"]), o), 450);
  },
  async estufa(j, o) {
    if (!(await j.usarLugar(o, 0))) return;
    j.estado(o, { on: true }); j.sonar("sarten");
    j.particulas("vapor", o, -14, -120, 3);
    await j.esperar(2600);
    j.estado(o, { on: false });
    j.dar("hotcakes", o);
    j.pararse();
  },
  async parrilla(j, o) {
    if (!(await j.usarLugar(o, 0))) return;
    j.estado(o, { on: true }); j.sonar("sarten");
    await j.esperar(2400);
    j.estado(o, { on: false });
    j.dar("elote", o);
    j.pararse();
  },
  async agua(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "corre", 1700); j.sonar("agua");
    j.particulas("burbuja", o, 0, -90, 4);
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
    j.sonar("hoja"); j.dar("libro", o);
  },
  async buzon(j, o) {
    if (!(await j.irJunto(o))) return;
    j.mientras(o, "abierto", 1500); j.sonar("campanita");
    j.decir(azar([`${j.pareja} te ama muchísimo`, "Hoy es un buen día para un abrazo", "Eres mi lugar favorito", "Te toca darle un besito", "Juntos todo es más bonito", "Alguien piensa en ti ahorita mismo", "Eres lo mejor que me pasó"]), false);
    setTimeout(() => j.dar("carta", o), 700);
  },
  async vestir(j, o) {
    j.mientras(o, "abierto", 1600); j.sonar("abrir");
    j.vestidor();
  },
  laptop(j, o) { const on = !o.e?.on; j.estado(o, { on }); j.sonar(on ? "ding" : "clic"); },
  fuego(j, o) { const on = !o.e?.on; j.estado(o, { on }); j.sonar(on ? "fuego" : "poof"); if (on) j.particulas("chispa", o, 0, -60, 4); },
  musica(j, o) { const on = !o.e?.on; j.estado(o, { on }); j.sonar(on ? "ding" : "clic"); if (on) { j.particulas("nota", o, 0, -o.def.h, 4); j.emote("baila"); } },
  pecera(j, o, n) { rebote(n, "susto"); j.sonar("pez"); j.particulas("burbuja", o, 0, -110, 5); },
  cortinas(j, o) { j.estado(o, { cerrada: !o.e?.cerrada }); j.sonar("cortina"); },
  reloj(j, o, n) {
    rebote(n); j.sonar("tic");
    const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
    j.decir(`Son las ${h % 12 || 12}:${m} ${h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche"}`, false);
  },
  async florecer(j, o, n) {
    const etapa = o.e?.etapa | 0;
    if (etapa < 2) { j.estado(o, { etapa: etapa + 1 }); j.sonar("crecer"); j.particulas("chispa", o, 0, -50, 5); rebote(n, "crece"); return; }
    if (!(await j.irJunto(o))) return;
    j.sonar("crecer"); j.dar("flor", o);
  },
  fuente(j, o) { j.sonar("agua", { volumen: 0.7 }); j.particulas("agua", o, 0, -120, 6); },
  async puerta(j, o, n) { rebote(n); j.sonar("puerta"); await j.esperar(250); j.entrarA("sala"); },
  sacude(j, o, n) { rebote(n, "baila"); j.sonar("hoja"); j.particulas("hoja", o, 0, -o.def.h * 0.7, 3); },
  boing(j, o, n) { rebote(n, "salta"); j.sonar("boing"); },
  cuac(j, o, n) { rebote(n, "salta"); j.sonar("cuac"); j.particulas("burbuja", o, 0, -40, 3); },
  chillido(j, o, n) { rebote(n, "salta"); j.sonar("chillido"); j.particulas("corazon", o, 0, -70, 3); },
  miau(j, o, n) { rebote(n, "salta"); j.sonar("miau"); j.particulas("corazon", o, 0, -60, 4); },
  guau(j, o, n) { rebote(n, "salta"); j.sonar("guau"); j.particulas("corazon", o, 0, -70, 4); },
  async inodoro(j, o) {
    if (!(await j.usarLugar(o, 0))) return;
    await j.esperar(2200);
    if (!j.sigueEn(o)) return;
    j.sonar("descarga"); j.particulas("burbuja", o, 0, -60, 4);
  },
};

/** Las caritas y gestos de tu monito (al tocarlo) y lo que pueden hacer juntos (al tocar al de tu amorcito). */
export const GESTOS = [
  ["saluda", "Saludar", "saludo", 1300], ["baila", "Bailar", "risa", 3200], ["brinca", "Brincar", "brinco", 900],
  ["besito", "Besito", "beso", 1300], ["aplaude", "Aplaudir", "aplauso", 1500], ["rie", "Reír", "risa", 1600],
];
export const JUNTOS = [["abrazo", "Abrazar"], ["beso", "Besito"], ["choca", "Chócalas"], ["bailemos", "Bailar juntos"]];
