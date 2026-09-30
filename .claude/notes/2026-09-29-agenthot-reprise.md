# AGENTHOT : note de reprise (écrite le 2026-09-29 à 19:50)

## Mise à jour du 2026-09-30 à 20:12 (prime sur le reste de la note)
- **AGENTHOT est en ligne à https://agenthot.erom.cloud/** (porte 3, « go domaine » à 20:05). CNAME `agenthot` → `e7bee4fcc0c8a189.vercel-dns-017.com` chez Hostinger ; certificat Let's Encrypt jusqu'au 2026-12-29 (renouvelé par Vercel) ; http redirige en 308. Contrôle en ligne complet : all good.
- **Reste :** la tâche 13b (trois gestes de Romain, chacun sur son go : jeton d'origin trial WebMCP, Search Console et Bing, envoi IndexNow) et la tâche 14 (recette en ligne : Safari, une partie, la carte dans iMessage et une autre messagerie, téléphone). Les commits de notes depuis `60c4deb` sont locaux : ils partent au prochain push, sur un go.

## Mise à jour du 2026-09-30 à 20:07
- **Déployé** (porte 2, tâche 12, sur « go deploy » de Romain à 20:01) : `https://agenthot-the-game.vercel.app/`, projet Vercel `agenthot-the-game`. Contrôle en ligne : all good (vidéos en 206, cache long, 404, types de contenu). Le domaine n'est pas encore branché.
- `vercel link` a créé `.env.local` (jeton OIDC de Vercel) : ignoré par git (`.env*`), ne pas l'ouvrir.
- **Prochaine porte : le DNS (tâche 13)**, sur son go. Puis la tâche 13b (jeton WebMCP, Search Console et Bing, IndexNow) et la recette en ligne (tâche 14).

## Mise à jour du 2026-09-30 à 20:02
- **Poussé** (porte 1, tâche 11, faite par la session venus à 19:59, sur les mots de Romain : « garde mon adresse Gmail, go push » et « supprime la branche une fois fait et checké »). `origin/main` = `60c4deb`, dépôt public, page GitHub en 200. Branche `feat/agenthot-plan-3c` supprimée en local. AC-3c-11 tenu.
- Ce commit de note est **local** (`main` un commit devant `origin`) : il part au prochain push, sur un go.
- **Prochaine porte : le déploiement Vercel (tâche 12)**, sur son go. Puis le DNS (tâche 13) et la tâche 13b.

## Mise à jour du 2026-09-30 à 20:00
- **Plan 3c fusionné dans `main`** (avance rapide, `6e2ccd3`), sur le go de Romain (19:49, « Demande de fusion dans main validé »). 367 tests, `check-release dist` : all good. Rien poussé, rien déployé. La branche `feat/agenthot-plan-3c` est gardée (sa suppression attend son mot).
- **Dépôt GitHub rendu public par Romain** (19:49, « pour info ») ; toujours vide. **Prochaine porte : le push (tâche 11)**, avec son choix sur l'adresse Gmail des commits (garder, ou `noreply` avec réécriture de l'historique).
- **Crédits honnêtes** (sa demande de 19:49 : « On va préciser le coup du cache svp, pour ne pas se la jouer. C'est une vitrine opus, autant être honnête ! sur les tokens et coûts ») : sous « 1 129 844 422 tokens ‧ coût API estimé : 443,80 $ », la ligne « dont 1 097 034 905 tokens relus en cache (219,41 $) ‧ 4 947 744 tokens produits par les modèles, réflexion comprise ». Même précision dans le README, `llms.txt`, `llms-full.txt` et l'outil `get_credits` ; un test échoue si l'un d'eux ne suit pas un nouveau compte. `zsh scripts/count-tokens.sh …` sort maintenant une ligne `SPLIT`.

## Mise à jour du 2026-09-30 à 19:45
- **Revue finale faite** (neptune-2uki) : `docs/superpowers/reports/2026-09-30-agenthot-plan-3c-final-review.md`, 0 critique. Firefox joué par Romain à 19:39 (« ça marche nickel !!! », rendu non relevé). Ses 4 corrections (« go pour les 4 corrections ») et 2 mineurs gratuits : faits, relus, 358 tests, `check-release dist` : all good.
- **Crédits, dernier compte** à 19:44 : 1 120 605 292 tokens, 441,05 $. 97 % sont des relectures de cache ; 4,9 millions de tokens produits.
- **Backlog de la revue, non corrigé :** M5 à M9, M12 à M14 (liste dans `.superpowers/sdd/…/progress.md`).
- **Arrêt en cours : avant la fusion** (go de Romain, demandé par la session venus). Puis ses portes : push (public, choix de l'adresse Gmail), Vercel, DNS, tâche 13b.

## Mise à jour du 2026-09-30 à 19:05
- **Recette locale jouée par Romain (18:57) : tout validé.** Safari, repli WebGL2, icône, README, `llms.txt`. Branche `feat/agenthot-plan-3c`, 354 tests, rien poussé.
- **Cadence, tranchée par Romain à 19:01** (dit à la session venus) : « Accepter, j'ai mon Mac qui fait beaucoup de chose... je ne veux pas perdre en qualité alors que j'ai une machine vieille lol. » Son critère devient l'officiel : jamais sous 30 images/s sur son Mac M1 chargé. Sa partie : `maxMs` 31,9, `worstWindowP95Ms` 25,7, 63 appels de dessin. AC-8 (spec) et AC-3c-5 (plan) révisés. Pas de diagnostic, le rendu ne bouge pas.
- **Backlog cadence, sans y toucher :** la qualité auto oscille entre `res 1` et `res 0.85` ; l'occlusion pèse environ 75 % de l'image (levier `SSAONode`, qui changerait le rendu).
- **Ses retouches du 30/09, faites (`db52e08`) :** ligne des crédits sans « AGENTHOT ‧ » (12 px, l'adresse du dépôt tient sur la 2e ligne) ; titre de la page « AGENTHOT ‧ Le temps est ton arme » ; la même phrase au menu et sur l'image de partage (`og-v1.jpg` refaite, 19:08). Commande : `zsh scripts/build-og.sh ../../assets/images/og-background-game.png public/og-v1.jpg`.
- **Validés par Romain à 19:10 (« 3x oui ! ») :** son nom « Romain Ecarnot (eRom) » dans la fiche JSON-LD, la phrase du Making-of sur les rôles, les trois outils WebMCP.
- Les 4 lignes en plus dans `.gitignore` sont de lui ; non commitées, il n'a pas dit de les commiter.
- **Arrêt en cours : avant la tâche 10** (dernier compte des crédits, revue finale par une autre session, fusion sur son go). Puis ses portes : push, Vercel, DNS, tâche 13b.

## Mise à jour du 2026-09-30 à 18:45
- **Plan 3c en cours d'exécution**, branche `feat/agenthot-plan-3c` (pas fusionnée, rien poussé). Tâches 1 à 8f faites et relues. `bun test` : 354 verts. `bun scripts/check-release.ts dist` : all good.
- **Arrêt en cours : tâche 9, étape 7.** Romain joue et relit (Safari, une partie en `?debug`, le repli WebGL, l'icône, les textes). Serveur : `bun run preview --port 4319 --strictPort`.
- **Deux ajouts de Romain du 30/09, entrés dans le plan :**
  - SEO et GEO « comme linktree » : fiche JSON-LD, `robots.txt`, `sitemap.xml`, `llms.txt`, catalogue pour agents (`ard.json` et `ai-catalog.json`), manifeste, 3 outils WebMCP en lecture seule, script IndexNow à blanc. Tâche 13b après le domaine : jeton d'origin trial WebMCP, Search Console et Bing, envoi IndexNow. Trois gestes de Romain.
  - Dépôt public, « mode making-of » (ses mots, 18:20 : « 2 - mode making-of !!! »). Ce n'est pas le go du push. Section Making-of au README, fichiers locaux ignorés. `gitleaks git` sur 145 commits : 0 fuite.
- **À trancher par Romain à la porte du push :** son adresse Gmail est l'auteur de tous les commits. La garder, ou passer à l'adresse `noreply` de GitHub (réécrit l'historique).
- **Mesure à surveiller (AC-3c-5) :** au menu, dans le Chrome piloté, Mac très chargé (charge 11,7) : `worstWindowP95Ms` 25,3 à 25,7, 62 appels de dessin, la qualité auto oscille entre `res 1` (46 i/s) et `res 0.85` (60 i/s). Le seuil du plan est 20. La mesure qui compte est celle de Romain en jeu. Si elle dépasse 20 : arrêt, sa décision, pas de correctif improvisé (le rendu est figé).
- `.gitignore` porte 6 lignes non commitées qui ne sont pas du plan (`.impeccable/`, `rendu-simule/`, et 4 chemins de `docs/superpowers/idea/`). Elles restent hors des commits.
- Journal d'exécution local : `.superpowers/sdd/2026-09-29-agenthot-plan-3c-perf-share-launch/progress.md` (rulings, mineurs reportés pour la revue finale).
- **Ensuite :** tâche 10 (dernier compte des crédits, revue finale par une autre session, fusion sur son go), puis ses portes : push, Vercel, DNS, tâche 13b.

## Mise à jour du 2026-09-30 à 17:55 (prime sur le reste de la note)
- **Tout le jeu est à jour avec le nouveau rendu, dans `main`.** Rien poussé. `bun test` : 282 verts.
- Cinématique refaite avec des prises du nouveau décor (montage inchangé), validée par Romain dans le jeu et dans Safari, fusionnée (`af9bf26`). `intro.mp4` est en H.264 niveau 4.1 : le point 6 de la revue du 3b est fait, le point 7 (Safari) vu par Romain sur le serveur de dev.
- Vignette de la salle 1 et image de partage refaites avec de vraies captures du jeu, validées par Romain, fusionnées (`66b8d76`). Sources : `assets/images/room-01-game.png`, `og-background-game.png`. Les images générées d'avant restent (le journal des dépenses pointe dessus). Commande de l'image de partage : `zsh scripts/build-og.sh ../../assets/images/og-background-game.png public/og-v1.jpg`.
- **Bug connu, non corrigé :** avec `?record=1`, seule la première prise après un chargement de page est bonne (voir `agenthot-pitfalls.md`). Recharger avant chaque prise.
- Pas refait : la vidéo du menu n'est pas un fichier (le menu rejoue une démo en direct), donc rien à refaire. La vignette de la salle 2 (salle pas construite) reste l'image générée.
- **Prochaine étape : le plan 3c** (mise en ligne). Il a été prouvé sur `cbc015c` : le rejouer d'abord avec `.claude/notes/agenthot-plan-tools/`, car le code a bougé (rendu, tests 279 → 282, seuil de 80 appels de dessin déjà reporté dans le plan). Sauf si Romain a d'autres modifications du jeu avant.

## Mise à jour du 2026-09-30 à 16:16 (prime sur le reste de la note)
- **Nouveau rendu de la salle validé par Romain en jeu** (« nickel, on ne touche plus à rien au niveau rendu »), relu, corrigé et **fusionné dans `main` le 30/09 à 16:55** (`f91c0a9`, avance rapide, sur son go). Rien poussé. `bun test` : 282 verts.
- Ce qu'il contient : dallage au sol, plafond à panneaux à 7,5 m (6 m avant), baies détaillées, étagères garnies sur le mur du fond (solides), bandeaux lumineux, lumière blanche, occlusion ambiante (GTAO sur une passe de profondeur à part), plus de trait d'encre (`POST.outline = false`), ambiance réduite sur la menace pour garder les facettes. Fichiers : `src/render/decor.ts` (nouveau), `world-renderer.ts`, `post.ts`, `materials.ts`, `rooms/`.
- La décision « B » sur `rendu-simule/` (ne pas l'intégrer) est donc levée par Romain le 30/09.
- **Cadence, mesurée par Romain en jeu le 30/09 à 16:20 :** `60 fps`, `res 1`, sur son Mac M1 chargé (Safari qui lit un film, plus de 10 onglets Chrome, Zed). **Sa barre : 30 images/s au minimum sur une telle machine = gagné.**
- **Repli `?renderer=webgl` :** vu le 30/09 à 16:22, la salle s'affiche en WebGL2 avec l'occlusion, console sans erreur. Sa cadence n'est pas mesurée (onglet caché). Appels de dessin : 42 → 67.
- **Revue finale faite** (`docs/superpowers/reports/2026-09-30-agenthot-render-look-final-review.md`) : 0 critique, 0 important. Corrigés le 30/09 : ses défauts 1, 2, 3, 6, 7, 10 et ses décisions D1 (seuil à 80 appels de dessin, spec et plan 3c), D2 (arme hors de la passe d'occlusion), D3 (code du contour supprimé), D4 (spec à jour). Laissés : défauts 4, 8, 9, D5, et le prompt de `scripts/generate-image.ts` (il décrit l'image déjà générée).
- **Reste à faire, dans l'ordre :** refaire les prises `?record` et la cinématique avec le nouveau rendu (Romain : « on s'occupe de la cinématique une fois que je valide le rendu ») ; vérifier que les vignettes et `og-v1.jpg` collent encore ; rejouer le plan 3c avant de l'exécuter.
- Aperçus : `.superpowers/render-spike/` (local, ignoré par git).

## Mise à jour du 2026-09-30 à 15:45 (prime sur le reste de la note)
- **Plan 3c écrit et prouvé, mis de côté par Romain** (« on va le tenir au chaud, j'ai d'autres modifs à faire »). Pas exécuté. `docs/superpowers/plans/2026-09-29-agenthot-plan-3c-perf-share-launch.md`, 14 tâches, 279 → 308 tests au prototype.
- **Avant de l'exécuter un jour :** il a été prouvé sur `main` à `cbc015c`. Si le code a bougé depuis, ses diffs peuvent ne plus s'appliquer : le rejouer d'abord avec `.claude/notes/agenthot-plan-tools/` (prototype local, ignoré par git : `.superpowers/plan-3c-proto/`), et recompter les tokens des crédits.
- Dépôt GitHub renommé `eRom/agenthot-the-game` (privé, vide, `origin` à jour). Rien poussé, rien déployé, aucun DNS.
- À trancher à la porte du push (tâche 11 du 3c) : dépôt public ou privé.
- **Prochaine étape : les modifications de Romain** (à préciser par lui), puis le 3c.

## Mise à jour du 2026-09-30 à 13:30 (prime sur le reste de la note)
- **Plan 3b exécuté, relu et fusionné** dans `main` (`fd71576`, avance rapide, 14:47). Rien poussé. `bun test` : 279 verts. Détail et dépenses : `.claude/notes/agenthot-plan-3-remaining.md` (en-tête du 30/09 13:30).
- Validé par Romain : boucle du menu, intro, images, plan de la cinématique, cinématique finale (après 3 retours : action calée sur 7,33 s, plus aucune image fixe sauf « FIGÉ »).
- Revue finale (Opus xhigh) : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md`, 0 critique, 0 important, 17 mineurs. **Backlog avant la prochaine dépense : ses points 2 à 4** (scripts payants) ; **avant la mise en ligne : points 6 et 7** (MP4 à ré-encoder en `-level 4.1`, lecture dans Safari). La marge du go du 30/09 reste ouverte (choix de Romain, `GO_CAPS`).
- Décisions prises pour Romain pendant l'exécution : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-rulings.md`.
- **Prochaine étape : écrire le plan 3c** (perf, balises de partage sur `public/og-v1.jpg`, crédits, mise en ligne) dans une session neuve.
- Journal d'exécution local : `.superpowers/sdd/2026-09-29-agenthot-plan-3b-assets-cinematic/progress.md`.

## Mise à jour du 2026-09-30 à 08:30 (prime sur le reste de la note)
- **Plan 3a fait et fusionné** dans `main` (`54a6288`, avance rapide). Rien poussé. `bun test` : 233 verts.
- Joué par Romain (tâche 12) : tout validé. Réglages : pontet, son du bris, voile sombre sous `R ‧ RECOMMENCER`. Poing non enregistré au replay : laissé tel quel, choix de Romain.
- Revue finale (Opus xhigh) : `docs/superpowers/reports/2026-09-30-agenthot-plan-3a-final-review.md`. Points 1 à 4 corrigés (M sur AZERTY, Espace sur un bouton focalisé, musique du menu plafonnée à 1,5 s, Échap exclu au chargeur). **Backlog : ses points 5 à 15**, plus le log debug `restart … ms` faux après une relance depuis un panneau.
- Décisions 1 à 3 plus bas : tranchées (plan validé, 60 images/s en auto, son propre pour la cinématique).
- **Prochaine étape : écrire le plan 3b** (point 5 de la liste plus bas), dans une session neuve.

## En une phrase
Le jeu tourne. Les plans 1 et 2 sont fusionnés dans `main`. Le **plan 3a est écrit et prouvé, pas exécuté**. Les plans 3b et 3c restent à écrire. Rien n'est poussé sur GitHub.

## Pour relancer le jeu
```bash
cd /Users/recarnot/dev/claudehot-videogame && bun run dev
```
Puis ouvrir http://localhost:5173/?debug, au casque.
- `?renderer=webgl` force le mode de secours.
- `bun test` : 164 tests verts à la pause.

## Prochaine étape (dans l'ordre)
1. **Relire le plan 3a** : `docs/superpowers/plans/2026-09-29-agenthot-plan-3a-screens.md`, 12 tâches, 164 → 203 tests au prototype. Trancher ses décisions (liste plus bas).
2. **L'exécuter dans une session neuve**, Opus, effort **high**. Lui dire :
   « Exécute `docs/superpowers/plans/2026-09-29-agenthot-plan-3a-screens.md` avec superpowers:subagent-driven-development. Lis d'abord `.claude/notes/2026-09-29-agenthot-reprise.md` et `.claude/notes/agenthot-pitfalls.md`. Branche `feat/agenthot-plan-3a` depuis `main`. Aucune génération payante, aucun push, aucun déploiement sans mon go. Arrête-toi avant la tâche 12 et avant la revue finale. »
3. **Tâche 12 du 3a : tu joues et tu regardes**, puis on règle.
4. **Revue finale**, Opus en effort **xhigh**, sur la version réglée. Puis fusion sur ton « go ».
5. **Écrire le plan 3b** (assets, `?record`, cinématique) dans une session neuve, à partir de `.claude/notes/agenthot-plan-3-remaining.md`. Le prototype déjà fait est dans `.claude/notes/agenthot-plan-3b-wip.patch`.
6. **Plan 3c** : perf, image de partage, crédits, mise en ligne. La mise en ligne n'a lieu que sur ton « go » explicite.

## Décisions qui t'attendent
1. **Valider le plan 3a** et son exécution. Je recommande sous-agents, comme les plans 1 et 2.
2. **Qualité « auto » limitée à 60 images/s**, contre la chauffe du Mac ; « haute » sans limite. Recommandé : garder.
3. **La cinématique garde son propre son**, en dehors du reste de l'audio du jeu. Recommandé : garder.
4. **Nom du dépôt GitHub : `eRom/agenthot-the-game`** (tranché par Romain le 30/09 à 14:52). Sert aux crédits et au partage (plan 3c).
5. **Domaine : `agenthot.erom.cloud`** (tranché par Romain le 30/09 à 14:53 ; sous-domaine de `erom.cloud`, domaine neuf pris chez Hostinger, jamais utilisé ; la racine reste libre). Plan 3c.
6. **Liste des générations payantes du 3b** : environ 0,38 $ prévus (Lyria 0,16 + Nano Banana 0,13 + Seedream 0,09), 1,10 $ au maximum avec les nouveaux essais. Le détail est dans `.claude/notes/agenthot-plan-3-remaining.md`. Rien ne part sans ton « go » écrit.

## Où tout se trouve
| Quoi | Où |
| :--- | :--- |
| Spec (autorité) | `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md` |
| Tes mots et tes verdicts | `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md` |
| Plans 1, 2 (faits) et 3a (à exécuter) | `docs/superpowers/plans/` |
| Ce qui reste du plan 3 (3b, 3c) | `.claude/notes/agenthot-plan-3-remaining.md` |
| Prototype du 3b déjà fait | `.claude/notes/agenthot-plan-3b-wip.patch` (s'applique après le 3a) |
| Décisions prises à ta place | `docs/superpowers/reports/2026-09-29-agenthot-plan-{1,2}-rulings.md` |
| Brief de recherche du plan 3 | `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md` |
| Pièges vérifiés | `.claude/notes/agenthot-pitfalls.md` |
| Outils « prototype puis plan » | `.claude/notes/agenthot-plan-tools/` |
| Journaux et prototypes détaillés (locaux, ignorés par git) | `.superpowers/sdd/…/progress.md`, `.superpowers/plan-3-proto/` (bundle complet du prototype 3a et 3b), `.superpowers/handoff/` |

## Sessions Claude du chantier (toutes terminées, fermables)
- **claude-neptune-5pxz** : pilote de la journée. Contexte presque plein, **ne pas la reprendre**.
- **claude-apollon-p0jv** : a écrit le plan 2.
- **claude-fortuna-pn4h** : a écrit le brief du plan 3 et exécuté le plan 2.
- **claudehot-videogame-ceres** (tmux `rc-claudehot-videogame-ceres`) : a écrit le plan 3a. Arrêtée proprement à 70 % de contexte.

Tout leur travail est dans le dépôt, ou dans `.superpowers/` pour les éléments locaux listés plus haut.

## Décisions déjà prises (ne pas les rouvrir)
- **Identité :** AGENTHOT, couleur `#D97757` réservée à la menace, design system propre au jeu « Monolithe + Encre », **pas** d'erom-design.
- **Parcours :** chargement → cinématique (1re visite) → menu → salle. 2 salles au maximum ; la salle 2 aura katana et fusil à pompe.
- **Diffusion :** hébergeur Vercel ; image de partage = fond Seedream + logo posé avec nos polices ; crédits = tokens + coût API estimé.
- **Son :** musique de jeu discrète ; « AGENT... HOT... » seulement au replay.
- **Éclats :** plafonnés à 5 m/s, ils rebondissent sur le décor.
- **Menace :** sans contour noir, détourée par son halo.

## Argent
| Outil | Dépensé | Budget |
| :--- | :--- | :--- |
| Lyria | 0,16 $ (2 morceaux) | 3,00 $ |
| Seedream | 0 $ | 3,00 $ |
| Nano Banana | 0 $ | 2,50 $ |

Toute génération payante exige ton « go » écrit, pour une liste précise. Le journal est `assets/ledger.jsonl`.

## Ce qu'il ne faut pas faire
- Reprendre la session neptune : son contexte est presque plein.
- Lancer une génération payante (`--pay`), pousser sur GitHub ou déployer sans ton go.
- Faire `git add -A`. Ces fichiers restent hors des commits tant que tu n'as pas décidé :
  - `docs/superpowers/idea/ideation.md`, `Lyria-prompt-guide.md`, `Seedream-5.0-Pro.md` ;
  - la planche Gemini et `screenshots/` ;
  - la modification de `OVERVIEW.md` ;
  - `.impeccable/`, `.ignore` ;
  - `rendu-simule/` : ton exploration visuelle du 29/09 à 18:50 (décor détaillé, néons, SSAO, arme réaliste). Décision (« B ») : on n'en fait rien pour l'instant, elle n'est pas intégrée aux plans.
