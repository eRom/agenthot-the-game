# Architecture (mis à jour le 2026-09-30)

**AGENTHOT** : FPS de navigateur façon SUPERHOT (le temps n'avance que quand tu bouges), vitrine technique de Claude Opus 5.5. Une salle jouable (salle serveurs), une deuxième annoncée « Bientôt ». En ligne : https://agenthot.erom.cloud/ ; sources publiques : https://github.com/eRom/agenthot-the-game (historique complet, mode making-of).

## Stack
- Vite 8, TypeScript 6 strict, bun 1.4 (jamais npm/npx/node), Three.js r186 (`three/webgpu`, TSL). WebGPU, repli WebGL2 (`?renderer=webgl`).
- Web Audio API ; interface en HTML/CSS/TS sans framework (design system propre au jeu « Monolithe + Encre », pas erom-design).
- Hébergement Vercel (projet `agenthot-the-game`), déploiement par la CLI depuis le Mac (`vercel build` puis `vercel deploy --prebuilt --prod`), GitHub non relié. DNS : CNAME `agenthot` chez Hostinger.
- Assets générés : Lyria 3.5 (musiques), Nano Banana 2 et Seedream 5.0 Pro (images d'avant) ; cinématique montée avec Hyperframes (`videos/agenthot-intro/`).

## Dossiers clés
```
src/app/       point d'entrée léger (main.ts), moteur chargé à part (engine.ts), capture ?record, WebMCP, sonde d'images
src/sim/       simulation pure (temps, balles, ennemis, éclats), testée par bun test
src/render/    rendu Three.js : décor (decor.ts), post-traitement (post.ts : GTAO + glow), qualité auto
src/replay/    enregistreur, lecteur, démo du menu
src/ui/        écrans (chargeur, menu, panneaux, crédits, cinématique), tokens.css
src/rooms/     salles en données (room-01-datacenter.ts)
scripts/       génération payante (journalisée), contrôle de mise en ligne, SEO/GEO, comptage des tokens, image de partage
public/        robots.txt, sitemap, llms.txt, llms-full.txt, .well-known/ (catalogue pour agents), og-v1.jpg
docs/superpowers/   spec, plans 1 à 3c, revues, décisions : le making-of
.claude/notes/      note de reprise, pièges vérifiés, outils de plan
```

## Flux
Chargeur (sans Three.js) → invite « APPUIE SUR UNE TOUCHE » (moteur chargé pendant ce temps) → cinématique (1re visite) → menu sur la démo rejouée à 3 % → salle. Simulation déterministe, replay par positions enregistrées. Le rendu lit une `WorldView` et ne touche jamais la simulation.

## Rendu (30/09, figé par Romain)
Salle blanche détaillée, plafond fermé à 7,5 m, occlusion ambiante (GTAO sur une passe de profondeur sans MSAA) à la place des contours, glow limité à la menace orange `#D97757`.
