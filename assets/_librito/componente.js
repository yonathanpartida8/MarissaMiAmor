/*
 * Ayudante OPCIONAL para componentes de assets/ (no hace falta usarlo).
 *
 *   <script src="../../_librito/componente.js"></script>
 *
 *   LibritoComponente.params()           → los parámetros que puso el editor
 *   LibritoComponente.enviar("siguiente") → pide algo al librito:
 *        "siguiente" · "anterior" · "inicio" · "musica" · { ir: "idPagina" } · { sonido: "url" }
 *
 * Sin el librito alrededor (abriendo el archivo suelto) todo sigue
 * funcionando: params() devuelve {} y enviar() no hace nada.
 */
(function () {
  "use strict";
  var cache = null;
  window.LibritoComponente = {
    params: function () {
      if (cache) return cache;
      try { cache = JSON.parse(new URLSearchParams(location.search).get("p") || "{}"); } catch (e) { cache = {}; }
      return cache;
    },
    enviar: function (accion) {
      try { if (window.parent !== window) window.parent.postMessage({ librito: accion }, "*"); } catch (e) { /* nada */ }
    },
  };
})();
