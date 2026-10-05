# MARKETNET — Mémoire du projet

## État de référence
La V1 est validée comme référence visuelle et fonctionnelle.

## Cette mémoire doit contenir
État global, modules terminés, modules en cours, blocages, décisions importantes, changements d’architecture, risques et prochaines priorités.

## Règle obligatoire
Toute mission d’agent doit se terminer par une mise à jour de cette mémoire.

## Mission réalisée — 2026-10-05 (refonte visuelle frontend)
Mission : refonte et correction complète du frontend React/Next.js de MARKETNET pour reproduire fidèlement l'interface de la maquette HTML V1.

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/web/src/app/globals.css
- MARKETNET_ARCHITECTURE/apps/web/src/app/layout.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/components/Topbar.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/[id]/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/[id]/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/login/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/dashboard/layout.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/dashboard/page.tsx

### Éléments intégrés
- Remplacement du style Tailwind/simplifié par le CSS natif issu de `Maquette-V1.html`.
- Application des polices `Inter` et de `Bootstrap Icons`.
- Restructuration des classes et composants (ex: `product-card`, `home-shop-card`, `topbar`, `hero`) sur toutes les pages publiques.
- Création des écrans manquants pour la continuité du parcours (connexion et dashboard marchand).

### Décisions prises
- La maquette V1 est la source de vérité absolue pour l'UI, le CSS et le layout. Les balises et classes ont été calquées de la maquette.
- Le projet reste sur l'architecture React et Next.js 14 avec un routing App Router fonctionnel. Les données réelles sont toujours requêtées depuis l'API.

### État global
Le frontend MARKETNET est désormais visuellement conforme à la maquette V1 officielle tout en restant dynamique et connecté au backend.

## Mission réalisée — 2026-10-05
Mission : correction de la Phase 1 pour retirer les éléments d’infrastructure non validés et remettre l’architecture documentaire conforme aux décisions du projet.

### Fichiers créés
- Aucun fichier créé lors de cette mission.

### Fichiers modifiés
- MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md
- MARKETNET_ARCHITECTURE/README.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md

### Éléments retirés
- MARKETNET_ARCHITECTURE/docker-compose.yml
- MARKETNET_ARCHITECTURE/infra/docker/
- Références Docker, Redis, MinIO et stockage objet S3-compatible dans la documentation

### Décisions prises
- Le socle documentaire de la Phase 1 est nettoyé des technologies d’infrastructure non validées.
- Aucune autre solution d’infrastructure n’est ajoutée sans validation officielle du projet.
- La mémoire du projet est mise à jour pour tracer la mission et les décisions associées.

### Tests effectués
- Vérification par recherche des motifs docker|docker-compose|Redis|MinIO|S3-compatible dans les fichiers du projet.
- Contrôle de la structure du dossier MARKETNET_ARCHITECTURE pour confirmer la suppression de la configuration Docker.

### Problèmes et points à valider
- Le choix exact d’infrastructure de développement, stockage et déploiement n’a pas été validé par le projet ; il reste donc hors de la Phase 1.
- Aucune fonctionnalité de la Phase 2 n’a été lancée ni ajoutée pendant cette correction.

### État global
La Phase 1 est alignée sur les décisions de référence et ne contient plus de dépendances Docker ou d’outils d’infrastructure non validés.

## Mission réalisée — 2026-10-05 (socle de données MARKETNET)
Mission : mise en place du socle de données PostgreSQL/Prisma pour la plateforme MARKETNET, en conformité avec les spécifications fonctionnelles, les règles métier et l’architecture validée.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma
- MARKETNET_ARCHITECTURE/apps/api/prisma/migrations/20261005_marketnet_init/migration.sql
- MARKETNET_ARCHITECTURE/apps/api/src/common/prisma/prisma.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/common/prisma/prisma.module.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/.env.example
- MARKETNET_ARCHITECTURE/README.md
- MARKETNET_ARCHITECTURE/apps/api/package.json
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Modèle de données construit
- Utilisateurs, rôles, permissions et accès par rôle.
- Boutiques, catégories, produits, images, variantes et spécifications.
- Commandes et lignes de commande avec statuts métier.
- Messages entre clients et commerçants.
- Avis, notifications, événements d’analytics et paramètres applicatifs.
- Tokens de rafraîchissement pour le futur niveau d’authentification.

### Décisions prises
- Le socle de données repose sur PostgreSQL + Prisma, conformément à l’architecture validée.
- Les services non validés (Docker, Redis, MinIO, S3) ne sont pas ajoutés au modèle de données ni à l’environnement actuel.
- Les règles de propriété et les statuts métier sont encodés dans le modèle et restent prévues pour validation fonctionnelle avant les phases suivantes.

### Tests effectués
- Validation Prisma : `DATABASE_URL=postgresql://marketnet:marketnet@localhost:5432/marketnet?schema=public npm --workspace apps/api exec prisma validate`
- Génération du client Prisma : `npm --workspace apps/api exec prisma generate`
- Compilation du backend : `npm --workspace apps/api run build`
- Résultat vérifié : schema valide et build backend avec statut `BUILD_OK`.

### Problèmes rencontrés
- La version initiale des dépendances du projet était incohérente avec le runtime actuel et le format Prisma attendu.
- Une première tentative avec Prisma 7 a montré une incompatibilité de syntaxe avec le référentiel du projet ; la correction a consisté à revenir à la version compatible Prisma 5, tout en gardant le backend NestJS fiable.

### Points restant à valider
- Les statuts métier finaux, les rôles exacts et les permissions détaillées seront confirmés lors de la phase d’authentification et des services métier.
- Le modèle est prêt pour la Phase 3, sans avoir commencé celle-ci.

### État global
Le socle de données MARKETNET est en place, cohérent avec les documents officiels et prêt pour la suite de la conception backend sans introduire de technologie non validée.

## Mission réalisée — 2026-10-05 (validation PostgreSQL réelle et QA Phase 12)
Mission : validation complète du système MARKETNET sur une base PostgreSQL réelle, vérification des migrations, exécution du seed de données de test, validation backend/frontend et mise à jour de la mémoire officielle sans ajouter de technologie ni de périmètre non validé.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/prisma/seed.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma
- MARKETNET_ARCHITECTURE/apps/api/package.json
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Correction racine appliquée
- Le schéma Prisma ne correspondait pas aux tables PostgreSQL déjà migrées, qui sont nommées conformément à la base réelle (`users`, `shops`, `products`, `analytics_events`, etc.).
- Les modèles Prisma ont été alignés sur les tables réelles avec les annotations `@@map(...)` nécessaires.
- Cette correction supprime le blocage `P2021: The table (not available) does not exist` et rétablit le bon mapping entre le backend et la base validée.

### Données de validation réalisées
- Base PostgreSQL locale : `postgresql://marketnet:marketnet@localhost:5432/marketnet?schema=public`
- Seed exécuté avec données de démonstration : 3 utilisateurs, 3 rôles, 2 boutiques, 3 produits, 1 commande, 1 message, 2 notifications.

### Tests effectués
- `npx prisma generate --schema .\prisma\schema.prisma` → client Prisma généré avec succès.
- `node -r ts-node/register .\prisma\seed.ts` → seed exécuté avec succès sur la BD réelle.
- `npm --workspace apps/api test -- --runInBand` → 5 suites, 29 tests passés.
- `npm --workspace apps/web run build` → build de production Next.js OK.
- Vérification SQL PostgreSQL : comptages de tables métier confirmés (`users`, `roles`, `shops`, `products`, `orders`, `messages`, `notifications`).

### Décisions prises
- Le mapping Prisma doit suivre strictement les tables PostgreSQL migrées et validées, sans suppositions de convention implicite.
- Le seed est un jeu de données de test local, conforme au périmètre MARKETNET et sans données personnelles.
- La QA finale ne doit pas introduire de nouvelles fonctionnalités ni de services non validés.

### État global
La Phase 12 de validation est réussie sur la base PostgreSQL réelle. Le système MARKETNET est cohérent, migré, alimenté en données de test et validé Backend + Frontend sans ajouter de technologie non approuvée.

## Mission réalisée — 2026-10-05 (authentification et gestion des utilisateurs)
Mission : mise en place de l’authentification de MARKETNET sur la base PostgreSQL/Prisma et le backend NestJS déjà validés, sans ajoute de service non approuvé.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/decorators/public.decorator.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/decorators/roles.decorator.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/decorators/permissions.decorator.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/decorators/current-user.decorator.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/guards/jwt-auth.guard.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/guards/roles.guard.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/guards/permissions.guard.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/dto/register.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/dto/login.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/dto/refresh-token.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/dto/update-profile.dto.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Fonctionnalités ajoutées
- Inscription et connexion utilisateur avec password hashing via bcrypt.
- Génération d’access token et refresh token stockés sur la base Prisma.
- Vérification JWT au niveau global du backend et contexte utilisateur injecté dans les requêtes.
- Routes publiques explicites pour l’inscription, la connexion et le rafraîchissement de jeton.
- Profil utilisateur consultable et modifiable avec validation de données.
- Configuration initiale des rôles client / merchant / admin (historique, remplacée par DEC-0015 : seuls merchant / admin sont authentifiés).

### Décisions prises
- L’authentification s’appuie sur la base validée PostgreSQL + Prisma et le backend NestJS existant.
- Aucune autre technologie d’infrastructure n’a été ajoutée ; le périmètre de la mission reste conforme au projet.
- Les routes protégées sont sécurisées par défaut pour éviter les accès non autorisés sur les futures fonctionnalités métier.

### Tests effectués
- `npm --workspace apps/api run build` → compilation backend réussie.
- `npm --workspace apps/api run prisma:validate` → schéma Prisma validé.

### État global
La Phase 3 d’authentification et de gestion des comptes est démarrée et validée au niveau de l’architecture applicative, sans introduire de technologie non validée ni enfreindre le périmètre MARKETNET.

## Mission réalisée — 2026-10-05 (gestion des boutiques commerçantes)
Mission : mise en place du cœur fonctionnel MARKETNET pour la gestion d’une boutique réelle par un commerçant authentifié, en respect strict du socle validé PostgreSQL + Prisma + NestJS, sans introduire service ni infrastructure non approuvée.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/shops/shop.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/shops/shop.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/shops/shop.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/shops/dto/create-shop.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/shops/dto/update-shop.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/shops/dto/update-shop-status.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/test/shops.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/tsconfig.json
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Endpoints créés
- `GET /api/v1/shops` : listing public des boutiques publiées.
- `GET /api/v1/shops/me` : boutiques détenues par le commerçant connecté.
- `GET /api/v1/shops/:id` : consultation d’une boutique selon le contexte de visibilité.
- `POST /api/v1/shops` : création de boutique par un marchand authentifié.
- `PATCH /api/v1/shops/:id` : modification d’une boutique propriétaire.
- `PATCH /api/v1/shops/:id/status` : changement de statut de la boutique.

### Règles de permissions appliquées
- Les routes de gestion boutique sont protégées par JWT.
- Un commerçant ne peut gérer que sa propre boutique.
- Un administrateur peut gérer toute boutique, conformément aux permissions définies.
- Les boutiques non publiées ne sont pas visibles dans le catalogue public.
- Le public ne peut consulter que les boutiques publiées et visibles.

### Décisions prises
- Le cœur commercial de MARKETNET repose sur le modèle Prisma existant et la sécurité JWT déjà validée.
- La création d’une boutique est limitée à un seul shop par commerçant dans cette phase de gestion de boutique.
- Les invariants de propriété et d’accès sont appliqués côté backend pour éviter toute violation de permission.
- Aucune infrastructure additionnelle ni service externe non validé n’a été ajouté.

### Tests effectués
- `npm --workspace apps/api test -- --runInBand test/shops.service.spec.ts` → 5 tests passants.
- `npm --workspace apps/api run build` → build backend réussi.
- `npm --workspace apps/api run prisma:validate` → schéma Prisma validé.

### Problèmes rencontrés
- La première implémentation devait s’aligner sur le mode strict TypeScript des DTOs.
- Les tests de service ont nécessité un mock Prisma compatible avec la typage generated du client.
- Le filtrage public des boutiques devait être renforcé pour ne sortir que les boutiques `PUBLISHED`.

### Points restants à traiter
- Ajouter les tests d’intégration HTTP sur l’API `shops` complète dans une prochaine itération.
- Connecter les prochaines phases de catalogue et de commandes à la boutique propriétaire.

### État global
Le cœur de gestion des boutiques MARKETNET est en place, sécurisé, persistant et compatible avec la base validée, prêt à servir les phases métier suivantes sans franchir le périmètre architecture validé.

## Mission réalisée — 2026-10-05 (gestion du catalogue produits)
Mission : mise en place du système complet de gestion des produits MARKETNET au sein du socle PostgreSQL + Prisma + NestJS déjà validé, sans ajouter aucune infrastructure ou technologie non approuvée.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/products/product.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/product.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/product.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/create-product.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/update-product.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/create-category.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/update-category.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/create-product-image.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/update-product-image.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/create-product-variant.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/update-product-variant.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/create-product-specification.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/dto/update-product-specification.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/test/products.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Endpoints créés
- `GET /api/v1/products` : catalogue public des produits publiés.
- `GET /api/v1/products/:id` : consultation d’un produit selon la visibilité et la propriété.
- `GET /api/v1/products/shop/:shopId` : listing des produits d’une boutique propriétaire.
- `POST /api/v1/products/shop/:shopId` : création d’un produit dans une boutique du commerçant.
- `PATCH /api/v1/products/:id` : modification du produit.
- `PATCH /api/v1/products/:id/archive` : archivage du produit (suppression logique métier).
- `DELETE /api/v1/products/:id` : suppression logique via archivage.
- `GET /api/v1/products/categories` : liste des catégories actives.
- `POST /api/v1/products/categories` : création de catégorie.
- `PATCH /api/v1/products/categories/:id` : maîtrise des catégories.
- `POST /api/v1/products/:id/images` / `PATCH .../images/:imageId` / `DELETE .../images/:imageId`
- `POST /api/v1/products/:id/variants` / `PATCH .../variants/:variantId` / `DELETE .../variants/:variantId`
- `POST /api/v1/products/:id/specifications` / `PATCH .../specifications/:specId` / `DELETE .../specifications/:specId`

### Fonctionnalités produit implémentées
- création d’un produit avec slug unique par boutique ;
- gestion du prix, du stock, du statut, de la publication et de la mise en avant ;
- gestion des catégories globales et de leur slug ;
- gestion des images produit (galerie, image principale, ordre) ;
- gestion des variantes produit (prix, stock, SKU, activation) ;
- gestion des spécifications produit ;
- visibilité publique limitée aux produits `ACTIVE` et publiés ;
- archivage métier pour remplacer la suppression stricte sans casser les intégrités relationnelles.

### Règles de propriété et permissions
- un commerçant ne peut gérer que les produits de sa propre boutique ;
- un administrateur peut gérer tous les produits ;
- les routes de catalogue sont protégées par le JWT existant ;
- le public ne voit que les produits publiés et actifs ;
- le backend reste la source de vérité pour les permissions et les contrôles d’accès.

### Tests effectués
- `npm --workspace apps/api test -- --runInBand test/products.service.spec.ts` → 5 tests passants.
- `npm --workspace apps/api run build` → build NestJS réussi.

### Problèmes rencontrés
- le module produit n’existait pas encore dans le backend, malgré le schéma Prisma déjà prêt ;
- les règles de visibilité publique et d’archive de produit devaient être appliquées côté service ;
- le service devait rester compatible avec le mode strict TypeScript et les mocks Jest minimaux.

### Décisions prises
- le catalogue produit est géré au sein du module `products` sur le socle Prisma/NestJS validé ;
- les catégories sont traitées comme des ressources globales de catalogue, conformément au modèle de données validé ;
- l’archivage logique remplace la suppression réelle pour garder les données cohérentes et sécurisées ;
- aucune solution de stockage externe ou infrastructure non validée n’a été ajoutée.

### État global
Le catalogue produit MARKETNET est désormais opérationnel, sécurisé et prêt pour la suite de la marketplace publique sans dépasser le périmètre de la Phase 5 validée.

## Mission réalisée — 2026-10-05 (marketplace publique)
Mission : intégration de la marketplace publique MARKETNET sur le frontend Next.js, en consommation des endpoints publics validés du backend NestJS/Prisma, sans introduire de technologie ni de service d’infrastructure non validé.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/web/src/lib/api.ts
- MARKETNET_ARCHITECTURE/apps/web/src/app/layout.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/globals.css
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/[id]/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/[id]/page.tsx

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/web/src/app/page.tsx

### Fonctionnalités intégrées
- page d’accueil connectée aux boutiques et produits publiés du backend réel ;
- catalogue public de produits avec rendu de données et états vides ;
- fiche produit publique avec accès au contexte boutique ;
- fiche boutique publique avec liste des produits visibles ;
- navigation cohérente entre accueil, catalogue et boutiques ;
- conformité visuelle avec la V1 et respect du périmètre fonctionnel validé.

### Règles appliquées
- utilisation exclusive des endpoints publics de l’API : `/api/v1/shops`, `/api/v1/products`, `/api/v1/products/categories` ;
- affichage strictement limité aux données publiées et actives ;
- absence de services externes, conteneurisation ou infrastructure non validée ;
- aucune fonctionnalité des phases suivantes n’est démarrée (commandes, messages, analytics, administration).

### Tests effectués
- `npm --workspace apps/web run build` → build frontend validé avec succès.

### Décisions prises
- la marketplace publique est désormais alimentée par les données réelles du backend validé ;
- le frontend reste fidèle à la V1 visuellement et fonctionnellement sans surcharger l’architecture existante ;
- l’intégration de la marketplace est un point d’entrée autorisé avant la suite des phases métier.

### État global
La marketplace publique MARKETNET est intégrée au frontend validé et reste conforme au périmètre architecture et produit autorisé par le projet.

## Mission réalisée — 2026-10-05 (panier et commandes)
Mission : mise en place du système réel de panier et de commandes MARKETNET sur le socle PostgreSQL + Prisma + NestJS déjà validé, sans introduire de technologie ni de service non approuvé.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/dto/add-cart-item.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/dto/update-cart-item.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/dto/create-order.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/test/orders.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Fonctionnalités implémentées
- première version du panier par utilisateur authentifié (historique, remplacée par le checkout invité public ; aucun compte client n’est requis) ;
- validation serveur du produit, de la boutique, de la variante, du stock et du prix ;
- ajout, mise à jour et suppression d’éléments de panier ;
- calcul serveur du sous-total et du total de commande ;
- création d’une commande avec stock déduit et données client validées ;
- contrôle d’accès des anciennes commandes liées à un compte (historique, le parcours actif est désormais la commande invitée) ;
- blocage des produits non publiés, non actifs, sans stock ou hors visibilité publique.

### Règles de permissions et sécurité appliquées
- JWT requis pour les routes de panier et de commande ;
- `orders.manage.own` protège l’accès au panier et aux commandes du propriétaire ;
- le backend recalcule les montants à partir des données persistées ;
- aucune valeur `price`, `stock` ou `visibility` ne vient de l’interface côté client sans validation serveur ;
- l’API ne peut pas livrer une commande pour un produit non disponible publiquement.

### Tests effectués
- `npm --workspace apps/api test -- --runInBand test/orders.service.spec.ts` → 5 tests passants.
- `npm --workspace apps/api run build` → compilation NestJS réussie.
- `npm --workspace apps/api test -- --runInBand` → 15 tests passants sur la base backend validée.

### Problèmes rencontrés
- le module commande n’existait pas encore dans le backend ;
- le flux de transaction devait refléter le vrai comportement Prisma ;
- le build strict TypeScript exigeait des DTOs initialisés et des retours de contrôleur alignés sur les vrais types métier.

### Décisions prises
- le panier et les commandes sont intégrés au socle validé PostgreSQL + Prisma + NestJS ;
- les validations métier restent côté backend pour garantir l’intégrité de la commande ;
- le périmètre de la mission reste limité à panier / commandes sans démarrer les paiements, la livraison avancée, les messages ou l’administration.

### État global
Le système de panier et de commandes MARKETNET est fonctionnel, sécurisé, validé par tests ciblés et compatible avec l’architecture officielle sans introduire d’outil ni de technologie non validée.

## Mission réalisée — 2026-10-05 (transmission de commande via WhatsApp)
Mission : finalisation du parcours MARKETNET de commande par message WhatsApp, sans paiement en ligne ni infrastructure externe non validée.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/test/orders.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Fonctionnement de la commande WhatsApp
- Le client confirme son panier et sa commande dans MARKETNET.
- Le backend recalcule les montants à partir des produits et variantes enregistrés en base.
- Le backend génère un message WhatsApp textuel exploitable pour le commerçant.
- Le message est construit côté système à partir des données persistées, et non à partir d’entrées non validées du frontend.
- Le backend prépare une URL WhatsApp `https://wa.me/<numero>?text=<message>` pour ouvrir directement le chat du commerçant.
- La transmission signifie la préparation et l’envoi du message au commerçant ; elle n’implique aucun paiement en ligne.

### Format du message généré
Le message contient :
- référence de commande (`MK-XXXXXXXX`)
- nom de la boutique
- liste des produits avec quantités et variantes
- sous-total et total
- nom du client
- téléphone client
- adresse de livraison et ville/pays
- notes éventuelles
- demande de confirmation par le commerçant

### Statuts utilisés
- `PENDING` : commande créée et validée, prête à être transmise
- `PROCESSING` : commande préparée et envoyée au commerçant via WhatsApp
- `CANCELLED` : annulation selon les règles métiers déjà validées
- `PAID`, `SHIPPED`, `DELIVERED`, `REFUNDED` restent non utilisés dans ce parcours sans paiement en ligne

### Endpoints créés / modifiés
- `POST /api/v1/orders/:id/whatsapp` : génération du message WhatsApp et préparation de l’URL de transmission
- `POST /api/v1/orders` : création de la commande depuis le panier
- `GET /api/v1/orders/:id` : consultation sécurisée de la commande du propriétaire

### Règles métier appliquées
- le client ne peut consulter que ses commandes propres ;
- un commerçant ne reçoit que les commandes liées à sa boutique ;
- les produits non publiés, non actifs ou en rupture de stock ne peuvent pas être commandés ;
- les montants sont recalculés côté serveur ;
- le magasin doit avoir un numéro WhatsApp configuré pour transmettre la commande ;
- aucune passerelle de paiement n’a été ajoutée.

### Tests effectués
- `npm --workspace apps/api test -- --runInBand test/orders.service.spec.ts` → 6 tests passants.
- `npm --workspace apps/api run build` → compilation backend réussie.
- `npm --workspace apps/api test -- --runInBand` → 16 tests passants au total sur le backend validé.

### Problèmes rencontrés
- le flux de commande existait mais ne générait pas encore le message WhatsApp préparé ;
- il fallait sécuriser la génération serveur et la validation des données de commande ;
- le message devait rester aligné sur les règles V1 sans introduire de paiement en ligne.

### Décisions prises
- l’API MARKETNET prépare la commande et ouvre le chat WhatsApp du commerçant sans passerelle de paiement ;
- le format du message ainsi que la référence de commande sont dérivés des données persistées ;
- le statut métier passe en `PROCESSING` lors de la préparation de la transmission WhatsApp ;
- aucun service externe WhatsApp ou paiement n’est introduit dans l’architecture validée.

### État global
Le parcours MARKETNET est désormais valable de l’achat au message WhatsApp du commerçant, sans paiement en ligne, conforme au périmètre fonctionnel et à la stack déjà validée.

## Mission réalisée — 2026-10-05 (messagerie interne MARKETNET)
Mission : mise en œuvre d’un système de communication interne dans le périmètre validé, sans ajout de service externe ni de techno d’infrastructure non approuvée.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/dto/create-message.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/test/messages.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Fonctionnalités de communication réellement implémentées
- envoi d’un message entre utilisateurs authentifiés ;
- rattachement optionnel du message à une boutique et à une commande ;
- consultation de tous les messages accessibles à l’utilisateur ;
- accès à une conversation entre deux utilisateurs ;
- marquage d’un message comme lu par le destinataire ;
- vérification côté serveur des permissions et de la cohérence boutique / commande.

### Règles de permissions et sécurité appliquées
- JWT requis pour chaque route de messagerie ;
- `@Roles('client', 'merchant', 'admin')` et `@Permissions('messages.manage.own')` sur les endpoints ;
- les gardes globales `JwtAuthGuard`, `RolesGuard` et `PermissionsGuard` protègent les routes backend ;
- un utilisateur ne peut pas lire ni modifier des messages qui ne le concernent pas ;
- la relation `shopId`/`orderId` est validée avant la création du message ;
- les destinataires inconnus, les messages vers soi-même et les incohérences de proprieté sont bloqués.

### Endpoints créés / modifiés
- `POST /api/v1/messages`
- `GET /api/v1/messages`
- `GET /api/v1/messages/:id`
- `GET /api/v1/messages/conversations/:userId`
- `PATCH /api/v1/messages/:id/read`

### Tests effectués
- `npm --workspace apps/api test -- --runInBand test/messages.service.spec.ts` → 6 tests passants.
- `npm --workspace apps/api run build` → compilation backend réussie.
- `npm --workspace apps/api test -- --runInBand` → 22 tests passants au total.

### Problèmes rencontrés
- la ressource `messages` était absente du backend alors que le schéma Prisma et l’architecture projet la prévoyaient ;
- les permissions n’étaient pas encore appliquées de façon globale sur les routes protégées ;
- aucun flux de conversation n’était exposé ni validé par tests métier.

### Décisions prises
- le modèle de communication utilisé est celui du schéma validé de MARKETNET (`Message` + `senderId` / `receiverId` + `shopId` / `orderId` optionnels) ;
- le périmètre de communication reste interne et professionnel, sans offrir un clone de messagerie dédié, un service tiers ni de nouvelles infrastructures ;
- la mémoire du projet est mise à jour pour clôturer cette mission dans le cadre validé.

### Éléments volontairement non implémentés
- aucun WebSocket, aucun realtime, aucun service de notification externe ;
- aucune nouvelle table de conversation, car le schéma validé repose sur `messages` et non sur une entité distincte ;
- aucune interface front ultra-détaillée non présente dans la V1 validée et non justifiée par la documentation officielle.

### État global
Le module de communication interne MARKETNET est désormais conforme au schéma validé, protégé par les permissions, testé et compatible avec la stack officielle sans ajouter de technologie, service ou infrastructure non validé.

## Mission réalisée — 2026-10-05 (notifications et événements métier)
Mission : mise en place du système de notifications et événements MARKETNET sur le socle validé PostgreSQL + Prisma + NestJS, sans ajout d’infrastructure tierce ni de service non approuvé.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/notification.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/notification.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/notification.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/dto/create-notification.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/test/notifications.service.spec.ts

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.module.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Fonctionnalités réellement implémentées
- création de notifications côté serveur pour un destinataire unique ;
- consultation personnelle des notifications par utilisateur ;
- marquage d’une notification comme lue ;
- marquage global des notifications non lues comme lues ;
- enregistrement structuré d’événements d’analytics sur les actions métier réellement prévues ;
- déclenchement des notifications depuis les flux internes validés : message et commande.

### Règles appliquées
- le frontend ne décide jamais du destinataire ou du contenu sensible ;
- un utilisateur ne peut pas consulter ni modifier les notifications d’un autre utilisateur ;
- les événements sont enregistrés avec des métadonnées minimales et sans fuite de données privées ;
- le système reste conforme au périmètre validé : pas de broker, pas de push service, pas de realtime ou d’infrastructure extérieure.

### Tests exécutés
- `npm --workspace apps/api test -- --runInBand test/notifications.service.spec.ts test/messages.service.spec.ts` → 13 tests passants.
- `npm --workspace apps/api run build` → compilation backend réussie.
- `npm --workspace apps/api test -- --runInBand` → 29 tests passants au total.

### État global
Le système de notifications et d’événements MARKETNET est désormais intégré au backend validé, protégé côté serveur et conforme aux contraintes projectives sans ajouter de technologie ni service non approuvé.

## Mission réalisée — 2026-10-05 (intégration complète V1 — Phase 11)
Mission : validation de l’intégration des modules déjà validés dans une expérience V1 cohérente, sans démarrer la Phase 12 et sans ajouter d’outil, de service ou d’infrastructure hors périmètre.

### Fichiers créés
- Aucun fichier de code créé pendant cette passe d’intégration finale ; les modules existants sont connectés dans leur structure validée.

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/web/src/lib/api.ts
- MARKETNET_ARCHITECTURE/apps/web/src/app/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/products/[id]/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/shops/[id]/page.tsx
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/notification.service.ts
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### Intégration V1 vérifiée
- la marketplace publique est alimentée par les endpoints publics du backend validé ;
- les pages d’accueil, catalogue, boutique et détail de produit affichent des données réelles de la base Prisma ;
- le parcours d’achat reste intact et conforme au périmètre MARKETNET : commande préparée, calculée côté serveur et transmise au commerçant via WhatsApp sans paiement en ligne ;
- les modules de message et de notification restent internes et sécurisés par JWT, rôles et permissions ;
- la V1 fonctionne comme référence visuelle, sans introduction d’une technologie externe de chat, de paiement ou d’infrastructure non validée.

### Règles métier conservées
- aucun paiement en ligne n’est ajouté au flux MARKETNET ;
- la commande ne fait pas appel à un service tiers ni à un canal de paiement externe ;
- le WhatsApp est uniquement un canal de préparation et d’ouverture de conversation avec le commerçant ;
- la communication interne reste limitée au modèle `Message` déjà validé par le schéma Prisma ;
- les données d’analytics et de notifications restent côté backend et sans infrastructure supplémentaire.

### Tests et validation effectués
- `npm --workspace apps/api run build` → compilation backend réussie.
- `npm --workspace apps/api test -- --runInBand` → 5 suites passantes, 29 tests passants, 0 échec.
- `npm --workspace apps/web run build` → build Next.js validé, pages publiques générées sans régression.

### Décisions prises
- l’intégration complète V1 est validée dans le périmètre MARKETNET existant, sans extension hors architecture autorisée ;
- la documentation doit garder la trace de la cohérence backend / frontend afin d’empêcher toute dérive fonctionnelle inutile ;
- la Phase 12 n’est pas démarrée et n’est pas justifiée par cette mission.

### État global
L’intégration V1 est complète, cohérente et conforme à l’architecture validée. Le projet reste strictement aligné sur PostgreSQL + Prisma + NestJS + Next.js, sans infrastructure externalisée ni paiement en ligne.

## Mission réalisée — 2026-10-05 (commande invitée, suppression du rôle client et CRUD marchand)
Mission : supprimer toute obligation de compte pour les clients, retirer le rôle client, enlever la carte de profil marchand demandée et rendre l’ajout/modification de produits réellement persistants.

### Changements réalisés
- Le client est un visiteur sans compte; il peut préparer une commande sans login.
- Les comptes et rôles authentifiés sont réservés aux commerçants et administrateurs.
- Le rôle `client` a été retiré des constantes, de l’inscription, des autorisations de messages/notifications, du seed et des routes de commande authentifiées.
- Le checkout invité demeure accessible via `POST /api/v1/orders/guest`; `orders.userId` est nullable.
- Le seed ne crée plus de compte client et utilise une commande invitée sans propriétaire utilisateur.
- Suppression de la carte nom/e-mail dans la barre latérale du dashboard.
- Remplacement de la grille MOCK des produits par des données API réelles; formulaires Ajouter/Modifier, publication/masquage et gestion d’image URL utilisent les endpoints NestJS authentifiés.
- Création d’une boutique proposée aux commerçants qui n’en ont pas encore.

### Fichiers créés
- MARKETNET_ARCHITECTURE/apps/api/prisma/migrations/20261005_guest_checkout_remove_client_role/migration.sql

### Fichiers modifiés
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.service.ts
- MARKETNET_ARCHITECTURE/apps/api/src/auth/dto/register.dto.ts
- MARKETNET_ARCHITECTURE/apps/api/src/orders/order.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/messages/message.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/notifications/notification.controller.ts
- MARKETNET_ARCHITECTURE/apps/api/src/products/product.service.ts
- MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma
- MARKETNET_ARCHITECTURE/apps/api/prisma/seed.ts
- MARKETNET_ARCHITECTURE/apps/web/src/app/dashboard/layout.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/dashboard/products/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/register/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/login/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/app/page.tsx
- MARKETNET_ARCHITECTURE/apps/web/src/lib/api.ts
- MARKETNET_DOCUMENTATION_V1/02-FONCTIONNALITES/MARKETNET-FUNCTIONAL-SPECIFICATION.md
- MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md
- MARKETNET_DOCUMENTATION_V1/04-DATABASE/MARKETNET-DATABASE-SPECIFICATION.md
- MARKETNET_DOCUMENTATION_V1/08-PARCOURS/MARKETNET-USER-FLOWS.md
- MARKETNET_DOCUMENTATION_V1/09-SECURITE/MARKETNET-SECURITY-SPECIFICATION.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md
- MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/DECISIONS.md

### État de référence
DEC-0015 remplace les anciennes mentions d’un rôle/compte client et les endpoints de panier client authentifiés. Le parcours client de référence ne doit jamais demander une inscription ou connexion.
