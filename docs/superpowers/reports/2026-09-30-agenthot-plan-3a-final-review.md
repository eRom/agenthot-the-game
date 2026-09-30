# Revue finale feat/agenthot-plan-3a (b4c9008..9ed53fa), 2026-09-30

Deux passes indépendantes : la mienne (Opus 5.5, xhigh) et un relecteur neuf (même modèle), puis arbitrage.

## Vérifications relancées
- `bun test` : 224 pass, 0 fail (27 fichiers).
- `bun run typecheck` : propre.
- `bun run build` (outDir scratchpad) : OK, entrée 37,5 kB (13,3 kB gzip), moteur 990 kB (275 kB gzip).
- Séparateur : U+2027 (e2 80 a7) dans credits.ts, hud.ts ; les U+00B7 restants sont dans des commentaires mathématiques.
- Identifiants ajoutés : tous en anglais. Orange UI : conforme spec 4.1 / 6.3.
- Zéro allocation par image : tenu (boucle moteur, ViewModel, QualityGovernor, FrameLimiter, menuCamera/menuFade, ShatterSystem, hud.chant).

## Important (à corriger avant fusion)
1. Raccourci « M » (Menu) mort sur AZERTY. `src/ui/room-panels.ts:18` compare `event.code`, `src/app/main.ts:191` et `:197` déclarent `code: "KeyM"`. Sur AZERTY la touche M a le code `Semicolon` ; `KeyM` est la touche « , ». Repro : Mac AZERTY, Échap en jeu, appuyer sur M : rien ; appuyer sur « , » : retour au menu. Idem panneau de victoire. R et Espace OK. Correction : comparer `event.key.toLowerCase()` pour les lettres. Confirmé par lecture et disposition standard, pas rejoué au navigateur.

## Mineur
2. Espace = « Revoir le replay » vole l'activation d'un bouton focalisé au clavier (`room-panels.ts:17-23`, `main.ts:196`). Tab jusqu'à « Menu » puis Espace : preventDefault au keydown, rewatch() au lieu de Menu. Même famille que le bug Tab/Entrée corrigé dans le menu. Hypothèse, confiance moyenne.
3. `audio.loadMenuMusic()` sans plafond dans `loader.waitReady` (`main.ts:85`), alors que polices et cinématique ont 1,5 s. Latent en 3a, réel en 3b avec un vrai menu.mp3 (AC-10 en jeu). Fix : `withTimeout(..., 1500)`, `MusicTrack.pending` démarre la musique plus tard.
4. Échap accepté comme geste sur « APPUIE SUR UNE TOUCHE » (`src/ui/dom.ts:19-22`). HTML exclut Esc des activations : `AudioContext.resume()` et le `play()` sonore de la cinématique sont refusés ; cinématique de 1re visite sautée, menu muet jusqu'à la touche suivante. Hypothèse, confiance haute.
5. `import("./engine")` hors du délai de 12 s (`main.ts:51`) : chunk bloqué = « Chargement » sans fin. Déjà au journal.
6. `droneOn = true` au départ (`src/audio/game-audio.ts:27`) : onglet caché avant createEngine, `freeze()` programme le bourdon, audible sous la cinématique jusqu'au `setMode("idle")`. Fenêtre étroite. Fix : `false`.
7. Glyphes hors sous-ensemble : « ↑ ↓ » du pied du menu (`src/ui/menu.ts:66`, U+2191/U+2193) et l'espace fine U+202F produite par Intl dans les crédits tombent sur une police système.
8. Copie joueur « Valeurs par défaut SPEC » (`src/ui/panels.ts:180`) : jargon de dev.
9. Qualité auto : écran bridé à 30 i/s (économiseur Chrome, basse conso Safari) ou 50 Hz lu comme GPU lent, résolution 0,7 à vie. Limite à 60 sur 144/75 Hz : cadence irrégulière (13,9/20,8 ms). Hypothèses ; ProMotion 120 Hz non touché.
10. Aucun chemin vers le menu depuis la mort ni depuis « CLIQUE POUR JOUER » ; replay de victoire non passable. Conformes à la lettre de la spec 4.4, ergonomie.
11. `prefers-reduced-motion` ne coupe que le CSS, pas les animations Web Animations.
12. Échec de la cinématique mémorisé pour la session (`intro.ts:30-33`) ; Intro fait alors clignoter le menu.
13. Moteur en échec annoncé seulement après toute la cinématique de 1re visite (`main.ts:103-108`).
14. Sonde debug `settings()` désynchronise le `settings` de main.ts (debug seulement).
15. Déjà au journal, confirmés : 10,6 Mo réservés pour 53 images de démo ; course Reprendre puis M ; `device.test.ts` recalcule la réponse de la requête média ; machine d'états des écrans sans test automatique.

## Non couvert
- Aucun navigateur lancé, aucun son écouté, shaders TSL non vérifiés sur GPU, `build-fonts.sh` non relancé.

## Verdict
Fusionnable après une correction : le point 1 (M sur AZERTY). Le point 2 se corrige dans le même fichier pour presque rien. Le reste au backlog, les points 3 et 4 avant le plan 3b.
