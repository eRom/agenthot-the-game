// Génère une image avec Seedream 5.0 Pro via OpenRouter (spec 4.7 et 8). Usage :
//   bun scripts/generate-image.ts <og-background> [--pay] [--overwrite]
// Par défaut c'est un essai à blanc : il affiche la requête et le budget sans rien appeler ni dépenser
// (`--dry-run` reste accepté). Seul `--pay` déclenche un appel réel (0,09 $ en 2K).
// `--overwrite` est nécessaire pour remplacer une image déjà générée dans assets/images/.
// Chaque vraie génération ajoute une ligne à assets/ledger.jsonl, juste après la réponse payée.
import { appendFile, mkdir } from "node:fs/promises";
import { LEDGER_PATH, parseArgs } from "./lyria";
import { type ImageIo, type ImageSpec, SEEDREAM, generateImage } from "./seedream";

// Prompts en anglais. Le fond de l'image de partage est sans texte : le logo et les mots sont posés ensuite avec
// nos polices (scripts/og/og.html, décision du 2026-09-29). Orange seulement sur la menace (spec 6.1).
const IMAGES: Record<string, ImageSpec> = {
  "og-background": {
    prompt: [
      "Wide cinematic key art for a minimalist first-person shooter where time only moves when you move.",
      "A clean white server room with rows of tall off-white server racks, flat-shaded low-poly geometry,",
      "thin black ink outlines, soft shadows.",
      "Time is frozen: three bullets hang in mid-air with glowing orange (#D97757) light trails, and a faceted",
      "crystalline humanoid enemy glowing orange shatters into dozens of sharp shards suspended in the air.",
      "Everything except the enemy and the bullets is white, light gray or black: no other orange anywhere.",
      "Beyond the room, a deep night-blue void (#0D111B).",
      "The left half of the image is calm and dark, fading into the night-blue void, leaving empty space for a title.",
      "No text, no letters, no logos, no watermark.",
    ].join(" "),
    aspectRatio: "2:1",
    resolution: "2K",
  },
};

const USAGE = `usage: bun scripts/generate-image.ts <${Object.keys(IMAGES).join("|")}> [--pay] [--overwrite]  (default: dry run)`;

const args = parseArgs(process.argv.slice(2), IMAGES);
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}

const io: ImageIo = {
  apiKey: process.env.OPENROUTER_API_KEY,
  readLedger: async () => {
    const file = Bun.file(LEDGER_PATH);
    return (await file.exists()) ? await file.text() : "";
  },
  exists: (path) => Bun.file(path).exists(),
  callApi: async (body) => {
    // La clé n'est lue qu'ici : generateImage refuse avant tout appel si elle est absente.
    const response = await fetch(SEEDREAM.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`, "Content-Type": "application/json" },
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
  error: (text) => console.error(text),
};

const result = await generateImage({ name: args.track, spec: IMAGES[args.track]!, pay: args.pay, overwrite: args.overwrite }, io);
process.exit(result.exitCode);
