# MSA Link Sharer

Extension Chrome pour les Microsoft Student Ambassadors (parcours *Community Influencer*).
Elle ajoute automatiquement ton **Contributor ID** aux liens Microsoft éligibles et garde un
historique des ressources que tu as apprises/partagées.

## Ce qu'elle fait

1. Récupère l'URL de l'onglet actif.
2. Supprime le segment de langue-locale s'il existe (`en-us/`, `fr-fr/`, etc.).
3. Ajoute ton Contributor ID à la fin :
   - `?wt.mc_id=studentamb_######` si l'URL n'a pas encore de paramètre,
   - `&wt.mc_id=studentamb_######` si l'URL contient déjà un `?` (donc un autre `mc_id`).
4. Te permet de copier le lien, de le sauvegarder dans une liste, ou de le partager
   directement sur X / LinkedIn.
5. Garde un historique local (exportable en CSV) de toutes les ressources sauvegardées.

## Installation (mode développeur)

1. Décompresse le dossier `ms-student-amb-extension`.
2. Ouvre Chrome et va sur `chrome://extensions`.
3. Active le **Mode développeur** (en haut à droite).
4. Clique sur **Charger l'extension non empaquetée**.
5. Sélectionne le dossier `ms-student-amb-extension`.
6. Épingle l'extension dans la barre d'outils (icône puzzle 🧩 → épingle).

## Configuration

1. Clique sur l'icône de l'extension.
2. Entre ton **Contributor ID** (format `studentamb_######`, disponible sur ton dashboard Ambassador).
   Il est sauvegardé automatiquement et synchronisé entre tes appareils Chrome connectés.

## Utilisation

1. Va sur une page Microsoft Learn / Docs / TechCommunity / DevBlogs que tu veux partager.
2. Clique sur l'icône de l'extension.
3. Le lien avec ton Contributor ID est généré automatiquement.
4. Copie-le, sauvegarde-le dans ta liste, ou partage-le directement sur X/LinkedIn.

## Remarque

L'extension avertit (⚠️) si l'URL ne semble pas provenir d'un domaine Microsoft connu,
mais te laisse quand même générer et copier le lien — vérifie toujours l'éligibilité
du contenu selon les règles du programme.
