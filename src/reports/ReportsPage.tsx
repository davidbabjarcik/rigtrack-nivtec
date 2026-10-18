import type { SupabaseClient } from '@supabase/supabase-js'
import { Bug, Send, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/button'
import { Field, SelectField, TextareaField } from '@/components/field'
import { lastError } from '@/lib/lastError'
import { cn } from '@/lib/utils'
import { createReport, deleteReport, fetchReports, REPORT_STATUS_LABELS, REPORT_STATUSES, updateReport, type Report, type ReportContext, type ReportStatus } from './api'

const PAGE_LABELS: Record<string, string> = { calculator: 'Kalkulačka', settings: 'Nastavenie', nivtec: 'Nivtec diely' }

const STATUS_STYLES: Record<ReportStatus, string> = {
  new: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  in_progress: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  done: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
}

const formatDate = (iso: string) => new Date(iso).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Informácie, ktoré sa k hláseniu pripoja samy. */
function collectContext(page: string): ReportContext {
  const error = lastError()
  return {
    version: __APP_VERSION__,
    page: PAGE_LABELS[page] ?? page,
    browser: navigator.userAgent.slice(0, 300),
    screen: `${window.innerWidth} × ${window.innerHeight}`,
    ...(error ? { lastError: `${error.message} (${formatDate(error.at)})` } : {}),
  }
}

function NewReport({ client, page, onCreated }: { client: SupabaseClient; page: string; onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setState('sending')
    try {
      await createReport(client, title, body, collectContext(page))
      setTitle('')
      setBody('')
      setState('sent')
      await onCreated()
    } catch {
      setState('error')
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3 rounded-xl border bg-surface p-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bug className="size-5 text-accent" aria-hidden />
          Nahlásiť chybu
        </h2>
        <p className="text-sm text-muted-foreground">Napíšte, čo ste robili, čo sa stalo a čo ste čakali. Pomôže aj rozmer a výška pódia.</p>
      </div>
      <Field label="Čo nefunguje" required minLength={3} maxLength={120} placeholder="napr. Zlý počet nôh pri schodoch" value={title} onChange={(event) => setTitle(event.target.value)} />
      <TextareaField label="Popis" maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} />
      <p className="text-xs text-muted-foreground">
        Pripojí sa samo: verzia {__APP_VERSION__}, stránka {PAGE_LABELS[page] ?? page}, prehliadač a posledná chyba v aplikácii (ak nejaká bola).
      </p>
      {state === 'sent' && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          Ďakujeme, hlásenie je odoslané.
        </p>
      )}
      {state === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          Hlásenie sa nepodarilo odoslať. Skúste to znova.
        </p>
      )}
      <Button type="submit" className="self-start" disabled={state === 'sending' || title.trim().length < 3}>
        <Send className="size-4" aria-hidden />
        {state === 'sending' ? 'Odosielam…' : 'Odoslať hlásenie'}
      </Button>
    </form>
  )
}

/** Odpoveď admina: stav a text; ukladá sa tlačidlom, aby sa neposielal každý znak. */
function AdminReply({ client, report, onChanged }: { client: SupabaseClient; report: Report; onChanged: () => Promise<void> }) {
  const [status, setStatus] = useState(report.status)
  const [reply, setReply] = useState(report.reply)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const changed = status !== report.status || reply !== report.reply

  const save = async () => {
    setPending(true)
    setFailed(false)
    try {
      await updateReport(client, report.id, { status, reply: reply.trim() })
      await onChanged()
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
        <SelectField label="Stav" value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)}>
          {REPORT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {REPORT_STATUS_LABELS[item]}
            </option>
          ))}
        </SelectField>
        <Field label="Odpoveď" maxLength={2000} placeholder="napr. Opravené vo verzii 1.3.1" value={reply} onChange={(event) => setReply(event.target.value)} />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Uloženie zlyhalo.
        </p>
      )}
      {changed && (
        <Button size="sm" variant="outline" className="self-start" disabled={pending} onClick={() => void save()}>
          {pending ? 'Ukladám…' : 'Uložiť stav a odpoveď'}
        </Button>
      )}
    </div>
  )
}

function ReportCard({ client, report, isAdmin, myUserId, onChanged }: { client: SupabaseClient; report: Report; isAdmin: boolean; myUserId: string; onChanged: () => Promise<void> }) {
  const canDelete = isAdmin || (report.createdBy === myUserId && report.status === 'new')
  const context = [
    report.context.version && `verzia ${report.context.version}`,
    report.context.page,
    report.context.screen,
  ].filter(Boolean)

  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{report.title}</h3>
          <p className="text-xs text-muted-foreground">
            {report.authorEmail || 'neznámy autor'} · {formatDate(report.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[report.status])}>{REPORT_STATUS_LABELS[report.status]}</span>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Zmazať hlásenie ${report.title}`}
              onClick={() => {
                if (window.confirm(`Zmazať hlásenie „${report.title}“?`)) void deleteReport(client, report.id).then(onChanged)
              }}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
      {report.body && <p className="text-sm whitespace-pre-wrap">{report.body}</p>}
      {report.reply && !isAdmin && (
        <p className="rounded-lg bg-muted p-2 text-sm">
          <strong>Odpoveď:</strong> {report.reply}
        </p>
      )}
      {context.length > 0 && <p className="text-xs text-muted-foreground">{context.join(' · ')}</p>}
      {isAdmin && (report.context.lastError || report.context.browser) && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Technické detaily</summary>
          {report.context.lastError && <p className="mt-1 text-destructive">Posledná chyba: {report.context.lastError}</p>}
          {report.context.browser && <p className="mt-1 break-all">{report.context.browser}</p>}
        </details>
      )}
      {isAdmin && <AdminReply key={`${report.status}-${report.reply}`} client={client} report={report} onChanged={onChanged} />}
    </li>
  )
}

/** Hlásenie chýb: formulár pre každého člena a zoznam hlásení skupiny; admin mení stav a odpovedá. */
export function ReportsPage({ client, isAdmin, myUserId, fromPage }: { client: SupabaseClient; isAdmin: boolean; myUserId: string; fromPage: string }) {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      setReports(await fetchReports(client))
      setError(false)
    } catch {
      setError(true)
    }
  }, [client])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <NewReport client={client} page={fromPage} onCreated={load} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Hlásenia skupiny</h2>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            Hlásenia sa nepodarilo načítať. Ak ste admin a ešte ste nespustili supabase/migrations/0003_hlasenia.sql, urobte to.
          </p>
        )}
        {reports === null ? (
          !error && <p className="text-sm text-muted-foreground">Načítavam…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ žiadne hlásenia.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => (
              <ReportCard key={report.id} client={client} report={report} isAdmin={isAdmin} myUserId={myUserId} onChanged={load} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
