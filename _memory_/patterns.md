# Conventions (mis à jour le 2026-09-30)

## Code
- Identifiants, clés, fichiers, logs en anglais ; commentaires, textes d'interface et descriptions de tests en français.
- Zéro allocation dans la boucle de jeu et de rendu : objets temporaires réutilisés, tout est construit au chargement.
- Simulation pure et testée sans navigateur ; le rendu ne lit qu'une `WorldView`.
- Réglages regroupés en constantes nommées par module (`POST`, `DECOR`, `LOOK`, `MENU_DEMO`, `THREAT_AMBIENT`), chacune avec son pourquoi en commentaire.
- `‧` est U+2027, jamais U+00B7 : vérifier les octets.
- Raccourcis clavier sur `event.key` (Romain est en AZERTY), jamais `event.code`.

## Tests
- `bun test` (367 au 30/09). Tests de comportement, pas de valeurs figées ni de lecture du code source. Sorties citées passées par `tee` vers un fichier nommé.

## Méthode de chantier
- Un plan par étape, prototypé puis inséré dans le plan (outils : `.claude/notes/agenthot-plan-tools/`), exécuté par sous-agents avec relecture par tâche.
- Une session neuve par phase, pilotée par messages entre sessions ; Romain joue à chaque étape (« tâche 12 » ou « tâche 9 »), puis revue finale Opus xhigh, puis fusion sur son go.
- Fusion en avance rapide dans `main`, branche supprimée sur son mot.
- Portes de Romain, chacune sur ses propres mots : génération payante (liste et plafond écrits), push, déploiement, DNS, gestes de référencement. Un go relayé ne couvre que ses mots.
- Commits : `feat(...)`, `fix(...)`, `tune:`, `docs:`, `assets(...)`, `spike(...)`, avec les lignes Co-Authored-By et Claude-Session. Jamais `git add -A` : les fichiers non commités de Romain restent les siens.
