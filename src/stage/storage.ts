import { DEFAULT_STAGE_CONFIG, readStageConfig, type StageConfig } from './model'

// Bez databázy: nastavenie systému sa pamätá len v tomto prehliadači.
const KEY = 'nivtec:config'

export function loadConfig(): StageConfig {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? readStageConfig(JSON.parse(raw)) : DEFAULT_STAGE_CONFIG
  } catch {
    return DEFAULT_STAGE_CONFIG
  }
}

export function saveConfig(config: StageConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

