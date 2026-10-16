/**
 * PÁGINAS PUBLICADAS — todo pasa por M.YNTHN, el servidor del librito.
 *
 * Quien usa el editor sólo entra con su usuario y su contraseña: no hay
 * tokens, ni direcciones, ni nada de GitHub aquí. M.YNTHN publica cada
 * página en publicaciones/<nombre>/ (si el nombre ya existe, <nombre>-2…),
 * a pantalla completa y sólo para ver. Tus libritos viven en tu nube (se
 * suben solos mientras editas) y cada vez que guardas a mano queda una copia.
 */
import { el, seccion, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import * as SRV from "../../integraciones/servidor.js";
import { formularioCuenta, saludo } from "../cuenta.js";
import { bloquePublicar, listaPublicaciones, listaCopias, copiaEnNube } from "../myn.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export const PUBLICADAS = {
  _publicadas(c) {
    const app = this.app;
    c.append(el("div.ed-pub-hero.ed-myn-hero", {}, [
      el("i", { html: ico("publicar") }),
      el("div", {}, [
        el("b", { text: SRV.NOMBRE }),
        el("small", { text: "Publica tus páginas con su propio enlace, a pantalla completa y sólo para ver. Tus libritos se guardan en tu nube y los abres desde cualquier aparato." }),
      ]),
    ]));
    const cuerpo = el("div.ed-myn");
    c.append(cuerpo);
    const pintar = () => {
      cuerpo.textContent = "";
      if (!SRV.conectado()) {
        cuerpo.append(seccion("Entra a M.YNTHN", [
          el("small.ed-nota.suave", { text: "Sólo tu usuario y tu contraseña. ¿No tienes cuenta? Créala aquí mismo: es al momento." }),
          formularioCuenta(app),
        ]));
        return;
      }
      const pub = bloquePublicar(app, { alPublicar: () => lista.cargar() });
      const lista = listaPublicaciones(app, { alActualizar: (p) => { pub.scrollIntoView({ behavior: "smooth", block: "center" }); pub.publicar(p.slug, p.titulo); } });
      const copias = listaCopias(app);
      const guardar = el("button.ed-btn.ed-pub-btn", { type: "button", html: I("guardar", "Guardar una copia ahora"), onClick: async () => {
        guardar.disabled = true;
        const span = guardar.querySelector("span");
        try { await copiaEnNube(app, { alAvance: (t) => { span.textContent = t; } }); app.sonidos?.sonar("guardar"); }
        catch (e) { aviso(e.message, 4500, "error"); }
        finally { guardar.disabled = false; span.textContent = "Guardar una copia ahora"; }
      } });
      cuerpo.append(
        saludo(app),
        seccion("Publicar", [pub]),
        seccion("Mis páginas publicadas", [lista]),
        seccion("Copias de mis proyectos", [
          el("small.ed-nota.suave", { text: "Mientras editas, tu librito se sube solo a tu nube de M.YNTHN. Además, cada vez que guardas a mano (Guardar o Ctrl+S) queda una copia aquí; ábrela desde cualquier aparato." }),
          guardar, copias,
        ]),
      );
    };
    const alCambiar = () => { if (cuerpo.isConnected) pintar(); else removeEventListener("ed-cuenta", alCambiar); };
    addEventListener("ed-cuenta", alCambiar);
    pintar();
  },
};
