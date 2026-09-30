// Ce que le jeu dit de lui-même à un agent IA (outils WebMCP, src/app/webmcp.ts). Données pures, en lecture seule.
// Les mêmes faits sont écrits pour les robots dans public/llms.txt et dans le JSON-LD d'index.html : un changement
// ici se reporte là-bas.
import { ROOMS } from "../rooms/registry";
import { CREDITS, cacheLine, creditsLine, usageLine } from "../ui/credits";

export const SITE_URL = "https://agenthot.erom.cloud/";

export interface GameInfo {
  name: string;
  url: string;
  pitch: string;
  genre: string;
  price: string;
  language: string;
  platform: string;
  rules: string[];
  rooms: { title: string; status: string }[];
  madeWith: string;
  sources: string;
}

export function gameInfo(): GameInfo {
  return {
    name: "AGENTHOT",
    url: SITE_URL,
    pitch: "Un FPS dans le navigateur où le temps n'avance que quand tu bouges.",
    genre: "Jeu de tir à la première personne",
    price: "Gratuit",
    language: "fr",
    platform: "Navigateur sur ordinateur (WebGPU, repli WebGL2), clavier et souris. Pas de version mobile.",
    rules: [
      "Le temps n'avance que quand tu bouges ou que tu tires.",
      "Une seule touche et tu meurs.",
      "Aucun ennemi ne tire sans avoir visé : un trait orange prévient toujours.",
      "Une salle, cinq ennemis, quatre balles. Ton arme se lance, même vide. Une arme au sol se ramasse.",
      "La victoire rejoue la partie en temps réel.",
    ],
    rooms: ROOMS.map((room) => ({ title: room.title, status: room.status === "playable" ? "jouable" : "à venir" })),
    madeWith: "Claude Opus 5.5, piloté par eRom. Three.js, TypeScript, Vite.",
    sources: CREDITS.repoUrl,
  };
}

export interface Control {
  input: string;
  action: string;
}

// Les touches suivent la position physique (KeyboardEvent.code) : ZQSD sur AZERTY, WASD sur QWERTY.
export const CONTROLS: readonly Control[] = [
  { input: "ZQSD ou WASD", action: "Se déplacer" },
  { input: "Souris", action: "Viser" },
  { input: "Espace", action: "Sauter" },
  { input: "C", action: "S'accroupir" },
  { input: "Clic gauche", action: "Tirer. Mains vides : coup de poing" },
  { input: "Clic droit", action: "Lancer l'arme" },
  { input: "E", action: "Ramasser une arme" },
  { input: "Échap", action: "Pause" },
  { input: "R", action: "Recommencer" },
];

export interface CreditsInfo {
  line: string;
  usage: string;
  cache: string;
  author: string;
  sources: string;
}

export function creditsInfo(): CreditsInfo {
  return { line: creditsLine(CREDITS), usage: usageLine(CREDITS), cache: cacheLine(CREDITS), author: "eRom (Romain Ecarnot)", sources: CREDITS.repoUrl };
}
