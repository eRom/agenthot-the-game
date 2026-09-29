# SUPERHOT Clone Web (ClaudeHot) - Spécifications Détaillées du Gameplay

## 1. La Boucle Moment-to-Moment (M2M)

La dynamique seconde par seconde de SUPERHOT repose sur une cadence cyclique en 5 temps :

```
    ┌─────────────────────────────────────────────────────────────┐
    │ 1. ÉVALUATION (Temps figé ~3%)                              │
    │    Identifier les lignes rouges de tir, localiser l'ennemi  │
    │    le plus proche et les objets interactifs.                │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 2. MICRO-DÉPLACEMENT (Temps semi-dilaté ~30%)               │
    │    Décaler le pas de 15 cm pour laisser passer une balle à  │
    │    hauteur d'épaule.                                        │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 3. NEUTRALISATION (Temps accéléré 100%)                     │
    │    Tirer une cartouche, asséner un coup de poing ou lancer  │
    │    un objet contondant.                                     │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 4. RÉCOLTE & DÉSARMEMENT (Temps en vol)                     │
    │    Attraper au vol l'arme éjectée des mains de l'adversaire │
    │    frappé.                                                  │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ 5. PIVOT TACTIQUE                                           │
    │    Réaligner la vue vers la prochaine menace entrante.      │
    └─────────────────────────────────────────────────────────────┘
```

---

## 2. Locomotion et Contrôle du Personnage

Le joueur est contrôlé via le mode PointerLock standard du navigateur (capture exclusive du curseur souris) associé aux touches clavier conventionnelles :

| Action | Touche | Comportement physique | Impact sur le temps |
| :--- | :--- | :--- | :--- |
| **Déplacement** | `Z Q S D` / `W A S D` | Vitesse de marche constante : $4.2 \text{ m/s}$. Pas d'accélération inertielle excessive pour conserver une précision chirurgicale. | $T_{scale} \to 1.0$ instantanément durant la pression. |
| **Regard / Visée** | Souris (X / Y) | Sensibilité brute sans lissage logiciel pour un alignement au millimètre. | $T_{scale} \approx 0.10 - 0.20$ proportionnel à la vitesse angulaire. |
| **Saut** | `Espace` | Impulsion verticale franche ($v_y = 5.5 \text{ m/s}$). Permet de sauter par-dessus les balles basses. | $T_{scale} = 1.0$ pendant toute la phase ascendante. |
| **Accroupissement** | `Ctrl` / `C` | Abaissement de la caméra de $1.70 \text{ m}$ à $0.85 \text{ m}$. Permet d'éviter un tir horizontal à hauteur de tête. | $T_{scale} \approx 0.5$ lors de la transition. |

---

## 3. Balistique Physique : Zéro Hitscan

Le hitscan (calcul instantané d'un rayon linéaire infini) est formellement interdit dans le moteur de combat. **Toute balle est une entité physique simulée dans l'espace 3D.**

### A. Anatomie d'un projectile
Chaque projectile est composé de :
1. **Une tête perforante** : Petite sphère ou losange noir mat de rayon $r = 0.04 \text{ m}$.
2. **Une traînée lumineuse vectorielle** : Un cylindre/ruban rougeoyant étiré le long du vecteur vitesse négatif ($-\vec{v}$). Cette traînée matérialise le faisceau de trajectoire sur 2 à 4 mètres, permettant au joueur de percevoir instantanément si la balle va le croiser ou le toucher.
3. **Une vitesse réelle calibrée** :
   $$v_{bullet} = 45.0 \text{ m/s}$$
   En temps dilaté ($T_{scale} = 0.03$), la vitesse effective perçue n'est que de $1.35 \text{ m/s}$, soit environ la vitesse d'un piéton. Le joueur peut donc littéralement observer la balle fendre l'air et s'écarter d'un simple pas de côté.

### B. Détection de collision continue (CCD)
Pour éviter le passage à travers les murs ou les cibles lors des phases à pleine vitesse ($T_{scale} = 1.0$), le système utilise un raycast continu entre la position de la frame précédente $\vec{P}(t-1)$ et la position actuelle $\vec{P}(t)$ :
$$\vec{ray} = \vec{P}(t) - \vec{P}(t-1)$$
Si une intersection est détectée avec un collider joueur, ennemi ou environnement, l'impact est résolu au point exact de contact.

---

## 4. Arsenal et Mécaniques d'Armes

L'arsenal est volontairement restreint pour maximiser la clarté et la différenciation tactique :

### A. Le Pistolet Noir (Pistol)
- **Capacité** : 4 cartouches.
- **Cadence** : 1 tir toutes les 0.45 secondes (temps normal).
- **Dispersion** : Nulle (trajectoire parfaitement rectiligne).
- **Rôle** : L'arme de précision par excellence. Élimine une cible lointaine en un coup.

### B. Le Fusil à Pompe (Shotgun)
- **Capacité** : 2 cartouches.
- **Dispersion** : Éventail conique de 8 plombs projetés simultanément.
- **Portée utile** : Courte et moyenne distance.
- **Rôle** : Arme d'arrêt massif. Crée un mur de plombs infranchissable dans un couloir étroit.

### C. Le Fusil d'Assaut (Rifle)
- **Capacité** : 3 rafales de 3 balles (9 cartouches au total).
- **Dispersion** : Légère instabilité verticale simulée par un recul progressif.
- **Rôle** : Saturation d'espace pour abattre plusieurs cibles en mouvement.

### D. Le Katana (Arme Blanche Ultime)
- **Capacité** : Utilisable à l'infini tant qu'il est en main.
- **Mécanique spéciale 1 : Tranchage de balle** : Frapper une balle en vol coupe le projectile en deux et l'annule complètement.
- **Mécanique spéciale 2 : Bissection de l'ennemi** : Séparation physique du corps adverse en deux moitiés selon l'axe de la lame.

### E. Objets Contondants Improvisés
- Bouteilles de verre, tasses à café, écrans cathodiques, extincteurs, boules de billard.
- Tous ces objets peuvent être ramassés en main et projetés sur un ennemi pour le neutraliser.

---

## 5. La Boucle Reine : Lancer, Désarmement et Capture en Vol

La mécanique la plus grisante de SUPERHOT est l'enchaînement de désarmement :

```
     [ ARME VIDE EN MAIN ]
               │
               ▼  (Clic Droit : Lancer d'objet)
     [ PROJECTION DE L'ARME ] (Vélocité 22 m/s)
               │
               ▼
     [ IMPACT SUR LE VISAGE DE L'ENNEMI ]
               │
               ├─────────────────────────┐
               ▼                         ▼
     [ ENNEMI DÉSORIENTÉ ]     [ ARME ENNEMIE ÉJECTÉE ]
     (Stagger pendant 1.5s)     (Propulsion parabolique en l'air)
                                         │
                                         ▼
                               [ JOUEUR AVANCE & CAPTURE ]
                               (Touche 'E' ou collision directe)
                                         │
                                         ▼
                               [ NOUVELLE ARME PRÊTE À TIRER ]
                               (Chambre pleine, tir immédiat)
```

Cette chorégraphie transforme l'absence de munitions en un tremplin offensif : vider son arme n'est jamais une punition, c'est l'amorce d'une nouvelle opportunité d'élimination acrobatique.

---

## 6. Système de Fracturation Cristalline (Shatter FX)

Lorsqu'un ennemi est touché par un projectile létal ou un coup critique, il ne s'effondre pas comme un pantin de chair : **il explose en centaines d'éclats de verre rouge facetté**.

### Implémentation Web Performante :
1. **Modèle Low-Poly Segmenté** : L'ennemi est modélisé sous forme de polygones rigides sans lissage (Flat Shading) avec une texture de cristal rouge translucide et des arêtes luminescentes (Glow pass).
2. **Éclats Instanciés (`InstancedMesh`)** :
   - Au moment de l'impact, le maillage principal de l'ennemi est masqué.
   - Un groupe de 24 à 48 fragments pyramidaux ou triangulaires prédécoupés est activé à partir de la position de chaque membre (tête, torse, bras, jambes).
   - Chaque éclat reçoit une impulsion cinétique directionnelle :
     $$\vec{v}_{shard} = \vec{v}_{impact} \times 0.6 + \vec{n}_{random} \times \sigma_{blast}$$
3. **Gestion du cycle de vie des débris** :
   - Les éclats sont soumis à la gravité et rebondissent légèrement sur le sol blanc.
   - Leur mouvement est ralenti par le $T_{scale}$ global.
   - Dès l'arrêt de leur mouvement, ils se figent pour libérer le processeur physique.

---

## 7. Mécanique Avancée : Le Hotswitch (Transfert Corporel)

Introduit dans les niveaux plus avancés, le **Hotswitch** élève la stratégie à son paroxysme :
- **Activation** : En maintenant le regard sur un ennemi distant et en pressant une touche dédiée (`F` ou bouton central de la souris).
- **Effet** :
  1. Le temps ralentit à l'extrême ($T_{scale} \to 0.005$).
  2. L'âme du joueur est transférée instantanément dans l'enveloppe de l'ennemi ciblé.
  3. L'ancien corps du joueur est pulvérisé dans une déflagration de verre.
  4. L'arme précédemment tenue par l'ennemi est désormais dans les mains du joueur.
- **Contrainte de gameplay** : Un temps de recharge (cooldown) de 5 secondes en temps réel pour empêcher l'abus et forcer le joueur à choisir judicieusement sa nouvelle enveloppe.
