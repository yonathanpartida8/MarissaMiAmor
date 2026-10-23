/**
 * LO QUE OPINA LA ABEJITA (Fase 43) — mira la página que estás haciendo y comenta algo de verdad sobre ella:
 * el color del fondo, las fotos, lo que dicen los textos (un «te amo», un cumpleaños, un perdón…), si se
 * mueve o está quietecita, la letra, la música. Tiene su personalidad: dramática, golosa de miel, fan de
 * ustedes dos. Nada sale de aquí: todo se decide con lo que hay en la página.
 */
const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || "").trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; };
/** El nombre cariñoso de un color (por su tono). */
function nombreColor(c) {
  const x = hex(c);
  if (!x) return null;
  const [r, g, b] = x.map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l > 0.94) return "blanquito";
  if (l < 0.18) return "oscurito de noche";
  if (d < 0.06) return "grisecito";
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 330) return "rosita";
  if (h < 45) return "durazno";
  if (h < 70) return "amarillito";
  if (h < 160) return "verdecito";
  if (h < 210) return "aguamarina";
  if (h < 255) return "azulito";
  if (h < 290) return "lila";
  return "rosita";
}
const plano = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const una = (l) => l[Math.floor(Math.random() * l.length)];

/** Una opinión sobre la página de ahora (o null si no hay nada que decir). */
export function opinar(app, idioma = "latam") {
  const E = app.estado, p = E.pagina, P = E.proyecto;
  if (!p) return null;
  const mx = idioma === "mx", op = [];
  const els = (p.els || []).filter((e) => !e.oculto && e.tipo !== "musica");
  const textos = els.filter((e) => e.tipo === "texto").map((e) => plano(e.texto?.html).toLowerCase()).join(" ");
  const fondo = p.fondo?.tipo === "gradiente" ? p.fondo?.gradiente?.a : p.fondo?.color;
  const col = !p.fondo?.imagen?.asset && nombreColor(fondo);
  if (col) op.push(una([`Me encanta este fondo ${col}… combina con mis antenitas 🐝`, `Ese ${col} del fondo se ve muy tierno, buena elección ✨`]));
  const fotos = els.filter((e) => e.tipo === "imagen" && e.imagen?.asset).length;
  if (fotos >= 3) op.push(`¡${fotos} fotos en una página! Esto ya es un álbum de puro amor 📸💗`);
  else if (fotos) op.push(una(["Esa foto… ay, ustedes dos son demasiado 🥹", mx ? "Qué fotito tan chula, eh 📸" : "Qué fotito tan linda 📸"]));
  if (/te amo|te adoro/.test(textos)) op.push(una(["Leí «te amo» y me derretí como miel al sol 🍯🫠", "Ay, ¿«te amo»? Me voy a desmayar de ternura 💛"]));
  if (/cumple|cumpleaños/.test(textos)) op.push("¿Es para su cumple? ¡Yo le pondría confeti y una canción! 🎉");
  if (/aniversario|meses juntos|años juntos|mes juntos/.test(textos)) op.push("Un aniversario… ¡cuánto amor! Yo apenas llevo una semana con mi flor favorita 🌼");
  if (/perd[oó]n|perdona/.test(textos)) op.push("Las páginas de perdón son las más valientes. Va a sentir tu corazón 🫶");
  if (/extra[ñn]o|lejos|distancia/.test(textos)) op.push("Para la distancia, una canción de fondo abraza mucho 🎶");
  if (/gracias/.test(textos)) op.push("Dar las gracias así, con un librito… eso es de corazones bonitos 💐");
  const animados = els.filter((e) => e.anim && ((e.anim.entrada?.tipo && e.anim.entrada.tipo !== "ninguna") || (e.anim.bucle?.tipo && e.anim.bucle.tipo !== "ninguno"))).length;
  if (els.length >= 3 && !animados) op.push(mx ? "Esta página está bien quietecita… ¿le damos tantita vida con Animar? 🌀" : "Esta página está muy quietecita… ¿le damos un poquito de vida con Animar? 🌀");
  else if (animados >= 6) op.push("¡Cuánto movimiento! Me mareo de lo bonito 🌀✨");
  if (els.some((e) => /caveat|dancing|great vibes|pacifico|satisfy/i.test(e.texto?.fuente || ""))) op.push("Esa letra como escrita a mano le da muchísimo cariño ✍️");
  if (P?.ajustes?.musica?.asset || p.musica?.asset) op.push(una(["Con música todo se siente más 🎶 (yo bailo en secreto)", "Esa canción… ¿es la de ustedes? 🎧💞"]));
  if (els.some((e) => e.accion?.tipo)) op.push("Hay cosas que se pueden tocar en esta página: eso la hace mágica ✨👆");
  return op.length ? una(op) : null;
}

/** Lo que dice cuando pasa algo (con su carácter). */
export const REACCIONES = {
  imagen: ["¡Qué foto tan bonita! 📸", "Esa foto merece un marquito ✨", "Ay, ¿esa foto? Me encanta 🥹"],
  texto: ["¡Palabras nuevas! Me encanta leerte ✍️", "Escribe bonito, que yo leo todo 👀💛"],
  borrar: ["¡Adiós, cosita! 👋", "Se fue… pero era por algo, confío en ti 🫡", "Bye bye 🐝"],
  deshacer: ["Viaje en el tiempo ⏪✨", "¡Como si nunca hubiera pasado! 🙈"],
  pagina: ["¡Hoja nueva! ¿Qué le ponemos? 📄💗", "Una página más… esto ya es una novela 📖"],
  volver: ["¡Volví! ¿Me extrañaste? 🐝💛", "Bzz… ya regresé, ¿en qué vamos? 🐝"],
  hola: ["¡Hola! Vine a ver cómo va tu librito 🐝💛", "Bzz bzz… ¡aquí ando! ¿Te acompaño? 🐝", "¡Holi! Traje mi lupa y mis ganas de ayudar 🔍🐝"],
};
export const una1 = una;
