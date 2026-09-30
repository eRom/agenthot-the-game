import { describe, expect, test } from "bun:test";
import { CONTROLS, SITE_URL, creditsInfo, gameInfo } from "../src/app/game-facts";
import { GAME_TOOLS, type ModelContext, type ModelContextTool, findModelContext, registerGameTools } from "../src/app/webmcp";
import { CREDITS } from "../src/ui/credits";

// Ce qu'un agent reçoit en appelant un outil : le texte JSON du premier bloc.
async function call(name: string): Promise<unknown> {
  const tool = GAME_TOOLS.find((candidate) => candidate.name === name)!;
  const result = await tool.execute();
  expect(result.content).toHaveLength(1);
  return JSON.parse(result.content[0]!.text);
}

// Un navigateur qui garde les outils reçus ; `refuse` fait échouer l'enregistrement d'un nom.
function fakeContext(refuse?: string): { context: ModelContext; names: string[] } {
  const names: string[] = [];
  const context: ModelContext = {
    registerTool(tool: ModelContextTool) {
      if (tool.name === refuse) throw new Error("duplicate tool");
      names.push(tool.name);
    },
  };
  return { context, names };
}

describe("outils WebMCP (lecture seule)", () => {
  test("chaque outil a un nom valide et unique, une description, un schéma sans entrée, et se dit en lecture seule", () => {
    const names = GAME_TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of GAME_TOOLS) {
      // Spec WebMCP : nom de 1 à 128 caractères, lettres, chiffres, tiret bas.
      expect(tool.name).toMatch(/^[a-z0-9_]{1,128}$/);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema).toEqual({ type: "object", properties: {}, additionalProperties: false });
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });

  test("get_game_info dit où jouer, que c'est gratuit, et où sont les sources", async () => {
    expect(await call("get_game_info")).toEqual(gameInfo());
    const info = gameInfo();
    expect(info.url).toBe(SITE_URL);
    expect(info.sources).toBe(CREDITS.repoUrl);
    expect(info.rooms[0]).toEqual({ title: "Salle serveurs", status: "jouable" });
    expect(info.rooms.some((room) => room.status === "à venir")).toBe(true);
  });

  test("get_controls rend chaque commande avec sa touche et son effet", async () => {
    const controls = (await call("get_controls")) as { input: string; action: string }[];
    expect(controls).toEqual([...CONTROLS]);
    expect(controls.find((control) => control.input === "Clic droit")?.action).toBe("Lancer l'arme");
    for (const control of controls) expect(control.input.length > 0 && control.action.length > 0).toBe(true);
  });

  test("get_credits rend la ligne des crédits et le compte affichés dans le jeu", async () => {
    const credits = (await call("get_credits")) as ReturnType<typeof creditsInfo>;
    expect(credits).toEqual(creditsInfo());
    expect(credits.line).toContain("Made with: Claude Opus 5.5");
    expect(credits.usage).toContain("coût API estimé");
  });

  test("aucun texte rendu à un agent ne porte de tiret cadratin", async () => {
    const dash = String.fromCodePoint(0x2014);
    for (const tool of GAME_TOOLS) {
      expect(tool.description.includes(dash)).toBe(false);
      expect((await tool.execute()).content[0]!.text.includes(dash)).toBe(false);
    }
  });
});

describe("branchement WebMCP", () => {
  test("l'API se trouve sur document, sinon sur navigator (ancien nom), sinon nulle part", () => {
    const api = { registerTool: () => undefined };
    expect(findModelContext({ modelContext: api }, {})).toBe(api);
    expect(findModelContext({}, { modelContext: api })).toBe(api);
    expect(findModelContext({}, {})).toBeNull();
    // Un objet sans registerTool n'est pas l'API.
    expect(findModelContext({ modelContext: {} }, {})).toBeNull();
  });

  test("tous les outils sont enregistrés, dans l'ordre", async () => {
    const { context, names } = fakeContext();
    expect(await registerGameTools(context)).toBe(GAME_TOOLS.length);
    expect(names).toEqual(GAME_TOOLS.map((tool) => tool.name));
  });

  test("un outil refusé par le navigateur n'empêche pas les autres", async () => {
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => void warnings.push(args[0]);
    try {
      const { context, names } = fakeContext("get_controls");
      expect(await registerGameTools(context)).toBe(GAME_TOOLS.length - 1);
      expect(names).toEqual(["get_game_info", "get_credits"]);
      expect(warnings).toEqual(["[agenthot] webmcp: registration failed for get_controls"]);
    } finally {
      console.warn = warn;
    }
  });

  test("une API qui rend une promesse rejetée est traitée comme un refus", async () => {
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      const context: ModelContext = { registerTool: () => Promise.reject(new Error("not allowed")) };
      expect(await registerGameTools(context)).toBe(0);
    } finally {
      console.warn = warn;
    }
  });
});
