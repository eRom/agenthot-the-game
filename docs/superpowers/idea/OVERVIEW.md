# SUPERHOT Clone Web (ClaudeHot) - Vue d'Ensemble & Architecture

## 1. Vision et Proposition de Valeur

L'ambition de ce projet est claire : recréer la quintessence de **SUPERHOT** directement dans le navigateur, sans compromis sur la fluidité, le feeling d'impact ou la précision de gameplay, en utilisant exclusivement des technologies Web standard.

SUPERHOT n'est pas un FPS de réflexes motorisés. C'est un jeu d'échecs cinématique déguisé en shooter en vue à la première personne, condensé dans une formule magistrale : **"Time moves only when you move"** (Le temps n'avance que si tu bouges).

```
                      [ JOUEUR IMMOBILE ]
                              │
                    Temps ralenti à ~3%
               Planification, lecture des vecteurs
                              │
                    [ INPUT UTILISATEUR ]
              (Déplacement, rotation, tir, lancer)
                              │
                              ▼
                     Temps fluide à 100%
                Résolution physique brutale
```

### Pourquoi le Web ?
1. **Zéro friction d'accès** : Aucun téléchargement de 4 Go sur Steam, aucun installeur, lancement en moins de deux secondes sur n'importe quel navigateur moderne (Chrome, Safari, Firefox).
2. **Viralité native** : Partage direct d'un niveau ou d'un replay via une simple URL.
3. **Prouesse technique épurée** : Démontrer qu'avec du WebGL/WebGPU, du WebAssembly et la Web Audio API, on peut rivaliser avec les sensations d'un moteur lourd (Unity/Unreal) sans en subir le bloatware.

---

## 2. Déconstruction de la Source (Analyse Eric / Game Designer Plays)

L'analyse vidéo met en lumière les principes fondamentaux qui ont fait de SUPERHOT un chef-d'œuvre de game design et d'économie cognitive :

### A. La prédiction avant le réflexe
Dans un shooter conventionnel, la performance repose sur le flick shot et le temps de réaction en millisecondes. Dans SUPERHOT, le joueur évalue la géométrie de la pièce, extrapole la trajectoire rectiligne des projectiles ennemis et anticipe les lignes de mire. Le skill réside dans l'optimisation des trajectoires de déplacement.

### B. La communication visuelle par l'abstraction
Le jeu élimine 100% du bruit parasite :
- **Trois couleurs, trois fonctions** :
  - **Blanc** : L'environnement inerte (murs, sols, colonnes, mobilier).
  - **Noir** : Les outils manipulables et dangereux (armes, bouteilles, battes, poings du joueur).
  - **Rouge / Orange** : La menace active (ennemis humanoïdes cristallins, balles et leurs traînées).
- **Zéro HUD encombrant** : Aucune barre de points de vie (mort en un coup), aucun compteur de munitions numérique. L'état du jeu est encodé directement dans la scène 3D.

### C. La surprise et l'improvisation continue
Le joueur ne connaît pas à l'avance le nombre exact de balles dans son chargeur, ni les vagues d'ennemis surgissant derrière une porte. Dès qu'une arme s'enraye ou tombe à sec, le joueur est forcé de jeter son arme au visage de l'adversaire, de s'emparer de son fusil en plein vol et de recalculer son plan.

### D. La boucle "Fail Fast, Learn Faster"
Chaque niveau est un puzzle mortel de 5 à 15 secondes. L'échec est immédiat, la punition est instantanée, mais le redémarrage s'effectue en une touche en moins de 50 millisecondes. La frustration est anéantie par la vitesse de réitération.

---

## 3. Pile Technique "Anti-Overkill" (Pure Web)

Pour respecter le principe d'efficacité maximale sans usine à gaz, nous écartons les frameworks lourds et optons pour une stack chirurgicale :

| Composant | Technologie retenue | Justification technique |
| :--- | :--- | :--- |
| **Runtime & Build** | **Vite + TypeScript** | Compilation ultra-rapide, typage strict des structures spatiales et des états. |
| **Moteur de Rendu 3D** | **Three.js** (WebGL 2 / WebGPU) | Standard absolu du web, communauté mature, contrôle total sur la boucle de rendu et les shaders personnalisés. |
| **Shaders & Post-Process** | **Three Postprocessing** | Bloom haute intensité sur le rouge/verre, aberration chromatique subtile, contraste poussé, effet CRT/scanline pour le méta-jeu. |
| **Moteur Physique** | **Moteur cinématique custom + Raymarching** (ou Rapier3D WASM) | Pour SUPERHOT, une physique de balles custom (sphères à vitesse vectorielle multipliée par `timeScale`) est plus légère, déterministe et stable qu'un moteur physique généraliste. Rapier3D peut être réservé aux bris de verre et débris. |
| **Moteur Audio** | **Web Audio API native** | Synthèse procédurale pure, pitch-shifting dynamique lié au `timeScale`, spatialisation 3D (PannerNode), zéro asset lourd à télécharger. |
| **Interface Diégétique** | **DOM / Canvas 2D overlay** | Typographie monospace agressive, rendu terminal DOS rétro ultra-léger. |

---

## 4. Architecture Globale du Projet

Le moteur repose sur une séparation nette entre le temps d'horloge réel du navigateur et le temps de simulation du monde virtuel :

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser RAF Loop (60-120 Hz)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ DeltaTime réel (unscaled)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Time Scale Controller                     │
│  - Analyse les inputs joueur (WASD, Mouse move, Jump, Fire) │
│  - Calcule timeScale dynamique (de 0.03 à 1.0)              │
│  - Fournit simDelta = realDelta * timeScale                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
│ Player Logic │       │ Enemy Agents │       │ Projectile Pool │
│ (Inputs réels│       │ (State Trees │       │ (Trajectoires   │
│  & inertie)  │       │  & Visée)    │       │  & Collisions)  │
└──────────────┘       └──────────────┘       └─────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Shatter & Debris System (Particules)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Render Pipeline & Post-Processing              │
│          (White World / Black Props / Red Glow)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Web Audio Engine (Dynamic Pitch)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Budget de Performance & Contraintes Techniques

Pour garantir un confort de jeu viscéral, les objectifs de performance sont non négociables :

- **Framerate cible** : 60 FPS constants sur GPU intégrés (Intel Iris, Apple M-series de base), 120 FPS sur moniteurs haute fréquence.
- **Poids total initial du bundle** : Moins de 3 Mo (textures procédurales, géométries low-poly générées ou compressées en Draco/GLTF, audio procédural ou WebM ultra-compact).
- **Draw Calls par frame** : Inférieur à 60 grâce à l'instanciation de géométrie (`InstancedMesh` pour les débris et les éclats de verre rouge).
- **Allocation mémoire (Garbage Collection)** : Zéro allocation d'objets dans la boucle principale (`tick`). Réutilisation stricte de vecteurs via des pools d'objets (`ObjectPool<Bullet>`, `ObjectPool<Shard>`) pour bannir tout stuttering lié au ramasse-miettes JS.

---

## 6. Structure des Documents de Spécification

L'étude détaillée est découpée en quatre documents spécialisés :

1. [OVERVIEW.md](file:///Users/recarnot/dev/claudehot-videogame/docs/superpowers/idea/OVERVIEW.md) : Présente synthèse globale, contraintes de production et architecture Web.
2. [GAME_DESIGN.md](file:///Users/recarnot/dev/claudehot-videogame/docs/superpowers/idea/GAME_DESIGN.md) : Mathématiques du temps, psychologie de l'adversaire, interface diégétique et boucle de gameplay.
3. [GAME_PLAY.md](file:///Users/recarnot/dev/claudehot-videogame/docs/superpowers/idea/GAME_PLAY.md) : Balistique, système de combat, mécanique de lancer/désarmement, découpe et fracturation de verre.
4. [SOUND_DESIGN.md](file:///Users/recarnot/dev/claudehot-videogame/docs/superpowers/idea/SOUND_DESIGN.md) : Architecture Web Audio, modulation fréquentielle temps réel, spatialisation 3D et mantra vocal.
