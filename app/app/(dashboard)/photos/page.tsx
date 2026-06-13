import Image from 'next/image'
import { Camera, MapPin } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { laneGradeMeta, ridePhotos } from '@/lib/data'
import { cn } from '@/lib/utils'

const gradeDot: Record<string, string> = {
  good: 'bg-lane-good',
  ok: 'bg-lane-ok',
  bad: 'bg-lane-bad',
}

export default function PhotosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="My riding"
        title="Ride captures"
        description="Hit the big button on the bike computer to shoot the road without stopping. Every frame is geotagged and graded automatically."
      />

      <div className="flex items-center gap-2 border-b border-border px-5 py-3 md:px-8">
        <Camera className="size-4 text-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {ridePhotos.length} captures · hands-free
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ridePhotos.map((photo, i) => (
          <figure
            key={photo.id}
            className={cn(
              'group relative aspect-[4/3] overflow-hidden border-border',
              'border-b',
              i % 3 !== 2 && 'lg:border-r',
              i % 2 === 0 && 'sm:border-r lg:border-r',
            )}
          >
            <Image
              src={`/photos/${photo.id}.png`}
              alt={`Ride capture at ${photo.location}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

            <div className="absolute left-3 top-3 flex items-center gap-1.5 border border-border bg-background/85 px-2 py-1 backdrop-blur">
              <span className={cn('size-2', gradeDot[photo.grade])} />
              <span className="font-mono text-[10px] uppercase tracking-wide text-foreground">
                {laneGradeMeta[photo.grade].label}
              </span>
            </div>

            <figcaption className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                <MapPin className="size-3.5 text-primary" />
                {photo.location}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {photo.ride}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
