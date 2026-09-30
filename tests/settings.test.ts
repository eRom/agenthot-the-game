import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SETTING_RANGES,
  type SettingsStorage,
  clampSetting,
  loadSettings,
  saveSettings,
  sanitizeSettings,
} from "../src/settings/settings";

// Faux localStorage, qui peut refuser l'écriture comme un stockage plein ou une navigation privée stricte.
function memoryStorage(initial: Record<string, string> = {}, failWrites = false): SettingsStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      if (failWrites) throw new Error("QuotaExceededError");
      data[key] = value;
    },
  };
}

describe("paramètres (spec 4.5, AC-14)", () => {
  test("premier lancement : les valeurs par défaut de la spec", () => {
    expect(loadSettings(memoryStorage())).toEqual({
      sensitivity: 1,
      invertY: false,
      fov: 90,
      musicVolume: 70,
      sfxVolume: 90,
      quality: "auto",
    });
  });

  test("un réglage enregistré est relu à l'identique au rechargement", () => {
    const storage = memoryStorage();
    const changed = { sensitivity: 2.3, invertY: true, fov: 104, musicVolume: 12, sfxVolume: 55, quality: "low" as const };
    saveSettings(storage, changed);
    expect(loadSettings(storage)).toEqual(changed);
  });

  test("chaque valeur est ramenée dans sa plage et sur son pas", () => {
    expect(clampSetting("sensitivity", 9)).toBe(SETTING_RANGES.sensitivity.max);
    expect(clampSetting("sensitivity", 0)).toBe(SETTING_RANGES.sensitivity.min);
    expect(clampSetting("sensitivity", 1.26)).toBe(1.3);
    expect(clampSetting("fov", 30)).toBe(70);
    expect(clampSetting("fov", 200)).toBe(110);
    expect(clampSetting("musicVolume", -5)).toBe(0);
    expect(clampSetting("sfxVolume", 100.4)).toBe(100);
    expect(clampSetting("fov", Number.NaN)).toBe(DEFAULT_SETTINGS.fov);
  });

  test("JSON abîmé, champ inconnu ou de mauvais type : chaque champ invalide reprend sa valeur par défaut", () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: "{pas du json" }))).toEqual({ ...DEFAULT_SETTINGS });
    const mixed = sanitizeSettings({ sensitivity: "2", invertY: 1, fov: 100, quality: "ultra", extra: true });
    expect(mixed).toEqual({ ...DEFAULT_SETTINGS, fov: 100 });
    expect(sanitizeSettings(null)).toEqual({ ...DEFAULT_SETTINGS });
  });

  test("stockage absent ou qui refuse l'écriture : aucune erreur, les réglages restent ceux de la session", () => {
    expect(loadSettings(null)).toEqual({ ...DEFAULT_SETTINGS });
    const full = memoryStorage({}, true);
    expect(() => saveSettings(full, { ...DEFAULT_SETTINGS, fov: 80 })).not.toThrow();
    expect(() => saveSettings(null, { ...DEFAULT_SETTINGS })).not.toThrow();
  });
});
