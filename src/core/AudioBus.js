/**
 * AUDIOBUS — la banda sonora del libro.
 *
 * Los navegadores móviles prohíben sonar antes del primer gesto, así que todo
 * queda armado y se desbloquea con el primer toque real. La música entra con
 * un fundido lento (nada de golpes de volumen) y se silencia sola si la
 * pestaña pasa a segundo plano.
 *
 * LA MÚSICA SE APARTA SOLA. Cualquier otro sonido —pasar página, abrir un
 * sobre, el corazón, las burbujas— baja la música mientras suena y la
 * devuelve con un fundido al terminar. Para eso:
 *
 *   · `play()` ya lo hace con sus propios sonidos;
 *   · las páginas que hacen sonidos a mano (con WebAudio) los sacan por
 *     `efectos()`, o llaman a `apartar(ms)` si suenan por su cuenta;
 *   · varios a la vez se suman: manda el que más la baja y la música no
 *     vuelve hasta que termina el último.
 *
 * En iPhone el volumen de un `<audio>` NO SE PUEDE CAMBIAR (Safari lo ignora
 * y suena siempre al máximo): ni el fundido de entrada ni apartarse hacían
 * nada. Por eso, cuando el libro está publicado (http/https), la música pasa
 * por un control de volumen de WebAudio, que sí obedece en todas partes.
 * Abierto como archivo (file://) no se hace, porque ahí el navegador lo
 * trata como de otro origen y la música saldría muda.
 */

import { Emitter } from "./Emitter.js";
import { clamp01 } from "../utils/math.js";

const SOURCES = {
  music: { src: "assets/audio/musica.mp3", loop: true, volume: 0.3 },
  open: { src: "assets/audio/abrir.mp3", loop: false, volume: 0.65 },
};

/**
 * Decodifica un sonido sin dejar ninguna promesa suelta.
 *
 * `decodeAudioData` acepta funciones de vuelta (lo único que entiende el
 * Safari viejo) y ADEMÁS devuelve una promesa (lo moderno). Si se le pasan
 * las funciones y el archivo no se puede leer, la promesa que devuelve
 * falla igual, nadie la escucha, y la consola se llena de errores rojos.
 * Aquí se atienden las dos y gana la primera que conteste.
 */
function decodificar(ac, datos) {
  return new Promise((ok) => {
    let hecho = false;
    const fin = (b) => {
      if (hecho) return;
      hecho = true;
      ok(b || null);
    };
    try {
      const p = ac.decodeAudioData(datos, fin, () => fin(null));
      p?.then?.(fin, () => fin(null));
    } catch {
      fin(null);
    }
  });
}

/** Pasar página suena tantas veces seguidas que tiene su propia reserva. */
const TURN = { src: "assets/audio/sonido.mp3", volume: 0.42, copias: 3 };

export class AudioBus extends Emitter {
  constructor(store) {
    super();
    this.store = store;
    this.unlocked = false;
    this.muted = false;
    this.tracks = new Map();
    this.#build();

    document.addEventListener("visibilitychange", () => {
      const music = this.tracks.get("music");
      if (!music) return;
      if (document.hidden) music.el.pause();
      else {
        this.ac?.resume?.().catch?.(() => {});
        if (this.playingMusic && !this.muted) music.el.play().catch(() => {});
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WebAudio compartido
  // ═══════════════════════════════════════════════════════════════════

  /** El contexto de audio del libro (uno para todos). Puede ser null. */
  contexto() {
    if (this.ac === undefined) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ac = AC ? new AC({ latencyHint: "interactive" }) : null;
      } catch {
        this.ac = null;
      }
      if (this.ac) {
        this.salidaEfectos = this.ac.createGain();
        this.salidaEfectos.gain.value = this.muted ? 0 : 1;
        this.salidaEfectos.connect(this.ac.destination);
      }
    }
    if (this.ac?.state === "suspended") this.ac.resume().catch(() => {});
    return this.ac;
  }

  /**
   * Por dónde sacar un sonido hecho a mano. Respeta el silencio del libro y
   * aparta la música `ms` milisegundos. Devuelve null si no hay audio.
   */
  efectos(ms = 600, cuanto = 0.4) {
    const ac = this.contexto();
    if (!ac || this.muted) return null;
    this.apartar(ms, cuanto);
    return this.salidaEfectos;
  }

  /** Trae y decodifica un archivo de sonido (una vez; luego sale de caché). */
  cargar(url) {
    this.buffers ??= new Map();
    if (!this.buffers.has(url)) {
      const ac = this.contexto();
      const promesa = !ac
        ? Promise.resolve(null)
        : fetch(url)
            .then((r) => (r.ok ? r.arrayBuffer() : null))
            .then((datos) => datos && decodificar(ac, datos))
            .catch(() => null);
      this.buffers.set(url, promesa);
    }
    return this.buffers.get(url);
  }

  /**
   * Suena un sonido ya decodificado. `hasta` corta el sonido (con un fundido
   * cortito) a esa cantidad de segundos, para que los latidos rápidos no se
   * pisen unos a otros.
   */
  sonar(buffer, { volume = 1, rate = 1, hasta = Infinity } = {}) {
    if (!buffer) return;
    const dura = Math.min(buffer.duration / rate, hasta);
    const salida = this.efectos(dura * 1000 + 250);
    if (!salida) return;
    const ac = this.ac;
    const fuente = ac.createBufferSource();
    const vol = ac.createGain();
    fuente.buffer = buffer;
    fuente.playbackRate.value = rate;
    const t = ac.currentTime;
    vol.gain.setValueAtTime(volume, t);
    if (Number.isFinite(hasta) && hasta < buffer.duration / rate) {
      vol.gain.setValueAtTime(volume, t + Math.max(0, hasta - 0.04));
      vol.gain.linearRampToValueAtTime(0.0001, t + hasta);
      fuente.stop(t + hasta + 0.02);
    }
    fuente.connect(vol).connect(salida);
    fuente.start(t);
  }

  /**
   * Pasa la música por WebAudio para poder cambiarle el volumen también en
   * iPhone. Se hace dentro del primer gesto y sólo con el libro publicado.
   */
  #enrutarMusica() {
    if (this.volumenMusica || !/^https?:$/.test(location.protocol)) return;
    const track = this.tracks.get("music");
    const ac = this.contexto();
    if (!track || !ac) return;
    try {
      const fuente = ac.createMediaElementSource(track.el);
      this.volumenMusica = ac.createGain();
      this.volumenMusica.gain.value = track.el.volume;
      fuente.connect(this.volumenMusica).connect(ac.destination);
      track.el.volume = 1;
      track.enrutada = true;
    } catch {
      this.volumenMusica = null;
    }
  }


  #build() {
    for (const [name, cfg] of Object.entries(SOURCES)) {
      const audio = new Audio();
      audio.src = cfg.src;
      audio.loop = cfg.loop;
      audio.volume = 0;
      // Nada de audio en la carrera por abrir el libro.
      //
      // La música son 5 MB y el sonido de abrir el sobre son 2, y los dos se
      // pedían mientras la portada peleaba por descargar su fotografía. En
      // datos móviles eso es la diferencia entre abrir en dos segundos y
      // abrir en ocho, a cambio de un sonido que todavía no toca.
      //
      // Con "none" no se pide nada hasta que alguien lo pide: la portada
      // llama a `prepare("open")` cuando ya está en pantalla, que es cuando
      // sobra red y aún faltan los segundos que se tarda en romper el lacre.
      audio.preload = "none";
      // Silencia errores de red: el libro debe funcionar sin sonido.
      audio.addEventListener("error", () => this.tracks.delete(name));
      this.tracks.set(name, { el: audio, base: cfg.volume });
    }

    // Reserva de "pasar página", para toques rápidos encadenados.
    //
    // Antes había ADEMÁS una pista suelta llamada `turn` que no sonaba nunca
    // —`play("turn")` siempre tira de la reserva—, y encima pedida con CORS
    // mientras la reserva la pedía sin él. Entre las dos cosas, el mismo
    // archivo de cuatrocientos kilos se descargaba cuatro veces.
    //
    // Sólo la primera copia se trae el sonido; las otras dos lo encuentran
    // en la caché del navegador porque piden exactamente lo mismo.
    this.turnPool = Array.from({ length: TURN.copias }, (_, i) => {
      const a = new Audio(TURN.src);
      a.volume = 0;
      a.preload = i === 0 ? "auto" : "metadata";
      return a;
    });
    this.turnIndex = 0;
  }

  /**
   * Pide que se vaya trayendo un sonido, sin sonarlo.
   * Para llamarlo cuando ya no le quita ancho de banda a nada urgente.
   */
  prepare(name) {
    const track = this.tracks.get(name);
    if (!track || track.el.preload === "auto") return;
    track.el.preload = "auto";
    track.el.load();
  }

  /** Debe llamarse dentro de un gesto del usuario (click/touch). */
  /**
   * Despierta el audio dentro del gesto del usuario.
   *
   * ── POR QUÉ HAY UN TOPE DE TIEMPO, Y POR QUÉ IMPORTA TANTO ──────────
   * `el.play()` devuelve una promesa que en Safari NO SE RESUELVE NUNCA
   * si el elemento no tiene nada que reproducir: se queda esperando unos
   * datos que no van a llegar, ni se resuelve ni falla. Y esto estaba
   * dentro de un bucle con `await` seco.
   *
   * O sea que UNA SOLA pista vacía dejaba colgado todo lo de detrás. Y
   * hay una pista vacía de fábrica: `Musica.mp3` pesa dos bytes mientras
   * no se ponga la de verdad. Resultado: el botón de «Tócame para abrir»
   * se quedaba en «abriendo…» para siempre y el libro no se abría. En
   * Chrome fallaba rápido y casi no se notaba; en Safari no se abría y
   * ya está. Eso era el «no me deja hacer nada».
   *
   * Ahora van todas A LA VEZ —son gestos del mismo toque, y encadenarlas
   * gasta la ventanita que da iOS— y con medio segundo de tope. Si
   * alguna no contesta, se sigue sin ella: el libro se abre igual y lo
   * único que puede faltar es un sonido.
   */
  async unlock() {
    if (this.unlocked) return true;
    const attempts = [...this.tracks.values(), ...this.turnPool.map((el) => ({ el, base: 0 }))];
    const uno = async (track) => {
      try {
        track.el.muted = true;
        await track.el.play();
        track.el.pause();
        track.el.currentTime = 0;
      } catch {
        /* seguimos: quizá otro sí arranque */
      } finally {
        track.el.muted = false;
      }
    };
    // El contexto de WebAudio también nace aquí, dentro del gesto: fuera de
    // uno, Safari lo deja suspendido y los sonidos hechos a mano no suenan.
    this.contexto();
    this.#enrutarMusica();
    await Promise.race([
      Promise.all(attempts.map(uno)).catch(() => {}),
      new Promise((r) => setTimeout(r, 600)),
    ]);
    this.unlocked = true;
    this.emit("unlocked");
    return true;
  }

  playingMusic = false;

  /** Efecto puntual. La música se aparta mientras suena. */
  play(name, { volume = 1, rate = 1 } = {}) {
    if (this.muted) return;

    if (name === "turn") {
      const el = this.turnPool[this.turnIndex];
      this.turnIndex = (this.turnIndex + 1) % this.turnPool.length;
      el.volume = clamp01(TURN.volume * volume);
      el.playbackRate = rate;
      el.currentTime = 0;
      el.play().catch(() => {});
      // Pasar página es cortito: apenas un respiro de la música.
      this.apartar(900 / Math.max(0.3, rate), 0.55);
      return;
    }

    const track = this.tracks.get(name);
    if (!track) return;
    const dura = Number.isFinite(track.el.duration) ? track.el.duration / Math.max(0.3, rate) : 2.4;
    this.apartar(Math.min(6000, dura * 1000 + 300), 0.35);
    track.el.volume = clamp01(track.base * volume);
    track.el.playbackRate = rate;
    try {
      track.el.currentTime = 0;
    } catch {
      /* aún cargando */
    }
    track.el.play().catch(() => {});
  }

  /** Arranca la música con fundido de entrada. */
  startMusic(fade = 3200) {
    const track = this.tracks.get("music");
    if (!track || this.muted) return;
    this.playingMusic = true;
    this.#ponerVolMusica(track, 0);
    track.el
      .play()
      .then(() => {
        this.#nivelPuesto = this.#nivelApartado();
        this.#fadeMusica(track, track.base * this.#nivelPuesto, fade);
      })
      .catch(() => {
        this.playingMusic = false;
      });
    this.emit("music", true);
  }

  stopMusic(fade = 800) {
    const track = this.tracks.get("music");
    if (!track) return;
    this.playingMusic = false;
    this.#fadeMusica(track, 0, fade, () => track.el.pause());
    this.emit("music", false);
  }

  toggleMusic() {
    if (this.playingMusic) this.stopMusic();
    else this.startMusic(1400);
    this.store?.set("musicOn", this.playingMusic);
    return this.playingMusic;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Apartar la música
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Baja la música `ms` milisegundos hasta `cuanto` de su volumen.
   *
   * Si ya estaba apartada, no la sube: se queda con el nivel más bajo de los
   * dos y con el final más tardío. Así un sonido corto encima de uno largo
   * no la devuelve antes de tiempo.
   */
  apartar(ms = 1200, cuanto = 0.4) {
    const ahora = performance.now();
    const vigente = ahora < this.#apartadaHasta;
    this.#nivel = vigente ? Math.min(this.#nivel, cuanto) : cuanto;
    this.#apartadaHasta = Math.max(vigente ? this.#apartadaHasta : 0, ahora + ms);
    clearTimeout(this.#duckTimer);
    this.#duckTimer = setTimeout(() => this.#aplicar(), this.#apartadaHasta - ahora + 16);
    this.#aplicar();
  }

  /**
   * Aparta la música MIENTRAS algo siga sonando, sin reloj.
   *
   * Es lo que usan las páginas HTML: ellas saben cuándo empiezan y cuándo
   * acaban sus sonidos (una canción de tres minutos, una tormenta que dura
   * lo que tú quieras), así que la música se queda abajo lo que haga falta
   * y vuelve cuando se llama a `soltar` con la misma clave.
   */
  mantener(clave, cuanto = 0.3) {
    this.#retenidas.set(clave, clamp01(cuanto));
    this.#aplicar();
  }

  soltar(clave) {
    if (this.#retenidas.delete(clave)) this.#aplicar();
  }

  /** Lo de antes, con su nombre de antes: `duck(1, 0)` la devuelve ya. */
  duck(amount = 0.4, ms = 2600) {
    if (amount >= 1 || ms <= 0) return this.#devolver();
    this.apartar(ms, amount);
  }

  #devolver() {
    clearTimeout(this.#duckTimer);
    this.#apartadaHasta = 0;
    this.#nivel = 1;
    this.#aplicar();
  }

  /** El volumen que le toca a la música ahora, de 0 a 1 de su volumen normal. */
  #nivelApartado() {
    let n = performance.now() < this.#apartadaHasta ? this.#nivel : 1;
    for (const v of this.#retenidas.values()) n = Math.min(n, v);
    return n;
  }

  /**
   * Lleva la música a donde le toca, con un fundido que se nota lo justo.
   *
   * Bajar es rápido pero nunca seco: casi medio segundo, para que el sonido
   * que llega se oiga claro sin que la canción desaparezca de golpe. Subir es
   * lento a propósito —dos segundos largos—: la canción vuelve como quien
   * entra en un cuarto sin hacer ruido, y si otro sonido llega mientras
   * tanto, se da la vuelta desde donde esté, sin saltos.
   */
  #aplicar() {
    const n = this.#nivelApartado();
    const track = this.tracks.get("music");
    if (!track || !this.playingMusic) {
      this.#nivelPuesto = n;
      return;
    }
    if (Math.abs(n - this.#nivelPuesto) < 0.004) return;
    const baja = n < this.#nivelPuesto;
    const salto = Math.abs(n - this.#nivelPuesto);
    this.#nivelPuesto = n;
    const ms = baja ? 320 + 260 * salto : 1500 + 1200 * salto;
    this.#fadeMusica(track, track.base * n, ms);
  }

  #duckTimer = 0;
  #nivel = 1;
  #apartadaHasta = 0;
  #nivelPuesto = 1;
  #retenidas = new Map();
  #fades = new WeakMap();

  #ponerVolMusica(track, v) {
    if (track.enrutada) {
      this.volumenMusica.gain.cancelScheduledValues(this.ac.currentTime);
      this.volumenMusica.gain.value = clamp01(v);
    } else track.el.volume = clamp01(v);
  }

  /**
   * Fundido de la música, por el camino que le toque.
   *
   * Por WebAudio va con `setTargetAtTime`, que se acerca al volumen nuevo
   * como se apaga una nota: rápido al principio y cada vez más suave. Es la
   * curva que el oído entiende como natural, y además se puede interrumpir
   * a medias sin que haya un escalón.
   */
  #fadeMusica(track, to, ms, onDone) {
    if (!track.enrutada) return this.#fade(track.el, to, ms, onDone);
    const g = this.volumenMusica.gain;
    const t = this.ac.currentTime;
    const destino = clamp01(to);
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    if (destino <= 0.0001) g.linearRampToValueAtTime(0, t + Math.max(0.01, ms / 1000));
    else g.setTargetAtTime(destino, t, Math.max(0.01, ms / 1000 / 3.2));
    clearTimeout(this.#finFundido);
    if (onDone) this.#finFundido = setTimeout(onDone, ms);
  }

  #finFundido = 0;

  /** Fundido del volumen del elemento, en curva suave de entrada y salida. */
  #fade(el, to, ms, onDone) {
    cancelAnimationFrame(this.#fades.get(el) || 0);
    const from = el.volume;
    const start = performance.now();
    if (ms <= 0) {
      el.volume = clamp01(to);
      onDone?.();
      return;
    }
    const curva = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      el.volume = clamp01(from + (to - from) * curva(t));
      if (t < 1) this.#fades.set(el, requestAnimationFrame(step));
      else onDone?.();
    };
    this.#fades.set(el, requestAnimationFrame(step));
  }

  setMuted(muted) {
    this.muted = muted;
    for (const { el } of this.tracks.values()) el.muted = muted;
    for (const el of this.turnPool) el.muted = muted;
    if (this.salidaEfectos) this.salidaEfectos.gain.value = muted ? 0 : 1;
    this.emit("muted", muted);
  }
}
