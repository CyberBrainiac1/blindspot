'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { leaderboard, type Rider } from '@/lib/data'
import { cn } from '@/lib/utils'

type Metric = 'detections' | 'km' | 'segments'

const metricMeta: Record<Metric, { label: string; unit: string }> = {
  detections: { label: 'Detections', unit: '' },
  km: { label: 'Distance', unit: 'km' },
  segments: { label: 'Segments', unit: '' },
}

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<Metric>('detections')

  const sorted = [...leaderboard].sort((a, b) => b[metric] - a[metric])
  const max = sorted[0][metric]
  const podium = sorted.slice(0, 3)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Community"
        title="Leaderboard"
        description="Riders ranked by their contribution to the network this month. Detections route everyone."
        actions={
          <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <TabsList className="rounded-none border border-border bg-transparent p-0">
              {(Object.keys(metricMeta) as Metric[]).map((m) => (
                <TabsTrigger
                  key={m}
                  value={m}
                  className="rounded-none border-0 font-mono text-[11px] uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {metricMeta[m].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {/* Podium */}
      <div className="grid grid-cols-1 border-b border-border sm:grid-cols-3">
        {podium.map((rider, i) => (
          <div
            key={rider.handle}
            className={cn(
              'flex flex-col gap-3 border-border p-5 md:p-6',
              i < 2 && 'border-b sm:border-b-0 sm:border-r',
              i === 0 && 'bg-primary/10',
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-5xl leading-none text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {metricMeta[metric].label}
              </span>
            </div>
            <div>
              <div className="font-mono text-sm text-foreground">
                {rider.name}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                @{rider.handle}
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">
              {rider[metric].toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {metricMeta[metric].unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full ranking */}
      <div className="flex-1">
        <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:px-8">
          <span>Rank</span>
          <span>Rider</span>
          <span>{metricMeta[metric].label}</span>
        </div>
        {sorted.map((rider: Rider, i) => (
          <div
            key={rider.handle}
            className={cn(
              'grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 md:px-8',
              rider.you && 'bg-primary/10',
            )}
          >
            <span className="font-mono text-base font-bold text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-xs font-bold text-foreground">
                {rider.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div className="min-w-0">
                <div className="truncate font-mono text-[13px] text-foreground">
                  {rider.name}
                  {rider.you ? (
                    <span className="ml-2 border border-primary px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                      You
                    </span>
                  ) : null}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  @{rider.handle}
                </div>
              </div>
            </div>
            <div className="flex w-32 items-center gap-2 sm:w-48">
              <div className="hidden h-1.5 flex-1 bg-secondary sm:block">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(rider[metric] / max) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono text-[13px] text-foreground">
                {rider[metric].toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
