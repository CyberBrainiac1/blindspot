import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
      <div className="space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </span>
        <h1 className="font-serif text-4xl leading-none tracking-tight text-balance md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl font-mono text-[13px] leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
