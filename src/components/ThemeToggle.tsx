import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Svetlý režim' : 'Tmavý režim'
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="flex size-10 items-center justify-center rounded-lg border bg-surface hover:bg-muted">
      {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </button>
  )
}
