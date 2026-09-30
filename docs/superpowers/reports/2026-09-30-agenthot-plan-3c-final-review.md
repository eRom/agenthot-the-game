# AGENTHOT, plan 3c : revue finale avant fusion et mise en ligne

**Branche :** `feat/agenthot-plan-3c`, tête `eaed3d0`, contre `main` à `5bcb55e` (21 commits, 66 fichiers).
**Date :** 2026-09-30, 19 h 12 à 19 h 35. **Relecteur :** Opus 5.5, effort xhigh, session neuve.
**Méthode :** trois lectures, puis arbitrage sur pièces.
- Ma lecture du code, dans une copie détachée (`git worktree`, scratchpad), sans toucher la copie de la session fortuna.
- Un relecteur indépendant (gabarit `superpowers:requesting-code-review`, grille du code creux, consigne de ne croire aucun résumé).
- Un contrôle d'actualité sur le web, sources primaires, sans résumé de ma part.

Rien n'a été corrigé, commité, poussé ni déployé.

## Verdict

**Fusionnable après une correction :** Firefox est promis dans trois textes publics et n'a jamais été joué. Soit une partie dans Firefox (il n'est pas installé sur ce Mac), soit retirer le mot des trois textes.

Aucun défaut critique. Le reste est mineur. Quatre mineurs valent d'être faits avant le déploiement parce qu'ils coûtent quelques lignes et touchent ce que le public ou un robot lit (M1 à M4).

## Contrôles relancés

Dans la copie détachée à `eaed3d0`, dépendances installées par `bun install --frozen-lockfile`. Journaux bruts dans le scratchpad de cette session (`logs/`).

| Commande | Résultat |
|---|---|
| `bun test` | 354 pass, 0 fail, exit 0 (`logs/test.log`) |
| `bun run typecheck` | exit 0 (`logs/typecheck.log`) |
| `bun run build` | exit 0 ; entrée 40,49 Ko, moteur 1 009,66 Ko, `webmcp` 2,34 Ko (`logs/build.log`) |
| `bun scripts/check-release.ts dist` | `release check: all good`, 31 fichiers, 18,1 Mo (`logs/check-release.log`) |
| `bun scripts/check-release.ts http://localhost:4319/` | 17 `FAIL`, exactement les 17 attendus contre `vite preview` et listés dans `agenthot-pitfalls.md` (cache long, 404, types de contenu). Le mode adresse tourne sans exception (`logs/check-release-preview.log`) |
| `gitleaks git --log-opts=eaed3d0` | 137 commits, `no leaks found` |
| `ffprobe src/ui/video/intro.mp4` | `h264`, `High`, `level=41`, 1920 × 1080 |
| `zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*` | exit 0, deux modèles, tous deux avec un prix (détail en fin de rapport) |

## Défauts, par gravité

### Critique

Aucun.

### Important

**I1. Firefox est promis au public, jamais joué.**
- **Où :** `README.md:7`, `public/llms.txt:5`, `public/llms-full.txt:41` (« Chrome, Safari ou Firefox récents »).
- **Preuve :** aucune recette du 3a au 3c ne joue dans Firefox. La revue du rendu le classe déjà en non couvert (`2026-09-30-agenthot-render-look-final-review.md:200`). Le journal du 3c le note sans ancre (`progress.md:95`). Firefox n'est pas installé sur ce Mac (`/Applications`).
- **Risque :** un joueur Firefox lit que ça marche. Le repli WebGL2 rend une panne peu probable, mais rien ne le prouve. Firefox macOS a WebGPU partiel : si l'adaptateur existe et casse, il n'y a pas de repli automatique.
- **Confiance :** certaine sur l'absence de preuve, faible à moyenne sur une panne réelle (non reproduite).
- **Correction :** une partie dans Firefox à la tâche 9 ou 14, ou retirer « Firefox » des trois textes (la spec, ligne 20, le vise : c'est à Romain de choisir).

### Mineur

**M1. Le contrôle est plus strict que les normes sur trois types de contenu : risque d'arrêt pour rien à la porte 2.**
- **Où :** `scripts/discovery.ts:28-36`, `vercel.json:17-43`.
- **Constat :** le contrôle exige `text/markdown` pour `llms.txt` et `llms-full.txt`, et `application/ai-catalog+json` pour `ai-catalog.json`. Vercel ne documente pas la surcharge de `Content-Type` par une règle `headers` sur un fichier statique : seule la Build Output API la documente (`overrides.contentType`). Une source communautaire montre que ça marche. `llmstxt.org` n'impose aucun type ; des sites servis par Vercel donnent `llms.txt` en `text/plain` (ui.shadcn.com).
- **Risque :** si la surcharge ne prend pas, la tâche 12, étape 6, dit « arrêt, correction, nouveau déploiement sur le go de Romain ». Un arrêt à la porte pour un détail sans effet sur un lecteur.
- **Correction :** trancher avant la porte. Soit accepter `text/plain` et `application/json` en repli dans `DISCOVERY_CONTENT_TYPES`, soit garder la règle et écrire dans le plan que ce `FAIL`-là ne bloque pas.

**M2. `llms-full.txt` dit que la page expose trois outils WebMCP. Pour presque tous les visiteurs, c'est faux.**
- **Où :** `public/llms-full.txt:69`.
- **Constat :** sans jeton d'origin trial, Chrome n'expose pas `document.modelContext`, le module n'est pas chargé, zéro outil. Le jeton est prévu à la tâche 13b, et Romain peut dire « plus tard ». L'essai couvre Chrome 149 à 156 (chromestatus 5117755740913664, mis à jour le 2026-09-28) ; Chrome 157 est stable le 2026-11-03 ; une prolongation jusqu'à 162 est demandée, pas encore accordée.
- **Correction :** « Quand le navigateur expose WebMCP, la page déclare trois outils… ».

**M3. Le catalogue annonce un identifiant `did:web` que personne ne peut vérifier.**
- **Où :** `public/.well-known/ard.json:5`, `public/.well-known/ai-catalog.json:5`.
- **Constat :** `did:web:agenthot.erom.cloud` se résout vers `https://agenthot.erom.cloud/.well-known/did.json`, que le build ne produit pas. AI Catalog demande « a verifiable identifier (e.g., a DID or domain name) ». Vu par le relecteur et par le contrôle web, chacun de son côté.
- **Correction :** `"identifier": "agenthot.erom.cloud"`, dans les deux fichiers (le contrôle exige qu'ils soient identiques).

**M4. `llms.txt` est annoncé avec la relation d'avant la v2.**
- **Où :** `index.html:19`, `scripts/discovery.ts:58`, le test des liens.
- **Constat :** llmstxt.org v2 (mise à jour du 2026-09-24, relue ce soir) : `rel="alternate" type="text/markdown"` désigne la version Markdown d'une page, `rel="describedby"` désigne le fichier `llms.txt`. Le lien vers `llms-full.txt` en `alternate` se défend (c'est la page en Markdown).
- **Correction :** `rel="describedby"` pour `/llms.txt`, la même chose dans `DISCOVERY_LINKS` et son test. Impact pratique faible : les agents lisent `/llms.txt` à la racine de toute façon.

**M5. Le contrôle en mode adresse ne voit que 12 des 16 fichiers de `/assets/`.**
- **Où :** `scripts/check-release.ts:158-159`, `scripts/release.ts:172-174`.
- **Reproduction :** contre `vite preview`, 12 lignes `/assets/…` ; `dist/assets/` compte 16 fichiers. Manquent `engine-….js` (1 Mo, cité en `./engine-….js`), `webmcp-….js`, et deux polices citées seulement par le CSS (`big-shoulders-display-800`, `chakra-petch-500`). Le mode dossier ne lit pas le CSS non plus.
- **Risque :** faible. La même règle `/assets/(.*)` les couvre, et la tâche 14 lit `transferSize`. Déjà noté pour `engine` dans `agenthot-pitfalls.md` (candidat 1x) : ce constat le confirme, et l'étend aux polices du CSS.
- **Correction :** lire aussi les `.css`, et résoudre les `./x.js` par rapport au script qui les cite.

**M6. La sonde d'images ne protège pas le nouveau critère `maxMs`.**
- **Où :** `src/app/engine.ts:280` et `:312-313`, `src/app/frame-stats.ts`.
- **Constat :** AC-3c-5 lit maintenant `maxMs`, un maximum : une seule image retardée le fait échouer. Un changement d'onglet ou un alt-tab pendant la partie en produit une (le test `tests/frame-stats.test.ts:37-45` montre `maxMs` à 400 pour une seule image). L'image de la dernière mise à mort n'entre pas dans le rapport (il est écrit avant son rendu). Le rapport se calcule dans la boucle, sur l'image de fin.
- **Ce qui ne change pas :** la mesure de Romain tient. Sa ligne dit `frames: 2398` (`progress.md:131`), sous la capacité de 7 200 : la partie entière est couverte, rien n'a été tronqué.
- **Correction, pour une prochaine mesure :** remettre `lastFrameTime` à zéro sur `visibilitychange` et ignorer l'intervalle suivant ; ou écrire dans le protocole « sans quitter la fenêtre ».

**M7. Le greffon Vite réécrit aussi un commentaire, et son garde-fou s'en contente.**
- **Où :** `vite.config.ts:17-18`, `index.html:35`.
- **Constat :** `replaceAll` remplace aussi le chemin dans le commentaire HTML. La page publiée dit « « /assets/intro-CvlKAUil.mp4 » est remplacé au build… ». Et `html.includes(INTRO_PLACEHOLDER)` est satisfait par ce seul commentaire : si `contentUrl` change, le greffon ne dit rien (`check-release` le rattrape par la ligne des fichiers cités).
- **Correction :** remplacer seulement la valeur de `contentUrl`, ou retirer le chemin du commentaire.

**M8. Deux phrases publiques inexactes.**
- `index.html:61` : `operatingSystem` « Tout système avec un navigateur récent ». Un téléphone en a un et reçoit « Joue sur ordi ». Proposition : « Ordinateur avec un navigateur récent (WebGPU ou WebGL2) ».
- `public/llms.txt:9` : « Il démarre dès la page ouverte ». Il y a l'invite, la cinématique, le menu ; rien ne démarre sur mobile.

**M9. La vérification en ligne d'AC-3c-14 ne peut pas échouer sur le vrai comportement.**
- **Où :** plan, tâche 13b, étape 3 ; `src/app/main.ts:38-42`.
- **Constat :** l'étape lit `"modelContext" in document`. Si l'API réelle n'a pas `registerTool` ou refuse les outils, `findModelContext` rend `null` sans un mot, zéro outil, et le contrôle passe.
- **Correction :** écrire `[agenthot] webmcp: N tools registered` en console et lire N à l'étape 3.

**M10. `.gitignore` n'a pas de ligne `.env*`, avant un dépôt public.**
- **Où :** `.gitignore`.
- **Constat :** aucun `.env` n'existe aujourd'hui, les clés viennent du shell. Mais un `.env` posé un jour par un outil partirait au prochain `git add` nommé large. Une ligne suffit.

**M11. Textes de travail publics en décalage avec le code.**
- Plan 3c, AC-3c-4 (ligne 89) et l'attendu de la ligne 3734 : encore « AGENTHOT ‧ Author ». L'en-tête (ligne 39) dit que la nouvelle ligne prime, mais le critère lui-même n'est pas corrigé.
- Spec, lignes 64 et 445 : `https://github.com/eRom/XXXXXX`.

**M12. L'adresse du site est écrite deux fois, et le test la compare à elle-même.**
- **Où :** `src/app/game-facts.ts:7`, `scripts/release.ts:6`, `tests/webmcp.test.ts:44`.
- **Correction :** une seule constante importée, ou un test d'égalité entre les deux.

**M13. `count-tokens.sh` peut encore sous-compter sans échouer (latent).**
- **Où :** `scripts/count-tokens.sh:10`.
- **Constat :** une écriture en cache sans le détail 5 min / 1 h compterait 0 ; une ligne en mode rapide (2x sur Opus 5.5) serait comptée au tarif normal. Aucun des deux cas n'existe dans les transcripts du projet (vérifié : 0 fichier avec `"speed":"fast"` ; le relecteur a vérifié le détail des écritures sur 9 894 lignes).
- **Correction :** replier sur `cache_creation_input_tokens` quand le détail manque ; sortir en code 3 sur `speed == "fast"`, comme pour un modèle sans prix (décision 10).

**M14. Le nom d'un test de crédits promet plus qu'il ne vérifie.**
- **Où :** `tests/credits.test.ts:23`, « les compteurs sont de vraies mesures ». Il accepterait 1 token et 0,01 $ (déjà au journal, `progress.md:62`). Le renommer suffit.

## À savoir pour Romain (pas des défauts)

- **Crédits à recompter à la tâche 10, comme prévu.** Le code dit 979 282 748 tokens et 384,71 $ (mesure de 18 h 12). Mon compte de 19 h 17 : **1 072 149 760 tokens, 424,91 $** (Opus 5.5 : 887 336 042 tokens, 343,67 $ ; Sonnet 5.5 : 184 813 718 tokens, 81,24 $). Il inclut une partie des sessions de revue du soir.
- **97 % de ces tokens sont des relectures de cache** (1 040 millions sur 1 072). Les tokens produits par les modèles : 4,7 millions. Le chiffre affiché est juste au sens de la facturation, et le script est public. Un lecteur pressé peut quand même lire « un milliard de tokens écrits ». À garder en tête si quelqu'un le relève.
- **WebMCP, porte 13b :** l'essai de Chrome couvre les versions 149 à 156 ; 157 sort le 2026-11-03. Sans prolongation, un jeton demandé maintenant vit environ cinq semaines.
- **Google et la fiche du jeu :** pas de résultat enrichi « application » sans note ni avis (décision assumée : on n'invente pas de note). Search Console risque de marquer l'élément « non valide » : c'est attendu. Pour la vidéo, Google ne l'indexe que s'il voit une balise `<video>` dans la page rendue ; ici elle est créée en JavaScript après l'invite. À regarder dans le Rich Results Test une fois en ligne, sans rien bloquer.

## Contrôle d'actualité (web, sources primaires, 2026-09-30)

| Sujet | Verdict | Source principale |
|---|---|---|
| `vercel.json`, motif `/assets/(.*)` et cache d'un an immuable | conforme | vercel.com/docs/project-configuration/vercel-json (2026-08-14) ; /docs/caching/cache-control-headers (2026-09-14) |
| `vercel.json` face à `vercel.ts` | conforme, pas de dépréciation | vercel.com/docs/project-configuration (2026-08-25) |
| `.well-known/` dans un déploiement `--prebuilt` | conforme d'après le code de la CLI (glob `dot: true`) | dépôt vercel/vercel, `@vercel/build-utils` |
| Surcharge de `Content-Type` par `headers` | non documentée, voir M1 | Build Output API, `overrides.contentType` |
| Réponse `206` sur une vidéo statique | non documentée, observée ailleurs ; `check-release` la contrôle | observation sur react.dev |
| Open Graph et cartes | conforme ; `og:site_name` absent par décision 7 | ogp.me ; Facebook ; LinkedIn ; Apple TN3156 |
| WebMCP : `document.modelContext.registerTool`, promesse, `execute` rend des données brutes, `readOnlyHint` | conforme au brouillon du jour | webmachinelearning.github.io/webmcp (dernier commit 2026-09-30) ; developer.chrome.com/docs/ai/webmcp (2026-08-07) |
| WebMCP, origin trial | Chrome 149 à 156, voir M2 | chromestatus 5117755740913664 (2026-09-28) |
| ARD | v0.91, « Proposal », 2026-08-26 ; entrées conformes au schéma ; `ard.json` + `rel="ard"` | agenticresourcediscovery.org/spec |
| AI Catalog | `specVersion` et `entries` conformes ; `did:web` sans document, voir M3 | github.com/Agent-Card/ai-catalog |
| `llms.txt` | structure conforme ; relation de lien, voir M4 ; `llms-full.txt` est une convention, pas une spec | llmstxt.org/index.md, v2 (2026-09-24) |
| Schema.org `VideoGame` + `WebApplication`, `VideoObject` | valide ; champs vidéo requis présents | developers.google.com, pages software-app (2026-09-08) et video (2026-09-24) |
| Noms des robots d'IA | 20 des 21 noms relus chez leur éditeur (`Bingbot`, nom établi de Microsoft, non relu) ; aucun nom obsolète ni inventé | pages officielles d'OpenAI, Anthropic, Perplexity, Mistral, Google, Apple, Meta, DuckDuckGo, Amazon, Common Crawl |
| IndexNow | conforme (clé de 33 caractères `[a-z0-9-]`, fichier exact, codes 200 et 202) | indexnow.org/documentation |
| Manifeste | conforme aux critères d'installation ; `id` facultatif absent | W3C Web App Manifest (2026-08-13) ; web.dev |
| H.264 High 4.1 pour Safari | conforme (lu par `ffprobe`) | mesure locale |

## Les trois points non confirmés par une doc

- **Champs du catalogue ARD :** confirmés. Seul `entries` est exigé par ARD ; chaque entrée porte `identifier` au bon motif `urn:air:`, `displayName`, `type` IANA, `url`. Les requêtes d'exemple (4, 2, 3, 2) sont dans la fourchette. Reste M3.
- **En-têtes de `vercel.json` sur `/.well-known/` :** le dossier part bien dans le build ; la règle `headers` s'applique à un fichier statique ; la surcharge de `Content-Type` n'est pas documentée (M1). Tranché en ligne par `check-release`.
- **Forme de retour des outils WebMCP :** confirmée. Le brouillon dit `Promise<any>`, sérialisé en JSON par le navigateur. Le code rend les données telles quelles. Non testé dans un vrai Chrome avec le drapeau (ce serait toucher à la configuration de Romain).

## Ce qui devient public

- **Secrets :** `gitleaks` à `eaed3d0`, 137 commits, aucune fuite. La clé IndexNow est publique par nature ; elle s'affiche masquée dans les outils (piège connu), elle est bien écrite en clair dans `scripts/discovery.ts:39` et identique au fichier servi (contrôle `IndexNow key file` en `ok`).
- **Réponses d'API** (`assets/*-response.json`, `.claude/notes/agenthot-probes/*.json`) : aucun compte, projet ni mail. L'`id` Lyria décodé est un identifiant de requête opaque. `assets/ledger.jsonl` : date, outil, modèle, prompt, sortie, prix. Rien d'autre.
- **Adresses mail dans les fichiers suivis :** aucune. Le mail Gmail reste l'auteur des commits : décision de Romain à la porte 1, déjà prévue.
- **Chemins `/Users/recarnot` :** 4 fichiers (plans, note de reprise, `OVERVIEW.md`). Sans danger, déjà listé au plan.
- **Tiret cadratin :** 0 dans `README.md`, `index.html`, `public/*` (llms, manifeste, catalogues, robots, sitemap) et `src/`. Les plans et notes en portent : ce sont des textes de travail, la règle ne les vise pas.
- **Exactitude des textes :** faits recoupés avec le code. Cinq ennemis (3 au départ, 2 quand il en reste 2), quatre balles (`WEAPON.capacity`), touches (`input.ts`), tokens et prix. Écarts : I1, M2, M8.

## Grille du code creux

1. **Module exporté qui ne fait rien :** aucun.
2. **Bouche-trou ou erreur avalée :** aucune erreur avalée ; les refus WebMCP et l'échec de l'import sont écrits en console. Un silence : `findModelContext` qui rend `null` (M9).
3. **Constante sans ancrage :** limites de partage, de découverte et prix des tokens, toutes sourcées. Faiblement ancrés : `FRAME_STATS.capacity` (« deux minutes », qui ne vaut qu'à 60 i/s) et la promesse « Firefox » (I1).
4. **Test qui n'exerce pas le comportement :** `tests/webmcp.test.ts:44` compare une constante à elle-même (M12) ; le nom de `tests/credits.test.ts:23` (M14). Les autres tests portent sur le comportement, avec des cas d'échec réels (image relative, page d'erreur d'hébergeur, fichier sans hash, balises après 300 Ko).
5. **Branches du seul chemin heureux :** le mode adresse de `check-release` n'a pas de test unitaire, mais il a tourné ce soir contre `vite preview` et a donné exactement les 17 échecs attendus. Il ne couvre pas tout `/assets/` (M5).
6. **État géré trop grossièrement :** la sonde d'images et l'onglet caché (M6).

## Écartés, ou déjà tranchés

- **Déjà tranché par Romain :** critère « jamais sous 30 images/s », rendu figé, dépôt public avec l'historique, son nom et ses trois `sameAs` dans le JSON-LD (décision 15), phrase du making-of, les trois outils, le tutoiement, la ligne des crédits.
- **Choix assumés du plan :** pas de `og:site_name` ni de `og:video` (décision 7) ; catalogue servi sous deux chemins alors qu'ARD dit que l'ancien n'est plus nécessaire (décision 14, sans coût) ; pas de note inventée ; `og-v1.jpg` refaite sous le même nom (jamais en ligne).
- **« Le temps n'avance que quand tu bouges » :** il avance à 3 % à l'arrêt (`TIME.min`). C'est la phrase du jeu, déjà au journal (`progress.md:98`).
- **Mineurs déjà au journal d'exécution** (`progress.md:33-112`) : non recomptés ici, sauf quand ce soir en apporte une preuve nouvelle (M5, M14).
- **En-têtes de sécurité (CSP) :** absents de la spec et du plan.

## Non couvert

- Pas de partie jouée, pas de mesure de cadence (tranché par Romain), pas de navigateur ce soir : la recette de la tâche 9 en fait foi.
- WebMCP dans un vrai Chrome avec le drapeau.
- Tout ce qui ne se voit que chez Vercel : types de contenu, `206`, `404`, cache. Le site n'existe pas encore ; `check-release` le tranchera aux tâches 12 et 13.
- X et Bluesky : pas de documentation publique des balises lues.
- Fichiers hors du diff (`videos/`, plans 1 à 3b), sauf pour les secrets (`gitleaks` sur tout l'historique).

## Le meilleur argument contre mes constats

Rien ici ne casse le jeu. I1 vient de la spec elle-même, qui vise Firefox, et le repli WebGL2 couvre le cas le plus probable. M1 peut ne jamais se produire si Vercel honore la surcharge, ce que la communauté rapporte. M2 est vrai dès que Romain pose le jeton. M3, M4 et M8 ne changent rien pour un joueur, et presque rien pour un agent. M5 et M6 concernent des outils de mesure, et leurs limites sont déjà au journal. Un « fusionnable et publiable » sec se défend.

Je garde I1 parce que c'est une promesse écrite à un vrai joueur, qu'aucune pièce ne soutient, et que la tenir coûte cinq minutes ou trois mots. Je garde M1 parce qu'il peut arrêter la porte 2 pour rien, et que le trancher maintenant coûte une ligne.
