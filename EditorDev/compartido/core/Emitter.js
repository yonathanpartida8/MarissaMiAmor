/** Bus de eventos mínimo compartido por todo el motor. */
export class Emitter {
  #map = new Map();

  on(type, handler) {
    if (!this.#map.has(type)) this.#map.set(type, new Set());
    this.#map.get(type).add(handler);
    return () => this.off(type, handler);
  }

  once(type, handler) {
    const off = this.on(type, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off(type, handler) {
    this.#map.get(type)?.delete(handler);
  }

  emit(type, payload) {
    const set = this.#map.get(type);
    if (!set) return;
    // Copia: un handler puede desuscribirse durante la emisión.
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[emitter:${type}]`, err);
      }
    }
  }

  clear() {
    this.#map.clear();
  }
}
