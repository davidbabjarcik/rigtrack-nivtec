import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/button'
import { Field } from '@/components/field'

/** Prihlásenie e-mailom a heslom. Účty sa zakladajú v Supabase, registrácia na stránke nie je. */
function LoginForm({ client, onDone }: { client: SupabaseClient; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    const { error: failed } = await client.auth.signInWithPassword({ email: email.trim(), password })
    setPending(false)
    setError(Boolean(failed))
    if (!failed) onDone()
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="absolute top-full right-0 z-10 mt-2 flex w-72 flex-col gap-3 rounded-xl border bg-surface p-4 shadow-lg">
      <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label="Heslo" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Prihlásenie sa nepodarilo. Skontrolujte e-mail a heslo.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Prihlasujem…' : 'Prihlásiť sa'}
      </Button>
    </form>
  )
}

/** Účet v hlavičke: prihlásený používateľ s odhlásením, inak tlačidlo na prihlásenie. */
export function Account({ client, session }: { client: SupabaseClient; session: Session | null }) {
  const [open, setOpen] = useState(false)

  if (session) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <UserRound className="size-4" aria-hidden />
          {session.user.email}
        </span>
        <Button variant="outline" size="sm" onClick={() => void client.auth.signOut()}>
          <LogOut className="size-4" aria-hidden />
          Odhlásiť
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
        <LogIn className="size-4" aria-hidden />
        Prihlásiť
      </Button>
      {open && <LoginForm client={client} onDone={() => setOpen(false)} />}
    </div>
  )
}
