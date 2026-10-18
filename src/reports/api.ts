import type { SupabaseClient } from '@supabase/supabase-js'

// Zodpovedá check constraint v supabase/migrations/0003_hlasenia.sql.
export const REPORT_STATUSES = ['new', 'in_progress', 'done'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = { new: 'Nové', in_progress: 'Rieši sa', done: 'Hotové' }

/** Čo sa k hláseniu pripojí samo. */
export type ReportContext = { version: string; page: string; browser: string; screen: string; lastError?: string }

export type Report = {
  id: string
  title: string
  body: string
  status: ReportStatus
  reply: string
  context: Partial<ReportContext>
  createdBy: string | null
  authorEmail: string
  createdAt: string
}

/** Hlásenia skupiny: nevybavené hore, v rámci stavu od najnovších. */
export async function fetchReports(client: SupabaseClient): Promise<Report[]> {
  const { data, error } = await client
    .from('bug_reports')
    .select('id, title, body, status, reply, context, created_by, author_email, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  const order: Record<ReportStatus, number> = { new: 0, in_progress: 1, done: 2 }
  return data
    .map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      status: row.status as ReportStatus,
      reply: row.reply,
      context: (row.context ?? {}) as Partial<ReportContext>,
      createdBy: row.created_by,
      authorEmail: row.author_email,
      createdAt: row.created_at,
    }))
    .sort((a, b) => order[a.status] - order[b.status])
}

export async function createReport(client: SupabaseClient, title: string, body: string, context: ReportContext) {
  const { error } = await client.from('bug_reports').insert({ title: title.trim(), body: body.trim(), context })
  if (error) throw error
}

export async function updateReport(client: SupabaseClient, id: string, patch: { status?: ReportStatus; reply?: string }) {
  const { error } = await client.from('bug_reports').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteReport(client: SupabaseClient, id: string) {
  const { error } = await client.from('bug_reports').delete().eq('id', id)
  if (error) throw error
}
