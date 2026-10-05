# MARKETNET — Architecture technique

## 1. Objectif
Transformer la V1 HTML en application réelle, maintenable et évolutive, sans perdre le comportement validé, la structure visuelle ni les parcours utilisateur définis dans la maquette et dans les spécifications fonctionnelles.

La V1 est la référence fonctionnelle et visuelle. Elle couvre les parcours publics et commerçants suivants : accueil, recherche, boutiques, fiches produits, panier, commande, espace commerçant, gestion de catalogue, messages, avis, analytics, personnalisation de boutique et paramètres.

## 2. Contraintes du projet

Les documents officiels fixent les contraintes suivantes :
- la V1 HTML est la référence pour les écrans et les interactions ;
- toute fonctionnalité réelle doit être reliée aux données, règles métier, API et parcours correspondants ;
- le backend doit être la source de vérité pour validation, sécurité et permissions ;
- les fichiers et images doivent être contrôlés par type, taille, propriétaire et accès ;
- les rôles authentifiés sont commerçant et administrateur ; le client reste un visiteur sans compte ;
- l’architecture doit être prête pour les phases suivantes sans refonte fondamentale.

Le dossier officiel ne prescrit pas un framework exact pour le frontend et le backend. Il est donc nécessaire de choisir un socle technique explicite, cohérent avec l’écosystème web professionnel et compatible avec la V1. Le choix retenu ci-dessous est donc une décision architecture officielle pour le projet, non une substitution arbitraire des spécifications.

## 3. Stack technique retenue

### Frontend
- Next.js 14
- React 18
- TypeScript
- App Router
- Tailwind CSS ou design tokens à définir dans la Phase 2

### Backend
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL 16

### Sécurité
- JWT + refresh tokens
- RBAC et contrôle d’accès basé sur le propriétaire des ressources
- validation des entrées côté serveur
- HTTPS en production
- header sécuritaires, rate limiting et logging

## 4. Architecture générale

Le système est composé de 3 couches :
1. Couche présentation (frontend MarketNet)
2. Couche application / API (backend NestJS)
3. Couche données (PostgreSQL + Prisma)

La relation entre ces couches est la suivante :
- le frontend ne stocke pas les données d’affaires ; il consomme l’API ;
- le backend exécute les règles métier et les permissions ;
- la base de données stocke les ressources persistantes ;
- les fichiers média et les ressources documentaires sont gérés côté serveur selon les règles métier et de sécurité ;
- les événements et les logs sont centralisés côté backend.

## 5. Organisation du projet

```text
MARKETNET/
├─ apps/
│  ├─ web/                       # Frontend Next.js
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ features/
│  │  ├─ lib/
│  │  ├─ styles/
│  │  └─ public/
│  └─ api/                       # Backend NestJS
│     ├─ src/
│     │  ├─ app/
│     │  ├─ auth/
│     │  ├─ shops/
│     │  ├─ products/
│     │  ├─ orders/
│     │  ├─ messages/
│     │  ├─ reviews/
│     │  ├─ analytics/
│     │  ├─ admin/
│     │  └─ common/
├─ packages/
│  └─ shared/                    # DTOs, enums et types partagés
├─ database/
│  ├─ schema/
│  ├─ migrations/
│  └─ seeds/
├─ .env.example
├─ README.md
└─ package.json
```

Cette organisation est volontairement divisible par domaines fonctionnels et ouvre un espace de croissance sans réécrire le socle.

## 6. Frontend : adaptation de la V1

### Objectif
Adapter les écrans de la V1 à un frontend réel sans perdre l’identité du produit ni les interactions validées.

### Correspondance V1 → modules frontend
- Accueil -> `features/marketplace/home`
- Boutique -> `features/marketplace/store`
- Produit -> `features/marketplace/product`
- Panier / checkout -> `features/cart`
- Espace commerçant -> `features/merchant`
- Produits / commandes / messages -> `features/merchant/*`
- Analytics -> `features/merchant/analytics`
- Avis -> `features/merchant/reviews`
- Paramètres / boutique -> `features/merchant/settings`
- Authentification -> `features/auth`

### Règles d’intégration
- Les écrans de la V1 restent la référence visuelle.
- Les composants sont découpés par domaine, pas par écran unique.
- Les interactions qui manipulent des données passent par les services API.
- Le client frontend n’exécute jamais la logique métier critique.

## 7. Backend : architecture applicative

Le backend est centré sur les domaines fonctionnels définis par les docs.

### Domaines applicatifs
- `auth`: connexion commerciale, sessions, JWT, rôles, permissions
- `users`: profils, comptes et données associées
- `shops`: création, publication, personnalisation, visibilité, propriété
- `products`: catalogue, variantes, prix, stock, images, spécifications
- `orders`: commandes, lignes commande, statut, historique
- `messages`: conversations client-commerçant
- `reviews`: avis, notation, publication
- `analytics`: événements, chiffres d’activité, agrégats dashboard
- `admin`: supervision globale, validation, modération, reporting

### Modèle d’implémentation backend
Chaque module contient :
- contrôleurs
- services
- repositories / accès données
- DTOs de validation
- filtres et garde d’authentification
- événements ou jobs si nécessaire

Ce découpage permet d’ajouter des modules sans modifier l’architecture générale.

## 8. Communication frontend ↔ backend

La communication se fait via des appels HTTP REST versionnés, de la forme :
- `GET /api/v1/shops`
- `GET /api/v1/products/:id`
- `POST /api/v1/orders`
- `GET /api/v1/merchant/dashboard`
- `POST /api/v1/messages`

### Règles de communication
- Le frontend utilise des clients HTTP centralisés.
- Les réponses sont structurées et normalisées.
- Les erreurs sont renvoyées avec des codes HTTP explicites.
- Les données sensibles ne sont jamais exposées dans le frontend sans contrôle serveur.
- La pagination, les filtres et les délais d’agrégation sont gérés côté backend.

Les routes exactes doivent être validées dans la Phase API, mais la structure fonctionnelle et le pattern de versionnage sont fixés ici pour éviter un couplage fragile entre les écrans V1 et l’API réelle.

## 9. Architecture API

### Principes
- validation serveur obligatoire ;
- codes HTTP cohérents ;
- réponses structurées ;
- gestion explicite des erreurs ;
- sécurité des données privées ;
- versionnage API (`/api/v1/...`).

### Conventions
- `GET` pour lecture
- `POST` pour création
- `PATCH` pour mise à jour partielle
- `DELETE` pour suppression logique si les données doivent rester traçables
- `401` non authentifié
- `403` interdit
- `404` non trouvé
- `422` validation métier ou payload invalide
- `500` erreur serveur et logs

### Séparation des responsabilités
- `AuthController`: authentification, refresh, logout
- `ShopController`: gestion de boutique, couverture, branding, visibilité
- `ProductController`: catalogue, médias, stock, variantes
- `OrderController`: commande, soumission, statut, historique
- `MessageController`: messages et réponses
- `ReviewController`: notes et avis
- `AnalyticsController`: métriques et reporting
- `AdminController`: supervision et modération

## 10. Base de données et connexion

### Technologie
- PostgreSQL 16
- Prisma comme couche d’accès et migration

### Entités de départ
Les données sont conformes au périmètre du projet et aux documents de spécification :
- `users`
- `shops`
- `products`
- `product_images`
- `categories`
- `product_variants`
- `product_specs`
- `orders`
- `order_items`
- `messages`
- `reviews`
- `analytics_events`
- `notifications`
- `roles`
- `permissions`

### Relations principales
- les utilisateurs enregistrés sont des commerçants ou administrateurs ; les clients sont des visiteurs non authentifiés ;
- une boutique appartient à un commerçant et possède plusieurs produits ;
- un produit a plusieurs images, variantes et spécifications ;
- une commande contient plusieurs lignes de commande ;
- les messages, avis et analytics sont rattachés à la ressource concernée ;
- les permissions sont gérées de façon centralisée selon le rôle.

### Migration
- migrations versionnées dans `database/migrations` ;
- les modifications de schéma doivent être testées avant validation ;
- les scripts de seed servent uniquement au développement et à la validation.

### Choix de conception
La persistance réelle remplace le stockage navigateur de la V1. Les données en mémoire et le faux backend de démonstration ne doivent plus être la source de vérité dans le projet réel.

## 11. Authentification et permissions

### Modèle d’authentification
Les rôles d’authentification sont :
- `merchant`: gestionnaire de boutique ;
- `admin`: supervision / modération.

Le client n’est pas un rôle ni un compte utilisateur. Le panier est accessible sans connexion et le checkout public crée une commande invitée avec les coordonnées nécessaires à la transmission WhatsApp.

### Règles
- l’authentification est toujours vérifiée côté serveur ;
- les actions sensibles n’ont pas accès au client navigateur pour être validées ;
- chaque ressource privée est associée à son propriétaire ;
- seules les ressources autorisées sont accessibles selon le rôle et l’identité.
- aucune authentification client ne doit être exigée pour consulter le catalogue, préparer le panier ou transmettre une commande.

### Mechanism
- JWT pour les sessions d’API ;
- refresh tokens pour renouvellement ;
- guard par rôle et par propriétaire ;
- logs des tentatives d’accès non autorisées.

## 12. Gestion des images et fichiers

### Stockage
Les images de produits, logos, couvertures et autres fichiers sont gérés côté serveur, avec validation explicite des types, tailles et droits d’accès.

### Contrôles obligatoires
- type de fichier autorisé ;
- taille maximale ;
- validation d’extension et mime type ;
- noms de fichiers non prédictibles ;
- accès contrôlé par propriétaire et ressource ;
- nettoyage des fichiers orphelins lors de suppression.

### Données de référence de la V1
- image principale de produit ;
- galerie d’images ;
- logo de boutique ;
- couverture de boutique ;
- assets propres à la personnalisation de la boutique.

## 13. Configuration des environnements

### Environnement local
- base PostgreSQL locale ;
- frontend et API Node local ;
- fichiers `.env` pour configuration locale.

### Environnement de test
- même architecture que le local, mais avec données stabilisées ;
- validation des principaux cas métier ;
- contrôles d’intégration sur la couche API et les permissions.

### Environnement de production
- HTTPS obligatoire ;
- secrets externes ;
- build de production et migration explicite ;
- observabilité et logs centralisés ;
- backups de base de données et restauration si nécessaire.

## 14. Variables sensibles et gestion des secrets

Les secrets ne doivent pas être hardcodées dans le dépôt.

### Exemples
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `POSTGRES_PASSWORD`
- clés de stockage, tokens externes et credentials d’email

### Règles
- `.env` en local uniquement ;
- `.env.example` pour documenter les variables ;
- gestion centralisée via secret manager ou variable d’environnement du runtime ;
- aucune valeur sensible dans les logs ou dans le code source.

## 15. Sécurité de l’architecture

Les règles de sécurité sont celles définies dans les docs officielles :
- authentification sécurisée ;
- autorisation côté serveur ;
- principe du moindre privilège ;
- validation des entrées ;
- protections contre les inputs malveillants ;
- HTTPS en production ;
- gestion des fichiers à usage contrôlé ;
- logs et traçabilité ;
- tests d’accès interdit et d’intégrité des données.

### Sécurité API
- JWT avec expiration ;
- tokens rotatifs ;
- validation stricte des IDs et des payloads ;
- protection CSRF pour les sessions web ;
- limites de taille, validation de fichiers et prévention des abus.

## 16. Conventions de développement

- Langage TypeScript pour toute la logique applicative ;
- architecture domain-first par modules fonctionnels ;
- noms explicites pour les modules et fichiers ;
- validation des DTOs et des contraintes de données ;
- tests unitaires et d’intégration sur les services critiques ;
- code review sur les interfaces et les permissions ;
- conventions de commit lisibles et cohérentes.

### Conventions de fichiers
- modules du backend : `auth`, `shops`, `products`, etc.
- composants frontend : `features/<domaine>/…`
- types partagés : `packages/shared`
- configuration d’environnement : `.env.example`

## 17. Déploiement

### Construction de base
- build du frontend pour un rendu statique ou SSR selon besoin ;
- build du backend pour service Node/NestJS ;
- migration Prisma sur base de données cible ;
- validation des variables environnementales avant démarrage.

### Préparation de production
- séparation nette des environnements ;
- activation de logs structurés ;
- backups automatiques de PostgreSQL ;
- observabilité (latence, erreurs, ressources) ;
- alerts sur ratios d’erreur ou disponibilité.

## 18. Évolution sans refonte

L’architecture a été pensée pour évoluer sans reconstruire la base. Les évolutions prévues sont :
- ajout de modules métier sans redéfinir le backend de fond ;
- extension du système de permissions et des rôles ;
- montée en charge du frontend via SSR / cache ;
- ajout d’intégrations tierces (paiement, WhatsApp, CRM, analytics externalisé) selon validation métier.

La clé est la séparation claire entre présentations, API et données : si un nouveau besoin arrive, il s’ajoute à un module cohérent sans impacter l’ensemble du système.

## 19. Validation de cohérence

Cette architecture est cohérente avec les documents officiels :
- elle couvre les modules identifiés dans la V1 et dans les spécifications fonctionnelles ;
- elle sépare clairement le frontend de la logique métier ;
- elle place la validation, les permissions et les données côté serveur ;
- elle prépare la Phase 2 (base de données) avec un schéma explicite et des entités documentées ;
- elle maintient la compatibilité avec la V1 sans dupliquer l’interface dans des composants sans logique.

Elle est donc prête pour la Phase 2 : base de données, schéma relationnel, migrations et règles métier de persistance.

## 20. Décisions de conception à confirmer lors des phases suivantes

Les éléments suivants doivent être validés avant la spécification détaillée des fonctionnalités suivantes :
- statuts exacts de commande et produits ;
- rôles et permissions détaillés ;
- règles de propriété et d’accès aux objets privés ;
- politique de conformité des images et fichiers ;
- définition exacte des champs et validations métiers ;
- obligation de faiblesse par domaine ou service.

Ces décisions sont explicites et ne sont pas laissées au hasard pour éviter une architecture instable ou un choix technologique non maîtrisé.

---

Cette architecture constitue le socle technique de MARKETNET et doit servir de base à la Phase 2 — Base de données et à la montée en charge des phases métier suivantes.
