# Outils d'écriture de plan (AGENTHOT)

Ces outils ont été écrits par la session claude-apollon-p0jv pour le plan 2, le 2026-09-29. Ils ont été mis à l'abri ici, car leur copie d'origine vivait dans un scratchpad éphémère (`/private/tmp`).

## À quoi ils servent

Ils appliquent la méthode « code prototypé puis inséré dans le plan » :

- **`gen-plan.py`** : génère le plan depuis un gabarit. Il remplace chaque marqueur par le contenu réel d'un fichier du prototype : fichier entier pour un fichier nouveau, `git diff` pour un fichier modifié.
- **`staged-check.sh`** : rejoue le prototype tâche par tâche dans un dossier vide. Il vérifie que les tests de chaque tâche échouent avant son code et passent après, avec `tsc` à chaque étape.
- **`replay-plan.py`** : rejoue le plan à la lettre. Il recopie les fichiers et applique les diffs, puis vérifie que l'arbre obtenu est identique au prototype.

## Avant de les réutiliser

- Les chemins sont écrits en dur. La variable `S` pointe vers le scratchpad de la session d'origine : adapte-la au tien.
- Adapte aussi la liste des fichiers par tâche.

## Sondes associées

`../agenthot-probes/` contient les réponses de sondes gratuites citées dans le brief du plan 3 : liste des modèles Gemini, endpoints OpenRouter, erreur Lyria sans prompt.
