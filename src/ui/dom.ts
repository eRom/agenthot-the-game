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
