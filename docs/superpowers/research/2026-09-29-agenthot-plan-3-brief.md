# AGENTHOT, plan 3 : brief de recherche

Date : 2026-09-29. Auteur : session claude-fortuna-pn4h, à la demande de claude-neptune-5pxz.
Périmètre : écrans, assets générés, cinématique, mise en ligne (spec `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`, sections 4, 6.3, 7.2, 8, 9.2, 12).
Règle suivie : aucun appel payant. Les sondes faites sont gratuites (listes de modèles, requête volontairement invalide, lecture de transcripts locaux).

## Verdict

Prêt pour le plan, avec 3 décisions pour Romain (fin du document) et 5 inconnues à sonder pendant l'exécution :

| Inconnue | Section | Coût de la sonde |
| :--- | :--- | :--- |
| Champ WAV de Lyria et forme réelle de sa réponse | 1 | 0,08 $ (le premier vrai morceau) |
| Taille en pixels des images Seedream `1K` / `2K` | 2 | 0,045 $ (la première vraie image) |
| Réponse `206` aux requêtes Range chez l'hébergeur | 5 | gratuit (`curl`) |
| Poids réel de la cinématique après ré-encodage | 4 | gratuit (`ffprobe`) |
| `canvas.captureStream` avec le rendu WebGPU | 4 | gratuit |

Les deux sondes payantes sont de vraies générations du plan : elles ne coûtent rien de plus.

## Versions et outils présents sur le Mac (vérifié le 2026-09-29)

| Outil | Version ou état | Rôle dans le plan 3 |
| :--- | :--- | :--- |
| ffmpeg / ffprobe | 9.0.2 (Homebrew), encodeurs `libsvtav1`, `libvpx-vp9`, `libx264`, `libopus` | Encodage final de la cinématique, contrôle du poids |
| Google Chrome | installé | Rendu Hyperframes, capture du jeu |
| CLI Vercel | `~/.bun/bin/vercel` | Déploiement si Vercel est retenu |
| wrangler (Cloudflare) | absent | À installer seulement si Cloudflare est retenu |
| uv | `/opt/homebrew/bin/uv` | `fonttools` pour les polices |
| Hyperframes | plugin 0.8.81, CLI non installé globalement | Voir section 4 |

Clés présentes dans le zsh de Romain (vérifié par `test -n`, valeur jamais affichée) : `GEMINI_API_KEY` (Lyria et Nano Banana), `OPENROUTER_API_KEY` (Seedream).

## 1. Lyria 3.5 (API Gemini)

**Échantillons capturés**
- Sonde gratuite `GET https://generativelanguage.googleapis.com/v1beta/models` (HTTP 200). Modèles Lyria présents :
  - `models/lyria-3.5` : « Music Generation model », méthodes `generateContent`, `countTokens` ;
  - `models/lyria-3-clip-preview` : « Lyria 3 30s model Preview » ;
  - `models/lyria-3-pro-preview` ;
  - `models/lyria-realtime-exp` : `bidiGenerateMusic` (WebSocket, hors sujet).
- Sonde gratuite, requête volontairement sans prompt, donc sans génération :
  ```
  POST https://generativelanguage.googleapis.com/v1beta/interactions
  {"model":"lyria-3.5"}
  → HTTP 400
  {"error":{"message":"* GenerateContentRequest.contents: contents is not specified\n","code":"invalid_request"}}
  ```
  L'endpoint et le modèle sont reconnus. C'est aussi la forme réelle d'une erreur.
- Doc officielle : https://ai.google.dev/gemini-api/docs/music-generation (mise à jour 2026-09-23). Prix : https://ai.google.dev/gemini-api/docs/pricing (mise à jour 2026-09-24).

**Ce que ça fige pour le plan**
- Appel : `POST https://generativelanguage.googleapis.com/v1beta/interactions`, en-têtes `x-goog-api-key: $GEMINI_API_KEY` et `Content-Type: application/json`.
- Corps, verbatim de la doc :
  ```json
  {"model": "lyria-3.5", "input": "<prompt>", "response_format": {"type": "audio"}}
  ```
- Réponse synchrone, audio en base64 inline : `steps[]` où `type == "model_output"`, puis `content[]` où `type == "audio"`, champ `data` (avec `mime_type`, `sample_rate`, `channels`). Le SDK `@google/genai` expose `client.interactions.create({ model, input })` puis `interaction.output_audio.data`. Pour un script de génération ponctuel, `curl` + `jq -r ... | base64 -d` suffit, pas besoin du SDK.
- Pas de paramètre de durée, d'instrumental, de seed ni de prompt négatif. Tout passe par le prompt :
  - instrumental : « Instrumental only, no vocals. » ;
  - durée et structure : sections horodatées « [0:00 - 0:10] Intro: ... », BPM et tonalité écrits en clair ;
  - `lyria-3.5` fait « quelques minutes » au plus ; `lyria-3-clip-preview` fait toujours 30 s.
- Sortie : MP3 par défaut, 44,1 kHz stéréo. WAV possible sur `lyria-3.5` seulement.
- Prix : `lyria-3.5` 0,08 $ par morceau, `lyria-3-clip-preview` 0,04 $. Pas d'offre gratuite.
- Garde-fous : filtres de sécurité (un prompt qui nomme un artiste ou des paroles protégées est bloqué). Filigrane SynthID inaudible. Erreurs 429 et 503 à relancer avec un délai croissant.
- Budget spec (3,00 $) : 3 morceaux à 0,08 $ = 0,24 $. Marge pour une douzaine d'essais.

**Boucle sans couture (menu)**
- Le MP3 ajoute du silence de remplissage en début et fin. Selon le navigateur, `decodeAudioData` ne le retire pas : clic ou trou à la jointure (source : discussion W3C WebAudio #2505, communautaire).
- Stratégie retenue, dans l'ordre :
  1. demander du WAV à `lyria-3.5` (ou convertir et rogner une fois avec ffmpeg, puis ré-encoder en Opus/AAC pour le web) ;
  2. dans le jeu, `AudioBufferSourceNode.loop = true` avec `loopStart` / `loopEnd` posés sur des temps forts (MDN) ;
  3. si la jointure s'entend encore : deux sources et un fondu enchaîné à puissance égale (gains `cos(t·π/2)` sortant, `sin(t·π/2)` entrant), sur 0,5 à 2 s.
- Pour le morceau du replay « AGENT... HOT... » : Lyria 3.5 chante par défaut et accepte des paroles fournies. Le repli en code de la spec reste valable.

**Inconnues**
- Champ exact pour obtenir du WAV. La référence API liste `mime_type` (`audio/wav`, `audio/mp3`...) sur `AudioContent`, d'où l'hypothèse `"response_format": {"type": "audio", "mime_type": "audio/wav"}`. **À sonder à l'exécution, coût 0,08 $** (le premier vrai morceau sert de sonde).
- Forme JSON réelle d'une réponse réussie : non capturée (coûte un appel). Le premier appel du plan doit sauvegarder la réponse brute, audio tronqué, dans `assets/`.
- Latence : non documentée. Prévoir un délai d'attente long (plusieurs minutes) dans le script.
- Droits d'usage commercial de la musique : renvoi aux conditions de l'API Gemini, non lues. Le projet est une vitrine non commerciale : risque faible.

## 2. Seedream 5.0 Pro (OpenRouter)

**Échantillons capturés**
- Sonde gratuite `GET https://openrouter.ai/api/v1/images/models/bytedance-seed/seedream-5-0-pro-20260812/endpoints` (HTTP 200). Réponse, extrait :
  ```json
  {"id": "bytedance-seed/seedream-5-0-pro",
   "endpoints": [{"provider_name": "Seed",
     "supported_parameters": {
       "resolution": {"type": "enum", "values": ["1K", "2K"]},
       "aspect_ratio": {"type": "enum", "values": ["1:1","1:2","2:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","9:19.5","19.5:9","9:20","20:9","9:21","21:9","auto"]},
       "n": {"type": "range", "min": 1, "max": 1},
       "input_references": {"type": "range", "min": 0, "max": 14},
       "seed": {"type": "boolean"}},
     "supports_streaming": false,
     "pricing": [
       {"billable": "output_image", "unit": "image", "cost_usd": 0.045},
       {"billable": "output_image", "unit": "image", "cost_usd": 0.09, "variant": "high_resolution"},
       {"billable": "input_image", "unit": "image", "cost_usd": 0.003}]}]}
  ```
- Guide de Romain `docs/superpowers/idea/Seedream-5.0-Pro.md` : il concorde avec la sonde sur tous les points.

**Ce que ça fige pour le plan**
- Appel : `POST https://openrouter.ai/api/v1/images`, `Authorization: Bearer $OPENROUTER_API_KEY`.
- Corps : `{"model": "bytedance-seed/seedream-5-0-pro", "prompt": "...", "n": 1, "aspect_ratio": "...", "resolution": "1K"}`.
- Réponse : `data[0].b64_json` (base64) + `data[0].media_type`. `usage.cost` donne le coût réel en dollars : c'est la valeur à écrire dans `assets/ledger.jsonl`.
- Erreurs : `{"error": {"code", "message"}}`. 402 = crédit insuffisant, 429 = relancer, 502 = échec amont non facturé.
- Prix : 0,045 $ en 1K, 0,09 $ en 2K. Budget spec 3,00 $ : environ 30 images en 1K.
- Image Open Graph 1200×630 (ratio 1,905:1) : aucun ratio natif ne tombe juste. Demander `"aspect_ratio": "2:1"`, `"resolution": "2K"`, puis recadrer et réduire à 1200×630 avec ffmpeg (`scale` + `crop`) et exporter en JPEG de moins de 300 Ko (voir section 7).
- Texte exact dans l'image : le guide recommande la formule « a sign that reads exactly "AGENTHOT", the only text in the scene ». Pour garantir le résultat, recommandation : générer le fond sans texte, puis poser le logo avec nos vraies polices (capture d'une page HTML au format 1200×630 via Chrome DevTools). C'est gratuit et cohérent avec le design system.

**Inconnues**
- Dimensions en pixels réelles de `1K` et `2K` pour chaque ratio : « déduites par le fournisseur », non documentées. **À sonder à l'exécution, 0,045 $** (première génération, lire la taille avec `ffprobe`).

## 3. Nano Banana (MCP erom-image)

**Échantillons capturés**
- Schéma des outils chargé via ToolSearch le 2026-09-29 :
  - `nanobanana_generate` : `prompt` (obligatoire, 5 000 caractères max), `aspect_ratio` (`1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`), `resolution` (`512px`, `1K`, `2K`, `4K`, défaut `1K`), `model` (`gemini-3.1-flash-image-preview` par défaut, ou `gemini-3-pro-image-preview`), `style`, `output_dir`, `filename`. Sortie : PNG.
  - `nanobanana_edit` : `image_path` (obligatoire), `prompt` (obligatoire), plus `aspect_ratio`, `resolution`, `model`, `output_dir`, `filename`.
- Le serveur MCP (`erom-image` 0.5.0) lit `GEMINI_API_KEY` (fichier `.mcp.json` du plugin). Il ne renvoie pas le coût.
- Prix officiels (https://ai.google.dev/gemini-api/docs/pricing, mise à jour 2026-09-24) :
  - Nano Banana 2 (`gemini-3.1-flash-image-preview`) : 0,045 $ en 0,5K, 0,067 $ en 1K, 0,101 $ en 2K, 0,151 $ en 4K ;
  - Nano Banana Pro (`gemini-3-pro-image-preview`) : 0,134 $ en 1K ou 2K, 0,24 $ en 4K.

**Ce que ça fige pour le plan**
- Vignettes des 2 salles, fonds, textures : Nano Banana 2 en 1K (0,067 $). Budget spec 2,50 $ : environ 37 images.
- Le MCP ne donne pas le coût : le plan écrit dans `assets/ledger.jsonl` le coût tiré de la grille ci-dessus, selon le modèle et la résolution utilisés.
- Sortie PNG : conversion en WebP ou AVIF pour le web (ffmpeg), pour tenir le budget de 3 Mo (spec 9.2).

**Inconnues**
- Aucune qui bloque le plan.

## 4. Hyperframes 0.8.81 (cinématique)

**Sources** : lecture du plugin `~/.claude/plugins/cache/hyperframes/hyperframes/0.8.81` (noté `R`), le 2026-09-29. Environnement : Node v24.12.0 (`/usr/local/bin/node`), `~/.cache/hyperframes/chrome` déjà présent.

**Ce que ça fige pour le plan**
- Lancement : `npx --yes hyperframes@0.8.81 <commande>`, ou le lanceur du plugin `node "<plugin>/skills/hyperframes/scripts/plugin-cli.mjs" <commande>` (`R/skills/hyperframes/references/plugin-installation.md:18-24`). Node 22 minimum et ffmpeg requis. Le hook `guard-tools` bloque `npx` mais laisse passer `npx hyperframes`. `bunx` n'est pas documenté : ne pas s'y fier.
- Chrome : Hyperframes télécharge son propre `chrome-headless-shell` (version épinglée 152.0.7977.30). `hyperframes doctor` vérifie Node, ffmpeg et Chrome.
- Rendu : `hyperframes render --output intro.mp4` (H.264 + AAC 192k + `faststart`) et `hyperframes render --format webm --output intro.webm` (VP9 + Opus 128k) (`R/docs/guides/rendering.mdx:53-68`).
  - **Pas d'AV1** dans Hyperframes, pas de `--codec`.
  - Réglages : `--quality draft|standard|high` (défaut `looks` = CRF 16, trop lourd pour 6 Mo), `--crf`, `--video-bitrate`, `--fps` ; taille = `data-width` / `data-height` de la composition, donc composer en 1920×1080.
  - Pas d'encodage en deux passes.
- **Poids ≤ 6 Mo : ré-encoder soi-même avec ffmpeg.** Rendre une fois en qualité haute (MP4 intermédiaire), puis produire les deux fichiers de diffusion avec le ffmpeg 9.0.2 local, qui a `libsvtav1`, `libvpx-vp9`, `libx264` et `libopus`. Pour 25 s et 6 Mo, le débit total visé est d'environ 1,9 Mb/s (vidéo ~1,75 Mb/s + Opus 96k). Ordres de départ, à ajuster sur le vrai contenu :
  ```
  ffmpeg -i master.mp4 -c:v libsvtav1 -preset 5 -crf 38 -g 240 -pix_fmt yuv420p -c:a libopus -b:a 96k intro.webm
  ffmpeg -i master.mp4 -c:v libx264 -preset slow -b:v 1700k -pass 1 -an -f null /dev/null
  ffmpeg -i master.mp4 -c:v libx264 -preset slow -b:v 1700k -pass 2 -c:a aac -b:a 96k -movflags +faststart intro.mp4
  ```
  L'AV1 en WebM est lisible sur Chrome, Firefox et Safari récent. Le MP4 H.264 sert de repli (spec 4.2).
- **Images du jeu : les enregistrer à part.** `hyperframes capture` n'est pas un enregistreur d'écran : il transforme un site en composants (`R/packages/cli/src/commands/capture.ts:40-44`). Et le rendu Hyperframes avance image par image par recherche temporelle (pas de `requestAnimationFrame`), donc la boucle vivante du jeu ne peut pas tourner dedans (`R/docs/concepts/determinism.mdx:12-54`).
  - Recommandation : un mode debug du jeu (ex. `?record=1`) qui enregistre le canvas avec `canvas.captureStream(60)` + `MediaRecorder` pendant un replay, et télécharge un `.webm`. C'est natif, sans outil externe, et le replay existe déjà (spec 5.8).
  - Alternative : enregistrement d'écran macOS (Cmd+Maj+5), puis découpe ffmpeg.
- Montage dans la composition :
  - séquence du jeu : `<video id="clip1" src="assets/replay.webm" data-start="4" data-duration="6" data-media-start="12" data-track-index="0" muted playsinline>`. `data-playback-rate` (0,1 à 10) pour ralentir. Pas de `class="clip"` sur les vidéos, jamais de `play()` à la main, un `id` obligatoire (`R/skills/hyperframes-core/references/variables-and-media.md:69-103`) ;
  - musique : `<audio id="music" src="assets/intro.mp3" data-start="0" data-duration="25" data-track-index="10">`. Sans `id`, le rendu est muet. Fondus par `data-automation` (courbe de volume) (`R/skills/hyperframes-core/references/creator-editing-recipes.md:328-343`) ;
  - cartes de texte : composants du registre (`hyperframes add headline-slam`, `kinetic-type-swap`, `rgb-glitch-text`, `char-slam-explode`...), recherche par `hyperframes catalog --query "..."`. Nos polices auto-hébergées se chargent dans la composition comme dans le jeu.
- Au moment d'écrire la tâche, passer par la skill `hyperframes:hyperframes` (point d'entrée obligatoire du plugin), qui route vers `general-video`.

**Inconnues**
- Poids réel après ré-encodage : dépend du contenu (les éclats et les balles se compressent mal). **À mesurer à l'exécution, gratuit** : `ffprobe` sur la sortie, puis ajuster `-crf` ou `-b:v`.
- `canvas.captureStream` avec le `WebGPURenderer` : à vérifier au premier essai. Si ça ne marche pas, forcer `?renderer=webgl` pendant l'enregistrement (la capture WebGL2 est sûre).

## 5. Mise en ligne

**Sources** (doc officielle, dates de mise à jour lues le 2026-09-29)
- Vercel : https://vercel.com/docs/limits/fair-use-guidelines (2026-09-14), https://vercel.com/docs/caching/cache-control-headers (2026-09-14), https://vercel.com/docs/frameworks/frontend/vite (2026-08-26).
- Cloudflare : https://developers.cloudflare.com/workers/static-assets/headers/, https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/, https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/.
- GitHub Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits, discussion GitHub #54257 (2023-05-02).

**Les deux options sérieuses**
- **Vercel (Hobby).** Déploiement par `vercel` ou par Git, URL de prévisualisation, en-têtes dans `vercel.json`. Limites : 100 Go de transfert par mois, **usage non commercial seulement** (une vitrine perso sans pub ni vente est dans les clous).
- **Cloudflare (Workers static assets, recommandé par Cloudflare pour un nouveau site à la place de Pages).** Transfert statique **gratuit et illimité**, fichiers jusqu'à 25 Mio, en-têtes dans un fichier `_headers`. Demande `wrangler` (absent du Mac) et un peu plus de configuration.
- GitHub Pages est écarté : pas d'en-têtes de cache personnalisés (cache fixé à 10 min), donc la vidéo et les musiques se revalident sans cesse.

**Ce que ça fige pour le plan**
- Build : `vite build` → `dist/`. Préciser `buildCommand` et `outputDirectory` dans `vercel.json` (les valeurs par défaut du preset Vite ne sont pas écrites dans la doc).
- Cache long pour tout ce qui porte un hash ou ne change jamais :
  ```json
  {"headers": [
    {"source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]}
  ]}
  ```
  Équivalent Cloudflare `_headers` :
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- Par défaut, les deux hébergeurs servent `public, max-age=0, must-revalidate`. La vidéo, les musiques et les polices doivent donc avoir un nom haché (placées dans `src/` et importées par Vite, ou nommées à la main avec un hash) pour profiter du cache long.
- Domaine (Vercel) : Project, Settings, Domains, Add Domain, puis enregistrement A (apex) ou CNAME (sous-domaine).

**Inconnues**
- Réponse `206 Partial Content` aux requêtes Range sur la vidéo, chez les deux hébergeurs : non documentée. Sans elle, Safari lit mal une vidéo. **À sonder à l'exécution, gratuit** : après un premier déploiement de test, `curl -sI -H "Range: bytes=0-99" <url-video>` doit renvoyer `206` et `Content-Range`.

## 6. Polices

**Sources** : dépôt `github.com/google/fonts`, dossiers `ofl/` (lus le 2026-09-29), FAQ OFL (https://openfontlicense.org/ofl-faq/), docstring de `fontTools.subset`.

**Ce que ça fige pour le plan**
- Les 3 polices sont sous **SIL OFL 1.1, sans nom de police réservé**. Auto-hébergement, sous-ensemble et conversion woff2 permis, sans renommage. Obligation : livrer le texte `OFL.txt` et la ligne de copyright avec les fichiers (un fichier `public/fonts/LICENSES.txt` suffit).
- Fichiers sources :

| Police | Fichier | Graisses utiles |
| :--- | :--- | :--- |
| Big Shoulders Display | `ofl/bigshouldersdisplay/BigShouldersDisplay[wght].ttf` (variable, wght 100 à 900) | 800, 900 |
| Chakra Petch | `ofl/chakrapetch/ChakraPetch-Medium.ttf`, `ChakraPetch-SemiBold.ttf` (statiques) | 500, 600 |
| Martian Mono | `ofl/martianmono/MartianMono[wdth,wght].ttf` (variable, wdth 75 à 112,5, wght 100 à 800) | 300, 400 |

- Note : Google a fusionné Big Shoulders en une famille « Big Shoulders » avec un axe `opsz` (10 à 72), ajoutée le 2025-02-06. L'ancien fichier Display reste disponible et suffit pour l'affichage.
- Chaîne de fabrication (non exécutée, à valider au premier lancement) :
  ```
  # figer une graisse d'une police variable
  uvx --from fonttools fonttools varLib.instancer "BigShouldersDisplay[wght].ttf" wght=900 -o BSD-900.ttf
  # sous-ensemble latin + français, en woff2
  uvx --from "fonttools[woff]" pyftsubset BSD-900.ttf \
    --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201F,U+2022,U+2026,U+2027,U+20AC,U+2122,U+2212" \
    --flavor=woff2 --layout-features='*' --no-hinting --output-file=BSD-900.woff2
  ```
  `U+2027` couvre le séparateur `‧` de la ligne des crédits (spec 4.3). L'extra `woff` apporte `brotli`.
- Pour Martian Mono, option plus compacte : garder un seul fichier variable limité à `wght=300:400` avec `wdth=100` figé (vérifier que 100 est la valeur par défaut de l'axe).

**Inconnues**
- Aucune qui bloque le plan.

## 7. Open Graph et Twitter Card

**Sources** : https://ogp.me/, https://developers.facebook.com/docs/sharing/webmasters/ et `/images`, https://www.linkedin.com/help/linkedin/answer/a521928, doc WhatsApp de Meta (link previews), https://api.slack.com/robots, PR de doc Discord #8606 (brouillon). La doc de X renvoie 402 : non lue.

**Ce que ça fige pour le plan**
- Balises à mettre dans `index.html`, dans les 300 premiers Ko du HTML (règle WhatsApp) :
  ```html
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://<domaine>/">
  <meta property="og:title" content="AGENTHOT">
  <meta property="og:description" content="<80 caractères au plus (WhatsApp)>">
  <meta property="og:image" content="https://<domaine>/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="...">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="AGENTHOT">
  <meta name="twitter:description" content="...">
  <meta name="twitter:image" content="https://<domaine>/og.jpg">
  ```
- Image : une seule, **JPEG 1200×630, moins de 300 Ko**, en URL absolue HTTPS. Ça couvre Facebook (8 Mo max), LinkedIn (5 Mo), WhatsApp (moins de 600 Ko d'après Meta, 300 Ko d'après des sources tierces), X, Discord, Bluesky et iMessage.
- L'URL de l'image est mise en cache par les plateformes : toute nouvelle version change de nom (`og-v2.jpg`).
- Tests : Facebook Sharing Debugger, LinkedIn Post Inspector, puis collage du lien dans Slack, Discord, WhatsApp et iMessage (le validateur de cartes de X n'existe plus depuis 2022).

**Inconnues**
- Détails X, Bluesky et iMessage connus seulement par des sources secondaires. Sans impact : le JPEG ci-dessus respecte la limite la plus stricte connue.
- L'URL de domaine dépend de la décision d'hébergement.

## 8. Crédits : tokens et coût API

**Échantillon capturé** (transcripts `~/.claude/projects/-Users-recarnot-dev-claudehot-videogame/`, lus le 2026-09-29) :
```json
{"model":"claude-opus-5-5","id":"msg_011CfXf5i83aGSJnQR4sM5b4",
 "usage":{"input_tokens":2,"cache_creation_input_tokens":17717,"cache_read_input_tokens":28733,"output_tokens":104,
  "output_tokens_details":{"thinking_tokens":13},
  "cache_creation":{"ephemeral_1h_input_tokens":17717,"ephemeral_5m_input_tokens":0}, "service_tier":"standard","speed":"standard"}}
```

**Pièges trouvés**
- Une réponse du modèle est écrite sur **plusieurs lignes** (une par bloc de contenu) avec le même `message.id` : 695 lignes en double au moment de la mesure. Il faut dédoublonner par `message.id`, sinon le total est gonflé.
- Les sous-agents écrivent dans `<session>/subagents/*.jsonl` : il faut les inclure (recherche récursive).
- Le cache se paie à deux tarifs selon sa durée (`ephemeral_5m` et `ephemeral_1h`) : il faut les séparer.
- Les lignes `"model": "<synthetic>"` ne sont pas facturées : à exclure.
- Les tokens de réflexion sont déjà inclus dans `output_tokens`.

**Grille de prix** (https://platform.claude.com/docs/en/about-claude/pricing, lue le 2026-09-29), en dollars par million de tokens :

| Modèle | Entrée | Cache écrit 5 min | Cache écrit 1 h | Cache lu | Sortie |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Claude Opus 5.5 | 4 | 5 | 8 | 0,20 | 20 |
| Claude Sonnet 5.5 | 2 | 2,50 | 4 | 0,20 | 10 |

**Mesure du jour** (script ci-dessous, 2026-09-29 vers 13 h 35, chantier en cours) :
```
claude-sonnet-5-5 msgs=292 in=596 cw5m=2116776 cw1h=68663 cr=24872693 out=325790 total=27384518 cost=$13.80
claude-opus-5-5   msgs=322 in=646 cw5m=476050  cw1h=982190 cr=89534032 out=418102 total=91411020 cost=$36.51
TOTAL tokens=118795538 cost=$50.31
```
C'est un coût **équivalent API** : Romain paie un abonnement, pas ce montant. La ligne des crédits doit le dire (ex. « coût API estimé »).

**Ce que ça fige pour le plan**
- Un script `scripts/count-tokens.sh` (texte complet en annexe), lancé à la fin du chantier avec `zsh scripts/count-tokens.sh ~/.claude/projects/*claudehot*`. Il sort le total des tokens et le coût, à copier en dur dans les crédits.
- Les modèles absents de la grille (ex. Fable, Haiku) sont signalés par le script au lieu d'être comptés à zéro : ajouter leur ligne de prix si une session en utilise.

**Inconnues**
- Les sessions qui travaillent dans un autre dossier (un worktree hors du dépôt) ont un autre dossier de transcripts. Le motif `*claudehot*` les attrape seulement si leur chemin contient ce mot.

## 9. Détection mobile

**Sources** : MDN `any-pointer`, W3C Media Queries 4 (section interaction), WebKit bug 209292 (corrigé le 2020-10-06), caniuse Pointer Lock.

**Constats**
- iPhone, Android, iPad sans trackpad : `pointer: coarse`, `any-pointer: fine` faux → écran « Joue sur ordi ». Correct.
- PC portable tactile avec trackpad : le pointeur principal est fin → le jeu se lance. Correct.
- **iPad avec trackpad ou Magic Keyboard** : Safari répond `any-pointer: fine` vrai. La requête de la spec laisse donc passer l'iPad vers le jeu. Mais **Safari iOS et iPadOS n'a pas de Pointer Lock, dans aucune version** (caniuse jusqu'à 27.2). Or la salle en dépend (spec 4.4). Résultat : un jeu qui démarre et ne se contrôle pas.

**Ce que ça fige pour le plan**
```ts
const isTouchOnly = matchMedia('(pointer: coarse) and (not (any-pointer: fine))').matches;
const hasPointerLock = 'requestPointerLock' in Element.prototype;
const showPlayOnDesktop = isTouchOnly || !hasPointerLock;
```
- AC-12 gagne un cas de test : émulation iPad dans DevTools, et un contrôle du repli quand `requestPointerLock` est absent.

**Inconnues**
- Comportement exact sur un iPad réel en iPadOS 26 : stable depuis 2020 d'après WebKit, mais pas re-testé sur matériel. Test manuel si Romain a un iPad.

## Décisions pour Romain

1. **Hébergeur.** Vercel : le plus simple, déjà outillé sur le Mac, mais usage non commercial et 100 Go par mois. Cloudflare : transfert gratuit et illimité, mais un outil de plus (`wrangler`) à installer. **Ma recommandation : Vercel**, parce que la vitrine n'est pas commerciale et que 100 Go représentent des milliers de visites complètes (environ 12 Mo par visite avec cinématique et musiques).
2. **Texte de l'image de partage.** Seedream dessine le mot « AGENTHOT » (rapide, rendu à vérifier) ou fond Seedream sans texte + logo posé avec nos polices (exact, gratuit). **Ma recommandation : fond Seedream + logo posé**, pour que l'aperçu colle au design system.
3. **Coût affiché dans les crédits.** Afficher le coût équivalent API (environ 50 $ aujourd'hui, en hausse d'ici la fin) avec la mention « coût API estimé », ou seulement le nombre de tokens. **Ma recommandation : les deux, avec la mention**, c'est l'argument de la vitrine.

## Annexe : script de comptage des tokens

À copier tel quel dans `scripts/count-tokens.sh`. Testé le 2026-09-29 (sortie en section 8).

```zsh
#!/bin/zsh
# Sonde : tokens et coût API des sessions du projet, dédoublonnés par message.id
# Usage : count-tokens.sh <dossier projet ~/.claude/projects/...> [...]
command find "$@" -name '*.jsonl' -not -path '*/memory/*' -print0 \
  | xargs -0 cat \
  | jq -r 'select(.type=="assistant" and .message.usage!=null and .message.model!="<synthetic>") | [.message.id, .message.model, .message.usage.input_tokens, (.message.usage.cache_creation.ephemeral_5m_input_tokens // 0), (.message.usage.cache_creation.ephemeral_1h_input_tokens // 0), .message.usage.cache_read_input_tokens, .message.usage.output_tokens] | @tsv' \
  | awk -F'\t' '
    BEGIN {
      # Prix $/MTok : input, cache write 5m, cache write 1h, cache read, output
      # Source : platform.claude.com/docs/en/about-claude/pricing (lu le 2026-09-29)
      P["claude-opus-5-5"]="4 5 8 0.20 20"
      P["claude-sonnet-5-5"]="2 2.50 4 0.20 10"
    }
    { k=$1
      if (!(k in M)) { M[k]=$2; I[k]=$3; C5[k]=$4; C1[k]=$5; R[k]=$6; O[k]=$7 }
      else if ($7 > O[k]) O[k]=$7 }
    END {
      for (k in M) { m=M[k]; n[m]++; i[m]+=I[k]; c5[m]+=C5[k]; c1[m]+=C1[k]; r[m]+=R[k]; o[m]+=O[k] }
      for (m in n) {
        if (!(m in P)) { printf "%s : pas de prix connu (%d messages)\n", m, n[m]; continue }
        split(P[m], p, " ")
        cost=(i[m]*p[1] + c5[m]*p[2] + c1[m]*p[3] + r[m]*p[4] + o[m]*p[5]) / 1e6
        tok=i[m]+c5[m]+c1[m]+r[m]+o[m]
        printf "%s msgs=%d in=%d cw5m=%d cw1h=%d cr=%d out=%d total=%d cost=$%.2f\n", m, n[m], i[m], c5[m], c1[m], r[m], o[m], tok, cost
        T+=cost; TT+=tok
      }
      printf "TOTAL tokens=%d cost=$%.2f\n", TT, T
    }'
```
