// Génère un morceau avec Lyria 3.5 (spec 7.2 et 8). Usage :
//   bun scripts/generate-music.ts <game|replay> [--dry-run]
// --dry-run affiche la requête et le budget sans rien appeler ni dépenser.
// Chaque vraie génération coûte 0,08 $ et ajoute une ligne à assets/ledger.jsonl.
import { LYRIA, audioExtension, canAfford, findAudio, spentUsd, withoutAudioData } from "./lyria";

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

const [track, flag] = process.argv.slice(2);
const prompt = track ? TRACKS[track] : undefined;
if (!track || !prompt) {
  console.error(`usage: bun scripts/generate-music.ts <${Object.keys(TRACKS).join("|")}> [--dry-run]`);
  process.exit(1);
}

const ledgerFile = Bun.file(LEDGER);
const ledgerText = (await ledgerFile.exists()) ? await ledgerFile.text() : "";
const spent = spentUsd(ledgerText, LYRIA.ledgerTool);
if (!canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) {
  console.error(`budget exceeded: ${spent.toFixed(2)} $ spent + ${LYRIA.costUsd} $ > ${LYRIA.budgetUsd} $. Ask Romain.`);
  process.exit(2);
}

const body = { model: LYRIA.model, input: prompt, response_format: { type: "audio" } };
console.info(`track ${track} · spent ${spent.toFixed(2)} $ of ${LYRIA.budgetUsd} $ · this call ${LYRIA.costUsd} $`);
if (flag === "--dry-run") {
  console.info(JSON.stringify(body, null, 2));
  process.exit(0);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

// La génération est synchrone et peut prendre plusieurs minutes : pas de délai d'attente court.
const response = await fetch(LYRIA.endpoint, {
  method: "POST",
  headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = (await response.json()) as unknown;
// Échantillon réel de la réponse, audio remplacé par sa longueur : la forme exacte n'était pas connue au plan.
await Bun.write(`assets/lyria-${track}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
  process.exit(1);
}

const audio = findAudio(json);
if (!audio) {
  // Le morceau est peut-être payé : on garde la réponse complète (hors dépôt) pour le récupérer
  // une fois findAudio corrigé contre l'échantillon, sans payer un second appel.
  await Bun.write(`.superpowers/lyria-${track}-raw.json`, JSON.stringify(json));
  console.error(`no audio found: see assets/lyria-${track}-response.json, raw response in .superpowers/`);
  process.exit(1);
}
const output = `public/audio/${track}.${audioExtension(audio.mimeType)}`;
await Bun.write(output, Buffer.from(audio.data, "base64"));

const entry = { date: new Date().toISOString(), tool: LYRIA.ledgerTool, model: LYRIA.model, prompt, output, costUsd: LYRIA.costUsd };
await Bun.write(LEDGER, `${ledgerText}${JSON.stringify(entry)}\n`);
console.info(`wrote ${output} (${audio.mimeType}) · ledger ${(spent + LYRIA.costUsd).toFixed(2)} $`);
if (!output.endsWith(".mp3")) console.warn(`the game loads /audio/${track}.mp3: convert ${output} before playing`);
