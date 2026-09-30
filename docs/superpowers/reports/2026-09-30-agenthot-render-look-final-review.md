# Revue finale spike/render-look (c53b0a6..6964520), 2026-09-30

Opus 5.5, xhigh. Un relecteur indépendant (même modèle, contexte neuf) a lu le code. Un second agent a fait le contrôle d'actualité sur le web. J'ai tout recoupé moi-même : code lu, scripts relancés, mesures dans Chrome. 4 commits, 8 fichiers, +310 / -15 lignes.

Le rendu est validé par Romain. Cette revue ne propose aucun changement de goût.

## Verdict

**Fusionnable après corrections.** Aucun défaut critique. La simulation, le replay et la démo du menu sont prouvés inchangés.

À corriger avant la fusion (petit, sans toucher au rendu validé) :
1. Le coin d'ombre manquant au sol (défaut 1).
2. La cible `normal` rendue pour rien (défaut 2).
3. Le plantage sur une salle sans baie (défaut 3).
4. Les commentaires devenus faux (défaut 6).

À trancher par Romain (voir « Décisions ») : le critère des 60 appels de dessin, le halo sombre autour de l'arme, les lignes de la spec à mettre à jour.

## Vérifications relancées

- `bun test` : 279 pass, 0 fail, 32 fichiers.
- `bun run typecheck` : propre, exit 0.
- `bun run build` : OK. Entrée 40,05 kB (14,30 kB gzip), moteur 1 009,02 kB (282,01 kB gzip). Avant (revue 3b) : 991,11 kB (275,67 kB gzip). Soit +6 kB gzip.
- Console du navigateur : aucune erreur, aucun avertissement, en WebGPU et en WebGL2. `gl.getError()` : 0.
- Journaux : `scratchpad/pilot-bun-test.log`, `pilot-typecheck.log`, `pilot-build.log`, `pilot-check-decor.log`, `pilot-rerun-review-sim.log` (session de revue). Scripts du relecteur : `review-sim.ts`, `review-render.ts`, `review-extra.ts`, relancés par moi.
- Captures : `.superpowers/render-spike/review-*.jpg` (local, ignoré par git).

## Mesures

Machine : Apple M1 Pro (lu dans `UNMASKED_RENDERER_WEBGL`), chargée. Fenêtre de 1236 × 835 points.

**Méthode.** L'onglet piloté était caché : pas de cadence à l'écran mesurable. J'ai donc fait tourner les images à la main (`nodeFrame.update()` puis `post.render()`), 100 à 150 images par série, puis attendu la fin du travail du GPU (`onSubmittedWorkDone` en WebGPU, `gl.finish` + `readPixels` en WebGL2). Le chiffre est le **temps par image** (envoi + GPU), pas une cadence à l'écran. État du jeu : départ + 1,5 s, 3 ennemis. `main` a été servi à part depuis une copie (`git archive c53b0a6`) dans le scratchpad.

| Rendu | Taille de l'image | `main` | branche | Rapport |
| :--- | :--- | :--- | :--- | :--- |
| WebGPU | 1236 × 835 | 1,24 ms | 2,90 ms | × 2,3 |
| WebGPU | 1854 × 1252 | 2,15 ms | 6,03 ms | × 2,8 |
| WebGPU | 2472 × 1670 (Retina) | 3,49 ms | 11,0 ms | × 3,2 |
| WebGL2 | 1236 × 835 | 3,65 ms | 5,15 ms | × 1,4 |
| WebGL2 | 1854 × 1252 (plafond 1,5) | 7,7 ms | 11,3 ms | × 1,5 |

| Compteur (`renderer.info`) | `main` | branche |
| :--- | :--- | :--- |
| Appels de dessin par image | 42 | 70 |
| Triangles par image | 26 311 | 308 814 |
| Rendus de la carte d'ombre par image | 1 | 1 |

**Où part le temps** (WebGPU, 2472 × 1670, pipeline réduit sans halo ni rampe) :

| Étape | Temps | Ajout |
| :--- | :--- | :--- |
| Scène avec le nouveau décor | 1,45 ms | |
| + passe de profondeur à part | 1,75 ms | + 0,3 ms |
| + GTAO à demi-résolution | 6,6 ms | + 4,8 ms |
| + débruitage | 10,0 ms | + 3,4 ms |
| Pipeline réel complet | 11,0 ms | |

L'occlusion (GTAO + débruitage) fait 8,2 ms sur 11, soit 75 % de l'image. Le décor détaillé et la seconde passe de scène ne coûtent presque rien.

**Lecture.** 11 ms en Retina laisse environ 90 images/s de marge sur ce Mac. La barre de Romain (30 au minimum) est tenue largement, et sa mesure (60 images/s, res 1) est cohérente. Le repli WebGL2 est à 11,3 ms au plafond 1,5 : même marge.

## Critique

Aucun.

## Important

Aucun défaut important. Les deux points les plus lourds sont des décisions (D1 et D2 plus bas).

## Mineur

Classés par valeur.

1. **Coin d'ombre manquant au sol, angle sud-est. CONFIRMÉ, visible.** `src/render/world-renderer.ts:78` (`sun.shadow.camera.near = 1`) avec `src/rooms/room-01-datacenter.ts:12`.
   - Cause : la caméra d'ombre du soleil était réglée pour des murs de 6 m. À 7,5 m, le haut du coin sud-est passe devant son plan proche. Projeté dans cette caméra, le point (12 ; 7,5 ; 8) a une profondeur de -0,022 (hors champ). À 6 m il était à +0,011 (dedans, de justesse).
   - Effet : un biseau clair dans l'ombre des murs, au sol, vers x = 8,3 à 8,9 et z = 2,5 à 5,5.
   - Reproduction : caméra à (9,2 ; 6,8 ; 5,2), regard vers le bas. Capture : `.superpowers/render-spike/review-shadow-notch-se-corner.jpg`.
   - Preuve : avec `near = 0.1` dans la page, le biseau disparaît et le coin d'ombre redevient droit.
   - Régression de la branche. Correction : baisser `near`.

2. **La passe principale rend encore une cible `normal` que plus rien ne lit. CONFIRMÉ, mesuré.** `src/render/post.ts:90-93`.
   - Avec `POST.outline = false`, le détecteur de contours n'entre pas dans le shader (coût nul). Mais la troisième sortie reste créée et écrite : MSAA × 4, demi-flottant, pleine résolution.
   - Coût mesuré : 0,3 ms par image en Retina (1,53 → 1,23 ms sur la scène seule). Mémoire GPU estimée par le relecteur : environ 165 à 200 Mo en Retina (calcul, pas mesuré).
   - C'est le point chaud déjà noté dans `agenthot-pitfalls.md` (« MSAA ×4 sur 3 sorties en demi-flottant »).
   - Correction : ne demander `normal` que si `POST.outline` est vrai. Ou supprimer le contour (décision D3).

3. **`WorldRenderer` plante sur une salle sans baie. CONFIRMÉ.** `src/render/world-renderer.ts:124-126`.
   - Reproduction : `new WorldRenderer({ ...room01, rackBoxIndices: [] }, 16 / 9)` lève `TypeError: undefined is not an object (evaluating 'firstRack.max')`.
   - Avant la branche, une liste vide donnait un `InstancedMesh` vide. La salle de test de `tests/helpers.ts:21` est justement sans baie.
   - Latent aujourd'hui : seule la salle 1 est montée. Mais la spec 9.1 promet une salle 2 « sans modifier `render` ».
   - Même famille : la géométrie vient de la première baie seulement. Une baie d'une autre taille serait dessinée à la mauvaise taille, sans erreur.

4. **Le plafond visible n'est pas le plafond de collision. CONFIRMÉ.** `src/render/decor.ts:17-18`, `src/rooms/room-01-datacenter.ts:62-63`.
   - Panneaux dessinés de 6,76 à 6,84 m. Boîte de collision à 7,5 m.
   - Une balle tirée à la verticale s'arrête à 7,46 m, donc au-dessus des panneaux. Ennemi de la passerelle tué d'en bas : 2 éclats sur 36 traversent les panneaux (hauteur max 7,16 m).
   - Cosmétique et rare.

5. **La passe de profondeur de l'occlusion redessine toute la scène.** `src/render/post.ts:154-155`. CONFIRMÉ.
   - 22 appels de dessin, dont 7 inutiles pour l'occlusion : arme du joueur, traits de visée, têtes de balles, traînées, deux maillages d'éclats, armes du monde.
   - C'est aussi la cause du halo autour de l'arme (décision D2) et la moitié du dépassement des 60 appels (décision D1).
   - `PassNode.setLayers` existe pour trier.

6. **Commentaires devenus faux. CONFIRMÉ.**
   - `post.ts:1-2` : « contours fins à l'encre… Un seul rendu de la scène ». Il y a deux rendus et plus de contour.
   - `post.ts:65-66` : parle encore du contour à l'encre.
   - `room-01-datacenter.ts:58-61` : « jamais dessiné : la salle reste ouverte sur le vide ».
   - `world-renderer.ts:122-123` : « une baie sur deux ». `(i * 7) % 3 === 0` vaut `i % 3 === 0` : c'est une baie sur trois (12 sur 36), le même motif dans chaque rangée. Le `* 7` ne fait rien.
   - `materials.ts:7-9` : « garde l'ambiance d'avant ». Les chiffres disent autre chose : 2,8 × 0,85 = 2,38 par le haut, contre 1,4 avant.

7. **Aucun test sur le nouveau code.** 279 tests avant, 279 après.
   - Non testés : la collision des étagères, `interior`, les trois fabriques de géométrie (elles tournent sous bun, mes scripts le montrent).
   - Un invariant utile existe et tient aujourd'hui : ce qui est dessiné tient exactement dans sa boîte de collision (baie : ±0,5 × ±1,1 × ±0,4 ; étagères : ±2,8 × ±1,05 × ±0,225). Il n'est protégé par aucun test.
   - Le test modifié (`tests/rooms.test.ts:148-150`) reste bon : il tire une vraie balle et lie `interior.height` au plafond de collision.

8. **La suite pseudo-aléatoire des étagères n'est pas celle qu'elle semble.** `src/render/decor.ts:172-175`.
   - `n * 1103515245` dépasse 2^53 sur 197 tirages sur 200 : les bits bas sont perdus.
   - Elle reste la même à chaque chargement (calcul flottant identique partout). Sans danger pour du décor.
   - `src/sim/rng.ts` existe déjà.

9. **Le cast sur `DenoiseNode`.** `src/render/post.ts:163`.
   - Correct à l'exécution : `DenoiseNode` rend un vec4, la cible du GTAO est en rouge seul, `.r` est bien l'occlusion.
   - Le cast ment sur le type (ce n'est pas une texture). C'est un trou de `@types/three`, pas un bug.

10. **Constantes sans effet ou sans lecteur.** `POST.aoStrength = 1` ne change rien. `LOOK`, `DECOR`, `THREAT_AMBIENT`, `RackSize` sont exportés mais lus seulement dans leur fichier.

## Décisions pour Romain

Ce ne sont pas des défauts à corriger d'office.

**D1. Le critère « moins de 60 appels de dessin » n'est plus tenu.** Spec 9.2, AC-8, et AC-3c-5 du plan 3c (« `maxDrawCalls` < 60 », ligne 1929).
- Mesuré : 70 en jeu (42 sur `main`). Le plan 3c échouera sur ce critère tel qu'il est écrit.
- Option A (recommandée) : relever le seuil. C'est un indicateur. Ce qu'il protège, la cadence, est tenu.
- Option B : réduire. Trier la passe de l'occlusion (-7) et fusionner dalle et bandeaux (-2) donne 61. Passer sous 60 demande de sortir aussi les ennemis de cette passe : ils perdent leur ombre de contact.

**D2. Halo sombre autour de l'arme, près d'une baie ou d'un mur. CONFIRMÉ, mesuré.**
- Cause : l'arme du joueur est dans la passe de profondeur de l'occlusion. À moins de 0,9 m d'une surface, elle « fait de l'ombre » dessus.
- Mesure : à 0,6 m d'une baie, les pixels à moins de 16 px de l'arme perdent 40 niveaux sur 255 (environ 16 %). Dans la salle ouverte : 0.
- Captures : `.superpowers/render-spike/review-gun-halo-gun-visible.jpg` et `review-gun-halo-gun-hidden.jpg`.
- Se voit quand on s'abrite contre une baie. Le halo suit l'arme (recul, coup de poing).
- Option A (recommandée) : sortir l'arme de cette passe. Le halo part, 2 appels de dessin aussi.
- Option B : le garder. Il peut se lire comme une ombre de l'arme. À toi de regarder : colle-toi à une baie.

**D3. Le contour à l'encre : supprimer le code ou garder l'interrupteur.**
- `POST.outline` est une constante à `false`. Tant qu'elle l'est, sont morts : `edge`, `invZ`, `texel`, `normalTex`, `depthTex` (`post.ts:92-128`), `POST.outlineDepth`, `POST.outlineNormal`, et la sortie `normal` (défaut 2).
- Recommandé : supprimer. Git garde l'ancien contour.

**D4. Lignes de la spec à mettre à jour si le rendu reste.**
- 6.2 « Contours : fins, couleur `ink` » et AC-9 « contours et glow compris ». Aussi AC-3c-7 et la ligne 1922 du plan 3c (« contours noirs »).
- 5.7 « Chemins de câbles gris au plafond. Vide bleu nuit au-delà » : le plafond est fermé, le vide ne se voit plus que dans le fondu du menu.
- 6.1 : cinq couleurs hors palette (`#AEB2BA`, `#F1F1EE`, `#F4F4F2`, `#F2F2F2`, blanc pur). La règle « orange réservé à la menace » est respectée.
- `scripts/generate-image.ts:18` demande encore « thin black ink outlines » aux images générées.

**D5. Qualité basse : couper l'occlusion ou non.**
- Aujourd'hui la qualité ne règle que la résolution et la cadence (`quality.ts:49-52`). L'occlusion reste.
- Son coût baisse avec la résolution (palier 0,7 = moitié des pixels).
- Mais c'est elle qui donne le relief depuis que le contour est parti. La couper en « basse » aplatit la salle, sauf à y remettre le contour.
- Recommandé : ne rien changer maintenant. À rouvrir si une machine faible passe sous 30 images/s.

## Réponses aux questions posées

- **Simulation.** Inchangée.
  - Démo du menu rejouée sur la salle d'avant (reconstruite : sans étagères, murs à 6 m) et sur la nouvelle : 53 échantillons, 5 événements, 0 valeur différente.
  - 50 parties aléatoires (entrées d'AC-5) : même fin sur les deux salles. 20 balles s'arrêtent maintenant sur les étagères.
  - Apparitions à z = -6,3 : 0,95 m de marge avec les étagères. Nœuds de navigation : 0,6 m de marge avec toute boîte.
  - Indices : étagères en 42 et 43, après les baies (6 à 41). Le plafond passe de 42 à 44, lu seulement par `hiddenBoxIndices`. Aucun code ne suppose 6 m ni une position de boîte.
  - Replay : il relit des positions, il ne rejoue pas la simulation (spec 5.8).
- **Zéro allocation par image (9.1).** Tenu. Tous les ajouts de `world-renderer.ts` sont dans le constructeur. `update()` n'a pas changé. Les allocations internes des passes de Three.js ne sont pas mesurées.
- **Ombres rendues deux fois ?** Non. Une seule fois par image (mesuré : un seul rendu `ShadowMap`, 12 appels). `ShadowNode.js:804` saute la seconde mise à jour pour la même caméra dans la même image.
- **La seconde passe calcule-t-elle l'éclairage pour rien ?** Sans effet mesurable : elle coûte 0,3 ms.
- **Repli WebGL2.** Même image, console propre, 11,3 ms au plafond 1,5. Coût plus faible en proportion qu'en WebGPU (× 1,5).
- **Code mort.** `worldMaterial`, `PALETTE.world2` et `inkMaterial` servent encore (murs, éclats neutres, armes). Le mort est listé en D3.
- **Types TSL.** `samples: 0` est bien lu (cible à 0 échantillon, vérifié en direct). `resolutionScale`, `radius`, `scale` sont de vrais membres (`GTAONode.js:91,118,148`). Le redimensionnement suit (GTAO à 680 × 459 pour une image de 1359 × 918).
- **Objets transparents dans la passe de profondeur.** Aucun matériau de la scène n'est transparent : sans objet ici.

## Contrôle d'actualité (Three.js)

- **Version.** La dernière est `0.186.1` (registre npm, vérifié par moi). Le dépôt est sur `0.186.0`. D'après l'agent, `GTAONode`, `DenoiseNode` et `PassNode` sont identiques entre les deux (comparaison des archives, relayé).
- **GTAONode + DenoiseNode.** Rien de déprécié dans ce que la branche utilise. Le montage est valide.
- **Ce n'est plus le montage de l'exemple officiel** (relayé par l'agent, liens ci-dessous) :
  - l'exemple `webgpu_postprocessing_ao` utilise GTAO avec filtrage temporel et TRAA, sans MSAA ; aucun exemple officiel n'appelle plus `denoise` ;
  - r186 a ajouté `SSAONode` (présent dans `node_modules`, vérifié), annoncé par son auteur comme environ 2 fois moins cher que GTAO, avec son flou intégré.
- **Conclusion.** Bon choix pour garder le MSAA et une image stable. C'est aussi la combinaison la plus chère. Si un jour le coût gêne, `SSAONode` est le levier : il changerait le rendu, donc à regarder avec Romain.
- **Le GTAO ne lit pas une profondeur MSAA en WebGPU** sur r186 (constaté par l'auteur de la branche, confirmé par l'agent avec l'issue 34598) : la passe à part est nécessaire, pas un contournement de confort. Un correctif est prévu pour r187, pas encore sorti.
- Sources : [guide de migration r185 → r186](https://github.com/mrdoob/three.js/wiki/Migration-Guide#185--186), [exemple AO r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_ao.html), [SSAONode, PR 33921](https://github.com/mrdoob/three.js/pull/33921), [GTAO et profondeur MSAA, issue 34598](https://github.com/mrdoob/three.js/issues/34598), [doc GTAONode](https://threejs.org/docs/pages/GTAONode.html).

## Grille « code creux »

1. **Exporté qui ne fait rien :** aucun module. `POST.aoStrength = 1` est sans effet.
2. **Suppression à la place du comportement :** le cast `as unknown as` (défaut 9) ; le `!` sur `rackBoxIndices[0]` qui cache le plantage (défaut 3).
3. **Constantes sans ancrage :** les valeurs de `DECOR`, `LOOK`, de l'occlusion et de `THREAT_AMBIENT` sont réglées à l'œil. Leur seul ancrage est la validation de Romain en jeu. Deux ont un ancrage réel : dalle de 60 cm, unité de 4,5 cm.
4. **Tests qui n'exercent rien :** aucun. Mais aucun test nouveau (défaut 7).
5. **Chemin heureux seulement :** salle sans baie, baies de tailles différentes, étagère ailleurs que sur le mur du fond, salle non centrée (défaut 3). Profondeur de tiroir négative sous 0,47 m de profondeur de baie.
6. **État géré moins finement que la spec :** la qualité « basse » ne touche pas à l'occlusion (D5).

## Non couvert

- Cadence réelle à l'écran : onglet caché. La mesure de Romain (60 images/s, res 1) reste la référence.
- Le pire moment (5 ennemis, éclatement) : non mesuré. Le nombre d'appels y est le même (maillages toujours dessinés).
- Un Mac Apple Silicon de base (spec 9.2) : non mesuré. **Hypothèse** : avec un GPU environ deux fois plus lent, l'image Retina serait vers 20 ms, et la qualité auto baisserait la résolution. Confiance moyenne.
- Safari, Firefox, mobile.
- Une partie jouée jusqu'à la victoire en WebGL2.
- Le halo de l'arme en WebGL2 (même code, non regardé).
- La cinématique, `og-v1.jpg` et les vignettes face au nouveau rendu (déjà dans la liste de reprise).
- Non repris de `rendu-simule/rendu-diff.md` : rayons de lumière, tone mapping, halo sur les bandeaux, grilles au sol. À confirmer comme abandonnés.

## Le meilleur argument contre mes réserves

Romain a joué, mesuré 60 images/s sur une machine chargée, et validé l'image. Face à ça :
- le nombre d'appels de dessin est un indicateur d'une cadence qui est tenue ;
- la cible inutile coûte 0,3 ms que personne ne sent ;
- le plantage demande une salle qui n'existe pas encore ;
- le biseau d'ombre est dans un coin, derrière le joueur au départ ;
- le halo de l'arme peut passer pour une ombre, et Romain ne l'a pas relevé en jouant.

Fusionner tel quel livrerait la même expérience. Mes points sont du rangement et deux choix d'image, pas un risque. Je maintiens les quatre corrections parce qu'elles sont petites et qu'une régression d'ombre connue n'a pas à entrer dans `main`.
