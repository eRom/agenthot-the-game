# AGENTHOT, plan 3a : finitions du jeu et écrans

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** finir la salle (orange vif dans l'ombre, hanches, pistolet et mains en code, qualité auto, éclats exacts au replay) et construire tout le parcours d'écrans : chargement, écran mobile, menu sur la salle figée à 3 %, panneaux Salles, Paramètres et Crédits, pause, victoire, cinématique d'accueil.

**Architecture :**
- Le point d'entrée (`src/app/main.ts`) devient léger : sans Three.js, il affiche le chargeur ou l'écran mobile tout de suite. Le moteur (`src/app/engine.ts` : rendu, simulation, replay) est un module chargé à part, une fois l'invite « APPUIE SUR UNE TOUCHE » affichée.
- Les écrans vivent dans `src/ui/` (HTML/CSS et TypeScript, sans framework, spec 3) : `tokens.css` porte le design system « Monolithe + Encre » (spec 6.3), chaque écran est une classe qui construit son DOM et prévient par des rappels.
- Le fond du menu est une démo : une partie scriptée jouée sans écran au démarrage (quelques millisecondes), enregistrée par le `ReplayRecorder`, rejouée à 3 % par un `ReplayPlayer`, caméra qui dérive. Aucun fichier de démo à versionner : elle suit toujours le format du replay.
- Tout ce qui se calcule sans navigateur est pur et testé avec `bun test` : éclats, formes du pistolet et des mains, gestes, qualité auto, limite d'images, paramètres, détection mobile, démo et caméra du menu, crédits, drapeau de la cinématique.

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4, Three.js r186 (`three/webgpu`, `three/tsl`, `three/addons`), Web Audio API, Web Animations API, fontTools (via `uvx`) pour les polices.

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, étape 6 de la section 11 : sections 4 (4.1 à 4.6), 6.1, 6.2, 6.3, 7.2 (boucle du menu, branchement seulement), 9.2 ; AC-8 (qualité auto), AC-10 (invite), AC-11, AC-12, AC-13 (reprise), AC-14, AC-15. Intent : `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md`. Entrées obligatoires : section « Reporté au plan 3 » de `docs/superpowers/reports/2026-09-29-agenthot-plan-2-rulings.md`.

**Place de ce plan :** plan 3a sur 3. Le plan 3 est découpé en trois exécutions :
- **3a (ce plan)** : finitions du jeu et écrans, tout en code, zéro dépense ;
- **3b** : assets générés (boucle du menu, vignettes, fond de l'image de partage), enregistrement `?record=1`, cinématique Hyperframes ; `docs/superpowers/plans/2026-09-29-agenthot-plan-3b-assets-cinematic.md` ;
- **3c** : performance, partage (Open Graph), crédits définitifs, mise en ligne ; `docs/superpowers/plans/2026-09-29-agenthot-plan-3c-perf-share-launch.md`.

Les fichiers que 3b fabriquera (`public/audio/menu.mp3`, `public/rooms/room-0{1,2}.webp`, `public/video/intro.{webm,mp4}`) sont déjà lus par le code de 3a : absents, ils ne bloquent rien et ne lèvent aucune erreur (Review Focus 3).

## Global Constraints

- **Langue :** identifiants, clés, noms de fichiers, messages de log en anglais ; commentaires en français. Textes d'interface en français, sauf la ligne des crédits (spec 4.3, en anglais, exacte). Descriptions de test en français, car Romain les lit : garder tel quel.
- **Outillage :** `bun` uniquement (jamais `npm`, `npx`, `node`). Aucune nouvelle dépendance npm. Les polices passent par `uvx` (fontTools 4.66.1 et brotli 1.2.0, épinglés dans `scripts/build-fonts.sh`) et le réseau (dépôt `google/fonts`, commit épinglé).
- **Zéro dépense :** aucune génération payante dans ce plan. Jamais `bun scripts/generate-music.ts` avec `--pay`.
- **Zéro allocation dans la boucle de jeu et de rendu** (spec 9.1) : `step`, `update`, `writeView`, `poseEnemy`, `ViewModel.update`, `menuCamera`, `QualityGovernor.sample`. Les écrans (DOM) ne tournent pas dans la boucle.
- **Palette** (spec 6.1) : dans la scène, l'orange ne va qu'à la menace (AC-13). Dans l'interface, l'orange marque l'élément actif (losange, filet de 4 px) et « HOT » du logo, comme la maquette validée (directions B et C).
- **Caractère `‧` :** c'est U+2027 (point de césure), jamais U+00B7. Écrit à la main dans un éditeur ou une commande, `‧` peut devenir le vrai caractère ou rester tel quel selon l'outil : vérifier les octets, par exemple `python3 -c "print([hex(ord(c)) for c in open('src/ui/credits.ts').read() if ord(c) > 0x2000])"` doit n'afficher que des `0x2027`.
- **Git :** `git add` de fichiers nommés seulement, jamais `git add -A` ni `git add .` (fichiers non commités de Romain : `docs/superpowers/idea/*`, `OVERVIEW.md` modifié, `.impeccable/`, `.ignore`). Aucun push.
- **Commandes Bash :** chaque commande qui écrit commence par `cd <racine du dépôt> &&`. Sortie brute des tests : préfixe `RTK_DISABLED=1`. Toute sortie de test citée dans un rapport vient d'une commande passée par `tee` vers un fichier nommé dans le rapport ; `bun test | tee` masque le code de sortie : lire la ligne `pass`/`fail` du fichier.
- **Chrome :** vérifications par l'extension claude-in-chrome ou le MCP Chrome DevTools (profil unique : s'il est pris, l'extension). La boucle d'animation et les animations CSS s'arrêtent quand l'onglet est caché (`document.visibilityState === "hidden"`) : toute mesure d'images par seconde, tout fondu, se lit fenêtre au premier plan. Le verrou de souris exige le premier plan : s'il est refusé, le noter « non fait », ne jamais simuler.
- **Vite :** un fichier absent de `public/` renvoie `200 text/html` en développement (repli SPA). Une vérification « fichier absent » se fait donc aussi sur le build (`bun run build && bun run preview`), qui renvoie un vrai 404.

## Review Focus

Cinq cas qu'un joueur rencontrera et qu'aucun test de tâche ne couvre seul. Chacun a sa vérification dans la tâche propriétaire.

1. **Fichiers générés pas encore là** (boucle du menu, vignettes, cinématique : ils arrivent au plan 3b). Le chargeur atteint son invite, le menu s'ouvre sans musique, les cartes de salles gardent leur fond d'encre, la cinématique se passe d'elle-même. Aucune erreur en console, seulement l'avertissement `music ... unavailable`. Vérification : tâche 12, étape 2 (build de production, vrais 404).
2. **Stockage refusé ou abîmé** (navigation privée stricte, JSON modifié à la main). Réglages par défaut, cinématique rejouée, aucune exception. Vérification : tâches 5 et 11 (tests de stockage qui lèvent) ; tâche 12, étape 3 (`localStorage` rempli de JSON abîmé).
3. **Souris refusée par le navigateur** (Chrome refuse un nouveau verrou pendant environ 1 s après Échap ; fenêtre sans le focus). Le joueur n'est jamais bloqué : « CLIQUE POUR JOUER » au départ, le panneau Pause reste en place, un nouveau clic suffit. Vérification : tâches 9 et 10 (Jouer sans verrou) ; tâche 12, étape 4 (Échap puis Reprendre tout de suite).
4. **Retour d'un onglet caché, écran à 120 ou 144 Hz.** La résolution ne chute pas à tort au retour, et le jeu tourne à 60 images par seconde en auto, pas à 120. Vérification : tâche 4 (tests `stallMs` et limiteur à 120 et 144 Hz) ; tâche 12, étape 5 (panneau debug fenêtre au premier plan).
5. **Navigateur sans WebGL2 ni WebGPU.** Un message clair sur le chargeur, pas un écran noir. Vérification : tâche 7, étape 6 (création du moteur forcée en échec).

## Structure des fichiers

```
src/
  app/        main.ts (réécrit : point d'entrée léger), engine.ts (nouveau : le moteur, chargé à part),
              device.ts (nouveau), hud.ts, style.css (modifiés)
  ui/         tokens.css, screens.css, dom.ts, media.ts, loader.ts, mobile.ts, menu.ts, panels.ts,
              credits.ts, room-panels.ts, intro.ts                           (nouveaux)
  settings/   settings.ts                                                    (nouveau)
  render/     weapon-shapes.ts, view-model.ts, quality.ts                    (nouveaux)
              post.ts, materials.ts, enemy-geometry.ts, world-renderer.ts, create-renderer.ts (modifiés)
  replay/     menu-demo.ts                                                   (nouveau)
  audio/      ui-sfx.ts (nouveau) ; audio-engine.ts, game-audio.ts, music.ts (modifiés)
  sim/        shatter.ts                                                     (modifié)
  rooms/      types.ts, registry.ts                                          (modifiés : vignettes)
scripts/      build-fonts.sh                                                 (nouveau)
public/fonts/ 5 woff2 + LICENSES.txt                                         (produits par build-fonts.sh)
tests/        shard-replay-gap, weapon-shapes, quality, settings, device, menu-demo, credits (nouveaux) ;
              enemy-geometry, music-loop (modifiés)
index.html    (modifié : couche #screens, polices préchargées)
```

Chaque fichier a une seule responsabilité :
- `weapon-shapes.ts` : les formes et les gestes, en calcul pur ; `view-model.ts` : leur géométrie et l'arme en main ;
- `quality.ts` : quand baisser la résolution et quand sauter une image ; `create-renderer.ts` applique ;
- `settings.ts` : les paramètres et le drapeau de la cinématique, lus et écrits sans jamais échouer ;
- `menu-demo.ts` : la démo et la caméra du menu, en calcul pur ; `engine.ts` les dessine ;
- `ui/*` : un écran par fichier, `tokens.css` pour le design system, `screens.css` pour la mise en page des écrans.

## Prototype vérifié

Tout le code de ce plan a été exécuté avant d'être écrit ici (2026-09-29), sur une copie du dépôt au commit `9a85275` (`main`, code identique à la fin du plan 2).
- **Rejeu par tâche dans un dossier vide :** les tests de chaque tâche échouent avant son code et passent après ; `tsc` passe à chaque étape ; les diffs de ce plan s'appliquent dans l'ordre et redonnent exactement l'arbre du prototype. Suite : 164 → 167 → 167 → 175 → 184 → 189 → 189 → 192 → 199 → 201 → 201 → 203 tests verts. Build final : point d'entrée 35 Ko (12,5 Ko gzip), moteur 990 Ko (275 Ko gzip), CSS 13 Ko.
- **Éclats :** écart jeu / replay de 10 cm (allée) et 2,7 m (passerelle) avant, 5 mm au plus après, sans sous-pas ni coût de calcul en plus.
- **Chrome (WebGPU) :** orange vif dans l'ombre avec facettes lisibles ; hanches sans marche ; pistolet, main et poing lisibles ; chargeur (invite à 1,26 s, serveur local) ; écran mobile sans moteur ; menu à 60 images par seconde et 41 appels de dessin ; panneaux Paramètres, Crédits (texte exact), Salles ; pause et victoire ; cinématique (vidéo de test locale) jouée à la première visite, passée par une touche, rejouée par le bouton Intro. Le verrou de souris a été refusé (fenêtre pilotée sans le focus) : les parties jouées pour de vrai sont à la tâche 12.
- **Polices :** `scripts/build-fonts.sh` redonne les mêmes octets à chaque lancement (SHA-1 dans la tâche 6). Le `‧` n'existe dans aucune des trois polices : il vient d'une police système (vérifié à l'écran, il se lit comme un point médian discret).

**Comment appliquer ce plan :**
- Un fichier **nouveau** est donné en entier : le recopier tel quel.
- Un fichier **modifié** est donné en diff unifié, produit par `git diff` sur le prototype. L'appliquer à la main (Edit), ou l'enregistrer dans un fichier puis `git apply <fichier>` depuis la racine. Les numéros de ligne supposent que les tâches précédentes sont faites.
- Les polices (`public/fonts/`) ne se recopient pas : elles sont produites par le script de la tâche 6.

## Décisions prises en écrivant ce plan

Chacune est réversible ; Romain les relit à la tâche 12.
1. **Orange dans l'ombre (report 22) : une rampe de couleur sur les pixels de menace**, dans le post-traitement : la luminance du pixel choisit sa teinte entre la braise `#8F2B14`, `threat` et `threat-hot`. Une facette dans l'ombre reste un orange profond et vif, les facettes gardent leur contraste. Battu : un émissif plus fort, qui aplatit le cristal (Romain l'avait trouvé « mannequin »).
2. **Écart jeu / replay (report 26) : chute exacte et contact au sol exact** dans `ShatterSystem`. Battu : des sous-pas de 1/480 s, aussi justes mais huit fois plus chers au pire moment.
3. **Qualité (report 25) : auto = 60 images par seconde au plus et résolution adaptative (spec 9.2) ; haute = sans limite ; basse = 60 et résolution 0,7.** La limite vient de l'essai de Romain (Mac qui chauffe à 120 en Retina). Battu : limite seulement en basse (le réglage par défaut aurait continué à chauffer).
4. **Le chargeur n'attend que les polices, la boucle du menu et le début de la cinématique** (spec 4.1). Les musiques du jeu se décodent derrière : mesuré de 0,1 à 1,5 s par morceau, elles retardaient l'invite jusqu'à 6 s. Une musique demandée avant la fin de son décodage démarre dès qu'elle est prête.
5. **Le moteur se charge une fois l'invite affichée**, pendant que le joueur la lit. Chargé plus tôt, son initialisation disputait le fil principal au chargeur.
6. **Fond du menu : une démo fabriquée au démarrage par la simulation** (recommandation de la revue du plan 2 : un `ReplayPlayer` nourri par une démo), sans fichier : elle ne peut pas se désynchroniser du format du replay. La fenêtre va de 1,15 à 2,04 s de simulation, soit 30 s réelles à 3 % : l'ennemi de la passerelle éclate, deux baies explosent, les renforts sortent, les ennemis visent et tirent. Le joueur serait touché à 2,08 s : on coupe avant, puis fondu au vide et boucle.
7. **Cadres Encre en « 9-slice » (`border-image` SVG)** au lieu de `clip-path` : avec `clip-path`, le trait d'encre disparaissait sur la diagonale des coins coupés (défaut présent dans la maquette). L'ombre décalée passe par `drop-shadow`, qui suit les coins.
8. **Crédits provisoires :** 118 795 538 tokens et 50,31 $ (mesure du brief du 29 septembre à 13 h 35) et `XXXXXX` pour le dépôt. Le plan 3c remplace les trois valeurs.
9. **Une seule salle jouable dans le moteur.** Le panneau Salles lit le registre (la salle 2 s'affiche « Bientôt »), mais le moteur est construit pour la salle 1. Rendre la salle 2 jouable demandera à `enterRoom` de reconstruire la salle : hors chantier (spec 1).
10. **Menu :** entrée « Intro » ajoutée à la tâche 11 avec la cinématique (sinon ce serait un bouton sans effet). Raccourcis : flèches et Entrée dans le menu, Échap ferme un panneau, R, Espace et M dans les panneaux de la salle.

---

### Task 1 : les éclats tombent au même endroit en jeu et au replay (reports 26)

Le jeu fait avancer les éclats par tout petits pas au ralenti (1/60 × 0,03 s), le replay par pas d'une image (1/60 s). L'intégration semi-implicite dépendait du pas : jusqu'à 2,7 m d'écart sur la passerelle (un éclat qui tombe ou non). Chute exacte (parabole) et instant de contact au sol calculé : le résultat ne dépend plus du pas. Même tâche : un éclat né dans le bas d'une boîte posée au sol n'est plus poussé dessous (plan 2, M3).

**Files :**
- Create : `tests/shard-replay-gap.test.ts`
- Modify : `src/sim/shatter.ts`

**Interfaces :**
- Consumes : `ShatterSystem.step(dt, boxes, enabled)`, `spawnBody`, `SHATTER` (plan 2).
- Produces : rien de nouveau ; même signature, résultat indépendant du pas.

- [ ] **Step 1 : écrire les tests**

`tests/shard-replay-gap.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { room01 } from "../src/rooms/room-01-datacenter";
import { aabb } from "../src/sim/geometry";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { vec3 } from "../src/sim/vec3";

// Le jeu fait avancer les éclats par petits pas (temps ralenti : 1/60 × 0,03 s de simulation par image),
// le replay par pas d'une image (1/60 s). Les deux doivent poser les éclats au même endroit.
const SLOW_STEP = (1 / 60) * 0.03;
const REPLAY_STEP = 1 / 60;

// Écarts (m) entre les éclats de deux systèmes identiques, avancés de `seconds` avec deux pas différents.
function restGaps(spawn: (s: ShatterSystem) => void, seconds: number): number[] {
  const slow = new ShatterSystem();
  const fast = new ShatterSystem();
  spawn(slow);
  spawn(fast);
  const enabled = room01.boxes.map(() => true);
  for (let t = 0; t < seconds; t += SLOW_STEP) slow.step(SLOW_STEP, room01.boxes, enabled);
  for (let t = 0; t < seconds; t += REPLAY_STEP) fast.step(REPLAY_STEP, room01.boxes, enabled);
  const gaps: number[] = [];
  for (let i = 0; i < slow.shards.length; i++) {
    const a = slow.shards[i]!;
    const b = fast.shards[i]!;
    if (!a.active) continue;
    gaps.push(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z));
  }
  return gaps.sort((x, y) => x - y);
}

describe("éclats : même trajet au ralenti et au replay (plan 3, entrée 26)", () => {
  // Mesuré avant correctif (2026-09-29) : 95 % des éclats à moins de 10 cm en allée, de 2,7 m sur la passerelle
  // (un éclat qui tombe ou non de la passerelle). Après : 5 mm au plus.
  test("un ennemi éclaté en pleine allée : chaque éclat se pose à moins de 1 cm de sa place au replay", () => {
    const gaps = restGaps((s) => s.spawnBody(vec3(0, 0, -2), 1.8, 0.3, vec3(0, 0, -45), 1234, 0), 4);
    expect(gaps.length).toBe(SHATTER.shardsPerBody);
    expect(gaps[gaps.length - 1]!).toBeLessThan(0.01);
  });

  test("un ennemi éclaté sur la passerelle : chaque éclat se pose à moins de 1 cm de sa place au replay", () => {
    const gaps = restGaps((s) => s.spawnBody(vec3(-11, 3.5, -2), 1.8, 0.3, vec3(45, 0, 0), 99, 0), 4);
    expect(gaps.length).toBe(SHATTER.shardsPerBody);
    expect(gaps[gaps.length - 1]!).toBeLessThan(0.01);
  });
});

describe("éclats : jamais sous le sol (plan 3, entrée 26)", () => {
  test("un éclat né dans le bas d'une boîte posée au sol en sort par une face, jamais par-dessous", () => {
    // Boîte large et basse : pour un éclat près du sol, la face la plus proche est celle du dessous.
    const slab = aabb(-2, 0, -2, 2, 1, 2);
    const shatter = new ShatterSystem();
    const s = shatter.shards[0]!;
    s.active = true;
    s.resting = false;
    s.bounced = false;
    s.size = 0.1;
    s.pos.x = 0;
    s.pos.y = 0.02;
    s.pos.z = 0;
    s.vel.x = 0;
    s.vel.y = 0;
    s.vel.z = 0;
    for (let i = 0; i < 600; i++) shatter.step(1 / 60, [slab], [true]);
    expect(s.pos.y).toBeGreaterThanOrEqual(0.05 - 1e-9);
    const inside = s.pos.x > -2 && s.pos.x < 2 && s.pos.y < 1 && s.pos.z > -2 && s.pos.z < 2;
    expect(inside).toBe(false);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/shard-replay-gap.test.ts`
Expected : 3 échecs (écarts d'environ 0,10 m et 2,7 m ; éclat resté dans la boîte).

- [ ] **Step 3 : écrire le code**

```diff
diff --git a/src/sim/shatter.ts b/src/sim/shatter.ts
index fd37410..c4e1b16 100644
--- a/src/sim/shatter.ts
+++ b/src/sim/shatter.ts
@@ -101,12 +101,16 @@ export class ShatterSystem {
     for (const s of this.shards) {
       if (!s.active || s.resting) continue;
       const r = s.size * 0.5;
-      s.vel.y -= SHATTER.gravity * dt;
+      // Chute exacte (parabole) : la position d'arrivée ne dépend pas de la taille du pas, donc le jeu (petits pas
+      // au ralenti) et le replay (un pas par image) posent les éclats au même endroit.
+      const vy0 = s.vel.y;
+      // Durée parcourue dans ce pas : tout le pas, ou jusqu'au sol s'il est touché en route. Le sol borne ainsi le
+      // trajet avant le balayage (sur un grand pas, la fin du pas passait sous le bas des baies posées au sol).
+      const floorHit = s.pos.y + vy0 * dt - 0.5 * SHATTER.gravity * dt * dt < r;
+      const span = floorHit ? floorContactTime(s.pos.y - r, vy0, dt) : dt;
+      const y = floorHit ? r : s.pos.y + vy0 * dt - 0.5 * SHATTER.gravity * dt * dt;
+      set(next, s.pos.x + s.vel.x * span, y, s.pos.z + s.vel.z * span);
       s.angle += s.angVel * dt;
-      set(next, s.pos.x + s.vel.x * dt, s.pos.y + s.vel.y * dt, s.pos.z + s.vel.z * dt);
-      // Le sol borne le trajet avant le balayage : sur un grand pas (à-coup d'image au replay), la fin du pas
-      // passait sous le sol, donc sous le bas des boîtes posées au sol, et l'éclat se figeait dans une baie.
-      if (next.y < r) next.y = r;
 
       // Premier contact du trajet avec une boîte active (balayage : rien ne traverse un mur mince).
       let bestT = 2;
@@ -134,28 +138,30 @@ export class ShatterSystem {
 
       if (embedded >= 0) {
         // Sorti de force par la face la plus proche : il ne reste jamais dans une boîte.
+        s.vel.y = vy0 - SHATTER.gravity * dt;
         pushOut(s, boxes[embedded]!, r);
         continue;
       }
       if (bestBox < 0) {
         set(s.pos, next.x, next.y, next.z);
+        // Vitesse à l'instant du contact avec le sol (ou en fin de pas) : le rebond ne dépend pas du pas.
+        s.vel.y = vy0 - SHATTER.gravity * span;
       } else if (bestAxis === 1 && bestSign > 0) {
         // Arrivée par le dessus (passerelle, haut d'une baie) : même règle que le sol, à la hauteur de la boîte.
         lerp(s.pos, s.pos, next, bestT);
         s.pos.y = boxes[bestBox]!.max.y + r;
+        s.vel.y = vy0 - SHATTER.gravity * span * bestT;
         land(s);
         continue;
       } else {
         // Face latérale ou dessous : un peu avant le contact, puis la vitesse sur cet axe se renverse, amortie.
         lerp(s.pos, s.pos, next, Math.max(0, bestT - SHATTER.contactBackoff));
+        s.vel.y = vy0 - SHATTER.gravity * span * bestT;
         reflect(s, bestAxis);
         continue;
       }
-      // Sol.
-      if (s.pos.y <= r && s.vel.y < 0) {
-        s.pos.y = r;
-        land(s);
-      }
+      // Sol : touché pendant ce pas (décidé une fois, avant le balayage, sans comparer des flottants arrondis).
+      if (floorHit && s.vel.y <= 0) land(s);
     }
   }
 
@@ -209,6 +215,14 @@ function cappedImpact(impactVel: Vec3): void {
   set(shareVel, shareVel.x * k, shareVel.y * k, shareVel.z * k);
 }
 
+// Instant (s, dans [0, dt]) où un éclat à `height` au-dessus de sa position de repos, de vitesse verticale `vy`,
+// touche le sol en chute libre : racine positive de height + vy·t − g·t²/2 = 0.
+function floorContactTime(height: number, vy: number, dt: number): number {
+  if (height <= 0) return 0;
+  const t = (vy + Math.sqrt(vy * vy + 2 * SHATTER.gravity * height)) / SHATTER.gravity;
+  return Math.min(dt, t);
+}
+
 // Vrai si le centre d'un éclat de rayon `r` est strictement dans la boîte gonflée de `r` (en surface : faux).
 function isStrictlyInside(p: Vec3, box: Aabb, r: number): boolean {
   return (
@@ -250,7 +264,8 @@ function pushOut(s: Shard, box: Aabb, r: number): void {
   const p = s.pos;
   const left = p.x - (box.min.x - r);
   const right = box.max.x + r - p.x;
-  const below = p.y - (box.min.y - r);
+  // Une boîte posée au sol n'a pas de sortie par-dessous : elle mènerait sous le sol (latent en salle 1, plan 2 M3).
+  const below = box.min.y - r >= r ? p.y - (box.min.y - r) : Number.POSITIVE_INFINITY;
   const above = box.max.y + r - p.y;
   const back = p.z - (box.min.z - r);
   const front = box.max.z + r - p.z;
```

- [ ] **Step 4 : tests et types**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t1-tests.log && RTK_DISABLED=1 bun run typecheck`
Expected : `167 pass`, `0 fail` ; `tsc` sans sortie. Les tests d'éclats du plan 2 (`shard-collision`, `shatter-nav`) passent sans changement.

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add tests/shard-replay-gap.test.ts src/sim/shatter.ts && git commit -m "fix(sim): exact shard fall and floor contact, same rest in game and replay; no push-out under the floor"
```

---

### Task 2 : l'orange reste vif dans l'ombre (report 22)

Une facette d'ennemi dans l'ombre donnait un brun (orange × peu de lumière). Le post-traitement remplace la teinte des seuls pixels de menace (masque `glow`) par une rampe : la luminance du pixel choisit sa place entre la braise, `threat` et `threat-hot`. Les pixels purs (balles `threat-hot`, traînées `threat`) retombent sur eux-mêmes.

**Files :**
- Modify : `src/render/post.ts`

**Interfaces :**
- Produces : `POST.threatShadow` (`0x8f2b14`), `POST.threatShadowStart` (0,3).

- [ ] **Step 1 : écrire le code**

```diff
diff --git a/src/render/post.ts b/src/render/post.ts
index ec4363f..b61371a 100644
--- a/src/render/post.ts
+++ b/src/render/post.ts
@@ -44,12 +44,29 @@ export const POST = {
   bloomOnThreat: 0.3,
   // Décalage des canaux rouge et bleu à la mort, en fraction de l'écran au bord.
   aberration: 0.012,
+  // Rampe de la menace : sa luminance choisit une teinte entre la braise (ombre), `threat` et `threat-hot`
+  // (lumière). Une facette dans l'ombre reste un orange profond et vif au lieu de brunir (plan 2, report 22).
+  threatShadow: 0x8f2b14,
+  // Part de la luminance de `threat` sous laquelle un pixel prend la braise pure : en dessous, tout est braise.
+  threatShadowStart: 0.3,
 } as const;
 
 // Masque de glow : seuls les matériaux de menace l'écrivent. La menace ne reçoit pas de contour encre :
 // son halo la détoure, et un trait fin (visée, traînée) serait noirci par le détecteur.
 export const GLOW_MRT = mrt({ glow: float(1) });
 
+const LUMA = vec3(0.2126, 0.7152, 0.0722);
+
+function linearColor(hex: number) {
+  const c = new THREE.Color(hex);
+  return vec3(c.r, c.g, c.b);
+}
+
+function lumaOf(hex: number): number {
+  const c = new THREE.Color(hex);
+  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
+}
+
 export class PostPipeline {
   private readonly pipeline: THREE.RenderPipeline;
   // 0 en jeu, 1 à la mort.
@@ -104,7 +121,20 @@ export class PostPipeline {
       colorTex.sample(screenUV).g,
       colorTex.sample(screenUV.sub(shift)).b,
     );
-    const inked = mix(color, tslColor(PALETTE.ink), edge);
+    // Rampe de la menace : même luminance, teinte toujours saturée. La luminance du pixel choisit sa place
+    // entre la braise, `threat` et `threat-hot` (espace linéaire : THREE.Color convertit depuis sRGB).
+    const luma = dot(color, LUMA);
+    const shadow = linearColor(POST.threatShadow);
+    const mid = linearColor(PALETTE.threat);
+    const hot = linearColor(PALETTE.threatHot);
+    const midLuma = lumaOf(PALETTE.threat);
+    const hotLuma = lumaOf(PALETTE.threatHot);
+    // Sous la luminance de `threat` : de la braise à `threat`. La facette la plus sombre reste braise, jamais brune.
+    const low = mix(shadow, mid, luma.sub(midLuma * POST.threatShadowStart).div(midLuma * (1 - POST.threatShadowStart)).clamp());
+    const high = mix(mid, hot, luma.sub(midLuma).div(hotLuma - midLuma).clamp());
+    const threatMask = glowTex.sample(screenUV).x;
+    const toned = mix(color, luma.lessThan(midLuma).select(low, high), threatMask);
+    const inked = mix(toned, tslColor(PALETTE.ink), edge);
     const glow = bloom(colorTex.mul(glowTex.x), POST.bloomStrength, POST.bloomRadius, POST.bloomThreshold);
     // Le halo garde toute sa force autour de la menace, mais n'est ajouté qu'en partie sur la menace elle-même :
     // ajouté en entier, ce flou uniforme remontait les facettes sombres et aplatissait le cristal (spec 6.2).
```

- [ ] **Step 2 : types et build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t2-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `167 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 3 : vérifier dans Chrome**

Lancer `cd <racine> && bun run dev --port 5299 --strictPort` en arrière-plan. Ouvrir `http://localhost:5299/?debug`. À ce stade, la page s'ouvre encore directement sur la salle. Placer la caméra devant un ennemi :

```js
const a = window.agenthot; const g = a.game;
a.advance(0.5);
const e = g.enemies[0];
g.player.pos.x = e.pos.x + 0.3; g.player.pos.z = e.pos.z + 1.4; g.player.yaw = 0.2; g.player.pitch = -0.35;
a.advance(0.02);
```

Capture (zoom sur l'ennemi, pas une capture réduite : la compression JPEG brunit l'orange), enregistrée dans `.superpowers/plan-3a-captures/t2-orange.png`. **Attendu :** corps orange vif, facettes sombres en rouge braise (pas brunes), facettes claires vers l'orange chaud ; halo inchangé.

- [ ] **Step 4 : commit**

```bash
cd <racine> && git add src/render/post.ts && git commit -m "feat(render): threat colour ramp keeps shadowed facets a vivid ember instead of brown"
```

---

### Task 3 : hanches, pistolet et mains faits en code (reports 23 et 24)

Trois défauts vus de près : une marche entre le bassin et les cuisses, une arme qui est une boîte, pas de mains. Le bassin descend (entrejambe) et le haut de la cuisse devient une rotule rentrée dedans. Le pistolet est un profil de côté extrudé aux arêtes chanfreinées ; la main droite l'enserre (trois doigts enroulés, index le long du pontet, pouce sur la carcasse), avec l'avant-bras ; mains vides, un poing. Au tir, l'arme recule et se relève ; un coup de poing part vers l'avant. Les deux gestes suivent le temps de simulation : au ralenti, ils se voient au ralenti.

Le liseré clair (fresnel) des matériaux `ink` passe de la puissance 3 à 5 : sur des faces planes, la puissance 3 éclairait des faces entières et le pistolet virait au gris.

**Files :**
- Create : `src/render/weapon-shapes.ts`, `src/render/view-model.ts`, `tests/weapon-shapes.test.ts`
- Modify : `src/render/enemy-geometry.ts`, `tests/enemy-geometry.test.ts`, `src/render/materials.ts`, `src/render/world-renderer.ts`, `src/app/main.ts`

**Interfaces :**
- Consumes : `WorldView.playerAmmo`, `WorldView.playerCooldown`, `PLAYER.fireCooldown`, événement `punch` (plan 1) ; `inkMaterial()`.
- Produces :
  - `weapon-shapes.ts` : `PISTOL { width, bevel, outline, guardHole }`, `type Part` (pavé chanfreiné ou membre), `GRIP_HAND`, `FIST`, `shapeBounds(parts): Bounds`, `VIEW_MODEL`, `interface ViewModelOffset { back; lift }`, `kickOffset(cooldown, fullCooldown, out)`, `jabOffset(age)` ;
  - `view-model.ts` : `shapeGeometry(parts)`, `pistolGeometry()`, `class ViewModel { group; punch(); update(view, dtSim) }` ;
  - `WorldRenderer.viewModel: ViewModel` et `WorldRenderer.update(view, dtSim = 0)`.

- [ ] **Step 1 : écrire les tests**

`tests/weapon-shapes.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { PLAYER } from "../src/sim/entities";
import {
  FIST,
  GRIP_HAND,
  PISTOL,
  VIEW_MODEL,
  type ViewModelOffset,
  jabOffset,
  kickOffset,
  shapeBounds,
} from "../src/render/weapon-shapes";

// Point dans un polygone (règle pair-impair).
function inside(poly: readonly (readonly [number, number])[], u: number, v: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i]!;
    const [uj, vj] = poly[j]!;
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) hit = !hit;
  }
  return hit;
}

describe("pistolet et mains en code (plan 3, report 24)", () => {
  test("le pistolet pointe vers l'avant : la bouche du canon est son point le plus en avant, à hauteur de la culasse", () => {
    const front = Math.max(...PISTOL.outline.map(([u]) => u));
    const muzzle = PISTOL.outline.filter(([u]) => u === front);
    expect(muzzle.length).toBeGreaterThan(1);
    // La bouche est en haut du profil, pas au bout de la crosse.
    for (const [, v] of muzzle) expect(v).toBeGreaterThan(0.05);
  });

  test("l'origine est dans la crosse, hors du pontet : posée dans une main (ennemi, joueur), l'arme y est tenue par la crosse", () => {
    expect(inside(PISTOL.outline, 0, 0)).toBe(true);
    expect(inside(PISTOL.guardHole, 0, 0)).toBe(false);
    // Le pontet est bien percé dans le profil.
    for (const [u, v] of PISTOL.guardHole) expect(inside(PISTOL.outline, u, v)).toBe(true);
  });

  test("la main serre la crosse sans jamais passer devant la bouche du canon", () => {
    const muzzleZ = -Math.max(...PISTOL.outline.map(([u]) => u));
    const hand = shapeBounds(GRIP_HAND);
    expect(hand.min[2]).toBeGreaterThan(muzzleZ);
    // Elle enveloppe l'origine (la crosse) et l'avant-bras part vers l'arrière et vers le bas (bas de l'écran).
    for (let k = 0; k < 3; k++) {
      expect(hand.min[k]).toBeLessThan(0);
      expect(hand.max[k]).toBeGreaterThan(0);
    }
    expect(hand.max[2]).toBeGreaterThan(0.2);
    expect(hand.min[1]).toBeLessThan(-0.15);
  });

  test("le poing a ses doigts devant (vers −Z) et son avant-bras derrière", () => {
    const fist = shapeBounds(FIST);
    expect(fist.min[2]).toBeLessThan(-0.03);
    expect(fist.max[2]).toBeGreaterThan(0.2);
  });
});

describe("gestes de l'arme en main (plan 3, report 24)", () => {
  const full = PLAYER.fireCooldown;
  const out: ViewModelOffset = { back: 0, lift: 0 };

  test("au tir, l'arme recule et se relève d'un coup, puis revient en 0,15 s de simulation", () => {
    kickOffset(full, full, out);
    expect(out.back).toBeCloseTo(VIEW_MODEL.kickBack, 9);
    expect(out.lift).toBeCloseTo(VIEW_MODEL.kickLift, 9);
    let previous = out.back;
    for (let t = 0.01; t < VIEW_MODEL.kickTime; t += 0.01) {
      kickOffset(full - t, full, out);
      expect(out.back).toBeLessThan(previous);
      previous = out.back;
    }
    kickOffset(full - VIEW_MODEL.kickTime, full, out);
    expect(out.back).toBeCloseTo(0, 9);
    expect(out.lift).toBeCloseTo(0, 9);
  });

  test("sans tir en cours (recharge finie, ou pas encore tiré), l'arme reste au repos", () => {
    kickOffset(0, full, out);
    expect(out.back).toBe(0);
    expect(out.lift).toBe(0);
  });

  test("le coup de poing part vite, atteint sa portée au tiers du geste, et revient à zéro", () => {
    expect(jabOffset(0)).toBe(0);
    expect(jabOffset(VIEW_MODEL.jabTime / 3)).toBeCloseTo(VIEW_MODEL.jabReach, 9);
    expect(jabOffset(VIEW_MODEL.jabTime)).toBe(0);
    expect(jabOffset(Number.POSITIVE_INFINITY)).toBe(0);
    // Aller plus rapide que le retour.
    expect(jabOffset(VIEW_MODEL.jabTime / 6)).toBeGreaterThan(jabOffset((VIEW_MODEL.jabTime * 5) / 6));
  });
});
```

```diff
diff --git a/tests/enemy-geometry.test.ts b/tests/enemy-geometry.test.ts
index 47829f0..1260eee 100644
--- a/tests/enemy-geometry.test.ts
+++ b/tests/enemy-geometry.test.ts
@@ -15,15 +15,16 @@ interface ExpectedBox {
 const EXPECTED: Record<number, ExpectedBox> = {
   // La tête ne dépasse pas sa taille en largeur ; le cou descend dans les trapèzes.
   [SEGMENT.head]: { halfX: BODY.headSize / 2, front: 0.13, back: 0.13, below: 0.08, above: 0.03 },
-  // Le torse ne dépasse pas l'axe des bras ; le bassin couvre le haut des cuisses.
-  [SEGMENT.torso]: { halfX: BODY.shoulderX, front: 0.15, back: 0.14, below: 0.08, above: 0.06 },
+  // Le torse ne dépasse pas l'axe des bras ; le bassin couvre le haut des cuisses, entrejambe compris.
+  [SEGMENT.torso]: { halfX: BODY.shoulderX, front: 0.15, back: 0.14, below: 0.13, above: 0.06 },
   [SEGMENT.upperArmL]: { halfX: 0.08, front: 0.08, back: 0.08, below: 0.04, above: 0.06 },
   [SEGMENT.upperArmR]: { halfX: 0.08, front: 0.08, back: 0.08, below: 0.04, above: 0.06 },
   [SEGMENT.forearmL]: { halfX: 0.06, front: 0.06, back: 0.06, below: 0.08, above: 0.04 },
   [SEGMENT.forearmR]: { halfX: 0.06, front: 0.06, back: 0.06, below: 0.08, above: 0.04 },
   // Une cuisse ne passe pas l'axe du corps ; le pied part vers l'avant ; la semelle est au bout exact de la jambe.
-  [SEGMENT.legL]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.06 },
-  [SEGMENT.legR]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.06 },
+  // La rotule de hanche remonte dans le bassin.
+  [SEGMENT.legL]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.09 },
+  [SEGMENT.legR]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.09 },
 };
 
 interface Bounds {
@@ -87,6 +88,15 @@ describe("corps des ennemis façon cristal (tâche 9, spec 5.6 et 6.2)", () => {
     }
   });
 
+  test("la hanche ne se voit pas de près : le bassin descend 10 cm sous l'articulation, la cuisse remonte 7 cm dedans", () => {
+    // Avant le plan 3 : 6 cm et 2,5 cm ; de près, une marche nette séparait le bassin des jambes (report 23).
+    const hip = -BODY.torsoLength / 2;
+    expect(bounds(segmentMesh(SEGMENT.torso).positions).minY).toBeLessThanOrEqual(hip - 0.1);
+    for (const leg of [SEGMENT.legL, SEGMENT.legR]) {
+      expect(bounds(segmentMesh(leg).positions).maxY).toBeGreaterThanOrEqual(BODY.legLength / 2 + 0.07);
+    }
+  });
+
   test("la semelle est plate, au bout exact de la jambe : debout, les pieds touchent le sol sans s'y enfoncer", () => {
     for (const leg of [SEGMENT.legL, SEGMENT.legR]) {
       const { positions } = segmentMesh(leg);
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/weapon-shapes.test.ts tests/enemy-geometry.test.ts`
Expected : `weapon-shapes` ne trouve pas son module ; `enemy-geometry` échoue sur « la hanche ne se voit pas de près » (6 cm et 2,5 cm aujourd'hui).

- [ ] **Step 3 : écrire les formes et l'arme en main**

`src/render/weapon-shapes.ts` :

```ts
// Pistolet et mains, faits en code (spec 6.2 : noir mat `ink`, liseré clair). Calcul pur, sans Three.js.
// Repère d'une forme : origine au centre de la crosse (là où la main serre), −Z vers l'avant (bouche du canon),
// +Y vers le haut, +X à droite du tireur. Ainsi, poser l'origine dans la main d'un ennemi y met la crosse.

// Pistolet : profil de côté (u vers l'avant, soit −Z ; v vers le haut ; en m ; crosse centrée sur u = 0 à v = 0),
// extrudé sur `width` avec des arêtes chanfreinées. Le profil fait le tour dans le sens trigonométrique ;
// le trou est l'ouverture du pontet.
export const PISTOL = {
  width: 0.026,
  bevel: 0.004,
  outline: [
    [-0.02, 0.09], // arrière de la culasse
    [-0.026, 0.066],
    [-0.014, 0.05], // queue de castor
    [-0.038, -0.052], // dos de la crosse
    [-0.036, -0.066], // talon du chargeur
    [0.01, -0.066],
    [0.012, -0.052],
    [0.032, 0.024], // devant de la crosse
    [0.038, 0.012], // pontet, dessous
    [0.088, 0.014],
    [0.098, 0.038], // pontet, avant
    [0.16, 0.04], // carcasse sous le canon
    [0.16, 0.056],
    [0.178, 0.058], // bouche du canon
    [0.178, 0.088],
    [0.17, 0.092], // dessus de la culasse
    [-0.01, 0.092],
  ] as readonly (readonly [number, number])[],
  guardHole: [
    [0.046, 0.022],
    [0.082, 0.022],
    [0.088, 0.034],
    [0.048, 0.034],
  ] as readonly (readonly [number, number])[],
} as const;

// Un pavé chanfreiné, ou un membre (prisme effilé le long de son axe Y) : taille ou rayons, centre, et
// inclinaison autour de l'axe X (radians ; négatif = le haut part vers l'avant).
export type Part =
  | { kind: "box"; size: readonly [number, number, number]; pos: readonly [number, number, number]; tilt?: number }
  | {
      kind: "limb";
      radiusTop: number;
      radiusBottom: number;
      length: number;
      pos: readonly [number, number, number];
      tilt?: number;
      // Rotation autour de Z, appliquée avant l'inclinaison : π/2 couche le membre en travers.
      roll?: number;
    };

// Inclinaison de la crosse : le haut vers l'avant, comme le profil du pistolet.
const GRIP_RAKE = -0.22;
// Avant-bras : son axe monte vers l'avant, du coude au poignet (0,45 vers le haut pour 0,89 vers l'avant).
const FOREARM_TILT = -1.1;
// Membre couché vers l'avant (axe Y tourné vers −Z) ou en travers (axe Y tourné vers X).
const FORWARD = -Math.PI / 2;
const HALF_TURN = Math.PI / 2;

// Main droite refermée sur la crosse, avec l'avant-bras (vue à la première personne).
export const GRIP_HAND: readonly Part[] = [
  // Trois doigts enroulés devant la crosse, en travers (axe X), du majeur à l'auriculaire.
  { kind: "limb", radiusTop: 0.0115, radiusBottom: 0.0115, length: 0.056, pos: [0.004, 0, -0.035], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.011, radiusBottom: 0.011, length: 0.054, pos: [0.004, -0.023, -0.03], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.0095, length: 0.05, pos: [0.004, -0.045, -0.025], roll: HALF_TURN },
  // Index tendu le long du pontet, côté droit ; pouce le long de la carcasse, côté gauche.
  { kind: "limb", radiusTop: 0.0085, radiusBottom: 0.0095, length: 0.055, pos: [0.018, 0.03, -0.05], tilt: FORWARD },
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.011, length: 0.05, pos: [-0.019, 0.045, -0.03], tilt: FORWARD },
  { kind: "box", size: [0.022, 0.075, 0.062], pos: [0.024, -0.014, -0.004], tilt: GRIP_RAKE }, // dos de la main, à droite
  // Talon de la paume, à gauche et en arrière : de ce côté (celui que voit le joueur), on lit les bouts des doigts.
  { kind: "box", size: [0.016, 0.05, 0.03], pos: [-0.019, -0.03, 0.02], tilt: GRIP_RAKE },
  // Avant-bras : du poignet, derrière le bas de la crosse, vers le coude, en bas de l'écran (haut du prisme au poignet).
  { kind: "limb", radiusTop: 0.025, radiusBottom: 0.031, length: 0.22, pos: [0.012, -0.1, 0.13], tilt: FOREARM_TILT },
];

// Poing fermé, mains vides : origine au creux du poing, avec l'avant-bras.
export const FIST: readonly Part[] = [
  // Quatre doigts repliés, en travers, de l'index (en haut) à l'auriculaire.
  { kind: "limb", radiusTop: 0.012, radiusBottom: 0.012, length: 0.05, pos: [0.004, 0.024, -0.026], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0125, radiusBottom: 0.0125, length: 0.052, pos: [0.004, 0.002, -0.028], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.012, radiusBottom: 0.012, length: 0.05, pos: [0.004, -0.02, -0.026], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0105, radiusBottom: 0.0105, length: 0.046, pos: [0.004, -0.04, -0.022], roll: HALF_TURN },
  { kind: "box", size: [0.056, 0.078, 0.05], pos: [0.004, -0.006, 0.006] }, // paume et dos de la main
  // Pouce replié devant les doigts du milieu, côté gauche (celui que voit le joueur).
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.011, length: 0.036, pos: [-0.016, -0.004, -0.044], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.025, radiusBottom: 0.031, length: 0.22, pos: [0.004, -0.09, 0.12], tilt: FOREARM_TILT },
];

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

// Boîte englobante d'une forme (un membre compte pour le pavé qui l'enveloppe), inclinaisons comprises.
export function shapeBounds(parts: readonly Part[]): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    const r = part.kind === "limb" ? Math.max(part.radiusTop, part.radiusBottom) : 0;
    // Membre couché en travers (roulis) : son enveloppe s'allonge sur X au lieu de Y.
    const across = part.kind === "limb" && Math.abs(part.roll ?? 0) > Math.PI / 4;
    const size =
      part.kind === "box"
        ? part.size
        : across
          ? ([part.length, 2 * r, 2 * r] as const)
          : ([2 * r, part.length, 2 * r] as const);
    const c = Math.cos(part.tilt ?? 0);
    const s = Math.sin(part.tilt ?? 0);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const x = (sx * size[0]) / 2;
          const y = (sy * size[1]) / 2;
          const z = (sz * size[2]) / 2;
          const p = [part.pos[0] + x, part.pos[1] + y * c - z * s, part.pos[2] + y * s + z * c];
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k]!, p[k]!);
            max[k] = Math.max(max[k]!, p[k]!);
          }
        }
      }
    }
  }
  return { min, max };
}

// Pose de l'arme en main à la première personne, décalage dans le repère de la caméra (m, rad).
export interface ViewModelOffset {
  // Recul vers l'arrière (+Z) et relevé du canon (rotation autour de X, > 0 = vers le haut).
  back: number;
  lift: number;
}

export const VIEW_MODEL = {
  // Recul au tir : l'arme part de `kickBack` m en arrière et se relève de `kickLift` rad, puis revient
  // pendant les `kickTime` premières secondes du temps de recharge (temps de simulation : au ralenti, le recul
  // se voit au ralenti).
  kickBack: 0.06,
  kickLift: 0.22,
  kickTime: 0.15,
  // Coup de poing : aller-retour de `jabReach` m en `jabTime` s de simulation.
  jabReach: 0.28,
  jabTime: 0.22,
} as const;

// Recul d'après le temps de recharge restant : `cooldown` part de `fullCooldown` au tir et descend vers 0.
export function kickOffset(cooldown: number, fullCooldown: number, out: ViewModelOffset): ViewModelOffset {
  const sinceShot = fullCooldown - cooldown;
  const k = cooldown > 0 && sinceShot < VIEW_MODEL.kickTime ? 1 - sinceShot / VIEW_MODEL.kickTime : 0;
  // Retour adouci : rapide au début, posé à la fin.
  const eased = k * k;
  out.back = VIEW_MODEL.kickBack * eased;
  out.lift = VIEW_MODEL.kickLift * eased;
  return out;
}

// Coup de poing d'après le temps écoulé depuis l'appui (s de simulation), 0 hors du coup.
export function jabOffset(age: number): number {
  if (age < 0 || age >= VIEW_MODEL.jabTime) return 0;
  // Aller vif, retour plus lent : sommet au tiers du coup.
  const t = age / VIEW_MODEL.jabTime;
  const shape = t < 1 / 3 ? t * 3 : 1 - (t - 1 / 3) * 1.5;
  return VIEW_MODEL.jabReach * Math.max(0, shape);
}
```

`src/render/view-model.ts` :

```ts
// Arme et mains à la première personne, et géométrie du pistolet (formes de weapon-shapes.ts).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three/webgpu";
import { PLAYER } from "../sim/entities";
import type { WorldView } from "../sim/view";
import { FIST, GRIP_HAND, PISTOL, type Part, type ViewModelOffset, jabOffset, kickOffset } from "./weapon-shapes";

// Part de la plus petite dimension d'un pavé prise par ses chanfreins : le liseré accroche les arêtes.
const CHAMFER = 0.18;
// Côtés d'un membre : assez pour qu'il paraisse rond, assez peu pour garder des facettes.
const LIMB_SIDES = 7;

// Pavé aux arêtes chanfreinées (extrusion d'un rectangle), centré sur l'origine.
function chamferedBox(x: number, y: number, z: number): THREE.BufferGeometry {
  const bevel = Math.min(x, y, z) * CHAMFER;
  const w = x / 2 - bevel;
  const h = y / 2 - bevel;
  const shape = new THREE.Shape([
    new THREE.Vector2(-w, -h),
    new THREE.Vector2(w, -h),
    new THREE.Vector2(w, h),
    new THREE.Vector2(-w, h),
  ]);
  const depth = z - 2 * bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  return geometry.translate(0, 0, -depth / 2);
}

// Pavés et membres d'une forme, fusionnés en une seule géométrie : un seul appel de dessin.
export function shapeGeometry(parts: readonly Part[]): THREE.BufferGeometry {
  const matrix = new THREE.Matrix4();
  const rollMatrix = new THREE.Matrix4();
  const pieces = parts.map((part) => {
    const piece =
      part.kind === "box"
        ? chamferedBox(part.size[0], part.size[1], part.size[2])
        : new THREE.CylinderGeometry(part.radiusTop, part.radiusBottom, part.length, LIMB_SIDES);
    const roll = part.kind === "limb" ? (part.roll ?? 0) : 0;
    matrix
      .makeRotationX(part.tilt ?? 0)
      .multiply(rollMatrix.makeRotationZ(roll))
      .setPosition(part.pos[0], part.pos[1], part.pos[2]);
    // Les extrusions portent des UV et des groupes que les cylindres n'ont pas : on ne garde que la forme.
    return stripToShape(piece.applyMatrix4(matrix));
  });
  return mergeGeometries(pieces);
}

// Pistolet : profil de côté extrudé, arêtes chanfreinées, tourné pour que le profil regarde vers −Z.
export function pistolGeometry(): THREE.BufferGeometry {
  const toVec = ([u, v]: readonly [number, number]) => new THREE.Vector2(u, v);
  const shape = new THREE.Shape(PISTOL.outline.map(toVec));
  shape.holes.push(new THREE.Path(PISTOL.guardHole.map(toVec)));
  const depth = PISTOL.width - 2 * PISTOL.bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: PISTOL.bevel,
    bevelSize: PISTOL.bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  // Profil dans le plan (u, v), épaisseur le long de z : centrée, puis u (l'avant) tourné vers −Z.
  geometry.translate(0, 0, -depth / 2).rotateY(Math.PI / 2);
  return stripToShape(geometry);
}

// Garde la position et la normale : toutes les pièces fusionnées ont alors les mêmes attributs.
function stripToShape(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", flat.getAttribute("position"));
  out.computeVertexNormals();
  return out;
}

// Place de la main droite dans le champ, repère de la caméra : à droite, sous l'axe de visée, le canon
// légèrement tourné vers le centre de l'écran.
const REST = { x: 0.16, y: -0.15, z: -0.42, yaw: 0.1 } as const;
// Le poing est tourné vers le centre : on voit ses doigts repliés, pas le dos de la main.
const FIST_REST = { x: 0.17, y: -0.16, z: -0.4, yaw: 0.7 } as const;

export class ViewModel {
  readonly group = new THREE.Group();
  private readonly armed: THREE.Mesh;
  private readonly fist: THREE.Mesh;
  // Temps de simulation écoulé depuis le dernier coup de poing (infini : pas de coup en cours).
  private punchAge = Number.POSITIVE_INFINITY;
  private readonly offset: ViewModelOffset = { back: 0, lift: 0 };

  constructor(material: THREE.Material) {
    this.armed = new THREE.Mesh(mergeGeometries([pistolGeometry(), shapeGeometry(GRIP_HAND)]), material);
    this.fist = new THREE.Mesh(shapeGeometry(FIST), material);
    this.group.add(this.armed, this.fist);
  }

  // Le joueur vient de frapper : le poing part.
  punch(): void {
    this.punchAge = 0;
  }

  // `dtSim` : temps de simulation de l'image (le recul et le coup ralentissent avec le temps).
  update(view: WorldView, dtSim: number): void {
    this.punchAge += dtSim;
    const armed = view.playerAmmo >= 0;
    this.armed.visible = armed;
    this.fist.visible = !armed;
    if (armed) {
      kickOffset(view.playerCooldown, PLAYER.fireCooldown, this.offset);
      this.armed.position.set(REST.x, REST.y, REST.z + this.offset.back);
      this.armed.rotation.set(this.offset.lift, REST.yaw, 0);
    } else {
      this.fist.position.set(FIST_REST.x, FIST_REST.y, FIST_REST.z - jabOffset(this.punchAge));
      this.fist.rotation.set(0, FIST_REST.yaw, 0);
    }
  }
}
```

- [ ] **Step 4 : modifier les hanches, le liseré, et brancher**

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 8280978..1b6dfe3 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -128,13 +128,14 @@ renderer.setAnimationLoop(() => {
   }
 
   if (mode === "playing") {
-    game.step(dt, input.sample());
+    const simDt = game.step(dt, input.sample());
     writeGameView(game, view);
+    for (let i = 0; i < game.events.count; i++) if (game.events.items[i]!.type === "punch") world.viewModel.punch();
     recorder.recordEvents(game.events);
     recorder.capture(game.simTime, view, game.status !== "playing");
     audio.frame(view, game.events);
     hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
-    world.update(view);
+    world.update(view, simDt);
     if (game.status === "dead") setMode("dead");
     if (game.status === "won") {
       // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
@@ -168,7 +169,7 @@ renderer.setAnimationLoop(() => {
     }
   } else if (mode === "replay") {
     replay.update(dt);
-    world.update(replay.view);
+    world.update(replay.view, dt);
     audio.frame(replay.view, replay.events);
     hud.chant(replay.playhead);
     if (replay.finished) setMode("won");
diff --git a/src/render/enemy-geometry.ts b/src/render/enemy-geometry.ts
index 5c81365..598afa4 100644
--- a/src/render/enemy-geometry.ts
+++ b/src/render/enemy-geometry.ts
@@ -69,12 +69,14 @@ const HEAD: Profile = {
 
 const TORSO: Profile = {
   sides: 10,
-  // Le bassin descend sous les hanches pour couvrir le haut des cuisses.
-  bottom: { y: -0.34, z: 0.01 },
+  // Le bassin descend nettement sous les hanches (entrejambe) et enveloppe le haut des cuisses : de près,
+  // aucune marche entre le bassin et les jambes (plan 2, report 23).
+  bottom: { y: -0.4, z: 0.01 },
   top: { y: 0.32 },
   rings: [
-    { y: -0.31, rx: 0.15, rz: 0.09, z: 0.01 },
-    { y: -0.24, rx: 0.185, rz: 0.11, z: 0.012 }, // bassin : il couvre le haut des cuisses
+    { y: -0.37, rx: 0.12, rz: 0.08, z: 0.01 }, // entrejambe
+    { y: -0.31, rx: 0.18, rz: 0.105, z: 0.012 }, // bas du bassin, aussi large que les deux cuisses
+    { y: -0.24, rx: 0.19, rz: 0.112, z: 0.012 }, // bassin : il couvre le haut des cuisses
     { y: -0.14, rx: 0.15, rz: 0.1, z: 0.005 },
     { y: -0.04, rx: 0.14, rz: 0.095 }, // taille
     { y: 0.05, rx: 0.165, rz: 0.11, z: -0.01 },
@@ -118,8 +120,8 @@ const LEG: Profile = {
   sides: 9,
   // Semelle plate au ras du sol (bas du segment), pied tourné vers l'avant (−Z).
   bottom: { y: -0.475, z: -0.045 },
-  // Le haut de la cuisse entre dans le bassin.
-  top: { y: 0.5 },
+  // Le haut de la cuisse est une rotule qui monte dans le bassin : jambe pliée, rien ne dépasse à la hanche.
+  top: { y: 0.56 },
   rings: [
     { y: -0.475, rx: 0.048, rz: 0.11, z: -0.045 }, // semelle
     { y: -0.44, rx: 0.048, rz: 0.085, z: -0.03 }, // coup de pied
@@ -129,7 +131,8 @@ const LEG: Profile = {
     { y: 0, rx: 0.056, rz: 0.058 }, // genou
     { y: 0.15, rx: 0.075, rz: 0.08 },
     { y: 0.3, rx: 0.09, rz: 0.095, z: -0.006 }, // cuisse
-    { y: 0.44, rx: 0.082, rz: 0.09 }, // haut de cuisse, rentré dans le bassin
+    { y: 0.44, rx: 0.085, rz: 0.092 }, // haut de cuisse, rentré dans le bassin
+    { y: 0.51, rx: 0.07, rz: 0.076 }, // rotule de hanche, dans le bassin
   ],
 };
 
diff --git a/src/render/materials.ts b/src/render/materials.ts
index 93c0070..91bb203 100644
--- a/src/render/materials.ts
+++ b/src/render/materials.ts
@@ -44,7 +44,9 @@ export function enemyBodyMaterial(): THREE.MeshStandardNodeMaterial {
 export function inkMaterial(): THREE.MeshStandardNodeMaterial {
   const mat = new THREE.MeshStandardNodeMaterial({ color: PALETTE.ink, roughness: 0.6, flatShading: true });
   const facing = max(dot(normalView, positionViewDirection), float(0));
-  mat.emissiveNode = color(PALETTE.world).mul(float(1).sub(facing).pow(3)).mul(0.7);
+  // Puissance 5 : sur des pavés à faces plates, le liseré ne doit éclairer que les faces presque rasantes,
+  // pas des faces entières (réglé au plan 3 avec le pistolet en code : à la puissance 3, l'arme virait au gris).
+  mat.emissiveNode = color(PALETTE.world).mul(float(1).sub(facing).pow(5)).mul(0.6);
   return mat;
 }
 
diff --git a/src/render/world-renderer.ts b/src/render/world-renderer.ts
index ccbfc25..8af9eb3 100644
--- a/src/render/world-renderer.ts
+++ b/src/render/world-renderer.ts
@@ -9,6 +9,7 @@ import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
 import { EnemyBodies } from "./enemy-bodies";
 import { aimLineMaterial, enemyBodyMaterial, inkMaterial, threatBasicMaterial, threatMaterial, worldMaterial } from "./materials";
 import { PALETTE } from "./palette";
+import { ViewModel, pistolGeometry } from "./view-model";
 
 export class WorldRenderer {
   readonly scene = new THREE.Scene();
@@ -20,7 +21,8 @@ export class WorldRenderer {
   private readonly aimLines: THREE.LineSegments;
   // Armes du monde (au sol, en vol, tenues par un ennemi) : un seul InstancedMesh.
   private readonly weapons: THREE.InstancedMesh;
-  private readonly viewModel: THREE.Mesh;
+  // Arme et mains du joueur, accrochées à la caméra.
+  readonly viewModel: ViewModel;
   private readonly bulletHeads: THREE.InstancedMesh;
   private readonly bulletTrails: THREE.InstancedMesh;
   // Éclats de menace (glow) et éclats neutres (décor, joueur) : deux InstancedMesh.
@@ -118,15 +120,13 @@ export class WorldRenderer {
     this.scene.add(this.aimLines);
 
     const inkMat = inkMaterial();
-    this.weapons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), inkMat, POOLS.weapons);
+    this.weapons = new THREE.InstancedMesh(pistolGeometry(), inkMat, POOLS.weapons);
     this.weapons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
     this.weapons.frustumCulled = false;
     this.weapons.castShadow = true;
     this.scene.add(this.weapons);
-    // Arme en main : plus petite et plus loin que les armes du monde, pour ne pas boucher la vue.
-    this.viewModel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.24), inkMat);
-    this.viewModel.position.set(0.2, -0.2, -0.55);
-    this.camera.add(this.viewModel);
+    this.viewModel = new ViewModel(inkMat);
+    this.camera.add(this.viewModel.group);
 
     const bulletMat = threatBasicMaterial(PALETTE.threatHot);
     this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(BULLET_LOOK.headRadius, 8, 6), bulletMat, POOLS.bullets);
@@ -167,12 +167,13 @@ export class WorldRenderer {
     this.camera.updateProjectionMatrix();
   }
 
-  update(view: WorldView): void {
+  // `dtSim` : temps de simulation de l'image, pour les gestes du joueur (recul, coup de poing).
+  update(view: WorldView, dtSim = 0): void {
     const cam = view.camera;
     this.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
     this.camera.rotation.y = cam.yaw;
     this.camera.rotation.x = cam.pitch;
-    this.viewModel.visible = view.playerAmmo >= 0;
+    this.viewModel.update(view, dtSim);
 
     const rackIndices = this.room.rackBoxIndices;
     for (let i = 0; i < rackIndices.length; i++) {
```

- [ ] **Step 5 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t3-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `175 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 6 : vérifier dans Chrome**

`http://localhost:5299/?debug`, captures dans `.superpowers/plan-3a-captures/` :
1. Au départ, `window.agenthot.advance(0.3)` : `t3-pistol.png`. **Attendu :** en bas à droite, un pistolet noir mat dont on lit la culasse, le pontet percé et la crosse inclinée ; la main l'enserre (doigts enroulés visibles côté gauche, pouce le long de la carcasse), l'avant-bras sort par le bas de l'écran ; arêtes claires fines, faces noires.
2. Mains vides, puis un coup de poing pris en plein geste :
   ```js
   const a = window.agenthot; const g = a.game;
   const w = g.weapons[g.player.weaponId]; w.state = "ground"; w.holderId = -1; w.pos.y = -5; g.player.weaponId = -1;
   a.advance(0.02);
   ```
   `t3-fist.png`. **Attendu :** un poing noir tourné vers le centre, doigts repliés visibles.
3. Ennemi de près, en marche, de face :
   ```js
   location.reload(); // puis :
   const a = window.agenthot; const g = a.game; a.advance(0.5);
   const e = g.enemies[1]; e.state = "approach"; e.walkDistance = 0.35; e.strideAmp = 1; e.yaw = Math.PI - 0.5;
   g.player.pos.x = e.pos.x; g.player.pos.z = e.pos.z + 1.2; g.player.yaw = 0; g.player.pitch = -0.5; a.advance(0);
   ```
   `t3-hips.png`. **Attendu :** la cuisse avant coule dans le bassin, sans marche ni trou ; l'arme de l'ennemi est un pistolet dans sa main.
4. Recul : la sonde debug ne fait pas avancer `dtSim`. Le recul et le coup de poing se vérifient en jouant (tâche 12).

- [ ] **Step 7 : commit**

```bash
cd <racine> && git add src/render/weapon-shapes.ts src/render/view-model.ts tests/weapon-shapes.test.ts src/render/enemy-geometry.ts tests/enemy-geometry.test.ts src/render/materials.ts src/render/world-renderer.ts src/app/main.ts && git commit -m "feat(render): coded pistol, gripping hand, fist, recoil and punch; hips blend into the pelvis"
```

---

### Task 4 : qualité auto et limite à 60 images par seconde (spec 9.2, report 25)

Spec 9.2 : si le temps d'image moyen dépasse 18 ms pendant 2 s, la résolution baisse par paliers (1 → 0,85 → 0,7) et remonte après 10 s stables. S'ajoute une limite de 60 images par seconde en auto et en basse (le Mac de Romain chauffait à 120 en Retina). Un arrêt de plus de 250 ms (onglet caché) n'est pas une image lente.

**Files :**
- Create : `src/render/quality.ts`, `tests/quality.test.ts`
- Modify : `src/render/create-renderer.ts`, `src/app/main.ts`

**Interfaces :**
- Produces : `type QualityMode = "auto" | "high" | "low"`, `QUALITY`, `class QualityGovernor { mode; scale; fpsCap; setMode(mode); sample(frameMs): boolean }`, `class FrameLimiter { shouldRender(now, cap): boolean }`, `basePixelRatio(isWebGPU): number`.

- [ ] **Step 1 : écrire les tests**

`tests/quality.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { FrameLimiter, QUALITY, QualityGovernor } from "../src/render/quality";

// Fait passer `seconds` secondes d'images de `frameMs` au gouverneur ; renvoie les échelles prises en route.
function feed(governor: QualityGovernor, frameMs: number, seconds: number): number[] {
  const scales: number[] = [];
  for (let t = 0; t < seconds * 1000; t += frameMs) if (governor.sample(frameMs)) scales.push(governor.scale);
  return scales;
}

describe("qualité automatique (spec 9.2, plan 3 report 25)", () => {
  test("images lentes (25 ms) pendant 2 s : la résolution baisse d'un palier ; encore 2 s : un palier de plus, puis plus bas rien", () => {
    const g = new QualityGovernor("auto");
    expect(g.scale).toBe(1);
    expect(feed(g, 25, 2.1)).toEqual([0.85]);
    expect(feed(g, 25, 2.1)).toEqual([0.7]);
    expect(feed(g, 25, 10)).toEqual([]);
    expect(g.scale).toBe(0.7);
  });

  test("après 10 s stables (16,7 ms), la résolution remonte d'un palier, puis d'un autre 10 s plus tard", () => {
    const g = new QualityGovernor("auto");
    feed(g, 25, 4.2);
    expect(feed(g, 16.7, 9)).toEqual([]);
    expect(feed(g, 16.7, 1.5)).toEqual([0.85]);
    expect(feed(g, 16.7, 10.5)).toEqual([1]);
  });

  test("un à-coup isolé ne compte pas : c'est la moyenne sur 2 s qui décide", () => {
    const g = new QualityGovernor("auto");
    for (let i = 0; i < 3; i++) {
      g.sample(100);
      feed(g, 16.7, 1.9);
    }
    expect(g.scale).toBe(1);
  });

  test("haute : pleine résolution, jamais réduite, sans limite d'images ; basse : dernier palier, 60 images/s", () => {
    const high = new QualityGovernor("high");
    expect(feed(high, 40, 10)).toEqual([]);
    expect(high.scale).toBe(1);
    expect(high.fpsCap).toBe(0);
    const low = new QualityGovernor("low");
    expect(low.scale).toBe(QUALITY.steps[QUALITY.steps.length - 1]!);
    expect(low.fpsCap).toBe(60);
    expect(new QualityGovernor("auto").fpsCap).toBe(60);
  });

  test("retour d'un onglet caché : l'arrêt de plusieurs secondes n'est pas pris pour une image lente", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, 1);
    g.sample(8000);
    feed(g, 16.7, 1.2);
    expect(g.scale).toBe(1);
  });

  test("changer de mode repart de son palier de départ", () => {
    const g = new QualityGovernor("auto");
    feed(g, 25, 2.1);
    g.setMode("high");
    expect(g.scale).toBe(1);
    g.setMode("auto");
    expect(g.scale).toBe(1);
  });
});

describe("limite d'images par seconde", () => {
  // Nombre d'images rendues en une seconde sur un écran à `hz`, avec la limite `cap`.
  function rendered(hz: number, cap: number): number {
    const limiter = new FrameLimiter();
    let n = 0;
    for (let i = 0; i < hz * 10; i++) if (limiter.shouldRender(1000 + (i * 1000) / hz, cap)) n++;
    return n / 10;
  }

  test("60 images/s sur un écran à 60, 120 ou 144 Hz", () => {
    expect(rendered(60, 60)).toBeCloseTo(60, 0);
    expect(Math.abs(rendered(120, 60) - 60)).toBeLessThanOrEqual(1);
    expect(Math.abs(rendered(144, 60) - 60)).toBeLessThanOrEqual(1);
  });

  test("sans limite, chaque image de l'écran est rendue", () => {
    expect(rendered(120, 0)).toBe(120);
  });

  test("après une longue pause (onglet caché), pas de rafale de rattrapage", () => {
    const limiter = new FrameLimiter();
    expect(limiter.shouldRender(0, 60)).toBe(true);
    expect(limiter.shouldRender(5000, 60)).toBe(true);
    expect(limiter.shouldRender(5008, 60)).toBe(false);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/quality.test.ts`
Expected : échec, module `../src/render/quality` introuvable.

- [ ] **Step 3 : écrire le code**

`src/render/quality.ts` :

```ts
// Qualité de rendu (spec 4.5 et 9.2) : résolution adaptative et limite d'images par seconde. Calcul pur, testé avec bun.
//   auto  : 60 images/s au plus ; la résolution baisse par paliers si le temps d'image moyen dépasse 18 ms
//           pendant 2 s, et remonte d'un palier après 10 s stables ;
//   haute : pleine résolution, sans limite (jusqu'à la fréquence de l'écran, 120 sur un écran rapide) ;
//   basse : 60 images/s au plus, résolution fixe au dernier palier.
// La limite de 60 vient de l'essai de Romain au plan 2 : à 120 images/s en Retina, son Mac chauffait.

export type QualityMode = "auto" | "high" | "low";

export const QUALITY = {
  slowFrameMs: 18,
  slowWindow: 2,
  recoverWindow: 10,
  steps: [1, 0.85, 0.7],
  fpsCap: 60,
  // Au-delà (ms), un écart entre deux images est un arrêt (onglet caché, chargement), pas un GPU lent : ignoré.
  stallMs: 250,
  // Marge (ms) : une image de l'écran qui tombe un peu avant l'échéance compte quand même (écrans 120 et 144 Hz).
  capTolerance: 2,
} as const;

export class QualityGovernor {
  mode: QualityMode;
  private step = 0;
  private windowTime = 0;
  private windowFrames = 0;
  private windowMs = 0;
  private stableTime = 0;

  constructor(mode: QualityMode) {
    this.mode = mode;
    this.setMode(mode);
  }

  // Part de la résolution de base à utiliser (1 = pleine résolution).
  get scale(): number {
    return QUALITY.steps[this.step]!;
  }

  // Limite d'images par seconde, ou 0 sans limite.
  get fpsCap(): number {
    return this.mode === "high" ? 0 : QUALITY.fpsCap;
  }

  setMode(mode: QualityMode): void {
    this.mode = mode;
    this.step = mode === "low" ? QUALITY.steps.length - 1 : 0;
    this.resetWindow();
    this.stableTime = 0;
  }

  // Une image rendue : `frameMs` est l'écart avec la précédente. Renvoie vrai si l'échelle a changé.
  sample(frameMs: number): boolean {
    if (this.mode !== "auto" || frameMs > QUALITY.stallMs) return false;
    this.windowTime += frameMs / 1000;
    this.windowFrames++;
    this.windowMs += frameMs;
    if (this.windowTime < QUALITY.slowWindow) return false;
    const average = this.windowMs / this.windowFrames;
    const window = this.windowTime;
    this.resetWindow();
    if (average > QUALITY.slowFrameMs) {
      this.stableTime = 0;
      if (this.step < QUALITY.steps.length - 1) {
        this.step++;
        return true;
      }
      return false;
    }
    this.stableTime += window;
    if (this.stableTime >= QUALITY.recoverWindow && this.step > 0) {
      this.step--;
      this.stableTime = 0;
      return true;
    }
    return false;
  }

  private resetWindow(): void {
    this.windowTime = 0;
    this.windowFrames = 0;
    this.windowMs = 0;
  }
}

// Limite d'images par seconde : sur un écran plus rapide que la limite, on saute des images de l'écran.
export class FrameLimiter {
  private next = Number.NEGATIVE_INFINITY;

  // Vrai si l'image de l'écran à l'instant `now` (ms) doit être rendue, avec une limite `cap` (0 : aucune).
  shouldRender(now: number, cap: number): boolean {
    if (cap <= 0) return true;
    const interval = 1000 / cap;
    if (now < this.next - QUALITY.capTolerance) return false;
    // Échéance suivante calée sur la grille : pas de dérive vers le bas sur un écran à 144 Hz. Au départ, ou
    // après un long arrêt (onglet caché), on repart de maintenant.
    this.next = (now - this.next > interval ? now : this.next) + interval;
    return true;
  }
}
```

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 1b6dfe3..ce3dd61 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -3,8 +3,9 @@ import "./style.css";
 import { GameAudio } from "../audio/game-audio";
 import { ReplayPlayer } from "../replay/player";
 import { ReplayRecorder } from "../replay/recorder";
-import { createRenderer } from "../render/create-renderer";
+import { basePixelRatio, createRenderer } from "../render/create-renderer";
 import { PostPipeline } from "../render/post";
+import { FrameLimiter, QualityGovernor } from "../render/quality";
 import { WorldRenderer } from "../render/world-renderer";
 import { room01 } from "../rooms/room-01-datacenter";
 import { Game, type PlayerInput, emptyInput } from "../sim/game";
@@ -34,6 +35,9 @@ const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
 // Contexte audio créé tout de suite, suspendu jusqu'au premier geste (clic ou touche).
 const audio = new GameAudio();
 void audio.loadMusic();
+// Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative. Le réglage arrive avec les paramètres.
+const quality = new QualityGovernor("auto");
+const limiter = new FrameLimiter();
 
 let mode: Mode = "start";
 let last = performance.now();
@@ -117,6 +121,9 @@ if (debug) {
 
 renderer.setAnimationLoop(() => {
   const now = performance.now();
+  // Écran plus rapide que la limite : on saute cette image de l'écran, rien n'avance.
+  if (!limiter.shouldRender(now, quality.fpsCap)) return;
+  if (quality.sample(now - last)) renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
   // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
   const dt = Math.min(0.1, (now - last) / 1000);
   last = now;
@@ -188,7 +195,7 @@ renderer.setAnimationLoop(() => {
     fpsTime = 0;
     if (debug) {
       hud.setDebug(
-        `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
+        `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ res ${quality.scale} ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
           `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
       );
     }
diff --git a/src/render/create-renderer.ts b/src/render/create-renderer.ts
index c9c76f2..b4754a9 100644
--- a/src/render/create-renderer.ts
+++ b/src/render/create-renderer.ts
@@ -8,7 +8,7 @@ export interface RendererHandle {
 
 export async function createRenderer(container: HTMLElement, forceWebGL: boolean): Promise<RendererHandle> {
   const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
-  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
+  renderer.setPixelRatio(basePixelRatio(true));
   renderer.setSize(window.innerWidth, window.innerHeight);
   // Ombres douces : PCF filtré (PCFSoftShadowMap n'existe plus en r186, il retombe sur PCF).
   renderer.shadowMap.enabled = true;
@@ -17,8 +17,13 @@ export async function createRenderer(container: HTMLElement, forceWebGL: boolean
   await renderer.init();
   // `isWebGPUBackend` n'est typé que sur WebGPUBackend : lecture par cast (brief r186).
   const isWebGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
-  // Le repli WebGL2 tombait sous 60 images par seconde en Retina (pixel ratio 2, soit 4 fois les pixels du
-  // pixel ratio 1, avec le post-traitement en plusieurs passes) : on plafonne à 1,5 hors WebGPU (spec 9.2).
-  if (!isWebGPU) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
+  if (!isWebGPU) renderer.setPixelRatio(basePixelRatio(false));
   return { renderer, isWebGPU };
 }
+
+// Résolution de base, avant la qualité auto (quality.ts). Le repli WebGL2 tombait sous 60 images par seconde en
+// Retina (pixel ratio 2, soit 4 fois les pixels du pixel ratio 1, avec le post-traitement en plusieurs passes) :
+// on plafonne à 1,5 hors WebGPU (spec 9.2).
+export function basePixelRatio(isWebGPU: boolean): number {
+  return Math.min(window.devicePixelRatio, isWebGPU ? 2 : 1.5);
+}
```

- [ ] **Step 4 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t4-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `184 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 5 : vérifier dans Chrome (fenêtre au premier plan)**

`http://localhost:5299/?debug`. Le panneau debug affiche `… 60 fps ‧ res 1 ‧ …` sur un écran à 120 Hz (sans la limite : 120). Si la fenêtre n'est pas au premier plan (`document.visibilityState` vaut `hidden`), la ligne reste vide : noter « non mesuré », la mesure revient à la tâche 12.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add src/render/quality.ts tests/quality.test.ts src/render/create-renderer.ts src/app/main.ts && git commit -m "feat(render): auto quality steps and a 60 fps cap (spec 9.2)"
```

---

### Task 5 : les paramètres, gardés et appliqués (spec 4.5, AC-14)

**Files :**
- Create : `src/settings/settings.ts`, `tests/settings.test.ts`
- Modify : `src/app/main.ts`

**Interfaces :**
- Consumes : `QualityMode` (tâche 4), `InputController.sensitivity` et `.invertY` (plan 1), `WorldRenderer.setFov`, `AudioEngine.setVolumes` (plan 2).
- Produces : `interface Settings { sensitivity; invertY; fov; musicVolume; sfxVolume; quality }`, `SETTING_RANGES`, `QUALITY_MODES`, `DEFAULT_SETTINGS`, `SETTINGS_KEY` (`"agenthot.settings.v1"`), `clampSetting`, `sanitizeSettings`, `interface SettingsStorage`, `loadSettings`, `saveSettings`, `browserStorage` ; sonde debug `window.agenthot.settings(patch)`.

- [ ] **Step 1 : écrire les tests**

`tests/settings.test.ts` :

```ts
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
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/settings.test.ts`
Expected : échec, module `../src/settings/settings` introuvable.

- [ ] **Step 3 : écrire le code**

`src/settings/settings.ts` :

```ts
// Paramètres du joueur (spec 4.5) : persistés dans localStorage, appliqués à chaud. Calcul pur, testé avec bun.
import type { QualityMode } from "../render/quality";

export interface Settings {
  // Multiplicateur de la sensibilité de base de la souris.
  sensitivity: number;
  invertY: boolean;
  // Champ de vision vertical, en degrés.
  fov: number;
  // Volumes de 0 à 100.
  musicVolume: number;
  sfxVolume: number;
  quality: QualityMode;
}

// Plages et pas de la spec 4.5 ; le pas sert aux curseurs et aux flèches du clavier.
export const SETTING_RANGES = {
  sensitivity: { min: 0.1, max: 3, step: 0.1 },
  fov: { min: 70, max: 110, step: 1 },
  musicVolume: { min: 0, max: 100, step: 1 },
  sfxVolume: { min: 0, max: 100, step: 1 },
} as const;

export const QUALITY_MODES: readonly QualityMode[] = ["auto", "high", "low"];

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  sensitivity: 1,
  invertY: false,
  fov: 90,
  musicVolume: 70,
  sfxVolume: 90,
  quality: "auto",
};

// Clé versionnée : un format futur incompatible prendra une autre clé au lieu de lire de travers.
export const SETTINGS_KEY = "agenthot.settings.v1";

type NumericSetting = keyof typeof SETTING_RANGES;

// Ramène une valeur dans sa plage, arrondie à son pas (0,1 pour la sensibilité : pas de 1,0000000002).
export function clampSetting(key: NumericSetting, value: number): number {
  const { min, max, step } = SETTING_RANGES[key];
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS[key];
  const stepped = Math.round((Math.min(max, Math.max(min, value)) - min) / step) * step + min;
  return Number(stepped.toFixed(4));
}

// Réglages sûrs à partir de n'importe quoi (JSON d'une ancienne version, main de l'utilisateur, rien) :
// chaque champ absent ou invalide reprend sa valeur par défaut, chaque nombre est ramené dans sa plage.
export function sanitizeSettings(raw: unknown): Settings {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const num = (key: NumericSetting): number => {
    const value = source[key];
    return typeof value === "number" ? clampSetting(key, value) : DEFAULT_SETTINGS[key];
  };
  const quality = source.quality;
  return {
    sensitivity: num("sensitivity"),
    invertY: typeof source.invertY === "boolean" ? source.invertY : DEFAULT_SETTINGS.invertY,
    fov: num("fov"),
    musicVolume: num("musicVolume"),
    sfxVolume: num("sfxVolume"),
    quality: QUALITY_MODES.includes(quality as QualityMode) ? (quality as QualityMode) : DEFAULT_SETTINGS.quality,
  };
}

// Stockage minimal : localStorage dans le navigateur, un faux dans les tests.
export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Lecture sans jamais échouer : stockage absent (navigation privée stricte), refusé, ou JSON abîmé.
export function loadSettings(storage: SettingsStorage | null): Settings {
  try {
    const text = storage?.getItem(SETTINGS_KEY);
    return sanitizeSettings(text ? JSON.parse(text) : null);
  } catch {
    return sanitizeSettings(null);
  }
}

// Écriture sans jamais échouer : un stockage plein ou refusé garde les réglages pour la session en cours.
export function saveSettings(storage: SettingsStorage | null, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Réglages gardés en mémoire seulement.
  }
}

// localStorage du navigateur, ou rien s'il est inaccessible (son simple accès peut lever une exception).
export function browserStorage(): SettingsStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
```

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index ce3dd61..fa69a9f 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -7,6 +7,7 @@ import { basePixelRatio, createRenderer } from "../render/create-renderer";
 import { PostPipeline } from "../render/post";
 import { FrameLimiter, QualityGovernor } from "../render/quality";
 import { WorldRenderer } from "../render/world-renderer";
+import { type Settings, browserStorage, loadSettings, saveSettings } from "../settings/settings";
 import { room01 } from "../rooms/room-01-datacenter";
 import { Game, type PlayerInput, emptyInput } from "../sim/game";
 import { TIME } from "../sim/time";
@@ -35,9 +36,25 @@ const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
 // Contexte audio créé tout de suite, suspendu jusqu'au premier geste (clic ou touche).
 const audio = new GameAudio();
 void audio.loadMusic();
-// Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative. Le réglage arrive avec les paramètres.
+// Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative, selon le réglage Qualité.
 const quality = new QualityGovernor("auto");
 const limiter = new FrameLimiter();
+const storage = browserStorage();
+let settings = loadSettings(storage);
+
+// Applique les paramètres à chaud (spec 4.5) : souris, champ de vision, volumes, qualité.
+function applySettings(next: Settings): void {
+  settings = next;
+  input.sensitivity = next.sensitivity;
+  input.invertY = next.invertY;
+  world.setFov(next.fov);
+  audio.engine.setVolumes(next.musicVolume / 100, next.sfxVolume / 100);
+  if (quality.mode !== next.quality) {
+    quality.setMode(next.quality);
+    renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
+  }
+}
+applySettings(settings);
 
 let mode: Mode = "start";
 let last = performance.now();
@@ -105,6 +122,14 @@ if (debug) {
     renderer,
     game,
     post,
+    world,
+    input,
+    // Change des réglages comme le fera le panneau Paramètres : appliqués et enregistrés.
+    settings(patch: Partial<Settings>): Settings {
+      applySettings({ ...settings, ...patch });
+      saveSettings(storage, settings);
+      return settings;
+    },
     advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
       const frameInput = { ...emptyInput(), ...overrides };
       for (let t = 0; t < seconds; t += 1 / 60) {
```

- [ ] **Step 4 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t5-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `189 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 5 : vérifier dans Chrome**

`http://localhost:5299/?debug`, puis :

```js
localStorage.clear(); location.reload(); // puis, une fois la page chargée :
const a = window.agenthot;
a.settings({ fov: 104, sensitivity: 2.2, invertY: true, musicVolume: 10, quality: "low" });
location.reload(); // puis :
[window.agenthot.world.camera.fov, window.agenthot.input.sensitivity, window.agenthot.input.invertY,
 window.agenthot.renderer.getPixelRatio() / Math.min(devicePixelRatio, 2)]
```

**Attendu :** `[104, 2.2, true, 0.7]` (à 0,01 près pour le dernier). Remettre `localStorage.clear()` ensuite.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add src/settings/settings.ts tests/settings.test.ts src/app/main.ts && git commit -m "feat(settings): persisted settings, clamped and applied live (spec 4.5)"
```

---

### Task 6 : polices et design system « Monolithe + Encre » (spec 3 et 6.3)

Les trois polices sont auto-hébergées en woff2, réduites au latin et au français (66 Ko pour les cinq fichiers). `tokens.css` porte les couleurs, les piles de polices, le mouvement, et deux familles de composants : Monolithe (`.mono-title`, `.label`) et Encre (`.ink-panel`, `.ink-button`). Le HUD du jeu passe à ces tokens : message de mort discret « R ‧ RECOMMENCER » (spec 4.4), chant du replay en Big Shoulders 900 (« AGENT » blanc, « HOT » orange, arrivée en coup de poing).

**Files :**
- Create : `scripts/build-fonts.sh`, `src/ui/tokens.css`, et, produits par le script, `public/fonts/big-shoulders-display-800.woff2`, `public/fonts/big-shoulders-display-900.woff2`, `public/fonts/chakra-petch-500.woff2`, `public/fonts/chakra-petch-600.woff2`, `public/fonts/martian-mono-300-400.woff2`, `public/fonts/LICENSES.txt`
- Modify : `src/app/style.css`, `src/app/hud.ts`, `src/app/main.ts`

**Interfaces :**
- Produces : variables CSS `--void … --muted`, `--font-mono-title`, `--font-ink`, `--font-label`, `--ease`, `--t-fast|mid|slow`, `--ink-panel-frame`, `--ink-button-frame*` ; classes `.mono-title` (`.hot`), `.label`, `.ink-panel`, `.ink-button` (`.is-focused`, `.is-active`, `:disabled`).

- [ ] **Step 1 : écrire le script des polices**

`scripts/build-fonts.sh` :

```zsh
#!/bin/zsh
# Polices de l'interface (spec 3 et 6.3), auto-hébergées en woff2 : sous-ensemble latin + français.
# Sources : dépôt google/fonts, figé au commit ci-dessous. Licence SIL OFL 1.1 sans nom réservé : sous-ensemble et
# conversion permis sans renommage, à condition de livrer la licence (public/fonts/LICENSES.txt).
# Usage : zsh scripts/build-fonts.sh   (réseau + uvx ; écrit public/fonts/)
set -euo pipefail
# Date figée dans les fichiers produits (fontTools la lit) et versions d'outils épinglées : deux lancements
# donnent les mêmes octets.
export SOURCE_DATE_EPOCH=1790640000

ROOT=${0:A:h:h}
OUT=$ROOT/public/fonts
COMMIT=23e54b51ddffbc7713c583748e3bd86f62b1fa4a
BASE=https://raw.githubusercontent.com/google/fonts/$COMMIT/ofl
WORK=$(mktemp -d)
# Latin de base et Latin-1 (accents français), œ Œ, apostrophes et guillemets typographiques, tirets, puce,
# points de suspension, €, ™, signe moins. U+2027 (‧, séparateur des crédits, spec 4.3) est demandé mais absent
# des trois polices sources : le navigateur le prend dans une police système (pile de repli de tokens.css).
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201F,U+2022,U+2026,U+2027,U+20AC,U+2122,U+2212"

fetch() { curl -sfL -o "$WORK/$2" "$BASE/$1" }
fetch "bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf" bsd.ttf
fetch "chakrapetch/ChakraPetch-Medium.ttf" chakra-500.ttf
fetch "chakrapetch/ChakraPetch-SemiBold.ttf" chakra-600.ttf
fetch "martianmono/MartianMono%5Bwdth,wght%5D.ttf" martian.ttf
fetch "bigshouldersdisplay/OFL.txt" bsd-OFL.txt
fetch "chakrapetch/OFL.txt" chakra-OFL.txt
fetch "martianmono/OFL.txt" martian-OFL.txt

# Graisses figées des polices variables : Big Shoulders Display 800 et 900 ; Martian Mono gardée variable
# de 300 à 400, largeur figée à 100 (sa valeur par défaut).
instance() { uvx --from fonttools==4.66.1 fonttools varLib.instancer "$WORK/$1" "${@:3}" -q -o "$WORK/$2" }
instance bsd.ttf bsd-800.ttf wght=800
instance bsd.ttf bsd-900.ttf wght=900
instance martian.ttf martian-300-400.ttf wght=300:400 wdth=100

mkdir -p "$OUT"
subset() {
  uvx --from "fonttools[woff]==4.66.1" --with brotli==1.2.0 pyftsubset "$WORK/$1" --unicodes="$UNICODES" --flavor=woff2 \
    --layout-features='*' --no-hinting --output-file="$OUT/$2"
}
subset bsd-800.ttf big-shoulders-display-800.woff2
subset bsd-900.ttf big-shoulders-display-900.woff2
subset chakra-500.ttf chakra-petch-500.woff2
subset chakra-600.ttf chakra-petch-600.woff2
subset martian-300-400.ttf martian-mono-300-400.woff2

{
  print "Polices livrées avec AGENTHOT, sous-ensembles woff2 des fichiers de github.com/google/fonts (commit $COMMIT)."
  print "Chacune est distribuée sous la SIL Open Font License 1.1, reproduite ci-dessous."
  for name in bsd chakra martian; do
    print "\n==== $name ====\n"
    cat "$WORK/$name-OFL.txt"
  done
} > "$OUT/LICENSES.txt"

trash "$WORK"
ls -l "$OUT"
```

- [ ] **Step 2 : produire les polices**

Run : `cd <racine> && zsh scripts/build-fonts.sh && shasum public/fonts/*.woff2`
Expected (mêmes octets que le prototype) :

```
39720af28556d890453259ddf076d6ef44f39aff  public/fonts/big-shoulders-display-800.woff2
558f642a4b12b45b6b2fb26fff6022a7a47df2c7  public/fonts/big-shoulders-display-900.woff2
1004c38c9c19880e64212f7e6c222892c3766c49  public/fonts/chakra-petch-500.woff2
cbaa60e94b572ddee17b3a1b816a93538394441c  public/fonts/chakra-petch-600.woff2
d0edf40f47316490eef833a8941f2d4d05cd72a0  public/fonts/martian-mono-300-400.woff2
```

Si un SHA-1 diffère (outil ou dépôt source changé), ce n'est pas bloquant : noter les tailles (15 à 18 Ko pour Big Shoulders, 9 Ko pour Chakra Petch, 14 Ko pour Martian Mono) et vérifier à l'étape 5 que les polices s'affichent.

- [ ] **Step 3 : écrire les tokens**

`src/ui/tokens.css` :

```css
/* Design system de l'interface (spec 6.3) : « Monolithe » (logo, titres, replay) + « Encre » (panneaux).
   Palette partagée avec le jeu (spec 6.1, src/render/palette.ts). L'orange ne signale que la menace ou l'action. */

@font-face {
  font-family: "Big Shoulders Display";
  src: url("/fonts/big-shoulders-display-800.woff2") format("woff2");
  font-weight: 800;
  font-display: swap;
}
@font-face {
  font-family: "Big Shoulders Display";
  src: url("/fonts/big-shoulders-display-900.woff2") format("woff2");
  font-weight: 900;
  font-display: swap;
}
@font-face {
  font-family: "Chakra Petch";
  src: url("/fonts/chakra-petch-500.woff2") format("woff2");
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Chakra Petch";
  src: url("/fonts/chakra-petch-600.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "Martian Mono";
  src: url("/fonts/martian-mono-300-400.woff2") format("woff2");
  font-weight: 300 400;
  font-display: swap;
}

:root {
  --void: #0d111b;
  --void-2: #141a28;
  --world: #ecebe7;
  --world-2: #c9cbd0;
  --ink: #0a0c10;
  --threat: #d97757;
  --threat-hot: #ff9d73;
  --muted: #7c8394;

  /* Piles de repli : le « ‧ » (U+2027) n'est dans aucune des trois polices, il vient d'une police système. */
  --font-mono-title: "Big Shoulders Display", "Arial Narrow", sans-serif;
  --font-ink: "Chakra Petch", system-ui, sans-serif;
  --font-label: "Martian Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Mouvement : 150 à 250 ms, sans rebond. */
  --ease: cubic-bezier(0.2, 0.9, 0.2, 1);
  --t-fast: 150ms;
  --t-mid: 200ms;
  --t-slow: 250ms;

  /* Cadres Encre en « 9-slice » (border-image) : trait d'encre, filet et coins coupés à 45° restent nets à
     toute taille, y compris sur la diagonale des coins (un clip-path, lui, y coupait le trait). Plaque : 64 × 64,
     coins de 18 px, trait de 2 px, filet à 6,5 px et 25 %. Bouton : 40 × 40, coin de 10 px, trait de 1,5 px,
     filet `threat` de 4 px à gauche quand il est actif. Coordonnées calculées pour des diagonales à 45°.
     `width` et `height` sont obligatoires : sans taille propre, le SVG serait étiré à la taille du bloc. */
  --ink-panel-frame: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cpolygon points='0,0 46,0 64,18 64,64 18,64 0,46' fill='%230a0c10'/%3E%3Cpolygon points='2,2 45.17,2 62,18.83 62,62 18.83,62 2,45.17' fill='%23ecebe7'/%3E%3Cpolygon points='6.5,6.5 43.31,6.5 57.5,20.69 57.5,57.5 20.69,57.5 6.5,43.31' fill='none' stroke='%230a0c10' stroke-opacity='.25'/%3E%3C/svg%3E");
  --ink-button-frame: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='0,0 30,0 40,10 40,40 0,40' fill='%230a0c10'/%3E%3Cpolygon points='1.5,1.5 29.38,1.5 38.5,10.62 38.5,38.5 1.5,38.5' fill='%23ecebe7'/%3E%3C/svg%3E");
  --ink-button-frame-hover: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='0,0 30,0 40,10 40,40 0,40' fill='%230a0c10'/%3E%3C/svg%3E");
  --ink-button-frame-active: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='0,0 30,0 40,10 40,40 0,40' fill='%230a0c10'/%3E%3Cpolygon points='1.5,1.5 29.38,1.5 38.5,10.62 38.5,38.5 1.5,38.5' fill='%23ecebe7'/%3E%3Crect x='1.5' y='1.5' width='4' height='37' fill='%23d97757'/%3E%3C/svg%3E");
  --ink-button-frame-active-hover: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='0,0 30,0 40,10 40,40 0,40' fill='%230a0c10'/%3E%3Crect x='1.5' y='1.5' width='4' height='37' fill='%23d97757'/%3E%3C/svg%3E");
}

/* ---------- Monolithe ---------- */

.mono-title {
  font-family: var(--font-mono-title);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.82;
  letter-spacing: -0.01em;
  color: var(--world);
}

.mono-title .hot {
  color: var(--threat);
  text-shadow: 0 0 28px rgb(217 119 87 / 0.45);
}

.label {
  font-family: var(--font-label);
  font-weight: 300;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

/* ---------- Encre ---------- */

/* Plaque : fond `world`, trait `ink` de 2 px, coins coupés, filet intérieur à 25 %, ombre décalée `void-2`
   (drop-shadow : elle suit les coins coupés). */
.ink-panel {
  position: relative;
  color: var(--ink);
  font-family: var(--font-ink);
  font-weight: 500;
  border: 22px solid transparent;
  border-image: var(--ink-panel-frame) 22 fill / 22px stretch;
  padding: 8px 12px 4px;
  filter: drop-shadow(10px 10px 0 var(--void-2));
}

.ink-panel h2 {
  font-family: var(--font-ink);
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

/* Bouton : cadre `ink` de 1,5 px, coin coupé. Survol ou focus : fond `ink`, texte `world`.
   Élément actif : filet `threat` de 4 px à gauche. */
.ink-button {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 0 4px 0 6px;
  font-family: var(--font-ink);
  font-weight: 600;
  font-size: 15px;
  line-height: 18px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  background: none;
  border: 12px solid transparent;
  border-image: var(--ink-button-frame) 12 fill / 12px stretch;
  cursor: pointer;
  transition: color var(--t-fast) var(--ease);
}

.ink-button:hover,
.ink-button:focus-visible,
.ink-button.is-focused {
  border-image-source: var(--ink-button-frame-hover);
  color: var(--world);
  outline: none;
}

.ink-button.is-active {
  border-image-source: var(--ink-button-frame-active);
}

.ink-button.is-active:hover,
.ink-button.is-active:focus-visible,
.ink-button.is-active.is-focused {
  border-image-source: var(--ink-button-frame-active-hover);
}

.ink-button:disabled {
  opacity: 0.38;
  cursor: default;
  border-image-source: var(--ink-button-frame);
  color: var(--ink);
}

.ink-button small {
  font-family: var(--font-label);
  font-weight: 400;
  font-size: 11px;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

/* Écran sans mouvement demandé : les transitions restent, les animations d'entrée et d'ambiance s'arrêtent. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 4 : restyler le HUD**

```diff
diff --git a/src/app/hud.ts b/src/app/hud.ts
index 2aefa09..9eaa725 100644
--- a/src/app/hud.ts
+++ b/src/app/hud.ts
@@ -1,12 +1,12 @@
-// Surcouche HTML minimale de la phase « gris » : réticule, messages, panneau debug.
-// Le design system Monolithe + Encre arrive au plan 3.
+// Surcouche du jeu : réticule, messages, chant du replay, panneau debug (styles : style.css et ui/tokens.css).
 
 export type HudMessage = "start" | "paused" | "dead" | "replay" | "won" | "none";
 
 const MESSAGES: Record<Exclude<HudMessage, "none" | "replay">, string> = {
   start: "CLIQUE POUR JOUER",
   paused: "PAUSE ‧ CLIQUE POUR REPRENDRE",
-  dead: "R OU CLIC ‧ RECOMMENCER",
+  // Spec 4.4 : texte discret ; un clic relance aussi.
+  dead: "R ‧ RECOMMENCER",
   won: "R ‧ REJOUER  ·  ESPACE ‧ REVOIR",
 };
 
@@ -38,11 +38,11 @@ export class Hud {
     this.crosshair.hidden = message !== "none";
     if (message === "none" || message === "replay") {
       this.message.textContent = "";
-      this.message.classList.remove("chant");
+      this.message.classList.remove("chant", "hot");
       return;
     }
     this.message.textContent = MESSAGES[message];
-    this.message.classList.remove("chant");
+    this.message.classList.remove("chant", "hot");
   }
 
   // « AGENT » puis « HOT », en alternance toutes les 0,5 s de replay.
@@ -52,6 +52,11 @@ export class Hud {
     this.chantWord = word;
     this.message.textContent = word;
     this.message.classList.add("chant");
+    this.message.classList.toggle("hot", word === "HOT");
+    // Relance l'animation d'arrivée du mot (même classe, nouveau mot).
+    this.message.style.animation = "none";
+    void this.message.offsetWidth;
+    this.message.style.animation = "";
   }
 
   // Le réticule fait un demi-tour quand une balle est chambrée (fin du temps de recharge).
diff --git a/src/app/main.ts b/src/app/main.ts
index fa69a9f..a6dcfbc 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -1,4 +1,5 @@
 // Point d'entrée de la phase « gris » : une salle, sans menu. Machine d'états réduite.
+import "../ui/tokens.css";
 import "./style.css";
 import { GameAudio } from "../audio/game-audio";
 import { ReplayPlayer } from "../replay/player";
diff --git a/src/app/style.css b/src/app/style.css
index 22d8383..174f948 100644
--- a/src/app/style.css
+++ b/src/app/style.css
@@ -1,11 +1,5 @@
-/* Phase « gris » : le strict minimum. Le design system arrive au plan 3. */
-:root {
-  --void: #0d111b;
-  --world: #ecebe7;
-  --threat: #d97757;
-  --ink: #0a0c10;
-}
-
+/* Surcouche du jeu : réticule, messages, chant du replay, teinte de mort, panneau debug.
+   Les tokens (couleurs, polices, mouvement) viennent de src/ui/tokens.css. */
 * {
   box-sizing: border-box;
   margin: 0;
@@ -17,7 +11,8 @@ body {
   overflow: hidden;
   background: var(--void);
   color: var(--world);
-  font-family: ui-monospace, "SF Mono", Menlo, monospace;
+  font-family: var(--font-label);
+  -webkit-font-smoothing: antialiased;
 }
 
 #app canvas {
@@ -30,35 +25,59 @@ body {
   pointer-events: none;
 }
 
+/* Réticule : un petit point carré, qui fait un demi-tour quand une balle est chambrée (spec 4.4). */
 #crosshair {
   position: absolute;
   left: 50%;
   top: 50%;
-  width: 10px;
-  height: 10px;
-  border: 2px solid var(--ink);
+  width: 8px;
+  height: 8px;
+  border: 1.5px solid var(--ink);
   background: var(--world);
   transform: translate(-50%, -50%) rotate(0deg);
-  transition: transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1);
+  transition: transform var(--t-slow) var(--ease);
 }
 
+/* Message discret sous le centre : départ, pause, « R ‧ RECOMMENCER » à la mort. */
 #message {
   position: absolute;
   left: 50%;
-  top: 58%;
+  top: 62%;
   transform: translateX(-50%);
-  font-size: 16px;
-  letter-spacing: 0.2em;
+  font-family: var(--font-label);
+  font-weight: 400;
+  font-size: 13px;
+  letter-spacing: 0.24em;
   color: var(--world);
-  text-shadow: 0 1px 0 var(--ink);
+  text-shadow: 0 1px 0 var(--ink), 0 0 12px rgb(10 12 16 / 0.6);
   white-space: nowrap;
 }
 
+/* Chant du replay (spec 4.4) : « AGENT » / « HOT » en Monolithe, sur le temps fort de la musique. */
 #message.chant {
-  top: 40%;
-  font-size: clamp(64px, 14vw, 200px);
+  top: 50%;
+  transform: translate(-50%, -50%);
+  font-family: var(--font-mono-title);
   font-weight: 900;
-  letter-spacing: 0;
+  font-size: clamp(96px, 22vw, 320px);
+  line-height: 0.82;
+  letter-spacing: -0.01em;
+  color: var(--world);
+  text-shadow: 0 6px 0 var(--ink);
+  animation: chant-slam var(--t-mid) var(--ease);
+}
+
+#message.chant.hot {
+  color: var(--threat);
+  text-shadow: 0 6px 0 var(--ink), 0 0 48px rgb(217 119 87 / 0.5);
+}
+
+/* Chaque mot arrive un peu plus grand et se pose : un coup de poing typographique, sans rebond. */
+@keyframes chant-slam {
+  from {
+    transform: translate(-50%, -50%) scale(1.12);
+    opacity: 0.4;
+  }
 }
 
 #death-tint {
@@ -78,7 +97,7 @@ body {
   position: absolute;
   left: 12px;
   bottom: 12px;
-  font-size: 12px;
+  font-size: 11px;
   color: var(--world);
   background: rgb(10 12 16 / 0.7);
   padding: 6px 10px;
```

- [ ] **Step 5 : tests, types, build, et vérifier dans Chrome**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t6-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `189 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

Puis `http://localhost:5299/?debug`, et ce bloc qui pose un panneau d'essai (rien n'est enregistré) :

```js
const d = document.createElement("div");
d.style.cssText = "position:fixed;left:80px;top:80px;width:420px;z-index:9";
d.className = "ink-panel";
d.innerHTML = '<h2>Pause</h2><div style="display:grid;gap:8px"><button class="ink-button is-active">Reprendre <small>CLIC</small></button><button class="ink-button is-focused">Recommencer <small>R</small></button><button class="ink-button" disabled>Salle 2 <small>BIENTÔT</small></button></div>';
document.body.appendChild(d);
await document.fonts.ready;
[...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight);
```

**Attendu :** au moins `Chakra Petch 600` chargée ; capture zoomée `.superpowers/plan-3a-captures/t6-ink.png` : plaque blanche, trait noir continu y compris sur les deux coins coupés, filet intérieur fin, ombre décalée ; bouton actif avec un filet orange à gauche ; bouton focalisé plein noir ; bouton désactivé estompé.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add scripts/build-fonts.sh public/fonts/big-shoulders-display-800.woff2 public/fonts/big-shoulders-display-900.woff2 public/fonts/chakra-petch-500.woff2 public/fonts/chakra-petch-600.woff2 public/fonts/martian-mono-300-400.woff2 public/fonts/LICENSES.txt src/ui/tokens.css src/app/style.css src/app/hud.ts src/app/main.ts && git commit -m "feat(ui): self-hosted font subsets and the Monolithe + Encre design tokens; HUD restyled"
```

---

### Task 7 : un point d'entrée léger, le chargeur et l'écran mobile (spec 4.1, 4.6, AC-10, AC-12)

`main.ts` ne charge plus Three.js : il décide entre l'écran mobile et le jeu, affiche le chargeur, crée le contexte audio, puis importe le moteur une fois l'invite affichée. Le contenu de l'ancien `main.ts` part dans `engine.ts`, en une fabrique `createEngine(options)`.

Le chargeur : le logo se construit en facettes orange (elles convergent, les lettres se révèlent, les facettes se dissipent), puis « APPUIE SUR UNE TOUCHE », au moins 1,2 s après l'ouverture. Un repère `performance.mark("agenthot:prompt")` date l'invite (AC-10). Le geste débloque le son.

L'écran mobile (Encre, « Joue sur ordi », « Copier le lien », la cinématique en fond quand elle existera) ne charge ni Three.js ni la simulation. Détection : écran tactile seul, **ou** pas de Pointer Lock (iPad avec trackpad, brief plan 3 section 9).

Sans WebGPU ni WebGL2, l'initialisation de Three.js ne rend jamais la main (mesuré en prototypant : bloquée plus de 20 s, le chargeur restait sur « Chargement »). `createRenderer` vérifie donc d'abord qu'un des deux existe, et échoue tout de suite sinon : le chargeur affiche un message (Review Focus 5).

**Files :**
- Create : `src/app/device.ts`, `tests/device.test.ts`, `src/app/engine.ts`, `src/ui/dom.ts`, `src/ui/media.ts`, `src/ui/loader.ts`, `src/ui/mobile.ts`, `src/ui/screens.css`
- Modify : `src/app/main.ts` (réécrit), `index.html`, `src/audio/music.ts`, `src/render/create-renderer.ts`

**Interfaces :**
- Consumes : `GameAudio` (plan 2), `loadSettings`, `browserStorage`, `saveSettings` (tâche 5), `QualityGovernor`, `FrameLimiter`, `basePixelRatio` (tâche 4).
- Produces :
  - `device.ts` : `interface DeviceEnvironment { matchMedia; elementPrototype }`, `TOUCH_ONLY_QUERY`, `playOnDesktopOnly(env)`, `browserEnvironment()` ;
  - `engine.ts` : `interface EngineOptions { audio; settings; debug; forceWebGL; onSettingsChange }`, `interface Engine { applySettings(s); enterRoom() }`, `createEngine(options): Promise<Engine>` ; mode `"idle"` : rien n'est dessiné avant l'entrée dans la salle ;
  - `ui/dom.ts` : `EASE`, `logoMarkup()`, `escapeHtml(text)` ; `ui/media.ts` : `INTRO_VIDEO`, `introVideoMarkup(className, ambient)` ;
  - `LoaderScreen { play(); setProgress(f); waitReady(tasks); waitForGesture(onGesture); fail(message); hide() }`, `LOADER` ; `MobileScreen` ;
  - `MusicTrack.play()` avant la fin du décodage : lecture différée, lancée dès que le morceau est prêt ;
  - `createRenderer` rejette aussitôt (`"neither WebGPU nor WebGL2 is available"`) sans rendu possible.

- [ ] **Step 1 : écrire les tests**

`tests/device.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { type DeviceEnvironment, playOnDesktopOnly } from "../src/app/device";

// Faux navigateur : ce que répondent ses requêtes média, et s'il a le Pointer Lock.
function device(media: { coarse: boolean; anyFine: boolean }, pointerLock: boolean): DeviceEnvironment {
  return {
    matchMedia(query: string) {
      // Seule requête attendue : pointeur principal grossier ET aucun pointeur fin.
      expect(query).toBe("(pointer: coarse) and (not (any-pointer: fine))");
      return { matches: media.coarse && !media.anyFine };
    },
    elementPrototype: pointerLock ? { requestPointerLock() {} } : {},
  };
}

describe("écran « Joue sur ordi » (spec 4.6, AC-12)", () => {
  test("téléphone ou tablette tactile : écran « Joue sur ordi »", () => {
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: false }, false))).toBe(true);
    // Même si le navigateur annonçait le Pointer Lock (Android), le tactile seul ne peut pas jouer.
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: false }, true))).toBe(true);
  });

  test("iPad avec trackpad : pointeur fin présent, mais pas de Pointer Lock dans Safari : écran « Joue sur ordi »", () => {
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: true }, false))).toBe(true);
  });

  test("ordinateur, y compris un portable tactile avec trackpad : le jeu se lance", () => {
    expect(playOnDesktopOnly(device({ coarse: false, anyFine: true }, true))).toBe(false);
    expect(playOnDesktopOnly(device({ coarse: true, anyFine: true }, true))).toBe(false);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/device.test.ts`
Expected : échec, module `../src/app/device` introuvable.

- [ ] **Step 3 : écrire la détection et le moteur**

`src/app/device.ts` :

```ts
// Détection de l'écran « Joue sur ordi » (spec 2 et 4.6). Calcul pur sur un environnement injecté, testé avec bun.
// Sources du brief plan 3 (section 9) : un iPad avec trackpad répond `any-pointer: fine`, mais Safari iOS et iPadOS
// n'a pas de Pointer Lock, dont la salle dépend : sans lui, le jeu démarrerait sans pouvoir se contrôler.

export interface DeviceEnvironment {
  matchMedia(query: string): { matches: boolean };
  // Prototype des éléments du DOM : on y cherche `requestPointerLock`.
  elementPrototype: object;
}

// Écran tactile seul : pointeur principal grossier et aucun pointeur fin (téléphone, tablette sans trackpad).
export const TOUCH_ONLY_QUERY = "(pointer: coarse) and (not (any-pointer: fine))";

export function playOnDesktopOnly(env: DeviceEnvironment): boolean {
  const touchOnly = env.matchMedia(TOUCH_ONLY_QUERY).matches;
  const hasPointerLock = "requestPointerLock" in env.elementPrototype;
  return touchOnly || !hasPointerLock;
}

export function browserEnvironment(): DeviceEnvironment {
  return { matchMedia: (query) => window.matchMedia(query), elementPrototype: Element.prototype };
}
```

`src/app/engine.ts` :

```ts
// Moteur du jeu, chargé à part (import dynamique) : Three.js, la simulation, le replay. Le point d'entrée
// (main.ts) affiche le chargeur sans l'attendre (AC-10 : « APPUIE SUR UNE TOUCHE » en 2 s au plus).
import type { GameAudio } from "../audio/game-audio";
import { ReplayPlayer } from "../replay/player";
import { ReplayRecorder } from "../replay/recorder";
import { basePixelRatio, createRenderer } from "../render/create-renderer";
import { PostPipeline } from "../render/post";
import { FrameLimiter, QualityGovernor } from "../render/quality";
import { WorldRenderer } from "../render/world-renderer";
import { room01 } from "../rooms/room-01-datacenter";
import type { Settings } from "../settings/settings";
import { Game, type PlayerInput, emptyInput } from "../sim/game";
import { TIME } from "../sim/time";
import { createWorldView, writeGameView } from "../sim/view";
import { Hud } from "./hud";
import { InputController } from "./input";

type Mode = "idle" | "start" | "playing" | "paused" | "dead" | "replay" | "won";

// Après la mort, on ignore R et le clic pendant 0,3 s réelle : un clic de tir en rafale ne doit pas sauter l'écran.
const DEAD_INPUT_GUARD_MS = 300;

export interface EngineOptions {
  audio: GameAudio;
  settings: Settings;
  debug: boolean;
  // `?renderer=webgl` : repli WebGL2 forcé (AC-9).
  forceWebGL: boolean;
  // Réglages changés par la sonde debug : le point d'entrée les enregistre.
  onSettingsChange(settings: Settings): void;
}

export interface Engine {
  applySettings(settings: Settings): void;
  // Affiche la salle, prête à jouer : un clic prend la souris et lance la partie.
  enterRoom(): void;
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const { audio, debug } = options;
  const app = document.querySelector<HTMLElement>("#app")!;
  const { renderer, isWebGPU } = await createRenderer(app, options.forceWebGL);
  const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
  const post = new PostPipeline(renderer, world.scene, world.camera);
  const game = new Game(room01);
  const view = createWorldView(room01.boxes.length, game.shatter.shards);
  const recorder = new ReplayRecorder();
  const replay = new ReplayPlayer(recorder, room01);
  const input = new InputController(renderer.domElement);
  const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
  // Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative, selon le réglage Qualité.
  const quality = new QualityGovernor(options.settings.quality);
  const limiter = new FrameLimiter();
  let settings = options.settings;

  // Applique les paramètres à chaud (spec 4.5) : souris, champ de vision, volumes, qualité.
  function applySettings(next: Settings): void {
    settings = next;
    input.sensitivity = next.sensitivity;
    input.invertY = next.invertY;
    world.setFov(next.fov);
    audio.engine.setVolumes(next.musicVolume / 100, next.sfxVolume / 100);
    if (quality.mode !== next.quality) quality.setMode(next.quality);
    renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
  }
  applySettings(settings);

  let mode: Mode = "idle";
  let last = performance.now();
  let restartPending = false;
  let deadSince = 0;
  let fpsFrames = 0;
  let fpsTime = 0;
  let fps = 0;

  function startRun(): void {
    game.reset();
    recorder.reset();
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    input.clear();
    hud.resetCrosshair();
    audio.playGameMusic();
  }

  function setMode(next: Mode): void {
    mode = next;
    if (next === "dead") deadSince = performance.now();
    // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
    if (next === "dead" || next === "replay" || next === "won") input.clear();
    hud.show(next === "playing" || next === "idle" ? "none" : next);
    // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
    post.setDeath(next === "dead" ? 1 : 0);
  }

  // Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
  // Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
  renderer.domElement.addEventListener("click", () => {
    audio.unlock();
    if (mode !== "idle" && mode !== "playing" && !input.locked) input.lock();
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
  setMode("idle");

  // Sonde de vérification, en debug seulement : fait avancer la partie sans pointer lock (captures, AC-8).
  if (debug) {
    (window as unknown as { agenthot: unknown }).agenthot = {
      renderer,
      game,
      post,
      world,
      input,
      // Change des réglages comme le fera le panneau Paramètres : appliqués et enregistrés.
      settings(patch: Partial<Settings>): Settings {
        applySettings({ ...settings, ...patch });
        options.onSettingsChange(settings);
        return settings;
      },
      advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
        const frameInput = { ...emptyInput(), ...overrides };
        for (let t = 0; t < seconds; t += 1 / 60) {
          game.step(1 / 60, frameInput);
          frameInput.fire = false;
          frameInput.throw = false;
        }
        writeGameView(game, view);
        world.update(view);
        // Le rendu reste celui de la boucle : ses appels de dessin se lisent dans le panneau debug.
      },
    };
  }

  renderer.setAnimationLoop(() => {
    // Rien à montrer tant que la salle n'est pas ouverte : le GPU se repose (chargeur, cinématique).
    if (mode === "idle") return;
    const now = performance.now();
    // Écran plus rapide que la limite : on saute cette image de l'écran, rien n'avance.
    if (!limiter.shouldRender(now, quality.fpsCap)) return;
    if (quality.sample(now - last)) renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
    // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Sonde AC-6 : mesurée de l'appui (R ou clic) à l'image qui suit la relance, quand la précédente est rendue.
    if (restartPending) {
      if (debug) console.info(`[agenthot] restart ${(performance.now() - input.lastRestartInputTime).toFixed(1)} ms`);
      restartPending = false;
    }

    if (mode === "playing") {
      const simDt = game.step(dt, input.sample());
      writeGameView(game, view);
      for (let i = 0; i < game.events.count; i++) if (game.events.items[i]!.type === "punch") world.viewModel.punch();
      recorder.recordEvents(game.events);
      recorder.capture(game.simTime, view, game.status !== "playing");
      audio.frame(view, game.events);
      hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
      world.update(view, simDt);
      if (game.status === "dead") setMode("dead");
      if (game.status === "won") {
        // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
        if (debug) console.info(`[agenthot] replay sim ${game.simTime.toFixed(2)} s vs duration ${replay.duration.toFixed(2)} s`);
        replay.restart();
        audio.playReplayMusic();
        setMode("replay");
      }
    } else if (mode === "dead" || mode === "won") {
      // Temps figé : le son reste grave et étouffé.
      audio.freeze(TIME.min);
      // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
      const clicked = input.consumeFire() && mode === "dead";
      const pressedR = input.consumePress("KeyR");
      // Pendant la garde, R et le clic sont écartés (consommés ci-dessus), pas mis en attente.
      const guarded = mode === "dead" && now - deadSince < DEAD_INPUT_GUARD_MS;
      if (!guarded && (pressedR || clicked)) {
        restartPending = true;
        startRun();
        // Sans verrou (Échap sur l'écran de fin), on le redemande et on attend qu'il revienne.
        if (input.locked) setMode("playing");
        else {
          input.lock();
          setMode("paused");
        }
        world.update(view);
      } else if (mode === "won" && input.consumePress("Space")) {
        replay.restart();
        audio.playReplayMusic();
        setMode("replay");
      }
    } else if (mode === "replay") {
      replay.update(dt);
      world.update(replay.view, dt);
      audio.frame(replay.view, replay.events);
      hud.chant(replay.playhead);
      if (replay.finished) setMode("won");
    } else {
      // Départ et pause : la partie est figée, le son aussi.
      audio.freeze(TIME.min);
    }

    post.render();

    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fps = fpsFrames / fpsTime;
      fpsFrames = 0;
      fpsTime = 0;
      if (debug) {
        hud.setDebug(
          `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ res ${quality.scale} ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
            `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
        );
      }
    }
  });

  return {
    applySettings,
    enterRoom(): void {
      last = performance.now();
      setMode("start");
    },
  };
}
```

- [ ] **Step 4 : écrire les écrans**

`src/ui/dom.ts` :

```ts
// Petits outils partagés par les écrans : courbe de mouvement, logo, échappement de texte.

// Courbe de la spec 6.3, pour les animations lancées en JavaScript (Web Animations API).
export const EASE = "cubic-bezier(0.2, 0.9, 0.2, 1)";

// Logo Monolithe : « AGENT » en `world`, « HOT » en `threat`, une lettre par span (animées une à une).
export function logoMarkup(): string {
  const letters = (word: string) => [...word].map((c) => `<span class="logo-letter">${c}</span>`).join("");
  return `<h1 class="logo mono-title" aria-label="AGENTHOT"><span class="logo-word">${letters("AGENT")}</span><span class="logo-word hot">${letters("HOT")}</span></h1>`;
}

// Texte sûr dans du HTML (titres de salles, messages).
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
```

`src/ui/media.ts` :

```ts
// Fichiers de la cinématique (spec 4.2), fabriqués au plan 3b : WebM AV1, repli MP4 H.264.
// Tant qu'ils n'existent pas, les écrans qui les lisent se passent de vidéo, sans erreur.
export const INTRO_VIDEO = {
  webm: "/video/intro.webm",
  mp4: "/video/intro.mp4",
} as const;

// Balise <video> de la cinématique. `ambient` : muette, en boucle, lancée seule (écran mobile).
export function introVideoMarkup(className: string, ambient: boolean): string {
  const flags = ambient ? "muted loop autoplay" : "";
  return `<video class="${className}" playsinline preload="auto" ${flags}>
    <source src="${INTRO_VIDEO.webm}" type='video/webm; codecs="av01.0.08M.08"'>
    <source src="${INTRO_VIDEO.mp4}" type="video/mp4">
  </video>`;
}
```

`src/ui/loader.ts` :

```ts
// Écran de chargement (spec 4.1) : le logo se construit en facettes orange, puis « APPUIE SUR UNE TOUCHE ».
// Au moins 1,2 s, même si tout est prêt, pour poser l'univers. Le geste attendu débloque le son.
import { Rng } from "../sim/rng";
import { EASE, logoMarkup } from "./dom";

export const LOADER = {
  minDurationMs: 1200,
  facets: 18,
  // Graine des facettes : le même logo à chaque visite.
  seed: 0xa9e47,
} as const;

export class LoaderScreen {
  readonly root: HTMLElement;
  private readonly shownAt = performance.now();

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen loader";
    this.root.innerHTML = `
      <div class="loader-stage">
        <div class="loader-logo">${logoMarkup()}<div class="loader-facets" aria-hidden="true"></div></div>
        <div class="loader-bar" aria-hidden="true"><i></i></div>
        <p class="label loader-status">Chargement</p>
        <p class="loader-prompt" hidden>Appuie sur une touche</p>
      </div>`;
    parent.appendChild(this.root);
  }

  // Joue l'arrivée du logo : les facettes convergent vers les lettres, les lettres se révèlent, les facettes
  // se dissipent. Motion design léger : une seule séquence, puis plus rien ne bouge que l'invite.
  async play(): Promise<void> {
    // Le logo attend sa police (préchargée dans index.html), au plus 0,8 s.
    await Promise.race([
      document.fonts.load('900 1em "Big Shoulders Display"'),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
    const logo = this.root.querySelector<HTMLElement>(".loader-logo")!;
    const facets = this.root.querySelector<HTMLElement>(".loader-facets")!;
    const rng = new Rng(LOADER.seed);
    for (let i = 0; i < LOADER.facets; i++) {
      const facet = document.createElement("i");
      // Triangle irrégulier, posé quelque part sur la surface du logo.
      const a = `${rng.range(0, 45)}% 0`;
      const b = `100% ${rng.range(30, 100)}%`;
      const c = `${rng.range(0, 60)}% 100%`;
      facet.style.clipPath = `polygon(${a}, ${b}, ${c})`;
      facet.style.left = `${rng.range(0, 92)}%`;
      facet.style.top = `${rng.range(0, 85)}%`;
      const size = rng.range(0.18, 0.42);
      facet.style.width = `${size}em`;
      facet.style.height = `${size * rng.range(0.8, 1.4)}em`;
      if (rng.next() < 0.25) facet.classList.add("hot");
      facets.appendChild(facet);
      const dx = rng.range(-3.5, 3.5);
      const dy = rng.range(-2, 2);
      const turn = rng.range(-240, 240);
      facet.animate(
        [
          { transform: `translate(${dx}em, ${dy}em) rotate(${turn}deg) scale(0.3)`, opacity: 0 },
          { transform: "none", opacity: 1, offset: 0.62 },
          { transform: `translate(${dx * 0.08}em, ${dy * 0.08}em) rotate(${turn * 0.05}deg) scale(0.6)`, opacity: 0 },
        ],
        { duration: 1100, delay: i * 22, easing: EASE, fill: "both" },
      );
    }
    const letters = logo.querySelectorAll<HTMLElement>(".logo-letter");
    letters.forEach((letter, i) => {
      letter.animate(
        [
          { clipPath: "inset(100% 0 0 0)", transform: "translateY(0.12em)" },
          { clipPath: "inset(0 0 0 0)", transform: "none" },
        ],
        // « backwards » : lettre cachée pendant son attente, puis plus aucun clip-path une fois révélée (il
        // couperait la lueur de « HOT » en rectangle).
        { duration: 320, delay: 420 + i * 45, easing: EASE, fill: "backwards" },
      );
    });
  }

  // Avancement du chargement, de 0 à 1 (filet sous le logo).
  setProgress(fraction: number): void {
    const bar = this.root.querySelector<HTMLElement>(".loader-bar i")!;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, fraction))})`;
  }

  // Attend `tasks` et la durée minimale, puis affiche l'invite. Une tâche qui échoue n'empêche pas d'entrer.
  async waitReady(tasks: Promise<unknown>[]): Promise<void> {
    let done = 0;
    const tracked = tasks.map((task) =>
      task.catch(() => undefined).finally(() => this.setProgress(++done / tasks.length)),
    );
    const remaining = LOADER.minDurationMs - (performance.now() - this.shownAt);
    await Promise.all([...tracked, new Promise((resolve) => setTimeout(resolve, Math.max(0, remaining)))]);
    this.root.querySelector<HTMLElement>(".loader-status")!.hidden = true;
    this.root.querySelector<HTMLElement>(".loader-bar")!.hidden = true;
    this.root.querySelector<HTMLElement>(".loader-prompt")!.hidden = false;
    // Repère AC-10 : l'invite est affichée (lu par performance.getEntriesByName("agenthot:prompt")).
    performance.mark("agenthot:prompt");
  }

  // Premier geste (touche ou clic). `onGesture` s'exécute dans le gestionnaire même : c'est là que le
  // navigateur autorise le son.
  waitForGesture(onGesture: () => void): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: Event): void => {
        // Les touches de modification seules (Maj, Cmd pour une capture) ne comptent pas.
        if (event instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
        window.removeEventListener("keydown", handler);
        window.removeEventListener("pointerdown", handler);
        onGesture();
        resolve();
      };
      window.addEventListener("keydown", handler);
      window.addEventListener("pointerdown", handler);
    });
  }

  // Échec du moteur : l'invite laisse place au message, le logo reste.
  fail(message: string): void {
    const prompt = this.root.querySelector<HTMLElement>(".loader-prompt")!;
    prompt.textContent = message;
    prompt.classList.add("is-error");
    prompt.hidden = false;
  }

  async hide(): Promise<void> {
    await this.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: EASE, fill: "forwards" }).finished;
    this.root.remove();
  }
}
```

`src/ui/mobile.ts` :

```ts
// Écran « Joue sur ordi » (spec 4.6) : style Encre, la cinématique en fond, un bouton « Copier le lien ».
// Aucune initialisation du moteur : ce module ne charge ni Three.js ni la simulation.
import { logoMarkup } from "./dom";
import { introVideoMarkup } from "./media";

export class MobileScreen {
  readonly root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen mobile";
    this.root.innerHTML = `
      ${introVideoMarkup("mobile-video", true)}
      <div class="mobile-stack">
        ${logoMarkup()}
        <div class="ink-panel mobile-panel">
          <h2>Joue sur ordi</h2>
          <p class="mobile-text">AGENTHOT se joue au clavier et à la souris. Ouvre ce lien sur un ordinateur : le temps n'avance que quand tu bouges.</p>
          <button type="button" class="ink-button" data-action="copy">Copier le lien <small>URL</small></button>
          <p class="label mobile-feedback" aria-live="polite"></p>
        </div>
      </div>`;
    parent.appendChild(this.root);
    const video = this.root.querySelector<HTMLVideoElement>("video")!;
    // Cinématique absente (pas encore fabriquée) ou illisible : le navigateur essaie chaque source dans l'ordre ;
    // l'échec de la dernière veut dire qu'aucune ne marche. L'écran reste alors sur le vide, sans erreur.
    video.querySelector("source:last-of-type")!.addEventListener("error", () => video.remove());
    this.root.querySelector("[data-action=copy]")!.addEventListener("click", () => void this.copyLink());
  }

  private async copyLink(): Promise<void> {
    const feedback = this.root.querySelector<HTMLElement>(".mobile-feedback")!;
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      feedback.textContent = "Lien copié";
    } catch {
      // Presse-papiers refusé (contexte non sécurisé, permission) : on montre le lien à copier à la main.
      feedback.textContent = url;
    }
  }
}
```

`src/ui/screens.css` :

```css
/* Écrans de l'interface (spec 4) : couche au-dessus du canvas et du HUD. */

#screens {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.screen {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

/* ---------- Logo Monolithe ---------- */

.logo {
  display: flex;
  flex-direction: column;
  font-size: clamp(72px, 13vw, 190px);
}

.logo-word {
  display: block;
  white-space: nowrap;
}

.logo-letter {
  display: inline-block;
}

/* ---------- Chargement (spec 4.1) ---------- */

.loader {
  display: grid;
  place-items: center;
  background: var(--void);
}

.loader-stage {
  display: grid;
  justify-items: center;
  gap: 28px;
}

.loader-logo {
  position: relative;
  font-size: clamp(72px, 13vw, 190px);
}

.loader-facets {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.loader-facets i {
  position: absolute;
  display: block;
  background: var(--threat);
  box-shadow: 0 0 18px rgb(217 119 87 / 0.5);
}

.loader-facets i.hot {
  background: var(--threat-hot);
}

.loader-bar {
  width: min(280px, 60vw);
  height: 1px;
  background: rgb(201 203 208 / 0.18);
}

.loader-bar i {
  display: block;
  height: 100%;
  background: var(--world-2);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--t-slow) var(--ease);
}

.loader-prompt {
  font-family: var(--font-ink);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--world);
  animation:
    prompt-in var(--t-slow) var(--ease) both,
    prompt-breathe 1.6s ease-in-out 250ms infinite alternate;
}

.loader-prompt.is-error {
  max-width: min(520px, 90vw);
  text-align: center;
  line-height: 1.6;
  letter-spacing: 0.12em;
  animation: none;
}

@keyframes prompt-in {
  from {
    opacity: 0;
    transform: translateY(8px);
    letter-spacing: 0.5em;
  }
}

@keyframes prompt-breathe {
  to {
    opacity: 0.5;
  }
}

/* ---------- Mobile (spec 4.6) ---------- */

.mobile {
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--void);
  overflow: auto;
}

.mobile-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35;
}

.mobile-stack {
  position: relative;
  display: grid;
  gap: 28px;
  justify-items: center;
  width: min(420px, 100%);
}

.mobile .logo {
  font-size: clamp(64px, 24vw, 120px);
  text-align: center;
}

.mobile-panel {
  width: 100%;
}

.mobile-text {
  font-size: 15px;
  line-height: 1.55;
  margin-bottom: 18px;
}

.mobile-feedback {
  margin-top: 12px;
  min-height: 1.4em;
  color: #5b6170;
  word-break: break-all;
}
```

- [ ] **Step 5 : réécrire le point d'entrée, la page, la lecture différée**

`src/app/main.ts` :

```ts
// Point d'entrée : léger, sans Three.js. Il affiche le chargeur (ou l'écran mobile) tout de suite, pendant que
// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → salle (spec 4).
import "../ui/tokens.css";
import "../ui/screens.css";
import "./style.css";
import { GameAudio } from "../audio/game-audio";
import { browserStorage, loadSettings, saveSettings } from "../settings/settings";
import { TIME } from "../sim/time";
import { LoaderScreen } from "../ui/loader";
import { MobileScreen } from "../ui/mobile";
import { browserEnvironment, playOnDesktopOnly } from "./device";

const params = new URLSearchParams(window.location.search);
const screens = document.querySelector<HTMLElement>("#screens")!;

if (playOnDesktopOnly(browserEnvironment())) {
  // Téléphone, tablette, iPad sans Pointer Lock : aucun moteur, aucune musique (spec 4.6).
  new MobileScreen(screens);
} else {
  void boot();
}

async function boot(): Promise<void> {
  const loader = new LoaderScreen(screens);
  void loader.play();
  const storage = browserStorage();
  const settings = loadSettings(storage);
  // Contexte audio créé tout de suite, suspendu jusqu'au premier geste : les musiques se décodent pendant ce temps.
  const audio = new GameAudio();
  audio.engine.setVolumes(settings.musicVolume / 100, settings.sfxVolume / 100);
  // Musiques du jeu et du replay : décodées en arrière-plan, sans retenir le chargeur (0,1 à 1,5 s par morceau,
  // mesuré le 2026-09-29). Une musique demandée avant la fin de son décodage démarre dès qu'elle est prête.
  void audio.loadMusic();
  // Onglet en arrière-plan : la boucle d'animation s'arrête et avec elle le gel du son, qui vit dans cette
  // boucle. On fige les filtres (freeze) puis on suspend tout le contexte, sinon la musique du replay et le
  // bourdon continueraient pendant que l'image est figée. Au retour, le contexte reprend s'il tournait.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.freeze(TIME.min);
    audio.setHidden(document.hidden);
  });
  // Tout geste peut débloquer le son (le navigateur ne l'autorise que dans un clic ou une touche).
  window.addEventListener("keydown", () => audio.unlock());
  window.addEventListener("pointerdown", () => audio.unlock());

  await loader.waitReady([document.fonts.ready]);
  // Le moteur (Three.js, 90 % du code, puis l'initialisation du rendu) se charge une fois l'invite affichée,
  // pendant que le joueur la lit : il ne dispute pas le fil principal au chargeur (AC-10).
  const engine = import("./engine").then(({ createEngine }) =>
    createEngine({
      audio,
      settings,
      debug: params.has("debug"),
      forceWebGL: params.get("renderer") === "webgl",
      onSettingsChange: (next) => saveSettings(storage, next),
    }),
  );
  // Rejet traité plus bas, après le geste : on le marque comme attendu dès maintenant.
  engine.catch(() => undefined);
  await loader.waitForGesture(() => audio.unlock());
  try {
    const ready = await engine;
    await loader.hide();
    ready.enterRoom();
  } catch (error) {
    // Ni WebGPU ni WebGL2 : on le dit au lieu d'un écran noir.
    console.error("[agenthot] engine failed", error);
    loader.fail("Ton navigateur ne peut pas afficher le jeu : WebGL2 est nécessaire.");
  }
}
```

```diff
diff --git a/index.html b/index.html
index 48fa96b..e5ac009 100644
--- a/index.html
+++ b/index.html
@@ -3,7 +3,12 @@
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <meta name="theme-color" content="#0d111b" />
     <title>AGENTHOT</title>
+    <!-- Polices du logo et des petits textes, préchargées : le chargeur les affiche dès la première seconde. -->
+    <link rel="preload" href="/fonts/big-shoulders-display-900.woff2" as="font" type="font/woff2" crossorigin />
+    <link rel="preload" href="/fonts/martian-mono-300-400.woff2" as="font" type="font/woff2" crossorigin />
+    <link rel="preload" href="/fonts/chakra-petch-600.woff2" as="font" type="font/woff2" crossorigin />
   </head>
   <body>
     <div id="app"></div>
@@ -13,6 +18,7 @@
       <div id="death-tint"></div>
       <div id="debug"></div>
     </div>
+    <div id="screens"></div>
     <script type="module" src="/src/app/main.ts"></script>
   </body>
 </html>
diff --git a/src/audio/music.ts b/src/audio/music.ts
index 688f6e9..f887b75 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -35,6 +35,8 @@ export function musicPlayback(name: TrackName, bufferDuration: number): MusicPla
 export class MusicTrack {
   private buffer: AudioBuffer | null = null;
   private source: AudioBufferSourceNode | null = null;
+  // Lecture demandée avant la fin du décodage : elle démarre dès que le morceau est prêt.
+  private pending = false;
   private readonly ctx: BaseAudioContext;
   private readonly out: AudioNode;
   private readonly url: string;
@@ -53,6 +55,7 @@ export class MusicTrack {
       const response = await fetch(this.url);
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
       this.buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
+      if (this.pending) this.play();
     } catch (error) {
       console.warn(`[agenthot] music ${this.url} unavailable`, error);
     }
@@ -65,7 +68,10 @@ export class MusicTrack {
   // Repart du début du son (après le silence de tête), en boucle sur la fenêtre sans silence.
   play(): void {
     this.stop();
-    if (!this.buffer) return;
+    if (!this.buffer) {
+      this.pending = true;
+      return;
+    }
     const { offset, loopStart, loopEnd } = musicPlayback(this.name, this.buffer.duration);
     this.source = new AudioBufferSourceNode(this.ctx, { buffer: this.buffer, loop: true, loopStart, loopEnd });
     this.source.connect(this.out);
@@ -73,6 +79,7 @@ export class MusicTrack {
   }
 
   stop(): void {
+    this.pending = false;
     if (!this.source) return;
     this.source.stop();
     this.source.disconnect();
diff --git a/src/render/create-renderer.ts b/src/render/create-renderer.ts
index b4754a9..4f543ed 100644
--- a/src/render/create-renderer.ts
+++ b/src/render/create-renderer.ts
@@ -7,6 +7,9 @@ export interface RendererHandle {
 }
 
 export async function createRenderer(container: HTMLElement, forceWebGL: boolean): Promise<RendererHandle> {
+  // Sans WebGPU ni WebGL2, l'initialisation de Three.js ne rend jamais la main (mesuré le 2026-09-29 : bloquée plus
+  // de 20 s) : on le vérifie avant, pour que le chargeur affiche un message au lieu d'attendre sans fin.
+  if (!hasRendering(forceWebGL)) throw new Error("neither WebGPU nor WebGL2 is available");
   const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
   renderer.setPixelRatio(basePixelRatio(true));
   renderer.setSize(window.innerWidth, window.innerHeight);
@@ -27,3 +30,9 @@ export async function createRenderer(container: HTMLElement, forceWebGL: boolean
 export function basePixelRatio(isWebGPU: boolean): number {
   return Math.min(window.devicePixelRatio, isWebGPU ? 2 : 1.5);
 }
+
+// WebGPU (sauf repli forcé) ou, à défaut, un contexte WebGL2.
+function hasRendering(forceWebGL: boolean): boolean {
+  if (!forceWebGL && "gpu" in navigator && navigator.gpu) return true;
+  return document.createElement("canvas").getContext("webgl2") !== null;
+}
```

- [ ] **Step 6 : tests, types, build, et vérifier dans Chrome**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t7-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build 2>&1 | tee .superpowers/plan-3a-t7-build.log`
Expected : `192 pass`, `0 fail` ; `tsc` sans sortie ; le build sort **deux** fichiers JavaScript : `index-*.js` (environ 17 Ko, 6,5 Ko gzip) et `engine-*.js` (environ 990 Ko, 275 Ko gzip).

Dans Chrome, `http://localhost:5299/?debug` :
1. `performance.getEntriesByName("agenthot:prompt")[0].startTime` après l'invite. **Attendu :** entre 1 200 et 2 000 ms (prototype : 1 257 ms, serveur local). Captures `t7-loader-facets.png` (pendant l'animation) et `t7-loader-prompt.png`. **Attendu :** facettes orange qui convergent, puis logo AGENT (blanc) / HOT (orange, halo rond, jamais rectangulaire), filet de progression, puis l'invite qui respire doucement.
2. Une touche : le chargeur s'efface, la salle s'affiche avec « CLIQUE POUR JOUER ». Un clic prend la souris et lance la partie (fenêtre au premier plan ; sinon, noter « verrou refusé »).
3. Écran mobile, cas iPad avec trackpad (AC-12) : dans une page neuve,
   ```js
   document.querySelector("#screens").innerHTML = "";
   delete Element.prototype.requestPointerLock;
   await import("/src/app/main.ts?mobile=" + Date.now());
   ```
   **Attendu :** l'écran « Joue sur ordi » (logo, plaque Encre, bouton « Copier le lien ») ; `window.agenthot` vaut `undefined` (moteur jamais chargé) ; capture `t7-mobile.png`.
4. Écran mobile, cas téléphone (AC-12) : MCP Chrome DevTools, `emulate` avec `viewport: "390x844x3,mobile,touch"`, puis recharger `http://localhost:5299/`. **Attendu :** même écran, lisible sur 390 px de large, console sans erreur. Si le MCP DevTools est pris par une autre session, le noter : la tâche 12 le refait.
5. « Copier le lien » : message « Lien copié », ou l'adresse affichée si le presse-papiers est refusé.
6. Échec du moteur (Review Focus 5) : ouvrir `http://localhost:5299/?nogpu`, et **tout de suite** (avant l'invite, donc avant que le moteur ne se charge) :
   ```js
   Object.defineProperty(Navigator.prototype, "gpu", { get: () => undefined, configurable: true });
   const orig = HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
     return type === "webgl2" || type === "webgpu" ? null : orig.call(this, type, ...rest);
   };
   ```
   puis une touche après l'invite. **Attendu :** le logo reste, et le message « Ton navigateur ne peut pas afficher le jeu : WebGL2 est nécessaire. » remplace l'invite, en moins d'une seconde (prototype : rejet en 4 ms). Fermer l'onglet ensuite (ne pas appliquer ces lignes sur une page dont le moteur tourne déjà : chaque image lèverait une erreur).

- [ ] **Step 7 : commit**

```bash
cd <racine> && git add src/app/device.ts tests/device.test.ts src/app/engine.ts src/ui/dom.ts src/ui/media.ts src/ui/loader.ts src/ui/mobile.ts src/ui/screens.css src/app/main.ts index.html src/audio/music.ts && git commit -m "feat(app): light boot entry with a lazily loaded engine, faceted loader, mobile screen"
```

---

### Task 8 : la salle figée derrière le menu, sa musique et ses sons (spec 4.3, 6.3, 7.2)

Le fond du menu : `recordMenuDemo(room01)` joue une partie scriptée (le joueur avance vers la passerelle en visant son ennemi et tire à l'image 70) et en garde la fenêtre 1,15 à 2,04 s. Le moteur la rejoue à 3 % du temps, la caméra dérive en hauteur, un fondu au vide ouvre et ferme chaque boucle. Pas d'arme en main ni de bourdon dans le menu.

Côté son : une troisième piste, la boucle du menu (`/audio/menu.mp3`, générée au plan 3b ; d'ici là, absente et muette), une entrée audio `uiIn` non filtrée pour les sons d'interface (survol, validation, retour, synthétisés). Une seule musique à la fois.

**Files :**
- Create : `src/replay/menu-demo.ts`, `tests/menu-demo.test.ts`, `src/audio/ui-sfx.ts`
- Modify : `tests/music-loop.test.ts`, `src/audio/music.ts`, `src/audio/audio-engine.ts`, `src/audio/game-audio.ts`, `src/render/post.ts`, `src/app/engine.ts`

**Interfaces :**
- Consumes : `Game`, `ReplayRecorder`, `ReplayPlayer` (plans 1 et 2), `room01`.
- Produces :
  - `menu-demo.ts` : `MENU_DEMO`, `recordMenuDemo(room): ReplayRecorder`, `menuFade(playhead, duration)`, `MENU_CAMERA`, `interface MenuCameraPose`, `menuCamera(t, out)` ;
  - `PostPipeline.setFade(amount)` ;
  - `AudioEngine.uiIn` ; `type UiSound`, `playUiSound(kit, out, when, sound)` ; `TrackName` gagne `"menu"` ;
  - `GameAudio.loadMenuMusic()`, `playMenuMusic()`, `ui(sound)`, `setDrone(on)` ;
  - `Engine.showMenu()` ; sonde debug `window.agenthot.menu()` (retirée à la tâche 10, quand le vrai menu l'ouvre).

- [ ] **Step 1 : écrire les tests**

`tests/menu-demo.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { MENU_CAMERA, MENU_DEMO, type MenuCameraPose, menuCamera, menuFade, recordMenuDemo } from "../src/replay/menu-demo";
import { ReplayPlayer } from "../src/replay/player";
import { EVENT_STRIDE, LAYOUT, RECORDED_EVENTS } from "../src/replay/recorder";
import { room01 } from "../src/rooms/room-01-datacenter";

// Types des événements enregistrés dans la démo, dans l'ordre.
function eventTypes(recorder: ReturnType<typeof recordMenuDemo>): string[] {
  const types: string[] = [];
  for (let i = 0; i < recorder.eventCount; i++) types.push(RECORDED_EVENTS[recorder.events[i * EVENT_STRIDE + 1]!]!);
  return types;
}

describe("fond du menu : la démo (spec 4.3)", () => {
  const demo = recordMenuDemo(room01);

  test("la fenêtre dure de 1,15 à 2,04 s de simulation, soit une trentaine de secondes à 3 %", () => {
    const player = new ReplayPlayer(demo, room01);
    expect(player.duration).toBeGreaterThan(0.85);
    expect(player.duration).toBeLessThan(0.92);
    expect(player.duration / MENU_DEMO.playbackRate).toBeGreaterThan(28);
  });

  test("elle montre l'action : un ennemi éclate, deux baies explosent, les ennemis tirent, et le joueur est vivant", () => {
    const types = eventTypes(demo);
    expect(types.filter((t) => t === "enemyKilled").length).toBe(1);
    expect(types.filter((t) => t === "rackBurst").length).toBe(2);
    expect(types.filter((t) => t === "shot").length).toBeGreaterThanOrEqual(2);
    expect(types).not.toContain("playerKilled");
  });

  test("à la fin de la fenêtre, au moins deux balles sont en vol (les balles suspendues du menu)", () => {
    const player = new ReplayPlayer(demo, room01);
    player.update(player.duration);
    expect(player.view.bullets.filter((b) => b.active).length).toBeGreaterThanOrEqual(2);
  });

  test("la démo est la même à chaque visite (simulation déterministe à entrées égales)", () => {
    const again = recordMenuDemo(room01);
    expect(again.count).toBe(demo.count);
    expect(again.eventCount).toBe(demo.eventCount);
    const size = demo.count * LAYOUT.stride;
    expect(Array.from(again.samples.subarray(0, size))).toEqual(Array.from(demo.samples.subarray(0, size)));
  });
});

describe("fond du menu : la boucle", () => {
  test("la démo part du vide et y retourne en 1,2 s réelles : la reprise de la boucle ne se voit pas", () => {
    const d = 0.89;
    const oneRealSecond = MENU_DEMO.playbackRate;
    expect(menuFade(0, d)).toBe(1);
    expect(menuFade(d, d)).toBe(1);
    expect(menuFade(d / 2, d)).toBe(0);
    expect(menuFade(oneRealSecond * 0.6, d)).toBeCloseTo(0.5, 6);
    expect(menuFade(d - oneRealSecond * 1.2, d)).toBeCloseTo(0, 6);
  });
});

describe("fond du menu : la caméra qui dérive", () => {
  test("elle reste dans la salle, au-dessus des baies, et regarde toujours vers le fond (−Z)", () => {
    const pose: MenuCameraPose = { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 };
    for (let t = 0; t < MENU_CAMERA.period; t += 0.5) {
      menuCamera(t, pose);
      expect(Math.abs(pose.pos.x)).toBeLessThan(11.5);
      expect(Math.abs(pose.pos.z)).toBeLessThan(7.5);
      expect(pose.pos.y).toBeGreaterThan(2.2);
      expect(pose.pos.y).toBeLessThan(5.5);
      // Avant = (−sin lacet, −cos lacet) : composante z négative.
      expect(-Math.cos(pose.yaw)).toBeLessThan(0);
    }
  });

  test("elle boucle sans à-coup : même pose au début et à la fin d'une période", () => {
    const a = menuCamera(0, { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 });
    const b = menuCamera(MENU_CAMERA.period, { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 });
    expect(b.pos.x).toBeCloseTo(a.pos.x, 9);
    expect(b.pos.y).toBeCloseTo(a.pos.y, 9);
    expect(b.yaw).toBeCloseTo(a.yaw, 9);
  });
});
```

```diff
diff --git a/tests/music-loop.test.ts b/tests/music-loop.test.ts
index 002e073..9de1ea8 100644
--- a/tests/music-loop.test.ts
+++ b/tests/music-loop.test.ts
@@ -4,7 +4,7 @@ import { type TrackName, musicPlayback } from "../src/audio/music";
 // Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
 //   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
 //   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
-const MEASURED: Record<TrackName, { duration: number; headSilenceEnd: number; tailSilenceStart: number }> = {
+const MEASURED: Record<Exclude<TrackName, "menu">, { duration: number; headSilenceEnd: number; tailSilenceStart: number }> = {
   // game.mp3 : pas de silence de tête ; 2,57 s de silence de 89,14 s à la fin.
   game: { duration: 91.715875, headSilenceEnd: 0, tailSilenceStart: 89.143537 },
   // replay.mp3 : 2,69 s de silence au début, 2,34 s à la fin.
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/menu-demo.test.ts`
Expected : échec, module `../src/replay/menu-demo` introuvable.

- [ ] **Step 3 : écrire la démo et la caméra**

`src/replay/menu-demo.ts` :

```ts
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
```

- [ ] **Step 4 : écrire les sons d'interface et la piste du menu**

`src/audio/ui-sfx.ts` :

```ts
// Sons d'interface du menu (spec 4.3 et 7.3) : survol, validation, retour. Synthétisés, courts, secs, « tech ».
import type { SfxKit } from "./sfx";

export type UiSound = "hover" | "select" | "back";

// Petit bip à enveloppe rapide, avec glissement de fréquence de `from` à `to` Hz.
function blip(kit: SfxKit, out: AudioNode, when: number, type: OscillatorType, from: number, to: number, peak: number, duration: number): void {
  const osc = new OscillatorNode(kit.ctx, { type, frequency: from });
  osc.frequency.setValueAtTime(from, when);
  osc.frequency.exponentialRampToValueAtTime(to, when + duration);
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(g).connect(out);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

// Clic de bruit très court, filtré haut : l'attaque « mécanique » d'une touche.
function tick(kit: SfxKit, out: AudioNode, when: number, frequency: number, peak: number): void {
  const src = new AudioBufferSourceNode(kit.ctx, { buffer: kit.noise });
  const filter = new BiquadFilterNode(kit.ctx, { type: "bandpass", frequency, Q: 1.4 });
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.012);
  src.connect(filter).connect(g).connect(out);
  src.start(when, 0, 0.03);
}

export function playUiSound(kit: SfxKit, out: AudioNode, when: number, sound: UiSound): void {
  switch (sound) {
    case "hover":
      // Survol : un tic sec et un bip aigu très bref.
      tick(kit, out, when, 5200, 0.25);
      blip(kit, out, when, "square", 2400, 2100, 0.035, 0.03);
      break;
    case "select":
      // Validation : deux bips qui montent, sur un petit coup grave.
      tick(kit, out, when, 4200, 0.3);
      blip(kit, out, when, "triangle", 880, 990, 0.22, 0.06);
      blip(kit, out, when + 0.055, "triangle", 1320, 1480, 0.2, 0.09);
      blip(kit, out, when, "sine", 140, 70, 0.45, 0.09);
      break;
    case "back":
      // Retour : un bip qui descend.
      tick(kit, out, when, 3600, 0.22);
      blip(kit, out, when, "triangle", 1180, 620, 0.2, 0.1);
      break;
  }
}
```

```diff
diff --git a/src/audio/audio-engine.ts b/src/audio/audio-engine.ts
index f5f48e8..54ee3fd 100644
--- a/src/audio/audio-engine.ts
+++ b/src/audio/audio-engine.ts
@@ -1,7 +1,8 @@
 // Graphe Web Audio (spec 7.1) :
 //   sources SFX ─► panner HRTF ─► bus SFX (passe-bas asservi) ────────────────┐
 //   musique en jeu ─► passe-bas asservi et plafonné ─► gain de jeu (−12 dB) ─┼─► compresseur ─► sortie
-//   musique menu / replay ────────────────────────────────────────────────────┘
+//   musique menu / replay ────────────────────────────────────────────────────┤
+//   sons d'interface (menu) ─► volume des effets, sans filtre ───────────────────┘
 // Le débit de la musique en jeu suit aussi le temps, côté MusicTrack.
 import { AUDIO_TIME, gameMusicCutoff, lowpassCutoff } from "./time-coupling";
 
@@ -20,6 +21,8 @@ export class AudioEngine {
   readonly musicIn: GainNode;
   // Entrée de la musique du menu et du replay : jamais filtrée.
   readonly cleanMusicIn: GainNode;
+  // Entrée des sons d'interface (survol, validation, retour) : volume des effets, jamais filtrée par le temps.
+  readonly uiIn: GainNode;
   // Sortie commune, avant la destination : le plan 3 s'y branche pour enregistrer (?record=1).
   readonly master: DynamicsCompressorNode;
   // Une seconde de bruit blanc, générée une fois : matière première des bruitages.
@@ -39,6 +42,8 @@ export class AudioEngine {
     this.sfxFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: lowpassCutoff(1), Q: 0.7 });
     this.sfxIn = new GainNode(ctx);
     this.sfxIn.connect(this.sfxFilter).connect(this.sfxVolume).connect(this.master);
+    this.uiIn = new GainNode(ctx);
+    this.uiIn.connect(this.sfxVolume);
 
     this.musicVolume = new GainNode(ctx, { gain: DEFAULT_MUSIC_VOLUME });
     this.musicFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: gameMusicCutoff(1), Q: 0.7 });
diff --git a/src/audio/game-audio.ts b/src/audio/game-audio.ts
index 851e28e..08c3b39 100644
--- a/src/audio/game-audio.ts
+++ b/src/audio/game-audio.ts
@@ -4,12 +4,14 @@ import type { WorldView } from "../sim/view";
 import { AudioEngine } from "./audio-engine";
 import { MusicTrack } from "./music";
 import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
+import { type UiSound, playUiSound } from "./ui-sfx";
 import { AUDIO_TIME, droneGain, musicRate, sfxRate } from "./time-coupling";
 
-// Morceaux Lyria (tâche 8 du plan 2), servis depuis public/audio/.
+// Morceaux Lyria (tâche 8 du plan 2 ; boucle du menu au plan 3b), servis depuis public/audio/.
 const MUSIC = {
   game: "/audio/game.mp3",
   replay: "/audio/replay.mp3",
+  menu: "/audio/menu.mp3",
 } as const;
 
 export class GameAudio {
@@ -18,7 +20,11 @@ export class GameAudio {
   // Musique en jeu : filtrée et ralentie avec le temps. Musique du replay : à vitesse réelle, non filtrée.
   private readonly gameMusic: MusicTrack;
   private readonly replayMusic: MusicTrack;
+  // Boucle du menu : non filtrée, à vitesse réelle, comme celle du replay.
+  private readonly menuMusic: MusicTrack;
   private timeScale = 1;
+  // Bourdon d'ambiance (spec 7.3 : « ambiance en jeu ») : coupé dans le menu.
+  private droneOn = true;
   // Vrai si c'est nous qui avons suspendu le contexte (onglet caché) : on ne reprend que dans ce cas,
   // jamais un contexte que le premier geste n'a pas encore débloqué.
   private suspendedByHidden = false;
@@ -27,20 +33,41 @@ export class GameAudio {
     this.drone = startDrone(this.engine, this.engine.sfxIn);
     this.gameMusic = new MusicTrack(this.engine.ctx, this.engine.musicIn, MUSIC.game, "game");
     this.replayMusic = new MusicTrack(this.engine.ctx, this.engine.cleanMusicIn, MUSIC.replay, "replay");
+    this.menuMusic = new MusicTrack(this.engine.ctx, this.engine.cleanMusicIn, MUSIC.menu, "menu");
+  }
+
+  // Boucle du menu, attendue par le chargeur (spec 4.1).
+  loadMenuMusic(): Promise<void> {
+    return this.menuMusic.load();
   }
 
   loadMusic(): Promise<void> {
     return Promise.all([this.gameMusic.load(), this.replayMusic.load()]).then(() => undefined);
   }
 
+  // Une seule musique à la fois.
+  private switchTo(track: MusicTrack): void {
+    for (const other of [this.gameMusic, this.replayMusic, this.menuMusic]) if (other !== track) other.stop();
+    track.play();
+  }
+
   playGameMusic(): void {
-    this.replayMusic.stop();
-    this.gameMusic.play();
+    this.switchTo(this.gameMusic);
   }
 
   playReplayMusic(): void {
-    this.gameMusic.stop();
-    this.replayMusic.play();
+    this.switchTo(this.replayMusic);
+  }
+
+  playMenuMusic(): void {
+    this.switchTo(this.menuMusic);
+  }
+
+  // Son d'interface, joué tout de suite, même temps figé (il ne passe pas par le filtre du temps).
+  ui(sound: UiSound): void {
+    const engine = this.engine;
+    if (engine.ctx.state !== "running") return;
+    playUiSound(engine, engine.uiIn, engine.ctx.currentTime, sound);
   }
 
   unlock(): void {
@@ -69,16 +96,25 @@ export class GameAudio {
     engine.setListener(cam.pos.x, cam.pos.y, cam.pos.z, cam.yaw, cam.pitch);
     engine.setTimeScale(view.timeScale);
     this.gameMusic.setRate(musicRate(view.timeScale));
-    this.drone.gain.setTargetAtTime(droneGain(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
+    this.drone.gain.setTargetAtTime(this.droneLevel(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
     this.play(events, view);
   }
 
+  setDrone(on: boolean): void {
+    this.droneOn = on;
+    this.drone.gain.setTargetAtTime(this.droneLevel(this.timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
+  }
+
+  private droneLevel(timeScale: number): number {
+    return this.droneOn ? droneGain(timeScale) : 0;
+  }
+
   // Figé (mort, pause) : le son reste grave et étouffé, sans nouveaux événements.
   freeze(timeScale: number): void {
     this.timeScale = timeScale;
     this.engine.setTimeScale(timeScale);
     this.gameMusic.setRate(musicRate(timeScale));
-    this.drone.gain.setTargetAtTime(droneGain(timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
+    this.drone.gain.setTargetAtTime(this.droneLevel(timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
   }
 
   private play(events: EventQueue, view: WorldView): void {
diff --git a/src/audio/music.ts b/src/audio/music.ts
index f887b75..eac7505 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -2,7 +2,7 @@
 // correction de hauteur : un AudioBufferSourceNode ralenti descend dans le grave (spec 7.1).
 import { AUDIO_TIME } from "./time-coupling";
 
-export type TrackName = "game" | "replay";
+export type TrackName = "game" | "replay" | "menu";
 
 export interface MusicPlayback {
   // Où la lecture démarre dans le fichier (s).
@@ -21,6 +21,8 @@ export interface MusicPlayback {
 const PLAYBACK: Record<TrackName, MusicPlayback> = {
   game: { offset: 0, loopStart: 0, loopEnd: 89.14 },
   replay: { offset: 2.69, loopStart: 2.69, loopEnd: 103.05 },
+  // Boucle du menu (plan 3b) : tout le fichier tant qu'elle n'est pas générée et mesurée (loopEnd borné à sa durée).
+  menu: { offset: 0, loopStart: 0, loopEnd: Number.POSITIVE_INFINITY },
 };
 
 // Paramètres de lecture d'une piste, bornés à la durée du tampon décodé : une piste régénérée plus courte
```

- [ ] **Step 5 : le fondu et le mode menu du moteur**

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index 6acff13..ce0c66c 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -1,6 +1,7 @@
 // Moteur du jeu, chargé à part (import dynamique) : Three.js, la simulation, le replay. Le point d'entrée
 // (main.ts) affiche le chargeur sans l'attendre (AC-10 : « APPUIE SUR UNE TOUCHE » en 2 s au plus).
 import type { GameAudio } from "../audio/game-audio";
+import { MENU_DEMO, type MenuCameraPose, menuCamera, menuFade, recordMenuDemo } from "../replay/menu-demo";
 import { ReplayPlayer } from "../replay/player";
 import { ReplayRecorder } from "../replay/recorder";
 import { basePixelRatio, createRenderer } from "../render/create-renderer";
@@ -15,7 +16,7 @@ import { createWorldView, writeGameView } from "../sim/view";
 import { Hud } from "./hud";
 import { InputController } from "./input";
 
-type Mode = "idle" | "start" | "playing" | "paused" | "dead" | "replay" | "won";
+type Mode = "idle" | "menu" | "start" | "playing" | "paused" | "dead" | "replay" | "won";
 
 // Après la mort, on ignore R et le clic pendant 0,3 s réelle : un clic de tir en rafale ne doit pas sauter l'écran.
 const DEAD_INPUT_GUARD_MS = 300;
@@ -32,6 +33,8 @@ export interface EngineOptions {
 
 export interface Engine {
   applySettings(settings: Settings): void;
+  // Fond du menu : la démo rejouée à 3 % du temps, caméra qui dérive, musique du menu (spec 4.3).
+  showMenu(): void;
   // Affiche la salle, prête à jouer : un clic prend la souris et lance la partie.
   enterRoom(): void;
 }
@@ -47,6 +50,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   const recorder = new ReplayRecorder();
   const replay = new ReplayPlayer(recorder, room01);
   const input = new InputController(renderer.domElement);
+  // Fond du menu : démo jouée sans écran au démarrage (quelques millisecondes), puis rejouée au ralenti.
+  const menuReplay = new ReplayPlayer(recordMenuDemo(room01), room01);
+  const menuPose: MenuCameraPose = menuReplay.view.camera;
+  let menuTime = 0;
   const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
   // Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative, selon le réglage Qualité.
   const quality = new QualityGovernor(options.settings.quality);
@@ -88,16 +95,20 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     if (next === "dead") deadSince = performance.now();
     // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
     if (next === "dead" || next === "replay" || next === "won") input.clear();
-    hud.show(next === "playing" || next === "idle" ? "none" : next);
+    hud.show(next === "playing" || next === "idle" || next === "menu" ? "none" : next);
+    // Pas d'arme en main ni de bourdon dans le menu : on y regarde la salle, on n'y joue pas.
+    world.viewModel.group.visible = next !== "menu";
+    audio.setDrone(next !== "menu");
     // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
     post.setDeath(next === "dead" ? 1 : 0);
+    post.setFade(0);
   }
 
   // Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
   // Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
   renderer.domElement.addEventListener("click", () => {
     audio.unlock();
-    if (mode !== "idle" && mode !== "playing" && !input.locked) input.lock();
+    if (mode !== "idle" && mode !== "menu" && mode !== "playing" && !input.locked) input.lock();
   });
   document.addEventListener("pointerlockchange", () => {
     if (input.locked && (mode === "start" || mode === "paused")) {
@@ -131,6 +142,11 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
         options.onSettingsChange(settings);
         return settings;
       },
+      // Vérification du fond du menu avant que le menu ne l'ouvre (plan 3a, tâche 9).
+      menu(): void {
+        engine.showMenu();
+      },
+
       advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
         const frameInput = { ...emptyInput(), ...overrides };
         for (let t = 0; t < seconds; t += 1 / 60) {
@@ -162,7 +178,15 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       restartPending = false;
     }
 
-    if (mode === "playing") {
+    if (mode === "menu") {
+      menuTime += dt;
+      // Boucle de la démo : au bout de la fenêtre, on repart du début (les éclats et les baies sont rejoués).
+      if (menuReplay.finished) menuReplay.restart();
+      menuReplay.update(dt * MENU_DEMO.playbackRate);
+      menuCamera(menuTime, menuPose);
+      post.setFade(menuFade(menuReplay.playhead, menuReplay.duration));
+      world.update(menuReplay.view, dt * MENU_DEMO.playbackRate);
+    } else if (mode === "playing") {
       const simDt = game.step(dt, input.sample());
       writeGameView(game, view);
       for (let i = 0; i < game.events.count; i++) if (game.events.items[i]!.type === "punch") world.viewModel.punch();
@@ -230,11 +254,18 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     }
   });
 
-  return {
+  const engine: Engine = {
     applySettings,
+    showMenu(): void {
+      if (input.locked) document.exitPointerLock();
+      last = performance.now();
+      setMode("menu");
+      audio.playMenuMusic();
+    },
     enterRoom(): void {
       last = performance.now();
       setMode("start");
     },
   };
+  return engine;
 }
diff --git a/src/render/post.ts b/src/render/post.ts
index b61371a..7bdc049 100644
--- a/src/render/post.ts
+++ b/src/render/post.ts
@@ -71,6 +71,8 @@ export class PostPipeline {
   private readonly pipeline: THREE.RenderPipeline;
   // 0 en jeu, 1 à la mort.
   private readonly death = uniform(0);
+  // Fondu au vide (0 = image nette, 1 = tout `void`) : bouclage du fond du menu.
+  private readonly fade = uniform(0);
 
   constructor(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera) {
     const scenePass = pass(scene, camera);
@@ -140,13 +142,18 @@ export class PostPipeline {
     // ajouté en entier, ce flou uniforme remontait les facettes sombres et aplatissait le cristal (spec 6.2).
     const halo = glow.rgb.mul(mix(float(1), float(POST.bloomOnThreat), glowTex.sample(screenUV).x));
 
-    this.pipeline = new THREE.RenderPipeline(renderer, vec4(inked.add(halo), 1));
+    const faded = mix(inked.add(halo), linearColor(PALETTE.void), this.fade);
+    this.pipeline = new THREE.RenderPipeline(renderer, vec4(faded, 1));
   }
 
   setDeath(amount: number): void {
     this.death.value = amount;
   }
 
+  setFade(amount: number): void {
+    this.fade.value = amount;
+  }
+
   render(): void {
     this.pipeline.render();
   }
```

- [ ] **Step 6 : tests, types, build, et vérifier dans Chrome**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t8-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `199 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

Chrome, fenêtre au premier plan, `http://localhost:5299/?debug` : une touche après l'invite, attendre « CLIQUE POUR JOUER », puis `window.agenthot.menu()`. Captures à 3 s, 15 s et 28 s : `t8-menu-3s.png`, `t8-menu-15s.png`, `t8-menu-28s.png`. **Attendu :** la salle vue de haut, depuis l'entrée ; à gauche, les éclats orange de l'ennemi de la passerelle suspendus ; à droite, un renfort qui sort de sa baie parmi les débris gris ; des balles et des traits de visée qui avancent très lentement ; aucune arme en main ; vers 30 s, fondu au bleu nuit, puis la boucle reprend. Panneau debug : `60 fps`, moins de 60 appels de dessin (prototype : 41). En console, un seul avertissement attendu : `[agenthot] music /audio/menu.mp3 unavailable` (boucle pas encore générée).

- [ ] **Step 7 : commit**

```bash
cd <racine> && git add src/replay/menu-demo.ts tests/menu-demo.test.ts tests/music-loop.test.ts src/audio/ui-sfx.ts src/audio/music.ts src/audio/audio-engine.ts src/audio/game-audio.ts src/render/post.ts src/app/engine.ts && git commit -m "feat(menu): scripted demo replayed at 3% behind the menu, drifting camera, menu track and UI sounds"
```

---

### Task 9 : le menu et ses panneaux (spec 4.3, 4.5, AC-14, AC-15)

Le menu Monolithe (spec 6.3 et maquette, direction B) : à gauche, le logo et deux petites lignes, des éclats orange qui flottent au ralenti ; à droite, les entrées en Big Shoulders 800 : Jouer, Salles, Paramètres, Crédits. Survol ou focus : l'entrée glisse de 10 px et un losange orange s'allume. Entrée orchestrée : lettres du logo en cascade, puis les entrées une à une. Clavier : flèches et Entrée ; Échap ferme un panneau. Un voile de vide monte de la gauche pour garder le logo lisible sur la salle claire.

Les panneaux Encre (direction C) : Salles (une carte par salle du registre, salle 2 « Bientôt »), Paramètres (curseurs, choix Oui/Non et Auto/Haute/Basse, appliqués et enregistrés à chaque changement, « Valeurs par défaut »), Crédits (la ligne exacte de la spec, puis tokens et coût API estimé).

Jouer : le clic (ou la touche) qui lance la salle est aussi celui qui demande la souris (AC-10 : contrôle en 1 s au plus). Si le navigateur la refuse, « CLIQUE POUR JOUER » attend un clic.

Deux pièges trouvés en prototypant, corrigés ici : `display: grid` l'emportait sur l'attribut `hidden` d'un écran (le menu restait affiché sur la salle) ; la salle gardait la caméra du menu en y entrant (`enterRoom` remet maintenant la salle au départ).

**Files :**
- Create : `src/ui/credits.ts`, `tests/credits.test.ts`, `src/ui/menu.ts`, `src/ui/panels.ts`
- Modify : `src/rooms/types.ts`, `src/rooms/registry.ts`, `src/ui/loader.ts`, `src/ui/screens.css`, `src/app/engine.ts`, `src/app/main.ts`

**Interfaces :**
- Consumes : `ROOMS` (plan 1), `Settings` et ses outils (tâche 5), `GameAudio.ui` et `playMenuMusic` (tâche 8), `Engine.showMenu`, `enterRoom`, `applySettings`.
- Produces :
  - `credits.ts` : `CREDITS { repoUrl, tokens, apiCostUsd }`, `interface CreditsData`, `creditsLine(data)`, `usageLine(data)` ;
  - `menu.ts` : `type MenuAction = "play" | "rooms" | "settings" | "credits" | "intro"`, `interface MenuEntry`, `interface MenuCallbacks { onAction; onSound }`, `class MenuScreen { root; panelSlot; show(); hide(); setPanelOpen(open) }` ;
  - `panels.ts` : `interface PanelHandle { close() }`, `openPanel(slot, title, body, onClose)`, `roomsBody(rooms, onPlay)`, `settingsBody(initial, onChange)`, `creditsBody()` ;
  - `RoomEntry.thumbnail?: string` (`/rooms/room-01.webp`, `/rooms/room-02.webp`, fabriquées au plan 3b) ;
  - `LoaderScreen.busy()` ; `Engine.enterRoom()` remet la salle au départ et demande la souris.

- [ ] **Step 1 : écrire les tests**

`tests/credits.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { CREDITS, creditsLine, usageLine } from "../src/ui/credits";

// Séparateur des crédits : U+2027 (point de césure), à ne pas confondre avec le point médian U+00B7.
const DOT = String.fromCodePoint(0x2027);
// Intl sépare les milliers par une espace fine insécable (U+202F) en français.
const THIN_SPACE = new RegExp(String.fromCodePoint(0x202f), "g");

describe("crédits (spec 4.3, AC-15)", () => {
  test("la ligne des crédits est exactement celle de la spec", () => {
    expect(creditsLine(CREDITS)).toBe(
      `AGENTHOT ${DOT} Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: ${CREDITS.repoUrl}`,
    );
    expect(CREDITS.repoUrl.startsWith("https://github.com/eRom/")).toBe(true);
  });

  test("tokens et coût se lisent à la française, avec la mention « estimé »", () => {
    const line = usageLine({ repoUrl: "", tokens: 118795538, apiCostUsd: 50.31 });
    expect(line.replace(THIN_SPACE, " ")).toBe(`118 795 538 tokens ${DOT} coût API estimé : 50,31 $`);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/credits.test.ts`
Expected : échec, module `../src/ui/credits` introuvable.

- [ ] **Step 3 : écrire les crédits, le menu et les panneaux**

`src/ui/credits.ts` :

```ts
// Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
// Valeurs provisoires : mesure du brief plan 3 (2026-09-29, 13 h 35, chantier en cours). Le plan 3c les remplace
// par le total final (scripts/count-tokens.sh), et remplace XXXXXX par le nom du dépôt choisi par Romain.
export const CREDITS = {
  repoUrl: "https://github.com/eRom/XXXXXX",
  tokens: 118_795_538,
  apiCostUsd: 50.31,
} as const;

export interface CreditsData {
  repoUrl: string;
  tokens: number;
  apiCostUsd: number;
}

// Ligne exacte de la spec 4.3 ; `‧` est U+2027.
export function creditsLine(data: CreditsData): string {
  return `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: ${data.repoUrl}`;
}

// « 118 795 538 tokens ‧ coût API estimé : 50,31 $ ». Coût équivalent au tarif public de l'API : Romain paie un
// abonnement, pas ce montant (brief plan 3, section 8), d'où « estimé ».
export function usageLine(data: CreditsData): string {
  const tokens = new Intl.NumberFormat("fr-FR").format(data.tokens);
  const cost = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.apiCostUsd);
  return `${tokens} tokens ‧ coût API estimé : ${cost} $`;
}
```

Vérifier les octets du séparateur (Global Constraints) : `python3 -c "print([hex(ord(c)) for c in open('src/ui/credits.ts').read() if ord(c) > 0x2000])"` affiche six `0x2027`.

`src/ui/menu.ts` :

```ts
// Menu (spec 4.3) : logo et entrées en style Monolithe, sur la salle figée à 3 %. Clavier (flèches + Entrée,
// Échap pour fermer un panneau) et souris. Sons de survol, de validation et de retour.
import { EASE, logoMarkup } from "./dom";

export type MenuAction = "play" | "rooms" | "settings" | "credits" | "intro";

export interface MenuEntry {
  action: MenuAction;
  label: string;
  // Petit texte à droite de l'entrée (compteur de salles).
  hint?: string;
}

export interface MenuCallbacks {
  onAction(action: MenuAction): void;
  // Son d'interface : survol, validation, retour.
  onSound(sound: "hover" | "select" | "back"): void;
}

// Éclats orange qui flottent au ralenti autour du logo (spec 6.3) : position (% du bloc du logo), taille (px),
// forme, durée et retard de la dérive (s). Fixes : le menu est le même à chaque visite.
const SHARDS = [
  { x: 96, y: 8, size: 16, shape: "50% 0, 100% 100%, 0 70%", duration: 17, delay: -3 },
  { x: 104, y: 30, size: 9, shape: "0 0, 100% 40%, 30% 100%", duration: 13, delay: -8 },
  { x: -8, y: 62, size: 12, shape: "40% 0, 100% 80%, 0 100%", duration: 19, delay: -1 },
  { x: 88, y: 92, size: 22, shape: "50% 0, 100% 80%, 0 100%", duration: 23, delay: -12 },
  { x: 58, y: -10, size: 7, shape: "0 20%, 100% 0, 60% 100%", duration: 11, delay: -5 },
  { x: 18, y: 104, size: 10, shape: "30% 0, 100% 60%, 0 100%", duration: 15, delay: -9 },
] as const;

export class MenuScreen {
  readonly root: HTMLElement;
  private readonly entries: HTMLButtonElement[];
  private focusIndex = 0;
  private readonly callbacks: MenuCallbacks;
  // Vrai quand un panneau est ouvert : les flèches et Entrée appartiennent alors au panneau.
  private panelOpen = false;
  private readonly onKey = (event: KeyboardEvent): void => this.handleKey(event);

  constructor(parent: HTMLElement, entries: readonly MenuEntry[], callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement("section");
    this.root.className = "screen menu";
    this.root.hidden = true;
    const shards = SHARDS.map(
      (s) =>
        `<i style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;clip-path:polygon(${s.shape});` +
        `animation-duration:${s.duration}s;animation-delay:${s.delay}s"></i>`,
    ).join("");
    const buttons = entries
      .map(
        (e) =>
          `<button type="button" class="menu-entry" data-action="${e.action}">` +
          `<span>${e.label}</span>${e.hint ? `<small>${e.hint}</small>` : ""}</button>`,
      )
      .join("");
    this.root.innerHTML = `
      <div class="menu-veil" aria-hidden="true"></div>
      <div class="menu-brand">
        <p class="label menu-tag">Le temps n'avance que quand tu bouges</p>
        <div class="menu-logo">${logoMarkup()}<div class="menu-shards" aria-hidden="true">${shards}</div></div>
        <p class="label menu-tag">Made with Claude Opus 5.5</p>
      </div>
      <nav class="menu-entries" aria-label="Menu">${buttons}</nav>
      <div class="menu-panel-slot"></div>
      <p class="label menu-hint" aria-hidden="true">↑ ↓ Choisir &nbsp; Entrée Valider &nbsp; Échap Retour</p>`;
    parent.appendChild(this.root);
    this.entries = [...this.root.querySelectorAll<HTMLButtonElement>(".menu-entry")];
    this.entries.forEach((button, i) => {
      button.addEventListener("pointerenter", () => {
        if (this.panelOpen || i === this.focusIndex) return;
        this.focus(i);
        this.callbacks.onSound("hover");
      });
      button.addEventListener("click", () => this.activate(i));
    });
  }

  // Emplacement des panneaux Encre (Salles, Paramètres, Crédits).
  get panelSlot(): HTMLElement {
    return this.root.querySelector<HTMLElement>(".menu-panel-slot")!;
  }

  show(): void {
    this.root.hidden = false;
    window.addEventListener("keydown", this.onKey);
    this.focus(0);
    // Entrée orchestrée : les lettres du logo tombent en cascade, puis les entrées glissent une à une.
    this.root.querySelectorAll<HTMLElement>(".menu-brand .logo-letter").forEach((letter, i) => {
      letter.animate(
        [
          { transform: "translateY(-0.35em)", opacity: 0, filter: "blur(6px)" },
          { transform: "none", opacity: 1, filter: "blur(0)" },
        ],
        { duration: 260, delay: 80 + i * 40, easing: EASE, fill: "backwards" },
      );
    });
    this.root.querySelectorAll<HTMLElement>(".menu-tag").forEach((tag, i) => {
      tag.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 420 + i * 120, easing: EASE, fill: "backwards" });
    });
    this.entries.forEach((entry, i) => {
      entry.animate(
        [
          { transform: "translateX(-28px)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 240, delay: 380 + i * 60, easing: EASE, fill: "backwards" },
      );
    });
  }

  hide(): void {
    this.root.hidden = true;
    window.removeEventListener("keydown", this.onKey);
  }

  // Un panneau s'ouvre ou se ferme : les entrées s'estompent, le clavier passe au panneau.
  setPanelOpen(open: boolean): void {
    this.panelOpen = open;
    this.root.classList.toggle("has-panel", open);
    if (!open) this.entries[this.focusIndex]!.focus({ preventScroll: true });
  }

  private focus(index: number): void {
    this.focusIndex = (index + this.entries.length) % this.entries.length;
    this.entries.forEach((entry, i) => entry.classList.toggle("is-focused", i === this.focusIndex));
    this.entries[this.focusIndex]!.focus({ preventScroll: true });
  }

  private activate(index: number): void {
    if (this.panelOpen) return;
    this.focus(index);
    this.callbacks.onSound("select");
    this.callbacks.onAction(this.entries[index]!.dataset.action as MenuAction);
  }

  private handleKey(event: KeyboardEvent): void {
    if (this.panelOpen) return;
    if (event.code === "ArrowDown" || event.code === "ArrowUp") {
      event.preventDefault();
      this.focus(this.focusIndex + (event.code === "ArrowDown" ? 1 : -1));
      this.callbacks.onSound("hover");
    } else if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      this.activate(this.focusIndex);
    }
  }
}
```

`src/ui/panels.ts` :

```ts
// Panneaux Encre du menu (spec 4.3, 4.5, 6.3) : Salles, Paramètres, Crédits. Échap ou « Retour » les ferme.
import type { RoomEntry } from "../rooms/types";
import { DEFAULT_SETTINGS, QUALITY_MODES, SETTING_RANGES, type Settings, clampSetting } from "../settings/settings";
import { CREDITS, creditsLine, usageLine } from "./credits";
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
    body.replaceWith(settingsBody(current, onChange));
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
    <p class="panel-row label credits-note">Coût API estimé : tokens de toutes les sessions du chantier, au tarif public de l'API.</p>
    <p class="panel-row label credits-note">Polices : Big Shoulders Display, Chakra Petch, Martian Mono (SIL OFL 1.1). Musique : Lyria 3.5.</p>`;
  return body;
}
```

- [ ] **Step 4 : vignettes au registre, styles, branchement**

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index ce0c66c..529645d 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -35,7 +35,8 @@ export interface Engine {
   applySettings(settings: Settings): void;
   // Fond du menu : la démo rejouée à 3 % du temps, caméra qui dérive, musique du menu (spec 4.3).
   showMenu(): void;
-  // Affiche la salle, prête à jouer : un clic prend la souris et lance la partie.
+  // Affiche la salle, prête à jouer : la souris est demandée tout de suite (à appeler dans le clic ou la touche
+  // du joueur, seul moment où le navigateur l'accorde), sinon au premier clic sur la salle.
   enterRoom(): void;
 }
 
@@ -264,7 +265,12 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     },
     enterRoom(): void {
       last = performance.now();
+      // La salle au départ, vue par le joueur (la caméra sortait de la dérive du menu).
+      game.reset();
+      writeGameView(game, view);
+      world.update(view);
       setMode("start");
+      input.lock();
     },
   };
   return engine;
diff --git a/src/app/main.ts b/src/app/main.ts
index c39ba63..a45ba5c 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -1,14 +1,18 @@
 // Point d'entrée : léger, sans Three.js. Il affiche le chargeur (ou l'écran mobile) tout de suite, pendant que
-// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → salle (spec 4).
+// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → menu → salle (spec 4).
 import "../ui/tokens.css";
 import "../ui/screens.css";
 import "./style.css";
 import { GameAudio } from "../audio/game-audio";
+import { ROOMS } from "../rooms/registry";
 import { browserStorage, loadSettings, saveSettings } from "../settings/settings";
 import { TIME } from "../sim/time";
 import { LoaderScreen } from "../ui/loader";
+import { MenuScreen } from "../ui/menu";
 import { MobileScreen } from "../ui/mobile";
+import { type PanelHandle, creditsBody, openPanel, roomsBody, settingsBody } from "../ui/panels";
 import { browserEnvironment, playOnDesktopOnly } from "./device";
+import type { Engine } from "./engine";
 
 const params = new URLSearchParams(window.location.search);
 const screens = document.querySelector<HTMLElement>("#screens")!;
@@ -24,7 +28,7 @@ async function boot(): Promise<void> {
   const loader = new LoaderScreen(screens);
   void loader.play();
   const storage = browserStorage();
-  const settings = loadSettings(storage);
+  let settings = loadSettings(storage);
   // Contexte audio créé tout de suite, suspendu jusqu'au premier geste : les musiques se décodent pendant ce temps.
   const audio = new GameAudio();
   audio.engine.setVolumes(settings.musicVolume / 100, settings.sfxVolume / 100);
@@ -42,10 +46,11 @@ async function boot(): Promise<void> {
   window.addEventListener("keydown", () => audio.unlock());
   window.addEventListener("pointerdown", () => audio.unlock());
 
-  await loader.waitReady([document.fonts.ready]);
+  // Polices et boucle du menu (spec 4.1) : la boucle absente (pas encore générée) n'empêche pas d'entrer.
+  await loader.waitReady([document.fonts.ready, audio.loadMenuMusic()]);
   // Le moteur (Three.js, 90 % du code, puis l'initialisation du rendu) se charge une fois l'invite affichée,
   // pendant que le joueur la lit : il ne dispute pas le fil principal au chargeur (AC-10).
-  const engine = import("./engine").then(({ createEngine }) =>
+  const enginePromise = import("./engine").then(({ createEngine }) =>
     createEngine({
       audio,
       settings,
@@ -55,15 +60,67 @@ async function boot(): Promise<void> {
     }),
   );
   // Rejet traité plus bas, après le geste : on le marque comme attendu dès maintenant.
-  engine.catch(() => undefined);
+  enginePromise.catch(() => undefined);
   await loader.waitForGesture(() => audio.unlock());
+  loader.busy();
+  let engine: Engine;
   try {
-    const ready = await engine;
-    await loader.hide();
-    ready.enterRoom();
+    engine = await enginePromise;
   } catch (error) {
     // Ni WebGPU ni WebGL2 : on le dit au lieu d'un écran noir.
     console.error("[agenthot] engine failed", error);
     loader.fail("Ton navigateur ne peut pas afficher le jeu : WebGL2 est nécessaire.");
+    return;
   }
+
+  let panel: PanelHandle | null = null;
+  const closePanel = (): void => {
+    panel?.close();
+  };
+  // Un panneau ouvert se ferme : son de retour, les entrées reprennent le clavier.
+  const onPanelClosed = (): void => {
+    panel = null;
+    audio.ui("back");
+    menu.setPanelOpen(false);
+  };
+  const showPanel = (title: string, body: HTMLElement): void => {
+    menu.setPanelOpen(true);
+    panel = openPanel(menu.panelSlot, title, body, onPanelClosed);
+  };
+  // Jouer : le clic (ou la touche) qui lance la salle est aussi celui qui prend la souris (AC-10).
+  const play = (): void => {
+    closePanel();
+    menu.hide();
+    engine.enterRoom();
+  };
+  const menu = new MenuScreen(
+    screens,
+    [
+      { action: "play", label: "Jouer" },
+      { action: "rooms", label: "Salles", hint: `1 / ${ROOMS.length}` },
+      { action: "settings", label: "Paramètres" },
+      { action: "credits", label: "Crédits" },
+    ],
+    {
+      onSound: (sound) => audio.ui(sound),
+      onAction(action) {
+        if (action === "play") play();
+        else if (action === "rooms") showPanel("Salles", roomsBody(ROOMS, () => play()));
+        else if (action === "settings") {
+          showPanel(
+            "Paramètres",
+            settingsBody(settings, (next) => {
+              settings = next;
+              saveSettings(storage, next);
+              engine.applySettings(next);
+            }),
+          );
+        } else if (action === "credits") showPanel("Crédits", creditsBody());
+      },
+    },
+  );
+
+  await loader.hide();
+  engine.showMenu();
+  menu.show();
 }
diff --git a/src/rooms/registry.ts b/src/rooms/registry.ts
index 241ea0e..f47e33c 100644
--- a/src/rooms/registry.ts
+++ b/src/rooms/registry.ts
@@ -3,8 +3,8 @@ import { room01 } from "./room-01-datacenter";
 import type { RoomEntry } from "./types";
 
 export const ROOMS: readonly RoomEntry[] = [
-  { id: room01.id, title: room01.title, status: "playable", definition: room01 },
-  { id: "room-02", title: "Salle 2", status: "locked" },
+  { id: room01.id, title: room01.title, status: "playable", definition: room01, thumbnail: "/rooms/room-01.webp" },
+  { id: "room-02", title: "Salle 2", status: "locked", thumbnail: "/rooms/room-02.webp" },
 ];
 
 export function findRoom(id: string): RoomEntry | undefined {
diff --git a/src/rooms/types.ts b/src/rooms/types.ts
index 673382f..13132da 100644
--- a/src/rooms/types.ts
+++ b/src/rooms/types.ts
@@ -41,4 +41,6 @@ export interface RoomEntry {
   title: string;
   status: "playable" | "locked";
   definition?: RoomDefinition;
+  // Vignette du panneau Salles (spec 4.3), générée au plan 3b ; absente, la carte garde son fond d'encre.
+  thumbnail?: string;
 }
diff --git a/src/ui/loader.ts b/src/ui/loader.ts
index 94330b3..211ece9 100644
--- a/src/ui/loader.ts
+++ b/src/ui/loader.ts
@@ -116,6 +116,12 @@ export class LoaderScreen {
     });
   }
 
+  // Geste reçu mais moteur pas encore prêt : l'invite laisse place à « Chargement » jusqu'au menu.
+  busy(): void {
+    this.root.querySelector<HTMLElement>(".loader-prompt")!.hidden = true;
+    this.root.querySelector<HTMLElement>(".loader-status")!.hidden = false;
+  }
+
   // Échec du moteur : l'invite laisse place au message, le logo reste.
   fail(message: string): void {
     const prompt = this.root.querySelector<HTMLElement>(".loader-prompt")!;
diff --git a/src/ui/screens.css b/src/ui/screens.css
index 0906932..e9e3077 100644
--- a/src/ui/screens.css
+++ b/src/ui/screens.css
@@ -13,6 +13,11 @@
   pointer-events: auto;
 }
 
+/* Un écran caché l'est vraiment : sans cette règle, le `display: grid` d'un écran l'emporte sur l'attribut. */
+.screen[hidden] {
+  display: none;
+}
+
 /* ---------- Logo Monolithe ---------- */
 
 .logo {
@@ -163,3 +168,348 @@
   color: #5b6170;
   word-break: break-all;
 }
+
+/* ---------- Menu (spec 4.3), Monolithe ---------- */
+
+.menu {
+  display: grid;
+  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
+  align-items: center;
+  padding: 6vh 6vw;
+  gap: 4vw;
+}
+
+/* Le vide monte de la gauche : le logo reste lisible sur la salle claire. */
+.menu-veil {
+  position: absolute;
+  inset: 0;
+  pointer-events: none;
+  background:
+    linear-gradient(90deg, rgb(13 17 27 / 0.92) 0%, rgb(13 17 27 / 0.7) 38%, rgb(13 17 27 / 0.15) 70%, transparent 100%),
+    linear-gradient(0deg, rgb(13 17 27 / 0.55), transparent 30%);
+}
+
+.menu-brand {
+  position: relative;
+  display: grid;
+  gap: 22px;
+  align-content: center;
+}
+
+.menu-tag {
+  letter-spacing: 0.2em;
+}
+
+.menu-logo {
+  position: relative;
+  width: fit-content;
+}
+
+.menu-shards {
+  position: absolute;
+  inset: 0;
+  pointer-events: none;
+}
+
+.menu-shards i {
+  position: absolute;
+  display: block;
+  background: var(--threat);
+  opacity: 0.85;
+  box-shadow: 0 0 16px rgb(217 119 87 / 0.6);
+  animation: shard-drift linear infinite alternate;
+}
+
+/* Dérive très lente : un éclat au ralenti, comme la salle derrière. */
+@keyframes shard-drift {
+  from {
+    transform: translate(0, 0) rotate(0deg);
+  }
+  to {
+    transform: translate(14px, -22px) rotate(150deg);
+  }
+}
+
+.menu-entries {
+  position: relative;
+  display: grid;
+  gap: 4px;
+  justify-self: start;
+  transition: opacity var(--t-mid) var(--ease), filter var(--t-mid) var(--ease);
+}
+
+.menu.has-panel .menu-entries {
+  opacity: 0.18;
+  filter: blur(2px);
+  pointer-events: none;
+}
+
+/* Entrée : Big Shoulders 800, capitales. Survol ou focus : glisse de 10 px, un losange `threat` s'allume. */
+.menu-entry {
+  position: relative;
+  display: flex;
+  align-items: baseline;
+  gap: 14px;
+  width: fit-content;
+  padding: 0;
+  border: 0;
+  background: none;
+  cursor: pointer;
+  font-family: var(--font-mono-title);
+  font-weight: 800;
+  font-size: clamp(34px, 4.6vw, 64px);
+  line-height: 1.02;
+  text-transform: uppercase;
+  color: var(--world-2);
+  text-shadow: 0 2px 0 rgb(10 12 16 / 0.5);
+  transition:
+    color var(--t-fast) var(--ease),
+    transform var(--t-slow) var(--ease);
+}
+
+.menu-entry small {
+  font-family: var(--font-label);
+  font-weight: 400;
+  font-size: 11px;
+  letter-spacing: 0.14em;
+  color: var(--muted);
+}
+
+.menu-entry::before {
+  content: "";
+  position: absolute;
+  left: -0.62em;
+  top: 50%;
+  width: 0.3em;
+  height: 0.3em;
+  background: var(--threat);
+  box-shadow: 0 0 14px var(--threat);
+  transform: translateY(-50%) rotate(45deg) scale(0);
+  transition: transform var(--t-mid) var(--ease);
+}
+
+.menu-entry.is-focused,
+.menu-entry:focus-visible {
+  color: var(--world);
+  transform: translateX(10px);
+  outline: none;
+}
+
+.menu-entry.is-focused::before {
+  transform: translateY(-50%) rotate(45deg) scale(1);
+}
+
+.menu-panel-slot {
+  position: absolute;
+  right: 6vw;
+  top: 50%;
+  transform: translateY(-50%);
+  width: min(520px, 44vw);
+}
+
+.menu-hint {
+  position: absolute;
+  left: 6vw;
+  bottom: 4vh;
+}
+
+/* ---------- Panneaux du menu, Encre ---------- */
+
+.menu-panel {
+  display: grid;
+  gap: 10px;
+}
+
+.panel-back {
+  margin-top: 8px;
+}
+
+.room-cards {
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  gap: 12px;
+}
+
+.room-card {
+  display: grid;
+  gap: 6px;
+  padding: 8px;
+  text-align: left;
+  font-family: var(--font-ink);
+  color: var(--ink);
+  background: transparent;
+  border: 12px solid transparent;
+  border-image: var(--ink-button-frame) 12 fill / 12px stretch;
+  cursor: pointer;
+  transition: transform var(--t-mid) var(--ease);
+}
+
+.room-card:hover,
+.room-card:focus-visible {
+  border-image-source: var(--ink-button-frame-active);
+  transform: translateY(-3px);
+  outline: none;
+}
+
+.room-card:disabled {
+  opacity: 0.45;
+  cursor: default;
+  transform: none;
+  border-image-source: var(--ink-button-frame);
+}
+
+.room-thumb {
+  display: block;
+  aspect-ratio: 16 / 10;
+  background:
+    repeating-linear-gradient(90deg, rgb(236 235 231 / 0.08) 0 1px, transparent 1px 14%),
+    var(--void);
+  overflow: hidden;
+}
+
+.room-thumb img {
+  display: block;
+  width: 100%;
+  height: 100%;
+  object-fit: cover;
+}
+
+.room-title {
+  font-weight: 600;
+  font-size: 15px;
+  letter-spacing: 0.08em;
+  text-transform: uppercase;
+}
+
+.room-status {
+  font-family: var(--font-label);
+  font-size: 11px;
+  letter-spacing: 0.14em;
+  text-transform: uppercase;
+  color: #5b6170;
+}
+
+.settings-rows {
+  display: grid;
+  gap: 12px;
+}
+
+.setting-slider,
+.setting-choice {
+  display: grid;
+  grid-template-columns: 11em 1fr 3.2em;
+  align-items: center;
+  gap: 12px;
+  font-weight: 600;
+  font-size: 13px;
+  letter-spacing: 0.08em;
+  text-transform: uppercase;
+}
+
+.setting-choice {
+  grid-template-columns: 11em 1fr;
+}
+
+.setting-value {
+  font-family: var(--font-label);
+  font-size: 12px;
+  text-align: right;
+}
+
+/* Curseur : filet d'encre, poignée carrée tournée à 45°. */
+.setting-slider input {
+  appearance: none;
+  width: 100%;
+  height: 18px;
+  background: linear-gradient(var(--ink), var(--ink)) center / 100% 2px no-repeat;
+  cursor: pointer;
+}
+
+.setting-slider input::-webkit-slider-thumb {
+  appearance: none;
+  width: 13px;
+  height: 13px;
+  background: var(--world);
+  border: 2px solid var(--ink);
+  transform: rotate(45deg);
+}
+
+.setting-slider input::-moz-range-thumb {
+  width: 11px;
+  height: 11px;
+  border-radius: 0;
+  background: var(--world);
+  border: 2px solid var(--ink);
+  transform: rotate(45deg);
+}
+
+.setting-slider input:focus-visible {
+  outline: none;
+}
+
+.setting-slider input:focus-visible::-webkit-slider-thumb {
+  background: var(--threat);
+}
+
+.setting-slider input:focus-visible::-moz-range-thumb {
+  background: var(--threat);
+}
+
+.segmented {
+  display: flex;
+  gap: 6px;
+}
+
+.segmented button {
+  flex: 1;
+  padding: 5px 8px;
+  font-family: var(--font-ink);
+  font-weight: 600;
+  font-size: 12px;
+  letter-spacing: 0.1em;
+  text-transform: uppercase;
+  color: var(--ink);
+  background: transparent;
+  border: 1.5px solid var(--ink);
+  cursor: pointer;
+  transition:
+    background var(--t-fast) var(--ease),
+    color var(--t-fast) var(--ease);
+}
+
+.segmented button:hover,
+.segmented button:focus-visible {
+  background: var(--ink);
+  color: var(--world);
+  outline: none;
+}
+
+.segmented button.is-active {
+  box-shadow: inset 4px 0 0 var(--threat);
+}
+
+.credits {
+  display: grid;
+  gap: 12px;
+}
+
+.credits-line {
+  font-family: var(--font-label);
+  font-weight: 400;
+  font-size: 13px;
+  line-height: 1.7;
+  word-break: break-word;
+}
+
+.credits-usage {
+  font-weight: 600;
+  font-size: 18px;
+  letter-spacing: 0.04em;
+}
+
+.credits-note {
+  color: #5b6170;
+  text-transform: none;
+  letter-spacing: 0.04em;
+  line-height: 1.6;
+}
```

- [ ] **Step 5 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t9-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `201 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 6 : vérifier dans Chrome**

`http://localhost:5299/?debug`, une touche après l'invite : le menu s'ouvre sur la salle figée. Pour piloter au clavier sans focus système : `const k = (code) => window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code }));`.
1. Capture `t9-menu.png`. **Attendu :** logo AGENT/HOT à gauche avec ses petites lignes, entrées à droite, losange orange devant « Jouer », éclats orange qui flottent ; la salle derrière, voilée à gauche.
2. `k("ArrowDown"); k("ArrowDown"); k("Enter")` : panneau Paramètres ; capture `t9-settings.png`. **Attendu :** plaque Encre à droite, entrées du menu estompées ; curseurs à poignée losange, valeurs à droite (`1,0`, `90°`, `70`, `90`) ; choix Non/Oui et Auto/Haute/Basse avec un filet orange sur le choix actif. Changer le champ de vision, `k("Escape")`, recharger, rouvrir : la valeur est gardée (AC-14, partie clavier).
3. `k("ArrowDown"); k("Enter")` : Crédits. `document.querySelector(".credits-line").textContent` vaut exactement `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/XXXXXX` (AC-15 ; la valeur finale du dépôt arrive au plan 3c). Capture `t9-credits.png`.
4. `k("Escape"); k("ArrowUp"); k("ArrowUp"); k("Enter")` : Salles. **Attendu :** deux cartes, « Salle serveurs / Jouable » et « Salle 2 / Bientôt » (désactivée, estompée) ; aucune image cassée (vignettes absentes jusqu'au plan 3b). Capture `t9-rooms.png`.
5. Clic réel (outil de clic, pas `element.click()`) sur « Salle serveurs » : le menu disparaît, la salle s'affiche à la place du joueur. Fenêtre au premier plan : la souris est prise et la partie démarre ; sinon « CLIQUE POUR JOUER » (noter « verrou refusé »).

- [ ] **Step 7 : commit**

```bash
cd <racine> && git add src/ui/credits.ts tests/credits.test.ts src/ui/menu.ts src/ui/panels.ts src/rooms/types.ts src/rooms/registry.ts src/ui/loader.ts src/ui/screens.css src/app/engine.ts src/app/main.ts && git commit -m "feat(ui): Monolithe menu with keyboard navigation; Encre rooms, settings and credits panels"
```

---

### Task 10 : pause, victoire, retour au menu (spec 4.4)

Échap libère la souris : le panneau Pause (Reprendre, Recommencer, Menu). Reprendre demande un clic, imposé par le navigateur. Après le replay de victoire, la souris est rendue et le panneau propose Rejouer (R), Revoir le replay (Espace), Menu (M). La mort garde son texte discret ; R ou un clic relance comme avant (AC-6 inchangé).

**Files :**
- Create : `src/ui/room-panels.ts`
- Modify : `src/app/engine.ts`, `src/app/hud.ts`, `src/app/main.ts`, `src/ui/screens.css`

**Interfaces :**
- Consumes : `Engine.showMenu`, `MenuScreen.show`, `GameAudio.ui` (tâches 8 et 9).
- Produces : `interface RoomPanelAction { label; code?; key; run() }`, `class RoomPanels { show(title, subtitle, actions); hide() }` ; `type EngineMode` (exporté) ; `EngineOptions.onModeChange(mode)` ; `Engine.resume()`, `restart()`, `rewatch()` ; sonde debug `window.agenthot.forceMode(mode)` à la place de `menu()`.

- [ ] **Step 1 : écrire les panneaux de la salle**

`src/ui/room-panels.ts` :

```ts
// Panneaux Encre de la salle (spec 4.4) : pause (Reprendre, Recommencer, Menu) et fin de victoire (Rejouer,
// Revoir le replay, Menu). La mort garde son texte discret du HUD (« R ‧ RECOMMENCER »).
import { EASE } from "./dom";

export interface RoomPanelAction {
  label: string;
  // Touche du raccourci (KeyboardEvent.code, aucune si absente) et son libellé à droite du bouton.
  code?: string;
  key: string;
  run(): void;
}

export class RoomPanels {
  private readonly root: HTMLElement;
  private current: HTMLElement | null = null;
  private actions: readonly RoomPanelAction[] = [];
  private readonly onKey = (event: KeyboardEvent): void => {
    const action = this.actions.find((a) => a.code !== undefined && a.code === event.code);
    if (!action) return;
    event.preventDefault();
    action.run();
  };

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen room-panels";
    this.root.hidden = true;
    parent.appendChild(this.root);
  }

  // Affiche un panneau centré ; `subtitle` : petit texte sous le titre.
  show(title: string, subtitle: string, actions: readonly RoomPanelAction[]): void {
    this.hide();
    this.actions = actions;
    const panel = document.createElement("div");
    panel.className = "ink-panel room-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title);
    panel.innerHTML = `<h2>${title}</h2><p class="label room-panel-sub">${subtitle}</p>`;
    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ink-button";
      button.innerHTML = `${action.label} <small>${action.key}</small>`;
      button.addEventListener("click", () => action.run());
      panel.appendChild(button);
    }
    this.root.appendChild(panel);
    this.root.hidden = false;
    this.current = panel;
    window.addEventListener("keydown", this.onKey);
    panel.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 200, easing: EASE },
    );
    panel.querySelectorAll<HTMLElement>(".ink-button").forEach((button, i) => {
      button.animate([{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "none" }], {
        duration: 180,
        delay: 60 + i * 45,
        easing: EASE,
        fill: "backwards",
      });
    });
  }

  hide(): void {
    window.removeEventListener("keydown", this.onKey);
    this.actions = [];
    this.current?.remove();
    this.current = null;
    this.root.hidden = true;
  }
}
```

- [ ] **Step 2 : brancher**

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index 529645d..1300f1d 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -16,7 +16,7 @@ import { createWorldView, writeGameView } from "../sim/view";
 import { Hud } from "./hud";
 import { InputController } from "./input";
 
-type Mode = "idle" | "menu" | "start" | "playing" | "paused" | "dead" | "replay" | "won";
+export type EngineMode = "idle" | "menu" | "start" | "playing" | "paused" | "dead" | "replay" | "won";
 
 // Après la mort, on ignore R et le clic pendant 0,3 s réelle : un clic de tir en rafale ne doit pas sauter l'écran.
 const DEAD_INPUT_GUARD_MS = 300;
@@ -29,6 +29,8 @@ export interface EngineOptions {
   forceWebGL: boolean;
   // Réglages changés par la sonde debug : le point d'entrée les enregistre.
   onSettingsChange(settings: Settings): void;
+  // Chaque changement d'écran de la salle : le point d'entrée y accroche ses panneaux (pause, victoire).
+  onModeChange(mode: EngineMode): void;
 }
 
 export interface Engine {
@@ -38,6 +40,11 @@ export interface Engine {
   // Affiche la salle, prête à jouer : la souris est demandée tout de suite (à appeler dans le clic ou la touche
   // du joueur, seul moment où le navigateur l'accorde), sinon au premier clic sur la salle.
   enterRoom(): void;
+  // Pause : reprendre (dans un clic, pour reprendre la souris), recommencer la salle.
+  resume(): void;
+  restart(): void;
+  // Victoire : revoir le replay.
+  rewatch(): void;
 }
 
 export async function createEngine(options: EngineOptions): Promise<Engine> {
@@ -73,7 +80,7 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   }
   applySettings(settings);
 
-  let mode: Mode = "idle";
+  let mode: EngineMode = "idle";
   let last = performance.now();
   let restartPending = false;
   let deadSince = 0;
@@ -81,6 +88,25 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   let fpsTime = 0;
   let fps = 0;
 
+  // Relance (R, clic à la mort, Recommencer) : même salle, sans rien recharger (AC-6).
+  function restartRun(): void {
+    restartPending = true;
+    startRun();
+    // Sans verrou (Échap sur l'écran de fin), on le redemande et on attend qu'il revienne.
+    if (input.locked) setMode("playing");
+    else {
+      input.lock();
+      setMode("paused");
+    }
+    world.update(view);
+  }
+
+  function rewatch(): void {
+    replay.restart();
+    audio.playReplayMusic();
+    setMode("replay");
+  }
+
   function startRun(): void {
     game.reset();
     recorder.reset();
@@ -91,7 +117,7 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     audio.playGameMusic();
   }
 
-  function setMode(next: Mode): void {
+  function setMode(next: EngineMode): void {
     mode = next;
     if (next === "dead") deadSince = performance.now();
     // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
@@ -100,6 +126,9 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     // Pas d'arme en main ni de bourdon dans le menu : on y regarde la salle, on n'y joue pas.
     world.viewModel.group.visible = next !== "menu";
     audio.setDrone(next !== "menu");
+    // Victoire : la souris est rendue, pour cliquer dans le panneau (Rejouer, Revoir, Menu).
+    if (next === "won" && input.locked) document.exitPointerLock();
+    options.onModeChange(next);
     // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
     post.setDeath(next === "dead" ? 1 : 0);
     post.setFade(0);
@@ -109,7 +138,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   // Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
   renderer.domElement.addEventListener("click", () => {
     audio.unlock();
-    if (mode !== "idle" && mode !== "menu" && mode !== "playing" && !input.locked) input.lock();
+    // Ni dans le menu, ni à la fin d'une victoire, où la souris sert à cliquer dans les panneaux.
+    if (mode !== "idle" && mode !== "menu" && mode !== "playing" && mode !== "won" && !input.locked) input.lock();
   });
   document.addEventListener("pointerlockchange", () => {
     if (input.locked && (mode === "start" || mode === "paused")) {
@@ -143,9 +173,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
         options.onSettingsChange(settings);
         return settings;
       },
-      // Vérification du fond du menu avant que le menu ne l'ouvre (plan 3a, tâche 9).
-      menu(): void {
-        engine.showMenu();
+      // Écrans de la salle sans verrou de souris (captures) : « paused », « dead », « won », « replay ».
+      forceMode(next: EngineMode): void {
+        if (next === "replay") rewatch();
+        else setMode(next);
       },
 
       advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
@@ -200,33 +231,17 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       if (game.status === "won") {
         // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
         if (debug) console.info(`[agenthot] replay sim ${game.simTime.toFixed(2)} s vs duration ${replay.duration.toFixed(2)} s`);
-        replay.restart();
-        audio.playReplayMusic();
-        setMode("replay");
+        rewatch();
       }
-    } else if (mode === "dead" || mode === "won") {
+    } else if (mode === "dead") {
       // Temps figé : le son reste grave et étouffé.
       audio.freeze(TIME.min);
-      // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
-      const clicked = input.consumeFire() && mode === "dead";
+      // Mort : R ou un clic relance (spec 4.4).
+      const clicked = input.consumeFire();
       const pressedR = input.consumePress("KeyR");
       // Pendant la garde, R et le clic sont écartés (consommés ci-dessus), pas mis en attente.
-      const guarded = mode === "dead" && now - deadSince < DEAD_INPUT_GUARD_MS;
-      if (!guarded && (pressedR || clicked)) {
-        restartPending = true;
-        startRun();
-        // Sans verrou (Échap sur l'écran de fin), on le redemande et on attend qu'il revienne.
-        if (input.locked) setMode("playing");
-        else {
-          input.lock();
-          setMode("paused");
-        }
-        world.update(view);
-      } else if (mode === "won" && input.consumePress("Space")) {
-        replay.restart();
-        audio.playReplayMusic();
-        setMode("replay");
-      }
+      const guarded = now - deadSince < DEAD_INPUT_GUARD_MS;
+      if (!guarded && (pressedR || clicked)) restartRun();
     } else if (mode === "replay") {
       replay.update(dt);
       world.update(replay.view, dt);
@@ -234,7 +249,7 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       hud.chant(replay.playhead);
       if (replay.finished) setMode("won");
     } else {
-      // Départ et pause : la partie est figée, le son aussi.
+      // Départ, pause et fin de victoire : la partie est figée, le son aussi.
       audio.freeze(TIME.min);
     }
 
@@ -272,6 +287,11 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       setMode("start");
       input.lock();
     },
+    resume(): void {
+      input.lock();
+    },
+    restart: restartRun,
+    rewatch,
   };
   return engine;
 }
diff --git a/src/app/hud.ts b/src/app/hud.ts
index 9eaa725..b60f665 100644
--- a/src/app/hud.ts
+++ b/src/app/hud.ts
@@ -2,12 +2,13 @@
 
 export type HudMessage = "start" | "paused" | "dead" | "replay" | "won" | "none";
 
+// La pause et la fin de victoire ont leur panneau Encre (ui/room-panels.ts) : pas de texte du HUD.
 const MESSAGES: Record<Exclude<HudMessage, "none" | "replay">, string> = {
   start: "CLIQUE POUR JOUER",
-  paused: "PAUSE ‧ CLIQUE POUR REPRENDRE",
+  paused: "",
   // Spec 4.4 : texte discret ; un clic relance aussi.
   dead: "R ‧ RECOMMENCER",
-  won: "R ‧ REJOUER  ·  ESPACE ‧ REVOIR",
+  won: "",
 };
 
 export class Hud {
diff --git a/src/app/main.ts b/src/app/main.ts
index a45ba5c..7ea72cb 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -11,8 +11,9 @@ import { LoaderScreen } from "../ui/loader";
 import { MenuScreen } from "../ui/menu";
 import { MobileScreen } from "../ui/mobile";
 import { type PanelHandle, creditsBody, openPanel, roomsBody, settingsBody } from "../ui/panels";
+import { RoomPanels } from "../ui/room-panels";
 import { browserEnvironment, playOnDesktopOnly } from "./device";
-import type { Engine } from "./engine";
+import type { Engine, EngineMode } from "./engine";
 
 const params = new URLSearchParams(window.location.search);
 const screens = document.querySelector<HTMLElement>("#screens")!;
@@ -57,8 +58,11 @@ async function boot(): Promise<void> {
       debug: params.has("debug"),
       forceWebGL: params.get("renderer") === "webgl",
       onSettingsChange: (next) => saveSettings(storage, next),
+      onModeChange: (mode) => onModeChange(mode),
     }),
   );
+  // Panneaux de la salle, branchés une fois le menu construit (plus bas).
+  let onModeChange: (mode: EngineMode) => void = () => undefined;
   // Rejet traité plus bas, après le geste : on le marque comme attendu dès maintenant.
   enginePromise.catch(() => undefined);
   await loader.waitForGesture(() => audio.unlock());
@@ -120,6 +124,32 @@ async function boot(): Promise<void> {
     },
   );
 
+  // Salle : pause et fin de victoire (spec 4.4). Menu : retour au menu, depuis l'un ou l'autre.
+  const roomPanels = new RoomPanels(screens);
+  const backToMenu = (): void => {
+    roomPanels.hide();
+    audio.ui("back");
+    engine.showMenu();
+    menu.show();
+  };
+  onModeChange = (mode) => {
+    if (mode === "paused") {
+      roomPanels.show("Pause", "Le temps est figé", [
+        { label: "Reprendre", key: "Clic", run: () => engine.resume() },
+        { label: "Recommencer", code: "KeyR", key: "R", run: () => engine.restart() },
+        { label: "Menu", code: "KeyM", key: "M", run: backToMenu },
+      ]);
+    } else if (mode === "won") {
+      roomPanels.show("Salle nettoyée", "Le temps t'a obéi", [
+        { label: "Rejouer", code: "KeyR", key: "R", run: () => engine.restart() },
+        { label: "Revoir le replay", code: "Space", key: "Espace", run: () => engine.rewatch() },
+        { label: "Menu", code: "KeyM", key: "M", run: backToMenu },
+      ]);
+    } else {
+      roomPanels.hide();
+    }
+  };
+
   await loader.hide();
   engine.showMenu();
   menu.show();
diff --git a/src/ui/screens.css b/src/ui/screens.css
index e9e3077..ca680dd 100644
--- a/src/ui/screens.css
+++ b/src/ui/screens.css
@@ -513,3 +513,26 @@
   letter-spacing: 0.04em;
   line-height: 1.6;
 }
+
+/* ---------- Salle : pause et fin de victoire (spec 4.4) ---------- */
+
+.room-panels {
+  display: grid;
+  place-items: center;
+  background: rgb(13 17 27 / 0.35);
+}
+
+.room-panel {
+  display: grid;
+  gap: 10px;
+  width: min(420px, 90vw);
+}
+
+.room-panel h2 {
+  margin-bottom: 0;
+}
+
+.room-panel-sub {
+  margin-bottom: 10px;
+  color: #5b6170;
+}
```

- [ ] **Step 3 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t10-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `201 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 4 : vérifier dans Chrome**

`http://localhost:5299/?debug`, une touche, puis « Jouer » dans le menu.
1. `window.agenthot.forceMode("paused")` : capture `t10-pause.png`. **Attendu :** plaque Encre centrée « Pause / Le temps est figé » avec Reprendre (Clic), Recommencer (R), Menu (M), la salle voilée derrière ; **aucun** élément du menu visible.
2. `window.agenthot.forceMode("won")` : capture `t10-won.png`. **Attendu :** « Salle nettoyée / Le temps t'a obéi », Rejouer (R), Revoir le replay (Espace), Menu (M).
3. Touche M : le menu revient, la salle figée derrière, la musique du menu reprend (si elle existe).
4. En jouant, fenêtre au premier plan : Échap en pleine partie ouvre la pause ; Reprendre reprend la souris (un deuxième clic peut être nécessaire moins d'une seconde après Échap : Chrome refuse le verrou, Review Focus 3).

- [ ] **Step 5 : commit**

```bash
cd <racine> && git add src/ui/room-panels.ts src/app/engine.ts src/app/hud.ts src/app/main.ts src/ui/screens.css && git commit -m "feat(ui): pause and victory panels, back to the menu"
```

---

### Task 11 : la cinématique d'accueil (spec 4.2, AC-11)

À la première visite, la cinématique joue après le geste du chargeur, pendant que le moteur finit de se charger ; n'importe quelle touche ou un clic la passe ; ensuite, le drapeau `agenthot.introSeen` envoie directement au menu. L'entrée « Intro » du menu la rejoue (le moteur se met en pause, la musique du menu s'arrête). Le chargeur précharge le début de la vidéo, sans l'attendre plus de 1,5 s. Tant que la vidéo n'existe pas (plan 3b), la cinématique se termine aussitôt.

**Files :**
- Create : `src/ui/intro.ts`
- Modify : `src/settings/settings.ts`, `tests/settings.test.ts`, `src/audio/game-audio.ts`, `src/app/engine.ts`, `src/app/main.ts`, `src/ui/screens.css`

**Interfaces :**
- Consumes : `INTRO_VIDEO`, `introVideoMarkup` (tâche 7), `MenuScreen` (tâche 9).
- Produces : `INTRO_SEEN_KEY` (`"agenthot.introSeen"`), `readIntroSeen(storage)`, `markIntroSeen(storage)` ; `INTRO`, `class IntroScreen { ready; play(volume): Promise<void> }` ; `GameAudio.stopMusic()` ; `Engine.sleep()`.

- [ ] **Step 1 : écrire les tests**

```diff
diff --git a/tests/settings.test.ts b/tests/settings.test.ts
index 0318b8b..0e36b29 100644
--- a/tests/settings.test.ts
+++ b/tests/settings.test.ts
@@ -1,11 +1,14 @@
 import { describe, expect, test } from "bun:test";
 import {
   DEFAULT_SETTINGS,
+  INTRO_SEEN_KEY,
   SETTINGS_KEY,
   SETTING_RANGES,
   type SettingsStorage,
   clampSetting,
   loadSettings,
+  markIntroSeen,
+  readIntroSeen,
   saveSettings,
   sanitizeSettings,
 } from "../src/settings/settings";
@@ -67,3 +70,18 @@ describe("paramètres (spec 4.5, AC-14)", () => {
     expect(() => saveSettings(null, { ...DEFAULT_SETTINGS })).not.toThrow();
   });
 });
+
+describe("cinématique à la première visite seulement (spec 4.2, AC-11)", () => {
+  test("première visite : pas vue ; une fois marquée, elle est vue aux visites suivantes", () => {
+    const storage = memoryStorage();
+    expect(readIntroSeen(storage)).toBe(false);
+    markIntroSeen(storage);
+    expect(storage.data[INTRO_SEEN_KEY]).toBe("1");
+    expect(readIntroSeen(storage)).toBe(true);
+  });
+
+  test("stockage absent ou refusé : la cinématique rejoue, sans erreur", () => {
+    expect(readIntroSeen(null)).toBe(false);
+    expect(() => markIntroSeen(memoryStorage({}, true))).not.toThrow();
+  });
+});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd <racine> && RTK_DISABLED=1 bun test tests/settings.test.ts`
Expected : échec, `INTRO_SEEN_KEY`, `readIntroSeen`, `markIntroSeen` n'existent pas.

- [ ] **Step 3 : écrire le code**

`src/ui/intro.ts` :

```ts
// Cinématique (spec 4.2) : plein écran, passable par n'importe quelle touche ou un clic. Tant que le fichier
// n'existe pas (plan 3b), ou s'il est illisible, elle se termine aussitôt, sans erreur.
import { EASE } from "./dom";
import { introVideoMarkup } from "./media";

export const INTRO = {
  // Le chargeur n'attend pas plus longtemps que la vidéo soit prête à démarrer (AC-10).
  readyTimeoutMs: 1500,
} as const;

export class IntroScreen {
  readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private failed = false;
  // Promesse résolue quand la vidéo peut démarrer, ou quand elle a échoué.
  readonly ready: Promise<void>;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("section");
    this.root.className = "screen intro";
    this.root.hidden = true;
    this.root.innerHTML = `${introVideoMarkup("intro-video", false)}<p class="label intro-skip">Une touche pour passer</p>`;
    parent.appendChild(this.root);
    this.video = this.root.querySelector("video")!;
    this.ready = new Promise((resolve) => {
      this.video.addEventListener("canplay", () => resolve(), { once: true });
      // L'échec de la dernière source veut dire qu'aucune ne marche.
      this.video.querySelector("source:last-of-type")!.addEventListener("error", () => {
        this.failed = true;
        resolve();
      });
      setTimeout(resolve, INTRO.readyTimeoutMs);
    });
  }

  // Joue la cinématique jusqu'au bout ou jusqu'au premier geste. `volume` : de 0 à 1 (volume musique).
  play(volume: number): Promise<void> {
    if (this.failed) return Promise.resolve();
    this.root.hidden = false;
    this.video.currentTime = 0;
    this.video.volume = volume;
    return new Promise((resolve) => {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        window.removeEventListener("keydown", finish);
        window.removeEventListener("pointerdown", finish);
        this.video.removeEventListener("ended", finish);
        this.video.pause();
        this.root
          .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: EASE })
          .finished.then(() => {
            this.root.hidden = true;
            resolve();
          });
      };
      window.addEventListener("keydown", finish);
      window.addEventListener("pointerdown", finish);
      this.video.addEventListener("ended", finish);
      // Lecture refusée (politique du navigateur) ou fichier absent : on passe directement.
      this.video.play().catch(finish);
      this.root.querySelector<HTMLElement>(".intro-skip")!.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        delay: 1500,
        easing: EASE,
        fill: "backwards",
      });
    });
  }
}
```

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index 1300f1d..af517c0 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -45,6 +45,8 @@ export interface Engine {
   restart(): void;
   // Victoire : revoir le replay.
   rewatch(): void;
+  // Plus rien à dessiner (cinématique par-dessus) : le GPU se repose jusqu'au prochain showMenu ou enterRoom.
+  sleep(): void;
 }
 
 export async function createEngine(options: EngineOptions): Promise<Engine> {
@@ -292,6 +294,9 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     },
     restart: restartRun,
     rewatch,
+    sleep(): void {
+      setMode("idle");
+    },
   };
   return engine;
 }
diff --git a/src/app/main.ts b/src/app/main.ts
index 7ea72cb..f75c364 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -1,12 +1,14 @@
 // Point d'entrée : léger, sans Three.js. Il affiche le chargeur (ou l'écran mobile) tout de suite, pendant que
-// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → menu → salle (spec 4).
+// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → cinématique (première visite)
+// → menu → salle (spec 4).
 import "../ui/tokens.css";
 import "../ui/screens.css";
 import "./style.css";
 import { GameAudio } from "../audio/game-audio";
 import { ROOMS } from "../rooms/registry";
-import { browserStorage, loadSettings, saveSettings } from "../settings/settings";
+import { browserStorage, loadSettings, markIntroSeen, readIntroSeen, saveSettings } from "../settings/settings";
 import { TIME } from "../sim/time";
+import { IntroScreen } from "../ui/intro";
 import { LoaderScreen } from "../ui/loader";
 import { MenuScreen } from "../ui/menu";
 import { MobileScreen } from "../ui/mobile";
@@ -47,8 +49,10 @@ async function boot(): Promise<void> {
   window.addEventListener("keydown", () => audio.unlock());
   window.addEventListener("pointerdown", () => audio.unlock());
 
-  // Polices et boucle du menu (spec 4.1) : la boucle absente (pas encore générée) n'empêche pas d'entrer.
-  await loader.waitReady([document.fonts.ready, audio.loadMenuMusic()]);
+  // Première visite : la cinématique se précharge pendant le chargeur (spec 4.1 et 4.2).
+  let intro = readIntroSeen(storage) ? null : new IntroScreen(screens);
+  // Polices, boucle du menu et début de la cinématique : un fichier absent (pas encore généré) n'empêche pas d'entrer.
+  await loader.waitReady([document.fonts.ready, audio.loadMenuMusic(), ...(intro ? [intro.ready] : [])]);
   // Le moteur (Three.js, 90 % du code, puis l'initialisation du rendu) se charge une fois l'invite affichée,
   // pendant que le joueur la lit : il ne dispute pas le fil principal au chargeur (AC-10).
   const enginePromise = import("./engine").then(({ createEngine }) =>
@@ -67,6 +71,11 @@ async function boot(): Promise<void> {
   enginePromise.catch(() => undefined);
   await loader.waitForGesture(() => audio.unlock());
   loader.busy();
+  // Le jeu finit de se charger pendant la cinématique ; le chargeur reste dessous si elle se termine avant lui.
+  if (intro) {
+    await intro.play(settings.musicVolume / 100);
+    markIntroSeen(storage);
+  }
   let engine: Engine;
   try {
     engine = await enginePromise;
@@ -91,6 +100,16 @@ async function boot(): Promise<void> {
     menu.setPanelOpen(true);
     panel = openPanel(menu.panelSlot, title, body, onPanelClosed);
   };
+  // Intro : rejoue la cinématique (spec 4.3), puis revient au menu.
+  const replayIntro = async (): Promise<void> => {
+    menu.hide();
+    engine.sleep();
+    audio.stopMusic();
+    intro ??= new IntroScreen(screens);
+    await intro.play(settings.musicVolume / 100);
+    engine.showMenu();
+    menu.show();
+  };
   // Jouer : le clic (ou la touche) qui lance la salle est aussi celui qui prend la souris (AC-10).
   const play = (): void => {
     closePanel();
@@ -104,6 +123,7 @@ async function boot(): Promise<void> {
       { action: "rooms", label: "Salles", hint: `1 / ${ROOMS.length}` },
       { action: "settings", label: "Paramètres" },
       { action: "credits", label: "Crédits" },
+      { action: "intro", label: "Intro" },
     ],
     {
       onSound: (sound) => audio.ui(sound),
@@ -120,6 +140,7 @@ async function boot(): Promise<void> {
             }),
           );
         } else if (action === "credits") showPanel("Crédits", creditsBody());
+        else if (action === "intro") void replayIntro();
       },
     },
   );
diff --git a/src/audio/game-audio.ts b/src/audio/game-audio.ts
index 08c3b39..f7f711c 100644
--- a/src/audio/game-audio.ts
+++ b/src/audio/game-audio.ts
@@ -63,6 +63,11 @@ export class GameAudio {
     this.switchTo(this.menuMusic);
   }
 
+  // Plus aucune musique (la cinématique porte la sienne).
+  stopMusic(): void {
+    for (const track of [this.gameMusic, this.replayMusic, this.menuMusic]) track.stop();
+  }
+
   // Son d'interface, joué tout de suite, même temps figé (il ne passe pas par le filtre du temps).
   ui(sound: UiSound): void {
     const engine = this.engine;
diff --git a/src/settings/settings.ts b/src/settings/settings.ts
index 759f32b..13dba5b 100644
--- a/src/settings/settings.ts
+++ b/src/settings/settings.ts
@@ -89,6 +89,25 @@ export function saveSettings(storage: SettingsStorage | null, settings: Settings
   }
 }
 
+// Cinématique déjà vue (spec 4.2, AC-11) : ensuite, on arrive directement au menu.
+export const INTRO_SEEN_KEY = "agenthot.introSeen";
+
+export function readIntroSeen(storage: SettingsStorage | null): boolean {
+  try {
+    return storage?.getItem(INTRO_SEEN_KEY) === "1";
+  } catch {
+    return false;
+  }
+}
+
+export function markIntroSeen(storage: SettingsStorage | null): void {
+  try {
+    storage?.setItem(INTRO_SEEN_KEY, "1");
+  } catch {
+    // Stockage refusé : la cinématique rejouera à la prochaine visite, rien de plus.
+  }
+}
+
 // localStorage du navigateur, ou rien s'il est inaccessible (son simple accès peut lever une exception).
 export function browserStorage(): SettingsStorage | null {
   try {
diff --git a/src/ui/screens.css b/src/ui/screens.css
index ca680dd..0ce1493 100644
--- a/src/ui/screens.css
+++ b/src/ui/screens.css
@@ -536,3 +536,22 @@
   margin-bottom: 10px;
   color: #5b6170;
 }
+
+/* ---------- Cinématique (spec 4.2) ---------- */
+
+.intro {
+  background: var(--void);
+}
+
+.intro-video {
+  width: 100%;
+  height: 100%;
+  object-fit: contain;
+  background: var(--void);
+}
+
+.intro-skip {
+  position: absolute;
+  right: 4vw;
+  bottom: 4vh;
+}
```

- [ ] **Step 4 : tests, types, build**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-t11-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build`
Expected : `203 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 5 : vérifier dans Chrome avec une vidéo d'essai (AC-11)**

Une vidéo d'essai locale, **jamais commitée** (`public/video/` n'est pas ajoutée) :

```bash
cd <racine> && mkdir -p public/video && ffmpeg -loglevel error -y -f lavfi -i testsrc2=size=1280x720:rate=30:duration=4 -f lavfi -i sine=frequency=440:duration=4 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart public/video/intro.mp4
```

1. `localStorage.removeItem("agenthot.introSeen")`, recharger `http://localhost:5299/?debug`, une touche. **Attendu :** la mire joue avec son bip (repli MP4 : le WebM n'existe pas), « Une touche pour passer » apparaît en bas à droite ; à la fin, le menu ; `localStorage.getItem("agenthot.introSeen")` vaut `"1"`.
2. Recharger, une touche : **attendu** le menu directement, sans cinématique.
3. Entrée « Intro » du menu : la mire rejoue ; une touche la passe ; le menu revient.
4. Mettre la vidéo d'essai à la corbeille : `cd <racine> && trash public/video`. Recharger avec `introSeen` retiré : **attendu** le menu directement après la touche, sans erreur.

- [ ] **Step 6 : commit**

```bash
cd <racine> && git add src/ui/intro.ts src/settings/settings.ts tests/settings.test.ts src/audio/game-audio.ts src/app/engine.ts src/app/main.ts src/ui/screens.css && git commit -m "feat(ui): first-visit intro, skippable, replayable from the menu"
```

---

### Task 12 : recette et regard de Romain (porte avant le plan 3b)

Cette tâche ne s'automatise pas entièrement. L'exécutant mesure ce qui se mesure, puis s'arrête et attend le verdict de Romain.

- [ ] **Step 1 : suite complète**

Run : `cd <racine> && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3a-final-tests.log && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build 2>&1 | tee .superpowers/plan-3a-final-build.log`
Expected : `203 pass`, `0 fail` ; `tsc` sans sortie ; build réussi.

- [ ] **Step 2 : fichiers absents, sur le build (Review Focus 1)**

`cd <racine> && bun run preview --port 5298 --strictPort` en arrière-plan, puis `http://localhost:5298/`. **Attendu :** invite, menu, panneaux, salle, sans erreur en console ; dans l'onglet Réseau, `menu.mp3`, `room-01.webp`, `room-02.webp`, `intro.webm`, `intro.mp4` en 404, et c'est tout.

- [ ] **Step 3 : stockage abîmé (Review Focus 2)**

`localStorage.setItem("agenthot.settings.v1", "{abîmé")`, recharger : **attendu** les réglages par défaut dans le panneau, aucune erreur.

- [ ] **Step 4 : parties jouées par Romain (fenêtre au premier plan)**

Donner à Romain `http://localhost:5299/?debug`, son allumé.
- **AC-10, partie clic :** chronométrer du clic sur « Jouer » à la première image contrôlable. Attendu ≤ 1 000 ms. Mesure : `performance.now()` au clic (`pointerdown`) et à l'événement `pointerlockchange`, lus en console.
- **Review Focus 3 :** Échap en pleine partie, puis Reprendre tout de suite, puis de nouveau une seconde plus tard.
- **AC-6 (non-régression) :** mourir, R : la console debug affiche `[agenthot] restart … ms` < 50.
- **AC-13 :** captures départ, combat, éclatement, mort, replay, dans `.superpowers/plan-3a-captures/`. Question à Romain : « Seul ce qui te menace est orange, et cet orange reste vif dans l'ombre ? »

- [ ] **Step 5 : qualité et chaleur (Review Focus 4, report 25)**

Panneau debug, fenêtre au premier plan, écran Retina à 120 Hz : `60 fps ‧ res 1` en auto ; passer « Qualité » à Haute : jusqu'à `120 fps` ; revenir à Auto. Demander à Romain si le ventilateur se calme par rapport au plan 2.

- [ ] **Step 6 : recueillir le verdict**

Poser ces questions à Romain, une par une :
1. Le chargeur (facettes, puis logo, puis invite) : ça pose l'univers ?
2. Le menu sur la salle figée : ça claque ? Le cadrage de la caméra ?
3. Les panneaux Encre (Salles, Paramètres, Crédits, Pause, Victoire) : lisibles, beaux ?
4. Le pistolet et les mains : ça tient la comparaison avec les ennemis en cristal ?
5. L'orange dans l'ombre : vif, et le cristal toujours lisible ?

- [ ] **Step 7 : régler, puis arrêter**

- Les réglages vivent dans `POST` (`post.ts`), `MENU_CAMERA` et `MENU_DEMO` (`menu-demo.ts`), `REST` et `FIST_REST` (`view-model.ts`), les formes de `weapon-shapes.ts`, les tokens de `tokens.css`, `LOADER` (`loader.ts`), les éclats `SHARDS` (`menu.ts`).
- Relancer `bun test` après chaque réglage : les tests vérifient des comportements, pas des valeurs.
- Commit par série de réglages : `tune: <quoi>`.
- La revue finale de la branche (Opus 5.5, effort xhigh) se fait après ce passage, puis la fusion sur le « go » de Romain.
- **S'arrêter là.** Le plan 3b ne démarre qu'après le « go » de Romain.

## Couverture des critères d'acceptation

| AC | Ce que 3a fait | Où c'est vérifié |
| :--- | :--- | :--- |
| AC-8 | Qualité auto et limite à 60 images par seconde | Tâche 4 (tests), tâche 12 étape 5 ; la trace au pire moment est au plan 3c |
| AC-10 | Invite en moins de 2 s ; clic sur Jouer → souris prise | Tâche 7 étape 6.1 (repère `agenthot:prompt`), tâche 12 étape 4 ; la mesure réseau limité à 50 Mb/s et le poids sont au plan 3c |
| AC-11 | Cinématique à la première visite, passable, rejouable | Tâche 11 étape 5 (vidéo d'essai) ; avec la vraie cinématique au plan 3b |
| AC-12 | Écran « Joue sur ordi », sans moteur | Tâche 7 étape 6.3 et 6.4 |
| AC-13 | Orange vif dans l'ombre, rien d'autre en orange dans la scène | Tâche 2 étape 3, tâche 12 étape 4 |
| AC-14 | Paramètres gardés et appliqués | Tâche 5 (tests et étape 5), tâche 9 étape 6.2 |
| AC-15 | Ligne exacte des crédits | Tâche 9 (test et étape 6.3) ; valeurs finales au plan 3c |
| AC-6 | Relance < 50 ms, inchangée | Tâche 12 étape 4 |

## Décisions pour Romain

1. **La cinématique joue avec le son de la vidéo, réglé par le volume musique.** Elle ne passe pas par le graphe Web Audio (pas de compresseur commun). Recommandation : garder, c'est le plus simple et le rendu est celui du fichier.
2. **Qualité « auto » limitée à 60 images par seconde**, « haute » sans limite (jusqu'à 120). Recommandation : garder, c'est ce qui calme le ventilateur ; la spec 9.2 dit « jusqu'à 120 sur un écran rapide », ce que « haute » garde.
