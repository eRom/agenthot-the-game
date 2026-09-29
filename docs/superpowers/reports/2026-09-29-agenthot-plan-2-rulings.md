# AGENTHOT, plan 2 : décisions prises à ta place

**Bilan du chantier**
- Branche `feat/agenthot-plan-2`, fusionnée dans `main` le 2026-09-29 à 18:05, à ta demande (« A »).
- 24 commits de code et de réglage.
- 164 tests verts (58 au départ du plan 1, 108 à la fin de l'exécution du plan 2).
- Dépense Lyria : 0,16 $ sur 3,00 $.

**Qui a fait quoi**
- claude-apollon-p0jv a écrit le plan.
- claude-fortuna-pn4h a exécuté les tâches 1 à 8.
- claude-neptune-5pxz a mené la revue finale (Opus xhigh), les corrections et ta tâche 9.

Chaque ligne donne la décision, puis entre parenthèses son coût si elle est fausse. Détail complet : `.superpowers/sdd/2026-09-29-agenthot-plan-2-beauty-sound/progress.md`.

## Organisation
1. **Exécution confiée à fortuna, sur une branche dans ton dossier, sans worktree.** (Un renommage de branche.)
2. **Pas de relecture adversariale du plan.** Tous ses diffs et tests avaient été rejoués sur une copie. (Défaut attrapé plus tard en revue.)
3. **Pas de revue finale ni de tâche 9 pendant l'exécution.** La revue demande Opus xhigh, et la tâche 9, c'est toi. (Aucun.)
4. **Rien vers l'extérieur :** pas de push, pas de déploiement, pas de message à des tiers. (Aucun.)
5. **Vérifications navigateur faites pour de vrai ou déclarées « non faites ».** Jamais simulées. (Aucun.)

## Argent (Lyria)
6. **Pas de génération payante sans toi.** Puis ton « Go » de 14:25, relayé par apollon, a couvert exactement 2 morceaux : jeu et replay, 0,16 $, un seul nouvel essai autorisé en cas d'erreur, jamais utilisé. (0,16 $.)
7. **Garde-fous ajoutés au script :**
   - un appel réel exige `--pay` ;
   - il refuse d'écraser un morceau sans `--overwrite` ;
   - le journal est écrit avant tout fichier ;
   - la réponse brute est sauvée avant d'être lue.
   (Aucun.)

## Choix de design
8. **La menace n'a pas de contour noir** : son halo la détoure. Tu as validé la lecture en jouant. (Une ligne à changer.)
9. **Sauter esquive un coup de poing.** (Une garde à changer.)
10. **Le décor n'a pas le « flat shading » écrit dans la spec** ; le plan l'avait abandonné sans le dire. (Un réglage de matériau.)

## Corrections pendant l'exécution (fortuna)
11. **Éclats sur la passerelle :** 2 tests ajoutés, le branchement n'était pas testé. (Aucun.)
12. **Ennemi immobile figé en plein pas :** la foulée se referme. (Aucun.)
13. **Onglet en arrière-plan :** le son se fige et se suspend. (Aucun.)

## Revue finale (Opus xhigh) et corrections
14. **Les jambes sautaient à chaque tir :** la foulée est désormais portée par la simulation, lissée et rejouée. Le saut passe de 0,45 à 0,001 rad. Ça règle aussi l'ennemi bloqué qui gardait sa pose de marche. (Aucun.)
15. **Silences dans les musiques :** coupés par une table de boucle mesurée avec ffmpeg, sans rien régénérer. Le replay démarre directement sur la musique. (Aucun.)
16. **Éclats plafonnés à 5 m/s** (ta décision « A ») **et collision avec les murs, les baies et la passerelle** : 36 sur 36 retombent sur la passerelle. (Coût de calcul : 0,25 ms par image.)
17. **Mode WebGL2 :** la résolution est plafonnée à 1,5 pour tenir 60 images par seconde en Retina. (Image un peu moins fine en WebGL2.)
18. **Le glow écrasait les facettes :** intensité réduite. (Réglage.)

## Tâche 9 (ton écoute) et réglages
19. **Ennemis façon cristal :** facettes irrégulières, anatomie, côtés sombres, halo réduit à 30 % sur le corps. (Tu rejuges en jouant.)
20. **Musique de jeu plus discrète** (ton choix) : −12 dB et beaucoup moins d'aigus. Le replay est inchangé. (Tu rejuges en écoutant.)
21. **Plafond invisible à 6 m pour les éclats.** Une balle tirée vers le haut fait un bruit d'impact contre ce plafond. (Petit son inattendu.)

## Reporté au plan 3
22. **L'orange brunit dans l'ombre**, au lieu de rester vif.
23. **Jointures de hanche visibles de près.**
24. **L'arme tenue est une boîte :** à dessiner en code, avec les mains.
25. **Qualité automatique (spec 9.2) et limite d'images par seconde**, pour la chaleur du Mac.
26. **Cas latent d'éclat poussé sous le sol** dans une future salle, et **écart de quelques centimètres entre jeu et replay** au ralenti.
