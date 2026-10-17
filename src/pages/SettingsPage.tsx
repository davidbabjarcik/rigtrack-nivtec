import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { authMessage } from '@/auth/messages'
import { Button } from '@/components/button'
import { Field } from '@/components/field'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ROLE_LABELS, type Role } from '@/group/api'
import { MembersSection } from '@/group/MembersSection'

function PasswordForm({ client }: { client: SupabaseClient }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    const { error } = await client.auth.updateUser({ password })
    setPending(false)
    setMessage(error ? { ok: false, text: authMessage(error) } : { ok: true, text: 'Heslo je zmenené.' })
    if (!error) setPassword('')
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <Field
          label="Nové heslo (aspoň 8 znakov)"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="min-w-56 flex-1"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Ukladám…' : 'Zmeniť heslo'}
        </Button>
      </div>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'text-sm text-muted-foreground' : 'text-sm text-destructive'}>
          {message.text}
        </p>
      )}
    </form>
  )
}

/** Nastavenie: vlastný účet a vzhľad pre každého, správa skupiny pre admina. */
export function SettingsPage({ client, session, role }: { client: SupabaseClient; session: Session; role: Role }) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-surface p-4">
        <div>
          <h2 className="text-lg font-semibold">Môj účet</h2>
          <p className="text-sm text-muted-foreground">
            {session.user.email} · {ROLE_LABELS[role]}
          </p>
        </div>
        <PasswordForm client={client} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">Svetlý / tmavý režim</span>
          <ThemeToggle />
          <Button variant="outline" className="ml-auto" onClick={() => void client.auth.signOut()}>
            <LogOut className="size-4" aria-hidden />
            Odhlásiť sa
          </Button>
        </div>
      </section>

      <MembersSection client={client} isAdmin={role === 'admin'} myUserId={session.user.id} />
    </div>
  )
}
