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

export type ParsedArgs = { ok: true; track: string; pay: boolean; overwrite: boolean } | { ok: false; error: string };

// Arguments du script, en échec fermé : seul `--pay` ouvre le chemin payant. Sans lui, la piste seule (ou avec
// `--dry-run`, toujours accepté) est un essai à blanc. `--overwrite` autorise à écraser un fichier existant.
// Un drapeau inconnu, répété, ou `--pay` avec `--dry-run` (contradiction) est refusé.
export function parseArgs(args: readonly string[], tracks: Readonly<Record<string, unknown>>): ParsedArgs {
  const [track, ...flags] = args;
  if (track === undefined || !Object.hasOwn(tracks, track)) return { ok: false, error: `unknown or missing track: ${track ?? "(none)"}` };
  let pay = false;
  let dryRun = false;
  let overwrite = false;
  for (const flag of flags) {
    if (flag === "--pay" && !pay) pay = true;
    else if (flag === "--dry-run" && !dryRun) dryRun = true;
    else if (flag === "--overwrite" && !overwrite) overwrite = true;
    else if (flag === "--pay" || flag === "--dry-run" || flag === "--overwrite") return { ok: false, error: `repeated flag: ${flag}` };
    else return { ok: false, error: `unknown flag or extra argument: ${flag}` };
  }
  if (pay && dryRun) return { ok: false, error: "--pay and --dry-run contradict each other" };
  return { ok: true, track, pay, overwrite };
}

// Extension de fichier pour un type MIME audio.
export function audioExtension(mimeType: string): string {
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") return "mp3";
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav" || mimeType === "audio/wave") return "wav";
  return mimeType.slice("audio/".length).replace(/[^a-z0-9]/g, "") || "bin";
}

export interface ApiResponse {
  status: number;
  ok: boolean;
  text: string;
}

// Ce dont la génération a besoin du monde extérieur : le vrai script branche l'API, le disque et la console,
// les tests un faux client qui note l'ordre des opérations.
export interface GenerationIo {
  apiKey: string | undefined;
  readLedger(): Promise<string>;
  exists(path: string): Promise<boolean>;
  // Appel payant à Lyria : la génération est synchrone et peut durer plusieurs minutes.
  callApi(body: LyriaBody): Promise<ApiResponse>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  // Ajoute une seule ligne au journal : jamais de réécriture du fichier depuis une copie lue plus tôt.
  appendLedgerLine(line: string): Promise<void>;
  now(): Date;
  info(text: string): void;
  warn(text: string): void;
  error(text: string): void;
}

export interface LyriaBody {
  model: string;
  input: string;
  response_format: { type: string };
}

export interface GenerationOptions {
  track: string;
  prompt: string;
  // Faux : essai à blanc, aucun appel. Vrai : appel réel et facturé.
  pay: boolean;
  overwrite: boolean;
  // Dossier du morceau : src/audio/tracks pour ceux que le jeu charge (par défaut), un autre pour la cinématique.
  dir?: string;
}

export type Outcome =
  | "dry-run"
  | "over-budget"
  | "exists"
  | "no-api-key"
  | "http-error"
  | "not-json"
  | "no-audio"
  | "ledger-failed"
  | "written";

export const LEDGER_PATH = "assets/ledger.jsonl";

// Génère un morceau. Garde-fous, dans l'ordre : budget, fichier existant, clé d'API, budget relu à neuf, appel.
// La ligne du journal est ajoutée juste après la réponse payée, avant toute écriture de fichier : rien
// (analyse, échantillon, disque) ne doit pouvoir faire perdre la trace d'une dépense.
export async function generateTrack(opts: GenerationOptions, io: GenerationIo): Promise<{ outcome: Outcome; exitCode: number }> {
  const { track, prompt } = opts;
  let ledgerText = await io.readLedger();
  let spent = spentUsd(ledgerText, LYRIA.ledgerTool);
  const overBudget = (): { outcome: Outcome; exitCode: number } => {
    io.error(`budget exceeded: ${spent.toFixed(2)} $ spent + ${LYRIA.costUsd} $ > ${LYRIA.budgetUsd} $. Ask Romain.`);
    return { outcome: "over-budget", exitCode: 2 };
  };
  if (!canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) return overBudget();

  const body: LyriaBody = { model: LYRIA.model, input: prompt, response_format: { type: "audio" } };
  const dir = opts.dir ?? "src/audio/tracks";
  const mp3Path = `${dir}/${track}.mp3`;
  const alreadyThere = await io.exists(mp3Path);
  io.info(`track ${track} · spent ${spent.toFixed(2)} $ of ${LYRIA.budgetUsd} $ · this call ${LYRIA.costUsd} $`);
  if (!opts.pay) {
    io.info(JSON.stringify(body, null, 2));
    io.info("dry run: nothing was called or spent. A real call needs --pay.");
    if (alreadyThere) io.info(`${mp3Path} already exists: a real call also needs --overwrite.`);
    return { outcome: "dry-run", exitCode: 0 };
  }
  if (alreadyThere && !opts.overwrite) {
    io.error(`${mp3Path} already exists: refusing to pay for a track that would overwrite it. Pass --overwrite to allow it.`);
    return { outcome: "exists", exitCode: 1 };
  }
  if (!io.apiKey) {
    io.error("GEMINI_API_KEY is not set");
    return { outcome: "no-api-key", exitCode: 1 };
  }

  // Le journal a pu changer depuis la première lecture (autre génération en parallèle) : on revérifie le budget
  // sur une lecture fraîche, juste avant de payer.
  ledgerText = await io.readLedger();
  spent = spentUsd(ledgerText, LYRIA.ledgerTool);
  if (!canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) return overBudget();

  const response = await io.callApi(body);
  const rawPath = `.superpowers/lyria-${track}-raw.json`;

  // Lecture en mémoire seulement (aucune écriture) : elle sert à nommer la sortie du journal.
  let json: unknown;
  let parsed = false;
  try {
    json = JSON.parse(response.text);
    parsed = true;
  } catch {
    parsed = false;
  }
  const audio = parsed ? findAudio(json) : null;
  const output = audio ? `${dir}/${track}.${audioExtension(audio.mimeType)}` : rawPath;

  // HTTP 2xx : l'appel est facturé, même sans audio exploitable. Journal d'abord, fichiers ensuite.
  let ledgerError: unknown;
  if (response.ok) {
    const entry = { date: io.now().toISOString(), tool: LYRIA.ledgerTool, model: LYRIA.model, prompt, output, costUsd: LYRIA.costUsd };
    try {
      await io.appendLedgerLine(`${JSON.stringify(entry)}\n`);
    } catch (error) {
      ledgerError = error;
    }
  }

  // Réponse brute gardée tout de suite (hors dépôt), avant tout traitement : le morceau est peut-être payé.
  await io.writeFile(rawPath, response.text);
  if (ledgerError !== undefined) {
    io.error(`the call was billed (${LYRIA.costUsd} $) but the ledger line could not be written (${String(ledgerError)}): add it to ${LEDGER_PATH} by hand. Raw response kept in ${rawPath}`);
    return { outcome: "ledger-failed", exitCode: 1 };
  }
  if (!parsed) {
    io.error(`response is not JSON (HTTP ${response.status}). ${response.ok ? "The call was billed and logged in the ledger." : "The call was not billed."} Raw response kept in ${rawPath}`);
    return { outcome: response.ok ? "not-json" : "http-error", exitCode: 1 };
  }
  // Échantillon réel de la réponse, audio remplacé par sa longueur : la forme exacte n'était pas connue au plan.
  await io.writeFile(`assets/lyria-${track}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
  if (!response.ok) {
    io.error(`HTTP ${response.status}: see assets/lyria-${track}-response.json, raw response in ${rawPath}`);
    return { outcome: "http-error", exitCode: 1 };
  }
  if (!audio) {
    io.error(`WARNING: HTTP 200 but no audio found. The call was billed (${LYRIA.costUsd} $) and logged in the ledger, with the raw response as its output.`);
    io.error(`Raw response: ${rawPath} (recover the audio once findAudio is fixed against assets/lyria-${track}-response.json, without a second paid call)`);
    return { outcome: "no-audio", exitCode: 1 };
  }
  await io.writeFile(output, Buffer.from(audio.data, "base64"));
  io.info(`wrote ${output} (${audio.mimeType}) · ledger ${(spent + LYRIA.costUsd).toFixed(2)} $`);
  if (!output.endsWith(".mp3")) io.warn(`${mp3Path} is expected: convert ${output} before using it`);
  return { outcome: "written", exitCode: 0 };
}
