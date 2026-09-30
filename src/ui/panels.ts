// Panneaux Encre du menu (spec 4.3, 4.5, 6.3) : Salles, Paramètres, Crédits. Échap ou « Retour » les ferme.
import type { RoomEntry } from "../rooms/types";
import { DEFAULT_SETTINGS, QUALITY_MODES, SETTING_RANGES, type Settings, clampSetting } from "../settings/settings";
import { CREDITS, cacheLine, creditsLine, usageLine } from "./credits";
import { EASE, escapeHtml } from "./dom";

export interface PanelHandle {
  close(): void;
}

// Ouvre un panneau Encre dans `slot` : titre, contenu, bouton Retour. `onClose` suit toute fermeture
// (Retour, Échap) ; le son de retour est joué par l'appelant.
export function openPanel(slot: HTMLElement, title: string, body: HTMLElement, onClose: () => void): PanelHandle {
  const panel = document.createElement("div");
  panel.className = "ink-panel menu-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", title);
  panel.innerHTML = `<h2>${escapeHtml(title)}</h2>`;
  panel.appendChild(body);
  const back = document.createElement("button");
  back.type = "button";
  back.className = "ink-button panel-back";
  back.innerHTML = "Retour <small>Échap</small>";
  panel.appendChild(back);
  slot.appendChild(panel);

  let closed = false;
  const onKey = (event: KeyboardEvent): void => {
    if (event.code === "Escape") {
      event.preventDefault();
      close();
    }
  };
  function close(): void {
    if (closed) return;
    closed = true;
    window.removeEventListener("keydown", onKey);
    panel
      .animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(16px)" }], { duration: 150, easing: EASE })
      .finished.then(() => panel.remove());
    onClose();
  }
  back.addEventListener("click", close);
  window.addEventListener("keydown", onKey);

  // Entrée : la plaque glisse de la droite, puis ses lignes arrivent en cascade.
  panel.animate(
    [
      { opacity: 0, transform: "translateX(24px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 220, easing: EASE },
  );
  panel.querySelectorAll<HTMLElement>(".panel-row, .room-card, .panel-back").forEach((row, i) => {
    row.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], {
      duration: 200,
      delay: 90 + i * 40,
      easing: EASE,
      fill: "backwards",
    });
  });
  // Le premier contrôle prend le focus : le panneau se pilote au clavier dès l'ouverture.
  panel.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
  return { close };
}

// Salles : une carte par salle du registre ; une salle verrouillée est affichée « BIENTÔT » et ne se lance pas.
export function roomsBody(rooms: readonly RoomEntry[], onPlay: (room: RoomEntry) => void): HTMLElement {
  const body = document.createElement("div");
  body.className = "room-cards";
  for (const room of rooms) {
    const locked = room.status === "locked";
    const card = document.createElement("button");
    card.type = "button";
    card.className = "room-card";
    card.disabled = locked;
    card.innerHTML = `
      <span class="room-thumb">${room.thumbnail ? `<img src="${room.thumbnail}" alt="" loading="lazy">` : ""}</span>
      <span class="room-title">${escapeHtml(room.title)}</span>
      <small class="room-status">${locked ? "Bientôt" : "Jouable"}</small>`;
    // Vignette absente (pas encore générée) : la carte garde son fond d'encre, sans image cassée.
    card.querySelector("img")?.addEventListener("error", (event) => (event.target as HTMLElement).remove());
    if (!locked) card.addEventListener("click", () => onPlay(room));
    body.appendChild(card);
  }
  return body;
}

// Paramètres (spec 4.5) : appliqués à chaque changement, enregistrés par l'appelant.
export function settingsBody(initial: Settings, onChange: (next: Settings) => void): HTMLElement {
  let current = { ...initial };
  const body = document.createElement("div");
  body.className = "settings-rows";
  const decimal = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const format = {
    sensitivity: (v: number) => decimal.format(v),
    fov: (v: number) => `${v}°`,
    musicVolume: (v: number) => `${v}`,
    sfxVolume: (v: number) => `${v}`,
  };
  const sliders: { key: keyof typeof SETTING_RANGES; label: string }[] = [
    { key: "sensitivity", label: "Sensibilité souris" },
    { key: "fov", label: "Champ de vision" },
    { key: "musicVolume", label: "Volume musique" },
    { key: "sfxVolume", label: "Volume effets" },
  ];
  const update = (patch: Partial<Settings>): void => {
    current = { ...current, ...patch };
    onChange(current);
  };

  for (const { key, label } of sliders) {
    const range = SETTING_RANGES[key];
    const row = document.createElement("label");
    row.className = "panel-row setting-slider";
    row.innerHTML = `
      <span class="setting-label">${label}</span>
      <input type="range" min="${range.min}" max="${range.max}" step="${range.step}" value="${current[key]}">
      <output class="setting-value">${format[key](current[key])}</output>`;
    const input = row.querySelector("input")!;
    const output = row.querySelector("output")!;
    input.addEventListener("input", () => {
      const value = clampSetting(key, Number(input.value));
      output.textContent = format[key](value);
      update({ [key]: value } as Partial<Settings>);
    });
    body.appendChild(row);
  }

  const invert = document.createElement("div");
  invert.className = "panel-row setting-choice";
  invert.innerHTML = `<span class="setting-label">Inverser l'axe Y</span>
    <span class="segmented" role="radiogroup" aria-label="Inverser l'axe Y">
      <button type="button" data-value="false">Non</button><button type="button" data-value="true">Oui</button>
    </span>`;
  body.appendChild(invert);

  const quality = document.createElement("div");
  quality.className = "panel-row setting-choice";
  const names: Record<Settings["quality"], string> = { auto: "Auto", high: "Haute", low: "Basse" };
  quality.innerHTML = `<span class="setting-label">Qualité</span>
    <span class="segmented" role="radiogroup" aria-label="Qualité">
      ${QUALITY_MODES.map((q) => `<button type="button" data-value="${q}">${names[q]}</button>`).join("")}
    </span>`;
  body.appendChild(quality);

  // Groupes à choix : un bouton actif (filet `threat`), clic ou flèches gauche et droite.
  const bindSegmented = (row: HTMLElement, read: () => string, write: (value: string) => void): void => {
    const buttons = [...row.querySelectorAll<HTMLButtonElement>("button")];
    const refresh = (): void => {
      for (const b of buttons) {
        const on = b.dataset.value === read();
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-checked", String(on));
        b.setAttribute("role", "radio");
      }
    };
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => {
        write(b.dataset.value!);
        refresh();
      });
      b.addEventListener("keydown", (event) => {
        if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
        event.preventDefault();
        const next = buttons[(i + (event.code === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length]!;
        next.focus();
        next.click();
      });
    });
    refresh();
  };
  bindSegmented(invert, () => String(current.invertY), (v) => update({ invertY: v === "true" }));
  bindSegmented(quality, () => current.quality, (v) => update({ quality: v as Settings["quality"] }));

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "ink-button panel-row settings-reset";
  reset.innerHTML = "Valeurs par défaut <small>Spec</small>";
  reset.addEventListener("click", () => {
    // Le panneau se reconstruit avec les valeurs par défaut : plus simple que de resynchroniser chaque contrôle.
    update({ ...DEFAULT_SETTINGS });
    const rebuilt = settingsBody(current, onChange);
    body.replaceWith(rebuilt);
    // Le bouton cliqué disparaît avec l'ancien corps : le focus revient sur son remplaçant, pas sur <body>.
    rebuilt.querySelector<HTMLElement>(".settings-reset")?.focus({ preventScroll: true });
  });
  body.appendChild(reset);
  return body;
}

// Crédits (spec 4.3, AC-15) : la ligne exacte, puis les tokens et le coût API estimé.
export function creditsBody(): HTMLElement {
  const body = document.createElement("div");
  body.className = "credits";
  body.innerHTML = `
    <p class="panel-row credits-line">${escapeHtml(creditsLine(CREDITS))}</p>
    <p class="panel-row credits-usage">${escapeHtml(usageLine(CREDITS))}</p>
    <p class="panel-row label credits-note">${escapeHtml(cacheLine(CREDITS))}</p>
    <p class="panel-row label credits-note">Coût API estimé : tokens de toutes les sessions du chantier, au tarif public de l'API.</p>
    <p class="panel-row label credits-note">Polices : Big Shoulders Display, Chakra Petch, Martian Mono (SIL OFL 1.1). Musique : Lyria 3.5.</p>`;
  return body;
}
