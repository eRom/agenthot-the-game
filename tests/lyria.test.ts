import { describe, expect, test } from "bun:test";
import { LYRIA, audioExtension, canAfford, findAudio, parseArgs, spentUsd, withoutAudioData } from "../scripts/lyria";

const LONG = "A".repeat(1000);

describe("génération musicale : budget (spec 8, AC-17)", () => {
  const ledger = [
    JSON.stringify({ date: "2026-09-29", tool: "lyria", model: "lyria-3.5", prompt: "a", output: "x.mp3", costUsd: 0.08 }),
    "",
    JSON.stringify({ date: "2026-09-29", tool: "seedream", model: "s", prompt: "b", output: "y.png", costUsd: 1.5 }),
    JSON.stringify({ date: "2026-09-29", tool: "lyria", model: "lyria-3.5", prompt: "c", output: "z.mp3", costUsd: 0.08 }),
  ].join("\n");

  test("le total d'un outil ne compte que ses lignes", () => {
    expect(spentUsd(ledger, "lyria")).toBeCloseTo(0.16, 9);
    expect(spentUsd("", "lyria")).toBe(0);
  });

  test("une génération qui ferait dépasser le budget est refusée, celle qui tombe pile est acceptée", () => {
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, LYRIA.budgetUsd)).toBe(true);
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, 0.24)).toBe(true);
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, 0.2)).toBe(false);
  });
});

describe("génération musicale : lecture de la réponse", () => {
  test("trouve l'audio dans la forme de la doc (steps[].content[])", () => {
    const response = {
      status: "completed",
      steps: [
        { type: "model_output", content: [{ type: "text", text: "AGENT HOT" }, { type: "audio", data: LONG, mime_type: "audio/mpeg" }] },
      ],
    };
    expect(findAudio(response)).toEqual({ data: LONG, mimeType: "audio/mpeg" });
  });

  test("trouve aussi l'audio dans la forme generateContent (inlineData)", () => {
    const response = { candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/wav", data: LONG } }] } }] };
    expect(findAudio(response)).toEqual({ data: LONG, mimeType: "audio/wav" });
  });

  test("sans bloc audio, rien n'est trouvé", () => {
    expect(findAudio({ steps: [{ content: [{ type: "text", text: "refused" }] }] })).toBeNull();
    expect(findAudio({ image: { data: LONG, mime_type: "image/png" } })).toBeNull();
  });

  test("l'échantillon gardé remplace l'audio par sa longueur et garde le reste", () => {
    const sample = withoutAudioData({ steps: [{ content: [{ data: LONG, mime_type: "audio/mpeg", sample_rate: 44100 }] }] });
    expect(sample).toEqual({ steps: [{ content: [{ data: "<1000 base64 chars>", mime_type: "audio/mpeg", sample_rate: 44100 }] }] });
  });

  test("un long texte est élidé quel que soit le nom du champ, un texte court reste", () => {
    const sample = withoutAudioData({ result: { audio_bytes: "B".repeat(2000), note: "ok" } });
    expect(sample).toEqual({ result: { audio_bytes: "<2000 base64 chars>", note: "ok" } });
  });

  test("extension de fichier selon le type MIME", () => {
    expect(audioExtension("audio/mpeg")).toBe("mp3");
    expect(audioExtension("audio/wav")).toBe("wav");
    expect(audioExtension("audio/ogg")).toBe("ogg");
  });
});

describe("génération musicale : arguments (échec fermé, aucun appel payant par accident)", () => {
  const tracks = { game: "g", replay: "r" };

  test("une piste seule ou avec --dry-run est acceptée", () => {
    expect(parseArgs(["replay"], tracks)).toEqual({ ok: true, track: "replay", dryRun: false });
    expect(parseArgs(["game", "--dry-run"], tracks)).toEqual({ ok: true, track: "game", dryRun: true });
  });

  test("un drapeau inconnu ou mal orthographié est refusé", () => {
    for (const flag of ["--dryrun", "-n", "--dry-run=true", "--DRY-RUN", ""]) {
      expect(parseArgs(["replay", flag], tracks).ok).toBe(false);
    }
  });

  test("un argument en trop est refusé", () => {
    expect(parseArgs(["replay", "--dry-run", "x"], tracks).ok).toBe(false);
    expect(parseArgs(["replay", "--dry-run", "--dry-run"], tracks).ok).toBe(false);
  });

  test("une piste absente, inconnue ou héritée du prototype est refusée", () => {
    expect(parseArgs([], tracks).ok).toBe(false);
    expect(parseArgs(["menu"], tracks).ok).toBe(false);
    for (const name of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      expect(parseArgs([name], tracks).ok).toBe(false);
    }
  });
});
