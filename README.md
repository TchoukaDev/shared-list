# Shared List

Application de listes partagées en temps réel. Crée des listes, invite des membres, et collabore en temps réel.

## Stack

- **Next.js 16** — App Router, Turbopack, Server Components
- **React 19** — Client Components, optimistic updates
- **TypeScript** (strict)
- **Tailwind CSS v4** — design system custom "Warm Sand & Terracotta"
- **Supabase** — Auth (OTP email), PostgreSQL, RLS, Realtime, Storage

## Fonctionnalités

- Authentification par OTP email (sans mot de passe)
- Création et gestion de listes
- Invitation de membres par email
- Tâches avec ajout, modification, validation, suppression
- Mises à jour en temps réel via Supabase Realtime (WebSocket)
- Profil utilisateur avec avatar (upload vers Supabase Storage)
- Interface responsive — swipe mobile, menu desktop

## Installation

```bash
npm install
```

Crée un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SECRET_KEYS=eyJ...
```

```bash
npm run dev
```

## Base de données Supabase

### Tables

```sql
-- Listes
create table lists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tâches
create table tasks (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references lists(id) on delete cascade,
  content    text not null,
  completed  boolean not null default false,
  position   integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Membres d'une liste
create table list_members (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references lists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (list_id, user_id)
);

-- Profils publics (synchronisés depuis auth.users)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  first_name text,
  last_name  text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Triggers

```sql
-- updated_at automatique
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on lists for each row execute function set_updated_at();
create trigger set_updated_at before update on tasks for each row execute function set_updated_at();
create trigger set_updated_at before update on list_members for each row execute function set_updated_at();
create trigger set_updated_at before update on profiles for each row execute function set_updated_at();

-- Synchronisation profiles ← auth.users
create or replace function sync_profile()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function sync_profile();

-- Backfill des utilisateurs existants
insert into profiles (id, email)
select id, email from auth.users
on conflict do nothing;
```

### RLS (Row Level Security)

Activer RLS sur toutes les tables, puis appliquer les policies :

```sql
-- Fonction helper pour éviter la récursion dans les policies lists
create or replace function is_list_member(lid uuid)
returns boolean as $$
  select exists (
    select 1 from list_members
    where list_id = lid and user_id = auth.uid()
  );
$$ language sql security definer;

-- lists : visible si owner ou membre
create policy "lists: select" on lists for select to authenticated
  using (owner_id = auth.uid() or is_list_member(id));

create policy "lists: insert" on lists for insert to authenticated
  with check (owner_id = auth.uid());

create policy "lists: update" on lists for update to authenticated
  using (owner_id = auth.uid());

create policy "lists: delete" on lists for delete to authenticated
  using (owner_id = auth.uid());

-- tasks : accessible aux membres de la liste
create policy "tasks: select" on tasks for select to authenticated
  using (exists (
    select 1 from lists
    where lists.id = tasks.list_id
    and (lists.owner_id = auth.uid() or is_list_member(lists.id))
  ));

create policy "tasks: insert" on tasks for insert to authenticated
  with check (
    created_by = auth.uid() and exists (
      select 1 from lists
      where lists.id = list_id
      and (lists.owner_id = auth.uid() or is_list_member(lists.id))
    )
  );

create policy "tasks: update" on tasks for update to authenticated
  using (exists (
    select 1 from lists
    where lists.id = tasks.list_id
    and (lists.owner_id = auth.uid() or is_list_member(lists.id))
  ));

create policy "tasks: delete" on tasks for delete to authenticated
  using (exists (
    select 1 from lists
    where lists.id = tasks.list_id
    and (lists.owner_id = auth.uid() or is_list_member(lists.id))
  ));

-- list_members
create policy "list_members: select" on list_members for select to authenticated
  using (is_list_member(list_id) or exists (
    select 1 from lists where lists.id = list_id and lists.owner_id = auth.uid()
  ));

create policy "list_members: insert" on list_members for insert to authenticated
  with check (exists (
    select 1 from lists where lists.id = list_id and lists.owner_id = auth.uid()
  ));

create policy "list_members: delete" on list_members for delete to authenticated
  using (exists (
    select 1 from lists where lists.id = list_id and lists.owner_id = auth.uid()
  ));

-- profiles : lecture publique, modification personnelle uniquement
create policy "profiles: select" on profiles for select to authenticated
  using (true);

create policy "profiles: update" on profiles for update to authenticated
  using (id = auth.uid());
```

### Storage

Créer un bucket **`avatars`** (public), puis :

```sql
create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

### Realtime

Dashboard → Database → Replication → cocher les tables `lists` et `tasks` dans la publication `supabase_realtime`.

### Auth

- Dashboard → Authentication → Providers → Email : désactiver "Confirm email", activer OTP
- OTP length : 6 chiffres
- `shouldCreateUser: false` — les utilisateurs sont créés manuellement dans le dashboard

## Troubleshooting

### `NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set`
Le nom exact de la variable est `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (pas `NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY`). Vérifier `.env.local`.

### RLS infinite recursion sur `lists`
La policy `lists: select` ne doit pas requêter `list_members` directement — ça crée une récursion. Utiliser la fonction `is_list_member()` avec `security definer` qui bypasse le RLS.

### Erreur PostgREST PGRST100 avec `.or()` sur table jointe
Ne pas utiliser `.or("lists.owner_id.eq.xxx,...")` sur une relation jointe. Le RLS filtre automatiquement — une simple `.select("*")` suffit.

### Realtime DELETE ne se propage pas
`payload.old` ne contient que la primary key par défaut (REPLICA IDENTITY DEFAULT). Ne pas filtrer les events DELETE par `list_id` côté serveur. Appliquer le filtre côté client pour INSERT/UPDATE, et pour DELETE tenter le retrait par `id` directement — si la tâche n'est pas dans le state, rien ne change.

### Flash au remplacement tâche temporaire → réelle
Quand l'optimistic update (temp id) est remplacée par la vraie tâche, le `key` React change et provoque un remount. Solution : utiliser un champ `_reactKey` stable initialisé avec le temp id et conservé lors du remplacement.

### Supabase delete silencieux en cas de refus RLS
`.delete()` retourne `{ error: null, count: 0 }` quand RLS bloque — pas d'exception. Vérifier `count === 0` pour détecter un refus et déclencher le rollback.

### Swipe mobile déclenche la navigation après fermeture
Utiliser un `ref` `justClosedSwipe` mis à `true` dans `handlePointerUp` et dans le listener `pointerdown` de fermeture. Dans le `onClick` du `<Link>`, appeler `e.preventDefault()` si ce ref est `true` puis le remettre à `false`.

### `auth.admin.listUsers()` lent / quota limité
Remplacer par une query sur la table `profiles` : `.from("profiles").select("id").eq("email", email).single()`. La table `profiles` est synchronisée automatiquement depuis `auth.users` via trigger.

### Image avatar qui ne se met pas à jour après modification
Appeler `router.refresh()` après le save dans `SettingsModal` pour forcer le re-fetch du Server Component `NavbarServer`.

### `next/image` refuse les URLs Supabase Storage
Ajouter dans `next.config.ts` :
```ts
images: {
  remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }]
}
```
