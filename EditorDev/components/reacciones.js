/**
 * REACCIONES — lo que sientes al ver una página que te mandó tu amorcito.
 *
 * Seis, cada una con su dibujo, su sonido de cristal (assets/sonidos-editor/
 * reaccion-<id>.wav, en tres versiones que se turnan: nunca suena igual dos
 * veces seguidas; con tu .mp3 de ese nombre, suena el tuyo) y su lluvia:
 *
 *   te-amo       corazones que suben
 *   me-encanto   destellos dorados que se abren
 *   llore        gotitas que caen despacito
 *   abrazo       aros tibios que se abren y corazoncitos
 *   beso         besitos que se van flotando
 *   risa         burbujitas que rebotan hacia arriba
 *
 * Todo se mueve con transform y opacity (nada se repinta) y se va solo.
 */
import { vibrar } from "../config/preferencias.js";
import { sinMovimiento } from "./transiciones.js";

const CORAZON = "M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z";
const DESTELLO = "M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z";
const GOTA = "M12 3c3.5 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.4 6-11z";
const LABIOS = "M2.5 11.5c2.3-2.7 4.6-4.2 6.5-4.2 1.3 0 2.2.6 3 1.5.8-.9 1.7-1.5 3-1.5 1.9 0 4.2 1.5 6.5 4.2-2.5 3.7-5.8 6.2-9.5 6.2s-7-2.5-9.5-6.2z";

export const REACCIONES = [
  { id: "te-amo", corto: "Te amo", largo: "te dijo «te amo»", tuyo: "Le dijiste «te amo»", colores: ["#e0325f", "#ff6f9c", "#ffb3cb"],
    svg: `<path d="${CORAZON}" fill="#e0325f"/><path d="M7 7.6c-1.2.2-2.1 1.3-2.1 2.6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/>` },
  { id: "me-encanto", corto: "Me encantó", largo: "dice que le encantó", tuyo: "Le dijiste que te encantó", colores: ["#f5b83d", "#ffe08a", "#fff6d6"],
    svg: `<path d="${DESTELLO}" fill="#f5b83d"/><path d="M19 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="#ffcf5c"/><path d="M5 15.5l.5 1.4 1.4.5-1.4.5L5 19.3l-.5-1.4-1.4-.5 1.4-.5z" fill="#ffd97a"/>` },
  { id: "llore", corto: "Lloré", largo: "lloró de lo bonito", tuyo: "Le dijiste que lloraste de bonito", colores: ["#7aa7ff", "#b9d0ff", "#c9b6ff"],
    svg: `<path d="${GOTA}" fill="#7aa7ff"/><path d="M9.2 13.6c-.3 1.7.6 3.2 2 3.7" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round"/>` },
  { id: "abrazo", corto: "Abrazo", largo: "te mandó un abrazo", tuyo: "Le mandaste un abrazo", colores: ["#ff9a76", "#ffc9a8", "#ff7fae"],
    svg: `<g transform="translate(-2.4 1) scale(.8)"><path d="${CORAZON}" fill="#ff7fae"/></g><g transform="translate(7 2.2) scale(.8)"><path d="${CORAZON}" fill="#ff9a76" fill-opacity=".92"/></g>` },
  { id: "beso", corto: "Beso", largo: "te mandó un beso", tuyo: "Le mandaste un beso", colores: ["#e8457a", "#ff8fb4", "#ffc2d6"],
    svg: `<path d="${LABIOS}" fill="#e8457a"/><path d="M3.6 11.7c2.9.8 5.7 1.2 8.4 1.2s5.5-.4 8.4-1.2" fill="none" stroke="#9e1f4d" stroke-width="1.2" stroke-linecap="round"/>` },
  { id: "risa", corto: "Me reí", largo: "se rió contigo", tuyo: "Le dijiste que te reíste", colores: ["#ffcf5c", "#ff9ec4", "#ffe9a8"],
    svg: `<circle cx="12" cy="12" r="9.2" fill="#ffcf5c"/><path d="M7.6 10.2c.6-.9 1.6-.9 2.2 0M14.2 10.2c.6-.9 1.6-.9 2.2 0" fill="none" stroke="#6b3a1f" stroke-width="1.4" stroke-linecap="round"/><path d="M7.5 13.4c1 2.3 2.6 3.4 4.5 3.4s3.5-1.1 4.5-3.4z" fill="#6b3a1f"/><circle cx="6.6" cy="13.4" r="1.3" fill="#ff8fa8" fill-opacity=".6"/><circle cx="17.4" cy="13.4" r="1.3" fill="#ff8fa8" fill-opacity=".6"/>` },
];
export const reaccion = (id) => REACCIONES.find((r) => r.id === id) || null;
/** El dibujito de una reacción (SVG en texto). */
export const svgReaccion = (id, clase = "") => { const r = reaccion(id); return r ? `<svg class="rx ${clase}" viewBox="0 0 24 24" aria-hidden="true">${r.svg}</svg>` : ""; };

const FORMAS = {
  "te-amo": `<svg viewBox="0 0 24 24"><path d="${CORAZON}" fill="currentColor"/></svg>`,
  "me-encanto": `<svg viewBox="0 0 24 24"><path d="${DESTELLO}" fill="currentColor"/></svg>`,
  llore: `<svg viewBox="0 0 24 24"><path d="${GOTA}" fill="currentColor"/></svg>`,
  abrazo: `<svg viewBox="0 0 24 24"><path d="${CORAZON}" fill="currentColor"/></svg>`,
  beso: `<svg viewBox="0 0 24 24"><path d="${LABIOS}" fill="currentColor"/></svg>`,
  risa: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity=".85"/><circle cx="9" cy="8.5" r="2.4" fill="#fff" fill-opacity=".7"/></svg>`,
};
const az = (a, b) => a + Math.random() * (b - a);

/** La lluvia de una reacción, desde (x, y) de la pantalla. */
export function estallido(x, y, id) {
  const r = reaccion(id);
  if (!r || sinMovimiento()) return;
  vibrar(id === "llore" ? 5 : 10);
  const capa = document.createElement("div");
  capa.className = "rx-capa";
  document.body.append(capa);
  const n = { "te-amo": 14, "me-encanto": 16, llore: 11, abrazo: 8, beso: 10, risa: 12 }[id];
  const anims = [];
  // Abrazo: tres aros tibios que se abren desde el botón.
  if (id === "abrazo") for (let i = 0; i < 3; i++) {
    const aro = document.createElement("i");
    aro.className = "rx-aro";
    aro.style.cssText = `left:${x}px;top:${y}px;border-color:${r.colores[i % 3]}`;
    capa.append(aro);
    anims.push(aro.animate([{ transform: "translate(-50%, -50%) scale(.2)", opacity: 0.9 }, { transform: "translate(-50%, -50%) scale(4.2)", opacity: 0 }], { duration: 1100, delay: i * 170, easing: "cubic-bezier(.2, .7, .3, 1)", fill: "backwards" }));
  }
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "rx-p";
    p.innerHTML = FORMAS[id];
    const tam = id === "me-encanto" ? az(10, 22) : id === "risa" ? az(8, 18) : az(12, 22);
    p.style.cssText = `left:${x}px;top:${y}px;width:${tam}px;height:${tam}px;color:${r.colores[i % r.colores.length]}`;
    capa.append(p);
    let k;
    if (id === "llore") {
      // Gotitas: brotan un poquito y caen despacio.
      const dx = az(-70, 70), sube = az(20, 60), cae = az(160, 260);
      k = [{ transform: "translate(-50%, -50%) scale(.3)", opacity: 0, easing: "cubic-bezier(.2, .8, .4, 1)" },
        { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% - ${sube}px)) scale(1)`, opacity: 1, offset: 0.25, easing: "cubic-bezier(.5, 0, .9, .6)" },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${cae}px)) scale(.8)`, opacity: 0 }];
    } else if (id === "me-encanto") {
      const a = (i / n) * Math.PI * 2 + az(-0.2, 0.2), d = az(60, 140);
      k = [{ transform: "translate(-50%, -50%) scale(0) rotate(0deg)", opacity: 1, easing: "cubic-bezier(.15, .8, .3, 1)" },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d * 0.8}px), calc(-50% + ${Math.sin(a) * d * 0.8}px)) scale(1.1) rotate(90deg)`, opacity: 1, offset: 0.55, easing: "ease-in" },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0) rotate(160deg)`, opacity: 0 }];
    } else if (id === "risa") {
      const dx = az(-90, 90), alto = az(120, 220);
      k = [{ transform: "translate(-50%, -50%) scale(.2)", opacity: 0, easing: "cubic-bezier(.3, 1.6, .5, 1)" },
        { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% - ${alto * 0.35}px)) scale(1.15)`, opacity: 1, offset: 0.3, easing: "cubic-bezier(.4, 0, .6, 1)" },
        { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% - ${alto * 0.7}px)) scale(.9)`, opacity: 1, offset: 0.7, easing: "ease-out" },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% - ${alto}px)) scale(1.3)`, opacity: 0 }];
    } else {
      // Corazones, besitos y los corazoncitos del abrazo: suben meciéndose.
      const dx = az(-110, 110) * (id === "abrazo" ? 0.5 : 1) + (id === "beso" ? 40 : 0), alto = az(150, 260), giro = az(-40, 40);
      k = [{ transform: "translate(-50%, -50%) scale(.2) rotate(0deg)", opacity: 0, easing: "cubic-bezier(.2, .9, .3, 1.3)" },
        { transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% - ${alto * 0.3}px)) scale(1) rotate(${giro / 2}deg)`, opacity: 1, offset: 0.3, easing: "cubic-bezier(.4, 0, .6, 1)" },
        { transform: `translate(calc(-50% + ${dx * 0.75}px), calc(-50% - ${alto * 0.7}px)) scale(.95) rotate(${-giro / 2}deg)`, opacity: 0.95, offset: 0.7, easing: "ease-in" },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% - ${alto}px)) scale(.7) rotate(${giro}deg)`, opacity: 0 }];
    }
    anims.push(p.animate(k, { duration: (id === "llore" ? 1500 : 1250) + az(0, 400), delay: i * (id === "abrazo" ? 70 : 28) + (id === "abrazo" ? 180 : 0), easing: "linear", fill: "backwards" }));
  }
  Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => capa.remove());
}
