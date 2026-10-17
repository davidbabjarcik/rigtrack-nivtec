import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from './helpers'

type Db = Awaited<ReturnType<typeof createTestDb>>
let db: Db

beforeEach(async () => {
  db = await createTestDb()
  // Prvého admina pridá vlastník projektu v SQL Editore.
  await db.rows(`insert into public.members (email, role) values ('Admin@JEF.sk ', 'admin')`)
  await db.signUp('admin', 'admin@jef.sk')
})

describe('registrácia na pozvánku', () => {
  it('nepozvaný e-mail si účet nezaloží', async () => {
    await expect(db.signUp('cudzi', 'cudzi@example.com')).rejects.toThrow(/pozvánku/)
  })

  it('pozvaný sa po registrácii stane členom', async () => {
    await db.as('admin', `insert into public.members (email) values ('clen@jef.sk')`)
    await db.signUp('clen', 'clen@jef.sk')
    const [me] = await db.as('clen', 'select public.my_role() as role')
    expect(me.role).toBe('member')
  })

  it('kto už účet má (založený pred skupinou), prepojí sa hneď pri pozvaní', async () => {
    await db.rows('alter table auth.users disable trigger nivtec_on_signup')
    await db.signUp('stary', 'stary@jef.sk')
    await db.rows('alter table auth.users enable trigger nivtec_on_signup')
    await db.as('admin', `insert into public.members (email) values ('stary@jef.sk')`)
    const [me] = await db.as('stary', 'select public.my_role() as role')
    expect(me.role).toBe('member')
  })
})

describe('členovia', () => {
  beforeEach(async () => {
    await db.as('admin', `insert into public.members (email) values ('clen@jef.sk')`)
    await db.signUp('clen', 'clen@jef.sk')
  })

  it('člen vidí skupinu, ale nemôže pridávať ani meniť roly', async () => {
    expect(await db.as('clen', 'select email from public.members')).toHaveLength(2)
    await expect(db.as('clen', `insert into public.members (email) values ('dalsi@jef.sk')`)).rejects.toThrow()
    expect(await db.as('clen', `update public.members set role = 'admin' where email = 'clen@jef.sk' returning id`)).toHaveLength(0)
  })

  it('anonymný návštevník nevidí nič', async () => {
    await expect(db.as(null, 'select * from public.members')).rejects.toThrow()
  })

  it('admin mení roly a odoberá členov', async () => {
    await db.as('admin', `update public.members set role = 'admin' where email = 'clen@jef.sk'`)
    expect((await db.as('clen', 'select public.is_admin() as admin'))[0].admin).toBe(true)
    await db.as('admin', `delete from public.members where email = 'clen@jef.sk'`)
    expect((await db.as('clen', 'select public.my_role() as role'))[0].role).toBeNull()
  })

  it('posledný admin sa nedá odobrať ani zbaviť roly', async () => {
    await expect(db.as('admin', `update public.members set role = 'member' where email = 'admin@jef.sk'`)).rejects.toThrow(/admina/)
    await expect(db.as('admin', `delete from public.members where email = 'admin@jef.sk'`)).rejects.toThrow(/admina/)
  })
})

describe('nastavenie Nivtec', () => {
  beforeEach(async () => {
    await db.as('admin', `insert into public.members (email) values ('clen@jef.sk')`)
    await db.signUp('clen', 'clen@jef.sk')
  })

  it('admin ukladá, člen len číta', async () => {
    await db.as('admin', `insert into public.nivtec_settings (config) values ('{"name":"Nivtec"}')`)
    const [row] = await db.as('clen', 'select config from public.nivtec_settings')
    expect(row.config).toEqual({ name: 'Nivtec' })
    expect(await db.as('clen', `update public.nivtec_settings set config = '{}' returning id`)).toHaveLength(0)
    await expect(db.as('clen', `insert into public.nivtec_settings (config) values ('{}')`)).rejects.toThrow()
  })

  it('je len jedno pre celú skupinu', async () => {
    await db.as('admin', `insert into public.nivtec_settings (config) values ('{}')`)
    await expect(db.as('admin', `insert into public.nivtec_settings (config) values ('{}')`)).rejects.toThrow()
  })
})
