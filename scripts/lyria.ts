// Outils purs du script de génération musicale (spec 8) : budget du journal, lecture de la réponse Lyria.

export const LYRIA = {
  endpoint: "https://generativelanguage.googleapis.com/v1beta/interactions",
  model: "lyria-3.5",
  // Prix par morceau (https://ai.google.dev/gemini-api/docs/pricing, mis à jour le 2026-09-24).
  costUsd: 0.08,
  // Budget Lyria de la spec 8.
  budgetUsd: 3,
  // Nom de l'outil dans assets/ledger.jsonl (AC-17 somme costUsd par outil).
  ledgerTool: "lyria",
} as const;

export interface LedgerEntry {
  date: string;
  tool: string;
  model: string;
  prompt: string;
  output: string;
  costUsd: number;
}

// Total déjà dépensé pour un outil, d'après le journal (une ligne JSON par génération).
export function spentUsd(ledgerText: string, tool: string): number {
  let total = 0;
  for (const line of ledgerText.split("\n")) {
    if (line.trim() === "") continue;
    const entry = JSON.parse(line) as LedgerEntry;
    if (entry.tool === tool) total += entry.costUsd;
  }
  return total;
}

// Règle de la spec 8 : le total de l'outil plus le coût estimé doit rester sous le budget.
export function canAfford(ledgerText: string, tool: string, costUsd: number, budgetUsd: number): boolean {
  return spentUsd(ledgerText, tool) + costUsd <= budgetUsd + 1e-9;
}

export interface FoundAudio {
  data: string;
  mimeType: string;
}

// Cherche le premier bloc audio (champ `data` en base64 et type MIME audio/*) n'importe où dans la réponse.
// La forme exacte d'une réponse réussie n'a pas été capturée avant le plan : la recherche ne dépend pas
// du chemin (steps[].content[] d'après la doc, ou candidates[].content.parts[].inlineData selon l'API).
export function findAudio(node: unknown): FoundAudio | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findAudio(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object" || node === null) return null;
  const obj = node as Record<string, unknown>;
  const mime = obj.mime_type ?? obj.mimeType;
  if (typeof obj.data === "string" && typeof mime === "string" && mime.startsWith("audio/")) {
    return { data: obj.data, mimeType: mime };
  }
  for (const key of Object.keys(obj)) {
    const found = findAudio(obj[key]);
    if (found) return found;
  }
  return null;
}

// Copie de la réponse où chaque long champ base64 est remplacé par sa longueur : c'est l'échantillon
// réel gardé dans assets/ pour la suite (la réponse brute pèse plusieurs Mo). Le champ `data` est
// élidé dès 257 caractères ; tout autre champ texte l'est à partir de 1000, quel que soit son nom,
// pour qu'un champ audio inattendu ne finisse jamais versionné.
export function withoutAudioData(node: unknown, key = ""): unknown {
  if (Array.isArray(node)) return node.map((item) => withoutAudioData(item));
  if (typeof node === "string") {
    return node.length >= 1000 || (key === "data" && node.length > 256) ? `<${node.length} base64 chars>` : node;
  }
  if (typeof node !== "object" || node === null) return node;
  const out: Record<string, unknown> = {};
  for (const [k, value] of Object.entries(node)) out[k] = withoutAudioData(value, k);
  return out;
}

export type ParsedArgs = { ok: true; track: string; dryRun: boolean } | { ok: false; error: string };

// Arguments du script, en échec fermé : un drapeau inconnu ou un argument en trop ne doit jamais tomber
// sur le chemin payant. Seuls `<piste>` et `<piste> --dry-run` sont acceptés.
export function parseArgs(args: readonly string[], tracks: Record<string, string>): ParsedArgs {
  const [track, flag, ...extra] = args;
  if (track === undefined || !Object.hasOwn(tracks, track)) return { ok: false, error: `unknown or missing track: ${track ?? "(none)"}` };
  if (extra.length > 0) return { ok: false, error: `unexpected extra arguments: ${extra.join(" ")}` };
  if (flag !== undefined && flag !== "--dry-run") return { ok: false, error: `unknown flag: ${flag}` };
  return { ok: true, track, dryRun: flag === "--dry-run" };
}

// Extension de fichier pour un type MIME audio.
export function audioExtension(mimeType: string): string {
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") return "mp3";
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav" || mimeType === "audio/wave") return "wav";
  return mimeType.slice("audio/".length).replace(/[^a-z0-9]/g, "") || "bin";
}
