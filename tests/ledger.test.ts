import { describe, expect, test } from "bun:test";
import { BUDGETS, GO_CAPS, NANO_BANANA, checkSpend, ledgerSummary, nanoBananaEntry, parseSpendArgs } from "../scripts/ledger";

const line = (tool: string, costUsd: number) => JSON.stringify({ date: "2026-09-30", tool, model: "m", prompt: "p", output: "o", costUsd });
const LEDGER = [line("lyria", 0.08), line("lyria", 0.08), "", line("nanobanana", 0.067)].join("\n");

describe("journal des dépenses : totaux par outil (spec 8, AC-17)", () => {
  test("les trois outils de la spec apparaissent, même sans appel, avec leur budget", () => {
    const rows = ledgerSummary(LEDGER);
    expect(rows.map((r) => r.tool)).toEqual(["lyria", "nanobanana", "seedream"]);
    expect(rows[0]).toMatchObject({ calls: 2, budgetUsd: 3 });
    expect(rows[0]!.spentUsd).toBeCloseTo(0.16, 9);
    expect(rows[1]).toMatchObject({ calls: 1, spentUsd: 0.067, budgetUsd: 2.5 });
    expect(rows[2]).toMatchObject({ calls: 0, spentUsd: 0, budgetUsd: 3 });
  });

  test("un outil hors spec est montré sans budget, pas compté comme gratuit", () => {
    const rows = ledgerSummary(`${LEDGER}\n${line("mystery", 1)}`);
    expect(rows.find((r) => r.tool === "mystery")).toEqual({ tool: "mystery", calls: 1, spentUsd: 1, budgetUsd: null });
  });

  test("les budgets sont ceux de la spec 8", () => {
    expect(BUDGETS).toEqual({ lyria: 3, seedream: 3, nanobanana: 2.5 });
  });
});

describe("journal des dépenses : contrôle avant un appel payant", () => {
  test("sans plafond en argument, le plafond du go s'applique seul, sous le budget de la spec", () => {
    expect(GO_CAPS).toEqual({ lyria: 0.48, nanobanana: 0.4, seedream: 0.36 });
    expect(checkSpend(LEDGER, "lyria", 0.08, null)).toMatchObject({ ok: true, limitUsd: 0.48 });
    expect(checkSpend(`${line("seedream", 0.3)}\n`, "seedream", 0.09, null)).toMatchObject({ ok: false, limitUsd: 0.36 });
  });

  test("sans plafond en argument, un appel Lyria à 0,48 $ de total passe, un de plus est refusé", () => {
    const ledger = [line("lyria", 0.08), line("lyria", 0.08), line("lyria", 0.08), line("lyria", 0.08), line("lyria", 0.08)].join("\n");
    expect(checkSpend(ledger, "lyria", 0.08, null)).toMatchObject({ ok: true, spentUsd: expect.closeTo(0.4, 9), limitUsd: 0.48 });
    expect(checkSpend(`${ledger}\n${line("lyria", 0.08)}`, "lyria", 0.08, null)).toMatchObject({ ok: false, limitUsd: 0.48 });
  });

  test("un plafond en argument plus haut que celui du go ne l'élargit pas, un plus bas le resserre", () => {
    expect(checkSpend("", "lyria", 0.08, 10)).toMatchObject({ ok: true, limitUsd: 0.48 });
    expect(checkSpend("", "lyria", 0.6, 10).ok).toBe(false);
    expect(checkSpend("", "lyria", 0.08, 0.05)).toMatchObject({ ok: false, limitUsd: 0.05 });
  });

  test("un outil absent des plafonds du go échoue fermé, même avec un plafond en argument", () => {
    expect(checkSpend("", "mystery", 0.01, 10)).toMatchObject({ ok: false, limitUsd: 0 });
  });

  test("le plafond du go s'applique au total de l'outil : 0,16 $ déjà dépensés + 4 essais à 0,08 $ tiennent dans 0,48 $, pas un 5e", () => {
    let ledger = LEDGER;
    for (let i = 0; i < 4; i++) {
      expect(checkSpend(ledger, "lyria", 0.08, 0.48).ok).toBe(true);
      ledger += `\n${line("lyria", 0.08)}`;
    }
    expect(checkSpend(ledger, "lyria", 0.08, 0.48)).toMatchObject({ ok: false, limitUsd: 0.48 });
  });

  test("Nano Banana 2 en 1K : 5 images tiennent dans 0,40 $, pas une 6e", () => {
    let ledger = "";
    for (let i = 0; i < 5; i++) {
      expect(checkSpend(ledger, "nanobanana", NANO_BANANA.costUsd["1K"], 0.4).ok).toBe(true);
      ledger += `${line("nanobanana", NANO_BANANA.costUsd["1K"])}\n`;
    }
    expect(checkSpend(ledger, "nanobanana", NANO_BANANA.costUsd["1K"], 0.4).ok).toBe(false);
  });

  test("un plafond plus haut que le budget de la spec ne l'élargit pas", () => {
    expect(checkSpend(`${line("nanobanana", 0.39)}\n`, "nanobanana", 0.067, 10)).toMatchObject({ ok: false, limitUsd: 0.4 });
  });
});

describe("journal des dépenses : ligne Nano Banana et arguments", () => {
  test("la ligne porte l'outil, le modèle et le coût de la grille pour la résolution", () => {
    const entry = nanoBananaEntry(new Date("2026-09-30T10:00:00Z"), "1K", "assets/images/room-01.png", "a server room");
    expect(entry).toEqual({
      date: "2026-09-30T10:00:00.000Z",
      tool: "nanobanana",
      model: "gemini-3.1-flash-image-preview",
      prompt: "a server room",
      output: "assets/images/room-01.png",
      costUsd: 0.067,
    });
  });

  test("commandes valides", () => {
    expect(parseSpendArgs(["summary"])).toEqual({ ok: true, command: { kind: "summary" } });
    expect(parseSpendArgs(["check", "lyria", "0.08", "0.48"])).toEqual({ ok: true, command: { kind: "check", tool: "lyria", costUsd: 0.08, capUsd: 0.48 } });
    expect(parseSpendArgs(["check", "seedream", "0.09"])).toEqual({ ok: true, command: { kind: "check", tool: "seedream", costUsd: 0.09, capUsd: null } });
    expect(parseSpendArgs(["log-nanobanana", "1K", "assets/images/room-01.png", "assets/prompts/room-01.txt"])).toEqual({
      ok: true,
      command: { kind: "log-nanobanana", resolution: "1K", output: "assets/images/room-01.png", promptFile: "assets/prompts/room-01.txt" },
    });
  });

  test("tout le reste est refusé : outil hors spec, montant mal écrit, résolution inconnue, argument en trop", () => {
    for (const args of [
      [],
      ["summary", "x"],
      ["check", "gpt", "0.1"],
      ["check", "lyria"],
      ["check", "lyria", "-0.08"],
      ["check", "lyria", "0,08"],
      ["check", "lyria", "abc"],
      ["check", "lyria", "0.08", "NaN"],
      ["check", "lyria", "0.08", "0.48", "x"],
      ["check", "toString", "0.08"],
      ["log-nanobanana", "1k", "a.png", "p.txt"],
      ["log-nanobanana", "1K", "a.png"],
      ["pay"],
    ]) {
      expect(parseSpendArgs(args).ok).toBe(false);
    }
  });
});
