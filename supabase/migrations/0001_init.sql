-- Nivtec kalkulačka: schéma pre samostatný Supabase projekt.
-- Spusti raz v Supabase → SQL Editor.
--
-- Každý prihlásený používateľ má jedno vlastné nastavenie pódiového systému.
-- Riadok vidí a mení len jeho vlastník (RLS); anonymný návštevník k tabuľke nemá prístup.

create table if not exists public.nivtec_configs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.nivtec_configs enable row level security;

drop policy if exists "vlastné nastavenie: čítanie" on public.nivtec_configs;
create policy "vlastné nastavenie: čítanie" on public.nivtec_configs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "vlastné nastavenie: vloženie" on public.nivtec_configs;
create policy "vlastné nastavenie: vloženie" on public.nivtec_configs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "vlastné nastavenie: úprava" on public.nivtec_configs;
create policy "vlastné nastavenie: úprava" on public.nivtec_configs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Anonymná rola nemá k tabuľke žiadne práva, ani keby niekto omylom pridal politiku.
revoke all on public.nivtec_configs from anon;
grant select, insert, update on public.nivtec_configs to authenticated;

-- Čas poslednej úpravy sa nastaví sám.
create or replace function public.nivtec_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists nivtec_configs_touch on public.nivtec_configs;
create trigger nivtec_configs_touch before update on public.nivtec_configs
  for each row execute function public.nivtec_touch();
