// Panneaux Encre de la salle (spec 4.4) : pause (Reprendre, Recommencer, Menu) et fin de victoire (Rejouer,
// Revoir le replay, Menu). La mort garde son texte discret du HUD (« R ‧ RECOMMENCER »).
import { EASE } from "./dom";

export interface RoomPanelAction {
  label: string;
  // Raccourci : la touche tapée (KeyboardEvent.key en minuscule, " " pour Espace), aucune si absente. La lettre
  // tapée et non la position de la touche : sur un clavier AZERTY, la touche M n'est pas à la place de KeyM.
  shortcut?: string;
  // Libellé du raccourci, à droite du bouton.
  key: string;
  run(): void;
}

// Action dont le raccourci est la touche tapée. Un raccourci du navigateur (Cmd, Ctrl, Alt) n'en déclenche aucune.
export function findShortcut(
  actions: readonly RoomPanelAction[],
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">,
): RoomPanelAction | undefined {
  if (event.metaKey || event.ctrlKey || event.altKey) return undefined;
  const typed = event.key.toLowerCase();
  return actions.find((a) => a.shortcut !== undefined && a.shortcut === typed);
}

export class RoomPanels {
  private readonly root: HTMLElement;
  private current: HTMLElement | null = null;
  private actions: readonly RoomPanelAction[] = [];
  private readonly onKey = (event: KeyboardEvent): void => {
    const action = findShortcut(this.actions, event);
    if (!action) return;
    event.preventDefault();
    // Touche tenue : une seule exécution. Sinon un R tenu relance la salle en boucle (musique, panneau qui clignote).
    if (event.repeat) return;
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
