# MARKETNET — Règles métier

## Utilisateurs
Les accès dépendent du rôle et des permissions. Les données privées d’un commerçant ne sont pas accessibles à un autre commerçant.

## Boutiques
Une boutique possède un propriétaire/gestionnaire, un statut et des informations publiques.

## Produits
Un produit appartient à une boutique. Sa visibilité dépend de son statut. Les données critiques, prix et stocks sont validés côté serveur.

## Commandes
Une commande conserve un état cohérent et son montant est calculé côté serveur.

## Avis
Les avis respectent les autorisations et les règles de modération.

## Analytics
Les événements analytiques ne doivent pas contourner les permissions.

## Non-régression
Un agent ne retire pas une fonctionnalité validée hors de son périmètre sans décision explicite.

## Mémoire obligatoire
Une mission n’est pas terminée tant que son compte rendu n’est pas enregistré dans la mémoire du projet.
