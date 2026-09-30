// Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
// Valeurs provisoires : mesure du brief plan 3 (2026-09-29, 13 h 35, chantier en cours). Le plan 3c les remplace
// par le total final (scripts/count-tokens.sh), et remplace XXXXXX par le nom du dépôt choisi par Romain.
export const CREDITS = {
  repoUrl: "https://github.com/eRom/XXXXXX",
  tokens: 118_795_538,
  apiCostUsd: 50.31,
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
