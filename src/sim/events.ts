// File d'événements pré-allouée, vidée à chaque pas de jeu. Lue par le rendu, l'audio et le replay.
import { type Vec3, copy, set, vec3 } from "./vec3";

export type GameEventType =
  | "shot"
  | "dryFire"
  | "punch"
  | "bulletImpact"
  | "enemyKilled"
  | "enemyStaggered"
  | "enemySpawned"
  | "playerKilled"
  | "weaponThrown"
  | "weaponPicked"
  | "rackBurst";

export interface GameEvent {
  type: GameEventType;
  time: number;
  // Identifiants : 0 = joueur, 1..n = ennemis, -1 = personne. Pour rackBurst : index de boîte.
  ownerId: number;
  targetId: number;
  pos: Vec3;
  vel: Vec3;
}

const ZERO = vec3();

export class EventQueue {
  readonly items: GameEvent[];
  count = 0;

  constructor(capacity: number) {
    this.items = [];
    for (let i = 0; i < capacity; i++) {
      this.items.push({ type: "shot", time: 0, ownerId: -1, targetId: -1, pos: vec3(), vel: vec3() });
    }
  }

  clear(): void {
    this.count = 0;
  }

  push(type: GameEventType, time: number, ownerId: number, targetId: number, pos: Vec3, vel: Vec3 = ZERO): void {
    // File pleine : on écrase le dernier événement plutôt que d'allouer.
    const index = Math.min(this.count, this.items.length - 1);
    const e = this.items[index]!;
    e.type = type;
    e.time = time;
    e.ownerId = ownerId;
    e.targetId = targetId;
    copy(e.pos, pos);
    copy(e.vel, vel);
    if (this.count < this.items.length) this.count++;
  }
}

// Graine déterministe d'un éclatement, partagée par le jeu et le replay.
export function shatterSeed(targetId: number, time: number): number {
  return (targetId * 7919 + Math.round(time * 1000)) >>> 0;
}

export function resetVec(v: Vec3): Vec3 {
  return set(v, 0, 0, 0);
}
