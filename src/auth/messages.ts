/** Chyby zo Supabase po slovensky; neznáme sa zobrazia všeobecne. */
export function authMessage(error: { message?: string; code?: string } | null | undefined): string {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) return 'Nesprávny e-mail alebo heslo.'
  if (text.includes('email not confirmed') || text.includes('email_not_confirmed')) return 'E-mail ešte nie je potvrdený. Kliknite na odkaz v e-maile od Supabase.'
  // Databáza odmietne registráciu e-mailu, ktorý nie je v skupine.
  if (text.includes('database error saving new user') || text.includes('pozvánku') || text.includes('unexpected_failure'))
    return 'Tento e-mail nemá pozvánku do skupiny. Požiadajte admina, aby vás pridal.'
  if (text.includes('already registered') || text.includes('user_already_exists')) return 'Účet s týmto e-mailom už existuje. Prihláste sa.'
  if (text.includes('signup') && text.includes('disabled')) return 'Registrácia je v Supabase vypnutá. Admin ju musí zapnúť (Authentication → Sign In / Providers).'
  if (text.includes('password') && (text.includes('least') || text.includes('weak') || text.includes('short'))) return 'Heslo je príliš slabé, použite aspoň 8 znakov.'
  if (text.includes('rate limit') || text.includes('too many')) return 'Príliš veľa pokusov. Skúste to o chvíľu.'
  if (text.includes('fetch') || text.includes('network')) return 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie.'
  return 'Niečo sa nepodarilo. Skúste to znova.'
}
