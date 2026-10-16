/**
 * TU CUENTA EN M.YNTHN — lo único que se le pide a quien usa el editor:
 * su usuario y su contraseña (o crear una cuenta, también con sólo eso).
 * Lo usan el menú principal, Páginas publicadas, Exportar y Detallitos.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** El formulario de entrar / crear cuenta. `alEntrar(usuario)` cuando ya hay sesión. */
export function formularioCuenta(app, { alEntrar, modo = "entrar", compacto = false } = {}) {
  const caja = el("form.cu-caja" + (compacto ? ".compacto" : ""), { autocomplete: "on", onSubmit: (e) => { e.preventDefault(); ir.click(); } });
  const pintar = (m) => {
    modo = m;
    const usuario = el("input", { type: "text", name: "username", autocomplete: "username", autocapitalize: "none", spellcheck: "false", placeholder: "tu usuario", maxlength: 32 });
    const c1 = el("input", { type: "password", name: "password", autocomplete: modo === "entrar" ? "current-password" : "new-password", placeholder: modo === "entrar" ? "tu contraseña" : "mínimo 8 caracteres" });
    const c2 = el("input", { type: "password", autocomplete: "new-password", placeholder: "otra vez" });
    const codigo = el("input", { type: "text", autocapitalize: "characters", placeholder: "XXXX-XXXX-XXXX" });
    const recordar = el("input", { type: "checkbox", checked: true });
    const estado = el("small.cu-estado", { role: "status" });
    const filaCodigo = el("label.cu-campo", { hidden: "" }, [el("span", { text: "Código de invitación" }), codigo]);
    ir = el("button.ed-btn.primario.cu-ir", { type: "submit", html: I(modo === "entrar" ? "cuenta" : "corazon", modo === "entrar" ? "Entrar" : "Crear mi cuenta") });
    ir.addEventListener("click", async (e) => {
      e.preventDefault();
      const u = usuario.value.trim().toLowerCase();
      if (!u || !c1.value) { estado.textContent = "Escribe tu usuario y tu contraseña."; return; }
      if (modo === "registro" && c1.value !== c2.value) { estado.textContent = "Las contraseñas no coinciden."; return; }
      ir.disabled = true; estado.className = "cu-estado"; estado.textContent = modo === "entrar" ? "Entrando…" : "Creando tu cuenta…";
      try {
        if (modo === "entrar") {
          const yo = await SRV.entrar(u, c1.value, recordar.checked);
          app.sonidos?.sonar("exito");
          aviso(`¡Hola, ${yo.usuario}!`);
          alEntrar?.(yo);
        } else {
          const r = await SRV.registrar(u, c1.value, codigo.value.trim(), recordar.checked);
          if (r.token) { app.sonidos?.sonar("exito"); aviso(`¡Bienvenido a ${SRV.NOMBRE}, ${r.usuario.usuario}!`); alEntrar?.(r.usuario); return; }
          estado.className = "cu-estado bien";
          estado.textContent = r.mensaje || "Listo, tu cuenta ya está lista.";
          ir.disabled = false;
        }
      } catch (er) {
        estado.textContent = er.message;
        app.sonidos?.sonar("error");
        ir.disabled = false;
      }
    });
    caja.replaceChildren(
      el("div.cu-tabs", { role: "tablist" }, [
        el("button", { type: "button", role: "tab", class: modo === "entrar" ? "on" : "", text: "Entrar", onClick: () => pintar("entrar") }),
        el("button", { type: "button", role: "tab", class: modo === "registro" ? "on" : "", text: "Crear cuenta", onClick: () => pintar("registro") }),
      ]),
      el("label.cu-campo", {}, [el("span", { text: "Usuario" }), usuario]),
      el("label.cu-campo", {}, [el("span", { text: "Contraseña" }), c1]),
      ...(modo === "registro" ? [el("label.cu-campo", {}, [el("span", { text: "Repítela" }), c2]), filaCodigo] : []),
      el("label.cu-recordar", {}, [recordar, el("span", { text: "Recordarme en este aparato" })]),
      ir, estado,
    );
    SRV.info().then((inf) => {
      if (modo === "registro") {
        filaCodigo.hidden = inf.registro !== "codigo";
        if (inf.registro === "cerrado") estado.textContent = "Por ahora no se pueden crear cuentas nuevas.";
      }
    }).catch((er) => { estado.textContent = er.message; });
    setTimeout(() => usuario.focus({ preventScroll: true }), 60);
  };
  let ir = null;
  pintar(modo);
  return caja;
}

/** «Hola, usuario» con el botón de salir. */
export function saludo(app, { alSalir } = {}) {
  const yo = SRV.usuario();
  return el("div.cu-saludo", {}, [
    el("i", { html: ico("cuenta") }),
    el("div", {}, [el("b", { text: yo ? `Hola, ${yo.usuario}` : "Tu cuenta" }), el("small", { text: `Conectado a ${SRV.NOMBRE}` })]),
    el("button.ed-btn.chico", { type: "button", html: I("salir", "Salir"), onClick: async () => { await SRV.salir(); aviso(`Saliste de ${SRV.NOMBRE}`); alSalir?.(); } }),
  ]);
}
