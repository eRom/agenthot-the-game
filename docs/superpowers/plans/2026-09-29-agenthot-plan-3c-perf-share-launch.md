# AGENTHOT, plan 3c : performance, partage, crédits, mise en ligne

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** mettre AGENTHOT en ligne à `https://agenthot.erom.cloud/`, avec un cache long sur tout ce qui pèse, un aperçu propre quand on partage le lien, des crédits vrais, et la preuve que les critères de la spec tiennent sur le site réel.

**Architecture :**
- Le code d'abord (tâches 1 à 8), sans rien toucher au-dehors : un contrôle de mise en ligne rejouable (`bun scripts/check-release.ts`), les fichiers lourds servis par Vite sous un nom haché, le MP4 de la cinématique ré-encodé pour les vieux décodeurs, les balises de partage, une sonde d'images pour AC-8, les crédits définitifs, la configuration Vercel, le README.
- Puis la recette locale et la relecture de Romain (tâche 9), la revue finale et la fusion (tâche 10).
- Puis les trois portes de Romain, chacune un arrêt : le push (tâche 11), le déploiement Vercel (tâche 12), le DNS (tâche 13). Le déploiement envoie un site construit sur ce Mac (`vercel build` puis `vercel deploy --prebuilt`) : ce qui part en ligne est ce qui a été contrôlé.
- Enfin la recette sur le site réel et la passation (tâche 14).

**Tech Stack :** Vite 8, TypeScript 6 (strict), bun 1.4, Three.js r186, ffmpeg 9.0.2 (`libx264`), Chrome sans écran, CLI Vercel 59.20.0 (`~/.bun/bin/vercel`, compte `eromleduk`, équipe `romain-ecarnots-projects`), `gh`, `dig`, `curl`, MCP Chrome DevTools.

**Spec :** `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, étape 8 de la section 11 : sections 4.2 (repli MP4), 4.3 (crédits), 4.7 (partage), 9.2 (performance), 12 (points ouverts) ; AC-8, AC-9, AC-10, AC-12, AC-15, AC-17. Entrées obligatoires : `.claude/notes/2026-09-29-agenthot-reprise.md`, `.claude/notes/agenthot-plan-3-remaining.md` (section 3c), `.claude/notes/agenthot-pitfalls.md`, brief `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md` (sections 5, 7, 8), revue `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md` (points 6 et 7).

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
- **Git :** branche `feat/agenthot-plan-3c` depuis `main`. `git add` de fichiers nommés seulement, jamais `git add -A` ni `git add .`. Fichiers de Romain à laisser hors des commits : `docs/superpowers/idea/*` (dont `ideation.md`, `Lyria-prompt-guide.md`, `Seedream-5.0-Pro.md`, la planche Gemini, `screenshots/`), la modification de `docs/superpowers/idea/OVERVIEW.md`, `.impeccable/`, `.ignore`, `rendu-simule/`.
- **Commandes Bash :** chaque commande qui écrit commence par `cd /Users/recarnot/dev/claudehot-videogame &&`. Sortie brute des tests : préfixe `RTK_DISABLED=1`. Toute sortie de test citée dans un rapport vient d'une commande passée par `tee` vers un fichier nommé dans le rapport ; `bun test | tee` masque le code de sortie : lire la ligne `pass`/`fail` du fichier.
- **Secrets :** ne jamais afficher une clé. Un contrôle de présence se fait par un compte (`grep -c`), jamais par un affichage.
- **Chrome :** MCP Chrome DevTools (profil unique ; s'il est pris, l'extension claude-in-chrome). La boucle d'animation s'arrête quand l'onglet est caché : toute mesure se fait fenêtre au premier plan. Attendre 2 s après une navigation avant de sonder.
- **Vite :** en développement et en `vite preview`, un fichier absent répond `200 text/html`. Chez Vercel il répond `404`. Vérifier la présence d'un fichier par son type de contenu ou par `ls`, jamais par le code HTTP local.
- **Valeurs de la spec à tenir** (9.2 et critères) : 60 images par seconde au pire moment ; moins de 60 appels de dessin ; poids initial hors cinématique et musiques sous 3 Mo ; « APPUIE SUR UNE TOUCHE » en 2 s au plus ; cinématique de 6 Mo au plus par fichier ; image de partage en 1200 × 630.

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

**AC-3c-5 : 60 images par seconde au pire moment (spec AC-8)**
- **Comportement :** quand Romain joue une partie entière sur son Mac, éclatements et sortie des baies compris, alors aucune fenêtre de 2 s ne perd d'images, et une image ne demande jamais 80 appels de dessin.
- **Vérifié par :** la ligne console `[agenthot] frames {…}` de fin de partie (tâche 9, étape 7) : `worstWindowP95Ms` ≤ 20 et `maxDrawCalls` < 80. Pourquoi 20 et pas 16,7 : voir la décision 4.

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

## Structure des fichiers

```
scripts/        release.ts (nouveau : contrôles purs) ; check-release.ts (nouveau : ligne de commande)
                count-tokens.sh (nouveau : tokens et coût des sessions)
                og/icon.html (nouveau : gabarit de l'icône PNG) ; og/og.html, build-fonts.sh (modifiés : nouveau dossier des polices)
src/audio/      tracks/{game,menu,replay}.mp3 (déplacés depuis public/audio/) ; game-audio.ts (modifié : import)
src/ui/         video/intro.{webm,mp4} (déplacés depuis public/video/ ; le MP4 est ré-encodé)
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

Tout le code de ce plan a été exécuté avant d'être écrit ici (2026-09-30), sur une copie de `main` au commit `cbc015c`.
- **Rejeu par tâche dans un dossier vide :** `tsc` passe à chaque étape ; les diffs de ce plan s'appliquent dans l'ordre et redonnent exactement l'arbre du prototype. Suite : 279 → 299 (tâche 1) → 299 (2, 3, 4) → 306 (5) → 308 (6). Build final : point d'entrée 39,98 Ko (14,29 Ko gzip), moteur 992 Ko (276 Ko gzip).
- **Noms hachés :** après la tâche 2, tout ce qui pèse sort dans `dist/assets/` avec un hash, polices préchargées comprises (Vite réécrit les `<link rel="preload">` de `index.html`). `dist/` ne garde hors de `assets/` que `index.html`, `og-v1.jpg`, les deux icônes et `fonts/LICENSES.txt`. L'image de partage reconstruite avec les polices déplacées fait 100 492 octets, comme `public/og-v1.jpg` : les polices se chargent bien depuis leur nouveau dossier.
- **MP4 au niveau 4.1 :** 5 610 507 octets, `h264`, `High`, `level=41`, 1920 × 1080, 30 images par seconde, 26,3 s, `moov` avant `mdat`, décodage complet sans erreur, aucune image figée. QuickLook (le décodeur d'Apple, celui de Safari) en tire une vignette.
- **Contrôle de mise en ligne :** sur le site construit, `release check: all good`. Lancé contre `vite preview`, il échoue là où il doit : 12 fichiers sans cache long et un fichier absent qui répond `200`. C'est exactement ce que Vercel doit corriger.
- **Invite (AC-10) :** sur `vite preview`, cache vide, l'invite arrive à 1 253 ms sans limite de réseau, et à 1 933 ms en « Fast 4G » (9 Mb/s, plus sévère que les 50 Mb/s de la spec). Ce qui la retarde alors, ce sont les attentes plafonnées à 1,5 s du plan 3a (polices, boucle du menu, début de la cinématique). Poids hors cinématique et musiques : 0,34 Mo.
- **Sonde d'images :** au menu, 360 images en 6 s, `p95Ms` 17,5, 41 appels de dessin ; en qualité « haute » (120 images par seconde), `p95Ms` 9,1. L'heure des images donnée par le navigateur porte environ 0,8 ms de gigue : une cadence parfaite de 60 se lit 17,5, pas 16,7.
- **Crédits :** `zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*`, le 2026-09-30 à 15 h 04 : 852 244 097 tokens, 328,19 $ (Opus 5.5 : 260,99 $ ; Sonnet 5.5 : 67,19 $). Dix minutes plus tard : 861 229 775 tokens, 332,07 $. Le total monte avec chaque session : il se mesure une dernière fois juste avant la fusion. Prix relus le 2026-09-30 sur `platform.claude.com/docs/en/about-claude/pricing`.
- **Écran mobile :** émulation iPhone sur le site construit : « Joue sur ordi », vidéo `/assets/intro-….webm` en lecture, muette, aucun canvas, moteur non demandé.
- **Historique du dépôt :** aucune clé dans tout l'historique (0 résultat sur les motifs de clés Google, OpenRouter, Anthropic et GitHub).

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

Puis la suite entière : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun test 2>&1 | tail -4`. Expected : `299 pass`, `0 fail`.

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
index 2cdaf93..d52e5c2 100644
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
Expected : `tsc` sans erreur ; `299 pass`, `0 fail`.

- [ ] **Step 4 : le site construit ne garde rien de lourd hors de `assets/`**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist ; find dist -type f -not -path "dist/assets/*"`
Expected : le build liste 12 fichiers hachés en plus du code (5 polices, 2 vignettes, 3 musiques, 2 vidéos) ; le contrôle dit `ok   long cache` et `ok   12 cited assets exist` (il reste 16 problèmes de partage, pour la tâche 4) ; `find` ne rend que `dist/index.html`, `dist/og-v1.jpg`, `dist/fonts/LICENSES.txt`. Dans `dist/index.html`, les trois `<link rel="preload">` pointent vers `/assets/…-<hash>.woff2`.

- [ ] **Step 5 : les polices se chargent depuis leur nouveau dossier**

L'image de partage se refait à l'identique, ce qui prouve que `og.html` trouve les polices :

Run : `cd /Users/recarnot/dev/claudehot-videogame && zsh scripts/build-og.sh ../../assets/images/og-background.jpg dist/og-test.jpg`
Expected : `1200,630` puis `dist/og-test.jpg: 100492 bytes (q=3)`, le poids exact de `public/og-v1.jpg`. Un autre poids : ouvrir `dist/og-test.jpg`, les polices sont tombées sur une police système.

En développement, lancer `bun run dev --port 5299 --strictPort` en arrière-plan, puis :

Run : `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:5299/src/ui/fonts/big-shoulders-display-900.woff2 http://localhost:5299/src/audio/tracks/menu.mp3 http://localhost:5299/src/ui/video/intro.mp4`
Expected : `200 font/woff2`, `200 audio/mpeg`, `200 video/mp4`. Arrêter le serveur.

- [ ] **Step 6 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/audio/tracks src/ui/video src/rooms/thumbnails src/ui/fonts public/audio public/video public/rooms public/fonts src/audio/game-audio.ts src/audio/music.ts src/ui/media.ts src/rooms/registry.ts src/ui/tokens.css index.html scripts/og/og.html scripts/build-fonts.sh tests/music-loop.test.ts tests/loop-measure.test.ts && git commit -m "perf(assets): music, video, thumbnails and fonts go through Vite for hashed names"
```

`git status --short` ne doit plus montrer que les fichiers de Romain.

---

### Task 3 : le MP4 de la cinématique au niveau H.264 4.1

Le MP4 actuel est au niveau 5.0 (5 images de référence), qu'un vieux décodeur matériel peut refuser (revue finale du 3b, point 6). On le refait depuis le master, au niveau 4.1, même débit. Le WebM AV1 ne change pas.

**Files :**
- Modify : `src/ui/video/intro.mp4` (binaire, refait)
- Lit : `videos/agenthot-intro/renders/master.mp4` (21 Mo, ignoré par git, présent sur ce Mac seulement)

**Interfaces :**
- Consumes : `src/ui/video/intro.mp4` à sa place de la tâche 2.
- Produces : le même fichier, `h264` `High` `level=41`.

- [ ] **Step 1 : le master est là**

Run : `cd /Users/recarnot/dev/claudehot-videogame && ls -l videos/agenthot-intro/renders/master.mp4 && ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 videos/agenthot-intro/renders/master.mp4`
Expected : un fichier d'environ 21 Mo, durée `26.300000`. **Fichier absent : arrêt.** Ne pas ré-encoder depuis `intro.mp4` (deux compressions de suite) ; le dire à Romain, le master se refait par le rendu Hyperframes de la tâche 11 du plan 3b.

- [ ] **Step 2 : ré-encoder en deux passes**

Débit vidéo : `5600 × 8 / durée − 96` kb/s, soit `1607k` pour 26,3 s (même calcul qu'au plan 3b).

```bash
cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -i videos/agenthot-intro/renders/master.mp4 -c:v libx264 -preset slow -profile:v high -level:v 4.1 -refs 4 -b:v 1607k -pass 1 -passlogfile .superpowers/h264pass -an -f null /dev/null
cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -loglevel error -y -i videos/agenthot-intro/renders/master.mp4 -c:v libx264 -preset slow -profile:v high -level:v 4.1 -refs 4 -b:v 1607k -pass 2 -passlogfile .superpowers/h264pass -c:a aac -b:a 96k -movflags +faststart src/ui/video/intro.mp4
```

- [ ] **Step 3 : le fichier est conforme**

Run : `cd /Users/recarnot/dev/claudehot-videogame && ls -l src/ui/video/intro.mp4 && ffprobe -v error -show_entries format=duration:stream=codec_name,profile,level,width,height,r_frame_rate -of default=nw=1 src/ui/video/intro.mp4`
Expected (mesure du prototype) : environ 5 610 507 octets, en tout cas ≤ 6 000 000 ; `codec_name=h264`, `profile=High`, `level=41`, `width=1920`, `height=1080`, `r_frame_rate=30/1` ; piste `aac` ; `duration=26.300000`.

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffmpeg -v error -xerror -i src/ui/video/intro.mp4 -f null - && echo "decode ok" && ffmpeg -hide_banner -nostats -i src/ui/video/intro.mp4 -vf freezedetect=n=0.001:d=0.3 -an -f null - 2>&1 | grep -c freeze_start`
Expected : `decode ok`, puis `0` (aucune image figée : Romain rejette toute image fixe).

Run : `cd /Users/recarnot/dev/claudehot-videogame && ffprobe -v trace src/ui/video/intro.mp4 2>&1 | grep -oE "type:'(moov|mdat)'" | head -2`
Expected : `type:'moov'` avant `type:'mdat'` (la lecture démarre avant la fin du téléchargement).

Run : `cd /Users/recarnot/dev/claudehot-videogame && qlmanage -t -s 640 -o .superpowers src/ui/video/intro.mp4 > /dev/null 2>&1 ; ls -l .superpowers/intro.mp4.png`
Expected : une vignette PNG non vide. QuickLook passe par le décodeur d'Apple, celui de Safari.

- [ ] **Step 4 : commit**

```bash
cd /Users/recarnot/dev/claudehot-videogame && git add src/ui/video/intro.mp4 && git commit -m "fix(cinematic): H.264 fallback re-encoded at level 4.1 for older hardware decoders"
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
     20 files, 17.9 MB
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
Expected : `tsc` sans erreur ; `306 pass`, `0 fail`.

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
Expected : une ligne par modèle puis `TOTAL tokens=… cost=$…`, code 0. Mesure du prototype (2026-09-30, 15 h 04) :

```
claude-sonnet-5-5 msgs=1428 in=2896 cw5m=9711854 cw1h=68663 cr=143617278 out=1390923 total=154791614 cost=$67.19
claude-opus-5-5 msgs=2101 in=4212 cw5m=3190534 cw1h=7839875 cr=684144009 out=2273853 total=697452483 cost=$260.99
TOTAL tokens=852244097 cost=$328.19
```

Les nombres du jour seront plus hauts : chaque session s'ajoute. Une ligne `… : pas de prix connu` et un code 3 : un modèle manque dans la table. Lire son prix sur la page citée, ajouter sa ligne `P["<id du modèle>"]`, relancer. Ne jamais recopier un total obtenu avec un code 3.

- [ ] **Step 5 : écrire les valeurs**

Le diff montre les valeurs du prototype : mettre celles de l'étape 4 (tokens avec des `_` tous les trois chiffres, coût à deux décimales) et la date et l'heure du jour dans le commentaire.

```diff
diff --git a/src/ui/credits.ts b/src/ui/credits.ts
index d510d54..4e767c9 100644
--- a/src/ui/credits.ts
+++ b/src/ui/credits.ts
@@ -1,10 +1,11 @@
 // Crédits (spec 4.3, AC-15) : la ligne exacte donnée par Romain, puis les tokens et le coût API estimé.
-// Valeurs provisoires : mesure du brief plan 3 (2026-09-29, 13 h 35, chantier en cours). Le plan 3c les remplace
-// par le total final (scripts/count-tokens.sh), et remplace XXXXXX par le nom du dépôt choisi par Romain.
+// Mesure du 2026-09-30 à 15 h 04, toutes sessions du projet, sous-agents compris :
+//   zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*
+// À relancer juste avant la mise en ligne : chaque session de plus s'ajoute au total.
 export const CREDITS = {
-  repoUrl: "https://github.com/eRom/XXXXXX",
-  tokens: 118_795_538,
-  apiCostUsd: 50.31,
+  repoUrl: "https://github.com/eRom/agenthot-the-game",
+  tokens: 852_244_097,
+  apiCostUsd: 328.19,
 } as const;
 
 export interface CreditsData {
```

- [ ] **Step 6 : tout passe**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tail -4`
Expected : `tsc` sans erreur ; `308 pass`, `0 fail`.

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
cd /Users/recarnot/dev/claudehot-videogame && git add vercel.json .gitignore && git commit -m "chore(deploy): Vercel configuration with a one-year cache on hashed assets"
```

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
- **Images :** Seedream 5.0 Pro et Nano Banana 2. La cinématique est montée avec Hyperframes, à partir de séquences filmées par le jeu lui-même.
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

### Task 9 : recette locale, puis Romain regarde et joue (contrôleur)

Tout ce qui se vérifie sans rien mettre en ligne, sur le site construit. Chaque résultat est noté dans le journal d'exécution avec sa sortie réelle. La tâche se termine par un **arrêt** : Romain regarde et joue.

**Files :** aucun fichier du dépôt. Journal : `.superpowers/sdd/2026-09-29-agenthot-plan-3c-perf-share-launch/progress.md`.

**Interfaces :**
- Consumes : tout ce que les tâches 1 à 8 ont produit.
- Produces : les mesures des critères AC-3c-3 à AC-3c-9, et les retours de Romain.

- [ ] **Step 1 : construire et contrôler**

Run : `cd /Users/recarnot/dev/claudehot-videogame && RTK_DISABLED=1 bun run typecheck && RTK_DISABLED=1 bun test 2>&1 | tee .superpowers/plan-3c-test.log | tail -4 && RTK_DISABLED=1 bun run build && bun scripts/check-release.ts dist`
Expected : `308 pass`, `0 fail` ; build : point d'entrée vers 40 Ko (14,3 Ko gzip), moteur vers 992 Ko (276 Ko gzip) ; `release check: all good`.

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

Expected : `line` vaut exactement `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/agenthot-the-game` ; `usage` porte les nombres de la tâche 6, par exemple `852 244 097 tokens ‧ coût API estimé : 328,19 $`.

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

- [ ] **Step 7 : ARRÊT. Romain regarde et joue**

Le serveur de l'étape 2 tourne toujours. Envoyer à Romain ce message, tel quel, avec les mesures des étapes 3 à 6 au-dessus :

> Le jeu est prêt en local. Quatre choses à faire, dix minutes :
> 1. **Safari.** Ouvre `http://localhost:4319/` dans Safari, dans une fenêtre privée. Appuie sur une touche. La cinématique doit jouer, avec le son.
> 2. **Chrome, une partie.** Ouvre `http://localhost:4319/?debug`, ouvre la console (Cmd+Option+J), joue jusqu'à la victoire. Copie-moi la ligne qui commence par `[agenthot] frames`.
> 3. **Chrome, le mode de secours.** Ouvre `http://localhost:4319/?debug&renderer=webgl`, gagne une partie. En bas, le panneau doit dire `WebGL2`. Dis-moi si l'image est la même : ombres dans les coins, lueur orange.
> 4. **Regarde trois choses :** l'icône dans l'onglet (un losange orange) ; la phrase de la carte de partage : « Un FPS où le temps n'avance que quand tu bouges. Jouable dans ton navigateur. » ; le fichier `README.md`.
>
> Les crédits affichent maintenant le vrai total : environ 860 millions de tokens, environ 330 $ de coût API estimé.

Attendu de Romain :
- Safari : la cinématique joue (AC-3c-3, en local).
- La ligne `[agenthot] frames {"frames":…,"p95Ms":…,"worstWindowP95Ms":…,"maxMs":…,"maxDrawCalls":…}` : `worstWindowP95Ms` ≤ 20 et `maxDrawCalls` < 80 (AC-3c-5). Une ligne sort aussi à chaque mort : seule celle de la victoire compte.
- WebGL2 : victoire, rendu identique (AC-3c-7).
- Un oui ou un retour sur l'icône, la phrase, le README.

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

Run : `gh repo view eRom/agenthot-the-game --json visibility,isEmpty`
Expected : `{"isEmpty":true,"visibility":"PRIVATE"}`.

- [ ] **Step 2 : ARRÊT. Go de Romain pour le push**

Lui écrire :

> Porte 1, le push. J'envoie `main` sur `github.com/eRom/agenthot-the-game`. Aucune clé dans l'historique.
> Une décision : le dépôt est privé. Le lien « Sources » des crédits mène dessus.
> - **Public (mon conseil) :** le lien marche pour tout le monde. Tout devient lisible : le code, les plans, les notes, les revues.
> - **Privé :** rien n'est exposé, mais le lien des crédits donne une page 404 aux visiteurs.
>
> Réponds « go push public » ou « go push privé ».

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

Écrire dans le journal, puis dans le rapport de fin, une ligne par critère, avec la commande ou le geste réellement fait et sa sortie : AC-3c-1 à AC-3c-11. Un critère non vérifié est écrit « non vérifié », jamais arrondi.

Puis les 19 critères de la spec, en une table : où chacun a été tranché (plans 1, 2, 3a, 3b, ou ce plan : AC-8 → AC-3c-5, AC-9 → AC-3c-7, AC-10 → AC-3c-6, AC-12 → AC-3c-8, AC-15 → AC-3c-4, AC-17 → AC-3c-9). **AC-18 (trois testeurs, moins de 5 essais en moyenne) reste ouvert** : il demande deux joueurs de plus que Romain, maintenant que le lien existe.

- [ ] **Step 7 : passation**

Mettre à jour, dans un commit `docs:` (fichiers nommés) :
- `.claude/notes/2026-09-29-agenthot-reprise.md` : un en-tête daté « plan 3c fait, en ligne », l'adresse, le commit de `main`, ce qui reste ouvert (AC-18, backlog de la décision 12).
- `.claude/notes/agenthot-plan-3-remaining.md` : un en-tête daté, 3c fait.
- `.claude/notes/agenthot-pitfalls.md`, section « Plan 3c » : les faits constatés pendant l'exécution, chacun avec sa commande de re-vérification. Au minimum : les fichiers lourds sont dans `src/` et importés (un fichier remis dans `public/` perd son cache long : `bun scripts/check-release.ts dist` le dit) ; chez Vercel un fichier absent répond 404, en local 200 ; la cible CNAME est propre au projet (`vercel domains inspect agenthot.erom.cloud`) ; une nouvelle mise en ligne = tâche 12, étapes 4 à 6, sur un go de Romain ; le contrôle d'un site en ligne se fait sur le domaine de production.
- la mémoire du projet (`agenthot-project.md`) : état final, adresse, date.

Ce commit se pousse avec le go de Romain, comme tout push.
