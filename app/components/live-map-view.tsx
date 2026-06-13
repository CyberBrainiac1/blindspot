'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Layers } from 'lucide-react'

import { laneGradeMeta, laneSegments } from '@/lib/data'
import { cn } from '@/lib/utils'

const LaneMap = dynamic(() => import('@/components/lane-map'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-card">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Loading lane data…
      </span>
    </div>
  ),
})

const gradeDot: Record<string, string> = {
  good: 'bg-lane-good',
  ok: 'bg-lane-ok',
  bad: 'bg-lane-bad',
}

export function LiveMapView() {
  const [selectedId, setSelectedId] = useState<string | null>('seg-03')

  const counts = useMemo(() => {
    return laneSegments.reduce(
      (acc, s) => {
        acc[s.grade] += 1
        return acc
      },
      { good: 0, ok: 0, bad: 0 } as Record<string, number>,
    )
  }, [])

  const selected = laneSegments.find((s) => s.id === selectedId)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
      {/* Map */}
      <div className="relative min-h-[420px] border-b border-border lg:border-b-0 lg:border-r">
        <LaneMap selectedId={selectedId} onSelect={setSelectedId} />

        {/* Legend overlay */}
        <div className="pointer-events-none absolute left-4 top-4 z-[500] border border-border bg-background/90 p-3 backdrop-blur">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Layers className="size-3" />
            Lane quality
          </div>
          <div className="flex flex-col gap-1.5">
            {(['good', 'ok', 'bad'] as const).map((g) => (
              <div key={g} className="flex items-center gap-2">
                <span className={cn('size-2.5', gradeDot[g])} />
                <span className="font-mono text-[11px] text-foreground">
                  {laneGradeMeta[g].label}
                </span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {counts[g]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live counter overlay */}
        <div className="absolute bottom-4 left-4 z-[500] border border-border bg-background/90 px-3 py-2 font-mono backdrop-blur">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Network detections today
          </div>
          <div className="text-xl font-bold text-primary">+ 38,412</div>
        </div>
      </div>

      {/* Segment inspector */}
      <aside className="flex min-h-0 flex-col bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Mapped segments
          </h2>
        </div>

        {selected ? (
          <div className="border-b border-border bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className={cn('size-2.5', gradeDot[selected.grade])} />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
                {laneGradeMeta[selected.grade].label}
              </span>
            </div>
            <h3 className="mt-2 font-serif text-2xl leading-tight">
              {selected.name}
            </h3>
            <p className="mt-1 font-mono text-[12px] leading-relaxed text-muted-foreground">
              {selected.note}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-mono text-[11px]">
              <span className="text-muted-foreground">
                {selected.detections.toLocaleString()} detections
              </span>
              <button className="inline-flex items-center gap-1 text-primary transition-colors hover:text-foreground">
                Route here <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {laneSegments.map((seg) => (
            <button
              key={seg.id}
              onClick={() => setSelectedId(seg.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                selectedId === seg.id && 'bg-secondary/60',
              )}
            >
              <span className={cn('size-2.5 shrink-0', gradeDot[seg.grade])} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[13px] text-foreground">
                  {seg.name}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {laneGradeMeta[seg.grade].label} ·{' '}
                  {seg.detections.toLocaleString()} hits
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
