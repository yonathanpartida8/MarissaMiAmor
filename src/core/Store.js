/**
 * STORE — memoria del libro.
 *
 * Guarda hasta dónde llegó, qué secretos ha descubierto y sus preferencias.
 * Persiste en localStorage: si cierra el navegador, el libro la espera
 * exactamente donde lo dejó.
 */

import { Emitter } from "./Emitter.js";

const KEY = "marissa.libro.v2";

const DEFAULTS = {
  page: 0,
  // El número de página baila si él añade páginas suyas en medio; el id no.
  // Se guardan los dos: el id manda, el número es el respaldo.
  pageId: null,
  furthest: 0,
  secrets: [],
  visited: [],
  musicOn: true,
  visits: 0,
  firstOpenedAt: null,
  lastSeenAt: null,
};

export class Store extends Emitter {
  constructor() {
    super();
    this.state = { ...DEFAULTS, ...this.#read() };
    this.state.visits += 1;
    this.state.firstOpenedAt ??= Date.now();
    this.#writeSoon();
  }

  #read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {}; // modo privado de Safari, cuota llena… no es motivo de drama
    }
  }

  #timer = 0;
  #writeSoon() {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      try {
        this.state.lastSeenAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify(this.state));
      } catch {
        /* sin persistencia, el libro sigue funcionando igual */
      }
    }, 300);
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    if (this.state[key] === value) return value;
    const prev = this.state[key];
    this.state[key] = value;
    this.#writeSoon();
    this.emit("change", { key, value, prev });
    this.emit(`change:${key}`, value);
    return value;
  }

  /** Avanza el marcador de página y recuerda el punto más lejano alcanzado. */
  setPage(index, id) {
    this.set("page", index);
    if (id) this.set("pageId", id);
    if (index > this.state.furthest) this.set("furthest", index);
  }

  /**
   * Marca una página como vista. Se guarda por id y no por número: así,
   * si algún día se reordena el libro o se añaden páginas en medio, lo que
   * ya había visto sigue contando.
   */
  markVisited(id) {
    if (!id || this.state.visited.includes(id)) return false;
    this.state.visited = [...this.state.visited, id];
    this.#writeSoon();
    this.emit("change:visited", this.state.visited);
    return true;
  }

  hasVisited(id) {
    return this.state.visited.includes(id);
  }

  /** Marca un secreto como encontrado. Devuelve true si es la primera vez. */
  unlockSecret(id) {
    if (this.state.secrets.includes(id)) return false;
    this.state.secrets = [...this.state.secrets, id];
    this.#writeSoon();
    this.emit("secret", id);
    this.emit("change:secrets", this.state.secrets);
    return true;
  }

  hasSecret(id) {
    return this.state.secrets.includes(id);
  }

  get secretsFound() {
    return this.state.secrets.length;
  }

  /** ¿Es su primera vez abriendo el libro? Cambia la intensidad de las pistas. */
  get isFirstVisit() {
    return this.state.visits <= 1;
  }

  reset() {
    this.state = { ...DEFAULTS, firstOpenedAt: Date.now(), visits: 1 };
    this.#writeSoon();
    this.emit("reset");
  }
}
