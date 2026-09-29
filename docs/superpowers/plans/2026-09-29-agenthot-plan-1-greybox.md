# AGENTHOT, plan 1 : la salle en gris jouable

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** une salle 1 jouable en gris dans le navigateur. Le temps qui ralentit, le pistolet, le poing, le lancer et la capture, les 5 ennemis, l'éclatement, la mort, la relance et le replay. Assez pour juger la **sensation** avant d'habiller.

**Architecture :**
- La simulation (`src/sim`) est du TypeScript pur, sans Three.js ni DOM, testée avec `bun test`.
- Elle expose une `WorldView` que le rendu (`src/render`) dessine. Le replay écrit la même `WorldView`, donc le rendu ne sait pas s'il dessine le jeu ou le replay.
- Une salle est un module de données (`src/rooms`).

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4 (runtime, paquets, `bun test`), Three.js r186 (`three/webgpu`, repli WebGL2 automatique).

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md` (intent record : `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md`).

**Place de ce plan :** plan 1 sur 3.
- Plan 2 : beauté (contours, glow, ennemis facettés animés) et son.
- Plan 3 : écrans, assets générés, cinématique, mise en ligne.

Les plans 2 et 3 s'écrivent **après** la tâche 8 de ce plan (test de sensation par Romain).

## Global Constraints

- **Langue :** identifiants, clés, noms de fichiers, messages de log et descriptions de test techniques en anglais ; commentaires en français. Les descriptions de test de ce plan sont en français, car ce sont des phrases lues par Romain : garder tel quel.
- **Outillage :** `bun` uniquement (jamais `npm`, `npx`, `node`).
- **Politique bun de la machine :** `minimum-release-age` de 7 jours. Un paquet publié il y a moins de 7 jours est refusé. D'où `three@~0.186.0` : il résout 0.186.0 aujourd'hui et prendra 0.186.1 dès qu'elle aura 7 jours.
- **Versions épinglées :**
  - `three` `~0.186.0` et `@types/three` `~0.186.0` (three ne livre pas ses types) ;
  - `vite` `^8.3.0` ;
  - `typescript` `~6.0.2` ;
  - `@types/bun` : la dernière version acceptée.
- **Imports Three.js :** tout vient de `three/webgpu`.
  - `await renderer.init()` avant tout `render()` ;
  - `WebGPURenderer({ forceWebGL: true })` force le repli ;
  - backend actif : `(renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend` ;
  - appels de dessin de l'image : `renderer.info.render.drawCalls`.
  - Source : brief r186 du 2026-09-29, lu dans les sources du paquet `three@0.186.0`.
- **Zéro allocation dans la boucle de jeu** (spec 9.1). Vecteurs temporaires en champs de module ou de classe, pools pré-alloués. Jamais de `forEach` avec fermeture, `map`, `filter` ou `find` dans `step`, `update` ou `writeView`.
- **Tous les minuteurs de gameplay** comptent en temps de simulation. Le joueur (regard, déplacement, saut) vit en temps réel (spec 5.1).
- **Palette** (spec 6.1) :
  - `void` `#0D111B`, `world` `#ECEBE7`, `world-2` `#C9CBD0`, `ink` `#0A0C10`, `threat` `#D97757`, `threat-hot` `#FF9D73` ;
  - l'orange est réservé aux ennemis, aux balles, aux traînées et aux traits de visée.
- **Commits :** un par tâche, message en anglais, avec les lignes d'attribution demandées par la session en cours.
- **Commandes Bash :** chaque commande qui écrit commence par `cd <racine absolue du worktree> &&`.
- **Sortie des tests :** pour une sortie brute des tests, préfixer `RTK_DISABLED=1`.

## Review Focus

Cinq cas qu'un joueur rencontrera et que la spec ne cite pas. Chacun a son test ou sa vérification dans la tâche propriétaire.

1. **Le joueur force dans le coin d'un tronçon de baies.** Il glisse le long, ne rentre jamais dedans. Test : tâche 5, « le joueur qui force contre un coin de baies ne rentre jamais dedans ».
2. **Une partie dure plus de 90 s de temps de simulation.** Le replay garde les 90 dernières secondes, sans crash. Test : tâche 6, « au-delà de 90 s de simulation… ».
3. **Une arme éjectée par l'ennemi de la passerelle retombe sur la passerelle.** Elle s'y pose, au lieu de rester « en vol » pour toujours. Test : tâche 4, « une arme qui retombe sur la passerelle s'y pose… ».
4. **L'onglet passe en arrière-plan, ou le joueur fait Échap.** Au retour, pas de bond dans le temps, et la pause ne fait pas avancer la partie. Pas plafonné à 0,1 s dans `main.ts` et à 1/60 s dans `TimeController` (test tâche 2). Vérification manuelle en tâche 7.
5. **Clavier AZERTY.** Z/Q/S/D déplace comme W/A/S/D en QWERTY, grâce à `KeyboardEvent.code`. Vérification manuelle en tâche 7.

## Structure des fichiers

```
package.json, tsconfig.json, index.html
src/
  sim/        vec3.ts, rng.ts, geometry.ts, time.ts, entities.ts, events.ts, shatter.ts, nav.ts,
              game.ts, player-system.ts, enemy-system.ts, projectile-system.ts, view.ts
  rooms/      types.ts, room-01-datacenter.ts, registry.ts
  replay/     recorder.ts, player.ts
  render/     palette.ts, create-renderer.ts, world-renderer.ts
  app/        input.ts, hud.ts, main.ts, style.css
tests/        helpers.ts + un fichier *.test.ts par sujet
```

Chaque fichier a une seule responsabilité :
- `game.ts` ordonne les systèmes et porte l'état partagé ;
- chaque `*-system.ts` fait évoluer une famille d'entités ;
- `view.ts` est la seule frontière lue par le rendu.

**Prototype vérifié :** tout le code de ce plan a été exécuté avant d'être écrit ici.
- Les tâches 1 à 6 ont été rejouées dans un dossier vide, une par une. Chaque test échoue avant son code et passe après, et `tsc` passe à chaque étape : 7, 13, 18, 25, 34, puis 37 tests verts.
- La tâche 7 compile, se construit (228 Ko gzip) et s'affiche dans Chrome en WebGPU : 120 i/s, 19 appels de dessin, pointer lock fonctionnel.

Recopier les blocs **tels quels**.

---

### Task 1 : socle du projet et géométrie

**Files :**
- Create : `package.json`, `tsconfig.json`, `src/sim/vec3.ts`, `src/sim/rng.ts`, `src/sim/geometry.ts`
- Modify : `.gitignore`
- Test : `tests/geometry.test.ts`

**Interfaces :**
- Produces :
  - `Vec3 {x,y,z}`, `vec3()`, et les opérations `set`, `copy`, `add`, `sub`, `scale`, `addScaled`, `lerp`, `dot`, `lengthSq`, `length`, `distance`, `normalize` (toutes écrivent dans `out`) ;
  - `Rng` (`reset`, `next`, `range`) ;
  - `Aabb`, `aabb()`, `sweepSphereAabb(p0, p1, r, box): number` (renvoie t dans [0,1], ou -1) ;
  - `closestSegmentSegment`, `sweepSphereCapsule(p0, p1, r, base, height, capRadius): number` ;
  - `pushCircleOutOfAabbs(pos, r, height, boxes, enabled?)`, `segmentBlocked(a, b, boxes, enabled?)`.

- [ ] **Step 1 : créer le socle**

Écrire `package.json` :

```json
{
  "name": "agenthot",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "bun test",
    "typecheck": "tsc -p ."
  }
}
```

Puis installer :

```bash
cd <racine> && bun add three@~0.186.0 && bun add -d @types/three@~0.186.0 vite@^8.3.0 typescript@~6.0.2 @types/bun
```

Résultat attendu :
- `package.json` gagne `dependencies.three` et `devDependencies` ;
- un `bun.lock` apparaît ;
- `three` installé en 0.186.0 (ou 0.186.1 si elle a plus de 7 jours).

Écrire `tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "types": ["vite/client", "bun"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

Ajouter à `.gitignore` :

```
node_modules/
dist/
```

- [ ] **Step 2 : écrire le test qui échoue**

`tests/geometry.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { aabb, pushCircleOutOfAabbs, segmentBlocked, sweepSphereAabb, sweepSphereCapsule } from "../src/sim/geometry";
import { vec3 } from "../src/sim/vec3";

describe("géométrie", () => {
  const box = aabb(-1, 0, -1, 1, 2, 1);

  test("une sphère qui balaie vers une boîte la touche à la bonne fraction du trajet", () => {
    const t = sweepSphereAabb(vec3(-5, 1, 0), vec3(5, 1, 0), 0, box);
    expect(t).toBeCloseTo(0.4, 5);
  });

  test("le rayon de la sphère avance le contact", () => {
    const t = sweepSphereAabb(vec3(-5, 1, 0), vec3(5, 1, 0), 0.5, box);
    expect(t).toBeCloseTo(0.35, 5);
  });

  test("un segment qui passe à côté ne touche pas", () => {
    expect(sweepSphereAabb(vec3(-5, 1, 3), vec3(5, 1, 3), 0.1, box)).toBe(-1);
  });

  test("une sphère touche une capsule verticale qu'elle frôle à moins de la somme des rayons", () => {
    const base = vec3(0, 0, 0);
    expect(sweepSphereCapsule(vec3(-5, 1, 0.5), vec3(5, 1, 0.5), 0.1, base, 1.8, 0.45)).toBeGreaterThanOrEqual(0);
    expect(sweepSphereCapsule(vec3(-5, 1, 0.6), vec3(5, 1, 0.6), 0.1, base, 1.8, 0.45)).toBe(-1);
  });

  test("un cercle qui entre dans une boîte en ressort par le côté le plus proche", () => {
    const pos = vec3(1.1, 0, 0);
    pushCircleOutOfAabbs(pos, 0.3, 1.8, [box]);
    expect(pos.x).toBeCloseTo(1.3, 5);
    expect(pos.z).toBeCloseTo(0, 5);
  });

  test("une boîte plus haute que le cercle (passerelle) ne le repousse pas", () => {
    const pos = vec3(0, 0, 0);
    pushCircleOutOfAabbs(pos, 0.3, 1.8, [aabb(-1, 3.4, -1, 1, 3.5, 1)]);
    expect(pos.x).toBe(0);
  });

  test("une boîte désactivée ne bloque plus la ligne de vue", () => {
    const a = vec3(-5, 1, 0);
    const b = vec3(5, 1, 0);
    expect(segmentBlocked(a, b, [box])).toBe(true);
    expect(segmentBlocked(a, b, [box], [false])).toBe(false);
  });
});
```

- [ ] **Step 3 : vérifier qu'il échoue**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/geometry.test.ts`
Expected : FAIL, `Cannot find module '../src/sim/geometry'`.

- [ ] **Step 4 : écrire le code**

`src/sim/vec3.ts` :

```ts
// Vecteurs 3D mutables, sans allocation : chaque opération écrit dans `out`.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function set(out: Vec3, x: number, y: number, z: number): Vec3 {
  out.x = x;
  out.y = y;
  out.z = z;
  return out;
}

export function copy(out: Vec3, a: Vec3): Vec3 {
  out.x = a.x;
  out.y = a.y;
  out.z = a.z;
  return out;
}

export function add(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  out.z = a.z + b.z;
  return out;
}

export function sub(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  out.z = a.z - b.z;
  return out;
}

export function scale(out: Vec3, a: Vec3, s: number): Vec3 {
  out.x = a.x * s;
  out.y = a.y * s;
  out.z = a.z * s;
  return out;
}

// out = a + b * s
export function addScaled(out: Vec3, a: Vec3, b: Vec3, s: number): Vec3 {
  out.x = a.x + b.x * s;
  out.y = a.y + b.y * s;
  out.z = a.z + b.z * s;
  return out;
}

export function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  return out;
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function lengthSq(a: Vec3): number {
  return a.x * a.x + a.y * a.y + a.z * a.z;
}

export function length(a: Vec3): number {
  return Math.sqrt(lengthSq(a));
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalize(out: Vec3, a: Vec3): Vec3 {
  const len = length(a);
  if (len < 1e-9) return set(out, 0, 0, 0);
  return scale(out, a, 1 / len);
}
```

`src/sim/rng.ts` :

```ts
// Générateur pseudo-aléatoire à graine (mulberry32) : mêmes tirages en jeu et en replay.
export class Rng {
  private state = 0;

  constructor(seed = 1) {
    this.reset(seed);
  }

  reset(seed: number): void {
    this.state = seed >>> 0;
  }

  // Nombre dans [0, 1).
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}
```

`src/sim/geometry.ts` :

```ts
// Requêtes géométriques de la simulation : boîtes alignées, capsules verticales, segments.
import { type Vec3, vec3 } from "./vec3";

export interface Aabb {
  min: Vec3;
  max: Vec3;
}

export function aabb(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): Aabb {
  return { min: vec3(minX, minY, minZ), max: vec3(maxX, maxY, maxZ) };
}

// Premier contact d'une sphère qui balaie le segment p0 → p1 contre une boîte.
// La boîte est gonflée du rayon (coins non arrondis : léger excès, sans danger ici).
// Renvoie t dans [0, 1], ou -1 sans contact.
let slabMin = 0;
let slabMax = 1;

// Restreint [slabMin, slabMax] sur un axe. Renvoie faux si l'intervalle devient vide.
function clipSlab(origin: number, dir: number, lo: number, hi: number): boolean {
  if (Math.abs(dir) < 1e-12) return origin >= lo && origin <= hi;
  let t1 = (lo - origin) / dir;
  let t2 = (hi - origin) / dir;
  if (t1 > t2) {
    const tmp = t1;
    t1 = t2;
    t2 = tmp;
  }
  if (t1 > slabMin) slabMin = t1;
  if (t2 < slabMax) slabMax = t2;
  return slabMin <= slabMax;
}

export function sweepSphereAabb(p0: Vec3, p1: Vec3, radius: number, box: Aabb): number {
  slabMin = 0;
  slabMax = 1;
  if (!clipSlab(p0.x, p1.x - p0.x, box.min.x - radius, box.max.x + radius)) return -1;
  if (!clipSlab(p0.y, p1.y - p0.y, box.min.y - radius, box.max.y + radius)) return -1;
  if (!clipSlab(p0.z, p1.z - p0.z, box.min.z - radius, box.max.z + radius)) return -1;
  return slabMin;
}

// Paramètres des points les plus proches entre deux segments (Ericson, Real-Time Collision Detection 5.1.9).
const closest = { s: 0, t: 0, distSq: 0 };

export function closestSegmentSegment(p1: Vec3, q1: Vec3, p2: Vec3, q2: Vec3): typeof closest {
  const d1x = q1.x - p1.x, d1y = q1.y - p1.y, d1z = q1.z - p1.z;
  const d2x = q2.x - p2.x, d2y = q2.y - p2.y, d2z = q2.z - p2.z;
  const rx = p1.x - p2.x, ry = p1.y - p2.y, rz = p1.z - p2.z;
  const a = d1x * d1x + d1y * d1y + d1z * d1z;
  const e = d2x * d2x + d2y * d2y + d2z * d2z;
  const f = d2x * rx + d2y * ry + d2z * rz;
  let s = 0;
  let t = 0;
  if (a <= 1e-12 && e <= 1e-12) {
    s = 0;
    t = 0;
  } else if (a <= 1e-12) {
    s = 0;
    t = Math.min(1, Math.max(0, f / e));
  } else {
    const c = d1x * rx + d1y * ry + d1z * rz;
    if (e <= 1e-12) {
      t = 0;
      s = Math.min(1, Math.max(0, -c / a));
    } else {
      const b = d1x * d2x + d1y * d2y + d1z * d2z;
      const denom = a * e - b * b;
      s = denom !== 0 ? Math.min(1, Math.max(0, (b * f - c * e) / denom)) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.min(1, Math.max(0, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.min(1, Math.max(0, (b - c) / a));
      }
    }
  }
  const cx = p1.x + d1x * s - (p2.x + d2x * t);
  const cy = p1.y + d1y * s - (p2.y + d2y * t);
  const cz = p1.z + d1z * s - (p2.z + d2z * t);
  closest.s = s;
  closest.t = t;
  closest.distSq = cx * cx + cy * cy + cz * cz;
  return closest;
}

const capA = vec3();
const capB = vec3();

// Contact d'une sphère qui balaie p0 → p1 avec une capsule verticale posée sur `base`.
// Renvoie t approché (point le plus proche sur le segment), ou -1.
export function sweepSphereCapsule(
  p0: Vec3,
  p1: Vec3,
  radius: number,
  base: Vec3,
  height: number,
  capRadius: number,
): number {
  capA.x = base.x;
  capA.y = base.y + capRadius;
  capA.z = base.z;
  capB.x = base.x;
  capB.y = base.y + height - capRadius;
  capB.z = base.z;
  const r = radius + capRadius;
  const c = closestSegmentSegment(p0, p1, capA, capB);
  return c.distSq <= r * r ? c.s : -1;
}

// Repousse un cercle (plan XZ) hors des boîtes qu'il chevauche en hauteur.
export function pushCircleOutOfAabbs(pos: Vec3, radius: number, height: number, boxes: readonly Aabb[], enabled?: readonly boolean[]): void {
  for (let i = 0; i < boxes.length; i++) {
    if (enabled && !enabled[i]) continue;
    const box = boxes[i]!;
    if (pos.y + height <= box.min.y || pos.y >= box.max.y) continue;
    const cx = Math.max(box.min.x, Math.min(pos.x, box.max.x));
    const cz = Math.max(box.min.z, Math.min(pos.z, box.max.z));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq >= radius * radius) continue;
    if (distSq > 1e-12) {
      const dist = Math.sqrt(distSq);
      pos.x = cx + (dx / dist) * radius;
      pos.z = cz + (dz / dist) * radius;
    } else {
      // Centre à l'intérieur : on sort par la face la plus proche.
      const left = pos.x - box.min.x;
      const right = box.max.x - pos.x;
      const back = pos.z - box.min.z;
      const front = box.max.z - pos.z;
      const m = Math.min(left, right, back, front);
      if (m === left) pos.x = box.min.x - radius;
      else if (m === right) pos.x = box.max.x + radius;
      else if (m === back) pos.z = box.min.z - radius;
      else pos.z = box.max.z + radius;
    }
  }
}

// Vrai si le segment a → b traverse une boîte active (ligne de vue bloquée).
export function segmentBlocked(a: Vec3, b: Vec3, boxes: readonly Aabb[], enabled?: readonly boolean[]): boolean {
  for (let i = 0; i < boxes.length; i++) {
    if (enabled && !enabled[i]) continue;
    if (sweepSphereAabb(a, b, 0, boxes[i]!) >= 0) return true;
  }
  return false;
}
```

- [ ] **Step 5 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `7 pass`, `0 fail`, et `tsc` sans sortie.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add package.json bun.lock tsconfig.json .gitignore src/sim/vec3.ts src/sim/rng.ts src/sim/geometry.ts tests/geometry.test.ts && git commit -m "feat(sim): scaffold project with vector math and collision geometry"
```

---

### Task 2 : le contrôleur du temps (AC-2)

**Files :**
- Create : `src/sim/time.ts`
- Test : `tests/time.test.ts`

**Interfaces :**
- Produces :
  - `TIME` (réglages : `min` 0,03, `lookWeight` 0,15, `lookThreshold` 800 px/s, `actionDecayRate` 15, `smoothing` 12, `maxSimDt` 1/60) ;
  - `TimeInput {moveAlpha, lookPixels, action, jumpRising}` ;
  - `class TimeController { scale; reset(); update(dtReal, input): number }` : renvoie le pas de simulation.

- [ ] **Step 1 : écrire le test qui échoue**

`tests/time.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { TIME, TimeController, type TimeInput } from "../src/sim/time";

const still: TimeInput = { moveAlpha: 0, lookPixels: 0, action: false, jumpRising: false };
const walking: TimeInput = { ...still, moveAlpha: 1 };

function runFor(tc: TimeController, seconds: number, input: TimeInput, dt = 1 / 60): number {
  let simDt = 0;
  for (let t = 0; t < seconds - 1e-9; t += dt) simDt = tc.update(dt, input);
  return simDt;
}

describe("TimeController (AC-2)", () => {
  test("à l'arrêt, le temps reste à 3 %", () => {
    const tc = new TimeController();
    runFor(tc, 2, still);
    expect(tc.scale).toBeCloseTo(TIME.min, 5);
  });

  test("en marchant, le temps dépasse 95 % en 0,3 s réelle", () => {
    const tc = new TimeController();
    runFor(tc, 0.3, walking);
    expect(tc.scale).toBeGreaterThanOrEqual(0.95);
  });

  test("à l'arrêt après la marche, le temps redescend sous 5 % en 0,5 s", () => {
    const tc = new TimeController();
    runFor(tc, 1, walking);
    runFor(tc, 0.5, still);
    expect(tc.scale).toBeLessThanOrEqual(0.05);
  });

  test("tourner la tête seule accélère peu le temps", () => {
    const tc = new TimeController();
    // 2 000 px/s de souris, bien au-delà du seuil.
    runFor(tc, 1, { ...still, lookPixels: 2000 / 60 });
    expect(tc.scale).toBeLessThanOrEqual(TIME.min + TIME.lookWeight + 1e-6);
    expect(tc.scale).toBeGreaterThan(TIME.min + 0.1);
  });

  test("une action donne un coup d'accélération bref", () => {
    const tc = new TimeController();
    tc.update(1 / 60, { ...still, action: true });
    runFor(tc, 0.1, still);
    const during = tc.scale;
    runFor(tc, 1, still);
    expect(during).toBeGreaterThan(0.3);
    expect(tc.scale).toBeLessThan(0.05);
  });

  test("le pas de simulation ne dépasse jamais 1/60 s", () => {
    const tc = new TimeController();
    runFor(tc, 1, walking, 1 / 20);
    expect(tc.update(1 / 20, walking)).toBeLessThanOrEqual(TIME.maxSimDt);
  });
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/time.test.ts`
Expected : FAIL, `Cannot find module '../src/sim/time'`.

- [ ] **Step 3 : écrire le code**

`src/sim/time.ts` :

```ts
// Contrôleur du temps : « le temps n'avance que quand tu bouges » (spec section 5.1).

export const TIME = {
  min: 0.03,
  lookWeight: 0.15,
  // Vitesse souris (pixels par seconde réelle) qui compte comme « regard plein ».
  lookThreshold: 800,
  // Décroissance du coup d'accélération : e^(-15 × 0,2 s) ≈ 5 % au bout de 0,2 s.
  actionDecayRate: 15,
  smoothing: 12,
  maxSimDt: 1 / 60,
} as const;

export interface TimeInput {
  // Vitesse horizontale voulue du joueur divisée par sa vitesse max, entre 0 et 1.
  moveAlpha: number;
  // Déplacement souris de l'image, en pixels (|dx| + |dy|).
  lookPixels: number;
  // Vrai à l'image où le joueur tire, frappe ou lance.
  action: boolean;
  // Vrai pendant la phase montante d'un saut.
  jumpRising: boolean;
}

export class TimeController {
  scale: number = TIME.min;
  private actionAlpha = 0;

  reset(): void {
    this.scale = TIME.min;
    this.actionAlpha = 0;
  }

  // Met à jour l'échelle et renvoie le pas de simulation de l'image.
  update(dtReal: number, input: TimeInput): number {
    if (input.action) this.actionAlpha = 1;
    else this.actionAlpha *= Math.exp(-TIME.actionDecayRate * dtReal);

    const lookRate = dtReal > 0 ? input.lookPixels / dtReal : 0;
    const lookAlpha = Math.min(1, lookRate / TIME.lookThreshold) * TIME.lookWeight;

    let raw = input.moveAlpha + lookAlpha + this.actionAlpha;
    raw = Math.min(1, Math.max(TIME.min, raw));
    if (input.jumpRising) raw = 1;

    this.scale += (raw - this.scale) * (1 - Math.exp(-TIME.smoothing * dtReal));
    return Math.min(dtReal * this.scale, TIME.maxSimDt);
  }
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `13 pass`, `0 fail`, `tsc` sans sortie.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/sim/time.ts tests/time.test.ts && git commit -m "feat(sim): add time controller (time moves only when you move)"
```

---

### Task 3 : entités, événements, éclats, navigation

**Files :**
- Create : `src/rooms/types.ts`, `src/sim/entities.ts`, `src/sim/events.ts`, `src/sim/shatter.ts`, `src/sim/nav.ts`
- Test : `tests/shatter-nav.test.ts`

**Interfaces :**
- Consumes (tâche 1) : `Vec3`, `vec3`, `set`, `copy`, `Aabb`, `Rng`.
- Produces :
  - **Salles :**
    - `RoomDefinition {id, title, boxes, rackBoxIndices, playerStart, playerYaw, startWithWeapon, spawns, nav}` ;
    - `EnemySpawn {pos, yaw, armed, mobile, trigger, burstBoxIndex?}`, `SpawnTrigger` ;
    - `NavGraph {nodes, edges}`, `RoomEntry {id, title, status, definition?}`.
  - **Entités :**
    - `PLAYER_ID` = 0, `NO_ID` = -1 ;
    - réglages `PLAYER`, `ENEMY`, `WEAPON`, `BULLET`, `POOLS` ;
    - types `Player`, `Enemy`, `EnemyState`, `Weapon`, `WeaponState`, `Bullet` ;
    - fabriques `createPlayer`, `createEnemy(id, navSize)`, `createWeapon(id)`, `createBullet` ;
    - `forwardFromAngles(out, yaw, pitch)` (lacet 0 = regarde vers -Z), `isAlive(enemy)`.
  - **Événements :**
    - `GameEventType`, `GameEvent {type, time, ownerId, targetId, pos, vel}` ;
    - `class EventQueue(capacity) { items; count; clear(); push(type, time, ownerId, targetId, pos, vel?) }` ;
    - `shatterSeed(targetId, time)`.
  - **Éclats :**
    - `SHATTER`, `ShardKind` (0 menace, 1 décor, 2 encre), `Shard` ;
    - `class ShatterSystem { shards; reset(); spawnBody(base, height, radius, impactVel, seed, kind); spawnBox(box, seed); step(dt) }`.
  - **Navigation :** `class Navigator(graph) { graph; nearestNode(p); findPath(from, to, out: Int32Array): number }`.

- [ ] **Step 1 : écrire le test qui échoue**

`tests/shatter-nav.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { Navigator } from "../src/sim/nav";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { vec3 } from "../src/sim/vec3";

describe("éclats", () => {
  test("un corps éclate en éclats qui tombent, rebondissent puis se figent au sol", () => {
    const shatter = new ShatterSystem();
    shatter.spawnBody(vec3(0, 0, 0), 1.8, 0.3, vec3(10, 0, 0), 123, 0);
    const active = shatter.shards.filter((s) => s.active);
    expect(active.length).toBe(SHATTER.shardsPerBody);
    for (let i = 0; i < 600; i++) shatter.step(1 / 60);
    for (const s of active) {
      expect(s.resting).toBe(true);
      expect(s.pos.y).toBeCloseTo(s.size * 0.5, 5);
    }
    // L'impact pousse les éclats dans son sens.
    const meanX = active.reduce((sum, s) => sum + s.pos.x, 0) / active.length;
    expect(meanX).toBeGreaterThan(1);
  });

  test("même graine, mêmes éclats : le replay reproduit l'éclatement", () => {
    const a = new ShatterSystem();
    const b = new ShatterSystem();
    a.spawnBody(vec3(1, 0, 2), 1.8, 0.3, vec3(0, 0, -5), 99, 0);
    b.spawnBody(vec3(1, 0, 2), 1.8, 0.3, vec3(0, 0, -5), 99, 0);
    for (let i = 0; i < 30; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.shards.map((s) => s.pos.x)).toEqual(b.shards.map((s) => s.pos.x));
  });

  test("le temps figé fige les éclats", () => {
    const shatter = new ShatterSystem();
    shatter.spawnBody(vec3(0, 0, 0), 1.8, 0.3, vec3(0, 0, 0), 5, 1);
    const before = shatter.shards[0]!.pos.y;
    shatter.step(0);
    expect(shatter.shards[0]!.pos.y).toBe(before);
  });
});

describe("navigation", () => {
  // Graphe en L : 0 - 1 - 2, et 2 - 3.
  const nav = new Navigator({
    nodes: [vec3(0, 0, 0), vec3(5, 0, 0), vec3(10, 0, 0), vec3(10, 0, 5)],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  });

  test("le chemin suit les arêtes du départ jusqu'au but, départ exclu", () => {
    const out = new Int32Array(4);
    const length = nav.findPath(vec3(0.2, 0, 0), vec3(10, 0, 4.8), out);
    expect(Array.from(out.slice(0, length))).toEqual([1, 2, 3]);
  });

  test("déjà sur le nœud du but : un seul point", () => {
    const out = new Int32Array(4);
    expect(nav.findPath(vec3(10, 0, 5), vec3(10.1, 0, 5), out)).toBe(1);
  });
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/shatter-nav.test.ts`
Expected : FAIL, `Cannot find module '../src/sim/nav'`.

- [ ] **Step 3 : écrire le code**

`src/rooms/types.ts` :

```ts
// Format d'une salle : une salle = un module de données (spec section 9.1).
import type { Aabb } from "../sim/geometry";
import type { Vec3 } from "../sim/vec3";

export type SpawnTrigger = { kind: "start" } | { kind: "remaining"; count: number };

export interface EnemySpawn {
  pos: Vec3;
  // Lacet en radians : 0 regarde vers -Z.
  yaw: number;
  armed: boolean;
  // Faux : l'ennemi reste à son poste (passerelle).
  mobile: boolean;
  trigger: SpawnTrigger;
  // Index de la boîte (baie) qui explose à l'apparition.
  burstBoxIndex?: number;
}

export interface NavGraph {
  nodes: Vec3[];
  edges: [number, number][];
}

export interface RoomDefinition {
  id: string;
  title: string;
  boxes: Aabb[];
  // Indices des boîtes dessinées comme baies de serveurs (instanciées au rendu).
  rackBoxIndices: number[];
  playerStart: Vec3;
  playerYaw: number;
  startWithWeapon: boolean;
  spawns: EnemySpawn[];
  nav: NavGraph;
}

export interface RoomEntry {
  id: string;
  title: string;
  status: "playable" | "locked";
  definition?: RoomDefinition;
}
```

`src/sim/entities.ts` :

```ts
// Entités de la simulation et leurs réglages (spec sections 5.2 à 5.6).
import { type Vec3, vec3 } from "./vec3";

export const PLAYER_ID = 0;
export const NO_ID = -1;

export const PLAYER = {
  speed: 4.2,
  jumpSpeed: 5.5,
  gravity: 9.81,
  radius: 0.3,
  height: 1.8,
  crouchHeight: 0.95,
  eyeStand: 1.7,
  eyeCrouch: 0.85,
  // Hauteur du torse, pour la capture d'arme au vol.
  chest: 1.2,
  punchRange: 1.6,
  pickupRange: 2,
  catchRadius: 0.9,
  throwSpeed: 22,
  throwLift: 1,
  fireCooldown: 0.45,
  maxPitch: Math.PI / 2 - 0.05,
} as const;

export const ENEMY = {
  speed: 3.2,
  radius: 0.3,
  height: 1.8,
  eyeHeight: 1.55,
  muzzleHeight: 1.4,
  handHeight: 1.3,
  aimTime: 0.4,
  cooldown: 0.9,
  staggerTime: 1.5,
  fireRange: 8,
  meleeRange: 1.2,
  meleeWindup: 0.35,
  repathInterval: 0.5,
  // Distance à laquelle un nœud du chemin est considéré atteint.
  waypointReach: 0.4,
  // Arme éjectée : vitesse vers le haut, puis vers celui qui a frappé.
  ejectUp: 4.5,
  ejectToward: 1.5,
} as const;

export const WEAPON = {
  capacity: 4,
  radius: 0.15,
  gravity: 9.81,
  spin: 15,
  // Délai avant que le joueur puisse rattraper sa propre arme lancée.
  catchGrace: 0.25,
  bounceDamping: 0.4,
} as const;

export const BULLET = {
  speed: 45,
  radius: 0.04,
  maxLife: 4,
  // Recul du point de départ devant l'œil ou le canon, pour ne pas toucher le tireur.
  muzzleOffset: 0.4,
} as const;

export const POOLS = {
  enemies: 8,
  weapons: 8,
  bullets: 32,
} as const;

export interface Player {
  pos: Vec3;
  // Vitesse horizontale réelle (m/s) et vitesse verticale.
  vel: Vec3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  crouching: boolean;
  alive: boolean;
  weaponId: number;
  fireCooldown: number;
}

export type EnemyState = "inactive" | "approach" | "aim" | "cooldown" | "stagger" | "windup" | "dead";

export interface Enemy {
  id: number;
  state: EnemyState;
  pos: Vec3;
  yaw: number;
  mobile: boolean;
  weaponId: number;
  stateTime: number;
  aimPoint: Vec3;
  path: Int32Array;
  pathLength: number;
  pathIndex: number;
  repathTimer: number;
}

export type WeaponState = "free" | "held" | "flying" | "ground";

export interface Weapon {
  id: number;
  state: WeaponState;
  holderId: number;
  ammo: number;
  pos: Vec3;
  vel: Vec3;
  angle: number;
  bounced: boolean;
  thrownBy: number;
  flightTime: number;
}

export interface Bullet {
  active: boolean;
  ownerId: number;
  pos: Vec3;
  vel: Vec3;
  life: number;
}

export function createPlayer(): Player {
  return {
    pos: vec3(),
    vel: vec3(),
    yaw: 0,
    pitch: 0,
    onGround: true,
    crouching: false,
    alive: true,
    weaponId: NO_ID,
    fireCooldown: 0,
  };
}

export function createEnemy(id: number, navSize: number): Enemy {
  return {
    id,
    state: "inactive",
    pos: vec3(),
    yaw: 0,
    mobile: true,
    weaponId: NO_ID,
    stateTime: 0,
    aimPoint: vec3(),
    path: new Int32Array(Math.max(1, navSize)),
    pathLength: 0,
    pathIndex: 0,
    repathTimer: 0,
  };
}

export function createWeapon(id: number): Weapon {
  return {
    id,
    state: "free",
    holderId: NO_ID,
    ammo: 0,
    pos: vec3(),
    vel: vec3(),
    angle: 0,
    bounced: false,
    thrownBy: NO_ID,
    flightTime: 0,
  };
}

export function createBullet(): Bullet {
  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), life: 0 };
}

// Direction du regard : lacet 0 = -Z, tangage positif = vers le haut.
export function forwardFromAngles(out: Vec3, yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  out.x = -Math.sin(yaw) * cp;
  out.y = Math.sin(pitch);
  out.z = -Math.cos(yaw) * cp;
  return out;
}

export function isAlive(e: Enemy): boolean {
  return e.state !== "inactive" && e.state !== "dead";
}
```

`src/sim/events.ts` :

```ts
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
```

`src/sim/shatter.ts` :

```ts
// Éclats de verre : données seulement, le rendu les dessine en InstancedMesh (spec section 5.8).
import type { Aabb } from "./geometry";
import { Rng } from "./rng";
import { type Vec3, set, vec3 } from "./vec3";

export const SHATTER = {
  capacity: 320,
  shardsPerBody: 36,
  shardsPerBox: 24,
  gravity: 9.81,
  restitution: 0.3,
  friction: 0.5,
  // Force de dispersion aléatoire, en m/s.
  spread: 3,
  impactShare: 0.6,
} as const;

// 0 = menace (orange), 1 = décor (blanc), 2 = encre (joueur).
export type ShardKind = 0 | 1 | 2;

export interface Shard {
  active: boolean;
  resting: boolean;
  bounced: boolean;
  kind: ShardKind;
  size: number;
  pos: Vec3;
  vel: Vec3;
  axis: Vec3;
  angle: number;
  angVel: number;
}

export class ShatterSystem {
  readonly shards: Shard[] = [];
  private cursor = 0;
  private readonly rng = new Rng();

  constructor() {
    for (let i = 0; i < SHATTER.capacity; i++) {
      this.shards.push({
        active: false,
        resting: false,
        bounced: false,
        kind: 0,
        size: 0,
        pos: vec3(),
        vel: vec3(),
        axis: vec3(0, 1, 0),
        angle: 0,
        angVel: 0,
      });
    }
  }

  reset(): void {
    for (const s of this.shards) s.active = false;
    this.cursor = 0;
  }

  // Fait éclater un corps (capsule verticale posée sur `base`).
  spawnBody(base: Vec3, height: number, radius: number, impactVel: Vec3, seed: number, kind: ShardKind): void {
    this.rng.reset(seed);
    for (let i = 0; i < SHATTER.shardsPerBody; i++) {
      const s = this.take();
      const a = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(0, radius);
      set(s.pos, base.x + Math.cos(a) * r, base.y + this.rng.range(0.1, height), base.z + Math.sin(a) * r);
      this.launch(s, impactVel, kind, this.rng.range(0.05, 0.14));
    }
  }

  // Fait éclater une boîte du décor (baie de serveurs qui explose).
  spawnBox(box: Aabb, seed: number): void {
    this.rng.reset(seed);
    set(tmpVel, 0, 0, 0);
    for (let i = 0; i < SHATTER.shardsPerBox; i++) {
      const s = this.take();
      set(
        s.pos,
        this.rng.range(box.min.x, box.max.x),
        this.rng.range(box.min.y, box.max.y),
        this.rng.range(box.min.z, box.max.z),
      );
      this.launch(s, tmpVel, 1, this.rng.range(0.1, 0.25));
    }
  }

  step(dt: number): void {
    if (dt <= 0) return;
    for (const s of this.shards) {
      if (!s.active || s.resting) continue;
      s.vel.y -= SHATTER.gravity * dt;
      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;
      s.pos.z += s.vel.z * dt;
      s.angle += s.angVel * dt;
      if (s.pos.y <= s.size * 0.5 && s.vel.y < 0) {
        s.pos.y = s.size * 0.5;
        if (!s.bounced) {
          s.bounced = true;
          s.vel.y = -s.vel.y * SHATTER.restitution;
          s.vel.x *= SHATTER.friction;
          s.vel.z *= SHATTER.friction;
          s.angVel *= SHATTER.friction;
        } else {
          // Deuxième contact : l'éclat se fige pour libérer le processeur.
          s.resting = true;
          set(s.vel, 0, 0, 0);
          s.angVel = 0;
        }
      }
    }
  }

  private take(): Shard {
    const s = this.shards[this.cursor]!;
    this.cursor = (this.cursor + 1) % this.shards.length;
    return s;
  }

  private launch(s: Shard, impactVel: Vec3, kind: ShardKind, size: number): void {
    s.active = true;
    s.resting = false;
    s.bounced = false;
    s.kind = kind;
    s.size = size;
    // Direction aléatoire uniforme sur la sphère.
    const u = this.rng.range(-1, 1);
    const phi = this.rng.range(0, Math.PI * 2);
    const k = Math.sqrt(1 - u * u);
    const force = this.rng.range(0.3, 1) * SHATTER.spread;
    set(
      s.vel,
      impactVel.x * SHATTER.impactShare + k * Math.cos(phi) * force,
      impactVel.y * SHATTER.impactShare + Math.abs(u) * force,
      impactVel.z * SHATTER.impactShare + k * Math.sin(phi) * force,
    );
    set(s.axis, this.rng.range(-1, 1), this.rng.range(-1, 1), this.rng.range(-1, 1));
    const len = Math.hypot(s.axis.x, s.axis.y, s.axis.z) || 1;
    s.axis.x /= len;
    s.axis.y /= len;
    s.axis.z /= len;
    s.angle = this.rng.range(0, Math.PI * 2);
    s.angVel = this.rng.range(-12, 12);
  }
}

const tmpVel = vec3();
```

`src/sim/nav.ts` :

```ts
// Navigation des ennemis : plus court chemin (en nombre d'arêtes) sur le graphe de la salle.
import type { NavGraph } from "../rooms/types";
import type { Vec3 } from "./vec3";

export class Navigator {
  private readonly adjacency: number[][];
  private readonly queue: Int32Array;
  private readonly parent: Int32Array;
  readonly graph: NavGraph;

  constructor(graph: NavGraph) {
    this.graph = graph;
    const n = graph.nodes.length;
    this.adjacency = graph.nodes.map(() => []);
    for (const [a, b] of graph.edges) {
      this.adjacency[a]!.push(b);
      this.adjacency[b]!.push(a);
    }
    this.queue = new Int32Array(n);
    this.parent = new Int32Array(n);
  }

  nearestNode(p: Vec3): number {
    let best = -1;
    let bestDist = Infinity;
    const nodes = this.graph.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i]!.x - p.x;
      const dz = nodes[i]!.z - p.z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  // Écrit le chemin (indices de nœuds, départ exclu) dans `out`. Renvoie sa longueur.
  findPath(from: Vec3, to: Vec3, out: Int32Array): number {
    const start = this.nearestNode(from);
    const goal = this.nearestNode(to);
    if (start < 0 || goal < 0) return 0;
    if (start === goal) {
      out[0] = goal;
      return 1;
    }
    this.parent.fill(-1);
    this.parent[start] = start;
    let head = 0;
    let tail = 0;
    this.queue[tail++] = start;
    while (head < tail) {
      const node = this.queue[head++]!;
      if (node === goal) break;
      for (const next of this.adjacency[node]!) {
        if (this.parent[next] !== -1) continue;
        this.parent[next] = node;
        this.queue[tail++] = next;
      }
    }
    if (this.parent[goal] === -1) return 0;
    // Remonte du but vers le départ, puis inverse dans `out`.
    let length = 0;
    for (let node = goal; node !== start; node = this.parent[node]!) length++;
    let i = length - 1;
    for (let node = goal; node !== start; node = this.parent[node]!) out[i--] = node;
    return Math.min(length, out.length);
  }
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `18 pass`, `0 fail`, `tsc` sans sortie.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/rooms/types.ts src/sim/entities.ts src/sim/events.ts src/sim/shatter.ts src/sim/nav.ts tests/shatter-nav.test.ts && git commit -m "feat(sim): add entities, event queue, glass shatter and navigation"
```

---

### Task 4 : la simulation de combat (AC-1, AC-3, AC-4)

Ces quatre fichiers s'appellent entre eux : `game.ts` ordonne les trois systèmes, qui rappellent `Game`. Ils forment une seule unité testable.

**Files :**
- Create : `src/sim/game.ts`, `src/sim/player-system.ts`, `src/sim/enemy-system.ts`, `src/sim/projectile-system.ts`
- Test : `tests/helpers.ts`, `tests/ballistics.test.ts`, `tests/combat.test.ts`

**Interfaces :**
- Consumes : tout ce que produisent les tâches 1 à 3.
- Produces :
  - `PlayerInput {moveX, moveZ, lookDX, lookDY, lookPixels, jump, crouch, fire, throw, use}` et `emptyInput()` ;
  - `GameStatus` : `"playing" | "dead" | "won"`.
  - `class Game(room)`, avec :
    - l'état : `time`, `events`, `shatter`, `nav`, `player`, `enemies`, `weapons`, `bullets`, `boxEnabled`, `status`, `simTime`, `realTime`, `room` ;
    - `reset()` et `step(dtReal, input): number` ;
    - les actions : `aliveEnemyCount()`, `allocateWeapon()`, `giveWeapon(w, holderId)`, `spawnBullet(origin, dir, ownerId)`, `killEnemy(e, impactVel)`, `staggerEnemy(e, striker)`, `killPlayer(impactVel)`.
  - Depuis les systèmes :
    - `updatePlayer(game, dtReal, input): number` ; `eyeHeight(game)`, `playerEye(game, out?)` ;
    - `updateEnemies(game, dt)` ;
    - `updateBullets(game, dt)`, `updateWeapons(game, dt)`.
  - Pour les tests : `testRoom(spawns, startWithWeapon?)`, `enemyAt(x, z, armed?, mobile?)`, `input(overrides)`, `run(game, script, until, maxSeconds, dt?)`, `FRAME`.

**Règles de jeu codées ici :** spec 5.2 à 5.6, avec les révisions du 2026-09-29.
- Une arme garde ses balles quand on la reprend.
- L'arme lancée tombe aux pieds de l'ennemi touché.
- L'arme de l'ennemi part vers celui qui l'a frappé.
- Entre deux armes à portée, on attrape la plus chargée.

- [ ] **Step 1 : écrire les tests qui échouent**

`tests/helpers.ts` :

```ts
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
```

`tests/ballistics.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { BULLET, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { Rng } from "../src/sim/rng";
import { updateBullets, updateWeapons } from "../src/sim/projectile-system";
import { normalize, vec3 } from "../src/sim/vec3";
import { enemyAt, input, run, testRoom } from "./helpers";

describe("balles (AC-3)", () => {
  test("1 000 balles à 45 m/s ne traversent jamais un mur de 5 cm", () => {
    const room = testRoom([]);
    // Mur fin en x = 0, largement plus grand que la zone de tir.
    room.boxes.push(aabb(-0.025, 0, -10, 0.025, 5, 10));
    const game = new Game(room);
    const rng = new Rng(42);
    const origin = vec3();
    const dir = vec3();
    let crossings = 0;
    let impacts = 0;
    for (let shot = 0; shot < 1000; shot++) {
      for (const b of game.bullets) b.active = false;
      origin.x = -rng.range(0.5, 8);
      origin.y = rng.range(0.5, 4);
      origin.z = rng.range(-5, 5);
      dir.x = 1;
      dir.y = rng.range(-0.1, 0.1);
      dir.z = rng.range(-0.3, 0.3);
      normalize(dir, dir);
      game.spawnBullet(origin, dir, PLAYER_ID);
      const bullet = game.bullets.find((b) => b.active)!;
      const dt = rng.range(1 / 240, 1 / 30);
      for (let i = 0; i < 200 && bullet.active; i++) {
        game.events.clear();
        updateBullets(game, dt);
        for (let k = 0; k < game.events.count; k++) if (game.events.items[k]!.type === "bulletImpact") impacts++;
      }
      if (bullet.pos.x > 0.025 + BULLET.radius) crossings++;
    }
    expect(crossings).toBe(0);
    expect(impacts).toBe(1000);
  });

  test("une balle du joueur tue un ennemi sur sa trajectoire", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    const log = run(game, (frame) => input({ fire: frame === 0 }), (g) => g.status !== "playing", 5);
    expect(log.some((e) => e.type === "enemyKilled")).toBe(true);
    expect(game.status).toBe("won");
  });

  test("un chargeur vide fait un clic sec, sans balle", () => {
    const game = new Game(testRoom([enemyAt(10, -14)]));
    const weapon = game.weapons[game.player.weaponId]!;
    weapon.ammo = 0;
    game.step(1 / 60, input({ fire: true }));
    const types = Array.from({ length: game.events.count }, (_, i) => game.events.items[i]!.type);
    expect(types).toContain("dryFire");
    expect(types).not.toContain("shot");
    expect(game.bullets.every((b) => !b.active || b.ownerId !== PLAYER_ID)).toBe(true);
  });

  test("une arme qui retombe sur la passerelle s'y pose, au lieu de rester coincée en vol", () => {
    const room = testRoom([]);
    const catwalk = aabb(-2, 3.4, -2, 2, 3.5, 2);
    room.boxes.push(catwalk);
    const game = new Game(room);
    const w = game.allocateWeapon()!;
    w.state = "flying";
    w.pos.x = 0;
    w.pos.y = 4.5;
    w.pos.z = 0;
    w.vel.x = 0.5;
    w.vel.y = -2;
    w.vel.z = 0;
    for (let i = 0; i < 120; i++) updateWeapons(game, 1 / 60);
    expect(game.weapons[w.id]!.state).toBe("ground");
    expect(w.pos.y).toBeCloseTo(catwalk.max.y + 0.15, 5);
  });
});
```

`tests/combat.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { NO_ID, PLAYER_ID, WEAPON } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { enemyAt, input, run, testRoom } from "./helpers";

describe("le temps vu par une balle ennemie (AC-1)", () => {
  test("joueur immobile : une balle tirée à 7,9 m (portée max) met au moins 5 s réelles à arriver", () => {
    const game = new Game(testRoom([enemyAt(0, -7.9)]));
    const log = run(game, () => input(), (g) => g.status === "dead", 120);
    const shot = log.find((e) => e.type === "shot" && e.ownerId !== PLAYER_ID);
    const death = log.find((e) => e.type === "playerKilled");
    expect(shot).toBeDefined();
    expect(death).toBeDefined();
    expect(death!.realTime - shot!.realTime).toBeGreaterThanOrEqual(5);
  });
});

describe("désarmement et capture (AC-4)", () => {
  test("lancer l'arme fait vaciller l'ennemi, son arme se rattrape en vol, pleine, et tire", () => {
    const game = new Game(testRoom([enemyAt(0, -5)]));
    // Cas réel : le joueur lance son pistolet vide.
    game.weapons[game.player.weaponId]!.ammo = 0;
    let phase: "throw" | "wait" | "walk" | "fire" | "done" = "throw";
    let caughtAmmo = -1;
    const enemyWeaponId = game.enemies[0]!.weaponId;
    let stateBeforeCatch = "";
    const log = run(
      game,
      (_, g) => {
        if (phase === "throw") {
          phase = "wait";
          return input({ throw: true });
        }
        if (phase === "wait") {
          if (g.enemies[0]!.state === "stagger") phase = "walk";
          return input();
        }
        if (phase === "walk") {
          if (g.player.weaponId !== NO_ID) {
            caughtAmmo = g.weapons[g.player.weaponId]!.ammo;
            phase = "fire";
            return input();
          }
          stateBeforeCatch = g.weapons[enemyWeaponId]!.state;
          return input({ moveZ: 1 });
        }
        if (phase === "fire") {
          phase = "done";
          return input({ fire: true });
        }
        return input();
      },
      (_, l) => phase === "done" && l.some((e) => e.type === "shot" && e.ownerId === PLAYER_ID),
      30,
    );
    expect(log.some((e) => e.type === "enemyStaggered")).toBe(true);
    const caught = log.find((e) => e.type === "weaponPicked");
    expect(caught).toBeDefined();
    // Captée en vol : c'est l'arme de l'ennemi, et elle volait encore juste avant la prise.
    expect(game.player.weaponId).toBe(enemyWeaponId);
    expect(stateBeforeCatch).toBe("flying");
    expect(caughtAmmo).toBe(WEAPON.capacity);
    expect(log.some((e) => e.type === "shot" && e.ownerId === PLAYER_ID)).toBe(true);
  });

  test("coup de poing : le 1er fait vaciller et désarme, le 2e fait éclater", () => {
    const game = new Game(testRoom([enemyAt(0, -1.2)], false));
    game.step(1 / 60, input({ fire: true }));
    const enemy = game.enemies[0]!;
    expect(enemy.state).toBe("stagger");
    expect(enemy.weaponId).toBe(NO_ID);
    game.step(1 / 60, input({ fire: true }));
    expect(enemy.state).toBe("dead");
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/ballistics.test.ts tests/combat.test.ts`
Expected : FAIL, `Cannot find module '../src/sim/game'`.

- [ ] **Step 3 : écrire le code**

`src/sim/game.ts` :

```ts
// Boucle de simulation d'une salle : ordonne les systèmes, porte l'état partagé.
import type { RoomDefinition } from "../rooms/types";
import { updateEnemies } from "./enemy-system";
import {
  BULLET,
  type Bullet,
  ENEMY,
  type Enemy,
  NO_ID,
  PLAYER,
  PLAYER_ID,
  POOLS,
  type Player,
  WEAPON,
  type Weapon,
  createBullet,
  createEnemy,
  createPlayer,
  createWeapon,
  isAlive,
} from "./entities";
import { EventQueue, shatterSeed } from "./events";
import { Navigator } from "./nav";
import { updatePlayer } from "./player-system";
import { updateBullets, updateWeapons } from "./projectile-system";
import { ShatterSystem } from "./shatter";
import { TimeController } from "./time";
import { type Vec3, copy, normalize, scale, set, sub, vec3 } from "./vec3";

export interface PlayerInput {
  // Déplacement voulu dans le repère du joueur, entre -1 et 1 (moveZ > 0 = avancer).
  moveX: number;
  moveZ: number;
  // Rotation de la caméra de l'image, en radians (sensibilité déjà appliquée).
  lookDX: number;
  lookDY: number;
  // Déplacement souris brut de l'image, en pixels (|dx| + |dy|), pour le temps.
  lookPixels: number;
  jump: boolean;
  crouch: boolean;
  // Vrais seulement à l'image de l'appui.
  fire: boolean;
  throw: boolean;
  use: boolean;
}

export function emptyInput(): PlayerInput {
  return {
    moveX: 0,
    moveZ: 0,
    lookDX: 0,
    lookDY: 0,
    lookPixels: 0,
    jump: false,
    crouch: false,
    fire: false,
    throw: false,
    use: false,
  };
}

export type GameStatus = "playing" | "dead" | "won";

const tmpDir = vec3();
const tmpBase = vec3();

export class Game {
  readonly time = new TimeController();
  readonly events = new EventQueue(128);
  readonly shatter = new ShatterSystem();
  readonly nav: Navigator;
  readonly player: Player = createPlayer();
  readonly enemies: Enemy[] = [];
  readonly weapons: Weapon[] = [];
  readonly bullets: Bullet[] = [];
  readonly boxEnabled: boolean[];
  status: GameStatus = "playing";
  simTime = 0;
  realTime = 0;
  // Apparitions pas encore déclenchées (indices dans room.spawns).
  private readonly pendingSpawns: boolean[];
  readonly room: RoomDefinition;

  constructor(room: RoomDefinition) {
    this.room = room;
    this.nav = new Navigator(room.nav);
    for (let i = 0; i < POOLS.enemies; i++) this.enemies.push(createEnemy(i + 1, room.nav.nodes.length));
    for (let i = 0; i < POOLS.weapons; i++) this.weapons.push(createWeapon(i));
    for (let i = 0; i < POOLS.bullets; i++) this.bullets.push(createBullet());
    this.boxEnabled = room.boxes.map(() => true);
    this.pendingSpawns = room.spawns.map(() => true);
    this.reset();
  }

  // Remet la salle à zéro sans rien allouer (relance en moins de 50 ms).
  reset(): void {
    const p = this.player;
    copy(p.pos, this.room.playerStart);
    set(p.vel, 0, 0, 0);
    p.yaw = this.room.playerYaw;
    p.pitch = 0;
    p.onGround = true;
    p.crouching = false;
    p.alive = true;
    p.weaponId = NO_ID;
    p.fireCooldown = 0;
    for (const e of this.enemies) e.state = "inactive";
    for (const w of this.weapons) w.state = "free";
    for (const b of this.bullets) b.active = false;
    for (let i = 0; i < this.boxEnabled.length; i++) this.boxEnabled[i] = true;
    for (let i = 0; i < this.pendingSpawns.length; i++) this.pendingSpawns[i] = true;
    this.shatter.reset();
    this.time.reset();
    this.events.clear();
    this.status = "playing";
    this.simTime = 0;
    this.realTime = 0;
    if (this.room.startWithWeapon) {
      const w = this.allocateWeapon();
      if (w) this.giveWeapon(w, PLAYER_ID);
    }
    this.triggerSpawns();
  }

  // Avance le jeu d'une image. Renvoie le pas de simulation utilisé.
  step(dtReal: number, input: PlayerInput): number {
    this.events.clear();
    if (this.status !== "playing") return 0;
    const simDt = updatePlayer(this, dtReal, input);
    this.simTime += simDt;
    this.realTime += dtReal;
    this.triggerSpawns();
    updateEnemies(this, simDt);
    updateWeapons(this, simDt);
    updateBullets(this, simDt);
    this.shatter.step(simDt);
    if (this.status === "playing" && this.allEnemiesDown()) this.status = "won";
    return simDt;
  }

  aliveEnemyCount(): number {
    let n = 0;
    for (const e of this.enemies) if (isAlive(e)) n++;
    return n;
  }

  // Une arme neuve (départ du joueur, apparition d'un ennemi) sort pleine.
  allocateWeapon(): Weapon | null {
    for (const w of this.weapons) {
      if (w.state !== "free") continue;
      w.ammo = WEAPON.capacity;
      return w;
    }
    return null;
  }

  // L'arme garde ses balles : une arme vidée puis reprise reste vide.
  giveWeapon(w: Weapon, holderId: number): void {
    w.state = "held";
    w.holderId = holderId;
    w.bounced = false;
    w.thrownBy = NO_ID;
    w.flightTime = 0;
    set(w.vel, 0, 0, 0);
    if (holderId === PLAYER_ID) this.player.weaponId = w.id;
    else this.enemies[holderId - 1]!.weaponId = w.id;
  }

  // Tire une balle depuis `origin` vers `dir` (normalisée).
  spawnBullet(origin: Vec3, dir: Vec3, ownerId: number): void {
    for (const b of this.bullets) {
      if (b.active) continue;
      b.active = true;
      b.ownerId = ownerId;
      b.life = 0;
      b.pos.x = origin.x + dir.x * BULLET.muzzleOffset;
      b.pos.y = origin.y + dir.y * BULLET.muzzleOffset;
      b.pos.z = origin.z + dir.z * BULLET.muzzleOffset;
      scale(b.vel, dir, BULLET.speed);
      this.events.push("shot", this.simTime, ownerId, NO_ID, b.pos, b.vel);
      return;
    }
  }

  killEnemy(e: Enemy, impactVel: Vec3): void {
    if (!isAlive(e)) return;
    e.state = "dead";
    this.dropEnemyWeapon(e, e.pos, 0.3);
    this.events.push("enemyKilled", this.simTime, NO_ID, e.id, e.pos, impactVel);
    this.shatter.spawnBody(e.pos, ENEMY.height, ENEMY.radius, impactVel, shatterSeed(e.id, this.simTime), 0);
  }

  // Fait vaciller un ennemi : son arme saute vers `striker`.
  staggerEnemy(e: Enemy, striker: Vec3): void {
    if (!isAlive(e)) return;
    e.state = "stagger";
    e.stateTime = 0;
    this.dropEnemyWeapon(e, striker, ENEMY.ejectToward);
    this.events.push("enemyStaggered", this.simTime, NO_ID, e.id, e.pos);
  }

  killPlayer(impactVel: Vec3): void {
    const p = this.player;
    if (!p.alive) return;
    p.alive = false;
    this.status = "dead";
    this.events.push("playerKilled", this.simTime, NO_ID, PLAYER_ID, p.pos, impactVel);
    this.shatter.spawnBody(p.pos, PLAYER.height, PLAYER.radius, impactVel, shatterSeed(PLAYER_ID, this.simTime), 2);
  }

  private dropEnemyWeapon(e: Enemy, toward: Vec3, horizontalSpeed: number): void {
    if (e.weaponId === NO_ID) return;
    const w = this.weapons[e.weaponId]!;
    e.weaponId = NO_ID;
    w.state = "flying";
    w.holderId = NO_ID;
    w.thrownBy = NO_ID;
    w.bounced = false;
    w.flightTime = 0;
    set(w.pos, e.pos.x, e.pos.y + ENEMY.handHeight, e.pos.z);
    sub(tmpDir, toward, e.pos);
    tmpDir.y = 0;
    normalize(tmpDir, tmpDir);
    set(w.vel, tmpDir.x * horizontalSpeed, ENEMY.ejectUp, tmpDir.z * horizontalSpeed);
  }

  // Apparitions du départ d'abord, puis celles qui attendent « il reste n ennemis ».
  private triggerSpawns(): void {
    const spawns = this.room.spawns;
    for (let i = 0; i < spawns.length; i++) {
      if (this.pendingSpawns[i] && spawns[i]!.trigger.kind === "start") this.spawnEnemy(i);
    }
    const alive = this.aliveEnemyCount();
    for (let i = 0; i < spawns.length; i++) {
      const trigger = spawns[i]!.trigger;
      if (this.pendingSpawns[i] && trigger.kind === "remaining" && alive <= trigger.count) this.spawnEnemy(i);
    }
  }

  private spawnEnemy(spawnIndex: number): void {
    const spawn = this.room.spawns[spawnIndex]!;
    let e: Enemy | undefined;
    for (const candidate of this.enemies) {
      if (candidate.state === "inactive") {
        e = candidate;
        break;
      }
    }
    if (!e) return;
    this.pendingSpawns[spawnIndex] = false;
    copy(e.pos, spawn.pos);
    e.yaw = spawn.yaw;
    e.mobile = spawn.mobile;
    e.state = "approach";
    e.stateTime = 0;
    e.weaponId = NO_ID;
    e.pathLength = 0;
    e.pathIndex = 0;
    e.repathTimer = 0;
    if (spawn.armed) {
      const w = this.allocateWeapon();
      if (w) this.giveWeapon(w, e.id);
    }
    if (spawn.burstBoxIndex !== undefined) {
      this.boxEnabled[spawn.burstBoxIndex] = false;
      const box = this.room.boxes[spawn.burstBoxIndex]!;
      set(tmpBase, (box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
      this.events.push("rackBurst", this.simTime, NO_ID, spawn.burstBoxIndex, tmpBase);
      this.shatter.spawnBox(box, shatterSeed(1000 + spawn.burstBoxIndex, this.simTime));
    }
    this.events.push("enemySpawned", this.simTime, NO_ID, e.id, e.pos);
  }

  private allEnemiesDown(): boolean {
    for (const pending of this.pendingSpawns) if (pending) return false;
    return this.aliveEnemyCount() === 0;
  }
}
```

`src/sim/player-system.ts` :

```ts
// Le joueur vit en temps réel : regard, déplacement, saut, actions (spec section 5.2).
import { ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, type Weapon, forwardFromAngles, isAlive } from "./entities";
import type { Game, PlayerInput } from "./game";
import { pushCircleOutOfAabbs, sweepSphereCapsule } from "./geometry";
import { addScaled, distance, set, vec3 } from "./vec3";

const forward = vec3();
const eye = vec3();
const chest = vec3();
const reach = vec3();
const punchVel = vec3();

export function eyeHeight(game: Game): number {
  return game.player.crouching ? PLAYER.eyeCrouch : PLAYER.eyeStand;
}

export function playerEye(game: Game, out = eye): typeof eye {
  const p = game.player;
  return set(out, p.pos.x, p.pos.y + eyeHeight(game), p.pos.z);
}

export function updatePlayer(game: Game, dtReal: number, input: PlayerInput): number {
  const p = game.player;

  // Regard : immédiat, jamais ralenti.
  p.yaw -= input.lookDX;
  p.pitch = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, p.pitch - input.lookDY));

  p.crouching = input.crouch;
  if (input.jump && p.onGround) {
    p.vel.y = PLAYER.jumpSpeed;
    p.onGround = false;
  }

  const moveLen = Math.min(1, Math.hypot(input.moveX, input.moveZ));
  const acting = input.fire || (input.throw && p.weaponId !== NO_ID);
  const simDt = game.time.update(dtReal, {
    moveAlpha: moveLen,
    lookPixels: input.lookPixels,
    action: acting,
    jumpRising: !p.onGround && p.vel.y > 0,
  });

  // Déplacement horizontal dans le repère du regard (lacet seul).
  const sin = Math.sin(p.yaw);
  const cos = Math.cos(p.yaw);
  let mx = 0;
  let mz = 0;
  if (moveLen > 0) {
    const k = moveLen / Math.hypot(input.moveX, input.moveZ);
    const fx = input.moveZ * k;
    const sx = input.moveX * k;
    // Avant = (-sin, -cos), droite = (cos, -sin).
    mx = -sin * fx + cos * sx;
    mz = -cos * fx - sin * sx;
  }
  p.vel.x = mx * PLAYER.speed;
  p.vel.z = mz * PLAYER.speed;
  p.pos.x += p.vel.x * dtReal;
  p.pos.z += p.vel.z * dtReal;

  // Vertical : gravité réelle, sol à y = 0.
  if (!p.onGround) {
    p.vel.y -= PLAYER.gravity * dtReal;
    p.pos.y += p.vel.y * dtReal;
    if (p.pos.y <= 0) {
      p.pos.y = 0;
      p.vel.y = 0;
      p.onGround = true;
    }
  }
  const height = p.crouching ? PLAYER.crouchHeight : PLAYER.height;
  pushCircleOutOfAabbs(p.pos, PLAYER.radius, height, game.room.boxes, game.boxEnabled);

  // Le cooldown de tir compte en temps de simulation : il faut bouger pour recharger.
  p.fireCooldown = Math.max(0, p.fireCooldown - simDt);

  if (input.fire) fireOrPunch(game);
  if (input.throw) throwWeapon(game);
  if (input.use) pickUpNearest(game);
  catchFlyingWeapons(game);
  return simDt;
}

function fireOrPunch(game: Game): void {
  const p = game.player;
  playerEye(game);
  forwardFromAngles(forward, p.yaw, p.pitch);
  if (p.weaponId === NO_ID) {
    punch(game);
    return;
  }
  if (p.fireCooldown > 0) return;
  const w = game.weapons[p.weaponId]!;
  if (w.ammo <= 0) {
    game.events.push("dryFire", game.simTime, PLAYER_ID, NO_ID, eye);
    return;
  }
  w.ammo--;
  p.fireCooldown = PLAYER.fireCooldown;
  game.spawnBullet(eye, forward, PLAYER_ID);
}

function punch(game: Game): void {
  addScaled(reach, eye, forward, PLAYER.punchRange);
  game.events.push("punch", game.simTime, PLAYER_ID, NO_ID, eye);
  let best = -1;
  let bestT = 2;
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i]!;
    if (!isAlive(e)) continue;
    const t = sweepSphereCapsule(eye, reach, 0.1, e.pos, ENEMY.height, ENEMY.radius);
    if (t >= 0 && t < bestT) {
      bestT = t;
      best = i;
    }
  }
  if (best < 0) return;
  const e = game.enemies[best]!;
  if (e.weaponId !== NO_ID && e.state !== "stagger") {
    game.staggerEnemy(e, game.player.pos);
  } else {
    set(punchVel, forward.x * 6, forward.y * 6, forward.z * 6);
    game.killEnemy(e, punchVel);
  }
}

function throwWeapon(game: Game): void {
  const p = game.player;
  if (p.weaponId === NO_ID) return;
  const w = game.weapons[p.weaponId]!;
  p.weaponId = NO_ID;
  playerEye(game);
  forwardFromAngles(forward, p.yaw, p.pitch);
  w.state = "flying";
  w.holderId = NO_ID;
  w.thrownBy = PLAYER_ID;
  w.bounced = false;
  w.flightTime = 0;
  addScaled(w.pos, eye, forward, 0.5);
  set(
    w.vel,
    forward.x * PLAYER.throwSpeed,
    forward.y * PLAYER.throwSpeed + PLAYER.throwLift,
    forward.z * PLAYER.throwSpeed,
  );
  game.events.push("weaponThrown", game.simTime, PLAYER_ID, w.id, w.pos, w.vel);
}

function pickUpNearest(game: Game): void {
  const p = game.player;
  set(chest, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
  let best: Weapon | null = null;
  let bestDist: number = PLAYER.pickupRange;
  for (const w of game.weapons) {
    if (w.state !== "ground" && w.state !== "flying") continue;
    const d = distance(w.pos, chest);
    if (d <= bestDist) {
      bestDist = d;
      best = w;
    }
  }
  if (!best) return;
  if (p.weaponId !== NO_ID) {
    // On lâche l'arme tenue à ses pieds.
    const held = game.weapons[p.weaponId]!;
    held.state = "ground";
    held.holderId = NO_ID;
    set(held.pos, p.pos.x, WEAPON.radius, p.pos.z);
    p.weaponId = NO_ID;
  }
  game.giveWeapon(best, PLAYER_ID);
  game.events.push("weaponPicked", game.simTime, PLAYER_ID, best.id, best.pos);
}

// Une arme en vol qui touche le joueur les mains vides est captée d'office.
// Si plusieurs arrivent ensemble, il attrape la plus chargée.
function catchFlyingWeapons(game: Game): void {
  const p = game.player;
  if (p.weaponId !== NO_ID) return;
  set(chest, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
  let best: Weapon | null = null;
  for (const w of game.weapons) {
    if (w.state !== "flying") continue;
    if (w.thrownBy === PLAYER_ID && w.flightTime < WEAPON.catchGrace) continue;
    if (distance(w.pos, chest) > PLAYER.catchRadius) continue;
    if (!best || w.ammo > best.ammo) best = w;
  }
  if (!best) return;
  game.giveWeapon(best, PLAYER_ID);
  game.events.push("weaponPicked", game.simTime, PLAYER_ID, best.id, best.pos);
}
```

`src/sim/enemy-system.ts` :

```ts
// Comportement des ennemis, en temps de simulation (spec section 5.6).
import { BULLET, ENEMY, type Enemy, NO_ID, PLAYER, isAlive } from "./entities";
import type { Game } from "./game";
import { pushCircleOutOfAabbs, segmentBlocked } from "./geometry";
import { playerEye } from "./player-system";
import { type Vec3, distance, normalize, set, sub, vec3 } from "./vec3";

const enemyEye = vec3();
const target = vec3();
const muzzle = vec3();
const dir = vec3();
const hitVel = vec3();

export function updateEnemies(game: Game, dt: number): void {
  if (dt <= 0) return;
  playerEye(game, target);
  for (const e of game.enemies) {
    if (!isAlive(e)) continue;
    e.stateTime += dt;
    switch (e.state) {
      case "stagger":
        if (e.stateTime >= ENEMY.staggerTime) enterState(e, "approach");
        break;
      case "cooldown":
        if (e.stateTime >= ENEMY.cooldown) enterState(e, "approach");
        break;
      case "windup":
        updateWindup(game, e);
        break;
      case "aim":
        updateAim(game, e);
        break;
      case "approach":
        updateApproach(game, e, dt);
        break;
      default:
        break;
    }
  }
}

function enterState(e: Enemy, state: Enemy["state"]): void {
  e.state = state;
  e.stateTime = 0;
}

function faceTowards(e: Enemy, p: Vec3): void {
  // Lacet 0 = -Z : yaw = atan2(-dx, -dz).
  e.yaw = Math.atan2(-(p.x - e.pos.x), -(p.z - e.pos.z));
}

function hasLineOfSight(game: Game, e: Enemy): boolean {
  set(enemyEye, e.pos.x, e.pos.y + ENEMY.eyeHeight, e.pos.z);
  return !segmentBlocked(enemyEye, target, game.room.boxes, game.boxEnabled);
}

function updateApproach(game: Game, e: Enemy, dt: number): void {
  const player = game.player.pos;
  faceTowards(e, player);
  const dist = Math.hypot(player.x - e.pos.x, player.z - e.pos.z);
  const sight = hasLineOfSight(game, e);
  const armed = e.weaponId !== NO_ID;
  if (armed && sight && distance(enemyEye, target) <= ENEMY.fireRange) {
    enterState(e, "aim");
    return;
  }
  if (!armed && dist <= ENEMY.meleeRange) {
    enterState(e, "windup");
    return;
  }
  if (!e.mobile) return;
  if (sight) {
    moveTowards(e, player, dt);
  } else {
    followPath(game, e, dt);
  }
  pushCircleOutOfAabbs(e.pos, ENEMY.radius, ENEMY.height, game.room.boxes, game.boxEnabled);
}

function moveTowards(e: Enemy, p: Vec3, dt: number): void {
  const dx = p.x - e.pos.x;
  const dz = p.z - e.pos.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return;
  const stepLen = Math.min(len, ENEMY.speed * dt);
  e.pos.x += (dx / len) * stepLen;
  e.pos.z += (dz / len) * stepLen;
}

function followPath(game: Game, e: Enemy, dt: number): void {
  e.repathTimer -= dt;
  if (e.repathTimer <= 0 || e.pathIndex >= e.pathLength) {
    e.pathLength = game.nav.findPath(e.pos, game.player.pos, e.path);
    e.pathIndex = 0;
    e.repathTimer = ENEMY.repathInterval;
  }
  if (e.pathIndex >= e.pathLength) return;
  const node = game.nav.graph.nodes[e.path[e.pathIndex]!]!;
  moveTowards(e, node, dt);
  if (Math.hypot(node.x - e.pos.x, node.z - e.pos.z) < ENEMY.waypointReach) e.pathIndex++;
}

function updateAim(game: Game, e: Enemy): void {
  const p = game.player;
  faceTowards(e, p.pos);
  if (!hasLineOfSight(game, e) || e.weaponId === NO_ID) {
    enterState(e, "approach");
    return;
  }
  // Visée prédictive vers le torse du joueur.
  const lead = distance(enemyEye, target) / BULLET.speed;
  set(e.aimPoint, p.pos.x + p.vel.x * lead, p.pos.y + PLAYER.chest, p.pos.z + p.vel.z * lead);
  if (e.stateTime < ENEMY.aimTime) return;
  set(muzzle, e.pos.x, e.pos.y + ENEMY.muzzleHeight, e.pos.z);
  normalize(dir, sub(dir, e.aimPoint, muzzle));
  game.spawnBullet(muzzle, dir, e.id);
  enterState(e, "cooldown");
}

function updateWindup(game: Game, e: Enemy): void {
  const p = game.player;
  faceTowards(e, p.pos);
  if (e.stateTime < ENEMY.meleeWindup) return;
  const dist = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
  if (dist <= ENEMY.meleeRange + PLAYER.radius) {
    normalize(hitVel, sub(hitVel, p.pos, e.pos));
    set(hitVel, hitVel.x * 4, 1, hitVel.z * 4);
    game.killPlayer(hitVel);
  }
  enterState(e, "cooldown");
}
```

`src/sim/projectile-system.ts` :

```ts
// Balles (détection de collision continue) et armes en vol (spec sections 5.3 et 5.4).
import { BULLET, ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, isAlive } from "./entities";
import type { Game } from "./game";
import { sweepSphereAabb, sweepSphereCapsule } from "./geometry";
import { addScaled, copy, lerp, set, vec3 } from "./vec3";

const next = vec3();
const hit = vec3();

const HIT_NONE = 0;
const HIT_BOX = 1;
const HIT_ENEMY = 2;
const HIT_PLAYER = 3;

export function updateBullets(game: Game, dt: number): void {
  if (dt <= 0) return;
  const boxes = game.room.boxes;
  const player = game.player;
  for (const b of game.bullets) {
    if (!b.active) continue;
    b.life += dt;
    if (b.life > BULLET.maxLife) {
      b.active = false;
      continue;
    }
    addScaled(next, b.pos, b.vel, dt);
    let bestT = 2;
    let kind = HIT_NONE;
    let targetIndex = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (!game.boxEnabled[i]) continue;
      const t = sweepSphereAabb(b.pos, next, BULLET.radius, boxes[i]!);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_BOX;
        targetIndex = i;
      }
    }
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i]!;
      if (!isAlive(e) || e.id === b.ownerId) continue;
      const t = sweepSphereCapsule(b.pos, next, BULLET.radius, e.pos, ENEMY.height, ENEMY.radius);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_ENEMY;
        targetIndex = i;
      }
    }
    if (player.alive && b.ownerId !== PLAYER_ID) {
      const height = player.crouching ? PLAYER.crouchHeight : PLAYER.height;
      const t = sweepSphereCapsule(b.pos, next, BULLET.radius, player.pos, height, PLAYER.radius);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_PLAYER;
      }
    }
    if (kind === HIT_NONE) {
      copy(b.pos, next);
      continue;
    }
    lerp(hit, b.pos, next, bestT);
    copy(b.pos, hit);
    b.active = false;
    if (kind === HIT_BOX) {
      game.events.push("bulletImpact", game.simTime, b.ownerId, targetIndex, hit, b.vel);
    } else if (kind === HIT_ENEMY) {
      game.killEnemy(game.enemies[targetIndex]!, b.vel);
    } else {
      game.killPlayer(b.vel);
    }
  }
}

export function updateWeapons(game: Game, dt: number): void {
  if (dt <= 0) return;
  const boxes = game.room.boxes;
  for (const w of game.weapons) {
    if (w.state === "held") {
      followHolder(game, w.holderId, w.pos);
      continue;
    }
    if (w.state !== "flying") continue;
    w.flightTime += dt;
    w.vel.y -= WEAPON.gravity * dt;
    w.angle += WEAPON.spin * dt;
    addScaled(next, w.pos, w.vel, dt);

    // Une arme lancée par le joueur fait vaciller le premier ennemi touché.
    if (w.thrownBy === PLAYER_ID && !w.bounced) {
      for (const e of game.enemies) {
        if (!isAlive(e)) continue;
        const t = sweepSphereCapsule(w.pos, next, WEAPON.radius, e.pos, ENEMY.height, ENEMY.radius);
        if (t < 0) continue;
        lerp(next, w.pos, next, t);
        game.staggerEnemy(e, game.player.pos);
        // L'arme lancée tombe aux pieds de l'ennemi : c'est la sienne qui vole vers le joueur.
        set(w.vel, 0, 1, 0);
        w.bounced = true;
        break;
      }
    }

    for (let i = 0; i < boxes.length; i++) {
      if (!game.boxEnabled[i]) continue;
      const t = sweepSphereAabb(w.pos, next, WEAPON.radius, boxes[i]!);
      if (t < 0) continue;
      const box = boxes[i]!;
      lerp(next, w.pos, next, t);
      // Arrivée par le dessus (passerelle, haut d'une baie) : l'arme se pose.
      if (w.pos.y >= box.max.y) {
        next.y = box.max.y + WEAPON.radius;
        set(w.vel, 0, 0, 0);
        w.state = "ground";
        w.thrownBy = NO_ID;
        break;
      }
      // Rebond simple : on renverse l'horizontale, une seule fois.
      w.vel.x = -w.vel.x * WEAPON.bounceDamping;
      w.vel.z = -w.vel.z * WEAPON.bounceDamping;
      if (w.bounced) {
        w.vel.x = 0;
        w.vel.z = 0;
      }
      w.bounced = true;
      break;
    }
    copy(w.pos, next);

    if (w.pos.y <= WEAPON.radius) {
      w.pos.y = WEAPON.radius;
      set(w.vel, 0, 0, 0);
      w.state = "ground";
      w.thrownBy = NO_ID;
    }
  }
}

function followHolder(game: Game, holderId: number, out: typeof hit): void {
  if (holderId === PLAYER_ID) {
    const p = game.player;
    set(out, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
    return;
  }
  const e = game.enemies[holderId - 1];
  if (e) set(out, e.pos.x, e.pos.y + ENEMY.handHeight, e.pos.z);
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `25 pass`, `0 fail`, `tsc` sans sortie.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/sim/game.ts src/sim/player-system.ts src/sim/enemy-system.ts src/sim/projectile-system.ts tests/helpers.ts tests/ballistics.test.ts tests/combat.test.ts && git commit -m "feat(sim): add combat simulation (player, enemies, bullets, thrown weapons)"
```

---

### Task 5 : la salle 1 et le registre des salles (AC-5, AC-16)

**Files :**
- Create : `src/rooms/room-01-datacenter.ts`, `src/rooms/registry.ts`
- Test : `tests/rooms.test.ts`

**Interfaces :**
- Consumes : `RoomDefinition`, `RoomEntry`, `aabb`, `vec3`, `Game`.
- Produces : `room01: RoomDefinition`, `ROOMS: readonly RoomEntry[]` (salle 1 jouable, salle 2 verrouillée), `findRoom(id)`.

**Agencement :**
- Salle de 24 × 16 m, 4 rangées de 9 baies (2 tronçons séparés par un passage), ascenseur au fond, passerelle à gauche à 3,4 m.
- 3 ennemis au départ, dont 1 fixe sur la passerelle.
- 2 ennemis sortent des baies `rackIndex(1, 2)` et `rackIndex(3, 6)` quand il en reste 2. Le second est en mêlée.
- C'est un agencement de départ, que la tâche 8 fera régler par Romain.

- [ ] **Step 1 : écrire le test qui échoue**

`tests/rooms.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { ROOMS } from "../src/rooms/registry";
import { room01 } from "../src/rooms/room-01-datacenter";
import { PLAYER_ID, isAlive } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { Rng } from "../src/sim/rng";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

describe("jamais de tir surprise (AC-5)", () => {
  test("sur 50 parties aléatoires, chaque tir ennemi suit au moins 0,4 s de visée continue", () => {
    const rng = new Rng(7);
    let shotsChecked = 0;
    for (let game_i = 0; game_i < 50; game_i++) {
      const game = new Game(room01);
      const aimStart = new Map<number, number>();
      let moveX = 0;
      let moveZ = 0;
      for (let frame = 0; frame < 60 * 20 && game.status === "playing"; frame++) {
        if (frame % 30 === 0) {
          moveX = Math.floor(rng.range(-1, 2));
          moveZ = Math.floor(rng.range(-1, 2));
        }
        game.step(
          1 / 60,
          input({ moveX, moveZ, lookDX: rng.range(-0.05, 0.05), lookPixels: rng.range(0, 20), fire: rng.next() < 0.02 }),
        );
        for (let i = 0; i < game.events.count; i++) {
          const e = game.events.items[i]!;
          if (e.type !== "shot" || e.ownerId === PLAYER_ID) continue;
          const start = aimStart.get(e.ownerId);
          expect(start).toBeDefined();
          expect(game.simTime - start! + 1e-9).toBeGreaterThanOrEqual(0.4);
          shotsChecked++;
        }
        for (const enemy of game.enemies) {
          if (enemy.state === "aim") {
            if (!aimStart.has(enemy.id)) aimStart.set(enemy.id, game.simTime - enemy.stateTime);
          } else {
            aimStart.delete(enemy.id);
          }
        }
      }
    }
    expect(shotsChecked).toBeGreaterThan(20);
  });
});

describe("déroulé de la salle 1", () => {
  test("au départ : 3 ennemis, pistolet de 4 balles en main", () => {
    const game = new Game(room01);
    expect(game.aliveEnemyCount()).toBe(3);
    expect(game.weapons[game.player.weaponId]!.ammo).toBe(4);
  });

  test("quand il reste 2 ennemis, 2 autres sortent de 2 baies qui explosent", () => {
    const game = new Game(room01);
    const first = game.enemies.find(isAlive)!;
    game.killEnemy(first, first.pos);
    game.step(1 / 60, input());
    expect(game.aliveEnemyCount()).toBe(4);
    const bursts = room01.spawns.filter((s) => s.burstBoxIndex !== undefined).map((s) => s.burstBoxIndex!);
    expect(bursts.length).toBe(2);
    for (const index of bursts) expect(game.boxEnabled[index]).toBe(false);
  });

  test("les 5 ennemis éclatés = victoire", () => {
    const game = new Game(room01);
    for (let round = 0; round < 3; round++) {
      for (const e of game.enemies) if (isAlive(e)) game.killEnemy(e, e.pos);
      game.step(1 / 60, input());
    }
    expect(game.status).toBe("won");
  });

  test("après une mort, reset remet la salle d'origine", () => {
    const game = new Game(room01);
    game.killEnemy(game.enemies.find(isAlive)!, game.player.pos);
    game.step(1 / 60, input());
    game.killPlayer(game.player.pos);
    expect(game.status).toBe("dead");
    game.reset();
    expect(game.status).toBe("playing");
    expect(game.aliveEnemyCount()).toBe(3);
    expect(game.boxEnabled.every(Boolean)).toBe(true);
    expect(game.weapons[game.player.weaponId]!.ammo).toBe(4);
    expect(game.shatter.shards.every((s) => !s.active)).toBe(true);
  });

  test("le joueur qui force contre un coin de baies ne rentre jamais dedans", () => {
    const game = new Game(room01);
    // Vers l'avant-gauche en diagonale : droit dans l'angle d'un tronçon de baies.
    for (let frame = 0; frame < 60 * 4 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ moveZ: 1, moveX: -1 }));
      const p = game.player.pos;
      for (let i = 0; i < room01.boxes.length; i++) {
        const box = room01.boxes[i]!;
        if (!game.boxEnabled[i] || box.min.y > 1) continue;
        const inside = p.x > box.min.x + 1e-6 && p.x < box.max.x - 1e-6 && p.z > box.min.z + 1e-6 && p.z < box.max.z - 1e-6;
        expect(inside).toBe(false);
      }
    }
  });

  test("un ennemi sans ligne de vue contourne les baies par le graphe", () => {
    const game = new Game(room01);
    const path = new Int32Array(room01.nav.nodes.length);
    // Du fond de l'allée gauche à l'entrée de l'allée droite.
    const length = game.nav.findPath(room01.nav.nodes[1]!, room01.nav.nodes[13]!, path);
    expect(length).toBeGreaterThan(1);
    expect(path[length - 1]).toBe(13);
  });
});

describe("salles (AC-16)", () => {
  test("le registre expose la salle 1 jouable et la salle 2 verrouillée", () => {
    const playable = ROOMS.filter((r) => r.status === "playable");
    expect(playable.every((r) => r.definition !== undefined)).toBe(true);
    expect(ROOMS.some((r) => r.status === "locked")).toBe(true);
  });

  test("une salle de test minimale se joue jusqu'à la victoire sans toucher au moteur", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    for (let frame = 0; frame < 600 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ fire: frame === 0 }));
    }
    expect(game.status).toBe("won");
  });
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/rooms.test.ts`
Expected : FAIL, `Cannot find module '../src/rooms/registry'`.

- [ ] **Step 3 : écrire le code**

`src/rooms/room-01-datacenter.ts` :

```ts
// Salle 1 : la salle serveurs (spec section 5.7). Agencement de départ, à régler en phase « gris ».
import { type Aabb, aabb } from "../sim/geometry";
import { vec3 } from "../sim/vec3";
import type { RoomDefinition } from "./types";

// Salle de 24 × 16 m : x dans [-12, 12], z dans [-8, 8]. Le joueur part côté +Z et regarde vers -Z.
const HALF_X = 12;
const HALF_Z = 8;
const WALL = 0.5;
const WALL_HEIGHT = 6;

const RACK_WIDTH = 1.0;
const RACK_DEPTH = 0.8;
const RACK_HEIGHT = 2.2;
const RACK_ROWS_X = [-7.5, -2.5, 2.5, 7.5];
// Deux tronçons par rangée, séparés par un passage vers z = -0,4.
const RACK_Z_CENTERS = [-4.6, -3.8, -3.0, -2.2, -1.4, 0.6, 1.4, 2.2, 3.0];

const boxes: Aabb[] = [
  // Murs extérieurs.
  aabb(-HALF_X - WALL, 0, -HALF_Z - WALL, HALF_X + WALL, WALL_HEIGHT, -HALF_Z),
  aabb(-HALF_X - WALL, 0, HALF_Z, HALF_X + WALL, WALL_HEIGHT, HALF_Z + WALL),
  aabb(-HALF_X - WALL, 0, -HALF_Z, -HALF_X, WALL_HEIGHT, HALF_Z),
  aabb(HALF_X, 0, -HALF_Z, HALF_X + WALL, WALL_HEIGHT, HALF_Z),
  // Cage d'ascenseur au fond.
  aabb(-1.5, 0, -HALF_Z, 1.5, 3, -7.2),
  // Plancher de la passerelle, côté gauche, à 3,4 m : inaccessible au joueur (saut max ≈ 1,54 m).
  aabb(-HALF_X, 3.4, -HALF_Z, -10, 3.5, 6),
];

const rackBoxIndices: number[] = [];
for (const x of RACK_ROWS_X) {
  for (const z of RACK_Z_CENTERS) {
    rackBoxIndices.push(boxes.length);
    boxes.push(
      aabb(x - RACK_WIDTH / 2, 0, z - RACK_DEPTH / 2, x + RACK_WIDTH / 2, RACK_HEIGHT, z + RACK_DEPTH / 2),
    );
  }
}

// Index d'une baie par rangée (0 à 3) et position dans la rangée (0 à 8).
function rackIndex(row: number, slot: number): number {
  return rackBoxIndices[row * RACK_Z_CENTERS.length + slot]!;
}

// Graphe de navigation : colonnes des allées × trois lignes (fond, passage, entrée).
const NAV_X = [-10, -5, 0, 5, 10];
const NAV_Z = [-6.3, -0.4, 5];
const nodes = [];
const edges: [number, number][] = [];
for (let zi = 0; zi < NAV_Z.length; zi++) {
  for (let xi = 0; xi < NAV_X.length; xi++) {
    nodes.push(vec3(NAV_X[xi], 0, NAV_Z[zi]));
    const id = zi * NAV_X.length + xi;
    if (xi > 0) edges.push([id - 1, id]);
    if (zi > 0) edges.push([id - NAV_X.length, id]);
  }
}

export const room01: RoomDefinition = {
  id: "room-01",
  title: "Salle serveurs",
  boxes,
  rackBoxIndices,
  playerStart: vec3(0, 0, 6.5),
  playerYaw: 0,
  startWithWeapon: true,
  spawns: [
    { pos: vec3(-5, 0, -6.3), yaw: Math.PI, armed: true, mobile: true, trigger: { kind: "start" } },
    { pos: vec3(5, 0, -6.3), yaw: Math.PI, armed: true, mobile: true, trigger: { kind: "start" } },
    // Sur la passerelle, à son poste.
    { pos: vec3(-11, 3.5, -2), yaw: -Math.PI / 2, armed: true, mobile: false, trigger: { kind: "start" } },
    // Sortent des baies quand il ne reste que 2 ennemis.
    {
      pos: vec3(-2.5, 0, -3.0),
      yaw: Math.PI,
      armed: true,
      mobile: true,
      trigger: { kind: "remaining", count: 2 },
      burstBoxIndex: rackIndex(1, 2),
    },
    {
      pos: vec3(7.5, 0, 1.4),
      yaw: Math.PI,
      armed: false,
      mobile: true,
      trigger: { kind: "remaining", count: 2 },
      burstBoxIndex: rackIndex(3, 6),
    },
  ],
  nav: { nodes, edges },
};
```

`src/rooms/registry.ts` :

```ts
// Registre des salles : ajouter une salle = un module + une ligne ici (spec section 9.1).
import { room01 } from "./room-01-datacenter";
import type { RoomEntry } from "./types";

export const ROOMS: readonly RoomEntry[] = [
  { id: room01.id, title: room01.title, status: "playable", definition: room01 },
  { id: "room-02", title: "Salle 2", status: "locked" },
];

export function findRoom(id: string): RoomEntry | undefined {
  return ROOMS.find((room) => room.id === id);
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `34 pass`, `0 fail`, `tsc` sans sortie. Le test AC-5 vérifie au moins 20 tirs ennemis sur 50 parties aléatoires.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/rooms/room-01-datacenter.ts src/rooms/registry.ts tests/rooms.test.ts && git commit -m "feat(rooms): add datacenter room and room registry"
```

---

### Task 6 : la vue du monde et le replay (AC-7)

**Files :**
- Create : `src/sim/view.ts`, `src/replay/recorder.ts`, `src/replay/player.ts`
- Test : `tests/replay.test.ts`

**Interfaces :**
- Consumes : `Game`, `playerEye`, `ShatterSystem`, `shatterSeed`, `POOLS`, `ENEMY`, `PLAYER`.
- Produces :
  - **Vue :**
    - `WorldView {camera{pos,yaw,pitch}, enemies: EnemyView[], bullets: BulletView[], weapons: WeaponView[], playerAmmo, playerCooldown, shards, boxEnabled, timeScale}` ;
    - `createWorldView(boxCount, shards)`, `writeGameView(game, view)`, `ENEMY_STATE_CODES`.
  - **Enregistreur :**
    - `REPLAY` (60 Hz, 5 400 échantillons = 90 s), `LAYOUT`, `RECORDED_EVENTS`, `EVENT_STRIDE` ;
    - `class ReplayRecorder { samples; events; head; count; eventCount; reset(); capture(simTime, view, force?); recordEvents(queue); offsetOf(n); timeOf(n) }`.
  - **Lecteur :** `class ReplayPlayer(recorder, room) { shatter; view; playhead; duration; finished; restart(); update(dtReal) }`.

- [ ] **Step 1 : écrire le test qui échoue**

`tests/replay.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { REPLAY, ReplayRecorder } from "../src/replay/recorder";
import { Game } from "../src/sim/game";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

function playAndRecord(game: Game, script: (frame: number) => ReturnType<typeof input>, maxFrames: number) {
  const recorder = new ReplayRecorder();
  const view = createWorldView(game.room.boxes.length, game.shatter.shards);
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  for (let frame = 0; frame < maxFrames && game.status === "playing"; frame++) {
    game.step(FRAME, script(frame));
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, game.status !== "playing");
  }
  return recorder;
}

describe("replay (AC-7)", () => {
  test("la durée du replay égale le temps de simulation écoulé, à 5 % près", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    // Le joueur marche 2 s, reste immobile, puis tire.
    const recorder = playAndRecord(game, (f) => (f < 120 ? input({ moveZ: 1 }) : input({ fire: f === 400 })), 60 * 120);
    expect(game.status).toBe("won");
    const replay = new ReplayPlayer(recorder, game.room);
    expect(Math.abs(replay.duration - game.simTime) / game.simTime).toBeLessThanOrEqual(0.05);
    // Relu à 60 i/s réelles, le replay dure bien sa durée, pas le temps réel de la partie.
    let frames = 0;
    while (!replay.finished && frames < 60 * 60) {
      replay.update(FRAME);
      frames++;
    }
    expect(Math.abs(frames * FRAME - replay.duration)).toBeLessThanOrEqual(FRAME * 2);
    expect(game.realTime).toBeGreaterThan(replay.duration * 2);
    // L'éclatement de l'ennemi est rejoué.
    expect(replay.shatter.shards.some((s) => s.active)).toBe(true);
  });

  test("la caméra du replay suit le trajet du joueur", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const recorder = playAndRecord(game, (f) => (f < 120 ? input({ moveZ: 1 }) : input({ fire: f === 200 })), 60 * 60);
    const replay = new ReplayPlayer(recorder, game.room);
    const startZ = replay.view.camera.pos.z;
    while (!replay.finished) replay.update(FRAME);
    expect(startZ).toBeCloseTo(0, 1);
    expect(replay.view.camera.pos.z).toBeLessThan(-5);
  });

  test("au-delà de 90 s de simulation, le replay garde les 90 dernières secondes", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    writeGameView(game, view);
    const recorder = new ReplayRecorder();
    // 120 s de simulation à 60 Hz, soit plus que la capacité du tampon.
    for (let i = 0; i <= 120 * 60; i++) recorder.capture(i / 60, view, true);
    expect(recorder.count).toBe(REPLAY.capacity);
    const replay = new ReplayPlayer(recorder, game.room);
    expect(replay.duration).toBeCloseTo((REPLAY.capacity - 1) / 60, 1);
    let frames = 0;
    while (!replay.finished && frames < 60 * 100) {
      replay.update(FRAME);
      frames++;
    }
    expect(replay.finished).toBe(true);
  });
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/replay.test.ts`
Expected : FAIL, `Cannot find module '../src/replay/player'`.

- [ ] **Step 3 : écrire le code**

`src/sim/view.ts` :

```ts
// Vue du monde lue par le rendu. Le jeu et le replay écrivent la même forme,
// le rendu ne sait pas lequel des deux il dessine.
import { ENEMY, type EnemyState, NO_ID, PLAYER_ID, POOLS, isAlive } from "./entities";
import type { Game } from "./game";
import { playerEye } from "./player-system";
import type { Shard } from "./shatter";
import { type Vec3, copy, vec3 } from "./vec3";

export const ENEMY_STATE_CODES: readonly EnemyState[] = [
  "inactive",
  "approach",
  "aim",
  "cooldown",
  "stagger",
  "windup",
  "dead",
];

export interface EnemyView {
  visible: boolean;
  state: EnemyState;
  pos: Vec3;
  yaw: number;
  aimPoint: Vec3;
  // Progression de la visée, de 0 à 1 (pour le trait de visée).
  aimProgress: number;
}

export interface BulletView {
  active: boolean;
  pos: Vec3;
  vel: Vec3;
}

export interface WeaponView {
  visible: boolean;
  heldByPlayer: boolean;
  pos: Vec3;
  angle: number;
}

export interface WorldView {
  camera: { pos: Vec3; yaw: number; pitch: number };
  enemies: EnemyView[];
  bullets: BulletView[];
  weapons: WeaponView[];
  // Munitions de l'arme du joueur (-1 si mains vides), et temps de recharge restant.
  playerAmmo: number;
  playerCooldown: number;
  shards: Shard[];
  boxEnabled: boolean[];
  timeScale: number;
}

export function createWorldView(boxCount: number, shards: Shard[]): WorldView {
  const view: WorldView = {
    camera: { pos: vec3(), yaw: 0, pitch: 0 },
    enemies: [],
    bullets: [],
    weapons: [],
    playerAmmo: -1,
    playerCooldown: 0,
    shards,
    boxEnabled: new Array<boolean>(boxCount).fill(true),
    timeScale: 1,
  };
  for (let i = 0; i < POOLS.enemies; i++) {
    view.enemies.push({ visible: false, state: "inactive", pos: vec3(), yaw: 0, aimPoint: vec3(), aimProgress: 0 });
  }
  for (let i = 0; i < POOLS.bullets; i++) view.bullets.push({ active: false, pos: vec3(), vel: vec3() });
  for (let i = 0; i < POOLS.weapons; i++) view.weapons.push({ visible: false, heldByPlayer: false, pos: vec3(), angle: 0 });
  return view;
}

// Recopie l'état du jeu dans la vue, sans allocation.
export function writeGameView(game: Game, view: WorldView): void {
  const p = game.player;
  playerEye(game, view.camera.pos);
  view.camera.yaw = p.yaw;
  view.camera.pitch = p.pitch;
  view.timeScale = game.time.scale;
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i]!;
    const v = view.enemies[i]!;
    v.visible = isAlive(e);
    v.state = e.state;
    copy(v.pos, e.pos);
    v.yaw = e.yaw;
    copy(v.aimPoint, e.aimPoint);
    v.aimProgress = e.state === "aim" ? Math.min(1, e.stateTime / ENEMY.aimTime) : 0;
  }
  for (let i = 0; i < game.bullets.length; i++) {
    const b = game.bullets[i]!;
    const v = view.bullets[i]!;
    v.active = b.active;
    copy(v.pos, b.pos);
    copy(v.vel, b.vel);
  }
  for (let i = 0; i < game.weapons.length; i++) {
    const w = game.weapons[i]!;
    const v = view.weapons[i]!;
    v.visible = w.state !== "free";
    v.heldByPlayer = w.state === "held" && w.holderId === PLAYER_ID;
    copy(v.pos, w.pos);
    v.angle = w.angle;
  }
  const held = p.weaponId !== NO_ID ? game.weapons[p.weaponId] : undefined;
  view.playerAmmo = held ? held.ammo : -1;
  view.playerCooldown = p.fireCooldown;
  for (let i = 0; i < game.boxEnabled.length; i++) view.boxEnabled[i] = game.boxEnabled[i]!;
}
```

`src/replay/recorder.ts` :

```ts
// Enregistreur du replay : échantillons de la vue à 60 Hz de temps de simulation (spec section 5.8).
import { POOLS } from "../sim/entities";
import type { EventQueue, GameEventType } from "../sim/events";
import { ENEMY_STATE_CODES, type WorldView } from "../sim/view";

export const REPLAY = {
  rateHz: 60,
  // 90 s de temps de simulation ; au-delà, on garde les 90 dernières secondes.
  capacity: 5400,
  eventCapacity: 64,
} as const;

// Disposition d'un échantillon dans le tableau plat.
export const LAYOUT = {
  time: 0,
  camera: 1, // x, y, z, yaw, pitch
  enemies: 6, // par ennemi : visible, state, x, y, z, yaw, aimX, aimY, aimZ, aimProgress
  enemyStride: 10,
  bullets: 6 + POOLS.enemies * 10, // par balle : active, x, y, z, vx, vy, vz
  bulletStride: 7,
  weapons: 6 + POOLS.enemies * 10 + POOLS.bullets * 7, // par arme : visible, held, x, y, z, angle
  weaponStride: 6,
  misc: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6, // ammo, cooldown, timeScale
  stride: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6 + 3,
} as const;

// Événements rejoués : ceux qui déclenchent des éclats ou changent le décor.
export const RECORDED_EVENTS: readonly GameEventType[] = ["enemyKilled", "playerKilled", "rackBurst"];
export const EVENT_STRIDE = 9; // time, typeIndex, targetId, x, y, z, vx, vy, vz

export class ReplayRecorder {
  readonly samples = new Float32Array(REPLAY.capacity * LAYOUT.stride);
  readonly events = new Float32Array(REPLAY.eventCapacity * EVENT_STRIDE);
  // Index du plus ancien échantillon et nombre d'échantillons valides (tampon circulaire).
  head = 0;
  count = 0;
  eventCount = 0;
  private nextSampleTime = 0;

  reset(): void {
    this.head = 0;
    this.count = 0;
    this.eventCount = 0;
    this.nextSampleTime = 0;
  }

  // À appeler après chaque pas de jeu. `force` enregistre même hors cadence (dernière image).
  capture(simTime: number, view: WorldView, force = false): void {
    if (!force && simTime < this.nextSampleTime) return;
    this.nextSampleTime = simTime + 1 / REPLAY.rateHz;
    const slot = (this.head + this.count) % REPLAY.capacity;
    if (this.count < REPLAY.capacity) this.count++;
    else this.head = (this.head + 1) % REPLAY.capacity;
    writeSample(this.samples, slot * LAYOUT.stride, simTime, view);
  }

  recordEvents(queue: EventQueue): void {
    for (let i = 0; i < queue.count; i++) {
      const e = queue.items[i]!;
      const typeIndex = RECORDED_EVENTS.indexOf(e.type);
      if (typeIndex < 0 || this.eventCount >= REPLAY.eventCapacity) continue;
      const o = this.eventCount * EVENT_STRIDE;
      const ev = this.events;
      ev[o] = e.time;
      ev[o + 1] = typeIndex;
      ev[o + 2] = e.targetId;
      ev[o + 3] = e.pos.x;
      ev[o + 4] = e.pos.y;
      ev[o + 5] = e.pos.z;
      ev[o + 6] = e.vel.x;
      ev[o + 7] = e.vel.y;
      ev[o + 8] = e.vel.z;
      this.eventCount++;
    }
  }

  // Offset de l'échantillon n (0 = le plus ancien).
  offsetOf(n: number): number {
    return ((this.head + n) % REPLAY.capacity) * LAYOUT.stride;
  }

  timeOf(n: number): number {
    return this.samples[this.offsetOf(n) + LAYOUT.time]!;
  }
}

function writeSample(s: Float32Array, o: number, simTime: number, view: WorldView): void {
  s[o + LAYOUT.time] = simTime;
  const c = o + LAYOUT.camera;
  s[c] = view.camera.pos.x;
  s[c + 1] = view.camera.pos.y;
  s[c + 2] = view.camera.pos.z;
  s[c + 3] = view.camera.yaw;
  s[c + 4] = view.camera.pitch;
  for (let i = 0; i < POOLS.enemies; i++) {
    const e = view.enemies[i]!;
    const k = o + LAYOUT.enemies + i * LAYOUT.enemyStride;
    s[k] = e.visible ? 1 : 0;
    s[k + 1] = ENEMY_STATE_CODES.indexOf(e.state);
    s[k + 2] = e.pos.x;
    s[k + 3] = e.pos.y;
    s[k + 4] = e.pos.z;
    s[k + 5] = e.yaw;
    s[k + 6] = e.aimPoint.x;
    s[k + 7] = e.aimPoint.y;
    s[k + 8] = e.aimPoint.z;
    s[k + 9] = e.aimProgress;
  }
  for (let i = 0; i < POOLS.bullets; i++) {
    const b = view.bullets[i]!;
    const k = o + LAYOUT.bullets + i * LAYOUT.bulletStride;
    s[k] = b.active ? 1 : 0;
    s[k + 1] = b.pos.x;
    s[k + 2] = b.pos.y;
    s[k + 3] = b.pos.z;
    s[k + 4] = b.vel.x;
    s[k + 5] = b.vel.y;
    s[k + 6] = b.vel.z;
  }
  for (let i = 0; i < POOLS.weapons; i++) {
    const w = view.weapons[i]!;
    const k = o + LAYOUT.weapons + i * LAYOUT.weaponStride;
    s[k] = w.visible ? 1 : 0;
    s[k + 1] = w.heldByPlayer ? 1 : 0;
    s[k + 2] = w.pos.x;
    s[k + 3] = w.pos.y;
    s[k + 4] = w.pos.z;
    s[k + 5] = w.angle;
  }
  s[o + LAYOUT.misc] = view.playerAmmo;
  s[o + LAYOUT.misc + 1] = view.playerCooldown;
  s[o + LAYOUT.misc + 2] = view.timeScale;
}
```

`src/replay/player.ts` :

```ts
// Lecteur du replay : relit les échantillons à vitesse réelle (1 s de simulation = 1 s à l'écran).
import type { RoomDefinition } from "../rooms/types";
import { ENEMY, PLAYER, POOLS } from "../sim/entities";
import { shatterSeed } from "../sim/events";
import { ShatterSystem } from "../sim/shatter";
import { set, vec3 } from "../sim/vec3";
import { ENEMY_STATE_CODES, type WorldView, createWorldView } from "../sim/view";
import { EVENT_STRIDE, LAYOUT, RECORDED_EVENTS, type ReplayRecorder } from "./recorder";

const eventPos = vec3();
const eventVel = vec3();

export class ReplayPlayer {
  readonly shatter = new ShatterSystem();
  readonly view: WorldView;
  playhead = 0;
  private cursor = 0;
  private nextEvent = 0;
  private startTime = 0;
  private readonly recorder: ReplayRecorder;
  private readonly room: RoomDefinition;

  constructor(recorder: ReplayRecorder, room: RoomDefinition) {
    this.recorder = recorder;
    this.room = room;
    this.view = createWorldView(room.boxes.length, this.shatter.shards);
    this.restart();
  }

  get duration(): number {
    const r = this.recorder;
    return r.count < 2 ? 0 : r.timeOf(r.count - 1) - r.timeOf(0);
  }

  get finished(): boolean {
    return this.playhead >= this.duration;
  }

  restart(): void {
    this.playhead = 0;
    this.cursor = 0;
    this.nextEvent = 0;
    this.startTime = this.recorder.count > 0 ? this.recorder.timeOf(0) : 0;
    this.shatter.reset();
    this.view.boxEnabled.fill(true);
    // Les événements d'avant le premier échantillon conservé sont appliqués d'emblée (tampon plein).
    this.applyEventsUntil(this.startTime);
    this.writeView();
  }

  // Avance le replay de dtReal secondes réelles.
  update(dtReal: number): void {
    this.playhead = Math.min(this.duration, this.playhead + dtReal);
    this.applyEventsUntil(this.startTime + this.playhead);
    this.shatter.step(dtReal);
    this.writeView();
  }

  private applyEventsUntil(time: number): void {
    const r = this.recorder;
    while (this.nextEvent < r.eventCount) {
      const o = this.nextEvent * EVENT_STRIDE;
      const t = r.events[o]!;
      if (t > time) break;
      const type = RECORDED_EVENTS[r.events[o + 1]!]!;
      const targetId = r.events[o + 2]!;
      set(eventPos, r.events[o + 3]!, r.events[o + 4]!, r.events[o + 5]!);
      set(eventVel, r.events[o + 6]!, r.events[o + 7]!, r.events[o + 8]!);
      if (type === "rackBurst") {
        this.view.boxEnabled[targetId] = false;
        this.shatter.spawnBox(this.room.boxes[targetId]!, shatterSeed(1000 + targetId, t));
      } else if (type === "enemyKilled") {
        this.shatter.spawnBody(eventPos, ENEMY.height, ENEMY.radius, eventVel, shatterSeed(targetId, t), 0);
      } else {
        this.shatter.spawnBody(eventPos, PLAYER.height, PLAYER.radius, eventVel, shatterSeed(targetId, t), 2);
      }
      this.nextEvent++;
    }
  }

  // Interpole entre les deux échantillons qui encadrent la tête de lecture.
  private writeView(): void {
    const r = this.recorder;
    if (r.count === 0) return;
    const time = this.startTime + this.playhead;
    while (this.cursor < r.count - 2 && r.timeOf(this.cursor + 1) <= time) this.cursor++;
    const a = r.offsetOf(this.cursor);
    const b = r.offsetOf(Math.min(this.cursor + 1, r.count - 1));
    const s = r.samples;
    const ta = s[a + LAYOUT.time]!;
    const tb = s[b + LAYOUT.time]!;
    const t = tb > ta ? Math.min(1, Math.max(0, (time - ta) / (tb - ta))) : 0;
    const v = this.view;

    const ca = a + LAYOUT.camera;
    const cb = b + LAYOUT.camera;
    set(v.camera.pos, mix(s[ca]!, s[cb]!, t), mix(s[ca + 1]!, s[cb + 1]!, t), mix(s[ca + 2]!, s[cb + 2]!, t));
    v.camera.yaw = mixAngle(s[ca + 3]!, s[cb + 3]!, t);
    v.camera.pitch = mix(s[ca + 4]!, s[cb + 4]!, t);

    for (let i = 0; i < POOLS.enemies; i++) {
      const ka = a + LAYOUT.enemies + i * LAYOUT.enemyStride;
      const kb = b + LAYOUT.enemies + i * LAYOUT.enemyStride;
      const e = v.enemies[i]!;
      e.visible = s[ka] === 1;
      e.state = ENEMY_STATE_CODES[s[ka + 1]!] ?? "inactive";
      set(e.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
      e.yaw = mixAngle(s[ka + 5]!, s[kb + 5]!, t);
      set(e.aimPoint, s[ka + 6]!, s[ka + 7]!, s[ka + 8]!);
      e.aimProgress = s[ka + 9]!;
    }
    for (let i = 0; i < POOLS.bullets; i++) {
      const ka = a + LAYOUT.bullets + i * LAYOUT.bulletStride;
      const kb = b + LAYOUT.bullets + i * LAYOUT.bulletStride;
      const bullet = v.bullets[i]!;
      bullet.active = s[ka] === 1;
      // Si la balle disparaît au prochain échantillon, on ne l'interpole pas vers une position périmée.
      const k = s[kb] === 1 ? t : 0;
      set(bullet.pos, mix(s[ka + 1]!, s[kb + 1]!, k), mix(s[ka + 2]!, s[kb + 2]!, k), mix(s[ka + 3]!, s[kb + 3]!, k));
      set(bullet.vel, s[ka + 4]!, s[ka + 5]!, s[ka + 6]!);
    }
    for (let i = 0; i < POOLS.weapons; i++) {
      const ka = a + LAYOUT.weapons + i * LAYOUT.weaponStride;
      const kb = b + LAYOUT.weapons + i * LAYOUT.weaponStride;
      const w = v.weapons[i]!;
      w.visible = s[ka] === 1;
      w.heldByPlayer = s[ka + 1] === 1;
      set(w.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
      w.angle = mix(s[ka + 5]!, s[kb + 5]!, t);
    }
    v.playerAmmo = s[a + LAYOUT.misc]!;
    v.playerCooldown = s[a + LAYOUT.misc + 1]!;
    // Le replay se joue à vitesse réelle.
    v.timeScale = 1;
  }
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Interpolation d'angle par le plus court chemin.
function mixAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd <racine> && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run typecheck`
Expected : `37 pass`, `0 fail`, `tsc` sans sortie.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/sim/view.ts src/replay/recorder.ts src/replay/player.ts tests/replay.test.ts && git commit -m "feat(replay): add world view, replay recorder and real-speed replay player"
```

---

### Task 7 : le client en gris (rendu, commandes, boucle)

Pas de test unitaire : c'est du code navigateur (WebGPU, pointer lock, DOM). La vérification se fait dans Chrome, via le MCP Chrome DevTools, avec captures. Le code a été vérifié ainsi le 2026-09-29.

**Files :**
- Create : `index.html`, `src/app/style.css`, `src/app/main.ts`, `src/app/input.ts`, `src/app/hud.ts`, `src/render/palette.ts`, `src/render/create-renderer.ts`, `src/render/world-renderer.ts`

**Interfaces :**
- Consumes : `WorldView`, `createWorldView`, `writeGameView`, `Game`, `emptyInput`, `PlayerInput`, `room01`, `ReplayRecorder`, `ReplayPlayer`, `ENEMY`, `POOLS`, `SHATTER`.
- Produces (utilisé par les plans 2 et 3) :
  - `PALETTE` ;
  - `createRenderer(container, forceWebGL): Promise<{renderer, isWebGPU}>` ;
  - `class WorldRenderer(room, aspect) { scene; camera; resize(aspect); setFov(fov); update(view) }` ;
  - `class InputController(canvas) { sensitivity; invertY; locked; lock(); consumePress(code); consumeFire(); sample(); clear() }` ;
  - `class Hud(root, debug) { show(message); chant(playhead); updateCrosshair(cooldown); setDebug(text) }`.
- **Paramètres d'URL :**
  - `?renderer=webgl` force WebGL2 (AC-9) ;
  - `?debug` affiche le backend, les i/s, les appels de dessin, `timeScale` et le temps de simulation, et journalise la durée de chaque relance (AC-6).

- [ ] **Step 1 : écrire les fichiers**

`index.html` :

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AGENTHOT</title>
  </head>
  <body>
    <div id="app"></div>
    <div id="hud">
      <div id="crosshair"></div>
      <div id="message"></div>
      <div id="death-tint"></div>
      <div id="debug"></div>
    </div>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

`src/app/style.css` :

```css
/* Phase « gris » : le strict minimum. Le design system arrive au plan 3. */
:root {
  --void: #0d111b;
  --world: #ecebe7;
  --threat: #d97757;
  --ink: #0a0c10;
}

* {
  box-sizing: border-box;
  margin: 0;
}

html,
body {
  height: 100%;
  overflow: hidden;
  background: var(--void);
  color: var(--world);
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
}

#app canvas {
  display: block;
}

#hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

#crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  border: 2px solid var(--ink);
  background: var(--world);
  transform: translate(-50%, -50%) rotate(0deg);
  transition: transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

#message {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translateX(-50%);
  font-size: 16px;
  letter-spacing: 0.2em;
  color: var(--world);
  text-shadow: 0 1px 0 var(--ink);
  white-space: nowrap;
}

#message.chant {
  top: 40%;
  font-size: clamp(64px, 14vw, 200px);
  font-weight: 900;
  letter-spacing: 0;
}

#death-tint {
  position: absolute;
  inset: 0;
  background: var(--threat);
  mix-blend-mode: multiply;
  opacity: 0;
  transition: opacity 120ms;
}

#death-tint.on {
  opacity: 0.55;
}

#debug {
  position: absolute;
  left: 12px;
  bottom: 12px;
  font-size: 12px;
  color: var(--world);
  background: rgb(10 12 16 / 0.7);
  padding: 6px 10px;
}
```

`src/render/palette.ts` :

```ts
// Palette du jeu (spec section 6.1). L'orange est réservé à la menace.
export const PALETTE = {
  void: 0x0d111b,
  void2: 0x141a28,
  world: 0xecebe7,
  world2: 0xc9cbd0,
  ink: 0x0a0c10,
  threat: 0xd97757,
  threatHot: 0xff9d73,
  muted: 0x7c8394,
} as const;
```

`src/render/create-renderer.ts` :

```ts
// Crée le renderer : WebGPU si possible, sinon WebGL2 (repli automatique de Three.js r186).
import * as THREE from "three/webgpu";

export interface RendererHandle {
  renderer: THREE.WebGPURenderer;
  isWebGPU: boolean;
}

export async function createRenderer(container: HTMLElement, forceWebGL: boolean): Promise<RendererHandle> {
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  await renderer.init();
  // `isWebGPUBackend` n'est typé que sur WebGPUBackend : lecture par cast (brief r186).
  const isWebGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
  return { renderer, isWebGPU };
}
```

`src/render/world-renderer.ts` :

```ts
// Rendu « gris » : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
import * as THREE from "three/webgpu";
import type { RoomDefinition } from "../rooms/types";
import { ENEMY, POOLS } from "../sim/entities";
import { SHATTER } from "../sim/shatter";
import type { WorldView } from "../sim/view";
import { PALETTE } from "./palette";

const TRAIL_LENGTH = 3;
const MUZZLE_HEIGHT = ENEMY.muzzleHeight;

export class WorldRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly racks: THREE.InstancedMesh;
  private readonly rackMatrices: THREE.Matrix4[] = [];
  private readonly enemies: THREE.Mesh[] = [];
  private readonly aimLines: THREE.Line[] = [];
  private readonly weapons: THREE.Mesh[] = [];
  private readonly viewModel: THREE.Mesh;
  private readonly bulletHeads: THREE.InstancedMesh;
  private readonly bulletTrails: THREE.InstancedMesh;
  private readonly shards: THREE.InstancedMesh;
  private readonly room: RoomDefinition;
  // Objets temporaires réutilisés : zéro allocation par image.
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();
  private readonly p = new THREE.Vector3();
  private readonly axis = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly dir = new THREE.Vector3();
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly colors = {
    threat: new THREE.Color(PALETTE.threat),
    world: new THREE.Color(PALETTE.world2),
    ink: new THREE.Color(PALETTE.ink),
  };

  constructor(room: RoomDefinition, aspect: number) {
    this.room = room;
    this.scene.background = new THREE.Color(PALETTE.void);
    this.camera = new THREE.PerspectiveCamera(90, aspect, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    this.scene.add(new THREE.HemisphereLight(0xffffff, PALETTE.void2, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 12, 4);
    this.scene.add(sun);

    const worldMat = new THREE.MeshStandardMaterial({ color: PALETTE.world, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), worldMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Boîtes fixes (murs, ascenseur, passerelle) : un mesh chacune, elles sont peu nombreuses.
    const rackSet = new Set(room.rackBoxIndices);
    room.boxes.forEach((box, i) => {
      if (rackSet.has(i)) return;
      const size = new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), worldMat);
      mesh.position.addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5);
      this.scene.add(mesh);
    });

    // Baies : un seul InstancedMesh, une baie explosée est mise à l'échelle 0.
    const rackMat = new THREE.MeshStandardMaterial({ color: PALETTE.world2, roughness: 0.8 });
    this.racks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rackMat, room.rackBoxIndices.length);
    room.rackBoxIndices.forEach((boxIndex, i) => {
      const box = room.boxes[boxIndex]!;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3().addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5),
        new THREE.Quaternion(),
        new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min)),
      );
      this.rackMatrices.push(matrix);
      this.racks.setMatrixAt(i, matrix);
    });
    this.scene.add(this.racks);

    const threatMat = new THREE.MeshStandardMaterial({
      color: PALETTE.threat,
      emissive: PALETTE.threat,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    });
    const enemyGeo = new THREE.CapsuleGeometry(ENEMY.radius, ENEMY.height - ENEMY.radius * 2, 4, 8);
    const aimMat = new THREE.LineBasicMaterial({ color: PALETTE.threatHot, transparent: true });
    for (let i = 0; i < POOLS.enemies; i++) {
      const mesh = new THREE.Mesh(enemyGeo, threatMat);
      mesh.visible = false;
      this.enemies.push(mesh);
      this.scene.add(mesh);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(lineGeo, aimMat.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.aimLines.push(line);
      this.scene.add(line);
    }

    const inkMat = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.6 });
    const weaponGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    for (let i = 0; i < POOLS.weapons; i++) {
      const mesh = new THREE.Mesh(weaponGeo, inkMat);
      mesh.visible = false;
      this.weapons.push(mesh);
      this.scene.add(mesh);
    }
    // Arme en main : plus petite et plus loin que les armes du monde, pour ne pas boucher la vue.
    this.viewModel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.24), inkMat);
    this.viewModel.position.set(0.2, -0.2, -0.55);
    this.camera.add(this.viewModel);

    const bulletMat = new THREE.MeshBasicMaterial({ color: PALETTE.threatHot });
    this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 8, 6), bulletMat, POOLS.bullets);
    this.bulletHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletHeads.frustumCulled = false;
    this.scene.add(this.bulletHeads);
    // Traînée : cylindre unitaire le long de +Y, étiré et orienté selon -vitesse.
    const trailGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6).translate(0, 0.5, 0);
    const trailMat = new THREE.MeshBasicMaterial({ color: PALETTE.threat, transparent: true, opacity: 0.6 });
    this.bulletTrails = new THREE.InstancedMesh(trailGeo, trailMat, POOLS.bullets);
    this.bulletTrails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletTrails.frustumCulled = false;
    this.scene.add(this.bulletTrails);

    const shardMat = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1), shardMat, SHATTER.capacity);
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shards.frustumCulled = false;
    for (let i = 0; i < SHATTER.capacity; i++) this.shards.setColorAt(i, this.colors.threat);
    this.scene.add(this.shards);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  update(view: WorldView): void {
    const cam = view.camera;
    this.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    this.camera.rotation.y = cam.yaw;
    this.camera.rotation.x = cam.pitch;
    this.viewModel.visible = view.playerAmmo >= 0;

    const rackIndices = this.room.rackBoxIndices;
    for (let i = 0; i < rackIndices.length; i++) {
      this.racks.setMatrixAt(i, view.boxEnabled[rackIndices[i]!] ? this.rackMatrices[i]! : this.hidden);
    }
    this.racks.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < POOLS.enemies; i++) {
      const e = view.enemies[i]!;
      const mesh = this.enemies[i]!;
      const line = this.aimLines[i]!;
      mesh.visible = e.visible;
      line.visible = e.visible && e.state === "aim";
      if (!e.visible) continue;
      mesh.position.set(e.pos.x, e.pos.y + ENEMY.height / 2, e.pos.z);
      mesh.rotation.y = e.yaw;
      // Vacillement : l'ennemi penche en arrière.
      mesh.rotation.x = e.state === "stagger" ? 0.35 : 0;
      if (line.visible) {
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, e.pos.x, e.pos.y + MUZZLE_HEIGHT, e.pos.z);
        attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
        attr.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.aimProgress;
      }
    }

    for (let i = 0; i < POOLS.weapons; i++) {
      const w = view.weapons[i]!;
      const mesh = this.weapons[i]!;
      mesh.visible = w.visible && !w.heldByPlayer;
      if (!mesh.visible) continue;
      mesh.position.set(w.pos.x, w.pos.y, w.pos.z);
      mesh.rotation.set(w.angle, 0, w.angle * 0.5);
    }

    for (let i = 0; i < POOLS.bullets; i++) {
      const b = view.bullets[i]!;
      if (!b.active) {
        this.bulletHeads.setMatrixAt(i, this.hidden);
        this.bulletTrails.setMatrixAt(i, this.hidden);
        continue;
      }
      this.p.set(b.pos.x, b.pos.y, b.pos.z);
      this.m.makeTranslation(this.p.x, this.p.y, this.p.z);
      this.bulletHeads.setMatrixAt(i, this.m);
      this.dir.set(-b.vel.x, -b.vel.y, -b.vel.z).normalize();
      this.q.setFromUnitVectors(this.up, this.dir);
      this.s.set(1, TRAIL_LENGTH, 1);
      this.m.compose(this.p, this.q, this.s);
      this.bulletTrails.setMatrixAt(i, this.m);
    }
    this.bulletHeads.instanceMatrix.needsUpdate = true;
    this.bulletTrails.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < view.shards.length; i++) {
      const sh = view.shards[i]!;
      if (!sh.active) {
        this.shards.setMatrixAt(i, this.hidden);
        continue;
      }
      this.p.set(sh.pos.x, sh.pos.y, sh.pos.z);
      this.axis.set(sh.axis.x, sh.axis.y, sh.axis.z);
      this.q.setFromAxisAngle(this.axis, sh.angle);
      this.s.setScalar(sh.size);
      this.m.compose(this.p, this.q, this.s);
      this.shards.setMatrixAt(i, this.m);
      this.shards.setColorAt(i, sh.kind === 0 ? this.colors.threat : sh.kind === 1 ? this.colors.world : this.colors.ink);
    }
    this.shards.instanceMatrix.needsUpdate = true;
    if (this.shards.instanceColor) this.shards.instanceColor.needsUpdate = true;
  }
}

function toV3(v: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}
```

`src/app/input.ts` :

```ts
// Clavier + souris → PlayerInput. `KeyboardEvent.code` suit la position physique des touches :
// KeyW/KeyA/KeyS/KeyD couvrent ZQSD sur un clavier AZERTY.
import { type PlayerInput, emptyInput } from "../sim/game";

// Radians par pixel de souris, à sensibilité 1.
const BASE_SENSITIVITY = 0.0022;

export class InputController {
  sensitivity = 1;
  invertY = false;
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private firePressed = false;
  private throwPressed = false;
  private readonly out: PlayerInput = emptyInput();
  private readonly canvas: HTMLElement;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", (e) => {
      if (!this.held.has(e.code)) this.pressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.held.delete(e.code));
    window.addEventListener("blur", () => this.held.clear());
    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    document.addEventListener("mousedown", (e) => {
      if (!this.locked) return;
      if (e.button === 0) this.firePressed = true;
      if (e.button === 2) this.throwPressed = true;
    });
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  lock(): void {
    // requestPointerLock renvoie une promesse dans les navigateurs récents : on ignore un refus.
    void Promise.resolve(this.canvas.requestPointerLock()).catch(() => undefined);
  }

  // Vrai une seule fois par appui (R, Espace de menu, etc.).
  consumePress(code: string): boolean {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }

  // Vrai une seule fois par clic gauche (relance après la mort).
  consumeFire(): boolean {
    const had = this.firePressed;
    this.firePressed = false;
    return had;
  }

  // Échantillonne les commandes de l'image et vide les appuis ponctuels.
  sample(): PlayerInput {
    const o = this.out;
    o.moveZ = (this.held.has("KeyW") ? 1 : 0) - (this.held.has("KeyS") ? 1 : 0);
    o.moveX = (this.held.has("KeyD") ? 1 : 0) - (this.held.has("KeyA") ? 1 : 0);
    const k = BASE_SENSITIVITY * this.sensitivity;
    o.lookDX = this.mouseDX * k;
    o.lookDY = this.mouseDY * k * (this.invertY ? -1 : 1);
    o.lookPixels = Math.abs(this.mouseDX) + Math.abs(this.mouseDY);
    o.jump = this.held.has("Space");
    o.crouch = this.held.has("KeyC") || this.held.has("ControlLeft");
    o.fire = this.firePressed;
    o.throw = this.throwPressed;
    o.use = this.pressed.has("KeyE");
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.firePressed = false;
    this.throwPressed = false;
    this.pressed.delete("KeyE");
    return o;
  }

  // À la reprise : on oublie ce qui a été tapé pendant la pause.
  clear(): void {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.firePressed = false;
    this.throwPressed = false;
  }
}
```

`src/app/hud.ts` :

```ts
// Surcouche HTML minimale de la phase « gris » : réticule, messages, panneau debug.
// Le design system Monolithe + Encre arrive au plan 3.

export type HudMessage = "start" | "paused" | "dead" | "replay" | "won" | "none";

const MESSAGES: Record<Exclude<HudMessage, "none" | "replay">, string> = {
  start: "CLIQUE POUR JOUER",
  paused: "PAUSE ‧ CLIQUE POUR REPRENDRE",
  dead: "R OU CLIC ‧ RECOMMENCER",
  won: "R ‧ REJOUER  ·  ESPACE ‧ REVOIR",
};

export class Hud {
  private readonly crosshair: HTMLElement;
  private readonly message: HTMLElement;
  private readonly debug: HTMLElement;
  private readonly deathTint: HTMLElement;
  private crosshairTurns = 0;
  private wasCoolingDown = false;
  private current: HudMessage = "none";

  constructor(root: HTMLElement, debugEnabled: boolean) {
    this.crosshair = el(root, "crosshair");
    this.message = el(root, "message");
    this.deathTint = el(root, "death-tint");
    this.debug = el(root, "debug");
    this.debug.hidden = !debugEnabled;
  }

  show(message: HudMessage): void {
    if (message === this.current && message !== "replay") return;
    this.current = message;
    this.deathTint.classList.toggle("on", message === "dead");
    this.crosshair.hidden = message !== "none";
    if (message === "none" || message === "replay") {
      this.message.textContent = "";
      this.message.classList.remove("chant");
      return;
    }
    this.message.textContent = MESSAGES[message];
    this.message.classList.remove("chant");
  }

  // « AGENT » puis « HOT », en alternance toutes les 0,5 s de replay.
  chant(playhead: number): void {
    const word = Math.floor(playhead / 0.5) % 2 === 0 ? "AGENT" : "HOT";
    if (this.message.textContent !== word) this.message.textContent = word;
    this.message.classList.add("chant");
  }

  // Le réticule fait un demi-tour quand une balle est chambrée (fin du temps de recharge).
  updateCrosshair(cooldown: number): void {
    const cooling = cooldown > 0;
    if (this.wasCoolingDown && !cooling) {
      this.crosshairTurns++;
      this.crosshair.style.transform = `translate(-50%, -50%) rotate(${this.crosshairTurns * 180}deg)`;
    }
    this.wasCoolingDown = cooling;
  }

  setDebug(text: string): void {
    if (!this.debug.hidden) this.debug.textContent = text;
  }
}

function el(root: HTMLElement, id: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(`#${id}`);
  if (!found) throw new Error(`HUD element #${id} missing`);
  return found;
}
```

`src/app/main.ts` :

```ts
// Point d'entrée de la phase « gris » : une salle, sans menu. Machine d'états réduite.
import "./style.css";
import { ReplayPlayer } from "../replay/player";
import { ReplayRecorder } from "../replay/recorder";
import { createRenderer } from "../render/create-renderer";
import { WorldRenderer } from "../render/world-renderer";
import { room01 } from "../rooms/room-01-datacenter";
import { Game } from "../sim/game";
import { createWorldView, writeGameView } from "../sim/view";
import { Hud } from "./hud";
import { InputController } from "./input";

type Mode = "start" | "playing" | "paused" | "dead" | "replay" | "won";

const params = new URLSearchParams(window.location.search);
const debug = params.has("debug");

const app = document.querySelector<HTMLElement>("#app")!;
const { renderer, isWebGPU } = await createRenderer(app, params.get("renderer") === "webgl");
const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
const game = new Game(room01);
const view = createWorldView(room01.boxes.length, game.shatter.shards);
const recorder = new ReplayRecorder();
const replay = new ReplayPlayer(recorder, room01);
const input = new InputController(renderer.domElement);
const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);

let mode: Mode = "start";
let last = performance.now();
let restartStartedAt = -1;
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;

function startRun(): void {
  game.reset();
  recorder.reset();
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  input.clear();
}

function setMode(next: Mode): void {
  mode = next;
  hud.show(next === "playing" ? "none" : next);
}

renderer.domElement.addEventListener("click", () => {
  if (mode === "start" || mode === "paused") input.lock();
});
document.addEventListener("pointerlockchange", () => {
  if (input.locked && (mode === "start" || mode === "paused")) {
    if (mode === "start") startRun();
    input.clear();
    setMode("playing");
  } else if (!input.locked && mode === "playing") {
    setMode("paused");
  }
});
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  world.resize(window.innerWidth / window.innerHeight);
});

writeGameView(game, view);
world.update(view);
setMode("start");

renderer.setAnimationLoop(() => {
  const now = performance.now();
  // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (mode === "playing") {
    game.step(dt, input.sample());
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, game.status !== "playing");
    hud.updateCrosshair(view.playerCooldown);
    world.update(view);
    if (game.status === "dead") setMode("dead");
    if (game.status === "won") {
      replay.restart();
      setMode("replay");
    }
  } else if (mode === "dead" || mode === "won") {
    // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
    const clicked = input.consumeFire() && mode === "dead";
    if (input.consumePress("KeyR") || clicked) {
      restartStartedAt = now;
      startRun();
      setMode("playing");
      world.update(view);
    } else if (mode === "won" && input.consumePress("Space")) {
      replay.restart();
      setMode("replay");
    }
  } else if (mode === "replay") {
    replay.update(dt);
    world.update(replay.view);
    hud.chant(replay.playhead);
    if (replay.finished) setMode("won");
  }

  renderer.render(world.scene, world.camera);

  if (restartStartedAt >= 0) {
    if (debug) console.info(`[agenthot] restart ${(performance.now() - restartStartedAt).toFixed(1)} ms`);
    restartStartedAt = -1;
  }
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
  }
  hud.setDebug(
    `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
      `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
  );
});
```

- [ ] **Step 2 : types, tests et build**

Run : `cd <racine> && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test && RTK_DISABLED=1 bun run build`
Expected :
- `tsc` sans sortie ;
- `37 pass` ;
- build réussi, avec un fichier `dist/assets/index-*.js` d'environ 230 Ko en gzip.
- L'avertissement « chunks larger than 500 kB » est attendu, car Three.js est dans le même fichier. Le découpage viendra au plan 3.

- [ ] **Step 3 : vérifier dans Chrome**

Lancer `cd <racine> && bun run dev --port 5199 --strictPort` en arrière-plan. Puis, avec le MCP Chrome DevTools :

1. `new_page` `http://localhost:5199/?debug`, puis capture.
   - **Attendu :** vue depuis l'entrée de la salle, baies grises alignées, vide bleu nuit au-dessus, « CLIQUE POUR JOUER », pistolet noir en bas à droite.
   - **Panneau debug :** `WebGPU ‧ ~120 fps ‧ < 60 draws`.
   - **Console :** pas d'erreur, hors 404 `favicon.ico`.
2. `take_snapshot`, `click` sur le Canvas, puis `press_key` `w`, puis capture.
   - **Attendu :** « CLIQUE POUR JOUER » disparaît, réticule au centre, le temps de simulation du panneau avance.
3. `navigate_page` `http://localhost:5199/?debug&renderer=webgl`, puis capture.
   - **Attendu :** même image, panneau `WebGL2 ‧ …` (AC-9, partie affichage).

Arrêter le serveur ensuite.

- [ ] **Step 4 : commit**

```bash
cd <racine> && git add index.html src/app src/render && git commit -m "feat(app): add greybox client (WebGPU renderer, input, HUD, game loop)"
```

---

### Task 8 : test de sensation par Romain (porte avant les plans 2 et 3)

Cette tâche ne s'automatise pas : c'est Romain qui joue. L'exécutant prépare, mesure ce qui se mesure, puis s'arrête et attend son verdict.

- [ ] **Step 1 : préparer**

Lancer `cd <racine> && bun run dev`, puis donner à Romain l'URL `http://localhost:5173/?debug`.

- [ ] **Step 2 : mesures pendant que Romain joue**

- **AC-6 :** relever dans la console les lignes `[agenthot] restart X ms`, sur au moins 10 relances (R ou clic après une mort). Attendu : maximum < 50 ms.
- **AC-8 (partiel, sans les effets du plan 2) :** relever le panneau debug au moment le plus chargé, soit 5 ennemis et un éclatement. Attendu : environ 120 i/s sur l'écran de Romain, et moins de 60 appels de dessin.
- **AC-9 :** une partie complète avec `?renderer=webgl`, jusqu'à la victoire.
- **Review Focus 4 :** Échap en pleine partie, attendre 10 s, reprendre. Attendu : la partie reprend où elle était, sans bond dans le temps.
- **Review Focus 5 :** Romain joue en ZQSD (AZERTY). Attendu : Z avance, Q va à gauche, S recule, D va à droite.

- [ ] **Step 3 : recueillir le verdict**

Poser à Romain ces questions, une par une :
1. Le temps « claque » ? Arrêt, marche, regard, tir.
2. Les balles se lisent au ralenti ?
3. La boucle lancer, vacillement, capture est-elle jouissive ?
4. En combien d'essais as-tu gagné ? (spec : moins de 5 en moyenne)
5. Le replay donne-t-il l'effet « film d'action » ?

- [ ] **Step 4 : régler, puis arrêter**

- Appliquer les réglages demandés. Ils vivent dans :
  - `TIME` (`src/sim/time.ts`) ;
  - `PLAYER`, `ENEMY`, `WEAPON`, `BULLET` (`src/sim/entities.ts`) ;
  - l'agencement de `room01`.
- Relancer `bun test` après chaque réglage : les tests vérifient des comportements, pas des valeurs, et doivent rester verts.
- Commit par série de réglages : `tune: <quoi>`.
- **S'arrêter là.** Les plans 2 et 3 ne s'écrivent qu'après le « go » de Romain sur la sensation.
