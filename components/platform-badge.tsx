import type { Platform } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        platform === "youtube" && "border-red-500/30 text-red-500",
        platform === "soundcloud" && "border-orange-500/30 text-orange-500",
        className
      )}
      aria-label={platform}
    >
      {platform === "youtube" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41 41 0 0 0 0 12a41 41 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41 41 0 0 0 24 12a41 41 0 0 0-.5-5.8ZM9.75 15.5v-7l6 3.5Z"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.5 10a4.5 4.5 0 0 0-8.9-1.4V18H19a3 3 0 0 0 0-6h-1.5zM2 10.5H4V18H2zm2.5-1H6V18H4.5zm2-.7H8V18H6.5zm2-.6H10V18H8.5z"
          />
        </svg>
      )}
      <span className="capitalize">{platform}</span>
    </span>
  )
}
