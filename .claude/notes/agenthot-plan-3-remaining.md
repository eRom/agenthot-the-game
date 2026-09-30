# Passation : ce qui reste du plan 3 (3b et 3c)

## Mise à jour du 2026-09-30 à 14:47 : 3b fait, relu et fusionné dans main (fd71576)
- Plan : `docs/superpowers/plans/2026-09-29-agenthot-plan-3b-assets-cinematic.md`. 12 tâches ; la 10 (fondu de la boucle) sans objet, Romain n'entend pas la jointure.
- Fait : `?record` (centré sur le viseur), scripts Seedream et image de partage, outil `bun scripts/spend.ts` (plafonds du go dans `GO_CAPS`), pistes Lyria menu et intro, boucle du menu coupée sur 33 mesures (128 BPM mesurés), vignettes des salles, `public/og-v1.jpg`, cinématique Hyperframes (`videos/agenthot-intro/`, 26,3 s, `public/video/intro.webm` 4,8 Mo AV1 et `intro.mp4` 5,6 Mo H.264), bourdon éteint avant le moteur.
- Dépenses du 3b : Lyria 0,16 $, Nano Banana 0,134 $, Seedream 0,045 $ (0,34 $ sur 1,10 $ autorisés). Totaux du journal : Lyria 0,32 $, Nano Banana 0,134 $, Seedream 0,045 $.
- Revue finale : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md` ; ses points 2 à 4 avant toute nouvelle dépense, 6 et 7 au 3c.
- Le 3c est inchangé (section plus bas) ; il pose les balises Open Graph sur `public/og-v1.jpg`.

De : la session qui a écrit le plan 3a, 2026-09-29 19:40. Arrêt propre à la demande de neptune (fenêtre de contexte).

## Fait
- **Plan 3a écrit et prouvé** : `docs/superpowers/plans/2026-09-29-agenthot-plan-3a-screens.md` (12 tâches, 5 539 lignes). Non commité (neptune commite).
  - Rejeu tâche par tâche dans un dossier vide : tests rouges avant le code, verts après, `tsc` à chaque étape, arbre identique au prototype (164 → 203 tests). Log : `.superpowers/plan-3-proto/staged-check-3a.log`.
  - Rejeu du plan « à la lettre » depuis `9a85275` : arbre identique au prototype (hors `public/fonts/`, produites par le script de la tâche 6).
- **Découpage** : 3a finitions + écrans (zéro dépense) ; 3b assets + `?record` + cinématique ; 3c perf + partage + crédits + mise en ligne. Les noms de fichiers 3b et 3c sont déjà cités dans l'en-tête du 3a : `2026-09-29-agenthot-plan-3b-assets-cinematic.md`, `2026-09-29-agenthot-plan-3c-perf-share-launch.md`.

## Copie de sûreté (ajoutée par neptune, 19:45)
- Le commit `055cd66` (3b en cours) est aussi exporté en patch texte, suivi par git : `.claude/notes/agenthot-plan-3b-wip.patch`. Il s'applique **après l'exécution du plan 3a**, sur l'équivalent de `b218e31` (tâche 11 du 3a) : `git apply .claude/notes/agenthot-plan-3b-wip.patch`. Le bundle complet reste dans `.superpowers/plan-3-proto/proto.bundle` (local, ignoré par git).
- Les outils de plan sont aussi dans `.claude/notes/agenthot-plan-tools/`.

## Où sont les prototypes et les outils
Tout est dans `.superpowers/plan-3-proto/` (ignoré par git) :
- `proto.bundle` : le dépôt prototype complet. `git clone .superpowers/plan-3-proto/proto.bundle <dossier>` puis lier `node_modules`. Commits 3a : `commits.txt` (T1 `c8a2c8a` … T11 `b218e31`). Commit `055cd66` = 3b en cours (voir plus bas).
- `gen-plan.py` (gabarit → plan avec les vrais fichiers et diffs), `replay-plan.py` (rejoue un plan à la lettre), `staged-check.sh` (rejeu par tâche). Chemins en dur vers mon scratchpad : adapter `S`.
- `plan-3a-template.md` : le gabarit du 3a (modèle de forme pour 3b et 3c).
- `progress.md` : mes notes de travail.

## 3b : fait en prototype (commit `055cd66`, non inséré dans un plan)
- `src/app/capture.ts` + `tests/capture.test.ts` (3 tests verts) + branchement dans `engine.ts` et `main.ts` : `?record=1` filme le replay de victoire, `?record=menu` une boucle du fond du menu ; canvas 1920 × 1080, pas de temps fixe 1/60 s, audio pris sur `engine.master` par `MediaStreamAudioDestinationNode`, fichier `.webm` téléchargé.
  - **Pas vérifié dans Chrome** : l'onglet piloté était caché. `canvas.captureStream` sur le rendu WebGPU reste **à sonder à l'exécution** (gratuit) ; repli : `?renderer=webgl&record=1` (brief section 4).
- `scripts/seedream.ts` : appel OpenRouter, mêmes garde-fous que Lyria (budget, `--overwrite`, clé, budget relu, journal avant tout fichier, réponse brute gardée), coût réel lu dans `usage.cost`. **Sans tests ni CLI** (`scripts/generate-image.ts` à écrire, sur le modèle de `generate-music.ts`).
- `scripts/og/og.html` + `scripts/build-og.sh` : image de partage 1200 × 630 (fond en `cover`, logo et textes avec nos polices), capturée par Chrome sans écran, JPEG sous 300 Ko. **Testé** : 268 Ko sur un fond bruité (pire cas), polices justes.

## 3b : mesures gratuites faites
- **Encodage de la cinématique** : l'AV1 en CRF 38 ne tient pas le poids (20,5 Mo pour 25 s de contenu bruité, 6 min d'encodage). Tenir le poids par un **débit cible** : `ffmpeg -i master.mp4 -c:v libsvtav1 -preset 6 -b:v 1500k -g 240 -pix_fmt yuv420p -c:a libopus -b:a 96k intro.webm` (8 s → 0,8 Mo, preset 7 en 22 s). Repli H.264 deux passes à 1 700 k : 5,1 Mo pour 25 s (`-passlogfile` obligatoire).
- **Vignettes** : ffmpeg n'a pas d'encodeur WebP ; `cwebp` est installé (`/opt/homebrew/bin/cwebp -q 82 -resize 640 0 in.png -o public/rooms/room-01.webp`). Le 3a attend `/rooms/room-01.webp` et `/rooms/room-02.webp`.
- **Hyperframes** : skill `hyperframes:hyperframes` lue. Route retenue : **`music-to-video`** (le morceau d'intro mène le montage, séquences du jeu coupées sur le temps, typographie cinétique). Installation plugin : `node "<PLUGIN_ROOT>/skills/hyperframes/scripts/plugin-cli.mjs" <commande>` (Node requis par l'outil) ; ne pas lancer `hyperframes skills update`. Première commande de la tâche : `doctor`.

## 3b : reste à faire
1. Tests de `seedream.ts` (faux client, comme `tests/lyria.test.ts`) et CLI `scripts/generate-image.ts` (images nommées : `og-background` 2:1 2K ; cartes de la cinématique 16:9 1K si le brief Hyperframes les demande).
2. Outil de journal pour Nano Banana (MCP, sans coût renvoyé) : `--check` avant l'appel (budget 2,50 $), ligne ajoutée juste après, coût de la grille (0,067 $ en 1K) ; plus un résumé par outil pour AC-17.
3. Deux pistes Lyria dans `generate-music.ts` : `menu` (boucle tech et punchy, 120 BPM, ré mineur comme la piste du jeu, fin qui retombe sur le début) et `intro` (environ 28 s, montée, gel, drop, impact final). Puis mesurer la boucle du menu (`silencedetect`, table `PLAYBACK.menu` + test, comme `music-loop.test.ts`) ; fondu enchaîné seulement si Romain entend la jointure.
4. **Porte Romain « dépenses »** : une liste exacte de générations avec coûts, validée par un « go » écrit. Proposition : Lyria menu + intro (0,16 $, un essai de plus chacun au plus : 0,32 $ max) ; Nano Banana 2 en 1K, 2 vignettes (0,13 $, 0,40 $ max) ; Seedream 2K, fond de partage (0,09 $, 0,36 $ max). Maximum total ≈ 1,10 $ (budgets restants : Lyria 2,84 $, Nano Banana 2,50 $, Seedream 3,00 $).
5. **Porte Romain « prises »** : Romain joue et gagne avec `?record=1` (2 ou 3 prises) + `?record=menu` ; fichiers hors dépôt.
6. Cinématique : brief Hyperframes (route `music-to-video`, 16:9 1920 × 1080, 20 à 30 s), rendu master, encodage ci-dessus, `public/video/intro.webm` + `intro.mp4` ≤ 6 Mo ; le code 3a les lit déjà.
7. Porte Romain : il regarde la cinématique et écoute la boucle du menu.

## 3c : rien de commencé
- Noms hachés pour le cache long (musiques, vidéo, polices servis par Vite, ou noms versionnés) + `vercel.json` (`buildCommand`, `outputDirectory`, en-têtes du brief section 5).
- Balises Open Graph et Twitter dans `index.html` (brief section 7) ; URL absolue : Vite remplace `%VITE_SITE_URL%` dans `index.html` (à vérifier au build).
- `scripts/count-tokens.sh` (texte complet en annexe du brief) → valeurs finales de `CREDITS` (`src/ui/credits.ts`) et le vrai nom du dépôt.
- Recette : AC-8 (trace au pire moment), AC-9 (victoire en WebGL2), AC-10 (réseau à 50 Mb/s, poids < 3 Mo), AC-12 (émulation iPhone et iPad), AC-17 (somme du journal), réponse `206` aux requêtes Range sur la vidéo après un premier déploiement.
- Porte Romain : création du dépôt GitHub, push, déploiement Vercel.
- Constat 3a utile pour la perf : point d'entrée 12,5 Ko gzip, moteur 275 Ko gzip, CSS 3,4 Ko, polices 66 Ko.

## Décisions qui reviennent à Romain
1. **Relire et valider le plan 3a**, puis choisir son exécution (recommandation : subagent-driven, 12 tâches aux interfaces liées).
2. **Qualité « auto » limitée à 60 images par seconde** (ventilateur), « haute » sans limite. Recommandation : garder.
3. **La cinématique garde son propre son** (volume musique), hors du graphe Web Audio. Recommandation : garder.
4. **Nom du dépôt GitHub : `eRom/agenthot-the-game`** (tranché par Romain le 30/09). Nécessaire au 3c (crédits, balises de partage).
5. **Domaine : `agenthot.erom.cloud`** (tranché par Romain le 30/09 ; sous-domaine de `erom.cloud`, chez Hostinger, jamais utilisé ; la racine reste libre). Nécessaire au 3c (URL absolue de l'image de partage).
