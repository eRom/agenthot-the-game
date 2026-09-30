# Fichiers clés (mis à jour le 2026-09-30)

## Reprise
- `.claude/notes/2026-09-29-agenthot-reprise.md` : point d'entrée de toute reprise ; l'en-tête du 30/09 à 20:40 liste ce qui reste.
- `.claude/notes/agenthot-pitfalls.md` : pièges vérifiés, avec leur commande de contrôle.
- `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md` : la spec (autorité), critères AC-1 à AC-19.
- `docs/superpowers/reports/` : revues finales et décisions prises pour Romain, plan par plan.

## Moteur et rendu
- `src/app/main.ts` : point d'entrée léger, chargeur, écrans, câblage des panneaux.
- `src/app/engine.ts` : moteur (rendu, simulation, replay, qualité), sonde debug `window.agenthot` en `?debug`.
- `src/render/world-renderer.ts` : scène, lumières, décor, instances ; calque `NO_OCCLUSION_LAYER`.
- `src/render/decor.ts` : dallage en shader, baies détaillées, plafond, bandeaux, étagères.
- `src/render/post.ts` : `POST` (occlusion, glow, rampe de la menace, aberration à la mort).
- `src/render/materials.ts` : matériaux ; `THREAT_AMBIENT` garde les facettes du cristal.
- `src/render/quality.ts` : qualité auto (60 i/s au plus, résolution adaptative).
- `src/rooms/room-01-datacenter.ts` : la salle en boîtes de collision (murs 7,5 m, baies, étagères, plafond caché).

## Mise en ligne et référencement
- `scripts/check-release.ts` : contrôle en mode dist ou adresse (balises, cache, types, JSON-LD, catalogues).
- `scripts/count-tokens.sh` : crédits (tokens et coût, détail par catégorie `SPLIT`).
- `scripts/build-og.sh` + `scripts/og/og.html` : image de partage depuis `assets/images/og-background-game.png`.
- `scripts/discovery.ts`, `src/app/webmcp.ts` : SEO/GEO et 3 outils WebMCP en lecture seule.
- `vercel.json` : cache d'un an sur `/assets/`, types de contenu des fichiers pour agents.
- `index.html` : balises de partage, JSON-LD, jeton d'origin trial WebMCP (expire le 2027-03-30).
- `src/ui/credits.ts` : ligne des crédits et chiffres mesurés.

## Génération payante
- `scripts/ledger.ts` (`GO_CAPS`), `scripts/spend.ts`, `assets/ledger.jsonl` : plafonds du go de Romain et journal de chaque appel.
