# shared-list — CLAUDE.md

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4 (tokens via `@theme` dans `globals.css`)
- Supabase (Auth OTP + Realtime à venir)

## Structure du projet

```
app/
  (authenticated)/          # Routes protégées — layout avec NavbarServer
    page.tsx                # Liste des listes (ListsList)
    lists/[id]/page.tsx     # Détail d'une liste (ListCard + TaskItem)
  login/                    # Page publique
  api/
    invite/route.ts         # POST — invite un utilisateur dans une liste (+ notif push)
    notify/route.ts         # POST — envoie des notifs push aux membres (avec throttle 2min)
proxy.ts                    # Middleware auth (renommé depuis middleware.ts en Next.js 16)
lib/
  supabase/
    client.ts               # Client browser (singleton)
    server.ts               # Client serveur (Server Components, Server Actions)
    admin.ts                # Client admin (SUPABASE_SECRET_KEYS) — Route Handlers uniquement
  types.ts                  # Interfaces miroir du schéma Supabase
  utils.ts                  # cn(), formatDate(), listColor(index)
components/
  NavbarServer.tsx          # Wrapper serveur — fetche le profil, passe en props à Navbar
  Navbar.tsx                # Sticky, terra-100, profil à gauche + bouton logout
  ListsList.tsx             # Client component — reçoit les listes en props
  ListRow.tsx               # Orchestre ListRowMobile / ListRowDesktop via useMediaQuery
  ListRowMobile.tsx         # Swipe gauche pour révéler edit/delete
  ListRowDesktop.tsx        # Menu "..." pour edit/delete
  ListCard.tsx              # Carte détail avec tâches + optimistic updates
  TaskItem.tsx              # Item individuel avec validation, edit, delete
  InviteButton.tsx          # Bouton client + portal pour InviteModal (owner seulement)
  NewListButton.tsx         # Bouton client + portal pour CreateListModal
  modals/
    CreateListModal.tsx
    EditListModal.tsx
    DeleteListModal.tsx
    InviteModal.tsx
    SettingsModal.tsx       # Profil : prénom, nom, avatar (upload vers bucket "avatars")
hooks/
  useMediaQuery.ts          # Hook SSR-safe pour responsive
  useRealtimeTasks.ts       # Supabase Realtime sur tasks — expose { tasks, setTasks }
  useRealtimeLists.ts       # Supabase Realtime sur lists
  usePushNotifications.ts   # Abonnement Web Push — upsert dans push_subscriptions
lib/
  sendPushNotification.ts   # Helper partagé — récupère subscriptions + web-push.sendNotification
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
- `Profile` : `id, email, first_name, last_name, avatar_url, created_at, updated_at`
- `ListWithCount` : `{ list: List, taskCount: number, completedCount: number }`
- Les compteurs (`taskCount`, `completedCount`) sont des props séparées, pas dans le type `List`

## Supabase Storage

- Bucket `avatars` — public, organisé par `{userId}/{timestamp}.{ext}`
- Policies : INSERT, UPDATE, DELETE restreints au dossier de l'utilisateur via `storage.foldername(name)[1] = auth.uid()::text`
- Domaine autorisé dans `next.config.ts` : `*.supabase.co` (wildcard) pour `next/image`
- Ordre upload : 1. upload nouveau → 2. update profiles → 3. suppression ancien (évite la perte si l'update échoue)

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

### 2. Supabase Realtime ✅
- `useRealtimeTasks(listId, initialTasks)` — implémenté dans `hooks/useRealtimeTasks.ts`
- `useRealtimeLists(initialLists)` — implémenté dans `hooks/useRealtimeLists.ts` (intérêt limité car les listes sont filtrées par RLS)
- **Prérequis Supabase** : activer la table dans Database → Replication → publication `supabase_realtime`
- **Filtre DELETE** : `payload.old` ne contient que la primary key par défaut (REPLICA IDENTITY DEFAULT) — ne pas filtrer par `list_id` sur les DELETE, filtrer côté client sur INSERT/UPDATE uniquement
- **Déduplication INSERT** : vérifier `prev.some(t => t.id === newTask.id)` pour ignorer les events de nos propres optimistic updates

### 3. PWA ✅
- `public/manifest.json` — nom, icônes, couleurs, `display: standalone`
- `public/sw.js` — service worker : cache statique, network-first fetch, push handler, notificationclick handler
- `app/offline/page.tsx` — page offline styled design system
- Composant `ServiceWorkerRegistration` (client) — enregistre le SW au montage
- Balises PWA dans `app/layout.tsx` : manifest, appleWebApp, theme-color
- Icônes : `public/icons/web-app-manifest-192x192.png` et `512x512.png`

### 4. Notifications push ✅
- VAPID : générer avec `npx web-push generate-vapid-keys`, stocker dans `.env.local`
- Table `push_subscriptions` : endpoint, p256dh, auth par user (unique sur user_id + endpoint)
- Table `notification_throttle` : (user_id, list_id) primary key, `last_sent_at` — throttle 2min pour les events de tâches
- `usePushNotifications` : vérifie `pushManager.getSubscription()` d'abord — upsert DB uniquement si pas encore abonné
- `lib/sendPushNotification.ts` : helper partagé évitant les appels HTTP entre routes
- `/api/notify` : exclut l'acteur, throttle task_added/task_deleted, envoie via sendPushNotification
- `/api/invite` : notifie l'invité directement après insertion dans list_members
- Events notifiés : `list_deleted`, `task_added`, `task_deleted` (throttle 2min), invitation dans une liste
- L'acteur (user.id) est toujours exclu des destinataires

### 5. Drag & Drop
- Bibliothèque : `@dnd-kit/core` + `@dnd-kit/sortable` (légère, tactile, accessible)
- Drag des listes sur la page d'accueil → mettre à jour l'ordre en DB
- Drag des tâches dans une liste → mettre à jour le champ `position` en DB
- Gérer l'optimistic update : réordonner localement avant la confirmation Supabase

### 6. Inviter un utilisateur dans une liste
- **État actuel** : UI + route `/api/invite` fonctionnelle, table `profiles` créée avec trigger sync depuis `auth.users`
- La route utilise encore `auth.admin.listUsers()` — **à remplacer** par `.from("profiles").select("id").eq("email", email).single()`
- Seul le owner peut inviter/modifier/supprimer une liste — boutons cachés + guards dans les handlers + RLS
- **Email de notification avec Resend** : envoyer un email à l'invité après insertion dans `list_members`
  - Installer `resend` + configurer `RESEND_API_KEY` dans `.env.local`
  - Appeler `resend.emails.send(...)` à la fin de la route `/api/invite`
  - Template minimal : nom de la liste + nom de l'owner + lien vers l'app
- **Masquer le bouton supprimer** pour les membres non-owner (comparer `list.owner_id` avec `userId` en prop)
- **Gestion des rôles** : seul l'`owner` peut inviter / retirer des membres
