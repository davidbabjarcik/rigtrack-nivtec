// Posledná chyba v aplikácii (výnimka alebo nespracovaný Promise), aby sa dala
// pripojiť k hláseniu chyby. Drží sa len v pamäti, nikam sa sama neposiela.

let last: { message: string; at: string } | null = null

const remember = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : JSON.stringify(reason)
  last = { message: (message ?? 'neznáma chyba').slice(0, 500), at: new Date().toISOString() }
}

/** Začne zaznamenávať chyby; volá sa raz pri štarte. */
export function watchErrors() {
  window.addEventListener('error', (event) => remember(event.error ?? event.message))
  window.addEventListener('unhandledrejection', (event) => remember(event.reason))
}

export const lastError = () => last
