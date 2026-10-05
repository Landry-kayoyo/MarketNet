# Déploiement MarketNet — Vercel + Supabase

MarketNet est publié comme **un seul projet Vercel** : Next.js sert le site et le dossier `apps/web/api` expose l’API NestJS sous `/api/*` comme fonction serverless. L’API n’est pas créée comme un deuxième projet Vercel. PostgreSQL est hébergé par Supabase. Aucun conteneur Docker n’est utilisé.

## 1. Préparer Supabase

1. Créer un projet Supabase PostgreSQL et noter son mot de passe de base de données.
2. Dans **Project Settings → Database → Connection string**, choisir le pooler Supavisor.
3. Configurer dans Vercel :
   - `DATABASE_URL` : URL **Transaction pooler**, port `6543`, avec `pgbouncer=true` et `connection_limit=1`.
   - `DIRECT_URL` : URL **Session pooler**, port `5432`. Prisma l’utilise pour les migrations.
4. Conserver `schema=public` dans les paramètres Prisma. Ne jamais committer les vraies URL ni le mot de passe. Le fichier `.env.production.example` ne contient que des valeurs factices.

Exemple de forme (remplacer les valeurs fournies par Supabase; ne pas copier littéralement) :

```text
DATABASE_URL=postgresql://postgres.<project-ref>:<mot-de-passe>@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1&schema=public
DIRECT_URL=postgresql://postgres.<project-ref>:<mot-de-passe>@<pooler-host>:5432/postgres?schema=public
```

Si le mot de passe contient des caractères réservés d’URL, l’encoder avant de l’insérer dans les URL.

## 2. Appliquer le schéma

Le build Vercel exécute `prisma migrate deploy` **uniquement pour un déploiement Production**, après la génération du client Prisma et les builds API + Web. Les Preview et les builds locaux ne migrent pas la base. Le job Production requiert `DIRECT_URL`; il échoue explicitement si cette variable manque.

Pour appliquer la première migration avant le premier déploiement, ou pour migrer manuellement, définir `DATABASE_URL` et `DIRECT_URL` dans l’environnement puis exécuter :

```text
npm --workspace apps/api run prisma:deploy
```

Cette commande applique uniquement les migrations versionnées. **Ne pas lancer le seed en production** : le seed de démonstration réinitialise des données. Vérifier le SQL de toute nouvelle migration sur une base de préproduction et privilégier des changements rétrocompatibles; une migration Production peut s’appliquer même si le déploiement applicatif échoue ensuite.

## 3. Configurer l’unique projet Vercel

1. Importer le dépôt Git dans Vercel une seule fois.
2. Définir **Root Directory** sur `MARKETNET_ARCHITECTURE/apps/web`.
3. Garder le framework **Next.js**. Le fichier `vercel.json` lance le build du monorepo; il génère le client Prisma, compile NestJS, construit Next.js puis applique les migrations en Production uniquement.
4. Ne créer ni projet Vercel séparé pour `apps/api`, ni service Docker.
5. Déployer une fois que Supabase est migré et que les variables sont renseignées.

Variables Vercel à ajouter pour Production, Preview et Development selon les bases utilisées :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction pooler (port `6543`) |
| `DIRECT_URL` | Supabase Session pooler (port `5432`) |
| `JWT_SECRET` | Secret aléatoire long et unique |
| `REFRESH_TOKEN_SECRET` | Autre secret aléatoire long et unique |
| `APP_URL` | URL HTTPS du domaine Vercel, par exemple `https://<projet>.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `MarketNet` |

`NEXT_PUBLIC_API_URL` doit rester **non défini en production** : les appels du navigateur vont alors vers `/api/v1/...` sur le même domaine. Il reste défini sur `http://localhost:3001` en développement local. `API_PORT`, `API_URL` et les variables `POSTGRES_*` ne sont pas nécessaires sur Vercel.

Pour le développement local, ajouter `DIRECT_URL` au fichier `apps/api/.env` avec la même URL PostgreSQL locale que `DATABASE_URL`. Sur Vercel, saisir les deux URLs Supabase séparément comme indiqué plus haut. `VERCEL_URL` est fourni par Vercel pour autoriser les origines des déploiements Preview; `APP_URL` reste le domaine de production.

## 4. Limites à garder en tête

- Vercel traite l’API comme une fonction serverless : elle démarre à la demande et peut redémarrer entre deux requêtes. Aucun état en mémoire ne doit être considéré comme persistant; PostgreSQL reste la source de vérité.
- Les images logo, couverture et produit sont actuellement compressées dans le navigateur et sauvegardées comme data URLs dans les colonnes texte PostgreSQL. Elles survivent donc aux déploiements; aucun fichier n’est écrit sur le disque éphémère Vercel. Ce n’est toutefois **pas** Supabase Storage : la base grossira avec les images et les réponses API transmettent aussi les données encodées. Prévoir un bucket Supabase Storage et des URLs d’objets si le catalogue ou le volume média augmente.
- Vercel limite les requêtes entrantes à environ **4,5 Mo**. Le parseur Nest est maintenant limité à 4 Mo, et l’interface/API plafonnent un média encodé à 3 000 000 caractères. Les gros fichiers sont donc refusés avant une erreur de payload Vercel.
- Ne pas ajouter d’écriture de fichiers sur le système de fichiers local en production; les fichiers locaux d’une fonction serverless ne sont pas un stockage durable.
- La migration automatique au build n’est pas une garantie de déploiement transactionnel de l’application et du schéma; garder chaque migration rétrocompatible avec la version en ligne pendant le rollout.
- Après le premier déploiement, vérifier `/api/v1/products` et les parcours d’inscription/connexion/commande sur le domaine Vercel. La documentation Swagger, si activée, est exposée par l’API sous `/api/v1`.
