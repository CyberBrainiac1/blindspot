"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { weekly } from "@/lib/data"

const distanceConfig = {
  km: { label: "Distance (km)", color: "var(--primary)" },
} satisfies ChartConfig

const detectionsConfig = {
  detections: { label: "Detections", color: "var(--lane-good)" },
} satisfies ChartConfig

export function DistanceChart() {
  return (
    <ChartContainer config={distanceConfig} className="h-[240px] w-full">
      <BarChart accessibilityLayer data={weekly} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="font-mono text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="font-mono text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="km" fill="var(--color-km)" radius={0} />
      </BarChart>
    </ChartContainer>
  )
}

export function DetectionsChart() {
  return (
    <ChartContainer config={detectionsConfig} className="h-[240px] w-full">
      <AreaChart accessibilityLayer data={weekly} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="font-mono text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="font-mono text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillDetections" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-detections)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-detections)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          dataKey="detections"
          type="step"
          fill="url(#fillDetections)"
          stroke="var(--color-detections)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
