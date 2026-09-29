// Le son suit le temps (spec 7.1) : conversions pures de timeScale vers les réglages audio.
// Testées avec bun ; le graphe Web Audio (audio-engine.ts) les applique à chaque image.

export const AUDIO_TIME = {
  cutoffMin: 300,
  cutoffSpan: 19_700,
  // Plafond de la coupure de la musique de jeu (Hz) : même à pleine vitesse, elle reste sourde sous les
  // bruitages. Choix de Romain à l'essai de la tâche 9 (2026-09-29) : « Musique plus discrète ».
  gameMusicCutoffMax: 2500,
  sfxRateMin: 0.2,
  musicRateMin: 0.5,
  // Drone d'ambiance : volume en mouvement, et volume ajouté quand le joueur s'immobilise.
  droneBase: 0.05,
  droneStillBoost: 0.25,
  // Constante de temps (s) des rampes de paramètres : assez courte pour suivre le temps, sans clics.
  rampTime: 0.03,
} as const;

// Fréquence de coupure du passe-bas des SFX : 300 + 19 700 × timeScale² Hz (la musique de jeu : gameMusicCutoff).
export function lowpassCutoff(timeScale: number): number {
  return AUDIO_TIME.cutoffMin + AUDIO_TIME.cutoffSpan * timeScale * timeScale;
}

// Coupure de la musique de jeu : la courbe des SFX, plafonnée à gameMusicCutoffMax (identique au ralenti).
export function gameMusicCutoff(timeScale: number): number {
  return Math.min(AUDIO_TIME.gameMusicCutoffMax, lowpassCutoff(timeScale));
}

// Débit de lecture des SFX : clamp(0,2, 1, timeScale).
export function sfxRate(timeScale: number): number {
  return Math.min(1, Math.max(AUDIO_TIME.sfxRateMin, timeScale));
}

// Débit de la musique en jeu : clamp(0,5, 1, timeScale), sans correction de hauteur (elle descend).
export function musicRate(timeScale: number): number {
  return Math.min(1, Math.max(AUDIO_TIME.musicRateMin, timeScale));
}

// Volume du drone : il monte quand le joueur s'immobilise (timeScale bas).
export function droneGain(timeScale: number): number {
  const still = 1 - Math.min(1, Math.max(0, timeScale));
  return AUDIO_TIME.droneBase + AUDIO_TIME.droneStillBoost * still;
}
