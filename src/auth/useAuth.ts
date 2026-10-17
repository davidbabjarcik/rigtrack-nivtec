import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

/** Prihlásenie: undefined = ešte sa zisťuje, null = odhlásený. recovery = prišiel z odkazu na obnovu hesla. */
export function useAuth(client: SupabaseClient) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    void client.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [client])

  return { session, recovery, recovered: () => setRecovery(false) }
}
