# AGENTHOT, plan 1 : décisions prises à ta place

Chantier : `feat/agenthot-greybox`, du 2026-09-29.
- 21 commits ;
- 58 tests verts ;
- build de 229 Ko gzip ;
- revue finale Opus xhigh : « prête à fusionner » après une vague de correction.

Chaque ligne donne la décision, puis entre parenthèses ce que ça coûte si elle est fausse. Toutes sont réversibles.

## Organisation du chantier

1. **Pas de worktree : une branche dans ton dossier.** Le mode worktree du harnais refuse trop de commandes Bash. (Coût si faux : risque d'embarquer tes fichiers non commités, évité en ne commitant que des fichiers nommés.)
2. **Pas de relecture adversariale du plan.** Tout son code avait déjà été exécuté avant. (Un défaut logique sort plus tard en revue ; c'est arrivé, et il a été attrapé.)
3. **Le test de sensation est tenu par moi avec toi, pas par un agent.** C'est une porte humaine. (Aucun coût.)
4. **L'effort des agents est hérité de la session.** Ils recopiaient du code vérifié. (Quelques tours de plus.)
5. **La tâche 7 est vérifiée dans Chrome par l'agent, sinon par moi.** (Vérification visuelle reportée.)
6. **Les commits portent la signature du modèle qui les a écrits** (Opus ou Sonnet), sans réécrire l'historique. (Signatures à harmoniser : cosmétique.)
7. **La revue finale se fait après ton test de jeu.** On relit la version réglée. (Une revue de plus.)

## Bugs corrigés alors que le plan disait autre chose (la spec prime)

8. **Balles et armes lancées naissent à l'œil.** Avant, une balle tirée collé à un mur fin le traversait. (Balle affichée plus près de la caméra au tir.)
9. **Une arme lancée contre un mur ne reste plus collée en l'air.** (Rebond visuel un peu plus tôt.)
10. **Le test « jamais de tir surprise » ne peut plus être trompé.** Il laissait passer un bug de minuteur. Le test du registre des salles vérifie enfin quelque chose. (Aucun coût.)
11. **Le replay garde les 90 dernières secondes proprement**, sans éclats fantômes, et enregistre bien 60 fois par seconde. (Aucun coût.)
12. **Écrans de mort et de victoire.**
    - Plus de blocage sans souris après Échap.
    - Plus de touches fantômes.
    - Le coût de relance est mesuré honnêtement.
    - Les armes ne sont plus posées à l'origine au départ.
    - Ctrl ne sert plus à s'accroupir (la spec dit C).
    (Aucun coût.)

## Réglages après ton test (« trop nerveux », « balles trop discrètes »)

13. **Le temps.**
    - Il monte en douceur et s'arrête net (λ 5 en montée, 12 en descente).
    - Le regard pèse 10 % au lieu de 15 %.
    - La spec AC-2 passe à « 95 % en 0,6 s ».
    - Balles plus grosses à l'écran, sans toucher à la zone qui touche.
    - Rattrapage plus large (1,3 m).
    - Difficulté inchangée.
    (Tu rejoues, on ajuste les mêmes réglages.)
14. **Conséquences acceptées.**
    - Un tir ne pousse le temps qu'à environ 25 %.
    - Un coup de poing sur un ennemi armé met son arme directement dans ta main.
    (Tu en juges en jouant.)

## Revue finale : ce qui a été corrigé

15. **Tenir C rendait invulnérable aux tireurs au sol.** Ils visent maintenant ta posture réelle, et une balle déjà partie reste esquivable en s'accroupissant.
16. **Mêlée.** L'ennemi de la passerelle ne frappe plus à travers le plancher. Le coup de poing ne traverse plus une baie.
17. **Armes.**
    - `E` prend l'arme la plus chargée et ne troque jamais une pleine contre une vide.
    - Une arme prise tire tout de suite.
18. **Visée, réticule, écran de mort.**
    - Le trait de visée est juste dès sa première image.
    - La visée s'annule si tu sors de portée.
    - Le réticule ne tourne que si une balle est chambrée.
    - L'écran de mort reste 0,3 s avant qu'une relance soit possible.
    (Coût pour 15 à 18 : re-régler la difficulté en jouant.)

## Reporté (rien de bloquant)

19. **Balles dessinées sur la caméra à l'instant du tir** : tâche 1 du plan 2. Il faut enrichir la vue du monde. (Petite tache orange au tir d'ici là.)
20. **Preuves navigateur.**
    - La relance est mesurée à 0,2 ms de calcul au pire, plus une image, et à 8,4 ms dans Chrome. La boucle scriptée de 20 relances a échoué : Chrome refusait de verrouiller la souris.
    - La victoire complète en WebGL2 est reportée au passage d'acceptation du plan 3.
    (Pas prouvé de bout en bout avant le plan 3.)
21. **Replay sans tirs ni impacts, collisions entre corps, recommandations sur la vue du monde** : entrées du plan 2.
22. **Sauter esquive désormais la mêlée.** Accepté, c'est une question de design pour toi. (Petite esquive sans intérêt, puisque frapper est plus simple.)
23. **Tests de la mêlée à rendre plus précis** (3 mutants survivent), **et « lancer + E dans la même image »** : plan 2. (Régression silencieuse possible d'ici là.)
24. **La spec se contredisait sur les munitions** (5.4 contre 5.6) : tranché pour 5.4. Une arme vidée reste vide. (Aucun, le code suivait déjà 5.4.)
