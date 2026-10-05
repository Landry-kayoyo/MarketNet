# MARKETNET — Sécurité et permissions

## Principes
Authentification sécurisée, autorisation côté serveur, moindre privilège, validation des entrées, protection des secrets, HTTPS en production, sessions/tokens sécurisés et journalisation.

## Rôles
Les rôles authentifiés sont commerçant et administrateur. Le client est un visiteur non authentifié : il peut parcourir la marketplace et transmettre une commande invitée sans créer de compte.

## Données
Les ressources privées doivent être protégées par propriétaire et permissions.

## Fichiers
Les images et fichiers doivent être contrôlés par type, taille, propriétaire et accès.

## API
Chaque route protégée vérifie l’identité et la permission côté serveur. Le checkout invité est public, valide côté serveur produits, visibilité, prix et stock, et ne requiert aucun jeton client.

## Tests
Prévoir des tests d’accès interdit, données invalides, sessions, fichiers et endpoints sensibles.
