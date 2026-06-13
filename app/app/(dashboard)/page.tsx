import { LiveMapView } from '@/components/live-map-view'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

export default function LiveMapPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        eyebrow="Crowdsourced network"
        title="Live lane map"
        description="Every blindspot device reads road lines, sharrows, and lane paint, then scores each segment. Avoid the worst lanes, stick to the best ones."
        actions={
          <Button
            variant="outline"
            className="rounded-none border-border font-mono text-xs uppercase tracking-wide"
          >
            Plan a route
          </Button>
        }
      />
      <LiveMapView />
    </div>
  )
}
