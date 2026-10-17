import type { SupabaseClient } from '@supabase/supabase-js'
import { Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/button'
import { Field, SelectField } from '@/components/field'
import { addMember, fetchMembers, memberError, removeMember, ROLE_LABELS, ROLES, setMemberRole, type Member, type Role } from './api'

/** Členovia skupiny. Admin pridáva ľudí podľa e-mailu, mení roly a odoberá; člen zoznam len vidí. */
export function MembersSection({ client, isAdmin, myUserId }: { client: SupabaseClient; isAdmin: boolean; myUserId: string }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [pending, setPending] = useState(false)

  const load = useCallback(async () => {
    try {
      setMembers(await fetchMembers(client))
    } catch {
      setError('Členov sa nepodarilo načítať.')
    }
  }, [client])

  useEffect(() => {
    void load()
  }, [load])

  /** Zmena v databáze a potom znova načítať zoznam. */
  const run = async (change: () => Promise<void>) => {
    setPending(true)
    setError('')
    try {
      await change()
      await load()
      return true
    } catch (failed) {
      setError(memberError(failed))
      return false
    } finally {
      setPending(false)
    }
  }

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    if (await run(() => addMember(client, email, role))) {
      setEmail('')
      setRole('member')
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">Skupina</h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Pridajte e-mail človeka. Potom si na prihlasovacej stránke cez „Mám pozvánku“ vytvorí účet s týmto e-mailom.'
            : 'Kto je v skupine. Ľudí pridáva admin.'}
        </p>
      </div>

      {isAdmin && (
        <form onSubmit={(event) => void invite(event)} className="grid items-end gap-2 sm:grid-cols-[1fr_9rem_auto]">
          <Field label="E-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <SelectField label="Rola" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </SelectField>
          <Button type="submit" disabled={pending}>
            <UserPlus className="size-4" aria-hidden />
            Pridať
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {members === null ? (
        !error && <p className="text-sm text-muted-foreground">Načítavam…</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {members.map((member) => {
            const me = member.userId === myUserId
            return (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {member.email}
                    {me && <span className="text-muted-foreground"> (vy)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.userId ? 'má účet' : 'pozvaný, ešte si nevytvoril účet'}</p>
                </div>
                {isAdmin ? (
                  <>
                    <SelectField
                      label={`Rola ${member.email}`}
                      hideLabel
                      className="w-32"
                      value={member.role}
                      disabled={pending}
                      onChange={(event) => void run(() => setMemberRole(client, member.id, event.target.value as Role))}
                    >
                      {ROLES.map((item) => (
                        <option key={item} value={item}>
                          {ROLE_LABELS[item]}
                        </option>
                      ))}
                    </SelectField>
                    <Button
                      variant="ghost"
                      aria-label={`Odobrať ${member.email}`}
                      disabled={pending}
                      onClick={() => {
                        const question = me ? 'Naozaj chcete odobrať seba? Stratíte prístup do aplikácie.' : `Odobrať ${member.email} zo skupiny?`
                        if (window.confirm(question)) void run(() => removeMember(client, member.id))
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{ROLE_LABELS[member.role]}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
