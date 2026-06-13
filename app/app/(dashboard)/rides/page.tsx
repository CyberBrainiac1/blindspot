import { Camera, Clock, Mountain, Radar, Route } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { rides } from '@/lib/data'
import { cn } from '@/lib/utils'

function scoreColor(score: number) {
  if (score >= 80) return 'text-lane-good'
  if (score >= 65) return 'text-lane-ok'
  return 'text-lane-bad'
}

export default function RidesPage() {
  const totals = rides.reduce(
    (acc, r) => {
      acc.km += r.distanceKm
      acc.min += r.durationMin
      acc.det += r.detections
      acc.photos += r.photos
      return acc
    },
    { km: 0, min: 0, det: 0, photos: 0 },
  )

  const summary = [
    { label: 'Total distance', value: `${totals.km.toFixed(1)} km`, icon: Route },
    { label: 'Moving time', value: `${Math.round(totals.min / 60)}h ${totals.min % 60}m`, icon: Clock },
    { label: 'Detections', value: totals.det.toLocaleString(), icon: Radar },
    { label: 'Captures', value: String(totals.photos), icon: Camera },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="My riding"
        title="Rides"
        description="Every ride is tracked offline on the device, then synced with the lane data you collected along the way."
        actions={
          <Button className="rounded-none font-mono text-xs font-bold uppercase tracking-wide">
            Sync device
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 border-b border-border md:grid-cols-4">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'flex flex-col gap-2 border-border p-5',
              i < 3 && 'border-r',
              i < 2 && 'border-b md:border-b-0',
            )}
          >
            <s.icon className="size-4 text-primary" />
            <span className="font-serif text-3xl leading-none text-foreground">
              {s.value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Ride list */}
      <div className="flex-1">
        {rides.map((ride) => (
          <article
            key={ride.id}
            className="group flex flex-col gap-4 border-b border-border px-5 py-5 transition-colors hover:bg-card/60 md:flex-row md:items-center md:px-8"
          >
            <div className="flex items-center gap-4 md:w-72 md:shrink-0">
              <div className="flex size-12 shrink-0 flex-col items-center justify-center border border-border bg-secondary/40 font-mono leading-none">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {ride.date.split(' ')[0]}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {ride.date.split(' ')[1]}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-xl leading-tight text-balance">
                  {ride.title}
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Ride #{ride.id.replace('r-', '')}
                </span>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-5">
              {[
                { l: 'Distance', v: `${ride.distanceKm} km` },
                { l: 'Time', v: `${ride.durationMin}m` },
                { l: 'Elev', v: `${ride.elevationM} m`, icon: Mountain },
                { l: 'Avg', v: `${ride.avgSpeed} kph` },
                { l: 'Captures', v: `${ride.photos}` },
              ].map((m) => (
                <div key={m.l}>
                  <div className="font-mono text-sm text-foreground">{m.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {m.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 md:w-28 md:shrink-0 md:flex-col md:items-end">
              <span
                className={cn(
                  'font-serif text-4xl leading-none',
                  scoreColor(ride.laneScore),
                )}
              >
                {ride.laneScore}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Lane score
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
