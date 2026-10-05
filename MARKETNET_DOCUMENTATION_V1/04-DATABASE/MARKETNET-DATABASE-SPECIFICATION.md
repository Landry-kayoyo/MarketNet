# MARKETNET — Base de données

## Entités de départ
users, shops, products, product_images, categories, product_variants, product_specs, orders, order_items, messages, reviews, analytics_events, notifications, roles, permissions.

## Principes
Chaque entité doit avoir un identifiant, les timestamps nécessaires, les contraintes et index utiles.

## Relations principales
Les comptes et rôles concernent les commerçants et administrateurs; le client n’a pas de compte MARKETNET. Une commande invitée conserve les coordonnées client et ses lignes, avec `userId` nul. Un commerçant gère sa boutique selon les règles retenues. Une boutique possède des produits. Un produit peut avoir plusieurs images, variantes et spécifications. Les avis et événements sont rattachés aux ressources concernées.

## Prototype
La V1 utilise des données JavaScript et du stockage navigateur pour la démonstration. Cela doit être remplacé par une persistance réelle.

## Rôles authentifiés
Seuls `merchant` et `admin` sont des rôles utilisateur. Le client peut consulter, constituer un panier et commander sans inscription ni connexion.

## Validation
Les statuts de commande et les règles de propriété s’appliquent aux comptes commerçant/admin; le checkout invité est validé côté serveur sans compte client.
