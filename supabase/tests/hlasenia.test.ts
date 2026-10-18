import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from './helpers'

type Db = Awaited<ReturnType<typeof createTestDb>>
let db: Db

beforeEach(async () => {
  db = await createTestDb()
  await db.rows(`insert into public.members (email, role) values ('admin@jef.sk', 'admin'), ('clen@jef.sk', 'member')`)
  await db.signUp('admin', 'admin@jef.sk')
  await db.signUp('clen', 'clen@jef.sk')
  // Účet, ktorý zo skupiny admin neskôr odobral.
  await db.rows(`insert into public.members (email) values ('byvaly@jef.sk')`)
  await db.signUp('byvaly', 'byvaly@jef.sk')
  await db.rows(`delete from public.members where email = 'byvaly@jef.sk'`)
})

const report = (name: string, title = 'Nejde uložiť') =>
  db.as(name, `insert into public.bug_reports (title, body, context) values ($1, 'popis', '{"version":"1.3.0"}') returning id, author_email, status`, [title])

describe('hlásenie chýb', () => {
  it('člen nahlási chybu a databáza doplní autora', async () => {
    const [row] = await report('clen')
    expect(row.author_email).toBe('clen@jef.sk')
    expect(row.status).toBe('new')
    const [stored] = await db.rows('select created_by from public.bug_reports')
    expect(stored.created_by).toBe(db.users.clen)
  })

  it('autora ani stav pri vytvorení nepodvrhne', async () => {
    await expect(
      db.as('clen', `insert into public.bug_reports (title, created_by) values ('Chyba', $1)`, [db.users.admin]),
    ).rejects.toThrow()
    await expect(db.as('clen', `insert into public.bug_reports (title, status) values ('Chyba', 'done')`)).rejects.toThrow()
  })

  it('kto nie je v skupine, nevidí ani nehlási', async () => {
    await report('clen')
    expect(await db.as('byvaly', 'select id from public.bug_reports')).toHaveLength(0)
    await expect(report('byvaly')).rejects.toThrow()
    await expect(db.as(null, 'select id from public.bug_reports')).rejects.toThrow()
  })

  it('stav a odpoveď mení len admin', async () => {
    const [row] = await report('clen')
    expect(await db.as('clen', `update public.bug_reports set status = 'done' where id = $1 returning id`, [row.id])).toHaveLength(0)
    const [updated] = await db.as('admin', `update public.bug_reports set status = 'in_progress', reply = 'Pozriem' where id = $1 returning status, reply`, [row.id])
    expect(updated).toMatchObject({ status: 'in_progress', reply: 'Pozriem' })
  })

  it('autor zmaže svoje nové hlásenie, rozpracované už nie; admin hocijaké', async () => {
    const [first] = await report('clen', 'Prvé')
    expect(await db.as('clen', 'delete from public.bug_reports where id = $1 returning id', [first.id])).toHaveLength(1)
    const [second] = await report('clen', 'Druhé')
    await db.as('admin', `update public.bug_reports set status = 'in_progress' where id = $1`, [second.id])
    expect(await db.as('clen', 'delete from public.bug_reports where id = $1 returning id', [second.id])).toHaveLength(0)
    expect(await db.as('admin', 'delete from public.bug_reports where id = $1 returning id', [second.id])).toHaveLength(1)
  })

  it('príliš krátky názov neprejde', async () => {
    await expect(report('clen', ' a ')).rejects.toThrow()
  })
})
