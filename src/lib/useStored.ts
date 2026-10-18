import { useEffect, useState } from 'react'

// Zadanie kalkulačky sa pamätá v prehliadači, aby sa nestratilo pri prechode na inú
// podstránku ani pri obnovení stránky. Pri zmene tvaru údajov zvýšte verziu.
const PREFIX = 'nivtec:calc:v1:'

/** Rovnaký druh hodnoty ako predvolená (číslo, text, pole, objekt…); predvolené null pripúšťa čokoľvek. */
function sameKind(value: unknown, initial: unknown) {
  if (initial === null) return true
  if (value === null) return false
  if (Array.isArray(initial)) return Array.isArray(value)
  return typeof value === typeof initial
}

/** Uložená hodnota, alebo predvolená, ak nie je, je poškodená či iného druhu. */
export function readStored<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return initial
    const value = JSON.parse(raw) as unknown
    return sameKind(value, initial) ? (value as T) : initial
  } catch {
    return initial
  }
}

/** Ako useState, len hodnota prežije prechod medzi podstránkami a obnovenie stránky. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Bez úložiska (súkromné okno) sa zadanie len nezapamätá.
    }
  }, [key, value])
  return [value, setValue] as const
}

/** Zabudne celé uložené zadanie kalkulačky. */
export function clearStored() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX)) localStorage.removeItem(key)
  } catch {
    // nič
  }
}
