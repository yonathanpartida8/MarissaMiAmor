/**
 * PROXY DE GIPHY EN CLOUDFLARE WORKERS (gratis) — la clave vive aquí, no en el navegador.
 *
 * 1. Crea un Worker en dash.cloudflare.com y pega este archivo.
 * 2. Settings → Variables → añade el secreto GIPHY_KEY (tu clave de GIPHY Developers)
 *    y, si quieres, ORIGEN = la dirección de tu sitio (p. ej. https://tu-usuario.github.io).
 * 3. En el editor: GIFs → Conectar → «Uso un proxy» → pega la dirección del Worker.
 */
export default {
  async fetch(req, env) {
    const cors = { "access-control-allow-origin": env.ORIGEN || "*", "access-control-allow-methods": "GET", "cache-control": "no-store" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const u = new URL(req.url);
    if (u.pathname.endsWith("/ping")) return new Response("giphy-ok", { headers: cors });
    const m = u.pathname.match(/\/v1\/(gifs|stickers)\/(search|trending)$/);
    if (!m || !env.GIPHY_KEY) return new Response("No", { status: 404, headers: cors });
    const q = new URLSearchParams(u.search);
    q.set("api_key", env.GIPHY_KEY);
    const r = await fetch(`https://api.giphy.com/v1/${m[1]}/${m[2]}?${q}`);
    return new Response(r.body, { status: r.status, headers: { ...cors, "content-type": "application/json" } });
  },
};
