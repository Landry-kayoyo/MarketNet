# MARKETNET — Journal des décisions

Chaque décision structurante doit indiquer sa date, sa décision, sa justification, son impact et les documents concernés.

## DEC-0001 — V1 comme référence
La V1 HTML validée constitue la référence visuelle et fonctionnelle.

## DEC-0002 — Mémoire obligatoire
Toute mission d’agent doit laisser une trace dans la mémoire du projet.

## DEC-0002.1 — UI/UX Next.js basée sur la V1 (CSS Natif)
Date : 2026-10-05
Décision : Refonte complète du frontend Next.js pour coller pixel par pixel à la maquette V1 HTML en utilisant le CSS global de cette maquette au lieu de TailwindCSS.
Justification : L'interface existante divergeait trop du cahier des charges et de la maquette validée. La fidélité était une condition non négociable de la mission.
Impact : Les classes et la structure DOM suivent exactement le document HTML officiel. Le projet frontend est 100% raccord avec les attentes visuelles.
Documents concernés : `globals.css`, `layout.tsx`, `page.tsx` et autres vues publiques.

## DEC-0003 — Retrait des services d’infrastructure non validés
Date : 2026-10-05
Décision : Docker, Redis, MinIO et toute référence d’infrastructure ajoutée sans validation officielle sont retirés de la documentation et de la structure de la Phase 1.
Justification : l’architecture doit rester propre, conforme aux décisions officielles du projet et sans technologie d’infrastructure imposée par une mission de conception non validée.
Impact : la Phase 1 conserve une architecture documentaire cohérente ; aucun outil d’infrastructure supplémentaire n’est introduit sans validation formelle.
Documents concernés : MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md, MARKETNET_ARCHITECTURE/README.md, MARKETNET_ARCHITECTURE/docker-compose.yml.

## DEC-0004 — Socle de données PostgreSQL / Prisma
Date : 2026-10-05
Décision : la base de données réelle de MARKETNET est mise en place sur PostgreSQL avec Prisma comme couche de persistance et de migration.
Justification : les documents officiels et la V1 imposent une persistance réelle pour les utilisateurs, boutiques, produits, commandes, messages, avis et analytics, sans ajouter d’infrastructure non validée.
Impact : le backend peut désormais s’appuyer sur un modèle de données cohérent, versionné et exploitable pour les phases suivantes, notamment l’authentification et les services utilisateurs.
Documents concernés : MARKETNET_DOCUMENTATION_V1/04-DATABASE/MARKETNET-DATABASE-SPECIFICATION.md, MARKETNET_DOCUMENTATION_V1/05-REGLES-METIER/MARKETNET-BUSINESS-RULES.md, MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma.

## DEC-0005 — Authentification NestJS/JWT sur le socle validé
Date : 2026-10-05
Décision : l’authentification de MARKETNET est mise en œuvre avec NestJS, JWT et le schéma Prisma existant, sans introduire de service tiers ni technologie d’infrastructure non validée.
Justification : la plateforme a désormais un modèle de données cohérent et le backend NestJS validé ; l’étape suivante logique est la sécurisation des accès utilisateurs et la gestion des comptes sur ce socle existant.
Impact : les routes protégées sont désormais sécurisées en standard avec un contexte utilisateur exploitable par les composants métier futurs, tout en conservant la conformité avec l’architecture officielle.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/auth/**, MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma.

## DEC-0006 — Gestion de boutique par commerçant propriétaire
Date : 2026-10-05
Décision : un commerçant authentifié peut créer et gérer sa boutique via le backend NestJS, en respectant les permissions, le statut métier et la propriété de la ressource.
Justification : la V1, les règles métier et l’architecture projet imposent une boutique réelle, gérée par un propriétaire unique, avec un statut de publication et un accès public limité aux boutiques visibles.
Impact : le backend est désormais prêt pour la phase suivante du catalogue produits, avec une boutique réellement persistée et protégée par l’authentification validée.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/shops/**, MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma.

## DEC-0007 — Catalogue produits sécurisé et structuré
Date : 2026-10-05
Décision : le catalogue produit MARKETNET est mis en œuvre avec un module `products` dédié, reposant sur le schéma Prisma validé, le backend NestJS et les permissions déjà approuvées.
Justification : les boutiques doivent vendre des produits réels, protégés par propriété, statut, visibilité et gestion de ressources associées comme images, variantes et spécifications.
Impact : le backend devient exploitable pour la marketplace publique avec un catalogue marchand propre, persistant et sécurisé, sans introduire de technologie ni service non validé.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/products/**, MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_DOCUMENTATION_V1/05-REGLES-METIER/MARKETNET-BUSINESS-RULES.md.

## DEC-0008 — Marketplace publique connectée aux données validées
Date : 2026-10-05
Décision : la marketplace publique MARKETNET est intégrée au frontend Next.js via les endpoints publics du backend validé et les ressources persistées dans PostgreSQL/Prisma.
Justification : le socle backend et le modèle de données sont désormais prêts pour la vitrine publique ; l’interface doit exposer les boutiques et produits publiés sans ajouter de service ni d’infrastructure non validée.
Impact : les vitrines publiques de MarketNet affichent désormais des boutiques et produits réels, tout en restant limitées au périmètre public et aux données autorisées. Aucune phase ultérieure n’est démarrée avec cette intégration.
Documents concernés : MARKETNET_ARCHITECTURE/apps/web/src/app/**, MARKETNET_ARCHITECTURE/apps/web/src/lib/api.ts, MARKETNET_ARCHITECTURE/apps/api/src/shops/**, MARKETNET_ARCHITECTURE/apps/api/src/products/**, MARKETNET_DOCUMENTATION_V1/07-FRONTEND-V1/MARKETNET-FRONTEND-V1-REFERENCE.md.

## DEC-0009 — Panier et commandes sécurisés côté backend
Date : 2026-10-05
Décision : le système de panier et de commandes de MARKETNET est mis en œuvre dans le backend NestJS sur le socle Prisma validé, avec validation serveur des prix, stock, visibilité et propriété.
Justification : la marketplace publique et le catalogue validés exigent désormais une commande réelle, calculée sur le serveur, et protégée par les mêmes règles de sécurité et d’ownership que le reste du système.
Impact : un client ne peut gérer que son propre panier et ses propres commandes ; les produits non disponibles publiquement ou en rupture de stock ne peuvent pas être commandés ; les prix et totaux sont recalculés par le backend à partir des données persistées.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/orders/**, MARKETNET_ARCHITECTURE/apps/api/src/auth/auth.constants.ts, MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma.
Statut : la partie imposant un compte/role client est remplacée par DEC-0015; seules les règles de validation backend des produits, prix et stocks restent applicables.

## DEC-0010 — Transmission de commande via WhatsApp sans paiement en ligne
Date : 2026-10-05
Décision : la commande MARKETNET est préparée et transmise vers le WhatsApp du commerçant via une URL `https://wa.me/...` générée par le backend, sans passerelle de paiement ni service externe non validé.
Justification : le projet n’a pas de paiement en ligne dans sa définition fonctionnelle ; la commande a pour rôle de préparer la transmission commerciale vers le commerçant dans le parcours V1.
Impact : chaque commande est enregistrée dans MARKETNET, calculée côté serveur, accompagnée d’un message prêt à l’emploi pour le commerçant, et ne déclenche aucun paiement en ligne. La transmission WhatsApp reste conforme aux règles métier et au périmètre validé.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/orders/**, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_DOCUMENTATION_V1/02-FONCTIONNALITES/MARKETNET-FUNCTIONAL-SPECIFICATION.md, MARKETNET_DOCUMENTATION_V1/11-REFERENCE-V1/MARKETNET-V1.html.

## DEC-0011 — Communication interne limitée au modèle Message validé
Date : 2026-10-05
Décision : MARKETNET met en œuvre une messagerie interne minimale basée sur le modèle `Message` déjà validé par le schéma Prisma et la V1, sans créer de service tiers ni de clone de WhatsApp.
Justification : les documents techniques et de données prévoient `messages` comme ressource de communication, avec rattachement possible à la boutique ou à une commande ; cependant, aucun service externe de messagerie ni plateforme de discussion n’est autorisé par le périmètre projet.
Impact : les utilisateurs authentifiés peuvent désormais créer, lire et marquer comme lus des messages entre participants autorisés, avec vérification serveur des permissions et des relations métier. La communication reste limitée au périmètre fonctionnel validé et à la stack déjà acceptée.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/messages/**, MARKETNET_ARCHITECTURE/apps/api/src/app/app.module.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md.

## DEC-0012 — Notifications et événements métier gérés côté backend sans infrastructure ajoutée
Date : 2026-10-05
Décision : MARKETNET met en œuvre un système de notifications simples et de journalisation d’événements métier côté serveur sur le socle Prisma + NestJS déjà validé, sans ajouter Redis, broker, service push ni infrastructure externe non autorisée.
Justification : le schéma Prisma prévoit déjà `notifications` et `analytics_events` comme ressources métier. Les notifications doivent être générées à partir des actions métier réelles du système (commande, message, signalement, événements métier), sans exposer de données sensibles ni déléguer la logique au frontend.
Impact : les utilisateurs authentifiés peuvent désormais consulter leurs notifications, les marquer comme lues et recevoir des alertes de façon fiable sans sortir du périmètre validé. Les événements sont enregistrés de façon structurée et minimale, en cohérence avec le besoin fonctionnel MARKETNET et sans transformer la phase en analytics plateforme complète.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/notifications/**, MARKETNET_ARCHITECTURE/apps/api/src/messages/message.service.ts, MARKETNET_ARCHITECTURE/apps/api/src/orders/order.service.ts, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_DOCUMENTATION_V1/03-ARCHITECTURE/MARKETNET-TECHNICAL-ARCHITECTURE.md.

## DEC-0013 — Intégration complète V1 sans extension de périmètre
Date : 2026-10-05
Décision : la Phase 11 est dédiée à l’intégration cohérente des modules MARKETNET déjà validés dans une expérience V1 finale, sans ouvrir la Phase 12 ni ajouter des fonctionnalités non validées par le projet.
Justification : les modules métier backend et les écrans publics sont déjà construits et testés ; le besoin restant est de vérifier leur assemblage réel et de sécuriser la conformité fonctionnelle sans introduire de toutes nouvelles pièces techniques ou de paiement en ligne.
Impact : la marketplace publique, la boutique, le produit, la commande et les flux internes demeurent alignés avec l’architecture officielle. La V1 est ainsi complète et cohérente sur le périmètre validé, sans paiement, sans service tiers de chat ou d’infrastructure supplémentaire.
Documents concernés : MARKETNET_ARCHITECTURE/apps/web/src/app/**, MARKETNET_ARCHITECTURE/apps/web/src/lib/api.ts, MARKETNET_ARCHITECTURE/apps/api/src/**, MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/PROJECT-MEMORY.md, MARKETNET_DOCUMENTATION_V1/00-MEMOIRE/AGENT-LOG.md.

## DEC-0014 — Mapping Prisma aligné sur les tables migrées PostgreSQL
Date : 2026-10-05
Décision : le schéma Prisma de MARKETNET est mis en conformité avec les tables PostgreSQL migrées et validées, notamment via les annotations `@@map(...)` sur les modèles principaux.
Justification : la base réelle contient des tables nommées au format snake_case (`users`, `shops`, `products`, `analytics_events`, etc.) ; sans mapping explicite, Prisma recherche des tables non existantes et émet le code `P2021`.
Impact : les données métier de MARKETNET peuvent désormais être gérées par le backend sur la base réelle sans incohérence de nommage ni erreur runtime. L’intégration backend/frontend est validée sans ajouter d’infrastructure non approuvée.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_ARCHITECTURE/apps/api/prisma/migrations/20261005_marketnet_init/migration.sql, MARKETNET_ARCHITECTURE/apps/api/prisma/seed.ts.

## DEC-0015 — Commande invitée et suppression du rôle client
Date : 2026-10-05
Décision : le client n’a aucun compte ni rôle MARKETNET. L’inscription et la connexion sont réservées aux commerçants et administrateurs; tout client peut commander en invité et transmettre sa commande au commerçant via WhatsApp.
Justification : le parcours MARKETNET doit rester direct et accessible au client, qui renseigne uniquement les coordonnées utiles à la commande. L’authentification client ajoutait une contrainte contraire au parcours V1.
Impact : retrait du rôle `client`, de sa sélection dans l’inscription, des comptes clients seedés et des routes de panier/commandes authentifiées destinées aux clients; `POST /api/v1/orders/guest` demeure public. `orders.userId` est nullable pour conserver les commandes invitées. Le tableau marchand affiche les produits PostgreSQL et ses formulaires Ajouter/Modifier enregistrent via API.
Documents concernés : MARKETNET_ARCHITECTURE/apps/api/src/auth/**, MARKETNET_ARCHITECTURE/apps/api/src/orders/**, MARKETNET_ARCHITECTURE/apps/api/prisma/schema.prisma, MARKETNET_ARCHITECTURE/apps/api/prisma/migrations/20261005_guest_checkout_remove_client_role/migration.sql, MARKETNET_ARCHITECTURE/apps/web/src/app/register/page.tsx, MARKETNET_ARCHITECTURE/apps/web/src/app/dashboard/products/page.tsx, MARKETNET_DOCUMENTATION_V1/02-FONCTIONNALITES/MARKETNET-FUNCTIONAL-SPECIFICATION.md, MARKETNET_DOCUMENTATION_V1/08-PARCOURS/MARKETNET-USER-FLOWS.md.
