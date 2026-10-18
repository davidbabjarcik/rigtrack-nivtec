import { beforeEach, describe, expect, it } from 'vitest'
import { clearStored, readStored } from './useStored'

// Testy bežia v Node bez prehliadača; stačí jednoduché úložisko v pamäti.
const memory = new Map<string, string>()
const fake = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
}
Object.defineProperty(globalThis, 'localStorage', { value: new Proxy(fake, { ownKeys: () => [...memory.keys()], getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) }), configurable: true })

beforeEach(() => memory.clear())

describe('zapamätané zadanie kalkulačky', () => {
  it('vráti uloženú hodnotu', () => {
    memory.set('nivtec:calc:v1:width', '8.5')
    memory.set('nivtec:calc:v1:stairs', '[{"side":"front","positionM":1}]')
    expect(readStored('width', 6)).toBe(8.5)
    expect(readStored('stairs', [])).toEqual([{ side: 'front', positionM: 1 }])
  })

  it('poškodenú alebo inú hodnotu ignoruje', () => {
    memory.set('nivtec:calc:v1:width', 'zlé')
    memory.set('nivtec:calc:v1:stairs', '"text"')
    memory.set('nivtec:calc:v1:risers', 'null')
    expect(readStored('width', 6)).toBe(6)
    expect(readStored('stairs', [])).toEqual([])
    expect(readStored('risers', [])).toEqual([])
  })

  it('nové pódium zabudne len zadanie kalkulačky', () => {
    memory.set('nivtec:calc:v1:width', '8')
    memory.set('nivtec:theme', 'dark')
    clearStored()
    expect([...memory.keys()]).toEqual(['nivtec:theme'])
  })
})
