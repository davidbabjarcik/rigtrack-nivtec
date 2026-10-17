import { useEffect, useState } from 'react'

// Podstránky cez #/…: GitHub Pages nevie neznámu cestu presmerovať na index.html,
// adresa za # sa na server neposiela, takže odkaz na podstránku funguje vždy.

export type Route = 'calculator' | 'settings' | 'nivtec'

const PATHS: Record<Route, string> = { calculator: '#/', settings: '#/nastavenie', nivtec: '#/nivtec' }

/** Podstránka z adresy; čokoľvek neznáme (aj tokeny z e-mailových odkazov Supabase) je kalkulačka. */
export function parseRoute(hash: string): Route {
  if (hash.startsWith('#/nastavenie')) return 'settings'
  if (hash.startsWith('#/nivtec')) return 'nivtec'
  return 'calculator'
}

export const routeHref = (route: Route) => PATHS[route]

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route
}
