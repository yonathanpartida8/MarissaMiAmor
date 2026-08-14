/**
 * UI — la interfaz mínima que rodea al libro.
 *
 * Principio: cuanto menos, mejor. Nada de barras cargadas de botones; el libro
 * se navega con el dedo. Sólo queda un hilo de progreso arriba, una barra
 * discreta abajo que se esconde sola, y una pista que aparece cuando alguien
 * lleva unos segundos sin saber qué hacer.
 */

import { el, qs } from "../utils/dom.js";
import { manifest, allSecrets } from "../data/manifest.js";

const HINT_DELAY = 4600;
const BAR_HIDE_DELAY = 3400;

export class UI {
  constructor(ctx, root) {
    this.ctx = ctx;
    this.root = root;
    this.hintTimer = 0;
    this.barTimer = 0;
    this.busy = false;
  }

  mount() {
    this.root.append(
      this.#buildProgress(),
      this.#buildBar(),
      this.#buildHint(),
      this.#buildToast()
    );

    // Cualquier gesto revive la barra y reinicia el reloj de la pista.
    const wake = () => {
      this.showBar();
      this.scheduleHint();
    };
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Construcción
  // ═══════════════════════════════════════════════════════════════════

  #buildProgress() {
    this.progress = el("div.progress", { "aria-hidden": "true" }, [
      el("div.progress__fill"),
    ]);
    this.progressFill = qs(".progress__fill", this.progress);

    // Una marca por página: se puede ver de un vistazo cuánto queda.
    this.ticks = el("div.progress__ticks");
    for (let i = 0; i < manifest.length; i++) {
      const tick = el("i.progress__tick", { dataset: { index: String(i) } });
      tick.style.setProperty("--p", String(i / (manifest.length - 1)));
      this.ticks.append(tick);
    }
    this.progress.append(this.ticks);
    return this.progress;
  }

  #buildBar() {
    this.bar = el("nav.bar", { "aria-label": "Navegación del libro" }, [
      el("button.bar__btn.bar__btn--prev", {
        type: "button",
        "aria-label": "Página anterior",
        html: "<span>‹</span>",
        onClick: () => this.ctx.router.prev(),
      }),
      el("div.bar__center", {}, [
        el("div.bar__title", { text: "" }),
        el("div.bar__count", { text: "" }),
      ]),
      el("button.bar__btn.bar__btn--next", {
        type: "button",
        "aria-label": "Página siguiente",
        html: "<span>›</span>",
        onClick: () => this.ctx.router.next(),
      }),
    ]);

    this.bar.append(
      el("div.bar__tools", {}, [
        el("button.bar__icon", {
          type: "button",
          "aria-label": "Música",
          dataset: { role: "music" },
          html: "♪",
          onClick: (e) => this.#toggleMusic(e.currentTarget),
        }),
        el("button.bar__icon", {
          type: "button",
          "aria-label": "Volver a la portada",
          html: "⌂",
          onClick: () => this.ctx.router.go(0, { transition: "zoom", direction: "prev" }),
        }),
        el("div.bar__secrets", { dataset: { role: "secrets" }, text: "" }),
      ])
    );

    this.barTitle = qs(".bar__title", this.bar);
    this.barCount = qs(".bar__count", this.bar);
    this.musicBtn = qs('[data-role="music"]', this.bar);
    this.secretsEl = qs('[data-role="secrets"]', this.bar);

    if (this.ctx.store.get("musicOn") !== false) this.musicBtn.classList.add("is-on");
    return this.bar;
  }

  #buildHint() {
    this.hint = el("div.hint", { "aria-live": "polite" }, [el("span.hint__text")]);
    this.hintText = qs(".hint__text", this.hint);
    return this.hint;
  }

  #buildToast() {
    this.toastEl = el("div.toast", { role: "status", "aria-live": "polite" });
    return this.toastEl;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Estado
  // ═══════════════════════════════════════════════════════════════════

  setPage(index, entry, page) {
    const total = manifest.length;
    const ratio = total > 1 ? index / (total - 1) : 1;

    this.progressFill.style.transform = `scaleX(${ratio})`;
    this.progress.style.setProperty("--accent", page.palette.a);

    for (const tick of this.ticks.children) {
      tick.classList.toggle("is-past", Number(tick.dataset.index) <= index);
      tick.classList.toggle("is-current", Number(tick.dataset.index) === index);
    }

    this.barTitle.textContent = page.chapter?.title || (index === 0 ? "Portada" : "");
    this.barCount.textContent = `${String(index + 1).padStart(2, "0")} · ${total}`;

    qs(".bar__btn--prev", this.bar).disabled = this.ctx.router.atStart;
    qs(".bar__btn--next", this.bar).disabled = this.ctx.router.atEnd;

    // La portada y el final se ven mejor sin cromo alrededor.
    const bare = entry.type === "cover" || entry.type === "finale";
    this.root.classList.toggle("is-bare", bare);

    this.currentHint = entry.hint || "";
    this.showBar();
    this.scheduleHint();
    this.updateSecrets();
  }

  setBusy(busy) {
    this.busy = busy;
    this.root.classList.toggle("is-busy", busy);
    if (busy) this.hideHint();
  }

  updateSecrets() {
    const found = this.ctx.store.secretsFound;
    const total = allSecrets.length;
    if (!this.secretsEl) return;
    this.secretsEl.textContent = found ? `✦ ${found}/${total}` : "";
    this.secretsEl.classList.toggle("is-complete", found >= total);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Pistas y avisos
  // ═══════════════════════════════════════════════════════════════════

  /**
   * La pista no aparece de inmediato a propósito: primero se le deja el
   * gusto de descubrirlo sola. Sólo si pasan unos segundos sin tocar nada,
   * el libro susurra qué hacer.
   */
  scheduleHint() {
    clearTimeout(this.hintTimer);
    this.hideHint();
    if (!this.currentHint || this.busy) return;
    this.hintTimer = setTimeout(() => this.showHint(this.currentHint), HINT_DELAY);
  }

  /** Una vez resuelta la página, su pista ya no vuelve a aparecer. */
  clearHint() {
    clearTimeout(this.hintTimer);
    this.currentHint = "";
    this.hideHint();
  }

  showHint(text) {
    if (!text) return;
    this.hintText.textContent = text;
    this.hint.classList.add("is-visible");
  }

  hideHint() {
    this.hint?.classList.remove("is-visible");
  }

  showBar() {
    clearTimeout(this.barTimer);
    this.bar.classList.add("is-visible");
    this.barTimer = setTimeout(() => this.bar.classList.remove("is-visible"), BAR_HIDE_DELAY);
  }

  toast(message, ms = 2800) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add("is-visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove("is-visible"), ms);
  }

  /** Un secreto encontrado merece su pequeña celebración. */
  celebrateSecret(id) {
    this.clearHint();
    this.ctx.gl?.pulse(1);
    this.ctx.gl?.flash(0.35);
    this.updateSecrets();

    const found = this.ctx.store.secretsFound;
    const total = allSecrets.length;
    this.toast(found >= total ? "Los encontraste todos ✦ Te amo" : `Secreto encontrado ✦ ${found}/${total}`);

    this.secretsEl?.classList.remove("is-pop");
    void this.secretsEl?.offsetWidth;
    this.secretsEl?.classList.add("is-pop");
  }

  #toggleMusic(button) {
    const on = this.ctx.audio.toggleMusic();
    button.classList.toggle("is-on", on);
    button.innerHTML = on ? "♬" : "♪";
    this.ctx.haptics.play("tap");
  }
}
