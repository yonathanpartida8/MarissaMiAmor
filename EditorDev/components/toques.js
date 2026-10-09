/**
 * EFECTOS AL TOCAR Y ZONAS TÁCTILES (lado del editor).
 *
 *   seccionToque(insp, e)   «Efectos al tocar» en el inspector: partículas,
 *                           lo que hace el elemento, color, cantidad, probar y
 *                           el acceso al editor de zonas.
 *   seccionToquePagina(insp) lo mismo para cualquier toque en la página.
 *   TOQUES_SEC              la sección «Al tocar» (riel y barra de abajo):
 *                           categorías con fichas animadas y vista previa en el
 *                           propio elemento antes de guardar («Atrás» / «Usar»).
 *   EditorZonas             el editor visual: 1 dibuja zonas sobre el elemento,
 *                           2 toca una y dile qué hace, 3 pruébala.
 *
 * Las zonas viven DENTRO del nodo del elemento (en porcentajes): se mueven,
 * escalan y giran con él sin recalcular nada. Mientras se arrastran sólo se
 * toca el DOM; al soltar se guarda una sola vez (un solo «deshacer»).
 */
import { el, seccion, fila, boton, control, aviso, Vinculos } from "./ui.js";
import { hojita } from "./hoja.js";
import { ico } from "./iconos.js";
import { elegir } from "../assets/selector.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const uid = () => "z" + Math.random().toString(36).slice(2, 8);

/* Dibujitos de cada efecto para las fichas (CSS animado, nada de imágenes). */
const MINI = {
  "": '<i class="tq-nada"></i>',
  ondas: '<i class="tq-onda"></i><i class="tq-onda b"></i>',
  corazones: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>',
  chispas: '<svg viewBox="0 0 24 24"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="currentColor"/></svg>',
  estrellas: '<svg viewBox="0 0 24 24"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill="currentColor"/></svg>',
  confeti: '<i class="tq-cf a"></i><i class="tq-cf b"></i><i class="tq-cf c"></i>',
  burbujas: '<i class="tq-bu a"></i><i class="tq-bu b"></i>',
  teamo: '<b class="tq-txt">te amo</b>',
  besos: '<svg viewBox="0 0 24 24"><path d="M1.5 11.5C4 8 6.6 6.4 8.8 6.4c1.3 0 2.4.7 3.2 1.6.8-.9 1.9-1.6 3.2-1.6 2.2 0 4.8 1.6 7.3 5.1-2.7 4-6.3 6.6-10.5 6.6S4.2 15.5 1.5 11.5z" fill="currentColor"/></svg>',
  petalos: '<i class="tq-pe a"></i><i class="tq-pe b"></i>',
};
const MINI_MOV = (k) => `<i class="tq-caja tq-m-${k || "nada"}"></i>`;

function fichas(lista, mini, leer, poner, v) {
  const caja = el("div.ed-tq-fichas");
  for (const [k, n] of lista) {
    const b = el("button.ed-tq-ficha", { type: "button", "aria-label": n, title: n, dataset: { k } }, [el("span.ed-tq-mini", { html: mini(k) }), el("small", { text: n })]);
    b.addEventListener("click", () => poner(k));
    caja.append(b);
  }
  const pintar = () => { const a = leer() || ""; for (const b of caja.children) b.classList.toggle("on", b.dataset.k === a); };
  pintar();
  v.add(pintar);
  return caja;
}

/** Centro en pantalla del nodo de un elemento en el lienzo. */
function centroDe(app, id) {
  const n = app.lienzo?.pag?.nodos.get(id);
  if (!n) return null;
  const r = n.getBoundingClientRect();
  return { n, x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function probarToque(app, e, t) {
  const c = centroDe(app, e.id);
  if (!c || !t) return;
  RT.efectoToque(c.n, t, c.x, c.y);
}

/* ── Categorías: todo ordenado para encontrarlo rápido ─────────────── */
const N_EF = Object.fromEntries(RT.TOQUES), N_MOV = Object.fromEntries(RT.MOVS);
const ef = (k) => [N_EF[k] || k, { efecto: k }];
const mv = (k) => [N_MOV[k] || k, { mov: k }];
export const CATEGORIAS = [
  { id: "combos", n: "Combinados", ayuda: "Partículas y movimiento juntos, listos para usar.", items: [
    ["Amor", { efecto: "corazones", mov: "pulso" }], ["Te amo", { efecto: "teamo", mov: "crecer" }],
    ["Besitos", { efecto: "besos", mov: "rebote", color: "#c8102e" }], ["Magia", { efecto: "chispas", mov: "brillo", color: "#ffc93c" }],
    ["Fiesta", { efecto: "confeti", mov: "saltito" }], ["Romántico", { efecto: "petalos", mov: "flotar" }],
    ["Estelar", { efecto: "estrellas", mov: "girar", color: "#ffc93c" }], ["Burbujitas", { efecto: "burbujas", mov: "rebote", color: "#7cc6ff" }],
  ] },
  { id: "particulas", n: "Partículas", ayuda: "Salen del dedo, justo donde toca.", items: ["corazones", "besos", "chispas", "estrellas", "confeti", "burbujas", "petalos"].map(ef) },
  { id: "ondas", n: "Ondas y texto", ayuda: "Un círculo de luz o unas palabritas que suben.", items: ["ondas", "teamo"].map(ef) },
  { id: "mov", n: "Movimiento", ayuda: "Lo que hace el propio elemento al tocarlo.", items: ["pulso", "rebote", "saltito", "sacudir", "girar", "crecer", "flotar"].map(mv) },
  { id: "luz", n: "Luz y color", ayuda: "El elemento brilla, cambia de color o se transparenta un momento.", items: ["brillo", "color", "desvanecer"].map(mv) },
];
let catActiva = "combos";

function miniDe(c) {
  if (c.efecto && c.mov) return `<i class="tq-caja chica tq-m-${c.mov}"></i>${MINI[c.efecto] || ""}`;
  return c.efecto ? MINI[c.efecto] || "" : MINI_MOV(c.mov);
}
const coincide = (t, c) => Object.keys(c).filter((k) => k !== "color").every((k) => (t[k] || "") === c[k]);
const resumen = (t) => [t.efecto && N_EF[t.efecto], t.mov && N_MOV[t.mov]].filter(Boolean).join(" + ");

/** Las pestañitas de categoría y sus fichas. Tocar una ficha abre la vista previa. */
function categorias(app, ids, leer, v) {
  const caja = el("div.ed-tq-cats-caja");
  const tabs = el("div.ed-tq-cats", { role: "tablist" });
  const ayuda = el("small.ed-ayuda.ed-tq-cat-ayuda");
  const rej = el("div.ed-tq-fichas");
  const pintar = () => {
    const cat = CATEGORIAS.find((x) => x.id === catActiva) || CATEGORIAS[0];
    for (const b of tabs.children) { const on = b.dataset.k === cat.id; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }
    ayuda.textContent = cat.ayuda;
    rej.textContent = "";
    for (const [n, c] of cat.items) {
      const b = el("button.ed-tq-ficha", { type: "button", title: n, "aria-label": n }, [el("span.ed-tq-mini" + (c.efecto && c.mov ? ".combo" : ""), { html: miniDe(c), style: c.color ? { color: c.color } : {} }), el("small", { text: n })]);
      b._c = c;
      b.addEventListener("click", () => { const l = ids(); if (!l.length) return aviso("Primero toca algo de la hoja"); previaToque(app, l, c, n, b.closest(".ed-panel, .ed-insp")); });
      rej.append(b);
    }
    marcar();
  };
  const marcar = () => { const t = leer() || {}; for (const b of rej.children) b.classList.toggle("on", RT.tieneToque(t) && coincide(t, b._c)); };
  for (const cat of CATEGORIAS) tabs.append(el("button.ed-tq-cat", { type: "button", role: "tab", text: cat.n, dataset: { k: cat.id }, onClick: () => { catActiva = cat.id; pintar(); } }));
  pintar();
  v.add(marcar);
  caja.append(tabs, ayuda, rej);
  return caja;
}

/**
 * Vista previa de un efecto al tocar en lo elegido: se ve en la hoja (se repite
 * solito) y no se guarda hasta «Usar»; «Atrás» lo deja como estaba. La hojita
 * es baja y la hoja se corre para que el elemento quede a la vista.
 */
let previaAbierta = null;
export function previaToque(app, ids, cambio, nombre, sobre) {
  const E = app.estado;
  // Tocar otra ficha con la vista previa abierta: la anterior se va sin guardar.
  previaAbierta?.cerrar?.(null);
  ids = ids.filter((id) => E.el(id));
  if (!ids.length) return;
  const t = { color: "#ff5c93", cantidad: 1, ...(E.el(ids[0]).toque || {}), ...cambio };
  const v = new Vinculos();
  const demo = () => { for (const id of ids.slice(0, 4)) { const c = centroDe(app, id); if (c) RT.efectoToque(c.n, t, c.x, c.y); } };
  const txt = el("p.ed-tq-resumen");
  const pintarTxt = () => { txt.textContent = RT.tieneToque(t) ? "Al tocarlo: " + resumen(t) : "Sin efecto"; };
  const sel = (lista, k) => {
    const s = el("select.ed-sel", { "aria-label": k === "efecto" ? "Sale del dedo" : "El elemento hace" }, lista.map(([a, b]) => el("option", { value: a, text: b })));
    s.value = t[k] || "";
    s.addEventListener("change", () => { t[k] = s.value || undefined; pintarTxt(); demo(); });
    return s;
  };
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let reloj = 0, mio = null;
  pintarTxt();
  hojita({
    titulo: nombre ? "Vista previa · " + nombre : "Vista previa",
    clase: "ed-previa-efecto.ed-previa-toque",
    velo: false,
    sobre,
    contenido: [
      el("div.ed-tq-resumen-fila", {}, [txt, boton(I("toque", "Otra vez"), demo, "chico")]),
      el("div.ed-rejilla2", {}, [fila("Del dedo", sel(RT.TOQUES, "efecto")), fila("El elemento", sel(RT.MOVS, "mov"))]),
      el("div.ed-rejilla2", {}, [
        fila("Color", control(v, { tipo: "color", leer: () => t.color, escribir: (x) => { t.color = x; } })),
        fila("Cantidad", control(v, { tipo: "rango", min: 0.4, max: 2.2, paso: 0.1, leer: () => t.cantidad, escribir: (x) => { t.cantidad = x; } })),
      ]),
      el("small.ed-ayuda", { text: ids.length > 1 ? `Se verá en los ${ids.length} elementos elegidos. No se guarda hasta «Usar».` : "Así lo verá ella al tocarlo. No se guarda hasta «Usar»." }),
    ],
    acciones: [[I("volver", "Atrás"), null], [I("ok", "Usar"), "usar", "primario"]],
    alAbrir: (panel) => {
      previaAbierta = mio = panel;
      v.refrescar();
      requestAnimationFrame(() => {
        if (matchMedia("(max-width: 1023px)").matches) app.lienzo.mostrarSeleccion?.(panel.offsetHeight + 12);
        else app.lienzo.apartarDe?.(panel.getBoundingClientRect());
        setTimeout(demo, 300);
        if (!quieto) reloj = setInterval(demo, 2200);
      });
    },
  }).then((r) => {
    clearInterval(reloj);
    if (previaAbierta === mio) previaAbierta = null;
    if (r !== "usar") return;
    const fin = { ...t };
    for (const k of Object.keys(fin)) if (fin[k] === undefined || fin[k] === "") delete fin[k];
    E.transaccion("Al tocar: " + (nombre || resumen(fin) || "efecto"), () => { for (const id of ids) if (E.el(id)) E.setEl(id, { toque: RT.tieneToque(fin) ? fin : null }, "Efecto al tocar"); });
  });
}

/* ── La sección «Al tocar» (riel de la izquierda y barra de abajo) ── */
export const TOQUES_SEC = {
  _toques(c) {
    const E = this.E, app = this.app, v = this.v;
    const sel = E.seleccionados;
    if (!sel.length) {
      c.append(el("p.ed-nota.suave", { text: "Toca algo de la hoja para elegirlo: luego toca un efecto y lo verás en él antes de usarlo." }));
      c.append(seccionToquePagina(this));
      return;
    }
    const ids = sel.map((x) => x.id);
    const t = () => E.el(ids[0])?.toque || {};
    const ahoraTxt = el("span");
    const ahoraMini = el("span.ed-tq-mini");
    const ahora = el("div.ed-tq-ahora", {}, [ahoraMini, el("div", {}, [el("b", { text: sel.length > 1 ? `${sel.length} elementos` : "«" + sel[0].nombre + "»" }), ahoraTxt]),
      boton(ico("toque"), () => { if (RT.tieneToque(t())) for (const id of ids) probarToque(app, E.el(id), E.el(id).toque); else aviso("Elige un efecto de abajo"); }, "chico ico", "Probar"),
      boton(ico("cerrar"), () => E.transaccion("Quitar efecto al tocar", () => { for (const id of ids) E.setEl(id, { toque: null }, "Quitar efecto al tocar"); }), "chico ico", "Quitar efecto"),
    ]);
    v.add(() => {
      const x = t();
      ahoraTxt.textContent = RT.tieneToque(x) ? "Al tocarlo: " + resumen(x) : "Todavía no hace nada al tocarlo";
      ahoraMini.innerHTML = RT.tieneToque(x) ? miniDe(x) : MINI[""];
      ahoraMini.classList.toggle("combo", !!(x.efecto && x.mov));
    });
    c.append(ahora, categorias(app, () => ids, t, v));
    if (sel.length === 1) {
      const zonas = (sel[0].zonas || []).length;
      c.append(el("div.ed-tq-zonas", {}, [
        el("div", {}, [el("b", { text: "Zonas táctiles" }), el("small", { text: zonas ? `${zonas} zona${zonas > 1 ? "s" : ""}: cada una hace lo suyo` : "Partes del elemento que responden distinto (ideal para HTML)" })]),
        boton(I("zonas", zonas ? "Editar zonas" : "Crear zonas"), () => app.zonas?.abrir(ids[0]), "primario chico"),
      ]));
    }
    c.append(el("div.ed-botonera", {}, [
      boton(I("sonido", "Sonido al tocar"), () => app.insp.abrir("diseno", "Sonidos"), "chico"),
      boton(I("ojo", "Mostrar o esconder otra cosa"), () => app.insp.abrir("diseno", "Al tocarlo"), "chico"),
    ]));
    const pag = seccionToquePagina(this);
    pag.open = false;
    c.append(pag);
  },
};

/* ── «Efectos al tocar» de un elemento ─────────────────────────────── */
export function seccionToque(insp, e) {
  const E = insp.E, app = insp.app, v = insp.v;
  const t = () => E.el(e.id)?.toque || {};
  const zonas = (E.el(e.id)?.zonas || []).length;
  const hijos = [
    el("p.ed-ayuda.ed-tq-intro", { text: "Lo que pasa cuando ella lo toque en el librito. Toca una ficha: lo verás en el elemento antes de usarlo." }),
    categorias(app, () => [e.id], t, v),
    el("div.ed-rejilla2", {}, [
      fila("Color", control(v, { tipo: "color", leer: () => t().color || "#ff5c93", escribir: (x) => { if (RT.tieneToque(t())) E.setEl(e.id, { "toque.color": x }, "Color del efecto", "tqc" + e.id); } })),
      fila("Cantidad", control(v, { tipo: "rango", min: 0.4, max: 2.2, paso: 0.1, leer: () => t().cantidad ?? 1, escribir: (x) => { if (RT.tieneToque(t())) E.setEl(e.id, { "toque.cantidad": x }, "Cantidad del efecto", "tqn" + e.id); } })),
    ]),
    el("div.ed-botonera", {}, [
      boton(I("toque", "Probar"), () => { if (RT.tieneToque(t())) probarToque(app, e, t()); else aviso("Elige primero un efecto"); }, "chico"),
      boton(I("cerrar", "Quitar efecto"), () => E.setEl(e.id, { toque: null }, "Quitar efecto al tocar"), "chico"),
    ]),
    el("div.ed-tq-zonas", {}, [
      el("div", {}, [el("b", { text: "Zonas táctiles" }), el("small", { text: zonas ? `${zonas} zona${zonas > 1 ? "s" : ""}: cada una hace lo suyo` : "Partes del elemento que responden distinto (ideal para HTML)" })]),
      boton(I("zonas", zonas ? "Editar zonas" : "Crear zonas"), () => app.zonas?.abrir(e.id), "primario chico"),
    ]),
    el("small.ed-ayuda", { text: "Sonido al tocar: en «Sonidos». Mostrar, esconder o animar otra cosa: en «Al tocarlo»." }),
  ];
  return seccion("Efectos al tocar", hijos, { abierta: !!(e.toque || zonas), clase: "ed-tq" });
}

/* ── «Al tocar la página» ──────────────────────────────────────────── */
export function seccionToquePagina(insp) {
  const E = insp.E, v = insp.v;
  const t = () => E.pagina?.toque || {};
  const poner = (k) => {
    const nuevo = { color: "#ff5c93", cantidad: 1, ...t(), efecto: k };
    E.setPag({ toque: k ? nuevo : null }, "Efecto al tocar la página");
    const l = insp.app.lienzo?.vistaEl?.getBoundingClientRect();
    if (k && l) RT.particulas(k, l.left + l.width / 2, l.top + l.height / 2, nuevo);
  };
  return seccion("Al tocar la página", [
    el("p.ed-ayuda", { text: "Un efectito en cualquier parte que toque de esta página (los elementos con su propio efecto usan el suyo)." }),
    fichas(RT.TOQUES, (k) => MINI[k] || "", () => t().efecto, poner, v),
    el("div.ed-rejilla2", {}, [
      fila("Color", control(v, { tipo: "color", leer: () => t().color || "#ff5c93", escribir: (x) => { if (t().efecto) E.setPag({ "toque.color": x }, "Color del efecto", "tqpc"); } })),
      fila("Cantidad", control(v, { tipo: "rango", min: 0.4, max: 2.2, paso: 0.1, leer: () => t().cantidad ?? 1, escribir: (x) => { if (t().efecto) E.setPag({ "toque.cantidad": x }, "Cantidad del efecto", "tqpn"); } })),
    ]),
  ], { abierta: !!E.pagina?.toque, clase: "ed-tq" });
}

/* ── El editor visual de zonas ─────────────────────────────────────── */
export class EditorZonas {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.id = null;
    this.sel = null;
    this.probando = false;
    this.E.on("sel", () => { if (this.id && !this.E.sel.includes(this.id)) this.cerrar(); });
    this.E.on("actual", () => this.cerrar());
    this.E.on("el", ({ e } = {}) => { if (this.id && (!e || e === this.id)) this._pintar(); });
    this.E.on("els", () => { if (this.id) { if (!this.E.el(this.id)) this.cerrar(); else this._pintar(); } });
    addEventListener("keydown", (ev) => {
      if (!this.id || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); if (this.sel) { this.sel = null; this._pintar(); } else this.cerrar(); }
      if ((ev.key === "Delete" || ev.key === "Backspace") && this.sel) { ev.preventDefault(); ev.stopPropagation(); this._borrar(this.sel); }
    }, true);
  }

  get el() { return this.E.el(this.id); }
  get zonas() { return (this.el?.zonas || []).map((z) => ({ ...z })); }
  _guardar(zs, nombre) { this.E.setEl(this.id, { zonas: zs.length ? zs : null }, nombre || "Zonas táctiles"); }

  abrir(id) {
    if (this.id) this.cerrar();
    const L = this.app.lienzo;
    if (!L?.pag?.nodos.get(id)) return;
    L.usarHerramienta?.(null);
    L.salirProbar?.();
    if (!this.E.sel.includes(id)) this.E.seleccionar([id]);
    this.id = id;
    this.sel = null;
    this.probando = false;
    L.zonasDe = id;
    document.body.classList.add("ed-con-zonas");
    if (window.matchMedia("(max-width: 1023px)").matches) { this.app.lateral?.cerrar?.(); this.app.cerrarHojaSec?.(); this.app.cerrarHojaInsp?.(); }
    this._panel();
    this._pintar();
    L.pintarSobre?.();
    if (!(this.el?.zonas || []).length) aviso("Arrastra sobre el elemento para dibujar una zona");
  }

  cerrar() {
    if (!this.id) return;
    const L = this.app.lienzo;
    this.capa?.remove();
    this.capa = null;
    this.panel?.remove();
    this.panel = null;
    if (this._sobreInsp) { removeEventListener("resize", this._sobreInsp); this._sobreInsp = null; }
    this.id = null;
    this.sel = null;
    if (L) { L.zonasDe = null; L.pintarSobre?.(); if (this._vista) L.volverVista?.(this._vista); }
    this._vista = null;
    document.body.classList.remove("ed-con-zonas", "ed-zonas-probando");
  }

  /* El nodo del elemento en la hoja (puede cambiar si la hoja se repinta). */
  _nodo() { return this.app.lienzo?.pag?.nodos.get(this.id) || null; }

  /** De la pantalla a coordenadas 0..1 del elemento (aunque esté girado). */
  _local(n, x, y) {
    const r = n.getBoundingClientRect();
    const w = n.offsetWidth || 1, h = n.offsetHeight || 1;
    const a = ((this.el?.rot || 0) * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    const s = r.width / (w * Math.abs(cos) + h * Math.abs(sin)) || 1;
    const dx = (x - (r.left + r.width / 2)) / s, dy = (y - (r.top + r.height / 2)) / s;
    return { x: (dx * cos + dy * sin + w / 2) / w, y: (-dx * sin + dy * cos + h / 2) / h, w, h };
  }

  _pintar() {
    const n = this._nodo();
    if (!this.id) return;
    if (!n) return this.cerrar();
    if (!this.capa || this.capa.parentNode !== n) {
      this.capa?.remove();
      this.capa = el("div.ed-zonas-capa");
      this.capa.addEventListener("pointerdown", (ev) => this._abajo(ev));
      n.append(this.capa);
    }
    this.capa.classList.toggle("probando", this.probando);
    const zs = this.zonas;
    if (this.sel && !zs.some((z) => z.id === this.sel)) this.sel = null;
    this.capa.textContent = "";
    zs.forEach((z, i) => {
      const d = el("div.ed-zona" + (z.id === this.sel ? ".on" : ""), { dataset: { id: z.id }, style: { left: z.x * 100 + "%", top: z.y * 100 + "%", width: z.w * 100 + "%", height: z.h * 100 + "%" } }, [
        el("span.ed-zona-et", { text: `${i + 1}${z.nombre ? " · " + z.nombre : ""}` }),
        ...(z.id === this.sel && !this.probando ? ["nw", "ne", "sw", "se"].map((m) => el("i.ed-zona-m", { dataset: { m } })) : []),
      ]);
      this.capa.append(d);
    });
    this._pintarPanel();
  }

  _abajo(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const n = this._nodo();
    if (!n) return;
    const p0 = this._local(n, ev.clientX, ev.clientY);
    const zd = ev.target.closest(".ed-zona");
    if (this.probando) {
      const z = zd && this.zonas.find((x) => x.id === zd.dataset.id);
      if (!z) return;
      RT.efectoToque(n, z, ev.clientX, ev.clientY);
      if (z.sonido) RT.sonar(this.app.bib.url(z.sonido), z.volumen ?? 0.9);
      if (z.accion?.tipo) aviso("En el librito: " + (ACCIONES.find((a) => a[0] === z.accion.tipo)?.[1] || "su acción"));
      if (!RT.tieneToque(z) && !z.sonido && !z.accion?.tipo) aviso("Esta zona todavía no hace nada: configúrala");
      return;
    }
    const zs = this.zonas;
    const man = ev.target.closest(".ed-zona-m")?.dataset.m;
    let z = zd ? zs.find((x) => x.id === zd.dataset.id) : null;
    let nueva = false;
    if (!z) {
      z = { id: uid(), x: p0.x, y: p0.y, w: 0, h: 0, efecto: "chispas", color: "#ff5c93", cantidad: 1 };
      nueva = true;
    }
    const z0 = { ...z };
    this.sel = z.id;
    const minW = 14 / p0.w, minH = 14 / p0.h;
    let movio = false;
    const cap = this.capa;
    try { cap.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    const dom = () => cap.querySelector(`.ed-zona[data-id="${z.id}"]`);
    if (nueva) { cap.append(el("div.ed-zona.on.nueva", { dataset: { id: z.id } })); }
    else this._pintar();
    const lim = (v) => Math.max(0, Math.min(1, v));
    const mover = (e2) => {
      const p = this._local(n, e2.clientX, e2.clientY);
      const dx = p.x - p0.x, dy = p.y - p0.y;
      if (!movio && Math.hypot(dx * p0.w, dy * p0.h) < 4) return;
      movio = true;
      if (nueva) {
        z.x = lim(Math.min(p0.x, p.x)); z.y = lim(Math.min(p0.y, p.y));
        z.w = lim(Math.max(p0.x, p.x)) - z.x; z.h = lim(Math.max(p0.y, p.y)) - z.y;
      } else if (man) {
        let x1 = z0.x, y1 = z0.y, x2 = z0.x + z0.w, y2 = z0.y + z0.h;
        if (man.includes("w")) x1 = Math.min(lim(z0.x + dx), x2 - minW); else x2 = Math.max(lim(z0.x + z0.w + dx), x1 + minW);
        if (man.includes("n")) y1 = Math.min(lim(z0.y + dy), y2 - minH); else y2 = Math.max(lim(z0.y + z0.h + dy), y1 + minH);
        z.x = x1; z.y = y1; z.w = x2 - x1; z.h = y2 - y1;
      } else {
        z.x = Math.max(0, Math.min(1 - z0.w, z0.x + dx));
        z.y = Math.max(0, Math.min(1 - z0.h, z0.y + dy));
      }
      const d = dom();
      if (d) Object.assign(d.style, { left: z.x * 100 + "%", top: z.y * 100 + "%", width: z.w * 100 + "%", height: z.h * 100 + "%" });
    };
    const soltar = () => {
      cap.removeEventListener("pointermove", mover);
      cap.removeEventListener("pointerup", soltar);
      cap.removeEventListener("pointercancel", soltar);
      if (nueva) {
        // Un toque sin arrastrar en lo vacío: deselecciona (o crea una zona mediana).
        if (!movio || z.w < minW || z.h < minH) {
          if (!movio && !zs.length) {
            z.w = Math.min(0.4, 1 - p0.x); z.h = Math.min(0.3, 1 - p0.y);
            z.x = Math.max(0, Math.min(p0.x - z.w / 2, 1 - z.w)); z.y = Math.max(0, Math.min(p0.y - z.h / 2, 1 - z.h));
          } else { this.sel = null; this._pintar(); return; }
        }
        this._guardar([...zs, z], "Nueva zona táctil");
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) { /* nada */ }
        return;
      }
      if (!movio) return this._pintar();
      this._guardar(zs.map((x) => (x.id === z.id ? z : x)), man ? "Tamaño de la zona" : "Mover la zona");
    };
    cap.addEventListener("pointermove", mover);
    cap.addEventListener("pointerup", soltar);
    cap.addEventListener("pointercancel", soltar);
  }

  _cambiar(cambios, nombre) {
    const zs = this.zonas;
    const z = zs.find((x) => x.id === this.sel);
    if (!z) return;
    Object.assign(z, cambios);
    this._guardar(zs, nombre || "Zona táctil");
  }

  _borrar(id) {
    this._guardar(this.zonas.filter((z) => z.id !== id), "Borrar zona táctil");
    this.sel = null;
    this._pintar();
  }

  _duplicar() {
    const zs = this.zonas;
    const z = zs.find((x) => x.id === this.sel);
    if (!z) return;
    const c = { ...z, id: uid(), x: Math.min(1 - z.w, z.x + 0.04), y: Math.min(1 - z.h, z.y + 0.04), nombre: z.nombre ? z.nombre + " (copia)" : "" };
    this.sel = c.id;
    this._guardar([...zs, c], "Duplicar zona táctil");
  }

  /* ── El panelito flotante (pasos, opciones de la zona elegida) ── */
  _panel() {
    this.panel?.remove();
    this.pasos = el("div.ed-zp-pasos");
    this.cuerpo = el("div.ed-zp-cuerpo");
    this.bProbar = el("button.ed-btn.chico", { type: "button", onClick: () => { this.probando = !this.probando; this.sel = null; document.body.classList.toggle("ed-zonas-probando", this.probando); this._pintar(); } });
    this.panel = el("div.ed-zonas-panel", { role: "dialog", "aria-label": "Zonas táctiles" }, [
      el("div.ed-zp-cab", {}, [
        el("b", { html: I("zonas", "Zonas táctiles") }),
        this.bProbar,
        el("button.ed-btn.chico.primario", { type: "button", text: "Listo", onClick: () => this.cerrar() }),
      ]),
      this.pasos,
      this.cuerpo,
    ]);
    // Que el lienzo no crea que el panel es la hoja.
    this.panel.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    // Computadora: ocupa el lugar del inspector (la hoja queda libre).
    // Teléfono: hojita abajo, y la hoja se corre para que el elemento se vea.
    const movil = matchMedia("(max-width: 1023px)").matches;
    const insp = document.querySelector(".ed-insp");
    if (!movil && insp && insp.offsetWidth > 200) {
      this.panel.classList.add("en-insp");
      document.body.append(this.panel);
      this._sobreInsp = () => {
        const r = insp.getBoundingClientRect();
        if (this.panel) Object.assign(this.panel.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      };
      this._sobreInsp();
      addEventListener("resize", this._sobreInsp);
    } else (document.querySelector(".ed-centro") || document.body).append(this.panel);
    // Se acerca al elemento para dibujar cómodo (al terminar, vuelve como estaba).
    requestAnimationFrame(() => {
      // Teléfono: el panelito crece al elegir una zona (hasta 46 % de alto): se deja ese lugar.
      const abajo = this.panel?.classList.contains("en-insp") ? 0 : innerHeight * 0.46 + 70;
      this._vista = this.app.lienzo?.enfocar?.(this.el, abajo) || null;
    });
  }

  _pintarPanel() {
    if (!this.panel) return;
    const zs = this.zonas;
    const z = zs.find((x) => x.id === this.sel);
    this.bProbar.innerHTML = this.probando ? I("lapiz", "Volver a editar") : I("play", "Probar");
    this.bProbar.classList.toggle("on", this.probando);
    const paso = this.probando ? 3 : z ? 2 : 1;
    this.pasos.innerHTML = "";
    [["1", "Dibuja"], ["2", "Configura"], ["3", "Prueba"]].forEach(([k, t], i) => this.pasos.append(el("span" + (paso === i + 1 ? ".on" : paso > i + 1 ? ".hecho" : ""), {}, [el("i", { text: k }), el("small", { text: t })])));
    const c = this.cuerpo;
    c.textContent = "";
    if (this.probando) { c.append(el("p.ed-ayuda", { text: "Toca las zonas como lo haría ella. Las marcas están escondidas; vuelven al editar." })); return; }
    if (!z) {
      c.append(el("p.ed-ayuda", { text: zs.length ? "Toca una zona para configurarla, o arrastra en un espacio libre para dibujar otra." : "Arrastra el dedo sobre el elemento para dibujar la primera zona." }));
      if (zs.length) c.append(el("div.ed-zp-lista", {}, zs.map((x, i) => el("button.ed-zp-chip", { type: "button", text: `Zona ${i + 1}${x.nombre ? " · " + x.nombre : ""}`, onClick: () => { this.sel = x.id; this._pintar(); } }))));
      return;
    }
    const sel = (opciones, valor, al) => {
      const s = el("select.ed-sel", {}, opciones.map(([k, t]) => el("option", { value: k, text: t })));
      s.value = valor || "";
      s.addEventListener("change", () => al(s.value));
      return s;
    };
    const nombre = el("input.ed-txt", { type: "text", value: z.nombre || "", placeholder: "Nombre (opcional)", maxLength: 40 });
    nombre.addEventListener("change", () => this._cambiar({ nombre: nombre.value.trim() }, "Nombre de la zona"));
    const color = el("input", { type: "color", value: z.color || "#ff5c93", "aria-label": "Color" });
    color.addEventListener("change", () => this._cambiar({ color: color.value }, "Color de la zona"));
    const sonidoN = z.sonido ? this.E.proyecto.assets[z.sonido]?.nombre || "sonido" : "ninguno";
    const otros = (this.E.pagina?.els || []).filter((x) => x.id !== this.id).map((x) => [x.id, x.nombre + (x.inicioOculto ? " (escondido)" : "")]);
    const paginas = this.E.proyecto.orden.map((pid, i) => [pid, `${i + 1}. ${this.E.pag(pid).nombre}`]);
    const ac = z.accion || {};
    const destino = /^(mostrar|ocultar|alternar|animar)$/.test(ac.tipo) ? sel([["", "— elige —"], ...otros], ac.destino, (x) => this._cambiar({ accion: { ...ac, destino: x } }, "Acción de la zona"))
      : ac.tipo === "ir" ? sel(paginas, ac.destino, (x) => this._cambiar({ accion: { ...ac, destino: x } }, "Acción de la zona"))
      : ac.tipo === "enlace" ? (() => { const i = el("input.ed-txt", { type: "url", value: ac.destino || "", placeholder: "https://…" }); i.addEventListener("change", () => this._cambiar({ accion: { ...ac, destino: i.value.trim() } }, "Enlace de la zona")); return i; })()
      : null;
    c.append(...[
      el("div.ed-zp-fila", {}, [nombre, color]),
      el("label.ed-zp-campo", {}, [el("span", { text: "Sale del dedo" }), sel(RT.TOQUES, z.efecto, (x) => { this._cambiar({ efecto: x }, "Efecto de la zona"); this._demo(); })]),
      el("label.ed-zp-campo", {}, [el("span", { text: "El elemento hace" }), sel(RT.MOVS, z.mov, (x) => { this._cambiar({ mov: x }, "Movimiento de la zona"); this._demo(); })]),
      el("div.ed-zp-campo", {}, [el("span", { text: "Sonido" }), el("div.ed-botonera", {}, [
        boton(I("sonido", sonidoN), async () => { const [id] = await elegir(this.app, "audio", { titulo: "Sonido de la zona" }); if (id) this._cambiar({ sonido: id }, "Sonido de la zona"); }, "chico"),
        z.sonido ? boton(ico("cerrar"), () => this._cambiar({ sonido: null }, "Quitar sonido"), "chico ico", "Quitar sonido") : null,
      ].filter(Boolean))]),
      el("label.ed-zp-campo", {}, [el("span", { text: "Además" }), sel(ACCIONES, ac.tipo, (x) => this._cambiar({ accion: x ? { tipo: x, destino: x === "ir" ? paginas[0]?.[0] : "" } : null }, "Acción de la zona"))]),
      destino ? el("label.ed-zp-campo", {}, [el("span", { text: "Cuál" }), destino]) : null,
      el("label.ed-zp-campo.ed-zp-check", {}, [(() => { const k = el("input", { type: "checkbox" }); k.checked = !!z.vibrar; k.addEventListener("change", () => this._cambiar({ vibrar: k.checked }, "Vibrar")); return k; })(), el("span", { text: "Vibrar un poquito (Android)" })]),
      el("div.ed-botonera", {}, [
        boton(I("toque", "Probar esta"), () => this._demo(), "chico"),
        boton(I("duplicar", "Duplicar"), () => this._duplicar(), "chico"),
        boton(I("borrar", "Borrar zona"), () => this._borrar(z.id), "chico peligro"),
      ]),
    ].filter(Boolean));
  }

  _demo() {
    const n = this._nodo();
    const z = this.zonas.find((x) => x.id === this.sel);
    if (!n || !z) return;
    const d = this.capa?.querySelector(`.ed-zona[data-id="${z.id}"]`);
    const r = (d || n).getBoundingClientRect();
    RT.efectoToque(n, z, r.left + r.width / 2, r.top + r.height / 2);
    if (z.sonido) RT.sonar(this.app.bib.url(z.sonido), z.volumen ?? 0.9);
  }
}

const ACCIONES = [["", "Nada más"], ["siguiente", "Pasar a la siguiente página"], ["anterior", "Volver a la anterior"], ["inicio", "Ir a la portada"], ["ir", "Ir a una página…"],
  ["mostrar", "Mostrar un elemento…"], ["ocultar", "Esconder un elemento…"], ["alternar", "Mostrar / esconder un elemento…"], ["animar", "Animar un elemento…"],
  ["enlace", "Abrir un enlace…"], ["musica", "Pausar / poner la música"]];
