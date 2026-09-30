# Pièges vérifiés pendant les plans 1 et 2 (à lire avant d'écrire le plan 3)

Relevés par apollon (écriture du plan 2), fortuna (exécution du plan 2) et neptune (plan 1), le 2026-09-29.

## Navigateur et vérification

- **MCP Chrome DevTools :** un seul profil Chrome pour toutes les sessions (`~/.cache/chrome-devtools-mcp/chrome-profile`). S'il est déjà tenu, l'erreur est « browser already running ». Repli : l'extension claude-in-chrome.
- **Pas besoin du pointer lock pour vérifier :** `window.agenthot.advance()` (sonde debug du plan 2) fait avancer le jeu sans verrouiller la souris. Le verrouillage par clic ne marche que si la fenêtre pilotée est au premier plan.
- **Attendre 1,5 à 2 s après `navigate`** avant de sonder.
- **La bordure orange des captures** vient de l'overlay de l'extension, pas du jeu.
- **Onglet caché :** la boucle rAF s'arrête, `renderer.info` reste figé (il n'est remis à zéro que dans la boucle) et `setTimeout` traîne. Mesurer fenêtre au premier plan. Tester l'audio en `OfflineAudioContext`.
- **Vite :**
  - Un asset absent renvoie 200 `text/html` (repli SPA). Un `fetch` qui teste `response.ok` ne voit donc pas l'absence : vérifier le type de contenu.
  - Au premier `bun run dev`, ou quand les dépendances sont ré-optimisées, la page se recharge et affiche une fois « Multiple instances of Three.js ». C'est passager.
- **`bun test | tee` masque le code de sortie.** Lire la ligne pass/fail du log, ou utiliser `${pipestatus[1]}` en zsh.

## Three.js r186 (TSL, post-traitement)

- **`PCFSoftShadowMap` n'existe plus.** Utiliser `PCFShadowMap` avec `shadow.radius`.
- **MSAA :** il moyenne les masques MRT sur un trait d'un pixel, et un matériau transparent dilue aussi le masque. Garder un seuil bas et une menace opaque.
- **`flatShading` :** les normales calculées par dérivées font des points parasites dans le détecteur de contours. Normaliser les normales et rejeter celles qui sont presque nulles.
- **WebGL2 en Retina :** trop de pixels (MSAA ×4 sur 3 sorties en demi-flottant). Le pixel ratio est déjà plafonné à 1,5 en WebGL2. La qualité auto (spec 9.2) reste à faire.
- **Chaleur :** à 120 i/s en Retina avec le post-traitement, le Mac de Romain chauffe. Prévoir une limite d'images par seconde.

## Audio et Lyria

- **`AudioContext`** reste suspendu jusqu'au premier geste. `engine.master` est exposé pour le futur `?record=1`.
- **Réponse Lyria mesurée :** 27 à 30 s, pas « plusieurs minutes ».
  - Forme : `steps[].content[]`, `type "audio"`, `mime_type "audio/mpeg"`.
  - Format : MP3 44,1 kHz stéréo, 192 kb/s.
  - Réponses brutes complètes : `.superpowers/lyria-{game,replay}-raw.json` (non suivis, 3 Mo chacun, paroles entières).
- **Les morceaux Lyria portent du silence en tête et en fin.** La table `offset`/`loopStart`/`loopEnd` de `src/audio/music.ts` est mesurée avec ffmpeg `silencedetect`. Toute nouvelle piste (boucle du menu) doit être mesurée de la même façon.
- **Script de génération :**
  - un appel réel exige `--pay` ;
  - l'écrasement d'une piste exige `--overwrite` ;
  - le journal `assets/ledger.jsonl` est écrit avant tout fichier.
  - Une régénération avec `--overwrite` garde les anciens offsets sans prévenir : il faut re-mesurer.

## Plan 3b (2026-09-30)

- **Lyria ne tient ni le tempo ni la durée demandés.** `game.mp3` demandé à 120 BPM, mesuré à 130 ; `menu.mp3` demandé à 120, mesuré à 128 ; `intro` demandée à 28 s, livrée à 122 s. Toujours mesurer : `bun scripts/measure-loop.ts <mp3> <audiomap.json>` (audiomap par `uv run --with librosa --with numpy --with soundfile python3 <plugin hyperframes>/skills/music-to-video/scripts/analyze-beatgrid.py`).
- **Le WebM de MediaRecorder n'a pas de durée** (`ffprobe` : `duration=N/A`). Convertir chaque prise en MP4 60 i/s avant tout montage.
- **`canvas.captureStream` marche sur le rendu WebGPU** (Chrome, 1920 × 1080, image non noire). Pas besoin de `?renderer=webgl` pour filmer.
- **`?record` et le viseur :** l'image enregistrée en 16:9 doit être centrée dans la fenêtre, sinon le point du HUD (centre de la fenêtre) n'est plus sur l'axe des balles (centre de l'image). Bug vu par Romain le 2026-09-30, corrigé par `captureDisplayRect` (commit 87d2ba4).
- **Une prise où l'onglet a été caché est figée** (`ffmpeg -vf freezedetect=n=0.001:d=0.3`). Contrôler chaque prise et chaque rendu de cinématique avec cette commande : Romain rejette toute image fixe qui « tue le dynamisme ».
- **`?record=1` : seule la première prise après le chargement de la page est bonne.** Une deuxième victoire sans recharger donne un fichier figé sur une image (son intact, durée juste). Vu le 2026-09-30 à 11:49 (prise 114922) puis à 17:01 et 17:02 (prises 170143 et 170250, figées de 0,27 s à la fin) ; avec Cmd+R avant chaque partie, 5 prises sur 5 sont bonnes (17:23 à 17:28). Cause non trouvée (`src/app/capture.ts` : un nouveau `captureStream` à chaque prise, les pistes de l'ancien jamais arrêtées, hypothèse non testée). Contrôle : `ffmpeg -vf freezedetect=n=0.001:d=0.3` sur chaque prise.
- **AV1 1080p30 = niveau 4.0** (`av01.0.08M.08`, déclaré par `src/ui/media.ts`) ; à 60 i/s ce serait 4.1.
- **Tailles réelles :** Seedream 2K en 2:1 = 2048 × 1024, facturé 0,045 $ (`usage.cost`, pas 0,09 $) ; Nano Banana 2 en 1K 16:9 = 1376 × 768, et le MCP écrit du JPEG (`.jpg`), pas du PNG.
- **Hyperframes en plugin :** toujours `node <plugin>/skills/hyperframes/scripts/plugin-cli.mjs <commande>` et `--script <chemin>` pour les scripts `.mjs` ; `init` écrit aussi `AGENTS.md`, `CLAUDE.md`, `package.json` dans le projet.

## Plan 3c (2026-09-30)

- **Une clé publique est masquée à l'affichage comme un secret.** La clé IndexNow (`agenthot-…`, 33 caractères) s'affiche `[REDACTED…]` dans Read et Bash, chez le contrôleur comme chez les sous-agents. Ne jamais la taper : la lire par code (`import { INDEXNOW_KEY } from "./scripts/discovery"`), la compter par `grep -c -F`. Vu le 2026-09-30 à l'exécution des tâches 8b et 8c. Contrôle : `bun scripts/check-release.ts dist` (ligne `IndexNow key file`).
- **Chrome sans écran ne descend pas sous 500 px de large.** Une page dimensionnée en `100vw` capturée avec `--window-size=192,192` sort coupée (le losange collé au bord droit). Donner une taille fixe en pixels à l'élément (`scripts/og/icon.html?size=192`). Vu le 2026-09-30 sur le prototype des icônes.
- **`vite preview` ne sert pas les en-têtes de `vercel.json`.** Contre lui, `check-release.ts http://localhost:4319/` échoue sur 17 lignes attendues : cache long des 12 fichiers de `/assets/`, `missing file answers 404`, et les types de contenu de `llms.txt`, `llms-full.txt`, `ai-catalog.json` (plus `both agent catalogs are identical`, par ricochet). Tout autre `FAIL` est un défaut. Mesuré le 2026-09-30 : `.superpowers/plan-3c-preview-check.log`.
- **Le contrôle en mode adresse ne voit pas `engine-….js`.** Le point d'entrée le cite en chemin relatif (`./engine-….js`), que `assetPaths` ne relève pas. Son en-tête de cache n'est donc pas contrôlé (même dossier `/assets/`, même règle). [candidat 1x - lu dans `.superpowers/plan-3c-preview-check.log`, 2026-09-30]
- **`git mv` ne laisse pas de dossier à ajouter.** `git add public/audio` échoue (pathspec) une fois le dossier vidé : les renommages sont déjà dans l'index. Vu à la tâche 2.
- **Un fichier de plan peut porter un `git apply` de trop.** Un sous-agent a lancé `git apply` sur tout le brief : git a appliqué tous les blocs diff d'un coup. Enregistrer chaque diff dans son fichier avant de l'appliquer. Vu à la tâche 6.
- **La sonde d'images se lit en qualité auto.** `FRAME_STATS.window` compte des images, pas des secondes : à 120 Hz sans plafond, la « fenêtre de 2 s » fait 1 s. Appeler `window.agenthot.resetFrameStats()` avant toute lecture au menu (la première image après le chargement porte plusieurs secondes).
- **Changer de branche est refusé quand `.gitignore` porte des lignes non commitées** et diffère d'une branche à l'autre (« would be overwritten by checkout »). Pour fusionner en avance rapide sans toucher aux lignes de Romain : `git fetch . feat/<branche>:main`, puis `git checkout main` (même arbre : les lignes non commitées restent). Vu à la fusion du 3c, 2026-09-30.
- **Chez Vercel, une règle `headers` de `vercel.json` surcharge bien le `Content-Type` d'un fichier statique**, `.well-known/` compris (non documenté, constaté sur le déploiement du 2026-09-30). Contrôle : `bun scripts/check-release.ts https://agenthot-the-game.vercel.app/` (lignes `… served`).
- **`vercel link` écrit un `.env.local`** (jeton OIDC) sans prévenir. `.env*` est ignoré depuis `5c170f4` : sans cette ligne, il serait parti au prochain `git add` large. Vu le 2026-09-30.
- **Hostinger : la valeur d'un CNAME peut partir collée deux fois**, et le panneau l'affiche juste une fois corrigée alors que le second serveur (`nebula.dns-parking.com`) sert encore l'ancienne une à deux minutes. Toujours lire les deux serveurs de la zone (`dig +short CNAME <nom> @aurora.dns-parking.com`, puis `@nebula…`) avant un résolveur public. `vercel domains verify` a suivi dans la minute. Vu le 2026-09-30 à 20:07.
