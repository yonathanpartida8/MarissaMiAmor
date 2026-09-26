/*
 * SONIDO-LIBRO — la canción del libro se aparta cuando esta página suena.
 *
 * Cada página HTML vive en su propio iframe y no puede tocar la música del
 * libro. Este archivo es el puente: se carga el PRIMERO en la cabecera,
 *
 *     <script src="sonido-libro.js"></script>
 *
 * y a partir de ahí escucha todo lo que la página hace sonar —un <audio>,
 * un vídeo, un sonido hecho con WebAudio— y le cuenta al libro cuánto tiene
 * que bajar la canción de fondo. Cuando la página se calla, la canción
 * vuelve sola, despacito.
 *
 * ── CÓMO SABE QUE ALGO SUENA ────────────────────────────────────────────
 *   · Los <audio> y <video>: por sus avisos de siempre (playing, pause,
 *     ended…). Mientras uno suene con volumen, la canción se aparta.
 *   · WebAudio: todo lo que se conecta a los altavoces pasa antes por un
 *     medidor. Si el medidor oye algo, se aparta; si lleva un rato en
 *     silencio, se devuelve. Así da igual cómo se haya hecho el sonido: un
 *     oscilador de adorno que no suena no baja nada, y una melodía larga
 *     mantiene la canción apartada lo que dure.
 *   · Y en cuanto un toque arranca un sonido, se avisa en el acto, antes de
 *     que el medidor lo oiga: así el primer golpe ya no pelea con la música.
 *
 * ── LO QUE PUEDE PEDIR UNA PÁGINA A MANO ────────────────────────────────
 *   LibroSonido.cuanto = 0.2          cuánto se baja con lo que suene aquí
 *   LibroSonido.apartar(ms, cuanto)   un rato, de una vez
 *   LibroSonido.mantener(clave, c)    mientras no se suelte
 *   LibroSonido.soltar(clave)
 *   <audio data-libro-cuanto="0.05">  ese audio concreto la baja más
 *   LibroSonido.ambiente(nodo)        conecta un sonido de ambiente (un
 *                                     traqueteo, la lluvia) a los altavoces
 *                                     SIN medirlo: el fondo que no para no
 *                                     debe tener la canción apartada siempre
 *
 * El nivel es la parte de volumen que se le deja a la canción: 1 es entera,
 * 0.2 es un susurro, 0 es nada.
 */
(function () {
  "use strict";
  if (window.__libroSonido) return;

  var ahora = function () { return (window.performance && performance.now()) || Date.now(); };

  /* Cuánto se baja por defecto con un efecto, y con una canción. Bien
     abajo: con la música a un tercio, los sonidos de la página peleaban
     con ella y no se oían claros. */
  var POR_EFECTO = 0.14;
  var POR_CANCION = 0.05;
  /* Por debajo de esto, lo que sale por WebAudio se cuenta como silencio. */
  var UMBRAL = 0.0035;
  /* Cuánto silencio seguido hace falta para devolver la música: sin este
     respiro, dos golpes separados por medio segundo la harían subir y bajar
     como un bombeo. */
  var COLA = 1000;

  var L = {
    cuanto: POR_EFECTO,
    apartar: function (ms, cuanto) { pedir(cuanto == null ? L.cuanto : cuanto, ms || 1200); },
    mantener: function (clave, cuanto) { retenidos[clave] = cuanto == null ? L.cuanto : cuanto; revisar(); },
    soltar: function (clave) { delete retenidos[clave]; revisar(); },
  };
  L.ambiente = function (nodo) {
    try { return conectarReal.call(nodo, nodo.context.destination); }
    catch (e) { return nodo.connect(nodo.context.destination); }
  };
  window.__libroSonido = L;
  window.LibroSonido = L;
  var conectarReal = window.AudioNode && AudioNode.prototype.connect;

  var retenidos = {};
  var pedidoHasta = 0, pedidoNivel = 1;
  var historia = [];            // [momento, nivel] de lo último que se oyó
  var enviado = 1;
  var ultimoToque = -1e9;

  function avisar(nivel) {
    if (window.parent === window) return;
    try { window.parent.postMessage({ libro: "audio", nivel: nivel }, "*"); } catch (e) { /* sin libro */ }
  }

  function pedir(cuanto, ms) {
    var t = ahora();
    if (t > pedidoHasta) pedidoNivel = 1;
    pedidoHasta = Math.max(pedidoHasta, t + ms);
    pedidoNivel = Math.min(pedidoNivel, cuanto);
    revisar();
  }

  /* ---- <audio> y <video> ------------------------------------------------ */
  var medios = [];
  function nivelDe(m) {
    var d = m.getAttribute && m.getAttribute("data-libro-cuanto");
    if (d != null && d !== "") return +d;
    if (typeof m.libroCuanto === "number") return m.libroCuanto;
    return POR_CANCION;
  }
  function suenaMedio(m) {
    return !m.paused && !m.ended && !m.muted && m.volume > 0.02;
  }
  function vigilarMedio(m) {
    if (!m || m.__libroVisto) return;
    m.__libroVisto = true;
    medios.push(m);
    var mira = function () { revisar(); };
    ["playing", "play", "pause", "ended", "emptied", "volumechange", "abort", "error", "waiting"].forEach(function (ev) {
      m.addEventListener(ev, mira);
    });
  }
  var PM = window.HTMLMediaElement && HTMLMediaElement.prototype;
  if (PM && PM.play) {
    var jugar = PM.play;
    PM.play = function () {
      vigilarMedio(this);
      if (!this.muted && this.volume > 0.02) pedir(nivelDe(this), 900);
      return jugar.apply(this, arguments);
    };
  }
  document.addEventListener("playing", function (e) { vigilarMedio(e.target); revisar(); }, true);

  /* ---- WebAudio ---------------------------------------------------------- */
  var buses = [];
  var AN = window.AudioNode && AudioNode.prototype;
  var Destino = window.AudioDestinationNode;
  var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  if (AN && Destino && AN.connect) {
    var conectar = AN.connect;
    var desconectar = AN.disconnect;

    var busDe = function (contexto) {
      for (var i = 0; i < buses.length; i++) if (buses[i].ctx === contexto) return buses[i];
      var bus = contexto.createGain();
      var medidor = contexto.createAnalyser();
      medidor.fftSize = 2048;
      conectar.call(bus, contexto.destination);
      conectar.call(bus, medidor);
      var b = {
        ctx: contexto, bus: bus, medidor: medidor,
        flo: medidor.getFloatTimeDomainData ? new Float32Array(medidor.fftSize) : null,
        byt: new Uint8Array(medidor.fftSize),
      };
      buses.push(b);
      return b;
    };
    var esAltavoz = function (d) {
      return d && d instanceof Destino && !(Offline && d.context instanceof Offline);
    };

    AN.connect = function (destino) {
      if (esAltavoz(destino)) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = busDe(destino.context).bus;
        conectar.apply(this, args);
        return destino;
      }
      return conectar.apply(this, arguments);
    };
    AN.disconnect = function (destino) {
      if (esAltavoz(destino)) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = busDe(destino.context).bus;
        try { return desconectar.apply(this, args); } catch (e) { return undefined; }
      }
      return desconectar.apply(this, arguments);
    };

    /* El aviso adelantado: si un toque arranca un sonido, se aparta ya. */
    var enGesto = function () {
      var ua = navigator.userActivation;
      if (ua && typeof ua.isActive === "boolean" && ua.isActive) return true;
      return ahora() - ultimoToque < 1400;
    };
    var protos = [
      window.AudioScheduledSourceNode && AudioScheduledSourceNode.prototype,
      window.AudioBufferSourceNode && AudioBufferSourceNode.prototype,
      window.OscillatorNode && OscillatorNode.prototype,
    ];
    protos.forEach(function (p) {
      if (!p || !Object.prototype.hasOwnProperty.call(p, "start") || p.start.__libro) return;
      var arrancar = p.start;
      var nuevo = function () {
        if (enGesto() && !this.__libroCallado) pedir(L.cuanto, 700);
        return arrancar.apply(this, arguments);
      };
      nuevo.__libro = true;
      p.start = nuevo;
    });
  }

  ["pointerdown", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function () { ultimoToque = ahora(); }, { capture: true, passive: true });
  });

  /* Lo más alto que ha salido por los altavoces en el último instante. */
  function picoWebAudio() {
    var pico = 0;
    for (var i = 0; i < buses.length; i++) {
      var b = buses[i];
      if (b.ctx.state !== "running") continue;
      if (b.flo) {
        b.medidor.getFloatTimeDomainData(b.flo);
        for (var j = 0; j < b.flo.length; j += 2) {
          var v = b.flo[j] < 0 ? -b.flo[j] : b.flo[j];
          if (v > pico) pico = v;
        }
      } else {
        b.medidor.getByteTimeDomainData(b.byt);
        for (var k = 0; k < b.byt.length; k += 2) {
          var w = Math.abs(b.byt[k] - 128) / 128;
          if (w > pico) pico = w;
        }
      }
    }
    return pico;
  }

  /* Un sonido flojito aparta poco; uno fuerte, lo que diga `cuanto`. */
  function nivelPorPico(pico) {
    if (pico <= UMBRAL) return 1;
    var f = Math.min(1, Math.log(pico / UMBRAL) / Math.log(0.07 / UMBRAL));
    return 0.45 + (L.cuanto - 0.45) * f;
  }

  function revisar() {
    var t = ahora();
    var nivel = 1;

    for (var i = 0; i < medios.length; i++) {
      if (suenaMedio(medios[i])) nivel = Math.min(nivel, nivelDe(medios[i]));
    }
    if (t < pedidoHasta) nivel = Math.min(nivel, pedidoNivel);
    for (var k in retenidos) nivel = Math.min(nivel, retenidos[k]);

    var wa = nivelPorPico(picoWebAudio());
    if (wa < 1) historia.push([t, wa]);
    while (historia.length && t - historia[0][0] > COLA) historia.shift();
    for (var h = 0; h < historia.length; h++) nivel = Math.min(nivel, historia[h][1]);

    /* En escalones de 5 %: el libro recibe un aviso cuando algo cambia de
       verdad, no uno por cada décima de volumen. */
    nivel = nivel >= 0.985 ? 1 : Math.round(nivel * 20) / 20;
    if (nivel !== enviado) {
      enviado = nivel;
      avisar(nivel);
    }
  }

  setInterval(revisar, 90);

  /* Al irse, la música vuelve entera. El libro también lo hace por su lado,
     pero mejor que no dependa de uno solo. */
  window.addEventListener("pagehide", function () { enviado = 1; avisar(1); });
})();
