/**
 * CONTEXT — la maleta de servicios que recibe cada página.
 *
 * En vez de importar singletons por todas partes (que convierte cualquier
 * módulo en algo imposible de probar y de reutilizar), todo se construye una
 * vez aquí y se pasa hacia abajo. Una página sólo conoce `ctx`.
 *
 * @typedef {object} Context
 * @property {import("./Capabilities.js").Capabilities} caps
 * @property {import("./Viewport.js").Viewport} viewport
 * @property {import("./Loop.js").Loop} loop
 * @property {import("./Store.js").Store} store
 * @property {import("./Pointer.js").Pointer} pointer
 * @property {import("./AudioBus.js").AudioBus} audio
 * @property {import("./Haptics.js").Haptics} haptics
 * @property {import("./AssetLoader.js").AssetLoader} assets
 * @property {import("../gl/GLStage.js").GLStage} gl
 * @property {import("./Router.js").Router} router
 * @property {import("../ui/UI.js").UI} ui
 */

import { Capabilities } from "./Capabilities.js";
import { Viewport } from "./Viewport.js";
import { Loop } from "./Loop.js";
import { Store } from "./Store.js";
import { Pointer } from "./Pointer.js";
import { AudioBus } from "./AudioBus.js";
import { Haptics } from "./Haptics.js";
import { AssetLoader } from "./AssetLoader.js";

/**
 * Crea los servicios que no dependen del DOM ni de WebGL.
 * El GLStage, el Router y la UI se enganchan después, cuando existe el canvas.
 * @returns {Context}
 */
export function createContext() {
  const caps = new Capabilities();
  const viewport = new Viewport();
  const loop = new Loop(caps);
  const store = new Store();
  const pointer = new Pointer(viewport, caps);
  const audio = new AudioBus(store);
  const haptics = new Haptics(caps);
  const assets = new AssetLoader(caps);

  // El puntero se actualiza el primero de todos, antes que cualquier efecto
  // que lo consuma: así ningún frame lee una posición de hace un frame.
  loop.add((dt) => pointer.update(dt), 0);

  return {
    caps,
    viewport,
    loop,
    store,
    pointer,
    audio,
    haptics,
    assets,
    gl: null,
    router: null,
    ui: null,
  };
}
