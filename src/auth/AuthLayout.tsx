import type { ReactNode } from 'react'
import { Credits } from '@/components/Credits'
import { DevNotice } from '@/components/DevNotice'
import { Logos } from '@/components/Logos'
import { ThemeToggle } from '@/components/ThemeToggle'

/** Rámec pre prihlásenie a ďalšie obrazovky pred vstupom do aplikácie. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <Logos className="size-16" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nivtec kalkulačka pódia</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
      <main className="rounded-2xl border bg-surface p-5 shadow-sm">{children}</main>
      <DevNotice />
      <Credits className="mt-auto border-t pt-4" />
    </div>
  )
}
