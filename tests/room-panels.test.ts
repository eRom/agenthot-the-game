import { describe, expect, test } from "bun:test";
import { type RoomPanelAction, findShortcut } from "../src/ui/room-panels";

// Panneau de victoire, tel que main.ts le construit : Rejouer (R), Revoir le replay (Espace), Menu (M).
const noop = (): void => undefined;
const REPLAY: RoomPanelAction = { label: "Rejouer", shortcut: "r", key: "R", run: noop };
const REWATCH: RoomPanelAction = { label: "Revoir le replay", shortcut: " ", key: "Espace", run: noop };
const MENU: RoomPanelAction = { label: "Menu", shortcut: "m", key: "M", run: noop };
const ACTIONS = [REPLAY, REWATCH, MENU];

// Appui clavier : `key` est la lettre tapée, `code` la position physique de la touche.
function press(key: string, code: string, modifiers: Partial<Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey">> = {}) {
  return { key, code, metaKey: false, ctrlKey: false, altKey: false, ...modifiers };
}

describe("raccourcis des panneaux de la salle (spec 4.4)", () => {
  test("sur un clavier AZERTY, la touche M (position Semicolon) mène au menu, et la touche « , » (position KeyM) non", () => {
    expect(findShortcut(ACTIONS, press("m", "Semicolon"), false)).toBe(MENU);
    expect(findShortcut(ACTIONS, press(",", "KeyM"), false)).toBeUndefined();
  });

  test("sur un clavier QWERTY, M et R marchent aussi, majuscule (Maj ou verrouillage) comprise", () => {
    expect(findShortcut(ACTIONS, press("m", "KeyM"), false)).toBe(MENU);
    expect(findShortcut(ACTIONS, press("M", "KeyM"), false)).toBe(MENU);
    expect(findShortcut(ACTIONS, press("r", "KeyR"), false)).toBe(REPLAY);
  });

  test("Espace revoit le replay", () => {
    expect(findShortcut(ACTIONS, press(" ", "Space"), false)).toBe(REWATCH);
  });

  test("un bouton du panneau qui a le focus clavier (Tab) garde Espace et Entrée : son propre clic gagne", () => {
    // Tab jusqu'à « Menu », puis Espace : c'est Menu qui doit partir, pas « Revoir le replay ».
    expect(findShortcut(ACTIONS, press(" ", "Space"), true)).toBeUndefined();
    expect(findShortcut(ACTIONS, press("Enter", "Enter"), true)).toBeUndefined();
    // Les lettres restent des raccourcis, même avec un bouton focalisé : elles n'activent pas un bouton.
    expect(findShortcut(ACTIONS, press("m", "Semicolon"), true)).toBe(MENU);
    expect(findShortcut(ACTIONS, press("r", "KeyR"), true)).toBe(REPLAY);
  });

  test("un raccourci du navigateur (Cmd+R, Ctrl+M, Alt+R) ne déclenche aucune action du panneau", () => {
    expect(findShortcut(ACTIONS, press("r", "KeyR", { metaKey: true }), false)).toBeUndefined();
    expect(findShortcut(ACTIONS, press("m", "Semicolon", { ctrlKey: true }), false)).toBeUndefined();
    expect(findShortcut(ACTIONS, press("r", "KeyR", { altKey: true }), false)).toBeUndefined();
  });

  test("une action sans raccourci (Reprendre : un clic) ne répond à aucune touche", () => {
    const resume: RoomPanelAction = { label: "Reprendre", key: "Clic", run: noop };
    expect(findShortcut([resume], press("Enter", "Enter"), false)).toBeUndefined();
    expect(findShortcut([resume], press(" ", "Space"), false)).toBeUndefined();
  });
});
