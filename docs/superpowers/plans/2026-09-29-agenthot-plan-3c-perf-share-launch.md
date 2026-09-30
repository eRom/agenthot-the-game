# AGENTHOT, plan 3c : performance, partage, crédits, mise en ligne

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** mettre AGENTHOT en ligne à `https://agenthot.erom.cloud/`, avec un cache long sur tout ce qui pèse, un aperçu propre quand on partage le lien, des crédits vrais, et la preuve que les critères de la spec tiennent sur le site réel.

**Architecture :**
- Le code d'abord (tâches 1 à 8), sans rien toucher au-dehors : un contrôle de mise en ligne rejouable (`bun scripts/check-release.ts`), les fichiers lourds servis par Vite sous un nom haché, le MP4 de la cinématique contrôlé (niveau H.264 4.1, pour les vieux décodeurs), les balises de partage, une sonde d'images pour AC-8, les crédits définitifs, la configuration Vercel, le README.
- Puis la recette locale et la relecture de Romain (tâche 9), la revue finale et la fusion (tâche 10).
- Puis les trois portes de Romain, chacune un arrêt : le push (tâche 11), le déploiement Vercel (tâche 12), le DNS (tâche 13). Le déploiement envoie un site construit sur ce Mac (`vercel build` puis `vercel deploy --prebuilt`) : ce qui part en ligne est ce qui a été contrôlé.
- Enfin la recette sur le site réel et la passation (tâche 14).

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4, Three.js r186, ffmpeg 9.0.2 (`libx264`), Chrome sans écran, CLI Vercel 59.20.0 (`~/.bun/bin/vercel`, compte `eromleduk`, équipe `romain-ecarnots-projects`), `gh`, `dig`, `curl`, MCP Chrome DevTools.

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, étape 8 de la section 11 : sections 4.2 (repli MP4), 4.3 (crédits), 4.7 (partage), 9.2 (performance), 12 (points ouverts) ; AC-8, AC-9, AC-10, AC-12, AC-15, AC-17. Entrées obligatoires : `.claude/notes/2026-09-29-agenthot-reprise.md`, `.claude/notes/agenthot-plan-3-remaining.md` (section 3c), `.claude/notes/agenthot-pitfalls.md`, brief `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md` (sections 5, 7, 8), revue `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md` (points 6 et 7).

**Révision du 2026-09-30 à 18 h :** le plan a été rejoué sur `main` à `19bd64d` (nouveau rendu de la salle, cinématique et images refaites). Ce qui a changé :
- Les diffs et les fichiers viennent du prototype rejoué sur `19bd64d`. Les sept commits de code s'y posent sans conflit.
- Tests : 282 → 302 → 309 → 311 (avant : 279 → 299 → 306 → 308).
- Tâche 3 : le MP4 est déjà au niveau 4.1 depuis la nouvelle cinématique (`af9bf26`). Elle ne ré-encode plus, elle contrôle.
- Image de partage : faite d'une capture du jeu (`og-background-game.png`), 59 914 octets.
- Seuil de 80 appels de dessin et « ombre des coins » (spec révisée le 30/09).
- Crédits recomptés : 955 020 037 tokens, 373,80 $ à 17 h 58.
- README : la ligne « Images » dit que l'image de partage et la vignette de la salle 1 sont des captures du jeu.
- Tâche 7 : `.gitignore` porte deux lignes non commitées de Romain. Le commit ne prend que la ligne `.vercel/`.
- Build : point d'entrée 40,13 Ko, moteur 1 010 Ko (le nouveau rendu pèse 17 Ko de plus).

**Ajouts du 2026-09-30 à 18 h 30** (deux demandes de Romain, relayées par la session venus) :
- **SEO et GEO « comme linktree » :** tâches 8b à 8e avant la recette, tâche 13b après le domaine. Critères AC-3c-12 à AC-3c-15.
- **Dépôt public, « mode making-of » :** tâche 8f (README, `.gitignore`), contrôles d'avant push à la tâche 11. La porte du push reste fermée jusqu'aux mots de Romain.
- Trouvé à l'exécution : tâche 2b (les scripts de musique écrivaient encore dans `public/audio`), faite (`aae5573`).

**Corrections après relecture (le code du dépôt fait foi, pas les blocs ci-dessous) :**
- Tâche 8b, `d7dc74b` : les deux liens `alternate` exigés, titre absent signalé, adresse illisible ignorée sans exception, `uploadDate` en `Z`, icône sans `src`.
- Tâche 8d, `ae6f2b5` : les outils WebMCP rendent leurs données directement (brouillon du W3C : `Promise<any>`, mis en JSON par le navigateur), et non `{ content: [...] }` ; un test lie « 5 ennemis, 4 balles » aux constantes du jeu ; « Ton arme se lance, même vide ».
- Suite après ces corrections : 354 tests.

**Retours de Romain à la recette (2026-09-30, 18 h 57) :**
- Ligne des crédits sans « AGENTHOT ‧ » en tête : `Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/agenthot-the-game`. AC-3c-4 et la spec (4.3, AC-15) se lisent avec cette ligne. Police de la ligne à 12 px : l'adresse du dépôt tient entière sur la deuxième ligne.
- Titre de la page : « AGENTHOT ‧ Le temps est ton arme » (remplace la décision 13 ; tutoiement choisi par Romain à 19 h 07). La même phrase remplace « Le temps n'avance que quand tu bouges » au menu et sur l'image de partage (`public/og-v1.jpg` refaite, 57 354 octets ; même nom, le site n'a jamais été en ligne, aucune plateforme n'a l'ancienne en cache). Les descriptions (Google, `llms.txt`, README, écran mobile) gardent la phrase qui explique le jeu.
- Safari, repli WebGL2, icône, README, `llms.txt` : validés. À 19 h 10 (« 3x oui ! ») : son nom dans la fiche (décision 15), la phrase du Making-of, les trois outils WebMCP.
- AC-3c-5 : sa partie donne `worstWindowP95Ms` 25,7, `maxMs` 31,9, `maxDrawCalls` 63. Au-dessus de l'ancien seuil de 20. Romain a accepté à 19 h 01 : son critère (jamais sous 30 images par seconde) devient l'officiel, et il est tenu. Voir AC-3c-5.

**Place de ce plan :** plan 3c sur 3, le dernier.
- **3a** (fait, fusionné à `54a6288`) : finitions du jeu et écrans.
- **3b** (fait, fusionné à `fd71576`) : assets générés, `?record`, cinématique.
- **3c (ce plan)** : performance, partage, crédits, mise en ligne.

## Global Constraints

- **Les trois portes de Romain sont des arrêts.** Le push, le déploiement Vercel et le DNS attendent chacun un « go » écrit de Romain, donné pour ce geste-là. Un go ne vaut pas pour le suivant. Avant son go : aucun `git push`, aucune commande `vercel` qui crée ou modifie quelque chose (`project add`, `link`, `pull`, `build`, `deploy`, `domains add`, `env add`), aucun changement chez Hostinger. Les commandes `vercel` qui ne font que lire (`whoami`, `project ls`, `--help`) sont permises.
- **Aucune dépense.** Ce plan ne génère rien de payant : aucun `--pay`, aucun appel Lyria, Seedream ou Nano Banana. La marge restante du go du 30/09 ne couvre que la liste du plan 3b. Vercel est en offre Hobby (gratuite), le domaine est déjà payé. Les points 2 à 4 de la revue finale du 3b (scripts payants) restent à corriger avant toute nouvelle dépense : ils ne sont pas dans ce plan, parce que ce plan ne dépense rien.
- **Adresses figées** (décisions de Romain du 2026-09-30) : site `https://agenthot.erom.cloud/` (avec la barre finale) ; dépôt `https://github.com/eRom/agenthot-the-game` (le remote `origin` pointe déjà dessus, le dépôt est privé et vide) ; projet Vercel `agenthot-the-game`.
- **Qui exécute :** les tâches 1 à 8 se délèguent (Sonnet, jamais Haiku). Les tâches 9 à 14 sont faites par le contrôleur : recette au navigateur, portes de Romain, gestes visibles du dehors.
- **Langue :** identifiants, clés, noms de fichiers, messages de log en anglais ; commentaires en français. Textes vus par le joueur ou par un tiers en français (balises de partage, README). Descriptions de test en français. Aucun tiret cadratin dans un texte lu par un tiers.
- **Outillage :** `bun` pour le projet. Jamais `npm`, `npx`, `pip`. La CLI Vercel est déjà installée (`~/.bun/bin/vercel`) : ne pas la mettre à jour. Suppression par `trash`, jamais `rm`. Aucune nouvelle dépendance.
- **Git :** branche `feat/agenthot-plan-3c` depuis `main`. `git add` de fichiers nommés seulement, jamais `git add -A` ni `git add .`. Fichiers de Romain à laisser hors des commits : `docs/superpowers/idea/*` (dont `ideation.md`, `Lyria-prompt-guide.md`, `Seedream-5.0-Pro.md`, la planche Gemini, `screenshots/`), la modification de `docs/superpowers/idea/OVERVIEW.md`, `.impeccable/`, `.ignore`, `rendu-simule/`, `.claude/helpers/`, `.claude/skills/`, `.claude/settings.json`, `.mcp.json`, et les deux lignes non commitées de `.gitignore` (`.impeccable/`, `rendu-simule/` : voir la tâche 7).
- **Commandes Bash :** chaque commande qui écrit commence par `cd /Users/recarnot/dev/claudehot-videogame &&`. Sortie brute des tests : préfixe `RTK_DISABLED=1`. Toute sortie de test citée dans un rapport vient d'une commande passée par `tee` vers un fichier nommé dans le rapport ; `bun test | tee` masque le code de sortie : lire la ligne `pass`/`fail` du fichier.
- **Secrets :** ne jamais afficher une clé. Un contrôle de présence se fait par un compte (`grep -c`), jamais par un affichage.
- **Chrome :** MCP Chrome DevTools (profil unique ; s'il est pris, l'extension claude-in-chrome). La boucle d'animation s'arrête quand l'onglet est caché : toute mesure se fait fenêtre au premier plan. Attendre 2 s après une navigation avant de sonder.
- **Vite :** en développement et en `vite preview`, un fichier absent répond `200 text/html`. Chez Vercel il répond `404`. Vérifier la présence d'un fichier par son type de contenu ou par `ls`, jamais par le code HTTP local.
- **Valeurs de la spec à tenir** (9.2 et critères) : 60 images par seconde au pire moment ; moins de 80 appels de dessin (spec révisée le 2026-09-30) ; poids initial hors cinématique et musiques sous 3 Mo ; « APPUIE SUR UNE TOUCHE » en 2 s au plus ; cinématique de 6 Mo au plus par fichier ; image de partage en 1200 × 630.

## Review Focus

Cinq situations qu'un visiteur rencontrera et qu'aucun test de tâche ne couvre seul. Chacune a sa vérification dans la tâche propriétaire.

1. **Quelqu'un colle le lien dans une messagerie.** Le robot ne lance aucun script et ne suit pas un chemin relatif : il lui faut des balises écrites dans la page, une image en URL absolue, servie en `image/jpeg`, sans redirection ni page de protection. Attendu : une grande carte avec le titre, la phrase et l'image. Vérification : tâche 1 (tests « image en chemin relatif », « page d'erreur d'un hébergeur ») ; tâche 13, étape 6 (contrôle sur le site réel, vu par un robot) ; tâche 14, étape 3 (Romain colle le lien).
2. **Safari sur un Mac M1 ou M2** (pas de décodeur AV1 matériel : c'est le Mac de Romain). Safari prend le MP4 et demande la vidéo par morceaux. Attendu : la cinématique joue. Vérification : tâche 3 (`level=41`) ; tâche 9, étape 7 (Romain, Safari, en local) ; tâche 13, étape 6 (réponse `206` sur les deux vidéos) ; tâche 14, étape 2 (Romain, Safari, en ligne).
3. **Deuxième visite, ou visite après une nouvelle version.** Attendu : rien de lourd n'est retéléchargé, et une nouvelle version s'affiche sans vider le cache. Vérification : tâche 1 (tests « fichier lourd hors de assets/ », « fichier sans hash ») ; tâche 2 (tous les fichiers lourds hachés) ; tâche 13, étape 6 (en-tête d'un an sur chaque fichier cité).
4. **Un fichier manque en ligne** (déploiement incomplet, nom changé). Chez Vercel la réponse est `404`, pas la page d'accueil comme en local. Attendu : le jeu démarre quand même, sans musique ou sans cinématique, comme le prévoit le plan 3a. Vérification : tâche 13, étape 6 (ligne `missing file answers 404`) ; tâche 1 (ligne `cited assets exist` : aucun fichier cité ne manque dans le site construit).
5. **Un visiteur sur téléphone arrive par le lien partagé.** Attendu : l'écran « Joue sur ordi », la cinématique en boucle muette, aucun moteur chargé, aucune erreur. Vérification : tâche 9, étape 5 (émulation iPhone et cas iPad, en local) ; tâche 14, étape 4 (la même sur le site réel).

## Critères d'acceptation du plan 3c

**AC-3c-1 : rien de lourd n'est retéléchargé**
- **Comportement :** quand on revient sur le site, alors les musiques, la cinématique, les polices, les vignettes et le code viennent du cache, et une nouvelle version du jeu s'affiche sans rien vider.
- **Vérifié par :** `bun scripts/check-release.ts https://agenthot.erom.cloud/` : chaque fichier cité sort en `ok` avec `public, max-age=31536000, immutable` (tâche 13, étape 6) ; rechargement dans Chrome, `transferSize` à 0 pour chaque fichier de `/assets/` (tâche 14, étape 5).

**AC-3c-2 : le lien partagé montre AGENTHOT**
- **Comportement :** quand on colle `https://agenthot.erom.cloud/` dans une messagerie, alors une carte apparaît avec l'image du jeu, le titre « AGENTHOT » et la phrase de description.
- **Vérifié par :** `bun scripts/check-release.ts https://agenthot.erom.cloud/` (lignes `share tags`, `share image served`, `share image` en `ok`) ; la carte vue par Romain dans iMessage et dans une autre messagerie de son choix (tâche 14, étape 3).

**AC-3c-3 : Safari lit la cinématique**
- **Comportement :** quand on ouvre le site pour la première fois dans Safari sur un Mac M1, alors la cinématique joue après « APPUIE SUR UNE TOUCHE ».
- **Vérifié par :** `ffprobe` de `src/ui/video/intro.mp4` : `h264`, `High`, `level=41` (tâche 3) ; Romain dans Safari, en local (tâche 9, étape 7) puis en ligne (tâche 14, étape 2).

**AC-3c-4 : crédits vrais (spec AC-15)**
- **Comportement :** quand on ouvre Crédits, alors on lit exactement `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/agenthot-the-game`, puis le nombre de tokens et le coût API estimé, mesurés sur les sessions du projet.
- **Vérifié par :** texte du panneau lu dans Chrome (tâche 9, étape 4), comparé à la chaîne attendue et à la sortie de `zsh scripts/count-tokens.sh` du jour.

**AC-3c-5 : jamais sous 30 images par seconde (spec AC-8, révisé le 2026-09-30)**
- **Comportement :** quand Romain joue une partie entière sur son Mac, éclatements et sortie des baies compris, alors aucune image ne met plus de 33,3 ms, et une image ne demande jamais 80 appels de dessin.
- **Vérifié par :** la ligne console `[agenthot] frames {…}` de fin de partie (tâche 9, étape 7) : `maxMs` ≤ 33,3 et `maxDrawCalls` < 80.
- **Révision :** l'ancien seuil était `worstWindowP95Ms` ≤ 20 (60 images par seconde, décision 4). La partie de Romain du 30/09 à 18 h 57 l'a dépassé : `worstWindowP95Ms` 25,7, `maxMs` 31,9, 63 appels de dessin. Romain a tranché à 19 h 01 : « Accepter, j'ai mon Mac qui fait beaucoup de chose... je ne veux pas perdre en qualité alors que j'ai une machine vieille lol. » Pas de diagnostic, le rendu ne bouge pas. **Tenu** avec le nouveau critère (31,9 ≤ 33,3 ; 63 < 80).
- **Backlog, sans y toucher :** la qualité auto oscille entre `res 1` et `res 0.85` (à regarder si des visiteurs se plaignent) ; l'occlusion ambiante pèse environ 75 % du temps d'image (levier `SSAONode`, qui changerait le rendu).

**AC-3c-6 : jouable en 2 secondes (spec AC-10)**
- **Comportement :** quand on ouvre l'adresse cache vide, alors « APPUIE SUR UNE TOUCHE » apparaît en 2 s au plus, et le poids transféré hors cinématique et musiques reste sous 3 Mo.
- **Vérifié par :** repère `agenthot:prompt` et somme des `transferSize`, lus dans Chrome : en local (tâche 9, étape 3) et sur le site réel (tâche 14, étape 5).

**AC-3c-7 : le repli WebGL2 se joue jusqu'au bout (spec AC-9)**
- **Comportement :** quand on lance le jeu avec `?renderer=webgl`, alors Romain gagne une partie, ombre des coins et lueur comprises.
- **Vérifié par :** Romain joue jusqu'à la victoire (tâche 9, étape 7) ; le panneau debug affiche `WebGL2`.

**AC-3c-8 : le téléphone est accueilli (spec AC-12)**
- **Comportement :** quand on ouvre le site sur un téléphone, alors on voit « Joue sur ordi », la cinématique en boucle et « Copier le lien », sans moteur ni erreur.
- **Vérifié par :** émulation iPhone et cas iPad dans Chrome, en local (tâche 9, étape 5) et sur le site réel (tâche 14, étape 4).

**AC-3c-9 : budgets tenus (spec AC-17)**
- **Comportement :** à la fin du chantier, alors la dépense de chaque outil reste sous son budget, et ce plan n'a rien dépensé.
- **Vérifié par :** `bun scripts/spend.ts summary` (code 0) et `git diff --stat main -- assets/ledger.jsonl` vide (tâche 9, étape 6).

**AC-3c-10 : le site répond**
- **Comportement :** quand on ouvre `https://agenthot.erom.cloud/`, alors le jeu se charge en HTTPS, certificat valide, et `http://` renvoie vers `https://`.
- **Vérifié par :** `curl -sI https://agenthot.erom.cloud/` (`HTTP/2 200`) et `curl -sI http://agenthot.erom.cloud/` (une redirection dont l'en-tête `location` commence par `https://`) (tâche 13, étape 5).

**AC-3c-11 : le lien des sources mène quelque part**
- **Comportement :** quand un visiteur suit l'adresse des crédits, alors il arrive sur le dépôt du jeu et lit son README.
- **Vérifié par :** `curl -s -o /dev/null -w "%{http_code}" https://github.com/eRom/agenthot-the-game` rend `200` sans être connecté (tâche 11, étape 5). Si Romain garde le dépôt privé, ce critère est déclaré non tenu, par choix.

**AC-3c-12 : les moteurs lisent la fiche du jeu**
- **Comportement :** quand un moteur de recherche lit `https://agenthot.erom.cloud/`, alors il y trouve une fiche du jeu (nom, description, gratuit, auteur, cinématique), un `robots.txt` qui l'autorise et un plan du site.
- **Vérifié par :** `bun scripts/check-release.ts https://agenthot.erom.cloud/` : lignes `structured data`, `robots.txt`, `sitemap.xml` en `ok` (tâche 13, étape 6) ; la fiche relue par `validator.schema.org` au navigateur, sans erreur (tâche 13b, étape 1).

**AC-3c-13 : les agents IA trouvent le jeu**
- **Comportement :** quand un agent lit `/llms.txt`, `/llms-full.txt` ou `/.well-known/ard.json`, alors il reçoit le fichier, dans le bon type de contenu, avec l'adresse du jeu.
- **Vérifié par :** `bun scripts/check-release.ts https://agenthot.erom.cloud/` : lignes `llms.txt served`, `llms-full.txt served`, `.well-known/ard.json served`, `.well-known/ai-catalog.json served` en `ok` (tâche 13, étape 6).

**AC-3c-14 : trois outils WebMCP répondent**
- **Comportement :** quand un navigateur expose `document.modelContext`, alors la page y enregistre `get_game_info`, `get_controls` et `get_credits`, en lecture seule, et chacun rend les faits du jeu.
- **Vérifié par :** sur `vite preview`, avec une API simulée : les trois noms et leurs réponses (tâche 9, étape 6b). Sur le site réel, dans Chrome, après le jeton d'origin trial : `"modelContext" in document` vaut `true` (tâche 13b, étape 3). Sans jeton, ce second point est déclaré non vérifié.

**AC-3c-15 : rien de tout ça ne ralentit le jeu**
- **Comportement :** quand un joueur ouvre le site dans un navigateur sans agent, alors l'invite arrive dans le même délai qu'avant, et le fichier des outils WebMCP n'est pas téléchargé.
- **Vérifié par :** tâche 9, étape 3 (l'invite, AC-3c-6) et étape 6b (`webmcpRequested: false`).

**AC-3c-16 : le dépôt public ne montre rien qu'il ne doit pas**
- **Comportement :** quand le dépôt devient public, alors son historique ne contient aucune clé, et aucun fichier local de Romain n'y est.
- **Vérifié par :** `gitleaks git` sur tout l'historique : `no leaks found` ; `git status --short` ne montre aucun fichier suivi à tort (tâche 11, étape 1).

## Structure des fichiers

```
scripts/        release.ts (nouveau : contrôles purs) ; check-release.ts (nouveau : ligne de commande)
                count-tokens.sh (nouveau : tokens et coût des sessions)
                og/icon.html (nouveau : gabarit de l'icône PNG) ; og/og.html, build-fonts.sh (modifiés : nouveau dossier des polices)
src/audio/      tracks/{game,menu,replay}.mp3 (déplacés depuis public/audio/) ; game-audio.ts (modifié : import)
src/ui/         video/intro.{webm,mp4} (déplacés depuis public/video/ ; le MP4 est contrôlé)
                fonts/*.woff2 (déplacés depuis public/fonts/) ; media.ts, tokens.css, credits.ts (modifiés)
src/rooms/      thumbnails/room-0{1,2}.webp (déplacés depuis public/rooms/) ; registry.ts (modifié : import)
src/app/        frame-stats.ts (nouveau : sonde AC-8) ; engine.ts (modifié : branchement)
tests/          release, frame-stats (nouveaux) ; credits (modifié)
public/         og-v1.jpg, fonts/LICENSES.txt (inchangés) ; favicon.svg, apple-touch-icon.png (nouveaux)
index.html      polices préchargées depuis src/ ; balises de partage ; icônes
vercel.json     (nouveau) ; .gitignore (modifié : .vercel/) ; README.md (nouveau)
```

Chaque fichier a une seule responsabilité :
- `release.ts` : ce qu'une page, une image et une liste de fichiers doivent respecter pour être mises en ligne. Pur, testé. `check-release.ts` le branche au disque (`dist`) ou au réseau (une adresse).
- Un fichier lourd vit à côté du module qui le lit (`src/audio/tracks/`, `src/ui/video/`, `src/rooms/thumbnails/`, `src/ui/fonts/`). Ajouter la salle 2 ne touche toujours que `src/rooms/` (spec AC-16).
- `frame-stats.ts` : un anneau de mesures et son rapport. `engine.ts` ne fait qu'y pousser une image.
- `public/` ne garde que ce qui doit avoir une adresse fixe : l'image de partage, les icônes, la licence des polices.

## Prototype vérifié

Tout le code de ce plan a été exécuté avant d'être écrit ici (2026-09-30), d'abord sur `main` au commit `cbc015c`, puis rejoué à 18 h sur `main` au commit `19bd64d`. Les lignes ci-dessous donnent les mesures du rejeu, sauf celles marquées « avant le nouveau rendu », prises au navigateur sur `cbc015c` et à reprendre à la tâche 9.
- **Rejeu par tâche dans un dossier vide :** `tsc` passe à chaque étape ; les diffs de ce plan s'appliquent dans l'ordre et redonnent exactement l'arbre du prototype. Suite : 282 → 302 (tâche 1) → 302 (2, 3, 4) → 309 (5) → 311 (6). Build final : point d'entrée 40,13 Ko (14,36 Ko gzip), moteur 1 010 Ko (282 Ko gzip).
- **Noms hachés :** après la tâche 2, tout ce qui pèse sort dans `dist/assets/` avec un hash, polices préchargées comprises (Vite réécrit les `<link rel="preload">` de `index.html`). `dist/` ne garde hors de `assets/` que `index.html`, `og-v1.jpg`, les deux icônes et `fonts/LICENSES.txt`. L'image de partage reconstruite avec les polices déplacées fait 59 914 octets, octet pour octet `public/og-v1.jpg` (`cmp`) : les polices se chargent bien depuis leur nouveau dossier.
- **MP4 au niveau 4.1 :** déjà fait avec la nouvelle cinématique (`af9bf26`). Lu le 2026-09-30 à 18 h sur `public/video/intro.mp4` : 5 789 099 octets, `h264`, `High`, `level=41`, 1920 × 1080, 30 images par seconde, 26,3 s, `moov` avant `mdat`, décodage complet sans erreur, aucune image figée.
- **Contrôle de mise en ligne :** sur le site construit, `release check: all good`. Lancé contre `vite preview`, il échoue là où il doit : 12 fichiers sans cache long et un fichier absent qui répond `200`. C'est exactement ce que Vercel doit corriger.
- **Invite (AC-10), avant le nouveau rendu :** sur `vite preview`, cache vide, l'invite arrive à 1 253 ms sans limite de réseau, et à 1 933 ms en « Fast 4G » (9 Mb/s, plus sévère que les 50 Mb/s de la spec). Ce qui la retarde alors, ce sont les attentes plafonnées à 1,5 s du plan 3a (polices, boucle du menu, début de la cinématique). Poids hors cinématique et musiques : 0,34 Mo.
- **Sonde d'images, avant le nouveau rendu :** au menu, 360 images en 6 s, `p95Ms` 17,5, 41 appels de dessin (62 à 70 depuis le nouveau rendu) ; en qualité « haute » (120 images par seconde), `p95Ms` 9,1. L'heure des images donnée par le navigateur porte environ 0,8 ms de gigue : une cadence parfaite de 60 se lit 17,5, pas 16,7.
- **Crédits :** `zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*`, le 2026-09-30 à 17 h 58 : 955 020 037 tokens, 373,80 $ (Opus 5.5 : 304,51 $ ; Sonnet 5.5 : 69,29 $). À 15 h 04 : 852 244 097 tokens, 328,19 $. Le total monte avec chaque session : il se mesure une dernière fois juste avant la fusion. Prix relus le 2026-09-30 sur `platform.claude.com/docs/en/about-claude/pricing`.
- **Écran mobile, avant le nouveau rendu :** émulation iPhone sur le site construit : « Joue sur ordi », vidéo `/assets/intro-….webm` en lecture, muette, aucun canvas, moteur non demandé.
- **Historique du dépôt (relu à `19bd64d`) :** aucune clé dans tout l'historique (0 résultat sur les motifs de clés Google, OpenRouter, Anthropic et GitHub).

**Ce qui n'a pas été exécuté, parce que ce sont les portes de Romain :** `git push`, toute commande `vercel` qui écrit, le DNS. Les commandes des tâches 11 à 13 viennent de l'aide de la CLI installée (`vercel <commande> --help`, version 59.20.0) et de la documentation lue le 2026-09-30 (section suivante). Elles sont données avec ce qu'elles doivent produire : si une commande répond autrement, on s'arrête et on lit son aide, on n'improvise pas.

## Faits vérifiés le 2026-09-30 (Vercel, Hostinger, balises de partage)

Lus dans la documentation en ligne, pas de mémoire. Chaque ligne cite sa source.

**Vercel**
- `vercel.json` : schéma `https://openapi.vercel.sh/vercel.json` ; clés `framework`, `buildCommand`, `outputDirectory`, `headers`. Exemple officiel : `{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31556952, immutable" }] }` (vercel.com/docs/project-configuration/vercel-json, mise à jour 2026-08-14).
- Cache par défaut d'un fichier statique : `public, max-age=0, must-revalidate`. Pas de cache long automatique pour Vite : une règle `headers` est nécessaire (vercel.com/docs/headers/cache-control-headers, 2026-09-14 ; sonde sur le gabarit Vite public de Vercel).
- `bun.lock` présent : Vercel installe avec `bun install` (vercel.com/docs/package-managers, 2026-08-11). Ce plan construit sur le Mac, donc ne s'appuie pas dessus.
- Pas de repli vers la page d'accueil : un fichier absent répond `404` (sonde sur le gabarit Vite public).
- Requêtes partielles : la sonde sur le gabarit Vite répond `206` avec `content-range`. Aucune déclaration officielle pour une vidéo : à contrôler sur notre site (tâche 13).
- Offre Hobby : 100 Go de transfert par mois, usage non commercial, projet mis en pause au dépassement (vercel.com/docs/plans/hobby, 2026-09-14).
- Le premier déploiement d'un projet neuf est toujours un déploiement de production (vercel.com/docs/deployments/environments, 2026-09-17).
- Protection des déploiements : activée par défaut sur un projet neuf. Elle protège tout sauf les domaines de production ; l'adresse `…-<hash>-….vercel.app` d'un déploiement est protégée (un `curl` y reçoit une page de connexion). Les contrôles se font donc sur le domaine de production (vercel.com/docs/deployment-protection, 2026-09-15).
- Sous-domaine avec DNS externe : chaque projet a sa propre cible CNAME, du type `d1d4fc829fe7bc7c.vercel-dns-017.com`. L'ancienne valeur `cname.vercel-dns.com` des tutoriels n'est plus la bonne. La valeur exacte se lit dans `vercel domains inspect` ou sur la carte du domaine (vercel.com/docs/domains/working-with-domains/add-a-domain, 2026-09-16).
- Certificat : Let's Encrypt, émis quelques minutes après la vérification du DNS. Pas d'enregistrement TXT pour un domaine jamais utilisé chez Vercel (vercel.com/docs/domains/set-up-custom-domain, 2026-08-11).

**Hostinger** (`erom.cloud`)
- État lu par `dig` le 2026-09-30 : serveurs de noms `aurora.dns-parking.com` et `nebula.dns-parking.com` ; aucun enregistrement pour `agenthot` ; aucun enregistrement CAA (rien ne bloque Let's Encrypt) ; durée du cache d'une réponse « n'existe pas » : 600 s.
- Un domaine sans hébergement a quand même son éditeur de zone : « go to Hostinger dashboard, click DNS in the sidebar, and select your domain » (hostinger.com/support/how-to-use-hostingers-dns-zone-editor). Chemin complet : Domains, DNS, le domaine, onglet « DNS records », section « Manage DNS records », « Add Record » (hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger).
- Champ « Name » : `agenthot` seul, le domaine est ajouté tout seul (hostinger.com/support/4738777-how-to-manage-cname-records-at-hostinger).

**Balises de partage**
- Quatre propriétés obligatoires : `og:title`, `og:type`, `og:image`, `og:url` (ogp.me). `og:image:alt` est attendue dès qu'il y a une image.
- Facebook : 1200 × 630 recommandé, 8 Mo au plus ; largeur et hauteur annoncées pour un rendu dès le premier partage (developers.facebook.com/docs/sharing/webmasters/images, 2026-06-30).
- WhatsApp : image sous 600 Ko ; balises dans les 300 premiers Ko du HTML ; description : « 80 characters will suffice » (developers.facebook.com/docs/whatsapp/link-previews, 2026-05-21). Le « 300 Ko » du brief était la limite des balises, pas celle de l'image.
- LinkedIn : 1200 × 627 au minimum pour la grande carte, 5 Mo au plus (linkedin.com/help/linkedin/answer/a521928).
- iMessage : image d'au moins 900 px de large ; une icône carrée d'au moins 108 px (`apple-touch-icon`) ; une balise `og:video` ferait télécharger et lancer la vidéo (Apple, note technique TN3156).
- X : la documentation des cartes a disparu du site de X. Les règles connues viennent des copies archivées : `twitter:card` à `summary_large_image` pour la grande carte, repli sur les balises `og:` pour le titre, la description et l'image. À voir en vrai, en collant le lien.
- Les plateformes gardent l'image en cache par URL : une nouvelle image change de nom (`og-v2.jpg`).

**Comment appliquer ce plan :**
- Un fichier **nouveau** est donné en entier : le recopier tel quel.
- Un fichier **modifié** est donné en diff unifié, produit par `git diff` sur le prototype. L'appliquer à la main (Edit), ou l'enregistrer dans un fichier puis `git apply <fichier>` depuis la racine. Les numéros de ligne supposent que les tâches précédentes sont faites.
- La tâche 6 contient des valeurs mesurées (tokens, coût) : le diff montre celles du prototype, à remplacer par la mesure du jour. `git apply` échouera sur ces lignes : appliquer à la main.

## Décisions prises en écrivant ce plan

Chacune est réversible ; Romain les relit avec le plan.
1. **Les fichiers lourds passent par Vite** (`import` depuis `src/`), qui leur donne un nom haché. Une seule règle de cache suffit alors : un an, immuable, sur `/assets/`. Battu : les laisser dans `public/` avec un cache long par dossier (un fichier remplacé sous le même nom resterait un an chez les visiteurs) ; des noms versionnés à la main (un oubli suffit).
2. **L'adresse du site est écrite en dur dans `index.html`** et contrôlée par `check-release.ts`. Battu : `%VITE_SITE_URL%` lu dans une variable d'environnement (une variable absente au build laisserait le texte `%VITE_SITE_URL%` dans la page, sans erreur ; et le fichier `.env` est hors de portée des agents).
3. **Déploiement par la CLI, site construit sur le Mac** (`vercel build`, puis `vercel deploy --prebuilt`). Ce qui part est ce qui a été contrôlé, et chaque mise en ligne est un geste voulu. Battu : l'intégration Git de Vercel (chaque push déploierait sans go, ce qui confond deux portes) ; `vercel deploy` sans `--prebuilt` (il enverrait les sources du dossier, fichiers non commités de Romain compris).
4. **AC-8 se lit avec une sonde du jeu, seuil à 20 ms.** La sonde mesure l'intervalle entre deux images sur la pire fenêtre de 2 s de la partie. Une cadence parfaite de 60 s'y lit 17,5 ms (gigue de l'horloge du navigateur), une image sautée 25 ms sur l'écran 120 Hz de Romain et 33 ms sur un écran 60 Hz. Le seuil de 20 ms sépare les deux sans ambiguïté. Battu : le « 16,7 ms » de la spec lu à la lettre (une partie parfaite échouerait pour 0,8 ms de gigue) ; une trace DevTools dépouillée à la main (non rejouable, et l'outil MCP ne donne pas de centile d'images).
5. **AC-10 se mesure en « Fast 4G »**, le préréglage de l'outil, cinq fois plus sévère que les 50 Mb/s de la spec : s'il passe là, il passe à 50 Mb/s. Battu : un débit de 50 Mb/s exact (l'outil MCP n'a que des préréglages ; il faudrait un profil réglé à la main par Romain, gardé comme repli si la mesure sévère échoue).
6. **Icône du site : un losange orange à facettes sur fond `void`**, en SVG, plus un PNG de 180 px pour iMessage. C'est le losange du menu. Romain le voit à la tâche 9. Battu : pas d'icône (l'onglet reste vide, iMessage n'a rien à montrer, et chaque visite déclenche une requête `/favicon.ico` en 404).
7. **Pas de `og:site_name`, pas de `og:video`, pas de doublons `twitter:title` et compagnie.** Le titre est déjà le nom du site ; une vidéo déclarée serait téléchargée et lancée par iMessage ; X se replie sur les balises `og:`. Seule `twitter:card` est écrite.
8. **Texte de la carte :** « Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur. » (77 caractères, sous les 80 de WhatsApp). Battu : les deux lignes de l'image reprises telles quelles (elles sont déjà dans l'image).
9. **README en français, court**, avec le lien du jeu, les commandes et la façon dont il a été fait. C'est la page où mène le lien des crédits. Battu : pas de README (le lien des sources mènerait à une liste de fichiers).
10. **Le compte des tokens échoue si un modèle n'a pas de prix.** Un total sous-évalué dans les crédits serait un mensonge par omission. Les sessions ouvertes dans un autre dossier (une idéation faite ailleurs) ne sont pas comptées : le total est un plancher.
11. **Le dépôt devient public au push** si Romain le confirme à la porte 1 : sans cela, le lien des crédits mène à une page 404 pour tout visiteur. Battu : le rendre public sans demander (tout le chantier devient lisible : plans, notes, revues).
12. **Hors de ce plan, gardé au backlog :** les points 2 à 4 de la revue du 3b (scripts payants, avant toute dépense) ; ses points 8 à 17 ; les points 5 à 15 de la revue du 3a ; l'adresse des crédits rendue cliquable ; AC-18 (trois testeurs), qui demande des joueurs et se fait après la mise en ligne.

---

### Task 1 : le contrôle de mise en ligne

Un outil rejouable qui dit si le site est prêt à être partagé et mis en cache : sur le dossier construit avant l'envoi, puis sur l'adresse réelle après. Les règles sont pures et testées ; la ligne de commande les branche au disque et au réseau. À la fin de cette tâche le contrôle **échoue** sur le site actuel : c'est voulu, les tâches 2 et 4 le font passer.

**Files :**
- Create : `scripts/release.ts`, `scripts/check-release.ts`
- Test : `tests/release.test.ts`

**Interfaces :**
- Consumes : rien.
- Produces :
  - `SITE_URL: "https://agenthot.erom.cloud/"`
  - `SHARE_LIMITS` : `descriptionChars: 80`, `titleChars: 60`, `imageBytes: 600_000`, `headBytes: 300_000`, `imageWidth: 1200`, `imageHeight: 630`, `uncachedFileBytes: 150_000`
  - `readShareTags(html: string): ShareTags` avec `ShareTags = { title: string | null; canonical: string | null; meta: Record<string, string>; icons: Record<string, string> }`
  - `shareProblems(html: string, siteUrl: string): string[]`
  - `jpegSize(bytes: Uint8Array): { width: number; height: number } | null`
  - `imageProblems(bytes: Uint8Array, html: string): string[]`
  - `cacheProblems(files: readonly BuiltFile[]): string[]` avec `BuiltFile = { path: string; bytes: number }`
  - `assetPaths(text: string): string[]`
  - `isLongCache(cacheControl: string | null): boolean`
  - Ligne de commande : `bun scripts/check-release.ts <dist | https://site/>`, code 0 si tout passe, 1 sinon.

- [ ] **Step 1 : écrire les tests**

`tests/release.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import {
  SHARE_LIMITS,
  SITE_URL,
  assetPaths,
  cacheProblems,
  imageProblems,
  isLongCache,
  jpegSize,
  readShareTags,
  shareProblems,
} from "../scripts/release";

// Une page prête à être partagée. `patch` remplace ou retire (null) une balise <meta>, par sa clé.
function page(patch: Record<string, string | null> = {}, extraHead = ""): string {
  const meta: Record<string, string | null> = {
    description: "Un FPS où le temps n'avance que quand tu bouges.",
    "og:type": "website",
    "og:url": SITE_URL,
    "og:title": "AGENTHOT",
    "og:description": "Un FPS où le temps n'avance que quand tu bouges.",
    "og:locale": "fr_FR",
    "og:image": `${SITE_URL}og-v1.jpg`,
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": "Un ennemi orange vole en éclats.",
    "twitter:card": "summary_large_image",
    ...patch,
  };
  const lines = Object.entries(meta)
    .filter(([, content]) => content !== null)
    .map(([key, content]) => `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${content}" />`);
  return `<!doctype html><html lang="fr"><head><meta charset="UTF-8" /><title>AGENTHOT</title>
    <link rel="canonical" href="${SITE_URL}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    ${lines.join("\n    ")}
    ${extraHead}</head><body></body></html>`;
}

// En-tête JPEG minimal : SOI, un segment APP0, puis un SOF0 qui porte la taille.
function jpeg(width: number, height: number, totalBytes = 64): Uint8Array {
  const bytes = new Uint8Array(totalBytes);
  bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  bytes.set([height >> 8, height & 0xff, width >> 8, width & 0xff], 13);
  return bytes;
}

describe("balises de partage (spec 4.7)", () => {
  test("une page complète n'a aucun problème", () => {
    expect(shareProblems(page(), SITE_URL)).toEqual([]);
  });

  test("les balises se lisent quel que soit l'ordre de leurs attributs", () => {
    const tags = readShareTags(`<head><title> AGENTHOT </title><meta content="website" property="og:type"><link href="${SITE_URL}" rel="canonical"></head>`);
    expect(tags.title).toBe("AGENTHOT");
    expect(tags.meta["og:type"]).toBe("website");
    expect(tags.canonical).toBe(SITE_URL);
  });

  test("chaque balise exigée par une plateforme est réclamée quand elle manque", () => {
    for (const key of ["og:title", "og:type", "og:url", "og:image", "og:description", "og:image:alt", "twitter:card"]) {
      expect(shareProblems(page({ [key]: null }), SITE_URL)).toContain(`missing meta: ${key}`);
    }
  });

  test("une image en chemin relatif ou sur un autre domaine est refusée : les robots veulent une URL absolue du site", () => {
    expect(shareProblems(page({ "og:image": "/og-v1.jpg" }), SITE_URL)).toEqual(["og:image is not an absolute URL of the site: /og-v1.jpg"]);
    expect(shareProblems(page({ "og:image": "http://agenthot.erom.cloud/og-v1.jpg" }), SITE_URL)).toHaveLength(1);
  });

  test("og:url et le lien canonique sont l'adresse du site, barre finale comprise", () => {
    expect(shareProblems(page({ "og:url": "https://agenthot.erom.cloud" }), SITE_URL)).toEqual([
      `og:url is https://agenthot.erom.cloud, expected ${SITE_URL}`,
    ]);
    expect(shareProblems(page().replace(`rel="canonical" href="${SITE_URL}"`, 'rel="canonical" href="https://example.com/"'), SITE_URL)).toEqual([
      `canonical is https://example.com/, expected ${SITE_URL}`,
    ]);
  });

  test("une description trop longue pour WhatsApp est refusée, 80 caractères passent", () => {
    const ok = "x".repeat(SHARE_LIMITS.descriptionChars);
    expect(shareProblems(page({ description: ok, "og:description": ok }), SITE_URL)).toEqual([]);
    const long = `${ok}x`;
    expect(shareProblems(page({ description: long, "og:description": long }), SITE_URL)).toEqual(["og:description has 81 characters (max 80)"]);
  });

  test("la petite carte de X, une description qui diverge, un doublon Twitter différent : refusés", () => {
    expect(shareProblems(page({ "twitter:card": "summary" }), SITE_URL)).toEqual(["twitter:card is summary, expected summary_large_image"]);
    expect(shareProblems(page({ description: "Autre texte." }), SITE_URL)).toEqual(["description differs from og:description"]);
    expect(shareProblems(page({ "twitter:title": "Autre" }), SITE_URL)).toEqual(["twitter:title differs from og:title"]);
  });

  test("aucun tiret cadratin dans un texte lu par un tiers", () => {
    const dash = String.fromCodePoint(0x2014);
    const text = `Bouge ${dash} le temps repart.`;
    expect(shareProblems(page({ description: text, "og:description": text }), SITE_URL)).toEqual(["og:description contains an em dash"]);
  });

  test("une vidéo déclarée est refusée : iMessage la téléchargerait et la lancerait", () => {
    expect(shareProblems(page({ "og:video": `${SITE_URL}intro.mp4` }), SITE_URL)).toEqual(["og:video must not be declared"]);
  });

  test("sans icône, iMessage n'a rien à montrer à côté du titre", () => {
    expect(shareProblems(page().replace(/<link rel="apple-touch-icon"[^>]*>/, ""), SITE_URL)).toEqual(["missing link: apple-touch-icon"]);
  });

  test("des balises repoussées au-delà de 300 Ko sont refusées (WhatsApp ne lit pas plus loin)", () => {
    const padding = `<style>${"a".repeat(SHARE_LIMITS.headBytes)}</style>`;
    expect(shareProblems(page({}, padding), SITE_URL)).toHaveLength(1);
  });
});

describe("image de partage (spec 4.7)", () => {
  test("la taille d'un JPEG se lit dans son en-tête ; un autre fichier est refusé", () => {
    expect(jpegSize(jpeg(1200, 630))).toEqual({ width: 1200, height: 630 });
    expect(jpegSize(new TextEncoder().encode("<!doctype html>"))).toBeNull();
    expect(jpegSize(new Uint8Array(0))).toBeNull();
  });

  test("1200 x 630, annoncée telle quelle, sous la limite de poids : rien à dire", () => {
    expect(imageProblems(jpeg(1200, 630), page())).toEqual([]);
  });

  test("une image d'une autre taille que celle annoncée par la page est signalée", () => {
    expect(imageProblems(jpeg(1200, 600), page())).toHaveLength(2);
    expect(imageProblems(jpeg(1200, 630), page({ "og:image:height": "600" }))).toHaveLength(1);
  });

  test("une image trop lourde pour WhatsApp est signalée ; la page d'erreur d'un hébergeur aussi", () => {
    expect(imageProblems(jpeg(1200, 630, SHARE_LIMITS.imageBytes + 1), page())).toEqual([
      `share image weighs ${SHARE_LIMITS.imageBytes + 1} bytes (max ${SHARE_LIMITS.imageBytes})`,
    ]);
    expect(imageProblems(new TextEncoder().encode("<html>404</html>"), page())).toEqual(["share image is not a readable JPEG"]);
  });
});

describe("cache long (spec 9.2)", () => {
  test("des fichiers hachés dans assets/ et une racine légère : rien à dire", () => {
    expect(
      cacheProblems([
        { path: "index.html", bytes: 2_000 },
        { path: "og-v1.jpg", bytes: 100_492 },
        { path: "fonts/LICENSES.txt", bytes: 13_463 },
        { path: "assets/menu-CjAL0G59.mp3", bytes: 1_542_076 },
        { path: "assets/index-CM23-0fS.css", bytes: 13_390 },
      ]),
    ).toEqual([]);
  });

  test("un fichier lourd resté hors de assets/ est signalé : il serait retéléchargé à chaque visite", () => {
    expect(cacheProblems([{ path: "audio/menu.mp3", bytes: 1_542_076 }])).toEqual([
      "1542076 bytes outside assets/, fetched again at every visit: audio/menu.mp3",
    ]);
  });

  test("un fichier sans hash dans assets/ est signalé : gardé un an, il ne pourrait plus changer", () => {
    expect(cacheProblems([{ path: "assets/menu.mp3", bytes: 10 }])).toEqual(["no hash in the name, yet cached for a year: assets/menu.mp3"]);
  });

  test("les chemins assets/ d'une page ou d'un script sont relevés une seule fois", () => {
    const text = `<script src="/assets/index-aKrfwPH4.js"></script> x="/assets/intro-DiTX2XMp.mp4" y="/assets/index-aKrfwPH4.js"`;
    expect(assetPaths(text)).toEqual(["/assets/index-aKrfwPH4.js", "/assets/intro-DiTX2XMp.mp4"]);
  });

  test("l'en-tête d'un an immuable est reconnu, celui par défaut de l'hébergeur non", () => {
    expect(isLongCache("public, max-age=31536000, immutable")).toBe(true);
    expect(isLongCache("public, max-age=0, must-revalidate")).toBe(false);
    expect(isLongCache("public, max-age=31536000")).toBe(false);
    expect(isLongCache(null)).toBe(false);
  });
});
```

- [ ] **Step 2 : les lancer, ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/release.test.ts 2>&1 | tail -8`
Expected : FAIL, `Cannot find module '../scripts/release'`.

- [ ] **Step 3 : écrire les règles**

`scripts/release.ts` :

```ts
// Contrôles de mise en ligne (spec 4.7 et 9.2) : ce qu'un robot de partage lira dans la page, et ce que le cache
// long exige des fichiers. Logique pure : scripts/check-release.ts la branche au disque et au réseau.

// Adresse publique du jeu (décision de Romain, 2026-09-30). La barre finale compte : og:url et le lien canonique
// doivent être identiques à l'octet près.
export const SITE_URL = "https://agenthot.erom.cloud/";

// Limites les plus strictes relevées le 2026-09-30 dans la documentation des plateformes.
export const SHARE_LIMITS = {
  // WhatsApp : « 80 characters will suffice » (developers.facebook.com/docs/whatsapp/link-previews).
  descriptionChars: 80,
  // X : « max 70 characters » (documentation archivée) ; 60 laisse une marge aux autres.
  titleChars: 60,
  // WhatsApp : image « under 600KB ».
  imageBytes: 600_000,
  // WhatsApp : les balises doivent tenir dans les 300 premiers Ko du HTML.
  headBytes: 300_000,
  // Facebook et LinkedIn : 1200 × 630 (1,91:1), rendu en grand format.
  imageWidth: 1200,
  imageHeight: 630,
  // Un fichier hors de assets/ est revalidé à chaque visite : il doit rester léger.
  uncachedFileBytes: 150_000,
} as const;

export interface ShareTags {
  title: string | null;
  canonical: string | null;
  // Contenu des <meta>, par `property` (Open Graph) ou `name` (Twitter, description).
  meta: Record<string, string>;
  // `rel` → `href` des <link> d'icône.
  icons: Record<string, string>;
}

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g)) out[match[1]!.toLowerCase()] = match[2]!;
  return out;
}

// Lit les balises de partage d'une page statique, comme le fait un robot : sans exécuter de script.
export function readShareTags(html: string): ShareTags {
  const tags: ShareTags = { title: null, canonical: null, meta: {}, icons: {} };
  tags.title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = attrs.property ?? attrs.name;
    if (key !== undefined && attrs.content !== undefined) tags.meta[key] = attrs.content;
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.rel === undefined || attrs.href === undefined) continue;
    if (attrs.rel === "canonical") tags.canonical = attrs.href;
    if (attrs.rel === "icon" || attrs.rel === "apple-touch-icon") tags.icons[attrs.rel] = attrs.href;
  }
  return tags;
}

const REQUIRED_META = [
  "description",
  "og:type",
  "og:url",
  "og:title",
  "og:description",
  "og:locale",
  "og:image",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "twitter:card",
] as const;

// Tiret cadratin : banni de tout texte lu par un tiers (règle de Romain).
const EM_DASH = String.fromCodePoint(0x2014);

// Ce qui empêcherait un aperçu correct du lien. Liste vide : la page est prête à être partagée.
export function shareProblems(html: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const tags = readShareTags(html);
  const meta = tags.meta;
  for (const key of REQUIRED_META) if (!meta[key]) problems.push(`missing meta: ${key}`);
  if (!tags.title) problems.push("missing <title>");
  if (meta["og:url"] && meta["og:url"] !== siteUrl) problems.push(`og:url is ${meta["og:url"]}, expected ${siteUrl}`);
  if (tags.canonical !== siteUrl) problems.push(`canonical is ${tags.canonical}, expected ${siteUrl}`);
  const image = meta["og:image"];
  if (image && !image.startsWith(siteUrl)) problems.push(`og:image is not an absolute URL of the site: ${image}`);
  if (meta["twitter:card"] && meta["twitter:card"] !== "summary_large_image") {
    problems.push(`twitter:card is ${meta["twitter:card"]}, expected summary_large_image`);
  }
  // Les doublons Twitter, s'ils existent, disent la même chose que l'Open Graph.
  for (const key of ["title", "description", "image", "image:alt"]) {
    const twitter = meta[`twitter:${key}`];
    if (twitter !== undefined && twitter !== meta[`og:${key}`]) problems.push(`twitter:${key} differs from og:${key}`);
  }
  if (meta.description && meta.description !== meta["og:description"]) problems.push("description differs from og:description");
  const title = meta["og:title"] ?? "";
  const description = meta["og:description"] ?? "";
  if (title.length > SHARE_LIMITS.titleChars) problems.push(`og:title has ${title.length} characters (max ${SHARE_LIMITS.titleChars})`);
  if (description.length > SHARE_LIMITS.descriptionChars) {
    problems.push(`og:description has ${description.length} characters (max ${SHARE_LIMITS.descriptionChars})`);
  }
  for (const key of ["og:title", "og:description", "og:image:alt"]) {
    if (meta[key]?.includes(EM_DASH)) problems.push(`${key} contains an em dash`);
  }
  // Une vidéo déclarée serait téléchargée et lancée par iMessage, et récupérée par Slack (Apple TN3156).
  if (Object.keys(meta).some((key) => key.startsWith("og:video"))) problems.push("og:video must not be declared");
  if (!tags.icons["apple-touch-icon"]) problems.push("missing link: apple-touch-icon");
  if (!tags.icons.icon) problems.push("missing link: icon");
  const headEnd = html.search(/<\/head>/i);
  const headBytes = new TextEncoder().encode(html.slice(0, Math.max(0, headEnd))).length;
  if (headEnd < 0) problems.push("missing </head>");
  else if (headBytes > SHARE_LIMITS.headBytes) problems.push(`<head> ends after ${headBytes} bytes (max ${SHARE_LIMITS.headBytes})`);
  return problems;
}

// Taille en pixels d'un JPEG, lue dans son en-tête (segment SOF) ; null si ce n'est pas un JPEG lisible.
export function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1]!;
    const length = (bytes[at + 2]! << 8) | bytes[at + 3]!;
    // SOF0 à SOF15, sauf DHT (C4), JPG (C8) et DAC (CC) : hauteur puis largeur, sur deux octets chacune.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (bytes[at + 5]! << 8) | bytes[at + 6]!, width: (bytes[at + 7]! << 8) | bytes[at + 8]! };
    }
    at += 2 + length;
  }
  return null;
}

// L'image de partage face à ce que la page annonce et aux limites des plateformes.
export function imageProblems(bytes: Uint8Array, html: string): string[] {
  const problems: string[] = [];
  const meta = readShareTags(html).meta;
  const size = jpegSize(bytes);
  if (!size) return ["share image is not a readable JPEG"];
  if (size.width !== SHARE_LIMITS.imageWidth || size.height !== SHARE_LIMITS.imageHeight) {
    problems.push(`share image is ${size.width}x${size.height}, expected ${SHARE_LIMITS.imageWidth}x${SHARE_LIMITS.imageHeight}`);
  }
  if (String(size.width) !== meta["og:image:width"] || String(size.height) !== meta["og:image:height"]) {
    problems.push(`og:image:width/height announce ${meta["og:image:width"]}x${meta["og:image:height"]}, the file is ${size.width}x${size.height}`);
  }
  if (bytes.length > SHARE_LIMITS.imageBytes) problems.push(`share image weighs ${bytes.length} bytes (max ${SHARE_LIMITS.imageBytes})`);
  return problems;
}

export interface BuiltFile {
  // Chemin relatif à la racine du site, sans barre initiale : « assets/menu-CjAL0G59.mp3 ».
  path: string;
  bytes: number;
}

// Nom produit par Vite : « nom-<8 caractères de hash>.ext ».
const HASHED_NAME = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

// Le cache long (un an, immuable) ne vaut que pour assets/ : tout y porte un hash, et rien de lourd ne vit ailleurs.
export function cacheProblems(files: readonly BuiltFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (file.path.startsWith("assets/")) {
      if (!HASHED_NAME.test(file.path)) problems.push(`no hash in the name, yet cached for a year: ${file.path}`);
    } else if (file.bytes > SHARE_LIMITS.uncachedFileBytes) {
      problems.push(`${file.bytes} bytes outside assets/, fetched again at every visit: ${file.path}`);
    }
  }
  return problems;
}

// Chemins « /assets/… » cités dans une page ou un script, sans doublon.
export function assetPaths(text: string): string[] {
  return [...new Set([...text.matchAll(/\/assets\/[A-Za-z0-9_.-]+/g)].map((match) => match[0]))];
}

// En-tête attendu sur tout fichier de assets/ (vercel.json).
export function isLongCache(cacheControl: string | null): boolean {
  const value = cacheControl ?? "";
  return /(^|[,\s])immutable($|[,\s])/.test(value) && /max-age=31536000\b/.test(value);
}
```

- [ ] **Step 4 : les tests passent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/release.test.ts 2>&1 | tail -5`
Expected : `20 pass`, `0 fail`.

- [ ] **Step 5 : écrire la ligne de commande**

`scripts/check-release.ts` :

```ts
// Contrôle de mise en ligne (spec 4.7 et 9.2). Usage :
//   bun scripts/check-release.ts dist
//       le site construit, avant tout envoi : balises de partage, image, icônes, noms hachés
//   bun scripts/check-release.ts https://agenthot.erom.cloud/
//       le site en ligne, vu par un robot de partage : les mêmes contrôles, plus les en-têtes de cache,
//       la lecture partielle de la vidéo (206) et la réponse à un fichier absent (404)
// Code 0 si tout passe, 1 sinon. Chaque ligne dit ce qui a été vérifié.
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { type BuiltFile, SITE_URL, assetPaths, cacheProblems, imageProblems, isLongCache, readShareTags, shareProblems } from "./release";

const USAGE = "usage: bun scripts/check-release.ts <dist directory | https://site/>";
// Le robot de Facebook : le plus répandu, et celui dont la documentation donne la chaîne exacte.
const CRAWLER = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
// Type attendu par extension : un type faux, et Safari refuse la vidéo ou la police.
const CONTENT_TYPES: Record<string, string> = {
  js: "javascript",
  css: "text/css",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  woff2: "font/woff2",
  webp: "image/webp",
};

let failures = 0;
function report(ok: boolean, label: string, detail = ""): void {
  if (!ok) failures++;
  console.info(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
}
function reportProblems(label: string, problems: string[]): void {
  if (problems.length === 0) report(true, label);
  for (const problem of problems) report(false, label, problem);
}

async function listFiles(root: string, dir = ""): Promise<BuiltFile[]> {
  const files: BuiltFile[] = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else files.push({ path, bytes: (await stat(join(root, path))).size });
  }
  return files;
}

// Chemin local d'une URL du site : « https://agenthot.erom.cloud/og-v1.jpg » → « og-v1.jpg ».
function sitePath(url: string): string {
  return url.startsWith(SITE_URL) ? url.slice(SITE_URL.length) : url.replace(/^\//, "");
}

async function checkDirectory(root: string): Promise<void> {
  const indexFile = Bun.file(join(root, "index.html"));
  if (!(await indexFile.exists())) {
    console.error(`no index.html in ${root}: run "bun run build" first`);
    process.exit(1);
  }
  const html = await indexFile.text();
  reportProblems("share tags", shareProblems(html, SITE_URL));
  const tags = readShareTags(html);
  const imageUrl = tags.meta["og:image"];
  const image = Bun.file(join(root, sitePath(imageUrl ?? "")));
  if (!imageUrl) report(false, "share image", "no og:image to read");
  else if (await image.exists()) reportProblems("share image", imageProblems(new Uint8Array(await image.arrayBuffer()), html));
  else report(false, "share image", `file not found: ${sitePath(imageUrl)}`);
  for (const [rel, href] of Object.entries(tags.icons)) report(await Bun.file(join(root, sitePath(href))).exists(), `icon ${rel}`, href);
  const files = await listFiles(root);
  reportProblems("long cache", cacheProblems(files));
  // Tout fichier cité par la page ou par un script existe dans le site construit.
  const scripts = files.filter((file) => file.path.endsWith(".js"));
  const cited = new Set(assetPaths(html));
  for (const script of scripts) for (const path of assetPaths(await Bun.file(join(root, script.path)).text())) cited.add(path);
  const missing = [...cited].filter((path) => !files.some((file) => `/${file.path}` === path));
  report(missing.length === 0, `${cited.size} cited assets exist`, missing.join(", "));
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  console.info(`     ${files.length} files, ${(total / 1e6).toFixed(1)} MB`);
}

async function checkSite(base: string): Promise<void> {
  const get = (path: string, headers: Record<string, string> = {}): Promise<Response> =>
    fetch(new URL(path, base), { headers: { "User-Agent": CRAWLER, ...headers }, redirect: "manual" });
  const page = await get("");
  report(page.status === 200 && (page.headers.get("content-type") ?? "").includes("text/html"), "page answers a crawler", `${page.status} ${page.headers.get("content-type")}`);
  const html = await page.text();
  reportProblems("share tags", shareProblems(html, SITE_URL));
  const tags = readShareTags(html);
  // Avant le branchement du domaine, l'image se lit sur l'adresse contrôlée (l'URL annoncée reste celle du domaine).
  const imageUrl = tags.meta["og:image"];
  if (!imageUrl) report(false, "share image", "no og:image to read");
  else {
    const image = await get(sitePath(imageUrl));
    report(image.status === 200 && image.headers.get("content-type") === "image/jpeg", "share image served", `${image.status} ${image.headers.get("content-type")}`);
    reportProblems("share image", imageProblems(new Uint8Array(await image.arrayBuffer()), html));
  }
  for (const [rel, href] of Object.entries(tags.icons)) {
    const icon = await get(sitePath(href));
    report(icon.status === 200 && (icon.headers.get("content-type") ?? "").startsWith("image/"), `icon ${rel}`, `${icon.status} ${icon.headers.get("content-type")}`);
  }
  // Fichiers cités par la page, puis par ses scripts (musiques, vidéos, vignettes).
  const cited = new Set(assetPaths(html));
  for (const path of [...cited].filter((path) => path.endsWith(".js"))) for (const found of assetPaths(await (await get(path)).text())) cited.add(found);
  for (const path of cited) {
    const response = await get(path, { Range: "bytes=0-99" });
    const extension = path.slice(path.lastIndexOf(".") + 1);
    const type = response.headers.get("content-type") ?? "";
    const expected = CONTENT_TYPES[extension];
    const cache = response.headers.get("cache-control");
    // 206 : lecture partielle, que Safari exige pour lire une vidéo. Les autres fichiers peuvent répondre en entier
    // (un script compressé à la volée n'a pas à honorer la plage).
    const partial = response.status === 206 && (response.headers.get("content-range") ?? "").startsWith("bytes 0-99/");
    const served = extension === "mp4" || extension === "webm" ? partial : partial || response.status === 200;
    report(served && isLongCache(cache) && (expected === undefined || type.includes(expected)), path, `${response.status} ${type} ${cache}`);
    await response.arrayBuffer();
  }
  report([...cited].some((path) => path.endsWith(".mp4")) && [...cited].some((path) => path.endsWith(".webm")), "both intro videos are cited");
  // Un fichier absent doit répondre 404 : un repli vers la page (200 text/html) ferait passer un son absent pour présent.
  const absent = await get("assets/missing-00000000.mp3");
  report(absent.status === 404, "missing file answers 404", String(absent.status));
}

const target = process.argv[2];
if (!target) {
  console.error(USAGE);
  process.exit(1);
}
if (/^https?:\/\//.test(target)) await checkSite(target.endsWith("/") ? target : `${target}/`);
else await checkDirectory(target);
console.info(failures === 0 ? "release check: all good" : `release check: ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 6 : le contrôle tourne et dit ce qui manque**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist`
Expected : `tsc` sans erreur ; le contrôle sort en code 1 avec `release check: 21 problem(s)` :
- 15 lignes `FAIL share tags` (les 12 balises manquantes, le lien canonique, les deux icônes) ;
- `FAIL share image (no og:image to read)` ;
- 5 lignes `FAIL long cache (… bytes outside assets/, fetched again at every visit: …)` pour `video/intro.webm`, `video/intro.mp4`, `audio/menu.mp3`, `audio/replay.mp3`, `audio/game.mp3` ;
- `ok   2 cited assets exist`.

Puis la suite entière : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tail -4`. Expected : `302 pass`, `0 fail`.

- [ ] **Step 7 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/release.ts scripts/check-release.ts tests/release.test.ts && git commit -m "feat(release): check share tags, share image and long-cache file names"
```

---

### Task 2 : les fichiers lourds prennent un nom haché

Musiques, cinématique, vignettes et polices quittent `public/` pour vivre à côté du module qui les lit. Vite les copie dans `dist/assets/` sous un nom qui change avec leur contenu. La licence des polices reste servie à `/fonts/LICENSES.txt`, l'image de partage à `/og-v1.jpg`.

**Files :**
- Move : `public/audio/{game,menu,replay}.mp3` → `src/audio/tracks/` ; `public/video/intro.{webm,mp4}` → `src/ui/video/` ; `public/rooms/room-0{1,2}.webp` → `src/rooms/thumbnails/` ; `public/fonts/*.woff2` → `src/ui/fonts/`
- Modify : `src/audio/game-audio.ts`, `src/audio/music.ts` (commentaires), `src/ui/media.ts`, `src/rooms/registry.ts`, `src/ui/tokens.css`, `index.html`, `scripts/og/og.html`, `scripts/build-fonts.sh`, `tests/music-loop.test.ts` et `tests/loop-measure.test.ts` (commentaires)

**Interfaces :**
- Consumes : `bun scripts/check-release.ts dist` (tâche 1).
- Produces : rien ne change pour le reste du code. `INTRO_VIDEO.webm`, `INTRO_VIDEO.mp4` (`src/ui/media.ts`) et `RoomEntry.thumbnail` (`src/rooms/registry.ts`) restent des chaînes : ce sont maintenant les adresses hachées données par Vite. Le type `vite/client`, déjà dans `tsconfig.json`, déclare ces imports.

- [ ] **Step 1 : déplacer les fichiers**

```bash
cd /Users/recarnot/dev/claudehot-videogame && mkdir -p src/audio/tracks src/ui/video src/rooms/thumbnails src/ui/fonts
cd /Users/recarnot/dev/claudehot-videogame && git mv public/audio/game.mp3 public/audio/menu.mp3 public/audio/replay.mp3 src/audio/tracks/
cd /Users/recarnot/dev/claudehot-videogame && git mv public/video/intro.webm public/video/intro.mp4 src/ui/video/
cd /Users/recarnot/dev/claudehot-videogame && git mv public/rooms/room-01.webp public/rooms/room-02.webp src/rooms/thumbnails/
cd /Users/recarnot/dev/claudehot-videogame && git mv public/fonts/big-shoulders-display-800.woff2 public/fonts/big-shoulders-display-900.woff2 public/fonts/chakra-petch-500.woff2 public/fonts/chakra-petch-600.woff2 public/fonts/martian-mono-300-400.woff2 src/ui/fonts/
```

Expected : `ls public public/fonts` montre `fonts og-v1.jpg` puis `LICENSES.txt` seul.

- [ ] **Step 2 : appliquer les changements de chemin**

```diff
diff --git a/index.html b/index.html
index e5ac009..61a6f1a 100644
--- a/index.html
+++ b/index.html
@@ -6,9 +6,9 @@
     <meta name="theme-color" content="#0d111b" />
     <title>AGENTHOT</title>
     <!-- Polices du logo et des petits textes, préchargées : le chargeur les affiche dès la première seconde. -->
-    <link rel="preload" href="/fonts/big-shoulders-display-900.woff2" as="font" type="font/woff2" crossorigin />
-    <link rel="preload" href="/fonts/martian-mono-300-400.woff2" as="font" type="font/woff2" crossorigin />
-    <link rel="preload" href="/fonts/chakra-petch-600.woff2" as="font" type="font/woff2" crossorigin />
+    <link rel="preload" href="/src/ui/fonts/big-shoulders-display-900.woff2" as="font" type="font/woff2" crossorigin />
+    <link rel="preload" href="/src/ui/fonts/martian-mono-300-400.woff2" as="font" type="font/woff2" crossorigin />
+    <link rel="preload" href="/src/ui/fonts/chakra-petch-600.woff2" as="font" type="font/woff2" crossorigin />
   </head>
   <body>
     <div id="app"></div>
diff --git a/scripts/build-fonts.sh b/scripts/build-fonts.sh
index 76b7837..e047f26 100644
--- a/scripts/build-fonts.sh
+++ b/scripts/build-fonts.sh
@@ -2,14 +2,16 @@
 # Polices de l'interface (spec 3 et 6.3), auto-hébergées en woff2 : sous-ensemble latin + français.
 # Sources : dépôt google/fonts, figé au commit ci-dessous. Licence SIL OFL 1.1 sans nom réservé : sous-ensemble et
 # conversion permis sans renommage, à condition de livrer la licence (public/fonts/LICENSES.txt).
-# Usage : zsh scripts/build-fonts.sh   (réseau + uvx ; écrit public/fonts/)
+# Usage : zsh scripts/build-fonts.sh   (réseau + uvx ; écrit src/ui/fonts/ et public/fonts/LICENSES.txt)
 set -euo pipefail
 # Date figée dans les fichiers produits (fontTools la lit) et versions d'outils épinglées : deux lancements
 # donnent les mêmes octets.
 export SOURCE_DATE_EPOCH=1790640000
 
 ROOT=${0:A:h:h}
-OUT=$ROOT/public/fonts
+# Les polices sont importées par le CSS (nom haché au build) ; la licence reste servie à /fonts/LICENSES.txt.
+OUT=$ROOT/src/ui/fonts
+LICENSE_DIR=$ROOT/public/fonts
 COMMIT=23e54b51ddffbc7713c583748e3bd86f62b1fa4a
 BASE=https://raw.githubusercontent.com/google/fonts/$COMMIT/ofl
 WORK=$(mktemp -d)
@@ -34,7 +36,7 @@ instance bsd.ttf bsd-800.ttf wght=800
 instance bsd.ttf bsd-900.ttf wght=900
 instance martian.ttf martian-300-400.ttf wght=300:400 wdth=100
 
-mkdir -p "$OUT"
+mkdir -p "$OUT" "$LICENSE_DIR"
 subset() {
   uvx --from "fonttools[woff]==4.66.1" --with brotli==1.2.0 pyftsubset "$WORK/$1" --unicodes="$UNICODES" --flavor=woff2 \
     --layout-features='*' --no-hinting --output-file="$OUT/$2"
@@ -52,7 +54,7 @@ subset martian-300-400.ttf martian-mono-300-400.woff2
     print "\n==== $name ====\n"
     cat "$WORK/$name-OFL.txt"
   done
-} > "$OUT/LICENSES.txt"
+} > "$LICENSE_DIR/LICENSES.txt"
 
 trash "$WORK"
-ls -l "$OUT"
+ls -l "$OUT" "$LICENSE_DIR"
diff --git a/scripts/og/og.html b/scripts/og/og.html
index 6174937..de026b4 100644
--- a/scripts/og/og.html
+++ b/scripts/og/og.html
@@ -7,12 +7,12 @@
     <style>
       @font-face {
         font-family: "Big Shoulders Display";
-        src: url("../../public/fonts/big-shoulders-display-900.woff2") format("woff2");
+        src: url("../../src/ui/fonts/big-shoulders-display-900.woff2") format("woff2");
         font-weight: 900;
       }
       @font-face {
         font-family: "Martian Mono";
-        src: url("../../public/fonts/martian-mono-300-400.woff2") format("woff2");
+        src: url("../../src/ui/fonts/martian-mono-300-400.woff2") format("woff2");
         font-weight: 300 400;
       }
       * {
diff --git a/src/audio/game-audio.ts b/src/audio/game-audio.ts
index 5fb1e85..ebfe8cf 100644
--- a/src/audio/game-audio.ts
+++ b/src/audio/game-audio.ts
@@ -5,13 +5,17 @@ import { AudioEngine } from "./audio-engine";
 import { MusicTrack } from "./music";
 import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
 import { type UiSound, playUiSound } from "./ui-sfx";
+import gameTrackUrl from "./tracks/game.mp3";
+import menuTrackUrl from "./tracks/menu.mp3";
+import replayTrackUrl from "./tracks/replay.mp3";
 import { AUDIO_TIME, droneGain, musicRate, sfxRate } from "./time-coupling";
 
-// Morceaux Lyria (tâche 8 du plan 2 ; boucle du menu au plan 3b), servis depuis public/audio/.
+// Morceaux Lyria (tâche 8 du plan 2 ; boucle du menu au plan 3b). Importés : Vite leur donne un nom haché, que
+// l'hébergeur sert avec un cache d'un an (vercel.json).
 const MUSIC = {
-  game: "/audio/game.mp3",
-  replay: "/audio/replay.mp3",
-  menu: "/audio/menu.mp3",
+  game: gameTrackUrl,
+  replay: replayTrackUrl,
+  menu: menuTrackUrl,
 } as const;
 
 export class GameAudio {
diff --git a/src/audio/music.ts b/src/audio/music.ts
index 8fdd6a9..f745147 100644
--- a/src/audio/music.ts
+++ b/src/audio/music.ts
@@ -32,12 +32,12 @@ export function barLoop(m: BarMeasure): MusicPlayback {
   return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds };
 }
 
-// Boucle du menu : public/audio/menu.mp3, mesurée le 2026-09-30 par bun scripts/measure-loop.ts (plan 3b, tâche 6).
+// Boucle du menu : src/audio/tracks/menu.mp3, mesurée le 2026-09-30 par bun scripts/measure-loop.ts (plan 3b, tâche 6).
 export const MENU_LOOP: BarMeasure = { firstDownbeat: 0.093, barSeconds: 1.875128, tailSilenceStart: 62.575034 };
 
 // Les morceaux Lyria portent du silence : `game` 2,57 s à la fin, `replay` 2,69 s au début et 2,34 s à la fin.
 // Mesures du 2026-09-29 (seuil -50 dB, durée minimale 0,5 s) :
-//   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
+//   ffmpeg -i src/audio/tracks/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
 //   game   : silence_start 89.1435 -> fin (91.7159)
 //   replay : silence 0 -> 2.6918, puis silence_start 103.0595 -> fin (105.4040)
 // Valeurs arrondies vers l'intérieur du son (au plus 10 ms de musique sacrifiés).
diff --git a/src/rooms/registry.ts b/src/rooms/registry.ts
index f47e33c..fde1b14 100644
--- a/src/rooms/registry.ts
+++ b/src/rooms/registry.ts
@@ -1,10 +1,12 @@
 // Registre des salles : ajouter une salle = un module + une ligne ici (spec section 9.1).
 import { room01 } from "./room-01-datacenter";
+import room01Thumbnail from "./thumbnails/room-01.webp";
+import room02Thumbnail from "./thumbnails/room-02.webp";
 import type { RoomEntry } from "./types";
 
 export const ROOMS: readonly RoomEntry[] = [
-  { id: room01.id, title: room01.title, status: "playable", definition: room01, thumbnail: "/rooms/room-01.webp" },
-  { id: "room-02", title: "Salle 2", status: "locked", thumbnail: "/rooms/room-02.webp" },
+  { id: room01.id, title: room01.title, status: "playable", definition: room01, thumbnail: room01Thumbnail },
+  { id: "room-02", title: "Salle 2", status: "locked", thumbnail: room02Thumbnail },
 ];
 
 export function findRoom(id: string): RoomEntry | undefined {
diff --git a/src/ui/media.ts b/src/ui/media.ts
index aba9125..5a2404d 100644
--- a/src/ui/media.ts
+++ b/src/ui/media.ts
@@ -1,8 +1,11 @@
-// Fichiers de la cinématique (spec 4.2), fabriqués au plan 3b : WebM AV1, repli MP4 H.264.
-// Tant qu'ils n'existent pas, les écrans qui les lisent se passent de vidéo, sans erreur.
+// Fichiers de la cinématique (spec 4.2), fabriqués au plan 3b : WebM AV1, repli MP4 H.264. Importés : Vite leur
+// donne un nom haché (cache d'un an chez l'hébergeur). Illisibles, les écrans se passent de vidéo, sans erreur.
+import introMp4Url from "./video/intro.mp4";
+import introWebmUrl from "./video/intro.webm";
+
 export const INTRO_VIDEO = {
-  webm: "/video/intro.webm",
-  mp4: "/video/intro.mp4",
+  webm: introWebmUrl,
+  mp4: introMp4Url,
 } as const;
 
 // Balise <video> de la cinématique. `ambient` : muette, en boucle, lancée seule (écran mobile).
diff --git a/src/ui/tokens.css b/src/ui/tokens.css
index 74c6318..9ebcf18 100644
--- a/src/ui/tokens.css
+++ b/src/ui/tokens.css
@@ -3,31 +3,31 @@
 
 @font-face {
   font-family: "Big Shoulders Display";
-  src: url("/fonts/big-shoulders-display-800.woff2") format("woff2");
+  src: url("./fonts/big-shoulders-display-800.woff2") format("woff2");
   font-weight: 800;
   font-display: swap;
 }
 @font-face {
   font-family: "Big Shoulders Display";
-  src: url("/fonts/big-shoulders-display-900.woff2") format("woff2");
+  src: url("./fonts/big-shoulders-display-900.woff2") format("woff2");
   font-weight: 900;
   font-display: swap;
 }
 @font-face {
   font-family: "Chakra Petch";
-  src: url("/fonts/chakra-petch-500.woff2") format("woff2");
+  src: url("./fonts/chakra-petch-500.woff2") format("woff2");
   font-weight: 500;
   font-display: swap;
 }
 @font-face {
   font-family: "Chakra Petch";
-  src: url("/fonts/chakra-petch-600.woff2") format("woff2");
+  src: url("./fonts/chakra-petch-600.woff2") format("woff2");
   font-weight: 600;
   font-display: swap;
 }
 @font-face {
   font-family: "Martian Mono";
-  src: url("/fonts/martian-mono-300-400.woff2") format("woff2");
+  src: url("./fonts/martian-mono-300-400.woff2") format("woff2");
   font-weight: 300 400;
   font-display: swap;
 }
diff --git a/tests/loop-measure.test.ts b/tests/loop-measure.test.ts
index 5c27564..4e200ec 100644
--- a/tests/loop-measure.test.ts
+++ b/tests/loop-measure.test.ts
@@ -1,7 +1,7 @@
 import { describe, expect, test } from "bun:test";
 import { barMeasure, beatPeriod, parseSilences } from "../scripts/loop-measure";
 
-// Sortie réelle de `ffmpeg -af silencedetect=noise=-50dB:d=0.5` sur public/audio/replay.mp3 (2026-09-30).
+// Sortie réelle de `ffmpeg -af silencedetect=noise=-50dB:d=0.5` sur src/audio/tracks/replay.mp3 (2026-09-30).
 const REPLAY_LOG = `[Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 0
 [Parsed_silencedetect_0 @ 0x79230a8900] silence_end: 2.691769 | silence_duration: 2.691769
 [Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 103.059546
diff --git a/tests/music-loop.test.ts b/tests/music-loop.test.ts
index df83e2b..68fe6da 100644
--- a/tests/music-loop.test.ts
+++ b/tests/music-loop.test.ts
@@ -2,8 +2,8 @@ import { describe, expect, test } from "bun:test";
 import { MENU_LOOP, type TrackName, barLoop, musicPlayback } from "../src/audio/music";
 
 // Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
-//   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
-//   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
+//   ffprobe -v error -show_entries format=duration -of default=nw=1 src/audio/tracks/<piste>.mp3
+//   ffmpeg -i src/audio/tracks/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
 const MEASURED: Record<Exclude<TrackName, "menu">, { duration: number; headSilenceEnd: number; tailSilenceStart: number }> = {
   // game.mp3 : pas de silence de tête ; 2,57 s de silence de 89,14 s à la fin.
   game: { duration: 91.715875, headSilenceEnd: 0, tailSilenceStart: 89.143537 },
@@ -88,7 +88,7 @@ describe("boucle coupée sur le temps (plan 3b, boucle du menu)", () => {
 });
 
 describe("boucle du menu mesurée (plan 3b)", () => {
-  // ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/audio/menu.mp3
+  // ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 src/audio/tracks/menu.mp3
   const MENU_DURATION = 63.999958;
 
   test("menu : la fenêtre mesurée tient dans le fichier, sans repli sur tout le fichier", () => {
```

- [ ] **Step 3 : rien n'est cassé**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `302 pass`, `0 fail`.

- [ ] **Step 4 : le site construit ne garde rien de lourd hors de `assets/`**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist ; find dist -type f -not -path "dist/assets/*"`
Expected : le build liste 12 fichiers hachés en plus du code (5 polices, 2 vignettes, 3 musiques, 2 vidéos) ; le contrôle dit `ok   long cache` et `ok   12 cited assets exist` (il reste 16 problèmes de partage, pour la tâche 4) ; `find` ne rend que `dist/index.html`, `dist/og-v1.jpg`, `dist/fonts/LICENSES.txt`. Dans `dist/index.html`, les trois `<link rel="preload">` pointent vers `/assets/…-<hash>.woff2`.

- [ ] **Step 5 : les polices se chargent depuis leur nouveau dossier**

L'image de partage se refait à l'identique, ce qui prouve que `og.html` trouve les polices :

Run : `cd /Users/recarnot/dev/claudehot-videogame && zsh scripts/build-og.sh ../../assets/images/og-background-game.png dist/og-test.jpg && cmp public/og-v1.jpg dist/og-test.jpg && echo same`
Expected : `1200,630`, puis `dist/og-test.jpg: 59914 bytes (q=3)`, puis `same` (les mêmes octets que `public/og-v1.jpg`). Un autre poids : ouvrir `dist/og-test.jpg`, les polices sont tombées sur une police système.

En développement, lancer `bun run dev --port 5299 --strictPort` en arrière-plan, puis :

Run : `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:5299/src/ui/fonts/big-shoulders-display-900.woff2 http://localhost:5299/src/audio/tracks/menu.mp3 http://localhost:5299/src/ui/video/intro.mp4`
Expected : `200 font/woff2`, `200 audio/mpeg`, `200 video/mp4`. Arrêter le serveur.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/audio/tracks src/ui/video src/rooms/thumbnails src/ui/fonts public/fonts src/audio/game-audio.ts src/audio/music.ts src/ui/media.ts src/rooms/registry.ts src/ui/tokens.css index.html scripts/og/og.html scripts/build-fonts.sh tests/music-loop.test.ts tests/loop-measure.test.ts && git commit -m "perf(assets): music, video, thumbnails and fonts go through Vite for hashed names"
```

`git status --short` ne doit plus montrer que les fichiers de Romain.

---

### Task 3 : le MP4 de la cinématique est au niveau H.264 4.1 (contrôle seul)

La revue finale du 3b (point 6) demandait un MP4 au niveau 4.1 : au niveau 5.0, un vieux décodeur matériel peut le refuser. C'est fait depuis la nouvelle cinématique (`af9bf26`, 2026-09-30). Cette tâche ne ré-encode rien : elle prouve que le fichier, à sa nouvelle place, est conforme. Aucun commit.

**Files :**
- Lit : `src/ui/video/intro.mp4` (binaire, inchangé)

**Interfaces :**
- Consumes : `src/ui/video/intro.mp4` à sa place de la tâche 2.
- Produces : la preuve pour AC-3c-3 : `h264` `High` `level=41`.

- [ ] **Step 1 : le fichier est conforme**

Run : `cd /Users/recarnot/dev/claudehot-videogame && ls -l src/ui/video/intro.mp4 && ffprobe -v error -show_entries format=duration:stream=codec_name,profile,level,width,height,r_frame_rate -of default=nw=1 src/ui/video/intro.mp4`
Expected (lu le 2026-09-30) : 5 789 099 octets, en tout cas ≤ 6 000 000 ; `codec_name=h264`, `profile=High`, `level=41`, `width=1920`, `height=1080`, `r_frame_rate=30/1` ; piste `aac` ; `duration=26.300000`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -v error -xerror -i src/ui/video/intro.mp4 -f null - && echo "decode ok" && ffmpeg -hide_banner -nostats -i src/ui/video/intro.mp4 -vf freezedetect=n=0.001:d=0.3 -an -f null - 2>&1 | grep -c freeze_start`
Expected : `decode ok`, puis `0` (aucune image figée : Romain rejette toute image fixe). `grep -c` qui compte 0 sort en code 1 : c'est normal.

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffprobe -v trace src/ui/video/intro.mp4 2>&1 | grep -oE "type:'(moov|mdat)'" | head -2`
Expected : `type:'moov'` avant `type:'mdat'` (la lecture démarre avant la fin du téléchargement).

Run : `cd /Users/recarnot/dev/claudehot-videogame && qlmanage -t -s 640 -o .superpowers src/ui/video/intro.mp4 > /dev/null 2>&1 ; ls -l .superpowers/intro.mp4.png`
Expected : une vignette PNG non vide. QuickLook passe par le décodeur d'Apple, celui de Safari.

- [ ] **Step 2 : si un contrôle échoue**

**Arrêt.** Le dire à Romain avec la sortie réelle. Ne pas ré-encoder depuis `intro.mp4` (deux compressions de suite). La recette, s'il la demande, part du master `videos/agenthot-intro/renders/master.mp4` (ignoré par git, sur ce Mac seulement), en deux passes, débit `5600 × 8 / durée − 96` kb/s :

```bash
cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -i videos/agenthot-intro/renders/master.mp4 -c:v libx264 -preset slow -profile:v high -level:v 4.1 -refs 4 -b:v 1607k -pass 1 -passlogfile .superpowers/h264pass -an -f null /dev/null
cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -i videos/agenthot-intro/renders/master.mp4 -c:v libx264 -preset slow -profile:v high -level:v 4.1 -refs 4 -b:v 1607k -pass 2 -passlogfile .superpowers/h264pass -c:a aac -b:a 96k -movflags +faststart src/ui/video/intro.mp4
```

---

### Task 4 : balises de partage et icônes

Ce que lit un robot quand quelqu'un colle le lien : titre, phrase, image, écrits dans `index.html` en adresses absolues. Plus l'icône du site, que montrent l'onglet et iMessage.

**Files :**
- Create : `public/favicon.svg`, `public/apple-touch-icon.png` (fabriqué à l'étape 2), `scripts/og/icon.html`
- Modify : `index.html`

**Interfaces :**
- Consumes : `bun scripts/check-release.ts dist` (tâche 1) ; `public/og-v1.jpg` (plan 3b).
- Produces : rien pour le code. Pour les tâches 12 à 14 : `bun scripts/check-release.ts <adresse>` passe sur les lignes `share tags`, `share image`, `icon`.

- [ ] **Step 1 : l'icône du site**

`public/favicon.svg` :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0d111b"/>
  <path d="M32 9 55 32 32 55 9 32Z" fill="#d97757"/>
  <path d="M32 9 55 32 32 32Z" fill="#ff9d73"/>
  <path d="M32 32 32 55 9 32Z" fill="#b85f43"/>
</svg>
```

Couleurs : `void` `#0d111b`, `threat` `#d97757`, `threat-hot` `#ff9d73` (spec 6.1), et une facette sombre `#b85f43`.

`scripts/og/icon.html` :

```html
<!doctype html>
<!-- Icône du site en PNG (apple-touch-icon, 180 × 180) : public/favicon.svg capturé par Chrome sans écran.
     Commande dans le plan 3c, tâche des balises de partage. -->
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <style>
      * {
        margin: 0;
      }
      html,
      body {
        width: 180px;
        height: 180px;
        overflow: hidden;
        background: #0d111b;
      }
      img {
        display: block;
        width: 180px;
        height: 180px;
      }
    </style>
  </head>
  <body>
    <img src="../../public/favicon.svg" alt="" />
  </body>
</html>
```

- [ ] **Step 2 : fabriquer le PNG de 180 px**

Chrome ne capture pas bien un SVG ouvert seul : il passe par le gabarit.

```bash
cd /Users/recarnot/dev/claudehot-videogame && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=180,180 --virtual-time-budget=2000 --screenshot=public/apple-touch-icon.png "file:///Users/recarnot/dev/claudehot-videogame/scripts/og/icon.html" 2>/dev/null
```

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/apple-touch-icon.png && ls -l public/apple-touch-icon.png`
Expected : `180,180`, environ 1,7 Ko. Ouvrir le PNG (outil Read) : un losange orange à quatre facettes, centré, sur fond bleu nuit. Un PNG blanc ou coupé : la capture a raté, refaire.

- [ ] **Step 3 : les balises**

```diff
diff --git a/index.html b/index.html
index 61a6f1a..0d9306c 100644
--- a/index.html
+++ b/index.html
@@ -5,6 +5,24 @@
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta name="theme-color" content="#0d111b" />
     <title>AGENTHOT</title>
+    <meta name="description" content="Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur." />
+    <link rel="canonical" href="https://agenthot.erom.cloud/" />
+    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
+    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
+    <!-- Aperçu du lien partagé (spec 4.7). Les robots ne lancent aucun script : tout est écrit ici, en URL absolues.
+         Une nouvelle image change de nom (og-v2.jpg) : les plateformes gardent l'ancienne en cache par URL.
+         Contrôle : bun scripts/check-release.ts dist -->
+    <meta property="og:type" content="website" />
+    <meta property="og:url" content="https://agenthot.erom.cloud/" />
+    <meta property="og:title" content="AGENTHOT" />
+    <meta property="og:description" content="Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur." />
+    <meta property="og:locale" content="fr_FR" />
+    <meta property="og:image" content="https://agenthot.erom.cloud/og-v1.jpg" />
+    <meta property="og:image:type" content="image/jpeg" />
+    <meta property="og:image:width" content="1200" />
+    <meta property="og:image:height" content="630" />
+    <meta property="og:image:alt" content="AGENTHOT : un ennemi orange vole en éclats dans une salle de serveurs blanche, vu à la première personne." />
+    <meta name="twitter:card" content="summary_large_image" />
     <!-- Polices du logo et des petits textes, préchargées : le chargeur les affiche dès la première seconde. -->
     <link rel="preload" href="/src/ui/fonts/big-shoulders-display-900.woff2" as="font" type="font/woff2" crossorigin />
     <link rel="preload" href="/src/ui/fonts/martian-mono-300-400.woff2" as="font" type="font/woff2" crossorigin />
```

La description fait 77 caractères (limite : 80). `theme-color` existait déjà.

- [ ] **Step 4 : le contrôle passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist`
Expected, code 0 :

```
ok   share tags
ok   share image
ok   icon icon (/favicon.svg)
ok   icon apple-touch-icon (/apple-touch-icon.png)
ok   long cache
ok   12 cited assets exist
     20 files, 18.1 MB
release check: all good
```

- [ ] **Step 5 : vu par un robot**

Lancer `bun run preview --port 4319 --strictPort` en arrière-plan, puis :

Run : `curl -s --compressed -A "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" http://localhost:4319/ | grep -c 'property="og:'`
Expected : `10`. Arrêter le serveur.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add index.html public/favicon.svg public/apple-touch-icon.png scripts/og/icon.html && git commit -m "feat(share): Open Graph tags, canonical URL and site icons"
```

---

### Task 5 : la sonde d'images (AC-8)

En `?debug`, le moteur garde l'intervalle entre deux images et leurs appels de dessin dans un anneau pré-alloué. À la fin de chaque partie (victoire ou mort), il écrit une ligne dans la console avec le pire moment de la partie. Hors `?debug`, rien n'est créé.

**Files :**
- Create : `src/app/frame-stats.ts`
- Modify : `src/app/engine.ts`
- Test : `tests/frame-stats.test.ts`

**Interfaces :**
- Consumes : la boucle de `src/app/engine.ts` et sa sonde `window.agenthot` (plans 2 et 3a).
- Produces :
  - `FRAME_STATS = { capacity: 7200, window: 120 }`
  - `percentile(sorted: ArrayLike<number>, p: number): number`
  - `class FrameStats { push(intervalMs: number, drawCalls: number): void; reset(): void; report(): FrameReport }`
  - `FrameReport = { frames: number; p95Ms: number; worstWindowP95Ms: number; maxMs: number; maxDrawCalls: number }`
  - En debug : `window.agenthot.frameStats(): FrameReport | null`, `window.agenthot.resetFrameStats(): void`, et la ligne console `[agenthot] frames {…}` à la fin de chaque partie.

- [ ] **Step 1 : écrire les tests**

`tests/frame-stats.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { FRAME_STATS, FrameStats, percentile } from "../src/app/frame-stats";

// `count` images de `ms` millisecondes et `draws` appels de dessin.
function feed(stats: FrameStats, count: number, ms: number, draws = 40): void {
  for (let i = 0; i < count; i++) stats.push(ms, draws);
}

describe("sonde d'images (spec AC-8)", () => {
  test("centile par rang le plus proche ; une liste vide donne 0", () => {
    expect(percentile([], 0.95)).toBe(0);
    expect(percentile([10], 0.95)).toBe(10);
    // 20 valeurs : le 95e centile est la 19e.
    expect(percentile(Array.from({ length: 20 }, (_, i) => i + 1), 0.95)).toBe(19);
  });

  test("sans image, le rapport est à zéro", () => {
    expect(new FrameStats().report()).toEqual({ frames: 0, p95Ms: 0, worstWindowP95Ms: 0, maxMs: 0, maxDrawCalls: 0 });
  });

  test("une partie fluide avec un passage lent : le pire moment ressort, la moyenne de la partie le cache", () => {
    const stats = new FrameStats();
    feed(stats, 1000, 16);
    // Une demi-seconde à 30 images par seconde, avec plus d'appels de dessin (l'éclatement).
    feed(stats, 15, 33, 58);
    feed(stats, 1000, 16);
    const report = stats.report();
    expect(report.frames).toBe(2015);
    // 15 images lentes sur 2 015 : moins de 5 %, le centile global ne les voit pas.
    expect(report.p95Ms).toBe(16);
    // Dans la fenêtre de 2 s qui les contient, elles pèsent plus de 5 %.
    expect(report.worstWindowP95Ms).toBe(33);
    expect(report.maxMs).toBe(33);
    expect(report.maxDrawCalls).toBe(58);
  });

  test("une image isolée en retard (changement d'onglet) ne fait pas le pire moment", () => {
    const stats = new FrameStats();
    feed(stats, 300, 16);
    stats.push(400, 40);
    feed(stats, 300, 16);
    const report = stats.report();
    expect(report.maxMs).toBe(400);
    expect(report.worstWindowP95Ms).toBe(16);
  });

  test("l'anneau plein oublie les plus vieilles images, et reset le vide", () => {
    const stats = new FrameStats();
    feed(stats, 50, 99, 70);
    feed(stats, FRAME_STATS.capacity, 16);
    const report = stats.report();
    expect(report.frames).toBe(FRAME_STATS.capacity);
    expect(report.maxMs).toBe(16);
    expect(report.maxDrawCalls).toBe(40);
    stats.reset();
    expect(stats.report().frames).toBe(0);
  });

  test("les durées sortent au dixième de milliseconde", () => {
    const stats = new FrameStats();
    feed(stats, 10, 17.6);
    expect(stats.report().p95Ms).toBe(17.6);
    expect(stats.report().maxMs).toBe(17.6);
  });

  test("moins d'images qu'une fenêtre : le pire moment est tout ce qu'on a", () => {
    const stats = new FrameStats();
    feed(stats, 10, 20);
    expect(stats.report().worstWindowP95Ms).toBe(20);
  });
});
```

- [ ] **Step 2 : ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/frame-stats.test.ts 2>&1 | tail -8`
Expected : FAIL, `Cannot find module '../src/app/frame-stats'`.

- [ ] **Step 3 : écrire la sonde**

`src/app/frame-stats.ts` :

```ts
// Sonde AC-8 (debug seulement) : l'intervalle entre deux images rendues et leurs appels de dessin, gardés dans un
// anneau pré-alloué. Rien n'est alloué par image ; le rapport, lui, se calcule après coup, hors de la boucle
// (window.agenthot.frameStats()).

export const FRAME_STATS = {
  // Deux minutes à 60 images par seconde : une partie entière tient dans l'anneau.
  capacity: 7200,
  // Fenêtre du « pire moment » : 2 s à 60 images par seconde.
  window: 120,
} as const;

export interface FrameReport {
  // Nombre d'images gardées (au plus `capacity`, les plus récentes).
  frames: number;
  // Intervalle entre images, 95e centile sur tout l'anneau (ms).
  p95Ms: number;
  // Le même centile sur la pire fenêtre de `window` images : le « pire moment » d'AC-8.
  worstWindowP95Ms: number;
  maxMs: number;
  maxDrawCalls: number;
}

// Centile par rang le plus proche d'une liste triée par ordre croissant ; 0 pour une liste vide.
export function percentile(sorted: ArrayLike<number>, p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]!;
}

export class FrameStats {
  private readonly intervals = new Float32Array(FRAME_STATS.capacity);
  private readonly draws = new Uint16Array(FRAME_STATS.capacity);
  // Prochaine case à écrire, et nombre de cases remplies.
  private head = 0;
  private count = 0;

  // Une image rendue : appelée dans la boucle, sans allocation.
  push(intervalMs: number, drawCalls: number): void {
    this.intervals[this.head] = intervalMs;
    this.draws[this.head] = drawCalls;
    this.head = (this.head + 1) % FRAME_STATS.capacity;
    if (this.count < FRAME_STATS.capacity) this.count++;
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
  }

  // Hors de la boucle : ce calcul alloue et trie.
  report(): FrameReport {
    // Images dans l'ordre du temps, de la plus ancienne à la plus récente.
    const ordered = new Float32Array(this.count);
    const start = this.count < FRAME_STATS.capacity ? 0 : this.head;
    let maxMs = 0;
    let maxDrawCalls = 0;
    for (let i = 0; i < this.count; i++) {
      const at = (start + i) % FRAME_STATS.capacity;
      ordered[i] = this.intervals[at]!;
      maxMs = Math.max(maxMs, ordered[i]!);
      maxDrawCalls = Math.max(maxDrawCalls, this.draws[at]!);
    }
    const p95Ms = percentile(ordered.slice().sort(), 0.95);
    // Moins d'images qu'une fenêtre : la pire fenêtre est l'anneau entier.
    let worstWindowP95Ms = this.count < FRAME_STATS.window ? p95Ms : 0;
    for (let i = 0; i + FRAME_STATS.window <= this.count; i++) {
      const p95 = percentile(ordered.slice(i, i + FRAME_STATS.window).sort(), 0.95);
      worstWindowP95Ms = Math.max(worstWindowP95Ms, p95);
    }
    // Au dixième de milliseconde : l'anneau est en simple précision (17,6 s'y lit 17,600000381).
    const round = (ms: number): number => Math.round(ms * 10) / 10;
    return { frames: this.count, p95Ms: round(p95Ms), worstWindowP95Ms: round(worstWindowP95Ms), maxMs: round(maxMs), maxDrawCalls };
  }
}
```

- [ ] **Step 4 : ils passent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/frame-stats.test.ts 2>&1 | tail -5`
Expected : `7 pass`, `0 fail`.

- [ ] **Step 5 : brancher la sonde dans le moteur**

```diff
diff --git a/src/app/engine.ts b/src/app/engine.ts
index a8bdae0..3fcffa6 100644
--- a/src/app/engine.ts
+++ b/src/app/engine.ts
@@ -14,6 +14,7 @@ import { Game, type PlayerInput, emptyInput } from "../sim/game";
 import { TIME } from "../sim/time";
 import { createWorldView, writeGameView } from "../sim/view";
 import { CAPTURE, CanvasCapture, type CaptureTarget, captureDisplayRect } from "./capture";
+import { FrameStats } from "./frame-stats";
 import { Hud } from "./hud";
 import { InputController } from "./input";
 
@@ -117,6 +118,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
   let fpsFrames = 0;
   let fpsTime = 0;
   let fps = 0;
+  // Sonde AC-8 : en debug seulement, pour ne rien coûter au jeu normal.
+  const frameStats = debug ? new FrameStats() : null;
+  // Heure de l'image précédente, donnée par le navigateur (calée sur l'écran, sans la gigue de performance.now()).
+  let lastFrameTime = 0;
 
   // Relance (R, clic à la mort, Recommencer) : même salle, sans rien recharger (AC-6).
   function restartRun(): void {
@@ -145,6 +150,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
 
   function startRun(): void {
     game.reset();
+    // La sonde ne garde que la partie en cours.
+    frameStats?.reset();
     recorder.reset();
     writeGameView(game, view);
     recorder.capture(game.simTime, view, true);
@@ -225,10 +232,13 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
         world.update(view);
         // Le rendu reste celui de la boucle : ses appels de dessin se lisent dans le panneau debug.
       },
+      // AC-8 : intervalles entre images et appels de dessin depuis le dernier resetFrameStats().
+      frameStats: () => frameStats?.report() ?? null,
+      resetFrameStats: () => frameStats?.reset(),
     };
   }
 
-  renderer.setAnimationLoop(() => {
+  renderer.setAnimationLoop((frameTime: number) => {
     // Rien à montrer tant que la salle n'est pas ouverte : le GPU se repose (chargeur, cinématique).
     if (mode === "idle") return;
     const now = performance.now();
@@ -266,6 +276,8 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
       audio.frame(view, game.events);
       hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
       world.update(view, simDt);
+      // Preuve AC-8 : à la fin de chaque partie, le pire moment de ses images et son maximum d'appels de dessin.
+      if (frameStats && game.status !== "playing") console.info(`[agenthot] frames ${JSON.stringify(frameStats.report())}`);
       if (game.status === "dead") setMode("dead");
       if (game.status === "won") {
         // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
@@ -296,6 +308,10 @@ export async function createEngine(options: EngineOptions): Promise<Engine> {
     }
 
     post.render();
+    if (frameStats) {
+      frameStats.push(frameTime - lastFrameTime, renderer.info.render.drawCalls);
+      lastFrameTime = frameTime;
+    }
 
     fpsFrames++;
     fpsTime += dt;
```

`push` n'alloue rien : deux écritures dans des tableaux typés. `report` alloue, et n'est appelé qu'à la fin d'une partie ou depuis la console.

- [ ] **Step 6 : tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `309 pass`, `0 fail`.

- [ ] **Step 7 : la sonde répond dans le navigateur**

`cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run build`, puis `bun run preview --port 4319 --strictPort` en arrière-plan. MCP Chrome DevTools : `new_page` sur `http://localhost:4319/?debug` (fenêtre au premier plan), puis `evaluate_script` :

```js
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyQ", bubbles: true }));
  await wait(2500);
  key(); // l'invite
  await wait(1500);
  key(); // la cinématique, si elle a démarré
  await wait(2500);
  const a = window.agenthot;
  if (!a) return { agenthot: false };
  a.resetFrameStats();
  await wait(6000);
  return { hidden: document.hidden, debug: document.querySelector("#debug").textContent, stats: a.frameStats() };
}
```

Expected (mesure du prototype, au menu) : `hidden: false` ; `stats.frames` vers 360 ; `stats.p95Ms` vers 17,5 ; `stats.maxDrawCalls` sous 80 (41 mesuré au menu avant le nouveau rendu du 30/09, vers 65 depuis). `agenthot: false` : le menu n'est pas encore là, relancer le script. `frames: 0` : l'onglet est caché, le remettre au premier plan. Arrêter le serveur.

- [ ] **Step 8 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/app/frame-stats.ts src/app/engine.ts tests/frame-stats.test.ts && git commit -m "feat(debug): frame probe reporting the worst 2-second window of a run (AC-8)"
```

---

### Task 6 : crédits définitifs

Le vrai nom du dépôt, et le vrai compte : tokens et coût API de toutes les sessions du projet, sous-agents compris. Le coût est un équivalent au tarif public de l'API (Romain paie un abonnement), d'où « estimé ».

**Files :**
- Create : `scripts/count-tokens.sh`
- Modify : `src/ui/credits.ts`, `tests/credits.test.ts`

**Interfaces :**
- Consumes : les transcripts `~/.claude/projects/*claudehot*` (un seul dossier aujourd'hui : `-Users-recarnot-dev-claudehot-videogame`).
- Produces : `CREDITS.repoUrl === "https://github.com/eRom/agenthot-the-game"` ; `CREDITS.tokens` et `CREDITS.apiCostUsd` mesurés. `creditsLine` et `usageLine` ne changent pas.

- [ ] **Step 1 : le test d'abord**

```diff
diff --git a/tests/credits.test.ts b/tests/credits.test.ts
index e193569..26a87a8 100644
--- a/tests/credits.test.ts
+++ b/tests/credits.test.ts
@@ -14,6 +14,19 @@ describe("crédits (spec 4.3, AC-15)", () => {
     expect(CREDITS.repoUrl.startsWith("https://github.com/eRom/")).toBe(true);
   });
 
+  test("le lien des sources mène au dépôt du jeu, plus à un nom provisoire (AC-15)", () => {
+    expect(creditsLine(CREDITS)).toBe(
+      `AGENTHOT ${DOT} Author: eRom ${DOT} Made with: Claude Opus 5.5 ${DOT} Sources: https://github.com/eRom/agenthot-the-game`,
+    );
+  });
+
+  test("les compteurs sont de vraies mesures : un nombre entier de tokens, un coût positif", () => {
+    expect(Number.isInteger(CREDITS.tokens) && CREDITS.tokens > 0).toBe(true);
+    expect(CREDITS.apiCostUsd).toBeGreaterThan(0);
+    // Centimes : la ligne affichée n'arrondit rien.
+    expect(Math.round(CREDITS.apiCostUsd * 100) / 100).toBe(CREDITS.apiCostUsd);
+  });
+
   test("tokens et coût se lisent à la française, avec la mention « estimé »", () => {
     const line = usageLine({ repoUrl: "", tokens: 118795538, apiCostUsd: 50.31 });
     expect(line.replace(THIN_SPACE, " ")).toBe(`118 795 538 tokens ${DOT} coût API estimé : 50,31 $`);
```

- [ ] **Step 2 : il échoue**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/credits.test.ts 2>&1 | tail -12`
Expected : 1 échec, sur « le lien des sources mène au dépôt du jeu » : reçu `…Sources: https://github.com/eRom/XXXXXX`.

- [ ] **Step 3 : le script de comptage**

`scripts/count-tokens.sh` :

```zsh
#!/bin/zsh
# Crédits (spec 4.3) : tokens et coût API des sessions du projet, dédoublonnés par message.id.
# Usage : zsh scripts/count-tokens.sh <dossier de transcripts ~/.claude/projects/...> [...]
# Une réponse du modèle est écrite sur plusieurs lignes (une par bloc) avec le même message.id : on n'en garde
# qu'une. Les sous-agents écrivent dans <session>/subagents/ : la recherche est récursive. Les lignes
# « <synthetic> » ne sont pas facturées. Les tokens de réflexion sont déjà dans output_tokens.
set -euo pipefail
command find "$@" -name '*.jsonl' -not -path '*/memory/*' -print0 \
  | xargs -0 cat \
  | jq -r 'select(.type=="assistant" and .message.usage!=null and .message.model!="<synthetic>") | [.message.id, .message.model, .message.usage.input_tokens, (.message.usage.cache_creation.ephemeral_5m_input_tokens // 0), (.message.usage.cache_creation.ephemeral_1h_input_tokens // 0), .message.usage.cache_read_input_tokens, .message.usage.output_tokens] | @tsv' \
  | awk -F'\t' '
    BEGIN {
      # Prix en $ par million de tokens : entrée, cache écrit 5 min, cache écrit 1 h, cache lu, sortie.
      # Source : platform.claude.com/docs/en/about-claude/pricing (lu le 2026-09-30).
      P["claude-opus-5-5"]="4 5 8 0.20 20"
      P["claude-sonnet-5-5"]="2 2.50 4 0.20 10"
      P["claude-fable-5-1"]="10 12.50 20 0.25 50"
      P["claude-haiku-4-5-20251001"]="1 1.25 2 0.10 5"
    }
    { k=$1
      if (!(k in M)) { M[k]=$2; I[k]=$3; C5[k]=$4; C1[k]=$5; R[k]=$6; O[k]=$7 }
      else if ($7 > O[k]) O[k]=$7 }
    END {
      for (k in M) { m=M[k]; n[m]++; i[m]+=I[k]; c5[m]+=C5[k]; c1[m]+=C1[k]; r[m]+=R[k]; o[m]+=O[k] }
      for (m in n) {
        if (!(m in P)) { printf "%s : pas de prix connu (%d messages)\n", m, n[m]; unknown++; continue }
        split(P[m], p, " ")
        cost=(i[m]*p[1] + c5[m]*p[2] + c1[m]*p[3] + r[m]*p[4] + o[m]*p[5]) / 1e6
        tok=i[m]+c5[m]+c1[m]+r[m]+o[m]
        printf "%s msgs=%d in=%d cw5m=%d cw1h=%d cr=%d out=%d total=%d cost=$%.2f\n", m, n[m], i[m], c5[m], c1[m], r[m], o[m], tok, cost
        T+=cost; TT+=tok
      }
      printf "TOTAL tokens=%d cost=$%.2f\n", TT, T
      # Un modèle sans prix fausse le total : on échoue, pour ne pas écrire un coût trop bas dans les crédits.
      if (unknown) exit 3
    }'
```

Prix relus le 2026-09-30 sur `platform.claude.com/docs/en/about-claude/pricing`, en dollars par million de tokens (entrée, cache écrit 5 min, cache écrit 1 h, cache lu, sortie) : Opus 5.5 `4 5 8 0.20 20` ; Sonnet 5.5 `2 2.50 4 0.20 10` ; Fable 5.1 `10 12.50 20 0.25 50` ; Haiku 4.5 `1 1.25 2 0.10 5`.

- [ ] **Step 4 : mesurer**

Run : `cd /Users/recarnot/dev/claudehot-videogame && zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*`
Expected : une ligne par modèle puis `TOTAL tokens=… cost=$…`, code 0. Mesure du prototype (2026-09-30, 17 h 58) :

```
claude-sonnet-5-5 msgs=1469 in=2978 cw5m=9913532 cw1h=68663 cr=149435728 out=1433935 total=160854836 cost=$69.29
claude-opus-5-5 msgs=2468 in=4946 cw5m=3593138 cw1h=9460918 cr=778347861 out=2758338 total=794165201 cost=$304.51
TOTAL tokens=955020037 cost=$373.80
```

Les nombres du jour seront plus hauts : chaque session s'ajoute. Une ligne `… : pas de prix connu` et un code 3 : un modèle manque dans la table. Lire son prix sur la page citée, ajouter sa ligne `P["<id du modèle>"]`, relancer. Ne jamais recopier un total obtenu avec un code 3.

- [ ] **Step 5 : écrire les valeurs**

Le diff montre les valeurs du prototype : mettre celles de l'étape 4 (tokens avec des `_` tous les trois chiffres, coût à deux décimales) et la date et l'heure du jour dans le commentaire.

```diff
diff --git a/src/ui/credits.ts b/src/ui/credits.ts
index d510d54..81d9c41 100644
--- a/src/ui/credits.ts
+++ b/src/ui/credits.ts
@@ -1,10 +1,11 @@
 // Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
-// Valeurs provisoires : mesure du brief plan 3 (2026-09-29, 13 h 35, chantier en cours). Le plan 3c les remplace
-// par le total final (scripts/count-tokens.sh), et remplace XXXXXX par le nom du dépôt choisi par Romain.
+// Mesure du 2026-09-30 à 17 h 58, toutes sessions du projet, sous-agents compris :
+//   zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*
+// À relancer juste avant la mise en ligne : chaque session de plus s'ajoute au total.
 export const CREDITS = {
-  repoUrl: "https://github.com/eRom/XXXXXX",
-  tokens: 118_795_538,
-  apiCostUsd: 50.31,
+  repoUrl: "https://github.com/eRom/agenthot-the-game",
+  tokens: 955_020_037,
+  apiCostUsd: 373.8,
 } as const;
 
 export interface CreditsData {
```

- [ ] **Step 6 : tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `311 pass`, `0 fail`.

- [ ] **Step 7 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/count-tokens.sh src/ui/credits.ts tests/credits.test.ts && git commit -m "feat(credits): real repository URL, measured tokens and estimated API cost"
```

---

### Task 7 : configuration Vercel

Un seul réglage compte : tout ce qui est sous `/assets/` porte un hash, donc se garde un an. Le reste (`index.html`, image de partage, icônes) garde le cache par défaut de Vercel, revalidé à chaque visite. Aucune commande `vercel` dans cette tâche.

**Files :**
- Create : `vercel.json`
- Modify : `.gitignore`

**Interfaces :**
- Consumes : `bun run build` écrit `dist/` ; tout fichier lourd est dans `dist/assets/` (tâche 2).
- Produces : pour la tâche 12, un projet que `vercel build` sait construire (`bun run build`, sortie `dist`) ; pour la tâche 13, l'en-tête `Cache-Control: public, max-age=31536000, immutable` sur `/assets/*`, que `isLongCache` (tâche 1) reconnaît.

- [ ] **Step 1 : le fichier**

`vercel.json` :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

Source de la forme : exemple officiel de la page `vercel.com/docs/project-configuration/vercel-json` (2026-08-14), cité plus haut. La clé `public` des vieux tutoriels fait échouer un déploiement : ne pas l'ajouter. Pas de règle de réécriture vers `index.html` : le jeu n'a qu'une page, et un fichier absent doit répondre `404`.

- [ ] **Step 2 : le dossier du lien Vercel reste hors de git**

`.gitignore` porte déjà deux lignes non commitées de Romain, à la fin (`.impeccable/`, `rendu-simule/`). Elles restent hors du commit. Enregistrer le diff ci-dessous tel quel dans `.superpowers/gitignore-vercel.patch` (outil Write, une ligne vide à la fin), puis l'appliquer au fichier : `cd /Users/recarnot/dev/claudehot-videogame && git apply .superpowers/gitignore-vercel.patch`.

```diff
diff --git a/.gitignore b/.gitignore
index a7f1ccf..a30ef4c 100644
--- a/.gitignore
+++ b/.gitignore
@@ -7,6 +7,8 @@ _memory_/ONBOARD.md
 /graft/
 node_modules/
 dist/
+# Lien vers le projet Vercel et site construit par `vercel build` (identifiants locaux, jamais commités)
+.vercel/
 
 # Cinématique : prises du jeu, rendus et master (lourds, refaisables)
 videos/agenthot-intro/renders/
```

- [ ] **Step 3 : le fichier est du JSON valide et dit ce qu'on veut**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun -e 'const c = await Bun.file("vercel.json").json(); console.log(c.framework, c.buildCommand, c.outputDirectory, c.headers[0].source, c.headers[0].headers[0].value)'`
Expected : `vite bun run build dist /assets/(.*) public, max-age=31536000, immutable`

- [ ] **Step 4 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add vercel.json && git apply --cached .superpowers/gitignore-vercel.patch && git commit -m "chore(deploy): Vercel configuration with a one-year cache on hashed assets"
```

Jamais `git add .gitignore` : il prendrait les deux lignes de Romain.

Run : `cd /Users/recarnot/dev/claudehot-videogame && git show --stat HEAD | tail -3 && git diff .gitignore | grep -c "^+[.a-z]"`
Expected : `.gitignore | 2 ++` et `vercel.json | 17 +` dans le commit ; puis `2` (les deux lignes de Romain sont toujours là, non commitées).

---

### Task 8 : le README du dépôt

La page où mène l'adresse des crédits. Courte, en français, sans tiret cadratin. Romain la relit à la tâche 9.

**Files :**
- Create : `README.md`

**Interfaces :**
- Consumes : `public/og-v1.jpg` (l'image affichée).
- Produces : rien pour le code.

- [ ] **Step 1 : le fichier**

`README.md` :

````md
# AGENTHOT

Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Une salle, cinq ennemis, quatre balles.

**Jouer : https://agenthot.erom.cloud/**

Sur ordinateur, au clavier et à la souris. Chrome, Safari ou Firefox récents.

![AGENTHOT : un ennemi orange vole en éclats dans une salle de serveurs blanche](public/og-v1.jpg)

## Commandes

| Touche | Action |
| :--- | :--- |
| `ZQSD` ou `WASD` | Se déplacer |
| `Espace` | Sauter |
| `C` | S'accroupir |
| Clic gauche | Tirer. Mains vides : coup de poing |
| Clic droit | Lancer l'arme |
| `E` | Ramasser une arme |
| `Échap` | Pause |
| `R` | Recommencer |

Une seule touche et tu meurs. Aucun ennemi ne tire sans avoir visé : le trait orange prévient toujours.

## Comment c'est fait

AGENTHOT est une vitrine technique de Claude Opus 5.5. Le code, les plans et les revues ont été écrits par Claude, pilotés par eRom. Tout le chantier est lisible dans `docs/superpowers/` : la spec, les plans, les revues.

- **Rendu :** Three.js r186, WebGPU avec repli WebGL2, matériaux et post-traitement en TSL.
- **Simulation :** physique, ennemis et replay écrits à la main en TypeScript, sans moteur externe.
- **Son :** Web Audio. Les bruitages sont synthétisés en code. Les musiques viennent de Lyria 3.5.
- **Images :** l'image de partage et la vignette de la salle 1 sont des captures du jeu. La vignette de la salle 2 vient de Nano Banana 2. La cinématique est montée avec Hyperframes, à partir de séquences filmées par le jeu lui-même.
- **Outils :** Vite, TypeScript, bun.

## Lancer en local

```bash
bun install
bun run dev
```

Puis ouvrir http://localhost:5173/. Les tests : `bun test`.

## Crédits

Author: eRom. Made with: Claude Opus 5.5.

Polices : Big Shoulders Display, Chakra Petch et Martian Mono, sous licence SIL Open Font License 1.1 (`public/fonts/LICENSES.txt`).
````

- [ ] **Step 2 : aucun tiret cadratin, l'image existe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && grep -c $'\u2014' README.md ; ls public/og-v1.jpg`
Expected : `0`, puis le chemin de l'image.

- [ ] **Step 3 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add README.md && git commit -m "docs: README for the public repository"
```

---

## Lot SEO et GEO (ajout de Romain, 2026-09-30 à 18 h)

Mots de Romain, relayés par la session venus : « on fera comme mon site (~/dev/linktree) avec un maximum de SEO/GEO (a-catalog, jsonld, webmcp, ....) ». Ce lot s'exécute après la tâche 8 et avant la recette (tâche 9) : tâches 8b à 8e, puis la tâche 13b après le domaine. Mêmes règles que les tâches 1 à 8 (Sonnet, `tee`, fichiers nommés).

**Ce que le lot ajoute :** une fiche du jeu pour les moteurs (JSON-LD), un titre de page descriptif, `robots.txt`, `sitemap.xml`, `llms.txt` et `llms-full.txt`, un catalogue pour agents, un manifeste, trois outils WebMCP en lecture seule, un script IndexNow. `check-release.ts` contrôle tout ça, sur le dossier construit puis sur le site.

**Ce que le lot ne coûte pas au jeu :** la page grossit de 3 Ko de texte. Les outils WebMCP vivent dans un fichier à part (2,4 Ko), demandé seulement si le navigateur expose l'API. Mesuré sur le prototype : invite à 1 230 ms avec l'API simulée, 1 225 ms sans, fichier WebMCP non demandé sans l'API.

### Prototype vérifié (lot SEO et GEO)

Code exécuté avant d'être écrit ici, sur la branche `feat/agenthot-plan-3c` à `8ef7c5e` (tâches 1 à 8 faites).
- **Rejeu par tâche :** `tsc`, build et `check-release` verts à chaque étape. Suite : 311 → 337 (8b) → 337 (8c) → 346 (8d) → 346 (8e).
- **Contrôle de mise en ligne, après la tâche 8c :** 19 lignes `ok`, `31 files` après la 8d, `release check: all good`.
- **JSON-LD :** dans `dist/index.html`, `contentUrl` vaut `https://agenthot.erom.cloud/assets/intro-<hash>.mp4`, le vrai fichier (le greffon de `vite.config.ts` le remplace au build).
- **WebMCP, dans Chrome sur `vite preview` :** avec une API simulée (`document.modelContext` posé avant la page), les trois outils sont enregistrés, `readOnlyHint: true`, et rendent les faits du jeu. Sans API, le fichier `webmcp-….js` n'est pas demandé.
- **Icônes :** 192 et 512 px vues (losange orange centré). L'icône de 180 px refaite avec le gabarit modifié est identique à l'octet près.
- **Non exécuté :** les en-têtes `Content-Type` de `vercel.json` (ils ne se voient que chez Vercel : tâche 12, étape 6), le jeton d'origin trial, l'envoi IndexNow. Ce sont des gestes de Romain ou d'après-domaine (tâche 13b).

### Faits vérifiés le 2026-09-30 (SEO et GEO)

Référence lue sans y toucher : `~/dev/linktree` (site `www.romain-ecarnot.com`, fichiers du 19 au 28/09/2026). Actualité contrôlée sur le web le même jour. Plusieurs pièces de linktree ont vieilli : le lot suit l'état du jour, et le dit.

- **WebMCP :** brouillon du W3C Web Machine Learning CG du 2026-09-29 (`webmachinelearning.github.io/webmcp`). L'API est `document.modelContext.registerTool(outil)` ; `navigator.modelContext` est l'ancien nom. Un outil : `name`, `description`, `inputSchema`, `annotations.readOnlyHint`, `execute`. Dans Chrome c'est un origin trial nommé « WebMCP » (`developer.chrome.com/blog/ai-webmcp-origin-trial`, 2026-06-09), avec un jeton lié à l'origine, posé par `<meta http-equiv="origin-trial">`. Le jeton de linktree expire le 17/11/2026 (son `AGENTS.md`). Sans jeton ni drapeau (`chrome://flags/#enable-webmcp-testing`), l'API n'existe pas. Forme du résultat d'`execute` (`content: [{ type: "text", text }]`) : reprise de linktree, non confirmée par la page de Chrome.
- **Catalogue pour agents :** le `ai-catalog.json` de linktree suit `ai-catalog.io` (Linux Foundation). Son successeur, ARD v0.91 du 2026-08-26 (`agenticresourcediscovery.org/spec`), sert le même fichier à `/.well-known/ard.json`, avec `rel="ard"`, et garde l'ancien chemin comme repli. `representativeQueries` : 2 à 5 exemples par entrée. Peu de lecteurs connus à ce jour. [candidat 1x - un seul rapport de recherche, non relu à la source par le contrôleur]
- **llms.txt :** `llmstxt.org`. Un titre `# `, un résumé en citation, des sections de liens. Les journaux de serveurs publiés en 2026 montrent que les grands robots le lisent très peu : c'est une assurance à bas prix, pas un levier. Lien recommandé : `rel="alternate" type="text/markdown"` (linktree déclare `text/plain`).
- **robots.txt :** noms relevés dans la documentation de chaque éditeur. Linktree cite `Claude-Web`, `anthropic-ai` et `cohere-ai`, qui ne sont plus les noms documentés : Anthropic documente `ClaudeBot`, `Claude-User`, `Claude-SearchBot` (support.claude.com, 2026-04-07) ; OpenAI `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`.
- **Schema.org :** Google ne montre aucun résultat enrichi pour un `VideoGame` seul : « co-type the VideoGame type with another type » (`developers.google.com/search/docs/appearance/structured-data/software-app`, 2026-09-08). D'où `["VideoGame", "WebApplication"]`. Sans note ni avis, pas de résultat enrichi de toute façon : on n'en invente pas. `VideoObject` : `name`, `thumbnailUrl`, `uploadDate` exigés (`…/structured-data/video`, 2026-09-24).
- **Sitemap :** `changefreq` et `priority` sont ignorés par Google et par Bing. Les adresses de « ping » sont mortes depuis fin 2023 : le sitemap se déclare dans Search Console et Bing Webmaster Tools, ou par la ligne `Sitemap:` de `robots.txt`.
- **IndexNow :** `indexnow.org`. Clé de 8 à 128 caractères servie à `/<clé>.txt`. Un envoi à `api.indexnow.org` vaut pour Bing, Yandex, Naver, Seznam, Yep. Google n'y participe pas.
- **Titre :** Bing Webmaster Tools avertit au-delà de 70 caractères (règle notée dans l'`AGENTS.md` de linktree). Les guides courants visent 60 à 65.
- **Manifeste :** `manifest.webmanifest`, `application/manifest+json`. Il n'apporte rien au référencement. Avec `display: standalone` et des icônes de 192 et 512 px, Chrome peut proposer d'installer le jeu.

### Décisions prises en écrivant ce lot

Réversibles ; Romain les relit à la tâche 9.
13. **Titre de la page :** « AGENTHOT - Le FPS où le temps n'avance que quand tu bouges » (58 caractères). `og:title` reste « AGENTHOT ». Battu : « AGENTHOT » seul (un moteur n'a rien à afficher d'autre que le nom).
14. **Le catalogue est servi sous les deux chemins**, `ard.json` (l'actuel) et `ai-catalog.json` (celui que Romain a nommé), un seul contenu, contrôlé identique. Battu : l'ancien chemin seul (déjà dépassé) ; le nouveau seul (Romain a demandé l'ancien par son nom).
15. **`Person` pointe sur l'identité du site de Romain** (`https://www.romain-ecarnot.com/#person`, avec ses trois `sameAs`). Le jeu dit donc « eRom = Romain Ecarnot » aux moteurs. À confirmer par Romain à la tâche 9.
16. **Tous les robots sont autorisés**, entraînement compris, comme sur linktree. Battu : fermer aux robots d'entraînement (sans effet sur la recherche, mais contraire à « un maximum »).
17. **Trois outils WebMCP, en lecture seule :** `get_game_info`, `get_controls`, `get_credits`. Battu : un outil qui lance une partie (il agirait à la place du joueur ; hors de « lecture seule »).
18. **La vidéo du JSON-LD est le MP4 haché**, écrit dans la page au build par un greffon de 15 lignes (`vite.config.ts`, nouveau fichier). Battu : une copie de la vidéo à une adresse fixe dans `public/` (5,8 Mo hors du cache long) ; pas de `contentUrl` (la fiche vidéo ne sert alors à rien).
19. **Le manifeste propose l'installation.** C'est l'effet de `display: standalone`. Battu : pas de manifeste (Romain l'a sur son site et l'a listé).
20. **Textes en français.** Une seule phrase en anglais : une requête d'exemple du catalogue (« browser FPS where time only moves when you move »), parce que des agents cherchent en anglais.
21. **Après le domaine, trois gestes de Romain** (tâche 13b) : le jeton d'origin trial WebMCP, la déclaration du sitemap, l'envoi IndexNow.

---

### Task 8b : les règles de découverte

Ce qu'un moteur ou un agent doit pouvoir lire, écrit en règles pures et testées. La tâche 8c les branche au contrôle de mise en ligne.

**Files :**
- Create : `scripts/discovery.ts`
- Test : `tests/discovery.test.ts`

**Interfaces :**
- Consumes : rien.
- Produces : `DISCOVERY_FILES`, `DISCOVERY_CONTENT_TYPES`, `DISCOVERY_LINKS`, `DISCOVERY_LIMITS`, `INDEXNOW_KEY`, `readJsonLd`, `jsonLdProblems(html, siteUrl)`, `jsonLdSitePaths(html, siteUrl)`, `headProblems(html)`, `robotsProblems(text, siteUrl)`, `sitemapProblems(xml, siteUrl)`, `llmsProblems(text, siteUrl, name)`, `catalogProblems(text, name)`, `manifestProblems(text): { problems, icons }`, `discoveryFileProblems(path, text, siteUrl)`, `indexNowPayload(siteUrl, key)`.

- [ ] **Step 1 : écrire les tests**

`tests/discovery.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import {
  DISCOVERY_LIMITS,
  catalogProblems,
  headProblems,
  indexNowPayload,
  jsonLdProblems,
  jsonLdSitePaths,
  llmsProblems,
  manifestProblems,
  readJsonLd,
  robotsProblems,
  sitemapProblems,
} from "../scripts/discovery";

const SITE = "https://agenthot.erom.cloud/";
const DASH = String.fromCodePoint(0x2014);

// Un graphe complet. `patch` reçoit les quatre nœuds et peut les changer.
function graph(patch: (nodes: Record<string, Record<string, unknown>>) => void = () => undefined): string {
  const nodes: Record<string, Record<string, unknown>> = {
    site: { "@type": "WebSite", "@id": `${SITE}#website`, url: SITE, name: "AGENTHOT" },
    game: {
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${SITE}#game`,
      url: SITE,
      name: "AGENTHOT",
      image: `${SITE}og-v1.jpg`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      trailer: { "@id": `${SITE}#intro` },
    },
    person: { "@type": "Person", "@id": "https://www.romain-ecarnot.com/#person", name: "Romain Ecarnot", sameAs: ["https://github.com/eRom"] },
    video: {
      "@type": "VideoObject",
      "@id": `${SITE}#intro`,
      name: "AGENTHOT, la cinématique",
      thumbnailUrl: `${SITE}og-v1.jpg`,
      uploadDate: "2026-09-30T17:47:00+02:00",
      contentUrl: `${SITE}assets/intro-DiTX2XMp.mp4`,
    },
  };
  patch(nodes);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": Object.values(nodes) });
}

function page(jsonLd = graph(), head = ""): string {
  return `<!doctype html><html lang="fr"><head><title>AGENTHOT - Le FPS où le temps n'avance que quand tu bouges</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="ai-catalog" href="/.well-known/ai-catalog.json" type="application/ai-catalog+json" />
    <link rel="ard" href="/.well-known/ard.json" type="application/json" />
    <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM Context" />
    ${head}<script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;
}

describe("fiche du jeu en JSON-LD", () => {
  test("un graphe complet n'a aucun problème", () => {
    expect(jsonLdProblems(page(), SITE)).toEqual([]);
    expect(readJsonLd(page())).toHaveLength(4);
  });

  test("une page sans JSON-LD, ou avec un JSON cassé, est refusée", () => {
    expect(jsonLdProblems("<html><head></head></html>", SITE)).toEqual(["missing JSON-LD"]);
    expect(jsonLdProblems(page("{ not json"), SITE)).toEqual(["JSON-LD does not parse"]);
  });

  test("chaque type attendu est réclamé quand il manque", () => {
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.video)), SITE)).toEqual(["JSON-LD has no VideoObject"]);
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.person)), SITE)).toEqual(["JSON-LD has no Person"]);
  });

  test("VideoGame seul n'a pas de résultat enrichi chez Google : il doit aussi être une WebApplication", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!["@type"] = "VideoGame"))), SITE)).toEqual(["VideoGame is not co-typed with WebApplication"]);
  });

  test("le jeu est gratuit, à l'adresse du site, et n'invente aucune note", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.offers = { price: "4.99" }))), SITE)).toEqual(["VideoGame offers.price is not 0"]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.url = "https://example.com/"))), SITE)).toEqual([
      `VideoGame url is https://example.com/, expected ${SITE}`,
    ]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.aggregateRating = { ratingValue: 5 }))), SITE)).toEqual([
      "VideoGame must not declare a rating or a review",
    ]);
  });

  test("la vidéo porte ce que Google exige, et une date avec son fuseau", () => {
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.video!.thumbnailUrl)), SITE)).toEqual(["VideoObject has no thumbnailUrl"]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.video!.uploadDate = "2026-09-30"))), SITE)).toEqual([
      "VideoObject uploadDate is not an ISO 8601 date with a time zone: 2026-09-30",
    ]);
  });

  test("une adresse relative est refusée : un robot ne la résout pas", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.image = "/og-v1.jpg"))), SITE)).toEqual([
      "JSON-LD image is not an absolute https URL: /og-v1.jpg",
    ]);
  });

  test("aucun tiret cadratin dans un texte du graphe", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.description = `Bouge ${DASH} le temps repart.`))), SITE)).toEqual([
      "JSON-LD description contains an em dash",
    ]);
  });

  test("les fichiers du site cités par le graphe sont relevés une fois, sans les identifiants", () => {
    expect(jsonLdSitePaths(page(), SITE).sort()).toEqual(["assets/intro-DiTX2XMp.mp4", "og-v1.jpg"]);
  });
});

describe("titre et liens de découverte", () => {
  test("la page complète passe ; chaque lien manquant est réclamé", () => {
    expect(headProblems(page())).toEqual([]);
    expect(headProblems(page().replace(/<link rel="ard"[^>]*>/, ""))).toEqual(['missing link: rel="ard" href="/.well-known/ard.json"']);
    expect(headProblems(page().replace(/<link rel="manifest"[^>]*>/, ""))).toEqual(['missing link: rel="manifest" href="/manifest.webmanifest"']);
  });

  test("un titre trop long pour les moteurs est refusé, la limite passe", () => {
    const at = (length: number): string => page().replace(/<title>[^<]*<\/title>/, `<title>${"x".repeat(length)}</title>`);
    expect(headProblems(at(DISCOVERY_LIMITS.pageTitleChars))).toEqual([]);
    expect(headProblems(at(DISCOVERY_LIMITS.pageTitleChars + 1))).toEqual(["<title> has 66 characters (max 65)"]);
  });
});

describe("robots.txt", () => {
  const robots = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`;

  test("ouvert à tous, avec le plan du site : rien à dire", () => {
    expect(robotsProblems(robots, SITE)).toEqual([]);
  });

  test("un chemin fermé, une règle générale absente, un plan du site absent ou relatif : signalés", () => {
    expect(robotsProblems(robots.replace("Allow: /\n\nUser-agent: GPTBot", "Disallow: /assets/\n\nUser-agent: GPTBot"), SITE)).toEqual([
      "robots.txt closes a path: Disallow: /assets/",
    ]);
    expect(robotsProblems(robots.replace("User-agent: *", "User-agent: Googlebot"), SITE)).toEqual(["robots.txt has no rule for every robot (User-agent: *)"]);
    expect(robotsProblems(robots.replace(`${SITE}sitemap.xml`, "/sitemap.xml"), SITE)).toEqual([`robots.txt lacks the line: Sitemap: ${SITE}sitemap.xml`]);
  });

  test("« Disallow: » vide n'interdit rien", () => {
    expect(robotsProblems(`${robots}User-agent: Bingbot\nDisallow:\n`, SITE)).toEqual([]);
  });
});

describe("sitemap.xml", () => {
  const sitemap = (body: string): string => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
  const url = `<url><loc>${SITE}</loc><lastmod>2026-09-30</lastmod></url>`;

  test("l'adresse du jeu et sa date : rien à dire", () => {
    expect(sitemapProblems(sitemap(url), SITE)).toEqual([]);
  });

  test("adresse du jeu absente, autre site, date absente ou illisible : signalés", () => {
    expect(sitemapProblems(sitemap(""), SITE)).toEqual([`sitemap.xml does not list ${SITE}`]);
    expect(sitemapProblems(sitemap(`${url}<url><loc>https://example.com/</loc><lastmod>2026-09-30</lastmod></url>`), SITE)).toEqual([
      "sitemap.xml lists another site: https://example.com/",
    ]);
    expect(sitemapProblems(sitemap(`<url><loc>${SITE}</loc></url>`), SITE)).toEqual(["sitemap.xml: every <url> needs a <lastmod>"]);
    expect(sitemapProblems(sitemap(url.replace("2026-09-30", "30/09/2026")), SITE)).toEqual(["sitemap.xml lastmod is not a date: 30/09/2026"]);
  });

  test("changefreq et priority, ignorés par les moteurs, sont refusés", () => {
    expect(sitemapProblems(sitemap(url.replace("</url>", "<priority>1.0</priority></url>")), SITE)).toEqual([
      "sitemap.xml declares changefreq or priority, which search engines ignore",
    ]);
  });
});

describe("llms.txt", () => {
  const llms = `# AGENTHOT\n\n> Un FPS où le temps n'avance que quand tu bouges.\n\n- [Jouer](${SITE})\n`;

  test("un titre, un résumé, l'adresse du jeu : rien à dire", () => {
    expect(llmsProblems(llms, SITE, "llms.txt")).toEqual([]);
  });

  test("sans titre, sans résumé, sans adresse, avec un tiret cadratin : signalés", () => {
    expect(llmsProblems(llms.replace("# AGENTHOT", "AGENTHOT"), SITE, "llms.txt")).toEqual(['llms.txt does not start with a "# " title']);
    expect(llmsProblems(llms.replace("> Un", "Un"), SITE, "llms.txt")).toEqual(['llms.txt has no "> " summary']);
    expect(llmsProblems(llms.replace(`(${SITE})`, "(plus tard)"), SITE, "llms-full.txt")).toEqual(["llms-full.txt never gives the address of the game"]);
    expect(llmsProblems(`${llms}Bouge ${DASH} tire.\n`, SITE, "llms.txt")).toEqual(["llms.txt contains an em dash"]);
  });

  test("une adresse du site en http, ou sans la barre du domaine, est refusée", () => {
    expect(llmsProblems(`${llms}- http://agenthot.erom.cloud/llms.txt\n`, SITE, "llms.txt")).toEqual([
      "llms.txt has a wrong address for the site: http://agenthot.erom.cloud/llms.txt",
    ]);
  });
});

describe("catalogue pour agents", () => {
  const entry = {
    identifier: "urn:air:erom.cloud:agenthot:game",
    displayName: "AGENTHOT",
    type: "text/html",
    description: "Le jeu.",
    url: SITE,
    representativeQueries: ["jeu FPS gratuit dans le navigateur", "jeu où le temps n'avance que quand on bouge"],
  };
  const catalog = (entries: unknown[]): string => JSON.stringify({ specVersion: "1.0", entries });

  test("une entrée complète : rien à dire", () => {
    expect(catalogProblems(catalog([entry]), "ard.json")).toEqual([]);
  });

  test("JSON cassé, catalogue vide, champ manquant, adresse relative : signalés", () => {
    expect(catalogProblems("{", "ard.json")).toEqual(["ard.json does not parse"]);
    expect(catalogProblems(catalog([]), "ard.json")).toEqual(["ard.json has no entry"]);
    expect(catalogProblems(catalog([{ ...entry, displayName: "" }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game has no displayName",
    ]);
    expect(catalogProblems(catalog([{ ...entry, url: "/llms.txt" }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game url is not absolute",
    ]);
  });

  test("entre 2 et 5 requêtes d'exemple par entrée", () => {
    expect(catalogProblems(catalog([{ ...entry, representativeQueries: ["une seule"] }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game has 1 representativeQueries (2 to 5 expected)",
    ]);
  });
});

describe("manifeste", () => {
  const manifest = {
    name: "AGENTHOT",
    short_name: "AGENTHOT",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  test("complet : rien à dire, et les icônes annoncées sont rendues en chemins", () => {
    expect(manifestProblems(JSON.stringify(manifest))).toEqual({ problems: [], icons: ["icon-192.png", "icon-512.png"] });
  });

  test("JSON cassé, champ manquant, icône de 512 px absente : signalés", () => {
    expect(manifestProblems("nope").problems).toEqual(["manifest.webmanifest does not parse"]);
    expect(manifestProblems(JSON.stringify({ ...manifest, start_url: "" })).problems).toEqual(["manifest.webmanifest has no start_url"]);
    expect(manifestProblems(JSON.stringify({ ...manifest, icons: manifest.icons.slice(0, 1) })).problems).toEqual([
      "manifest.webmanifest has no 512x512 icon",
    ]);
  });
});

describe("IndexNow", () => {
  test("la requête donne l'hôte sans protocole, la clé, son adresse et la page du jeu", () => {
    expect(indexNowPayload(SITE, "agenthot-key")).toEqual({
      host: "agenthot.erom.cloud",
      key: "agenthot-key",
      keyLocation: `${SITE}agenthot-key.txt`,
      urlList: [SITE],
    });
  });
});
```

- [ ] **Step 2 : ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/discovery.test.ts 2>&1 | tail -8`
Expected : FAIL, `Cannot find module '../scripts/discovery'`.

- [ ] **Step 3 : écrire les règles**

`scripts/discovery.ts` :

```ts
// Contrôles de découverte (moteurs de recherche et agents IA) : ce qu'un robot lit en dehors des balises de partage.
// JSON-LD de la page, robots.txt, sitemap.xml, llms.txt, catalogue pour agents, manifeste. Logique pure :
// scripts/check-release.ts la branche au disque et au réseau.

// Tiret cadratin : banni de tout texte lu par un tiers (règle de Romain).
const EM_DASH = String.fromCodePoint(0x2014);

export const DISCOVERY_LIMITS = {
  // Bing Webmaster Tools avertit au-delà de 70 caractères ; les guides courants visent 60 à 65 (relevé le 2026-09-30).
  pageTitleChars: 65,
  // ARD v0.91 : « representativeQueries SHOULD contain 2-5 examples ».
  minQueries: 2,
  maxQueries: 5,
} as const;

// Fichiers servis à une adresse fixe, que la page ou un autre fichier annonce. Chemins relatifs à la racine du site.
export const DISCOVERY_FILES = [
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "llms-full.txt",
  ".well-known/ai-catalog.json",
  ".well-known/ard.json",
  "manifest.webmanifest",
] as const;

// Type de contenu attendu en ligne pour chacun (réglé dans vercel.json quand l'hébergeur ne le devine pas).
export const DISCOVERY_CONTENT_TYPES: Readonly<Record<(typeof DISCOVERY_FILES)[number], string>> = {
  "robots.txt": "text/plain",
  "sitemap.xml": "xml",
  "llms.txt": "text/markdown",
  "llms-full.txt": "text/markdown",
  ".well-known/ai-catalog.json": "application/ai-catalog+json",
  ".well-known/ard.json": "application/json",
  "manifest.webmanifest": "application/manifest+json",
};

// Clé IndexNow du site : publique par nature, servie à /<clé>.txt (indexnow.org). Envoi : scripts/submit-indexnow.ts.
export const INDEXNOW_KEY = "agenthot-hjjp0jh6j53192gxquqxg84k";

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

// Corps de la requête IndexNow (indexnow.org/documentation) : l'hôte, la clé, où la lire, et les adresses changées.
export function indexNowPayload(siteUrl: string, key: string): IndexNowPayload {
  return { host: new URL(siteUrl).host, key, keyLocation: `${siteUrl}${key}.txt`, urlList: [siteUrl] };
}

// Liens de découverte attendus dans le <head> : `rel` → adresse.
export const DISCOVERY_LINKS: Readonly<Record<string, string>> = {
  manifest: "/manifest.webmanifest",
  "ai-catalog": "/.well-known/ai-catalog.json",
  ard: "/.well-known/ard.json",
  alternate: "/llms.txt",
};

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g)) out[match[1]!.toLowerCase()] = match[2]!;
  return out;
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): JsonObject | null {
  try {
    const value = JSON.parse(text) as Json;
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

// Toutes les chaînes d'un JSON, avec le nom de la clé qui les porte.
function strings(value: Json, key = "", out: { key: string; text: string }[] = []): { key: string; text: string }[] {
  if (typeof value === "string") out.push({ key, text: value });
  else if (Array.isArray(value)) for (const item of value) strings(item, key, out);
  else if (isObject(value)) for (const [name, item] of Object.entries(value)) strings(item, name, out);
  return out;
}

// Nœuds du graphe JSON-LD de la page ; null si un bloc ne se lit pas.
export function readJsonLd(html: string): JsonObject[] | null {
  const nodes: JsonObject[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    const block = parseJson(match[1]!);
    if (!block) return null;
    const graph = block["@graph"];
    if (Array.isArray(graph)) for (const node of graph) if (isObject(node)) nodes.push(node);
    if (!Array.isArray(graph)) nodes.push(block);
  }
  return nodes;
}

function types(node: JsonObject): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  return Array.isArray(type) ? type.filter((item): item is string => typeof item === "string") : [];
}

// Clés dont la valeur est une adresse : elle doit être absolue, un robot ne résout pas un chemin relatif.
const URL_KEYS = new Set(["@id", "url", "image", "thumbnailUrl", "contentUrl", "sameAs"]);

// Adresses du site citées par le JSON-LD, en chemins locaux (« og-v1.jpg », « assets/intro-….mp4 »).
export function jsonLdSitePaths(html: string, siteUrl: string): string[] {
  const paths = new Set<string>();
  for (const node of readJsonLd(html) ?? []) {
    for (const { key, text } of strings(node)) {
      if (!URL_KEYS.has(key) || key === "@id" || !text.startsWith(siteUrl)) continue;
      const path = text.slice(siteUrl.length).split(/[?#]/)[0]!;
      if (path) paths.add(path);
    }
  }
  return [...paths];
}

// Ce qui empêcherait un moteur de lire la fiche du jeu. Liste vide : le JSON-LD est prêt.
export function jsonLdProblems(html: string, siteUrl: string): string[] {
  const nodes = readJsonLd(html);
  if (nodes === null) return ["JSON-LD does not parse"];
  if (nodes.length === 0) return ["missing JSON-LD"];
  const problems: string[] = [];
  const find = (type: string): JsonObject | undefined => nodes.find((node) => types(node).includes(type));
  for (const type of ["VideoGame", "WebSite", "Person", "VideoObject"]) if (!find(type)) problems.push(`JSON-LD has no ${type}`);
  const game = find("VideoGame");
  if (game) {
    // Google : « co-type the VideoGame type with another type » (structured-data/software-app, 2026-09-08).
    if (!types(game).includes("WebApplication")) problems.push("VideoGame is not co-typed with WebApplication");
    if (game.url !== siteUrl) problems.push(`VideoGame url is ${String(game.url)}, expected ${siteUrl}`);
    const offers = game.offers;
    if (!isObject(offers) || String(offers.price) !== "0") problems.push("VideoGame offers.price is not 0");
    // Une note inventée est une donnée structurée trompeuse : le jeu n'a aucun avis.
    if ("aggregateRating" in game || "review" in game) problems.push("VideoGame must not declare a rating or a review");
  }
  const video = find("VideoObject");
  if (video) {
    // Google exige name, thumbnailUrl et uploadDate (structured-data/video, 2026-09-24).
    for (const key of ["name", "thumbnailUrl", "uploadDate", "contentUrl"]) if (!video[key]) problems.push(`VideoObject has no ${key}`);
    const uploaded = typeof video.uploadDate === "string" ? video.uploadDate : "";
    if (uploaded && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(uploaded)) {
      problems.push(`VideoObject uploadDate is not an ISO 8601 date with a time zone: ${uploaded}`);
    }
  }
  for (const node of nodes) {
    for (const { key, text } of strings(node)) {
      if (URL_KEYS.has(key) && !/^https:\/\//.test(text)) problems.push(`JSON-LD ${key} is not an absolute https URL: ${text}`);
      if (text.includes(EM_DASH)) problems.push(`JSON-LD ${key} contains an em dash`);
    }
  }
  return problems;
}

// Titre et liens de découverte du <head>.
export function headProblems(html: string): string[] {
  const problems: string[] = [];
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  if (title.length > DISCOVERY_LIMITS.pageTitleChars) problems.push(`<title> has ${title.length} characters (max ${DISCOVERY_LIMITS.pageTitleChars})`);
  if (title.includes(EM_DASH)) problems.push("<title> contains an em dash");
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]));
  for (const [rel, href] of Object.entries(DISCOVERY_LINKS)) {
    if (!links.some((link) => link.rel === rel && link.href === href)) problems.push(`missing link: rel="${rel}" href="${href}"`);
  }
  return problems;
}

// robots.txt : tout le monde peut lire le site, et le plan du site est annoncé en adresse absolue.
export function robotsProblems(text: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  if (!lines.some((line) => /^user-agent:\s*\*$/i.test(line))) problems.push("robots.txt has no rule for every robot (User-agent: *)");
  const closed = lines.filter((line) => /^disallow:\s*\S/i.test(line));
  if (closed.length > 0) problems.push(`robots.txt closes a path: ${closed.join(" ; ")}`);
  const sitemap = `Sitemap: ${siteUrl}sitemap.xml`;
  if (!lines.includes(sitemap)) problems.push(`robots.txt lacks the line: ${sitemap}`);
  return problems;
}

// sitemap.xml : l'adresse du jeu, et une date de dernière modification lisible.
export function sitemapProblems(xml: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!);
  if (!locs.includes(siteUrl)) problems.push(`sitemap.xml does not list ${siteUrl}`);
  for (const loc of locs) if (!loc.startsWith(siteUrl)) problems.push(`sitemap.xml lists another site: ${loc}`);
  const dates = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((match) => match[1]!);
  if (dates.length !== locs.length) problems.push("sitemap.xml: every <url> needs a <lastmod>");
  for (const date of dates) if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push(`sitemap.xml lastmod is not a date: ${date}`);
  // Ignorés par Google et par Bing : les écrire laisse croire qu'ils servent.
  if (/<(changefreq|priority)>/.test(xml)) problems.push("sitemap.xml declares changefreq or priority, which search engines ignore");
  return problems;
}

// llms.txt (llmstxt.org) : un titre, un résumé en citation, des adresses du site justes.
export function llmsProblems(text: string, siteUrl: string, name: string): string[] {
  const problems: string[] = [];
  const lines = text.split(/\r?\n/);
  if (!/^# \S/.test(lines[0] ?? "")) problems.push(`${name} does not start with a "# " title`);
  if (!lines.some((line) => line.startsWith("> "))) problems.push(`${name} has no "> " summary`);
  if (text.includes(EM_DASH)) problems.push(`${name} contains an em dash`);
  if (!text.includes(siteUrl)) problems.push(`${name} never gives the address of the game`);
  const host = new URL(siteUrl).host;
  for (const match of text.matchAll(/https?:\/\/[^\s)>`]+/g)) {
    if (new URL(match[0]).host === host && !match[0].startsWith(siteUrl)) problems.push(`${name} has a wrong address for the site: ${match[0]}`);
  }
  return problems;
}

// Catalogue pour agents (ai-catalog.io, et son successeur ARD) : des entrées complètes, en adresses absolues.
export function catalogProblems(text: string, name: string): string[] {
  const catalog = parseJson(text);
  if (!catalog) return [`${name} does not parse`];
  const problems: string[] = [];
  const entries = Array.isArray(catalog.entries) ? catalog.entries.filter(isObject) : [];
  if (entries.length === 0) problems.push(`${name} has no entry`);
  for (const entry of entries) {
    const id = String(entry.identifier ?? "?");
    for (const key of ["identifier", "displayName", "type", "url", "description"]) {
      if (typeof entry[key] !== "string" || entry[key] === "") problems.push(`${name}: entry ${id} has no ${key}`);
    }
    if (typeof entry.url === "string" && !/^https:\/\//.test(entry.url)) problems.push(`${name}: entry ${id} url is not absolute`);
    const queries = Array.isArray(entry.representativeQueries) ? entry.representativeQueries : [];
    if (queries.length < DISCOVERY_LIMITS.minQueries || queries.length > DISCOVERY_LIMITS.maxQueries) {
      problems.push(`${name}: entry ${id} has ${queries.length} representativeQueries (${DISCOVERY_LIMITS.minQueries} to ${DISCOVERY_LIMITS.maxQueries} expected)`);
    }
  }
  if (strings(catalog).some(({ text: value }) => value.includes(EM_DASH))) problems.push(`${name} contains an em dash`);
  return problems;
}

// Manifeste : un nom, une adresse de départ, et les icônes de 192 et 512 px qu'il annonce. Rend aussi leurs chemins.
export function manifestProblems(text: string): { problems: string[]; icons: string[] } {
  const manifest = parseJson(text);
  if (!manifest) return { problems: ["manifest.webmanifest does not parse"], icons: [] };
  const problems: string[] = [];
  for (const key of ["name", "short_name", "start_url", "display", "lang"]) {
    if (typeof manifest[key] !== "string" || manifest[key] === "") problems.push(`manifest.webmanifest has no ${key}`);
  }
  const icons = Array.isArray(manifest.icons) ? manifest.icons.filter(isObject) : [];
  for (const size of ["192x192", "512x512"]) {
    if (!icons.some((icon) => icon.sizes === size)) problems.push(`manifest.webmanifest has no ${size} icon`);
  }
  if (strings(manifest).some(({ text: value }) => value.includes(EM_DASH))) problems.push("manifest.webmanifest contains an em dash");
  const paths = icons.map((icon) => String(icon.src ?? "").replace(/^\//, "")).filter((path) => path !== "");
  return { problems, icons: paths };
}

// Problèmes d'un fichier de découverte, d'après son chemin. Le manifeste rend aussi ses icônes par manifestProblems.
export function discoveryFileProblems(path: (typeof DISCOVERY_FILES)[number], text: string, siteUrl: string): string[] {
  switch (path) {
    case "robots.txt":
      return robotsProblems(text, siteUrl);
    case "sitemap.xml":
      return sitemapProblems(text, siteUrl);
    case "llms.txt":
    case "llms-full.txt":
      return llmsProblems(text, siteUrl, path);
    case ".well-known/ai-catalog.json":
    case ".well-known/ard.json":
      return catalogProblems(text, path);
    case "manifest.webmanifest":
      return manifestProblems(text).problems;
  }
}
```

- [ ] **Step 4 : tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/discovery.test.ts 2>&1 | tail -5`
Expected : `26 pass`, `0 fail`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `337 pass`, `0 fail`.

- [ ] **Step 5 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/discovery.ts tests/discovery.test.ts && git commit -m "feat(release): discovery rules for structured data, robots, sitemap, llms.txt and agent catalog"
```

---

### Task 8c : la fiche du jeu, les fichiers de découverte, le contrôle

Tout ce qu'un robot lit hors des balises de partage : le JSON-LD et les liens dans `index.html`, sept fichiers à adresse fixe dans `public/`, deux icônes, les types de contenu chez Vercel. `check-release.ts` contrôle le tout.

**Files :**
- Create : `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, `public/llms-full.txt`, `public/.well-known/ard.json`, `public/.well-known/ai-catalog.json` (copie), `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png` (fabriquées), `public/agenthot-hjjp0jh6j53192gxquqxg84k.txt`, `vite.config.ts`
- Modify : `index.html`, `tsconfig.json`, `scripts/og/icon.html`, `scripts/check-release.ts`, `vercel.json`

**Interfaces :**
- Consumes : `scripts/discovery.ts` (tâche 8b) ; `src/ui/video/intro.mp4` importé par `src/ui/media.ts` (tâche 2).
- Produces : `bun scripts/check-release.ts dist` sort les lignes `discovery head`, `structured data`, une ligne par fichier de découverte, `manifest icons exist`, `both agent catalogs are identical`, `IndexNow key file`. En mode adresse : une ligne `<fichier> served` par fichier, avec son type de contenu.

- [ ] **Step 1 : les fichiers à adresse fixe**

`public/robots.txt` :

```txt
# AGENTHOT : tout le site est ouvert aux moteurs de recherche et aux robots d'IA.
User-agent: *
Allow: /

# Recherche et réponses en direct (noms relevés dans la documentation de chaque éditeur, 2026-09-30)
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: MistralAI-Index
Allow: /

User-agent: MistralAI-User
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Amzn-SearchBot
Allow: /

User-agent: Applebot
Allow: /

# Entraînement des modèles
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: MistralAI-Training
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: CCBot
Allow: /

# Moteurs classiques
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://agenthot.erom.cloud/sitemap.xml
```

`public/sitemap.xml` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://agenthot.erom.cloud/</loc>
    <lastmod>2026-09-30</lastmod>
  </url>
</urlset>
```

`public/llms.txt` :

```txt
# AGENTHOT

> Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Gratuit, sans compte, sans installation. Une vitrine technique de Claude Opus 5.5, pilotée par eRom (Romain Ecarnot).

AGENTHOT se joue sur ordinateur, au clavier et à la souris, dans Chrome, Safari ou Firefox récents. Une salle, cinq ennemis, quatre balles. Une seule touche et tu meurs. Quand tu t'arrêtes, le temps se fige : tu lis la salle, tu choisis, tu repars. La victoire rejoue ta partie en temps réel.

## Jouer

- [AGENTHOT](https://agenthot.erom.cloud/): le jeu. Il démarre dès la page ouverte.

## Comprendre le jeu

- [Tout le jeu en une page](https://agenthot.erom.cloud/llms-full.txt): règles, commandes, technique, crédits.
- [Sources](https://github.com/eRom/agenthot-the-game): le code, la spec, les plans et les revues.

## Auteur

- [Romain Ecarnot](https://www.romain-ecarnot.com/): eRom, l'auteur.

## Optional

- [Image de partage](https://agenthot.erom.cloud/og-v1.jpg): une capture du jeu, 1200 x 630.
```

`public/llms-full.txt` :

```txt
# AGENTHOT : tout le jeu en une page

> Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Gratuit, sans compte, sans installation.
> Adresse : https://agenthot.erom.cloud/

## 1. Le jeu

AGENTHOT est un jeu de tir à la première personne qui se joue dans un navigateur, sur ordinateur. Son idée tient en une phrase : le temps n'avance que quand tu bouges ou que tu tires. Immobile, tout se fige : les balles restent en l'air, les ennemis s'arrêtent au milieu d'un pas.

Ce n'est donc pas un jeu de réflexes. C'est un jeu de lecture : tu regardes où sont les ennemis, où vont les balles, et tu choisis ton prochain geste.

- **Une salle :** une salle de serveurs blanche, avec des baies, des étagères et une passerelle.
- **Cinq ennemis :** trois au départ, deux qui sortent des baies quand il n'en reste que deux. Ils sont orange, faits de facettes, et volent en éclats.
- **Quatre balles :** une arme vide se lance. Une arme tombée se ramasse. Mains vides, tu frappes.
- **Une seule touche et tu meurs.** La relance est immédiate.
- **Aucun ennemi ne tire sans avoir visé :** un trait orange prévient toujours.
- **La victoire rejoue ta partie en temps réel,** sans les pauses.

Une deuxième salle est annoncée dans le menu. Elle n'est pas encore jouable.

## 2. Commandes

| Touche | Action |
| :--- | :--- |
| ZQSD ou WASD | Se déplacer |
| Souris | Viser |
| Espace | Sauter |
| C | S'accroupir |
| Clic gauche | Tirer. Mains vides : coup de poing |
| Clic droit | Lancer l'arme |
| E | Ramasser une arme |
| Échap | Pause |
| R | Recommencer |

Les touches suivent leur position sur le clavier : ZQSD sur un clavier français, WASD sur un clavier américain.

## 3. Pour jouer

- **Prix :** gratuit. Pas de compte, pas de publicité, rien à installer.
- **Appareil :** un ordinateur, avec un clavier et une souris. Sur téléphone ou tablette, le site montre la cinématique et invite à revenir sur ordinateur.
- **Navigateur :** Chrome, Safari ou Firefox récents. Le jeu utilise WebGPU, avec un repli sur WebGL2.
- **Langue :** français.
- **Son :** mieux au casque.

## 4. Comment c'est fait

AGENTHOT est une vitrine technique de Claude Opus 5.5. Le code, les plans et les revues ont été écrits par Claude, pilotés par eRom.

- **Rendu :** Three.js r186, WebGPU avec repli WebGL2, matériaux et post-traitement en TSL.
- **Simulation :** physique, ennemis et replay écrits à la main en TypeScript, sans moteur externe.
- **Son :** Web Audio. Les bruitages sont synthétisés en code. Les musiques viennent de Lyria 3.5.
- **Cinématique :** montée avec Hyperframes, à partir de séquences filmées par le jeu lui-même.
- **Outils :** Vite, TypeScript, bun.

## 5. Crédits

- **Auteur :** eRom (Romain Ecarnot), https://www.romain-ecarnot.com/
- **Fait avec :** Claude Opus 5.5
- **Sources :** https://github.com/eRom/agenthot-the-game
- **Polices :** Big Shoulders Display, Chakra Petch et Martian Mono, sous licence SIL Open Font License 1.1 (https://agenthot.erom.cloud/fonts/LICENSES.txt)

Le nombre de tokens et le coût API estimé du chantier se lisent dans le jeu : menu, puis Crédits.

## 6. Pour les robots et les agents

- **Résumé :** https://agenthot.erom.cloud/llms.txt
- **Catalogue pour agents :** https://agenthot.erom.cloud/.well-known/ard.json (et https://agenthot.erom.cloud/.well-known/ai-catalog.json, l'ancien chemin)
- **Plan du site :** https://agenthot.erom.cloud/sitemap.xml
- **Outils WebMCP :** la page expose trois outils en lecture seule aux agents du navigateur : `get_game_info`, `get_controls`, `get_credits`.
```

`public/.well-known/ard.json` :

```json
{
  "specVersion": "1.0",
  "host": {
    "displayName": "AGENTHOT",
    "identifier": "did:web:agenthot.erom.cloud",
    "documentationUrl": "https://agenthot.erom.cloud/llms.txt"
  },
  "entries": [
    {
      "identifier": "urn:air:agenthot.erom.cloud:game:play",
      "displayName": "AGENTHOT, le jeu",
      "type": "text/html",
      "description": "Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Gratuit, sans compte, sur ordinateur, au clavier et à la souris.",
      "url": "https://agenthot.erom.cloud/",
      "tags": ["game", "fps", "browser-game", "webgpu", "free"],
      "representativeQueries": [
        "jeu FPS gratuit jouable dans le navigateur",
        "jeu où le temps n'avance que quand on bouge",
        "jeu WebGPU fait avec Claude",
        "browser FPS where time only moves when you move"
      ]
    },
    {
      "identifier": "urn:air:agenthot.erom.cloud:docs:llms",
      "displayName": "AGENTHOT, résumé pour les modèles",
      "type": "text/markdown",
      "description": "Ce qu'est le jeu, comment y jouer et où sont ses sources, en quelques lignes.",
      "url": "https://agenthot.erom.cloud/llms.txt",
      "tags": ["summary", "llms-txt"],
      "representativeQueries": ["c'est quoi AGENTHOT", "qui a fait AGENTHOT"]
    },
    {
      "identifier": "urn:air:agenthot.erom.cloud:docs:full",
      "displayName": "AGENTHOT, tout le jeu en une page",
      "type": "text/markdown",
      "description": "Règles, commandes, configuration requise, technique et crédits.",
      "url": "https://agenthot.erom.cloud/llms-full.txt",
      "tags": ["rules", "controls", "credits"],
      "representativeQueries": ["les commandes d'AGENTHOT", "comment AGENTHOT a été fait", "AGENTHOT marche sur quel navigateur"]
    },
    {
      "identifier": "urn:air:agenthot.erom.cloud:code:github",
      "displayName": "Sources d'AGENTHOT",
      "type": "text/html",
      "description": "Le code du jeu, sa spec, ses plans et ses revues.",
      "url": "https://github.com/eRom/agenthot-the-game",
      "tags": ["source-code", "github", "typescript", "threejs"],
      "representativeQueries": ["code source d'AGENTHOT", "un jeu entier écrit par Claude Opus 5.5"]
    }
  ]
}
```

`public/manifest.webmanifest` :

```json
{
  "name": "AGENTHOT",
  "short_name": "AGENTHOT",
  "description": "Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur.",
  "lang": "fr",
  "start_url": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#0d111b",
  "theme_color": "#0d111b",
  "categories": ["games"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

Puis la copie du catalogue sous son ancien chemin, et le fichier de la clé IndexNow (la clé seule, sans retour à la ligne ; elle est publique) :

```bash
cd /Users/recarnot/dev/claudehot-videogame && cp public/.well-known/ard.json public/.well-known/ai-catalog.json
cd /Users/recarnot/dev/claudehot-videogame && printf 'agenthot-hjjp0jh6j53192gxquqxg84k' > public/agenthot-hjjp0jh6j53192gxquqxg84k.txt
```

- [ ] **Step 2 : le greffon qui écrit l'adresse de la cinématique**

`vite.config.ts` :

```ts
import { type Plugin, defineConfig } from "vite";

// Adresse écrite dans le JSON-LD d'index.html à la place du MP4 de la cinématique. Le fichier réel porte un hash
// (assets/intro-<hash>.mp4), connu seulement au build : ce greffon met la vraie adresse dans la page construite.
const INTRO_PLACEHOLDER = "/assets/intro.mp4";

function introVideoUrl(): Plugin {
  return {
    name: "agenthot-intro-video-url",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const file = Object.keys(context.bundle ?? {}).find((name) => /^assets\/intro-[\w-]+\.mp4$/.test(name));
        // Un build sans la cinématique livrerait une adresse morte aux moteurs : on échoue plutôt.
        if (!file) throw new Error("intro video not found in the bundle: the JSON-LD contentUrl cannot be resolved");
        if (!html.includes(INTRO_PLACEHOLDER)) throw new Error(`index.html no longer contains ${INTRO_PLACEHOLDER}`);
        return html.replaceAll(INTRO_PLACEHOLDER, `/${file}`);
      },
    },
  };
}

export default defineConfig({ plugins: [introVideoUrl()] });
```

```diff
diff --git a/tsconfig.json b/tsconfig.json
index 2f81efd..aff57f3 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -15,5 +15,5 @@
     "skipLibCheck": true,
     "noEmit": true
   },
-  "include": ["src", "tests", "scripts"]
+  "include": ["src", "tests", "scripts", "vite.config.ts"]
 }
```

- [ ] **Step 3 : la page**

```diff
diff --git a/index.html b/index.html
index 0d9306c..52bf842 100644
--- a/index.html
+++ b/index.html
@@ -4,11 +4,20 @@
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta name="theme-color" content="#0d111b" />
-    <title>AGENTHOT</title>
+    <title>AGENTHOT - Le FPS où le temps n'avance que quand tu bouges</title>
     <meta name="description" content="Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur." />
     <link rel="canonical" href="https://agenthot.erom.cloud/" />
     <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
     <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
+    <link rel="manifest" href="/manifest.webmanifest" />
+    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
+    <meta name="author" content="Romain Ecarnot (eRom)" />
+    <!-- Découverte par les agents IA : catalogue (ARD, et son ancien chemin ai-catalog) et résumés en Markdown.
+         Contrôle : bun scripts/check-release.ts dist -->
+    <link rel="ard" href="/.well-known/ard.json" type="application/json" />
+    <link rel="ai-catalog" href="/.well-known/ai-catalog.json" type="application/ai-catalog+json" />
+    <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM Context" />
+    <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="LLM Context Full" />
     <!-- Aperçu du lien partagé (spec 4.7). Les robots ne lancent aucun script : tout est écrit ici, en URL absolues.
          Une nouvelle image change de nom (og-v2.jpg) : les plateformes gardent l'ancienne en cache par URL.
          Contrôle : bun scripts/check-release.ts dist -->
@@ -23,6 +32,67 @@
     <meta property="og:image:height" content="630" />
     <meta property="og:image:alt" content="AGENTHOT : un ennemi orange vole en éclats dans une salle de serveurs blanche, vu à la première personne." />
     <meta name="twitter:card" content="summary_large_image" />
+    <!-- Fiche du jeu pour les moteurs (Schema.org). « /assets/intro.mp4 » est remplacé au build par le nom haché
+         de la cinématique (vite.config.ts). Les mêmes faits sont dans public/llms.txt et src/app/game-facts.ts. -->
+    <script type="application/ld+json">
+      {
+        "@context": "https://schema.org",
+        "@graph": [
+          {
+            "@type": "WebSite",
+            "@id": "https://agenthot.erom.cloud/#website",
+            "url": "https://agenthot.erom.cloud/",
+            "name": "AGENTHOT",
+            "inLanguage": "fr-FR",
+            "publisher": { "@id": "https://www.romain-ecarnot.com/#person" }
+          },
+          {
+            "@type": ["VideoGame", "WebApplication"],
+            "@id": "https://agenthot.erom.cloud/#game",
+            "url": "https://agenthot.erom.cloud/",
+            "name": "AGENTHOT",
+            "description": "Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Une salle, cinq ennemis, quatre balles. Gratuit, sans compte, sur ordinateur.",
+            "image": "https://agenthot.erom.cloud/og-v1.jpg",
+            "inLanguage": "fr-FR",
+            "genre": ["Jeu de tir à la première personne", "FPS", "Action"],
+            "gamePlatform": "Navigateur web",
+            "playMode": "https://schema.org/SinglePlayer",
+            "applicationCategory": "GameApplication",
+            "operatingSystem": "Tout système avec un navigateur récent (WebGPU ou WebGL2)",
+            "isAccessibleForFree": true,
+            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" },
+            "datePublished": "2026-09-30",
+            "author": { "@id": "https://www.romain-ecarnot.com/#person" },
+            "trailer": { "@id": "https://agenthot.erom.cloud/#intro" },
+            "isPartOf": { "@id": "https://agenthot.erom.cloud/#website" }
+          },
+          {
+            "@type": "Person",
+            "@id": "https://www.romain-ecarnot.com/#person",
+            "name": "Romain Ecarnot",
+            "alternateName": "eRom",
+            "url": "https://www.romain-ecarnot.com/",
+            "sameAs": [
+              "https://www.linkedin.com/in/romainecarnot/",
+              "https://github.com/eRom",
+              "https://fr.tipeee.com/rebondir-apres-lavc-ma-carriere-dans-la-tech/"
+            ]
+          },
+          {
+            "@type": "VideoObject",
+            "@id": "https://agenthot.erom.cloud/#intro",
+            "name": "AGENTHOT, la cinématique",
+            "description": "26 secondes filmées dans le jeu : la salle de serveurs, le temps qui se fige, les ennemis orange qui volent en éclats.",
+            "thumbnailUrl": "https://agenthot.erom.cloud/og-v1.jpg",
+            "uploadDate": "2026-09-30T17:47:56+02:00",
+            "duration": "PT26S",
+            "contentUrl": "https://agenthot.erom.cloud/assets/intro.mp4",
+            "encodingFormat": "video/mp4",
+            "inLanguage": "fr-FR"
+          }
+        ]
+      }
+    </script>
     <!-- Polices du logo et des petits textes, préchargées : le chargeur les affiche dès la première seconde. -->
     <link rel="preload" href="/src/ui/fonts/big-shoulders-display-900.woff2" as="font" type="font/woff2" crossorigin />
     <link rel="preload" href="/src/ui/fonts/martian-mono-300-400.woff2" as="font" type="font/woff2" crossorigin />
```

Le titre fait 58 caractères. `datePublished` et `lastmod` (`sitemap.xml`) portent la date du jour de l'écriture : le contrôleur les met à la date de la mise en ligne à la tâche 12.

- [ ] **Step 4 : les icônes de 192 et 512 px**

Le gabarit prend la taille dans l'adresse :

```diff
diff --git a/scripts/og/icon.html b/scripts/og/icon.html
index 1cd504a..3d4ee5a 100644
--- a/scripts/og/icon.html
+++ b/scripts/og/icon.html
@@ -1,6 +1,6 @@
 <!doctype html>
-<!-- Icône du site en PNG (apple-touch-icon, 180 × 180) : public/favicon.svg capturé par Chrome sans écran.
-     Commande dans le plan 3c, tâche des balises de partage. -->
+<!-- Icônes du site en PNG : public/favicon.svg capturé par Chrome sans écran. Sans paramètre : 180 px
+     (apple-touch-icon). Avec ?size=192 ou ?size=512 : les icônes du manifeste. Commandes dans le plan 3c. -->
 <html lang="fr">
   <head>
     <meta charset="UTF-8" />
@@ -10,19 +10,24 @@
       }
       html,
       body {
-        width: 180px;
-        height: 180px;
+        width: var(--size, 180px);
+        height: var(--size, 180px);
         overflow: hidden;
         background: #0d111b;
       }
       img {
         display: block;
-        width: 180px;
-        height: 180px;
+        width: var(--size, 180px);
+        height: var(--size, 180px);
       }
     </style>
   </head>
   <body>
     <img src="../../public/favicon.svg" alt="" />
+    <script>
+      // Taille demandée dans l'adresse ; une fenêtre sans écran ne descend pas sous 500 px, d'où une taille fixe.
+      const size = Number(new URLSearchParams(location.search).get("size"));
+      if (size > 0) document.documentElement.style.setProperty("--size", `${size}px`);
+    </script>
   </body>
 </html>
```

```bash
cd /Users/recarnot/dev/claudehot-videogame && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=192,192 --virtual-time-budget=2000 --screenshot=public/icon-192.png "file:///Users/recarnot/dev/claudehot-videogame/scripts/og/icon.html?size=192" 2>/dev/null
cd /Users/recarnot/dev/claudehot-videogame && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=512,512 --virtual-time-budget=2000 --screenshot=public/icon-512.png "file:///Users/recarnot/dev/claudehot-videogame/scripts/og/icon.html?size=512" 2>/dev/null
```

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/icon-192.png && ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/icon-512.png && ls -l public/icon-192.png public/icon-512.png`
Expected : `192,192`, `512,512`, environ 1,4 Ko et 4,0 Ko. Ouvrir les deux PNG (outil Read) : un losange orange à quatre facettes, **centré**, sur fond bleu nuit. Un losange coupé ou collé à un bord : le paramètre `?size=` n'a pas été lu, refaire.

Le gabarit modifié ne change pas l'icône de 180 px :

Run : `cd /Users/recarnot/dev/claudehot-videogame && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=180,180 --virtual-time-budget=2000 --screenshot=.superpowers/icon-180-check.png "file:///Users/recarnot/dev/claudehot-videogame/scripts/og/icon.html" 2>/dev/null ; cmp .superpowers/icon-180-check.png public/apple-touch-icon.png && echo same`
Expected : `same`.

- [ ] **Step 5 : les types de contenu chez Vercel**

```diff
diff --git a/vercel.json b/vercel.json
index 98b03d5..4c19fb4 100644
--- a/vercel.json
+++ b/vercel.json
@@ -12,6 +12,38 @@
           "value": "public, max-age=31536000, immutable"
         }
       ]
+    },
+    {
+      "source": "/llms.txt",
+      "headers": [
+        { "key": "Content-Type", "value": "text/markdown; charset=utf-8" },
+        { "key": "Access-Control-Allow-Origin", "value": "*" }
+      ]
+    },
+    {
+      "source": "/llms-full.txt",
+      "headers": [
+        { "key": "Content-Type", "value": "text/markdown; charset=utf-8" },
+        { "key": "Access-Control-Allow-Origin", "value": "*" }
+      ]
+    },
+    {
+      "source": "/.well-known/ai-catalog.json",
+      "headers": [
+        { "key": "Content-Type", "value": "application/ai-catalog+json; charset=utf-8" },
+        { "key": "Access-Control-Allow-Origin", "value": "*" }
+      ]
+    },
+    {
+      "source": "/.well-known/ard.json",
+      "headers": [
+        { "key": "Content-Type", "value": "application/json; charset=utf-8" },
+        { "key": "Access-Control-Allow-Origin", "value": "*" }
+      ]
+    },
+    {
+      "source": "/manifest.webmanifest",
+      "headers": [{ "key": "Content-Type", "value": "application/manifest+json; charset=utf-8" }]
     }
   ]
 }
```

- [ ] **Step 6 : brancher le contrôle**

```diff
diff --git a/scripts/check-release.ts b/scripts/check-release.ts
index 92c1e5c..faece50 100644
--- a/scripts/check-release.ts
+++ b/scripts/check-release.ts
@@ -1,12 +1,23 @@
 // Contrôle de mise en ligne (spec 4.7 et 9.2). Usage :
 //   bun scripts/check-release.ts dist
-//       le site construit, avant tout envoi : balises de partage, image, icônes, noms hachés
+//       le site construit, avant tout envoi : balises de partage, image, icônes, noms hachés, fiche JSON-LD,
+//       fichiers de découverte (robots.txt, sitemap.xml, llms.txt, catalogue pour agents, manifeste)
 //   bun scripts/check-release.ts https://agenthot.erom.cloud/
-//       le site en ligne, vu par un robot de partage : les mêmes contrôles, plus les en-têtes de cache,
-//       la lecture partielle de la vidéo (206) et la réponse à un fichier absent (404)
+//       le site en ligne, vu par un robot de partage : les mêmes contrôles, plus les en-têtes de cache, les types
+//       de contenu, la lecture partielle de la vidéo (206) et la réponse à un fichier absent (404)
 // Code 0 si tout passe, 1 sinon. Chaque ligne dit ce qui a été vérifié.
 import { readdir, stat } from "node:fs/promises";
 import { join } from "node:path";
+import {
+  DISCOVERY_CONTENT_TYPES,
+  DISCOVERY_FILES,
+  INDEXNOW_KEY,
+  discoveryFileProblems,
+  headProblems,
+  jsonLdProblems,
+  jsonLdSitePaths,
+  manifestProblems,
+} from "./discovery";
 import { type BuiltFile, SITE_URL, assetPaths, cacheProblems, imageProblems, isLongCache, readShareTags, shareProblems } from "./release";
 
 const USAGE = "usage: bun scripts/check-release.ts <dist directory | https://site/>";
@@ -64,6 +75,30 @@ async function checkDirectory(root: string): Promise<void> {
   else report(false, "share image", `file not found: ${sitePath(imageUrl)}`);
   for (const [rel, href] of Object.entries(tags.icons)) report(await Bun.file(join(root, sitePath(href))).exists(), `icon ${rel}`, href);
   const files = await listFiles(root);
+  const has = (path: string): boolean => files.some((file) => file.path === path);
+  reportProblems("discovery head", headProblems(html));
+  reportProblems("structured data", jsonLdProblems(html, SITE_URL));
+  const linked = jsonLdSitePaths(html, SITE_URL);
+  const dead = linked.filter((path) => !has(path));
+  report(dead.length === 0, `${linked.length} files cited by the structured data exist`, dead.join(", "));
+  const catalogs: string[] = [];
+  for (const path of DISCOVERY_FILES) {
+    if (!has(path)) {
+      report(false, path, "file not found");
+      continue;
+    }
+    const text = await Bun.file(join(root, path)).text();
+    reportProblems(path, discoveryFileProblems(path, text, SITE_URL));
+    if (path.startsWith(".well-known/")) catalogs.push(text);
+    if (path === "manifest.webmanifest") {
+      const missingIcons = manifestProblems(text).icons.filter((icon) => !has(icon));
+      report(missingIcons.length === 0, "manifest icons exist", missingIcons.join(", "));
+    }
+  }
+  // Le catalogue est servi sous ses deux chemins (ARD, et l'ancien ai-catalog) : une seule version.
+  report(catalogs.length === 2 && catalogs[0] === catalogs[1], "both agent catalogs are identical");
+  const keyFile = Bun.file(join(root, `${INDEXNOW_KEY}.txt`));
+  report((await keyFile.exists()) && (await keyFile.text()) === INDEXNOW_KEY, "IndexNow key file");
   reportProblems("long cache", cacheProblems(files));
   // Tout fichier cité par la page ou par un script existe dans le site construit.
   const scripts = files.filter((file) => file.path.endsWith(".js"));
@@ -95,7 +130,31 @@ async function checkSite(base: string): Promise<void> {
     const icon = await get(sitePath(href));
     report(icon.status === 200 && (icon.headers.get("content-type") ?? "").startsWith("image/"), `icon ${rel}`, `${icon.status} ${icon.headers.get("content-type")}`);
   }
-  // Fichiers cités par la page, puis par ses scripts (musiques, vidéos, vignettes).
+  reportProblems("discovery head", headProblems(html));
+  reportProblems("structured data", jsonLdProblems(html, SITE_URL));
+  const catalogs: string[] = [];
+  for (const path of DISCOVERY_FILES) {
+    const response = await get(path);
+    const type = response.headers.get("content-type") ?? "";
+    const text = await response.text();
+    const served = response.status === 200 && type.includes(DISCOVERY_CONTENT_TYPES[path]);
+    report(served, `${path} served`, `${response.status} ${type}`);
+    // Une page d'erreur ou le repli vers index.html n'est pas le fichier : inutile d'en lire le contenu.
+    if (!served) continue;
+    reportProblems(path, discoveryFileProblems(path, text, SITE_URL));
+    if (path.startsWith(".well-known/")) catalogs.push(text);
+    if (path === "manifest.webmanifest") {
+      for (const icon of manifestProblems(text).icons) {
+        const image = await get(icon);
+        report(image.status === 200 && (image.headers.get("content-type") ?? "").startsWith("image/"), `manifest icon ${icon}`, String(image.status));
+        await image.arrayBuffer();
+      }
+    }
+  }
+  report(catalogs.length === 2 && catalogs[0] === catalogs[1], "both agent catalogs are identical");
+  const key = await get(`${INDEXNOW_KEY}.txt`);
+  report(key.status === 200 && (await key.text()) === INDEXNOW_KEY, "IndexNow key file", String(key.status));
+  // Fichiers cités par la page (JSON-LD compris), puis par ses scripts (musiques, vidéos, vignettes).
   const cited = new Set(assetPaths(html));
   for (const path of [...cited].filter((path) => path.endsWith(".js"))) for (const found of assetPaths(await (await get(path)).text())) cited.add(found);
   for (const path of cited) {
```

- [ ] **Step 7 : le contrôle passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4 && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist`
Expected : `tsc` sans erreur ; `337 pass`, `0 fail` ; puis, code 0 :

```
ok   share tags
ok   share image
ok   icon icon (/favicon.svg)
ok   icon apple-touch-icon (/apple-touch-icon.png)
ok   discovery head
ok   structured data
ok   2 files cited by the structured data exist
ok   robots.txt
ok   sitemap.xml
ok   llms.txt
ok   llms-full.txt
ok   .well-known/ai-catalog.json
ok   .well-known/ard.json
ok   manifest.webmanifest
ok   manifest icons exist
ok   both agent catalogs are identical
ok   IndexNow key file
ok   long cache
ok   12 cited assets exist
     30 files, 18.1 MB
release check: all good
```

Run : `cd /Users/recarnot/dev/claudehot-videogame && grep -o '"contentUrl": "[^"]*"' dist/index.html && grep -c "/assets/intro.mp4" dist/index.html`
Expected : `"contentUrl": "https://agenthot.erom.cloud/assets/intro-<hash>.mp4"` (un vrai nom haché), puis `0` (`grep -c` à 0 sort en code 1, c'est normal).

Run : `cd /Users/recarnot/dev/claudehot-videogame && grep -c $'\u2014' public/robots.txt public/llms.txt public/llms-full.txt public/.well-known/ard.json public/manifest.webmanifest index.html`
Expected : `0` sur chaque ligne.

- [ ] **Step 8 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add public/robots.txt public/sitemap.xml public/llms.txt public/llms-full.txt public/.well-known/ard.json public/.well-known/ai-catalog.json public/manifest.webmanifest public/icon-192.png public/icon-512.png public/agenthot-hjjp0jh6j53192gxquqxg84k.txt vite.config.ts tsconfig.json index.html scripts/og/icon.html scripts/check-release.ts vercel.json && git commit -m "feat(seo): structured data, robots, sitemap, llms.txt, agent catalog and manifest, all checked by the release check"
```

---

### Task 8d : trois outils WebMCP en lecture seule

Un agent IA du navigateur peut demander au jeu ce qu'il est, comment on y joue, et ses crédits. Sans l'API (tout navigateur sans jeton ni drapeau), rien n'est chargé.

**Files :**
- Create : `src/app/game-facts.ts`, `src/app/webmcp.ts`
- Modify : `src/app/main.ts`
- Test : `tests/webmcp.test.ts`

**Interfaces :**
- Consumes : `ROOMS` (`src/rooms/registry.ts`), `CREDITS`, `creditsLine`, `usageLine` (`src/ui/credits.ts`).
- Produces : `gameInfo()`, `CONTROLS`, `creditsInfo()`, `SITE_URL` (`game-facts.ts`) ; `GAME_TOOLS`, `findModelContext(doc, nav)`, `registerGameTools(context): Promise<number>` (`webmcp.ts`). Dans la page : trois outils enregistrés sur `document.modelContext` quand il existe.

- [ ] **Step 1 : écrire les tests**

`tests/webmcp.test.ts` :

```ts
import { describe, expect, test } from "bun:test";
import { CONTROLS, SITE_URL, creditsInfo, gameInfo } from "../src/app/game-facts";
import { GAME_TOOLS, type ModelContext, type ModelContextTool, findModelContext, registerGameTools } from "../src/app/webmcp";
import { CREDITS } from "../src/ui/credits";

// Ce qu'un agent reçoit en appelant un outil : le texte JSON du premier bloc.
async function call(name: string): Promise<unknown> {
  const tool = GAME_TOOLS.find((candidate) => candidate.name === name)!;
  const result = await tool.execute();
  expect(result.content).toHaveLength(1);
  return JSON.parse(result.content[0]!.text);
}

// Un navigateur qui garde les outils reçus ; `refuse` fait échouer l'enregistrement d'un nom.
function fakeContext(refuse?: string): { context: ModelContext; names: string[] } {
  const names: string[] = [];
  const context: ModelContext = {
    registerTool(tool: ModelContextTool) {
      if (tool.name === refuse) throw new Error("duplicate tool");
      names.push(tool.name);
    },
  };
  return { context, names };
}

describe("outils WebMCP (lecture seule)", () => {
  test("chaque outil a un nom valide et unique, une description, un schéma sans entrée, et se dit en lecture seule", () => {
    const names = GAME_TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of GAME_TOOLS) {
      // Spec WebMCP : nom de 1 à 128 caractères, lettres, chiffres, tiret bas.
      expect(tool.name).toMatch(/^[a-z0-9_]{1,128}$/);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema).toEqual({ type: "object", properties: {}, additionalProperties: false });
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });

  test("get_game_info dit où jouer, que c'est gratuit, et où sont les sources", async () => {
    expect(await call("get_game_info")).toEqual(gameInfo());
    const info = gameInfo();
    expect(info.url).toBe(SITE_URL);
    expect(info.sources).toBe(CREDITS.repoUrl);
    expect(info.rooms[0]).toEqual({ title: "Salle serveurs", status: "jouable" });
    expect(info.rooms.some((room) => room.status === "à venir")).toBe(true);
  });

  test("get_controls rend chaque commande avec sa touche et son effet", async () => {
    const controls = (await call("get_controls")) as { input: string; action: string }[];
    expect(controls).toEqual([...CONTROLS]);
    expect(controls.find((control) => control.input === "Clic droit")?.action).toBe("Lancer l'arme");
    for (const control of controls) expect(control.input.length > 0 && control.action.length > 0).toBe(true);
  });

  test("get_credits rend la ligne des crédits et le compte affichés dans le jeu", async () => {
    const credits = (await call("get_credits")) as ReturnType<typeof creditsInfo>;
    expect(credits).toEqual(creditsInfo());
    expect(credits.line).toContain("Made with: Claude Opus 5.5");
    expect(credits.usage).toContain("coût API estimé");
  });

  test("aucun texte rendu à un agent ne porte de tiret cadratin", async () => {
    const dash = String.fromCodePoint(0x2014);
    for (const tool of GAME_TOOLS) {
      expect(tool.description.includes(dash)).toBe(false);
      expect((await tool.execute()).content[0]!.text.includes(dash)).toBe(false);
    }
  });
});

describe("branchement WebMCP", () => {
  test("l'API se trouve sur document, sinon sur navigator (ancien nom), sinon nulle part", () => {
    const api = { registerTool: () => undefined };
    expect(findModelContext({ modelContext: api }, {})).toBe(api);
    expect(findModelContext({}, { modelContext: api })).toBe(api);
    expect(findModelContext({}, {})).toBeNull();
    // Un objet sans registerTool n'est pas l'API.
    expect(findModelContext({ modelContext: {} }, {})).toBeNull();
  });

  test("tous les outils sont enregistrés, dans l'ordre", async () => {
    const { context, names } = fakeContext();
    expect(await registerGameTools(context)).toBe(GAME_TOOLS.length);
    expect(names).toEqual(GAME_TOOLS.map((tool) => tool.name));
  });

  test("un outil refusé par le navigateur n'empêche pas les autres", async () => {
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => void warnings.push(args[0]);
    try {
      const { context, names } = fakeContext("get_controls");
      expect(await registerGameTools(context)).toBe(GAME_TOOLS.length - 1);
      expect(names).toEqual(["get_game_info", "get_credits"]);
      expect(warnings).toEqual(["[agenthot] webmcp: registration failed for get_controls"]);
    } finally {
      console.warn = warn;
    }
  });

  test("une API qui rend une promesse rejetée est traitée comme un refus", async () => {
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      const context: ModelContext = { registerTool: () => Promise.reject(new Error("not allowed")) };
      expect(await registerGameTools(context)).toBe(0);
    } finally {
      console.warn = warn;
    }
  });
});
```

- [ ] **Step 2 : ils échouent**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/webmcp.test.ts 2>&1 | tail -8`
Expected : FAIL, `Cannot find module '../src/app/game-facts'`.

- [ ] **Step 3 : les faits du jeu**

`src/app/game-facts.ts` :

```ts
// Ce que le jeu dit de lui-même à un agent IA (outils WebMCP, src/app/webmcp.ts). Données pures, en lecture seule.
// Les mêmes faits sont écrits pour les robots dans public/llms.txt et dans le JSON-LD d'index.html : un changement
// ici se reporte là-bas.
import { ROOMS } from "../rooms/registry";
import { CREDITS, creditsLine, usageLine } from "../ui/credits";

export const SITE_URL = "https://agenthot.erom.cloud/";

export interface GameInfo {
  name: string;
  url: string;
  pitch: string;
  genre: string;
  price: string;
  language: string;
  platform: string;
  rules: string[];
  rooms: { title: string; status: string }[];
  madeWith: string;
  sources: string;
}

export function gameInfo(): GameInfo {
  return {
    name: "AGENTHOT",
    url: SITE_URL,
    pitch: "Un FPS dans le navigateur où le temps n'avance que quand tu bouges.",
    genre: "Jeu de tir à la première personne",
    price: "Gratuit",
    language: "fr",
    platform: "Navigateur sur ordinateur (WebGPU, repli WebGL2), clavier et souris. Pas de version mobile.",
    rules: [
      "Le temps n'avance que quand tu bouges ou que tu tires.",
      "Une seule touche et tu meurs.",
      "Aucun ennemi ne tire sans avoir visé : un trait orange prévient toujours.",
      "Une salle, cinq ennemis, quatre balles. Une arme vide se lance, une arme au sol se ramasse.",
      "La victoire rejoue la partie en temps réel.",
    ],
    rooms: ROOMS.map((room) => ({ title: room.title, status: room.status === "playable" ? "jouable" : "à venir" })),
    madeWith: "Claude Opus 5.5, piloté par eRom. Three.js, TypeScript, Vite.",
    sources: CREDITS.repoUrl,
  };
}

export interface Control {
  input: string;
  action: string;
}

// Les touches suivent la position physique (KeyboardEvent.code) : ZQSD sur AZERTY, WASD sur QWERTY.
export const CONTROLS: readonly Control[] = [
  { input: "ZQSD ou WASD", action: "Se déplacer" },
  { input: "Souris", action: "Viser" },
  { input: "Espace", action: "Sauter" },
  { input: "C", action: "S'accroupir" },
  { input: "Clic gauche", action: "Tirer. Mains vides : coup de poing" },
  { input: "Clic droit", action: "Lancer l'arme" },
  { input: "E", action: "Ramasser une arme" },
  { input: "Échap", action: "Pause" },
  { input: "R", action: "Recommencer" },
];

export interface CreditsInfo {
  line: string;
  usage: string;
  author: string;
  sources: string;
}

export function creditsInfo(): CreditsInfo {
  return { line: creditsLine(CREDITS), usage: usageLine(CREDITS), author: "eRom (Romain Ecarnot)", sources: CREDITS.repoUrl };
}
```

- [ ] **Step 4 : les outils**

`src/app/webmcp.ts` :

```ts
// WebMCP : trois outils en lecture seule pour les agents IA du navigateur (document.modelContext).
// Spec : webmachinelearning.github.io/webmcp (brouillon du 2026-09-29). Dans Chrome, l'API n'existe qu'avec un
// jeton d'origin trial ou le drapeau chrome://flags/#enable-webmcp-testing. Sans elle, ce module n'est même pas
// chargé (voir main.ts) : le jeu ne paie rien.
import { CONTROLS, creditsInfo, gameInfo } from "./game-facts";

export interface ToolResult {
  content: { type: "text"; text: string }[];
}

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean };
  execute: () => Promise<ToolResult>;
}

export interface ModelContext {
  registerTool: (tool: ModelContextTool) => unknown;
}

const NO_INPUT = { type: "object", properties: {}, additionalProperties: false } as const;

function asText(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

export const GAME_TOOLS: readonly ModelContextTool[] = [
  {
    name: "get_game_info",
    description: "AGENTHOT : ce qu'est le jeu, ses règles, ses salles, sa plateforme, son prix et l'adresse de ses sources.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => asText(gameInfo()),
  },
  {
    name: "get_controls",
    description: "Commandes d'AGENTHOT au clavier et à la souris : chaque touche et ce qu'elle fait.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => asText(CONTROLS),
  },
  {
    name: "get_credits",
    description: "Crédits d'AGENTHOT : auteur, modèle utilisé, dépôt des sources, nombre de tokens et coût API estimé.",
    inputSchema: NO_INPUT,
    annotations: { readOnlyHint: true },
    execute: async () => asText(creditsInfo()),
  },
];

// L'API telle que le navigateur l'expose, ou null. `navigator.modelContext` est l'ancien nom (avant Chrome 150).
export function findModelContext(doc: object, nav: object): ModelContext | null {
  for (const host of [doc, nav]) {
    const candidate = (host as { modelContext?: Partial<ModelContext> }).modelContext;
    if (typeof candidate?.registerTool === "function") return candidate as ModelContext;
  }
  return null;
}

// Enregistre les outils ; rend le nombre d'outils acceptés. Un refus du navigateur (nom en double, API qui a
// changé) est écrit dans la console et n'arrête ni les autres outils, ni le jeu. Les outils vivent autant que la
// page : pas de signal d'arrêt.
export async function registerGameTools(context: ModelContext): Promise<number> {
  let registered = 0;
  for (const tool of GAME_TOOLS) {
    try {
      // registerTool est synchrone ou rend une promesse, selon la version de Chrome.
      await context.registerTool(tool);
      registered++;
    } catch (error) {
      console.warn(`[agenthot] webmcp: registration failed for ${tool.name}`, error);
    }
  }
  return registered;
}
```

- [ ] **Step 5 : le branchement**

```diff
diff --git a/src/app/main.ts b/src/app/main.ts
index 76d5bf1..bf88ecb 100644
--- a/src/app/main.ts
+++ b/src/app/main.ts
@@ -33,6 +33,15 @@ if (playOnDesktopOnly(browserEnvironment())) {
   void boot();
 }
 
+// WebMCP : trois outils en lecture seule pour les agents IA du navigateur. Sans l'API (tout navigateur sans jeton
+// d'origin trial ni drapeau), rien n'est chargé : le jeu ne paie rien.
+if ("modelContext" in document || "modelContext" in navigator) {
+  void import("./webmcp").then(({ findModelContext, registerGameTools }) => {
+    const context = findModelContext(document, navigator);
+    if (context) void registerGameTools(context);
+  });
+}
+
 // Le chargeur d'abord ; toute erreur du démarrage s'y affiche au lieu de laisser « Chargement » à l'infini.
 async function boot(): Promise<void> {
   const loader = new LoaderScreen(screens);
```

L'import est dynamique : Vite en fait un fichier à part, demandé seulement si l'API existe.

- [ ] **Step 6 : tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/webmcp.test.ts 2>&1 | tail -5`
Expected : `9 pass`, `0 fail`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4 && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist | tail -2`
Expected : `tsc` sans erreur ; `346 pass`, `0 fail` ; le build liste un fichier `dist/assets/webmcp-<hash>.js` d'environ 2,4 Ko, à part du point d'entrée (vers 40,5 Ko) ; `31 files`, `release check: all good`.

- [ ] **Step 7 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/app/game-facts.ts src/app/webmcp.ts src/app/main.ts tests/webmcp.test.ts && git commit -m "feat(webmcp): three read-only tools for browser agents, loaded only when the API exists"
```

---

### Task 8e : le script IndexNow

Il prépare l'envoi, et ne l'envoie pas : sans `--send`, il montre seulement ce qui partirait. L'envoi réel est un geste d'après-domaine, sur le go de Romain (tâche 13b).

**Files :**
- Create : `scripts/submit-indexnow.ts`

**Interfaces :**
- Consumes : `INDEXNOW_KEY`, `indexNowPayload` (`scripts/discovery.ts`, déjà testés à la tâche 8b) ; `SITE_URL` (`scripts/release.ts`).
- Produces : `bun scripts/submit-indexnow.ts` (à blanc), `bun scripts/submit-indexnow.ts --send` (envoi).

- [ ] **Step 1 : le script**

`scripts/submit-indexnow.ts` :

```ts
// IndexNow : prévient Bing, Yandex, Naver, Seznam et Yep que la page du jeu a changé (Google n'y participe pas).
// Usage :
//   bun scripts/submit-indexnow.ts          montre ce qui serait envoyé, n'envoie rien
//   bun scripts/submit-indexnow.ts --send   envoie (geste visible du dehors : sur le go de Romain seulement)
// La clé est publique : le moteur la relit à /<clé>.txt pour vérifier que l'envoi vient bien du site.
import { INDEXNOW_KEY, indexNowPayload } from "./discovery";
import { SITE_URL } from "./release";

// Un envoi à ce point d'entrée est partagé avec tous les moteurs participants (indexnow.org/faq).
const ENDPOINT = "https://api.indexnow.org/indexnow";

const payload = indexNowPayload(SITE_URL, INDEXNOW_KEY);
console.info(JSON.stringify(payload, null, 2));
if (!process.argv.includes("--send")) {
  console.info("dry run: nothing sent (add --send)");
  process.exit(0);
}
// La clé doit être lisible en ligne avant l'envoi, sinon le moteur refuse la requête.
const keyFile = await fetch(payload.keyLocation);
if (keyFile.status !== 200 || (await keyFile.text()).trim() !== INDEXNOW_KEY) {
  console.error(`key file not served at ${payload.keyLocation} (${keyFile.status}): nothing sent`);
  process.exit(1);
}
const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
// 200 : adresse reçue. 202 : reçue, clé en cours de vérification. Tout autre code est un refus.
console.info(`${ENDPOINT}: ${response.status} ${response.statusText}`);
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
```

- [ ] **Step 2 : à blanc**

**Ne jamais lancer ce script avec `--send` dans cette tâche.**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/submit-indexnow.ts ; echo "exit $?"`
Expected : le JSON avec `"host": "agenthot.erom.cloud"`, la clé, `keyLocation` en `https://agenthot.erom.cloud/agenthot-hjjp0jh6j53192gxquqxg84k.txt`, `urlList` à une adresse ; puis `dry run: nothing sent (add --send)` et `exit 0`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `346 pass`, `0 fail`.

- [ ] **Step 3 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add scripts/submit-indexnow.ts && git commit -m "feat(seo): IndexNow submission script, dry run by default"
```

---

### Task 8f : le dépôt public, « mode making-of »

Décision de Romain du 2026-09-30 à 18 h 20, relayée par la session venus : « 2 - mode making-of !!! ». Le dépôt deviendra public avec tout son historique. Cette tâche prépare ce qui se commite. Elle ne pousse rien.

**Files :**
- Modify : `README.md`, `.gitignore`

**Interfaces :**
- Consumes : le README de la tâche 8.
- Produces : une section « Making-of » dans le README ; six lignes dans `.gitignore`.

- [ ] **Step 1 : la section du README**

```diff
diff --git a/README.md b/README.md
index 44642ab..412a20f 100644
--- a/README.md
+++ b/README.md
@@ -33,6 +33,20 @@ AGENTHOT est une vitrine technique de Claude Opus 5.5. Le code, les plans et les
 - **Images :** l'image de partage et la vignette de la salle 1 sont des captures du jeu. La vignette de la salle 2 vient de Nano Banana 2. La cinématique est montée avec Hyperframes, à partir de séquences filmées par le jeu lui-même.
 - **Outils :** Vite, TypeScript, bun.
 
+## Making-of
+
+Ce dépôt montre tout le chantier, pas seulement le résultat.
+
+| Dossier | Ce qu'on y lit |
+| :--- | :--- |
+| `docs/superpowers/specs/` | La spec : ce que le jeu doit faire, et pourquoi |
+| `docs/superpowers/plans/` | Les plans, tâche par tâche, avec le code essayé avant d'être écrit |
+| `docs/superpowers/reports/` | Les revues de code et les décisions prises en route |
+| `.claude/notes/` | Les notes de reprise et les pièges rencontrés |
+| `assets/ledger.jsonl` | Chaque génération payante (musiques, images), avec son prix |
+
+Le code, les plans et les revues ont été écrits par Claude, dans Claude Code : Opus 5.5 au pilotage, Sonnet 5.5 à l'exécution. eRom a donné la direction, joué chaque version et tranché.
+
 ## Lancer en local
 
 ```bash
```

- [ ] **Step 2 : ce qui ne doit jamais partir**

`.gitignore` porte toujours les deux lignes non commitées de Romain, à la fin. Même marche qu'à la tâche 7 : enregistrer le diff ci-dessous tel quel dans `.superpowers/gitignore-public.patch` (outil Write, une ligne vide à la fin), puis `cd /Users/recarnot/dev/claudehot-videogame && git apply .superpowers/gitignore-public.patch`.

```diff
diff --git a/.gitignore b/.gitignore
index a30ef4c..c7ec99c 100644
--- a/.gitignore
+++ b/.gitignore
@@ -10,6 +10,14 @@ dist/
 # Lien vers le projet Vercel et site construit par `vercel build` (identifiants locaux, jamais commités)
 .vercel/
 
+# Réglages locaux de Claude Code et fichiers d'outils (propres à la machine, jamais publiés)
+.claude/helpers/
+.claude/skills/
+.claude/settings.json
+.claude/settings.local.json
+.mcp.json
+.ignore
+
 # Cinématique : prises du jeu, rendus et master (lourds, refaisables)
 videos/agenthot-intro/renders/
 videos/agenthot-intro/public/
```

Les fichiers d'idéation non suivis de `docs/superpowers/idea/` ne sont ni commités ni ignorés : Romain n'a pas tranché. `screenshots/` contient des captures d'un autre jeu, `Lyria-prompt-guide.md` et `Seedream-5.0-Pro.md` sont des documents de fournisseurs : ils ne se publient pas.

- [ ] **Step 3 : contrôles**

Run : `cd /Users/recarnot/dev/claudehot-videogame && grep -c $'\u2014' README.md ; git status --short`
Expected : `0` ; `git status` ne montre plus `.claude/helpers/`, `.claude/skills/`, `.claude/settings.json`, `.mcp.json`, `.ignore`. Il montre encore `.gitignore`, `README.md`, `OVERVIEW.md` modifiés et les fichiers non suivis de `docs/superpowers/idea/`.

- [ ] **Step 4 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add README.md && git apply --cached .superpowers/gitignore-public.patch && git commit -m "docs: making-of section in the README, local tool files ignored"
```

Jamais `git add .gitignore`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && git show --stat HEAD | tail -3 && git diff .gitignore | grep -c "^+[.a-z]"`
Expected : `.gitignore | 8 ++++++++` et `README.md | 14 ++++++++++++++` ; puis `2` (les deux lignes de Romain, toujours non commitées).

---

### Task 9 : recette locale, puis Romain regarde et joue (contrôleur)

Tout ce qui se vérifie sans rien mettre en ligne, sur le site construit. Chaque résultat est noté dans le journal d'exécution avec sa sortie réelle. La tâche se termine par un **arrêt** : Romain regarde et joue.

**Files :** aucun fichier du dépôt. Journal : `.superpowers/sdd/2026-09-29-agenthot-plan-3c-perf-share-launch/progress.md`.

**Interfaces :**
- Consumes : tout ce que les tâches 1 à 8 ont produit.
- Produces : les mesures des critères AC-3c-3 à AC-3c-9, et les retours de Romain.

- [ ] **Step 1 : construire et contrôler**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3c-test.log | tail -4 && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist`
Expected : `354 pass`, `0 fail` ; build : point d'entrée vers 40,5 Ko (14,5 Ko gzip), moteur vers 1 010 Ko (282 Ko gzip), outils WebMCP à part (2,4 Ko) ; `release check: all good`.

- [ ] **Step 2 : servir le site construit**

`cd /Users/recarnot/dev/claudehot-videogame && bun run preview --port 4319 --strictPort`, en arrière-plan, jusqu'à la fin de la tâche.

Run : `curl -sI -H "Range: bytes=0-99" http://localhost:4319/$(grep -o 'assets/intro-[A-Za-z0-9_-]*\.mp4' dist/assets/index-*.js | head -1)`
Expected : `HTTP/1.1 206 Partial Content`, `Content-Type: video/mp4`, `Content-Range: bytes 0-99/…`.

- [ ] **Step 3 : AC-3c-6, l'invite et le poids**

MCP Chrome DevTools : `new_page` sur `http://localhost:4319/` avec `isolatedContext: "ac10"` (stockage vide : première visite). `evaluate_script` :

```js
async () => {
  await new Promise((r) => setTimeout(r, 4000));
  const mark = performance.getEntriesByName("agenthot:prompt")[0];
  const entries = [performance.getEntriesByType("navigation")[0], ...performance.getEntriesByType("resource")];
  const light = entries.filter((e) => !/\.(mp3|mp4|webm)$/.test(e.name));
  return {
    hidden: document.hidden,
    promptMs: mark ? Math.round(mark.startTime) : null,
    lightBytes: light.reduce((sum, e) => sum + e.transferSize, 0),
    files: entries.map((e) => `${e.name.replace(location.origin, "")} ${e.transferSize}`),
  };
}
```

Expected (prototype) : `promptMs` vers 1 250 ; `lightBytes` vers 340 000 (le moteur arrive juste après l'invite : attendre les 4 s), loin sous 3 000 000.

Puis la mesure sévère : `emulate` avec `networkConditions: "Fast 4G"`, `navigate_page` en `reload` avec `ignoreCache: true`, et le même script. Trois fois ; garder la médiane.
Expected : médiane ≤ 2 000 ms (prototype : 1 933). **Au-dessus de 2 000 :** ce n'est pas encore un échec d'AC-10, dont le seuil est à 50 Mb/s. Le noter, et demander à Romain, à l'étape 7, une mesure avec un profil DevTools réglé à 50 Mb/s. Si celle-là dépasse aussi 2 000 ms : arrêt, compétence superpowers:systematic-debugging (premières pistes : `PRELOAD_TIMEOUT_MS` dans `src/app/main.ts`, `INTRO.readyTimeoutMs` dans `src/ui/intro.ts`).

Remettre le réseau : `emulate` sans `networkConditions`.

- [ ] **Step 4 : AC-3c-4, le texte des crédits**

Même page (sans limite de réseau), `navigate_page` vers `http://localhost:4319/?debug`, puis `evaluate_script` :

```js
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyQ", bubbles: true }));
  await wait(2500);
  key();
  await wait(1500);
  key();
  await wait(2500);
  const entry = [...document.querySelectorAll("#screens button")].find((el) => /cr[ée]dits/i.test(el.textContent ?? ""));
  entry?.click();
  await wait(800);
  return {
    line: document.querySelector(".credits-line")?.textContent ?? null,
    usage: document.querySelector(".credits-usage")?.textContent ?? null,
  };
}
```

Expected : `line` vaut exactement `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/agenthot-the-game` ; `usage` porte les nombres de la tâche 6, par exemple `955 020 037 tokens ‧ coût API estimé : 373,80 $`.

- [ ] **Step 5 : AC-3c-8, téléphone et iPad**

`emulate` avec `viewport: "390x844x3,mobile,touch"`, `navigate_page` vers `http://localhost:4319/`, puis `evaluate_script` :

```js
async () => {
  await new Promise((r) => setTimeout(r, 2500));
  const video = document.querySelector("video");
  return {
    text: document.querySelector("#screens").innerText.replace(/\s+/g, " ").slice(0, 160),
    video: video ? { src: video.currentSrc.replace(location.origin, ""), time: video.currentTime, muted: video.muted, paused: video.paused } : null,
    canvas: document.querySelectorAll("canvas").length,
    engineRequested: performance.getEntriesByType("resource").some((e) => /engine-/.test(e.name)),
  };
}
```

Expected (prototype) : `text` commence par `AGENT HOT JOUE SUR ORDI` et contient `COPIER LE LIEN` ; `video.src` est `/assets/intro-….webm`, `time` > 0, `muted: true`, `paused: false` ; `canvas: 0` ; `engineRequested: false`. `list_console_messages` : aucune erreur. `take_screenshot` pour Romain.

Cas iPad avec trackpad (pas de verrouillage de souris) : `emulate` avec `viewport: "1180x820x2"`, puis `navigate_page` vers `http://localhost:4319/` avec `initScript: "delete Element.prototype.requestPointerLock;"`, et le même script.
Expected : le même écran. Fermer cette page (`close_page`) : les étapes suivantes n'ont pas besoin de l'émulation.

- [ ] **Step 6 : AC-3c-9, les budgets**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/spend.ts summary ; echo "exit $?" ; git diff --stat main -- assets/ledger.jsonl`
Expected : Lyria 0,320 $, Nano Banana 0,134 $, Seedream 0,045 $, chacun `ok`, `exit 0` ; aucune ligne de diff (ce plan n'a rien dépensé).

- [ ] **Step 6b : AC-3c-14 et AC-3c-15, les outils WebMCP et leur coût**

Sans API (le cas de tout joueur) : `new_page` sur `http://localhost:4319/` avec `isolatedContext: "plain"`, puis `evaluate_script` :

```js
async () => {
  await new Promise((r) => setTimeout(r, 3000));
  const names = performance.getEntriesByType("resource").map((e) => e.name);
  return { hasApi: "modelContext" in document || "modelContext" in navigator, webmcpRequested: names.some((n) => /webmcp/.test(n)) };
}
```

Expected : `hasApi: false`, `webmcpRequested: false`.

Avec une API simulée : `navigate_page` vers `http://localhost:4319/` avec `initScript: "window.__tools = []; document.modelContext = { registerTool: (tool) => { window.__tools.push(tool); } };"`, puis :

```js
async () => {
  await new Promise((r) => setTimeout(r, 3000));
  const out = {};
  for (const tool of window.__tools) out[tool.name] = await tool.execute();
  return { names: window.__tools.map((t) => t.name), readOnly: window.__tools.every((t) => t.annotations.readOnlyHint === true), credits: out.get_credits, rooms: out.get_game_info?.rooms, controls: out.get_controls?.length };
}
```

Expected (prototype) : `names` vaut `["get_game_info", "get_controls", "get_credits"]` ; `readOnly: true` ; `credits.line` est la ligne des crédits, `credits.usage` porte les nombres de la tâche 6 ; `rooms` : « Salle serveurs », jouable, et « Salle 2 », à venir ; `controls: 9`. Fermer la page.

Puis le contrôle en mode adresse contre le serveur local, pour voir qu'il lit bien un site (il doit échouer là où un serveur local diffère de Vercel, et nulle part ailleurs) :

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/check-release.ts http://localhost:4319/ 2>&1 | tee .superpowers/plan-3c-preview-check.log | grep -c "^FAIL"`
Expected : des `FAIL` seulement sur : les fichiers de `/assets/` (pas de cache long en local), `missing file answers 404` (en local : 200), et les lignes `served` dont le type de contenu vient de `vercel.json` (`llms.txt`, `llms-full.txt`, `.well-known/ai-catalog.json`). Tout autre `FAIL` est un défaut : arrêt.

- [ ] **Step 7 : ARRÊT. Romain regarde et joue**

Le serveur de l'étape 2 tourne toujours. Envoyer à Romain ce message, tel quel, avec les mesures des étapes 3 à 6 au-dessus :

> Le jeu est prêt en local. Quatre choses à faire, dix minutes :
> 1. **Safari.** Ouvre `http://localhost:4319/` dans Safari, dans une fenêtre privée. Appuie sur une touche. La cinématique doit jouer, avec le son.
> 2. **Chrome, une partie.** Ouvre `http://localhost:4319/?debug`, ouvre la console (Cmd+Option+J), joue jusqu'à la victoire. Copie-moi la ligne qui commence par `[agenthot] frames`.
> 3. **Chrome, le mode de secours.** Ouvre `http://localhost:4319/?debug&renderer=webgl`, gagne une partie. En bas, le panneau doit dire `WebGL2`. Dis-moi si l'image est la même : ombres dans les coins, lueur orange.
> 4. **Regarde trois choses :** l'icône dans l'onglet (un losange orange) ; la phrase de la carte de partage : « Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur. » ; le fichier `README.md` (il a une section « Making-of »).
> 5. **Le référencement, quatre textes :** le titre de l'onglet, « AGENTHOT - Le FPS où le temps n'avance que quand tu bouges » ; le fichier `public/llms.txt` (ce que lira une IA) ; les trois outils pour agents : infos du jeu, commandes, crédits ; et ceci : la fiche du jeu dit aux moteurs que l'auteur est « Romain Ecarnot (eRom) », avec les liens de ton site. Oui ou non ?
>
> Les crédits affichent maintenant le vrai total : environ 955 millions de tokens, environ 374 $ de coût API estimé (mettre ici les nombres de la tâche 6).

Attendu de Romain :
- Safari : la cinématique joue (AC-3c-3, en local).
- La ligne `[agenthot] frames {"frames":…,"p95Ms":…,"worstWindowP95Ms":…,"maxMs":…,"maxDrawCalls":…}` : `maxMs` ≤ 33,3 et `maxDrawCalls` < 80 (AC-3c-5, révisé). Une ligne sort aussi à chaque mort : seule celle de la victoire compte.
- WebGL2 : victoire, rendu identique (AC-3c-7).
- Un oui ou un retour sur l'icône, la phrase, le README, le titre, `llms.txt`, les outils, et son nom dans la fiche (décision 15).

**Si un critère échoue :** arrêt. Pas de correctif improvisé : compétence superpowers:systematic-debugging, et la correction repasse par Romain. Pistes pour AC-3c-5 : la qualité auto (plan 3a, `src/render/quality.ts`) doit baisser la résolution quand l'image dépasse 18 ms pendant 2 s ; vérifier `res` dans le panneau debug au moment lent. Pour Safari : ouvrir directement l'adresse du MP4 (`/assets/intro-….mp4`) dans Safari pour séparer un fichier illisible d'un défaut du lecteur.

Un retour de Romain sur un texte ou sur l'icône se corrige ici, dans un commit nommé, avant la tâche 10. Si la phrase de la carte change, elle change aux deux endroits d'`index.html` (`description` et `og:description`), et `bun scripts/check-release.ts dist` doit repasser.

- [ ] **Step 8 : arrêter le serveur, noter les résultats**

Arrêter `vite preview`. Écrire dans le journal, pour chaque critère AC-3c-3 à AC-3c-9 : la commande ou le geste, la sortie réelle, tenu ou non.

---

### Task 10 : dernier compte, revue finale, fusion (contrôleur)

- [ ] **Step 1 : refaire le compte des crédits**

Run : `cd /Users/recarnot/dev/claudehot-videogame && zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*`
Mettre à jour `tokens`, `apiCostUsd` et la date dans `src/ui/credits.ts`, puis :

```bash
cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test tests/credits.test.ts 2>&1 | tail -4 && git add src/ui/credits.ts && git commit -m "chore(credits): final token count before launch"
```

Les sessions qui suivent (revue, mise en ligne) ne seront pas comptées : le total est celui de la veille du lancement, et le commentaire porte sa date.

- [ ] **Step 2 : revue finale**

Un relecteur neuf, Opus 5.5 en effort xhigh, sur `main..feat/agenthot-plan-3c`. Son brief dit, mot pour mot :
- de ne pas se fier au résumé du contrôleur et de lire les fichiers ;
- de vérifier sur le web que chaque choix est encore le bon cette année (règle `headers` de Vercel, balises Open Graph, niveau H.264), avec ses sources ;
- la grille du code creux : (1) une fonction ou un module exporté qui ne fait rien ; (2) un bouche-trou ou une erreur avalée à la place d'un comportement ; (3) une valeur par défaut ou une constante sans ancrage dans la spec ni dans une mesure ; (4) un test qui n'exerce pas le comportement (il vérifie un faux, un texte source ou un compte) ; (5) des branches moins profondes que la spec, le chemin heureux seul ; (6) un état géré moins finement que la spec ;
- de relancer lui-même `bun test`, `bun run typecheck`, `bun run build`, `bun scripts/check-release.ts dist` ;
- de finir par le meilleur argument contre ses propres constats.

Rapport : `docs/superpowers/reports/<date>-agenthot-plan-3c-final-review.md`. Corriger les points Critique et Important, relancer les contrôles, commiter le rapport.

- [ ] **Step 3 : ARRÊT. Go de Romain pour la fusion**

Lui donner : le verdict de la revue en deux lignes, et le chemin du rapport. Sur son go :

```bash
cd /Users/recarnot/dev/claudehot-videogame && git checkout main && git merge --ff-only feat/agenthot-plan-3c && RTK_DISABLED=1 bun test 2>&1 | tail -4
```

Expected : avance rapide, puis la suite verte. Rien n'est poussé.

---

### Task 11 : PORTE 1, le push (contrôleur, sur le go de Romain)

Le dépôt GitHub `eRom/agenthot-the-game` existe, il est privé et vide ; `origin` pointe déjà dessus.

- [ ] **Step 1 : ce qui va partir**

Run : `cd /Users/recarnot/dev/claudehot-videogame && git status --short && git log --oneline origin/main..main 2>/dev/null | wc -l ; git log --oneline | wc -l`
Expected : `git status` ne montre que les fichiers de Romain (non commités, ils ne partent pas) ; le nombre de commits à envoyer.

Run : `cd /Users/recarnot/dev/claudehot-videogame && git log -p --all | grep -cE 'AIza[0-9A-Za-z_-]{35}|sk-or-v1-[0-9a-f]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}'`
Expected : `0` (mesure du prototype : 0). **Autre chose que 0 : arrêt.** Ne pas afficher la ligne trouvée ; dire à Romain qu'une clé est dans l'historique, il la révoque avant tout push.

Dépôt public : le contrôle des clés se refait avec un vrai outil, sur tout l'historique.

Run : `cd /Users/recarnot/dev/claudehot-videogame && gitleaks git --no-banner --redact . 2>&1 | tail -3`
Expected : `no leaks found` (mesure du 2026-09-30 à 18 h 23 : 145 commits, 0 fuite). **Une fuite : arrêt**, sans afficher la valeur.

Run : `cd /Users/recarnot/dev/claudehot-videogame && git ls-files | grep -E "^\.claude/(helpers|skills|settings)|^\.mcp\.json|^\.ignore|\.env" ; git grep -I -l -E "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}" | head`
Expected : rien sur la première commande (aucun fichier local suivi) ; sur la seconde, seulement des fichiers où l'adresse est celle d'un exemple ou d'une licence. Une adresse de Romain : le lui dire.

À dire à Romain avec la porte, relevé le 2026-09-30 :
- Les 124 commits portent son adresse Gmail comme auteur. Elle devient publique. La garder, ou passer à l'adresse `noreply` de GitHub, ce qui réécrit tout l'historique : son choix, rien n'est réécrit sans son go.
- Quatre fichiers suivis citent le chemin `/Users/recarnot` (notes et plans). Sans danger.
- Les réponses brutes des API (`assets/*-response.json`, `.claude/notes/agenthot-probes/*.json`) ne portent ni clé ni identifiant de compte : seulement un identifiant de requête Lyria, des compteurs de tokens et des prix.
- Les messages de commit portent des liens de session `claude.ai/code/session_…`. Ils ne s'ouvrent que pour lui.

Run : `gh repo view eRom/agenthot-the-game --json visibility,isEmpty`
Expected : `{"isEmpty":true,"visibility":"PRIVATE"}`.

- [ ] **Step 2 : ARRÊT. Go de Romain pour le push**

Lui écrire :

> Porte 1, le push. J'envoie `main` sur `github.com/eRom/agenthot-the-game`. Aucune clé dans l'historique.
> Tu as choisi le 30/09 : dépôt public, « mode making-of ». Tout devient lisible : le code, les plans, les notes, les revues.
> Une chose à trancher avant : ton adresse Gmail est l'auteur des commits, elle sera visible. Je la garde (le plus simple), ou je passe tout l'historique à ton adresse `noreply` de GitHub ?
>
> Réponds « go push public » (adresse gardée) ou « go push public, noreply ».

- [ ] **Step 3 : pousser**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git push -u origin main
```

Run : `cd /Users/recarnot/dev/claudehot-videogame && git rev-parse main && git ls-remote origin refs/heads/main`
Expected : le même hash deux fois.

- [ ] **Step 4 : si Romain a dit « public »**

```bash
gh repo edit eRom/agenthot-the-game --visibility public --accept-visibility-change-consequences
gh repo edit eRom/agenthot-the-game --description "Un FPS dans le navigateur où le temps n'avance que quand tu bouges. Made with Claude Opus 5.5." --homepage "https://agenthot.erom.cloud/"
```

- [ ] **Step 5 : AC-3c-11**

Run : `curl -s -o /dev/null -w "%{http_code}\n" https://github.com/eRom/agenthot-the-game`
Expected : `200` si public (le README s'affiche sur la page) ; `404` si privé, et AC-3c-11 est noté non tenu par choix de Romain.

---

### Task 12 : PORTE 2, le déploiement Vercel (contrôleur, sur le go de Romain)

Ces commandes n'ont pas été exécutées pendant l'écriture du plan : elles créent un projet. Elles viennent de `vercel <commande> --help` (CLI 59.20.0). Pour chacune, ce qu'elle doit produire est écrit ; une réponse différente, et on lit son aide avant de continuer. Charger la compétence `vercel:vercel-cli` avant de commencer.

**Ce que fait cette tâche :** un projet Vercel `agenthot-the-game`, lié à ce dossier, et un premier déploiement de production à `https://agenthot-the-game.vercel.app/`. Le domaine vient à la tâche 13.

- [ ] **Step 1 : lecture seule, avant le go**

Run : `vercel whoami ; vercel project ls 2>&1 | tail -12`
Expected : `eromleduk` ; la liste des projets de `romain-ecarnots-projects`, sans `agenthot-the-game`. S'il existe déjà : arrêt, demander à Romain.

- [ ] **Step 2 : ARRÊT. Go de Romain pour le déploiement**

Lui écrire :

> Porte 2, le déploiement. Je crée le projet Vercel `agenthot-the-game` et j'y envoie le site construit sur ton Mac. Le jeu sera visible à une adresse `vercel.app`. Ton domaine n'est pas touché, c'est la porte 3. Offre gratuite, zéro dépense.
> Réponds « go déploiement ».

- [ ] **Step 3 : créer le projet et le lier**

```bash
cd /Users/recarnot/dev/claudehot-videogame && vercel project add agenthot-the-game
cd /Users/recarnot/dev/claudehot-videogame && vercel link --yes --project agenthot-the-game
```

Expected : `.vercel/project.json` existe, avec `projectId` et `orgId`. `git status --short` ne montre pas `.vercel/` (tâche 7). Si `link` demande l'équipe, ajouter `--team romain-ecarnots-projects` (forme donnée par `vercel link --help`).

- [ ] **Step 4 : construire comme Vercel le ferait, sur le Mac**

```bash
cd /Users/recarnot/dev/claudehot-videogame && vercel pull --yes --environment=production
cd /Users/recarnot/dev/claudehot-videogame && vercel build --prod
```

Expected : `vercel build` lance `bun run build` (lu dans `vercel.json`) et écrit `.vercel/output/` : le site dans `.vercel/output/static/`, les règles dans `.vercel/output/config.json`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/check-release.ts .vercel/output/static && grep -c "immutable" .vercel/output/config.json`
Expected : `release check: all good` ; au moins `1` (la règle de cache est dans la sortie). `0` : `vercel.json` n'a pas été lu, arrêt.

- [ ] **Step 5 : envoyer**

```bash
cd /Users/recarnot/dev/claudehot-videogame && vercel deploy --prebuilt --prod
```

Expected : une adresse de déploiement, et l'adresse de production du projet. Seul le contenu de `.vercel/output/` part : ni les sources, ni les fichiers non commités de Romain. Noter l'adresse de production exacte (`https://agenthot-the-game.vercel.app/`, ou avec un suffixe si le nom était pris) : c'est `<PROD>` plus bas.

- [ ] **Step 6 : le site répond, vu par un robot**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/check-release.ts <PROD>`
Expected, code 0 : `page answers a crawler (200 text/html…)` ; `share tags`, `share image served (200 image/jpeg)`, `share image`, les deux icônes ; une ligne `ok` par fichier de `/assets/`, avec `public, max-age=31536000, immutable` (les deux vidéos en `206`) ; `missing file answers 404`.

Lectures possibles d'un échec :
- `page answers a crawler (401 …)` ou une page de connexion : la protection des déploiements couvre cette adresse. Ce n'est pas un défaut du site. Lire `vercel project protection` ; ne rien désactiver ; passer à la tâche 13, le contrôle se refera sur le domaine.
- un fichier de `/assets/` en `max-age=0` : la règle `headers` ne s'applique pas. Arrêt, relire `.vercel/output/config.json`.
- une vidéo en `200` au lieu de `206` : Vercel ne sert pas cette vidéo par morceaux, Safari la lira mal. Arrêt, le dire à Romain (repli connu : servir la cinématique depuis Vercel Blob).
- un type de contenu inattendu sur `.woff2`, `.webm`, `.mp4`, `.mp3`, `.webp` : le noter avec la valeur reçue.
- une ligne `llms.txt served`, `llms-full.txt served` ou `.well-known/ai-catalog.json served` en `warn` (`text/plain` pour les deux premiers, `application/json` pour le catalogue) : c'est le type de repli, Vercel ne documente pas la surcharge de `Content-Type` par une règle `headers` sur un fichier statique. Ce n'est pas un échec et cela ne bloque pas : le fichier est servi et son contenu est contrôlé. Le noter dans le rapport. Seul un autre type est un `FAIL`.
- une ligne `.well-known/ard.json served`, `manifest.webmanifest served`, ou une des trois lignes ci-dessus avec un autre type que le repli, en `FAIL` avec un code 200 : le type de contenu n'est pas celui de `vercel.json`. La règle `headers` de ce fichier ne s'applique pas (forme de `source` à relire dans la documentation de Vercel). Arrêt, correction dans un commit nommé, nouveau déploiement sur le go de Romain.
- une ligne `… served` en `404` sur un fichier de `.well-known/` : le dossier caché n'est pas parti dans le site construit. Lire `ls -a .vercel/output/static/.well-known`.

Avant `vercel build` (étape 4), mettre la date du jour dans `datePublished` (`index.html`) et `lastmod` (`public/sitemap.xml`), dans un commit nommé : c'est la date de mise en ligne.

- [ ] **Step 7 : dire à Romain où c'est**

Une ligne : l'adresse `<PROD>`, et le résultat du contrôle.

---

### Task 13 : PORTE 3, le DNS (Romain fait le geste, le contrôleur prépare et vérifie)

`erom.cloud` est chez Hostinger, neuf, jamais utilisé. Ses serveurs de noms restent chez Hostinger : on ajoute un seul enregistrement CNAME pour `agenthot`. La racine `erom.cloud` reste libre.

**Piège :** ne pas interroger `agenthot.erom.cloud` par un résolveur public avant que l'enregistrement existe. Une réponse « n'existe pas » reste en cache 600 s. Jusqu'à l'étape 4, toute requête DNS vise un serveur de noms de la zone (`@aurora.dns-parking.com`).

- [ ] **Step 1 : ARRÊT. Go de Romain pour le domaine**

Lui écrire :

> Porte 3, le domaine. J'attache `agenthot.erom.cloud` au projet Vercel, puis je te donne une valeur à coller chez Hostinger. Rien ne change pour `erom.cloud` lui-même.
> Réponds « go domaine ».

- [ ] **Step 2 : attacher le domaine au projet, lire la cible**

```bash
cd /Users/recarnot/dev/claudehot-videogame && vercel domains add agenthot.erom.cloud agenthot-the-game
cd /Users/recarnot/dev/claudehot-videogame && vercel domains inspect agenthot.erom.cloud
```

Expected : le domaine est ajouté au projet ; `inspect` affiche l'enregistrement attendu : type `CNAME`, nom `agenthot`, et une **cible propre au projet**, du type `xxxxxxxxxxxxxxxx.vercel-dns-0NN.com`. Noter cette cible : c'est `<CIBLE>`. Si `inspect` ne la montre pas, elle est sur la carte du domaine : tableau de bord Vercel, projet `agenthot-the-game`, Settings, Domains. Ne pas utiliser `cname.vercel-dns.com`, la valeur des vieux tutoriels.

Si Vercel demande un enregistrement TXT `_vercel` (domaine déjà pris par un autre compte) : le donner à Romain en plus, même marche.

- [ ] **Step 3 : ARRÊT. Romain ajoute l'enregistrement chez Hostinger**

Lui envoyer ces étapes, avec `<CIBLE>` remplacée par la vraie valeur :

> 1. Va sur `https://hpanel.hostinger.com` et connecte-toi.
> 2. Menu de gauche : **Domains**, puis **DNS**. Choisis `erom.cloud`.
> 3. Reste sur l'onglet **DNS records**. Si les noms ont changé, cherche l'éditeur de zone DNS du domaine.
> 4. Dans **Manage DNS records**, remplis la ligne :
>    - **Type :** `CNAME`
>    - **Name :** `agenthot` (rien d'autre, pas `agenthot.erom.cloud`)
>    - **Target :** `<CIBLE>` (copie-colle. Si Hostinger refuse le point final, enlève-le)
>    - **TTL :** `300`
> 5. Clique sur **Add Record**.
> 6. Ne touche à aucune autre ligne.
> 7. Écris-moi « fait ».

- [ ] **Step 4 : l'enregistrement est publié**

Run : `dig +short CNAME agenthot.erom.cloud @aurora.dns-parking.com`
Expected : `<CIBLE>` suivie d'un point. Rien : attendre 2 minutes et relancer (Hostinger annonce jusqu'à 24 h, c'est en général quelques minutes). Une autre valeur : la montrer à Romain, il corrige la ligne.

Puis seulement, par un résolveur public :

Run : `dig +short agenthot.erom.cloud @1.1.1.1`
Expected : `<CIBLE>`, puis une ou plusieurs adresses IP.

Run : `cd /Users/recarnot/dev/claudehot-videogame && vercel domains verify agenthot.erom.cloud`
Expected : le domaine est correctement configuré. Sinon la commande dit quoi corriger.

- [ ] **Step 5 : AC-3c-10, le certificat et la réponse**

Le certificat Let's Encrypt arrive quelques minutes après la vérification.

Run : `curl -sI https://agenthot.erom.cloud/ | head -5 ; curl -sI http://agenthot.erom.cloud/ | head -3`
Expected : `HTTP/2 200` et `content-type: text/html` ; puis une redirection (code 308 attendu, non lu dans la documentation : noter le code reçu) avec `location: https://agenthot.erom.cloud/`. Une erreur de certificat : attendre 5 minutes, relancer ; `vercel certs ls` doit finir par lister `agenthot.erom.cloud`. Après 30 minutes sans certificat : arrêt, lire `vercel domains inspect agenthot.erom.cloud`.

- [ ] **Step 6 : AC-3c-1 et AC-3c-2, le contrôle sur la vraie adresse**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/check-release.ts https://agenthot.erom.cloud/ 2>&1 | tee .superpowers/plan-3c-live-check.log`
Expected, code 0 : les mêmes lignes qu'à la tâche 12, étape 6, toutes en `ok`, dont `missing file answers 404` et les deux vidéos en `206`. Le domaine de production n'est pas couvert par la protection des déploiements : un `401` ici est un vrai défaut, arrêt.

Run : `curl -s "https://cardyb.bsky.app/v1/extract?url=https%3A%2F%2Fagenthot.erom.cloud%2F"`
Expected : un JSON avec `"title":"AGENTHOT"`, la description et une adresse d'image. C'est l'extracteur réel de Bluesky, sans compte : un robot du dehors lit bien la carte.

---

### Task 13b : après le domaine, trois gestes de Romain (contrôleur)

Chacun attend ses mots. Aucun n'empêche le jeu de marcher : s'il en remet un à plus tard, on le note et on continue.

- [ ] **Step 1 : AC-3c-12, la fiche relue par un outil du dehors**

MCP Chrome DevTools : `new_page` sur `https://validator.schema.org/#url=https%3A%2F%2Fagenthot.erom.cloud%2F`, attendre le résultat, `take_snapshot`.
Expected : quatre éléments détectés (`WebSite`, `VideoGame`, `Person`, `VideoObject`), 0 erreur. Un avertissement sur un champ recommandé se note, sans bloquer.

- [ ] **Step 2 : ARRÊT. Le jeton d'origin trial WebMCP**

Sans jeton, Chrome n'expose pas `document.modelContext` sur le site : les outils existent mais aucun agent ne les voit. Le jeton de linktree ne sert pas ici, il est lié à `www.romain-ecarnot.com`. L'essai se termine vers le 17/11/2026 : le jeton sera à renouveler, ou l'API sera sortie de l'essai.

Lui écrire :

> WebMCP : pour que les agents de Chrome voient les outils du jeu, il faut un jeton, comme sur ton site.
> 1. Va sur `https://developer.chrome.com/origintrials/` et connecte-toi.
> 2. Cherche l'essai « WebMCP », clique sur « Register ».
> 3. Origine : `https://agenthot.erom.cloud`. Ne coche pas « sous-domaines ».
> 4. Copie le jeton (une longue chaîne) et colle-le-moi ici. Il est public, il finira dans la page.
> Ou réponds « plus tard ».

Sur son jeton : l'ajouter en premier enfant du `<head>` d'`index.html`, `<meta http-equiv="origin-trial" content="<jeton>" />`, avec un commentaire qui dit l'origine et la date d'expiration lue dans le jeton (`echo '<jeton>' | base64 -d | tail -c 120`). Commit nommé, `bun scripts/check-release.ts dist`, puis un nouveau déploiement par la tâche 12, étapes 4 à 6, **sur un nouveau go de Romain**.

- [ ] **Step 3 : AC-3c-14 sur le site réel**

Après ce déploiement, dans le Chrome de Romain (l'essai dépend de la version de Chrome) : ouvrir `https://agenthot.erom.cloud/`, console, `"modelContext" in document`.
Expected : `true`. `false` : lire `chrome://version` (Chrome 149 ou plus) et l'onglet Application, section « Origin trials », de DevTools, qui dit si le jeton est accepté.

- [ ] **Step 4 : ARRÊT. Déclarer le site aux moteurs**

Lui écrire :

> Deux déclarations, cinq minutes, comme pour ton site :
> 1. **Google Search Console** (`https://search.google.com/search-console`) : ajoute la propriété `https://agenthot.erom.cloud/`. Si `erom.cloud` y est déjà en propriété de domaine, rien à prouver. Sinon Google te donne une balise ou un enregistrement DNS : donne-moi la balise, je la pose. Puis « Sitemaps », ajoute `sitemap.xml`.
> 2. **Bing Webmaster Tools** (`https://www.bing.com/webmasters`) : « Import from Google Search Console », ou ajoute le site et son `sitemap.xml`.
> Écris-moi « fait », ou « plus tard ».

Une balise de vérification donnée par Romain (`<meta name="google-site-verification" …>`) se pose dans `index.html`, commit nommé, nouveau déploiement sur son go.

- [ ] **Step 5 : ARRÊT. IndexNow**

Run : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/submit-indexnow.ts`
Expected : le JSON, puis `dry run: nothing sent`.

Lui écrire :

> IndexNow : je préviens Bing et quatre autres moteurs que le jeu existe. Un seul envoi, gratuit. Réponds « go indexnow ».

Sur son go : `cd /Users/recarnot/dev/claudehot-videogame && bun scripts/submit-indexnow.ts --send 2>&1 | tee .superpowers/plan-3c-indexnow.log`
Expected : `https://api.indexnow.org/indexnow: 200` ou `202`. `403` : la clé n'est pas lue en ligne, relire `https://agenthot.erom.cloud/agenthot-hjjp0jh6j53192gxquqxg84k.txt`. `422` : l'adresse n'appartient pas à l'hôte.

---

### Task 14 : recette en ligne et passation (contrôleur)

- [ ] **Step 1 : le jeu, sur la vraie adresse**

MCP Chrome DevTools : `new_page` sur `https://agenthot.erom.cloud/?debug` avec `isolatedContext: "live"`. Reprendre le script de la tâche 5, étape 7.
Expected : le menu s'affiche, `stats.frames` > 0, `maxDrawCalls` < 80 ; `list_console_messages` : aucune erreur (en particulier aucun fichier en 404).

- [ ] **Step 2 : ARRÊT léger. Romain ouvre le site**

Lui écrire :

> C'est en ligne : https://agenthot.erom.cloud/
> 1. Ouvre-le dans Safari, fenêtre privée. La cinématique doit jouer.
> 2. Joue une partie dans Chrome.
> 3. Colle le lien dans iMessage, et dans une autre messagerie que tu utilises. Dis-moi si la carte montre l'image, « AGENTHOT » et la phrase.

Attendu : la cinématique joue dans Safari (AC-3c-3, en ligne) ; la carte est bonne dans les deux messageries (AC-3c-2).

- [ ] **Step 3 : si une carte est fausse**

Une messagerie a pu lire la page avant qu'elle soit prête : sa copie reste en cache (Slack 30 minutes, X jusqu'à 7 jours, Facebook 24 heures). Relancer `bun scripts/check-release.ts https://agenthot.erom.cloud/` : s'il passe, la page est bonne et c'est le cache de la messagerie. Outils pour forcer une relecture, avec un compte : Facebook Sharing Debugger (`developers.facebook.com/tools/debug/`), LinkedIn Post Inspector (`linkedin.com/post-inspector/`). Une image refaite change de nom (`og-v2.jpg`) et de balise, puis un nouveau déploiement par la tâche 12, étapes 4 à 6, sur un nouveau go de Romain.

- [ ] **Step 4 : AC-3c-8 en ligne**

Reprendre la tâche 9, étape 5, sur `https://agenthot.erom.cloud/` (émulation iPhone, puis cas iPad).
Expected : les mêmes résultats.

- [ ] **Step 5 : AC-3c-6 et AC-3c-1 en ligne**

Reprendre la tâche 9, étape 3, sur `https://agenthot.erom.cloud/`, contexte neuf, sans limite de réseau.
Expected : `promptMs` ≤ 2 000 ; `lightBytes` < 3 000 000. Noter `navigator.connection.downlink` à côté de la mesure.

Puis `navigate_page` en `reload` (sans `ignoreCache`), et :

```js
async () => {
  await new Promise((r) => setTimeout(r, 4000));
  return performance.getEntriesByType("resource").filter((e) => e.name.includes("/assets/")).map((e) => `${e.name.replace(location.origin, "")} ${e.transferSize}`);
}
```

Expected : `transferSize` à `0` pour chaque fichier de `/assets/` (servi par le cache, sans requête).

- [ ] **Step 6 : le tableau des critères**

Écrire dans le journal, puis dans le rapport de fin, une ligne par critère, avec la commande ou le geste réellement fait et sa sortie : AC-3c-1 à AC-3c-16. Un critère non vérifié est écrit « non vérifié », jamais arrondi.

Puis les 19 critères de la spec, en une table : où chacun a été tranché (plans 1, 2, 3a, 3b, ou ce plan : AC-8 → AC-3c-5, AC-9 → AC-3c-7, AC-10 → AC-3c-6, AC-12 → AC-3c-8, AC-15 → AC-3c-4, AC-17 → AC-3c-9). **AC-18 (trois testeurs, moins de 5 essais en moyenne) reste ouvert** : il demande deux joueurs de plus que Romain, maintenant que le lien existe.

- [ ] **Step 7 : passation**

Mettre à jour, dans un commit `docs:` (fichiers nommés) :
- `.claude/notes/2026-09-29-agenthot-reprise.md` : un en-tête daté « plan 3c fait, en ligne », l'adresse, le commit de `main`, ce qui reste ouvert (AC-18, backlog de la décision 12).
- `.claude/notes/agenthot-plan-3-remaining.md` : un en-tête daté, 3c fait.
- `.claude/notes/agenthot-pitfalls.md`, section « Plan 3c » : les faits constatés pendant l'exécution, chacun avec sa commande de re-vérification. Au minimum : les fichiers lourds sont dans `src/` et importés (un fichier remis dans `public/` perd son cache long : `bun scripts/check-release.ts dist` le dit) ; chez Vercel un fichier absent répond 404, en local 200 ; la cible CNAME est propre au projet (`vercel domains inspect agenthot.erom.cloud`) ; une nouvelle mise en ligne = tâche 12, étapes 4 à 6, sur un go de Romain ; le contrôle d'un site en ligne se fait sur le domaine de production.
- la mémoire du projet (`agenthot-project.md`) : état final, adresse, date.

Ce commit se pousse avec le go de Romain, comme tout push.
