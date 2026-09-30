// WebMCP : trois outils en lecture seule pour les agents IA du navigateur (document.modelContext).
// Spec : webmachinelearning.github.io/webmcp (brouillon lu le 2026-09-30) : `execute` rend `Promise<any>` et le
// navigateur met lui-même le résultat en JSON, donc chaque outil rend ses données telles quelles (pas d'enveloppe
// `content` du protocole MCP). Dans Chrome, l'API n'existe qu'avec un jeton d'origin trial ou le drapeau
// chrome://flags/#enable-webmcp-testing. Sans elle, ce module n'est même pas chargé (voir main.ts) : le jeu ne
// paie rien.
import { CONTROLS, creditsInfo, gameInfo } from "./game-facts";

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean };
  execute: () => Promise<unknown>;
}

export interface ModelContext {
  registerTool: (tool: ModelContextTool) => unknown;
}

const NO_INPUT = { type: "object", properties: {}, additionalProperties: false } as const;

export const GAME_TOOLS: readonly ModelContextTool[] = [
  {
    name: "get_game_info",
    description: "AGENTHOT : ce qu'est le jeu, ses règles, ses salles, sa plateforme, son prix et l'adresse de ses sources.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => gameInfo(),
  },
  {
    name: "get_controls",
    description: "Commandes d'AGENTHOT au clavier et à la souris : chaque touche et ce qu'elle fait.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => CONTROLS,
  },
  {
    name: "get_credits",
    description: "Crédits d'AGENTHOT : auteur, modèle utilisé, dépôt des sources, nombre de tokens et coût API estimé.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => creditsInfo(),
  },
];

// L'API telle que le navigateur l'expose, ou null. `navigator.modelContext` est l'ancien nom (avant Chrome 150).
export function findModelContext(doc: object, nav: object): ModelContext | null {
  for (const host of [doc, nav]) {
    const candidate = (host as { modelContext?: Partial<ModelContext> }).modelContext;
    if (typeof candidate?.registerTool === "function") return candidate as ModelContext;
  }
  return null;
}

// Enregistre les outils ; rend le nombre d'outils acceptés. Un refus du navigateur (nom en double, API qui a
// changé) est écrit dans la console et n'arrête ni les autres outils, ni le jeu. Les outils vivent autant que la
// page : pas de signal d'arrêt.
export async function registerGameTools(context: ModelContext): Promise<number> {
  let registered = 0;
  for (const tool of GAME_TOOLS) {
    try {
      // registerTool est synchrone ou rend une promesse, selon la version de Chrome.
      await context.registerTool(tool);
      registered++;
    } catch (error) {
      console.warn(`[agenthot] webmcp: registration failed for ${tool.name}`, error);
    }
  }
  return registered;
}
