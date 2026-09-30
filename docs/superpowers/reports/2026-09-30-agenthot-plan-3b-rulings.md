# AGENTHOT, plan 3b : décisions prises pendant l'exécution

Exécution du 2026-09-30, branche `feat/agenthot-plan-3b` depuis `main` c4194b3, fusionnée dans `main` à fd71576 sur le go de Romain (14:47). Rien n'est poussé. 279 tests verts.

## Décisions de Romain (ses mots)
- 08:37 (relayé) : « go pour les générations payantes ».
- 09:11 : exécution « Avec des sous-agents ».
- 11:36 : boucle du menu « C'est nickel » (tâche 10 sans objet) ; « On garde ce morceau » ; « 'og-v1.jpg' vend du rêve, on garde les images ».
- 11:54 : « La bande-son me va ». 12:10 : « B, je refais deux victoires, le plan me va ».
- 12:31 : action à caler sur la frame 220. 12:49 : frames 557 à 583 fixes, à bannir. 13:02 : « 1. A 2. B » (FIGÉ gardé fixe, salle qui dérive derrière la carte).
- 13:15 : « oui, lance le rendu final ». 14:20 : « B » (marge du go gardée ouverte). 14:47 : « oui, fusionne ».

## Dépenses
Lyria 0,16 $ (total 0,32 $), Nano Banana 0,134 $, Seedream 0,045 $ : 0,34 $ sur 1,10 $ autorisés.

## Décisions prises par le contrôleur (journal d'exécution, dans l'ordre)

- Ruling: no adversarial plan review subagent ; every code block was executed and the plan replayed to the prototype tree (replay-plan-3b.py, TREE IDENTICAL) ; cost if wrong: a plan defect surfaces in task review instead of before.
- Ruling: tasks 6, 8, 9, 11, 12 run in the controller (plan says so: spending, MCP, Romain gates) ; task review still applies to their commits where code/assets change.
- Ruling: commit trailer names Claude Sonnet 5.5 (the subagent's real model) instead of constraints.md Opus line ; attribution stays truthful ; cost if wrong: one amend.
- Ruling: plan step 5.3 lacks mkdir -p assets/images; T8 creates it via generate-image (Bun.write creates dirs) ; implementer created/trashed it ; cost if wrong: none
- Ruling: fix the raw path (timestamped, ledger output points to it) and make build-og fail when no quality step gets under 300 KB ; spec 8 journal must keep the trace of every spend; OG limit is the brief's 300 KB ; cost if wrong: a few lines
- Ruling: spend.ts refuses check/log-nanobanana when assets/ledger.jsonl is missing (cwd drift is a known pitfall on this machine) ; cost if wrong: one clear error message
- Ruling: ledger.ts carries GO_CAPS (Romain's go of 2026-09-30 08:37: lyria 0.48, nanobanana 0.40, seedream 0.36), limit = min(spec budget, GO_CAPS, cap arg) ; the tool becomes the guard, a new go = a visible diff of one constant ; cost if wrong: editing one constant for the next go
- Ruling: keep the 122 s intro (plan's machine retry motive is < 20 s of music only); task 11 trims a 20-30 s window; Romain judges it at task 9 (2 Lyria retries left in the go) ; cost if wrong: one retry at 0.08 $
- Task 8: OG built 1200x630 102 KB q=3 but label line 2 ('OPUS 5.5') overlaps the player's arm; orange LED on the wristband (palette rule). Ruling: widen og.html's dark gradient via a small implementer dispatch (code change, reviewed); LED question goes to Romain at task 9 (keep / local desaturation / Seedream retry, 0.315 $ left in cap) ; cost if wrong: one more build
- Ruling: fix in Task 1 code: center the letterboxed capture canvas in the window (pure helper returns left/top offsets, tested: image center == window center) ; cost if wrong: one small follow-up
- Ruling: replay takes are 6.5 s because the replay lasts the run's simulation time (AC-7), not a capture defect ; cost if wrong: none
- Ruling: splice two sections of the 122 s Lyria track instead of one continuous window ; the only way to get build/freeze/drop/final impact in <= 30 s; Romain hears it at the storyboard gate ; cost if wrong: re-cut, free
- Task 11: Romain 12:31 on draft: music surges at frame 220 (7.333 s) but action starts at frame 272 (9.067 s). Ruling: Romain's ear is the anchor; re-plan frames 1-2 so action starts at 7.333 (storyboard agent), then rebuild frames 01 and 02 only ; cost if wrong: one more rebuild
- Task 11: Romain 12:49: frames 557-583 (18.57-19.43 s) still images kill the dynamism. Ruling: replace the end-of-drop freeze with the same moment in slow motion (rate 0.25) + slow push, readout TEMPS 3 % (true to the game: time slows, it does not stop) ; cost if wrong: one rebuild
- Task 12: observed once: replayed intro paused at 9.88 s and stayed on screen (finish() not called, a key closed it); not reproduced with event logging (full play, ended at 26.31). Ruling: automation artefact, not blocking; intro.ts does not finish on an external pause event ; deferred minor for the final review ; cost if wrong: a user whose OS pauses media must press a key (on-screen hint says so)

## Points mineurs reportés
Voir la revue finale : `docs/superpowers/reports/2026-09-30-agenthot-plan-3b-final-review.md` (17 points, dont ceux relevés en relecture de tâche).
