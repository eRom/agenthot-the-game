// Cinématique (spec 4.2) : plein écran, passable par n'importe quelle touche ou un clic. Tant que le fichier
// n'existe pas (plan 3b), ou s'il est illisible, elle se termine aussitôt, sans erreur.
import { EASE, isPlainKeypress } from "./dom";
import { introVideoMarkup } from "./media";

export const INTRO = {
  // Le chargeur n'attend pas plus longtemps que la vidéo soit prête à démarrer (AC-10).
  readyTimeoutMs: 1500,
  // Lecture bloquée (réseau, décodage) au-delà de ce délai : la cinématique se termine au lieu de rester figée.
  stallTimeoutMs: 6000,
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
  // Résultat : vrai si la lecture a réellement démarré (fichier absent, codec refusé ou lecture refusée : faux),
  // pour ne marquer la cinématique « vue » que si elle l'a été.
  play(volume: number): Promise<boolean> {
    if (this.failed) return Promise.resolve(false);
    this.root.hidden = false;
    this.video.currentTime = 0;
    this.video.volume = volume;
    return new Promise((resolve) => {
      let done = false;
      let started = false;
      let stallTimer: number | undefined;
      // Un raccourci du navigateur (Cmd+R, Cmd+Tab) ou une touche tenue ne passent pas la cinématique.
      const onKey = (event: KeyboardEvent): void => {
        if (isPlainKeypress(event)) finish();
      };
      // Lecture qui se bloque : on attend un peu, puis on renonce. Elle reprend d'elle-même : on annule l'attente.
      const onWaiting = (): void => {
        stallTimer ??= window.setTimeout(finish, INTRO.stallTimeoutMs);
      };
      const onPlaying = (): void => {
        window.clearTimeout(stallTimer);
        stallTimer = undefined;
      };
      const finish = (): void => {
        if (done) return;
        done = true;
        window.clearTimeout(stallTimer);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("pointerdown", finish);
        this.video.removeEventListener("ended", finish);
        this.video.removeEventListener("error", finish);
        this.video.removeEventListener("waiting", onWaiting);
        this.video.removeEventListener("playing", onPlaying);
        this.video.pause();
        this.root
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: EASE })
          .finished.then(() => {
            this.root.hidden = true;
            resolve(started);
          });
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("pointerdown", finish);
      this.video.addEventListener("ended", finish);
      // Échec en pleine lecture : la cinématique se termine au lieu de rester figée.
      this.video.addEventListener("error", finish);
      this.video.addEventListener("waiting", onWaiting);
      this.video.addEventListener("playing", onPlaying);
      // Lecture refusée (politique du navigateur) ou fichier absent : on passe directement.
      this.video.play().then(
        () => {
          started = true;
        },
        () => finish(),
      );
      this.root.querySelector<HTMLElement>(".intro-skip")!.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        delay: 1500,
        easing: EASE,
        fill: "backwards",
      });
    });
  }
}
