import type { SupabaseClient } from '@supabase/supabase-js'
import { readStageConfig, type StageConfig } from './model'

/** Nastavenie prihláseného používateľa z databázy; null, ak si ešte žiadne neuložil. */
export async function fetchCloudConfig(client: SupabaseClient, userId: string): Promise<StageConfig | null> {
  const { data, error } = await client.from('nivtec_configs').select('config').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? readStageConfig(data.config) : null
}

export async function saveCloudConfig(client: SupabaseClient, userId: string, config: StageConfig) {
  const { error } = await client.from('nivtec_configs').upsert({ user_id: userId, config })
  if (error) throw error
}
