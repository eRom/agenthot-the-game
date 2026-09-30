// Paramètres du joueur (spec 4.5) : persistés dans localStorage, appliqués à chaud. Calcul pur, testé avec bun.
import type { QualityMode } from "../render/quality";

export interface Settings {
  // Multiplicateur de la sensibilité de base de la souris.
  sensitivity: number;
  invertY: boolean;
  // Champ de vision vertical, en degrés.
  fov: number;
  // Volumes de 0 à 100.
  musicVolume: number;
  sfxVolume: number;
  quality: QualityMode;
}

// Plages et pas de la spec 4.5 ; le pas sert aux curseurs et aux flèches du clavier.
export const SETTING_RANGES = {
  sensitivity: { min: 0.1, max: 3, step: 0.1 },
  fov: { min: 70, max: 110, step: 1 },
  musicVolume: { min: 0, max: 100, step: 1 },
  sfxVolume: { min: 0, max: 100, step: 1 },
} as const;

export const QUALITY_MODES: readonly QualityMode[] = ["auto", "high", "low"];

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  sensitivity: 1,
  invertY: false,
  fov: 90,
  musicVolume: 70,
  sfxVolume: 90,
  quality: "auto",
};

// Clé versionnée : un format futur incompatible prendra une autre clé au lieu de lire de travers.
export const SETTINGS_KEY = "agenthot.settings.v1";

type NumericSetting = keyof typeof SETTING_RANGES;

// Ramène une valeur dans sa plage, arrondie à son pas (0,1 pour la sensibilité : pas de 1,0000000002).
export function clampSetting(key: NumericSetting, value: number): number {
  const { min, max, step } = SETTING_RANGES[key];
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS[key];
  const stepped = Math.round((Math.min(max, Math.max(min, value)) - min) / step) * step + min;
  return Number(stepped.toFixed(4));
}

// Réglages sûrs à partir de n'importe quoi (JSON d'une ancienne version, main de l'utilisateur, rien) :
// chaque champ absent ou invalide reprend sa valeur par défaut, chaque nombre est ramené dans sa plage.
export function sanitizeSettings(raw: unknown): Settings {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const num = (key: NumericSetting): number => {
    const value = source[key];
    return typeof value === "number" ? clampSetting(key, value) : DEFAULT_SETTINGS[key];
  };
  const quality = source.quality;
  return {
    sensitivity: num("sensitivity"),
    invertY: typeof source.invertY === "boolean" ? source.invertY : DEFAULT_SETTINGS.invertY,
    fov: num("fov"),
    musicVolume: num("musicVolume"),
    sfxVolume: num("sfxVolume"),
    quality: QUALITY_MODES.includes(quality as QualityMode) ? (quality as QualityMode) : DEFAULT_SETTINGS.quality,
  };
}

// Stockage minimal : localStorage dans le navigateur, un faux dans les tests.
export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Lecture sans jamais échouer : stockage absent (navigation privée stricte), refusé, ou JSON abîmé.
export function loadSettings(storage: SettingsStorage | null): Settings {
  try {
    const text = storage?.getItem(SETTINGS_KEY);
    return sanitizeSettings(text ? JSON.parse(text) : null);
  } catch {
    return sanitizeSettings(null);
  }
}

// Écriture sans jamais échouer : un stockage plein ou refusé garde les réglages pour la session en cours.
export function saveSettings(storage: SettingsStorage | null, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Réglages gardés en mémoire seulement.
  }
}

// Cinématique déjà vue (spec 4.2, AC-11) : ensuite, on arrive directement au menu.
export const INTRO_SEEN_KEY = "agenthot.introSeen";

export function readIntroSeen(storage: SettingsStorage | null): boolean {
  try {
    return storage?.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(storage: SettingsStorage | null): void {
  try {
    storage?.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Stockage refusé : la cinématique rejouera à la prochaine visite, rien de plus.
  }
}

// localStorage du navigateur, ou rien s'il est inaccessible (son simple accès peut lever une exception).
export function browserStorage(): SettingsStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
