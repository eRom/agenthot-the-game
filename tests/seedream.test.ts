import { describe, expect, test } from "bun:test";
import { type ImageIo, SEEDREAM, billedCost, findImage, generateImage, imageExtension, seedreamBody } from "../scripts/seedream";

const LONG = "B".repeat(1000);
const SPEC = { prompt: "p", aspectRatio: "2:1", resolution: "2K" } as const;

describe("images Seedream : requête et réponse (brief plan 3, section 2)", () => {
  test("le corps suit la sonde du modèle : une image, ratio et résolution en clair", () => {
    expect(seedreamBody(SPEC)).toEqual({ model: "bytedance-seed/seedream-5-0-pro", prompt: "p", n: 1, aspect_ratio: "2:1", resolution: "2K" });
  });

  test("trouve l'image dans la forme de la doc (data[0].b64_json + media_type)", () => {
    const response = { created: 1, data: [{ b64_json: LONG, media_type: "image/jpeg" }], usage: { cost: 0.09 } };
    expect(findImage(response)).toEqual({ data: LONG, mimeType: "image/jpeg" });
  });

  test("sans type annoncé, l'image est lue comme du PNG ; sans image, rien n'est trouvé", () => {
    expect(findImage({ data: [{ b64_json: LONG }] })).toEqual({ data: LONG, mimeType: "image/png" });
    expect(findImage({ error: { code: 402, message: "Insufficient credits" } })).toBeNull();
  });

  test("le coût du journal est celui annoncé par OpenRouter, sinon celui de la grille", () => {
    expect(billedCost({ usage: { cost: 0.0875 } }, "2K")).toBe(0.0875);
    expect(billedCost({ usage: {} }, "2K")).toBe(SEEDREAM.costUsd["2K"]);
    expect(billedCost({ usage: { cost: -1 } }, "1K")).toBe(SEEDREAM.costUsd["1K"]);
    expect(billedCost(null, "1K")).toBe(SEEDREAM.costUsd["1K"]);
  });

  test("extension de fichier selon le type MIME", () => {
    expect(imageExtension("image/jpeg")).toBe("jpg");
    expect(imageExtension("image/webp")).toBe("webp");
    expect(imageExtension("image/png")).toBe("png");
  });
});

// Faux client : aucune API, aucun disque. Il note chaque opération dans l'ordre où elle arrive.
describe("images Seedream : garde-fous avant un appel payant", () => {
  const IMAGE_RESPONSE = JSON.stringify({ data: [{ b64_json: "QUJD", media_type: "image/png" }], usage: { cost: 0.09 } });
  const OK = { status: 200, ok: true, text: IMAGE_RESPONSE };
  // Chemin de la réponse brute pour l'horloge figée du faux client (2026-09-30T12:00:00Z), « : » et « . » remplacés.
  const RAW_PATH = ".superpowers/seedream-og-background-raw-2026-09-30T12-00-00-000Z.json";
  const OPTIONS = { name: "og-background", spec: SPEC, pay: true, overwrite: false };

  function fakeIo(over: { response?: { status: number; ok: boolean; text: string }; existing?: string[]; ledger?: string; apiKey?: string | undefined } = {}) {
    const events: string[] = [];
    const ledger: string[] = over.ledger ? [over.ledger] : [];
    const existing = new Set(over.existing ?? []);
    const io: ImageIo = {
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
      now: () => new Date("2026-09-30T12:00:00Z"),
      info: () => {},
      error: () => {},
    };
    return { io, events, ledger };
  }

  test("sans --pay, aucun appel, aucune écriture", async () => {
    const { io, events } = fakeIo();
    expect(await generateImage({ ...OPTIONS, pay: false }, io)).toEqual({ outcome: "dry-run", exitCode: 0 });
    expect(events).toEqual([]);
  });

  test("une image déjà là, quel que soit son format, bloque l'appel sans --overwrite", async () => {
    for (const path of ["assets/images/og-background.png", "assets/images/og-background.jpg"]) {
      const { io, events } = fakeIo({ existing: [path] });
      expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "exists", exitCode: 1 });
      expect(events).toEqual([]);
    }
  });

  test("avec --overwrite, une image déjà là n'empêche plus l'appel", async () => {
    const { io, events } = fakeIo({ existing: ["assets/images/og-background.png"] });
    expect((await generateImage({ ...OPTIONS, overwrite: true }, io)).outcome).toBe("written");
    expect(events[0]).toBe("call");
  });

  test("le journal est complété juste après la réponse payée, avec le coût réel, avant toute écriture", async () => {
    const { io, events, ledger } = fakeIo();
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "written", exitCode: 0 });
    expect(events.slice(0, 2)).toEqual(["call", "ledger"]);
    expect(events.slice(2).every((e) => e.startsWith("write:"))).toBe(true);
    expect(events).toContain("write:assets/images/og-background.png");
    expect(JSON.parse(ledger[0]!)).toMatchObject({ tool: "seedream", model: SEEDREAM.model, costUsd: 0.09, output: "assets/images/og-background.png" });
  });

  test("une réponse 200 sans image est journalisée avant toute écriture, avec la réponse brute comme sortie", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 200, ok: true, text: JSON.stringify({ data: [] }) } });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "no-image", exitCode: 1 });
    expect(events.slice(0, 2)).toEqual(["call", "ledger"]);
    expect(JSON.parse(ledger[0]!).output).toBe(RAW_PATH);
  });

  test("une erreur HTTP (402, 429, 502) n'est pas facturée : pas de ligne, la réponse brute est gardée", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 402, ok: false, text: JSON.stringify({ error: { code: 402, message: "no credit" } }) } });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "http-error", exitCode: 1 });
    expect(ledger).toEqual([]);
    expect(events).toContain(`write:${RAW_PATH}`);
  });

  test("un journal qui ne se laisse pas écrire n'empêche pas de garder la réponse payée", async () => {
    const { io, events } = fakeIo();
    io.appendLedgerLine = async () => {
      throw new Error("disk full");
    };
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "ledger-failed", exitCode: 1 });
    expect(events).toContain(`write:${RAW_PATH}`);
  });

  test("un budget dépassé refuse avant l'appel", async () => {
    const line = `${JSON.stringify({ date: "d", tool: "seedream", model: "m", prompt: "p", output: "o", costUsd: 2.95 })}\n`;
    const { io, events } = fakeIo({ ledger: line });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "over-budget", exitCode: 2 });
    expect(events).toEqual([]);
  });

  test("deux appels à des instants différents écrivent deux réponses brutes différentes", async () => {
    const noImage = { status: 200, ok: true, text: JSON.stringify({ data: [] }) };
    const paths: string[] = [];
    for (const iso of ["2026-09-30T12:00:00Z", "2026-09-30T12:05:30Z"]) {
      const { io, events } = fakeIo({ response: noImage });
      io.now = () => new Date(iso);
      await generateImage(OPTIONS, io);
      paths.push(...events.filter((e) => e.startsWith("write:.superpowers/")));
    }
    expect(paths).toEqual([
      "write:.superpowers/seedream-og-background-raw-2026-09-30T12-00-00-000Z.json",
      "write:.superpowers/seedream-og-background-raw-2026-09-30T12-05-30-000Z.json",
    ]);
  });

  test("sans clé d'API, aucun appel", async () => {
    const { io, events } = fakeIo({ apiKey: undefined });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "no-api-key", exitCode: 1 });
    expect(events).toEqual([]);
  });
});
