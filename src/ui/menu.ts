// Menu (spec 4.3) : logo et entrées en style Monolithe, sur la salle figée à 3 %. Clavier (flèches + Entrée,
// Échap pour fermer un panneau) et souris. Sons de survol, de validation et de retour.
import { EASE, logoMarkup } from "./dom";

export type MenuAction = "play" | "rooms" | "settings" | "credits" | "intro";

export interface MenuEntry {
  action: MenuAction;
  label: string;
  // Petit texte à droite de l'entrée (compteur de salles).
  hint?: string;
}

export interface MenuCallbacks {
  onAction(action: MenuAction): void;
  // Son d'interface : survol, validation, retour.
  onSound(sound: "hover" | "select" | "back"): void;
}

// Éclats orange qui flottent au ralenti autour du logo (spec 6.3) : position (% du bloc du logo), taille (px),
// forme, durée et retard de la dérive (s). Fixes : le menu est le même à chaque visite.
const SHARDS = [
  { x: 96, y: 8, size: 16, shape: "50% 0, 100% 100%, 0 70%", duration: 17, delay: -3 },
  { x: 104, y: 30, size: 9, shape: "0 0, 100% 40%, 30% 100%", duration: 13, delay: -8 },
  { x: -8, y: 62, size: 12, shape: "40% 0, 100% 80%, 0 100%", duration: 19, delay: -1 },
  { x: 88, y: 92, size: 22, shape: "50% 0, 100% 80%, 0 100%", duration: 23, delay: -12 },
  { x: 58, y: -10, size: 7, shape: "0 20%, 100% 0, 60% 100%", duration: 11, delay: -5 },
  { x: 18, y: 104, size: 10, shape: "30% 0, 100% 60%, 0 100%", duration: 15, delay: -9 },
] as const;

export class MenuScreen {
  readonly root: HTMLElement;
  private readonly entries: HTMLButtonElement[];
  private focusIndex = 0;
  private readonly callbacks: MenuCallbacks;
  // Vrai quand un panneau est ouvert : les flèches et Entrée appartiennent alors au panneau.
  private panelOpen = false;
  private readonly onKey = (event: KeyboardEvent): void => this.handleKey(event);

  constructor(parent: HTMLElement, entries: readonly MenuEntry[], callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement("section");
    this.root.className = "screen menu";
    this.root.hidden = true;
    const shards = SHARDS.map(
      (s) =>
        `<i style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;clip-path:polygon(${s.shape});` +
        `animation-duration:${s.duration}s;animation-delay:${s.delay}s"></i>`,
    ).join("");
    const buttons = entries
      .map(
        (e) =>
          `<button type="button" class="menu-entry" data-action="${e.action}">` +
          `<span>${e.label}</span>${e.hint ? `<small>${e.hint}</small>` : ""}</button>`,
      )
      .join("");
    this.root.innerHTML = `
      <div class="menu-veil" aria-hidden="true"></div>
      <div class="menu-brand">
        <p class="label menu-tag">Le temps n'avance que quand tu bouges</p>
        <div class="menu-logo">${logoMarkup()}<div class="menu-shards" aria-hidden="true">${shards}</div></div>
        <p class="label menu-tag">Made with Claude Opus 5.5</p>
      </div>
      <nav class="menu-entries" aria-label="Menu">${buttons}</nav>
      <div class="menu-panel-slot"></div>
      <p class="label menu-hint" aria-hidden="true">↑ ↓ Choisir &nbsp; Entrée Valider &nbsp; Échap Retour</p>`;
    parent.appendChild(this.root);
    this.entries = [...this.root.querySelectorAll<HTMLButtonElement>(".menu-entry")];
    this.entries.forEach((button, i) => {
      button.addEventListener("pointerenter", () => {
        if (this.panelOpen || i === this.focusIndex) return;
        this.focus(i);
        this.callbacks.onSound("hover");
      });
      // Tab (ou tout focus natif) déplace aussi l'entrée active : clavier, souris et Tab restent d'accord.
      button.addEventListener("focus", () => this.markFocused(i));
      button.addEventListener("click", () => this.activate(i));
    });
  }

  // Emplacement des panneaux Encre (Salles, Paramètres, Crédits).
  get panelSlot(): HTMLElement {
    return this.root.querySelector<HTMLElement>(".menu-panel-slot")!;
  }

  // `focused` : l'entrée qui prend le focus (la première par défaut).
  show(focused?: MenuAction): void {
    this.root.hidden = false;
    window.addEventListener("keydown", this.onKey);
    this.focus(Math.max(0, this.entries.findIndex((entry) => entry.dataset.action === focused)));
    // Entrée orchestrée : les lettres du logo tombent en cascade, puis les entrées glissent une à une.
    this.root.querySelectorAll<HTMLElement>(".menu-brand .logo-letter").forEach((letter, i) => {
      letter.animate(
        [
          { transform: "translateY(-0.35em)", opacity: 0, filter: "blur(6px)" },
          { transform: "none", opacity: 1, filter: "blur(0)" },
        ],
        { duration: 260, delay: 80 + i * 40, easing: EASE, fill: "backwards" },
      );
    });
    this.root.querySelectorAll<HTMLElement>(".menu-tag").forEach((tag, i) => {
      tag.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 420 + i * 120, easing: EASE, fill: "backwards" });
    });
    this.entries.forEach((entry, i) => {
      entry.animate(
        [
          { transform: "translateX(-28px)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 240, delay: 380 + i * 60, easing: EASE, fill: "backwards" },
      );
    });
  }

  hide(): void {
    this.root.hidden = true;
    window.removeEventListener("keydown", this.onKey);
  }

  // Un panneau s'ouvre ou se ferme : les entrées s'estompent, le clavier passe au panneau.
  setPanelOpen(open: boolean): void {
    this.panelOpen = open;
    this.root.classList.toggle("has-panel", open);
    // Derrière un panneau, les entrées sortent de l'ordre de Tab (et ne reprennent pas le focus tant qu'il est ouvert).
    this.root.querySelector<HTMLElement>(".menu-entries")!.inert = open;
    if (!open) this.entries[this.focusIndex]!.focus({ preventScroll: true });
  }

  private focus(index: number): void {
    this.markFocused(index);
    this.entries[this.focusIndex]!.focus({ preventScroll: true });
  }

  // Entrée active (losange orange) sans déplacer le focus natif : appelé aussi quand le focus vient d'ailleurs (Tab).
  private markFocused(index: number): void {
    this.focusIndex = (index + this.entries.length) % this.entries.length;
    this.entries.forEach((entry, i) => entry.classList.toggle("is-focused", i === this.focusIndex));
  }

  private activate(index: number): void {
    if (this.panelOpen) return;
    this.focus(index);
    this.callbacks.onSound("select");
    this.callbacks.onAction(this.entries[index]!.dataset.action as MenuAction);
  }

  private handleKey(event: KeyboardEvent): void {
    // Entrée tenue : les répétitions ne valident rien. Sans ce garde, celles qui arrivent après l'ouverture d'un
    // panneau cliqueraient nativement la carte ou « Retour » qui vient de prendre le focus.
    if (event.repeat && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      return;
    }
    if (this.panelOpen) return;
    if (event.code === "ArrowDown" || event.code === "ArrowUp") {
      event.preventDefault();
      this.focus(this.focusIndex + (event.code === "ArrowDown" ? 1 : -1));
      this.callbacks.onSound("hover");
    } else if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      this.activate(this.focusIndex);
    }
  }
}
