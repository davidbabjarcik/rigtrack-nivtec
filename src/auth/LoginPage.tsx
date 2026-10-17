import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/button'
import { Field } from '@/components/field'
import { AuthLayout } from './AuthLayout'
import { authMessage } from './messages'

type Mode = 'login' | 'signup' | 'forgot'

const TITLES: Record<Mode, string> = {
  login: 'Prihláste sa do skupiny',
  signup: 'Vytvorenie účtu s pozvánkou',
  forgot: 'Obnova zabudnutého hesla',
}

/** Kam má odkaz z e-mailu (potvrdenie účtu, obnova hesla) vrátiť: na túto stránku bez podstránky. */
const backHere = () => window.location.origin + window.location.pathname

/** Prihlásenie, registrácia na pozvánku od admina a zabudnuté heslo. */
export function LoginPage({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [pending, setPending] = useState(false)

  const switchTo = (next: Mode) => {
    setMode(next)
    setError('')
    setInfo('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    setInfo('')
    const address = email.trim().toLowerCase()
    if (mode === 'login') {
      const { error: failed } = await client.auth.signInWithPassword({ email: address, password })
      if (failed) setError(authMessage(failed))
    } else if (mode === 'signup') {
      const { data, error: failed } = await client.auth.signUp({ email: address, password, options: { emailRedirectTo: backHere() } })
      if (failed) setError(authMessage(failed))
      // Bez relácie = Supabase čaká na potvrdenie e-mailu.
      else if (!data.session) setInfo('Účet je vytvorený. Potvrďte ho odkazom, ktorý vám prišiel e-mailom, a potom sa prihláste.')
    } else {
      const { error: failed } = await client.auth.resetPasswordForEmail(address, { redirectTo: backHere() })
      if (failed) setError(authMessage(failed))
      else setInfo('Ak k e-mailu existuje účet, prišiel vám odkaz na nastavenie nového hesla.')
    }
    setPending(false)
  }

  return (
    <AuthLayout title={TITLES[mode]}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        {mode !== 'forgot' && (
          <Field
            label={mode === 'signup' ? 'Nové heslo (aspoň 8 znakov)' : 'Heslo'}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
        {mode === 'signup' && <p className="text-sm text-muted-foreground">Účet si môžete vytvoriť len s e-mailom, ktorý admin pridal do skupiny.</p>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="rounded-lg bg-muted p-3 text-sm">
            {info}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Chvíľku…' : mode === 'login' ? 'Prihlásiť sa' : mode === 'signup' ? 'Vytvoriť účet' : 'Poslať odkaz'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-1 text-sm">
        {mode === 'login' ? (
          <>
            <button type="button" className="text-accent hover:underline" onClick={() => switchTo('signup')}>
              Mám pozvánku, chcem si vytvoriť účet
            </button>
            <button type="button" className="text-muted-foreground hover:underline" onClick={() => switchTo('forgot')}>
              Zabudnuté heslo
            </button>
          </>
        ) : (
          <button type="button" className="text-accent hover:underline" onClick={() => switchTo('login')}>
            Späť na prihlásenie
          </button>
        )}
      </div>
    </AuthLayout>
  )
}
