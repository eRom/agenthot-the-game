// Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
// Mesure du 2026-09-30 à 18 h 12, toutes sessions du projet, sous-agents compris :
//   zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*
// À relancer juste avant la mise en ligne : chaque session de plus s'ajoute au total.
export const CREDITS = {
  repoUrl: "https://github.com/eRom/agenthot-the-game",
  tokens: 979_282_748,
  apiCostUsd: 384.71,
} as const;

export interface CreditsData {
  repoUrl: string;
  tokens: number;
  apiCostUsd: number;
}

// Ligne exacte de la spec 4.3 ; `‧` est U+2027.
export function creditsLine(data: CreditsData): string {
  return `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: ${data.repoUrl}`;
}

// « 118 795 538 tokens ‧ coût API estimé : 50,31 $ ». Coût équivalent au tarif public de l'API : Romain paie un
// abonnement, pas ce montant (brief plan 3, section 8), d'où « estimé ».
export function usageLine(data: CreditsData): string {
  const tokens = new Intl.NumberFormat("fr-FR").format(data.tokens);
  const cost = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.apiCostUsd);
  return `${tokens} tokens ‧ coût API estimé : ${cost} $`;
}
