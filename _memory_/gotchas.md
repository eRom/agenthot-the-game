# Pièges (mis à jour le 2026-09-30)

La liste complète, avec les commandes de contrôle, est dans `.claude/notes/agenthot-pitfalls.md`. Les plus coûteux :

- **GTAO de Three.js r186 refuse une profondeur MSAA en WebGPU** (erreur WGSL `textureGather(texture_depth_multisampled_2d…)`) : l'occlusion lit une passe à part `pass(scene, camera, { samples: 0 })`. Issue three.js 34598, correctif annoncé pour r187.
- **L'arme collée à la caméra assombrissait les baies** via l'occlusion : elle passe sur `NO_OCCLUSION_LAYER`, que la passe d'occlusion ne voit pas.
- **Plafond relevé = caméra d'ombre à revoir** : à `near = 1`, le haut des murs de 7,5 m sortait du champ et laissait un coin sans ombre ; `near = 0.1`.
- **Lumière d'ambiance forte = cristal aplati** : la menace reçoit une part d'ambiance selon l'orientation de ses facettes (`aoNode`).
- **Onglet caché = mesure fausse** : la boucle s'arrête, toute cadence ou capture se lit fenêtre au premier plan. La capture d'écran de l'extension Chrome a son propre cadre de coordonnées (le lire sur une capture entière avant de zoomer).
- **Profil du MCP chrome-devtools partagé entre sessions** : s'il est pris, passer par l'extension claude-in-chrome.
- **`?record=1` : seule la première prise après un chargement est bonne** ; recharger avant chaque prise. Cause non trouvée.
- **Hostinger peut enregistrer un CNAME collé deux fois, et la valeur doublée peut revenir** : vérifier sur `aurora.dns-parking.com` et `nebula.dns-parking.com`, plusieurs lectures, valeur exacte. Un contrôle HTTP ne voit rien (Vercel résout le nom doublé par joker).
- **`vercel link` écrit un `.env.local`** (jeton OIDC) : `.env*` est ignoré ; ne jamais l'ouvrir.
- **Changer de branche est refusé** quand les lignes non commitées de Romain dans `.gitignore` diffèrent entre branches : fusionner par `git fetch . <branche>:main`.
- **Crédits** : 97 % des tokens sont des relectures de cache ; la ligne affichée le dit (décision de Romain, « vitrine opus, autant être honnête »).
- **Jeton WebMCP** : un jeton « tiers » est refusé dans un `<meta>` ; l'essai Chrome couvre les versions 149 à 156 (157 vers le 2026-11-03) [candidat 1x - revue finale 3c, source web].
