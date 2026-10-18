import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { Bug, Calculator as CalculatorIcon, LogOut, Puzzle, Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthLayout } from '@/auth/AuthLayout'
import { LoginPage } from '@/auth/LoginPage'
import { NewPasswordPage } from '@/auth/NewPasswordPage'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/button'
import { Credits } from '@/components/Credits'
import { DevNotice } from '@/components/DevNotice'
import { Logos } from '@/components/Logos'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fetchGroupConfig, fetchMyRole, ROLE_LABELS, saveGroupConfig, type Role } from '@/group/api'
import { routeHref, useRoute, type Route } from '@/lib/router'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { SettingsPage } from '@/pages/SettingsPage'
import { ReportsPage } from '@/reports/ReportsPage'
import { Calculator } from '@/stage/Calculator'
import type { StageConfig } from '@/stage/model'
import { Settings as NivtecParts } from '@/stage/Settings'

const NAV: { route: Route; label: string; icon: typeof CalculatorIcon; adminOnly?: boolean }[] = [
  { route: 'calculator', label: 'Kalkulačka', icon: CalculatorIcon },
  { route: 'nivtec', label: 'Nivtec diely', icon: Puzzle, adminOnly: true },
  { route: 'settings', label: 'Nastavenie', icon: SettingsIcon },
  { route: 'reports', label: 'Hlásenia', icon: Bug },
]

function Loading() {
  return <p className="p-6 text-center text-sm text-muted-foreground">Načítavam…</p>
}

/** Prihlásený, ale nie je v skupine (napr. ho admin odobral). */
function NoAccess({ client, email }: { client: SupabaseClient; email: string | undefined }) {
  return (
    <AuthLayout title="Bez prístupu">
      <div className="flex flex-col gap-4 text-sm">
        <p>
          Účet <strong>{email}</strong> nie je v skupine. Požiadajte admina, aby vás pridal.
        </p>
        <Button variant="outline" onClick={() => void client.auth.signOut()}>
          Odhlásiť sa
        </Button>
      </div>
    </AuthLayout>
  )
}

/** Hlavná časť po prihlásení: kalkulačka, nastavenie a pre admina diely Nivtec. */
function Main({ client, session }: { client: SupabaseClient; session: Session }) {
  const route = useRoute()
  const [role, setRole] = useState<Role | null | undefined>(undefined)
  const [config, setConfig] = useState<StageConfig | null>(null)
  const [failed, setFailed] = useState(false)
  // Zvýši sa po uložení, aby sa formulár dielov naplnil uloženými hodnotami.
  const [saved, setSaved] = useState(0)
  // Odkiaľ prišiel na hlásenie chyby (pripojí sa k hláseniu).
  const [lastPage, setLastPage] = useState<Route>('calculator')
  useEffect(() => {
    if (route !== 'reports') setLastPage(route)
  }, [route])

  useEffect(() => {
    let active = true
    Promise.all([fetchMyRole(client), fetchGroupConfig(client)])
      .then(([myRole, groupConfig]) => {
        if (!active) return
        setRole(myRole)
        setConfig(groupConfig)
      })
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [client, session.user.id])

  if (failed)
    return (
      <AuthLayout title="Chyba">
        <p role="alert" className="text-sm text-destructive">
          Údaje skupiny sa nepodarilo načítať. Skontrolujte pripojenie; ak ste admin a ešte ste nespustili supabase/migrations/0002_skupina.sql, urobte to.
        </p>
      </AuthLayout>
    )
  if (role === undefined || !config) return <Loading />
  if (role === null) return <NoAccess client={client} email={session.user.email} />

  const isAdmin = role === 'admin'
  const nav = NAV.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logos />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nivtec kalkulačka pódia</h1>
            <p className="text-sm text-muted-foreground">
              {session.user.email} · {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void client.auth.signOut()}
            aria-label="Odhlásiť sa"
            title="Odhlásiť sa"
            className="flex size-10 items-center justify-center rounded-lg border bg-surface hover:bg-muted"
          >
            <LogOut className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 self-start rounded-xl border bg-surface p-1 print:hidden" aria-label="Sekcie">
        {nav.map(({ route: target, label, icon: Icon }) => (
          <a
            key={target}
            href={routeHref(target)}
            aria-current={route === target ? 'page' : undefined}
            className={cn('flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium', route === target ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </a>
        ))}
      </nav>

      <main className="flex-1">
        {route === 'reports' ? (
          <ReportsPage client={client} isAdmin={isAdmin} myUserId={session.user.id} fromPage={lastPage} />
        ) : route === 'settings' ? (
          <SettingsPage client={client} session={session} role={role} />
        ) : route === 'nivtec' ? (
          isAdmin ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Nivtec diely</h2>
              <NivtecParts
                key={saved}
                initial={config}
                note="Nastavenie platí pre celú skupinu, upravuje ho len admin."
                onSave={async (next) => {
                  try {
                    await saveGroupConfig(client, next)
                    setConfig(next)
                    setSaved((n) => n + 1)
                    return true
                  } catch {
                    return false
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Diely Nivtec upravuje len admin skupiny.</p>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <DevNotice />
            <Calculator config={config} />
          </div>
        )}
      </main>

      <Credits className="border-t pt-4" />
    </div>
  )
}

function WithSupabase({ client }: { client: SupabaseClient }) {
  const { session, recovery, recovered } = useAuth(client)
  if (session === undefined) return <Loading />
  if (session && recovery) return <NewPasswordPage client={client} onDone={recovered} />
  if (!session) return <LoginPage client={client} />
  return <Main client={client} session={session} />
}

export function App() {
  if (!supabase)
    return (
      <AuthLayout title="Chýba pripojenie">
        <p className="text-sm">
          Stránka nemá nastavené pripojenie na Supabase (VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY). Postup je v README.
        </p>
      </AuthLayout>
    )
  return <WithSupabase client={supabase} />
}
