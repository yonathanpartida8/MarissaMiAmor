(function () {
  var p = window.LibritoComponente ? LibritoComponente.params() : {};
  var boton = document.querySelector(".boton");
  if (p.texto) document.querySelector(".texto").textContent = p.texto;
  if (p.color) document.documentElement.style.setProperty("--color", p.color);

  // Un «pop» chiquito hecho con Web Audio (no necesita archivo).
  var ac = null;
  function pop() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(660, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(990, ac.currentTime + 0.08);
      g.gain.setValueAtTime(0.18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
      o.connect(g).connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.2);
    } catch (e) { /* sin audio */ }
  }

  boton.addEventListener("click", function () {
    if (p.sonido !== false) pop();
    boton.classList.add("latio");
    setTimeout(function () { boton.classList.remove("latio"); }, 260);
    for (var i = 0; i < 7; i++) {
      var s = document.createElement("span");
      s.className = "chispa"; s.textContent = "♥";
      var a = (i / 7) * Math.PI * 2;
      s.style.left = boton.offsetLeft + boton.offsetWidth / 2 + "px";
      s.style.top = boton.offsetTop + boton.offsetHeight / 2 + "px";
      s.style.setProperty("--x", Math.cos(a) * 60 + "px");
      s.style.setProperty("--y", Math.sin(a) * 40 + "px");
      document.body.appendChild(s);
      setTimeout(function (n) { n.remove(); }, 820, s);
    }
    if (p.accion && window.LibritoComponente) LibritoComponente.enviar(p.accion);
  });
})();
