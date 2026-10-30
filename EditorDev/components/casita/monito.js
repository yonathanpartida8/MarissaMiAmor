/**
 * EL MONITO: su dibujo (SVG por piezas, para que camine, salude, se siente, coma y ponga caritas) y su ropa.
 * Para agregar ropa nueva: una fila en su lista (PEINADOS, ARRIBAS…) y su dibujo abajo.
 * Las caritas se cambian con clases (ver casita.css): ojos normales / felices / dormidos / de corazón /
 * de sorpresa y boca sonriente / abierta / «o» / besito. Con sombreado suave en la cara, la ropa y el pelo.
 */
export const PIELES = ["#fff0e6", "#ffe6d2", "#ffe0c8", "#f6d3b8", "#e8b896", "#c98e68", "#9a6644", "#6e4630"];
export const COLOR_PELO = ["#3a2a35", "#5a3b2e", "#8a5a3b", "#c2603a", "#d9a05b", "#f2d27a", "#e8e1d9", "#ff86b0", "#9b6be0", "#6fb8e8", "#2f2f3a"];
export const COLOR_ROPA = ["#ff8fb8", "#ff5c93", "#ffb3cf", "#c39bff", "#9b6be0", "#7aa7ff", "#86d6f2", "#6fd3a6", "#ffd36e", "#ff9e7a", "#ffffff", "#f3e3d3", "#4a5a8a", "#3a2a35"];
export const PEINADOS = [["largo", "Largo"], ["lacio", "Lacio"], ["ondulado", "Ondulado"], ["trenza", "Trenza"], ["coletas", "Coletas"], ["chongo", "Chongo"], ["bob", "Bob"], ["afro", "Afro"], ["corto", "Corto"], ["copete", "Copete"], ["chino", "Chinito"], ["rapado", "Rapado"]];
export const ARRIBAS = [["playera", "Playera"], ["vestido", "Vestido"], ["sudadera", "Sudadera"], ["sueter", "Suéter"], ["blusita", "Blusita"], ["camisa", "Camisa"], ["rayas", "Rayitas"], ["chamarra", "Chamarra"], ["pijama", "Pijama"], ["overol", "Overol"]];
export const ABAJOS = [["pantalon", "Pantalón"], ["jeans", "Jeans"], ["falda", "Falda"], ["short", "Short"]];
export const CALZADOS = [["tenis", "Tenis"], ["botas", "Botas"], ["flats", "Flats"]];
export const OJOS = [["redondos", "Redonditos"], ["grandes", "Grandotes"], ["pestanas", "Pestañitas"], ["puntitos", "Puntitos"]];
export const PECAS = [["no", "Sin pecas"], ["si", "Con pecas"]];
export const ACCESORIOS = [["ninguno", "Nada"], ["mono", "Moño"], ["diadema", "Diadema"], ["flores", "Flores"], ["pasador", "Pasador"], ["orejitas", "Orejitas"], ["gorra", "Gorra"], ["gorro", "Gorrito"], ["lentes", "Lentes"], ["corona", "Corona"], ["audifonos", "Audífonos"], ["bufanda", "Bufanda"], ["aretes", "Aretes"]];

/** La ropa de entrada, según lo que eligió en su perfil (mujer u hombre; si no, algo lindo para todos). */
export function ropaDe(genero) {
  if (genero === "Mujer") return { piel: PIELES[2], pelo: "largo", peloColor: "#5a3b2e", arriba: "vestido", arribaColor: "#ff8fb8", abajo: "falda", abajoColor: "#c39bff", zapatos: "#ff5c93", calzado: "flats", ojos: "pestanas", pecas: "no", accesorio: "mono" };
  if (genero === "Hombre") return { piel: PIELES[4], pelo: "corto", peloColor: "#3a2a35", arriba: "playera", arribaColor: "#7aa7ff", abajo: "pantalon", abajoColor: "#4a5a8a", zapatos: "#3a2a35", calzado: "tenis", ojos: "redondos", pecas: "no", accesorio: "ninguno" };
  return { piel: PIELES[3], pelo: "chino", peloColor: "#8a5a3b", arriba: "sudadera", arribaColor: "#c39bff", abajo: "pantalon", abajoColor: "#4a5a8a", zapatos: "#ff5c93", calzado: "tenis", ojos: "grandes", pecas: "no", accesorio: "ninguno" };
}

const seguro = (c, d) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : d);
function osc(c, k = 0.82) { const n = parseInt(String(c).slice(1), 16) || 0; return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`; }
function cla(c, t = 0.3) { const n = parseInt(String(c).slice(1), 16) || 0, f = (v) => Math.round(v + (255 - v) * t); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
const OL = 'stroke="#4b2e42" stroke-opacity=".22" stroke-width="2.2" stroke-linejoin="round"';
const SOMBRA = 'fill="#3a2a35" opacity=".08"';
const cor = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-3c-2-4-9-3-8 2 1 4 8 8 8 8s7-4 8-8c1-5-6-6-8-2z" fill="${c}"/>`;
function estrellita(x, y, r, c) {
  let d = "";
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + " " + (y + Math.sin(a) * rr).toFixed(1); }
  return `<path d="${d}z" fill="${c}"/>`;
}

/** Los ojitos de siempre (ojo-n), según el estilo que eligió. */
function ojos(estilo) {
  const par = (f) => f(40, -1) + f(60, 1);
  if (estilo === "grandes") return par((x) => `<ellipse cx="${x}" cy="51.5" rx="5" ry="6.2" fill="#3a2a35"/><ellipse cx="${x}" cy="54.6" rx="3.6" ry="2.4" fill="#7b5a86" opacity=".75"/><circle cx="${x + 1.7}" cy="49.2" r="2" fill="#fff"/><circle cx="${x - 1.6}" cy="54.2" r=".9" fill="#fff"/>`);
  if (estilo === "puntitos") return par((x) => `<circle cx="${x}" cy="52" r="2.9" fill="#3a2a35"/><circle cx="${x + 0.9}" cy="51" r=".9" fill="#fff"/>`);
  const base = par((x) => `<ellipse cx="${x}" cy="52" rx="3.8" ry="4.8" fill="#3a2a35"/><circle cx="${x + 1.4}" cy="50.2" r="1.5" fill="#fff"/><circle cx="${x - 1}" cy="54" r=".8" fill="#fff"/>`);
  if (estilo === "pestanas") return base + `<path d="M36.4 49l-2.6-1.4M36.8 47.2l-1.8-2.2M63.6 49l2.6-1.4M63.2 47.2l1.8-2.2" stroke="#3a2a35" stroke-width="1.5" stroke-linecap="round"/>`;
  return base;
}

/** El monito en SVG (100 × 170; los pies en y = 166). */
export function monitoSVG(r0) {
  const r = { ...ropaDe(""), ...r0 };
  const piel = seguro(r.piel, PIELES[2]), pelo = seguro(r.peloColor, "#5a3b2e"), arriba = seguro(r.arribaColor, "#ff8fb8"), abajo = seguro(r.abajoColor, "#7aa7ff"), zap = seguro(r.zapatos, "#3a2a35");
  const vestido = r.arriba === "vestido", overol = r.arriba === "overol", jeans = r.abajo === "jeans";
  const piernasDeTela = !vestido && (overol || r.abajo === "pantalon" || jeans);
  const zapato = (x) => {
    if (r.calzado === "botas") return `<rect x="${x - 1}" y="145" width="13.5" height="17" rx="3.5" fill="${zap}" ${OL}/><path d="M${x - 3} 158h17.4v5H${x - 3}z" fill="${zap}" ${OL}/><rect x="${x - 3}" y="162" width="17.4" height="2.6" rx="1.3" fill="#fff" opacity=".8"/><path d="M${x} 149h11" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
    if (r.calzado === "flats") return `<path d="M${x - 2} 161.4a7.7 4.6 0 0 1 15.4 0v2.4H${x - 2}z" fill="${zap}" ${OL}/><circle cx="${x + 5.7}" cy="157.6" r="2" fill="${cla(zap, 0.45)}"/>`;
    return `<path d="M${x - 3} 160a8.7 6 0 0 1 17.4 0v3H${x - 3}z" fill="${zap}" ${OL}/><rect x="${x - 3}" y="162" width="17.4" height="3" rx="1.5" fill="#fff" opacity=".85"/><path d="M${x + 1} 157.4l3 1.6M${x + 5} 156.6l3 1.6" stroke="#fff" stroke-width="1.1" opacity=".7"/>`;
  };
  const pierna = (x, cl) => `<g class="${cl}">
      <rect x="${x}" y="114" width="11.5" height="46" rx="5.5" fill="${piernasDeTela ? abajo : piel}" ${OL}/>
      <rect x="${x + 7.5}" y="116" width="3" height="40" rx="1.5" ${SOMBRA}/>
      ${jeans ? `<path d="M${x + 5.75} 118v36" stroke="${cla(abajo, 0.35)}" stroke-width="1.2" stroke-dasharray="2.4 2"/><rect x="${x}" y="151" width="11.5" height="4" rx="1.5" fill="${cla(abajo, 0.25)}"/>` : ""}
      ${!vestido && !overol && r.abajo === "short" ? `<rect x="${x - 1}" y="113" width="13.5" height="17" rx="5" fill="${abajo}" ${OL}/>` : ""}
      ${!piernasDeTela && r.calzado !== "botas" ? `<rect x="${x}" y="148" width="11.5" height="7" rx="2" fill="#fff" opacity=".9"/>` : ""}
      ${zapato(x)}</g>`;
  const manga = { playera: 15, rayas: 34, sudadera: 34, sueter: 34, camisa: 34, pijama: 34, chamarra: 34, overol: 15, vestido: 9, blusita: 0 }[r.arriba] ?? 15;
  const brazo = (x, cl, rot, cuchara = false) => `<g class="${cl}" style="transform-origin:${x + 5}px 82px"><g transform="rotate(${rot} ${x + 5} 82)">
      <rect x="${x}" y="80" width="10.5" height="36" rx="5.2" fill="${piel}" ${OL}/>
      ${manga ? `<rect x="${x - 0.5}" y="79" width="11.5" height="${manga}" rx="5.5" fill="${arriba}" ${OL}/><rect x="${x + 6.5}" y="81" width="3" height="${Math.max(4, manga - 4)}" rx="1.5" ${SOMBRA}/>` : ""}
      ${manga === 34 && ["sueter", "sudadera", "pijama"].includes(r.arriba) ? `<rect x="${x - 0.5}" y="107" width="11.5" height="5" rx="2" fill="${osc(arriba, 0.9)}"/>` : ""}
      ${r.arriba === "rayas" ? `<path d="M${x} 90h11M${x} 98h11M${x} 106h11" stroke="#fff" stroke-width="2.5" opacity=".8"/>` : ""}
      ${r.arriba === "pijama" ? estrellita(x + 5, 96, 2.6, "#fff") : ""}
      <circle cx="${x + 5.2}" cy="117" r="5.8" fill="${piel}" ${OL}/>
      ${cuchara ? `<g class="ca-cuchara"><path d="M${x + 5.2} 118l-6.4-12" stroke="#cfc6d3" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="${x - 2.4}" cy="103.4" rx="3.2" ry="4.4" fill="#ece6ee" transform="rotate(-28 ${x - 2.4} 103.4)" ${OL}/></g>` : ""}</g></g>`;
  // El torso según la ropa (con su sombrita del lado y su brillito).
  let torso;
  const lado = `<rect x="60" y="81" width="9" height="40" rx="4.5" ${SOMBRA}/><rect x="33" y="83" width="5" height="24" rx="2.5" fill="#fff" opacity=".16"/>`;
  if (vestido) torso = `<path d="M36 77h28l13 61H23z" fill="${arriba}" ${OL}/><path d="M60 79h4l13 59h-9z" ${SOMBRA}/><path d="M24 132h52" stroke="${osc(arriba)}" stroke-width="3"/><path d="M40 78q10 9 20 0" fill="#fff" opacity=".85"/>
      <path d="M44 100l6 3 6-3-6 3z" fill="${osc(arriba, 0.75)}"/><circle cx="50" cy="102" r="2.5" fill="${osc(arriba, 0.75)}"/><path d="M30 112l-3 22M70 112l3 22" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>`;
  else if (r.arriba === "sudadera") torso = `<rect x="29" y="76" width="42" height="48" rx="14" fill="${arriba}" ${OL}/>${lado}<path d="M38 78q12 11 24 0" stroke="${osc(arriba)}" stroke-width="3" fill="none"/><path d="M45 84v8M55 84v8" stroke="#fff" stroke-width="2" stroke-linecap="round"/><rect x="38" y="104" width="24" height="11" rx="4" fill="${osc(arriba, 0.9)}"/>`;
  else if (r.arriba === "sueter") torso = `<rect x="29" y="76" width="42" height="48" rx="14" fill="${arriba}" ${OL}/>${lado}${[36, 43, 57, 64].map((x) => `<path d="M${x} 84v28" stroke="${osc(arriba, 0.9)}" stroke-width="1.2"/>`).join("")}<rect x="31" y="114" width="38" height="9" rx="4" fill="${osc(arriba, 0.9)}"/><path d="M40 77q10 7 20 0" stroke="${osc(arriba, 0.85)}" stroke-width="4" fill="none"/>${cor(50, 98, 1.05, "#fff")}`;
  else if (r.arriba === "blusita") torso = `<rect x="31" y="80" width="38" height="44" rx="12" fill="${arriba}" ${OL}/>${lado}<path d="M37 80v-6M63 80v-6" stroke="${arriba}" stroke-width="3.5"/><path d="M33 112h34" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="3 4"/><path d="M40 82q10 7 20 0" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  else if (r.arriba === "camisa") torso = `<rect x="30" y="77" width="40" height="46" rx="12" fill="${arriba}" ${OL}/>${lado}<path d="M50 80v42" stroke="${osc(arriba, 0.8)}" stroke-width="1.5"/>${[88, 98, 108].map((y) => `<circle cx="50" cy="${y}" r="1.5" fill="#fff"/>`).join("")}<rect x="55" y="88" width="9" height="8" rx="2" fill="${osc(arriba, 0.92)}"/><path d="M38 77l12 8 12-8-3-4-9 6-9-6z" fill="#fff" ${OL}/>`;
  else if (r.arriba === "rayas") torso = `<rect x="30" y="77" width="40" height="46" rx="13" fill="${arriba}" ${OL}/>${[88, 98, 108, 118].map((y) => `<path d="M31 ${y}h38" stroke="#fff" stroke-width="3.5" opacity=".85"/>`).join("")}${lado}<path d="M42 78q8 6 16 0" stroke="${osc(arriba)}" stroke-width="2.5" fill="none"/>`;
  else if (r.arriba === "chamarra") torso = `<rect x="31" y="77" width="38" height="46" rx="12" fill="#fff" ${OL}/>${cor(50, 98, 0.8, "#ff86b0")}<path d="M30 90q0-13 13-13h3v46H36a6 6 0 0 1-6-6zM70 90q0-13-13-13h-3v46h10a6 6 0 0 0 6-6z" fill="${arriba}" ${OL}/><rect x="61" y="81" width="8" height="40" rx="4" ${SOMBRA}/><path d="M46 80v42M54 80v42" stroke="${osc(arriba, 0.8)}" stroke-width="1.4"/><rect x="34" y="104" width="8" height="6" rx="2" fill="${osc(arriba, 0.88)}"/>`;
  else if (r.arriba === "pijama") torso = `<rect x="30" y="77" width="40" height="46" rx="13" fill="${arriba}" ${OL}/>${lado}<path d="M40 78q10 8 20 0" stroke="#fff" stroke-width="2.5" fill="none"/>${[[38, 92], [58, 96], [46, 108], [62, 114], [36, 116]].map(([x, y]) => estrellita(x, y, 3, "#fff")).join("")}<path d="M50 84v38" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="3 3"/>`;
  else if (overol) torso = `<rect x="30" y="77" width="40" height="46" rx="13" fill="${arriba}" ${OL}/><rect x="35" y="94" width="30" height="30" rx="5" fill="${abajo}" ${OL}/>${lado}<path d="M36 96l-4-16M64 96l4-16" stroke="${abajo}" stroke-width="4"/><circle cx="38" cy="98" r="2" fill="#ffd36e"/><circle cx="62" cy="98" r="2" fill="#ffd36e"/><rect x="43" y="104" width="14" height="10" rx="3" fill="${osc(abajo, 0.88)}"/>`;
  else torso = `<rect x="30" y="77" width="40" height="46" rx="13" fill="${arriba}" ${OL}/>${lado}<path d="M42 78q8 6 16 0" stroke="${osc(arriba)}" stroke-width="2.5" fill="none"/><path d="M40 100c0-4 6-6 10-2 4-4 10-2 10 2 0 5-10 10-10 10s-10-5-10-10z" fill="#fff" opacity=".55"/>`;
  const falda = !vestido && !overol && r.abajo === "falda" ? `<path d="M31 114h38l7 23H24z" fill="${abajo}" ${OL}/><path d="M60 115h9l7 22h-9z" ${SOMBRA}/><path d="M26 132h48" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>` : "";
  const cintura = !vestido && !overol && r.abajo !== "falda" ? `<rect x="31" y="111" width="38" height="12" rx="5" fill="${abajo}" ${OL}/>${jeans ? `<path d="M36 113v8M64 113v8" stroke="${cla(abajo, 0.35)}" stroke-width="1.2"/><circle cx="50" cy="116" r="1.6" fill="#ffd36e"/>` : ""}` : "";
  const brilloPelo = `<path d="M33 25q8-8 18-9" stroke="#fff" stroke-opacity=".3" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M60 19q6 2 9 6" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  const atras = {
    largo: `<path d="M20 46Q20 15 50 15q30 0 30 31l4 66q-17 10-34 5-17 5-34-5z" fill="${pelo}" ${OL}/><path d="M66 60l6 50" stroke="${osc(pelo, 0.85)}" stroke-width="3" opacity=".5"/>`,
    lacio: `<path d="M20 46Q20 14 50 14q30 0 30 32v74H20z" fill="${pelo}" ${OL}/><path d="M70 60v58M30 60v58" stroke="${osc(pelo, 0.85)}" stroke-width="2.5" opacity=".45"/>`,
    ondulado: `<path d="M19 48Q19 15 50 15q31 0 31 33l3 36q-6 7-12 2-6 7-12 1-6 7-12 0-6 7-12 0-6 7-12 0-6 5-11-2z" fill="${pelo}" ${OL}/>`,
    trenza: `<path d="M20 46Q20 15 50 15q30 0 30 31v10q-30 7-60 0z" fill="${pelo}" ${OL}/>`,
    coletas: `<circle cx="15" cy="58" r="11" fill="${pelo}" ${OL}/><circle cx="85" cy="58" r="11" fill="${pelo}" ${OL}/><path d="M12 64q-5 18 5 32M88 64q5 18-5 32" stroke="${pelo}" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    chongo: `<circle cx="50" cy="13" r="12" fill="${pelo}" ${OL}/><path d="M44 8q6-4 12 0" stroke="#fff" stroke-opacity=".3" stroke-width="2.5" fill="none"/>`,
    bob: `<path d="M18 50Q18 14 50 14q32 0 32 36v26q-32 9-64 0z" fill="${pelo}" ${OL}/>`,
    afro: `<g fill="${pelo}" ${OL}>${[[50, 30, 30], [24, 40, 16], [76, 40, 16], [30, 20, 15], [70, 20, 15], [50, 10, 14], [20, 56, 12], [80, 56, 12]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}"/>`).join("")}</g>`,
  }[r.pelo] || "";
  const fleco = {
    largo: `<path d="M22 47q1-31 28-31t28 31q-12-16-22-13-9-8-34 13z" fill="${pelo}" ${OL}/>`,
    lacio: `<path d="M22 52q2-36 28-36 0 12-13 22-9 7-15 14zM78 52q-2-36-28-36 0 12 13 22 9 7 15 14z" fill="${pelo}" ${OL}/>`,
    ondulado: `<path d="M21 48q1-33 29-33t29 33q-4-10-12-14-10 6-22 2-14 2-24 12z" fill="${pelo}" ${OL}/>`,
    trenza: `<path d="M22 47q1-31 28-31t28 31q-12-16-22-13-9-8-34 13z" fill="${pelo}" ${OL}/><g fill="${pelo}" ${OL}>${[62, 72, 82, 92, 102].map((y, i) => `<ellipse cx="${76 - i * 1.4}" cy="${y}" rx="6.4" ry="6.2"/>`).join("")}</g><circle cx="70" cy="108" r="3.2" fill="#ff86b0"/><path d="M68 110q2 8-2 12M72 110q2 8 4 11" stroke="${pelo}" stroke-width="3" stroke-linecap="round"/>`,
    coletas: `<path d="M22 47q2-31 28-31t28 31q-14-13-28-11-14-2-28 11z" fill="${pelo}" ${OL}/><circle cx="22" cy="54" r="3.5" fill="#ff86b0"/><circle cx="78" cy="54" r="3.5" fill="#ff86b0"/>`,
    chongo: `<path d="M22 47q2-31 28-31t28 31q-10-17-28-15-18-2-28 15z" fill="${pelo}" ${OL}/><rect x="42" y="20" width="16" height="5" rx="2.5" fill="#ff86b0"/>`,
    bob: `<path d="M21 46q1-30 29-30t29 30q-2 3-9 3H30q-7 0-9-3z" fill="${pelo}" ${OL}/>`,
    afro: `<g fill="${pelo}">${[28, 38, 50, 62, 72].map((x, i) => `<circle cx="${x}" cy="${26 + (i % 2) * 2}" r="7.5"/>`).join("")}</g>`,
    corto: `<path d="M21 49q0-33 29-33t29 33q-6-15-14-17-6 4-15 3-9 1-15-3-8 2-14 17z" fill="${pelo}" ${OL}/>`,
    copete: `<path d="M21 49q0-33 29-33t29 33q-6-13-14-15-10-10-24-2-12 0-20 17z" fill="${pelo}" ${OL}/><path d="M40 20q8-15 23-6-10 0-14 10z" fill="${pelo}" ${OL}/>`,
    chino: `<g fill="${pelo}" ${OL}>${[[24, 38], [31, 26], [43, 19], [57, 19], [69, 26], [76, 38], [21, 50], [79, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join("")}</g>`,
    rapado: `<path d="M22 45q0-29 28-29t28 29q-5-13-28-14-23 1-28 14z" fill="${pelo}" opacity=".9" ${OL}/>`,
  }[r.pelo] || "";
  const acc = {
    mono: `<path d="M66 20l12-8v18zM66 20l-12-8v18z" fill="#ff5c93" ${OL}/><circle cx="66" cy="20" r="4" fill="#ff86b0"/>`,
    diadema: `<path d="M22 40q2-26 28-26t28 26" stroke="#ff86b0" stroke-width="5" fill="none"/>${cor(64, 20, 0.7, "#ff5c93")}`,
    flores: `<g>${[[28, 24, "#ff9cbf"], [40, 17, "#ffd36e"], [53, 16, "#c39bff"], [65, 19, "#86d6f2"], [74, 27, "#ff9cbf"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" ${OL}/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join("")}</g>`,
    pasador: `${estrellita(70, 30, 6.5, "#ffd84d")}<circle cx="70" cy="30" r="1.6" fill="#fff"/>`,
    orejitas: `<path d="M24 26l2-18 14 10zM76 26l-2-18-14 10z" fill="${pelo}" ${OL}/><path d="M27 21l1-8 6 5zM73 21l-1-8-6 5z" fill="#ffb3cf"/>`,
    gorra: `<path d="M20 40q2-26 30-26t30 26z" fill="#ff5c93" ${OL}/><path d="M50 40h38q-4 8-38 6z" fill="#e0457f" ${OL}/><circle cx="50" cy="15" r="3.5" fill="#fff"/>`,
    gorro: `<path d="M20 42q0-30 30-30t30 30z" fill="#ff86b0" ${OL}/>${[30, 40, 50, 60, 70].map((x) => `<path d="M${x} 18q-1 10 0 20" stroke="#ff5c93" stroke-width="1.6" fill="none"/>`).join("")}<rect x="18" y="36" width="64" height="10" rx="5" fill="#ff5c93" ${OL}/><circle cx="50" cy="10" r="6.5" fill="#fff" ${OL}/>`,
    lentes: `<g fill="rgba(255,255,255,.25)" stroke="#3a2a35" stroke-width="2.6"><circle cx="40" cy="52" r="8"/><circle cx="60" cy="52" r="8"/><path d="M48 52h4" fill="none"/></g><path d="M35 49l4-3M55 49l4-3" stroke="#fff" stroke-width="1.6" opacity=".8"/>`,
    corona: `<path d="M32 22l6-14 12 10 12-10 6 14z" fill="#ffd84d" ${OL}/><circle cx="50" cy="16" r="2.5" fill="#ff5c93"/><circle cx="38" cy="9" r="1.6" fill="#fff"/><circle cx="62" cy="9" r="1.6" fill="#fff"/>`,
    audifonos: `<path d="M20 50q0-36 30-36t30 36" stroke="#9b6be0" stroke-width="5" fill="none"/><rect x="14" y="44" width="12" height="18" rx="5" fill="#c39bff" ${OL}/><rect x="74" y="44" width="12" height="18" rx="5" fill="#c39bff" ${OL}/>`,
    aretes: `<circle cx="21" cy="61" r="2.6" fill="#ffd84d" ${OL}/><circle cx="79" cy="61" r="2.6" fill="#ffd84d" ${OL}/>`,
  }[r.accesorio] || "";
  // La bufanda va en el cuello (debajo de la cabeza).
  const bufanda = r.accesorio === "bufanda" ? `<path d="M31 73q19 10 38 0v9q-19 10-38 0z" fill="#ff5c93" ${OL}/><path d="M58 80l5 24h-9z" fill="#ff5c93" ${OL}/><path d="M36 78l3 5M44 80l2 5M52 80l1 5M60 78l-1 5M56 94h6" stroke="#fff" stroke-width="2" opacity=".75"/>` : "";
  const pecas = r.pecas === "si" ? [[29, 58], [33.5, 61], [27, 62.6], [71, 58], [66.5, 61], [73, 62.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${osc(piel, 0.62)}" opacity=".75"/>`).join("") : "";
  return `<svg viewBox="0 0 100 170" class="ca-mono-svg" aria-hidden="true">
    <ellipse class="ca-sombra" cx="50" cy="165" rx="31" ry="5.6" fill="rgba(60,30,50,.1)"/><ellipse class="ca-sombra" cx="50" cy="165" rx="21" ry="3.6" fill="rgba(60,30,50,.16)"/>
    ${atras}
    ${pierna(37, "ca-pi")}${pierna(51.5, "ca-pd")}
    ${brazo(20, "ca-bi", 12)}
    ${torso}${cintura}${falda}
    ${brazo(69.5, "ca-bd", -12, true)}
    <rect x="45" y="70" width="10" height="9" fill="${osc(piel, 0.88)}"/>${bufanda}
    <g class="ca-cabeza">
    <circle cx="22" cy="52" r="6" fill="${piel}" ${OL}/><circle cx="78" cy="52" r="6" fill="${piel}" ${OL}/><circle cx="22" cy="52" r="3" fill="${osc(piel, 0.88)}"/><circle cx="78" cy="52" r="3" fill="${osc(piel, 0.88)}"/>
    <circle cx="50" cy="48" r="28" fill="${piel}" ${OL}/>
    <path d="M22.3 52A28 28 0 0 0 77.7 52A34 16 0 0 1 22.3 52z" fill="${osc(piel, 0.86)}" opacity=".32"/>
    <ellipse cx="38" cy="35" rx="9" ry="5" fill="#fff" opacity=".2" transform="rotate(-24 38 35)"/>
    <path d="M35 43q5-3.5 10 0M55 43q5-3.5 10 0" stroke="${osc(pelo, 0.85)}" stroke-width="2.2" fill="none" stroke-linecap="round" class="ca-cejas"/>
    <g class="ca-ojos ojo-n">${ojos(r.ojos)}</g>
    <g class="ojo-f"><path d="M36 53q4-5 8 0M56 53q4-5 8 0" stroke="#3a2a35" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
    <g class="ojo-z"><path d="M36 52q4 4 8 0M56 52q4 4 8 0" stroke="#3a2a35" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
    <g class="ojo-c">${cor(40, 52.5, 0.62, "#ff4d8d")}${cor(60, 52.5, 0.62, "#ff4d8d")}<circle cx="37.6" cy="49.6" r="1" fill="#fff"/><circle cx="57.6" cy="49.6" r="1" fill="#fff"/></g>
    <g class="ojo-s"><circle cx="40" cy="51.5" r="5.4" fill="#fff" ${OL}/><circle cx="60" cy="51.5" r="5.4" fill="#fff" ${OL}/><circle cx="40" cy="52" r="2.4" fill="#3a2a35"/><circle cx="60" cy="52" r="2.4" fill="#3a2a35"/></g>
    <ellipse cx="50" cy="58" rx="2.2" ry="1.5" fill="${osc(piel, 0.78)}"/>
    <ellipse cx="32" cy="60" rx="5.5" ry="3.2" fill="#ff8fb8" opacity=".5"/><ellipse cx="68" cy="60" rx="5.5" ry="3.2" fill="#ff8fb8" opacity=".5"/>${pecas}
    <path class="bo-n" d="M45 63q5 5 10 0" stroke="#c2336b" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    <path class="bo-a" d="M44 62h12q-1 8-6 8t-6-8z" fill="#c2336b"/>
    <ellipse class="bo-o" cx="50" cy="65" rx="3" ry="3.6" fill="#c2336b"/>
    <g class="bo-b"><path d="M47 63q3-2 4 1 1-3 4-1-1 4-4 5-3-1-4-5z" fill="#ff5c93"/></g>
    ${fleco}${brilloPelo}${acc}
    </g>
  </svg>`;
}
