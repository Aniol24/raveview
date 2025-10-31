"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, Play } from "lucide-react"
import type { DjSet } from "@/types"
import { PlatformBadge } from "@/components/platform-badge"
import { formatDuration, niceMonth, getThumbnailUrl } from "@/lib/platform"
import { useSoundCloudThumb } from "@/hooks/use-soundcloud-thumb"
import { cn } from "@/lib/utils"

export function SetMasonryItem(props: DjSet) {
  const {
    id,
    title,
    artist,
    platform,
    url,
    durationSec,
    uploadedAt,
    rating,
    reviewCount,
    thumbnailUrl,
  } = props

  const ytThumb = getThumbnailUrl({ platform, url, thumbnailUrl })
  const { thumb: scThumb } = useSoundCloudThumb(
    platform === "soundcloud" && !thumbnailUrl ? url : undefined
  )

  const finalThumb =
    thumbnailUrl ??
    (platform === "youtube" ? ytThumb : platform === "soundcloud" ? scThumb : undefined)

  const aspect =
    platform === "youtube" ? "15 / 9" :
    platform === "soundcloud" ? "1 / 1" : "1 / 1"

  return (
    <article className="relative overflow-hidden rounded-2xl border shadow-sm bg-card group">
      {/* Imagen */}
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {finalThumb ? (
          <Image
            src={finalThumb}
            alt={`${title} – ${artist}`}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              "group-hover:blur-sm group-hover:scale-105"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted">
            <Play className="h-8 w-8" />
          </div>
        )}

        
        <div className="absolute right-17 bottom-2 z-20">
          <PlatformBadge platform={platform} className="backdrop-blur bg-background/60" />
        </div>

        {durationSec ? (
          <div className="absolute bottom-3 right-2 z-20 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(durationSec)}
          </div>
        ) : null}

        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-4 text-white z-10",
            "bg-gradient-to-t from-black/80 via-black/50 to-transparent",
            "opacity-0 translate-y-4 transition-all duration-300 ease-out",
            "group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          <h3
            className={cn(
              "font-semibold leading-snug drop-shadow",
              platform === "youtube" ? "text-[0.95rem]" : "text-base"
            )}
          >
            <Link href={`/set/${id}`} className="hover:underline">
              {title}
            </Link>
          </h3>

          <p
            className={cn(
              "mt-1 opacity-90",
              platform === "youtube" ? "text-[0.825rem]" : "text-sm"
            )}
          >
            {artist}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-80">
            {uploadedAt ? <span>{niceMonth(uploadedAt)}</span> : null}
            {typeof rating === "number" ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" /> {rating.toFixed(1)}
                {reviewCount ? ` (${reviewCount})` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
