import { Heart, MapPin, MessageSquare, Share2, TrendingUp } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { feed, laneSegments } from '@/lib/data'

const typeLabel: Record<string, string> = {
  ride: 'Ride',
  flag: 'Lane flag',
  photo: 'Capture',
  badge: 'Achievement',
}

export default function FeedPage() {
  const trending = laneSegments
    .slice()
    .sort((a, b) => b.detections - a.detections)
    .slice(0, 4)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Community"
        title="Feed"
        description="What riders near you are logging, flagging, and capturing right now. Every post improves the map."
        actions={
          <Button className="rounded-none font-mono text-xs font-bold uppercase tracking-wide">
            Post update
          </Button>
        }
      />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Feed column */}
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          {feed.map((item) => {
            const initials = item.user
              .split(' ')
              .map((n) => n[0])
              .join('')
            return (
              <article
                key={item.id}
                className="border-b border-border px-5 py-5 transition-colors hover:bg-card/60 md:px-8"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center border border-border font-mono text-sm font-bold text-primary-foreground"
                    style={{ background: item.avatarColor }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-sm text-foreground">
                        {item.user}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        @{item.handle} · {item.time}
                      </span>
                      <span className="ml-auto border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                        {typeLabel[item.type]}
                      </span>
                    </div>

                    <h2 className="mt-2 font-serif text-2xl leading-tight text-balance">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 max-w-2xl font-mono text-[13px] leading-relaxed text-muted-foreground text-pretty">
                      {item.body}
                    </p>

                    {item.stat ? (
                      <div className="mt-3 inline-flex items-center gap-2 border border-border bg-secondary/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {item.stat}
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center gap-5 font-mono text-[12px] text-muted-foreground">
                      <button className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                        <Heart className="size-4" />
                        {item.kudos}
                      </button>
                      <button className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                        <MessageSquare className="size-4" />
                        {item.comments}
                      </button>
                      <button className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                        <Share2 className="size-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Trending rail */}
        <aside className="bg-card/40">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Trending segments
            </h2>
          </div>
          {trending.map((seg, i) => (
            <div
              key={seg.id}
              className="flex items-center gap-3 border-b border-border px-5 py-3.5"
            >
              <span className="font-mono text-lg font-bold text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[13px] text-foreground">
                  {seg.name}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {seg.detections.toLocaleString()} detections
                </div>
              </div>
            </div>
          ))}

          <div className="px-5 py-5">
            <div className="border border-border bg-secondary/30 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Your week
              </div>
              <div className="mt-2 font-serif text-4xl leading-none text-primary">
                132 km
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                +437 detections contributed
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
