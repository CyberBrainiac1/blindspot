'use client'

import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'

import { laneSegments, mapCenter, type LaneGrade } from '@/lib/data'

const gradeColor: Record<LaneGrade, string> = {
  good: '#34c27a',
  ok: '#e3ad3c',
  bad: '#e34529',
}

export default function LaneMap({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      scrollWheelZoom
      className="size-full bg-background"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {laneSegments.map((seg) => {
        const color = gradeColor[seg.grade]
        const active = selectedId === seg.id
        return (
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{
              color,
              weight: active ? 8 : 5,
              opacity: active ? 1 : 0.78,
            }}
            eventHandlers={{ click: () => onSelect(seg.id) }}
          >
            <Tooltip sticky className="blindspot-tip">
              <span className="font-mono text-xs">
                {seg.name} · {seg.detections.toLocaleString()} detections
              </span>
            </Tooltip>
          </Polyline>
        )
      })}
      {laneSegments.map((seg) => {
        const active = selectedId === seg.id
        if (!active) return null
        return seg.path.map((pt, i) => (
          <CircleMarker
            key={`${seg.id}-${i}`}
            center={pt}
            radius={6}
            pathOptions={{
              color: gradeColor[seg.grade],
              fillColor: '#15110f',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        ))
      })}
    </MapContainer>
  )
}
