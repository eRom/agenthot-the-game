// Journal des dépenses (spec 8, AC-17) : totaux par outil, contrôle avant un appel payant, ligne d'un appel
// Nano Banana. Lyria et Seedream écrivent leur ligne eux-mêmes (generate-music.ts, generate-image.ts).
import { LYRIA, type LedgerEntry, spentUsd } from "./lyria";
import { SEEDREAM } from "./seedream";

// Nano Banana passe par le MCP erom-image, qui ne renvoie pas le coût : on journalise celui de la grille
// (https://ai.google.dev/gemini-api/docs/pricing, mise à jour du 2026-09-24, brief plan 3 section 3).
export const NANO_BANANA = {
  ledgerTool: "nanobanana",
  model: "gemini-3.1-flash-image-preview",
  costUsd: { "512px": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151 },
  // Budget Nano Banana de la spec 8.
  budgetUsd: 2.5,
} as const;

export type NanoBananaResolution = keyof typeof NANO_BANANA.costUsd;

// Budgets de la spec 8, par outil du journal.
export const BUDGETS: Readonly<Record<string, number>> = {
  [LYRIA.ledgerTool]: LYRIA.budgetUsd,
  [SEEDREAM.ledgerTool]: SEEDREAM.budgetUsd,
  [NANO_BANANA.ledgerTool]: NANO_BANANA.budgetUsd,
};

export interface ToolSpend {
  tool: string;
  calls: number;
  spentUsd: number;
  // Null : outil absent de la spec 8 (à signaler, pas à compter comme gratuit).
  budgetUsd: number | null;
}

// Totaux par outil : les trois outils de la spec, même sans appel, puis tout autre outil trouvé dans le journal.
export function ledgerSummary(ledgerText: string): ToolSpend[] {
  const calls = new Map<string, number>();
  for (const tool of Object.keys(BUDGETS)) calls.set(tool, 0);
  for (const line of ledgerText.split("\n")) {
    if (line.trim() === "") continue;
    const entry = JSON.parse(line) as LedgerEntry;
    calls.set(entry.tool, (calls.get(entry.tool) ?? 0) + 1);
  }
  return [...calls.keys()].sort().map((tool) => ({
    tool,
    calls: calls.get(tool)!,
    spentUsd: spentUsd(ledgerText, tool),
    budgetUsd: BUDGETS[tool] ?? null,
  }));
}

// Contrôle avant un appel payant : le total de l'outil plus le coût doit rester sous le budget de la spec 8, et sous
// le plafond du « go » de Romain quand il est donné (total de l'outil dans le journal, pas seulement ce chantier).
export function checkSpend(ledgerText: string, tool: string, costUsd: number, capUsd: number | null): { ok: boolean; spentUsd: number; limitUsd: number } {
  const spent = spentUsd(ledgerText, tool);
  const limitUsd = Math.min(BUDGETS[tool] ?? 0, capUsd ?? Number.POSITIVE_INFINITY);
  return { ok: spent + costUsd <= limitUsd + 1e-9, spentUsd: spent, limitUsd };
}

// Ligne du journal d'un appel Nano Banana, au coût de la grille.
export function nanoBananaEntry(date: Date, resolution: NanoBananaResolution, output: string, prompt: string): LedgerEntry {
  return { date: date.toISOString(), tool: NANO_BANANA.ledgerTool, model: NANO_BANANA.model, prompt, output, costUsd: NANO_BANANA.costUsd[resolution] };
}

export type SpendCommand =
  | { kind: "summary" }
  | { kind: "check"; tool: string; costUsd: number; capUsd: number | null }
  | { kind: "log-nanobanana"; resolution: NanoBananaResolution; output: string; promptFile: string };

// Montant en dollars écrit en clair (« 0.067 ») : tout le reste est refusé.
function parseUsd(text: string | undefined): number | null {
  if (text === undefined || !/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

// Arguments de scripts/spend.ts, en échec fermé : une commande inconnue, un outil hors spec, un montant mal écrit
// ou un argument en trop sont refusés.
export function parseSpendArgs(args: readonly string[]): { ok: true; command: SpendCommand } | { ok: false; error: string } {
  const [kind, ...rest] = args;
  if (kind === "summary" && rest.length === 0) return { ok: true, command: { kind } };
  if (kind === "check" && (rest.length === 2 || rest.length === 3)) {
    const [tool, cost, cap] = rest;
    if (!Object.hasOwn(BUDGETS, tool!)) return { ok: false, error: `unknown tool: ${tool}` };
    const costUsd = parseUsd(cost);
    const capUsd = cap === undefined ? null : parseUsd(cap);
    if (costUsd === null || (cap !== undefined && capUsd === null)) return { ok: false, error: "amounts are plain dollars, e.g. 0.067" };
    return { ok: true, command: { kind, tool: tool!, costUsd, capUsd } };
  }
  if (kind === "log-nanobanana" && rest.length === 3) {
    const [resolution, output, promptFile] = rest as [string, string, string];
    if (!Object.hasOwn(NANO_BANANA.costUsd, resolution)) return { ok: false, error: `unknown resolution: ${resolution}` };
    return { ok: true, command: { kind, resolution: resolution as NanoBananaResolution, output, promptFile } };
  }
  return { ok: false, error: `unknown command or wrong arguments: ${args.join(" ") || "(none)"}` };
}
