import { describe, expect, test } from "bun:test";
import { CREDITS, creditsLine, usageLine } from "../src/ui/credits";

// Séparateur des crédits : U+2027 (point de césure), à ne pas confondre avec le point médian U+00B7.
const DOT = String.fromCodePoint(0x2027);
// Intl sépare les milliers par une espace fine insécable (U+202F) en français.
const THIN_SPACE = new RegExp(String.fromCodePoint(0x202f), "g");

describe("crédits (spec 4.3, AC-15)", () => {
  test("la ligne des crédits est exactement celle de la spec", () => {
    expect(creditsLine(CREDITS)).toBe(
      `AGENTHOT ${DOT} Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: ${CREDITS.repoUrl}`,
    );
    expect(CREDITS.repoUrl.startsWith("https://github.com/eRom/")).toBe(true);
  });

  test("le lien des sources mène au dépôt du jeu, plus à un nom provisoire (AC-15)", () => {
    expect(creditsLine(CREDITS)).toBe(
      `AGENTHOT ${DOT} Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: https://github.com/eRom/agenthot-the-game`,
    );
  });

  test("les compteurs sont de vraies mesures : un nombre entier de tokens, un coût positif", () => {
    expect(Number.isInteger(CREDITS.tokens) && CREDITS.tokens > 0).toBe(true);
    expect(CREDITS.apiCostUsd).toBeGreaterThan(0);
    // Centimes : la ligne affichée n'arrondit rien.
    expect(Math.round(CREDITS.apiCostUsd * 100) / 100).toBe(CREDITS.apiCostUsd);
  });

  test("tokens et coût se lisent à la française, avec la mention « estimé »", () => {
    const line = usageLine({ repoUrl: "", tokens: 118795538, apiCostUsd: 50.31 });
    expect(line.replace(THIN_SPACE, " ")).toBe(`118 795 538 tokens ${DOT} coût API estimé : 50,31 $`);
  });
});
