-- Nivtec 1.1: skupina s rolami a spoločné nastavenie Nivtec.
-- Spusti raz v Supabase → SQL Editor (po 0001_init.sql).
--
-- - Do aplikácie sa dostane len člen skupiny. Admin pridáva ľudí podľa e-mailu (pozvánka);
--   účet si človek založí sám na stránke, ale len s e-mailom, ktorý admin pridal.
-- - Nastavenie Nivtec (diely, rozmery) je jedno spoločné pre celú skupinu; mení ho len admin.
--
-- Prvého admina pridáš na konci tohto súboru (doplň svoj e-mail).

-- Osobné nastavenie z verzie 1.0 sa už nepoužíva.
drop table if exists public.nivtec_configs;
drop function if exists public.nivtec_touch() cascade;

-- ---------------------------------------------------------------------------
-- Členovia skupiny
-- ---------------------------------------------------------------------------

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and email like '%@%'),
  role text not null default 'member' check (role in ('admin', 'member')),
  -- Prázdne, kým si pozvaný človek nezaloží účet.
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Rola prihláseného používateľa; null = nie je člen. Security definer, aby sa RLS nezacyklila.
create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.members m where m.user_id = (select auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

alter table public.members enable row level security;

drop policy if exists "členovia: čítanie" on public.members;
create policy "členovia: čítanie" on public.members
  for select to authenticated using (public.my_role() is not null);

drop policy if exists "členovia: pridanie" on public.members;
create policy "členovia: pridanie" on public.members
  for insert to authenticated with check (public.is_admin());

drop policy if exists "členovia: zmena roly" on public.members;
create policy "členovia: zmena roly" on public.members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "členovia: odobratie" on public.members;
create policy "členovia: odobratie" on public.members
  for delete to authenticated using (public.is_admin());

revoke all on public.members from anon, authenticated;
grant select, delete on public.members to authenticated;
grant insert (email, role), update (role) on public.members to authenticated;

-- Skupina nesmie ostať bez admina (admin sa nemôže omylom odobrať ani zbaviť roly ako posledný).
create or replace function public.members_keep_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.members where role = 'admin') then
    raise exception 'Skupina musí mať aspoň jedného admina.';
  end if;
  return null;
end;
$$;

drop trigger if exists members_keep_admin on public.members;
create constraint trigger members_keep_admin after update or delete on public.members
  deferrable initially deferred for each row execute function public.members_keep_admin();

-- Pozvaný, ktorý už účet má, sa prepojí hneď.
create or replace function public.members_link_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.email := lower(trim(new.email));
  if new.user_id is null then
    select u.id into new.user_id from auth.users u where lower(u.email) = new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists members_link_user on public.members;
create trigger members_link_user before insert on public.members
  for each row execute function public.members_link_user();

-- Registrácia len na pozvánku: účet s e-mailom, ktorý nie je v skupine, sa nevytvorí.
create or replace function public.nivtec_on_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.members m where m.email = lower(new.email)) then
    raise exception 'Tento e-mail nemá pozvánku do skupiny.';
  end if;
  update public.members set user_id = new.id where email = lower(new.email) and user_id is null;
  return new;
end;
$$;

drop trigger if exists nivtec_on_signup on auth.users;
create trigger nivtec_on_signup after insert on auth.users
  for each row execute function public.nivtec_on_signup();

-- ---------------------------------------------------------------------------
-- Spoločné nastavenie Nivtec (jeden riadok)
-- ---------------------------------------------------------------------------

create table if not exists public.nivtec_settings (
  id smallint primary key default 1 check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.nivtec_settings enable row level security;

drop policy if exists "nastavenie: čítanie" on public.nivtec_settings;
create policy "nastavenie: čítanie" on public.nivtec_settings
  for select to authenticated using (public.my_role() is not null);

drop policy if exists "nastavenie: vloženie" on public.nivtec_settings;
create policy "nastavenie: vloženie" on public.nivtec_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "nastavenie: úprava" on public.nivtec_settings;
create policy "nastavenie: úprava" on public.nivtec_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.nivtec_settings from anon, authenticated;
grant select on public.nivtec_settings to authenticated;
grant insert (config), update (config) on public.nivtec_settings to authenticated;

create or replace function public.nivtec_settings_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists nivtec_settings_touch on public.nivtec_settings;
create trigger nivtec_settings_touch before update on public.nivtec_settings
  for each row execute function public.nivtec_settings_touch();

-- Funkcie na rolu volajú len prihlásení (cez RLS); anonymný návštevník nie.
revoke execute on function public.my_role(), public.is_admin() from public, anon;
grant execute on function public.my_role(), public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Prvý admin: doplň svoj e-mail a odkomentuj (alebo spusti samostatne).
-- Ak už v Supabase účet s týmto e-mailom máš, prepojí sa hneď.
-- ---------------------------------------------------------------------------
-- insert into public.members (email, role) values ('tvoj@email.sk', 'admin');
