# Notes de conception de la base de données

Le schéma de données doit refléter les objets documentés dans la V1 et dans les specs du projet.

## Entités de référence

- users
- shops
- products
- product_images
- categories
- product_variants
- product_specs
- orders
- order_items
- messages
- reviews
- analytics_events
- notifications
- roles
- permissions

## Règles de conception

- Chaque entité possède un identifiant unique, timestamps et index utiles.
- Les accès et permissions sont gérés par propriétaire et rôle.
- Les images et fichiers sont enregistrés dans un objet de stockage et référencés par le backend.
- Les états de commande et les statuts de produits doivent être normalisés dans des tables ou enum dédiés.
- Les actions d’analytics et les messages sont stockés avec des métadonnées de traçabilité.
