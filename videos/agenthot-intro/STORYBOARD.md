---
compositionId: agenthot-intro
duration_s: 26.3 # == audiomap.audio.duration_sec
canvas: { w: 1920, h: 1080, fps: 30 }
style:
  font: "Big Shoulders Display 900/800 / Chakra Petch 600 / Martian Mono 400"
  palette: ["#0D111B", "#ECEBE7", "#0A0C10", "#D97757", "#C9CBD0", "#7C8394"]
assets: "assets/captures, nouveau rendu de la salle (prises du 2026-09-30, 17:00 à 17:28) : replay-a.mp4 (4,96 s), replay-b.mp4 (5,13 s), replay-c.mp4 (9,04 s), replay-d.mp4 (5,74 s), replay-e.mp4 (7,66 s), replay-f.mp4 (11,37 s), une victoire entière chacune ; menu.mp4 (29,6 s, salle figée à 3 %, caméra qui dérive) ; toutes en 1920×1080 60 fps, toujours muettes"
build_notes: ["one paused timeline per frame; no remote assets; fonts via @font-face from assets/fonts (frame.md)", "every <video class=clip> is muted: every replay take and menu.mp4 carry an AAC track that must never play; the only audio is assets/bgm.mp3", "clip in-points are SOURCE seconds (in → out); anchors are TRACK seconds; worker converts to frame-local", "a freeze = the clip frame at the stated source second, held seek-safe (still extracted with ffmpeg into assets/captures/stills/, or an equivalent seek-safe hold); registry reference for the mechanics: beat-freeze-cut", "no light text straight on the white room: void veil 30-50 % (frame.md footage-dim / menu-veil) or an Encre plate", "footage dims, veils and punch-ins follow media-use references/media-treatments.md (project CLAUDE.md)", "time-readout label (frame.md) runs through frames 1-3: TEMPS 3 % → 100 % → 0 % → 100 % → 0 %, 0 ms swaps, gone from frame 4"]
avoid: ["orange on anything but threat entities and HOT", "bounce / overshoot / elastic", "em dash in displayed text", "crossfades on beat_cut frames", "generic trailer glows and blur washes", "the same shot twice with the same framing"]
---

<!-- Style : charte du jeu (frame.md), pas un preset, décision du plan 3b. -->

<!-- Remontage du 2026-09-30 (nouveau rendu de la salle) : même découpage, mêmes ancres, mêmes textes ; seules les
     prises changent (replay-a à replay-f, menu.mp4). Les listes `clips` font foi. Les phrases `intent` décrivent
     encore les prises du premier montage (replay-1 à replay-4) : le rôle de chaque plan reste le même. -->

<!-- Lecture de la piste : 117,5 BPM, grille fiable seulement sur les passages denses (9-11, 12-19, 24-26) ;
     ailleurs, tic-tac de charleston discret, désert d'attaques, silences à 11-12 et 19-21. Arc : veille, montée,
     coupure d'une seconde, drop, souffle, impact final, extinction.
     Pacing du cadre 1 : un roulement de charleston existe (0,09-3,20) mais à énergie 0,14 (VOID, sparse) ; lu
     comme texture d'horloge, pas comme grille de coupe, donc phrase_flow. -->

## Frame 1 — 01-salle-figee

- src: compositions/frames/01-salle-figee.html
- duration: 7.333s
- span_sec: [0.0, 7.333]
- pacing: phrase_flow
- mood: [tense, cinematic, dark]
- feel: quiet ticking hi-hat fill (0.09-3.20, energy 0.14), a strong kick at 5.085, then a sparse onset desert climbing to the acceleration Romain hears at 7.333 (draft render, frame 220)

### Groups

- **g1** — asset: ken_burns, la salle figée sort du vide
  - span_sec: [0.0, 5.085]
  - asset: { treatment: ken_burns, clips: ["assets/captures/menu.mp4 (in 0.0 → 5.085)"] }
  - intent: open on void, the frozen room fades up from void by the first downbeat, then one slow push (scale 1.0 → 1.06) toward the orange enemy caught mid-air at the right edge; void veil ~35 % on the left third
  - anchors: [0.093, 1.138] # 0.093 first hi-hat: time-readout appears; 1.138 first downbeat (phrase 0): the card lands
  - overlay_copy:
    - { text: "LE TEMPS", style: "frame.md card on an ink-plate, lower left", at: 1.138 }
    - { text: "TEMPS 3 %", style: "frame.md time-readout", at: 0.093 }
- **g2** — asset: ken_burns, les ennemis qui visent
  - span_sec: [5.085, 7.333]
  - asset: { treatment: ken_burns, clips: ["assets/captures/menu.mp4 (in 16.0 → 18.248)"] }
  - intent: slow crossfade from g1 on the strong kick, different angle of the room where the enemies' aim tracers hang in the air; push a notch faster than g1 (scale 1.0 → 1.10) toward the far enemy; the plate stays in place and its second line lands with the kick, so both lines are read for 2.2 s before the action
  - anchors: [5.085, 7.036] # 5.085 kick (strong, first real hit after the hi-hat fill): second line; 7.036 snare, first MEDIUM phase: the plate's inner rule flashes ink once, tension before the cut
  - overlay_copy:
    - { text: "LE TEMPS / N’AVANCE QUE", style: "same ink-plate, second line types in (Encre cascade)", at: 5.085 }
    - { text: "TEMPS 3 %", style: "time-readout, held", at: 5.085 }

## Frame 2 — 02-bouge-gel

- src: compositions/frames/02-bouge-gel.html
- duration: 4.741s
- span_sec: [7.333, 12.074]
- pacing: beat_cut
- mood: [hype, tense]
- feel: the music accelerates at 7.333 (Romain's ear, draft frame 220; riser 7.52), heavy kick 8.545 (0.71), snare fill 9.06-10.08 (SURGE 9, energy 0.91, dense), then a one-second silence 11.0-12.0 (energy 0.05)

### Groups

- **g1** — asset: beat_cut, la salle se met à bouger puis se fige sur une balle
  - span_sec: [7.333, 12.074]
  - asset: { treatment: beat_cut, clips: ["assets/captures/replay-f.mp4 (in 0.0 → 1.212) at 7.333", "assets/captures/replay-b.mp4 (in 1.0 → 1.511) at 8.545", "assets/captures/replay-e.mp4 (in 2.05 → 3.071) at 9.056", "assets/captures/replay-a.mp4 (in 2.194 → 3.117) at 10.077", "FREEZE replay-a.mp4 @3.117 at 11.0 → 12.074"] }
  - intent: hard cut from the frozen room into the real-speed run exactly when the music accelerates (the time mechanic made visible: replay-3's first steps, an enemy on the catwalk); the heavy kick cuts to replay-4's corridor as the enemies turn to aim; the fill start cuts to replay-3 just after a burst, shards in the air, an enemy firing its aim tracer; the roll end cuts to replay-1 so that at 11.0, exactly when the music drops out, the image freezes on the orange bullet and its trail (source 1.85, bullet and trail around x 52-59 %, y 50 %, the firing enemy just left of it); during the silence one slow push toward the bullet (scale 1.0 → 1.08), nothing else moves; none of these source moments appears in frame 3
  - anchors: [7.333, 8.545, 9.056, 10.077, 11.0] # acceleration (Romain's ear, overrides the analyzer; nearest events 7.036 snare / 7.523 riser), heavy kick, fill start (SURGE), roll end (leads_to DROP), silence start (DROP 11)
  - overlay_copy:
    - { text: "QUAND TU BOUGES", style: "frame.md impact, one line, centred low third, void veil 40 %, slams on the hit (registry ref: headline-slam, no overshoot)", at: 7.333, out: 10.9 }
    - { text: "FIGÉ", style: "frame.md impact-solo, upper left over the void ceiling, clear of the bullet and the enemies, appears dead still at 0 ms", at: 11.0 }
    - { text: "TEMPS 100 % → TEMPS 0 %", style: "time-readout, swaps at 7.333 then 11.0", at: [7.333, 11.0] }

## Frame 3 — 03-drop

- src: compositions/frames/03-drop.html
- duration: 7.384s
- span_sec: [12.074, 19.458]
- pacing: beat_cut
- mood: [hype, aggressive]
- feel: SURGE 12 into a dense section, sustained hi-hat fill 13.10-15.56, two accelerating rolls 17.09-17.55 and 17.86-19.46, energy collapses at 18.55 (hard_stop events) to the hard stop at 19

### Groups

- **g1** — asset: beat_cut, le replay reprend à pleine vitesse
  - span_sec: [12.074, 17.09]
  - asset: { treatment: beat_cut, clips: ["replay-a.mp4 (in 3.117 → 4.139) at 12.074", "replay-d.mp4 (in 3.2 → 4.199) at 13.096", "replay-c.mp4 (in 1.0 → 1.952) at 14.095", "replay-c.mp4 (in 5.0 → 6.021) at 15.047", "replay-f.mp4 (in 4.3 → 5.322) at 16.068"] }
  - intent: the frozen bullet resumes on the SURGE (same source frame as the freeze, so time visibly restarts) and the first enemy bursts about 0.15 s later; one cut per strong hit, each clip a different moment of the fight (enemy firing then shattering, the other victory's corridor for the energy dip at 14-15, the run across a carpet of orange shards from replay-3, then replay-4's enemy bursting close at left, an aim tracer across the floor, the burst landing near the 16.579 snare); no source moment is shown twice in the video; a 3-frame camera shake only on the two strongest snares (13.096, 16.579) (registry ref: camera-shake), no text
  - anchors: [12.074, 13.096, 14.095, 15.047, 16.068, 16.579] # SURGE 12 hit, snare strong + roll start, hi-hat strong, snare, hi-hat 0.59, snare 0.64
  - overlay_copy:
    - { text: "TEMPS 100 %", style: "time-readout, swaps at 0 ms on the SURGE", at: 12.074 }
- **g2** — asset: beat_cut, trois éclatements de plus en plus rapides, puis gel
  - span_sec: [17.09, 19.458]
  - asset: { treatment: beat_cut, clips: ["replay-e.mp4 (in 5.0 → 5.464) at 17.09", "replay-b.mp4 (in 1.7 → 2.002) at 17.554", "replay-f.mp4 (in 8.3 → 8.997) at 17.856", "SLOW-MO replay-f.mp4 from 8.997 at 0.25x, 18.553 → 19.458"] }
  - intent: the accelerating rolls cut three new bursts faster and faster (replay-3's enemy bursting at close right, replay-3's enemy bursting at left as a bullet trail crosses, then replay-1's close one where shards fly at the camera and the disarmed enemy's pistol drops); when the energy collapses at 18.553 the image freezes mid-burst and holds, dead still, through the decaying hi-hats to the hard stop
  - anchors: [17.09, 17.554, 17.856, 18.553] # accel-roll 1 start (snare 0.71), its end, accel-roll 2 start (kick 0.53), first hard_stop event (energy collapse)
  - overlay_copy:
    - { text: "TEMPS 0 %", style: "time-readout, swaps at 0 ms on the freeze", at: 18.553 }

## Frame 4 — 04-souffle

- src: compositions/frames/04-souffle.html
- duration: 2.601s
- span_sec: [19.458, 22.059]
- pacing: phrase_flow
- mood: [tense, elegant]
- feel: near-silence (19-21, energy 0.14) with a soft hi-hat fill 19.85-20.85 and a short accel roll 21.22-21.57 leading to the surge

### Groups

- **g1** — free_design
  - span_sec: [19.458, 22.059]
  - free_design: { dominant_system: "one Encre ink-plate card on the void, built line by line, held, cleared", primitives: ["staggered-reveal", "negative-space-hold", "staggered-exit"], density_topology: "build → hold → clear" }
  - intent: cut to pure void after the freeze (the breath before the logo); the plate from frame 1 comes back on the void, its two lines cascade in on the soft fill, hold dead still, and clear in an ordered cascade that finishes before the SURGE so frame 5 opens on an empty void
  - anchors: [19.853, 20.271, 21.571] # soft fill start: plate + line 1; downbeat inside the fill: line 2; accel-roll end: exit completes by 22.0
  - copy: ["UN FPS", "DANS TON NAVIGATEUR"]

## Frame 5 — 05-logo

- src: compositions/frames/05-logo.html
- duration: 4.241s
- span_sec: [22.059, 26.3]
- pacing: beat_cut
- mood: [cinematic, hype]
- feel: snare hit 22.06 (SURGE 22), hard stop 23 with one accent 23.59, snare fill 24.08-25.08 leading to the final drop at 26, then 0.3 s of silence

### Groups

- **g1** — asset: bg_under_text, le logo sur la salle figée, comme au menu
  - span_sec: [22.059, 26.3]
  - asset: { treatment: bg_under_text, clips: ["assets/captures/menu.mp4 (in 22.0 → 26.241)"], dim: "frame.md menu-veil (void from the left) rather than a flat dim" }
  - intent: the video ends on the exact composition of the game's menu (frozen room, veil from the left, stacked logo, drifting orange shards) so the hand-off to the real menu is invisible; AGENT lands on the SURGE, HOT slams in orange on the strongest snare, the snare fill spawns the shards one per hit, the credit lands on the downbeat that ends the fill, then everything holds through the fade of the music (no fade to black: the menu takes over)
  - foreground: { primitives: ["kinetic-letter-in", "braam-punch", "negative-space-hold"], components: ["frame.md logo-lockup", "frame.md threat-shard (max 6, as in the menu)"] }
  - anchors: [22.059, 23.591, 24.079, 24.195, 24.358, 24.474, 24.683, 24.845, 25.124, 26.0] # AGENT, accent (veil deepens a notch), HOT, fill hits → one shard each, credit, final DROP → hold
  - overlay_copy:
    - { text: "AGENT", style: "frame.md logo, letters drop in cascade as in the game menu, last letter lands on the hit", at: 22.059 }
    - { text: "HOT", style: "frame.md logo-hot under AGENT, one 0 ms slam with its glow", at: 24.079 }
    - { text: "Made with Claude Opus 5.5", style: "frame.md credit under the logo, Encre-style cascade in", at: 25.124 }
