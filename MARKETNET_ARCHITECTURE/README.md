# MARKETNET — Architecture technique

Ce dossier constitue le socle technique du projet MARKETNET, construit à partir des documents officiels de la V1 et des écrans de référence.

## Principes directeurs

- La V1 HTML est la référence fonctionnelle et visuelle.
- L’architecture cible doit préserver les parcours publics et commerçants de la V1 sans copier aveuglément le prototype.
- La logique critique reste côté serveur.
- Les données, fichiers et permissions sont gérées de manière explicite.
- Les modules sont découplés pour permettre l’évolution sans refonte globale.

## Stack technique retenue

- Frontend: Next.js + TypeScript + React
- Backend API: NestJS + TypeScript
- Base de données: PostgreSQL 16
- ORM: Prisma
- Authentification: JWT + refresh tokens + RBAC
- Sécurité: validation serveur, permissions, logs et contrôle d’accès

## Structure proposée

```text
MARKETNET_ARCHITECTURE/
├─ apps/
│  ├─ web/                 # Frontend Next.js
│  │  └─ src/
│  │     ├─ app/
│  │     ├─ features/
│  │     ├─ shared/
│  │     └─ lib/
│  └─ api/                 # Backend NestJS
│     └─ src/
│        ├─ app/
│        ├─ auth/
│        ├─ shops/
│        ├─ products/
│        ├─ orders/
│        ├─ messages/
│        ├─ reviews/
│        ├─ analytics/
│        ├─ admin/
│        └─ common/
├─ packages/
│  └─ shared/              # DTOs, enums, types partagés
├─ database/
│  └─ schema-notes.md
├─ .env.example
├─ README.md
└─ package.json
```

## Modules du projet

- Marketplace public: accueil, catalogue, recherche, boutiques, fiche produit, panier
- Espace commerçant: authentification, boutique, produits, commandes, messages, analytics, avis, réglages
- Administration: supervision, validation des boutiques, gestion des contenus et sécurité

## Orchestration de communication

- Le frontend appelle l’API via des clients HTTP exposés dans `apps/web/src/lib/api`.
- L’API valide l’entrée, applique les permissions et interagit avec PostgreSQL.
- Les fichiers d’images et couvertures sont gérés côté serveur avec validation explicite des types, tailles et droits d’accès.
- Les événements d’analytics sont enregistrés côté serveur et agrégés pour le tableau de bord.

## Préparation pour la phase 2

- Le schéma de données est aligné sur les entités documentées: utilisateurs, boutiques, produits, variantes, images, commandes, messages, avis et analytics.
- Les points de décision restent explicites: permissions, statuts de commande et validation des données métier doivent être confirmés avant implémentation détaillée.
- La structure actuelle est extensible sans refaire l’architecture de fond.
