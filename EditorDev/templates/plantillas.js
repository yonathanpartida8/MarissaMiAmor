/**
 * PLANTILLAS — puntos de partida ligeros.
 *
 * Ninguna trae fotos ni canciones: traen el hueco («+ Añadir foto») y tú
 * pones lo tuyo. Son JSON de unos pocos cientos de bytes.
 */
import { nuevaPagina, nuevoEl } from "../core/modelo.js";
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

/** Grupos de la galería de plantillas. */
export const GRUPOS_PLANTILLAS = [["empezar", "Para empezar"], ["portadas", "Portadas"], ["fotos", "Fotos"], ["cartas", "Cartas y frases"], ["mas", "Música y más"]];

export const PLANTILLAS = [
  {
    id: "vacia", cat: "empezar", n: "Página vacía", d: "Hoja completamente en blanco.",
    crear: (P) => nuevaPagina(P, { nombre: "Página en blanco" }),
  },
  {
    id: "portada", cat: "portadas", n: "Portada", d: "Título grande, un subtítulo y un corazón que late.",
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
        nuevoEl("album", P, { nombre: "Polaroids", x: 10, y: 100, w: W - 20, h: H - 140, album: { disposicion: "polaroids", cascada: { tipo: "latido", paso: 160, dur: 700 } } }),
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
