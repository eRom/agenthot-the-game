import { describe, expect, test } from "bun:test";
import { BODY, SEGMENT, SEGMENT_LENGTH, createEnemyPose, poseEnemy } from "../src/render/enemy-pose";
import { ENEMY } from "../src/sim/entities";
import type { EnemyState } from "../src/sim/entities";
import { set } from "../src/sim/vec3";
import { type EnemyView, createWorldView } from "../src/sim/view";

// Un ennemi en (2, 0, −3), qui regarde vers −Z (lacet 0) sauf mention contraire.
function enemy(state: EnemyState, progress = 0, walkDistance = 0, armed = true): EnemyView {
  const e = createWorldView(0, []).enemies[0]!;
  e.visible = true;
  e.state = state;
  e.stateProgress = progress;
  e.walkDistance = walkDistance;
  e.armed = armed;
  set(e.pos, 2, 0, -3);
  set(e.aimPoint, 2, 1.2, -9);
  e.yaw = 0;
  return e;
}

// Bas d'un segment qui pend depuis son sommet (jambe) : centre − demi-longueur le long de son axe.
function bottomY(pose: ReturnType<typeof createEnemyPose>, index: number): number {
  const seg = pose.segments[index]!;
  return seg.pos.y - Math.cos(seg.pitch) * SEGMENT_LENGTH[index]! * 0.5;
}

describe("pose procédurale des ennemis (spec 5.6)", () => {
  test("au repos, les pieds touchent le sol et le corps tient dans la capsule", () => {
    const pose = poseEnemy(enemy("approach"), createEnemyPose());
    expect(bottomY(pose, SEGMENT.legL)).toBeCloseTo(0, 5);
    expect(bottomY(pose, SEGMENT.legR)).toBeCloseTo(0, 5);
    const head = pose.segments[SEGMENT.head]!;
    expect(head.pos.y + BODY.headSize / 2).toBeLessThanOrEqual(ENEMY.height);
  });

  test("en marche, les jambes se croisent et les deux pieds restent au sol", () => {
    const pose = poseEnemy(enemy("approach", 0, BODY.strideLength / 4), createEnemyPose());
    const left = pose.segments[SEGMENT.legL]!.pitch;
    const right = pose.segments[SEGMENT.legR]!.pitch;
    expect(Math.abs(left)).toBeGreaterThan(0.3);
    expect(right).toBeCloseTo(-left, 5);
    expect(bottomY(pose, SEGMENT.legL)).toBeCloseTo(0, 5);
    expect(bottomY(pose, SEGMENT.legR)).toBeCloseTo(0, 5);
  });

  test("au début de la visée le bras est bas ; à la fin, il pointe l'arme vers le point visé", () => {
    const e = enemy("aim", 0);
    // Lacet quelconque, face au point visé.
    set(e.aimPoint, 7, 1.1, 1);
    e.yaw = Math.atan2(-(e.aimPoint.x - e.pos.x), -(e.aimPoint.z - e.pos.z));
    const start = poseEnemy(e, createEnemyPose());
    expect(start.hand.y).toBeLessThan(BODY.legLength + BODY.shoulderY - 0.2);

    e.stateProgress = 1;
    const pose = poseEnemy(e, createEnemyPose());
    const upper = pose.segments[SEGMENT.upperArmR]!.pos;
    const armX = pose.hand.x - upper.x;
    const armY = pose.hand.y - upper.y;
    const armZ = pose.hand.z - upper.z;
    const toX = e.aimPoint.x - pose.hand.x;
    const toY = e.aimPoint.y - pose.hand.y;
    const toZ = e.aimPoint.z - pose.hand.z;
    const cos = (armX * toX + armY * toY + armZ * toZ) / (Math.hypot(armX, armY, armZ) * Math.hypot(toX, toY, toZ));
    // Moins de 8° d'écart.
    expect(cos).toBeGreaterThan(Math.cos((8 * Math.PI) / 180));
  });

  test("au tir, le recul lève la main au-dessus de la visée", () => {
    const aimed = poseEnemy(enemy("aim", 1), createEnemyPose()).hand.y;
    const recoil = poseEnemy(enemy("cooldown", 0), createEnemyPose()).hand.y;
    expect(recoil).toBeGreaterThan(aimed + 0.05);
  });

  test("en vacillant, le buste part en arrière (vers +Z pour un ennemi qui regarde vers −Z)", () => {
    const pose = poseEnemy(enemy("stagger", 0.25), createEnemyPose());
    expect(pose.segments[SEGMENT.head]!.pos.z).toBeGreaterThan(-3 + 0.1);
  });

  test("pendant l'élan de mêlée, le buste se penche vers l'avant", () => {
    const pose = poseEnemy(enemy("windup", 1, 0, false), createEnemyPose());
    expect(pose.segments[SEGMENT.head]!.pos.z).toBeLessThan(-3 - 0.1);
  });
});
