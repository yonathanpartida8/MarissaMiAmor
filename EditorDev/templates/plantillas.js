/**
 * PLANTILLAS — puntos de partida ligeros.
 *
 * Ninguna trae fotos ni canciones: traen el hueco («+ Añadir foto») y tú
 * pones lo tuyo. Son JSON de unos pocos cientos de bytes.
 */
import { nuevaPagina, nuevoEl } from "../core/modelo.js";
import { DIBUJOS } from "../assets/dibujos.js";

const dib = (id) => DIBUJOS.find((d) => d.id === id)?.svg || "";
const entra = (tipo, retraso = 0, extra = {}) => ({ entrada: { tipo, dur: 900, retraso, facil: "suave", dir: "arriba", dist: 30, ...extra }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null });

function T(P, texto, x, y, w, op = {}) {
  const t = P.ajustes.tema;
  return nuevoEl("texto", P, { x, y, w, h: op.h || Math.round((op.tam || 28) * 1.5), nombre: op.nombre || "Texto", anim: op.anim, texto: { html: texto, fuente: op.fuente || t.fuente, tam: op.tam || 28, peso: op.peso || 500, cursiva: !!op.cursiva, alin: op.alin || "center", color: op.color || t.texto, interlinea: op.interlinea || 1.3, interletra: op.interletra || 0 } });
}

export const PLANTILLAS = [
  {
    id: "vacia", n: "Página vacía", d: "Hoja completamente en blanco.",
    crear: (P) => nuevaPagina(P, { nombre: "Página en blanco" }),
  },
  {
    id: "portada", n: "Portada", d: "Título grande, un subtítulo y un corazón que late.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Portada", fondo: { tipo: "gradiente", color: t.fondo, gradiente: { a: "#ffe9f1", b: "#ffc4d9", angulo: 170, tipo: "lineal" } } });
      const c = nuevoEl("dibujo", P, { nombre: "Corazón", x: W / 2 - 46, y: H * 0.3, w: 92, h: 92, dibujo: { svg: dib("corazon"), color: t.acento }, anim: { ...entra("latido", 200), bucle: { tipo: "palpitar", dur: 1600, repetir: "inf" } } });
      p.els.push(c,
        T(P, "Nuestro librito", 24, H * 0.42, W - 48, { tam: 48, peso: 600, fuente: t.fuenteTitulos, nombre: "Título", anim: entra("deslizar", 500), h: 70 }),
        T(P, "para ti, con todo mi corazón", 40, H * 0.42 + 80, W - 80, { tam: 22, cursiva: true, nombre: "Subtítulo", anim: entra("aparecer", 1000) }),
        T(P, "toca la flecha para empezar →", 40, H - 110, W - 80, { tam: 15, fuente: "Jost", peso: 400, color: t.acento, nombre: "Pista", anim: { ...entra("aparecer", 1800), bucle: { tipo: "brillar", dur: 2400, repetir: "inf" } } }));
      return p;
    },
  },
  {
    id: "carta", n: "Carta romántica", d: "Espacio para una carta, una foto y decoración.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Carta", fondo: { tipo: "color", color: "#fffaf3" } });
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Esquina", x: 14, y: 14, w: 70, h: 70, opacidad: 0.6, dibujo: { svg: dib("esquina"), color: t.acento } }),
        T(P, "Mi amor:", 34, 70, W - 68, { tam: 34, alin: "left", fuente: "Caveat", color: t.acento, nombre: "Saludo", anim: entra("revelar", 200, { dir: "derecha" }) }),
        T(P, "Escribe aquí tu carta. Lo que sientes, lo que extrañas, lo que sueñas con ella…", 34, 130, W - 68, { tam: 19, alin: "left", fuente: "Cormorant Garamond", interlinea: 1.6, h: 260, nombre: "Carta", anim: entra("aparecer", 700) }),
        nuevoEl("imagen", P, { nombre: "Foto", x: W / 2 - 95, y: H - 330, w: 190, h: 220, rot: -3, imagen: { marco: "polaroid" }, anim: entra("zoom", 1200) }),
        T(P, "con amor, siempre", W / 2 - 120, H - 92, 240, { tam: 26, fuente: "Caveat", color: t.texto, nombre: "Firma", anim: entra("aparecer", 1600) }),
      );
      return p;
    },
  },
  {
    id: "album", n: "Álbum", d: "Un álbum de fotos en cuadrícula con título.",
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
    id: "galeria", n: "Galería", d: "Fotos sueltas como polaroids sobre la mesa.",
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
    id: "carrusel", n: "Carrusel", d: "Fotos que pasan solas, con un texto debajo.",
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
    id: "musica", n: "Página con música", d: "Una canción para esta página, su nombre y un botón.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Nuestra canción", fondo: { tipo: "gradiente", color: "#2a1633", gradiente: { a: "#3a1d47", b: "#14091b", angulo: 170, tipo: "radial" } }, musica: { modo: "propia", asset: null, volumen: 0.85, bucle: true } });
      p.els.push(
        nuevoEl("forma", P, { nombre: "Disco", x: W / 2 - 110, y: H * 0.2, w: 220, h: 220, forma: { figura: "circulo", relleno: "#0d060f", grosor: 10, trazo: "#2b1830" }, anim: { ...entra("zoom", 200), bucle: { tipo: "girar", dur: 6000, repetir: "inf" } } }),
        nuevoEl("forma", P, { nombre: "Centro del disco", x: W / 2 - 34, y: H * 0.2 + 76, w: 68, h: 68, forma: { figura: "circulo", relleno: t.acento }, anim: entra("zoom", 400) }),
        T(P, "Nuestra canción", 24, H * 0.2 + 260, W - 48, { tam: 34, peso: 600, color: "#fff", nombre: "Título", anim: entra("deslizar", 600) }),
        T(P, "elige la canción en Audio → «Esta página»", 30, H * 0.2 + 316, W - 60, { tam: 16, fuente: "Jost", peso: 400, color: "#e8cde0", nombre: "Nota", anim: entra("aparecer", 900) }),
        nuevoEl("boton", P, { nombre: "Pausar música", x: W / 2 - 100, y: H - 150, w: 200, h: 52, boton: { texto: "♪ pausar / poner", estilo: "vidrio" }, accion: { tipo: "musica" }, anim: entra("aparecer", 1200) }),
      );
      return p;
    },
  },
  {
    id: "frase", n: "Frase grande", d: "Una frase centrada con brillitos.",
    crear: (P) => {
      const { ancho: W, alto: H, tema: t } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Frase", fondo: { tipo: "gradiente", color: t.fondo, gradiente: { a: "#fff2f6", b: "#ffd6e6", angulo: 200, tipo: "radial" } } });
      p.els.push(
        nuevoEl("dibujo", P, { nombre: "Brillos", x: W - 110, y: H * 0.26, w: 70, h: 70, dibujo: { svg: dib("brillos"), color: "#f2c27d" }, anim: { ...entra("aparecer", 900), bucle: { tipo: "respirar", dur: 2600, repetir: "inf" } } }),
        T(P, "«Eres mi lugar favorito, aunque estés lejos»", 30, H * 0.36, W - 60, { tam: 34, cursiva: true, interlinea: 1.25, h: 160, nombre: "Frase", anim: entra("desenfoque", 200) }),
        nuevoEl("dibujo", P, { nombre: "Subrayado", x: W / 2 - 80, y: H * 0.36 + 170, w: 160, h: 40, dibujo: { svg: dib("subrayado"), color: t.acento, estirar: true }, anim: entra("revelar", 1100, { dir: "derecha" }) }),
      );
      return p;
    },
  },
  {
    id: "foto-frase", n: "Foto con frase", d: "Una foto grande y unas palabras.",
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
    id: "libre", n: "Página libre", d: "Fondo suave y guías: para armar lo que quieras.",
    crear: (P) => nuevaPagina(P, { nombre: "Página libre", fondo: { tipo: "gradiente", color: "#fff", gradiente: { a: "#ffffff", b: "#fdeef4", angulo: 180 } } }),
  },
  {
    id: "html", n: "Página HTML", d: "Tu propio HTML a toda la hoja, aislado y seguro.",
    crear: (P) => {
      const { ancho: W, alto: H } = P.ajustes;
      const p = nuevaPagina(P, { nombre: "Página HTML" });
      p.els.push(nuevoEl("html", P, { nombre: "HTML", x: 0, y: 0, w: W, h: H, ancla: { h: "estirar", v: "estirar" }, html: { codigo: '<div style="height:100%;display:grid;place-items:center;background:linear-gradient(160deg,#ffe9f1,#ffc4d9);font:600 28px Georgia,serif;color:#8e2f86">Tu HTML aquí 🤍</div>', interactivo: true } }));
      return p;
    },
  },
];
