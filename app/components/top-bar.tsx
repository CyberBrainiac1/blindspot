'use client'

import { Camera, Circle, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur md:px-4">
      <SidebarTrigger className="size-9 rounded-none border border-border" />

      <div className="ml-1 hidden items-center gap-2 border border-border px-3 py-1.5 sm:flex">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Device online · syncing
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden rounded-none border-border font-mono text-xs uppercase tracking-wide sm:inline-flex"
        >
          <Search className="size-4" />
          Search segments
        </Button>
        <Button
          size="sm"
          className="rounded-none font-mono text-xs font-bold uppercase tracking-wide"
        >
          <Circle className="size-3.5 fill-current" />
          <span className="hidden sm:inline">Start ride</span>
          <Camera className="size-4 sm:hidden" />
        </Button>
      </div>
    </header>
  )
}
