---
version: alpha
name: AGENTHOT - Frame (charte du jeu, couche vidéo)
description: >
  Charte de la cinématique AGENTHOT, tirée du design system du jeu (spec 6.1 et 6.3,
  src/ui/tokens.css), pas d'un preset Hyperframes : un preset remplacerait des couleurs et des
  polices déjà décidées. Trois voix : Monolithe (Big Shoulders Display 900/800) pour le logo et les
  impacts, Encre (Chakra Petch 600 sur plaque claire) pour les cartes calmes, Martian Mono pour les
  petits libellés. L'orange ne signale que la menace, et « HOT » dans le logo.
unit: le cadre - 1920×1080, 30 fps
principle: la charte du jeu fait foi · l'orange est réservé à la menace · coupes nettes, jamais de rebond

colors:
  void: "#0D111B"
  void-2: "#141A28"
  world: "#ECEBE7"
  world-2: "#C9CBD0"
  ink: "#0A0C10"
  threat: "#D97757"
  threat-hot: "#FF9D73"
  muted: "#7C8394"

fonts:
  # Polices locales, chargées par @font-face depuis le projet (aucune police distante).
  - { family: "Big Shoulders Display", weight: 900, src: "assets/fonts/big-shoulders-display-900.woff2" }
  - { family: "Big Shoulders Display", weight: 800, src: "assets/fonts/big-shoulders-display-800.woff2" }
  - { family: "Chakra Petch", weight: 600, src: "assets/fonts/chakra-petch-600.woff2" }
  - { family: "Martian Mono", weight: "300 400", src: "assets/fonts/martian-mono-300-400.woff2" }

typography:
  # - Monolithe : logo et impacts (capitales, interlignage 0,8) -
  logo:       { fontFamily: "Big Shoulders Display", px: 190, weight: 900, lineHeight: 0.8, tracking: "-0.01em", upper: true, color: "world" }
  logo-hot:   { fontFamily: "Big Shoulders Display", px: 190, weight: 900, lineHeight: 0.8, tracking: "-0.01em", upper: true, color: "threat", glow: "0 0 28px rgba(217,119,87,0.45)" }
  impact:     { fontFamily: "Big Shoulders Display", px: 240, weight: 900, lineHeight: 0.8, tracking: "-0.01em", upper: true, color: "world" }
  impact-solo:{ fontFamily: "Big Shoulders Display", px: 380, weight: 900, lineHeight: 0.8, tracking: "-0.01em", upper: true, color: "world" }
  title-800:  { fontFamily: "Big Shoulders Display", px: 120, weight: 800, lineHeight: 0.8, upper: true, color: "world" }
  # - Encre : cartes calmes, en encre sur plaque `world` -
  card:       { fontFamily: "Chakra Petch", px: 46, weight: 600, lineHeight: 1.15, tracking: "0.14em", upper: true, color: "ink" }
  # - Petits textes : Martian Mono, capitales espacées 0,18 em, jamais sous 18 px en 1080p -
  label:      { fontFamily: "Martian Mono", px: 22, weight: 400, lineHeight: 1.2, tracking: "0.18em", upper: true, color: "muted" }
  credit:     { fontFamily: "Martian Mono", px: 26, weight: 400, lineHeight: 1.2, tracking: "0.18em", upper: true, color: "world-2" }

spacing:
  safe-area: "96px gauche/droite, 80px haut/bas"
  logo-left: "le logo s'aligne à gauche, colonne à ~160px du bord, comme au menu du jeu"

components:
  ink-plate:
    backgroundColor: "{colors.world}"
    border: "2px {colors.ink}"
    corners: "coupés à 45°, 18px, en haut à droite et en bas à gauche (polygone 0,0 46,0 64,18 64,64 18,64 0,46 sur 64×64)"
    innerRule: "filet {colors.ink} à 25 % d'opacité, 6,5px à l'intérieur du trait"
    shadow: "drop-shadow(10px 10px 0 {colors.void-2}), portée par un filtre car un clip-path coupe box-shadow"
    typography: "{typography.card}"
    description: "La plaque Encre du jeu : la voix calme de la vidéo (cartes d'information)."
  logo-lockup:
    typography: "{typography.logo} « AGENT » au-dessus de {typography.logo-hot} « HOT », empilés, alignés à gauche"
    description: "Le logo s'écrit AGENT puis HOT, une lettre par élément (elles tombent en cascade comme au menu)."
  menu-veil:
    background: "linear-gradient(90deg, rgba(13,17,27,0.92) 0%, rgba(13,17,27,0.7) 38%, rgba(13,17,27,0.15) 70%, transparent 100%), linear-gradient(0deg, rgba(13,17,27,0.55), transparent 30%)"
    description: "Le voile du menu du jeu : le vide monte de la gauche pour que le texte reste lisible sur la salle claire."
  footage-dim:
    overlay: "{colors.void} à 30-50 % sous tout texte posé sur une prise"
    description: "Aucun texte clair directement sur la salle blanche : voile ou plaque, toujours."
  threat-shard:
    backgroundColor: "{colors.threat}"
    opacity: 0.85
    glow: "0 0 16px rgba(217,119,87,0.6)"
    shape: "triangle irrégulier en clip-path, 7 à 22px"
    motion: "dérive lente (14px, -22px, rotation 150°) sur 11 à 23 s, linéaire, aller-retour"
    description: "Les éclats d'ennemis qui flottent autour du logo (spec 6.3). Seul élément graphique orange hors logo."
  time-readout:
    typography: "{typography.label}"
    placement: "coin bas gauche, sur voile"
    description: "Libellé « TEMPS 3 % / 100 % / 0 % » : la vitesse du temps du jeu, qui change d'un coup (0 ms)."

motion:
  ease: "cubic-bezier(0.2, 0.9, 0.2, 1)"
  ui-transition: "150 à 250 ms, entrées orchestrées en cascade"
  hits: "coupes, gels et changements d'état à 0 ms"
  forbidden: "rebond, dépassement, élastique, ressort"
---

# AGENTHOT - Frame (charte du jeu, couche vidéo)

## Vue d'ensemble

La vidéo parle la langue du jeu : une salle blanc cassé en flat shading, cernée de traits d'encre fins,
suspendue dans un vide bleu nuit, où seuls les ennemis, leurs balles et leurs éclats sont orange. Le
texte ne doit jamais ressembler à un habillage de bande-annonce générique : c'est l'interface du jeu
qui s'invite dans les images.

Trois voix, trois rôles, jamais mélangés dans une même ligne :

- **Monolithe** (Big Shoulders Display 900, capitales, interlignage 0,8) : le logo et les impacts
  (« QUAND TU BOUGES », « FIGÉ »). Grand, blanc `world`, sur voile.
- **Encre** (Chakra Petch 600, capitales espacées 0,14 em, en `ink` sur plaque `world`) : les cartes
  calmes (« LE TEMPS / N'AVANCE QUE », « UN FPS / DANS TON NAVIGATEUR »).
- **Martian Mono** (400, capitales espacées 0,18 em) : les petits libellés (« TEMPS 3 % », le crédit
  « Made with Claude Opus 5.5 »).

## Règles absolues

- **Orange = menace.** `threat` et `threat-hot` ne vont qu'aux ennemis, balles, traînées, éclats, et à
  « HOT » dans le logo. Aucun texte, filet, fond ou transition orange en dehors de ça.
- **Pas de rebond.** Aucune courbe à dépassement ; les entrées d'interface suivent
  `cubic-bezier(0.2, 0.9, 0.2, 1)` en 150 à 250 ms, les impacts sont des coupes à 0 ms.
- **Transitions nettes.** Coupe franche entre cadres ; un fondu lent n'est permis que sur le premier
  cadre (montée calme).
- **Logo :** « AGENT » puis « HOT », empilés, HOT en `threat` avec sa lueur, comme au menu du jeu.
- **Aucun tiret cadratin** dans un texte affiché.
- **Prises muettes :** les captures portent une piste son, elle ne sort jamais ; la seule piste est
  `assets/bgm.mp3`.

## Le cadre

- **Plisser les yeux :** un seul moment typographique domine par cadre.
- **Silence :** les cadres de texte gardent au moins la moitié de l'image vide ou en prise.
- **Retenue :** huit couleurs, une seule lumineuse ; la lueur n'appartient qu'à la menace.
- **Référence :** le menu du jeu (salle figée à 3 %, voile venu de la gauche, logo empilé, éclats qui
  dérivent). L'échec ressemble à un titre de bande-annonce avec lueurs, dégradés et flous partout.
