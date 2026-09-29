# AGENTHOT, vitrine : intent record

Date : 2026-09-29. Session de brainstorming Romain + Claude Opus 5.5.
Spec associée : `docs/superpowers/specs/2026-09-29-agenthot-vitrine-design.md`.

## Intent

- **Résultat voulu :** une vitrine technique d'Opus 5.5 sous forme de clone web de SUPERHOT. Une salle parfaite, jouable en ligne en 2 secondes.
- **Pour qui :** quiconque clique sur le lien (public large, partage sur les réseaux).
- **Succès :** le visiteur se dit, mot pour mot selon Romain : « Fanchement, Opus 5.5 est vraiment Banger !, il faut absolument que je l'utilise, bye openai, bye grok ! ».

## Ce que Romain a dit (décisions)

- Point de départ : « je veux faire un clone du jeu "Superhot" qui s'appelera "CLAUDEHOT". Clone en technologies purement Web en utilisant toutes les possibités du Web 2026. » Docs d'idéation fournies dans `docs/superpowers/idea/`.
- But : « Vitrine technique d'Opus 5.5. Une salle parfaite, jouable en ligne en 2 secondes. Ça doit bluffer quiconque clique sur le lien. »
- Écrans demandés :
  - « 1 Ecran chargement (même simulé dans le cas où on n'en aurait pas besoin). On pose l'univers, motion design léger »
  - « 1 Ecran de "menu" (Jouer, Choix des salles, Paramétres, Crédits -> auteur, repo github, nb tokens, estimation coût API). Là on passe à la vitesse supérieure, motion design complexe (mais maitrise), sound design de menu, + music (loop) de fond. »
  - « 1 Salle parfaite mais vraiment parfaite ! Prendre en compte qu'une autre salle pourra voir le jour. donc 2 salles maximum dans la vitrine cible. On ne fait pas UN VRAI jeu. »
  - Ajout ensuite : « loader -> CINEMATIQUE -> menu. Donc Hyperframes pour CINEMATIQUE (la cinématique doit forcement "claquer" pour donner envie) »
- Son : « ultra tech et punchy ! »
- Outils et budgets : Seedream 5.0 Pro via OpenRouter (3,00 $), Nano Banana 2 via MCP erom-image (2,50 $), plugin Hyperframes, Lyria. Sur Lyria : « Tu as le modele "lyria-3.5" plutot ».
- Tokens et coût dans les crédits : « c'est statique, on mettra la valeurs a la fin, pour le moment mock ».
- Nom et crédits : « AGENTHOT ‧ Author: eRom ‧ Made with: Claude Opus 5.5 ‧ Sources: https://github.com/eRom/XXXXXX ».
- Couleur : « SUPERHOT à la couleur ROUGE comme signature, AGENTHOT, a lui, #D97757 (la couleur du logo Claude que je viens de pick) ».
- Ennemis : « A, faits en code !!! C'est là que tu vas briller sur tout internet ! »
- Contenu de la salle : « A, katana et fusil pour la salle 2. »
- Décor : salle serveurs (option A). Planche Nano Banana fournie (`docs/superpowers/idea/Gemini_Generated_Image_43l3lp43l3lp43l3.jpeg`), avec la consigne : « C'est juste pour inspiration, n'ancre pas ce design comme objectif ».
- Stack : option A (Three.js + moteur maison).
- Design system : « erom-design n'a pas sa place ici. Repense à un Design System qui fonctionne parfaitement avec le design du jeux. » Choix final après maquettes : « B + C ».

## Hypothèses (proposées par Claude, validées par un « ok » explicite de Romain)

1. Ordinateur seulement (clavier + souris, pointer lock). Sur mobile : écran « Joue sur ordi ».
2. Navigateurs cibles : Chrome, Safari, Firefox récents.
3. Tokens et coût des crédits calculés depuis les logs de sessions du projet, à la fin ; valeurs fictives d'ici là.
4. Hyperframes sert à la cinématique (vidéo) ; le menu est animé en direct, en code.
5. La jointure de boucle musicale est vérifiée et masquée si besoin.
6. Mention « projet perso, non officiel » : remplacée par la ligne de crédits exacte donnée par Romain.

## Hypothèses (inférées par Claude, non contredites, à valider en relisant la spec)

- Le terminal DOS / méta-narration des docs d'idéation est hors périmètre : le parcours retenu est chargement → cinématique → menu → salle.
- Le Hotswitch est hors périmètre (non listé en A ni reporté explicitement en salle 2).
- Le joueur démarre avec un pistolet chargé (4 balles) face à 5 ennemis : il doit forcément lancer, frapper ou rattraper au moins une fois. Détail de game design posé dans la spec.
- Un petit réticule reste à l'écran (le « zéro HUD » des docs vise les jauges, pas la visée).
- Tous les minuteurs de gameplay (visée ennemie, vacillement, cadence) comptent en temps de simulation, sinon les ennemis tireraient pendant que le joueur est immobile.

## Contraintes et non-goals

- Pas un vrai jeu : 2 salles maximum dans la vitrine cible ; seule la salle 1 est dans ce chantier, le code est prêt pour la salle 2.
- Salle 1 : temps qui ralentit, pistolet, coup de poing, lancer et rattraper en vol, éclatement en verre, replay final à vitesse réelle, 4 à 5 ennemis.
- Salle 2 (hors chantier) : katana, fusil à pompe ; deux étages complets possibles.
- Hors périmètre : vitres qui éclatent, Hotswitch, campagne, terminal méta, mobile jouable.
- La skill `erom-design` ne s'applique pas à ce projet.
- La planche d'inspiration n'est pas une cible de design.
- Orange `#D97757` réservé à la menace (retour de Claude sur la planche, où câbles et lumières étaient orange ; accepté implicitement par le « ok » sur le morceau 3).

## Questions et réponses

| Question | Réponse |
| :--- | :--- |
| C'est pour quoi, et réussi veut dire quoi ? (A vitrine / B petit jeu) | Vitrine technique d'Opus 5.5, une salle parfaite, avec la liste des écrans. |
| 6 hypothèses (desktop, navigateurs, tokens, Hyperframes, boucle Lyria, mention) | ok sur 1 à 3 ; ajout de la cinématique (4) ; modèle lyria-3.5 (5) ; ligne de crédits exacte (6) ; couleur #D97757 ; nom AGENTHOT. |
| Ennemis : A en code / B modèle 3D animé | A, en code. |
| Contenu de la salle : A serré / B complet | A ; katana et fusil pour la salle 2. |
| Décor : A salle serveurs / B bureau classique ; baies blanches plutôt que noires | A (planche fournie, inspiration seulement). |
| Hauteur : A sol + passerelle ennemis / B deux étages | A. |
| Stack : A Three.js + maison / B Babylon.js / C WebGPU brut | A. |
| Design system du menu : A ADN erom-design sans son code / B erom-design à la lettre | Aucun des deux : un DS propre au jeu. Puis, sur maquettes : B + C. |

## Approches considérées

- **Ennemis.** Choisi : A, faits en code (corps en blocs de verre facetté, animation procédurale). Battu : B, modèle 3D animé libre de droits (facettage, découpe pour l'éclatement et licence à gérer, et message « écrit par Opus » affaibli).
- **Stack.** Choisi : A, Three.js r186 (WebGPURenderer, repli WebGL2 automatique) + simulation maison. Battu : B, Babylon.js 9 (plus lourd, message « Babylon l'a fait ») ; C, WebGPU brut (pas de repli, écran noir chez une partie des visiteurs).
- **Design system.** Choisi : mix B + C. Battu : A Terminal (déjà vu avec piOS, moins de wow) ; B seul et C seul, complémentaires plutôt que rivaux ; erom-design, rejeté par Romain.
- **Contenu de salle.** Choisi : serré. Battu : complet (dilue le « parfait »).
- **Hauteur.** Choisi : sol + passerelle ennemis. Battu : deux étages (chantier « ennemis dans les escaliers »).

## Design approuvé (5 morceaux, chacun validé par « ok »)

1. **Parcours.** Chargement 1 à 2 s (logo en facettes, finit sur « appuie sur une touche », ce qui débloque le son) → cinématique 20 à 30 s, passable, qui masque le chargement du jeu, jouée à la première visite seulement, rejouable depuis le menu → menu (scène 3D vivante derrière, texte animé devant ; Jouer, Salles avec salle 2 verrouillée, Paramètres, Crédits) → salle (Échap pause, mort figée teinte orange puis R en moins de 50 ms, victoire avec replay et « AGENT... HOT... », puis Rejouer / Revoir / Menu). Mobile : écran « Joue sur ordi » avec la cinématique.
2. **Gameplay.** Temps 3 % à l'arrêt, 100 % en marche, environ 15 % en tournant la tête, bref coup d'accélération à l'action, transitions lissées. Commandes ZQSD/WASD, Espace, C, clic gauche, clic droit, E, capture au contact. Pistolet 4 balles sans compteur, clic à vide, balle physique à 45 m/s avec traînée orange. 5 ennemis : 2 dans les allées, 1 sur la passerelle, 2 qui sortent des baies quand il en reste 2. Visée télégraphiée 0,4 s. Objet lancé ou poing : vacille 1,5 s et lâche son arme. Balle ou 2e coup de poing : éclate. Joueur : une touche et il meurt. Replay de tout à vitesse réelle. Objectif : un joueur moyen gagne en moins de 5 essais.
3. **Image et perf.** Décor blanc cassé, contours fins à l'encre, vide bleu nuit, vraies ombres. Orange = menace seulement ; noir mat + liseré clair = ce qu'on prend ; blanc/gris = décor. Glow seulement sur l'orange. 24 à 48 éclats par ennemi. 60 i/s sur Mac M de base, moins de 60 appels de dessin, zéro allocation en jeu, moins de 3 Mo hors cinématique, qualité auto.
   - Design system : B + C. Monolithe (Big Shoulders Display) pour logo, gros titres et replay ; Encre (Chakra Petch, plaques blanches cernées d'encre, coins coupés) pour les panneaux ; Martian Mono pour les petits textes.
4. **Son et assets.** Lyria 3.5 : boucle menu, morceau en jeu qui ralentit avec le temps, morceau de replay avec « AGENT... HOT... » (repli : voix robot en code). Bruitages 100 % en code, 3 couches, asservis au temps. Seedream : textes, écran titre, cartes de cinématique, image d'aperçu du lien. Nano Banana : fonds, textures, vignettes des salles. Cinématique Hyperframes faite à la fin avec de vraies images du jeu. Journal des dépenses, jamais de dépassement sans accord.
5. **Code et tests.** Simulation en TypeScript pur séparée du rendu. Blocs `app`, `sim`, `render`, `audio`, `ui`, `rooms`, `replay`. Une salle = un fichier de données. Tests `bun test` sur la simulation, parties scriptées sans écran, mesure de perf dans le navigateur. Ordre : gris + temps → combat → éclatement + replay → beauté → son → écrans → images + cinématique → perf + mise en ligne. Mise en ligne : site statique, Vercel proposé.

## Points ouverts

- Hébergement : Vercel proposé, à trancher à la fin.
- Nom du repo GitHub (`eRom/XXXXXX`).
- Valeurs réelles de tokens et de coût pour les crédits.
- Réussite de la voix « AGENT... HOT... » via Lyria 3.5 (sinon repli en code).
- Les docs d'idéation (`docs/superpowers/idea/*`) restent la source des chiffres de départ ; la spec prime en cas de conflit.

## Révisions après la spec

2026-09-29, pendant l'écriture du plan 1 (le code de simulation a été prototypé et testé) :

- **AC-1 :** 10 m / 7 s devient 7,9 m / 5 s. Raison : la portée de tir ennemie de 8 m (section 5.6) interdit un tir à 10 m. La vitesse perçue reste la même (1,35 m/s à 3 %).
- **Munitions :** une arme reprise garde ses balles. Raison : un test a montré qu'une arme vide lancée puis rattrapée redevenait pleine, soit des munitions infinies.
- **Arme lancée qui touche un ennemi :** elle tombe à ses pieds au lieu de rebondir vers le joueur. L'arme de l'ennemi part vers celui qui l'a frappé (et non « vers l'arrière »). Raison : sinon le joueur rattrapait sa propre arme vide au lieu de celle de l'ennemi, ce qui cassait la boucle désarmement / capture.
- **Découpage :** l'implémentation est coupée en 3 plans (1 : salle en gris jouable ; 2 : beauté et son ; 3 : écrans, assets, cinématique, mise en ligne), dans l'ordre de fabrication de la spec. Les plans 2 et 3 s'écrivent après le test de sensation du plan 1.
