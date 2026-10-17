import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/button'
import { Field } from '@/components/field'
import { AuthLayout } from './AuthLayout'
import { authMessage } from './messages'

/** Nové heslo po kliknutí na odkaz z e-mailu „zabudnuté heslo“. */
export function NewPasswordPage({ client, onDone }: { client: SupabaseClient; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    const { error: failed } = await client.auth.updateUser({ password })
    setPending(false)
    if (failed) setError(authMessage(failed))
    else onDone()
  }

  return (
    <AuthLayout title="Nastavte si nové heslo">
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <Field label="Nové heslo (aspoň 8 znakov)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Ukladám…' : 'Uložiť heslo'}
        </Button>
      </form>
    </AuthLayout>
  )
}
