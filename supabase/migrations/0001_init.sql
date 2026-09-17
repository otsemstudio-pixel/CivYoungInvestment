-- Schéma initial : patrimoine & épargne
-- Tous les montants sont des entiers en FCFA (bigint). Jamais de décimales.

-- ============================================================
-- Types énumérés
-- ============================================================

create type asset_type as enum (
  'mobile_money',
  'compte_bancaire',
  'sfd',
  'tontine',
  'foncier',
  'stock_marchandise',
  'creance',
  'especes',
  'autre'
);

create type liquidity_status as enum ('disponible', 'immobilise');

create type goal_cadence as enum ('hebdomadaire', 'quinzaine', 'mensuelle');

create type goal_status as enum ('actif', 'atteint', 'abandonne');

create type contribution_kind as enum ('verse', 'saute');

create type skip_reason as enum (
  'imprevu',
  'revenu_retard',
  'objectif_trop_eleve',
  'autre'
);

-- ============================================================
-- profiles
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid () = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid () = id);

-- Pas de policy insert/delete : la ligne est créée par le trigger
-- handle_new_user() et ne doit jamais être supprimée manuellement.

-- Création automatique du profil à l'inscription.
create function handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user ();

-- ============================================================
-- assets
-- ============================================================

create table assets (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type asset_type not null,
  value_xof bigint not null,
  liquidity liquidity_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_user_id_idx on assets (user_id);

alter table assets enable row level security;

create policy "assets_select_own"
  on assets for select
  using (auth.uid () = user_id);

create policy "assets_insert_own"
  on assets for insert
  with check (auth.uid () = user_id);

create policy "assets_update_own"
  on assets for update
  using (auth.uid () = user_id);

create policy "assets_delete_own"
  on assets for delete
  using (auth.uid () = user_id);

-- Valeur par défaut de la liquidité selon le type, si non fournie.
create function default_asset_liquidity ()
returns trigger
language plpgsql
as $$
begin
  if new.liquidity is null then
    if new.type in ('mobile_money', 'compte_bancaire', 'especes') then
      new.liquidity := 'disponible';
    else
      new.liquidity := 'immobilise';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger assets_before_insert
  before insert on assets
  for each row
  execute function default_asset_liquidity ();

create trigger assets_before_update
  before update on assets
  for each row
  execute function default_asset_liquidity ();

-- ============================================================
-- goals
-- ============================================================

create table goals (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_xof bigint not null,
  deadline date not null,
  cadence goal_cadence not null,
  cadence_anchor int not null,
  deposit_location text not null,
  status goal_status not null default 'actif',
  created_at timestamptz not null default now(),
  constraint goals_cadence_anchor_range check (cadence_anchor between 1 and 28)
);

create index goals_user_id_idx on goals (user_id);

alter table goals enable row level security;

create policy "goals_select_own"
  on goals for select
  using (auth.uid () = user_id);

create policy "goals_insert_own"
  on goals for insert
  with check (auth.uid () = user_id);

create policy "goals_update_own"
  on goals for update
  using (auth.uid () = user_id);

create policy "goals_delete_own"
  on goals for delete
  using (auth.uid () = user_id);

-- Maximum 2 objectifs actifs par utilisateur, refusé côté serveur.
create function enforce_max_active_goals ()
returns trigger
language plpgsql
as $$
declare
  active_count int;
begin
  if new.status = 'actif' then
    select count(*) into active_count
    from goals
    where user_id = new.user_id
      and status = 'actif'
      and id <> new.id;

    if active_count >= 2 then
      raise exception 'max_active_goals_reached'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger goals_before_insert
  before insert on goals
  for each row
  execute function enforce_max_active_goals ();

create trigger goals_before_update
  before update on goals
  for each row
  when (new.status = 'actif')
  execute function enforce_max_active_goals ();

-- ============================================================
-- contributions
-- ============================================================

create table contributions (
  id uuid primary key default gen_random_uuid (),
  goal_id uuid not null references goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  kind contribution_kind not null,
  amount_xof bigint not null default 0,
  skip_reason skip_reason,
  declared_at timestamptz not null default now(),
  constraint contributions_goal_period_unique unique (goal_id, period_start),
  constraint contributions_amount_nonnegative check (amount_xof >= 0),
  constraint contributions_saute_amount_zero check (
    kind <> 'saute' or amount_xof = 0
  )
);

create index contributions_user_id_idx on contributions (user_id);
create index contributions_goal_id_idx on contributions (goal_id);

alter table contributions enable row level security;

create policy "contributions_select_own"
  on contributions for select
  using (auth.uid () = user_id);

create policy "contributions_insert_own"
  on contributions for insert
  with check (auth.uid () = user_id);

create policy "contributions_update_own"
  on contributions for update
  using (auth.uid () = user_id);

create policy "contributions_delete_own"
  on contributions for delete
  using (auth.uid () = user_id);

-- ============================================================
-- snapshots
-- ============================================================

create table snapshots (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null,
  total_xof bigint not null,
  available_xof bigint not null,
  immobilized_xof bigint not null,
  created_at timestamptz not null default now(),
  constraint snapshots_user_month_unique unique (user_id, month)
);

create index snapshots_user_id_idx on snapshots (user_id);

alter table snapshots enable row level security;

create policy "snapshots_select_own"
  on snapshots for select
  using (auth.uid () = user_id);

-- Écriture réservée au cron (clé service_role, qui contourne RLS).
-- Aucune policy insert/update/delete pour les utilisateurs.

-- ============================================================
-- push_subscriptions
-- ============================================================

create table push_subscriptions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on push_subscriptions for select
  using (auth.uid () = user_id);

create policy "push_subscriptions_insert_own"
  on push_subscriptions for insert
  with check (auth.uid () = user_id);

create policy "push_subscriptions_update_own"
  on push_subscriptions for update
  using (auth.uid () = user_id);

create policy "push_subscriptions_delete_own"
  on push_subscriptions for delete
  using (auth.uid () = user_id);
