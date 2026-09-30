// Écran « Joue sur ordi » (spec 4.6) : style Encre, la cinématique en fond, un bouton « Copier le lien ».
// Aucune initialisation du moteur : ce module ne charge ni Three.js ni la simulation.
import { logoMarkup } from "./dom";
import { introVideoMarkup } from "./media";

export class MobileScreen {
  readonly root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen mobile";
    this.root.innerHTML = `
      ${introVideoMarkup("mobile-video", true)}
      <div class="mobile-stack">
        ${logoMarkup()}
        <div class="ink-panel mobile-panel">
          <h2>Joue sur ordi</h2>
          <p class="mobile-text">AGENTHOT se joue au clavier et à la souris. Ouvre ce lien sur un ordinateur : le temps n'avance que quand tu bouges.</p>
          <button type="button" class="ink-button" data-action="copy">Copier le lien <small>URL</small></button>
          <p class="label mobile-feedback" aria-live="polite"></p>
        </div>
      </div>`;
    parent.appendChild(this.root);
    const video = this.root.querySelector<HTMLVideoElement>("video")!;
    // Cinématique absente (pas encore fabriquée) ou illisible : le navigateur essaie chaque source dans l'ordre ;
    // l'échec de la dernière veut dire qu'aucune ne marche. L'écran reste alors sur le vide, sans erreur.
    video.querySelector("source:last-of-type")!.addEventListener("error", () => video.remove());
    this.root.querySelector("[data-action=copy]")!.addEventListener("click", () => void this.copyLink());
  }

  private async copyLink(): Promise<void> {
    const feedback = this.root.querySelector<HTMLElement>(".mobile-feedback")!;
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      feedback.textContent = "Lien copié";
    } catch {
      // Presse-papiers refusé (contexte non sécurisé, permission) : on montre le lien à copier à la main.
      feedback.textContent = url;
    }
  }
}
