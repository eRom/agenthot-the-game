// Génère un morceau avec Lyria 3.5 (spec 7.2 et 8). Usage :
//   bun scripts/generate-music.ts <game|replay> [--dry-run]
// Seuls `<piste>` et `<piste> --dry-run` sont acceptés : tout autre argument est refusé (échec fermé).
// --dry-run affiche la requête et le budget sans rien appeler ni dépenser.
// Chaque vraie génération coûte 0,08 $ et ajoute une ligne à assets/ledger.jsonl.
import { appendFile, mkdir } from "node:fs/promises";
import { LYRIA, audioExtension, canAfford, findAudio, parseArgs, spentUsd, withoutAudioData } from "./lyria";

// Prompts en anglais (langue de travail de Lyria). Aucun nom d'artiste : les filtres de Lyria les bloquent.
const TRACKS: Record<string, string> = {
  game: [
    "Instrumental only, no vocals.",
    "Tense, pulsing dark electronic track for a first-person action game where time only moves when you move.",
    "120 BPM, D minor. Punchy sub-bass pulse on every beat, tight ticking hi-hats, cold metallic stabs, a restless analog synth arpeggio.",
    "Designed to be slowed down: a clear low-end pulse and no silent gaps, so it stays menacing at half speed.",
    "[0:00 - 0:08] Intro: pulse and ticking only.",
    "[0:08 - 1:20] Main groove: full drums, bass and arpeggio, steady energy, no breakdown.",
    "[1:20 - 1:30] Outro that flows straight back into the main groove, for a clean loop.",
  ].join(" "),
  replay: [
    "Heavy, slow, triumphant electronic track for an action movie slow-motion replay.",
    "120 BPM with a huge hit on every beat, E minor. Massive distorted drums, sub drops, glitchy synth stabs.",
    "Vocals: a deep, processed robotic male voice shouts only two words, alternating on each strong beat:",
    "\"AGENT... HOT... AGENT... HOT...\", repeated through the whole track. No other lyrics.",
    "[0:00 - 0:04] Single impact hit.",
    "[0:04 - 1:00] Chant over full drums.",
    "[1:00 - 1:10] Final hit and decay.",
  ].join(" "),
};

const LEDGER = "assets/ledger.jsonl";
const USAGE = `usage: bun scripts/generate-music.ts <${Object.keys(TRACKS).join("|")}> [--dry-run]`;

const args = parseArgs(process.argv.slice(2), TRACKS);
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}
const { track, dryRun } = args;
const prompt = TRACKS[track]!;

async function readLedger(): Promise<string> {
  const file = Bun.file(LEDGER);
  return (await file.exists()) ? await file.text() : "";
}

let ledgerText = await readLedger();
let spent = spentUsd(ledgerText, LYRIA.ledgerTool);
function refuseIfOverBudget(): void {
  if (canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) return;
  console.error(`budget exceeded: ${spent.toFixed(2)} $ spent + ${LYRIA.costUsd} $ > ${LYRIA.budgetUsd} $. Ask Romain.`);
  process.exit(2);
}
refuseIfOverBudget();

const body = { model: LYRIA.model, input: prompt, response_format: { type: "audio" } };
console.info(`track ${track} · spent ${spent.toFixed(2)} $ of ${LYRIA.budgetUsd} $ · this call ${LYRIA.costUsd} $`);
if (dryRun) {
  console.info(JSON.stringify(body, null, 2));
  process.exit(0);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

// Le journal a pu changer depuis la première lecture (autre génération en parallèle) : on revérifie le budget
// sur une lecture fraîche, juste avant de payer.
ledgerText = await readLedger();
spent = spentUsd(ledgerText, LYRIA.ledgerTool);
refuseIfOverBudget();

// La génération est synchrone et peut prendre plusieurs minutes : pas de délai d'attente court.
const response = await fetch(LYRIA.endpoint, {
  method: "POST",
  headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
// Réponse brute gardée tout de suite (hors dépôt), avant tout traitement : le morceau est peut-être payé
// et aucune étape suivante (analyse, échantillon, écriture) ne doit pouvoir le faire perdre.
const rawText = await response.text();
const rawPath = `.superpowers/lyria-${track}-raw.json`;
await Bun.write(rawPath, rawText);

let json: unknown;
try {
  json = JSON.parse(rawText);
} catch {
  console.error(`response is not JSON (HTTP ${response.status}). This call may have been billed. Raw response kept in ${rawPath}`);
  process.exit(1);
}
// Échantillon réel de la réponse, audio remplacé par sa longueur : la forme exacte n'était pas connue au plan.
await Bun.write(`assets/lyria-${track}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
if (!response.ok) {
  console.error(`HTTP ${response.status}: see assets/lyria-${track}-response.json, raw response in ${rawPath}`);
  process.exit(1);
}

const audio = findAudio(json);
if (!audio) {
  console.error(`WARNING: HTTP 200 but no audio found. THIS CALL MAY HAVE BEEN BILLED (${LYRIA.costUsd} $) and the ledger was NOT updated: add its line by hand if so.`);
  console.error(`Raw response: ${rawPath} (recover the audio once findAudio is fixed against assets/lyria-${track}-response.json, without a second paid call)`);
  process.exit(1);
}
const output = `public/audio/${track}.${audioExtension(audio.mimeType)}`;
await Bun.write(output, Buffer.from(audio.data, "base64"));

// Ajout d'une seule ligne : jamais de réécriture du fichier depuis une copie lue plus tôt, qui effacerait
// la ligne d'une génération parallèle ou laisserait un fichier tronqué en cas d'arrêt en cours d'écriture.
const entry = { date: new Date().toISOString(), tool: LYRIA.ledgerTool, model: LYRIA.model, prompt, output, costUsd: LYRIA.costUsd };
await mkdir("assets", { recursive: true });
await appendFile(LEDGER, `${JSON.stringify(entry)}\n`);
const total = spentUsd(await readLedger(), LYRIA.ledgerTool);
console.info(`wrote ${output} (${audio.mimeType}) · ledger ${total.toFixed(2)} $`);
if (!output.endsWith(".mp3")) console.warn(`the game loads /audio/${track}.mp3: convert ${output} before playing`);
