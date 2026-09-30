import { describe, expect, test } from "bun:test";
import {
  type ApiResponse,
  type GenerationIo,
  LYRIA,
  audioExtension,
  canAfford,
  findAudio,
  generateTrack,
  parseArgs,
  spentUsd,
  withoutAudioData,
} from "../scripts/lyria";

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

  test("sans --pay, la piste seule est un essai à blanc ; --dry-run est accepté et donne la même chose", () => {
    expect(parseArgs(["replay"], tracks)).toEqual({ ok: true, track: "replay", pay: false, overwrite: false });
    expect(parseArgs(["game", "--dry-run"], tracks)).toEqual({ ok: true, track: "game", pay: false, overwrite: false });
  });

  test("--pay est le seul chemin payant, --overwrite se combine dans n'importe quel ordre", () => {
    expect(parseArgs(["replay", "--pay"], tracks)).toEqual({ ok: true, track: "replay", pay: true, overwrite: false });
    expect(parseArgs(["replay", "--pay", "--overwrite"], tracks)).toEqual({ ok: true, track: "replay", pay: true, overwrite: true });
    expect(parseArgs(["replay", "--overwrite", "--pay"], tracks)).toEqual({ ok: true, track: "replay", pay: true, overwrite: true });
  });

  test("--pay et --dry-run ensemble se contredisent : refusés", () => {
    expect(parseArgs(["replay", "--pay", "--dry-run"], tracks).ok).toBe(false);
    expect(parseArgs(["replay", "--dry-run", "--pay"], tracks).ok).toBe(false);
  });

  test("un drapeau inconnu ou mal orthographié est refusé", () => {
    for (const flag of ["--dryrun", "-n", "--dry-run=true", "--DRY-RUN", "--PAY", "--pay=true", "-p", "--overwrite=1", ""]) {
      expect(parseArgs(["replay", flag], tracks).ok).toBe(false);
    }
  });

  test("un argument en trop ou répété est refusé", () => {
    expect(parseArgs(["replay", "--dry-run", "x"], tracks).ok).toBe(false);
    expect(parseArgs(["replay", "--dry-run", "--dry-run"], tracks).ok).toBe(false);
    expect(parseArgs(["replay", "--pay", "--pay"], tracks).ok).toBe(false);
    expect(parseArgs(["replay", "--pay", "--overwrite", "--overwrite"], tracks).ok).toBe(false);
  });

  test("une piste absente, inconnue ou héritée du prototype est refusée", () => {
    expect(parseArgs([], tracks).ok).toBe(false);
    expect(parseArgs(["menu"], tracks).ok).toBe(false);
    for (const name of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      expect(parseArgs([name], tracks).ok).toBe(false);
    }
  });
});

// Faux client : aucune API, aucun disque. Il note chaque opération dans l'ordre où elle arrive.
describe("génération musicale : garde-fous avant un appel payant (plan 2, correctif 6)", () => {
  const AUDIO_RESPONSE = JSON.stringify({ steps: [{ content: [{ type: "audio", data: "QUJDREVG", mime_type: "audio/mpeg" }] }] });
  const OK: ApiResponse = { status: 200, ok: true, text: AUDIO_RESPONSE };
  const OPTIONS = { track: "game", prompt: "p", pay: true, overwrite: false };

  function fakeIo(over: { response?: ApiResponse; existing?: string[]; ledger?: string; apiKey?: string | undefined } = {}) {
    const events: string[] = [];
    const ledger: string[] = over.ledger ? [over.ledger] : [];
    const existing = new Set(over.existing ?? []);
    const io: GenerationIo = {
      apiKey: "apiKey" in over ? over.apiKey : "fake-key",
      readLedger: async () => ledger.join(""),
      exists: async (path) => existing.has(path),
      callApi: async () => {
        events.push("call");
        return over.response ?? OK;
      },
      writeFile: async (path) => {
        events.push(`write:${path}`);
      },
      appendLedgerLine: async (line) => {
        events.push("ledger");
        ledger.push(line);
      },
      now: () => new Date("2026-09-29T12:00:00Z"),
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    return { io, events, ledger };
  }

  test("sans --pay, aucun appel, aucune écriture", async () => {
    const { io, events } = fakeIo();
    const result = await generateTrack({ ...OPTIONS, pay: false }, io);
    expect(result).toEqual({ outcome: "dry-run", exitCode: 0 });
    expect(events).toEqual([]);
  });

  test("avec --pay mais un fichier déjà là et sans --overwrite : refus avant l'appel", async () => {
    const { io, events, ledger } = fakeIo({ existing: ["src/audio/tracks/game.mp3"] });
    const result = await generateTrack(OPTIONS, io);
    expect(result).toEqual({ outcome: "exists", exitCode: 1 });
    expect(events).toEqual([]);
    expect(ledger).toEqual([]);
  });

  test("avec --pay et --overwrite, un fichier déjà là n'empêche plus l'appel", async () => {
    const { io, events } = fakeIo({ existing: ["src/audio/tracks/game.mp3"] });
    const result = await generateTrack({ ...OPTIONS, overwrite: true }, io);
    expect(result.outcome).toBe("written");
    expect(events[0]).toBe("call");
  });

  test("un fichier existant d'une autre piste n'empêche pas l'appel", async () => {
    const { io, events } = fakeIo({ existing: ["src/audio/tracks/replay.mp3"] });
    expect((await generateTrack(OPTIONS, io)).outcome).toBe("written");
    expect(events[0]).toBe("call");
  });

  test("le journal est complété juste après la réponse payée, avant toute écriture de fichier", async () => {
    const { io, events, ledger } = fakeIo();
    const result = await generateTrack(OPTIONS, io);
    expect(result).toEqual({ outcome: "written", exitCode: 0 });
    // Appel, puis journal, puis seulement les fichiers (réponse brute, échantillon, audio).
    expect(events[0]).toBe("call");
    expect(events[1]).toBe("ledger");
    expect(events.slice(2).every((e) => e.startsWith("write:"))).toBe(true);
    expect(events.filter((e) => e.startsWith("write:")).length).toBe(3);
    expect(events).toContain("write:src/audio/tracks/game.mp3");
    const entry = JSON.parse(ledger[0]!);
    expect(entry).toMatchObject({ tool: "lyria", model: LYRIA.model, costUsd: LYRIA.costUsd, output: "src/audio/tracks/game.mp3" });
  });

  test("une réponse 200 sans audio (appel probablement facturé) est journalisée avant toute écriture", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 200, ok: true, text: JSON.stringify({ steps: [] }) } });
    const result = await generateTrack(OPTIONS, io);
    expect(result).toEqual({ outcome: "no-audio", exitCode: 1 });
    expect(events[0]).toBe("call");
    expect(events[1]).toBe("ledger");
    expect(events.some((e) => e === "write:src/audio/tracks/game.mp3")).toBe(false);
    // La sortie journalisée est la réponse brute, seul endroit où se trouve le produit payé.
    expect(JSON.parse(ledger[0]!).output).toBe(".superpowers/lyria-game-raw.json");
  });

  test("une réponse 200 qui n'est pas du JSON est journalisée avant toute écriture", async () => {
    const { io, events } = fakeIo({ response: { status: 200, ok: true, text: "<html>" } });
    expect((await generateTrack(OPTIONS, io)).outcome).toBe("not-json");
    expect(events.slice(0, 2)).toEqual(["call", "ledger"]);
  });

  test("une erreur HTTP n'est pas facturée : pas de ligne de journal, la réponse brute est gardée", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 500, ok: false, text: JSON.stringify({ error: "boom" }) } });
    const result = await generateTrack(OPTIONS, io);
    expect(result).toEqual({ outcome: "http-error", exitCode: 1 });
    expect(ledger).toEqual([]);
    expect(events).toContain("write:.superpowers/lyria-game-raw.json");
  });

  test("un journal qui ne se laisse pas écrire n'empêche pas de garder la réponse payée", async () => {
    const { io, events } = fakeIo();
    io.appendLedgerLine = async () => {
      throw new Error("disk full");
    };
    const result = await generateTrack(OPTIONS, io);
    expect(result).toEqual({ outcome: "ledger-failed", exitCode: 1 });
    expect(events).toContain("write:.superpowers/lyria-game-raw.json");
  });

  test("un budget dépassé refuse avant l'appel", async () => {
    const line = `${JSON.stringify({ date: "d", tool: "lyria", model: "m", prompt: "p", output: "o", costUsd: LYRIA.budgetUsd })}\n`;
    const { io, events } = fakeIo({ ledger: line });
    expect(await generateTrack(OPTIONS, io)).toEqual({ outcome: "over-budget", exitCode: 2 });
    expect(events).toEqual([]);
  });

  test("sans clé d'API, aucun appel", async () => {
    const { io, events } = fakeIo({ apiKey: undefined });
    expect(await generateTrack(OPTIONS, io)).toEqual({ outcome: "no-api-key", exitCode: 1 });
    expect(events).toEqual([]);
  });

  test("un morceau de la cinématique s'écrit dans son dossier, hors de ce que le jeu sert (plan 3b)", async () => {
    const { io, events, ledger } = fakeIo();
    const intro = { ...OPTIONS, track: "intro", dir: "assets/audio" };
    expect(await generateTrack(intro, io)).toEqual({ outcome: "written", exitCode: 0 });
    expect(events).toContain("write:assets/audio/intro.mp3");
    expect(events.some((e) => e.startsWith("write:src/audio/tracks/"))).toBe(false);
    expect(JSON.parse(ledger[0]!).output).toBe("assets/audio/intro.mp3");
  });

  test("le fichier existant est cherché dans le dossier du morceau", async () => {
    const intro = { ...OPTIONS, track: "intro", dir: "assets/audio" };
    const { io, events } = fakeIo({ existing: ["assets/audio/intro.mp3"] });
    expect(await generateTrack(intro, io)).toEqual({ outcome: "exists", exitCode: 1 });
    expect(events).toEqual([]);
  });
});
