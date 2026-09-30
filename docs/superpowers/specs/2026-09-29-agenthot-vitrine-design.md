# AGENTHOT, vitrine : design

Intent record : `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md`.
Sources de départ : `docs/superpowers/idea/*.md`. En cas de conflit, cette spec prime.

## 1. Objet

AGENTHOT est un FPS web où le temps n'avance que quand le joueur bouge. C'est une vitrine technique de Claude Opus 5.5 : une salle parfaite, jouable en ligne en 2 secondes, qui doit bluffer quiconque clique sur le lien.

Ce chantier livre :

- le parcours complet : chargement → cinématique → menu → salle 1 → replay ;
- la salle 1, jouable et finie ;
- une architecture où la salle 2 s'ajoute par un fichier de données, sans toucher au moteur.

Hors chantier : salle 2 (katana, fusil à pompe, deux étages), Hotswitch, vitres qui éclatent, terminal méta, campagne, version mobile jouable.

## 2. Plateformes et contraintes

- **Cible :** ordinateur, clavier + souris. Chrome, Safari (macOS 26+), Firefox, versions récentes.
- **Mobile :** détecté par `matchMedia('(pointer: coarse)')` sans pointeur fin, **ou** absence du verrouillage de la souris (`!('requestPointerLock' in Element.prototype)`, cas de Safari iPad avec trackpad, source : brief plan 3). Affiche l'écran « Joue sur ordi » (section 4.6).
- **Rendu :** WebGPU si disponible, sinon WebGL2. Vérifié le 2026-09-29 : WebGPU est actif par défaut sur Chrome desktop, Safari 26 et Firefox Windows ; Firefox macOS seulement sur Apple Silicon. Le repli WebGL2 est donc obligatoire.
- **Langue du code :** identifiants en anglais, commentaires en français.

## 3. Stack

| Rôle | Choix | Raison |
| :--- | :--- | :--- |
| Build, runtime, tests | Vite + TypeScript strict, `bun`, `bun test` | Rapide, typé, sans npm. |
| Rendu | Three.js r186 (version épinglée), `WebGPURenderer` + TSL | Repli WebGL2 automatique documenté. `RenderPipeline`, `BloomNode` et `SobelOperatorNode` sont natifs. |
| Physique | Maison, dans `sim` | Le monde est fait de boîtes et d'un sol. Balles, objets lancés et éclats n'ont pas besoin d'un moteur généraliste. Pas de Rapier. |
| Audio | Web Audio API native | Synthèse procédurale, filtres asservis au temps. |
| UI | HTML/CSS + TypeScript, sans framework | Quatre écrans de menu ne justifient pas React. Le motion design est fait en CSS et en Web Animations API. |
| Polices | Big Shoulders Display, Chakra Petch, Martian Mono | Auto-hébergées en woff2 sous-ensemble, pour la vitesse. |

Versions et API à revérifier au moment du plan (brief `pre-plan-research`) : Three.js r186 (`RenderPipeline`, nœud de contour), Lyria 3.5 (`lyria-3.5`, 0,08 $ par morceau, instrumental par prompt, sortie MP3 ou WAV), Seedream 5.0 Pro via OpenRouter, Hyperframes 0.8.81.

## 4. Parcours et écrans

### 4.1 Chargement

- Fond `void`. Le logo AGENTHOT se construit en facettes orange, avec un motion design léger.
- Précharge les polices, le début de la cinématique et la boucle du menu.
- Durée : au moins 1,2 s, même si tout est prêt, pour poser l'univers.
- Se termine sur « APPUIE SUR UNE TOUCHE ». Ce geste débloque l'`AudioContext` et le son de la cinématique.

### 4.2 Cinématique

- Vidéo Hyperframes de 20 à 30 s, 1920×1080. Hyperframes sort du VP9 ou du H.264 sans passe double : la version finale est ré-encodée avec ffmpeg (libsvtav1) en WebM AV1, avec repli MP4 H.264. Cible : 6 Mo au plus, lue en flux.
- Passable par n'importe quelle touche ou un clic.
- Pendant la lecture, le jeu (moteur, salle 1, musique en jeu) se charge en arrière-plan.
- Jouée à la première visite seulement (drapeau `introSeen` dans `localStorage`). Ensuite, l'utilisateur arrive directement au menu. Le bouton « Intro » du menu la rejoue.
- Fabriquée en dernier, avec de vraies séquences capturées dans le jeu, des cartes de texte et un morceau Lyria. Les séquences sont enregistrées par le jeu lui-même : un mode `?record=1` capture le canvas (`captureStream` + `MediaRecorder`) pendant un replay (`hyperframes capture` n'enregistre pas le jeu).

### 4.3 Menu

- **Fond :** la salle 1 en 3D, figée à 3 % du temps. Balles suspendues, ennemis en pleine action, caméra qui dérive lentement.
- **Premier plan :** logo en style Monolithe et entrées de menu. Motion design complexe mais maîtrisé.
- **Son :** boucle musicale Lyria et sons de survol et de clic (synthétisés).
- **Entrées :**
  - **Jouer** : lance la salle 1.
  - **Salles** : panneau Encre avec 2 cartes. Salle 1 jouable. Salle 2 verrouillée, « BIENTÔT ». Vignettes générées avec Nano Banana.
  - **Paramètres** : panneau Encre (section 4.5).
  - **Crédits** : panneau Encre. Ligne exacte : `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/XXXXXX`. En dessous : nombre de tokens et coût API estimé (décidé le 2026-09-29), avec des valeurs fictives jusqu'à la fin du chantier. Le comptage dédoublonne les lignes des transcripts par `message.id` (script en annexe du brief plan 3).
  - **Intro** : rejoue la cinématique.
- Navigation au clavier (flèches + Entrée) et à la souris.

### 4.4 Salle

- **Entrée :** clic sur Jouer → pointer lock → le joueur contrôle en 1 s au plus.
- **Pause :** Échap libère le pointer lock (le navigateur l'impose). Panneau Encre : Reprendre, Recommencer, Menu. Reprendre demande un clic, là aussi imposé par le navigateur.
- **Mort :** l'image se fige, teinte orange, son de verre. Texte discret « R ‧ RECOMMENCER ». `R` ou un clic relance la salle en moins de 50 ms, sans rechargement de ressources.
- **Victoire :** replay à vitesse réelle (section 5.8), typo Monolithe « AGENT » / « HOT » en alternance sur le temps fort de la musique. Ensuite : Rejouer, Revoir le replay, Menu.
- **Réticule :** un petit point. Il fait une rotation de 180° quand une nouvelle balle est chambrée. Aucune jauge, aucun compteur.

### 4.5 Paramètres

Persistés dans `localStorage` et appliqués à chaud.

| Réglage | Plage | Défaut |
| :--- | :--- | :--- |
| Sensibilité souris | 0,1 à 3,0 | 1,0 |
| Inverser l'axe Y | oui / non | non |
| Champ de vision | 70° à 110° | 90° |
| Volume musique | 0 à 100 | 70 |
| Volume effets | 0 à 100 | 90 |
| Qualité | auto / haute / basse | auto |

### 4.6 Mobile

Écran « Joue sur ordi » dans le style Encre, avec la cinématique en lecture et un bouton « Copier le lien ». Aucune initialisation du moteur.

### 4.7 Partage

Balises Open Graph et Twitter Card, avec une image d'aperçu 1200×630 : fond généré avec Seedream, logo et texte posés ensuite avec nos polices (décidé le 2026-09-29 : le texte reste net et exact). C'est la première chose que voit quelqu'un à qui l'on partage le lien.

## 5. Gameplay de la salle 1

Toutes les durées de gameplay sont en **temps de simulation**, sauf mention contraire.

### 5.1 Le temps

À chaque image, `timeScale` (entre 0,03 et 1) est calculé à partir de trois composantes :

- `moveAlpha = |v_joueur| / v_max` ;
- `lookAlpha = min(1, vitesse souris / lookThreshold) × 0,10`, où la vitesse souris est `(|dx| + |dy|)` par seconde réelle et `lookThreshold` = 800 px/s (0,15 au départ, baissé à 0,10 après le test de Romain au trackpad) ;
- `actionAlpha` passe à 1 au tir, au coup ou au lancer, puis décroît exponentiellement en 0,2 s de **temps réel**.

Calcul :

- `raw = clamp(0,03, 1, moveAlpha + lookAlpha + actionAlpha)` ;
- pendant la phase montante d'un saut, `raw = 1` ;
- lissage asymétrique : `timeScale += (raw − timeScale) × (1 − e^(−λ × dtReal))`, avec λ = 5 quand le temps accélère et λ = 12 quand il ralentit. Montée douce pour que les petits pas coûtent peu, arrêt net. Réglé le 2026-09-29 : le temps unique à λ = 12 était « trop nerveux ».

Le pas de simulation vaut `simDt = dtReal × timeScale`, plafonné à 1/60 s. Les balles utilisent une détection de collision continue (section 5.3), donc un pas variable est sûr.

### 5.2 Joueur et commandes

- **Déplacement :** `ZQSD` ou `WASD` (détection par `KeyboardEvent.code`), 4,2 m/s, sans inertie notable.
- **Saut :** `Espace`, 5,5 m/s vers le haut.
- **Accroupi :** `C`. Les yeux passent de 1,70 m à 0,85 m.
- **Clic gauche :** tirer. Mains vides : coup de poing, portée 1,6 m.
- **Clic droit :** lancer l'objet tenu, à 22 m/s.
- **`E` :** ramasser à 2 m au plus. Une arme en vol est aussi captée automatiquement au contact du joueur.
- **Collision :** capsule de rayon 0,3 m. Une seule touche (balle ou coup ennemi) et le joueur meurt.
- **Départ :** pistolet en main, 4 balles. Avec 5 ennemis, le joueur doit forcément lancer, frapper ou rattraper au moins une fois.

### 5.3 Pistolet et balles

- 4 balles, 1 tir toutes les 0,45 s, dispersion nulle.
- Chargeur vide : clic sec, pas de recul, pas de balle.
- Pas de hitscan. Une balle est une entité simulée :
  - vitesse 45 m/s, rayon 0,04 m ;
  - traînée orange de 2 à 4 m, dans le sens inverse de la vitesse.
- **Détection de collision continue :** balayage du segment entre la position précédente et la position actuelle, contre les boîtes du décor, les capsules des ennemis et celle du joueur. L'impact est résolu au premier contact sur le segment.
- Balles pré-allouées dans un pool.

### 5.4 Objets lancés, désarmement, capture

- **Arme lancée :** vol balistique (gravité 9,81 m/s²), rotation sur elle-même.
  - Touche un ennemi : il vacille 1,5 s, son tir en cours est annulé et il lâche son arme. L'arme lancée tombe aux pieds de l'ennemi.
  - Touche le décor : elle rebondit une fois, puis tombe au sol.
- **Arme lâchée par un ennemi :** éjectée vers le haut et vers celui qui l'a frappé, en arc lisible au ralenti. Captable en vol.
- **Arme captée ou ramassée :** prête à tirer tout de suite, et elle garde ses balles. Une arme d'ennemi est pleine ; une arme vidée par le joueur reste vide (sinon, munitions infinies).
- **Deux armes à portée en même temps :** le joueur attrape la plus chargée.

### 5.5 Coup de poing

- Ennemi armé non vacillant : il vacille 1,5 s et lâche son arme.
- Ennemi déjà vacillant ou désarmé : il éclate.

### 5.6 Ennemis

- **Corps :** 8 segments rigides facettés (tête, torse, 2 bras, 2 avant-bras, 2 jambes), générés en code en low-poly avec flat shading.
- **Animation :** procédurale. Cycle de marche, levée du bras de tir, recul, vacillement.
- **Collision :** capsule de rayon 0,3 m.
- **Vitesse de marche :** 3,2 m/s.
- **Déplacement :** navigation sur un graphe de points défini dans le fichier de salle.
- **États :**
  - `Approach` : avance vers le joueur ;
  - `Aim` : trait de visée orange vers la position prédite du joueur, pendant 0,4 s ;
  - `Fire` : tire une balle ;
  - `Cooldown` : attend 0,9 s entre deux tirs, puis revient à `Approach` ou `Aim` ;
  - `Stagger` : vacille 1,5 s ;
  - `Dead`.
- **Règle absolue :** aucune balle ennemie ne part sans 0,4 s de trait de visée visible juste avant.
- **Portée de tir :** 8 m maximum, avec ligne de vue dégagée (lancer de rayon contre le décor).
- **Mêlée :** un ennemi sans arme fonce vers le joueur et frappe à 1,2 m.
- **Mort :** une balle, ou un coup de poing sur un ennemi vacillant ou désarmé.
- **Chargeurs :** les ennemis ont des balles illimitées. Le chargeur de 4 ne concerne que le joueur. Une arme d'ennemi ramassée est pleine ; une arme vidée par le joueur reste vide (voir 5.4).

### 5.7 Déroulé de la salle 1

- **Lieu :** une salle serveurs d'environ 24 × 16 m. Rangées de baies blanches de 2,2 m de haut, qui servent d'abri et forment des allées de tir. Un ascenseur au fond. Une passerelle latérale à 3,5 m avec garde-corps, inaccessible au joueur. Plafond fermé à 7,5 m : une dalle lumineuse et des panneaux suspendus. Sol en dalles de 60 cm. Étagères garnies sur le mur du fond, de part et d'autre de l'ascenseur. Bandeau lumineux à mi-hauteur des murs. (Révisé le 2026-09-30, rendu validé en jeu par Romain ; avant : chemins de câbles gris au plafond, vide bleu nuit au-delà.)
- **Au départ :** 2 ennemis armés dans les allées, 1 ennemi armé sur la passerelle.
- **Quand il reste 2 ennemis :** 2 ennemis sortent de 2 baies en les faisant exploser (éclats blancs et gris). L'un est armé, l'autre est en mêlée.
- **Victoire :** les 5 ennemis éclatés.
- **Réglage :** l'agencement exact se règle pendant la phase « gris ». La planche Nano Banana sert d'inspiration, pas de cible.
- **Difficulté :** un joueur moyen gagne en moins de 5 essais.

### 5.8 Éclatement et replay

- **Éclatement :**
  - l'ennemi touché est masqué ;
  - 24 à 48 éclats par ennemi, issus de ses segments ;
  - vitesse de chaque éclat = `vImpact × 0,6` (plafonné à 5 m/s) `+ direction aléatoire × force`. Plafond décidé par Romain le 2026-09-29 : sans lui, une balle à 45 m/s projetait les éclats à 27 m/s, hors de la salle et à travers les murs ;
  - gravité, un rebond au sol (ou sur le dessus d'une boîte : passerelle, baie), puis ils se figent ; ils rebondissent aussi sur les murs et les baies au lieu de les traverser ;
  - dessinés avec un `InstancedMesh` pré-alloué ;
  - le temps les ralentit comme le reste.
- **Mort du joueur :** même effet, vu de l'intérieur (éclats vers la caméra).
- **Enregistrement :**
  - échantillons à 60 Hz de **temps de simulation**, dans des `Float32Array` pré-allouées ;
  - contenu d'un échantillon : pose de la caméra, pose des ennemis et de leurs segments, balles, objets en vol, événements (tir, impact, éclatement) ;
  - pas de simulation déterministe : le replay relit des positions, il ne rejoue pas la simulation.
- **Lecture :** à vitesse réelle, c'est-à-dire 1 seconde de temps de simulation = 1 seconde à l'écran. Interpolation entre échantillons. Les éclats sont relancés à partir des événements, avec une graine fixe.

## 6. Direction artistique

### 6.1 Palette (tokens partagés entre le jeu et l'UI)

| Token | Valeur | Rôle |
| :--- | :--- | :--- |
| `void` | `#0D111B` | Vide autour du monde, fonds d'UI. |
| `void-2` | `#141A28` | Ombres portées des panneaux. |
| `world` | `#ECEBE7` | Décor, panneaux Encre. |
| `world-2` | `#C9CBD0` | Décor secondaire, texte UI secondaire. |
| `ink` | `#0A0C10` | Armes, mains du joueur, texte sur panneaux. |
| `threat` | `#D97757` | Ennemis, balles, traînées, visée. Rien d'autre. |
| `threat-hot` | `#FF9D73` | Cœur lumineux des balles, arêtes des ennemis. |
| `muted` | `#7C8394` | Petits textes d'UI. |

**Règle :** `threat` et `threat-hot` ne s'appliquent qu'aux entités de menace. Câbles, lumières, voyants et décor n'en utilisent jamais.

**Blancs du décor (ajout du 2026-09-30) :** la salle emploie des blancs et gris clairs hors tokens, réglés à l'œil dans `src/render/decor.ts` et `world-renderer.ts` : joints du sol `#AEB2BA`, baies et étagères `#F1F1EE`, panneaux du plafond `#F4F4F2`, lumière venue du sol `#F2F2F2`, dalle et bandeaux lumineux en blanc pur. Aucun n'est orange.

### 6.2 Rendu

- **Décor :** blanc, lumière d'ambiance forte, ombres portées douces et claires.
- **Volumes :** pas de contour. L'occlusion ambiante (ombre des coins, GTAO débruité, via `RenderPipeline` et TSL) dessine les volumes. Elle ne touche ni la menace, ni l'arme du joueur. (Révisé le 2026-09-30 ; avant : contours fins à l'encre, par détection de bords sur la profondeur et les normales.)
- **Ennemis :**
  - `threat` émissif léger, facettes latérales plus sombres ;
  - glow par bloom **limité** aux matériaux de menace (masque dédié) ;
  - aucun autre élément ne reçoit de glow.
- **Armes et mains :** noir mat `ink`, avec un liseré clair (fresnel) pour rester lisibles devant le vide sombre.
- **Mort :** teinte orange plein écran et légère aberration chromatique, uniquement à ce moment-là.

### 6.3 Design system de l'UI (mix « Monolithe » + « Encre »)

- **Monolithe :** logo, titres, écran de replay.
  - Big Shoulders Display 800/900, capitales, interlignage serré.
  - Au survol : l'entrée glisse de 10 px et un losange `threat` s'allume à sa gauche.
  - Éclats orange flottants au ralenti autour du logo.
- **Encre :** panneaux (Salles, Paramètres, Crédits, Pause, Mort, écran mobile).
  - Plaques `world` cernées d'un trait `ink` de 2 px, coins coupés à 45° (`clip-path`), filet intérieur à 25 % d'opacité, ombre décalée `void-2` (portée par un pseudo-élément, car `clip-path` coupe `box-shadow`).
  - Boutons : cadre `ink` de 1,5 px, coin coupé. Au survol, fond `ink` et texte `world`. Élément actif : filet `threat` de 4 px à gauche.
  - Police Chakra Petch 500/600, capitales espacées.
- **Petits textes et libellés :** Martian Mono 300/400, 11 px au minimum.
- **Mouvement :** transitions de 150 à 250 ms, courbe `cubic-bezier(.2,.9,.2,1)`. Les entrées d'écran sont orchestrées (décalages en cascade). Pas de rebond.
- **Référence visuelle :** `.superpowers/brainstorm/*/content/design-system-directions.html`, directions B et C.

## 7. Son et musique

### 7.1 Graphe audio

```
sources SFX ──► panner HRTF ──► bus SFX (passe-bas asservi) ──┐
musique en jeu ─► passe-bas asservi + playbackRate ────────────┼─► compresseur ─► destination
musique menu / replay ─────────────────────────────────────────┘
```

- **Passe-bas SFX :** `fréquence = 300 + 19 700 × timeScale²` Hz.
- **Débit de lecture des SFX :** `clamp(0,2, 1, timeScale)`.
- **Musique en jeu :**
  - débit `clamp(0,5, 1, timeScale)`, avec correction de hauteur désactivée : elle descend dans le grave ;
  - même passe-bas que les SFX ;
  - valeurs de départ, à régler à l'oreille.

### 7.2 Musique (Lyria 3.5)

- **Boucle menu :** tech, punchy, instrumentale. La jointure est masquée par un fondu enchaîné en Web Audio si elle s'entend.
- **Morceau en jeu :** tendu, pulsé, instrumental, pensé pour être ralenti.
- **Morceau de replay :** tempo lourd, avec le cri « AGENT... HOT... » en boucle.
  - Repli si Lyria ne prononce pas bien : musique instrumentale Lyria + voix synthétisée en code (formants, vocodeur, bitcrush).

### 7.3 Bruitages (100 % synthétisés, 0 fichier)

- **Tir :** trois couches superposées :
  - transitoire de 15 ms (bruit filtré) ;
  - coup grave entre 100 et 200 Hz ;
  - résonance métallique aiguë.
- **Clic à vide :** double clic sec « tch-k », sans écho.
- **Frôlement :** une balle ennemie passe à moins de 0,6 m de la tête sans toucher. Bruit blanc filtré autour de 3,2 kHz, spatialisé à gauche ou à droite, avec effet Doppler.
- **Éclatement :** claquement de cristal, puis cascade de tintements.
- **Menu :** sons de survol, de validation et de retour.
- **Ambiance en jeu :** drone à 45 Hz, modulé à 1,5 Hz, qui monte quand le joueur s'immobilise.

## 8. Assets générés et budgets

| Outil | Usage | Budget |
| :--- | :--- | :--- |
| Seedream 5.0 Pro (OpenRouter) | Image d'aperçu du lien, écran titre, cartes de texte de la cinématique | 3,00 $ |
| Nano Banana 2 (MCP erom-image) | Fonds, textures, vignettes des 2 salles | 2,50 $ |
| Lyria 3.5 | Boucle menu, morceau en jeu, morceau replay | 3,00 $ |
| Hyperframes | Cinématique (rendu local) | - |

- **Journal des dépenses :** `assets/ledger.jsonl`. Une ligne par génération : `{date, tool, model, prompt, output, costUsd}`.
- **Règle :** avant chaque génération, le total de l'outil plus le coût estimé doit rester sous le budget. Sinon, on demande à Romain.

## 9. Architecture du code

```
src/
  app/       machine d'états des écrans : boot, intro, menu, room, pause, death, victory, mobile
  sim/       simulation pure TS, sans Three.js ni DOM
    time/        TimeController (section 5.1)
    player/      déplacement, actions, collisions
    enemies/     machine d'états, navigation, visée
    projectiles/ balles (collision continue), objets lancés
    shatter/     éclats (données seulement)
    world/       boîtes de collision, lancer de rayon, requêtes spatiales
    pools/       pools pré-alloués
  render/    Three.js : scène, matériaux TSL, RenderPipeline, corps d'ennemis procéduraux, InstancedMesh des éclats
  audio/     graphe Web Audio, synthèse des SFX, asservissement de la musique
  ui/        écrans et panneaux HTML/CSS, tokens du design system
  rooms/     une salle = un module de données ; registre des salles
    registry.ts
    room-01-datacenter.ts
  replay/    enregistreur, lecteur
  settings/  persistance localStorage
```

### 9.1 Frontières

- **`sim`**
  - Expose `step(simDt, input)` et un état en lecture seule.
  - N'importe ni `three` ni le DOM. Testable avec `bun test`.
- **`render`**
  - Lit l'état de `sim` à chaque image et ne le modifie jamais.
- **`rooms`**
  - Un module de salle exporte un objet `RoomDefinition` :
    - boîtes de décor ;
    - graphe de navigation ;
    - apparitions, avec leurs déclencheurs (par exemple « quand il reste 2 ennemis ») ;
    - position de départ du joueur ;
    - arme de départ ;
    - références de musique et de vignette.
  - Le registre liste les salles, avec leur état (jouable ou verrouillée).
  - Ajouter la salle 2 = un nouveau module + une ligne dans le registre, sans modifier `sim` ni `render`.
- **Boucle principale**
  - Zéro allocation : vecteurs temporaires en champs de module, pools pour tout ce qui naît et meurt.

### 9.2 Performance

- 60 images/s sur un Mac Apple Silicon de base ; jusqu'à 120 sur un écran rapide.
- Moins de 80 appels de dessin par image, lus via `renderer.info`. (Révisé le 2026-09-30 : 60 avant le décor détaillé et la passe d'occlusion ; mesuré alors vers 65 en jeu. C'est un indicateur : ce qu'il protège, la cadence, se mesure à part.)
- Poids initial transféré, hors cinématique et hors musiques : moins de 3 Mo.
- **Qualité auto :**
  - si le temps d'image moyen dépasse 18 ms pendant 2 s, la résolution de rendu baisse par paliers (1 → 0,85 → 0,7) ;
  - elle remonte après 10 s stables.

## 10. Tests et vérification

- **`bun test` sur `sim`** :
  - fonction de temps ;
  - balistique et collision continue ;
  - états des ennemis ;
  - désarmement et capture ;
  - enregistrement du replay ;
  - registre des salles.
- **Parties scriptées sans écran :** on injecte une séquence d'entrées dans `sim` et on vérifie le résultat (voir les critères d'acceptation).
- **Navigateur** (Chrome DevTools MCP) :
  - trace de performance ;
  - `renderer.info` ;
  - réseau ;
  - émulation mobile ;
  - lancement forcé en WebGL2 avec `?renderer=webgl`.
- **Revue visuelle et sonore :** par Romain, sur captures et en jouant.

## 11. Ordre de fabrication

1. Salle en gris + le temps. On valide la sensation avant tout le reste.
2. Pistolet, balles, ennemis, poing, lancer, capture.
3. Éclatement, replay.
4. Beauté : facettes, contours, glow, ombres.
5. Son et musique.
6. Écrans : chargement, menu, panneaux, mort, victoire, mobile.
7. Assets générés, puis cinématique Hyperframes.
8. Perf, partage (Open Graph), mise en ligne.

## 12. Points ouverts

- **Hébergement :** Vercel (décidé le 2026-09-29 sur recommandation, Romain en mobilité ; alternative écartée : Cloudflare Pages, illimité mais wrangler à installer). La mise en ligne elle-même attend le « go » de Romain.
- **Nom du repo GitHub** (`eRom/XXXXXX`).
- **Valeurs réelles de tokens et de coût** pour les crédits, à calculer à la fin depuis les logs de sessions du projet.
- **Voix « AGENT... HOT... » :** Lyria ou le repli en code, tranché à l'écoute.

## Critères d'acceptation

**AC-1 : le temps ralentit à l'arrêt**
- **Comportement :** quand le joueur est immobile et ne touche à rien, alors une balle ennemie tirée à 7,9 m (juste sous la portée de tir de 8 m) met au moins 5 s réelles à l'atteindre.
- **Vérifié par :** partie scriptée `bun test` (joueur immobile, un ennemi à 7,9 m qui tire). Le temps réel écoulé entre le tir et l'impact est ≥ 5,0 s.

**AC-2 : le temps reprend en mouvement**
- **Comportement :** quand le joueur marche, alors le temps monte en douceur jusqu'à pleine vitesse en 0,6 s réelle au plus. Quand il s'arrête, le temps redescend vers 3 %, plus vite qu'il n'est monté.
- **Vérifié par :** `bun test` sur `TimeController`. Entrée marche : `timeScale` ≥ 0,95 à t = 0,6 s. Arrêt : `timeScale` ≤ 0,05 à t = 0,5 s.

**AC-3 : aucune balle ne traverse un mur**
- **Comportement :** quand une balle à 45 m/s vole à pleine vitesse vers un mur de 5 cm, alors elle s'arrête sur le mur, quelle que soit la cadence d'image.
- **Vérifié par :** `bun test`, 1 000 tirs à angles et pas aléatoires (de 1/240 à 1/30 s). 0 traversée.

**AC-4 : la boucle désarmement / capture marche**
- **Comportement :** quand le joueur lance son arme sur un ennemi armé, alors l'ennemi vacille, son arme vole. Le joueur qui la touche en vol la récupère avec 4 balles et peut tirer tout de suite.
- **Vérifié par :** partie scriptée `bun test` (lancer, avancer vers l'arc de l'arme, tirer). Assertions : état `Stagger`, arme captée pleine, balle partie. Puis vérification en jouant, par Romain.

**AC-5 : jamais de tir surprise**
- **Comportement :** quand un ennemi tire, alors son trait de visée était visible pendant au moins 0,4 s de temps de simulation juste avant.
- **Vérifié par :** `bun test` sur le journal d'événements de 50 parties scriptées aléatoires. Chaque `Fire` est précédé d'un `Aim` d'au moins 0,4 s.

**AC-6 : relance en moins de 50 ms**
- **Comportement :** quand le joueur meurt et appuie sur R, alors la salle repart en moins de 50 ms.
- **Vérifié par :** mesure `performance.now()` entre l'appui et la première image de la nouvelle partie, affichée en console en mode debug. Sur 20 relances dans Chrome, le maximum est < 50 ms.

**AC-7 : replay à vitesse réelle**
- **Comportement :** quand le dernier ennemi éclate, alors toute la partie est rejouée à vitesse réelle avec « AGENT... HOT... ». Sa durée égale le temps de simulation écoulé.
- **Vérifié par :** en debug, la console affiche le temps de simulation et la durée du replay. L'écart est ≤ 5 %. Revue en jouant par Romain.

**AC-8 : 60 images/s au pire moment**
- **Comportement :** quand 5 ennemis sont en jeu et qu'un éclatement a lieu, alors le jeu tient 60 images/s sur le Mac de Romain, avec moins de 80 appels de dessin.
- **Vérifié par :** trace de performance Chrome DevTools pendant ce moment : temps d'image p95 ≤ 16,7 ms. `renderer.info.render.drawCalls` < 80 (lu via `evaluate_script`).

**AC-9 : repli WebGL2 fonctionnel**
- **Comportement :** quand WebGPU n'est pas disponible, alors le jeu s'affiche et se joue de la même façon, ombre des coins et glow compris.
- **Vérifié par :** lancement avec `?renderer=webgl` (qui passe `forceWebGL: true`), capture comparée à la version WebGPU, partie jouée jusqu'à la victoire.

**AC-10 : jouable en 2 secondes**
- **Comportement :**
  - quand on ouvre l'URL, alors « APPUIE SUR UNE TOUCHE » apparaît en 2 s au plus ;
  - quand on clique sur Jouer, alors on contrôle le joueur en 1 s au plus.
- **Vérifié par :**
  - DevTools, réseau limité à 50 Mb/s, cache vide : horodatage de l'apparition du message ≤ 2 000 ms, et poids transféré hors cinématique et musiques < 3 Mo ;
  - chronométrage `performance.now()` du clic à la première image contrôlable ≤ 1 000 ms.

**AC-11 : cinématique à la première visite seulement**
- **Comportement :**
  - première visite : la cinématique joue ;
  - n'importe quelle touche la passe ;
  - visite suivante : on arrive au menu ;
  - le bouton Intro la rejoue.
- **Vérifié par :** parcours manuel dans Chrome, avec `localStorage` vidé puis rempli (`introSeen`).

**AC-12 : mobile accueilli**
- **Comportement :** quand on ouvre le lien sur un téléphone, alors on voit l'écran « Joue sur ordi » avec la cinématique et le bouton « Copier le lien ». Aucune erreur.
- **Vérifié par :** émulation mobile Chrome DevTools (iPhone), console sans erreur, capture de l'écran ; plus le cas iPad avec trackpad (verrouillage de souris absent), simulé en retirant `requestPointerLock` du prototype.

**AC-13 : l'orange signifie la menace**
- **Comportement :** quand on regarde une scène de la salle 1, alors seuls les ennemis, les balles, leurs traînées et les traits de visée sont orange. Tout le reste est blanc, gris ou noir. Seule exception : la teinte plein écran de la mort (section 6.2).
- **Vérifié par :** 5 captures (départ, combat, éclatement, mort, replay), relues par Romain avec cette seule question.

**AC-14 : réglages conservés**
- **Comportement :** quand on change un réglage et qu'on recharge la page, alors il est conservé et appliqué.
- **Vérifié par :** parcours manuel (sensibilité, inversion Y, champ de vision, deux volumes, qualité), rechargement, contrôle de l'effet de chaque réglage.

**AC-15 : crédits exacts**
- **Comportement :** quand on ouvre Crédits, alors on lit exactement `AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/XXXXXX`, suivi des tokens et du coût.
- **Vérifié par :** `get_page_text` (DevTools MCP) comparé à la chaîne attendue.

**AC-16 : une 2e salle s'ajoute par un fichier**
- **Comportement :** quand on ajoute un module de salle et sa ligne au registre, alors il apparaît dans « Salles » et se joue, sans modification de `sim` ni `render`.
- **Vérifié par :** `bun test` avec une salle de test minimale (1 ennemi), jouée jusqu'à la victoire en partie scriptée. Le diff de l'ajout ne touche que `rooms/`.

**AC-17 : budgets respectés**
- **Comportement :** à la fin du chantier, alors la dépense de chaque outil reste dans son budget.
- **Vérifié par :** somme de `costUsd` par outil dans `assets/ledger.jsonl` : Seedream ≤ 3,00 $, Nano Banana ≤ 2,50 $, Lyria ≤ 3,00 $.

**AC-18 : difficulté juste**
- **Comportement :** quand un joueur qui découvre le jeu attaque la salle 1, alors il gagne en moins de 5 essais en moyenne.
- **Vérifié par :** 3 testeurs (Romain + 2), nombre d'essais noté. Moyenne < 5.

**AC-19 : le son suit le temps**
- **Comportement :** quand le joueur s'immobilise, alors le son devient grave et étouffé en moins de 0,5 s réelle. Quand il bouge, le son s'ouvre.
- **Vérifié par :** `bun test` sur les fonctions de conversion (`timeScale` → fréquence de coupure et débit), puis écoute par Romain en jeu.
