// Démo du fond du menu (spec 4.3) : une partie scriptée, jouée sans écran au démarrage, enregistrée comme un replay.
// Le menu la rejoue ensuite à 3 % du temps. Fabriquée à la volée par la simulation (aucun fichier à versionner :
// elle suit toujours le format du replay, qui dépend de POOLS). La simulation est déterministe à entrées égales :
// la démo est la même à chaque visite, et ses moments forts sont vérifiés par les tests.
import type { RoomDefinition } from "../rooms/types";
import { Game, emptyInput } from "../sim/game";
import { playerEye } from "../sim/player-system";
import { vec3 } from "../sim/vec3";
import { createWorldView, writeGameView } from "../sim/view";
import { ReplayRecorder } from "./recorder";

export const MENU_DEMO = {
  dt: 1 / 60,
  // Le joueur avance vers la passerelle en visant son ennemi (index 2 de la salle 1), et tire à l'image 70.
  // L'ennemi éclate (1,20 s), il n'en reste que 2 : deux baies explosent et libèrent les renforts (1,21 s) ;
  // les ennemis des allées visent (1,66 s) puis tirent (1,98 s). Le joueur serait touché à 2,08 s.
  targetEnemy: 2,
  fireFrame: 70,
  // Fenêtre enregistrée, en temps de simulation : juste avant l'éclatement, jusqu'aux balles en vol.
  captureFrom: 1.15,
  captureUntil: 2.04,
  // Garde-fou : la partie scriptée ne tourne jamais plus longtemps (s réelles).
  maxSeconds: 8,
  // Vitesse de lecture dans le menu : le temps figé du jeu (TIME.min).
  playbackRate: 0.03,
  // Fondu au vide au début et à la fin de chaque boucle (s réelles) : la reprise ne se voit pas.
  fadeSeconds: 1.2,
} as const;

const eye = vec3();

// Joue la démo et renvoie son enregistrement (fenêtre captureFrom à captureUntil).
export function recordMenuDemo(room: RoomDefinition): ReplayRecorder {
  const game = new Game(room);
  const view = createWorldView(room.boxes.length, game.shatter.shards);
  const recorder = new ReplayRecorder();
  const input = emptyInput();
  let capturing = false;
  const frames = Math.ceil(MENU_DEMO.maxSeconds / MENU_DEMO.dt);
  for (let frame = 0; frame < frames && game.status === "playing"; frame++) {
    const target = game.enemies[MENU_DEMO.targetEnemy]!;
    playerEye(game, eye);
    const dx = target.pos.x - eye.x;
    const dy = target.pos.y + 1.2 - eye.y;
    const dz = target.pos.z - eye.z;
    // Le regard suit la cible : lacet 0 = −Z (le moteur retranche lookDX du lacet).
    input.moveZ = 1;
    input.lookDX = game.player.yaw - Math.atan2(-dx, -dz);
    input.lookDY = game.player.pitch - Math.atan2(dy, Math.hypot(dx, dz));
    input.fire = frame === MENU_DEMO.fireFrame;
    game.step(MENU_DEMO.dt, input);
    writeGameView(game, view);
    if (!capturing && game.simTime >= MENU_DEMO.captureFrom) {
      capturing = true;
      recorder.reset();
    }
    if (!capturing) continue;
    recorder.recordEvents(game.events);
    const last = game.simTime >= MENU_DEMO.captureUntil;
    recorder.capture(game.simTime, view, last);
    if (last) break;
  }
  return recorder;
}

// Part du vide sur l'image (0 = scène nette, 1 = vide), d'après la tête de lecture de la démo (s de simulation).
export function menuFade(playhead: number, duration: number): number {
  const fade = MENU_DEMO.fadeSeconds * MENU_DEMO.playbackRate;
  const edge = Math.min(playhead, duration - playhead);
  return 1 - Math.min(1, Math.max(0, edge / fade));
}

// Caméra du menu : elle dérive lentement en hauteur, à l'entrée de la salle, face à la passerelle et aux baies
// qui explosent (repère : lacet 0 = −Z). `t` en secondes réelles ; une boucle complète dure `period`.
// Cadrage réglé à l'écran le 2026-09-29 : les éclats de la passerelle à gauche, un renfort qui sort de sa baie à droite.
export const MENU_CAMERA = {
  period: 48,
  // Position de départ et amplitude de la dérive (m).
  x: -0.5,
  y: 4.6,
  z: 6.6,
  swayX: 1.4,
  swayY: 0.25,
  swayZ: 0.6,
  // Point regardé, lui aussi en dérive plus lente.
  lookX: -3.5,
  lookY: 1.2,
  lookZ: -2.5,
  lookSway: 1.2,
} as const;

export interface MenuCameraPose {
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
}

export function menuCamera(t: number, out: MenuCameraPose): MenuCameraPose {
  const c = MENU_CAMERA;
  const a = (t / c.period) * Math.PI * 2;
  out.pos.x = c.x + Math.sin(a) * c.swayX;
  out.pos.y = c.y + Math.sin(a * 2) * c.swayY;
  out.pos.z = c.z + Math.cos(a) * c.swayZ;
  const lx = c.lookX + Math.cos(a) * c.lookSway;
  const dx = lx - out.pos.x;
  const dy = c.lookY - out.pos.y;
  const dz = c.lookZ - out.pos.z;
  out.yaw = Math.atan2(-dx, -dz);
  out.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return out;
}
