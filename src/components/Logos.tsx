import { cn } from '@/lib/utils'

/** Logá: RigTrack (aplikácia, z ktorej kalkulačka pochádza) a JEF Production. */
export function Logos({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <img src="./logos/rigtrack.svg" alt="RigTrack" className={cn('size-10 rounded-xl', className)} />
      <img src="./logos/jef-tile.png" alt="JEF Production" className={cn('size-10 rounded-xl', className)} />
    </div>
  )
}
