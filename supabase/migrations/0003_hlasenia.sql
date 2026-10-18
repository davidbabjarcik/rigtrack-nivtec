-- Nivtec 1.3: hlásenie chýb.
-- Spusti raz v Supabase → SQL Editor (po 0002_skupina.sql).
--
-- Člen skupiny nahlási chybu; hlásenia vidí celá skupina (aby sa tá istá nehlásila dvakrát).
-- Stav a odpoveď mení admin. Autor si môže zmazať svoje hlásenie, kým je nové; admin hocijaké.
-- Autora a e-mail dopĺňa databáza, nedajú sa podvrhnúť.

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 120),
  body text not null default '' check (char_length(body) <= 4000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  reply text not null default '' check (char_length(reply) <= 2000),
  -- Pripojené samo: verzia aplikácie, podstránka, prehliadač, posledná chyba.
  context jsonb not null default '{}' check (octet_length(context::text) <= 4000),
  created_by uuid references auth.users (id) on delete set null,
  author_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bug_reports_created_at_idx on public.bug_reports (created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists "hlásenia: čítanie" on public.bug_reports;
create policy "hlásenia: čítanie" on public.bug_reports
  for select to authenticated using (public.my_role() is not null);

drop policy if exists "hlásenia: nové" on public.bug_reports;
create policy "hlásenia: nové" on public.bug_reports
  for insert to authenticated with check (public.my_role() is not null);

drop policy if exists "hlásenia: stav a odpoveď" on public.bug_reports;
create policy "hlásenia: stav a odpoveď" on public.bug_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "hlásenia: zmazanie" on public.bug_reports;
create policy "hlásenia: zmazanie" on public.bug_reports
  for delete to authenticated
  using (public.is_admin() or (created_by = (select auth.uid()) and status = 'new' and public.my_role() is not null));

revoke all on public.bug_reports from anon, authenticated;
grant select, delete on public.bug_reports to authenticated;
grant insert (title, body, context), update (status, reply) on public.bug_reports to authenticated;

-- Autor, e-mail a začiatočný stav nastaví databáza; pri úprave sa zapíše čas.
create or replace function public.bug_reports_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.author_email := coalesce((select u.email from auth.users u where u.id = auth.uid()), '');
    new.status := 'new';
    new.reply := '';
    new.created_at := now();
  end if;
  new.title := trim(new.title);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bug_reports_stamp on public.bug_reports;
create trigger bug_reports_stamp before insert or update on public.bug_reports
  for each row execute function public.bug_reports_stamp();
