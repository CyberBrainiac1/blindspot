import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border px-6 py-5 last:border-b-0">
      <div className="space-y-1">
        <p className="font-mono text-sm text-foreground">{title}</p>
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Section({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-border">
      <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-baseline md:gap-10">
        <div className="md:w-56 md:shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            {label}
          </span>
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
        </div>
        <div className="flex-1 border border-border">{children}</div>
      </div>
    </section>
  )
}

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, privacy, and how your rides contribute to the crowdsourced lane network."
        actions={
          <Button className="rounded-none font-mono text-xs font-bold uppercase tracking-wide">
            Save changes
          </Button>
        }
      />

      <Section label="Profile" title="Rider identity">
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
          <div className="space-y-2 bg-card px-6 py-5">
            <Label htmlFor="name" className="font-mono text-[11px] uppercase tracking-wide">
              Display name
            </Label>
            <Input id="name" defaultValue="Alex Rivera" className="rounded-none font-mono" />
          </div>
          <div className="space-y-2 bg-card px-6 py-5">
            <Label htmlFor="handle" className="font-mono text-[11px] uppercase tracking-wide">
              Handle
            </Label>
            <Input id="handle" defaultValue="rider" className="rounded-none font-mono" />
          </div>
          <div className="space-y-2 bg-card px-6 py-5">
            <Label htmlFor="city" className="font-mono text-[11px] uppercase tracking-wide">
              Home city
            </Label>
            <Input id="city" defaultValue="Portland, OR" className="rounded-none font-mono" />
          </div>
          <div className="space-y-2 bg-card px-6 py-5">
            <Label htmlFor="units" className="font-mono text-[11px] uppercase tracking-wide">
              Units
            </Label>
            <Select defaultValue="km">
              <SelectTrigger id="units" className="rounded-none font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none font-mono">
                <SelectItem value="km">Kilometers</SelectItem>
                <SelectItem value="mi">Miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section label="Privacy" title="Data & sharing">
        <SettingRow
          title="Share lane data with the network"
          description="Contribute anonymized detections so other riders can avoid bad lanes."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          title="Public ride feed"
          description="Show your rides and captures on the community feed."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          title="Private start/end zones"
          description="Hide a 250m radius around your home and work on shared maps."
        >
          <Switch defaultChecked />
        </SettingRow>
      </Section>

      <Section label="Detection" title="Capture behavior">
        <SettingRow
          title="Auto-detect lane markings"
          description="Run the on-device model continuously while recording."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          title="Hazard sensitivity"
          description="How aggressively the device flags degraded infrastructure."
        >
          <Select defaultValue="balanced">
            <SelectTrigger className="w-36 rounded-none font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none font-mono">
              <SelectItem value="relaxed">Relaxed</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="strict">Strict</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          title="Capture button haptics"
          description="Buzz the module to confirm a photo was taken."
        >
          <Switch defaultChecked />
        </SettingRow>
      </Section>
    </div>
  )
}
