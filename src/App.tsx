import { Calculator as CalculatorIcon, FlaskConical, Moon, Settings as SettingsIcon, Sun } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Account } from '@/components/Account'
import { Credits } from '@/components/Credits'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Calculator } from '@/stage/Calculator'
import { fetchCloudConfig, saveCloudConfig } from '@/stage/cloud'
import type { StageConfig } from '@/stage/model'
import { Settings } from '@/stage/Settings'
import { loadConfig, saveConfig } from '@/stage/storage'

type Tab = 'calculator' | 'settings'

/** Logá v hlavičke: RigTrack (aplikácia, z ktorej kalkulačka pochádza) a JEF. */
function Logos() {
  return (
    <div className="flex items-center gap-2">
      <img src="./logos/rigtrack.svg" alt="RigTrack" className="size-10 rounded-xl" />
      <img src="./logos/jef-tile.png" alt="JEF Production" className="size-10 rounded-xl" />
    </div>
  )
}

export function App() {
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState<Tab>('calculator')
  const [config, setConfig] = useState(loadConfig)
  const [session, setSession] = useState<Session | null>(null)
  // Zvýši sa pri načítaní nastavenia z účtu, aby sa formulár nastavenia znova naplnil.
  const [loaded, setLoaded] = useState(0)
  const [cloudError, setCloudError] = useState(false)
  const userId = session?.user.id

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  // Po prihlásení sa použije nastavenie z účtu; kto ešte žiadne nemá, pokračuje s tým z prehliadača.
  // Po odhlásení sa vráti nastavenie z prehliadača.
  useEffect(() => {
    let active = true
    if (!supabase || !userId) {
      setConfig(loadConfig())
      setLoaded((n) => n + 1)
      return
    }
    fetchCloudConfig(supabase, userId)
      .then((cloud) => {
        if (!active) return
        setCloudError(false)
        if (cloud) setConfig(cloud)
        setLoaded((n) => n + 1)
      })
      .catch(() => active && setCloudError(true))
    return () => {
      active = false
    }
  }, [userId])

  const save = async (next: StageConfig) => {
    setConfig(next)
    if (supabase && userId) {
      try {
        await saveCloudConfig(supabase, userId, next)
        return true
      } catch {
        return false
      }
    }
    return saveConfig(next)
  }

  const tabs: { id: Tab; label: string; icon: typeof CalculatorIcon }[] = [
    { id: 'calculator', label: 'Kalkulačka', icon: CalculatorIcon },
    { id: 'settings', label: 'Nastavenie', icon: SettingsIcon },
  ]

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logos />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nivtec kalkulačka pódia</h1>
            <p className="text-sm text-muted-foreground">Dosky, nohy, schody, plachty, zábradlie a výstuhy za pár sekúnd.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {supabase && <Account client={supabase} session={session} />}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Svetlý režim' : 'Tmavý režim'}
            title={theme === 'dark' ? 'Svetlý režim' : 'Tmavý režim'}
            className="flex size-10 items-center justify-center rounded-lg border bg-surface hover:bg-muted"
          >
            {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
        </div>
      </header>

      <p className="flex items-start gap-2 rounded-xl border border-violet-400/50 bg-violet-100/60 p-3 text-sm dark:bg-violet-950/40 print:hidden">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
        <span>
          <strong>Časť budúcej aplikácie RigTrack, ktorá je vo vývoji.</strong> RigTrack bude evidovať techniku, kufre, výpožičky, servis a eventy; táto
          kalkulačka je z neho vytiahnutá ako samostatná ukážka. Výsledok si pred stavbou skontrolujte.
        </span>
      </p>

      <nav className="flex gap-1 rounded-xl border bg-surface p-1 self-start print:hidden" aria-label="Sekcie">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
            className={cn('flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium', tab === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {cloudError && (
        <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">
          Nastavenie z účtu sa nepodarilo načítať, počíta sa s nastavením z prehliadača. Ak ste ešte nespustili supabase/schema.sql, urobte to.
        </p>
      )}

      <main className="flex-1">
        {tab === 'calculator' ? (
          <Calculator config={config} />
        ) : (
          <Settings
            key={loaded}
            initial={config}
            note={userId ? 'Nastavenie sa uloží do vášho účtu a uvidíte ho na každom zariadení.' : 'Nastavenie sa uloží len v tomto prehliadači; po prihlásení sa ukladá do účtu.'}
            onSave={save}
          />
        )}
      </main>

      <Credits className="border-t pt-4" />
    </div>
  )
}
