// fase: entrada · duracion: 1300
// Una animación hecha con código: corre aislada una sola vez y DEVUELVE los
// fotogramas (lo mismo que pondrías en un animacion.json).
const f = [];
for (let i = 0; i <= 12; i++) {
  const t = i / 12;
  const pulso = Math.sin(t * Math.PI * 3) * 0.16 * (1 - t);
  f.push({ offset: t, opacity: Math.min(1, t * 3), transform: `scale(${(1 + pulso).toFixed(3)})` });
}
return f;
