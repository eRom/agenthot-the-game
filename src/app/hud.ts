// Surcouche du jeu : réticule, messages, chant du replay, panneau debug (styles : style.css et ui/tokens.css).

export type HudMessage = "start" | "paused" | "dead" | "replay" | "won" | "none";

const MESSAGES: Record<Exclude<HudMessage, "none" | "replay">, string> = {
  start: "CLIQUE POUR JOUER",
  paused: "PAUSE ‧ CLIQUE POUR REPRENDRE",
  // Spec 4.4 : texte discret ; un clic relance aussi.
  dead: "R ‧ RECOMMENCER",
  won: "R ‧ REJOUER  ·  ESPACE ‧ REVOIR",
};

export class Hud {
  private readonly crosshair: HTMLElement;
  private readonly message: HTMLElement;
  private readonly debug: HTMLElement;
  private readonly deathTint: HTMLElement;
  private crosshairTurns = 0;
  private wasCoolingDown = false;
  // Mot du chant actuellement affiché : on n'écrit dans le DOM que s'il change.
  private chantWord = "";
  private current: HudMessage = "none";

  constructor(root: HTMLElement, debugEnabled: boolean) {
    this.crosshair = el(root, "crosshair");
    this.message = el(root, "message");
    this.deathTint = el(root, "death-tint");
    this.debug = el(root, "debug");
    this.debug.hidden = !debugEnabled;
  }

  show(message: HudMessage): void {
    if (message === this.current && message !== "replay") return;
    this.current = message;
    // Le texte est réécrit ci-dessous : le prochain chant doit repartir de zéro.
    this.chantWord = "";
    this.deathTint.classList.toggle("on", message === "dead");
    this.crosshair.hidden = message !== "none";
    if (message === "none" || message === "replay") {
      this.message.textContent = "";
      this.message.classList.remove("chant", "hot");
      return;
    }
    this.message.textContent = MESSAGES[message];
    this.message.classList.remove("chant", "hot");
  }

  // « AGENT » puis « HOT », en alternance toutes les 0,5 s de replay.
  chant(playhead: number): void {
    const word = Math.floor(playhead / 0.5) % 2 === 0 ? "AGENT" : "HOT";
    if (word === this.chantWord) return;
    this.chantWord = word;
    this.message.textContent = word;
    this.message.classList.add("chant");
    this.message.classList.toggle("hot", word === "HOT");
    // Relance l'animation d'arrivée du mot (même classe, nouveau mot).
    this.message.style.animation = "none";
    void this.message.offsetWidth;
    this.message.style.animation = "";
  }

  // Le réticule fait un demi-tour quand une balle est chambrée (fin du temps de recharge).
  // Chargeur vide ou mains vides : rien n'est chambré, le réticule ne tourne pas.
  updateCrosshair(cooldown: number, ammo: number): void {
    const cooling = cooldown > 0;
    if (this.wasCoolingDown && !cooling && ammo > 0) {
      this.crosshairTurns++;
      this.crosshair.style.transform = `translate(-50%, -50%) rotate(${this.crosshairTurns * 180}deg)`;
    }
    this.wasCoolingDown = cooling;
  }

  // Nouvelle partie : le prochain temps de recharge terminé ne doit pas compter, on garde l'angle actuel.
  resetCrosshair(): void {
    this.wasCoolingDown = false;
  }

  setDebug(text: string): void {
    if (!this.debug.hidden) this.debug.textContent = text;
  }
}

function el(root: HTMLElement, id: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(`#${id}`);
  if (!found) throw new Error(`HUD element #${id} missing`);
  return found;
}
