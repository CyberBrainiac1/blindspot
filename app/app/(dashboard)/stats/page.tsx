import { Activity, Radar, Route, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { DetectionsChart, DistanceChart } from "@/components/stats-charts"
import { rides, weekly } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function StatsPage() {
  const weekKm = weekly.reduce((a, w) => a + w.km, 0)
  const weekDet = weekly.reduce((a, w) => a + w.detections, 0)
  const avgScore = Math.round(
    rides.reduce((a, r) => a + r.laneScore, 0) / rides.length,
  )

  const headline = [
    { label: "This week", value: `${weekKm.toFixed(1)} km`, sub: "+12% vs last", icon: Route },
    { label: "Detections", value: weekDet.toLocaleString(), sub: "lane data points", icon: Radar },
    { label: "Avg lane score", value: String(avgScore), sub: "across all rides", icon: TrendingUp },
    { label: "Active days", value: `${weekly.filter((w) => w.km > 0).length}/7`, sub: "this week", icon: Activity },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="My riding"
        title="Stats"
        description="Your personal trends, side by side with the lane data your rides contribute to the network."
      />

      <div className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
        {headline.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col gap-2 border-border p-5",
              "border-r",
              i < 2 && "border-b lg:border-b-0",
              i === 3 && "border-r-0",
              i === 1 && "lg:border-r",
              i === 1 && "border-r-0",
            )}
          >
            <s.icon className="size-4 text-primary" />
            <span className="font-serif text-3xl leading-none">{s.value}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="border-b border-border p-5 lg:border-b-0 lg:border-r md:p-8">
          <div className="mb-6 space-y-1">
            <h2 className="font-serif text-2xl">Distance by day</h2>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Kilometers ridden · last 7 days
            </p>
          </div>
          <DistanceChart />
        </section>

        <section className="p-5 md:p-8">
          <div className="mb-6 space-y-1">
            <h2 className="font-serif text-2xl">Lane detections</h2>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Data points captured · last 7 days
            </p>
          </div>
          <DetectionsChart />
        </section>
      </div>
    </div>
  )
}
