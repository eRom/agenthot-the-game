// Génère un morceau avec Lyria 3.5 (spec 7.2 et 8). Usage :
//   bun scripts/generate-music.ts <game|replay> [--pay] [--overwrite]
// Par défaut c'est un essai à blanc : il affiche la requête et le budget sans rien appeler ni dépenser
// (`--dry-run` reste accepté). Seul `--pay` déclenche un appel réel, facturé 0,08 $.
// `--overwrite` est nécessaire pour remplacer un public/audio/<piste>.mp3 existant : sans lui, le script
// refuse avant d'appeler. Toute autre combinaison d'arguments est refusée (échec fermé).
// Chaque vraie génération ajoute une ligne à assets/ledger.jsonl, juste après la réponse payée.
import { appendFile, mkdir } from "node:fs/promises";
import { LEDGER_PATH, type GenerationIo, LYRIA, generateTrack, parseArgs } from "./lyria";

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

const USAGE = `usage: bun scripts/generate-music.ts <${Object.keys(TRACKS).join("|")}> [--pay] [--overwrite]  (default: dry run)`;

const args = parseArgs(process.argv.slice(2), TRACKS);
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}

const io: GenerationIo = {
  apiKey: process.env.GEMINI_API_KEY,
  readLedger: async () => {
    const file = Bun.file(LEDGER_PATH);
    return (await file.exists()) ? await file.text() : "";
  },
  exists: (path) => Bun.file(path).exists(),
  callApi: async (body) => {
    // La clé n'est lue qu'ici : generateTrack refuse avant tout appel si elle est absente.
    const response = await fetch(LYRIA.endpoint, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  },
  writeFile: async (path, data) => {
    await Bun.write(path, data);
  },
  appendLedgerLine: async (line) => {
    await mkdir("assets", { recursive: true });
    await appendFile(LEDGER_PATH, line);
  },
  now: () => new Date(),
  info: (text) => console.info(text),
  warn: (text) => console.warn(text),
  error: (text) => console.error(text),
};

const result = await generateTrack({ track: args.track, prompt: TRACKS[args.track]!, pay: args.pay, overwrite: args.overwrite }, io);
process.exit(result.exitCode);
