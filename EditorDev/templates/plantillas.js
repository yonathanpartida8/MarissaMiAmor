/**
 * PLANTILLAS — puntos de partida ligeros.
 *
 * Ninguna trae fotos ni canciones: traen el hueco («+ Añadir foto») y tú
 * pones lo tuyo. Son JSON de unos pocos cientos de bytes.
 */
import { nuevaPagina, nuevoEl, rinconParaMusica, uid } from "../core/modelo.js";
import { DIBUJOS } from "../assets/dibujos.js";
import { fondoDePapel } from "./papeles.js";

const dib = (id) => DIBUJOS.find((d) => d.id === id)?.svg || "";
const entra = (tipo, retraso = 0, extra = {}) => ({ entrada: { tipo, dur: 900, retraso, facil: "suave", dir: "arriba", dist: 30, ...extra }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null });

function T(P, texto, x, y, w, op = {}) {
  const t = P.ajustes.tema;
  return nuevoEl("texto", P, { x, y, w, h: op.h || Math.round((op.tam || 28) * 1.5), nombre: op.nombre || "Texto", anim: op.anim, texto: { html: texto, fuente: op.fuente || t.fuente, tam: op.tam || 28, peso: op.peso || 500, cursiva: !!op.cursiva, alin: op.alin || "center", color: op.color || t.texto, interlinea: op.interlinea || 1.3, interletra: op.interletra || 0 } });
}

/** Medidas que se adaptan a la hoja: ancha (horizontal), letra grande según el lado corto. */
const M = (P) => {
  const { ancho: W, alto: H } = P.ajustes;
  const corto = Math.min(W, H);
  return { W, H, ancha: W > H * 1.15, grande: Math.round(Math.max(34, Math.min(66, corto * 0.12))), media: Math.round(Math.max(18, Math.min(28, corto * 0.055))) };
};

/** Le añade cosas a un elemento recién hecho (las de `texto` se mezclan). */
const con = (e, extra) => { const { texto, ...resto } = extra; Object.assign(e, resto); if (texto) Object.assign(e.texto, texto); return e; };
const bucle = (tipo, dur, extra = {}) => ({ tipo, dur, repetir: "inf", ...extra });
// La floritura dorada de la portada del librito (la misma curva con su puntito).
const FLORITURA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 12" fill="none"><path d="M2 6 Q 30 0, 58 6 T 118 6" stroke="currentColor" stroke-width="0.9"/><circle cx="60" cy="6" r="2.2" fill="currentColor"/></svg>';

/** Grupos de la galería de plantillas. */
export const GRUPOS_PLANTILLAS = [["empezar", "Para empezar"], ["portadas", "Portadas"], ["fotos", "Fotos"], ["cartas", "Cartas y frases"], ["mas", "Música y más"]];

export const PLANTILLAS = [
  {
    id: "vacia", cat: "empezar", n: "Página vacía", d: "Hoja completamente en blanco.",
    crear: (P) => nuevaPagina(P, { nombre: "Página en blanco" }),
  },
  {
    // (Fase 45) Así empieza un detallito nuevo: hoja blanca y sólo su botón de música.
    id: "portada-clasica", cat: "portadas", n: "Clásica", d: "Hoja blanca, sin nada más que el botón de música: tú pones todo.",
    crear: (P) => nuevaPagina(P, { nombre: "Portada", fondo: { tipo: "color", color: "#ffffff" } }),
  },
  {
    id: "portada", cat: "portadas", n: "Con corazón", d: "Título grande, un subtítulo y un corazón que late.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const ty = Math.round(H * 0.42), cor = Math.round(Math.min(92, H * 0.15));
      const p = nuevaPagina(P, { nombre: "Portada", fondo: { tipo: "gradiente", color: t.fondo, gradiente: { a: "#ffe9f1", b: "#ffc4d9", angulo: 170, tipo: "lineal" } } });
      const c = nuevoEl("dibujo", P, { nombre: "Corazón", x: W / 2 - cor / 2, y: ty - cor - 14, w: cor, h: cor, dibujo: { svg: dib("corazon"), color: t.acento }, anim: { ...entra("latido", 200), bucle: { tipo: "palpitar", dur: 1600, repetir: "inf" } } });
      p.els.push(c,
        T(P, "Nuestro librito", 24, ty, W - 48, { tam: 48, peso: 600, fuente: t.fuenteTitulos, nombre: "Título", anim: entra("deslizar", 500), h: 70 }),
        T(P, "para ti, con todo mi corazón", 40, ty + 80, W - 80, { tam: 22, cursiva: true, nombre: "Subtítulo", anim: entra("aparecer", 1000) }),
        T(P, "toca la flecha para empezar →", 40, H - 110, W - 80, { tam: 15, fuente: "Jost", peso: 400, color: t.acento, nombre: "Pista", anim: { ...entra("aparecer", 1800), bucle: { tipo: "brillar", dur: 2400, repetir: "inf" } } }));
      return p;
    },
  },
  {
    id: "portada-foto", cat: "portadas", n: "Portada con foto", d: "Una polaroid grande, el título a mano y corazoncitos.",
    crear: (P) => {
      const { W, H, ancha, grande } = M(P);
      const t = P.ajustes.tema;
      const p = nuevaPagina(P, { nombre: "Portada con foto", fondo: fondoDePapel("puntitos") });
      const fh = Math.round(Math.min(H * (ancha ? 0.72 : 0.46), (ancha ? W * 0.42 : W * 0.7) / 0.86)), fw = Math.round(fh * 0.86);
      const fx = ancha ? Math.round(W * 0.08) : W / 2 - fw / 2, fy = ancha ? Math.round((H - fh) / 2) : Math.round(H * 0.1);
      const tx = ancha ? fx + fw + 30 : 24, tw = ancha ? W - tx - 30 : W - 48, ty = ancha ? Math.round(H * 0.36) : fy + fh + 34;
      p.els.push(
        nuevoEl("imagen", P, { nombre: "Foto", x: fx, y: fy, w: fw, h: fh, rot: -4, imagen: { marco: "polaroid" }, anim: entra("zoom", 150) }),
        nuevoEl("dibujo", P, { nombre: "Corazones", x: Math.min(W - 70, fx + fw - 26), y: Math.max(6, fy - 58), w: 64, h: 64, dibujo: { svg: dib("corazones"), color: t.acento }, anim: { ...entra("latido", 900), bucle: { tipo: "respirar", dur: 2400, repetir: "inf" } } }),
        T(P, "Nuestro librito", tx, ty, tw, { tam: grande, fuente: "Caveat", peso: 600, color: t.texto, nombre: "Título", anim: entra("deslizar", 600), h: Math.round(grande * 1.4) }),
        T(P, "lo que somos, en páginas", tx, ty + Math.round(grande * 1.4) + 8, tw, { tam: 20, cursiva: true, nombre: "Subtítulo", anim: entra("aparecer", 1100) }),
      );
      return p;
    },
  },
  {
    id: "portada-noche", cat: "portadas", n: "Portada de noche", d: "Cielo con estrellas, una luna y letras doradas.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const p = nuevaPagina(P, { nombre: "Portada de noche", fondo: fondoDePapel("noche") });
      const ty = Math.round(H * 0.4), lu = Math.round(Math.min(110, Math.min(W, H) * 0.22));
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Luna", x: W - lu - Math.round(W * 0.1), y: Math.round(H * 0.08), w: lu, h: lu, dibujo: { svg: dib("luna"), color: "#ffe7a8" }, anim: { ...entra("aparecer", 200), bucle: { tipo: "respirar", dur: 4000, repetir: "inf" } } }),
        nuevoEl("dibujo", P, { nombre: "Estrellas", x: Math.round(W * 0.1), y: Math.round(H * 0.16), w: 60, h: 60, dibujo: { svg: dib("brillos"), color: "#fff3cf" }, anim: { ...entra("aparecer", 700), bucle: { tipo: "brillar", dur: 2600, repetir: "inf" } } }),
        T(P, "Nuestras noches", 24, ty, W - 48, { tam: Math.round(grande * 1.05), fuente: "Great Vibes", peso: 400, color: "#ffe7a8", nombre: "Título", anim: entra("desenfoque", 400), h: Math.round(grande * 1.5) }),
        T(P, "aunque estemos lejos, miramos la misma luna", 40, ty + Math.round(grande * 1.5) + 10, W - 80, { tam: 19, fuente: "Quicksand", peso: 400, color: "#e9dcff", interlinea: 1.4, h: 60, nombre: "Subtítulo", anim: entra("aparecer", 1100) }),
      );
      return p;
    },
  },
  {
    id: "portada-baddie", cat: "portadas", n: "Portada baddie", d: "Leopardo, una cinta negra y letras de Barbie en rojo.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const p = nuevaPagina(P, { nombre: "Portada baddie", fondo: fondoDePapel("leopardo") });
      const th = Math.round(grande * 1.75), bh = th + 64, by = Math.round(H * 0.4 - bh / 2), ty = by + 14;
      p.els.push(
        nuevoEl("forma", P, { nombre: "Cinta", x: 18, y: by, w: W - 36, h: bh, rot: -2, forma: { figura: "rect", relleno: "#17100b", trazo: "#a3101c", grosor: 3 }, caja: { radio: 18 }, anim: entra("deslizar", 100, { dir: "derecha" }) }),
        T(P, "Baddie & yo", 30, ty, W - 60, { tam: grande, fuente: "Pacifico", peso: 400, color: "#ffffff", interlinea: 1.5, nombre: "Título", anim: entra("zoom", 500), h: th }),
        T(P, "te amo más que a nada", 30, ty + th + 4, W - 60, { tam: 18, fuente: "Poppins", peso: 600, color: "#ffd6dc", interletra: 2, nombre: "Subtítulo", anim: entra("aparecer", 1000) }),
        nuevoEl("dibujo", P, { nombre: "Corazón", x: W - 82, y: Math.max(6, by - 46), w: 60, h: 60, dibujo: { svg: dib("corazon"), color: "#a3101c" }, anim: { ...entra("latido", 1300), bucle: { tipo: "palpitar", dur: 1500, repetir: "inf" } } }),
      );
      return p;
    },
  },
  {
    id: "portada-sobre", cat: "portadas", n: "Portada sobre", d: "Un sobre en papel antiguo que dice «ábreme».",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const t = P.ajustes.tema;
      const p = nuevaPagina(P, { nombre: "Portada sobre", fondo: fondoDePapel("pergamino") });
      const s = Math.round(Math.min(W * 0.6, H * 0.34, 260)), sy = Math.round(H * 0.5 - s / 2);
      p.els.push(
        T(P, "Para ti", 24, Math.max(24, sy - Math.round(grande * 1.6) - 10), W - 48, { tam: grande, fuente: "Playfair Display", peso: 600, color: "#4a2e18", nombre: "Título", anim: entra("deslizar", 200), h: Math.round(grande * 1.4) }),
        nuevoEl("dibujo", P, { nombre: "Sobre", x: W / 2 - s / 2, y: sy, w: s, h: s, dibujo: { svg: dib("sobre"), color: "#9c3d2a" }, anim: { ...entra("zoom", 600), bucle: { tipo: "respirar", dur: 3000, repetir: "inf" } } }),
        T(P, "ábreme despacito", 24, sy + s + 14, W - 48, { tam: 26, fuente: "Caveat", color: t.acento, nombre: "Pista", anim: { ...entra("aparecer", 1400), bucle: { tipo: "brillar", dur: 2400, repetir: "inf" } } }),
      );
      return p;
    },
  },
  {
    id: "portada-minimal", cat: "portadas", n: "Portada minimal", d: "Mucho aire, un título elegante y una línea fina.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const t = P.ajustes.tema;
      const p = nuevaPagina(P, { nombre: "Portada minimal", fondo: { tipo: "color", color: "#ffffff" } });
      const x = Math.round(W * 0.1), w = W - x * 2, ty = Math.round(H * 0.58);
      p.els.push(
        T(P, "Nosotros", x, ty, w, { tam: Math.round(grande * 1.1), fuente: "Playfair Display", peso: 400, alin: "left", color: "#222222", nombre: "Título", anim: entra("revelar", 200, { dir: "derecha" }), h: Math.round(grande * 1.5) }),
        nuevoEl("forma", P, { nombre: "Línea", x, y: ty + Math.round(grande * 1.5) + 6, w: Math.round(w * 0.4), h: 3, forma: { figura: "rect", relleno: t.acento }, anim: entra("revelar", 800, { dir: "derecha" }) }),
        T(P, "nuestra historia, contada despacito", x, ty + Math.round(grande * 1.5) + 22, w, { tam: 17, fuente: "Jost", peso: 300, alin: "left", interletra: 1, color: "#555555", nombre: "Subtítulo", anim: entra("aparecer", 1200) }),
      );
      return p;
    },
  },
  {
    id: "portada-revista", cat: "portadas", n: "Revista", d: "Cabecera de revista, su nombre en dorado, foto con cinta, sticker «edición única» y el sello con su inicial para abrir.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const ancha = W >= H * 0.9; // en hoja cuadrada también va en dos columnas
      const oro = "#f2c27d";
      const p = nuevaPagina(P, { nombre: "Portada revista", fondo: { tipo: "gradiente", color: "#1a0b2c", gradiente: { a: "#4a1436", b: "#1a0b2c", angulo: 165 } } });
      // Columna de letras (arriba en vertical; a la izquierda en horizontal).
      const cx = ancha ? Math.round(W * 0.06) : 24, cw = ancha ? Math.round(W * 0.44) : W - 48;
      const nom = Math.round(Math.min(grande * 1.3, cw / 3.4)), y0 = ancha ? Math.round(H * 0.2) : Math.max(58, Math.round(H * 0.09));
      const yN = y0 + 62, hN = Math.round(nom * 1.4), yF = yN + hN + 4;
      p.els.push(
        nuevoEl("forma", P, { nombre: "Hilo dorado", x: cx, y: y0, w: cw, h: 1, opacidad: 0.7, forma: { figura: "rect", relleno: oro }, anim: entra("revelar", 100, { dir: "derecha" }) }),
        con(T(P, "Nº 01 · edición de amor · ♥", cx, y0 + 6, cw, { tam: 11, fuente: "Jost", peso: 500, interletra: 3, color: "#f6dcd2", nombre: "Cabecera", anim: entra("aparecer", 200), h: 18 }), {}),
        nuevoEl("forma", P, { nombre: "Hilo dorado", x: cx, y: y0 + 28, w: cw, h: 1, opacidad: 0.7, forma: { figura: "rect", relleno: oro }, anim: entra("revelar", 250, { dir: "izquierda" }) }),
        T(P, "un librito de amor para", cx, y0 + 38, cw, { tam: 13, fuente: "Jost", peso: 400, interletra: 2, color: "#e8cfa0", nombre: "Para", anim: entra("aparecer", 450), h: 20 }),
        con(T(P, "Mi amor", cx, yN, cw, { tam: nom, fuente: "Cormorant Garamond", peso: 600, color: oro, nombre: "Su nombre", anim: entra("desenfoque", 650), h: hN }), { texto: { sombra: { x: 0, y: 2, blur: 18, color: "rgba(242,194,125,.35)" } } }),
        nuevoEl("dibujo", P, { nombre: "Floritura", x: Math.round(cx + cw / 2 - 70), y: yF, w: 140, h: 14, dibujo: { svg: FLORITURA, color: oro, estirar: true }, anim: entra("revelar", 1000, { dir: "derecha" }) }),
        T(P, "mi amorcito", cx, yF + 18, cw, { tam: 28, fuente: "Caveat", peso: 500, color: "#ffa6cc", nombre: "Subtítulo", anim: { ...entra("aparecer", 1250), bucle: bucle("brillar", 2600) }, h: 40 }),
      );
      // La tapa con foto: dos hojas debajo, la foto con su cinta, el sticker y destellos.
      const s = Math.round(Math.max(52, Math.min(66, Math.min(W, H) * 0.17)));
      const sy = ancha ? Math.min(H - s - 40, yF + 80) : H - s - Math.round(H * 0.085);
      // En vertical, la foto va entre las letras (y lo que sobresale el sticker) y el sello.
      const pyV = Math.max(Math.round(H * 0.43), yF + 18 + 40 + 34);
      const ph = ancha ? Math.round(Math.min(H * 0.7, (W * 0.4) / 0.8)) : Math.round(Math.min(H * 0.36, W * 0.62 * 1.25, sy - 24 - pyV)), pw = Math.round(ph * 0.8);
      const px = ancha ? Math.round(W * 0.56 + (W * 0.4 - pw) / 2) : Math.round(W / 2 - pw / 2), py = ancha ? Math.round((H - ph) / 2) : pyV;
      const g = uid("g");
      p.els.push(
        nuevoEl("forma", P, { nombre: "Hoja de abajo", x: px - 8, y: py + 6, w: pw, h: ph, rot: -6, forma: { figura: "rect", relleno: "#ffe3ec" }, caja: { radio: 4 }, anim: entra("deslizar", 500) }),
        nuevoEl("forma", P, { nombre: "Hoja de abajo", x: px + 8, y: py + 8, w: pw, h: ph, rot: 5, forma: { figura: "rect", relleno: "#fff7f2" }, caja: { radio: 4 }, anim: entra("deslizar", 650) }),
        nuevoEl("imagen", P, { nombre: "Foto de la tapa", x: px, y: py, w: pw, h: ph, rot: -2, imagen: { marco: "cinta" }, anim: entra("zoom", 800) }),
        nuevoEl("forma", P, { nombre: "Sticker", grupo: g, x: px + pw - 46, y: py - 28, w: 76, h: 76, rot: 12, forma: { figura: "circulo", relleno: "#f4c46e", gradiente: { a: "#fffbe8", b: "#f4c46e", angulo: 160 } }, anim: { ...entra("pegar", 1500), bucle: bucle("balancear", 3200) } }),
        con(T(P, "edición<br>única ♥", px + pw - 46, py - 28, 76, { tam: 12, fuente: "Jost", peso: 700, interlinea: 1.15, color: "#7a1838", nombre: "Sticker (letras)", anim: { ...entra("pegar", 1500), bucle: bucle("balancear", 3200) }, h: 76 }), { grupo: g, rot: 12, texto: { valin: "centro" } }),
        nuevoEl("dibujo", P, { nombre: "Destellos", x: Math.max(4, px - 40, ancha ? cx + cw + 4 : 0), y: py + 34, w: 44, h: 44, dibujo: { svg: dib("brillos"), color: "#ffe4b8" }, anim: { ...entra("aparecer", 1700), bucle: bucle("brillar", 2400) } }),
        nuevoEl("dibujo", P, { nombre: "Destello", x: Math.min(W - 34, px + pw + 6), y: py + ph - 76, w: 28, h: 28, dibujo: { svg: dib("brillo"), color: oro }, anim: { ...entra("aparecer", 1900), bucle: bucle("parpadear", 3000) } }),
      );
      // El sello con su inicial: es el botón que abre el librito (pasa a la siguiente página).
      const sx = ancha ? Math.round(cx + cw / 2 - s / 2) : Math.round(W / 2 - s / 2);
      p.els.push(
        nuevoEl("boton", P, { nombre: "Sello (abre el librito)", x: sx, y: sy, w: s, h: s, boton: { texto: "M", fuente: "Cormorant Garamond", tam: Math.round(s * 0.5), peso: 600, color: oro, fondo: "#7a1838", radio: 999 }, accion: { tipo: "siguiente" }, anim: { ...entra("sello", 2000), bucle: bucle("palpitar", 2200) } }),
        T(P, "toca el sello para abrir", cx, sy + s + 6, cw, { tam: 12, fuente: "Jost", peso: 400, interletra: 1, color: "#cdb7c0", nombre: "Pista", anim: { ...entra("aparecer", 2400), bucle: bucle("brillar", 2800) }, h: 18 }),
      );
      return p;
    },
  },
  {
    id: "portada-tu-foto", cat: "portadas", n: "Con tu foto de fondo", d: "Tu foto a toda la hoja, como portada de revista, con el título encima.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const p = nuevaPagina(P, { nombre: "Portada con tu foto", fondo: { tipo: "gradiente", color: "#2a1830", gradiente: { a: "#5b2a4a", b: "#1c0f22", angulo: 170 } } });
      const ty = Math.round(H * 0.7);
      p.els.push(
        nuevoEl("imagen", P, { nombre: "Tu foto (portada)", x: 0, y: 0, w: W, h: H, ancla: { h: "estirar", v: "estirar" }, anim: entra("zoom", 0, { dur: 1400 }) }),
        // Sombra suave para que las letras se lean sobre cualquier foto (no estorba al tocar la foto).
        nuevoEl("forma", P, { nombre: "Sombra para las letras", x: 0, y: Math.round(H * 0.45), w: W, h: H - Math.round(H * 0.45), ancla: { h: "estirar", v: "abajo" }, permisos: { seleccionar: false }, forma: { figura: "rect", relleno: "transparent", gradiente: { a: "rgba(20,8,24,0)", b: "rgba(20,8,24,.78)", angulo: 180 } }, anim: entra("aparecer", 300) }),
        T(P, "Nº 01 · EDICIÓN DE AMOR", 22, 24, Math.round(Math.max(200, Math.min(W - 150, 260))), { tam: 11, fuente: "Jost", peso: 600, interletra: 2, alin: "left", color: "#ffffff", nombre: "Cabecera", anim: entra("aparecer", 400), h: 18 }),
        con(T(P, "Nuestro librito", 22, ty, W - 44, { tam: Math.round(grande * 1.05), fuente: "Playfair Display", peso: 600, alin: "left", color: "#ffffff", nombre: "Título", anim: entra("revelar", 700, { dir: "derecha" }), h: Math.round(grande * 1.35) }), { texto: { sombra: { x: 0, y: 2, blur: 14, color: "rgba(0,0,0,.35)" } } }),
        T(P, "para ti, mi amor", 22, ty + Math.round(grande * 1.35) + 4, W - 44, { tam: 26, fuente: "Caveat", alin: "left", color: "#ffd6e5", nombre: "Subtítulo", anim: entra("aparecer", 1200), h: 38 }),
        nuevoEl("dibujo", P, { nombre: "Corazón", x: W - 70, y: ty - 54, w: 40, h: 40, dibujo: { svg: dib("corazon"), color: "#ff8fb5" }, anim: { ...entra("latido", 1500), bucle: bucle("latir", 1600) } }),
        nuevoEl("dibujo", P, { nombre: "Destellos", x: W - 64, y: Math.round(H * 0.4), w: 40, h: 40, dibujo: { svg: dib("brillos"), color: "#fff3cf" }, anim: { ...entra("aparecer", 1800), bucle: bucle("brillar", 2600) } }),
      );
      return p;
    },
  },
  {
    id: "portada-corazones", cat: "portadas", n: "Lluvia de corazones", d: "Corazoncitos que caen y flotan, y un «te amo» que respira.",
    crear: (P) => {
      const { W, H, grande } = M(P);
      const p = nuevaPagina(P, { nombre: "Lluvia de corazones", fondo: { tipo: "gradiente", color: "#ffd0e1", gradiente: { a: "#ffe6f0", b: "#ffb8d2", angulo: 170 } } });
      const cols = ["#ff5c93", "#ff8fb5", "#e0457f", "#ffb3cb"];
      // Posiciones fijas (en proporción) para que siempre quede bonito y nada tape el título.
      const sitios = [[0.08, 0.12, 30], [0.78, 0.2, 22], [0.18, 0.3, 18], [0.86, 0.38, 34], [0.06, 0.62, 26], [0.8, 0.66, 20], [0.24, 0.82, 32], [0.66, 0.86, 24], [0.46, 0.1, 16]];
      sitios.forEach(([fx, fy, s], i) => p.els.push(nuevoEl("dibujo", P, { nombre: "Corazoncito", x: Math.round(fx * W), y: Math.round(fy * H), w: s, h: s, opacidad: i % 3 ? 0.85 : 1, dibujo: { svg: dib("corazon"), color: cols[i % cols.length] }, anim: { ...entra("caer", 150 + i * 160), bucle: bucle("flotar", 2600 + (i % 4) * 500) } })));
      const c = Math.round(Math.min(W, H) * 0.62), ty = Math.round(H * 0.42);
      // La franja de las letras queda libre: el corazoncito que caiga ahí se sube o se baja.
      const fa = ty - 10, fb = ty + Math.round(grande * 1.9) + 44;
      for (const e of p.els) if (e.nombre === "Corazoncito" && e.y + e.h > fa && e.y < fb) e.y = e.y + e.h / 2 < (fa + fb) / 2 ? Math.max(4, fa - e.h - 6) : Math.min(H - e.h - 4, fb + 6);
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Corazón grande", x: Math.round(W / 2 - c / 2), y: Math.round(ty + grande * 0.75 - c / 2), w: c, h: c, opacidad: 0.2, dibujo: { svg: dib("corazon"), color: "#ff5c93" }, anim: { ...entra("zoom", 300), bucle: bucle("palpitar", 1800) } }),
        T(P, "Te amo", 24, ty, W - 48, { tam: Math.round(grande * 1.45), fuente: "Dancing Script", peso: 700, color: "#c2185b", nombre: "Título", anim: { ...entra("latido", 900), bucle: bucle("respirar", 3200) }, h: Math.round(grande * 1.9) }),
        T(P, "y cada página de aquí es para ti", 36, ty + Math.round(grande * 1.9) + 4, W - 72, { tam: 19, fuente: "Quicksand", peso: 500, color: "#7a2448", nombre: "Subtítulo", anim: entra("revelar", 1500, { dir: "derecha" }), h: 30 }),
      );
      return p;
    },
  },
  {
    id: "portada-polaroids", cat: "portadas", n: "Tres polaroids", d: "Tres fotos que caen una tras otra sobre papel kraft.",
    crear: (P) => {
      const { W, H, ancha, grande } = M(P);
      const p = nuevaPagina(P, { nombre: "Tres polaroids", fondo: fondoDePapel("kraft") });
      const fw = Math.round(ancha ? Math.min(W * 0.22, H * 0.42) : W * 0.42), fh = Math.round(fw * 1.18);
      const base = ancha ? [[0.12, 0.14, -10], [0.38, 0.1, 3], [0.64, 0.16, 11]] : [[0.05, 0.13, -10], [0.29, 0.09, 3], [0.53, 0.15, 11]];
      base.forEach(([fx, fy, r], i) => p.els.push(nuevoEl("imagen", P, { nombre: "Foto " + (i + 1), x: Math.round(fx * W), y: Math.round(fy * H), w: fw, h: fh, rot: r, imagen: { marco: "polaroid" }, anim: entra("caer", 200 + i * 300) })));
      const ty = Math.round(Math.max(H * 0.6, H * 0.15 + fh + 30));
      p.els.push(
        T(P, "Nuestros momentos", 24, ty, W - 48, { tam: Math.round(Math.min(grande * 1.1, (W - 48) / 7.4)), fuente: "Caveat", peso: 700, color: "#3b2412", nombre: "Título", anim: entra("revelar", 1300, { dir: "derecha" }), h: Math.round(grande * 1.4) }),
        T(P, "los guardo todos, uno por uno", 32, ty + Math.round(grande * 1.4) + 2, W - 64, { tam: 16, fuente: "Jost", peso: 400, interletra: 1, color: "#5a3a22", nombre: "Subtítulo", anim: entra("aparecer", 1700), h: 26 }),
        nuevoEl("dibujo", P, { nombre: "Corazón", x: Math.round(W / 2 - 22), y: ty + Math.round(grande * 1.4) + 40, w: 44, h: 44, dibujo: { svg: dib("corazon"), color: "#c8102e" }, anim: { ...entra("pegar", 2000), bucle: bucle("latir", 1600) } }),
      );
      return p;
    },
  },
  {
    id: "portada-cine", cat: "portadas", n: "Estreno", d: "Como un póster de cine: estreno, cinco estrellas y nuestra historia.",
    crear: (P) => {
      const { W, H, ancha, grande } = M(P);
      const oro = "#f2c27d";
      const p = nuevaPagina(P, { nombre: "Estreno", fondo: { tipo: "gradiente", color: "#0e0a12", gradiente: { a: "#241a2e", b: "#0b0810", angulo: 180 } } });
      // Arriba queda libre para el botón de música; en horizontal, foto a la izquierda y letras a la derecha.
      const cx = ancha ? Math.round(W * 0.54) : 24, cw = ancha ? Math.round(W * 0.42) : W - 48;
      const fx = ancha ? Math.round(W * 0.06) : 30, fw = ancha ? Math.round(W * 0.42) : W - 60;
      const fy = ancha ? Math.round(H * 0.16) : Math.max(92, Math.round(H * 0.14)), fh = ancha ? Math.round(H * 0.68) : Math.round(H * 0.3);
      const tam = Math.round(Math.min(grande * 1.3, cw / 4.6)), hT = Math.round(tam * 1.45);
      const ey = ancha ? Math.round(H * 0.2) : fy - 32, ty = ancha ? ey + 34 : fy + fh + Math.round(H * 0.045);
      p.els.push(
        T(P, "ESTRENO EXCLUSIVO", cx, ey, cw, { tam: 12, fuente: "Jost", peso: 600, interletra: 6, color: oro, nombre: "Estreno", anim: entra("destello", 100), h: 20 }),
        nuevoEl("imagen", P, { nombre: "Foto (póster)", x: fx, y: fy, w: fw, h: fh, imagen: { marco: "doble" }, anim: entra("desenfoque", 400) }),
        con(T(P, "Nosotros", cx, ty, cw, { tam, fuente: "Playfair Display", peso: 700, color: "#ffffff", nombre: "Título", anim: entra("zoom", 900), h: hT }), { texto: { sombra: { x: 0, y: 0, blur: 22, color: "rgba(242,194,125,.45)" } } }),
        T(P, "una historia de amor a distancia", cx, ty + hT + 2, cw, { tam: 20, fuente: "Cormorant Garamond", cursiva: true, color: "#e9d9c8", nombre: "Subtítulo", anim: entra("aparecer", 1400), h: 30 }),
        T(P, "★ ★ ★ ★ ★", cx, ty + hT + 40, cw, { tam: 18, fuente: "Jost", color: oro, interletra: 2, nombre: "Estrellas", anim: { ...entra("destello", 1800), bucle: bucle("brillar", 2600) }, h: 28 }),
        T(P, "muy pronto, en tu corazón", cx, Math.max(ty + hT + 80, H - Math.round(H * 0.09)), cw, { tam: 13, fuente: "Jost", peso: 400, interletra: 2, color: "#bfb2c6", nombre: "Pie", anim: entra("aparecer", 2300), h: 22 }),
      );
      return p;
    },
  },
  {
    id: "carta", cat: "cartas", n: "Carta romántica", d: "Espacio para una carta, una foto y decoración.",
    crear: (P) => {
      const { W, H, ancha } = M(P);
      const t = P.ajustes.tema;
      const p = nuevaPagina(P, { nombre: "Carta", fondo: { tipo: "color", color: "#fffaf3" } });
      const fh = Math.round(Math.min(220, H * (ancha ? 0.5 : 0.3))), fw = Math.round(fh * 0.86);
      const fx = ancha ? W - fw - 56 : W / 2 - fw / 2, fy = ancha ? Math.round((H - fh) / 2 - 20) : H - fh - 112;
      const tw = ancha ? fx - 34 - 40 : W - 68, th = Math.max(110, (ancha ? H - 80 : fy - 24) - 130);
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Esquina", x: 14, y: 14, w: 70, h: 70, opacidad: 0.6, dibujo: { svg: dib("esquina"), color: t.acento } }),
        T(P, "Mi amor:", 34, 70, tw, { tam: 34, alin: "left", fuente: "Caveat", color: t.acento, nombre: "Saludo", anim: entra("revelar", 200, { dir: "derecha" }) }),
        T(P, "Escribe aquí tu carta. Lo que sientes, lo que extrañas, lo que sueñas con ella…", 34, 130, tw, { tam: 19, alin: "left", fuente: "Cormorant Garamond", interlinea: 1.6, h: th, nombre: "Carta", anim: entra("aparecer", 700) }),
        nuevoEl("imagen", P, { nombre: "Foto", x: fx, y: fy, w: fw, h: fh, rot: -3, imagen: { marco: "polaroid" }, anim: entra("zoom", 1200) }),
        T(P, "con amor, siempre", fx + fw / 2 - 120, Math.min(H - 60, fy + fh + 22), 240, { tam: 26, fuente: "Caveat", color: t.texto, nombre: "Firma", anim: entra("aparecer", 1600) }),
      );
      return p;
    },
  },
  {
    id: "album", cat: "fotos", n: "Álbum", d: "Un álbum de fotos en cuadrícula con título.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Álbum", fondo: { tipo: "color", color: t.fondo } });
      p.els.push(
        T(P, "Nuestros momentos", 24, 50, W - 48, { tam: 36, peso: 600, fuente: t.fuenteTitulos, nombre: "Título", anim: entra("deslizar") }),
        nuevoEl("album", P, { nombre: "Álbum", x: 20, y: 120, w: W - 40, h: H - 180 }),
      );
      return p;
    },
  },
  {
    id: "galeria", cat: "fotos", n: "Galería", d: "Fotos sueltas como polaroids sobre la mesa.",
    crear: (P) => {
      const { ancho: W, alto: H } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Galería", fondo: { tipo: "gradiente", color: "#f6ebe3", gradiente: { a: "#fbf1ea", b: "#efd9cc", angulo: 180 } } });
      p.els.push(
        T(P, "Cositas nuestras", 24, 40, W - 48, { tam: 34, fuente: "Caveat", nombre: "Título" }),
        nuevoEl("album", P, { nombre: "Polaroids", x: 10, y: 100, w: W - 20, h: H - 170, album: { disposicion: "polaroids", cascada: { tipo: "latido", paso: 160, dur: 700 } } }),
      );
      return p;
    },
  },
  {
    id: "carrusel", cat: "fotos", n: "Carrusel", d: "Fotos que pasan solas, con un texto debajo.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Carrusel", fondo: { tipo: "color", color: "#1b1222" } });
      p.els.push(
        nuevoEl("carrusel", P, { nombre: "Carrusel", x: 24, y: 90, w: W - 48, h: Math.round(H * 0.58), carrusel: { modo: "cartas" } }),
        T(P, "Cada foto, un día contigo", 30, Math.round(H * 0.58) + 120, W - 60, { tam: 26, cursiva: true, color: "#ffe9f1", nombre: "Texto", anim: entra("aparecer", 600) }),
      );
      return p;
    },
  },
  {
    id: "musica", cat: "mas", n: "Página con música", d: "Una canción para esta página, su nombre y un botón.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const d = Math.round(Math.min(220, H * 0.32, W * 0.56)), y0 = Math.round(Math.max(30, H * 0.13)), cd = Math.round(d * 0.31);
      const ty = y0 + d + 28, ny = ty + 54, by = Math.max(ny + 52, Math.min(H - 150, ny + 140));
      const p = nuevaPagina(P, { nombre: "Nuestra canción", fondo: { tipo: "gradiente", color: "#2a1633", gradiente: { a: "#3a1d47", b: "#14091b", angulo: 170, tipo: "radial" } }, musica: { modo: "propia", asset: null, volumen: 0.85, bucle: true } });
      p.els.push(
        nuevoEl("forma", P, { nombre: "Disco", x: W / 2 - d / 2, y: y0, w: d, h: d, forma: { figura: "circulo", relleno: "#0d060f", grosor: 10, trazo: "#2b1830" }, anim: { ...entra("zoom", 200), bucle: { tipo: "girar", dur: 6000, repetir: "inf" } } }),
        nuevoEl("forma", P, { nombre: "Centro del disco", x: W / 2 - cd / 2, y: y0 + d / 2 - cd / 2, w: cd, h: cd, forma: { figura: "circulo", relleno: t.acento }, anim: entra("zoom", 400) }),
        T(P, "Nuestra canción", 24, ty, W - 48, { tam: 34, peso: 600, color: "#fff", nombre: "Título", anim: entra("deslizar", 600) }),
        T(P, "elige la canción en Audio → «Esta página»", 30, ny, W - 60, { tam: 16, fuente: "Jost", peso: 400, color: "#e8cde0", nombre: "Nota", anim: entra("aparecer", 900) }),
        nuevoEl("boton", P, { nombre: "Pausar música", x: W / 2 - 100, y: by, w: 200, h: 52, boton: { texto: "♪ pausar / poner", estilo: "vidrio" }, accion: { tipo: "musica" }, anim: entra("aparecer", 1200) }),
      );
      return p;
    },
  },
  {
    id: "frase", cat: "cartas", n: "Frase grande", d: "Una frase centrada con brillitos.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Frase", fondo: { tipo: "gradiente", color: t.fondo, gradiente: { a: "#fff2f6", b: "#ffd6e6", angulo: 200, tipo: "radial" } } });
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Brillos", x: W - 110, y: Math.max(16, H * 0.36 - 84), w: 70, h: 70, dibujo: { svg: dib("brillos"), color: "#f2c27d" }, anim: { ...entra("aparecer", 900), bucle: { tipo: "respirar", dur: 2600, repetir: "inf" } } }),
        T(P, "«Eres mi lugar favorito, aunque estés lejos»", 30, H * 0.36, W - 60, { tam: 34, cursiva: true, interlinea: 1.25, h: 160, nombre: "Frase", anim: entra("desenfoque", 200) }),
        nuevoEl("dibujo", P, { nombre: "Subrayado", x: W / 2 - 80, y: H * 0.36 + 170, w: 160, h: 40, dibujo: { svg: dib("subrayado"), color: t.acento, estirar: true }, anim: entra("revelar", 1100, { dir: "derecha" }) }),
      );
      return p;
    },
  },
  {
    id: "foto-frase", cat: "fotos", n: "Foto con frase", d: "Una foto grande y unas palabras.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Foto con frase", fondo: { tipo: "color", color: "#fff7f2" } });
      p.els.push(
        nuevoEl("imagen", P, { nombre: "Foto", x: 24, y: 70, w: W - 48, h: Math.round(H * 0.56), caja: { radio: 22, sombra: { x: 0, y: 14, blur: 30, color: "rgba(80,30,60,.25)" } }, anim: entra("zoom", 100) }),
        T(P, "Aquí va lo que esta foto significa para mí", 30, Math.round(H * 0.56) + 100, W - 60, { tam: 26, cursiva: true, nombre: "Frase", anim: entra("deslizar", 700) }),
      );
      return p;
    },
  },
  {
    id: "libre", cat: "empezar", n: "Página libre", d: "Fondo suave y guías: para armar lo que quieras.",
    crear: (P) => nuevaPagina(P, { nombre: "Página libre", fondo: { tipo: "gradiente", color: "#fff", gradiente: { a: "#ffffff", b: "#fdeef4", angulo: 180 } } }),
  },
  {
    id: "html", cat: "mas", n: "Página HTML", d: "Tu propio HTML a toda la hoja, aislado y seguro.",
    crear: (P) => {
      const { ancho: W, alto: H } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Página HTML" });
      p.els.push(nuevoEl("html", P, { nombre: "HTML", x: 0, y: 0, w: W, h: H, ancla: { h: "estirar", v: "estirar" }, html: { codigo: '<div style="height:100%;display:grid;place-items:center;background:linear-gradient(160deg,#ffe9f1,#ffc4d9);font:600 28px Georgia,serif;color:#8e2f86">Tu HTML aquí 🤍</div>', interactivo: true } }));
      return p;
    },
  },
];

/**
 * Pone una foto (un asset ya subido) en una portada recién hecha: en su primer
 * hueco de foto si tiene, y si no, de fondo de la hoja.
 */
export function ponerFotoDePortada(pg, asset) {
  const hueco = pg.els.find((e) => e.tipo === "imagen" && !e.imagen?.asset);
  if (hueco) { hueco.imagen.asset = asset; return hueco; }
  pg.fondo = { ...(pg.fondo || {}), imagen: { asset, ajuste: "cover", pos: "center", opacidad: 1 } };
  return null;
}

/** ¿La plantilla trae un hueco para foto? */
export const tieneHuecoDeFoto = (pg) => pg.els.some((e) => e.tipo === "imagen" && !e.imagen?.asset);

// El botón de música de cada plantilla se va al rincón que tenga libre.
for (const t of PLANTILLAS) {
  const crear = t.crear;
  t.crear = (P) => { const p = crear(P); rinconParaMusica(p, P.ajustes.ancho, P.ajustes.alto); return p; };
}
