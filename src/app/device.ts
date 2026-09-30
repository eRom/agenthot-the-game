// Détection de l'écran « Joue sur ordi » (spec 2 et 4.6). Calcul pur sur un environnement injecté, testé avec bun.
// Sources du brief plan 3 (section 9) : un iPad avec trackpad répond `any-pointer: fine`, mais Safari iOS et iPadOS
// n'a pas de Pointer Lock, dont la salle dépend : sans lui, le jeu démarrerait sans pouvoir se contrôler.

export interface DeviceEnvironment {
  matchMedia(query: string): { matches: boolean };
  // Prototype des éléments du DOM : on y cherche `requestPointerLock`.
  elementPrototype: object;
}

// Écran tactile seul : pointeur principal grossier et aucun pointeur fin (téléphone, tablette sans trackpad).
export const TOUCH_ONLY_QUERY = "(pointer: coarse) and (not (any-pointer: fine))";

export function playOnDesktopOnly(env: DeviceEnvironment): boolean {
  const touchOnly = env.matchMedia(TOUCH_ONLY_QUERY).matches;
  const hasPointerLock = "requestPointerLock" in env.elementPrototype;
  return touchOnly || !hasPointerLock;
}

export function browserEnvironment(): DeviceEnvironment {
  return { matchMedia: (query) => window.matchMedia(query), elementPrototype: Element.prototype };
}
