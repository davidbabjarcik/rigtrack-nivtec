import { describe, expect, it } from 'vitest'
import { authMessage } from './messages'

describe('authMessage', () => {
  it('prekladá bežné chyby', () => {
    expect(authMessage({ message: 'Invalid login credentials' })).toBe('Nesprávny e-mail alebo heslo.')
    expect(authMessage({ message: 'Database error saving new user' })).toMatch(/pozvánku/)
    expect(authMessage({ code: 'user_already_exists', message: 'User already registered' })).toMatch(/už existuje/)
  })

  it('neznámu chybu nevypíše surovo', () => {
    expect(authMessage({ message: 'xyz' })).toBe('Niečo sa nepodarilo. Skúste to znova.')
  })
})
