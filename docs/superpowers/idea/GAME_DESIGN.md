# SUPERHOT Clone Web (ClaudeHot) - Game Design & Mécaniques Fondatrices

## 1. Philosophie et Cœur de Jeu : Le Puzzle Déguisé en FPS

SUPERHOT subvertit le genre du jeu de tir à la première personne en transformant un exercice de motricité réflexe en un problème d'optimisation spatio-temporelle. 

Dans un shooter conventionnel :
- La décision doit être prise en une fraction de seconde sous peine de mort.
- Le joueur subit la physique du monde à vitesse fixe.

Dans SUPERHOT :
- Le joueur devient le maître d'œuvre du temps.
- Chaque mouvement est un coût, chaque arrêt est une opportunité de calcul.
- Le niveau est une énigme déterministe où la solution parfaite consiste à orchestrer une chorégraphie d'esquives, de tirs et de désarmements.

---

## 2. Le Modèle Mathématique de la Dilatation Temporelle

Le cœur du moteur repose sur une règle simple : **le temps ne s'arrête jamais totalement**, mais il ralentit à un niveau presque statique lorsque le joueur ne produit aucun mouvement.

### A. Les composantes de l'activité du joueur
Le facteur d'accélération temporelle $T_{scale} \in [T_{min}, 1.0]$ est calculé à chaque frame en agrégeant trois sources d'entrées :

1. **Déplacement linéaire du joueur (clavier WASD / Joystick)** :
   $$\alpha_{move} = \frac{\|\vec{v}_{player}\|}{v_{max}}$$
   Si le joueur sprinte ou marche, $\alpha_{move} \to 1.0$.

2. **Rotation de la caméra (mouvement de la souris)** :
   Bouger la tête permet d'observer la scène, mais coûte une légère fraction de temps :
   $$\alpha_{look} = \min\left(1.0, \frac{|\Delta x_{mouse}| + |\Delta y_{mouse}|}{\theta_{threshold}}\right) \times w_{look}$$
   Où $w_{look} \approx 0.15$ (la rotation de caméra accélère le temps beaucoup moins que la course).

3. **Impulsion d'action (Tir, Lancer d'objet, Frappe au poing, Saut)** :
   Déclencher une action génère un boost instantané $\alpha_{action} = 1.0$, qui décroît exponentiellement sur 150 à 250 millisecondes.

### B. Formule finale et lissage
$$T_{raw} = \max\left(T_{min}, \min\left(1.0, \alpha_{move} + \alpha_{look} + \alpha_{action}\right)\right)$$

Avec les paramètres calibrés :
- $T_{min} = 0.03$ (soit 3% de la vitesse réelle, maintenant un glissement inexorable des balles).
- Pour éviter les à-coups visuels, on applique une interpolation exponentielle :
  $$T_{scale}(t) = \text{lerp}\left(T_{scale}(t-1), T_{raw}, 1 - e^{-\lambda \cdot \Delta t_{real}}\right)$$
  avec $\lambda \approx 12$ pour un amorti élastique sans latence perçue.

---

## 3. Communication Visuelle et Règle du "Zéro HUD"

Comme l'explique Eric dans son analyse, SUPERHOT pousse l'épuration à l'extrême en intégrant toute l'information critique directement dans l'univers 3D (information diégétique).

### A. La Trinité Chromatique Stricte
Toute présence visuelle superflue est bannie. Seules trois teintes existent :

| Teinte | Entités associées | Message cognitif pour le joueur |
| :--- | :--- | :--- |
| **Blanc pur / Gris béton clair** | Murs, sols, plafonds, piliers, mobilier de décor | Espace neutre, sans danger, propice au repérage des ombres. |
| **Noir mat anguleux** | Armes à feu, katanas, bouteilles, extincteurs, poings | Éléments interactifs et utilisables immédiatement. |
| **Rouge vif / Orange cristallin** | Ennemis humanoïdes, balles, lasers de visée, éclats | Danger létal immédiat. Priorité absolue de ciblage. |

### B. Suppression totale des jauges traditionnelles
1. **Santé binaire (One Hit, One Kill)** :
   - Le joueur ne possède aucune barre de vie. S'il est effleuré par une seule balle ou un coup de poing ennemi, il explose instantanément en éclats de verre.
   - Idem pour les ennemis : une balle ou un coup tranchant les pulvérise sur le coup.
2. **Gestion des munitions sans compteur** :
   - Aucun chiffre à l'écran n'indique les cartouches restantes.
   - Le joueur doit retenir mentalement ses tirs (ex: 4 coups pour un pistolet).
   - S'il tente de faire feu alors que le chargeur est vide, l'arme émet un clic sec caractéristique et l'absence de recul force une réaction immédiate (lancer l'arme vide au visage de l'assaillant).
3. **Indicateur de rechargement diégétique** :
   - Plutôt que d'afficher une barre de progression de cadence de tir, l'animation de l'arme ou du réticule effectue une rotation à 180 degrés pour signaler qu'un nouveau projectile est chambré.

---

## 4. Psychologie et Comportement de l'Ennemi (IA Cristalline)

Les ennemis ne sont pas de simples cibles d'entraînement : ils créent la contrainte spatiale qui force le joueur à se déplacer constamment.

```
       [ SPAWN / ENTRÉE ]
               │
               ▼
       [ DÉTECTION DU JOUEUR ] (Raycast Line-of-Sight)
               │
               ├─────────────────────────┐
               ▼                         ▼
      [ DISTANCE > 8m ]          [ DISTANCE <= 8m ]
       Avancée en ligne           Alignement de tir
       vers le joueur             (Télégraphie laser rouge)
               │                         │
               │                         ▼
               │                  [ DÉCLENCHEMENT DU TIR ]
               │                  (Balle réelle instanciée)
               │                         │
               ▼                         ▼
      [ RECHARGEMENT / COOLDOWN ] ◄──────┘
      (Poursuite ou maintien de position)
```

### Règles de conception de l'IA :
1. **Télégraphie impérative** :
   - Un ennemi ne tire jamais instantanément sans avertissement visuel.
   - Il lève son arme et aligne un fin faisceau rouge vers la position future du joueur pendant une durée équivalente à 0.4 seconde en temps réel.
   - Cela laisse au joueur le temps de lire l'intention de tir et de modifier sa trajectoire.
2. **Balistique d'interception** :
   - Les ennemis calculent un vecteur prédictif simple vers le torse du joueur.
   - La dispersion est calibrée pour créer des motifs d'encerclement : deux ennemis tirant simultanément forcent le joueur à plonger ou à sauter entre les deux lignes de trajectoire.
3. **État de vulnérabilité (Stagger)** :
   - Lorsqu'un ennemi reçoit un projectile contondant (tasse, pistolet vide, bouteille) ou un coup de poing, il est désorienté.
   - Son arme est éjectée en l'air avec une force physique et son animation de tir est annulée pendant 1.5 seconde.

---

## 5. Boucle d'Échec et Récompense : "Fail Fast, Feel God"

L'attrait addictif de SUPERHOT repose sur l'alternance entre une réflexion millimétrée et l'explosion de puissance cinématique :

### A. La punition instantanée
- La mort survient par surprise au détour d'un angle mort. L'écran se fige avec un filtre monochrome rougeoyant et un son de verre brisé.
- Une pression sur la touche `R` ou un clic réinitialise le niveau en moins de 50 millisecondes, sans transition superflue. Le joueur rejoue immédiatement la scène en corrigeant son angle d'approche.

### B. Le Replay à vitesse réelle (La Récompense Suprême)
Lorsque le dernier ennemi vole en éclats, le jeu bascule en mode cinématique :
- La caméra rejoue l'intégralité de la séquence du point de vue du joueur, mais **à vitesse réelle (100% sans aucun ralenti)**.
- Le puzzle laborieux où le joueur a passé deux minutes à avancer centimètre par centimètre devient soudainement une scène de fusillade fulgurante de 4 secondes, fluide et surhumaine digne d'un film d'action.
- Pendant le replay, la typographie monumentale envahit l'écran au rythme d'un battement synthétique hypnotique :
  **"SUPER... HOT... SUPER... HOT..."**

---

## 6. Méta-Narration et Interface Diégétique (DOS Terminal)

Pour renforcer la dimension psychologique mise en avant dans la vidéo source, le jeu ne dispose pas d'un menu principal conventionnel :
- Le joueur démarre devant un terminal en mode texte rétro (type MS-DOS / piOS) sur fond noir avec une police verte ou ambrée à balayage cathodique.
- Il navigue dans un système de fichiers virtuel et lance un exécutable piraté transmis par un mystérieux interlocuteur sur un canal IRC fictif.
- Au fil des niveaux, le système commence à afficher des anomalies, des messages subliminaux ("MIND IS SOFTWARE", "BODY IS DISPOSABLE") et à questionner l'emprise du programme sur l'esprit du joueur.
