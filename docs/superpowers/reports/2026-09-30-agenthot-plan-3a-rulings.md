# AGENTHOT, plan 3a : décisions prises pendant l'exécution

Exécution du 2026-09-30, branche `feat/agenthot-plan-3a` (depuis `main` b4c9008). Tâches 1 à 11 faites, plus un lot de corrections. **Arrêt avant la tâche 12 et avant la revue finale.** Rien n'est poussé.

## État
- 18 commits sur la branche. `bun test` : 224 pass, 0 fail (le prototype en prévoyait 203 ; +21 viennent des corrections). `tsc` propre. Build : point d'entrée 37 Ko (13 Ko gzip), moteur 990 Ko (275 Ko gzip).
- Chaque tâche 1 à 11 est identique au prototype (`refs/proto/plan-3a`, diff vide), sauf les fichiers corrigés ci-dessous.
- Tes fichiers non commités (`docs/superpowers/idea/*`, `OVERVIEW.md`, `.impeccable/`, `.ignore`, `rendu-simule/`) sont intacts et hors des commits.

## Décisions prises à ta place
Chacune dit ce qu'elle coûte si elle est fausse.

1. **Pas de revue adverse du plan avant de démarrer.** Tout son code avait déjà tourné dans un rejeu tâche par tâche. Chaque tâche a été comparée au prototype après coup. *Si faux :* un défaut du plan sort en revue de tâche au lieu d'avant.
2. **Les 2 « Décisions pour Romain » du plan restent telles quelles** (auto limité à 60 i/s, « haute » sans limite ; la cinématique garde le son de sa vidéo, réglé par le volume musique). *Si faux :* réglage à la tâche 12.
3. **Tâche 1 corrigée hors plan.** Un éclat qui rebondit avec une petite vitesse vers le haut restait figé au sol dans le replay (reproduit). Correction d'une ligne et 3 tests. *Si faux :* rien, c'est l'écart jeu/replay que la tâche devait supprimer.
4. **Tâche 4 corrigée hors plan.** Un seul à-coup de 160 à 250 ms (compilation des shaders au chargement) faisait tomber la résolution à 0,85 pendant 10 s, vu dans Chrome. Ajout d'un échauffement de 3 s au régulateur, après le démarrage et après chaque changement de qualité. *Si faux :* une machine vraiment lente attend 3 s de plus avant de baisser la résolution.
5. **Tâche 3 : le pontet du pistolet se lit comme une fente fine.** Pas corrigé, renvoyé au réglage de la tâche 12 : c'est ton œil qui tranche. Piste : `guardHole` de v 0,018 à 0,040 dans `weapon-shapes.ts`, vérifier de profil.
6. **Les défauts des tâches 7 à 11 corrigés en un seul lot après la tâche 11**, pas tâche par tâche : les tâches 9 à 11 réécrivaient les mêmes fichiers. *Si faux :* rien de plus que le lot.
7. **« Aucune erreur en console » (Review Focus 1)** : Chrome affiche toujours une ligne réseau 404 pour un fichier absent (vignettes, cinématique, boucle du menu). À la tâche 12, lire « aucune exception, seulement ces lignes 404 ». *Si faux :* retirer les vignettes du registre jusqu'au plan 3b (une ligne).

## Le lot de corrections (5 commits, 27 points)
Défauts importants trouvés en revue, tous présents aussi dans le prototype :
- **Chargeur :** sans GPU utilisable il pouvait attendre à l'infini. Il vérifie maintenant l'adaptateur WebGPU et abandonne après 12 s. Trois messages distincts : pas de rendu, réseau (« Recharge la page »), délai dépassé.
- **Chargeur :** le logo s'affichait entier avant son animation (cache froid). Il part maintenant invisible.
- **Menu :** le réticule du jeu restait visible derrière le menu. Il est caché au menu et pendant la cinématique.
- **Menu :** Tab puis Entrée lançait la mauvaise entrée (Entrée sur « Crédits » lançait la partie).
- **Cinématique :** le bourdon d'ambiance montait sous la vidéo. Coupé.

Et une vingtaine de petits points : touche maintenue qui répète une action, Cmd+R compté comme « appuie sur une touche », panneau non modal au clavier, mauvais son au lancement d'une salle, démo du menu qui reprend au milieu, « Rejouer » sans souris qui passait par le panneau Pause, drapeau « cinématique vue » écrit même si rien n'a joué.

## À regarder à la tâche 12 (non vérifiable sans toi)
- **Souris verrouillée :** Chrome piloté l'a refusée partout. Donc jamais testés : clic sur Jouer jusqu'à la première image jouable (AC-10, ≤ 1 s), Échap puis Reprendre tout de suite puis un second clic, Rejouer depuis la victoire.
- **Son :** jamais écouté (sons d'interface, bourdon coupé sous la cinématique).
- **Qualité :** confirmer que la résolution ne tombe plus à 0,85 au chargement.
- **Pistolet :** le pontet (point 5), et des bords crénelés sur la culasse et les mains.
- **Orange :** possible liseré plus clair en bord de menace sur un sol clair (hypothèse à 25 %).
- **Message de mort** `R ‧ RECOMMENCER` : 13 px blanc sur sol clair, peu contrasté.
- **Replay :** le coup de poing n'est pas enregistré, le poing reste immobile au replay et dans la démo du menu. À toi de dire si ça compte.

## Petits points laissés de côté
Notés dans le journal local (`.superpowers/sdd/2026-09-29-agenthot-plan-3a-screens/progress.md`) pour la revue finale : environ 30 points mineurs (tests absents faute de DOM, contrastes, cas limites très étroits, 10,6 Mo réservés pour une démo de 53 images, etc.). Aucun ne bloque la tâche 12.

## Tâche 12 faite avec Romain (2026-09-30, 07:05 à 07:42)
- **Mesures :** WebGPU, 60 i/s, `res 1` en auto (plus de chute à 0,85 au chargement), 42 appels de dessin. Souris prise 6 ms après le clic sur Jouer (AC-10, attendu ≤ 1 000). Relance par R en 25,6 ms (AC-6, attendu < 50).
- **Parcours :** Échap puis Reprendre, et Rejouer depuis la victoire : OK.
- **Build sans les fichiers du 3b :** menu, panneaux et salle sans exception. Le plan supposait que `vite preview` renvoie un vrai 404 : faux, il renvoie aussi `200 text/html` (seul `favicon.ico` est en 404). Le code le gère (échec de décodage, image retirée).
- **Stockage abîmé :** réglages par défaut, aucune exception.
- **Verdicts de Romain :** chargeur, menu et cadrage, panneaux Encre, pistolet et mains, orange dans l'ombre : OK.
- **Réglages faits à sa demande :** pontet agrandi à 22 mm (`af99b34`) ; son d'éclatement refait en verre pulvérisé (`322ee31`) ; voile de mort assombri d'encre pour lire `R ‧ RECOMMENCER` (`6ee0ff6`). Validés par Romain.
- **Laissé tel quel sur sa décision :** le poing n'est pas enregistré au replay.
- **Pour la revue finale :** le journal `[agenthot] restart … ms` affiche un temps faux (5 à 35 s) quand on relance par un clic de panneau au lieu de R : il part de la dernière touche R.
