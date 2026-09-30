// Outils purs du script d'images Seedream 5.0 Pro via OpenRouter (spec 8) : mêmes garde-fous que Lyria (plan 2).
// Appel, corps et réponse d'après le brief plan 3, section 2 (sonde gratuite du 2026-09-29 sur l'endpoint du modèle,
// et guide docs/superpowers/idea/Seedream-5.0-Pro.md). La forme d'une réponse réussie n'a pas été capturée (elle
// coûte un appel) : la lecture cherche l'image n'importe où, et le premier appel garde la réponse brute.
import { canAfford, spentUsd, withoutAudioData } from "./lyria";

export const SEEDREAM = {
  endpoint: "https://openrouter.ai/api/v1/images",
  model: "bytedance-seed/seedream-5-0-pro",
  // Prix par image (sonde du 2026-09-29) : 1K 0,045 $, 2K 0,09 $ (variante « high_resolution »).
  costUsd: { "1K": 0.045, "2K": 0.09 },
  // Budget Seedream de la spec 8.
  budgetUsd: 3,
  ledgerTool: "seedream",
} as const;

export type Resolution = keyof typeof SEEDREAM.costUsd;

export interface ImageSpec {
  prompt: string;
  // Valeurs acceptées par le modèle (sonde) : "1:1", "2:1", "16:9", etc.
  aspectRatio: string;
  resolution: Resolution;
}

export interface SeedreamBody {
  model: string;
  prompt: string;
  n: 1;
  aspect_ratio: string;
  resolution: Resolution;
}

export function seedreamBody(spec: ImageSpec): SeedreamBody {
  return { model: SEEDREAM.model, prompt: spec.prompt, n: 1, aspect_ratio: spec.aspectRatio, resolution: spec.resolution };
}

export interface FoundImage {
  data: string;
  mimeType: string;
}

// Premier `b64_json` trouvé dans la réponse (doc : data[0].b64_json, avec data[0].media_type), n'importe où.
export function findImage(node: unknown): FoundImage | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findImage(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object" || node === null) return null;
  const obj = node as Record<string, unknown>;
  if (typeof obj.b64_json === "string") {
    const mime = obj.media_type ?? obj.mime_type ?? obj.mimeType;
    return { data: obj.b64_json, mimeType: typeof mime === "string" ? mime : "image/png" };
  }
  for (const key of Object.keys(obj)) {
    const found = findImage(obj[key]);
    if (found) return found;
  }
  return null;
}

// Coût réel annoncé par OpenRouter (`usage.cost`, en dollars), sinon celui de la grille.
export function billedCost(json: unknown, resolution: Resolution): number {
  const usage = (json as { usage?: { cost?: unknown } } | null)?.usage;
  return typeof usage?.cost === "number" && usage.cost >= 0 ? usage.cost : SEEDREAM.costUsd[resolution];
}

export function imageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

// Chemins possibles d'une image déjà générée : l'extension dépend du format renvoyé.
export function imagePaths(name: string): string[] {
  return ["png", "jpg", "webp"].map((ext) => `assets/images/${name}.${ext}`);
}

export interface ImageIo {
  apiKey: string | undefined;
  readLedger(): Promise<string>;
  exists(path: string): Promise<boolean>;
  callApi(body: SeedreamBody): Promise<{ status: number; ok: boolean; text: string }>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  appendLedgerLine(line: string): Promise<void>;
  now(): Date;
  info(text: string): void;
  error(text: string): void;
}

export type ImageOutcome = "dry-run" | "over-budget" | "exists" | "no-api-key" | "http-error" | "no-image" | "ledger-failed" | "written";

// Génère une image dans assets/images/<nom>.<ext>. Garde-fous, dans l'ordre : budget, fichier existant, clé,
// budget relu à neuf, appel ; la ligne du journal est ajoutée juste après une réponse 2xx, avant tout fichier.
export async function generateImage(
  opts: { name: string; spec: ImageSpec; pay: boolean; overwrite: boolean },
  io: ImageIo,
): Promise<{ outcome: ImageOutcome; exitCode: number }> {
  const estimate = SEEDREAM.costUsd[opts.spec.resolution];
  let ledgerText = await io.readLedger();
  const overBudget = (): { outcome: ImageOutcome; exitCode: number } => {
    io.error(`budget exceeded: ${spentUsd(ledgerText, SEEDREAM.ledgerTool).toFixed(3)} $ spent + ${estimate} $ > ${SEEDREAM.budgetUsd} $. Ask Romain.`);
    return { outcome: "over-budget", exitCode: 2 };
  };
  if (!canAfford(ledgerText, SEEDREAM.ledgerTool, estimate, SEEDREAM.budgetUsd)) return overBudget();
  const body = seedreamBody(opts.spec);
  let existing: string | undefined;
  for (const path of imagePaths(opts.name)) if (await io.exists(path)) existing ??= path;
  io.info(`image ${opts.name} · spent ${spentUsd(ledgerText, SEEDREAM.ledgerTool).toFixed(3)} $ of ${SEEDREAM.budgetUsd} $ · this call ~${estimate} $`);
  if (!opts.pay) {
    io.info(JSON.stringify(body, null, 2));
    io.info("dry run: nothing was called or spent. A real call needs --pay.");
    if (existing) io.info(`${existing} already exists: a real call also needs --overwrite.`);
    return { outcome: "dry-run", exitCode: 0 };
  }
  if (existing && !opts.overwrite) {
    io.error(`${existing} already exists: pass --overwrite to pay for a new one.`);
    return { outcome: "exists", exitCode: 1 };
  }
  if (!io.apiKey) {
    io.error("OPENROUTER_API_KEY is not set");
    return { outcome: "no-api-key", exitCode: 1 };
  }
  ledgerText = await io.readLedger();
  if (!canAfford(ledgerText, SEEDREAM.ledgerTool, estimate, SEEDREAM.budgetUsd)) return overBudget();

  const response = await io.callApi(body);
  // Un chemin par appel : la réponse brute d'un appel facturé sans image est la seule copie de la réponse payée,
  // un second appel (même une erreur 402) ne doit pas la réécrire.
  const now = io.now();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const rawPath = `.superpowers/seedream-${opts.name}-raw-${stamp}.json`;
  let json: unknown = null;
  try {
    json = JSON.parse(response.text);
  } catch {
    json = null;
  }
  const image = json ? findImage(json) : null;
  const output = image ? `assets/images/${opts.name}.${imageExtension(image.mimeType)}` : rawPath;

  // 2xx : facturé (402, 429 et 502 ne le sont pas, brief section 2). Journal d'abord.
  if (response.ok) {
    const cost = billedCost(json, opts.spec.resolution);
    const entry = { date: now.toISOString(), tool: SEEDREAM.ledgerTool, model: SEEDREAM.model, prompt: opts.spec.prompt, output, costUsd: cost };
    try {
      await io.appendLedgerLine(`${JSON.stringify(entry)}\n`);
    } catch (error) {
      await io.writeFile(rawPath, response.text);
      io.error(`billed (${cost} $) but the ledger line could not be written (${String(error)}): add it by hand. Raw response in ${rawPath}`);
      return { outcome: "ledger-failed", exitCode: 1 };
    }
  }
  await io.writeFile(rawPath, response.text);
  if (json) await io.writeFile(`assets/seedream-${opts.name}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
  if (!response.ok) {
    io.error(`HTTP ${response.status}: not billed. Raw response in ${rawPath}`);
    return { outcome: "http-error", exitCode: 1 };
  }
  if (!image) {
    io.error(`HTTP ${response.status} but no image found. Billed and logged; raw response in ${rawPath} (recover it, do not pay again).`);
    return { outcome: "no-image", exitCode: 1 };
  }
  await io.writeFile(output, Buffer.from(image.data, "base64"));
  io.info(`wrote ${output} (${image.mimeType})`);
  return { outcome: "written", exitCode: 0 };
}
