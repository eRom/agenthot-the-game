// Cinématique (spec 4.2) : plein écran, passable par n'importe quelle touche ou un clic. Tant que le fichier
// n'existe pas (plan 3b), ou s'il est illisible, elle se termine aussitôt, sans erreur.
import { EASE } from "./dom";
import { introVideoMarkup } from "./media";

export const INTRO = {
  // Le chargeur n'attend pas plus longtemps que la vidéo soit prête à démarrer (AC-10).
  readyTimeoutMs: 1500,
} as const;

export class IntroScreen {
  readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private failed = false;
  // Promesse résolue quand la vidéo peut démarrer, ou quand elle a échoué.
  readonly ready: Promise<void>;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen intro";
    this.root.hidden = true;
    this.root.innerHTML = `${introVideoMarkup("intro-video", false)}<p class="label intro-skip">Une touche pour passer</p>`;
    parent.appendChild(this.root);
    this.video = this.root.querySelector("video")!;
    this.ready = new Promise((resolve) => {
      this.video.addEventListener("canplay", () => resolve(), { once: true });
      // L'échec de la dernière source veut dire qu'aucune ne marche.
      this.video.querySelector("source:last-of-type")!.addEventListener("error", () => {
        this.failed = true;
        resolve();
      });
      setTimeout(resolve, INTRO.readyTimeoutMs);
    });
  }

  // Joue la cinématique jusqu'au bout ou jusqu'au premier geste. `volume` : de 0 à 1 (volume musique).
  play(volume: number): Promise<void> {
    if (this.failed) return Promise.resolve();
    this.root.hidden = false;
    this.video.currentTime = 0;
    this.video.volume = volume;
    return new Promise((resolve) => {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        window.removeEventListener("keydown", finish);
        window.removeEventListener("pointerdown", finish);
        this.video.removeEventListener("ended", finish);
        this.video.pause();
        this.root
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: EASE })
          .finished.then(() => {
            this.root.hidden = true;
            resolve();
          });
      };
      window.addEventListener("keydown", finish);
      window.addEventListener("pointerdown", finish);
      this.video.addEventListener("ended", finish);
      // Lecture refusée (politique du navigateur) ou fichier absent : on passe directement.
      this.video.play().catch(finish);
      this.root.querySelector<HTMLElement>(".intro-skip")!.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        delay: 1500,
        easing: EASE,
        fill: "backwards",
      });
    });
  }
}
