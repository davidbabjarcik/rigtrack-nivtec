import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/button'
import { Field, SelectField } from '@/components/field'
import { ACCESSORY_BASES, BASIS_LABELS, DEFAULT_STAGE_CONFIG, newDeckId, PROFILE_LABELS, PROFILES, stageConfigSchema, type Profile, type StageConfig } from './model'
import { PartIcon, type PartKind } from './PartIcon'

function NumberField({ label, value, step = 1, onChange }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return (
    <Field
      label={label}
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      value={Number.isFinite(value) ? value : ''}
      onChange={(event) => onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))}
    />
  )
}

function Block({ icon, title, hint, children }: { icon: PartKind; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border bg-surface p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-medium">
        <PartIcon kind={icon} className="size-6" />
        {title}
      </legend>
      {hint && <p className="mb-3 text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" aria-label={label} onClick={onClick}>
      <Trash2 className="size-4" aria-hidden />
    </Button>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="self-start" onClick={onClick}>
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  )
}

/** Zmení jeden prvok zoznamu v nastavení. */
const patchAt = <T,>(list: T[], index: number, patch: Partial<T>) => list.map((item, i) => (i === index ? { ...item, ...patch } : item))

/** Nastavenie pódiového systému Nivtec: diely, nohy, plachty, zábradlia, výstuhy, schody a príslušenstvo. */
export function Settings({ initial, note, onSave }: { initial: StageConfig; note: string; onSave: (config: StageConfig) => Promise<boolean> }) {
  const [config, setConfig] = useState(initial)
  const [saved, setSaved] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true)
    setSaved(await onSave(stageConfigSchema.parse(config)))
    setSaving(false)
  }
  const set = (patch: Partial<StageConfig>) => {
    setSaved(null)
    setConfig((current) => ({ ...current, ...patch }))
  }
  const parsed = stageConfigSchema.safeParse(config)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Upravte rozmery a diely podľa toho, čo máte na sklade. {note}</p>
      <Field label="Názov systému" value={config.name} maxLength={60} onChange={(event) => set({ name: event.target.value })} />

      <Block
        icon="deck"
        title="Dosky"
        hint="Prvá obdĺžniková doska je hlavná, menšie dopĺňajú zvyšok (rozmery po 0,5 m). Trojuholníky sa do obdĺžnika neskladajú, v kalkulačke sa pridávajú ručne. Nohy = koľko nôh potrebuje doska, keď stojí samostatne."
      >
        {config.decks.map((deck, index) => (
          <div key={deck.id} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_4.5rem_4.5rem_4rem_auto_auto]">
            <Field label="Názov" value={deck.label} maxLength={60} onChange={(event) => set({ decks: patchAt(config.decks, index, { label: event.target.value }) })} />
            <NumberField label="Dĺžka (m)" step={0.5} value={deck.widthM} onChange={(widthM) => set({ decks: patchAt(config.decks, index, { widthM }) })} />
            <NumberField label="Šírka (m)" step={0.5} value={deck.depthM} onChange={(depthM) => set({ decks: patchAt(config.decks, index, { depthM }) })} />
            <NumberField label="Nohy" value={deck.legs} onChange={(legs) => set({ decks: patchAt(config.decks, index, { legs }) })} />
            <label className="flex h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={deck.triangle}
                onChange={(event) => set({ decks: patchAt(config.decks, index, { triangle: event.target.checked, legs: event.target.checked ? 3 : 4 }) })}
              />
              trojuholník
            </label>
            <RemoveButton label={`Odobrať ${deck.label}`} onClick={() => set({ decks: config.decks.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton
          label="Pridať dosku"
          onClick={() => set({ decks: [...config.decks, { id: newDeckId(config.decks), label: '', widthM: 1, depthM: 1, triangle: false, legs: 4, equipmentId: '' }] })}
        />
      </Block>

      <Block
        icon="lath"
        title="Lišty"
        hint="Pero je vzadu a vpravo, drážka vpredu a vľavo. Lišta ide vždy na jednu dosku: na hranu 2 m lišta 2 m alebo dve 1 m, ale 2 m lišta nejde cez dve 1 m dosky."
      >
        {config.laths.map((lath, index) => (
          <div key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[8rem_5rem_1fr_auto]">
            <SelectField label="Profil" value={lath.profile} onChange={(event) => set({ laths: patchAt(config.laths, index, { profile: event.target.value as Profile }) })}>
              {PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {PROFILE_LABELS[profile]}
                </option>
              ))}
            </SelectField>
            <NumberField label="Dĺžka (m)" step={0.5} value={lath.lengthM} onChange={(lengthM) => set({ laths: patchAt(config.laths, index, { lengthM }) })} />
            <Field label="Názov" value={lath.label} maxLength={60} onChange={(event) => set({ laths: patchAt(config.laths, index, { label: event.target.value }) })} />
            <RemoveButton label={`Odobrať ${lath.label}`} onClick={() => set({ laths: config.laths.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton label="Pridať lištu" onClick={() => set({ laths: [...config.laths, { profile: 'groove', lengthM: 1, label: '', equipmentId: '' }] })} />
      </Block>

      <Block icon="leg" title="Nohy" hint="Výška = výsledná výška pódia (alebo stupňa schodov) s touto nohou. Schody potrebujú nohy 20, 40, 60… cm.">
        {config.legs.map((leg, index) => (
          <div key={index} className="grid grid-cols-[6rem_auto] justify-start items-end gap-2">
            <NumberField label="Výška (cm)" value={leg.heightCm} onChange={(heightCm) => set({ legs: patchAt(config.legs, index, { heightCm }) })} />
            <RemoveButton label={`Odobrať nohu ${leg.heightCm} cm`} onClick={() => set({ legs: config.legs.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton label="Pridať nohu" onClick={() => set({ legs: [...config.legs, { heightCm: Number.NaN, equipmentId: '' }] })} />
      </Block>

      <Block icon="skirt" title="Plachty" hint="Kryje = dĺžka hrany, na ktorú plachta je (2 m alebo 1 m). Výška 0 = hodí sa na každú výšku.">
        {config.skirts.map((skirt, index) => (
          <div key={index} className="grid grid-cols-[5rem_5rem_auto] justify-start items-end gap-2">
            <NumberField label="Kryje (m)" step={0.5} value={skirt.coversM} onChange={(coversM) => set({ skirts: patchAt(config.skirts, index, { coversM }) })} />
            <NumberField label="Výška (cm)" value={skirt.heightCm} onChange={(heightCm) => set({ skirts: patchAt(config.skirts, index, { heightCm }) })} />
            <RemoveButton label={`Odobrať plachtu ${skirt.coversM} m`} onClick={() => set({ skirts: config.skirts.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton label="Pridať plachtu" onClick={() => set({ skirts: [...config.skirts, { coversM: Number.NaN, heightCm: 0, equipmentId: '' }] })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Štipcov (lístkov) na meter plachty" step={0.5} value={config.skirtClip.perMeter} onChange={(perMeter) => set({ skirtClip: { ...config.skirtClip, perMeter } })} />
        </div>
      </Block>

      <Block icon="railing" title="Zábradlie" hint="Napr. 185 × 100 kryje hranu 2 m, 85 × 100 kryje 1 m. Spojky a podložky sú nižšie v príslušenstve.">
        {config.railings.map((railing, index) => (
          <div key={index} className="grid grid-cols-[5rem_1fr_auto] items-end gap-2">
            <NumberField label="Kryje (m)" step={0.5} value={railing.coversM} onChange={(coversM) => set({ railings: patchAt(config.railings, index, { coversM }) })} />
            <Field label="Rozmer" value={railing.label} maxLength={40} onChange={(event) => set({ railings: patchAt(config.railings, index, { label: event.target.value }) })} />
            <RemoveButton label={`Odobrať zábradlie ${railing.label}`} onClick={() => set({ railings: config.railings.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton label="Pridať zábradlie" onClick={() => set({ railings: [...config.railings, { coversM: Number.NaN, label: '', equipmentId: '' }] })} />
      </Block>

      <Block icon="diagonal" title="Výstuhy (vrtule)" hint="Diagonály podľa dĺžky poľa (2 m alebo 1 m) a rozsahu výšky pódia. Dávajú sa do polí po obvode pódia.">
        {config.diagonals.map((diagonal, index) => (
          <div key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[5rem_5rem_5rem_1fr_auto]">
            <NumberField label="Pole (m)" step={0.5} value={diagonal.fieldM} onChange={(fieldM) => set({ diagonals: patchAt(config.diagonals, index, { fieldM }) })} />
            <NumberField label="Od (cm)" value={diagonal.minHeightCm} onChange={(minHeightCm) => set({ diagonals: patchAt(config.diagonals, index, { minHeightCm }) })} />
            <NumberField label="Do (cm)" value={diagonal.maxHeightCm} onChange={(maxHeightCm) => set({ diagonals: patchAt(config.diagonals, index, { maxHeightCm }) })} />
            <Field label="Názov" value={diagonal.label} maxLength={60} onChange={(event) => set({ diagonals: patchAt(config.diagonals, index, { label: event.target.value }) })} />
            <RemoveButton label={`Odobrať výstuhu ${diagonal.label}`} onClick={() => set({ diagonals: config.diagonals.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton
          label="Pridať výstuhu"
          onClick={() => set({ diagonals: [...config.diagonals, { fieldM: 2, minHeightCm: 80, maxHeightCm: 100, label: '', equipmentId: '' }] })}
        />
        <NumberField label="Výstuha do každého N-tého poľa po obvode" value={config.diagonalEvery} onChange={(diagonalEvery) => set({ diagonalEvery })} />
      </Block>

      <Block icon="stairs" title="Schody" hint="Každý stupeň je jedna doska (napr. 1 × 0,5 m), o 20 cm vyšší ako predošlý. Prvý stojí na 4 nohách 20 cm, ďalšie na 2 nohách svojej výšky a 2 schodiskových nohách.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Stupeň z dosky" value={config.stairs.stepDeckId} onChange={(event) => set({ stairs: { ...config.stairs, stepDeckId: event.target.value } })}>
            {config.decks
              .filter((deck) => !deck.triangle)
              .map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.label || `${deck.widthM} × ${deck.depthM} m`}
                </option>
              ))}
          </SelectField>
          <NumberField
            label="Spojok na jedny schody"
            value={config.stairs.connector.perStairs}
            onChange={(perStairs) => set({ stairs: { ...config.stairs, connector: { ...config.stairs.connector, perStairs } } })}
          />
        </div>
      </Block>

      <Block icon="accessory" title="Príslušenstvo" hint="Drobnosti, ktoré sa rátajú podľa niečoho iného: napr. 2 čapové spojky na každý diel zábradlia.">
        {config.accessories.map((accessory, index) => (
          <div key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_5rem_10rem_auto]">
            <Field label="Názov" value={accessory.label} maxLength={80} onChange={(event) => set({ accessories: patchAt(config.accessories, index, { label: event.target.value }) })} />
            <NumberField label="Počet" step={0.5} value={accessory.quantity} onChange={(quantity) => set({ accessories: patchAt(config.accessories, index, { quantity }) })} />
            <SelectField
              label="Ráta sa"
              value={accessory.basis}
              onChange={(event) => set({ accessories: patchAt(config.accessories, index, { basis: event.target.value as (typeof ACCESSORY_BASES)[number] }) })}
            >
              {ACCESSORY_BASES.map((basis) => (
                <option key={basis} value={basis}>
                  {BASIS_LABELS[basis]}
                </option>
              ))}
            </SelectField>
            <RemoveButton label={`Odobrať ${accessory.label}`} onClick={() => set({ accessories: config.accessories.filter((_, i) => i !== index) })} />
          </div>
        ))}
        <AddButton label="Pridať príslušenstvo" onClick={() => set({ accessories: [...config.accessories, { label: '', basis: 'railing', quantity: 1, equipmentId: '' }] })} />
      </Block>

      {!parsed.success && <p className="text-sm text-destructive">Skontrolujte políčka: všetky čísla musia byť vyplnené a príslušenstvo musí mať názov.</p>}
      {saved === true && <p role="status" className="text-sm text-muted-foreground">Uložené.</p>}
      {saved === false && (
        <p role="alert" className="text-sm text-destructive">
          Uloženie zlyhalo. Skontrolujte pripojenie, prípadne či prehliadač povoľuje ukladanie (súkromné okno).
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={!parsed.success || saving} onClick={() => void save()}>
          {saving ? 'Ukladám…' : 'Uložiť nastavenie'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm('Vrátiť nastavenie na predvolené hodnoty Nivtec?')) set(DEFAULT_STAGE_CONFIG)
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          Predvolené
        </Button>
      </div>
    </div>
  )
}
