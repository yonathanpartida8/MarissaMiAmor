(function () {
  var p = window.LibritoComponente ? LibritoComponente.params() : {};
  var cas = document.querySelector(".casete");
  var boton = document.querySelector(".play");
  var audio = document.querySelector("audio");
  if (p.titulo) document.querySelector(".titulo").textContent = p.titulo;
  if (p.subtitulo) document.querySelector(".sub").textContent = p.subtitulo;
  if (p.color) document.documentElement.style.setProperty("--color", p.color);
  if (p.cancion) audio.src = p.cancion;
  audio.loop = p.bucle !== false;
  boton.addEventListener("click", function () {
    if (!audio.src) { boton.textContent = "♪"; return; }
    if (audio.paused) { audio.play().catch(function () {}); } else audio.pause();
  });
  audio.addEventListener("play", function () { cas.classList.add("sonando"); boton.textContent = "❚❚"; if (window.LibritoComponente) LibritoComponente.enviar("bajarMusica"); });
  audio.addEventListener("pause", function () { cas.classList.remove("sonando"); boton.textContent = "▶"; if (window.LibritoComponente) LibritoComponente.enviar("subirMusica"); });
})();
