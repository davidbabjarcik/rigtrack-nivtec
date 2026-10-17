import { useState } from 'react'

// Svetlý / tmavý režim: predvolene podľa zariadenia, prepínač v hlavičke to prebije a pamätá sa v prehliadači.
// Rovnakú logiku má krátky skript v index.html, aby stránka pri načítaní nebliklo.

export type Theme = 'light' | 'dark'
const KEY = 'nivtec:theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0b1120' : '#f8fafc')
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Bez úložiska (súkromné okno) sa voľba len nezapamätá.
    }
    setTheme(next)
  }
  return { theme, toggle }
}
