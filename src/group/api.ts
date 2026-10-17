import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_STAGE_CONFIG, readStageConfig, type StageConfig } from '@/stage/model'

export const ROLES = ['admin', 'member'] as const
export type Role = (typeof ROLES)[number]
export const ROLE_LABELS: Record<Role, string> = { admin: 'Admin', member: 'Člen' }

export type Member = { id: string; email: string; role: Role; userId: string | null; createdAt: string }

/** Rola prihláseného v skupine; null = nie je člen. */
export async function fetchMyRole(client: SupabaseClient): Promise<Role | null> {
  const { data, error } = await client.rpc('my_role')
  if (error) throw error
  return (data as Role | null) ?? null
}

export async function fetchMembers(client: SupabaseClient): Promise<Member[]> {
  const { data, error } = await client.from('members').select('id, email, role, user_id, created_at').order('created_at')
  if (error) throw error
  return data.map((row) => ({ id: row.id, email: row.email, role: row.role, userId: row.user_id, createdAt: row.created_at }))
}

export async function addMember(client: SupabaseClient, email: string, role: Role) {
  const { error } = await client.from('members').insert({ email: email.trim().toLowerCase(), role })
  if (error) throw error
}

export async function setMemberRole(client: SupabaseClient, id: string, role: Role) {
  const { error } = await client.from('members').update({ role }).eq('id', id)
  if (error) throw error
}

export async function removeMember(client: SupabaseClient, id: string) {
  const { error } = await client.from('members').delete().eq('id', id)
  if (error) throw error
}

/** Chyba pri správe členov po slovensky. */
export function memberError(error: unknown) {
  const { code, message } = (error ?? {}) as { code?: string; message?: string }
  if (code === '23505') return 'Tento e-mail už v skupine je.'
  if (code === '23514') return 'Zadajte platný e-mail.'
  if (message?.includes('admina')) return 'Skupina musí mať aspoň jedného admina.'
  return 'Zmena sa nepodarila. Skúste to znova.'
}

/** Spoločné nastavenie Nivtec skupiny; kým ho admin neuloží, platí predvolené. */
export async function fetchGroupConfig(client: SupabaseClient): Promise<StageConfig> {
  const { data, error } = await client.from('nivtec_settings').select('config').eq('id', 1).maybeSingle()
  if (error) throw error
  return data ? readStageConfig(data.config) : DEFAULT_STAGE_CONFIG
}

/** Najprv úprava, až potom vloženie: upsert by menil stĺpec id, na ktorý nie je právo. */
export async function saveGroupConfig(client: SupabaseClient, config: StageConfig) {
  const updated = await client.from('nivtec_settings').update({ config }).eq('id', 1).select('id')
  if (updated.error) throw updated.error
  if (updated.data.length > 0) return
  const { error } = await client.from('nivtec_settings').insert({ config })
  if (error) throw error
}
