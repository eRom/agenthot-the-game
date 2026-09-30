// Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
// Mesure du 2026-09-30 à 19 h 51, toutes sessions du projet, sous-agents compris :
//   zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*
// `tokens` et `apiCostUsd` viennent de la ligne TOTAL ; `cacheReadTokens`, `cacheReadCostUsd` et `outputTokens` de la
// ligne SPLIT (cache_read, cache_read_cost, output). Les relectures du cache font presque tous les tokens : on le dit.
// À relancer juste avant la mise en ligne : chaque session de plus s'ajoute au total.
export const CREDITS = {
  repoUrl: "https://github.com/eRom/agenthot-the-game",
  tokens: 1_129_844_422,
  apiCostUsd: 443.8,
  cacheReadTokens: 1_097_034_905,
  cacheReadCostUsd: 219.41,
  outputTokens: 4_947_744,
} as const;

export interface CreditsData {
  repoUrl: string;
  tokens: number;
  apiCostUsd: number;
  cacheReadTokens: number;
  cacheReadCostUsd: number;
  outputTokens: number;
}

// Ligne exacte de la spec 4.3 ; `‧` est U+2027. Sans « AGENTHOT » en tête (retiré par Romain le 2026-09-30 : le
// panneau porte déjà le nom, et la ligne tient mieux).
export function creditsLine(data: CreditsData): string {
  return `Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: ${data.repoUrl}`;
}

// « 118 795 538 tokens ‧ coût API estimé : 50,31 $ ». Coût équivalent au tarif public de l'API : Romain paie un
// abonnement, pas ce montant (brief plan 3, section 8), d'où « estimé ».
export function usageLine(data: CreditsData): string {
  const tokens = new Intl.NumberFormat("fr-FR").format(data.tokens);
  const cost = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.apiCostUsd);
  return `${tokens} tokens ‧ coût API estimé : ${cost} $`;
}

// « dont 1 097 034 905 tokens relus en cache (219,41 $) ‧ 4 947 744 tokens produits par les modèles, réflexion comprise ». La précision
// honnête sous le total : le même contexte est relu à chaque tour, les modèles n'ont produit qu'une petite part (la sortie
// compte la réflexion des modèles, que personne ne peut lire).
export function cacheLine(data: CreditsData): string {
  const count = new Intl.NumberFormat("fr-FR");
  const cost = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.cacheReadCostUsd);
  const dot = String.fromCodePoint(0x2027);
  return `dont ${count.format(data.cacheReadTokens)} tokens relus en cache (${cost} $) ${dot} ${count.format(data.outputTokens)} tokens produits par les modèles, réflexion comprise`;
}
