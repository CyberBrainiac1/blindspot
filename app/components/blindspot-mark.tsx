import { cn } from '@/lib/utils'

export function BlindspotMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn('size-7', className)}
      aria-hidden="true"
    >
      {/* outer bracket — the field of view */}
      <path
        d="M3 9V3h6M29 9V3h-6M3 23v6h6M29 23v6h-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
      {/* the blind spot — an offset eye */}
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  )
}
