import { describe, expect, test } from "bun:test";
import { type DeviceEnvironment, playOnDesktopOnly } from "../src/app/device";

// Faux navigateur : ce que répondent ses requêtes média, et s'il a le Pointer Lock.
function device(media: { coarse: boolean; anyFine: boolean }, pointerLock: boolean): DeviceEnvironment {
  return {
    matchMedia(query: string) {
      // Seule requête attendue : pointeur principal grossier ET aucun pointeur fin.
      expect(query).toBe("(pointer: coarse) and (not (any-pointer: fine))");
      return { matches: media.coarse && !media.anyFine };
    },
    elementPrototype: pointerLock ? { requestPointerLock() {} } : {},
  };
}

describe("écran « Joue sur ordi » (spec 4.6, AC-12)", () => {
  test("téléphone ou tablette tactile : écran « Joue sur ordi »", () => {
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: false }, false))).toBe(true);
    // Même si le navigateur annonçait le Pointer Lock (Android), le tactile seul ne peut pas jouer.
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: false }, true))).toBe(true);
  });

  test("iPad avec trackpad : pointeur fin présent, mais pas de Pointer Lock dans Safari : écran « Joue sur ordi »", () => {
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: true }, false))).toBe(true);
  });

  test("ordinateur, y compris un portable tactile avec trackpad : le jeu se lance", () => {
    expect(playOnDesktopOnly(device({ coarse: false, anyFine: true }, true))).toBe(false);
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: true }, true))).toBe(false);
  });
});
