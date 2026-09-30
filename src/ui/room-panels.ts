// Panneaux Encre de la salle (spec 4.4) : pause (Reprendre, Recommencer, Menu) et fin de victoire (Rejouer,
// Revoir le replay, Menu). La mort garde son texte discret du HUD (« R ‧ RECOMMENCER »).
import { EASE } from "./dom";

export interface RoomPanelAction {
  label: string;
  // Touche du raccourci (KeyboardEvent.code, aucune si absente) et son libellé à droite du bouton.
  code?: string;
  key: string;
  run(): void;
}

export class RoomPanels {
  private readonly root: HTMLElement;
  private current: HTMLElement | null = null;
  private actions: readonly RoomPanelAction[] = [];
  private readonly onKey = (event: KeyboardEvent): void => {
    const action = this.actions.find((a) => a.code !== undefined && a.code === event.code);
    if (!action) return;
    event.preventDefault();
    action.run();
  };

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen room-panels";
    this.root.hidden = true;
    parent.appendChild(this.root);
  }

  // Affiche un panneau centré ; `subtitle` : petit texte sous le titre.
  show(title: string, subtitle: string, actions: readonly RoomPanelAction[]): void {
    this.hide();
    this.actions = actions;
    const panel = document.createElement("div");
    panel.className = "ink-panel room-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title);
    panel.innerHTML = `<h2>${title}</h2><p class="label room-panel-sub">${subtitle}</p>`;
    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ink-button";
      button.innerHTML = `${action.label} <small>${action.key}</small>`;
      button.addEventListener("click", () => action.run());
      panel.appendChild(button);
    }
    this.root.appendChild(panel);
    this.root.hidden = false;
    this.current = panel;
    window.addEventListener("keydown", this.onKey);
    panel.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 200, easing: EASE },
    );
    panel.querySelectorAll<HTMLElement>(".ink-button").forEach((button, i) => {
      button.animate([{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "none" }], {
        duration: 180,
        delay: 60 + i * 45,
        easing: EASE,
        fill: "backwards",
      });
    });
  }

  hide(): void {
    window.removeEventListener("keydown", this.onKey);
    this.actions = [];
    this.current?.remove();
    this.current = null;
    this.root.hidden = true;
  }
}
