/**
 * (Fase 71) LAS CUATRO VISTAS DIBUJADAS A MANO: de frente (su dibujo de siempre), de lado y de espaldas.
 *
 * Cada mueble principal trae, cuadrito por cuadrito (1 = 4 del mundo, igual que su frente):
 *   · `D`: qué tan hondo es (en cuadritos).
 *   · `lado(v, z, u)`: su costado —la forma y el color de cada cuadrito—: v es el renglón (el MISMO renglón de su
 *     dibujo de frente), z va de 0 (enfrente) a D-1 (atrás). Regresa la letra del color o null (ahí no hay nada).
 *     La forma del mueble es su silueta de frente cruzada con su costado: así una silla tiene sus cuatro patas en las
 *     esquinas y su travesaño, un sofá su brazo enrollado y su respaldo atrás, una tina sus patitas.
 *   · `brazos` y `centro(v, z, u)`: lo de en medio (entre los brazos de un sofá: el cojín del asiento, más bajito).
 *   · `atras(u, v)`: el color de la espalda (u, de izquierda a derecha como en su frente; null = el de su frente).
 *   · `pal(C)`: colores propios (además de la paleta común y la rampa del color elegido: ( ) [ ] { ).
 * Los colores se ajustan solos a los de su frente (el mismo rosa, la misma madera), así combinan siempre.
 */
import { tono } from "./arte.js";

/** El respaldo de un sofá o sillón: de z0 a D-1 (atrás), con su orilla de arriba redondita. */
const respaldo = (v, z, z0, arriba, D) => {
  if (v < arriba || z < z0) return null;
  if (v === arriba && (z < z0 + 2 || z > D - 3)) return null;
  if (v === arriba + 1 && (z < z0 + 1 || z > D - 2)) return null;
  return v <= arriba + 1 ? "]" : z === D - 1 ? ")" : "[";
};
/** El rollo de un brazo enrollado (visto de lado: un círculo con su vuelta). */
const rollo = (v, z, cz, cv, r) => { const d = Math.hypot(z + 0.5 - cz, v + 0.5 - cv); return d < r ? (d > r - 1 ? ")" : "]") : null; };

export const VISTAS = {
  // ── El sofá: brazos enrollados que van de adelante hasta atrás, respaldo atrás, cojín en medio y cuatro patas. ──
  sofa: {
    D: 19, brazos: 9,
    lado(v, z) {
      if (v >= 28) return z === 2 || z === 3 || z === 15 || z === 16 ? (v === 30 ? "c" : "d") : null;
      if (v === 27) return z >= 1 && z <= 17 ? ")" : null;
      if (v >= 23) return v === 23 || v === 26 ? ")" : "[";
      if (v >= 12) {
        if ((v === 12 && z < 2) || (v === 13 && z < 1)) return null;
        return rollo(v, z, 2.6, 15.3, 2.8) || (v <= 13 ? "]" : "[");
      }
      return respaldo(v, z, 12, 3, 19);
    },
    centro(v, z) {
      if (v >= 28) return null;
      if (v === 27) return z >= 1 && z <= 17 ? ")" : null;
      if (v >= 23) return v === 23 || v === 26 ? ")" : "[";
      if (v >= 16) return v === 16 ? (z ? "{" : null) : v === 22 ? ")" : "]";
      return respaldo(v, z, 12, 3, 19);
    },
    atras(u, v) {
      if (v >= 28) return null;
      if (v === 27) return ")";
      if (v >= 23) return v === 23 || v === 26 ? ")" : "[";
      if ((u < 9 || u >= 46) && v >= 12) return v <= 13 ? "]" : "[";
      if (v <= 4) return "]";
      return u === 19 || u === 36 ? ")" : v >= 21 ? ")" : "[";
    },
  },
  // ── El sillón de lectura (orejero): respaldo alto atrás, brazos enrollados y patas torneadas. ──
  sillon_lectura: {
    D: 13, brazos: 5,
    lado(v, z) {
      if (v >= 25) return z === 1 || z === 2 || z === 10 || z === 11 ? (v === 31 ? "b" : v % 2 ? "c" : "d") : null;
      if (v === 24) return z >= 1 && z <= 11 ? ")" : null;
      if (v >= 12) {
        if (v === 12 && z < 2) return null;
        return rollo(v, z, 2.3, 14.6, 2.4) || (v <= 13 ? "]" : v >= 22 ? ")" : "[");
      }
      return respaldo(v, z, 8, 1, 13);
    },
    centro(v, z) {
      if (v >= 24) return v === 24 && z >= 1 && z <= 11 ? ")" : null;
      if (v >= 15) return v === 15 ? (z ? "{" : null) : v === 23 ? ")" : "]";
      return respaldo(v, z, 8, 1, 13);
    },
    atras(u, v) {
      if (v >= 25) return null;
      if (v === 24) return ")";
      if (u < 5 || u > 21) return v >= 12 ? (v <= 13 ? "]" : "[") : null;
      return v <= 2 ? "]" : u === 13 ? ")" : "[";
    },
  },
  // ── La silla (pixel): respaldo acolchado atrás, asiento, cuatro patas con su travesaño. ──
  silla: {
    D: 8,
    lado(v, z) {
      if (v >= 17) {
        const pata = z <= 1 || z >= 6;
        if (!pata) return v === 22 ? "b" : null;
        return v === 27 ? "a" : z % 2 ? "b" : "c";
      }
      if (v >= 14) return v === 14 ? "]" : v === 15 ? "[" : ")";
      if (z < 6) return null;
      return v === 0 || z === 7 ? ")" : v <= 2 ? "]" : "[";
    },
    atras(u, v) {
      if (v >= 17) return null;
      if (v >= 14) return ")";
      return v === 0 || v === 13 || u <= 2 || u >= 13 ? ")" : u === 7 || u === 8 ? "]" : "[";
    },
  },
  // ── La silla de escritorio: respaldo curvo, asiento, pistón, la estrella y sus ruedas. ──
  silla_esc: {
    D: 8,
    lado(v, z) {
      if (v >= 25) return z <= 1 || z >= 6 ? "0" : null;
      if (v >= 23) return z >= 1 && z <= 6 ? "h" : null;
      if (v >= 17) return z >= 3 && z <= 4 ? (v === 17 ? "g" : "i") : null;
      if (v >= 13) return v === 13 ? "]" : v === 16 ? ")" : "[";
      if (v < 1) return null;
      if (z < 6 && !(v >= 4 && v <= 9 && z === 5)) return null;
      return z === 7 ? ")" : v <= 2 ? "]" : "[";
    },
    atras(u, v) {
      if (v >= 17) return null;
      if (v >= 13) return ")";
      return v <= 1 || u <= 3 || u >= 12 ? ")" : "[";
    },
  },
  // ── La cama: de un lado su cabecera acolchada con botoncitos; del otro, almohadas, sábana y la cobija que cae. ──
  cama: {
    D: 20,
    pal: (C) => ({ "<": tono(C, 0.85), ">": tono(C, 0.62) }),
    lado(v, z, u) {
      if (v >= 29) return z === 1 || z === 2 || z === 17 || z === 18 ? (v >= 31 ? "b" : "c") : null;
      if (v === 0) return null;
      if ((v === 1 && (z < 5 || z > 14)) || (v === 2 && (z < 3 || z > 16)) || (v === 3 && (z < 1 || z > 18))) return null;
      if (u < 10) {
        if (v <= 3) return "[";
        if (v === 28) return ">";
        return v % 4 === 2 && z % 4 === 2 ? ">" : "<";
      }
      if (v <= 14) return z === 0 || z === 19 ? "k" : "#";
      if (v === 15) return "k";
      if (v === 16) return "]";
      if (v === 28) return ")";
      return v % 5 === 1 && z % 5 === 2 ? "{" : "[";
    },
  },
  // ── La tina: de lado se ve su panza redonda, el borde, la llave al fondo y sus patitas. ──
  tina: {
    D: 19,
    lado(v, z, u) {
      if (v <= 8) return u >= 46 && z >= 9 && z <= 10 ? "F" : null;
      if (v >= 27) return z === 3 || z === 4 || z === 14 || z === 15 ? (v === 27 ? "e" : "d") : null;
      const a = v <= 22 ? 0 : v <= 24 ? 1 : v === 25 ? 2 : 3;
      if (z < a || z > 18 - a) return null;
      if (v <= 10) return "]";
      if (v <= 12) return "[";
      return v >= 24 || z <= a || z >= 18 - a ? "j" : "[";
    },
    atras(u, v) { if (v <= 8 || v >= 27) return null; return v <= 10 ? "]" : v >= 25 ? "j" : "["; },
  },
  // ── El inodoro: el tanque atrás, la tapa, la taza que sale para adelante y su pie. ──
  inodoro: {
    D: 10,
    lado(v, z) {
      if (v === 0) return null;
      if (v <= 11) { if (z < 6 || (v === 1 && z === 9)) return null; return z === 9 ? "k" : "#"; }
      if (v <= 15) { if (v === 12 && z < 2) return null; return v === 12 ? "k" : "#"; }
      if (v <= 21) { const a = v <= 18 ? 0 : v - 18; if (z < a || z > 9) return null; return v >= 19 ? "k" : "#"; }
      if (v <= 27) return z >= 3 && z <= 8 ? (z === 3 ? "k" : "#") : null;
      return z >= 2 && z <= 9 ? "j" : null;
    },
    atras(u, v) { return v >= 22 || u <= 4 || u >= 15 ? "k" : "#"; },
  },
  // ── El lavabo de pie: la tarja que sale de la pared, su llave atrás, el jabón y el pedestal. ──
  lavabo: {
    D: 13,
    lado(v, z, u) {
      if (v <= 8) {
        if (u >= 11 && u <= 18) { if (v <= 5) return z >= 7 && z <= 11 ? "F" : null; return z >= 10 && z <= 11 ? "F" : null; }
        return z >= 8 && z <= 10 ? "=" : null;
      }
      if (v <= 17) { const a = Math.max(0, v - 12); if (z < a || z > (v >= 17 ? 11 : 12)) return null; return v >= 15 ? "k" : "#"; }
      if (v <= 30) return z >= 6 && z <= 10 ? (z === 6 ? "k" : "#") : null;
      return z >= 5 && z <= 11 ? "j" : null;
    },
  },
  // ── El piano vertical: el cuerpo alto atrás, el teclado que sale adelante, el atril, sus patas y los pedales. ──
  piano: {
    D: 20,
    lado(v, z, u) {
      if (v <= 3) return z >= 9 && z <= 10 ? "C" : null;
      if (v <= 14) return z >= 8 ? (v === 4 ? "]" : z === 19 ? ")" : "[") : null;
      if (v <= 21) { if (z >= 8) return z === 19 ? ")" : "["; return v <= 16 ? ")" : v <= 19 ? "C" : ")"; }
      if (v <= 28) return z >= 8 ? (v === 28 || z === 19 ? ")" : "[") : null;
      if (u >= 15 && u <= 23) return v >= 33 && z >= 1 && z <= 4 ? "n" : null;
      if (z >= 1 && z <= 2) return v === 36 ? ")" : "[";
      return z >= 12 ? (v === 36 ? ")" : "[") : null;
    },
    atras(u, v) {
      if (v <= 3 || v >= 29) return null;
      return u <= 1 || u >= 37 || v === 4 || v === 28 || u === 12 || u === 26 ? ")" : "[";
    },
  },
  // ── El escritorio: la cubierta, el cajonero de lado, la pata con su travesaño, la lámpara y la pantalla atrás. ──
  escritorio: {
    D: 18,
    lado(v, z, u) {
      if (v <= 9) {
        if (u <= 9) {
          if (v <= 5) return z >= 11 && z <= 14 ? (v <= 2 ? "J" : "H") : null;
          if (v <= 8) return z >= 12 && z <= 13 ? "h" : null;
          return z >= 11 && z <= 14 ? "h" : null;
        }
        if (v <= 7) return z >= 13 && z <= 14 ? (z === 14 ? "i" : "j") : null;
        return z >= 12 && z <= 15 ? "i" : null;
      }
      if (v <= 12) return v === 10 ? "e" : v === 12 ? "c" : "d";
      if (u <= 15) { if (z < 1 || z > 16) return null; return v === 27 || z === 1 || z === 16 || v === 13 ? "c" : "e"; }
      if (z === 1 || z === 2 || z === 15 || z === 16) return "d";
      return v === 25 && z > 2 && z < 15 ? "c" : null;
    },
    atras(u, v) {
      if (v <= 9 || v >= 28) return null;
      if (v <= 12) return v === 12 ? "c" : "d";
      return u <= 15 ? (u === 2 || u === 14 || v === 27 ? "c" : "e") : null;
    },
  },
};
