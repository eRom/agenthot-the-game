# SUPERHOT Clone Web (ClaudeHot) - Sound Design & Architecture Web Audio

## 1. Philosophie Acoustique : L'Élasticité Temporelle du Son

Dans SUPERHOT, le son n'est pas une simple couche décorative : il constitue le baromètre physique du temps et un radar spatial de survie.

```
       [ TEMPS RALENTI (T_scale ~ 0.03) ]           [ TEMPS NORMAL (T_scale = 1.0) ]
       ─────────────────────────────────           ────────────────────────────────
       - Silence oppressant et feutré              - Déflagrations percutantes
       - Filtre passe-bas étouffant (< 400 Hz)     - Spectre audio grand ouvert (20 kHz)
       - Drone sub-basse continu (45 Hz)           - Claquements métalliques vifs
       - Traînées de balles étirées (whoosh)       - Impacts cristallins instantanés
```

Cette dualité acoustique crée un contraste saisissant : le joueur passe en un clin d'œil d'un sanctuaire méditatif d'évaluation tactique à une tempête assourdissante de violence mécanique.

---

## 2. Architecture Technique Web Audio API (Pur Web)

Pour satisfaire l'exigence de zéro dépendance lourde et de réactivité absolue, le moteur audio s'appuie directement sur la **Web Audio API native** des navigateurs modernes.

### A. Graphe de Traitement Audio Modulaire

```
┌────────────────────────────────────────────────────────┐
│ Audio Sources :                                        │
│  - Sound FX Samples (Opus / WebM décompressés)         │
│  - Synthèse Procédurale (Oscillateurs, Générateurs)    │
└───────────────────────────┬────────────────────────────┘
                            │ playbackRate = f(T_scale)
                            ▼
┌────────────────────────────────────────────────────────┐
│ PannerNode (Spatialisation 3D HRTF)                    │
│  - Positionnement XYZ de la balle, de l'ennemi         │
│  - Distance model : inverse exponentiel                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ BiquadFilterNode (Dynamic Low-Pass Filter)             │
│  - Fréquence de coupure : 350 Hz (quand T_scale = 0.03)│
│  - S'ouvre jusqu'à 20 000 Hz (quand T_scale = 1.0)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Master Convolver / Reverb & DynamicsCompressor         │
│  - Évite la saturation lors des tirs multiples         │
│  - Réverbération sèche de type "pièce blanche béton"   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ AudioContext.destination (Haut-parleurs / Casque)      │
└────────────────────────────────────────────────────────┘
```

### B. Modulation Dynamique en Temps Réel
Chaque son joué en boucle ou déclenché au cours de la simulation voit ses paramètres mis à jour à chaque frame en fonction du `timeScale` :

1. **Vitesse de lecture et Hauteur tonale (`playbackRate` & `detune`)** :
   $$playbackRate = \text{clamp}(0.20, 1.0, T_{scale})$$
   Ralentir la lecture fait chuter les tirs dans le registre des infra-basses, transformant un simple coup de feu en une sourde onde de choc tellurique.
2. **Filtrage passe-bas asservi au temps** :
   $$f_{cutoff} = 300 + 19700 \times (T_{scale})^2$$
   L'utilisation d'une courbe quadratique garantit que dès que le joueur s'arrête, les aigus disparaissent instantanément pour plonger le joueur dans une bulle sous-marine anxiogène.

---

## 3. Les Six Piliers de la Palette Sonore

### A. L'Atmosphère de Dilatation (Le Silence Anxiogène)
- **Le Drone Sub-Basse** : Un oscillateur à onde sinusoïdale pure à $45 \text{ Hz}$, enrichi d'un léger battement de modulation à $1.5 \text{ Hz}$. Il s'amplifie doucement lorsque le joueur s'immobilise pour figurer la concentration extrême.
- **La Respiration / Battement Sourd** : Un battement feutré à très basse fréquence simulant le pouls du joueur, rappelant que chaque seconde écoulée est comptée.

### B. Les Tirs et Détonations d'Armes à Feu
- **À vitesse normale** : Une attaque ultra-courte (transitoire d'impact de 15 ms), un punch percutant dans les 100-200 Hz, suivi d'une courte résonance métallique à haute fréquence.
- **En temps dilaté** : L'attaque est étalée sur 400 ms. Elle sonne comme un grondement d'orage lointain ou une décompression d'air comprimé massive.

### C. Le Frôlement de Balle (Bullet Flyby & Spatialisation 3D)
- **Rôle tactique critique** : Lorsqu'un projectile ennemi passe à moins de 60 centimètres de la tête du joueur sans le toucher, un effet Doppler ultra-rapide retentit dans l'écouteur correspondant (gauche ou droite).
- **Son** : Un sifflement d'air pressurisé aigu et agressif (bruit blanc modulé en bande étroite par un filtre passe-bande à $3.2 \text{ kHz}$).
- **Résultat** : Le joueur sait immédiatement, sans même se retourner, qu'un tireur vient de faire feu dans son dos.

### D. La Pulvérisation Cristalline (Shatter FX)
- **Règle absolue** : Aucun son viscéral, organique ou sanglant. L'univers est pur et minéral.
- **Son d'impact** : Un claquement net et sec rappelant un verre en cristal de Bohème frappé par une massue, suivi d'une cascade de minuscules tintements métalliques aigus lorsque les débris touchent le sol carrelé.

### E. Le Clic à Vide (Dry Fire)
- **Rôle psychologique** : L'arme n'a plus de munitions.
- **Son** : Un clic mécanique double ("Tch-k"), aigu, métallique, sec et sans écho.
- **Impact joueur** : C'est le signal sonore de rupture qui brise le plan du joueur et déclenche immédiatement la décision de jeter l'arme au visage de l'ennemi.

### F. Le Mantra de Victoire ("SUPER... HOT...")
- **Déclenchement** : Lors du lancement du replay accéléré à la fin du niveau.
- **Signature vocale** : Une voix robotique masculine grave, passée au vocoder et bitcrushée en 8-bit, scandant sur un tempo métronomique lourd :
  - **"SU-PER"** (Temps 1, avec écho stéréo ping-pong)
  - **"HOT"** (Temps 2, avec décroissance grave)
- Ce mantra martèle la victoire et confère au joueur un sentiment de toute-puissance hypnotique.

---

## 4. Stratégie Procédurale vs Échantillons (Poids Plume < 1 Mo)

Pour maintenir l'application dans son budget ultra-léger et garantir un chargement instantané en 4G/5G :

| Élément sonore | Technique de production | Coût en bande passante |
| :--- | :--- | :--- |
| **Drone de fond & Tension** | Synthétisé en temps réel via `OscillatorNode` + `GainNode` | 0 ko (pur code JavaScript) |
| **Bruits de passage de balle (Flybys)** | Synthétisé via `AudioBuffer` de bruit blanc procédural filtré | 0 ko |
| **Clics d'interface et d'armes vides** | Synthèse FM simple (sinusïde percussive à modulation de pitch) | 0 ko |
| **Coups de feu (Pistol, Shotgun, Rifle)** | 3 micro-échantillons compressés en WebM / Opus 96 kbps | ~80 ko |
| **Bris de verre et impacts cristallins** | 4 variations de bris de cristal compressées | ~120 ko |
| **Voix "SUPER HOT" du replay** | 2 phonèmes ("SUPER", "HOT") pré-vocodés | ~60 ko |
| **Total du sous-système audio** | **Mix hybride procédural / échantillonné** | **Moins de 300 ko au total** |

---

## 5. Gestion des Contraintes Navigateur (AudioContext Unlock)

Les navigateurs modernes interdisent la lecture audio automatique avant la première interaction de l'utilisateur :
- **Implémentation propre** : L'interface de démarrage type terminal DOS invite l'utilisateur à appuyer sur une touche ou à cliquer pour lancer la session (`PRESS ANY KEY TO BOOT SYSTEM`).
- Cet événement utilisateur débloque instantanément l'`AudioContext` en état `running`, garantissant une synchronisation audio parfaite dès la première frame de gameplay.
