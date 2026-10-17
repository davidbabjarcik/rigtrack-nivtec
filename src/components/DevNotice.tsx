import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Upozornenie, že ide o časť RigTracku, ktorý je vo vývoji. */
export function DevNotice({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 rounded-xl border border-violet-400/50 bg-violet-100/60 p-3 text-sm dark:bg-violet-950/40 print:hidden', className)}>
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
      <span>
        <strong>Časť budúcej aplikácie RigTrack, ktorá je vo vývoji.</strong> RigTrack bude evidovať techniku, kufre, výpožičky, servis a eventy; táto kalkulačka je z neho
        vytiahnutá ako samostatná časť. Výsledok si pred stavbou skontrolujte.
      </span>
    </p>
  )
}
