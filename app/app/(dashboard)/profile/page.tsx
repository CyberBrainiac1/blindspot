import { Award, Camera, MapPin, Radar, Route } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { rides } from "@/lib/data"
import { cn } from "@/lib/utils"

const badges = [
  { name: "Cartographer", detail: "50 segments mapped" },
  { name: "Early Riser", detail: "20 dawn rides" },
  { name: "Hazard Hunter", detail: "100 lanes flagged" },
  { name: "Century", detail: "100 km in a day" },
]

export default function ProfilePage() {
  const totalKm = rides.reduce((a, r) => a + r.distanceKm, 0)
  const totalDet = rides.reduce((a, r) => a + r.detections, 0)
  const totalPhotos = rides.reduce((a, r) => a + r.photos, 0)

  const stats = [
    { label: "Lifetime distance", value: "1,488 km", icon: Route },
    { label: "Lane detections", value: "11,890", icon: Radar },
    { label: "Segments mapped", value: "207", icon: MapPin },
    { label: "Captures", value: "642", icon: Camera },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader eyebrow="Account" title="Profile" />

      {/* Identity banner */}
      <div className="flex flex-col gap-5 border-b border-border px-6 py-8 sm:flex-row sm:items-center md:px-8">
        <span className="flex size-20 shrink-0 items-center justify-center border border-border bg-primary font-serif text-4xl text-primary-foreground">
          R
        </span>
        <div className="space-y-1">
          <h2 className="font-serif text-3xl leading-none">Alex Rivera</h2>
          <p className="font-mono text-[12px] text-muted-foreground">
            @rider · Portland, OR · joined 2024
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Rank #5 · 11,890 pts
          </p>
        </div>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col gap-2 border-border p-5",
              "border-r",
              i < 2 && "border-b lg:border-b-0",
              (i === 1 || i === 3) && "border-r-0 lg:border-r",
              i === 3 && "lg:border-r-0",
            )}
          >
            <s.icon className="size-4 text-primary" />
            <span className="font-serif text-3xl leading-none">{s.value}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Badges */}
      <section className="p-6 md:p-8">
        <div className="mb-5 flex items-center gap-2">
          <Award className="size-4 text-primary" />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Badges earned
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div key={b.name} className="flex flex-col gap-1 bg-card p-5">
              <span className="font-serif text-xl">{b.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {b.detail}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
