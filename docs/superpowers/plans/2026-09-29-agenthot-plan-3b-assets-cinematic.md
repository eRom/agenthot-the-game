# AGENTHOT, plan 3b : assets générés, enregistrement `?record`, cinématique

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** fabriquer ce qui manque au parcours pour qu'il « claque » : la boucle musicale du menu, les vignettes des deux salles, l'image de partage, l'enregistrement des séquences du jeu par le jeu lui-même (`?record`), et la cinématique Hyperframes de 20 à 30 s, jouée à la première visite.

**Architecture :**
- Le code gratuit d'abord (tâches 1 à 5) : enregistrement du canvas, scripts de génération (Seedream, Lyria, journal des dépenses), outil de mesure de boucle. Tout ce qui se calcule sans navigateur est pur et testé avec `bun test` ; les appels payants passent par des faux clients dans les tests.
- Les générations payantes ensuite (tâches 6 et 8), faites par le contrôleur lui-même, chacune précédée d'un contrôle du plafond du « go » de Romain (`bun scripts/spend.ts check`) et suivie de sa ligne dans `assets/ledger.jsonl`.
- Les portes de Romain (tâches 9, 11, 12) : son écoute de la boucle du menu, ses prises `?record`, sa relecture de la cinématique.
- La cinématique (tâche 11) est un projet Hyperframes dans `videos/agenthot-intro/` (route `music-to-video` : le morceau d'intro mène le montage). Rendu master local, puis ré-encodage ffmpeg en `public/video/intro.webm` (AV1) et `intro.mp4` (H.264), que le code du plan 3a lit déjà.

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4, Three.js r186, Web Audio API, MediaRecorder + `canvas.captureStream`, Lyria 3.5 (API Gemini), Seedream 5.0 Pro (OpenRouter), Nano Banana 2 (MCP erom-image), Hyperframes 0.8.81 (plugin, Node), ffmpeg 9.0.2 (`libsvtav1`, `libx264`, `libopus`), `cwebp`, Chrome sans écran.

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, étape 7 de la section 11 : sections 4.2 (cinématique), 4.3 (boucle du menu, vignettes), 4.7 (fond de l'image de partage), 7.2 (boucle du menu), 8 (assets et budgets) ; AC-11, AC-12 (cinématique sur l'écran mobile), AC-17. Intent : `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md`. Entrées obligatoires : `.claude/notes/agenthot-plan-3-remaining.md` (section 3b), `.claude/notes/agenthot-pitfalls.md`, brief `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md` (sections 1 à 4).

**Place de ce plan :** plan 3b sur 3.
- **3a** (fait, fusionné dans `main` à `54a6288`) : finitions du jeu et écrans.
- **3b (ce plan)** : assets générés, `?record`, cinématique.
- **3c** : performance, balises Open Graph (l'image `public/og-v1.jpg` est faite ici, les balises là-bas), crédits définitifs, mise en ligne ; `docs/superpowers/plans/2026-09-29-agenthot-plan-3c-perf-share-launch.md`.

## Global Constraints

- **Dépenses : le « go » de Romain, mot pour mot.** Relayé par la session pilote, dit à 08:37 le 2026-09-30 : « go pour les générations payantes ». Il couvre cette liste et rien d'autre :

  | Outil | Quoi | Prévu | Maximum | Plafond du journal (total de l'outil) |
  | :--- | :--- | :--- | :--- | :--- |
  | Lyria 3.5 | `menu` et `intro`, un essai de plus par piste au plus | 0,16 $ | 0,32 $ | 0,48 $ (0,16 $ déjà dépensés au plan 2) |
  | Nano Banana 2, 1K | vignettes `room-01` et `room-02` | 0,13 $ | 0,40 $ | 0,40 $ |
  | Seedream 5.0 Pro, 2K | fond de l'image de partage `og-background` | 0,09 $ | 0,36 $ | 0,36 $ |

  Plafond total : 1,10 $. **Avant chaque appel payant**, `bun scripts/spend.ts check <outil> <coût> <plafond>` doit sortir en code 0 ; code 2 = arrêt, on demande un nouveau go à Romain. Toute génération hors de cette liste (par exemple des cartes Seedream pour la cinématique) demande un nouveau go.
- **Qui exécute :** les tâches 6, 8, 9, 11 et 12 sont faites par le contrôleur, jamais par un sous-agent : dépenses, MCP Nano Banana, portes de Romain, orchestration Hyperframes. Les tâches 1 à 5, 7 et 10 se délèguent.
- **Langue :** identifiants, clés, noms de fichiers, messages de log en anglais ; commentaires en français. Textes vus par le joueur en français. Descriptions de test en français (Romain les lit). Aucun tiret cadratin dans un texte vu par un tiers (cartes de la cinématique, image de partage).
- **Outillage :** `bun` pour le projet. Exceptions nommées : Hyperframes exige Node (`node "<plugin>/skills/hyperframes/scripts/plugin-cli.mjs"`, jamais `npx`) ; l'analyseur de tempo est en Python, lancé par `uv run --with librosa --with numpy --with soundfile` (jamais `pip`) ; `ffmpeg`, `ffprobe`, `cwebp` et Chrome sont déjà sur le Mac. Aucune nouvelle dépendance npm.
- **Hyperframes est un plugin :** ne jamais lancer `hyperframes skills update`, `skills check` ni `npx skills add` (règles `plugin-installation.md` du plugin) ; le dossier du plugin reste en lecture seule.
- **Zéro allocation dans la boucle de jeu et de rendu** (spec 9.1). L'enregistrement `?record` n'alloue qu'au démarrage et à l'arrêt d'une prise.
- **Palette** (spec 6.1) : dans toute image générée, l'orange `#D97757` ne va qu'à la menace (ennemis, balles, traînées). Dans la cinématique, l'orange marque aussi « HOT » du logo, comme dans l'interface.
- **Git :** branche `feat/agenthot-plan-3b` depuis `main`. `git add` de fichiers nommés seulement, jamais `git add -A` ni `git add .`. Fichiers de Romain à laisser hors des commits : `docs/superpowers/idea/*` (dont `ideation.md`, `Lyria-prompt-guide.md`, `Seedream-5.0-Pro.md`, la planche Gemini, `screenshots/`), la modification de `docs/superpowers/idea/OVERVIEW.md`, `.impeccable/`, `.ignore`, `rendu-simule/`. Aucun push, aucun déploiement.
- **Commandes Bash :** chaque commande qui écrit commence par `cd /Users/recarnot/dev/claudehot-videogame &&`. Sortie brute des tests : préfixe `RTK_DISABLED=1`. Toute sortie de test citée dans un rapport vient d'une commande passée par `tee` vers un fichier nommé dans le rapport ; `bun test | tee` masque le code de sortie : lire la ligne `pass`/`fail` du fichier.
- **Clés :** `GEMINI_API_KEY` (Lyria, Nano Banana) et `OPENROUTER_API_KEY` (Seedream) sont dans le zsh de Romain. Vérifier leur présence par `test -n "$GEMINI_API_KEY" && echo présente`, jamais par `echo "$VAR"`.
- **Chrome :** MCP Chrome DevTools (profil unique ; s'il est pris, l'extension claude-in-chrome). La boucle d'animation s'arrête quand l'onglet est caché : toute prise et toute mesure se font fenêtre au premier plan.
- **Vite :** un fichier absent de `public/` renvoie `200 text/html`, en développement comme en `vite preview` (constaté à la tâche 12 du 3a). Vérifier la présence d'un asset par son type de contenu ou par `ls`, jamais par le code HTTP.

## Review Focus

Cinq cas que Romain ou un visiteur rencontreront et qu'aucun test de tâche ne couvre seul. Chacun a sa vérification dans la tâche propriétaire.

1. **Un appel payant répond 2xx sans fichier exploitable** (Seedream sans image, Lyria sans audio, MCP Nano Banana en erreur après facturation). La dépense reste au journal, la réponse brute est gardée, et on ne repaie pas pour « réessayer » avant d'avoir lu la réponse brute. Vérification : tâche 2 (tests `no-image`, `ledger-failed`) ; tâches 6 et 8 (règle écrite dans chaque étape d'appel).
2. **Une dépense au-delà du go** (5e appel Lyria, 6e image Nano Banana, 5e Seedream). Le contrôle refuse avant l'appel. Vérification : tâche 3 (tests des plafonds 0,48 $ et 0,40 $) ; tâches 6 et 8 (`spend.ts check` avant chaque `--pay` ou appel MCP).
3. **Une prise `?record` gâchée** : onglet caché pendant le replay (image figée, son coupé), fenêtre qui n'est pas en 16:9. L'image reste en 16:9 sans déformation ; une prise figée est repérée et écartée, pas montée. Vérification : tâche 1 (test `captureDisplaySize`) ; tâche 9, étape 4 (`freezedetect` et durée de chaque prise comparée au replay).
4. **Safari sur un Mac sans décodeur AV1 matériel** (M1, M2). Il doit passer au MP4 H.264 sans erreur ; Chrome et Firefox lisent l'AV1. La vidéo doit correspondre au type déclaré `av01.0.08M.08` (niveau 4.0), donc 30 images par seconde. Vérification : tâche 11, étape 10 (`ffprobe` : `level=8`, `r_frame_rate=30/1`) ; tâche 12, étape 3 (`canPlayType` et lecture du MP4 seul).
5. **Téléphone** : l'écran « Joue sur ordi » lit la cinématique en boucle, muette, sans initialiser le moteur (AC-12). Vérification : tâche 12, étape 4 (émulation iPhone, console sans erreur).

## Critères d'acceptation du plan 3b

**AC-3b-1 : la boucle du menu ne se remarque pas**
- **Comportement :** quand le menu reste ouvert plus de deux tours de sa musique, alors la reprise tombe sur le temps et Romain ne l'entend pas.
- **Vérifié par :** `bun test tests/music-loop.test.ts` (boucle d'un nombre entier de mesures, dans la musique du fichier) ; écoute de Romain au casque, tâche 9 (et tâche 10 s'il entend la jointure).

**AC-3b-2 : vignettes des salles**
- **Comportement :** quand on ouvre « Salles », alors chaque carte montre sa vignette (salle 1 jouable, salle 2 « Bientôt ») ; l'orange n'y marque que la menace.
- **Vérifié par :** `ls -la public/rooms/` (2 fichiers WebP) ; capture du panneau Salles (MCP Chrome DevTools, `take_screenshot`) relue par Romain, tâche 9.

**AC-3b-3 : image de partage**
- **Comportement :** quand on ouvre `public/og-v1.jpg`, alors on voit le fond Seedream, le logo AGENTHOT et les deux lignes de texte, nets, en 1200 × 630.
- **Vérifié par :** sortie de `zsh scripts/build-og.sh` (dimensions `1200,630` et poids < 300 000 octets) ; relecture de Romain, tâche 9.

**AC-3b-4 : le jeu filme ses séquences**
- **Comportement :** quand Romain gagne avec `?record=1`, alors un fichier 1920 × 1080 est téléchargé à la fin du replay, d'une durée égale au replay à 5 % près ; `?record=menu` donne une boucle entière du fond du menu.
- **Vérifié par :** `ffprobe` sur chaque prise convertie (tâche 9, étape 4), comparé à la ligne console `[agenthot] replay sim … s vs duration … s`.

**AC-3b-5 : la cinématique**
- **Comportement :** à la première visite, une cinématique de 20 à 30 s en 1920 × 1080 joue après « APPUIE SUR UNE TOUCHE », se passe par une touche, puis ne revient que par le bouton Intro (spec AC-11).
- **Vérifié par :** `ffprobe` de `public/video/intro.webm` et `intro.mp4` (durée, taille, 30 i/s, `av1` niveau 8 et `h264`) et `ls -la` (≤ 6 000 000 octets chacun) ; parcours AC-11 dans Chrome, tâche 12, étape 2 ; relecture de Romain, tâche 11.

**AC-3b-6 : dépenses tenues**
- **Comportement :** à la fin du plan, alors la dépense de chaque outil reste sous le plafond du go et sous le budget de la spec (AC-17).
- **Vérifié par :** `bun scripts/spend.ts summary` (code 0) et totaux lus face au tableau des Global Constraints : Lyria ≤ 0,48 $, Nano Banana ≤ 0,40 $, Seedream ≤ 0,36 $.

## Structure des fichiers

```
src/app/        capture.ts (nouveau : ?record) ; engine.ts, main.ts (modifiés : branchement)
src/audio/      music.ts (modifié : boucle coupée sur la mesure, MENU_LOOP, fondu en option)
                game-audio.ts (modifié : bourdon éteint avant le moteur)
scripts/        seedream.ts, generate-image.ts (Seedream) ; og/og.html, build-og.sh (image de partage) ;
                ledger.ts, spend.ts (journal des dépenses) ; loop-measure.ts, measure-loop.ts (mesure de boucle) ;
                lyria.ts, generate-music.ts (modifiés : pistes menu et intro, dossier par piste)
tests/          capture, seedream, ledger, loop-measure (nouveaux) ; lyria, music-loop (modifiés)
assets/         ledger.jsonl (lignes ajoutées) ; audio/intro.mp3 ; images/{og-background,room-01,room-02}.* ;
                prompts/room-0{1,2}.txt ; lyria-{menu,intro}-response.json ; seedream-og-background-response.json
public/         audio/menu.mp3 ; rooms/room-0{1,2}.webp ; og-v1.jpg ; video/intro.{webm,mp4}
videos/agenthot-intro/   projet Hyperframes (sources versionnées ; prises, rendus et master ignorés par git)
```

Chaque fichier a une seule responsabilité :
- `capture.ts` : quand filmer, sous quel nom et quel format ; `engine.ts` décide du moment (replay, boucle du menu) ;
- `seedream.ts`, `lyria.ts`, `ledger.ts`, `loop-measure.ts` : logique pure, testée ; `generate-image.ts`, `generate-music.ts`, `spend.ts`, `measure-loop.ts` : les lignes de commande qui les branchent au disque, au réseau et à ffmpeg ;
- `music.ts` : la fenêtre de lecture de chaque piste, et le fondu cuit si la jointure s'entend.

## Prototype vérifié

Tout le code de ce plan a été exécuté avant d'être écrit ici (2026-09-30), sur une copie de `main` au commit `c4194b3`.
- **Rejeu par tâche dans un dossier vide :** les tests de chaque tâche échouent avant son code et passent après ; `tsc` passe à chaque étape ; les diffs de ce plan s'appliquent dans l'ordre et redonnent exactement l'arbre du prototype. Suite : 233 → 238 (tâche 1) → 252 (2) → 262 (3) → 264 (4) → 272 (5) → 274 (7, avec les nombres de la répétition) → 280 (10, fondu). Build : point d'entrée 40,4 Ko (14,4 Ko gzip), moteur 991 Ko (275,7 Ko gzip).
- **`captureStream` sur le rendu WebGPU (inconnue du brief, section 4) : ça marche.** Chrome, `?debug&record=menu` : canvas 1920 × 1080 affiché en 900 × 506 dans la fenêtre (16:9), vidéo enregistrée en 1920 × 1080, image non noire (luminance moyenne 128). La boucle du menu a été filmée seule et téléchargée : `agenthot-menu-….webm`, 27,5 Mo, 30,66 s une fois convertie. Le repli `?renderer=webgl` n'est pas nécessaire.
- **Le WebM de MediaRecorder n'a pas de durée** (`ffprobe` : `duration=N/A`) : chaque prise est convertie en MP4 avant le montage (tâche 9).
- **Lyria ne tient pas le tempo demandé :** `game.mp3`, demandé à 120 BPM, est mesuré à 130,00 BPM (pente sur 191 temps, analyseur Hyperframes). La boucle du menu se coupe donc sur le tempo mesuré.
- **AV1 :** 1920 × 1080 à 30 i/s donne `profile=Main`, `level=8` (niveau 4.0) : conforme au type `av01.0.08M.08` déclaré dans `src/ui/media.ts`. À 60 i/s ce serait le niveau 4.1.
- **Image de partage :** fond bruité (pire cas), 279 Ko en qualité 4, polices justes. Un fond introuvable donnait une image vide sans erreur : le script refuse maintenant.

**Comment appliquer ce plan :**
- Un fichier **nouveau** est donné en entier : le recopier tel quel.
- Un fichier **modifié** est donné en diff unifié, produit par `git diff` sur le prototype. L'appliquer à la main (Edit), ou l'enregistrer dans un fichier puis `git apply <fichier>` depuis la racine. Les numéros de ligne supposent que les tâches précédentes sont faites.
- Les tâches 7 et 10 contiennent des valeurs mesurées (`MENU_LOOP`, durée de `menu.mp3`) : le diff montre celles de la répétition sur `game.mp3`, à remplacer par la mesure réelle. `git apply` échouera sur ces lignes : appliquer à la main.

## Décisions prises en écrivant ce plan

Chacune est réversible ; Romain les relit avec le plan.
1. **Cinématique en 30 images par seconde.** Le type déclaré par le jeu (`av01.0.08M.08`) est exact, et 6 Mo pour 25 s tiennent mieux. Battu : 60 i/s (niveau AV1 4.1, type à changer, débit à doubler pour le même poids).
2. **Boucle du menu coupée sur la mesure, sans fondu par défaut.** Elle dure un nombre entier de mesures au tempo mesuré et démarre 30 ms avant un temps fort. Le fondu enchaîné (tâche 10) ne se fait que si Romain entend la jointure (spec 7.2). Battu : le fondu d'office (une mesure de musique perdue pour rien si la coupe est propre) ; des mesures supposées à 120 BPM (Lyria est à 130).
3. **Fondu linéaire, pas à puissance constante.** La fin et le début sont le même groove calé sur la mesure : un fondu à puissance constante gonflerait de 3 dB les coups communs. Battu : `cos`/`sin` du brief, fait pour deux sons sans rapport.
4. **Le morceau d'intro vit dans `assets/audio/`**, pas dans `public/` : il est mixé dans la vidéo, le jeu ne le charge jamais. Battu : `public/audio/` (un fichier servi pour rien).
5. **Nano Banana par le MCP erom-image** (spec 8), journalisé par `bun scripts/spend.ts log-nanobanana` au coût de la grille. Battu : un script d'appel direct à l'API Gemini (convention externe jamais sondée, et la spec nomme le MCP).
6. **Plafonds du go vérifiés par un outil**, pas de tête : `spend.ts check` compare le total de l'outil dans le journal au plafond absolu (Lyria 0,48 $, Nano Banana 0,40 $, Seedream 0,36 $). Battu : un compteur d'essais tenu par l'exécutant.
7. **Cartes de texte de la cinématique en typographie Hyperframes**, avec nos polices. Battu : des cartes Seedream (hors du go).
8. **Charte de la cinématique = le design system du jeu** (spec 6.1 et 6.3), écrite dans `frame.md`. Battu : copier un preset Hyperframes tel quel, comme le demande la skill (il remplacerait des couleurs et des polices déjà décidées).
9. **Prises converties en MP4 H.264, 60 i/s, CRF 14, avant le montage.** Le WebM de MediaRecorder n'a pas de durée. Battu : monter les WebM bruts (recherche temporelle incertaine dans le rendu Hyperframes).
10. **Sources générées versionnées** (images, intro, prompts, extraits de réponses) : le journal pointe vers elles. **Prises, rendus et master ignorés par git** (lourds, refaisables). Battu : tout versionner (dépôt alourdi de centaines de Mo).
11. **`?record` : image 16:9 sans déformation, pas de temps fixe, extension selon le conteneur.** Battu : canvas étiré à la fenêtre (image déformée pendant la partie filmée) ; `.webm` imposé (faux sous Safari).
12. **Point 6 de la revue finale du 3a inclus** (bourdon éteint avant le moteur) : il s'entend sous la cinématique, qui existe enfin. Les autres points du backlog restent hors du 3b.

---

### Task 1 : le jeu filme ses séquences (`?record=1`, `?record=menu`)

La cinématique est montée avec de vraies images du jeu (spec 4.2). `?record=1` filme chaque replay de victoire (la victoire, puis chaque « Revoir le replay ») ; `?record=menu` filme une boucle entière du fond du menu. Le canvas est dessiné en 1920 × 1080 quelle que soit la fenêtre, affiché en 16:9 sans déformation, avec un pas de temps fixe de 1/60 s. Le son est pris sur la sortie commune (`engine.master`).

**Files :**
- Create : `src/app/capture.ts`, `tests/capture.test.ts`
- Modify : `src/app/engine.ts`, `src/app/main.ts`

**Interfaces :**
- Consumes : `createEngine(options)`, `audio.engine.ctx`, `audio.engine.master` (plan 2), `FrameLimiter.shouldRender` (plan 3a).
- Produces : `EngineOptions.record: CaptureTarget | null` ; `captureTarget(params: URLSearchParams): "replay" | "menu" | null` ; fichiers `agenthot-<replay|menu>-AAAAMMJJ-HHMMSS.webm` téléchargés par le navigateur (utilisés à la tâche 9).

- [ ] **Step 1 : écrire les tests**

`tests/capture.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { CAPTURE, captureDisplaySize, captureFileName, captureMimeType, captureTarget } from "../src/app/capture";

describe("enregistrement des séquences de la cinématique (plan 3b)", () => {
  test("?record=1 filme le replay, ?record=menu le fond du menu, sans paramètre rien", () => {
    expect(captureTarget(new URLSearchParams("record=1"))).toBe("replay");
    expect(captureTarget(new URLSearchParams("debug&record=replay"))).toBe("replay");
    expect(captureTarget(new URLSearchParams("record=menu"))).toBe("menu");
    expect(captureTarget(new URLSearchParams("debug"))).toBeNull();
  });

  test("le fichier porte la cible et l'heure : deux prises ne s'écrasent pas", () => {
    const vp9 = "video/webm;codecs=vp9,opus";
    expect(captureFileName("replay", new Date(2026, 8, 30, 9, 5, 7), vp9)).toBe("agenthot-replay-20260930-090507.webm");
    expect(captureFileName("menu", new Date(2026, 8, 30, 9, 5, 8), vp9)).toBe("agenthot-menu-20260930-090508.webm");
  });

  test("l'extension suit le conteneur enregistré : un MP4 (Safari) n'est pas nommé .webm", () => {
    expect(captureFileName("replay", new Date(2026, 8, 30, 9, 5, 7), "video/mp4;codecs=avc1,mp4a")).toBe("agenthot-replay-20260930-090507.mp4");
  });

  test("VP9 + Opus d'abord, VP8 en repli, WebM nu ensuite, sinon le choix du navigateur", () => {
    expect(captureMimeType(() => true)).toBe("video/webm;codecs=vp9,opus");
    expect(captureMimeType((t) => !t.includes("vp9"))).toBe("video/webm;codecs=vp8,opus");
    expect(captureMimeType((t) => t === "video/webm")).toBe("video/webm");
    expect(captureMimeType(() => false)).toBe("");
  });

  test("pendant l'enregistrement, l'image 16:9 tient dans la fenêtre sans être déformée", () => {
    // Fenêtre 16:10 (MacBook) : bandes en bas ; fenêtre très large : bandes sur le côté.
    expect(captureDisplaySize(1728, 1080)).toEqual({ width: 1728, height: 972 });
    expect(captureDisplaySize(2560, 1080)).toEqual({ width: 1920, height: 1080 });
    const { width, height } = captureDisplaySize(1512, 945);
    expect(width).toBeLessThanOrEqual(1512);
    expect(height).toBeLessThanOrEqual(945);
    expect(width / height).toBeCloseTo(CAPTURE.width / CAPTURE.height, 2);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/capture.test.ts 2>&1 | tee .superpowers/plan-3b-t1-red.log`
Expected : `Cannot find module '../src/app/capture'`, 1 fail.

- [ ] **Step 3 : écrire le code**

`src/app/capture.ts` :

```ts
// Enregistrement des séquences de la cinématique (spec 4.2) : le jeu filme son propre canvas et sa propre sortie
// audio (`?record=1` : le replay de victoire ; `?record=menu` : une boucle du fond du menu). Aucun outil externe :
// `canvas.captureStream` + `MediaRecorder`, puis un fichier téléchargé.

export type CaptureTarget = "replay" | "menu";

export const CAPTURE = {
  // Image de référence de la cinématique (spec 4.2) : le canvas est dessiné à cette taille pendant l'enregistrement.
  width: 1920,
  height: 1080,
  fps: 60,
  // Débit du master (ré-encodé ensuite pour le web) : assez haut pour que les éclats restent nets.
  videoBitsPerSecond: 16_000_000,
  audioBitsPerSecond: 192_000,
} as const;

// `?record=1` ou `?record=replay` : le replay ; `?record=menu` : le menu ; sinon rien.
export function captureTarget(params: URLSearchParams): CaptureTarget | null {
  const value = params.get("record");
  if (value === null) return null;
  return value === "menu" ? "menu" : "replay";
}

// Nom du fichier : `agenthot-<cible>-AAAAMMJJ-HHMMSS.<ext>`, en heure locale. L'extension suit le conteneur
// réellement enregistré (Safari n'enregistre que du MP4).
export function captureFileName(target: CaptureTarget, date: Date, mimeType: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `agenthot-${target}-${stamp}.${mimeType.startsWith("video/mp4") ? "mp4" : "webm"}`;
}

// Premier format que le navigateur sait enregistrer : VP9 + Opus d'abord (net pour les éclats), sinon VP8, sinon
// le choix du navigateur (chaîne vide).
export function captureMimeType(isSupported: (type: string) => boolean): string {
  for (const type of ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (isSupported(type)) return type;
  }
  return "";
}

// Taille d'affichage du canvas pendant un enregistrement : l'image 16:9 tient dans la fenêtre sans être déformée.
export function captureDisplaySize(windowWidth: number, windowHeight: number): { width: number; height: number } {
  const scale = Math.min(windowWidth / CAPTURE.width, windowHeight / CAPTURE.height);
  return { width: Math.round(CAPTURE.width * scale), height: Math.round(CAPTURE.height * scale) };
}

export class CanvasCapture {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private readonly canvas: HTMLCanvasElement;
  private readonly audioTrack: MediaStreamTrack | undefined;

  // `audioOut` : la sortie commune du son (le compresseur, avant la destination).
  constructor(canvas: HTMLCanvasElement, ctx: AudioContext, audioOut: AudioNode) {
    this.canvas = canvas;
    const tap = new MediaStreamAudioDestinationNode(ctx);
    audioOut.connect(tap);
    this.audioTrack = tap.stream.getAudioTracks()[0];
  }

  get recording(): boolean {
    return this.recorder !== null;
  }

  start(): void {
    if (this.recorder) return;
    const stream = this.canvas.captureStream(CAPTURE.fps);
    if (this.audioTrack) stream.addTrack(this.audioTrack);
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, {
      mimeType: captureMimeType((type) => MediaRecorder.isTypeSupported(type)),
      videoBitsPerSecond: CAPTURE.videoBitsPerSecond,
      audioBitsPerSecond: CAPTURE.audioBitsPerSecond,
    });
    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });
    this.recorder.start(1000);
    console.info("[agenthot] capture started");
  }

  // Arrête et télécharge le fichier. Renvoie sa taille (octets), pour la console.
  stop(target: CaptureTarget): Promise<number> {
    const recorder = this.recorder;
    if (!recorder) return Promise.resolve(0);
    this.recorder = null;
    return new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(this.chunks, { type: recorder.mimeType });
          const fileName = captureFileName(target, new Date(), recorder.mimeType);
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
          console.info(`[agenthot] capture saved ${fileName} (${(blob.size / 1e6).toFixed(1)} MB)`);
          resolve(blob.size);
        },
        { once: true },
      );
      recorder.stop();
    });
  }
}
```

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index b61eba1..47a3cf0 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -13,6 +13,7 @@ import type { Settings } from "../settings/settings";
 import { Game, type PlayerInput, emptyInput } from "../sim/game";
 import { TIME } from "../sim/time";
 import { createWorldView, writeGameView } from "../sim/view";
+import { CAPTURE, CanvasCapture, type CaptureTarget, captureDisplaySize } from "./capture";
 import { Hud } from "./hud";
 import { InputController } from "./input";
 
@@ -31,6 +32,8 @@ export interface EngineOptions {
   onSettingsChange(settings: Settings): void;
   // Chaque changement d'écran de la salle : le point d'entrée y accroche ses panneaux (pause, victoire).
   onModeChange(mode: EngineMode): void;
+  // `?record=1` / `?record=menu` : enregistrer le replay de victoire, ou une boucle du menu (plan 3b).
+  record: CaptureTarget | null;
 }
 
 export interface Engine {
@@ -69,6 +72,23 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   const quality = new QualityGovernor(options.settings.quality);
   const limiter = new FrameLimiter();
   let settings = options.settings;
+  // Enregistrement (plan 3b) : canvas en 1920 × 1080 quelle que soit la fenêtre, résolution fixe, 60 images par
+  // seconde et pas de temps fixe (1/60 s par image) : une image lente ne fait pas sauter la séquence filmée.
+  const capture = options.record ? new CanvasCapture(renderer.domElement, audio.engine.ctx, audio.engine.master) : null;
+  function fitCanvas(): void {
+    if (capture) {
+      renderer.setPixelRatio(1);
+      renderer.setSize(CAPTURE.width, CAPTURE.height, false);
+      const shown = captureDisplaySize(window.innerWidth, window.innerHeight);
+      renderer.domElement.style.width = `${shown.width}px`;
+      renderer.domElement.style.height = `${shown.height}px`;
+      world.resize(CAPTURE.width / CAPTURE.height);
+      return;
+    }
+    renderer.setSize(window.innerWidth, window.innerHeight);
+    world.resize(window.innerWidth / window.innerHeight);
+  }
+  if (capture) fitCanvas();
 
   // Applique les paramètres à chaud (spec 4.5) : souris, champ de vision, volumes, qualité.
   function applySettings(next: Settings): void {
@@ -78,6 +98,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     world.setFov(next.fov);
     audio.engine.setVolumes(next.musicVolume / 100, next.sfxVolume / 100);
     if (quality.mode !== next.quality) quality.setMode(next.quality);
+    // Pendant un enregistrement, la résolution reste celle de la capture (fitCanvas).
+    if (capture) return;
     // Chaque cran d'un curseur appelle cette fonction : le pixel ratio (coûteux : cibles de rendu recréées) ne
     // bouge que s'il change vraiment.
     const ratio = basePixelRatio(isWebGPU) * quality.scale;
@@ -114,6 +136,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     replay.restart();
     audio.playReplayMusic();
     setMode("replay");
+    // `?record=1` : chaque replay (la victoire, puis chaque « Revoir le replay ») est une prise.
+    if (options.record === "replay") capture?.start();
   }
 
   function startRun(): void {
@@ -161,10 +185,7 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       setMode("paused");
     }
   });
-  window.addEventListener("resize", () => {
-    renderer.setSize(window.innerWidth, window.innerHeight);
-    world.resize(window.innerWidth / window.innerHeight);
-  });
+  window.addEventListener("resize", fitCanvas);
 
   writeGameView(game, view);
   world.update(view);
@@ -209,10 +230,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     if (mode === "idle") return;
     const now = performance.now();
     // Écran plus rapide que la limite : on saute cette image de l'écran, rien n'avance.
-    if (!limiter.shouldRender(now, quality.fpsCap)) return;
-    if (quality.sample(now - last)) renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
+    if (!limiter.shouldRender(now, capture ? CAPTURE.fps : quality.fpsCap)) return;
+    if (!capture && quality.sample(now - last)) renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
     // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
-    const dt = Math.min(0.1, (now - last) / 1000);
+    const dt = capture ? 1 / CAPTURE.fps : Math.min(0.1, (now - last) / 1000);
     last = now;
 
     // Sonde AC-6 : mesurée de l'appui (R ou clic) à l'image qui suit la relance, quand la précédente est rendue.
@@ -224,7 +245,11 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     if (mode === "menu") {
       menuTime += dt;
       // Boucle de la démo : au bout de la fenêtre, on repart du début (les éclats et les baies sont rejoués).
-      if (menuReplay.finished) menuReplay.restart();
+      // `?record=menu` : une boucle entière est filmée, du fondu d'entrée au fondu de sortie.
+      if (menuReplay.finished) {
+        if (options.record === "menu" && capture?.recording) void capture.stop("menu");
+        menuReplay.restart();
+      }
       menuReplay.update(dt * MENU_DEMO.playbackRate);
       menuCamera(menuTime, menuPose);
       post.setFade(menuFade(menuReplay.playhead, menuReplay.duration));
@@ -258,7 +283,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       world.update(replay.view, dt);
       audio.frame(replay.view, replay.events);
       hud.chant(replay.playhead);
-      if (replay.finished) setMode("won");
+      if (replay.finished) {
+        if (capture?.recording) void capture.stop("replay");
+        setMode("won");
+      }
     } else {
       // Départ, pause et fin de victoire : la partie est figée, le son aussi.
       audio.freeze(TIME.min);
@@ -291,6 +319,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       menuTime = 0;
       setMode("menu");
       audio.playMenuMusic();
+      // `?record=menu` : la prise part du début de la démo (le fondu depuis le noir).
+      if (options.record === "menu") capture?.start();
     },
     enterRoom(): void {
       last = performance.now();
diff --git a/src/app/main.ts b/src/app/main.ts
index 0c263d0..76d5bf1 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -15,6 +15,7 @@ import { MobileScreen } from "../ui/mobile";
 import { type PanelHandle, creditsBody, openPanel, roomsBody, settingsBody } from "../ui/panels";
 import { RoomPanels } from "../ui/room-panels";
 import { BootError, ENGINE_TIMEOUT_MS, TimeoutError, bootFailureMessage, withTimeout } from "./boot-failure";
+import { captureTarget } from "./capture";
 import { browserEnvironment, playOnDesktopOnly } from "./device";
 import type { Engine, EngineMode, EngineOptions } from "./engine";
 
@@ -97,6 +98,7 @@ async function runBoot(loader: LoaderScreen): Promise<void> {
     forceWebGL: params.get("renderer") === "webgl",
     onSettingsChange: (next) => saveSettings(storage, next),
     onModeChange: (mode) => onModeChange(mode),
+    record: captureTarget(params),
   });
   // Panneaux de la salle, branchés une fois le menu construit (plus bas).
   let onModeChange: (mode: EngineMode) => void = () => undefined;
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t1-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t1-typecheck.log`
Expected : `238 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : vérifier dans Chrome (gratuit, fenêtre au premier plan)**

1. `cd /Users/recarnot/dev/claudehot-videogame && bun run dev --port 5390 --strictPort > .superpowers/plan-3b-t1-dev.log 2>&1 &`
2. MCP Chrome DevTools : `new_page` sur `http://localhost:5390/?debug&record=menu`, attendre 2 s, `press_key` « a » (geste du chargeur).
3. `list_console_messages` : `[agenthot] capture started`. Attendre 32 s (la démo du menu dure environ 30 s réelles), puis : `[agenthot] capture saved agenthot-menu-….webm (… MB)`.
4. `ffprobe -v error -show_entries stream=codec_name,width,height -of default=nw=1 ~/Downloads/agenthot-menu-*.webm` : `vp9`, `1920`, `1080`, et une piste `opus`.
5. Mettre ce fichier d'essai à la corbeille (`trash`), fermer la page, arrêter le serveur.

Mesure du prototype : 27,5 Mo pour une boucle, 30,66 s une fois convertie en MP4.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/app/capture.ts tests/capture.test.ts src/app/engine.ts src/app/main.ts && git commit -m "feat(record): ?record=1 films each victory replay, ?record=menu one menu loop"
```

---

### Task 2 : images Seedream et image de partage

Le fond de l'image de partage vient de Seedream 5.0 Pro par OpenRouter (spec 4.7) : même garde-fous que Lyria (essai à blanc par défaut, `--pay`, `--overwrite`, budget relu, journal avant tout fichier, réponse brute gardée), coût réel lu dans `usage.cost`. Le logo et le texte sont posés ensuite avec nos polices : `scripts/og/og.html`, capturée à 1200 × 630 par Chrome sans écran, puis JPEG de moins de 300 Ko.

**Files :**
- Create : `scripts/seedream.ts`, `scripts/generate-image.ts`, `scripts/og/og.html`, `scripts/build-og.sh`, `tests/seedream.test.ts`
- Modify : `scripts/lyria.ts` (`parseArgs` accepte une table de n'importe quelles valeurs)

**Interfaces :**
- Consumes : `canAfford`, `spentUsd`, `withoutAudioData`, `parseArgs`, `LEDGER_PATH` (`scripts/lyria.ts`, plan 2).
- Produces : `SEEDREAM` (`ledgerTool: "seedream"`, `budgetUsd: 3`, `costUsd: { "1K": 0.045, "2K": 0.09 }`) utilisé par la tâche 3 ; `bun scripts/generate-image.ts og-background [--pay] [--overwrite]` → `assets/images/og-background.<png|jpg|webp>` ; `zsh scripts/build-og.sh <fond relatif à scripts/og/> <sortie.jpg>` (tâche 8).

Sources de la convention externe : sonde gratuite de l'endpoint du modèle (brief section 2, 2026-09-29 : paramètres `resolution` `1K`/`2K`, `aspect_ratio` dont `2:1`, `n` = 1, prix 0,045 $ et 0,09 $) et guide `docs/superpowers/idea/Seedream-5.0-Pro.md`. La forme d'une réponse réussie n'est pas capturée (elle coûte un appel) : `findImage` la cherche n'importe où, et le premier appel garde la réponse brute.

- [ ] **Step 1 : écrire les tests**

`tests/seedream.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { type ImageIo, SEEDREAM, billedCost, findImage, generateImage, imageExtension, seedreamBody } from "../scripts/seedream";

const LONG = "B".repeat(1000);
const SPEC = { prompt: "p", aspectRatio: "2:1", resolution: "2K" } as const;

describe("images Seedream : requête et réponse (brief plan 3, section 2)", () => {
  test("le corps suit la sonde du modèle : une image, ratio et résolution en clair", () => {
    expect(seedreamBody(SPEC)).toEqual({ model: "bytedance-seed/seedream-5-0-pro", prompt: "p", n: 1, aspect_ratio: "2:1", resolution: "2K" });
  });

  test("trouve l'image dans la forme de la doc (data[0].b64_json + media_type)", () => {
    const response = { created: 1, data: [{ b64_json: LONG, media_type: "image/jpeg" }], usage: { cost: 0.09 } };
    expect(findImage(response)).toEqual({ data: LONG, mimeType: "image/jpeg" });
  });

  test("sans type annoncé, l'image est lue comme du PNG ; sans image, rien n'est trouvé", () => {
    expect(findImage({ data: [{ b64_json: LONG }] })).toEqual({ data: LONG, mimeType: "image/png" });
    expect(findImage({ error: { code: 402, message: "Insufficient credits" } })).toBeNull();
  });

  test("le coût du journal est celui annoncé par OpenRouter, sinon celui de la grille", () => {
    expect(billedCost({ usage: { cost: 0.0875 } }, "2K")).toBe(0.0875);
    expect(billedCost({ usage: {} }, "2K")).toBe(SEEDREAM.costUsd["2K"]);
    expect(billedCost({ usage: { cost: -1 } }, "1K")).toBe(SEEDREAM.costUsd["1K"]);
    expect(billedCost(null, "1K")).toBe(SEEDREAM.costUsd["1K"]);
  });

  test("extension de fichier selon le type MIME", () => {
    expect(imageExtension("image/jpeg")).toBe("jpg");
    expect(imageExtension("image/webp")).toBe("webp");
    expect(imageExtension("image/png")).toBe("png");
  });
});

// Faux client : aucune API, aucun disque. Il note chaque opération dans l'ordre où elle arrive.
describe("images Seedream : garde-fous avant un appel payant", () => {
  const IMAGE_RESPONSE = JSON.stringify({ data: [{ b64_json: "QUJD", media_type: "image/png" }], usage: { cost: 0.09 } });
  const OK = { status: 200, ok: true, text: IMAGE_RESPONSE };
  const OPTIONS = { name: "og-background", spec: SPEC, pay: true, overwrite: false };

  function fakeIo(over: { response?: { status: number; ok: boolean; text: string }; existing?: string[]; ledger?: string; apiKey?: string | undefined } = {}) {
    const events: string[] = [];
    const ledger: string[] = over.ledger ? [over.ledger] : [];
    const existing = new Set(over.existing ?? []);
    const io: ImageIo = {
      apiKey: "apiKey" in over ? over.apiKey : "fake-key",
      readLedger: async () => ledger.join(""),
      exists: async (path) => existing.has(path),
      callApi: async () => {
        events.push("call");
        return over.response ?? OK;
      },
      writeFile: async (path) => {
        events.push(`write:${path}`);
      },
      appendLedgerLine: async (line) => {
        events.push("ledger");
        ledger.push(line);
      },
      now: () => new Date("2026-09-30T12:00:00Z"),
      info: () => {},
      error: () => {},
    };
    return { io, events, ledger };
  }

  test("sans --pay, aucun appel, aucune écriture", async () => {
    const { io, events } = fakeIo();
    expect(await generateImage({ ...OPTIONS, pay: false }, io)).toEqual({ outcome: "dry-run", exitCode: 0 });
    expect(events).toEqual([]);
  });

  test("une image déjà là, quel que soit son format, bloque l'appel sans --overwrite", async () => {
    for (const path of ["assets/images/og-background.png", "assets/images/og-background.jpg"]) {
      const { io, events } = fakeIo({ existing: [path] });
      expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "exists", exitCode: 1 });
      expect(events).toEqual([]);
    }
  });

  test("avec --overwrite, une image déjà là n'empêche plus l'appel", async () => {
    const { io, events } = fakeIo({ existing: ["assets/images/og-background.png"] });
    expect((await generateImage({ ...OPTIONS, overwrite: true }, io)).outcome).toBe("written");
    expect(events[0]).toBe("call");
  });

  test("le journal est complété juste après la réponse payée, avec le coût réel, avant toute écriture", async () => {
    const { io, events, ledger } = fakeIo();
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "written", exitCode: 0 });
    expect(events.slice(0, 2)).toEqual(["call", "ledger"]);
    expect(events.slice(2).every((e) => e.startsWith("write:"))).toBe(true);
    expect(events).toContain("write:assets/images/og-background.png");
    expect(JSON.parse(ledger[0]!)).toMatchObject({ tool: "seedream", model: SEEDREAM.model, costUsd: 0.09, output: "assets/images/og-background.png" });
  });

  test("une réponse 200 sans image est journalisée avant toute écriture, avec la réponse brute comme sortie", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 200, ok: true, text: JSON.stringify({ data: [] }) } });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "no-image", exitCode: 1 });
    expect(events.slice(0, 2)).toEqual(["call", "ledger"]);
    expect(JSON.parse(ledger[0]!).output).toBe(".superpowers/seedream-og-background-raw.json");
  });

  test("une erreur HTTP (402, 429, 502) n'est pas facturée : pas de ligne, la réponse brute est gardée", async () => {
    const { io, events, ledger } = fakeIo({ response: { status: 402, ok: false, text: JSON.stringify({ error: { code: 402, message: "no credit" } }) } });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "http-error", exitCode: 1 });
    expect(ledger).toEqual([]);
    expect(events).toContain("write:.superpowers/seedream-og-background-raw.json");
  });

  test("un journal qui ne se laisse pas écrire n'empêche pas de garder la réponse payée", async () => {
    const { io, events } = fakeIo();
    io.appendLedgerLine = async () => {
      throw new Error("disk full");
    };
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "ledger-failed", exitCode: 1 });
    expect(events).toContain("write:.superpowers/seedream-og-background-raw.json");
  });

  test("un budget dépassé refuse avant l'appel", async () => {
    const line = `${JSON.stringify({ date: "d", tool: "seedream", model: "m", prompt: "p", output: "o", costUsd: 2.95 })}\n`;
    const { io, events } = fakeIo({ ledger: line });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "over-budget", exitCode: 2 });
    expect(events).toEqual([]);
  });

  test("sans clé d'API, aucun appel", async () => {
    const { io, events } = fakeIo({ apiKey: undefined });
    expect(await generateImage(OPTIONS, io)).toEqual({ outcome: "no-api-key", exitCode: 1 });
    expect(events).toEqual([]);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/seedream.test.ts 2>&1 | tee .superpowers/plan-3b-t2-red.log`
Expected : `Cannot find module '../scripts/seedream'`, 1 fail.

- [ ] **Step 3 : écrire le code**

`scripts/seedream.ts` :

```ts
// Outils purs du script d'images Seedream 5.0 Pro via OpenRouter (spec 8) : mêmes garde-fous que Lyria (plan 2).
// Appel, corps et réponse d'après le brief plan 3, section 2 (sonde gratuite du 2026-09-29 sur l'endpoint du modèle,
// et guide docs/superpowers/idea/Seedream-5.0-Pro.md). La forme d'une réponse réussie n'a pas été capturée (elle
// coûte un appel) : la lecture cherche l'image n'importe où, et le premier appel garde la réponse brute.
import { canAfford, spentUsd, withoutAudioData } from "./lyria";

export const SEEDREAM = {
  endpoint: "https://openrouter.ai/api/v1/images",
  model: "bytedance-seed/seedream-5-0-pro",
  // Prix par image (sonde du 2026-09-29) : 1K 0,045 $, 2K 0,09 $ (variante « high_resolution »).
  costUsd: { "1K": 0.045, "2K": 0.09 },
  // Budget Seedream de la spec 8.
  budgetUsd: 3,
  ledgerTool: "seedream",
} as const;

export type Resolution = keyof typeof SEEDREAM.costUsd;

export interface ImageSpec {
  prompt: string;
  // Valeurs acceptées par le modèle (sonde) : "1:1", "2:1", "16:9", etc.
  aspectRatio: string;
  resolution: Resolution;
}

export interface SeedreamBody {
  model: string;
  prompt: string;
  n: 1;
  aspect_ratio: string;
  resolution: Resolution;
}

export function seedreamBody(spec: ImageSpec): SeedreamBody {
  return { model: SEEDREAM.model, prompt: spec.prompt, n: 1, aspect_ratio: spec.aspectRatio, resolution: spec.resolution };
}

export interface FoundImage {
  data: string;
  mimeType: string;
}

// Premier `b64_json` trouvé dans la réponse (doc : data[0].b64_json, avec data[0].media_type), n'importe où.
export function findImage(node: unknown): FoundImage | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findImage(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object" || node === null) return null;
  const obj = node as Record<string, unknown>;
  if (typeof obj.b64_json === "string") {
    const mime = obj.media_type ?? obj.mime_type ?? obj.mimeType;
    return { data: obj.b64_json, mimeType: typeof mime === "string" ? mime : "image/png" };
  }
  for (const key of Object.keys(obj)) {
    const found = findImage(obj[key]);
    if (found) return found;
  }
  return null;
}

// Coût réel annoncé par OpenRouter (`usage.cost`, en dollars), sinon celui de la grille.
export function billedCost(json: unknown, resolution: Resolution): number {
  const usage = (json as { usage?: { cost?: unknown } } | null)?.usage;
  return typeof usage?.cost === "number" && usage.cost >= 0 ? usage.cost : SEEDREAM.costUsd[resolution];
}

export function imageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

// Chemins possibles d'une image déjà générée : l'extension dépend du format renvoyé.
export function imagePaths(name: string): string[] {
  return ["png", "jpg", "webp"].map((ext) => `assets/images/${name}.${ext}`);
}

export interface ImageIo {
  apiKey: string | undefined;
  readLedger(): Promise<string>;
  exists(path: string): Promise<boolean>;
  callApi(body: SeedreamBody): Promise<{ status: number; ok: boolean; text: string }>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  appendLedgerLine(line: string): Promise<void>;
  now(): Date;
  info(text: string): void;
  error(text: string): void;
}

export type ImageOutcome = "dry-run" | "over-budget" | "exists" | "no-api-key" | "http-error" | "no-image" | "ledger-failed" | "written";

// Génère une image dans assets/images/<nom>.<ext>. Garde-fous, dans l'ordre : budget, fichier existant, clé,
// budget relu à neuf, appel ; la ligne du journal est ajoutée juste après une réponse 2xx, avant tout fichier.
export async function generateImage(
  opts: { name: string; spec: ImageSpec; pay: boolean; overwrite: boolean },
  io: ImageIo,
): Promise<{ outcome: ImageOutcome; exitCode: number }> {
  const estimate = SEEDREAM.costUsd[opts.spec.resolution];
  let ledgerText = await io.readLedger();
  const overBudget = (): { outcome: ImageOutcome; exitCode: number } => {
    io.error(`budget exceeded: ${spentUsd(ledgerText, SEEDREAM.ledgerTool).toFixed(3)} $ spent + ${estimate} $ > ${SEEDREAM.budgetUsd} $. Ask Romain.`);
    return { outcome: "over-budget", exitCode: 2 };
  };
  if (!canAfford(ledgerText, SEEDREAM.ledgerTool, estimate, SEEDREAM.budgetUsd)) return overBudget();
  const body = seedreamBody(opts.spec);
  let existing: string | undefined;
  for (const path of imagePaths(opts.name)) if (await io.exists(path)) existing ??= path;
  io.info(`image ${opts.name} · spent ${spentUsd(ledgerText, SEEDREAM.ledgerTool).toFixed(3)} $ of ${SEEDREAM.budgetUsd} $ · this call ~${estimate} $`);
  if (!opts.pay) {
    io.info(JSON.stringify(body, null, 2));
    io.info("dry run: nothing was called or spent. A real call needs --pay.");
    if (existing) io.info(`${existing} already exists: a real call also needs --overwrite.`);
    return { outcome: "dry-run", exitCode: 0 };
  }
  if (existing && !opts.overwrite) {
    io.error(`${existing} already exists: pass --overwrite to pay for a new one.`);
    return { outcome: "exists", exitCode: 1 };
  }
  if (!io.apiKey) {
    io.error("OPENROUTER_API_KEY is not set");
    return { outcome: "no-api-key", exitCode: 1 };
  }
  ledgerText = await io.readLedger();
  if (!canAfford(ledgerText, SEEDREAM.ledgerTool, estimate, SEEDREAM.budgetUsd)) return overBudget();

  const response = await io.callApi(body);
  const rawPath = `.superpowers/seedream-${opts.name}-raw.json`;
  let json: unknown = null;
  try {
    json = JSON.parse(response.text);
  } catch {
    json = null;
  }
  const image = json ? findImage(json) : null;
  const output = image ? `assets/images/${opts.name}.${imageExtension(image.mimeType)}` : rawPath;

  // 2xx : facturé (402, 429 et 502 ne le sont pas, brief section 2). Journal d'abord.
  if (response.ok) {
    const cost = billedCost(json, opts.spec.resolution);
    const entry = { date: io.now().toISOString(), tool: SEEDREAM.ledgerTool, model: SEEDREAM.model, prompt: opts.spec.prompt, output, costUsd: cost };
    try {
      await io.appendLedgerLine(`${JSON.stringify(entry)}\n`);
    } catch (error) {
      await io.writeFile(rawPath, response.text);
      io.error(`billed (${cost} $) but the ledger line could not be written (${String(error)}): add it by hand. Raw response in ${rawPath}`);
      return { outcome: "ledger-failed", exitCode: 1 };
    }
  }
  await io.writeFile(rawPath, response.text);
  if (json) await io.writeFile(`assets/seedream-${opts.name}-response.json`, `${JSON.stringify(withoutAudioData(json), null, 2)}\n`);
  if (!response.ok) {
    io.error(`HTTP ${response.status}: not billed. Raw response in ${rawPath}`);
    return { outcome: "http-error", exitCode: 1 };
  }
  if (!image) {
    io.error(`HTTP ${response.status} but no image found. Billed and logged; raw response in ${rawPath} (recover it, do not pay again).`);
    return { outcome: "no-image", exitCode: 1 };
  }
  await io.writeFile(output, Buffer.from(image.data, "base64"));
  io.info(`wrote ${output} (${image.mimeType})`);
  return { outcome: "written", exitCode: 0 };
}
```

`scripts/generate-image.ts` :

```ts
// Génère une image avec Seedream 5.0 Pro via OpenRouter (spec 4.7 et 8). Usage :
//   bun scripts/generate-image.ts <og-background> [--pay] [--overwrite]
// Par défaut c'est un essai à blanc : il affiche la requête et le budget sans rien appeler ni dépenser
// (`--dry-run` reste accepté). Seul `--pay` déclenche un appel réel (0,09 $ en 2K).
// `--overwrite` est nécessaire pour remplacer une image déjà générée dans assets/images/.
// Chaque vraie génération ajoute une ligne à assets/ledger.jsonl, juste après la réponse payée.
import { appendFile, mkdir } from "node:fs/promises";
import { LEDGER_PATH, parseArgs } from "./lyria";
import { type ImageIo, type ImageSpec, SEEDREAM, generateImage } from "./seedream";

// Prompts en anglais. Le fond de l'image de partage est sans texte : le logo et les mots sont posés ensuite avec
// nos polices (scripts/og/og.html, décision du 2026-09-29). Orange seulement sur la menace (spec 6.1).
const IMAGES: Record<string, ImageSpec> = {
  "og-background": {
    prompt: [
      "Wide cinematic key art for a minimalist first-person shooter where time only moves when you move.",
      "A clean white server room with rows of tall off-white server racks, flat-shaded low-poly geometry,",
      "thin black ink outlines, soft shadows.",
      "Time is frozen: three bullets hang in mid-air with glowing orange (#D97757) light trails, and a faceted",
      "crystalline humanoid enemy glowing orange shatters into dozens of sharp shards suspended in the air.",
      "Everything except the enemy and the bullets is white, light gray or black: no other orange anywhere.",
      "Beyond the room, a deep night-blue void (#0D111B).",
      "The left half of the image is calm and dark, fading into the night-blue void, leaving empty space for a title.",
      "No text, no letters, no logos, no watermark.",
    ].join(" "),
    aspectRatio: "2:1",
    resolution: "2K",
  },
};

const USAGE = `usage: bun scripts/generate-image.ts <${Object.keys(IMAGES).join("|")}> [--pay] [--overwrite]  (default: dry run)`;

const args = parseArgs(process.argv.slice(2), IMAGES);
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}

const io: ImageIo = {
  apiKey: process.env.OPENROUTER_API_KEY,
  readLedger: async () => {
    const file = Bun.file(LEDGER_PATH);
    return (await file.exists()) ? await file.text() : "";
  },
  exists: (path) => Bun.file(path).exists(),
  callApi: async (body) => {
    // La clé n'est lue qu'ici : generateImage refuse avant tout appel si elle est absente.
    const response = await fetch(SEEDREAM.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  },
  writeFile: async (path, data) => {
    await Bun.write(path, data);
  },
  appendLedgerLine: async (line) => {
    await mkdir("assets", { recursive: true });
    await appendFile(LEDGER_PATH, line);
  },
  now: () => new Date(),
  info: (text) => console.info(text),
  error: (text) => console.error(text),
};

const result = await generateImage({ name: args.track, spec: IMAGES[args.track]!, pay: args.pay, overwrite: args.overwrite }, io);
process.exit(result.exitCode);
```

`scripts/og/og.html` :

```html
<!doctype html>
<!-- Image de partage (spec 4.7) : fond Seedream, logo et texte posés avec nos polices. Capturée à 1200 × 630 par
     scripts/build-og.sh (Chrome sans écran). Fond : ?bg=<chemin relatif à cette page>, sinon le vide seul. -->
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <style>
      @font-face {
        font-family: "Big Shoulders Display";
        src: url("../../public/fonts/big-shoulders-display-900.woff2") format("woff2");
        font-weight: 900;
      }
      @font-face {
        font-family: "Martian Mono";
        src: url("../../public/fonts/martian-mono-300-400.woff2") format("woff2");
        font-weight: 300 400;
      }
      * {
        margin: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 1200px;
        height: 630px;
        overflow: hidden;
        background: #0d111b;
      }
      .card {
        position: relative;
        width: 1200px;
        height: 630px;
        background: #0d111b center / cover no-repeat;
        display: grid;
        align-content: center;
        padding: 0 88px;
      }
      /* Le vide monte de la gauche : le logo reste lisible sur n'importe quel fond. */
      .card::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgb(13 17 27 / 0.94) 0%, rgb(13 17 27 / 0.75) 42%, rgb(13 17 27 / 0) 78%);
      }
      .content {
        position: relative;
        display: grid;
        gap: 26px;
      }
      .logo {
        font-family: "Big Shoulders Display", sans-serif;
        font-weight: 900;
        font-size: 190px;
        line-height: 0.8;
        letter-spacing: -0.01em;
        color: #ecebe7;
      }
      .logo span {
        display: block;
        color: #d97757;
        text-shadow: 0 0 40px rgb(217 119 87 / 0.5);
      }
      .label {
        font-family: "Martian Mono", monospace;
        font-weight: 400;
        font-size: 19px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #c9cbd0;
      }
      .label.small {
        font-weight: 300;
        font-size: 15px;
        color: #7c8394;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="content">
        <div class="logo">AGENT<span>HOT</span></div>
        <p class="label">Le temps n'avance que quand tu bouges</p>
        <p class="label small">Un FPS dans le navigateur · Made with Claude Opus 5.5</p>
      </div>
    </div>
    <script>
      const bg = new URLSearchParams(location.search).get("bg");
      if (bg) document.querySelector(".card").style.backgroundImage = `url("${bg}")`;
    </script>
  </body>
</html>
```

`scripts/build-og.sh` :

```sh
#!/bin/zsh
# Image de partage (spec 4.7) : capture scripts/og/og.html à 1200 × 630 avec Chrome sans écran, puis JPEG de moins
# de 300 Ko (limite la plus stricte des plateformes, brief plan 3 section 7).
# Usage : zsh scripts/build-og.sh <fond relatif à scripts/og/> <sortie.jpg>
#   ex. : zsh scripts/build-og.sh ../../assets/images/og-background.png public/og-v1.jpg
set -euo pipefail
ROOT=${0:A:h:h}
BG=${1:?background path, relative to scripts/og/}
OUT=${2:?output jpg}
# Un fond introuvable donnerait une image vide sans erreur : on refuse.
[[ -f "$ROOT/scripts/og/$BG" ]] || { echo "background not found: scripts/og/$BG" >&2; exit 1; }
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WORK=$(mktemp -d)
# La page pose le fond en « cover » (2:1 recadré en 1200 × 630) et le texte par-dessus.
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=3000 --screenshot="$WORK/og.png" "file://$ROOT/scripts/og/og.html?bg=$BG" 2>/dev/null
# Qualité réduite pas à pas jusqu'à passer sous 300 Ko (JPEG, 4:2:0).
for q in 3 4 5 6 8 10; do
  ffmpeg -loglevel error -y -i "$WORK/og.png" -q:v $q -pix_fmt yuvj420p "$ROOT/$OUT"
  size=$(stat -f %z "$ROOT/$OUT")
  (( size < 300000 )) && break
done
ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$ROOT/$OUT"
echo "$OUT: $size bytes (q=$q)"
trash "$WORK"
```

```diff
diff --git a/scripts/lyria.ts b/scripts/lyria.ts
index d3b6d98..912e18c 100644
--- a/scripts/lyria.ts
+++ b/scripts/lyria.ts
@@ -85,7 +85,7 @@ export type ParsedArgs = { ok: true; track: string; pay: boolean; overwrite: boo
 // Arguments du script, en échec fermé : seul `--pay` ouvre le chemin payant. Sans lui, la piste seule (ou avec
 // `--dry-run`, toujours accepté) est un essai à blanc. `--overwrite` autorise à écraser un fichier existant.
 // Un drapeau inconnu, répété, ou `--pay` avec `--dry-run` (contradiction) est refusé.
-export function parseArgs(args: readonly string[], tracks: Record<string, string>): ParsedArgs {
+export function parseArgs(args: readonly string[], tracks: Readonly<Record<string, unknown>>): ParsedArgs {
   const [track, ...flags] = args;
   if (track === undefined || !Object.hasOwn(tracks, track)) return { ok: false, error: `unknown or missing track: ${track ?? "(none)"}` };
   let pay = false;
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t2-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t2-typecheck.log`
Expected : `252 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : essais gratuits**

1. Essai à blanc, sans clé : `cd /Users/recarnot/dev/claudehot-videogame && env -u OPENROUTER_API_KEY bun scripts/generate-image.ts og-background` → affiche la requête (`"aspect_ratio": "2:1"`, `"resolution": "2K"`) et `dry run: nothing was called or spent`, code 0.
2. Arguments contradictoires : `bun scripts/generate-image.ts og-background --pay --dry-run` → refus, code 1.
3. Image de partage sur un fond bruité (pire cas pour le poids), dans un dossier jetable :
   `cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -f lavfi -i "color=c=0x3a4a6a:s=2048x1024,noise=alls=100:allf=t" -frames:v 1 assets/images/og-test-noise.png && zsh scripts/build-og.sh ../../assets/images/og-test-noise.png .superpowers/og-test.jpg`
   Expected : `1200,630` puis `.superpowers/og-test.jpg: … bytes (q=…)` sous 300 000 (prototype : 278 953 octets, q=4). Regarder l'image (Read) : logo AGENTHOT, « HOT » en orange, deux lignes de texte en Martian Mono.
4. Fond absent : `zsh scripts/build-og.sh ../../assets/images/nothing.png .superpowers/og-test.jpg` → `background not found`, code 1.
5. `trash assets/images/og-test-noise.png .superpowers/og-test.jpg`.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/seedream.ts scripts/generate-image.ts scripts/og/og.html scripts/build-og.sh scripts/lyria.ts tests/seedream.test.ts && git commit -m "feat(assets): Seedream image script and share image builder"
```

---

### Task 3 : journal des dépenses (Nano Banana, plafonds du go, résumé AC-17)

Le MCP Nano Banana ne renvoie pas le coût : sa ligne est écrite par `spend.ts log-nanobanana`, au prix de la grille (brief section 3 : Nano Banana 2 en 1K = 0,067 $). `spend.ts check` contrôle, avant tout appel payant, le total de l'outil face au budget de la spec et au plafond du go. `spend.ts summary` donne les totaux d'AC-17.

**Files :**
- Create : `scripts/ledger.ts`, `scripts/spend.ts`, `tests/ledger.test.ts`

**Interfaces :**
- Consumes : `LYRIA`, `LedgerEntry`, `spentUsd`, `LEDGER_PATH` (`scripts/lyria.ts`) ; `SEEDREAM` (tâche 2).
- Produces (utilisés aux tâches 6, 8, 12) :
  - `bun scripts/spend.ts check <lyria|seedream|nanobanana> <coût $> [<plafond $>]` : code 0 si ça passe, code 2 sinon ;
  - `bun scripts/spend.ts log-nanobanana <512px|1K|2K|4K> <image> <fichier du prompt>` : une ligne au journal ;
  - `bun scripts/spend.ts summary` : totaux par outil, code 1 si un outil dépasse son budget.

- [ ] **Step 1 : écrire les tests**

`tests/ledger.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { BUDGETS, NANO_BANANA, checkSpend, ledgerSummary, nanoBananaEntry, parseSpendArgs } from "../scripts/ledger";

const line = (tool: string, costUsd: number) => JSON.stringify({ date: "2026-09-30", tool, model: "m", prompt: "p", output: "o", costUsd });
const LEDGER = [line("lyria", 0.08), line("lyria", 0.08), "", line("nanobanana", 0.067)].join("\n");

describe("journal des dépenses : totaux par outil (spec 8, AC-17)", () => {
  test("les trois outils de la spec apparaissent, même sans appel, avec leur budget", () => {
    const rows = ledgerSummary(LEDGER);
    expect(rows.map((r) => r.tool)).toEqual(["lyria", "nanobanana", "seedream"]);
    expect(rows[0]).toMatchObject({ calls: 2, budgetUsd: 3 });
    expect(rows[0]!.spentUsd).toBeCloseTo(0.16, 9);
    expect(rows[1]).toMatchObject({ calls: 1, spentUsd: 0.067, budgetUsd: 2.5 });
    expect(rows[2]).toMatchObject({ calls: 0, spentUsd: 0, budgetUsd: 3 });
  });

  test("un outil hors spec est montré sans budget, pas compté comme gratuit", () => {
    const rows = ledgerSummary(`${LEDGER}\n${line("mystery", 1)}`);
    expect(rows.find((r) => r.tool === "mystery")).toEqual({ tool: "mystery", calls: 1, spentUsd: 1, budgetUsd: null });
  });

  test("les budgets sont ceux de la spec 8", () => {
    expect(BUDGETS).toEqual({ lyria: 3, seedream: 3, nanobanana: 2.5 });
  });
});

describe("journal des dépenses : contrôle avant un appel payant", () => {
  test("sans plafond, seul le budget de la spec compte", () => {
    expect(checkSpend(LEDGER, "lyria", 0.08, null)).toMatchObject({ ok: true, limitUsd: 3 });
    expect(checkSpend(`${line("seedream", 2.95)}\n`, "seedream", 0.09, null).ok).toBe(false);
  });

  test("le plafond du go s'applique au total de l'outil : 0,16 $ déjà dépensés + 4 essais à 0,08 $ tiennent dans 0,48 $, pas un 5e", () => {
    let ledger = LEDGER;
    for (let i = 0; i < 4; i++) {
      expect(checkSpend(ledger, "lyria", 0.08, 0.48).ok).toBe(true);
      ledger += `\n${line("lyria", 0.08)}`;
    }
    expect(checkSpend(ledger, "lyria", 0.08, 0.48)).toMatchObject({ ok: false, limitUsd: 0.48 });
  });

  test("Nano Banana 2 en 1K : 5 images tiennent dans 0,40 $, pas une 6e", () => {
    let ledger = "";
    for (let i = 0; i < 5; i++) {
      expect(checkSpend(ledger, "nanobanana", NANO_BANANA.costUsd["1K"], 0.4).ok).toBe(true);
      ledger += `${line("nanobanana", NANO_BANANA.costUsd["1K"])}\n`;
    }
    expect(checkSpend(ledger, "nanobanana", NANO_BANANA.costUsd["1K"], 0.4).ok).toBe(false);
  });

  test("un plafond plus haut que le budget de la spec ne l'élargit pas", () => {
    expect(checkSpend(`${line("nanobanana", 2.45)}\n`, "nanobanana", 0.067, 10)).toMatchObject({ ok: false, limitUsd: 2.5 });
  });
});

describe("journal des dépenses : ligne Nano Banana et arguments", () => {
  test("la ligne porte l'outil, le modèle et le coût de la grille pour la résolution", () => {
    const entry = nanoBananaEntry(new Date("2026-09-30T10:00:00Z"), "1K", "assets/images/room-01.png", "a server room");
    expect(entry).toEqual({
      date: "2026-09-30T10:00:00.000Z",
      tool: "nanobanana",
      model: "gemini-3.1-flash-image-preview",
      prompt: "a server room",
      output: "assets/images/room-01.png",
      costUsd: 0.067,
    });
  });

  test("commandes valides", () => {
    expect(parseSpendArgs(["summary"])).toEqual({ ok: true, command: { kind: "summary" } });
    expect(parseSpendArgs(["check", "lyria", "0.08", "0.48"])).toEqual({ ok: true, command: { kind: "check", tool: "lyria", costUsd: 0.08, capUsd: 0.48 } });
    expect(parseSpendArgs(["check", "seedream", "0.09"])).toEqual({ ok: true, command: { kind: "check", tool: "seedream", costUsd: 0.09, capUsd: null } });
    expect(parseSpendArgs(["log-nanobanana", "1K", "assets/images/room-01.png", "assets/prompts/room-01.txt"])).toEqual({
      ok: true,
      command: { kind: "log-nanobanana", resolution: "1K", output: "assets/images/room-01.png", promptFile: "assets/prompts/room-01.txt" },
    });
  });

  test("tout le reste est refusé : outil hors spec, montant mal écrit, résolution inconnue, argument en trop", () => {
    for (const args of [
      [],
      ["summary", "x"],
      ["check", "gpt", "0.1"],
      ["check", "lyria"],
      ["check", "lyria", "-0.08"],
      ["check", "lyria", "0,08"],
      ["check", "lyria", "abc"],
      ["check", "lyria", "0.08", "NaN"],
      ["check", "lyria", "0.08", "0.48", "x"],
      ["check", "toString", "0.08"],
      ["log-nanobanana", "1k", "a.png", "p.txt"],
      ["log-nanobanana", "1K", "a.png"],
      ["pay"],
    ]) {
      expect(parseSpendArgs(args).ok).toBe(false);
    }
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/ledger.test.ts 2>&1 | tee .superpowers/plan-3b-t3-red.log`
Expected : `Cannot find module '../scripts/ledger'`, 1 fail.

- [ ] **Step 3 : écrire le code**

`scripts/ledger.ts` :

```ts
// Journal des dépenses (spec 8, AC-17) : totaux par outil, contrôle avant un appel payant, ligne d'un appel
// Nano Banana. Lyria et Seedream écrivent leur ligne eux-mêmes (generate-music.ts, generate-image.ts).
import { LYRIA, type LedgerEntry, spentUsd } from "./lyria";
import { SEEDREAM } from "./seedream";

// Nano Banana passe par le MCP erom-image, qui ne renvoie pas le coût : on journalise celui de la grille
// (https://ai.google.dev/gemini-api/docs/pricing, mise à jour du 2026-09-24, brief plan 3 section 3).
export const NANO_BANANA = {
  ledgerTool: "nanobanana",
  model: "gemini-3.1-flash-image-preview",
  costUsd: { "512px": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151 },
  // Budget Nano Banana de la spec 8.
  budgetUsd: 2.5,
} as const;

export type NanoBananaResolution = keyof typeof NANO_BANANA.costUsd;

// Budgets de la spec 8, par outil du journal.
export const BUDGETS: Readonly<Record<string, number>> = {
  [LYRIA.ledgerTool]: LYRIA.budgetUsd,
  [SEEDREAM.ledgerTool]: SEEDREAM.budgetUsd,
  [NANO_BANANA.ledgerTool]: NANO_BANANA.budgetUsd,
};

export interface ToolSpend {
  tool: string;
  calls: number;
  spentUsd: number;
  // Null : outil absent de la spec 8 (à signaler, pas à compter comme gratuit).
  budgetUsd: number | null;
}

// Totaux par outil : les trois outils de la spec, même sans appel, puis tout autre outil trouvé dans le journal.
export function ledgerSummary(ledgerText: string): ToolSpend[] {
  const calls = new Map<string, number>();
  for (const tool of Object.keys(BUDGETS)) calls.set(tool, 0);
  for (const line of ledgerText.split("\n")) {
    if (line.trim() === "") continue;
    const entry = JSON.parse(line) as LedgerEntry;
    calls.set(entry.tool, (calls.get(entry.tool) ?? 0) + 1);
  }
  return [...calls.keys()].sort().map((tool) => ({
    tool,
    calls: calls.get(tool)!,
    spentUsd: spentUsd(ledgerText, tool),
    budgetUsd: BUDGETS[tool] ?? null,
  }));
}

// Contrôle avant un appel payant : le total de l'outil plus le coût doit rester sous le budget de la spec 8, et sous
// le plafond du « go » de Romain quand il est donné (total de l'outil dans le journal, pas seulement ce chantier).
export function checkSpend(ledgerText: string, tool: string, costUsd: number, capUsd: number | null): { ok: boolean; spentUsd: number; limitUsd: number } {
  const spent = spentUsd(ledgerText, tool);
  const limitUsd = Math.min(BUDGETS[tool] ?? 0, capUsd ?? Number.POSITIVE_INFINITY);
  return { ok: spent + costUsd <= limitUsd + 1e-9, spentUsd: spent, limitUsd };
}

// Ligne du journal d'un appel Nano Banana, au coût de la grille.
export function nanoBananaEntry(date: Date, resolution: NanoBananaResolution, output: string, prompt: string): LedgerEntry {
  return { date: date.toISOString(), tool: NANO_BANANA.ledgerTool, model: NANO_BANANA.model, prompt, output, costUsd: NANO_BANANA.costUsd[resolution] };
}

export type SpendCommand =
  | { kind: "summary" }
  | { kind: "check"; tool: string; costUsd: number; capUsd: number | null }
  | { kind: "log-nanobanana"; resolution: NanoBananaResolution; output: string; promptFile: string };

// Montant en dollars écrit en clair (« 0.067 ») : tout le reste est refusé.
function parseUsd(text: string | undefined): number | null {
  if (text === undefined || !/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

// Arguments de scripts/spend.ts, en échec fermé : une commande inconnue, un outil hors spec, un montant mal écrit
// ou un argument en trop sont refusés.
export function parseSpendArgs(args: readonly string[]): { ok: true; command: SpendCommand } | { ok: false; error: string } {
  const [kind, ...rest] = args;
  if (kind === "summary" && rest.length === 0) return { ok: true, command: { kind } };
  if (kind === "check" && (rest.length === 2 || rest.length === 3)) {
    const [tool, cost, cap] = rest;
    if (!Object.hasOwn(BUDGETS, tool!)) return { ok: false, error: `unknown tool: ${tool}` };
    const costUsd = parseUsd(cost);
    const capUsd = cap === undefined ? null : parseUsd(cap);
    if (costUsd === null || (cap !== undefined && capUsd === null)) return { ok: false, error: "amounts are plain dollars, e.g. 0.067" };
    return { ok: true, command: { kind, tool: tool!, costUsd, capUsd } };
  }
  if (kind === "log-nanobanana" && rest.length === 3) {
    const [resolution, output, promptFile] = rest as [string, string, string];
    if (!Object.hasOwn(NANO_BANANA.costUsd, resolution)) return { ok: false, error: `unknown resolution: ${resolution}` };
    return { ok: true, command: { kind, resolution: resolution as NanoBananaResolution, output, promptFile } };
  }
  return { ok: false, error: `unknown command or wrong arguments: ${args.join(" ") || "(none)"}` };
}
```

`scripts/spend.ts` :

```ts
// Journal des dépenses (spec 8, AC-17). Usage :
//   bun scripts/spend.ts summary
//       total par outil face au budget de la spec ; code 1 si un outil dépasse
//   bun scripts/spend.ts check <lyria|seedream|nanobanana> <coût $> [<plafond $>]
//       avant un appel payant : code 0 s'il passe, code 2 sinon (demander à Romain)
//   bun scripts/spend.ts log-nanobanana <512px|1K|2K|4K> <image> <fichier du prompt>
//       juste après un appel Nano Banana (MCP erom-image, qui ne renvoie pas le coût) : ajoute sa ligne au journal
import { appendFile } from "node:fs/promises";
import { checkSpend, ledgerSummary, nanoBananaEntry, parseSpendArgs } from "./ledger";
import { LEDGER_PATH } from "./lyria";

const USAGE = "usage: bun scripts/spend.ts summary | check <tool> <costUsd> [<capUsd>] | log-nanobanana <resolution> <image> <promptFile>";

const args = parseSpendArgs(process.argv.slice(2));
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}
const ledgerFile = Bun.file(LEDGER_PATH);
const ledgerText = (await ledgerFile.exists()) ? await ledgerFile.text() : "";
const command = args.command;

if (command.kind === "summary") {
  let over = false;
  for (const row of ledgerSummary(ledgerText)) {
    const budget = row.budgetUsd === null ? "no budget in spec 8" : `${row.budgetUsd.toFixed(2)} $`;
    const status = row.budgetUsd === null ? "CHECK" : row.spentUsd <= row.budgetUsd + 1e-9 ? "ok" : "OVER";
    if (status !== "ok") over = true;
    console.info(`${row.tool.padEnd(11)} ${String(row.calls).padStart(3)} calls  ${row.spentUsd.toFixed(3)} $ / ${budget}  ${status}`);
  }
  process.exit(over ? 1 : 0);
} else if (command.kind === "check") {
  const result = checkSpend(ledgerText, command.tool, command.costUsd, command.capUsd);
  const line = `${command.tool}: ${result.spentUsd.toFixed(3)} $ spent + ${command.costUsd} $ ${result.ok ? "<=" : ">"} ${result.limitUsd.toFixed(3)} $`;
  if (result.ok) console.info(`${line}: ok`);
  else console.error(`${line}: STOP, ask Romain for a new go.`);
  process.exit(result.ok ? 0 : 2);
} else {
  const promptFile = Bun.file(command.promptFile);
  if (!(await promptFile.exists())) {
    console.error(`prompt file not found: ${command.promptFile}`);
    process.exit(1);
  }
  const prompt = (await promptFile.text()).trim();
  // L'appel a déjà eu lieu : la ligne s'écrit même si l'image manque (il est peut-être facturé), avec un avertissement.
  if (!(await Bun.file(command.output).exists())) console.warn(`WARNING: ${command.output} does not exist; the line is logged anyway.`);
  const entry = nanoBananaEntry(new Date(), command.resolution, command.output, prompt);
  await appendFile(LEDGER_PATH, `${JSON.stringify(entry)}\n`);
  console.info(`logged nanobanana ${command.resolution} ${entry.costUsd} $ -> ${command.output}`);
}
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t3-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t3-typecheck.log`
Expected : `262 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : essais sur le vrai journal (lecture seule)**

```bash
cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts summary; echo "exit=$?"; bun scripts/spend.ts check lyria 0.08 0.48; echo "exit=$?"; bun scripts/spend.ts check lyria 0.40 0.48; echo "exit=$?"; bun scripts/spend.ts check gpt 1; echo "exit=$?"
```

Expected (journal du plan 2) :
```
lyria         2 calls  0.160 $ / 3.00 $  ok
nanobanana    0 calls  0.000 $ / 2.50 $  ok
seedream      0 calls  0.000 $ / 3.00 $  ok
exit=0
lyria: 0.160 $ spent + 0.08 $ <= 0.480 $: ok
exit=0
lyria: 0.160 $ spent + 0.4 $ > 0.480 $: STOP, ask Romain for a new go.
exit=2
unknown tool: gpt
…
exit=1
```

Ne pas lancer `log-nanobanana` ici : il écrit dans le vrai journal.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/ledger.ts scripts/spend.ts tests/ledger.test.ts && git commit -m "feat(assets): spend ledger tool with go caps and Nano Banana logging"
```

---

### Task 4 : pistes Lyria du menu et de l'intro

Deux pistes de plus dans `generate-music.ts` : `menu` (boucle tech et punchy, même tonalité que la piste du jeu, énergie constante, dernière mesure qui retombe sur la première) et `intro` (environ 28 s : montée, gel du temps, drop, impact final ; elle mène le montage de la cinématique). Chaque piste a son dossier : `public/audio` pour ce que le jeu charge, `assets/audio` pour l'intro. Les prompts de `game` et `replay` ne changent pas d'un octet (vérifié contre le journal).

**Files :**
- Modify : `scripts/lyria.ts` (option `dir`), `scripts/generate-music.ts` (table `TRACKS` avec dossier), `tests/lyria.test.ts`

**Interfaces :**
- Consumes : `generateTrack(opts, io)` (plan 2).
- Produces : `GenerationOptions.dir?: string` (défaut `public/audio`) ; `bun scripts/generate-music.ts <game|replay|menu|intro> [--pay] [--overwrite]` → `public/audio/menu.mp3`, `assets/audio/intro.mp3` (tâche 6).

- [ ] **Step 1 : écrire les tests**

```diff
diff --git a/tests/lyria.test.ts b/tests/lyria.test.ts
index 53a8725..a577174 100644
--- a/tests/lyria.test.ts
+++ b/tests/lyria.test.ts
@@ -235,4 +235,20 @@ describe("génération musicale : garde-fous avant un appel payant (plan 2, corr
     expect(await generateTrack(OPTIONS, io)).toEqual({ outcome: "no-api-key", exitCode: 1 });
     expect(events).toEqual([]);
   });
+
+  test("un morceau de la cinématique s'écrit dans son dossier, hors de ce que le jeu sert (plan 3b)", async () => {
+    const { io, events, ledger } = fakeIo();
+    const intro = { ...OPTIONS, track: "intro", dir: "assets/audio" };
+    expect(await generateTrack(intro, io)).toEqual({ outcome: "written", exitCode: 0 });
+    expect(events).toContain("write:assets/audio/intro.mp3");
+    expect(events.some((e) => e.startsWith("write:public/audio/"))).toBe(false);
+    expect(JSON.parse(ledger[0]!).output).toBe("assets/audio/intro.mp3");
+  });
+
+  test("le fichier existant est cherché dans le dossier du morceau", async () => {
+    const intro = { ...OPTIONS, track: "intro", dir: "assets/audio" };
+    const { io, events } = fakeIo({ existing: ["assets/audio/intro.mp3"] });
+    expect(await generateTrack(intro, io)).toEqual({ outcome: "exists", exitCode: 1 });
+    expect(events).toEqual([]);
+  });
 });
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/lyria.test.ts 2>&1 | tee .superpowers/plan-3b-t4-red.log | tail -4`
Expected : `25 pass`, `2 fail` (`toContain` sur `write:assets/audio/intro.mp3`, `toEqual` sur `exists`).

- [ ] **Step 3 : écrire le code**

```diff
diff --git a/scripts/generate-music.ts b/scripts/generate-music.ts
index 20b18c3..555cb43 100644
--- a/scripts/generate-music.ts
+++ b/scripts/generate-music.ts
@@ -1,33 +1,76 @@
 // Génère un morceau avec Lyria 3.5 (spec 7.2 et 8). Usage :
-//   bun scripts/generate-music.ts <game|replay> [--pay] [--overwrite]
+//   bun scripts/generate-music.ts <game|replay|menu|intro> [--pay] [--overwrite]
 // Par défaut c'est un essai à blanc : il affiche la requête et le budget sans rien appeler ni dépenser
 // (`--dry-run` reste accepté). Seul `--pay` déclenche un appel réel, facturé 0,08 $.
-// `--overwrite` est nécessaire pour remplacer un public/audio/<piste>.mp3 existant : sans lui, le script
+// `--overwrite` est nécessaire pour remplacer un <dossier>/<piste>.mp3 existant : sans lui, le script
 // refuse avant d'appeler. Toute autre combinaison d'arguments est refusée (échec fermé).
 // Chaque vraie génération ajoute une ligne à assets/ledger.jsonl, juste après la réponse payée.
 import { appendFile, mkdir } from "node:fs/promises";
 import { LEDGER_PATH, type GenerationIo, LYRIA, generateTrack, parseArgs } from "./lyria";
 
+interface TrackSpec {
+  // Dossier du fichier : public/audio pour ce que le jeu charge ; assets/audio pour la cinématique (mixée dans la
+  // vidéo, jamais servie par le jeu).
+  dir: string;
+  prompt: string;
+}
+
 // Prompts en anglais (langue de travail de Lyria). Aucun nom d'artiste : les filtres de Lyria les bloquent.
-const TRACKS: Record<string, string> = {
-  game: [
-    "Instrumental only, no vocals.",
-    "Tense, pulsing dark electronic track for a first-person action game where time only moves when you move.",
-    "120 BPM, D minor. Punchy sub-bass pulse on every beat, tight ticking hi-hats, cold metallic stabs, a restless analog synth arpeggio.",
-    "Designed to be slowed down: a clear low-end pulse and no silent gaps, so it stays menacing at half speed.",
-    "[0:00 - 0:08] Intro: pulse and ticking only.",
-    "[0:08 - 1:20] Main groove: full drums, bass and arpeggio, steady energy, no breakdown.",
-    "[1:20 - 1:30] Outro that flows straight back into the main groove, for a clean loop.",
-  ].join(" "),
-  replay: [
-    "Heavy, slow, triumphant electronic track for an action movie slow-motion replay.",
-    "120 BPM with a huge hit on every beat, E minor. Massive distorted drums, sub drops, glitchy synth stabs.",
-    "Vocals: a deep, processed robotic male voice shouts only two words, alternating on each strong beat:",
-    "\"AGENT... HOT... AGENT... HOT...\", repeated through the whole track. No other lyrics.",
-    "[0:00 - 0:04] Single impact hit.",
-    "[0:04 - 1:00] Chant over full drums.",
-    "[1:00 - 1:10] Final hit and decay.",
-  ].join(" "),
+const TRACKS: Record<string, TrackSpec> = {
+  game: {
+    dir: "public/audio",
+    prompt: [
+      "Instrumental only, no vocals.",
+      "Tense, pulsing dark electronic track for a first-person action game where time only moves when you move.",
+      "120 BPM, D minor. Punchy sub-bass pulse on every beat, tight ticking hi-hats, cold metallic stabs, a restless analog synth arpeggio.",
+      "Designed to be slowed down: a clear low-end pulse and no silent gaps, so it stays menacing at half speed.",
+      "[0:00 - 0:08] Intro: pulse and ticking only.",
+      "[0:08 - 1:20] Main groove: full drums, bass and arpeggio, steady energy, no breakdown.",
+      "[1:20 - 1:30] Outro that flows straight back into the main groove, for a clean loop.",
+    ].join(" "),
+  },
+  replay: {
+    dir: "public/audio",
+    prompt: [
+      "Heavy, slow, triumphant electronic track for an action movie slow-motion replay.",
+      "120 BPM with a huge hit on every beat, E minor. Massive distorted drums, sub drops, glitchy synth stabs.",
+      "Vocals: a deep, processed robotic male voice shouts only two words, alternating on each strong beat:",
+      "\"AGENT... HOT... AGENT... HOT...\", repeated through the whole track. No other lyrics.",
+      "[0:00 - 0:04] Single impact hit.",
+      "[0:04 - 1:00] Chant over full drums.",
+      "[1:00 - 1:10] Final hit and decay.",
+    ].join(" "),
+  },
+  // Boucle du menu (spec 4.3 et 7.2) : même tonalité et même tempo que la piste du jeu, énergie constante, et une
+  // dernière mesure qui retombe sur la première (la jointure se mesure ensuite, plan 3b).
+  menu: {
+    dir: "public/audio",
+    prompt: [
+      "Instrumental only, no vocals.",
+      "Ultra tech, punchy electronic loop for the main menu of a first-person action game where time only moves when you move.",
+      "120 BPM, D minor. Tight punchy kick, crisp ticking hi-hats, deep sub-bass pulse, cold metallic plucks,",
+      "a hypnotic synth arpeggio, subtle glitch accents.",
+      "Steady, confident energy that makes you want to press Play: no build-up, no breakdown, no drop, no silence.",
+      "[0:00 - 0:04] The groove is already running: kick, hats and bass from the very first beat.",
+      "[0:04 - 1:00] Main groove, the arpeggio evolving slowly, same energy throughout.",
+      "[1:00 - 1:04] The last bar leads straight back into the first beat, for a seamless loop.",
+    ].join(" "),
+  },
+  // Morceau de la cinématique (spec 4.2) : il mène le montage Hyperframes (route music-to-video). Montée, gel du
+  // temps, drop, impact final : l'histoire du jeu en 28 secondes.
+  intro: {
+    dir: "assets/audio",
+    prompt: [
+      "Instrumental only, no vocals.",
+      "Ultra tech, punchy cinematic trailer cue for a first-person action game where time only moves when you move.",
+      "120 BPM, D minor. Hard-hitting modern electronic sound design: distorted sub-bass, huge punchy drums,",
+      "glitch stabs, metallic risers, ticking clock textures.",
+      "[0:00 - 0:08] Build: a ticking clock pulse and a filtered synth arpeggio rise in tension.",
+      "[0:08 - 0:12] Freeze: everything suddenly stops except one suspended high tone, as if time froze.",
+      "[0:12 - 0:24] Drop: massive drums, distorted sub-bass and glitch stabs, full energy.",
+      "[0:24 - 0:28] Final impact: one huge hit, then a short decay to silence.",
+    ].join(" "),
+  },
 };
 
 const USAGE = `usage: bun scripts/generate-music.ts <${Object.keys(TRACKS).join("|")}> [--pay] [--overwrite]  (default: dry run)`;
@@ -67,5 +110,6 @@ const io: GenerationIo = {
   error: (text) => console.error(text),
 };
 
-const result = await generateTrack({ track: args.track, prompt: TRACKS[args.track]!, pay: args.pay, overwrite: args.overwrite }, io);
+const spec = TRACKS[args.track]!;
+const result = await generateTrack({ track: args.track, prompt: spec.prompt, dir: spec.dir, pay: args.pay, overwrite: args.overwrite }, io);
 process.exit(result.exitCode);
diff --git a/scripts/lyria.ts b/scripts/lyria.ts
index 912e18c..ba016b3 100644
--- a/scripts/lyria.ts
+++ b/scripts/lyria.ts
@@ -144,6 +144,8 @@ export interface GenerationOptions {
   // Faux : essai à blanc, aucun appel. Vrai : appel réel et facturé.
   pay: boolean;
   overwrite: boolean;
+  // Dossier du morceau : public/audio pour ceux que le jeu charge (par défaut), un autre pour la cinématique.
+  dir?: string;
 }
 
 export type Outcome =
@@ -173,7 +175,8 @@ export async function generateTrack(opts: GenerationOptions, io: GenerationIo):
   if (!canAfford(ledgerText, LYRIA.ledgerTool, LYRIA.costUsd, LYRIA.budgetUsd)) return overBudget();
 
   const body: LyriaBody = { model: LYRIA.model, input: prompt, response_format: { type: "audio" } };
-  const mp3Path = `public/audio/${track}.mp3`;
+  const dir = opts.dir ?? "public/audio";
+  const mp3Path = `${dir}/${track}.mp3`;
   const alreadyThere = await io.exists(mp3Path);
   io.info(`track ${track} · spent ${spent.toFixed(2)} $ of ${LYRIA.budgetUsd} $ · this call ${LYRIA.costUsd} $`);
   if (!opts.pay) {
@@ -210,7 +213,7 @@ export async function generateTrack(opts: GenerationOptions, io: GenerationIo):
     parsed = false;
   }
   const audio = parsed ? findAudio(json) : null;
-  const output = audio ? `public/audio/${track}.${audioExtension(audio.mimeType)}` : rawPath;
+  const output = audio ? `${dir}/${track}.${audioExtension(audio.mimeType)}` : rawPath;
 
   // HTTP 2xx : l'appel est facturé, même sans audio exploitable. Journal d'abord, fichiers ensuite.
   let ledgerError: unknown;
@@ -246,6 +249,6 @@ export async function generateTrack(opts: GenerationOptions, io: GenerationIo):
   }
   await io.writeFile(output, Buffer.from(audio.data, "base64"));
   io.info(`wrote ${output} (${audio.mimeType}) · ledger ${(spent + LYRIA.costUsd).toFixed(2)} $`);
-  if (!output.endsWith(".mp3")) io.warn(`the game loads /audio/${track}.mp3: convert ${output} before playing`);
+  if (!output.endsWith(".mp3")) io.warn(`${mp3Path} is expected: convert ${output} before using it`);
   return { outcome: "written", exitCode: 0 };
 }
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t4-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t4-typecheck.log`
Expected : `264 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : essais à blanc, et prompts historiques intacts**

```bash
cd /Users/recarnot/dev/claudehot-videogame && bun scripts/generate-music.ts menu | head -1 && bun scripts/generate-music.ts intro | head -1 && for t in game replay; do bun scripts/generate-music.ts $t | python3 -c "
import sys,json
txt=sys.stdin.read(); body=json.loads(txt[txt.index('{'):txt.rindex('}')+1])
led=[json.loads(l) for l in open('assets/ledger.jsonl') if l.strip()]
print('$t prompt unchanged:', any(e['prompt']==body['input'] for e in led))"; done
```

Expected : `track menu · spent 0.16 $ of 3 $ · this call 0.08 $`, idem `intro`, puis `game prompt unchanged: True` et `replay prompt unchanged: True`.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/lyria.ts scripts/generate-music.ts tests/lyria.test.ts && git commit -m "feat(music): menu and intro Lyria tracks, one folder per track"
```

---

### Task 5 : outil de mesure de boucle et boucle coupée sur la mesure

Les morceaux Lyria portent du silence en tête et en fin, et ne tiennent pas le tempo demandé (`game.mp3` : demandé à 120 BPM, mesuré à 130). La boucle du menu dure donc un nombre entier de mesures au tempo mesuré, et démarre 30 ms avant un temps fort (le pointage des temps est à ±23 ms près). `bun scripts/measure-loop.ts` lit les silences (ffmpeg `silencedetect`, mêmes réglages qu'au plan 2) et la grille des temps (`analyze-beatgrid.py` du plugin Hyperframes), et affiche la constante à recopier.

**Files :**
- Create : `scripts/loop-measure.ts`, `scripts/measure-loop.ts`, `tests/loop-measure.test.ts`
- Modify : `src/audio/music.ts` (`BarMeasure`, `barLoop`, placés avant la table `PLAYBACK`, qui les utilisera à la tâche 7), `tests/music-loop.test.ts`

**Interfaces :**
- Consumes : `MusicPlayback` (`src/audio/music.ts`).
- Produces : `interface BarMeasure { firstDownbeat: number; barSeconds: number; tailSilenceStart: number }` ; `barLoop(m: BarMeasure): MusicPlayback` ; `bun scripts/measure-loop.ts <morceau.mp3> <audiomap.json>` (tâche 7).

- [ ] **Step 1 : écrire les tests**

`tests/loop-measure.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { barMeasure, beatPeriod, parseSilences } from "../scripts/loop-measure";

// Sortie réelle de `ffmpeg -af silencedetect=noise=-50dB:d=0.5` sur public/audio/replay.mp3 (2026-09-30).
const REPLAY_LOG = `[Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 0
[Parsed_silencedetect_0 @ 0x79230a8900] silence_end: 2.691769 | silence_duration: 2.691769
[Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 103.059546
[Parsed_silencedetect_0 @ 0x79230a8900] silence_end: 105.404082 | silence_duration: 2.344535`;

describe("mesure d'une boucle : silences (plan 3b)", () => {
  test("silence de tête et de fin, comme mesurés à la main au plan 2", () => {
    expect(parseSilences(REPLAY_LOG, 105.404042)).toEqual({ headSilenceEnd: 2.691769, tailSilenceStart: 103.059546 });
  });

  test("sans silence de tête ; silence de fin sans ligne de fin (il court jusqu'au bout)", () => {
    expect(parseSilences("[x] silence_start: 89.143537", 91.715875)).toEqual({ headSilenceEnd: 0, tailSilenceStart: 89.143537 });
  });

  test("un silence au milieu du morceau n'est ni la tête ni la fin", () => {
    const log = "silence_start: 40\nsilence_end: 41 | silence_duration: 1";
    expect(parseSilences(log, 60)).toEqual({ headSilenceEnd: 0, tailSilenceStart: 60 });
  });
});

describe("mesure d'une boucle : tempo (plan 3b)", () => {
  test("la durée d'un temps se lit sur tous les temps, malgré le pointage à ±23 ms", () => {
    // 200 temps à 130 BPM, pointés avec une erreur alternée de ±20 ms.
    const period = 60 / 130;
    const beats = Array.from({ length: 200 }, (_, i) => 0.093 + i * period + (i % 2 === 0 ? 0.02 : -0.02));
    expect(Math.abs(beatPeriod(beats) - period)).toBeLessThan(0.0005);
  });

  test("premier temps fort après le silence de tête, mesure = temps × temps par mesure", () => {
    const period = 0.5;
    const map = {
      tempo: { beats_per_bar: 4 },
      grid: { beats_sec: Array.from({ length: 64 }, (_, i) => 0.4 + i * period), downbeats_sec: [0.4, 2.4, 4.4, 6.4] },
    };
    const m = barMeasure(map, { headSilenceEnd: 2.42, tailSilenceStart: 31 });
    expect(m.firstDownbeat).toBe(2.4);
    expect(m.barSeconds).toBeCloseTo(2, 9);
    expect(m.tailSilenceStart).toBe(31);
  });
});
```

```diff
diff --git a/tests/music-loop.test.ts b/tests/music-loop.test.ts
index 9de1ea8..3903fa9 100644
--- a/tests/music-loop.test.ts
+++ b/tests/music-loop.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, test } from "bun:test";
-import { type TrackName, musicPlayback } from "../src/audio/music";
+import { type TrackName, barLoop, musicPlayback } from "../src/audio/music";
 
 // Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
 //   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
@@ -59,3 +59,30 @@ describe("boucles musicales sans silence (plan 2, correctif 2)", () => {
     expect(p.loopEnd).toBe(2);
   });
 });
+
+describe("boucle coupée sur le temps (plan 3b, boucle du menu)", () => {
+  // Répétition sur game.mp3 (2026-09-30) : analyze-beatgrid.py puis bun scripts/measure-loop.ts. Demandé à 120 BPM,
+  // mesuré à 130 : premier temps fort 0,093 s, mesure 1,846184 s, silence de fin à 89,143537 s.
+  const GAME = { firstDownbeat: 0.093, barSeconds: 1.846184, tailSilenceStart: 89.143537 };
+
+  test("la boucle dure un nombre entier de mesures", () => {
+    const p = barLoop(GAME);
+    const bars = (p.loopEnd - p.loopStart) / GAME.barSeconds;
+    expect(Math.abs(bars - Math.round(bars))).toBeLessThan(1e-9);
+    expect(Math.round(bars)).toBe(48);
+  });
+
+  test("elle part juste avant le premier temps fort et s'arrête avant le silence de fin", () => {
+    const p = barLoop(GAME);
+    expect(p.offset).toBe(p.loopStart);
+    expect(p.loopStart).toBeLessThan(GAME.firstDownbeat);
+    expect(p.loopStart).toBeGreaterThan(GAME.firstDownbeat - 0.05);
+    expect(p.loopEnd).toBeLessThanOrEqual(GAME.tailSilenceStart);
+    // Au plus une mesure de musique laissée de côté à la fin.
+    expect(p.loopEnd).toBeGreaterThan(GAME.tailSilenceStart - GAME.barSeconds);
+  });
+
+  test("un temps fort à l'instant 0 ne fait pas partir la boucle avant le fichier", () => {
+    expect(barLoop({ firstDownbeat: 0.01, barSeconds: 2, tailSilenceStart: 10 }).loopStart).toBe(0);
+  });
+});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/loop-measure.test.ts tests/music-loop.test.ts 2>&1 | tee .superpowers/plan-3b-t5-red.log | tail -4`
Expected : `Cannot find module '../scripts/loop-measure'` et `barLoop` absent de `music.ts` : 2 fail.

- [ ] **Step 3 : écrire le code**

`scripts/loop-measure.ts` :

```ts
// Mesure d'une boucle musicale (spec 7.2) : silences de tête et de fin (ffmpeg silencedetect) et grille des temps
// (analyze-beatgrid.py du plugin Hyperframes). Outils purs de scripts/measure-loop.ts.
import type { BarMeasure } from "../src/audio/music";

export interface Silences {
  // Fin du silence de tête (s), 0 s'il n'y en a pas ; début du silence de fin (s), la durée s'il n'y en a pas.
  headSilenceEnd: number;
  tailSilenceStart: number;
}

// Lit la sortie de `ffmpeg -af silencedetect` : lignes « silence_start: t » et « silence_end: t | ... ».
export function parseSilences(ffmpegLog: string, duration: number): Silences {
  const spans: { start: number; end: number }[] = [];
  for (const match of ffmpegLog.matchAll(/silence_(start|end): (-?[\d.]+)/g)) {
    const t = Number(match[2]);
    if (match[1] === "start") spans.push({ start: t, end: duration });
    else if (spans.length > 0) spans[spans.length - 1]!.end = t;
  }
  const head = spans.find((s) => s.start <= 0.01);
  const tail = spans.findLast((s) => s.end >= duration - 0.05 && s !== head);
  return { headSilenceEnd: head ? head.end : 0, tailSilenceStart: tail ? tail.start : duration };
}

// Durée d'un temps (s) : pente des moindres carrés sur tous les temps pointés. Chaque pointage est à ±23 ms près
// (analyse à 22 050 Hz, pas de 512), la pente sur tout le morceau est précise à la milliseconde.
export function beatPeriod(beats: readonly number[]): number {
  const n = beats.length;
  const meanIndex = (n - 1) / 2;
  const meanTime = beats.reduce((sum, t) => sum + t, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanIndex) * (beats[i]! - meanTime);
    den += (i - meanIndex) ** 2;
  }
  return num / den;
}

export interface Audiomap {
  tempo: { beats_per_bar: number };
  grid: { beats_sec: number[]; downbeats_sec: number[] };
}

// Mesure de la boucle : premier temps fort après le silence de tête (50 ms de tolérance), mesure = temps × temps par
// mesure, et début du silence de fin.
export function barMeasure(map: Audiomap, silences: Silences): BarMeasure {
  const firstDownbeat = map.grid.downbeats_sec.find((t) => t >= silences.headSilenceEnd - 0.05);
  if (firstDownbeat === undefined) throw new Error("no downbeat after the head silence");
  return {
    firstDownbeat,
    barSeconds: beatPeriod(map.grid.beats_sec) * map.tempo.beats_per_bar,
    tailSilenceStart: silences.tailSilenceStart,
  };
}
```

`scripts/measure-loop.ts` :

```ts
// Mesure la boucle d'un morceau (spec 7.2) et affiche la constante à recopier dans src/audio/music.ts. Usage :
//   bun scripts/measure-loop.ts <morceau.mp3> <audiomap.json>
// L'audiomap vient de analyze-beatgrid.py (plugin Hyperframes), lancé avec uv (commande dans le plan 3b, tâche 6).
import { barMeasure, parseSilences } from "./loop-measure";

const [audioPath, audiomapPath] = process.argv.slice(2);
if (!audioPath || !audiomapPath) {
  console.error("usage: bun scripts/measure-loop.ts <track.mp3> <audiomap.json>");
  process.exit(1);
}
const probe = Bun.spawnSync(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", audioPath]);
const duration = Number(probe.stdout.toString().trim());
// Mêmes réglages que les mesures du plan 2 : seuil -50 dB, 0,5 s au moins.
const detect = Bun.spawnSync(["ffmpeg", "-hide_banner", "-nostats", "-i", audioPath, "-af", "silencedetect=noise=-50dB:d=0.5", "-f", "null", "-"]);
const silences = parseSilences(detect.stderr.toString(), duration);
const map = await Bun.file(audiomapPath).json();
const measure = barMeasure(map, silences);
const bpm = (60 * map.tempo.beats_per_bar) / measure.barSeconds;
console.info(`duration ${duration.toFixed(3)} s · head silence until ${silences.headSilenceEnd.toFixed(3)} s · tail silence from ${silences.tailSilenceStart.toFixed(3)} s`);
console.info(`tempo ${bpm.toFixed(2)} BPM, ${map.tempo.beats_per_bar} beats per bar · bar ${measure.barSeconds.toFixed(6)} s · first downbeat ${measure.firstDownbeat.toFixed(3)} s`);
console.info(
  `{ firstDownbeat: ${measure.firstDownbeat}, barSeconds: ${measure.barSeconds.toFixed(6)}, tailSilenceStart: ${measure.tailSilenceStart} }`,
);
```

```diff
diff --git a/src/audio/music.ts b/src/audio/music.ts
index eac7505..7db3332 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -12,6 +12,26 @@ export interface MusicPlayback {
   loopEnd: number;
 }
 
+// Mesure d'une boucle coupée sur le temps (bun scripts/measure-loop.ts) : premier temps fort après le silence de
+// tête, durée d'une mesure et début du silence de fin, en secondes.
+export interface BarMeasure {
+  firstDownbeat: number;
+  barSeconds: number;
+  tailSilenceStart: number;
+}
+
+// Avance de la coupe sur le temps fort (s) : le pointage des temps est à ±23 ms près ; couper un peu avant ne mange
+// pas l'attaque de la grosse caisse, et la fin de boucle, décalée d'autant, garde la même phase.
+const BAR_LOOP_LEAD = 0.03;
+
+// Boucle d'un nombre entier de mesures, qui démarre juste avant un temps fort : la jointure tombe sur le temps. Le
+// tempo est mesuré, jamais supposé : Lyria ne tient pas le BPM demandé (game.mp3, demandé à 120, mesuré à 130).
+export function barLoop(m: BarMeasure): MusicPlayback {
+  const loopStart = Math.max(0, m.firstDownbeat - BAR_LOOP_LEAD);
+  const bars = Math.floor((m.tailSilenceStart - loopStart) / m.barSeconds);
+  return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds };
+}
+
 // Les morceaux Lyria portent du silence : `game` 2,57 s à la fin, `replay` 2,69 s au début et 2,34 s à la fin.
 // Mesures du 2026-09-29 (seuil -50 dB, durée minimale 0,5 s) :
 //   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t5-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t5-typecheck.log`
Expected : `272 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : répétition sur `game.mp3` (gratuite)**

```bash
cd /Users/recarnot/dev/claudehot-videogame && HF=~/.claude/plugins/cache/hyperframes/hyperframes/0.8.81 && uv run --quiet --with librosa --with numpy --with soundfile python3 $HF/skills/music-to-video/scripts/analyze-beatgrid.py public/audio/game.mp3 -o .superpowers/game-audiomap.json && bun scripts/measure-loop.ts public/audio/game.mp3 .superpowers/game-audiomap.json
```

Expected (environ 20 s, dont l'installation de librosa au premier lancement) :
```
duration 91.716 s · head silence until 0.000 s · tail silence from 89.144 s
tempo 130.00 BPM, 4 beats per bar · bar 1.846184 s · first downbeat 0.093 s
{ firstDownbeat: 0.093, barSeconds: 1.846184, tailSilenceStart: 89.143537 }
```

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/loop-measure.ts scripts/measure-loop.ts src/audio/music.ts tests/loop-measure.test.ts tests/music-loop.test.ts && git commit -m "feat(music): measure a loop and cut it on whole bars at the measured tempo"
```

---

### Task 6 : générer la musique du menu et de l'intro (payant, contrôleur)

**Exécution : contrôleur.** Dépense couverte par le go (Global Constraints) : 2 appels prévus, 4 au plus.

**Files :**
- Create : `public/audio/menu.mp3`, `assets/audio/intro.mp3`, `assets/lyria-menu-response.json`, `assets/lyria-intro-response.json` (écrits par le script)
- Modify : `assets/ledger.jsonl` (une ligne par appel, écrite par le script)

**Interfaces :**
- Consumes : `bun scripts/generate-music.ts <menu|intro> --pay` (tâche 4), `bun scripts/spend.ts check` (tâche 3).
- Produces : `public/audio/menu.mp3` (tâche 7), `assets/audio/intro.mp3` (tâche 11).

- [ ] **Step 1 : clé présente**

Run : `test -n "$GEMINI_API_KEY" && echo présente`
Expected : `présente`. Sinon, arrêt : la clé est dans le zsh de Romain.

- [ ] **Step 2 : piste `menu`**

```bash
cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts check lyria 0.08 0.48 && bun scripts/generate-music.ts menu --pay 2>&1 | tee .superpowers/plan-3b-t6-menu.log
```

Expected : `ok` du contrôle, puis `wrote public/audio/menu.mp3 (audio/mpeg) · ledger 0.24 $` (réponse mesurée au plan 2 : 27 à 30 s).
Si la sortie n'est pas `written` : lire le message. `no-audio` ou `not-json` = appel facturé et journalisé ; la réponse brute est dans `.superpowers/lyria-menu-raw.json` : la lire, ne pas repayer avant. `http-error` = pas facturé.

- [ ] **Step 3 : contrôles machine de `menu.mp3`**

```bash
cd /Users/recarnot/dev/claudehot-videogame && ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/audio/menu.mp3 && ffmpeg -hide_banner -nostats -i public/audio/menu.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null - 2>&1 | grep silence_
```

Attendu : au moins 30 s ; des silences seulement en tête et en fin. Un silence de plus de 0,5 s au milieu (hors tête et fin) casse la boucle : c'est le seul motif d'un second essai sans l'avis de Romain (`bun scripts/spend.ts check lyria 0.08 0.48 && bun scripts/generate-music.ts menu --pay --overwrite`). Le goût (ambiance, énergie) se juge à la tâche 9.

- [ ] **Step 4 : piste `intro`**

```bash
cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts check lyria 0.08 0.48 && bun scripts/generate-music.ts intro --pay 2>&1 | tee .superpowers/plan-3b-t6-intro.log && ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 assets/audio/intro.mp3 && ffmpeg -hide_banner -nostats -i assets/audio/intro.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null - 2>&1 | grep silence_
```

Expected : `wrote assets/audio/intro.mp3 (audio/mpeg) · ledger 0.32 $`. Noter la durée : la cinématique dure entre 20 et 30 s, et la tâche 11 coupe le morceau s'il est plus long. Motif machine d'un second essai : moins de 20 s de musique entre les silences de tête et de fin.

- [ ] **Step 5 : journal**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts summary`
Expected : `lyria  4 calls  0.320 $ / 3.00 $  ok` (5 ou 6 appels si un second essai a eu lieu, jamais plus de 0,48 $).

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add public/audio/menu.mp3 assets/audio/intro.mp3 assets/lyria-menu-response.json assets/lyria-intro-response.json assets/ledger.jsonl && git commit -m "assets(music): Lyria menu loop and cinematic intro track"
```

---

### Task 7 : boucle du menu mesurée et branchée

`menu.mp3` est mesuré (tâche 5), et la table `PLAYBACK` coupe la boucle sur ses mesures : `menu: barLoop(MENU_LOOP)`. Tant que cette tâche n'est pas faite, le menu boucle sur tout le fichier, silences compris.

**Files :**
- Modify : `src/audio/music.ts` (`MENU_LOOP`, entrée `menu`), `tests/music-loop.test.ts`

**Interfaces :**
- Consumes : `barLoop`, `BarMeasure` (tâche 5), `public/audio/menu.mp3` (tâche 6).
- Produces : `export const MENU_LOOP: BarMeasure` (tâche 10).

- [ ] **Step 1 : mesurer**

```bash
cd /Users/recarnot/dev/claudehot-videogame && HF=~/.claude/plugins/cache/hyperframes/hyperframes/0.8.81 && uv run --quiet --with librosa --with numpy --with soundfile python3 $HF/skills/music-to-video/scripts/analyze-beatgrid.py public/audio/menu.mp3 -o .superpowers/menu-audiomap.json && bun scripts/measure-loop.ts public/audio/menu.mp3 .superpowers/menu-audiomap.json | tee .superpowers/plan-3b-t7-measure.log && ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/audio/menu.mp3
```

La dernière ligne de `measure-loop` est la constante `MENU_LOOP` ; la sortie de `ffprobe` est `MENU_DURATION`. Contrôle : le tempo affiché doit être plausible (80 à 180 BPM) ; hors de cette plage, l'analyseur a pris un demi- ou un double tempo : le noter et prévenir Romain avant de brancher.

- [ ] **Step 2 : écrire le test**

Le diff ci-dessous vient de la répétition du prototype sur `game.mp3`. Remplacer `MENU_DURATION` (`91.715875`) par la durée mesurée à l'étape 1.

```diff
diff --git a/tests/music-loop.test.ts b/tests/music-loop.test.ts
index 3903fa9..eedb9f0 100644
--- a/tests/music-loop.test.ts
+++ b/tests/music-loop.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, test } from "bun:test";
-import { type TrackName, barLoop, musicPlayback } from "../src/audio/music";
+import { MENU_LOOP, type TrackName, barLoop, musicPlayback } from "../src/audio/music";
 
 // Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
 //   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
@@ -86,3 +86,20 @@ describe("boucle coupée sur le temps (plan 3b, boucle du menu)", () => {
     expect(barLoop({ firstDownbeat: 0.01, barSeconds: 2, tailSilenceStart: 10 }).loopStart).toBe(0);
   });
 });
+
+describe("boucle du menu mesurée (plan 3b)", () => {
+  // ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/audio/menu.mp3
+  const MENU_DURATION = 91.715875;
+
+  test("menu : la fenêtre mesurée tient dans le fichier, sans repli sur tout le fichier", () => {
+    expect(musicPlayback("menu", MENU_DURATION)).toEqual(barLoop(MENU_LOOP));
+    expect(MENU_LOOP.tailSilenceStart).toBeLessThanOrEqual(MENU_DURATION);
+  });
+
+  test("menu : la boucle dure un nombre entier de mesures, jusqu'avant le silence de fin", () => {
+    const p = musicPlayback("menu", MENU_DURATION);
+    const bars = (p.loopEnd - p.loopStart) / MENU_LOOP.barSeconds;
+    expect(Math.abs(bars - Math.round(bars))).toBeLessThan(1e-9);
+    expect(p.loopEnd).toBeLessThanOrEqual(MENU_LOOP.tailSilenceStart);
+  });
+});
```

- [ ] **Step 3 : vérifier qu'il échoue**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/music-loop.test.ts 2>&1 | tee .superpowers/plan-3b-t7-red.log | tail -4`
Expected : échec à l'import (`MENU_LOOP` n'existe pas encore).

- [ ] **Step 4 : brancher la mesure**

Même diff de répétition : remplacer les trois nombres de `MENU_LOOP` par la dernière ligne de l'étape 1, et la date du commentaire par celle de la mesure.

```diff
diff --git a/src/audio/music.ts b/src/audio/music.ts
index 7db3332..835fe15 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -32,6 +32,9 @@ export function barLoop(m: BarMeasure): MusicPlayback {
   return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds };
 }
 
+// Boucle du menu : public/audio/menu.mp3, mesurée le 2026-09-30 par bun scripts/measure-loop.ts (plan 3b, tâche 6).
+export const MENU_LOOP: BarMeasure = { firstDownbeat: 0.093, barSeconds: 1.846184, tailSilenceStart: 89.143537 };
+
 // Les morceaux Lyria portent du silence : `game` 2,57 s à la fin, `replay` 2,69 s au début et 2,34 s à la fin.
 // Mesures du 2026-09-29 (seuil -50 dB, durée minimale 0,5 s) :
 //   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
@@ -41,8 +44,8 @@ export function barLoop(m: BarMeasure): MusicPlayback {
 const PLAYBACK: Record<TrackName, MusicPlayback> = {
   game: { offset: 0, loopStart: 0, loopEnd: 89.14 },
   replay: { offset: 2.69, loopStart: 2.69, loopEnd: 103.05 },
-  // Boucle du menu (plan 3b) : tout le fichier tant qu'elle n'est pas générée et mesurée (loopEnd borné à sa durée).
-  menu: { offset: 0, loopStart: 0, loopEnd: Number.POSITIVE_INFINITY },
+  // Boucle du menu : un nombre entier de mesures, calé sur le temps (MENU_LOOP).
+  menu: barLoop(MENU_LOOP),
 };
 
 // Paramètres de lecture d'une piste, bornés à la durée du tampon décodé : une piste régénérée plus courte
```

- [ ] **Step 5 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t7-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t7-typecheck.log`
Expected : `274 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/audio/music.ts tests/music-loop.test.ts && git commit -m "feat(music): the menu loop is cut on whole bars of menu.mp3"
```

Règle durable (piège du plan 2) : toute régénération de `menu.mp3` avec `--overwrite` refait les étapes 1 à 5.

---

### Task 8 : vignettes des salles et image de partage (payant, contrôleur)

**Exécution : contrôleur** (MCP erom-image, dépenses). Dépense couverte par le go : Nano Banana 2 en 1K, 2 images prévues, 5 au plus (0,40 $) ; Seedream 2K, 1 image prévue, 4 au plus (0,36 $).

**Files :**
- Create : `assets/prompts/room-01.txt`, `assets/prompts/room-02.txt` ; `assets/images/room-01.png`, `room-02.png`, `og-background.<ext>`, `assets/seedream-og-background-response.json` (écrits par les outils) ; `public/rooms/room-01.webp`, `room-02.webp`, `public/og-v1.jpg`
- Modify : `assets/ledger.jsonl`

**Interfaces :**
- Consumes : MCP `nanobanana_generate` (schéma du brief section 3 : `prompt`, `aspect_ratio`, `resolution`, `model`, `output_dir`, `filename` ; sortie PNG ; modèle par défaut `gemini-3.1-flash-image-preview` = Nano Banana 2) ; `spend.ts` (tâche 3) ; `generate-image.ts`, `build-og.sh` (tâche 2).
- Produces : `/rooms/room-01.webp` et `/rooms/room-02.webp` (déjà lus par `src/rooms/registry.ts` depuis le plan 3a) ; `public/og-v1.jpg` (balises au plan 3c).

- [ ] **Step 1 : les prompts des vignettes, versionnés**

La carte de salle est en 16:10 avec `object-fit: cover` (`src/ui/screens.css`) : on demande du 16:9. Salle 1 : la vraie salle, orange seulement sur la menace. Salle 2 : verrouillée, « Bientôt » ; katana et fusil à pompe (intent), pas de menace, donc pas d'orange.

`assets/prompts/room-01.txt` :

```text
Thumbnail illustration for a level called Server Room in a minimalist first-person shooter where time only moves when you move. A clean white server room: rows of tall off-white server racks forming aisles, a walkway with a railing along the left wall at mid-height, gray cable trays on the ceiling, an elevator door at the back. Flat-shaded low-poly geometry, thin black ink outlines, soft shadows, a deep night-blue void (#0D111B) beyond the room. Three faceted crystalline humanoid enemies glowing orange (#D97757) stand in the aisles, one bullet frozen in mid-air with an orange light trail. Only the enemies and the bullet are orange; everything else is white, light gray or black. Three-quarter high angle view, calm composition. No text, no letters, no logos, no watermark.
```

`assets/prompts/room-02.txt` :

```text
Thumbnail illustration for an upcoming locked level in a minimalist first-person shooter where time only moves when you move. A dim two-level white concrete hall with a staircase, seen from a three-quarter high angle, lit only by cold moonlight, mostly in shadow. In the center, a katana and a pump shotgun float frozen in mid-air, matte black with thin light rim highlights. Flat-shaded low-poly geometry, thin black ink outlines, a deep night-blue void (#0D111B). Mysterious, teasing mood: the scene is dark and quiet, no enemies, no orange at all. No text, no letters, no logos, no watermark.
```

- [ ] **Step 2 : vignette de la salle 1**

1. `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts check nanobanana 0.067 0.40` → code 0.
2. Charger le schéma du MCP (`ToolSearch` « select:mcp__plugin_erom-image_nanobanana__nanobanana_generate ») et appeler `nanobanana_generate` avec : `prompt` = contenu exact de `assets/prompts/room-01.txt` (sans le saut de ligne final), `aspect_ratio` `"16:9"`, `resolution` `"1K"`, sans `model` (défaut Nano Banana 2), `output_dir` `"/Users/recarnot/dev/claudehot-videogame/assets/images"`, `filename` `"room-01"`.
3. **Juste après**, que l'appel ait réussi ou non (une erreur après génération peut être facturée) : `ls assets/images/room-01*` pour le chemin réel, puis `bun scripts/spend.ts log-nanobanana 1K <chemin réel ou assets/images/room-01.png> assets/prompts/room-01.txt`. Seule exception : un refus avant génération (erreur de paramètre, clé absente), qui n'est pas facturé.
4. `ffprobe -v error -show_entries stream=width,height -of csv=p=0 assets/images/room-01.png` : noter la taille réelle (inconnue du brief).
5. Regarder l'image (Read). Motif machine d'un nouvel essai : du texte dessiné, de l'orange hors des ennemis et de la balle, ou un sujet hors salle serveurs. Chaque nouvel essai repasse par 1 à 5.

- [ ] **Step 3 : vignette de la salle 2**

Mêmes étapes avec `room-02` et `assets/prompts/room-02.txt`. Motif de nouvel essai : de l'orange, un ennemi, du texte.

- [ ] **Step 4 : conversion WebP**

```bash
cd /Users/recarnot/dev/claudehot-videogame && mkdir -p public/rooms && for r in room-01 room-02; do /opt/homebrew/bin/cwebp -quiet -q 82 -resize 640 0 assets/images/$r.png -o public/rooms/$r.webp; done && ls -la public/rooms/
```

Expected : deux fichiers de quelques dizaines de Ko (ffmpeg n'a pas d'encodeur WebP, d'où `cwebp`).

- [ ] **Step 5 : fond de l'image de partage (Seedream)**

```bash
cd /Users/recarnot/dev/claudehot-videogame && test -n "$OPENROUTER_API_KEY" && echo présente && bun scripts/spend.ts check seedream 0.09 0.36 && bun scripts/generate-image.ts og-background --pay 2>&1 | tee .superpowers/plan-3b-t8-seedream.log
```

Expected : `wrote assets/images/og-background.<ext> (image/…)`. Premier vrai échantillon d'une réponse Seedream : lire `assets/seedream-og-background-response.json` (forme, `usage.cost`), et `ffprobe -v error -show_entries stream=width,height -of csv=p=0 assets/images/og-background.*` (taille réelle d'un 2K en 2:1, inconnue du brief). Les deux vont dans le rapport de tâche.
Si la sortie est `no-image` : appel facturé et journalisé, réponse brute dans `.superpowers/seedream-og-background-raw.json`. La lire et en tirer l'image si elle y est, avant tout nouvel appel ; corriger `findImage` sur cet échantillon réel (test à l'appui) plutôt que repayer.

- [ ] **Step 6 : image de partage**

```bash
cd /Users/recarnot/dev/claudehot-videogame && zsh scripts/build-og.sh ../../assets/images/og-background.<ext> public/og-v1.jpg
```

Expected : `1200,630` puis `public/og-v1.jpg: … bytes (q=…)` sous 300 000. Regarder l'image (Read) : le logo et le texte restent lisibles sur le fond (le dégradé de gauche les protège). Motif machine d'un nouveau fond : texte ou logo dessiné par Seedream, orange hors de la menace, sujet illisible derrière le logo.

- [ ] **Step 7 : journal**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts summary`
Expected : `nanobanana 2 calls 0.134 $` (au plus 5 appels, 0,335 $) et `seedream 1 calls` au coût réel d'OpenRouter (au plus 0,36 $).

- [ ] **Step 8 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add assets/prompts/room-01.txt assets/prompts/room-02.txt assets/images/room-01.png assets/images/room-02.png assets/images/og-background.* assets/seedream-og-background-response.json public/rooms/room-01.webp public/rooms/room-02.webp public/og-v1.jpg assets/ledger.jsonl && git commit -m "assets(images): room thumbnails (Nano Banana 2) and share image (Seedream background)"
```

Adapter les chemins si le MCP ou Seedream ont écrit une autre extension (vérifié par `ls` aux étapes 2 et 5).

---

### Task 9 : porte Romain (écoute, regard, prises `?record`)

**Exécution : contrôleur, avec Romain.** Une seule séance pour tout ce qui demande ses oreilles et ses yeux avant la cinématique.

**Files :**
- Create : `.superpowers/captures/*.webm` et `*.mp4` (ignorés par git)

**Interfaces :**
- Consumes : tâches 1, 6, 7, 8.
- Produces : verdict « jointure audible : oui / non » (décide de la tâche 10) ; prises converties `.superpowers/captures/replay-N.mp4`, `menu.mp4` (tâche 11) ; essais éventuels à refaire dans les plafonds du go.

- [ ] **Step 1 : préparer**

`cd /Users/recarnot/dev/claudehot-videogame && bun run dev`, puis donner à Romain, dans cet ordre, un message court :
1. **Boucle du menu :** « Ouvre http://localhost:5173/ au casque, reste sur le menu au moins 2 minutes. Tu entends la reprise de la musique ? Oui ou non. » La reprise tombe toutes les `loopEnd - loopStart` secondes (valeur de la tâche 7).
2. **Intro :** « Écoute `assets/audio/intro.mp3` (`open assets/audio/intro.mp3`). Elle doit monter, se figer, exploser, finir sur un impact. Garder ou refaire ? »
3. **Images :** « Ouvre Salles dans le menu, puis `open public/og-v1.jpg`. Garder ou refaire ? »

- [ ] **Step 2 : ses prises du replay**

Message à Romain : « Ouvre http://localhost:5173/?record=1&debug, en plein écran, onglet au premier plan jusqu'à la fin. Gagne la salle. Le replay est filmé et le fichier se télécharge à sa fin. Espace (Revoir le replay) donne une prise de plus de la même partie. 2 ou 3 victoires, les plus spectaculaires possible. Ne change pas d'onglet pendant un replay. » Lire la console (`[agenthot] replay sim … s vs duration … s`) pour chaque victoire.

- [ ] **Step 3 : sa prise du menu**

Message : « Ouvre http://localhost:5173/?record=menu, ne touche à rien pendant 35 s après l'arrivée au menu. » Le fichier `agenthot-menu-….webm` se télécharge seul à la fin d'une boucle.

- [ ] **Step 4 : ranger, convertir, contrôler**

```bash
cd /Users/recarnot/dev/claudehot-videogame && mkdir -p .superpowers/captures && mv ~/Downloads/agenthot-*.webm .superpowers/captures/ && ls -la .superpowers/captures/
```

Pour chaque prise `X.webm`, conversion en MP4 lisible par Hyperframes (le WebM de MediaRecorder n'a pas de durée) puis contrôle :

```bash
cd /Users/recarnot/dev/claudehot-videogame/.superpowers/captures && ffmpeg -loglevel error -y -i X.webm -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -r 60 -c:a aac -b:a 192k -movflags +faststart X.mp4 && ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 X.mp4 && ffmpeg -hide_banner -nostats -i X.mp4 -vf freezedetect=n=0.001:d=1 -an -f null - 2>&1 | grep freeze_
```

Attendu : 1920 × 1080 ; durée égale à celle du replay affichée en console, à 5 % près (AC-3b-4) ; aucune image figée de plus d'1 s (sinon l'onglet a été caché : prise écartée). Renommer les prises retenues `replay-1.mp4`, `replay-2.mp4`… et `menu.mp4`.

- [ ] **Step 5 : verdicts et essais**

- Jointure audible → tâche 10. Sinon, tâche 10 sautée (la noter « sans objet » dans le rapport).
- Intro, vignettes ou fond à refaire → nouvel essai par les étapes des tâches 6 et 8, `spend.ts check` d'abord ; un refus du plafond = arrêt, nouveau go de Romain.
- Aucun commit (les prises sont hors dépôt), sauf les essais refaits : même commit que leur tâche d'origine.

---

### Task 10 (si Romain entend la jointure) : fondu enchaîné à la reprise du menu

Spec 7.2 : « La jointure est masquée par un fondu enchaîné en Web Audio si elle s'entend. » Le fondu est cuit une fois dans le tampon, au chargement : la boucle est recopiée, et sa première mesure reçoit la musique qui suivait `loopEnd`, qui s'éteint pendant que le début monte. La boucle perd une mesure (la musique d'après sert au fondu).

**Files :**
- Modify : `src/audio/music.ts` (`fade`, `crossfadeLoop`, `MusicTrack`), `tests/music-loop.test.ts`

**Interfaces :**
- Consumes : `MENU_LOOP`, `barLoop` (tâches 5 et 7).
- Produces : `MusicPlayback.fade?: number` ; `barLoop(m, fade = 0)` ; `crossfadeLoop(channel, sampleRate, loopStart, loopEnd, fade): Float32Array<ArrayBuffer>`.

- [ ] **Step 1 : écrire les tests**

Les lignes de contexte qui citent `MENU_LOOP` ou `MENU_DURATION` portent les valeurs de la répétition : garder les vraies (tâche 7).

```diff
diff --git a/tests/music-loop.test.ts b/tests/music-loop.test.ts
index eedb9f0..8aebb03 100644
--- a/tests/music-loop.test.ts
+++ b/tests/music-loop.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, test } from "bun:test";
-import { MENU_LOOP, type TrackName, barLoop, musicPlayback } from "../src/audio/music";
+import { MENU_LOOP, type TrackName, barLoop, crossfadeLoop, musicPlayback } from "../src/audio/music";
 
 // Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
 //   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
@@ -92,7 +92,7 @@ describe("boucle du menu mesurée (plan 3b)", () => {
   const MENU_DURATION = 91.715875;
 
   test("menu : la fenêtre mesurée tient dans le fichier, sans repli sur tout le fichier", () => {
-    expect(musicPlayback("menu", MENU_DURATION)).toEqual(barLoop(MENU_LOOP));
+    expect(musicPlayback("menu", MENU_DURATION)).toEqual(barLoop(MENU_LOOP, MENU_LOOP.barSeconds));
     expect(MENU_LOOP.tailSilenceStart).toBeLessThanOrEqual(MENU_DURATION);
   });
 
@@ -100,6 +100,55 @@ describe("boucle du menu mesurée (plan 3b)", () => {
     const p = musicPlayback("menu", MENU_DURATION);
     const bars = (p.loopEnd - p.loopStart) / MENU_LOOP.barSeconds;
     expect(Math.abs(bars - Math.round(bars))).toBeLessThan(1e-9);
-    expect(p.loopEnd).toBeLessThanOrEqual(MENU_LOOP.tailSilenceStart);
+    // La musique qui suit la boucle sert au fondu : elle tient avant le silence de fin.
+    expect(p.loopEnd + (p.fade ?? 0)).toBeLessThanOrEqual(MENU_LOOP.tailSilenceStart);
+  });
+});
+
+describe("fondu enchaîné à la jointure (spec 7.2, si elle s'entend)", () => {
+  const RATE = 1000;
+  const sine = (hz: number, seconds: number) => Float32Array.from({ length: seconds * RATE }, (_, i) => Math.sin((2 * Math.PI * hz * i) / RATE));
+
+  test("la boucle cuite dure exactement la fenêtre", () => {
+    expect(crossfadeLoop(sine(2, 10), RATE, 1, 5, 0.5).length).toBe(4000);
+  });
+
+  test("un son régulier calé sur la boucle ressort intact : pas de bosse ni de creux au fondu", () => {
+    // 2 Hz, fenêtre de 4 s : la fin et le début sont en phase, comme deux mesures d'un même groove.
+    const source = sine(2, 10);
+    const out = crossfadeLoop(source, RATE, 1, 5, 0.5);
+    for (let i = 0; i < out.length; i++) expect(Math.abs(out[i]! - source[1000 + i]!)).toBeLessThan(1e-6);
+  });
+
+  test("à la jointure, le son continue sans coupure : le début de la boucle reprend la musique d'après loopEnd", () => {
+    const source = Float32Array.from({ length: 10 * RATE }, (_, i) => (i < 5000 ? 0 : 1));
+    const out = crossfadeLoop(source, RATE, 1, 5, 0.5);
+    // Juste après la jointure : tout vient de la suite (1) ; au bout du fondu, tout vient du début (0).
+    expect(out[0]).toBe(1);
+    expect(out[250]).toBeCloseTo(0.5, 6);
+    expect(out[499]).toBeLessThan(0.01);
+    expect(out[500]).toBe(0);
+  });
+
+  test("après le fondu, la boucle est la musique d'origine", () => {
+    const source = Float32Array.from({ length: 10 * RATE }, (_, i) => i);
+    const out = crossfadeLoop(source, RATE, 1, 5, 0.5);
+    for (const i of [500, 1234, 3999]) expect(out[i]).toBe(1000 + i);
+  });
+
+  test("s'il manque de la musique après loopEnd, le fondu se raccourcit au lieu de lire hors du tampon", () => {
+    const source = Float32Array.from({ length: 5200 }, () => 1);
+    const out = crossfadeLoop(source, RATE, 1, 5, 0.5);
+    expect(out.length).toBe(4000);
+    expect(out.every((v) => Number.isFinite(v))).toBe(true);
+  });
+
+  test("avec un fondu d'une mesure, la boucle garde un nombre entier de mesures et la place pour le fondu", () => {
+    const m = { firstDownbeat: 0.093, barSeconds: 1.846184, tailSilenceStart: 89.143537 };
+    const p = barLoop(m, m.barSeconds);
+    const bars = (p.loopEnd - p.loopStart) / m.barSeconds;
+    expect(Math.abs(bars - Math.round(bars))).toBeLessThan(1e-9);
+    expect(p.loopEnd + m.barSeconds).toBeLessThanOrEqual(m.tailSilenceStart);
+    expect(p.fade).toBe(m.barSeconds);
   });
 });
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/music-loop.test.ts 2>&1 | tee .superpowers/plan-3b-t10-red.log | tail -4`
Expected : échec à l'import (`crossfadeLoop` n'existe pas).

- [ ] **Step 3 : écrire le code**

```diff
diff --git a/src/audio/music.ts b/src/audio/music.ts
index 835fe15..9141b11 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -10,6 +10,8 @@ export interface MusicPlayback {
   // Fenêtre de la boucle (s) : le son revient de loopEnd à loopStart.
   loopStart: number;
   loopEnd: number;
+  // Fondu enchaîné à la jointure (s), absent ou 0 sans fondu (spec 7.2 : seulement si la jointure s'entend).
+  fade?: number;
 }
 
 // Mesure d'une boucle coupée sur le temps (bun scripts/measure-loop.ts) : premier temps fort après le silence de
@@ -26,10 +28,34 @@ const BAR_LOOP_LEAD = 0.03;
 
 // Boucle d'un nombre entier de mesures, qui démarre juste avant un temps fort : la jointure tombe sur le temps. Le
 // tempo est mesuré, jamais supposé : Lyria ne tient pas le BPM demandé (game.mp3, demandé à 120, mesuré à 130).
-export function barLoop(m: BarMeasure): MusicPlayback {
+// Avec un fondu, la musique qui suit loopEnd sert à la jointure : elle doit tenir avant le silence de fin.
+export function barLoop(m: BarMeasure, fade = 0): MusicPlayback {
   const loopStart = Math.max(0, m.firstDownbeat - BAR_LOOP_LEAD);
-  const bars = Math.floor((m.tailSilenceStart - loopStart) / m.barSeconds);
-  return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds };
+  const bars = Math.floor((m.tailSilenceStart - fade - loopStart) / m.barSeconds);
+  return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds, fade };
+}
+
+// Fondu enchaîné cuit dans le tampon (spec 7.2) : la boucle [loopStart, loopEnd[ est recopiée, et ses `fade`
+// premières secondes reçoivent la musique qui suivait loopEnd, qui s'éteint pendant que le début monte. À la
+// jointure, le son passe de l'échantillon avant loopEnd à celui d'après : aucune coupure. Gain linéaire : la fin et
+// le début sont le même groove, calés sur la même mesure ; un fondu à puissance constante gonflerait de 3 dB les
+// coups communs aux deux.
+export function crossfadeLoop(
+  channel: Float32Array<ArrayBuffer>,
+  sampleRate: number,
+  loopStart: number,
+  loopEnd: number,
+  fade: number,
+): Float32Array<ArrayBuffer> {
+  const start = Math.round(loopStart * sampleRate);
+  const end = Math.round(loopEnd * sampleRate);
+  const out = channel.slice(start, end);
+  const fadeLength = Math.min(Math.round(fade * sampleRate), channel.length - end, out.length);
+  for (let i = 0; i < fadeLength; i++) {
+    const t = i / fadeLength;
+    out[i] = channel[start + i]! * t + channel[end + i]! * (1 - t);
+  }
+  return out;
 }
 
 // Boucle du menu : public/audio/menu.mp3, mesurée le 2026-09-30 par bun scripts/measure-loop.ts (plan 3b, tâche 6).
@@ -45,7 +71,7 @@ const PLAYBACK: Record<TrackName, MusicPlayback> = {
   game: { offset: 0, loopStart: 0, loopEnd: 89.14 },
   replay: { offset: 2.69, loopStart: 2.69, loopEnd: 103.05 },
   // Boucle du menu : un nombre entier de mesures, calé sur le temps (MENU_LOOP).
-  menu: barLoop(MENU_LOOP),
+  menu: barLoop(MENU_LOOP, MENU_LOOP.barSeconds),
 };
 
 // Paramètres de lecture d'une piste, bornés à la durée du tampon décodé : une piste régénérée plus courte
@@ -54,11 +80,14 @@ export function musicPlayback(name: TrackName, bufferDuration: number): MusicPla
   const table = PLAYBACK[name];
   const loopEnd = Math.min(table.loopEnd, bufferDuration);
   if (table.loopStart >= loopEnd) return { offset: 0, loopStart: 0, loopEnd: bufferDuration };
-  return { offset: table.offset, loopStart: table.loopStart, loopEnd };
+  // Le fondu éventuel suit la fenêtre.
+  return { ...table, loopEnd };
 }
 
 export class MusicTrack {
   private buffer: AudioBuffer | null = null;
+  // Fenêtre de lecture du tampon chargé : tout le tampon quand le fondu y est cuit.
+  private window: MusicPlayback = { offset: 0, loopStart: 0, loopEnd: 0 };
   private source: AudioBufferSourceNode | null = null;
   // Lecture demandée avant la fin du décodage : elle démarre dès que le morceau est prêt.
   private pending = false;
@@ -79,7 +108,15 @@ export class MusicTrack {
     try {
       const response = await fetch(this.url);
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
-      this.buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
+      const decoded = await this.ctx.decodeAudioData(await response.arrayBuffer());
+      const playback = musicPlayback(this.name, decoded.duration);
+      if (playback.fade) {
+        this.buffer = this.bake(decoded, playback);
+        this.window = { offset: 0, loopStart: 0, loopEnd: this.buffer.duration };
+      } else {
+        this.buffer = decoded;
+        this.window = playback;
+      }
       if (this.pending) this.play();
     } catch (error) {
       console.warn(`[agenthot] music ${this.url} unavailable`, error);
@@ -90,6 +127,17 @@ export class MusicTrack {
     return this.buffer !== null;
   }
 
+  // Tampon de la boucle seule, fondu de la jointure compris (fait une fois, au chargement).
+  private bake(decoded: AudioBuffer, playback: MusicPlayback): AudioBuffer {
+    const { sampleRate, numberOfChannels } = decoded;
+    const channels = Array.from({ length: numberOfChannels }, (_, c) =>
+      crossfadeLoop(decoded.getChannelData(c), sampleRate, playback.loopStart, playback.loopEnd, playback.fade ?? 0),
+    );
+    const baked = this.ctx.createBuffer(numberOfChannels, channels[0]!.length, sampleRate);
+    channels.forEach((data, c) => baked.copyToChannel(data, c));
+    return baked;
+  }
+
   // Repart du début du son (après le silence de tête), en boucle sur la fenêtre sans silence.
   play(): void {
     this.stop();
@@ -97,7 +145,7 @@ export class MusicTrack {
       this.pending = true;
       return;
     }
-    const { offset, loopStart, loopEnd } = musicPlayback(this.name, this.buffer.duration);
+    const { offset, loopStart, loopEnd } = this.window;
     this.source = new AudioBufferSourceNode(this.ctx, { buffer: this.buffer, loop: true, loopStart, loopEnd });
     this.source.connect(this.out);
     this.source.start(0, offset);
```

- [ ] **Step 4 : vérifier que tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t10-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t10-typecheck.log`
Expected : `280 pass`, `0 fail` ; `tsc` sans erreur.

- [ ] **Step 5 : Romain réécoute**

`bun run dev`, message : « Même écoute qu'avant, 2 minutes sur le menu. La reprise s'entend encore ? » Non → commit. Oui → essayer un fondu de deux mesures (`barLoop(MENU_LOOP, 2 * MENU_LOOP.barSeconds)`, et le test `menu` à l'identique), puis réécoute ; au-delà, arrêt et décision de Romain (nouvelle piste = nouveau go).

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/audio/music.ts tests/music-loop.test.ts && git commit -m "feat(music): baked crossfade at the menu loop seam"
```

---

### Task 11 : la cinématique (Hyperframes, route `music-to-video`)

**Exécution : contrôleur** (orchestration Hyperframes : il répartit lui-même le travail des cadres à ses sous-agents, étape 7). Spec 4.2 : 20 à 30 s, 1920 × 1080, fabriquée avec de vraies séquences du jeu, des cartes de texte et un morceau Lyria ; elle doit « claquer pour donner envie » (Romain, intent).

Cette tâche n'est pas prototypée : elle dépend des prises de Romain et du morceau payé. Son contrat est fixé ici, la mise en œuvre suit la skill du plugin.

**Files :**
- Create : `videos/agenthot-intro/` (projet Hyperframes : `hyperframes.json`, `BRIEF.md`, `frame.md`, `STORYBOARD.md`, `audiomap.json`, `index.html`, `compositions/frames/*.html`, `assets/bgm.mp3`, `assets/fonts/*.woff2`) ; `public/video/intro.webm`, `public/video/intro.mp4`
- Modify : `.gitignore`

**Interfaces :**
- Consumes : `assets/audio/intro.mp3` (tâche 6), prises `.superpowers/captures/*.mp4` (tâche 9), `public/fonts/*.woff2` (plan 3a).
- Produces : `public/video/intro.webm` (AV1, Opus) et `public/video/intro.mp4` (H.264, AAC), déjà lus par `src/ui/media.ts` (`INTRO_VIDEO`) avec le type `video/webm; codecs="av01.0.08M.08"`.

Dans cette tâche, `HF=~/.claude/plugins/cache/hyperframes/hyperframes/0.8.81` et `HFCLI="node $HF/skills/hyperframes/scripts/plugin-cli.mjs"` (règles `plugin-installation.md` : jamais `npx hyperframes`, jamais de mise à jour des skills ; les scripts `.mjs` de la skill passent par `$HFCLI --script <chemin absolu>`).

- [ ] **Step 1 : lire la skill**

Invoquer `hyperframes:hyperframes` (point d'entrée obligatoire), puis suivre `hyperframes:music-to-video` étape par étape, avec les écarts de cette tâche. Première commande : `cd /Users/recarnot/dev/claudehot-videogame && $HFCLI doctor` (Node, ffmpeg, Chrome).

- [ ] **Step 2 : le morceau, à la bonne longueur**

La durée de la vidéo est celle du morceau (route `music-to-video`). Si `assets/audio/intro.mp3` dure plus de 30 s de musique : couper juste après la fin de l'impact final (repérée par `silencedetect` ou à l'oreille du contrôleur sur la forme d'onde), avec un fondu de sortie de 0,5 s :

```bash
cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -i assets/audio/intro.mp3 -ss <début musique> -t <durée ≤ 30> -af "afade=t=out:st=<durée - 0.5>:d=0.5" -c:a libmp3lame -b:a 192k .superpowers/intro-bgm.mp3
```

Sinon, retirer seulement les silences de tête et de fin (même commande sans fondu). Durée finale : entre 20 et 30 s.

- [ ] **Step 3 : le projet**

```bash
cd /Users/recarnot/dev/claudehot-videogame && $HFCLI init videos/agenthot-intro --non-interactive --example=blank --skill=music-to-video && mkdir -p videos/agenthot-intro/assets/fonts videos/agenthot-intro/renders && cp .superpowers/intro-bgm.mp3 videos/agenthot-intro/assets/bgm.mp3 && cp public/fonts/big-shoulders-display-900.woff2 public/fonts/chakra-petch-600.woff2 public/fonts/martian-mono-300-400.woff2 public/fonts/LICENSES.txt videos/agenthot-intro/assets/fonts/
```

Ajouter à `.gitignore` (prises, rendus et master, lourds et refaisables) :

```
# Cinématique : prises du jeu, rendus et master (lourds, refaisables)
videos/agenthot-intro/renders/
videos/agenthot-intro/public/
videos/agenthot-intro/assets/captures/
```

Mettre les prises retenues dans `videos/agenthot-intro/assets/captures/` (ou là où `stage-assets.mjs` les range : `$HFCLI --script $HF/skills/music-to-video/scripts/stage-assets.mjs --from .superpowers/captures --hyperframes videos/agenthot-intro --into public`), et vérifier après coup que `git status --short videos/` ne montre aucune vidéo.

- [ ] **Step 4 : `BRIEF.md`**

Écrit juste après `init` (la skill l'exige après, jamais avant) :

```markdown
# AGENTHOT, cinématique d'accueil

- flow: automation
- storyboard: yes
- mode: collaborative
- destination: site web, ordinateur (lecture plein écran à la première visite, et en fond muet sur téléphone)
- aspect: 1920x1080 (destination ordinateur)
- fps: 30 (type AV1 déclaré par le jeu : niveau 4.0)
- length: la durée de assets/bgm.mp3, entre 20 et 30 s
- language: français (cartes de texte)
- audience: toute personne qui clique sur le lien partagé, sans rien savoir du jeu
- message: « Le temps n'avance que quand tu bouges. » AGENTHOT est un FPS dans le navigateur, écrit par Claude Opus 5.5.
- angle: la musique raconte le jeu. Montée : la salle blanche, figée, les ennemis orange qui visent. Gel : tout s'arrête, une balle suspendue, un mot. Drop : les éclats, les tirs, le replay à pleine vitesse, coupés sur le temps. Impact final : le logo.
- narration: non
- assets: prises du jeu filmées par le jeu (assets/captures : replay-N.mp4, menu.mp4), muettes au montage ; la seule piste son est bgm.mp3
- brand: design system du jeu (frame.md), jamais un preset
```

- [ ] **Step 5 : analyse et squelette**

```bash
cd /Users/recarnot/dev/claudehot-videogame && uv run --quiet --with librosa --with numpy --with soundfile python3 $HF/skills/music-to-video/scripts/analyze-beatgrid.py videos/agenthot-intro/assets/bgm.mp3 -o videos/agenthot-intro/audiomap.json --print
```

Puis l'étape 2 de la skill (`STORYBOARD.md` en squelette : cadres calés sur les `hard_stops` et les `key_moments`, `pacing` par cadre).

- [ ] **Step 6 : charte et plan des cadres**

Écart à la skill (décision 8) : `frame.md` n'est pas un preset copié, c'est le design system du jeu, au format des presets (`colors`, `typography`), avec :
- `colors` : `void "#0D111B"`, `void-2 "#141A28"`, `world "#ECEBE7"`, `world-2 "#C9CBD0"`, `ink "#0A0C10"`, `threat "#D97757"`, `threat-hot "#FF9D73"`, `muted "#7C8394"` (spec 6.1) ;
- `typography` : titres et logo en Big Shoulders Display 900, capitales, interlignage 0,8 ; cartes en Chakra Petch 600, capitales espacées ; petits textes en Martian Mono 400, capitales espacées 0,18 em. Polices chargées par `@font-face` depuis `assets/fonts/` ;
- règles : l'orange ne va qu'à la menace et à « HOT » ; pas de rebond ; aucun tiret cadratin.

Le plan des cadres (étape 3 de la skill) monte les prises en `beat_cut` sur les cadres rythmés et en `ken_burns` sur le gel, prises muettes. Cartes de texte, en français, proposées à Romain : « LE TEMPS / N'AVANCE QUE / QUAND TU BOUGES » ; au gel, un seul mot, « STOP » ou « FIGÉ » ; carte finale : logo « AGENT » / « HOT » (HOT en orange), puis « Made with Claude Opus 5.5 » en Martian Mono. Chercher chaque effet nommé dans le catalogue avant de le composer (`$HFCLI catalog --query "<effet>" --json`). Valider : `$HFCLI --script $HF/skills/music-to-video/scripts/validate-plan.mjs --storyboard videos/agenthot-intro/STORYBOARD.md --audiomap videos/agenthot-intro/audiomap.json --templates $HF/skills/music-to-video/references/templates` → code 0.

- [ ] **Step 7 : porte Romain, le plan des cadres**

Lui envoyer le résumé cadre par cadre (temps, prise ou carte, texte exact), court. Attendre son accord ; appliquer ses retours aux seuls cadres qu'il nomme.

- [ ] **Step 8 : construire et assembler**

Étape 4 de la skill : un sous-agent `frame-worker` par cadre, avec le bloc de contexte de la skill, plus : racine du plugin et lanceur (`$HF`, `$HFCLI`), `frame.md` à respecter, prises muettes. Puis étape 5 : `$HFCLI --script $HF/skills/music-to-video/scripts/assemble-index.mjs --storyboard videos/agenthot-intro/STORYBOARD.md --hyperframes videos/agenthot-intro --audiomap videos/agenthot-intro/audiomap.json`. Puis `cd videos/agenthot-intro && $HFCLI check . --snapshots` jusqu'au vert, et relire les images de contrôle (début, chaque cadre, le drop, la fin).

- [ ] **Step 9 : porte Romain, l'aperçu**

Rendu brouillon (`cd videos/agenthot-intro && $HFCLI render . --skill=music-to-video -q draft -o renders/draft.mp4 --fps 30`), envoyé à Romain avec la planche des images de contrôle. Question : « Ça claque ? Rendu final, ou quoi changer ? » Aucun rendu final sans son accord.

- [ ] **Step 10 : master et fichiers de diffusion**

```bash
cd /Users/recarnot/dev/claudehot-videogame/videos/agenthot-intro && $HFCLI render . --skill=music-to-video --quality delivery -o renders/master.mp4 --fps 30
```

Puis, depuis la racine, débit calculé pour 5,6 Mo (marge sous les 6 Mo de la spec) :

```bash
cd /Users/recarnot/dev/claudehot-videogame && M=videos/agenthot-intro/renders/master.mp4 && DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $M) && V=$(python3 -c "print(int(5600*8/$DUR - 96))") && echo "duration $DUR s, video ${V}k" && mkdir -p public/video && ffmpeg -loglevel error -y -i $M -c:v libsvtav1 -preset 6 -b:v ${V}k -g 240 -pix_fmt yuv420p -c:a libopus -b:a 96k public/video/intro.webm && ffmpeg -loglevel error -y -i $M -c:v libx264 -preset slow -b:v ${V}k -pass 1 -passlogfile .superpowers/h264pass -an -f null /dev/null && ffmpeg -loglevel error -y -i $M -c:v libx264 -preset slow -b:v ${V}k -pass 2 -passlogfile .superpowers/h264pass -c:a aac -b:a 96k -movflags +faststart public/video/intro.mp4 && ls -la public/video/ && for f in public/video/intro.webm public/video/intro.mp4; do ffprobe -v error -show_entries format=duration:stream=codec_name,profile,level,width,height,r_frame_rate -of default=nw=1 $f; done
```

Attendu (mesures du 2026-09-29 et du 2026-09-30) : chaque fichier ≤ 6 000 000 octets ; `intro.webm` : `av1`, `Main`, `level=8`, 1920 × 1080, `30/1`, piste `opus` ; `intro.mp4` : `h264`, `High`, `30/1`, piste `aac` ; durée entre 20 et 30 s. Un fichier trop lourd : baisser `5600` de 10 % et refaire (le débit visé est une moyenne, l'AV1 peut dépasser sur un contenu bruité comme les éclats). Regarder le WebM et le MP4 en entier (`open`) : pas de bloc ni de flou sur les éclats.

- [ ] **Step 11 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git status --short videos/ public/video/ && git add .gitignore videos/agenthot-intro/hyperframes.json videos/agenthot-intro/BRIEF.md videos/agenthot-intro/frame.md videos/agenthot-intro/STORYBOARD.md videos/agenthot-intro/audiomap.json videos/agenthot-intro/index.html videos/agenthot-intro/compositions videos/agenthot-intro/assets/bgm.mp3 videos/agenthot-intro/assets/fonts public/video/intro.webm public/video/intro.mp4 && git commit -m "feat(cinematic): Hyperframes intro, AV1 and H.264 cuts under 6 MB"
```

Ajouter au `git add` tout autre fichier source que `init` a créé (lu dans le `git status` ci-dessus : `package.json`, `meta.json`…), jamais une vidéo de `renders/` ou une prise.

---

### Task 12 : intégration, vérification et passation

**Exécution : contrôleur.**

**Files :**
- Modify : `src/audio/game-audio.ts` (bourdon), `.claude/notes/2026-09-29-agenthot-reprise.md`, `.claude/notes/agenthot-plan-3-remaining.md`, `.claude/notes/agenthot-pitfalls.md`

**Interfaces :**
- Consumes : tout le plan.
- Produces : branche prête pour la revue finale.

- [ ] **Step 1 : le bourdon ne monte plus sous la cinématique (revue 3a, point 6)**

Un onglet caché pendant le chargement appelle `audio.freeze()`, qui réglait le bourdon sur « allumé » avant que le moteur ne l'ait décidé : il s'entendait sous la cinématique jusqu'à la fin de `createEngine`. Le moteur l'allume lui-même à chaque écran (`setMode`). Web Audio ne tourne pas sous `bun test` : pas de test automatique, vérification à l'étape 2.

```diff
diff --git a/src/audio/game-audio.ts b/src/audio/game-audio.ts
index f7f711c..5fb1e85 100644
--- a/src/audio/game-audio.ts
+++ b/src/audio/game-audio.ts
@@ -23,8 +23,9 @@ export class GameAudio {
   // Boucle du menu : non filtrée, à vitesse réelle, comme celle du replay.
   private readonly menuMusic: MusicTrack;
   private timeScale = 1;
-  // Bourdon d'ambiance (spec 7.3 : « ambiance en jeu ») : coupé dans le menu.
-  private droneOn = true;
+  // Bourdon d'ambiance (spec 7.3 : « ambiance en jeu ») : coupé dans le menu. Éteint tant que le moteur ne l'a pas
+  // allumé : un onglet caché pendant le chargement (freeze) le faisait monter sous la cinématique (revue 3a, point 6).
+  private droneOn = false;
   // Vrai si c'est nous qui avons suspendu le contexte (onglet caché) : on ne reprend que dans ce cas,
   // jamais un contexte que le premier geste n'a pas encore débloqué.
   private suspendedByHidden = false;
```

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3b-t12-tests.log | tail -3 && RTK_DISABLED=1 bun run typecheck 2>&1 | tee .superpowers/plan-3b-t12-typecheck.log`
Expected : `0 fail` (274 pass, ou 280 avec la tâche 10) ; `tsc` sans erreur.

Commit : `cd /Users/recarnot/dev/claudehot-videogame && git add src/audio/game-audio.ts && git commit -m "fix(audio): the drone stays off until the engine turns it on"`

- [ ] **Step 2 : parcours AC-11 sur le build**

```bash
cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run build 2>&1 | tee .superpowers/plan-3b-t12-build.log | tail -4 && bun run preview --port 5391 --strictPort > .superpowers/plan-3b-t12-preview.log 2>&1 &
```

MCP Chrome DevTools, fenêtre au premier plan, sur `http://localhost:5391/` :
1. `evaluate_script` : `localStorage.clear()`, puis recharger. Touche « a » sur « APPUIE SUR UNE TOUCHE » : la cinématique joue (capture à mi-course). Une touche la passe : le menu arrive.
2. Recharger : le menu arrive directement, sans cinématique.
3. Menu, entrée « Intro » : la cinématique rejoue, puis retour au menu avec le focus sur « Intro ».
4. Son : musique du menu calée (tâche 7 ou 10) ; pas de bourdon sous la cinématique.
5. `list_console_messages` : aucune exception, aucun `unavailable` pour `menu.mp3`.

- [ ] **Step 3 : codecs (Review Focus 4)**

`evaluate_script` : `document.createElement("video").canPlayType('video/webm; codecs="av01.0.08M.08"')` (Chrome : `probably`) et `canPlayType("video/mp4")` (`maybe`). Puis `open -a Safari http://localhost:5391/` après `localStorage.clear()` dans Safari : la cinématique joue (MP4 sur un Mac sans AV1 matériel). Noter le modèle du Mac et le fichier lu (`evaluate_script` indisponible dans Safari : demander à Romain ce qu'il voit, ou lire `video.currentSrc` dans la console de Safari).

- [ ] **Step 4 : écran mobile (Review Focus 5, AC-12)**

MCP Chrome DevTools, `emulate` iPhone, `http://localhost:5391/` : « Joue sur ordi » avec la cinématique en boucle, muette ; `list_console_messages` sans erreur ; aucune requête vers `engine-*.js` (`list_network_requests`). Capture.

- [ ] **Step 5 : dépenses (AC-3b-6, AC-17)**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts summary | tee .superpowers/plan-3b-t12-spend.log; echo "exit=$?"`
Expected : code 0 ; Lyria ≤ 0,48 $, Nano Banana ≤ 0,40 $, Seedream ≤ 0,36 $.

- [ ] **Step 6 : critères d'acceptation**

Reprendre AC-3b-1 à AC-3b-6 un par un, chacun avec la vérification réellement faite et sa sortie (fichier `.superpowers/plan-3b-*.log` ou capture). Un critère non vérifié est dit tel quel.

- [ ] **Step 7 : notes de passation**

- `.claude/notes/agenthot-pitfalls.md` : ajouter, avec leur preuve : Lyria ne tient pas le BPM (130 mesuré pour 120 demandé, `bun scripts/measure-loop.ts`) ; le WebM de MediaRecorder n'a pas de durée (`ffprobe` : `N/A`) ; `captureStream` marche sur le rendu WebGPU (tâche 1) ; AV1 1080p30 = niveau 4.0, 60 i/s = 4.1 ; tailles réelles des images Seedream 2K et Nano Banana 1K (tâche 8).
- `.claude/notes/agenthot-plan-3-remaining.md` : section 3b marquée faite, avec les dépenses réelles ; ce qui reste au 3c.
- `.claude/notes/2026-09-29-agenthot-reprise.md` : en-tête daté, état en une phrase, prochaine étape (revue finale du 3b, puis écriture du 3c).

Commit : `cd /Users/recarnot/dev/claudehot-videogame && git add .claude/notes/agenthot-pitfalls.md .claude/notes/agenthot-plan-3-remaining.md .claude/notes/2026-09-29-agenthot-reprise.md && git commit -m "docs: plan 3b results, pitfalls and resume note"`

- [ ] **Step 8 : revue finale et fusion**

Revue finale de la branche par Opus 5.5 en effort xhigh (doctrine de Romain), avec la grille « code creux » dans le brief du relecteur. Fusion dans `main` seulement sur le « go » de Romain. Aucun push.
