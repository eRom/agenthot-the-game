import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CREDITS, cacheLine, creditsLine, usageLine } from "../src/ui/credits";

// Séparateur des crédits : U+2027 (point de césure), à ne pas confondre avec le point médian U+00B7.
const DOT = String.fromCodePoint(0x2027);
// Intl sépare les milliers par une espace fine insécable (U+202F) en français.
const THIN_SPACE = new RegExp(String.fromCodePoint(0x202f), "g");

describe("crédits (spec 4.3, AC-15)", () => {
  test("la ligne des crédits est exactement celle de la spec (sans le nom du jeu, retiré par Romain le 2026-09-30)", () => {
    expect(creditsLine(CREDITS)).toBe(
      `Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: ${CREDITS.repoUrl}`,
    );
    expect(CREDITS.repoUrl.startsWith("https://github.com/eRom/")).toBe(true);
  });

  test("le lien des sources mène au dépôt du jeu, plus à un nom provisoire (AC-15)", () => {
    expect(creditsLine(CREDITS)).toBe(
      `Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: https://github.com/eRom/agenthot-the-game`,
    );
  });

  test("les compteurs sont de vraies mesures : un nombre entier de tokens, un coût positif", () => {
    expect(Number.isInteger(CREDITS.tokens) && CREDITS.tokens > 0).toBe(true);
    expect(CREDITS.apiCostUsd).toBeGreaterThan(0);
    // Centimes : la ligne affichée n'arrondit rien.
    expect(Math.round(CREDITS.apiCostUsd * 100) / 100).toBe(CREDITS.apiCostUsd);
  });

  test("tokens et coût se lisent à la française, avec la mention « estimé »", () => {
    const line = usageLine({ repoUrl: "", tokens: 118795538, apiCostUsd: 50.31, cacheReadTokens: 0, cacheReadCostUsd: 0, outputTokens: 0 });
    expect(line.replace(THIN_SPACE, " ")).toBe(`118 795 538 tokens ${DOT} coût API estimé : 50,31 $`);
  });

  test("la précision sur le cache se lit à la française : relectures, leur coût, tokens produits par les modèles (réflexion comprise)", () => {
    const line = cacheLine({
      repoUrl: "",
      tokens: 118795538,
      apiCostUsd: 50.31,
      cacheReadTokens: 115000000,
      cacheReadCostUsd: 23,
      outputTokens: 480123,
    });
    expect(line.replace(THIN_SPACE, " ")).toBe(
      `dont 115 000 000 tokens relus en cache (23,00 $) ${DOT} 480 123 tokens produits par les modèles, réflexion comprise`,
    );
  });

  test("les parts du compte sont cohérentes : relectures et sortie tiennent dans le total, le coût des relectures dans le coût", () => {
    expect(Number.isInteger(CREDITS.cacheReadTokens) && CREDITS.cacheReadTokens > 0).toBe(true);
    expect(Number.isInteger(CREDITS.outputTokens) && CREDITS.outputTokens > 0).toBe(true);
    expect(CREDITS.cacheReadTokens + CREDITS.outputTokens).toBeLessThanOrEqual(CREDITS.tokens);
    expect(CREDITS.cacheReadCostUsd).toBeGreaterThan(0);
    expect(CREDITS.cacheReadCostUsd).toBeLessThan(CREDITS.apiCostUsd);
    // Centimes : la ligne affichée n'arrondit rien.
    expect(Math.round(CREDITS.cacheReadCostUsd * 100) / 100).toBe(CREDITS.cacheReadCostUsd);
  });

  // Les trois textes publics répètent les nombres du jeu, avec des espaces ordinaires entre les milliers : un nouveau
  // compte qui oublie un fichier fait échouer la suite.
  const plainInt = (value: number) => new Intl.NumberFormat("fr-FR").format(value).replace(THIN_SPACE, " ");
  const plainUsd = (value: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value).replace(THIN_SPACE, " ");

  for (const file of ["README.md", "public/llms.txt", "public/llms-full.txt"]) {
    test(`${file} porte les mêmes nombres que le panneau des crédits`, () => {
      const text = readFileSync(file, "utf8");
      expect(text).toContain(`${plainInt(CREDITS.tokens)} tokens`);
      expect(text).toContain(`${plainUsd(CREDITS.apiCostUsd)} $`);
      expect(text).toContain(`dont ${plainInt(CREDITS.cacheReadTokens)} tokens relus en cache (${plainUsd(CREDITS.cacheReadCostUsd)} $)`);
      expect(text).toContain(`${plainInt(CREDITS.outputTokens)} tokens produits par les modèles, réflexion comprise`);
      // Aucun tiret cadratin (U+2014) dans un texte lu par un tiers.
      expect(text.includes(String.fromCodePoint(0x2014))).toBe(false);
    });
  }
});
