// Pose procédurale d'un ennemi : 8 segments rigides (spec 5.6), calculés à partir de la vue du monde.
// Calcul pur, sans Three.js : testé avec bun, puis dessiné par EnemyBodies.
import type { Vec3 } from "../sim/vec3";
import { vec3 } from "../sim/vec3";
import type { EnemyView } from "../sim/view";

// Dimensions du corps (m). Jambe + torse + tête = 1,77 m : le corps tient dans la capsule de 1,8 m.
export const BODY = {
  legLength: 0.95,
  hipX: 0.11,
  torsoLength: 0.56,
  headSize: 0.26,
  shoulderX: 0.25,
  // Hauteur des épaules au-dessus des hanches, le long du torse.
  shoulderY: 0.5,
  upperArm: 0.3,
  forearm: 0.28,
  // Distance marchée pour un cycle de marche complet (deux pas).
  strideLength: 1.4,
} as const;

// Ordre des segments : c'est aussi l'ordre des InstancedMesh au rendu.
export const SEGMENT = {
  head: 0,
  torso: 1,
  upperArmL: 2,
  upperArmR: 3,
  forearmL: 4,
  forearmR: 5,
  legL: 6,
  legR: 7,
} as const;
export const SEGMENT_COUNT = 8;

// Longueur de chaque segment le long de son axe (le rendu étire une géométrie unitaire).
export const SEGMENT_LENGTH: readonly number[] = [
  BODY.headSize,
  BODY.torsoLength,
  BODY.upperArm,
  BODY.upperArm,
  BODY.forearm,
  BODY.forearm,
  BODY.legLength,
  BODY.legLength,
];

export interface SegmentPose {
  // Centre du segment, dans le monde.
  pos: Vec3;
  // Rotations locales (radians, ordre YXZ avec le lacet de l'ennemi) : tangage > 0 = vers l'avant.
  pitch: number;
  roll: number;
}

export interface EnemyPose {
  yaw: number;
  segments: SegmentPose[];
  // Main droite (tient l'arme) et tangage de l'avant-bras droit.
  hand: Vec3;
  handPitch: number;
}

export function createEnemyPose(): EnemyPose {
  const segments: SegmentPose[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) segments.push({ pos: vec3(), pitch: 0, roll: 0 });
  return { yaw: 0, segments, hand: vec3(), handPitch: 0 };
}

// Angles d'une pose, dans le repère de l'ennemi (avant = −Z), avant le lacet.
const angles = {
  lean: 0, // tangage du torse autour des hanches
  roll: 0, // roulis du torse (vacillement)
  armL: 0,
  armR: 0,
  bendL: 0, // flexion du coude (ajoutée au bras)
  bendR: 0,
  legL: 0,
  legR: 0,
};

export function poseEnemy(e: EnemyView, out: EnemyPose): EnemyPose {
  const p = e.stateProgress;
  const phase = (e.walkDistance / BODY.strideLength) * Math.PI * 2;
  // Seul « approach » fait avancer walkDistance (le sim ne le touche plus à l'arrêt) : dans les autres états,
  // la foulée se résorbe au début de l'état au lieu de rester figée à mi-pas.
  const settle = e.state === "approach" ? 1 : 1 - smoothstep(0, 0.3, p);
  const swing = Math.sin(phase) * settle;

  // Base : marche. Un ennemi désarmé court, bras pliés ; un armé marche, arme basse.
  angles.lean = e.armed ? 0.05 : 0.18;
  angles.roll = 0;
  angles.legL = 0.45 * swing;
  angles.legR = -0.45 * swing;
  const armSwing = e.armed ? 0.3 : 0.6;
  angles.armL = -armSwing * swing;
  angles.armR = armSwing * swing;
  angles.bendL = e.armed ? 0.3 : 1.3;
  angles.bendR = e.armed ? 0.3 : 1.3;

  // Tangage du bras droit qui pointe l'arme vers le point visé (bras tendu).
  const aimPitch = aimArmPitch(e);
  switch (e.state) {
    case "aim": {
      // Levée du bras de tir pendant la première moitié de la visée.
      const raise = smoothstep(0, 0.5, p);
      angles.armR = mix(angles.armR, aimPitch - angles.lean, raise);
      angles.bendR = mix(angles.bendR, 0, raise);
      break;
    }
    case "cooldown":
      if (e.armed) {
        // Recul : le bras saute vers le haut, le torse part en arrière, puis tout redescend.
        const kick = (1 - p) * (1 - p);
        const lower = smoothstep(0.6, 1, p);
        angles.lean -= 0.12 * kick;
        angles.armR = mix(aimPitch - angles.lean + 0.5 * kick, angles.armR, lower);
        angles.bendR = mix(0, angles.bendR, lower);
      } else {
        // Coup porté : bras droit tendu vers l'avant, qui revient.
        angles.lean = mix(0.3, angles.lean, p);
        angles.armR = mix(1.5, angles.armR, p);
        angles.bendR = mix(0.1, angles.bendR, p);
      }
      break;
    case "windup":
      // Élan de mêlée : le corps se penche, le bras droit part en arrière.
      angles.lean = mix(angles.lean, 0.35, p);
      angles.armR = mix(angles.armR, -0.9, p);
      angles.bendR = mix(angles.bendR, 1.4, p);
      break;
    case "stagger": {
      // Vacillement : buste rejeté en arrière, roulis qui s'amortit, bras qui battent.
      const k = 1 - p;
      angles.lean = -0.45 * k * Math.sin(Math.min(1, p * 4) * Math.PI * 0.5);
      angles.roll = 0.25 * Math.sin(p * Math.PI * 5) * k;
      angles.armL = mix(angles.armL, 2.1, k);
      angles.armR = mix(angles.armR, 1.5 + 0.4 * Math.sin(p * Math.PI * 6), k);
      angles.bendL = mix(angles.bendL, 0.6, k);
      angles.bendR = mix(angles.bendR, 0.6, k);
      break;
    }
    default:
      break;
  }
  return build(e, out);
}

// Hanches, torse, tête et membres à partir des angles, puis lacet et position de l'ennemi.
function build(e: EnemyView, out: EnemyPose): EnemyPose {
  const a = angles;
  out.yaw = e.yaw;
  // Les hanches descendent quand les jambes s'écartent : les pieds restent au sol.
  const hipY = BODY.legLength * Math.cos(Math.max(Math.abs(a.legL), Math.abs(a.legR)));

  // Torse : axe « haut » penché par lean (tangage) et roll (roulis).
  const cl = Math.cos(a.lean);
  const sl = Math.sin(a.lean);
  const cr = Math.cos(a.roll);
  const sr = Math.sin(a.roll);
  // Rz(roll) puis Rx(−lean) appliqués à (0, 1, 0) : x = −sin(roll), y = cos(roll)·cos(lean), z = −cos(roll)·sin(lean).
  const upX = -sr;
  const upY = cr * cl;
  const upZ = -cr * sl;
  const torso = out.segments[SEGMENT.torso]!;
  setLocal(torso.pos, upX * BODY.torsoLength * 0.5, hipY + upY * BODY.torsoLength * 0.5, upZ * BODY.torsoLength * 0.5);
  // Le torse monte depuis les hanches : pencher vers l'avant, c'est un tangage négatif de sa géométrie.
  torso.pitch = -a.lean;
  torso.roll = a.roll;
  const head = out.segments[SEGMENT.head]!;
  const neck = BODY.torsoLength + BODY.headSize * 0.5;
  setLocal(head.pos, upX * neck, hipY + upY * neck, upZ * neck);
  head.pitch = -a.lean;
  head.roll = a.roll;

  // Épaules : (±shoulderX, shoulderY) dans le repère du torse.
  for (let side = 0; side < 2; side++) {
    const sx = side === 0 ? -BODY.shoulderX : BODY.shoulderX;
    // Rz(roll) puis Rx(−lean) appliqués à (sx, shoulderY, 0).
    const rx = sx * cr - BODY.shoulderY * sr;
    const ry0 = sx * sr + BODY.shoulderY * cr;
    const shX = rx;
    const shY = hipY + ry0 * cl;
    const shZ = -ry0 * sl;
    const armPitch = (side === 0 ? a.armL : a.armR) + a.lean;
    const forePitch = armPitch + (side === 0 ? a.bendL : a.bendR);
    const upper = out.segments[side === 0 ? SEGMENT.upperArmL : SEGMENT.upperArmR]!;
    const fore = out.segments[side === 0 ? SEGMENT.forearmL : SEGMENT.forearmR]!;
    // Un membre pend le long de −Y ; un tangage θ l'envoie vers (0, −cos θ, −sin θ).
    const ex = shX;
    const ey = shY - Math.cos(armPitch) * BODY.upperArm;
    const ez = shZ - Math.sin(armPitch) * BODY.upperArm;
    setLocal(upper.pos, shX, shY - Math.cos(armPitch) * BODY.upperArm * 0.5, shZ - Math.sin(armPitch) * BODY.upperArm * 0.5);
    upper.pitch = armPitch;
    upper.roll = 0;
    setLocal(fore.pos, ex, ey - Math.cos(forePitch) * BODY.forearm * 0.5, ez - Math.sin(forePitch) * BODY.forearm * 0.5);
    fore.pitch = forePitch;
    fore.roll = 0;
    if (side === 1) {
      setLocal(out.hand, ex, ey - Math.cos(forePitch) * BODY.forearm, ez - Math.sin(forePitch) * BODY.forearm);
      out.handPitch = forePitch;
    }
  }

  for (let side = 0; side < 2; side++) {
    const leg = out.segments[side === 0 ? SEGMENT.legL : SEGMENT.legR]!;
    const pitch = side === 0 ? a.legL : a.legR;
    const hx = side === 0 ? -BODY.hipX : BODY.hipX;
    setLocal(leg.pos, hx, hipY - Math.cos(pitch) * BODY.legLength * 0.5, -Math.sin(pitch) * BODY.legLength * 0.5);
    leg.pitch = pitch;
    leg.roll = 0;
  }

  // Repère de l'ennemi → monde : lacet puis position.
  const cy = Math.cos(e.yaw);
  const sy = Math.sin(e.yaw);
  for (let i = 0; i < SEGMENT_COUNT; i++) toWorld(out.segments[i]!.pos, e.pos, cy, sy);
  toWorld(out.hand, e.pos, cy, sy);
  return out;
}

// Tangage du bras droit (bras tendu) pour pointer vers le point visé, dans le repère de l'ennemi.
function aimArmPitch(e: EnemyView): number {
  const dh = Math.hypot(e.aimPoint.x - e.pos.x, e.aimPoint.z - e.pos.z);
  const shoulderY = e.pos.y + BODY.legLength + BODY.shoulderY;
  // Bras à l'horizontale vers l'avant : θ = π/2 ; au-dessus, θ = π/2 + élévation.
  return Math.PI / 2 + Math.atan2(e.aimPoint.y - shoulderY, Math.max(0.1, dh));
}

function setLocal(out: Vec3, x: number, y: number, z: number): void {
  out.x = x;
  out.y = y;
  out.z = z;
}

// Ry(lacet) : x' = x·cos + z·sin ; z' = −x·sin + z·cos (lacet 0 = −Z, comme la simulation).
function toWorld(v: Vec3, origin: Vec3, cy: number, sy: number): void {
  const x = v.x * cy + v.z * sy;
  const z = -v.x * sy + v.z * cy;
  v.x = origin.x + x;
  v.y = origin.y + v.y;
  v.z = origin.z + z;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
