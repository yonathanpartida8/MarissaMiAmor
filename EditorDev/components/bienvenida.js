/**
 * BIENVENIDA (Fase 46) — las pantallitas del principio, una cosa a la vez y con su animación.
 *
 *   Hola (con el aviso de la beta) → tu nombre → tu fecha de nacimiento → tu país → tu género →
 *   tu usuario → tu contraseña → ¡listo!
 *
 *   · Salen la primera vez que se abre la app en un aparato. Si ya entraste a tu cuenta y a tu perfil le
 *     falta algo (nombre, cumpleaños, país o género), salen sólo esas pantallitas; si no falta nada, no salen.
 *     Ya vistas (o con «Ahora no»), no vuelven a salir solas: lo que falte se pone en «Tu perfil».
 *   · «Ya tengo cuenta» entra con tu usuario y contraseña (y luego pregunta sólo lo que falte).
 *   · La cuenta se crea de verdad en su M.YNTHN (/api/registro, con código si el servidor lo pide) y lo
 *     demás se guarda en tu perfil (/api/yo/perfil). Nada se guarda «de adorno» ni hay valores inventados.
 *   · «Ahora no» deja usar el editor sin cuenta (como siempre); no vuelven a salir solas en este aparato.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import { formularioCuenta } from "./cuenta.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { vibrar } from "../config/preferencias.js";

const VISTO = "editordev:bienvenida";
const USUARIO_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
/** México y Estados Unidos primero; luego Latinoamérica, España y Canadá. «ZZ» = otro país. */
export const PAISES = [["MX", "México"], ["US", "Estados Unidos"], ["AR", "Argentina"], ["BO", "Bolivia"], ["CL", "Chile"], ["CO", "Colombia"], ["CR", "Costa Rica"], ["CU", "Cuba"],
  ["DO", "República Dominicana"], ["EC", "Ecuador"], ["SV", "El Salvador"], ["GT", "Guatemala"], ["HN", "Honduras"], ["NI", "Nicaragua"], ["PA", "Panamá"], ["PY", "Paraguay"],
  ["PE", "Perú"], ["PR", "Puerto Rico"], ["UY", "Uruguay"], ["VE", "Venezuela"], ["ES", "España"], ["CA", "Canadá"], ["ZZ", "Otro país"]];
export const bandera = (c) => (c === "ZZ" || !/^[A-Z]{2}$/.test(c || "") ? "🌎" : String.fromCodePoint(...[...c].map((x) => 0x1f1a5 + x.charCodeAt(0))));
const GENEROS = [["Mujer", "Mujer", "🌸"], ["Hombre", "Hombre", "🌿"], ["LGBTQ+", "LGBTQ+", "🌈"], ["Otro", "Otro", "✨"]];
const hoyISO = () => SRV.hoyLocal();

const yaVista = () => { try { return localStorage.getItem(VISTO) === "1"; } catch (e) { return true; } };
const marcarVista = () => { try { localStorage.setItem(VISTO, "1"); } catch (e) { /* nada */ } };

/** Lo que le falta al perfil de quien ya entró (en orden de pantallitas). */
function faltan(p) {
  if (!p) return ["nombre", "cumple", "pais", "genero"];
  return [!p.nombre && "nombre", !p.cumple && "cumple", !p.pais && "pais", !p.genero && "genero"].filter(Boolean);
}

/** ¿Salen? (la primera vez sin cuenta, o con cuenta si al perfil le falta algo). */
export async function quizas(app) {
  // Ya las viste (o dijiste «Ahora no») en este aparato: no vuelven a salir solas.
  if (document.querySelector(".bv-capa") || yaVista()) return;
  if (SRV.conectado()) {
    let p = PF.datos().yo;
    try { p = (await SRV.perfil()).perfil; } catch (e) { return; }   // sin servidor: no se pregunta nada
    const f = faltan(p);
    if (!f.length) { marcarVista(); return; }
    abrir(app, { pasos: f, conCuenta: true, perfil: p });
    return;
  }
  abrir(app, { pasos: ["nombre", "cumple", "pais", "genero", "usuario", "contrasena"], conCuenta: false });
}

export function abrir(app, { pasos, conCuenta, perfil = {} }) {
  const d = { nombre: perfil.nombre || "", cumple: perfil.cumple || "", pais: perfil.pais || "", genero: perfil.genero || "", usuario: "", contrasena: "", codigo: "" };
  const orden = ["hola", ...pasos, "listo"];
  let i = 0, pidiendoCodigo = false;
  const barra = el("div.bv-progreso", { "aria-hidden": "true" }, pasos.map(() => el("i")));
  const atras = el("button.bv-atras", { type: "button", "aria-label": "Atrás", html: ico("izquierda"), onClick: () => ir(i - 1) });
  const caja = el("div.bv-caja");
  const capa = el("div.bv-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Bienvenida" }, [
    el("div.bv-fondo", { "aria-hidden": "true" }, Array.from({ length: 9 }, (_, k) => el("i", { text: ["♡", "✦", "♥", "✿", "☁"][k % 5], style: { "--k": k } }))),
    el("header.bv-cab", {}, [atras, barra]),
    caja,
  ]);
  document.body.append(capa);
  document.body.classList.add("con-bienvenida");
  requestAnimationFrame(() => capa.classList.add("ver"));
  const cerrar = () => {
    marcarVista();
    capa.classList.remove("ver");
    document.body.classList.remove("con-bienvenida");
    setTimeout(() => capa.remove(), reducido() ? 0 : 380);
  };
  app.bienvenida = { cerrar, abierta: () => capa.isConnected };

  const boton = (texto, al, clase = "") => el("button.bv-btn" + clase, { type: "button", html: texto, onClick: al });
  const error = el("p.bv-error", { role: "alert" });
  const mal = (t) => { error.textContent = t; error.classList.remove("ve"); void error.offsetWidth; error.classList.add("ve"); vibrar(18); app.sonidos?.sonar("error"); };
  const pantalla = (emoji, titulo, sub, cuerpo, pie) => el("section.bv-pantalla", {}, [
    el("div.bv-emoji", { text: emoji, "aria-hidden": "true" }), el("h1", { text: titulo }), sub ? el("p.bv-sub", { text: sub }) : null, ...cuerpo, error, el("div.bv-pie", {}, pie),
  ]);
  const enterSigue = (inp, al) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); al(); } });

  const P = {
    hola: () => pantalla("💌", "¡Hola! Bienvenido/a a My Love Pages", conCuenta ? "Antes de seguir, cuéntanos un poquito de ti (es rapidito)." : "Aquí haces páginas bonitas para tu amorcito y comparten sus días juntos.", [
      el("div.bv-beta", {}, [el("b", { text: "🛠️ Versión beta" }), el("p", { text: "Esta app la está desarrollando una sola persona y todavía está en fase beta, así que puede haber errores. ¡Gracias por tu paciencia y tu cariño! ♡" })]),
    ], [
      boton("Empezar ✨", () => ir(1), ".primario"),
      conCuenta ? null : boton("Ya tengo cuenta", () => entrar(), ".suave"),
      boton("Ahora no", () => { cerrar(); aviso("Cuando quieras, tu cuenta está en el menú principal ♡", 3200); }, ".texto"),
    ]),
    nombre: () => {
      const inp = el("input.bv-campo", { type: "text", maxlength: 40, autocomplete: "given-name", placeholder: "Tu nombre o apodo", value: d.nombre, "aria-label": "Tu nombre" });
      const sig = () => { const v = inp.value.replace(/\s+/g, " ").trim(); if (!v) { mal("Escribe tu nombre (o cómo te gusta que te digan)."); inp.focus(); return; } d.nombre = v; ir(i + 1); };
      enterSigue(inp, sig);
      return pantalla("🌷", "¿Cómo te llamas?", "Así te verá tu amorcito.", [inp], [boton("Siguiente", sig, ".primario")]);
    },
    cumple: () => {
      const inp = el("input.bv-campo", { type: "date", max: hoyISO(), min: "1900-01-01", value: d.cumple, autocomplete: "bday", "aria-label": "Tu fecha de nacimiento" });
      const sig = () => {
        const v = inp.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { mal("Elige tu fecha de nacimiento."); return; }
        if (v > hoyISO() || v < "1900-01-01") { mal("Esa fecha no puede ser."); return; }
        d.cumple = v; ir(i + 1);
      };
      enterSigue(inp, sig);
      return pantalla("🎂", "¿Cuándo naciste?", "Para festejarte el día de tu cumpleaños (tu amorcito lo verá ese día).", [inp], [boton("Siguiente", sig, ".primario")]);
    },
    pais: () => {
      let elegido = d.pais;
      const chips = el("div.bv-paises", { role: "radiogroup", "aria-label": "Tu país" });
      const otros = el("select.bv-campo", { "aria-label": "Otro país" }, [el("option", { value: "", text: "Otro país…" }), ...PAISES.slice(2).map(([c, n]) => el("option", { value: c, text: `${bandera(c)} ${n}` }))]);
      const pintar = () => {
        for (const b of chips.children) b.setAttribute("aria-checked", String(b.dataset.c === elegido));
        otros.value = PAISES.slice(2).some(([c]) => c === elegido) ? elegido : "";
        otros.classList.toggle("on", !!otros.value);
      };
      for (const [c, n] of PAISES.slice(0, 2)) chips.append(el("button.bv-pais", { type: "button", role: "radio", dataset: { c }, onClick: () => { elegido = c; pintar(); app.sonidos?.sonar("seleccionar"); } }, [el("span", { text: bandera(c), "aria-hidden": "true" }), el("b", { text: n })]));
      otros.addEventListener("change", () => { elegido = otros.value; pintar(); });
      pintar();
      return pantalla("🗺️", "¿De dónde eres?", "Así las fechas, las horas y las distancias se ven como en tu país.", [chips, otros],
        [boton("Siguiente", () => { if (!elegido) { mal("Elige tu país."); return; } d.pais = elegido; ir(i + 1); }, ".primario")]);
    },
    genero: () => {
      let elegido = d.genero;
      const g = el("div.bv-generos", { role: "radiogroup", "aria-label": "Tu género" }, GENEROS.map(([v, n, e]) => el("button.bv-genero", { type: "button", role: "radio", "aria-checked": String(v === elegido), dataset: { v }, onClick: (ev) => { elegido = v; for (const b of g.children) b.setAttribute("aria-checked", String(b === ev.currentTarget)); app.sonidos?.sonar("seleccionar"); } }, [el("span", { text: e, "aria-hidden": "true" }), el("b", { text: n })])));
      return pantalla("💞", "¿Cuál es tu género?", "Lo eliges tú (nunca se adivina) y sólo cambia unos detallitos de colores.", [g],
        [boton(pasos.includes("usuario") ? "Siguiente" : "Guardar ✨", () => { if (!elegido) { mal("Elige una opción."); return; } d.genero = elegido; if (pasos.includes("usuario")) ir(i + 1); else guardarPerfil(); }, ".primario")]);
    },
    usuario: () => {
      const inp = el("input.bv-campo", { type: "text", maxlength: 32, autocomplete: "username", autocapitalize: "none", spellcheck: "false", placeholder: "tu.usuario", value: d.usuario, "aria-label": "Tu usuario" });
      const pista = el("small.bv-pista", { text: "De 3 a 32: letras minúsculas, números, punto, guion o guion bajo." });
      inp.addEventListener("input", () => { const v = inp.value.trim().toLowerCase(); pista.classList.toggle("bien", USUARIO_RE.test(v)); });
      const sig = () => { const v = inp.value.trim().toLowerCase(); if (!USUARIO_RE.test(v)) { mal("Ese usuario no se puede: " + pista.textContent); inp.focus(); return; } d.usuario = v; ir(i + 1); };
      enterSigue(inp, sig);
      return pantalla("🐝", "Elige tu usuario", "Con él entras desde cualquier aparato y tu amorcito te encuentra.", [inp, pista], [boton("Siguiente", sig, ".primario")]);
    },
    contrasena: () => {
      const c1 = el("input.bv-campo", { type: "password", autocomplete: "new-password", placeholder: "Mínimo 8 caracteres", "aria-label": "Tu contraseña" });
      const c2 = el("input.bv-campo", { type: "password", autocomplete: "new-password", placeholder: "Repítela", "aria-label": "Repite tu contraseña" });
      const ver = el("label.bv-ver", {}, [el("input", { type: "checkbox", onChange: (e) => { c1.type = c2.type = e.target.checked ? "text" : "password"; } }), el("span", { text: "Ver la contraseña" })]);
      const cod = el("input.bv-campo", { type: "text", autocapitalize: "characters", placeholder: "Código de invitación", "aria-label": "Código de invitación", hidden: pidiendoCodigo ? null : "" });
      SRV.info().then((inf) => { if (inf.registro === "codigo") { pidiendoCodigo = true; cod.hidden = false; } if (inf.registro === "cerrado") mal("Por ahora este servidor no deja crear cuentas nuevas. Pídele una a quien lo administra."); }).catch(() => {});
      const crear = boton("Crear mi cuenta 💗", async () => {
        if (c1.value.length < 8) { mal("La contraseña necesita al menos 8 caracteres."); c1.focus(); return; }
        if (c1.value.length > 200) { mal("La contraseña es demasiado larga."); return; }
        if (c1.value !== c2.value) { mal("Las contraseñas no coinciden."); c2.focus(); return; }
        if (pidiendoCodigo && !cod.value.trim()) { mal("Escribe tu código de invitación."); cod.focus(); return; }
        crear.disabled = true; crear.classList.add("cargando");
        try {
          const r = await SRV.registrar(d.usuario, c1.value, cod.value.trim(), true);
          if (!r.token) { mal(r.mensaje || "Tu cuenta quedó pendiente."); crear.disabled = false; crear.classList.remove("cargando"); return; }
          await guardarPerfil(true);
        } catch (e) {
          mal(e.status === 409 && /usuario/i.test(e.message) ? "Ese usuario ya existe: regresa y elige otro." : e.message);
          crear.disabled = false; crear.classList.remove("cargando");
        }
      }, ".primario");
      enterSigue(c2, () => crear.click());
      return pantalla("🔐", "Tu contraseña", "Sólo tú la sabes: guárdala bien (nadie te la va a pedir).", [c1, c2, ver, cod], [crear]);
    },
    listo: () => {
      const n = d.nombre || SRV.usuario()?.usuario || "";
      const confeti = reducido() || document.body.classList.contains("ed-ultra") ? [] : Array.from({ length: 14 }, (_, k) => el("i.bv-confeti", { style: { "--k": k } }));
      return el("section.bv-pantalla.listo", {}, [...confeti, el("div.bv-emoji", { text: "🥰", "aria-hidden": "true" }), el("h1", { text: `¡Listo${n ? ", " + n : ""}!` }), el("p.bv-sub", { text: "Ya puedes crear detallitos y, si te vinculas con tu amorcito, compartir sus días juntos." }),
        el("div.bv-pie", {}, [
          PF.datos().pareja ? null : boton("Vincular a mi amorcito 💞", () => { cerrar(); app.detallitos?.abrir(null, "vincular"); }, ".primario"),
          boton("Ir al menú", () => { cerrar(); app.menuPrincipal?.ir?.("inicio"); }, PF.datos().pareja ? ".primario" : ".suave"),
        ])]);
    },
  };

  /** Guarda en tu perfil lo que contaste (ya con sesión). */
  async function guardarPerfil(recienCreada = false) {
    const cambios = Object.fromEntries(["nombre", "cumple", "pais", "genero"].filter((k) => d[k]).map((k) => [k, d[k]]));
    try {
      await PF.poner(await SRV.guardarPerfil(cambios));
      app.sonidos?.sonar("exito");
      ir(orden.length - 1);
    } catch (e) {
      // La cuenta ya existe aunque el perfil no se haya guardado: se puede completar luego en «Tu perfil».
      if (recienCreada) { aviso("Tu cuenta quedó lista, pero tus datos no se guardaron: complétalos en «Tu perfil».", 5200, "error"); ir(orden.length - 1); }
      else mal(e.message || "No se pudo guardar. Inténtalo otra vez.");
    }
  }

  /** «Ya tengo cuenta»: entrar y luego preguntar sólo lo que le falte a tu perfil. */
  function entrar() {
    const form = formularioCuenta(app, { compacto: true, alEntrar: async () => {
      let p = null;
      try { p = (await SRV.perfil()).perfil; } catch (e) { /* sin perfil: se pregunta todo */ }
      const f = faltan(p);
      if (!f.length) { cerrar(); app.menuPrincipal?.ir?.("inicio"); return; }
      capa.remove(); document.body.classList.remove("con-bienvenida");
      abrir(app, { pasos: f, conCuenta: true, perfil: p || {} });
    } });
    caja.replaceChildren(el("section.bv-pantalla", {}, [el("div.bv-emoji", { text: "🔑", "aria-hidden": "true" }), el("h1", { text: "¡Qué gusto verte!" }), form,
      el("div.bv-pie", {}, [boton("Volver", () => ir(0), ".texto")])]));
    atras.hidden = true;
  }

  function ir(n) {
    if (n < 0 || n >= orden.length) return;
    const antes = i;
    i = n;
    error.textContent = "";
    const k = orden[i];
    const nueva = P[k]();
    nueva.classList.add(n >= antes ? "entra" : "vuelve");
    caja.replaceChildren(nueva);
    atras.hidden = i === 0 || k === "listo";
    barra.hidden = k === "hola" || k === "listo";
    [...barra.children].forEach((x, j) => { x.classList.toggle("hecho", j < i - 1); x.classList.toggle("ahora", j === i - 1); });
    if (k !== "hola" && k !== "listo") vibrar(6);
    if (k === "listo") app.sonidos?.sonar("brillo");
    setTimeout(() => nueva.querySelector("input:not([type=checkbox]):not([hidden]), select")?.focus({ preventScroll: true }), reducido() ? 0 : 340);
  }
  ir(0);
}
