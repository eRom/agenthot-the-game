// Outils de test : salles de test et exécution scriptée d'une partie, sans écran.
import type { EnemySpawn, RoomDefinition } from "../src/rooms/types";
import { type Game, type PlayerInput, emptyInput } from "../src/sim/game";
import type { GameEvent } from "../src/sim/events";
import { aabb } from "../src/sim/geometry";
import { vec3 } from "../src/sim/vec3";

export const FRAME = 1 / 60;

// Salle vide de 30 × 30 m, joueur en (0, 0, 0) qui regarde vers -Z.
export function testRoom(spawns: EnemySpawn[], startWithWeapon = true): RoomDefinition {
  return {
    id: "test-room",
    title: "Test",
    boxes: [
      aabb(-15.5, 0, -15.5, 15.5, 5, -15),
      aabb(-15.5, 0, 15, 15.5, 5, 15.5),
      aabb(-15.5, 0, -15, -15, 5, 15),
      aabb(15, 0, -15, 15.5, 5, 15),
    ],
    rackBoxIndices: [],
    playerStart: vec3(0, 0, 0),
    playerYaw: 0,
    startWithWeapon,
    spawns,
    nav: { nodes: [vec3(0, 0, 0), vec3(0, 0, -10)], edges: [[0, 1]] },
  };
}

export function enemyAt(x: number, z: number, armed = true, mobile = false): EnemySpawn {
  return { pos: vec3(x, 0, z), yaw: Math.PI, armed, mobile, trigger: { kind: "start" } };
}

export function input(overrides: Partial<PlayerInput> = {}): PlayerInput {
  return { ...emptyInput(), ...overrides };
}

export interface LoggedEvent {
  type: GameEvent["type"];
  simTime: number;
  realTime: number;
  ownerId: number;
  targetId: number;
}

// Fait tourner la partie image par image jusqu'à `until` ou `maxSeconds` réelles.
// Les événements de chaque image sont copiés dans le journal renvoyé.
export function run(
  game: Game,
  script: (frame: number, game: Game) => PlayerInput,
  until: (game: Game, log: LoggedEvent[]) => boolean,
  maxSeconds: number,
  dt = FRAME,
): LoggedEvent[] {
  const log: LoggedEvent[] = [];
  const frames = Math.ceil(maxSeconds / dt);
  for (let frame = 0; frame < frames; frame++) {
    game.step(dt, script(frame, game));
    for (let i = 0; i < game.events.count; i++) {
      const e = game.events.items[i]!;
      log.push({ type: e.type, simTime: game.simTime, realTime: game.realTime, ownerId: e.ownerId, targetId: e.targetId });
    }
    if (until(game, log)) break;
  }
  return log;
}
