# AGENTHOT : note de reprise (écrite le 2026-09-29 à 19:50)

## Mise à jour du 2026-09-30 à 13:30 (prime sur le reste de la note)
- **Plan 3b exécuté, relu et fusionné** dans `main` (`fd71576`, avance rapide, 14:47). Rien poussé. `bun test` : 279 verts. Détail et dépenses : `.claude/notes/agenthot-plan-3-remaining.md` (en-tête du 30/09 13:30).
- Validé par Romain : boucle du menu, intro, images, plan de la cinématique, cinématique finale (après 3 retours : action calée sur 7,33 s, plus aucune image fixe sauf « FIGÉ »).
- Revue finale (Opus xhigh) : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md`, 0 critique, 0 important, 17 mineurs. **Backlog avant la prochaine dépense : ses points 2 à 4** (scripts payants) ; **avant la mise en ligne : points 6 et 7** (MP4 à ré-encoder en `-level 4.1`, lecture dans Safari). La marge du go du 30/09 reste ouverte (choix de Romain, `GO_CAPS`).
- Décisions prises pour Romain pendant l'exécution : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-rulings.md`.
- **Prochaine étape : écrire le plan 3c** (perf, balises de partage sur `public/og-v1.jpg`, crédits, mise en ligne) dans une session neuve.
- Journal d'exécution local : `.superpowers/sdd/2026-09-29-agenthot-plan-3b-assets-cinematic/progress.md`.

## Mise à jour du 2026-09-30 à 08:30 (prime sur le reste de la note)
- **Plan 3a fait et fusionné** dans `main` (`54a6288`, avance rapide). Rien poussé. `bun test` : 233 verts.
- Joué par Romain (tâche 12) : tout validé. Réglages : pontet, son du bris, voile sombre sous `R ‧ RECOMMENCER`. Poing non enregistré au replay : laissé tel quel, choix de Romain.
- Revue finale (Opus xhigh) : `docs/superpowers/reports/2026-09-30-agenthot-plan-3a-final-review.md`. Points 1 à 4 corrigés (M sur AZERTY, Espace sur un bouton focalisé, musique du menu plafonnée à 1,5 s, Échap exclu au chargeur). **Backlog : ses points 5 à 15**, plus le log debug `restart … ms` faux après une relance depuis un panneau.
- Décisions 1 à 3 plus bas : tranchées (plan validé, 60 images/s en auto, son propre pour la cinématique).
- **Prochaine étape : écrire le plan 3b** (point 5 de la liste plus bas), dans une session neuve.

## En une phrase
Le jeu tourne. Les plans 1 et 2 sont fusionnés dans `main`. Le **plan 3a est écrit et prouvé, pas exécuté**. Les plans 3b et 3c restent à écrire. Rien n'est poussé sur GitHub.

## Pour relancer le jeu
```bash
cd /Users/recarnot/dev/claudehot-videogame && bun run dev
```
Puis ouvrir http://localhost:5173/?debug, au casque.
- `?renderer=webgl` force le mode de secours.
- `bun test` : 164 tests verts à la pause.

## Prochaine étape (dans l'ordre)
1. **Relire le plan 3a** : `docs/superpowers/plans/2026-09-29-agenthot-plan-3a-screens.md`, 12 tâches, 164 → 203 tests au prototype. Trancher ses décisions (liste plus bas).
2. **L'exécuter dans une session neuve**, Opus, effort **high**. Lui dire :
   « Exécute `docs/superpowers/plans/2026-09-29-agenthot-plan-3a-screens.md` avec superpowers:subagent-driven-development. Lis d'abord `.claude/notes/2026-09-29-agenthot-reprise.md` et `.claude/notes/agenthot-pitfalls.md`. Branche `feat/agenthot-plan-3a` depuis `main`. Aucune génération payante, aucun push, aucun déploiement sans mon go. Arrête-toi avant la tâche 12 et avant la revue finale. »
3. **Tâche 12 du 3a : tu joues et tu regardes**, puis on règle.
4. **Revue finale**, Opus en effort **xhigh**, sur la version réglée. Puis fusion sur ton « go ».
5. **Écrire le plan 3b** (assets, `?record`, cinématique) dans une session neuve, à partir de `.claude/notes/agenthot-plan-3-remaining.md`. Le prototype déjà fait est dans `.claude/notes/agenthot-plan-3b-wip.patch`.
6. **Plan 3c** : perf, image de partage, crédits, mise en ligne. La mise en ligne n'a lieu que sur ton « go » explicite.

## Décisions qui t'attendent
1. **Valider le plan 3a** et son exécution. Je recommande sous-agents, comme les plans 1 et 2.
2. **Qualité « auto » limitée à 60 images/s**, contre la chauffe du Mac ; « haute » sans limite. Recommandé : garder.
3. **La cinématique garde son propre son**, en dehors du reste de l'audio du jeu. Recommandé : garder.
4. **Nom du dépôt GitHub** (`eRom/XXXXXX`) : il en faut un pour les crédits et le partage (plan 3c).
5. **Domaine** : l'URL Vercel par défaut ou un domaine perso (plan 3c).
6. **Liste des générations payantes du 3b** : environ 0,38 $ prévus (Lyria 0,16 + Nano Banana 0,13 + Seedream 0,09), 1,10 $ au maximum avec les nouveaux essais. Le détail est dans `.claude/notes/agenthot-plan-3-remaining.md`. Rien ne part sans ton « go » écrit.

## Où tout se trouve
| Quoi | Où |
| :--- | :--- |
| Spec (autorité) | `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md` |
| Tes mots et tes verdicts | `docs/superpowers/intents/2026-09-29-agenthot-vitrine-intent.md` |
| Plans 1, 2 (faits) et 3a (à exécuter) | `docs/superpowers/plans/` |
| Ce qui reste du plan 3 (3b, 3c) | `.claude/notes/agenthot-plan-3-remaining.md` |
| Prototype du 3b déjà fait | `.claude/notes/agenthot-plan-3b-wip.patch` (s'applique après le 3a) |
| Décisions prises à ta place | `docs/superpowers/reports/2026-09-29-agenthot-plan-{1,2}-rulings.md` |
| Brief de recherche du plan 3 | `docs/superpowers/research/2026-09-29-agenthot-plan-3-brief.md` |
| Pièges vérifiés | `.claude/notes/agenthot-pitfalls.md` |
| Outils « prototype puis plan » | `.claude/notes/agenthot-plan-tools/` |
| Journaux et prototypes détaillés (locaux, ignorés par git) | `.superpowers/sdd/…/progress.md`, `.superpowers/plan-3-proto/` (bundle complet du prototype 3a et 3b), `.superpowers/handoff/` |

## Sessions Claude du chantier (toutes terminées, fermables)
- **claude-neptune-5pxz** : pilote de la journée. Contexte presque plein, **ne pas la reprendre**.
- **claude-apollon-p0jv** : a écrit le plan 2.
- **claude-fortuna-pn4h** : a écrit le brief du plan 3 et exécuté le plan 2.
- **claudehot-videogame-ceres** (tmux `rc-claudehot-videogame-ceres`) : a écrit le plan 3a. Arrêtée proprement à 70 % de contexte.

Tout leur travail est dans le dépôt, ou dans `.superpowers/` pour les éléments locaux listés plus haut.

## Décisions déjà prises (ne pas les rouvrir)
- **Identité :** AGENTHOT, couleur `#D97757` réservée à la menace, design system propre au jeu « Monolithe + Encre », **pas** d'erom-design.
- **Parcours :** chargement → cinématique (1re visite) → menu → salle. 2 salles au maximum ; la salle 2 aura katana et fusil à pompe.
- **Diffusion :** hébergeur Vercel ; image de partage = fond Seedream + logo posé avec nos polices ; crédits = tokens + coût API estimé.
- **Son :** musique de jeu discrète ; « AGENT... HOT... » seulement au replay.
- **Éclats :** plafonnés à 5 m/s, ils rebondissent sur le décor.
- **Menace :** sans contour noir, détourée par son halo.

## Argent
| Outil | Dépensé | Budget |
| :--- | :--- | :--- |
| Lyria | 0,16 $ (2 morceaux) | 3,00 $ |
| Seedream | 0 $ | 3,00 $ |
| Nano Banana | 0 $ | 2,50 $ |

Toute génération payante exige ton « go » écrit, pour une liste précise. Le journal est `assets/ledger.jsonl`.

## Ce qu'il ne faut pas faire
- Reprendre la session neptune : son contexte est presque plein.
- Lancer une génération payante (`--pay`), pousser sur GitHub ou déployer sans ton go.
- Faire `git add -A`. Ces fichiers restent hors des commits tant que tu n'as pas décidé :
  - `docs/superpowers/idea/ideation.md`, `Lyria-prompt-guide.md`, `Seedream-5.0-Pro.md` ;
  - la planche Gemini et `screenshots/` ;
  - la modification de `OVERVIEW.md` ;
  - `.impeccable/`, `.ignore` ;
  - `rendu-simule/` : ton exploration visuelle du 29/09 à 18:50 (décor détaillé, néons, SSAO, arme réaliste). Décision (« B ») : on n'en fait rien pour l'instant, elle n'est pas intégrée aux plans.
