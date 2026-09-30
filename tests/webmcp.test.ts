import { describe, expect, test } from "bun:test";
import { CONTROLS, SITE_URL, creditsInfo, gameInfo } from "../src/app/game-facts";
import { GAME_TOOLS, type ModelContext, type ModelContextTool, findModelContext, registerGameTools } from "../src/app/webmcp";
import { ROOMS } from "../src/rooms/registry";
import { room01 } from "../src/rooms/room-01-datacenter";
import { WEAPON } from "../src/sim/entities";
import { CREDITS, cacheLine } from "../src/ui/credits";

// Ce qu'un agent reçoit en appelant un outil : les données, telles quelles (le navigateur les met en JSON).
async function call(name: string): Promise<unknown> {
  const tool = GAME_TOOLS.find((candidate) => candidate.name === name)!;
  return await tool.execute();
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
      // Règle volontairement plus stricte que le brouillon WebMCP (qui admet aussi "-", "." et les majuscules) :
      // des noms simples, en minuscules, chiffres et tiret bas, 1 à 128 caractères.
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
  });

  test("les salles rendues ont un titre et un statut connu, une par salle du jeu", () => {
    const { rooms } = gameInfo();
    expect(rooms).toHaveLength(ROOMS.length);
    for (const room of rooms) {
      expect(room.title.length).toBeGreaterThan(0);
      expect(["jouable", "à venir"]).toContain(room.status);
    }
  });

  // Garde-fou voulu sur un texte public, pas un instantané : « une salle, cinq ennemis, quatre balles » est écrit à la
  // main dans cinq fichiers. Si l'un de ces deux nombres change dans le jeu, corriger : src/app/game-facts.ts (rules),
  // public/llms.txt, public/llms-full.txt, README.md et le JSON-LD d'index.html.
  test("les faits écrits à la main (cinq ennemis, quatre balles) sont ceux du jeu", () => {
    expect(room01.spawns).toHaveLength(5);
    expect(WEAPON.capacity).toBe(4);
    expect(gameInfo().rules.join(" ")).toContain("cinq ennemis, quatre balles");
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
    expect(credits.cache).toBe(cacheLine(CREDITS));
    expect(credits.cache).toContain("relus en cache");
    const tool = GAME_TOOLS.find((candidate) => candidate.name === "get_credits");
    expect(tool?.description).toContain("part relue en cache et coût API estimé");
  });

  test("chaque résultat se met en JSON et en revient identique, comme le fera le navigateur", async () => {
    for (const tool of GAME_TOOLS) {
      const result = await tool.execute();
      expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    }
  });

  test("aucun texte rendu à un agent ne porte de tiret cadratin", async () => {
    const dash = String.fromCodePoint(0x2014);
    for (const tool of GAME_TOOLS) {
      expect(tool.description.includes(dash)).toBe(false);
      expect(JSON.stringify(await tool.execute()).includes(dash)).toBe(false);
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
