// Écran de chargement (spec 4.1) : le logo se construit en facettes orange, puis « APPUIE SUR UNE TOUCHE ».
// Au moins 1,2 s, même si tout est prêt, pour poser l'univers. Le geste attendu débloque le son.
import { Rng } from "../sim/rng";
import { EASE, logoMarkup } from "./dom";

export const LOADER = {
  minDurationMs: 1200,
  facets: 18,
  // Graine des facettes : le même logo à chaque visite.
  seed: 0xa9e47,
} as const;

export class LoaderScreen {
  readonly root: HTMLElement;
  private readonly shownAt = performance.now();

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen loader";
    this.root.innerHTML = `
      <div class="loader-stage">
        <div class="loader-logo">${logoMarkup()}<div class="loader-facets" aria-hidden="true"></div></div>
        <div class="loader-bar" aria-hidden="true"><i></i></div>
        <p class="label loader-status">Chargement</p>
        <p class="loader-prompt" hidden>Appuie sur une touche</p>
      </div>`;
    parent.appendChild(this.root);
  }

  // Joue l'arrivée du logo : les facettes convergent vers les lettres, les lettres se révèlent, les facettes
  // se dissipent. Motion design léger : une seule séquence, puis plus rien ne bouge que l'invite.
  async play(): Promise<void> {
    // Le logo attend sa police (préchargée dans index.html), au plus 0,8 s.
    await Promise.race([
      document.fonts.load('900 1em "Big Shoulders Display"'),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
    const logo = this.root.querySelector<HTMLElement>(".loader-logo")!;
    const facets = this.root.querySelector<HTMLElement>(".loader-facets")!;
    const rng = new Rng(LOADER.seed);
    for (let i = 0; i < LOADER.facets; i++) {
      const facet = document.createElement("i");
      // Triangle irrégulier, posé quelque part sur la surface du logo.
      const a = `${rng.range(0, 45)}% 0`;
      const b = `100% ${rng.range(30, 100)}%`;
      const c = `${rng.range(0, 60)}% 100%`;
      facet.style.clipPath = `polygon(${a}, ${b}, ${c})`;
      facet.style.left = `${rng.range(0, 92)}%`;
      facet.style.top = `${rng.range(0, 85)}%`;
      const size = rng.range(0.18, 0.42);
      facet.style.width = `${size}em`;
      facet.style.height = `${size * rng.range(0.8, 1.4)}em`;
      if (rng.next() < 0.25) facet.classList.add("hot");
      facets.appendChild(facet);
      const dx = rng.range(-3.5, 3.5);
      const dy = rng.range(-2, 2);
      const turn = rng.range(-240, 240);
      facet.animate(
        [
          { transform: `translate(${dx}em, ${dy}em) rotate(${turn}deg) scale(0.3)`, opacity: 0 },
          { transform: "none", opacity: 1, offset: 0.62 },
          { transform: `translate(${dx * 0.08}em, ${dy * 0.08}em) rotate(${turn * 0.05}deg) scale(0.6)`, opacity: 0 },
        ],
        { duration: 1100, delay: i * 22, easing: EASE, fill: "both" },
      );
    }
    const letters = logo.querySelectorAll<HTMLElement>(".logo-letter");
    letters.forEach((letter, i) => {
      letter.animate(
        [
          { clipPath: "inset(100% 0 0 0)", transform: "translateY(0.12em)" },
          { clipPath: "inset(0 0 0 0)", transform: "none" },
        ],
        // « backwards » : lettre cachée pendant son attente, puis plus aucun clip-path une fois révélée (il
        // couperait la lueur de « HOT » en rectangle).
        { duration: 320, delay: 420 + i * 45, easing: EASE, fill: "backwards" },
      );
    });
  }

  // Avancement du chargement, de 0 à 1 (filet sous le logo).
  setProgress(fraction: number): void {
    const bar = this.root.querySelector<HTMLElement>(".loader-bar i")!;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, fraction))})`;
  }

  // Attend `tasks` et la durée minimale, puis affiche l'invite. Une tâche qui échoue n'empêche pas d'entrer.
  async waitReady(tasks: Promise<unknown>[]): Promise<void> {
    let done = 0;
    const tracked = tasks.map((task) =>
      task.catch(() => undefined).finally(() => this.setProgress(++done / tasks.length)),
    );
    const remaining = LOADER.minDurationMs - (performance.now() - this.shownAt);
    await Promise.all([...tracked, new Promise((resolve) => setTimeout(resolve, Math.max(0, remaining)))]);
    this.root.querySelector<HTMLElement>(".loader-status")!.hidden = true;
    this.root.querySelector<HTMLElement>(".loader-bar")!.hidden = true;
    this.root.querySelector<HTMLElement>(".loader-prompt")!.hidden = false;
    // Repère AC-10 : l'invite est affichée (lu par performance.getEntriesByName("agenthot:prompt")).
    performance.mark("agenthot:prompt");
  }

  // Premier geste (touche ou clic). `onGesture` s'exécute dans le gestionnaire même : c'est là que le
  // navigateur autorise le son.
  waitForGesture(onGesture: () => void): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: Event): void => {
        // Les touches de modification seules (Maj, Cmd pour une capture) ne comptent pas.
        if (event instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
        window.removeEventListener("keydown", handler);
        window.removeEventListener("pointerdown", handler);
        onGesture();
        resolve();
      };
      window.addEventListener("keydown", handler);
      window.addEventListener("pointerdown", handler);
    });
  }

  // Échec du moteur : l'invite laisse place au message, le logo reste.
  fail(message: string): void {
    const prompt = this.root.querySelector<HTMLElement>(".loader-prompt")!;
    prompt.textContent = message;
    prompt.classList.add("is-error");
    prompt.hidden = false;
  }

  async hide(): Promise<void> {
    await this.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: EASE, fill: "forwards" }).finished;
    this.root.remove();
  }
}
