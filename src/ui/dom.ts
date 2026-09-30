// Petits outils partagés par les écrans : courbe de mouvement, logo, échappement de texte.

// Courbe de la spec 6.3, pour les animations lancées en JavaScript (Web Animations API).
export const EASE = "cubic-bezier(0.2, 0.9, 0.2, 1)";

// Logo Monolithe : « AGENT » en `world`, « HOT » en `threat`, une lettre par span (animées une à une).
export function logoMarkup(): string {
  const letters = (word: string) => [...word].map((c) => `<span class="logo-letter">${c}</span>`).join("");
  return `<h1 class="logo mono-title" aria-label="AGENTHOT"><span class="logo-word">${letters("AGENT")}</span><span class="logo-word hot">${letters("HOT")}</span></h1>`;
}

// Texte sûr dans du HTML (titres de salles, messages).
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Une touche qui vaut geste (passer la cinématique ; le chargeur y ajoute Échap, plus bas) : ni une touche de modification
// seule, ni un raccourci du navigateur (Cmd+R, Cmd+Maj+4, Ctrl+…), ni la répétition d'une touche tenue.
export function isPlainKeypress(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "repeat">): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return false;
  return !["Shift", "Control", "Alt", "Meta"].includes(event.key);
}

// Une touche qui vaut geste et débloque le son (invite du chargeur) : une touche simple, sauf Échap. Le navigateur
// n'accorde pas à Échap l'activation utilisateur : le contexte audio et la cinématique sonore seraient refusés.
export function isActivationKeypress(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "repeat">): boolean {
  return event.key !== "Escape" && isPlainKeypress(event);
}
