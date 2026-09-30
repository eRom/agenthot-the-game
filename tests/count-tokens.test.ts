import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Usage {
  input: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  output: number;
}

// Une ligne de transcript « assistant » au format de Claude Code.
function assistantLine(id: string, model: string, usage: Usage): string {
  return JSON.stringify({
    type: "assistant",
    message: {
      id,
      model,
      usage: {
        input_tokens: usage.input,
        cache_creation: {
          ephemeral_5m_input_tokens: usage.cacheWrite5m,
          ephemeral_1h_input_tokens: usage.cacheWrite1h,
        },
        cache_read_input_tokens: usage.cacheRead,
        output_tokens: usage.output,
      },
    },
  });
}

function run(folder: string): { code: number; lines: string[] } {
  const result = Bun.spawnSync(["zsh", "scripts/count-tokens.sh", folder]);
  return { code: result.exitCode, lines: result.stdout.toString().trim().split("\n") };
}

const M = 1_000_000;
let root = "";
let priced = "";
let unpriced = "";

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "count-tokens-"));

  // Transcripts fictifs, chiffrés en millions pour que le coût se vérifie de tête.
  priced = join(root, "priced");
  mkdirSync(join(priced, "session-a", "subagents"), { recursive: true });
  mkdirSync(join(priced, "memory"), { recursive: true });
  writeFileSync(
    join(priced, "session-a.jsonl"),
    [
      // m1 écrit sur deux lignes (une par bloc) : on ne compte qu'une fois, avec le plus grand output_tokens.
      assistantLine("m1", "claude-opus-5-5", { input: 1 * M, cacheWrite5m: 1 * M, cacheWrite1h: 0, cacheRead: 10 * M, output: 1 }),
      assistantLine("m1", "claude-opus-5-5", { input: 1 * M, cacheWrite5m: 1 * M, cacheWrite1h: 0, cacheRead: 10 * M, output: 500_000 }),
      assistantLine("m2", "claude-opus-5-5", { input: 2 * M, cacheWrite5m: 0, cacheWrite1h: 1 * M, cacheRead: 20 * M, output: 250_000 }),
      // Ligne « <synthetic> » : jamais facturée, donc ignorée.
      assistantLine("m-synthetic", "<synthetic>", { input: 999 * M, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 999 * M, output: 999 * M }),
    ].join("\n") + "\n",
  );
  // Un fichier de sous-agent : compté.
  writeFileSync(
    join(priced, "session-a", "subagents", "agent-1.jsonl"),
    assistantLine("m3", "claude-sonnet-5-5", { input: 3 * M, cacheWrite5m: 1 * M, cacheWrite1h: 0, cacheRead: 30 * M, output: 100_000 }) + "\n",
  );
  // Un fichier sous memory/ : ignoré.
  writeFileSync(
    join(priced, "memory", "notes.jsonl"),
    assistantLine("m-memory", "claude-opus-5-5", { input: 999 * M, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 999 * M, output: 999 * M }) + "\n",
  );

  // Un modèle sans prix connu.
  unpriced = join(root, "unpriced");
  mkdirSync(unpriced, { recursive: true });
  writeFileSync(
    join(unpriced, "session-b.jsonl"),
    assistantLine("u1", "claude-unknown-1", { input: 10, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 100, output: 5 }) + "\n",
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("scripts/count-tokens.sh", () => {
  test("une ligne par modèle : messages dédoublonnés par id, sous-agents comptés, synthetic et memory ignorés", () => {
    const { code, lines } = run(priced);
    expect(code).toBe(0);
    // Opus : m1 (output le plus grand des deux lignes, 500 000) + m2. Cost = 3*4 + 1*5 + 1*8 + 30*0,20 + 0,75*20 = 46.
    expect(lines).toContain(
      "claude-opus-5-5 msgs=2 in=3000000 cw5m=1000000 cw1h=1000000 cr=30000000 out=750000 total=35750000 cost=$46.00",
    );
    // Sonnet (fichier de sous-agent) : 3*2 + 1*2,50 + 30*0,20 + 0,1*10 = 15,50.
    expect(lines).toContain(
      "claude-sonnet-5-5 msgs=1 in=3000000 cw5m=1000000 cw1h=0 cr=30000000 out=100000 total=34100000 cost=$15.50",
    );
  });

  test("la ligne TOTAL porte tous les tokens et tout le coût", () => {
    const { lines } = run(priced);
    expect(lines).toContain("TOTAL tokens=69850000 cost=$61.50");
  });

  test("la ligne SPLIT suit TOTAL : entrée, écritures en cache, relectures, sortie et coût des relectures", () => {
    const { lines } = run(priced);
    // Relectures : 60 M tokens, 60 * 0,20 = 12 $. Les quatre parts font bien les 69 850 000 du TOTAL.
    const split = "SPLIT input=6000000 cache_write=3000000 cache_read=60000000 output=850000 cache_read_cost=$12.00";
    expect(lines).toContain(split);
    expect(lines[lines.indexOf("TOTAL tokens=69850000 cost=$61.50") + 1]).toBe(split);
  });

  test("un modèle sans prix fait échouer le script avec le code 3", () => {
    const { code, lines } = run(unpriced);
    expect(code).toBe(3);
    expect(lines.some((line) => line.startsWith("claude-unknown-1 : pas de prix connu"))).toBe(true);
  });
});
