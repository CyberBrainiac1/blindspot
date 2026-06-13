import { Battery, Camera, Cpu, HardDrive, MapPin, Radio, Wifi } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const telemetry = [
  { label: "Battery", value: "78%", icon: Battery, detail: "≈ 9h 20m left" },
  { label: "GPS lock", value: "Strong", icon: MapPin, detail: "11 satellites" },
  { label: "Firmware", value: "v2.4.1", icon: Cpu, detail: "Up to date" },
  { label: "Signal", value: "BLE", icon: Radio, detail: "Paired · phone" },
]

export default function DevicePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Hardware"
        title="Device"
        description="Your blindspot module rides on the handlebars, detecting lane markings offline and capturing photos at the press of one big button."
        actions={
          <Button
            variant="outline"
            className="rounded-none border-border font-mono text-xs font-bold uppercase tracking-wide"
          >
            Sync now
          </Button>
        }
      />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Module visual */}
        <section className="flex flex-col items-center justify-center gap-8 border-b border-border bg-card/40 p-8 lg:border-b-0 lg:border-r">
          <div className="flex w-full max-w-xs flex-col gap-4 border border-border bg-background p-5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>blindspot</span>
              <span className="flex items-center gap-1 text-lane-good">
                <span className="size-1.5 rounded-full bg-lane-good" />
                Recording
              </span>
            </div>

            {/* mini screen */}
            <div className="flex flex-col gap-1 border border-border bg-secondary/40 p-4">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                Distance
              </span>
              <span className="font-serif text-4xl leading-none">12.4</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                km · 38:12 · 20.1 kph
              </span>
            </div>

            {/* the big capture button */}
            <button
              type="button"
              className="group flex aspect-square w-full flex-col items-center justify-center gap-2 border-2 border-primary bg-primary text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Camera className="size-10" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
                Capture
              </span>
            </button>
            <p className="text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              One press · no phone · no stopping
            </p>
          </div>
        </section>

        {/* Telemetry + storage */}
        <section className="flex flex-col">
          <div className="grid grid-cols-2 border-b border-border">
            {telemetry.map((t, i) => (
              <div
                key={t.label}
                className={cn(
                  "flex flex-col gap-2 border-border p-5",
                  i % 2 === 0 && "border-r",
                  i < 2 && "border-b",
                )}
              >
                <t.icon className="size-4 text-primary" />
                <span className="font-serif text-2xl leading-none">{t.value}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t.label}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  {t.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wide">
                <span className="flex items-center gap-2 text-foreground">
                  <HardDrive className="size-4 text-primary" /> Onboard storage
                </span>
                <span className="text-muted-foreground">24.8 / 64 GB</span>
              </div>
              <Progress value={39} className="h-2 rounded-none" />
              <p className="font-mono text-[11px] text-muted-foreground">
                412 captures pending sync · 2,140 lane detections buffered offline.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wide">
                <span className="flex items-center gap-2 text-foreground">
                  <Wifi className="size-4 text-primary" /> Auto-sync over Wi-Fi
                </span>
                <span className="text-lane-good">On</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                Rides upload automatically when you get home. Lane data is shared anonymously with the network.
              </p>
            </div>

            <Button className="w-full rounded-none font-mono text-xs font-bold uppercase tracking-wide">
              Upload 412 captures
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
