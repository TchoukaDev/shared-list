# shared-list — CLAUDE.md

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4 (tokens via `@theme` dans `globals.css`)
- Supabase (Auth OTP + Realtime à venir)

## Structure du projet

```
app/
  (authenticated)/          # Routes protégées — layout avec Navbar
    page.tsx                # Liste des listes (ListRow)
    lists/[id]/page.tsx     # Détail d'une liste (ListCard + TaskItem)
  login/                    # Page publique
proxy.ts                    # Middleware auth (renommé depuis middleware.ts en Next.js 16)
lib/
  supabase/
    client.ts               # Client browser (singleton)
    server.ts               # Client serveur (Server Components, Server Actions)
  types.ts                  # Interfaces miroir du schéma Supabase
  utils.ts                  # cn(), formatDate(), listColor(index)
components/
  Navbar.tsx                # Sticky, terra-100, bouton logout
  ListRow.tsx               # Ligne sur la page d'accueil (titre + progression + index)
  ListCard.tsx              # Carte détail avec tâches (page /lists/[id])
  TaskItem.tsx              # Item individuel avec validation, edit, delete
```

## Design system — "Warm Sand & Terracotta"

Tokens définis dans `app/globals.css` via `@theme`. Utiliser les classes Tailwind générées.

| Token | Usage |
|---|---|
| `sand-50` | Fond de page |
| `stone-50` | Surface carte |
| `terra-500` | Action primaire |
| `terra-600` | Hover primaire |
| `terra-100` | Fond teinté terra (Navbar) |
| `sage-500` | Tâche complétée |
| `stone-900` | Texte principal |
| `stone-600` | Texte secondaire |
| `stone-200` | Bordures |

Classe utilitaire `.card` : fond `stone-50`, border `stone-200`, shadow discrète.
Animations : `.animate-task-in`, `.animate-task-out`, `.animate-fade-in`, `.animate-slide-up`.
Couleurs des listes : `listColor(index)` dans `lib/utils.ts` — cycle automatique, pas de colonne `color` en DB.

## Types (lib/types.ts)

- `List` : `id, name, owner_id, created_at, updated_at` — pas de champ `color` (calculé via index)
- `Task` : `id, list_id, content, completed, position, created_by, created_at, updated_at`
- Les compteurs (`taskCount`, `completedCount`) sont des props séparées, pas dans le type `List`

## Auth

- OTP email uniquement (`signInWithOtp` + `verifyOtp`)
- `shouldCreateUser: false` — les utilisateurs sont créés manuellement dans Supabase
- Le proxy redirige `/login` → `/` si connecté, et `/*` → `/login` si non connecté
- Longueur OTP : 6 chiffres (configurable dans Supabase Dashboard → Auth → Providers → Email)

## Conventions

- **Mode pédagogique** : ne pas tout coder d'un coup — guider l'utilisateur étape par étape, expliquer avant d'implémenter, laisser l'utilisateur écrire lui-même
- Commentaires inline sur toute la logique non évidente
- `"use client"` uniquement si nécessaire (hooks, events)
- Touch targets ≥ 44px sur mobile
- `inputMode="numeric"` pour les claviers mobiles

## Prochaines étapes (à faire en mode pédagogique)

### 1. Base de données Supabase (sans ORM)
- Créer les tables `lists` et `tasks` dans l'éditeur SQL Supabase
- Colonnes : voir `lib/types.ts` pour la structure exacte
- Activer RLS (Row Level Security) + écrire les policies
- Brancher les vrais appels Supabase dans les pages (remplacer les MOCK_*)
- Utiliser le client serveur (`lib/supabase/server.ts`) dans les Server Components

### 2. Supabase Realtime
- **Architecture :** Server Component pour le premier chargement (pas de flash de loading) + hook client pour le Realtime
- Le Server Component fetch les données → les passe en props au composant client
- Le composant client initialise son state avec ces données, puis s'abonne aux changements
- Le navigateur ouvre une WebSocket directement vers Supabase (pas via Next.js server)
- S'abonner via `supabase.channel().on('postgres_changes', ...)` — events `INSERT`, `UPDATE`, `DELETE`
- À implémenter dans des hooks custom : `useRealtimeTasks(listId, initialTasks)` et `useRealtimeLists(initialLists)`
- Différence avec TanStack Query + optimistic updates : ici les changements des **autres utilisateurs** arrivent en push, sans polling ni refetch manuel

### 3. PWA
- `public/manifest.json` — nom, icônes, couleurs, `display: standalone`
- `public/sw.js` — service worker minimal (cache statique)
- Composant `ServiceWorkerRegistration` (client) — enregistre le SW au montage
- Ajouter les balises `<link rel="manifest">` et `<meta name="theme-color">` dans `app/layout.tsx`

### 4. Drag & Drop
- Bibliothèque : `@dnd-kit/core` + `@dnd-kit/sortable` (légère, tactile, accessible)
- Drag des listes sur la page d'accueil → mettre à jour l'ordre en DB
- Drag des tâches dans une liste → mettre à jour le champ `position` en DB
- Gérer l'optimistic update : réordonner localement avant la confirmation Supabase

### 5. Inviter un utilisateur dans une liste
- **État actuel** : UI + route `/api/invite` fonctionnelle, recherche par email via `auth.admin.listUsers()` + `.find()`
- **Priorité 1 — Table `profiles`** : remplacer le `.find()` par un vrai `select` sur une table `profiles` synchronisée avec `auth.users` via trigger Postgres :
  ```sql
  create table profiles (
    id    uuid primary key references auth.users(id) on delete cascade,
    email text not null
  );
  create function sync_profile() returns trigger as $$
  begin
    insert into profiles (id, email) values (new.id, new.email);
    return new;
  end;
  $$ language plpgsql security definer;
  create trigger on_auth_user_created
    after insert on auth.users for each row execute function sync_profile();
  ```
  Ensuite dans `/api/invite` : `.from("profiles").select("id").eq("email", email).single()` — plus besoin du client admin pour cette opération
- **Priorité 2 — Email de notification avec Resend** : envoyer un email à l'invité après insertion dans `list_members`
  - Installer `resend` + configurer `RESEND_API_KEY` dans `.env.local`
  - Appeler `resend.emails.send(...)` à la fin de la route `/api/invite`
  - Template minimal : nom de la liste + nom de l'owner + lien vers l'app
- **Masquer le bouton supprimer** pour les membres non-owner (comparer `list.owner_id` avec `userId` en prop)
- **Gestion des rôles** : seul l'`owner` peut inviter / retirer des membres
