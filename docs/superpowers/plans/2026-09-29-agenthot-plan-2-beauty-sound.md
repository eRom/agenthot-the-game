# AGENTHOT, plan 2 : beauté et son

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** habiller la salle 1 et lui donner sa voix. Des ennemis en verre facetté, animés en code ; des contours à l'encre, un glow réservé à la menace, des ombres douces ; des bruitages synthétisés qui s'étouffent quand le temps ralentit ; la musique Lyria en jeu et au replay.

**Architecture :**
- La simulation (`src/sim`) reste pure. Elle gagne ce que le rendu et le son doivent lire : progression des états, distance marchée, porteur d'une arme, point de départ d'une balle, hauteur des yeux lissée, événement `nearMiss`.
- Le rendu (`src/render`) calcule la pose des ennemis en TypeScript pur (`enemy-pose.ts`, testé avec bun), puis la dessine en 8 `InstancedMesh`. Un seul rendu de scène à trois sorties (MRT) alimente les contours, le glow et l'aberration (`post.ts`).
- Le son (`src/audio`) lit la même `WorldView` et la même file d'événements que le rendu, en jeu comme au replay. Les conversions `timeScale` → coupure et débit sont pures et testées.
- Le replay enregistre désormais les tirs, impacts et frôlements : il rejoue le son.

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4, Three.js r186 (`three/webgpu`, `three/tsl`, `three/addons`), Web Audio API, Lyria 3.5 (API Gemini).

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, étapes 4 et 5 de la section 11 : sections 5.6, 5.8, 6.2, 7, la musique de la section 8, et AC-8, AC-13, AC-19. Intent : `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md`.

**Place de ce plan :** plan 2 sur 3. Le plan 1 (salle en gris) est fusionné dans `main`. Le plan 3 fera les écrans, les assets d'image, la cinématique et la mise en ligne.

## Global Constraints

- **Langue :** identifiants, clés, noms de fichiers, messages de log en anglais ; commentaires en français. Les descriptions de test sont en français, car Romain les lit : garder tel quel.
- **Outillage :** `bun` uniquement (jamais `npm`, `npx`, `node`). Aucune nouvelle dépendance : tout vient de `three` 0.186 et du navigateur.
- **Imports Three.js :** `three/webgpu` pour les classes, `three/tsl` pour les nœuds, `three/addons/...` pour `bloom` et `mergeGeometries`. Vérifié dans `node_modules/three` 0.186.0 :
  - `RenderPipeline(renderer, outputNode)` et `pipeline.render()` remplacent `renderer.render()` ;
  - `pass(scene, camera)`, `setMRT(mrt({...}))`, `getTextureNode(name)`, `material.mrtNode` ;
  - `bloom(node, strength, radius, threshold)` depuis `three/addons/tsl/display/BloomNode.js` ;
  - `PCFSoftShadowMap` n'existe plus en r186 (repli sur `PCFShadowMap` avec avertissement) : utiliser `PCFShadowMap` et `shadow.radius` ;
  - `renderer.info` n'est remis à zéro que par la boucle d'animation : lire les appels de dessin dans le panneau debug (`?debug`).
- **Zéro allocation dans la boucle de jeu et de rendu** (spec 9.1) : `step`, `update`, `writeView`, `poseEnemy`. Seule exception assumée : le son crée ses nœuds Web Audio à chaque bruitage, car une source Web Audio ne sert qu'une fois (quelques nœuds par événement, pas par image).
- **Palette** (spec 6.1) : l'orange (`threat`, `threat-hot`) ne va qu'aux ennemis, balles, traînées, traits de visée et éclats d'ennemi. Seuls ces matériaux portent le masque de glow (`GLOW_MRT`).
- **Dépenses** (spec 8) : chaque génération Lyria ajoute une ligne à `assets/ledger.jsonl` ; le script refuse tout appel qui ferait dépasser 3,00 $.
- **Git :** `git add` de fichiers nommés seulement. Jamais `git add -A` ni `git add .` : le dépôt contient des fichiers non commités de Romain (`docs/superpowers/idea/*`, `OVERVIEW.md` modifié, `.impeccable/`, `.ignore`).
- **Commandes Bash :** chaque commande qui écrit commence par `cd <racine du dépôt> &&`. Sortie brute des tests : préfixe `RTK_DISABLED=1`. Toute sortie de test citée dans un rapport vient d'une commande passée par `tee` vers un fichier nommé dans le rapport.

## Review Focus

Cinq cas qu'un joueur rencontrera et qu'aucun test de tâche ne couvre seul. Chacun a sa vérification dans la tâche propriétaire.

1. **Échap en pleine partie, ou onglet en arrière-plan.** Le son se fige comme l'image : grave, étouffé, musique ralentie. Vérification : tâche 7, `main.ts` appelle `audio.freeze(TIME.min)` hors jeu et hors replay ; écoute en tâche 9.
2. **Musique pas encore générée (fichier absent) ou réseau coupé.** Le jeu reste muet de musique, sans erreur ni blocage. Vérification : tâche 8, étape Chrome (fichier `replay.mp3` absent : `loaded` faux, aucune exception).
3. **Navigateur sans WebGPU.** Contours, glow et ombres identiques en WebGL2 (AC-9, partie affichage). Vérification : tâche 6, capture `?renderer=webgl`.
4. **Rafale : plusieurs tirs et un éclatement dans la même image.** Pas de saturation : chaque bruitage crête autour de 1, le compresseur absorbe la somme. Vérification : tâche 7, rendu hors ligne des bruitages.
5. **Firefox (auditeur Web Audio sans `positionX`).** Le son reste spatialisé grâce au repli `setPosition` / `setOrientation`. Vérification : tâche 9, une partie dans Firefox.

## Structure des fichiers

```
src/
  sim/        entities.ts, game.ts, view.ts, player-system.ts, enemy-system.ts,
              projectile-system.ts, shatter.ts, events.ts            (modifiés)
  replay/     recorder.ts, player.ts                                  (modifiés)
  render/     bullet-look.ts, enemy-pose.ts, enemy-bodies.ts,
              materials.ts, post.ts                                   (nouveaux)
              world-renderer.ts, create-renderer.ts                   (modifiés)
  audio/      time-coupling.ts, audio-engine.ts, sfx.ts, music.ts,
              game-audio.ts                                           (nouveaux)
  app/        main.ts                                                 (modifié)
scripts/      lyria.ts, generate-music.ts                             (nouveaux)
tests/        replay-roundtrip, bullet-look, world-view, events, sim-fixes,
              enemy-pose, audio-time, lyria (nouveaux) ; replay.test.ts (modifié)
assets/       ledger.jsonl, lyria-*-response.json                     (tâche 8)
public/audio/ game.mp3, replay.mp3                                    (tâche 8)
```

Chaque fichier a une seule responsabilité :
- `enemy-pose.ts` : la pose, en calcul pur ; `enemy-bodies.ts` : son dessin instancié ;
- `post.ts` : tout le post-traitement ; `materials.ts` : qui brille et qui ne brille pas ;
- `time-coupling.ts` : le son en fonction du temps, en calcul pur ; `audio-engine.ts` : le graphe ; `sfx.ts` : la synthèse ; `game-audio.ts` : événements → sons.

## Prototype vérifié

Tout le code de ce plan a été exécuté avant d'être écrit ici (2026-09-29), sur une copie du dépôt au commit `ae2f412` (code identique à `main`).
- **Rejeu par tâche dans un dossier vide :** les tests de chaque tâche échouent avant son code et passent après ; `tsc` passe à chaque étape ; les diffs de ce plan s'appliquent dans l'ordre et redonnent exactement l'arbre du prototype. Suite : 58 → 65 → 70 → 76 → 82 → 88 → 88 → 93 → 100 tests verts. Build final : 961 Ko, 266 Ko gzip.
- **Mutants tués :** le test aller-retour du replay échoue si un seul champ n'est plus écrit ; les tests de mêlée échouent si l'une des trois gardes (hauteur, ligne de vue à l'élan, ligne de vue au coup) est retirée ; les tests de pose échouent si le sens du penché, l'élévation de visée ou l'ancrage des pieds est inversé.
- **Chrome (WebGPU et WebGL2) :** corps facettés, contours, glow limité à la menace, ombres, éclatement, aberration de mort, tir du joueur qui ne couvre plus l'écran. 44 appels de dessin, constants quel que soit le nombre d'ennemis (53 avant fusion des boîtes et des traits de visée).
- **Son :** rendu hors ligne (`OfflineAudioContext`) de chaque bruitage (pic, énergie, durée) ; au débit 0,2 le tir dure 5 fois plus longtemps et descend dans le grave ; la musique au débit 0,5 descend d'une octave (220 Hz → 110 Hz mesurés).

**Comment appliquer ce plan :**
- Un fichier **nouveau** est donné en entier : le recopier tel quel.
- Un fichier **modifié** est donné en diff unifié, produit par `git diff` sur le prototype. L'appliquer à la main (Edit), ou l'enregistrer dans un fichier puis `git apply <fichier>` depuis la racine. Les numéros de ligne supposent que les tâches précédentes sont faites.

## Écarts assumés par rapport à la passation

- **Balles (entrée 1) :** la vue porte le point de départ (`origin`) et pas l'âge ni le tireur. Pour une balle en ligne droite, `min(4, |pos − origin|)` vaut `min(4, vitesse × âge)`, et c'est juste aussi au replay interpolé. Le tireur ne sert à rien au rendu : la sphère de dégagement autour de la caméra règle le cas des balles du joueur.
- **Joueur (entrée 2) :** la caméra ne saute plus à l'accroupissement (hauteur des yeux lissée dans la simulation). Les drapeaux « accroupi » et « en saut » ne sont pas ajoutés à la vue : rien ne les lit.
- **Contours :** la menace (corps, éclats, balles, traînées, traits de visée) n'a pas de contour encre ; son halo la détoure. Raison mesurée : l'anticrénelage moyenne le masque d'un trait d'un pixel, et le détecteur noircissait les traits de visée. Décision à confirmer par Romain à la tâche 9.
- **Sons de menu :** reportés au plan 3, avec le menu qui les joue (sinon ce serait du code mort ici).
- **Boucle du menu (Lyria) :** reportée au plan 3, avec le menu. Le script de la tâche 8 la génèrera en ajoutant une entrée.

---

### Task 1 : balles lisibles au tir, et filet de sécurité du replay (entrées 1 et 3)

Le test aller-retour vient **avant** tout nouveau champ : il remplit chaque feuille de la `WorldView` en parcourant l'objet, donc un champ ajouté plus tard sans son écriture dans le replay le fait échouer tout seul.

**Files :**
- Create : `tests/replay-roundtrip.test.ts`, `tests/bullet-look.test.ts`, `src/render/bullet-look.ts`
- Modify : `src/sim/entities.ts`, `src/sim/game.ts`, `src/sim/view.ts`, `src/replay/recorder.ts`, `src/replay/player.ts`, `src/render/world-renderer.ts`

**Interfaces :**
- Produces :
  - `Bullet.origin: Vec3` et `BulletView.origin: Vec3` (point de départ, écrit par `spawnBullet`) ;
  - `BULLET_LOOK { trailMax, headRadius, cameraClearance, headFadeNear, headFadeFar }` ;
  - `trailLength(pos, vel, origin, cam): number` et `headScale(pos, cam): number` (0 à 1) ;
  - `LAYOUT` calculé bloc par bloc à partir des largeurs (`ENEMY_STRIDE`, `BULLET_STRIDE` = 10, `WEAPON_STRIDE`).

- [ ] **Step 1 : écrire le test aller-retour**

`tests/replay-roundtrip.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { Game } from "../src/sim/game";
import { ENEMY_STATE_CODES, type WorldView, createWorldView } from "../src/sim/view";
import { enemyAt, testRoom } from "./helpers";

// Champs que le replay ne relit pas depuis les échantillons : éclats (rejoués par événements),
// décor (idem) et échelle du temps (le replay se joue à vitesse réelle).
const NOT_SAMPLED = new Set(["shards", "boxEnabled", "timeScale"]);

// Remplit chaque feuille de la vue (nombre, booléen, état) avec une valeur distincte, en parcourant
// l'objet : un champ ajouté plus tard à WorldView est couvert sans toucher à ce test.
function fillEveryField(node: unknown, flag: boolean, counter: { n: number }): void {
  if (Array.isArray(node)) {
    for (const item of node) fillEveryField(item, flag, counter);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (NOT_SAMPLED.has(key)) continue;
    const value = obj[key];
    counter.n++;
    if (key === "state") obj[key] = ENEMY_STATE_CODES[counter.n % ENEMY_STATE_CODES.length];
    // Multiples de 0,25 : exacts en Float32, donc comparables à l'égalité stricte.
    else if (typeof value === "number") obj[key] = (flag ? 1 : -1) * (counter.n * 0.25 + 0.5);
    else if (typeof value === "boolean") obj[key] = flag;
    else if (typeof value === "object" && value !== null) fillEveryField(value, flag, counter);
  }
}

function sampledPart(view: WorldView): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(view)) if (!NOT_SAMPLED.has(key)) out[key] = (view as unknown as Record<string, unknown>)[key];
  return structuredClone(out);
}

describe("replay : aller-retour d'un échantillon", () => {
  // Deux passes (vrai / faux, positif / négatif) : un champ oublié par l'enregistreur garde
  // sa valeur par défaut, qui ne peut pas coïncider avec les deux passes à la fois.
  for (const flag of [true, false]) {
    test(`chaque champ de la vue écrit par l'enregistreur est relu à l'identique (passe ${flag ? "A" : "B"})`, () => {
      const game = new Game(testRoom([enemyAt(0, -5)]));
      const view = createWorldView(game.room.boxes.length, game.shatter.shards);
      fillEveryField(view, flag, { n: 0 });
      const expected = sampledPart(view);
      const recorder = new ReplayRecorder();
      recorder.capture(0, view, true);
      recorder.capture(1 / 60, view, true);
      const replay = new ReplayPlayer(recorder, game.room);
      expect(sampledPart(replay.view)).toEqual(expected);
    });
  }
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/replay-roundtrip.test.ts`
Expected : `2 pass`. Il passe sur le code actuel : c'est un filet, il doit rester vert à chaque tâche.

Contrôle qu'il mord : dans `src/replay/recorder.ts`, remplacer `s[k + 5] = w.angle;` par `s[k + 5] = 0;`, relancer : `2 fail`. Annuler la modification.

- [ ] **Step 2 : écrire le test des balles**

`tests/bullet-look.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { BULLET_LOOK, headScale, trailLength } from "../src/render/bullet-look";
import { Game } from "../src/sim/game";
import { vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

const SPEED = vec3(0, 0, -45);

describe("aspect des balles (tâche 1 du plan 2)", () => {
  test("une balle du joueur qui vient de partir de l'œil ne couvre pas l'écran", () => {
    const cam = vec3(0, 1.7, 0);
    const pos = vec3(0, 1.7, -0.02);
    expect(headScale(pos, cam)).toBe(0);
    expect(trailLength(pos, SPEED, cam, cam)).toBe(0);
  });

  test("la traînée d'une balle du joueur reste hors de la sphère de dégagement de la caméra", () => {
    const cam = vec3(0, 1.7, 0);
    const pos = vec3(0, 1.7, -3);
    expect(trailLength(pos, SPEED, cam, cam)).toBeCloseTo(3 - BULLET_LOOK.cameraClearance, 5);
    expect(headScale(pos, cam)).toBe(1);
  });

  test("la traînée ne remonte jamais au-delà du point de départ (pas à travers le tireur)", () => {
    const origin = vec3(0, 1.4, -10);
    const pos = vec3(0, 1.4, -9.5);
    const cam = vec3(0, 1.7, 0);
    expect(trailLength(pos, vec3(0, 0, 45), origin, cam)).toBeCloseTo(0.5, 5);
  });

  test("une balle ennemie qui arrive sur la caméra garde sa traînée pleine", () => {
    const origin = vec3(0, 1.7, -8);
    const pos = vec3(0, 1.7, -1);
    const cam = vec3(0, 1.7, 0);
    expect(trailLength(pos, vec3(0, 0, 45), origin, cam)).toBe(BULLET_LOOK.trailMax);
  });

  test("la vue du monde porte le point de départ de chaque balle", () => {
    // Ennemi à l'écart de la trajectoire : la balle vole jusqu'au mur du fond.
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    game.step(FRAME, input({ fire: true }));
    for (let i = 0; i < 20; i++) game.step(FRAME, input({ moveZ: 1 }));
    writeGameView(game, view);
    const bullet = view.bullets.find((b) => b.active)!;
    expect(bullet.origin.y).toBeCloseTo(1.7, 5);
    expect(bullet.origin.z).toBeCloseTo(0, 5);
    expect(bullet.pos.z).toBeLessThan(-1);
  });
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/bullet-look.test.ts`
Expected : FAIL, `Cannot find module '../src/render/bullet-look'`.

- [ ] **Step 3 : écrire le code**

`src/render/bullet-look.ts` :

```ts
// Aspect des balles, en calcul pur (testé sans Three.js) : longueur de traînée et taille de la tête.
import type { Vec3 } from "../sim/vec3";

export const BULLET_LOOK = {
  // Traînée orange de 2 à 4 m (spec 5.3) : 4 m au plus.
  trailMax: 4,
  // Rayon de la tête dessinée (la zone de touche reste BULLET.radius).
  headRadius: 0.07,
  // Rien de la balle n'entre dans cette sphère autour de la caméra : sinon elle couvre l'écran.
  cameraClearance: 0.5,
  // La tête grandit de 0 à sa taille entre ces deux distances à la caméra.
  headFadeNear: 0.5,
  headFadeFar: 1.2,
} as const;

// Longueur de traînée, derrière la tête et à l'opposé de la vitesse :
// - au plus trailMax ;
// - jamais au-delà du point de départ (sinon elle traverse le tireur) ;
// - coupée avant d'entrer dans la sphère de dégagement de la caméra.
export function trailLength(pos: Vec3, vel: Vec3, origin: Vec3, cam: Vec3): number {
  let len = Math.min(BULLET_LOOK.trailMax, Math.hypot(pos.x - origin.x, pos.y - origin.y, pos.z - origin.z));
  const speed = Math.hypot(vel.x, vel.y, vel.z);
  if (speed < 1e-6) return 0;
  // Direction de la traînée (−vitesse) et caméra vue depuis la tête.
  const tx = -vel.x / speed;
  const ty = -vel.y / speed;
  const tz = -vel.z / speed;
  const cx = cam.x - pos.x;
  const cy = cam.y - pos.y;
  const cz = cam.z - pos.z;
  const along = cx * tx + cy * ty + cz * tz;
  if (along <= 0) return len;
  const r = BULLET_LOOK.cameraClearance;
  const perpSq = cx * cx + cy * cy + cz * cz - along * along;
  if (perpSq >= r * r) return len;
  // Point où la traînée entre dans la sphère de dégagement.
  const entry = along - Math.sqrt(r * r - perpSq);
  len = Math.min(len, Math.max(0, entry));
  return len;
}

// Échelle de la tête (0 à 1) selon sa distance à la caméra.
export function headScale(pos: Vec3, cam: Vec3): number {
  const d = Math.hypot(pos.x - cam.x, pos.y - cam.y, pos.z - cam.z);
  const t = (d - BULLET_LOOK.headFadeNear) / (BULLET_LOOK.headFadeFar - BULLET_LOOK.headFadeNear);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}
```

Diffs des fichiers modifiés :

```diff
diff --git a/src/render/world-renderer.ts b/src/render/world-renderer.ts
index cf5de9b..ddcba8a 100644
--- a/src/render/world-renderer.ts
+++ b/src/render/world-renderer.ts
@@ -4,9 +4,9 @@ import type { RoomDefinition } from "../rooms/types";
 import { ENEMY, POOLS } from "../sim/entities";
 import { SHATTER } from "../sim/shatter";
 import type { WorldView } from "../sim/view";
+import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
 import { PALETTE } from "./palette";
 
-const TRAIL_LENGTH = 4;
 const MUZZLE_HEIGHT = ENEMY.muzzleHeight;
 
 export class WorldRenderer {
@@ -115,7 +115,7 @@ export class WorldRenderer {
     this.camera.add(this.viewModel);
 
     const bulletMat = new THREE.MeshBasicMaterial({ color: PALETTE.threatHot });
-    this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), bulletMat, POOLS.bullets);
+    this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(BULLET_LOOK.headRadius, 8, 6), bulletMat, POOLS.bullets);
     this.bulletHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
     this.bulletHeads.frustumCulled = false;
     this.scene.add(this.bulletHeads);
@@ -195,11 +195,13 @@ export class WorldRenderer {
         continue;
       }
       this.p.set(b.pos.x, b.pos.y, b.pos.z);
-      this.m.makeTranslation(this.p.x, this.p.y, this.p.z);
+      // Tête et traînée s'effacent près de la caméra : une balle qui part de l'œil ne couvre pas l'écran.
+      this.s.setScalar(headScale(b.pos, cam.pos));
+      this.m.compose(this.p, this.q.identity(), this.s);
       this.bulletHeads.setMatrixAt(i, this.m);
       this.dir.set(-b.vel.x, -b.vel.y, -b.vel.z).normalize();
       this.q.setFromUnitVectors(this.up, this.dir);
-      this.s.set(1, TRAIL_LENGTH, 1);
+      this.s.set(1, trailLength(b.pos, b.vel, b.origin, cam.pos), 1);
       this.m.compose(this.p, this.q, this.s);
       this.bulletTrails.setMatrixAt(i, this.m);
     }
diff --git a/src/replay/player.ts b/src/replay/player.ts
index 55e4abe..4a0b441 100644
--- a/src/replay/player.ts
+++ b/src/replay/player.ts
@@ -123,6 +123,7 @@ export class ReplayPlayer {
       const k = s[kb] === 1 ? t : 0;
       set(bullet.pos, mix(s[ka + 1]!, s[kb + 1]!, k), mix(s[ka + 2]!, s[kb + 2]!, k), mix(s[ka + 3]!, s[kb + 3]!, k));
       set(bullet.vel, s[ka + 4]!, s[ka + 5]!, s[ka + 6]!);
+      set(bullet.origin, s[ka + 7]!, s[ka + 8]!, s[ka + 9]!);
     }
     for (let i = 0; i < POOLS.weapons; i++) {
       const ka = a + LAYOUT.weapons + i * LAYOUT.weaponStride;
diff --git a/src/replay/recorder.ts b/src/replay/recorder.ts
index d7e179e..683d82b 100644
--- a/src/replay/recorder.ts
+++ b/src/replay/recorder.ts
@@ -10,18 +10,28 @@ export const REPLAY = {
   eventCapacity: 64,
 } as const;
 
-// Disposition d'un échantillon dans le tableau plat.
+// Disposition d'un échantillon dans le tableau plat. Chaque bloc se calcule à partir du précédent :
+// changer une largeur ne demande pas de recompter les offsets à la main.
+const CAMERA = 1; // x, y, z, yaw, pitch
+const ENEMIES = CAMERA + 5;
+const ENEMY_STRIDE = 10; // visible, state, x, y, z, yaw, aimX, aimY, aimZ, aimProgress
+const BULLETS = ENEMIES + POOLS.enemies * ENEMY_STRIDE;
+const BULLET_STRIDE = 10; // active, x, y, z, vx, vy, vz, originX, originY, originZ
+const WEAPONS = BULLETS + POOLS.bullets * BULLET_STRIDE;
+const WEAPON_STRIDE = 6; // visible, held, x, y, z, angle
+const MISC = WEAPONS + POOLS.weapons * WEAPON_STRIDE; // ammo, cooldown, timeScale
+
 export const LAYOUT = {
   time: 0,
-  camera: 1, // x, y, z, yaw, pitch
-  enemies: 6, // par ennemi : visible, state, x, y, z, yaw, aimX, aimY, aimZ, aimProgress
-  enemyStride: 10,
-  bullets: 6 + POOLS.enemies * 10, // par balle : active, x, y, z, vx, vy, vz
-  bulletStride: 7,
-  weapons: 6 + POOLS.enemies * 10 + POOLS.bullets * 7, // par arme : visible, held, x, y, z, angle
-  weaponStride: 6,
-  misc: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6, // ammo, cooldown, timeScale
-  stride: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6 + 3,
+  camera: CAMERA,
+  enemies: ENEMIES,
+  enemyStride: ENEMY_STRIDE,
+  bullets: BULLETS,
+  bulletStride: BULLET_STRIDE,
+  weapons: WEAPONS,
+  weaponStride: WEAPON_STRIDE,
+  misc: MISC,
+  stride: MISC + 3,
 } as const;
 
 // Événements rejoués : ceux qui déclenchent des éclats ou changent le décor.
@@ -123,6 +133,9 @@ function writeSample(s: Float32Array, o: number, simTime: number, view: WorldVie
     s[k + 4] = b.vel.x;
     s[k + 5] = b.vel.y;
     s[k + 6] = b.vel.z;
+    s[k + 7] = b.origin.x;
+    s[k + 8] = b.origin.y;
+    s[k + 9] = b.origin.z;
   }
   for (let i = 0; i < POOLS.weapons; i++) {
     const w = view.weapons[i]!;
diff --git a/src/sim/entities.ts b/src/sim/entities.ts
index 74c965f..b3d2c6f 100644
--- a/src/sim/entities.ts
+++ b/src/sim/entities.ts
@@ -121,6 +121,8 @@ export interface Bullet {
   ownerId: number;
   pos: Vec3;
   vel: Vec3;
+  // Point de départ : le rendu y arrête la traînée, pour qu'elle ne traverse pas le tireur.
+  origin: Vec3;
   life: number;
 }
 
@@ -171,7 +173,7 @@ export function createWeapon(id: number): Weapon {
 }
 
 export function createBullet(): Bullet {
-  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), life: 0 };
+  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), origin: vec3(), life: 0 };
 }
 
 // Direction du regard : lacet 0 = -Z, tangage positif = vers le haut.
diff --git a/src/sim/game.ts b/src/sim/game.ts
index 1063897..63ef52d 100644
--- a/src/sim/game.ts
+++ b/src/sim/game.ts
@@ -184,6 +184,7 @@ export class Game {
       b.life = 0;
       // Départ exact à l'origine : le tireur est exclu de ses balles par ownerId, et rien n'échappe au balayage.
       copy(b.pos, origin);
+      copy(b.origin, origin);
       scale(b.vel, dir, BULLET.speed);
       this.events.push("shot", this.simTime, ownerId, NO_ID, b.pos, b.vel);
       return;
diff --git a/src/sim/view.ts b/src/sim/view.ts
index 68eb3fd..bc8403e 100644
--- a/src/sim/view.ts
+++ b/src/sim/view.ts
@@ -30,6 +30,8 @@ export interface BulletView {
   active: boolean;
   pos: Vec3;
   vel: Vec3;
+  // Point de départ de la balle (fin de la traînée).
+  origin: Vec3;
 }
 
 export interface WeaponView {
@@ -67,7 +69,7 @@ export function createWorldView(boxCount: number, shards: Shard[]): WorldView {
   for (let i = 0; i < POOLS.enemies; i++) {
     view.enemies.push({ visible: false, state: "inactive", pos: vec3(), yaw: 0, aimPoint: vec3(), aimProgress: 0 });
   }
-  for (let i = 0; i < POOLS.bullets; i++) view.bullets.push({ active: false, pos: vec3(), vel: vec3() });
+  for (let i = 0; i < POOLS.bullets; i++) view.bullets.push({ active: false, pos: vec3(), vel: vec3(), origin: vec3() });
   for (let i = 0; i < POOLS.weapons; i++) view.weapons.push({ visible: false, heldByPlayer: false, pos: vec3(), angle: 0 });
   return view;
 }
@@ -95,6 +97,7 @@ export function writeGameView(game: Game, view: WorldView): void {
     v.active = b.active;
     copy(v.pos, b.pos);
     copy(v.vel, b.vel);
+    copy(v.origin, b.origin);
   }
   for (let i = 0; i < game.weapons.length; i++) {
     const w = game.weapons[i]!;
```

- [ ] **Step 4 : tests et types**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t1-tests.log && RTK_DISABLED=1 bun run typecheck`
Expected : `65 pass`, `0 fail` ; `tsc` sans sortie. Le test aller-retour échoue pendant le travail tant que `origin` n'est pas écrit et relu par le replay : c'est voulu.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add tests/replay-roundtrip.test.ts tests/bullet-look.test.ts src/render/bullet-look.ts src/sim/entities.ts src/sim/game.ts src/sim/view.ts src/replay/recorder.ts src/replay/player.ts src/render/world-renderer.ts && git commit -m "fix(render): keep bullets off the camera and out of the shooter; test the replay round trip"
```

La vérification visuelle du tir se fait en tâche 6 (étape Chrome), quand la sonde debug existe.

---

### Task 2 : la vue du monde complète, avant d'animer (entrée 2)

**Files :**
- Create : `tests/world-view.test.ts`
- Modify : `src/sim/entities.ts`, `src/sim/player-system.ts`, `src/sim/enemy-system.ts`, `src/sim/game.ts`, `src/sim/view.ts`, `src/replay/recorder.ts`, `src/replay/player.ts`, `src/render/world-renderer.ts`

**Interfaces :**
- Consumes : `createWorldView`, `writeGameView`, `ReplayRecorder`, `ReplayPlayer` (tâche 1).
- Produces :
  - `EnemyView.stateProgress` (0 à 1 dans l'état en cours : visée, recul, élan, vacillement ; 0 en approche) : **remplace** `aimProgress` ;
  - `EnemyView.armed: boolean`, `EnemyView.walkDistance: number` (m, depuis l'apparition) ;
  - `WeaponView.holderId` (0 = joueur, 1..n = ennemi, −1 = personne) ;
  - `Player.eyeHeight` lissé (`PLAYER.eyeRate` = 14 par seconde réelle) : `playerEye` l'utilise ;
  - `Enemy.walkDistance`.

- [ ] **Step 1 : écrire les tests**

`tests/world-view.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { ENEMY, PLAYER, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

function viewOf(game: Game) {
  const view = createWorldView(game.room.boxes.length, game.shatter.shards);
  writeGameView(game, view);
  return view;
}

describe("vue du monde complète (plan 2, avant l'animation)", () => {
  test("un ennemi qui marche accumule la distance parcourue", () => {
    const game = new Game(testRoom([enemyAt(0, -14, false, true)]));
    const start = game.enemies[0]!.pos.z;
    run(game, () => input({ moveX: 1 }), () => false, 1);
    const view = viewOf(game);
    const walked = Math.abs(game.enemies[0]!.pos.z - start);
    expect(walked).toBeGreaterThan(0.5);
    expect(view.enemies[0]!.walkDistance).toBeGreaterThanOrEqual(walked - 1e-6);
  });

  test("la vue dit si l'ennemi est armé et où il en est de sa visée", () => {
    const game = new Game(testRoom([enemyAt(0, -5, true), enemyAt(6, -5, false)]));
    run(game, () => input({ moveX: 0.3 }), (g) => g.enemies[0]!.state === "aim" && g.enemies[0]!.stateTime > 0.1, 5);
    const view = viewOf(game);
    const shooter = view.enemies[0]!;
    expect(shooter.armed).toBe(true);
    expect(shooter.state).toBe("aim");
    expect(shooter.stateProgress).toBeCloseTo(game.enemies[0]!.stateTime / ENEMY.aimTime, 5);
    expect(view.enemies[1]!.armed).toBe(false);
  });

  test("la progression d'un vacillement va de 0 à 1 sur 1,5 s de simulation", () => {
    const game = new Game(testRoom([enemyAt(0, -3, true)]));
    game.staggerEnemy(game.enemies[0]!, game.player.pos);
    run(game, () => input({ moveX: 1 }), (g) => g.simTime >= ENEMY.staggerTime / 2, 5);
    const progress = viewOf(game).enemies[0]!.stateProgress;
    expect(progress).toBeGreaterThan(0.45);
    expect(progress).toBeLessThan(0.6);
  });

  test("une arme tenue porte l'identifiant de son porteur", () => {
    const game = new Game(testRoom([enemyAt(0, -5, true)]));
    const view = viewOf(game);
    const enemyWeapon = game.enemies[0]!.weaponId;
    expect(view.weapons[enemyWeapon]!.holderId).toBe(game.enemies[0]!.id);
    expect(view.weapons[game.player.weaponId]!.holderId).toBe(PLAYER_ID);
  });

  test("la caméra descend en douceur à l'accroupissement, et remonte de même", () => {
    // Un ennemi immobile et désarmé, au loin : la partie reste en cours.
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    game.step(FRAME, input({ crouch: true }));
    expect(viewOf(game).camera.pos.y).toBeGreaterThan(1.4);
    run(game, () => input({ crouch: true }), () => false, 0.3);
    expect(viewOf(game).camera.pos.y).toBeLessThan(PLAYER.eyeCrouch + 0.05);
    game.step(FRAME, input());
    expect(viewOf(game).camera.pos.y).toBeLessThan(1.1);
    run(game, () => input(), () => false, 0.3);
    expect(viewOf(game).camera.pos.y).toBeGreaterThan(PLAYER.eyeStand - 0.05);
  });
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/world-view.test.ts`
Expected : FAIL (champs absents de la vue, caméra qui saute d'un coup).

- [ ] **Step 2 : écrire le code**

```diff
diff --git a/src/render/world-renderer.ts b/src/render/world-renderer.ts
index ddcba8a..15b9414 100644
--- a/src/render/world-renderer.ts
+++ b/src/render/world-renderer.ts
@@ -174,7 +174,7 @@ export class WorldRenderer {
         attr.setXYZ(0, e.pos.x, e.pos.y + MUZZLE_HEIGHT, e.pos.z);
         attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
         attr.needsUpdate = true;
-        (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.aimProgress;
+        (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.stateProgress;
       }
     }
 
diff --git a/src/replay/player.ts b/src/replay/player.ts
index 4a0b441..e03d5a2 100644
--- a/src/replay/player.ts
+++ b/src/replay/player.ts
@@ -112,7 +112,11 @@ export class ReplayPlayer {
       set(e.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
       e.yaw = mixAngle(s[ka + 5]!, s[kb + 5]!, t);
       set(e.aimPoint, s[ka + 6]!, s[ka + 7]!, s[ka + 8]!);
-      e.aimProgress = s[ka + 9]!;
+      // Même état aux deux échantillons : on interpole la progression, sinon on garde la première.
+      const sameState = s[ka + 1] === s[kb + 1];
+      e.stateProgress = sameState ? mix(s[ka + 9]!, s[kb + 9]!, t) : s[ka + 9]!;
+      e.armed = s[ka + 10] === 1;
+      e.walkDistance = sameState ? mix(s[ka + 11]!, s[kb + 11]!, t) : s[ka + 11]!;
     }
     for (let i = 0; i < POOLS.bullets; i++) {
       const ka = a + LAYOUT.bullets + i * LAYOUT.bulletStride;
@@ -133,6 +137,7 @@ export class ReplayPlayer {
       w.heldByPlayer = s[ka + 1] === 1;
       set(w.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
       w.angle = mix(s[ka + 5]!, s[kb + 5]!, t);
+      w.holderId = s[ka + 6]!;
     }
     v.playerAmmo = s[a + LAYOUT.misc]!;
     v.playerCooldown = s[a + LAYOUT.misc + 1]!;
diff --git a/src/replay/recorder.ts b/src/replay/recorder.ts
index 683d82b..98c2c39 100644
--- a/src/replay/recorder.ts
+++ b/src/replay/recorder.ts
@@ -14,11 +14,11 @@ export const REPLAY = {
 // changer une largeur ne demande pas de recompter les offsets à la main.
 const CAMERA = 1; // x, y, z, yaw, pitch
 const ENEMIES = CAMERA + 5;
-const ENEMY_STRIDE = 10; // visible, state, x, y, z, yaw, aimX, aimY, aimZ, aimProgress
+const ENEMY_STRIDE = 12; // visible, state, x, y, z, yaw, aimX, aimY, aimZ, stateProgress, armed, walkDistance
 const BULLETS = ENEMIES + POOLS.enemies * ENEMY_STRIDE;
 const BULLET_STRIDE = 10; // active, x, y, z, vx, vy, vz, originX, originY, originZ
 const WEAPONS = BULLETS + POOLS.bullets * BULLET_STRIDE;
-const WEAPON_STRIDE = 6; // visible, held, x, y, z, angle
+const WEAPON_STRIDE = 7; // visible, held, x, y, z, angle, holderId
 const MISC = WEAPONS + POOLS.weapons * WEAPON_STRIDE; // ammo, cooldown, timeScale
 
 export const LAYOUT = {
@@ -121,7 +121,9 @@ function writeSample(s: Float32Array, o: number, simTime: number, view: WorldVie
     s[k + 6] = e.aimPoint.x;
     s[k + 7] = e.aimPoint.y;
     s[k + 8] = e.aimPoint.z;
-    s[k + 9] = e.aimProgress;
+    s[k + 9] = e.stateProgress;
+    s[k + 10] = e.armed ? 1 : 0;
+    s[k + 11] = e.walkDistance;
   }
   for (let i = 0; i < POOLS.bullets; i++) {
     const b = view.bullets[i]!;
@@ -146,6 +148,7 @@ function writeSample(s: Float32Array, o: number, simTime: number, view: WorldVie
     s[k + 3] = w.pos.y;
     s[k + 4] = w.pos.z;
     s[k + 5] = w.angle;
+    s[k + 6] = w.holderId;
   }
   s[o + LAYOUT.misc] = view.playerAmmo;
   s[o + LAYOUT.misc + 1] = view.playerCooldown;
diff --git a/src/sim/enemy-system.ts b/src/sim/enemy-system.ts
index 29f8610..66df1bd 100644
--- a/src/sim/enemy-system.ts
+++ b/src/sim/enemy-system.ts
@@ -92,6 +92,7 @@ function moveTowards(e: Enemy, p: Vec3, dt: number): void {
   const stepLen = Math.min(len, ENEMY.speed * dt);
   e.pos.x += (dx / len) * stepLen;
   e.pos.z += (dz / len) * stepLen;
+  e.walkDistance += stepLen;
 }
 
 function followPath(game: Game, e: Enemy, dt: number): void {
diff --git a/src/sim/entities.ts b/src/sim/entities.ts
index b3d2c6f..efd0e5c 100644
--- a/src/sim/entities.ts
+++ b/src/sim/entities.ts
@@ -13,6 +13,8 @@ export const PLAYER = {
   crouchHeight: 0.95,
   eyeStand: 1.7,
   eyeCrouch: 0.85,
+  // Vitesse (par seconde réelle) à laquelle les yeux rejoignent leur hauteur : pas de saut de caméra.
+  eyeRate: 14,
   // Hauteur du torse, pour la capture d'arme au vol.
   chest: 1.2,
   // Hauteur du torse accroupi : la capsule s'arrête à 0,95 m, les tireurs visent dessous.
@@ -79,6 +81,8 @@ export interface Player {
   pitch: number;
   onGround: boolean;
   crouching: boolean;
+  // Hauteur des yeux, lissée entre debout et accroupi.
+  eyeHeight: number;
   alive: boolean;
   weaponId: number;
   fireCooldown: number;
@@ -94,6 +98,8 @@ export interface Enemy {
   mobile: boolean;
   weaponId: number;
   stateTime: number;
+  // Distance marchée depuis l'apparition (m) : cadence du cycle de marche au rendu.
+  walkDistance: number;
   aimPoint: Vec3;
   path: Int32Array;
   pathLength: number;
@@ -134,6 +140,7 @@ export function createPlayer(): Player {
     pitch: 0,
     onGround: true,
     crouching: false,
+    eyeHeight: PLAYER.eyeStand,
     alive: true,
     weaponId: NO_ID,
     fireCooldown: 0,
@@ -149,6 +156,7 @@ export function createEnemy(id: number, navSize: number): Enemy {
     mobile: true,
     weaponId: NO_ID,
     stateTime: 0,
+    walkDistance: 0,
     aimPoint: vec3(),
     path: new Int32Array(Math.max(1, navSize)),
     pathLength: 0,
diff --git a/src/sim/game.ts b/src/sim/game.ts
index 63ef52d..544d125 100644
--- a/src/sim/game.ts
+++ b/src/sim/game.ts
@@ -101,6 +101,7 @@ export class Game {
     p.pitch = 0;
     p.onGround = true;
     p.crouching = false;
+    p.eyeHeight = PLAYER.eyeStand;
     p.alive = true;
     p.weaponId = NO_ID;
     p.fireCooldown = 0;
@@ -264,6 +265,7 @@ export class Game {
     e.mobile = spawn.mobile;
     e.state = "approach";
     e.stateTime = 0;
+    e.walkDistance = 0;
     e.weaponId = NO_ID;
     e.pathLength = 0;
     e.pathIndex = 0;
diff --git a/src/sim/player-system.ts b/src/sim/player-system.ts
index 6309e13..bf582b2 100644
--- a/src/sim/player-system.ts
+++ b/src/sim/player-system.ts
@@ -15,7 +15,7 @@ const punchTarget = vec3();
 const timeInput: TimeInput = { moveAlpha: 0, lookPixels: 0, action: false, jumpRising: false };
 
 export function eyeHeight(game: Game): number {
-  return game.player.crouching ? PLAYER.eyeCrouch : PLAYER.eyeStand;
+  return game.player.eyeHeight;
 }
 
 export function playerEye(game: Game, out = eye): typeof eye {
@@ -31,6 +31,9 @@ export function updatePlayer(game: Game, dtReal: number, input: PlayerInput): nu
   p.pitch = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, p.pitch - input.lookDY));
 
   p.crouching = input.crouch;
+  // Les yeux glissent vers leur hauteur cible, en temps réel comme tout le joueur.
+  const eyeTarget = p.crouching ? PLAYER.eyeCrouch : PLAYER.eyeStand;
+  p.eyeHeight += (eyeTarget - p.eyeHeight) * (1 - Math.exp(-PLAYER.eyeRate * dtReal));
   if (input.jump && p.onGround) {
     p.vel.y = PLAYER.jumpSpeed;
     p.onGround = false;
diff --git a/src/sim/view.ts b/src/sim/view.ts
index bc8403e..b217165 100644
--- a/src/sim/view.ts
+++ b/src/sim/view.ts
@@ -22,8 +22,11 @@ export interface EnemyView {
   pos: Vec3;
   yaw: number;
   aimPoint: Vec3;
-  // Progression de la visée, de 0 à 1 (pour le trait de visée).
-  aimProgress: number;
+  // Progression de l'état en cours, de 0 à 1 (visée, élan, recul du tir, vacillement). 0 en approche.
+  stateProgress: number;
+  armed: boolean;
+  // Distance marchée (m) : phase du cycle de marche.
+  walkDistance: number;
 }
 
 export interface BulletView {
@@ -37,6 +40,8 @@ export interface BulletView {
 export interface WeaponView {
   visible: boolean;
   heldByPlayer: boolean;
+  // Porteur : 0 = joueur, 1..n = ennemi, -1 = personne.
+  holderId: number;
   pos: Vec3;
   angle: number;
 }
@@ -67,10 +72,19 @@ export function createWorldView(boxCount: number, shards: Shard[]): WorldView {
     timeScale: 1,
   };
   for (let i = 0; i < POOLS.enemies; i++) {
-    view.enemies.push({ visible: false, state: "inactive", pos: vec3(), yaw: 0, aimPoint: vec3(), aimProgress: 0 });
+    view.enemies.push({
+      visible: false,
+      state: "inactive",
+      pos: vec3(),
+      yaw: 0,
+      aimPoint: vec3(),
+      stateProgress: 0,
+      armed: false,
+      walkDistance: 0,
+    });
   }
   for (let i = 0; i < POOLS.bullets; i++) view.bullets.push({ active: false, pos: vec3(), vel: vec3(), origin: vec3() });
-  for (let i = 0; i < POOLS.weapons; i++) view.weapons.push({ visible: false, heldByPlayer: false, pos: vec3(), angle: 0 });
+  for (let i = 0; i < POOLS.weapons; i++) view.weapons.push({ visible: false, heldByPlayer: false, holderId: NO_ID, pos: vec3(), angle: 0 });
   return view;
 }
 
@@ -89,7 +103,10 @@ export function writeGameView(game: Game, view: WorldView): void {
     copy(v.pos, e.pos);
     v.yaw = e.yaw;
     copy(v.aimPoint, e.aimPoint);
-    v.aimProgress = e.state === "aim" ? Math.min(1, e.stateTime / ENEMY.aimTime) : 0;
+    const duration = stateDuration(e.state);
+    v.stateProgress = duration > 0 ? Math.min(1, e.stateTime / duration) : 0;
+    v.armed = e.weaponId !== NO_ID;
+    v.walkDistance = e.walkDistance;
   }
   for (let i = 0; i < game.bullets.length; i++) {
     const b = game.bullets[i]!;
@@ -104,6 +121,7 @@ export function writeGameView(game: Game, view: WorldView): void {
     const v = view.weapons[i]!;
     v.visible = w.state !== "free";
     v.heldByPlayer = w.state === "held" && w.holderId === PLAYER_ID;
+    v.holderId = w.state === "held" ? w.holderId : NO_ID;
     copy(v.pos, w.pos);
     v.angle = w.angle;
   }
@@ -112,3 +130,19 @@ export function writeGameView(game: Game, view: WorldView): void {
   view.playerCooldown = p.fireCooldown;
   for (let i = 0; i < game.boxEnabled.length; i++) view.boxEnabled[i] = game.boxEnabled[i]!;
 }
+
+// Durée de l'état, en temps de simulation (0 : état sans fin programmée).
+function stateDuration(state: EnemyState): number {
+  switch (state) {
+    case "aim":
+      return ENEMY.aimTime;
+    case "cooldown":
+      return ENEMY.cooldown;
+    case "stagger":
+      return ENEMY.staggerTime;
+    case "windup":
+      return ENEMY.meleeWindup;
+    default:
+      return 0;
+  }
+}
```

- [ ] **Step 3 : tests et types**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t2-tests.log && RTK_DISABLED=1 bun run typecheck`
Expected : `70 pass`, `0 fail` ; `tsc` sans sortie. Le test aller-retour de la tâche 1 couvre les nouveaux champs sans modification.

- [ ] **Step 4 : commit**

```bash
cd <racine> && git add tests/world-view.test.ts src/sim/entities.ts src/sim/player-system.ts src/sim/enemy-system.ts src/sim/game.ts src/sim/view.ts src/replay/recorder.ts src/replay/player.ts src/render/world-renderer.ts && git commit -m "feat(sim): complete the world view for animation (state progress, walk, holder, smoothed eye height)"
```

---

### Task 3 : le frôlement, et les événements sonores du replay (entrées 5 et 6)

Frôlement (spec 7.3) : une balle ennemie passe à moins de 0,6 m de la tête sans toucher. L'événement part au moment où la balle **dépasse** son point le plus proche de la tête : une balle qui touche s'arrête avant, elle n'émet rien.

**Files :**
- Create : `tests/events.test.ts`
- Modify : `tests/replay.test.ts`, `src/sim/events.ts`, `src/sim/entities.ts`, `src/sim/game.ts`, `src/sim/projectile-system.ts`, `src/replay/recorder.ts`, `src/replay/player.ts`

**Interfaces :**
- Produces :
  - type d'événement `"nearMiss"` (`pos` = point de passage, `vel` = vitesse de la balle, `ownerId` = tireur) ; `BULLET.nearMissRadius` = 0,6 ; `Bullet.nearMissed` ;
  - `RECORDED_EVENTS` : `enemyKilled`, `playerKilled`, `rackBurst`, `shot`, `bulletImpact`, `nearMiss` ; `REPLAY.eventCapacity` = 1024 ;
  - `ReplayPlayer.events: EventQueue` : les événements franchis par le dernier `update`, vidée par `update` et `restart`. L'audio la lit comme `game.events`.

- [ ] **Step 1 : écrire les tests**

`tests/events.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { EventQueue, type GameEventType } from "../src/sim/events";
import { Game } from "../src/sim/game";
import { vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

// Une balle ennemie tirée vers le joueur immobile, décalée de `offsetX` sur le côté de sa tête.
function enemyBulletPast(offsetX: number) {
  const game = new Game(testRoom([enemyAt(10, -12, false)]));
  game.spawnBullet(vec3(offsetX, 1.7, -6), vec3(0, 0, 1), game.enemies[0]!.id);
  const log = run(game, () => input(), (g) => !g.bullets.some((b) => b.active), 20);
  return { game, nearMisses: log.filter((e) => e.type === "nearMiss").length };
}

describe("frôlement (spec 7.3)", () => {
  test("une balle ennemie qui passe à 0,4 m de la tête sans toucher émet un seul frôlement", () => {
    const { game, nearMisses } = enemyBulletPast(0.4);
    expect(game.player.alive).toBe(true);
    expect(nearMisses).toBe(1);
  });

  test("une balle qui passe à 1 m de la tête n'émet rien", () => {
    expect(enemyBulletPast(1).nearMisses).toBe(0);
  });

  test("une balle qui touche le joueur n'est pas un frôlement", () => {
    const { game, nearMisses } = enemyBulletPast(0);
    expect(game.player.alive).toBe(false);
    expect(nearMisses).toBe(0);
  });

  test("les balles du joueur ne frôlent jamais le joueur", () => {
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const log = run(game, (f) => input({ fire: f === 0 }), () => false, 2);
    expect(log.some((e) => e.type === "shot")).toBe(true);
    expect(log.some((e) => e.type === "nearMiss")).toBe(false);
  });
});

describe("événements rejoués pour le son du replay", () => {
  test("le replay réémet le tir puis l'éclatement, dans l'ordre", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    const recorder = new ReplayRecorder();
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    for (let frame = 0; frame < 60 * 60 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ fire: frame === 30, moveX: frame > 30 ? 0.5 : 0 }));
      writeGameView(game, view);
      recorder.recordEvents(game.events);
      recorder.capture(game.simTime, view, game.status !== "playing");
    }
    expect(game.status).toBe("won");
    const replay = new ReplayPlayer(recorder, game.room);
    const seen: GameEventType[] = [];
    while (!replay.finished) {
      replay.update(FRAME);
      for (let i = 0; i < replay.events.count; i++) seen.push(replay.events.items[i]!.type);
    }
    expect(seen.indexOf("shot")).toBeGreaterThanOrEqual(0);
    expect(seen.indexOf("enemyKilled")).toBeGreaterThan(seen.indexOf("shot"));
    // Un redémarrage du replay vide la file : rien n'est rejoué deux fois.
    replay.restart();
    expect(replay.events.count).toBe(0);
  });

  test("90 s de combat dense (350 tirs ennemis et leurs impacts) tiennent dans le tampon d'événements", () => {
    const recorder = new ReplayRecorder();
    const queue = new EventQueue(2);
    for (let i = 0; i < 350; i++) {
      queue.clear();
      queue.push("shot", i * 0.25, 1, -1, vec3(), vec3());
      queue.push("bulletImpact", i * 0.25 + 0.1, 1, 0, vec3(), vec3());
      recorder.recordEvents(queue);
    }
    expect(recorder.eventCount).toBe(700);
    // Le tout premier tir est toujours là.
    expect(recorder.events[0]).toBe(0);
  });
});
```

Le test existant sur la capacité d'événements devient relatif à `REPLAY.eventCapacity` (il codait 64 en dur) :

```diff
diff --git a/tests/replay.test.ts b/tests/replay.test.ts
index a164ea4..1b2ef63 100644
--- a/tests/replay.test.ts
+++ b/tests/replay.test.ts
@@ -85,17 +85,18 @@ describe("replay (AC-7)", () => {
     expect(replay.view.boxEnabled[0]).toBe(false);
   });
 
-  test("au-delà de 64 événements, le replay garde les plus récents", () => {
+  test("au-delà de la capacité d'événements, le replay garde les plus récents", () => {
     const recorder = new ReplayRecorder();
     const queue = new EventQueue(4);
-    for (let t = 0; t < 70; t++) {
+    const total = REPLAY.eventCapacity + 6;
+    for (let t = 0; t < total; t++) {
       queue.clear();
       queue.push("enemyKilled", t, -1, 1, vec3(), vec3());
       recorder.recordEvents(queue);
     }
     expect(recorder.eventCount).toBe(REPLAY.eventCapacity);
     expect(recorder.events[0]).toBe(6);
-    expect(recorder.events[63 * EVENT_STRIDE]).toBe(69);
+    expect(recorder.events[(REPLAY.eventCapacity - 1) * EVENT_STRIDE]).toBe(total - 1);
   });
 
   test("l'enregistrement tient 60 échantillons par seconde de simulation", () => {
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/events.test.ts tests/replay.test.ts`
Expected : FAIL (frôlement jamais émis, `replay.events` absent, capacité 64).

- [ ] **Step 2 : écrire le code**

```diff
diff --git a/src/replay/player.ts b/src/replay/player.ts
index e03d5a2..3605109 100644
--- a/src/replay/player.ts
+++ b/src/replay/player.ts
@@ -1,7 +1,7 @@
 // Lecteur du replay : relit les échantillons à vitesse réelle (1 s de simulation = 1 s à l'écran).
 import type { RoomDefinition } from "../rooms/types";
-import { ENEMY, PLAYER, POOLS } from "../sim/entities";
-import { shatterSeed } from "../sim/events";
+import { ENEMY, NO_ID, PLAYER, POOLS } from "../sim/entities";
+import { EventQueue, shatterSeed } from "../sim/events";
 import { ShatterSystem } from "../sim/shatter";
 import { set, vec3 } from "../sim/vec3";
 import { ENEMY_STATE_CODES, type WorldView, createWorldView } from "../sim/view";
@@ -13,6 +13,8 @@ const eventVel = vec3();
 export class ReplayPlayer {
   readonly shatter = new ShatterSystem();
   readonly view: WorldView;
+  // Événements franchis par la dernière mise à jour, lus par l'audio comme ceux du jeu.
+  readonly events = new EventQueue(64);
   playhead = 0;
   private cursor = 0;
   private nextEvent = 0;
@@ -41,16 +43,20 @@ export class ReplayPlayer {
     this.cursor = 0;
     this.nextEvent = 0;
     this.startTime = this.recorder.count > 0 ? this.recorder.timeOf(0) : 0;
+    this.events.clear();
     this.shatter.reset();
     this.view.boxEnabled.fill(true);
     // Les événements d'avant le premier échantillon conservé ne restaurent que l'état du décor (tampon plein).
     this.applyEventsUntil(this.startTime, false);
+    // Ce qui précède la fenêtre ne se rejoue pas au son.
+    this.events.clear();
     this.writeView();
   }
 
   // Avance le replay de dtReal secondes réelles.
   update(dtReal: number): void {
     this.playhead = Math.min(this.duration, this.playhead + dtReal);
+    this.events.clear();
     this.applyEventsUntil(this.startTime + this.playhead, true);
     this.shatter.step(dtReal);
     this.writeView();
@@ -70,10 +76,11 @@ export class ReplayPlayer {
       set(eventVel, r.events[o + 6]!, r.events[o + 7]!, r.events[o + 8]!);
       // Une mort antérieure à la fenêtre gardée ne laisse rien à restaurer dans le décor.
       const spawn = live || t >= this.startTime;
+      this.events.push(type, t, NO_ID, targetId, eventPos, eventVel);
       if (type === "rackBurst") {
         this.view.boxEnabled[targetId] = false;
         if (spawn) this.shatter.spawnBox(this.room.boxes[targetId]!, shatterSeed(1000 + targetId, t));
-      } else if (spawn) {
+      } else if (spawn && (type === "enemyKilled" || type === "playerKilled")) {
         const player = type === "playerKilled";
         const height = player ? PLAYER.height : ENEMY.height;
         const radius = player ? PLAYER.radius : ENEMY.radius;
diff --git a/src/replay/recorder.ts b/src/replay/recorder.ts
index 98c2c39..8510ddc 100644
--- a/src/replay/recorder.ts
+++ b/src/replay/recorder.ts
@@ -7,7 +7,8 @@ export const REPLAY = {
   rateHz: 60,
   // 90 s de temps de simulation ; au-delà, on garde les 90 dernières secondes.
   capacity: 5400,
-  eventCapacity: 64,
+  // Environ 350 tirs ennemis en 90 s, plus leurs impacts et frôlements : 1024 laisse de la marge.
+  eventCapacity: 1024,
 } as const;
 
 // Disposition d'un échantillon dans le tableau plat. Chaque bloc se calcule à partir du précédent :
@@ -34,8 +35,15 @@ export const LAYOUT = {
   stride: MISC + 3,
 } as const;
 
-// Événements rejoués : ceux qui déclenchent des éclats ou changent le décor.
-export const RECORDED_EVENTS: readonly GameEventType[] = ["enemyKilled", "playerKilled", "rackBurst"];
+// Événements rejoués : éclats et décor (enemyKilled, playerKilled, rackBurst), plus les sons du replay.
+export const RECORDED_EVENTS: readonly GameEventType[] = [
+  "enemyKilled",
+  "playerKilled",
+  "rackBurst",
+  "shot",
+  "bulletImpact",
+  "nearMiss",
+];
 export const EVENT_STRIDE = 9; // time, typeIndex, targetId, x, y, z, vx, vy, vz
 
 export class ReplayRecorder {
diff --git a/src/sim/entities.ts b/src/sim/entities.ts
index efd0e5c..fbf2cdf 100644
--- a/src/sim/entities.ts
+++ b/src/sim/entities.ts
@@ -65,6 +65,8 @@ export const BULLET = {
   speed: 45,
   radius: 0.04,
   maxLife: 4,
+  // Frôlement : une balle ennemie passe à moins de cette distance de la tête sans toucher (spec 7.3).
+  nearMissRadius: 0.6,
 } as const;
 
 export const POOLS = {
@@ -130,6 +132,8 @@ export interface Bullet {
   // Point de départ : le rendu y arrête la traînée, pour qu'elle ne traverse pas le tireur.
   origin: Vec3;
   life: number;
+  // Vrai une fois le frôlement émis : un seul par balle.
+  nearMissed: boolean;
 }
 
 export function createPlayer(): Player {
@@ -181,7 +185,7 @@ export function createWeapon(id: number): Weapon {
 }
 
 export function createBullet(): Bullet {
-  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), origin: vec3(), life: 0 };
+  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), origin: vec3(), life: 0, nearMissed: false };
 }
 
 // Direction du regard : lacet 0 = -Z, tangage positif = vers le haut.
diff --git a/src/sim/events.ts b/src/sim/events.ts
index f30f4aa..66ef18f 100644
--- a/src/sim/events.ts
+++ b/src/sim/events.ts
@@ -6,6 +6,7 @@ export type GameEventType =
   | "dryFire"
   | "punch"
   | "bulletImpact"
+  | "nearMiss"
   | "enemyKilled"
   | "enemyStaggered"
   | "enemySpawned"
diff --git a/src/sim/game.ts b/src/sim/game.ts
index 544d125..61f5c5d 100644
--- a/src/sim/game.ts
+++ b/src/sim/game.ts
@@ -183,6 +183,7 @@ export class Game {
       b.active = true;
       b.ownerId = ownerId;
       b.life = 0;
+      b.nearMissed = false;
       // Départ exact à l'origine : le tireur est exclu de ses balles par ownerId, et rien n'échappe au balayage.
       copy(b.pos, origin);
       copy(b.origin, origin);
diff --git a/src/sim/projectile-system.ts b/src/sim/projectile-system.ts
index 4dae119..0d9b235 100644
--- a/src/sim/projectile-system.ts
+++ b/src/sim/projectile-system.ts
@@ -1,11 +1,14 @@
 // Balles (détection de collision continue) et armes en vol (spec sections 5.3 et 5.4).
-import { BULLET, ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, isAlive } from "./entities";
+import { BULLET, type Bullet, ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, isAlive } from "./entities";
 import type { Game } from "./game";
-import { sweepSphereAabb, sweepSphereCapsule } from "./geometry";
-import { addScaled, copy, lerp, set, vec3 } from "./vec3";
+import { closestSegmentSegment, sweepSphereAabb, sweepSphereCapsule } from "./geometry";
+import { playerEye } from "./player-system";
+import { type Vec3, addScaled, copy, lerp, set, vec3 } from "./vec3";
 
 const next = vec3();
 const hit = vec3();
+const head = vec3();
+const passPoint = vec3();
 
 const HIT_NONE = 0;
 const HIT_BOX = 1;
@@ -54,12 +57,12 @@ export function updateBullets(game: Game, dt: number): void {
         kind = HIT_PLAYER;
       }
     }
-    if (kind === HIT_NONE) {
-      copy(b.pos, next);
-      continue;
-    }
-    lerp(hit, b.pos, next, bestT);
-    copy(b.pos, hit);
+    // `next` devient la fin réelle du trajet de l'image : le point d'impact s'il y en a un.
+    if (kind !== HIT_NONE) lerp(next, b.pos, next, bestT);
+    if (kind !== HIT_PLAYER) checkNearMiss(game, b, next);
+    copy(hit, next);
+    copy(b.pos, next);
+    if (kind === HIT_NONE) continue;
     b.active = false;
     if (kind === HIT_BOX) {
       game.events.push("bulletImpact", game.simTime, b.ownerId, targetIndex, hit, b.vel);
@@ -71,6 +74,18 @@ export function updateBullets(game: Game, dt: number): void {
   }
 }
 
+// Frôlement : émis quand la balle dépasse le point où elle passe au plus près de la tête,
+// à moins de nearMissRadius. Une balle qui touche le joueur s'arrête avant ce point : pas de frôlement.
+function checkNearMiss(game: Game, b: Bullet, end: Vec3): void {
+  if (b.nearMissed || b.ownerId === PLAYER_ID || !game.player.alive) return;
+  playerEye(game, head);
+  const c = closestSegmentSegment(b.pos, end, head, head);
+  if (c.s >= 1 || c.distSq > BULLET.nearMissRadius * BULLET.nearMissRadius) return;
+  b.nearMissed = true;
+  lerp(passPoint, b.pos, end, c.s);
+  game.events.push("nearMiss", game.simTime, b.ownerId, PLAYER_ID, passPoint, b.vel);
+}
+
 export function updateWeapons(game: Game, dt: number): void {
   if (dt <= 0) return;
   const boxes = game.room.boxes;
```

- [ ] **Step 3 : tests et types**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t3-tests.log && RTK_DISABLED=1 bun run typecheck`
Expected : `76 pass`, `0 fail` ; `tsc` sans sortie.

- [ ] **Step 4 : commit**

```bash
cd <racine> && git add tests/events.test.ts tests/replay.test.ts src/sim/events.ts src/sim/entities.ts src/sim/game.ts src/sim/projectile-system.ts src/replay/recorder.ts src/replay/player.ts && git commit -m "feat(sim): emit near misses and record shots, impacts and near misses for the replay"
```

---

### Task 4 : corrections de simulation (entrée 7 et points de la revue finale)

- Les éclats se posent sur la passerelle et le haut des baies (le sol était codé en y = 0).
- L'arme d'un ennemi tué part dans le sens de l'impact, au lieu de monter à la verticale.
- `E` au moment du lancer ne reprend plus l'arme qui vient de partir (même délai que la capture en vol).
- Mêlée ennemie : deux tests qui isolent chaque garde (3 mutants survivaient).

**Files :**
- Create : `tests/sim-fixes.test.ts`
- Modify : `src/sim/shatter.ts`, `src/sim/game.ts`, `src/sim/entities.ts`, `src/sim/player-system.ts`, `src/replay/player.ts`

**Interfaces :**
- Produces : `ShatterSystem.step(dt, boxes = [], enabled = [])` (décor optionnel : sans décor, le sol reste en y = 0) ; `ENEMY.ejectOnDeath` = 1,5 m/s.

- [ ] **Step 1 : écrire les tests**

`tests/sim-fixes.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { NO_ID, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { set, vec3 } from "../src/sim/vec3";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

describe("éclats et décor (plan 2)", () => {
  test("les éclats d'un corps sur une passerelle se posent sur la passerelle, pas au travers", () => {
    const shatter = new ShatterSystem();
    const deck = aabb(-6, 3.4, -6, 6, 3.5, 6);
    shatter.spawnBody(vec3(0, 3.5, 0), 1.8, 0.3, vec3(), 42, 0);
    for (let i = 0; i < 60 * 6; i++) shatter.step(FRAME, [deck], [true]);
    const onDeck = shatter.shards.filter((s) => s.active && Math.abs(s.pos.x) < 6 && Math.abs(s.pos.z) < 6);
    expect(onDeck.length).toBeGreaterThan(SHATTER.shardsPerBody / 2);
    for (const s of onDeck) expect(s.pos.y).toBeGreaterThanOrEqual(3.5);
  });

  test("une passerelle désactivée (baie explosée) ne retient plus les éclats", () => {
    const shatter = new ShatterSystem();
    const deck = aabb(-6, 3.4, -6, 6, 3.5, 6);
    shatter.spawnBody(vec3(0, 3.5, 0), 1.8, 0.3, vec3(), 42, 0);
    for (let i = 0; i < 60 * 6; i++) shatter.step(FRAME, [deck], [false]);
    for (const s of shatter.shards) if (s.active) expect(s.pos.y).toBeLessThan(1);
  });
});

describe("arme d'un ennemi tué (plan 2)", () => {
  test("elle part dans le sens de la balle, pas à la verticale", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    const weapon = game.weapons[game.enemies[0]!.weaponId]!;
    game.killEnemy(game.enemies[0]!, vec3(0, 0, -45));
    expect(weapon.state).toBe("flying");
    expect(weapon.vel.z).toBeLessThan(-1);
  });
});

describe("mêlée ennemie : chaque garde compte (plan 2)", () => {
  test("un ennemi surélevé, ligne de vue dégagée, ne prend jamais d'élan et ne frappe pas", () => {
    // Socle de 1,2 m devant le joueur : l'ennemi est à portée horizontale, mais trop haut.
    const room = testRoom([{ ...enemyAt(0, -1, false, false), pos: vec3(0, 1.2, -1) }], false);
    room.boxes.push(aabb(-0.5, 0, -1.5, 0.5, 1.2, -0.5));
    const game = new Game(room);
    let windup = false;
    run(game, () => input(), (g) => {
      windup ||= g.enemies[0]!.state === "windup";
      return false;
    }, 60);
    expect(windup).toBe(false);
    expect(game.status).toBe("playing");
  });

  test("un joueur qui passe derrière une baie pendant l'élan n'est pas touché", () => {
    const room = testRoom([enemyAt(0, -1.1, false, false)], false);
    // Petite baie entre l'ennemi et la position de repli du joueur.
    room.boxes.push(aabb(0.35, 0, -0.75, 0.55, 2.2, -0.55));
    const game = new Game(room);
    run(game, () => input(), (g) => g.enemies[0]!.state === "windup", 30);
    expect(game.enemies[0]!.state).toBe("windup");
    // Repli : toujours à portée (1,27 m), mais la baie coupe la ligne de vue.
    set(game.player.pos, 0.9, 0, -0.2);
    run(game, () => input(), () => false, 60);
    expect(game.status).toBe("playing");
  });
});

describe("lancer et ramasser dans la même image (plan 2)", () => {
  test("E au moment du lancer ne reprend pas l'arme qui vient de partir", () => {
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const weaponId = game.player.weaponId;
    game.step(FRAME, input({ throw: true, use: true }));
    expect(game.player.weaponId).toBe(NO_ID);
    expect(game.weapons[weaponId]!.state).toBe("flying");
    expect(game.weapons[weaponId]!.thrownBy).toBe(PLAYER_ID);
  });
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/sim-fixes.test.ts`
Expected : `3 fail` (éclats à travers la passerelle, arme verticale, arme reprise par `E`). Les 3 autres passent déjà : les deux tests de mêlée sont des gardes contre les mutants, et la passerelle désactivée est un contrôle.

Contrôle des gardes de mêlée (`src/sim/enemy-system.ts`), un par un, puis annuler :
- `return sight && Math.abs(player.y - e.pos.y) < ENEMY.meleeReachY;` → `return sight;` : le test « ennemi surélevé » échoue ;
- dans `updateWindup`, `hasLineOfSight(game, e)` → `true` : le test « derrière une baie pendant l'élan » échoue ;
- dans `updateApproach`, retirer `&& canStrike(e, player, sight)` : le test « ennemi surélevé » échoue.

- [ ] **Step 2 : écrire le code**

```diff
diff --git a/src/replay/player.ts b/src/replay/player.ts
index 3605109..c64f295 100644
--- a/src/replay/player.ts
+++ b/src/replay/player.ts
@@ -58,7 +58,7 @@ export class ReplayPlayer {
     this.playhead = Math.min(this.duration, this.playhead + dtReal);
     this.events.clear();
     this.applyEventsUntil(this.startTime + this.playhead, true);
-    this.shatter.step(dtReal);
+    this.shatter.step(dtReal, this.room.boxes, this.view.boxEnabled);
     this.writeView();
   }
 
diff --git a/src/sim/entities.ts b/src/sim/entities.ts
index fbf2cdf..8bd634e 100644
--- a/src/sim/entities.ts
+++ b/src/sim/entities.ts
@@ -49,6 +49,8 @@ export const ENEMY = {
   // Arme éjectée : vitesse vers le haut, puis vers celui qui a frappé.
   ejectUp: 4.5,
   ejectToward: 2.5,
+  // Arme d'un ennemi tué : vitesse horizontale dans le sens de l'impact.
+  ejectOnDeath: 1.5,
 } as const;
 
 export const WEAPON = {
diff --git a/src/sim/game.ts b/src/sim/game.ts
index 61f5c5d..2b86970 100644
--- a/src/sim/game.ts
+++ b/src/sim/game.ts
@@ -63,6 +63,7 @@ export type GameStatus = "playing" | "dead" | "won";
 
 const tmpDir = vec3();
 const tmpBase = vec3();
+const tmpToward = vec3();
 
 export class Game {
   readonly time = new TimeController();
@@ -134,7 +135,7 @@ export class Game {
     updateEnemies(this, simDt);
     updateWeapons(this, simDt);
     updateBullets(this, simDt);
-    this.shatter.step(simDt);
+    this.shatter.step(simDt, this.room.boxes, this.boxEnabled);
     if (this.status === "playing" && this.allEnemiesDown()) this.status = "won";
     return simDt;
   }
@@ -196,7 +197,9 @@ export class Game {
   killEnemy(e: Enemy, impactVel: Vec3): void {
     if (!isAlive(e)) return;
     e.state = "dead";
-    this.dropEnemyWeapon(e, e.pos, 0.3);
+    // L'arme part dans le sens de l'impact, en arc lisible.
+    set(tmpToward, e.pos.x + impactVel.x, e.pos.y, e.pos.z + impactVel.z);
+    this.dropEnemyWeapon(e, tmpToward, ENEMY.ejectOnDeath);
     this.events.push("enemyKilled", this.simTime, NO_ID, e.id, e.pos, impactVel);
     this.shatter.spawnBody(e.pos, ENEMY.height, ENEMY.radius, impactVel, shatterSeed(e.id, this.simTime), 0);
   }
diff --git a/src/sim/player-system.ts b/src/sim/player-system.ts
index bf582b2..e3a76f4 100644
--- a/src/sim/player-system.ts
+++ b/src/sim/player-system.ts
@@ -164,6 +164,8 @@ function pickUpNearest(game: Game): void {
   let bestDist = 0;
   for (const w of game.weapons) {
     if (w.state !== "ground" && w.state !== "flying") continue;
+    // L'arme qu'on vient de lancer ne revient pas dans la main par E (même délai que la capture).
+    if (w.thrownBy === PLAYER_ID && w.flightTime < WEAPON.catchGrace) continue;
     const d = distance(w.pos, chest);
     if (d > PLAYER.pickupRange) continue;
     if (!best || w.ammo > best.ammo || (w.ammo === best.ammo && d < bestDist)) {
diff --git a/src/sim/shatter.ts b/src/sim/shatter.ts
index 529021e..e6fd07f 100644
--- a/src/sim/shatter.ts
+++ b/src/sim/shatter.ts
@@ -86,17 +86,21 @@ export class ShatterSystem {
     }
   }
 
-  step(dt: number): void {
+  // `boxes` et `enabled` : le décor sur lequel les éclats peuvent se poser (passerelle, haut des baies).
+  // Sans décor, le sol est en y = 0.
+  step(dt: number, boxes: readonly Aabb[] = NO_BOXES, enabled: readonly boolean[] = NO_FLAGS): void {
     if (dt <= 0) return;
     for (const s of this.shards) {
       if (!s.active || s.resting) continue;
+      const prevY = s.pos.y;
       s.vel.y -= SHATTER.gravity * dt;
       s.pos.x += s.vel.x * dt;
       s.pos.y += s.vel.y * dt;
       s.pos.z += s.vel.z * dt;
       s.angle += s.angVel * dt;
-      if (s.pos.y <= s.size * 0.5 && s.vel.y < 0) {
-        s.pos.y = s.size * 0.5;
+      const floor = groundBelow(s.pos.x, s.pos.z, prevY, boxes, enabled) + s.size * 0.5;
+      if (s.pos.y <= floor && s.vel.y < 0) {
+        s.pos.y = floor;
         if (!s.bounced) {
           s.bounced = true;
           s.vel.y = -s.vel.y * SHATTER.restitution;
@@ -147,3 +151,17 @@ export class ShatterSystem {
 }
 
 const tmpVel = vec3();
+const NO_BOXES: readonly Aabb[] = [];
+const NO_FLAGS: readonly boolean[] = [];
+
+// Hauteur du sol sous (x, z) : le dessus le plus haut d'une boîte active située sous `fromY`, ou 0.
+function groundBelow(x: number, z: number, fromY: number, boxes: readonly Aabb[], enabled: readonly boolean[]): number {
+  let ground = 0;
+  for (let i = 0; i < boxes.length; i++) {
+    const b = boxes[i]!;
+    if (!enabled[i] || b.max.y > fromY || b.max.y <= ground) continue;
+    if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue;
+    ground = b.max.y;
+  }
+  return ground;
+}
```

- [ ] **Step 3 : tests et types**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t4-tests.log && RTK_DISABLED=1 bun run typecheck`
Expected : `82 pass`, `0 fail` ; `tsc` sans sortie.

- [ ] **Step 4 : commit**

```bash
cd <racine> && git add tests/sim-fixes.test.ts src/sim/shatter.ts src/sim/game.ts src/sim/entities.ts src/sim/player-system.ts src/replay/player.ts && git commit -m "fix(sim): shards land on the walkway, dead enemy weapon follows the impact, no re-pick on throw, melee guard tests"
```

---

### Task 5 : le corps des ennemis, facetté et animé en code (spec 5.6, entrée 4)

8 segments rigides (tête, torse, 2 bras, 2 avant-bras, 2 jambes). La pose est un calcul pur, testé : marche (les pieds restent au sol, les jambes se croisent), levée du bras de tir pendant la visée, recul au tir, élan de mêlée, vacillement. Le dessin utilise un `InstancedMesh` par segment : 8 appels de dessin pour tous les ennemis.

Cette tâche ajoute aussi une **sonde debug** (`?debug` seulement) : `window.agenthot.advance(secondes, entrées)` fait avancer la partie sans pointer lock. Le verrouillage de la souris ne marche pas quand la fenêtre Chrome pilotée n'est pas au premier plan : sans la sonde, pas de captures.

**Files :**
- Create : `tests/enemy-pose.test.ts`, `src/render/enemy-pose.ts`, `src/render/enemy-bodies.ts`
- Modify : `src/render/world-renderer.ts`, `src/app/main.ts`

**Interfaces :**
- Consumes : `EnemyView.stateProgress`, `armed`, `walkDistance`, `aimPoint`, `yaw` (tâche 2) ; `WeaponView.holderId` (tâche 2).
- Produces :
  - `BODY`, `SEGMENT`, `SEGMENT_COUNT` = 8, `SEGMENT_LENGTH` ;
  - `interface EnemyPose { yaw; segments: SegmentPose[]; hand: Vec3; handPitch }`, `createEnemyPose()`, `poseEnemy(e: EnemyView, out: EnemyPose): EnemyPose` ;
  - `class EnemyBodies(material) { meshes: InstancedMesh[]; pose(i): EnemyPose; update(enemies) }` ;
  - le trait de visée part de la main ; l'arme tenue par un ennemi est dans sa main, dans l'axe de l'avant-bras ; les armes du monde sont un seul `InstancedMesh` ;
  - `window.agenthot = { renderer, game, advance(seconds, overrides) }` en `?debug`.

- [ ] **Step 1 : écrire les tests**

`tests/enemy-pose.test.ts` :

```ts
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
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/enemy-pose.test.ts`
Expected : FAIL, `Cannot find module '../src/render/enemy-pose'`.

- [ ] **Step 2 : écrire la pose**

`src/render/enemy-pose.ts` :

```ts
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
  const swing = Math.sin(phase);

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
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/enemy-pose.test.ts`
Expected : `6 pass`.

- [ ] **Step 3 : écrire le dessin et la sonde**

`src/render/enemy-bodies.ts` :

```ts
// Corps des ennemis : 8 segments facettés low-poly, un InstancedMesh par segment pour tous les ennemis.
// 8 appels de dessin quel que soit le nombre d'ennemis (spec 9.2).
import * as THREE from "three/webgpu";
import { POOLS } from "../sim/entities";
import type { EnemyView } from "../sim/view";
import { BODY, type EnemyPose, SEGMENT_COUNT, createEnemyPose, poseEnemy } from "./enemy-pose";

// Géométrie de chaque segment, centrée sur l'origine et alignée sur Y (ordre de SEGMENT).
// Peu de côtés et flatShading : chaque facette prend sa propre lumière.
function segmentGeometries(): THREE.BufferGeometry[] {
  return [
    new THREE.IcosahedronGeometry(BODY.headSize * 0.5, 0),
    new THREE.CylinderGeometry(0.2, 0.14, BODY.torsoLength, 6).scale(1, 1, 0.65),
    new THREE.CylinderGeometry(0.065, 0.05, BODY.upperArm, 5),
    new THREE.CylinderGeometry(0.065, 0.05, BODY.upperArm, 5),
    new THREE.CylinderGeometry(0.05, 0.04, BODY.forearm, 5),
    new THREE.CylinderGeometry(0.05, 0.04, BODY.forearm, 5),
    new THREE.CylinderGeometry(0.085, 0.055, BODY.legLength, 5),
    new THREE.CylinderGeometry(0.085, 0.055, BODY.legLength, 5),
  ];
}

export class EnemyBodies {
  readonly meshes: THREE.InstancedMesh[] = [];
  private readonly poses: EnemyPose[] = [];
  // Objets temporaires réutilisés : zéro allocation par image.
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly euler = new THREE.Euler(0, 0, 0, "YXZ");
  private readonly p = new THREE.Vector3();
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(material: THREE.Material) {
    const geometries = segmentGeometries();
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const mesh = new THREE.InstancedMesh(geometries[s]!, material, POOLS.enemies);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      for (let i = 0; i < POOLS.enemies; i++) mesh.setMatrixAt(i, this.hidden);
      this.meshes.push(mesh);
    }
    for (let i = 0; i < POOLS.enemies; i++) this.poses.push(createEnemyPose());
  }

  // Pose de l'ennemi i, calculée au dernier update (main droite, lacet, avant-bras).
  pose(i: number): EnemyPose {
    return this.poses[i]!;
  }

  update(enemies: readonly EnemyView[]): void {
    for (let i = 0; i < POOLS.enemies; i++) {
      const e = enemies[i]!;
      if (!e.visible) {
        for (let s = 0; s < SEGMENT_COUNT; s++) this.meshes[s]!.setMatrixAt(i, this.hidden);
        continue;
      }
      const pose = poseEnemy(e, this.poses[i]!);
      for (let s = 0; s < SEGMENT_COUNT; s++) {
        const seg = pose.segments[s]!;
        this.euler.set(seg.pitch, pose.yaw, seg.roll, "YXZ");
        this.q.setFromEuler(this.euler);
        this.p.set(seg.pos.x, seg.pos.y, seg.pos.z);
        this.m.compose(this.p, this.q, this.one);
        this.meshes[s]!.setMatrixAt(i, this.m);
      }
    }
    for (let s = 0; s < SEGMENT_COUNT; s++) this.meshes[s]!.instanceMatrix.needsUpdate = true;
  }
}
```

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index c17c2f2..4d1ea0b 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -5,7 +5,7 @@ import { ReplayRecorder } from "../replay/recorder";
 import { createRenderer } from "../render/create-renderer";
 import { WorldRenderer } from "../render/world-renderer";
 import { room01 } from "../rooms/room-01-datacenter";
-import { Game } from "../sim/game";
+import { Game, type PlayerInput, emptyInput } from "../sim/game";
 import { createWorldView, writeGameView } from "../sim/view";
 import { Hud } from "./hud";
 import { InputController } from "./input";
@@ -76,6 +76,24 @@ writeGameView(game, view);
 world.update(view);
 setMode("start");
 
+// Sonde de vérification, en debug seulement : fait avancer la partie sans pointer lock (captures, AC-8).
+if (debug) {
+  (window as unknown as { agenthot: unknown }).agenthot = {
+    renderer,
+    game,
+    advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
+      const frameInput = { ...emptyInput(), ...overrides };
+      for (let t = 0; t < seconds; t += 1 / 60) {
+        game.step(1 / 60, frameInput);
+        frameInput.fire = false;
+        frameInput.throw = false;
+      }
+      writeGameView(game, view);
+      world.update(view);
+    },
+  };
+}
+
 renderer.setAnimationLoop(() => {
   const now = performance.now();
   // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
diff --git a/src/render/world-renderer.ts b/src/render/world-renderer.ts
index 15b9414..9cfed65 100644
--- a/src/render/world-renderer.ts
+++ b/src/render/world-renderer.ts
@@ -1,22 +1,23 @@
 // Rendu « gris » : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
 import * as THREE from "three/webgpu";
 import type { RoomDefinition } from "../rooms/types";
-import { ENEMY, POOLS } from "../sim/entities";
+import { PLAYER_ID, POOLS } from "../sim/entities";
 import { SHATTER } from "../sim/shatter";
 import type { WorldView } from "../sim/view";
 import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
+import { EnemyBodies } from "./enemy-bodies";
 import { PALETTE } from "./palette";
 
-const MUZZLE_HEIGHT = ENEMY.muzzleHeight;
 
 export class WorldRenderer {
   readonly scene = new THREE.Scene();
   readonly camera: THREE.PerspectiveCamera;
   private readonly racks: THREE.InstancedMesh;
   private readonly rackMatrices: THREE.Matrix4[] = [];
-  private readonly enemies: THREE.Mesh[] = [];
+  private readonly bodies: EnemyBodies;
   private readonly aimLines: THREE.Line[] = [];
-  private readonly weapons: THREE.Mesh[] = [];
+  // Armes du monde (au sol, en vol, tenues par un ennemi) : un seul InstancedMesh.
+  private readonly weapons: THREE.InstancedMesh;
   private readonly viewModel: THREE.Mesh;
   private readonly bulletHeads: THREE.InstancedMesh;
   private readonly bulletTrails: THREE.InstancedMesh;
@@ -30,6 +31,8 @@ export class WorldRenderer {
   private readonly axis = new THREE.Vector3();
   private readonly up = new THREE.Vector3(0, 1, 0);
   private readonly dir = new THREE.Vector3();
+  private readonly euler = new THREE.Euler(0, 0, 0, "YXZ");
+  private readonly one = new THREE.Vector3(1, 1, 1);
   private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
   private readonly colors = {
     threat: new THREE.Color(PALETTE.threat),
@@ -85,13 +88,10 @@ export class WorldRenderer {
       emissiveIntensity: 0.25,
       roughness: 0.5,
     });
-    const enemyGeo = new THREE.CapsuleGeometry(ENEMY.radius, ENEMY.height - ENEMY.radius * 2, 4, 8);
+    this.bodies = new EnemyBodies(threatMat);
+    for (const mesh of this.bodies.meshes) this.scene.add(mesh);
     const aimMat = new THREE.LineBasicMaterial({ color: PALETTE.threatHot, transparent: true });
     for (let i = 0; i < POOLS.enemies; i++) {
-      const mesh = new THREE.Mesh(enemyGeo, threatMat);
-      mesh.visible = false;
-      this.enemies.push(mesh);
-      this.scene.add(mesh);
       const lineGeo = new THREE.BufferGeometry();
       lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
       const line = new THREE.Line(lineGeo, aimMat.clone());
@@ -102,13 +102,10 @@ export class WorldRenderer {
     }
 
     const inkMat = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.6 });
-    const weaponGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
-    for (let i = 0; i < POOLS.weapons; i++) {
-      const mesh = new THREE.Mesh(weaponGeo, inkMat);
-      mesh.visible = false;
-      this.weapons.push(mesh);
-      this.scene.add(mesh);
-    }
+    this.weapons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), inkMat, POOLS.weapons);
+    this.weapons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
+    this.weapons.frustumCulled = false;
+    this.scene.add(this.weapons);
     // Arme en main : plus petite et plus loin que les armes du monde, pour ne pas boucher la vue.
     this.viewModel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.24), inkMat);
     this.viewModel.position.set(0.2, -0.2, -0.55);
@@ -158,34 +155,42 @@ export class WorldRenderer {
     }
     this.racks.instanceMatrix.needsUpdate = true;
 
+    this.bodies.update(view.enemies);
     for (let i = 0; i < POOLS.enemies; i++) {
       const e = view.enemies[i]!;
-      const mesh = this.enemies[i]!;
       const line = this.aimLines[i]!;
-      mesh.visible = e.visible;
       line.visible = e.visible && e.state === "aim";
-      if (!e.visible) continue;
-      mesh.position.set(e.pos.x, e.pos.y + ENEMY.height / 2, e.pos.z);
-      mesh.rotation.y = e.yaw;
-      // Vacillement : l'ennemi penche en arrière.
-      mesh.rotation.x = e.state === "stagger" ? 0.35 : 0;
-      if (line.visible) {
-        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
-        attr.setXYZ(0, e.pos.x, e.pos.y + MUZZLE_HEIGHT, e.pos.z);
-        attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
-        attr.needsUpdate = true;
-        (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.stateProgress;
-      }
+      if (!line.visible) continue;
+      // Le trait de visée part de la main qui tient l'arme.
+      const hand = this.bodies.pose(i).hand;
+      const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
+      attr.setXYZ(0, hand.x, hand.y, hand.z);
+      attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
+      attr.needsUpdate = true;
+      (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.stateProgress;
     }
 
     for (let i = 0; i < POOLS.weapons; i++) {
       const w = view.weapons[i]!;
-      const mesh = this.weapons[i]!;
-      mesh.visible = w.visible && !w.heldByPlayer;
-      if (!mesh.visible) continue;
-      mesh.position.set(w.pos.x, w.pos.y, w.pos.z);
-      mesh.rotation.set(w.angle, 0, w.angle * 0.5);
+      if (!w.visible || w.heldByPlayer) {
+        this.weapons.setMatrixAt(i, this.hidden);
+        continue;
+      }
+      const holder = w.holderId > PLAYER_ID ? w.holderId - 1 : -1;
+      if (holder >= 0 && view.enemies[holder]!.visible) {
+        // Tenue par un ennemi : dans sa main, dans l'axe de l'avant-bras.
+        const pose = this.bodies.pose(holder);
+        this.p.set(pose.hand.x, pose.hand.y, pose.hand.z);
+        this.euler.set(pose.handPitch - Math.PI / 2, pose.yaw, 0, "YXZ");
+      } else {
+        this.p.set(w.pos.x, w.pos.y, w.pos.z);
+        this.euler.set(w.angle, 0, w.angle * 0.5, "YXZ");
+      }
+      this.q.setFromEuler(this.euler);
+      this.m.compose(this.p, this.q, this.one);
+      this.weapons.setMatrixAt(i, this.m);
     }
+    this.weapons.instanceMatrix.needsUpdate = true;
 
     for (let i = 0; i < POOLS.bullets; i++) {
       const b = view.bullets[i]!;
```

- [ ] **Step 4 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t5-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `88 pass`, `0 fail` ; `tsc` sans sortie ; build réussi (l'avertissement « chunks larger than 500 kB » est attendu, le découpage est au plan 3).

- [ ] **Step 5 : vérifier dans Chrome**

Lancer `cd <racine> && bun run dev --port 5299 --strictPort` en arrière-plan. Ouvrir `http://localhost:5299/?debug`. Placer la caméra face à un tireur, en visée presque finie :

```js
const a = window.agenthot;
a.advance(2.2, { moveX: 0.4 });
const p = a.game.player; p.pos.x = 1.8; p.pos.z = -6.9;
const e = a.game.enemies[0];
p.yaw = Math.atan2(-(e.pos.x - p.pos.x), -(e.pos.z - p.pos.z)); p.pitch = -0.05;
a.advance(0.05, {});
a.game.enemies[0].stateTime = 0.36;
a.advance(0, {});
```

Capture. **Attendu :** deux ennemis visibles (allée du fond, passerelle), en segments facettés orange ; celui du fond vous fait face, bras droit tendu vers la caméra, arme noire dans la main ; trait de visée orange de la main vers le bas de l'écran ; aucun rectangle noir à l'origine. Console sans erreur.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add tests/enemy-pose.test.ts src/render/enemy-pose.ts src/render/enemy-bodies.ts src/render/world-renderer.ts src/app/main.ts && git commit -m "feat(render): procedural faceted enemy bodies (8 instanced segments) and a debug probe"
```

---

### Task 6 : la beauté (spec 6.2, AC-8 partiel, AC-9 affichage)

Pas de test unitaire : c'est du rendu. La vérification se fait dans Chrome, avec captures.

- **Contours :** détecteur de bords sur les normales et la profondeur, dans `RenderPipeline`. La profondeur utilise le laplacien de 1/z (nul sur un plan, donc pas de faux bords sur le sol en biais). Les normales moyennées par l'anticrénelage sont comparées en direction (normalisées) ; une normale presque nulle ne crée pas d'arête. Ces deux règles ont éliminé les points noirs parasites et les contours en pointillés vus au prototype.
- **Glow :** un seul rendu de scène à trois sorties (`output`, `normal`, `glow`) ; seuls les matériaux de menace écrivent 1 dans `glow` ; `bloom` ne lit que ce masque. La menace n'a pas de contour encre (voir « Écarts assumés »).
- **Ombres douces :** `PCFShadowMap`, soleil qui couvre toute la salle, `shadow.radius` = 3.
- **Encre :** armes et arme en main en noir mat, liseré clair par fresnel (`emissiveNode`).
- **Mort :** aberration chromatique (rouge et bleu glissent vers les bords), seulement sur l'écran de mort. La teinte orange reste le calque CSS du plan 1.
- **Budget d'appels de dessin :** boîtes fixes fusionnées (`mergeGeometries`), traits de visée en un seul `LineSegments` à couleurs par sommet, éclats en deux `InstancedMesh` (menace, neutres). Mesuré : 44 appels, constants.

**Files :**
- Create : `src/render/post.ts`, `src/render/materials.ts`
- Modify : `src/render/world-renderer.ts`, `src/render/create-renderer.ts`, `src/app/main.ts`

**Interfaces :**
- Consumes : `EnemyBodies` (tâche 5), `trailLength`, `headScale` (tâche 1).
- Produces :
  - `POST` (seuils et forces) ; `GLOW_MRT` (à poser en `mrtNode` sur tout matériau de menace) ;
  - `class PostPipeline(renderer, scene, camera) { setDeath(0 | 1); render() }` : `main.ts` appelle `post.render()` à la place de `renderer.render()` ;
  - `worldMaterial(tone)`, `threatMaterial()`, `inkMaterial()`, `threatBasicMaterial(tone)`, `aimLineMaterial()` ;
  - la sonde debug gagne `post`.

- [ ] **Step 1 : écrire le post-traitement et les matériaux**

`src/render/post.ts` :

```ts
// Post-traitement (spec 6.2) : contours fins à l'encre (profondeur + normales), glow limité aux
// matériaux de menace, aberration chromatique à la mort. Un seul rendu de la scène, trois sorties (MRT).
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import {
  Fn,
  abs,
  cameraFar,
  cameraNear,
  color as tslColor,
  dot,
  float,
  max,
  mix,
  mrt,
  normalView,
  normalize,
  output,
  pass,
  perspectiveDepthToViewZ,
  screenSize,
  screenUV,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";

export const POST = {
  // Contour de profondeur : écart relatif du laplacien de 1/z (nul sur une surface plane).
  outlineDepth: 0.1,
  // Contour de normales : cosinus en dessous duquel deux pixels voisins forment une arête.
  outlineNormal: 0.8,
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0,
  // Décalage des canaux rouge et bleu à la mort, en fraction de l'écran au bord.
  aberration: 0.012,
} as const;

// Masque de glow : seuls les matériaux de menace l'écrivent. La menace ne reçoit pas de contour encre :
// son halo la détoure, et un trait fin (visée, traînée) serait noirci par le détecteur.
export const GLOW_MRT = mrt({ glow: float(1) });

export class PostPipeline {
  private readonly pipeline: THREE.RenderPipeline;
  // 0 en jeu, 1 à la mort.
  private readonly death = uniform(0);

  constructor(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: normalView, glow: float(0) }));
    const colorTex = scenePass.getTextureNode("output");
    const normalTex = scenePass.getTextureNode("normal");
    const depthTex = scenePass.getTextureNode("depth");
    const glowTex = scenePass.getTextureNode("glow");
    const texel = vec2(1).div(screenSize);

    // 1/z est affine à l'écran sur un plan : son laplacien ne réagit qu'aux vraies ruptures.
    const invZ = (uv: THREE.Node) =>
      float(1).div(perspectiveDepthToViewZ(depthTex.sample(uv).x, cameraNear, cameraFar));
    const edge = Fn(() => {
      const center = invZ(screenUV);
      const normal = normalTex.sample(screenUV).xyz;
      // L'anticrénelage moyenne les normales en bord d'objet : on compare des directions (normalisées),
      // et une normale presque nulle (fond, pixel à peine couvert) ne crée pas d'arête.
      const validNormal = (n: typeof normal) => dot(n, n).greaterThan(0.09);
      // Un pixel de menace n'a pas de contour et n'en crée pas chez ses voisins. Seuil bas :
      // l'anticrénelage moyenne le masque d'un trait d'un pixel avec le fond.
      const ignored = (uv: THREE.Node) => glowTex.sample(uv).x.greaterThan(0.1);
      const laplacian = float(0).toVar();
      const normalEdge = float(0).toVar();
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const uv = screenUV.add(vec2(dx, dy).mul(texel));
        // Voisin ignoré : on le remplace par le centre (écart nul).
        const skip = ignored(uv);
        laplacian.addAssign(skip.select(0, invZ(uv).sub(center)));
        const neighbor = normalTex.sample(uv).xyz;
        const trusted = skip.not().and(validNormal(normal)).and(validNormal(neighbor));
        const cos = trusted.select(dot(normalize(normal), normalize(neighbor)), 1);
        normalEdge.assign(max(normalEdge, cos.lessThan(POST.outlineNormal).select(1, 0)));
      }
      const depthEdge = abs(laplacian).div(abs(center)).greaterThan(POST.outlineDepth).select(1, 0);
      return ignored(screenUV).select(0, max(depthEdge, normalEdge));
    })();

    // Aberration : rouge et bleu glissent vers les bords, seulement à la mort.
    const shift = screenUV.sub(0.5).mul(this.death.mul(POST.aberration));
    const color = vec3(
      colorTex.sample(screenUV.add(shift)).r,
      colorTex.sample(screenUV).g,
      colorTex.sample(screenUV.sub(shift)).b,
    );
    const inked = mix(color, tslColor(PALETTE.ink), edge);
    const glow = bloom(colorTex.mul(glowTex.x), POST.bloomStrength, POST.bloomRadius, POST.bloomThreshold);

    this.pipeline = new THREE.RenderPipeline(renderer, vec4(inked.add(glow.rgb), 1));
  }

  setDeath(amount: number): void {
    this.death.value = amount;
  }

  render(): void {
    this.pipeline.render();
  }
}
```

`src/render/materials.ts` :

```ts
// Matériaux du jeu (spec 6.2). L'orange ne va qu'à la menace, et elle seule porte le masque de glow.
import { color, dot, float, max, normalView, positionViewDirection } from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";
import { GLOW_MRT } from "./post";

// Décor : blanc cassé. Ce sont des boîtes, leurs normales sont déjà plates : pas de flatShading,
// dont les normales par dérivées laissent des points parasites dans le détecteur de contours.
export function worldMaterial(tone: number): THREE.MeshStandardNodeMaterial {
  return new THREE.MeshStandardNodeMaterial({ color: tone, roughness: 0.9 });
}

// Ennemis et éclats de menace : orange émissif léger ; les facettes de côté, moins éclairées, sont plus sombres.
export function threatMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({
    color: PALETTE.threat,
    emissive: PALETTE.threat,
    emissiveIntensity: 0.3,
    roughness: 0.45,
    flatShading: true,
  });
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Armes et mains : noir mat, avec un liseré clair (fresnel) pour se lire devant le vide sombre.
export function inkMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({ color: PALETTE.ink, roughness: 0.6, flatShading: true });
  const facing = max(dot(normalView, positionViewDirection), float(0));
  mat.emissiveNode = color(PALETTE.world).mul(float(1).sub(facing).pow(3)).mul(0.7);
  return mat;
}

// Balles, traînées et traits de visée : couleur pure, glow. Opaques : une transparence diluerait
// aussi le masque de glow.
export function threatBasicMaterial(tone: number): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial({ color: tone });
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Traits de visée : couleur par sommet (de threat à threat-hot avec la progression de la visée).
export function aimLineMaterial(): THREE.LineBasicNodeMaterial {
  const mat = new THREE.LineBasicNodeMaterial({ vertexColors: true });
  mat.mrtNode = GLOW_MRT;
  return mat;
}
```

- [ ] **Step 2 : brancher**

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 4d1ea0b..48236d3 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -3,6 +3,7 @@ import "./style.css";
 import { ReplayPlayer } from "../replay/player";
 import { ReplayRecorder } from "../replay/recorder";
 import { createRenderer } from "../render/create-renderer";
+import { PostPipeline } from "../render/post";
 import { WorldRenderer } from "../render/world-renderer";
 import { room01 } from "../rooms/room-01-datacenter";
 import { Game, type PlayerInput, emptyInput } from "../sim/game";
@@ -21,6 +22,7 @@ const debug = params.has("debug");
 const app = document.querySelector<HTMLElement>("#app")!;
 const { renderer, isWebGPU } = await createRenderer(app, params.get("renderer") === "webgl");
 const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
+const post = new PostPipeline(renderer, world.scene, world.camera);
 const game = new Game(room01);
 const view = createWorldView(room01.boxes.length, game.shatter.shards);
 const recorder = new ReplayRecorder();
@@ -51,6 +53,8 @@ function setMode(next: Mode): void {
   // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
   if (next === "dead" || next === "replay" || next === "won") input.clear();
   hud.show(next === "playing" ? "none" : next);
+  // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
+  post.setDeath(next === "dead" ? 1 : 0);
 }
 
 // Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
@@ -81,6 +85,7 @@ if (debug) {
   (window as unknown as { agenthot: unknown }).agenthot = {
     renderer,
     game,
+    post,
     advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
       const frameInput = { ...emptyInput(), ...overrides };
       for (let t = 0; t < seconds; t += 1 / 60) {
@@ -90,6 +95,7 @@ if (debug) {
       }
       writeGameView(game, view);
       world.update(view);
+      // Le rendu reste celui de la boucle : ses appels de dessin se lisent dans le panneau debug.
     },
   };
 }
@@ -147,7 +153,7 @@ renderer.setAnimationLoop(() => {
     if (replay.finished) setMode("won");
   }
 
-  renderer.render(world.scene, world.camera);
+  post.render();
 
   fpsFrames++;
   fpsTime += dt;
diff --git a/src/render/create-renderer.ts b/src/render/create-renderer.ts
index e869cd6..369455c 100644
--- a/src/render/create-renderer.ts
+++ b/src/render/create-renderer.ts
@@ -10,6 +10,9 @@ export async function createRenderer(container: HTMLElement, forceWebGL: boolean
   const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   renderer.setSize(window.innerWidth, window.innerHeight);
+  // Ombres douces : PCF filtré (PCFSoftShadowMap n'existe plus en r186, il retombe sur PCF).
+  renderer.shadowMap.enabled = true;
+  renderer.shadowMap.type = THREE.PCFShadowMap;
   container.appendChild(renderer.domElement);
   await renderer.init();
   // `isWebGPUBackend` n'est typé que sur WebGPUBackend : lecture par cast (brief r186).
diff --git a/src/render/world-renderer.ts b/src/render/world-renderer.ts
index 9cfed65..52627cb 100644
--- a/src/render/world-renderer.ts
+++ b/src/render/world-renderer.ts
@@ -1,4 +1,5 @@
-// Rendu « gris » : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
+// Rendu du monde : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
+import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
 import * as THREE from "three/webgpu";
 import type { RoomDefinition } from "../rooms/types";
 import { PLAYER_ID, POOLS } from "../sim/entities";
@@ -6,22 +7,25 @@ import { SHATTER } from "../sim/shatter";
 import type { WorldView } from "../sim/view";
 import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
 import { EnemyBodies } from "./enemy-bodies";
+import { aimLineMaterial, inkMaterial, threatBasicMaterial, threatMaterial, worldMaterial } from "./materials";
 import { PALETTE } from "./palette";
 
-
 export class WorldRenderer {
   readonly scene = new THREE.Scene();
   readonly camera: THREE.PerspectiveCamera;
   private readonly racks: THREE.InstancedMesh;
   private readonly rackMatrices: THREE.Matrix4[] = [];
   private readonly bodies: EnemyBodies;
-  private readonly aimLines: THREE.Line[] = [];
+  // Traits de visée de tous les ennemis : un seul LineSegments (2 sommets par ennemi).
+  private readonly aimLines: THREE.LineSegments;
   // Armes du monde (au sol, en vol, tenues par un ennemi) : un seul InstancedMesh.
   private readonly weapons: THREE.InstancedMesh;
   private readonly viewModel: THREE.Mesh;
   private readonly bulletHeads: THREE.InstancedMesh;
   private readonly bulletTrails: THREE.InstancedMesh;
-  private readonly shards: THREE.InstancedMesh;
+  // Éclats de menace (glow) et éclats neutres (décor, joueur) : deux InstancedMesh.
+  private readonly threatShards: THREE.InstancedMesh;
+  private readonly neutralShards: THREE.InstancedMesh;
   private readonly room: RoomDefinition;
   // Objets temporaires réutilisés : zéro allocation par image.
   private readonly m = new THREE.Matrix4();
@@ -34,8 +38,10 @@ export class WorldRenderer {
   private readonly euler = new THREE.Euler(0, 0, 0, "YXZ");
   private readonly one = new THREE.Vector3(1, 1, 1);
   private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
+  private readonly lineTint = new THREE.Color();
   private readonly colors = {
     threat: new THREE.Color(PALETTE.threat),
+    threatHot: new THREE.Color(PALETTE.threatHot),
     world: new THREE.Color(PALETTE.world2),
     ink: new THREE.Color(PALETTE.ink),
   };
@@ -48,28 +54,46 @@ export class WorldRenderer {
     this.scene.add(this.camera);
 
     this.scene.add(new THREE.HemisphereLight(0xffffff, PALETTE.void2, 1.4));
+    // Soleil qui porte des ombres douces sur toute la salle (24 × 16 m).
     const sun = new THREE.DirectionalLight(0xffffff, 1.6);
     sun.position.set(6, 12, 4);
+    sun.castShadow = true;
+    sun.shadow.mapSize.set(2048, 2048);
+    sun.shadow.camera.left = -16;
+    sun.shadow.camera.right = 16;
+    sun.shadow.camera.top = 16;
+    sun.shadow.camera.bottom = -16;
+    sun.shadow.camera.near = 1;
+    sun.shadow.camera.far = 40;
+    sun.shadow.radius = 3;
+    sun.shadow.bias = -0.0005;
+    sun.shadow.normalBias = 0.02;
     this.scene.add(sun);
 
-    const worldMat = new THREE.MeshStandardMaterial({ color: PALETTE.world, roughness: 0.9 });
+    const worldMat = worldMaterial(PALETTE.world);
     const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), worldMat);
     floor.rotation.x = -Math.PI / 2;
+    floor.receiveShadow = true;
     this.scene.add(floor);
 
-    // Boîtes fixes (murs, ascenseur, passerelle) : un mesh chacune, elles sont peu nombreuses.
+    // Boîtes fixes (murs, ascenseur, passerelle) : fusionnées en un seul mesh, un seul appel de dessin.
     const rackSet = new Set(room.rackBoxIndices);
+    const fixed: THREE.BufferGeometry[] = [];
     room.boxes.forEach((box, i) => {
       if (rackSet.has(i)) return;
       const size = new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min));
-      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), worldMat);
-      mesh.position.addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5);
-      this.scene.add(mesh);
+      const center = new THREE.Vector3().addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5);
+      fixed.push(new THREE.BoxGeometry(size.x, size.y, size.z).translate(center.x, center.y, center.z));
     });
+    const walls = new THREE.Mesh(mergeGeometries(fixed), worldMat);
+    walls.castShadow = true;
+    walls.receiveShadow = true;
+    this.scene.add(walls);
 
     // Baies : un seul InstancedMesh, une baie explosée est mise à l'échelle 0.
-    const rackMat = new THREE.MeshStandardMaterial({ color: PALETTE.world2, roughness: 0.8 });
-    this.racks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rackMat, room.rackBoxIndices.length);
+    this.racks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), worldMaterial(PALETTE.world2), room.rackBoxIndices.length);
+    this.racks.castShadow = true;
+    this.racks.receiveShadow = true;
     room.rackBoxIndices.forEach((boxIndex, i) => {
       const box = room.boxes[boxIndex]!;
       const matrix = new THREE.Matrix4().compose(
@@ -82,54 +106,54 @@ export class WorldRenderer {
     });
     this.scene.add(this.racks);
 
-    const threatMat = new THREE.MeshStandardMaterial({
-      color: PALETTE.threat,
-      emissive: PALETTE.threat,
-      emissiveIntensity: 0.25,
-      roughness: 0.5,
-    });
+    const threatMat = threatMaterial();
     this.bodies = new EnemyBodies(threatMat);
     for (const mesh of this.bodies.meshes) this.scene.add(mesh);
-    const aimMat = new THREE.LineBasicMaterial({ color: PALETTE.threatHot, transparent: true });
-    for (let i = 0; i < POOLS.enemies; i++) {
-      const lineGeo = new THREE.BufferGeometry();
-      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
-      const line = new THREE.Line(lineGeo, aimMat.clone());
-      line.visible = false;
-      line.frustumCulled = false;
-      this.aimLines.push(line);
-      this.scene.add(line);
-    }
+    const lineGeo = new THREE.BufferGeometry();
+    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(POOLS.enemies * 6), 3));
+    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(POOLS.enemies * 6), 3));
+    this.aimLines = new THREE.LineSegments(lineGeo, aimLineMaterial());
+    this.aimLines.frustumCulled = false;
+    this.scene.add(this.aimLines);
 
-    const inkMat = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.6 });
+    const inkMat = inkMaterial();
     this.weapons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), inkMat, POOLS.weapons);
     this.weapons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
     this.weapons.frustumCulled = false;
+    this.weapons.castShadow = true;
     this.scene.add(this.weapons);
     // Arme en main : plus petite et plus loin que les armes du monde, pour ne pas boucher la vue.
     this.viewModel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.24), inkMat);
     this.viewModel.position.set(0.2, -0.2, -0.55);
     this.camera.add(this.viewModel);
 
-    const bulletMat = new THREE.MeshBasicMaterial({ color: PALETTE.threatHot });
+    const bulletMat = threatBasicMaterial(PALETTE.threatHot);
     this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(BULLET_LOOK.headRadius, 8, 6), bulletMat, POOLS.bullets);
     this.bulletHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
     this.bulletHeads.frustumCulled = false;
     this.scene.add(this.bulletHeads);
     // Traînée : cylindre unitaire le long de +Y, étiré et orienté selon -vitesse.
     const trailGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6).translate(0, 0.5, 0);
-    const trailMat = new THREE.MeshBasicMaterial({ color: PALETTE.threat, transparent: true, opacity: 0.85 });
+    const trailMat = threatBasicMaterial(PALETTE.threat);
     this.bulletTrails = new THREE.InstancedMesh(trailGeo, trailMat, POOLS.bullets);
     this.bulletTrails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
     this.bulletTrails.frustumCulled = false;
     this.scene.add(this.bulletTrails);
 
-    const shardMat = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
-    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1), shardMat, SHATTER.capacity);
-    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
-    this.shards.frustumCulled = false;
-    for (let i = 0; i < SHATTER.capacity; i++) this.shards.setColorAt(i, this.colors.threat);
-    this.scene.add(this.shards);
+    const shardGeo = new THREE.TetrahedronGeometry(1);
+    this.threatShards = new THREE.InstancedMesh(shardGeo, threatMat, SHATTER.capacity);
+    const neutralMat = new THREE.MeshStandardNodeMaterial({ roughness: 0.4, flatShading: true });
+    this.neutralShards = new THREE.InstancedMesh(shardGeo, neutralMat, SHATTER.capacity);
+    for (let i = 0; i < SHATTER.capacity; i++) {
+      this.threatShards.setMatrixAt(i, this.hidden);
+      this.neutralShards.setMatrixAt(i, this.hidden);
+      this.neutralShards.setColorAt(i, this.colors.world);
+    }
+    for (const mesh of [this.threatShards, this.neutralShards]) {
+      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
+      mesh.frustumCulled = false;
+      this.scene.add(mesh);
+    }
   }
 
   resize(aspect: number): void {
@@ -156,19 +180,26 @@ export class WorldRenderer {
     this.racks.instanceMatrix.needsUpdate = true;
 
     this.bodies.update(view.enemies);
+    const linePos = this.aimLines.geometry.getAttribute("position") as THREE.BufferAttribute;
+    const lineColor = this.aimLines.geometry.getAttribute("color") as THREE.BufferAttribute;
     for (let i = 0; i < POOLS.enemies; i++) {
       const e = view.enemies[i]!;
-      const line = this.aimLines[i]!;
-      line.visible = e.visible && e.state === "aim";
-      if (!line.visible) continue;
-      // Le trait de visée part de la main qui tient l'arme.
+      if (!e.visible || e.state !== "aim") {
+        // Trait masqué : ses deux sommets confondus, il ne dessine rien.
+        linePos.setXYZ(i * 2, 0, -100, 0);
+        linePos.setXYZ(i * 2 + 1, 0, -100, 0);
+        continue;
+      }
+      // Le trait part de la main qui tient l'arme ; il chauffe de threat à threat-hot pendant la visée.
       const hand = this.bodies.pose(i).hand;
-      const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
-      attr.setXYZ(0, hand.x, hand.y, hand.z);
-      attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
-      attr.needsUpdate = true;
-      (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.stateProgress;
+      linePos.setXYZ(i * 2, hand.x, hand.y, hand.z);
+      linePos.setXYZ(i * 2 + 1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
+      this.lineTint.lerpColors(this.colors.threat, this.colors.threatHot, e.stateProgress);
+      lineColor.setXYZ(i * 2, this.lineTint.r, this.lineTint.g, this.lineTint.b);
+      lineColor.setXYZ(i * 2 + 1, this.lineTint.r, this.lineTint.g, this.lineTint.b);
     }
+    linePos.needsUpdate = true;
+    lineColor.needsUpdate = true;
 
     for (let i = 0; i < POOLS.weapons; i++) {
       const w = view.weapons[i]!;
@@ -216,7 +247,8 @@ export class WorldRenderer {
     for (let i = 0; i < view.shards.length; i++) {
       const sh = view.shards[i]!;
       if (!sh.active) {
-        this.shards.setMatrixAt(i, this.hidden);
+        this.threatShards.setMatrixAt(i, this.hidden);
+        this.neutralShards.setMatrixAt(i, this.hidden);
         continue;
       }
       this.p.set(sh.pos.x, sh.pos.y, sh.pos.z);
@@ -224,11 +256,18 @@ export class WorldRenderer {
       this.q.setFromAxisAngle(this.axis, sh.angle);
       this.s.setScalar(sh.size);
       this.m.compose(this.p, this.q, this.s);
-      this.shards.setMatrixAt(i, this.m);
-      this.shards.setColorAt(i, sh.kind === 0 ? this.colors.threat : sh.kind === 1 ? this.colors.world : this.colors.ink);
+      if (sh.kind === 0) {
+        this.threatShards.setMatrixAt(i, this.m);
+        this.neutralShards.setMatrixAt(i, this.hidden);
+      } else {
+        this.threatShards.setMatrixAt(i, this.hidden);
+        this.neutralShards.setMatrixAt(i, this.m);
+        this.neutralShards.setColorAt(i, sh.kind === 1 ? this.colors.world : this.colors.ink);
+      }
     }
-    this.shards.instanceMatrix.needsUpdate = true;
-    if (this.shards.instanceColor) this.shards.instanceColor.needsUpdate = true;
+    this.threatShards.instanceMatrix.needsUpdate = true;
+    this.neutralShards.instanceMatrix.needsUpdate = true;
+    if (this.neutralShards.instanceColor) this.neutralShards.instanceColor.needsUpdate = true;
   }
 }
 
```

- [ ] **Step 3 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t6-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `88 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

Au premier `bun run dev`, Vite peut réoptimiser `three/tsl` et recharger la page une fois, avec l'avertissement « Multiple instances of Three.js » : il disparaît au rechargement. Le build de production n'embarque qu'une instance.

- [ ] **Step 4 : vérifier dans Chrome**

Serveur de dev lancé (`--port 5299`). Chaque capture est enregistrée dans `.superpowers/plan-2-captures/`.

1. `http://localhost:5299/?debug`, sans rien faire : capture `t6-start.png`.
   **Attendu :** baies grises cernées d'un trait noir fin et continu, sans points parasites sur les faces ; ombres douces au sol ; vide bleu nuit ; ennemi de la passerelle orange avec un léger halo ; arme en main noire avec un liseré clair.
2. Même scène que la tâche 5, étape 5 (tireur en visée) : capture `t6-aim.png`.
   **Attendu :** ennemis orange lumineux, sans contour noir ; trait de visée orange, jamais noir ; ombres des ennemis au sol.
3. Tir du joueur :
   ```js
   location.reload(); // puis, une fois la page chargée :
   const a = window.agenthot; a.advance(0.02, { fire: true }); a.advance(0.05, {});
   ```
   Capture `t6-player-shot.png`. **Attendu :** une petite tête de balle lumineuse au centre, la traînée invisible (elle est dans la sphère de dégagement) ; rien ne couvre l'écran.
4. Éclatement et aberration :
   ```js
   location.reload(); // puis :
   const a = window.agenthot; a.advance(2.2, { moveX: 0.4 });
   const p = a.game.player; p.pos.x = 1.8; p.pos.z = -6.9;
   const e = a.game.enemies[0]; p.yaw = Math.atan2(-(e.pos.x - p.pos.x), -(e.pos.z - p.pos.z)); p.pitch = -0.08;
   a.advance(0.05, {}); a.game.killEnemy(a.game.enemies[0], { x: -20, y: 2, z: 3 }); a.advance(0.25, {});
   ```
   Capture `t6-shatter.png`. **Attendu :** éclats orange lumineux ; deux baies qui explosent en éclats blancs cernés d'encre ; un ennemi qui sort d'une baie. Puis `a.post.setDeath(1)`, capture `t6-death.png` : franges rouges et bleues sur les bords des objets.
5. Panneau debug : la ligne `… draws …` affiche **moins de 60** (prototype : 44). La lecture ne vaut que si la fenêtre Chrome est au premier plan : la boucle d'animation s'arrête dans un onglet caché.
6. `http://localhost:5299/?debug&renderer=webgl`, refaire le point 2 : capture `t6-aim-webgl.png`. **Attendu :** même image, contours et glow compris ; `window.agenthot.renderer.backend.isWebGPUBackend` vaut `undefined` ou `false`.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/render/post.ts src/render/materials.ts src/render/world-renderer.ts src/render/create-renderer.ts src/app/main.ts && git commit -m "feat(render): ink outlines, threat-only bloom, soft shadows, ink fresnel, death aberration"
```

---

### Task 7 : le son (spec 7.1, 7.3, AC-19)

- **Graphe :** SFX → panner HRTF → bus SFX (passe-bas asservi) ; musique en jeu → même passe-bas ; musique du menu et du replay → sans filtre ; tout → compresseur → sortie. Le compresseur est exposé (`engine.master`) pour l'enregistrement `?record=1` du plan 3.
- **Asservissement (pur, testé) :** coupure `300 + 19 700 × timeScale²` Hz ; débit SFX `clamp(0,2, 1, timeScale)` ; débit musique `clamp(0,5, 1, timeScale)` ; drone qui monte à l'arrêt. Rampes de 30 ms (`setTargetAtTime`) : ça suit le temps sans clics.
- **Bruitages, 0 fichier :** tir en 3 couches (transitoire 15 ms, coup grave 180 → 100 Hz, résonance métallique), clic à vide « tch-k », frôlement (bruit filtré à 3,2 kHz qui glisse vers le bas : Doppler), impact, éclatement (claquement puis 12 tintements), drone 45 Hz modulé à 1,5 Hz.
- **Qui joue quoi :** `GameAudio.frame(view, events)` en jeu (`game.events`) et au replay (`replay.events`) ; `freeze(TIME.min)` sur la mort, la victoire, le départ et la pause. Le contexte audio est débloqué au premier clic ou à la première touche.

**Files :**
- Create : `tests/audio-time.test.ts`, `src/audio/time-coupling.ts`, `src/audio/audio-engine.ts`, `src/audio/sfx.ts`, `src/audio/game-audio.ts`
- Modify : `src/app/main.ts`

**Interfaces :**
- Consumes : `EventQueue`, `WorldView`, `ReplayPlayer.events` (tâche 3), `TIME` (plan 1).
- Produces :
  - `AUDIO_TIME`, `lowpassCutoff(ts)`, `sfxRate(ts)`, `musicRate(ts)`, `droneGain(ts)` ;
  - `class AudioEngine { ctx; sfxIn; musicIn; cleanMusicIn; master; noise; unlock(); setTimeScale(ts); setVolumes(music, sfx); setListener(x, y, z, yaw, pitch); spatial(x, y, z): PannerNode }` : `setVolumes` attend les réglages du plan 3 (défauts 0,7 et 0,9, spec 4.5) ;
  - `playShot`, `playDryFire`, `playNearMiss`, `playImpact`, `playShatter(…, seed)`, `startDrone` (signature `(kit: SfxKit, out: AudioNode, when, rate)`) ;
  - `class GameAudio { engine; unlock(); frame(view, events); freeze(timeScale) }`.

- [ ] **Step 1 : écrire les tests d'asservissement**

`tests/audio-time.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { droneGain, lowpassCutoff, musicRate, sfxRate } from "../src/audio/time-coupling";
import { TIME, TimeController, type TimeInput } from "../src/sim/time";

const FRAME = 1 / 60;

function input(moveAlpha: number): TimeInput {
  return { moveAlpha, lookPixels: 0, action: false, jumpRising: false };
}

describe("le son suit le temps (AC-19)", () => {
  test("à pleine vitesse le son est ouvert ; au temps minimal il est étouffé", () => {
    expect(lowpassCutoff(1)).toBe(20_000);
    expect(lowpassCutoff(TIME.min)).toBeLessThan(320);
    expect(sfxRate(1)).toBe(1);
    expect(musicRate(1)).toBe(1);
  });

  test("la coupure monte avec le temps, sans jamais redescendre", () => {
    let previous = 0;
    for (let ts = TIME.min; ts <= 1; ts += 0.01) {
      const cutoff = lowpassCutoff(ts);
      expect(cutoff).toBeGreaterThan(previous);
      previous = cutoff;
    }
  });

  test("les débits restent dans leurs bornes : SFX ≥ 0,2, musique ≥ 0,5", () => {
    expect(sfxRate(TIME.min)).toBe(0.2);
    expect(musicRate(TIME.min)).toBe(0.5);
    expect(sfxRate(0.6)).toBe(0.6);
    expect(musicRate(0.6)).toBe(0.6);
  });

  test("le joueur s'arrête : en moins de 0,5 s réelle le son devient grave et étouffé", () => {
    const time = new TimeController();
    for (let t = 0; t < 1; t += FRAME) time.update(FRAME, input(1));
    expect(lowpassCutoff(time.scale)).toBeGreaterThan(15_000);
    for (let t = 0; t < 0.5; t += FRAME) time.update(FRAME, input(0));
    expect(lowpassCutoff(time.scale)).toBeLessThan(400);
    expect(musicRate(time.scale)).toBe(0.5);
  });

  test("le drone monte quand le joueur s'immobilise", () => {
    expect(droneGain(TIME.min)).toBeGreaterThan(droneGain(1) * 3);
  });
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/audio-time.test.ts`
Expected : FAIL, `Cannot find module '../src/audio/time-coupling'`.

- [ ] **Step 2 : écrire l'asservissement**

`src/audio/time-coupling.ts` :

```ts
// Le son suit le temps (spec 7.1) : conversions pures de timeScale vers les réglages audio.
// Testées avec bun ; le graphe Web Audio (audio-engine.ts) les applique à chaque image.

export const AUDIO_TIME = {
  cutoffMin: 300,
  cutoffSpan: 19_700,
  sfxRateMin: 0.2,
  musicRateMin: 0.5,
  // Drone d'ambiance : volume en mouvement, et volume ajouté quand le joueur s'immobilise.
  droneBase: 0.05,
  droneStillBoost: 0.25,
  // Constante de temps (s) des rampes de paramètres : assez courte pour suivre le temps, sans clics.
  rampTime: 0.03,
} as const;

// Fréquence de coupure du passe-bas des SFX et de la musique en jeu : 300 + 19 700 × timeScale² Hz.
export function lowpassCutoff(timeScale: number): number {
  return AUDIO_TIME.cutoffMin + AUDIO_TIME.cutoffSpan * timeScale * timeScale;
}

// Débit de lecture des SFX : clamp(0,2, 1, timeScale).
export function sfxRate(timeScale: number): number {
  return Math.min(1, Math.max(AUDIO_TIME.sfxRateMin, timeScale));
}

// Débit de la musique en jeu : clamp(0,5, 1, timeScale), sans correction de hauteur (elle descend).
export function musicRate(timeScale: number): number {
  return Math.min(1, Math.max(AUDIO_TIME.musicRateMin, timeScale));
}

// Volume du drone : il monte quand le joueur s'immobilise (timeScale bas).
export function droneGain(timeScale: number): number {
  const still = 1 - Math.min(1, Math.max(0, timeScale));
  return AUDIO_TIME.droneBase + AUDIO_TIME.droneStillBoost * still;
}
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/audio-time.test.ts`
Expected : `5 pass`. Le 4e test est l'AC-19 : joueur qui s'arrête, coupure sous 400 Hz en 0,5 s réelle, avec le vrai `TimeController`.

- [ ] **Step 3 : écrire le graphe, les bruitages et le branchement**

`src/audio/audio-engine.ts` :

```ts
// Graphe Web Audio (spec 7.1) :
//   sources SFX ─► panner HRTF ─► bus SFX (passe-bas asservi) ─┐
//   musique en jeu ─► passe-bas asservi (+ débit, côté MusicPlayer) ┼─► compresseur ─► sortie
//   musique menu / replay ──────────────────────────────────────────┘
import { AUDIO_TIME, lowpassCutoff } from "./time-coupling";

// Réglages par défaut de la spec 4.5 (volume musique 70, effets 90), appliqués au plan 3 par les paramètres.
const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_SFX_VOLUME = 0.9;

export class AudioEngine {
  readonly ctx: AudioContext;
  // Entrée des bruitages (après leur panner) : passe-bas asservi au temps.
  readonly sfxIn: GainNode;
  // Entrée de la musique en jeu : même passe-bas que les SFX.
  readonly musicIn: GainNode;
  // Entrée de la musique du menu et du replay : jamais filtrée.
  readonly cleanMusicIn: GainNode;
  // Sortie commune, avant la destination : le plan 3 s'y branche pour enregistrer (?record=1).
  readonly master: DynamicsCompressorNode;
  // Une seconde de bruit blanc, générée une fois : matière première des bruitages.
  readonly noise: AudioBuffer;
  private readonly sfxFilter: BiquadFilterNode;
  private readonly musicFilter: BiquadFilterNode;
  private readonly sfxVolume: GainNode;
  private readonly musicVolume: GainNode;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: "interactive" });
    const ctx = this.ctx;
    this.master = new DynamicsCompressorNode(ctx, { threshold: -12, knee: 12, ratio: 4, attack: 0.003, release: 0.25 });
    this.master.connect(ctx.destination);

    this.sfxVolume = new GainNode(ctx, { gain: DEFAULT_SFX_VOLUME });
    this.sfxFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: lowpassCutoff(1), Q: 0.7 });
    this.sfxIn = new GainNode(ctx);
    this.sfxIn.connect(this.sfxFilter).connect(this.sfxVolume).connect(this.master);

    this.musicVolume = new GainNode(ctx, { gain: DEFAULT_MUSIC_VOLUME });
    this.musicFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: lowpassCutoff(1), Q: 0.7 });
    this.musicIn = new GainNode(ctx);
    this.musicIn.connect(this.musicFilter).connect(this.musicVolume);
    this.cleanMusicIn = new GainNode(ctx);
    this.cleanMusicIn.connect(this.musicVolume);
    this.musicVolume.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // Le navigateur n'autorise le son qu'après un geste de l'utilisateur : à appeler dans un clic ou une touche.
  unlock(): void {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setTimeScale(timeScale: number): void {
    const now = this.ctx.currentTime;
    const cutoff = lowpassCutoff(timeScale);
    this.sfxFilter.frequency.setTargetAtTime(cutoff, now, AUDIO_TIME.rampTime);
    this.musicFilter.frequency.setTargetAtTime(cutoff, now, AUDIO_TIME.rampTime);
  }

  // Volumes de 0 à 1 (réglages du plan 3).
  setVolumes(music: number, sfx: number): void {
    const now = this.ctx.currentTime;
    this.musicVolume.gain.setTargetAtTime(music, now, AUDIO_TIME.rampTime);
    this.sfxVolume.gain.setTargetAtTime(sfx, now, AUDIO_TIME.rampTime);
  }

  // L'auditeur suit la caméra : position, regard (lacet 0 = −Z, tangage > 0 = vers le haut).
  setListener(x: number, y: number, z: number, yaw: number, pitch: number): void {
    const l = this.ctx.listener;
    const cp = Math.cos(pitch);
    const fx = -Math.sin(yaw) * cp;
    const fy = Math.sin(pitch);
    const fz = -Math.cos(yaw) * cp;
    if (l.positionX) {
      const now = this.ctx.currentTime;
      l.positionX.setValueAtTime(x, now);
      l.positionY.setValueAtTime(y, now);
      l.positionZ.setValueAtTime(z, now);
      l.forwardX.setValueAtTime(fx, now);
      l.forwardY.setValueAtTime(fy, now);
      l.forwardZ.setValueAtTime(fz, now);
      l.upX.setValueAtTime(0, now);
      l.upY.setValueAtTime(1, now);
      l.upZ.setValueAtTime(0, now);
    } else {
      // Navigateurs sans AudioParam sur l'auditeur : API historique.
      l.setPosition(x, y, z);
      l.setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  // Un panner HRTF posé en (x, y, z), relié au bus SFX : un par bruitage (les sources Web Audio sont à usage unique).
  spatial(x: number, y: number, z: number): PannerNode {
    const panner = new PannerNode(this.ctx, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 1.5,
      rolloffFactor: 1,
      positionX: x,
      positionY: y,
      positionZ: z,
    });
    panner.connect(this.sfxIn);
    return panner;
  }
}
```

`src/audio/sfx.ts` :

```ts
// Bruitages 100 % synthétisés, 0 fichier (spec 7.3). Chaque fonction joue un son sur `out` à l'instant
// `when`, ralenti par `rate` (débit des SFX, spec 7.1) : fréquences × rate, durées ÷ rate.
import { Rng } from "../sim/rng";

export interface SfxKit {
  ctx: BaseAudioContext;
  // Bruit blanc d'une seconde, partagé.
  noise: AudioBuffer;
}

const rng = new Rng();

// Enveloppe : montée linéaire, descente exponentielle jusqu'au silence.
function envelope(kit: SfxKit, out: AudioNode, when: number, peak: number, attack: number, decay: number): GainNode {
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  g.connect(out);
  return g;
}

// Rafale de bruit filtré.
function noiseBurst(
  kit: SfxKit,
  out: AudioNode,
  when: number,
  rate: number,
  type: BiquadFilterType,
  frequency: number,
  q: number,
  peak: number,
  duration: number,
): BiquadFilterNode {
  const src = new AudioBufferSourceNode(kit.ctx, { buffer: kit.noise, playbackRate: rate });
  const filter = new BiquadFilterNode(kit.ctx, { type, frequency: frequency * rate, Q: q });
  src.connect(filter).connect(envelope(kit, out, when, peak, 0.001, duration / rate));
  // Départ au hasard dans le bruit : deux tirs de suite ne sonnent pas identiques.
  src.start(when, Math.random() * 0.5, duration / rate + 0.05);
  return filter;
}

function tone(kit: SfxKit, out: AudioNode, when: number, type: OscillatorType, frequency: number, peak: number, attack: number, decay: number): OscillatorNode {
  const osc = new OscillatorNode(kit.ctx, { type, frequency });
  osc.connect(envelope(kit, out, when, peak, attack, decay));
  osc.start(when);
  osc.stop(when + attack + decay + 0.05);
  return osc;
}

// Tir : transitoire de 15 ms, coup grave entre 100 et 200 Hz, résonance métallique aiguë.
export function playShot(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  const k = 1 / rate;
  // Crêtes réglées pour que les trois couches ensemble restent autour de 1 (rendu hors ligne) ; le compresseur absorbe le reste.
  noiseBurst(kit, out, when, rate, "highpass", 2000, 0.7, 0.55, 0.015);
  const thump = tone(kit, out, when, "sine", 180 * rate, 0.6, 0.002, 0.18 * k);
  thump.frequency.setValueAtTime(180 * rate, when);
  thump.frequency.exponentialRampToValueAtTime(100 * rate, when + 0.12 * k);
  for (const partial of [2130, 3370, 5210]) tone(kit, out, when, "triangle", partial * rate, 0.05, 0.001, 0.25 * k);
}

// Clic à vide : double clic sec « tch-k », sans écho.
export function playDryFire(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  noiseBurst(kit, out, when, rate, "highpass", 3000, 0.7, 0.6, 0.004);
  noiseBurst(kit, out, when + 0.045 / rate, rate, "highpass", 4500, 0.7, 0.45, 0.004);
}

// Frôlement : bruit filtré autour de 3,2 kHz, dont la fréquence glisse vers le bas (effet Doppler).
export function playNearMiss(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  const k = 1 / rate;
  const filter = noiseBurst(kit, out, when, rate, "bandpass", 3200 * 1.35, 3, 0.8, 0.32);
  filter.frequency.setValueAtTime(3200 * 1.35 * rate, when);
  filter.frequency.exponentialRampToValueAtTime(3200 * 0.7 * rate, when + 0.3 * k);
}

// Impact d'une balle sur le décor : choc bref et mat.
export function playImpact(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  noiseBurst(kit, out, when, rate, "bandpass", 1200, 1.2, 0.35, 0.025);
}

// Éclatement : claquement de cristal, puis cascade de tintements. `seed` rend la cascade reproductible.
export function playShatter(kit: SfxKit, out: AudioNode, when: number, rate: number, seed: number): void {
  const k = 1 / rate;
  noiseBurst(kit, out, when, rate, "highpass", 2500, 0.7, 0.6, 0.04);
  rng.reset(seed);
  for (let i = 0; i < 12; i++) {
    const start = when + (0.02 + i * 0.05 + rng.range(0, 0.03)) * k;
    tone(kit, out, start, "sine", rng.range(2500, 7000) * rate, rng.range(0.05, 0.14), 0.002, rng.range(0.08, 0.25) * k);
  }
}

// Drone d'ambiance : 45 Hz modulé à 1,5 Hz. Joue en continu ; le volume se règle sur le gain renvoyé.
export function startDrone(kit: SfxKit, out: AudioNode): GainNode {
  const ctx = kit.ctx;
  const level = new GainNode(ctx, { gain: 0 });
  const tremolo = new GainNode(ctx, { gain: 0.6 });
  const lfo = new OscillatorNode(ctx, { type: "sine", frequency: 1.5 });
  const depth = new GainNode(ctx, { gain: 0.4 });
  lfo.connect(depth).connect(tremolo.gain);
  const fundamental = new OscillatorNode(ctx, { type: "sine", frequency: 45 });
  const octave = new OscillatorNode(ctx, { type: "sine", frequency: 90 });
  const octaveGain = new GainNode(ctx, { gain: 0.3 });
  fundamental.connect(tremolo);
  octave.connect(octaveGain).connect(tremolo);
  tremolo.connect(level).connect(out);
  lfo.start();
  fundamental.start();
  octave.start();
  return level;
}
```

`src/audio/game-audio.ts` :

```ts
// Son du jeu et du replay : lit la file d'événements et la vue du monde, comme le rendu.
import type { EventQueue } from "../sim/events";
import type { WorldView } from "../sim/view";
import { AudioEngine } from "./audio-engine";
import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
import { AUDIO_TIME, droneGain, sfxRate } from "./time-coupling";

export class GameAudio {
  readonly engine = new AudioEngine();
  private readonly drone: GainNode;
  private timeScale = 1;

  constructor() {
    this.drone = startDrone(this.engine, this.engine.sfxIn);
  }

  unlock(): void {
    this.engine.unlock();
  }

  // Une image : l'auditeur suit la caméra, les filtres suivent le temps, les événements sonnent.
  frame(view: WorldView, events: EventQueue): void {
    const engine = this.engine;
    const cam = view.camera;
    this.timeScale = view.timeScale;
    engine.setListener(cam.pos.x, cam.pos.y, cam.pos.z, cam.yaw, cam.pitch);
    engine.setTimeScale(view.timeScale);
    this.drone.gain.setTargetAtTime(droneGain(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
    this.play(events, view);
  }

  // Figé (mort, pause) : le son reste grave et étouffé, sans nouveaux événements.
  freeze(timeScale: number): void {
    this.timeScale = timeScale;
    this.engine.setTimeScale(timeScale);
    this.drone.gain.setTargetAtTime(droneGain(timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
  }

  private play(events: EventQueue, view: WorldView): void {
    const engine = this.engine;
    if (engine.ctx.state !== "running") return;
    const when = engine.ctx.currentTime;
    const rate = sfxRate(this.timeScale);
    const cam = view.camera.pos;
    for (let i = 0; i < events.count; i++) {
      const e = events.items[i]!;
      switch (e.type) {
        case "shot":
          playShot(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "dryFire":
          playDryFire(engine, engine.spatial(cam.x, cam.y, cam.z), when, rate);
          break;
        case "bulletImpact":
          playImpact(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "nearMiss":
          playNearMiss(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "enemyKilled":
        case "rackBurst":
          playShatter(engine, engine.spatial(e.pos.x, e.pos.y + 1, e.pos.z), when, rate, e.targetId + 1);
          break;
        case "playerKilled":
          // Vu de l'intérieur : le verre éclate sur l'auditeur.
          playShatter(engine, engine.spatial(cam.x, cam.y, cam.z), when, rate, 0);
          break;
        default:
          break;
      }
    }
  }
}
```

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 48236d3..02b6023 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -1,5 +1,6 @@
 // Point d'entrée de la phase « gris » : une salle, sans menu. Machine d'états réduite.
 import "./style.css";
+import { GameAudio } from "../audio/game-audio";
 import { ReplayPlayer } from "../replay/player";
 import { ReplayRecorder } from "../replay/recorder";
 import { createRenderer } from "../render/create-renderer";
@@ -7,6 +8,7 @@ import { PostPipeline } from "../render/post";
 import { WorldRenderer } from "../render/world-renderer";
 import { room01 } from "../rooms/room-01-datacenter";
 import { Game, type PlayerInput, emptyInput } from "../sim/game";
+import { TIME } from "../sim/time";
 import { createWorldView, writeGameView } from "../sim/view";
 import { Hud } from "./hud";
 import { InputController } from "./input";
@@ -29,6 +31,8 @@ const recorder = new ReplayRecorder();
 const replay = new ReplayPlayer(recorder, room01);
 const input = new InputController(renderer.domElement);
 const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
+// Contexte audio créé tout de suite, suspendu jusqu'au premier geste (clic ou touche).
+const audio = new GameAudio();
 
 let mode: Mode = "start";
 let last = performance.now();
@@ -60,8 +64,10 @@ function setMode(next: Mode): void {
 // Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
 // Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
 renderer.domElement.addEventListener("click", () => {
+  audio.unlock();
   if (mode !== "playing" && !input.locked) input.lock();
 });
+window.addEventListener("keydown", () => audio.unlock());
 document.addEventListener("pointerlockchange", () => {
   if (input.locked && (mode === "start" || mode === "paused")) {
     if (mode === "start") startRun();
@@ -117,6 +123,7 @@ renderer.setAnimationLoop(() => {
     writeGameView(game, view);
     recorder.recordEvents(game.events);
     recorder.capture(game.simTime, view, game.status !== "playing");
+    audio.frame(view, game.events);
     hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
     world.update(view);
     if (game.status === "dead") setMode("dead");
@@ -127,6 +134,8 @@ renderer.setAnimationLoop(() => {
       setMode("replay");
     }
   } else if (mode === "dead" || mode === "won") {
+    // Temps figé : le son reste grave et étouffé.
+    audio.freeze(TIME.min);
     // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
     const clicked = input.consumeFire() && mode === "dead";
     const pressedR = input.consumePress("KeyR");
@@ -149,8 +158,12 @@ renderer.setAnimationLoop(() => {
   } else if (mode === "replay") {
     replay.update(dt);
     world.update(replay.view);
+    audio.frame(replay.view, replay.events);
     hud.chant(replay.playhead);
     if (replay.finished) setMode("won");
+  } else {
+    // Départ et pause : la partie est figée, le son aussi.
+    audio.freeze(TIME.min);
   }
 
   post.render();
```

- [ ] **Step 4 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t7-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `93 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 5 : vérifier les bruitages dans Chrome (rendu hors ligne)**

Serveur de dev lancé, page `http://localhost:5299/?debug`. `evaluate_script` :

```js
async () => {
  const sfx = await import('/src/audio/sfx.ts');
  async function render(fn, rate, seconds = 1.5) {
    const ctx = new OfflineAudioContext(1, 48000 * seconds, 48000);
    const noise = ctx.createBuffer(1, 48000, 48000);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    fn({ ctx, noise }, ctx.destination, 0, rate);
    const x = (await ctx.startRendering()).getChannelData(0);
    let peak = 0, last = 0, zc = 0;
    for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > peak) peak = v; if (v > 0.001) last = i; if (i && (x[i] >= 0) !== (x[i - 1] >= 0)) zc++; }
    return { peak: +peak.toFixed(2), audibleMs: Math.round(last / 48), zcPerMs: +(zc / (last / 48 || 1)).toFixed(1) };
  }
  return {
    shot: await render(sfx.playShot, 1), shotSlow: await render(sfx.playShot, 0.2, 3),
    dry: await render(sfx.playDryFire, 1), near: await render(sfx.playNearMiss, 1),
    impact: await render(sfx.playImpact, 1),
    shatter: await render((k, o, w, r) => sfx.playShatter(k, o, w, r, 7), 1, 2),
    drone: await render((k, o) => { sfx.startDrone(k, o).gain.value = 0.3; }, 1, 1),
  };
}
```

**Attendu** (valeurs du prototype, le bruit fait varier les pics de ±0,1) :
- chaque son a un pic > 0 ; `shot` et `shatter` crêtent autour de 1 (≤ 1,1) ;
- `shot` ≈ 195 ms, `shotSlow` ≈ 970 ms (5 fois plus long) et `zcPerMs` de `shotSlow` au moins 4 fois plus bas que celui de `shot` (plus grave) ;
- `dry` ≈ 50 ms (deux clics), `impact` ≈ 15 ms, `shatter` ≈ 750 ms, `drone` joue sur toute la seconde.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add tests/audio-time.test.ts src/audio/time-coupling.ts src/audio/audio-engine.ts src/audio/sfx.ts src/audio/game-audio.ts src/app/main.ts && git commit -m "feat(audio): Web Audio graph coupled to time, synthesized SFX, drone and near miss"
```

---

### Task 8 : la musique Lyria (spec 7.2 et 8)

Deux morceaux dans ce plan : le **morceau en jeu** (tendu, pulsé, instrumental, pensé pour être ralenti) et le **morceau du replay** (lourd, avec le cri « AGENT... HOT... » sur chaque temps fort à 120 BPM, soit toutes les 0,5 s, le rythme du texte du replay). La boucle du menu viendra au plan 3.

Format de l'appel (brief `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md`, section 1, sondes gratuites du 2026-09-29 et doc https://ai.google.dev/gemini-api/docs/music-generation) :
- `POST https://generativelanguage.googleapis.com/v1beta/interactions`, en-têtes `x-goog-api-key` et `Content-Type: application/json` ;
- corps `{"model": "lyria-3.5", "input": "<prompt>", "response_format": {"type": "audio"}}` ; 0,08 $ par morceau ;
- **non capturé :** la forme exacte d'une réponse réussie. D'où `findAudio`, qui cherche le bloc audio sans dépendre du chemin, et le script qui enregistre la réponse réelle (audio remplacé par sa longueur) dans `assets/lyria-<piste>-response.json`. Si l'audio n'est pas trouvé, la réponse complète part dans `.superpowers/` (hors dépôt) pour ne pas perdre un morceau payé.

**Files :**
- Create : `tests/lyria.test.ts`, `scripts/lyria.ts`, `scripts/generate-music.ts`, `src/audio/music.ts`
- Modify : `tsconfig.json` (inclure `scripts`), `src/audio/game-audio.ts`, `src/app/main.ts`
- Generated (step 5) : `assets/ledger.jsonl`, `assets/lyria-game-response.json`, `assets/lyria-replay-response.json`, `public/audio/game.mp3`, `public/audio/replay.mp3`

**Interfaces :**
- Consumes : `AudioEngine.musicIn`, `cleanMusicIn` ; `musicRate` (tâche 7).
- Produces :
  - `LYRIA { endpoint, model, costUsd, budgetUsd, ledgerTool: "lyria" }`, `spentUsd(ledger, tool)`, `canAfford(ledger, tool, cost, budget)`, `findAudio(json)`, `withoutAudioData(json)`, `audioExtension(mime)` ;
  - `bun scripts/generate-music.ts <game|replay> [--dry-run]` ;
  - `class MusicTrack(ctx, out, url) { load(); loaded; play(); stop(); setRate(rate) }` ;
  - `GameAudio.loadMusic()`, `playGameMusic()`, `playReplayMusic()` ; musique en jeu au départ et à chaque relance, musique du replay à la victoire et à « Revoir ».
  - Ligne du journal : `{date, tool: "lyria", model, prompt, output, costUsd}` (le plan 3 réutilise `tool` pour AC-17).

- [ ] **Step 1 : écrire les tests**

`tests/lyria.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { LYRIA, audioExtension, canAfford, findAudio, spentUsd, withoutAudioData } from "../scripts/lyria";

const LONG = "A".repeat(1000);

describe("génération musicale : budget (spec 8, AC-17)", () => {
  const ledger = [
    JSON.stringify({ date: "2026-09-29", tool: "lyria", model: "lyria-3.5", prompt: "a", output: "x.mp3", costUsd: 0.08 }),
    "",
    JSON.stringify({ date: "2026-09-29", tool: "seedream", model: "s", prompt: "b", output: "y.png", costUsd: 1.5 }),
    JSON.stringify({ date: "2026-09-29", tool: "lyria", model: "lyria-3.5", prompt: "c", output: "z.mp3", costUsd: 0.08 }),
  ].join("\n");

  test("le total d'un outil ne compte que ses lignes", () => {
    expect(spentUsd(ledger, "lyria")).toBeCloseTo(0.16, 9);
    expect(spentUsd("", "lyria")).toBe(0);
  });

  test("une génération qui ferait dépasser le budget est refusée, celle qui tombe pile est acceptée", () => {
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, LYRIA.budgetUsd)).toBe(true);
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, 0.24)).toBe(true);
    expect(canAfford(ledger, "lyria", LYRIA.costUsd, 0.2)).toBe(false);
  });
});

describe("génération musicale : lecture de la réponse", () => {
  test("trouve l'audio dans la forme de la doc (steps[].content[])", () => {
    const response = {
      status: "completed",
      steps: [
        { type: "model_output", content: [{ type: "text", text: "AGENT HOT" }, { type: "audio", data: LONG, mime_type: "audio/mpeg" }] },
      ],
    };
    expect(findAudio(response)).toEqual({ data: LONG, mimeType: "audio/mpeg" });
  });

  test("trouve aussi l'audio dans la forme generateContent (inlineData)", () => {
    const response = { candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/wav", data: LONG } }] } }] };
    expect(findAudio(response)).toEqual({ data: LONG, mimeType: "audio/wav" });
  });

  test("sans bloc audio, rien n'est trouvé", () => {
    expect(findAudio({ steps: [{ content: [{ type: "text", text: "refused" }] }] })).toBeNull();
    expect(findAudio({ image: { data: LONG, mime_type: "image/png" } })).toBeNull();
  });

  test("l'échantillon gardé remplace l'audio par sa longueur et garde le reste", () => {
    const sample = withoutAudioData({ steps: [{ content: [{ data: LONG, mime_type: "audio/mpeg", sample_rate: 44100 }] }] });
    expect(sample).toEqual({ steps: [{ content: [{ data: "<1000 base64 chars>", mime_type: "audio/mpeg", sample_rate: 44100 }] }] });
  });

  test("extension de fichier selon le type MIME", () => {
    expect(audioExtension("audio/mpeg")).toBe("mp3");
    expect(audioExtension("audio/wav")).toBe("wav");
    expect(audioExtension("audio/ogg")).toBe("ogg");
  });
});
```

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/lyria.test.ts`
Expected : FAIL, `Cannot find module '../scripts/lyria'`.

- [ ] **Step 2 : écrire les outils et le script**

`scripts/lyria.ts` :

```ts
// Outils purs du script de génération musicale (spec 8) : budget du journal, lecture de la réponse Lyria.

export const LYRIA = {
  endpoint: "https://generativelanguage.googleapis.com/v1beta/interactions",
  model: "lyria-3.5",
  // Prix par morceau (https://ai.google.dev/gemini-api/docs/pricing, mis à jour le 2026-09-24).
  costUsd: 0.08,
  // Budget Lyria de la spec 8.
  budgetUsd: 3,
  // Nom de l'outil dans assets/ledger.jsonl (AC-17 somme costUsd par outil).
  ledgerTool: "lyria",
} as const;

export interface LedgerEntry {
  date: string;
  tool: string;
  model: string;
  prompt: string;
  output: string;
  costUsd: number;
}

// Total déjà dépensé pour un outil, d'après le journal (une ligne JSON par génération).
export function spentUsd(ledgerText: string, tool: string): number {
  let total = 0;
  for (const line of ledgerText.split("\n")) {
    if (line.trim() === "") continue;
    const entry = JSON.parse(line) as LedgerEntry;
    if (entry.tool === tool) total += entry.costUsd;
  }
  return total;
}

// Règle de la spec 8 : le total de l'outil plus le coût estimé doit rester sous le budget.
export function canAfford(ledgerText: string, tool: string, costUsd: number, budgetUsd: number): boolean {
  return spentUsd(ledgerText, tool) + costUsd <= budgetUsd + 1e-9;
}

export interface FoundAudio {
  data: string;
  mimeType: string;
}

// Cherche le premier bloc audio (champ `data` en base64 et type MIME audio/*) n'importe où dans la réponse.
// La forme exacte d'une réponse réussie n'a pas été capturée avant le plan : la recherche ne dépend pas
// du chemin (steps[].content[] d'après la doc, ou candidates[].content.parts[].inlineData selon l'API).
export function findAudio(node: unknown): FoundAudio | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findAudio(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object" || node === null) return null;
  const obj = node as Record<string, unknown>;
  const mime = obj.mime_type ?? obj.mimeType;
  if (typeof obj.data === "string" && typeof mime === "string" && mime.startsWith("audio/")) {
    return { data: obj.data, mimeType: mime };
  }
  for (const key of Object.keys(obj)) {
    const found = findAudio(obj[key]);
    if (found) return found;
  }
  return null;
}

// Copie de la réponse où chaque long champ base64 est remplacé par sa longueur : c'est l'échantillon
// réel gardé dans assets/ pour la suite (la réponse brute pèse plusieurs Mo).
export function withoutAudioData(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withoutAudioData);
  if (typeof node !== "object" || node === null) return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = key === "data" && typeof value === "string" && value.length > 256 ? `<${value.length} base64 chars>` : withoutAudioData(value);
  }
  return out;
}

// Extension de fichier pour un type MIME audio.
export function audioExtension(mimeType: string): string {
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") return "mp3";
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav" || mimeType === "audio/wave") return "wav";
  return mimeType.slice("audio/".length).replace(/[^a-z0-9]/g, "") || "bin";
}
```

`scripts/generate-music.ts` :

```ts
// Génère un morceau avec Lyria 3.5 (spec 7.2 et 8). Usage :
//   bun scripts/generate-music.ts <game|replay> [--dry-run]
// --dry-run affiche la requête et le budget sans rien appeler ni dépenser.
// Chaque vraie génération coûte 0,08 $ et ajoute une ligne à assets/ledger.jsonl.
import { LYRIA, audioExtension, canAfford, findAudio, spentUsd, withoutAudioData } from "./lyria";

// Prompts en anglais (langue de travail de Lyria). Aucun nom d'artiste : les filtres de Lyria les bloquent.
const TRACKS: Record<string, string> = {
  game: [
    "Instrumental only, no vocals.",
    "Tense, pulsing dark electronic track for a first-person action game where time only moves when you move.",
    "120 BPM, D minor. Punchy sub-bass pulse on every beat, tight ticking hi-hats, cold metallic stabs, a restless analog synth arpeggio.",
    "Designed to be slowed down: a clear low-end pulse and no silent gaps, so it stays menacing at half speed.",
    "[0:00 - 0:08] Intro: pulse and ticking only.",
    "[0:08 - 1:20] Main groove: full drums, bass and arpeggio, steady energy, no breakdown.",
    "[1:20 - 1:30] Outro that flows straight back into the main groove, for a clean loop.",
  ].join(" "),
  replay: [
    "Heavy, slow, triumphant electronic track for an action movie slow-motion replay.",
    "120 BPM with a huge hit on every beat, E minor. Massive distorted drums, sub drops, glitchy synth stabs.",
    "Vocals: a deep, processed robotic male voice shouts only two words, alternating on each strong beat:",
    "\"AGENT... HOT... AGENT... HOT...\", repeated through the whole track. No other lyrics.",
    "[0:00 - 0:04] Single impact hit.",
    "[0:04 - 1:00] Chant over full drums.",
    "[1:00 - 1:10] Final hit and decay.",
  ].join(" "),
};

const LEDGER = "assets/ledger.jsonl";

const [track, flag] = process.argv.slice(2);
const prompt = track ? TRACKS[track] : undefined;
if (!track || !prompt) {
  console.error(`usage: bun scripts/generate-music.ts <${Object.keys(TRACKS).join("|")}> [--dry-run]`);
  process.exit(1);
}

const ledgerFile = Bun.file(LEDGER);
const ledgerText = (await ledgerFile.exists()) ? await ledgerFile.text() : "";
const spent = spentUsd(ledgerText, LYRIA.ledgerTool);
if (!canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) {
  console.error(`budget exceeded: ${spent.toFixed(2)} $ spent + ${LYRIA.costUsd} $ > ${LYRIA.budgetUsd} $. Ask Romain.`);
  process.exit(2);
}

const body = { model: LYRIA.model, input: prompt, response_format: { type: "audio" } };
console.info(`track ${track} · spent ${spent.toFixed(2)} $ of ${LYRIA.budgetUsd} $ · this call ${LYRIA.costUsd} $`);
if (flag === "--dry-run") {
  console.info(JSON.stringify(body, null, 2));
  process.exit(0);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

// La génération est synchrone et peut prendre plusieurs minutes : pas de délai d'attente court.
const response = await fetch(LYRIA.endpoint, {
  method: "POST",
  headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = (await response.json()) as unknown;
// Échantillon réel de la réponse, audio remplacé par sa longueur : la forme exacte n'était pas connue au plan.
await Bun.write(`assets/lyria-${track}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
  process.exit(1);
}

const audio = findAudio(json);
if (!audio) {
  // Le morceau est peut-être payé : on garde la réponse complète (hors dépôt) pour le récupérer
  // une fois findAudio corrigé contre l'échantillon, sans payer un second appel.
  await Bun.write(`.superpowers/lyria-${track}-raw.json`, JSON.stringify(json));
  console.error(`no audio found: see assets/lyria-${track}-response.json, raw response in .superpowers/`);
  process.exit(1);
}
const output = `public/audio/${track}.${audioExtension(audio.mimeType)}`;
await Bun.write(output, Buffer.from(audio.data, "base64"));

const entry = { date: new Date().toISOString(), tool: LYRIA.ledgerTool, model: LYRIA.model, prompt, output, costUsd: LYRIA.costUsd };
await Bun.write(LEDGER, `${ledgerText}${JSON.stringify(entry)}\n`);
console.info(`wrote ${output} (${audio.mimeType}) · ledger ${(spent + LYRIA.costUsd).toFixed(2)} $`);
if (!output.endsWith(".mp3")) console.warn(`the game loads /audio/${track}.mp3: convert ${output} before playing`);
```

```diff
diff --git a/tsconfig.json b/tsconfig.json
index 5c7265f..2f81efd 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -15,5 +15,5 @@
     "skipLibCheck": true,
     "noEmit": true
   },
-  "include": ["src", "tests"]
+  "include": ["src", "tests", "scripts"]
 }
```

- [ ] **Step 3 : écrire la lecture et la brancher**

`src/audio/music.ts` :

```ts
// Une piste musicale en boucle (spec 7.2). La musique en jeu suit le temps par son débit, sans
// correction de hauteur : un AudioBufferSourceNode ralenti descend dans le grave (spec 7.1).
import { AUDIO_TIME } from "./time-coupling";

export class MusicTrack {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private readonly ctx: BaseAudioContext;
  private readonly out: AudioNode;
  private readonly url: string;

  constructor(ctx: BaseAudioContext, out: AudioNode, url: string) {
    this.ctx = ctx;
    this.out = out;
    this.url = url;
  }

  // Charge le fichier. Absent ou illisible (musique pas encore générée) : le jeu reste muet, sans erreur.
  async load(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
    } catch (error) {
      console.warn(`[agenthot] music ${this.url} unavailable`, error);
    }
  }

  get loaded(): boolean {
    return this.buffer !== null;
  }

  // Repart du début, en boucle.
  play(): void {
    this.stop();
    if (!this.buffer) return;
    this.source = new AudioBufferSourceNode(this.ctx, { buffer: this.buffer, loop: true });
    this.source.connect(this.out);
    this.source.start();
  }

  stop(): void {
    if (!this.source) return;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
  }

  setRate(rate: number): void {
    this.source?.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, AUDIO_TIME.rampTime);
  }
}
```

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 02b6023..89b48e3 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -33,6 +33,7 @@ const input = new InputController(renderer.domElement);
 const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
 // Contexte audio créé tout de suite, suspendu jusqu'au premier geste (clic ou touche).
 const audio = new GameAudio();
+void audio.loadMusic();
 
 let mode: Mode = "start";
 let last = performance.now();
@@ -49,6 +50,7 @@ function startRun(): void {
   recorder.capture(game.simTime, view, true);
   input.clear();
   hud.resetCrosshair();
+  audio.playGameMusic();
 }
 
 function setMode(next: Mode): void {
@@ -131,6 +133,7 @@ renderer.setAnimationLoop(() => {
       // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
       if (debug) console.info(`[agenthot] replay sim ${game.simTime.toFixed(2)} s vs duration ${replay.duration.toFixed(2)} s`);
       replay.restart();
+      audio.playReplayMusic();
       setMode("replay");
     }
   } else if (mode === "dead" || mode === "won") {
@@ -153,6 +156,7 @@ renderer.setAnimationLoop(() => {
       world.update(view);
     } else if (mode === "won" && input.consumePress("Space")) {
       replay.restart();
+      audio.playReplayMusic();
       setMode("replay");
     }
   } else if (mode === "replay") {
diff --git a/src/audio/game-audio.ts b/src/audio/game-audio.ts
index c0d4867..78e2a5e 100644
--- a/src/audio/game-audio.ts
+++ b/src/audio/game-audio.ts
@@ -2,16 +2,42 @@
 import type { EventQueue } from "../sim/events";
 import type { WorldView } from "../sim/view";
 import { AudioEngine } from "./audio-engine";
+import { MusicTrack } from "./music";
 import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
-import { AUDIO_TIME, droneGain, sfxRate } from "./time-coupling";
+import { AUDIO_TIME, droneGain, musicRate, sfxRate } from "./time-coupling";
+
+// Morceaux Lyria (tâche 8 du plan 2), servis depuis public/audio/.
+const MUSIC = {
+  game: "/audio/game.mp3",
+  replay: "/audio/replay.mp3",
+} as const;
 
 export class GameAudio {
   readonly engine = new AudioEngine();
   private readonly drone: GainNode;
+  // Musique en jeu : filtrée et ralentie avec le temps. Musique du replay : à vitesse réelle, non filtrée.
+  private readonly gameMusic: MusicTrack;
+  private readonly replayMusic: MusicTrack;
   private timeScale = 1;
 
   constructor() {
     this.drone = startDrone(this.engine, this.engine.sfxIn);
+    this.gameMusic = new MusicTrack(this.engine.ctx, this.engine.musicIn, MUSIC.game);
+    this.replayMusic = new MusicTrack(this.engine.ctx, this.engine.cleanMusicIn, MUSIC.replay);
+  }
+
+  loadMusic(): Promise<void> {
+    return Promise.all([this.gameMusic.load(), this.replayMusic.load()]).then(() => undefined);
+  }
+
+  playGameMusic(): void {
+    this.replayMusic.stop();
+    this.gameMusic.play();
+  }
+
+  playReplayMusic(): void {
+    this.gameMusic.stop();
+    this.replayMusic.play();
   }
 
   unlock(): void {
@@ -25,6 +51,7 @@ export class GameAudio {
     this.timeScale = view.timeScale;
     engine.setListener(cam.pos.x, cam.pos.y, cam.pos.z, cam.yaw, cam.pitch);
     engine.setTimeScale(view.timeScale);
+    this.gameMusic.setRate(musicRate(view.timeScale));
     this.drone.gain.setTargetAtTime(droneGain(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
     this.play(events, view);
   }
@@ -33,6 +60,7 @@ export class GameAudio {
   freeze(timeScale: number): void {
     this.timeScale = timeScale;
     this.engine.setTimeScale(timeScale);
+    this.gameMusic.setRate(musicRate(timeScale));
     this.drone.gain.setTargetAtTime(droneGain(timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
   }
 
```

- [ ] **Step 4 : tests, types, build, essai à blanc**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-2-t8-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build && bun scripts/generate-music.ts replay --dry-run`
Expected : `100 pass`, `0 fail` ; `tsc` sans sortie ; build réussi ; l'essai à blanc affiche `track replay · spent 0.00 $ of 3 $ · this call 0.08 $` puis le corps JSON, sans rien appeler.

Vérification Chrome (serveur de dev lancé, page `?debug`), **avant** toute génération :

```js
async () => {
  const { GameAudio } = await import('/src/audio/game-audio.ts');
  const ga = new GameAudio(); await ga.loadMusic();
  ga.playGameMusic(); ga.playReplayMusic();
  return { game: ga.gameMusic.loaded, replay: ga.replayMusic.loaded };
}
```

**Attendu :** `{ game: false, replay: false }`, deux avertissements `[agenthot] music … unavailable` en console, aucune exception (Review Focus 2).

Commit du code, sans les fichiers générés :

```bash
cd <racine> && git add tests/lyria.test.ts scripts/lyria.ts scripts/generate-music.ts src/audio/music.ts tsconfig.json src/audio/game-audio.ts src/app/main.ts && git commit -m "feat(audio): Lyria music script with budget ledger, in-game and replay music"
```

- [ ] **Step 5 : générer les deux morceaux (0,16 $, avec le feu vert de Romain)**

Cette étape dépense de l'argent : ne la lancer qu'avec l'accord de Romain (voir « Décisions pour Romain »). Vérifier la clé sans l'afficher : `test -n "$GEMINI_API_KEY" && echo présente`.

1. `cd <racine> && bun scripts/generate-music.ts game`
   - La génération peut prendre plusieurs minutes.
   - Attendu : `wrote public/audio/game.mp3 (audio/mpeg) · ledger 0.08 $`.
   - Ouvrir `assets/lyria-game-response.json` : c'est le premier échantillon réel de la réponse. Si sa forme diffère de celle des tests (`steps[].content[]`), ajouter à `tests/lyria.test.ts` un test qui lit cet échantillon, pour que `findAudio` reste couvert sur la vraie forme.
   - Si le script dit `no audio found` : corriger `findAudio` contre l'échantillon (avec un test), puis extraire l'audio de `.superpowers/lyria-game-raw.json`, sans relancer d'appel payant.
   - Réponse en WAV au lieu de MP3 : le script prévient ; convertir avec `ffmpeg -i public/audio/game.wav -b:a 160k public/audio/game.mp3`.
2. `cd <racine> && bun scripts/generate-music.ts replay`, mêmes contrôles.
3. `cd <racine> && cat assets/ledger.jsonl` : 2 lignes, `costUsd` 0.08 chacune.
4. Chrome : recharger `?debug`, relancer le script du step 4. **Attendu :** `{ game: true, replay: true }`.

```bash
cd <racine> && git add assets/ledger.jsonl assets/lyria-game-response.json assets/lyria-replay-response.json public/audio/game.mp3 public/audio/replay.mp3 && git commit -m "assets: generate in-game and replay music with Lyria 3.5"
```

(Ajouter au `git add` le test d'échantillon réel s'il a été écrit.)

---

### Task 9 : Romain regarde et écoute (porte avant le plan 3)

Cette tâche ne s'automatise pas. L'exécutant prépare, mesure ce qui se mesure, puis s'arrête et attend le verdict.

- [ ] **Step 1 : préparer**

Lancer `cd <racine> && bun run dev`, donner à Romain l'URL `http://localhost:5173/?debug`, avec le son allumé (casque de préférence : le frôlement est spatialisé).

- [ ] **Step 2 : mesures pendant que Romain joue**

- **AC-8 :** trace de performance Chrome DevTools au moment le plus chargé (5 ennemis et un éclatement). Attendu : temps d'image p95 ≤ 16,7 ms ; panneau debug `< 60 draws`.
- **AC-13 :** 5 captures, enregistrées dans `.superpowers/plan-2-captures/` : départ, combat, éclatement, mort, replay. Une seule question à Romain : « Est-ce que seul ce qui te menace est orange ? »
- **AC-19 :** Romain s'arrête, puis marche. Attendu : le son devient grave et étouffé en moins de 0,5 s, puis s'ouvre.
- **Review Focus 1 :** Échap en pleine partie. Attendu : le son se fige avec l'image.
- **Review Focus 5 :** une partie dans Firefox. Attendu : le son se déplace à gauche et à droite quand on tourne la tête.

- [ ] **Step 3 : recueillir le verdict**

Poser ces questions à Romain, une par une :
1. Les ennemis en verre facetté : ça claque ?
2. Contours et glow : la lecture est-elle nette ? La menace sans contour noir, ça te va ?
3. Le son du ralenti : grave, étouffé, puis qui s'ouvre, ça fait « SUPERHOT » ?
4. Le frôlement : tu le sens passer d'un côté ?
5. Le replay avec son morceau : effet « film d'action » ? Le cri « AGENT... HOT... » de Lyria est-il net, ou faut-il la voix synthétisée en code (spec 7.2) ?

- [ ] **Step 4 : régler, puis arrêter**

- Les réglages vivent dans `POST` (`post.ts`), les matériaux (`materials.ts`), `BODY` et les angles (`enemy-pose.ts`), `BULLET_LOOK`, `AUDIO_TIME`, les crêtes de `sfx.ts`.
- Relancer `bun test` après chaque réglage : les tests vérifient des comportements, pas des valeurs.
- Commit par série de réglages : `tune: <quoi>`.
- **S'arrêter là.** Le plan 3 ne démarre qu'après le « go » de Romain.

## Décisions pour Romain

1. **Générer les 2 morceaux Lyria (0,16 $ sur 3,00 $) sans redemander ?** La spec 8 autorise toute dépense sous le budget. Recommandation : oui, c'est la seule façon de juger le replay.
2. **La menace sans contour noir.** Les ennemis, balles et traits de visée sont détourés par leur halo, pas par l'encre. Recommandation : garder (plus « verre », et sans le défaut des traits noircis) ; tu tranches sur les captures de la tâche 9.
3. **Sauter esquive la mêlée** (la hauteur est mesurée aux pieds depuis le plan 1). Recommandation : garder, c'est une esquive lisible dans l'esprit du jeu.
