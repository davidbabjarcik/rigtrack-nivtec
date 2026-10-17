import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('parseRoute', () => {
  it('rozozná podstránky', () => {
    expect(parseRoute('#/nastavenie')).toBe('settings')
    expect(parseRoute('#/nivtec')).toBe('nivtec')
    expect(parseRoute('#/')).toBe('calculator')
    expect(parseRoute('')).toBe('calculator')
  })

  it('tokeny z e-mailového odkazu vedú na kalkulačku', () => {
    expect(parseRoute('#access_token=abc&type=recovery')).toBe('calculator')
  })
})
