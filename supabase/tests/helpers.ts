import { readdirSync, readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Minimum zo Supabase, o ktoré sa migrácie opierajú: roly a auth schéma (rovnako ako v RigTracku).
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as
    $$ select (auth.jwt() ->> 'sub')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
`

const MIGRATIONS = 'supabase/migrations'

type Row = Record<string, string>

/** Čistá databáza so všetkými migráciami a pomôckami na dotazy v mene používateľa. */
export async function createTestDb() {
  const db = new PGlite()
  await db.exec(SUPABASE_STUB)
  for (const file of readdirSync(MIGRATIONS).sort()) await db.exec(readFileSync(`${MIGRATIONS}/${file}`, 'utf8'))
  const users: Record<string, string> = {}
  const rows = async (sql: string, params: unknown[] = []) => (await db.query<Row>(sql, params)).rows

  return {
    users,
    /** Dotaz ako superuser (obchádza RLS), na prípravu a kontrolu dát. */
    rows,
    /** Registrácia účtu, ako ju robí Supabase Auth. */
    async signUp(name: string, email: string) {
      const [row] = await rows('insert into auth.users (email) values ($1) returning id', [email])
      users[name] = row.id
    },
    /** Dotaz ako prihlásený používateľ (alebo anon, ak name = null). */
    async as(name: string | null, sql: string, params: unknown[] = []): Promise<Row[]> {
      await db.query(`select set_config('request.jwt.claims', $1, false)`, [name ? JSON.stringify({ sub: users[name] }) : ''])
      await db.exec(`set role ${name ? 'authenticated' : 'anon'}`)
      try {
        return await rows(sql, params)
      } finally {
        await db.exec('reset role')
      }
    },
  }
}
